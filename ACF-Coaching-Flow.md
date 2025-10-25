# ACF Coaching Conversation Model - Detailed Flow Documentation

## Overview

The ACF Coaching Model is a structured framework for conducting professional coaching conversations. It consists of five distinct stages that guide both coach and client through a transformative dialogue designed to facilitate self-discovery, goal achievement, and actionable outcomes. This model is suitable for corporate coaching, performance coaching, and developmental coaching contexts.

**Model Name:** ACF Coaching Model  
**Core Philosophy:** Non-directive, discovery-based questioning that empowers clients to find their own solutions  
**Application:** Enterprise coaching, organizational development, leadership coaching, performance improvement  

---

## Core Coaching Principles

Before implementing the five-stage flow, the coaching app should embody these foundational principles:

### 1. Non-Directive Approach
- Coach does not provide direct advice or solutions
- Questions are open-ended to encourage exploration
- Client maintains autonomy and ownership of decisions
- Coach facilitates thinking rather than directing outcomes

### 2. Discovery Questioning
- Questions designed to provoke deeper reflection
- Focus on "what" and "how" rather than "why"
- Avoid leading questions that impose coach's perspective
- Create space for client insights and breakthroughs

### 3. Four Conditions for Coaching Environment
- **Trust:** Establish psychological safety and confidentiality
- **Respect:** Honor client's unique perspective and experiences
- **Openness:** Create non-judgmental space for exploration
- **Partnership:** Collaborate as equals in the coaching relationship

### 4. Core Coaching Beliefs
- Clients have the resources and wisdom within themselves
- Every individual is capable of growth and change
- Powerful questions unlock potential and clarity
- Action and reflection drive sustainable transformation

---

## Five-Stage ACF Coaching Model Flow

---

## Stage 1: Check In (教練開端)

### Purpose
Establish rapport, create a safe space, transition client into coaching mindset, and set the tone for the session.

### Duration
5-10 minutes

### Key Objectives
1. Build connection and trust with the client
2. Assess client's current emotional and mental state
3. Review progress from previous session (if applicable)
4. Create presence and readiness for the coaching conversation

### Process Flow

#### 1.1 Opening & Greeting
**Actions:**
- Warm, genuine greeting
- Acknowledge the client's arrival
- Express appreciation for their time

**Sample Prompts for App:**
- "Welcome to today's coaching session. How are you feeling right now?"
- "Thank you for being here. What's your energy level as we begin?"
- "Before we dive in, how has your day been so far?"

#### 1.2 Establishing Presence
**Actions:**
- Help client transition from their busy day
- Invite mindfulness or grounding
- Create focused attention

**Sample Prompts for App:**
- "Let's take a moment to settle in. Take three deep breaths."
- "What do you need to set aside mentally to be fully present?"
- "How would you rate your presence on a scale of 1-10 right now?"

**Interactive Elements:**
- Breathing exercise timer (guided 3 deep breaths)
- Presence slider (1-10 scale)
- Mindfulness prompt with visual cues

#### 1.3 Review Previous Session (if applicable)
**Actions:**
- Briefly review action commitments from last session
- Celebrate wins and progress
- Acknowledge challenges without judgment

**Sample Questions:**
- "What actions did you commit to last time?"
- "What happened when you tried [specific action]?"
- "What successes did you experience since we last spoke?"
- "What challenges came up that we should address?"
- "What did you learn about yourself since our last conversation?"

**Interactive Elements:**
- Display previous session action items
- Progress tracking checkboxes
- Success celebration badges
- Challenge notation field

**Decision Point:**
- If client completed actions → Celebrate and explore learnings
- If client didn't complete actions → Explore barriers without judgment
- If partial completion → Acknowledge effort and investigate obstacles

#### 1.4 Emotional Check-In
**Actions:**
- Assess client's emotional state
- Identify any immediate concerns or celebrations
- Gauge readiness for coaching

**Sample Questions:**
- "How are you feeling emotionally right now?"
- "What's present for you today?"
- "On a scale of 1-10, how would you rate your emotional state?"
- "Is there anything weighing on your mind that you'd like to share?"

**Interactive Elements:**
- Emotion cards selection (happy, stressed, excited, anxious, confident, uncertain, etc.)
- Mood meter (visual scale)
- Word cloud of feeling words
- Optional journal entry field

#### 1.5 Transition to Session Focus
**Actions:**
- Shift from check-in to session agenda
- Prepare client for deeper work
- Confirm readiness to proceed

**Sample Transition Statements:**
- "Now that we've checked in, what would you like to focus on today?"
- "What's the most important topic for us to explore in this session?"
- "What outcome would make this session valuable for you?"

### Indicators of Successful Check-In
- Client appears relaxed and present
- Emotional state has been acknowledged
- Previous commitments reviewed (if applicable)
- Client is ready to engage in deeper conversation
- Trust and rapport are evident

### Technical Implementation Notes
```
Stage: CHECK_IN
Status Tracking: {
  presence_level: integer (1-10),
  emotional_state: string/array,
  previous_actions_reviewed: boolean,
  readiness_score: integer (1-10),
  session_start_timestamp: datetime
}

Transition Condition: 
- User confirms readiness to proceed
- Minimum presence_level >= 5
```

---

## Stage 2: A - Starting Point (現況起點)

### Purpose
Establish the current reality, identify the specific issue or topic for coaching, and create clarity about where the client is starting from.

### Duration
10-15 minutes

### Key Objectives
1. Define the coaching topic/agenda for the session
2. Explore the current situation in detail
3. Assess the client's starting point objectively
4. Understand context, constraints, and current resources

### Process Flow

