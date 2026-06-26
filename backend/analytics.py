import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import os

# ── Paths ──────────────────────────────────────────────
INPUT_FILE    = "../ml-models/bills_cleaned.csv"
ANALYTICS_DIR = "../ml-models/analytics"
os.makedirs(ANALYTICS_DIR, exist_ok=True)

# ── 1. Load Data ───────────────────────────────────────
df = pd.read_csv(INPUT_FILE)
print(f"✅ Loaded: {len(df)} rows\n")

# ── 2. Prepare Data ────────────────────────────────────
df["solar_savings_potential"] = (df["monthly_units"] * df["per_unit_rate"] * 0.8).round(0)
df["recommended_kw"]          = (df["monthly_units"] / 135).round(1)
df["system_cost"]             = df["recommended_kw"] * 50000
df["annual_savings"]          = df["solar_savings_potential"] * 12
df["payback_years"]           = (df["system_cost"] / df["annual_savings"]).round(1)
df["savings_25yr"]            = ((df["annual_savings"] * 25) - df["system_cost"]).round(0)

# Consumer segmentation
def segment(units):
    if units < 100:   return "Low (<100)"
    elif units < 300: return "Medium (100-300)"
    elif units < 600: return "High (300-600)"
    else:             return "Very High (>600)"

df["segment"] = df["monthly_units"].apply(segment)
seg_count = df["segment"].value_counts()

# Monthly trend
month_order = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
df["month_short"] = df["billing_period"].apply(lambda x: str(x).strip()[:3].upper())
monthly_avg = df.groupby("month_short")["monthly_units"].mean().round(1)
monthly_avg = monthly_avg.reindex([m for m in month_order if m in monthly_avg.index])

# ── 3. Print Insights ─────────────────────────────────
print("📊 Avg Units per City:")
print(df.groupby("city")["monthly_units"].mean().round(1).to_string())
print("\n📊 Avg Bill per City:")
print(df.groupby("city")["bill_amount"].mean().round(0).to_string())
print("\n📊 Solar Savings Potential per City:")
print(df.groupby("city")["solar_savings_potential"].mean().round(0).to_string())
print()

# ── 4. Dashboard ──────────────────────────────────────
COLORS = ["#F4C430","#2ECC71","#E74C3C","#3498DB","#9B59B6","#1ABC9C"]
BG     = "#0F1117"
CARD   = "#1A1D27"
TEXT   = "#FFFFFF"

fig = plt.figure(figsize=(20, 13), facecolor=BG)

# Logo
logo_path = "../ml-models/analytics/logo.png"
if os.path.exists(logo_path):
    from matplotlib.image import imread
    logo = imread(logo_path)
    ax_logo = fig.add_axes([0.01, 0.915, 0.10, 0.07])
    ax_logo.imshow(logo)
    ax_logo.axis("off")

# Title
fig.text(0.5, 0.965, "Analytics Dashboard",
         ha="center", fontsize=24, fontweight="bold", color=TEXT)
fig.text(0.5, 0.942, "Electricity Consumption & Solar Savings Intelligence — Lucknow Region",
         ha="center", fontsize=10, color="#AAAAAA")

# KPI Cards
kpis = [
    ("Total Bills",       f"{len(df)}",                                    "#F4C430"),
    ("Avg Monthly Units", f"{df['monthly_units'].mean():.0f} KWH",          "#2ECC71"),
    ("Avg Bill Amount",   f"₹{df['bill_amount'].mean():,.0f}",              "#E74C3C"),
    ("Avg Solar Savings", f"₹{df['solar_savings_potential'].mean():,.0f}/mo","#3498DB"),
    ("Avg Payback",       f"{df['payback_years'].mean():.1f} yrs",          "#9B59B6"),
    ("Avg 25yr Savings",  f"₹{df['savings_25yr'].mean()/100000:.1f}L",      "#1ABC9C"),
]
for i, (label, value, color) in enumerate(kpis):
    ax = fig.add_axes([0.02 + i*0.163, 0.855, 0.145, 0.075], facecolor=CARD)
    ax.set_xlim(0,1); ax.set_ylim(0,1); ax.axis("off")
    ax.add_patch(plt.Rectangle((0,0.88),1,0.12,transform=ax.transAxes,color=color,clip_on=False))
    ax.text(0.5,0.55,value,ha="center",va="center",fontsize=14,fontweight="bold",color=color,transform=ax.transAxes)
    ax.text(0.5,0.15,label,ha="center",va="center",fontsize=8.5,color="#AAAAAA",transform=ax.transAxes)

