import type {
  ExportExecutionBridgeRecord,
  ExportFreightSettlementRecord,
  ExportHeaderDocumentRecord,
  ExportServiceFeeRecord,
  ExportServiceOrderRecord,
} from './exportServiceTypes'

export interface ExportServicePortalNode {
  key: 'documents' | 'booking' | 'execution' | 'settlement'
  label: string
  status: 'pending' | 'in_progress' | 'done'
  summary: string
}

export interface ExportServicePortalSummary {
  overallStatus: 'pending' | 'in_progress' | 'done'
  overallLabel: string
  customerActionLabel: string
  customerActionSummary: string
  blockerLabel: string
  blockerSummary: string
  blockerReferenceLabel: string
  blockerReferenceSummary: string
  blockerActionLabel: string
  blockerActionSummary: string
  blockerOwnerLabel: string
  blockerOwnerSummary: string
  internalNextActionLabel: string
  internalNextActionSummary: string
  nodes: ExportServicePortalNode[]
}

function toOverallStatus(nodes: ExportServicePortalNode[]): ExportServicePortalSummary['overallStatus'] {
  if (nodes.every((item) => item.status === 'done')) return 'done'
  if (nodes.some((item) => item.status === 'in_progress' || item.status === 'done')) return 'in_progress'
  return 'pending'
}

function toOverallLabel(status: ExportServicePortalSummary['overallStatus']) {
  if (status === 'done') return '已完成'
  if (status === 'in_progress') return '进行中'
  return '待启动'
}

