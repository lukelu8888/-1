import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, Save, Download, Upload, Eye, Layout, Palette, Settings, 
  Type, Plus, Trash2, Copy, Move, Maximize2, Minimize2, Grid3x3, 
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Image, Table as TableIcon, Calendar, Hash, CheckSquare, List,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Undo2,
  Redo2, Layers, Lock, Unlock, Star, Sparkles, Wand2, Code,
  Upload as UploadIcon, FileImage, Printer, Share2, X, GripVertical,
  Check, AlertCircle, Info, Clock, User, Building, Mail, Phone,
  Globe, CreditCard, Package, ShoppingCart, DollarSign, Percent,
  TrendingUp, BarChart3, PieChart, Activity, Target, Award,
  Archive, Folder, FolderOpen, File, Files, FilePlus, Edit2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formTemplates, FormTemplate, FormSection, FormField } from '../../config/formTemplates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

// 🎨 颜色预设
const COLOR_PRESETS = [
  { name: '专业蓝', primary: '#0066cc', secondary: '#475569' },
  { name: '商务红', primary: '#dc2626', secondary: '#64748b' },
  { name: '财务绿', primary: '#059669', secondary: '#64748b' },
  { name: '物流橙', primary: '#ea580c', secondary: '#64748b' },
  { name: '紫罗兰', primary: '#7c3aed', secondary: '#64748b' },
  { name: '青色', primary: '#0891b2', secondary: '#64748b' },
];

// 🎯 字段图标映射
const FIELD_ICONS: Record<string, any> = {
  text: Type,
  number: Hash,
  date: Calendar,
  textarea: AlignLeft,
  select: List,
  table: TableIcon,
  image: FileImage,
  logo: Image,
  signature: User,
  calculated: Activity,
};

