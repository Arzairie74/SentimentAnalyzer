# Use Case Diagram - Harassment Detection System

## Primary Use Case Diagram

```
                    Harassment Detection System
    ┌─────────────────────────────────────────────────────────────────┐
    │                                                                 │
    │  ┌─────────────┐                                                │
    │  │    User     │                                                │
    │  │ (Primary    │                                                │
    │  │  Actor)     │                                                │
    │  └─────────────┘                                                │
    │         │                                                       │
    │         │                                                       │
    │         ├──────────── Register Account                          │
    │         │                                                       │
    │         ├──────────── Login to System                           │
    │         │                                                       │
    │         ├──────────── Analyze Reddit Post                       │
    │         │                  │                                    │
    │         │                  ├── Enter Reddit URL                 │
    │         │                  ├── Scrape Comments                  │
    │         │                  └── Generate Analysis Report         │
    │         │                                                       │
    │         ├──────────── Analyze Custom Text                       │
    │         │                  │                                    │
    │         │                  ├── Input Text Content               │
    │         │                  └── Generate Harassment Score        │
    │         │                                                       │
    │         ├──────────── View Analysis History                     │
    │         │                  │                                    │
    │         │                  ├── Filter by Type                   │
    │         │                  ├── Sort by Date                     │
    │         │                  └── Search Results                   │
    │         │                                                       │
    │         ├──────────── Export Analysis Data                      │
    │         │                  │                                    │
    │         │                  ├── Export Single Analysis           │
    │         │                  ├── Export Bulk Data                 │
    │         │                  └── Download CSV Files               │
    │         │                                                       │
    │         ├──────────── View Dashboard                            │
    │         │                  │                                    │
    │         │                  ├── View Statistics                  │
    │         │                  ├── See Word Cloud                   │
    │         │                  └── View Charts                      │
    │         │                                                       │
    │         ├──────────── Manage Profile                            │
    │         │                  │                                    │
    │         │                  ├── Update Personal Info             │
    │         │                  ├── View Account Stats               │
    │         │                  └── Export All Data                  │
    │         │                                                       │
    │         └──────────── Logout from System                        │
    │                                                                 │
    │                                                                 │
    │  ┌─────────────┐                                                │
    │  │   OpenAI    │                                                │
    │  │    API      │                                                │
    │  │ (External   │                                                │
    │  │  System)    │                                                │
    │  └─────────────┘                                                │
    │         │                                                       │
    │         ├──────────── Process Text Analysis                     │
    │         │                  │                                    │
    │         │                  ├── Receive Batch Requests           │
    │         │                  ├── Analyze Harassment Content       │
    │         │                  └── Return Classification Results    │
    │         │                                                       │
    │         └──────────── Provide Confidence Scores                 │
    │                                                                 │
    │                                                                 │
    │  ┌─────────────┐                                                │
    │  │   Reddit    │                                                │
    │  │   Server    │                                                │
    │  │ (External   │                                                │
    │  │  System)    │                                                │
    │  └─────────────┘                                                │
    │         │                                                       │
    │         ├──────────── Provide Post Data                         │
    │         │                  │                                    │
    │         │                  ├── Serve JSON Endpoints             │
    │         │                  ├── Return Comment Threads           │
    │         │                  └── Provide Nested Replies           │
    │         │                                                       │
    │         └──────────── Handle Rate Limiting                      │
    │                                                                 │
    │                                                                 │
    │  ┌─────────────┐                                                │
    │  │  Supabase   │                                                │
    │  │  Database   │                                                │
    │  │ (External   │                                                │
    │  │  Service)   │                                                │
    │  └─────────────┘                                                │
    │         │                                                       │
    │         ├──────────── Store User Data                           │
    │         │                  │                                    │
    │         │                  ├── Manage Authentication            │
    │         │                  ├── Store User Profiles              │
    │         │                  └── Persist Analysis Results         │
    │         │                                                       │
    │         └──────────── Enforce Data Security                     │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

## Detailed Use Case Descriptions

### **UC-001: User Registration and Authentication**
- **Primary Actor**: New User
- **Goal**: Create account and access system
- **Preconditions**: User has valid email address
- **Main Flow**:
  1. User navigates to registration page
  2. User enters name, email, and password
  3. System validates input and creates account
  4. System creates user profile in database
  5. User is automatically logged in
- **Extensions**: Email validation, password strength requirements

### **UC-002: Reddit Post Analysis**
- **Primary Actor**: Authenticated User
- **Goal**: Analyze Reddit post comments for harassment
- **Preconditions**: User is logged in, valid Reddit URL provided
- **Main Flow**:
  1. User enters Reddit post URL
  2. System scrapes comments from Reddit JSON API
  3. System sends comments to OpenAI for analysis
  4. System processes AI responses and calculates statistics
  5. System displays results with visualizations
  6. System saves analysis to user's history
- **Extensions**: Handle private posts, rate limiting, API failures

### **UC-003: Custom Text Analysis**
- **Primary Actor**: Authenticated User
- **Goal**: Analyze custom text content for harassment
- **Preconditions**: User is logged in
- **Main Flow**:
  1. User inputs text content
  2. System validates text length and content
  3. System sends text to OpenAI for harassment analysis
  4. System processes AI response
  5. System displays harassment classification and confidence
  6. System saves analysis to database
- **Extensions**: Handle very long text, API failures, fallback analysis

### **UC-004: Data Export and Reporting**
- **Primary Actor**: Authenticated User
- **Goal**: Export analysis data for external use
- **Preconditions**: User has analysis history
- **Main Flow**:
  1. User navigates to export functionality
  2. User selects export type (single/bulk)
  3. System generates CSV with analysis data
  4. System triggers browser download
  5. User receives formatted CSV file
- **Extensions**: Filter by date range, export specific types

### **UC-005: Dashboard and Visualization**
- **Primary Actor**: Authenticated User
- **Goal**: View analysis statistics and trends
- **Preconditions**: User has performed analyses
- **Main Flow**:
  1. User accesses dashboard
  2. System aggregates user's analysis data
  3. System generates word cloud from text data
  4. System creates charts and statistics
  5. System displays interactive visualizations
- **Extensions**: Filter by time period, drill-down capabilities

## Use Case Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    Use Case Relationships                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Register Account ──────────── «extends» ──────────── Login     │
│                                                                 │
│  Login ──────────────────── «includes» ──────── Authentication  │
│                                                                 │
│  Analyze Reddit Post ─────── «includes» ──────── Save Analysis  │
│                                                                 │
│  Analyze Custom Text ─────── «includes» ──────── Save Analysis  │
│                                                                 │
│  View History ──────────────── «uses» ────────── Export Data    │
│                                                                 │
│  Dashboard ─────────────────── «uses» ────────── View History   │
│                                                                 │
│  All Analysis Functions ──── «requires» ──────── Authentication │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Actor Descriptions

### **Primary Actors**
- **User**: End user who wants to detect harassment in text content
- **Administrator**: System admin (future enhancement)

### **Secondary Actors**
- **OpenAI API**: External AI service for text analysis
- **Reddit Server**: Source of post and comment data
- **Supabase Database**: Data persistence and user management
- **Browser**: Client environment for application execution

## System Boundaries

The system includes:
- ✅ Web application frontend
- ✅ Client-side business logic
- ✅ Database integration
- ✅ External API integrations

The system excludes:
- ❌ Server-side backend services
- ❌ Mobile applications
- ❌ Real-time chat integration
- ❌ Administrative interfaces