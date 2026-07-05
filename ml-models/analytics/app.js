const CSV_URL = "analytics_report.csv";

const state = {
  rows: [],
  filteredRows: [],
  charts: {},
  filters: {
    month: "All",
    segment: "All",
    customer: "All",
    city: "All",
    discom: "All"
  }
};

const monthOrder = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const chartColors = ["#ff8a1d", "#17a8e5", "#36d399", "#f7c948", "#b892ff", "#ff6b6b", "#70d6ff", "#f78fb3"];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const numberFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
const compactNumberFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

document.addEventListener("DOMContentLoaded", () => {
  wireNavigation();
  loadCsv();
});

// Data loading and normalization keep every KPI, chart, and insight tied to the CSV.
function loadCsv() {
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: ({ data }) => {
      state.rows = data.map(normalizeRow).filter(row => row.customer && Number.isFinite(row.monthlyUnits));
      state.filteredRows = [...state.rows];
      document.getElementById("lastUpdated").textContent = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
      buildFilters();
      renderDashboard();
    },
    error: () => {
      document.querySelector("main").innerHTML = `
        <div class="empty-state">
          Unable to load analytics_report.csv. Serve this folder over HTTP so Papa Parse can fetch the CSV dynamically.
        </div>`;
    }
  });
}

function normalizeRow(row) {
  const billingMonth = clean(row.month_short) || parseMonth(row.billing_period);
  return {
    file: clean(row.file),
    customer: clean(row.customer_name),
    consumerNumber: clean(row.consumer_number),
    discom: clean(row.discom),
    city: clean(row.city),
    monthlyUnits: toNumber(row.monthly_units),
    billAmount: toNumber(row.bill_amount),
    perUnitRate: toNumber(row.per_unit_rate),
    billingPeriod: clean(row.billing_period),
    recommendedKw: toNumber(row.recommended_kw),
    monthlySavings: toNumber(row.monthly_savings),
    systemCost: toNumber(row.system_cost),
    paybackYears: toNumber(row.payback_years),
    savings25yr: toNumber(row.savings_25yr),
    solarSavingsPotential: toNumber(row.solar_savings_potential),
    annualSavings: toNumber(row.annual_savings),
    segment: clean(row.segment) || "Unclassified",
    month: billingMonth || "Unknown"
  };
}

function clean(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMonth(period) {
  const raw = clean(period).slice(0, 3).toUpperCase();
  return monthOrder.includes(raw) ? raw : "";
}

function wireNavigation() {
  document.querySelectorAll(".nav-tab").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach(tab => tab.classList.remove("active"));
      document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.page).classList.add("active");
    });
  });
}

// Filters are populated from the dataset, so new months, customers, cities, and DISCOMs appear automatically.
function buildFilters() {
  populateFilter("monthFilter", monthOrder.filter(month => state.rows.some(row => row.month === month)), "month");
  populateFilter("segmentFilter", uniqueSorted(state.rows.map(row => row.segment)), "segment");
  populateFilter("customerFilter", uniqueSorted(state.rows.map(row => row.customer)), "customer");
  populateFilter("cityFilter", uniqueSorted(state.rows.map(row => row.city)), "city");
  populateFilter("discomFilter", uniqueSorted(state.rows.map(row => row.discom)), "discom");

  document.querySelectorAll(".filter-bar select").forEach(select => {
    select.addEventListener("change", event => {
      const key = event.target.id.replace("Filter", "");
      state.filters[key] = event.target.value;
      applyFilters();
      renderDashboard();
    });
  });
}

function populateFilter(id, values, key) {
  const select = document.getElementById(id);
  select.innerHTML = "";
  ["All", ...values].forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value === "All" ? `All ${key}s` : value;
    select.appendChild(option);
  });
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function applyFilters() {
  state.filteredRows = state.rows.filter(row => (
    matches(row.month, state.filters.month) &&
    matches(row.segment, state.filters.segment) &&
    matches(row.customer, state.filters.customer) &&
    matches(row.city, state.filters.city) &&
    matches(row.discom, state.filters.discom)
  ));
}

function matches(value, filterValue) {
  return filterValue === "All" || value === filterValue;
}

