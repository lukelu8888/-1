import React from 'react';
import MarketingOpsWorkbench from '../admin/MarketingOpsWorkbench';

interface MarketingOpsDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function MarketingOpsDashboard({ user }: MarketingOpsDashboardProps) {
  return <MarketingOpsWorkbench userRole={user.role} />;
}
