import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';
import {
  UserRole,
  BusinessModule,
  PermissionAction,
  DataScope,
  ROLE_LABELS,
  BUSINESS_MODULES,
  ModulePermission,
  getActionIcon,
  getDataScopeIcon,
} from '../../lib/rbac-ultimate-config';
import { CheckCircle2, Circle } from 'lucide-react';

interface PermissionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
  module: BusinessModule;
  currentPermission: ModulePermission | null;
  onSave: (permission: ModulePermission) => void;
}

// 🔥 13个操作权限选项
const ALL_ACTIONS: { action: PermissionAction; label: string; icon: string }[] = [
  { action: 'view', label: '查看', icon: '✅' },
  { action: 'create', label: '创建', icon: '➕' },
  { action: 'edit', label: '编辑', icon: '✏️' },
  { action: 'delete', label: '删除', icon: '🗑️' },
  { action: 'approve', label: '审批', icon: '✔️' },
  { action: 'export', label: '导出', icon: '📤' },
  { action: 'print', label: '打印', icon: '🖨️' },
  { action: 'manage', label: '管理', icon: '⚙️' },
];

// 🔥 5个数据范围选项
const ALL_DATA_SCOPES: { scope: DataScope; label: string; icon: string }[] = [
  { scope: 'all', label: '全部数据', icon: '🌐' },
  { scope: 'region', label: '区域数据', icon: '🌎' },
  { scope: 'department', label: '部门数据', icon: '🏢' },
  { scope: 'self+subordinates', label: '个人+下属', icon: '👥' },
  { scope: 'self', label: '个人数据', icon: '👤' },
];

export default function PermissionEditDialog({
  open,
  onOpenChange,
  role,
  module,
  currentPermission,
  onSave,
}: PermissionEditDialogProps) {
  const [selectedActions, setSelectedActions] = useState<PermissionAction[]>([]);
  const [selectedDataScope, setSelectedDataScope] = useState<DataScope>('self');

  // 初始化编辑器状态
  useEffect(() => {
    if (currentPermission) {
      setSelectedActions([...currentPermission.actions]);
      setSelectedDataScope(currentPermission.dataScope);
    } else {
      setSelectedActions([]);
      setSelectedDataScope('self');
    }
  }, [currentPermission, open]);

  const toggleAction = (action: PermissionAction) => {
    if (selectedActions.includes(action)) {
      setSelectedActions(selectedActions.filter(a => a !== action));
    } else {
      setSelectedActions([...selectedActions, action]);
    }
  };

  const handleSave = () => {
    const permission: ModulePermission = {
      module,
      actions: selectedActions,
      dataScope: selectedDataScope,
      restrictions: currentPermission?.restrictions || [],
    };

    onSave(permission);
    onOpenChange(false);
    toast.success('权限已更新', {
      description: `${ROLE_LABELS[role].zh} 在 ${BUSINESS_MODULES[module].name} 的权限已更新`,
    });
  };

  const roleLabel = ROLE_LABELS[role];
  const moduleConfig = BUSINESS_MODULES[module];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F96302] flex items-center justify-center text-xl">
              {roleLabel.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>{roleLabel.zh}</span>
                <span className="text-gray-400">→</span>
                <span className="text-xl">{moduleConfig.icon}</span>
                <span>{moduleConfig.name}</span>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            编辑 <strong>{roleLabel.zh}</strong> 在 <strong>{moduleConfig.name}</strong> 模块的权限配置
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 操作权限选择 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">操作权限图例</h3>
              <Badge variant="outline" className="text-xs">
                已选 {selectedActions.length} 项
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {ALL_ACTIONS.map(({ action, label, icon }) => {
                const isSelected = selectedActions.includes(action);
                return (
                  <button
                    key={action}
                    onClick={() => toggleAction(action)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-[#F96302] bg-orange-50 text-[#F96302]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 flex-shrink-0 text-gray-300" />
                    )}
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 数据范围选择 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">数据范围图例</h3>
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                {ALL_DATA_SCOPES.find(s => s.scope === selectedDataScope)?.label}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {ALL_DATA_SCOPES.map(({ scope, label, icon }) => {
                const isSelected = selectedDataScope === scope;
                return (
                  <button
                    key={scope}
                    onClick={() => setSelectedDataScope(scope)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 flex-shrink-0 text-gray-300" />
                    )}
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 预览 */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-700 mb-2">配置预览</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">操作权限:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedActions.length > 0 ? (
                    selectedActions.map(action => (
                      <Badge key={action} variant="secondary" className="text-xs">
                        {getActionIcon(action)} {action}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs">未选择任何操作权限</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">数据范围:</span>
                <Badge variant="outline" className="text-xs">
                  {getDataScopeIcon(selectedDataScope)} {selectedDataScope}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#F96302] hover:bg-[#e55802] text-white"
          >
            保存权限配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}