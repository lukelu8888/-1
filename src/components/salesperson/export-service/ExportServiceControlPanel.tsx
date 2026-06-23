import { useEffect, useMemo, useState } from 'react'
import { FileText, Plus, Ship } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Switch } from '../../ui/switch'
import { Textarea } from '../../ui/textarea'
import { exportFreightSettlementService } from '../../../lib/services/export-service/exportFreightSettlementService'
import { exportHeaderDocumentService } from '../../../lib/services/export-service/exportHeaderDocumentService'
import { exportServiceFeeService } from '../../../lib/services/export-service/exportServiceFeeService'
import { createExportServiceOrderBundle } from '../../../lib/services/export-service/createExportServiceOrderBundle'
import { exportServiceOrderService } from '../../../lib/services/export-service/exportServiceOrderService'
import type { ExportServiceOrderStatus } from '../../../lib/services/export-service/exportServiceTypes'
import { ExportServiceOrderDetail } from './ExportServiceOrderDetail'
import { ExportServiceOrderList } from './ExportServiceOrderList'

interface ExportServiceControlPanelProps {
  actorLabel: string
}

const statusOptions: ExportServiceOrderStatus[] = [
  'draft',
  'documents_pending',
  'customer_confirmation_pending',
  'freight_quoting',
  'booking_pending',
  'execution_in_progress',
]

export function ExportServiceControlPanel({ actorLabel }: ExportServiceControlPanelProps) {
  const [orders, setOrders] = useState(() => exportServiceOrderService.list())
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [supplierTradeTerm, setSupplierTradeTerm] = useState('FOB')
  const [serviceStatus, setServiceStatus] = useState<ExportServiceOrderStatus>('draft')
  const [cargoSummary, setCargoSummary] = useState('')
  const [bookingRequired, setBookingRequired] = useState(true)
  const [insuranceHandledByCustomer, setInsuranceHandledByCustomer] = useState(true)

  const reload = () => {
    const nextOrders = exportServiceOrderService.list()
    setOrders(nextOrders)
    setSelectedOrderId((current) => current || nextOrders[0]?.id || null)
  }

  useEffect(() => {
    reload()
  }, [])

  const selectedOrder = useMemo(
    () => orders.find((item) => item.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  )

  const createServiceOrder = () => {
    if (!customerName.trim()) return

    const serviceOrder = createExportServiceOrderBundle({
      customerId: null,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || null,
      sourceMailThreadId: null,
      supplierName: supplierName.trim() || null,
      supplierTradeTerm,
      goodsPaymentHandledByUs: false,
      insuranceHandledByCustomer,
      bookingRequired,
      serviceStatus,
      cargoSummary: cargoSummary.trim() || null,
      createdByLabel: actorLabel,
    })

    setCustomerName('')
    setCustomerEmail('')
    setSupplierName('')
    setCargoSummary('')
    reload()
    setSelectedOrderId(serviceOrder.id)
  }

  const documents = selectedOrder ? exportHeaderDocumentService.listByServiceOrder(selectedOrder.id) : []
  const fees = selectedOrder ? exportServiceFeeService.listByServiceOrder(selectedOrder.id) : []
  const freightSettlements = selectedOrder ? exportFreightSettlementService.listByServiceOrder(selectedOrder.id) : []

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Ship className="h-5 w-5 text-orange-500" />
              借抬头出口服务 · 内部推进视图
            </div>
            <div className="mt-1 text-sm text-slate-500">
              当前挂在订单管理中，内部用于推进委托、抬头文件、服务费、运费和后段桥接。
            </div>
          </div>
          <Badge className="border-slate-200 bg-slate-50 text-slate-700">First Phase</Badge>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FileText className="h-4 w-4 text-slate-500" />
          新建借抬头服务委托单
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>客户名称</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="客户名称" />
            </div>
            <div className="space-y-2">
              <Label>客户邮箱</Label>
              <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="客户邮箱" />
            </div>
            <div className="space-y-2">
              <Label>供应商名称</Label>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="外部供应商名称" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>贸易条款</Label>
              <Select value={supplierTradeTerm} onValueChange={setSupplierTradeTerm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                  <SelectItem value="FCA">FCA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>前段状态</Label>
              <Select value={serviceStatus} onValueChange={(value) => setServiceStatus(value as ExportServiceOrderStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                需要订舱
                <Switch checked={bookingRequired} onCheckedChange={setBookingRequired} />
              </label>
              <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                客户自购保险
                <Switch checked={insuranceHandledByCustomer} onCheckedChange={setInsuranceHandledByCustomer} />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label>出货摘要</Label>
          <Textarea
            value={cargoSummary}
            onChange={(e) => setCargoSummary(e.target.value)}
            rows={3}
            placeholder="客户邮件中的出货清单摘要、港口、特别要求"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button className="gap-2" onClick={createServiceOrder}>
            <Plus className="h-4 w-4" />
            创建委托单
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.45fr]">
        <ExportServiceOrderList orders={orders} selectedOrderId={selectedOrderId} onSelect={setSelectedOrderId} />
        <ExportServiceOrderDetail
          order={selectedOrder}
          documents={documents}
          fees={fees}
          freightSettlements={freightSettlements}
        />
      </div>
    </div>
  )
}
