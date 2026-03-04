import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Save, Send, Plus, X, Calculator, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';

interface QuotationDocumentProps {
  rfq: any;
  initialData?: any;
  onSubmit?: (quoteData: any, submitType: 'draft' | 'review' | 'direct') => void;
  preview?: boolean;
}

export default function QuotationDocument({ rfq, initialData, onSubmit, preview = false }: QuotationDocumentProps) {
  // 缩放比例状态
  const [scale, setScale] = useState(1);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 价格计算器状态
  const [priceCalcOpen, setPriceCalcOpen] = useState(false);
  const [currentPriceIndex, setCurrentPriceIndex] = useState<number | null>(null);
  const [priceCalc, setPriceCalc] = useState({
    costPrice: '10.00',
    profitRate: '25',
    taxRate: '13',
    includeTax: true,
  });

  // 各种选择器的弹窗状态
  const [priceTermsDialogOpen, setPriceTermsDialogOpen] = useState(false);
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [leadTimeDialogOpen, setLeadTimeDialogOpen] = useState(false);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [portDialogOpen, setPortDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [moqDialogOpen, setMoqDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);

  // 验证提示对话框
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [highlightMissing, setHighlightMissing] = useState(false);

  // 字段引用，用于跳转定位
  const dateRef = useRef<HTMLInputElement>(null);
  const priceTermsButtonRef = useRef<HTMLButtonElement>(null);
  const currencyButtonRef = useRef<HTMLButtonElement>(null);
  const paymentButtonRef = useRef<HTMLButtonElement>(null);
  const productRefsMap = useRef<Map<string, HTMLInputElement | HTMLButtonElement>>(new Map());

  // 当验证对话框关闭后，保持高亮30秒
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!validationDialogOpen && highlightMissing) {
      // 对话框关闭后，30秒后自动取消高亮
      timer = setTimeout(() => {
        setHighlightMissing(false);
      }, 30000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [validationDialogOpen, highlightMissing]);

  // 生成报价单数据
  const [quotationNo, setQuotationNo] = useState(() => {
    const dateObj = new Date();
    return `COSUN-Q-${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
  });

  const [quotationData, setQuotationData] = useState({
    date: new Date().toISOString().split('T')[0],
    validDays: '30',
    customerName: 'COSUN采购部',
    contactPerson: '采购经理',
    rfqNo: rfq.id,
  });

  // 产品列表
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'LED面板灯', // 默认选择第一个产品
      nameEn: 'LED Panel Light',
      specification: '600x600mm 36W 白光', // 默认选择第一个产品
      hsCode: '9405.40.00',
      quantity: rfq.quantity || 8000,
      unit: 'PCS',
      unitPrice: initialData?.unitPrice || '12.50',
      leadTime: initialData?.leadTime || '30',
      moq: initialData?.moq || '1000',
      remark: `MOQ: ${initialData?.moq || '1000'}pcs`,
    },
  ]);

  // 价格条件选项
  const [priceTermsOptions, setPriceTermsOptions] = useState([
    { id: 1, label: 'FOB 厦门', labelEn: 'FOB Xiamen', checked: true }, // 默认选中
    { id: 2, label: 'CIF', labelEn: 'CIF', checked: false },
    { id: 3, label: 'EXW', labelEn: 'EXW', checked: false },
    { id: 4, label: 'DDU', labelEn: 'DDU', checked: false },
    { id: 5, label: 'DDP', labelEn: 'DDP', checked: false },
  ]);

  const [taxOptions, setTaxOptions] = useState([
    { id: 1, label: '含税价', labelEn: 'Tax Included', checked: true },
    { id: 2, label: '不含税', labelEn: 'Tax Excluded', checked: false },
  ]);

  const [currencyOptions, setCurrencyOptions] = useState([
    { id: 1, label: 'CNY 人民币', checked: true }, // 默认选中
    { id: 2, label: 'USD 美元', checked: false },
    { id: 3, label: 'EUR 欧元', checked: false },
    { id: 4, label: 'GBP 英镑', checked: false },
  ]);

  // 付款条件
  const [paymentOptions, setPaymentOptions] = useState([
    { id: 1, label: '账期30天', labelEn: 'Net 30 Days', checked: true }, // 默认选中
    { id: 2, label: 'TT 30%订金', labelEn: 'TT 30% Deposit', checked: false },
    { id: 3, label: 'LC 信用证', labelEn: 'L/C', checked: false },
    { id: 4, label: 'TT 全款', labelEn: 'TT 100%', checked: false },
    { id: 5, label: 'DP 付款交单', labelEn: 'D/P', checked: false },
  ]);

  // 交货期选项
  const [leadTimeOptions, setLeadTimeOptions] = useState([
    { id: 1, label: '收到订金后30天', labelEn: '30 days after deposit', checked: true },
    { id: 2, label: '收到订金后45天', labelEn: '45 days after deposit', checked: false },
    { id: 3, label: '收到订金后60天', labelEn: '60 days after deposit', checked: false },
    { id: 4, label: '现货', labelEn: 'In stock', checked: false },
  ]);

  // 包装选项
  const [packingOptions, setPackingOptions] = useState([
    { id: 1, label: '标准出口纸箱', labelEn: 'Export Carton', checked: true },
    { id: 2, label: '木箱包装', labelEn: 'Wooden Case', checked: false },
    { id: 3, label: '托盘包装', labelEn: 'Pallet', checked: false },
    { id: 4, label: '裸装', labelEn: 'Nude Packing', checked: false },
  ]);

  // 认证选项
  const [certOptions, setCertOptions] = useState([
    { id: 1, label: 'CE', checked: true },
    { id: 2, label: 'RoHS', checked: true },
    { id: 3, label: 'UL', checked: true },
    { id: 4, label: 'ISO9001', checked: true },
    { id: 5, label: 'ISO14001', checked: false },
    { id: 6, label: 'SASO', checked: false },
    { id: 7, label: 'CB', checked: false },
  ]);

  // 装货港
  const [portOptions, setPortOptions] = useState([
    { id: 1, label: '中国厦门', labelEn: 'Xiamen, China', checked: true },
    { id: 2, label: '中国深圳', labelEn: 'Shenzhen, China', checked: false },
    { id: 3, label: '中国宁波', labelEn: 'Ningbo, China', checked: false },
    { id: 4, label: '中国上海', labelEn: 'Shanghai, China', checked: false },
    { id: 5, label: '中国广州', labelEn: 'Guangzhou, China', checked: false },
  ]);

  // MOQ选项
  const [moqOptions, setMoqOptions] = useState([
    { id: 1, label: '1000 PCS', checked: true },
    { id: 2, label: '500 PCS', checked: false },
    { id: 3, label: '2000 PCS', checked: false },
    { id: 4, label: '5000 PCS', checked: false },
  ]);

  // 产品库数据
  const productLibrary = [
    {
      id: 1,
      name: 'LED面板灯',
      nameEn: 'LED Panel Light',
      specification: '600x600mm 36W 白光',
      hsCode: '9405.40.00',
      unitPrice: '12.50',
      moq: '1000',
    },
    {
      id: 2,
      name: 'LED筒灯',
      nameEn: 'LED Downlight',
      specification: '5寸 12W 暖白光',
      hsCode: '9405.40.00',
      unitPrice: '8.80',
      moq: '500',
    },
    {
      id: 3,
      name: 'LED灯管',
      nameEn: 'LED Tube Light',
      specification: 'T8 1200mm 18W',
      hsCode: '9405.40.00',
      unitPrice: '5.60',
      moq: '2000',
    },
    {
      id: 4,
      name: 'LED轨道灯',
      nameEn: 'LED Track Light',
      specification: '20W COB 3000K',
      hsCode: '9405.40.00',
      unitPrice: '15.30',
      moq: '500',
    },
    {
      id: 5,
      name: 'LED投光灯',
      nameEn: 'LED Flood Light',
      specification: '50W IP65 户外',
      hsCode: '9405.40.00',
      unitPrice: '22.00',
      moq: '200',
    },
    {
      id: 6,
      name: 'LED灯带',
      nameEn: 'LED Strip Light',
      specification: '5050 60灯/米 RGB',
      hsCode: '9405.40.00',
      unitPrice: '3.20',
      moq: '100',
    },
  ];

  // 新输入字段状态
  const [newPriceTerm, setNewPriceTerm] = useState('');
  const [newCurrency, setNewCurrency] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [newPaymentEn, setNewPaymentEn] = useState('');
  const [newLeadTime, setNewLeadTime] = useState('');
  const [newLeadTimeEn, setNewLeadTimeEn] = useState('');
  const [newPacking, setNewPacking] = useState('');
  const [newPackingEn, setNewPackingEn] = useState('');
  const [newPort, setNewPort] = useState('');
  const [newPortEn, setNewPortEn] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newMoq, setNewMoq] = useState('');

  // 备注列表
  const [remarks, setRemarks] = useState([
    { id: 1, text: '以上报价有效期30天，逾期需重新确认。', textEn: 'Above quotation is valid for 30 days.' },
    { id: 2, text: '价格以人民币计价，含13%增值税。', textEn: 'Price in CNY, including 13% VAT.' },
    { id: 3, text: '交货期以收到订金为准。', textEn: 'Lead time counts from deposit received date.' },
    { id: 4, text: `最小订购量${initialData?.moq || '1000'}件，低于此数量价格需另议。`, textEn: `MOQ ${initialData?.moq || '1000'} pcs, price negotiable for smaller qty.` },
    { id: 5, text: '运费由买方承担。', textEn: "Freight on buyer's account." },
    { id: 6, text: '质保3年，接受第三方验货(SGS/BV/TUV)。', textEn: '3-year warranty, 3rd party inspection accepted.' },
  ]);

  // 计算最终价格
  const calculateFinalPrice = () => {
    const cost = parseFloat(priceCalc.costPrice);
    const profitRate = parseFloat(priceCalc.profitRate) / 100;
    const taxRate = parseFloat(priceCalc.taxRate) / 100;
    let price = cost * (1 + profitRate);
    if (priceCalc.includeTax) {
      price = price * (1 + taxRate);
    }
    return price.toFixed(2);
  };

  // 打开价格计算器
  const openPriceCalculator = (index: number) => {
    setCurrentPriceIndex(index);
    const product = products[index];
    setPriceCalc({
      costPrice: (parseFloat(product.unitPrice) / 1.25 / 1.13).toFixed(2),
      profitRate: '25',
      taxRate: '13',
      includeTax: true,
    });
    setPriceCalcOpen(true);
  };

  // 应用计算的价格
  const applyCalculatedPrice = () => {
    if (currentPriceIndex !== null) {
      const finalPrice = calculateFinalPrice();
      const newProducts = [...products];
      newProducts[currentPriceIndex].unitPrice = finalPrice;
      setProducts(newProducts);
    }
    setPriceCalcOpen(false);
  };

  // 添加新产品行
  const addProductRow = () => {
    setProducts([
      ...products,
      {
        id: products.length + 1,
        name: '',
        nameEn: '',
        specification: '',
        hsCode: '',
        quantity: 0,
        unit: 'PCS',
        unitPrice: '0.00',
        leadTime: '30',
        moq: '1000',
        remark: '',
      },
    ]);
  };

  // 删除产品行
  const deleteProductRow = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  // 更新产品数据
  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  // 打开产品选择对话框
  const openProductSelector = (index: number) => {
    setCurrentProductIndex(index);
    setProductDialogOpen(true);
  };

  // 选择产品
  const selectProduct = (product: any) => {
    if (currentProductIndex !== null) {
      const newProducts = [...products];
      newProducts[currentProductIndex] = {
        ...newProducts[currentProductIndex],
        name: product.name,
        nameEn: product.nameEn,
        specification: product.specification,
        hsCode: product.hsCode,
        unitPrice: product.unitPrice,
        moq: product.moq,
        remark: `MOQ: ${product.moq}pcs`,
      };
      setProducts(newProducts);
    }
    setProductDialogOpen(false);
  };

  // 跳转到缺失字段
  const scrollToField = useCallback((fieldName: string) => {
    // 关闭验证对话框
    setValidationDialogOpen(false);

    // 延迟执行跳转，确保对话框关闭动画完成
    setTimeout(() => {
      let targetElement: HTMLElement | null = null;
      let openDialog: (() => void) | null = null;

      // 匹配日期
      if (fieldName.includes('日期') || fieldName.includes('Date')) {
        targetElement = dateRef.current;
      }
      // 匹配价格条款
      else if (fieldName.includes('价格条款') || fieldName.includes('Price Terms')) {
        targetElement = priceTermsButtonRef.current;
        openDialog = () => setPriceTermsDialogOpen(true);
      }
      // 匹配币种
      else if (fieldName.includes('币种') || fieldName.includes('Currency')) {
        targetElement = currencyButtonRef.current;
        openDialog = () => setCurrencyDialogOpen(true);
      }
      // 匹配付款条件
      else if (fieldName.includes('付款条件') || fieldName.includes('Payment Terms')) {
        targetElement = paymentButtonRef.current;
        openDialog = () => setPaymentDialogOpen(true);
      }
      // 匹配产品字段
      else if (fieldName.includes('产品') || fieldName.includes('Product')) {
        // 提取产品索引
        const match = fieldName.match(/产品 (\d+)|Product (\d+)/);
        if (match) {
          const productIndex = parseInt(match[1] || match[2]) - 1;
          
          // 判断是哪个字段
          if (fieldName.includes('品名') || fieldName.includes('Description')) {
            targetElement = productRefsMap.current.get(`product-${productIndex}-name`) || null;
            openDialog = () => openProductSelector(productIndex);
          } else if (fieldName.includes('规格') || fieldName.includes('Specification')) {
            targetElement = productRefsMap.current.get(`product-${productIndex}-specification`) || null;
            openDialog = () => openProductSelector(productIndex);
          } else if (fieldName.includes('数量') || fieldName.includes('Quantity')) {
            targetElement = productRefsMap.current.get(`product-${productIndex}-quantity`) || null;
          } else if (fieldName.includes('单价') || fieldName.includes('Unit Price')) {
            targetElement = productRefsMap.current.get(`product-${productIndex}-unitPrice`) || null;
          }
        }
      }

      // 如果找到了目标元素，滚动并聚焦
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.focus();
        
        // 添加闪烁动画效果
        targetElement.classList.add('ring-4', 'ring-orange-500', 'ring-offset-2');
        setTimeout(() => {
          targetElement?.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-2');
        }, 2000);

        // 如果有对话框需要打开（选择类型的字段），延迟打开
        if (openDialog) {
          setTimeout(() => {
            openDialog();
          }, 500);
        }
      }
    }, 300);
  }, []);

  // 验证必填字段
  const validateQuotation = (): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];

    // 基本信息验证（客户名称和联络人为可选项，不验证）
    if (!quotationData.date) {
      missing.push('日期 (Date)');
    }

    // 产品信息验证
    if (products.length === 0) {
      missing.push('至少需要一个产品 (At least one product required)');
    } else {
      products.forEach((product, index) => {
        console.log(`验证产品 ${index + 1}:`, product);
        if (!product.name || product.name.trim() === '') {
          missing.push(`产品 ${index + 1} - 品名 (Product ${index + 1} - Description)`);
          console.log(`  ✗ 品名缺失:`, product.name);
        } else {
          console.log(`  ✓ 品名:`, product.name);
        }
        if (!product.specification || product.specification.trim() === '') {
          missing.push(`产品 ${index + 1} - 规格 (Product ${index + 1} - Specification)`);
          console.log(`  ✗ 规格缺失:`, product.specification);
        } else {
          console.log(`  ✓ 规格:`, product.specification);
        }
        if (!product.quantity || product.quantity <= 0) {
          missing.push(`产品 ${index + 1} - 数量 (Product ${index + 1} - Quantity)`);
          console.log(`  ✗ 数量缺失:`, product.quantity);
        } else {
          console.log(`  ✓ 数量:`, product.quantity);
        }
        if (!product.unitPrice || parseFloat(product.unitPrice) <= 0) {
          missing.push(`产品 ${index + 1} - 单价 (Product ${index + 1} - Unit Price)`);
          console.log(`  ✗ 单价缺失:`, product.unitPrice);
        } else {
          console.log(`  ✓ 单价:`, product.unitPrice);
        }
      });
    }

    // 价格条款验证
    const selectedPriceTerms = priceTermsOptions.filter(opt => opt.checked);
    console.log('价格条款选项:', priceTermsOptions);
    console.log('已选价格条款:', selectedPriceTerms);
    if (selectedPriceTerms.length === 0) {
      missing.push('价格条款 (Price Terms)');
      console.log('✗ 价格条款缺失');
    } else {
      console.log('✓ 价格条款:', selectedPriceTerms.map(o => o.label).join(', '));
    }

    // 币种验证
    const selectedCurrency = currencyOptions.filter(opt => opt.checked);
    console.log('币种选项:', currencyOptions);
    console.log('已选币种:', selectedCurrency);
    if (selectedCurrency.length === 0) {
      missing.push('币种 (Currency)');
      console.log('✗ 币种缺失');
    } else {
      console.log('✓ 币种:', selectedCurrency.map(o => o.label).join(', '));
    }

    // 付款条件验证
    const selectedPayment = paymentOptions.filter(opt => opt.checked);
    console.log('付款条件选项:', paymentOptions);
    console.log('已选付款条件:', selectedPayment);
    if (selectedPayment.length === 0) {
      missing.push('付款条件 (Payment Terms)');
      console.log('✗ 付款条件缺失');
    } else {
      console.log('✓ 付款条件:', selectedPayment.map(o => o.label).join(', '));
    }

    console.log('=== 验证结果 ===');
    console.log('缺失字段总数:', missing.length);
    console.log('缺失字段列表:', missing);

    return {
      valid: missing.length === 0,
      missing: missing,
    };
  };

  // 处理提交
  const handleSubmit = (submitType: 'draft' | 'review' | 'direct') => {
    console.log('🚀 提交类型:', submitType);
    
    // 草稿可以直接保存，不需要验证
    if (submitType === 'draft') {
      if (onSubmit) {
        onSubmit({}, submitType);
      }
      return;
    }

    // 提交报价需要验证
    console.log('📝 开始验证报价单...');
    const validation = validateQuotation();
    
    console.log('✅ 验证结果:', validation);
    
    if (!validation.valid) {
      console.log('❌ 验证失败，缺失字段:', validation.missing);
      setMissingFields(validation.missing);
      setHighlightMissing(true); // 立即开启高亮
      setValidationDialogOpen(true); // 打开验证对话框
      return;
    }

    // 验证通过，提交数据
    console.log('✅ 验证通过，提交数据');
    if (onSubmit) {
      onSubmit({}, submitType);
    }
  };

  // 切换选项
  const toggleOption = (options: any[], setOptions: (opts: any[]) => void, id: number) => {
    setOptions(
      options.map((opt) =>
        opt.id === id ? { ...opt, checked: !opt.checked } : opt
      )
    );
  };

  // 删除自定义选项
  const deleteOption = (options: any[], setOptions: (opts: any[]) => void, id: number) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  // 添加自定义选项
  const addCustomOption = (
    options: any[],
    setOptions: (opts: any[]) => void,
    newValue: string,
    newValueEn: string = ''
  ) => {
    if (newValue.trim()) {
      const newOption = {
        id: Math.max(...options.map(o => o.id)) + 1,
        label: newValue,
        labelEn: newValueEn,
        checked: false,
        custom: true,
      };
      setOptions([...options, newOption]);
    }
  };

  // 添加备注
  const addRemark = () => {
    setRemarks([
      ...remarks,
      {
        id: remarks.length + 1,
        text: '新备注内容...',
        textEn: 'New remark...',
      },
    ]);
  };

  // 删除备注
  const deleteRemark = (id: number) => {
    setRemarks(remarks.filter((r) => r.id !== id));
  };

  // 更新备注
  const updateRemark = (id: number, field: 'text' | 'textEn', value: string) => {
    setRemarks(
      remarks.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // 计算合计金额
  const totalAmount = products.reduce(
    (sum, p) => sum + p.quantity * parseFloat(p.unitPrice || '0'),
    0
  );

  // 获取选中的值显示
  const getSelectedText = (options: any[]) => {
    const selected = options.filter(o => o.checked);
    if (selected.length === 0) return '点击选择...';
    return selected.map(o => `${o.label}${o.labelEn ? ' ' + o.labelEn : ''}`).join(', ');
  };

  // 缩放控制
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
    setDragOffset({ x: 0, y: 0 });
  };

  // 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 全局鼠标抬起事件
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="bg-gray-100 p-8 min-h-screen flex justify-center relative">
      {/* 极简缩放控制器 */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-50 no-print">
        <div className="flex flex-col items-center bg-white shadow-lg rounded-full p-2">
          {/* 放大符号 */}
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          {/* 垂直线和滑块 */}
          <div className="relative flex items-center justify-center" style={{ height: '120px', width: '32px' }}>
            {/* 线 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 transform -translate-x-1/2" />
            
            {/* 滑块手柄 */}
            <input
              type="range"
              orient="vertical"
              min="50"
              max="200"
              step="5"
              value={scale * 100}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="minimal-vertical-slider"
              style={{
                width: '120px',
                height: '32px',
                margin: 0,
                transform: 'rotate(-90deg)',
                transformOrigin: 'center center',
              }}
            />
          </div>
          
          {/* 缩小符号 */}
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* A4纸张容器 */}
      <div 
        className={`bg-white shadow-xl ${scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        style={{ 
          width: '210mm',
          minHeight: '297mm',
          padding: '15mm 20mm',
          fontSize: '11px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${scale})`,
          transformOrigin: 'top center',
          marginBottom: scale < 1 ? `${(1 - scale) * 297}mm` : '0',
          userSelect: isDragging ? 'none' : 'auto',
          transition: isDragging ? 'none' : 'transform 0.2s',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      {/* 价格计算器弹窗 */}
      <Dialog open={priceCalcOpen} onOpenChange={setPriceCalcOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              价格计算器 Price Calculator
            </DialogTitle>
            <DialogDescription>
              快速计算产品单价，输入成本价和利润率
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ fontSize: '12px' }}>成本价 Cost Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceCalc.costPrice}
                  onChange={(e) => setPriceCalc({ ...priceCalc, costPrice: e.target.value })}
                  style={{ fontSize: '12px' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: '12px' }}>利润率 Profit Rate (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={priceCalc.profitRate}
                  onChange={(e) => setPriceCalc({ ...priceCalc, profitRate: e.target.value })}
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ fontSize: '12px' }}>税率 Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={priceCalc.taxRate}
                  onChange={(e) => setPriceCalc({ ...priceCalc, taxRate: e.target.value })}
                  style={{ fontSize: '12px' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ fontSize: '12px' }}>含税 Include Tax</Label>
                <div className="flex items-center h-10">
                  <Checkbox
                    checked={priceCalc.includeTax}
                    onCheckedChange={(checked) =>
                      setPriceCalc({ ...priceCalc, includeTax: checked as boolean })
                    }
                  />
                  <span className="ml-2" style={{ fontSize: '12px' }}>
                    {priceCalc.includeTax ? '含税价' : '不含税'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '13px' }}>计算结果 Final Price:</span>
                <span className="font-bold text-orange-600" style={{ fontSize: '16px' }}>
                  ¥{calculateFinalPrice()}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>成本: ¥{priceCalc.costPrice}</p>
                <p>+ 利润({priceCalc.profitRate}%): ¥{(parseFloat(priceCalc.costPrice) * parseFloat(priceCalc.profitRate) / 100).toFixed(2)}</p>
                {priceCalc.includeTax && (
                  <p>+ 税({priceCalc.taxRate}%): ¥{(parseFloat(priceCalc.costPrice) * (1 + parseFloat(priceCalc.profitRate) / 100) * parseFloat(priceCalc.taxRate) / 100).toFixed(2)}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPriceCalcOpen(false)}>
                取消
              </Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={applyCalculatedPrice}>
                应用价格
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 价格条件选择弹窗 */}
      <Dialog open={priceTermsDialogOpen} onOpenChange={setPriceTermsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>价格条件 Price Terms & 含税 Tax</DialogTitle>
            <DialogDescription>
              选择报价单的价格条款（FOB、CIF等）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="font-medium" style={{ fontSize: '12px' }}>价格条件:</p>
              {priceTermsOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(priceTermsOptions, setPriceTermsOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label} {opt.labelEn}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(priceTermsOptions, setPriceTermsOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="自定义价格条件"
                  value={newPriceTerm}
                  onChange={(e) => setNewPriceTerm(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    addCustomOption(priceTermsOptions, setPriceTermsOptions, newPriceTerm);
                    setNewPriceTerm('');
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="font-medium" style={{ fontSize: '12px' }}>含税选项:</p>
              {taxOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(taxOptions, setTaxOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label} {opt.labelEn}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setPriceTermsDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 币别选择弹窗 */}
      <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>币别 Currency</DialogTitle>
            <DialogDescription>
              选择报价单使用的币种（CNY、USD等）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {currencyOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(currencyOptions, setCurrencyOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(currencyOptions, setCurrencyOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="自定义币别"
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    addCustomOption(currencyOptions, setCurrencyOptions, newCurrency);
                    setNewCurrency('');
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setCurrencyDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 付款条件选择弹窗 */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>付款条件 Payment Terms</DialogTitle>
            <DialogDescription>
              选择报价单的付款条件（账期、TT、LC等）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {paymentOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(paymentOptions, setPaymentOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label} {opt.labelEn}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(paymentOptions, setPaymentOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="space-y-2 pt-2">
                <Input
                  placeholder="中文"
                  value={newPayment}
                  onChange={(e) => setNewPayment(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Input
                  placeholder="English"
                  value={newPaymentEn}
                  onChange={(e) => setNewPaymentEn(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    addCustomOption(paymentOptions, setPaymentOptions, newPayment, newPaymentEn);
                    setNewPayment('');
                    setNewPaymentEn('');
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setPaymentDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 交货期选择弹窗 */}
      <Dialog open={leadTimeDialogOpen} onOpenChange={setLeadTimeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>交货期 Lead Time</DialogTitle>
            <DialogDescription>
              选择或自定义产品交货期
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {leadTimeOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(leadTimeOptions, setLeadTimeOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label} {opt.labelEn}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(leadTimeOptions, setLeadTimeOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="space-y-2 pt-2">
                <Input
                  placeholder="中文"
                  value={newLeadTime}
                  onChange={(e) => setNewLeadTime(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Input
                  placeholder="English"
                  value={newLeadTimeEn}
                  onChange={(e) => setNewLeadTimeEn(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    addCustomOption(leadTimeOptions, setLeadTimeOptions, newLeadTime, newLeadTimeEn);
                    setNewLeadTime('');
                    setNewLeadTimeEn('');
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setLeadTimeDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 包装选择弹窗 */}
      <Dialog open={packingDialogOpen} onOpenChange={setPackingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>包装 Packing</DialogTitle>
            <DialogDescription>
              选择产品包装方式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {packingOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(packingOptions, setPackingOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label} {opt.labelEn}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(packingOptions, setPackingOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="space-y-2 pt-2">
                <Input
                  placeholder="中文"
                  value={newPacking}
                  onChange={(e) => setNewPacking(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Input
                  placeholder="English"
                  value={newPackingEn}
                  onChange={(e) => setNewPackingEn(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    addCustomOption(packingOptions, setPackingOptions, newPacking, newPackingEn);
                    setNewPacking('');
                    setNewPackingEn('');
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setPackingDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 装货港选择弹窗 */}
      <Dialog open={portDialogOpen} onOpenChange={setPortDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>装货港 Port</DialogTitle>
            <DialogDescription>
              选择产品装货港口
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {portOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(portOptions, setPortOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label} {opt.labelEn}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(portOptions, setPortOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="space-y-2 pt-2">
                <Input
                  placeholder="中文"
                  value={newPort}
                  onChange={(e) => setNewPort(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Input
                  placeholder="English"
                  value={newPortEn}
                  onChange={(e) => setNewPortEn(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    addCustomOption(portOptions, setPortOptions, newPort, newPortEn);
                    setNewPort('');
                    setNewPortEn('');
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setPortDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 认证选择弹窗 */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>认证 Certificate</DialogTitle>
            <DialogDescription>
              选择产品拥有的认证证书
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {certOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(certOptions, setCertOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(certOptions, setCertOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="添加认证"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    addCustomOption(certOptions, setCertOptions, newCert);
                    setNewCert('');
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setCertDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MOQ选择弹窗 */}
      <Dialog open={moqDialogOpen} onOpenChange={setMoqDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>最小订购量 MOQ</DialogTitle>
            <DialogDescription>
              选择或自定义最小订购数量
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {moqOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opt.checked}
                    onCheckedChange={() => toggleOption(moqOptions, setMoqOptions, opt.id)}
                  />
                  <span style={{ fontSize: '12px' }}>{opt.label}</span>
                  {opt.custom && (
                    <button
                      onClick={() => deleteOption(moqOptions, setMoqOptions, opt.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="自定义MOQ"
                  value={newMoq}
                  onChange={(e) => setNewMoq(e.target.value)}
                  style={{ fontSize: '11px' }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    addCustomOption(moqOptions, setMoqOptions, newMoq);
                    setNewMoq('');
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setMoqDialogOpen(false)}>确定</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 产品选择对话框 */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '14px' }}>选择产品 Select Product</DialogTitle>
            <DialogDescription>
              从产品库中选择产品，自动填充品名、规格、价格等信息
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full" style={{ fontSize: '12px' }}>
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-3 py-2 text-left font-semibold">品名 Description</th>
                    <th className="px-3 py-2 text-left font-semibold">规格 Specification</th>
                    <th className="px-3 py-2 text-right font-semibold">单价 Price</th>
                    <th className="px-3 py-2 text-center font-semibold">MOQ</th>
                    <th className="px-3 py-2 text-center font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {productLibrary.map((product) => (
                    <tr 
                      key={product.id} 
                      className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => selectProduct(product)}
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-gray-600 text-xs">{product.nameEn}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-gray-900">{product.specification}</div>
                        <div className="text-gray-500 text-xs">HS: {product.hsCode}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-orange-600">
                        ¥{product.unitPrice}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700">
                        {product.moq} PCS
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => selectProduct(product)}
                          style={{ fontSize: '11px' }}
                        >
                          选择
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setProductDialogOpen(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 验证提示对话框 */}
      <Dialog open={validationDialogOpen} onOpenChange={(open) => {
        setValidationDialogOpen(open);
        // 关闭对话框时不要取消高亮，让用户能看到需要填写的字段
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600" style={{ fontSize: '18px' }}>
              <span className="text-3xl">⚠️</span>
              请完善必填信息
            </DialogTitle>
            <DialogDescription>
              以下字段为必填项，请完成后再提交报价单
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
              <p className="text-orange-900 font-semibold mb-2" style={{ fontSize: '15px' }}>
                📋 请填写以下 {missingFields.length} 个必填项：
              </p>
              <p className="text-orange-800" style={{ fontSize: '13px' }}>
                已用<span className="inline-block bg-yellow-200 border-2 border-yellow-500 px-2 py-1 rounded mx-1 font-bold shadow-sm">醒目黄色背景</span>在表单中标注
              </p>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-5 max-h-96 overflow-y-auto shadow-lg">
              <ul className="space-y-3">
                {missingFields.map((field, index) => (
                  <li 
                    key={index} 
                    onClick={() => scrollToField(field)}
                    className="flex items-start gap-3 p-2 bg-white rounded border-l-4 border-orange-500 cursor-pointer hover:bg-orange-50 hover:border-orange-600 transition-all duration-200 hover:shadow-md" 
                    style={{ fontSize: '14px' }}
                  >
                    <span className="text-orange-600 font-bold mt-0.5" style={{ fontSize: '18px' }}>▶</span>
                    <span className="text-gray-900 font-semibold">{field}</span>
                  </li>
                ))}
              </ul>
              
              {/* 调试信息 */}
              <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs">
                <p className="font-bold mb-2">🔍 调试信息（可忽略）：</p>
                <p>产品数: {products.length}</p>
                {products.length > 0 && (
                  <>
                    <p>产品1名称: {products[0].name || '(空)'}</p>
                    <p>产品1规格: {products[0].specification || '(空)'}</p>
                    <p>产品1数量: {products[0].quantity || '(空)'}</p>
                    <p>产品1单价: {products[0].unitPrice || '(空)'}</p>
                  </>
                )}
                <p>价格条款: {priceTermsOptions.filter(o => o.checked).map(o => o.label).join(', ') || '(未选)'}</p>
                <p>币种: {currencyOptions.filter(o => o.checked).map(o => o.label).join(', ') || '(未选)'}</p>
                <p>付款条件: {paymentOptions.filter(o => o.checked).map(o => o.label).join(', ') || '(未选)'}</p>
                <p>日期: {quotationData.date || '(空)'}</p>
                <p>高亮状态: {highlightMissing ? '已开启' : '未开启'}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-400 rounded-lg">
              <p className="text-blue-900 font-medium" style={{ fontSize: '13px' }}>
                💡 <strong>操作提示：</strong>关闭此对话框后，请向下滚动查看表单，所有未填写的字段都已用<strong>黄色背景+粗黄边框</strong>标注。如需暂时保存，请点击"保存草稿"按钮。
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setValidationDialogOpen(false);
                }}
              >
                我知道了
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* 公司抬头和标题 */}
      <div className="mb-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div>
            <h1 className="font-bold" style={{ fontSize: '18px' }}>福建高盛达富建材有限公司</h1>
            <p className="text-gray-700" style={{ fontSize: '11px' }}>FUJIAN COSUN BUILDING MATERIALS CO., LTD.</p>
          </div>
          <div className="text-right">
            <p className="font-bold" style={{ fontSize: '20px' }}>报 价 单</p>
            <p className="text-gray-700" style={{ fontSize: '12px' }}>QUOTATION</p>
          </div>
        </div>
      </div>

      {/* 基本信息表格 - 可编辑 */}
      <table className="w-full border-collapse mb-3" style={{ fontSize: '11px' }}>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-2 py-1 bg-gray-100 w-20 font-medium">客户 To:</td>
            <td className="border border-gray-400 px-2 py-1 w-1/3">
              <input
                type="text"
                value={quotationData.customerName}
                onChange={(e) => setQuotationData({ ...quotationData, customerName: e.target.value })}
                className="w-full bg-transparent border-none outline-none"
                style={{ fontSize: '11px' }}
              />
            </td>
            <td className="border border-gray-400 px-2 py-1 bg-gray-100 w-24 font-medium">报价单号 Quote No:</td>
            <td className="border border-gray-400 px-2 py-1 font-bold">
              <input
                type="text"
                value={quotationNo}
                onChange={(e) => setQuotationNo(e.target.value)}
                className="w-full bg-transparent border-none outline-none font-bold"
                style={{ fontSize: '11px' }}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-medium">联络人 Attn:</td>
            <td className="border border-gray-400 px-2 py-1">
              <input
                type="text"
                value={quotationData.contactPerson}
                onChange={(e) => setQuotationData({ ...quotationData, contactPerson: e.target.value })}
                className="w-full bg-transparent border-none outline-none"
                style={{ fontSize: '11px' }}
              />
            </td>
            <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-medium">日期 Date:</td>
            <td className={`border px-2 py-1 ${highlightMissing && !quotationData.date ? 'border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'border-gray-400'}`}>
              <input
                ref={dateRef}
                type="date"
                value={quotationData.date}
                onChange={(e) => setQuotationData({ ...quotationData, date: e.target.value })}
                className="w-full bg-transparent border-none outline-none"
                style={{ fontSize: '11px' }}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-medium">采购询价编号 Inquiry No:</td>
            <td className="border border-gray-400 px-2 py-1">
              <input
                type="text"
                value={quotationData.rfqNo}
                onChange={(e) => setQuotationData({ ...quotationData, rfqNo: e.target.value })}
                className="w-full bg-transparent border-none outline-none"
                style={{ fontSize: '11px' }}
              />
            </td>
            <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-medium">有效期 Valid Until:</td>
            <td className="border border-gray-400 px-2 py-1 text-red-600 font-medium">
              <input
                type="text"
                value={quotationData.validDays}
                onChange={(e) => setQuotationData({ ...quotationData, validDays: e.target.value })}
                className="w-full bg-transparent border-none outline-none text-red-600 font-medium"
                style={{ fontSize: '11px' }}
                placeholder="30天"
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* 产品明细表 - 可编辑 */}
      <table className="w-full border-collapse mb-3" style={{ fontSize: '11px' }}>
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-center" style={{ width: '5%' }}>
              项次<br/>Item
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-left" style={{ width: '15%' }}>
              品名<br/>Description
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-left" style={{ width: '21%' }}>
              规格<br/>Specification
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-center" style={{ width: '10%' }}>
              数量<br/>Qty
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-center" style={{ width: '6%' }}>
              单位<br/>Unit
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-right" style={{ width: '10%' }}>
              单价<br/>Unit Price
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-right" style={{ width: '11%' }}>
              金额<br/>Amount
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-center" style={{ width: '8%' }}>
              交期<br/>Lead Time
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-left" style={{ width: '12%' }}>
              备注<br/>Remark
            </th>
            <th className="border border-gray-400 px-2 py-1.5 font-bold text-center" style={{ width: '2%' }}>
              
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product.id}>
              <td className="border border-gray-400 px-2 py-2 text-center font-medium">{index + 1}</td>
              <td className={`border px-2 py-2 ${highlightMissing && (!product.name || product.name.trim() === '') ? 'border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'border-gray-400'}`}>
                <button
                  ref={(el) => {
                    if (el) productRefsMap.current.set(`product-${index}-name`, el);
                  }}
                  onClick={() => openProductSelector(index)}
                  className={`w-full text-left px-1 py-1 rounded flex flex-col group ${highlightMissing && (!product.name || product.name.trim() === '') ? 'hover:bg-yellow-200' : 'hover:bg-gray-50'}`}
                  title="点击选择产品"
                >
                  <span className={`font-medium mb-1 ${product.name ? 'text-gray-900' : 'text-gray-400'}`} style={{ fontSize: '11px' }}>
                    {product.name || '点击选择产品...'}
                  </span>
                  <span className="text-gray-600" style={{ fontSize: '10px' }}>
                    {product.nameEn || 'Click to select product'}
                  </span>
                </button>
              </td>
              <td className={`border px-2 py-2 ${highlightMissing && (!product.specification || product.specification.trim() === '') ? 'border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'border-gray-400'}`}>
                <button
                  ref={(el) => {
                    if (el) productRefsMap.current.set(`product-${index}-specification`, el);
                  }}
                  onClick={() => openProductSelector(index)}
                  className={`w-full text-left px-1 py-1 rounded flex flex-col group ${highlightMissing && (!product.specification || product.specification.trim() === '') ? 'hover:bg-yellow-200' : 'hover:bg-gray-50'}`}
                  title="点击选择产品"
                >
                  <span className={`mb-1 ${product.specification ? 'text-gray-900' : 'text-gray-400'}`} style={{ fontSize: '11px' }}>
                    {product.specification || '点击选择规格...'}
                  </span>
                  <span className="text-gray-600" style={{ fontSize: '10px' }}>
                    {product.hsCode || 'HS Code'}
                  </span>
                </button>
              </td>
              <td className={`border px-3 py-2 text-center ${highlightMissing && (!product.quantity || product.quantity <= 0) ? 'border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'border-gray-400'}`}>
                <input
                  ref={(el) => {
                    if (el) productRefsMap.current.set(`product-${index}-quantity`, el);
                  }}
                  type="number"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent border-none outline-none text-center font-medium"
                  style={{ fontSize: '11px', minWidth: '60px' }}
                />
              </td>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input
                  type="text"
                  value={product.unit}
                  onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-center"
                  style={{ fontSize: '11px' }}
                />
              </td>
              <td className={`border px-2 py-2 text-right ${highlightMissing && (!product.unitPrice || parseFloat(product.unitPrice) <= 0) ? 'border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'border-gray-400'}`}>
                <button
                  ref={(el) => {
                    if (el) productRefsMap.current.set(`product-${index}-unitPrice`, el);
                  }}
                  onClick={() => openPriceCalculator(index)}
                  className="w-full text-right font-bold px-1 py-0.5 rounded cursor-pointer text-orange-600 hover:bg-orange-50"
                  title="点击打开价格计算器"
                >
                  ¥{product.unitPrice || '0.00'}
                </button>
              </td>
              <td className="border border-gray-400 px-2 py-2 text-right font-bold">
                ¥{(product.quantity * parseFloat(product.unitPrice || '0')).toLocaleString()}
              </td>
              <td className="border border-gray-400 px-2 py-2 text-center">
                <input
                  type="text"
                  value={product.leadTime}
                  onChange={(e) => updateProduct(index, 'leadTime', e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-center"
                  style={{ fontSize: '11px' }}
                  placeholder="30"
                />
              </td>
              <td className="border border-gray-400 px-2 py-2">
                <input
                  type="text"
                  value={product.remark}
                  onChange={(e) => updateProduct(index, 'remark', e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs"
                  style={{ fontSize: '9px' }}
                  placeholder="备注"
                />
              </td>
              <td className="border border-gray-400 px-1 py-2 text-center">
                {products.length > 1 && (
                  <button
                    onClick={() => deleteProductRow(index)}
                    className="text-red-500 hover:text-red-700"
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </td>
            </tr>
          ))}
          {/* 合计行 */}
          <tr className="bg-gray-50">
            <td colSpan={6} className="border border-gray-400 px-2 py-2 text-right font-bold">
              合计 Total Amount:
            </td>
            <td className="border border-gray-400 px-2 py-2 text-right font-bold text-orange-600" style={{ fontSize: '12px' }}>
              ¥{totalAmount.toLocaleString()}
            </td>
            <td colSpan={3} className="border border-gray-400 px-2 py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* 添加产品行按钮 */}
      <div className="mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={addProductRow}
          className="gap-1"
          style={{ fontSize: '11px' }}
        >
          <Plus className="w-3 h-3" />
          添加产品行
        </Button>
      </div>

      {/* 价格条件 - 点击弹窗 */}
      <table className="w-full border-collapse mb-3" style={{ fontSize: '11px' }}>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-bold w-28">价格条件 Price Terms:</td>
            <td className={`border px-2 py-1.5 ${highlightMissing && priceTermsOptions.filter(opt => opt.checked).length === 0 ? 'border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'border-gray-400'}`} colSpan={3}>
              <button
                ref={priceTermsButtonRef}
                onClick={() => setPriceTermsDialogOpen(true)}
                className={`w-full text-left px-2 py-1 rounded flex items-center justify-between group ${highlightMissing && priceTermsOptions.filter(opt => opt.checked).length === 0 ? 'hover:bg-yellow-200' : 'hover:bg-gray-50'}`}
              >
                <span className="text-gray-700">
                  {getSelectedText([...priceTermsOptions, ...taxOptions])}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
              <span className="mx-2 text-gray-600">|</span>
              <span className="text-gray-600">币别 Currency:</span>
              <button
                ref={currencyButtonRef}
                onClick={() => setCurrencyDialogOpen(true)}
                className={`ml-2 px-2 py-1 rounded inline-flex items-center gap-1 group ${highlightMissing && currencyOptions.filter(opt => opt.checked).length === 0 ? 'hover:bg-yellow-200 border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'hover:bg-gray-50'}`}
              >
                <span className="text-gray-700">
                  {getSelectedText(currencyOptions)}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-bold">付款条件 Payment:</td>
            <td className={`border px-2 py-1.5 ${highlightMissing && paymentOptions.filter(opt => opt.checked).length === 0 ? 'border-2 border-yellow-500 bg-yellow-100 shadow-md' : 'border-gray-400'}`}>
              <button
                ref={paymentButtonRef}
                onClick={() => setPaymentDialogOpen(true)}
                className={`w-full text-left px-2 py-1 rounded flex items-center justify-between group ${highlightMissing && paymentOptions.filter(opt => opt.checked).length === 0 ? 'hover:bg-yellow-200' : 'hover:bg-gray-50'}`}
              >
                <span className="text-gray-700">
                  {getSelectedText(paymentOptions)}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </td>
            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-bold w-28">最小订购量 MOQ:</td>
            <td className="border border-gray-400 px-2 py-1.5 font-medium">
              <button
                onClick={() => setMoqDialogOpen(true)}
                className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded flex items-center justify-between group"
              >
                <span className="text-gray-700">{getSelectedText(moqOptions)}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-bold">交货期 Lead Time:</td>
            <td className="border border-gray-400 px-2 py-1.5">
              <button
                onClick={() => setLeadTimeDialogOpen(true)}
                className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded flex items-center justify-between group"
              >
                <span className="text-gray-700">{getSelectedText(leadTimeOptions)}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </td>
            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-bold">包装 Packing:</td>
            <td className="border border-gray-400 px-2 py-1.5">
              <button
                onClick={() => setPackingDialogOpen(true)}
                className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded flex items-center justify-between group"
              >
                <span className="text-gray-700">{getSelectedText(packingOptions)}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-bold">装货港 Port:</td>
            <td className="border border-gray-400 px-2 py-1.5">
              <button
                onClick={() => setPortDialogOpen(true)}
                className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded flex items-center justify-between group"
              >
                <span className="text-gray-700">{getSelectedText(portOptions)}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </td>
            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-bold">认证 Certificate:</td>
            <td className="border border-gray-400 px-2 py-1.5">
              <button
                onClick={() => setCertDialogOpen(true)}
                className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded flex items-center justify-between group"
              >
                <span className="text-gray-700 text-green-700 font-medium">{getSelectedText(certOptions)}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 数量折扣表 */}
      <div className="mb-3">
        <p className="font-bold mb-1.5" style={{ fontSize: '11px' }}>数量折扣 Quantity Discount:</p>
        <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 font-bold text-center">订购数量 Order Qty</th>
              <th className="border border-gray-400 px-2 py-1 font-bold text-center">单价 Unit Price</th>
              <th className="border border-gray-400 px-2 py-1 font-bold text-center">折扣 Discount</th>
              <th className="border border-gray-400 px-2 py-1 font-bold text-center">订购数量 Order Qty</th>
              <th className="border border-gray-400 px-2 py-1 font-bold text-center">单价 Unit Price</th>
              <th className="border border-gray-400 px-2 py-1 font-bold text-center">折扣 Discount</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 && (
              <>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 text-center">{products[0].moq} - {parseInt(products[0].moq) * 2 - 1}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center font-medium">¥{products[0].unitPrice}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">标准价</td>
                  <td className="border border-gray-400 px-2 py-1 text-center">{parseInt(products[0].moq) * 5} - {parseInt(products[0].moq) * 10 - 1}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center font-medium text-green-600">¥{(parseFloat(products[0].unitPrice) * 0.95).toFixed(2)}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center text-green-600">-5%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1 text-center">{parseInt(products[0].moq) * 2} - {parseInt(products[0].moq) * 5 - 1}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center font-medium text-blue-600">¥{(parseFloat(products[0].unitPrice) * 0.97).toFixed(2)}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center text-blue-600">-3%</td>
                  <td className="border border-gray-400 px-2 py-1 text-center font-medium">{`> ${parseInt(products[0].moq) * 10}`}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center font-bold text-orange-600">¥{(parseFloat(products[0].unitPrice) * 0.92).toFixed(2)}</td>
                  <td className="border border-gray-400 px-2 py-1 text-center text-orange-600 font-medium">-8%</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 备注说明 - 可编辑和增删 */}
      <div className="mb-3 border border-gray-400 px-3 py-2" style={{ fontSize: '10px' }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="font-bold">备注 Remark:</p>
          <Button
            variant="outline"
            size="sm"
            onClick={addRemark}
            className="gap-1 h-6"
            style={{ fontSize: '9px' }}
          >
            <Plus className="w-3 h-3" />
            添加备注
          </Button>
        </div>
        <ul className="space-y-1 text-gray-800">
          {remarks.map((remark, idx) => (
            <li key={remark.id} className="flex items-start gap-2 group">
              <span className="flex-shrink-0">{idx + 1}.</span>
              <div className="flex-1">
                <input
                  type="text"
                  value={remark.text}
                  onChange={(e) => updateRemark(remark.id, 'text', e.target.value)}
                  className="w-full bg-transparent border-none outline-none group-hover:bg-gray-50"
                  style={{ fontSize: '10px' }}
                />
                <input
                  type="text"
                  value={remark.textEn}
                  onChange={(e) => updateRemark(remark.id, 'textEn', e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-gray-600 group-hover:bg-gray-50"
                  style={{ fontSize: '9px' }}
                />
              </div>
              <button
                onClick={() => deleteRemark(remark.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 签章区 */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="border border-gray-400 px-3 py-3">
          <p className="font-bold mb-3" style={{ fontSize: '10px' }}>供应商 Supplier:</p>
          <div className="mb-8">
            <p style={{ fontSize: '10px' }}>公司盖章 Company Chop:</p>
          </div>
          <div className="grid grid-cols-2 gap-4" style={{ fontSize: '10px' }}>
            <div>
              <p>签名 Signature: _____________</p>
            </div>
            <div>
              <p>日期 Date: _____________</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-400 px-3 py-3">
          <p className="font-bold mb-3" style={{ fontSize: '10px' }}>客户确认 Customer Confirmation:</p>
          <div className="mb-8">
            <p style={{ fontSize: '10px' }}>公司盖章 Company Chop:</p>
          </div>
          <div className="grid grid-cols-2 gap-4" style={{ fontSize: '10px' }}>
            <div>
              <p>签名 Signature: _____________</p>
            </div>
            <div>
              <p>日期 Date: _____________</p>
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <div className="mt-4 pt-3 border-t border-gray-300 text-center text-gray-600" style={{ fontSize: '9px' }}>
        <p>福建高盛达富建材有限公司 | 地址：福建省泉州市工业园区123号 362000</p>
        <p>Tel: +86-595-1234-5678 | Fax: +86-595-1234-5679 | Email: sales@cosun-building.com</p>
      </div>

      {/* 操作按钮 */}
      {onSubmit && (
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-300">
          <Button variant="outline" size="sm" onClick={() => handleSubmit('draft')}>
            <Save className="w-4 h-4 mr-2" />
            保存草稿
          </Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => handleSubmit('review')}>
            <Send className="w-4 h-4 mr-2" />
            提交报价
          </Button>
        </div>
      )}
      </div>
      {/* A4纸张容器结束 */}
    </div>
  );
}
