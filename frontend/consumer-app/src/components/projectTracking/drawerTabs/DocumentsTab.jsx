import React from 'react';
import { MdUpload, MdPictureAsPdf, MdDescription, MdTableChart, MdHourglassEmpty } from 'react-icons/md';

const DOC_ICONS = { pdf: MdPictureAsPdf, docx: MdDescription, xlsx: MdTableChart };
const STATUS_COLORS = { verified: 'badge-success', signed: 'badge-info', pending: 'badge-warning', submitted: 'badge-orange' };

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function DocumentsTab({ project }) {
  const docs = project.documents || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {docs.length === 0 ? (
        <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
          <div className="table-empty-icon"><MdHourglassEmpty /></div>
          <div className="table-empty-title">No documents uploaded</div>
          <div className="table-empty-desc">Documents will appear here once uploaded.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {docs.map((doc) => {
            const Icon = DOC_ICONS[doc.type] || MdDescription;
            return (
              <div key={doc.id} className="card-insight">
                <Icon style={{ fontSize: '24px', color: doc.type === 'pdf' ? 'var(--color-red)' : doc.type === 'docx' ? 'var(--color-blue)' : 'var(--color-green)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Uploaded {formatDate(doc.uploadDate)}
                  </div>
                </div>
                <span className={`badge badge-sm ${STATUS_COLORS[doc.status] || 'badge-neutral'}`}>
                  {doc.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-ghost btn-with-icon" disabled style={{ opacity: 0.6, cursor: 'not-allowed', alignSelf: 'flex-start' }} title="Document upload coming soon">
        <MdUpload style={{ fontSize: '16px' }} /> Upload Document
      </button>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Document upload will be available in a future update.
      </div>
    </div>
  );
}
