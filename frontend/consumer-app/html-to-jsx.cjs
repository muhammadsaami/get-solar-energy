const fs = require('fs');

const html = fs.readFileSync('../dashboard.html', 'utf8');

function convertHtmlToJsx(htmlString) {
  return htmlString
    .replace(/class="/g, 'className="')
    .replace(/stroke-width/g, 'strokeWidth')
    .replace(/stroke-linecap/g, 'strokeLinecap')
    .replace(/stroke-linejoin/g, 'strokeLinejoin')
    .replace(/fill-rule/g, 'fillRule')
    .replace(/clip-rule/g, 'clipRule')
    .replace(/stroke-dasharray/g, 'strokeDasharray')
    .replace(/stroke-dashoffset/g, 'strokeDashoffset')
    .replace(/clip-path/g, 'clipPath')
    .replace(/font-family/g, 'fontFamily')
    .replace(/font-weight/g, 'fontWeight')
    .replace(/font-size/g, 'fontSize')
    .replace(/text-anchor/g, 'textAnchor')
    .replace(/aria-label/g, 'aria-label')
    .replace(/aria-live/g, 'aria-live')
    .replace(/aria-disabled/g, 'aria-disabled')
    // Convert HTML comments to JSX comments
    .replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}')
    // Convert onclick to onClick
    .replace(/onclick="([^"]*)"/g, 'onClick={(e) => { e.preventDefault(); }}')
    // Handle specific style blocks if any
    .replace(/style="([^"]+)"/g, (match, styleString) => {
      const parts = styleString.split(';').filter(p => p.trim() !== '');
      const reactStyleObj = {};
      parts.forEach(p => {
        const [key, val] = p.split(':');
        if (key && val) {
          const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
          reactStyleObj[camelKey] = val.trim();
        }
      });
      return `style={{ ${Object.entries(reactStyleObj).map(([k,v]) => `${k}: '${v}'`).join(', ')} }}`;
    });
}

// 1. Extract SVG Sprites
const svgMatch = html.match(/<svg style="display: none;">([\s\S]*?)<\/svg>/);
if (svgMatch) {
  const jsxSvg = convertHtmlToJsx(`<svg style="display: none;">${svgMatch[1]}</svg>`);
  const component = `export default function DashboardSprites() {\n  return (\n    ${jsxSvg.replace(/\n/g, '\n    ')}\n  );\n}\n`;
  fs.writeFileSync('./src/components/dashboard/DashboardSprites.tsx', component);
  console.log('Created DashboardSprites.tsx');
}

// 2. Extract KPIGrid
const kpiMatch = html.match(/<section class="kpi-container" aria-label="Key Performance Metrics">([\s\S]*?)<\/section>/);
if (kpiMatch) {
  const jsxKpi = convertHtmlToJsx(`<section class="kpi-container" aria-label="Key Performance Metrics">${kpiMatch[1]}</section>`);
  const component = `export default function KPIGrid() {\n  return (\n    ${jsxKpi.replace(/\n/g, '\n    ')}\n  );\n}\n`;
  fs.writeFileSync('./src/components/dashboard/KPIGrid.tsx', component);
  console.log('Created KPIGrid.tsx');
}
// 3. Extract SubKPIGrid
const subKpiMatch = html.match(/<!-- --- SUB-KPI FLOATING ROW([\s\S]*?)<section class="sub-kpis-grid" aria-label="Solar System Design Metrics">([\s\S]*?)<\/section>/);
if (subKpiMatch) {
  const jsxSubKpi = convertHtmlToJsx(`<section class="sub-kpis-grid" aria-label="Solar System Design Metrics">${subKpiMatch[2]}</section>`);
  const component = `export default function SubKPIGrid() {\n  return (\n    ${jsxSubKpi.replace(/\n/g, '\n    ')}\n  );\n}\n`;
  fs.writeFileSync('./src/components/dashboard/SubKPIGrid.tsx', component);
  console.log('Created SubKPIGrid.tsx');
}
// 4. Extract AnalyticsCharts
const analyticsMatch = html.match(/<div class="analytics-grid">([\s\S]*?)<\/div>\s*<!-- --- AI INTELLIGENCE/);
if (analyticsMatch) {
  const jsxAnalytics = convertHtmlToJsx(`<div class="analytics-grid">${analyticsMatch[1]}</div>`);
  const component = `import React from 'react';\n\nexport default function AnalyticsCharts() {\n  return (\n    ${jsxAnalytics.replace(/\n/g, '\n    ')}\n  );\n}\n`;
  fs.writeFileSync('./src/components/dashboard/AnalyticsCharts.tsx', component);
  console.log('Created AnalyticsCharts.tsx');
}

// 5. Extract QuickActionsGrid
const quickActionsMatch = html.match(/<section aria-labelledby="quickActionsTitle">([\s\S]*?)<\/section>/);
if (quickActionsMatch) {
  const jsxQuickActions = convertHtmlToJsx(`<section aria-labelledby="quickActionsTitle">${quickActionsMatch[1]}</section>`);
  const component = `import React from 'react';\n\nexport default function QuickActionsGrid() {\n  return (\n    ${jsxQuickActions.replace(/\n/g, '\n    ')}\n  );\n}\n`;
  fs.writeFileSync('./src/components/dashboard/QuickActionsGrid.tsx', component);
  console.log('Created QuickActionsGrid.tsx');
}

// 6. Extract AIIntelligencePanel
const aiMatch = html.match(/<section class="ai-intelligence-section" id="aiIntelligenceSection">([\s\S]*?)<\/section>/);
if (aiMatch) {
  const jsxAI = convertHtmlToJsx(`<section className="ai-intelligence-section" id="aiIntelligenceSection">${aiMatch[1]}</section>`);
  const component = `import React from 'react';\n\nexport default function AIIntelligencePanel() {\n  return (\n    ${jsxAI.replace(/\n/g, '\n    ')}\n  );\n}\n`;
  fs.writeFileSync('./src/components/dashboard/AIIntelligencePanel.tsx', component);
  console.log('Created AIIntelligencePanel.tsx');
}

// 7. Extract FooterGrid
const footerMatch = html.match(/<footer class="footer-grid">([\s\S]*?)<\/footer>/);
if (footerMatch) {
  const jsxFooter = convertHtmlToJsx(`<footer className="footer-grid">${footerMatch[1]}</footer>`);
  const component = `import React from 'react';\n\nexport default function FooterGrid() {\n  return (\n    ${jsxFooter.replace(/\n/g, '\n    ')}\n  );\n}\n`;
  fs.writeFileSync('./src/components/dashboard/FooterGrid.tsx', component);
  console.log('Created FooterGrid.tsx');
}
