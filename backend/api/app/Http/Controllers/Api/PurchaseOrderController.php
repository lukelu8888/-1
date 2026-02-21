<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequirement;
use App\Models\PurchaseRequirementItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = PurchaseRequirement::with('items')
            ->where(function ($q) {
                $q->where('source', '采购请求')
                    ->orWhere('source_ref', 'like', 'CG-%');
            });

        $staffRoles = [
            'admin',
            'Sales_Rep',
            'Regional_Manager',
            'Sales_Director',
            'Procurement_Manager',
            'Procurement_Specialist',
            'Finance_Manager',
            'Finance_Specialist',
            'finance',
        ];
        $isStaff = in_array((string) ($user->portal_role ?? ''), $staffRoles, true);
        if (!$isStaff) {
            $query->where('created_by', (string) $user->email);
        }

        $rows = $query->orderByDesc('id')->limit(1000)->get();

        return response()->json([
            'purchaseOrders' => $rows->map(fn (PurchaseRequirement $r) => $this->toPurchaseOrderDto($r))->values(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'id' => ['nullable', 'string', 'max:128'],
            'poNumber' => ['required', 'string', 'max:128'],
            'requirementNo' => ['nullable', 'string', 'max:128'],
            'sourceRef' => ['nullable', 'string', 'max:128'],
            'sourceSONumber' => ['nullable', 'string', 'max:128'],
            'supplierName' => ['nullable', 'string', 'max:255'],
            'supplierCode' => ['nullable', 'string', 'max:64'],
            'supplierContact' => ['nullable', 'string', 'max:128'],
            'supplierPhone' => ['nullable', 'string', 'max:64'],
            'supplierAddress' => ['nullable', 'string', 'max:512'],
            'region' => ['nullable', 'string', 'max:64'],
            'items' => ['nullable', 'array'],
            'items.*.productName' => ['required_with:items', 'string', 'max:255'],
            'items.*.modelNo' => ['nullable', 'string', 'max:255'],
            'items.*.specification' => ['nullable', 'string', 'max:512'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit' => ['required_with:items', 'string', 'max:32'],
            'items.*.unitPrice' => ['nullable', 'numeric', 'min:0'],
            'items.*.currency' => ['nullable', 'string', 'max:8'],
            'items.*.hsCode' => ['nullable', 'string', 'max:64'],
            'items.*.packingRequirement' => ['nullable', 'string', 'max:255'],
            'items.*.remarks' => ['nullable', 'string'],
            'totalAmount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'paymentTerms' => ['nullable', 'string', 'max:512'],
            'deliveryTerms' => ['nullable', 'string', 'max:512'],
            'orderDate' => ['nullable', 'date'],
            'expectedDate' => ['nullable', 'date'],
            'actualDate' => ['nullable', 'date'],
            'status' => ['nullable', 'in:pending,confirmed,producing,shipped,completed,cancelled'],
            'paymentStatus' => ['nullable', 'in:unpaid,partial,paid'],
            'remarks' => ['nullable', 'string'],
            'createdBy' => ['nullable', 'string', 'max:255'],
            'createdDate' => ['nullable', 'date'],
            'rfqId' => ['nullable', 'string', 'max:128'],
            'rfqNumber' => ['nullable', 'string', 'max:128'],
            'orderGroup' => ['nullable', 'string', 'max:128'],
            'isPartOfGroup' => ['nullable', 'boolean'],
            'groupTotalOrders' => ['nullable', 'integer', 'min:0'],
            'groupNote' => ['nullable', 'string', 'max:255'],
            'selectedQuote' => ['nullable', 'array'],
        ]);

        // 幂等：同一 PO 号存在则返回
        $poNumber = (string) $validated['poNumber'];
        $existing = PurchaseRequirement::with('items')->where('source_ref', $poNumber)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Purchase order already exists',
                'purchaseOrder' => $this->toPurchaseOrderDto($existing),
            ], 200);
        }

        DB::beginTransaction();
        try {
            $regionCode = $this->normalizeRegionCode((string) ($validated['region'] ?? 'NA'));
            $dateStr = now()->format('ymd');
            $requirementNo = (string) ($validated['requirementNo'] ?? '');
            if ($requirementNo === '') {
                $requirementNo = "QR-{$regionCode}-{$dateStr}-" . $this->nextQrSeq($regionCode, $dateStr);
            }

            $items = is_array($validated['items'] ?? null) ? $validated['items'] : [];
            $calcTotal = 0.0;
            foreach ($items as $it) {
                $calcTotal += (float) (($it['unitPrice'] ?? 0) * ($it['quantity'] ?? 0));
            }
            $totalAmount = isset($validated['totalAmount']) ? (float) $validated['totalAmount'] : $calcTotal;

            $poMeta = [
                'poNumber' => $poNumber,
                'status' => (string) ($validated['status'] ?? 'pending'),
                'paymentStatus' => (string) ($validated['paymentStatus'] ?? 'unpaid'),
                'supplierName' => (string) ($validated['supplierName'] ?? '待选择供应商'),
                'supplierCode' => (string) ($validated['supplierCode'] ?? 'TBD'),
                'supplierContact' => $validated['supplierContact'] ?? null,
                'supplierPhone' => $validated['supplierPhone'] ?? null,
                'supplierAddress' => $validated['supplierAddress'] ?? null,
                'totalAmount' => $totalAmount,
                'currency' => (string) ($validated['currency'] ?? 'USD'),
                'paymentTerms' => (string) ($validated['paymentTerms'] ?? '待确认'),
                'deliveryTerms' => (string) ($validated['deliveryTerms'] ?? '待确认'),
                'orderDate' => (string) ($validated['orderDate'] ?? now()->format('Y-m-d')),
                'expectedDate' => (string) ($validated['expectedDate'] ?? now()->addDays(45)->format('Y-m-d')),
                'actualDate' => $validated['actualDate'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
                'createdBy' => (string) ($validated['createdBy'] ?? $user->email),
                'createdDate' => (string) ($validated['createdDate'] ?? now()->format('Y-m-d')),
                'updatedDate' => now()->toIso8601String(),
                'rfqId' => $validated['rfqId'] ?? null,
                'rfqNumber' => $validated['rfqNumber'] ?? null,
                'sourceSONumber' => $validated['sourceSONumber'] ?? null,
                'orderGroup' => $validated['orderGroup'] ?? null,
                'isPartOfGroup' => $validated['isPartOfGroup'] ?? null,
                'groupTotalOrders' => $validated['groupTotalOrders'] ?? null,
                'groupNote' => $validated['groupNote'] ?? null,
                'selectedQuote' => $validated['selectedQuote'] ?? null,
            ];

            $req = PurchaseRequirement::create([
                'requirement_uid' => (string) ($validated['id'] ?? Str::uuid()->toString()),
                'requirement_no' => $requirementNo,
                'source' => '采购请求',
                'source_ref' => (string) ($validated['sourceRef'] ?? $poNumber),
                'source_inquiry_number' => (string) (($validated['rfqNumber'] ?? null) ?: ($validated['sourceSONumber'] ?? $poNumber)),
                'required_date' => (string) ($validated['expectedDate'] ?? now()->addDays(45)->format('Y-m-d')),
                'urgency' => 'medium',
                'status' => 'pending',
                'created_by' => (string) ($validated['createdBy'] ?? $user->email),
                'created_date' => (string) ($validated['createdDate'] ?? now()->format('Y-m-d')),
                'special_requirements' => (string) ($validated['remarks'] ?? ''),
                'region' => $this->normalizeRegionName((string) ($validated['region'] ?? 'NA')),
                'sales_order_no' => (string) ($validated['sourceSONumber'] ?? ''),
                'customer_snapshot' => [
                    'companyName' => null,
                    'contactPerson' => null,
                    'email' => null,
                    'phone' => null,
                    'mobile' => null,
                    'address' => null,
                    'website' => null,
                    'businessType' => null,
                ],
                'purchaser_feedback' => ['po_meta' => $poMeta],
            ]);

            foreach ($items as $item) {
                PurchaseRequirementItem::create([
                    'purchase_requirement_id' => $req->id,
                    'item_uid' => (string) ($item['id'] ?? Str::uuid()->toString()),
                    'product_name' => (string) $item['productName'],
                    'model_no' => trim((string) ($item['modelNo'] ?? '')) !== '' ? (string) $item['modelNo'] : '-',
                    'specification' => $item['specification'] ?? null,
                    'quantity' => (int) $item['quantity'],
                    'unit' => (string) $item['unit'],
                    'hs_code' => $item['hsCode'] ?? null,
                    'packing_requirement' => $item['packingRequirement'] ?? null,
                    'target_price' => $item['unitPrice'] ?? 0,
                    'target_currency' => (string) ($item['currency'] ?? ($validated['currency'] ?? 'USD')),
                    'image_url' => null,
                    'remarks' => $item['remarks'] ?? null,
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Purchase order created',
                'purchaseOrder' => $this->toPurchaseOrderDto($req->fresh('items')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Create purchase order failed: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $poRef)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'in:pending,confirmed,producing,shipped,completed,cancelled'],
            'paymentStatus' => ['nullable', 'in:unpaid,partial,paid'],
            'supplierName' => ['nullable', 'string', 'max:255'],
            'supplierCode' => ['nullable', 'string', 'max:64'],
            'supplierContact' => ['nullable', 'string', 'max:128'],
            'supplierPhone' => ['nullable', 'string', 'max:64'],
            'supplierAddress' => ['nullable', 'string', 'max:512'],
            'totalAmount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:8'],
            'paymentTerms' => ['nullable', 'string', 'max:512'],
            'deliveryTerms' => ['nullable', 'string', 'max:512'],
            'orderDate' => ['nullable', 'date'],
            'expectedDate' => ['nullable', 'date'],
            'actualDate' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
            'rfqId' => ['nullable', 'string', 'max:128'],
            'rfqNumber' => ['nullable', 'string', 'max:128'],
            'sourceSONumber' => ['nullable', 'string', 'max:128'],
            'orderGroup' => ['nullable', 'string', 'max:128'],
            'isPartOfGroup' => ['nullable', 'boolean'],
            'groupTotalOrders' => ['nullable', 'integer', 'min:0'],
            'groupNote' => ['nullable', 'string', 'max:255'],
            'selectedQuote' => ['nullable', 'array'],
        ]);

        $req = PurchaseRequirement::with('items')
            ->where('requirement_uid', $poRef)
            ->orWhere('source_ref', $poRef)
            ->orWhere('requirement_no', $poRef)
            ->first();

        if (!$req) {
            return response()->json(['message' => 'Purchase order not found'], 404);
        }

        $feedback = is_array($req->purchaser_feedback) ? $req->purchaser_feedback : [];
        $meta = isset($feedback['po_meta']) && is_array($feedback['po_meta']) ? $feedback['po_meta'] : [];
        foreach ($validated as $k => $v) {
            $meta[$k] = $v;
        }
        $meta['updatedDate'] = now()->toIso8601String();
        $feedback['po_meta'] = $meta;

        $req->purchaser_feedback = $feedback;
        if (array_key_exists('expectedDate', $validated)) {
            $req->required_date = $validated['expectedDate'];
        }
        if (array_key_exists('remarks', $validated)) {
            $req->special_requirements = (string) ($validated['remarks'] ?? '');
        }
        if (array_key_exists('sourceSONumber', $validated)) {
            $req->sales_order_no = (string) ($validated['sourceSONumber'] ?? '');
        }
        $req->save();

        return response()->json([
            'message' => 'Purchase order updated',
            'purchaseOrder' => $this->toPurchaseOrderDto($req->fresh('items')),
        ]);
    }

    public function destroy(Request $request, string $poRef)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $req = PurchaseRequirement::query()
            ->where('requirement_uid', $poRef)
            ->orWhere('source_ref', $poRef)
            ->orWhere('requirement_no', $poRef)
            ->first();

        if (!$req) {
            return response()->json(['message' => 'Purchase order not found'], 404);
        }

        DB::transaction(function () use ($req) {
            PurchaseRequirementItem::where('purchase_requirement_id', $req->id)->delete();
            $req->delete();
        });

        return response()->json(['message' => 'Purchase order deleted']);
    }

    private function toPurchaseOrderDto(PurchaseRequirement $r): array
    {
        $feedback = is_array($r->purchaser_feedback) ? $r->purchaser_feedback : [];
        $meta = isset($feedback['po_meta']) && is_array($feedback['po_meta']) ? $feedback['po_meta'] : [];
        $items = $r->relationLoaded('items') ? $r->items : $r->items()->get();

        $itemDtos = $items->map(function (PurchaseRequirementItem $it) {
            $unitPrice = (float) ($it->target_price ?? 0);
            $qty = (int) ($it->quantity ?? 0);
            return [
                'id' => (string) ($it->item_uid ?? $it->id),
                'productName' => $it->product_name,
                'modelNo' => $it->model_no ?: '-',
                'specification' => $it->specification,
                'quantity' => $qty,
                'unit' => $it->unit ?: 'PCS',
                'unitPrice' => $unitPrice,
                'currency' => $it->target_currency ?: 'USD',
                'subtotal' => $unitPrice * $qty,
                'hsCode' => $it->hs_code,
                'packingRequirement' => $it->packing_requirement,
                'remarks' => $it->remarks,
            ];
        })->values()->all();

        $sumAmount = 0.0;
        foreach ($itemDtos as $it) {
            $sumAmount += (float) ($it['subtotal'] ?? 0);
        }

        return [
            'id' => (string) ($r->requirement_uid ?? $r->id),
            'poNumber' => (string) ($meta['poNumber'] ?? $r->source_ref ?? $r->requirement_no),
            'requirementNo' => (string) $r->requirement_no,
            'sourceRef' => (string) ($r->source_ref ?? ''),
            'sourceSONumber' => (string) ($meta['sourceSONumber'] ?? $r->sales_order_no ?? ''),
            'orderGroup' => $meta['orderGroup'] ?? null,
            'isPartOfGroup' => $meta['isPartOfGroup'] ?? null,
            'groupTotalOrders' => $meta['groupTotalOrders'] ?? null,
            'groupNote' => $meta['groupNote'] ?? null,
            'rfqId' => $meta['rfqId'] ?? null,
            'rfqNumber' => $meta['rfqNumber'] ?? null,
            'selectedQuote' => $meta['selectedQuote'] ?? null,
            'supplierName' => (string) ($meta['supplierName'] ?? '待选择供应商'),
            'supplierCode' => (string) ($meta['supplierCode'] ?? 'TBD'),
            'supplierContact' => $meta['supplierContact'] ?? null,
            'supplierPhone' => $meta['supplierPhone'] ?? null,
            'supplierAddress' => $meta['supplierAddress'] ?? null,
            'region' => $this->normalizeRegionCode((string) ($r->region ?? 'NA')),
            'items' => $itemDtos,
            'totalAmount' => isset($meta['totalAmount']) ? (float) $meta['totalAmount'] : $sumAmount,
            'currency' => (string) ($meta['currency'] ?? (($itemDtos[0]['currency'] ?? null) ?: 'USD')),
            'paymentTerms' => (string) ($meta['paymentTerms'] ?? '待确认'),
            'deliveryTerms' => (string) ($meta['deliveryTerms'] ?? '待确认'),
            'orderDate' => (string) ($meta['orderDate'] ?? ($r->created_date ? $r->created_date->format('Y-m-d') : now()->format('Y-m-d'))),
            'expectedDate' => (string) ($meta['expectedDate'] ?? ($r->required_date ? $r->required_date->format('Y-m-d') : now()->addDays(45)->format('Y-m-d'))),
            'actualDate' => $meta['actualDate'] ?? null,
            'status' => (string) ($meta['status'] ?? 'pending'),
            'paymentStatus' => (string) ($meta['paymentStatus'] ?? 'unpaid'),
            'remarks' => (string) ($meta['remarks'] ?? ($r->special_requirements ?? '')),
            'createdBy' => (string) ($meta['createdBy'] ?? $r->created_by ?? 'system'),
            'createdDate' => (string) ($meta['createdDate'] ?? ($r->created_date ? $r->created_date->format('Y-m-d') : now()->format('Y-m-d'))),
            'updatedDate' => $meta['updatedDate'] ?? null,
        ];
    }

    private function normalizeRegionCode(string $region): string
    {
        $r = strtoupper(trim($region));
        return match ($r) {
            'SA', 'SOUTH AMERICA' => 'SA',
            'EA', 'EMEA', 'EU', 'EUROPE & AFRICA' => 'EA',
            default => 'NA',
        };
    }

    private function normalizeRegionName(string $region): string
    {
        $code = $this->normalizeRegionCode($region);
        return match ($code) {
            'SA' => 'South America',
            'EA' => 'Europe & Africa',
            default => 'North America',
        };
    }

    private function nextQrSeq(string $regionCode, string $dateStr): string
    {
        $prefix = "QR-{$regionCode}-{$dateStr}-";
        $last = PurchaseRequirement::where('requirement_no', 'like', $prefix . '%')
            ->orderBy('requirement_no', 'desc')
            ->value('requirement_no');
        if (!$last) return '0001';
        $lastSeq = (int) substr((string) $last, -4);
        return str_pad((string) ($lastSeq + 1), 4, '0', STR_PAD_LEFT);
    }
}

