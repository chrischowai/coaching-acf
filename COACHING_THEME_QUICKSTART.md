# Coaching Theme - Quick Start Guide

## What Was Changed?

Added a `coaching_theme` field that stores the coaching theme heading (like "Professional Development Journey") from session summaries. This theme now appears in:
1. **Session History** - Under "Coaching Theme" column
2. **Action Plans** - Under "Coaching Theme" column

## How to Apply Changes

### Step 1: Run Database Migration

1. Open your Supabase project
2. Go to SQL Editor
3. Copy and paste the contents of `supabase-add-coaching-theme.sql`
4. Click "Run"

**Or via command line:**
```sql
-- Copy this SQL and run in Supabase SQL Editor:

ALTER TABLE coaching_sessions
ADD COLUMN coaching_theme TEXT;

ALTER TABLE action_plans
ADD COLUMN coaching_theme TEXT;

CREATE INDEX idx_coaching_sessions_coaching_theme ON coaching_sessions(coaching_theme);
CREATE INDEX idx_action_plans_coaching_theme ON action_plans(coaching_theme);
```

### Step 2: Restart Your Application

```bash
# If running in development
npm run dev

# Or if you need to rebuild
npm run build
npm start
```

### Step 3: Test the Changes

1. **Create a new coaching session**
   - Start a self-coaching or coach-led session
   - Complete all 5 stages

2. **Generate summary**
   - The system will automatically extract and save the coaching theme
   - Look for the theme heading under "Coaching Session Summary"

3. **Create action plans**
   - The coaching theme will be copied to each action plan

4. **Verify in UI**
   - Go to Session History page - theme appears under "Coaching Theme"
   - Go to Action Plans page - same theme appears under "Coaching Theme"

## What Each File Does

### Database Layer
- `supabase-add-coaching-theme.sql` - Adds database columns

### Backend/API
- `src/lib/supabase/sessions.ts` - Extracts and saves theme from summary
- `src/lib/supabase/action-plans.ts` - Defines ActionPlan interface with theme
- `src/app/api/extract-actions/route.ts` - Copies theme to action plans

### Frontend/UI
- `src/app/sessions/page.tsx` - Displays theme in Session History
- `src/components/action-plans/ActionPlansTable.tsx` - Displays theme in Action Plans

## Quick Troubleshooting

### Problem: Theme not showing in Session History
- **Check**: Did you run the SQL migration?
- **Check**: Is the session completed and summary generated?
- **Fix**: Complete a new session to generate theme

### Problem: Theme not showing in Action Plans
- **Check**: Was the action plan created after the SQL migration?
- **Check**: Does the parent session have a theme?
- **Fix**: Create new action plans from a session with theme

### Problem: Getting errors after migration
- **Check**: Did you restart the Next.js server?
- **Check**: Are there TypeScript errors in terminal?
- **Fix**: Run `npm run dev` to restart

## Fallback Behavior

If `coaching_theme` is missing or null:
- Session History shows: "Coaching Session"
- Action Plans shows: "Professional Development"

This ensures the app works even with old data.

## Key Features

✅ Automatic theme extraction from AI summaries  
✅ Theme stored in database (not computed on-demand)  
✅ Same theme across Session History and Action Plans  
✅ Backward compatible with existing data  
✅ Improved performance (no extra API calls)  
✅ Filterable in Action Plans table  

## Example Theme Extraction

From this summary:
> "The coachee aims to become a **'vibe coding expert'** within one year..."

Extracted theme:
> "vibe coding expert"

The extraction logic looks for patterns like:
- "to become [theme]"
- "aims to [theme]"
- "focused on [theme]"
- Goal Statement section content

## Need Help?

Refer to these detailed docs:
- `COACHING_THEME_IMPLEMENTATION.md` - Full technical details
- `COACHING_THEME_CHANGES_SUMMARY.md` - Complete changes list

## Rollback (If Needed)

```sql
-- Run in Supabase SQL Editor to undo changes:
ALTER TABLE coaching_sessions DROP COLUMN coaching_theme;
ALTER TABLE action_plans DROP COLUMN coaching_theme;
DROP INDEX idx_coaching_sessions_coaching_theme;
DROP INDEX idx_action_plans_coaching_theme;
```

Then revert code via git.
