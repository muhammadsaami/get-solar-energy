# Knowledge Base — Phase 18.5 Implementation Plan (Refined)

> Scope: Production-ready Knowledge Base inside the existing React SPA (`consumer-app`).
> This plan supersedes the prior Phase 18.5 draft. All architectural refinements are incorporated.
> Feature scope is **unchanged** — this is an architectural hardening of the approved plan.

---

## 1. Revised Architecture

The Knowledge Base is a self-contained **feature module** that reuses the established
service-based data layer pattern (see `features/training`, `pages/ProjectTracking`),
the Bill Analyzer visual language, and the shared design system.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        KnowledgeBase.jsx (orchestrator)                    │
│  Single state owner · consumes api · owns drawer + search state           │
├──────────────┬─────────────────────────────┬──────────────────────────────┤
│  UI Sections │  Shared / Reusable          │  Data & Logic                 │
├──────────────┼─────────────────────────────┼──────────────────────────────┤
│ Hero         │  DocumentDrawer (generic,   │  knowledgeBase.api.js         │
│ QuickAccess  │   components/ui)            │    └─ Stable future API       │
│ Score Card   │                             │  knowledgeBase.service.js     │
│ SearchBar    │  Existing design system     │    └─ ONE canonical dataset   │
│ FilterBar    │   (.card-glass, .btn-*,     │       + adapter layer         │
│ DocumentGrid │    .badge-*, .drawer, ...)  │  searchDocuments.js           │
│ RelatedDocs  │                             │    └─ normalize→filter→sort   │
└──────────────┴─────────────────────────────┴──────────────────────────────┘
```

**Non-negotiables**

| Principle | Rule |
|---|---|
| One canonical dataset | All sections derive from a single `MOCK_DOCUMENTS` collection |
| Generic drawer | `DocumentDrawer` lives in `components/ui`, zero KB business logic |
| Search abstraction | No filtering inside components — always through the search pipeline |
| Config-driven filters | `FILTER_CONFIG` renders every dropdown; new filter = config change |
| Derived relationships | Related docs computed by category / equipment / tags in the service |
| Derived score | Knowledge Score computed from mock metrics; UI receives only the number |
| Stable API contract | Signatures defined now, swappable to real backend later |
| Drawer motion | Only design-system transition tokens (`--transition-slow`, `--ease-*`) |
| Minimal CSS | `knowledge-base.css` = grid + drawer sizing/positioning only |
| Sidebar future-proof | `badge` field reserved on `SidebarItemConfig` (no implementation yet) |

---

## 2. Updated File Structure

```
src/components/ui/
└── DocumentDrawer.jsx                  ← GENERIC drawer (open, title, subtitle, onClose, children)
                                           Zero KB logic. Reusable by AI Proposal, CRM, Reports,
                                           Vendor Portal, Admin Portal, PDF Viewer.

src/features/knowledgeBase/
├── KnowledgeBase.jsx                   ← Orchestrator page (single state owner)
├── types/
│   └── knowledgeBase.types.ts          ← Document model + service DTOs (canonical contract)
├── config/
│   ├── filterConfig.ts                 ← FILTER_CONFIG (drives FilterBar + search filters)
│   └── quickAccessConfig.ts            ← QUICK_ACCESS pinned shortcuts (strip items)
├── services/
│   ├── knowledgeBase.api.js            ← Stable future API interface (9 methods, internally mocked)
│   ├── knowledgeBase.service.js        ← Canonical MOCK_DOCUMENTS + adapter layer
│   └── searchDocuments.js              ← Pure search pipeline: normalize → filter → sort
├── hooks/
│   └── useKnowledgeBase.js             ← Orchestration hook (dashboard, search, drawer, actions)
├── components/
│   ├── KnowledgeBaseHero.jsx           ← Page header + search + score (Bill Analyzer styling)
│   ├── QuickAccessStrip.jsx            ← NEW pinned shortcut strip (below hero)
│   ├── KnowledgeScoreCard.jsx          ← Renders ONLY the derived score
│   ├── SearchBar.jsx                   ← Debounced input; delegates to search service
│   ├── FilterBar.jsx                   ← Rendered dynamically from FILTER_CONFIG
│   ├── DocumentGrid.jsx                ← Responsive grid of DocumentCard
│   ├── DocumentCard.jsx                ← Card row (rating, tags, actions: bookmark/download/share)
│   ├── DocumentDrawerContent.jsx       ← KB-specific content composed INTO generic drawer
│   ├── RelatedDocuments.jsx            ← Renders service-derived related list (no logic)
│   └── DocumentSkeleton.jsx            ← Skeleton loader (uses .skeleton tokens)
└── styles/
    └── knowledge-base.css              ← MINIMAL: responsive grid + drawer sizing/positioning only