#### 2.1 Setting the Coaching Agenda
**Actions:**
- Identify the specific topic or challenge
- Clarify what the client wants to work on
- Ensure topic is appropriate for coaching
- Confirm mutual understanding of the focus

**Core Coaching Agenda Questions:**
- "What would you like to focus on today?"
- "What specific topic or challenge do you want to explore?"
- "What's on your mind that feels most important right now?"
- "If you could solve one thing in this session, what would it be?"
- "What issue, if resolved, would make the biggest difference for you?"

**Clarification Questions:**
- "Tell me more about that."
- "What does [specific term] mean to you?"
- "Can you give me an example?"
- "What makes this important to you right now?"
- "Why is this topic coming up now?"

**Interactive Elements:**
- Topic selector (pre-populated categories: Leadership, Career, Performance, Relationships, Goals, Decision-Making, Conflict, Other)
- Free-text topic input
- Importance rating slider (1-10)
- Urgency indicator

**Decision Point:**
- If topic is clear and coachable → Proceed to current situation exploration
- If topic is vague → Ask more clarifying questions
- If topic is outside coaching scope → Redirect or refer

#### 2.2 Defining the Problem/Challenge
**Actions:**
- Help client articulate the specific challenge
- Distinguish between symptoms and root issues
- Identify what makes this a problem for the client

**Defining Questions:**
- "What is the real challenge here for you?"
- "How would you describe this situation?"
- "What's happening that shouldn't be happening?"
- "What's not happening that should be happening?"
- "What makes this challenging for you specifically?"
- "What's the impact of this situation on you?"

**Depth Exploration Questions:**
- "What else is connected to this issue?"
- "What are the different layers of this challenge?"
- "What's beneath that?"
- "What's the core issue?"

**Interactive Elements:**
- Challenge definition text field
- Issue mapping tool (visual representation)
- Impact assessment matrix
- Root cause exploration diagram

#### 2.3 Assessing Current Reality
**Actions:**
- Establish objective view of current situation
- Identify what's working and what isn't
- Explore strengths, resources, and obstacles
- Understand relevant context and constraints

**Current Reality Questions:**
- "Where are you now regarding this issue?"
- "What have you tried so far?"
- "What's working well in this area?"
- "What's not working?"
- "What resources do you currently have?"
- "What constraints are you facing?"
- "Who else is involved in this situation?"
- "What's under your control and what isn't?"

**Assessment Questions:**
- "On a scale of 1-10, where are you now regarding [topic]?"
- "What's your current satisfaction level with this area?"
- "How long has this been going on?"
- "What patterns do you notice?"

**Situational Context Questions:**
- "What's the background to this situation?"
- "What led to this point?"
- "What have been the key turning points?"
- "What's changed recently?"

**Interactive Elements:**
- Current state assessment scale (1-10)
- "Wheel of Life" style assessment for multi-dimensional topics
- Timeline builder for situation history
- Strength/weakness identifier
- Resource inventory checklist
- Constraint mapping tool

#### 2.4 Understanding Perspectives
**Actions:**
- Explore client's viewpoint
- Identify assumptions and beliefs
- Consider multiple perspectives on the situation

**Perspective Questions:**
- "How do you see this situation?"
- "What do you make of it?"
- "What assumptions are you making?"
- "How might others see this differently?"
- "What perspective might you be missing?"
- "What's your intuition telling you?"
- "What do you believe about this situation?"

**Interactive Elements:**
- Perspective mapping tool
- Assumption identifier
- Belief explorer
- Multi-stakeholder view diagram

#### 2.5 Situational Listening
**Actions:**
- Practice deep, active listening
- Listen for emotions, values, and underlying themes
- Notice what's said and what's not said
- Reflect back what you hear

**Listening Techniques:**
- Paraphrasing: "What I'm hearing is..."
- Reflecting: "It sounds like you're feeling..."
- Summarizing: "So to summarize, you're saying..."
- Checking: "Am I understanding correctly that...?"

**Reflection Questions:**
- "What I heard you say was [X]. Is that accurate?"
- "It seems like [emotion/theme] is present for you. Am I reading that right?"
- "You mentioned [A] and [B]. How do these connect?"
- "What am I missing?"

**Interactive Elements:**
- Coach summary display
- "Am I understanding correctly?" verification checkpoints
- Theme identification tags
- Emotional tone tracker

### Indicators of Successful Starting Point Stage
- Coaching topic/agenda is clearly defined
- Current situation is well understood by both parties
- Client has articulated the specific challenge
- Objective assessment of reality has been established
- Context and constraints are identified
- Client feels heard and understood

### Technical Implementation Notes
```
Stage: STARTING_POINT
Status Tracking: {
  topic: string,
  topic_importance: integer (1-10),
  problem_defined: boolean,
  current_state_rating: integer (1-10),
  strengths_identified: array,
  obstacles_identified: array,
  resources_available: array,
  context_notes: string,
  key_themes: array
}

Transition Condition:
- Topic clearly defined
- Current reality assessed
- Client confirms understanding is accurate
```

---

## Stage 3: C - Connect (連接技術)

### Purpose
Bridge the gap between current reality and desired future, explore possibilities, generate options, and deepen insights through powerful questioning.

### Duration
15-20 minutes (longest stage)

### Key Objectives
1. Facilitate deep exploration and discovery
2. Generate multiple options and possibilities
3. Challenge assumptions and limiting beliefs
4. Create insights and "aha" moments
5. Connect client's values with potential actions
6. Explore different perspectives and creative solutions

### Process Flow

#### 3.1 Exploring Possibilities & Options
**Actions:**
- Encourage creative thinking
- Generate multiple pathways forward
- Suspend judgment during brainstorming
- Think beyond obvious solutions

