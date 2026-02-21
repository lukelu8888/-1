/**
 * 业务流程配置迁移脚本: V1 → V2
 * 
 * 用途: 将现有的V1流程数据迁移到V2增强版
 * 
 * 主要变更:
 * 1. 阶段2从6步扩展到8步
 * 2. 增加基于金额的审批路由
 * 3. 分离区域主管和销售总监的审批步骤
 * 
 * 创建时间: 2025-11-26
 */

export interface WorkflowMigrationConfig {
  version: string;
  migrationDate: string;
  affectedStages: string[];
  dataMapping: Record<string, any>;
}

export const migrationConfigV1toV2: WorkflowMigrationConfig = {
  version: "1.0.0 → 2.0.0",
  migrationDate: "2025-11-26",
  affectedStages: ["stage_2_quotation_preparation"],
  
  dataMapping: {
    // 步骤ID映射
    stepIdMapping: {
      // Step 2.1-2.3 保持不变
      "step_2_1": "step_2_1",
      "step_2_2": "step_2_2",
      "step_2_3": "step_2_3",
      
      // Step 2.4 保持ID，但功能增强
      "step_2_4": "step_2_4",
      
      // Step 2.5 分支映射
      "step_2_5a": {
        "< 20000": "step_2_5a_regional",
        ">= 20000": "step_2_5a_director"
      },
      "step_2_5b": {
        "< 20000": "step_2_5b_regional",
        ">= 20000": "step_2_5b_director"
      }
    },
    
    // 状态映射
    statusMapping: {
      "pending_manager": {
        "< 20000": "pending_regional_manager",
        ">= 20000": "pending_sales_director"
      },
      "approved": {
        "< 20000": "approved_by_regional_manager",
        ">= 20000": "approved_by_sales_director"
      },
      "rejected_by_manager": {
        "< 20000": "rejected_by_regional_manager",
        ">= 20000": "rejected_by_sales_director"
      }
    }
  }
};

/**
 * 迁移函数: 更新现有报价数据
 */
export function migrateQuotationData(quotation: any): any {
  const migratedQuotation = { ...quotation };
  
  // 1. 确保有USD金额字段
  if (!migratedQuotation.quotation_amount_usd) {
    migratedQuotation.quotation_amount_usd = convertToUSD(
      migratedQuotation.quotation_amount,
      migratedQuotation.quotation_currency
    );
  }
  
  // 2. 更新当前步骤ID
  if (migratedQuotation.current_step) {
    const currentStep = migratedQuotation.current_step;
    const amount = migratedQuotation.quotation_amount_usd;
    
    if (currentStep === "step_2_5a" || currentStep === "step_2_5b") {
      const isApproval = currentStep === "step_2_5a";
      const amountKey = amount < 20000 ? "< 20000" : ">= 20000";
      
      const mapping = migrationConfigV1toV2.dataMapping.stepIdMapping[currentStep] as any;
      migratedQuotation.current_step = mapping[amountKey];
    }
  }
  
  // 3. 更新状态
  if (migratedQuotation.status) {
    const status = migratedQuotation.status;
    const amount = migratedQuotation.quotation_amount_usd;
    
    if (migrationConfigV1toV2.dataMapping.statusMapping[status]) {
      const amountKey = amount < 20000 ? "< 20000" : ">= 20000";
      const mapping = migrationConfigV1toV2.dataMapping.statusMapping[status] as any;
      migratedQuotation.status = mapping[amountKey];
    }
  }
  
  // 4. 添加审批路由信息
  migratedQuotation.approval_route = determineApprovalRoute(
    migratedQuotation.quotation_amount_usd
  );
  
  // 5. 添加迁移标记
  migratedQuotation.migration = {
    migrated_from: "V1",
    migrated_to: "V2",
    migration_date: new Date().toISOString(),
    original_step: quotation.current_step,
    original_status: quotation.status
  };
  
  return migratedQuotation;
}

/**
 * 确定审批路由
 */
function determineApprovalRoute(amountUSD: number): string {
  return amountUSD < 20000 ? "regional_manager" : "sales_director";
}

/**
 * 货币转换函数（示例）
 */
function convertToUSD(amount: number, currency: string): number {
  // 实际应用中应该调用实时汇率API
  const exchangeRates: Record<string, number> = {
    "USD": 1.0,
    "EUR": 1.1,
    "GBP": 1.27,
    "CNY": 0.14,
    "JPY": 0.0067,
    "CAD": 0.73,
    "AUD": 0.65,
    "BRL": 0.20,
    "MXN": 0.057
  };
  
  const rate = exchangeRates[currency] || 1.0;
  return amount * rate;
}

/**
 * 批量迁移函数
 */
export async function batchMigrateQuotations(quotations: any[]): Promise<{
  success: number;
  failed: number;
  results: any[];
}> {
  const results = {
    success: 0,
    failed: 0,
    results: [] as any[]
  };
  
  for (const quotation of quotations) {
    try {
      const migrated = migrateQuotationData(quotation);
      results.results.push({
        id: quotation.id,
        status: "success",
        data: migrated
      });
      results.success++;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.results.push({
        id: quotation.id,
        status: "failed",
        error: errorMessage
      });
      results.failed++;
    }
  }
  
  return results;
}

