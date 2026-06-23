// @vitest-environment jsdom

import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReceivableDetailStageSummary } from './ReceivableDetailStageSummary';

describe('ReceivableDetailStageSummary', () => {
  it('renders waiting balance confirmation summary for finance follow-up', () => {
    render(
      <ReceivableDetailStageSummary
        row={{
          remainingAmount: 3578.39,
          receivedAmount: 1533.6,
          currency: 'USD',
          balanceDueDate: '2026-04-05',
          nextAction: '财务确认余款到账',
          depositStageLabel: '定金已确认到账',
          balanceStageLabel: '待财务确认余款到账',
        }}
      />,
    );

    expect(screen.getByText('USD 3,578.39')).toBeInTheDocument();
    expect(screen.getByText('USD 1,533.6')).toBeInTheDocument();
    expect(screen.getByText('财务确认余款到账')).toBeInTheDocument();
    expect(screen.getByText('定金：定金已确认到账')).toBeInTheDocument();
    expect(screen.getByText('余款：待财务确认余款到账')).toBeInTheDocument();
  });

  it('renders settled summary after full receipt confirmation', () => {
    render(
      <ReceivableDetailStageSummary
        row={{
          remainingAmount: 0,
          receivedAmount: 5111.99,
          currency: 'USD',
          balanceDueDate: '2026-04-05',
          nextAction: '无需跟进',
          depositStageLabel: '定金已确认到账',
          balanceStageLabel: '已结清',
        }}
      />,
    );

    expect(screen.getAllByText('已结清').length).toBeGreaterThan(0);
    expect(screen.getByText('无需跟进')).toBeInTheDocument();
    expect(screen.getByText('余款：已结清')).toBeInTheDocument();
    expect(screen.getByText('USD 5,111.99')).toBeInTheDocument();
  });
});
