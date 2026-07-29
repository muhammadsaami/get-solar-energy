window.GSE = window.GSE || {};
window.GSE.Mocks = window.GSE.Mocks || {};

GSE.Mocks.Journey = (function () {
  var STAGES = [
    { id: 'ST-01', label: 'Site Survey', description: 'Initial site assessment and feasibility study', group: 'assessment' },
    { id: 'ST-02', label: 'Bill Validation', description: 'Electricity bill analysis and consumption pattern review', group: 'assessment' },
    { id: 'ST-03', label: 'System Design', description: 'Technical system design and load calculation', group: 'design' },
    { id: 'ST-04', label: 'Proposal', description: 'Detailed proposal with pricing and ROI analysis', group: 'commercial' },
    { id: 'ST-05', label: 'Negotiation', description: 'Price and terms negotiation with customer', group: 'commercial' },
    { id: 'ST-06', label: 'PO Release', description: 'Purchase order release and down payment', group: 'commercial' },
    { id: 'ST-07', label: 'Material Planning', description: 'Material procurement and logistics planning', group: 'execution' },
    { id: 'ST-08', label: 'Installation', description: 'On-site solar system installation', group: 'execution' },
    { id: 'ST-09', label: 'Commissioning', description: 'System testing, commissioning, and handover', group: 'execution' },
    { id: 'ST-10', label: 'Net Metering', description: 'Net metering application and meter installation', group: 'regulatory' },
    { id: 'ST-11', label: 'Discom Approval', description: 'Distribution company approval and connection', group: 'regulatory' },
    { id: 'ST-12', label: 'Payment Received', description: 'Final payment collection and financial closure', group: 'commercial' },
    { id: 'ST-13', label: 'Handover', description: 'System handover, documentation, and training', group: 'completion' }
  ];

  function generate() {
    var now = new Date().toISOString();
    var stageStatus = {};
    var stageData = {};

    for (var i = 0; i < STAGES.length; i++) {
      var stage = STAGES[i];
      if (i < 4) {
        stageStatus[stage.id] = 'completed';
        var completedDate = new Date();
        completedDate.setDate(completedDate.getDate() - (13 - i) * 7);
        stageData[stage.id] = {
          completedDate: completedDate.toISOString().split('T')[0],
          notes: stage.label + ' completed successfully.',
          documents: ['report_' + stage.id.toLowerCase() + '.pdf']
        };
      } else if (i === 4) {
        stageStatus[stage.id] = 'active';
        stageData[stage.id] = {
          startedDate: new Date().toISOString().split('T')[0],
          notes: 'Currently in progress.',
          documents: []
        };
      } else {
        stageStatus[stage.id] = 'locked';
        stageData[stage.id] = {
          notes: '',
          documents: []
        };
      }
    }

    return {
      currentStage: 'ST-05',
      stageStatus: stageStatus,
      stageData: stageData,
      journeyStarted: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
      targetCompletion: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0],
      overallProgress: 35,
      customerName: 'Rajesh Sharma',
      customerEmail: 'rajesh.sharma@example.com',
      projectType: 'Residential Rooftop',
      systemSize: '5.2 kW'
    };
  }

  return {
    STAGES: STAGES,
    generate: generate
  };
})();
