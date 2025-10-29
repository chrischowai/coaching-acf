# AI-Generated Action Items: Complete Storage Flow

## Executive Summary
When the AI generates action items from a coaching session, they are stored in the **`action_plans` table** in Supabase as the primary data origin. This document traces the exact flow from session completion through AI generation to final storage.

---

## Complete Flow Diagram

```
1. User Completes Stage 5 (Check Out)
   ↓
2. InteractiveCoachingSession.tsx → generateSummary()
   ├─ Sends all 5 stages to /api/summary
   ├─ AI generates structured summary text (cached in coaching_sessions.summary)
   └─ Result: Raw markdown summary with sections including "**Action Plan**"
   ↓
3. /api/summary (src/app/api/summary/route.ts)
   ├─ Calls Gemini API with system prompt
   ├─ Generates summary with 6 sections (including Action Plan section)
   ├─ Saves summary text to coaching_sessions.summary (line 111)
   └─ Returns summary text to frontend
   ↓
4. InteractiveCoachingSession.tsx → extract actions
   └─ Calls /api/extract-actions (line 300-307)
   ↓
5. /api/extract-actions (src/app/api/extract-actions/route.ts)
   ├─ Input: sessionId + raw summary text
   ├─ Parse action plan section from summary
   ├─ Call Gemini API again to extract structured JSON
   │  └─ Output format:
   │     [
   │       {
   │         "title": "Action description",
   │         "description": "More details",
   │         "due_date": "YYYY-MM-DD",
   │         "priority": "high|medium|low"
   │       },
   │       ...more actions
   │     ]
   ├─ Validate & clean extracted actions (lines 109-118)
   └─ INSERT into action_plans table (lines 154-170)
   ↓
6. PRIMARY STORAGE: action_plans Table
   ├─ Row per action item
   ├─ Columns populated:
   │  ├─ session_id (links to coaching_sessions)
   │  ├─ title (AI-extracted action title)
   │  ├─ description (AI-extracted action details)
   │  ├─ goal_statement (extracted from summary)
   │  ├─ priority (converted to 1/3/5 scale)
   │  ├─ status ('pending')
   │  ├─ due_date (AI-inferred or extracted)
   │  ├─ smart_criteria (empty JSONB - could be enhanced)
   │  ├─ timeline_start (set to current date)
   │  ├─ timeline_end (set to due_date)
   │  ├─ created_at (set by DB trigger)
   │  └─ updated_at (set by DB trigger)
   └─ Result: Structured action items ready for UI display & management
```

---

## Storage Locations (in order of generation)

### 1. **Temporary Storage: Coaching Session Summary (coaching_sessions table)**
**Column:** `summary` (TEXT)
**When:** After Stage 5 completion
**Content:** Raw markdown text from Gemini API
**Example:**
```markdown
**Executive Summary**
The coaching session focused on becoming a proficient web developer...

**Goal Statement**
To become a proficient full-stack web developer...

**Action Plan**
1. Complete the first module of the coding bootcamp by November 2
2. Practice coding exercises for 30 minutes daily until November 30
3. Build a personal portfolio project by December 15
...

**Success Metrics**
Progress will be measured by...
```

**SQL Location:**
```sql
SELECT summary FROM coaching_sessions WHERE id = '{sessionId}';
```

**Stored by:** `saveSummary()` in `src/lib/supabase/sessions.ts` (line 294-308)

---

### 2. **Primary Storage: AI-Structured Action Items (action_plans table)**
**Database:** Supabase PostgreSQL
**Table:** `action_plans`
**Created by:** `/api/extract-actions` endpoint

