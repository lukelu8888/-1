// 🚀 业务员客户开发执行手册 - Sales Rep Action Playbook
// 实战型、可执行、有验证的客户开发SOP系统

import { useState } from 'react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import { 
  Target, Search, Phone, Mail, MessageSquare, FileText, Package,
  CheckCircle, XCircle, Clock, Award, TrendingUp, Lightbulb,
  Users, Globe, Building2, DollarSign, Shield, Zap, Star,
  AlertCircle, ThumbsUp, Eye, Brain, Rocket, Map, ListChecks,
  Bot, Sparkles, Database, BarChart3, Calendar, Copy, ExternalLink,
  ChevronRight, Play, Pause, FastForward, Activity, Link
} from "lucide-react";
import { User } from "../../lib/rbac-config";

interface SalesRepActionPlaybookProps {
  user: User;
}

// 🎯 7个客户开发阶段的完整SOP
function getCustomerDevelopmentSOP() {
  return [
    {
      stage: 1,
      name: '客户发现与筛选',
      nameEn: 'Lead Discovery & Qualification',
      icon: Search,
      color: 'blue',
      duration: '1-2天',
      successRate: 85,
      description: '从多个渠道发现潜在客户，进行初步筛选',
      
      // 具体方法
      methods: [
        {
          name: '社交媒体挖掘',
          platform: 'LinkedIn/Facebook/Instagram',
          steps: [
            '1. 使用关键词搜索：例如"hardware retailer USA"、"plumbing distributor Canada"',
            '2. 筛选目标公司：员工50+人、成立5年以上、有采购决策权职位',
            '3. 查看公司主页：产品线、客户评价、采购需求',
            '4. 识别关键决策人：Owner/Purchasing Manager/Buyer',
          ],
          tools: ['LinkedIn Sales Navigator', 'Facebook Business Search', 'Instagram Business'],
          expectedResult: '每天发现20-30个潜在客户',
        },
        {
          name: '海关数据分析',
          platform: 'ImportGenius/Panjiva',
          steps: [
            '1. 搜索产品HS编码：例如电气配件HS: 8536、卫浴HS: 8481',
            '2. 筛选活跃进口商：过去6个月有3次以上进口记录',
            '3. 分析采购频率与金额：判断采购能力',
            '4. 识别现有供应商：分析竞争对手',
          ],
          tools: ['ImportGenius', 'Panjiva', 'Datamyne'],
          expectedResult: '每周发现50+高质量进口商',
        },
        {
          name: '展会客户跟进',
          platform: '线下展会/虚拟展会',
          steps: [
            '1. 整理展会收集的名片与资料',
            '2. 分类客户：A级（明确需求）、B级（有兴趣）、C级（一般了解）',
            '3. 48小时内发送感谢邮件',
            '4. 添加LinkedIn连接并发送个性化消息',
          ],
          tools: ['展会名片扫描App', 'CRM系统'],
          expectedResult: '展会后3天内完成所有客户录入',
        },
      ],
      
      // 执行步骤
      executionSteps: [
        { step: 1, action: '确定目标市场与客户画像', time: '30分钟', responsible: '业务员' },
        { step: 2, action: '使用多渠道工具搜索潜在客户', time: '2小时', responsible: '业务员' },
        { step: 3, action: '初步筛选并录入CRM系统', time: '1小时', responsible: '业务员' },
        { step: 4, action: '标记客户来源与优先级', time: '30分钟', responsible: '业务员' },
      ],
      
      // 验证清单
      verificationChecklist: [
        { item: '是否录入至少20个新客户？', required: true },
        { item: '每个客户是否标注了来源渠道？', required: true },
        { item: '是否标记了客户类型（零售商/进口商等）？', required: true },
        { item: '是否填写了客户所在区域？', required: true },
        { item: '是否找到了关键决策人信息？', required: false },
      ],
      
      // 话术模板
      scriptTemplates: [
        {
          scenario: 'LinkedIn首次联系消息',
          template: `Hi [Name],

I noticed your role as [Position] at [Company]. Your company's focus on [specific area] caught my attention.

We're COSUN, a trusted supplier of [product category] for businesses like yours in [region]. We help companies like [similar customer] achieve [benefit].

Would you be open to a brief conversation about how we might support your sourcing needs?

Best regards,
[Your Name]`,
        },
      ],
      
      // 常见问题与解决方案
      commonIssues: [
        { issue: '找不到决策人联系方式', solution: '使用Hunter.io查找邮箱，使用Lusha查找电话' },
        { issue: '不确定客户是否有采购需求', solution: '查看公司LinkedIn动态、网站更新、招聘信息' },
      ],
    },
    
    {
      stage: 2,
      name: 'AI驱动的客户背调',
      nameEn: 'AI-Powered Due Diligence',
      icon: Brain,
      color: 'purple',
      duration: '2-3小时',
      successRate: 90,
      description: '使用AI工具进行深度客户背景调查',
      
      methods: [
        {
          name: 'AI企业资质分析',
          platform: 'ChatGPT/Claude + Web Search',
          steps: [
            '1. 输入公司名称，要求AI搜索：公司注册信息、经营状态、法人代表',
            '2. 要求AI分析：公司规模、成立时间、主营业务、行业地位',
            '3. 要求AI查找：公司官网、社交媒体、客户评价',
            '4. 生成企业资质评分：0-100分',
          ],
          tools: ['ChatGPT with Bing', 'Claude with web search', 'Perplexity AI'],
          expectedResult: '生成完整的企业资质报告',
        },
        {
          name: 'AI商业信誉调查',
          platform: 'AI + Dun & Bradstreet',
          steps: [
            '1. 使用AI工具搜索：公司信用评级、付款记录、诉讼记录',
            '2. 查询D&B评分或类似信用评级',
            '3. AI分析：财务健康度、付款风险、合作风险',
            '4. 生成风险评估报告',
          ],
          tools: ['Dun & Bradstreet', 'Experian', 'AI信用分析工具'],
          expectedResult: '风险评级：低/中/高',
        },
        {
          name: 'AI市场情报收集',
          platform: 'AI News Aggregator',
          steps: [
            '1. 要求AI搜索公司最近6个月的新闻报道',
            '2. 分析公司动态：扩张、并购、新产品、大订单',
            '3. 识别采购信号：新店开业、新项目、招聘采购经理',
            '4. 生成市场情报摘要',
          ],
          tools: ['Google News + AI', 'NewsAPI', 'Perplexity AI'],
          expectedResult: '发现潜在采购机会',
        },
      ],
      
      executionSteps: [
        { step: 1, action: '准备客户基本信息（公司名、网站、LinkedIn）', time: '10分钟', responsible: '业务员' },
        { step: 2, action: '使用AI工具进行企业资质分析', time: '30分钟', responsible: 'AI助手' },
        { step: 3, action: '使用AI工具进行商业信誉调查', time: '30分钟', responsible: 'AI助手' },
        { step: 4, action: '使用AI工具收集市场情报', time: '30分钟', responsible: 'AI助手' },
        { step: 5, action: '人工审核AI报告并补充判断', time: '30分钟', responsible: '业务员' },
        { step: 6, action: '生成背调总结并录入CRM', time: '30分钟', responsible: '业务员' },
      ],
      
      verificationChecklist: [
        { item: '是否完成企业资质分析（5维度）？', required: true },
        { item: '是否获得信用评级或风险评估？', required: true },
        { item: '是否收集到最近6个月的公司动态？', required: true },
        { item: '是否识别到关键决策人及联系方式？', required: true },
        { item: '是否发现采购信号或商机？', required: false },
      ],
      
      scriptTemplates: [
        {
          scenario: 'AI背调提示词模板',
          template: `你是一位专业的B2B客户尽职调查专家。请帮我分析以下公司：

公司名称: [Company Name]
网站: [Website]
行业: [Industry]
国家: [Country]

请从以下5个维度进行深度分析：
1. 企业资质（注册信息、经营状态、规模、成立时间）
2. 商业信誉（信用评级、付款记录、诉讼记录）
3. 业务能力（主营产品、市场地位、客户群体、供应链）
4. 决策人信息（关键决策人姓名、职位、联系方式、背景）
5. 采购信号（近期动态、扩张计划、采购需求、商机）

最后给出：
- 综合评分（0-100分）
- 风险评级（低/中/高）
- 是否推荐接触（是/否）
- 接触策略建议`,
        },
      ],
      
      commonIssues: [
        { issue: 'AI工具无法访问某些付费数据库', solution: '人工查询D&B或Experian，再让AI分析数据' },
        { issue: 'AI生成的信息不准确', solution: '交叉验证多个来源，人工确认关键信息' },
      ],
    },
    
    {
      stage: 3,
      name: '首次接触与破冰',
      nameEn: 'Initial Contact & Ice Breaking',
      icon: Phone,
      color: 'green',
      duration: '3-5天',
      successRate: 75,
      description: '通过邮件、电话、LinkedIn建立首次联系',
      
      methods: [
        {
          name: '3轮邮件策略',
          platform: 'Email',
          steps: [
            '1. 第1封邮件（自我介绍）：介绍公司、产品优势、提出价值主张',
            '2. 第2封邮件（48小时后）：分享成功案例、客户证言、行业洞察',
            '3. 第3封邮件（5天后）：提供免费资源（产品目录、价格表）、明确CTA',
            '4. 追踪打开率与点击率，针对性跟进',
          ],
          tools: ['Mailchimp', 'HubSpot', '邮件追踪插件'],
          expectedResult: '邮件打开率>40%，回复率>15%',
        },
        {
          name: 'LinkedIn多触点策略',
          platform: 'LinkedIn',
          steps: [
            '1. 发送连接请求+个性化消息',
            '2. 连接后24小时内发感谢消息',
            '3. 点赞并评论客户的LinkedIn动态（建立好感）',
            '4. 分享有价值的行业内容（建立专家形象）',
            '5. 适时发送InMail询问采购需求',
          ],
          tools: ['LinkedIn Sales Navigator', 'Dripify自动化工具'],
          expectedResult: '连接接受率>60%，回复率>25%',
        },
        {
          name: '电话破冰技巧',
          platform: 'Phone Call',
          steps: [
            '1. 提前研究客户背景，准备3个谈话要点',
            '2. 开场白：自我介绍+提及共同点（展会、LinkedIn、行业）',
            '3. 快速建立价值：我们帮助[类似客户]解决了[问题]',
            '4. 提问而非推销：了解当前供应商、采购痛点',
            '5. 明确下一步：发送产品资料、安排视频会议',
          ],
          tools: ['通话录音App', 'CRM通话记录'],
          expectedResult: '接通率>40%，获得下一步承诺>60%',
        },
      ],
      
      executionSteps: [
        { step: 1, action: '准备个性化邮件模板（3版本）', time: '1小时', responsible: '业务员' },
        { step: 2, action: '发送第1轮邮件给20个客户', time: '30分钟', responsible: '业务员' },
        { step: 3, action: '发送LinkedIn连接请求', time: '20分钟', responsible: '业务员' },
        { step: 4, action: '跟进邮件打开情况，发送第2轮', time: '1小时', responsible: '业务员' },
        { step: 5, action: '致电未回复邮件的高价值客户', time: '2小时', responsible: '业务员' },
        { step: 6, action: '记录所有互动到CRM', time: '30分钟', responsible: '业务员' },
      ],
      
      verificationChecklist: [
        { item: '是否发送了至少3轮邮件？', required: true },
        { item: '邮件打开率是否>30%？', required: true },
        { item: '是否添加了LinkedIn连接？', required: true },
        { item: '是否至少通话5次？', required: false },
        { item: '是否获得至少3个客户回复？', required: true },
      ],
      
      scriptTemplates: [
        {
          scenario: '首次电话开场白',
          template: `Hi [Name], this is [Your Name] from COSUN.

I hope I'm not catching you at a bad time. I'll be brief.

We specialize in [product category] for [customer type] like yourself in [region]. We recently helped [similar customer] reduce their costs by 15% while improving quality.

I wanted to reach out to see if you'd be open to a quick conversation about your current sourcing situation?

[If yes] Great! Do you have 5 minutes now, or would another time work better?
[If no] No problem. Would you prefer I send you some information via email first?`,
        },
        {
          scenario: '第1封邮件模板',
          template: `Subject: [Company Name] - Quality [Product] Supplier from China

Hi [Name],

I hope this email finds you well.

My name is [Your Name], and I represent COSUN, a leading manufacturer of [product category] based in Fujian, China. We've been serving [customer type] across [regions] for over 16 years.

Why am I reaching out?
• We noticed your company [specific observation]
• We specialize in exactly what you need: [product]
• We've helped companies like [similar customer] achieve [specific benefit]

Quick facts about COSUN:
✓ 16+ years of experience
✓ ISO9001/CE/UL certified
✓ Serve 200+ clients in 40+ countries
✓ 8-12% lower than market average with better quality

Would you be open to a brief call next week to explore how we can support your business?

Best regards,
[Your Name]
[Title]
[Contact Info]`,
        },
      ],
      
      commonIssues: [
        { issue: '邮件石沉大海无回复', solution: '换不同主题行、发送时间，或改用LinkedIn/电话' },
        { issue: '电话总是打不通', solution: '尝试不同时间段，或先发邮件预约通话时间' },
      ],
    },
    
    {
      stage: 4,
      name: '需求挖掘与BANT认证',
      nameEn: 'Need Discovery & BANT Qualification',
      icon: ListChecks,
      color: 'yellow',
      duration: '5-7天',
      successRate: 70,
      description: '深入了解客户需求，进行BANT资格认证',
      
      methods: [
        {
          name: 'SPIN提问法',
          platform: '电话/视频会议',
          steps: [
            '1. Situation（情况问题）：您目前从哪里采购？采购频率？',
            '2. Problem（问题问题）：您对现有供应商有什么不满意的地方？',
            '3. Implication（影响问题）：这些问题对您的业务有什么影响？',
            '4. Need-Payoff（需求-收益问题）：如果我们能解决这些问题，对您有什么帮助？',
          ],
          tools: ['会议录音', 'CRM记录'],
          expectedResult: '挖掘出3-5个核心痛点',
        },
        {
          name: 'BANT四维度认证',
          platform: 'CRM系统',
          steps: [
            '1. Budget（预算）：年采购预算？单次订单金额范围？',
            '2. Authority（决策权）：谁是最终决策人？采购流程如何？',
            '3. Need（需求）：明确的产品需求？数量？规格？认证要求？',
            '4. Timeline（时间表）：何时需要？采购周期？紧急程度？',
          ],
          tools: ['BANT评分表', 'CRM客户评级'],
          expectedResult: 'BANT总分>60分即为合格客户',
        },
      ],
      
      executionSteps: [
        { step: 1, action: '准备SPIN提问清单', time: '30分钟', responsible: '业务员' },
        { step: 2, action: '安排视频会议或电话深谈', time: '1小时', responsible: '业务员' },
        { step: 3, action: '使用SPIN法挖掘需求', time: '30-45分钟', responsible: '业务员' },
        { step: 4, action: '完成BANT四维度评估', time: '15分钟', responsible: '业务员' },
        { step: 5, action: '计算BANT总分并分级', time: '10分钟', responsible: '业务员' },
        { step: 6, action: '制定针对性解决方案', time: '1小时', responsible: '业务员' },
      ],
      
      verificationChecklist: [
        { item: '是否完成BANT四维度评估？', required: true },
        { item: 'BANT总分是否>60分？', required: true },
        { item: '是否明确了客户的3个核心痛点？', required: true },
        { item: '是否确认了决策人和采购流程？', required: true },
        { item: '是否获得了明确的时间表？', required: false },
      ],
      
      scriptTemplates: [
        {
          scenario: 'SPIN提问话术',
          template: `Situation:
"Can you tell me about your current sourcing setup for [product]?"
"How many suppliers do you work with currently?"
"What's your typical order frequency and volume?"

Problem:
"What challenges are you facing with your current supplier?"
"Are there any quality or delivery issues?"
"What would you change if you could?"

Implication:
"How do these delays/quality issues affect your business?"
"What's the cost impact of these problems?"
"How does this affect your end customers?"

Need-Payoff:
"If we could guarantee on-time delivery, how would that help you?"
"Would a 10% cost reduction while maintaining quality be valuable?"
"How important is having a reliable long-term partner?"`,
        },
      ],
      
      commonIssues: [
        { issue: '客户不愿意透露预算', solution: '给出价格区间选项，让客户选择舒适范围' },
        { issue: '无法接触到决策人', solution: '建立多层关系，通过影响者接近决策人' },
      ],
    },
    
    {
      stage: 5,
      name: '报价与价值呈现',
      nameEn: 'Quotation & Value Presentation',
      icon: FileText,
      color: 'orange',
      duration: '2-3天',
      successRate: 80,
      description: '专业报价，突出价值而非价格',
      
      methods: [
        {
          name: '三层报价策略',
          platform: 'Email + PDF',
          steps: [
            '1. 基础方案：满足基本需求，价格有竞争力',
            '2. 推荐方案：性价比最优，附加增值服务（⭐推荐）',
            '3. 高级方案：全面解决方案，包含定制化服务',
            '4. 对比表格：清晰展示三个方案的差异',
          ],
          tools: ['专业报价模板', 'PDF设计工具'],
          expectedResult: '60%客户选择推荐方案',
        },
        {
          name: '价值呈现公式',
          platform: 'Presentation',
          steps: [
            '1. 重述客户痛点："您提到[问题]对业务的影响..."',
            '2. 展示解决方案："我们的[产品/服务]可以..."',
            '3. 量化价值："帮您节省$X、提升X%效率、减少X%风险"',
            '4. 证据支持："[类似客户]已经实现了[具体成果]"',
            '5. 明确下一步："样品确认/工厂参观/小批量试单"',
          ],
          tools: ['PPT演示', '案例视频'],
          expectedResult: '客户认可价值>价格',
        },
      ],
      
      executionSteps: [
        { step: 1, action: '根据客户需求定制报价方案', time: '2小时', responsible: '业务员' },
        { step: 2, action: '计算成本与利润，确定价格区间', time: '30分钟', responsible: '业务员+经理' },
        { step: 3, action: '设计专业报价文档（三层方案）', time: '1小时', responsible: '业务员' },
        { step: 4, action: '准备价值呈现材料（案例、证书）', time: '1小时', responsible: '业务员' },
        { step: 5, action: '发送报价并电话跟进', time: '30分钟', responsible: '业务员' },
        { step: 6, action: '回答客户疑问，谈判价格', time: '1-2小时', responsible: '业务员' },
      ],
      
      verificationChecklist: [
        { item: '是否提供了三层报价方案？', required: true },
        { item: '报价是否包含详细规格与交期？', required: true },
        { item: '是否量化了价值（节省成本/提升效率）？', required: true },
        { item: '是否附上了成功案例或客户证言？', required: true },
        { item: '是否明确了下一步行动？', required: true },
      ],
      
      scriptTemplates: [
        {
          scenario: '报价邮件模板',
          template: `Subject: Proposal for [Company Name] - [Product Category]

Dear [Name],

Thank you for your time on our call yesterday. I truly appreciate you sharing the challenges you're facing with [specific problem].

Based on our discussion, I've prepared three tailored solutions for your consideration:

📋 OPTION 1: BASIC
• [Product spec]
• [MOQ & Price]
• Delivery: [timeline]
• Total: $X,XXX

⭐ OPTION 2: RECOMMENDED (Best Value)
• [Enhanced spec]
• [MOQ & Price - 8% savings]
• Delivery: [timeline]
• Includes: Free samples + Quality guarantee
• Total: $X,XXX

🏆 OPTION 3: PREMIUM
• [Premium spec + customization]
• [MOQ & Price]
• Delivery: [timeline]
• Includes: Dedicated account manager + Extended warranty
• Total: $X,XXX

Why COSUN?
✓ 15% cost savings vs your current supplier (based on your shared data)
✓ 99.5% quality pass rate
✓ Case Study: [Similar Customer] saved $XX,XXX annually

Next Steps:
I'd love to send you samples of Option 2 for your evaluation. Shall I proceed?

Looking forward to your thoughts!

Best regards,
[Your Name]`,
        },
      ],
      
      commonIssues: [
        { issue: '客户说价格太高', solution: '重新强调价值，提供ROI计算，或调整方案' },
        { issue: '客户要求更多折扣', solution: '设定底线，换取更大订单量或长期合作' },
      ],
    },
    
    {
      stage: 6,
      name: '样品确认与信任建立',
      nameEn: 'Sample Confirmation & Trust Building',
      icon: Package,
      color: 'pink',
      duration: '7-14天',
      successRate: 75,
      description: '快速寄样、跟进反馈、建立信任',
      
      methods: [
        {
          name: '样品快速通道',
          platform: 'DHL/FedEx',
          steps: [
            '1. 48小时内准备样品（质量检验+包装）',
            '2. 使用DHL/FedEx快递（3-5天到达）',
            '3. 提供追踪号并每日更新物流状态',
            '4. 样品到达后24小时内电话跟进',
          ],
          tools: ['DHL', 'FedEx', '物流追踪系统'],
          expectedResult: '样品7天内到达客户手中',
        },
        {
          name: '样品反馈收集',
          platform: '电话/视频会议',
          steps: [
            '1. 询问样品质量、外观、包装的评价',
            '2. 询问是否符合客户规格要求',
            '3. 询问价格接受度',
            '4. 询问是否需要调整或定制',
            '5. 询问下一步计划（测试/试单/大单）',
          ],
          tools: ['反馈表格', 'CRM记录'],
          expectedResult: '获得明确的改进方向或试单意向',
        },
      ],
      
      executionSteps: [
        { step: 1, action: '确认样品规格与数量', time: '30分钟', responsible: '业务员' },
        { step: 2, action: '协调生产部准备样品', time: '1-2天', responsible: '生产部' },
        { step: 3, action: '质检并专业包装', time: '半天', responsible: '质检部' },
        { step: 4, action: '安排快递并提供追踪号', time: '1小时', responsible: '业务员' },
        { step: 5, action: '每日更新物流状态给客户', time: '10分钟/天', responsible: '业务员' },
        { step: 6, action: '样品到达后24小时内跟进反馈', time: '1小时', responsible: '业务员' },
      ],
      
      verificationChecklist: [
        { item: '样品是否在48小时内发出？', required: true },
        { item: '是否提供了快递追踪号？', required: true },
        { item: '是否每日更新物流状态？', required: true },
        { item: '样品到达后是否24小时内跟进？', required: true },
        { item: '是否收集了完整的样品反馈？', required: true },
      ],
      
      scriptTemplates: [
        {
          scenario: '样品发出通知邮件',
          template: `Subject: Your Samples Are On The Way! 🚀

Hi [Name],

Great news! Your samples have been shipped today via [DHL/FedEx].

Tracking Details:
• Tracking Number: [XXXXXXX]
• Expected Delivery: [Date]
• Track here: [Tracking Link]

What's Included:
✓ [Product 1] - [Quantity]
✓ [Product 2] - [Quantity]
✓ Product specifications sheet
✓ Testing certificates

I'll keep you updated on the delivery status daily.

Once you receive the samples, I'd love to hear your feedback. Shall we schedule a quick call for [Date + 2 days after delivery]?

Excited to hear your thoughts!

Best regards,
[Your Name]`,
        },
      ],
      
      commonIssues: [
        { issue: '客户收到样品后没反馈', solution: '主动致电，提供测试指导，询问是否需要技术支持' },
        { issue: '样品质量不达标', solution: '立即致歉，分析原因，承诺改进，免费重新寄样' },
      ],
    },
    
    {
      stage: 7,
      name: '成交与长期维护',
      nameEn: 'Deal Closing & Relationship Management',
      icon: Award,
      color: 'green',
      duration: '持续',
      successRate: 80,
      description: '临门一脚促成交，长期维护成忠诚客户',
      
      methods: [
        {
          name: '临门一脚策略',
          platform: '电话/视频会议',
          steps: [
            '1. 制造紧迫感："原材料涨价，本月下单锁定价格"',
            '2. 降低风险："小批量试单，满意再大量采购"',
            '3. 增加价值："首单赠送$XXX配件/免费质检报告"',
            '4. 简化流程："我已准备好合同，您只需签字即可"',
          ],
          tools: ['在线合同签署', 'DocuSign'],
          expectedResult: '80%合格客户在此阶段成交',
        },
        {
          name: '客户成功管理',
          platform: 'CRM + 定期沟通',
          steps: [
            '1. 订单全程透明：生产进度/质检报告/发货通知',
            '2. 主动关怀：节日问候/行业资讯/新品推荐',
            '3. 定期回访：季度客户满意度调查',
            '4. 增值服务：免费市场分析/产品培训',
            '5. 转介绍激励：推荐新客户给予折扣',
          ],
          tools: ['CRM系统', '客户成功平台'],
          expectedResult: '客户留存率85%+，转介绍率30%+',
        },
      ],
      
      executionSteps: [
        { step: 1, action: '发送正式合同与PI', time: '1小时', responsible: '业务员' },
        { step: 2, action: '电话跟进签约进度', time: '30分钟', responsible: '业务员' },
        { step: 3, action: '解决客户最后的顾虑', time: '1-2小时', responsible: '业务员+经理' },
        { step: 4, action: '客户签约后确认订单', time: '30分钟', responsible: '业务员' },
        { step: 5, action: '安排生产并定期更新进度', time: '持续', responsible: '业务员+生产' },
        { step: 6, action: '货物发出后跟进物流', time: '持续', responsible: '业务员' },
        { step: 7, action: '客户收货后回访满意度', time: '1小时', responsible: '业务员' },
        { step: 8, action: '制定长期维护计划', time: '30分钟', responsible: '业务员' },
      ],
      
      verificationChecklist: [
        { item: '是否发送了正式合同？', required: true },
        { item: '是否解决了客户所有顾虑？', required: true },
        { item: '是否明确了付款与交期？', required: true },
        { item: '是否建立了订单进度更新机制？', required: true },
        { item: '是否制定了客户维护计划？', required: true },
      ],
      
      scriptTemplates: [
        {
          scenario: '成交促成电话话术',
          template: `Hi [Name],

I wanted to follow up on the samples and quotation we discussed.

From our conversations, it seems like we're a great fit to help you [solve specific problem]. 

I have good news and urgent news:

Good news: I've prepared a contract with the pricing we discussed, ready for your signature.

Urgent news: Due to recent material cost increases, I can only hold this price until [Date - 5 days from now]. After that, we'll need to adjust pricing by approximately 8%.

To make this easy for you, I'm proposing:
✓ Start with a trial order of [MOQ] to test quality
✓ 30-day payment terms for this first order
✓ Free QC report and extra samples

What do you think? Shall I send over the contract today?

[Your Name]`,
        },
      ],
      
      commonIssues: [
        { issue: '客户一直犹豫不决', solution: '找出真正的障碍（价格/质量/信任），针对性解决' },
        { issue: '客户下单后长期不复购', solution: '主动询问产品表现，提供增值服务，推荐新品' },
      ],
    },
  ];
}

