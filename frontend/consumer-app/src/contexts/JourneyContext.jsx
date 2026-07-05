import React, { createContext, useState, useContext } from 'react';
import { JOURNEY_CONFIG } from '../constants/journey.config';

const JourneyContext = createContext(null);

export function JourneyProvider({ children }) {
  // Primary journey stage state - defaults to ST-02 (Bill Uploaded) for demonstration of slice features
  const [currentStageId, setCurrentStageId] = useState(() => {
    return localStorage.getItem('current_stage_id') || 'ST-02';
  });

  const updateStage = (stageId) => {
    if (JOURNEY_CONFIG[stageId]) {
      setCurrentStageId(stageId);
      localStorage.setItem('current_stage_id', stageId);
    }
  };

  const getActiveConfig = () => {
    return JOURNEY_CONFIG[currentStageId] || JOURNEY_CONFIG['ST-01'];
  };

  const getProgressPercentage = () => {
    const config = getActiveConfig();
    return config.progressWeight;
  };

  const isRouteUnlocked = (routePath) => {
    // Map paths directly to configurations
    const activeConfig = getActiveConfig();
    // Allow users to access home/journey at all times
    if (routePath === '/app/home' || routePath === '/app/journey') {
      return true;
    }
    // Check configuration unlock list
    return activeConfig.unlockRoutes.includes(routePath);
  };

  const value = {
    currentStageId,
    updateStage,
    getActiveConfig,
    getProgressPercentage,
    isRouteUnlocked,
    journeyTimeline: Object.values(JOURNEY_CONFIG)
  };

  return (
    <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  return useContext(JourneyContext);
}
