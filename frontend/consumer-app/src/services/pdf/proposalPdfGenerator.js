import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Loads the official canonical dark-theme logo as a Base64 data URL.
 */
async function loadOfficialLogoBase64(customLogo = null) {
  if (customLogo) return customLogo;
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        return resolve(null);
      }
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, 300);

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 833;
          canvas.height = img.naturalHeight || img.height || 132;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      };
      img.src = '/assets/logo.png';
    } catch {
      resolve(null);
    }
  });
}

/**
 * Formats a currency value into Indian Rupee notation (e.g. ₹1,80,000).
 */
export function formatCurrency(val) {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
    return '—';
  }
  const num = Math.round(Number(val));
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Safely returns a formatted string or fallback '—'.
 */
export function safeValue(val, suffix = '') {
  if (val === null || val === undefined || val === '' || val === '—') {
    return '—';
  }
  return `${val}${suffix}`;
}

/**
 * Generates and downloads an enterprise-grade, structured PDF Solar Proposal.
 *
 * @param {Object} params
 * @param {Object} params.form - Customer and input form parameters
 * @param {Object} params.insights - Calculated solar & financial metrics
 * @param {Object} [params.proposal] - Full backend proposal model if available
 * @param {string} [params.version] - Proposal version string
 * @param {string} [params.logoBase64] - Optional base64 data URL for the logo
 * @returns {Promise<Blob>} The generated PDF Blob
 */