**Possibility Questions:**
- "What options do you have?"
- "What else could you do?"
- "What are all the possible ways to approach this?"
- "What if there were no constraints—what would you do?"
- "What would you try if you knew you couldn't fail?"
- "What's one unconventional approach you haven't considered?"
- "What are three different ways to move forward?"

**Elaboration Questions:**
- "What else?"
- "Tell me more about that option."
- "What other possibilities exist?"
- "What are you not thinking of yet?"
- "What might you be overlooking?"

**Interactive Elements:**
- Options brainstorming board
- "What else?" prompt loop (appears 3-5 times)
- Idea capture cards
- Option prioritization matrix
- Constraint removal thought exercise

**Decision Point:**
- Continue expanding options until 3-5 viable possibilities emerge
- If client struggles to generate options → Use hypothetical questions
- If options are limited → Challenge assumptions about constraints

#### 3.2 Creating More Choices (Expanded Thinking)
**Actions:**
- Push beyond first responses
- Encourage divergent thinking
- Break patterns of limited thinking
- Access creative solutions

**Expanded Thinking Questions:**
- "What would [role model/mentor] do in this situation?"
- "If you were advising a friend with this challenge, what would you suggest?"
- "What's a completely different approach you haven't mentioned?"
- "What would the bold version of you do?"
- "What would you do if you had unlimited resources?"
- "What's the opposite of your current approach?"

**Reframing Questions:**
- "How else could you look at this situation?"
- "What if this challenge were actually an opportunity?"
- "What's another way to interpret what happened?"
- "What positive intention might be behind this obstacle?"

**Interactive Elements:**
- Perspective-shifting cards
- Role reversal tool
- Opposite thinking exercise
- "If you were..." role-play scenarios

#### 3.3 Challenging Assumptions & Barriers
**Actions:**
- Identify limiting beliefs
- Question what's assumed to be true
- Explore what's really holding client back
- Distinguish real from perceived barriers

**Challenging Questions:**
- "What's stopping you?"
- "What's really stopping you?"
- "What are you assuming about this situation?"
- "Is that assumption true? How do you know?"
- "What if that weren't true?"
- "What would happen if you did [action]?"
- "What's the worst that could happen? Could you handle that?"
- "What are you making this mean?"

**Barrier Exploration Questions:**
- "What obstacles do you anticipate?"
- "Which obstacles are real and which are perceived?"
- "What internal barriers exist (fear, doubt, beliefs)?"
- "What external barriers exist (time, resources, people)?"
- "What barrier feels most significant?"
- "How have you overcome similar barriers before?"

**Interactive Elements:**
- Assumption identifier tool
- Barrier categorization (internal vs. external)
- Reality-checking matrix
- Fear vs. fact distinguisher
- Past success reference library

#### 3.4 Forward-Looking Thinking (Anticipation)
**Actions:**
- Project into the future
- Visualize success
- Anticipate outcomes of different choices
- Create motivation through vision

**Future-Oriented Questions:**
- "What's possible?"
- "What is the dream outcome?"
- "What does success look like for you?"
- "If this works out exactly as you want, what will be different?"
- "What will you see, hear, and feel when you've achieved this?"
- "How will your life change when you reach this goal?"
- "What impact will solving this have?"
- "Who will you become through this process?"

**Anticipation Questions:**
- "What's exciting to you about this?"
- "What does your intuition tell you?"
- "What opportunity is here?"
- "What's the upside?"
- "What are you hoping for?"

**Interactive Elements:**
- Vision board creation tool
- Success visualization exercise
- Future-self letter writing
- Outcome projection timeline
- Impact mapping diagram

#### 3.5 Stepwise/Chunking Technique (分段式技巧)
**Actions:**
- Break large goals into smaller steps
- Make overwhelming challenges manageable
- Identify immediate next actions
- Create momentum through quick wins

**Chunking Questions:**
- "What's the first small step you could take?"
- "How can you break this down into smaller pieces?"
- "What's the minimum viable action?"
- "What could you do in the next 24 hours?"
- "What's the easiest part to start with?"
- "What's one thing you could do right now?"
- "What would progress look like in the short term vs. long term?"

**Sequencing Questions:**
- "What needs to happen first?"
- "Then what?"
- "What's the logical sequence?"
- "What are the key milestones?"

**Interactive Elements:**
- Goal breakdown tool
- Step sequencer
- Milestone mapper
- Quick wins identifier
- 24-hour action planner

#### 3.6 Resource Identification
**Actions:**
- Identify available resources
- Recognize strengths and capabilities
- Explore support systems
- Build confidence through resource awareness

**Resource Questions:**
- "What resources do you have to support this?"
- "What strengths can you leverage?"
- "Who could help you with this?"
- "What have you done successfully in similar situations?"
- "What skills do you have that apply here?"
- "What support do you need?"
- "What's already working that you can build on?"

**Interactive Elements:**
- Resource inventory tool
- Strengths assessment
- Support network mapper
- Past success archive
- Skills matcher

#### 3.7 Deepening Insights (Discovery Moments)
**Actions:**
- Create space for reflection
- Notice patterns and connections
- Facilitate breakthrough thinking
- Capture emerging insights

**Insight-Generating Questions:**
- "What are you noticing?"
- "What's becoming clear to you?"
- "What are you learning about yourself?"
- "What patterns do you see?"
- "What's the connection between [A] and [B]?"
- "What does this tell you?"
- "What insight is emerging for you?"
- "What's the 'aha' moment here?"

**Deepening Questions:**
- "What's beneath that?"
- "What else?"
- "Say more about that."
- "What makes that significant?"
- "How does that resonate for you?"

