import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Server, 
  Users, 
  Database, 
  Activity, 
  HardDrive, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Shield,
  Archive,
  LogIn,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
  Cpu,
  MemoryStick,
  Network,
  Eye,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Info,
  XCircle,
  Wifi,
  WifiOff,
  Timer,
  BarChart3
} from 'lucide-react';
import { type User } from '../../lib/rbac-config';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// 🔧 系统管理员专属工作台 Pro 版本
// 企业级系统监控 · 性能分析 · 健康度评分

interface AdminSystemDashboardProProps {
  user: User;
  onNavigate: (tab: string) => void;
}

export function AdminSystemDashboardPro({ user, onNavigate }: AdminSystemDashboardProProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemHealth, setSystemHealth] = useState(92); // 系统健康度评分

  // 实时更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 模拟系统数据
  const systemStats = {
    totalUsers: 12,
    activeUsers: 8,
    inactiveUsers: 4,
    onlineUsers: 5, // 当前在线
    lastBackup: '2024-11-24 03:00:00',
    backupStatus: 'success',
    databaseSize: '2.3 GB',
    systemUptime: '15天 6小时 32分钟',
    uptimePercentage: 99.97,
    cpuUsage: 23,
    memoryUsage: 45,
    diskUsage: 62,
    networkIn: '125 MB/s',
    networkOut: '82 MB/s',
    responseTime: 145, // ms
    errorRate: 0.02, // %
  };

  // 实时监控指标
  const [cpuHistory, setCpuHistory] = useState([18, 22, 25, 23, 20, 23, 25, 28, 23]);
  const [memoryHistory, setMemoryHistory] = useState([40, 42, 43, 45, 44, 45, 46, 45, 45]);

  // 最近登录记录
  const recentLogins = [
    { user: 'ceo', name: 'John Chen', time: '5分钟前', ip: '192.168.1.100', location: '福州', device: 'Chrome/Mac', status: 'success' },
    { user: 'marketing', name: '王小美', time: '15分钟前', ip: '192.168.1.101', location: '厦门', device: 'Edge/Windows', status: 'success' },
    { user: 'sales.director', name: '李总监', time: '1小时前', ip: '192.168.1.102', location: '福州', device: 'Safari/iOS', status: 'success' },
    { user: 'finance', name: '张会计', time: '2小时前', ip: '192.168.1.103', location: '福州', device: 'Chrome/Windows', status: 'success' },
    { user: 'unknown', name: '未知用户', time: '3小时前', ip: '203.0.113.45', location: '境外', device: 'Unknown', status: 'failed' },
  ];

  // 系统事件日志（按优先级分类）
  const systemEvents = {
    critical: [
      { type: 'error', message: '检测到未授权登录尝试', time: '3小时前', count: 1 },
    ],
    warning: [
      { type: 'warning', message: '磁盘使用率超过60%，建议清理', time: '昨天 10:15', count: 1 },
      { type: 'warning', message: '备份文件大小增长较快', time: '2天前', count: 1 },
    ],
    info: [
      { type: 'success', message: '自动备份完成', time: '今天 03:00', count: 1 },
      { type: 'info', message: '用户 marketing 创建成功', time: '昨天 14:23', count: 1 },
      { type: 'success', message: '系统更新完成', time: '2天前', count: 1 },
      { type: 'info', message: '角色权限配置更新', time: '3天前', count: 1 },
    ],
  };

  // 用户角色分布
  const usersByRole = [
    { role: 'CEO', count: 1, color: 'purple', online: 1 },
    { role: 'Sales Manager', count: 3, color: 'green', online: 2 },
    { role: 'Sales Rep', count: 3, color: 'orange', online: 1 },
    { role: 'CFO', count: 1, color: 'blue', online: 0 },
    { role: 'Finance', count: 1, color: 'cyan', online: 1 },
    { role: 'Procurement', count: 1, color: 'yellow', online: 0 },
    { role: 'Marketing Ops', count: 1, color: 'pink', online: 0 },
    { role: 'Admin', count: 1, color: 'red', online: 0 },
  ];

  // 性能指标卡片
  const performanceMetrics = [
    { label: 'API响应时间', value: systemStats.responseTime, unit: 'ms', status: 'good', threshold: 200, icon: Timer },
    { label: '错误率', value: systemStats.errorRate, unit: '%', status: 'excellent', threshold: 1, icon: AlertCircle },
    { label: '在线用户', value: systemStats.onlineUsers, unit: '人', status: 'normal', icon: Users },
    { label: '系统可用性', value: systemStats.uptimePercentage, unit: '%', status: 'excellent', threshold: 99, icon: Activity },
  ];

  // 计算系统健康度状态
  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: '优秀', color: 'green', icon: CheckCircle2 };
    if (score >= 75) return { label: '良好', color: 'blue', icon: Info };
    if (score >= 60) return { label: '警告', color: 'yellow', icon: AlertTriangle };
    return { label: '危险', color: 'red', icon: XCircle };
  };

  const healthStatus = getHealthStatus(systemHealth);
  const HealthIcon = healthStatus.icon;

  // 获取性能状态颜色
  const getPerformanceColor = (value: number, threshold: number, inverse: boolean = false) => {
    if (inverse) {
      return value < threshold * 0.5 ? 'text-green-600' : 
             value < threshold ? 'text-yellow-600' : 'text-red-600';
    }
    return value > threshold ? 'text-green-600' : 
           value > threshold * 0.8 ? 'text-yellow-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3">
            系统管理员工作台
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Pro版本
            </Badge>
          </h1>
          <p className="text-slate-600">企业级系统监控 · 实时性能分析 · 智能健康诊断</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-slate-600">{currentTime.toLocaleDateString('zh-CN', { weekday: 'long' })}</div>
            <div className="text-lg font-semibold text-slate-900 font-mono">
              {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
          </div>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 h-fit">
            <Shield className="size-3 mr-1" />
            系统管理员
          </Badge>
        </div>
      </div>

      {/* 系统健康度总览 */}
      <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="size-5 text-blue-600" />
              系统健康度评分
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSystemHealth(Math.floor(Math.random() * 30) + 70)}>
              <RefreshCw className="size-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* 健康度环形进度 */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(systemHealth / 100) * 351.858} 351.858`}
                  className={`text-${healthStatus.color}-600 transition-all duration-1000`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <HealthIcon className={`size-8 text-${healthStatus.color}-600 mb-1`} />
                <div className="text-3xl font-bold text-slate-900">{systemHealth}</div>
                <div className="text-xs text-slate-500">分</div>
              </div>
            </div>

            {/* 健康度详情 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`bg-${healthStatus.color}-100 text-${healthStatus.color}-700 border-${healthStatus.color}-300`}>
                  {healthStatus.label}
                </Badge>
                <span className="text-sm text-slate-600">系统运行状态正常</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {performanceMetrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Icon className="size-5 text-slate-600" />
                      <div className="flex-1">
                        <div className="text-xs text-slate-600">{metric.label}</div>
                        <div className="text-lg font-bold text-slate-900">
                          {metric.value}
                          <span className="text-sm font-normal text-slate-500 ml-1">{metric.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统概况卡片（4个核心指标） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 用户统计 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">用户统计</CardTitle>
              <Users className="size-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{systemStats.totalUsers}</div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                {systemStats.onlineUsers} 在线
              </span>
              <span className="text-blue-600">
                {systemStats.activeUsers} 活跃
              </span>
            </div>
            <Progress value={(systemStats.activeUsers / systemStats.totalUsers) * 100} className="mt-3 h-1" />
          </CardContent>
        </Card>

        {/* 系统运行时间 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">系统运行时间</CardTitle>
              <Clock className="size-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">15天</div>
            <p className="text-sm text-slate-500 mt-2">可用性 {systemStats.uptimePercentage}%</p>
            <div className="flex items-center gap-1 mt-3">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">运行稳定</span>
            </div>
          </CardContent>
        </Card>

        {/* 数据库大小 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">数据库大小</CardTitle>
              <Database className="size-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{systemStats.databaseSize}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="size-4 text-blue-600" />
              <p className="text-sm text-blue-600">+128MB 本周</p>
            </div>
            <Progress value={38} className="mt-3 h-1" />
          </CardContent>
        </Card>

        {/* 上次备份 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">数据备份</CardTitle>
              <Archive className="size-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <CheckCircle2 className="size-6" />
              正常
            </div>
            <p className="text-sm text-slate-500 mt-2">今天 03:00</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3 w-full text-xs h-7"
              onClick={() => onNavigate('data-backup-center')}
            >
              前往备份中心
              <ChevronRight className="size-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs：实时监控 | 用户活动 | 系统日志 */}
      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitoring">
            <Activity className="size-4 mr-2" />
            实时监控
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="size-4 mr-2" />
            用户活动
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Settings className="size-4 mr-2" />
            系统日志
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 实时监控 */}
        <TabsContent value="monitoring" className="space-y-4">
          {/* 系统资源使用率 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="size-5 text-blue-600" />
                系统资源监控
              </CardTitle>
              <CardDescription>实时CPU、内存、磁盘使用情况</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CPU使用率 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="size-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-900">CPU使用率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{systemStats.cpuUsage}%</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      正常
                    </Badge>
                  </div>
                </div>
                <Progress value={systemStats.cpuUsage} className="h-3" />
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-full h-8 flex items-end gap-0.5">
                    {cpuHistory.map((value, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-blue-500 rounded-t opacity-70"
                        style={{ height: `${(value / 100) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 内存使用率 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="size-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-900">内存使用率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{systemStats.memoryUsage}%</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      正常
                    </Badge>
                  </div>
                </div>
                <Progress value={systemStats.memoryUsage} className="h-3" />
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-full h-8 flex items-end gap-0.5">
                    {memoryHistory.map((value, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-green-500 rounded-t opacity-70"
                        style={{ height: `${(value / 100) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 磁盘使用率 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="size-4 text-orange-600" />
                    <span className="text-sm font-medium text-slate-900">磁盘使用率</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{systemStats.diskUsage}%</span>
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      警告
                    </Badge>
                  </div>
                </div>
                <Progress value={systemStats.diskUsage} className="h-3" />
                <p className="text-xs text-slate-500 mt-2">剩余空间：3.8 GB / 10 GB</p>
              </div>

              {/* 网络流量 */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Network className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">网络流入</div>
                    <div className="text-lg font-bold text-slate-900">{systemStats.networkIn}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Network className="size-5 text-cyan-600 rotate-180" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-600">网络流出</div>
                    <div className="text-lg font-bold text-slate-900">{systemStats.networkOut}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 用户活动 */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用户角色分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5" />
                  用户角色分布
                </CardTitle>
                <CardDescription>按角色统计的用户数量和在线状态</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usersByRole.map((item) => (
                    <div key={item.role} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                        <span className="text-sm font-medium text-slate-700">{item.role}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.online > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-600">{item.online}在线</span>
                          </div>
                        )}
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 最近登录记录 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="size-5" />
                  最近登录记录
                </CardTitle>
                <CardDescription>用户登录活动监控</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLogins.map((login, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        {login.status === 'success' ? (
                          <CheckCircle2 className="size-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="size-4 text-red-600" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{login.name}</span>
                            <Badge variant="outline" className="text-xs">{login.user}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{login.location}</span>
                            <span>·</span>
                            <span>{login.device}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 text-right">
                        <div>{login.time}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{login.ip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: 系统日志 */}
        <TabsContent value="logs" className="space-y-4">
          {/* 关键告警 */}
          {systemEvents.critical.length > 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong className="font-semibold">关键告警 ({systemEvents.critical.length})</strong>
                <div className="mt-2 space-y-1">
                  {systemEvents.critical.map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>• {event.message}</span>
                      <span className="text-xs">{event.time}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 警告信息 */}
          {systemEvents.warning.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong className="font-semibold">警告信息 ({systemEvents.warning.length})</strong>
                <div className="mt-2 space-y-1">
                  {systemEvents.warning.map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>• {event.message}</span>
                      <span className="text-xs">{event.time}</span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 系统事件日志 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                系统事件日志
              </CardTitle>
              <CardDescription>最近的系统操作记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemEvents.info.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                    {event.type === 'success' && (
                      <CheckCircle2 className="size-5 text-green-600 mt-0.5" />
                    )}
                    {event.type === 'info' && (
                      <Server className="size-5 text-blue-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-slate-900">{event.message}</div>
                      <div className="text-xs text-slate-500 mt-1">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 快捷操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
          <CardDescription>常用系统管理任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => onNavigate('role-permission')}
              className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Shield className="size-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-900">角色权限管理</div>
                <div className="text-xs text-slate-500">配置角色权限矩阵</div>
              </div>
              <ChevronRight className="size-4 text-slate-400 ml-auto group-hover:text-blue-600 transition-colors" />
            </button>

            <button 
              onClick={() => onNavigate('data-backup-center')}
              className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-green-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Archive className="size-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-900">数据备份中心</div>
                <div className="text-xs text-slate-500">备份与恢复数据</div>
              </div>
              <ChevronRight className="size-4 text-slate-400 ml-auto group-hover:text-green-600 transition-colors" />
            </button>

            <button 
              className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-purple-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <BarChart3 className="size-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-slate-900">系统报表</div>
                <div className="text-xs text-slate-500">生成系统分析报表</div>
              </div>
              <ChevronRight className="size-4 text-slate-400 ml-auto group-hover:text-purple-600 transition-colors" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