**Schema:**
```sql
CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                    -- AI-extracted action title
  description TEXT,                       -- AI-extracted action details
  goal_statement TEXT,                    -- Extracted from summary
  smart_criteria JSONB DEFAULT '{}',      -- Currently empty, can be enhanced
  priority INTEGER (1-5),                 -- 5=high, 3=medium, 1=low
  status TEXT DEFAULT 'pending',          -- pending/in_progress/completed/blocked
  timeline_start DATE,                    -- Set to current date
  timeline_end DATE,                      -- Set to due_date
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Inserted by:**
- File: `src/app/api/extract-actions/route.ts`
- Lines: 154-170
- Function: Supabase `insert()` call

**Example Data:**
```
{
  id: "abc-123-def",
  session_id: "xyz-789",
  title: "Complete online course module 1",
  description: "Finish the first module of the coding bootcamp",
  goal_statement: "To become a proficient full-stack web developer",
  smart_criteria: {},
  priority: 5,  // high
  status: "pending",
  timeline_start: "2025-10-29",
  timeline_end: "2025-11-02",
  created_at: "2025-10-29T04:00:00Z",
  updated_at: "2025-10-29T04:00:00Z"
}
```

---

## Detailed Process: How Action Items Are Generated & Stored

### Step 1: Session Completion → Summary Generation
**File:** `src/components/InteractiveCoachingSession.tsx` (line 280-331)
```typescript
const generateSummary = async (allData: StageData[]) => {
  // After user completes Stage 5
  const response = await fetch('/api/summary', {
    method: 'POST',
    body: JSON.stringify({
      allStageConversations: allData,  // All 5 stages with messages
      sessionType,
    }),
  });
  
  const data = await response.json();
  setSummary(data.summary);  // Raw markdown summary
  
  // Immediately extract action items
  const actionsResponse = await fetch('/api/extract-actions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      summary: data.summary,  // Pass the generated summary
    }),
  });
};
```

### Step 2: Summary Generation
**File:** `src/app/api/summary/route.ts`
```typescript
export async function POST(req: NextRequest) {
  const { allStageConversations, sessionId, sessionType } = await req.json();
  
  // Call Gemini API with structured prompt
  const systemPrompt = `Generate summary with sections:
  - Executive Summary
  - Key Insights
  - Goal Statement
  - Action Plan          ← ACTION ITEMS LISTED HERE
  - Success Metrics
  - Support & Accountability
  `;
  
  // Get AI response
  const summary = data.candidates[0].content.parts[0].text;
  
  // Cache in database for reference
  await saveSummary(sessionId, summary);  // Line 111
  
  return { summary, cached: false };
}
```

**Output Format (relevant section):**
```markdown
**Action Plan**
1. Complete online course module 1 - by November 2, 2025
2. Practice coding exercises - daily until November 30, 2025
3. Build portfolio project - by December 15, 2025
4. Attend weekly study group - starting November 1
5. Create project documentation - by December 20, 2025
```

### Step 3: Action Extraction & Structuring
**File:** `src/app/api/extract-actions/route.ts` (lines 1-191)

**Input:**
```typescript
{
  sessionId: "xyz-789",
  summary: "...[full markdown summary]..."
}
```

**Process:**
```typescript
// 1. Extract action plan section from raw summary
const extractionPrompt = `
Analyze this summary and extract action items into JSON format:
[
  {
    "title": "...",
    "description": "...",
    "due_date": "YYYY-MM-DD",
    "priority": "high|medium|low"
  }
]
`;

// 2. Call Gemini API with lower temperature (0.3) for consistency
const response = await fetch('gemini-api...', {
  body: JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: extractionPrompt }],
    }],
    generationConfig: {
      temperature: 0.3,  // Lower for structured output
      maxOutputTokens: 2000,
    },
  }),
});

// 3. Parse JSON response
let actions = JSON.parse(actionText);

// 4. Validate & clean (lines 109-118)
const validActions = actions
  .filter((action) => action.title && action.title.trim().length > 0)
  .map((action) => ({
    title: action.title.substring(0, 255),
    description: action.description?.substring(0, 1000) || '',
    due_date: action.due_date || defaultDate,
    priority: validatePriority(action.priority),
    status: 'pending',
  }));
