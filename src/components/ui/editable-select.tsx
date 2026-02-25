import React, { useState } from 'react';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { X } from 'lucide-react@0.487.0';

interface EditableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = '请选择或输入...',
  className = ''
}) => {
  const [isCustom, setIsCustom] = useState(() => {
    // 如果当前值不在预设选项中，说明是自定义的
    return value && !options.includes(value);
  });

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__custom__') {
      setIsCustom(true);
      onChange('');
    } else {
      setIsCustom(false);
      onChange(selectedValue);
    }
  };

  const handleClearValue = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onChange('');
  };

  return (
    <div className={className}>
      <Label className="text-sm text-gray-700 mb-1 block">{label}</Label>
      {!isCustom ? (
        <Select value={value || '__placeholder__'} onValueChange={handleSelectChange}>
          <SelectTrigger className="text-sm h-9">
            <SelectValue placeholder={placeholder} />
            {value && (
              <button
                type="button"
                onPointerDown={handleClearValue}
                className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="清除当前选择"
                title="清除当前选择"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </SelectTrigger>
          <SelectContent>
            {options.map((option, index) => (
              <SelectItem key={index} value={option} className="text-sm">
                {option}
              </SelectItem>
            ))}
            <SelectItem value="__custom__" className="text-sm text-blue-600 font-semibold">
              ✏️ 自定义输入...
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="text-sm h-9 flex-1"
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className="text-xs px-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
            title="返回选择列表"
          >
            ↩
          </button>
        </div>
      )}
    </div>
  );
};
