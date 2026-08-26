import React, { useState, useEffect, useCallback, useRef } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useVendorNotify } from '../hooks/useVendorNotify'
import { useAuth } from '../../contexts/AuthContext'
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../services/vendor.service'
import type {
  VendorInventoryItem,
  VendorInventoryCreatePayload,
  VendorInventoryUpdatePayload,
} from '../types/vendor.types'

export function VendorInventory() {
  const notify = useVendorNotify()
  const auth = useAuth() as unknown as { user?: { email?: string; name?: string } }
  const vendorEmail = auth?.user?.email || 'vendor@getsolar.in'

  const [items, setItems] = useState<VendorInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<VendorInventoryItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Module',
    sku: '',
    quantity: 0,
    unit: 'Units',
    unit_price: 0,
    warehouse_city: 'Jaipur Central',
  })

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchStock = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getInventory({
        vendor_email: vendorEmail,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      })

      if (!isMountedRef.current) return

      if (res && res.success) {
        setItems(Array.isArray(res.items) ? res.items : [])
        setTotalPages(res.total_pages || 1)
        setTotalCount(res.total_count || 0)
        setError(null)
      } else {
        setItems([])
        setTotalCount(0)
        setError(null)
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to fetch inventory from server'
      setError(msg)
      setItems([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [vendorEmail, search, page, pageSize])

  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormData({
      product_name: '',
      category: 'Module',
      sku: '',
      quantity: 10,
      unit: 'Units',
      unit_price: 5000,
      warehouse_city: 'Jaipur Central',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: VendorInventoryItem) => {
    setEditingItem(item)
    setFormData({
      product_name: item.product_name || '',
      category: item.category || 'Module',
      sku: item.sku || '',
      quantity: item.quantity ?? 0,
      unit: item.unit || 'Units',
      unit_price: item.unit_price ?? 0,
      warehouse_city: item.warehouse_city || 'Jaipur Central',
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (submitting) return
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.product_name.trim()) {
      notify('Product name is required')
      return
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        const updatePayload: VendorInventoryUpdatePayload = {
          product_name: formData.product_name.trim(),
          category: formData.category.trim() || undefined,
          sku: formData.sku.trim() || undefined,
          quantity: Number(formData.quantity),
          unit: formData.unit.trim() || undefined,
          unit_price: Number(formData.unit_price),
          warehouse_city: formData.warehouse_city.trim() || undefined,
        }
        const res = await updateInventoryItem(editingItem.id, updatePayload, vendorEmail)
        if (res && res.success) {
          notify(`Updated "${formData.product_name}" successfully`)
          setIsModalOpen(false)
          fetchStock()
        } else {
          notify('Failed to update inventory item')
        }
      } else {
        const createPayload: VendorInventoryCreatePayload = {
          vendor_email: vendorEmail,
          product_name: formData.product_name.trim(),
          category: formData.category.trim() || undefined,
          sku: formData.sku.trim() || undefined,
          quantity: Number(formData.quantity),
          unit: formData.unit.trim() || undefined,
          unit_price: Number(formData.unit_price),
          warehouse_city: formData.warehouse_city.trim() || undefined,
        }
        const res = await createInventoryItem(createPayload)
        if (res && res.success) {
          notify(`Added "${formData.product_name}" to warehouse stock`)
          setIsModalOpen(false)
          setPage(1)
          fetchStock()
        } else {
          notify('Failed to create inventory item')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed'
      notify(`Action failed: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteItem = async (item: VendorInventoryItem) => {
    if (!window.confirm(`Are you sure you want to delete SKU "${item.sku || item.product_name}"?`)) {
      return
    }

    setDeletingId(item.id)
    try {
      const res = await deleteInventoryItem(item.id, vendorEmail)
      if (res && res.success) {
        notify(`Deleted item #${item.id} successfully`)
        fetchStock()
      } else {
        notify('Failed to delete item')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      notify(`Delete failed: ${msg}`)
    } finally {
      setDeletingId(null)
    }
  }

  // Derive badge text based on loading / error / count state
  const badgeLabel = loading
    ? 'Loading SKUs...'
    : error
    ? '— Active SKUs'
    : `${totalCount} Active SKUs`

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Inventory & Stock Tracking"
        subtitle="Real-time warehouse inventory for PV modules, string inverters, and mounting hardware."
        badgeText={badgeLabel}
        actions={
          <button className="vendor-btn-primary" onClick={handleOpenAddModal} id="addStockBtn">
            + Add Stock Item
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
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>
          Warehouse Material Reserve
        </span>
        <div style={{ width: '280px', minWidth: '220px' }}>
          <input
            type="text"
            className="vendor-input"
            placeholder="Search SKU by name, category..."
            value={search}
            id="inventorySearchInput"
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--vendor-text-muted)' }}>
            <div className="vendor-spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading warehouse inventory from live database...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--vendor-danger)', fontWeight: 600, fontSize: '15px' }}>
              Failed to fetch inventory from server
            </p>
            <p style={{ color: 'var(--vendor-text-muted)', fontSize: '13px', marginTop: '4px' }}>
              {error}
            </p>
            <button
              className="vendor-btn-secondary"
              id="retryInventoryBtn"
              style={{ marginTop: '16px' }}
              onClick={fetchStock}
            >
              🔄 Retry Load
            </button>
          </div>
        ) : items.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="vendor-table-container">
                <thead>
                  <tr>
                    <th>SKU Code</th>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th>Stock Quantity</th>
                    <th>Warehouse Hub</th>
                    <th>Unit Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>
                        {s.sku || `SKU-${s.id}`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.product_name}</td>
                      <td style={{ color: 'var(--vendor-text-secondary)' }}>{s.category || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#FFFFFF' }}>
                        {s.quantity} {s.unit || 'Units'}
                      </td>
                      <td style={{ color: 'var(--vendor-text-muted)' }}>
                        {s.warehouse_city || 'Central Hub'}
                      </td>
                      <td style={{ color: 'var(--vendor-text-secondary)' }}>
                        {s.unit_price ? `₹${s.unit_price.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="vendor-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => handleOpenEditModal(s)}
                          >
                            Edit
                          </button>
                          <button
                            className="vendor-btn-secondary"
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              color: 'var(--vendor-danger)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                            }}
                            disabled={deletingId === s.id}
                            onClick={() => handleDeleteItem(s)}
                          >
                            {deletingId === s.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Minimalist Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid var(--vendor-border)',
                  fontSize: '12px',
                  color: 'var(--vendor-text-muted)',
                }}
              >
                <span>
                  Showing Page {page} of {totalPages} ({totalCount} total items)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="vendor-btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="vendor-btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <VendorEmptyState
            title={search ? 'No matching inventory found' : 'No inventory items available'}
            description={
              search
                ? `No products matched "${search}". Try a different term or clear search.`
                : 'Add your first stock item to begin tracking warehouse materials.'
            }
            action={
              search
                ? { label: 'Clear Search', onClick: () => { setSearch(''); setPage(1); } }
                : { label: '+ Add Stock Item', onClick: handleOpenAddModal }
            }
          />
        )}
      </div>

      {/* Add / Edit Inventory Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 15, 31, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="vendor-glass-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              border: '1px solid var(--vendor-primary-border)',
              background: '#0a1a2f',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', color: '#FFFFFF', fontWeight: 700 }}>
                {editingItem ? 'Edit Warehouse SKU' : 'Add Stock Item'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--vendor-text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  className="vendor-input"
                  placeholder="e.g. 540W Mono PERC Solar Panel"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    className="vendor-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Module">Module (Panels)</option>
                    <option value="Inverter">Inverter</option>
                    <option value="Structure">Structure / Rail</option>
                    <option value="Cable">Cable / Wire</option>
                    <option value="Protection">Protection / SPD</option>
                    <option value="Battery">Battery Storage</option>
                    <option value="Other">Other Component</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                    SKU Code
                  </label>
                  <input
                    type="text"
                    className="vendor-input"
                    placeholder="e.g. MOD-540W-MONO"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="vendor-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    className="vendor-input"
                    placeholder="e.g. Units, Meters, Sets"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="vendor-input"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--vendor-text-secondary)', marginBottom: '4px' }}>
                    Warehouse Hub
                  </label>
                  <input
                    type="text"
                    className="vendor-input"
                    placeholder="e.g. Jaipur Central"
                    value={formData.warehouse_city}
                    onChange={(e) => setFormData({ ...formData, warehouse_city: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="vendor-btn-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vendor-btn-primary"
                  disabled={submitting}
                  id="saveStockItemBtn"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default VendorInventory
