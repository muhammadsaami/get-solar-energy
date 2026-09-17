import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProposalPreview from '../ProposalPreview';

describe('ProposalPreview Component', () => {
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
  };

  it('renders a real structured HTML document preview with customer and system details', () => {
    render(
      <ProposalPreview
        form={mockForm}
        insights={mockInsights}
        proposal={{ id: 'prop_test_102' }}
        version="v1.0"
        onClose={vi.fn()}
        onExportPdf={vi.fn()}
      />
    );

    // Verify Document Title & Headings
    expect(screen.getByText('Proposal Document Preview')).toBeInTheDocument();
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('1. Customer & Site Specifications')).toBeInTheDocument();
    expect(screen.getByText('2. Technical Bill of Materials (BOM) & Equipment Specifications')).toBeInTheDocument();
    expect(screen.getByText('3. Financial Breakdown & PM Surya Ghar Subsidy Schedule')).toBeInTheDocument();
    expect(screen.getByText('4. Simulated 12-Month Generation & Environmental Impact')).toBeInTheDocument();
    expect(screen.getByText('5. Turnkey Project Execution & Milestone Timeline')).toBeInTheDocument();
    expect(screen.getByText('6. Commercial Terms & Standard Assumptions')).toBeInTheDocument();
    expect(screen.getByText('7. Authorization & Proposal Acceptance')).toBeInTheDocument();

    // Verify Customer and System Information
    expect(screen.getAllByText('Sunil Sharma').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('123 Green Avenue, Malviya Nagar')).toBeInTheDocument();
    expect(screen.getByText('5.4 kWp')).toBeInTheDocument();
    expect(screen.getByText('10 Units')).toBeInTheDocument();

    // Verify Official Logo is rendered via img tag
    const logoImg = screen.getByAltText('GET SOLAR ENERGY');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/assets/logo.png');
  });

  it('triggers onClose when clicking back / close button', () => {
    const handleClose = vi.fn();
    render(
      <ProposalPreview
        form={mockForm}
        insights={mockInsights}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByText('← Back to Proposal Builder');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onExportPdf when clicking Export Proposal PDF button in toolbar', () => {
    const handleExport = vi.fn();
    render(
      <ProposalPreview
        form={mockForm}
        insights={mockInsights}
        onExportPdf={handleExport}
      />
    );

    const exportBtn = screen.getByText('📄 Export Proposal PDF');
    fireEvent.click(exportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('displays fallback dashes and handles missing data gracefully', () => {
    render(
      <ProposalPreview
        form={{}}
        insights={{}}
        proposal={null}
      />
    );

    // Empty state should be visible when no data exists
    expect(screen.getByText('Proposal data is not available yet')).toBeInTheDocument();
  });
});
