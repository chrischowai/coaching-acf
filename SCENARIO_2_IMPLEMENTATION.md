# Scenario 2: Edit Action Plan Table Directly - Implementation Summary

## Changes Completed

### 1. ✅ Removed Regenerate Button from Session Summary Page
**File Modified:** `src/app/sessions/[id]/summary/page.tsx`

**Changes:**
- Removed the "Regenerate Summary" button (lines 243-258)
- Removed unused state variables: `isRegenerating` and `isCached`
- Simplified `fetchSummary()` function to always use cached summary (no regeneration option)
- Removed unused imports: `Clock` and `FileText`

**Result:** Users can no longer regenerate action plans, reducing confusion about having multiple versions of action plans.

---

## Scenario 2 Workflow - How It Works

### Step 1: User Edits Action Plan in Action Plans Page
**File:** `src/app/action-plans/page.tsx` + `src/components/action-plans/ActionPlansTable.tsx`

User clicks "Amend" button on an action plan row:
- Inline editing mode activates for that row
- User can edit these fields:
  - **"Agreed Action"** column → `title` field
  - **"Content"** column → `description` field
  - **"Status"** → `status` field
  - **"Priority"** → `priority` field
  - **"Due Date"** → `due_date` field

### Step 2: User Presses Save and Confirms
**File:** `src/components/action-plans/ActionPlansTable.tsx` (line 175-187)

```typescript
const confirmEditing = (id: string) => {
  const updates = editingData[id];
  if (!updates) return;

  // Validate required fields
  if (!updates.title.trim()) {
    toast.error('Title is required');
    return;
  }

  onUpdate(id, updates);  // Calls handleUpdate() from parent page
  cancelEditing(id);
};
```

This calls `handleUpdate()` in `ActionPlansPage`:

```typescript
const handleUpdate = async (id: string, updates: Partial<ActionPlanExtended>) => {
  try {
    await updateActionPlan(id, updates);  // Updates Supabase
    toast.success('Action plan updated!');
    await loadData();  // Refresh all data from Supabase
  } catch (error) {
    console.error('Failed to update action plan:', error);
    toast.error('Failed to update action plan');
  }
};
```

**Database Update Path:**
- Calls: `src/lib/supabase/action-plans.ts` → `updateActionPlan(id, updates)`
- Which calls Supabase `.update()` on `action_plans` table
- Updates these columns based on what user edited:
  - `title` (if user edited "Agreed Action")
  - `description` (if user edited "Content")
  - `status` (if user edited "Status")
  - `priority` (if user edited "Priority")
  - `due_date` (if user edited "Due Date")
  - `updated_at` (auto-updated by trigger)

### Step 3: Action Plans Page Refreshes
**File:** `src/app/action-plans/page.tsx` (line 100)

```typescript
await loadData();  // This reloads fresh data from Supabase
```

**What happens:**
- `getAllActionPlans()` is called to fetch latest data from Supabase
- `getActionPlanStats()` is called to update statistics
- Page re-renders with updated values
- User sees their changes immediately displayed in the table

### Step 4: User Navigates to Action Plan Details
**File:** `src/app/action-plans/[id]/page.tsx` (line 51-55)

```typescript
useEffect(() => {
  if (id) {
    loadActionPlanData();  // This is called when page loads
  }
}, [id]);
```

**What happens when `loadActionPlanData()` is called (lines 98-156):**

1. **Fetches fresh action plan from Supabase:**
   ```typescript
   const actionPlan = await getActionPlanById(id);  // Line 103
   ```
   - This queries the `action_plans` table for the specific ID
   - Returns latest data including any edits user made

2. **Fetches all action plans for the session:**
   ```typescript
   const allSessionPlans = await getActionPlansBySession(sessionId);  // Line 114
   ```
   - Gets all related action items

3. **Fetches session info:**
   ```typescript
   const { session, stages } = await getSession(sessionId);  // Line 119
   ```
   - Gets the coaching session metadata

