# Coaching Theme - Architecture Diagram

## Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER COMPLETES SESSION                          │
│                     (5 ACF Coaching Stages)                          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI GENERATES SUMMARY                              │
│  /api/summary (Gemini API)                                          │
│  • Executive Summary                                                 │
│  • Key Insights                                                      │
│  • Goal Statement ◄──────────────────┐                              │
│  • Action Plan                       │                              │
│  • Success Metrics                   │                              │
└──────────────────────┬──────────────────────────────────────────────┘
                       │                │
                       │                │ Extract Theme
                       │                │ (extractCoachingTheme)
                       ▼                │
┌──────────────────────────────────────┘
│  EXTRACTED THEME EXAMPLES:
│  • "Professional Development Journey"
│  • "vibe coding expert"
│  • "Building Marketable Coding Skills"
└──────────────────────┬───────────────────────────────────────────────┐
                       │                                               │
                       ▼                                               │
┌─────────────────────────────────────────────────────────────────────┤
│         SAVE TO DATABASE (saveSummary)                              │
│                                                                      │
│  coaching_sessions table:                                           │
│  ┌────────────────────────────────────────────┐                    │
│  │ id                | UUID                   │                    │
│  │ summary           | TEXT (full summary)    │                    │
│  │ coaching_theme    | TEXT ◄─── SAVED HERE  │ ◄── SOURCE OF TRUTH│
│  │ session_type      | TEXT                   │                    │
│  │ is_complete       | BOOLEAN                │                    │
│  └────────────────────────────────────────────┘                    │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              USER CREATES ACTION PLANS                               │
│         /api/extract-actions                                         │
│         1. Fetch session with coaching_theme                         │
│         2. Extract action items from summary                         │
│         3. Create action plans with theme                            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│         SAVE ACTION PLANS WITH THEME                                 │
│                                                                      │
│  action_plans table:                                                │
│  ┌────────────────────────────────────────────┐                    │
│  │ id                | UUID                   │                    │
│  │ session_id        | UUID (FK)              │                    │
│  │ title             | TEXT                   │                    │
│  │ description       | TEXT                   │                    │
│  │ coaching_theme    | TEXT ◄─── COPIED HERE │ ◄── DENORMALIZED   │
│  │ priority          | INTEGER                │                    │
│  │ status            | TEXT                   │                    │
│  │ due_date          | DATE                   │                    │
│  └────────────────────────────────────────────┘                    │
└──────────────────┬──────────────────────────┬────────────────────────┘
                   │                          │
                   │                          │
        ┌──────────▼───────────┐   ┌─────────▼──────────┐
        │  SESSION HISTORY     │   │   ACTION PLANS     │
        │  /sessions           │   │   /action-plans    │
        │                      │   │                    │
        │  ┌────────────────┐ │   │  ┌──────────────┐  │
        │  │ Coaching Theme │ │   │  │ Coaching     │  │
        │  │ Column         │ │   │  │ Theme Column │  │
        │  │                │ │   │  │              │  │
        │  │ • Shows        │ │   │  │ • Shows      │  │
        │  │   coaching_    │ │   │  │   coaching_  │  │
        │  │   theme from   │ │   │  │   theme from │  │
        │  │   sessions     │ │   │  │   action_    │  │
        │  │   table        │ │   │  │   plans      │  │
        │  │                │ │   │  │   table      │  │
        │  │ • No API calls │ │   │  │ • No API     │  │
        │  │   needed       │ │   │  │   calls      │  │
        │  └────────────────┘ │   │  │   needed     │  │
        └─────────────────────┘   │  └──────────────┘  │
                                  └─────────────────────┘
