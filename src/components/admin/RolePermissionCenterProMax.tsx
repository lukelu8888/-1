import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, Search, Download, Filter, Eye, Edit, Trash2, 
  Check, Minus, Plus, Settings, ChevronDown, ChevronUp,
  Lock, Unlock, AlertCircle, Info, Zap, Database,
  BarChart3, FileText, CheckCircle2, Users, Crown,
  Copy, RefreshCw, Save, X, GripVertical
} from 'lucide-react';
import {
  UserRole, BusinessModule, PermissionAction, DataScope,
  ROLE_LABELS, BUSINESS_MODULES, ROLE_PERMISSION_MATRIX,
  hasPermission, getAccessibleModules, getDataScope,
  getActionIcon, getDataScopeIcon, ModulePermission
} from '../../lib/rbac-ultimate-config';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner@2.0.3';
import { Progress } from '../ui/progress';
import PermissionEditDialog from './PermissionEditDialog';
import { usePermissionEditor } from '../../hooks/usePermissionEditor';

// 🔥 本地存储的key
const STORAGE_KEY_ROLE_ORDER = 'rbac_role_order';
const STORAGE_KEY_MODULE_ORDER = 'rbac_module_order';

export default function RolePermissionCenterProMax() {
  const [viewMode, setViewMode] = useState<'matrix' | 'roles' | 'modules' | 'compare'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ceo');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<BusinessModule>>(new Set());
  const [filterAction, setFilterAction] = useState<PermissionAction | 'all'>('all');
  const [roleOrder, setRoleOrder] = useState<UserRole[]>(Object.keys(ROLE_PERMISSION_MATRIX) as UserRole[]); // 🔥 角色顺序
  const [draggedRole, setDraggedRole] = useState<UserRole | null>(null); // 🔥 拖拽的角色
  const [moduleOrder, setModuleOrder] = useState<BusinessModule[]>(Object.keys(BUSINESS_MODULES) as BusinessModule[]); // 🔥 模块顺序
  const [draggedModule, setDraggedModule] = useState<BusinessModule | null>(null); // 🔥 拖拽的模块
  
  // 🔥 权限编辑功能 - 使用自定义Hook
  const {
    editPermissionMatrix,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editingRole,
    editingModule,
    hasUnsavedChanges,
    openEditDialog,
    savePermission,
    saveAllChanges,
    resetChanges,
    getCurrentPermission,
  } = usePermissionEditor();

  // 获取角色颜色
  const getRoleColor = (role: UserRole) => {
    const color = ROLE_LABELS[role].color;
    return `bg-${color}-100 text-${color}-700 border-${color}-300`;
  };

  // 获取模块颜色
  const getModuleColor = (module: BusinessModule) => {
    const color = BUSINESS_MODULES[module].color;
    return `bg-${color}-50 border-${color}-200 text-${color}-700`;
  };

  // 切换模块展开
  const toggleModule = (module: BusinessModule) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  // 全部展开/折叠
  const toggleAllModules = (expand: boolean) => {
    if (expand) {
      setExpandedModules(new Set(Object.keys(BUSINESS_MODULES) as BusinessModule[]));
    } else {
      setExpandedModules(new Set());
    }
  };

  // 导出权限矩阵
  const exportPermissionMatrix = () => {
    const roles = Object.keys(ROLE_PERMISSION_MATRIX) as UserRole[];
    const modules = Object.keys(BUSINESS_MODULES) as BusinessModule[];
    
    const headers = ['模块', '子模块', ...roles.map(r => ROLE_LABELS[r].zh)];
    const rows: string[] = [];
    
    modules.forEach(module => {
      const moduleConfig = BUSINESS_MODULES[module];
      rows.push([moduleConfig.name, '', ...roles.map(role => {
        const perm = ROLE_PERMISSION_MATRIX[role].find(p => p.module === module);
        return perm ? perm.actions.join(',') : '无';
      })].join(','));
      
      moduleConfig.subModules.forEach(sub => {
        rows.push(['', sub.name, ...roles.map(() => '')].join(','));
      });
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `THE_COSUN_BM_权限矩阵_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('权限矩阵已导出', { description: '已下载为CSV文件' });
  };

  // 复制角色权限
  const copyRolePermissions = (role: UserRole) => {
    const permissions = ROLE_PERMISSION_MATRIX[role];
    let text = `${ROLE_LABELS[role].zh} 权限配置\n\n`;
    
    permissions.forEach(perm => {
      const module = BUSINESS_MODULES[perm.module];
      text += `${module.icon} ${module.name}\n`;
      text += `  操作: ${perm.actions.map(a => getActionIcon(a) + a).join(', ')}\n`;
      text += `  范围: ${getDataScopeIcon(perm.dataScope)} ${perm.dataScope}\n`;
      if (perm.restrictions) {
        text += `  限制: ${perm.restrictions.join(', ')}\n`;
      }
      text += '\n';
    });
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      toast.success('权限已复制', { description: `已复制${ROLE_LABELS[role].zh}的完整权限配置` });
    } catch (err) {
      textArea.remove();
      toast.error('复制失败');
    }
  };

  // 获取角色统计
  const getRoleStats = (role: UserRole) => {
    const permissions = ROLE_PERMISSION_MATRIX[role];
    const totalModules = permissions.filter(p => p.actions.length > 0).length;
    const totalActions = permissions.reduce((sum, p) => sum + p.actions.length, 0);
    const viewCount = permissions.filter(p => p.actions.includes('view')).length;
    const editCount = permissions.filter(p => p.actions.includes('edit')).length;
    const deleteCount = permissions.filter(p => p.actions.includes('delete')).length;
    const approveCount = permissions.filter(p => p.actions.includes('approve')).length;
    
    return { totalModules, totalActions, viewCount, editCount, deleteCount, approveCount };
  };

  // 🔥 拖拽处理函数
  const handleDragStart = (role: UserRole) => {
    setDraggedRole(role);
  };

  const handleDragOver = (e: React.DragEvent, targetRole: UserRole) => {
    e.preventDefault();
    if (!draggedRole || draggedRole === targetRole) return;
    
    const draggedIndex = roleOrder.indexOf(draggedRole);
    const targetIndex = roleOrder.indexOf(targetRole);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...roleOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedRole);
    
    setRoleOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedRole(null);
  };

  // 🔥 模块拖拽处理函数
  const handleModuleDragStart = (module: BusinessModule) => {
    setDraggedModule(module);
  };

  const handleModuleDragOver = (e: React.DragEvent, targetModule: BusinessModule) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedModule || draggedModule === targetModule) return;
    
    const draggedIndex = moduleOrder.indexOf(draggedModule);
    const targetIndex = moduleOrder.indexOf(targetModule);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...moduleOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedModule);
    
    setModuleOrder(newOrder);
  };

  const handleModuleDragEnd = () => {
    setDraggedModule(null);
  };

  const allRoles = Object.keys(ROLE_PERMISSION_MATRIX) as UserRole[];
  const allModules = Object.keys(BUSINESS_MODULES) as BusinessModule[];

  // 🔥 初始化：从localStorage加载保存的顺序
  useEffect(() => {
    try {
      const savedRoleOrder = localStorage.getItem(STORAGE_KEY_ROLE_ORDER);
      if (savedRoleOrder) {
        const parsed = JSON.parse(savedRoleOrder) as UserRole[];
        // 验证数据有效性
        if (Array.isArray(parsed) && parsed.length === allRoles.length) {
          setRoleOrder(parsed);
        }
      }

      const savedModuleOrder = localStorage.getItem(STORAGE_KEY_MODULE_ORDER);
      if (savedModuleOrder) {
        const parsed = JSON.parse(savedModuleOrder) as BusinessModule[];
        // 验证数据有效性
        if (Array.isArray(parsed) && parsed.length === allModules.length) {
          setModuleOrder(parsed);
        }
      }
    } catch (error) {
      console.error('加载拖拽顺序失败:', error);
    }
  }, []); // 只在组件挂载时执行一次

  // 🔥 自动保存：角色顺序变化时保存到localStorage
  useEffect(() => {
    if (roleOrder.length === allRoles.length) {
      try {
        localStorage.setItem(STORAGE_KEY_ROLE_ORDER, JSON.stringify(roleOrder));
      } catch (error) {
        console.error('保存角色顺序失败:', error);
      }
    }
  }, [roleOrder]);

  // 🔥 自动保存：模块顺序变化时保存到localStorage
  useEffect(() => {
    if (moduleOrder.length === allModules.length) {
      try {
        localStorage.setItem(STORAGE_KEY_MODULE_ORDER, JSON.stringify(moduleOrder));
      } catch (error) {
        console.error('保存模块顺序失败:', error);
      }
    }
  }, [moduleOrder]);

  // 🔥 重置顺序为默认值
  const resetOrder = () => {
    const defaultRoleOrder = Object.keys(ROLE_PERMISSION_MATRIX) as UserRole[];
    const defaultModuleOrder = Object.keys(BUSINESS_MODULES) as BusinessModule[];
    
    setRoleOrder(defaultRoleOrder);
    setModuleOrder(defaultModuleOrder);
    
    localStorage.removeItem(STORAGE_KEY_ROLE_ORDER);
    localStorage.removeItem(STORAGE_KEY_MODULE_ORDER);
    
    toast.success('已重置顺序', { description: '角色和模块顺序已恢复默认' });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-[#F96302] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F96302] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>
                  角色权限管理中心
                </h2>
                <Badge variant="outline" className="h-5 px-2 text-xs bg-gradient-to-r from-[#F96302] to-red-500 text-white border-0">
                  Pro Max版
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                四维权限模型 · 14个角色 · 10大模块 · 企业级权限管理
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetOrder}
              className="h-8 px-3 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
              title="重置角色和模块顺序为默认"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              重置顺序
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPermissionMatrix}
              className="h-8 px-3 text-xs border-[#F96302] text-[#F96302] hover:bg-orange-50"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              导出矩阵
            </Button>
          </div>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">角色总数</p>
                <p className="text-2xl font-bold text-blue-900">{allRoles.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium mb-1">业务模块</p>
                <p className="text-2xl font-bold text-green-900">{allModules.length}</p>
              </div>
              <Database className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700 font-medium mb-1">操作类型</p>
                <p className="text-2xl font-bold text-purple-900">8</p>
              </div>
              <Settings className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-700 font-medium mb-1">数据范围</p>
                <p className="text-2xl font-bold text-orange-900">5</p>
              </div>
              <Eye className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
          <TabsTrigger value="matrix" className="data-[state=active]:bg-[#F96302] data-[state=active]:text-white">
            <Database className="w-4 h-4 mr-2" />
            权限矩阵
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-[#F96302] data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            角色详情
          </TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:bg-[#F96302] data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            模块视图
          </TabsTrigger>
          <TabsTrigger value="compare" className="data-[state=active]:bg-[#F96302] data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" />
            角色对比
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 权限矩阵 */}
        <TabsContent value="matrix" className="space-y-4 mt-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              💡 <strong>权限矩阵总览</strong>：展示所有14个角色在10大业务模块的完整权限配置
            </AlertDescription>
          </Alert>

          {/* 搜索和筛选 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索模块或角色..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={filterAction} onValueChange={(v) => setFilterAction(v as any)}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="筛选操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部操作</SelectItem>
                <SelectItem value="view" className="text-xs">✅ 查看</SelectItem>
                <SelectItem value="create" className="text-xs">➕ 创建</SelectItem>
                <SelectItem value="edit" className="text-xs">✏️ 编辑</SelectItem>
                <SelectItem value="delete" className="text-xs">🗑️ 删除</SelectItem>
                <SelectItem value="approve" className="text-xs">✔️ 审批</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleAllModules(true)} className="h-9 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                全部展开
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleAllModules(false)} className="h-9 text-xs">
                <Minus className="w-3.5 h-3.5 mr-1" />
                全部折叠
              </Button>
            </div>
          </div>

          {/* 权限矩阵表格 */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gradient-to-r from-orange-50 to-red-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 sticky left-0 bg-orange-50 z-10 min-w-[180px]">
                        业务模块
                      </th>
                      {roleOrder.map(role => {
                        const isDragging = draggedRole === role;
                        return (
                          <th 
                            key={role} 
                            className={`text-center py-3 px-2 min-w-[100px] cursor-move transition-all ${
                              isDragging ? 'opacity-50 scale-95' : 'opacity-100'
                            }`}
                            draggable
                            onDragStart={() => handleDragStart(role)}
                            onDragOver={(e) => handleDragOver(e, role)}
                            onDragEnd={handleDragEnd}
                            title="拖动以调整列顺序"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-2xl">{ROLE_LABELS[role].icon}</span>
                              <span className="text-xs font-medium text-gray-700 leading-tight">
                                {ROLE_LABELS[role].zh}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {moduleOrder
                      .filter(module => 
                        !searchTerm || 
                        BUSINESS_MODULES[module].name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        BUSINESS_MODULES[module].nameEn.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((module) => {
                        const moduleConfig = BUSINESS_MODULES[module];
                        const isExpanded = expandedModules.has(module);
                        const isDraggingModule = draggedModule === module;
                        
                        return (
                          <React.Fragment key={module}>
                            {/* 模块行 */}
                            <tr 
                              className={`border-b border-gray-200 hover:bg-blue-50 transition-all ${
                                isDraggingModule ? 'opacity-50 bg-gray-100' : ''
                              }`}
                              draggable
                              onDragStart={() => handleModuleDragStart(module)}
                              onDragOver={(e) => handleModuleDragOver(e, module)}
                              onDragEnd={handleModuleDragEnd}
                            >
                              <td 
                                className="py-3 px-2 sticky left-0 bg-white z-10 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <GripVertical 
                                    className="w-4 h-4 text-gray-400 cursor-move flex-shrink-0" 
                                    title="拖动以调整行顺序"
                                  />
                                  <div 
                                    className="flex items-center gap-2 flex-1"
                                    onClick={() => toggleModule(module)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-lg">{moduleConfig.icon}</span>
                                    <div>
                                      <div className="font-medium text-gray-900">{moduleConfig.name}</div>
                                      <div className="text-[10px] text-gray-500">{moduleConfig.nameEn}</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {roleOrder.map(role => {
                                const perm = editPermissionMatrix[role].find(p => p.module === module);
                                
                                if (!perm || perm.actions.length === 0) {
                                  return (
                                    <td 
                                      key={role} 
                                      className="text-center py-3 px-2 cursor-pointer hover:bg-orange-50 transition-colors"
                                      onClick={() => openEditDialog(role, module)}
                                      title="点击编辑权限"
                                    >
                                      <div className="flex justify-center">
                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-orange-100">
                                          <X className="w-4 h-4 text-gray-400" />
                                        </div>
                                      </div>
                                    </td>
                                  );
                                }
                                
                                return (
                                  <td 
                                    key={role} 
                                    className="text-center py-3 px-2 cursor-pointer hover:bg-orange-50 transition-colors group"
                                    onClick={() => openEditDialog(role, module)}
                                    title="点击编辑权限"
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex flex-wrap justify-center gap-0.5">
                                        {perm.actions.map(action => (
                                          <span key={action} className="text-sm" title={action}>
                                            {getActionIcon(action)}
                                          </span>
                                        ))}
                                      </div>
                                      <div className="text-[9px] text-gray-500" title={`数据范围: ${perm.dataScope}`}>
                                        {getDataScopeIcon(perm.dataScope)}
                                      </div>
                                      <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                            
                            {/* 子模块行 */}
                            {isExpanded && moduleConfig.subModules.map(sub => (
                              <tr key={sub.id} className="border-b border-gray-100 bg-gray-50">
                                <td className="py-2 px-4 pl-12 sticky left-0 bg-gray-50 z-10">
                                  <div className="text-xs text-gray-600">
                                    {sub.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    {sub.nameEn}
                                  </div>
                                </td>
                                {roleOrder.map(role => (
                                  <td key={role} className="text-center py-2 px-2">
                                    <span className="text-[10px] text-gray-400">-</span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 角色详情 */}
        <TabsContent value="roles" className="space-y-4 mt-4">
          <Alert className="bg-purple-50 border-purple-200">
            <Users className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800 text-xs">
              👥 <strong>角色详情视图</strong>：选择角色查看其完整的权限配置和数据范围（可拖拽调整顺序）
            </AlertDescription>
          </Alert>

          {/* 🔥 可拖拽的角色选择条 */}
          <Card className="bg-white border-gray-200">
            <CardContent className="p-3">
              <div className="overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {roleOrder.map(role => {
                    const isSelected = selectedRole === role;
                    const isDragging = draggedRole === role;
                    return (
                      <div
                        key={role}
                        draggable
                        onDragStart={() => handleDragStart(role)}
                        onDragOver={(e) => handleDragOver(e, role)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedRole(role)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 cursor-pointer transition-all min-w-[80px] ${
                          isDragging 
                            ? 'opacity-50 scale-95' 
                            : isSelected
                            ? 'border-[#F96302] bg-orange-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                        title="点击选择，拖动调整顺序"
                      >
                        <span className="text-3xl">{ROLE_LABELS[role].icon}</span>
                        <span className={`text-xs font-medium text-center leading-tight ${
                          isSelected ? 'text-[#F96302]' : 'text-gray-700'
                        }`}>
                          {ROLE_LABELS[role].zh}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 传统的下拉选择（备用） */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">或使用下拉选择：</span>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
              <SelectTrigger className="w-[300px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allRoles.map(role => (
                  <SelectItem key={role} value={role} className="text-xs">
                    {ROLE_LABELS[role].icon} {ROLE_LABELS[role].zh} ({ROLE_LABELS[role].en})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyRolePermissions(selectedRole)}
              className="h-9 text-xs"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              复制权限
            </Button>
          </div>

          {/* 角色信息卡片 */}
          <Card className="border-2 border-[#F96302]">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#F96302] flex items-center justify-center text-2xl">
                    {ROLE_LABELS[selectedRole].icon}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {ROLE_LABELS[selectedRole].zh}
                      <Badge variant="outline" className="text-xs">
                        {ROLE_LABELS[selectedRole].en}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {ROLE_LABELS[selectedRole].department} · {ROLE_LABELS[selectedRole].level}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(() => {
                    const stats = getRoleStats(selectedRole);
                    return (
                      <>
                        <div className="text-center px-3 py-1 bg-white rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500">模块</div>
                          <div className="text-lg font-bold text-gray-900">{stats.totalModules}</div>
                        </div>
                        <div className="text-center px-3 py-1 bg-white rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500">权限</div>
                          <div className="text-lg font-bold text-gray-900">{stats.totalActions}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {ROLE_PERMISSION_MATRIX[selectedRole].map(perm => {
                  const moduleConfig = BUSINESS_MODULES[perm.module];
                  
                  if (perm.actions.length === 0) return null;
                  
                  return (
                    <div key={perm.module} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{moduleConfig.icon}</span>
                          <div>
                            <div className="font-semibold text-gray-900">{moduleConfig.name}</div>
                            <div className="text-xs text-gray-500">{moduleConfig.nameEn}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getDataScopeIcon(perm.dataScope)} {perm.dataScope}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {perm.actions.map(action => (
                          <Badge key={action} variant="secondary" className="text-xs">
                            {getActionIcon(action)} {action}
                          </Badge>
                        ))}
                      </div>
                      
                      {perm.restrictions && perm.restrictions.length > 0 && (
                        <Alert className="mt-2 bg-amber-50 border-amber-200">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-[11px]">
                            <strong>限制：</strong>{perm.restrictions.join('；')}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* 子模块列表 */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">包含子模块：</div>
                        <div className="flex flex-wrap gap-1.5">
                          {moduleConfig.subModules.map(sub => (
                            <span key={sub.id} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: 模块视图 */}
        <TabsContent value="modules" className="space-y-4 mt-4">
          <Alert className="bg-green-50 border-green-200">
            <BarChart3 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs">
              📊 <strong>模块视图</strong>：以业务模块为视角，查看哪些角色可以访问该模块
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            {allModules.map(module => {
              const moduleConfig = BUSINESS_MODULES[module];
              const rolesWithAccess = allRoles.filter(role => {
                const perm = ROLE_PERMISSION_MATRIX[role].find(p => p.module === module);
                return perm && perm.actions.length > 0;
              });
              
              return (
                <Card key={module} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{moduleConfig.icon}</span>
                      <div>
                        <div className="text-sm">{moduleConfig.name}</div>
                        <div className="text-xs text-gray-500 font-normal">{moduleConfig.nameEn}</div>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-xs">{moduleConfig.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600">可访问角色</span>
                        <Badge variant="secondary">{rolesWithAccess.length}/{allRoles.length}</Badge>
                      </div>
                      <Progress value={(rolesWithAccess.length / allRoles.length) * 100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      {rolesWithAccess.map(role => {
                        const perm = ROLE_PERMISSION_MATRIX[role].find(p => p.module === module)!;
                        return (
                          <div key={role} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span>{ROLE_LABELS[role].icon}</span>
                              <span className="font-medium text-gray-700">{ROLE_LABELS[role].zh}</span>
                            </div>
                            <div className="flex gap-1">
                              {perm.actions.slice(0, 3).map(action => (
                                <span key={action} title={action}>{getActionIcon(action)}</span>
                              ))}
                              {perm.actions.length > 3 && (
                                <span className="text-gray-400 text-[10px]">+{perm.actions.length - 3}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-[10px] text-gray-500 mb-1.5">子模块 ({moduleConfig.subModules.length})</div>
                      <div className="flex flex-wrap gap-1">
                        {moduleConfig.subModules.map(sub => (
                          <span key={sub.id} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] text-gray-600">
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 4: 角色对比 */}
        <TabsContent value="compare" className="space-y-4 mt-4">
          <Alert className="bg-orange-50 border-orange-200">
            <FileText className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-xs">
              🔍 <strong>角色对比</strong>：选择多个角色进行权限对比分析，快速识别权限差异
            </AlertDescription>
          </Alert>

          {/* 角色选择 */}
          <div>
            <div className="text-sm text-gray-700 font-medium mb-2">选择要对比的角色（多选）：</div>
            <div className="grid grid-cols-7 gap-2">
              {allRoles.map(role => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedRoles(selectedRoles.filter(r => r !== role));
                      } else {
                        setSelectedRoles([...selectedRoles, role]);
                      }
                    }}
                    className={`p-2 rounded-lg border-2 text-xs transition-all ${
                      isSelected 
                        ? 'border-[#F96302] bg-orange-50 text-[#F96302]' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{ROLE_LABELS[role].icon}</div>
                    <div className="font-medium leading-tight">{ROLE_LABELS[role].zh}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRoles.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">请至少选择一个角色进行对比</p>
            </div>
          ) : selectedRoles.length === 1 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">请至少选择两个角色进行对比</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300 bg-gradient-to-r from-orange-50 to-red-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 sticky left-0 bg-orange-50 z-10 min-w-[180px]">
                          业务模块
                        </th>
                        {selectedRoles.map(role => (
                          <th key={role} className="text-center py-3 px-3 min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xl">{ROLE_LABELS[role].icon}</span>
                              <span className="text-[10px] font-medium text-gray-700 leading-tight">
                                {ROLE_LABELS[role].zh}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allModules.map(module => {
                        const moduleConfig = BUSINESS_MODULES[module];
                        
                        return (
                          <tr key={module} className="border-b border-gray-200 hover:bg-blue-50">
                            <td className="py-3 px-4 sticky left-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{moduleConfig.icon}</span>
                                <div>
                                  <div className="font-medium text-gray-900 text-xs">{moduleConfig.name}</div>
                                  <div className="text-[10px] text-gray-500">{moduleConfig.nameEn}</div>
                                </div>
                              </div>
                            </td>
                            {selectedRoles.map(role => {
                              const perm = ROLE_PERMISSION_MATRIX[role].find(p => p.module === module);
                              
                              if (!perm || perm.actions.length === 0) {
                                return (
                                  <td key={role} className="text-center py-3 px-3">
                                    <div className="flex justify-center">
                                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                    </div>
                                  </td>
                                );
                              }
                              
                              return (
                                <td key={role} className="py-3 px-3">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap justify-center gap-1">
                                      {perm.actions.map(action => (
                                        <Badge key={action} variant="secondary" className="text-[10px] h-5">
                                          {getActionIcon(action)} {action}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="text-center">
                                      <Badge variant="outline" className="text-[9px] h-4">
                                        {getDataScopeIcon(perm.dataScope)} {perm.dataScope}
                                      </Badge>
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 图例说明 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2">操作权限图例</h4>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <span>✅</span>
                  <span className="text-gray-700">查看</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>➕</span>
                  <span className="text-gray-700">创建</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✏️</span>
                  <span className="text-gray-700">编辑</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🗑️</span>
                  <span className="text-gray-700">删除</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✔️</span>
                  <span className="text-gray-700">审批</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>📤</span>
                  <span className="text-gray-700">导出</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🖨️</span>
                  <span className="text-gray-700">打印</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⚙️</span>
                  <span className="text-gray-700">管理</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2">数据范围图例</h4>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <span>🌐</span>
                  <span className="text-gray-700">全部数据</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🌎</span>
                  <span className="text-gray-700">区域数据</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🏢</span>
                  <span className="text-gray-700">部门数据</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👥</span>
                  <span className="text-gray-700">个人+下属</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👤</span>
                  <span className="text-gray-700">个人数据</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔥 权限编辑对话框 */}
      <PermissionEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        role={editingRole || 'ceo'}
        module={editingModule || 'crm'}
        currentPermission={getCurrentPermission()}
        onSave={savePermission}
      />
    </div>
  );
}