# Chart 1 — Consumer Segmentation
ax1 = fig.add_axes([0.03, 0.46, 0.25, 0.36], facecolor=CARD)
seg_colors = ["#2ECC71","#F4C430","#E74C3C","#3498DB"]
wedges, texts, autotexts = ax1.pie(
    seg_count.values, labels=None, autopct="%1.0f%%",
    colors=seg_colors[:len(seg_count)], startangle=90,
    pctdistance=0.78, wedgeprops=dict(width=0.45, edgecolor=CARD, linewidth=2)
)
for t in autotexts:
    t.set_color(TEXT); t.set_fontsize(10); t.set_fontweight("bold")
ax1.legend([s.split("(")[0].strip() for s in seg_count.index],
           loc="lower center", bbox_to_anchor=(0.5,-0.10),
           ncol=2, fontsize=8, labelcolor=TEXT, facecolor=CARD, edgecolor="none")
ax1.set_title("Consumer Segmentation", color=TEXT, fontsize=12, fontweight="bold", pad=12)

# Chart 2 — Monthly Trend
ax2 = fig.add_axes([0.32, 0.46, 0.34, 0.36], facecolor=CARD)
ax2.plot(range(len(monthly_avg)), monthly_avg.values, color="#F4C430",
         linewidth=2.5, marker="o", markersize=8,
         markerfacecolor="#F4C430", markeredgecolor=CARD, markeredgewidth=2)
ax2.fill_between(range(len(monthly_avg)), monthly_avg.values, alpha=0.15, color="#F4C430")
for i, (x, y) in enumerate(zip(range(len(monthly_avg)), monthly_avg.values)):
    ax2.text(x, y+18, f"{y:.0f}", ha="center", fontsize=8, color="#F4C430")
ax2.set_xticks(range(len(monthly_avg)))
ax2.set_xticklabels(monthly_avg.index, color=TEXT, fontsize=9)
ax2.tick_params(colors=TEXT)
ax2.set_facecolor(CARD)
ax2.set_title("Monthly Consumption Trend (KWH)", color=TEXT, fontsize=12, fontweight="bold")
ax2.set_ylabel("Avg Units (KWH)", color=TEXT)
ax2.grid(True, alpha=0.2, linestyle="--")
for spine in ax2.spines.values(): spine.set_edgecolor("#333333")

# Chart 3 — Bill Distribution
ax3 = fig.add_axes([0.70, 0.46, 0.27, 0.36], facecolor=CARD)
bins = [0,500,1000,2000,3000,5000,15000]
labels_hist = ["<500","500-1K","1K-2K","2K-3K","3K-5K",">5K"]
counts = pd.cut(df["bill_amount"], bins=bins).value_counts().sort_index()
bars3 = ax3.bar(labels_hist[:len(counts)], counts.values,
                color=COLORS[:len(counts)], edgecolor=CARD, linewidth=1.5, width=0.6)
for bar, val in zip(bars3, counts.values):
    if val > 0:
        ax3.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.05,
                 str(int(val)), ha="center", va="bottom", color=TEXT, fontsize=11, fontweight="bold")
ax3.set_facecolor(CARD)
ax3.set_title("Bill Amount Distribution (₹)", color=TEXT, fontsize=12, fontweight="bold")
ax3.set_ylabel("No. of Bills", color=TEXT)
ax3.tick_params(colors=TEXT, axis="x", labelsize=9)
ax3.tick_params(colors=TEXT, axis="y")
for spine in ax3.spines.values(): spine.set_edgecolor("#333333")

