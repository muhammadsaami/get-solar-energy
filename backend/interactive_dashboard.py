import pandas as pd
import json
import os

INPUT_FILE    = "../ml-models/bills_cleaned.csv"
ANALYTICS_DIR = "../ml-models/analytics"
os.makedirs(ANALYTICS_DIR, exist_ok=True)

df = pd.read_csv(INPUT_FILE)

# Prepare data
df["solar_savings_potential"] = (df["monthly_units"] * df["per_unit_rate"] * 0.8).round(0)
df["recommended_kw"]          = (df["monthly_units"] / 135).round(1)
df["system_cost"]             = df["recommended_kw"] * 50000
df["annual_savings"]          = df["solar_savings_potential"] * 12
df["payback_years"]           = (df["system_cost"] / df["annual_savings"]).round(1)
df["savings_25yr"]            = ((df["annual_savings"] * 25) - df["system_cost"]).round(0)
df["month_short"]             = df["billing_period"].apply(lambda x: str(x).strip()[:3].upper())

def segment(units):
    if units < 100:   return "Low (<100)"
    elif units < 300: return "Medium (100-300)"
    elif units < 600: return "High (300-600)"
    else:             return "Very High (>600)"
df["segment"] = df["monthly_units"].apply(segment)

month_order = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
monthly_avg = df.groupby("month_short")["monthly_units"].mean().round(1)
monthly_avg = monthly_avg.reindex([m for m in month_order if m in monthly_avg.index])

seg_count = df["segment"].value_counts()

bins   = [0,500,1000,2000,3000,5000,15000]
labels = ["<500","500-1K","1K-2K","2K-3K","3K-5K",">5K"]
df["bill_range"] = pd.cut(df["bill_amount"], bins=bins, labels=labels)
bill_dist = df["bill_range"].value_counts().sort_index()

top = df.nlargest(6,"solar_savings_potential")[["customer_name","solar_savings_potential"]].copy()
top["short_name"] = top["customer_name"].apply(lambda x: str(x).split()[0].title())

payback_vals = [float(v) for v in df["payback_years"].dropna() if v > 0]

# JSON data
data = {
    "kpis": {
        "Total Bills":       str(len(df)),
        "Avg Monthly Units": f"{df['monthly_units'].mean():.0f} KWH",
        "Avg Bill Amount":   f"₹{df['bill_amount'].mean():,.0f}",
        "Avg Solar Savings": f"₹{df['solar_savings_potential'].mean():,.0f}/mo",
        "Avg Payback":       f"{df['payback_years'].mean():.1f} yrs",
        "Avg 25yr Savings":  f"₹{df['savings_25yr'].mean()/100000:.1f}L",
    },
    "seg_labels":      list(seg_count.index),
    "seg_values":      [int(v) for v in seg_count.values],
    "monthly_labels":  list(monthly_avg.index),
    "monthly_values":  [float(v) for v in monthly_avg.values],
    "bill_labels":     [str(l) for l in bill_dist.index],
    "bill_values":     [int(v) for v in bill_dist.values],
    "top_names":       list(top["short_name"]),
    "top_savings":     [float(v) for v in top["solar_savings_potential"]],
    "scatter": [
        {"x": float(u), "y": float(s), "name": str(n).split()[0]}
        for u, s, n in zip(
            df["monthly_units"],
            df["solar_savings_potential"],
            df["customer_name"]
        )
    ],
    "payback_vals": payback_vals,
}

data_json = json.dumps(data, ensure_ascii=False)
kpi_colors = ["#F4C430","#2ECC71","#E74C3C","#3498DB","#9B59B6","#1ABC9C"]

