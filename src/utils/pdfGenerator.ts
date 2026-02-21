/**
 * PDF Generator Utility
 * Uses browser's print functionality to generate PDF
 */

export async function downloadRFQAsPDF(inquiryId: string): Promise<void> {
  // Create a hidden iframe for PDF generation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Unable to access iframe document');
  }

  // Get the RFQ content
  const rfqContent = document.querySelector('[data-rfq-content]');
  if (!rfqContent) {
    document.body.removeChild(iframe);
    throw new Error('RFQ content not found');
  }

  // Clone the content
  const contentClone = rfqContent.cloneNode(true) as HTMLElement;

  // Get all stylesheets
  const stylesheets = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        // Handle CORS issues with external stylesheets
        return '';
      }
    })
    .join('\n');

  // Create HTML document for iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>RFQ-${inquiryId}</title>
        <style>
          ${stylesheets}
          
          /* Additional PDF-specific styles */
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            margin: 0;
            padding: 15mm;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:p-\\[15mm\\] {
            padding: 15mm !important;
          }
          
          .print\\:break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${contentClone.innerHTML}
      </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Trigger print dialog
  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe);
    };
    
    iframe.contentWindow.print();
  }

  // Cleanup if print was cancelled
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 1000);
}

/**
 * Alternative method: Use html2canvas and jsPDF
 * This requires importing libraries
 */
export async function downloadRFQAsPDFAdvanced(inquiryId: string): Promise<void> {
  try {
    // Dynamic import of html2pdf library
    const html2pdf = await import('html2pdf.js@0.10.2');
    
    // Get the RFQ content element
    const element = document.querySelector('[data-rfq-content]');
    if (!element) {
      throw new Error('RFQ content not found');
    }

    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove elements that shouldn't be in PDF
    const elementsToRemove = clone.querySelectorAll('.print\\:hidden, [data-pdf-exclude]');
    elementsToRemove.forEach(el => el.remove());
    
    // Show print-only elements
    const printOnlyElements = clone.querySelectorAll('.print\\:block');
    printOnlyElements.forEach(el => {
      (el as HTMLElement).style.display = 'block';
    });

    // PDF options
    const opt = {
      margin: [15, 15, 15, 15], // 15mm margins
      filename: `RFQ-${inquiryId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.print\\:break-before',
        after: '.print\\:break-after',
        avoid: '.print\\:break-inside-avoid'
      }
    };

    // Generate and download PDF
    await html2pdf.default().set(opt).from(clone).save();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback to print method
    return downloadRFQAsPDF(inquiryId);
  }
}
