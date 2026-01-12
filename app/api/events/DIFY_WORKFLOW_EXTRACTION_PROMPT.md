# Dify Workflow Prompt for Extracting Malaysia Sports Events

## Prompt for LLM Node (After Google Search)

```
You are extracting sports events information from Google Search results. Your task is to identify ONLY events that take place in Malaysia in 2026, and format them into structured JSON.

## Your Task

1. **Filter Results**: Only extract events that:
   - Take place IN Malaysia (not international calendars)
   - Are scheduled for 2026
   - Are actual sports events (not calendars, not general pages)

2. **Extract Event Information**: For each Malaysia event found, extract:
   - **title**: Official event name (e.g., "PETRONAS Malaysia Open 2026")
   - **description**: 1-3 sentence description of what the event is
   - **city**: Malaysian city name (e.g., "Kuala Lumpur", "Putrajaya", "Penang")
   - **location**: Full location/venue (e.g., "Kompleks Sukan Air Putrajaya Presint 6, Putrajaya")
   - **website**: Official event website URL if found in search results
   - **image**: Event image URL if available (optional)

3. **Focus on Specific Events**: Look for:
   - Event names with dates
   - Specific venues in Malaysia
   - Event descriptions
   - Official event websites

4. **Ignore**: 
   - Generic calendar pages
   - International events not in Malaysia
   - General sports information pages
   - Pages without specific event details

## Search Results Analysis

From the provided search results, look for:
- Snippets mentioning "Malaysia" + event name + "2026"
- Links to official event pages
- Specific venues in Malaysian cities
- Event dates and locations

## Output Format

Return ONLY valid JSON matching this exact schema:

```json
{
  "success": true,
  "data": [
    {
      "id": "event-001",
      "title": "Event Name",
      "description": "1-3 sentence description",
      "city": "Malaysian City",
      "location": "Full venue address",
      "website": "https://event-website.com",
      "image": "https://event-image-url.com/image.jpg"
    }
  ],
  "count": 1
}
```

**JSON Schema**: The output must strictly follow the schema defined in `DIFY_JSON_SCHEMA.json`. Required fields: `success`, `data`, `count`. Each event in `data` must have: `title`, `description`, `city`, `location`. Optional fields: `id`, `website`, `image`.

## Important Rules

- **Only Malaysia Events**: If no Malaysia-specific events are found, return empty array: `{"success": true, "data": [], "count": 0}`
- **Be Specific**: Extract actual event details, not generic calendar information
- **Validate Data**: Only include events with at minimum: title, description, city, location
- **No Guessing**: If information is missing, use empty string "" for optional fields
- **Return Valid JSON**: No markdown, no explanations, just the JSON object

## Example Extraction

**From Search Result:**
- Title: "PETRONAS Malaysia Open 2026"
- Snippet: "06 - 11 JANUARY. $1,450,000 PRIZE MONEY"
- Link: "corporate.bwfbadminton.com/events/calendar/"

**Extracted Event:**
```json
{
  "id": "event-001",
  "title": "PETRONAS Malaysia Open 2026",
  "description": "Major badminton tournament in Malaysia featuring top international players. Prize money of $1,450,000. Scheduled for January 6-11, 2026.",
  "city": "Kuala Lumpur",
  "location": "Axiata Arena, Kuala Lumpur",
  "website": "https://corporate.bwfbadminton.com/events/calendar/",
  "image": ""
}
```

**From Search Result:**
- Snippet: "Kompleks Sukan Air Putrajaya Presint 6, Malaysia. 2026 Asia Triathlon Cup Putrajaya"

**Extracted Event:**
```json
{
  "id": "event-002",
  "title": "2026 Asia Triathlon Cup Putrajaya",
  "description": "Continental Cup triathlon event featuring sprint and standard distance races. Part of the Asia Triathlon Cup series.",
  "city": "Putrajaya",
  "location": "Kompleks Sukan Air Putrajaya Presint 6, Putrajaya",
  "website": "https://triathlon.org/events",
  "image": ""
}
```

Now analyze the provided search results and extract ONLY Malaysia sports events for 2026. Return the JSON format above.
```

## Alternative Shorter Version

```
Extract ONLY sports events taking place in Malaysia in 2026 from the search results.

**Filter**: Only events in Malaysia, scheduled for 2026, with specific event details.

**Extract for each event**:
- title: Event name
- description: 1-3 sentences
- city: Malaysian city
- location: Full venue address
- website: Official URL (if found)
- image: Image URL (optional)

**Ignore**: Generic calendars, international events, pages without specific event details.

**Output**: Valid JSON only:
{
  "success": true,
  "data": [
    {
      "id": "event-001",
      "title": "...",
      "description": "...",
      "city": "...",
      "location": "...",
      "website": "...",
      "image": ""
    }
  ],
  "count": 1
}

If no Malaysia events found, return: {"success": true, "data": [], "count": 0}
```

## How to Use in Dify Workflow

1. **Add Google Search Node**: Search for "Upcoming Sports events in Malaysia 2026 Calendar"
2. **Add LLM Node**: Use the prompt above
3. **Connect**: Google Search output → LLM Node input
4. **Output**: LLM Node should return the JSON structure

## Tips for Better Results

1. **Refine Search Query**: Instead of just "Upcoming Sports events in Malaysia 2026 Calendar", try:
   - "Malaysia sports events 2026 dates venues"
   - "2026 Malaysia marathon triathlon badminton events"
   - "Upcoming Malaysia sports competitions 2026"

2. **Add Multiple Searches**: Create parallel search nodes for different sports:
   - "Malaysia marathon 2026"
   - "Malaysia badminton tournament 2026"
   - "Malaysia triathlon 2026"

3. **Post-Process**: Add a code node to merge results from multiple searches and remove duplicates

4. **Validation**: Add a validation step to ensure all required fields are present before output

## Expected Output from Your Current Search

Based on your search results, you should extract:
- PETRONAS Malaysia Open 2026 (Badminton)
- 2026 Asia Triathlon Cup Putrajaya
- Grand Prix of Malaysia 2026 (MotoGP)

These are the only clear Malaysia-specific events in the results. The rest are generic calendars.

