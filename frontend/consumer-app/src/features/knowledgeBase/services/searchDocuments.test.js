import { describe, it, expect } from 'vitest'
import { searchDocuments } from './searchDocuments'
import { knowledgeBaseService, deriveKnowledgeScore } from './knowledgeBase.service'

const docs = knowledgeBaseService.getDocuments()

describe('searchDocuments', () => {
  it('returns all documents for an empty query', () => {
    const result = searchDocuments(docs)
    expect(result).toHaveLength(docs.length)
  })

  it('never leaks the internal _searchText field', () => {
    const result = searchDocuments(docs, { text: 'inverter' })
    result.forEach((doc) => {
      expect(doc).not.toHaveProperty('_searchText')
    })
  })

  it('filters by free text across title and summary', () => {
    const result = searchDocuments(docs, { text: 'commissioning' })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((d) => d._searchText === undefined)).toBe(true)
    expect(result.some((d) => /commissioning/i.test(d.title + d.summary))).toBe(true)
  })

  it('filters by a single dimension', () => {
    const result = searchDocuments(docs, { filters: { category: ['Safety'] } })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((d) => d.category === 'Safety')).toBe(true)
  })

  it('combines multiple filters with AND semantics', () => {
    const result = searchDocuments(docs, {
      filters: { category: ['Technical'], equipment: ['Inverter'] },
    })
    expect(result.every((d) => d.category === 'Technical' && d.equipment === 'Inverter')).toBe(true)
  })

  it('filters by bookmarked flag', () => {
    const result = searchDocuments(docs, { filters: { bookmarked: ['true'] } })
    expect(result.every((d) => d.bookmarked)).toBe(true)
  })

  it('sorts by updatedAt when sortBy=updated', () => {
    const result = searchDocuments(docs, { sortBy: 'updated' })
    const dates = result.map((d) => new Date(d.updatedAt).getTime())
    const sorted = [...dates].sort((a, b) => b - a)
    expect(dates).toEqual(sorted)
  })

  it('ranks title matches above summary matches', () => {
    const result = searchDocuments(docs, { text: 'inverter' })
    const titleMatch = result.find((d) => d.title.toLowerCase().includes('inverter'))
    const indexOfTitle = result.indexOf(titleMatch)
    expect(indexOfTitle).toBeLessThanOrEqual(3)
  })

  it('strips _searchText from normalized output while keeping metadata', () => {
    const [doc] = searchDocuments(docs, { text: 'battery' })
    expect(doc).toHaveProperty('id')
    expect(doc).toHaveProperty('relatedDocumentIds')
    expect(doc.relatedDocumentIds).toEqual(expect.any(Array))
  })
})

describe('deriveKnowledgeScore', () => {
  it('computes the expected weighted score', () => {
    const { score } = deriveKnowledgeScore({
      completedReading: 6,
      bookmarkedResources: 4,
      trainingProgress: 65,
      certifications: 4,
      assessments: 3,
    })
    expect(score).toBe(55)
  })

  it('clamps to a maximum of 100', () => {
    const { score } = deriveKnowledgeScore({
      completedReading: 100,
      trainingProgress: 100,
      bookmarkedResources: 100,
      certifications: 100,
      assessments: 100,
    })
    expect(score).toBeLessThanOrEqual(100)
  })

  it('labels low scores as Emerging', () => {
    const { label } = deriveKnowledgeScore({ completedReading: 0, trainingProgress: 0 })
    expect(label).toBe('Emerging')
  })

  it('labels high scores as Expert', () => {
    const { label } = deriveKnowledgeScore({
      completedReading: 30,
      trainingProgress: 100,
      certifications: 10,
      assessments: 10,
      bookmarkedResources: 10,
    })
    expect(label).toBe('Expert')
  })
})