```

## Key Architecture Decisions

### 1. Denormalization Strategy
**Decision**: Copy `coaching_theme` to `action_plans` table

**Why?**
- Avoids JOIN queries on every Action Plans page load
- Improves performance significantly
- Action Plans page doesn't need to fetch session data
- Theme is relatively static (won't change after creation)

**Trade-off**: Data duplication vs. Performance
- ✅ Performance wins
- ⚠️ If session theme changes, action plans won't auto-update (acceptable)

### 2. Extraction vs. Manual Entry
**Decision**: Auto-extract theme from AI summary

**Why?**
- Consistent format
- No user input required
- Leverages existing AI-generated content
- Reduces user effort

**Trade-off**: Auto vs. Manual
- ✅ Convenience for users
- ⚠️ Theme might not be perfect (but has good fallbacks)

### 3. Storage Location
**Decision**: Store in both tables

```
coaching_sessions.coaching_theme  ← Source of Truth
action_plans.coaching_theme       ← Denormalized Copy
```

**Why?**
- Session History needs it from `coaching_sessions`
- Action Plans needs it from `action_plans`
- Eliminates cross-table queries

## Component Changes Comparison

### Before Implementation

```
ActionPlansTable Component:
├── State: sessionInfo (stores themes for each session)
├── useEffect: Fetch all unique sessions
│   └── For each session:
│       ├── API call to /api/sessions/{id}
│       ├── Parse summary text
│       ├── Extract theme with regex
│       └── Store in sessionInfo state
└── Render: theme from sessionInfo[session_id]

Session History:
├── For each session:
│   ├── Fetch summary
│   ├── Parse summary
│   └── Extract theme
└── Render: extracted theme
```

### After Implementation

```
ActionPlansTable Component:
└── Render: plan.coaching_theme (direct field access)

Session History:
└── Render: session.coaching_theme (direct field access)
```

**Lines of Code Removed**: ~70 lines
**API Calls Eliminated**: N calls (where N = unique sessions)
**State Complexity**: Reduced by 100%

## Performance Impact

### Before
```
Action Plans Page Load:
1. Fetch action plans (1 query)
2. Extract unique session IDs (client-side)
3. Fetch each session (N queries)
4. Parse summaries (client-side)
5. Extract themes (client-side)
6. Render

Total: 1 + N database queries
```

### After
```
Action Plans Page Load:
1. Fetch action plans (1 query)
2. Render

Total: 1 database query
```

**Performance Improvement**: 
- If N=10 sessions: 91% fewer queries (1 vs 11)
- If N=50 sessions: 98% fewer queries (1 vs 51)

## Database Indexes

```sql
CREATE INDEX idx_coaching_sessions_coaching_theme 
ON coaching_sessions(coaching_theme);

CREATE INDEX idx_action_plans_coaching_theme 
ON action_plans(coaching_theme);
```

**Purpose**: Enable fast filtering/searching by theme

**Use Cases**:
- Filter action plans by coaching theme
- Group sessions by theme
- Theme analytics (future feature)

## Error Handling & Fallbacks

```
Theme Extraction Fails
    ↓
Use Fallback: "Professional Development Journey"
    ↓
Store fallback in database
    ↓
Display fallback in UI

Theme is NULL in Database
    ↓
UI shows different fallbacks:
- Session History: "Coaching Session"
- Action Plans: "Professional Development"
```

## Future Enhancement Possibilities

1. **Theme Categories**: Auto-categorize themes
2. **Theme Analytics**: Track popular themes
3. **Theme Suggestions**: AI suggests better themes
4. **Manual Override**: Let users edit themes
5. **Theme History**: Track theme changes over time
6. **Bulk Update**: Populate themes for old sessions

## Migration Impact

```
┌────────────────────┐
│ Existing Sessions  │ → coaching_theme = NULL → Show fallback ✓
├────────────────────┤
│ Existing Action    │ → coaching_theme = NULL → Show fallback ✓
│ Plans              │
├────────────────────┤
│ New Sessions       │ → coaching_theme extracted → Show theme ✓
├────────────────────┤
│ New Action Plans   │ → coaching_theme copied → Show theme ✓
└────────────────────┘
```

**Result**: Zero breaking changes, graceful degradation
