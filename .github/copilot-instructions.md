# Coda AI CLI

AI-friendly CLI for Coda.io that prioritizes efficiency and security.

## Project Goal

Node.js + TypeScript CLI similar to [jira-ai](https://github.com/festoinc/jira-ai) for Coda.io. Enable AI agents to interact with Coda efficiently with strong security boundaries.

## References

- **Jira-AI Reference**: `/Users/anik/dev/auniik/jira-ai-main`
- **API Docs**: https://coda.io/developers/apis/v1
- **OpenAPI**: `https://coda.io/apis/v1/openapi.json`
- **Phase Tracking**: `./memory/PHASE-<number>.md`

## Stack

Node.js ≥18, TypeScript strict, ESM, commander, zod, vitest, chalk, cli-table3, ora, inquirer

## Structure

```
src/
├── cli.ts              # Entry with shebang
├── commands/           # Per phase (see memory/)
├── lib/
│   ├── coda-client.ts  # API client + rate limiting
│   ├── auth-storage.ts # Secure credentials
│   ├── settings.ts     # Restrictions
│   ├── formatters.ts   # Minimal output
│   ├── validation.ts   # Zod schemas
│   └── utils.ts
└── types/errors.ts
```

## Authentication

Store tokens in OS keychain. Support `.env` files. Never log credentials.

```env
CODA_API_TOKEN=token-here
CODA_BASE_URL=https://coda.io/apis/v1
```

## Settings (settings.yaml)

Granular control:

```yaml
docs: [all]
commands: [whoami, docs, rows]
operations:
  rows: [read, create, update]
```

## Command Pattern

1. Validate inputs (zod)
2. Check settings/restrictions
3. Execute API call
4. Format output (minimal tokens)
5. Return structured data

**All commands detailed in `./memory/PHASE-*.md`**

## API Client

```typescript
class CodaClient {
  async get<T>(endpoint, params?): Promise<T>
  async post<T>(endpoint, body?): Promise<T>
  async paginate<T>(endpoint): AsyncGenerator<T>
  private handleRateLimit(response): Promise<void>
}
```

- Base: `https://coda.io/apis/v1`
- Auth: `Bearer <token>`
- Rate limit: Exponential backoff on 429

## Output

**Lists** → Tables | **Details** → JSON

```
ID       Name              Modified
-------  ----------------  ----------
abc123   Project Tracker   2026-02-01
```

```json
{"id": "abc123", "name": "Project Tracker", "tables": [...]}
```

## Testing (TDD Required)

**Coverage**: 100% for auth/client/settings/validation, ≥90% for commands

```bash
npm test              # All tests
npm run test:watch    # TDD mode
npm run test:coverage # Must pass 90% threshold
```

**Workflow**: RED (write test) → GREEN (implement) → REFACTOR

## Key API Patterns

### Pagination
- Response: `items`, `nextPageToken`, `nextPageLink`
- Use `pageToken` for next page (don't re-send other params)

### Async Operations
- Write ops return HTTP 202 + `requestId`
- Poll `GET /mutationStatus/{requestId}` for completion

### Row Operations
- Upsert: Use `keyColumns` for unique match
- Query: Coda formula syntax (e.g., `Status="Active"`)

### Resource IDs
- API accepts IDs or names
- Prefer IDs (immutable, names can change)
- Doc ID pattern: `_d([\w-]+)`

## Coding Standards

1. **No comments** - Self-documenting code, no docstring, comments
2. **No summaries** - Code speaks, no extra explanation, no summary docs.
3. **Ask when uncertain** - Pair programming style
4. **Strict TypeScript** - No `any` without reason
5. **ESM only** - `.js` extensions in imports
6. **Error handling** - Always handle, never swallow
7. **Validation** - All inputs via zod
8. **Security** - Never log credentials

### Code Style
- `async/await` over promises
- `const` over `let`, never `var`
- Early returns, small functions
- Descriptive names, no abbreviations
- DRY method
- Consistent formatting (Prettier)
- Don't over-engineer - YAGNI applies
- Single responsibility per module
- No global state - pass dependencies explicitly
- Use utility functions for shared logic
- Avoid deep nesting - flatten with early returns or helper functions
- Prefer composition over inheritance for code reuse
- Use TypeScript's type system to enforce correctness, not comments
- Handle errors gracefully with try/catch and informative messages

## NPM Scripts

```json
{
  "dev": "tsx src/cli.ts",
  "build": "tsc && chmod +x dist/cli.js",
  "link": "npm run build && npm link",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## Decision Making

When uncertain:
1. Ask questions - don't guess
2. Reference jira-ai patterns
3. Check API docs from ./Coda API.postman_collection.json
4. Suggest options with tradeoffs
5. Wait for confirmation

### Example Questions to Ask
- "Should we support multiple auth profiles?"
- "How to handle doc selection - interactive or require ID?"
- "What's the command priority for Phase X?"
