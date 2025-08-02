import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskModal from '../../components/TaskModal';
import type { TaskWithMeta, TaskType, ClassWithRelations } from '../../types/database';
import type { User } from '@supabase/supabase-js';

// Mock the custom hooks
jest.mock('../../hooks/useTaskForm', () => ({
  useTaskForm: () => ({
    task: {
      id: '',
      title: '',
      class: '',
      type: '',
      isDuration: false,
      dueDate: '2024-01-15',
      dueTime: '10:00',
      startDate: '2024-01-15',
      startTime: '09:00',
      endDate: '2024-01-15',
      endTime: '11:00',
      completed: false,
    },
    setTask: jest.fn(),
    handleInputChange: jest.fn(),
    modalDateDisplay: 'January 15, 2024',
    handleSubmit: jest.fn((e, onSubmit) => {
      e.preventDefault();
      onSubmit();
    }),
  }),
}));

jest.mock('../../hooks/useTaskManagement', () => ({
  useTaskManagement: () => ({
    showClassInput: false,
    setShowClassInput: jest.fn(),
    newClassName: '',
    setNewClassName: jest.fn(),
    handleAddClass: jest.fn(),
    showClassManagement: false,
    setShowClassManagement: jest.fn(),
    hoveredClassId: null,
    setHoveredClassId: jest.fn(),
    handleDeleteClass: jest.fn(),
    isAddingClass: false,
    isDeletingClass: false,
    showTypeInput: false,
    setShowTypeInput: jest.fn(),
    newTypeName: '',
    setNewTypeName: jest.fn(),
    newTypeColor: '#3B82F6',
    setNewTypeColor: jest.fn(),
    handleAddTaskType: jest.fn(),
    showTypeManagement: false,
    setShowTypeManagement: jest.fn(),
    hoveredTypeId: null,
    setHoveredTypeId: jest.fn(),
    editingTypeId: null,
    setEditingTypeId: jest.fn(),
    editingTypeColor: '',
    setEditingTypeColor: jest.fn(),
    editingTypeCompletedColor: '',
    setEditingTypeCompletedColor: jest.fn(),
    handleDeleteTaskType: jest.fn(),
    handleUpdateTaskType: jest.fn(),
  }),
}));

// Mock the sub-components
jest.mock('../../components/taskModal/TaskFormFields', () => {
  return function MockTaskFormFields({ titleInputRef }: any) {
    return (
      <div data-testid="task-form-fields">
        <input 
          ref={titleInputRef}
          data-testid="task-title-input" 
          placeholder="Task title"
        />
      </div>
    );
  };
});

jest.mock('../../components/taskModal/ClassManagement', () => {
  return function MockClassManagement() {
    return <div data-testid="class-management">Class Management</div>;
  };
});

jest.mock('../../components/taskModal/TaskTypeManagement', () => {
  return function MockTaskTypeManagement() {
    return <div data-testid="task-type-management">Task Type Management</div>;
  };
});

jest.mock('../../components/StudySessionTracker', () => ({
  StudySessionTracker: function MockStudySessionTracker() {
    return <div data-testid="study-session-tracker">Study Session Tracker</div>;
  },
}));

