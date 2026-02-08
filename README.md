# Coda AI CLI

AI Agent-friendly CLI for Coda.io that prioritizes efficiency and security. Designed for AI agents with minimal commands and maximum information per API call.

## Features

- 🎯 **AI-Optimized**: Only 5 commands, focused on finding and reading
- 📦 **Multi-Format Output**: JSON (default), Tree view, TOON (Token-Oriented Object Notation)
- 🔍 **Smart Search**: Fuzzy search for docs/pages + direct docId API calls
- 📄 **Pagination Support**: Automatically handles large docs with 100+ pages
- 🌳 **Hierarchical Navigation**: Full page tree with parent-child relationships
- 🔐 **Secure**: File-based credential storage with proper permissions

## Installation

### Global Installation (Recommended)
```bash
npm install -g coda-ai
```

### Local Installation
```bash
npm install
npm run build
npm link
```

## Quick Start

1. Authenticate:
```bash
coda-ai auth
```

2. Find documents:
```bash
coda-ai find
```

3. Read a specific page:
```bash
coda-ai read --docId <docId> --pageId <pageId>
```

## Configuration

### Settings Location

The CLI looks for `settings.yaml` in the following order:
1. Current working directory (`./settings.yaml`)
2. Package installation directory
3. User home directory (`~/.coda-ai/settings.yaml`)

### Settings Format

```yaml
docs:
  - all  # or list specific doc IDs

commands:
  - whoami
  - find
  - read
```

### Credentials Storage

API tokens are stored securely in `~/.coda-ai/config.json` with 0600 permissions (read/write owner only).

## Commands

### Core Commands (5 total)

#### Authentication
```bash
coda-ai auth                    # Interactive authentication setup
coda-ai auth --from-file .env   # Load credentials from file
```

#### Utility
```bash
coda-ai whoami                  # Get current user information
```

#### Navigation & Reading (Primary Commands)

**`coda-ai find`** - Find documents and pages with hierarchical navigation

Options:
- `--format <type>` - Output format: `json`, `tree`, or `toon` (default: json)
- `--doc <query>` - Fuzzy search docs by name OR direct docId API call
- `--page <query>` - Fuzzy search pages by name (includes children when matched)

Examples:
```bash
# List all docs with page hierarchies
coda-ai find --format tree

# Fuzzy search for specific doc
coda-ai find --doc "playground"

# Direct API call with exact docId (skips fuzzy search)
coda-ai find --doc "61g6kPoSWt" --format json

# Search pages across all docs
coda-ai find --page "status" --format tree

# Combine doc and page search
coda-ai find --doc "wisdom" --page "sprint"
```

**`coda-ai read`** - Read page content with all resources

Options:
- `--docId <docId>` - Document ID (required)
- `--pageId <pageId>` - Page ID (required)
- `--format <type>` - Output format: `json`, `markdown`, or `html` (default: json)

Formats:
- `json`: Returns structured data (page metadata, tables with columns/sample rows, formulas, controls, content)
- `markdown`: Returns full page export as clean markdown
- `html`: Returns full page export as HTML with inline styles

Examples:
```bash
# Get structured page data
coda-ai read --docId 6g6kPoSWht --pageId canvas-L0mXFnB4T2

# Export page as markdown
coda-ai read --docId 6g6kPoSWht --pageId canvas-L0mXFnB4T2 --format markdown

# Export page as HTML
coda-ai read --docId 6g6kPoSWht --pageId canvas-L0mXFnB4T2 --format html
```

## Output Formats

### JSON (Default)
Structured data optimized for AI parsing. Docs use `docId`, pages use `pageId`.

```json
{
  "name": "My Doc",
  "docId": "abc123",
  "pages": [
    {
      "name": "My Page",
      "pageId": "xyz789",
      "child": [...]
    }
  ]
}
```

### Tree View
Visual hierarchical representation using Unicode box drawing characters.

```
└── My Doc (abc123)
    ├── Page 1 (xyz789)
    └── Page 2 (def456)
        └── Child Page (ghi123)
```

### TOON (Token-Oriented Object Notation)
Ultra-compact format for LLMs, reduces token usage by using schemas.

```
[1]:
  - name: My Doc
    docId: abc123
    pages[2]{name,pageId}:
      Page 1,xyz789
      Page 2,def456
```

## Search Features

### Fuzzy Search
- Uses Fuse.js with threshold 0.4
- Case-insensitive
- Matches partial names

### Search Behavior

**`--doc <query>`**: 
- If query matches docId pattern (10+ alphanumeric/underscore/dash) → Direct API call (no fuzzy search)
- Otherwise → Fuzzy search documents by name

**`--page <query>`**: 
- Fuzzy search pages by name with smart hierarchy
- When a page matches → includes ALL its children (preserves subtree)
- When a child matches → shows parent path + that child
- Maintains full hierarchy structure

Example: Searching for "status" on page "Development Status" returns all 16 sprint children under it.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Link for local testing
npm link

# Now you can use the command globally
coda-ai --help
```

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Development Mode

```bash
# Run directly from source (no build needed)
npm run dev -- auth
npm run dev -- find --format tree

# Or use the built version
npm run build
./dist/cli.js find --help
```

## Package Structure

```
coda-ai/
├── settings.yaml              # Default settings
├── src/
│   ├── cli.ts                 # Main entry point
│   ├── commands/              # 5 command implementations
│   │   ├── auth.ts
│   │   ├── whoami.ts
│   │   ├── settings.ts
│   │   ├── find.ts            # Primary: Find docs/pages
│   │   └── read.ts            # Primary: Read page content
│   └── lib/
│       ├── coda-client.ts     # API client with pagination
│       ├── auth-storage.ts    # Secure credential storage
│       ├── settings.ts        # Settings management
│       ├── validation.ts      # Zod schemas
│       └── formatters.ts      # Output formatting
├── tests/                     # 56 tests (100% coverage on libs)
└── dist/                      # Compiled output
```

## Technical Details

- **Language**: TypeScript with ESM modules
- **API Client**: Handles rate limiting, exponential backoff, pagination
- **Pagination**: Automatically fetches all pages (handles 100+ page docs)
- **Dependencies**: 
  - `commander`: CLI framework
  - `chalk`: Terminal colors
  - `ora`: Loading spinners
  - `fuse.js`: Fuzzy search
  - `@toon-format/toon`: TOON encoding
  - `zod`: Schema validation

## Design Philosophy

1. **Minimal Commands**: Only 5 commands (auth, whoami, settings, doc-inspect, page-inspect)
2. **Maximum Information**: Each command returns complete context with single call
3. **AI-First**: Output formats optimized for LLM consumption (JSON keys use explicit IDs)
4. **Search Integration**: Built-in fuzzy search to reduce iteration count
5. **No Comments**: Code is self-documenting following copilot-instructions.md

## License

Apache-2.0
