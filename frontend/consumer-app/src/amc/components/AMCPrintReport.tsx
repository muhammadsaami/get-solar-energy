import React, { forwardRef, useImperativeHandle } from 'react'
import type { AMCRecommendationResult } from '../types/amc.types'

interface AMCPrintReportProps {
  data: AMCRecommendationResult | null
}

function buildPrintHtml(data: AMCRecommendationResult): string {
  const plan = data.systemStatus === 'Healthy' ? 'Premium Annual' : 'Standard Quarterly'
  const dateStr = new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Annual Maintenance Contract - ${escHtml(data.customerName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #06111f;
      color: #f7fbff;
      margin: 0;
      padding: 40px;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    h1, h2, h3, h4, h5 { font-family: 'Outfit', sans-serif; color: #ffffff; }
    .accent-orange { color: #ff8a1d; }
    .accent-cyan { color: #17a8e5; }
    .page-break { page-break-after: always; }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 25px 0;
    }
    .kpi-card {
      background: rgba(14, 34, 53, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 15px 10px;
      text-align: center;
    }
    .section-block {
      background: rgba(14, 34, 53, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    @media print {
      body { background: #06111f !important; color: #f7fbff !important; }
    }
  </style>
</head>
<body>
  <div style="border: 2px solid rgba(0, 174, 239, 0.4); border-radius: 12px; padding: 60px 40px; text-align: center; min-height: 85vh; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; margin-bottom: 40px;" class="page-break">
    <div>
      <div style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 900; color: #ffffff;">GET Solar Energy</div>
      <div style="font-size: 10px; font-weight: 600; color: #00aeef; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Solar Intelligence Platform</div>
    </div>
    <div style="margin: 60px 0;">
      <h1 style="font-size: 32px; font-weight: 900; color: #ffffff; line-height: 1.2; margin: 0 0 10px 0;">Annual Maintenance Contract Report</h1>
      <div style="width: 100px; height: 4px; background: linear-gradient(90deg, #00aeef, #36d399); margin: 0 auto 20px auto; border-radius: 2px;"></div>
      <span style="background: rgba(54, 211, 153, 0.12); border: 1px solid rgba(54, 211, 153, 0.25); color: #36d399; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 4px 14px; border-radius: 12px;">${escHtml(plan)}</span>
    </div>
    <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; color: #9fb3c8; text-align: left;">
      <div>
        <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9fb3c8; margin-bottom: 3px;">Prepared For</span>
        <strong style="color: #ffffff; font-size: 14px;">${escHtml(data.customerName)}</strong>
        <br>System Size: ${data.systemSizeKw} kW
      </div>
      <div style="text-align: right;">
        <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9fb3c8; margin-bottom: 3px;">AMC Status</span>
        <span style="font-weight: 600; color: #ffffff;">Status: ${escHtml(data.systemStatus)}</span>
        <br>Date: ${dateStr}
        <br>Next Visit: ${data.nextServiceDue || 'N/A'}
      </div>
    </div>
  </div>
  <div>
    <h2 style="font-size: 18px; margin-bottom: 10px;">Maintenance Details & Plan</h2>
    <div class="card-grid">
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">System Health</span>
        <strong style="font-size: 14px; color: #36d399; display: block; margin-top: 4px;">${data.healthScore}%</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Annual O&M Pricing</span>
        <strong style="font-size: 14px; color: #ffffff; display: block; margin-top: 4px;">\u20B9${Number(data.estimatedServiceCostRs).toLocaleString('en-IN')}</strong>
      </div>
      <div class="kpi-card">
        <span style="font-size: 8px; color: #9fb3c8; text-transform: uppercase; display: block;">Generation Loss</span>
        <strong style="font-size: 14px; color: #ff8a1d; display: block; margin-top: 4px;">${data.generationDropPct}%</strong>
      </div>
    </div>
    <div class="section-block">
      <div class="section-title accent-orange">1. Diagnosis Summary</div>
      <p style="font-size: 11px; line-height: 1.5; color: #cbd5e1; margin: 0;">${escHtml(data.diagnosisSummary)}</p>
    </div>
    <div class="section-block">
      <div class="section-title accent-cyan">2. Fault Analysis</div>
      <ul style="font-size: 11px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${data.faultAnalysis.map((f) => `<li>${escHtml(f)}</li>`).join('')}
      </ul>
    </div>
    <div class="section-block">
      <div class="section-title accent-cyan">3. Recommended Actions</div>
      <ul style="font-size: 11px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${data.recommendedActions.map((a) => `<li>${escHtml(a)}</li>`).join('')}
      </ul>
    </div>
    <div class="section-block">
      <div class="section-title accent-orange">4. Preventive Measures</div>
      <ul style="font-size: 11px; line-height: 1.6; color: #cbd5e1; margin: 0; padding-left: 18px;">
        ${data.preventiveMeasures.map((p) => `<li>${escHtml(p)}</li>`).join('')}
      </ul>
    </div>
    <div style="margin-top: 40px; text-align: center; font-size: 9px; color: #475569;">
      Annual Maintenance Contract report generated by GET Solar Intelligence Engine.
    </div>
  </div>
</body>
</html>`
}

function escHtml(s: string): string {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(s))
  return div.innerHTML
}

const AMCPrintReportComponent = forwardRef<{ print: () => void }, AMCPrintReportProps>(
  function AMCPrintReport({ data }, ref) {
    useImperativeHandle(ref, () => ({
      print: () => {
        if (!data) return
        const html = buildPrintHtml(data)
        const printWindow = window.open('', '_blank', 'width=900,height=800')
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 500)
        }
      },
    }))

    return null
  },
)

export const AMCPrintReport = React.memo(AMCPrintReportComponent)
