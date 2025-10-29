# Coaching Theme Field Implementation

## Overview
This document describes the implementation of the `coaching_theme` field across the application, which stores the coaching theme heading from session summaries and makes it available in both Session History and Action Plans views.

## Database Changes

### 1. Schema Updates (supabase-add-coaching-theme.sql)

Two new fields have been added:

```sql
-- Add coaching_theme to coaching_sessions (source of truth)
ALTER TABLE coaching_sessions
ADD COLUMN coaching_theme TEXT;

-- Add coaching_theme to action_plans (denormalized for performance)
ALTER TABLE action_plans
ADD COLUMN coaching_theme TEXT;

-- Create indexes for better query performance
CREATE INDEX idx_coaching_sessions_coaching_theme ON coaching_sessions(coaching_theme);
CREATE INDEX idx_action_plans_coaching_theme ON action_plans(coaching_theme);
```

### 2. Field Purpose

- **coaching_sessions.coaching_theme**: Source of truth, extracted from the AI-generated summary
- **action_plans.coaching_theme**: Denormalized copy for performance (avoids JOIN queries)

## Data Flow

```
Session Summary Generation
    ↓
Extract Coaching Theme from Summary
    ↓
Save to coaching_sessions.coaching_theme
    ↓
When Creating Action Plans → Copy to action_plans.coaching_theme
```

## Implementation Details

### 1. Theme Extraction Logic (sessions.ts)

The `extractCoachingTheme()` function extracts the theme from summary text using multiple strategies:

1. Look for "to become [something]" patterns
2. Extract from Goal Statement section
3. Extract from Executive Summary with goal-related keywords
4. Fallback to "Professional Development Journey"

```typescript
function extractCoachingTheme(summary: string): string {
  // Tries multiple extraction patterns
  // Returns the most relevant coaching theme
}
```

### 2. Session Summary Page (summary/page.tsx)

- When generating a summary, the theme is automatically extracted and saved
- Uses the `extractKeyHeading()` function to display the theme
- The theme is saved to `coaching_sessions.coaching_theme`

### 3. Action Plans Creation (extract-actions/route.ts)

When creating action plans from a session:
1. Fetch the session including `coaching_theme`
2. Copy `coaching_theme` to each action plan record
3. This denormalization improves query performance

```typescript
const { data: sessionCheck } = await supabase
  .from('coaching_sessions')
  .select('id, is_complete, coaching_theme')
  .eq('id', sessionId)
  .maybeSingle();

const coachingTheme = sessionCheck.coaching_theme || 'Professional Development Journey';

// Include in action plan insert
coaching_theme: coachingTheme
```

### 4. Session History Page (sessions/page.tsx)

**Column Renamed**: "Coaching Content" → "Coaching Theme"

- Displays `session.coaching_theme` directly from database
- No need for complex extraction logic
- Falls back to "Coaching Session" if not set

```typescript
<h3 className="font-semibold text-slate-900 text-base">
  {session.coaching_theme || 'Coaching Session'}
</h3>
```

### 5. Action Plans Table (ActionPlansTable.tsx)

**Major Simplification**: Removed complex session fetching logic

Before:
- Fetched each session individually to extract theme from summary
- Complex useEffect with API calls
- Maintained sessionInfo state

After:
- Directly uses `plan.coaching_theme` from action_plans data
- No additional API calls needed
- Much simpler and more performant

```typescript
const theme = plan.coaching_theme || 'Professional Development';
```

## Benefits

1. **Performance**: No JOIN queries or additional API calls needed
2. **Simplicity**: Direct field access instead of complex extraction
3. **Consistency**: Same theme across Session History and Action Plans
4. **Maintainability**: Single source of truth with controlled denormalization

## Migration Steps

To apply these changes to your Supabase database:

1. Run the SQL migration:
   ```bash
   # In Supabase SQL Editor, run:
   supabase-add-coaching-theme.sql
   ```

2. Restart your Next.js application:
   ```bash
   npm run dev
   ```

3. For existing sessions:
   - New sessions will automatically have `coaching_theme` set
   - Existing completed sessions will get the theme when summary is regenerated
   - Existing action plans will continue to work (showing "Professional Development" as fallback)

## TypeScript Interfaces

### SessionData
```typescript
export interface SessionData {
  id?: string;
  session_type: 'coach_led' | 'self_coaching';
  current_stage: number;
  is_complete: boolean;
  summary?: string;
  coaching_theme?: string;  // NEW FIELD
  created_at?: string;
  updated_at?: string;
}
```

### ActionPlanExtended
```typescript
export interface ActionPlanExtended {
  id: string;
  session_id: string;
  title: string;
  description?: string;
  coaching_theme?: string;  // NEW FIELD
  // ... other fields
}
```

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Create a new coaching session
- [ ] Complete the session and generate summary
- [ ] Verify `coaching_theme` is set in `coaching_sessions` table
- [ ] Create action plans from the session
- [ ] Verify `coaching_theme` is copied to `action_plans` table
- [ ] Check Session History page displays correct theme
- [ ] Check Action Plans page displays correct theme
- [ ] Test filtering by theme in Action Plans

## Future Enhancements

1. **Bulk Update**: Script to populate `coaching_theme` for existing sessions
2. **Theme Analytics**: Track popular coaching themes across sessions
3. **Theme Categories**: Group similar themes for better organization
4. **Custom Themes**: Allow users to manually edit themes if needed

## Notes

- The theme is automatically extracted during summary generation
- The extraction logic tries multiple patterns for best accuracy
- Fallback theme is "Professional Development Journey"
- The field is optional and won't break existing functionality
