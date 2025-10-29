# Action Items Section - Data Source Trace

## Question
Where does the data in the "Action Items" section of the Action Plan Details page come from?

## Answer
The "Action Items" section gets its data from **TWO SOURCES** (in this order):

1. **Primary Source: AI-Generated Summary Text** (from `coaching_sessions.summary`)
2. **Secondary Source: Action Plans Database** (from `action_plans` table)

---

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User navigates to Action Plan Details page                     │
│  URL: /action-plans/[id]                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  loadActionPlanData() function triggered (lines 98-156)         │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │Step 1      │  │Step 2      │  │Step 3      │
    │Get single  │  │Get ALL     │  │Get session │
    │action plan │  │action plans│  │data        │
    │by ID       │  │for session │  │and stages  │
    └────────────┘  └────────────┘  └────────────┘
         │               │               │
         ▼               ▼               ▼
    (Skip for now) (Skip for now)  IMPORTANT ↓
                         │
                         ▼
    ┌──────────────────────────────────────────────────┐
    │Step 4: Fetch session summary from /api/summary   │
    │ (lines 128-137)                                   │
    │                                                    │
    │ POST /api/summary {                               │
    │   sessionId,                                       │
    │   allStageConversations (all 5 stages),           │
    │   sessionType,                                     │
    │   forceRegenerate: false ← Always use CACHED      │
    │ }                                                  │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │ /api/summary returns cached summary from:        │
    │                                                   │
    │ SELECT summary FROM coaching_sessions            │
    │ WHERE id = sessionId                             │
    │                                                   │
    │ Response: {                                       │
    │   summary: "**Executive Summary**...[markdown]"  │
    │ }                                                 │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │Step 5: Parse summary text (lines 140-142)        │
    │                                                   │
    │parseSummary(summaryText) extracts:               │
    │  • executiveSummary                              │
    │  • keyInsights                                   │
    │  • goal                                          │
    │  • actions      ← THIS IS WHAT WE NEED!          │
    │  • metrics                                       │
    │  • support                                       │
    │                                                   │
    │ Returns SessionSummary object                    │
    │ setSessionSummary(parsed)                        │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │Step 6: Render ActionPlanTable component          │
    │ (line 314)                                        │
    │                                                   │
    │ <ActionPlanTable                                  │
    │   actionsText={sessionSummary.actions}           │
    │   sessionId={sessionInfo.id}                      │
    │ />                                                │
    │                                                   │
    │ Pass the "Action Plan" section text from         │
    │ the parsed summary                               │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │ActionPlanTable.tsx - Component receives:         │
    │  • actionsText (markdown text from summary)      │
    │  • sessionId (session identifier)                │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │Step 7: Initialize action items (lines 38-185)   │
    │                                                   │
    │ 1. Parse actionsText with parseActionItems()     │
    │    (lines 187-272)                               │
    │    ↓                                              │
    │    Extracts numbered items from markdown:        │
    │    "1. **Title:** Description (Deadline: ...)"   │
    │                                                   │
    │    Output: Array of ParsedActionItem objects     │
    │                                                   │
    │ 2. Fetch existing action plans from DB           │
    │    (lines 51-59)                                 │
    │    ↓                                              │
    │    GET /api/action-plans/by-session/{sessionId}  │
    │                                                   │
    │    Output: Array of DB records from              │
    │             action_plans table                   │
    │                                                   │
    │ 3. MATCH parsed items with DB records           │
    │    (lines 61-99)                                 │
    │    ↓                                              │
    │    If DB record exists for parsed item:          │
    │      Use DB data (title, description, etc.)     │
    │    Else:                                         │
    │      Use parsed data (will create on save)       │
    │                                                   │
    │ 4. CREATE missing items in DB (if needed)        │
    │    (lines 104-161)                               │
    │    ↓                                              │
    │    POST /api/action-plans/create-from-summary   │
    │                                                   │
    │    This ensures all items exist in DB            │
    │                                                   │
    │ 5. setActionItems(items)                         │
    │    Display in UI                                 │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │Step 8: Render Action Items in UI                 │
    │ (lines 382-561)                                  │
    │                                                   │
    │ For each actionItem in actionItems:              │
    │   • Display title                                │
    │   • Display description                          │
    │   • Show status, priority, due date selects      │
    │   • Allow editing and saving                     │
    │   • Save via PATCH /api/action-plans/{id}        │
    └──────────────────────────────────────────────────┘
```

---

## Two Data Sources Explained

### 1. PRIMARY SOURCE: AI-Generated Summary Text

**File Path:** `coaching_sessions.summary` column in Supabase

**What is stored:**
```markdown
**Executive Summary**
...

**Action Plan**
1. **Complete online course module 1** (Deadline: 2025-11-02)
Finish the first module of the coding bootcamp

2. **Practice coding exercises daily** (Deadline: 2025-11-30)
Dedicate 30 minutes each day to coding practice

3. **Build a personal portfolio project** (Deadline: 2025-12-15)
Create a portfolio showcasing 2-3 projects
```

**How it gets there:**
1. Session completes → `/api/summary` generates markdown summary
2. Summary cached in `coaching_sessions.summary` via `saveSummary()`
3. This text is PARSED in ActionPlanTable to extract individual items

**Code retrieval:**
```typescript
// In ActionPlanDetailPage (line 128-142)
const summaryResponse = await fetch('/api/summary', {
  method: 'POST',
  body: JSON.stringify({
    sessionId,
    allStageConversations,
    sessionType: session.session_type,
    forceRegenerate: false  // ← Always use cached
  })
});

