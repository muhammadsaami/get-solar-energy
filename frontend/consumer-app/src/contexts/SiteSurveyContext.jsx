import React, { createContext, useContext, useState, useCallback } from 'react';
import { siteSurveyService } from '../services/siteSurvey.service';
import { useJourney } from './JourneyContext';

const SiteSurveyContext = createContext(null);

export function SiteSurveyProvider({ children }) {
  const { updateStage } = useJourney();
  const [surveys, setSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await siteSurveyService.getDashboard();
      setDashboardStats(stats);
      return stats;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSurveys = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const result = await siteSurveyService.listSurveys(params);
      setSurveys(result.data);
      return result;
    } catch (err) {
      setError(err.message);
      return { data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSurvey = useCallback(async (id) => {
    setLoading(true);
    try {
      const survey = await siteSurveyService.getSurvey(id);
      setCurrentSurvey(survey);
      return survey;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSurvey = useCallback(async (data) => {
    setLoading(true);
    try {
      const survey = await siteSurveyService.createSurvey(data);
      setSurveys(prev => [survey, ...prev]);
      setCurrentSurvey(survey);
      return survey;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSurvey = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const survey = await siteSurveyService.updateSurvey(id, data);
      setCurrentSurvey(survey);
      setSurveys(prev => prev.map(s => s.id === id ? survey : s));
      return survey;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    try {
      const survey = await siteSurveyService.updateStatus(id, status);
      if (survey) {
        setCurrentSurvey(survey);
        setSurveys(prev => prev.map(s => s.id === id ? survey : s));
        if (status === 'approved') {
          updateStage('ST-08');
        }
        if (dashboardStats) {
          const stats = await siteSurveyService.getDashboard();
          setDashboardStats(stats);
        }
      }
      return survey;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [dashboardStats, updateStage]);

  const assignSurveyor = useCallback(async (id, assignedTo, assignedName) => {
    try {
      const survey = await siteSurveyService.assignSurveyor(id, assignedTo, assignedName);
      if (survey) {
        setCurrentSurvey(survey);
        setSurveys(prev => prev.map(s => s.id === id ? survey : s));
      }
      return survey;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const runAiFeasibility = useCallback(async (data) => {
    try {
      return await siteSurveyService.runAiFeasibility(data);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    surveys, currentSurvey, dashboardStats, loading, error,
    fetchDashboard, fetchSurveys, fetchSurvey,
    createSurvey, updateSurvey, updateStatus,
    assignSurveyor, runAiFeasibility,
    setCurrentSurvey,
  };

  return (
    <SiteSurveyContext.Provider value={value}>
      {children}
    </SiteSurveyContext.Provider>
  );
}

export function useSiteSurvey() {
  const ctx = useContext(SiteSurveyContext);
  if (!ctx) throw new Error('useSiteSurvey must be used within SiteSurveyProvider');
  return ctx;
}