**Interactive Elements:**
- Insight capture journal
- Pattern recognition tool
- Connection mapper
- Reflection pause prompts
- "Aha moment" logger

### Discovery Questioning Technique (Core of Connect Stage)

Discovery questions are open-ended questions designed to help clients discover answers within themselves rather than being told what to do.

**Characteristics of Discovery Questions:**
- Open-ended (cannot be answered with yes/no)
- Begin with "What" or "How" (avoid "Why" which can be defensive)
- Focus on the client's perspective
- Invite exploration and curiosity
- Create thinking space
- No embedded advice

**Discovery Question Types:**

1. **Clarification Questions**
   - "What do you mean?"
   - "What does [term] mean to you?"
   - "Can you say more?"

2. **Elaboration Questions**
   - "What else?"
   - "Tell me more."
   - "What other ideas do you have?"

3. **Assessment Questions**
   - "What do you make of it?"
   - "How does it look to you?"
   - "What resonates for you?"

4. **Evaluation Questions**
   - "What's the opportunity here?"
   - "What's the challenge?"
   - "How does this fit with your plans?"

5. **Action-Oriented Questions**
   - "What would you like to do?"
   - "What's your next step?"
   - "How will you move forward?"

### Indicators of Successful Connect Stage
- Client has generated multiple options (3-5 minimum)
- New perspectives and insights have emerged
- Limiting beliefs or assumptions have been challenged
- Client shows signs of breakthrough thinking
- Energy and engagement have increased
- Possibilities feel more expansive than at start
- Client demonstrates ownership and self-discovery

### Technical Implementation Notes
```
Stage: CONNECT
Status Tracking: {
  options_generated: array (min 3),
  insights_captured: array,
  assumptions_challenged: array,
  barriers_identified: array,
  resources_identified: array,
  future_vision_defined: boolean,
  breakthrough_moments: array,
  energy_level: integer (1-10)
}

Transition Condition:
- Minimum 3 options generated
- Client expresses clarity or insight
- Sufficient exploration completed
- Client ready to move toward action
```

---

## Stage 4: F - Finish (完成目標)

### Purpose
Translate insights and options into concrete goals and action plans, establish commitment, and create accountability.

### Duration
10-15 minutes

### Key Objectives
1. Define clear, specific goals
2. Select best option(s) from exploration stage
3. Create concrete action plan
4. Establish accountability measures
5. Anticipate obstacles and plan for them
6. Generate commitment and motivation

### Process Flow

#### 4.1 Goal Clarification & Selection
**Actions:**
- Choose which option(s) to pursue
- Define specific goal or outcome
- Ensure goal is meaningful to client
- Align goal with values and vision

**Goal Selection Questions:**
- "What do you want to achieve?"
- "Which option feels right to you?"
- "What are you committed to doing?"
- "What outcome do you want to create?"
- "Of all the options we explored, which resonates most?"
- "What would you like to take action on?"

**Clarification Questions:**
- "What specifically do you want to happen?"
- "What will that look like?"
- "How will you know you've achieved it?"
- "What does success look like specifically?"

**Alignment Questions:**
- "Why is this important to you?"
- "How does this align with your values?"
- "What will achieving this give you?"
- "What will be different when you reach this goal?"

**Interactive Elements:**
- Goal selection tool (from options generated)
- Goal statement builder
- Importance rating (1-10)
- Values alignment checker
- Visual goal representation

#### 4.2 SMART Goal Setting
**Actions:**
- Make goals Specific, Measurable, Achievable, Relevant, Time-bound
- Ensure clarity and actionability
- Test goal for realism and motivation

**SMART Framework:**

**Specific:**
- "What exactly will you do/achieve?"
- "Who is involved?"
- "Where will it happen?"
- "What are the details?"

**Measurable:**
- "How will you measure progress?"
- "How will you know you've succeeded?"
- "What metrics will you use?"
- "What will you see, hear, or feel when achieved?"

**Achievable:**
- "Is this realistic given your resources?"
- "Do you have the skills needed?"
- "What might make this difficult?"
- "How confident are you that you can do this? (1-10)"

**Relevant:**
- "Why does this matter to you?"
- "How does this fit with your bigger picture?"
- "Is this the right goal at this time?"
- "What will this enable for you?"

**Time-bound:**
- "When will you complete this?"
- "What's your deadline?"
- "What's your timeline?"
- "When will you start?"

**Interactive Elements:**
- SMART goal builder wizard
- Confidence slider (1-10)
- Timeline selector
- Success criteria definition
- Measurement dashboard setup

#### 4.3 Action Planning
**Actions:**
- Define specific action steps
- Create timeline
- Identify resources needed
- Assign responsibility (especially if others involved)

**Action Planning Questions:**
- "What specific actions will you take?"
- "What's the first step?"
- "What's the second step?"
- "When will you take each action?"
- "What do you need to make this happen?"
- "Who needs to be involved?"
- "What support do you need?"

**Detailed Action Questions:**
- "What exactly will you do?"
- "Where will you do this?"
- "When specifically will you do this?"
- "How long will it take?"
- "What will you need?"

**Sequencing Questions:**
- "What needs to happen first?"
- "Then what?"
- "What's the order of operations?"

**Interactive Elements:**
- Action plan template
- Step-by-step task builder
- Timeline/calendar integration
- Resource checklist
- Task priority sorter
- Dependencies mapper

#### 4.4 Obstacle Anticipation & Planning
**Actions:**
- Anticipate potential obstacles
- Create contingency plans
- Build resilience into plan
- Prepare for setbacks

**Obstacle Questions:**
- "What might get in the way?"
- "What obstacles do you anticipate?"
- "What could derail this?"
- "What's your biggest concern?"
- "What might stop you from following through?"

