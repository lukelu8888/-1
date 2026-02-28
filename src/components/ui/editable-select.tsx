import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { X, Search, ChevronDown } from 'lucide-react@0.487.0';

interface EditableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  /** When true, renders a searchable combobox instead of a plain select */
  searchable?: boolean;
}

// ─── Shared clear button ───────────────────────────────────────────────────────
const ClearBtn: React.FC<{ hasValue: boolean; onClear: (e: React.MouseEvent<HTMLButtonElement>) => void }> = ({ hasValue, onClear }) => (
  <button
    type="button"
    onClick={onClear}
    className={`flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded border transition-colors ${
      hasValue
        ? 'border-gray-300 text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 cursor-pointer'
        : 'border-gray-200 text-gray-200 cursor-default pointer-events-none'
    }`}
    aria-label="清除"
    title={hasValue ? '清除' : ''}
    tabIndex={-1}
  >
    <X className="h-3 w-3" />
  </button>
);

// ─── Searchable combobox ───────────────────────────────────────────────────────
const SearchableCombobox: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="flex items-center gap-1 flex-1 relative">
      <ClearBtn hasValue={Boolean(value)} onClear={handleClear} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex-1 flex items-center justify-between gap-1 h-9 px-3 text-sm border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-left"
      >
        <span className={value ? 'text-foreground truncate' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-6 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                    opt === value ? 'bg-accent/60 font-medium' : ''
                  }`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">无匹配结果</p>
            )}
            {/* Custom entry at the bottom */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className="w-full text-left px-3 py-1.5 text-sm text-blue-600 font-semibold border-t border-border hover:bg-blue-50 transition-colors"
            >
              ✏️ 自定义输入...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
export const EditableSelect: React.FC<EditableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = '请选择或输入...',
  className = '',
  searchable = false,
}) => {
  const [isCustom, setIsCustom] = useState(() => Boolean(value && !options.includes(value)));

  useEffect(() => {
    if (value && !options.includes(value)) {
      setIsCustom(true);
    } else {
      setIsCustom(false);
    }
  }, [value, options]);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__custom__') {
      setIsCustom(true);
      onChange('');
    } else {
      setIsCustom(false);
      onChange(selectedValue);
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setIsCustom(false);
  };

  return (
    <div className={className}>
      <Label className="text-sm text-gray-700 mb-1 block">{label}</Label>

      {/* ── Searchable combobox mode ── */}
      {searchable && !isCustom && (
        <SearchableCombobox
          value={value}
          onChange={(val) => {
            if (val === '') {
              // "自定义输入" selected from combobox
              setIsCustom(true);
            } else {
              onChange(val);
            }
          }}
          options={options}
          placeholder={placeholder}
        />
      )}

      {/* ── Plain select mode ── */}
      {!searchable && !isCustom && (
        <div className="flex items-center gap-1">
          <ClearBtn hasValue={Boolean(value)} onClear={handleClear} />
          <Select value={value || '__placeholder__'} onValueChange={handleSelectChange}>
            <SelectTrigger className="text-sm h-9 flex-1">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option, index) => (
                <SelectItem key={index} value={option} className="text-sm">
                  {option}
                </SelectItem>
              ))}
              <SelectItem value="__custom__" className="text-sm text-blue-600 font-semibold border-t border-gray-100 mt-1">
                ✏️ 自定义输入...
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Custom text input mode (both searchable and plain) ── */}
      {isCustom && (
        <div className="flex items-center gap-1">
          <ClearBtn hasValue={Boolean(value)} onClear={handleClear} />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="text-sm h-9 flex-1"
          />
          <button
            type="button"
            onClick={() => { setIsCustom(false); onChange(''); }}
            className="flex-shrink-0 text-xs px-2 h-9 text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 whitespace-nowrap"
            title="返回选择列表"
          >
            ↩ 列表
          </button>
        </div>
      )}
    </div>
  );
};
