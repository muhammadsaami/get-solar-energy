window.GSE = window.GSE || {};
window.GSE.Mocks = window.GSE.Mocks || {};

GSE.Mocks.Planning = (function () {
  var MODULES = [
    { id: 'bill', label: 'Bill Analysis', icon: 'bill', route: 'bill-analyzer' },
    { id: 'roof', label: 'Roof Analysis', icon: 'roof', route: 'roof-analysis' },
    { id: 'roi', label: 'ROI Calculator', icon: 'calculator', route: 'roi-calculator' },
    { id: 'proposal', label: 'Proposal', icon: 'briefcase', route: 'vendor-portal' }
  ];

  function generate() {
    return {
      moduleStatus: {
        bill: 'completed',
        roof: 'completed',
        roi: 'completed',
        proposal: 'ready'
      },
      syncedFields: {
        billToRoof: {
          monthlyUnits: 420,
          recommendedKw: 4.5,
          discom: 'Jaipur Vidyut Vitran Nigam',
          consumerNumber: 'JVVN-2024-0087412'
        },
        roofToROI: {
          roofAreaSqft: 320,
          solarPotential: 92,
          panelCount: 12,
          systemSizeKw: 4.5
        },
        roiToProposal: {
          monthlyBill: 5400,
          annualSavings: 78500,
          paybackPeriod: 1.3,
          systemCost: 202500,
          subsidy: 78000,
          netInvestment: 102000,
          lifetimeSavings: 1962500
        }
      },
      currentJourneyStage: 'ST-04',
      overallProgress: 75,
      lastSyncTime: new Date().toISOString()
    };
  }

  return {
    MODULES: MODULES,
    generate: generate
  };
})();
