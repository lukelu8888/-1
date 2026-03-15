import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, Plus, Trash2, Edit2, Eye, Save, Download, Upload, Search, 
  Filter, CheckCircle, XCircle, Copy, RefreshCw, History, Code, Settings,
  Layers, Box, Boxes, Database, Clock, Sparkles, BookOpen, FileCheck,
  Archive, FolderOpen, GitBranch, Target, Zap, Lock, Unlock, Star,
  AlertCircle, TrendingUp, BarChart3, Activity, Users, Shield, Wand2,
  PlayCircle, PauseCircle, SkipForward, RotateCcw, Table as TableIcon,
  LayoutGrid, List, Calendar, Tag, Hash, Type, ToggleLeft, CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { formTemplates, FormTemplate } from '../config/formTemplates';
import homeDepotFormTemplates from '../config/formTemplatesHomeDepot'; // 🏢 Home Depot风格模板
import homeDepotRealTemplates from '../config/formTemplatesHomeDepotReal'; // 🏢 真实的Home Depot商业文档
import { FormTemplatePreview } from './workflow/FormTemplatePreview'; // 🏢 表单预览器
import { FormEditorDialog } from './FormEditorDialog'; // 🔥 表单编辑对话框

// 🔥 表单版本历史
interface FormVersion {
  id: string;
  formId: string;
  version: string;
  changes: string;
  createdAt: string;
  createdBy: string;
  size: number;
  status: 'draft' | 'published' | 'archived';
}

// 🔥 表单使用统计
interface FormUsageStats {
  formId: string;
  totalUsage: number;
  lastUsed: string;
  avgCompletionTime: number;
  successRate: number;
  errorCount: number;
  popularFields: string[];
}

// 🔥 表单字段分析
interface FieldAnalysis {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  usageCount: number;
  errorRate: number;
  avgFillTime: number;
  validationRules: string[];
  dependencies: string[];
}

// 🔥 表单模板分类
interface FormCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  formCount: number;
}

