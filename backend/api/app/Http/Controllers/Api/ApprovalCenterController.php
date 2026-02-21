<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesContract;
use App\Models\SalesQuotation;
use Illuminate\Http\Request;

/**
 * 审批中心（主管/总监）接口
 *
 * 当前仅实现：销售报价单（QT）的审批列表（从 sales_quotations.approval_status / approval_chain 读取）
 */
class ApprovalCenterController extends Controller
{
    /**
     * GET /api/approval-center/quotation-requests
     *
     * 返回审批中心需要展示的请求列表（按当前登录用户计算「待我审批 / 我已审批 / 我已驳回 / 我发起的」）
     */
    public function quotationRequests(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $email = (string) ($user->email ?? '');
        $targetEmail = $email;

        // 🔥 兼容“前端切换角色但 token 仍是 admin”的场景：
        // 仅当当前 token 为 admin 时，允许用 asEmail 指定要查看/审批的邮箱视角
        $asEmail = (string) ($request->query('asEmail') ?? '');
        if (($user->portal_role ?? '') === 'admin' && $asEmail !== '') {
            $targetEmail = $asEmail;
        }

        // Candidates (recent approvals workflow items)
        $candidates = SalesQuotation::with('items')
            ->where('approval_status', '!=', 'draft')
            ->orderByDesc('updated_at')
            ->limit(500)
            ->get();

        $pending = [];
        $approved = [];
        $rejected = [];

        foreach ($candidates as $qt) {
            [$currentStep, $requiresDirector] = $this->getApprovalMeta($qt);

            // 1) 待我审批：当前 pending step 的审批人就是我
            if ($currentStep && (($currentStep['approverEmail'] ?? '') === $targetEmail)) {
                $pending[] = $this->toApprovalRequest($qt, [
                    'status' => 'pending',
                    'currentApprover' => (string) ($currentStep['approverEmail'] ?? ''),
                    'currentApproverRole' => $this->mapApproverRoleToSystemRole((string) ($currentStep['approverRole'] ?? '')),
                    'requiresDirectorApproval' => $requiresDirector,
                ]);
                continue;
            }

            // 2) 我已驳回：我对应的 step 被标记为 rejected
            if ($this->hasStepWithStatus($qt, $targetEmail, 'rejected')) {
                $rejected[] = $this->toApprovalRequest($qt, [
                    'status' => 'rejected',
                    'currentApprover' => $this->getCurrentApproverEmail($qt) ?? '',
                    'currentApproverRole' => $this->mapApproverRoleToSystemRole((string) ($this->getCurrentApproverRoleLabel($qt) ?? '')),
                    'requiresDirectorApproval' => $this->hasDirectorStep($qt),
                ]);
                continue;
            }

            // 3) 我已审批：我对应的 step 被标记为 approved
            // - 例如：主管批准后转给总监，此时主管应出现在“我已审批”
            if ($this->hasStepWithStatus($qt, $targetEmail, 'approved')) {
                $approved[] = $this->toApprovalRequest($qt, [
                    'status' => 'approved',
                    'currentApprover' => $this->getCurrentApproverEmail($qt) ?? '',
                    'currentApproverRole' => $this->mapApproverRoleToSystemRole((string) ($this->getCurrentApproverRoleLabel($qt) ?? '')),
                    'requiresDirectorApproval' => $this->hasDirectorStep($qt),
                ]);
                continue;
            }
        }

        // Submitted by me (business rep)
        $submittedQuotations = SalesQuotation::with('items')
            ->where('sales_person_email', $targetEmail)
            ->where('approval_status', '!=', 'draft')
            ->orderByDesc('updated_at')
            ->limit(500)
            ->get();

        $submitted = array_map(fn($qt) => $this->toApprovalRequest($qt, [
            'status' => $this->mapApprovalStatusToRequestStatus((string) $qt->approval_status),
            'currentApprover' => $this->getCurrentApproverEmail($qt) ?? '',
            'currentApproverRole' => $this->mapApproverRoleToSystemRole((string) ($this->getCurrentApproverRoleLabel($qt) ?? '')),
            'requiresDirectorApproval' => $this->hasDirectorStep($qt),
        ]), $submittedQuotations->all());

        return response()->json([
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'submitted' => $submitted,
        ]);
    }