// Central render pipeline: every filter change reuses the same derived dataset.
function renderDashboard() {
  const rows = state.filteredRows;
  if (!rows.length) {
    renderEmptyState();
    return;
  }

  document.querySelectorAll(".empty-state").forEach(node => node.remove());
  const metrics = calculateMetrics(rows);
  renderHero(metrics, rows);
  renderKpis("overviewKpis", [
    ["Total Bills", numberFmt.format(rows.length), "Bills in current selection"],
    ["Average Monthly Units", `${numberFmt.format(avg(rows, "monthlyUnits"))} KWH`, "Mean consumption per bill"],
    ["Average Bill Amount", currency.format(avg(rows, "billAmount")), "Mean grid bill"],
    ["Average Solar Savings", `${currency.format(avg(rows, "monthlySavings"))}/mo`, "Estimated monthly reduction"],
    ["Average Payback Period", `${numberFmt.format(avg(rows, "paybackYears"))} yrs`, "Mean system payback"],
    ["Average 25-Year Savings", shortCurrency(avg(rows, "savings25yr")), "Long-term savings potential"]
  ]);
  renderKpis("solarKpis", [
    ["Average Recommended KW", `${numberFmt.format(avg(rows, "recommendedKw"))} kW`, "Mean suggested system size"],
    ["Average Monthly Savings", currency.format(avg(rows, "monthlySavings")), "Per bill opportunity"],
    ["Average Annual Savings", currency.format(avg(rows, "annualSavings")), "Annualized opportunity"],
    ["Average ROI", `${numberFmt.format(metrics.averageRoi)}x`, "25-year savings over system cost"]
  ]);
  renderInsights("overviewInsights", overviewInsights(rows));
  renderInsights("businessInsights", businessInsights(rows));
  document.getElementById("priorityScore").textContent = rows.filter(row => row.monthlySavings >= avg(rows, "monthlySavings")).length;
  renderCharts(rows);
}

function renderEmptyState() {
  ["overviewKpis", "solarKpis", "overviewInsights", "businessInsights"].forEach(id => {
    document.getElementById(id).innerHTML = `<div class="empty-state">No bills match the active filters.</div>`;
  });
  Object.values(state.charts).forEach(chart => chart.destroy());
  state.charts = {};
}

function calculateMetrics(rows) {
  const totalMonthlySavings = sum(rows, "monthlySavings");
  const totalAnnualSavings = sum(rows, "annualSavings");
  const totalSystemCost = sum(rows, "systemCost");
  return {
    totalMonthlySavings,
    totalAnnualSavings,
    averageRoi: totalSystemCost ? sum(rows, "savings25yr") / totalSystemCost : 0
  };
}

function renderHero(metrics, rows) {
  document.getElementById("totalAnnualSavings").textContent = currency.format(metrics.totalAnnualSavings);
  document.getElementById("totalMonthlySavings").textContent = currency.format(metrics.totalMonthlySavings);
  document.getElementById("heroPayback").textContent = `${numberFmt.format(avg(rows, "paybackYears"))} yrs`;
  document.getElementById("filteredCount").textContent = numberFmt.format(rows.length);

  const ordered = monthlyAverage(rows, "monthlySavings");
  const first = ordered[0]?.value ?? 0;
  const last = ordered.at(-1)?.value ?? 0;
  const trend = document.getElementById("trendIndicator");
  const diff = first ? ((last - first) / first) * 100 : 0;
  trend.textContent = `${diff >= 0 ? "+" : ""}${numberFmt.format(diff)}% savings trend across selected months`;
  trend.classList.toggle("negative", diff < 0);
}

// KPI and insight components share templates so the dashboard stays consistent across pages.
function renderKpis(targetId, items) {
  const target = document.getElementById(targetId);
  const template = document.getElementById("kpiTemplate");
  target.innerHTML = "";
  items.forEach(([label, value, note]) => {
    const node = template.content.cloneNode(true);
    node.querySelector("p").textContent = label;
    node.querySelector("strong").textContent = value;
    node.querySelector("small").textContent = note;
    target.appendChild(node);
  });
}

function renderInsights(targetId, insights) {
  const target = document.getElementById(targetId);
  const template = document.getElementById("insightTemplate");
  target.innerHTML = "";
  insights.forEach((insight, index) => {
    const node = template.content.cloneNode(true);
    node.querySelector("span").textContent = String(index + 1);
    node.querySelector("h3").textContent = insight.title;
    node.querySelector("p").textContent = insight.body;
    target.appendChild(node);
  });
}

