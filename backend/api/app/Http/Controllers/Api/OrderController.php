<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerOrder;
use App\Models\CustomerOrderItem;
use App\Models\CustomerOrderPaymentProof;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Create a new customer order (from cart / manual create).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // identifiers
            'orderNumber' => ['required', 'string', 'max:128'],
            'id' => ['nullable', 'string', 'max:128'], // frontend Order.id (optional)

            // customer snapshot (optional; will fallback to auth user)
            'customer' => ['nullable', 'string', 'max:255'],
            'customerEmail' => ['nullable', 'string', 'max:255'],

            // dates
            'date' => ['required', 'string', 'max:64'], // frontend uses string
            'expectedDelivery' => ['required', 'string', 'max:64'],

            // money / status
            'totalAmount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:8'],
            'status' => ['required', 'string', 'max:64'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'paymentStatus' => ['required', 'string', 'max:64'],
            'paymentTerms' => ['nullable', 'string', 'max:512'],
            'shippingMethod' => ['required', 'string', 'max:128'],
            'deliveryTerms' => ['nullable', 'string', 'max:255'],
            'trackingNumber' => ['nullable', 'string', 'max:128'],
            'notes' => ['nullable', 'string'],
            'createdFrom' => ['nullable', 'string', 'max:32'],

            // optional extra fields aligned with schema.sql
            'quotationNumber' => ['nullable', 'string', 'max:128'],
            'quotationId' => ['nullable', 'string', 'max:128'],
            'region' => ['nullable', 'string', 'max:64'],
            'country' => ['nullable', 'string', 'max:128'],
            'deliveryAddress' => ['nullable', 'string', 'max:512'],
            'contactPerson' => ['nullable', 'string', 'max:128'],
            'phone' => ['nullable', 'string', 'max:64'],
            'contractTerms' => ['nullable', 'array'],

            // items
            'products' => ['required', 'array', 'min:1'],
            'products.*.name' => ['required', 'string', 'max:255'],
            'products.*.quantity' => ['required', 'integer', 'min:1'],
            'products.*.unitPrice' => ['nullable', 'numeric', 'min:0'],
            'products.*.totalPrice' => ['nullable', 'numeric', 'min:0'],
            'products.*.specs' => ['nullable', 'string', 'max:512'],
            'products.*.produced' => ['nullable', 'integer', 'min:0'],
        ]);

        $authUser = $request->user();
        // 业务员/Admin 代客户创建订单（如“发送合同”）时传 customerEmail
        $customerEmail = (string) ($validated['customerEmail'] ?? '');
        $staffRoles = ['admin', 'Sales_Rep', 'Regional_Manager', 'Sales_Director'];
        $isStaff = in_array((string) ($authUser->portal_role ?? ''), $staffRoles, true);
        if (!$isStaff || $customerEmail === '') {
            $customerEmail = (string) ($authUser?->email ?? $customerEmail);
        }
        if ($customerEmail === '') {
            return response()->json(['message' => 'Missing customer email.'], 422);
        }

        $customerName = (string) (($validated['customer'] ?? null) ?: ($authUser?->username ?? $authUser?->name ?? $customerEmail));

        // Use frontend id if provided; otherwise derive a stable UID.
        $orderUid = (string) (($validated['id'] ?? null) ?: $validated['orderNumber']);
        if ($orderUid === '') {
            $orderUid = 'ORD-' . Str::upper(Str::random(12));
        }

        $progress = (int) ($validated['progress'] ?? 0);

        $order = DB::transaction(function () use ($validated, $customerEmail, $customerName, $orderUid, $progress) {
            $now = now();

            /** @var CustomerOrder $order */
            $order = CustomerOrder::query()->create([
                'order_uid' => $orderUid,
                'order_number' => $validated['orderNumber'],
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'quotation_number' => $validated['quotationNumber'] ?? null,
                'quotation_id' => $validated['quotationId'] ?? null,
                'order_date' => $validated['date'],
                'expected_delivery' => $validated['expectedDelivery'],
                'total_amount' => $validated['totalAmount'],
                'currency' => $validated['currency'],
                'status' => $validated['status'],
                'progress' => $progress,
                'payment_status' => $validated['paymentStatus'],
                'payment_terms' => $validated['paymentTerms'] ?? null,
                'shipping_method' => $validated['shippingMethod'],
                'delivery_terms' => $validated['deliveryTerms'] ?? null,
                'tracking_number' => $validated['trackingNumber'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_from' => $validated['createdFrom'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
                'region' => $validated['region'] ?? null,
                'country' => $validated['country'] ?? null,
                'delivery_address' => $validated['deliveryAddress'] ?? null,
                'contact_person' => $validated['contactPerson'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'contract_terms' => $validated['contractTerms'] ?? null,
            ]);

            $items = [];
            foreach ($validated['products'] as $p) {
                $items[] = [
                    'order_id' => $order->id,
                    'name' => $p['name'],
                    'quantity' => (int) $p['quantity'],
                    'unit_price' => $p['unitPrice'] ?? null,
                    'total_price' => $p['totalPrice'] ?? null,
                    'specs' => $p['specs'] ?? null,
                    'produced' => $p['produced'] ?? null,
                ];
            }
            CustomerOrderItem::query()->insert($items);

            return $order->fresh(['items']);
        });

        return response()->json([
            'order' => [
                'id' => $order->order_uid,
                'orderNumber' => $order->order_number,
                'customer' => $order->customer_name,
                'customerEmail' => $order->customer_email,
                'quotationId' => $order->quotation_id,
                'quotationNumber' => $order->quotation_number,
                'date' => (string) $order->order_date,
                'expectedDelivery' => (string) $order->expected_delivery,
                'totalAmount' => (float) $order->total_amount,
                'currency' => $order->currency,
                'status' => $order->status,
                'progress' => (int) $order->progress,
                'paymentStatus' => $order->payment_status,
                'paymentTerms' => $order->payment_terms,
                'shippingMethod' => $order->shipping_method,
                'deliveryTerms' => $order->delivery_terms,
                'trackingNumber' => $order->tracking_number,
                'notes' => $order->notes,
                'createdFrom' => $order->created_from,
                'region' => $order->region,
                'country' => $order->country,
                'deliveryAddress' => $order->delivery_address,
                'contactPerson' => $order->contact_person,
                'phone' => $order->phone,
                'contractTerms' => $order->contract_terms,
                'products' => $order->items->map(fn ($it) => [
                    'name' => $it->name,
                    'quantity' => (int) $it->quantity,
                    'unitPrice' => $it->unit_price,
                    'totalPrice' => $it->total_price,
                    'specs' => $it->specs,
                    'produced' => $it->produced,
                ])->values(),
            ],
        ], 201);
    }

    /**
     * List orders: 客户只看自己的；Admin/财务 看全部（供应收账款等用）
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['orders' => []]);
        }

        $staffRoles = ['admin', 'Sales_Rep', 'Regional_Manager', 'Sales_Director', 'Procurement_Manager', 'Procurement_Specialist'];
        $isStaff = in_array((string) ($user->portal_role ?? ''), $staffRoles, true);

        $query = CustomerOrder::query()->orderByDesc('id')->with('items', 'paymentProofs')->limit(500);
        if (!$isStaff) {
            $query->where('customer_email', (string) $user->email);
        }

        $orders = $query->get();

        return response()->json([
            'orders' => $orders->map(fn (CustomerOrder $o) => $this->orderToDto($o))->values(),
        ]);
    }

    /**
     * Build order DTO for API response (includes payment proofs from customer_order_payment_proofs).
     */
    private function orderToDto(CustomerOrder $o): array
    {
        $proofs = $o->relationLoaded('paymentProofs') ? $o->paymentProofs : $o->paymentProofs()->get();
        $depositPayment = $proofs->where('proof_type', 'deposit_payment')->sortByDesc('id')->first();
        $balancePayment = $proofs->where('proof_type', 'balance_payment')->sortByDesc('id')->first();
        $depositReceipt = $proofs->where('proof_type', 'deposit_receipt')->sortByDesc('id')->first();
        $balanceReceipt = $proofs->where('proof_type', 'balance_receipt')->sortByDesc('id')->first();

        $dto = [
            'id' => $o->order_uid,
            'orderNumber' => $o->order_number,
            'customer' => $o->customer_name,
            'customerEmail' => $o->customer_email,
            'quotationId' => $o->quotation_id,
            'quotationNumber' => $o->quotation_number,
            'date' => (string) $o->order_date,
            'expectedDelivery' => (string) $o->expected_delivery,
            'totalAmount' => (float) $o->total_amount,
            'currency' => $o->currency,
            'status' => $o->status,
            'progress' => (int) $o->progress,
            'paymentStatus' => $o->payment_status,
            'paymentTerms' => $o->payment_terms,
            'shippingMethod' => $o->shipping_method,
            'deliveryTerms' => $o->delivery_terms,
            'trackingNumber' => $o->tracking_number,
            'notes' => $o->notes,
            'createdFrom' => $o->created_from,
            'region' => $o->region,
            'country' => $o->country,
            'deliveryAddress' => $o->delivery_address,
            'contactPerson' => $o->contact_person,
            'phone' => $o->phone,
            'contractTerms' => $o->contract_terms,
            'customerFeedback' => $o->customer_feedback,
            'products' => $o->items->map(fn ($it) => [
                'name' => $it->name,
                'quantity' => (int) $it->quantity,
                'unitPrice' => $it->unit_price,
                'totalPrice' => $it->total_price,
                'specs' => $it->specs,
                'produced' => $it->produced,
            ])->values(),
        ];

        if ($depositPayment) {
            $dto['depositPaymentProof'] = [
                'uploadedAt' => $depositPayment->uploaded_at?->toIso8601String(),
                'uploadedBy' => $depositPayment->uploaded_by,
                'fileUrl' => $depositPayment->file_url,
                'fileName' => $depositPayment->file_name,
                'amount' => (float) $depositPayment->amount,
                'currency' => $depositPayment->currency,
                'notes' => $depositPayment->notes,
                'status' => $depositPayment->status,
                'confirmedAt' => $depositPayment->confirmed_at?->toIso8601String(),
                'confirmedBy' => $depositPayment->confirmed_by,
                'rejectedReason' => $depositPayment->rejected_reason,
            ];
        }
        if ($balancePayment) {
            $dto['balancePaymentProof'] = [
                'uploadedAt' => $balancePayment->uploaded_at?->toIso8601String(),
                'uploadedBy' => $balancePayment->uploaded_by,
                'fileUrl' => $balancePayment->file_url,
                'fileName' => $balancePayment->file_name,
                'amount' => (float) $balancePayment->amount,
                'currency' => $balancePayment->currency,
                'notes' => $balancePayment->notes,
                'status' => $balancePayment->status,
                'confirmedAt' => $balancePayment->confirmed_at?->toIso8601String(),
                'confirmedBy' => $balancePayment->confirmed_by,
                'rejectedReason' => $balancePayment->rejected_reason,
            ];
        }
        if ($depositReceipt) {
            $dto['depositReceiptProof'] = [
                'uploadedAt' => $depositReceipt->uploaded_at?->toIso8601String(),
                'uploadedBy' => $depositReceipt->uploaded_by,
                'fileUrl' => $depositReceipt->file_url,
                'fileName' => $depositReceipt->file_name,
                'actualAmount' => (float) ($depositReceipt->actual_amount ?? $depositReceipt->amount),
                'currency' => $depositReceipt->currency,
                'receiptDate' => $depositReceipt->receipt_date?->format('Y-m-d'),
                'bankReference' => $depositReceipt->bank_reference,
                'notes' => $depositReceipt->notes,
            ];
        }
        if ($balanceReceipt) {
            $dto['balanceReceiptProof'] = [
                'uploadedAt' => $balanceReceipt->uploaded_at?->toIso8601String(),
                'uploadedBy' => $balanceReceipt->uploaded_by,
                'fileUrl' => $balanceReceipt->file_url,
                'fileName' => $balanceReceipt->file_name,
                'actualAmount' => (float) ($balanceReceipt->actual_amount ?? $balanceReceipt->amount),
                'currency' => $balanceReceipt->currency,
                'receiptDate' => $balanceReceipt->receipt_date?->format('Y-m-d'),
                'bankReference' => $balanceReceipt->bank_reference,
                'notes' => $balanceReceipt->notes,
            ];
        }

        return $dto;
    }

    /**
     * PATCH /api/orders/{orderUid}/customer-response
     *
     * 客户对订单/合同提交确认：Accept / Request Changes / Cancel（落库 customer_feedback + status）
     * body: { response: 'accept'|'negotiate'|'reject', message?: string }
     */
    public function customerResponse(Request $request, string $orderUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'response' => ['required', 'string', 'in:accept,negotiate,reject'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $order = CustomerOrder::query()
            ->where('customer_email', $user->email)
            ->where(fn ($q) => $q->where('order_uid', $orderUid)->orWhere('order_number', $orderUid))
            ->with('items')
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->customer_feedback && !empty($order->customer_feedback['status'] ?? null)) {
            return response()->json(['message' => 'Already responded'], 400);
        }

        $responseType = (string) $validated['response'];
        $message = trim((string) ($validated['message'] ?? ''));
        if (in_array($responseType, ['negotiate', 'reject'], true) && $message === '') {
            $message = $responseType === 'reject' ? 'Customer declined' : 'Customer requested changes';
        }

        $feedback = [
            'status' => $responseType === 'accept' ? 'accepted' : ($responseType === 'reject' ? 'cancelled' : 'negotiating'),
            'message' => $message,
            'submittedAt' => now()->toIso8601String(),
            'submittedBy' => (string) $user->email,
        ];

        $order->customer_feedback = $feedback;

        if ($responseType === 'accept') {
            $order->status = 'Awaiting Deposit';
            $order->confirmed = true;
            $order->confirmed_at = now();
            $order->confirmed_by = $user->email;
            $order->confirmed_date = now()->toDateString();
        } elseif ($responseType === 'reject') {
            $order->status = 'Cancelled';
        }
        // negotiate: keep status as is (e.g. Pending), only feedback stored

        $order->updated_at = now();
        $order->save();

        $dto = [
            'id' => $order->order_uid,
            'orderNumber' => $order->order_number,
            'customer' => $order->customer_name,
            'customerEmail' => $order->customer_email,
            'quotationNumber' => $order->quotation_number,
            'date' => (string) $order->order_date,
            'expectedDelivery' => (string) $order->expected_delivery,
            'totalAmount' => (float) $order->total_amount,
            'currency' => $order->currency,
            'status' => $order->status,
            'progress' => (int) $order->progress,
            'paymentStatus' => $order->payment_status,
            'paymentTerms' => $order->payment_terms,
            'shippingMethod' => $order->shipping_method,
            'deliveryTerms' => $order->delivery_terms,
            'customerFeedback' => $order->customer_feedback,
            'products' => $order->items->map(fn ($it) => [
                'name' => $it->name,
                'quantity' => (int) $it->quantity,
                'unitPrice' => $it->unit_price,
                'totalPrice' => $it->total_price,
                'specs' => $it->specs,
                'produced' => $it->produced,
            ])->values(),
        ];

        return response()->json([
            'message' => $responseType === 'accept' ? 'Accepted' : ($responseType === 'reject' ? 'Cancelled' : 'Feedback submitted'),
            'order' => $dto,
        ]);
    }

    /**
     * PATCH /api/orders/{orderUid}/upload-payment-proof
     *
     * 客户上传定金/余款付款凭证（落库 customer_order_payment_proofs + 更新订单状态）
     * body: { type: 'deposit'|'balance', amount: number, transactionId: string, notes?: string, fileUrl: string, fileName?: string }
     */
    public function uploadPaymentProof(Request $request, string $orderUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:deposit,balance'],
            'amount' => ['required', 'numeric', 'min:0'],
            'transactionId' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1024'],
            'fileUrl' => ['required', 'string', 'max:1024'], // 只存服务器 URL，不存 base64
            'fileName' => ['nullable', 'string', 'max:255'],
        ]);
        if (strpos($validated['fileUrl'], 'data:') === 0) {
            return response()->json(['message' => 'Please upload the file first and use the returned file URL.'], 422);
        }

        $order = CustomerOrder::query()
            ->where('customer_email', $user->email)
            ->where(fn ($q) => $q->where('order_uid', $orderUid)->orWhere('order_number', $orderUid))
            ->with('items', 'paymentProofs')
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $proofType = $validated['type'] === 'deposit' ? 'deposit_payment' : 'balance_payment';
        $existing = $order->paymentProofs->where('proof_type', $proofType)->first();
        if ($existing) {
            return response()->json(['message' => $validated['type'] === 'deposit' ? 'Deposit proof already uploaded.' : 'Balance proof already uploaded.'], 400);
        }

        $notes = trim((string) ($validated['notes'] ?? ''));
        if ($notes === '') {
            $notes = 'Payment Reference: ' . $validated['transactionId'];
        } else {
            $notes = 'Ref: ' . $validated['transactionId'] . ' | ' . $notes;
        }

        $userEmail = (string) $user->email;
        DB::transaction(function () use ($order, $validated, $proofType, $notes, $userEmail) {
            CustomerOrderPaymentProof::query()->create([
                'order_id' => $order->id,
                'proof_type' => $proofType,
                'uploaded_at' => now(),
                'uploaded_by' => $userEmail,
                'file_url' => $validated['fileUrl'],
                'file_name' => $validated['fileName'] ?? $proofType . '_proof_' . $order->order_number . '.jpg',
                'amount' => (float) $validated['amount'],
                'currency' => $order->currency,
                'notes' => $notes,
                'status' => 'pending',
            ]);

            $order->status = 'Payment Proof Uploaded';
            $order->payment_status = $validated['type'] === 'deposit' ? 'Deposit Proof Uploaded' : 'Balance Proof Uploaded';
            // 财务上传收款凭证后，推进订单状态，确保客户端/业务员端可见“定金收到/全款已收”。
            if ($validated['type'] === 'deposit') {
                $order->status = 'Deposit Received';
                $order->payment_status = 'Deposit Confirmed';
            } else {
                $order->payment_status = 'Fully Paid';
                // 若订单仍停留在收款阶段，余款到账后推进到可发货阶段
                if (in_array((string) $order->status, ['Payment Proof Uploaded', 'Deposit Received', 'Preparing Production'], true)) {
                    $order->status = 'Ready to Ship';
                }
            }

            $order->updated_at = now();
            $order->save();
        });

        $order->refresh();
        $order->load(['items', 'paymentProofs']);
        $dto = $this->orderToDto($order);

        return response()->json([
            'message' => ($validated['type'] === 'deposit' ? 'Deposit' : 'Balance') . ' payment proof uploaded.',
            'order' => $dto,
        ]);
    }

    /**
     * PATCH /api/orders/{orderUid}/upload-receipt-proof
     *
     * 财务上传定金/余款收款凭证（落库 customer_order_payment_proofs）。
     * body: {
     *   type: 'deposit'|'balance',
     *   actualAmount: number,
     *   receiptDate: 'YYYY-MM-DD',
     *   bankReference: string,
     *   notes?: string,
     *   fileUrl?: string,
     *   fileName?: string
     * }
     */
    public function uploadReceiptProof(Request $request, string $orderUid)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // 财务/管理角色可操作；客户仅可操作自己的订单（用于兼容测试环境）
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

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:deposit,balance'],
            'actualAmount' => ['required', 'numeric', 'min:0'],
            'receiptDate' => ['required', 'date'],
            'bankReference' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1024'],
            'fileUrl' => ['nullable', 'string', 'max:1024'],
            'fileName' => ['nullable', 'string', 'max:255'],
        ]);

        $query = CustomerOrder::query()
            ->where(fn ($q) => $q->where('order_uid', $orderUid)->orWhere('order_number', $orderUid));
        if (!$isStaff) {
            $query->where('customer_email', $user->email);
        }
        $order = $query->with('items', 'paymentProofs')->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $receiptProofType = $validated['type'] === 'deposit' ? 'deposit_receipt' : 'balance_receipt';
        $paymentProofType = $validated['type'] === 'deposit' ? 'deposit_payment' : 'balance_payment';
        $uploadBy = (string) ($user->email ?? 'finance@gaoshengda.com');

        DB::transaction(function () use ($order, $validated, $receiptProofType, $paymentProofType, $uploadBy) {
            /** @var CustomerOrderPaymentProof|null $existingReceipt */
            $existingReceipt = CustomerOrderPaymentProof::query()
                ->where('order_id', $order->id)
                ->where('proof_type', $receiptProofType)
                ->orderByDesc('id')
                ->first();

            $payload = [
                'uploaded_at' => now(),
                'uploaded_by' => $uploadBy,
                'file_url' => $validated['fileUrl'] ?? null,
                'file_name' => $validated['fileName'] ?? ($receiptProofType . '_' . $order->order_number . '.pdf'),
                'amount' => (float) $validated['actualAmount'],
                'actual_amount' => (float) $validated['actualAmount'],
                'currency' => $order->currency,
                'receipt_date' => $validated['receiptDate'],
                'bank_reference' => $validated['bankReference'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'confirmed_by' => $uploadBy,
                'rejected_reason' => null,
            ];

            if ($existingReceipt) {
                $existingReceipt->fill($payload);
                $existingReceipt->save();
            } else {
                CustomerOrderPaymentProof::query()->create([
                    'order_id' => $order->id,
                    'proof_type' => $receiptProofType,
                    ...$payload,
                ]);
            }

            // 同步更新客户付款凭证状态为 confirmed（若存在）
            $paymentProof = CustomerOrderPaymentProof::query()
                ->where('order_id', $order->id)
                ->where('proof_type', $paymentProofType)
                ->orderByDesc('id')
                ->first();
            if ($paymentProof) {
                $paymentProof->status = 'confirmed';
                $paymentProof->confirmed_at = now();
                $paymentProof->confirmed_by = $uploadBy;
                $paymentProof->rejected_reason = null;
                $paymentProof->save();
            }

            $order->updated_at = now();
            $order->save();
        });

        $order->refresh();
        $order->load(['items', 'paymentProofs']);
        $dto = $this->orderToDto($order);

        return response()->json([
            'message' => ($validated['type'] === 'deposit' ? 'Deposit' : 'Balance') . ' receipt proof uploaded.',
            'order' => $dto,
        ]);
    }

    /**
     * POST /api/upload-payment-proof-file
     *
     * 先上传凭证文件到服务器，返回可访问的 URL；提交表单时只传此 URL，不传 base64。
     * 请求: multipart/form-data, 字段 file (required)，支持 jpeg/jpg/png/pdf，最大 10MB。
     * 返回: { fileUrl: string, fileName: string }
     * 服务器需执行: php artisan storage:link （将 storage/app/public 链接到 public/storage）
     */
    public function uploadProofFile(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpeg,jpg,png,pdf'],
        ]);

        $file = $request->file('file');
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $name = Str::uuid() . '.' . $ext;
        $path = $file->storeAs('payment-proofs', $name, 'public');
        $url = Storage::disk('public')->url($path);
        if (strpos($url, 'http') !== 0) {
            $url = rtrim(config('app.url', ''), '/') . '/' . ltrim($url, '/');
        }

        return response()->json([
            'fileUrl' => $url,
            'fileName' => $file->getClientOriginalName(),
        ]);
    }
}

