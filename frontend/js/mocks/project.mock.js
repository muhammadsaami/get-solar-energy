window.GSE = window.GSE || {};
window.GSE.Mocks = window.GSE.Mocks || {};

GSE.Mocks.Project = (function () {
  var STAGES_CONFIG = [
    { id: 'initiation', label: 'Initiation', icon: 'flag', color: '#8b5cf6', minHealth: 60 },
    { id: 'design', label: 'Design', icon: 'edit', color: '#17a8e5', minHealth: 55 },
    { id: 'documentation', label: 'Documentation', icon: 'file-text', color: '#fbbf24', minHealth: 50 },
    { id: 'approval', label: 'Approval', icon: 'check-circle', color: '#36d399', minHealth: 45 },
    { id: 'pre-installation', label: 'Pre-Installation', icon: 'tool', color: '#f97316', minHealth: 50 },
    { id: 'installation', label: 'Installation', icon: 'zap', color: '#f43f5e', minHealth: 40 },
    { id: 'commissioning', label: 'Commissioning', icon: 'power', color: '#14b8a6', minHealth: 60 },
    { id: 'completed', label: 'Completed', icon: 'check', color: '#36d399', minHealth: 80 }
  ];

  var CUSTOMERS = [
    { name: 'Rajesh Sharma', city: 'Jaipur', state: 'Rajasthan' },
    { name: 'Priya Patel', city: 'Ahmedabad', state: 'Gujarat' },
    { name: 'Amit Verma', city: 'Lucknow', state: 'Uttar Pradesh' },
    { name: 'Sunita Reddy', city: 'Hyderabad', state: 'Telangana' },
    { name: 'Vikram Singh', city: 'Chandigarh', state: 'Punjab' },
    { name: 'Ananya Gupta', city: 'Indore', state: 'Madhya Pradesh' },
    { name: 'Rohit Joshi', city: 'Pune', state: 'Maharashtra' },
    { name: 'Meera Nair', city: 'Kochi', state: 'Kerala' },
    { name: 'Arjun Desai', city: 'Surat', state: 'Gujarat' },
    { name: 'Kavita Mishra', city: 'Bhopal', state: 'Madhya Pradesh' },
    { name: 'Deepak Kumar', city: 'Patna', state: 'Bihar' },
    { name: 'Neha Kapoor', city: 'Nagpur', state: 'Maharashtra' },
    { name: 'Suresh Iyer', city: 'Coimbatore', state: 'Tamil Nadu' },
    { name: 'Pooja Malhotra', city: 'Lucknow', state: 'Uttar Pradesh' },
    { name: 'Manoj Tiwari', city: 'Varanasi', state: 'Uttar Pradesh' },
    { name: 'Divya Sharma', city: 'Jaipur', state: 'Rajasthan' },
    { name: 'Rahul Mehta', city: 'Mumbai', state: 'Maharashtra' },
    { name: 'Shweta Rao', city: 'Bangalore', state: 'Karnataka' }
  ];

  var ENGINEERS = ['Amit Verma', 'Sneha Patel', 'Raj Kumar', 'Priya Singh', 'Vikram Bhardwaj'];
  var TEAMS = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'];
  var INVERTERS = ['Huawei SUN2000-10KTL', 'Delta M10A', 'Fronius Symo 10kW', 'Sungrow SG10K'];
  var BATTERIES = ['Tesla Powerwall 2', 'LG Chem RESU10', 'None', 'None', 'None'];
  var PRIORITIES = ['low', 'medium', 'high', 'critical'];
  var NOTES_TEMPLATES = [
    'Site visit completed. Roof structure is sound.',
    'Customer confirmed system design approval.',
    'Material delivery scheduled for next week.',
    'Grid interconnection application submitted.',
    'Post-installation training completed with customer.',
    'Final inspection passed. All safety checks cleared.'
  ];

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomFloat(min, max, decimals) {
    var val = Math.random() * (max - min) + min;
    return parseFloat(val.toFixed(decimals || 1));
  }

  function randomDate(startDaysAgo, endDaysFromNow) {
    var now = new Date();
    var start = new Date(now);
    start.setDate(now.getDate() - startDaysAgo);
    var end = new Date(now);
    end.setDate(now.getDate() + endDaysFromNow);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
  }

  function padNum(n) {
    return String(n).padStart(3, '0');
  }

  function generateProject(index) {
    var customer = CUSTOMERS[index % CUSTOMERS.length];
    var stageIdx = index % STAGES_CONFIG.length;
    var stage = STAGES_CONFIG[stageIdx].id;
    var priority = index < 3 ? 'critical' : (index < 7 ? 'high' : (index < 12 ? 'medium' : 'low'));
    var health = randomInt(30, 98);
    var kW = randomFloat(3, 15, 1);
    var panels = Math.round(kW * 2.5);
    var panelCapacity = 400 + randomInt(0, 75);
    var projectValue = Math.round(kW * 45000 + randomInt(-50000, 100000));
    var budgetVariance = randomFloat(-10, 15, 1);
    var timelineVariance = randomInt(-7, 14);
    var startDate = randomDate(180, -30);
    var targetDate = (function () {
      var d = new Date(startDate);
      d.setDate(d.getDate() + randomInt(45, 120));
      return d.toISOString().split('T')[0];
    })();

    var stageStartDates = {};
    var stageCompletionDates = {};
    var completedUpTo = STAGES_CONFIG.indexOf(STAGES_CONFIG[stageIdx]);
    for (var s = 0; s <= completedUpTo; s++) {
      var sid = STAGES_CONFIG[s].id;
      stageStartDates[sid] = s === 0 ? startDate : randomDate(60, 0);
      stageCompletionDates[sid] = s < completedUpTo ? (s === 0 ? randomDate(30, 0) : randomDate(15, 0)) : null;
    }

    var tasks = [];
    var taskNames = ['Site Survey', 'Load Analysis', 'Panel Layout Design', 'Electrical Diagram Review',
      'Subsidy Application', 'Customer Approval', 'Material Procurement', 'Roof Preparation',
      'Panel Installation', 'Inverter Setup', 'Wiring and Cabling', 'System Testing',
      'Commissioning', 'Customer Handover'
    ];
    var taskCount = Math.min(randomInt(4, 12), taskNames.length);
    for (var t = 0; t < taskCount; t++) {
      var taskStatus = t < taskCount * (stageIdx / STAGES_CONFIG.length) ? 'completed' : (t === Math.floor(taskCount * (stageIdx / STAGES_CONFIG.length)) ? 'in-progress' : 'pending');
      tasks.push({
        id: 'T-' + padNum(index) + '-' + padNum(t),
        name: randomItem(taskNames),
        status: taskStatus,
        assignedTo: randomItem(ENGINEERS),
        dueDate: randomDate(30, 60),
        priority: randomItem(PRIORITIES)
      });
    }

    var activities = [];
    var activityTypes = ['stage_change', 'note_added', 'task_completed', 'document_uploaded', 'milestone_reached'];
    var activityMsgs = [
      'Project moved to ' + stage + ' stage',
      'Site survey photos uploaded',
      'Customer signed agreement',
      'Installation completed - ' + randomInt(5, 30) + ' panels installed',
      'Quality inspection passed',
      'Safety audit completed with ' + randomInt(85, 100) + '% score'
    ];
    for (var a = 0; a < randomInt(3, 8); a++) {
      activities.push({
        id: 'A-' + padNum(index) + '-' + padNum(a),
        type: randomItem(activityTypes),
        message: randomItem(activityMsgs),
        timestamp: randomDate(90, 0) + 'T' + String(randomInt(6, 22)).padStart(2, '0') + ':' + String(randomInt(0, 59)).padStart(2, '0') + ':00',
        user: randomItem(ENGINEERS)
      });
    }

    var riskFlags = [];
    var allRisks = ['supply_delay', 'weather_delay', 'budget_overrun', 'permitting_issue', 'structural_concern', 'customer_change'];
    for (var r = 0; r < randomInt(0, 3); r++) {
      var risk = randomItem(allRisks);
      if (riskFlags.indexOf(risk) === -1) riskFlags.push(risk);
    }

    return {
      id: 'PRJ-' + padNum(index + 1),
      projectType: kW >= 10 ? 'commercial' : 'residential',
      title: (kW >= 10 ? 'Commercial ' : 'Residential ') + kW + 'kW Solar Installation',
      description: 'Complete solar PV system for ' + customer.name + ' at ' + customer.city + '. System: ' + panels + ' x ' + panelCapacity + 'W panels.',
      customerName: customer.name,
      customerEmail: customer.name.toLowerCase().replace(' ', '.') + '@example.com',
      customerPhone: '+91' + String(randomInt(7000000000, 9999999999)),
      address: randomInt(1, 999) + ' ' + ['Green Park', 'Sunrise Avenue', 'Lake View', 'Garden Colony', 'Silver Oak'][randomInt(0, 4)],
      city: customer.city,
      state: customer.state,
      pincode: String(randomInt(100000, 999999)),
      projectValue: projectValue,
      currency: 'INR',
      status: stage,
      progress: Math.min(100, Math.round((completedUpTo / (STAGES_CONFIG.length - 1)) * 100)),
      priority: priority,
      startDate: startDate,
      targetDate: targetDate,
      completedDate: stage === 'completed' ? randomDate(30, 0) : null,
      assignedEngineer: randomItem(ENGINEERS),
      assignedTeam: randomItem(TEAMS),
      solarSystemSize: kW,
      panelCount: panels,
      panelCapacity: panelCapacity,
      inverterModel: randomItem(INVERTERS),
      batteryModel: randomItem(BATTERIES),
      healthScore: health,
      budgetVariance: budgetVariance,
      timelineVariance: timelineVariance,
      qualityScore: randomInt(70, 100),
      safetyScore: randomInt(75, 100),
      riskFlags: riskFlags,
      notes: NOTES_TEMPLATES.slice(0, randomInt(1, 4)),
      tasks: tasks,
      activities: activities,
      documents: [],
      stageStartDates: stageStartDates,
      stageCompletionDates: stageCompletionDates
    };
  }

  function generateAll() {
    var projects = [];
    for (var i = 0; i < 18; i++) {
      projects.push(generateProject(i));
    }
    return projects;
  }

  function generateById(id) {
    var all = generateAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  function getStageDistribution() {
    var counts = {};
    for (var i = 0; i < STAGES_CONFIG.length; i++) {
      counts[STAGES_CONFIG[i].id] = 0;
    }
    var all = generateAll();
    for (var j = 0; j < all.length; j++) {
      var s = all[j].status;
      if (counts[s] !== undefined) counts[s]++;
    }
    return counts;
  }

  return {
    STAGES_CONFIG: STAGES_CONFIG,
    generateAll: generateAll,
    generateById: generateById,
    getStageDistribution: getStageDistribution
  };
})();
