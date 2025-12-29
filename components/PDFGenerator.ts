
export function printToPdf(elementId: string, logoBase64: string) {
  const content = document.getElementById(elementId);
  if (!content) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Inline all styles - no external CDN dependencies for faster loading
  const htmlContent = `
    <html>
      <head>
        <title>Trích xuất Nội dung - Xây dựng Đảng</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Open+Sans:wght@400;700;800&display=swap');
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body { 
            font-family: 'Merriweather', Georgia, serif; 
            line-height: 1.8; 
            font-size: 11.5pt; 
            color: #000;
            background: white;
            padding: 0;
          }
          
          .max-w-4xl { max-width: 56rem; margin: 0 auto; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .text-center { text-align: center; }
          .text-justify { text-align: justify; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-10 { margin-bottom: 2.5rem; }
          .mb-12 { margin-bottom: 3rem; }
          .mt-24 { margin-top: 6rem; }
          .pt-4 { padding-top: 1rem; }
          .pt-10 { padding-top: 2.5rem; }
          .pb-8 { padding-bottom: 2rem; }
          .p-10 { padding: 2.5rem; }
          .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
          .leading-tight { line-height: 1.25; }
          .leading-relaxed { line-height: 1.625; }
          .border-t { border-top: 1px solid #e5e7eb; }
          .border-b { border-bottom: 1px solid #f3f4f6; }
          .rounded-lg { border-radius: 0.5rem; }
          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
          .w-full { width: 100%; }
          .h-auto { height: auto; }
          .max-h-40 { max-height: 10rem; }
          .max-h-12 { max-height: 3rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .max-w-2xl { max-width: 42rem; }
          .object-contain { object-fit: contain; }
          .inline-block { display: inline-block; }
          .block { display: block; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-center { align-items: center; }
          .italic { font-style: italic; }
          .uppercase { text-transform: uppercase; }
          .overflow-visible { overflow: visible; }
          .whitespace-normal { white-space: normal; }
          .break-words { word-wrap: break-word; }
          
          .text-3xl { font-size: 1.875rem; }
          .text-xl { font-size: 1.25rem; }
          .text-lg { font-size: 1.125rem; }
          .text-gray-900 { color: #111827; }
          .text-gray-800 { color: #1f2937; }
          .text-gray-700 { color: #374151; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-400 { color: #9ca3af; }
          .text-gray-300 { color: #d1d5db; }
          .text-gray-100 { color: #f3f4f6; }
          .bg-white { background-color: white; }
          
          .font-opensans { font-family: 'Open Sans', sans-serif !important; }
          .font-merriweather { font-family: 'Merriweather', serif !important; }
          
          /* Summary box */
          .summary-box {
            font-weight: 700 !important;
            font-style: normal !important;
            font-size: 12.5pt;
            margin-bottom: 2.5rem;
            text-align: justify;
            line-height: 1.6;
          }
          
          /* Article content body */
          .article-content-body {
            text-align: justify;
            font-size: 11.5pt;
          }
          .article-content-body p {
            margin-bottom: 1.4em;
            text-align: justify;
            text-indent: 2.5em;
          }
          .article-content-body img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 25px auto;
            border-radius: 4px;
          }
          .article-content-body h2, .article-content-body h3 {
            font-weight: 900;
            margin-top: 1.5em;
            margin-bottom: 0.8em;
          }
          .article-content-body figure {
            margin: 25px 0;
          }
          .article-content-body figcaption {
            text-align: center;
            font-size: 10pt;
            color: #666;
            margin-top: 8px;
          }
          
          /* Print styles */
          @media print {
            @page { 
              margin: 1.5cm 2.2cm; 
              size: A4; 
            }
            body { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1 { page-break-after: avoid; }
            .summary-box { page-break-inside: avoid; }
            .article-content-body img { page-break-inside: avoid; }
            .article-content-body h2, .article-content-body h3 { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="max-w-4xl mx-auto">
          ${content.innerHTML}
        </div>
        <script>
          window.onload = function() {
            const images = Array.from(document.getElementsByTagName('img'));
            if (images.length === 0) {
              setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 100);
            } else {
              let loaded = 0;
              const checkPrint = () => {
                loaded++;
                if (loaded === images.length) {
                  setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 200);
                }
              };
              images.forEach(img => {
                if (img.complete) {
                  checkPrint();
                } else {
                  img.onload = checkPrint;
                  img.onerror = checkPrint;
                }
              });
            }
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
