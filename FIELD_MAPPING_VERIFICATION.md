# Field Mapping Verification - Action Plans Table

## Status: ✅ CORRECT

The current field mapping in the Action Plans table follows the correct logic.

---

## Field Mapping Confirmed

### Database Schema
```sql
CREATE TABLE action_plans (
  id UUID PRIMARY KEY,
  session_id UUID,
  title TEXT,                    -- What the user should do
  description TEXT,              -- Details of what to do
  goal_statement TEXT,           -- Overall goal extracted from summary
  smart_criteria JSONB,
  priority INTEGER,
  status TEXT,
  due_date DATE,
  timeline_start DATE,
  timeline_end DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### UI Table Columns → Database Fields

| UI Column | Database Field | Component File | Line | Logic |
|-----------|---|---|---|---|
| Coaching Theme | `session_id` (theme extracted) | ActionPlansTable.tsx | 439 | Read-only, fetched from session summary |
| **Agreed Action** | **`title`** | ActionPlansTable.tsx | 451-452 | ✅ Edits `title` field |
| **Content** | **`description`** | ActionPlansTable.tsx | 476-477 | ✅ Edits `description` field |
| Status | `status` | ActionPlansTable.tsx | 490+ | Edits `status` field |
| Priority | `priority` | ActionPlansTable.tsx | 490+ | Edits `priority` field |
| Due Date | `due_date` | ActionPlansTable.tsx | 490+ | Edits `due_date` field |

---

## Code Verification

### 1. Agreed Action Column (title field)
**File:** `src/components/action-plans/ActionPlansTable.tsx`
**Lines:** 447-470

```typescript
{/* Agreed Action Column */}
<td className="px-4 py-4 align-top min-w-[200px]">
  {isEditing ? (
    <Input
      value={editData.title}                              // ← Reads from title
      onChange={(e) => updateEditField(plan.id, 'title', e.target.value)}  // ← Updates title
      className="font-semibold"
      placeholder="Action title..."
    />
  ) : (
    <div>
      <div className="font-semibold text-slate-900">{plan.title}</div>  // ← Displays title
      ...
    </div>
  )}
</td>
```

**Verification:** ✅ Correctly maps "Agreed Action" UI column to `title` database field

---

### 2. Content Column (description field)
**File:** `src/components/action-plans/ActionPlansTable.tsx`
**Lines:** 472-487

```typescript
{/* Content Column */}
<td className="px-4 py-4 align-top max-w-md">
  {isEditing ? (
    <Textarea
      value={editData.description}                         // ← Reads from description
      onChange={(e) => updateEditField(plan.id, 'description', e.target.value)}  // ← Updates description
      placeholder="Description..."
      rows={3}
      className="text-sm resize-none"
    />
  ) : (
    <div className="text-sm text-slate-600 line-clamp-3">
      {plan.description || <span className="italic text-slate-400">No description</span>}  // ← Displays description
    </div>
  )}
</td>
```

**Verification:** ✅ Correctly maps "Content" UI column to `description` database field

---

## Data Flow in startEditing()

**File:** `src/components/action-plans/ActionPlansTable.tsx`
**Lines:** 151-163

```typescript
const startEditing = (plan: ActionPlanExtended) => {
  setEditingRows(new Set([...editingRows, plan.id]));
  setEditingData({
    ...editingData,
    [plan.id]: {
      title: plan.title,                    // ✅ From plan.title (Agreed Action)
      description: plan.description || '', // ✅ From plan.description (Content)
      status: plan.status,
      priority: plan.priority,
      due_date: plan.due_date || '',
    },
  });
};
```

**Verification:** ✅ Correctly loads data from database fields into editing state

---

## Data Flow in confirmEditing()

**File:** `src/components/action-plans/ActionPlansTable.tsx`
**Lines:** 175-187

```typescript
const confirmEditing = (id: string) => {
  const updates = editingData[id];
  if (!updates) return;

  // Validate required fields
  if (!updates.title.trim()) {
    toast.error('Title is required');
    return;
  }

  onUpdate(id, updates);    // ✅ Passes { title, description, status, priority, due_date }
  cancelEditing(id);
};
```

**Verification:** ✅ Sends correct field names to `updateActionPlan()`

---

## Data Flow in handleUpdate()

**File:** `src/app/action-plans/page.tsx`
**Lines:** 96-105

```typescript
const handleUpdate = async (id: string, updates: Partial<ActionPlanExtended>) => {
  try {
    await updateActionPlan(id, updates);  // ✅ Calls Supabase function
    toast.success('Action plan updated!');
    await loadData();                     // ✅ Refreshes page data
  } catch (error) {
    console.error('Failed to update action plan:', error);
    toast.error('Failed to update action plan');
  }
};
```

**Verification:** ✅ Passes updates directly to Supabase library function

---

## Data Flow in updateActionPlan()

**File:** `src/lib/supabase/action-plans.ts`
**Lines:** 115-141

```typescript
export async function updateActionPlan(
  id: string,
  updates: Partial<ActionPlanExtended>
) {
  const dbUpdates: any = { ...updates };
  if (updates.priority) {
    dbUpdates.priority = priorityToInt(updates.priority);  // ✅ Converts priority
  }
  
  const { data, error } = await supabase
    .from('action_plans')
    .update({
      ...dbUpdates,                                        // ✅ Updates with field names as-is
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating action plan:', error);
    throw error;
  }

  return data ? normalizeActionPlan(data) : data;
}
```

**Verification:** ✅ Correctly updates Supabase with exact field names:
- `title` → updates `title` column
- `description` → updates `description` column
- `status` → updates `status` column
- `priority` → updates `priority` column (converted to 1/3/5)
- `due_date` → updates `due_date` column

---

## Summary of Field Usage

### `title` Field
- **UI Display:** "Agreed Action" column
- **User Input:** What action the person should take
- **Database Column:** `action_plans.title`
- **Example:** "Complete online course module 1"
- **Editable:** ✅ Yes
- **Update Path:** UI → editData.title → updates.title → Supabase

### `description` Field
- **UI Display:** "Content" column
- **User Input:** Details/context about the action
- **Database Column:** `action_plans.description`
- **Example:** "Finish the first module of the coding bootcamp"
- **Editable:** ✅ Yes
- **Update Path:** UI → editData.description → updates.description → Supabase

### `goal_statement` Field
- **UI Display:** None directly editable in table
- **Set During:** Action extraction from summary
- **Database Column:** `action_plans.goal_statement`
- **Example:** "To become a proficient full-stack web developer"
- **Editable:** ❌ No (set once during action creation)
- **Purpose:** Links action back to session's overall goal

---

## Conclusion

The current implementation is **✅ CORRECT**:

1. ✅ "Agreed Action" column correctly updates `title` field
2. ✅ "Content" column correctly updates `description` field
3. ✅ `goal_statement` is set once during action extraction (not edited in table)
4. ✅ Data flows correctly from UI → State → API → Supabase
5. ✅ Field names match database schema exactly
6. ✅ No corrections needed

The system is working as designed.
