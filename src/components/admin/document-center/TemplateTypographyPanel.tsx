import React from 'react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface TypographyField {
  sizeKey: string;
  fontFamilyKey: string;
  label: string;
}

interface FontOption {
  value: string;
  label: string;
}

interface TemplateTypographyPanelProps<T extends Record<string, string | number | undefined>> {
  title: string;
  description?: string;
  values: T;
  fields: TypographyField[];
  fontFamilyOptions: readonly FontOption[];
  onChange: <K extends keyof T>(key: K, value: T[K]) => void;
}

export function TemplateTypographyPanel<T extends Record<string, string | number | undefined>>({
  title,
  description,
  values,
  fields,
  fontFamilyOptions,
  onChange,
}: TemplateTypographyPanelProps<T>) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-900">{title}</p>
        {description ? (
          <p className="mt-1 text-[11px] leading-5 text-gray-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.sizeKey} className="rounded border border-gray-100 bg-gray-50 p-2">
            <Label className="text-[11px] font-semibold text-gray-700">{field.label}</Label>
            <div className="mt-2 grid grid-cols-[1fr_88px] gap-2">
              <div>
                <Label className="text-[11px] text-gray-500">字体</Label>
                <select
                  value={String(values[field.fontFamilyKey] ?? fontFamilyOptions[0]?.value ?? '')}
                  onChange={(event) => onChange(field.fontFamilyKey as keyof T, event.target.value as T[keyof T])}
                  className="mt-1 h-7 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  {fontFamilyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500">字号</Label>
                <Input
                  type="number"
                  min="6"
                  step="0.5"
                  value={values[field.sizeKey] ?? ''}
                  onChange={(event) =>
                    onChange(field.sizeKey as keyof T, (Number(event.target.value) || 6) as T[keyof T])
                  }
                  className="mt-1 h-7 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
