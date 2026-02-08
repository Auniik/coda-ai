# Coda AI

Use `coda-ai` to read coda.io pages in markdown format 

### Setup (once)
```bash
npm install -g coda-ai
coda-ai auth # --from-file path/to/.env
```

## Primary Workflow

### 1. Find Documents/Pages (TOON format recommended)
```bash
coda-ai find --doc "<doc name>" --page "<page name>" --format toon # (Recommended)
coda-ai find  # Returns all doc with pages (Token expensive)
coda-ai find --doc "project" --format toon       # Search by doc name
coda-ai find --page "user stories" --format toon # Search by page name
```

#### Example Output:
```
[14]:
  - name: Anik's Coda Playground 
    docId: 6g6kPoSWht                 <-- docId required to read page
    pages[5]{name,pageId}:
      My tasks,canvas-8xyEifYcpq      <-- pageId required to read page
      Notes and ideas,canvas-PRkVwFXft4
```

### 2. Read Page as Markdown
```bash
coda-ai read --docId <docId> --pageId <pageId> --format markdown
```

Use the `docId` and `pageId` from the find command response.


## Additional Commands

### Utility Commands
- `whoami`

### Alternative Find Formats
- `--format json`: Structured data with explicit IDs (default)
- `--format tree`: Visual hierarchy view

### Alternative Read Formats
- `--format json`: Structured page data (tables, formulas, metadata)
- `--format html`: HTML export with inline styles

For more details, refer to the [README](https://github.com/auniik/coda-ai/blob/main/README.md).
