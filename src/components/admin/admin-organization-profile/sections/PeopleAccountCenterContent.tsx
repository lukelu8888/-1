import React from 'react';
import { ContactRound, Lock, Shield } from 'lucide-react';
import { PeopleAccountAccessAuditPanels } from './PeopleAccountAccessAuditPanels';
import { PeopleAccountAccessTableView } from './PeopleAccountAccessTableView';
import { PeopleAccountCenterOverlays } from './PeopleAccountCenterOverlays';
import { PeopleAccountPeopleView } from './PeopleAccountPeopleView';
import { PeopleAccountRolesView } from './PeopleAccountRolesView';

type PeopleAccountCenterContentProps = {
  activeView: 'people' | 'access' | 'roles';
  setActiveView: (value: 'people' | 'access' | 'roles') => void;
  peopleViewProps: Record<string, unknown>;
  accessTableProps: Record<string, unknown>;
  accessAuditProps: Record<string, unknown>;
  overlaysProps: Record<string, unknown>;
  roleViewProps: Record<string, unknown>;
};

export function PeopleAccountCenterContent({
  activeView,
  setActiveView,
  peopleViewProps,
  accessTableProps,
  accessAuditProps,
  overlaysProps,
  roleViewProps,
}: PeopleAccountCenterContentProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4">
          <div className="grid w-full grid-cols-3 items-stretch gap-3">
            {[
              { key: 'people', label: '人员主档', icon: <ContactRound className="h-4 w-4" /> },
              { key: 'access', label: '账号与访问', icon: <Lock className="h-4 w-4" /> },
              { key: 'roles', label: '角色权限', icon: <Shield className="h-4 w-4" /> },
            ].map((item) => {
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key as 'people' | 'access' | 'roles')}
                  className="flex min-w-0 items-center justify-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-semibold transition-colors"
                  style={{
                    borderBottomColor: active ? '#ef4444' : 'transparent',
                    color: active ? '#dc2626' : '#475569',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3.5">
          {activeView === 'people' && <PeopleAccountPeopleView {...peopleViewProps} />}

          {activeView === 'access' && (
            <div className="space-y-4">
              <PeopleAccountAccessTableView {...accessTableProps} />
              <PeopleAccountAccessAuditPanels {...accessAuditProps} />
              <PeopleAccountCenterOverlays {...overlaysProps} />
            </div>
          )}

          {activeView === 'roles' && <PeopleAccountRolesView {...roleViewProps} />}
        </div>
      </div>
    </div>
  );
}
