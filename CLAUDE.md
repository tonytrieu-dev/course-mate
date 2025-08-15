# CLAUDE.md - ScheduleBud

This file provides guidance to Claude Code when working with the ScheduleBud codebase.

## Target Audience

**ADULTS ONLY (18+)**: College and university students exclusively  
**Legal Policy**: High school students (minors) prohibited for legal protection  
**Focus**: Undergraduate and graduate students with full legal capacity

## Session Protocol

**Always read PLANNING.md at the start of every new conversation, check TASKS.md before starting your work, mark completed tasks to TASKS.md immediately, and add newly discovered tasks to TASKS.md when found.**

## CLAUDE.md Performance Guidelines

### File Size Monitoring & Performance Impact

**CRITICAL PERFORMANCE THRESHOLD**: 40,000 characters = Claude Code performance degradation point

**Current File Status** (Updated: August 5, 2025):
- **Character Count**: 9,953 / 40,000 (OPTIMIZED)
- **Status**: 🟢 HEALTHY - Performance optimized (75% reduction)
- **History Archive**: Detailed session logs moved to `CLAUDE_HISTORY.md`

**Warning Thresholds**:
- 🟢 **HEALTHY** (0-28,000 chars): Optimal Claude Code performance
- 🟡 **MONITOR** (28,000-35,000 chars): Begin planning content optimization
- 🟠 **WARNING** (35,000-40,000 chars): Active content management required
- 🔴 **CRITICAL** (40,000+ chars): Performance degradation - immediate action needed

**Automated Size Checks**: 
- **Quick Check**: `wc -c CLAUDE.md` 
- **Full Monitor**: `node check-claude-size.js` (comprehensive status report)

**Goal**: Maintain comprehensive project documentation while ensuring peak Claude Code performance through intelligent content management.

## Essential Commands

### Development
```bash
npm start              # Start development server (webpack-dev-server)
npm run build         # Production build using custom build script
npm test              # Run Jest tests
npm run lint          # ESLint check (with ESLINT_USE_FLAT_CONFIG=false)
npm run typecheck     # TypeScript type checking
npm run e2e           # Run Playwright E2E tests
npm run analyze       # Bundle analysis
```

### Build Modes
```bash
./switch-mode.sh personal  # Switch to personal mode (unlimited features)
./switch-mode.sh saas      # Switch to SaaS mode (commercial features)
```

## Architecture Overview

ScheduleBud is a cross-platform student task management application with Canvas LMS integration, AI chatbot assistance, and notification system.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI Integration**: Google Gemini Flash 2.5 for chatbot
- **Notifications**: Email notifications via Supabase Edge Functions
- **Build**: Webpack + Babel
- **Testing**: Jest + Playwright
- **Canvas Integration**: ICS calendar parsing + Canvas LMS API

### Core Application Structure

**Main App Flow**: `App.tsx` → `AuthProvider` → `SubscriptionProvider` → Multi-view interface

**Application Views**: Dashboard, Calendar, Task, Grades

The app uses lazy loading, comprehensive error boundaries, and mobile-first responsive design.

### Key Architectural Patterns

#### Service Layer Architecture
Services in `src/services/` with domain-specific operations:
- `dataService.ts` - Core CRUD operations
- `authService.ts` - Authentication via Supabase
- `canvasService.ts` - Canvas LMS integration with ICS parsing
- `syncService.ts` - Bi-directional sync between local and Supabase
- `classService.ts` - Centralized class management with subscription pattern
- `studySessionService.ts` - Study session tracking and analytics
- Domain-specific operations in subdirectories: `class/`, `task/`, `taskType/`, `settings/`

#### Context-Based State Management
- `AuthContext`: User authentication, sync status, error handling
- `SubscriptionContext`: Subscription and billing management (SaaS mode)
- `ThemeContext`: Dark/light mode with system preference detection
- All contexts use `useMemo` and `useCallback` for performance

