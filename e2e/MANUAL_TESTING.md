# Manual Testing Fallback Guide

This document provides manual testing procedures as a fallback when automated E2E tests cannot be run or need verification.

## Core User Workflows

### 1. Authentication Flow
**Objective**: Verify user can access the application

**Steps**:
1. Navigate to application URL
2. Verify landing page displays with "ScheduleBud" branding
3. Click "Get Started Free" button
4. Verify authentication form appears
5. Try submitting empty form → Should show validation errors
6. Enter invalid credentials → Should show error message
7. Enter valid test credentials → Should navigate to main app

**Expected Results**:
- Landing page loads within 3 seconds
- Form validation works correctly
- Error messages are user-friendly
- Successful authentication redirects to dashboard/calendar

---

### 2. Task Management
**Objective**: Verify complete task lifecycle

**Steps**:
1. Navigate to Tasks view
2. Click "Add Task" or similar button
3. Fill task form:
   - Title: "Test Manual Task"
   - Description: "Created during manual testing"
   - Due Date: Tomorrow's date
   - Class: Select any available class
4. Save task
5. Verify task appears in task list
6. Edit the task → Change title to "Edited Manual Task"
7. Mark task as completed
8. Delete the task

**Expected Results**:
- Task modal opens within 500ms
- All form fields work correctly
- Task saves and appears immediately
- Editing works without data loss
- Completion status updates visually
- Deletion removes task completely

---

### 3. Calendar Integration
**Objective**: Verify calendar displays and interacts with tasks

**Steps**:
1. Navigate to Calendar view
2. Test view switching:
   - Click "Month" view
   - Click "Week" view  
   - Click "Day" view
3. Navigate between time periods using arrow buttons
4. Click "Today" to return to current date
5. Create task from calendar:
   - Click on any calendar day
   - Fill task form if modal opens
   - Save task
6. Verify task appears on selected date
7. Click on task in calendar to edit

**Expected Results**:
- All calendar views load and display correctly
- Navigation between periods works smoothly
- Task creation from calendar works
- Tasks display on correct dates
- Task editing from calendar works

---

### 4. Canvas Integration
**Objective**: Verify Canvas LMS integration setup

**Steps**:
1. Navigate to Settings
2. Find Canvas Integration section
3. Enter test ICS URL: `https://canvas.example.edu/feeds/calendars/user_12345.ics`
4. Save settings
5. Attempt sync (will fail with test URL)
6. Verify error handling is graceful
7. Test class name format options
8. Test duplicate prevention settings

**Expected Results**:
- Canvas settings are clearly accessible
- URL validation works correctly
- Sync errors are handled gracefully
- Settings save and persist
- Help text is available and clear

---

## Edge Cases & Error Conditions

### Network Connectivity
**Test**: Disconnect internet during various operations
**Expected**: App continues to work offline, shows appropriate messages

### Large Data Sets
**Test**: Create 50+ tasks, navigate calendar with many events
**Expected**: App remains responsive, performance is acceptable

### Mobile/Responsive Testing
**Test**: Use mobile device or resize browser to mobile dimensions
**Expected**: All features work on mobile, touch targets are adequate (44px minimum)

---

## Accessibility Testing

### Keyboard Navigation
**Test**: Navigate entire app using only keyboard (Tab, Enter, Arrow keys)
**Expected**: All features accessible via keyboard, logical tab order

### Screen Reader
**Test**: Use screen reader software (NVDA, JAWS, VoiceOver)
**Expected**: All content readable, proper ARIA labels, semantic structure

### Color Contrast
**Test**: Check color contrast ratios, test with color blindness simulators
**Expected**: WCAG 2.1 AA compliance (4.5:1 ratio minimum)

---

## Performance Benchmarks

### Load Times
- **Initial page load**: < 3 seconds
- **Navigation between views**: < 1 second
- **Modal opening**: < 500ms
- **Form submission**: < 2 seconds

### Responsiveness
- **Clicking buttons**: Immediate visual feedback
- **Form typing**: No lag or delay
- **Calendar navigation**: Smooth animations

---

## Browser Compatibility

### Desktop Browsers
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Mobile Browsers
- iOS Safari
- Android Chrome
- Samsung Internet

**Test each browser**:
1. Complete one full task creation workflow
2. Test calendar navigation
3. Verify Canvas settings access
4. Check visual layout and functionality

---

## Critical Security Checks

### Data Protection
- Verify no sensitive data logged to console
- Check that authentication tokens are properly handled
- Ensure HTTPS is enforced
- Test session timeout behavior

### Input Validation
- Test SQL injection in all form fields
- Try XSS attacks in text areas
- Verify file upload restrictions (if applicable)
- Test URL validation in Canvas settings

---

## When to Use Manual Testing

### Primary Use Cases
1. **Automated tests fail**: When Playwright tests can't run due to environment issues
2. **New feature validation**: Before writing automated tests for new features
3. **User experience verification**: Things that are hard to automate (visual design, animations)
4. **Cross-browser testing**: When automated tests only run on one browser
5. **Accessibility validation**: Requires actual assistive technology testing

### Testing Frequency
- **Before each release**: Complete core workflows
- **Weekly**: Edge cases and performance checks
- **Monthly**: Full browser compatibility suite
- **Ad-hoc**: When bugs are reported or new features added

---

## Reporting Issues

When manual testing reveals issues:

1. **Document clearly**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots/screen recordings

2. **Categorize severity**:
   - **Critical**: App unusable, data loss
   - **High**: Core feature broken
   - **Medium**: Minor feature issues
   - **Low**: Cosmetic or edge case issues

3. **Verify**:
   - Can the issue be reproduced?
   - Does it affect multiple browsers?
   - Is it related to specific user data?

---

This manual testing guide ensures comprehensive coverage when automated testing is unavailable and provides a human verification layer for critical user experiences.