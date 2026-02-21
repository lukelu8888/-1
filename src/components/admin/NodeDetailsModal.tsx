import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { toast } from 'sonner@2.0.3';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  ImageIcon,
  FileIcon,
  Edit3,
  AlertTriangle,
  Info
} from 'lucide-react';

// ==================== 类型定义 ====================

interface NodeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  category: string;
}

interface NodeBusinessData {
  [key: string]: string | number | boolean;
}

interface OperationLog {
  id: string;
  action: string;
  operator: string;
  timestamp: string;
  details?: string;
}

interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeInfo: {
    id: string;
    label: string;
    description: string;
    requiresFiles: boolean;
    fileTypes: string[];
    businessFields: string[];
  };
  nodeProgress?: {
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'failed';
    completedAt?: string;
    operator?: string;
    notes?: string;
    files?: NodeFile[];
    businessData?: NodeBusinessData;
    operationLogs?: OperationLog[];
  };
  onSave?: (data: {
    status: string;
    businessData: NodeBusinessData;
    notes: string;
    files: NodeFile[];
  }) => void;
}

// ==================== 主组件 ====================

export default function NodeDetailsModal({
  isOpen,
  onClose,
  nodeInfo,
  nodeProgress,
  onSave
}: NodeDetailsModalProps) {
  // 状态管理
  const [status, setStatus] = useState(nodeProgress?.status || 'pending');
  const [businessData, setBusinessData] = useState<NodeBusinessData>(nodeProgress?.businessData || {});
  const [notes, setNotes] = useState(nodeProgress?.notes || '');
  const [files, setFiles] = useState<NodeFile[]>(nodeProgress?.files || []);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // 操作日志
  const operationLogs: OperationLog[] = nodeProgress?.operationLogs || [
    {
      id: '1',
      action: '节点创建',
      operator: '系统',
      timestamp: '2024-11-20 10:00',
      details: '节点初始化'
    },
    ...(nodeProgress?.completedAt ? [{
      id: '2',
      action: '节点完成',
      operator: nodeProgress.operator || '未知',
      timestamp: nodeProgress.completedAt,
      details: '节点标记为完成'
    }] : [])
  ];

  // 文件按类型分组
  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.category]) {
      acc[file.category] = [];
    }
    acc[file.category].push(file);
    return acc;
  }, {} as Record<string, NodeFile[]>);

  // 处理文件上传
  const handleFileUpload = (category: string) => {
    setUploadingFiles(true);
    setTimeout(() => {
      const newFile: NodeFile = {
        id: `file_${Date.now()}`,
        name: `${category}_${Date.now()}.pdf`,
        type: 'application/pdf',
        size: Math.floor(Math.random() * 5000000) + 100000,
        url: '#',
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: '张三',
        category
      };
      setFiles([...files, newFile]);
      setUploadingFiles(false);
      toast.success(`${category} 上传成功`);
    }, 1500);
  };

  // 删除文件
  const handleDeleteFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
    toast.success('文件已删除');
  };

  // 下载文件
  const handleDownloadFile = (file: NodeFile) => {
    // 模拟下载
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
    toast.success('文件下载中...');
  };

  // 保存更改
  const handleSave = () => {
    if (onSave) {
      onSave({ status, businessData, notes, files });
    }
    toast.success('保存成功');
    setIsEditing(false);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 获取状态显示
  const getStatusDisplay = (s: string) => {
    const statusMap = {
      'pending': { label: '待处理', color: 'gray', icon: Clock },
      'in_progress': { label: '进行中', color: 'blue', icon: Clock },
      'completed': { label: '已完成', color: 'green', icon: CheckCircle2 },
      'delayed': { label: '延误', color: 'red', icon: AlertCircle },
      'failed': { label: '失败', color: 'red', icon: X }
    };
    return statusMap[s as keyof typeof statusMap] || statusMap.pending;
  };

  const statusDisplay = getStatusDisplay(status);
  const StatusIcon = statusDisplay.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 - 紧凑设计 */}
        <DialogHeader className="border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-medium text-gray-900">
                {nodeInfo.label}
              </DialogTitle>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500">{nodeInfo.description}</span>
              <Badge variant="outline" className={`bg-${statusDisplay.color}-50 text-${statusDisplay.color}-700 border-${statusDisplay.color}-200 text-xs h-5`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusDisplay.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)} className="h-7 text-xs">
                  <Edit3 className="w-3 h-3 mr-1" />
                  编辑
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setBusinessData(nodeProgress?.businessData || {});
                      setNotes(nodeProgress?.notes || '');
                    }}
                    className="h-7 text-xs"
                  >
                    取消
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="h-7 text-xs bg-orange-500 hover:bg-orange-600"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    保存
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* 主内容区 - 三列布局，高信息密度 */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3 p-3">
            {/* 左列：节点状态 + 业务信息 */}
            <div className="space-y-3">
              {/* 节点状态卡片 */}
              <div className="border border-gray-200 rounded">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <h4 className="text-xs font-medium text-gray-700">节点状态</h4>
                </div>
                <div className="p-3 space-y-2.5">
                  <div>
                    <Label className="text-xs text-gray-500">当前状态</Label>
                    {isEditing ? (
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-7 mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">待处理</SelectItem>
                          <SelectItem value="in_progress">进行中</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                          <SelectItem value="delayed">延误</SelectItem>
                          <SelectItem value="failed">失败</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        <Badge variant="outline" className={`bg-${statusDisplay.color}-50 text-${statusDisplay.color}-700 border-${statusDisplay.color}-200 text-xs h-6`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusDisplay.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-xs text-gray-500">操作人</Label>
                      <p className="text-xs text-gray-900 mt-1">{nodeProgress?.operator || '未分配'}</p>
                    </div>
                    {nodeProgress?.completedAt && (
                      <div>
                        <Label className="text-xs text-gray-500">完成时间</Label>
                        <p className="text-xs text-gray-900 mt-1">{nodeProgress.completedAt}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 业务信息卡片 */}
              <div className="border border-gray-200 rounded">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <h4 className="text-xs font-medium text-gray-700">业务信息</h4>
                  {nodeInfo.businessFields.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5">
                      {Object.keys(businessData).length}/{nodeInfo.businessFields.length}
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  {/* 特殊处理：报关节点显示引用提示 */}
                  {nodeInfo.id === 'customs_declare' && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-900 mb-1">产品清单已从单证中心同步</p>
                          <p className="text-xs text-blue-700">
                            本节点的产品信息来自<strong>单证制作中心</strong>，如需修改请前往单证中心编辑
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              toast.info('跳转到单证制作中心...');
                              // 这里可以实现实际的路由跳转
                            }}
                          >
                            前往单证中心 →
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {nodeInfo.businessFields.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">无需填写业务字段</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {nodeInfo.businessFields.map((field) => (
                        <div key={field}>
                          <Label className="text-xs text-gray-600 flex items-center gap-1">
                            {field}
                            {isEditing && <span className="text-red-500">*</span>}
                          </Label>
                          {isEditing ? (
                            <Input
                              value={businessData[field] as string || ''}
                              onChange={(e) => setBusinessData({
                                ...businessData,
                                [field]: e.target.value
                              })}
                              placeholder={`请输入${field}`}
                              className="h-7 mt-1 text-xs"
                            />
                          ) : (
                            <p className="text-xs text-gray-900 mt-1 py-1">
                              {businessData[field] || <span className="text-gray-400">未填写</span>}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 备注说明 */}
              <div className="border border-gray-200 rounded">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <h4 className="text-xs font-medium text-gray-700">备注说明</h4>
                </div>
                <div className="p-3">
                  {isEditing ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="添加备注说明..."
                      rows={3}
                      className="resize-none text-xs"
                    />
                  ) : (
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                      {notes || '暂无备注'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 中列：文件管理 */}
            <div className="space-y-3">
              {/* 必传文件说明 */}
              {nodeInfo.requiresFiles && nodeInfo.fileTypes.length > 0 && (
                <div className="border border-orange-200 bg-orange-50 rounded p-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-orange-900 mb-1.5">必传文件</p>
                      <div className="flex flex-wrap gap-1.5">
                        {nodeInfo.fileTypes.map((type) => (
                          <Badge key={type} variant="outline" className="bg-white text-orange-700 border-orange-200 text-xs h-5">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 文件列表 */}
              {nodeInfo.fileTypes.map((category) => (
                <div key={category} className="border border-gray-200 rounded">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-700">{category}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFileUpload(category)}
                      disabled={uploadingFiles}
                      className="h-6 text-xs px-2"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      上传
                    </Button>
                  </div>
                  <div className="p-2">
                    {groupedFiles[category] && groupedFiles[category].length > 0 ? (
                      <div className="space-y-1.5">
                        {groupedFiles[category].map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                                {file.type.includes('image') ? (
                                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <FileIcon className="w-3.5 h-3.5 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span>•</span>
                                  <span className="truncate">{file.uploadedBy}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Eye className="w-3 h-3 text-gray-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDownloadFile(file)}
                              >
                                <Download className="w-3 h-3 text-gray-500" />
                              </Button>
                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteFile(file.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">暂无文件</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 其他文件 */}
              {Object.keys(groupedFiles).some(key => !nodeInfo.fileTypes.includes(key)) && (
                <div className="border border-gray-200 rounded">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <h4 className="text-xs font-medium text-gray-700">其他文件</h4>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {Object.entries(groupedFiles)
                      .filter(([category]) => !nodeInfo.fileTypes.includes(category))
                      .flatMap(([_, files]) => files)
                      .map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDownloadFile(file)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 右列：操作记录 + 快速统计 */}
            <div className="space-y-3">
              {/* 快速统计 */}
              <div className="grid grid-cols-1 gap-2">
                <div className="border border-gray-200 rounded p-2.5 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">业务字段</p>
                      <p className="text-lg font-semibold text-gray-900 mt-0.5">
                        {Object.keys(businessData).length}<span className="text-sm text-gray-400">/{nodeInfo.businessFields.length}</span>
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-2.5 bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">上传文件</p>
                      <p className="text-lg font-semibold text-gray-900 mt-0.5">
                        {files.length}<span className="text-sm text-gray-400">/{nodeInfo.fileTypes.length}</span>
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded bg-purple-100 flex items-center justify-center">
                      <FileIcon className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-2.5 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">操作记录</p>
                      <p className="text-lg font-semibold text-gray-900 mt-0.5">{operationLogs.length}</p>
                    </div>
                    <div className="w-9 h-9 rounded bg-green-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作时间线 */}
              <div className="border border-gray-200 rounded">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <h4 className="text-xs font-medium text-gray-700">操作时间线</h4>
                </div>
                <div className="p-3 max-h-[400px] overflow-y-auto">
                  <div className="space-y-3">
                    {operationLogs.map((log, index) => (
                      <div key={log.id} className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3 h-3 text-blue-600" />
                          </div>
                          {index < operationLogs.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 mt-1.5" style={{ minHeight: '16px' }} />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-start justify-between mb-0.5">
                            <p className="text-xs font-medium text-gray-900">{log.action}</p>
                            <span className="text-xs text-gray-400 ml-2">{log.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span>{log.operator}</span>
                          </div>
                          {log.details && (
                            <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}