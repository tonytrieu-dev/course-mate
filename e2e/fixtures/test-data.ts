// Test data fixtures for E2E tests

export const TestUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }
};

export const TestTasks = {
  basicTask: {
    title: 'Complete Assignment 1',
    description: 'Math homework due tomorrow',
    dueDate: '2025-12-31'
  },
  urgentTask: {
    title: 'Study for Exam',
    description: 'Computer Science midterm exam',
    dueDate: '2025-08-15',
    priority: 'high'
  },
  projectTask: {
    title: 'Final Project',
    description: 'Capstone project presentation',
    dueDate: '2025-12-01',
    class: 'Computer Science',
    type: 'Project'
  }
};

export const TestClasses = {
  computerScience: {
    name: 'Computer Science',
    code: 'CS-101',
    color: '#3B82F6'
  },
  mathematics: {
    name: 'Mathematics',
    code: 'MATH-201',
    color: '#10B981'
  },
  physics: {
    name: 'Physics',
    code: 'PHYS-301',
    color: '#8B5CF6'
  }
};

export const TestCanvasUrls = {
  valid: 'https://canvas.example.edu/feeds/calendars/user_12345.ics',
  invalid: 'not-a-url',
  nonExistent: 'https://nonexistent.canvas.edu/feed.ics'
};

export const TestGrades = {
  assignment1: {
    name: 'Assignment 1',
    grade: 95,
    totalPoints: 100,
    class: 'Computer Science',
    category: 'Homework'
  },
  midtermExam: {
    name: 'Midterm Exam',
    grade: 87,
    totalPoints: 100,
    class: 'Mathematics',
    category: 'Exams'
  }
};

export const SampleICSData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test Calendar//EN
BEGIN:VEVENT
UID:test-event-1@example.com
DTSTART:20251201T140000Z
DTEND:20251201T150000Z
SUMMARY:Test Assignment Due
DESCRIPTION:Sample Canvas assignment for testing
LOCATION:Online
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

export const Selectors = {
  // Common UI selectors
  navigation: {
    dashboard: 'button:has-text("Dashboard"), button:has-text("D")',
    tasks: 'button:has-text("Tasks"), button:has-text("T")',
    calendar: 'button:has-text("Calendar"), button:has-text("C")',
    grades: 'button:has-text("Grades"), button:has-text("G")'
  },
  
  // Modal selectors
  modal: '.modal, [role="dialog"]',
  modalClose: 'button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]',
  
  // Form selectors
  taskForm: {
    title: 'input[name="title"], input[placeholder*="title" i]',
    description: 'textarea[name="description"], textarea[placeholder*="description" i]',
    dueDate: 'input[type="date"], input[name="dueDate"]',
    save: 'button:has-text("Save"), button:has-text("Create"), button[type="submit"]'
  },
  
  // Canvas selectors
  canvas: {
    icsUrl: 'input[placeholder*="ICS"], input[placeholder*="URL"], input[name*="ics"]',
    sync: 'button:has-text("Sync"), button:has-text("Import"), button:has-text("Fetch")'
  },
  
  // Loading states
  loading: '.loading, .spinner, .syncing, [aria-label*="loading"]',
  
  // Error states
  error: '.error, .text-red-600, [role="alert"]',
  success: '.success, .text-green-600, text=success'
};

export const Timeouts = {
  short: 2000,      // For quick UI interactions
  medium: 10000,    // For modal opening, form submission
  long: 30000,      // For page loads, complex operations
  sync: 60000       // For Canvas sync operations
};

export const TestConfig = {
  // Test viewport sizes
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 }
  },
  
  // Accessibility requirements
  accessibility: {
    minTouchTarget: 44, // Minimum touch target size in pixels
    maxResponseTime: 100, // Maximum response time for interactions in ms
    requiredAriaLabels: ['button', 'input', 'select', 'textarea']
  },
  
  // Performance requirements
  performance: {
    maxLoadTime: 3000,     // Maximum page load time
    maxNavigationTime: 1000, // Maximum navigation time
    maxModalOpenTime: 500    // Maximum modal open time
  }
};

// Helper functions for test data
export const generateTestTask = (overrides: Partial<typeof TestTasks.basicTask> = {}) => ({
  ...TestTasks.basicTask,
  ...overrides,
  title: `${TestTasks.basicTask.title} ${Date.now()}` // Make title unique
});

export const generateTestClass = (overrides: Partial<typeof TestClasses.computerScience> = {}) => ({
  ...TestClasses.computerScience,
  ...overrides,
  name: `${TestClasses.computerScience.name} ${Date.now()}` // Make name unique
});

export const getRandomTestData = () => ({
  task: generateTestTask(),
  class: generateTestClass(),
  user: TestUsers.validUser
});