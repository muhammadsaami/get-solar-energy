import React from 'react'
import { useLocation } from 'react-router-dom'
import type { SidebarItemConfig } from '../../config/sidebar'

interface SidebarItemProps {
  item: SidebarItemConfig
  isCollapsed: boolean
  icon: React.ReactNode
}

export default function SidebarItem({ item, isCollapsed: _isCollapsed, icon }: SidebarItemProps) {
  const location = useLocation()
  
  // React Router v6: Check if current path starts with item route
  // For dashboard it might be exact, but we'll keep it simple:
  const isActive = item.route !== '#' && location.pathname === item.route
  const className = `menu-item ${isActive ? 'active' : ''}`.trim()

  return (
    <li
      className={className}
      data-tab={item.id}
      data-color={item.color}
      data-tooltip={item.label}
    >
      <a
        href={item.route}
        data-tooltip={item.label}
        onClick={item.route === '#' ? (e) => e.preventDefault() : undefined}
      >
        {icon}
        <span>{item.label}</span>
      </a>
    </li>
  )
}