    /**
     * GET /api/approval-center/contract-requests
     *
     * 销售合同（SC）审批列表（从 sales_contracts.status / approval_history 读取）
     */
    public function contractRequests(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $email = (string) ($user->email ?? '');
        $targetEmail = $email;

        $asEmail = (string) ($request->query('asEmail') ?? '');
        if (($user->portal_role ?? '') === 'admin' && $asEmail !== '') {
            $targetEmail = $asEmail;
        }

        $candidates = SalesContract::with('products')
            ->where('status', '!=', 'draft')
            ->orderByDesc('updated_at')
            ->limit(500)
            ->get();

        $pending = [];
        $approved = [];
        $rejected = [];

        foreach ($candidates as $sc) {
            $currentApprover = $this->getContractCurrentApproverEmail($sc);

            if ($currentApprover !== '' && $currentApprover === $targetEmail
                && in_array((string) $sc->status, ['pending_supervisor', 'pending_director'], true)) {
                $pending[] = $this->toContractApprovalRequest($sc, [
                    'status' => 'pending',
                    'currentApprover' => $currentApprover,
                    'currentApproverRole' => ((string) $sc->status === 'pending_director') ? 'Sales_Director' : 'Regional_Manager',
                    'requiresDirectorApproval' => $this->contractRequiresDirector($sc),
                ]);
                continue;
            }

            if ($this->contractHasHistoryAction($sc, $targetEmail, 'rejected')) {
                $rejected[] = $this->toContractApprovalRequest($sc, [
                    'status' => 'rejected',
                    'currentApprover' => $currentApprover,
                    'currentApproverRole' => ((string) $sc->status === 'pending_director') ? 'Sales_Director' : 'Regional_Manager',
                    'requiresDirectorApproval' => $this->contractRequiresDirector($sc),
                ]);
                continue;
            }

            if ($this->contractHasHistoryAction($sc, $targetEmail, 'approved')) {
                $approved[] = $this->toContractApprovalRequest($sc, [
                    'status' => 'approved',
                    'currentApprover' => $currentApprover,
                    'currentApproverRole' => ((string) $sc->status === 'pending_director') ? 'Sales_Director' : 'Regional_Manager',
                    'requiresDirectorApproval' => $this->contractRequiresDirector($sc),
                ]);
                continue;
            }
        }

        // 我发起的：按业务员邮箱
        $submittedContracts = SalesContract::with('products')
            ->where('sales_person_email', $targetEmail)
            ->where('status', '!=', 'draft')
            ->orderByDesc('updated_at')
            ->limit(500)
            ->get();

        $submitted = array_map(fn($sc) => $this->toContractApprovalRequest($sc, [
            'status' => $this->mapContractStatusToRequestStatus((string) $sc->status),
            'currentApprover' => $this->getContractCurrentApproverEmail($sc),
            'currentApproverRole' => ((string) $sc->status === 'pending_director') ? 'Sales_Director' : 'Regional_Manager',
            'requiresDirectorApproval' => $this->contractRequiresDirector($sc),
        ]), $submittedContracts->all());

        return response()->json([
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'submitted' => $submitted,
        ]);
    }

