import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

/**
 * 📊 对账单（Statement of Account）
 * 
 * 用途：发给客户的定期对账单
 * 场景：月度/季度对账，显示客户的交易记录、应收应付余额
 * 数据来源：财务系统 + 订单系统
 */

export interface StatementOfAccountData {
  // 对账单基本信息
  statementNo: string;         // SOA-202512-001
  statementDate: string;       // 2025-12-31
  periodStart: string;         // 2025-12-01
  periodEnd: string;           // 2025-12-31
  
  // 公司信息
  company: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    accountName?: string;       // 银行账户名称
    bankName?: string;          // 银行名称
    accountNumber?: string;     // 银行账号
    swiftCode?: string;         // SWIFT代码
  };
  
  // 客户信息
  customer: {
    customerCode: string;       // 客户编码
    companyName: string;
    address: string;
    contactPerson: string;
    email: string;
    tel?: string;
  };
  
  // 期初余额
  openingBalance: {
    amount: number;
    currency: string;
    type: 'debit' | 'credit';   // debit=应收客户钱, credit=应付客户钱
  };
  
  // 交易明细
  transactions: Array<{
    date: string;               // 交易日期
    type: 'invoice' | 'payment' | 'credit_note' | 'debit_note';
    referenceNo: string;        // 参考号（发票号、收款单号等）
    description: string;        // 描述
    debit?: number;             // 借方（客户欠我们的）
    credit?: number;            // 贷方（我们欠客户的）
    balance: number;            // 余额
    currency: string;
  }>;
  
  // 期末余额
  closingBalance: {
    amount: number;
    currency: string;
    type: 'debit' | 'credit';
  };
  
  // 账龄分析（可选）
  agingAnalysis?: {
    current: number;            // 当期（0-30天）
    days30: number;             // 31-60天
    days60: number;             // 61-90天
    days90Plus: number;         // 90天以上
  };
  
  // 备注
  remarks?: string;
}

interface StatementOfAccountDocumentProps {
  data: StatementOfAccountData;
}

