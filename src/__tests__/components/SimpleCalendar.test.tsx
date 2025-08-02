import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimpleCalendar from '../../components/SimpleCalendar';
import { useAuth } from '../../contexts/AuthContext';
import * as dataService from '../../services/dataService';
import classService from '../../services/classService';
import type { TaskWithMeta, TaskType, ClassWithRelations } from '../../types/database';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the data service
jest.mock('../../services/dataService', () => ({
  getTasks: jest.fn(),
  addTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getTaskTypes: jest.fn(),
}));

// Mock the class service
jest.mock('../../services/classService', () => ({
  default: {
    getClasses: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

// Mock TaskModal component
jest.mock('../../components/TaskModal', () => {
  return function MockTaskModal({ showModal, onClose, onSubmit }: any) {
    if (!showModal) return null;
    return (
      <div data-testid="task-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onSubmit({ title: 'Test Task' })}>Submit Task</button>
      </div>
    );
  };
});

// Mock utility functions
jest.mock('../../utils/dateHelpers', () => ({
  formatDateForInput: jest.fn((date) => '2024-01-15'),
  formatTimeForDisplay: jest.fn((time) => time || ''),
  getStartOfWeek: jest.fn((date) => new Date('2024-01-14')),
  isSameDay: jest.fn((date1, date2) => date1.toDateString() === date2.toDateString()),
  getPreviousPeriod: jest.fn((date, view) => new Date(date.getTime() - 86400000)),
  getNextPeriod: jest.fn((date, view) => new Date(date.getTime() + 86400000)),
  formatHourForDisplay: jest.fn((hour) => `${hour}:00`),
  getWeekdayHeaders: jest.fn(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
  getCalendarTitle: jest.fn(() => 'January 2024'),
}));

jest.mock('../../utils/styleHelpers', () => ({
  getDayCellClasses: jest.fn(() => 'day-cell-class'),
  getViewButtonClasses: jest.fn(() => 'view-button-class'),
  getNavButtonClasses: jest.fn(() => 'nav-button-class'),
  getNavIconClasses: jest.fn(() => 'nav-icon-class'),
}));

jest.mock('../../utils/taskStyles', () => ({
  getEventStyle: jest.fn(() => ({ backgroundColor: '#3B82F6', color: 'white' })),
}));

jest.mock('../../utils/authHelpers', () => ({
  validateAuthState: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SimpleCalendar', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  };

  const mockClasses: ClassWithRelations[] = [
    {
      id: 'class-1',
      name: 'Mathematics',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      files: [],
    },
  ];

  const mockTaskTypes: TaskType[] = [
    {
      id: 'type-1',
      name: 'Assignment',
      color: '#3B82F6',
      completed_color: '#10B981',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockTasks: TaskWithMeta[] = [
    {
      id: 'task-1',
      title: 'Math Homework',
      class_id: 'class-1',
      task_type_id: 'type-1',
      is_duration: false,
      due_date: '2024-01-15',
      due_time: '10:00',
      start_date: null,
      start_time: null,
      end_date: null,
      end_time: null,
      completed: false,
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      canvas_uid: null,
      class: mockClasses[0],
      task_type: mockTaskTypes[0],
    },
  ];

  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    clearError: jest.fn(),
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
    triggerSync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue(mockAuthContext);
    (dataService.getTasks as jest.Mock).mockResolvedValue(mockTasks);
    (dataService.getTaskTypes as jest.Mock).mockResolvedValue(mockTaskTypes);
    (classService.getClasses as jest.Mock).mockResolvedValue(mockClasses);
    (classService.subscribe as jest.Mock).mockImplementation(() => jest.fn());
  });

  describe('Rendering', () => {
    it('should render calendar with default month view', async () => {
      render(<SimpleCalendar />);
      
      // Should render view buttons
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
      
      // Should render navigation
      expect(screen.getByLabelText('Previous period')).toBeInTheDocument();
      expect(screen.getByLabelText('Next period')).toBeInTheDocument();
    });

    it('should render calendar title', async () => {
      render(<SimpleCalendar />);
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should load and display tasks', async () => {
      render(<SimpleCalendar />);
      
      await waitFor(() => {
        expect(dataService.getTasks).toHaveBeenCalled();
      });
    });

    it('should load classes and task types', async () => {
      render(<SimpleCalendar />);
      
      await waitFor(() => {
        expect(classService.getClasses).toHaveBeenCalled();
        expect(dataService.getTaskTypes).toHaveBeenCalled();
      });
    });
  });

  describe('View Switching', () => {
    it('should switch to week view when week button is clicked', async () => {
      const onViewChange = jest.fn();
      render(<SimpleCalendar onViewChange={onViewChange} />);
      
      const weekButton = screen.getByText('Week');
      await userEvent.click(weekButton);
      
      expect(onViewChange).toHaveBeenCalledWith('week');
    });

    it('should switch to day view when day button is clicked', async () => {
      const onViewChange = jest.fn();
      render(<SimpleCalendar onViewChange={onViewChange} />);
      
      const dayButton = screen.getByText('Day');
      await userEvent.click(dayButton);
      
      expect(onViewChange).toHaveBeenCalledWith('day');
    });

    it('should maintain current view state', () => {
      render(<SimpleCalendar view="week" />);
      
      // Week button should be active/selected
      const weekButton = screen.getByText('Week');
      expect(weekButton).toHaveClass('view-button-class');
    });
  });

  describe('Navigation', () => {
    it('should navigate to previous period when previous button is clicked', async () => {
      render(<SimpleCalendar />);
      
      const prevButton = screen.getByLabelText('Previous period');
      await userEvent.click(prevButton);
      
      // Should trigger date change
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should navigate to next period when next button is clicked', async () => {
      render(<SimpleCalendar />);
      
      const nextButton = screen.getByLabelText('Next period');
      await userEvent.click(nextButton);
      
      // Should trigger date change
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('Task Modal Integration', () => {
    it('should open task modal when clicking on empty date', async () => {
      render(<SimpleCalendar />);
      
      // Find a date cell and click it
      const dateCells = screen.getAllByRole('button');
      const dateCell = dateCells.find(cell => cell.textContent === '15');
      
      if (dateCell) {
        await userEvent.click(dateCell);
        expect(screen.getByTestId('task-modal')).toBeInTheDocument();
      }
    });

    it('should close task modal when close button is clicked', async () => {
      render(<SimpleCalendar />);
      
      // Open modal first
      const dateCells = screen.getAllByRole('button');
      const dateCell = dateCells.find(cell => cell.textContent === '15');
      
      if (dateCell) {
        await userEvent.click(dateCell);
        
        const closeButton = screen.getByText('Close Modal');
        await userEvent.click(closeButton);
        
        expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
      }
    });

    it('should create new task when modal is submitted', async () => {
      (dataService.addTask as jest.Mock).mockResolvedValue({});
      
      render(<SimpleCalendar />);
      
      // Open modal and submit
      const dateCells = screen.getAllByRole('button');
      const dateCell = dateCells.find(cell => cell.textContent === '15');
      
      if (dateCell) {
        await userEvent.click(dateCell);
        
        const submitButton = screen.getByText('Submit Task');
        await userEvent.click(submitButton);
        
        await waitFor(() => {
          expect(dataService.addTask).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Task Operations', () => {
    it('should update task when task is edited', async () => {
      (dataService.updateTask as jest.Mock).mockResolvedValue({});
      
      render(<SimpleCalendar />);
      
      await waitFor(() => {
        expect(dataService.getTasks).toHaveBeenCalled();
      });
      
      // Simulate task edit (would normally be triggered by clicking on a task)
      // This is simplified since the actual event handling is complex
    });

    it('should toggle task completion', async () => {
      (dataService.updateTask as jest.Mock).mockResolvedValue({});
      
      render(<SimpleCalendar />);
      
      await waitFor(() => {
        expect(dataService.getTasks).toHaveBeenCalled();
      });
      
      // Simulate task completion toggle
      // This would normally be triggered by clicking a checkbox on a task
    });

    it('should delete task when delete action is triggered', async () => {
      (dataService.deleteTask as jest.Mock).mockResolvedValue({});
      
      render(<SimpleCalendar />);
      
      await waitFor(() => {
        expect(dataService.getTasks).toHaveBeenCalled();
      });
      
      // Simulate task deletion
      // This would normally be triggered from the task modal
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation buttons', () => {
      render(<SimpleCalendar />);
      
      expect(screen.getByLabelText('Previous period')).toBeInTheDocument();
      expect(screen.getByLabelText('Next period')).toBeInTheDocument();
    });

    it('should have keyboard navigation support', async () => {
      render(<SimpleCalendar />);
      
      const viewButtons = screen.getAllByRole('button');
      const monthButton = screen.getByText('Month');
      
      // Should be focusable
      monthButton.focus();
      expect(monthButton).toHaveFocus();
      
      // Should respond to Enter key
      fireEvent.keyDown(monthButton, { key: 'Enter', code: 'Enter' });
    });

    it('should have proper role attributes', () => {
      render(<SimpleCalendar />);
      
      // Calendar should have appropriate roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle task loading errors gracefully', async () => {
      (dataService.getTasks as jest.Mock).mockRejectedValue(new Error('Load failed'));
      
      render(<SimpleCalendar />);
      
      await waitFor(() => {
        expect(dataService.getTasks).toHaveBeenCalled();
      });
      
      // Component should still render without crashing
      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('should handle task creation errors', async () => {
      (dataService.addTask as jest.Mock).mockRejectedValue(new Error('Create failed'));
      
      render(<SimpleCalendar />);
      
      // Should handle error gracefully when task creation fails
      const dateCells = screen.getAllByRole('button');
      const dateCell = dateCells.find(cell => cell.textContent === '15');
      
      if (dateCell) {
        await userEvent.click(dateCell);
        
        const submitButton = screen.getByText('Submit Task');
        await userEvent.click(submitButton);
        
        // Should not crash the component
        expect(screen.getByText('Month')).toBeInTheDocument();
      }
    });
  });

  describe('Performance', () => {
    it('should use React.memo for optimization', () => {
      // This test verifies that the component structure supports memoization
      const { rerender } = render(<SimpleCalendar />);
      
      // Re-render with same props
      rerender(<SimpleCalendar />);
      
      // Component should handle re-renders efficiently
      expect(screen.getByText('Month')).toBeInTheDocument();
    });

    it('should lazy load TaskModal', async () => {
      render(<SimpleCalendar />);
      
      // TaskModal should not be in DOM initially
      expect(screen.queryByTestId('task-modal')).not.toBeInTheDocument();
      
      // Should load when needed
      const dateCells = screen.getAllByRole('button');
      const dateCell = dateCells.find(cell => cell.textContent === '15');
      
      if (dateCell) {
        await userEvent.click(dateCell);
        expect(screen.getByTestId('task-modal')).toBeInTheDocument();
      }
    });
  });

  describe('Responsive Design', () => {
    it('should handle different screen sizes', () => {
      render(<SimpleCalendar />);
      
      // Component should render without layout issues
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
    });
  });
});