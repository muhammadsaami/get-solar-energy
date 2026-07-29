import React, { useState } from 'react';
import { MdSend } from 'react-icons/md';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export default function NotesTab({ project }) {
  const [notes, setNotes] = useState(project.notes || []);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: `note-${Date.now()}`,
      author: 'Current User',
      content: newNote.trim(),
      timestamp: new Date().toISOString()
    };
    setNotes(prev => [note, ...prev]);
    setNewNote('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="form-group">
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <textarea
            className="form-textarea"
            placeholder="Add a note... (local only, will be saved in future update)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            aria-label="Add a note"
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary btn-icon"
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            aria-label="Submit note"
            style={{ alignSelf: 'flex-end', height: 'fit-content' }}
          >
            <MdSend />
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="table-empty" style={{ padding: 'var(--space-8) 0' }}>
          <div className="table-empty-icon">📝</div>
          <div className="table-empty-title">No notes yet</div>
          <div className="table-empty-desc">Add a note above to track project discussions and observations.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notes.map((note) => (
            <div key={note.id} className="card-insight" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div className="avatar avatar-xs" style={{ background: 'var(--color-orange)' }}>{note.author.charAt(0)}</div>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>{note.author}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(note.timestamp)}</span>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
