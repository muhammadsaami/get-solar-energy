import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useJourney } from './JourneyContext';
import { billService } from '../services/bill.service';
import { roofService } from '../services/roof.service';
import { proposalService } from '../services/proposal.service';

const PlanningContext = createContext(null);

export function PlanningProvider({ children }) {
  const { currentStageId, updateStage } = useJourney();

  // State Domains
  const [bills, setBills] = useState([]);
  const [activeBillOcr, setActiveBillOcr] = useState(null);
  const [roofAnalysis, setRoofAnalysis] = useState(null);
  const [proposal, setProposal] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [roofLoading, setRoofLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep references to AbortControllers to cancel previous runs on re-entry
  const billAbortRef = useRef(null);
  const roofAbortRef = useRef(null);

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      if (billAbortRef.current) billAbortRef.current.abort();
      if (roofAbortRef.current) roofAbortRef.current.abort();
    };
  }, []);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const loadedBills = await billService.getBills();
        setBills(loadedBills);
        if (loadedBills.length > 0) {
          setActiveBillOcr(loadedBills[0]);
        }

        const loadedRoof = await roofService.getRoofAnalysis();
        setRoofAnalysis(loadedRoof);

        const loadedProposal = await proposalService.getProposal();
        setProposal(loadedProposal);
      } catch (err) {
        setError(err.message || "Failed to load planning workspace data.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const uploadBill = async (file) => {
    // Cancel previous pending upload request if any
    if (billAbortRef.current) {
      billAbortRef.current.abort();
    }
    billAbortRef.current = new AbortController();

    setOcrLoading(true);
    setError(null);
    try {
      const newBill = await billService.upload(file, billAbortRef.current.signal);
      setBills(prev => [newBill, ...prev]);
      setActiveBillOcr(newBill);

      // Automatically sync proposal recommendations to the newly analyzed bill parameters
      setProposal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          systemSizeKw: newBill.recommendedKw,
          expectedGenerationYrHkwh: newBill.monthlyGeneration * 12,
          monthlySavings: newBill.monthlySavings,
          annualSavings: newBill.monthlySavings * 12,
          lifetimeSavings: newBill.savings25yr,
          paybackYears: newBill.paybackYears,
          systemCost: newBill.systemCost
        };
      });

      // Synchronize journey progression: advance stage to ST-02 (Bill Uploaded)
      if (currentStageId === 'ST-01') {
        updateStage('ST-02');
      }
      return { success: true };
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      setError(err.message || "Failed to upload utility bill.");
      return { success: false, error: err.message };
    } finally {
      setOcrLoading(false);
    }
  };

  const uploadRoofImage = async (image, lengthFt, widthFt, city) => {
    // Cancel previous pending roof analysis request if any
    if (roofAbortRef.current) {
      roofAbortRef.current.abort();
    }
    roofAbortRef.current = new AbortController();

    setRoofLoading(true);
    setError(null);
    try {
      const updatedRoof = await roofService.analyze(image, lengthFt, widthFt, city, roofAbortRef.current.signal);
      setRoofAnalysis(updatedRoof);

      // Automatically sync proposal recommendations to the newly analyzed roof size
      setProposal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          systemSizeKw: updatedRoof.systemSizeKw,
          expectedGenerationYrHkwh: updatedRoof.annualGenerationUnits
        };
      });

      // Synchronize journey progression: advance stage to ST-04 (Roof Assessed)
      if (currentStageId === 'ST-02' || currentStageId === 'ST-03') {
        updateStage('ST-04');
      }
      return { success: true };
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      setError(err.message || "Failed to analyze rooftop image.");
      return { success: false, error: err.message };
    } finally {
      setRoofLoading(false);
    }
  };

  const deleteBill = async (id) => {
    setLoading(true);
    try {
      await billService.deleteBill(id);
      setBills(prev => prev.filter(b => b.id !== id));
      if (activeBillOcr?.id === id) {
        setActiveBillOcr(null);
      }
      return { success: true };
    } catch (err) {
      setError(err.message || "Failed to delete bill.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const approveProposal = async () => {
    setLoading(true);
    try {
      await proposalService.approve();
      if (proposal) {
        setProposal(prev => ({ ...prev, status: 'Approved' }));
      }
      // Synchronize journey progression: advance stage to ST-06 (Proposal Approved)
      updateStage('ST-06');
      return { success: true };
    } catch (err) {
      setError(err.message || "Failed to approve proposal.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    bills,
    activeBillOcr,
    roofAnalysis,
    proposal,
    loading,
    ocrLoading,
    roofLoading,
    error,
    uploadBill,
    uploadRoofImage,
    deleteBill,
    approveProposal
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  return useContext(PlanningContext);
}
