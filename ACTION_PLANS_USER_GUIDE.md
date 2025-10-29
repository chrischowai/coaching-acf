# Action Plans Table - User Guide

## Overview
The Action Plans page now features a powerful table interface with inline filtering, making it easy to find and manage your coaching action items.

## Table Columns

### 1. Coaching Theme
- **What it shows**: The main focus or goal of the coaching session
- **Examples**: 
  - "vibe coding expert"
  - "Professional Development"
  - "Career Advancement"
- **Filter type**: Text search (real-time)
- **Use case**: Find all actions related to a specific coaching goal

### 2. Agreed Action
- **What it shows**: The specific action item you agreed to complete
- **Examples**:
  - "Apply for Claude Code Course"
  - "Secure Funds"
  - "Develop HR App"
- **Filter type**: Text search (real-time)
- **Use case**: Quickly find a specific action by name

### 3. Content
- **What it shows**: Full description of what needs to be done
- **Filter type**: Text search (real-time)
- **Use case**: Search within action descriptions for keywords

### 4. Status
- **Options**: Pending, In Progress, Completed
- **Visual**: Color-coded badges
  - 🔵 Pending
  - 🟡 In Progress
  - 🟢 Completed
- **Filter type**: Dropdown selection
- **Use case**: View only actions in a specific state

### 5. Priority
- **Options**: Low, Medium, High
- **Visual**: Color-coded indicators
  - 🟢 Low
  - 🟡 Medium
  - 🔴 High
- **Filter type**: Dropdown selection
- **Use case**: Focus on high-priority items

### 6. Due Date
- **Format**: MMM d, yyyy (e.g., "Jan 13, 2026")
- **Visual warnings**:
  - ⚠️ Red background = Overdue
  - ⏰ Amber background = Due soon (within 3 days)
- **Filter type**: Text search (matches any part of the date)
- **Use case**: Find actions due in a specific month or year

### 7. Actions
- **Buttons available**:
  - 👁️ **View** - See full details
  - ▶️ **Start** - Move from Pending to In Progress
  - ✅ **Done** - Mark In Progress as Completed
  - ✏️ **Amend** - Edit the action inline
  - 🗑️ **Delete** - Remove the action (requires confirmation)

## How to Use Filters

### Text Filters (Theme, Action, Content, Due Date)

1. **Start typing** in the filter box under any column header
2. Results update **instantly** as you type
3. Search is **case-insensitive**
4. Matches **partial text** anywhere in the field

**Example**:
- Type "code" in Theme filter → Shows all coaching themes containing "code"
- Type "Jan" in Due Date filter → Shows all actions due in January

### Dropdown Filters (Status, Priority)

1. **Click** the dropdown under the column header
2. **Select** your desired option
3. Results filter immediately
4. Choose **"All"** to clear the filter

**Example**:
- Select "In Progress" → Shows only actions currently being worked on
- Select "High" priority → Shows only high-priority actions

### Combining Filters

You can use **multiple filters together** for precise results:

**Example Combinations**:
- Theme: "coding" + Status: "Pending" → All pending actions related to coding
- Priority: "High" + Due Date: "Nov" → High-priority items due in November
- Action: "course" + Status: "In Progress" → In-progress actions about courses

### Clear Filters

When any filter is active, you'll see:
- A **blue banner** at the top saying "Filters active"
- A **"Clear all filters" button** to reset everything instantly
- Footer showing **"X of Y items"** (filtered vs total)

## Editing Actions

### Quick Edit (Inline)

1. Click the **"Amend" button** on any row
2. The row turns **blue** (edit mode)
3. **Modify** any field directly:
   - Action title
   - Description
   - Status (dropdown)
   - Priority (dropdown)
   - Due date (date picker)
4. Click **"Confirm?"** to save changes
5. Click **"Cancel"** to discard changes

### Tips:
- ✅ Changes are saved to both database and session summary
- ✅ Toast notification confirms successful save
- ⚠️ Action title is required (can't be empty)

## Deleting Actions

### Two-Step Confirmation

1. Click the **"Delete" button**
2. Button turns **red** and says **"Confirm?"**
3. **Click again within 3 seconds** to confirm deletion
4. If you wait, it automatically resets (safety feature)

### Tips:
- ✅ Prevents accidental deletions
- ✅ Updates both database and session summary
- ⚠️ Deletion is permanent (can't be undone)

## Status Workflow

Actions follow a natural progression:

```
Pending → Start → In Progress → Done → Completed
```

- **Pending**: Not started yet
  - Action: Click "Start" button
  
- **In Progress**: Currently working on it
  - Action: Click "Done" button
  
- **Completed**: Finished
  - Action: View details only

## Visual Indicators

### Row Colors
- **Normal**: White background
- **Overdue**: Red background with ⚠️ icon
- **Due Soon**: Amber background with ⏰ icon
- **Editing**: Blue background

### Hover Effects
- Row highlights in light gray when you hover
- Helps you see which row you're about to interact with

## Finding What You Need - Quick Guide

### "Show me all my overdue actions"
1. Look for rows with **red backgrounds**
2. OR: Type "overdue" in Action column filter (if actions are marked)

### "What am I working on right now?"
1. Status filter → Select **"In Progress"**

### "What's due this month?"
1. Due Date filter → Type the month name (e.g., "Nov")

### "All coding-related actions I haven't started"
1. Theme filter → Type "coding"
2. Status filter → Select "Pending"

### "High priority items due soon"
1. Priority filter → Select "High"
2. Check for amber-highlighted rows

## Tips for Power Users

1. **Bookmark with filters**: URL preserves filter state (if implemented)
2. **Regular cleanup**: Use filters to find completed items and archive them
3. **Priority triage**: Filter by "Pending" + "High" priority weekly
4. **Theme review**: Group by theme to see progress on specific goals
5. **Date planning**: Use due date filter for monthly planning

## Keyboard Shortcuts (Future Enhancement)
- `Ctrl + F`: Focus on first filter
- `Esc`: Clear all filters
- `Tab`: Move between filters
- `Enter`: Apply filter

## Troubleshooting

### "Filter not showing results"
- Check if spelling is correct (partial matches work)
- Try clearing other filters - they combine (AND logic)
- Click "Clear all filters" to start fresh

### "Can't edit an action"
- Make sure you're not already editing another row
- Check if the row is loading (spinner indicator)

### "Changes not saving"
- Check your internet connection
- Look for error toast messages
- Try refreshing the page and editing again

## Mobile Usage

- **Horizontal scroll**: Swipe left/right to see all columns
- **Filter inputs**: Full touch support
- **Buttons**: Large enough for finger taps
- **Responsive**: Table adapts to screen size

## Best Practices

1. **Use specific filters**: More specific = faster results
2. **Clear filters regularly**: Don't leave old filters active
3. **Check the footer**: Shows how many items match your filters
4. **Edit carefully**: Review changes before clicking "Confirm?"
5. **Regular reviews**: Filter by theme weekly to track progress

## Need Help?

If filters aren't working as expected:
1. Check the blue "Filters active" banner is showing
2. Try clearing all filters and starting over
3. Refresh the page if filters seem stuck
4. Check browser console for any error messages
