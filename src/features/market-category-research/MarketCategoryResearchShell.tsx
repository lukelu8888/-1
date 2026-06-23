import { useState } from 'react';
import {
  BarChart2,
  ClipboardList,
  Database,
  FileSearch,
  Globe,
  LayoutDashboard,
  ListChecks,
  Plus,
} from 'lucide-react';
import { cn } from '../../components/ui/utils';
import type { MCRNavState, MCRPage } from './types';

import { OverviewPage } from './pages/OverviewPage';
import { RunsPage } from './pages/RunsPage';
import { CreateRunPage } from './pages/CreateRunPage';
import { RunDetailPage } from './pages/RunDetailPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { EvidencePage } from './pages/EvidencePage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { PublishPage } from './pages/PublishPage';
import { DataSourcesPage } from './pages/DataSourcesPage';

interface NavItem {
  id: MCRPage;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'runs', label: 'Research Runs', icon: ClipboardList },
  { id: 'candidates', label: 'Candidates', icon: FileSearch },
  { id: 'evidence', label: 'Evidence Board', icon: BarChart2 },
  { id: 'review-queue', label: 'Review Queue', icon: ListChecks },
  { id: 'data-sources', label: 'Data Sources', icon: Database },
];

// Pages with no nav item (sub-pages)
const HIDDEN_PAGES: MCRPage[] = ['runs-new', 'run-detail', 'candidate-detail', 'publish'];

export default function MarketCategoryResearchShell() {
  const [nav, setNav] = useState<MCRNavState>({ page: 'overview' });

  function navigate(state: MCRNavState) {
    setNav(state);
  }

  const activePage = nav.page;
  const activeNavId = HIDDEN_PAGES.includes(activePage)
    ? activePage === 'runs-new' || activePage === 'run-detail'
      ? 'runs'
      : activePage === 'candidate-detail' || activePage === 'publish'
      ? 'candidates'
      : 'overview'
    : activePage;

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Left sidebar nav */}
      <div className="flex w-44 shrink-0 flex-col border-r border-slate-200 bg-white py-2">
        <div className="px-3 py-2">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Market Research</div>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate({ page: item.id })}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                activeNavId === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <item.icon size={13} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        {/* Quick action */}
        <div className="border-t border-slate-100 px-2 py-2">
          <button
            onClick={() => navigate({ page: 'runs-new' })}
            className="flex w-full items-center gap-2 rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
          >
            <Plus size={12} />
            New Run
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
        {activePage === 'overview' && <OverviewPage onNavigate={navigate} />}
        {activePage === 'runs' && <RunsPage onNavigate={navigate} />}
        {activePage === 'runs-new' && <CreateRunPage onNavigate={navigate} />}
        {activePage === 'run-detail' && nav.runId && (
          <RunDetailPage runId={nav.runId} onNavigate={navigate} />
        )}
        {activePage === 'candidates' && <CandidatesPage onNavigate={navigate} />}
        {activePage === 'candidate-detail' && nav.candidateId && (
          <CandidateDetailPage candidateId={nav.candidateId} onNavigate={navigate} />
        )}
        {activePage === 'evidence' && <EvidencePage onNavigate={navigate} />}
        {activePage === 'review-queue' && <ReviewQueuePage onNavigate={navigate} />}
        {activePage === 'publish' && nav.candidateId && (
          <PublishPage candidateId={nav.candidateId} onNavigate={navigate} />
        )}
        {activePage === 'data-sources' && <DataSourcesPage />}
      </div>
    </div>
  );
}
