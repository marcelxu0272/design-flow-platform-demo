# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start development server on http://localhost:3000
pnpm build            # Build production bundle
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database setup (run in Supabase Dashboard SQL Editor)
# 1. Execute supabase/migrations/001_init_schema.sql - creates all tables
# 2. Execute supabase/migrations/002_rpc_functions.sql - creates RPC functions
# 3. Optional: Execute supabase/migrations/003_seed_data.sql - seed demo data
```

## Project Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: Shadcn/ui + Radix UI + Tailwind CSS v4
- **State**: Zustand (client) + TanStack Query (server) + Zundo (undo/redo)
- **Flow Editor**: ReactFlow (@xyflow/react) with Dagre auto-layout
- **Validation**: Zod + React Hook Form

### State Management Patterns

**Flow Editor State** (`lib/stores/useFlowStore.ts`):
Uses Zustand with `zundo` middleware for temporal state (undo/redo):
- Tracked in history: `nodes`, `edges`
- Excluded: `selectedNodeId`, `isDirty`, `isSaving`, `isReadOnly`, `lockHolder`
- History limit: 50 states with deep equality check

**Server State** (`lib/hooks/use*.ts`):
TanStack Query hooks for each domain:
- `useFlowModels()` - list flow models
- `useFlowModel(id)` - single model with nodes/edges
- `useSaveFlowModel(modelId)` - mutation with cache invalidation
- Pattern: Query keys use `["resource", id]` format; mutations invalidate on success

### Flow Editor Architecture

**Node Types** (`components/flow/nodes/`):
- `process` - Rectangular, supports input/output/param bindings
- `data_source` - Emerald/circular, outputs only
- `output` - Purple styled, inputs only

**Edit Locking** (`app/(main)/flow-models/[id]/page.tsx`):
Collaborative editing implemented via:
1. `acquire_flow_lock` RPC - 30-minute timeout
2. Heartbeat every 25 seconds via `setInterval`
3. Supabase Realtime subscription for lock changes
4. Auto-release on unmount via `release_flow_lock`
5. Read-only mode when lock held by another user

**Save Flow** (`app/api/flow-models/[id]/route.ts`):
Uses `upsert_flow_graph` RPC for atomic save:
- Deletes existing nodes/edges
- Inserts new nodes/edges
- Creates version snapshot in `flow_model_versions`
- Updates `locked_by` to null

### Database Patterns

**Schema Organization**:
- Data dictionary: `data_fields`, `data_sources`, `data_flows`, `field_dependencies`
- Flow: `flow_models`, `flow_nodes`, `flow_edges`, `node_field_bindings`, `flow_model_versions`
- Projects: `projects`, `project_fields`
- Documents: `documents`, `document_versions`, `document_audit_logs`

**Soft Delete Pattern**:
`data_fields` uses `deleted_at` timestamp; queries filter with `WHERE deleted_at IS NULL`

**Status Workflows**:
- Fields: `draft` → `published` → `deprecated`
- Documents: `draft` → `published`
- Flow Models: `draft` → `published`

**Key RPC Functions**:
- `upsert_flow_graph(p_model_id, p_nodes, p_edges, p_viewport, p_change_note)` - atomic save
- `acquire_flow_lock(p_model_id, p_user_id)` → `{ success, holder_id }`
- `check_field_dependency_cycle(p_from_field_id, p_to_field_id)` → boolean

### API Route Structure

```
app/api/
├── [resource]/route.ts              # GET list, POST create
├── [resource]/[id]/route.ts         # GET, PUT, DELETE single
└── [resource]/[id]/[action]/route.ts # POST special actions
```

All routes use `createClient()` from `lib/supabase/server.ts` (SSR cookie-based auth).

### Type System

**Database Types** (`lib/types/database.types.ts`):
- Row types: `DataFieldRow`, `FlowModelRow`, etc.
- Extended types with joins: `DataField extends DataFieldRow`, `DataFlow extends DataFlowRow { field?: DataField }`
- Supabase Database type exported for client typing

**Flow Types** (`lib/types/flow.types.ts`):
- `AppNode = Node<AppNodeData, NodeType>`
- `AppEdge = Edge<AppEdgeData, EdgeType>`
- `NodeType = "process" | "data_source" | "output"`
- `BindingRole = "input" | "output" | "param"`

### Styling Rules (from .cursor/rules/custom-rule.mdc)

- Theme color: `#007069`
- Page background: `#f8faff`
- Business-clean style, no gradients
- Modal dimensions fixed; only content area scrolls
- Page scroll disabled when modal opens
- All lists paginated, max 10 items per page
- Responsive design focused on PC displays

### Auto-Commit Hook (from .cursor/hooks/)

The `.cursor/hooks/auto-commit.ps1` runs on Cursor stop hook:
- Detects uncommitted changes (working, staged, untracked)
- Detects unpushed commits
- Outputs followup_message prompting Agent to commit and push

Important: The hook uses Base64-encoded messages to avoid encoding issues on Windows.

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Common Development Tasks

**Adding a new data field**:
1. Update `lib/types/database.types.ts` - add to DataFieldRow
2. Update `supabase/migrations/001_init_schema.sql` - add column
3. Update forms using `components/data-dictionary/FieldFormSheet.tsx`

**Adding a flow model API**:
1. Create route in `app/api/flow-models/[id]/[action]/route.ts`
2. Add hook in `lib/hooks/useFlowModels.ts` using useMutation
3. Invalidate cache: `qc.invalidateQueries({ queryKey: ["flow-model", id] })`

**Database migrations**:
- Always add new migrations as new files (e.g., `004_xxx.sql`)
- Do not modify existing migration files after they've been run
- Include both "up" and "down" when possible, or at least be idempotent
