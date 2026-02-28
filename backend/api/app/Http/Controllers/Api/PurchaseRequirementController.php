<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequirement;
use App\Models\PurchaseRequirementItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PurchaseRequirementController extends Controller
{
    private const PURCHASER_FEEDBACK_REQUEST_KEY = 'request';

    /**
     * Create a new purchase requirement from an inquiry
     * POST /api/purchase-requirements
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'source' => 'nullable|string|max:64',
            'source_inquiry_number' => 'required|string',
            'source_ref' => 'nullable|string|max:128',
            'sales_order_no' => 'nullable|string|max:128',
            'region' => 'nullable|string',
            'required_date' => 'nullable|date',
            'urgency' => 'nullable|in:high,medium,low',
            'special_requirements' => 'nullable|string',
            'customer' => 'required|array',
            'customer.companyName' => 'required|string',
            'customer.contactPerson' => 'nullable|string',
            'customer.email' => 'required|email',
            'customer.phone' => 'nullable|string',
            'customer.mobile' => 'nullable|string',
            'customer.address' => 'nullable|string',
            'customer.website' => 'nullable|string',
            'customer.businessType' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.productName' => 'required|string',
            // DB schema requires model_no NOT NULL; fallback to '-' if empty
            'items.*.modelNo' => 'nullable|string',
            'items.*.specification' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit' => 'required|string',
            'items.*.targetPrice' => 'nullable|numeric',
            'items.*.targetCurrency' => 'nullable|string',
            'items.*.hsCode' => 'nullable|string',
            'items.*.imageUrl' => 'nullable|string',
            'items.*.remarks' => 'nullable|string',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Generate requirement number (QR-{REGION}-{DATE}-{SEQ})
        // Use Asia/Shanghai timezone so the date matches the user's local date (CST = UTC+8)
        $region = $validated['region'] ?? 'NA';
        $regionCode = $this->normalizeRegionCode($region);
        $dateStr = now()->setTimezone('Asia/Shanghai')->format('ymd');
        $seq = $this->getNextSequenceNumber($regionCode, $dateStr);
        $requirementNo = "QR-{$regionCode}-{$dateStr}-{$seq}";

        DB::beginTransaction();
        try {
            $requirement = PurchaseRequirement::create([
                'requirement_uid' => Str::uuid()->toString(),
                'requirement_no' => $requirementNo,
                'source' => $validated['source'] ?? '销售订单',
                'source_ref' => $validated['source_ref'] ?? null,
                'source_inquiry_number' => $validated['source_inquiry_number'],
                'required_date' => $validated['required_date'] ?? now()->addDays(30)->format('Y-m-d'),
                'urgency' => $validated['urgency'] ?? 'medium',
                'status' => 'pending',
                'created_by' => $user->email,
                // DB schema is DATE
                'created_date' => now()->format('Y-m-d'),
                'special_requirements' => $validated['special_requirements'] ?? null,
                'region' => $this->normalizeRegion($region),
                'sales_order_no' => $validated['sales_order_no'] ?? null,

                // DB schema uses JSON snapshot
                'customer_snapshot' => [
                    'companyName' => $validated['customer']['companyName'],
                    'contactPerson' => $validated['customer']['contactPerson'] ?? null,
                    'email' => $validated['customer']['email'],
                    'phone' => $validated['customer']['phone'] ?? null,
                    'mobile' => $validated['customer']['mobile'] ?? null,
                    'address' => $validated['customer']['address'] ?? null,
                    'website' => $validated['customer']['website'] ?? null,
                    'businessType' => $validated['customer']['businessType'] ?? null,
                ],
            ]);

            // Create items
            foreach ($validated['items'] as $itemData) {
                PurchaseRequirementItem::create([
                    'purchase_requirement_id' => $requirement->id,
                    'item_uid' => Str::uuid()->toString(),
                    'product_name' => $itemData['productName'],
                    'model_no' => isset($itemData['modelNo']) && trim((string) $itemData['modelNo']) !== ''
                        ? $itemData['modelNo']
                        : '-',
                    'specification' => $itemData['specification'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit' => $itemData['unit'],
                    'target_price' => $itemData['targetPrice'] ?? null,
                    'target_currency' => $itemData['targetCurrency'] ?? 'USD',
                    'hs_code' => $itemData['hsCode'] ?? null,
                    'image_url' => $itemData['imageUrl'] ?? null,
                    'remarks' => $itemData['remarks'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json($this->toRequirementDto($requirement->fresh('items')), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create purchase requirement: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update purchase requirement status (submit to procurement)
     * PATCH /api/purchase-requirements/{requirementUid}
     * Supports: requirement_uid (UUID), requirement_no (QR-xxx), or local id (qr_xxx)
     */
    public function update(Request $request, string $requirementUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Try multiple lookup strategies
        $requirement = PurchaseRequirement::where('requirement_uid', $requirementUid)->first();
        
        if (!$requirement) {
            // Try by requirement_no (QR-xxx format)
            $requirement = PurchaseRequirement::where('requirement_no', $requirementUid)->first();
        }
        
        if (!$requirement) {
            // For local-only data (qr_xxx format), return a helpful message
            if (str_starts_with($requirementUid, 'qr_')) {
                return response()->json([
                    'message' => 'This purchase requirement was created locally and not yet synced to the server. Please re-create it by clicking "下推成本询报" again.',
                    'code' => 'LOCAL_ONLY_DATA'
                ], 404);
            }
            return response()->json(['message' => 'Purchase requirement not found'], 404);
        }

        // NOTE: Frontend submits many fields on "提交采购部".
        // DB schema does NOT have dedicated columns for them, so we persist them into purchaser_feedback JSON under `request`.
        $validated = $request->validate([
            'status' => 'nullable|in:pending,partial,processing,completed',
            'expected_quote_date' => 'nullable|date',
            'delivery_date' => 'nullable|date',
            'payment_terms' => 'nullable|string',
            'trade_terms' => 'nullable|string',
            'target_cost_range' => 'nullable|string',
            'quality_requirements' => 'nullable|string',
            'packaging_requirements' => 'nullable|string',
            'remarks' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.remarks' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $updateData = [];

            if (isset($validated['status'])) {
                $updateData['status'] = $validated['status'];
            }

            // Persist "submit to procurement" fields into purchaser_feedback.request
            $requestPayload = [];
            $hasRequestPayload = false;
            foreach ([
                'expected_quote_date',
                'delivery_date',
                'payment_terms',
                'trade_terms',
                'target_cost_range',
                'quality_requirements',
                'packaging_requirements',
                'remarks',
            ] as $key) {
                if (array_key_exists($key, $validated)) {
                    $requestPayload[$key] = $validated[$key];
                    $hasRequestPayload = true;
                }
            }
            if ($hasRequestPayload || (isset($validated['status']) && $validated['status'] === 'partial')) {
                $existing = is_array($requirement->purchaser_feedback) ? $requirement->purchaser_feedback : [];
                $existingRequest = isset($existing[self::PURCHASER_FEEDBACK_REQUEST_KEY]) && is_array($existing[self::PURCHASER_FEEDBACK_REQUEST_KEY])
                    ? $existing[self::PURCHASER_FEEDBACK_REQUEST_KEY]
                    : [];
                $mergedRequest = array_merge($existingRequest, $requestPayload);
                $mergedRequest['submitted_at'] = $mergedRequest['submitted_at'] ?? now()->toIso8601String();
                $mergedRequest['submitted_by'] = $mergedRequest['submitted_by'] ?? $user->email;
                $existing[self::PURCHASER_FEEDBACK_REQUEST_KEY] = $mergedRequest;
                $updateData['purchaser_feedback'] = $existing;
            }

            $requirement->update($updateData);

            // Update items if provided
            if (isset($validated['items']) && is_array($validated['items'])) {
                foreach ($validated['items'] as $itemData) {
                    if (isset($itemData['id'])) {
                        $id = $itemData['id'];
                        // Preferred: item_uid (string). Also support numeric auto-increment id for compatibility.
                        $itemQuery = PurchaseRequirementItem::where('purchase_requirement_id', $requirement->id);
                        if (is_int($id) || (is_string($id) && ctype_digit($id))) {
                            $itemQuery->where('id', (int) $id);
                        } elseif (is_string($id)) {
                            $itemQuery->where('item_uid', $id);
                        } else {
                            // Unrecognized id format; skip safely
                            continue;
                        }
                        $item = $itemQuery->first();
                        if ($item) {
                            if (isset($itemData['quantity'])) {
                                $item->quantity = $itemData['quantity'];
                            }
                            if (isset($itemData['remarks'])) {
                                $item->remarks = $itemData['remarks'];
                            }
                            $item->save();
                        }
                    }
                }
            }

            DB::commit();

            return response()->json($this->toRequirementDto($requirement->fresh('items')));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update purchase requirement: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get purchase requirements
     * GET /api/purchase-requirements
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = PurchaseRequirement::with('items');

        // Staff roles can view all purchase requirements; customers only see their own created records.
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
            $query->where('created_by', $user->email);
        }

        // Optional filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('region')) {
            $query->where('region', $this->normalizeRegion($request->region));
        }

        $requirements = $query->orderBy('created_date', 'desc')->get();

        return response()->json([
            'requirements' => $requirements->map(fn($r) => $this->toRequirementDto($r))
        ]);
    }

    private function toRequirementDto(PurchaseRequirement $requirement): array
    {
        $customerSnapshot = is_array($requirement->customer_snapshot) ? $requirement->customer_snapshot : [];
        $purchaserFeedback = is_array($requirement->purchaser_feedback) ? $requirement->purchaser_feedback : [];
        $requestMeta = isset($purchaserFeedback[self::PURCHASER_FEEDBACK_REQUEST_KEY]) && is_array($purchaserFeedback[self::PURCHASER_FEEDBACK_REQUEST_KEY])
            ? $purchaserFeedback[self::PURCHASER_FEEDBACK_REQUEST_KEY]
            : [];

        return [
            'id' => $requirement->requirement_uid,
            'requirementNo' => $requirement->requirement_no,
            'source' => $requirement->source,
            'sourceRef' => $requirement->source_ref,
            'sourceInquiryNumber' => $requirement->source_inquiry_number,
            'requiredDate' => $requirement->required_date ? (string) $requirement->required_date : null,
            'urgency' => $requirement->urgency,
            'status' => $requirement->status,
            'createdBy' => $requirement->created_by,
            'createdDate' => $requirement->created_date ? $requirement->created_date->toIso8601String() : null,
            'specialRequirements' => $requirement->special_requirements,
            'region' => $requirement->region,
            'salesOrderNo' => $requirement->sales_order_no,
            'customer' => [
                'companyName' => $customerSnapshot['companyName'] ?? null,
                'contactPerson' => $customerSnapshot['contactPerson'] ?? null,
                'email' => $customerSnapshot['email'] ?? null,
                'phone' => $customerSnapshot['phone'] ?? null,
                'mobile' => $customerSnapshot['mobile'] ?? null,
                'address' => $customerSnapshot['address'] ?? null,
                'website' => $customerSnapshot['website'] ?? null,
                'businessType' => $customerSnapshot['businessType'] ?? null,
            ],
            'items' => $requirement->items->map(fn($item) => [
                'id' => (string) ($item->item_uid ?? $item->id),
                'productName' => $item->product_name,
                'modelNo' => $item->model_no,
                'specification' => $item->specification,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'targetPrice' => $item->target_price ? (float) $item->target_price : null,
                'targetCurrency' => $item->target_currency,
                'hsCode' => $item->hs_code,
                'imageUrl' => $item->image_url,
                'remarks' => $item->remarks,
            ])->toArray(),
            // Keep frontend contract: expose these fields from purchaser_feedback.request
            'submittedAt' => $requestMeta['submitted_at'] ?? null,
            'expectedQuoteDate' => $requestMeta['expected_quote_date'] ?? null,
            'deliveryDate' => $requestMeta['delivery_date'] ?? null,
            'paymentTerms' => $requestMeta['payment_terms'] ?? null,
            'tradeTerms' => $requestMeta['trade_terms'] ?? null,
            'targetCostRange' => $requestMeta['target_cost_range'] ?? null,
            'qualityRequirements' => $requestMeta['quality_requirements'] ?? null,
            'packagingRequirements' => $requestMeta['packaging_requirements'] ?? null,
            'remarks' => $requestMeta['remarks'] ?? null,

            // For list UI: expose raw purchaser feedback JSON
            'purchaserFeedback' => $purchaserFeedback,
            'pushedToQuotation' => $requirement->pushed_to_quotation ?? false,
            'pushedToQuotationDate' => $requirement->pushed_to_quotation_date ? $requirement->pushed_to_quotation_date->toIso8601String() : null,
            'pushedBy' => $requirement->pushed_by,
        ];
    }

    private function normalizeRegion(?string $region): ?string
    {
        if (!$region) return null;
        $r = trim($region);
        if ($r === '') return null;

        $map = [
            'NA' => 'North America',
            'North America' => 'North America',
            'north-america' => 'North America',
            'SA' => 'South America',
            'South America' => 'South America',
            'south-america' => 'South America',
            'EA' => 'Europe & Africa',
            'EMEA' => 'Europe & Africa',
            'Europe & Africa' => 'Europe & Africa',
            'europe-africa' => 'Europe & Africa',
        ];

        return $map[$r] ?? $r;
    }

    private function normalizeRegionCode(?string $region): string
    {
        $normalized = $this->normalizeRegion($region);
        $codeMap = [
            'North America' => 'NA',
            'South America' => 'SA',
            'Europe & Africa' => 'EA',
        ];
        return $codeMap[$normalized] ?? 'NA';
    }

    private function getNextSequenceNumber(string $regionCode, string $dateStr): string
    {
        $prefix = "QR-{$regionCode}-{$dateStr}-";
        $last = PurchaseRequirement::where('requirement_no', 'like', $prefix . '%')
            ->orderBy('requirement_no', 'desc')
            ->value('requirement_no');

        if (!$last) {
            return '0001';
        }

        $lastSeq = (int) substr($last, -4);
        return str_pad((string) ($lastSeq + 1), 4, '0', STR_PAD_LEFT);
    }
}
