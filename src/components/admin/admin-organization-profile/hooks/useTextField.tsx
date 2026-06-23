import React from 'react';

import { INPUT, NONE, TEXTAREA, VAL } from '../sharedStyles';

export function useTextField(isEdit: boolean) {
  return function tf(
    value: string,
    onChange: (v: string) => void,
    placeholder = '',
    type: 'input' | 'textarea' = 'input',
  ): React.ReactNode {
    if (!isEdit) {
      return value ? <span className={VAL}>{value}</span> : <span className={NONE}>—</span>;
    }

    if (type === 'textarea') {
      return (
        <textarea
          className={`${TEXTAREA} min-h-[88px]`}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        className={INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  };
}