```

**Config/routing additions (integration, not new abstractions)**

```
src/config/routes.ts                   ← + KNOWLEDGE_BASE: '/app/knowledge-base'
src/config/sidebar.ts                  ← + SidebarItemConfig.badge?: number (reserved, unused)
                                       ← + knowledge-base sidebar item
src/config/permissions.ts              ← + FeatureId 'knowledge-base' + role map
src/App.jsx                            ← + lazy route (same pattern as TrainingAcademy)
```

> **No new abstractions.** The module follows the exact service/hook/component split already
> proven by `features/training` and `pages/ProjectTracking`. The only new shared primitive is
> `DocumentDrawer`, which is required for cross-module reuse.

---

## 3. Updated Data Flow

```
KnowledgeBase.jsx (mount)
    └── useKnowledgeBase()
        └── knowledgeBase.api.getDashboard()          ← STABLE INTERFACE
            └── knowledgeBase.service.getDashboard()  ← adapter
                └── derives from ONE MOCK_DOCUMENTS
                    ├── featuredDocuments   (filter featured === true)
                    ├── bookmarkedDocuments (filter bookmarked === true)
                    ├── recentlyViewedDocuments (sort recentlyViewed desc, slice)
                    ├── popularDocuments    (sort views + downloads desc, slice)
                    └── latestDocuments     (sort updatedAt desc, slice)
                └── deriveKnowledgeScore(metrics)     → number (exposed only)
                └── getCategories()                    → from canonical set

Search / Filter flow
    SearchBar/FilterBar → setState(query, activeFilters)
        → useKnowledgeBase (debounced via useDebounce)
            → searchDocuments(documents, { query, filters, sortKey })   ← PIPELINE
                → normalize() → filter() → sort() → return results

Drawer flow
    DocumentCard onClick → setSelectedDocument(id)
        → api.getDocument(id) → service.getDocument(id) (+ relatedDocuments derived)
        → <DocumentDrawer open title={doc.title} subtitle={meta} onClose>
              <DocumentDrawerContent doc={doc} onBookmark onDownload onShare />
          </DocumentDrawer>

Actions (optimistic UI + API signature)
    toggleBookmark(id) / downloadDocument(id) / shareDocument(id)
        → api.* → service.* → refresh dashboard collections from canonical set
```

**Key rule (inherited from Project Tracking):** child components hold only UI state.
All document data lives in the orchestrator/`useKnowledgeBase` hook; children receive props
and emit callbacks.

---

## 4. Canonical Document Model

**One** collection. **No** per-section mock datasets.

```ts
// types/knowledgeBase.types.ts
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Document {
  id: string
  title: string
  category: string              // e.g. 'Safety', 'Installation', 'Compliance'
  equipment: string             // e.g. 'Inverter', 'Module', 'Battery', 'None'
  difficulty: Difficulty
  author: string
  readingTime: number           // minutes
  updatedAt: string             // ISO date
  summary: string
  tags: string[]

  // Engagement / state flags (drive section membership — all on the same row)
  featured: boolean
  bookmarked: boolean
  recentlyViewed: boolean
  downloads: number
  views: number
  rating: number                // 0–5

  // Denormalized hint; resolved to full Document[] in the adapter
  relatedDocumentIds: string[]
}

export interface KnowledgeMetrics {
  completedReading: number      // docs fully read
  bookmarkedResources: number
  trainingProgress: number      // 0–100 (consumed from training feature)
  certifications: number        // active certifications
  assessments: number           // assessments completed
}

export interface KnowledgeDashboard {
  featuredDocuments: Document[]
  bookmarkedDocuments: Document[]
  recentlyViewedDocuments: Document[]
  popularDocuments: Document[]
  latestDocuments: Document[]
  categories: string[]
  score: number                 // derived — the only value the UI sees
}

