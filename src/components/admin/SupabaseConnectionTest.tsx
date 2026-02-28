import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

export default function SupabaseConnectionTest() {
  const [results, setResults] = useState<Array<{ test: string; status: 'ok' | 'fail' | 'testing'; detail: string }>>([])
  const [running, setRunning] = useState(false)

  const runTests = async () => {
    setRunning(true)
    setResults([])

    const add = (test: string, status: 'ok' | 'fail', detail: string) =>
      setResults(prev => [...prev, { test, status, detail }])

    // Test 1: 基本连接
    try {
      const { data, error } = await supabase.from('sales_contracts').select('count').limit(1)
      if (error) throw error
      add('数据库连接', 'ok', '连接成功 ✓')
    } catch (e: any) {
      add('数据库连接', 'fail', e.message)
    }

    // Test 2: 销售合同表
    try {
      const { data, error } = await supabase.from('sales_contracts').select('id').limit(1)
      if (error) throw error
      add('sales_contracts 表', 'ok', `表存在，${data?.length ?? 0} 条记录`)
    } catch (e: any) {
      add('sales_contracts 表', 'fail', e.message)
    }

    // Test 3: 订单表
    try {
      const { data, error } = await supabase.from('orders').select('id').limit(1)
      if (error) throw error
      add('orders 表', 'ok', `表存在，${data?.length ?? 0} 条记录`)
    } catch (e: any) {
      add('orders 表', 'fail', e.message)
    }

    // Test 4: 应收账款表
    try {
      const { data, error } = await supabase.from('accounts_receivable').select('id').limit(1)
      if (error) throw error
      add('accounts_receivable 表', 'ok', `表存在，${data?.length ?? 0} 条记录`)
    } catch (e: any) {
      add('accounts_receivable 表', 'fail', e.message)
    }

    // Test 5: 审批记录表
    try {
      const { data, error } = await supabase.from('approval_records').select('id').limit(1)
      if (error) throw error
      add('approval_records 表', 'ok', `表存在，${data?.length ?? 0} 条记录`)
    } catch (e: any) {
      add('approval_records 表', 'fail', e.message)
    }

    // Test 6: 通知表
    try {
      const { data, error } = await supabase.from('notifications').select('id').limit(1)
      if (error) throw error
      add('notifications 表', 'ok', `表存在，${data?.length ?? 0} 条记录`)
    } catch (e: any) {
      add('notifications 表', 'fail', e.message)
    }

    // Test 7: Realtime 订阅
    try {
      const channel = supabase.channel('test_channel')
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('超时')), 5000)
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            supabase.removeChannel(channel)
            resolve()
          }
        })
      })
      add('Realtime 实时同步', 'ok', '订阅成功 ✓')
    } catch (e: any) {
      add('Realtime 实时同步', 'fail', e.message)
    }

    setRunning(false)
  }

  const allOk = results.length > 0 && results.every(r => r.status === 'ok')
  const anyFail = results.some(r => r.status === 'fail')

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Supabase 连接测试
          <Badge variant="outline" className="text-xs font-mono">
            oaavirpytvemskjooeyg
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={running} className="w-full">
          {running ? '测试中...' : '开始测试'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                <span className="font-medium text-sm">{r.test}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{r.detail}</span>
                  <Badge variant={r.status === 'ok' ? 'default' : 'destructive'}>
                    {r.status === 'ok' ? '✓ 正常' : '✗ 失败'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {allOk && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm font-medium text-center">
            ✅ 所有测试通过！Supabase 已成功接入，可以开始迁移数据。
          </div>
        )}
        {anyFail && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            ⚠️ 部分测试失败。请先在 Supabase Dashboard 执行 <strong>supabase_migration.sql</strong> 建表，然后重新测试。
            <br />
            <a
              href="https://supabase.com/dashboard/project/oaavirpytvemskjooeyg/sql"
              target="_blank"
              rel="noreferrer"
              className="underline mt-1 inline-block"
            >
              前往 SQL Editor →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
