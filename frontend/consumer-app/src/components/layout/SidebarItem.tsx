import React from 'react'
import { useLocation } from 'react-router-dom'
import type { SidebarItemConfig } from '../../config/sidebar'

interface SidebarItemProps {
  item: SidebarItemConfig
  isCollapsed?: boolean
}

export default function SidebarItem({ item }: SidebarItemProps) {
  const location = useLocation()
  
  const isActive = item.route !== '#' && (
    location.pathname === item.route ||
    (item.id === 'bill-analyzer' && (location.pathname === '/app/bill-analyzer' || location.pathname === '/app/planning/bills'))
  )
  const className = `menu-item ${isActive ? 'active' : ''}`.trim()
  const idAttr = item.id === 'admin-dashboard' ? 'menu-item-admin' : item.id === 'crm-dashboard' ? 'menu-item-crm' : item.id === 'audit-monitoring' ? 'menu-item-audit' : item.id === 'business-intelligence' ? 'menu-item-bi' : item.id === 'mlops-dashboard' ? 'menu-item-mlops' : undefined

  return (
    <li
      id={idAttr}
      className={className}
      data-tab={item.id}
      data-color={item.color}
      style={!item.visible ? { display: 'none' } : undefined}
    >
      <a
        href={item.route}
        data-tooltip={item.label}
        onClick={item.route === '#' ? (e) => e.preventDefault() : undefined}
      >
        <svg><use href={`#icon-${item.symbolId}`}></use></svg>
        <span>{item.label}</span>
      </a>
    </li>
  )
}
