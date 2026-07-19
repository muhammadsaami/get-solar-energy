import React from 'react'
import { NavLink } from 'react-router-dom'
import type { SidebarItemConfig } from '../../config/sidebar'

interface SidebarItemProps {
  item: SidebarItemConfig
  isCollapsed: boolean
  icon: React.ReactNode
}

export default function SidebarItem({ item, isCollapsed: _isCollapsed, icon }: SidebarItemProps) {
  const isLocked = item.route === '#'

  if (isLocked) {
    return (
      <li
        className="menu-item"
        data-tab={item.id}
        data-color={item.color}
        data-tooltip={item.label}
      >
        <a
          href="#"
          data-tooltip={item.label}
          onClick={(e) => e.preventDefault()}
          style={{ cursor: 'not-allowed', opacity: 0.45 }}
          aria-disabled="true"
        >
          {icon}
          <span>{item.label}</span>
        </a>
      </li>
    )
  }

  return (
    <li
      className="menu-item"
      data-tab={item.id}
      data-color={item.color}
      data-tooltip={item.label}
    >
      <NavLink
        to={item.route}
        data-tooltip={item.label}
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        {icon}
        <span>{item.label}</span>
      </NavLink>
    </li>
  )
}
