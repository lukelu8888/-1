<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequirement;
use App\Models\SupplierRfq;
use App\Models\SupplierRfqQuote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * 供应商报价（BJ）
 * POST /api/supplier-quotations - 供应商提交报价
 * GET  /api/supplier-quotations - 采购员/Admin 查看报价列表
 */
class SupplierQuotationController extends Controller
{
    private function canViewProcurementQuotations(Request $request): bool
    {
        $user = $request->user();
        if (!$user) return false;
        $portalRole = (string) ($user->portal_role ?? '');
        if ($portalRole === 'admin') return true;
        $rbacRole = (string) ($user->rbac_role ?? '');
        return in_array($rbacRole, ['Procurement', 'Admin', 'CEO', 'CFO', 'Finance'], true);
    }

    /**
     * 采购员/Admin 获取供应商报价列表
     * GET /api/supplier-quotations
     */
    public function index(Request $request)
    {
        if (!$this->canViewProcurementQuotations($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $quotes = SupplierRfqQuote::query()
            ->with('supplierRfq')
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        $list = [];
        foreach ($quotes as $quote) {
            $rfq = $quote->supplierRfq;
            if (!$rfq) continue;
            $qd = $quote->quote_data ?? [];
            $items = $qd['items'] ?? [];
            $doc = $qd['documentData'] ?? [];
            $validUntil = is_array($doc) ? ($doc['validUntil'] ?? null) : null;
            if (!$validUntil && $quote->quoted_date) {
                $d = \Carbon\Carbon::parse($quote->quoted_date)->addDays(30);
                $validUntil = $d->format('Y-m-d');
            }
            $list[] = [
                'id' => 'bj-' . (string) $quote->id,
                'quotationNo' => $quote->quotation_no,
                'sourceXJ' => $rfq->supplier_rfq_no,
                'sourceQR' => $rfq->requirement_no,
                'sourceRFQId' => $rfq->rfq_uid,
                'supplierCode' => $quote->supplier_code,
                'supplierName' => $quote->supplier_name,
                'supplierCompany' => $quote->supplier_name,
                'supplierEmail' => $rfq->supplier_email ?? '',
                'customerName' => $rfq->customer_name ?? 'COSUN采购',
                'customerCompany' => '福建高盛达富建材有限公司',
                'totalAmount' => (float) $quote->quoted_price,
                'currency' => $quote->currency,
                'quotationDate' => $quote->quoted_date ? $quote->quoted_date->format('Y-m-d') : null,
                'validUntil' => $validUntil,
                'status' => (string) ($quote->procurement_status ?? 'submitted'),
                'paymentTerms' => $quote->payment_terms ?? '',
                'deliveryTerms' => $qd['deliveryTerms'] ?? '',
                'items' => $items,
                'documentData' => $qd['documentData'] ?? $this->buildDocumentDataFromQuote($quote, $rfq, $qd),
                'version' => 1,
            ];
        }

        return response()->json(['quotations' => $list]);
    }

    /**
     * 采购员/Admin 接受或拒绝报价
     * PATCH /api/supplier-quotations/{id}  body: { status: 'accepted'|'rejected' }
     * id 为前端列表的 id，如 bj-123（会去掉 bj- 前缀取数字）
     */
    public function update(Request $request, string $id)
    {
        if (!$this->canViewProcurementQuotations($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $numericId = preg_replace('/^bj-/', '', $id);
        if ($numericId === '' || !ctype_digit($numericId)) {
            return response()->json(['message' => 'Invalid quotation id'], 400);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:accepted,rejected'],
        ]);

        /** @var SupplierRfqQuote|null $quote */
        $quote = SupplierRfqQuote::query()->with('supplierRfq')->find((int) $numericId);
        if (!$quote || !$quote->supplierRfq) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        $quote->procurement_status = $validated['status'];
        $quote->save();

        // When accepted: write purchaser_feedback to the linked PurchaseRequirement so 业务员 sees cost/suggestions
        if ($validated['status'] === 'accepted') {
            $this->syncAcceptedQuoteToPurchaseRequirement($quote, $quote->supplierRfq, $request);
        }

        return response()->json([
            'message' => $validated['status'] === 'accepted' ? '报价已接受' : '报价已拒绝',
            'quotation' => array_merge($this->quoteToDto($quote, $quote->supplierRfq), ['status' => $quote->procurement_status]),
        ]);
    }

    /**
     * After accepting a supplier quote, update the linked QR's purchaser_feedback
     * so the salesperson (业务员) sees cost price and suggestions in 成本询报/报价管理.
     */
    private function syncAcceptedQuoteToPurchaseRequirement(SupplierRfqQuote $quote, SupplierRfq $rfq, Request $request): void
    {
        $requirementNo = $rfq->requirement_no;
        if (!$requirementNo) {
            return;
        }

        $requirement = PurchaseRequirement::where('requirement_no', $requirementNo)->first();
        if (!$requirement) {
            return;
        }

        $qd = $quote->quote_data ?? [];
        $items = $qd['items'] ?? [];
        $currency = $quote->currency ?? 'CNY';
        $feedbackBy = $request->user() ? ($request->user()->name ?? $request->user()->email ?? '采购') : '采购';

        $products = [];
        foreach ($items as $idx => $item) {
            $qty = (int) ($item['quantity'] ?? 0);
            $unitPrice = (float) ($item['unitPrice'] ?? 0);
            $amount = $qty * $unitPrice;
            $leadTime = isset($item['leadTime']) ? (int) $item['leadTime'] : $quote->lead_time;
            $products[] = [
                'productId' => (string) ($item['id'] ?? 'item-' . ($idx + 1)),
                'productName' => (string) ($item['productName'] ?? ''),
                'specification' => (string) ($item['specification'] ?? ($item['modelNo'] ?? '')),
                'quantity' => $qty,
                'unit' => (string) ($item['unit'] ?? 'PCS'),
                'costPrice' => $unitPrice,
                'currency' => (string) ($item['currency'] ?? $currency),
                'amount' => $amount,
                'moq' => (int) ($item['moq'] ?? $quote->moq ?? 0),
                'leadTime' => $leadTime > 0 ? $leadTime . '天' : '30天',
                'remarks' => (string) ($item['remarks'] ?? ''),
            ];
        }

        $quotedFeedback = [
            'status' => 'quoted',
            'feedbackDate' => now()->format('Y-m-d'),
            'feedbackBy' => $feedbackBy,
            'linkedBJ' => $quote->quotation_no,
            'linkedSupplier' => $quote->supplier_name,
            'linkedXJ' => $rfq->supplier_rfq_no,
            'products' => $products,
            'paymentTerms' => $quote->payment_terms ?? '',
            'deliveryTerms' => $qd['deliveryTerms'] ?? '',
            'purchaserRemarks' => $quote->remarks ?? $qd['supplierRemarks'] ?? $qd['generalRemarks'] ?? '',
        ];

        $existing = is_array($requirement->purchaser_feedback) ? $requirement->purchaser_feedback : [];
        $merged = array_merge($existing, $quotedFeedback);
        $requirement->purchaser_feedback = $merged;
        $requirement->status = 'completed';
        $requirement->save();
    }

    private function buildDocumentDataFromQuote(SupplierRfqQuote $quote, SupplierRfq $rfq, array $qd): array
    {
        $items = $qd['items'] ?? [];
        return [
            'quotationNo' => $quote->quotation_no,
            'quotationDate' => $quote->quoted_date ? $quote->quoted_date->format('Y-m-d') : null,
            'validUntil' => $quote->quoted_date ? \Carbon\Carbon::parse($quote->quoted_date)->addDays(30)->format('Y-m-d') : null,
            'rfqReference' => $rfq->supplier_rfq_no,
            'supplier' => [
                'companyName' => $quote->supplier_name,
                'email' => $rfq->supplier_email ?? '',
                'contactPerson' => $quote->supplier_name,
                'supplierCode' => $quote->supplier_code,
            ],
            'buyer' => [
                'name' => '福建高盛达富建材有限公司',
                'contactPerson' => 'COSUN采购',
                'email' => 'purchase@cosun.com',
            ],
            'products' => array_map(function ($item, $i) {
                return [
                    'no' => $i + 1,
                    'description' => $item['productName'] ?? '',
                    'modelNo' => $item['modelNo'] ?? '',
                    'specification' => $item['specification'] ?? '',
                    'quantity' => (int) ($item['quantity'] ?? 0),
                    'unit' => $item['unit'] ?? 'PCS',
                    'unitPrice' => (float) ($item['unitPrice'] ?? 0),
                    'currency' => $item['currency'] ?? 'CNY',
                ];
            }, $items, array_keys($items)),
            'terms' => [
                'paymentTerms' => $quote->payment_terms ?? '',
                'deliveryTerms' => $qd['deliveryTerms'] ?? '',
                'moq' => (int) $quote->moq,
            ],
        ];
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $email = (string) ($user->email ?? '');
        if ($email === '') {
            return response()->json(['message' => 'User email required'], 400);
        }

        $validated = $request->validate([
            'id' => ['nullable', 'string', 'max:128'],
            'quotationNo' => ['required', 'string', 'max:128'],
            'sourceRFQId' => ['required', 'string', 'max:128'],
            'sourceXJ' => ['nullable', 'string', 'max:128'],
            'sourceQR' => ['nullable', 'string', 'max:128'],
            'supplierCode' => ['required', 'string', 'max:64'],
            'supplierName' => ['required', 'string', 'max:255'],
            'supplierEmail' => ['required', 'string', 'email', 'max:255'],
            'currency' => ['required', 'string', 'max:8'],
            'totalAmount' => ['required', 'numeric', 'min:0'],
            'paymentTerms' => ['required', 'string', 'max:512'],
            'deliveryTerms' => ['nullable', 'string', 'max:512'],
            'generalRemarks' => ['nullable', 'string'],
            'supplierRemarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'string', 'max:128'],
            'items.*.productName' => ['required', 'string', 'max:255'],
            'items.*.modelNo' => ['nullable', 'string', 'max:128'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit' => ['required', 'string', 'max:32'],
            'items.*.unitPrice' => ['required', 'numeric', 'min:0'],
            'items.*.leadTime' => ['nullable', 'integer', 'min:0'],
            'items.*.moq' => ['nullable', 'integer', 'min:0'],
            'documentData' => ['nullable', 'array'],
        ]);

        if ($validated['supplierEmail'] !== $email) {
            return response()->json(['message' => 'Suppliers may only submit quotations for their own account'], 403);
        }

        $rfqUid = $validated['sourceRFQId'];
        /** @var SupplierRfq|null $rfq */
        $rfq = SupplierRfq::query()
            ->where('rfq_uid', $rfqUid)
            ->where('supplier_email', $email)
            ->with('products')
            ->first();

        if (!$rfq) {
            return response()->json(['message' => 'RFQ not found or not assigned to this supplier'], 404);
        }

        $firstItem = $validated['items'][0];
        $leadTime = (int) ($firstItem['leadTime'] ?? 30);
        $moq = (int) ($firstItem['moq'] ?? 1000);

        $quotationNo = $validated['quotationNo'];
        $existingQuote = SupplierRfqQuote::query()
            ->where('supplier_rfq_id', $rfq->id)
            ->where('quotation_no', $quotationNo)
            ->first();

        if ($existingQuote) {
            return response()->json([
                'message' => 'This quotation has already been submitted',
                'quotation' => $this->quoteToDto($existingQuote, $rfq),
            ], 200);
        }

        $quoteData = [
            'quotationNo' => $validated['quotationNo'],
            'sourceXJ' => $validated['sourceXJ'] ?? null,
            'sourceQR' => $validated['sourceQR'] ?? null,
            'items' => $validated['items'],
            'paymentTerms' => $validated['paymentTerms'],
            'deliveryTerms' => $validated['deliveryTerms'] ?? null,
            'generalRemarks' => $validated['generalRemarks'] ?? null,
            'supplierRemarks' => $validated['supplierRemarks'] ?? null,
            'documentData' => $validated['documentData'] ?? null,
        ];

        DB::transaction(function () use ($rfq, $validated, $quotationNo, $leadTime, $moq, $quoteData) {
            SupplierRfqQuote::query()->create([
                'supplier_rfq_id' => $rfq->id,
                'supplier_code' => $validated['supplierCode'],
                'supplier_name' => $validated['supplierName'],
                'quoted_date' => now()->format('Y-m-d'),
                'quoted_price' => (float) $validated['totalAmount'],
                'currency' => $validated['currency'],
                'lead_time' => $leadTime,
                'moq' => $moq,
                'validity_days' => 30,
                'payment_terms' => $validated['paymentTerms'],
                'remarks' => $validated['supplierRemarks'] ?? $validated['generalRemarks'] ?? null,
                'quotation_no' => $quotationNo,
                'quote_data' => $quoteData,
                'procurement_status' => 'submitted',
            ]);

            $rfq->supplier_quotation_no = $quotationNo;
            $rfq->status = 'quoted';
            $rfq->updated_date = now();
            $rfq->save();
        });

        $quote = SupplierRfqQuote::query()
            ->where('supplier_rfq_id', $rfq->id)
            ->where('quotation_no', $quotationNo)
            ->first();

        return response()->json([
            'message' => 'Quotation submitted successfully',
            'quotation' => $this->quoteToDto($quote, $rfq->fresh()),
        ], 201);
    }

    private function quoteToDto(SupplierRfqQuote $quote, SupplierRfq $rfq): array
    {
        return [
            'id' => (string) $quote->id,
            'quotationNo' => $quote->quotation_no,
            'rfqUid' => $rfq->rfq_uid,
            'supplierRfqNo' => $rfq->supplier_rfq_no,
            'requirementNo' => $rfq->requirement_no,
            'supplierCode' => $quote->supplier_code,
            'supplierName' => $quote->supplier_name,
            'quotedDate' => $quote->quoted_date ? $quote->quoted_date->format('Y-m-d') : null,
            'quotedPrice' => (float) $quote->quoted_price,
            'currency' => $quote->currency,
            'leadTime' => (int) $quote->lead_time,
            'moq' => (int) $quote->moq,
            'status' => (string) ($quote->procurement_status ?? 'submitted'),
            'quoteData' => $quote->quote_data,
        ];
    }
}