**Contingency Planning Questions:**
- "If [obstacle] happens, what will you do?"
- "How will you handle setbacks?"
- "What's your Plan B?"
- "Who can help if you get stuck?"
- "What will you do if you lose motivation?"

**Resilience Questions:**
- "How have you overcome obstacles before?"
- "What resources can you draw on when things get tough?"
- "What will keep you going?"
- "How will you remind yourself why this matters?"

**Interactive Elements:**
- Obstacle identifier
- Risk assessment matrix
- Contingency plan builder
- If-then planning tool
- Support escalation plan

#### 4.5 Commitment & Accountability
**Actions:**
- Secure clear commitment
- Establish accountability measures
- Create external accountability if helpful
- Define how progress will be tracked

**Commitment Questions:**
- "On a scale of 1-10, how committed are you to this action?"
- "What would it take to make it a 10?"
- "Are you saying yes to this?"
- "What are you saying no to by committing to this?"
- "What will keep you accountable?"
- "How will you track your progress?"

**Accountability Questions:**
- "When will you check in on your progress?"
- "Who will you tell about this commitment?"
- "How can I best support your accountability?"
- "What consequences will help you stay on track?"
- "How do you want to be held accountable?"

**Interactive Elements:**
- Commitment scale (1-10)
- Commitment adjustment tool
- Accountability preference selector
- Progress tracking dashboard
- Check-in reminder scheduler
- Accountability partner notification

#### 4.6 Motivation & Confidence Building
**Actions:**
- Strengthen motivation
- Build confidence
- Connect to bigger purpose
- Celebrate decision to act

**Motivation Questions:**
- "What excites you about this?"
- "What will be possible when you achieve this?"
- "How will you feel when this is done?"
- "What's inspiring about this journey?"
- "What's pulling you forward?"

**Confidence Questions:**
- "What makes you confident you can do this?"
- "What strengths will help you succeed?"
- "What have you accomplished before that's similar?"
- "What's already going well that you can build on?"
- "What do you need to believe about yourself to make this happen?"

**Interactive Elements:**
- Motivation visualizer
- Confidence builder
- Past success reminder
- Strength reinforcement tool
- Vision reminder (from Connect stage)

### Coaching Feedback Technique

Effective coaching feedback is descriptive, specific, and empowering rather than evaluative or directive.

**Coaching Feedback Questions:**
- "What did you notice when you...?"
- "What worked well?"
- "What would you do differently next time?"
- "What did you learn?"
- "How could you build on this?"

### Indicators of Successful Finish Stage
- Clear, specific goal has been defined
- Goal meets SMART criteria
- Concrete action plan with steps and timeline exists
- Potential obstacles have been anticipated
- Client demonstrates strong commitment (8+ on 1-10 scale)
- Accountability measures are in place
- Client feels confident and motivated
- Next steps are crystal clear

### Technical Implementation Notes
```
Stage: FINISH
Status Tracking: {
  goal_statement: string,
  goal_type: string,
  smart_criteria_met: boolean,
  action_steps: array of {
    action: string,
    deadline: datetime,
    resources_needed: array,
    responsible_party: string
  },
  obstacles_anticipated: array,
  contingency_plans: array,
  commitment_level: integer (1-10),
  confidence_level: integer (1-10),
  accountability_method: string,
  next_check_in: datetime
}

Transition Condition:
- Goal defined and meets SMART criteria
- Minimum 1 action step committed
- Commitment level >= 7
- Client confirms readiness to proceed
```

---

## Stage 5: Check Out (總結領悟)

### Purpose
Consolidate learnings, reflect on the session, capture key insights, acknowledge progress, and close the session powerfully.

### Duration
5-10 minutes

### Key Objectives
1. Summarize key insights and takeaways
2. Reflect on the coaching process
3. Reinforce commitments made
4. Acknowledge growth and progress
5. Express appreciation
6. Close with positive energy and clarity

### Process Flow

#### 5.1 Session Summary
**Actions:**
- Recap the journey of the session
- Highlight key moments and insights
- Connect beginning to end of session
- Create coherent narrative of session

**Summary Prompts:**
- "Let's take a moment to reflect on our conversation today."
- "We started with [topic] and explored [key areas]."
- "I noticed several important insights emerged..."
- "Here's what I heard you commit to..."

**Coach Summary Questions:**
- "What were the key themes of our conversation?"
- "What stood out most in our discussion?"
- "What ground did we cover today?"

**Interactive Elements:**
- Auto-generated session summary display
- Key themes visualization
- Session journey map
- Highlight reel of insights

#### 5.2 Key Learnings & Insights
**Actions:**
- Invite client to articulate what they learned
- Capture insights in client's own words
- Reinforce breakthrough moments
- Create lasting memory of discoveries

**Learning Questions:**
- "What was most useful for you in this session?"
- "What are you taking away from our conversation?"
- "What did you learn about yourself today?"
- "What insights are you leaving with?"
- "What was your biggest 'aha' moment?"
- "What surprised you?"
- "What became clear that wasn't clear before?"

**Deepening Questions:**
- "What does that mean for you?"
- "How will this insight serve you?"
- "What shift happened for you today?"
- "What's different now compared to when we started?"

**Interactive Elements:**
- Learning journal entry
- Insight capture cards
- "Aha moment" gallery
- Takeaway selector
- Personal reflection notes

#### 5.3 Commitment Reinforcement
**Actions:**
- Recap action commitments
- Confirm clarity on next steps
- Reinforce accountability
- Build confidence for execution

**Reinforcement Questions:**
- "What are you committed to doing before our next session?"
- "What's the first action you'll take?"
- "When exactly will you do this?"
- "What will remind you of your commitment?"
- "On a scale of 1-10, how clear are you on your next steps?"

