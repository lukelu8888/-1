import { ChevronDown } from 'lucide-react';
import type { Department } from '../../lib/storefrontDepartmentBaseline';

interface SubcategoryPanelProps {
  department: Department;
  hoveredSubcat: string | null;
  showQuantityAlert: boolean;
  onHoverSubcat: (name: string) => void;
  onNavigateToDept: (categoryName: string) => void;
  onNavigateToDeptSubcat: (categoryName: string, subcategoryName: string) => void;
}

export function SubcategoryPanel({
  department,
  hoveredSubcat,
  showQuantityAlert,
  onHoverSubcat,
  onNavigateToDept,
  onNavigateToDeptSubcat,
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigateToDeptSubcat(department.name, subcat.name);
              }}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors group ${
                hoveredSubcat === subcat.name ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                {subcat.image && (
                  <img
                    src={subcat.image}
                    alt={subcat.name}
                    className="h-9 w-9 flex-shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                )}
                <span className="leading-snug">{subcat.name}</span>
              </span>
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
