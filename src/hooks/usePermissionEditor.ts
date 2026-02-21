import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  UserRole,
  BusinessModule,
  ModulePermission,
  ROLE_PERMISSION_MATRIX,
  ROLE_LABELS,
  BUSINESS_MODULES,
} from '../lib/rbac-ultimate-config';

export function usePermissionEditor() {
  // 🔥 权限编辑状态
  const [editPermissionMatrix, setEditPermissionMatrix] = useState<Record<UserRole, ModulePermission[]>>(
    JSON.parse(JSON.stringify(ROLE_PERMISSION_MATRIX)) // 深拷贝
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [editingModule, setEditingModule] = useState<BusinessModule | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 🔥 打开权限编辑对话框
  const openEditDialog = (role: UserRole, module: BusinessModule) => {
    setEditingRole(role);
    setEditingModule(module);
    setIsEditDialogOpen(true);
  };

  // 🔥 保存单个权限配置
  const savePermission = (permission: ModulePermission) => {
    if (!editingRole) return;

    setEditPermissionMatrix(prev => {
      const newMatrix = { ...prev };
      const rolePerms = [...newMatrix[editingRole]];
      const existingIndex = rolePerms.findIndex(p => p.module === permission.module);

      if (existingIndex >= 0) {
        // 更新现有权限
        rolePerms[existingIndex] = permission;
      } else {
        // 添加新权限
        rolePerms.push(permission);
      }

      newMatrix[editingRole] = rolePerms;
      return newMatrix;
    });

    setHasUnsavedChanges(true);
  };

  // 🔥 保存所有更改（应用到系统）
  const saveAllChanges = () => {
    // 注意：在真实系统中，这里应该调用API保存到后端
    // 这里我们只是模拟保存并显示提示
    const totalChanges = Object.keys(editPermissionMatrix).reduce((count, role) => {
      const original = ROLE_PERMISSION_MATRIX[role as UserRole];
      const edited = editPermissionMatrix[role as UserRole];
      return count + (JSON.stringify(original) !== JSON.stringify(edited) ? 1 : 0);
    }, 0);

    toast.success('权限配置已保存', {
      description: `成功保存 ${totalChanges} 个角色的权限配置到系统`,
    });

    setHasUnsavedChanges(false);
  };

  // 🔥 重置所有更改
  const resetChanges = () => {
    setEditPermissionMatrix(JSON.parse(JSON.stringify(ROLE_PERMISSION_MATRIX)));
    setHasUnsavedChanges(false);
    toast.info('已重置所有更改', { description: '权限配置已恢复到原始状态' });
  };

  // 🔥 获取当前编辑的权限
  const getCurrentPermission = (): ModulePermission | null => {
    if (!editingRole || !editingModule) return null;
    return editPermissionMatrix[editingRole].find(p => p.module === editingModule) || null;
  };

  return {
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
  };
}
