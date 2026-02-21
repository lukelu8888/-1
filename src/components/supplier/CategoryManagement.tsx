import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Plus, Edit, Trash2, Save, X, GripVertical, Package, AlertCircle, RotateCcw, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { loadSupplierCategories, saveSupplierCategories, loadSelectedIndustry, getIndustryTemplate } from '../../data/industryTemplates';
import { toast } from 'sonner@2.0.3';

/**
 * 🔧 产品类别管理
 * - 查看当前所有产品分类
 * - 添加新分类
 * - 编辑分类名称
 * - 删除分类
 * - 调整排序
 * - 🔥 批量导入/导出
 * - 🔥 重置到行业默认
 * - 🔥 使用统计
 */
export default function CategoryManagement() {
  const [categories, setCategories] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false); // 🔥 重置对话框
  const [batchAddDialogOpen, setBatchAddDialogOpen] = useState(false); // 🔥 批量添加对话框
  const [batchCategoriesText, setBatchCategoriesText] = useState(''); // 🔥 批量分类文本

  // 加载数据
  useEffect(() => {
    const loaded = loadSupplierCategories();
    setCategories(loaded);
    
    const industry = loadSelectedIndustry();
    setSelectedIndustry(industry);
  }, []);

  // 添加新分类
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    
    if (!trimmed) {
      toast.error('请输入分类名称');
      return;
    }

    if (categories.includes(trimmed)) {
      toast.error('该分类已存在');
      return;
    }

    const updated = [...categories, trimmed];
    setCategories(updated);
    saveSupplierCategories(updated);
    
    toast.success(`已添加分类：${trimmed}`);
    setNewCategoryName('');
    setAddDialogOpen(false);
  };

  // 开始编辑
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(categories[index]);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const trimmed = editingValue.trim();
    
    if (!trimmed) {
      toast.error('分类名称不能为空');
      return;
    }

    // 检查是否与其他分类重名（排除自己）
    const otherCategories = categories.filter((_, i) => i !== editingIndex);
    if (otherCategories.includes(trimmed)) {
      toast.error('该分类名称已存在');
      return;
    }

    const updated = [...categories];
    updated[editingIndex] = trimmed;
    setCategories(updated);
    saveSupplierCategories(updated);
    
    toast.success('分类名称已更新');
    setEditingIndex(null);
    setEditingValue('');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  // 删除分类
  const handleDeleteCategory = () => {
    if (deletingIndex === null) return;

    const deletedName = categories[deletingIndex];
    const updated = categories.filter((_, i) => i !== deletingIndex);
    setCategories(updated);
    saveSupplierCategories(updated);
    
    toast.success(`已删除分类：${deletedName}`);
    setDeleteDialogOpen(false);
    setDeletingIndex(null);
  };

  // 上移
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    
    const updated = [...categories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCategories(updated);
    saveSupplierCategories(updated);
    
    toast.success('已上移');
  };

  // 下移
  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return;
    
    const updated = [...categories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCategories(updated);
    saveSupplierCategories(updated);
    
    toast.success('已下移');
  };

  const industryTemplate = selectedIndustry ? getIndustryTemplate(selectedIndustry) : null;

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>产品类别管理</h2>
              <p className="text-xs text-gray-500">管理您的产品分类，支持添加、编辑、删除和排序</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            添加新分类
          </Button>
        </div>
      </div>

      {/* 当前行业信息 */}
      {industryTemplate && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{industryTemplate.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>{industryTemplate.name}</h3>
                <Badge className="h-5 px-2 text-xs bg-orange-100 text-orange-800">
                  当前行业
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{industryTemplate.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">分类总数</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          <p className="text-xs text-gray-500 mt-1">个产品分类</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">管理操作</span>
            <Edit className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-sm text-gray-700 mt-3">
            支持自由编辑、删除和排序
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">实时生效</span>
            <Save className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-sm text-gray-700 mt-3">
            修改后立即应用到系统
          </p>
        </div>
      </div>

      {/* 分类列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
            我的产品分类 ({categories.length})
          </h3>
        </div>

        {categories.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {categories.map((category, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {/* 排序按钮 */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${
                        index === 0
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                      title="上移"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === categories.length - 1}
                      className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${
                        index === categories.length - 1
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                      title="下移"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* 序号 */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
                    {index + 1}
                  </div>

                  {/* 分类名称 */}
                  <div className="flex-1">
                    {editingIndex === index ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="h-9"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900" style={{ fontSize: '14px' }}>
                          {category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    {editingIndex === index ? (
                      <>
                        <Button
                          size="sm"
                          className="h-8 px-3 bg-green-600 hover:bg-green-700"
                          onClick={handleSaveEdit}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          保存
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-3 h-3 mr-1" />
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => handleStartEdit(index)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setDeletingIndex(index);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          删除
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">暂无产品分类</p>
            <p className="text-sm text-gray-400 mb-4">点击右上角"添加新分类"按钮开始创建</p>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个分类
            </Button>
          </div>
        )}
      </div>

      {/* 说明信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-blue-800">
            <p className="font-medium mb-2">使用说明：</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>添加分类：</strong>点击右上角"添加新分类"按钮</li>
              <li>• <strong>编辑名称：</strong>点击分类的"编辑"按钮，修改后保存</li>
              <li>• <strong>调整顺序：</strong>使用上下箭头按钮调整分类的显示顺序</li>
              <li>• <strong>删除分类：</strong>点击"删除"按钮（删除后不可恢复，请谨慎操作）</li>
              <li>• <strong>实时生效：</strong>所有修改立即应用到"产品资料库"等模块</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 添加分类对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-600" />
              添加新产品分类
            </DialogTitle>
            <DialogDescription>
              请输入新的产品分类名称
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>分类名称</Label>
            <Input
              placeholder="例如：智能锁、抛光砖、马桶等"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="mt-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleAddCategory}>
              <Plus className="w-4 h-4 mr-2" />
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除分类
            </DialogTitle>
            <DialogDescription>
              此操作不可恢复，请确认是否删除
            </DialogDescription>
          </DialogHeader>

          {deletingIndex !== null && (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">您确定要删除以下分类吗？</p>
                <p className="font-medium text-lg text-red-600">{categories[deletingIndex]}</p>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>注意：</strong>删除分类后，该分类下的产品不会被删除，但需要重新分配分类。
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置确认对话框 */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认重置分类
            </DialogTitle>
            <DialogDescription>
              此操作不可恢复，请确认是否重置到行业默认分类
            </DialogDescription>
          </DialogHeader>

          {industryTemplate && (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">您确定要重置到行业默认分类吗？</p>
                <p className="font-medium text-lg text-red-600">{industryTemplate.name} 默认分类</p>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>注意：</strong>重置分类后，当前分类将被替换为行业默认分类。
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={() => {
              if (industryTemplate) {
                setCategories(industryTemplate.defaultCategories);
                saveSupplierCategories(industryTemplate.defaultCategories);
                toast.success(`已重置到 ${industryTemplate.name} 默认分类`);
              }
              setResetDialogOpen(false);
            }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量添加分类对话框 */}
      <Dialog open={batchAddDialogOpen} onOpenChange={setBatchAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-600" />
              批量添加分类
            </DialogTitle>
            <DialogDescription>
              请输入多个分类名称，每行一个
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>分类名称</Label>
            <Input
              placeholder="例如：智能锁、抛光砖、马桶等"
              value={batchCategoriesText}
              onChange={(e) => setBatchCategoriesText(e.target.value)}
              className="mt-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
              }}
              textarea
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchAddDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => {
              const newCategories = batchCategoriesText.split('\n').map(c => c.trim()).filter(c => c);
              const updated = [...categories, ...newCategories];
              setCategories(updated);
              saveSupplierCategories(updated);
              toast.success(`已添加 ${newCategories.length} 个分类`);
              setBatchAddDialogOpen(false);
              setBatchCategoriesText('');
            }}>
              <Upload className="w-4 h-4 mr-2" />
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}