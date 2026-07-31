import { knowledgeBaseService } from './knowledgeBase.service'
import { searchDocuments } from './searchDocuments'

export const knowledgeBaseApi = {
  getDashboard() {
    return Promise.resolve(knowledgeBaseService.getDashboard())
  },

  searchDocuments(query) {
    const docs = knowledgeBaseService.getDocuments()
    return Promise.resolve(searchDocuments(docs, query))
  },

  getDocument(id) {
    return Promise.resolve(knowledgeBaseService.getDocument(id))
  },

  toggleBookmark(id) {
    return Promise.resolve(knowledgeBaseService.toggleBookmark(id))
  },

  getRecentDocuments() {
    return Promise.resolve(knowledgeBaseService.getRecentDocuments())
  },

  getPopularDocuments() {
    return Promise.resolve(knowledgeBaseService.getPopularDocuments())
  },

  getCategories() {
    return Promise.resolve(knowledgeBaseService.getCategories())
  },

  downloadDocument(id) {
    return Promise.resolve(knowledgeBaseService.downloadDocument(id))
  },

  shareDocument(id) {
    return Promise.resolve(knowledgeBaseService.shareDocument(id))
  },

  getRelatedDocuments(id) {
    return Promise.resolve(knowledgeBaseService.getRelatedDocuments(id))
  },
}
