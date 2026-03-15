import { useState } from 'react';
import { Button } from '../ui/button';
import ModelMappingCenter from './ModelMappingCenter';
import InternalProductCatalog from './InternalProductCatalog';

export default function ProductManagement() {
  const [activeSection, setActiveSection] = useState<'catalog' | 'mapping'>('catalog');

  return (
    <div className="space-y-4 pb-6">
      <div className="inline-flex gap-1 rounded border border-gray-200 bg-white p-1 shadow-sm">
        <Button
          variant={activeSection === 'catalog' ? 'default' : 'ghost'}
          className="h-8 px-4"
          style={{ fontSize: '12px' }}
          onClick={() => setActiveSection('catalog')}
        >
          内部产品目录
        </Button>
        <Button
          variant={activeSection === 'mapping' ? 'default' : 'ghost'}
          className="h-8 px-4"
          style={{ fontSize: '12px' }}
          onClick={() => setActiveSection('mapping')}
        >
          型号映射中心
        </Button>
      </div>

      {activeSection === 'mapping' ? <ModelMappingCenter /> : <InternalProductCatalog />}
    </div>
  );
}
