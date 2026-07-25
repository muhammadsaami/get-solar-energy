import api from './api/client';

const STAGES = [
  { id: 'lead', label: 'Lead', icon: '📋', color: 'var(--color-blue)' },
  { id: 'site-survey', label: 'Site Survey', icon: '🔍', color: 'var(--color-purple)' },
  { id: 'proposal-sent', label: 'Proposal Sent', icon: '📄', color: 'var(--color-yellow)' },
  { id: 'approved', label: 'Approved', icon: '✅', color: 'var(--color-green)' },
  { id: 'installation', label: 'Installation', icon: '🔧', color: 'var(--color-orange)' },
  { id: 'inspection', label: 'Inspection', icon: '🔎', color: 'var(--color-cyan)' },
  { id: 'completed', label: 'Completed', icon: '🏆', color: 'var(--color-green)' },
  { id: 'amc', label: 'AMC', icon: '🛡️', color: 'var(--color-purple)' }
];

const PRIORITIES = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

const HEALTH_CONFIG = {
  weights: { delay: 0.30, completion: 0.25, overdueTasks: 0.15, budgetVariance: 0.10, inspectionStatus: 0.10, openRisks: 0.10 },
  thresholds: { healthy: 70, atRisk: 40 }
};

class ProjectModel {
  constructor(raw) {
    this.id = raw.id || `PRJ-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    this.projectName = raw.projectName || 'Untitled Project';
    this.customerName = raw.customerName || '';
    this.customerEmail = raw.customerEmail || '';
    this.customerPhone = raw.customerPhone || '';
    this.address = raw.address || '';
    this.city = raw.city || '';
    this.state = raw.state || '';
    this.pincode = raw.pincode || '';
    this.capacityKw = raw.capacityKw || 0;
    this.systemType = raw.systemType || 'residential';
    this.currentStage = raw.currentStage || 'lead';
    this.assignedEngineer = raw.assignedEngineer || { name: '', email: '', avatar: '' };
    this.assignedInstaller = raw.assignedInstaller || { name: '', email: '', avatar: '' };
    this.completionPercent = raw.completionPercent || 0;
    this.revenue = raw.revenue || { budget: 0, actual: 0 };
    this.status = raw.status || 'on-track';
    this.priority = raw.priority || 'medium';
    this.startDate = raw.startDate || new Date().toISOString();
    this.deadline = raw.deadline || new Date().toISOString();
    this.actualEndDate = raw.actualEndDate || null;
    this.totalBudget = raw.totalBudget || 0;
    this.materialsCost = raw.materialsCost || 0;
    this.laborCost = raw.laborCost || 0;
    this.miscCost = raw.miscCost || 0;
    this.leadSource = raw.leadSource || 'referral';
    this.projectType = raw.projectType || 'new';
    this.notes = raw.notes || [];
    this.milestones = raw.milestones || [];
    this.documents = raw.documents || [];
    this.risks = raw.risks || [];
    this.stageHistory = raw.stageHistory || [{ stage: raw.currentStage || 'lead', enteredAt: new Date().toISOString() }];
    this.lastUpdated = raw.lastUpdated || new Date().toISOString();
    this.createdAt = raw.createdAt || new Date().toISOString();
  }

  get health() {
    return computeHealthScore(this);
  }

  get delayDays() {
    const deadline = new Date(this.deadline);
    const now = new Date();
    const ref = this.status === 'completed' && this.actualEndDate ? new Date(this.actualEndDate) : now;
    const diff = Math.floor((ref - deadline) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  get budgetVariancePercent() {
    if (this.totalBudget === 0) return 0;
    const totalCost = this.materialsCost + this.laborCost + this.miscCost;
    return ((totalCost - this.totalBudget) / this.totalBudget) * 100;
  }

  get overdueTasksCount() {
    return 0;
  }

  get openRisksCount() {
    return this.risks.filter(r => r.status === 'open').length;
  }

  get daysInStage() {
    const history = this.stageHistory;
    if (history.length === 0) return 0;
    const last = history[history.length - 1];
    const entered = new Date(last.enteredAt);
    return Math.floor((new Date() - entered) / (1000 * 60 * 60 * 24));
  }
}

function computeHealthScore(project) {
  const w = HEALTH_CONFIG.weights;
  const delayScore = Math.max(0, 100 - project.delayDays * 10);
  const completionScore = project.completionPercent;
  const tasksScore = Math.max(0, 100 - project.overdueTasksCount * 20);
  const budgetScore = Math.max(0, 100 - Math.abs(project.budgetVariancePercent) * 2);
  const inspectionScore = project.currentStage === 'inspection' ? 50 : project.currentStage === 'completed' || project.currentStage === 'amc' ? 100 : 80;
  const riskScore = Math.max(0, 100 - project.openRisksCount * 25);

  const score = Math.round(
    delayScore * w.delay +
    completionScore * w.completion +
    tasksScore * w.overdueTasks +
    budgetScore * w.budgetVariance +
    inspectionScore * w.inspectionStatus +
    riskScore * w.openRisks
  );

  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: clamped,
    label: clamped >= HEALTH_CONFIG.thresholds.healthy ? 'Healthy' : clamped >= HEALTH_CONFIG.thresholds.atRisk ? 'At Risk' : 'Critical',
    color: clamped >= HEALTH_CONFIG.thresholds.healthy ? 'var(--color-green)' : clamped >= HEALTH_CONFIG.thresholds.atRisk ? 'var(--color-yellow)' : 'var(--color-red)'
  };
}

function computeKpis(projects) {
  const total = projects.length;
  const active = projects.filter(p => !['completed', 'amc'].includes(p.currentStage));
  const completed = projects.filter(p => p.currentStage === 'completed');
  const delayed = projects.filter(p => p.delayDays > 0 && !['completed', 'amc'].includes(p.currentStage));
  const avgCompletion = active.length > 0 ? Math.round(active.reduce((s, p) => s + p.completionPercent, 0) / active.length) : 0;
  const totalRevenue = projects.reduce((s, p) => s + (p.revenue.actual || 0), 0);
  const pipelineRevenue = projects.filter(p => ['lead', 'site-survey', 'proposal-sent'].includes(p.currentStage))
    .reduce((s, p) => s + (p.revenue.budget || 0), 0);

  const avgCompletionDays = projects.filter(p => p.currentStage === 'completed' && p.actualEndDate && p.startDate)
    .reduce((s, p) => {
      const diff = Math.floor((new Date(p.actualEndDate) - new Date(p.startDate)) / (1000 * 60 * 60 * 24));
      return s + diff;
    }, 0) / Math.max(1, projects.filter(p => p.currentStage === 'completed').length);

  const healthyCount = projects.filter(p => p.health.label === 'Healthy').length;
  const atRiskCount = projects.filter(p => p.health.label === 'At Risk').length;
  const criticalCount = projects.filter(p => p.health.label === 'Critical').length;

  return {
    total, activeProjects: active.length, completedProjects: completed.length,
    delayedProjects: delayed.length, avgCompletionPercent: avgCompletion,
    totalRevenue, pipelineRevenue, avgCompletionDays: Math.round(avgCompletionDays),
    healthyCount, atRiskCount, criticalCount
  };
}

const ENGINEERS = [
  { name: 'Ravi Sharma', email: 'ravi.sharma@getsolar.com', avatar: '' },
  { name: 'Priya Patel', email: 'priya.patel@getsolar.com', avatar: '' },
  { name: 'Amit Verma', email: 'amit.verma@getsolar.com', avatar: '' },
  { name: 'Sneha Gupta', email: 'sneha.gupta@getsolar.com', avatar: '' },
  { name: 'Vikram Singh', email: 'vikram.singh@getsolar.com', avatar: '' }
];

const INSTALLERS = [
  { name: 'Raj Kumar', email: 'raj.kumar@getsolar.com', avatar: '' },
  { name: 'Sunil Yadav', email: 'sunil.yadav@getsolar.com', avatar: '' },
  { name: 'Deepak Mishra', email: 'deepak.mishra@getsolar.com', avatar: '' },
  { name: 'Anil Joshi', email: 'anil.joshi@getsolar.com', avatar: '' },
  { name: 'Manoj Tiwari', email: 'manoj.tiwari@getsolar.com', avatar: '' }
];

const CUSTOMERS = [
  { name: 'Arjun Mehta', email: 'arjun.mehta@email.com', phone: '+91-9876543210', city: 'Jaipur', state: 'Rajasthan' },
  { name: 'Neha Kapoor', email: 'neha.kapoor@email.com', phone: '+91-9876543211', city: 'Delhi', state: 'Delhi' },
  { name: 'Rakesh Gupta', email: 'rakesh.gupta@email.com', phone: '+91-9876543212', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Sunita Reddy', email: 'sunita.reddy@email.com', phone: '+91-9876543213', city: 'Bangalore', state: 'Karnataka' },
  { name: 'Vikram Joshi', email: 'vikram.joshi@email.com', phone: '+91-9876543214', city: 'Pune', state: 'Maharashtra' },
  { name: 'Ananya Singh', email: 'ananya.singh@email.com', phone: '+91-9876543215', city: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Suresh Verma', email: 'suresh.verma@email.com', phone: '+91-9876543216', city: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Priyanka Desai', email: 'priyanka.desai@email.com', phone: '+91-9876543217', city: 'Hyderabad', state: 'Telangana' },
  { name: 'Amit Chaudhary', email: 'amit.chaudhary@email.com', phone: '+91-9876543218', city: 'Jaipur', state: 'Rajasthan' },
  { name: 'Deepa Nair', email: 'deepa.nair@email.com', phone: '+91-9876543219', city: 'Bangalore', state: 'Karnataka' }
];

function generateMilestones(projectStage, startDate) {
  const stageOrder = STAGES.map(s => s.id);
  const currentIdx = stageOrder.indexOf(projectStage);
  const milestones = [];

  stageOrder.forEach((stageId, idx) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + idx * 14);
    const status = idx < currentIdx ? 'completed' : idx === currentIdx ? 'active' : 'pending';
    const completedDate = idx <= currentIdx ? date.toISOString() : null;

    milestones.push({
      stageId,
      label: STAGES[idx].label,
      icon: STAGES[idx].icon,
      status,
      enteredAt: completedDate || null,
      completedAt: idx < currentIdx ? date.toISOString() : null,
      order: idx
    });
  });

  return milestones;
}

function generateDocuments() {
  return [
    { id: 'doc-1', name: 'Site Survey Report.pdf', type: 'pdf', uploadDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'verified' },
    { id: 'doc-2', name: 'Technical Specification.docx', type: 'docx', uploadDate: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'verified' },
    { id: 'doc-3', name: 'Customer Agreement.pdf', type: 'pdf', uploadDate: new Date(Date.now() - 86400000 * 15).toISOString(), status: 'signed' },
    { id: 'doc-4', name: 'Equipment Invoice.xlsx', type: 'xlsx', uploadDate: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'pending' },
    { id: 'doc-5', name: 'Commissioning Certificate.pdf', type: 'pdf', uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'verified' },
    { id: 'doc-6', name: 'Warranty Documents.pdf', type: 'pdf', uploadDate: new Date(Date.now() - 86400000 * 20).toISOString(), status: 'verified' },
    { id: 'doc-7', name: 'Net Metering Application.pdf', type: 'pdf', uploadDate: new Date(Date.now() - 86400000 * 7).toISOString(), status: 'submitted' },
    { id: 'doc-8', name: 'AMC Agreement.pdf', type: 'pdf', uploadDate: new Date(Date.now() - 86400000 * 30).toISOString(), status: 'signed' }
  ];
}

function generateRisks() {
  return [
    { id: 'risk-1', description: 'Roof structural concerns during site survey', impact: 'High', probability: 'Low', mitigation: 'Reinforcement assessment completed', status: 'mitigated' },
    { id: 'risk-2', description: 'Delay in DISCOM net metering approval', impact: 'Medium', probability: 'High', mitigation: 'Early application submitted', status: 'open' },
    { id: 'risk-3', description: 'Supply chain delay for inverters', impact: 'High', probability: 'Medium', mitigation: 'Alternative vendor identified', status: 'open' },
    { id: 'risk-4', description: 'Weather delay during panel installation', impact: 'Medium', probability: 'Medium', mitigation: 'Buffer days added to schedule', status: 'mitigated' },
    { id: 'risk-5', description: 'Budget overrun on labor costs', impact: 'Low', probability: 'Medium', mitigation: 'Fixed-price contractor agreement', status: 'closed' }
  ];
}

function generateNotes() {
  return [
    { id: 'note-1', author: 'Ravi Sharma', content: 'Customer requested additional panels for future expansion. Need to revise proposal.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'note-2', author: 'Priya Patel', content: 'Site survey completed. Roof orientation is ideal, minimal shading observed.', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'note-3', author: 'Amit Verma', content: 'Installation scheduled for next week. Team confirmed availability.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() }
  ];
}

const createProject = (customer, stage, engineer, installer, capacityKw, systemType, priority, status, completionPercent, revenueActual, projectType) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90));

  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + 60 + Math.floor(Math.random() * 60));

  const budget = capacityKw * 50000 + Math.floor(Math.random() * 200000);

  return new ProjectModel({
    projectName: `${customer.city} ${systemType === 'residential' ? 'Home' : systemType === 'commercial' ? 'Commercial' : 'Industrial'} Solar — ${customer.name.split(' ')[0]}`,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    address: `${Math.floor(Math.random() * 999) + 1}, ${customer.city} Colony`,
    city: customer.city,
    state: customer.state,
    capacityKw,
    systemType,
    currentStage: stage,
    assignedEngineer: engineer,
    assignedInstaller: installer,
    completionPercent,
    revenue: { budget, actual: revenueActual || Math.round(budget * (0.7 + Math.random() * 0.3)) },
    status: status || 'on-track',
    priority: priority || 'medium',
    startDate: startDate.toISOString(),
    deadline: deadline.toISOString(),
    totalBudget: budget,
    materialsCost: Math.round(budget * 0.55),
    laborCost: Math.round(budget * 0.25),
    miscCost: Math.round(budget * 0.10),
    projectType: projectType || 'new',
    leadSource: ['referral', 'website', 'walk-in', 'social-media', 'partner'][Math.floor(Math.random() * 5)],
    milestones: generateMilestones(stage, startDate.toISOString()),
    documents: generateDocuments().slice(0, Math.floor(Math.random() * 5) + 3),
    risks: generateRisks().slice(0, Math.floor(Math.random() * 3) + 1),
    notes: generateNotes().slice(0, Math.floor(Math.random() * 2) + 1),
    stageHistory: [{ stage, enteredAt: new Date().toISOString() }],
    lastUpdated: new Date().toISOString()
  });
};

let projects = [
  createProject(CUSTOMERS[0], 'lead', ENGINEERS[0], INSTALLERS[0], 5.2, 'residential', 'medium', 'on-track', 5, 0, 'new'),
  createProject(CUSTOMERS[1], 'lead', ENGINEERS[1], INSTALLERS[1], 8.0, 'residential', 'high', 'on-track', 10, 0, 'new'),
  createProject(CUSTOMERS[2], 'lead', ENGINEERS[2], INSTALLERS[2], 25.0, 'commercial', 'medium', 'on-track', 8, 0, 'new'),
  createProject(CUSTOMERS[3], 'lead', ENGINEERS[3], INSTALLERS[3], 50.0, 'commercial', 'low', 'on-track', 3, 0, 'retrofit'),
  createProject(CUSTOMERS[4], 'site-survey', ENGINEERS[4], INSTALLERS[4], 10.0, 'residential', 'high', 'on-track', 20, 0, 'new'),
  createProject(CUSTOMERS[5], 'site-survey', ENGINEERS[0], INSTALLERS[0], 15.0, 'commercial', 'medium', 'on-track', 25, 0, 'new'),
  createProject(CUSTOMERS[6], 'site-survey', ENGINEERS[1], INSTALLERS[1], 100.0, 'industrial', 'critical', 'at-risk', 15, 0, 'expansion'),
  createProject(CUSTOMERS[7], 'proposal-sent', ENGINEERS[2], INSTALLERS[2], 7.5, 'residential', 'medium', 'on-track', 30, 0, 'new'),
  createProject(CUSTOMERS[8], 'proposal-sent', ENGINEERS[3], INSTALLERS[3], 35.0, 'commercial', 'high', 'on-track', 35, 0, 'retrofit'),
  createProject(CUSTOMERS[9], 'proposal-sent', ENGINEERS[4], INSTALLERS[4], 200.0, 'industrial', 'critical', 'on-track', 40, 500000, 'new'),
  createProject(CUSTOMERS[0], 'approved', ENGINEERS[0], INSTALLERS[0], 6.0, 'residential', 'medium', 'on-track', 45, 0, 'new'),
  createProject(CUSTOMERS[1], 'approved', ENGINEERS[1], INSTALLERS[1], 20.0, 'commercial', 'high', 'on-track', 50, 200000, 'new'),
  createProject(CUSTOMERS[2], 'approved', ENGINEERS[2], INSTALLERS[2], 12.0, 'residential', 'low', 'delayed', 40, 0, 'new'),
  createProject(CUSTOMERS[3], 'installation', ENGINEERS[3], INSTALLERS[3], 8.5, 'residential', 'high', 'on-track', 60, 150000, 'new'),
  createProject(CUSTOMERS[4], 'installation', ENGINEERS[4], INSTALLERS[4], 45.0, 'commercial', 'critical', 'on-track', 65, 500000, 'new'),
  createProject(CUSTOMERS[5], 'installation', ENGINEERS[0], INSTALLERS[0], 75.0, 'commercial', 'high', 'at-risk', 50, 300000, 'retrofit'),
  createProject(CUSTOMERS[6], 'installation', ENGINEERS[1], INSTALLERS[1], 150.0, 'industrial', 'critical', 'delayed', 35, 800000, 'expansion'),
  createProject(CUSTOMERS[7], 'inspection', ENGINEERS[1], INSTALLERS[2], 10.0, 'residential', 'medium', 'on-track', 85, 450000, 'new'),
  createProject(CUSTOMERS[8], 'inspection', ENGINEERS[2], INSTALLERS[3], 60.0, 'commercial', 'high', 'on-track', 90, 1200000, 'new'),
  createProject(CUSTOMERS[9], 'completed', ENGINEERS[3], INSTALLERS[4], 5.0, 'residential', 'medium', 'completed', 100, 250000, 'new'),
  createProject(CUSTOMERS[0], 'completed', ENGINEERS[4], INSTALLERS[0], 30.0, 'commercial', 'high', 'completed', 100, 1500000, 'new'),
  createProject(CUSTOMERS[1], 'completed', ENGINEERS[0], INSTALLERS[1], 12.0, 'residential', 'low', 'completed', 100, 600000, 'new'),
  createProject(CUSTOMERS[2], 'amc', ENGINEERS[1], INSTALLERS[2], 8.0, 'residential', 'medium', 'completed', 100, 400000, 'new'),
  createProject(CUSTOMERS[3], 'amc', ENGINEERS[2], INSTALLERS[3], 100.0, 'industrial', 'high', 'completed', 100, 5000000, 'new')
];

const ACTIVITIES = [
  { id: 'act-1', type: 'proposal', title: 'Proposal Generated', description: 'Engineering proposal for Jaipur Home Solar created and sent to customer.', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), user: 'Ravi Sharma', icon: '📄' },
  { id: 'act-2', type: 'survey', title: 'Site Survey Completed', description: 'Site survey for Delhi Commercial project completed successfully.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), user: 'Priya Patel', icon: '🔍' },
  { id: 'act-3', type: 'installation', title: 'Installation Started', description: 'Panel mounting structure installation began at Mumbai Industrial site.', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), user: 'Raj Kumar', icon: '🔧' },
  { id: 'act-4', type: 'engineer', title: 'Engineer Assigned', description: 'Sneha Gupta assigned as project engineer for Bangalore Commercial project.', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), user: 'Admin', icon: '👤' },
  { id: 'act-5', type: 'inspection', title: 'QA Inspection Passed', description: 'Quality inspection for Pune Home Solar project cleared with 98% score.', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), user: 'Vikram Singh', icon: '✅' },
  { id: 'act-6', type: 'invoice', title: 'Invoice Generated', description: 'Final invoice for Ahmedabad Commercial project generated and sent.', timestamp: new Date(Date.now() - 86400000 * 6).toISOString(), user: 'Finance Team', icon: '💰' },
  { id: 'act-7', type: 'amc', title: 'AMC Activated', description: 'Annual Maintenance Contract for Lucknow Home Solar activated.', timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), user: 'Manoj Tiwari', icon: '🛡️' },
  { id: 'act-8', type: 'proposal', title: 'Proposal Approved', description: 'Hyderabad Home Solar proposal approved by customer. Site survey scheduled.', timestamp: new Date(Date.now() - 86400000 * 8).toISOString(), user: 'Amit Verma', icon: '✅' },
  { id: 'act-9', type: 'survey', title: 'Site Survey Scheduled', description: 'Site survey for Jaipur Commercial project scheduled for next week.', timestamp: new Date(Date.now() - 86400000 * 9).toISOString(), user: 'Admin', icon: '📅' },
  { id: 'act-10', type: 'installation', title: 'Panel Installation Complete', description: 'Solar panel installation for Delhi Home Solar completed. 22 panels mounted.', timestamp: new Date(Date.now() - 86400000 * 10).toISOString(), user: 'Sunil Yadav', icon: '🔧' },
  { id: 'act-11', type: 'engineer', title: 'Engineer Reassigned', description: 'Vikram Singh reassigned from Mumbai project to Pune Commercial for expertise.', timestamp: new Date(Date.now() - 86400000 * 11).toISOString(), user: 'Admin', icon: '👤' },
  { id: 'act-12', type: 'invoice', title: 'Payment Received', description: 'Partial payment of ₹4,50,000 received for Bangalore Industrial project.', timestamp: new Date(Date.now() - 86400000 * 12).toISOString(), user: 'Finance Team', icon: '💰' },
  { id: 'act-13', type: 'proposal', title: 'Proposal Revised', description: 'Revised proposal with additional panels sent to Jaipur customer.', timestamp: new Date(Date.now() - 86400000 * 13).toISOString(), user: 'Ravi Sharma', icon: '📄' },
  { id: 'act-14', type: 'inspection', title: 'Inspection Scheduled', description: 'QA inspection for Mumbai Commercial project scheduled for Friday.', timestamp: new Date(Date.now() - 86400000 * 14).toISOString(), user: 'Quality Team', icon: '🔎' },
  { id: 'act-15', type: 'amc', title: 'AMC Renewal Initiated', description: 'AMC renewal process started for Hyderabad Home Solar project.', timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), user: 'Manoj Tiwari', icon: '📋' },
  { id: 'act-16', type: 'installation', title: 'Inverter Installation', description: '5kW string inverter installed and configured for Lucknow Home project.', timestamp: new Date(Date.now() - 86400000 * 16).toISOString(), user: 'Deepak Mishra', icon: '⚡' },
  { id: 'act-17', type: 'survey', title: 'Roof Measurement Complete', description: 'Laser roof measurement for Delhi Commercial project completed.', timestamp: new Date(Date.now() - 86400000 * 17).toISOString(), user: 'Priya Patel', icon: '📏' },
  { id: 'act-18', type: 'proposal', title: 'Proposal Sent', description: 'Comprehensive proposal for 150kW Industrial project sent to Pune customer.', timestamp: new Date(Date.now() - 86400000 * 18).toISOString(), user: 'Amit Verma', icon: '📄' }
];

const TASKS = [
  { id: 'task-1', title: 'Review site survey report for Jaipur Home Solar', category: 'due-today', priority: 'critical', dueDate: new Date().toISOString(), assignee: 'Ravi Sharma', completed: false },
  { id: 'task-2', title: 'Approve material procurement for Mumbai Commercial', category: 'due-today', priority: 'high', dueDate: new Date().toISOString(), assignee: 'Amit Verma', completed: false },
  { id: 'task-3', title: 'Send revised proposal to Bangalore customer', category: 'due-today', priority: 'medium', dueDate: new Date().toISOString(), assignee: 'Sneha Gupta', completed: false },
  { id: 'task-4', title: 'Schedule QA inspection for Delhi Home Solar', category: 'this-week', priority: 'high', dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), assignee: 'Vikram Singh', completed: false },
  { id: 'task-5', title: 'Update customer on installation timeline', category: 'this-week', priority: 'medium', dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), assignee: 'Priya Patel', completed: false },
  { id: 'task-6', title: 'Submit net metering application for Pune project', category: 'this-week', priority: 'high', dueDate: new Date(Date.now() + 86400000 * 4).toISOString(), assignee: 'Admin', completed: false },
  { id: 'task-7', title: 'Complete risk assessment for Ahmedabad Commercial', category: 'this-week', priority: 'low', dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), assignee: 'Ravi Sharma', completed: false },
  { id: 'task-8', title: 'Resolve DISCOM approval delay for Lucknow project', category: 'overdue', priority: 'critical', dueDate: new Date(Date.now() - 86400000 * 3).toISOString(), assignee: 'Amit Verma', completed: false },
  { id: 'task-9', title: 'Follow up on pending payment for Bangalore Industrial', category: 'overdue', priority: 'high', dueDate: new Date(Date.now() - 86400000 * 5).toISOString(), assignee: 'Finance Team', completed: false },
  { id: 'task-10', title: 'Complete installer training for new equipment', category: 'overdue', priority: 'medium', dueDate: new Date(Date.now() - 86400000 * 7).toISOString(), assignee: 'Raj Kumar', completed: false },
  { id: 'task-11', title: 'Panel mounting complete at Delhi Home Solar', category: 'completed', priority: 'high', dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), assignee: 'Sunil Yadav', completed: true },
  { id: 'task-12', title: 'Proposal signed for Hyderabad project', category: 'completed', priority: 'medium', dueDate: new Date(Date.now() - 86400000 * 4).toISOString(), assignee: 'Priya Patel', completed: true },
  { id: 'task-13', title: 'AMC renewal documentation submitted', category: 'completed', priority: 'low', dueDate: new Date(Date.now() - 86400000 * 6).toISOString(), assignee: 'Manoj Tiwari', completed: true }
];

const analytics = {
  projectsByStage: STAGES.map((stage, i) => ({
    stage: stage.label,
    count: projects.filter(p => p.currentStage === stage.id).length,
    fill: stage.color
  })),
  monthlyInstallations: [
    { month: 'Jan', target: 5, actual: 4 },
    { month: 'Feb', target: 6, actual: 5 },
    { month: 'Mar', target: 8, actual: 7 },
    { month: 'Apr', target: 10, actual: 9 },
    { month: 'May', target: 12, actual: 11 },
    { month: 'Jun', target: 15, actual: 14 },
    { month: 'Jul', target: 18, actual: 16 },
    { month: 'Aug', target: 20, actual: 19 },
    { month: 'Sep', target: 22, actual: 20 },
    { month: 'Oct', target: 25, actual: 22 },
    { month: 'Nov', target: 28, actual: 0 },
    { month: 'Dec', target: 30, actual: 0 }
  ],
  completionTrend: [
    { month: 'Jan', target: 30, actual: 25 },
    { month: 'Feb', target: 35, actual: 32 },
    { month: 'Mar', target: 40, actual: 38 },
    { month: 'Apr', target: 45, actual: 42 },
    { month: 'May', target: 50, actual: 48 },
    { month: 'Jun', target: 55, actual: 52 },
    { month: 'Jul', target: 60, actual: 58 },
    { month: 'Aug', target: 65, actual: 62 },
    { month: 'Sep', target: 70, actual: 68 },
    { month: 'Oct', target: 75, actual: 70 }
  ],
  revenueForecast: [
    { month: 'Jan', projected: 500000, actual: 450000 },
    { month: 'Feb', projected: 800000, actual: 750000 },
    { month: 'Mar', projected: 1200000, actual: 1100000 },
    { month: 'Apr', projected: 1500000, actual: 1400000 },
    { month: 'May', projected: 1800000, actual: 1700000 },
    { month: 'Jun', projected: 2000000, actual: 1950000 },
    { month: 'Jul', projected: 2500000, actual: 2400000 },
    { month: 'Aug', projected: 2800000, actual: 2700000 },
    { month: 'Sep', projected: 3200000, actual: 3000000 },
    { month: 'Oct', projected: 3500000, actual: 0 },
    { month: 'Nov', projected: 4000000, actual: 0 },
    { month: 'Dec', projected: 4500000, actual: 0 }
  ],
  teamProductivity: ENGINEERS.map(eng => ({
    name: eng.name.split(' ')[0],
    completed: projects.filter(p => p.assignedEngineer.name === eng.name && ['completed', 'amc'].includes(p.currentStage)).length,
    active: projects.filter(p => p.assignedEngineer.name === eng.name && !['completed', 'amc'].includes(p.currentStage)).length
  }))
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getProjects() {
  const res = await api.get('/projects');
  const body = res.data;
  const list = body?.data || [];
  return list.map((raw) => new ProjectModel(raw));
}

async function getProject(projectId) {
  const res = await api.get(`/projects/${encodeURIComponent(projectId)}`);
  const body = res.data;
  if (!body?.data) throw new Error(`Project ${projectId} not found`);
  return new ProjectModel(body.data);
}

async function getProjectKpis() {
  const res = await api.get('/projects/metrics');
  const body = res.data;
  return body?.data || {};
}

async function getProjectAnalytics() {
  await delay(200);
  return { ...analytics };
}

async function getProjectTimeline(projectId) {
  await delay(200);
  const p = projects.find(prj => prj.id === projectId);
  if (!p) return [];
  return [...p.milestones].sort((a, b) => a.order - b.order);
}

async function getProjectTasks() {
  await delay(200);
  return [...TASKS];
}

async function getProjectActivities() {
  await delay(200);
  return [...ACTIVITIES];
}

async function updateProjectStage(projectId, newStage) {
  const res = await api.patch(`/projects/${encodeURIComponent(projectId)}/stage`, { stage: newStage });
  const body = res.data;
  return { success: true, oldStage: body?.data?.currentStage || '', newStage };
}

async function searchProjects(query) {
  if (!query || !query.trim()) return getProjects();
  const res = await api.get('/projects', { params: { search: query.trim() } });
  const body = res.data;
  const list = body?.data || [];
  return list.map((raw) => new ProjectModel(raw));
}

async function filterProjects(filters) {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.stage) params.stage = filters.stage;
  const res = await api.get('/projects', { params });
  const body = res.data;
  const list = body?.data || [];
  return list.map((raw) => new ProjectModel(raw));
}

export {
  STAGES, PRIORITIES, HEALTH_CONFIG, ProjectModel, computeHealthScore, computeKpis,
  getProjects, getProject, getProjectKpis, getProjectAnalytics,
  getProjectTimeline, getProjectTasks, getProjectActivities,
  updateProjectStage, searchProjects, filterProjects
};