export const exportServicePortalSummaryService = {
  getSummary(input: {
    order: ExportServiceOrderRecord
    documents: ExportHeaderDocumentRecord[]
    fees: ExportServiceFeeRecord[]
    freightSettlements: ExportFreightSettlementRecord[]
    executionBridge: ExportExecutionBridgeRecord | null
  }): ExportServicePortalSummary {
    const { order, documents, fees, freightSettlements, executionBridge } = input

    const documentConfirmed = documents.some((item) => item.status === 'confirmed')
    const documentSent = documents.some((item) => item.status === 'sent_for_confirmation')
    const documentsNode: ExportServicePortalNode = documentConfirmed
      ? {
          key: 'documents',
          label: '抬头文件确认',
          status: 'done',
          summary: '客户已确认抬头文件',
        }
      : documentSent
        ? {
            key: 'documents',
            label: '抬头文件确认',
            status: 'in_progress',
            summary: '文件已发客户确认，等待回复',
          }
        : {
            key: 'documents',
            label: '抬头文件确认',
            status: 'pending',
            summary: '待整理并发送抬头文件',
          }

    const bookingReady = executionBridge?.shipmentBridgeStatus === 'linked'
    const bookingInProgress =
      order.bookingRequired &&
      (order.serviceStatus === 'booking_pending' ||
        executionBridge?.shipmentBridgeStatus === 'ready_to_push')
    const bookingNode: ExportServicePortalNode = !order.bookingRequired
      ? {
          key: 'booking',
          label: '订舱安排',
          status: 'done',
          summary: '当前委托单无需订舱',
        }
      : bookingReady
        ? {
            key: 'booking',
            label: '订舱安排',
            status: 'done',
            summary: `订舱已挂入后段执行链 ${executionBridge?.shipmentReference || ''}`.trim(),
          }
        : bookingInProgress
          ? {
              key: 'booking',
              label: '订舱安排',
              status: 'in_progress',
              summary: '订舱资料已进入处理，等待后段确认',
            }
          : {
              key: 'booking',
              label: '订舱安排',
              status: 'pending',
              summary: '待进入订舱准备',
            }

    const docsLinked = executionBridge?.docsBridgeStatus === 'linked'
    const paymentLinked = executionBridge?.paymentBridgeStatus === 'linked'
    const payableLinked = executionBridge?.payableBridgeStatus === 'linked'
    const executionNode: ExportServicePortalNode =
      docsLinked && paymentLinked && payableLinked
        ? {
            key: 'execution',
            label: '后段执行',
            status: 'done',
            summary: '单证、付款、应付桥接均已进入后段工作面',
          }
        : docsLinked || paymentLinked || payableLinked || order.serviceStatus === 'execution_in_progress'
          ? {
              key: 'execution',
              label: '后段执行',
              status: 'in_progress',
              summary: '后段执行已启动，正持续推进单证/财务桥接',
            }
          : {
              key: 'execution',
              label: '后段执行',
              status: 'pending',
              summary: '待进入后段执行桥接',
            }

    const feePaid = fees.length > 0 && fees.every((item) => item.paymentStatus === 'paid')
    const freightClosed =
      freightSettlements.length > 0 &&
      freightSettlements.every((item) => item.settlementStatus === 'forwarder_paid')
    const settlementNode: ExportServicePortalNode =
      order.serviceStatus === 'settlement_closed' || (feePaid && freightClosed)
        ? {
            key: 'settlement',
            label: '结算收口',
            status: 'done',
            summary: '服务费与运费结算已基本收口',
          }
        : fees.some((item) => item.paymentStatus !== 'draft') ||
            freightSettlements.some((item) => item.settlementStatus !== 'draft')
          ? {
              key: 'settlement',
              label: '结算收口',
              status: 'in_progress',
              summary: '服务费或运费结算正在推进',
            }
          : {
              key: 'settlement',
              label: '结算收口',
              status: 'pending',
              summary: '待进入服务费与运费结算',
            }

    const nodes = [documentsNode, bookingNode, executionNode, settlementNode]
    const overallStatus = toOverallStatus(nodes)

    let customerActionLabel = '当前无需客户动作'
    let customerActionSummary = '服务链可继续按内部执行节奏推进'
    let blockerLabel = '当前无明显阻断'
    let blockerSummary = '当前服务链可按既定节奏继续推进'
    let blockerReferenceLabel = '当前无需额外盯办引用'
    let blockerReferenceSummary = '暂无需要额外追踪的桥接编号或业务引用'
    let blockerActionLabel = '当前无需额外追办动作'
    let blockerActionSummary = '可继续按现有委托单与后段桥接节奏推进'
    let blockerOwnerLabel = '当前无需额外责任归口'
    let blockerOwnerSummary = '当前无需额外切换销售前段、单证或财务的责任聚焦'
    let internalNextActionLabel = '继续内部推进'
    let internalNextActionSummary = '按现有桥接节奏继续推进后段执行与结算'

    if (documentsNode.status !== 'done') {
      const latestDocument = documents[0]
      customerActionLabel = '请客户确认抬头文件'
      customerActionSummary = '客户当前最需要完成的是确认抬头文件与抬头信息'
      blockerLabel = '等待客户确认抬头文件'
      blockerSummary = '当前主要卡点在抬头文件确认，内部需继续催办客户确认后才能更顺畅进入后续环节'
      blockerReferenceLabel = '优先盯抬头文件记录'
      blockerReferenceSummary = latestDocument
        ? `${latestDocument.documentNumber || latestDocument.id} / ${latestDocument.titleHeadingCompany}`
        : '当前尚无正式抬头文件编号，需先完成文件整理并发出'
      blockerActionLabel = '优先催办抬头文件确认'
      blockerActionSummary = latestDocument
        ? `先盯 ${latestDocument.documentNumber || latestDocument.id} 这条抬头文件记录，催客户确认并回写结果`
        : '先补齐抬头文件内容并发出，再继续催客户确认'
      blockerOwnerLabel = '销售前段优先跟进'
      blockerOwnerSummary = '当前更偏销售前段责任，先把抬头文件整理、发出和客户确认链盯紧'
      internalNextActionLabel = '整理并发送抬头文件'
      internalNextActionSummary = '内部当前最需要尽快完成抬头文件整理、发出并跟进客户确认'
    } else if (bookingNode.status === 'in_progress' && order.bookingRequired) {
      customerActionLabel = '请客户确认订舱资料'
      customerActionSummary = '订舱已启动，客户需继续配合确认船期或资料'
      blockerLabel = '等待订舱资料或船期确认'
      blockerSummary = '当前主要等待订舱资料补齐、船期确认或后段订舱桥接进一步落稳'
      blockerReferenceLabel = '优先盯订舱桥接引用'
      blockerReferenceSummary =
        executionBridge?.shipmentReference || '当前订舱桥接尚未形成正式引用号，需继续推进 shipment bridge'
      blockerActionLabel = '优先推进 shipment bridge'
      blockerActionSummary = executionBridge?.shipmentReference
        ? `先盯 ${executionBridge.shipmentReference} 这条订舱桥接引用，继续追船期、订舱资料和后段确认`
        : '先把 shipment bridge 引用号挂稳，再继续推进船期和订舱资料确认'
      blockerOwnerLabel = '销售前段协同订舱'
      blockerOwnerSummary = '当前更偏销售前段与订舱协同责任，先把订舱资料、船期和 shipment bridge 推稳'
      internalNextActionLabel = '继续推进订舱桥接'
      internalNextActionSummary = '内部当前最需要继续推进订舱、船期和出运资料确认'
    } else if (bookingNode.status === 'pending' && order.bookingRequired) {
      blockerLabel = '订舱前置资料尚未齐备'
      blockerSummary = '当前尚未进入正式订舱，需先把订舱前置资料、出运条件和责任口径整理齐'
      blockerReferenceLabel = '优先盯委托单资料完整度'
      blockerReferenceSummary = `${order.serviceOrderNumber} / 待补齐订舱资料、出运条件与责任口径`
      blockerActionLabel = '优先补齐订舱前置资料'
      blockerActionSummary = `围绕 ${order.serviceOrderNumber} 先补齐订舱资料、出运条件和责任口径，再进入正式订舱`
      blockerOwnerLabel = '销售前段补资料'
      blockerOwnerSummary = '当前更偏销售前段责任，先把委托单资料、订舱条件和责任口径补完整'
      internalNextActionLabel = '准备订舱资料'
      internalNextActionSummary = '内部当前最需要先把订舱资料与订舱前置条件整理齐'
    } else if (settlementNode.status === 'in_progress') {
      const activeFee = fees.find((item) => item.paymentStatus !== 'paid')
      const activeFreight = freightSettlements.find((item) => item.settlementStatus !== 'forwarder_paid')
      customerActionLabel = '请客户配合结算'
      customerActionSummary = '服务费或运费结算正在推进，客户侧需继续配合付款或确认'
      blockerLabel = '等待结算收口'
      blockerSummary = '当前主要卡点在服务费或运费结算，需继续推动付款、核对与结算完成'
      blockerReferenceLabel = '优先盯结算识别键'
      blockerReferenceSummary =
        activeFee?.receivableReference ||
        activeFreight?.paymentRecordReference ||
        activeFreight?.payableReference ||
        '当前尚无明确结算识别键，需继续推进服务费或运费结算记录'
      blockerActionLabel = '优先推动结算识别键收口'
      blockerActionSummary =
        activeFee?.receivableReference
          ? `先盯应收识别键 ${activeFee.receivableReference}，继续推进服务费收款与核销`
          : activeFreight?.paymentRecordReference
            ? `先盯付款识别键 ${activeFreight.paymentRecordReference}，继续推进运费付款记录收口`
            : activeFreight?.payableReference
              ? `先盯应付识别键 ${activeFreight.payableReference}，继续推进运费应付结算收口`
              : '先补齐服务费或运费结算识别键，再继续推进收款、付款和核销'
      blockerOwnerLabel = '财务收口优先'
      blockerOwnerSummary = '当前更偏财务责任，先把服务费、运费付款和应付结算链收住'
      internalNextActionLabel = '继续推进结算收口'
      internalNextActionSummary = '内部当前最需要跟进服务费与运费结算，尽快推动整单收口'
    } else if (executionNode.status === 'in_progress') {
      blockerLabel = '等待后段执行继续推进'
      blockerSummary = '当前已进入后段执行，但仍需持续推进单证、付款、应付等桥接动作完成'
      blockerReferenceLabel = '优先盯后段桥接引用'
      blockerReferenceSummary =
        executionBridge?.docsReference ||
        executionBridge?.paymentReference ||
        executionBridge?.payableReference ||
        '当前后段已启动，但仍需继续补齐 docs / payment / payable bridge 引用'
      blockerActionLabel = '优先推进后段 bridge'
      blockerActionSummary =
        executionBridge?.docsReference
          ? `先盯 docs bridge ${executionBridge.docsReference}，继续推动单证工作面收口`
          : executionBridge?.paymentReference
            ? `先盯 payment bridge ${executionBridge.paymentReference}，继续推动付款工作面收口`
            : executionBridge?.payableReference
              ? `先盯 payable bridge ${executionBridge.payableReference}，继续推动应付工作面收口`
              : '先补齐 docs / payment / payable bridge 引用，再继续推进后段执行'
      blockerOwnerLabel = executionBridge?.docsReference ? '单证执行优先' : '后段执行协同推进'
      blockerOwnerSummary = executionBridge?.docsReference
        ? '当前更偏单证执行责任，先把 docs bridge 和单证工作面推进到位'
        : '当前更偏后段执行协同责任，需继续把 docs / payment / payable bridge 往前推'
      internalNextActionLabel = '继续推进后段执行'
      internalNextActionSummary = '内部当前最需要盯住单证、付款、应付桥接的持续推进'
    } else if (settlementNode.status === 'pending' && executionNode.status === 'done') {
      blockerLabel = '等待进入结算收口'
      blockerSummary = '执行链已基本到位，下一步主要等待服务费与运费结算正式启动并完成收口'
      blockerReferenceLabel = '优先盯服务费/运费初始化'
      blockerReferenceSummary =
        fees[0]?.receivableReference ||
        freightSettlements[0]?.paymentRecordReference ||
        freightSettlements[0]?.payableReference ||
        '执行已到位，但尚未进入明确结算引用链'
      blockerActionLabel = '优先启动结算链'
      blockerActionSummary = '执行已到位，下一步先把服务费或运费结算引用链正式拉起，再推进整单收口'
      blockerOwnerLabel = '财务准备接手'
      blockerOwnerSummary = '当前更偏财务接手责任，先把结算引用链和核销入口正式拉起'
    }

    return {
      overallStatus,
      overallLabel: toOverallLabel(overallStatus),
      customerActionLabel,
      customerActionSummary,
      blockerLabel,
      blockerSummary,
      blockerReferenceLabel,
      blockerReferenceSummary,
      blockerActionLabel,
      blockerActionSummary,
      blockerOwnerLabel,
      blockerOwnerSummary,
      internalNextActionLabel,
      internalNextActionSummary,
      nodes,
    }
  },
}
