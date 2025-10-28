# How to Apply the Summary Caching Fix

## Quick Start

### Step 1: Update Database Schema
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run this SQL command:

```sql
ALTER TABLE coaching_sessions 
ADD COLUMN summary TEXT;
```

### Step 2: Verify the Change
Run this query to confirm the column was added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coaching_sessions';
```

You should see `summary` listed with type `text`.

### Step 3: That's It!
The code changes are already implemented. Once you run the SQL migration, the caching will work automatically.

## What Happens Next

### For New Sessions
- When a user completes a coaching session and views the summary for the first time
- The AI generates the summary
- It's saved to the database
- All future views show this cached version

### For Existing Sessions
- Sessions completed before this fix will have `summary = NULL`
- The first time someone views an old session's summary, it will generate and cache
- After that, it works like new sessions

## Testing the Fix

1. **Complete a test session** (or use an existing one)
2. **View the summary** - First load might take a few seconds
3. **Navigate away and come back** - Should load instantly now
4. **Check Action Plan Details** - Should show the same summary content
5. **Try the "Regenerate Summary" button** - Should update with new content

## Rollback (if needed)

If you need to remove the summary column:

```sql
ALTER TABLE coaching_sessions 
DROP COLUMN summary;
```

## Troubleshooting

### Issue: "Column already exists" error
**Solution:** The column was already added. You're good to go!

### Issue: Summary still regenerating every time
**Solution:** Check browser console for errors. Verify the API is receiving `sessionId`.

### Issue: "Regenerate Summary" button not appearing
**Solution:** This is expected on first view. Refresh the page after the summary loads.

## Additional Notes

- No data loss will occur
- Existing summaries won't be affected
- The change is backward compatible
- No restart of your app is required