// Business rules for generated narrative insights.
function overviewInsights(rows) {
  const highestConsumption = maxBy(rows, "monthlyUnits");
  const highestSavings = maxBy(rows, "monthlySavings");
  const bestPayback = minBy(rows.filter(row => row.paybackYears > 0), "paybackYears");
  const commonSegment = topGroup(rows, row => row.segment, "count");
  return [
    {
      title: "Highest Consumption Customer",
      body: `${customerLabel(highestConsumption)} leads consumption at ${numberFmt.format(highestConsumption.monthlyUnits)} KWH.`
    },
    {
      title: "Highest Savings Customer",
      body: `${customerLabel(highestSavings)} shows the strongest monthly savings at ${currency.format(highestSavings.monthlySavings)}.`
    },
    {
      title: "Best Payback Customer",
      body: `${customerLabel(bestPayback)} has the fastest payback at ${numberFmt.format(bestPayback.paybackYears)} years.`
    },
    {
      title: "Most Common Consumer Segment",
      body: `${commonSegment.label} represents ${commonSegment.value} bills in the filtered dataset.`
    }
  ];
}

function businessInsights(rows) {
  const bestSavingsSegment = topGroup(rows, row => row.segment, "monthlySavings");
  const fastestSegment = lowestGroupedAverage(rows, row => row.segment, "paybackYears");
  const topTargets = [...rows].sort((a, b) => b.monthlySavings - a.monthlySavings).slice(0, 3).map(customerLabel).join(", ");
  const bestUsageBand = fastestPaybackBand(rows);
  const highMonth = topGroup(rows, row => row.month, "monthlyUnits", true);
  const roiLeader = maxBy(rows, "savings25yr");
  return [
    {
      title: "Segment With Highest Savings",
      body: `${bestSavingsSegment.label} contributes the highest total savings opportunity at ${currency.format(bestSavingsSegment.value)} per month.`
    },
    {
      title: "Consumers To Target First",
      body: `${topTargets} should be prioritized because their projected savings are highest in the current filter context.`
    },
    {
      title: "Fastest Payback Consumption Level",
      body: `${bestUsageBand.label} consumers show the fastest average payback at ${numberFmt.format(bestUsageBand.value)} years.`
    },
    {
      title: "Highest Average Usage Month",
      body: `${highMonth.label} has the strongest average usage signal at ${numberFmt.format(highMonth.value)} KWH.`
    },
    {
      title: "ROI Expansion Account",
      body: `${customerLabel(roiLeader)} has the largest 25-year savings pool at ${shortCurrency(roiLeader.savings25yr)}.`
    },
    {
      title: "Commercial Playbook",
      body: `${fastestSegment.label} combines favorable payback with segment-level repeatability; package this cohort for outbound sales.`
    }
  ];
}