export async function generateProposalPdf({ form = {}, insights = {}, proposal = null, version = 'v1.0', logoBase64 = null }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
  });

  const logoData = await loadOfficialLogoBase64(logoBase64);
  const proposalId = proposal?.id || proposal?.proposal_id || `GSE-PROP-${Date.now().toString().slice(-6)}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Brand Palette
  const colors = {
    navyBg: [6, 15, 31],
    navyCard: [8, 24, 42],
    primaryNavy: [10, 37, 64],
    primaryBlue: [23, 168, 229],
    accentOrange: [255, 138, 29],
    accentGreen: [16, 185, 129],
    darkText: [15, 23, 42],
    secondaryText: [71, 85, 105],
    mutedText: [148, 163, 184],
    lightBg: [248, 250, 252],
    borderGray: [226, 232, 240],
    white: [255, 255, 255],
  };

  let currentY = margin;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: HEADER & BRANDING
  // ═══════════════════════════════════════════════════════════════════════════
  // Header Banner Card
  doc.setFillColor(...colors.navyBg);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'F');

  if (logoData) {
    try {
      // Natural logo aspect ratio: 833 / 132 ≈ 6.31
      const logoH = 14;
      const logoW = logoH * 6.31;
      doc.addImage(logoData, 'PNG', margin + 6, currentY + 9, logoW, logoH);
    } catch {
      // Typographic fallback
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('GET SOLAR ENERGY', margin + 6, currentY + 14);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.primaryBlue);
      doc.text("INDIA'S SOLAR INTELLIGENCE & SERVICE ECOSYSTEM", margin + 6, currentY + 22);
    }
  } else {
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GET SOLAR ENERGY', margin + 6, currentY + 14);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.primaryBlue);
    doc.text("INDIA'S SOLAR INTELLIGENCE & SERVICE ECOSYSTEM", margin + 6, currentY + 22);
  }

  // Right Header Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.accentOrange);
  doc.text('AI-OPTIMIZED SOLAR PROPOSAL', pageWidth - margin - 6, currentY + 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.mutedText);
  doc.text(`Proposal ID: ${proposalId}`, pageWidth - margin - 6, currentY + 17, { align: 'right' });
  doc.text(`Date: ${currentDate} | Version: ${version}`, pageWidth - margin - 6, currentY + 22, { align: 'right' });

  currentY += 36;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('Executive Summary', margin, currentY);
  currentY += 5;

  const customerName = form.customerName || 'Valued Homeowner';
  const customerCity = form.city || 'your region';
  const kwSize = insights.kw ? `${insights.kw} kWp` : (form.recommendedKw ? `${form.recommendedKw} kWp` : '—');
  const billAmount = form.monthlyBill ? `₹${parseFloat(form.monthlyBill).toLocaleString('en-IN')}` : '—';
  const annualKwh = insights.annualGen ? `${Math.round(insights.annualGen).toLocaleString('en-IN')} kWh` : '—';
  const subsidyAmount = formatCurrency(insights.subsidy);
  const netOutlay = formatCurrency(insights.netCost);

  const summaryText = `This customized engineering proposal has been developed for ${customerName} located in ${customerCity}. Based on your monthly grid electricity expenditure of ${billAmount} (${safeValue(form.monthlyUnits, ' kWh')}), we recommend an optimized ${kwSize} On-Grid Rooftop Solar Power Plant. Under standard meteorological conditions, the proposed system is estimated to generate approximately ${annualKwh} of clean electricity annually. Under the Ministry of New and Renewable Energy (MNRE) PM Surya Ghar: Muft Bijli Yojana, this installation qualifies for an upfront direct government subsidy of ${subsidyAmount}, resulting in a net customer investment outlay of ${netOutlay}.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.darkText);
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, currentY);
  currentY += splitSummary.length * 4.2 + 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: KEY HIGHLIGHT KPI METRIC TILES
  // ═══════════════════════════════════════════════════════════════════════════
  const cardW = (contentWidth - 9) / 4;
  const cardH = 18;
  const kpis = [
    { label: 'Recommended System', value: kwSize, sub: `${safeValue(insights.panels, ' Panels')}`, color: colors.primaryBlue },
    { label: 'PM Surya Ghar Subsidy', value: subsidyAmount, sub: 'Direct Govt Benefit', color: colors.accentGreen },
    { label: 'Net Capital Outlay', value: netOutlay, sub: 'After MNRE Subsidy', color: colors.accentOrange },
    { label: 'Estimated Payback', value: safeValue(insights.payback, ' Yrs'), sub: `Life: ${formatCurrency(insights.lifetimeSavings)}`, color: colors.primaryBlue },
  ];

  kpis.forEach((kpi, idx) => {
    const cx = margin + idx * (cardW + 3);
    doc.setFillColor(...colors.lightBg);
    doc.setDrawColor(...colors.borderGray);
    doc.roundedRect(cx, currentY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.secondaryText);
    doc.text(kpi.label.toUpperCase(), cx + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, cx + 3, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.mutedText);
    doc.text(kpi.sub, cx + 3, currentY + 15);
  });

  currentY += cardH + 7;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: CUSTOMER & SITE SPECIFICATIONS TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('1. Customer & Site Specifications', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Parameter', 'Detail / Value', 'Parameter', 'Detail / Value']],
    body: [
      ['Customer Name', safeValue(form.customerName), 'Phone Number', safeValue(form.phone)],
      ['Email Address', safeValue(form.email), 'Installation City', safeValue(form.city)],
      ['Site Address', safeValue(form.address), 'Usable Roof Area', safeValue(form.roofArea, ' sq ft')],
      [
        '6-Mo Avg Monthly Bill',
        formatCurrency(form.monthlyBill || insights.avgMonthlyBill),
        'Peak Consumption Month',
        insights.highestConsumptionMonth ? `${insights.highestConsumptionMonth.month} (${insights.highestConsumptionMonth.units} kWh)` : safeValue(form.monthlyUnits, ' kWh')
      ],
      ['Grid Electricity Tariff', safeValue(form.electricityRate ? `₹${form.electricityRate}/kWh` : null), 'DISCOM Connection Type', 'Single/Three-Phase Net Meter'],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, textColor: colors.darkText },
    headStyles: { fillColor: colors.primaryNavy, textColor: colors.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: colors.lightBg },
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: SYSTEM SIZING & TECHNICAL BILL OF MATERIALS (BOM)
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('2. Technical Bill of Materials (BOM) & Equipment Specifications', margin, currentY);
  currentY += 3;

  const bomRows = [
    ['Solar PV Modules', form.panelType || '540W Mono PERC Tier-1 High Efficiency', safeValue(insights.panels, ' Units'), '25-Year Linear Output Guarantee (84.8%)'],
    ['On-Grid Solar Inverter', form.inverterType || '5 kW 3-Phase MPPT String Inverter', '1 Unit', '10-Year Replacement Warranty (WiFi Enabled)'],
    ['Mounting Structure', 'Hot-Dip Galvanized Iron (HDG) / Elevated Structure (150 km/h rated)', '1 Complete Set', '15-Year Anti-Corrosion Structural Warranty'],
    ['AC/DC Distribution & SPDs', 'IP65 Outer Enclosure with Type-2 Surge Protection, DC Isolator & MCBs', '2 Sets (AC + DC)', '5-Year Manufacturing Warranty'],
    ['Bi-Directional Net Meter', 'DISCOM-Approved Smart Bi-Directional Meter with Remote Telemetry', '1 Unit', '5-Year Utility Compliance Guarantee'],
    ['Earthing & Safety Kit', 'Dual Chemical Earthing Electrodes with Copper Bonded Lightning Arrester', '1 Set', 'MNRE Standard IS 3043 / IS 2309 Compliant'],
    ['Energy Storage / Battery', safeValue(form.batteryOption, ''), 'N/A (Grid-Tied)', 'Net-Metering Grid Synchronization'],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Equipment Category', 'Technical Specification', 'Quantity', 'Warranty & Standards']],
    body: bomRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, textColor: colors.darkText },
    headStyles: { fillColor: colors.primaryNavy, textColor: colors.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: colors.lightBg },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 68 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 46 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: FINANCIAL BREAKDOWN & GOVERNMENT SUBSIDY
  // ═══════════════════════════════════════════════════════════════════════════
  // Check if we need a page break before financial tables
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('3. Financial Breakdown & PM Surya Ghar Subsidy Schedule', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Financial Parameter', 'Amount / Value', 'Benchmark Reference & Policy Notes']],
    body: [
      ['Estimated Gross Turnkey System Cost', formatCurrency(insights.systemCost), 'Includes Tier-1 Hardware, Mounting, Structural Civil Work & Commissioning'],
      ['PM Surya Ghar: Muft Bijli Yojana Subsidy', formatCurrency(insights.subsidy), 'Direct DBT subsidy credited to customer bank account post-inspection'],
      ['Net Customer Investment Outlay', formatCurrency(insights.netCost), 'Effective net capital expenditure after government subsidy'],
      ['Estimated Monthly Electricity Savings', formatCurrency(insights.monthlySavings), 'Based on average monthly generation offset against local grid tariff'],
      ['Estimated Annual Electricity Savings', formatCurrency(insights.annualSavings), 'Annual financial savings resulting from solar self-consumption & export'],
      ['Estimated Payback Period', safeValue(insights.payback, ' Years'), 'Estimated duration to recover initial net capital investment'],
      ['25-Year Cumulative Net Savings', formatCurrency(insights.lifetimeSavings), 'Net financial yield over 25 operational years accounting for degradation'],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, textColor: colors.darkText },
    headStyles: { fillColor: colors.primaryNavy, textColor: colors.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: colors.lightBg },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65 },
      1: { cellWidth: 35, fontStyle: 'bold', textColor: colors.primaryNavy, halign: 'right' },
      2: { cellWidth: 82, fontSize: 7.5, textColor: colors.secondaryText },
    },
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: 12-MONTH GENERATION & ENVIRONMENTAL IMPACT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('4. Simulated 12-Month Generation & Environmental Impact', margin, currentY);
  currentY += 3;

  const monthlyData = (insights.monthlyCurve || [
    { month: 'Jan', gen: 428, savings: 3420 },
    { month: 'Feb', gen: 473, savings: 3780 },
    { month: 'Mar', gen: 540, savings: 4320 },
    { month: 'Apr', gen: 563, savings: 4500 },
    { month: 'May', gen: 585, savings: 4680 },
    { month: 'Jun', gen: 495, savings: 3960 },
    { month: 'Jul', gen: 338, savings: 2700 },
    { month: 'Aug', gen: 315, savings: 2520 },
    { month: 'Sep', gen: 383, savings: 3060 },
    { month: 'Oct', gen: 473, savings: 3780 },
    { month: 'Nov', gen: 428, savings: 3420 },
    { month: 'Dec', gen: 405, savings: 3240 },
  ]);

  // Split months into 2 columns for clean layout
  const tableRows = [];
  for (let i = 0; i < 6; i++) {
    const left = monthlyData[i];
    const right = monthlyData[i + 6];
    tableRows.push([
      left?.month || '—',
      safeValue(left?.gen, ' kWh'),
      formatCurrency(left?.savings),
      right?.month || '—',
      safeValue(right?.gen, ' kWh'),
      formatCurrency(right?.savings),
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Month', 'Est. Gen (kWh)', 'Est. Savings', 'Month', 'Est. Gen (kWh)', 'Est. Savings']],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: colors.darkText },
    headStyles: { fillColor: colors.primaryNavy, textColor: colors.white, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: colors.lightBg },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center' },
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold', textColor: colors.accentGreen },
      3: { fontStyle: 'bold', halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold', textColor: colors.accentGreen },
    },
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // Environmental Impact Callout Strip
  doc.setFillColor(...colors.lightBg);
  doc.setDrawColor(...colors.borderGray);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.accentGreen);
  doc.text('ENVIRONMENTAL OFFSET:', margin + 4, currentY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.darkText);
  const envText = `Annual Carbon Reduction: ${safeValue(insights.co2, ' Metric Tons of CO2')}  |  Equivalent to planting ${safeValue(insights.trees, ' Trees/Year')}`;
  doc.text(envText, margin + 46, currentY + 7.5);

  currentY += 18;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: TURNKEY EXECUTION & INSTALLATION TIMELINE
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('5. Turnkey Project Execution & Milestone Timeline', margin, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Stage', 'Milestone Description', 'Estimated Timeline', 'Standard Deliverable']],
    body: [
      ['Stage 1', 'Engineering Site Assessment & 3D Shadow Analysis', 'Days 1 – 2', 'Structural & Electrical CAD Layouts'],
      ['Stage 2', 'DISCOM Net-Metering Application & Approvals', 'Days 3 – 5', 'Formal Utility Feasibility Sanction'],
      ['Stage 3', 'Procurement & Hardware Dispatch to Site', 'Days 6 – 8', 'Tier-1 Solar PV Modules, Inverter & Structure'],
      ['Stage 4', 'Mounting, Mechanical Assembly & AC/DC Cabling', 'Days 9 – 10', 'IS 732 Earthing & Protection Integration'],
      ['Stage 5', 'Pre-Commissioning Quality & Safety Inspection', 'Day 11', 'Multi-point QA & Performance String Testing'],
      ['Stage 6', 'Net-Meter Installation, Grid Sync & Handover', 'Days 12 – 14', 'Commissioning Certificate & Mobile App Sync'],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: colors.darkText },
    headStyles: { fillColor: colors.primaryNavy, textColor: colors.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: colors.lightBg },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 72 },
      2: { cellWidth: 32, fontStyle: 'bold', textColor: colors.primaryBlue },
      3: { cellWidth: 58 },
    },
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9: COMMERCIAL TERMS & ASSUMPTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('6. Commercial Terms & Standard Assumptions', margin, currentY);
  currentY += 4;

  const terms = [
    '• System performance estimations assume unshaded rooftop conditions with orientation aligned to local optimal azimuth.',
    '• Solar PV panels include a 10-year product warranty and 25-year linear performance warranty guaranteeing >= 84.8% output.',
    '• Government subsidy disbursement is subject to MNRE national portal guidelines and local DISCOM inspection compliance.',
    '• Milestone payment terms: 10% on proposal approval, 70% upon equipment dispatch, 20% post-commissioning net-meter sync.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.secondaryText);
  terms.forEach(t => {
    doc.text(t, margin, currentY);
    currentY += 4;
  });

  currentY += 4;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 10: APPROVAL & SIGNATURE SECTION
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('7. Authorization & Proposal Acceptance', margin, currentY);
  currentY += 4;

  const sigBoxW = (contentWidth - 8) / 2;
  const sigBoxH = 30;

  // Customer Signature Box
  doc.setFillColor(...colors.lightBg);
  doc.setDrawColor(...colors.borderGray);
  doc.roundedRect(margin, currentY, sigBoxW, sigBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('CUSTOMER ACCEPTANCE', margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.darkText);
  doc.text(`Customer Name: ${customerName}`, margin + 4, currentY + 11);
  doc.text('Signature: _________________________________', margin + 4, currentY + 18);
  doc.text(`Date: ${currentDate}`, margin + 4, currentY + 25);

  // Representative Signature Box
  const rx = margin + sigBoxW + 8;
  doc.setFillColor(...colors.lightBg);
  doc.setDrawColor(...colors.borderGray);
  doc.roundedRect(rx, currentY, sigBoxW, sigBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('GET SOLAR ENERGY REPRESENTATIVE', rx + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.darkText);
  doc.text('Authorized Engineer: Senior Technical Advisor', rx + 4, currentY + 11);
  doc.text('Signature: _________________________________', rx + 4, currentY + 18);
  doc.text(`Date: ${currentDate}`, rx + 4, currentY + 25);

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 11: RUNNING FOOTER & PAGE NUMBERS (APPLIED TO ALL PAGES)
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Running Header on pages 2+
    if (p > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...colors.mutedText);
      doc.text('GET SOLAR ENERGY  |  AI-Optimized Solar Engineering Proposal', margin, 9);
      doc.text(`Proposal ID: ${proposalId}`, pageWidth - margin, 9, { align: 'right' });
      doc.setDrawColor(...colors.borderGray);
      doc.setLineWidth(0.3);
      doc.line(margin, 11, pageWidth - margin, 11);
    }

    // Running Footer on all pages
    const footerY = pageHeight - 8;
    doc.setDrawColor(...colors.borderGray);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...colors.primaryNavy);
    doc.text('GET SOLAR ENERGY', margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.secondaryText);
    doc.text(" • INDIA'S SOLAR INTELLIGENCE & SERVICE ECOSYSTEM", margin + 28, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.mutedText);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  // Filename formatting
  const sanitizedName = (form.customerName || 'Solar_Proposal').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `GET-Solar-Energy-Proposal-${sanitizedName}-${proposalId}.pdf`;

  // Download PDF directly
  try {
    if (typeof doc.save === 'function') {
      doc.save(fileName);
    }
  } catch {
    // Non-browser / test environment fallback
  }

  return doc.output('blob');
}