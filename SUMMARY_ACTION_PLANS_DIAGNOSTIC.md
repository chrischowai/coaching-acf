# Summary & Action Plans Diagnostic Guide

## Issue Fixed

The critical bug was that `sessionId` was NOT being passed to the `/api/summary` endpoint, which meant:
- ❌ Summary was NOT saved to database
- ❌ coaching_theme was NOT extracted and saved
- ❌ Action plans couldn't find the coaching_theme when created
- ❌ Session History couldn't display the theme

### What Was Fixed

**File**: `src/components/InteractiveCoachingSession.tsx`

**Before** (Lines 284-290):
```typescript
const response = await fetch('/api/summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    allStageConversations: allData,
    sessionType,  // ❌ Missing sessionId!
  }),
});
```

**After**:
```typescript
const response = await fetch('/api/summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,  // ✅ NOW INCLUDED!
    allStageConversations: allData,
    sessionType,
    forceRegenerate: false,
  }),
});
```

## How It Works Now

```
User Completes Stage 5
    ↓
generateSummary() called
    ↓
Step 1: Generate Summary
  • Calls /api/summary WITH sessionId
  • AI generates summary text
  • saveSummary() extracts coaching_theme
  • Saves both to coaching_sessions table
    ↓
Step 2: Wait 500ms
  • Ensures database has committed
    ↓
Step 3: Create Action Plans
  • Calls /api/extract-actions
  • Fetches session (includes coaching_theme)
  • AI extracts action items
  • Copies coaching_theme to each action_plan
  • Saves to action_plans table
    ↓
✅ Complete!
```

## Console Output to Look For

When you complete a session, you should see these logs in the browser console:

```
🔵 Starting summary generation for session: <session-id>
📝 Generating summary via API...
✅ Summary generated successfully
   - Cached: false
   - Summary length: 2543
⏳ Waiting for database to update...
🎯 Creating action plans from summary...
✅ Created 5 action plans successfully
✅ All summary generation steps completed
```

## Verification Steps

### 1. Check Browser Console

After completing a coaching session:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the emoji indicators above
4. Check for any ❌ errors

### 2. Check Supabase Database

**coaching_sessions table:**
```sql
SELECT id, summary, coaching_theme, is_complete 
FROM coaching_sessions 
ORDER BY created_at DESC 
LIMIT 5;
```

Expected results:
- `summary` should be filled (long TEXT)
- `coaching_theme` should be filled (e.g., "Professional Development Journey")
- `is_complete` should be `true`

**action_plans table:**
```sql
SELECT id, session_id, title, coaching_theme, created_at 
FROM action_plans 
ORDER BY created_at DESC 
LIMIT 10;
```

Expected results:
- Multiple rows per session
- `coaching_theme` should match the parent session's theme
- `title` should be specific action items

### 3. Check UI Pages

**Session History** (`/sessions`):
- "Coaching Theme" column should show theme (not "Coaching Session")
- Executive Summary should be visible

**Action Plans** (`/action-plans`):
- "Coaching Theme" column should show theme
- Multiple action items from recent session
- Can filter by coaching theme

## Common Issues & Solutions

### Issue 1: Summary Not Showing in Database

**Symptoms:**
- Session shows as complete
- Summary text is empty in database
- coaching_theme is NULL

**Solution:**
✅ Already fixed! The sessionId is now included in the API call.

**Additional Check:**
Look for console error: "❌ Summary API failed"

### Issue 2: Action Plans Not Created

**Symptoms:**
- Summary is generated
- No action plans in database
- Console shows: "❌ Failed to create action plans"

**Possible Causes:**
1. Session not found in database
2. Summary text is invalid
3. AI extraction failed

**Debug:**
Check console for:
```
🎯 Creating action plans from summary...
❌ Failed to create action plans: [error message]
```

**Solution:**
- Make sure migration was run (coaching_theme fields exist)
- Check Gemini API key is configured
- Verify session exists before creating action plans

### Issue 3: Coaching Theme Shows "Professional Development"

**Symptoms:**
- Summary exists
- Action plans created
- Theme shows default fallback

**Cause:**
- coaching_theme is NULL in database
- Extraction failed

**Solution:**
1. Check console for theme extraction logs
2. Verify `extractCoachingTheme()` function is working
3. Manually check the summary text format

### Issue 4: Delay in UI Updates

**Symptoms:**
- Need to refresh multiple times
- Data eventually appears

**Cause:**
- React state not updating
- Component not re-fetching

**Solution:**
✅ Added 500ms delay before action plan creation
- This ensures database commits before next step
- UI components should refetch on mount

## API Endpoints

### POST /api/summary
**Request:**
```json
{
  "sessionId": "uuid",
  "allStageConversations": [...],
  "sessionType": "self_coaching",
  "forceRegenerate": false
}
```

**Response:**
```json
{
  "summary": "long text...",
  "cached": false
}
```

**Side Effects:**
- Saves summary to `coaching_sessions.summary`
- Extracts and saves `coaching_sessions.coaching_theme`

### POST /api/extract-actions
**Request:**
```json
{
  "sessionId": "uuid",
  "summary": "summary text..."
}
```

**Response:**
```json
{
  "success": true,
  "actions": [...],
  "count": 5
}
```

**Side Effects:**
- Creates multiple rows in `action_plans` table
- Copies `coaching_theme` from session to each action plan

## Testing Checklist

After applying the fix, test a complete session:

- [ ] Start a new coaching session
- [ ] Complete all 5 stages
- [ ] Check console for summary generation logs
- [ ] Verify toast shows "🎉 Session completed! X action plans created"
- [ ] Check Supabase: coaching_sessions.summary is populated
- [ ] Check Supabase: coaching_sessions.coaching_theme is populated
- [ ] Check Supabase: action_plans table has new rows
- [ ] Check Supabase: action_plans.coaching_theme matches session
- [ ] Visit Session History page - theme appears
- [ ] Visit Action Plans page - theme and actions appear
- [ ] No need to refresh multiple times

## Emergency Rollback

If the fix causes issues, revert with:

```bash
git diff HEAD~1 src/components/InteractiveCoachingSession.tsx
git checkout HEAD~1 -- src/components/InteractiveCoachingSession.tsx
```

## Additional Logging

If you need more debugging info, add this to `/api/extract-actions/route.ts`:

```typescript
console.log('📊 Action Plans Creation Debug:');
console.log('  - Session ID:', sessionId);
console.log('  - Session exists:', !!sessionCheck);
console.log('  - Coaching theme:', coachingTheme);
console.log('  - Valid actions count:', validActions.length);
```

## Support

If issues persist:
1. Check all console logs (with emojis)
2. Verify Supabase table structure
3. Test with a fresh session
4. Check network tab for API responses