// Chart builders aggregate the filtered rows immediately before rendering.
function renderCharts(rows) {
  const monthlyUnits = monthlyAverage(rows, "monthlyUnits");
  const monthlyConsumption = monthlySum(rows, "monthlyUnits");
  const segmentCounts = groupCount(rows, row => row.segment);
  const unitsBySegment = groupedSum(rows, row => row.segment, "monthlyUnits");
  const billBySegment = groupedAverage(rows, row => row.segment, "billAmount");
  const paybackBuckets = bucketize(rows.map(row => row.paybackYears), [2, 4, 6, 8], " yrs");
  const kwBuckets = bucketize(rows.map(row => row.recommendedKw), [1, 2, 3, 5], " kW");
  const billBuckets = bucketize(rows.map(row => row.billAmount), [500, 1000, 2000, 5000, 10000], "");
  const topSavings = [...rows].sort((a, b) => b.monthlySavings - a.monthlySavings).slice(0, 8);

  upsertChart("monthlyConsumptionChart", "line", {
    labels: monthlyConsumption.map(item => item.label),
    datasets: [lineDataset("Total units", monthlyConsumption.map(item => item.value), "#17a8e5")]
  });

  upsertChart("billDistributionChart", "bar", {
    labels: billBuckets.labels,
    datasets: [barDataset("Bills", billBuckets.values, "#ff8a1d")]
  });

  upsertChart("segmentChart", "doughnut", {
    labels: segmentCounts.labels,
    datasets: [{
      data: segmentCounts.values,
      backgroundColor: chartColors,
      borderColor: "#081827",
      borderWidth: 3,
      hoverOffset: 10
    }]
  }, doughnutOptions());

  upsertChart("monthlyUnitsTrendChart", "line", {
    labels: monthlyUnits.map(item => item.label),
    datasets: [lineDataset("Average units", monthlyUnits.map(item => item.value), "#36d399")]
  });

  upsertChart("unitsBySegmentChart", "bar", {
    labels: unitsBySegment.labels,
    datasets: [barDataset("Total units", unitsBySegment.values, "#17a8e5")]
  });

  upsertChart("billBySegmentChart", "bar", {
    labels: billBySegment.labels,
    datasets: [barDataset("Average bill", billBySegment.values, "#ff8a1d")]
  });

  upsertChart("unitsBillScatterChart", "scatter", {
    datasets: [scatterDataset("Bills", rows.map(row => ({ x: row.monthlyUnits, y: row.billAmount, customer: customerLabel(row) })), "#17a8e5")]
  }, scatterOptions("Monthly units", "Bill amount"));

  upsertChart("savingsUnitsScatterChart", "scatter", {
    datasets: [scatterDataset("Savings opportunity", rows.map(row => ({ x: row.monthlyUnits, y: row.monthlySavings, customer: customerLabel(row) })), "#ff8a1d")]
  }, scatterOptions("Monthly units", "Monthly savings"));

  upsertChart("paybackDistributionChart", "bar", {
    labels: paybackBuckets.labels,
    datasets: [barDataset("Bills", paybackBuckets.values, "#36d399")]
  });

  upsertChart("topSavingsChart", "bar", {
    labels: topSavings.map(customerLabel),
    datasets: [barDataset("Monthly savings", topSavings.map(row => row.monthlySavings), "#ff8a1d")]
  }, horizontalOptions());

  upsertChart("kwDistributionChart", "bar", {
    labels: kwBuckets.labels,
    datasets: [barDataset("Bills", kwBuckets.values, "#17a8e5")]
  });
}

function upsertChart(canvasId, type, data, options = baseOptions()) {
  if (state.charts[canvasId]) {
    state.charts[canvasId].destroy();
  }
  state.charts[canvasId] = new Chart(document.getElementById(canvasId), { type, data, options });
}

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { labels: { color: "#d8e5f3", usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: "rgba(6, 17, 31, 0.94)",
        borderColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: { ticks: { color: "#9fb3c8" }, grid: { color: "rgba(255,255,255,0.07)" } },
      y: { ticks: { color: "#9fb3c8" }, grid: { color: "rgba(255,255,255,0.07)" }, beginAtZero: true }
    }
  };
}

function doughnutOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { position: "bottom", labels: { color: "#d8e5f3", usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: "rgba(6, 17, 31, 0.94)", padding: 12 }
    }
  };
}

function scatterOptions(xTitle, yTitle) {
  const options = baseOptions();
  options.interaction = { mode: "nearest", intersect: true };
  options.scales.x.title = { display: true, text: xTitle, color: "#9fb3c8" };
  options.scales.y.title = { display: true, text: yTitle, color: "#9fb3c8" };
  options.plugins.tooltip.callbacks = {
    label: context => {
      const point = context.raw;
      return `${point.customer}: ${numberFmt.format(point.x)} units, ${currency.format(point.y)}`;
    }
  };
  return options;
}

function horizontalOptions() {
  const options = baseOptions();
  options.indexAxis = "y";
  return options;
}

function lineDataset(label, data, color) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: `${color}33`,
    pointBackgroundColor: color,
    pointRadius: 4,
    pointHoverRadius: 7,
    borderWidth: 3,
    tension: 0.34,
    fill: true
  };
}

function barDataset(label, data, color) {
  return {
    label,
    data,
    backgroundColor: `${color}cc`,
    borderColor: color,
    borderWidth: 1,
    borderRadius: 8,
    hoverBackgroundColor: color
  };
}

