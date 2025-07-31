# Database Documentation - Harassment Detection System

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────┐
│              auth.users             │
│  (Supabase Authentication Table)   │
├─────────────────────────────────────┤
│ id (uuid) [PK]                     │
│ email (text)                       │
│ created_at (timestamptz)           │
│ updated_at (timestamptz)           │
│ user_metadata (jsonb)              │
└─────────────────────────────────────┘
                    │
                    │ 1:1
                    │
                    ▼
┌─────────────────────────────────────┐
│             profiles                │
├─────────────────────────────────────┤
│ id (uuid) [PK, FK]                 │
│ email (text) [UNIQUE]              │
│ name (text)                        │
│ created_at (timestamptz)           │
│ updated_at (timestamptz)           │
└─────────────────────────────────────┘
                    │
                    │ 1:N
                    │
                    ▼
┌─────────────────────────────────────┐
│        sentiment_analyses          │
├─────────────────────────────────────┤
│ id (uuid) [PK]                     │
│ user_id (uuid) [FK]                │
│ type (text) [CHECK]                │
│ content (text)                     │
│ url (text) [NULLABLE]              │
│ results (jsonb)                    │
│ analysis (jsonb)                   │
│ created_at (timestamptz)           │
└─────────────────────────────────────┘
```

## Data Dictionary

### Table: `profiles`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, FOREIGN KEY | Unique identifier for the user profile, references auth.users(id) |
| `email` | text | NOT NULL, UNIQUE | User's email address, must be unique across all profiles |
| `name` | text | NOT NULL | User's display name or full name |
| `created_at` | timestamptz | DEFAULT now() | Timestamp when the profile was created |
| `updated_at` | timestamptz | DEFAULT now() | Timestamp when the profile was last updated |

**Indexes:**
- `profiles_pkey` (PRIMARY KEY on id)
- `profiles_email_key` (UNIQUE INDEX on email)

**Triggers:**
- `update_profiles_updated_at` - Automatically updates `updated_at` column on row modification

**Row Level Security (RLS):**
- Enabled with policies allowing users to view, insert, and update only their own profile data

---

### Table: `sentiment_analyses`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each analysis record |
| `user_id` | uuid | NOT NULL, FOREIGN KEY | References the user who performed the analysis |
| `type` | text | NOT NULL, CHECK (type IN ('reddit', 'text')) | Type of analysis performed - either Reddit post or custom text |
| `content` | text | NOT NULL | The original content analyzed (URL for Reddit, text for custom analysis) |
| `url` | text | NULLABLE | Reddit post URL (only populated for Reddit analyses) |
| `results` | jsonb | NOT NULL | Aggregated results of the harassment detection analysis |
| `analysis` | jsonb | NOT NULL | Detailed analysis results for each text segment |
| `created_at` | timestamptz | DEFAULT now() | Timestamp when the analysis was performed |

**Indexes:**
- `sentiment_analyses_pkey` (PRIMARY KEY on id)
- `sentiment_analyses_user_id_idx` (INDEX on user_id for efficient user queries)
- `sentiment_analyses_type_idx` (INDEX on type for filtering by analysis type)
- `sentiment_analyses_created_at_idx` (INDEX on created_at DESC for chronological ordering)

**Foreign Keys:**
- `sentiment_analyses_user_id_fkey` - References profiles(id) with CASCADE DELETE

**Check Constraints:**
- `sentiment_analyses_type_check` - Ensures type is either 'reddit' or 'text'

**Row Level Security (RLS):**
- Enabled with policies allowing users to view, insert, update, and delete only their own analyses

---

## JSON Schema Documentation

### `results` Column (jsonb)

Structure for aggregated harassment detection results:

```json
{
  "positive": 15,    // Count of texts classified as "no harassment"
  "neutral": 3,      // Count of texts classified as "neutral"
  "negative": 7,     // Count of texts classified as "harassment detected"
  "total": 25        // Total number of texts analyzed
}
```

**Field Descriptions:**
- `positive` (integer): Number of text segments classified as non-harassing content
- `neutral` (integer): Number of text segments with neutral sentiment
- `negative` (integer): Number of text segments classified as harassment
- `total` (integer): Total count of analyzed text segments

### `analysis` Column (jsonb)

Array structure containing detailed analysis for each text segment:

```json
[
  {
    "text": "This is a sample comment text",
    "sentiment": "positive",
    "score": 0.85
  },
  {
    "text": "Another comment with harassment content",
    "sentiment": "negative", 
    "score": 0.92
  }
]
```

**Array Element Schema:**
- `text` (string): The original text content that was analyzed
- `sentiment` (string): Classification result - "positive" (no harassment), "negative" (harassment), or "neutral"
- `score` (number): Confidence score between 0.0 and 1.0 indicating the model's certainty

---

## Database Relationships

### Primary Relationships

1. **auth.users → profiles (1:1)**
   - Each authenticated user has exactly one profile
   - Profile ID matches the authentication user ID
   - Cascade delete ensures profile removal when user account is deleted

2. **profiles → sentiment_analyses (1:N)**
   - Each user can have multiple harassment detection analyses
   - Foreign key relationship with cascade delete
   - Indexed for efficient user-specific queries

### Security Model

**Row Level Security (RLS) Implementation:**

1. **profiles table:**
   - Users can only access their own profile data
   - Policies enforce user_id matching for all operations
   - Separate policies for authenticated and public access

2. **sentiment_analyses table:**
   - Users can only view/modify their own analyses
   - INSERT policy ensures user_id matches authenticated user
   - SELECT, UPDATE, DELETE policies filter by user ownership

### Performance Considerations

**Indexing Strategy:**
- Primary keys for unique identification
- Foreign key indexes for join performance
- Composite indexes on frequently queried columns
- Descending index on created_at for chronological sorting

**Query Optimization:**
- User-specific queries leverage user_id indexes
- Type filtering uses dedicated type index
- Chronological ordering uses optimized created_at index

---

## Database Functions and Triggers

### Trigger Functions

1. **`handle_new_user()`**
   - Automatically creates profile when new user registers
   - Ensures data consistency between auth and profile tables

2. **`update_updated_at_column()`**
   - Generic function to update timestamp columns
   - Applied to profiles table for audit trail

### Usage Patterns

**Common Query Patterns:**
1. User profile lookup: `SELECT * FROM profiles WHERE id = $user_id`
2. User analysis history: `SELECT * FROM sentiment_analyses WHERE user_id = $user_id ORDER BY created_at DESC`
3. Analysis type filtering: `SELECT * FROM sentiment_analyses WHERE user_id = $user_id AND type = 'reddit'`
4. Recent analyses: `SELECT * FROM sentiment_analyses WHERE user_id = $user_id ORDER BY created_at DESC LIMIT 10`

**Data Integrity:**
- Foreign key constraints ensure referential integrity
- Check constraints validate enumerated values
- RLS policies enforce data isolation between users
- Triggers maintain audit trails and derived data