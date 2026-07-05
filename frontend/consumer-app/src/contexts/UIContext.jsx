import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  const value = {
    isSidebarCollapsed,
    isDrawerOpen,
    toggleSidebar,
    toggleDrawer,
    setIsDrawerOpen
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
