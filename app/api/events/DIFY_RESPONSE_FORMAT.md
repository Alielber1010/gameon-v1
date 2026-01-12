# How Dify Response Should Arrive at the API

## Expected Dify API Response Structure

When your Dify workflow is called via `/api/events/sync`, Dify returns a response in this format:

```json
{
  "workflow_run_id": "abc123",
  "task_id": "task456",
  "data": {
    "id": "run789",
    "workflow_id": "workflow123",
    "status": "succeeded",
    "outputs": {
      "success": true,
      "data": [
        {
          "id": "event-001",
          "title": "PETRONAS Malaysia Open 2026",
          "description": "Major badminton tournament...",
          "city": "Kuala Lumpur",
          "location": "Axiata Arena, Kuala Lumpur",
          "website": "https://corporate.bwfbadminton.com/events/calendar/",
          "image": ""
        }
      ],
      "count": 1
    },
    "elapsed_time": 2.5,
    "total_tokens": 1500,
    "created_at": 1234567890,
    "finished_at": 1234567891
  }
}
```

## Key Points

### 1. The JSON Must Be in `data.outputs`

Your workflow's output should be placed in the `outputs` field of Dify's response:

```
difyResponse.data.outputs = {
  "success": true,
  "data": [...],
  "count": 1
}
```

### 2. The `outputs` Can Be:
- **Object directly** (preferred):
  ```json
  {
    "success": true,
    "data": [...],
    "count": 1
  }
  ```

- **String that parses to JSON** (also handled):
  ```json
  {
    "outputs": "{\"success\":true,\"data\":[...],\"count\":1}"
  }
  ```

### 3. The API Parses Multiple Formats

The API will look for your JSON in these locations (in order):

1. `difyData.data.outputs.data` - If outputs has a `data` key
2. `difyData.data.outputs` - If outputs is a direct array
3. `difyData.data.outputs.events` - If outputs has an `events` key
4. Any array found in `outputs` object

### 4. Expected Structure Inside `outputs`

```json
{
  "success": true,        // Required: boolean
  "data": [               // Required: array of events
    {
      "title": "...",      // Required: string
      "description": "...", // Required: string
      "city": "...",       // Required: string
      "location": "...",   // Required: string
      "id": "...",        // Optional: string
      "website": "...",   // Optional: string (or "")
      "image": ""         // Optional: string (or "")
    }
  ],
  "count": 1              // Required: number (should match data.length)
}
```

## How the API Processes It

### Step 1: Dify API Call
```typescript
const response = await fetch('https://api.dify.ai/v1/workflows/run', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DIFY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputs: {},
    response_mode: 'blocking',
    user: 'gameon-cron-sync'
  })
})

const difyData = await response.json()
```

### Step 2: Check Status
```typescript
if (difyData.data.status !== 'succeeded') {
  // Error handling
}
```

### Step 3: Extract from `outputs`
```typescript
let parsedOutput = difyData.data.outputs

// If it's a string, parse it
if (typeof parsedOutput === 'string') {
  parsedOutput = JSON.parse(parsedOutput)
}

// Extract events array
let events = []
if (parsedOutput.data && Array.isArray(parsedOutput.data)) {
  events = parsedOutput.data  // ✅ This is what we want
}
```

### Step 4: Validate and Store
```typescript
// Validate each event has: title, description, city, location
// Store in database
```

## Example: What Dify Should Return

### ✅ CORRECT Format:

**Dify Workflow Output:**
```json
{
  "success": true,
  "data": [
    {
      "title": "PETRONAS Malaysia Open 2026",
      "description": "Major badminton tournament...",
      "city": "Kuala Lumpur",
      "location": "Axiata Arena, Kuala Lumpur",
      "website": "https://corporate.bwfbadminton.com/events/calendar/",
      "image": ""
    }
  ],
  "count": 1
}
```

**Dify API Response (what arrives at your API):**
```json
{
  "workflow_run_id": "...",
  "task_id": "...",
  "data": {
    "status": "succeeded",
    "outputs": {
      "success": true,
      "data": [
        {
          "title": "PETRONAS Malaysia Open 2026",
          "description": "Major badminton tournament...",
          "city": "Kuala Lumpur",
          "location": "Axiata Arena, Kuala Lumpur",
          "website": "https://corporate.bwfbadminton.com/events/calendar/",
          "image": ""
        }
      ],
      "count": 1
    }
  }
}
```

### ❌ WRONG Formats:

**Wrong 1: Missing wrapper**
```json
{
  "outputs": [
    {"title": "Event 1", ...}
  ]
}
```
❌ Should be: `outputs.data` (array inside `data` key)

**Wrong 2: Wrong structure**
```json
{
  "outputs": {
    "events": [...]
  }
}
```
⚠️ This will work (API checks for `events` key), but `data` is preferred

**Wrong 3: Missing required fields**
```json
{
  "outputs": {
    "data": [
      {"title": "Event 1"}  // Missing description, city, location
    ]
  }
}
```
❌ Will fail validation

## Summary

**Your Dify workflow should output:**
```json
{
  "success": true,
  "data": [array of events],
  "count": number
}
```

**Dify will wrap it as:**
```json
{
  "data": {
    "outputs": {
      "success": true,
      "data": [...],
      "count": 1
    }
  }
}
```

**The API extracts:**
- `difyData.data.outputs.data` → events array
- Validates each event
- Stores in database

## Testing

To test if your format is correct, check the API logs:
```
Dify workflow succeeded, extracting events from outputs...
Raw outputs: {...}
Parsed output structure: {...}
Found X events in parsedOutput.data
```

If you see "Found X events", the format is correct! ✅