describe('TaskModal', () => {
  const mockUser: User = {
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

  const mockEditingTask: TaskWithMeta = {
    id: 'task-1',
    title: 'Test Task',
    class_id: 'class-1',
    task_type_id: 'type-1',
    is_duration: false,
    due_date: '2024-01-15',
    due_time: '10:00',
    start_date: '2024-01-15',
    start_time: '09:00',
    end_date: '2024-01-15',
    end_time: '11:00',
    completed: false,
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    canvas_uid: null,
    class: mockClasses[0],
    task_type: mockTaskTypes[0],
  };

  const defaultProps = {
    showModal: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    onDelete: jest.fn(),
    editingTask: null,
    selectedDate: new Date('2024-01-15'),
    classes: mockClasses,
    taskTypes: mockTaskTypes,
    isAuthenticated: false,
    setTaskTypes: jest.fn(),
    setClasses: jest.fn(),
    user: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when showModal is false', () => {
      render(<TaskModal {...defaultProps} showModal={false} />);
      expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
    });

    it('should render modal when showModal is true', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.getByText('Add Task')).toBeInTheDocument();
      expect(screen.getByText('Date: January 15, 2024')).toBeInTheDocument();
    });

    it('should render "Edit Task" title when editing', () => {
      render(<TaskModal {...defaultProps} editingTask={mockEditingTask} />);
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });

    it('should render all sub-components', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.getByTestId('task-form-fields')).toBeInTheDocument();
      expect(screen.getByTestId('class-management')).toBeInTheDocument();
      expect(screen.getByTestId('task-type-management')).toBeInTheDocument();
    });

    it('should render completed checkbox when editing task', () => {
      render(<TaskModal {...defaultProps} editingTask={mockEditingTask} />);
      expect(screen.getByLabelText('Mark as completed')).toBeInTheDocument();
    });

    it('should not render completed checkbox when creating new task', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.queryByLabelText('Mark as completed')).not.toBeInTheDocument();
    });

    it('should render study session tracker when authenticated', () => {
      render(<TaskModal {...defaultProps} isAuthenticated={true} user={mockUser} />);
      expect(screen.getByTestId('study-session-tracker')).toBeInTheDocument();
    });

    it('should not render study session tracker when not authenticated', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.queryByTestId('study-session-tracker')).not.toBeInTheDocument();
    });

    it('should render delete button when editing task', () => {
      render(<TaskModal {...defaultProps} editingTask={mockEditingTask} />);
      expect(screen.getByText('Delete Task')).toBeInTheDocument();
    });

    it('should not render delete button when creating new task', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should focus title input when modal opens', async () => {
      render(<TaskModal {...defaultProps} />);
      const titleInput = screen.getByTestId('task-title-input');
      
      await waitFor(() => {
        expect(titleInput).toHaveFocus();
      });
    });

    it('should have proper ARIA attributes', () => {
      render(<TaskModal {...defaultProps} />);
      const modal = screen.getByRole('dialog', { hidden: true });
      expect(modal).toBeInTheDocument();
    });

    it('should have accessible form elements', () => {
      render(<TaskModal {...defaultProps} editingTask={mockEditingTask} />);
      
      // Check checkbox has proper labeling
      const completedCheckbox = screen.getByLabelText('Mark as completed');
      expect(completedCheckbox).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const onClose = jest.fn();
      render(<TaskModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when Delete button is clicked', async () => {
      const onDelete = jest.fn();
      render(<TaskModal {...defaultProps} editingTask={mockEditingTask} onDelete={onDelete} />);
      
      const deleteButton = screen.getByText('Delete Task');
      await userEvent.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit when form is submitted', async () => {
      const onSubmit = jest.fn();
      render(<TaskModal {...defaultProps} onSubmit={onSubmit} />);
      
      const submitButton = screen.getByText('Add Task');
      await userEvent.click(submitButton);
      
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should close modal when clicking outside (backdrop)', async () => {
      const onClose = jest.fn();
      render(<TaskModal {...defaultProps} onClose={onClose} />);
      
      const backdrop = screen.getByTestId('modal-backdrop');
      await userEvent.click(backdrop);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for mobile', () => {
      render(<TaskModal {...defaultProps} />);
      const modalContainer = screen.getByRole('dialog', { hidden: true });
      
      expect(modalContainer).toHaveClass('max-w-sm', 'sm:max-w-lg');
    });

    it('should have proper button sizing for touch devices', () => {
      render(<TaskModal {...defaultProps} editingTask={mockEditingTask} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('min-h-[44px]', 'touch-manipulation');
      });
    });
  });

  describe('Button States', () => {
    it('should show "Add Task" button text when creating new task', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });

    it('should show "Update Task" button text when editing task', () => {
      render(<TaskModal {...defaultProps} editingTask={mockEditingTask} />);
      expect(screen.getByText('Update Task')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onDelete prop gracefully', () => {
      const { onDelete, ...propsWithoutDelete } = defaultProps;
      
      expect(() => {
        render(<TaskModal {...propsWithoutDelete} editingTask={mockEditingTask} />);
      }).not.toThrow();
      
      expect(screen.queryByText('Delete Task')).not.toBeInTheDocument();
    });

    it('should handle null selectedDate gracefully', () => {
      render(<TaskModal {...defaultProps} selectedDate={null} />);
      expect(screen.getByText('Date: January 15, 2024')).toBeInTheDocument();
    });
  });
});