export function UltimateFormDesigner({ onClose }: { onClose?: () => void }) {
  // 状态管理
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('select'); // select, design, style, preview
  const [zoom, setZoom] = useState(100);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<FormTemplate[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // 🎯 选择表单模板
  const handleSelectTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setEditingForm(JSON.parse(JSON.stringify(template))); // Deep clone
    setHistory([JSON.parse(JSON.stringify(template))]);
    setHistoryIndex(0);
    setActiveTab('design');
    toast.success(`✅ 已加载表单: ${template.name}`);
  };

  // 🎨 创建新表单
  const handleCreateNew = () => {
    const newForm: FormTemplate = {
      id: `form_custom_${Date.now()}`,
      name: '新表单',
      name_en: 'New Form',
      type: 'custom',
      category: 'internal',
      owner: 'cosun',
      version: '1.0',
      lastModified: new Date().toISOString().split('T')[0],
      createdBy: 'user',
      pageSettings: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 15, bottom: 20, left: 15 },
        header: true,
        footer: true
      },
      header: {
        logo: {
          enabled: true,
          position: 'left',
          size: { width: 60, height: 24 },
          source: 'cosun'
        },
        companyInfo: {
          enabled: true,
          fields: ['company_name', 'address', 'email', 'phone']
        },
        title: {
          text: '表单标题',
          fontSize: 20,
          alignment: 'center'
        }
      },
      sections: [],
      footer: {
        enabled: true,
        fields: ['date', 'page_number'],
        signatureLines: {
          enabled: false,
          parties: []
        }
      },
      styling: {
        primaryColor: '#0066cc',
        secondaryColor: '#475569',
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        lineHeight: 1.6
      }
    };
    
    setSelectedTemplate(newForm);
    setEditingForm(newForm);
    setHistory([newForm]);
    setHistoryIndex(0);
    setActiveTab('design');
    toast.success('✅ 已创建新表单');
  };

  // 📋 复制表单
  const handleDuplicateTemplate = (template: FormTemplate) => {
    const duplicated = JSON.parse(JSON.stringify(template));
    duplicated.id = `${template.id}_copy_${Date.now()}`;
    duplicated.name = `${template.name} (副本)`;
    duplicated.version = '1.0';
    duplicated.lastModified = new Date().toISOString().split('T')[0];
    
    setSelectedTemplate(duplicated);
    setEditingForm(duplicated);
    setHistory([duplicated]);
    setHistoryIndex(0);
    setActiveTab('design');
    toast.success(`✅ 已复制表单: ${template.name}`);
  };

  // ↩️ 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditingForm(JSON.parse(JSON.stringify(history[newIndex])));
      toast.success('↩️ 已撤销');
    }
  };

  // ↪️ 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditingForm(JSON.parse(JSON.stringify(history[newIndex])));
      toast.success('↪️ 已重做');
    }
  };

  // 💾 保存到历史
  const saveToHistory = (form: FormTemplate) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(form)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // ➕ 添加区块
  const handleAddSection = () => {
    if (!editingForm) return;
    
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: '新区块',
      layout: 'double',
      border: true,
      fields: []
    };
    
    const updated = {
      ...editingForm,
      sections: [...editingForm.sections, newSection]
    };
    
    setEditingForm(updated);
    saveToHistory(updated);
    toast.success('✅ 已添加区块');
  };

  // ➕ 添加字段
  const handleAddField = (sectionId: string) => {
    if (!editingForm) return;
    
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: '新字段',
      type: 'text',
      required: false,
      width: '50%'
    };
    
    const updated = {
      ...editingForm,
      sections: editingForm.sections.map(section => 
        section.id === sectionId
          ? { ...section, fields: [...section.fields, newField] }
          : section
      )
    };
    
    setEditingForm(updated);
    saveToHistory(updated);
    toast.success('✅ 已添加字段');
  };

  // 🗑️ 删除区块
  const handleDeleteSection = (sectionId: string) => {
    if (!editingForm) return;
    
    const updated = {
      ...editingForm,
      sections: editingForm.sections.filter(s => s.id !== sectionId)
    };
    
    setEditingForm(updated);
    saveToHistory(updated);
    toast.success('🗑️ 已删除区块');
  };

  // 🗑️ 删除字段
  const handleDeleteField = (sectionId: string, fieldId: string) => {
    if (!editingForm) return;
    
    const updated = {
      ...editingForm,
      sections: editingForm.sections.map(section =>
        section.id === sectionId
          ? { ...section, fields: section.fields.filter(f => f.id !== fieldId) }
          : section
      )
    };
    
    setEditingForm(updated);
    saveToHistory(updated);
    toast.success('🗑️ 已删除字段');
  };

  // 🎨 更新样式
  const handleUpdateStyling = (key: string, value: any) => {
    if (!editingForm) return;
    
    const updated = {
      ...editingForm,
      styling: {
        ...editingForm.styling,
        [key]: value
      }
    };
    
    setEditingForm(updated);
    saveToHistory(updated);
  };

  // 🎨 应用颜色预设
  const handleApplyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    if (!editingForm) return;
    
    const updated = {
      ...editingForm,
      styling: {
        ...editingForm.styling,
        primaryColor: preset.primary,
        secondaryColor: preset.secondary
      }
    };
    
    setEditingForm(updated);
    saveToHistory(updated);
    toast.success(`🎨 已应用配色: ${preset.name}`);
  };

  // 💾 保存表单
  const handleSave = () => {
    if (!editingForm) return;
    
    // 这里应该保存到localStorage或后端
    const updated = {
      ...editingForm,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    setEditingForm(updated);
    toast.success('💾 表单已保存');
  };

  // 📥 导出表单
  const handleExport = () => {
    if (!editingForm) return;
    
    const dataStr = JSON.stringify(editingForm, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${editingForm.id}_${editingForm.version}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('📥 表单已导出');
  };

  // 📄 导出PDF
  const handleExportPDF = () => {
    if (!editingForm) return;
    toast.success('📄 PDF导出功能开发中...');
  };

  // 🖨️ 打印
  const handlePrint = () => {
    if (!editingForm) return;
    window.print();
    toast.success('🖨️ 准备打印...');
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        {/* 顶部工具栏 */}
        <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">终极表单DIY工作台</h1>
                <p className="text-xs text-gray-500">Ultimate Form Designer Studio</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingForm && (
              <>
                <Badge variant="outline" className="text-xs">
                  {editingForm.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  v{editingForm.version}
                </Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              撤销
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="h-4 w-4 mr-1" />
              重做
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              导出JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" />
              导出PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              打印
            </Button>
          </div>
        </div>

        {/* 标签页切换 */}
        <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="select">
              <Folder className="h-4 w-4 mr-1" />
              选择模板
            </TabsTrigger>
            <TabsTrigger value="design" disabled={!editingForm}>
              <Layout className="h-4 w-4 mr-1" />
              设计布局
            </TabsTrigger>
            <TabsTrigger value="style" disabled={!editingForm}>
              <Palette className="h-4 w-4 mr-1" />
              样式设置
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!editingForm}>
              <Eye className="h-4 w-4 mr-1" />
              实时预览
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 📁 选择模板 */}
        <TabsContent value="select" className="flex-1 m-0 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">选择表单模板</h2>
                  <p className="text-gray-500">从现有模板开始，或创建全新表单</p>
                </div>
                <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  创建新表单
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${
                          template.type === 'ing' ? 'from-blue-400 to-blue-600' :
                          template.type === 'qt' ? 'from-purple-400 to-purple-600' :
                          template.type === 'sales_contract' ? 'from-red-400 to-red-600' :
                          template.type === 'purchase_contract' ? 'from-cyan-400 to-cyan-600' :
                          template.type === 'invoice' ? 'from-green-400 to-green-600' :
                          template.type === 'packing_list' ? 'from-orange-400 to-orange-600' :
                          template.type === 'statement' ? 'from-pink-400 to-pink-600' :
                          'from-gray-400 to-gray-600'
                        }`}>
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold">{template.name}</h3>
                          <p className="text-xs text-gray-500">{template.name_en}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Layers className="h-3 w-3" />
                        {template.sections.length} 个区块
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        更新: {template.lastModified}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-3 w-3" />
                        创建人: {template.createdBy}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        编辑
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 🎨 设计布局 */}
          <TabsContent value="design" className="flex-1 m-0 flex overflow-hidden">
            {/* 左侧属性面板 */}
            <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                表单设置
              </h3>

              {editingForm && (
                <div className="space-y-4">
                  {/* 基本信息 */}
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 text-sm">基本信息</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">表单名称</Label>
                        <Input 
                          value={editingForm.name}
                          onChange={(e) => {
                            const updated = { ...editingForm, name: e.target.value };
                            setEditingForm(updated);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">英文名称</Label>
                        <Input 
                          value={editingForm.name_en}
                          onChange={(e) => {
                            const updated = { ...editingForm, name_en: e.target.value };
                            setEditingForm(updated);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">版本号</Label>
                        <Input 
                          value={editingForm.version}
                          onChange={(e) => {
                            const updated = { ...editingForm, version: e.target.value };
                            setEditingForm(updated);
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* 页面设置 */}
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 text-sm">页面设置</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">显示页眉</Label>
                        <Switch 
                          checked={editingForm.pageSettings.header}
                          onCheckedChange={(checked) => {
                            const updated = {
                              ...editingForm,
                              pageSettings: { ...editingForm.pageSettings, header: checked }
                            };
                            setEditingForm(updated);
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">显示页脚</Label>
                        <Switch 
                          checked={editingForm.pageSettings.footer}
                          onCheckedChange={(checked) => {
                            const updated = {
                              ...editingForm,
                              pageSettings: { ...editingForm.pageSettings, footer: checked }
                            };
                            setEditingForm(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">页面方向</Label>
                        <Select 
                          value={editingForm.pageSettings.orientation}
                          onValueChange={(value: 'portrait' | 'landscape') => {
                            const updated = {
                              ...editingForm,
                              pageSettings: { ...editingForm.pageSettings, orientation: value }
                            };
                            setEditingForm(updated);
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">纵向 Portrait</SelectItem>
                            <SelectItem value="landscape">横向 Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  {/* Logo设置 */}
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 text-sm">Logo设置</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">显示Logo</Label>
                        <Switch 
                          checked={editingForm.header.logo.enabled}
                          onCheckedChange={(checked) => {
                            const updated = {
                              ...editingForm,
                              header: {
                                ...editingForm.header,
                                logo: { ...editingForm.header.logo, enabled: checked }
                              }
                            };
                            setEditingForm(updated);
                          }}
                        />
                      </div>
                      {editingForm.header.logo.enabled && (
                        <>
                          <div>
                            <Label className="text-xs">Logo位置</Label>
                            <Select 
                              value={editingForm.header.logo.position}
                              onValueChange={(value: 'left' | 'center' | 'right') => {
                                const updated = {
                                  ...editingForm,
                                  header: {
                                    ...editingForm.header,
                                    logo: { ...editingForm.header.logo, position: value }
                                  }
                                };
                                setEditingForm(updated);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">左对齐</SelectItem>
                                <SelectItem value="center">居中</SelectItem>
                                <SelectItem value="right">右对齐</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Logo来源</Label>
                            <Select 
                              value={editingForm.header.logo.source}
                              onValueChange={(value: 'customer' | 'cosun' | 'supplier') => {
                                const updated = {
                                  ...editingForm,
                                  header: {
                                    ...editingForm.header,
                                    logo: { ...editingForm.header.logo, source: value }
                                  }
                                };
                                setEditingForm(updated);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">客户Logo</SelectItem>
                                <SelectItem value="cosun">Cosun Logo</SelectItem>
                                <SelectItem value="supplier">供应商Logo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                  {/* 标题设置 */}
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 text-sm">表单标题</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">标题文字</Label>
                        <Input 
                          value={editingForm.header.title.text}
                          onChange={(e) => {
                            const updated = {
                              ...editingForm,
                              header: {
                                ...editingForm.header,
                                title: { ...editingForm.header.title, text: e.target.value }
                              }
                            };
                            setEditingForm(updated);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">字体大小 ({editingForm.header.title.fontSize}pt)</Label>
                        <Slider 
                          value={[editingForm.header.title.fontSize]}
                          onValueChange={([value]) => {
                            const updated = {
                              ...editingForm,
                              header: {
                                ...editingForm.header,
                                title: { ...editingForm.header.title, fontSize: value }
                              }
                            };
                            setEditingForm(updated);
                          }}
                          min={12}
                          max={32}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">对齐方式</Label>
                        <Select 
                          value={editingForm.header.title.alignment}
                          onValueChange={(value: 'left' | 'center' | 'right') => {
                            const updated = {
                              ...editingForm,
                              header: {
                                ...editingForm.header,
                                title: { ...editingForm.header.title, alignment: value }
                              }
                            };
                            setEditingForm(updated);
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">左对齐</SelectItem>
                            <SelectItem value="center">居中</SelectItem>
                            <SelectItem value="right">右对齐</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* 中间画布区域 */}
            <div className="flex-1 bg-gray-100 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                {/* 工具栏 */}
                <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleAddSection}>
                      <Plus className="h-4 w-4 mr-1" />
                      添加区块
                    </Button>
                    <div className="h-6 w-px bg-gray-300" />
                    <Button 
                      size="sm" 
                      variant={showGrid ? 'default' : 'outline'}
                      onClick={() => setShowGrid(!showGrid)}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={showRuler ? 'default' : 'outline'}
                      onClick={() => setShowRuler(!showRuler)}
                    >
                      <Layout className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                    <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setZoom(100)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* A4画布 */}
                {editingForm && (
                  <div 
                    ref={canvasRef}
                    className="bg-white shadow-lg mx-auto relative"
                    style={{
                      width: editingForm.pageSettings.orientation === 'portrait' ? '210mm' : '297mm',
                      minHeight: editingForm.pageSettings.orientation === 'portrait' ? '297mm' : '210mm',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      padding: `${editingForm.pageSettings.margins.top}mm ${editingForm.pageSettings.margins.right}mm ${editingForm.pageSettings.margins.bottom}mm ${editingForm.pageSettings.margins.left}mm`,
                      backgroundImage: showGrid ? 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)' : 'none',
                      backgroundSize: showGrid ? '10mm 10mm' : 'auto'
                    }}
                  >
                    {/* 页眉 */}
                    {editingForm.pageSettings.header && (
                      <div className="border-b-2 pb-4 mb-6" style={{ borderColor: editingForm.styling.primaryColor }}>
                        {/* Logo */}
                        {editingForm.header.logo.enabled && (
                          <div className={`mb-3 flex ${
                            editingForm.header.logo.position === 'left' ? 'justify-start' :
                            editingForm.header.logo.position === 'center' ? 'justify-center' :
                            'justify-end'
                          }`}>
                            <div 
                              className="bg-gray-200 flex items-center justify-center rounded"
                              style={{
                                width: `${editingForm.header.logo.size.width}mm`,
                                height: `${editingForm.header.logo.size.height}mm`
                              }}
                            >
                              <Image className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>
                        )}

                        {/* 公司信息 */}
                        {editingForm.header.companyInfo.enabled && (
                          <div className="text-xs text-gray-600 mb-3">
                            <p className="font-semibold">Fujian Cosun Tuff Building Materials Co., Ltd.</p>
                            <p>福建高盛达富建材有限公司</p>
                          </div>
                        )}

                        {/* 标题 */}
                        <h1 
                          className="font-bold"
                          style={{
                            fontSize: `${editingForm.header.title.fontSize}pt`,
                            textAlign: editingForm.header.title.alignment,
                            color: editingForm.styling.primaryColor
                          }}
                        >
                          {editingForm.header.title.text}
                        </h1>
                      </div>
                    )}

                    {/* 区块 */}
                    <div className="space-y-4">
                      {editingForm.sections.map((section) => (
                        <Card 
                          key={section.id}
                          className={`p-4 ${selectedSection === section.id ? 'ring-2 ring-blue-500' : ''}`}
                          onClick={() => setSelectedSection(section.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold" style={{ color: editingForm.styling.primaryColor }}>
                              {section.title}
                            </h3>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddField(section.id);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSection(section.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* 字段 */}
                          <div className={`grid ${
                            section.layout === 'single' ? 'grid-cols-1' :
                            section.layout === 'double' ? 'grid-cols-2' :
                            'grid-cols-3'
                          } gap-3`}>
                            {section.fields.map((field) => {
                              const FieldIcon = FIELD_ICONS[field.type] || Type;
                              return (
                                <div
                                  key={field.id}
                                  className={`border rounded p-2 ${selectedField === field.id ? 'ring-2 ring-blue-500' : ''} ${
                                    field.width === '100%' ? 'col-span-full' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedField(field.id);
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <FieldIcon className="h-3 w-3" />
                                      <span>{field.label}</span>
                                      {field.required && <span className="text-red-500">*</span>}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-5 w-5 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteField(section.id, field.id);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  {/* 字段预览 */}
                                  {field.type === 'textarea' ? (
                                    <Textarea 
                                      placeholder={field.placeholder || field.label}
                                      className="text-xs h-16"
                                      disabled
                                    />
                                  ) : field.type === 'select' ? (
                                    <Select disabled>
                                      <SelectTrigger className="text-xs">
                                        <SelectValue placeholder={field.placeholder || field.label} />
                                      </SelectTrigger>
                                    </Select>
                                  ) : field.type === 'date' ? (
                                    <div className="flex items-center gap-2 border rounded px-2 py-1 text-xs bg-gray-50">
                                      <Calendar className="h-3 w-3 text-gray-400" />
                                      <span className="text-gray-400">Select date...</span>
                                    </div>
                                  ) : field.type === 'table' ? (
                                    <div className="border rounded p-2 bg-gray-50">
                                      <TableIcon className="h-8 w-8 text-gray-400 mx-auto" />
                                      <p className="text-xs text-center text-gray-500 mt-1">表格区域</p>
                                    </div>
                                  ) : (
                                    <Input 
                                      placeholder={field.placeholder || field.label}
                                      type={field.type === 'number' ? 'number' : 'text'}
                                      className="text-xs"
                                      disabled
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {section.fields.length === 0 && (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded">
                              <Plus className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">点击"添加字段"开始设计</p>
                            </div>
                          )}
                        </Card>
                      ))}

                      {editingForm.sections.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                          <Layers className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg">点击"添加区块"开始设计表单</p>
                        </div>
                      )}
                    </div>

                    {/* 页脚 */}
                    {editingForm.pageSettings.footer && (
                      <div className="border-t-2 pt-4 mt-8 text-xs text-gray-600" style={{ borderColor: editingForm.styling.secondaryColor }}>
                        {editingForm.footer.signatureLines?.enabled && (
                          <div className="grid grid-cols-2 gap-8 mb-4">
                            {editingForm.footer.signatureLines.parties.map((party, index) => (
                              <div key={index}>
                                <p className="mb-8">{party.label}:</p>
                                <div className="border-t border-gray-300 pt-1">
                                  <p className="text-xs text-gray-400">签名 / Signature</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>打印日期: {new Date().toLocaleDateString()}</span>
                          <span>页码: 1 / 1</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧字段编辑器 */}
            {selectedField && editingForm && (
              <div className="w-80 border-l bg-gray-50 p-4 overflow-auto">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Edit2 className="h-5 w-5" />
                  字段编辑器
                </h3>

                <Card className="p-4">
                  {(() => {
                    const section = editingForm.sections.find(s => 
                      s.fields.some(f => f.id === selectedField)
                    );
                    const field = section?.fields.find(f => f.id === selectedField);
                    
                    if (!field) return null;

                    return (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">字段标签</Label>
                          <Input 
                            value={field.label}
                            onChange={(e) => {
                              const updated = {
                                ...editingForm,
                                sections: editingForm.sections.map(s => ({
                                  ...s,
                                  fields: s.fields.map(f => 
                                    f.id === selectedField 
                                      ? { ...f, label: e.target.value }
                                      : f
                                  )
                                }))
                              };
                              setEditingForm(updated);
                            }}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">字段类型</Label>
                          <Select 
                            value={field.type}
                            onValueChange={(value: any) => {
                              const updated = {
                                ...editingForm,
                                sections: editingForm.sections.map(s => ({
                                  ...s,
                                  fields: s.fields.map(f => 
                                    f.id === selectedField 
                                      ? { ...f, type: value }
                                      : f
                                  )
                                }))
                              };
                              setEditingForm(updated);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">文本</SelectItem>
                              <SelectItem value="number">数字</SelectItem>
                              <SelectItem value="date">日期</SelectItem>
                              <SelectItem value="textarea">多行文本</SelectItem>
                              <SelectItem value="select">下拉选择</SelectItem>
                              <SelectItem value="table">表格</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">字段宽度</Label>
                          <Select 
                            value={field.width || '50%'}
                            onValueChange={(value) => {
                              const updated = {
                                ...editingForm,
                                sections: editingForm.sections.map(s => ({
                                  ...s,
                                  fields: s.fields.map(f => 
                                    f.id === selectedField 
                                      ? { ...f, width: value }
                                      : f
                                  )
                                }))
                              };
                              setEditingForm(updated);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="33%">1/3 宽度</SelectItem>
                              <SelectItem value="50%">1/2 宽度</SelectItem>
                              <SelectItem value="100%">全宽</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-xs">必填字段</Label>
                          <Switch 
                            checked={field.required || false}
                            onCheckedChange={(checked) => {
                              const updated = {
                                ...editingForm,
                                sections: editingForm.sections.map(s => ({
                                  ...s,
                                  fields: s.fields.map(f => 
                                    f.id === selectedField 
                                      ? { ...f, required: checked }
                                      : f
                                  )
                                }))
                              };
                              setEditingForm(updated);
                            }}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">占位符文本</Label>
                          <Input 
                            value={field.placeholder || ''}
                            onChange={(e) => {
                              const updated = {
                                ...editingForm,
                                sections: editingForm.sections.map(s => ({
                                  ...s,
                                  fields: s.fields.map(f => 
                                    f.id === selectedField 
                                      ? { ...f, placeholder: e.target.value }
                                      : f
                                  )
                                }))
                              };
                              setEditingForm(updated);
                            }}
                            className="mt-1"
                            placeholder="输入占位符..."
                          />
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 🎨 样式设置 */}
          <TabsContent value="style" className="flex-1 m-0 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">样式设置</h2>
                <p className="text-gray-500">自定义表单的颜色、字体和布局样式</p>
              </div>

              {editingForm && (
                <>
                  {/* 颜色预设 */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">配色方案</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleApplyColorPreset(preset)}
                          className="p-4 border-2 rounded-lg hover:shadow-lg transition-all"
                        >
                          <div className="flex gap-2 mb-2">
                            <div 
                              className="h-8 w-8 rounded"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="h-8 w-8 rounded"
                              style={{ backgroundColor: preset.secondary }}
                            />
                          </div>
                          <p className="text-sm font-medium">{preset.name}</p>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* 自定义颜色 */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">自定义颜色</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>主色调</Label>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            type="color"
                            value={editingForm.styling.primaryColor}
                            onChange={(e) => handleUpdateStyling('primaryColor', e.target.value)}
                            className="h-10 w-20"
                          />
                          <Input 
                            value={editingForm.styling.primaryColor}
                            onChange={(e) => handleUpdateStyling('primaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>辅助色</Label>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            type="color"
                            value={editingForm.styling.secondaryColor}
                            onChange={(e) => handleUpdateStyling('secondaryColor', e.target.value)}
                            className="h-10 w-20"
                          />
                          <Input 
                            value={editingForm.styling.secondaryColor}
                            onChange={(e) => handleUpdateStyling('secondaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 字体设置 */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">字体设置</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>字体系列</Label>
                        <Select 
                          value={editingForm.styling.fontFamily}
                          onValueChange={(value) => handleUpdateStyling('fontFamily', value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                            <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>基础字号 ({editingForm.styling.fontSize}pt)</Label>
                        <Slider 
                          value={[editingForm.styling.fontSize]}
                          onValueChange={([value]) => handleUpdateStyling('fontSize', value)}
                          min={8}
                          max={16}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>行高 ({editingForm.styling.lineHeight})</Label>
                        <Slider 
                          value={[editingForm.styling.lineHeight]}
                          onValueChange={([value]) => handleUpdateStyling('lineHeight', value)}
                          min={1.0}
                          max={2.0}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* 👁️ 实时预览 */}
          <TabsContent value="preview" className="flex-1 m-0 overflow-y-auto bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">表单预览</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    导出PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    打印预览
                  </Button>
                </div>
              </div>

              {editingForm && (
                <div 
                  className="bg-white shadow-2xl mx-auto"
                  style={{
                    width: editingForm.pageSettings.orientation === 'portrait' ? '210mm' : '297mm',
                    minHeight: editingForm.pageSettings.orientation === 'portrait' ? '297mm' : '210mm',
                    padding: `${editingForm.pageSettings.margins.top}mm ${editingForm.pageSettings.margins.right}mm ${editingForm.pageSettings.margins.bottom}mm ${editingForm.pageSettings.margins.left}mm`,
                  }}
                >
                  {/* 完整的表单预览内容（与设计布局相同，但不可编辑） */}
                  {editingForm.pageSettings.header && (
                    <div className="border-b-2 pb-4 mb-6" style={{ borderColor: editingForm.styling.primaryColor }}>
                      {editingForm.header.logo.enabled && (
                        <div className={`mb-3 flex ${
                          editingForm.header.logo.position === 'left' ? 'justify-start' :
                          editingForm.header.logo.position === 'center' ? 'justify-center' :
                          'justify-end'
                        }`}>
                          <div 
                            className="bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center rounded shadow-lg"
                            style={{
                              width: `${editingForm.header.logo.size.width}mm`,
                              height: `${editingForm.header.logo.size.height}mm`
                            }}
                          >
                            <Building className="h-12 w-12 text-white" />
                          </div>
                        </div>
                      )}

                      {editingForm.header.companyInfo.enabled && (
                        <div className="text-sm mb-4" style={{ color: editingForm.styling.secondaryColor }}>
                          <p className="font-bold text-base">Fujian Cosun Tuff Building Materials Co., Ltd.</p>
                          <p className="font-semibold">福建高盛达富建材有限公司</p>
                          <p className="mt-1">📍 Address: Fujian Province, China</p>
                          <p>📧 Email: info@cosuntuff.com | 📞 Phone: +86-xxx-xxxx</p>
                          <p>🌐 Website: www.cosuntuff.com</p>
                        </div>
                      )}

                      <h1 
                        className="font-bold"
                        style={{
                          fontSize: `${editingForm.header.title.fontSize}pt`,
                          textAlign: editingForm.header.title.alignment,
                          color: editingForm.styling.primaryColor
                        }}
                      >
                        {editingForm.header.title.text}
                      </h1>
                    </div>
                  )}

                  <div className="space-y-6">
                    {editingForm.sections.map((section) => (
                      <div key={section.id}>
                        <h3 
                          className="font-bold mb-3 pb-2 border-b"
                          style={{ 
                            color: editingForm.styling.primaryColor,
                            borderColor: editingForm.styling.secondaryColor 
                          }}
                        >
                          {section.title}
                        </h3>
                        <div className={`grid ${
                          section.layout === 'single' ? 'grid-cols-1' :
                          section.layout === 'double' ? 'grid-cols-2' :
                          'grid-cols-3'
                        } gap-4`}>
                          {section.fields.map((field) => (
                            <div
                              key={field.id}
                              className={field.width === '100%' ? 'col-span-full' : ''}
                            >
                              <Label className="text-sm mb-1 flex items-center gap-1">
                                {field.label}
                                {field.required && <span className="text-red-500">*</span>}
                              </Label>
                              {field.type === 'textarea' ? (
                                <Textarea 
                                  placeholder={field.placeholder || field.label}
                                  className="text-sm"
                                  rows={3}
                                />
                              ) : field.type === 'select' ? (
                                <Select>
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder={field.placeholder || "请选择..."} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((opt, i) => (
                                      <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.type === 'date' ? (
                                <div className="flex items-center gap-2 border rounded px-3 py-2 text-sm bg-white">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-400">选择日期...</span>
                                </div>
                              ) : field.type === 'table' ? (
                                <div className="border rounded overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="border px-2 py-1 text-left">序号</th>
                                        <th className="border px-2 py-1 text-left">项目</th>
                                        <th className="border px-2 py-1 text-right">数量</th>
                                        <th className="border px-2 py-1 text-right">单价</th>
                                        <th className="border px-2 py-1 text-right">金额</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="border px-2 py-2 text-gray-400">1</td>
                                        <td className="border px-2 py-2 text-gray-400">示例项目</td>
                                        <td className="border px-2 py-2 text-gray-400 text-right">-</td>
                                        <td className="border px-2 py-2 text-gray-400 text-right">-</td>
                                        <td className="border px-2 py-2 text-gray-400 text-right">-</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <Input 
                                  placeholder={field.placeholder || field.label}
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  className="text-sm"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingForm.pageSettings.footer && (
                    <div className="border-t-2 pt-6 mt-8" style={{ borderColor: editingForm.styling.secondaryColor }}>
                      {editingForm.footer.signatureLines?.enabled && (
                        <div className="grid grid-cols-2 gap-12 mb-6">
                          {editingForm.footer.signatureLines.parties.map((party, index) => (
                            <div key={index}>
                              <p className="text-sm font-semibold mb-12" style={{ color: editingForm.styling.secondaryColor }}>
                                {party.label}:
                              </p>
                              <div className="border-t-2 border-black pt-2">
                                <p className="text-xs text-gray-500">签名 / Signature</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">日期 / Date: _______________</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-gray-500 pt-4">
                        <span>打印日期: {new Date().toLocaleDateString('zh-CN')}</span>
                        <span>表单编号: {editingForm.id}</span>
                        <span>页码: 1 / 1</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}