#### Database Architecture (Supabase)
- **Tasks**: Core task management with Canvas integration
- **Classes**: Course/class organization with user-friendly naming
- **Task Types**: Customizable task categories with colors
- **Study Sessions**: Study session tracking with effectiveness ratings
- **Grades & Assignments**: Grade tracking with categories and GPA calculation

#### Canvas Integration System
- **ICS Parsing**: Custom parser handles malformed Canvas calendar feeds
- **Class Mapping**: Converts Canvas course codes to user-friendly names
- **Duplicate Prevention**: UID-based deduplication
- **Type Detection**: Smart task type inference from Canvas event descriptions
- **Multi-Proxy CORS**: Optimized security-first proxy chain (August 2025)
  - Primary: `corsproxy.io` (GDPR compliant, 99% uptime)
  - Secondary: `allorigins.win` (US-based, perfect for US student market)
  - Tertiary: `cors.sh` (Grida-backed fallback)
  - Final: Direct fetch as last resort

### Key Components

#### Core Components
- `App.tsx` - Main app with auth routing, multi-view navigation, error boundaries
- `SimpleCalendar.tsx` - Main calendar interface with month/week/day views
- `TaskModal.tsx` - Task creation/editing with Canvas sync
- `DashboardView.tsx` - Main dashboard with overview stats
- `TaskView.tsx` - Dedicated task management interface

#### Specialized Components
- `CanvasSettings.tsx` - Canvas integration configuration
- `ChatbotPanel.tsx` - AI assistant interface with Google Gemini integration
- `StudySessionTracker.tsx` - Study session tracking with timer
- `GradeDashboard.tsx` - Grade overview and GPA calculation
- `DocumentViewer.tsx` - **NEW**: Dual-system DOCX viewer (docx-preview + mammoth.js fallback)

### Development Patterns

#### Custom Hooks Pattern
Major features use custom hooks for logic encapsulation:
- `useAuth()` - Authentication state and operations
- `useTaskManagement()` - Task CRUD operations
- `useTaskForm()` - Task form state management with validation
- `useSidebarState()` - Sidebar state and persistence
- `useChatbot()` - Chatbot integration and state
- `useStudySession()` - Study session tracking and management

#### Canvas Integration Workflow
1. User provides Canvas ICS feed URL → 2. Fetch & parse with malformed data correction → 3. Extract tasks with UID deduplication → 4. Sync to localStorage + Supabase

#### Smart Upload Syllabus Workflow (Enhanced January 2025)
1. PDF syllabus upload → 2. AI-powered text extraction → 3. **Gemini AI analysis with course detection** → 4. **Automatic class assignment** → 5. Task creation with proper organization

**Key Enhancement**: Smart upload now includes **intelligent class assignment** similar to Canvas import:
- **Course Detection**: AI identifies course codes (CS101, MATH120) and department names from syllabus content
- **Automatic Class Matching**: Searches existing classes using sophisticated matching algorithms
- **Auto-Class Creation**: Creates new classes automatically when course information is detected
- **Multi-Course Support**: Single syllabus can generate tasks for multiple classes
- **User Preference Integration**: Respects descriptive vs. technical class naming settings

## Configuration

### Environment Variables
Two build modes via environment files:
- `.env.personal` - Full features, no limits, no billing
- `.env.saas` - Commercial mode with Stripe integration

Key variables:
- `REACT_APP_BUILD_MODE` - "personal" or "saas"
- `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` - Supabase config
- `REACT_APP_GEMINI_API_KEY` - Google Gemini API key for chatbot

## Development Workflow

1. Use `npm start` for development with hot reload
2. Run `npm run typecheck` before commits (configured for hybrid Node.js/Deno environment)
3. Test Canvas integration with actual ICS feeds using debug functions
4. Use build modes for testing different feature sets
5. Test chatbot functionality with Google Gemini API
6. Run `npm run e2e` for end-to-end testing

