import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { 
  Table, GripVertical, Plus, Trash2, Edit2, Check, X,
  Type, Hash, Calendar, ToggleLeft, FileText, DollarSign,
  ChevronRight, Save, Download, Upload, Eye, Settings, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { 
  FormTableConfig, 
  ColumnDefinition,
  loadTableColumnConfig, 
  saveTableColumnConfig 
} from '../../config/tableColumnConfig';

export default function TableColumnManager() {
  const [formConfigs, setFormConfigs] = useState<FormTableConfig[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // 🆕 加载状态
  
  // 🆕 列宽拖拽状态
  const [resizingColumnIndex, setResizingColumnIndex] = useState<number | null>(null);
  const [startX, setStartX] = useState<number>(0);
  const [startWidth, setStartWidth] = useState<number>(0);

  // 🆕 预览区拖拽排序状态
  const [previewDraggedIndex, setPreviewDraggedIndex] = useState<number | null>(null);
  const [previewDragOverIndex, setPreviewDragOverIndex] = useState<number | null>(null);

  const selectedForm = formConfigs.find(f => f.formId === selectedFormId);

  // 获取列类型图标
  const getColumnTypeIcon = (type: ColumnDefinition['type']) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'boolean': return <ToggleLeft className="w-4 h-4" />;
      case 'currency': return <DollarSign className="w-4 h-4" />;
      case 'select': return <FileText className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  // 获取列类型颜色
  const getColumnTypeColor = (type: ColumnDefinition['type']) => {
    switch (type) {
      case 'text': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'number': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'date': return 'bg-green-50 text-green-700 border-green-200';
      case 'boolean': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'currency': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'select': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'file': return 'bg-pink-50 text-pink-700 border-pink-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // 拖拽开始
  const handleDragStart = (index: number) => {
    setDraggedColumnIndex(index);
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedColumnIndex(null);
  };

  // 拖拽覆盖
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColumnIndex === null || draggedColumnIndex === index) return;

    const newColumns = [...selectedForm!.columns];
    const draggedColumn = newColumns[draggedColumnIndex];
    newColumns.splice(draggedColumnIndex, 1);
    newColumns.splice(index, 0, draggedColumn);

    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { ...f, columns: newColumns }
        : f
    ));
    setDraggedColumnIndex(index);
  };

  // 添加新列
  const handleAddColumn = () => {
    const newColumn: ColumnDefinition = {
      id: `col_${Date.now()}`,
      name: 'New Column',
      type: 'text',
      width: '150px',
      required: false,
      editable: true
    };

    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { ...f, columns: [...f.columns, newColumn] }
        : f
    ));

    toast.success('✅ 新列已添加', {
      description: '请双击列名进行重命名'
    });
  };

  // 删除列
  const handleDeleteColumn = (columnId: string) => {
    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { ...f, columns: f.columns.filter(c => c.id !== columnId) }
        : f
    ));

    toast.success('✅ 列已删除');
  };

  // 开始编辑列名
  const handleStartEditColumnName = (column: ColumnDefinition) => {
    setEditingColumnId(column.id);
    setEditingColumnName(column.name);
  };

  // 保存列名
  const handleSaveColumnName = () => {
    if (!editingColumnName.trim()) {
      toast.error('❌ 列名不能为空');
      return;
    }

    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { 
            ...f, 
            columns: f.columns.map(c => 
              c.id === editingColumnId 
                ? { ...c, name: editingColumnName }
                : c
            )
          }
        : f
    ));

    setEditingColumnId(null);
    setEditingColumnName('');
    toast.success('✅ 列名已更新');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingColumnId(null);
    setEditingColumnName('');
  };

  // 修改列类型
  const handleChangeColumnType = (columnId: string, newType: ColumnDefinition['type']) => {
    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { 
            ...f, 
            columns: f.columns.map(c => 
              c.id === columnId 
                ? { ...c, type: newType }
                : c
            )
          }
        : f
    ));

    toast.success('✅ 列类型已更新');
  };

  // 🆕 修改列宽度
  const handleChangeColumnWidth = (columnId: string, width: string) => {
    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { 
            ...f, 
            columns: f.columns.map(c => 
              c.id === columnId 
                ? { ...c, width }
                : c
            )
          }
        : f
    ));
  };

  // 🆕 切换必填状态
  const handleToggleRequired = (columnId: string) => {
    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { 
            ...f, 
            columns: f.columns.map(c => 
              c.id === columnId 
                ? { ...c, required: !c.required }
                : c
            )
          }
        : f
    ));

    toast.success('✅ 必填状态已更新');
  };

  // 🆕 切换可编辑状态
  const handleToggleEditable = (columnId: string) => {
    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { 
            ...f, 
            columns: f.columns.map(c => 
              c.id === columnId 
                ? { ...c, editable: !c.editable }
                : c
            )
          }
        : f
    ));

    toast.success('✅ 可编辑状态已更新');
  };

  // 🆕 开始拖拽调整列宽
  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumnIndex(index);
    setStartX(e.clientX);
    setStartWidth(parseInt(selectedForm!.columns[index].width || '150'));
  };

  // 🆕 拖拽调整列宽 - 相对调整模式（不改变总宽度）
  const handleResizeMove = (e: MouseEvent) => {
    if (resizingColumnIndex === null) return;
    
    const currentColumn = selectedForm!.columns[resizingColumnIndex];
    const nextColumn = selectedForm!.columns[resizingColumnIndex + 1];
    
    if (!nextColumn) return; // 如果是最后一列，不调整
    
    const diff = e.clientX - startX;
    const currentWidth = parseInt(currentColumn.width || '150');
    const nextWidth = parseInt(nextColumn.width || '150');
    
    // 计算新宽度，确保两列总和不变
    const newCurrentWidth = Math.max(50, Math.min(currentWidth + nextWidth - 50, currentWidth + diff));
    const newNextWidth = currentWidth + nextWidth - newCurrentWidth;
    
    // 确保下一列也在有效范围内
    if (newNextWidth < 50) return;
    
    // 同时更新两列的宽度
    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { 
            ...f, 
            columns: f.columns.map((c, idx) => {
              if (idx === resizingColumnIndex) {
                return { ...c, width: `${newCurrentWidth}px` };
              }
              if (idx === resizingColumnIndex + 1) {
                return { ...c, width: `${newNextWidth}px` };
              }
              return c;
            })
          }
        : f
    ));
  };

  // 🆕 结束拖拽调整列宽
  const handleResizeEnd = () => {
    setResizingColumnIndex(null);
  };

  // 🆕 监听鼠标移动和释放事件
  React.useEffect(() => {
    if (resizingColumnIndex !== null) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumnIndex, startX, startWidth]);

  // 🆕 预览区拖拽开始
  const handlePreviewDragStart = (index: number) => {
    setPreviewDraggedIndex(index);
  };

  // 🆕 预览区拖拽结束
  const handlePreviewDragEnd = () => {
    setPreviewDraggedIndex(null);
    setPreviewDragOverIndex(null);
  };

  // 🆕 预览区拖拽覆盖
  const handlePreviewDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (previewDraggedIndex === null || previewDraggedIndex === index) return;

    setPreviewDragOverIndex(index);
  };

  // 🆕 预览区拖拽释放
  const handlePreviewDrop = (index: number) => {
    if (previewDraggedIndex === null) return;

    const newColumns = [...selectedForm!.columns];
    const draggedColumn = newColumns[previewDraggedIndex];
    newColumns.splice(previewDraggedIndex, 1);
    newColumns.splice(index, 0, draggedColumn);

    setFormConfigs(formConfigs.map(f => 
      f.formId === selectedFormId 
        ? { ...f, columns: newColumns }
        : f
    ));
    setPreviewDraggedIndex(null);
    setPreviewDragOverIndex(null);
  };

  // 导出配置
  const handleExportConfig = () => {
    const dataStr = JSON.stringify(formConfigs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table-column-config.json';
    link.click();
    
    toast.success('✅ 配置已导出');
  };

  // 保存配置到localStorage
  const handleSaveConfig = () => {
    saveTableColumnConfig(formConfigs);
    toast.success('✅ 配置已保存到本地', {
      description: '刷新页面后配置仍然生效'
    });
  };

  // 加载配置
  useEffect(() => {
    const configs = loadTableColumnConfig();
    if (configs) {
      setFormConfigs(configs);
      setSelectedFormId(configs[0].formId);
    }
    setIsLoading(false); // 🆕 设置加载状态为false
  }, []);

  // 🆕 自动保存配置到localStorage（防抖）
  useEffect(() => {
    if (formConfigs.length === 0) return;
    
    const timer = setTimeout(() => {
      saveTableColumnConfig(formConfigs);
    }, 500); // 500ms防抖
    
    return () => clearTimeout(timer);
  }, [formConfigs]);

  // 🆕 加载中状态
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载表格列配置...</p>
        </div>
      </div>
    );
  }

  // 🆕 没有数据状态
  if (!selectedForm) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Table className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">未找到表单配置</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* 左侧：表单列表 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-600" />
            表单列表
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            选择要管理列标题的表单
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {formConfigs.map((form) => (
            <button
              key={form.formId}
              onClick={() => setSelectedFormId(form.formId)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedFormId === form.formId
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 text-sm">
                  {form.formName}
                </span>
                {selectedFormId === form.formId && (
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {form.columns.length} 列
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* 底部操作按钮 */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleSaveConfig}
          >
            <Save className="w-4 h-4 mr-2" />
            保存配置
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleExportConfig}
          >
            <Download className="w-4 h-4 mr-2" />
            导出配置
          </Button>
        </div>
      </div>

      {/* 右侧：列标题管理 */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {/* 顶部操作栏 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900">
                {selectedForm?.formName} - 列标题管理
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                拖拽列标题可重新排序，拖拽边框可调整宽度，点击最右侧➕按钮添加新列
              </p>
            </div>
          </div>

          {/* 预览表头行 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">实时预览 - 表头行（拖拽列可调整顺序，拖拽列边框可调整宽度）</span>
            </div>
            <div className="bg-white rounded border border-gray-200 overflow-x-auto">
              <div className="flex min-w-max relative">
                {selectedForm?.columns.map((column, index) => (
                  <div
                    key={column.id}
                    className={`relative flex items-center px-4 py-2 border-r border-gray-200 cursor-move transition-all ${
                      previewDraggedIndex === index 
                        ? 'opacity-30 bg-blue-100' 
                        : previewDragOverIndex === index
                        ? 'bg-purple-100 border-l-4 border-l-purple-500'
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ width: column.width }}
                    draggable
                    onDragStart={() => handlePreviewDragStart(index)}
                    onDragEnd={handlePreviewDragEnd}
                    onDragOver={(e) => handlePreviewDragOver(e, index)}
                    onDrop={() => handlePreviewDrop(index)}
                  >
                    <GripVertical className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="text-xs font-semibold text-gray-700 flex-1">
                      {column.name}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    {/* 🆕 可拖拽的列边框调整器 */}
                    {index < selectedForm!.columns.length - 1 && (
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10"
                        onMouseDown={(e) => handleResizeStart(e, index)}
                        title="拖拽调整列宽"
                      />
                    )}
                  </div>
                ))}
                
                {/* 🆕 添加列按钮 - 整合到表头最右侧 */}
                <button
                  onClick={handleAddColumn}
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-l border-gray-200 transition-all group"
                  style={{ width: '120px' }}
                  title="添加新列"
                >
                  <Plus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-blue-600 ml-2">添加列</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 列标题列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {selectedForm?.columns.map((column, index) => (
              <div
                key={column.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                className={`bg-white rounded-lg border-2 p-4 transition-all ${
                  draggedColumnIndex === index
                    ? 'opacity-50 scale-95 border-blue-500'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 拖拽手柄 */}
                  <div className="flex-shrink-0 mt-1">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                  </div>

                  {/* 列信息 */}
                  <div className="flex-1 min-w-0">
                    {/* 列名编辑区 */}
                    {editingColumnId === column.id ? (
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={editingColumnName}
                          onChange={(e) => setEditingColumnName(e.target.value)}
                          className="flex-1 h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveColumnName();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={handleSaveColumnName}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <h4
                          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                          onDoubleClick={() => handleStartEditColumnName(column)}
                        >
                          {column.name}
                          {column.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    )}

                    {/* 列属性 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 列类型 */}
                      <select
                        value={column.type}
                        onChange={(e) => handleChangeColumnType(column.id, e.target.value as ColumnDefinition['type'])}
                        className={`text-xs px-2 py-1 rounded border ${getColumnTypeColor(column.type)} cursor-pointer`}
                      >
                        <option value="text">文本</option>
                        <option value="number">数字</option>
                        <option value="currency">货币</option>
                        <option value="date">日期</option>
                        <option value="select">下拉选择</option>
                        <option value="boolean">布尔值</option>
                        <option value="file">文件</option>
                      </select>

                      {/* 🆕 列宽度调整器 - 左箭头缩小/右箭头放大 */}
                      <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden">
                        <button
                          onClick={() => {
                            const currentWidth = parseInt(column.width || '150');
                            const newWidth = Math.max(50, currentWidth - 10);
                            handleChangeColumnWidth(column.id, `${newWidth}px`);
                          }}
                          className="px-2 py-1 hover:bg-blue-50 transition-colors border-r border-gray-300"
                          title="缩小宽度 (-10px)"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <input
                          type="number"
                          value={parseInt(column.width || '150')}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 150;
                            const newWidth = Math.max(50, Math.min(800, value));
                            handleChangeColumnWidth(column.id, `${newWidth}px`);
                          }}
                          className="w-16 px-2 py-1 text-center text-xs font-semibold text-gray-700 border-none outline-none"
                        />
                        <span className="text-xs text-gray-500 pr-2">px</span>
                        <button
                          onClick={() => {
                            const currentWidth = parseInt(column.width || '150');
                            const newWidth = Math.min(800, currentWidth + 10);
                            handleChangeColumnWidth(column.id, `${newWidth}px`);
                          }}
                          className="px-2 py-1 hover:bg-green-50 transition-colors border-l border-gray-300"
                          title="放大宽度 (+10px)"
                        >
                          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      {/* 🆕 必填切换 */}
                      <button
                        onClick={() => handleToggleRequired(column.id)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          column.required
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {column.required ? '✓ 必填' : '选填'}
                      </button>

                      {/* 🆕 可编辑切换 */}
                      <button
                        onClick={() => handleToggleEditable(column.id)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          column.editable
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {column.editable ? '✓ 可编辑' : '只读'}
                      </button>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handleStartEditColumnName(column)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteColumn(column.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}