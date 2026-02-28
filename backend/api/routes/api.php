<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PurchaseRequirementController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierRfqController;
use App\Http\Controllers\Api\SupplierQuotationController;
use App\Http\Controllers\Api\SalesQuotationController;
use App\Http\Controllers\Api\SalesContractController;
use App\Http\Controllers\Api\ApprovalCenterController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Orders API (requires token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::patch('orders/{orderUid}/customer-response', [OrderController::class, 'customerResponse']);
    Route::patch('orders/{orderUid}/upload-payment-proof', [OrderController::class, 'uploadPaymentProof']);
    Route::patch('orders/{orderUid}/upload-receipt-proof', [OrderController::class, 'uploadReceiptProof']);
    Route::post('upload-payment-proof-file', [OrderController::class, 'uploadProofFile']);

    Route::get('inquiries', [InquiryController::class, 'index']);
    Route::post('inquiries', [InquiryController::class, 'store']);

    // Admin inquiries (read/write from DB)
    Route::get('admin/inquiries', [InquiryController::class, 'adminIndex']);
    Route::post('admin/inquiries', [InquiryController::class, 'adminStore']);
    Route::patch('admin/inquiries/{inquiryUid}', [InquiryController::class, 'adminUpdate']);
    Route::delete('admin/inquiries/{inquiryUid}', [InquiryController::class, 'adminDestroy']);

    // Purchase requirements
    Route::get('purchase-requirements', [PurchaseRequirementController::class, 'index']);
    Route::post('purchase-requirements', [PurchaseRequirementController::class, 'store']);
    Route::patch('purchase-requirements/{requirementUid}', [PurchaseRequirementController::class, 'update']);

    // Purchase orders (CG) - persisted via purchase_requirements backend
    Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store']);
    Route::patch('purchase-orders/{poRef}', [PurchaseOrderController::class, 'update']);
    Route::delete('purchase-orders/{poRef}', [PurchaseOrderController::class, 'destroy']);

    // Suppliers master data (from DB organizations)
    Route::get('suppliers', [SupplierController::class, 'index']);

    // Supplier RFQs (XJ) - procurement creates and submits to suppliers
    Route::post('supplier-rfqs', [SupplierRfqController::class, 'store']);
    Route::get('supplier-rfqs/mine', [SupplierRfqController::class, 'mine']);
    Route::delete('supplier-rfqs/mine', [SupplierRfqController::class, 'clearMine']);
    Route::patch('supplier-rfqs/{rfqUid}', [SupplierRfqController::class, 'update']);

    // 供应商报价（BJ）：采购员列表 + 供应商提交
    Route::get('supplier-quotations', [SupplierQuotationController::class, 'index']);
    Route::post('supplier-quotations', [SupplierQuotationController::class, 'store']);
    Route::patch('supplier-quotations/{id}', [SupplierQuotationController::class, 'update']);
    Route::delete('supplier-quotations/{id}', [SupplierQuotationController::class, 'destroy']);

    // 销售报价单（QT）
    Route::get('sales-quotations', [SalesQuotationController::class, 'index']);
    Route::post('sales-quotations', [SalesQuotationController::class, 'store']);
    Route::patch('sales-quotations/{quotationUid}', [SalesQuotationController::class, 'update']);
    Route::patch('sales-quotations/{quotationUid}/withdraw', [SalesQuotationController::class, 'withdraw']);
    Route::patch('sales-quotations/{quotationUid}/submit-approval', [SalesQuotationController::class, 'submitApproval']);
    Route::patch('sales-quotations/{quotationUid}/approve', [SalesQuotationController::class, 'approve']);
    Route::patch('sales-quotations/{quotationUid}/reject', [SalesQuotationController::class, 'reject']);
    Route::patch('sales-quotations/{quotationUid}/send-to-customer', [SalesQuotationController::class, 'sendToCustomer']);
    Route::patch('sales-quotations/{quotationUid}/reset-customer-status', [SalesQuotationController::class, 'resetCustomerStatus']);
    Route::patch('sales-quotations/{quotationUid}/customer-response', [SalesQuotationController::class, 'customerResponse']);
    Route::post('sales-quotations/{quotationUid}/push-to-contract', [SalesQuotationController::class, 'pushToContract']);

    // 销售x合同（SC）
    Route::get('sales-contracts', [SalesContractController::class, 'index']);
    Route::post('sales-contracts', [SalesContractController::class, 'store']);
    Route::patch('sales-contracts/{contractUid}', [SalesContractController::class, 'update']);
    Route::patch('sales-contracts/{contractUid}/submit-approval', [SalesContractController::class, 'submitApproval']);
    Route::patch('sales-contracts/{contractUid}/approve', [SalesContractController::class, 'approve']);
    Route::patch('sales-contracts/{contractUid}/reject', [SalesContractController::class, 'reject']);
    Route::patch('sales-contracts/{contractUid}/send-to-customer', [SalesContractController::class, 'sendToCustomer']);
    Route::post('sales-contracts/{contractUid}/push-to-purchase', [SalesContractController::class, 'pushToPurchase']);
    Route::delete('sales-contracts/{contractUid}', [SalesContractController::class, 'destroy']);

    // 审批中心：主管/总监的待审列表（从数据库读取）
    Route::get('approval-center/quotation-requests', [ApprovalCenterController::class, 'quotationRequests']);
    Route::get('approval-center/contract-requests', [ApprovalCenterController::class, 'contractRequests']);
});

// ✅ CORS preflight fallback (must be LAST to avoid intercepting other routes)
Route::options('{any}', function () {
    return response()->noContent();
})->where('any', '.*');