# Chart 4 — Solar Savings Scatter
ax4 = fig.add_axes([0.03, 0.06, 0.25, 0.34], facecolor=CARD)
ax4.scatter(df["monthly_units"], df["solar_savings_potential"],
            c=df["solar_savings_potential"], cmap="YlGn",
            s=150, edgecolors=CARD, linewidth=1.5, zorder=3)
ax4.set_facecolor(CARD)
ax4.set_title("Solar Savings vs Units", color=TEXT, fontsize=12, fontweight="bold")
ax4.set_xlabel("Monthly Units (KWH)", color=TEXT, fontsize=9)
ax4.set_ylabel("Monthly Savings (₹)", color=TEXT, fontsize=9)
ax4.tick_params(colors=TEXT)
ax4.grid(True, alpha=0.2, linestyle="--")
for spine in ax4.spines.values(): spine.set_edgecolor("#333333")

# Chart 5 — Payback Distribution
ax5 = fig.add_axes([0.34, 0.06, 0.30, 0.34], facecolor=CARD)
payback_data = df["payback_years"].dropna()
payback_data = payback_data[payback_data > 0]
ax5.hist(payback_data, bins=6, color="#9B59B6", edgecolor=CARD, linewidth=1.5)
ax5.axvline(payback_data.mean(), color="#F4C430", linestyle="--",
            linewidth=2, label=f"Avg: {payback_data.mean():.1f} yrs")
ax5.legend(facecolor=CARD, labelcolor=TEXT, edgecolor="none", fontsize=9)
ax5.set_facecolor(CARD)
ax5.set_title("Payback Period Distribution", color=TEXT, fontsize=12, fontweight="bold")
ax5.set_xlabel("Years", color=TEXT, fontsize=9)
ax5.set_ylabel("No. of Consumers", color=TEXT, fontsize=9)
ax5.tick_params(colors=TEXT)
ax5.grid(True, alpha=0.2, linestyle="--")
for spine in ax5.spines.values(): spine.set_edgecolor("#333333")

# Chart 6 — Top Consumers
ax6 = fig.add_axes([0.68, 0.06, 0.29, 0.34], facecolor=CARD)
top = df.nlargest(6, "solar_savings_potential")[["customer_name","solar_savings_potential"]].copy()
top["short_name"] = top["customer_name"].apply(lambda x: str(x).split()[0].title()[:10])
bars6 = ax6.barh(range(len(top)), top["solar_savings_potential"],
                 color="#1ABC9C", edgecolor=CARD, linewidth=1.5, height=0.6)
ax6.set_yticks(range(len(top)))
ax6.set_yticklabels(top["short_name"], color=TEXT, fontsize=9)
for bar, val in zip(bars6, top["solar_savings_potential"]):
    ax6.text(bar.get_width()+80, bar.get_y()+bar.get_height()/2,
             f"₹{val:,.0f}", va="center", color=TEXT, fontsize=9)
ax6.set_facecolor(CARD)
ax6.set_title("Top Consumers by Solar Savings", color=TEXT, fontsize=12, fontweight="bold")
ax6.set_xlabel("Monthly Savings (₹)", color=TEXT, fontsize=9)
ax6.tick_params(colors=TEXT)
ax6.set_xlim(0, top["solar_savings_potential"].max()*1.3)
ax6.grid(True, alpha=0.2, linestyle="--", axis="x")
for spine in ax6.spines.values(): spine.set_edgecolor("#333333")

# Footer
fig.text(0.5, 0.01,
         "GET Solar Energy | Data Science Team | Lucknow, UP | India's Solar Intelligence & Service Ecosystem",
         ha="center", fontsize=8, color="#555555")

# Save
chart_path = os.path.join(ANALYTICS_DIR, "analytics_dashboard.png")
plt.savefig(chart_path, dpi=150, bbox_inches="tight", facecolor=BG)
print(f"✅ Dashboard saved: {chart_path}")

report_path = os.path.join(ANALYTICS_DIR, "analytics_report.csv")
df.to_csv(report_path, index=False)
print(f"✅ Report saved: {report_path}")
print("\n🎉 Task 5 Complete!")