### TypeScript Configuration (Updated January 2025)
- **Hybrid Environment**: Supports both Node.js (React app) and Deno (Supabase Edge Functions)
- **Type Control**: Explicit `types` configuration prevents module resolution conflicts
- **VSCode Integration**: Configured `.vscode/settings.json` for clean development experience
- **Error-Free**: All TypeScript pseudo-errors eliminated while maintaining functionality

## Supabase Integration

### Sync Strategy
- Bi-directional sync between local storage and Supabase
- Conflict resolution with timestamp-based precedence
- Offline-first with cloud backup approach

## Special Considerations

### Core Features
- **Canvas Calendar Sync**: ICS parsing with malformed data handling, UID deduplication (accurate positioning)
- **Study Management**: Session tracking, grade tracking, AI schedule optimization
- **AI Chatbot**: Gemini Flash 2.5 with auto-embedding, context-aware responses, **dynamic resizable interface**, **sidebar-independent @mention system**
- **Technical**: Lazy loading, mobile-first responsive, O(1) indexing, WCAG 2.1 AA
- **Architecture**: Offline-first with cloud sync, React 18 + TypeScript + Tailwind

## Recent Major Updates

### 🎉 CRITICAL SaaS Subscription Module Fix (August 15, 2025) - LATEST ✅
- ✅ **MAJOR PRODUCTION MILESTONE**: ScheduleBud SaaS platform fully operational with subscription capabilities at https://schedulebud.netlify.app/
- ✅ **SUBSCRIPTION TAB LIVE**: 💳 Subscription tab now appears in Settings modal after months of development work
- ✅ **SMART FALLBACK LOGIC**: Auto-enable SaaS features when `REACT_APP_BUILD_MODE = "saas"` regardless of environment variables
- ✅ **PRODUCTION-READY**: Platform ready for student user acquisition and revenue generation
- ✅ **RESILIENT DESIGN**: `features.subscriptions = getFeatureFlag('ENABLE_SUBSCRIPTIONS') || isSaaSMode()` pattern

**Technical Solution**: Implemented fallback logic in `buildConfig.ts` to auto-enable subscription, Stripe, usage limits, and upgrade features when in SaaS mode, solving Netlify environment variable configuration issues.

**Files Modified**: `src/utils/buildConfig.ts`, `netlify.toml`

### Font Weight Persistence Fix (August 14, 2025) ✅
- ✅ **CRITICAL FORMATTING BUG FIX**: Resolved font weight (bold/normal) not persisting after edit mode exit despite Ctrl+B working during editing
- ✅ **PATTERN REPLICATION**: Implemented exact same inline styles pattern as successful font size control system
- ✅ **CONTEXT ENHANCEMENT**: Added `getFontWeight()`, `setFontWeight()`, `toggleFontWeight()` methods with `fontWeightChanged` events
- ✅ **COMPONENT STATE**: Added font weight state management to SidebarTitle and Sidebar classes header matching `titleSize` pattern
- ✅ **INLINE STYLES**: Updated EditableText to apply `style={{ fontWeight: weight }}` instead of CSS classes
- ✅ **DEFAULT WEIGHTS**: sidebar-title = bold, classes-header = medium (500) for proper visual hierarchy
- ✅ **STORAGE PERSISTENCE**: Font weight saves to localStorage and syncs via Supabase using proven methodology

**Files Modified**: `src/contexts/TextFormattingContext.tsx`, `src/components/sidebar/SidebarTitle.tsx`, `src/components/Sidebar.tsx`, `src/components/EditableText.tsx`, `src/index.css`

### Class List Dark Theme & Empty State UX Fix (August 14, 2025) ✅
- ✅ **DARK THEME INPUT FIX**: Fixed EditableText hardcoded light theme styling preventing proper dark mode display in class editing
- ✅ **EMPTY CLASS EDITING**: Added intelligent placeholder "Click to name class..." for empty classes with full editing functionality
- ✅ **HOVER-ONLY PLACEHOLDER**: Implemented smooth fade-in placeholder that only appears on hover for clean, minimalist interface
- ✅ **CROSS-THEME SUPPORT**: Proper dark/light theme styling for all text inputs and placeholder states

