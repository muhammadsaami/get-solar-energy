import React, { useState, useEffect, useCallback, useRef } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { useVendorNotify } from '../hooks/useVendorNotify'
import {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '../services/vendor.service'
import type { VendorDocument } from '../types/vendor.types'

export function VendorDocuments() {
  const notify = useVendorNotify()
  const auth = useAuth() as unknown as { user?: { email?: string } }
  const vendorEmail = auth?.user?.email || 'vendor@getsolar.in'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docs, setDocs] = useState<VendorDocument[]>([])
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('EPC Contract')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchDocs = useCallback(async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    setError(null)
    try {
      const data = await getDocuments(vendorEmail, selectedType !== 'All' ? selectedType : undefined)
      if (!isMountedRef.current) return
      setDocs(Array.isArray(data?.documents) ? data.documents : [])
    } catch (err: unknown) {
      if (!isMountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to fetch compliance documents'
      setError(msg)
      setDocs([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [vendorEmail, selectedType])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName.trim()) {
      notify('Document title is required')
      return
    }
    if (!selectedFile) {
      notify('Please select a document file to upload')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('vendor_email', vendorEmail)
      formData.append('document_name', docName.trim())
      formData.append('document_type', docType)
      formData.append('file', selectedFile)

      await uploadDocument(formData)
      notify(`Uploaded "${docName.trim()}" successfully`)
      setShowUploadModal(false)
      setDocName('')
      setSelectedFile(null)
      await fetchDocs()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload document'
      notify(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async (doc: VendorDocument) => {
    try {
      notify(`Downloading ${doc.document_name}...`)
      const blob = await downloadDocument(doc.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.original_filename || `${doc.document_name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download file'
      notify(msg)
    }
  }

  const handleDelete = async (docId: number, docTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}"?`)) return
    try {
      await deleteDocument(docId)
      notify(`Deleted "${docTitle}" from compliance vault`)
      await fetchDocs()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete document'
      notify(msg)
    }
  }

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase()
    return (
      !q ||
      (d.document_name || '').toLowerCase().includes(q) ||
      (d.document_type || '').toLowerCase().includes(q) ||
      (d.original_filename || '').toLowerCase().includes(q) ||
      String(d.id).toLowerCase().includes(q)
    )
  })

  const badgeText = loading
    ? 'Loading Vault...'
    : error
    ? '— Verified Records'
    : `${docs.length} Verified Records`

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Document Vault & Legal Approvals"
        subtitle="Centralized repository for turnkey EPC contracts, DISCOM interconnection permits, and warranty certificates."
        badgeText={badgeText}
        actions={
          <button
            className="vendor-btn-primary"
            id="uploadDocumentBtn"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload New Document
          </button>
        }
      />

      <div
        className="vendor-glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>
            Compliance & Legal Vault
          </span>
          <select
            className="vendor-input"
            style={{ width: '180px', padding: '6px 10px', fontSize: '12px' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="EPC Contract">EPC Contract</option>
            <option value="DISCOM Approval">DISCOM Approval</option>
            <option value="GST Certificate">GST Certificate</option>
            <option value="PAN Card">PAN Card</option>
            <option value="Safety Audit">Safety Audit</option>
            <option value="Warranty Card">Warranty Card</option>
          </select>
        </div>

        <div style={{ width: '280px', minWidth: '220px' }}>
          <input
            type="text"
            className="vendor-input"
            id="documentSearchInput"
            placeholder="Search documents by title, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div
              className="vendor-spinner"
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(23, 168, 229, 0.2)',
                borderTopColor: 'var(--vendor-primary)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ fontSize: '14px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>
              Loading compliance documents from live vault...
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--vendor-danger)',
                fontSize: '24px',
              }}
            >
              ⚠
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
              Unable to load document records
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', margin: '0 0 20px' }}>
              {error}
            </p>
            <button className="vendor-btn-primary" onClick={fetchDocs}>
              🔄 Retry Load
            </button>
          </div>
        ) : docs.length === 0 ? (
          <VendorEmptyState
            title="No Documents Vaulted"
            description="Upload compliance documents, EPC contracts, and DISCOM grid permits to build your verified legal repository."
            action={{ label: '+ Upload New Document', onClick: () => setShowUploadModal(true) }}
          />
        ) : filtered.length === 0 ? (
          <VendorEmptyState
            title="No Matching Documents"
            description="No documents in your vault match your search query."
            action={{ label: 'Clear Search', onClick: () => setSearch('') }}
          />
        ) : (
          <table className="vendor-table-container">
            <thead>
              <tr>
                <th>Doc ID</th>
                <th>Document Title</th>
                <th>Category</th>
                <th>File Size</th>
                <th>Filing Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>
                    DOC-{String(d.id).padStart(4, '0')}
                  </td>
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{d.document_name}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        fontSize: '11.5px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {d.document_type || 'Unclassified'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--vendor-text-muted)', fontSize: '12px' }}>
                    {d.size_mb ? `${d.size_mb} MB` : '—'}
                  </td>
                  <td style={{ color: 'var(--vendor-text-muted)', fontSize: '12px' }}>
                    {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <StatusBadge status="Verified" />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="vendor-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => handleDownload(d)}
                      >
                        Download File
                      </button>
                      <button
                        className="vendor-btn-ghost"
                        style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--vendor-danger)' }}
                        onClick={() => handleDelete(d.id, d.document_name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 18, 0.78)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="vendor-glass-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: 'var(--font-family)' }}>
                Upload Compliance Document
              </h3>
              <button
                className="vendor-btn-ghost"
                style={{ padding: '4px 8px', fontSize: '16px' }}
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  className="vendor-input"
                  placeholder="e.g. 50kW Turnkey EPC Agreement - Jaipur Site"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                  Document Category
                </label>
                <select
                  className="vendor-input"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="EPC Contract">EPC Contract</option>
                  <option value="DISCOM Approval">DISCOM Approval</option>
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Safety Audit">Safety Audit</option>
                  <option value="Warranty Card">Warranty Card</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                  Select File (.pdf, .png, .jpg, .docx) *
                </label>
                <input
                  type="file"
                  id="documentFileInput"
                  className="vendor-input"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="vendor-btn-ghost"
                  onClick={() => setShowUploadModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vendor-btn-primary"
                  id="submitUploadDocBtn"
                  disabled={submitting}
                >
                  {submitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorDocuments
