<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\InquiryItem;
use App\Models\WorkflowState;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InquiryController extends Controller
{
    private function isAdmin(Request $request): bool
    {
        $role = (string) ($request->user()?->portal_role ?? '');
        return $role === 'admin';
    }

    private function canManageAdminInquiries(Request $request): bool
    {
        $user = $request->user();
        if (!$user) return false;

        $portalRole = (string) ($user->portal_role ?? '');
        if ($portalRole === 'admin') return true;

        // Some deployments rely on rbac_role for internal permissions (e.g. Finance/CFO/CEO)
        $rbacRole = (string) ($user->rbac_role ?? '');
        return in_array($rbacRole, ['Finance', 'CFO', 'CEO'], true);
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

    private function coerceTimestampMs($value): int
    {
        if (is_int($value)) {
            return $value;
        }
        if (is_numeric($value) && (string) (int) $value === (string) $value) {
            return (int) $value;
        }
        if (is_string($value)) {
            $ts = strtotime($value);
            if ($ts !== false) {
                return (int) ($ts * 1000);
            }
        }
        return (int) floor(microtime(true) * 1000);
    }

    private function toInquiryDto(Inquiry $inquiry): array
    {
        return [
            'id' => $inquiry->inquiry_uid,
            'inquiryNumber' => $inquiry->inquiry_number,
            'date' => (string) $inquiry->inquiry_date,
            'userEmail' => $inquiry->customer_email,
            'companyId' => $inquiry->company_id,
            'region' => $inquiry->region,
            'status' => $inquiry->status,
            'isSubmitted' => (bool) $inquiry->is_submitted,
            'totalPrice' => (float) $inquiry->total_price,
            'message' => $inquiry->message,
            'createdAt' => (int) $inquiry->created_at_ms,
            'submittedAt' => (int) ($inquiry->submitted_at_ms ?? $inquiry->created_at_ms),
            'buyerInfo' => [
                'companyName' => $inquiry->buyer_company_name,
                'contactPerson' => $inquiry->buyer_contact_person,
                'email' => $inquiry->buyer_email,
                'phone' => $inquiry->buyer_phone,
                'mobile' => $inquiry->buyer_mobile,
                'address' => $inquiry->buyer_address,
                'website' => $inquiry->buyer_website,
                'businessType' => $inquiry->buyer_business_type,
            ],
            'shippingInfo' => [
                'cartons' => $inquiry->shipping_cartons,
                'cbm' => $inquiry->shipping_cbm,
                'totalGrossWeight' => $inquiry->shipping_total_gross_weight,
                'totalNetWeight' => $inquiry->shipping_total_net_weight,
            ],
            'containerInfo' => [
                'planningMode' => $inquiry->container_planning_mode,
                'recommendedContainer' => $inquiry->container_custom['recommendedContainer'] ?? null,
                'customContainers' => $inquiry->container_custom['customContainers'] ?? null,
            ],
            // Return products in the cart-like shape so UI can reuse existing components
            'products' => $inquiry->items->map(fn ($it) => [
                'productName' => $it->product_name,
                'sku' => $it->sku,
                'modelNo' => $it->model_no,
                'specification' => $it->specs,
                'quantity' => (int) $it->quantity,
                'unitPrice' => $it->target_price,
                'image' => $it->image_url,
                'remarks' => $it->remarks,
            ])->values(),
        ];
    }

    /**
     * Cart submit action (RFQ/Inquiry) - mirrors frontend `InquiryPreviewDialogNew.handleSubmit`.
     *
     * IMPORTANT: Must be authenticated (per product requirement).
     */
    public function store(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            // core
            'id' => ['required', 'string', 'max:128'], // RFQ-NA-YYMMDD-XXXX
            'date' => ['required', 'string', 'max:32'], // YYYY-MM-DD
            'userEmail' => ['nullable', 'string', 'max:255'], // legacy client field, ignored when logged in
            'status' => ['required', 'string', 'max:32'],
            'totalPrice' => ['required', 'numeric', 'min:0'],
            'createdAt' => ['required', 'integer'],

            // optional
            'inquiryNumber' => ['nullable', 'string', 'max:128'],
            'companyId' => ['nullable', 'string', 'max:64'],
            'region' => ['nullable', 'string', 'max:64'],
            'message' => ['nullable', 'string'],

            // buyerInfo
            'buyerInfo' => ['nullable', 'array'],
            'buyerInfo.companyName' => ['nullable', 'string', 'max:255'],
            'buyerInfo.contactPerson' => ['nullable', 'string', 'max:128'],
            'buyerInfo.email' => ['nullable', 'string', 'max:255'],
            'buyerInfo.phone' => ['nullable', 'string', 'max:64'],
            'buyerInfo.mobile' => ['nullable', 'string', 'max:64'],
            'buyerInfo.address' => ['nullable', 'string', 'max:512'],
            'buyerInfo.website' => ['nullable', 'string', 'max:255'],
            'buyerInfo.businessType' => ['nullable', 'string', 'max:64'],

            // shippingInfo
            'shippingInfo' => ['required', 'array'],
            'shippingInfo.cartons' => ['required', 'string', 'max:64'],
            'shippingInfo.cbm' => ['required', 'string', 'max:64'],
            'shippingInfo.totalGrossWeight' => ['required', 'string', 'max:64'],
            'shippingInfo.totalNetWeight' => ['required', 'string', 'max:64'],

            // containerInfo
            'containerInfo' => ['nullable', 'array'],
            'containerInfo.planningMode' => ['nullable', 'string', 'max:32'],
            'containerInfo.recommendedContainer' => ['nullable'],
            'containerInfo.customContainers' => ['nullable'],

            // products (CartItem[])
            'products' => ['required', 'array', 'min:1'],
            'products.*.productName' => ['nullable', 'string', 'max:255'],
            'products.*.name' => ['nullable', 'string', 'max:255'],
            'products.*.sku' => ['nullable', 'string', 'max:128'],
            'products.*.modelNo' => ['nullable', 'string', 'max:128'],
            'products.*.specification' => ['nullable', 'string', 'max:512'],
            'products.*.specifications' => ['nullable', 'string', 'max:512'],
            'products.*.color' => ['nullable', 'string', 'max:128'],
            'products.*.material' => ['nullable', 'string', 'max:128'],
            'products.*.unitPrice' => ['nullable', 'numeric', 'min:0'],
            'products.*.price' => ['nullable', 'numeric', 'min:0'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
            'products.*.image' => ['nullable', 'string', 'max:1024'],
            'products.*.remarks' => ['nullable', 'string', 'max:512'],
        ]);

        // Auth is required; trust auth email.
        $email = (string) $request->user()->email;
        $companyId = $request->user()->org_id ?? $request->user()->user_code ?? null;

        $buyer = (array) ($validated['buyerInfo'] ?? []);
        $shipping = (array) ($validated['shippingInfo'] ?? []);
        $container = (array) ($validated['containerInfo'] ?? []);
        $normalizedRegion = $this->normalizeRegion($validated['region'] ?? null);

        $inquiry = DB::transaction(function () use ($validated, $email, $companyId, $buyer, $shipping, $container, $normalizedRegion) {
            /** @var Inquiry $inq */
            $inq = Inquiry::query()->create([
                'inquiry_uid' => $validated['id'],
                'inquiry_number' => $validated['inquiryNumber'] ?? null,
                'inquiry_date' => $validated['date'],
                'customer_email' => $email,
                'company_id' => $validated['companyId'] ?? $companyId,
                'region' => $normalizedRegion,
                'status' => $validated['status'],
                'is_submitted' => 1, // cart submit = submitted
                'total_price' => $validated['totalPrice'],
                'message' => $validated['message'] ?? null,
                'created_at_ms' => $validated['createdAt'],
                'submitted_at_ms' => (int) $validated['createdAt'],

                // buyer snapshot
                'buyer_company_name' => $buyer['companyName'] ?? null,
                'buyer_contact_person' => $buyer['contactPerson'] ?? null,
                'buyer_email' => $buyer['email'] ?? $email,
                'buyer_phone' => $buyer['phone'] ?? null,
                'buyer_mobile' => $buyer['mobile'] ?? null,
                'buyer_address' => $buyer['address'] ?? null,
                'buyer_website' => $buyer['website'] ?? null,
                'buyer_business_type' => $buyer['businessType'] ?? null,

                // shipping
                'shipping_cartons' => $shipping['cartons'] ?? null,
                'shipping_cbm' => $shipping['cbm'] ?? null,
                'shipping_total_gross_weight' => $shipping['totalGrossWeight'] ?? null,
                'shipping_total_net_weight' => $shipping['totalNetWeight'] ?? null,

                // container
                'container_planning_mode' => $container['planningMode'] ?? null,
                'container_recommended' => is_scalar($container['recommendedContainer'] ?? null)
                    ? (string) $container['recommendedContainer']
                    : null,
                'container_custom' => [
                    'recommendedContainer' => $container['recommendedContainer'] ?? null,
                    'customContainers' => $container['customContainers'] ?? null,
                ],
            ]);

            $items = [];
            foreach ($validated['products'] as $p) {
                $name = (string) (($p['productName'] ?? null) ?: ($p['name'] ?? ''));
                $spec = (string) (($p['specification'] ?? null) ?: ($p['specifications'] ?? ''));
                $color = (string) ($p['color'] ?? '');
                $material = (string) ($p['material'] ?? '');

                $specs = trim($spec . ($color !== '' ? ' | Color: ' . $color : '') . ($material !== '' ? ' | Material: ' . $material : ''));

                $items[] = [
                    'inquiry_id' => $inq->id,
                    'product_name' => $name !== '' ? $name : 'Unknown',
                    'sku' => $p['sku'] ?? null,
                    'model_no' => $p['modelNo'] ?? null,
                    'specs' => $specs !== '' ? $specs : null,
                    'quantity' => (int) $p['quantity'],
                    'unit' => 'pcs',
                    'target_price' => $p['unitPrice'] ?? ($p['price'] ?? null),
                    'currency' => null,
                    'image_url' => $p['image'] ?? null,
                    'remarks' => $p['remarks'] ?? null,
                ];
            }
            InquiryItem::query()->insert($items);

            // Create initial workflow state record (frontend workflowEngineV2 mirror)
            WorkflowState::query()->updateOrCreate(
                ['inquiry_number' => $inq->inquiry_uid],
                [
                    'current_stage_id' => 'customer_inquiry',
                    'current_step_id' => 'customer_inquiry',
                    'completed_steps' => [],
                    'status_history' => [],
                    'last_updated_ms' => (int) $validated['createdAt'],
                    'context' => [
                        'inquiry_number' => $inq->inquiry_uid,
                        'customer_email' => $email,
                        'total_amount' => (float) $validated['totalPrice'],
                    ],
                ]
            );

            return $inq->fresh(['items']);
        });

        // Return the same shape used by InquiryContext (so frontend can store/render directly)
        return response()->json([
            'inquiry' => $this->toInquiryDto($inquiry),
        ], 201);
    }

    /**
     * Get inquiries for current user (token required).
     */
    public function index(Request $request)
    {
        $email = (string) ($request->user()?->email ?? '');
        if ($email === '') {
            return response()->json(['inquiries' => []]);
        }

        $companyId = $request->user()?->org_id ?? $request->user()?->user_code ?? null;

        $inquiries = Inquiry::query()
            ->where(function ($q) use ($email, $companyId) {
                $q->where('customer_email', $email);
                if ($companyId) {
                    $q->orWhere('company_id', $companyId);
                }
            })
            ->orderByDesc('id')
            ->with('items')
            ->limit(200)
            ->get();

        return response()->json([
            'inquiries' => $inquiries->map(fn (Inquiry $inquiry) => $this->toInquiryDto($inquiry))->values(),
        ]);
    }

    /**
     * Admin/Finance: create inquiry on behalf of customer.
     *
     * Accepts both:
     * - Full RFQ payload (similar to POST /api/inquiries)
     * - Simplified payload from CreateInquiryDialog (customerName/customerEmail/region/products...)
     */
    public function adminStore(Request $request)
    {
        if (!$this->canManageAdminInquiries($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            // identifiers
            'id' => ['nullable', 'string', 'max:128'],
            'inquiryNumber' => ['nullable', 'string', 'max:128'],
            'companyId' => ['nullable', 'string', 'max:64'],

            // dates / status
            'date' => ['nullable', 'string', 'max:32'],       // YYYY-MM-DD
            'inquiryDate' => ['nullable', 'string', 'max:32'],// YYYY-MM-DD
            'status' => ['nullable', 'string', 'max:32'],
            'totalPrice' => ['nullable', 'numeric', 'min:0'],
            'createdAt' => ['nullable'],

            // customer ownership (who this inquiry belongs to)
            'userEmail' => ['nullable', 'string', 'max:255'],
            'customerEmail' => ['nullable', 'string', 'max:255'],

            // simplified fields
            'customerName' => ['nullable', 'string', 'max:255'],
            'customerPhone' => ['nullable', 'string', 'max:64'],
            'region' => ['required', 'string', 'max:64'],
            'message' => ['nullable', 'string'],

            // structured info (optional)
            'buyerInfo' => ['nullable', 'array'],
            'buyerInfo.companyName' => ['nullable', 'string', 'max:255'],
            'buyerInfo.contactPerson' => ['nullable', 'string', 'max:128'],
            'buyerInfo.email' => ['nullable', 'string', 'max:255'],
            'buyerInfo.phone' => ['nullable', 'string', 'max:64'],
            'buyerInfo.mobile' => ['nullable', 'string', 'max:64'],
            'buyerInfo.address' => ['nullable', 'string', 'max:512'],
            'buyerInfo.website' => ['nullable', 'string', 'max:255'],
            'buyerInfo.businessType' => ['nullable', 'string', 'max:64'],

            'shippingInfo' => ['nullable', 'array'],
            'shippingInfo.cartons' => ['nullable', 'string', 'max:64'],
            'shippingInfo.cbm' => ['nullable', 'string', 'max:64'],
            'shippingInfo.totalGrossWeight' => ['nullable', 'string', 'max:64'],
            'shippingInfo.totalNetWeight' => ['nullable', 'string', 'max:64'],

            'containerInfo' => ['nullable', 'array'],
            'containerInfo.planningMode' => ['nullable', 'string', 'max:32'],
            'containerInfo.recommendedContainer' => ['nullable'],
            'containerInfo.customContainers' => ['nullable'],

            // products (supports multiple shapes)
            'products' => ['required', 'array', 'min:1'],
            'products.*.productName' => ['nullable', 'string', 'max:255'],
            'products.*.name' => ['nullable', 'string', 'max:255'],
            'products.*.sku' => ['nullable', 'string', 'max:128'],
            'products.*.modelNo' => ['nullable', 'string', 'max:128'],
            'products.*.specification' => ['nullable', 'string', 'max:512'],
            'products.*.specifications' => ['nullable', 'string', 'max:512'],
            'products.*.specs' => ['nullable', 'string', 'max:512'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
            'products.*.unit' => ['nullable', 'string', 'max:32'],
            'products.*.unitPrice' => ['nullable', 'numeric', 'min:0'],
            'products.*.price' => ['nullable', 'numeric', 'min:0'],
            'products.*.image' => ['nullable', 'string', 'max:1024'],
            'products.*.imageUrl' => ['nullable', 'string', 'max:1024'],
            'products.*.remarks' => ['nullable', 'string', 'max:512'],
        ]);

        $createdAtMs = $this->coerceTimestampMs($validated['createdAt'] ?? null);
        $inquiryDate = (string) (($validated['date'] ?? null) ?: ($validated['inquiryDate'] ?? null) ?: date('Y-m-d'));
        $normalizedRegion = $this->normalizeRegion($validated['region'] ?? null);

        // Which customer does this inquiry belong to?
        $ownerEmail = (string) (($validated['customerEmail'] ?? null) ?: ($validated['userEmail'] ?? null) ?: ($request->user()?->email ?? ''));
        if ($ownerEmail === '') {
            return response()->json(['message' => 'customerEmail is required.'], 422);
        }

        $buyer = (array) ($validated['buyerInfo'] ?? []);
        $shipping = (array) ($validated['shippingInfo'] ?? []);
        $container = (array) ($validated['containerInfo'] ?? []);

        $uid = (string) (($validated['id'] ?? null) ?: ($validated['inquiryNumber'] ?? null) ?: ('INQ-' . date('ymdHis') . '-' . random_int(1000, 9999)));

        $inquiry = DB::transaction(function () use ($validated, $uid, $ownerEmail, $createdAtMs, $inquiryDate, $normalizedRegion, $buyer, $shipping, $container) {
            /** @var Inquiry $inq */
            $inq = Inquiry::query()->create([
                'inquiry_uid' => $uid,
                'inquiry_number' => $validated['inquiryNumber'] ?? null,
                'inquiry_date' => $inquiryDate,
                'customer_email' => $ownerEmail,
                'company_id' => $validated['companyId'] ?? null,
                'region' => $normalizedRegion,
                'status' => $validated['status'] ?? 'pending',
                'is_submitted' => 1, // admin created = submitted to workflow
                'total_price' => $validated['totalPrice'] ?? 0,
                'message' => $validated['message'] ?? null,
                'created_at_ms' => $createdAtMs,
                'submitted_at_ms' => $createdAtMs,

                // buyer snapshot (fallback to simplified fields)
                'buyer_company_name' => $buyer['companyName'] ?? ($validated['customerName'] ?? null),
                'buyer_contact_person' => $buyer['contactPerson'] ?? null,
                'buyer_email' => $buyer['email'] ?? $ownerEmail,
                'buyer_phone' => $buyer['phone'] ?? ($validated['customerPhone'] ?? null),
                'buyer_mobile' => $buyer['mobile'] ?? null,
                'buyer_address' => $buyer['address'] ?? null,
                'buyer_website' => $buyer['website'] ?? null,
                'buyer_business_type' => $buyer['businessType'] ?? null,

                // shipping
                'shipping_cartons' => $shipping['cartons'] ?? null,
                'shipping_cbm' => $shipping['cbm'] ?? null,
                'shipping_total_gross_weight' => $shipping['totalGrossWeight'] ?? null,
                'shipping_total_net_weight' => $shipping['totalNetWeight'] ?? null,

                // container
                'container_planning_mode' => $container['planningMode'] ?? null,
                'container_recommended' => is_scalar($container['recommendedContainer'] ?? null)
                    ? (string) $container['recommendedContainer']
                    : null,
                'container_custom' => [
                    'recommendedContainer' => $container['recommendedContainer'] ?? null,
                    'customContainers' => $container['customContainers'] ?? null,
                ],
            ]);

            $items = [];
            foreach ($validated['products'] as $p) {
                $name = (string) (($p['productName'] ?? null) ?: ($p['name'] ?? ''));
                $spec = (string) (($p['specification'] ?? null) ?: ($p['specs'] ?? null) ?: ($p['specifications'] ?? ''));
                $items[] = [
                    'inquiry_id' => $inq->id,
                    'product_name' => $name !== '' ? $name : 'Unknown',
                    'sku' => $p['sku'] ?? null,
                    'model_no' => $p['modelNo'] ?? null,
                    'specs' => $spec !== '' ? $spec : null,
                    'quantity' => (int) ($p['quantity'] ?? 0),
                    'unit' => $p['unit'] ?? 'pcs',
                    'target_price' => $p['unitPrice'] ?? ($p['price'] ?? null),
                    'currency' => null,
                    'image_url' => $p['imageUrl'] ?? ($p['image'] ?? null),
                    'remarks' => $p['remarks'] ?? null,
                ];
            }
            InquiryItem::query()->insert($items);

            WorkflowState::query()->updateOrCreate(
                ['inquiry_number' => $inq->inquiry_uid],
                [
                    'current_stage_id' => 'customer_inquiry',
                    'current_step_id' => 'customer_inquiry',
                    'completed_steps' => [],
                    'status_history' => [],
                    'last_updated_ms' => $createdAtMs,
                    'context' => [
                        'inquiry_number' => $inq->inquiry_uid,
                        'customer_email' => $ownerEmail,
                        'total_amount' => (float) ($validated['totalPrice'] ?? 0),
                    ],
                ]
            );

            return $inq->fresh(['items']);
        });

        return response()->json(['inquiry' => $this->toInquiryDto($inquiry)], 201);
    }

    /**
     * Admin: list all inquiries from database.
     */
    public function adminIndex(Request $request)
    {
        if (!$this->canManageAdminInquiries($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $q = Inquiry::query()->with('items')->orderByDesc('id');

        if ($request->filled('status') && is_string($request->query('status'))) {
            $q->where('status', (string) $request->query('status'));
        }
        if ($request->filled('region') && is_string($request->query('region'))) {
            $q->where('region', $this->normalizeRegion((string) $request->query('region')));
        }

        $inquiries = $q->limit(500)->get();

        return response()->json([
            'inquiries' => $inquiries->map(fn (Inquiry $inquiry) => $this->toInquiryDto($inquiry))->values(),
        ]);
    }

    /**
     * Admin: update inquiry basic fields (status/message).
     */
    public function adminUpdate(Request $request, string $inquiryUid)
    {
        if (!$this->canManageAdminInquiries($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:32'],
            'message' => ['nullable', 'string'],
        ]);

        /** @var Inquiry $inquiry */
        $inquiry = Inquiry::query()->where('inquiry_uid', $inquiryUid)->with('items')->firstOrFail();

        $patch = [];
        if (array_key_exists('status', $validated) && $validated['status'] !== null) $patch['status'] = $validated['status'];
        if (array_key_exists('message', $validated)) $patch['message'] = $validated['message'];

        if ($patch) {
            $inquiry->fill($patch);
            $inquiry->save();
        }

        return response()->json(['inquiry' => $this->toInquiryDto($inquiry->fresh(['items']))]);
    }

    /**
     * Admin: delete inquiry from database.
     */
    public function adminDestroy(Request $request, string $inquiryUid)
    {
        if (!$this->canManageAdminInquiries($request)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        /** @var Inquiry $inquiry */
        $inquiry = Inquiry::query()->where('inquiry_uid', $inquiryUid)->firstOrFail();

        DB::transaction(function () use ($inquiry) {
            WorkflowState::query()->where('inquiry_number', $inquiry->inquiry_uid)->delete();
            $inquiry->delete(); // inquiry_items cascades
        });

        return response()->json(['message' => 'Deleted.']);
    }
}

