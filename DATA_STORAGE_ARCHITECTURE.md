# Coaching Session Data Storage Architecture

## Overview
The coaching session information (including metrics items and action items) originates from **five interconnected database tables** in Supabase. The data flows through these tables in a specific sequence during a coaching session lifecycle.

---

## Data Origin & Flow

### 1. **Primary Storage: `stage_responses` Table**
This is the **origin of all coaching session data**. It stores the complete conversation history from all 5 stages of the ACF coaching framework.

**Table Schema:**
```sql
CREATE TABLE stage_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES coaching_sessions(id),
  stage_number INTEGER (1-5),
  stage_name TEXT,
  responses JSONB NOT NULL DEFAULT '{}',    -- Contains all conversation data
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**What's Stored:**
- **Stage 1 (Check In)**: Presence level, emotional state, previous actions, readiness score
- **Stage 2 (Starting Point)**: Topic, problem statement, current state rating, strengths, obstacles, resources
- **Stage 3 (Connect)**: Generated options, insights, challenges, barriers identified
- **Stage 4 (Finish)**: Goal statement, SMART criteria, action steps, obstacles, contingency plans
- **Stage 5 (Check Out)**: Key learnings, insights, session value rating, clarity level

**Key Point:** The `responses` column is a JSONB object that contains ALL the detailed information from that stage, including metrics and initial action item data.

---

### 2. **Secondary Storage: `coaching_sessions` Table**
Stores session metadata and the cached AI-generated summary.

**Table Schema:**
```sql
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_type TEXT ('coach_led' | 'self_coaching'),
  current_stage INTEGER (1-5),
  is_complete BOOLEAN DEFAULT FALSE,
  summary TEXT,                              -- Cached AI summary with metrics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**What's Stored:**
- Session metadata (type, completion status)
- **AI-generated summary** containing:
  - Executive Summary
  - Key Insights
  - **Goal Statement** (extracted from Stage 4)
  - **Action Plan** (extracted from Stage 4 action steps)
  - **Success Metrics** (extracted from Stage 4 SMART criteria & Stage 5)
  - Support & Accountability measures

**How it's Generated:**
- After Stage 5 completion, an API call to `/api/summary` generates the summary from all stage responses
- This summary is cached in the `summary` column using `saveSummary(sessionId, summary)`

---

### 3. **Derived Data: `action_plans` Table**
Stores structured action items extracted from the session summary and Stage 4 data.

**Table Schema:**
```sql
CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES coaching_sessions(id),
  title TEXT NOT NULL,
  description TEXT,
  goal_statement TEXT,
  smart_criteria JSONB,                    -- SMART criteria details
  priority INTEGER (1-5),
  status TEXT ('pending', 'in_progress', 'completed', 'blocked'),
  timeline_start DATE,
  timeline_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**What's Stored:**
- Individual action items with title, description, and priority
- SMART criteria as a JSON object
- Status tracking (pending → in_progress → completed)

**How Data Gets Here:**
1. Created from Stage 4 "Finish" action steps
2. Can be extracted from the AI summary via `/api/action-plans/create-from-summary`
3. Referenced in Action Plan Details page to display and manage actions

---

### 4. **Child Records: `milestones` Table**
Stores sub-tasks or milestones within each action plan.

**Table Schema:**
```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_plan_id UUID REFERENCES action_plans(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**What's Stored:**
- Milestone/sub-task details for each action plan
- Completion tracking

---

### 5. **Metadata: `users` Table**
Stores user information (for future authentication).

---

## Data Extraction Flow: Where Table and Details Pages Get Data

### **Action Plan Table (Main Page: `/action-plans`)**
```
stage_responses (all 5 stages)
    ↓
coaching_sessions.summary (AI-generated summary cached here)
    ↓
action_plans (extracted action items)
    ↓
ActionPlansTable component displays:
      • Coaching Theme (from session.summary)
      • Agreed Action (from action_plans.title)
      • Content (from action_plans.description)
      • Status, Priority, Due Date (from action_plans fields)
```

### **Action Plan Details Page: `/action-plans/[id]`**
```
action_plans table (by ID)
    ↓ (extracts session_id)
coaching_sessions (fetch full session metadata + summary)
    ↓
stage_responses (fetch all stages for this session)
    ↓ (AI summary generation if needed)
/api/summary endpoint
    ↓
SuccessMetrics component displays:
      • Metrics extracted from summary
      • Goal Statement (from Stage 4 → summary)
      • Action items with status tracking
```

---

## Key Data Locations

| Data Type | Primary Storage | Secondary/Cached | Used By |
|-----------|-----------------|------------------|---------|
| **Metrics Items** | `stage_responses` (Stage 4 SMART + Stage 5) | `coaching_sessions.summary` | `SuccessMetrics` component |
| **Action Items** | `stage_responses` (Stage 4 action_steps) | `action_plans` table | `ActionPlansTable`, `ActionPlanTable` |
| **Goal Statement** | `stage_responses` (Stage 4) | `action_plans.goal_statement`, `coaching_sessions.summary` | Details page header |
| **Session Context** | `coaching_sessions` | N/A | All pages (theme, session type, dates) |
| **Conversation History** | `stage_responses` | N/A | Session history view |

---

## How Data Flows During a Session

1. **User Completes Stage N** → Data saved to `stage_responses` via `saveStageResponse()`
2. **Session Complete (Stage 5)** → API call to `/api/summary`
3. **Summary Generated** → Cached in `coaching_sessions.summary` via `saveSummary()`
4. **Action Items Extracted** → Created as rows in `action_plans` via `saveActionPlans()`
5. **User Views Action Plan Details** → Pulls from `action_plans` + `coaching_sessions.summary`
6. **User Edits Action Item** → Updates `action_plans` via `updateActionPlan()`

---

## Important Notes

### Origin of Truth
- **`stage_responses` table is the primary origin** of all coaching session data
- All other tables derive from this source
- The JSONB `responses` column contains the complete, unstructured data from each stage

### Summary Caching Strategy
- The AI-generated summary is cached in `coaching_sessions.summary` to avoid regenerating it
- This summary is parsed to extract:
  - Success metrics (from SMART criteria + Stage 5 insights)
  - Action items (structured from unstructured action steps)
  - Themes/coaching focus areas

### Data Consistency
- `stage_responses` → `coaching_sessions.summary` → `action_plans`
- Changes to action items in the UI update `action_plans` table
- Original session data remains intact in `stage_responses` for audit/history

---

## Accessing Data Programmatically

### Get All Session Data
```typescript
import { getSession } from '@/lib/supabase/sessions';

const { session, stages } = await getSession(sessionId);
// session.summary contains the cached AI summary
// stages contains all stage_responses records
```

### Get Action Items for a Session
```typescript
import { getActionPlansBySession } from '@/lib/supabase/action-plans';

const actions = await getActionPlansBySession(sessionId);
```

### Update Action Items
```typescript
import { updateActionPlan } from '@/lib/supabase/action-plans';

await updateActionPlan(actionId, { 
  status: 'in_progress', 
  priority: 'high' 
});
```

### Get Cached Summary
```typescript
import { getCachedSummary } from '@/lib/supabase/sessions';

const summary = await getCachedSummary(sessionId);
```