const { summary: summaryText } = await summaryResponse.json();
const parsed = parseSummary(summaryText);
setSessionSummary(parsed);

// Extract the "actions" part:
// parsed.actions = "1. **Complete online course...2. **Practice..."
```

### 2. SECONDARY SOURCE: Action Plans Database

**Table:** `action_plans` in Supabase

**What is stored (per action item):**
```sql
{
  id: "abc-123",
  session_id: "xyz-789",
  title: "Complete online course module 1",
  description: "Finish the first module of the coding bootcamp",
  goal_statement: "To become a proficient full-stack web developer",
  priority: 5,
  status: "pending",
  due_date: "2025-11-02",
  created_at: "2025-10-29T...",
  updated_at: "2025-10-29T..."
}
```

**How it gets there:**
1. ActionPlanTable parses markdown and finds items
2. Fetches existing DB records for the session
3. If records don't exist, creates them via `/api/action-plans/create-from-summary`
4. Stores as individual rows in `action_plans` table

**Code retrieval:**
```typescript
// In ActionPlanTable (lines 51-59)
const response = await fetch(`/api/action-plans/by-session/${sessionId}`);
const existingPlans = await response.json();  // ← Gets action_plans rows

// Then matches and uses DB data (lines 61-99)
const dbMatch = existingPlans.find(plan => 
  plan.title?.toLowerCase().includes(parsedItem.title.toLowerCase())
);

if (dbMatch) {
  // Use database record
  return {
    id: dbMatch.id,
    title: dbMatch.title,
    description: dbMatch.description,
    status: dbMatch.status,
    priority: dbMatch.priority,
    dueDate: dbMatch.due_date,
    // ... etc
  };
}
```

---

## Data Integration Logic

```
Parsed Items From Summary      Database Items From action_plans
         │                              │
         │                              │
         └──────────┬───────────────────┘
                    │
                    ▼
         Match by title similarity
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    Match Found?          No Match?
         │                     │
         ▼                     ▼
    Use DB data          Use Parsed data
    (title, desc,        (will create on
     status, etc.)        first save)
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
            Combined Item List
            (displayed in UI)
                    │
                    ▼
         If item has no ID:
         Create in DB via
         /api/action-plans/create-from-summary
```

---

## Summary Table

| Component | Data Source | Format | Purpose |
|-----------|-------------|--------|---------|
| **Source of summary text** | `coaching_sessions.summary` | Markdown text | Contains "Action Plan" section |
| **Parsing** | `parseActionItems()` function | RegEx extraction | Extracts numbered items from markdown |
| **Matching** | `action_plans` table | DB rows | Links parsed items to database records |
| **Display** | `ActionPlanTable` component | React UI | Shows items with edit capabilities |
| **Persistence** | `action_plans` table | SQL rows | Stores all changes permanently |

---

## Flow Diagram: Where Data Comes From

```
┌─────────────────────────────────────────────────────────────────┐
│         USER SEES IN "ACTION ITEMS" SECTION                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Complete online course module 1                          ││
│  │    Finish the first module of the coding bootcamp           ││
│  │    Status: [Pending ▼] Priority: [Medium ▼] Due: [Date]    ││
│  │                                                              ││
│  │ 2. Practice coding exercises daily                          ││
│  │    Dedicate 30 minutes each day to coding practice          ││
│  │    Status: [Pending ▼] Priority: [Medium ▼] Due: [Date]    ││
│  │                                                              ││
│  │ [Save Changes button]                                       ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────┬──────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐           ┌──────────────────┐
   │DISPLAY STEP │           │DATA ORIGIN STEP  │
   │             │           │                  │
   │ Title from: │           │ Text parsed from:│
   │ DB or       │           │                  │
   │ Parsed item │           │ coaching_sessions│
   │             │           │ .summary field   │
   │ Description │           │                  │
   │ from: DB or │           │ Which contains:  │
   │ Parsed item │           │                  │
   │             │           │ **Action Plan**  │
   │ (User can   │           │ 1. Title...      │
   │  edit both) │           │ 2. Title...      │
   └─────────────┘           │ 3. Title...      │
                             │                  │
                             │ (Parsed in JS)   │
                             │                  │
                             │ Matched with DB  │
                             │ for full data    │
                             └──────────────────┘
```

---

## Important Notes

1. **NOT from action_plans table directly:** The component doesn't query the action_plans table for the DISPLAY. It parses the summary markdown.

2. **Hybrid approach:** It uses BOTH sources:
   - Summary markdown for the text content
   - Database for status, priority, notes (user edits)

3. **Fallback to DB if needed:** When user edits and saves, it updates the database records. On next page load, it will match parsed items with DB updates.

4. **Auto-create if missing:** If items don't exist in DB, they're automatically created when the component first loads.

5. **Data consistency:** The markdown should match DB records. If they diverge, there's logic to reconcile (lines 61-99 matching logic).

---

## Code File References

- **ActionPlanDetailPage:** `src/app/action-plans/[id]/page.tsx` (lines 98-156)
- **parseSummary():** `src/app/action-plans/[id]/page.tsx` (lines 57-76)
- **ActionPlanTable:** `src/components/action-plans/ActionPlanTable.tsx` (lines 31-561)
- **parseActionItems():** `src/components/action-plans/ActionPlanTable.tsx` (lines 187-272)
- **Initialize & Match:** `src/components/action-plans/ActionPlanTable.tsx` (lines 38-185)
