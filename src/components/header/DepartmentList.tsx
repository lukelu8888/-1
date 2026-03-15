import { X, ChevronDown } from 'lucide-react';
import { Department } from '../../data/header/departmentsData';

interface DepartmentListProps {
  departments: Department[];
  hoveredDept: number | null;
  showQuantityAlert: boolean;
  onHoverDept: (index: number) => void;
  onNavigateToDept: (categoryName: string) => void;
  onNavigateToCatalog: () => void;
  onCloseMenu: () => void;
}

export function DepartmentList({
  departments,
  hoveredDept,
  showQuantityAlert,
  onHoverDept,
  onNavigateToDept,
  onNavigateToCatalog,
  onCloseMenu,
}: DepartmentListProps) {
  return (
    <div className="w-[225px] flex-shrink-0 border-r bg-gray-50">
      {/* Featured Events */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h3 className="mb-3">Featured Event(s)</h3>
        <div className="space-y-2 text-sm">
          <a href="#products" className="block text-gray-700 hover:text-orange-600">
            Halloween 🎃
          </a>
          <a href="#products" className="block text-gray-700 hover:text-orange-600">
            Refresh for Less
          </a>
          <a href="#products" className="block text-gray-700 hover:text-orange-600">
            DEWALT MAX POWER
          </a>
        </div>
      </div>

      {/* Shop by Department List */}
      <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: 'calc(600px - 140px)' }}>
        <h3 className="mb-3">Shop by Department</h3>
        <div className="space-y-0">
          {departments.map((dept, index) => (
            <div
              key={index}
              onMouseEnter={() => {
                if (!showQuantityAlert) {
                  onHoverDept(index);
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigateToDept(dept.name);
              }}
              className={`flex items-center justify-between py-2.5 text-sm transition-colors group cursor-pointer ${
                hoveredDept === index ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              <span>{dept.name}</span>
              <ChevronDown className={`h-4 w-4 -rotate-90 transition-colors ${
                hoveredDept === index ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600'
              }`} />
            </div>
          ))}
        </div>
      </div>

      {/* All Departments & Close */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <button
          onClick={onNavigateToCatalog}
          className="block w-full py-2 text-sm text-gray-900 hover:text-orange-600 transition-colors text-left"
        >
          All Departments
        </button>
        <button
          className="flex items-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            onCloseMenu();
          }}
        >
          <X className="h-4 w-4" />
          Close Menu
        </button>
      </div>
    </div>
  );
}
