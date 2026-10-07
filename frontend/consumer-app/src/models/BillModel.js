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
    this.sanctionedLoad = raw.sanctioned_load_kw ?? raw.sanctionedLoad ?? 8.0;
    this.sanctioned_load_kw = raw.sanctioned_load_kw ?? this.sanctionedLoad;
    this.billedDemand = raw.billed_demand_kw ?? raw.billed_demand ?? raw.billedDemand ?? null;
    this.billed_demand_kw = this.billedDemand;
    this.powerFactor = raw.power_factor ?? raw.powerFactor ?? null;
    this.power_factor = this.powerFactor;
    this.billNumber = raw.bill_number ?? raw.billNumber ?? '';
    this.bill_number = this.billNumber;
    this.billDate = raw.bill_date ?? raw.billDate ?? '';
    this.bill_date = this.billDate;
    this.dueDate = raw.due_date ?? raw.dueDate ?? '';
    this.due_date = this.dueDate;
    this.effectiveRate = raw.effective_rate ?? raw.effectiveRate ?? null;
    this.effective_rate = this.effectiveRate;
    this.energyCharges = raw.energy_charges ?? raw.energyCharges ?? null;
    this.energy_charges = this.energyCharges;
    this.fixedCharges = raw.fixed_charges ?? raw.demand_charges ?? raw.fixedCharges ?? null;
    this.fixed_charges = this.fixedCharges;
    this.demand_charges = this.fixedCharges;
    this.electricityDuty = raw.electricity_duty ?? raw.electricityDuty ?? null;
    this.electricity_duty = this.electricityDuty;
    this.fppa = raw.fppa ?? null;
    this.kwhMeterConsumption = raw.kwh_meter_consumption ?? raw.kwhMeterConsumption ?? null;
    this.kwh_meter_consumption = this.kwhMeterConsumption;
    this.kvahConsumption = raw.kvah_consumption ?? raw.kvahConsumption ?? null;
    this.kvah_consumption = this.kvahConsumption;
    this.tariffSlabs = raw.tariff_slabs ?? raw.slabs ?? raw.tariffSlabs ?? null;
    this.tariff_slabs = this.tariffSlabs;
  }
}

