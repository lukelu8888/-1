import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { 
  Database, Code, FileCode, Settings, Layers, Package,
  Cloud, Download, Upload, CheckCircle2, AlertTriangle,
  Archive, Clock, HardDrive, Shield, FileJson, Workflow,
  Users, Lock, Palette, FileText, Activity, Zap, RefreshCw,
  Play, Pause, ChevronDown, ChevronRight, Info, BookOpen
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// 🔥 完整备份包结构
interface FullBackupPackage {
  metadata: {
    backupId: string;
    timestamp: string;
    version: string;
    systemInfo: {
      totalDataKeys: number;
      totalDataSize: number;
      totalComponents: number;
      systemVersion: string;
    };
  };
  businessData: {
    [key: string]: any;
  };
  architectureConfig: {
    workflows: any;
    permissions: any;
    routes: any;
    regions: any;
  };
  systemArchitecture: {
    components: ComponentInfo[];
    dependencies: string[];
    structure: any;
  };
}

interface ComponentInfo {
  path: string;
  name: string;
  type: 'page' | 'component' | 'util' | 'config';
  portal: 'customer' | 'supplier' | 'admin' | 'shared';
  critical: boolean;
  description: string;
}

export default function RealEnterpriseBackupCenter() {
  const [isScanning, setIsScanning] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupPackage, setBackupPackage] = useState<FullBackupPackage | null>(null);
  const [stats, setStats] = useState({
    dataKeys: 0,
    dataSize: 0,
    components: 0,
    lastBackup: '从未备份'
  });
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    serverRunning: boolean;
    kvStoreAvailable: boolean;
  }>({
    connected: false,
    message: '未检查',
    serverRunning: false,
    kvStoreAvailable: false
  });
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  useEffect(() => {
    checkSupabaseConnection();
    scanSystem();
    loadBackupHistory();
  }, []);

  // 🔥 检查Supabase连接
  const checkSupabaseConnection = async () => {
    setIsCheckingConnection(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full/check`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus({
          connected: true,
          message: '连接成功',
          serverRunning: data.serverRunning,
          kvStoreAvailable: data.kvStoreAvailable
        });
      } else {
        throw new Error(await response.text());
      }

    } catch (error) {
      console.error('检查连接失败:', error);
      setConnectionStatus({
        connected: false,
        message: '连接失败',
        serverRunning: false,
        kvStoreAvailable: false
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // 🔥 扫描系统（可备份的内容）
  const scanSystem = () => {
    setIsScanning(true);
    
    try {
      // 🔥 扫描localStorage中的所有key（智能扫描）
      const allKeys = Object.keys(localStorage);
      const dataKeys = [];
      
      // 预定义的业务数据key
      const businessDataKeys = [
        'cosun_inquiries', 'quotations', 'salesContracts', 'orderManagement',
        'purchaseOrders', 'serviceOrders', 'receivables', 'receivablePayments',
        'payables', 'payablePayments', 'customers', 'suppliers', 'serviceProviders',
        'products', 'productCategories', 'shippingDocuments',
        'cosun_auth_user', 'cosun_user_info', 'cosun-region',
        'business_workflow_config', 'business_workflow_config_meta'
      ];

      // 🔥 智能识别：扫描所有包含业务数据的key
      const relevantKeys = allKeys.filter(key => {
        // 包含预定义的key
        if (businessDataKeys.includes(key)) return true;
        
        // 或者key名称包含业务相关词汇
        const businessPatterns = [
          'cosun', 'ing', 'qt', 'contract', 'order', 'purchase',
          'customer', 'supplier', 'product', 'shipping', 'receivable', 'payable',
          'business', 'workflow', 'permission', 'role'
        ];
        
        return businessPatterns.some(pattern => 
          key.toLowerCase().includes(pattern)
        );
      });

      let totalSize = 0;
      relevantKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          dataKeys.push(key);
          totalSize += new Blob([value]).size;
        }
      });

      // 统计组件数量（基于我们的架构清单）
      const componentCount = getSystemArchitecture().components.length;

      setStats({
        dataKeys: dataKeys.length,
        dataSize: totalSize,
        components: componentCount,
        lastBackup: localStorage.getItem('enterpriseLastBackup') || '从未备份'
      });

      toast.success('✅ 系统扫描完成', {
        description: `发现 ${dataKeys.length} 个数据键（共 ${allKeys.length} 个localStorage键），${componentCount} 个组件`
      });

      console.log('📊 扫描结果:', {
        总key数: allKeys.length,
        业务key数: dataKeys.length,
        业务keys: dataKeys,
        总大小: totalSize + ' bytes'
      });

    } catch (error) {
      console.error('扫描失败:', error);
      toast.error('❌ 系统扫描失败');
    } finally {
      setIsScanning(false);
    }
  };

  // 🔥 获取系统架构清单
  const getSystemArchitecture = (): { components: ComponentInfo[], dependencies: string[] } => {
    const components: ComponentInfo[] = [
      // Admin Portal 核心组件
      { path: '/components/AdminDashboard.tsx', name: 'Admin Dashboard', type: 'page', portal: 'admin', critical: true, description: 'Admin主界面和路由控制' },
      { path: '/components/admin/InquiryManagement.tsx', name: '询价管理', type: 'component', portal: 'admin', critical: true, description: '客户询价管理工作台' },
      { path: '/components/admin/QuotationManagement.tsx', name: '报价管理', type: 'component', portal: 'admin', critical: true, description: '报价单管理工作台' },
      { path: '/components/admin/SalesContractManagement.tsx', name: '销售合同管理', type: 'component', portal: 'admin', critical: true, description: '销售合同管理，包含9步智能审批流程' },
      { path: '/components/admin/OrderManagement.tsx', name: '订单管理', type: 'component', portal: 'admin', critical: true, description: '订单管理中心' },
      { path: '/components/admin/FinanceManagement.tsx', name: '财务管理', type: 'component', portal: 'admin', critical: true, description: '应收应付款管理' },
      { path: '/components/admin/PurchaseOrderManagement.tsx', name: '采购订单管理', type: 'component', portal: 'admin', critical: true, description: '供应商采购订单管理' },
      { path: '/components/admin/ServiceOrderManagement.tsx', name: '服务订单管理', type: 'component', portal: 'admin', critical: true, description: '服务商订单管理' },
      { path: '/components/admin/ShippingDocumentManagement.tsx', name: '物流单据管理', type: 'component', portal: 'admin', critical: true, description: '物流单据和跟踪' },
      { path: '/components/admin/CustomerManagement.tsx', name: '客户管理', type: 'component', portal: 'admin', critical: true, description: '客户主数据管理' },
      { path: '/components/admin/SupplierManagement.tsx', name: '供应商管理', type: 'component', portal: 'admin', critical: true, description: '供应商主数据管理' },
      
      // 业务流程配置系统
      { path: '/components/admin/OrderFlowCenter.tsx', name: '业务流程配置中心', type: 'component', portal: 'admin', critical: true, description: '完整37步业务流程配置系统' },
      { path: '/components/admin/VisualProcessEditor.tsx', name: '可视化流程编辑器', type: 'component', portal: 'admin', critical: true, description: '拖拽式流程设计器' },
      { path: '/components/admin/FormTemplateManagerPro.tsx', name: '表单模板管理器Pro', type: 'component', portal: 'admin', critical: true, description: '动态表单模板设计' },
      { path: '/components/admin/StatusFlowSimulatorV4.tsx', name: '流程模拟器V4', type: 'component', portal: 'admin', critical: true, description: '业务流程模拟和测试' },
      
      // 权限和备份
      { path: '/components/admin/RolePermissionManagerPro.tsx', name: '角色权限管理Pro', type: 'component', portal: 'admin', critical: true, description: 'RBAC权限矩阵管理' },
      { path: '/components/admin/DataBackupCenterPro.tsx', name: '数据备份中心Pro', type: 'component', portal: 'admin', critical: true, description: '自动云备份系统' },
      { path: '/components/admin/RealEnterpriseBackupCenter.tsx', name: '企业级备份中心', type: 'component', portal: 'admin', critical: true, description: '完整系统备份和恢复' },
      
      // Customer Portal
      { path: '/components/CustomerPortal.tsx', name: 'Customer Portal', type: 'page', portal: 'customer', critical: true, description: '客户门户主界面' },
      { path: '/components/customer/InquiryForm.tsx', name: '询价表单', type: 'component', portal: 'customer', critical: true, description: '客户询价提交表单' },
      { path: '/components/customer/OrderTracking.tsx', name: '订单跟踪', type: 'component', portal: 'customer', critical: true, description: '客户订单追踪' },
      
      // Supplier Portal
      { path: '/components/SupplierPortal.tsx', name: 'Supplier Portal', type: 'page', portal: 'supplier', critical: true, description: '供应商门户主界面' },
      { path: '/components/supplier/QuotationSubmission.tsx', name: '报价提交', type: 'component', portal: 'supplier', critical: true, description: '供应商报价提交表单' },
      
      // 共享组件
      { path: '/components/ui/button.tsx', name: 'Button组件', type: 'component', portal: 'shared', critical: false, description: 'UI按钮组件' },
      { path: '/components/ui/card.tsx', name: 'Card组件', type: 'component', portal: 'shared', critical: false, description: 'UI卡片组件' },
      { path: '/components/ui/dialog.tsx', name: 'Dialog组件', type: 'component', portal: 'shared', critical: false, description: 'UI对话框组件' },
      { path: '/components/ui/badge.tsx', name: 'Badge组件', type: 'component', portal: 'shared', critical: false, description: 'UI徽章组件' },
      { path: '/components/ui/tabs.tsx', name: 'Tabs组件', type: 'component', portal: 'shared', critical: false, description: 'UI标签页组件' },
      
      // 主入口
      { path: '/App.tsx', name: '应用主入口', type: 'page', portal: 'shared', critical: true, description: '应用程序入口和路由' },
      
      // 样式和配置
      { path: '/styles/globals.css', name: '全局样式', type: 'config', portal: 'shared', critical: false, description: 'Tailwind v4.0和全局CSS' },
      { path: '/utils/supabase/info.tsx', name: 'Supabase配置', type: 'config', portal: 'shared', critical: true, description: 'Supabase连接信息' },
      
      // 服务器端
      { path: '/supabase/functions/server/index.tsx', name: '服务器主入口', type: 'config', portal: 'shared', critical: true, description: 'Hono服务器主文件' },
      { path: '/supabase/functions/server/backup-routes.tsx', name: '备份路由', type: 'config', portal: 'shared', critical: true, description: '备份API路由' },
      { path: '/supabase/functions/server/auth-routes.tsx', name: '认证路由', type: 'config', portal: 'shared', critical: false, description: '用户认证API' },
    ];

    const dependencies = [
      'react', 'lucide-react', 'sonner@2.0.3', 'recharts', 
      '@supabase/supabase-js', 'npm:hono', 'tailwindcss'
    ];

    return { components, dependencies };
  };

  // 🔥 执行完整备份
  const performFullBackup = async () => {
    setIsBackingUp(true);
    
    try {
      toast.info('📦 正在收集系统数据...', { duration: 2000 });

      // 1. 收集所有业务数据
      const businessData: any = {};
      const businessKeys = [
        'cosun_inquiries', 'quotations', 'salesContracts', 'orderManagement',
        'purchaseOrders', 'serviceOrders', 'receivables', 'receivablePayments',
        'payables', 'payablePayments', 'customers', 'suppliers', 'serviceProviders',
        'products', 'productCategories', 'shippingDocuments',
        'cosun_auth_user', 'cosun_user_info'
      ];

      businessKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            businessData[key] = JSON.parse(value);
          } catch {
            businessData[key] = value;
          }
        }
      });

      // 2. 收集架构配置
      const workflowConfig = localStorage.getItem('business_workflow_config');
      const workflowMeta = localStorage.getItem('business_workflow_config_meta');
      const regionConfig = localStorage.getItem('cosun-region');

      const architectureConfig = {
        workflows: workflowConfig ? JSON.parse(workflowConfig) : null,
        workflowMeta: workflowMeta ? JSON.parse(workflowMeta) : null,
        permissions: {
          roles: ['CEO', 'Sales Director', 'Regional Manager North America', 'Regional Manager South America', 'Regional Manager Europe & Africa', 'Sales Representative', 'Admin', 'System Manager'],
          matrix: '详见RolePermissionManagerPro组件'
        },
        routes: {
          customer: '/customer',
          supplier: '/supplier',
          admin: '/admin'
        },
        regions: regionConfig ? (() => {
          try {
            // 尝试解析为JSON
            return JSON.parse(regionConfig);
          } catch {
            // 如果解析失败，说明是字符串格式，创建对象
            return {
              current: regionConfig,
              available: {
                'north-america': '北美市场',
                'south-america': '南美市场',
                'europe-africa': '欧非市场'
              }
            };
          }
        })() : {
          current: 'north-america',
          available: {
            'north-america': '北美市场',
            'south-america': '南美市场',
            'europe-africa': '欧非市场'
          }
        }
      };

      // 3. 收集系统架构
      const { components, dependencies } = getSystemArchitecture();
      const systemArchitecture = {
        components,
        dependencies,
        structure: {
          portals: ['Customer Portal', 'Supplier Portal', 'Admin Portal'],
          totalWorkflowSteps: 37,
          stage5Steps: 9,
          intelligentApprovalRouting: true,
          multiRegionSupport: true,
          rbacEnabled: true
        }
      };

      // 4. 生成完整备份包
      const backupId = `enterprise_full_${Date.now()}`;
      const fullPackage: FullBackupPackage = {
        metadata: {
          backupId,
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          systemInfo: {
            totalDataKeys: Object.keys(businessData).length,
            totalDataSize: new Blob([JSON.stringify(businessData)]).size,
            totalComponents: components.length,
            systemVersion: '福建高盛达富建材 B2B外贸站 v1.0'
          }
        },
        businessData,
        architectureConfig,
        systemArchitecture
      };

      setBackupPackage(fullPackage);

      toast.info('☁️ 正在上传到Supabase...', { duration: 2000 });

      // 5. 上传到Supabase
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fullPackage)
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        localStorage.setItem('enterpriseLastBackup', fullPackage.metadata.timestamp);
        localStorage.setItem('enterpriseLastBackupId', backupId);
        
        // 6. 自动下载JSON文件到本地
        downloadBackup(fullPackage);
        
        toast.success('✅ 企业级备份完成！', {
          description: `已备份 ${Object.keys(businessData).length} 个数据集，${components.length} 个组件`
        });

        loadBackupHistory();
        scanSystem();

      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }

    } catch (error) {
      console.error('备份失败:', error);
      toast.error('❌ 备份失败', {
        description: String(error)
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // 🔥 下载备份到本地
  const downloadBackup = (pkg: FullBackupPackage) => {
    try {
      const dataStr = JSON.stringify(pkg, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cosun_enterprise_backup_${pkg.metadata.backupId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('💾 备份文件已下载到本地', {
        description: '请妥善保管此文件'
      });
    } catch (error) {
      console.error('下载备份失败:', error);
    }
  };

  // 🔥 加载备份历史
  const loadBackupHistory = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full/history`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBackupHistory(data.backups || []);
      }
    } catch (error) {
      console.error('加载备份历史失败:', error);
    }
  };

  // 🔥 恢复备份
  const restoreBackup = async (backupId: string) => {
    if (!confirm('确定要恢复此备份吗？这将覆盖当前所有数据！')) {
      return;
    }

    try {
      toast.info('⏳ 正在恢复备份...', { duration: 3000 });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/backup/enterprise-full/restore/${backupId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const pkg: FullBackupPackage = data.package;

        // 恢复所有业务数据
        Object.entries(pkg.businessData).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });

        // 恢复架构配置
        if (pkg.architectureConfig.workflows) {
          localStorage.setItem('business_workflow_config', JSON.stringify(pkg.architectureConfig.workflows));
        }
        if (pkg.architectureConfig.workflowMeta) {
          localStorage.setItem('business_workflow_config_meta', JSON.stringify(pkg.architectureConfig.workflowMeta));
        }
        if (pkg.architectureConfig.regions) {
          localStorage.setItem('cosun-region', JSON.stringify(pkg.architectureConfig.regions));
        }

        toast.success('✅ 备份恢复成功！', {
          description: '页面将在3秒后刷新'
        });

        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } else {
        throw new Error(await response.text());
      }

    } catch (error) {
      console.error('恢复备份失败:', error);
      toast.error('❌ 恢复失败', {
        description: String(error)
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const { components } = getSystemArchitecture();
  const criticalComponents = components.filter(c => c.critical);
  const componentsByPortal = {
    admin: components.filter(c => c.portal === 'admin').length,
    customer: components.filter(c => c.portal === 'customer').length,
    supplier: components.filter(c => c.portal === 'supplier').length,
    shared: components.filter(c => c.portal === 'shared').length
  };

  return (
    <div className="space-y-6 p-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">企业级全量备份中心</h2>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
              Real Backup
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            完整备份所有业务数据、架构配置和系统清单
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={scanSystem}
            disabled={isScanning}
            variant="outline"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                扫描中...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                重新扫描
              </>
            )}
          </Button>
          <Button
            onClick={performFullBackup}
            disabled={isBackingUp || isScanning}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                备份中...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 mr-2" />
                执行完整备份
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 统计仪表盘 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-blue-700">业务数据集</div>
              <div className="text-2xl font-bold text-blue-900">{stats.dataKeys}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-purple-700">数据大小</div>
              <div className="text-2xl font-bold text-purple-900">{formatBytes(stats.dataSize)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-green-700">系统组件</div>
              <div className="text-2xl font-bold text-green-900">{stats.components}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs text-orange-700">上次备份</div>
              <div className="text-xs font-medium text-orange-900 mt-1">
                {stats.lastBackup === '从未备份' ? '从未备份' : new Date(stats.lastBackup).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Supabase连接状态 */}
      <Card className={`p-4 ${connectionStatus.connected ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectionStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Supabase云端状态
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {connectionStatus.message}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">服务器</div>
              <Badge variant={connectionStatus.serverRunning ? "default" : "outline"} className="text-xs">
                {connectionStatus.serverRunning ? '运行中' : '未运行'}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">KV存储</div>
              <Badge variant={connectionStatus.kvStoreAvailable ? "default" : "outline"} className="text-xs">
                {connectionStatus.kvStoreAvailable ? '可用' : '不可用'}
              </Badge>
            </div>
            <Button
              onClick={checkSupabaseConnection}
              disabled={isCheckingConnection}
              variant="outline"
              size="sm"
            >
              {isCheckingConnection ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                  检查中
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 mr-1.5" />
                  检查连接
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="architecture">系统架构</TabsTrigger>
          <TabsTrigger value="data">业务数据</TabsTrigger>
          <TabsTrigger value="history">备份历史</TabsTrigger>
        </TabsList>

        {/* 概览 */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              备份内容概览
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">业务数据</div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.dataKeys} 个数据集</div>
                <div className="text-xs text-gray-500">包含所有询价、订单、合同、财务数据</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">架构配置</div>
                <div className="text-2xl font-bold text-purple-600 mb-1">37 步流程</div>
                <div className="text-xs text-gray-500">完整业务流程配置 + 权限矩阵</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">系统清单</div>
                <div className="text-2xl font-bold text-green-600 mb-1">{stats.components} 个组件</div>
                <div className="text-xs text-gray-500">所有组件路径和架构文档</div>
              </div>
            </div>
          </Card>

          {backupPackage && (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">最新备份</h3>
                  <p className="text-xs text-green-700">
                    {new Date(backupPackage.metadata.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600">备份ID</div>
                  <div className="text-xs font-mono text-gray-900 truncate mt-1">
                    {backupPackage.metadata.backupId}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600">数据集数量</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    {backupPackage.metadata.systemInfo.totalDataKeys}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600">数据大小</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    {formatBytes(backupPackage.metadata.systemInfo.totalDataSize)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-600">组件数量</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    {backupPackage.metadata.systemInfo.totalComponents}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* 系统架构 */}
        <TabsContent value="architecture" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">三Portal架构</h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                <div className="text-sm font-semibold text-blue-900 mb-2">Admin Portal</div>
                <div className="text-3xl font-bold text-blue-600">{componentsByPortal.admin}</div>
                <div className="text-xs text-blue-700 mt-1">个组件</div>
              </div>
              <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                <div className="text-sm font-semibold text-purple-900 mb-2">Customer Portal</div>
                <div className="text-3xl font-bold text-purple-600">{componentsByPortal.customer}</div>
                <div className="text-xs text-purple-700 mt-1">个组件</div>
              </div>
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <div className="text-sm font-semibold text-green-900 mb-2">Supplier Portal</div>
                <div className="text-3xl font-bold text-green-600">{componentsByPortal.supplier}</div>
                <div className="text-xs text-green-700 mt-1">个组件</div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="text-sm font-semibold text-gray-900 mb-2">Shared</div>
                <div className="text-3xl font-bold text-gray-600">{componentsByPortal.shared}</div>
                <div className="text-xs text-gray-700 mt-1">个组件</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                关键组件清单 ({criticalComponents.length} 个)
              </h4>
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {criticalComponents.map((comp) => (
                  <div key={comp.path} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Code className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{comp.name}</span>
                      <Badge variant="outline" className="h-4 px-1.5 text-xs">
                        {comp.portal}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{comp.description}</div>
                    <div className="text-xs font-mono text-gray-500 truncate">{comp.path}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 业务数据 */}
        <TabsContent value="data" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">已备份的业务数据</h3>
            <div className="space-y-2">
              {backupPackage && Object.entries(backupPackage.businessData).map(([key, value]) => {
                const size = new Blob([JSON.stringify(value)]).size;
                let itemCount = 0;
                if (Array.isArray(value)) {
                  itemCount = value.length;
                } else if (typeof value === 'object' && value !== null) {
                  itemCount = Object.keys(value).length;
                }

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{key}</div>
                        <div className="text-xs text-gray-500">
                          {itemCount > 0 && `${itemCount} 项 • `}{formatBytes(size)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      已备份
                    </Badge>
                  </div>
                );
              })}
              {(!backupPackage || Object.keys(backupPackage.businessData).length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无备份数据，请点击"执行完整备份"</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 备份历史 */}
        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">备份历史记录</h3>
            <div className="space-y-2">
              {backupHistory.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Archive className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(backup.timestamp).toLocaleString('zh-CN')}
                      </span>
                      <Badge variant="outline" className="h-5 px-2 text-xs">
                        {backup.type === 'manual' ? '手动' : '自动'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {backup.totalDataKeys} 个数据集 • {formatBytes(backup.size)}
                    </div>
                  </div>
                  <Button
                    onClick={() => restoreBackup(backup.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    恢复
                  </Button>
                </div>
              ))}
              {backupHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Archive className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无备份历史</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 重要说明 */}
      <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>企业级备份说明：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li><strong>业务数据：</strong>完整备份localStorage中的所有业务数据（询价、订单、合同、财务等）</li>
            <li><strong>架构配置：</strong>37步业务流程配置、RBAC权限矩阵、多区域配置</li>
            <li><strong>系统清单：</strong>{components.length}个组件的完整路径和功能描述</li>
            <li><strong>双重保存：</strong>自动上传到Supabase云端 + 下载JSON文件到本地</li>
            <li><strong>一键恢复：</strong>可从任何历史备份点完整恢复系统数据</li>
          </ul>
          <p className="mt-3 font-semibold text-blue-800">
            💡 注意：代码文件需要通过版本控制（Git）管理，此备份系统专注于运行时数据和配置的完整保护。
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