kpi_cards_html = ""
for i, (k, v) in enumerate(data["kpis"].items()):
    c = kpi_colors[i]
    kpi_cards_html += f"""
    <div class="kpi-card" style="--c:{c}">
      <div class="kpi-val">{v}</div>
      <div class="kpi-label">{k}</div>
    </div>"""

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GET Solar Energy — Analytics Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ background:#0F1117; color:#fff; font-family:'Segoe UI',sans-serif; padding:20px; }}
  .header {{ display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:6px; }}
  .header img {{ height:56px; }}
  .header-text h1 {{ font-size:26px; font-weight:700; color:#fff; }}
  .header-text p  {{ font-size:12px; color:#aaa; margin-top:2px; }}
  .kpi-row {{ display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin:18px 0; }}
  .kpi-card {{
    background:#1A1D27; border-radius:10px; padding:14px 10px 10px;
    text-align:center; position:relative; overflow:hidden;
    transition:transform .2s; cursor:default; border-top:4px solid var(--c);
  }}
  .kpi-card:hover {{ transform:translateY(-4px); }}
  .kpi-val   {{ font-size:20px; font-weight:700; color:var(--c); margin-bottom:4px; }}
  .kpi-label {{ font-size:11px; color:#aaa; }}
  .charts-grid  {{ display:grid; grid-template-columns:1fr 1.4fr 1fr; gap:14px; margin-bottom:14px; }}
  .charts-grid2 {{ display:grid; grid-template-columns:1fr 1.2fr 1fr; gap:14px; }}
  .chart-card {{
    background:#1A1D27; border-radius:12px; padding:16px;
    transition:box-shadow .2s;
  }}
  .chart-card:hover {{ box-shadow:0 0 20px rgba(255,255,255,0.06); }}
  .chart-title {{ font-size:13px; font-weight:600; color:#ddd; margin-bottom:12px; text-align:center; }}
  canvas {{ width:100% !important; height:220px !important; }}
  .footer {{ text-align:center; margin-top:18px; font-size:11px; color:#444; }}
</style>
</head>
<body>

<div class="header">
  <img src="logo.png" alt="logo" onerror="this.style.display='none'">
  <div class="header-text">
    <h1>Analytics Dashboard</h1>
    <p>Electricity Consumption & Solar Savings Intelligence — Lucknow Region</p>
  </div>
</div>

<div class="kpi-row">{kpi_cards_html}</div>

<div class="charts-grid">
  <div class="chart-card"><div class="chart-title">Consumer Segmentation</div><canvas id="segChart"></canvas></div>
  <div class="chart-card"><div class="chart-title">Monthly Consumption Trend (KWH)</div><canvas id="trendChart"></canvas></div>
  <div class="chart-card"><div class="chart-title">Bill Amount Distribution (₹)</div><canvas id="billChart"></canvas></div>
</div>

<div class="charts-grid2">
  <div class="chart-card"><div class="chart-title">Solar Savings vs Units Consumed</div><canvas id="scatterChart"></canvas></div>
  <div class="chart-card"><div class="chart-title">Payback Period Distribution</div><canvas id="paybackChart"></canvas></div>
  <div class="chart-card"><div class="chart-title">Top Consumers by Solar Savings</div><canvas id="topChart"></canvas></div>
</div>

<div class="footer">
  GET Solar Energy &nbsp;|&nbsp; Data Science Team &nbsp;|&nbsp; Lucknow, UP &nbsp;|&nbsp;
  India's Solar Intelligence & Service Ecosystem
</div>

<script>
const D = {data_json};
const COLORS = ["#F4C430","#2ECC71","#E74C3C","#3498DB","#9B59B6","#1ABC9C","#E67E22"];
const grid   = "rgba(255,255,255,0.07)";
const tick   = "#aaa";
const base   = {{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {{ legend: {{ labels: {{ color: tick }} }} }},
  scales: {{
    x: {{ ticks: {{ color: tick }}, grid: {{ color: grid }} }},
    y: {{ ticks: {{ color: tick }}, grid: {{ color: grid }} }}
  }}
}};

// 1 Donut
new Chart(document.getElementById("segChart"), {{
  type: "doughnut",
  data: {{
    labels: D.seg_labels,
    datasets: [{{ data: D.seg_values, backgroundColor: COLORS,
      borderColor: "#0F1117", borderWidth: 3, hoverOffset: 8 }}]
  }},
  options: {{
    responsive: true, maintainAspectRatio: false, cutout: "55%",
    plugins: {{
      legend: {{ position: "bottom", labels: {{ color: tick, font: {{ size: 10 }}, padding: 10 }} }},
      tooltip: {{ callbacks: {{ label: ctx => " " + ctx.label + ": " + ctx.raw + " bills" }} }}
    }}
  }}
}});

// 2 Line
new Chart(document.getElementById("trendChart"), {{
  type: "line",
  data: {{
    labels: D.monthly_labels,
    datasets: [{{
      label: "Avg Units (KWH)", data: D.monthly_values,
      borderColor: "#F4C430", backgroundColor: "rgba(244,196,48,0.12)",
      pointBackgroundColor: "#F4C430", pointRadius: 6,
      pointHoverRadius: 9, fill: true, tension: 0.3
    }}]
  }},
  options: {{ ...base, plugins: {{ legend: {{ display: false }},
    tooltip: {{ callbacks: {{ label: ctx => " " + ctx.raw + " KWH" }} }} }} }}
}});

// 3 Bar
new Chart(document.getElementById("billChart"), {{
  type: "bar",
  data: {{
    labels: D.bill_labels,
    datasets: [{{ label: "Bills", data: D.bill_values,
      backgroundColor: COLORS, borderRadius: 6, borderSkipped: false }}]
  }},
  options: {{ ...base, plugins: {{ legend: {{ display: false }},
    tooltip: {{ callbacks: {{ label: ctx => " " + ctx.raw + " bills" }} }} }} }}
}});

// 4 Scatter
new Chart(document.getElementById("scatterChart"), {{
  type: "scatter",
  data: {{
    datasets: [{{
      label: "Consumers",
      data: D.scatter.map(p => ({{ x: p.x, y: p.y }})),
      backgroundColor: "rgba(26,188,156,0.75)",
      pointRadius: 8, pointHoverRadius: 11,
      borderColor: "#1ABC9C", borderWidth: 1
    }}]
  }},
  options: {{ ...base,
    plugins: {{ legend: {{ display: false }},
      tooltip: {{ callbacks: {{ label: ctx => " " + ctx.parsed.x + " KWH → ₹" + ctx.parsed.y + "/mo" }} }} }},
    scales: {{
      x: {{ title: {{ display: true, text: "Monthly Units (KWH)", color: tick }},
           ticks: {{ color: tick }}, grid: {{ color: grid }} }},
      y: {{ title: {{ display: true, text: "Monthly Savings (₹)", color: tick }},
           ticks: {{ color: tick }}, grid: {{ color: grid }} }}
    }}
  }}
}});

// 5 Payback Histogram
const pbBins   = [0,2,3,4,5,6,7,10];
const pbLabels = ["0-2","2-3","3-4","4-5","5-6","6-7","7+"];
const pbCounts = new Array(pbLabels.length).fill(0);
D.payback_vals.forEach(v => {{
  for (let i = 0; i < pbBins.length - 1; i++) {{
    if (v >= pbBins[i] && v < pbBins[i+1]) {{ pbCounts[i]++; break; }}
  }}
}});
new Chart(document.getElementById("paybackChart"), {{
  type: "bar",
  data: {{
    labels: pbLabels,
    datasets: [{{ label: "Consumers", data: pbCounts,
      backgroundColor: "#9B59B6", borderRadius: 6, borderSkipped: false }}]
  }},
  options: {{ ...base,
    plugins: {{ legend: {{ display: false }},
      tooltip: {{ callbacks: {{ label: ctx => " " + ctx.raw + " consumers" }} }} }},
    scales: {{
      x: {{ title: {{ display: true, text: "Years", color: tick }},
           ticks: {{ color: tick }}, grid: {{ color: grid }} }},
      y: {{ ticks: {{ color: tick }}, grid: {{ color: grid }} }}
    }}
  }}
}});

// 6 Horizontal Bar
new Chart(document.getElementById("topChart"), {{
  type: "bar",
  data: {{
    labels: D.top_names,
    datasets: [{{ label: "Monthly Savings (₹)", data: D.top_savings,
      backgroundColor: COLORS, borderRadius: 6, borderSkipped: false }}]
  }},
  options: {{ ...base, indexAxis: "y",
    plugins: {{ legend: {{ display: false }},
      tooltip: {{ callbacks: {{ label: ctx => " ₹" + ctx.raw.toLocaleString() + "/mo" }} }} }},
    scales: {{
      x: {{ title: {{ display: true, text: "Monthly Savings (₹)", color: tick }},
           ticks: {{ color: tick }}, grid: {{ color: grid }} }},
      y: {{ ticks: {{ color: tick }}, grid: {{ color: grid }} }}
    }}
  }}
}});
</script>
</body>
</html>"""

output_path = os.path.join(ANALYTICS_DIR, "dashboard.html")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"✅ Interactive dashboard saved!")
print(f"   Open: {os.path.abspath(output_path)}")