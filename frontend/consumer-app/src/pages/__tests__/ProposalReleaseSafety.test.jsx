import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Proposal from '../Proposal';
import { proposalService } from '../../services/proposal.service';
import api from '../../services/api/client';

vi.mock('../../contexts/PlanningContext', () => ({
  usePlanning: () => mockPlanning,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: stableAuthUser }),
}));

// Stable reference required: Proposal.jsx keys a form-sync effect on the
// user object identity, so a fresh literal per useAuth() call would loop renders.
const stableAuthUser = { name: 'Test User', email: 't@test.com' };

vi.mock('../../services/pdf/proposalPdfGenerator', () => ({
  generateProposalPdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

let mockPlanning = {
  proposal: null,
  activeBillOcr: null,
  roofAnalysis: null,
  generateProposal: vi.fn(),
  approveProposal: vi.fn(),
  loading: false,
  error: null,
  bills: [],
};

function setPlanning(overrides) {
  mockPlanning = {
    proposal: null,
    activeBillOcr: null,
    roofAnalysis: null,
    generateProposal: vi.fn(),
    approveProposal: vi.fn(),
    loading: false,
    error: null,
    bills: [],
    ...overrides,
  };
}

describe('Proposal release safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPlanning({});
  });

  it('Test 1/2/3: fresh customer sees empty state, no prop_102, no 5.8 kW default', () => {
    render(<Proposal />);
    expect(screen.getByText(/no proposal inputs yet/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/prop_102/);
    expect(document.body.textContent).not.toMatch(/5\.8\s*kW/);
    expect(screen.queryByText(/executive overview/i)).not.toBeInTheDocument();
  });

  it('Test 5/6: generation failure shows visible error and no fallback proposal', async () => {
    setPlanning({});
    mockPlanning.generateProposal.mockResolvedValue({ success: false, error: 'Backend busy' });
    render(<Proposal />);
    fireEvent.click(screen.getByRole('button', { name: /generate optimized proposal/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 8000 });
    expect(screen.getByText(/backend busy/i)).toBeInTheDocument();
    expect(screen.queryByText(/executive overview/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/prop_102/);
  }, 15000);

  it('Test 4: real proposal response renders output', () => {
    setPlanning({ proposal: { status: 'Ready', proposal_id: 'real-1' } });
    render(<Proposal />);
    expect(screen.getByText(/executive overview/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/prop_102/);
  });

  it('Test 7: approve is a local draft action with no DISCOM/cloud claim', async () => {
    mockPlanning.approveProposal.mockResolvedValue({ success: true });
    setPlanning({ proposal: { status: 'Ready' } });
    render(<Proposal />);
    fireEvent.click(screen.getByRole('button', { name: /approve draft/i }));
    await waitFor(() => {
      expect(screen.getByText(/local draft/i)).toBeInTheDocument();
    });
    expect(document.body.textContent).not.toMatch(/dispatch queue/i);
  });

  it('Test 8/9: no email button, no cloud-saved or dispatch success text', () => {
    setPlanning({ proposal: { status: 'Ready' } });
    render(<Proposal />);
    expect(screen.queryByRole('button', { name: /email/i })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/saved to cloud/i);
    expect(document.body.textContent).not.toMatch(/dispatch queued/i);
    expect(document.body.textContent).not.toMatch(/email dispatch/i);
  });

  it('service: generateProposal blocks empty inputs without calling the API', async () => {
    await expect(proposalService.generateProposal({})).rejects.toThrow(/monthly bill/i);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('service: getProposal returns null by default (no fabricated proposal)', async () => {
    await expect(proposalService.getProposal()).resolves.toBeNull();
  });
});
