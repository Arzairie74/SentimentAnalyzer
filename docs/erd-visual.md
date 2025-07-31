# Visual Entity Relationship Diagram

## Detailed ERD with Attributes and Relationships

```
                    ┌─────────────────────────────────────┐
                    │            auth.users               │
                    │        (Supabase Built-in)         │
                    ├─────────────────────────────────────┤
                    │ 🔑 id: uuid [PK]                   │
                    │ 📧 email: text                     │
                    │ 🔐 encrypted_password: text        │
                    │ 📅 created_at: timestamptz         │
                    │ 📅 updated_at: timestamptz         │
                    │ 📋 user_metadata: jsonb            │
                    │ 🔒 email_confirmed_at: timestamptz │
                    └─────────────────────────────────────┘
                                        │
                                        │ 1:1 (CASCADE DELETE)
                                        │ profiles_id_fkey
                                        ▼
                    ┌─────────────────────────────────────┐
                    │             profiles                │
                    │         (User Profiles)            │
                    ├─────────────────────────────────────┤
                    │ 🔑 id: uuid [PK, FK]               │
                    │ 📧 email: text [UNIQUE, NOT NULL]  │
                    │ 👤 name: text [NOT NULL]           │
                    │ 📅 created_at: timestamptz         │
                    │ 📅 updated_at: timestamptz         │
                    │                                     │
                    │ 🔍 Indexes:                        │
                    │   • profiles_pkey (id)             │
                    │   • profiles_email_key (email)     │
                    │                                     │
                    │ 🛡️ RLS: Enabled                    │
                    │ 🔧 Triggers:                       │
                    │   • update_profiles_updated_at     │
                    └─────────────────────────────────────┘
                                        │
                                        │ 1:N (CASCADE DELETE)
                                        │ sentiment_analyses_user_id_fkey
                                        ▼
                    ┌─────────────────────────────────────┐
                    │        sentiment_analyses          │
                    │    (Harassment Detection Data)     │
                    ├─────────────────────────────────────┤
                    │ 🔑 id: uuid [PK]                   │
                    │ 👤 user_id: uuid [FK, NOT NULL]    │
                    │ 📝 type: text [CHECK]              │
                    │    ↳ ('reddit' | 'text')           │
                    │ 📄 content: text [NOT NULL]        │
                    │ 🔗 url: text [NULLABLE]            │
                    │ 📊 results: jsonb [NOT NULL]       │
                    │    ↳ {positive, neutral, negative, │
                    │       total}                        │
                    │ 🔍 analysis: jsonb [NOT NULL]      │
                    │    ↳ [{text, sentiment, score}]    │
                    │ 📅 created_at: timestamptz         │
                    │                                     │
                    │ 🔍 Indexes:                        │
                    │   • sentiment_analyses_pkey (id)   │
                    │   • user_id_idx (user_id)          │
                    │   • type_idx (type)                │
                    │   • created_at_idx (created_at ↓)  │
                    │                                     │
                    │ ✅ Constraints:                    │
                    │   • type_check (type validation)   │
                    │                                     │
                    │ 🛡️ RLS: Enabled                    │
                    │   • Users see only own data        │
                    └─────────────────────────────────────┘
```

## Relationship Details

### 🔗 auth.users ↔ profiles (1:1)
- **Relationship Type**: One-to-One (Mandatory)
- **Foreign Key**: `profiles.id` → `auth.users.id`
- **Delete Rule**: CASCADE (deleting user removes profile)
- **Purpose**: Extends Supabase auth with custom user data

### 🔗 profiles ↔ sentiment_analyses (1:N)
- **Relationship Type**: One-to-Many
- **Foreign Key**: `sentiment_analyses.user_id` → `profiles.id`
- **Delete Rule**: CASCADE (deleting profile removes all analyses)
- **Purpose**: Links harassment detection analyses to users

## Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │  Profile    │    │  Analysis   │
│ Registration│───▶│  Creation   │    │   History   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                  ▲
                           │                  │
                           ▼                  │
                   ┌─────────────┐    ┌─────────────┐
                   │   User      │    │ Harassment  │
                   │   Login     │───▶│ Detection   │
                   └─────────────┘    │  Analysis   │
                                     └─────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Row Level Security                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👤 User A                    👤 User B                 │
│  ├── Profile A                ├── Profile B             │
│  ├── Analysis 1               ├── Analysis 3            │
│  ├── Analysis 2               └── Analysis 4            │
│  └── Analysis 5                                         │
│                                                         │
│  🚫 User A cannot access User B's data                 │
│  ✅ User A can only see/modify their own records       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## JSON Data Structure Examples

### `results` JSON Structure
```json
{
  "positive": 45,     // No harassment detected
  "neutral": 12,      // Neutral content  
  "negative": 8,      // Harassment detected
  "total": 65         // Total analyzed
}
```

### `analysis` JSON Structure
```json
[
  {
    "text": "This is a great post, thanks for sharing!",
    "sentiment": "positive",
    "score": 0.95
  },
  {
    "text": "You're an idiot and should kill yourself",
    "sentiment": "negative", 
    "score": 0.98
  },
  {
    "text": "I don't really have an opinion on this",
    "sentiment": "neutral",
    "score": 0.72
  }
]
```