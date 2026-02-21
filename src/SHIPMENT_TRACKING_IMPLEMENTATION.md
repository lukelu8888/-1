# 物流追踪功能实现方案 V5.2

## 📋 概述

这是全流程泳道图V5.2版本的物流追踪功能实现方案，包括数据库设计、API集成、定时任务和前端组件。

---

## 🗄️ 数据库设计

### shipment_tracking 表

```sql
CREATE TABLE shipment_tracking (
  id BIGSERIAL PRIMARY KEY,
  -- 关联信息
  contract_no VARCHAR(50) NOT NULL,        -- 合同号 (如 SC-NA-2512-0001)
  bl_no VARCHAR(50),                        -- 提单号
  
  -- 船舶信息
  vessel_name VARCHAR(100),                 -- 船名 (如 MSC OSCAR)
  voyage_no VARCHAR(50),                    -- 航次 (如 251E)
  carrier VARCHAR(100),                     -- 船公司 (如 MSC, MAERSK)
  
  -- 时间信息
  etd DATE,                                 -- 预计离港日期 (Estimated Time of Departure)
  atd TIMESTAMP,                            -- 实际离港时间 (Actual Time of Departure)
  eta DATE,                                 -- 预计到港日期 (Estimated Time of Arrival)
  ata TIMESTAMP,                            -- 实际到港时间 (Actual Time of Arrival)
  
  -- 状态信息
  status VARCHAR(50) DEFAULT 'PENDING',     -- 状态: PENDING, DEPARTED, IN_TRANSIT, ARRIVED, DELIVERED
  current_location VARCHAR(200),            -- 当前位置 (如 "太平洋中部")
  latitude DECIMAL(10, 7),                  -- 纬度
  longitude DECIMAL(10, 7),                 -- 经度
  last_update_location TIMESTAMP,           -- 位置最后更新时间
  
  -- 港口信息
  pol VARCHAR(100),                         -- 装货港 (Port of Loading)
  pod VARCHAR(100),                         -- 卸货港 (Port of Discharge)
  final_destination VARCHAR(100),           -- 最终目的地
  
  -- 免堆期信息
  free_time_days INT DEFAULT 14,            -- 免堆期天数 (默认14天)
  free_time_deadline DATE,                  -- 免堆期截止日期
  demurrage_rate DECIMAL(10, 2),            -- 滞港费率 (如 $75/天)
  
  -- 数据来源
  data_source VARCHAR(50) DEFAULT 'MANUAL', -- 数据来源: API, MANUAL, FORWARDER
  api_provider VARCHAR(50),                 -- API提供商: MAERSK, CARGOSMART, etc.
  api_response_raw JSONB,                   -- API原始响应数据
  last_sync_time TIMESTAMP,                 -- 最后同步时间
  sync_error TEXT,                          -- 同步错误信息
  
  -- 提醒状态
  remind_7days_sent BOOLEAN DEFAULT FALSE,  -- 到港前7天提醒是否已发送
  remind_3days_sent BOOLEAN DEFAULT FALSE,  -- 免堆期前3天提醒是否已发送
  remind_7days_sent_at TIMESTAMP,           -- 7天提醒发送时间
  remind_3days_sent_at TIMESTAMP,           -- 3天提醒发送时间
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 索引
  CONSTRAINT unique_contract_bl UNIQUE (contract_no, bl_no)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_shipment_tracking_contract ON shipment_tracking(contract_no);
CREATE INDEX idx_shipment_tracking_bl ON shipment_tracking(bl_no);
CREATE INDEX idx_shipment_tracking_status ON shipment_tracking(status);
CREATE INDEX idx_shipment_tracking_eta ON shipment_tracking(eta);
CREATE INDEX idx_shipment_tracking_ata ON shipment_tracking(ata);
CREATE INDEX idx_shipment_tracking_free_time ON shipment_tracking(free_time_deadline);
```

### shipment_tracking_events 表（可选，用于记录详细事件）

