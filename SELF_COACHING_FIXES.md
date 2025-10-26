# Self-Coaching Session Fixes

## Issues Fixed

### 1. Database Foreign Key Constraint Error
**Problem:** The "Continue to Next Stage" button was failing with error code 23503 - foreign key constraint violation.

**Root Cause:** 
- Session creation was completing, but auto-save was attempting to save stage responses before the database transaction fully committed
- No verification that the session actually existed in the database before trying to save stage responses

**Solutions Implemented:**

#### A. Enhanced Session Creation (`src/lib/supabase/sessions.ts`)
- Added explicit verification after session creation to ensure it's in the database
- Added detailed error logging for debugging
- Added retry logic to verify session exists before returning

```typescript
// Verify the session was actually saved by reading it back
const { data: verifyData, error: verifyError } = await supabase
  .from('coaching_sessions')
  .select('*')
  .eq('id', data.id)
  .single();
```

#### B. Pre-Save Session Verification (`src/lib/supabase/sessions.ts`)
- Added check in `saveStageResponse()` to verify session exists before attempting to save
- Provides clear error messages if session is not found

```typescript
// First verify the session exists
const { data: sessionCheck, error: sessionError } = await supabase
  .from('coaching_sessions')
  .select('id')
  .eq('id', stageData.session_id)
  .maybeSingle();
```

#### C. Improved Auto-Save Logic (`src/components/InteractiveCoachingSession.tsx`)
- Added 500ms delay after session creation to ensure DB transaction commits
- Increased auto-save debounce from 2s to 3s
- Added validation to only auto-save when there's at least one AI response
- Added proper error handling without annoying toast messages

#### D. Enhanced Next Stage Handler
- Added session verification before attempting to move to next stage
- Added minimum question count validation (8 questions)
- Better error messages guiding users on what to do

### 2. UI Improvements

#### Removed Elements:
- ❌ Black progress bar showing question count (e.g., "1/15 questions")
- ❌ Question counter from stage tooltips

#### Kept Elements:
- ✅ Stage 1-5 visual indicator bar
- ✅ Stage completion progress
- ✅ "Ready to Proceed" indicator (appears after 8 questions)

### 3. Question Count Changes

**Changed from 5 to 8 minimum questions per stage:**
- Updated all 5 stages in API configuration
- Updated UI to show button after 8 questions
- Removed maximum question limit (was 15)

### 4. AI Coaching Behavior Improvements

#### Prevents Users from Giving Up:
Added detection for phrases like:
- "I don't know"
- "give up"
- "no idea"
- "can't think"

When detected, AI encourages deeper thinking:
> "I can see this is challenging. Let's take a moment - what's the first thought that comes to mind, even if it feels incomplete?"

#### Prevents Requesting Direct Answers:
Added detection for phrases like:
- "tell me"
- "what should"
- "give me"
- "just tell"

#### Continuous Conversation:
- Removed 15-question hard stop
- After 8 questions, AI adds reminder: "💡 You can move to the next stage when ready, or we can continue exploring this further."
- AI always ends with a follow-up question
- No artificial conversation limits

## Files Modified

1. `src/components/InteractiveCoachingSession.tsx`
   - Session initialization with delay
   - Auto-save logic improvements
   - Next stage handler validation
   - UI changes (removed progress bar/counter)

2. `src/app/api/coach/route.ts`
   - Changed `minQuestions` from 5 to 8 for all stages
   - Removed `maxQuestions` limit
   - Added user input detection (giving up/asking for answers)
   - Added reminder after minimum questions reached
   - Enhanced system prompts

3. `src/lib/supabase/sessions.ts`
   - Added session verification after creation
   - Added pre-save session verification
   - Enhanced error logging

## Testing Instructions

### 1. Test Session Creation
1. Start a new self-coaching session
2. Check browser console for:
   ```
   Creating new coaching session...
   Session created successfully: [uuid]
   Session verified: [uuid]
   ```
3. Should see "Session started" toast notification

### 2. Test Auto-Save
1. Exchange 2-3 messages with AI
2. Wait 3 seconds
3. Check console for:
   ```
   Auto-saved stage 1
   ```
4. Should NOT see any error messages

### 3. Test Question Count Validation
1. Try clicking "Continue to Next Stage" before answering 8 questions
2. Should see error toast: "Please answer at least 8 questions before proceeding (current: X)"
3. Answer 8+ questions
4. Should see green "Ready to Proceed to Next Stage" indicator
5. Button should work and move to next stage

### 4. Test AI Behavior
1. Try saying "I don't know"
   - AI should encourage you to think deeper
   - Should NOT give you direct answers
2. Try saying "just tell me the answer"
   - AI should redirect you to find your own insights
3. Answer 8+ questions
   - Each AI response should include: "💡 You can move to the next stage when ready..."
   - AI should continue asking questions (no 15-question limit)

### 5. Test All 5 Stages
1. Complete all 5 stages (8+ questions each)
2. Each stage transition should work smoothly
3. Final stage should generate summary
4. Should see action plans created

## Common Errors & Solutions

### Error: "Session not initialized. Please refresh and try again."
**Solution:** Refresh the page and start a new session. Check browser console for session creation errors.

### Error: "Session not found in database"
**Solution:** This means the session wasn't properly created. Check:
1. Supabase credentials in `.env.local`
2. Database tables exist (run `supabase-schema.sql`)
3. RLS policies are set up correctly

### Error: Auto-save fails silently
**Solution:** This is now handled gracefully. Check console logs for details. Session will still work; data is saved when you click "Continue to Next Stage".

## Environment Requirements

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

## Database Requirements

Run this in Supabase SQL Editor if not already done:
```sql
-- Ensure RLS policies allow development
CREATE POLICY "Allow all for development" ON coaching_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON stage_responses FOR ALL USING (true);
```

## Next Steps

If issues persist:
1. Check browser console for detailed error logs
2. Check Supabase dashboard > Logs for database errors
3. Verify all migrations are applied
4. Clear browser cache and restart dev server