function scatterDataset(label, data, color) {
  return {
    label,
    data,
    backgroundColor: `${color}cc`,
    borderColor: "#ffffff",
    borderWidth: 1,
    pointRadius: 6,
    pointHoverRadius: 9
  };
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

function avg(rows, key) {
  return rows.length ? sum(rows, key) / rows.length : 0;
}

function maxBy(rows, key) {
  return rows.reduce((best, row) => (row[key] > best[key] ? row : best), rows[0]);
}

function minBy(rows, key) {
  return rows.reduce((best, row) => (row[key] < best[key] ? row : best), rows[0]);
}

function customerLabel(row) {
  if (!row) return "Unknown customer";
  const name = row.customer.replace(/\s+/g, " ");
  return name.length > 24 ? `${name.slice(0, 22)}...` : name;
}

function shortCurrency(value) {
  if (Math.abs(value) >= 10000000) return `Rs ${compactNumberFmt.format(value / 10000000)}Cr`;
  if (Math.abs(value) >= 100000) return `Rs ${compactNumberFmt.format(value / 100000)}L`;
  return currency.format(value);
}

function grouped(rows, getKey) {
  return rows.reduce((map, row) => {
    const key = getKey(row) || "Unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());
}

function groupCount(rows, getKey) {
  const entries = [...grouped(rows, getKey).entries()].map(([label, items]) => ({ label, value: items.length }));
  entries.sort((a, b) => b.value - a.value);
  return { labels: entries.map(item => item.label), values: entries.map(item => item.value) };
}

function groupedSum(rows, getKey, key) {
  const entries = [...grouped(rows, getKey).entries()].map(([label, items]) => ({ label, value: sum(items, key) }));
  entries.sort((a, b) => b.value - a.value);
  return { labels: entries.map(item => item.label), values: entries.map(item => item.value) };
}

function groupedAverage(rows, getKey, key) {
  const entries = [...grouped(rows, getKey).entries()].map(([label, items]) => ({ label, value: avg(items, key) }));
  entries.sort((a, b) => b.value - a.value);
  return { labels: entries.map(item => item.label), values: entries.map(item => item.value) };
}

function topGroup(rows, getKey, key, average = false) {
  const entries = [...grouped(rows, getKey).entries()].map(([label, items]) => ({
    label,
    value: key === "count" ? items.length : (average ? avg(items, key) : sum(items, key))
  }));
  return entries.sort((a, b) => b.value - a.value)[0] || { label: "N/A", value: 0 };
}

function lowestGroupedAverage(rows, getKey, key) {
  const entries = [...grouped(rows.filter(row => row[key] > 0), getKey).entries()].map(([label, items]) => ({
    label,
    value: avg(items, key)
  }));
  return entries.sort((a, b) => a.value - b.value)[0] || { label: "N/A", value: 0 };
}

function monthlyAverage(rows, key) {
  return monthlyAggregate(rows, key, true);
}

function monthlySum(rows, key) {
  return monthlyAggregate(rows, key, false);
}

function monthlyAggregate(rows, key, average) {
  const entries = [...grouped(rows, row => row.month).entries()]
    .filter(([label]) => label !== "Unknown")
    .map(([label, items]) => ({ label, value: average ? avg(items, key) : sum(items, key) }));
  return entries.sort((a, b) => monthOrder.indexOf(a.label) - monthOrder.indexOf(b.label));
}

function bucketize(values, breaks, suffix) {
  const labels = [`<${breaks[0]}${suffix}`];
  for (let i = 0; i < breaks.length - 1; i += 1) labels.push(`${breaks[i]}-${breaks[i + 1]}${suffix}`);
  labels.push(`>${breaks.at(-1)}${suffix}`);
  const counts = Array(labels.length).fill(0);

  values.forEach(value => {
    const index = breaks.findIndex(limit => value < limit);
    counts[index === -1 ? labels.length - 1 : index] += 1;
  });

  return { labels, values: counts };
}

function fastestPaybackBand(rows) {
  const bands = [
    { label: "Low usage (<100 KWH)", min: 0, max: 100 },
    { label: "Medium usage (100-300 KWH)", min: 100, max: 300 },
    { label: "High usage (300-600 KWH)", min: 300, max: 600 },
    { label: "Very high usage (>600 KWH)", min: 600, max: Infinity }
  ];

  const scored = bands.map(band => {
    const bandRows = rows.filter(row => row.monthlyUnits >= band.min && row.monthlyUnits < band.max && row.paybackYears > 0);
    return { label: band.label, value: bandRows.length ? avg(bandRows, "paybackYears") : Infinity };
  }).filter(item => Number.isFinite(item.value));

  return scored.sort((a, b) => a.value - b.value)[0] || { label: "N/A", value: 0 };
}