    private function toContractApprovalRequest(SalesContract $sc, array $meta): array
    {
        $products = $sc->products ?? collect();
        $count = $products->count();
        $productSummary = $count <= 0
            ? '无产品'
            : ($count === 1
                ? ($products[0]->product_name . ' × ' . $products[0]->quantity . ' ' . ($products[0]->unit ?? ''))
                : ($products[0]->product_name . ' × ' . $products[0]->quantity . ' ' . ($products[0]->unit ?? '') . ' 等 ' . $count . ' 项产品'));

        $amount = (float) ($sc->total_amount ?? 0);
        $urgency = $amount >= 50000 ? 'high' : ($amount >= 20000 ? 'normal' : 'low');

        $submittedAt = $sc->submitted_at ? $sc->submitted_at->toIso8601String()
            : ($sc->updated_at ? $sc->updated_at->toIso8601String() : now()->toIso8601String());
        $deadline = $sc->submitted_at ? $sc->submitted_at->copy()->addHours(24)->toIso8601String()
            : (now()->addHours(24)->toIso8601String());

        // 直接复用 SalesContractController DTO（字段名与前端一致）
        $dto = app(SalesContractController::class)->toDto($sc);

        return [
            'id' => 'APR-SC-' . (string) $sc->contract_uid,
            'type' => 'sales_contract',
            'relatedDocumentId' => (string) $sc->contract_number,
            'relatedDocumentType' => '销售合同',
            'relatedDocument' => $dto,
            'submittedBy' => (string) $sc->sales_person_email,
            'submittedByName' => (string) $sc->sales_person_name,
            'submittedByRole' => 'Sales_Rep',
            'submittedAt' => $submittedAt,
            'region' => (string) $sc->region,
            'currentApprover' => (string) ($meta['currentApprover'] ?? ''),
            'currentApproverRole' => (string) ($meta['currentApproverRole'] ?? ''),
            'nextApprover' => ((bool) ($meta['requiresDirectorApproval'] ?? false) && (string) $sc->status === 'pending_supervisor')
                ? 'sales.director@cosun.com'
                : null,
            'nextApproverRole' => ((bool) ($meta['requiresDirectorApproval'] ?? false) && (string) $sc->status === 'pending_supervisor')
                ? 'Sales_Director'
                : null,
            'requiresDirectorApproval' => (bool) ($meta['requiresDirectorApproval'] ?? false),
            'status' => (string) ($meta['status'] ?? 'pending'),
            'urgency' => $urgency,
            'amount' => $amount,
            'currency' => $sc->currency ?? 'USD',
            'customerName' => $sc->customer_company ?? $sc->customer_name,
            'customerEmail' => $sc->customer_email,
            'productSummary' => $productSummary,
            'approvalHistory' => [
                [
                    'id' => 'hist_sc_' . (string) $sc->contract_uid,
                    'approver' => $sc->sales_person_email,
                    'approverName' => $sc->sales_person_name,
                    'approverRole' => 'Sales_Rep',
                    'action' => 'submitted',
                    'comment' => '提交审批',
                    'timestamp' => $submittedAt,
                ],
            ],
            'deadline' => $deadline,
            'expiresIn' => 24,
        ];
    }

