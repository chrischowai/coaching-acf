# Summary Caching Implementation

## Overview
This implementation solves the issue where the AI-generated session summary would change every time the user viewed it, even though the underlying session data remained the same.

## Problem
- Every time a user clicked "View Summary" on the Session Summary page, a new AI-generated summary was created
- The Gemini AI API was called with `temperature: 0.7`, causing variations in the response
- Action Plan Details page was also regenerating the summary, leading to inconsistent information

## Solution
Implemented a caching mechanism that stores the first generated summary in the database and reuses it on subsequent views.

## Changes Made

### 1. Database Schema Update
**File:** `supabase-add-summary-column.sql`
- Added `summary` TEXT column to `coaching_sessions` table
- Stores the cached AI-generated summary

**To apply:**
```sql
-- Run this in your Supabase SQL Editor
ALTER TABLE coaching_sessions 
ADD COLUMN summary TEXT;

COMMENT ON COLUMN coaching_sessions.summary IS 'Cached AI-generated summary of the complete coaching session';
```

### 2. Session Library Functions
**File:** `src/lib/supabase/sessions.ts`
- Added `summary?: string` to `SessionData` interface
- Created `saveSummary(sessionId, summary)` - Saves generated summary to database
- Created `getCachedSummary(sessionId)` - Retrieves cached summary from database

### 3. Summary API Enhancement
**File:** `src/app/api/summary/route.ts`
- Now accepts `sessionId` and `forceRegenerate` parameters
- Checks for cached summary before calling AI API
- Saves newly generated summaries to database
- Returns `{ summary, cached }` to indicate if result was from cache

**API Behavior:**
- If `forceRegenerate: false` (default) → Returns cached summary if available
- If `forceRegenerate: true` → Generates new summary and updates cache
- If no `sessionId` provided → Generates summary without caching (backwards compatible)

### 4. Session Summary Page
**File:** `src/app/sessions/[id]/summary/page.tsx`
- Passes `sessionId` to summary API
- Displays cached summary on first load
- Added "Regenerate Summary" button (visible when viewing cached summary)
- Shows loading state while regenerating
- Displays success toast after regeneration

### 5. Action Plan Details Page
**File:** `src/app/action-plans/[id]/page.tsx`
- Updated to pass `sessionId` to summary API
- Always uses cached summary (`forceRegenerate: false`)
- Ensures action items remain consistent with original summary

## User Experience

### First Time Viewing Summary
1. User completes a coaching session
2. Clicks "View Summary"
3. AI generates summary (takes a few seconds)
4. Summary is saved to database
5. Summary is displayed

### Subsequent Views
1. User clicks "View Summary" again
2. Cached summary loads instantly from database
3. "Regenerate Summary" button is available
4. Same summary content is shown every time

### Regenerating Summary
1. User clicks "Regenerate Summary" button
2. New summary is generated with fresh AI call
3. Database cache is updated
4. New summary replaces old one
5. Success toast notification appears

## Benefits
✅ **Consistency** - Summary text remains identical across all views
✅ **Performance** - Cached summaries load instantly (no API calls)
✅ **Cost Savings** - Reduces AI API usage significantly
✅ **Action Plan Integrity** - Action items reference the same source summary
✅ **User Control** - Users can regenerate if they want a fresh perspective

## Technical Details

### Caching Flow
```
User clicks "View Summary"
    ↓
Check database for cached summary
    ↓
If cached → Return instantly
If not → Generate with AI → Save to DB → Return
```

### API Request Format
```typescript
POST /api/summary
{
  sessionId: "uuid",              // Required for caching
  allStageConversations: [...],   // Session data
  sessionType: "coach_led",       // Session type
  forceRegenerate: false          // Optional, default false
}
```

### API Response Format
```typescript
{
  summary: "...",  // The summary text
  cached: true     // Whether this was from cache
}
```

## Migration Steps
1. Run the SQL migration in Supabase SQL Editor
2. Deploy the updated code
3. Existing sessions without cached summaries will generate and cache on first view
4. New sessions will automatically cache summaries

## Notes
- The `temperature: 0.7` setting remains in the AI API call for natural language generation
- Caching happens at the database level, not in memory
- Cached summaries persist across server restarts
- Each session has one cached summary (not multiple versions)
- Error handling ensures graceful degradation if caching fails
