<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierXj;
use App\Models\SupplierXjProduct;
use App\Models\SupplierXjQuote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupplierXjController extends Controller
{
    private function canManageProcurementRfqs(Request $request): bool
    {
        $user = $request->user();
        if (!$user) return false;

        $portalRole = (string) ($user->portal_role ?? '');
        if ($portalRole === 'admin') return true;

        $rbacRole = (string) ($user->rbac_role ?? '');
        return in_array($rbacRole, ['Procurement', 'Admin', 'CEO', 'CFO', 'Finance'], true);
    }

    private function toXjDto(SupplierXj $xj): array
    {
        $sentDate = null;
        if ($rfq->updated_date) {
            // Use updated_date as "sent date" when status transitions to pending
            $sentDate = $rfq->updated_date->format('Y-m-d');
        }

        return [
            'id' => $xj->xj_uid,
            'xjNumber' => $rfq->xj_number,
            'supplierXjNo' => $rfq->supplier_xj_no,
            'supplierQuotationNo' => $rfq->supplier_quotation_no,
            'requirementNo' => $rfq->requirement_no,
            'sourceInquiryId' => $rfq->source_inquiry_id,
            'sourceInquiryNumber' => $rfq->source_inquiry_number,
            'customerName' => $rfq->customer_name,
            'customerRegion' => $rfq->customer_region,
            'supplierCode' => $rfq->supplier_code,
            'supplierName' => $rfq->supplier_name,
            'supplierContact' => $rfq->supplier_contact,
            'supplierEmail' => $rfq->supplier_email,
            'expectedDate' => $rfq->expected_date ? (string) $rfq->expected_date : null,
            'quotationDeadline' => $rfq->quotation_deadline ? (string) $rfq->quotation_deadline : null,
            'status' => $rfq->status,
            'remarks' => $rfq->remarks,
            'createdBy' => $rfq->created_by,
            'createdDate' => $rfq->created_date ? (string) $rfq->created_date : null,
            'updatedDate' => $rfq->updated_date ? $rfq->updated_date->toIso8601String() : null,
            'sentDate' => $sentDate,
            'products' => $rfq->products->map(fn ($p) => [
                'id' => $p->product_uid,
                'productName' => $p->product_name,
                'modelNo' => $p->model_no,
                'specification' => $p->specification,
                'quantity' => (int) $p->quantity,
                'unit' => $p->unit,
                'targetPrice' => $p->target_price ? (float) $p->target_price : null,
                'currency' => $p->currency,
            ])->values(),
            'documentData' => $rfq->document_data,
        ];
    }

    /**
     * Create supplier RFQ (XJ) from procurement portal.
     * POST /api/supplier-rfqs
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'id' => ['nullable', 'string', 'max:128'],
            'xjNumber' => ['required', 'string', 'max:128'],
            'supplierXjNo' => ['nullable', 'string', 'max:128'],
            'supplierQuotationNo' => ['nullable', 'string', 'max:128'],
            'requirementNo' => ['nullable', 'string', 'max:128'],
            'sourceInquiryId' => ['nullable', 'string', 'max:128'],
            'sourceInquiryNumber' => ['nullable', 'string', 'max:128'],
            'customerName' => ['nullable', 'string', 'max:255'],
            'customerRegion' => ['nullable', 'string', 'max:64'],

            'supplierCode' => ['required', 'string', 'max:64'],
            'supplierName' => ['required', 'string', 'max:255'],
            'supplierContact' => ['nullable', 'string', 'max:128'],
            'supplierEmail' => ['required', 'string', 'max:255'],

            'expectedDate' => ['required', 'date'],
            'quotationDeadline' => ['nullable', 'date'],
            'status' => ['required', 'string', 'max:32'],
            'remarks' => ['nullable', 'string'],

            'products' => ['required', 'array', 'min:1'],
            'products.*.id' => ['required', 'string', 'max:128'],
            'products.*.productName' => ['required', 'string', 'max:255'],
            'products.*.modelNo' => ['nullable', 'string', 'max:128'],
            'products.*.specification' => ['nullable', 'string', 'max:512'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
            'products.*.unit' => ['required', 'string', 'max:32'],
            'products.*.targetPrice' => ['nullable', 'numeric', 'min:0'],
            'products.*.currency' => ['required', 'string', 'max:8'],

            'documentData' => ['nullable'],
        ]);

        // Use provided app id if present; otherwise generate a UUID-like string.
        $xjUid = $validated['id'] ?? Str::uuid()->toString();

        $rfq = DB::transaction(function () use ($validated, $xjUid, $user) {
            /** @var SupplierXj $created */
            $created = SupplierXj::query()->create([
                'xj_uid' => $xjUid,
                'xj_number' => $validated['xjNumber'],
                'supplier_xj_no' => $validated['supplierXjNo'] ?? null,
                'supplier_quotation_no' => $validated['supplierQuotationNo'] ?? null,
                'requirement_no' => $validated['requirementNo'] ?? null,
                'source_inquiry_id' => $validated['sourceInquiryId'] ?? null,
                'source_inquiry_number' => $validated['sourceInquiryNumber'] ?? null,
                'customer_name' => $validated['customerName'] ?? null,
                'customer_region' => $validated['customerRegion'] ?? null,
                'supplier_code' => $validated['supplierCode'],
                'supplier_name' => $validated['supplierName'],
                'supplier_contact' => $validated['supplierContact'] ?? null,
                'supplier_email' => $validated['supplierEmail'],
                'expected_date' => $validated['expectedDate'],
                'quotation_deadline' => $validated['quotationDeadline'] ?? null,
                'status' => $validated['status'],
                'remarks' => $validated['remarks'] ?? null,
                'created_by' => (string) $user->email,
                'created_date' => now()->format('Y-m-d'),
                'updated_date' => now(),
                'document_data' => $validated['documentData'] ?? null,
            ]);

            $rows = [];
            foreach ($validated['products'] as $p) {
                $rows[] = [
                    'supplier_xj_id' => $created->id,
                    'product_uid' => $p['id'],
                    'product_name' => $p['productName'],
                    'model_no' => isset($p['modelNo']) && trim((string) $p['modelNo']) !== '' ? $p['modelNo'] : '-',
                    'specification' => $p['specification'] ?? null,
                    'quantity' => (int) $p['quantity'],
                    'unit' => $p['unit'],
                    'target_price' => $p['targetPrice'] ?? null,
                    'currency' => $p['currency'],
                ];
            }
            SupplierRfqProduct::query()->insert($rows);

            return $created->fresh(['products']);
        });

        return response()->json(['xj' => $this->toXjDto($rfq)], 201);
    }

    /**
     * Supplier: list RFQs assigned to current supplier (submitted only).
     * GET /api/supplier-rfqs/mine
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $email = (string) ($user->email ?? '');
        if ($email === '') {
            return response()->json(['xjs' => []]);
        }

        $rfqs = SupplierXj::query()
            ->with('products')
            ->where('supplier_email', $email)
            ->where('status', '!=', 'draft')
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        return response()->json([
            'xjs' => $rfqs->map(fn (SupplierXj $r) => $this->toXjDto($r))->values(),
        ]);
    }

    /**
     * Procurement/Admin: update RFQ status / metadata (e.g. submit to supplier).
     * PATCH /api/supplier-rfqs/{rfqUid}
     */
    public function update(Request $request, string $xjUid)
    {
        if (!$this->canManageProcurementRfqs($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        /** @var SupplierRfq|null $rfq */
        $rfq = SupplierXj::query()->where('xj_uid', $xjUid)->with('products')->first();
        if (!$rfq) {
            return response()->json(['message' => 'XJ not found'], 404);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:32'], // draft/pending/quoted/accepted/rejected/expired...
            'remarks' => ['nullable', 'string'],
            'quotationDeadline' => ['nullable', 'date'],
            'expectedDate' => ['nullable', 'date'],
            'documentData' => ['nullable'],
        ]);

        $patch = [];
        if (array_key_exists('status', $validated) && $validated['status'] !== null) $patch['status'] = $validated['status'];
        if (array_key_exists('remarks', $validated)) $patch['remarks'] = $validated['remarks'];
        if (array_key_exists('quotationDeadline', $validated)) $patch['quotation_deadline'] = $validated['quotationDeadline'];
        if (array_key_exists('expectedDate', $validated)) $patch['expected_date'] = $validated['expectedDate'];
        if (array_key_exists('documentData', $validated)) $patch['document_data'] = $validated['documentData'];

        if ($patch) {
            $patch['updated_date'] = now();
            $rfq->fill($patch);
            $rfq->save();
        }

        return response()->json(['xj' => $this->toXjDto($rfq->fresh(['products']))]);
    }

    /**
     * Supplier: clear all own RFQ business test data from backend.
     * DELETE /api/supplier-rfqs/mine
     */
    public function clearMine(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $email = (string) ($user->email ?? '');
        if ($email === '') {
            return response()->json(['message' => 'User email required'], 400);
        }

        $rfqIds = SupplierXj::query()
            ->where('supplier_email', $email)
            ->pluck('id')
            ->values();

        if ($rfqIds->isEmpty()) {
            return response()->json([
                'message' => 'No supplier XJ data to clear',
                'cleared' => [
                    'xjs' => 0,
                    'products' => 0,
                    'quotes' => 0,
                ],
            ]);
        }

        $result = DB::transaction(function () use ($rfqIds) {
            $quotesCount = SupplierRfqQuote::query()
                ->whereIn('supplier_xj_id', $rfqIds->all())
                ->count();
            $productsCount = SupplierRfqProduct::query()
                ->whereIn('supplier_xj_id', $rfqIds->all())
                ->count();
            $rfqCount = SupplierXj::query()
                ->whereIn('id', $rfqIds->all())
                ->count();

            SupplierRfqQuote::query()
                ->whereIn('supplier_xj_id', $rfqIds->all())
                ->delete();
            SupplierRfqProduct::query()
                ->whereIn('supplier_xj_id', $rfqIds->all())
                ->delete();
            SupplierXj::query()
                ->whereIn('id', $rfqIds->all())
                ->delete();

            return [
                'xjs' => $rfqCount,
                'products' => $productsCount,
                'quotes' => $quotesCount,
            ];
        });

        return response()->json([
            'message' => 'Supplier RFQ test data cleared',
            'cleared' => $result,
        ]);
    }
}
