// PDF Export Utilities - Smart page breaking

/**
 * Export to PDF with smart page breaking
 * Avoids cutting content in the middle of a page
 */
export const exportToPDF = async (
  elementRef: HTMLDivElement,
  filename: string,
  options?: {
    format?: 'a4' | 'letter';
    orientation?: 'portrait' | 'landscape';
  }
) => {
  try {
    // Import modern-screenshot for better CSS support
    const { domToPng } = await import('modern-screenshot');
    const jsPDF = (await import('jspdf')).default;

    const { toast } = await import('sonner@2.0.3');
    const toastId = toast.loading('生成PDF...');

    const format = options?.format || 'a4';
    const orientation = options?.orientation || 'portrait';
    
    // A4尺寸（毫米）
    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const pageHeight = orientation === 'portrait' ? 297 : 210;
    
    // 页边距（毫米） - 与CSS @page保持一致
    const marginTop = 15;
    const marginBottom = 15;
    const marginLeft = 15;
    const marginRight = 15;
    
    // 可打印区域尺寸
    const printableWidth = pageWidth - marginLeft - marginRight;
    const printableHeight = pageHeight - marginTop - marginBottom;

    console.log('🎨 开始PDF导出...');
    console.log('📐 页面尺寸:', `${pageWidth}mm x ${pageHeight}mm`);
    console.log('📏 可打印区域:', `${printableWidth}mm x ${printableHeight}mm`);

    // Generate PNG with high quality
    console.log('🖼️ 生成高清图片...');
    const dataUrl = await domToPng(elementRef, {
      scale: 2,  // 2x分辨率，确保清晰度
      backgroundColor: '#ffffff',
      quality: 1.0,
    });

    console.log('✅ 图片生成成功');

    // Load image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    console.log('📏 图片尺寸:', img.width, 'x', img.height);

    // Calculate dimensions - 使用可打印区域
    const imgWidth = printableWidth;
    const imgHeight = (img.height * imgWidth) / img.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
    });

    const totalPages = Math.ceil(imgHeight / printableHeight);
    console.log('📄 总页数:', totalPages);

    // If single page, just add it
    if (totalPages === 1) {
      pdf.addImage(dataUrl, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);
    } else {
      // Multi-page: add all content without cutting
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const yOffset = marginTop - (page * printableHeight);
        pdf.addImage(dataUrl, 'PNG', marginLeft, yOffset, imgWidth, imgHeight);
        
        console.log(`📄 页面 ${page + 1}/${totalPages}:`, `yOffset=${yOffset}mm`);
      }
    }

    // Save
    console.log('💾 保存PDF:', filename);
    pdf.save(filename);

    toast.success('PDF导出成功!', { id: toastId });
    console.log('✅ PDF导出完成!');

    return true;

  } catch (error) {
    console.error('❌ PDF导出失败:', error);
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const { toast } = await import('sonner@2.0.3');
    
    toast.error('PDF导出失败，请使用浏览器打印功能', { 
      id: toastId,
      duration: 5000,
      description: '按Ctrl+P或Cmd+P，然后选择"保存为PDF"'
    });
    
    return false;
  }
};

/**
 * Alternative: Use browser's native print dialog
 * Most reliable method for complex CSS and page breaking
 */
export const exportToPDFPrint = async (
  elementRef: HTMLDivElement,
  filename: string
) => {
  try {
    const { toast } = await import('sonner@2.0.3');
    
    console.log('🖨️ 使用浏览器打印功能...');
    
    // Get all document styles
    let allStyles = '';
    
    // Get inline styles from style tags
    const styleTags = Array.from(document.querySelectorAll('style'));
    styleTags.forEach(style => {
      allStyles += style.textContent || '';
    });
    
    // Get external stylesheets
    const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const styleImports = linkTags
      .map(link => `@import url("${link.getAttribute('href')}");`)
      .join('\n');

    // Create print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      toast.error('请允许弹出窗口');
      return false;
    }

    // Build print document with all styles and page break support
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${filename}</title>
          <style>
            ${styleImports}
            ${allStyles}
            
            /* Page setup */
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            /* Print-specific styles */
            @media print {
              html, body {
                margin: 0;
                padding: 0;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              
              /* Avoid breaking inside tables and divs */
              table, .avoid-break {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Allow breaks between table rows if needed */
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
            
            /* Screen styles */
            html, body {
              margin: 0;
              padding: 0;
              background: white;
            }
          </style>
        </head>
        <body>
          ${elementRef.outerHTML}
          <script>
            // Auto-trigger print after content loads
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 1000);
            };
            
            // Close after print or cancel
            window.onafterprint = function() {
              setTimeout(() => {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    toast.info('请在打印对话框中选择"保存为PDF"', { duration: 5000 });
    console.log('✅ 打印窗口已打开');

    return true;

  } catch (error) {
    console.error('❌ 打印失败:', error);
    const { toast } = await import('sonner@2.0.3');
    toast.error('打印失败，请重试');
    return false;
  }
};

/**
 * Simple print method
 */
export const printToPDF = (elementRef: HTMLDivElement, title: string) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('请允许弹出窗口');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            table, .avoid-break {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${elementRef.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 250);
};

/**
 * Generate standardized filename
 */
export const generatePDFFilename = (prefix: string, id: string) => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${id}_${date}.pdf`;
};