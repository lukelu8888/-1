import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Edit2, XCircle, Settings, Layers, Plus, Trash2, Copy, Save, Eye, Download,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { FormTemplate } from '../config/formTemplates';

interface FormEditorDialogProps {
  formData: FormTemplate;
  onClose: () => void;
  onSave: (data: FormTemplate) => void;
  onPreview: (form: FormTemplate) => void;
}

export function FormEditorDialog({ formData: initialData, onClose, onSave, onPreview }: FormEditorDialogProps) {
  const [formData, setFormData] = useState<FormTemplate>(JSON.parse(JSON.stringify(initialData)));
  const [editingFieldIndex, setEditingFieldIndex] = useState<{sectionIndex: number, fieldIndex: number} | null>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const updateBasicInfo = (key: keyof FormTemplate, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const updateSectionTitle = (sectionIndex: number, title: string) => {
    const newData = { ...formData };
    newData.sections[sectionIndex].title = title;
    setFormData(newData);
  };

  const updateField = (sectionIndex: number, fieldIndex: number, updates: Partial<any>) => {
    const newData = { ...formData };
    newData.sections[sectionIndex].fields[fieldIndex] = {
      ...newData.sections[sectionIndex].fields[fieldIndex],
      ...updates
    };
    setFormData(newData);
  };

  const deleteField = (sectionIndex: number, fieldIndex: number) => {
    if (confirm('确定要删除这个字段吗？')) {
      const newData = { ...formData };
      newData.sections[sectionIndex].fields.splice(fieldIndex, 1);
      setFormData(newData);
    }
  };

  const addField = (sectionIndex: number) => {
    const newData = { ...formData };
    const newField = {
      id: `field_${Date.now()}`,
      label: '新字段',
      type: 'text',
      required: false,
      placeholder: ''
    };
    newData.sections[sectionIndex].fields.push(newField);
    setFormData(newData);
  };

  const copyField = (sectionIndex: number, fieldIndex: number) => {
    const newData = { ...formData };
    const fieldToCopy = { ...newData.sections[sectionIndex].fields[fieldIndex] };
    fieldToCopy.id = `${fieldToCopy.id}_copy_${Date.now()}`;
    fieldToCopy.label = `${fieldToCopy.label} (副本)`;
    newData.sections[sectionIndex].fields.splice(fieldIndex + 1, 0, fieldToCopy);
    setFormData(newData);
  };

  const deleteSection = (sectionIndex: number) => {
    if (confirm('确定要删除这个区块吗？将同时删除区块内的所有字段。')) {
      const newData = { ...formData };
      newData.sections.splice(sectionIndex, 1);
      setFormData(newData);
    }
  };

  const addSection = () => {
    const newData = { ...formData };
    const newSection = {
      title: `区块 ${newData.sections.length + 1}`,
      fields: []
    };
    newData.sections.push(newSection);
    setFormData(newData);
    setExpandedSections([...expandedSections, newData.sections.length - 1]);
  };

  const toggleSection = (sectionIndex: number) => {
    if (expandedSections.includes(sectionIndex)) {
      setExpandedSections(expandedSections.filter(i => i !== sectionIndex));
    } else {
      setExpandedSections([...expandedSections, sectionIndex]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur p-2 rounded-lg">
              <Edit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">编辑表单: {formData.name}</h3>
              <p className="text-purple-100 text-sm">{formData.name_en}</p>
            </div>
          </div>
          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="text-white hover:bg-white/20"
          >
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Card className="p-6 border-l-4 border-l-purple-500">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              基本信息
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">表单中文名</label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => updateBasicInfo('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">表单英文名</label>
                <Input 
                  value={formData.name_en} 
                  onChange={(e) => updateBasicInfo('name_en', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">表单类型</label>
                <select 
                  className="w-full p-2 border rounded-lg" 
                  value={formData.type}
                  onChange={(e) => updateBasicInfo('type', e.target.value)}
                >
                  <option value="inquiry">询价类</option>
                  <option value="quotation">报价类</option>
                  <option value="contract">合同类</option>
                  <option value="invoice">发票类</option>
                  <option value="shipping">物流类</option>
                  <option value="financial">财务类</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">所属方</label>
                <select 
                  className="w-full p-2 border rounded-lg" 
                  value={formData.owner}
                  onChange={(e) => updateBasicInfo('owner', e.target.value)}
                >
                  <option value="customer">客户</option>
                  <option value="cosun">Cosun</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">版本号</label>
                <Input 
                  value={formData.version} 
                  onChange={(e) => updateBasicInfo('version', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">最后修改日期</label>
                <Input 
                  type="date" 
                  value={formData.lastModified} 
                  onChange={(e) => updateBasicInfo('lastModified', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {formData.sections.map((section, sIndex) => {
            const isExpanded = expandedSections.includes(sIndex);
            
            return (
              <Card key={sIndex} className="border-l-4 border-l-indigo-500">
                <div 
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSection(sIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-0 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection(sIndex);
                        }}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </Button>
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <Input
                        value={section.title}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateSectionTitle(sIndex, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold max-w-xs"
                      />
                      <Badge variant="outline">{section.fields.length} 个字段</Badge>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => addField(sIndex)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        添加字段
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteSection(sIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {section.fields.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>暂无字段，点击上方"添加字段"按钮添加</p>
                      </div>
                    ) : (
                      section.fields.map((field, fIndex) => {
                        const isEditing = editingFieldIndex?.sectionIndex === sIndex && editingFieldIndex?.fieldIndex === fIndex;
                        
                        return (
                          <div key={fIndex} className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-xs text-gray-600">字段标签</label>
                                    <Input
                                      value={field.label}
                                      onChange={(e) => updateField(sIndex, fIndex, { label: e.target.value })}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">字段类型</label>
                                    <select
                                      value={field.type}
                                      onChange={(e) => updateField(sIndex, fIndex, { type: e.target.value })}
                                      className="w-full p-2 border rounded text-sm"
                                    >
                                      <option value="text">文本</option>
                                      <option value="textarea">多行文本</option>
                                      <option value="number">数字</option>
                                      <option value="date">日期</option>
                                      <option value="select">下拉选择</option>
                                      <option value="checkbox">复选框</option>
                                      <option value="radio">单选框</option>
                                      <option value="file">文件上传</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">字段ID</label>
                                    <Input
                                      value={field.id}
                                      onChange={(e) => updateField(sIndex, fIndex, { id: e.target.value })}
                                      className="text-sm font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-gray-600">占位符</label>
                                    <Input
                                      value={field.placeholder || ''}
                                      onChange={(e) => updateField(sIndex, fIndex, { placeholder: e.target.value })}
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="flex items-end gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={field.required || false}
                                        onChange={(e) => updateField(sIndex, fIndex, { required: e.target.checked })}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">必填字段</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingFieldIndex(null)}
                                  >
                                    完成
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {fIndex + 1}
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-3 items-center">
                                  <div>
                                    <div className="font-medium text-sm">{field.label}</div>
                                    <div className="text-xs text-gray-500 font-mono">{field.id}</div>
                                  </div>
                                  <div>
                                    <Badge>{field.type}</Badge>
                                  </div>
                                  <div>
                                    {field.required ? (
                                      <Badge variant="destructive">必填</Badge>
                                    ) : (
                                      <Badge variant="outline">可选</Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-1 justify-end">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 px-2"
                                      onClick={() => setEditingFieldIndex({ sectionIndex: sIndex, fieldIndex: fIndex })}
                                      title="编辑字段"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 px-2"
                                      onClick={() => copyField(sIndex, fIndex)}
                                      title="复制字段"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => deleteField(sIndex, fIndex)}
                                      title="删除字段"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          <Button 
            variant="outline" 
            className="w-full border-2 border-dashed hover:border-indigo-500 hover:bg-indigo-50"
            onClick={addSection}
          >
            <Plus className="w-4 h-4 mr-2" />
            添加新区块
          </Button>
        </div>

        <div className="flex gap-3 justify-between p-6 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                onClose();
                onPreview(formData);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const dataStr = JSON.stringify(formData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${formData.id}.json`;
                a.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              导出JSON
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button 
              onClick={() => onSave(formData)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Save className="w-4 h-4 mr-2" />
              保存更改
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