/**
 * 验证迁移后的数据
 */
export function validateMigratedData(quotation: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 1. 检查必填字段
  if (!quotation.quotation_amount_usd) {
    errors.push("缺少 quotation_amount_usd 字段");
  }
  
  // 2. 检查审批路由
  if (!quotation.approval_route) {
    errors.push("缺少 approval_route 字段");
  }
  
  // 3. 检查步骤ID格式
  if (quotation.current_step) {
    const validSteps = [
      "step_2_1", "step_2_2", "step_2_3", "step_2_4",
      "step_2_5a_regional", "step_2_5b_regional",
      "step_2_5a_director", "step_2_5b_director"
    ];
    
    if (!validSteps.includes(quotation.current_step)) {
      errors.push(`无效的步骤ID: ${quotation.current_step}`);
    }
  }
  
  // 4. 检查金额和路由的一致性
  if (quotation.quotation_amount_usd && quotation.approval_route) {
    const expectedRoute = determineApprovalRoute(quotation.quotation_amount_usd);
    if (quotation.approval_route !== expectedRoute) {
      errors.push(`审批路由不匹配: 期望 ${expectedRoute}, 实际 ${quotation.approval_route}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成迁移报告
 */
export function generateMigrationReport(results: any[]): string {
  const total = results.length;
  const success = results.filter(r => r.status === "success").length;
  const failed = results.filter(r => r.status === "failed").length;
  
  const routeDistribution = results
    .filter(r => r.status === "success")
    .reduce((acc, r) => {
      const route = r.data.approval_route;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  return `
📊 业务流程迁移报告 V1 → V2
========================================

迁移时间: ${new Date().toISOString()}
总计报价数: ${total}
成功迁移: ${success} (${((success/total) * 100).toFixed(1)}%)
失败数量: ${failed} (${((failed/total) * 100).toFixed(1)}%)

审批路由分布:
- 区域主管 (< $20K): ${routeDistribution['regional_manager'] || 0}
- 销售总监 (≥ $20K): ${routeDistribution['sales_director'] || 0}

失败记录:
${results
  .filter(r => r.status === "failed")
  .map(r => `- ID: ${r.id}, 错误: ${r.error}`)
  .join('\n') || '无失败记录'}

========================================
  `.trim();
}

/**
 * 回滚函数（如果需要）
 */
export function rollbackToV1(quotation: any): any {
  if (!quotation.migration) {
    throw new Error("此报价未标记为已迁移，无法回滚");
  }
  
  const rolledBack = { ...quotation };
  
  // 恢复原始步骤和状态
  rolledBack.current_step = quotation.migration.original_step;
  rolledBack.status = quotation.migration.original_status;
  
  // 删除V2特有字段
  delete rolledBack.approval_route;
  delete rolledBack.migration;
  
  return rolledBack;
}

/**
 * 迁移前检查
 */
export function preMigrationCheck(): {
  ready: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // 检查项
  recommendations.push("建议在低峰时段执行迁移");
  recommendations.push("建议先在测试环境执行完整迁移测试");
  recommendations.push("建议通知所有用户流程变更");
  recommendations.push("建议准备回滚方案");
  
  return {
    ready: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * 导出迁移统计信息
 */
export interface MigrationStats {
  totalRecords: number;
  migratedRecords: number;
  pendingRecords: number;
  failedRecords: number;
  routeDistribution: {
    regionalManager: number;
    salesDirector: number;
  };
  amountDistribution: {
    under5K: number;
    from5Kto10K: number;
    from10Kto20K: number;
    from20Kto50K: number;
    over50K: number;
  };
}

export function calculateMigrationStats(quotations: any[]): MigrationStats {
  const stats: MigrationStats = {
    totalRecords: quotations.length,
    migratedRecords: 0,
    pendingRecords: 0,
    failedRecords: 0,
    routeDistribution: {
      regionalManager: 0,
      salesDirector: 0
    },
    amountDistribution: {
      under5K: 0,
      from5Kto10K: 0,
      from10Kto20K: 0,
      from20Kto50K: 0,
      over50K: 0
    }
  };
  
  quotations.forEach(q => {
    const amount = q.quotation_amount_usd || convertToUSD(q.quotation_amount, q.quotation_currency);
    
    // 路由分布
    if (amount < 20000) {
      stats.routeDistribution.regionalManager++;
    } else {
      stats.routeDistribution.salesDirector++;
    }
    
    // 金额分布
    if (amount < 5000) {
      stats.amountDistribution.under5K++;
    } else if (amount < 10000) {
      stats.amountDistribution.from5Kto10K++;
    } else if (amount < 20000) {
      stats.amountDistribution.from10Kto20K++;
    } else if (amount < 50000) {
      stats.amountDistribution.from20Kto50K++;
    } else {
      stats.amountDistribution.over50K++;
    }
  });
  
  return stats;
}

export default {
  migrationConfigV1toV2,
  migrateQuotationData,
  batchMigrateQuotations,
  validateMigratedData,
  generateMigrationReport,
  rollbackToV1,
  preMigrationCheck,
  calculateMigrationStats
};
