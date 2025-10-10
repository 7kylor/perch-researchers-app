<!-- 505b0d9c-9d21-484c-af32-6e4bbaf41b5b 7e976d11-0a99-4170-b5cb-d15d58d575e1 -->
# Sidebar Overhaul: Data, Logic, UX, and Features

## Goals

- Hybrid persistence: database-backed via IPC/SQLite with localStorage cache for instant load.
- Structure: support both flat list and nested folders/groups with drag-and-drop.
- UX: minimal, accessible, keyboard-first, and performant; small, focused components.
- Strict typing: shared types between main and renderer; zero any.
- Clean-up: remove persisting React nodes; delete unused/local-only code paths.

## Key existing code touchpoints

- Local-only categories and context menu are here:
```36:47:/Users/taher/researchers-app/src/renderer/ui/components/LibrarySidebar.tsx
  // Load categories from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('categories');
    if (saved) {
      try {
        const savedCategories = JSON.parse(saved);
        setCategories(savedCategories);
      } catch (error) {
        console.error('Error loading categories from localStorage:', error);
      }
    }
  }, []);
```
```65:77:/Users/taher/researchers-app/src/renderer/ui/components/LibrarySidebar.tsx
  const handleAddCategory = () => {
    const categoryName = prompt('Enter category name:');
    if (categoryName?.trim()) {
      const newCategory: Category = {
        id: `category-${Date.now()}`,
        name: categoryName.trim(),
        count: 0,
        icon: <Layers className="h-3 w-3" />, // will migrate to iconKey string
        color: '#6b7280',
      };
      const updatedCategories = [...categories, newCategory];
      saveCategoriesToStorage(updatedCategories);
    }
  };
```


## Data model (DB + renderer)

- New shared types in `src/shared/sidebar.ts`:
```ts
export type SidebarNodeType = 'folder' | 'label';
export interface SidebarNodeBase { id: string; parentId: string | null; type: SidebarNodeType; name: string; iconKey: string | null; colorHex: string | null; orderIndex: number; createdAt: string; updatedAt: string; }
export interface SidebarFolder extends SidebarNodeBase { type: 'folder'; }
export interface SidebarLabel extends SidebarNodeBase { type: 'label'; }
export type SidebarNode = SidebarFolder | SidebarLabel;
export interface SidebarPrefs { collapsedNodeIds: string[]; sidebarCollapsed: boolean; version: number; updatedAt: string; }
export interface CategoryCount { nodeId: string; paperCount: number; }
```

- DB tables (extend `src/main/db/schema.ts` + migration in `openDatabase`/init):
```ts
export const sidebarNodes = sqliteTable('sidebar_nodes', {
  id: text('id').primaryKey().notNull(),
  parentId: text('parentId'), // null for roots
  type: text('type').notNull(), // 'folder' | 'label'
  name: text('name').notNull(),
  iconKey: text('iconKey'),
  colorHex: text('colorHex'),
  orderIndex: integer('orderIndex').notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});
export const paperCategories = sqliteTable('paper_categories', {
  paperId: text('paperId').notNull(),
  nodeId: text('nodeId').notNull(),
  createdAt: text('createdAt').notNull(),
});
export const sidebarPrefs = sqliteTable('sidebar_prefs', {
  id: text('id').primaryKey().notNull(), // singleton: 'default'
  payload: text('payload').notNull(), // JSON of SidebarPrefs
  updatedAt: text('updatedAt').notNull(),
});
```


## Persistence strategy (hybrid)

- Source of truth: SQLite; localStorage used as warm cache.
- On boot: read `localStorage.sidebarCache` -> render; then fetch DB via IPC -> reconcile newest by `updatedAt` and `version`, update local cache.
- On change: optimistic update UI, update local cache, persist via IPC; on failure, revert and notify minimally.

## IPC surface (main `src/main/ipc.ts` + `preload.ts`)

