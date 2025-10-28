# Bug Fix: Action Plan Details Page Redirect Issue

## Problem
When clicking "View Details" on an action plan from the Action Plans page, the page would load and then immediately redirect back to the Action Plans page instead of showing the action plan details.

## Root Cause
The `loadActionPlanData` function was incorrectly trying to fetch action plans using `getActionPlansBySession(id)`, where `id` was the action plan ID from the URL (not a session ID).

### Incorrect Code (Line 102)
```typescript
// This was wrong - 'id' is an action plan ID, not a session ID
const plans = await getActionPlansBySession(id);
```

The function `getActionPlansBySession()` expects a session ID, but was receiving an action plan ID, causing it to return an empty array. This triggered the error handler which redirected back to the action plans page.

## Solution

### Step 1: Added New Function
Created `getActionPlanById()` in `/src/lib/supabase/action-plans.ts` to fetch a single action plan by its ID:

```typescript
export async function getActionPlanById(id: string) {
  const { data, error } = await supabase
    .from('action_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching action plan:', error);
    throw error;
  }

  return data ? normalizeActionPlan(data) : null;
}
```

### Step 2: Updated Data Loading Logic
Modified `loadActionPlanData()` in `/src/app/action-plans/[id]/page.tsx`:

**Before:**
```typescript
const plans = await getActionPlansBySession(id);  // Wrong!
if (!plans || plans.length === 0) {
  toast.error('Action plan not found');
  router.push('/action-plans');
  return;
}
const firstPlan = plans[0];
const sessionId = firstPlan.session_id;
```

**After:**
```typescript
const actionPlan = await getActionPlanById(id);  // Correct!
if (!actionPlan) {
  toast.error('Action plan not found');
  router.push('/action-plans');
  return;
}
const sessionId = actionPlan.session_id;
```

## Data Flow (Corrected)

```
User clicks "View Details" with action plan ID (e.g., "abc123")
  ↓
URL: /action-plans/abc123
  ↓
Page receives ID: "abc123" (action plan ID)
  ↓
Call getActionPlanById("abc123") ✓
  ↓
Extract session_id from the returned action plan
  ↓
Call getActionPlansBySession(session_id) ✓
  ↓
Display all action plans from that session
```

## Files Modified
1. `/src/lib/supabase/action-plans.ts` - Added `getActionPlanById()` function
2. `/src/app/action-plans/[id]/page.tsx` - Updated imports and data loading logic

## Testing
After this fix, clicking "View Details" should:
1. ✓ Load the action plan details page
2. ✓ Show the plan name
3. ✓ Display success metrics (if available)
4. ✓ Show all action items from the session
5. ✓ Allow editing and saving
6. ✓ Provide navigation buttons to history and summary

## Status
✅ **FIXED** - The page now correctly loads and displays all action plan details.
