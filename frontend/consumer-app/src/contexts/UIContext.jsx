import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  const toggleMobileDrawer = () => {
    setIsMobileDrawerOpen(prev => !prev);
  };

  const setMobileDrawerOpen = (open) => {
    setIsMobileDrawerOpen(open);
  };

  const value = {
    isSidebarCollapsed,
    isDrawerOpen,
    isMobileDrawerOpen,
    toggleSidebar,
    toggleDrawer,
    toggleMobileDrawer,
    setIsDrawerOpen,
    setMobileDrawerOpen,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
