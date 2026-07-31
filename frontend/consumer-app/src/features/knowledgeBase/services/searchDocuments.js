import { FILTER_CONFIG } from '../config/filterConfig'

const TEXT_FIELDS = ['title', 'summary', 'author', 'category', 'equipment']

function normalize(documents) {
  return documents.map((doc) => {
    const normalized = { ...doc }
    normalized._searchText = TEXT_FIELDS
      .map((field) => doc[field])
      .concat(doc.tags)
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return normalized
  })
}

function matchesText(doc, text) {
  const terms = text.split(/\s+/).filter(Boolean)
  return terms.every((term) => doc._searchText.includes(term))
}

function matchesFilters(doc, filters) {
  return Object.entries(filters).every(([key, values]) => {
    if (!values || values.length === 0) return true
    const filterConfig = FILTER_CONFIG.find((f) => f.id === key)
    if (filterConfig) {
      const allowed = values.map((v) => v.toLowerCase())
      const docValue = String(doc[filterConfig.accessor] ?? '').toLowerCase()
      return allowed.includes(docValue)
    }
    if (key === 'bookmarked' || key === 'offline') {
      const target = values.includes('true')
      return doc[key] === target
    }
    return true
  })
}

function filter(documents, query) {
  return documents.filter((doc) => {
    const textOk = !query.text || matchesText(doc, query.text)
    const filterOk = matchesFilters(doc, query.filters || {})
    return textOk && filterOk
  })
}

function relevanceScore(doc, text) {
  const term = text.trim().toLowerCase()
  if (!term) return 0
  const title = doc.title.toLowerCase()
  const summary = doc.summary.toLowerCase()
  const author = doc.author.toLowerCase()
  const category = doc.category.toLowerCase()
  let score = 0
  if (title.includes(term)) score += 10
  doc.tags.forEach((tag) => {
    if (tag.toLowerCase().includes(term)) score += 4
  })
  if (summary.includes(term)) score += 3
  if (author.includes(term)) score += 2
  if (category.includes(term)) score += 1
  return score
}

function sortBy(documents, key, direction = 'desc') {
  return [...documents].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return direction === 'asc' ? cmp : -cmp
  })
}

function sort(documents, query) {
  const mode = query.sortBy || 'relevance'
  switch (mode) {
    case 'updated':
      return sortBy(documents, 'updatedAt')
    case 'popular':
      return sortBy(documents, 'views').slice()
    case 'rating':
      return sortBy(documents, 'rating')
    case 'relevance':
    default:
      if (query.text) {
        return [...documents].sort(
          (a, b) => relevanceScore(b, query.text) - relevanceScore(a, query.text)
        )
      }
      return sortBy(documents, 'views')
  }
}

export function searchDocuments(documents, query = {}) {
  const q = { text: '', filters: {}, sortBy: 'relevance', ...query }
  const normalized = normalize(documents)
  const filtered = filter(normalized, q)
  const ranked = sort(filtered, q)
  const byId = new Map(documents.map((d) => [d.id, d]))
  return ranked.map((doc) => {
    delete doc._searchText
    return { ...doc, relatedDocumentIds: byId.get(doc.id)?.relatedDocumentIds || [] }
  })
}
