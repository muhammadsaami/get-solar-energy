window.GSE = window.GSE || {};
window.GSE.Modules = window.GSE.Modules || {};

/**
 * ProjectTracking Module
 * Lifecycle: init() → mount() → refresh() → unmount() → destroy()
 * Render pipeline:  refresh() → renderContent() → renderCurrentView()
 * Analytics pipeline: _filteredProjects → buildAnalyticsModel() → renderAnalyticsSummary() + renderAnalyticsCharts()
 * Chart lifecycle:   destroy existing chart → create new → register in _chartRegistry
 * Drawer lifecycle:  openProjectDrawer() → renderProjectDrawer() → bindDrawerEvents() → closeProjectDrawer()
 * Persistence:       updateProject() → _applyProjectUpdate() (local) + _persistProjectUpdate() (remote seam)
 */
GSE.Modules.ProjectTracking = (function () {
  var _container = null;
  var _stateContainer = null;
  var _contentContainer = null;
  var _state = null;
  var _projects = null;
  var _metrics = null;
  var _template = null;
  var _isInitialized = false;
  var _isMounted = false;

  /* ── Search & Filter State ───────────────────────────────── */
  var _searchQuery = '';
  var _filters = {
    stage: 'all',
    priority: 'all',
    status: 'all',
    projectType: 'all',
    engineer: 'all',
    installer: 'all',
    city: 'all',
    healthScore: 'all',
    capacityMin: '',
    capacityMax: '',
    dateFrom: '',
    dateTo: ''
  };
  var _filteredProjects = null;
  var _debounceTimer = null;
  var _isSecondaryFiltersOpen = false;

  /* ── Table Sort, Pagination & Selection State ───────────── */
  var _sortColumn = 'startDate';
  var _sortDirection = 'desc';
  var _page = 1;
  var _pageSize = 10;
  var _selectedProjectIds = new Set();

  /* ── Kanban State ──────────────────────────────────────── */
  var _currentView = 'table';
  var _dragProjectId = null;
  var _dragSourceStage = null;

  /* ── Drawer State ──────────────────────────────────────── */
  var _activeProjectId = null;
  var _activeProject = null;
  var _activeDrawerTab = 'overview';
  var _isDrawerOpen = false;
  var _lastFocusedElement = null;
  var _renderedDrawerTabs = new Set();
  var _drawerFocusableElements = [];

  /* ── Analytics State ───────────────────────────────────── */
  var _analyticsTimeRange = '30d';
  var _analyticsDateFrom = null;
  var _analyticsDateTo = null;
  var _chartRegistry = new Map();
  var _renderTimeout = null;

  /* ── Stage Mapping (business → kanban) ─────────────────── */
  var STATUS_TO_STAGE = {
    initiation: 'lead',
    design: 'site-survey',
    documentation: 'proposal',
    approval: 'approved',
    'pre-installation': 'installation',
    installation: 'installation',
    commissioning: 'inspection',
    completed: 'completed'
  };

  /* ── Stage Config (single source of truth) ─────────────── */
  var STAGE_CONFIG = {
    initiation:       { label: 'Initiation',      badge: 'badge-purple',  kanbanColor: 'purple' },
    design:           { label: 'Design',          badge: 'badge-info',    kanbanColor: 'blue' },
    documentation:    { label: 'Documentation',   badge: 'badge-warning', kanbanColor: 'yellow' },
    approval:         { label: 'Approval',        badge: 'badge-success', kanbanColor: 'green' },
    'pre-installation': { label: 'Pre-Installation', badge: 'badge-orange', kanbanColor: 'orange' },
    installation:     { label: 'Installation',    badge: 'badge-error',   kanbanColor: 'orange' },
    commissioning:    { label: 'Commissioning',   badge: 'badge-neutral', kanbanColor: 'red' },
    completed:        { label: 'Completed',       badge: 'badge-success', kanbanColor: 'green' }
  };

  /* ── Kanban Stage Config (maps business stages to kanban columns) ── */
  var KANBAN_STAGE_IDS = ['lead', 'site-survey', 'proposal', 'approved', 'installation', 'inspection', 'completed', 'amc'];
  var KANBAN_STAGE_CONFIG = {
    lead:         { title: 'Lead',        color: 'purple' },
    'site-survey':  { title: 'Site Survey', color: 'blue' },
    proposal:    { title: 'Proposal',    color: 'yellow' },
    approved:    { title: 'Approved',    color: 'green' },
    installation:{ title: 'Installation', color: 'orange' },
    inspection:  { title: 'Inspection',  color: 'red' },
    completed:   { title: 'Completed',   color: 'green' },
    amc:         { title: 'AMC',         color: 'teal' }
  };

  /* ── Risk Metadata ──────────────────────────────────────── */
  var RISK_METADATA = {
    supply_delay: {
      label: 'Supply Delay',
      severity: 'high',
      probability: 'medium',
      impact: 'High',
      owner: 'Procurement',
      status: 'open',
      mitigation: 'Order materials 2 weeks in advance'
    },
    weather_delay: {
      label: 'Weather Delay',
      severity: 'medium',
      probability: 'high',
      impact: 'Medium',
      owner: 'Site Manager',
      status: 'monitoring',
      mitigation: 'Build weather buffer into schedule'
    },
    budget_overrun: {
      label: 'Budget Overrun',
      severity: 'high',
      probability: 'medium',
      impact: 'Critical',
      owner: 'Finance',
      status: 'open',
      mitigation: 'Track expenses weekly'
    },
    permitting_issue: {
      label: 'Permitting Issue',
      severity: 'medium',
      probability: 'medium',
      impact: 'High',
      owner: 'Compliance',
      status: 'monitoring',
      mitigation: 'Start permit process early'
    },
    structural_concern: {
      label: 'Structural Concern',
      severity: 'critical',
      probability: 'low',
      impact: 'Critical',
      owner: 'Engineering',
      status: 'mitigated',
      mitigation: 'Schedule structural review'
    },
    customer_change: {
      label: 'Customer Change',
      severity: 'low',
      probability: 'medium',
      impact: 'Medium',
      owner: 'Sales',
      status: 'open',
      mitigation: 'Document change orders promptly'
    }
  };

  var SEVERITY_WEIGHTS = { critical: 4, high: 3, medium: 2, low: 1 };
  var PROBABILITY_WEIGHTS = { high: 4, medium: 2, low: 1 };

  /* ── Activity Category Map ──────────────────────────────── */
  var ACTIVITY_CATEGORY = {
    stage_change:       { label: 'Stage Change', badge: 'badge-info' },
    note_added:         { label: 'Note', badge: 'badge-neutral' },
    task_completed:     { label: 'Task', badge: 'badge-success' },
    document_uploaded:  { label: 'Document', badge: 'badge-warning' },
    milestone_reached:  { label: 'Milestone', badge: 'badge-purple' }
  };

  /* ── Analytics Formatters ───────────────────────────────── */
  var AnalyticsFormatters = {
    currency: function (v) {
      return '\u20B9' + _num(v).toLocaleString('en-IN');
    },
    percent: function (v) {
      return _num(v).toFixed(1) + '%';
    },
    capacity: function (v) {
      return _num(v).toFixed(1) + ' kW';
    },
    duration: function (days) {
      var d = _num(days);
      if (d < 30) return d + ' days';
      return (d / 30).toFixed(1) + ' months';
    },
    count: function (v) {
      return _num(v).toLocaleString('en-IN');
    }
  };

  /* ── Chart Theme (reads CSS vars once) ──────────────────── */
  var ChartTheme = (function () {
    var _styles = null;
    function _get() {
      if (!_styles) _styles = getComputedStyle(document.documentElement);
      return _styles;
    }
    function _color(name) {
      return (_get().getPropertyValue('--color-' + name) || '').trim();
    }
    return {
      colors: function () {
        return {
          blue: _color('blue'), green: _color('green'), orange: _color('orange'),
          red: _color('red'), purple: _color('purple'), teal: _color('teal'),
          yellow: _color('yellow')
        };
      },
      fontFamily: function () { return _get().getPropertyValue('--font-family-base').trim() || 'Inter, sans-serif'; },
      gridColor: 'rgba(255,255,255,0.06)',
      tooltipBg: 'rgba(0,0,0,0.8)',
      prefersReducedMotion: function () {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      },
      baseOptions: function () {
        var theme = this;
        return {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { family: theme.fontFamily(), size: 11 } }
            },
            tooltip: {
              backgroundColor: theme.tooltipBg,
              titleFont: { family: theme.fontFamily(), size: 12 },
              bodyFont: { family: theme.fontFamily(), size: 11 },
              callbacks: {
                label: function (ctx) {
                  var raw = ctx.parsed;
                  if (raw == null) return '';
                  if (ctx.chart.config.type === 'doughnut') {
                    var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                    return ctx.label + ': ' + raw + ' (' + (total > 0 ? (raw / total * 100).toFixed(1) : 0) + '%)';
                  }
                  return ctx.dataset.label + ': ' + AnalyticsFormatters.count(raw);
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: theme.gridColor },
              ticks: { color: '#94a3b8', font: { family: theme.fontFamily(), size: 10 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: theme.gridColor },
              ticks: { color: '#94a3b8', font: { family: theme.fontFamily(), size: 10 } }
            }
          },
          animation: {
            duration: theme.prefersReducedMotion() ? 0 : 300
          }
        };
      }
    };
  })();

  /* ── Static Filter Data ─────────────────────────────────── */
  var FILTER_PRIORITIES = ['low', 'medium', 'high', 'critical'];
  var FILTER_STATUSES = [
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'delayed', label: 'Delayed' }
  ];
  var FILTER_TYPES = [
    { id: 'residential', label: 'Residential' },
    { id: 'commercial', label: 'Commercial' }
  ];
  var FILTER_HEALTH_OPTIONS = [
    { id: 'at-risk', label: 'At Risk (\u226440)' },
    { id: 'warning', label: 'Warning (41\u201370)' },
    { id: 'healthy', label: 'Healthy (\u226571)' }
  ];

  /* ── Analytics Sections (declarative chart config) ──────── */
  var ANALYTICS_SECTIONS = [
    {
      id: 'stage',
      title: 'Stage Distribution',
      description: 'Projects grouped by current pipeline stage',
      chartType: 'doughnut',
      resolver: 'stage',
      summaryBuilder: function (m) { return AnalyticsFormatters.count((m.stage.datasets && m.stage.datasets[0] && m.stage.datasets[0].data.reduce(function (a, b) { return a + b; }, 0)) || 0) + ' projects'; },
      datasetBuilder: function (m) { return m.stage; },
      emptyMessage: 'No stage data available.'
    },
    {
      id: 'pipeline',
      title: 'Pipeline Value by Stage',
      description: 'Total project value per pipeline stage',
      chartType: 'bar',
      resolver: 'pipeline',
      summaryBuilder: function (m) { return AnalyticsFormatters.currency((m.pipeline.datasets && m.pipeline.datasets[0] && m.pipeline.datasets[0].data.reduce(function (a, b) { return a + b; }, 0)) || 0); },
      datasetBuilder: function (m) { return m.pipeline; },
      emptyMessage: 'No pipeline data available.'
    },
    {
      id: 'health',
      title: 'Health Score Distribution',
      description: 'Project health score breakdown',
      chartType: 'bar',
      resolver: 'health',
      summaryBuilder: function (m) { return AnalyticsFormatters.count((m.health.datasets && m.health.datasets[0] && m.health.datasets[0].data.reduce(function (a, b) { return a + b; }, 0)) || 0) + ' classified'; },
      datasetBuilder: function (m) { return m.health; },
      emptyMessage: 'No health data available.'
    },
    {
      id: 'completion',
      title: 'Completion Progress',
      description: 'Projects grouped by completion percentage',
      chartType: 'bar',
      resolver: 'completion',
      summaryBuilder: function (m) { return AnalyticsFormatters.percent((m.completion.datasets && m.completion.datasets[0] && m.completion.datasets[0].data.reduce(function (a, b) { return a + b; }, 0) / 4) || 0); },
      datasetBuilder: function (m) { return m.completion; },
      emptyMessage: 'No completion data available.'
    },
    {
      id: 'budget',
      title: 'Budget vs Value',
      description: 'Budget allocation compared to project value by stage',
      chartType: 'bar',
      resolver: 'budget',
      summaryBuilder: function (m) { return (m.budget.labels || []).length + ' stages compared'; },
      datasetBuilder: function (m) { return m.budget; },
      emptyMessage: 'No budget data available.'
    },
    {
      id: 'capacity',
      title: 'Capacity Distribution',
      description: 'Projects grouped by system size range',
      chartType: 'bar',
      resolver: 'capacity',
      summaryBuilder: function (m) { return AnalyticsFormatters.count((m.capacity.datasets && m.capacity.datasets[0] && m.capacity.datasets[0].data.reduce(function (a, b) { return a + b; }, 0)) || 0) + ' installations'; },
      datasetBuilder: function (m) { return m.capacity; },
      emptyMessage: 'No capacity data available.'
    }
  ];

  /* ── NoteStore ──────────────────────────────────────────── */
  var NoteStore = (function () {
    var _store = {};
    return {
      add: function (projectId, text) {
        if (!text.trim()) return null;
        if (!_store[projectId]) _store[projectId] = [];
        var note = {
          id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          text: text.trim(),
          timestamp: new Date().toISOString(),
          author: 'You'
        };
        _store[projectId].push(note);
        return note;
      },
      update: function (projectId, noteId, newText) {
        var notes = _store[projectId];
        if (!notes) return null;
        for (var i = 0; i < notes.length; i++) {
          if (notes[i].id === noteId) {
            notes[i].text = newText.trim();
            notes[i].timestamp = new Date().toISOString();
            return notes[i];
          }
        }
        return null;
      },
      remove: function (projectId, noteId) {
        var notes = _store[projectId];
        if (!notes) return false;
        for (var i = 0; i < notes.length; i++) {
          if (notes[i].id === noteId) {
            notes.splice(i, 1);
            return true;
          }
        }
        return false;
      },
      getAll: function (projectId, project) {
        var projectNotes = (project && project.notes) || [];
        var local = _store[projectId] || [];
        var converted = [];
        for (var i = 0; i < projectNotes.length; i++) {
          var n = projectNotes[i];
          converted.push({
            id: 'pnote_' + i,
            text: typeof n === 'string' ? n : (n.text || ''),
            timestamp: n.timestamp || null,
            author: n.author || 'System',
            isProjectNote: true
          });
        }
        return converted.concat(local);
      },
      clear: function (projectId) {
        delete _store[projectId];
      }
    };
  })();

  /* ── Drawer Reset ───────────────────────────────────────── */
  function resetDrawerState() {
    _activeProject = null;
    _activeProjectId = null;
    _activeDrawerTab = 'overview';
    _renderedDrawerTabs = new Set();
    _drawerFocusableElements = [];
    _lastFocusedElement = null;
  }

  /* ── Reusable Date Grouping ─────────────────────────────── */
  function groupByRelativeDate(items) {
    var now = new Date();
    var todayStr = now.toDateString();
    var yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    var yesterdayStr = yesterday.toDateString();
    var groups = { today: [], yesterday: [], earlier: [] };
    for (var i = 0; i < items.length; i++) {
      var ts = items[i].timestamp || items[i].date;
      if (!ts) { groups.earlier.push(items[i]); continue; }
      var d = new Date(ts);
      var ds = d.toDateString();
      if (ds === todayStr) groups.today.push(items[i]);
      else if (ds === yesterdayStr) groups.yesterday.push(items[i]);
      else groups.earlier.push(items[i]);
    }
    return groups;
  }

  /* ── Resolvers (data → normalized view model) ──────────── */

  function resolveProjectTimeline(project) {
    var stageIds = Object.keys(STAGE_CONFIG);
    var currentStatus = project.status || '';
    var currentIdx = stageIds.indexOf(currentStatus);
    var result = [];
    for (var i = 0; i < stageIds.length; i++) {
      var sid = stageIds[i];
      var status = i < currentIdx ? 'completed' : (i === currentIdx ? 'current' : 'upcoming');
      var startDate = project.stageStartDates && project.stageStartDates[sid] || null;
      var completionDate = project.stageCompletionDates && project.stageCompletionDates[sid] || null;
      var duration = null;
      if (startDate && completionDate) {
        var s = new Date(startDate);
        var e = new Date(completionDate);
        duration = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24))) + ' days';
      } else if (startDate && status === 'current') {
        var s2 = new Date(startDate);
        var n = new Date();
        duration = Math.max(0, Math.round((n - s2) / (1000 * 60 * 60 * 24))) + ' days (in progress)';
      }
      result.push({
        stageId: sid,
        label: STAGE_CONFIG[sid].label,
        status: status,
        startDate: startDate,
        completionDate: completionDate,
        duration: duration
      });
    }
    return result;
  }

  function resolveProjectMilestones(timeline, project) {
    var completed = [], current = [], upcoming = [];
    var p = project;
    for (var i = 0; i < timeline.length; i++) {
      var t = timeline[i];
      var item = {
        label: t.label,
        stageId: t.stageId,
        status: t.status,
        progress: t.status === 'completed' ? 100 : (t.status === 'current' ? _num(p.progress) : 0),
        duration: t.duration || '—',
        targetDate: t.completionDate ? formatDate(t.completionDate) : '—',
        completionDate: t.status === 'completed' && t.completionDate ? formatDate(t.completionDate) : '—',
        dependencies: 'TBD — Configure in Planning'
      };
      if (t.status === 'completed') completed.push(item);
      else if (t.status === 'current') current.push(item);
      else upcoming.push(item);
    }
    return { completed: completed, current: current, upcoming: upcoming };
  }

  function resolveProjectActivity(project) {
    var activities = project.activities || [];
    var grouped = groupByRelativeDate(activities);
    var result = { today: [], yesterday: [], earlier: [] };
    var groups = ['today', 'yesterday', 'earlier'];
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      var items = grouped[grp] || [];
      for (var i = 0; i < items.length; i++) {
        var a = items[i];
        var cat = ACTIVITY_CATEGORY[a.type] || { label: 'Update', badge: 'badge-neutral' };
        result[grp].push({
          id: a.id || String(i),
          type: a.type,
          message: a.message || '',
          user: a.user || '',
          timestamp: a.timestamp || '',
          categoryLabel: cat.label,
          categoryBadge: cat.badge
        });
      }
    }
    return result;
  }

  function resolveProjectRisks(project) {
    var flags = project.riskFlags || [];
    var items = [];
    for (var i = 0; i < flags.length; i++) {
      var meta = RISK_METADATA[flags[i]];
      if (!meta) continue;
      var sevW = SEVERITY_WEIGHTS[meta.severity] || 0;
      var probW = PROBABILITY_WEIGHTS[meta.probability] || 0;
      items.push({
        id: flags[i],
        label: meta.label,
        severity: meta.severity,
        severityWeight: sevW,
        probability: meta.probability,
        impact: meta.impact,
        owner: meta.owner,
        status: meta.status,
        riskScore: sevW * probW,
        mitigation: meta.mitigation
      });
    }
    items.sort(function (a, b) {
      if (b.severityWeight !== a.severityWeight) return b.severityWeight - a.severityWeight;
      return b.riskScore - a.riskScore;
    });
    return items;
  }

  function resolveProjectNotes(project, noteStore) {
    return noteStore.getAll(project ? project.id : null, project);
  }

  /* ── Analytics Resolvers ────────────────────────────────── */
  function resolveStageAnalytics(projects) {
    var counts = {};
    var labels = Object.keys(STAGE_CONFIG);
    for (var i = 0; i < labels.length; i++) counts[labels[i]] = 0;
    for (var j = 0; j < projects.length; j++) {
      var s = projects[j].status;
      if (counts.hasOwnProperty(s)) counts[s]++;
    }
    return {
      labels: labels.map(function (l) { return STAGE_CONFIG[l].label; }),
      datasets: [{ data: labels.map(function (l) { return counts[l]; }), backgroundColor: labels.map(function (l) { return ChartTheme.colors()[STAGE_CONFIG[l].kanbanColor] || '#666'; }) }]
    };
  }

  function resolvePipelineAnalytics(projects) {
    var values = {};
    var labels = Object.keys(STAGE_CONFIG);
    for (var i = 0; i < labels.length; i++) values[labels[i]] = 0;
    for (var j = 0; j < projects.length; j++) {
      var s = projects[j].status;
      if (values.hasOwnProperty(s)) values[s] += _num(projects[j].projectValue);
    }
    return {
      labels: labels.map(function (l) { return STAGE_CONFIG[l].label; }),
      datasets: [{ label: 'Pipeline Value', data: labels.map(function (l) { return values[l]; }), backgroundColor: labels.map(function (l) { return ChartTheme.colors()[STAGE_CONFIG[l].kanbanColor] || '#666'; }) }]
    };
  }

  function resolveHealthAnalytics(projects) {
    var healthy = 0, warning = 0, atRisk = 0;
    for (var i = 0; i < projects.length; i++) {
      var h = _num(projects[i].healthScore);
      if (h >= 71) healthy++;
      else if (h >= 41) warning++;
      else atRisk++;
    }
    return {
      labels: ['Healthy (71+)', 'Warning (41–70)', 'At Risk (≤40)'],
      datasets: [{ data: [healthy, warning, atRisk], backgroundColor: [ChartTheme.colors().green || '#22c55e', ChartTheme.colors().orange || '#f59e0b', ChartTheme.colors().red || '#ef4444'] }]
    };
  }

  function resolveCompletionAnalytics(projects) {
    var buckets = [0, 0, 0, 0];
    for (var i = 0; i < projects.length; i++) {
      var pct = _num(projects[i].progress);
      if (pct <= 25) buckets[0]++;
      else if (pct <= 50) buckets[1]++;
      else if (pct <= 75) buckets[2]++;
      else buckets[3]++;
    }
    return {
      labels: ['0–25%', '26–50%', '51–75%', '76–100%'],
      datasets: [{ data: buckets, backgroundColor: [ChartTheme.colors().red || '#ef4444', ChartTheme.colors().orange || '#f59e0b', ChartTheme.colors().blue || '#3b82f6', ChartTheme.colors().green || '#22c55e'] }]
    };
  }

  function resolveBudgetAnalytics(projects) {
    var stageLabels = Object.keys(STAGE_CONFIG);
    var budgets = {}, values = {};
    for (var i = 0; i < stageLabels.length; i++) { budgets[stageLabels[i]] = 0; values[stageLabels[i]] = 0; }
    for (var j = 0; j < projects.length; j++) {
      var s = projects[j].status;
      if (budgets.hasOwnProperty(s)) {
        budgets[s] += _num(projects[j].totalBudget) || _num(projects[j].projectValue);
        values[s] += _num(projects[j].projectValue);
      }
    }
    return {
      labels: stageLabels.map(function (l) { return STAGE_CONFIG[l].label; }),
      datasets: [
        { label: 'Budget', data: stageLabels.map(function (l) { return budgets[l]; }), backgroundColor: ChartTheme.colors().blue || '#3b82f6' },
        { label: 'Value', data: stageLabels.map(function (l) { return values[l]; }), backgroundColor: ChartTheme.colors().teal || '#14b8a6' }
      ]
    };
  }

  function resolveCapacityAnalytics(projects) {
    var buckets = [0, 0, 0, 0];
    var ranges = [0, 5, 10, 20, Infinity];
    for (var i = 0; i < projects.length; i++) {
      var kw = _num(projects[i].solarSystemSize);
      for (var r = 0; r < ranges.length - 1; r++) {
        if (kw >= ranges[r] && kw < ranges[r + 1]) { buckets[r]++; break; }
      }
    }
    return {
      labels: ['0–5 kW', '5–10 kW', '10–20 kW', '20 kW+'],
      datasets: [{ data: buckets, backgroundColor: [ChartTheme.colors().purple || '#8b5cf6', ChartTheme.colors().blue || '#3b82f6', ChartTheme.colors().teal || '#14b8a6', ChartTheme.colors().green || '#22c55e'] }]
    };
  }

  /* Analytics pipeline: filtered projects → 6 resolvers → normalized model → summary + charts */
  function buildAnalyticsModel(projects) {
    return {
      stage: resolveStageAnalytics(projects),
      pipeline: resolvePipelineAnalytics(projects),
      health: resolveHealthAnalytics(projects),
      completion: resolveCompletionAnalytics(projects),
      budget: resolveBudgetAnalytics(projects),
      capacity: resolveCapacityAnalytics(projects)
    };
  }

  /* ── Chart Infrastructure ───────────────────────────────── */
  /* Chart lifecycle: destroy existing chart with same id, create new chart, register in _chartRegistry */
  function buildChart(id, type, canvas, config) {
    if (_chartRegistry.has(id)) {
      _chartRegistry.get(id).destroy();
      _chartRegistry.delete(id);
    }
    var opts = Object.assign({}, ChartTheme.baseOptions());
    var bgColors = ChartTheme.colors();
    if (type === 'doughnut') {
      opts.plugins = opts.plugins || {};
      opts.plugins.legend = opts.plugins.legend || {};
      opts.plugins.legend.position = 'bottom';
      opts.cutout = '55%';
    }
    var chart = new Chart(canvas, { type: type, data: config, options: opts });
    _chartRegistry.set(id, chart);
    return chart;
  }

  function destroyAnalyticsCharts() {
    _chartRegistry.forEach(function (c) { c.destroy(); });
    _chartRegistry.clear();
  }

  /* ── Analytics Renderers ────────────────────────────────── */
  function renderAnalyticsSummary(model) {
    var html = '<div class="analytics-summary-grid">';
    var items = [
      { label: 'Total Projects', value: AnalyticsFormatters.count(ANALYTICS_SECTIONS[0].summaryBuilder(model)) },
      { label: 'Pipeline Value', value: AnalyticsFormatters.currency((model.pipeline.datasets && model.pipeline.datasets[0] && model.pipeline.datasets[0].data.reduce(function (a, b) { return a + b; }, 0)) || 0) },
      { label: 'Avg Health', value: (function () { var h = model.health.datasets && model.health.datasets[0] && model.health.datasets[0].data; if (!h || h.length < 3) return '—'; var total = h[0] + h[1] + h[2]; if (total === 0) return '—'; return AnalyticsFormatters.percent((h[0] * 85 + h[1] * 55 + h[2] * 20) / total); })() },
      { label: 'At Risk', value: (function () { var h = model.health.datasets && model.health.datasets[0] && model.health.datasets[0].data; return h ? AnalyticsFormatters.count(h[2] || 0) : '—'; })() }
    ];
    for (var i = 0; i < items.length; i++) {
      html += '<div class="card-metric"><div class="card-metric-label">' + items[i].label + '</div><div class="card-metric-value">' + items[i].value + '</div></div>';
    }
    html += '</div>';
    return html;
  }

  function renderTimeRangeControls() {
    var ranges = [
      { id: '30d', label: '30 Days' },
      { id: '90d', label: 'Quarter' },
      { id: '1y', label: 'Year' },
      { id: 'all', label: 'All Time' }
    ];
    var html = '<div class="analytics-time-range" role="radiogroup" aria-label="Analytics time range">';
    for (var i = 0; i < ranges.length; i++) {
      var active = _analyticsTimeRange === ranges[i].id ? ' active' : '';
      html += '<button class="btn btn-ghost btn-sm time-range-btn' + active + '" data-range="' + ranges[i].id + '" aria-pressed="' + (_analyticsTimeRange === ranges[i].id) + '" type="button">' + ranges[i].label + '</button>';
    }
    html += '</div>';
    return html;
  }

  function renderAnalyticsCharts(model) {
    var html = '<div class="analytics-charts-grid">';
    for (var i = 0; i < ANALYTICS_SECTIONS.length; i++) {
      var section = ANALYTICS_SECTIONS[i];
      html += '<div class="chart-card" id="chart-card-' + section.id + '">' +
        '<h3 class="chart-card-title">' + section.title + '</h3>' +
        '<p class="chart-card-desc">' + section.description + '</p>' +
        '<div class="chart-card-value">' + section.summaryBuilder(model) + '</div>' +
        '<div class="chart-card-body">' +
          '<canvas id="chart-' + section.id + '" role="img" aria-label="' + section.title + '"></canvas>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    return html;
  }

  function _bindAnalyticsEvents() {
    var container = _container;
    if (!container) return;
    var rangeBtns = container.querySelectorAll('.time-range-btn');
    for (var i = 0; i < rangeBtns.length; i++) {
      rangeBtns[i].removeEventListener('click', _onAnalyticsRangeChange);
      rangeBtns[i].addEventListener('click', _onAnalyticsRangeChange);
    }
  }

  function _onAnalyticsRangeChange(e) {
    var btn = e.currentTarget;
    var range = btn.getAttribute('data-range');
    if (!range || range === _analyticsTimeRange) return;
    _analyticsTimeRange = range;
    reRenderCurrentView();
  }

  function _renderAnalyticsSkeleton() {
    var cards = '';
    for (var _si = 0; _si < 4; _si++) cards += '<div class="skeleton skeleton-card"></div>';
    var charts = '';
    for (var _sj = 0; _sj < 6; _sj++) charts += '<div class="skeleton skeleton-block chart-skeleton"></div>';
    return '<div class="analytics-skeleton" aria-label="Loading analytics...">' +
      '<div class="analytics-summary-grid">' + cards + '</div>' +
      '<div class="analytics-charts-grid">' + charts + '</div>' +
    '</div>';
  }

  function _renderAnalytics() {
    try {
      if (!_filteredProjects || _filteredProjects.length === 0) {
        return '<div class="drawer-empty-state" role="status">' +
          '<svg class="drawer-empty-icon" width="40" height="40" aria-hidden="true" opacity="0.4"><use href="#icon-trending"></use></svg>' +
          '<div class="drawer-empty-title">No analytics data available</div>' +
          '<div class="drawer-empty-desc">Apply or adjust filters to see analytics.</div>' +
        '</div>';
      }
      destroyAnalyticsCharts();
      var model = buildAnalyticsModel(_filteredProjects);
      var summaryHTML = renderAnalyticsSummary(model);
      var rangeHTML = renderTimeRangeControls();
      var chartsHTML = renderAnalyticsCharts(model);
      clearTimeout(_renderTimeout);
      _renderTimeout = setTimeout(function () {
        _renderTimeout = null;
        for (var i = 0; i < ANALYTICS_SECTIONS.length; i++) {
          var section = ANALYTICS_SECTIONS[i];
          var canvas = _container && _container.querySelector('#chart-' + section.id);
          if (!canvas) continue;
          var dataset = section.datasetBuilder(model);
          if (!dataset || !dataset.datasets || !dataset.datasets[0] || !dataset.datasets[0].data || dataset.datasets[0].data.length === 0) {
            var parent = canvas.parentNode;
            if (parent) {
              parent.innerHTML = '<div class="chart-empty">' + section.emptyMessage + '</div>';
            }
            continue;
          }
          try {
            buildChart(section.id, section.chartType, canvas, dataset);
          } catch (chartErr) {
            var parent2 = canvas.parentNode;
            if (parent2) parent2.innerHTML = '<div class="chart-empty">Chart error: ' + _escapeHtml(chartErr.message || 'unknown') + '</div>';
          }
        }
        _bindAnalyticsEvents();
      }, 0);
      return '<div class="analytics-dashboard">' +
        '<div id="pt-analytics-summary">' + summaryHTML + '</div>' +
        '<div id="pt-analytics-range">' + rangeHTML + '</div>' +
        '<div id="pt-analytics-charts">' + chartsHTML + '</div>' +
      '</div>';
    } catch (err) {
      if (_stateContainer) {
        ComponentState.showError(_stateContainer, 'Analytics failed: ' + (err.message || 'unknown error'), function () { reRenderCurrentView(); });
      }
      return '<div class="drawer-empty-state-sm">Analytics unavailable. <button class="btn btn-ghost btn-sm" onclick="GSE.ModuleRegistry.refresh(\'project-tracking\')">Retry</button></div>';
    }
  }

  function init() {
    if (_isInitialized) return;
    _isInitialized = true;
  }

  function register() {
    GSE.ModuleRegistry.register({
      id: 'project-tracking',
      title: 'Project Tracking',
      version: '1.0.0',
      module: GSE.Modules.ProjectTracking
    });
  }

  function _num(val) {
    var n = Number(val);
    return isFinite(n) ? n : 0;
  }

  function _debounce(fn, delay) {
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function _unique(arr) {
    var seen = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (!seen[v]) {
        seen[v] = true;
        out.push(v);
      }
    }
    return out.sort();
  }

  function _escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _priorityWeight(p) {
    var w = { critical: 4, high: 3, medium: 2, low: 1 };
    return w[p] || 0;
  }

  function sortProjects(projects, column, direction) {
    var arr = projects.slice();
    var dir = direction === 'asc' ? 1 : -1;
    arr.sort(function (a, b) {
      var va, vb;
      switch (column) {
        case 'id':         va = a.id; vb = b.id; break;
        case 'name':       va = (a.title || '').toLowerCase(); vb = (b.title || '').toLowerCase(); break;
        case 'customer':   va = (a.customerName || '').toLowerCase(); vb = (b.customerName || '').toLowerCase(); break;
        case 'stage':      va = a.status || ''; vb = b.status || ''; break;
        case 'priority':   va = _priorityWeight(a.priority); vb = _priorityWeight(b.priority); break;
        case 'health':     va = _num(a.healthScore); vb = _num(b.healthScore); break;
        case 'value':      va = _num(a.projectValue); vb = _num(b.projectValue); break;
        case 'completion': va = _num(a.progress); vb = _num(b.progress); break;
        case 'startDate':  va = a.startDate || ''; vb = b.startDate || ''; break;
        default:           va = a.startDate || ''; vb = b.startDate || '';
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      if (a.id < b.id) return -1 * dir;
      if (a.id > b.id) return 1 * dir;
      return 0;
    });
    return arr;
  }

  function paginateProjects(projects, page, pageSize) {
    var total = projects.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var p = Math.max(1, Math.min(page, totalPages));
    var start = (p - 1) * pageSize;
    var end = Math.min(start + pageSize, total);
    return {
      items: projects.slice(start, end),
      page: p,
      pageSize: pageSize,
      totalItems: total,
      totalPages: totalPages,
      start: start + 1,
      end: end
    };
  }

  function calculateHealthScore(project) {
    if (project.healthScore != null && isFinite(Number(project.healthScore))) {
      return Math.min(100, Math.max(0, Math.round(_num(project.healthScore))));
    }
    var completion = _num(project.completionPercent) || _num(project.progress) || 0;
    var scheduleRaw = _num(project.timelineVariance);
    var scheduleScore;
    if (scheduleRaw <= 0) scheduleScore = 100;
    else if (scheduleRaw <= 10) scheduleScore = 50;
    else scheduleScore = 20;
    var budgetRaw = project.budgetVariance;
    var budgetScore;
    if (budgetRaw == null) budgetScore = 75;
    else if (_num(budgetRaw) <= 0) budgetScore = 100;
    else budgetScore = 50;
    var riskCount = (project.riskFlags || []).length;
    var riskScore;
    if (riskCount === 0) riskScore = 100;
    else if (riskCount === 1) riskScore = 75;
    else if (riskCount === 2) riskScore = 40;
    else riskScore = 10;
    var raw = completion * 0.40 + scheduleScore * 0.30 + budgetScore * 0.20 + riskScore * 0.10;
    return Math.min(100, Math.max(0, Math.round(raw)));
  }

  function formatCurrencyINR(value) {
    return '\u20B9' + _num(value).toLocaleString('en-IN');
  }

  function computeProjectMetrics(projects) {
    var len = projects.length;
    var active = 0, completed = 0, delayed = 0;
    var totalCompletion = 0, totalBudget = 0, totalHealth = 0;
    for (var i = 0; i < len; i++) {
      var p = projects[i];
      if (p.status === 'completed') completed++;
      else if (p.status === 'delayed') delayed++;
      else active++;
      totalCompletion = totalCompletion + (_num(p.completionPercent) || _num(p.progress) || 0);
      totalBudget = totalBudget + (_num(p.totalBudget) || _num(p.projectValue) || 0);
      totalHealth = totalHealth + calculateHealthScore(p);
    }
    return {
      activeProjects: active,
      completedProjects: completed,
      delayedProjects: delayed,
      averageCompletion: len ? Math.round(totalCompletion / len) : 0,
      pipelineValue: totalBudget,
      averageHealthScore: len ? Math.round(totalHealth / len) : 0
    };
  }

  function getFilteredProjects(projects, searchQuery, filters) {
    var result = projects.slice();
    var query = (searchQuery || '').trim().toLowerCase();

    if (query) {
      result = result.filter(function (p) {
        return (
          (p.id || '').toLowerCase().indexOf(query) !== -1 ||
          (p.title || '').toLowerCase().indexOf(query) !== -1 ||
          (p.customerName || '').toLowerCase().indexOf(query) !== -1 ||
          (p.customerEmail || '').toLowerCase().indexOf(query) !== -1 ||
          (p.assignedEngineer || '').toLowerCase().indexOf(query) !== -1 ||
          (p.assignedTeam || '').toLowerCase().indexOf(query) !== -1 ||
          (p.city || '').toLowerCase().indexOf(query) !== -1 ||
          (p.state || '').toLowerCase().indexOf(query) !== -1
        );
      });
    }

    if (filters.stage !== 'all') {
      result = result.filter(function (p) { return p.status === filters.stage; });
    }

    if (filters.priority !== 'all') {
      result = result.filter(function (p) { return p.priority === filters.priority; });
    }

    if (filters.status !== 'all') {
      result = result.filter(function (p) {
        if (filters.status === 'active') return p.status !== 'completed';
        if (filters.status === 'completed') return p.status === 'completed';
        if (filters.status === 'delayed') return _num(p.timelineVariance) > 0;
        return true;
      });
    }

    if (filters.projectType !== 'all') {
      result = result.filter(function (p) { return p.projectType === filters.projectType; });
    }

    if (filters.engineer !== 'all') {
      result = result.filter(function (p) { return p.assignedEngineer === filters.engineer; });
    }

    if (filters.installer !== 'all') {
      result = result.filter(function (p) { return p.assignedTeam === filters.installer; });
    }

    if (filters.city !== 'all') {
      result = result.filter(function (p) { return p.city === filters.city; });
    }

    if (filters.healthScore !== 'all') {
      result = result.filter(function (p) {
        var hs = _num(p.healthScore);
        if (filters.healthScore === 'at-risk') return hs <= 40;
        if (filters.healthScore === 'warning') return hs >= 41 && hs <= 70;
        if (filters.healthScore === 'healthy') return hs >= 71;
        return true;
      });
    }

    if (filters.capacityMin) {
      result = result.filter(function (p) { return _num(p.solarSystemSize) >= _num(filters.capacityMin); });
    }

    if (filters.capacityMax) {
      result = result.filter(function (p) { return _num(p.solarSystemSize) <= _num(filters.capacityMax); });
    }

    if (filters.dateFrom) {
      result = result.filter(function (p) { return (p.startDate || '') >= filters.dateFrom; });
    }

    if (filters.dateTo) {
      result = result.filter(function (p) { return (p.startDate || '') <= filters.dateTo; });
    }

    return result;
  }

  function mount(container) {
    if (_isMounted) return _container;
    if (container) {
      _container = container;
    } else {
      _container = createContainer();
      var target =
        document.querySelector('main') ||
        document.querySelector('.main-panel') ||
        document.body;
      if (target) {
        target.appendChild(_container);
      }
    }
    _stateContainer = _container.querySelector('#pt-state-container');
    _contentContainer = _container.querySelector('#pt-content');
    _isMounted = true;
    if (typeof GSE.ModuleRegistry.markMounted === 'function') {
      GSE.ModuleRegistry.markMounted('project-tracking');
    }
    refresh();
    return _container;
  }

  function unmount() {
    closeProjectDrawer();
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
    }
    _container = null;
    _stateContainer = null;
    _contentContainer = null;
    _isMounted = false;
    if (typeof GSE.ModuleRegistry.markUnmounted === 'function') {
      GSE.ModuleRegistry.markUnmounted('project-tracking');
    }
  }

  function refresh() {
    if (!_stateContainer) return;

    _state = 'loading';
    ComponentState.showLoading(_stateContainer, 'Loading projects...');

    GSE.Services.ProjectService.getAll().then(function (response) {
      if (!response || !response.success) {
        _state = 'error';
        ComponentState.showError(
          _stateContainer,
          (response && response.message) || 'Failed to load projects',
          refresh
        );
        return;
      }

      var projects = response.data;

      if (!projects || projects.length === 0) {
        _state = 'empty';
        ComponentState.showEmpty(_stateContainer, 'No projects available.');
        return;
      }

      _state = 'loaded';
      _projects = projects;
      _metrics = computeProjectMetrics(projects);
      _selectedProjectIds.clear();
      ComponentState.showContent(_stateContainer);
      renderContent(_metrics, _projects);
    }).catch(function (err) {
      _state = 'error';
      ComponentState.showError(
        _stateContainer,
        err && err.message ? err.message : 'Failed to load projects',
        refresh
      );
    });
  }

  function destroy() {
    destroyAnalyticsCharts();
    closeProjectDrawer();
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
    clearTimeout(_renderTimeout);
    _renderTimeout = null;
    unmount();
    _state = null;
    _template = null;
    _projects = null;
    _metrics = null;
    _filteredProjects = null;
    _searchQuery = '';
    _filters = {
      stage: 'all', priority: 'all', status: 'all', projectType: 'all',
      engineer: 'all', installer: 'all', city: 'all', healthScore: 'all',
      capacityMin: '', capacityMax: '', dateFrom: '', dateTo: ''
    };
    _selectedProjectIds.clear();
    _sortColumn = 'startDate';
    _sortDirection = 'desc';
    _page = 1;
    _currentView = 'table';
    _analyticsTimeRange = '30d';
    _isSecondaryFiltersOpen = false;
    _dragProjectId = null;
    _dragSourceStage = null;
    _isInitialized = false;
  }

  function createContainer() {
    var tab = document.createElement('div');
    tab.className = 'tab-content';
    tab.id = 'tab-project-tracking';
    tab.setAttribute('role', 'tabpanel');
    tab.setAttribute('aria-label', 'project tracking');

    tab.innerHTML =
      '<div class="tab-header-block">' +
        '<div>' +
          '<h2 class="tab-heading">Project Tracking</h2>' +
          '<p class="tab-subheading">Monitor solar installation projects across their lifecycle.</p>' +
        '</div>' +
      '</div>' +
      '<div id="pt-state-container" aria-live="polite" aria-atomic="true"></div>' +
      '<div id="pt-content" hidden>' +
        getSkeletonHTML() +
      '</div>';

    return tab;
  }

  function getSkeletonHTML() {
    if (_template) return _template;

    _template =
      '<div class="skeleton-grid skeleton-grid-4" aria-label="Project KPI placeholders">' +
        '<div class="skeleton-card">' +
          '<div class="skeleton-card-header">' +
            '<div class="skeleton skeleton-circle" style="width:32px;height:32px;"></div>' +
            '<div class="skeleton skeleton-text wide"></div>' +
          '</div>' +
          '<div class="skeleton skeleton-text full"></div>' +
          '<div class="skeleton skeleton-text narrow"></div>' +
        '</div>' +
        '<div class="skeleton-card">' +
          '<div class="skeleton-card-header">' +
            '<div class="skeleton skeleton-circle" style="width:32px;height:32px;"></div>' +
            '<div class="skeleton skeleton-text wide"></div>' +
          '</div>' +
          '<div class="skeleton skeleton-text full"></div>' +
          '<div class="skeleton skeleton-text narrow"></div>' +
        '</div>' +
        '<div class="skeleton-card">' +
          '<div class="skeleton-card-header">' +
            '<div class="skeleton skeleton-circle" style="width:32px;height:32px;"></div>' +
            '<div class="skeleton skeleton-text wide"></div>' +
          '</div>' +
          '<div class="skeleton skeleton-text full"></div>' +
          '<div class="skeleton skeleton-text narrow"></div>' +
        '</div>' +
        '<div class="skeleton-card">' +
          '<div class="skeleton-card-header">' +
            '<div class="skeleton skeleton-circle" style="width:32px;height:32px;"></div>' +
            '<div class="skeleton skeleton-text wide"></div>' +
          '</div>' +
          '<div class="skeleton skeleton-text full"></div>' +
          '<div class="skeleton skeleton-text narrow"></div>' +
        '</div>' +
      '</div>' +
      '<div class="skeleton-card" aria-label="Kanban board placeholder">' +
        '<div class="skeleton-card-header">' +
          '<div class="skeleton skeleton-text wide"></div>' +
        '</div>' +
        '<div class="skeleton-grid skeleton-grid-4">' +
          '<div class="skeleton skeleton-block"></div>' +
          '<div class="skeleton skeleton-block"></div>' +
          '<div class="skeleton skeleton-block"></div>' +
          '<div class="skeleton skeleton-block"></div>' +
        '</div>' +
      '</div>';

    return _template;
  }

  function getKpiSectionHTML(metrics) {
    var m = metrics;
    var cards = [
      { accent: 'blue',   icon: 'blue',   iconId: 'activity',         label: 'Active Projects',       value: String(m.activeProjects),       subtitle: 'In progress' },
      { accent: 'green',  icon: 'green',  iconId: 'clipboard-check',  label: 'Completed Projects',    value: String(m.completedProjects),    subtitle: 'Finished' },
      { accent: 'red',    icon: 'red',    iconId: 'alert-triangle',   label: 'Delayed Projects',      value: String(m.delayedProjects),      subtitle: 'Behind schedule' },
      { accent: 'orange', icon: 'orange', iconId: 'trending',         label: 'Average Completion',    value: m.averageCompletion + '%',      subtitle: 'Mean progress' },
      { accent: 'purple', icon: 'purple', iconId: 'briefcase',        label: 'Pipeline Value',        value: formatCurrencyINR(m.pipelineValue), subtitle: 'Total project value' },
      { accent: 'teal',   icon: 'teal',   iconId: 'shield',           label: 'Average Health Score',  value: m.averageHealthScore + '%',     subtitle: 'Project health index' }
    ];
    var html = '<div class="card-grid card-grid-3" aria-label="Project KPIs">';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html +=
        '<div class="card-metric accent-' + c.accent + '">' +
          '<div class="pt-card-header">' +
            '<svg class="kpi-title-icon ' + c.icon + '" aria-hidden="true" width="20" height="20">' +
              '<use href="#icon-' + c.iconId + '"></use>' +
            '</svg>' +
            '<div class="card-metric-label">' + c.label + '</div>' +
          '</div>' +
          '<div class="card-metric-value">' + c.value + '</div>' +
          '<div class="card-metric-change neutral">' + c.subtitle + '</div>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function getFilterBarHTML(projects) {
    var stages = Object.keys(STAGE_CONFIG).map(function (k) { return { id: k, label: STAGE_CONFIG[k].label }; });
    var engineers = [], installers = [], cities = [];
    var projList = projects || [];
    for (var _fi = 0; _fi < projList.length; _fi++) {
      var _p = projList[_fi];
      if (_p.assignedEngineer) engineers.push(_p.assignedEngineer);
      if (_p.assignedTeam) installers.push(_p.assignedTeam);
      if (_p.city) cities.push(_p.city);
    }
    engineers = _unique(engineers);
    installers = _unique(installers);
    cities = _unique(cities);

    function optGroup(values, selected) {
      var opts = '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>All</option>';
      for (var i = 0; i < values.length; i++) {
        var v = values[i];
        var sel = selected === v ? ' selected' : '';
        opts += '<option value="' + _escapeHtml(v) + '"' + sel + '>' + _escapeHtml(v) + '</option>';
      }
      return opts;
    }

    function staticOpts(options, selected, labelKey) {
      var opts = '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>All</option>';
      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        var id = opt.id || opt;
        var label = opt.label || opt;
        if (labelKey) label = opt[labelKey];
        var sel = selected === id ? ' selected' : '';
        opts += '<option value="' + _escapeHtml(id) + '"' + sel + '>' + _escapeHtml(label) + '</option>';
      }
      return opts;
    }

    var activeCount = getActiveFilterCount();
    var countBadge = activeCount > 0
      ? '<span class="badge badge-info badge-sm filter-active-count">' + activeCount + '</span>'
      : '';
    var clearBtn = activeCount > 0
      ? '<button type="button" class="btn btn-ghost btn-sm" id="pt-clear-all" aria-label="Clear all filters">Clear All</button>'
      : '';

    var secondaryOpen = _isSecondaryFiltersOpen;
    var secondaryClass = secondaryOpen ? ' filter-secondary open' : ' filter-secondary';
    var moreBtnLabel = secondaryOpen ? 'Less Filters' : 'More Filters';
    var moreBtnAria = secondaryOpen ? 'true' : 'false';

    var html =
      '<div class="filter-bar" role="search" aria-label="Project filters">' +
        '<div class="form-search" style="flex:1;min-width:180px;">' +
          '<svg class="form-search-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
          '</svg>' +
          '<input type="text" class="form-input" id="pt-search-input" placeholder="Search projects..." value="' + _escapeHtml(_searchQuery) + '" aria-label="Search projects by ID, name, customer, city or state">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-stage">Stage</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-stage" aria-label="Filter by stage">' +
            staticOpts(stages, _filters.stage, 'label') +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-priority">Priority</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-priority" aria-label="Filter by priority">' +
            staticOpts(FILTER_PRIORITIES, _filters.priority) +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-status">Status</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-status" aria-label="Filter by status">' +
            staticOpts(FILTER_STATUSES, _filters.status, 'label') +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-type">Type</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-type" aria-label="Filter by project type">' +
            staticOpts(FILTER_TYPES, _filters.projectType, 'label') +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="pt-toggle-secondary" aria-expanded="' + moreBtnAria + '" aria-controls="pt-filter-secondary">' + moreBtnLabel + '</button>' +
        '</div>' +
        countBadge +
        clearBtn +
      '</div>' +
      '<div id="pt-filter-secondary" class="' + secondaryClass + '">' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-engineer">Engineer</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-engineer" aria-label="Filter by engineer">' +
            optGroup(engineers, _filters.engineer) +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-installer">Installer</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-installer" aria-label="Filter by installer team">' +
            optGroup(installers, _filters.installer) +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-city">City</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-city" aria-label="Filter by city">' +
            optGroup(cities, _filters.city) +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-health">Health</label>' +
          '<select class="form-select pt-filter-select" id="pt-filter-health" aria-label="Filter by health score">' +
            staticOpts(FILTER_HEALTH_OPTIONS, _filters.healthScore, 'label') +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-cap-min">Capacity Min</label>' +
          '<input type="number" class="form-input pt-filter-input" id="pt-filter-cap-min" placeholder="Min kW" min="0" step="0.1" value="' + _escapeHtml(_filters.capacityMin) + '" aria-label="Minimum capacity in kW">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-cap-max">Capacity Max</label>' +
          '<input type="number" class="form-input pt-filter-input" id="pt-filter-cap-max" placeholder="Max kW" min="0" step="0.1" value="' + _escapeHtml(_filters.capacityMax) + '" aria-label="Maximum capacity in kW">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-date-from">Date From</label>' +
          '<input type="date" class="form-input pt-filter-input" id="pt-filter-date-from" value="' + _escapeHtml(_filters.dateFrom) + '" aria-label="Start date from">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="pt-filter-date-to">Date To</label>' +
          '<input type="date" class="form-input pt-filter-input" id="pt-filter-date-to" value="' + _escapeHtml(_filters.dateTo) + '" aria-label="Start date to">' +
        '</div>' +
      '</div>' +
      getFilterChipsHTML();

    return html;
  }

  function getFilterChipsHTML() {
    var chips = [];
    var f = _filters;

    var stageLabels = {};
    for (var _slk in STAGE_CONFIG) { if (STAGE_CONFIG.hasOwnProperty(_slk)) stageLabels[_slk] = STAGE_CONFIG[_slk].label; }
    var priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
    var statusLabels = { active: 'Active', completed: 'Completed', delayed: 'Delayed' };
    var typeLabels = { residential: 'Residential', commercial: 'Commercial' };
    var healthLabels = { 'at-risk': 'At Risk', warning: 'Warning', healthy: 'Healthy' };

    function addChip(label, value, filterKey) {
      if (value !== 'all' && value !== '') {
        chips.push(
          '<span class="tag">' +
            _escapeHtml(label) + ': ' + _escapeHtml(value) +
            '<button class="tag-remove" data-filter="' + _escapeHtml(filterKey) + '" aria-label="Remove ' + _escapeHtml(label) + ' filter" type="button">&times;</button>' +
          '</span>'
        );
      }
    }

    if (_searchQuery) {
      chips.push(
        '<span class="tag">' +
          'Search: "' + _escapeHtml(_searchQuery) + '"' +
          '<button class="tag-remove" data-filter="search" aria-label="Remove search filter" type="button">&times;</button>' +
        '</span>'
      );
    }

    addChip('Stage', (stageLabels[f.stage] || f.stage), 'stage');
    addChip('Priority', (priorityLabels[f.priority] || f.priority), 'priority');
    addChip('Status', (statusLabels[f.status] || f.status), 'status');
    addChip('Type', (typeLabels[f.projectType] || f.projectType), 'projectType');
    addChip('Engineer', f.engineer, 'engineer');
    addChip('Installer', f.installer, 'installer');
    addChip('City', f.city, 'city');
    addChip('Health', (healthLabels[f.healthScore] || f.healthScore), 'healthScore');

    if (f.capacityMin) addChip('Cap Min', f.capacityMin + ' kW', 'capacityMin');
    if (f.capacityMax) addChip('Cap Max', f.capacityMax + ' kW', 'capacityMax');
    if (f.dateFrom) addChip('From', f.dateFrom, 'dateFrom');
    if (f.dateTo) addChip('To', f.dateTo, 'dateTo');

    if (chips.length === 0) return '';

    return '<div class="filter-chips" role="list" aria-label="Active filters">' + chips.join('') + '</div>';
  }

  function getActiveFilterCount() {
    var count = 0;
    var f = _filters;
    if (_searchQuery) count++;
    if (f.stage !== 'all') count++;
    if (f.priority !== 'all') count++;
    if (f.status !== 'all') count++;
    if (f.projectType !== 'all') count++;
    if (f.engineer !== 'all') count++;
    if (f.installer !== 'all') count++;
    if (f.city !== 'all') count++;
    if (f.healthScore !== 'all') count++;
    if (f.capacityMin) count++;
    if (f.capacityMax) count++;
    if (f.dateFrom) count++;
    if (f.dateTo) count++;
    return count;
  }

  function getPriorityBadge(priority) {
    var map = { critical: 'badge-error', high: 'badge-orange', medium: 'badge-warning', low: 'badge-neutral' };
    return map[priority] || 'badge-neutral';
  }

  function getHealthClass(score) {
    if (score >= 71) return 'health-good';
    if (score >= 41) return 'health-warning';
    return 'health-danger';
  }

  function getProgressClass(score) {
    if (score >= 71) return 'progress-good';
    if (score >= 41) return 'progress-warning';
    return 'progress-danger';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return parts[2] + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  function groupProjectsByStage(projects) {
    var groups = {};
    var stageIds = KANBAN_STAGE_IDS;
    for (var i = 0; i < stageIds.length; i++) {
      groups[stageIds[i]] = [];
    }
    for (var j = 0; j < projects.length; j++) {
      var p = projects[j];
      var mapped = STATUS_TO_STAGE[p.status];
      if (mapped && groups[mapped]) {
        groups[mapped].push(p);
      }
    }
    return groups;
  }

  function getKanbanCardHTML(p) {
    var pid = _escapeHtml(p.id || '');
    var title = _escapeHtml(p.title || '');
    var customer = _escapeHtml(p.customerName || '');
    var stageId = p.status || '';
    var stageLabel = _escapeHtml((STAGE_CONFIG[stageId] && STAGE_CONFIG[stageId].label) || stageId);
    var priority = _escapeHtml(p.priority || '');
    var priorityBadge = getPriorityBadge(p.priority);
    var healthScore = _num(p.healthScore);
    var healthClass = getHealthClass(healthScore);
    var progress = _num(p.progress);
    var progressClass = getProgressClass(progress);
    var value = formatCurrencyINR(p.projectValue);
    var engineer = _escapeHtml(p.assignedEngineer || '');
    var capacity = _num(p.solarSystemSize) ? _num(p.solarSystemSize) + ' kW' : '';

    return '<div class="kanban-card" draggable="true" data-id="' + pid + '" tabindex="0" role="article" aria-label="Project ' + pid + ': ' + title + '">' +
      '<div class="kanban-card-id">' + pid + '</div>' +
      '<div class="kanban-card-title">' + title + '</div>' +
      '<div class="kanban-card-customer">' + customer + '</div>' +
      '<div class="kanban-card-meta">' +
        '<span class="badge ' + priorityBadge + '">' + priority + '</span>' +
        '<span class="health-score-ring sm ' + healthClass + '">' + healthScore + '</span>' +
      '</div>' +
      '<div class="progress-track"><div class="progress-fill ' + progressClass + '" style="width:' + progress + '%;"></div></div>' +
      '<div class="kanban-card-footer">' +
        '<span class="kanban-card-value">' + value + '</span>' +
        '<span class="kanban-card-engineer">' + engineer + '</span>' +
      '</div>' +
      '<div class="kanban-card-capacity">' + capacity + '</div>' +
      '<div class="kanban-card-move">' +
        '<button class="btn-icon btn-ghost btn-xs" data-move="prev" aria-label="Move ' + pid + ' to previous stage" type="button">&larr;</button>' +
        '<button class="btn-icon btn-ghost btn-xs" data-move="next" aria-label="Move ' + pid + ' to next stage" type="button">&rarr;</button>' +
      '</div>' +
    '</div>';
  }

  function getKanbanColumnHTML(stageId, projects) {
    var meta = KANBAN_STAGE_CONFIG[stageId];
    var title = _escapeHtml(meta ? meta.title : stageId);
    var stageColor = meta && meta.color ? _escapeHtml(meta.color) : '';
    var count = projects.length;
    var pipelineValue = 0;
    for (var i = 0; i < projects.length; i++) {
      pipelineValue = pipelineValue + _num(projects[i].projectValue);
    }
    var valueDisplay = formatCurrencyINR(pipelineValue);

    var cardsHTML = '';
    if (count > 0) {
      for (var j = 0; j < projects.length; j++) {
        cardsHTML = cardsHTML + getKanbanCardHTML(projects[j]);
      }
    } else {
      cardsHTML = '<div class="kanban-empty" role="status">No projects</div>';
    }

    return '<div class="kanban-column" data-stage="' + _escapeHtml(stageId) + '">' +
      '<div class="kanban-column-header">' +
        '<span class="kanban-stage-color" data-stage-color="' + stageColor + '" aria-hidden="true"></span>' +
        '<span class="kanban-stage-title">' + title + '</span>' +
        '<span class="badge badge-neutral badge-sm kanban-count">' + count + '</span>' +
        '<span class="kanban-value">' + valueDisplay + '</span>' +
      '</div>' +
      '<div class="kanban-cards">' + cardsHTML + '</div>' +
    '</div>';
  }

  function getKanbanHTML() {
    try {
      var groups = groupProjectsByStage(_filteredProjects || []);
      var stageIds = KANBAN_STAGE_IDS;
      var columnsHTML = '';
      for (var i = 0; i < stageIds.length; i++) {
        columnsHTML = columnsHTML + getKanbanColumnHTML(stageIds[i], groups[stageIds[i]]);
      }
      return '<div class="kanban-board" role="region" aria-label="Kanban board">' + columnsHTML + '</div>';
    } catch (err) {
      return '<div class="drawer-empty-state-sm">Kanban board failed to render. <button class="btn btn-ghost btn-sm" onclick="GSE.ModuleRegistry.refresh(\'project-tracking\')">Retry</button></div>';
    }
  }

  function getViewToolbarHTML() {
    var tableActive = _currentView === 'table' ? ' active' : '';
    var kanbanActive = _currentView === 'kanban' ? ' active' : '';
    var analyticsActive = _currentView === 'analytics' ? ' active' : '';
    return '<div class="view-toolbar" role="toolbar" aria-label="View switcher">' +
      '<div class="view-toolbar-group">' +
        '<button class="btn btn-ghost btn-sm' + tableActive + '" data-view="table" aria-pressed="' + (_currentView === 'table') + '" type="button">Table</button>' +
        '<button class="btn btn-ghost btn-sm' + kanbanActive + '" data-view="kanban" aria-pressed="' + (_currentView === 'kanban') + '" type="button">Kanban</button>' +
        '<button class="btn btn-ghost btn-sm' + analyticsActive + '" data-view="analytics" aria-pressed="' + (_currentView === 'analytics') + '" type="button">Analytics</button>' +
      '</div>' +
    '</div>';
  }

  function renderCurrentView() {
    try {
      if (_currentView === 'kanban') return getKanbanHTML();
      if (_currentView === 'analytics') return _renderAnalytics();
      var sorted = sortProjects(_filteredProjects || [], _sortColumn, _sortDirection);
      var paginated = paginateProjects(sorted, _page, _pageSize);
      return getProjectTableHTML(paginated);
    } catch (err) {
      if (_stateContainer) {
        ComponentState.showError(_stateContainer, 'Failed to render view: ' + (err.message || 'unknown error'), function () { reRenderCurrentView(); });
      }
      return '<div class="drawer-empty-state-sm">View failed to load. <button class="btn btn-ghost btn-sm" onclick="GSE.ModuleRegistry.refresh(\'project-tracking\')">Retry</button></div>';
    }
  }

  function getPageNumbers(currentPage, totalPages) {
    var pages = [];
    var start = Math.max(1, currentPage - 2);
    var end = Math.min(totalPages, currentPage + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalPages, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (var i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  function getPaginationHTML(paginated) {
    if (paginated.totalItems === 0) return '';
    var html = '<div class="table-pagination">' +
      '<span>Showing ' + paginated.start + '&ndash;' + paginated.end + ' of ' + paginated.totalItems + ' project' + (paginated.totalItems !== 1 ? 's' : '') + '</span>' +
      '<div class="table-pagination-controls">';
    html += '<button class="pagination-btn" data-page="prev" aria-label="Previous page"' + (paginated.page <= 1 ? ' disabled' : '') + '>&lsaquo;</button>';
    var pageNums = getPageNumbers(paginated.page, paginated.totalPages);
    for (var i = 0; i < pageNums.length; i++) {
      var pn = pageNums[i];
      var active = pn === paginated.page ? ' active' : '';
      html += '<button class="pagination-btn' + active + '" data-page="' + pn + '" aria-label="Go to page ' + pn + '"' + (active ? ' aria-current="page"' : '') + '>' + pn + '</button>';
    }
    html += '<button class="pagination-btn" data-page="next" aria-label="Next page"' + (paginated.page >= paginated.totalPages ? ' disabled' : '') + '>&rsaquo;</button>';
    html += '</div></div>';
    return html;
  }

  function getProjectTableHTML(paginated) {
    try {
      if (!paginated || paginated.totalItems === 0) {
        return '<div class="table-container" id="pt-table-container">' +
          '<div class="table-empty" role="status" aria-live="polite">' +
            '<svg class="table-empty-icon" width="40" height="40" aria-hidden="true" opacity="0.4">' +
              '<use href="#icon-briefcase"></use>' +
            '</svg>' +
            '<div class="table-empty-title">No projects found</div>' +
            '<div class="table-empty-desc">Try adjusting your search or filters to find what you&rsquo;re looking for.</div>' +
          '</div>' +
        '</div>';
      }

    var sortClass = function (col) {
      if (_sortColumn !== col) return 'sortable';
      return 'sortable sort-' + _sortDirection;
    };
    var ariaSort = function (col) {
      if (_sortColumn !== col) return 'none';
      return _sortDirection === 'asc' ? 'ascending' : 'descending';
    };

    var html = '<div class="table-container" id="pt-table-container">' +
      '<table class="table table-hover table-compact" id="pt-table" aria-label="Projects table">' +
        '<thead><tr>' +
          '<th class="pt-col-check" scope="col"><input type="checkbox" class="form-checkbox" id="pt-select-all" aria-label="Select all projects on this page"></th>' +
          '<th class="' + sortClass('id') + '" scope="col" data-sort="id" aria-sort="' + ariaSort('id') + '" tabindex="0" role="columnheader">Project ID</th>' +
          '<th class="' + sortClass('name') + '" scope="col" data-sort="name" aria-sort="' + ariaSort('name') + '" tabindex="0" role="columnheader">Project Name</th>' +
          '<th class="' + sortClass('customer') + '" scope="col" data-sort="customer" aria-sort="' + ariaSort('customer') + '" tabindex="0" role="columnheader">Customer</th>' +
          '<th class="' + sortClass('stage') + '" scope="col" data-sort="stage" aria-sort="' + ariaSort('stage') + '" tabindex="0" role="columnheader">Stage</th>' +
          '<th class="' + sortClass('priority') + '" scope="col" data-sort="priority" aria-sort="' + ariaSort('priority') + '" tabindex="0" role="columnheader">Priority</th>' +
          '<th class="' + sortClass('health') + '" scope="col" data-sort="health" aria-sort="' + ariaSort('health') + '" tabindex="0" role="columnheader">Health</th>' +
          '<th class="' + sortClass('value') + '" scope="col" data-sort="value" aria-sort="' + ariaSort('value') + '" tabindex="0" role="columnheader">Value</th>' +
          '<th class="' + sortClass('completion') + '" scope="col" data-sort="completion" aria-sort="' + ariaSort('completion') + '" tabindex="0" role="columnheader">Completion</th>' +
          '<th class="' + sortClass('startDate') + '" scope="col" data-sort="startDate" aria-sort="' + ariaSort('startDate') + '" tabindex="0" role="columnheader">Start Date</th>' +
          '<th class="pt-col-actions" scope="col">Actions</th>' +
        '</tr></thead>' +
        '<tbody>';

    for (var i = 0; i < paginated.items.length; i++) {
      var p = paginated.items[i];
      var pid = _escapeHtml(p.id || '');
      var title = _escapeHtml(p.title || '');
      var customer = _escapeHtml(p.customerName || '');
      var stageId = p.status || '';
      var stageLabel = _escapeHtml((STAGE_CONFIG[stageId] && STAGE_CONFIG[stageId].label) || stageId);
      var stageBadge = (STAGE_CONFIG[stageId] && STAGE_CONFIG[stageId].badge) || 'badge-neutral';
      var priority = _escapeHtml(p.priority || '');
      var priorityBadge = getPriorityBadge(p.priority);
      var healthScore = _num(p.healthScore);
      var healthClass = getHealthClass(healthScore);
      var value = formatCurrencyINR(p.projectValue);
      var progress = _num(p.progress);
      var progressClass = getProgressClass(progress);
      var startDate = formatDate(p.startDate);
      var checked = _selectedProjectIds.has(p.id) ? ' checked' : '';
      var selected = _selectedProjectIds.has(p.id) ? ' selected' : '';

      html += '<tr data-id="' + pid + '" class="' + selected + '">' +
        '<td><input type="checkbox" class="form-checkbox pt-row-checkbox" data-id="' + pid + '"' + checked + ' aria-label="Select project ' + pid + '"></td>' +
        '<td><span class="td-mono">' + pid + '</span></td>' +
        '<td><span class="td-primary">' + title + '</span></td>' +
        '<td>' + customer + '</td>' +
        '<td><span class="badge ' + stageBadge + '">' + stageLabel + '</span></td>' +
        '<td><span class="badge ' + priorityBadge + '">' + priority + '</span></td>' +
        '<td><span class="health-score-ring sm ' + healthClass + '">' + healthScore + '</span></td>' +
        '<td>' + value + '</td>' +
        '<td><div class="progress-track"><div class="progress-fill ' + progressClass + '" style="width:' + progress + '%;"></div></div></td>' +
        '<td>' + startDate + '</td>' +
        '<td><div class="td-actions">' +
          '<button class="btn-icon btn-ghost btn-sm" aria-label="View project ' + pid + '" data-id="' + pid + '">' +
            '<svg width="16" height="16" aria-hidden="true"><use href="#icon-activity"></use></svg>' +
          '</button>' +
        '</div></td>' +
      '</tr>';
    }

    html += '</tbody></table>' + getPaginationHTML(paginated) + '</div>';
    return html;
    } catch (err) {
      return '<div class="table-container" id="pt-table-container"><div class="drawer-empty-state-sm">Table failed to render. <button class="btn btn-ghost btn-sm" onclick="GSE.ModuleRegistry.refresh(\'project-tracking\')">Retry</button></div></div>';
    }
  }

  function renderContent(metrics, projects) {
    if (!_contentContainer) return;
    _contentContainer.hidden = false;
    _filteredProjects = getFilteredProjects(projects, _searchQuery, _filters);
    _contentContainer.innerHTML =
      getKpiSectionHTML(metrics) +
      getFilterBarHTML(projects) +
      getViewToolbarHTML() +
      '<div id="pt-view-container">' + renderCurrentView() + '</div>';
    bindFilterEvents();
    bindViewEvents();
  }

  function readFiltersFromUI() {
    var el = function (id) { return _container && _container.querySelector('#' + id); };
    var val = function (id) { var e = el(id); return e ? e.value : 'all'; };
    var numVal = function (id) { var e = el(id); return e ? e.value : ''; };

    _searchQuery = (el('pt-search-input') ? el('pt-search-input').value : _searchQuery) || '';
    _filters.stage = val('pt-filter-stage');
    _filters.priority = val('pt-filter-priority');
    _filters.status = val('pt-filter-status');
    _filters.projectType = val('pt-filter-type');
    _filters.engineer = val('pt-filter-engineer');
    _filters.installer = val('pt-filter-installer');
    _filters.city = val('pt-filter-city');
    _filters.healthScore = val('pt-filter-health');
    _filters.capacityMin = numVal('pt-filter-cap-min');
    _filters.capacityMax = numVal('pt-filter-cap-max');
    _filters.dateFrom = numVal('pt-filter-date-from');
    _filters.dateTo = numVal('pt-filter-date-to');
  }

  function applyFilters() {
    if (!_projects) return;
    readFiltersFromUI();
    _filteredProjects = getFilteredProjects(_projects, _searchQuery, _filters);
    _page = 1;

    var chipsContainer = _container && _container.querySelector('.filter-chips');
    if (chipsContainer) {
      chipsContainer.outerHTML = getFilterChipsHTML();
    }

    var countEl = _container && _container.querySelector('.filter-active-count');
    var activeCount = getActiveFilterCount();
    var clearBtnEl = _container && _container.querySelector('#pt-clear-all');
    if (countEl) {
      countEl.textContent = String(activeCount);
    } else if (activeCount > 0 && !clearBtnEl) {
      var toggleGroup = _container && _container.querySelector('#pt-toggle-secondary');
      if (toggleGroup && toggleGroup.parentNode) {
        var badge = document.createElement('span');
        badge.className = 'badge badge-info badge-sm filter-active-count';
        badge.textContent = String(activeCount);
        toggleGroup.parentNode.insertBefore(badge, clearBtnEl || null);
      }
    }

    if (activeCount > 0) {
      if (!clearBtnEl) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost btn-sm';
        btn.id = 'pt-clear-all';
        btn.setAttribute('aria-label', 'Clear all filters');
        btn.textContent = 'Clear All';
        var parent = _container && _container.querySelector('.filter-bar');
        if (parent) parent.appendChild(btn);
        btn.addEventListener('click', resetAllFilters);
      }
    } else {
      if (clearBtnEl) clearBtnEl.remove();
    }

    var oldChips = _container && _container.querySelector('.filter-chips');
    if (oldChips) {
      var newChipsHTML = getFilterChipsHTML();
      if (newChipsHTML) {
        oldChips.outerHTML = newChipsHTML;
      } else {
        oldChips.remove();
      }
    } else {
      var newChips = getFilterChipsHTML();
      if (newChips) {
        var secondary = _container && _container.querySelector('#pt-filter-secondary');
        if (secondary) {
          secondary.insertAdjacentHTML('afterend', newChips);
        }
      }
    }

    reRenderCurrentView();
    bindFilterEvents();
  }

  var _debouncedApply = _debounce(function () {
    applyFilters();
  }, 300);

  function bindFilterEvents() {
    var container = _container;
    if (!container) return;

    var searchInput = container.querySelector('#pt-search-input');
    if (searchInput) {
      searchInput.removeEventListener('input', _debouncedApply);
      searchInput.addEventListener('input', _debouncedApply);
    }

    var selects = container.querySelectorAll('.pt-filter-select');
    for (var i = 0; i < selects.length; i++) {
      selects[i].removeEventListener('change', applyFilters);
      selects[i].addEventListener('change', applyFilters);
    }

    var inputs = container.querySelectorAll('.pt-filter-input');
    for (var j = 0; j < inputs.length; j++) {
      inputs[j].removeEventListener('input', _debouncedApply);
      inputs[j].addEventListener('input', _debouncedApply);
    }

    var chips = container.querySelectorAll('.tag-remove');
    for (var k = 0; k < chips.length; k++) {
      chips[k].removeEventListener('click', onChipRemove);
      chips[k].addEventListener('click', onChipRemove);
    }

    var clearBtn = container.querySelector('#pt-clear-all');
    if (clearBtn) {
      clearBtn.removeEventListener('click', resetAllFilters);
      clearBtn.addEventListener('click', resetAllFilters);
    }

    var toggleBtn = container.querySelector('#pt-toggle-secondary');
    if (toggleBtn) {
      toggleBtn.removeEventListener('click', toggleSecondaryFilters);
      toggleBtn.addEventListener('click', toggleSecondaryFilters);
    }
  }

  function bindViewEvents() {
    var container = _container;
    if (!container) return;

    // Table events
    var sortHeaders = container.querySelectorAll('#pt-table th.sortable');
    for (var i = 0; i < sortHeaders.length; i++) {
      sortHeaders[i].removeEventListener('click', onSortClick);
      sortHeaders[i].addEventListener('click', onSortClick);
    }

    var selectAll = container.querySelector('#pt-select-all');
    if (selectAll) {
      selectAll.removeEventListener('change', onSelectAllChange);
      selectAll.addEventListener('change', onSelectAllChange);
    }

    var rowCheckboxes = container.querySelectorAll('.pt-row-checkbox');
    for (var j = 0; j < rowCheckboxes.length; j++) {
      rowCheckboxes[j].removeEventListener('change', onRowCheckboxChange);
      rowCheckboxes[j].addEventListener('change', onRowCheckboxChange);
    }

    var rows = container.querySelectorAll('#pt-table tbody tr[data-id]');
    for (var k = 0; k < rows.length; k++) {
      rows[k].removeEventListener('click', onRowClick);
      rows[k].removeEventListener('dblclick', onRowDblClick);
      rows[k].addEventListener('click', onRowClick);
      rows[k].addEventListener('dblclick', onRowDblClick);
    }

    var pageBtns = container.querySelectorAll('.pagination-btn');
    for (var l = 0; l < pageBtns.length; l++) {
      pageBtns[l].removeEventListener('click', onPageClick);
      pageBtns[l].addEventListener('click', onPageClick);
    }

    // View toolbar events
    var viewBtns = container.querySelectorAll('[data-view]');
    for (var m = 0; m < viewBtns.length; m++) {
      viewBtns[m].removeEventListener('click', onViewToggle);
      viewBtns[m].addEventListener('click', onViewToggle);
    }

    // Kanban events (bindKanbanEvents may be called from reRenderCurrentView)
    var cards = container.querySelectorAll('.kanban-card');
    for (var n = 0; n < cards.length; n++) {
      cards[n].removeEventListener('dragstart', onKanbanDragStart);
      cards[n].removeEventListener('keydown', onKanbanCardKeydown);
      cards[n].addEventListener('dragstart', onKanbanDragStart);
      cards[n].addEventListener('keydown', onKanbanCardKeydown);
    }

    var columns = container.querySelectorAll('.kanban-column');
    for (var o = 0; o < columns.length; o++) {
      columns[o].removeEventListener('dragenter', onKanbanDragEnter);
      columns[o].removeEventListener('dragover', onKanbanDragOver);
      columns[o].removeEventListener('dragleave', onKanbanDragLeave);
      columns[o].removeEventListener('drop', onKanbanDrop);
      columns[o].addEventListener('dragenter', onKanbanDragEnter);
      columns[o].addEventListener('dragover', onKanbanDragOver);
      columns[o].addEventListener('dragleave', onKanbanDragLeave);
      columns[o].addEventListener('drop', onKanbanDrop);
    }

    var moveBtns = container.querySelectorAll('[data-move]');
    for (var p = 0; p < moveBtns.length; p++) {
      moveBtns[p].removeEventListener('click', onKanbanMoveClick);
      moveBtns[p].addEventListener('click', onKanbanMoveClick);
    }

    var kanbanCards = container.querySelectorAll('.kanban-card');
    for (var q = 0; q < kanbanCards.length; q++) {
      kanbanCards[q].removeEventListener('dblclick', onKanbanCardDblClick);
      kanbanCards[q].addEventListener('dblclick', onKanbanCardDblClick);
    }
  }

  function onSortClick(e) {
    var th = e.currentTarget;
    var column = th.getAttribute('data-sort');
    if (!column) return;
    if (_sortColumn === column) {
      _sortDirection = _sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      _sortColumn = column;
      _sortDirection = 'asc';
    }
    reRenderTable();
  }

  function onPageClick(e) {
    var btn = e.currentTarget;
    var pageStr = btn.getAttribute('data-page');
    if (pageStr === 'prev') _page = Math.max(1, _page - 1);
    else if (pageStr === 'next') _page = _page + 1;
    else _page = parseInt(pageStr, 10);
    reRenderTable();
  }

  function onSelectAllChange(e) {
    toggleSelectAll(e.currentTarget.checked);
  }

  function onRowCheckboxChange(e) {
    var cb = e.currentTarget;
    var id = cb.getAttribute('data-id');
    if (!id) return;
    updateSelection(id, cb.checked);
    updateSelectAllCheckbox();
    updateRowSelectedClass(id, cb.checked);
  }

  function onRowClick(e) {
    if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON' || e.target.tagName === 'use' || e.target.tagName === 'svg') return;
    var tr = e.currentTarget;
    var id = tr.getAttribute('data-id');
    if (!id) return;
    var cb = tr.querySelector('.pt-row-checkbox');
    if (!cb) return;
    cb.checked = !cb.checked;
    updateSelection(id, cb.checked);
    updateSelectAllCheckbox();
    updateRowSelectedClass(id, cb.checked);
  }

  function onRowDblClick(e) {
    var tr = e.currentTarget;
    var id = tr.getAttribute('data-id');
    if (id) openProjectDrawer(id, tr);
  }

  function updateSelection(projectId, checked) {
    if (checked) _selectedProjectIds.add(projectId);
    else _selectedProjectIds.delete(projectId);
  }

  function toggleSelectAll(checked) {
    var rows = _container && _container.querySelectorAll('#pt-table tbody tr[data-id]');
    if (!rows) return;
    for (var i = 0; i < rows.length; i++) {
      var id = rows[i].getAttribute('data-id');
      var cb = rows[i].querySelector('.pt-row-checkbox');
      if (cb) {
        cb.checked = checked;
        if (checked) _selectedProjectIds.add(id);
        else _selectedProjectIds.delete(id);
      }
      if (checked) rows[i].classList.add('selected');
      else rows[i].classList.remove('selected');
    }
  }

  function updateSelectAllCheckbox() {
    var selectAll = _container && _container.querySelector('#pt-select-all');
    if (!selectAll) return;
    var rows = _container.querySelectorAll('#pt-table tbody tr[data-id]');
    if (!rows.length) { selectAll.checked = false; return; }
    var checkedCount = 0;
    for (var i = 0; i < rows.length; i++) {
      if (_selectedProjectIds.has(rows[i].getAttribute('data-id'))) checkedCount++;
    }
    selectAll.checked = checkedCount === rows.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < rows.length;
  }

  function updateRowSelectedClass(projectId, checked) {
    var row = _container && _container.querySelector('#pt-table tbody tr[data-id="' + _escapeHtml(projectId) + '"]');
    if (row) {
      if (checked) row.classList.add('selected');
      else row.classList.remove('selected');
    }
  }

  function reRenderTable() {
    if (!_container) return;
    var sorted = sortProjects(_filteredProjects || [], _sortColumn, _sortDirection);
    var paginated = paginateProjects(sorted, _page, _pageSize);
    var oldContainer = _container.querySelector('#pt-table-container');
    var newHTML = getProjectTableHTML(paginated);
    if (oldContainer) {
      oldContainer.outerHTML = newHTML;
    }
    bindViewEvents();
  }

  function reRenderCurrentView() {
    if (!_container) return;
    var viewContainer = _container.querySelector('#pt-view-container');
    if (!viewContainer) return;
    viewContainer.innerHTML = renderCurrentView();
    bindViewEvents();
  }

  function _applyProjectUpdate(projectId, changes) {
    if (!_projects) return;
    for (var i = 0; i < _projects.length; i++) {
      if (_projects[i].id === projectId) {
        for (var k in changes) {
          if (changes.hasOwnProperty(k)) _projects[i][k] = changes[k];
        }
        break;
      }
    }
  }

  function _persistProjectUpdate(projectId, changes) {
    GSE.Services.ProjectService.update(projectId, changes).then(function (resp) {
      if (resp.success && resp.data) {
        for (var i = 0; i < _projects.length; i++) {
          if (_projects[i].id === projectId) {
            _projects[i] = resp.data;
            break;
          }
        }
        if (_activeProjectId === projectId) {
          _activeProject = resp.data;
        }
        _filteredProjects = getFilteredProjects(_projects, _searchQuery, _filters);
        if (_currentView === 'kanban' || _currentView === 'analytics') reRenderCurrentView();
        if (_isDrawerOpen && _activeDrawerTab) reRenderDrawerTab();
      } else {
        refresh();
      }
    }).catch(function () {
      refresh();
    });
  }

  /* Persistence abstraction: local apply + remote persist seam (_persistProjectUpdate is intentionally empty until backend integration) */
  function updateProject(projectId, changes) {
    _applyProjectUpdate(projectId, changes);
    _persistProjectUpdate(projectId, changes);
    _filteredProjects = getFilteredProjects(_projects, _searchQuery, _filters);
    if (_currentView === 'kanban' || _currentView === 'analytics') reRenderCurrentView();
  }

  function updateProjectStage(projectId, toStageId) {
    if (!_projects) return;
    var statuses = Object.keys(STATUS_TO_STAGE);
    var newStatus = null;
    for (var j = 0; j < statuses.length; j++) {
      if (STATUS_TO_STAGE[statuses[j]] === toStageId) { newStatus = statuses[j]; break; }
    }
    if (newStatus) updateProject(projectId, { status: newStatus });
  }

  function switchView(view) {
    if (view === _currentView) return;
    if (view !== 'table' && view !== 'kanban' && view !== 'analytics') return;
    _currentView = view;
    reRenderCurrentView();
    var viewBtns = _container && _container.querySelectorAll('[data-view]');
    if (viewBtns) {
      for (var i = 0; i < viewBtns.length; i++) {
        var btn = viewBtns[i];
        var isActive = btn.getAttribute('data-view') === _currentView;
        if (isActive) btn.classList.add('active');
        else btn.classList.remove('active');
        btn.setAttribute('aria-pressed', String(isActive));
      }
    }
  }

  function onViewToggle(e) {
    var btn = e.currentTarget;
    var view = btn.getAttribute('data-view');
    if (view) switchView(view);
  }

  function onKanbanDragStart(e) {
    var card = e.currentTarget;
    _dragProjectId = card.getAttribute('data-id');
    if (!_dragProjectId) { e.preventDefault(); return; }
    var column = card.closest('.kanban-column');
    _dragSourceStage = column ? column.getAttribute('data-stage') : null;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', _dragProjectId);
  }

  function onKanbanDragEnter(e) {
    e.preventDefault();
    var column = e.currentTarget;
    column.classList.add('drag-over');
  }

  function onKanbanDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onKanbanDragLeave(e) {
    var column = e.currentTarget;
    column.classList.remove('drag-over');
  }

  function onKanbanDrop(e) {
    e.preventDefault();
    var column = e.currentTarget;
    column.classList.remove('drag-over');
    var targetStage = column.getAttribute('data-stage');
    if (!_dragProjectId || !targetStage || targetStage === _dragSourceStage) {
      _dragProjectId = null;
      _dragSourceStage = null;
      return;
    }
    updateProjectStage(_dragProjectId, targetStage);
    _dragProjectId = null;
    _dragSourceStage = null;
  }

  function onKanbanDragEnd(e) {
    var card = e.currentTarget;
    card.classList.remove('dragging');
    var columns = _container && _container.querySelectorAll('.kanban-column');
    if (columns) {
      for (var i = 0; i < columns.length; i++) {
        columns[i].classList.remove('drag-over');
      }
    }
    _dragProjectId = null;
    _dragSourceStage = null;
  }

  function onKanbanMoveClick(e) {
    var btn = e.currentTarget;
    var direction = btn.getAttribute('data-move');
    var card = btn.closest('.kanban-card');
    var column = card && card.closest('.kanban-column');
    if (!card || !column) return;
    var projectId = card.getAttribute('data-id');
    var currentStage = column.getAttribute('data-stage');
    if (!projectId || !currentStage) return;
    var stageIds = KANBAN_STAGE_IDS;
    var idx = stageIds.indexOf(currentStage);
    if (idx === -1) return;
    var targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= stageIds.length) return;
    updateProjectStage(projectId, stageIds[targetIdx]);
  }

  function onKanbanCardKeydown(e) {
    var card = e.currentTarget;
    var column = card.closest('.kanban-column');
    if (!column) return;
    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault();
        var prev = card.previousElementSibling;
        if (prev && prev.classList.contains('kanban-card')) prev.focus();
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        var next = card.nextElementSibling;
        if (next && next.classList.contains('kanban-card')) next.focus();
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        var prevCol = column.previousElementSibling;
        if (prevCol && prevCol.classList.contains('kanban-column')) {
          var cards = prevCol.querySelectorAll('.kanban-card');
          if (cards.length > 0) cards[cards.length - 1].focus();
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        var nextCol = column.nextElementSibling;
        if (nextCol && nextCol.classList.contains('kanban-column')) {
          var firstCard = nextCol.querySelector('.kanban-card');
          if (firstCard) firstCard.focus();
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        card.blur();
        break;
      }
    }
  }

  function onKanbanCardDblClick(e) {
    var card = e.currentTarget;
    var id = card.getAttribute('data-id');
    if (id) openProjectDrawer(id, card);
  }

  function onChipRemove(e) {
    var btn = e.currentTarget;
    var filterKey = btn.getAttribute('data-filter');
    if (!filterKey) return;

    if (filterKey === 'search') {
      _searchQuery = '';
      var searchInput = _container && _container.querySelector('#pt-search-input');
      if (searchInput) searchInput.value = '';
    } else if (_filters.hasOwnProperty(filterKey)) {
      if (filterKey.indexOf('capacity') === 0 || filterKey.indexOf('date') === 0) {
        _filters[filterKey] = '';
        var inputEl = _container && _container.querySelector('#pt-filter-' + filterKey.replace(/([A-Z])/g, '-$1').toLowerCase());
        if (inputEl) inputEl.value = '';
      } else {
        _filters[filterKey] = 'all';
        var selectId = 'pt-filter-' + filterKey;
        if (filterKey === 'projectType') selectId = 'pt-filter-type';
        if (filterKey === 'healthScore') selectId = 'pt-filter-health';
        var selectEl = _container && _container.querySelector('#' + selectId);
        if (selectEl) selectEl.value = 'all';
      }
    }

    applyFilters();
  }

  function resetAllFilters() {
    _searchQuery = '';
    _filters = {
      stage: 'all',
      priority: 'all',
      status: 'all',
      projectType: 'all',
      engineer: 'all',
      installer: 'all',
      city: 'all',
      healthScore: 'all',
      capacityMin: '',
      capacityMax: '',
      dateFrom: '',
      dateTo: ''
    };
    _isSecondaryFiltersOpen = false;

    var container = _container;
    if (container) {
      var searchInput = container.querySelector('#pt-search-input');
      if (searchInput) searchInput.value = '';

      var selects = container.querySelectorAll('.pt-filter-select');
      for (var i = 0; i < selects.length; i++) {
        selects[i].value = 'all';
      }

      var inputs = container.querySelectorAll('.pt-filter-input');
      for (var j = 0; j < inputs.length; j++) {
        inputs[j].value = '';
      }

      var secondary = container.querySelector('#pt-filter-secondary');
      if (secondary) secondary.classList.remove('open');

      var toggleBtn = container.querySelector('#pt-toggle-secondary');
      if (toggleBtn) {
        toggleBtn.textContent = 'More Filters';
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    }

    applyFilters();
  }

  function toggleSecondaryFilters() {
    _isSecondaryFiltersOpen = !_isSecondaryFiltersOpen;
    var container = _container;
    if (!container) return;

    var secondary = container.querySelector('#pt-filter-secondary');
    var toggleBtn = container.querySelector('#pt-toggle-secondary');

    if (secondary) {
      if (_isSecondaryFiltersOpen) {
        secondary.classList.add('open');
      } else {
        secondary.classList.remove('open');
      }
    }

    if (toggleBtn) {
      toggleBtn.textContent = _isSecondaryFiltersOpen ? 'Less Filters' : 'More Filters';
      toggleBtn.setAttribute('aria-expanded', String(_isSecondaryFiltersOpen));
    }
  }

  /* ── DRAWER ───────────────────────────────────────────── */
  /* Drawer lifecycle: tear down existing → create shell → render header + tabs → bind events → focus trap → destroy on close */

  function _on(el, event, fn) {
    el.removeEventListener(event, fn);
    el.addEventListener(event, fn);
  }

  function openProjectDrawer(projectId, sourceElement) {
    if (!_projects) return;
    if (_isDrawerOpen) closeProjectDrawer();
    var found = null;
    for (var i = 0; i < _projects.length; i++) {
      if (_projects[i].id === projectId) { found = _projects[i]; break; }
    }
    if (!found) return;
    resetDrawerState();
    _activeProjectId = projectId;
    _activeProject = found;
    _lastFocusedElement = sourceElement;
    _isDrawerOpen = true;
    _activeDrawerTab = 'overview';
    renderProjectDrawer();
    bindDrawerEvents();
    cacheFocusableElements();
    var closeBtn = _container && _container.querySelector('#pt-drawer-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeProjectDrawer() {
    if (!_isDrawerOpen) return;
    var overlay = _container && _container.querySelector('#pt-drawer-overlay');
    var drawer = _container && _container.querySelector('#pt-drawer');
    if (overlay) overlay.remove();
    if (drawer) drawer.remove();
    _isDrawerOpen = false;
    resetDrawerState();
    restoreFocus();
  }

  function renderProjectDrawer() {
    if (!_container) return;
    try {
      var existing = _container.querySelector('#pt-drawer');
      if (existing) return;
      _container.insertAdjacentHTML('beforeend',
        '<div class="drawer-overlay" id="pt-drawer-overlay" aria-hidden="true" tabindex="-1"></div>' +
        '<div class="drawer" id="pt-drawer" role="dialog" aria-modal="true" aria-labelledby="pt-drawer-title">' +
          renderDrawerHeader() +
          renderDrawerTabs() +
          '<div class="drawer-body" id="pt-drawer-body">' +
            '<div class="drawer-tab-panel active" role="tabpanel" id="pt-tab-overview">' +
              renderOverview() +
            '</div>' +
          '</div>' +
        '</div>'
      );
      _renderedDrawerTabs.add('overview');
    } catch (err) {
      var existingOverlay = _container.querySelector('#pt-drawer-overlay');
      if (existingOverlay) existingOverlay.remove();
      if (_stateContainer) {
        ComponentState.showError(_stateContainer, 'Drawer failed to render: ' + (err.message || 'unknown'));
      }
    }
  }

  function renderDrawerHeader() {
    var p = _activeProject;
    if (!p) return '';
    var title = _escapeHtml(p.title || '');
    var pid = _escapeHtml(p.id || '');
    var priority = _escapeHtml(p.priority || '');
    var priorityBadge = getPriorityBadge(p.priority);
    var health = _num(p.healthScore);
    var healthClass = getHealthClass(health);
    var stageBadge = (STAGE_CONFIG[p.status] && STAGE_CONFIG[p.status].badge) || 'badge-neutral';
    var stageLabel = _escapeHtml((STAGE_CONFIG[p.status] && STAGE_CONFIG[p.status].label) || p.status);
    return '<div class="drawer-header">' +
      '<div class="drawer-header-info">' +
        '<h3 class="drawer-title" id="pt-drawer-title">' + title + '</h3>' +
        '<div class="drawer-header-meta">' +
          '<span class="badge ' + stageBadge + ' badge-sm">' + stageLabel + '</span>' +
          '<span class="badge ' + priorityBadge + ' badge-sm">' + priority + '</span>' +
          '<span class="health-score-ring xs ' + healthClass + '">' + health + '</span>' +
          '<span class="drawer-project-id">' + pid + '</span>' +
        '</div>' +
      '</div>' +
      '<button class="btn-icon btn-ghost btn-sm" id="pt-drawer-close" aria-label="Close project drawer" type="button">' +
        '<svg width="18" height="18" aria-hidden="true"><use href="#icon-close"></use></svg>' +
      '</button>' +
    '</div>';
  }

  function renderDrawerTabs() {
    var tabs = [
      { id: 'overview',   label: 'Overview' },
      { id: 'timeline',   label: 'Timeline' },
      { id: 'team',       label: 'Team' },
      { id: 'financial',  label: 'Financial' },
      { id: 'documents',  label: 'Documents' },
      { id: 'notes',      label: 'Notes' },
      { id: 'risks',      label: 'Risks' },
      { id: 'activity',   label: 'Activity' },
      { id: 'milestones', label: 'Milestones' }
    ];
    var html = '<div class="drawer-tabs" role="tablist" aria-label="Project details">';
    for (var i = 0; i < tabs.length; i++) {
      var active = tabs[i].id === 'overview' ? ' active' : '';
      var selected = tabs[i].id === 'overview' ? 'true' : 'false';
      html += '<button class="drawer-tab' + active + '" role="tab" data-tab="' + tabs[i].id + '" aria-selected="' + selected + '" type="button">' + tabs[i].label + '</button>';
    }
    html += '</div>';
    return html;
  }

  function switchDrawerTab(tabId) {
    if (tabId === _activeDrawerTab) return;
    _activeDrawerTab = tabId;
    var body = _container && _container.querySelector('#pt-drawer-body');
    if (!_renderedDrawerTabs.has(tabId) && body) {
      var content = renderDrawerTabContent(tabId);
      body.insertAdjacentHTML('beforeend', '<div class="drawer-tab-panel" role="tabpanel" id="pt-tab-' + tabId + '">' + content + '</div>');
      _renderedDrawerTabs.add(tabId);
    }
    var panels = body && body.querySelectorAll('.drawer-tab-panel');
    for (var i = 0; i < panels.length; i++) {
      var isActive = panels[i].id === 'pt-tab-' + tabId;
      panels[i].hidden = !isActive;
      panels[i].classList.toggle('active', isActive);
    }
    var tabs = _container && _container.querySelectorAll('.drawer-tab');
    for (var j = 0; j < tabs.length; j++) {
      var isTabActive = tabs[j].getAttribute('data-tab') === tabId;
      tabs[j].classList.toggle('active', isTabActive);
      tabs[j].setAttribute('aria-selected', String(isTabActive));
    }
    var activePanel = body && body.querySelector('#pt-tab-' + tabId);
    if (activePanel) {
      var firstFocusable = activePanel.querySelector('button, [tabindex]:not([tabindex="-1"]), textarea, a[href]');
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        activePanel.setAttribute('tabindex', '-1');
        activePanel.focus();
        activePanel.addEventListener('blur', function _removeTabindex() {
          activePanel.removeAttribute('tabindex');
          activePanel.removeEventListener('blur', _removeTabindex);
        });
      }
    }
    cacheFocusableElements();
  }

  function reRenderDrawerTab() {
    if (!_isDrawerOpen || !_activeProject) return;
    var body = _container && _container.querySelector('#pt-drawer-body');
    if (!body) return;
    var tabId = _activeDrawerTab || 'overview';
    var panel = body.querySelector('#pt-tab-' + tabId);
    if (!panel) return;
    panel.innerHTML = renderDrawerTabContent(tabId);
  }

  function renderDrawerTabContent(tabId) {
    switch (tabId) {
      case 'timeline':   return renderTimeline();
      case 'team':       return renderTeam();
      case 'financial':  return renderFinancial();
      case 'documents':  return renderDocuments();
      case 'notes':      return renderNotes();
      case 'risks':      return renderRisks();
      case 'activity':   return renderActivity();
      case 'milestones': return renderMilestones();
      default: return '';
    }
  }

  function renderOverview() {
    var p = _activeProject;
    if (!p) return '';
    var customer = _escapeHtml(p.customerName || '');
    var value = formatCurrencyINR(p.projectValue);
    var capacity = _num(p.solarSystemSize) ? _num(p.solarSystemSize) + ' kW' : '—';
    var progress = _num(p.progress);
    var progressClass = getProgressClass(progress);
    var health = _num(p.healthScore);
    var healthClass = getHealthClass(health);
    var stageBadge = (STAGE_CONFIG[p.status] && STAGE_CONFIG[p.status].badge) || 'badge-neutral';
    var stageLabel = _escapeHtml((STAGE_CONFIG[p.status] && STAGE_CONFIG[p.status].label) || p.status);
    var engineer = _escapeHtml(p.assignedEngineer || '');
    var installer = _escapeHtml(p.assignedTeam || '');
    var city = _escapeHtml(p.city || '');
    var state = _escapeHtml(p.state || '');
    var location = city + (city && state ? ', ' : '') + state;
    var type = _escapeHtml(p.projectType || '');
    var statusLabel = p.status === 'completed' ? 'Completed' : 'Active';
    var statusBadge = p.status === 'completed' ? 'badge-success' : 'badge-info';

    return '<div class="drawer-overview-grid">' +
      _df('Customer', customer) +
      _df('Project Value', value) +
      _df('Capacity', capacity) +
      _df('Completion',
        progress + '% <div class="progress-track inline"><div class="progress-fill ' + progressClass + '" style="width:' + progress + '%;"></div></div>'
      ) +
      _df('Health Score', '<span class="health-score-ring sm ' + healthClass + '">' + health + '</span>') +
      _df('Current Stage', '<span class="badge ' + stageBadge + ' badge-sm">' + stageLabel + '</span>') +
      _df('Engineer', engineer) +
      _df('Installer', installer) +
      _df('Location', location || '—') +
      _df('Project Type', type || '—') +
      _df('Status', '<span class="badge ' + statusBadge + ' badge-sm">' + statusLabel + '</span>') +
    '</div>';
  }

  function _df(label, value) {
    return '<div class="drawer-field"><span class="drawer-field-label">' + label + '</span><span class="drawer-field-value">' + value + '</span></div>';
  }

  function renderTimelineGroup(items) {
    var html = '<div class="drawer-timeline" role="list" aria-label="Project timeline">';
    for (var i = 0; i < items.length; i++) {
      var t = items[i];
      var dotClass = t.status === 'completed' ? 'completed' : (t.status === 'current' ? 'current' : 'pending');
      var itemClass = t.status === 'current' ? ' timeline-item highlight' : '';
      var badgeClass = t.status === 'completed' ? 'badge-success' : (t.status === 'current' ? 'badge-info' : 'badge-neutral');
      var badgeLabel = t.status.charAt(0).toUpperCase() + t.status.slice(1);
      var dateLine = '';
      if (t.startDate) dateLine += 'Start: ' + formatDate(t.startDate);
      if (t.completionDate) dateLine += (dateLine ? '  |  ' : '') + 'End: ' + formatDate(t.completionDate);
      html += '<div class="timeline-item' + itemClass + '" role="listitem" aria-label="' + badgeLabel + ': ' + t.label + '">' +
        '<div class="timeline-dot ' + dotClass + '" aria-hidden="true"></div>' +
        (i < items.length - 1 ? '<div class="timeline-connector" aria-hidden="true"></div>' : '') +
        '<div class="timeline-content">' +
          '<div class="timeline-stage-name">' + t.label + '</div>' +
          (dateLine ? '<div class="timeline-date">' + dateLine + '</div>' : '') +
          '<div class="timeline-meta">' +
            '<span class="badge ' + badgeClass + ' badge-sm">' + badgeLabel + '</span>' +
            (t.duration ? '<span class="timeline-duration">' + t.duration + '</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    return html;
  }

  function renderTimeline() {
    var p = _activeProject;
    if (!p) return '';
    var items = resolveProjectTimeline(p);
    return renderTimelineGroup(items);
  }

  function renderTeam() {
    var p = _activeProject;
    if (!p) return '';
    var engineer = _escapeHtml(p.assignedEngineer || '');
    var installer = _escapeHtml(p.assignedTeam || '');
    var email = _escapeHtml(p.customerEmail || '');
    var phone = _escapeHtml(p.customerPhone || '');
    var engInitials = engineer ? engineer.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase() : '?';
    var instInitials = installer ? installer.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase() : '?';
    return '<div class="drawer-team">' +
      '<div class="drawer-team-member">' +
        '<div class="drawer-avatar" aria-hidden="true">' + engInitials + '</div>' +
        '<div class="drawer-team-info">' +
          '<div class="drawer-team-name">' + engineer + '</div>' +
          '<div class="drawer-team-role">Assigned Engineer</div>' +
        '</div>' +
      '</div>' +
      '<div class="drawer-team-member">' +
        '<div class="drawer-avatar" aria-hidden="true">' + instInitials + '</div>' +
        '<div class="drawer-team-info">' +
          '<div class="drawer-team-name">' + installer + '</div>' +
          '<div class="drawer-team-role">Installation Team</div>' +
        '</div>' +
      '</div>' +
      '<div class="drawer-field"><span class="drawer-field-label">Email</span><span class="drawer-field-value">' + email + '</span></div>' +
      '<div class="drawer-field"><span class="drawer-field-label">Phone</span><span class="drawer-field-value">' + phone + '</span></div>' +
    '</div>';
  }

  function buildFinancialSummary(project) {
    var value = _num(project.projectValue);
    var budget = _num(project.totalBudget) || value;
    var varianceRaw = _num(project.budgetVariance);
    var variancePct = budget > 0 ? Math.round(Math.abs(varianceRaw / budget) * 100) : 0;
    var varianceSign = varianceRaw >= 0 ? '+' : '';
    var varianceDisplay = varianceSign + formatCurrencyINR(Math.abs(varianceRaw));
    var estimatedSavings = Math.round(value * 1.4 / 5);
    var roiPct = budget > 0 ? Math.round((estimatedSavings / budget) * 100) : 0;
    var paybackYears = estimatedSavings > 0 ? (budget / estimatedSavings).toFixed(1) : '—';
    return {
      projectValue: formatCurrencyINR(value),
      budget: formatCurrencyINR(budget),
      variance: varianceDisplay + ' (' + variancePct + '%)',
      varianceClass: varianceRaw <= 0 ? 'positive' : 'negative',
      estimatedSavings: '\u20B9' + estimatedSavings.toLocaleString('en-IN') + '/yr',
      roi: roiPct + '%',
      payback: paybackYears + ' years'
    };
  }

  function renderFinancial() {
    var p = _activeProject;
    if (!p) return '';
    var fin = buildFinancialSummary(p);
    return '<div class="drawer-financial-grid">' +
      _df('Project Value', fin.projectValue) +
      _df('Budget', fin.budget) +
      _df('Variance', '<span class="' + fin.varianceClass + '">' + fin.variance + '</span>') +
      _df('Estimated Annual Savings', fin.estimatedSavings) +
      _df('ROI', fin.roi) +
      _df('Payback Period', fin.payback) +
    '</div>';
  }

  function renderDocuments() {
    var p = _activeProject;
    if (!p) return '';
    var docs = p.documents || [];
    var html = '<div class="drawer-documents">';
    if (docs.length === 0) {
      html += '<div class="drawer-empty-state">' +
        '<svg class="drawer-empty-icon" width="40" height="40" aria-hidden="true" opacity="0.4"><use href="#icon-clipboard"></use></svg>' +
        '<div class="drawer-empty-title">No documents yet</div>' +
        '<div class="drawer-empty-desc">Upload contracts, permits, and site photos to keep project documentation organized.</div>' +
      '</div>';
    } else {
      html += '<ul class="drawer-doc-list">';
      for (var i = 0; i < docs.length; i++) {
        html += '<li class="drawer-doc-item">' + _escapeHtml(docs[i].name || 'Document ' + (i + 1)) + '</li>';
      }
      html += '</ul>';
    }
    html += '<div class="drawer-doc-actions">' +
      '<button class="btn btn-ghost btn-sm" disabled type="button" aria-label="View document">View</button>' +
      '<button class="btn btn-ghost btn-sm" disabled type="button" aria-label="Download document">Download</button>' +
      '<button class="btn btn-primary btn-sm" disabled type="button" aria-label="Upload document">Upload</button>' +
    '</div></div>';
    return html;
  }

  function renderNoteCard(note, projectId) {
    var text = _escapeHtml(note.text);
    var author = _escapeHtml(note.author || '');
    var ts = note.timestamp;
    var dateStr = '';
    if (ts) {
      var d = new Date(ts);
      dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    var actionsHtml = '';
    if (!note.isProjectNote) {
      actionsHtml = '<div class="drawer-note-actions">' +
        '<button class="btn-icon btn-ghost btn-xs note-edit-btn" data-note-id="' + note.id + '" aria-label="Edit note" type="button">' +
          '<svg width="12" height="12" aria-hidden="true"><use href="#icon-edit"></use></svg>' +
        '</button>' +
        '<button class="btn-icon btn-ghost btn-xs note-delete-btn" data-note-id="' + note.id + '" aria-label="Delete note" type="button">' +
          '<svg width="12" height="12" aria-hidden="true"><use href="#icon-trash"></use></svg>' +
        '</button>' +
      '</div>';
    }
    return '<div class="drawer-note-item" data-note-id="' + note.id + '">' +
      '<div class="drawer-note-text">' + text + '</div>' +
      '<div class="drawer-note-time">' + author + (author && dateStr ? ' &middot; ' : '') + dateStr + '</div>' +
      actionsHtml +
    '</div>';
  }

  function _persistNotes(projectId) {
    var p = null;
    for (var i = 0; i < _projects.length; i++) {
      if (_projects[i].id === projectId) { p = _projects[i]; break; }
    }
    if (!p) return;
    var allNotes = resolveProjectNotes(p, NoteStore);
    var serialized = [];
    for (var j = 0; j < allNotes.length; j++) {
      var n = allNotes[j];
      serialized.push({ text: n.text || '', timestamp: n.timestamp || null, author: n.author || 'You' });
    }
    GSE.Services.ProjectService.update(projectId, { notes: serialized }).then(function (resp) {
      if (resp.success && resp.data) {
        for (var k = 0; k < _projects.length; k++) {
          if (_projects[k].id === projectId) {
            _projects[k] = resp.data;
            NoteStore.clear(projectId);
            break;
          }
        }
        if (_activeProjectId === projectId) _activeProject = resp.data;
      }
    });
  }

  function saveProjectNote(projectId, text) {
    if (!text.trim()) return;
    NoteStore.add(projectId, text);
    var listEl = _container && _container.querySelector('.drawer-notes-list');
    if (listEl) {
      listEl.outerHTML = _buildNotesListHTML(projectId);
    }
    var input = _container && _container.querySelector('.drawer-note-input');
    if (input) input.value = '';
    _persistNotes(projectId);
  }

  function editProjectNote(noteId, newText) {
    if (!newText.trim() || !_activeProjectId) return;
    NoteStore.update(_activeProjectId, noteId, newText);
    var listEl = _container && _container.querySelector('.drawer-notes-list');
    if (listEl) {
      listEl.outerHTML = _buildNotesListHTML(_activeProjectId);
    }
    _persistNotes(_activeProjectId);
  }

  function deleteProjectNote(noteId) {
    if (!_activeProjectId) return;
    if (!confirm('Delete this note?')) return;
    NoteStore.remove(_activeProjectId, noteId);
    var listEl = _container && _container.querySelector('.drawer-notes-list');
    if (listEl) {
      listEl.outerHTML = _buildNotesListHTML(_activeProjectId);
    }
    _persistNotes(_activeProjectId);
  }

  function _buildNotesListHTML(projectId) {
    var allNotes = resolveProjectNotes(_activeProject, NoteStore);
    if (allNotes.length === 0) {
      return '<div class="drawer-notes-list" aria-live="polite"><div class="drawer-empty-state-sm">No notes yet.</div></div>';
    }
    var html = '<div class="drawer-notes-list" aria-live="polite">';
    for (var i = 0; i < allNotes.length; i++) {
      html += renderNoteCard(allNotes[i], projectId);
    }
    html += '</div>';
    return html;
  }

  function renderNotes() {
    var p = _activeProject;
    if (!p) return '';
    var notesList = _buildNotesListHTML(_activeProjectId);
    return '<div class="drawer-notes-container">' +
      notesList +
      '<div class="drawer-note-composer">' +
        '<textarea class="form-input drawer-note-input" placeholder="Add a note..." aria-label="New note" rows="3"></textarea>' +
        '<button class="btn btn-primary btn-sm" id="pt-save-note" type="button">Save Note</button>' +
      '</div>' +
    '</div>';
  }

  function renderRiskCard(risk) {
    var severityBadge = risk.severity === 'critical' ? 'badge-error' :
      (risk.severity === 'high' ? 'badge-orange' :
      (risk.severity === 'medium' ? 'badge-warning' : 'badge-neutral'));
    var statusDot = risk.status === 'open' ? 'error' : (risk.status === 'monitoring' ? 'warning' : 'success');
    var label = _escapeHtml(risk.label);
    var mitigation = _escapeHtml(risk.mitigation);
    var owner = _escapeHtml(risk.owner);
    var sevUpper = risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1);
    var probUpper = risk.probability.charAt(0).toUpperCase() + risk.probability.slice(1);
    var statUpper = risk.status.charAt(0).toUpperCase() + risk.status.slice(1);
    return '<div class="risk-card" role="listitem" aria-label="Risk: ' + label + '">' +
      '<div class="risk-card-header">' +
        '<span class="badge ' + severityBadge + '">' + sevUpper + '</span>' +
        '<span class="risk-score-badge" aria-label="Risk score ' + risk.riskScore + ' out of 16">' + risk.riskScore + '</span>' +
      '</div>' +
      '<h4 class="risk-card-title">' + label + '</h4>' +
      '<div class="risk-detail-grid">' +
        '<div class="risk-detail-item"><span class="risk-detail-label">Impact</span><span class="risk-detail-value">' + risk.impact + '</span></div>' +
        '<div class="risk-detail-item"><span class="risk-detail-label">Probability</span><span class="risk-detail-value">' + probUpper + '</span></div>' +
        '<div class="risk-detail-item"><span class="risk-detail-label">Owner</span><span class="risk-detail-value">' + owner + '</span></div>' +
      '</div>' +
      '<div class="risk-status-row">' +
        '<span class="status-dot ' + statusDot + '" aria-hidden="true"></span>' +
        '<span class="risk-status-label">' + statUpper + '</span>' +
      '</div>' +
      '<div class="risk-mitigation">' + mitigation + '</div>' +
    '</div>';
  }

  function renderRisks() {
    var p = _activeProject;
    if (!p) return '';
    var risks = resolveProjectRisks(p);
    var html = '<div class="drawer-risks" role="list" aria-label="Risk register">';
    if (risks.length === 0) {
      html += '<div class="drawer-empty-state-sm">No risks identified.</div>';
    } else {
      for (var i = 0; i < risks.length; i++) {
        html += renderRiskCard(risks[i]);
      }
    }
    html += '</div>';
    return html;
  }

  function renderActivityGroup(groupName, activities) {
    if (activities.length === 0) return '';
    var groupLabel = groupName === 'today' ? 'Today' : (groupName === 'yesterday' ? 'Yesterday' : 'Earlier');
    var groupId = 'activity-group-' + groupName;
    var html = '<div class="activity-group">' +
      '<h4 class="activity-group-header">' +
        '<button class="activity-group-toggle" aria-expanded="true" aria-controls="' + groupId + '-body" type="button">' +
          groupLabel +
          ' <span class="badge badge-neutral badge-sm">' + activities.length + '</span>' +
          '<svg class="activity-toggle-icon" width="12" height="12" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
        '</button>' +
      '</h4>' +
      '<div class="activity-group-body" id="' + groupId + '-body" role="list">';
    for (var i = 0; i < activities.length; i++) {
      var a = activities[i];
      var msg = _escapeHtml(a.message);
      var actor = _escapeHtml(a.user);
      var ts = a.timestamp;
      var dateStr = '';
      if (ts) {
        var d = new Date(ts);
        dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      html += '<div class="activity-item" role="listitem">' +
        '<div class="activity-icon-box" aria-hidden="true">' +
          '<svg width="14" height="14" aria-hidden="true"><use href="#icon-activity"></use></svg>' +
        '</div>' +
        '<div class="activity-content">' +
          '<div class="activity-message">' + msg + '</div>' +
          '<div class="activity-meta">' +
            '<span class="badge ' + a.categoryBadge + ' badge-sm activity-category-badge">' + _escapeHtml(a.categoryLabel) + '</span> ' +
            actor + (actor && dateStr ? ' &middot; ' : '') + dateStr +
          '</div>' +
        '</div>' +
      '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function renderActivity() {
    var p = _activeProject;
    if (!p) return '';
    var grouped = resolveProjectActivity(p);
    var total = grouped.today.length + grouped.yesterday.length + grouped.earlier.length;
    if (total === 0) {
      return '<div class="drawer-empty-state-sm">No activity recorded.</div>';
    }
    var html = '<div class="drawer-activity-feed" aria-live="polite">';
    html += renderActivityGroup('today', grouped.today);
    html += renderActivityGroup('yesterday', grouped.yesterday);
    html += renderActivityGroup('earlier', grouped.earlier);
    html += '</div>';
    return html;
  }

  function renderMilestoneCard(milestone, groupType) {
    var dotClass = groupType === 'completed' ? 'success' : (groupType === 'current' ? 'processing' : 'neutral');
    var progress = milestone.progress;
    var progressClass = getProgressClass(progress);
    var label = _escapeHtml(milestone.label);
    var groupLabel = groupType.charAt(0).toUpperCase() + groupType.slice(1);
    return '<div class="milestone-card" role="listitem" aria-label="' + groupLabel + ' milestone: ' + label + '">' +
      '<div class="milestone-header">' +
        '<span class="status-dot ' + dotClass + '" aria-hidden="true"></span>' +
        '<span class="milestone-name">' + label + '</span>' +
        '<span class="milestone-progress-pct" aria-label="' + progress + '% complete">' + progress + '%</span>' +
      '</div>' +
      '<div class="progress-track milestone-progress-track">' +
        '<div class="progress-fill ' + progressClass + '" style="width:' + progress + '%;" role="progressbar" aria-valuenow="' + progress + '" aria-valuemin="0" aria-valuemax="100"></div>' +
      '</div>' +
      '<div class="milestone-detail-grid">' +
        '<div class="milestone-detail-item"><span class="milestone-detail-label">Duration</span><span class="milestone-detail-value">' + milestone.duration + '</span></div>' +
        '<div class="milestone-detail-item"><span class="milestone-detail-label">Target</span><span class="milestone-detail-value">' + milestone.targetDate + '</span></div>' +
        (groupType !== 'upcoming' ? '<div class="milestone-detail-item"><span class="milestone-detail-label">Completion</span><span class="milestone-detail-value">' + milestone.completionDate + '</span></div>' : '') +
        '<div class="milestone-detail-item milestone-detail-full"><span class="milestone-detail-label">Dependencies</span><span class="milestone-detail-value milestone-deps-placeholder">' + milestone.dependencies + '</span></div>' +
      '</div>' +
    '</div>';
  }

  function renderMilestones() {
    var p = _activeProject;
    if (!p) return '';
    var timeline = resolveProjectTimeline(p);
    var grouped = resolveProjectMilestones(timeline, p);
    var html = '<div class="drawer-milestones">' +
      '<div class="milestone-group" role="list" aria-label="Completed milestones">' +
        '<h4 class="milestone-group-title">Completed <span class="badge badge-success badge-sm">' + grouped.completed.length + '</span></h4>' +
        grouped.completed.map(function (m) { return renderMilestoneCard(m, 'completed'); }).join('') +
      '</div>' +
      '<div class="milestone-group" role="list" aria-label="Current milestones">' +
        '<h4 class="milestone-group-title">Current <span class="badge badge-info badge-sm">' + grouped.current.length + '</span></h4>' +
        grouped.current.map(function (m) { return renderMilestoneCard(m, 'current'); }).join('') +
      '</div>' +
      '<div class="milestone-group" role="list" aria-label="Upcoming milestones">' +
        '<h4 class="milestone-group-title">Upcoming <span class="badge badge-neutral badge-sm">' + grouped.upcoming.length + '</span></h4>' +
        grouped.upcoming.map(function (m) { return renderMilestoneCard(m, 'upcoming'); }).join('') +
      '</div>' +
    '</div>';
    return html;
  }

  function bindDrawerEvents() {
    var drawer = _container && _container.querySelector('#pt-drawer');
    var overlay = _container && _container.querySelector('#pt-drawer-overlay');
    if (!drawer) return;

    var closeBtn = drawer.querySelector('#pt-drawer-close');
    if (closeBtn) _on(closeBtn, 'click', closeProjectDrawer);

    if (overlay) _on(overlay, 'click', closeProjectDrawer);

    _on(drawer, 'keydown', _onDrawerKeydown);

    var tabs = drawer.querySelectorAll('.drawer-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].removeEventListener('click', onDrawerTabClick);
      tabs[i].addEventListener('click', onDrawerTabClick);
    }

    var saveBtn = drawer.querySelector('#pt-save-note');
    if (saveBtn) {
      saveBtn.removeEventListener('click', onDrawerSaveNote);
      saveBtn.addEventListener('click', onDrawerSaveNote);
    }

    var noteInput = drawer.querySelector('.drawer-note-input');
    if (noteInput) {
      noteInput.removeEventListener('keydown', onDrawerNoteKeydown);
      noteInput.addEventListener('keydown', onDrawerNoteKeydown);
    }

    /* ── Delegated: note edit / delete / activity toggle ── */
    drawer.removeEventListener('click', onDrawerDelegateClick);
    drawer.addEventListener('click', onDrawerDelegateClick);
  }

  function _onDrawerKeydown(e) {
    if (e.key === 'Escape') closeProjectDrawer();
    else trapDrawerFocus(e);
  }

  function onDrawerTabClick(e) {
    var tabId = e.currentTarget.getAttribute('data-tab');
    if (tabId) switchDrawerTab(tabId);
  }

  function onDrawerSaveNote() {
    var input = _container && _container.querySelector('.drawer-note-input');
    if (input) saveProjectNote(_activeProjectId, input.value);
  }

  function onDrawerNoteKeydown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      saveProjectNote(_activeProjectId, e.currentTarget.value);
    }
  }

  function onDrawerDelegateClick(e) {
    var target = e.target;
    var editBtn = target.closest('.note-edit-btn');
    if (editBtn) {
      var noteId = editBtn.getAttribute('data-note-id');
      if (noteId) enterNoteEditMode(noteId);
      return;
    }
    var deleteBtn = target.closest('.note-delete-btn');
    if (deleteBtn) {
      var noteId = deleteBtn.getAttribute('data-note-id');
      if (noteId) deleteProjectNote(noteId);
      return;
    }
    var toggleBtn = target.closest('.activity-group-toggle');
    if (toggleBtn) {
      toggleActivityGroup(toggleBtn);
      return;
    }
    var saveEditBtn = target.closest('.note-edit-save');
    if (saveEditBtn) {
      var noteId = saveEditBtn.getAttribute('data-note-id');
      var textarea = saveEditBtn.parentNode.querySelector('.note-edit-textarea');
      if (noteId && textarea) {
        editProjectNote(noteId, textarea.value);
        exitNoteEditMode();
      }
      return;
    }
    var cancelEditBtn = target.closest('.note-edit-cancel');
    if (cancelEditBtn) {
      exitNoteEditMode();
      return;
    }
  }

  function enterNoteEditMode(noteId) {
    var noteEl = _container && _container.querySelector('.drawer-note-item[data-note-id="' + noteId + '"]');
    if (!noteEl) return;
    var textEl = noteEl.querySelector('.drawer-note-text');
    if (!textEl) return;
    var currentText = textEl.textContent || '';
    textEl.innerHTML = '<textarea class="form-input note-edit-textarea" rows="2" aria-label="Edit note">' + _escapeHtml(currentText) + '</textarea>' +
      '<div class="note-edit-actions">' +
        '<button class="btn btn-primary btn-xs note-edit-save" data-note-id="' + noteId + '" type="button">Save</button>' +
        '<button class="btn btn-ghost btn-xs note-edit-cancel" type="button">Cancel</button>' +
      '</div>';
    var textarea = textEl.querySelector('.note-edit-textarea');
    if (textarea) textarea.focus();
  }

  function exitNoteEditMode() {
    var noteEl = _container && _container.querySelector('.drawer-note-item .note-edit-textarea');
    if (noteEl) {
      var listEl = _container && _container.querySelector('.drawer-notes-list');
      if (listEl) listEl.outerHTML = _buildNotesListHTML(_activeProjectId);
    }
  }

  function toggleActivityGroup(btn) {
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    var bodyId = btn.getAttribute('aria-controls');
    if (bodyId) {
      var body = document.getElementById(bodyId);
      if (body) body.hidden = expanded;
    }
  }

  function cacheFocusableElements() {
    var drawer = _container && _container.querySelector('#pt-drawer');
    if (!drawer) { _drawerFocusableElements = []; return; }
    var all = drawer.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), textarea');
    _drawerFocusableElements = [];
    for (var i = 0; i < all.length; i++) {
      if (!all[i].disabled && all[i].offsetParent !== null) {
        _drawerFocusableElements.push(all[i]);
      }
    }
  }

  function trapDrawerFocus(e) {
    if (e.key !== 'Tab') return;
    if (_drawerFocusableElements.length === 0) return;
    var first = _drawerFocusableElements[0];
    var last = _drawerFocusableElements[_drawerFocusableElements.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function restoreFocus() {
    if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') {
      _lastFocusedElement.focus();
    }
  }

  /* Self-register with ModuleRegistry at IIFE execution time */
  register();

  return {
    init: init,
    mount: mount,
    refresh: refresh,
    unmount: unmount,
    destroy: destroy,
    register: register
  };
})();