export interface SearchQuery {
  text: string
  filters: Record<string, string[]>   // keys aligned with FILTER_CONFIG
  sortBy?: 'relevance' | 'updated' | 'popular' | 'rating'
}
```

Every page section derives from this single dataset. The adapter layer exposes:

- `featuredDocuments`
- `bookmarkedDocuments`
- `recentlyViewedDocuments`
- `popularDocuments`
- `latestDocuments`

No section builds its own array.

---

## 5. Service Interface (Future API Contract)

Defined now, mocked internally, signatures stable for backend swap.

```ts
// services/knowledgeBase.api.js — SOLE import point for the UI
export const knowledgeBaseApi = {
  getDashboard(): Promise<KnowledgeDashboard>,            // GET /api/knowledge-base/dashboard
  searchDocuments(query: SearchQuery): Promise<Document[]>, // GET /api/knowledge-base/search
  getDocument(id: string): Promise<Document>,             // GET /api/knowledge-base/documents/:id
  toggleBookmark(id: string): Promise<{ bookmarked: boolean }>, // PATCH .../documents/:id/bookmark
  getRecentDocuments(): Promise<Document[]>,              // GET /api/knowledge-base/recent
  getPopularDocuments(): Promise<Document[]>,             // GET /api/knowledge-base/popular
  getCategories(): Promise<string[]>,                     // GET /api/knowledge-base/categories
  downloadDocument(id: string): Promise<{ ok: boolean }>, // POST .../documents/:id/download
  shareDocument(id: string): Promise<{ ok: boolean }>,    // POST .../documents/:id/share
}
```

- Every method returns a `Promise` (identical to `projectTracking.service.js`).
- UI components import `knowledgeBaseApi` only — never the mock service directly.
- Replacing the backend = reimplementing the internals of these 9 methods; components unchanged.

---

## 6. Search Architecture

Filtering is **never** done inside React components.

```
services/searchDocuments.js  (pure, side-effect free)

  export function searchDocuments(documents, query) {
    const normalized  = normalize(documents)          // lowercase, trim, collapse whitespace
    const filtered    = filter(normalized, query)     // text + FILTER_CONFIG dimensions
    return sort(filtered, query)                      // relevance | updated | popular | rating
  }

  // internal
  normalize(docs)             // defensive copy + key normalization
  filter(docs, query)         // matches text across title/summary/tags/author/category
                              // + ANDs each active filter dimension from FILTER_CONFIG
  sort(docs, query)           // stable scoring: field hits > tag hits > summary hits;
                              // 'updated' → updatedAt desc; 'popular' → views+downloads;
                              // 'rating' → rating desc
```

**Hook**

```ts
// hooks/useKnowledgeBase.js
const { documents } = useKnowledgeBase()            // canonical set from api.getDashboard()
const debounced = useDebounce(query.text, 250)      // existing shared hook
const results = useMemo(() => searchDocuments(documents, { text: debounced, filters, sortBy }), [documents, debounced, filters, sortBy])
```

**Backend swap path:** when the API ships `GET /api/knowledge-base/search`, replace the
`useMemo`/pipeline call with `knowledgeBaseApi.searchDocuments(query)` — the UI and hook
signature stay identical.

---

## 7. Drawer Architecture

**Generic drawer** — `components/ui/DocumentDrawer.jsx`

```tsx
<DocumentDrawer
  open={isOpen}
  title={selectedDoc.title}
  subtitle={`${category} · ${readingTime} min · ${difficulty}`}
  onClose={handleClose}
>
  <DocumentDrawerContent doc={selectedDoc} onBookmark={...} onDownload={...} onShare={...} />
