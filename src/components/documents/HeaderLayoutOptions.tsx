import React from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

/**
 * 🎨 B2B外贸文档页眉布局方案对比
 * 
 * 展示5种台湾/欧美大厂常用的专业文档页眉布局
 */

interface HeaderData {
  contractNo: string;
  date: string;
  ref?: string;
}

const sampleData: HeaderData = {
  contractNo: 'SC-NA-20251220-001',
  date: 'Dec 20, 2025',
  ref: 'QT-NA-20251210-001'
};

export const HeaderLayoutOptions: React.FC = () => {
  return (
    <div className="p-8 bg-gray-100 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        B2B外贸文档页眉布局方案对比 - 扩展版
      </h1>

      {/* 方案6：香港贸易公司风格 - 双线分隔 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案6：香港贸易公司风格（李锦记/嘉里集团）
        </h2>
        <div>
          {/* 顶部双线 */}
          <div className="border-t-4 border-orange-600"></div>
          <div className="border-t border-gray-300 mb-4"></div>
          
          {/* 单行布局 */}
          <div className="flex justify-between items-center py-3">
            <img src={cosunLogo} alt="Logo" className="w-auto h-12" />
            <h2 className="text-3xl font-bold tracking-wider" style={{ color: '#F96302' }}>
              SALES CONTRACT
            </h2>
            <div className="text-right text-sm">
              <table className="text-left">
                <tbody>
                  {sampleData.ref && (
                    <tr>
                      <td className="pr-3 text-gray-500">Ref:</td>
                      <td className="font-medium">{sampleData.ref}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="pr-3 text-gray-500">No:</td>
                    <td className="font-bold text-orange-600">{sampleData.contractNo}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 text-gray-500">Date:</td>
                    <td className="font-medium">{sampleData.date}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 底部双线 */}
          <div className="border-b border-gray-300 mt-4"></div>
          <div className="border-b-4 border-orange-600"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：双线装饰、一行布局、紧凑高效、适合贸易公司</p>
      </div>

      {/* 方案7：日本精密制造风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案7：日本精密制造风格（松下/索尼/村田）
        </h2>
        <div className="border border-gray-400">
          {/* 顶部窄条 */}
          <div className="bg-orange-600 h-2"></div>
          
          <div className="p-4">
            {/* Logo和公司名 */}
            <div className="flex items-center gap-3 mb-3">
              <img src={cosunLogo} alt="Logo" className="w-auto h-10" />
              <div className="border-l-2 border-gray-300 pl-3">
                <p className="text-xs font-bold">FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.</p>
              </div>
            </div>
            
            {/* 分隔线 */}
            <div className="border-t border-gray-300 my-3"></div>
            
            {/* 文档信息 */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: '#F96302' }}>SALES CONTRACT</h2>
                <p className="text-xs text-gray-500">销售合同</p>
              </div>
              <div className="bg-gray-50 border border-gray-300 px-4 py-2">
                <table className="text-xs">
                  <tbody>
                    {sampleData.ref && (
                      <tr>
                        <td className="pr-4 py-0.5 text-gray-500">Reference:</td>
                        <td className="font-medium">{sampleData.ref}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="pr-4 py-0.5 text-gray-500">Contract No:</td>
                      <td className="font-bold text-orange-600">{sampleData.contractNo}</td>
                    </tr>
                    <tr>
                      <td className="pr-4 py-0.5 text-gray-500">Issue Date:</td>
                      <td className="font-medium">{sampleData.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* 底部窄条 */}
          <div className="bg-orange-600 h-1"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：边框完整、双语标注、信息框化、精细规整</p>
      </div>

      {/* 方案8：新加坡国际贸易风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案8：新加坡国际贸易风格（淡马锡/吉宝）
        </h2>
        <div>
          <div className="grid grid-cols-[auto_1fr_auto] gap-6 items-center pb-4 border-b-2" style={{ borderColor: '#F96302' }}>
            {/* 左：Logo */}
            <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
            
            {/* 中：空白 */}
            <div></div>
            
            {/* 右：信息块 */}
            <div className="text-right">
              <div className="bg-orange-600 text-white px-4 py-1 text-xs font-bold mb-2">
                SALES CONTRACT
              </div>
              <div className="text-xs space-y-0.5">
                {sampleData.ref && (
                  <div><span className="text-gray-500">Ref:</span> {sampleData.ref}</div>
                )}
                <div><span className="text-gray-500">Contract No:</span> <span className="font-bold text-orange-600">{sampleData.contractNo}</span></div>
                <div><span className="text-gray-500">Date:</span> {sampleData.date}</div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：Logo突出、信息紧凑右对齐、单线分隔、国际化</p>
      </div>

      {/* 方案9：韩国现代风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案9：韩国现代风格（三星/LG/现代）
        </h2>
        <div>
          {/* 顶部色块 */}
          <div className="flex items-stretch mb-4">
            <div className="bg-orange-600 w-2"></div>
            <div className="flex-1 bg-gradient-to-r from-orange-50 to-white px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
                  <div className="h-12 border-l border-gray-300"></div>
                  <h2 className="text-2xl font-bold" style={{ color: '#F96302' }}>
                    SALES CONTRACT
                  </h2>
                </div>
                <div className="bg-white shadow-sm border border-gray-200 px-4 py-2 rounded text-xs">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {sampleData.ref && (
                      <>
                        <span className="text-gray-500 text-right">Ref:</span>
                        <span className="font-medium">{sampleData.ref}</span>
                      </>
                    )}
                    <span className="text-gray-500 text-right">Contract No:</span>
                    <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
                    <span className="text-gray-500 text-right">Date:</span>
                    <span className="font-medium">{sampleData.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-b-2 border-gray-300"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：左侧色条、渐变背景、现代时尚、信息网格化</p>
      </div>

      {/* 方案10：传统国际贸易格式 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案10：传统国际贸易格式（通用/经典）
        </h2>
        <div className="border-2 border-gray-400 p-4">
          <div className="text-center mb-3">
            <img src={cosunLogo} alt="Logo" className="w-auto h-16 mx-auto mb-2" />
            <h3 className="text-sm font-bold">福建高盛达富建材有限公司</h3>
            <p className="text-xs text-gray-600">FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.</p>
          </div>
          
          <div className="border-t-2 border-b-2 border-orange-600 py-3 my-3 text-center">
            <h2 className="text-2xl font-bold tracking-widest" style={{ color: '#F96302' }}>
              SALES CONTRACT
            </h2>
          </div>
          
          <div className="flex justify-between text-xs">
            {sampleData.ref && (
              <div>
                <span className="text-gray-500">Reference: </span>
                <span className="font-medium">{sampleData.ref}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Contract No: </span>
              <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
            </div>
            <div>
              <span className="text-gray-500">Date: </span>
              <span className="font-medium">{sampleData.date}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：居中对称、边框完整、传统经典、适合正式文档</p>
      </div>

      {/* 方案11：德国工程精密风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案11：德国工程精密风格（博世/费斯托/WAGO）
        </h2>
        <div>
          <div className="bg-gray-100 border-l-4 border-orange-600 p-4">
            <div className="grid grid-cols-[120px_1fr_280px] gap-4 items-center">
              <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
              
              <div className="border-l-2 border-gray-300 pl-4">
                <h2 className="text-xl font-bold mb-0.5" style={{ color: '#F96302' }}>SALES CONTRACT</h2>
                <p className="text-xs text-gray-600">Standard Business Document</p>
              </div>
              
              <div className="bg-white border border-gray-300 p-3">
                <table className="w-full text-xs">
                  <tbody>
                    {sampleData.ref && (
                      <tr className="border-b border-gray-200">
                        <td className="py-1 text-gray-500 w-28">Reference:</td>
                        <td className="py-1 font-medium">{sampleData.ref}</td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-200">
                      <td className="py-1 text-gray-500">Contract Number:</td>
                      <td className="py-1 font-bold text-orange-600">{sampleData.contractNo}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">Issue Date:</td>
                      <td className="py-1 font-medium">{sampleData.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="border-b-2 border-orange-600"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：左侧橙条、灰色背景、表格严谨、工程感强</p>
      </div>

      {/* 方案12：北欧极简商务风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案12：北欧极简商务风格（宜家/爱立信/诺基亚）
        </h2>
        <div>
          <div className="pb-6 border-b" style={{ borderColor: '#F96302' }}>
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-6">
                <img src={cosunLogo} alt="Logo" className="w-auto h-18" />
                <div className="pt-1">
                  <h2 className="text-3xl font-light tracking-wide mb-1" style={{ color: '#F96302' }}>
                    SALES CONTRACT
                  </h2>
                  <div className="h-0.5 w-20 bg-orange-600"></div>
                </div>
              </div>
              
              <div className="text-right text-sm space-y-1 pt-1">
                {sampleData.ref && (
                  <div className="text-gray-500">
                    {sampleData.ref}
                  </div>
                )}
                <div className="font-bold text-lg" style={{ color: '#F96302' }}>
                  {sampleData.contractNo}
                </div>
                <div className="text-gray-600">
                  {sampleData.date}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：极简留白、轻字体、小装饰线、现代清爽</p>
      </div>

      {/* 方案13：美国Fortune 500风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案13：美国Fortune 500风格（波音/洛克希德/霍尼韦尔）
        </h2>
        <div className="border-t-4 border-orange-600 pt-4">
          <div className="flex justify-between items-start mb-4">
            <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
            <div className="flex-1 text-center">
              <div className="inline-block border-2 border-orange-600 px-8 py-3">
                <h2 className="text-2xl font-bold tracking-widest" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
                <p className="text-xs text-gray-600 mt-1">Commercial Agreement</p>
              </div>
            </div>
            <div className="bg-gray-900 text-white px-4 py-3 text-xs">
              <div className="space-y-1">
                {sampleData.ref && <div>Ref: {sampleData.ref}</div>}
                <div className="font-bold" style={{ color: '#F96302' }}>{sampleData.contractNo}</div>
                <div>{sampleData.date}</div>
              </div>
            </div>
          </div>
          <div className="border-b-2 border-gray-300"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：顶部粗橙线、居中双边框标题、深色信息块、美式商务</p>
      </div>

      {/* 方案14：英国传统商业风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案14：英国传统商业风格（劳斯莱斯/BP/汇丰）
        </h2>
        <div className="border-4 border-double border-gray-700 p-4">
          <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-400">
            <div className="flex items-center gap-4">
              <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
              <div className="border-l-2 border-gray-400 pl-4">
                <p className="text-xs font-bold">FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.</p>
                <p className="text-xs text-gray-600">Established 2010</p>
              </div>
            </div>
          </div>
          
          <div className="text-center my-4">
            <div className="inline-block">
              <div className="border-t border-b border-gray-700 py-2">
                <h2 className="text-2xl font-serif font-bold tracking-wider" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-400 pt-3">
            <div className="flex justify-around text-xs">
              {sampleData.ref && (
                <div className="text-center">
                  <p className="text-gray-500 mb-1">Reference</p>
                  <p className="font-semibold">{sampleData.ref}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-gray-500 mb-1">Contract Number</p>
                <p className="font-bold" style={{ color: '#F96302' }}>{sampleData.contractNo}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 mb-1">Date of Issue</p>
                <p className="font-semibold">{sampleData.date}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：双线边框、衬线字体、居中对称、英伦传统</p>
      </div>

      {/* 方案15：瑞士银行级精密风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案15：瑞士银行级精密风格（瑞银/ABB瑞士/劳力士）
        </h2>
        <div>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center pb-4 border-b" style={{ borderColor: '#F96302' }}>
            <div className="flex justify-start">
              <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
            </div>
            
            <div className="border-2 border-orange-600 px-10 py-2 bg-white">
              <h2 className="text-xl font-bold tracking-widest text-center" style={{ color: '#F96302' }}>
                SALES CONTRACT
              </h2>
            </div>
            
            <div className="flex justify-end">
              <div className="border border-gray-400 bg-gray-50">
                <table className="text-xs">
                  <tbody>
                    {sampleData.ref && (
                      <tr className="border-b border-gray-300">
                        <td className="px-3 py-1.5 text-gray-500 bg-gray-100">Ref.</td>
                        <td className="px-3 py-1.5 font-medium">{sampleData.ref}</td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-300">
                      <td className="px-3 py-1.5 text-gray-500 bg-gray-100">Contract No.</td>
                      <td className="px-3 py-1.5 font-bold text-orange-600">{sampleData.contractNo}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 text-gray-500 bg-gray-100">Date</td>
                      <td className="px-3 py-1.5 font-medium">{sampleData.date}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：三栏精确对齐、表格带分隔、边框标题、瑞士精密</p>
      </div>

      {/* 方案16：荷兰理性设计风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案16：荷兰理性设计风格（飞利浦/壳牌/海尼根）
        </h2>
        <div>
          <div className="flex gap-4">
            <div className="w-1 bg-orange-600"></div>
            <div className="flex-1">
              <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-gray-300">
                <div className="flex items-center gap-6">
                  <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold" style={{ color: '#F96302' }}>SALES CONTRACT</h2>
                    <div className="flex gap-4 text-xs text-gray-600">
                      {sampleData.ref && <span>REF: {sampleData.ref}</span>}
                      <span>NO: <strong className="text-orange-600">{sampleData.contractNo}</strong></span>
                      <span>DATE: {sampleData.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：左侧橙条、单行信息、理性简洁、荷兰设计</p>
      </div>

      {/* 方案17：法国奢华风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案17：法国奢华风格（爱马仕/路易威登/欧莱雅）
        </h2>
        <div className="border border-gray-300 p-6">
          <div className="text-center mb-4">
            <img src={cosunLogo} alt="Logo" className="w-auto h-20 mx-auto mb-3" />
            <div className="inline-block border-t-2 border-b-2 border-orange-600 px-12 py-3">
              <h2 className="text-3xl font-serif italic font-bold" style={{ color: '#F96302' }}>
                Sales Contract
              </h2>
            </div>
          </div>
          
          <div className="flex justify-center gap-8 text-xs">
            {sampleData.ref && (
              <div className="text-center">
                <p className="text-gray-500 italic mb-1">Référence</p>
                <p className="font-semibold">{sampleData.ref}</p>
              </div>
            )}
            <div className="h-12 border-l border-gray-300"></div>
            <div className="text-center">
              <p className="text-gray-500 italic mb-1">Contrat Nº</p>
              <p className="font-bold text-lg" style={{ color: '#F96302' }}>{sampleData.contractNo}</p>
            </div>
            <div className="h-12 border-l border-gray-300"></div>
            <div className="text-center">
              <p className="text-gray-500 italic mb-1">Date</p>
              <p className="font-semibold">{sampleData.date}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：居中对称、衬线斜体、竖线分隔、法式优雅</p>
      </div>

      {/* 方案18：意大利设计风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案18：意大利设计风格（法拉利/阿玛尼/普拉达）
        </h2>
        <div className="bg-gradient-to-r from-white via-orange-50 to-white p-6 border-t-2 border-b-2 border-orange-600">
          <div className="flex justify-between items-center">
            <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
            
            <div className="text-center flex-1 mx-8">
              <h2 className="text-3xl font-serif font-bold mb-1" style={{ color: '#F96302' }}>
                SALES CONTRACT
              </h2>
              <div className="flex justify-center gap-2 text-xs text-gray-600">
                {sampleData.ref && <span>{sampleData.ref}</span>}
                <span>•</span>
                <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
                <span>•</span>
                <span>{sampleData.date}</span>
              </div>
            </div>
            
            <div className="w-16"></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：渐变背景、居中为主、圆点分隔、意式时尚</p>
      </div>

      {/* 方案19：加拿大友好商务风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案19：加拿大友好商务风格（黑莓/庞巴迪/Shopify）
        </h2>
        <div>
          <div className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="bg-white p-2 rounded shadow-sm">
                  <img src={cosunLogo} alt="Logo" className="w-auto h-12" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: '#F96302' }}>
                    SALES CONTRACT
                  </h2>
                  <p className="text-xs text-gray-600">Business Agreement Document</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm px-4 py-3 text-xs">
                <div className="space-y-1">
                  {sampleData.ref && <div className="text-gray-500">Ref: <span className="text-gray-900">{sampleData.ref}</span></div>}
                  <div className="text-gray-500">Contract: <span className="font-bold text-orange-600">{sampleData.contractNo}</span></div>
                  <div className="text-gray-500">Date: <span className="text-gray-900">{sampleData.date}</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-b-2 border-orange-600"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：圆角卡片、灰色背景、阴影效果、友好现代</p>
      </div>

      {/* 方案20：澳洲简约实用风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案20：澳洲简约实用风格（BHP/力拓/Atlassian）
        </h2>
        <div>
          <div className="flex items-center gap-8 pb-4 border-b-4 border-orange-600">
            <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
            <div className="h-16 border-l-2 border-gray-300"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#F96302' }}>
                SALES CONTRACT
              </h2>
              <div className="flex gap-6 text-xs">
                {sampleData.ref && (
                  <div>
                    <span className="text-gray-500">Ref: </span>
                    <span className="font-medium">{sampleData.ref}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Contract No: </span>
                  <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date: </span>
                  <span className="font-medium">{sampleData.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：横向分隔线、信息横排、实用主义、澳式简约</p>
      </div>

      {/* 方案21：东南亚现代风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案21：东南亚现代风格（新科/丰隆/云顶）
        </h2>
        <div className="border-2 border-orange-600 rounded-lg overflow-hidden">
          <div className="bg-orange-600 text-white px-6 py-2 flex justify-between items-center">
            <span className="text-xl font-bold">SALES CONTRACT</span>
            <span className="text-sm">{sampleData.date}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
            <div className="text-right text-sm">
              <div className="space-y-1">
                {sampleData.ref && <div className="text-gray-600">Reference: {sampleData.ref}</div>}
                <div className="text-gray-900 font-bold text-base">{sampleData.contractNo}</div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：橙色顶栏、圆角边框、色块分隔、现代活力</p>
      </div>

      {/* 方案22：中东奢华现代风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案22：中东奢华现代风格（阿联酋航空/Emaar/迪拜）
        </h2>
        <div className="border-4 border-orange-600 p-6 bg-gradient-to-b from-white to-orange-50">
          <div className="flex justify-between items-start mb-4">
            <img src={cosunLogo} alt="Logo" className="w-auto h-18" />
            <div className="text-center flex-1 mx-8">
              <div className="bg-white shadow-lg border-2 border-orange-600 px-10 py-3 inline-block">
                <h2 className="text-3xl font-bold tracking-wider" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-orange-400 pt-3 flex justify-center gap-12 text-sm">
            {sampleData.ref && (
              <div className="text-center">
                <p className="text-gray-600 text-xs mb-1">REFERENCE</p>
                <p className="font-bold">{sampleData.ref}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-gray-600 text-xs mb-1">CONTRACT NUMBER</p>
              <p className="font-bold text-lg" style={{ color: '#F96302' }}>{sampleData.contractNo}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-xs mb-1">DATE</p>
              <p className="font-bold">{sampleData.date}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：粗边框、渐变背景、居中阴影卡片、奢华感</p>
      </div>

      {/* 方案23：印度IT企业风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案23：印度IT企业风格（塔塔/Infosys/Wipro）
        </h2>
        <div className="border border-gray-400">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white p-1.5 rounded">
                <img src={cosunLogo} alt="Logo" className="w-auto h-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold">SALES CONTRACT</h2>
                <p className="text-xs opacity-90">Commercial Business Document</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="bg-white bg-opacity-20 px-3 py-2 rounded">
                {sampleData.ref && <div className="text-xs">Ref: {sampleData.ref}</div>}
                <div className="font-bold">{sampleData.contractNo}</div>
                <div className="text-xs">{sampleData.date}</div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：橙色渐变顶栏、白色Logo框、信息半透明卡片、现代IT</p>
      </div>

      {/* 方案24：巴西/拉美活力风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案24：巴西/拉美活力风格（Vale/Embraer/Ambev）
        </h2>
        <div>
          <div className="flex gap-3">
            <div className="bg-orange-600 w-3 rounded-r"></div>
            <div className="flex-1 pb-4 border-b-2 border-orange-600">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
                  <div>
                    <h2 className="text-3xl font-bold" style={{ color: '#F96302' }}>
                      SALES CONTRACT
                    </h2>
                    <div className="h-1 w-32 bg-orange-600 mt-1 rounded-full"></div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-600 px-5 py-3">
                  <div className="text-xs space-y-1.5">
                    {sampleData.ref && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Ref:</span>
                        <span className="font-medium">{sampleData.ref}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">No:</span>
                      <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{sampleData.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：左侧圆角橙条、圆角装饰线、橙色背景信息块、活力动感</p>
      </div>

      {/* 方案25：芬兰极简主义风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案25：芬兰极简主义风格（诺基亚/Marimekko/Fiskars）
        </h2>
        <div>
          <div className="pb-5 border-b-2 border-orange-600">
            <div className="flex justify-between items-center">
              <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
              <div className="flex items-baseline gap-8">
                <h2 className="text-3xl font-light" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
                <div className="text-xs text-gray-600 space-x-4">
                  {sampleData.ref && <span>{sampleData.ref}</span>}
                  <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
                  <span>{sampleData.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：超极简、轻字体、一行式布局、芬兰设计</p>
      </div>

      {/* 方案26：丹麦功能主义风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案26：丹麦功能主义风格（乐高/Carlsberg/Bang & Olufsen）
        </h2>
        <div className="border-t-2 border-orange-600 pt-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-6 items-center">
              <div className="border-2 border-orange-600 p-2">
                <img src={cosunLogo} alt="Logo" className="w-auto h-12" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#F96302' }}>SALES CONTRACT</h2>
                <p className="text-xs text-gray-600">Business Document • Commercial Agreement</p>
              </div>
            </div>
            <div className="border border-gray-400 bg-gray-50 p-3 text-xs">
              {sampleData.ref && <div className="mb-1"><strong>Ref:</strong> {sampleData.ref}</div>}
              <div className="mb-1"><strong style={{ color: '#F96302' }}>No:</strong> {sampleData.contractNo}</div>
              <div><strong>Date:</strong> {sampleData.date}</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：Logo边框包裹、功能标签、信息框化、丹麦务实</p>
      </div>

      {/* 方案27：挪威自然风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案27：挪威自然风格（Equinor/Telenor/挪威航空）
        </h2>
        <div className="bg-gradient-to-b from-gray-50 to-white p-5 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
            <div className="flex-1 text-center">
              <h2 className="text-3xl font-bold tracking-wide" style={{ color: '#F96302' }}>
                SALES CONTRACT
              </h2>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-3 flex justify-center gap-10 text-xs">
            {sampleData.ref && (
              <div className="text-center">
                <p className="text-gray-500 text-xs">Reference</p>
                <p className="font-semibold mt-1">{sampleData.ref}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-gray-500 text-xs">Contract Number</p>
              <p className="font-bold mt-1 text-base" style={{ color: '#F96302' }}>{sampleData.contractNo}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs">Date</p>
              <p className="font-semibold mt-1">{sampleData.date}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：渐变背景、圆角卡片、居中对称、自然清新</p>
      </div>

      {/* 方案28：西班牙热情风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案28：西班牙热情风格（Zara/Santander/Telefónica）
        </h2>
        <div>
          <div className="border-l-8 border-orange-600 pl-6 py-4 bg-orange-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-8">
                <div className="bg-white p-3 shadow-md">
                  <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
                </div>
                <h2 className="text-4xl font-bold italic" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
              </div>
              <div className="bg-white shadow-md px-5 py-3 rounded-lg text-sm">
                {sampleData.ref && <div className="text-gray-600 mb-1">Ref: {sampleData.ref}</div>}
                <div className="font-bold text-lg" style={{ color: '#F96302' }}>{sampleData.contractNo}</div>
                <div className="text-gray-600 mt-1">{sampleData.date}</div>
              </div>
            </div>
          </div>
          <div className="border-b-4 border-orange-600"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：左侧粗边条、橙色背景、斜体标题、西班牙热情</p>
      </div>

      {/* 方案29：葡萄牙传统风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案29：葡萄牙传统风格（EDP/Galp/TAP航空）
        </h2>
        <div className="border-2 border-orange-600 rounded p-4">
          <div className="text-center mb-3">
            <img src={cosunLogo} alt="Logo" className="w-auto h-16 mx-auto mb-2" />
            <div className="h-0.5 w-24 bg-orange-600 mx-auto"></div>
          </div>
          <div className="text-center my-4">
            <h2 className="text-2xl font-bold tracking-wider" style={{ color: '#F96302' }}>
              SALES CONTRACT
            </h2>
            <p className="text-xs text-gray-600 mt-1">Contrato de Vendas</p>
          </div>
          <div className="flex justify-around text-xs border-t border-gray-300 pt-3">
            {sampleData.ref && (
              <div><span className="text-gray-500">Ref:</span> <span className="font-medium">{sampleData.ref}</span></div>
            )}
            <div><span className="text-gray-500">Nº:</span> <span className="font-bold text-orange-600">{sampleData.contractNo}</span></div>
            <div><span className="text-gray-500">Data:</span> <span className="font-medium">{sampleData.date}</span></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：圆角边框、双语标题、居中分隔线、葡式传统</p>
      </div>

      {/* 方案30：比利时精品风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案30：比利时精品风格（Godiva/Delvaux/Solvay）
        </h2>
        <div className="border border-gray-400">
          <div className="flex">
            <div className="bg-orange-600 w-16 flex items-center justify-center py-4">
              <div className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
                CONTRACT
              </div>
            </div>
            <div className="flex-1 p-4">
              <div className="flex justify-between items-center mb-3">
                <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
                <h2 className="text-2xl font-bold" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
              </div>
              <div className="border-t border-gray-300 pt-3 grid grid-cols-3 gap-4 text-xs">
                {sampleData.ref && (
                  <div>
                    <span className="text-gray-500 block mb-1">Reference:</span>
                    <span className="font-semibold">{sampleData.ref}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 block mb-1">Contract No:</span>
                  <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Date:</span>
                  <span className="font-semibold">{sampleData.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：左侧橙色竖栏、侧边竖文字、精品感强</p>
      </div>

      {/* 方案31：奥地利皇家风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案31：奥地利皇家风格（红牛/Swarovski/OMV）
        </h2>
        <div className="border-4 border-orange-600 border-double p-6 bg-gradient-to-r from-orange-50 via-white to-orange-50">
          <div className="flex items-center justify-between mb-4">
            <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
            <div className="text-center flex-1 mx-6">
              <div className="bg-white shadow-xl border-2 border-orange-600 px-12 py-3 inline-block">
                <h2 className="text-2xl font-bold tracking-widest" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-orange-600 border-dashed pt-3 flex justify-center gap-12 text-sm">
            {sampleData.ref && (
              <div className="text-center">
                <p className="text-gray-600 text-xs font-semibold">REFERENCE</p>
                <p className="font-bold mt-1">{sampleData.ref}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-gray-600 text-xs font-semibold">CONTRACT NUMBER</p>
              <p className="font-bold mt-1 text-lg" style={{ color: '#F96302' }}>{sampleData.contractNo}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-xs font-semibold">DATE</p>
              <p className="font-bold mt-1">{sampleData.date}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：双线边框、渐变背景、虚线分隔、皇家奢华</p>
      </div>

      {/* 方案32：泰国优雅风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案32：泰国优雅风格（PTT/泰航/正大集团）
        </h2>
        <div className="border-t-4 border-orange-600 border-b-4 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-3 rounded-full">
                <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
                <div className="flex gap-2">
                  <div className="h-1 w-12 bg-orange-600 rounded-full"></div>
                  <div className="h-1 w-8 bg-orange-400 rounded-full"></div>
                  <div className="h-1 w-4 bg-orange-300 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              {sampleData.ref && <div className="text-gray-600 mb-1.5">Ref: {sampleData.ref}</div>}
              <div className="font-bold text-base" style={{ color: '#F96302' }}>{sampleData.contractNo}</div>
              <div className="text-gray-600 mt-1.5">{sampleData.date}</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：圆形渐变Logo框、装饰圆点线、优雅大气</p>
      </div>

      {/* 方案33：马来西亚多元风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案33：马来西亚多元风格（马航/国油/马银行）
        </h2>
        <div>
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 p-4">
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
                  <div className="h-14 border-l-2 border-orange-600"></div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#F96302' }}>SALES CONTRACT</h2>
                    <p className="text-xs text-gray-600">Kontrak Jualan</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded px-4 py-2 text-xs">
                  {sampleData.ref && <div className="mb-1">Ref: {sampleData.ref}</div>}
                  <div className="font-bold text-orange-600">{sampleData.contractNo}</div>
                  <div className="mt-1">{sampleData.date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：橙色外框、内嵌白卡、圆角设计、多元融合</p>
      </div>

      {/* 方案34：越南新兴风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案34：越南新兴风格（Vingroup/FPT/越南航空）
        </h2>
        <div className="border-l-6 border-orange-600 pl-5 py-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
                <h2 className="text-2xl font-bold" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
              </div>
              <div className="flex gap-6 text-xs">
                {sampleData.ref && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span className="text-gray-600">Ref:</span>
                    <span className="font-medium">{sampleData.ref}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-gray-600">No:</span>
                  <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{sampleData.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：左侧粗条、圆点标记、横向信息、新兴活力</p>
      </div>

      {/* 方案35：菲律宾活泼风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案35：菲律宾活泼风格（SM集团/Jollibee/菲航）
        </h2>
        <div className="border-4 border-orange-600 rounded-2xl p-5 bg-gradient-to-br from-white to-orange-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-5">
              <div className="bg-white rounded-full p-3 shadow-md border-2 border-orange-600">
                <img src={cosunLogo} alt="Logo" className="w-auto h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-bold" style={{ color: '#F96302' }}>
                  SALES CONTRACT
                </h2>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex justify-around text-xs">
              {sampleData.ref && (
                <div className="text-center">
                  <p className="text-gray-500 mb-1">Reference</p>
                  <p className="font-semibold">{sampleData.ref}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-gray-500 mb-1">Contract No</p>
                <p className="font-bold text-orange-600">{sampleData.contractNo}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 mb-1">Date</p>
                <p className="font-semibold">{sampleData.date}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：圆角边框、圆形Logo框、渐变背景、活泼友好</p>
      </div>

      {/* 方案36：印尼群岛风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案36：印尼群岛风格（国营企业/印尼航空/Telkom）
        </h2>
        <div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-orange-600 via-orange-500 to-orange-400 rounded-r"></div>
            <div className="pl-6 pr-4 py-4 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="bg-white shadow-lg p-2 rounded">
                    <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-wide" style={{ color: '#F96302' }}>
                      SALES CONTRACT
                    </h2>
                    <div className="mt-1 flex gap-1">
                      <div className="h-1 w-16 bg-orange-600"></div>
                      <div className="h-1 w-12 bg-orange-500"></div>
                      <div className="h-1 w-8 bg-orange-400"></div>
                      <div className="h-1 w-4 bg-orange-300"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white shadow-md rounded-lg px-5 py-3 text-xs border-l-4 border-orange-600">
                  {sampleData.ref && <div className="text-gray-600 mb-1">Ref: {sampleData.ref}</div>}
                  <div className="font-bold text-base" style={{ color: '#F96302' }}>{sampleData.contractNo}</div>
                  <div className="text-gray-600 mt-1">{sampleData.date}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-b-2 border-orange-600"></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：渐变侧条、层次装饰线、阴影卡片、群岛特色</p>
      </div>

      {/* 方案1：台湾制造业风格 - 双线分隔 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案1：台湾制造业风格（富士康/台达/华硕）
        </h2>
        <div className="border-b-2 pb-4" style={{ borderColor: '#F96302' }}>
          <div className="flex justify-between items-start">
            {/* 左侧：Logo + 公司信息 */}
            <div className="flex items-start gap-4">
              <img src={cosunLogo} alt="Logo" className="w-auto h-16" />
              <div className="text-xs leading-tight">
                <h3 className="font-bold text-sm mb-1">福建高盛达富建材有限公司</h3>
                <p className="text-gray-600">FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.</p>
                <p className="text-gray-600 mt-1">Add: XX Road, Xiamen, Fujian, China</p>
                <p className="text-gray-600">Tel: +86-592-xxx-xxxx | Email: sales@cosun.com</p>
              </div>
            </div>
            
            {/* 右侧：文档信息 */}
            <div className="text-right">
              <div className="bg-orange-500 text-white px-6 py-2 font-bold text-xl mb-3">
                SALES CONTRACT
              </div>
              <div className="text-xs space-y-1">
                <p className="text-gray-600">Ref: <span className="text-gray-900">{sampleData.ref}</span></p>
                <p className="text-gray-600">Contract No: <span className="font-bold text-orange-600">{sampleData.contractNo}</span></p>
                <p className="text-gray-600">Date: <span className="text-gray-900">{sampleData.date}</span></p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：信息完整、层次清晰、适合制造业</p>
      </div>

      {/* 方案2：欧美简约风格 - 顶部Logo + 信息条 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案2：欧美简约风格（Apple/Google/Amazon）
        </h2>
        <div>
          {/* 顶部：Logo居中 */}
          <div className="flex justify-center mb-4">
            <img src={cosunLogo} alt="Logo" className="w-auto h-20" />
          </div>
          
          {/* 分隔线 */}
          <div className="border-b border-gray-300 mb-3"></div>
          
          {/* 信息条：左中右布局 */}
          <div className="flex justify-between items-center text-xs">
            <div className="font-bold text-base">SALES CONTRACT</div>
            <div className="text-gray-600">
              {sampleData.ref && <span className="mr-4">Ref: {sampleData.ref}</span>}
              <span className="mr-4">No: <span className="font-bold text-orange-600">{sampleData.contractNo}</span></span>
              <span>Date: {sampleData.date}</span>
            </div>
          </div>
          
          {/* 底部橙色线 */}
          <div className="border-b-2 mt-3" style={{ borderColor: '#F96302' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：极简、现代、Logo突出、适合科技公司</p>
      </div>

      {/* 方案3：欧美工业风格 - 全宽页眉条 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案3：欧美工业风格（西门子/GE/ABB）
        </h2>
        <div className="bg-gradient-to-r from-gray-50 to-orange-50 border-b-4 p-4" style={{ borderColor: '#F96302' }}>
          <div className="flex justify-between items-center">
            {/* 左侧：Logo */}
            <img src={cosunLogo} alt="Logo" className="w-auto h-14" />
            
            {/* 中间：标题 */}
            <div className="text-2xl font-bold" style={{ color: '#F96302' }}>
              SALES CONTRACT
            </div>
            
            {/* 右侧：编号信息（表格化） */}
            <div className="bg-white border border-gray-300 rounded px-4 py-2 text-xs">
              <table className="border-collapse">
                <tbody>
                  {sampleData.ref && (
                    <tr>
                      <td className="pr-2 text-gray-600">Ref:</td>
                      <td className="font-semibold">{sampleData.ref}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="pr-2 text-gray-600">Contract No:</td>
                    <td className="font-bold text-orange-600">{sampleData.contractNo}</td>
                  </tr>
                  <tr>
                    <td className="pr-2 text-gray-600">Date:</td>
                    <td className="font-semibold">{sampleData.date}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：专业、稳重、信息表格化、适合工业企业</p>
      </div>

      {/* 方案4：正式法律文档风格 */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案4：正式法律文档风格（律师事务所/银行）
        </h2>
        <div className="border-2 border-gray-300 p-4">
          {/* 顶部：Logo + 公司名称 */}
          <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-300">
            <img src={cosunLogo} alt="Logo" className="w-auto h-12" />
            <div>
              <h3 className="font-bold text-sm">福建高盛达富建材有限公司</h3>
              <p className="text-xs text-gray-600">FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.</p>
            </div>
          </div>
          
          {/* 中间：标题 */}
          <div className="text-center mb-4">
            <div className="inline-block border-t-2 border-b-2 border-orange-600 py-2 px-8">
              <h2 className="text-2xl font-bold" style={{ color: '#F96302' }}>
                SALES CONTRACT
              </h2>
            </div>
          </div>
          
          {/* 底部：编号信息表格 */}
          <div className="bg-gray-50 p-3 text-sm">
            <div className="grid grid-cols-3 gap-4">
              {sampleData.ref && (
                <div className="text-center">
                  <span className="text-gray-600 text-xs block">Reference</span>
                  <span className="font-semibold">{sampleData.ref}</span>
                </div>
              )}
              <div className="text-center">
                <span className="text-gray-600 text-xs block">Contract Number</span>
                <span className="font-bold text-orange-600">{sampleData.contractNo}</span>
              </div>
              <div className="text-center">
                <span className="text-gray-600 text-xs block">Date</span>
                <span className="font-semibold">{sampleData.date}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：严谨、对称、信息结构化、适合法律文档</p>
      </div>

      {/* 方案5：现代极简风格（当前方案优化版）*/}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          方案5：现代极简风格（当前方案优化版）
        </h2>
        <div className="border-b-2 pb-4" style={{ borderColor: '#F96302' }}>
          <div className="grid grid-cols-3 items-end gap-4">
            {/* 左侧：Logo */}
            <div className="flex justify-start">
              <img src={cosunLogo} alt="Logo" className="w-auto h-20" />
            </div>
            
            {/* 中间：标题 */}
            <div className="flex justify-center">
              <div className="inline-block px-8 py-2.5 text-2xl text-white font-bold" style={{ backgroundColor: '#F96302' }}>
                SALES CONTRACT
              </div>
            </div>
            
            {/* 右侧：编号信息 */}
            <div className="flex justify-end">
              <div className="text-xs leading-relaxed space-y-1">
                {sampleData.ref && (
                  <div className="text-gray-600">
                    Ref: <span className="text-gray-900">{sampleData.ref}</span>
                  </div>
                )}
                <div className="text-gray-600">
                  Contract No: <span className="font-bold" style={{ color: '#F96302' }}>{sampleData.contractNo}</span>
                </div>
                <div className="text-gray-600">
                  Date: <span className="text-gray-900">{sampleData.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">✅ 特点：清晰、平衡、三栏对称、适合B2B外贸</p>
      </div>

      {/* 推荐说明 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
        <h3 className="font-bold text-blue-900 mb-3">💡 布局选择建议</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>方案1（台湾制造业）：</strong>适合需要展示完整公司资质的场景，信息量大但专业</p>
          <p><strong>方案2（欧美简约）：</strong>适合品牌形象突出的公司，Logo居中强化品牌认知</p>
          <p><strong>方案3（欧美工业）：</strong>适合大型工业企业，视觉冲击力强，表格化信息清晰</p>
          <p><strong>方案4（法律文档）：</strong>适合正式合同，结构严谨，信息层次分明</p>
          <p><strong>方案5（现代极简）：</strong>适合B2B外贸，平衡性好，信息紧凑不占空间（当前使用）</p>
        </div>
      </div>
    </div>
  );
};