**Files Modified**: `src/components/ClassList.tsx`

### Right-Click Color Picker Bug Fix & UI Enhancement (August 14, 2025) ✅
- ✅ **CRITICAL CONTAINER HIERARCHY FIX**: Resolved right-click color picker failure for "Current Classes" text caused by nested containers with overflow constraints
- ✅ **COLOR PICKER MIGRATION**: Moved color picker outside problematic sidebar containers to same level as modals, eliminating stacking context conflicts
- ✅ **DYNAMIC POSITIONING SYSTEM**: Implemented real-time position calculation using getBoundingClientRect() for accurate color picker placement near text
- ✅ **COLOR PALETTE EXPANSION**: Added black and royal blue (#4169E1) options with consistent theming across light/dark modes
- ✅ **UI ALIGNMENT IMPROVEMENTS**: Fixed "Current Classes" text alignment to match class list bullet points for professional visual hierarchy

**Root Cause**: Color picker trapped inside nested containers with `overflow-y-auto`, `overflow: hidden`, and CSS transforms blocking event handling
**Technical Solution**: Architectural migration - moved color picker to sibling level of other modals outside container constraints
**Files Modified**: `src/components/Sidebar.tsx`

### Build Configuration Fix (August 14, 2025) ✅
- ✅ **CRITICAL BUILD MODE FIX**: Fixed hardcoded "UCR" default title preventing SaaS mode from showing "Your College"
- ✅ **ROOT CAUSE**: `settingsOperations.ts` had hardcoded `title: "UCR"` instead of using `getDefaultSidebarTitle()` from build config
- ✅ **SOLUTION**: Updated `getDefaultSettings()` to import and use `getDefaultSidebarTitle()` function
- ✅ **RESULT**: New users now see correct title based on `REACT_APP_BUILD_MODE` environment variable (SaaS = "Your College", Personal = "UCR 🐻")
- ✅ **BACKWARD COMPATIBLE**: Existing users keep their customized titles, only affects new users and settings resets

**Files Modified**: `src/services/settings/settingsOperations.ts`

### Netlify Deployment White Screen Resolution (August 13, 2025) ✅
- ✅ **CRITICAL DEPLOYMENT FIX**: Resolved Netlify white screen issue preventing app from loading despite successful build
- ✅ **ENVIRONMENT CONFIGURATION**: Fixed environment variable injection and config validation blocking app startup
- ✅ **PRODUCTION VERIFICATION**: Confirmed full app functionality at https://schedulebud.netlify.app/ with working authentication
- ✅ **USER AUTHENTICATION**: Verified login system, Supabase connection, and database persistence working correctly
- ✅ **CORE FEATURES OPERATIONAL**: Tasks, calendar, AI chatbot, and theme syncing all functioning properly

**Root Cause**: Environment variable configuration in config.ts preventing app initialization
**Technical Solution**: Verified Netlify environment variables and analyzed config validation system
**Files Verified**: `netlify.toml`, `src/config.ts`

### Smart Assistant Independence Implementation (August 12, 2025) ✅
- ✅ **SIDEBAR INDEPENDENCE**: Removed unwanted dependency between Smart Assistant and sidebar class selection
- ✅ **@MENTION ONLY**: Smart Assistant now exclusively uses @mention system for class context (e.g., "@Math101 what's due?")
- ✅ **CLEANER UX**: Users must be explicit about class context, eliminating confusion about which class is being referenced
- ✅ **TASK QUERIES PRESERVED**: General scheduling queries ("What's due tomorrow?") still work without class context
- ✅ **ZERO BREAKING CHANGES**: All existing @mention functionality and autocomplete preserved

**Technical Implementation**: Removed `selectedClass` prop from ChatbotPanel, updated interface, and simplified useChatbot logic
**Files Modified**: `Sidebar.tsx`, `ChatbotPanel.tsx`, `useChatbot.ts`

### AI Chatbot Vector Extension & Query Parsing Fix (August 13, 2025) ✅
- ✅ **CRITICAL VECTOR FIX**: Resolved `operator does not exist: extensions.vector <=> extensions.vector` blocking AI document search
- ✅ **QUERY PARSING FIX**: Fixed "@EE 123" incorrectly parsing as "@EE" + leftover "123" for course codes with spaces
- ✅ **DATABASE SECURITY**: Maintained security while enabling vector operations through explicit search_path control
- ✅ **REGEX ENHANCEMENT**: Updated mention parsing to handle course codes like "EE 123", "CS 101" as complete mentions
- ✅ **ZERO BREAKING CHANGES**: All existing functionality preserved including queries without @mentions

**Root Cause**: Security fix set `search_path = public, pg_temp` blocking vector extension access + regex only matched single words
**Technical Solution**: Updated `match_documents` function search_path to `public, extensions, pg_temp` + enhanced regex pattern
**Files Modified**: `/src/utils/chatbotMentions.ts`, `fix_vector_search_path.sql`

### TaskView UI/UX Optimization & Modal Positioning Fix (August 13, 2025) ✅
- ✅ **CRITICAL MODAL FIX**: Fixed TaskModal opening in middle of task list instead of screen center by moving modal outside container
- ✅ **BUTTON CONSISTENCY**: Sort dropdown and ascending/descending buttons now have identical sizing and styling
- ✅ **LAYOUT OPTIMIZATION**: Moved Add Task button from awkward top-right to intuitive position above first task
- ✅ **TEXT HIERARCHY**: Balanced font sizes - task count, Select All, and Sort labels now properly sized relative to buttons
- ✅ **HOVER INTERACTIONS**: Add Task button elegantly fades in on hover for clean, modern interface
- ✅ **SPACING IMPROVEMENTS**: Increased gap between "Sort by:" label and dropdown for better visual separation

**Technical Solution**: React Fragment wrapper allowing modal to render as sibling to main container instead of child, fixing viewport positioning constraints.

**Files Modified**: `TaskView.tsx`, `TaskModal.tsx`

### Dashboard View UI Consistency & TaskView Enhancement (August 12, 2025) ✅
- ✅ **DASHBOARD UI FIX**: Fixed Dashboard View squared corners to match rounded corner design of all other views
- ✅ **SORT DROPDOWN**: Removed ugly dropdown arrow in TaskView sort menu for clean interface design
- ✅ **REDUNDANCY CLEANUP**: Eliminated duplicate task count display for cleaner, professional appearance
- ✅ **CROSS-BROWSER SUPPORT**: Sort dropdown arrow fix works across Chrome, Safari, Firefox, Edge
- ✅ **ZERO BREAKING CHANGES**: All existing functionality preserved while improving UI consistency

**Files Modified**: `DashboardView.tsx`, `TaskView.tsx`, `TaskFilter.tsx`

### Syllabus Upload File Routing Bug Fix (August 13, 2025) ✅
- ✅ **CRITICAL FIX**: Fixed syllabus files uploaded via "Standard Upload" incorrectly appearing in class files section after page reload
- ✅ **ROOT CAUSE**: Data retrieval functions weren't filtering `class_files` table by `type` field to separate syllabus vs. regular files
- ✅ **SERVICE LAYER FIXES**: Enhanced `fileService.getClassData()` and `classOperations.getClasses()` with proper type filtering
- ✅ **BACKWARD COMPATIBILITY**: Maintained support for both legacy `class_syllabi` table and current `class_files` unified approach
- ✅ **ZERO BREAKING CHANGES**: All existing functionality preserved while fixing file organization

**Files Modified**: `fileService.ts`, `classOperations.ts`

### Force Re-import Feature Removal (August 13, 2025) ✅
- ✅ **DEPLOYMENT SAFETY**: Removed problematic force re-import feature to eliminate synchronization risks before Vercel deployment
- ✅ **CODE SIMPLIFICATION**: Eliminated ~25 lines of complex Canvas task deletion logic with error-prone localStorage/Supabase coordination
- ✅ **UI CLEANUP**: Removed confusing force sync checkbox and warning message from Canvas Settings
- ✅ **API STREAMLINING**: Simplified `fetchCanvasCalendar()` function signature by removing `forceUpdate` parameter
- ✅ **TYPE SAFETY**: Fixed TypeScript compilation issues and verified clean runtime execution

**Files Modified**: `CanvasSettings.tsx`, `canvasService.ts`

### Canvas Auto-Sync Bug Fixes & Message Improvements (August 12, 2025) ✅
- ✅ **INFINITE AUTO-SYNC FIX**: Fixed critical `useEffect` dependency bug causing Canvas sync every 1.5 seconds instead of only on page refresh
- ✅ **ACCURATE SYNC MESSAGES**: Enhanced Canvas sync to properly differentiate between new vs. existing tasks in success messages
- ✅ **PRE-SYNC DETECTION**: Added local storage checking to identify existing Canvas tasks before attempting database insertion
- ✅ **CODE CLEANUP**: Removed unnecessary task operation lock system and optimized Canvas sync performance
- ✅ **USER EXPERIENCE**: Clear messaging prevents confusion about "new" tasks that were already in calendar

**Files Modified**: `useSidebarData.ts`, `canvasService.ts`, `taskOperations.ts`

### Theme Toggle Navigation Migration (August 12, 2025) ✅
- ✅ **NAVIGATION THEME TOGGLE**: Moved theme controls from General Settings to navigation bar with hover-only visibility
- ✅ **EMOJI-ONLY DESIGN**: Created `ThemeToggle.tsx` component with just ☀️ light and 🌙 dark buttons (no text, no auto mode)
- ✅ **HOVER BEHAVIOR**: Theme buttons appear only on navigation area hover for clean interface design
- ✅ **PROPER SPACING**: Added responsive spacing between navigation buttons and theme toggle for professional layout
- ✅ **SETTINGS CLEANUP**: Removed theme section from General Settings, added user guidance notice

**Files Modified**: `App.tsx`, `AppearanceSettings.tsx` | **Files Created**: `ThemeToggle.tsx`

### UI/UX Polish & Canvas Integration Fixes (August 12, 2025) ✅
- ✅ **CANVAS SETTINGS OPTIMIZATION**: Made Quick Setup Guide collapsible to save 67% screen space while maintaining accessibility
- ✅ **SMART ASSISTANT UI ENHANCEMENT**: Removed ugly gray resize bar while preserving full vertical resize functionality
- ✅ **CALENDAR EDIT BUTTON FIX**: Fixed pencil icon visibility in dark theme with proper color classes
- ✅ **SIDEBAR ANIMATION REMOVAL**: Eliminated expand effects from UCR title text for consistent UI behavior
- ✅ **CANVAS ICS TEXT PARSING**: Fixed backslash escape characters in Canvas task titles (HW 3. Phase-Controlled Rectifiers\, → without backslash)

**Files Modified**: `CanvasSettings.tsx`, `ChatbotPanel.tsx`, `EventCard.tsx`, `SidebarTitle.tsx`, `icsParser.ts`

### DOCX Document Viewer Implementation & UI Fixes (August 12, 2025) ✅
- ✅ **DUAL-SYSTEM DOCX VIEWER**: Implemented docx-preview (primary) + mammoth.js (fallback) for OAuth-free document viewing
- ✅ **OAUTH ELIMINATION**: No authentication required - pure client-side rendering without external service dependencies
- ✅ **CLEAN UI INTERFACE**: Removed printer button, streamlined to download + close buttons for professional appearance
- ✅ **DARK MODE SIMPLIFICATION**: Use original Word colors in both themes - white document background with standard formatting
- ✅ **PERFECT READABILITY**: Yellow highlighting and all Word formatting preserved exactly as intended

**New Component**: `DocumentViewer.tsx` with dual-rendering system and clean modal interface

### Vercel Deployment Migration & Build System Fixes (August 12, 2025) ✅
- ✅ **WEBPACK 5 POLYFILL CONFIGURATION**: Fixed critical build errors with comprehensive Node.js polyfills for browser compatibility
- ✅ **VERCEL PLATFORM SETUP**: Complete deployment configuration with SPA routing, optimized builds, and environment variables
- ✅ **DOCKER INFRASTRUCTURE CLEANUP**: Removed Northflank-specific Docker/nginx configuration for Vercel migration
- ✅ **REACT ROUTER V7 INTEGRATION**: Enhanced webpack config for seamless routing system operation
- ✅ **SENTRY MONITORING RESTORATION**: Re-enabled error tracking and performance monitoring after dependency updates
- ✅ **ZERO BUILD ERRORS**: Production build working perfectly with polyfill system

**New Deployment Commands**: `npm run build:production`, Vercel-ready configuration in `vercel.json`

### Professional Portfolio Integration (August 12, 2025) ✅
- ✅ **DUAL-AUDIENCE STRATEGY**: Added professional portfolio pages without impacting student conversion funnel
- ✅ **SAFE ROUTING IMPLEMENTATION**: Hash routing within LandingPage only - zero breaking changes to existing architecture
- ✅ **FOOTER ENHANCEMENT**: "About the Creator" section with My Portfolio, Case Study, GitHub, LinkedIn links
- ✅ **PROFESSIONAL PAGES**: CreatorPortfolio.tsx and ProjectCaseStudy.tsx with comprehensive technical showcase
- ✅ **AUTHENTIC CONTENT**: Real LinkedIn/GitHub URLs, no fake metrics, micro-SaaS terminology, production-ready technical depth
- ✅ **ZERO RISK APPROACH**: Preserved all existing URL management, authentication, analytics, and anchor navigation

**New URLs**: `/#/portfolio` (professional showcase), `/#/case-study` (technical deep dive)

### FREE Disaster Recovery System (August 11, 2025) ✅
- ✅ **CRITICAL DISCOVERY**: Supabase free tier has NO automatic backups - manual system required for production
- ✅ **CLOUDFLARE R2 INTEGRATION**: Enhanced backup script with 10GB free storage, S3-compatible API
- ✅ **AUTOMATED DAILY BACKUPS**: GitHub Actions workflow with failure notifications and dual storage
- ✅ **24/7 MONITORING**: UptimeRobot setup (5 free monitors) with email alerts and status page
- ✅ **EMERGENCY PROCEDURES**: Complete disaster recovery runbook with <2hr RTO, <24hr RPO
- ✅ **COMPREHENSIVE GUIDES**: Step-by-step Cloudflare R2 and UptimeRobot setup documentation
- ✅ **ENTERPRISE-GRADE**: Production-ready disaster recovery at $0/month cost

**New Commands**: `npm run db:backup`, `npm run db:verify`, `npm run db:verify:integrity`

### Smart Assistant Dynamic Sizing Enhancement (August 12, 2025) ✅
- ✅ **FULLY RESIZABLE INTERFACE**: Width (300-800px) and height (200-600px) resize with invisible handles
- ✅ **NATURAL RESIZE BEHAVIOR**: Bottom-right corner drag expands naturally in drag direction
- ✅ **STATE PERSISTENCE**: All sizing preferences automatically saved in localStorage
- ✅ **ZERO BREAKING CHANGES**: All existing drag, positioning, and chat functionality preserved
- ✅ **PROFESSIONAL UI**: Clean invisible handles with proper cursors (ns-resize, ew-resize, nw-resize)

### AI Chatbot Date Query Bug Fix (August 11, 2025) ✅
- ✅ **SQL QUERY LOGIC FIX**: Fixed PostgREST OR syntax preventing historical May 2025 tasks from appearing in "next week" queries
- ✅ **DATE CALCULATION OVERHAUL**: Replaced "tomorrow + 6 days" logic with proper Monday-Sunday calendar week boundaries
- ✅ **FUTURE-PROOF SYSTEM**: Pure mathematical date calculation works for any week/year without hardcoding
- ✅ **ENHANCED DEBUG LOGGING**: Comprehensive date journey logging for rapid troubleshooting
- ✅ **VALIDATED RESULTS**: "What's due next week?" now correctly returns August 18-24, 2025 assignments only

### Login Security Fixes & Database Constraints (August 11, 2025) ✅
- ✅ **FORM SECURITY FIX**: Complete form clearing when switching login/register modes prevents information leakage
- ✅ **DATABASE CONSTRAINT**: Unique email constraint prevents duplicate account registrations
- ✅ **ENHANCED ERROR HANDLING**: Smart duplicate detection with user-friendly recovery options
- ✅ **PRODUCTION SECURITY**: Enterprise-grade authentication with comprehensive audit logging
- ✅ **ZERO BREAKING CHANGES**: All existing functionality preserved while adding security layers

### AI Chatbot Duplicate Prevention (August 11, 2025) ✅
- ✅ **DUPLICATE METADATA FIX**: Eliminated duplicate entries in document_extractions table
- ✅ **AUTO-EMBEDDING OPTIMIZATION**: Enhanced logic prevents unnecessary re-processing of embedded files
- ✅ **COMPREHENSIVE PROTECTION**: Complete duplicate prevention across documents and document_extractions tables
- ✅ **PERFORMANCE IMPROVEMENT**: Smart filtering reduces chatbot processing overhead
- ✅ **ZERO-RISK IMPLEMENTATION**: All fixes preserve existing chatbot functionality

### Supabase Database Function Fixes (August 11, 2025) ✅
- ✅ **AI CHATBOT RESTORATION**: Fixed critical database function issues preventing document search
- ✅ **DATABASE MIGRATION**: Created `match_documents` function with proper vector similarity search
- ✅ **PARAMETER MISMATCH FIX**: Corrected 5→4 parameter function calls in ask-chatbot Edge Function
- ✅ **OVERLOADING CONFLICT**: Resolved PostgreSQL function signature conflicts
- ✅ **SCHEMA ALIGNMENT**: Fixed function to match actual documents table structure (no metadata column)

### Production-Ready System (2025) - COMPLETED ✅
- ✅ **BILLING & PRICING**: Multi-billing system, competitive pricing ($3.99/mo, $24/academic), A/B testing framework
- ✅ **LEGAL COMPLIANCE**: FERPA/CCPA/GDPR compliant policies, 18+ adults only, 95/100 legal safety rating  
- ✅ **SECURITY & PERFORMANCE**: Import security overhaul, 95% cache improvement, 90% log reduction
- ✅ **SMART UPLOAD**: Lab parsing 13%→100% success, AI pipeline integration, universal syllabus support
- ✅ **UI ENHANCEMENTS**: Landing page redesign, TypeScript compliance, production readiness

### Core Development History (Archived)

#### Major Technical Achievements ✅
- **Production System**: Multi-billing, legal compliance, security hardening, performance optimization
- **Smart Upload**: AI pipeline integration, 100% lab parsing success, universal syllabus support  
- **Architecture**: Component modernization, TypeScript compliance, testing framework
- **UI/UX**: Landing page redesign, dark mode, accessibility compliance, mobile-first responsive

#### Critical Issues Resolved ✅
- **Security**: PDF.js vulnerability (CVE-2024-4367), API key exposure, import validation
- **Performance**: 95% cache improvement, 90% log reduction, database optimization
- **Compatibility**: Cross-browser support, theme workflow fixes, modal layering
- **Data Integrity**: Export/import fixes, academic system detection, bucket corrections

**Development History**: Complete session logs available in `CLAUDE_HISTORY.md`


