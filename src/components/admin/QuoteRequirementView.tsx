import React, { forwardRef } from 'react';
import {
  QuoteRequirementDocument,
  type QuoteRequirementPreviewLayout,
  type QuoteRequirementTextOverrides,
} from '../documents/templates/QuoteRequirementDocument';
import { useAuth } from '../../hooks/useAuth'; // 🔥 使用useAuth而不是useUser

/**
 * 📋 报价请求单视图 - 基于报价请求单模板
 * 
 * 功能：
 * 1. 展示报价请求单的完整内容
 * 2. 使用专业的报价请求单格式
 * 3. 显示客户信息、产品清单、业务部说明、采购部反馈
 */

interface QuoteRequirementViewProps {
  requirement: any; // 报价请求单数据
  zoom?: number;
  onClose?: () => void; // 🔥 关闭弹窗的回调
  layoutConfig?: Partial<QuoteRequirementPreviewLayout>;
  textOverrides?: Partial<QuoteRequirementTextOverrides>;
}

export const QuoteRequirementView = forwardRef<HTMLDivElement, QuoteRequirementViewProps>(
  ({ requirement, zoom = 100, onClose, layoutConfig, textOverrides }, ref) => {
    const { currentUser } = useAuth(); // 🔥 使用useAuth获取有role字段的用户对象

    // 🔥 调试日志
    console.log('🔍 [QuoteRequirementView] requirement:', requirement?.requirementNo);
    if (requirement?.items && requirement.items.length > 0) {
      console.log('   - 第一个产品 modelNo:', requirement.items[0].modelNo);
      console.log('   - 第一个产品 specification:', requirement.items[0].specification);
    }

    if (!requirement) {
      return (
        <div className="bg-white p-8 text-center">
          <p className="text-gray-500">未找到报价请求单数据</p>
        </div>
      );
    }

    const templateSnapshot = requirement.templateSnapshot || requirement.template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const documentData = requirement.documentDataSnapshot || requirement.document_data_snapshot || null;

    if (!templateVersion || !documentData) {
      return (
        <div className="bg-white p-8 text-center">
          <p className="text-gray-500">该 QR 未绑定模板中心版本快照，无法预览</p>
        </div>
      );
    }

    return (
      <div ref={ref}>
        <QuoteRequirementDocument
          data={documentData}
          layoutConfig={layoutConfig}
          textOverrides={textOverrides}
        />
      </div>
    );
  }
);

QuoteRequirementView.displayName = 'QuoteRequirementView';