```

**Example Output (from Gemini):**
```json
[
  {
    "title": "Complete online course module 1",
    "description": "Finish the first module of the coding bootcamp",
    "due_date": "2025-11-02",
    "priority": "high"
  },
  {
    "title": "Practice coding exercises daily",
    "description": "Dedicate 30 minutes each day to coding practice",
    "due_date": "2025-11-30",
    "priority": "medium"
  },
  {
    "title": "Build a personal portfolio project",
    "description": "Create a portfolio showcasing 2-3 projects",
    "due_date": "2025-12-15",
    "priority": "high"
  }
]
```

### Step 4: Database Storage (PRIMARY STORAGE)
**File:** `src/app/api/extract-actions/route.ts` (lines 154-170)

```typescript
// Transform for database
const { data: savedActions, error } = await supabase
  .from('action_plans')
  .insert(
    validActions.map((action) => ({
      session_id: sessionId,
      title: action.title,
      description: action.description,
      goal_statement: goalStatement,      // Extracted from summary
      smart_criteria: {},                 // Could be enhanced
      priority: action.priority === 'high' ? 5 : action.priority === 'medium' ? 3 : 1,
      status: 'pending',
      due_date: action.due_date,          // YYYY-MM-DD format
      timeline_start: new Date().toISOString().split('T')[0],
      timeline_end: action.due_date,
    }))
  )
  .select();

if (error) {
  console.error('Error saving action plans:', error);
  throw error;
}

return { success: true, actions: savedActions, count: savedActions.length };
```

**Result:** Action items now stored in `action_plans` table, ready for UI consumption.

---

## Query Examples: Retrieving AI-Generated Action Items

### Get All Action Items for a Session
```typescript
import { getActionPlansBySession } from '@/lib/supabase/action-plans';

const actions = await getActionPlansBySession(sessionId);
// Returns array of ActionPlanExtended objects from action_plans table
```

### Direct SQL Query
```sql
SELECT * FROM action_plans 
WHERE session_id = 'xyz-789'
ORDER BY due_date ASC;
```

### Get Specific Action Item
```typescript
import { getActionPlanById } from '@/lib/supabase/action-plans';

const action = await getActionPlanById(actionId);
```

---

## Data Flow Summary Table

| Stage | Data Location | Format | Ownership |
|-------|---------------|--------|-----------|
| Raw AI Output | Memory (Gemini response) | Plain text | Gemini API |
| Cached Summary | `coaching_sessions.summary` | Markdown text | Database |
| Extracted Actions | `/api/extract-actions` response | JSON array | API response |
| **PRIMARY STORAGE** | **`action_plans` table** | **Structured rows** | **Database** |
| UI Display | Component state | React objects | Frontend |

---

## Key Points

1. **Primary Origin:** `action_plans` table is the single source of truth for action items after AI generation
2. **Generation Source:** AI (Gemini) generates action items from the full coaching session context
3. **Extraction Process:** Two-stage AI processing:
   - Stage 1: Generate full summary with Action Plan section
   - Stage 2: Extract and structure action items from that section
4. **Storage Timing:** Action items stored immediately after session completion (no manual step needed)
5. **Consistency:** Each action item row links back to its session via `session_id` foreign key
6. **Editability:** Action items can be modified via UI (updates `action_plans` table)
7. **Traceability:** Original session data preserved in `stage_responses` for audit trail

---

## Related Files

- **Frontend:** `src/components/InteractiveCoachingSession.tsx` (triggers generation)
- **API - Summary:** `src/app/api/summary/route.ts` (generates summary)
- **API - Extraction:** `src/app/api/extract-actions/route.ts` (extracts & stores)
- **Database Functions:** `src/lib/supabase/action-plans.ts` (retrieves/updates)
- **Database Functions:** `src/lib/supabase/sessions.ts` (saves summary)
- **Database Schema:** `supabase-schema.sql` (table definitions)

---

## Potential Enhancements

1. **SMART Criteria Extraction:** Currently `smart_criteria` JSONB field is empty. Could be populated by extracting:
   - Specific: Clarity of action
   - Measurable: Success metrics
   - Achievable: Resource feasibility
   - Relevant: Goal alignment
   - Time-bound: Due date

2. **Confidence Scoring:** Add confidence field from AI on action quality

3. **Dependency Mapping:** Track action dependencies (action B requires action A first)

4. **Resource Allocation:** Store required resources and availability

5. **Accountability Assignment:** Link actions to specific individuals/roles
