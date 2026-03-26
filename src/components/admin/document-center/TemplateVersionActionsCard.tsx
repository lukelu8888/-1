import React from 'react';

import { Button } from '../../ui/button';

interface TemplateVersionActionsCardProps {
  publishedVersion?: string | null;
  draftVersion?: string | null;
  currentLoadedText?: string | null;
  noteField: React.ReactNode;
  onRestoreLatest: () => void;
  restoreDisabled?: boolean;
}

export function TemplateVersionActionsCard({
  publishedVersion,
  draftVersion,
  currentLoadedText,
  noteField,
  onRestoreLatest,
  restoreDisabled = false,
}: TemplateVersionActionsCardProps) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
      <p className="text-xs font-semibold text-violet-900">版本操作</p>
      <p className="mt-1 text-[11px] text-violet-700">
        发布版：{publishedVersion || '未发布'}
        {draftVersion ? `  草稿：${draftVersion}` : ''}
      </p>
      {currentLoadedText ? (
        <p className="mt-1 text-[11px] font-medium text-violet-800">{currentLoadedText}</p>
      ) : null}
      {noteField}
      <Button
        size="sm"
        variant="outline"
        className="mt-2 h-7 w-full text-xs"
        onClick={onRestoreLatest}
        disabled={restoreDisabled}
      >
        恢复最近保存
      </Button>
    </div>
  );
}