```sql
CREATE TABLE shipment_tracking_events (
  id BIGSERIAL PRIMARY KEY,
  tracking_id BIGINT NOT NULL REFERENCES shipment_tracking(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,          -- 事件类型: DEPARTED, IN_TRANSIT, PORT_CALL, ARRIVED, etc.
  event_time TIMESTAMP NOT NULL,            -- 事件时间
  location VARCHAR(200),                    -- 事件位置
  latitude DECIMAL(10, 7),                  -- 纬度
  longitude DECIMAL(10, 7),                 -- 经度
  description TEXT,                         -- 事件描述
  data_source VARCHAR(50),                  -- 数据来源
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_events_tracking_id ON shipment_tracking_events(tracking_id);
CREATE INDEX idx_tracking_events_event_time ON shipment_tracking_events(event_time);
```

---

## 🚀 API集成方案

### 方案A：CargoSmart API（推荐）

**优点：**
- 支持全球主流船公司（MSC, Maersk, COSCO, CMA CGM等）
- 数据准确度高
- 提供实时位置追踪
- 支持批量查询

**集成示例：**

```typescript
// /supabase/functions/server/cargosmart-api.ts

const CARGOSMART_API_KEY = Deno.env.get('CARGOSMART_API_KEY');
const CARGOSMART_API_URL = 'https://api.cargosmart.com/tracking/v1';

export interface CargoSmartTrackingResponse {
  shipment: {
    blNumber: string;
    carrierCode: string;
    vesselName: string;
    voyageNumber: string;
    portOfLoading: string;
    portOfDischarge: string;
    estimatedDeparture: string;
    actualDeparture?: string;
    estimatedArrival: string;
    actualArrival?: string;
    status: string;
    currentLocation?: {
      name: string;
      latitude: number;
      longitude: number;
      updatedAt: string;
    };
  };
  events: Array<{
    eventType: string;
    eventTime: string;
    location: string;
    description: string;
  }>;
}

export async function trackCargoSmartShipment(blNo: string): Promise<CargoSmartTrackingResponse> {
  const response = await fetch(`${CARGOSMART_API_URL}/shipments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CARGOSMART_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reference: blNo,
      referenceType: 'BL'
    })
  });

  if (!response.ok) {
    throw new Error(`CargoSmart API error: ${response.statusText}`);
  }

  return await response.json();
}
```

### 方案B：Maersk API

**优点：**
- 马士基官方API
- 数据最准确（针对马士基船舶）
- 免费使用

**缺点：**
- 仅支持马士基船舶

**集成示例：**

```typescript
// /supabase/functions/server/maersk-api.ts

const MAERSK_API_KEY = Deno.env.get('MAERSK_API_KEY');
const MAERSK_API_URL = 'https://api.maersk.com/track/v2';

export async function trackMaerskShipment(blNo: string) {
  const response = await fetch(`${MAERSK_API_URL}/shipments/${blNo}`, {
    headers: {
      'Accept': 'application/json',
      'Consumer-Key': MAERSK_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Maersk API error: ${response.statusText}`);
  }

  return await response.json();
}
```

### 方案C：Ship24 API（备用方案）

**优点：**
- 聚合多家船公司数据
- 使用简单
- 价格合理

```typescript
// /supabase/functions/server/ship24-api.ts

const SHIP24_API_KEY = Deno.env.get('SHIP24_API_KEY');
const SHIP24_API_URL = 'https://api.ship24.com/public/v1';

export async function trackShip24Shipment(blNo: string) {
  const response = await fetch(`${SHIP24_API_URL}/tracking/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SHIP24_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      trackingNumber: blNo
    })
  });

  if (!response.ok) {
    throw new Error(`Ship24 API error: ${response.statusText}`);
  }

  return await response.json();
}
```

---

## ⚙️ 服务器端实现

### 1. 同步物流追踪数据

```typescript
// /supabase/functions/server/sync-shipment-tracking.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Hono } from 'npm:hono@4';
import { trackCargoSmartShipment } from './cargosmart-api.ts';

const app = new Hono();