**Clarity Check Questions:**
- "Is there anything about your action plan that's unclear?"
- "What questions do you have?"
- "What might you need that we haven't discussed?"
- "What final thoughts do you have about your commitments?"

**Interactive Elements:**
- Action plan summary display
- Commitment reminder
- Calendar/task export function
- Confidence check (1-10)
- Clarity check (1-10)

#### 5.4 Reflection on Coaching Process
**Actions:**
- Invite feedback on session
- Assess effectiveness of coaching
- Strengthen coaching relationship
- Continuous improvement

**Process Reflection Questions:**
- "How was this session for you?"
- "What worked well in our conversation today?"
- "What would have made this even better?"
- "How are you feeling now compared to when we started?"
- "Was there something you wanted to discuss that we didn't cover?"
- "What would be helpful to explore next time?"

**Feedback Questions:**
- "On a scale of 1-10, how valuable was this session?"
- "What was most helpful about the way I coached you today?"
- "Is there anything I could have done differently?"
- "How can I best support you going forward?"

**Interactive Elements:**
- Session rating scale (1-10)
- Feedback form
- Session value assessment
- Coach effectiveness rating
- Improvement suggestions field

#### 5.5 Acknowledgment & Appreciation
**Actions:**
- Acknowledge client's effort and growth
- Celebrate courage and vulnerability
- Express genuine appreciation
- Build confidence and positive regard

**Acknowledgment Statements:**
- "I want to acknowledge [specific quality/action] I saw in you today."
- "I noticed your courage in [specific moment]."
- "The growth you've shown in [area] is significant."
- "You demonstrated real insight when you [specific example]."

**Appreciation Prompts:**
- "Thank you for your openness today."
- "I appreciate your willingness to explore deeply."
- "Your commitment to growth is inspiring."
- "It's a privilege to support you in this journey."

**Interactive Elements:**
- Acknowledgment display
- Strengths highlighted
- Progress celebrated
- Growth badges/achievements

#### 5.6 Next Steps & Closing
**Actions:**
- Confirm next session if applicable
- Provide encouragement
- Close with positive energy
- Leave client empowered and motivated

**Closing Questions:**
- "When shall we meet next?"
- "What support do you need between now and then?"
- "What will you do to stay connected to your insights?"
- "How will you celebrate your progress?"

**Closing Statements:**
- "I look forward to hearing about your progress."
- "I'm confident in your ability to [achieve goal]."
- "Go forward with clarity and purpose."
- "Trust yourself and your insights."

**Inspirational Close:**
- "You have everything you need within you."
- "I believe in your capacity to create the change you want."
- "This is your journey, and you're navigating it beautifully."

**Interactive Elements:**
- Next session scheduler
- Session completion confirmation
- Progress tracker reset
- Motivational message
- Session export/download option
- Gratitude expression tool

### Self-Discovery Coaching Questions (Optional Deep Reflection)

These optional questions can be included for clients who want to go deeper in self-reflection:

**Identity & Values:**
- "What did today's conversation reveal about what matters most to you?"
- "Who are you when you're at your best?"
- "What values guided your choices today?"

**Growth & Learning:**
- "What pattern did you notice about yourself?"
- "What old belief are you ready to let go of?"
- "What new possibility are you stepping into?"

**Future Self:**
- "How will you be different after taking these actions?"
- "What will your future self thank you for?"
- "Who are you becoming through this process?"

### Indicators of Successful Check Out Stage
- Client can articulate key learnings
- Action commitments are clear and confirmed
- Client feels positive energy and motivation
- Insights are captured and documented
- Client expresses satisfaction with session
- Coaching relationship is strengthened
- Client leaves with clarity and confidence
- Appreciation and acknowledgment exchanged

### Technical Implementation Notes
```
Stage: CHECK_OUT
Status Tracking: {
  key_learnings: array,
  insights_captured: array,
  action_commitments_confirmed: boolean,
  session_value_rating: integer (1-10),
  clarity_level: integer (1-10),
  client_feedback: string,
  next_session_scheduled: datetime,
  session_end_timestamp: datetime,
  session_notes_exported: boolean
}

Completion Condition:
- Key learnings captured
- Action commitments reviewed
- Session rated by client
- Client confirms completion
```

---

## Additional Coaching Techniques & Tools

### 7W2H Self-Coaching Framework

The 7W2H framework provides comprehensive question prompts for thorough exploration:

**What:**
- What is the situation?
- What do you want?
- What's working/not working?
- What are your options?
- What will you do?

**Why:**
- Why is this important?
- Why now?
- Why does this matter?
- Why do you want this?

**When:**
- When will you start?
- When will you finish?
- When is the deadline?
- When will you review progress?

**Where:**
- Where will this happen?
- Where are you now?
- Where do you want to be?
- Where will you get support?

**Who:**
- Who is involved?
- Who can help?
- Who needs to know?
- Who are you in this?

**Which:**
- Which option is best?
- Which step comes first?
- Which resources will you use?
- Which approach feels right?

**How:**
- How will you do this?
- How will you know you've succeeded?
- How will you overcome obstacles?
- How will you stay motivated?

**How Much:**
- How much time will it take?
- How much effort is needed?
- How much support do you need?
- How much progress have you made?

**How Many:**
- How many steps are there?
- How many resources do you need?
- How many options do you have?
- How many people are involved?

### 8 Core Corporate Coaching Skills

