import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { MessageSquare, Send, Paperclip, Search, Sparkles, Clock, AlertCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

export default function SupplierMessages() {
  const [messageInput, setMessageInput] = useState('');
  const [selectedConversation, setSelectedConversation] = useState('conv-1');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // 智能消息模板分类
  const messageTemplates = {
    production_update: {
      name: '生产进度更新',
      templates: [
        '生产进展顺利，目前完成度{percentage}%，预计按时交货。',
        '已完成{percentage}%，生产线运转正常，质量稳定。',
        '当前进度{percentage}%，所有检验点均已通过。',
        '生产已进入{stage}阶段，整体进度{percentage}%。',
      ]
    },
    delay_notice: {
      name: '延期通知',
      templates: [
        '由于原材料供应延迟，预计交货期需要延后{days}天，请协调客户并确认。',
        '因设备维护需要，生产周期将延长{days}天，已加快后续工序。',
        '质检发现问题需要返工，交货期可能延后{days}天，具体时间稍后确认。',
      ]
    },
    quality_issue: {
      name: '质量问题反馈',
      templates: [
        '在质检中发现{issue}，已采取纠正措施，不影响整体交货。',
        '部分产品存在{issue}，已隔离处理，正在加紧返工。',
        '发现{issue}问题，已暂停该批次生产，等待进一步指示。',
      ]
    },
    material_inquiry: {
      name: '物料咨询',
      templates: [
        '客户指定的{material}规格与常规不同，是否需要重新确认？',
        '关于{material}的采购，当前市场价格波动较大，建议尽快确认。',
        '{material}库存不足，是否可以使用替代材料？',
      ]
    },
    shipping_ready: {
      name: '发货准备',
      templates: [
        '订单{order_id}已完成包装，请安排物流提货。',
        '货物已备齐，所有文件已准备，随时可以发货。',
        '质检报告和装箱单已上传，等待发货指令。',
      ]
    },
    quotation_response: {
      name: '报价回复',
      templates: [
        '已收到询价单，预计{hours}小时内提供详细报价。',
        '关于XJ-{rfq_id}，我们可以提供有竞争力的报价，详细报价已在报价模块提交。',
        '该产品我们有现成的生产线，可以给予{discount}%的价格优惠。',
      ]
    },
    confirmation: {
      name: '确认回复',
      templates: [
        '已确认订单要求，开始安排生产。',
        '收到，我们会按照要求执行。',
        '明白，将在{date}前完成。',
        '已记录，有任何变更会及时通知。',
      ]
    },
  };

  const conversations = [
    {
      id: 'conv-1',
      orderId: 'PO-2024-155',
      participant: 'COSUN管理员',
      department: '销售部',
      lastMessage: '客户询问生产进度，请提供最新更新。',
      lastMessageTime: '10分钟前',
      unread: 2,
      status: 'urgent',
      tags: ['生产进度', '紧急']
    },
    {
      id: 'conv-2',
      orderId: 'PO-2024-154',
      participant: 'COSUN管理员',
      department: '质检部',
      lastMessage: '质检报告已审核通过，可以安排发货。',
      lastMessageTime: '2小时前',
      unread: 0,
      status: 'normal',
      tags: ['质检']
    },
    {
      id: 'conv-3',
      orderId: 'XJ-2024-088',
      participant: 'COSUN管理员',
      department: '采购部',
      lastMessage: '有新的询价单，请查看并提供报价。',
      lastMessageTime: '1天前',
      unread: 1,
      status: 'normal',
      tags: ['询价', '待报价']
    },
  ];

  const messages = {
    'conv-1': [
      {
        id: 1,
        sender: 'COSUN管理员',
        senderType: 'admin',
        department: '销售部',
        message: '您好！客户Homek Building Supplies询问订单PO-2024-155的生产进度。能否提供最新状态？',
        timestamp: '2024-11-17 09:00',
        note: '客户要求：本周五前必须确认能否按时交货'
      },
      {
        id: 2,
        sender: '您',
        senderType: 'supplier',
        message: '已收到。当前生产进度65%，组装线运转正常。预计11月25日完成质检，可以按时交货。',
        timestamp: '2024-11-17 09:15',
        usedTemplate: true
      },
      {
        id: 3,
        sender: 'COSUN管理员',
        senderType: 'admin',
        department: '销售部',
        message: '收到，我会转告客户。如果有任何延迟风险，请立即通知我们。',
        timestamp: '2024-11-17 09:20',
      },
      {
        id: 4,
        sender: 'COSUN管理员',
        senderType: 'admin',
        department: '销售部',
        message: '客户询问生产进度，请提供最新更新。',
        timestamp: '2024-11-17 14:30',
        note: '客户比较着急，希望今天能回复'
      },
    ],
    'conv-2': [
      {
        id: 1,
        sender: '您',
        senderType: 'supplier',
        message: 'PO-2024-154的质检报告已上传，所有指标合格。请审核。',
        timestamp: '2024-11-16 10:00',
      },
      {
        id: 2,
        sender: 'COSUN管理员',
        senderType: 'admin',
        department: '质检部',
        message: '质检报告已审核通过，可以安排发货。请上传装箱单和商业发票。',
        timestamp: '2024-11-16 14:30',
      },
    ],
    'conv-3': [
      {
        id: 1,
        sender: 'COSUN管理员',
        senderType: 'admin',
        department: '采购部',
        message: '有新的询价单XJ-2024-088，产品：LED面板灯 1200x300mm，数量：8000件。请在24小时内提供报价。',
        timestamp: '2024-11-16 11:00',
        note: '客户项目紧急，希望尽快报价'
      },
      {
        id: 2,
        sender: '您',
        senderType: 'supplier',
        message: '已收到询价单，预计4小时内提供详细报价。我们对这个规格很有经验，可以给予有竞争力的价格。',
        timestamp: '2024-11-16 11:30',
        usedTemplate: true
      },
    ],
  };

  const currentMessages = messages[selectedConversation as keyof typeof messages] || [];
  const currentConv = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      toast.success('消息已发送至COSUN管理员');
      setMessageInput('');
    }
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      setMessageInput(selectedTemplate);
      setTemplateDialogOpen(false);
      toast.success('模板已应用，您可以修改后发送');
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部提示栏 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-0.5">通讯规则</p>
            <p className="text-xs text-blue-700">
              所有客户沟通需通过COSUN管理员中转。使用消息模板提高效率，紧急消息请在1小时内回复。
            </p>
          </div>
        </div>
      </div>

      {/* 消息主体区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[600px]">
        {/* 左侧对话列表 */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg flex flex-col">
          {/* 列表头部 */}
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>对话列表</h3>
              <Badge variant="outline" className="h-5 px-2 text-xs">
                {conversations.filter(c => c.unread > 0).length} 未读
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input 
                placeholder="搜索对话..." 
                className="pl-8 h-8" 
                style={{ fontSize: '12px' }}
              />
            </div>
          </div>

          {/* 对话列表 */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`px-3 py-2.5 cursor-pointer border-l-3 transition-colors ${
                  selectedConversation === conv.id
                    ? 'bg-blue-50 border-l-blue-600'
                    : 'border-l-transparent hover:bg-gray-50'
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 truncate">{conv.participant}</p>
                      {conv.unread > 0 && (
                        <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{conv.orderId} · {conv.department}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mb-1">
                  {conv.tags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant={tag === '紧急' ? 'destructive' : 'secondary'} 
                      className="h-4 px-1.5 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <p className="text-xs text-gray-600 truncate mb-1">{conv.lastMessage}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {conv.lastMessageTime}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧聊天区域 */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg flex flex-col">
          {/* 聊天头部 */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
                    {currentConv?.participant}
                  </p>
                  <Badge variant="outline" className="h-4 px-1.5 text-xs">
                    Admin中转
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  订单：{currentConv?.orderId} | 部门：{currentConv?.department}
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <FileText className="w-3 h-3" />
                查看订单
              </Button>
            </div>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {currentMessages.map(msg => (
              <div key={msg.id}>
                <div
                  className={`flex ${msg.senderType === 'supplier' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      msg.senderType === 'supplier'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium" style={{ 
                        opacity: msg.senderType === 'supplier' ? 0.9 : 1 
                      }}>
                        {msg.sender}
                        {msg.senderType === 'admin' && msg.department && (
                          <span className="ml-1 opacity-75">({msg.department})</span>
                        )}
                      </p>
                      {msg.usedTemplate && (
                        <Badge 
                          variant="secondary" 
                          className="h-4 px-1.5 text-xs bg-green-100 text-green-700 border-green-300"
                        >
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          模板
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm mb-1" style={{ lineHeight: '1.4' }}>{msg.message}</p>
                    <p className="text-xs" style={{ 
                      opacity: msg.senderType === 'supplier' ? 0.8 : 0.6,
                      color: msg.senderType === 'supplier' ? 'inherit' : '#6b7280'
                    }}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
                
                {msg.note && msg.senderType === 'admin' && (
                  <div className="flex justify-start mt-1">
                    <div className="max-w-[75%] text-xs text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded border border-orange-200">
                      <span className="font-medium">📌 备注：</span>{msg.note}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 消息输入区 */}
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs gap-1"
                onClick={() => setTemplateDialogOpen(true)}
              >
                <Sparkles className="w-3 h-3" />
                消息模板
              </Button>
              <p className="text-xs text-gray-500">
                Enter发送 · Shift+Enter换行
              </p>
            </div>
            
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="输入消息..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="resize-none text-sm"
                  style={{ fontSize: '13px' }}
                />
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Paperclip className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSendMessage}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 沟通规则说明 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '14px' }}>沟通规则</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="text-red-600 font-bold flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium text-gray-900">禁止直接联系客户</p>
              <p className="text-xs text-gray-600">所有客户沟通必须通过COSUN管理员中转</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-medium text-gray-900">使用智能模板</p>
              <p className="text-xs text-gray-600">常见问题使用预设模板快速回复</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold flex-shrink-0">⏱️</span>
            <div>
              <p className="text-sm font-medium text-gray-900">快速响应</p>
              <p className="text-xs text-gray-600">4小时内回复，紧急消息1小时内</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-600 font-bold flex-shrink-0">📎</span>
            <div>
              <p className="text-sm font-medium text-gray-900">附加文档</p>
              <p className="text-xs text-gray-600">及时上传相关文档、照片或报告</p>
            </div>
          </div>
        </div>
      </div>

      {/* 消息模板对话框 */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>智能消息模板</DialogTitle>
            <DialogDescription>选择常用模板快速回复</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 max-h-[500px] overflow-y-auto">
            {Object.entries(messageTemplates).map(([key, category]) => (
              <div key={key} className="space-y-2">
                <h4 className="font-medium text-sm text-blue-600 px-2">{category.name}</h4>
                <div className="space-y-1.5">
                  {category.templates.map((template, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 border rounded cursor-pointer transition-colors ${
                        selectedTemplate === template
                          ? 'border-blue-600 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                      style={{ fontSize: '13px' }}
                    >
                      {template}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUseTemplate} className="bg-blue-600 hover:bg-blue-700">
              使用此模板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