- Handlers:
  - `sidebar:list` -> { nodes: SidebarNode[], prefs: SidebarPrefs, counts: CategoryCount[] }
  - `sidebar:create` (node: Partial<SidebarNode>) -> SidebarNode
  - `sidebar:update` (id, updates: Partial<SidebarNode>) -> void
  - `sidebar:delete` (id) -> void (with cascading delete of children and mappings)
  - `sidebar:move` (id, newParentId, newIndex) -> void (reorders siblings' `orderIndex`)
  - `sidebar:prefs:get` / `sidebar:prefs:set` (prefs)
  - `sidebar:counts` (optional incremental), or included in `sidebar:list`
- Preload `window.api.sidebar` namespace with strict types.

## Renderer state and services

- New module `src/renderer/ui/sidebar/store.ts`:
  - Holds `nodes`, `prefs`, `counts`, loading state, and exposes actions (create/update/delete/move/toggleCollapse/assignPapers etc.).
  - Performs cache hydration and DB sync.
  - No any types; narrow action signatures.
- New module `src/renderer/ui/sidebar/icon-map.ts`: map `iconKey` -> lucide icon component.
- Remove persisting React nodes; store only `iconKey` strings.

## UI structure (small components)

- Directory `src/renderer/ui/components/sidebar/` with:
  - `Sidebar.tsx` (composition shell, ARIA nav, sections)
  - `SidebarTree.tsx` (renders tree of nodes)
  - `SidebarNodeItem.tsx` (single row; supports keyboard/mouse, context menu)
  - `SidebarFolderItem.tsx` (folder with expand/collapse)
  - `SidebarAddButton.tsx` (inline add)
  - `SidebarFooter.tsx` (account area)
  - `SidebarDragLayer.tsx` (drag preview, no third-party libs)
- Replace current `LibrarySidebar.tsx` usage with new `Sidebar.tsx`, preserving existing props contract where sensible.

## Drag-and-drop (no deps)

- Pointer events + HTML5 DnD fallback; reorder by calculating drop targets using item bounds.
- Move scenarios:
  - Reorder within same parent (update `orderIndex`).
  - Move into folder (update `parentId` and `orderIndex` at end).
  - Prevent dropping folder into its own descendant.
- Keyboard reordering: Alt+ArrowUp/Down to move within siblings; Alt+ArrowRight/Left to move in/out of folders.

## Context menu and actions

- For label: Open, Rename, Change Color, Change Icon, Delete.
- For folder: Open, New Label, New Folder, Rename, Delete.
- Bulk actions on root: New Label, New Folder.
- All actions reflect optimistically, persist via IPC, and update cache.

## Built-in virtual nodes

- Always present (non-deletable): All, Recent, Unfiled.
- Rendered above tree; counts computed server-side (SQL) for All, Recent; Unfiled = papers not mapped in `paper_categories`.

## Counts and filtering

- Include `counts: CategoryCount[]` in `sidebar:list` response for all nodes (+ built-ins).
- Selecting a node triggers parent filter state (in `App.tsx`) to fetch papers by:
  - All: recent 50 by addedAt.
  - Recent: last N days or newest 50.
  - Label/folder: join `paper_categories`; folders aggregate counts of descendants.

## Preferences

- Persist `sidebarCollapsed` and `collapsedNodeIds` in both DB and localStorage; reconcile by `updatedAt`.
- Remember keyboard focus, last selected node id.

## Accessibility & UX

- ARIA roles: `navigation`, `tree`, `treeitem`, `group`.
- Keyboard: Arrow keys to navigate siblings/children; Enter to select; F2 to rename; Delete to delete; Cmd/Ctrl+N to add.
- Minimal visuals: compact 40-48px rows, clear focus ring, subtle counts, no toasts for loading—use inline skeletons.

## Cleanup and migration

- Migrate existing localStorage `categories` to new structure on first run; strip React nodes, map to `iconKey` and `colorHex`.
- Delete unused local-only category code paths after migration.

## Files to add/change

- Add: `src/shared/sidebar.ts`, `src/renderer/ui/sidebar/{store.ts,icon-map.ts}`, `src/renderer/ui/components/sidebar/*`.
- Change: `src/main/db/schema.ts` (new tables), `src/main/ipc.ts` (new handlers), `src/preload/preload.ts` (API surface), `src/renderer/ui/App.tsx` (wire selection/filter), replace `LibrarySidebar.tsx` usage.

## Test plan

- Unit: store actions, reorder/move edge cases, prefs reconciliation.
- Integration: IPC handlers; DB migrations; counts correctness.
- E2E: keyboard nav, DnD, rename/delete flows; persistence across restarts.

## Rollout

- Phase 1: Data/IPC + hidden store, migration, counts.
- Phase 2: Replace UI with new components behind a feature flag.
- Phase 3: Remove old sidebar and migration flag.

### To-dos

- [ ] Add sidebar_nodes, paper_categories, sidebar_prefs tables and init/migration
- [ ] Add sidebar IPC handlers and preload API with strict types
- [ ] Create shared sidebar types and iconKey map
- [ ] Implement sidebar store with cache+DB sync and optimistic updates
- [ ] Build new sidebar components (tree, items, drag layer, footer)
- [ ] Implement pointer-based DnD reorder/move with keyboard support
- [ ] Compute counts in main and wire selection filter in App
- [ ] Migrate localStorage categories to new schema; remove old code
- [ ] Add ARIA roles and keyboard shortcuts; focus management
- [ ] Add unit/integration/E2E tests for sidebar flows