// 📊 AI背调工具集成
function getAIToolsIntegration() {
  return {
    tools: [
      {
        name: 'ChatGPT/Claude (Web Search)',
        category: 'AI搜索引擎',
        useCases: ['企业基本信息', '新闻动态', '市场情报'],
        howToUse: '输入公司名+具体问题，要求AI搜索并分析',
        prompt: '你是B2B客户调查专家，请搜索[公司名]的[信息类型]，并给出专业分析',
        pricing: 'ChatGPT Plus: $20/月, Claude Pro: $20/月',
      },
      {
        name: 'Perplexity AI',
        category: 'AI研究助手',
        useCases: ['深度研究', '引用来源', '实时信息'],
        howToUse: '直接提问，AI会搜索并引用可靠来源',
        prompt: '分析[公司名]在[行业]的市场地位，提供数据来源',
        pricing: 'Pro: $20/月',
      },
      {
        name: 'LinkedIn Sales Navigator',
        category: '决策人查找',
        useCases: ['找关键决策人', '公司架构', '职位变动'],
        howToUse: '搜索公司名，筛选职位（Owner/Buyer/Manager）',
        prompt: null,
        pricing: '$99/月',
      },
      {
        name: 'Hunter.io',
        category: '邮箱查找',
        useCases: ['查找企业邮箱', '验证邮箱有效性'],
        howToUse: '输入公司域名+姓名，查找邮箱格式',
        prompt: null,
        pricing: '免费50次/月，付费$49/月',
      },
      {
        name: 'ImportGenius/Panjiva',
        category: '海关数据',
        useCases: ['进口记录', '采购频率', '竞争对手分析'],
        howToUse: '搜索公司名或HS编码，查看进口数据',
        prompt: null,
        pricing: '$XXX/月（企业级）',
      },
    ],
    workflow: [
      '1. 使用LinkedIn找到公司与决策人',
      '2. 使用ChatGPT/Claude进行企业背景搜索',
      '3. 使用Perplexity AI深度研究公司动态',
      '4. 使用Hunter.io查找决策人邮箱',
      '5. 使用ImportGenius查询进口记录（如适用）',
      '6. 将所有信息整合到CRM系统',
    ],
  };
}

