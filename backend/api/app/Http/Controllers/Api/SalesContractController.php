<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequirement;
use App\Models\PurchaseRequirementItem;
use App\Models\SalesContract;
use App\Models\SalesContractProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * 销售合同（SC）接口
 *
 * GET    /api/sales-contracts                - 获取合同列表（业务员仅看自己的）
 * POST   /api/sales-contracts                - 创建合同（从QT下推）
 * PATCH  /api/sales-contracts/{contractUid}  - 更新合同（状态/备注等）
 * DELETE /api/sales-contracts/{contractUid}  - 删除合同
 */
class SalesContractController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = SalesContract::with('products');

        $asEmail = (string) ($request->query('asEmail') ?? '');

        // ✅ 支持 Admin token “切换角色”视角过滤（类似审批中心 asEmail）
        if (($user->portal_role ?? '') === 'admin' && $asEmail !== '') {
            $query->where('sales_person_email', $asEmail);
        } elseif (($user->portal_role ?? '') !== 'admin') {
            // 非 Admin：只看自己名下合同
            $query->where('sales_person_email', $user->email);
        }

        $contracts = $query->orderBy('created_at', 'desc')->limit(500)->get();

        return response()->json([
            'contracts' => $contracts->map(fn($sc) => $this->toDto($sc)),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'contractUid' => ['required', 'string', 'max:128'],
            'contractNumber' => ['required', 'string', 'max:128'],
            'quotationNumber' => ['required', 'string', 'max:128'],
            'inquiryNumber' => ['nullable', 'string', 'max:128'],
            'region' => ['required', 'string', 'max:16'],
            'customerName' => ['required', 'string', 'max:255'],
            'customerEmail' => ['required', 'string', 'email', 'max:255'],
            'customerCompany' => ['required', 'string', 'max:255'],
            // 前端现有实现允许这些字段为空字符串，所以这里放宽校验（落库时会存 ''）
            'customerAddress' => ['nullable', 'string', 'max:512'],
            'customerCountry' => ['nullable', 'string', 'max:128'],
            'contactPerson' => ['nullable', 'string', 'max:128'],
            'contactPhone' => ['nullable', 'string', 'max:64'],
            'supervisor' => ['nullable', 'string', 'max:255'],
            'products' => ['required', 'array', 'min:1'],
            'products.*.productId' => ['required', 'string', 'max:128'],
            'products.*.productName' => ['required', 'string', 'max:255'],
            'products.*.specification' => ['required', 'string', 'max:512'],
            'products.*.hsCode' => ['nullable', 'string', 'max:64'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
            'products.*.unit' => ['required', 'string', 'max:32'],
            'products.*.unitPrice' => ['required', 'numeric', 'min:0'],
            'products.*.amount' => ['required', 'numeric', 'min:0'],
            'products.*.deliveryTime' => ['nullable', 'string', 'max:255'],
            'totalAmount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:8'],
            'tradeTerms' => ['required', 'string', 'max:255'],
            'paymentTerms' => ['required', 'string', 'max:512'],
            'depositPercentage' => ['nullable', 'numeric', 'min:0'],
            'depositAmount' => ['nullable', 'numeric', 'min:0'],
            'balancePercentage' => ['nullable', 'numeric', 'min:0'],
            'balanceAmount' => ['nullable', 'numeric', 'min:0'],
            'deliveryTime' => ['required', 'string', 'max:255'],
            'portOfLoading' => ['required', 'string', 'max:255'],
            'portOfDestination' => ['nullable', 'string', 'max:255'],
            'packing' => ['required', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
            'approvalFlow' => ['nullable', 'array'],
            'approvalHistory' => ['nullable', 'array'],
        ]);

        // 幂等：contract_number 或 quotation_number 已存在则直接返回
        $existing = SalesContract::with('products')
            ->where('contract_number', $validated['contractNumber'])
            ->orWhere('quotation_number', $validated['quotationNumber'])
            ->first();
        if ($existing) {
            return response()->json([
                'message' => '合同已存在',
                'contract' => $this->toDto($existing),
            ], 200);
        }

        DB::beginTransaction();
        try {
            $sc = SalesContract::create([
                'contract_uid' => $validated['contractUid'],
                'contract_number' => $validated['contractNumber'],
                'quotation_number' => $validated['quotationNumber'],
                'inquiry_number' => $validated['inquiryNumber'] ?? null,
                'customer_name' => $validated['customerName'],
                'customer_email' => $validated['customerEmail'],
                'customer_company' => $validated['customerCompany'],
                'customer_address' => $validated['customerAddress'] ?? '',
                'customer_country' => $validated['customerCountry'] ?? '',
                'contact_person' => $validated['contactPerson'] ?? '',
                'contact_phone' => $validated['contactPhone'] ?? '',
                'sales_person_email' => $user->email,
                'sales_person_name' => $user->name ?? $user->email,
                'supervisor_email' => $validated['supervisor'] ?? null,
                'region' => $validated['region'],
                'total_amount' => (float) $validated['totalAmount'],
                'currency' => $validated['currency'],
                'trade_terms' => $validated['tradeTerms'],
                'payment_terms' => $validated['paymentTerms'],
                'deposit_percentage' => isset($validated['depositPercentage']) ? (float) $validated['depositPercentage'] : 30.0,
                'deposit_amount' => isset($validated['depositAmount']) ? (float) $validated['depositAmount'] : 0.0,
                'balance_percentage' => isset($validated['balancePercentage']) ? (float) $validated['balancePercentage'] : 70.0,
                'balance_amount' => isset($validated['balanceAmount']) ? (float) $validated['balanceAmount'] : 0.0,
                'delivery_time' => $validated['deliveryTime'],
                'port_of_loading' => $validated['portOfLoading'],
                'port_of_destination' => $validated['portOfDestination'] ?? '',
                'packing' => $validated['packing'],
                'status' => 'draft',
                'approval_flow' => $validated['approvalFlow'] ?? null,
                'approval_history' => $validated['approvalHistory'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
                'attachments' => $validated['attachments'] ?? null,
            ]);

            foreach ($validated['products'] as $p) {
                SalesContractProduct::create([
                    'sales_contract_id' => $sc->id,
                    'product_id' => $p['productId'],
                    'product_name' => $p['productName'],
                    'specification' => $p['specification'],
                    'hs_code' => $p['hsCode'] ?? null,
                    'quantity' => (int) $p['quantity'],
                    'unit' => $p['unit'],
                    'unit_price' => (float) $p['unitPrice'],
                    'amount' => (float) $p['amount'],
                    'delivery_time' => $p['deliveryTime'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => '销售合同创建成功',
                'contract' => $this->toDto($sc->fresh('products')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => '创建失败: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $contractUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesContract|null $sc */
        $sc = SalesContract::with('products')
            ->where('contract_uid', $contractUid)
            ->orWhere('contract_number', $contractUid)
            ->first();

        if (!$sc) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        // 非 admin：只能更新自己名下合同
        if (($user->portal_role ?? '') !== 'admin' && $sc->sales_person_email !== $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:64'],
            'remarks' => ['nullable', 'string'],
            'approvalFlow' => ['nullable', 'array'],
            'approvalHistory' => ['nullable', 'array'],
            'approvalNotes' => ['nullable', 'string'],
            'rejectionReason' => ['nullable', 'string'],
            'sentToCustomerAt' => ['nullable', 'date'],
            'customerConfirmedAt' => ['nullable', 'date'],
            'purchaseOrderNumbers' => ['nullable', 'array'],
            'depositProof' => ['nullable', 'array'],
            'depositConfirmedBy' => ['nullable', 'string', 'max:255'],
            'depositConfirmedAt' => ['nullable', 'date'],
            'depositConfirmNotes' => ['nullable', 'string'],
        ]);

        $map = [
            'status' => 'status',
            'remarks' => 'remarks',
            'approvalFlow' => 'approval_flow',
            'approvalHistory' => 'approval_history',
            'approvalNotes' => 'approval_notes',
            'rejectionReason' => 'rejection_reason',
            'sentToCustomerAt' => 'sent_to_customer_at',
            'customerConfirmedAt' => 'customer_confirmed_at',
            'purchaseOrderNumbers' => 'purchase_order_numbers',
            'depositProof' => 'deposit_proof',
            'depositConfirmedBy' => 'deposit_confirmed_by',
            'depositConfirmedAt' => 'deposit_confirmed_at',
            'depositConfirmNotes' => 'deposit_confirm_notes',
        ];

        foreach ($map as $k => $col) {
            if (array_key_exists($k, $validated)) {
                $sc->{$col} = $validated[$k];
            }
        }

        $sc->save();

        return response()->json([
            'message' => '更新成功',
            'contract' => $this->toDto($sc->fresh('products')),
        ]);
    }

    /**
     * PATCH /api/sales-contracts/{contractUid}/submit-approval
     *
     * 业务员提交合同审批（落库 status / approval_notes / submitted_at / approval_history）
     * body: { notes?: string }
     */
    public function submitApproval(Request $request, string $contractUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesContract|null $sc */
        $sc = SalesContract::with('products')
            ->where('contract_uid', $contractUid)
            ->orWhere('contract_number', $contractUid)
            ->first();

        if (!$sc) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        if (($user->portal_role ?? '') !== 'admin' && (string) $sc->sales_person_email !== (string) $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((string) $sc->status !== 'draft') {
            return response()->json(['message' => 'Only draft contract can be submitted for approval'], 400);
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        // 与 QT 一致：按金额决定是否需要总监审批（≥20000 两级）
        $amount = (float) ($sc->total_amount ?? 0);
        $requiresDirector = $amount >= 20000;
        $sc->approval_flow = [
            'requiresDirectorApproval' => $requiresDirector,
            'currentStep' => 'supervisor',
            'steps' => $requiresDirector ? ['supervisor', 'director'] : ['supervisor'],
        ];
        $sc->status = 'pending_supervisor';
        $sc->approval_notes = $validated['notes'] ?? $sc->approval_notes;
        $sc->submitted_at = now();

        $history = is_array($sc->approval_history) ? $sc->approval_history : [];
        $history[] = [
            'action' => 'submitted',
            'actor' => $user->email,
            'actorRole' => 'salesperson',
            'timestamp' => now()->toIso8601String(),
            'notes' => $validated['notes'] ?? null,
            'amount' => (float) $sc->total_amount,
        ];
        $sc->approval_history = $history;

        $sc->save();

        return response()->json([
            'message' => 'Submitted for approval',
            'contract' => $this->toDto($sc->fresh('products')),
        ]);
    }

    /**
     * PATCH /api/sales-contracts/{contractUid}/approve
     *
     * 主管/总监批准合同（落库 status / approval_history / approved_at）
     * body: { comment?: string, approverName?: string }（与 QT approve 一致）
     */
    public function approve(Request $request, string $contractUid)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        /** @var SalesContract|null $sc */
        $sc = SalesContract::with('products')
            ->where('contract_uid', $contractUid)
            ->orWhere('contract_number', $contractUid)
            ->first();

        if (!$sc) return response()->json(['message' => 'Contract not found'], 404);

        $validated = $request->validate([
            'comment' => ['nullable', 'string'],
            'approverName' => ['nullable', 'string', 'max:255'],
            'approverEmail' => ['nullable', 'string', 'email', 'max:255'],
        ]);

        $currentApprover = $this->getCurrentApproverEmail($sc);
        if (($user->portal_role ?? '') !== 'admin' && $currentApprover && (string) $user->email !== (string) $currentApprover) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!in_array((string) $sc->status, ['pending_supervisor', 'pending_director'], true)) {
            return response()->json(['message' => 'Contract is not pending approval'], 400);
        }

        // 切换角色时前端传 approverEmail，用其作为审批人身份，这样「我已批准」能正确显示
        $actorEmail = (string) ($user->email ?? '');
        if (($user->portal_role ?? '') === 'admin' && !empty($validated['approverEmail'] ?? '')) {
            $actorEmail = (string) $validated['approverEmail'];
        }

        $approverName = (string) (($validated['approverName'] ?? null) ?: ($user->name ?? $user->email ?? ''));

        $requiresDirector = $this->requiresDirectorApproval($sc);

        $history = is_array($sc->approval_history) ? $sc->approval_history : [];
        $history[] = [
            'action' => 'approved',
            'actor' => $actorEmail,
            'actorName' => $approverName,
            'actorRole' => (string) $this->getApproverRoleForStatus((string) $sc->status),
            'timestamp' => now()->toIso8601String(),
            'notes' => $validated['comment'] ?? null,
        ];
        $sc->approval_history = $history;

        if ((string) $sc->status === 'pending_supervisor' && $requiresDirector) {
            $sc->status = 'pending_director';
        } else {
            $sc->status = 'approved';
            $sc->approved_at = now();
        }

        $sc->save();

        return response()->json([
            'message' => 'Approved',
            'contract' => $this->toDto($sc->fresh('products')),
        ]);
    }

    /**
     * PATCH /api/sales-contracts/{contractUid}/reject
     *
     * 主管/总监驳回合同（落库 status / rejection_reason / approval_history）
     * body: { comment: string, approverName?: string }（与 QT reject 一致）
     */
    public function reject(Request $request, string $contractUid)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        /** @var SalesContract|null $sc */
        $sc = SalesContract::with('products')
            ->where('contract_uid', $contractUid)
            ->orWhere('contract_number', $contractUid)
            ->first();

        if (!$sc) return response()->json(['message' => 'Contract not found'], 404);

        $validated = $request->validate([
            'comment' => ['required', 'string'],
            'approverName' => ['nullable', 'string', 'max:255'],
            'approverEmail' => ['nullable', 'string', 'email', 'max:255'],
        ]);

        $currentApprover = $this->getCurrentApproverEmail($sc);
        if (($user->portal_role ?? '') !== 'admin' && $currentApprover && (string) $user->email !== (string) $currentApprover) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!in_array((string) $sc->status, ['pending_supervisor', 'pending_director'], true)) {
            return response()->json(['message' => 'Contract is not pending approval'], 400);
        }

        // 切换角色时前端传 approverEmail，用其作为审批人身份，这样「我已驳回」能正确显示
        $actorEmail = (string) ($user->email ?? '');
        if (($user->portal_role ?? '') === 'admin' && !empty($validated['approverEmail'] ?? '')) {
            $actorEmail = (string) $validated['approverEmail'];
        }

        $approverName = (string) (($validated['approverName'] ?? null) ?: ($user->name ?? $user->email ?? ''));

        $history = is_array($sc->approval_history) ? $sc->approval_history : [];
        $history[] = [
            'action' => 'rejected',
            'actor' => $actorEmail,
            'actorName' => $approverName,
            'actorRole' => (string) $this->getApproverRoleForStatus((string) $sc->status),
            'timestamp' => now()->toIso8601String(),
            'notes' => (string) $validated['comment'],
        ];
        $sc->approval_history = $history;
        $sc->status = 'rejected';
        $sc->rejection_reason = (string) $validated['comment'];
        $sc->save();

        return response()->json([
            'message' => 'Rejected',
            'contract' => $this->toDto($sc->fresh('products')),
        ]);
    }

    /**
     * PATCH /api/sales-contracts/{contractUid}/send-to-customer
     *
     * 合同审批通过后，业务员发送给客户（落库 status + sent_to_customer_at）
     */
    public function sendToCustomer(Request $request, string $contractUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesContract|null $sc */
        $sc = SalesContract::with('products')
            ->where('contract_uid', $contractUid)
            ->orWhere('contract_number', $contractUid)
            ->first();

        if (!$sc) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        if (($user->portal_role ?? '') !== 'admin' && (string) $sc->sales_person_email !== (string) $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((string) $sc->status !== 'approved') {
            return response()->json(['message' => 'Only approved contract can be sent to customer'], 400);
        }

        if ($sc->sent_to_customer_at !== null) {
            return response()->json([
                'message' => 'Already sent',
                'contract' => $this->toDto($sc->fresh('products')),
            ], 200);
        }

        $sc->status = 'sent_to_customer';
        $sc->sent_to_customer_at = now();
        $sc->save();

        return response()->json([
            'message' => 'Sent to customer',
            'contract' => $this->toDto($sc->fresh('products')),
        ], 200);
    }

    /**
     * POST /api/sales-contracts/{contractUid}/push-to-purchase
     *
     * 业务员下推采购：创建采购需求（QR）并回写合同采购状态。
     * 幂等规则：同一 source_ref(CG号) 已存在时直接返回既有记录。
     */
    public function pushToPurchase(Request $request, string $contractUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesContract|null $sc */
        $sc = SalesContract::with('products')
            ->where('contract_uid', $contractUid)
            ->orWhere('contract_number', $contractUid)
            ->first();

        if (!$sc) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        // 非 admin 仅允许操作自己名下合同
        if (($user->portal_role ?? '') !== 'admin' && (string) $sc->sales_person_email !== (string) $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'cgNumber' => ['nullable', 'string', 'max:128'],
            'sourceInquiryNumber' => ['nullable', 'string', 'max:128'],
            'urgency' => ['nullable', 'in:high,medium,low'],
            'specialRequirements' => ['nullable', 'string'],
            'customer' => ['nullable', 'array'],
            'customer.companyName' => ['nullable', 'string', 'max:255'],
            'customer.contactPerson' => ['nullable', 'string', 'max:128'],
            'customer.email' => ['nullable', 'string', 'email', 'max:255'],
            'customer.phone' => ['nullable', 'string', 'max:64'],
            'customer.address' => ['nullable', 'string', 'max:512'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.productName' => ['required_with:items', 'string', 'max:255'],
            'items.*.modelNo' => ['nullable', 'string', 'max:255'],
            'items.*.specification' => ['nullable', 'string', 'max:512'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit' => ['required_with:items', 'string', 'max:32'],
            'items.*.targetPrice' => ['nullable', 'numeric', 'min:0'],
            'items.*.targetCurrency' => ['nullable', 'string', 'max:8'],
            'items.*.hsCode' => ['nullable', 'string', 'max:64'],
            'items.*.remarks' => ['nullable', 'string'],
        ]);

        // 幂等优先：同一销售合同已下推过采购时，直接返回现有采购需求（避免重复入库）
        $existingByContract = PurchaseRequirement::with('items')
            ->where('source', '采购请求')
            ->where('sales_order_no', (string) $sc->contract_number)
            ->orderByDesc('id')
            ->first();

        if ($existingByContract) {
            $existingCg = (string) ($existingByContract->source_ref ?? '');
            $poNumbers = is_array($sc->purchase_order_numbers) ? $sc->purchase_order_numbers : [];
            if ($existingCg !== '' && !in_array($existingCg, $poNumbers, true)) {
                $poNumbers[] = $existingCg;
                $sc->purchase_order_numbers = array_values(array_unique($poNumbers));
                $sc->status = 'po_generated';
                $sc->save();
            }
            return response()->json([
                'message' => 'Already pushed to purchase',
                'contract' => $this->toDto($sc->fresh('products')),
                'requirement' => $this->requirementToDto($existingByContract),
            ], 200);
        }

        $regionCode = $this->toRegionCode((string) ($sc->region ?? 'NA'));
        $dateStr = now()->format('ymd');
        $cgNumber = trim((string) ($validated['cgNumber'] ?? ''));
        if ($cgNumber === '') {
            $seq = $this->nextCgSequence($regionCode, $dateStr);
            $cgNumber = "CG-{$regionCode}-{$dateStr}-{$seq}";
        }

        // 幂等：source_ref(=CG号) 已存在则直接返回
        $existing = PurchaseRequirement::with('items')
            ->where('source_ref', $cgNumber)
            ->where('sales_order_no', (string) $sc->contract_number)
            ->first();

        if ($existing) {
            $poNumbers = is_array($sc->purchase_order_numbers) ? $sc->purchase_order_numbers : [];
            if (!in_array($cgNumber, $poNumbers, true)) {
                $poNumbers[] = $cgNumber;
                $sc->purchase_order_numbers = array_values(array_unique($poNumbers));
                $sc->status = 'po_generated';
                $sc->save();
            }
            return response()->json([
                'message' => 'Already pushed to purchase',
                'contract' => $this->toDto($sc->fresh('products')),
                'requirement' => $this->requirementToDto($existing),
            ], 200);
        }

        DB::beginTransaction();
        try {
            $qrDateStr = now()->format('ymd');
            $qrSeq = $this->nextQrSequence($regionCode, $qrDateStr);
            $requirementNo = "QR-{$regionCode}-{$qrDateStr}-{$qrSeq}";

            $customerInput = is_array($validated['customer'] ?? null) ? $validated['customer'] : [];
            $customerSnapshot = [
                'companyName' => $customerInput['companyName'] ?? ($sc->customer_company ?: $sc->customer_name ?: 'Unknown Customer'),
                'contactPerson' => $customerInput['contactPerson'] ?? ($sc->contact_person ?: $sc->customer_name ?: null),
                'email' => $customerInput['email'] ?? ($sc->customer_email ?: null),
                'phone' => $customerInput['phone'] ?? ($sc->contact_phone ?: null),
                'mobile' => null,
                'address' => $customerInput['address'] ?? ($sc->customer_address ?: null),
                'website' => null,
                'businessType' => null,
            ];

            $requirement = PurchaseRequirement::create([
                'requirement_uid' => Str::uuid()->toString(),
                'requirement_no' => $requirementNo,
                'source' => '采购请求',
                'source_ref' => $cgNumber,
                'source_inquiry_number' => (string) (($validated['sourceInquiryNumber'] ?? null) ?: ($sc->inquiry_number ?: $sc->quotation_number ?: $sc->contract_number)),
                'required_date' => now()->addDays(30)->format('Y-m-d'),
                'urgency' => (string) ($validated['urgency'] ?? 'high'),
                'status' => 'pending',
                'created_by' => (string) ($user->email ?? 'system'),
                'created_date' => now()->format('Y-m-d'),
                'special_requirements' => (string) (($validated['specialRequirements'] ?? null) ?: ("由业务员下推采购，来源销售合同 {$sc->contract_number}")),
                'region' => $this->toRegionName((string) ($sc->region ?? 'NA')),
                'sales_order_no' => (string) $sc->contract_number,
                'customer_snapshot' => $customerSnapshot,
            ]);

            $itemsInput = is_array($validated['items'] ?? null) ? $validated['items'] : null;
            $itemsToPersist = [];
            if (is_array($itemsInput) && count($itemsInput) > 0) {
                foreach ($itemsInput as $item) {
                    $itemsToPersist[] = [
                        'product_name' => (string) $item['productName'],
                        'model_no' => isset($item['modelNo']) && trim((string) $item['modelNo']) !== '' ? (string) $item['modelNo'] : '-',
                        'specification' => $item['specification'] ?? null,
                        'quantity' => (int) $item['quantity'],
                        'unit' => (string) $item['unit'],
                        'target_price' => array_key_exists('targetPrice', $item) ? $item['targetPrice'] : null,
                        'target_currency' => $item['targetCurrency'] ?? ((string) $sc->currency ?: 'USD'),
                        'hs_code' => $item['hsCode'] ?? null,
                        'image_url' => null,
                        'remarks' => $item['remarks'] ?? null,
                    ];
                }
            } else {
                foreach (($sc->products ?? []) as $p) {
                    $itemsToPersist[] = [
                        'product_name' => (string) $p->product_name,
                        'model_no' => trim((string) ($p->product_id ?? '')) !== '' ? (string) $p->product_id : '-',
                        'specification' => $p->specification ?? null,
                        'quantity' => (int) $p->quantity,
                        'unit' => (string) $p->unit,
                        'target_price' => (float) ($p->unit_price ?? 0),
                        'target_currency' => (string) ($sc->currency ?: 'USD'),
                        'hs_code' => $p->hs_code ?? null,
                        'image_url' => null,
                        'remarks' => null,
                    ];
                }
            }

            foreach ($itemsToPersist as $row) {
                PurchaseRequirementItem::create([
                    'purchase_requirement_id' => $requirement->id,
                    'item_uid' => Str::uuid()->toString(),
                    ...$row,
                ]);
            }

            $poNumbers = is_array($sc->purchase_order_numbers) ? $sc->purchase_order_numbers : [];
            if (!in_array($cgNumber, $poNumbers, true)) {
                $poNumbers[] = $cgNumber;
            }
            $sc->purchase_order_numbers = array_values(array_unique($poNumbers));
            $sc->status = 'po_generated';
            $sc->save();

            DB::commit();

            return response()->json([
                'message' => 'Pushed to purchase successfully',
                'cgNumber' => $cgNumber,
                'contract' => $this->toDto($sc->fresh('products')),
                'requirement' => $this->requirementToDto($requirement->fresh('items')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Push to purchase failed: ' . $e->getMessage()], 500);
        }
    }

    private function requiresDirectorApproval(SalesContract $sc): bool
    {
        $flow = is_array($sc->approval_flow) ? $sc->approval_flow : [];
        if (array_key_exists('requiresDirectorApproval', $flow)) {
            return (bool) $flow['requiresDirectorApproval'];
        }
        return ((float) $sc->total_amount) >= 20000;
    }

    private function getApproverRoleForStatus(string $status): string
    {
        return $status === 'pending_director' ? 'director' : 'supervisor';
    }

    private function getCurrentApproverEmail(SalesContract $sc): ?string
    {
        if ((string) $sc->status === 'pending_director') {
            return 'sales.director@cosun.com';
        }
        if ((string) $sc->status === 'pending_supervisor') {
            return $this->getRegionalManagerEmail((string) $sc->region);
        }
        return null;
    }

    private function getRegionalManagerEmail(string $region): string
    {
        $r = strtoupper(trim($region));
        return match ($r) {
            'SA' => 'carlos.silva@cosun.com',
            'EMEA', 'EA', 'EU' => 'hans.mueller@cosun.com',
            default => 'john.smith@cosun.com',
        };
    }

    private function toRegionCode(string $region): string
    {
        $r = strtoupper(trim($region));
        return match ($r) {
            'SA', 'SOUTH AMERICA' => 'SA',
            'EMEA', 'EA', 'EU', 'EUROPE & AFRICA' => 'EA',
            default => 'NA',
        };
    }

    private function toRegionName(string $region): string
    {
        $r = strtoupper(trim($region));
        return match ($r) {
            'SA', 'SOUTH AMERICA' => 'South America',
            'EMEA', 'EA', 'EU', 'EUROPE & AFRICA' => 'Europe & Africa',
            default => 'North America',
        };
    }

    private function nextQrSequence(string $regionCode, string $dateStr): string
    {
        $prefix = "QR-{$regionCode}-{$dateStr}-";
        $last = PurchaseRequirement::where('requirement_no', 'like', $prefix . '%')
            ->orderBy('requirement_no', 'desc')
            ->value('requirement_no');
        if (!$last) return '0001';
        $lastSeq = (int) substr((string) $last, -4);
        return str_pad((string) ($lastSeq + 1), 4, '0', STR_PAD_LEFT);
    }

    private function nextCgSequence(string $regionCode, string $dateStr): string
    {
        $prefix = "CG-{$regionCode}-{$dateStr}-";
        $last = PurchaseRequirement::where('source_ref', 'like', $prefix . '%')
            ->orderBy('source_ref', 'desc')
            ->value('source_ref');
        if (!$last) return '0001';
        $lastSeq = (int) substr((string) $last, -4);
        return str_pad((string) ($lastSeq + 1), 4, '0', STR_PAD_LEFT);
    }

    private function requirementToDto(PurchaseRequirement $requirement): array
    {
        $customerSnapshot = is_array($requirement->customer_snapshot) ? $requirement->customer_snapshot : [];
        $purchaserFeedback = is_array($requirement->purchaser_feedback) ? $requirement->purchaser_feedback : [];
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
            'purchaserFeedback' => $purchaserFeedback,
            'pushedToQuotation' => $requirement->pushed_to_quotation ?? false,
            'pushedToQuotationDate' => $requirement->pushed_to_quotation_date ? $requirement->pushed_to_quotation_date->toIso8601String() : null,
            'pushedBy' => $requirement->pushed_by,
        ];
    }

    public function destroy(Request $request, string $contractUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesContract|null $sc */
        $sc = SalesContract::where('contract_uid', $contractUid)
            ->orWhere('contract_number', $contractUid)
            ->first();

        if (!$sc) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        if (($user->portal_role ?? '') !== 'admin' && $sc->sales_person_email !== $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $sc->delete();

        return response()->json(['message' => '删除成功']);
    }

    public function toDto(SalesContract $sc): array
    {
        return [
            'id' => $sc->contract_uid,
            'contractNumber' => $sc->contract_number,
            'quotationNumber' => $sc->quotation_number,
            'inquiryNumber' => $sc->inquiry_number,
            'customerName' => $sc->customer_name,
            'customerEmail' => $sc->customer_email,
            'customerCompany' => $sc->customer_company,
            'customerAddress' => $sc->customer_address,
            'customerCountry' => $sc->customer_country,
            'contactPerson' => $sc->contact_person,
            'contactPhone' => $sc->contact_phone,
            'salesPerson' => $sc->sales_person_email,
            'salesPersonName' => $sc->sales_person_name,
            'supervisor' => $sc->supervisor_email,
            'region' => $sc->region,
            'products' => ($sc->relationLoaded('products') ? $sc->products : collect())->map(function ($p) {
                return [
                    'productId' => $p->product_id,
                    'productName' => $p->product_name,
                    'specification' => $p->specification,
                    'hsCode' => $p->hs_code,
                    'quantity' => (int) $p->quantity,
                    'unit' => $p->unit,
                    'unitPrice' => (float) $p->unit_price,
                    'amount' => (float) $p->amount,
                    'deliveryTime' => $p->delivery_time,
                ];
            })->values()->all(),
            'totalAmount' => (float) $sc->total_amount,
            'currency' => $sc->currency,
            'tradeTerms' => $sc->trade_terms,
            'paymentTerms' => $sc->payment_terms,
            'depositPercentage' => (float) $sc->deposit_percentage,
            'depositAmount' => (float) $sc->deposit_amount,
            'balancePercentage' => (float) $sc->balance_percentage,
            'balanceAmount' => (float) $sc->balance_amount,
            'deliveryTime' => $sc->delivery_time,
            'portOfLoading' => $sc->port_of_loading,
            'portOfDestination' => $sc->port_of_destination,
            'packing' => $sc->packing,
            'status' => $sc->status,
            'approvalFlow' => $sc->approval_flow,
            'approvalHistory' => $sc->approval_history,
            'approvalNotes' => $sc->approval_notes,
            'rejectionReason' => $sc->rejection_reason,
            'depositProof' => $sc->deposit_proof,
            'depositConfirmedBy' => $sc->deposit_confirmed_by,
            'depositConfirmedAt' => optional($sc->deposit_confirmed_at)->toISOString(),
            'depositConfirmNotes' => $sc->deposit_confirm_notes,
            'purchaseOrderNumbers' => $sc->purchase_order_numbers,
            'sellerSignature' => $sc->seller_signature,
            'buyerSignature' => $sc->buyer_signature,
            'attachments' => $sc->attachments,
            'remarks' => $sc->remarks,
            'createdAt' => optional($sc->created_at)->toISOString(),
            'updatedAt' => optional($sc->updated_at)->toISOString(),
            'submittedAt' => optional($sc->submitted_at)->toISOString(),
            'approvedAt' => optional($sc->approved_at)->toISOString(),
            'sentToCustomerAt' => optional($sc->sent_to_customer_at)->toISOString(),
            'customerConfirmedAt' => optional($sc->customer_confirmed_at)->toISOString(),
        ];
    }
}

