import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui/button';

interface MultiDimensionFiltersProps {
  // 当前筛选值
  selectedRegion: string;
  selectedSalesRep: string;
  selectedCustomer: string;
  selectedProduct: string;
  
  // 筛选变更回调
  onRegionChange: (value: string) => void;
  onSalesRepChange: (value: string) => void;
  onCustomerChange: (value: string) => void;
  onProductChange: (value: string) => void;
  
  // 数据选项（从实际数据中提取）
  regions?: string[];
  salesReps?: string[];
  customers?: string[];
  products?: string[];
  
  // 重置所有筛选
  onReset: () => void;
  
  // 显示哪些筛选器
  showRegion?: boolean;
  showSalesRep?: boolean;
  showCustomer?: boolean;
  showProduct?: boolean;
}

/**
 * 🎯 多维度筛选组件 - 台湾大厂ERP风格
 * 用于老板角色的全局数据筛选
 */
export function MultiDimensionFilters({
  selectedRegion,
  selectedSalesRep,
  selectedCustomer,
  selectedProduct,
  onRegionChange,
  onSalesRepChange,
  onCustomerChange,
  onProductChange,
  regions = ['North America', 'South America', 'Europe & Africa'],
  salesReps = [],
  customers = [],
  products = [],
  onReset,
  showRegion = true,
  showSalesRep = true,
  showCustomer = true,
  showProduct = true,
}: MultiDimensionFiltersProps) {
  // 检查是否有任何筛选条件被应用
  const hasActiveFilters = selectedRegion !== 'all' || 
                          selectedSalesRep !== 'all' || 
                          selectedCustomer !== 'all' || 
                          selectedProduct !== 'all';

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-gray-700 font-semibold" style={{ fontSize: '14px' }}>多维度筛选</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="ml-auto h-7 px-3 text-gray-600 hover:text-orange-600"
            style={{ fontSize: '12px' }}
          >
            <X className="w-3 h-3 mr-1" />
            清除筛选
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {/* 区域筛选 */}
        {showRegion && (
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>
              区域
            </label>
            <Select value={selectedRegion} onValueChange={onRegionChange}>
              <SelectTrigger className="h-9 bg-white border-gray-300" style={{ fontSize: '12px' }}>
                <SelectValue placeholder="全部区域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部区域</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region} style={{ fontSize: '12px' }}>
                    {region === 'North America' ? '北美' : 
                     region === 'South America' ? '南美' : 
                     region === 'Europe & Africa' ? '欧非' : region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 业务员筛选 */}
        {showSalesRep && (
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>
              业务员
            </label>
            <Select value={selectedSalesRep} onValueChange={onSalesRepChange}>
              <SelectTrigger className="h-9 bg-white border-gray-300" style={{ fontSize: '12px' }}>
                <SelectValue placeholder="全部业务员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部业务员</SelectItem>
                {salesReps.map((rep) => (
                  <SelectItem key={rep} value={rep} style={{ fontSize: '12px' }}>
                    {rep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 客户筛选 */}
        {showCustomer && (
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>
              客户
            </label>
            <Select value={selectedCustomer} onValueChange={onCustomerChange}>
              <SelectTrigger className="h-9 bg-white border-gray-300" style={{ fontSize: '12px' }}>
                <SelectValue placeholder="全部客户" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部客户</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer} value={customer} style={{ fontSize: '12px' }}>
                    {customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 产品筛选 */}
        {showProduct && (
          <div>
            <label className="block text-gray-600 mb-1.5" style={{ fontSize: '12px' }}>
              产品
            </label>
            <Select value={selectedProduct} onValueChange={onProductChange}>
              <SelectTrigger className="h-9 bg-white border-gray-300" style={{ fontSize: '12px' }}>
                <SelectValue placeholder="全部产品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部产品</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product} value={product} style={{ fontSize: '12px' }}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 已应用筛选标签 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          <span className="text-gray-500" style={{ fontSize: '11px' }}>已应用:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedRegion !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded" style={{ fontSize: '11px' }}>
                区域: {selectedRegion === 'North America' ? '北美' : 
                       selectedRegion === 'South America' ? '南美' : 
                       selectedRegion === 'Europe & Africa' ? '欧非' : selectedRegion}
              </div>
            )}
            {selectedSalesRep !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded" style={{ fontSize: '11px' }}>
                业务员: {selectedSalesRep}
              </div>
            )}
            {selectedCustomer !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded" style={{ fontSize: '11px' }}>
                客户: {selectedCustomer}
              </div>
            )}
            {selectedProduct !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded" style={{ fontSize: '11px' }}>
                产品: {selectedProduct}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