</DocumentDrawer>
```

Contract (only these props):

- `open: boolean`
- `title: string`
- `subtitle?: string`
- `onClose: () => void`
- `children: ReactNode`

**Responsibilities of the generic drawer** (and nothing more):

- Overlay + panel shell
- Escape-to-close, focus trap, focus restoration, body scroll lock
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Header (title / subtitle / close button) — styled with existing `.badge`, `.btn-ghost`, tokens
- Renders `children` in a scrollable body

**Everything KB-specific** (metadata rows, actions, related docs, reader view) lives in
`DocumentDrawerContent.jsx` and is composed through `children`.

**Reuse guarantee:** AI Proposal, CRM, Reports, Vendor Portal, Admin Portal, and PDF Viewer
can use the same shell with their own `children`. No KB import exists in the drawer.

**Motion (refinement #8):** reuse `navigation.css` `.drawer-overlay` / `.drawer` classes and
`gs-fade-in`, `gs-slide-left`, `gs-slide-left-exit`, `gs-fade-out` keyframes driven by
`--duration-slow`, `--ease-decelerate`, `--ease-accelerate`, `--duration-fast`.
**No custom easing or duration values.** Reduced motion is inherited from `motion.css`.

---

## 8. Adapter Responsibilities

`knowledgeBase.service.js` owns ALL derivation. The UI only renders what it returns.

| Responsibility | Implementation |
|---|---|
| Single canonical source | One `MOCK_DOCUMENTS` array with the full `Document` shape |
| Section collections | `featuredDocuments / bookmarkedDocuments / recentlyViewedDocuments / popularDocuments / latestDocuments` |
| Categories | `unique(document.category)` from the canonical set |
| Related documents | `getRelatedDocuments(id)` → score candidates by `category` (weight 3), `equipment` (2), shared `tags` (1); take top 3–4; fall back to `relatedDocumentIds` order |
| Knowledge Score | `deriveKnowledgeScore(metrics)` → weighted: completedReading ×0.30, trainingProgress ×0.25, bookmarkedResources ×0.15, certifications ×0.15, assessments ×0.15 → clamp 0–100 |
| Mutations | `toggleBookmark / download / share` mutate the canonical array, then re-derive collections |
| Related docs | **never** hardcoded; always derived from category / equipment / tags |

---

## 9. CSS Responsibilities

`styles/knowledge-base.css` contains **only**:

1. Responsive grid adjustments (document card grid breakpoints)
2. Drawer sizing (`width` for the KB drawer instance, if overridden from the 420px default)
3. Drawer positioning (any offset required to fit the AppShell)
4. Responsive drawer behavior (100vw / 90vw fallbacks at breakpoints)

**Explicitly NOT redefined** (reuse design system exclusively):

- Colors → `tokens.css`
- Typography → `typography.css` / `tokens.css`
- Shadows → `tokens.css`
- Buttons → `buttons.css` (`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-icon`, `.btn-sm`, `.btn-xs`)
- Cards → `cards.css` + `glass.css` (`.card-glass`, `.glass-card`, `.card-grid`, `.card-metric`)
- Spacing → `--space-*` tokens
- Icons → `react-icons` (Md*) / inline `svg` like the Bill Analyzer
- Badges → `badges.css`
- Skeleton → `loading.css`
- Forms/search → `forms.css` (`.form-input`, `.form-search`)
- Motion → `motion.css`

CSS file target: **< ~60 lines** (grid + drawer only).

---

## 10. Quick Access Strip (New — refinement #11)

Placed immediately below the Hero. Config-driven, no hardcoded tiles.

```ts
// config/quickAccessConfig.ts
export const QUICK_ACCESS = [
  { id: 'recent',            label: 'Recent',            icon: 'clock',     filter: { key: 'view', value: 'recent' } },
  { id: 'bookmarks',         label: 'Bookmarks',         icon: 'bookmark',  filter: { key: 'bookmarked', value: true } },
  { id: 'downloads',         label: 'Downloads',         icon: 'download',  filter: { key: 'sort', value: 'popular' } },
  { id: 'safety-sops',       label: 'Safety SOPs',       icon: 'shield',    filter: { key: 'category', value: 'Safety' } },
  { id: 'installation',      label: 'Installation Guides', icon: 'wrench',  filter: { key: 'category', value: 'Installation' } },
  { id: 'offline',           label: 'Offline Documents', icon: 'cloud-off', filter: { key: 'offline', value: true } },
]
```

- Styling: existing `glass-card` / `.card-glass` tiles + existing button/icon patterns.
- Each tile applies a preset filter through the **same** search pipeline (no bespoke logic).
- No new design language.

---

## 11. Sidebar Future-Proofing (refinement #9)

- Extend `SidebarItemConfig` with `badge?: number` (reserved field, currently unused).
- Add the Knowledge Base item to `config/sidebar.ts` with `badge` omitted.
- When notification badges arrive, rendering consumes `badge` from the same config — **no refactor**.
- No badge rendering implemented in this phase.

---

## 12. Final Architecture Review Checklist

| ✓ | Requirement | Status |
|---|---|---|
| ✓ | Single canonical document model | One `MOCK_DOCUMENTS`; all sections derived |
| ✓ | Generic reusable drawer | `components/ui/DocumentDrawer`, 5 props, zero KB logic |
| ✓ | Config-driven filters | `FILTER_CONFIG` renders `FilterBar`; new filter = config entry |
| ✓ | Search abstraction | `searchDocuments` pipeline; components never filter |
| ✓ | Adapter-derived collections | service exposes featured/bookmarked/recent/popular/latest |
| ✓ | Derived Knowledge Score | computed from metrics; UI gets a number only |
| ✓ | Stable future API interface | 9-method `knowledgeBaseApi` contract with endpoint mapping |
| ✓ | Minimal CSS | grid + drawer sizing/positioning; < 60 lines |
| ✓ | Bill Analyzer visual consistency | same tokens, card grammar, `tab-content`/`tab-heading` header block |
| ✓ | Zero duplicated business logic | single service adapter owns all derivation |
| ✓ | Zero duplicated UI components | drawer shared; all else module-local per existing convention |
| ✓ | Quick Access strip | config-driven, below hero, glass-card + existing patterns |
| ✓ | Sidebar future-proof | reserved `badge` field, no implementation |
| ✓ | Drawer animation parity | design-system tokens only, reduced-motion inherited |

---

## Deliverables Checklist

1. **Revised architecture** — §1
2. **Updated file structure** — §2
3. **Updated data flow** — §3
4. **Canonical document model** — §4
5. **Service interface** — §5
6. **Search architecture** — §6
7. **Drawer architecture** — §7
8. **Adapter responsibilities** — §8
9. **CSS responsibilities** — §9
10. **Production readiness confirmation** — below

## Confirmation

> ✅ **The plan is ready for production implementation.**
> All twelve architectural refinements are incorporated, the approved feature scope is unchanged,
> the architecture preserves the existing GET Solar Energy conventions, and zero business logic or
> UI components are duplicated. Implementation may begin.