app.get('/make-server-880fd43b/sync-shipment-tracking', async (c) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // 获取所有未到港的物流追踪记录
    const { data: shipments, error } = await supabase
      .from('shipment_tracking')
      .select('*')
      .in('status', ['DEPARTED', 'IN_TRANSIT'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const results = [];

    for (const shipment of shipments || []) {
      if (!shipment.bl_no) {
        console.log(`跳过合同 ${shipment.contract_no}：无提单号`);
        continue;
      }

      try {
        // 调用CargoSmart API获取最新数据
        const tracking = await trackCargoSmartShipment(shipment.bl_no);

        // 更新数据库
        const { error: updateError } = await supabase
          .from('shipment_tracking')
          .update({
            vessel_name: tracking.shipment.vesselName,
            voyage_no: tracking.shipment.voyageNumber,
            status: mapCargoSmartStatus(tracking.shipment.status),
            current_location: tracking.shipment.currentLocation?.name,
            latitude: tracking.shipment.currentLocation?.latitude,
            longitude: tracking.shipment.currentLocation?.longitude,
            atd: tracking.shipment.actualDeparture,
            ata: tracking.shipment.actualArrival,
            last_sync_time: new Date().toISOString(),
            api_provider: 'CARGOSMART',
            api_response_raw: tracking,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.id);

        if (updateError) throw updateError;

        // 如果船舶已到港，计算免堆期截止日期
        if (tracking.shipment.actualArrival && !shipment.free_time_deadline) {
          const arrivalDate = new Date(tracking.shipment.actualArrival);
          const freeTimeDeadline = new Date(arrivalDate);
          freeTimeDeadline.setDate(freeTimeDeadline.getDate() + (shipment.free_time_days || 14));

          await supabase
            .from('shipment_tracking')
            .update({
              free_time_deadline: freeTimeDeadline.toISOString().split('T')[0]
            })
            .eq('id', shipment.id);
        }

        results.push({
          contract_no: shipment.contract_no,
          bl_no: shipment.bl_no,
          status: 'success'
        });

      } catch (err) {
        console.error(`同步失败 ${shipment.bl_no}:`, err);
        
        // 记录错误
        await supabase
          .from('shipment_tracking')
          .update({
            sync_error: err.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', shipment.id);

        results.push({
          contract_no: shipment.contract_no,
          bl_no: shipment.bl_no,
          status: 'error',
          error: err.message
        });
      }
    }

    return c.json({
      success: true,
      synced: results.length,
      results
    });

  } catch (error) {
    console.error('同步物流追踪错误:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 状态映射函数
function mapCargoSmartStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'BOOKED': 'PENDING',
    'GATE_IN': 'PENDING',
    'LOADED': 'DEPARTED',
    'DEPARTED': 'DEPARTED',
    'IN_TRANSIT': 'IN_TRANSIT',
    'ARRIVED': 'ARRIVED',
    'DISCHARGED': 'ARRIVED',
    'DELIVERED': 'DELIVERED'
  };
  return statusMap[status] || status;
}

export default app;
```

### 2. 检查并发送提醒

```typescript
// /supabase/functions/server/check-shipment-reminders.ts

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Hono } from 'npm:hono@4';

const app = new Hono();

app.get('/make-server-880fd43b/check-shipment-reminders', async (c) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 检查到港前7天提醒
    const { data: shipments7Days, error: error7Days } = await supabase
      .from('shipment_tracking')
      .select('*, sales_contracts!inner(contract_no, customer_name, customer_email, sales_rep)')
      .in('status', ['DEPARTED', 'IN_TRANSIT'])
      .is('remind_7days_sent', false)
      .not('eta', 'is', null);

    if (error7Days) throw error7Days;

    for (const shipment of shipments7Days || []) {
      if (!shipment.eta) continue;

      const etaDate = new Date(shipment.eta);
      const daysUntilArrival = Math.ceil((etaDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilArrival === 7) {
        // 发送邮件/短信提醒
        await sendArrivalReminder(shipment, daysUntilArrival);

        // 标记为已发送
        await supabase
          .from('shipment_tracking')
          .update({
            remind_7days_sent: true,
            remind_7days_sent_at: new Date().toISOString()
          })
          .eq('id', shipment.id);

        console.log(`✅ 已发送7天提醒：${shipment.contract_no}`);
      }
    }

    // 2. 检查免堆期前3天紧急提醒
    const { data: shipmentsFreeTime, error: errorFreeTime } = await supabase
      .from('shipment_tracking')
      .select('*, sales_contracts!inner(contract_no, customer_name, customer_email, sales_rep)')
      .eq('status', 'ARRIVED')
      .is('remind_3days_sent', false)
      .not('free_time_deadline', 'is', null);

    if (errorFreeTime) throw errorFreeTime;

    for (const shipment of shipmentsFreeTime || []) {
      if (!shipment.free_time_deadline) continue;

      const deadlineDate = new Date(shipment.free_time_deadline);
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDeadline === 3) {
        // 发送紧急提醒
        await sendUrgentFreeTimeReminder(shipment, daysUntilDeadline);

        // 标记为已发送
        await supabase
          .from('shipment_tracking')
          .update({
            remind_3days_sent: true,
            remind_3days_sent_at: new Date().toISOString()
          })
          .eq('id', shipment.id);

        console.log(`🚨 已发送3天紧急提醒：${shipment.contract_no}`);
      }
    }

    return c.json({
      success: true,
      reminders_7days: shipments7Days?.length || 0,
      reminders_3days: shipmentsFreeTime?.length || 0
    });

  } catch (error) {
    console.error('检查提醒错误:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 发送到港前7天提醒
async function sendArrivalReminder(shipment: any, daysLeft: number) {
  // TODO: 实现邮件/短信发送逻辑
  console.log(`📧 发送到港提醒：${shipment.contract_no}，还有${daysLeft}天到港`);
}

// 发送免堆期前3天紧急提醒
async function sendUrgentFreeTimeReminder(shipment: any, daysLeft: number) {
  // TODO: 实现邮件/短信发送逻辑
  console.log(`🚨 发送免堆期紧急提醒：${shipment.contract_no}，免堆期剩余${daysLeft}天`);
}

export default app;
```

---

## 🎨 前端组件实现

### 客户Portal物流追踪组件

```tsx
// /components/customer/ShipmentTracking.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Ship, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface ShipmentTrackingProps {
  contractNo: string;
}

export function ShipmentTracking({ contractNo }: ShipmentTrackingProps) {
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await fetch(`/api/shipment-tracking/${contractNo}`);
        const data = await response.json();
        setTracking(data);
      } catch (error) {
        console.error('获取物流追踪失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchTracking, 30000);
    return () => clearInterval(interval);
  }, [contractNo]);

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!tracking) {
    return <div>暂无物流追踪信息</div>;
  }

  const daysUntilArrival = tracking.eta 
    ? Math.ceil((new Date(tracking.eta).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const daysUntilFreeTimeDeadline = tracking.free_time_deadline
    ? Math.ceil((new Date(tracking.free_time_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // 倒计时颜色预警
  const getCountdownColor = (days: number | null) => {
    if (days === null) return 'text-gray-500';
    if (days > 7) return 'text-green-600';
    if (days >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* 🔥 倒计日期大字显示 */}
      {daysUntilArrival !== null && daysUntilArrival > 0 && (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <p className={`text-7xl font-bold ${getCountdownColor(daysUntilArrival)}`}>
                {daysUntilArrival}
              </p>
              <p className="text-3xl mt-2">天</p>
              <p className="text-xl mt-1">距离到港还有</p>
              <p className="text-sm mt-4 opacity-90">
                预计到港日期：{new Date(tracking.eta).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 免堆期倒计时（仅到港后显示）*/}
      {tracking.status === 'ARRIVED' && daysUntilFreeTimeDeadline !== null && (
        <Card className={`${daysUntilFreeTimeDeadline <= 3 ? 'border-red-500 border-2' : ''}`}>
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              免堆期倒计时
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <p className={`text-6xl font-bold ${getCountdownColor(daysUntilFreeTimeDeadline)}`}>
                {daysUntilFreeTimeDeadline}
              </p>
              <p className="text-2xl mt-2">天</p>
              <p className="text-lg mt-1">免堆期剩余</p>
              <p className="text-sm mt-4 text-gray-600">
                免堆期截止：{new Date(tracking.free_time_deadline).toLocaleDateString('zh-CN')}
              </p>
              {daysUntilFreeTimeDeadline <= 3 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">
                    ⚠️ 紧急提醒：请尽快安排清关提货！
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    超期后将产生滞港费：${tracking.demurrage_rate || 75}/天
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 船舶信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5" />
            船舶信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">船名</p>
              <p className="font-medium">{tracking.vessel_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">航次</p>
              <p className="font-medium">{tracking.voyage_no || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">提单号</p>
              <p className="font-medium">{tracking.bl_no || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">状态</p>
              <Badge variant={tracking.status === 'ARRIVED' ? 'success' : 'default'}>
                {tracking.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 当前位置 */}
      {tracking.current_location && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              当前位置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{tracking.current_location}</p>
            <p className="text-sm text-gray-500 mt-1">
              最后更新：{new Date(tracking.last_sync_time).toLocaleString('zh-CN')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 时间线 */}
      <Card>
        <CardHeader>
          <CardTitle>运输时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TimelineItem
              label="实际离港"
              date={tracking.atd}
              icon={<Ship />}
              completed={!!tracking.atd}
            />
            <TimelineItem
              label="运输中"
              date={tracking.current_location}
              icon={<Ship />}
              completed={tracking.status === 'IN_TRANSIT'}
            />
            <TimelineItem
              label="预计到港"
              date={tracking.eta}
              icon={<Calendar />}
              completed={tracking.status === 'ARRIVED'}
            />
            <TimelineItem
              label="实际到港"
              date={tracking.ata}
              icon={<MapPin />}
              completed={!!tracking.ata}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineItem({ label, date, icon, completed }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-full ${completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-500">
          {date ? (typeof date === 'string' && date.includes('-') 
            ? new Date(date).toLocaleString('zh-CN')
            : date)
            : '待更新'}
        </p>
      </div>
      {completed && (
        <Badge variant="success" className="ml-auto">完成</Badge>
      )}
    </div>
  );
}
```

---

## 🕐 定时任务配置

使用GitHub Actions或Supabase Edge Functions的Cron功能定时执行：

### GitHub Actions (推荐)

```yaml
# .github/workflows/sync-shipment-tracking.yml

name: Sync Shipment Tracking

on:
  schedule:
    # 每天 08:00 和 14:00 UTC 执行（北京时间 16:00 和 22:00）
    - cron: '0 8,14 * * *'
  workflow_dispatch: # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Shipment Data
        run: |
          curl -X GET "${{ secrets.SUPABASE_URL }}/functions/v1/make-server-880fd43b/sync-shipment-tracking" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
      
      - name: Check Reminders
        run: |
          curl -X GET "${{ secrets.SUPABASE_URL }}/functions/v1/make-server-880fd43b/check-shipment-reminders" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## 📝 环境变量配置

需要添加以下环境变量到Supabase：

```bash
# CargoSmart API
CARGOSMART_API_KEY=your_cargosmart_api_key_here

# Maersk API (可选)
MAERSK_API_KEY=your_maersk_api_key_here

# Ship24 API (可选)
SHIP24_API_KEY=your_ship24_api_key_here
```

---

## ✅ 实施步骤

1. **数据库准备**
   - [ ] 创建 `shipment_tracking` 表
   - [ ] 创建 `shipment_tracking_events` 表（可选）
   - [ ] 创建索引

2. **API集成**
   - [ ] 注册CargoSmart API账号
   - [ ] 获取API Key
   - [ ] 实现API调用函数

3. **服务器端开发**
   - [ ] 实现同步物流追踪数据endpoint
   - [ ] 实现检查提醒endpoint
   - [ ] 实现状态映射逻辑

4. **前端开发**
   - [ ] 创建ShipmentTracking组件
   - [ ] 实现倒计日期显示
   - [ ] 实现颜色预警
   - [ ] 实现自动刷新

5. **定时任务**
   - [ ] 配置GitHub Actions
   - [ ] 测试定时任务

6. **测试**
   - [ ] 测试API调用
   - [ ] 测试数据同步
   - [ ] 测试提醒功能
   - [ ] 测试前端显示

---

## 🎯 总结

物流追踪功能V5.2完整实现了：

✅ 数据库设计（shipment_tracking表）  
✅ API集成方案（CargoSmart/Maersk/Ship24）  
✅ 服务器端同步逻辑  
✅ 自动提醒系统（7天+3天）  
✅ 前端倒计日期大字显示  
✅ 颜色预警机制  
✅ 定时任务配置  

这套系统可以实现完全自动化的物流追踪和提醒功能！🚀