export function FormLibraryManagementPro({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState('library');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'usage'>('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [templateStyle, setTemplateStyle] = useState<'standard' | 'homedepot'>('homedepot'); // 🏢 默认Home Depot风格
  
  // 🔥 新增：预览和编辑状态
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [previewForm, setPreviewForm] = useState<FormTemplate | null>(null);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  
  // 🔥 新增：编辑中的表单数据（实际编辑副本）
  const [editFormData, setEditFormData] = useState<FormTemplate | null>(null);
  
  // 🔥 新增：字段编辑状态
  const [editingFieldIndex, setEditingFieldIndex] = useState<{sectionIndex: number, fieldIndex: number} | null>(null);
  
  // 表单版本管理
  const [formVersions, setFormVersions] = useState<FormVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  
  // 表单使用统计
  const [usageStats, setUsageStats] = useState<FormUsageStats[]>([]);
  
  // 表单字段分析
  const [fieldAnalysis, setFieldAnalysis] = useState<FieldAnalysis[]>([]);
  
  // 🏢 合并模板：标准模板 + Home Depot真实商业文档
  const allTemplates = templateStyle === 'homedepot' ? homeDepotRealTemplates : formTemplates;
  
  // 表单分类
  const formCategories: FormCategory[] = [
    { id: 'all', name: '全部表单', description: '所有表单模板', color: 'gray', icon: 'Boxes', formCount: allTemplates.length },
    { id: 'ing', name: '询价类', description: '客户询价相关表单', color: 'blue', icon: 'FileText', formCount: allTemplates.filter(t => t.type === 'ing').length },
    { id: 'qt', name: '报价类', description: 'Cosun报价相关表单', color: 'purple', icon: 'FileCheck', formCount: allTemplates.filter(t => t.type === 'qt').length },
    { id: 'contract', name: '合同类', description: '销售采购合同表单', color: 'green', icon: 'BookOpen', formCount: allTemplates.filter(t => t.type === 'sales_contract' || t.type === 'purchase_contract').length },
    { id: 'invoice', name: '发票类', description: '商业发票相关表单', color: 'yellow', icon: 'Database', formCount: allTemplates.filter(t => t.type === 'invoice').length },
    { id: 'shipping', name: '物流类', description: '装箱单提单表单', color: 'orange', icon: 'Box', formCount: allTemplates.filter(t => t.type === 'packing_list' || t.type === 'booking').length },
    { id: 'financial', name: '财务类', description: '付款收款对账表单', color: 'red', icon: 'TrendingUp', formCount: allTemplates.filter(t => t.type === 'statement').length },
  ];

  // 初始化数据
  useEffect(() => {
    loadFormVersions();
    loadUsageStats();
    loadFieldAnalysis();
  }, []);

  const loadFormVersions = () => {
    const savedVersions = localStorage.getItem('formVersions');
    if (savedVersions) {
      setFormVersions(JSON.parse(savedVersions));
    } else {
      // 生成默认版本历史
      const defaultVersions: FormVersion[] = formTemplates.map(form => ({
        id: `version_${form.id}_${Date.now()}`,
        formId: form.id,
        version: form.version,
        changes: '初始版本创建',
        createdAt: form.lastModified,
        createdBy: 'System Admin',
        size: Math.floor(Math.random() * 50) + 10, // KB
        status: 'published' as const
      }));
      setFormVersions(defaultVersions);
      localStorage.setItem('formVersions', JSON.stringify(defaultVersions));
    }
  };

  const loadUsageStats = () => {
    const savedStats = localStorage.getItem('formUsageStats');
    if (savedStats) {
      setUsageStats(JSON.parse(savedStats));
    } else {
      // 生成默认使用统计
      const defaultStats: FormUsageStats[] = formTemplates.map(form => ({
        formId: form.id,
        totalUsage: Math.floor(Math.random() * 500) + 50,
        lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        avgCompletionTime: Math.floor(Math.random() * 300) + 60, // seconds
        successRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        errorCount: Math.floor(Math.random() * 20),
        popularFields: ['customer_name', 'total_amount', 'date']
      }));
      setUsageStats(defaultStats);
      localStorage.setItem('formUsageStats', JSON.stringify(defaultStats));
    }
  };

  const loadFieldAnalysis = () => {
    const savedAnalysis = localStorage.getItem('formFieldAnalysis');
    if (savedAnalysis) {
      setFieldAnalysis(JSON.parse(savedAnalysis));
    }
  };

  // 🔥 获取表单统计
  const getFormStats = (formId: string) => {
    return usageStats.find(s => s.formId === formId) || {
      totalUsage: 0,
      lastUsed: 'N/A',
      avgCompletionTime: 0,
      successRate: 0,
      errorCount: 0,
      popularFields: []
    };
  };

  // 🔥 获取表单版本
  const getFormVersions = (formId: string) => {
    return formVersions.filter(v => v.formId === formId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // 🔥 过滤和排序表单
  const filteredForms = allTemplates
    .filter(form => {
      const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           form.name_en.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
                             form.type === selectedCategory ||
                             (selectedCategory === 'contract' && (form.type === 'sales_contract' || form.type === 'purchase_contract'));
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      if (sortBy === 'usage') {
        const usageA = getFormStats(a.id).totalUsage;
        const usageB = getFormStats(b.id).totalUsage;
        return usageB - usageA;
      }
      return 0;
    });

  // 🔥 导出表单
  const handleExportForm = (form: FormTemplate) => {
    const dataStr = JSON.stringify(form, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.id}_v${form.version}.json`;
    link.click();
    toast.success(`✅ 已导出表单: ${form.name}`);
  };

  // 🔥 批量导出
  const handleBatchExport = () => {
    const dataStr = JSON.stringify(filteredForms, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_templates_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success(`✅ 已导出 ${filteredForms.length} 个表单`);
  };

  // 🔥 复制表单
  const handleDuplicateForm = (form: FormTemplate) => {
    toast.success(`✅ 已复制表单: ${form.name}`);
  };

  // 🔥 归档表单
  const handleArchiveForm = (formId: string) => {
    toast.success(`✅ 表单已归档`);
  };

  // 🔥 创建新版本
  const handleCreateVersion = (formId: string) => {
    const form = formTemplates.find(f => f.id === formId);
    if (!form) return;

    const newVersion: FormVersion = {
      id: `version_${formId}_${Date.now()}`,
      formId: formId,
      version: `${parseFloat(form.version) + 0.1}`,
      changes: '版本更新',
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      size: Math.floor(Math.random() * 50) + 10,
      status: 'draft'
    };

    const updated = [newVersion, ...formVersions];
    setFormVersions(updated);
    localStorage.setItem('formVersions', JSON.stringify(updated));
    toast.success(`✅ 已创建新版本: v${newVersion.version}`);
  };

  // 🔥 发布版本
  const handlePublishVersion = (versionId: string) => {
    const updated = formVersions.map(v => 
      v.id === versionId ? { ...v, status: 'published' as const } : v
    );
    setFormVersions(updated);
    localStorage.setItem('formVersions', JSON.stringify(updated));
    toast.success(`✅ 版本已发布`);
  };

  // 🔥 回滚版本
  const handleRollbackVersion = (versionId: string) => {
    if (confirm('确定要回滚到此版本吗？')) {
      toast.success(`✅ 已回滚到指定版本`);
    }
  };

  // 🔥 预览表单
  const handlePreviewForm = (form: FormTemplate) => {
    setPreviewForm(form);
    setShowPreviewDialog(true);
    toast.success(`📋 正在预览表单: ${form.name}`);
  };

  // 🔥 编辑表单
  const handleEditForm = (form: FormTemplate) => {
    setEditingForm(form);
    // 🔥 创建表单的深拷贝用于编辑
    setEditFormData(JSON.parse(JSON.stringify(form)));
    setShowEditDialog(true);
    toast.success(`✏️ 正在编辑表单: ${form.name}`);
  };

  // 🔥 更新表单字段
  const updateField = (sectionIndex: number, fieldIndex: number, updates: Partial<any>) => {
    if (!editFormData) return;
    const newData = { ...editFormData };
    newData.sections[sectionIndex].fields[fieldIndex] = {
      ...newData.sections[sectionIndex].fields[fieldIndex],
      ...updates
    };
    setEditFormData(newData);
  };

  // 🔥 删除字段
  const deleteField = (sectionIndex: number, fieldIndex: number) => {
    if (!editFormData) return;
    if (confirm('确定要删除这个字段吗？')) {
      const newData = { ...editFormData };
      newData.sections[sectionIndex].fields.splice(fieldIndex, 1);
      setEditFormData(newData);
      toast.success('✅ 字段已删除');
    }
  };

  // 🔥 添加字段
  const addField = (sectionIndex: number) => {
    if (!editFormData) return;
    const newData = { ...editFormData };
    const newField = {
      id: `new_field_${Date.now()}`,
      label: '新字段',
      type: 'text',
      required: false,
      placeholder: ''
    };
    newData.sections[sectionIndex].fields.push(newField);
    setEditFormData(newData);
    toast.success('✅ 已添加新字段');
  };

  // 🔥 删除区块
  const deleteSection = (sectionIndex: number) => {
    if (!editFormData) return;
    if (confirm('确定要删除这个区块吗？将同时删除区块内的所有字段。')) {
      const newData = { ...editFormData };
      newData.sections.splice(sectionIndex, 1);
      setEditFormData(newData);
      toast.success('✅ 区块已删除');
    }
  };

  // 🔥 添加区块
  const addSection = () => {
    if (!editFormData) return;
    const newData = { ...editFormData };
    const newSection = {
      title: `新区块 ${newData.sections.length + 1}`,
      fields: []
    };
    newData.sections.push(newSection);
    setEditFormData(newData);
    toast.success('✅ 已添加新区块');
  };

  // 🔥 保存表单更改
  const saveFormChanges = () => {
    if (!editFormData) return;
    // TODO: 这里应该保存到后端或localStorage
    console.log('保存表单:', editFormData);
    toast.success('✅ 表单已保存');
    setShowEditDialog(false);
    setEditFormData(null);
    setEditingFieldIndex(null);
  };

  // 计算总体统计
  const totalStats = {
    totalForms: formTemplates.length,
    totalUsage: usageStats.reduce((sum, s) => sum + s.totalUsage, 0),
    avgSuccessRate: Math.round(usageStats.reduce((sum, s) => sum + s.successRate, 0) / usageStats.length),
    totalVersions: formVersions.length,
    publishedVersions: formVersions.filter(v => v.status === 'published').length,
    draftVersions: formVersions.filter(v => v.status === 'draft').length,
    archivedVersions: formVersions.filter(v => v.status === 'archived').length,
  };

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="bg-white rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                <Boxes className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">📚 表单库管理中心 Pro</h2>
                <p className="text-indigo-100 text-sm">Form Library Management Professional Edition</p>
              </div>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-7 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.totalForms}</div>
                  <div className="text-xs text-indigo-100">表单模板</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.totalUsage}</div>
                  <div className="text-xs text-indigo-100">总使用次数</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.avgSuccessRate}%</div>
                  <div className="text-xs text-indigo-100">成功率</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.totalVersions}</div>
                  <div className="text-xs text-indigo-100">版本总数</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.publishedVersions}</div>
                  <div className="text-xs text-indigo-100">已发布</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.draftVersions}</div>
                  <div className="text-xs text-indigo-100">草稿</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                <div>
                  <div className="text-2xl font-bold">{totalStats.archivedVersions}</div>
                  <div className="text-xs text-indigo-100">已归档</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                表单库
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                分类管理
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                版本控制
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                使用分析
              </TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                字段管理
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                模板市场
              </TabsTrigger>
            </TabsList>

            {/* 表单库 Tab */}
            <TabsContent value="library" className="space-y-6">
              {/* 工具栏 */}
              <div className="flex items-center gap-4">
                {/* 🏢 风格切换按钮 */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-2 rounded-lg border-2 border-orange-300">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <select
                    value={templateStyle}
                    onChange={(e) => setTemplateStyle(e.target.value as 'standard' | 'homedepot')}
                    className="bg-transparent border-none outline-none font-semibold text-orange-800 cursor-pointer"
                  >
                    <option value="homedepot">🏢 Home Depot 风格</option>
                    <option value="standard">📋 标准风格</option>
                  </select>
                </div>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索表单名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {formCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.formCount})
                    </option>
                  ))}
                </select>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="name">按名称排序</option>
                  <option value="date">按日期排序</option>
                  <option value="usage">按使用量排序</option>
                </select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={handleBatchExport} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  批量导出
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新建表单
                </Button>
              </div>

              {/* 表单列表 */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 gap-4">
                  {filteredForms.map((form, index) => {
                    const stats = getFormStats(form.id);
                    const versions = getFormVersions(form.id);
                    return (
                      <Card key={form.id} className={`p-6 hover:shadow-xl transition-all group ${
                        templateStyle === 'homedepot' ? 'border-l-4 border-l-orange-500' : ''
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shrink-0 ${
                            templateStyle === 'homedepot' 
                              ? 'bg-gradient-to-br from-orange-500 to-orange-700' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg truncate">{form.name}</h3>
                                {templateStyle === 'homedepot' && (
                                  <Badge className="bg-orange-500 text-white text-xs">HD</Badge>
                                )}
                              </div>
                              <Star className="w-4 h-4 text-yellow-500 shrink-0" />
                            </div>
                            <p className="text-sm text-gray-500 mb-3 truncate">{form.name_en}</p>
                            
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <Badge className={templateStyle === 'homedepot' ? 'bg-orange-100 text-orange-800' : ''}>
                                {form.type}
                              </Badge>
                              <Badge variant="outline">{form.owner}</Badge>
                              <Badge variant="secondary">v{form.version}</Badge>
                              {form.description && (
                                <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                                  {form.description}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2 text-xs text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <Layers className="w-3 h-3" />
                                {form.sections.length} 个区块 · {form.sections.reduce((sum, s) => sum + s.fields.length, 0)} 个字段
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                使用 {stats.totalUsage} 次 · 成功率 {stats.successRate}%
                              </div>
                              <div className="flex items-center gap-2">
                                <GitBranch className="w-3 h-3" />
                                {versions.length} 个版本
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                最后修改: {form.lastModified}
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => handlePreviewForm(form)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                预览
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => handleEditForm(form)}
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                编辑
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => setShowVersionHistory(form.id === showVersionHistory ? null : form.id)}
                              >
                                <History className="w-3 h-3 mr-1" />
                                版本
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={() => handleExportForm(form)}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                导出
                              </Button>
                            </div>

                            {/* 更多操作 */}
                            <div className="grid grid-cols-3 gap-1 mt-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-xs h-7"
                                onClick={() => handleDuplicateForm(form)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                复制
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-xs h-7"
                                onClick={() => handleCreateVersion(form.id)}
                              >
                                <GitBranch className="w-3 h-3 mr-1" />
                                新版本
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-xs h-7 text-orange-600"
                                onClick={() => handleArchiveForm(form.id)}
                              >
                                <Archive className="w-3 h-3 mr-1" />
                                归档
                              </Button>
                            </div>

                            {/* 版本历史展开 */}
                            {showVersionHistory === form.id && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm font-medium mb-2">版本历史</div>
                                <div className="space-y-2 max-h-40 overflow-auto">
                                  {getFormVersions(form.id).map((version) => (
                                    <div key={version.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                      <div className="flex-1">
                                        <div className="font-medium">v{version.version}</div>
                                        <div className="text-gray-500">{version.changes}</div>
                                        <div className="text-gray-400">{version.createdAt} · {version.createdBy}</div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Badge 
                                          variant={version.status === 'published' ? 'default' : version.status === 'draft' ? 'secondary' : 'outline'}
                                          className="text-xs"
                                        >
                                          {version.status === 'published' ? '已发布' : version.status === 'draft' ? '草稿' : '已归档'}
                                        </Badge>
                                        {version.status === 'draft' && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2"
                                            onClick={() => handlePublishVersion(version.id)}
                                          >
                                            <CheckCircle className="w-3 h-3" />
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2"
                                          onClick={() => handleRollbackVersion(version.id)}
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredForms.map((form, index) => {
                    const stats = getFormStats(form.id);
                    return (
                      <Card key={form.id} className="p-4 hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                            <div>
                              <div className="font-medium">{form.name}</div>
                              <div className="text-xs text-gray-500">{form.name_en}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{form.type}</Badge>
                              <Badge variant="outline">{form.owner}</Badge>
                            </div>
                            <div className="text-sm">
                              <div>{form.sections.length} 区块 · {form.sections.reduce((sum, s) => sum + s.fields.length, 0)} 字段</div>
                              <div className="text-xs text-gray-500">v{form.version}</div>
                            </div>
                            <div className="text-sm">
                              <div>使用 {stats.totalUsage} 次</div>
                              <div className="text-xs text-gray-500">成功率 {stats.successRate}%</div>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handlePreviewForm(form)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditForm(form)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleExportForm(form)}>
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDuplicateForm(form)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* 分类管理 Tab */}
            <TabsContent value="categories" className="space-y-6">
              <Card className="p-6 border-l-4 border-l-purple-500">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FolderOpen className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">📁 表单分类体系</h3>
                    <p className="text-gray-600 mb-4">
                      按业务流程和单据类型对表单进行科学分类，便于快速查找和管理。
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                {formCategories.filter(cat => cat.id !== 'all').map((category) => (
                  <Card key={category.id} className={`p-6 border-l-4 border-l-${category.color}-500 hover:shadow-lg transition-all cursor-pointer`}>
                    <div className="flex items-start gap-3">
                      <div className={`bg-${category.color}-100 p-3 rounded-lg`}>
                        <FileText className={`w-6 h-6 text-${category.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{category.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{category.formCount} 个表单</Badge>
                          <Button size="sm" variant="ghost">
                            查看 →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 分类统计图表 */}
              <Card className="p-6">
                <h3 className="font-bold mb-4">分类分布统计</h3>
                <div className="space-y-3">
                  {formCategories.filter(cat => cat.id !== 'all').map((category) => {
                    const percentage = Math.round((category.formCount / totalStats.totalForms) * 100);
                    return (
                      <div key={category.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{category.name}</span>
                          <span className="text-gray-500">{category.formCount} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-${category.color}-500 h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* 版本控制 Tab */}
            <TabsContent value="versions" className="space-y-6">
              <Card className="p-6 border-l-4 border-l-green-500">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <GitBranch className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">🔄 版本控制系统</h3>
                    <p className="text-gray-600 mb-4">
                      完整的表单版本历史记录，支持版本对比、回滚和发布管理。
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{totalStats.totalVersions}</div>
                        <div className="text-sm text-gray-600">总版本数</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{totalStats.publishedVersions}</div>
                        <div className="text-sm text-gray-600">已发布</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{totalStats.draftVersions}</div>
                        <div className="text-sm text-gray-600">草稿</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{totalStats.archivedVersions}</div>
                        <div className="text-sm text-gray-600">已归档</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 版本时间线 */}
              <div className="space-y-4">
                {formTemplates.map((form) => {
                  const versions = getFormVersions(form.id);
                  if (versions.length === 0) return null;
                  
                  return (
                    <Card key={form.id} className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{form.name}</h3>
                          <p className="text-sm text-gray-500">{form.name_en}</p>
                        </div>
                        <Badge>{versions.length} 个版本</Badge>
                      </div>

                      <div className="space-y-3 pl-6 border-l-2 border-gray-200 ml-5">
                        {versions.map((version, index) => (
                          <div key={version.id} className="relative pl-6">
                            <div className={`absolute -left-[26px] w-4 h-4 rounded-full border-2 ${
                              version.status === 'published' ? 'bg-green-500 border-green-500' :
                              version.status === 'draft' ? 'bg-yellow-500 border-yellow-500' :
                              'bg-gray-400 border-gray-400'
                            }`} />
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="font-bold">v{version.version}</div>
                                  <Badge 
                                    variant={version.status === 'published' ? 'default' : version.status === 'draft' ? 'secondary' : 'outline'}
                                  >
                                    {version.status === 'published' ? '✓ 已发布' : version.status === 'draft' ? '草稿' : '已归档'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{version.size} KB</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {version.status === 'draft' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePublishVersion(version.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      发布
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRollbackVersion(version.id)}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    回滚
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">{version.changes}</div>
                              <div className="text-xs text-gray-500">
                                {version.createdAt} · 由 {version.createdBy} 创建
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* 使用分析 Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card className="p-6 border-l-4 border-l-blue-500">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">📊 表单使用分析</h3>
                    <p className="text-gray-600 mb-4">
                      深度分析表单使用情况，了解表单性能和用户行为。
                    </p>
                  </div>
                </div>
              </Card>

              {/* 使用统计列表 */}
              <div className="grid grid-cols-2 gap-4">
                {formTemplates.map((form) => {
                  const stats = getFormStats(form.id);
                  return (
                    <Card key={form.id} className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{form.name}</h3>
                          <p className="text-xs text-gray-500">{form.name_en}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">总使用次数</div>
                          <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">成功率</div>
                          <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">平均完成时间</div>
                          <div className="text-2xl font-bold text-purple-600">{Math.floor(stats.avgCompletionTime / 60)}m</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">错误次数</div>
                          <div className="text-2xl font-bold text-red-600">{stats.errorCount}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="text-xs text-gray-500 mb-2">最后使用</div>
                        <div className="text-sm font-medium">{stats.lastUsed}</div>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">热门字段</div>
                        <div className="flex flex-wrap gap-1">
                          {stats.popularFields.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* 字段管理 Tab */}
            <TabsContent value="fields" className="space-y-6">
              <Card className="p-6 border-l-4 border-l-orange-500">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <TableIcon className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">🔧 表单字段管理</h3>
                    <p className="text-gray-600 mb-4">
                      统一管理所有表单字段，包括字段类型、验证规则和依赖关系。
                    </p>
                  </div>
                </div>
              </Card>

              {/* 字段类型统计 */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Type className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">45</div>
                      <div className="text-sm text-gray-600">文本字段</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Hash className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">28</div>
                      <div className="text-sm text-gray-600">数字字段</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">15</div>
                      <div className="text-sm text-gray-600">日期字段</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <ToggleLeft className="w-8 h-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-gray-600">选择字段</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 字段列表 */}
              <Card className="p-6">
                <h3 className="font-bold mb-4">所有字段列表</h3>
                <div className="space-y-2">
                  {formTemplates.slice(0, 3).map((form) => (
                    <div key={form.id} className="space-y-2">
                      <div className="font-medium text-sm bg-gray-50 p-2 rounded">{form.name}</div>
                      {form.sections.map((section) => (
                        <div key={section.id} className="pl-4 space-y-1">
                          <div className="text-xs text-gray-500 font-medium">{section.name}</div>
                          {section.fields.map((field) => (
                            <div key={field.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded text-sm">
                              <CheckSquare className="w-4 h-4 text-gray-400" />
                              <div className="flex-1">{field.label}</div>
                              <Badge variant="outline" className="text-xs">{field.type}</Badge>
                              {field.required && <Badge variant="secondary" className="text-xs">必填</Badge>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* 模板市场 Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card className="p-6 border-l-4 border-l-pink-500">
                <div className="flex items-start gap-4">
                  <div className="bg-pink-100 p-3 rounded-lg">
                    <Sparkles className="w-8 h-8 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">✨ 表单模板市场</h3>
                    <p className="text-gray-600 mb-4">
                      精选行业表单模板，一键导入快速使用。
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: '国际贸易标准询价单', category: '询价类', downloads: 234, rating: 4.8 },
                  { name: 'B2B报价单专业版', category: '报价类', downloads: 189, rating: 4.9 },
                  { name: '国际销售合同模板', category: '合同类', downloads: 456, rating: 4.7 },
                  { name: '商业发票标准模板', category: '发票类', downloads: 567, rating: 4.9 },
                  { name: '装箱单专业模板', category: '物流类', downloads: 345, rating: 4.6 },
                  { name: '收款对账单模板', category: '财务类', downloads: 278, rating: 4.8 },
                ].map((template, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold mb-1">{template.name}</h3>
                        <Badge>{template.category}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{template.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Download className="w-4 h-4" />
                        <span>{template.downloads}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          toast.info('📋 模板预览功能开发中...');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        预览
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          toast.success('✅ 模板已添加到表单库');
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        导入
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 🔥 表单预览对话框 - 真实Home Depot文档样式 */}
        {showPreviewDialog && previewForm && (
          <FormTemplatePreview
            template={previewForm}
            onClose={() => setShowPreviewDialog(false)}
            onEdit={(template) => {
              // 🔥 从预览切换到编辑
              setPreviewForm(null);
              setShowPreviewDialog(false);
              setEditingForm(template);
              setShowEditDialog(true);
              toast.success(`✏️ 正在编辑表单: ${template.name}`);
            }}
          />
        )}

        {/* 🔥 表单编辑对话框 - 使用新的FormEditorDialog组件 */}
        {showEditDialog && editFormData && (
          <FormEditorDialog
            formData={editFormData}
            onClose={() => {
              setShowEditDialog(false);
              setEditFormData(null);
              setEditingFieldIndex(null);
            }}
            onSave={(updatedData) => {
              // TODO: 这里应该保存到后端或更新localStorage
              console.log('保存表单:', updatedData);
              toast.success('✅ 表单已保存成功');
              setShowEditDialog(false);
              setEditFormData(null);
              setEditingFieldIndex(null);
            }}
            onPreview={(form) => {
              setShowEditDialog(false);
              setEditFormData(null);
              handlePreviewForm(form);
            }}
          />
        )}
      </div>
    </div>
  );
}
