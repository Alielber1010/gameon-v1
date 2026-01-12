# Fix for "Invalid context structure" Error in Dify

## Problem

The Google Search tool returns the full API response structure:
```json
{
  "kind": "customsearch#search",
  "url": {...},
  "queries": {...},
  "context": {...},
  "searchInformation": {...},
  "spelling": {...},
  "items": [...]
}
```

But the LLM node expects just the search results (`items` array), not the entire wrapper.

## Solution Options

### Option 1: Use Code Node to Extract Items (Recommended)

Add a **Code Node** between Google Search and LLM:

1. **Add Code Node** after Google Search
2. **Input Variable**: Connect from Google Search output
3. **Code**:
```python
def main(search_response):
    # Extract just the items array from the Google Search response
    if isinstance(search_response, dict):
        # Handle full API response
        items = search_response.get('items', [])
        return {
            'items': items,
            'total_results': search_response.get('searchInformation', {}).get('totalResults', '0')
        }
    elif isinstance(search_response, list):
        # Already an array, return as is
        return {'items': search_response}
    else:
        return {'items': []}
```

4. **Output Variable**: `search_results`
5. **Connect**: Code Node output → LLM Node input

### Option 2: Update LLM Prompt to Handle Full Response

Update your LLM prompt to extract from the full structure:

```
You are extracting sports events from Google Search API response. 

The search results are in the 'items' array of the response. Each item has:
- title: Page title
- link: URL
- snippet: Description
- displayLink: Domain name

Extract ONLY events that:
- Take place IN Malaysia
- Are scheduled for 2026
- Are actual sports events (not calendars)

From the provided data, access the 'items' array and extract event information.

Output format: [same JSON schema as before]
```

### Option 3: Use Variable Selector in Dify

1. In the **LLM Node**, go to **Variable** settings
2. Instead of using the full Google Search output, select the specific path: `{{#google_search.items#}}`
3. This will pass only the `items` array to the LLM

## Recommended Fix (Step by Step)

1. **Add Code Node** between Google Search and LLM
2. **Code**:
```python
def main(search_output):
    # Extract items from Google Search response
    if 'items' in search_output:
        return search_output['items']
    elif isinstance(search_output, list):
        return search_output
    else:
        return []
```

3. **Output Variable Name**: `search_items`
4. **Update LLM Node** to use `{{#code_node.search_items#}}` instead of the Google Search output
5. **Update LLM Prompt** to work with the items array directly:

```
Extract sports events from the Google Search results array. Each item in the array contains:
- title: Event/page title
- link: Event URL
- snippet: Event description
- displayLink: Website domain

Filter for ONLY Malaysia events in 2026, then extract:
- title: Event name
- description: From snippet (1-3 sentences)
- city: Malaysian city
- location: Venue/location from snippet
- website: From link field
- image: "" (empty)

Output JSON matching the schema.
```

## Quick Fix (If Code Node Not Available)

Update your LLM prompt to handle the full structure:

```
The Google Search results are in the 'items' array. Access it like this:

{{#google_search.items#}}

Or if that doesn't work, the full response structure is:
- search_output.items = array of search results
- Each item has: title, link, snippet, displayLink

Extract events from search_output.items array.
```

## Testing

After applying the fix:
1. Run the workflow
2. Check the Code Node output (should be just the items array)
3. Check LLM Node input (should receive items array, not full response)
4. Verify the output matches your JSON schema