export const StatementOfAccountDocument = forwardRef<HTMLDivElement, StatementOfAccountDocumentProps>(
  ({ data }, ref) => {
    
    const totalDebit = data.transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = data.transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    
    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'invoice': return 'Invoice';
        case 'payment': return 'Payment';
        case 'credit_note': return 'Credit Note';
        case 'debit_note': return 'Debit Note';
        default: return type;
      }
    };

    return (
      <div 
        ref={ref}
        className="bg-white w-[794px] min-h-[1123px] mx-auto shadow-lg"
        style={{ 
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          fontSize: '9pt',
          lineHeight: '1.3'
        }}
      >
        <div className="p-[15mm]">
          {/* Header - Taiwan Enterprise Compact Style */}
          <div className="mb-3">
            {/* Title + Statement Info Table */}
            <div className="flex items-start justify-between mb-2">
              {/* Left: LOGO */}
              <div className="w-[70px] flex-shrink-0">
                <img
                  src={cosunLogo}
                  alt="Company Logo"
                  className="w-full h-auto"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              
              {/* Center: STATEMENT OF ACCOUNT Title */}
              <div className="flex-1 flex justify-center items-center">
                <h1 className="text-2xl font-bold tracking-wider text-black whitespace-nowrap">
                  STATEMENT OF ACCOUNT
                </h1>
              </div>
              
              {/* Right: Statement Info Table */}
              <div className="w-[250px]">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap w-[85px]">Statement No.</td>
                      <td className="border border-gray-400 px-2 py-1 font-bold text-black whitespace-nowrap">{data.statementNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                      <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">
                        {new Date(data.statementDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Period</td>
                      <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">
                        {new Date(data.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(data.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Divider - Double Line Design */}
            <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
          </div>

          {/* Customer and Company Information - Compact Table Format */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            {/* Company Info */}
            <div className="border border-gray-400">
              <div className="bg-gray-100 border-b border-gray-400 px-2 py-1 font-semibold">
                SELLER:
              </div>
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="font-semibold text-black">{data.company.nameEn}</p>
                <p className="text-gray-700">{data.company.addressEn}</p>
                <p className="text-gray-700">Tel: {data.company.tel}</p>
                <p className="text-gray-700">Email: {data.company.email}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="border border-gray-400">
              <div className="bg-gray-100 border-b border-gray-400 px-2 py-1 font-semibold">
                CUSTOMER (Code: {data.customer.customerCode}):
              </div>
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="font-semibold text-black">{data.customer.companyName}</p>
                <p className="text-gray-700">{data.customer.address}</p>
                <p className="text-gray-700">Contact: {data.customer.contactPerson}</p>
                <p className="text-gray-700">Email: {data.customer.email}</p>
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          <div className="mb-2">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold w-[120px]">Opening Balance:</td>
                  <td className="border border-gray-400 px-2 py-1 font-bold text-black">
                    {data.openingBalance.currency} {data.openingBalance.amount.toFixed(2)}
                    <span className="ml-2 text-xs font-normal text-gray-600">
                      ({data.openingBalance.type === 'debit' ? 'Receivable' : 'Payable'})
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transaction Details Table */}
          <div className="mb-2">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold w-[70px]">Date</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold w-[65px]">Type</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold w-[110px]">Reference</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-left font-semibold">Description</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-right font-semibold w-[85px]">Debit</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-right font-semibold w-[85px]">Credit</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-right font-semibold w-[85px]">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 px-2 py-1 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-xs">
                      {getTypeLabel(transaction.type)}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 font-mono text-[10px]">
                      {transaction.referenceNo}
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {transaction.description}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right">
                      {transaction.debit 
                        ? `${transaction.currency} ${transaction.debit.toFixed(2)}`
                        : '-'
                      }
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right">
                      {transaction.credit 
                        ? `${transaction.currency} ${transaction.credit.toFixed(2)}`
                        : '-'
                      }
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right font-semibold">
                      {transaction.currency} {transaction.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right font-semibold">
                    TOTAL:
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right font-bold text-black">
                    {data.closingBalance.currency} {totalDebit.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right font-bold text-black">
                    {data.closingBalance.currency} {totalCredit.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Closing Balance */}
          <div className="mb-3">
            <table className="w-full border-collapse border-2 border-black text-xs">
              <tbody>
                <tr className="bg-gray-100">
                  <td className="border-2 border-black px-2 py-1.5 font-bold w-[120px]">Closing Balance:</td>
                  <td className="border-2 border-black px-2 py-1.5 font-bold text-black text-lg">
                    {data.closingBalance.currency} {Math.abs(data.closingBalance.amount).toFixed(2)}
                    <span className="ml-3 text-sm">
                      ({data.closingBalance.type === 'debit' ? 'RECEIVABLE' : 'PAYABLE'})
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Aging Analysis */}
          {data.agingAnalysis && data.closingBalance.type === 'debit' && (
            <div className="mb-3">
              <div className="bg-gray-100 border border-gray-400 px-2 py-1 font-semibold text-xs mb-1">
                AGING ANALYSIS:
              </div>
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-400 px-2 py-1 text-left font-semibold">Period</th>
                    <th className="border border-gray-400 px-2 py-1 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">Current (0-30 days)</td>
                    <td className="border border-gray-400 px-2 py-1 text-right font-semibold">
                      {data.closingBalance.currency} {data.agingAnalysis.current.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">31-60 days</td>
                    <td className="border border-gray-400 px-2 py-1 text-right font-semibold">
                      {data.closingBalance.currency} {data.agingAnalysis.days30.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">61-90 days</td>
                    <td className="border border-gray-400 px-2 py-1 text-right font-semibold">
                      {data.closingBalance.currency} {data.agingAnalysis.days60.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-400 px-2 py-1 font-semibold">Over 90 days</td>
                    <td className="border border-gray-400 px-2 py-1 text-right font-bold text-black">
                      {data.closingBalance.currency} {data.agingAnalysis.days90Plus.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Information */}
          {data.company.bankName && (
            <div className="mb-3">
              <div className="bg-gray-100 border border-gray-400 px-2 py-1 font-semibold text-xs mb-1">
                PAYMENT INFORMATION:
              </div>
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold w-[120px]">Account Name:</td>
                    <td className="border border-gray-400 px-2 py-1">{data.company.accountName}</td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold w-[120px]">Bank Name:</td>
                    <td className="border border-gray-400 px-2 py-1">{data.company.bankName}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold">Account Number:</td>
                    <td className="border border-gray-400 px-2 py-1 font-mono">{data.company.accountNumber}</td>
                    {data.company.swiftCode && (
                      <>
                        <td className="border border-gray-400 px-2 py-1 bg-gray-50 font-semibold">SWIFT Code:</td>
                        <td className="border border-gray-400 px-2 py-1 font-mono">{data.company.swiftCode}</td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Remarks */}
          {data.remarks && (
            <div className="mb-3">
              <div className="bg-gray-100 border border-gray-400 px-2 py-1 font-semibold text-xs mb-1">
                REMARKS:
              </div>
              <div className="border border-gray-400 px-2 py-1.5 text-xs text-gray-700">
                {data.remarks}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 text-[10px] text-gray-600 border-t border-gray-300 pt-2">
            <p className="text-center font-semibold mb-0.5">Please verify and confirm this statement within 7 days.</p>
            <p className="text-center">For any questions, please contact us at {data.company.email}</p>
          </div>
        </div>
      </div>
    );
  }
);

StatementOfAccountDocument.displayName = 'StatementOfAccountDocument';