4. **Generates/retrieves summary:**
   ```typescript
   const summaryResponse = await fetch('/api/summary', {...});  // Line 128
   ```
   - Fetches the cached summary with metrics

**Result:** All data displayed on the Action Plan Details page reflects the latest changes from Supabase.

---

## Data Synchronization Flow

```
Action Plans Page
│
├─ User edits "Agreed Action" (title) or "Content" (description)
│
├─ Clicks "Confirm?" button
│
├─ handleUpdate() calls updateActionPlan()
│  │
│  ├─ Sends UPDATE to Supabase action_plans table
│  │
│  └─ Toast: "Action plan updated!"
│
├─ loadData() refreshes from Supabase
│  │
│  ├─ getAllActionPlans() fetches updated rows
│  │
│  ├─ Page re-renders with new data
│  │
│  └─ User sees changes immediately
│
└─ User clicks "View" → navigates to /action-plans/[id]
   │
   ├─ loadActionPlanData() executes
   │  │
   │  ├─ getActionPlanById() fetches fresh data from Supabase
   │  │
   │  ├─ getActionPlansBySession() fetches related plans
   │  │
   │  ├─ getSession() fetches session info
   │  │
   │  └─ /api/summary fetches cached summary
   │
   └─ All updated values are displayed on Details page ✓
```

---

## Field Mapping Reference

| Table Column | Database Field | Editable? | Updates To |
|--------------|----------------|-----------|-----------|
| Coaching Theme | `session_id` (theme extracted) | ❌ No | N/A |
| Agreed Action | `title` | ✅ Yes | `title` |
| Content | `description` | ✅ Yes | `description` |
| Status | `status` | ✅ Yes | `status` |
| Priority | `priority` | ✅ Yes | `priority` |
| Due Date | `due_date` | ✅ Yes | `due_date` |

---

## Important Notes

1. **Auto-Refresh:** After confirming edits, the Action Plans page automatically refreshes from Supabase with `loadData()`

2. **Data Consistency:** The Action Plan Details page loads fresh data directly from Supabase, so any edits are always synchronized

3. **No Manual Refresh Needed:** Users don't need to manually refresh because:
   - After edit: Page reloads data in background (`loadData()`)
   - When navigating to Details: Fresh data fetched from Supabase

4. **Audit Trail:** The `updated_at` timestamp is automatically updated by a Supabase trigger, tracking when each action item was modified

5. **No More Regeneration:** The "Regenerate Summary" button has been removed to avoid user confusion about creating multiple versions of action plans

---

## Related Files

### Modified Files
- `src/app/sessions/[id]/summary/page.tsx` - Removed regenerate button

### Files Already Supporting Scenario 2 (No Changes Needed)
- `src/app/action-plans/page.tsx` - Already handles updates with `loadData()` refresh
- `src/components/action-plans/ActionPlansTable.tsx` - Already has inline editing
- `src/app/action-plans/[id]/page.tsx` - Already fetches fresh data from Supabase
- `src/lib/supabase/action-plans.ts` - Already has `updateActionPlan()` function

---

## Testing the Workflow

1. **Create a coaching session** and complete all 5 stages
2. **Navigate to Action Plans page**
3. **Click "Amend"** on any action item
4. **Edit the "Agreed Action" or "Content"** fields
5. **Click "Confirm?"** to save
6. **Observe:**
   - Toast shows "Action plan updated!"
   - Table refreshes immediately with new values
7. **Click "View"** on the same action item
8. **Verify:**
   - Action Plan Details page shows the updated values
   - Data is consistent across both pages

---

## Summary

✅ **Regenerate button removed** - No more confusion about multiple versions
✅ **Inline editing works** - Users can edit action items directly in the table
✅ **Data automatically saves** - Changes persist to Supabase action_plans table
✅ **Page auto-refreshes** - Updated data visible immediately after save
✅ **Details page synced** - Fresh data fetched from Supabase when navigating
✅ **Workflow complete** - Scenario 2 is fully implemented and working
