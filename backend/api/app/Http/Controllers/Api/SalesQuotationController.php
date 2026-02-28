<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesContract;
use App\Models\SalesContractProduct;
use App\Models\SalesQuotation;
use App\Models\SalesQuotationItem;
use App\Models\PurchaseRequirement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * 销售报价单（QT）接口
 *
 * GET  /api/sales-quotations - 获取报价单列表（业务员/客户不同视角）
 * POST /api/sales-quotations - 从成本询报下推创建报价单
 */
class SalesQuotationController extends Controller
{
    /**
     * PATCH /api/sales-quotations/{quotationUid}/customer-response
     *
     * 客户对报价做出响应：accepted / negotiating / rejected（落库）
     * body: { status: 'accepted'|'negotiating'|'rejected', comment?: string }
     */
    public function customerResponse(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:accepted,negotiating,rejected'],
            'comment' => ['nullable', 'string'],
        ]);

        /** @var SalesQuotation|null $qt */
        // 优先按唯一 quotation_uid 查询；若传入 qt_number，则取最新一条，避免命中历史旧记录
        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->first();
        if (!$qt) {
            $qt = SalesQuotation::with('items')
                ->where('qt_number', $quotationUid)
                ->orderByDesc('updated_at')
                ->first();
        }

        if (!$qt) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        // 权限：客户只能操作发送给自己的报价；admin 允许代操作
        if (($user->portal_role ?? '') !== 'admin') {
            if ((string) $qt->customer_email !== (string) $user->email) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        // 必须已发送给客户后才能响应
        if (!in_array((string) $qt->customer_status, ['sent', 'viewed', 'negotiating', 'accepted', 'rejected'], true)) {
            return response()->json(['message' => 'Quotation is not available for customer response'], 400);
        }

        // negotiating / rejected 必须填写 comment
        if (in_array($validated['status'], ['negotiating', 'rejected'], true) && trim((string) ($validated['comment'] ?? '')) === '') {
            return response()->json(['message' => 'Comment is required for negotiating/rejected'], 422);
        }

        $newStatus = $validated['status']; // accepted|negotiating|rejected
        $qt->customer_status = $newStatus;
        $qt->customer_response = [
            'status' => $newStatus,
            'comment' => $validated['comment'] ?? null,
            'respondedAt' => now()->toIso8601String(),
            'respondedBy' => ($user->email ?? null),
        ];

        $qt->save();

        return response()->json([
            'message' => 'Customer response saved',
            'quotation' => $this->toDto($qt->fresh('items')),
        ]);
    }

    /**
     * GET /api/sales-quotations
     *
     * 返回当前业务员名下的销售报价单列表
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = SalesQuotation::with('items');

        $portalRole = (string) ($user->portal_role ?? '');
        $view = (string) ($request->query('view') ?? '');

        // ✅ 兼容：某些环境 user.portal_role 可能为空，但前端客户Portal仍需要“按客户邮箱查看已发送报价”
        // 安全性：view=customer 仍然只看当前 token 用户自己的 customer_email，不会越权看别人
        if ($portalRole === 'admin') {
            // admin: see all (default)
        } elseif ($portalRole === 'customer' || $view === 'customer') {
            // customer: only see quotations sent to me
            $query->where('customer_email', $user->email)
                ->whereIn('customer_status', ['sent', 'viewed', 'accepted', 'rejected', 'negotiating', 'expired']);
        } else {
            // salesperson/agent: only see my quotations
            $query->where('sales_person_email', $user->email);
        }

        $quotations = $query->orderBy('created_at', 'desc')->limit(500)->get();

        return response()->json([
            'quotations' => ($portalRole === 'customer' || $view === 'customer')
                ? $quotations->map(fn($qt) => $this->toCustomerDto($qt))
                : $quotations->map(fn($qt) => $this->toDto($qt)),
        ]);
    }

    /**
     * POST /api/sales-quotations
     *
     * 从成本询报（QR）下推创建销售报价单
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'qrNumber' => ['required', 'string', 'max:128'],
            'qtNumber' => ['required', 'string', 'max:128'],
            'inqNumber' => ['nullable', 'string', 'max:128'],
            'region' => ['required', 'string', 'max:16'],
            'customerCompany' => ['required', 'string', 'max:255'],
            'customerName' => ['required', 'string', 'max:255'],
            'customerEmail' => ['required', 'string', 'email', 'max:255'],
            'customerPhone' => ['nullable', 'string', 'max:64'],
            'customerAddress' => ['nullable', 'string', 'max:512'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productName' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit' => ['required', 'string', 'max:32'],
            'items.*.costPrice' => ['required', 'numeric', 'min:0'],
            'items.*.salesPrice' => ['required', 'numeric', 'min:0'],
            'items.*.profitMargin' => ['required', 'numeric', 'min:0'],
            'items.*.totalCost' => ['required', 'numeric', 'min:0'],
            'items.*.totalPrice' => ['required', 'numeric', 'min:0'],
            'totalCost' => ['required', 'numeric', 'min:0'],
            'totalPrice' => ['required', 'numeric', 'min:0'],
            'totalProfit' => ['required', 'numeric'],
            'profitRate' => ['required', 'numeric'],
            'currency' => ['required', 'string', 'max:8'],
            'paymentTerms' => ['nullable', 'string', 'max:512'],
            'deliveryTerms' => ['nullable', 'string', 'max:512'],
            'deliveryDate' => ['nullable', 'date'],
            'validUntil' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        // 检查是否已存在相同 qt_number 的报价单
        $existing = SalesQuotation::where('qt_number', $validated['qtNumber'])->first();
        if ($existing) {
            return response()->json([
                'message' => '报价单号已存在',
                'quotation' => $this->toDto($existing),
            ], 200);
        }

        DB::beginTransaction();
        try {
            $quotation = SalesQuotation::create([
                'quotation_uid' => Str::uuid()->toString(),
                'qt_number' => $validated['qtNumber'],
                'qr_number' => $validated['qrNumber'],
                'inq_number' => $validated['inqNumber'] ?? null,
                'region' => $validated['region'],
                'customer_name' => $validated['customerName'],
                'customer_email' => $validated['customerEmail'],
                'customer_company' => $validated['customerCompany'],
                'customer_phone' => $validated['customerPhone'] ?? null,
                'customer_address' => $validated['customerAddress'] ?? null,
                'sales_person_email' => $user->email,
                'sales_person_name' => $user->name ?? $user->email,
                'total_cost' => (float) $validated['totalCost'],
                'total_price' => (float) $validated['totalPrice'],
                'total_profit' => (float) $validated['totalProfit'],
                'profit_rate' => (float) $validated['profitRate'],
                'currency' => $validated['currency'],
                'payment_terms' => $validated['paymentTerms'] ?? null,
                'delivery_terms' => $validated['deliveryTerms'] ?? null,
                'delivery_date' => $validated['deliveryDate'] ?? null,
                'valid_until' => $validated['validUntil'] ?? now()->addDays(30)->toDateString(),
                'approval_status' => 'draft',
                'customer_status' => 'not_sent',
                'version' => 1,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $itemData) {
                SalesQuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $itemData['id'] ?? null,
                    'product_name' => $itemData['productName'],
                    'model_no' => $itemData['modelNo'] ?? null,
                    'specification' => $itemData['specification'] ?? null,
                    'quantity' => (int) $itemData['quantity'],
                    'unit' => $itemData['unit'],
                    'cost_price' => (float) $itemData['costPrice'],
                    'selected_supplier' => $itemData['selectedSupplier'] ?? null,
                    'selected_supplier_name' => $itemData['selectedSupplierName'] ?? null,
                    'selected_bj' => $itemData['selectedBJ'] ?? null,
                    'moq' => isset($itemData['moq']) ? (int) $itemData['moq'] : null,
                    'lead_time' => $itemData['leadTime'] ?? null,
                    'sales_price' => (float) $itemData['salesPrice'],
                    'profit_margin' => (float) $itemData['profitMargin'],
                    'profit' => (float) ($itemData['profit'] ?? 0),
                    'total_cost' => (float) $itemData['totalCost'],
                    'total_price' => (float) $itemData['totalPrice'],
                    'currency' => $itemData['currency'] ?? $validated['currency'],
                    'hs_code' => $itemData['hsCode'] ?? null,
                    'remarks' => $itemData['remarks'] ?? null,
                ]);
            }

            // 更新 QR 的 pushed_to_quotation 标记
            PurchaseRequirement::where('requirement_no', $validated['qrNumber'])
                ->update([
                    'pushed_to_quotation' => true,
                    'pushed_to_quotation_date' => now(),
                    'pushed_by' => $user->email,
                ]);

            DB::commit();

            return response()->json([
                'message' => '销售报价单创建成功',
                'quotation' => $this->toDto($quotation->fresh('items')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => '创建失败: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/sales-quotations/{quotationUid}
     *
     * 保存草稿编辑（智能报价创建弹窗）
     */
    public function update(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesQuotation|null $qt */
        // 优先按唯一 quotation_uid 查询；若传入 qt_number，则取最新一条，避免命中历史旧记录
        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->first();
        if (!$qt) {
            $qt = SalesQuotation::with('items')
                ->where('qt_number', $quotationUid)
                ->orderByDesc('updated_at')
                ->first();
        }

        if (!$qt) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        if (($user->portal_role ?? '') !== 'admin' && (string) $qt->sales_person_email !== (string) $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'quoteNo' => ['nullable', 'string', 'max:128'],
            'quoteDate' => ['nullable', 'date'],
            'validityDays' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'string', 'max:128'],
            'items.*.productName' => ['required', 'string', 'max:255'],
            'items.*.modelNo' => ['nullable', 'string', 'max:255'],
            'items.*.specification' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:1'],
            'items.*.unit' => ['required', 'string', 'max:32'],
            'items.*.costPrice' => ['nullable', 'numeric', 'min:0'],
            'items.*.costUSD' => ['nullable', 'numeric', 'min:0'],
            'items.*.salesPrice' => ['nullable', 'numeric', 'min:0'],
            'items.*.quotePrice' => ['nullable', 'numeric', 'min:0'],
            'items.*.profitMargin' => ['nullable', 'numeric', 'min:0'],
            'items.*.profit' => ['nullable', 'numeric'],
            'items.*.profitUSD' => ['nullable', 'numeric'],
            'items.*.totalCost' => ['nullable', 'numeric', 'min:0'],
            'items.*.totalPrice' => ['nullable', 'numeric', 'min:0'],
            'items.*.totalAmount' => ['nullable', 'numeric', 'min:0'],
            'items.*.currency' => ['nullable', 'string', 'max:8'],
            'items.*.remarks' => ['nullable', 'string'],
            'totalCost' => ['nullable', 'numeric', 'min:0'],
            'totalPrice' => ['nullable', 'numeric', 'min:0'],
            'totalAmount' => ['nullable', 'numeric', 'min:0'],
            'totalProfit' => ['nullable', 'numeric'],
            'profitRate' => ['nullable', 'numeric'],
            'profitMargin' => ['nullable', 'numeric'],
            'approvalNotes' => ['nullable', 'string'],
            'currency' => ['nullable', 'string', 'max:8'],
            'paymentTerms' => ['nullable', 'string', 'max:512'],
            'deliveryTerms' => ['nullable', 'string', 'max:512'],
            'deliveryDate' => ['nullable', 'date'],
            'validUntil' => ['nullable', 'date'],
        ]);

        DB::beginTransaction();
        try {
            $itemsPayload = $validated['items'];
            $normalizedItems = [];
            $itemsTotalCost = 0.0;
            $itemsTotalPrice = 0.0;

            foreach ($itemsPayload as $itemData) {
                $quantity = max(1, (int) round((float) ($itemData['quantity'] ?? 1)));
                $costPrice = (float) ($itemData['costPrice'] ?? $itemData['costUSD'] ?? 0);
                $salesPrice = (float) ($itemData['salesPrice'] ?? $itemData['quotePrice'] ?? 0);
                $profitMargin = (float) ($itemData['profitMargin'] ?? 0);
                $profit = (float) ($itemData['profit'] ?? $itemData['profitUSD'] ?? 0);
                $lineTotalCost = (float) ($itemData['totalCost'] ?? ($costPrice * $quantity));
                $lineTotalPrice = (float) ($itemData['totalPrice'] ?? $itemData['totalAmount'] ?? ($salesPrice * $quantity));

                $itemsTotalCost += $lineTotalCost;
                $itemsTotalPrice += $lineTotalPrice;

                $normalizedItems[] = [
                    'product_id' => $itemData['id'] ?? null,
                    'product_name' => $itemData['productName'],
                    'model_no' => $itemData['modelNo'] ?? null,
                    'specification' => $itemData['specification'] ?? null,
                    'quantity' => $quantity,
                    'unit' => $itemData['unit'],
                    'cost_price' => $costPrice,
                    'sales_price' => $salesPrice,
                    'profit_margin' => $profitMargin,
                    'profit' => $profit,
                    'total_cost' => $lineTotalCost,
                    'total_price' => $lineTotalPrice,
                    'currency' => $itemData['currency'] ?? ($validated['currency'] ?? $qt->currency ?? 'USD'),
                    'remarks' => $itemData['remarks'] ?? null,
                ];
            }

            $resolvedTotalCost = isset($validated['totalCost']) ? (float) $validated['totalCost'] : $itemsTotalCost;
            $resolvedTotalPrice = isset($validated['totalAmount'])
                ? (float) $validated['totalAmount']
                : (isset($validated['totalPrice']) ? (float) $validated['totalPrice'] : $itemsTotalPrice);
            $resolvedTotalProfit = isset($validated['totalProfit'])
                ? (float) $validated['totalProfit']
                : ($resolvedTotalPrice - $resolvedTotalCost);
            $resolvedProfitRate = isset($validated['profitMargin'])
                ? (float) $validated['profitMargin']
                : (isset($validated['profitRate'])
                    ? (float) $validated['profitRate']
                    : ($resolvedTotalCost > 0 ? ($resolvedTotalProfit / $resolvedTotalCost) * 100 : 0));

            $qt->qt_number = $validated['quoteNo'] ?? $qt->qt_number;
            $qt->total_cost = $resolvedTotalCost;
            $qt->total_price = $resolvedTotalPrice;
            $qt->total_profit = $resolvedTotalProfit;
            $qt->profit_rate = $resolvedProfitRate;
            $qt->currency = $validated['currency'] ?? $qt->currency;
            $qt->payment_terms = $validated['paymentTerms'] ?? $qt->payment_terms;
            $qt->delivery_terms = $validated['deliveryTerms'] ?? $qt->delivery_terms;
            $qt->delivery_date = $validated['deliveryDate'] ?? $qt->delivery_date;
            $qt->notes = $validated['approvalNotes'] ?? $qt->notes;

            if (!empty($validated['validUntil'])) {
                $qt->valid_until = $validated['validUntil'];
            } elseif (!empty($validated['quoteDate']) && !empty($validated['validityDays'])) {
                $qt->valid_until = date('Y-m-d', strtotime($validated['quoteDate'] . ' +' . (int) $validated['validityDays'] . ' days'));
            }

            $qt->save();

            SalesQuotationItem::where('quotation_id', $qt->id)->delete();
            foreach ($normalizedItems as $itemData) {
                SalesQuotationItem::create(array_merge(
                    ['quotation_id' => $qt->id],
                    $itemData
                ));
            }

            DB::commit();

            return response()->json([
                'message' => '报价草稿已保存',
                'quotation' => $this->toDto($qt->fresh('items')),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => '保存失败: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/sales-quotations/{quotationUid}/withdraw
     *
     * 业务员撤回审批中的报价单，将 approval_status 重置为 draft，清空 approval_chain。
     * 场景：审批记录被删除后，业务员可将报价单拉回草稿状态重新编辑/提交。
     * 规则：仅允许 pending_supervisor / pending_director 状态撤回（approved / rejected 不可撤）。
     */
    public function withdraw(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesQuotation|null $qt */
        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->orWhere('qt_number', $quotationUid)
            ->first();

        if (!$qt) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        // 只有本人或 admin 可以撤回
        if (($user->portal_role ?? '') !== 'admin' && (string) $qt->sales_person_email !== (string) $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // 只允许审批流程中的单子撤回（草稿/已批准/已拒绝不可撤）
        $withdrawableStatuses = ['pending_supervisor', 'pending_director', 'pending_approval'];
        if (!in_array((string) $qt->approval_status, $withdrawableStatuses, true)) {
            return response()->json([
                'message' => '当前状态不允许撤回（仅待审批中的报价单可撤回）',
                'currentStatus' => $qt->approval_status,
            ], 422);
        }

        $qt->approval_status = 'draft';
        $qt->approval_chain = null;
        $qt->save();

        return response()->json([
            'message' => '报价单已撤回，可重新编辑并提交',
            'quotation' => $this->toDto($qt->fresh('items')),
        ]);
    }

    /**
     * POST /api/sales-quotations/{quotationUid}/push-to-contract
     *
     * 业务员下推：由已接受（客户accepted）的报价单 QT 生成销售合同 SC（落库）
     * - 创建 sales_contracts + sales_contract_products
     * - 回写 sales_quotations.pushed_to_contract / pushed_contract_number / pushed_contract_at / pushed_by
     *
     * 幂等：同一个 qt_number 只生成 1 份合同
     */
    public function pushToContract(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesQuotation|null $qt */
        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->orWhere('qt_number', $quotationUid)
            ->first();

        if (!$qt) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        // 权限：非 admin 只能操作自己名下报价单
        if (($user->portal_role ?? '') !== 'admin' && (string) $qt->sales_person_email !== (string) $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // 业务约束：必须客户已接受
        if ((string) $qt->customer_status !== 'accepted') {
            return response()->json(['message' => 'Only customer accepted quotation can be pushed to contract'], 400);
        }

        // 幂等：若已生成合同，直接返回
        $existing = SalesContract::with('products')
            ->where('quotation_number', $qt->qt_number)
            ->first();
        if ($existing) {
            // 确保回写字段一致
            if (!$qt->pushed_to_contract || (string) $qt->pushed_contract_number === '') {
                $qt->pushed_to_contract = true;
                $qt->pushed_contract_number = $existing->contract_number;
                $qt->pushed_contract_at = now();
                $qt->pushed_by = $user->email;
                $qt->save();
            }
            return response()->json([
                'message' => 'Already pushed',
                'contract' => app(SalesContractController::class)->toDto($existing),
                'quotation' => $this->toDto($qt->fresh('items')),
            ], 200);
        }

        $validated = $request->validate([
            // 可选：允许前端传入合同备注/目的港等补充字段
            'remarks' => ['nullable', 'string'],
            'portOfDestination' => ['nullable', 'string', 'max:255'],
            'packing' => ['nullable', 'string', 'max:255'],
            // ✅ 支持 Admin token 切换业务员视角下推
            'asEmail' => ['nullable', 'string', 'email', 'max:255'],
        ]);

        DB::beginTransaction();
        try {
            $region = (string) ($qt->region ?: 'NA');
            $contractNumber = $this->generateContractNumber($region);

            // trade/payment terms
            $tradeTermsArr = is_array($qt->trade_terms) ? $qt->trade_terms : [];
            $tradeTerms = (string) ($tradeTermsArr['incoterms'] ?? $qt->delivery_terms ?? 'FOB Xiamen');
            $paymentTerms = (string) ($tradeTermsArr['paymentTerms'] ?? $qt->payment_terms ?? '30% T/T deposit, 70% before shipment');
            $deliveryTime = (string) ($tradeTermsArr['deliveryTime'] ?? $tradeTermsArr['leadTime'] ?? '30-45 days after deposit');
            $portOfLoading = (string) ($tradeTermsArr['portOfLoading'] ?? 'Xiamen, China');
            $portOfDestination = (string) ($validated['portOfDestination'] ?? ($tradeTermsArr['portOfDestination'] ?? ''));
            $packing = (string) ($validated['packing'] ?? ($tradeTermsArr['packing'] ?? 'Standard Export Packing'));

            $totalAmount = (float) ($qt->total_price ?? 0);
            $depositPct = 30.0;
            $balancePct = 70.0;
            $depositAmount = $totalAmount * ($depositPct / 100.0);
            $balanceAmount = $totalAmount * ($balancePct / 100.0);

            $asEmail = (string) ($validated['asEmail'] ?? '');
            $actorEmail = (($user->portal_role ?? '') === 'admin' && $asEmail !== '') ? $asEmail : (string) $user->email;

            $sc = SalesContract::create([
                'contract_uid' => Str::uuid()->toString(),
                'contract_number' => $contractNumber,
                'quotation_number' => $qt->qt_number,
                'inquiry_number' => $qt->inq_number,
                'customer_name' => $qt->customer_name,
                'customer_email' => $qt->customer_email,
                'customer_company' => $qt->customer_company,
                'customer_address' => (string) ($qt->customer_address ?? ''),
                'customer_country' => '',
                'contact_person' => (string) ($qt->customer_name ?? ''),
                'contact_phone' => (string) ($qt->customer_phone ?? ''),
                // ✅ 关键：合同归属业务员邮箱（避免“切换角色”导致合同在列表被过滤掉）
                'sales_person_email' => $actorEmail,
                'sales_person_name' => (string) ($qt->sales_person_name ?? ($user->name ?? $actorEmail)),
                'supervisor_email' => null,
                'region' => $region,
                'total_amount' => $totalAmount,
                'currency' => (string) ($qt->currency ?? 'USD'),
                'trade_terms' => $tradeTerms,
                'payment_terms' => $paymentTerms,
                'deposit_percentage' => $depositPct,
                'deposit_amount' => $depositAmount,
                'balance_percentage' => $balancePct,
                'balance_amount' => $balanceAmount,
                'delivery_time' => $deliveryTime,
                'port_of_loading' => $portOfLoading,
                'port_of_destination' => $portOfDestination,
                'packing' => $packing,
                'status' => 'draft',
                'approval_flow' => null,
                'approval_history' => [],
                'remarks' => $validated['remarks'] ?? null,
                'attachments' => [],
            ]);

            foreach ($qt->items as $item) {
                SalesContractProduct::create([
                    'sales_contract_id' => $sc->id,
                    'product_id' => (string) ($item->product_id ?? $item->id),
                    'product_name' => (string) $item->product_name,
                    'specification' => (string) ($item->specification ?? ''),
                    'hs_code' => (string) ($item->hs_code ?? ''),
                    'quantity' => (int) $item->quantity,
                    'unit' => (string) $item->unit,
                    'unit_price' => (float) $item->sales_price,
                    'amount' => ((float) $item->sales_price) * ((int) $item->quantity),
                    'delivery_time' => (string) ($item->lead_time ?? null),
                ]);
            }

            // 回写 QT
            $qt->pushed_to_contract = true;
            $qt->pushed_contract_number = $contractNumber;
            $qt->pushed_contract_at = now();
            $qt->pushed_by = $actorEmail;
            $qt->save();

            DB::commit();

            $sc = $sc->fresh('products');

            return response()->json([
                'message' => 'Pushed to contract',
                'contract' => app(SalesContractController::class)->toDto($sc),
                'quotation' => $this->toDto($qt->fresh('items')),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Push failed: ' . $e->getMessage()], 500);
        }
    }

    private function generateContractNumber(string $region): string
    {
        $region = $region ?: 'NA';
        $dateStr = now()->setTimezone('Asia/Shanghai')->format('ymd');
        $prefix = "SC-{$region}-{$dateStr}-";
        $todayCount = SalesContract::where('contract_number', 'like', $prefix . '%')->count();
        $seq = str_pad((string) ($todayCount + 1), 4, '0', STR_PAD_LEFT);
        return $prefix . $seq;
    }

    /**
     * PATCH /api/sales-quotations/{quotationUid}/submit-approval
     *
     * 业务员提交报价单给主管审批（落库）
     * body: { approvalChain: [...], amount?: number }
     */
    public function submitApproval(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'approvalChain' => ['required', 'array', 'min:1'],
            'approvalChain.*.level' => ['required', 'integer', 'in:1,2'],
            'approvalChain.*.approverRole' => ['required', 'string', 'max:64'],
            'approvalChain.*.approverEmail' => ['required', 'string', 'email', 'max:255'],
            'approvalChain.*.approverName' => ['nullable', 'string', 'max:255'],
            'approvalChain.*.status' => ['required', 'string', 'in:pending,approved,rejected'],
            'approvalChain.*.comment' => ['nullable', 'string'],
            'amount' => ['nullable', 'numeric'],
            'totalPrice' => ['nullable', 'numeric'],
            'items' => ['nullable', 'array'],
            'items.*.productName' => ['nullable', 'string'],
            'items.*.salesPrice' => ['nullable', 'numeric'],
            'items.*.costPrice' => ['nullable', 'numeric'],
            'items.*.quantity' => ['nullable', 'numeric'],
            'items.*.profitMargin' => ['nullable', 'numeric'],
        ]);

        /** @var SalesQuotation|null $qt */
        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->orWhere('qt_number', $quotationUid)
            ->first();

        if (!$qt) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        // 权限：非 admin 只能提交自己名下的报价单
        if (($user->portal_role ?? '') !== 'admin' && $qt->sales_person_email !== $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Allow submission from draft or from a pending state (re-submit after withdraw / orphaned approval record)
        $submittableStatuses = ['draft', 'pending_supervisor', 'pending_director', 'pending_approval'];
        if (!in_array((string) $qt->approval_status, $submittableStatuses, true)) {
            return response()->json(['message' => 'Only draft quotation can be submitted for approval'], 400);
        }

        $qt->approval_status = 'pending_approval';
        $qt->approval_chain = $validated['approvalChain'];

        // 同步更新业务员最新定价（避免发给客户时被 DB 旧价格覆盖）
        if (!empty($validated['totalPrice'])) {
            $qt->total_price = $validated['totalPrice'];
        }
        $qt->save();

        // 同步更新 items 里的 sales_price（业务员手动调整的报价单价）
        if (!empty($validated['items'])) {
            $existingItems = $qt->items ?? collect();
            foreach ($validated['items'] as $idx => $itemData) {
                $item = $existingItems->get($idx);
                if ($item && isset($itemData['salesPrice'])) {
                    $item->sales_price = (float) $itemData['salesPrice'];
                    if (isset($itemData['costPrice'])) $item->cost_price = (float) $itemData['costPrice'];
                    if (isset($itemData['profitMargin'])) $item->profit_margin = (float) $itemData['profitMargin'];
                    $item->save();
                }
            }
        }

        return response()->json([
            'message' => '报价单已提交审批',
            'quotation' => $this->toDto($qt->fresh('items')),
        ]);
    }

    /**
     * PATCH /api/sales-quotations/{quotationUid}/approve
     * body: { comment?: string, approverName?: string }
     */
    public function approve(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $validated = $request->validate([
            'comment' => ['nullable', 'string'],
            'approverName' => ['nullable', 'string', 'max:255'],
        ]);

        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->orWhere('qt_number', $quotationUid)
            ->first();
        if (!$qt) return response()->json(['message' => 'Quotation not found'], 404);

        $email = (string) ($user->email ?? '');
        $name = (string) (($validated['approverName'] ?? null) ?: ($user->name ?? $email));

        $chain = is_array($qt->approval_chain) ? $qt->approval_chain : [];
        $pendingIndex = null;
        for ($i = 0; $i < count($chain); $i++) {
            if (($chain[$i]['status'] ?? '') === 'pending') { $pendingIndex = $i; break; }
        }
        if ($pendingIndex === null) {
            return response()->json(['message' => 'No pending approval step'], 400);
        }
        if ((string)($chain[$pendingIndex]['approverEmail'] ?? '') !== $email && ($user->portal_role ?? '') !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $chain[$pendingIndex]['status'] = 'approved';
        $chain[$pendingIndex]['approverName'] = $name;
        $chain[$pendingIndex]['comment'] = (string) ($validated['comment'] ?? '批准通过');
        $chain[$pendingIndex]['approvedAt'] = now()->toIso8601String();

        $hasNextPending = false;
        for ($j = $pendingIndex + 1; $j < count($chain); $j++) {
            if (($chain[$j]['status'] ?? '') === 'pending') { $hasNextPending = true; break; }
        }

        if ($hasNextPending) {
            $qt->approval_status = 'pending_director';
        } else {
            $qt->approval_status = 'approved';
        }

        $qt->approval_chain = $chain;
        $qt->save();

        return response()->json([
            'message' => '审批已通过',
            'quotation' => $this->toDto($qt->fresh('items')),
        ]);
    }

    /**
     * PATCH /api/sales-quotations/{quotationUid}/reject
     * body: { comment: string, approverName?: string }
     */
    public function reject(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $validated = $request->validate([
            'comment' => ['required', 'string'],
            'approverName' => ['nullable', 'string', 'max:255'],
        ]);

        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->orWhere('qt_number', $quotationUid)
            ->first();
        if (!$qt) return response()->json(['message' => 'Quotation not found'], 404);

        $email = (string) ($user->email ?? '');
        $name = (string) (($validated['approverName'] ?? null) ?: ($user->name ?? $email));

        $chain = is_array($qt->approval_chain) ? $qt->approval_chain : [];
        $pendingIndex = null;
        for ($i = 0; $i < count($chain); $i++) {
            if (($chain[$i]['status'] ?? '') === 'pending') { $pendingIndex = $i; break; }
        }
        if ($pendingIndex === null) {
            return response()->json(['message' => 'No pending approval step'], 400);
        }
        if ((string)($chain[$pendingIndex]['approverEmail'] ?? '') !== $email && ($user->portal_role ?? '') !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $chain[$pendingIndex]['status'] = 'rejected';
        $chain[$pendingIndex]['approverName'] = $name;
        $chain[$pendingIndex]['comment'] = (string) $validated['comment'];
        $chain[$pendingIndex]['approvedAt'] = now()->toIso8601String();

        $qt->approval_status = 'rejected';
        $qt->approval_chain = $chain;
        $qt->save();

        return response()->json([
            'message' => '已驳回',
            'quotation' => $this->toDto($qt->fresh('items')),
        ]);
    }

    /**
     * PATCH /api/sales-quotations/{quotationUid}/send-to-customer
     *
     * 报价审批通过后，业务员/管理员发送给客户（落库 customer_status + sent_at）
     */
    public function sendToCustomer(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesQuotation|null $qt */
        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->orWhere('qt_number', $quotationUid)
            ->first();

        if (!$qt) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        // 权限：非 admin 只能操作自己名下报价单
        if (($user->portal_role ?? '') !== 'admin' && $qt->sales_person_email !== $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // 只允许已批准的报价发送给客户（允许 approved 或本地兼容审批通过的状态）
        $allowedToSend = ['approved', 'pending_supervisor', 'pending_director', 'pending_approval'];
        if (!in_array((string) $qt->approval_status, $allowedToSend, true)) {
            return response()->json(['message' => 'Only approved quotation can be sent to customer'], 400);
        }
        // 如果本地审批通过但后端状态未同步，顺带修正为 approved
        if ((string) $qt->approval_status !== 'approved') {
            $qt->approval_status = 'approved';
        }

        // 幂等：已发送则直接返回（force=true 时强制重发）
        $force = $request->boolean('force', false);
        if (!$force && in_array((string) $qt->customer_status, ['sent', 'viewed', 'accepted', 'rejected', 'negotiating', 'expired'], true)) {
            return response()->json([
                'message' => 'Already sent',
                'quotation' => $this->toDto($qt),
            ], 200);
        }

        $qt->customer_status = 'sent';
        $qt->sent_at = now();
        $qt->save();

        return response()->json([
            'message' => 'Sent to customer',
            'quotation' => $this->toDto($qt->fresh('items')),
        ], 200);
    }

    /**
     * PATCH /api/sales-quotations/{quotationUid}/reset-customer-status
     *
     * 将客户状态重置为未发送（用于重新走发送流程）
     */
    public function resetCustomerStatus(Request $request, string $quotationUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        /** @var SalesQuotation|null $qt */
        $qt = SalesQuotation::with('items')
            ->where('quotation_uid', $quotationUid)
            ->orWhere('qt_number', $quotationUid)
            ->first();

        if (!$qt) {
            return response()->json(['message' => 'Quotation not found'], 404);
        }

        if (($user->portal_role ?? '') !== 'admin' && (string) $qt->sales_person_email !== (string) $user->email) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $qt->customer_status = 'not_sent';
        $qt->sent_at = null;
        $qt->customer_response = null;
        $qt->save();

        return response()->json([
            'message' => 'Customer status reset to not_sent',
            'quotation' => $this->toDto($qt->fresh('items')),
        ], 200);
    }

    private function toDto(SalesQuotation $qt): array
    {
        return [
            'id' => (string) $qt->quotation_uid,
            'qtNumber' => $qt->qt_number,
            'qrNumber' => $qt->qr_number,
            'inqNumber' => $qt->inq_number,
            'region' => $qt->region,
            'customerName' => $qt->customer_name,
            'customerEmail' => $qt->customer_email,
            'customerCompany' => $qt->customer_company,
            'customerPhone' => $qt->customer_phone,
            'customerAddress' => $qt->customer_address,
            'salesPerson' => $qt->sales_person_email,
            'salesPersonName' => $qt->sales_person_name,
            'items' => $qt->items->map(fn($item) => [
                'id' => (string) ($item->product_id ?? $item->id),
                'productName' => $item->product_name,
                'modelNo' => $item->model_no,
                'specification' => $item->specification,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'costPrice' => (float) $item->cost_price,
                'selectedSupplier' => $item->selected_supplier,
                'selectedSupplierName' => $item->selected_supplier_name,
                'selectedBJ' => $item->selected_bj,
                'moq' => $item->moq,
                'leadTime' => $item->lead_time,
                'salesPrice' => (float) $item->sales_price,
                'profitMargin' => (float) $item->profit_margin,
                'profit' => (float) $item->profit,
                'totalCost' => (float) $item->total_cost,
                'totalPrice' => (float) $item->total_price,
                'currency' => $item->currency,
                'hsCode' => $item->hs_code,
                'remarks' => $item->remarks,
            ])->toArray(),
            'totalCost' => (float) $qt->total_cost,
            'totalPrice' => (float) $qt->total_price,
            'totalProfit' => (float) $qt->total_profit,
            'profitRate' => (float) $qt->profit_rate,
            'currency' => $qt->currency,
            'paymentTerms' => $qt->payment_terms,
            'deliveryTerms' => $qt->delivery_terms,
            'deliveryDate' => $qt->delivery_date ? (string) $qt->delivery_date : null,
            'validUntil' => $qt->valid_until ? (string) $qt->valid_until : null,
            'approvalStatus' => $qt->approval_status,
            'approvalChain' => is_array($qt->approval_chain) ? $qt->approval_chain : [],
            'customerStatus' => $qt->customer_status,
            'customerResponse' => is_array($qt->customer_response) ? $qt->customer_response : null,
            'soNumber' => $qt->so_number,
            'pushedToContract' => (bool) $qt->pushed_to_contract,
            'pushedContractNumber' => $qt->pushed_contract_number,
            'pushedContractAt' => $qt->pushed_contract_at ? $qt->pushed_contract_at->toIso8601String() : null,
            'pushedBy' => $qt->pushed_by,
            'version' => $qt->version,
            'previousVersion' => $qt->previous_version,
            'notes' => $qt->notes,
            'customerNotes' => $qt->customer_notes,
            'internalNotes' => $qt->internal_notes,
            'remarks' => $qt->remarks,
            'tradeTerms' => is_array($qt->trade_terms) ? $qt->trade_terms : null,
            'createdAt' => $qt->created_at->toIso8601String(),
            'updatedAt' => $qt->updated_at->toIso8601String(),
            'sentAt' => $qt->sent_at ? $qt->sent_at->toIso8601String() : null,
        ];
    }

    /**
     * 客户视角 DTO：不返回成本价/利润等敏感字段
     */
    private function toCustomerDto(SalesQuotation $qt): array
    {
        return [
            'id' => (string) $qt->quotation_uid,
            'qtNumber' => $qt->qt_number,
            'inqNumber' => $qt->inq_number,
            'region' => $qt->region,
            'customerName' => $qt->customer_name,
            'customerEmail' => $qt->customer_email,
            'customerCompany' => $qt->customer_company,
            'customerPhone' => $qt->customer_phone,
            'customerAddress' => $qt->customer_address,
            'salesPersonName' => $qt->sales_person_name,
            'items' => $qt->items->map(fn($item) => [
                'id' => (string) ($item->product_id ?? $item->id),
                'productName' => $item->product_name,
                'modelNo' => $item->model_no,
                'specification' => $item->specification,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'salesPrice' => (float) $item->sales_price,
                'totalPrice' => (float) $item->total_price,
                'currency' => $item->currency,
                'hsCode' => $item->hs_code,
                'remarks' => $item->remarks,
            ])->toArray(),
            'totalPrice' => (float) $qt->total_price,
            'currency' => $qt->currency,
            'paymentTerms' => $qt->payment_terms,
            'deliveryTerms' => $qt->delivery_terms,
            'deliveryDate' => $qt->delivery_date ? (string) $qt->delivery_date : null,
            'validUntil' => $qt->valid_until ? (string) $qt->valid_until : null,
            'customerStatus' => $qt->customer_status,
            'customerResponse' => is_array($qt->customer_response) ? $qt->customer_response : null,
            'customerNotes' => $qt->customer_notes,
            'remarks' => $qt->remarks,
            'createdAt' => $qt->created_at->toIso8601String(),
            'updatedAt' => $qt->updated_at->toIso8601String(),
            'sentAt' => $qt->sent_at ? $qt->sent_at->toIso8601String() : null,
        ];
    }
}