1. **Coaching Agenda Setting** - Establish clear focus for session
2. **Problem Definition** - Clarify the real challenge
3. **Creating Choices** - Generate multiple options
4. **Chunking/Stepwise Technique** - Break goals into manageable steps
5. **Forward-Looking Thinking** - Project into desired future
6. **Summary & Follow-up** - Consolidate and plan next steps
7. **Situational Listening** - Deep, contextual active listening
8. **Coaching Feedback** - Descriptive, empowering feedback

### Powerful Question Types

**Opening Questions:**
- "What's on your mind?"
- "What would you like to focus on?"
- "What's most important to discuss today?"

**Exploration Questions:**
- "What else?"
- "Tell me more."
- "What do you make of that?"

**Clarification Questions:**
- "What do you mean by...?"
- "Can you give me an example?"
- "What specifically...?"

**Challenge Questions:**
- "What's stopping you?"
- "What are you assuming?"
- "What if that weren't true?"

**Future Questions:**
- "What do you want?"
- "What's possible?"
- "What would success look like?"

**Action Questions:**
- "What will you do?"
- "When will you start?"
- "What's your next step?"

**Learning Questions:**
- "What did you learn?"
- "What insight emerged?"
- "What's becoming clear?"

**Closing Questions:**
- "What was most useful?"
- "What are you taking away?"
- "What's your commitment?"

### Motivation Coaching Technique

To increase motivation when client seems hesitant:

**Assess Motivation:**
- "On a scale of 1-10, how motivated are you to do this?"

**If Low (Below 7):**
- "What would make it a 10?"
- "What's holding you back?"
- "Is this the right goal?"
- "What would you rather do instead?"
- "What's the cost of not doing this?"
- "What's the benefit of doing this?"

**Reconnect to Why:**
- "Why does this matter to you?"
- "What will this give you?"
- "How will your life be better?"
- "What's the bigger purpose?"

---

## Coaching Session Structure Summary

### Quick Reference Flow

**1. CHECK IN (5-10 min)**
- Greeting & connection
- Establish presence
- Review previous actions
- Emotional check-in
- Transition to session

**2. STARTING POINT (10-15 min)**
- Set coaching agenda
- Define problem/challenge
- Assess current reality
- Explore context & perspectives
- Active listening & reflection

**3. CONNECT (15-20 min)**
- Explore possibilities & options
- Create more choices
- Challenge assumptions
- Forward-looking thinking
- Chunk/break down approach
- Identify resources
- Generate insights

**4. FINISH (10-15 min)**
- Clarify & select goals
- Apply SMART criteria
- Create action plan
- Anticipate obstacles
- Establish commitment & accountability
- Build confidence & motivation

**5. CHECK OUT (5-10 min)**
- Summarize session
- Capture learnings & insights
- Reinforce commitments
- Reflect on process
- Acknowledge & appreciate
- Schedule next steps

**Total Session Time:** 45-70 minutes (typical: 60 minutes)

---

## Coaching Conversation Guidelines

### Do's:
✅ Ask open-ended questions
✅ Listen actively and deeply
✅ Be curious and non-judgmental
✅ Trust the client's wisdom
✅ Pause for reflection
✅ Follow client's energy and interests
✅ Celebrate insights and progress
✅ Hold client accountable lovingly
✅ Maintain confidentiality
✅ Stay present and focused

### Don'ts:
❌ Give advice or tell clients what to do
❌ Jump to solutions
❌ Make assumptions
❌ Judge or criticize
❌ Interrupt or dominate conversation
❌ Ask leading questions
❌ Share your own stories excessively
❌ Fix or rescue the client
❌ Rush the process
❌ Ask "why" questions repeatedly (can be defensive)

---

## Interactive App Features Recommendations

### Essential Features:

1. **Session Timer & Stage Tracker**
   - Visual progress through 5 stages
   - Time allocation per stage
   - Stage transition prompts

2. **Dynamic Question Bank**
   - Context-aware question suggestions
   - Categorized by stage and purpose
   - Searchable and filterable
   - Randomized to keep fresh

3. **Note-Taking & Documentation**
   - Session notes (auto-save)
   - Client insights capture
   - Action item recorder
   - Goal tracker

4. **Visual Tools**
   - Scales & sliders (1-10 ratings)
   - Emotion wheels
   - Mind mapping
   - Timeline builders
   - Wheel of Life assessments
   - SMART goal builder
   - Action plan templates

5. **Progress Tracking**
   - Session history
   - Goal progress dashboard
   - Completed actions log
   - Insight library
   - Growth metrics

6. **Reminders & Accountability**
   - Action reminders
   - Session scheduling
   - Progress check-ins
   - Motivational messages

7. **Reflection & Feedback**
   - Post-session reflection prompts
   - Session effectiveness rating
   - Continuous improvement tracking
   - Client feedback collection

8. **Export & Sharing**
   - Session summary PDF
   - Action plan export
   - Calendar integration
   - Email/notification options

9. **Coach Support Tools**
   - Coaching tips & reminders
   - Best practice guides
   - Real-time suggestions
   - Technique tutorials

10. **Customization**
    - Personalized question libraries
    - Custom workflows
    - Branding options
    - Client profiles

---

## Data Structure Recommendations

