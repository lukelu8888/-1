import React, { useState, useEffect } from 'react';
import { Check, X, Save, RotateCcw, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';

// 🔥 所有可用的角色
const ALL_ROLES = [
  { id: 'CEO', label: 'CEO', color: 'purple' },
  { id: 'CFO', label: 'CFO', color: 'blue' },
  { id: 'Sales_Manager', label: '销售总监', color: 'green' },
  { id: 'Regional_Manager', label: '区域主管', color: 'teal' },
  { id: 'Sales_Rep', label: '业务员', color: 'cyan' },
  { id: 'Finance', label: '财务专员', color: 'indigo' },
  { id: 'Procurement', label: '采购专员', color: 'orange' },
  { id: 'Marketing_Ops', label: '运营专员', color: 'pink' },
  { id: 'Admin', label: '系统管理员', color: 'gray' }
];

// 🔥 所有菜单模块（与AdminDashboard中的menuItems一致）
const ALL_MENU_MODULES = [
  { id: 'overview', label: '工作台', category: '核心模块' },
  { id: 'crm', label: '客户关系管理（CRM）', category: '业务模块' },
  { id: 'public-pool', label: '公海客户池', category: '业务模块' },
  { id: 'order-management-center', label: '订单管理中心', category: '业务模块' },
  { id: 'shipping-document-management', label: '发货管理', category: '业务模块' },
  { id: 'analytics', label: 'CEO战略驾驶舱/CFO财务管控中心', category: '决策模块' },
  { id: 'global-bi-dashboard', label: '全局BI仪表盘', category: '决策模块' },
  // 🔥 已删除：智能流程引擎模块（smart-workflow-engine）
  // { id: 'smart-workflow-engine', label: '智能流程引擎', category: '业务模块' },
  // 🔥 移除：业务流程编辑器 Pro（已废弃）
  // { id: 'workflow-editor', label: '业务流程编辑器 Pro', category: '技术模块' },
  { id: 'workflow-validation', label: '工作流验证中心', category: '技术模块' },
  { id: 'form-manager', label: '表单管理中心', category: '技术模块' },
  { id: 'status-flow-simulator', label: '状态流转模拟器', category: '技术模块' },
  { id: 'product-management', label: '产品管理', category: '运营模块' },
  { id: 'product-push', label: '产品推送', category: '运营模块' },
  { id: 'messaging', label: '消息中心', category: '核心模块' },
  { id: 'social-media-marketing', label: '社交媒体营销', category: '运营模块' },
  // 🔥 已删除：order-flow-center - 业务流程中心模块
  { id: 'finance-management', label: '财务管理', category: '财务模块' },
  { id: 'role-permission', label: '角色权限管理', category: '系统管理' },
  { id: 'enterprise-backup-center', label: '企业级备份中心', category: '系统管理' },
  { id: 'supabase-diagnostic', label: 'Supabase诊断面板', category: '系统管理' },
  { id: 'supplier-management', label: '供应商管理', category: '供应链模块' },
  { id: 'service-provider-management', label: '服务商管理', category: '供应链模块' },
  { id: 'multi-language-currency', label: '多语言/多货币', category: '系统管理' },
  { id: 'sales-forecasting-targets-pro-max', label: '销售预测与目标 Pro Max', category: '业务模块' },
];

// 🔥 默认权限配置（基于现有rbac-config.ts）
const DEFAULT_PERMISSIONS: { [role: string]: string[] } = {
  CEO: [
    'overview', 'crm', 'order-management-center', 'shipping-document-management', 
    'analytics', 'global-bi-dashboard',
    'finance-management', 'role-permission', 'enterprise-backup-center', 'supabase-diagnostic',
    'supplier-management', 'service-provider-management', 'messaging',
    'multi-language-currency', 'sales-forecasting-targets-pro-max'
  ],
  CFO: [
    'overview', 'analytics', 'finance-management', 'supplier-management', 
    'service-provider-management', 'messaging',
    'enterprise-backup-center'
  ],
  Sales_Manager: [
    'overview', 'crm', 'public-pool', 'order-management-center', 'shipping-document-management',
    'analytics', 'global-bi-dashboard',
    'messaging', 'sales-forecasting-targets-pro-max'
  ],
  Regional_Manager: [
    'overview', 'crm', 'public-pool', 'order-management-center', 'shipping-document-management',
    'analytics',
    'messaging',
    'sales-forecasting-targets-pro-max'
  ],
  Sales_Rep: [
    'overview', 'crm', 'public-pool', 'order-management-center',
    'messaging', 
    'sales-forecasting-targets-pro-max'
  ],
  Finance: [
    'overview', 'finance-management', 'supplier-management', 'service-provider-management',
    'messaging', 'enterprise-backup-center'
  ],
  Procurement: [
    'overview', 'supplier-management', 'service-provider-management', 
    'shipping-document-management', 'messaging', 'enterprise-backup-center'
  ],
  Marketing_Ops: [
    'overview', 'public-pool', 'product-management', 'product-push', 'social-media-marketing',
    'messaging', 'enterprise-backup-center'
  ],
  Admin: [
    'overview', 'workflow-validation', 'form-manager',
    'status-flow-simulator', 'role-permission', 'enterprise-backup-center',
    'supabase-diagnostic', 'multi-language-currency', 'messaging'
  ]
};

export default function MenuPermissionMatrix() {
  const [permissions, setPermissions] = useState<{ [role: string]: string[] }>(DEFAULT_PERMISSIONS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [roleOrder, setRoleOrder] = useState<string[]>(ALL_ROLES.map(r => r.id)); // 🔥 角色列顺序
  const [draggedRoleId, setDraggedRoleId] = useState<string | null>(null); // 🔥 正在拖动的角色

  // 🔥 从localStorage加载保存的配置
  useEffect(() => {
    const saved = localStorage.getItem('menuPermissionMatrix');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPermissions(parsed);
        console.log('✅ 菜单权限配置已加载:', parsed);
      } catch (e) {
        console.error('❌ 加载菜单权限配置失败:', e);
      }
    }
    
    // 🔥 加载角色列顺序
    const savedOrder = localStorage.getItem('menuPermissionRoleOrder');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        setRoleOrder(parsed);
        console.log('✅ 角色列顺序已加载:', parsed);
      } catch (e) {
        console.error('❌ 加载角色列顺序失败:', e);
      }
    }
  }, []);

  // 🔥 切换某个角色对某个模块的访问权限
  const togglePermission = (roleId: string, moduleId: string) => {
    setPermissions(prev => {
      const rolePerms = prev[roleId] || [];
      const hasPermission = rolePerms.includes(moduleId);
      
      const newRolePerms = hasPermission
        ? rolePerms.filter(id => id !== moduleId)
        : [...rolePerms, moduleId];
      
      const newPermissions = {
        ...prev,
        [roleId]: newRolePerms
      };
      
      setHasChanges(true);
      return newPermissions;
    });
  };

  // 🔥 保存配置到localStorage
  const handleSave = () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('menuPermissionMatrix', JSON.stringify(permissions));
      console.log('✅ 菜单权限配置已保存:', permissions);
      
      setSaveStatus('success');
      setHasChanges(false);
      
      // 2秒后重置状态
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // 🔥 触发全局刷新事件，让AdminDashboard重新加载菜单
      window.dispatchEvent(new Event('menuPermissionsUpdated'));
    } catch (e) {
      console.error('❌ 保存菜单权限配置失败:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 🔥 重置为默认配置
  const handleReset = () => {
    if (confirm('确定要重置为默认配置吗？所有自定义设置将丢失。')) {
      setPermissions(DEFAULT_PERMISSIONS);
      setRoleOrder(ALL_ROLES.map(r => r.id)); // 🔥 也重置角色顺序
      setHasChanges(true);
    }
  };

  // 🔥 导出配置为JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(permissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `menu-permissions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 🔥 导入配置
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setPermissions(imported);
          setHasChanges(true);
          alert('✅ 配置导入成功！请点击保存按钮。');
        } catch (e) {
          alert('❌ 导入失败：文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // 🔥 按类别分组模块
  const modulesByCategory = ALL_MENU_MODULES.reduce((acc, module) => {
    const category = module.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as { [category: string]: typeof ALL_MENU_MODULES });

  // 🔥 拖放事件处理 - 开始拖动
  const handleDragStart = (roleId: string) => {
    setDraggedRoleId(roleId);
  };

  // 🔥 拖放事件处理 - 拖动经过
  const handleDragOver = (e: React.DragEvent, targetRoleId: string) => {
    e.preventDefault();
    
    if (!draggedRoleId || draggedRoleId === targetRoleId) return;
    
    const draggedIndex = roleOrder.indexOf(draggedRoleId);
    const targetIndex = roleOrder.indexOf(targetRoleId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // 交换位置
    const newOrder = [...roleOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedRoleId);
    
    setRoleOrder(newOrder);
  };

  // 🔥 拖放事件处理 - 结束拖动
  const handleDragEnd = () => {
    setDraggedRoleId(null);
    
    // 保存角色列顺序到localStorage
    localStorage.setItem('menuPermissionRoleOrder', JSON.stringify(roleOrder));
    console.log('✅ 角色列顺序已保存:', roleOrder);
  };

  return (
    <div className="space-y-4">
      {/* 🎯 标题和操作栏 - 紧凑型 */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl text-gray-900 mb-1">菜单权限配置矩阵</h2>
            <p className="text-xs text-gray-600">
              通过勾选配置各角色在左侧菜单栏中可见的模块，配置后请点击"保存配置"生效
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              导出配置
            </Button>
            <Button
              onClick={handleImport}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              导入配置
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置默认
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === 'saving'}
              className="gap-1.5 bg-[#F96302] hover:bg-[#E05502] h-8 text-xs"
              size="sm"
            >
              {saveStatus === 'saving' ? (
                <>正在保存...</>
              ) : saveStatus === 'success' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  保存成功
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  保存失败
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  保存配置 {hasChanges && '*'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 🔥 提示信息 - 紧凑型 */}
        {hasChanges && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-orange-800">
              <span className="font-semibold">配置已修改但未保存</span>
              <span className="text-orange-700 ml-2">请点击右上角"保存配置"按钮使修改生效</span>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 权限配置矩阵表格 - 冻结表头 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] relative">
          <table className="w-full border-collapse">
            {/* 表头：角色列表 - 🔥 使用sticky冻结 */}
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-700 to-slate-800">
                <th className="sticky left-0 z-40 bg-slate-800 text-white px-3 py-2.5 text-left border-r border-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">模块/角色</span>
                  </div>
                </th>
                {roleOrder.map(roleId => {
                  const role = ALL_ROLES.find(r => r.id === roleId);
                  if (!role) return null;
                  const isDragging = draggedRoleId === role.id;
                  return (
                    <th
                      key={role.id}
                      className={`text-white px-2 py-2.5 text-center border-r border-slate-600 min-w-[90px] cursor-move transition-all ${
                        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(role.id)}
                      onDragOver={(e) => handleDragOver(e, role.id)}
                      onDragEnd={handleDragEnd}
                      title="拖动以调整列顺序"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-base font-semibold">{role.label}</span>
                        <span className="text-xs text-slate-300">{role.id}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* 表格内容：按类别分组的模块 */}
            <tbody>
              {Object.entries(modulesByCategory).map(([category, modules], categoryIdx) => (
                <React.Fragment key={category}>
                  {/* 类别标题行 */}
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-200">
                    <td
                      colSpan={ALL_ROLES.length + 1}
                      className="px-4 py-2 text-sm font-bold text-slate-700 border-b border-slate-300"
                    >
                      📂 {category}
                    </td>
                  </tr>

                  {/* 该类别下的所有模块 */}
                  {modules.map((module, moduleIdx) => (
                    <tr
                      key={module.id}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        moduleIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* 模块名称 */}
                      <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">
                        {module.label}
                      </td>

                      {/* 各角色的权限勾选框 */}
                      {roleOrder.map(roleId => {
                        const role = ALL_ROLES.find(r => r.id === roleId);
                        if (!role) return null;
                        const hasAccess = permissions[role.id]?.includes(module.id) || false;
                        
                        return (
                          <td
                            key={role.id}
                            className="px-3 py-3 text-center border-r border-gray-200"
                          >
                            <button
                              onClick={() => togglePermission(role.id, module.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                hasAccess
                                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-400'
                              }`}
                              title={hasAccess ? '点击取消访问权限' : '点击授予访问权限'}
                            >
                              {hasAccess ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <X className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔥 统计信息 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">各角色权限统计</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {ALL_ROLES.map(role => {
            const count = permissions[role.id]?.length || 0;
            const total = ALL_MENU_MODULES.length;
            const percentage = Math.round((count / total) * 100);
            
            return (
              <div
                key={role.id}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200"
              >
                <p className="text-sm font-semibold text-gray-900 mb-2">{role.label}</p>
                <p className="text-2xl font-bold text-[#F96302] mb-1">{count}</p>
                <p className="text-xs text-gray-600">模块数 ({percentage}%)</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#F96302] h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}