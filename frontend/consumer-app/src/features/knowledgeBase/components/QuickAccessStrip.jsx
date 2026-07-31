import React from 'react'
import { MdAccessTime, MdBookmark, MdDownload, MdShield, MdHandyman, MdCloudOff } from 'react-icons/md'
import { QUICK_ACCESS } from '../config/quickAccessConfig'

const ICON_MAP = {
  'icon-clock': MdAccessTime,
  'icon-bookmark': MdBookmark,
  'icon-download': MdDownload,
  'icon-shield': MdShield,
  'icon-wrench': MdHandyman,
  'icon-cloud-off': MdCloudOff,
}

const COLOR_MAP = {
  recent: 'var(--color-blue)',
  bookmarks: 'var(--color-purple)',
  downloads: 'var(--color-green)',
  'safety-sops': 'var(--color-orange)',
  installation: 'var(--color-blue)',
  offline: 'var(--text-muted)',
}

export default function QuickAccessStrip({ onSelect }) {
  return (
    <div className="kb-quick-access">
      {QUICK_ACCESS.map((item) => {
        const Icon = ICON_MAP[item.icon] || MdAccessTime
        const color = COLOR_MAP[item.id] || 'var(--color-blue)'
        return (
          <button
            key={item.id}
            type="button"
            className="btn btn-glass kb-quick-access-item"
            onClick={() => onSelect(item)}
            aria-label={`Quick access: ${item.label}`}
          >
            <Icon size={15} style={{ color }} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
