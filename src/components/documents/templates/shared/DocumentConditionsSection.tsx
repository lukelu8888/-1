import React from 'react';
import type { DocumentConditionGroup } from '../../../../types/documentConditions';

interface DocumentConditionsSectionProps {
  title?: string;
  titleEn?: string;
  groups?: DocumentConditionGroup[];
  emptyText?: string;
}

export function DocumentConditionsSection({
  title = '条件信息汇总',
  titleEn,
  groups = [],
  emptyText = '暂无条件信息',
}: DocumentConditionsSectionProps) {
  const visibleGroups = groups.filter((group) => Array.isArray(group.items) && group.items.length > 0);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-base">{title}</h3>
        {titleEn && <span className="text-[10px] uppercase tracking-wide text-gray-500">{titleEn}</span>}
      </div>

      {visibleGroups.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 px-3 py-4 text-xs italic text-gray-400">
          {emptyText}
        </div>
      ) : (
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            {visibleGroups.map((group) => (
              <React.Fragment key={group.key}>
                <tr className="bg-gray-100">
                  <td colSpan={3} className="border border-gray-400 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{group.title}</span>
                      {group.titleEn && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-500">{group.titleEn}</span>
                      )}
                    </div>
                  </td>
                </tr>
                {group.items.map((item, index) => (
                  <tr key={item.key}>
                    <td className="w-10 border border-gray-400 px-2 py-1.5 text-center font-semibold text-gray-600">
                      {index + 1}
                    </td>
                    <td className="w-40 border border-gray-400 px-2 py-1.5 font-semibold text-gray-700">
                      {item.label}
                    </td>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <div className="whitespace-pre-wrap break-words text-gray-900">{item.value}</div>
                      {item.hint && <div className="mt-1 text-[10px] text-blue-600">{item.hint}</div>}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
