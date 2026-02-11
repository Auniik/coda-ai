# Coda.io AI CLI

AI-friendly CLI for Coda.io with minimal commands and structured output.

## Installation

```bash
npm install -g coda-ai
```


## Quick Start

```bash
coda-ai auth                                         # Setup authentication
coda-ai docs                                         # List documents
coda-ai pages --docId <docId>                        # List pages
coda-ai read --docId <docId> --pageId <pageId>       # Read page content
```

## Commands

### `auth`
Configure Coda API authentication.

```bash
coda-ai auth                    # Interactive setup
coda-ai auth --from-file .env   # Load from file
```

### `whoami`
Get current user info.

```bash
coda-ai whoami
```

### `docs`
List all documents (sorted by most recent update).

```bash
coda-ai docs --compact          # Only docId and name. recommended for AI Agents
coda-ai docs                    # Toon format (default)
coda-ai docs --format json      # JSON format
coda-ai docs --format table     # Table view
```

### `pages`
List pages in a document with hierarchy.

```bash
coda-ai pages --docId <docId> --compact          # Only pageId and name. recommended for AI Agents
coda-ai pages --docId <docId>                    # Toon format (default)
coda-ai pages --docId <docId> --format json      # JSON format
coda-ai pages --docId <docId> --format tree      # Tree view
```

### `read`
Read page content.

```bash
coda-ai read --docId <docId> --pageId <pageId>                  # Markdown (default)
coda-ai read --docId <docId> --pageId <pageId> --format json    # Structured data
coda-ai read --docId <docId> --pageId <pageId> --format html    # HTML export
```

## Output Formats

- **toon** - Compact format for AI agents (default for docs/pages)
- **json** - Structured JSON
- **markdown** - Clean markdown (default for read)
- **html** - HTML export
- **tree** - Visual hierarchy
- **table** - Human-readable table

## Configuration

### Credentials
Stored in `~/.coda-ai/config.json` with 0600 permissions.

To remove stored credentials:

```bash
coda-ai logout
```

## Development

```bash
npm install
npm run build
npm link
npm test
```

## License

Apache-2.0
