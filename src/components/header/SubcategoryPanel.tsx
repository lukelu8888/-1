import { ChevronDown } from 'lucide-react';
import { Department } from '../../data/header/departmentsData';

interface SubcategoryPanelProps {
  department: Department;
  hoveredSubcat: string | null;
  showQuantityAlert: boolean;
  onHoverSubcat: (name: string) => void;
  onNavigateToDept: (categoryName: string) => void;
}

export function SubcategoryPanel({
  department,
  hoveredSubcat,
  showQuantityAlert,
  onHoverSubcat,
  onNavigateToDept,
}: SubcategoryPanelProps) {
  return (
    <div className="w-[240px] flex-shrink-0 border-r bg-white overflow-y-auto max-h-[600px]">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="underline">{department.name}</h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNavigateToDept(department.name);
            }}
            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Shop All
          </button>
        </div>

        <div className="space-y-0">
          {department.subcategories.map((subcat, idx) => (
            <div
              key={idx}
              onMouseEnter={() => {
                if (!showQuantityAlert) {
                  onHoverSubcat(subcat.name);
                }
              }}
              className={`flex items-center justify-between py-2.5 text-sm cursor-pointer transition-colors group ${
                hoveredSubcat === subcat.name ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              <span>{subcat.name}</span>
              {subcat.items && subcat.items.length > 0 && (
                <ChevronDown className={`h-4 w-4 -rotate-90 transition-colors ${
                  hoveredSubcat === subcat.name ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
