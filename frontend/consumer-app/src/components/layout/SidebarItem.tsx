import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import type { SidebarItemConfig } from '../../config/sidebar'
import { usePermissions } from '../../hooks/usePermissions'

interface SidebarItemProps {
  item: SidebarItemConfig
  isCollapsed?: boolean
}

export default function SidebarItem({ item }: SidebarItemProps) {
  const { canAccess } = usePermissions()
  const location = useLocation()

  const isDisabled = item.route === '#'
  const hasAccess = !item.requiredFeature || canAccess(item.requiredFeature)
  const isActive = !isDisabled && location.pathname === item.route
  const className = `menu-item ${isActive ? 'active' : ''}`.trim()
  const idAttr = item.id === 'admin-dashboard' ? 'menu-item-admin' : item.id === 'crm-dashboard' ? 'menu-item-crm' : item.id === 'audit-monitoring' ? 'menu-item-audit' : item.id === 'business-intelligence' ? 'menu-item-bi' : item.id === 'mlops-dashboard' ? 'menu-item-mlops' : undefined

  if (!hasAccess) return null

  return (
    <li
      id={idAttr}
      className={className}
      data-tab={item.id}
      data-color={item.color}
      style={!item.visible ? { display: 'none' } : undefined}
    >
      {isDisabled ? (
        <a href="#" data-tooltip={item.label} onClick={(e) => e.preventDefault()}>
          <svg><use href={`#icon-${item.symbolId}`}></use></svg>
          <span>{item.label}</span>
        </a>
      ) : (
        <Link to={item.route} data-tooltip={item.label}>
          <svg><use href={`#icon-${item.symbolId}`}></use></svg>
          <span>{item.label}</span>
        </Link>
      )}
    </li>
  )
}