export function SalesRepActionPlaybook({ user }: SalesRepActionPlaybookProps) {
  const sop = getCustomerDevelopmentSOP();
  const aiTools = getAIToolsIntegration();
  const [activeStage, setActiveStage] = useState(1);
  const [checkedItems, setCheckedItems] = useState<Record<number, Record<number, boolean>>>({});

  const currentStage = sop.find(s => s.stage === activeStage);

  const handleCheckItem = (stageNum: number, itemIndex: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [stageNum]: {
        ...prev[stageNum],
        [itemIndex]: !prev[stageNum]?.[itemIndex]
      }
    }));
  };

  const getStageCompletion = (stageNum: number) => {
    const stage = sop.find(s => s.stage === stageNum);
    if (!stage) return 0;
    const total = stage.verificationChecklist.length;
    const checked = Object.keys(checkedItems[stageNum] || {}).filter(
      key => checkedItems[stageNum][Number(key)]
    ).length;
    return (checked / total) * 100;
  };

  return (
    <div className="space-y-3 p-3 bg-slate-50">
      {/* 🎯 工作台标题 */}
      <div className="rounded-lg p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1">业务员客户开发执行手册</h1>
            <p className="text-sm text-green-100">Sales Rep Action Playbook - 实战型可执行SOP系统</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right bg-white/20 rounded px-4 py-2">
              <p className="text-xs text-green-100">当前阶段</p>
              <p className="text-2xl font-bold">{activeStage}/7</p>
            </div>
            <div className="text-right bg-white/20 rounded px-4 py-2">
              <p className="text-xs text-green-100">完成度</p>
              <p className="text-2xl font-bold">{getStageCompletion(activeStage).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 7阶段进度导航 */}
      <Card className="p-3 border-slate-300 bg-white">
        <div className="flex items-center justify-between gap-2">
          {sop.map((stage, idx) => {
            const Icon = stage.icon;
            const completion = getStageCompletion(stage.stage);
            const isActive = activeStage === stage.stage;
            const isCompleted = completion === 100;
            
            return (
              <div key={stage.stage} className="flex items-center flex-1">
                <button
                  onClick={() => setActiveStage(stage.stage)}
                  className={`flex-1 relative group ${
                    isActive ? 'scale-105' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'bg-green-50 border-green-500 shadow-md' 
                      : isCompleted
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded ${
                        isActive ? `bg-${stage.color}-500 text-white` : `bg-${stage.color}-100 text-${stage.color}-600`
                      }`}>
                        <Icon className="size-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">阶段{stage.stage}</span>
                      {isCompleted && <CheckCircle className="size-3 text-green-600" />}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 mb-0.5">{stage.name}</p>
                    <p className="text-xs text-slate-500 mb-1">{stage.nameEn}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="size-3" />
                      <span>{stage.duration}</span>
                      <span className="ml-auto text-green-600 font-semibold">{stage.successRate}%</span>
                    </div>
                    <Progress value={completion} className="h-1 mt-1.5" />
                  </div>
                </button>
                {idx < sop.length - 1 && (
                  <ChevronRight className="size-4 text-slate-400 mx-1 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 🎯 当前阶段详细内容 */}
      {currentStage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* 左侧：方法与步骤 */}
          <div className="lg:col-span-2 space-y-3">
            {/* 阶段概述 */}
            <Card className="p-3 border-slate-300 bg-white border-l-4 border-l-green-500">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{currentStage.name}</h3>
              <p className="text-xs text-slate-600 mb-2">{currentStage.description}</p>
              <div className="flex items-center gap-3 text-xs">
                <Badge className="bg-blue-500">⏱ {currentStage.duration}</Badge>
                <Badge className="bg-green-500">✓ 成功率 {currentStage.successRate}%</Badge>
              </div>
            </Card>

            {/* 具体方法 */}
            <Card className="p-3 border-slate-300 bg-white">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Rocket className="size-4 text-blue-600" />
                具体方法 ({currentStage.methods.length}种)
              </h3>
              <div className="space-y-2">
                {currentStage.methods.map((method, idx) => (
                  <div key={idx} className="p-2.5 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900">{method.name}</h4>
                      <Badge variant="outline" className="text-xs">{method.platform}</Badge>
                    </div>
                    <div className="space-y-1 mb-2">
                      {method.steps.map((step, sidx) => (
                        <p key={sidx} className="text-xs text-slate-700 pl-2 border-l-2 border-blue-300">
                          {step}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Zap className="size-3" />
                        <span>工具: {method.tools.join(', ')}</span>
                      </div>
                    </div>
                    <div className="mt-1.5 p-1.5 bg-green-50 rounded border border-green-200">
                      <p className="text-xs font-semibold text-green-700">✓ {method.expectedResult}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 执行步骤 */}
            <Card className="p-3 border-slate-300 bg-white">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Play className="size-4 text-green-600" />
                执行步骤 ({currentStage.executionSteps.length}步)
              </h3>
              <div className="space-y-1.5">
                {currentStage.executionSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-900">{step.action}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {step.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {step.responsible}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 话术模板 */}
            <Card className="p-3 border-slate-300 bg-white">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <MessageSquare className="size-4 text-purple-600" />
                话术模板 ({currentStage.scriptTemplates.length}个)
              </h3>
              <div className="space-y-2">
                {currentStage.scriptTemplates.map((script, idx) => (
                  <div key={idx} className="p-2.5 bg-purple-50 rounded border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900">{script.scenario}</h4>
                      <Button size="sm" variant="outline" className="h-6 text-xs gap-1">
                        <Copy className="size-3" />
                        复制
                      </Button>
                    </div>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-white p-2 rounded border border-purple-200 font-mono">
                      {script.template}
                    </pre>
                  </div>
                ))}
              </div>
            </Card>

            {/* 常见问题 */}
            <Card className="p-3 border-slate-300 bg-white">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <AlertCircle className="size-4 text-orange-600" />
                常见问题与解决方案
              </h3>
              <div className="space-y-1.5">
                {currentStage.commonIssues.map((issue, idx) => (
                  <div key={idx} className="p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs font-semibold text-slate-900 mb-1">❓ {issue.issue}</p>
                    <p className="text-xs text-green-700 font-semibold">✓ {issue.solution}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 右侧：验证清单 */}
          <div className="space-y-3">
            {/* 验证清单 */}
            <Card className="p-3 border-slate-300 bg-white border-2 border-green-300">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <CheckCircle className="size-4 text-green-600" />
                验证清单 ({Object.keys(checkedItems[activeStage] || {}).filter(k => checkedItems[activeStage][Number(k)]).length}/{currentStage.verificationChecklist.length})
              </h3>
              <Progress 
                value={getStageCompletion(activeStage)} 
                className="h-2 mb-3" 
              />
              <div className="space-y-2">
                {currentStage.verificationChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <Checkbox
                      checked={checkedItems[activeStage]?.[idx] || false}
                      onCheckedChange={() => handleCheckItem(activeStage, idx)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={`text-xs ${
                        checkedItems[activeStage]?.[idx] 
                          ? 'line-through text-slate-500' 
                          : 'text-slate-900 font-semibold'
                      }`}>
                        {item.item}
                      </p>
                      {item.required && (
                        <Badge className="bg-red-500 text-white text-xs h-4 px-1 mt-1">必填</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {getStageCompletion(activeStage) === 100 && (
                <div className="mt-3 p-2 bg-green-50 rounded border border-green-300 flex items-center gap-2">
                  <ThumbsUp className="size-4 text-green-600" />
                  <p className="text-xs font-bold text-green-700">✓ 本阶段已完成！</p>
                </div>
              )}
            </Card>

            {/* AI工具推荐 */}
            {activeStage === 2 && (
              <Card className="p-3 border-slate-300 bg-white border-2 border-purple-300">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Brain className="size-4 text-purple-600" />
                  🤖 AI背调工具推荐
                </h3>
                <div className="space-y-2">
                  {aiTools.tools.slice(0, 3).map((tool, idx) => (
                    <div key={idx} className="p-2 bg-purple-50 rounded border border-purple-200">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-slate-900">{tool.name}</h4>
                        <Badge variant="outline" className="text-xs">{tool.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        用途: {tool.useCases.join(', ')}
                      </p>
                      <p className="text-xs text-slate-700 font-semibold mb-1">
                        {tool.howToUse}
                      </p>
                      {tool.prompt && (
                        <div className="text-xs text-purple-700 bg-white p-1.5 rounded border border-purple-200 font-mono">
                          💬 {tool.prompt}
                        </div>
                      )}
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        💰 {tool.pricing}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs font-bold text-slate-900 mb-1">🔄 AI背调工作流程:</p>
                  {aiTools.workflow.map((step, idx) => (
                    <p key={idx} className="text-xs text-slate-700">{step}</p>
                  ))}
                </div>
              </Card>
            )}

            {/* 快速导航 */}
            <Card className="p-3 border-slate-300 bg-white">
              <h3 className="text-sm font-bold text-slate-900 mb-2">⚡ 快速导航</h3>
              <div className="space-y-1">
                {sop.map(stage => {
                  const Icon = stage.icon;
                  const isActive = activeStage === stage.stage;
                  const completion = getStageCompletion(stage.stage);
                  
                  return (
                    <button
                      key={stage.stage}
                      onClick={() => setActiveStage(stage.stage)}
                      className={`w-full flex items-center gap-2 p-2 rounded transition-colors ${
                        isActive 
                          ? 'bg-green-100 border-2 border-green-500' 
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Icon className={`size-4 ${isActive ? 'text-green-600' : 'text-slate-500'}`} />
                      <div className="flex-1 text-left">
                        <p className="text-xs font-semibold text-slate-900">{stage.name}</p>
                        <Progress value={completion} className="h-1 mt-0.5" />
                      </div>
                      <span className="text-xs font-bold text-green-600">{completion.toFixed(0)}%</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
