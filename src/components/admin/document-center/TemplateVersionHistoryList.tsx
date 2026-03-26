import React from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface TemplateVersionHistoryRecord {
  id: string;
  version: string;
  status: 'draft' | 'published';
  savedAt: string;
  note: string;
}

interface TemplateVersionHistoryListProps<TRecord extends TemplateVersionHistoryRecord> {
  records: TRecord[];
  onRestore: (record: TRecord) => void;
  activeVersion?: string | null;
}

export function TemplateVersionHistoryList<TRecord extends TemplateVersionHistoryRecord>({
  records,
  onRestore,
  activeVersion,
}: TemplateVersionHistoryListProps<TRecord>) {
  return (
    <div className="space-y-2">
      {records.map((record) => {
        const isActive = Boolean(activeVersion && activeVersion === record.version);

        return (
          <div
            key={record.id}
            className={`rounded border p-2.5 ${
              isActive ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-900">{record.version}</span>
                  <Badge
                    className={`h-4 border px-1 text-[10px] ${
                      record.status === 'published'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {record.status === 'published' ? '已发布' : '草稿'}
                  </Badge>
                  {isActive ? (
                    <Badge className="h-4 border border-violet-200 bg-violet-100 px-1 text-[10px] text-violet-700">
                      当前已加载
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[10px] text-gray-400">{record.savedAt}</p>
                <p className="mt-0.5 text-[11px] text-gray-600">{record.note}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 flex-shrink-0 px-2 text-[10px]"
                onClick={() => onRestore(record)}
              >
                {isActive ? '已加载' : '恢复'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