    private function getContractCurrentApproverEmail(SalesContract $sc): string
    {
        $status = (string) $sc->status;
        if ($status === 'pending_director') return 'sales.director@cosun.com';
        if ($status === 'pending_supervisor') return $this->getRegionalManagerEmail((string) $sc->region);
        return '';
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

    private function contractRequiresDirector(SalesContract $sc): bool
    {
        $flow = is_array($sc->approval_flow) ? $sc->approval_flow : [];
        if (array_key_exists('requiresDirectorApproval', $flow)) {
            return (bool) $flow['requiresDirectorApproval'];
        }
        return ((float) $sc->total_amount) >= 20000;
    }

    private function contractHasHistoryAction(SalesContract $sc, string $email, string $action): bool
    {
        $history = is_array($sc->approval_history) ? $sc->approval_history : [];
        $email = strtolower(trim($email));
        foreach ($history as $h) {
            $actor = strtolower(trim((string) ($h['actor'] ?? '')));
            if ($actor !== $email) continue;
            if ((string) ($h['action'] ?? '') === $action) return true;
        }
        return false;
    }

    private function mapContractStatusToRequestStatus(string $status): string
    {
        return match ($status) {
            'approved' => 'approved',
            'rejected' => 'rejected',
            default => 'pending',
        };
    }

    private function toApprovalRequest(SalesQuotation $qt, array $meta): array
    {
        $items = $qt->items ?? collect();
        $productCount = $items->count();
        $productSummary = $productCount <= 0
            ? '无产品'
            : ($productCount === 1
                ? ($items[0]->product_name . ' × ' . $items[0]->quantity . ' ' . ($items[0]->unit ?? ''))
                : ($items[0]->product_name . ' × ' . $items[0]->quantity . ' ' . ($items[0]->unit ?? '') . ' 等 ' . $productCount . ' 项产品'));

        $amount = (float) ($qt->total_price ?? 0);
        $urgency = $amount >= 50000 ? 'high' : ($amount >= 20000 ? 'normal' : 'low');

        // 提交审批时间：使用 updated_at（提交审批会更新该行）
        $submittedAt = $qt->updated_at ? $qt->updated_at->toIso8601String() : now()->toIso8601String();
        $deadline = $qt->updated_at ? $qt->updated_at->copy()->addHours(24)->toIso8601String() : now()->addHours(24)->toIso8601String();

        return [
            'id' => 'APR-QT-' . (string) $qt->quotation_uid,
            'type' => 'quotation',
            'relatedDocumentId' => $qt->qt_number,
            'relatedDocumentType' => '销售报价单',
            'relatedDocument' => [
                // 使用和 SalesQuotationController::toDto 类似的结构（ApprovalCenter 详情页会用到）
                'id' => (string) $qt->quotation_uid,
                'qtNumber' => $qt->qt_number,
                'qrNumber' => $qt->qr_number,
                'inqNumber' => $qt->inq_number,
                'region' => $qt->region,
                'customerName' => $qt->customer_name,
                'customerEmail' => $qt->customer_email,
                'customerCompany' => $qt->customer_company,
                'salesPerson' => $qt->sales_person_email,
                'salesPersonName' => $qt->sales_person_name,
                'items' => $items->map(fn($i) => [
                    'productName' => $i->product_name,
                    'modelNo' => $i->model_no,
                    'specification' => $i->specification,
                    'quantity' => $i->quantity,
                    'unit' => $i->unit,
                    'salesPrice' => (float) $i->sales_price,
                    'unitPrice' => (float) $i->sales_price,
                    'moq' => $i->moq,
                    'leadTime' => $i->lead_time,
                ])->toArray(),
                'currency' => $qt->currency,
                'paymentTerms' => $qt->payment_terms,
                'deliveryTerms' => $qt->delivery_terms,
                'deliveryTime' => $qt->delivery_date ? (string) $qt->delivery_date : null,
            ],
            'submittedBy' => $qt->sales_person_email,
            'submittedByName' => $qt->sales_person_name,
            'submittedByRole' => 'Sales_Rep',
            'submittedAt' => $submittedAt,
            'region' => $qt->region,
            'currentApprover' => (string) ($meta['currentApprover'] ?? ''),
            'currentApproverRole' => (string) ($meta['currentApproverRole'] ?? ''),
            'nextApprover' => null,
            'nextApproverRole' => null,
            'requiresDirectorApproval' => (bool) ($meta['requiresDirectorApproval'] ?? false),
            'status' => (string) ($meta['status'] ?? 'pending'),
            'urgency' => $urgency,
            'amount' => $amount,
            'currency' => $qt->currency ?? 'USD',
            'customerName' => $qt->customer_company,
            'customerEmail' => $qt->customer_email,
            'productSummary' => $productSummary,
            'approvalHistory' => [
                [
                    'id' => 'hist_' . (string) $qt->quotation_uid,
                    'approver' => $qt->sales_person_email,
                    'approverName' => $qt->sales_person_name,
                    'approverRole' => 'Sales_Rep',
                    'action' => 'submitted',
                    'comment' => '提交审批',
                    'timestamp' => $submittedAt,
                ],
            ],
            'deadline' => $deadline,
            'expiresIn' => 24,
        ];
    }

    private function mapApprovalStatusToRequestStatus(string $approvalStatus): string
    {
        return match ($approvalStatus) {
            'approved' => 'approved',
            'rejected' => 'rejected',
            default => 'pending',
        };
    }

    private function mapApproverRoleToSystemRole(string $label): string
    {
        if ($label === '销售总监' || $label === 'Sales_Director') return 'Sales_Director';
        return 'Regional_Manager';
    }

    private function getApprovalMeta(SalesQuotation $qt): array
    {
        $chain = is_array($qt->approval_chain) ? $qt->approval_chain : [];
        $requiresDirector = false;
        foreach ($chain as $step) {
            if ((int)($step['level'] ?? 0) === 2) $requiresDirector = true;
        }
        $current = null;
        foreach ($chain as $step) {
            if (($step['status'] ?? '') === 'pending') {
                $current = $step;
                break;
            }
        }
        return [$current, $requiresDirector];
    }

    private function hasDirectorStep(SalesQuotation $qt): bool
    {
        $chain = is_array($qt->approval_chain) ? $qt->approval_chain : [];
        foreach ($chain as $step) {
            if ((int)($step['level'] ?? 0) === 2) return true;
        }
        return false;
    }

    private function getCurrentApproverEmail(SalesQuotation $qt): ?string
    {
        [$current] = $this->getApprovalMeta($qt);
        if (!$current) return null;
        return isset($current['approverEmail']) ? (string) $current['approverEmail'] : null;
    }

    private function getCurrentApproverRoleLabel(SalesQuotation $qt): ?string
    {
        [$current] = $this->getApprovalMeta($qt);
        if (!$current) return null;
        return isset($current['approverRole']) ? (string) $current['approverRole'] : null;
    }

    private function hasStepWithStatus(SalesQuotation $qt, string $email, string $status): bool
    {
        $chain = is_array($qt->approval_chain) ? $qt->approval_chain : [];
        foreach ($chain as $step) {
            if ((string)($step['approverEmail'] ?? '') !== $email) continue;
            if ((string)($step['status'] ?? '') === $status) return true;
        }
        return false;
    }
}

