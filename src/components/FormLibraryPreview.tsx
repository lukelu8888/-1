import React from 'react';
import { FormLibraryManagementPro } from './FormLibraryManagementPro';

export default function FormLibraryPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <FormLibraryManagementPro onClose={() => window.history.back()} />
    </div>
  );
}
