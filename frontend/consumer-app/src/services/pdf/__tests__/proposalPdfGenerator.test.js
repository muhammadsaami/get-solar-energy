import { describe, it, expect, vi } from 'vitest';
import { generateProposalPdf } from '../proposalPdfGenerator';

describe('proposalPdfGenerator', () => {
  it('generates a structured PDF blob for valid proposal data', async () => {
    const mockForm = {
      customerName: 'Sunil Sharma',
      phone: '9876543210',
      email: 'sunil@example.com',
      address: '123 Green Avenue, Malviya Nagar',
      city: 'Jaipur',
      monthlyBill: '4500',
      monthlyUnits: '450',
      electricityRate: '8.0',
      roofArea: '600',
      recommendedKw: '5.4',
      panelType: '540W Mono PERC Tier-1',
      inverterType: '5 kW 3-Phase MPPT String Inverter',
      batteryOption: 'None (Grid-Tied Net Metering)',
    };

    const mockInsights = {
      kw: 5.4,
      rate: 8.0,
      area: 600,
      monthlyGen: 729,
      annualGen: 8748,
      monthlySavings: 5832,
      annualSavings: 69984,
      systemCost: 280800,
      subsidy: 78000,
      netCost: 202800,
      payback: '2.9',
      lifetimeSavings: 1546800,
      co2: '7.17',
      trees: 394,
      panels: 10,
      monthlyCurve: [
        { month: 'Jan', gen: 692, savings: 5536 },
        { month: 'Feb', gen: 765, savings: 6120 },
        { month: 'Mar', gen: 874, savings: 6992 },
        { month: 'Apr', gen: 911, savings: 7288 },
        { month: 'May', gen: 947, savings: 7576 },
        { month: 'Jun', gen: 801, savings: 6408 },
        { month: 'Jul', gen: 546, savings: 4368 },
        { month: 'Aug', gen: 510, savings: 4080 },
        { month: 'Sep', gen: 619, savings: 4952 },
        { month: 'Oct', gen: 765, savings: 6120 },
        { month: 'Nov', gen: 692, savings: 5536 },
        { month: 'Dec', gen: 656, savings: 5248 },
      ],
    };

    const blob = await generateProposalPdf({
      form: mockForm,
      insights: mockInsights,
      proposal: { id: 'PROP-TEST-001' },
      version: 'v1.0',
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('handles empty / missing fields gracefully with fallbacks', async () => {
    const blob = await generateProposalPdf({
      form: {},
      insights: {},
      proposal: null,
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });
});
