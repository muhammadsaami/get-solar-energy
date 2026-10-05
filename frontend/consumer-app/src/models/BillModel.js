// src/models/BillModel.js

export class BillModel {
  constructor(raw = {}) {
    this.id = raw.id || `bill_${Date.now()}`;
    this.uploadDate = raw.upload_date || raw.uploadDate || new Date().toISOString();
    this.customerName = raw.customer_name || raw.customerName || 'Valued Consumer';
    this.consumerNumber = raw.consumer_number || raw.consumerNumber || '';
    this.discom = raw.discom || '';
    this.billingPeriod = raw.billing_period || raw.billingPeriod || '';
    this.billing_period = this.billingPeriod;

    // Canonical consumption and amount (supports raw API, DB, or normalized models)
    const consumption = raw.monthlyConsumptionKwh ?? raw.monthly_units ?? raw.monthlyUnits ?? raw.kwhConsumption ?? 0;
    this.monthlyConsumptionKwh = consumption;
    this.monthly_units = consumption;
    this.monthlyUnits = consumption;
    this.kwhConsumption = consumption;

    const amount = raw.billAmount ?? raw.bill_amount ?? raw.amount ?? 0;
    this.billAmount = amount;
    this.bill_amount = amount;
    this.amount = amount;

    this.perUnitRate = raw.per_unit_rate ?? raw.perUnitRate ?? 0.0;
    this.per_unit_rate = this.perUnitRate;

    this.recommendedKw = raw.recommended_kw ?? raw.recommendedKw ?? 0.0;
    this.recommended_kw = this.recommendedKw;

    this.monthlyGeneration = raw.monthly_generation_units ?? raw.monthlyGeneration ?? 0;
    this.monthly_generation_units = this.monthlyGeneration;

    this.monthlySavings = raw.monthly_savings_rs ?? raw.monthlySavings ?? 0;
    this.monthly_savings_rs = this.monthlySavings;

    this.systemCost = raw.system_cost_rs ?? raw.systemCost ?? 0;
    this.system_cost_rs = this.systemCost;

    this.paybackYears = raw.payback_years ?? raw.paybackYears ?? 0.0;
    this.payback_years = this.paybackYears;

    this.savings25yr = raw.savings_25_years_rs ?? raw.savings25yr ?? 0;
    this.savings_25_years_rs = this.savings25yr;

    // Net-metering metrics (isolated)
    this.gridImportKwh = raw.gridImportKwh ?? raw.grid_import ?? raw.importUnits ?? null;
    this.grid_import = this.gridImportKwh;
    this.gridExportKwh = raw.gridExportKwh ?? raw.grid_export ?? raw.exportUnits ?? null;
    this.grid_export = this.gridExportKwh;
    this.netBilledUnitsKwh = raw.netBilledUnitsKwh ?? raw.net_billed_units ?? null;
    this.net_billed_units = this.netBilledUnitsKwh;

    // Timeline attributes driven from processing stages
    this.ocrStatus = raw.ocr_status || raw.ocrStatus || 'Completed';
    this.verificationStatus = raw.verification_status || raw.verificationStatus || 'Verified';
    this.sanctionedLoad = raw.sanctioned_load_kw || raw.sanctionedLoad || 8.0;
  }
}