### Session Object:
```javascript
{
  sessionId: "unique-id",
  coachId: "coach-id",
  clientId: "client-id",
  sessionNumber: 1,
  date: "2025-10-23T15:00:00Z",
  duration: 60, // minutes
  
  checkIn: {
    presenceLevel: 8,
    emotionalState: ["focused", "curious"],
    previousActionsReviewed: true,
    previousActionsCompleted: ["action-1", "action-2"],
    readiness: 9
  },
  
  startingPoint: {
    topic: "Improving team communication",
    topicCategory: "Leadership",
    importance: 9,
    problemStatement: "Team members not sharing critical information",
    currentStateRating: 4,
    strengths: ["Strong relationships", "Good intentions"],
    obstacles: ["Busy schedules", "Different communication styles"],
    resources: ["Team meetings", "Slack channel", "Manager support"],
    keyThemes: ["trust", "systems", "accountability"]
  },
  
  connect: {
    optionsGenerated: [
      "Weekly team stand-ups",
      "Shared communication protocol",
      "Information dashboard"
    ],
    insightsCaptured: [
      "People want to share but don't know how",
      "No system exists, relying on memory"
    ],
    assumptionsChallenged: [
      "Team is unwilling to communicate"
    ],
    barriers: ["Time constraints", "Change resistance"],
    resourcesIdentified: ["Project management tool", "IT support"],
    futureVisionDefined: "Seamless information flow",
    energyLevel: 9
  },
  
  finish: {
    goal: "Implement weekly 15-minute team stand-up meetings",
    goalType: "Process improvement",
    smartCriteriaMet: true,
    actionSteps: [
      {
        action: "Schedule recurring meeting",
        deadline: "2025-10-25",
        resourcesNeeded: ["Calendar access"],
        responsible: "Client"
      },
      {
        action: "Create meeting agenda template",
        deadline: "2025-10-27",
        resourcesNeeded: ["Template examples"],
        responsible: "Client"
      }
    ],
    obstaclesAnticipated: ["Scheduling conflicts"],
    contingencyPlans: ["Asynchronous updates if absent"],
    commitmentLevel: 9,
    confidenceLevel: 8,
    accountabilityMethod: "Report at next session",
    nextCheckIn: "2025-10-30"
  },
  
  checkOut: {
    keyLearnings: [
      "Creating systems is more effective than hoping for change",
      "Team wants structure"
    ],
    sessionValueRating: 9,
    clarityLevel: 10,
    clientFeedback: "Very helpful, feeling clear and motivated",
    nextSessionScheduled: "2025-10-30T15:00:00Z",
    completed: true
  },
  
  notes: "Client had breakthrough about systems vs. individuals",
  tags: ["leadership", "communication", "team-management"]
}
```

### Client Profile Object:
```javascript
{
  clientId: "unique-id",
  name: "Client Name",
  email: "client@example.com",
  coachingAreaFocus: ["Leadership", "Career Development"],
  startDate: "2025-01-15",
  sessions: ["session-1", "session-2", "session-3"],
  overallGoals: [
    "Become more confident leader",
    "Improve team performance"
  ],
  strengths: ["Empathy", "Strategic thinking"],
  growthAreas: ["Delegation", "Difficult conversations"],
  preferences: {
    communicationStyle: "Direct",
    sessionLength: 60,
    reminderPreference: "Email + SMS"
  }
}
```

---

## Best Practices for Implementation

### For Coaches:
1. **Trust the Process** - Follow the 5-stage structure
2. **Stay Curious** - Maintain genuine curiosity about client's perspective
3. **Less is More** - Short, powerful questions better than long explanations
4. **Silence is Golden** - Allow pauses for thinking
5. **Follow Energy** - Notice where client's energy increases
6. **Be Present** - Put aside distractions and your agenda
7. **Celebrate Growth** - Acknowledge progress and insights
8. **Practice Self-Reflection** - Review your own coaching performance

### For App Design:
1. **Intuitive Flow** - Visual progress through stages
2. **Flexible Structure** - Allow movement between stages as needed
3. **Context-Aware** - Suggest relevant questions based on current stage
4. **Save Progress** - Auto-save everything, never lose data
5. **Visual Clarity** - Clean, uncluttered interface
6. **Quick Access** - Frequent actions easily accessible
7. **Smart Defaults** - Pre-fill common patterns, allow customization
8. **Multi-Device** - Seamless experience across devices
9. **Offline Capability** - Core features work without internet
10. **Privacy First** - Secure, confidential data handling

---

## Quality Indicators & Success Metrics

### Session Effectiveness:
- Client rates session 8+ out of 10
- Clear insights articulated
- Concrete actions committed
- Client demonstrates increased clarity
- Energy level higher at end than beginning

### Coaching Quality:
- Ratio of questions to statements (goal: 80/20)
- Open-ended vs. closed questions (goal: 90/10)
- Client talk time vs. coach talk time (goal: 70/30)
- Number of insights generated by client
- Commitment level to actions (goal: 8+)

### Client Progress:
- Action completion rate
- Goal achievement rate
- Growth in self-awareness
- Increased self-sufficiency
- Positive life changes reported

---

## Conclusion

The ACF Coaching Conversation Model provides a robust, proven framework for conducting transformational coaching sessions. By following the five stages—Check In, Starting Point, Connect, Finish, and Check Out—coaches can facilitate powerful conversations that lead to genuine insights, committed actions, and sustainable growth.

The model's emphasis on non-directive questioning, client autonomy, and discovery-based learning ensures that clients develop their own solutions and build lasting capability. When implemented in an interactive app, this framework can democratize professional coaching and make high-quality coaching conversations accessible to broader audiences.

The key to successful implementation is maintaining fidelity to the core principles while allowing flexibility in execution. Trust the process, trust the client, and trust that powerful questions unlock powerful potential.

---

## References & Further Reading

- ACF (Association for Coaching and Facilitation) Certified Coach® Level 1 materials
- GROW Coaching Model
- ICF (International Coaching Federation) Core Competencies
- Co-Active Coaching methodology
- Motivational Interviewing techniques
- Michael Bungay Stanier's "The Coaching Habit"
- Sir John Whitmore's "Coaching for Performance"

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Purpose:** Detailed flow documentation for ACF Coaching App development  
**Intended Use:** Vibre coding with Claude Code or similar AI development tools