import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak } from 'docx';
import { saveAs } from 'file-saver';
import { ExcelArticle } from '../types';

// Border styles
const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const verticalBorderRight = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
};

const verticalBorderLeft = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

// Font sizes (docx uses half-points, so multiply by 2)
const size13 = 26; // 13pt
const size14 = 28; // 14pt
const size16 = 32; // 16pt
const font = 'Times New Roman';

/**
 * Tạo nội dung phiếu kiểm tra cho 1 bài viết (dùng cho batch export)
 */
function createPhieuKiemTraContent(article: ExcelArticle, isLastArticle: boolean): Paragraph[] {
    const children: Paragraph[] = [
        // TẠP CHÍ CỘNG SẢN - Left aligned, bold, size 13
        new Paragraph({
            children: [
                new TextRun({ text: 'TẠP CHÍ CỘNG SẢN', bold: true, size: size13, font }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 240 },
        }),

        // PHIẾU KIỂM TRA - Centered, bold, size 16
        new Paragraph({
            children: [
                new TextRun({ text: 'PHIẾU KIỂM TRA', bold: true, size: size16, font }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
        }),

        // Tin tổng hợp: [LOẠI BÀI VIẾT] + [TIÊU ĐỀ]
        new Paragraph({
            children: [
                new TextRun({ text: `${article.type || 'Tin tổng hợp'}: `, size: size14, font }),
                new TextRun({ text: article.title, bold: true, italics: true, size: size14, font }),
            ],
            spacing: { after: 120 },
        }),

        // Tác giả + Bút danh
        new Paragraph({
            children: [
                new TextRun({ text: 'Tác giả: ', size: size14, font }),
                new TextRun({ text: article.author || article.creator || '……………………', size: size14, font }),
                new TextRun({ text: '\t\t\tBút danh: ……………… ', size: size14, font }),
            ],
            spacing: { after: 120 },
        }),

        // Chức danh, địa chỉ:
        new Paragraph({
            children: [new TextRun({ text: 'Chức danh, địa chỉ:', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Số CCCD:
        new Paragraph({
            children: [new TextRun({ text: 'Số CCCD:', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Số tài khoản tác giả:
        new Paragraph({
            children: [new TextRun({ text: 'Số tài khoản tác giả:', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Ngân hàng:
        new Paragraph({
            children: [new TextRun({ text: 'Ngân hàng:', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Chi nhánh:
        new Paragraph({
            children: [new TextRun({ text: 'Chi nhánh:', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Loại bài
        new Paragraph({
            children: [new TextRun({ text: 'Loại bài: ☐ Viết ☐ Viết chung ☐ Chấp bút ☐ Phỏng vấn ☐ Đặt  ☐ Khai thác', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Người thực hiện
        new Paragraph({
            children: [
                new TextRun({ text: 'Người thực hiện: ', size: size14, font }),
                new TextRun({ text: article.creator || '……………………', size: size14, font }),
            ],
            spacing: { after: 120 },
        }),

        // Người chữa lần 1
        new Paragraph({
            children: [new TextRun({ text: 'Người chữa lần 1: Vũ Trung Duy', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Người chữa lần 2
        new Paragraph({
            children: [new TextRun({ text: 'Người chữa lần 2: Lê Hải', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Ngày nhận bài + Ngày nộp bài
        new Paragraph({
            children: [new TextRun({ text: 'Ngày nhận bài: ……./………/……..…; Ngày nộp bài: ..…../………/………..…', size: size14, font })],
            spacing: { after: 0 },
        }),

        // Đề nghị xếp loại + Đăng số
        new Paragraph({
            children: [new TextRun({ text: 'Đề nghị xếp loại:…………………………. Đăng số:……………………………...', size: size14, font })],
            spacing: { after: 360 },
        }),

        // Trưởng Ban TCCS Điện tử - Right aligned
        new Paragraph({
            children: [new TextRun({ text: 'Trưởng Ban TCCS Điện tử', bold: true, size: size14, font })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 40 },
        }),

        // Ngày - Right aligned, italic
        new Paragraph({
            children: [new TextRun({ text: 'Ngày........../........../..............', italics: true, size: size14, font })],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 240 },
        }),

        // Phó trưởng ban ấn phẩm
        new Paragraph({
            children: [new TextRun({ text: 'Phó trưởng ban ấn phẩm: ngày nhận…………………………………………………….', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Trưởng ban ấn phẩm
        new Paragraph({
            children: [new TextRun({ text: 'Trưởng ban ấn phẩm: ngày nhận……………………………………………………..', size: size14, font })],
            spacing: { after: 120 },
        }),

        // Xếp loại
        new Paragraph({
            children: [new TextRun({ text: 'Xếp loại: ………………………………………………………………………......', size: size14, font })],
            spacing: { after: 360 },
        }),

        // QUYẾT ĐỊNH - Centered, bold
        new Paragraph({
            children: [new TextRun({ text: 'QUYẾT ĐỊNH', bold: true, size: size14, font })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
        }),
    ];

    // Thêm bảng quyết định
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: 'Phó Tổng Biên tập                                           |                    Tổng Biên tập', bold: true, size: size14, font }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
        }),
        new Paragraph({
            children: [new TextRun({ text: 'Đăng số:…………………………….          |        Đăng số:…………………………...', size: size14, font })],
            spacing: { after: 120 },
        }),
        new Paragraph({
            children: [new TextRun({ text: 'Xếp loại: Nhuận bút……Biên tập……     |        Xếp loại: Nhuận bút……Biên tập……', size: size14, font })],
            spacing: { after: 120 },
        }),
    );

    // Thêm page break nếu không phải bài cuối
    if (!isLastArticle) {
        children.push(
            new Paragraph({
                children: [new PageBreak()],
            })
        );
    }

    return children;
}

/**
 * Xuất tất cả phiếu kiểm tra Word thành 1 file duy nhất
 */
export async function exportAllPhieuKiemTraToWord(articles: ExcelArticle[]): Promise<void> {
    if (articles.length === 0) {
        alert('Không có bài viết nào để xuất!');
        return;
    }

    // Tạo nội dung cho tất cả các bài
    const allChildren: Paragraph[] = [];

    articles.forEach((article, index) => {
        const isLast = index === articles.length - 1;
        const articleContent = createPhieuKiemTraContent(article, isLast);
        allChildren.push(...articleContent);
    });

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, bottom: 720, left: 1134, right: 1134 },
                },
            },
            children: allChildren,
        }],
    });

    // Tạo tên file với ngày tháng
    const now = new Date();
    const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    const fileName = `Phieu_Kiem_Tra_${articles.length}_bai_${dateStr}.docx`;

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
}

/**
 * Interface cho callback cập nhật tiến độ
 */
export interface BatchExportProgress {
    current: number;
    total: number;
    currentTitle: string;
    status: 'loading' | 'processing' | 'done' | 'error';
}

/**
 * Interface cho kết quả xuất PDF
 */
export interface ExportResult {
    success: boolean;
    totalArticles: number;
    successCount: number;
    failedArticles: { title: string; url: string; error: string }[];
}

/**
 * Hàm tải file log lỗi
 */
export function downloadErrorLog(failedArticles: { title: string; url: string; error: string }[], totalArticles: number): void {
    const logContent = [
        `=== BÁO CÁO LỖI XUẤT PDF ===`,
        `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
        `Tổng số bài: ${totalArticles}`,
        `Thành công: ${totalArticles - failedArticles.length}`,
        `Thất bại: ${failedArticles.length}`,
        ``,
        `=== DANH SÁCH BÀI LỖI ===`,
        ...failedArticles.map((f, i) => `${i + 1}. ${f.title}\n   URL: ${f.url}\n   Lỗi: ${f.error}\n`)
    ].join('\n');

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const logUrl = URL.createObjectURL(blob);
    const logLink = document.createElement('a');
    logLink.href = logUrl;
    logLink.download = `loi_xuat_pdf_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(logLink);
    logLink.click();
    document.body.removeChild(logLink);
    URL.revokeObjectURL(logUrl);
}

/**
 * Xuất tất cả bài viết thành PDF liên tục (mở 1 cửa sổ in duy nhất)
 * TỐI ƯU: Fetch song song nhiều bài cùng lúc
 * MỞ POPUP NGAY LẬP TỨC để tránh bị chặn
 */
export async function exportAllArticlesToPDF(
    articles: ExcelArticle[],
    fetchArticleContent: (url: string) => Promise<{ title: string; author: string; content: string; summary: string; mainImage: string }>,
    onProgress?: (progress: BatchExportProgress) => void
): Promise<ExportResult> {
    if (articles.length === 0) {
        alert('Không có bài viết nào để xuất!');
        return { success: false, totalArticles: 0, successCount: 0, failedArticles: [] };
    }

    // MỞ POPUP NGAY LẬP TỨC (phải làm trong event handler gốc để không bị chặn)
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Không thể mở cửa sổ in. Vui lòng cho phép popup trong cài đặt trình duyệt!');
        return { success: false, totalArticles: articles.length, successCount: 0, failedArticles: [] };
    }

    // Hiển thị loading trong popup
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Đang tải ${articles.length} bài viết...</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .loader-container {
                    text-align: center;
                    background: white;
                    padding: 3rem 4rem;
                    border-radius: 1rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .spinner {
                    width: 60px;
                    height: 60px;
                    border: 5px solid #e5e7eb;
                    border-top-color: #dc2626;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1.5rem;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                h2 { color: #1f2937; margin-bottom: 0.5rem; }
                #progress { color: #6b7280; font-size: 1.125rem; }
            </style>
        </head>
        <body>
            <div class="loader-container">
                <div class="spinner"></div>
                <h2>Đang tải bài viết...</h2>
                <p id="progress">0/${articles.length}</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();

    // Số lượng bài fetch song song (tăng tốc gấp 10 lần)
    const CONCURRENCY = 10;

    // Map để lưu kết quả theo đúng thứ tự
    const resultsMap = new Map<number, string>();
    let completedCount = 0;

    // Danh sách các bài bị lỗi để tạo file log
    const failedArticles: { title: string; url: string; error: string }[] = [];

    // Hàm tạo HTML cho 1 bài viết (có logo giống xuất riêng lẻ)
    const createArticleHtml = (article: ExcelArticle, content: { title: string; author: string; content: string; summary: string; mainImage: string }) => {
        return `
            <article class="article-item" style="page-break-after: always;">
                <!-- Header Logo giống xuất riêng lẻ -->
                <div style="text-align: center; margin-bottom: 3rem;">
                    <img src="/logo-xaydungdang.png" style="max-height: 48px; margin: 0 auto 0.75rem; display: block; object-fit: contain;" />
                    <div style="font-size: 12pt; font-weight: bold; color: #4b5563; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid #e5e7eb; padding-top: 1rem; max-width: 42rem; margin: 0 auto; font-family: 'Open Sans', sans-serif;">
                        Chuyên trang của Tạp chí Cộng sản nghiên cứu, tuyên truyền nghiệp vụ công tác Đảng
                    </div>
                </div>

                <!-- Tiêu đề -->
                <h1 style="font-size: ${content.title.length > 150 ? '1.25rem' : content.title.length > 100 ? '1.5rem' : '1.875rem'}; font-weight: 900; line-height: 1.25; margin-bottom: 1.5rem; color: #111827; text-align: center;">
                    ${content.title}
                </h1>
                
                <!-- Tác giả -->
                ${content.author ? `
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <span style="font-size: 1rem; font-weight: bold; color: #1f2937; text-transform: uppercase; letter-spacing: 0.05em;">
                            ${content.author}
                        </span>
                    </div>
                ` : ''}
                
                <!-- Sapo -->
                ${content.summary ? `
                    <div class="summary-box" style="font-weight: 700; font-size: 12.5pt; margin-bottom: 2.5rem; text-align: justify; line-height: 1.6; color: #111827;">
                        ${content.summary}
                    </div>
                ` : ''}
                
                <!-- Ảnh đại diện -->
                ${content.mainImage ? `
                    <div style="margin-bottom: 3rem;">
                        <img src="${content.mainImage}" alt="" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); display: block; margin: 0 auto;">
                    </div>
                ` : ''}
                
                <!-- Nội dung bài viết -->
                <div class="article-content-body">
                    ${content.content}
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 6rem; padding-top: 2.5rem; border-top: 1px solid #f3f4f6; text-align: center;">
                    <p style="font-size: 12px; color: #d1d5db; font-style: italic;">Nguồn: ${article.url}</p>
                </div>
            </article>
        `;
    };

    // Hàm fetch 1 bài và lưu kết quả (có retry 3 lần khi lỗi)
    const fetchAndProcess = async (article: ExcelArticle, index: number) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000; // 1 giây

        let lastError: any = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const content = await fetchArticleContent(article.url);
                resultsMap.set(index, createArticleHtml(article, content));

                // Thành công - cập nhật tiến độ và thoát
                completedCount++;
                try {
                    const progressEl = printWindow.document.getElementById('progress');
                    if (progressEl) {
                        progressEl.textContent = `${completedCount}/${articles.length}`;
                    }
                } catch (e) { }

                if (onProgress) {
                    onProgress({
                        current: completedCount,
                        total: articles.length,
                        currentTitle: `Đang tải ${completedCount}/${articles.length}...`,
                        status: 'loading'
                    });
                }
                return; // Thành công, thoát
            } catch (error) {
                lastError = error;
                console.warn(`Lỗi lần ${attempt}/${MAX_RETRIES} khi tải: ${article.url}`, error);

                // Đợi trước khi thử lại (trừ lần cuối)
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
                }
            }
        }

        // Sau 3 lần thử vẫn lỗi - BỎ QUA bài này (không đưa vào PDF)
        console.error(`Thất bại sau ${MAX_RETRIES} lần thử: ${article.url}`, lastError);

        // Thêm vào danh sách lỗi
        failedArticles.push({
            title: article.title,
            url: article.url,
            error: lastError?.message || 'Lỗi không xác định'
        });

        // KHÔNG set vào resultsMap => bài này sẽ bị bỏ qua trong PDF

        completedCount++;
        try {
            const progressEl = printWindow.document.getElementById('progress');
            if (progressEl) {
                progressEl.textContent = `${completedCount}/${articles.length} (${failedArticles.length} lỗi)`;
            }
        } catch (e) { }

        if (onProgress) {
            onProgress({
                current: completedCount,
                total: articles.length,
                currentTitle: `Đang tải ${completedCount}/${articles.length}... (${failedArticles.length} lỗi)`,
                status: 'loading'
            });
        }
    };

    // Xử lý theo batch song song
    for (let i = 0; i < articles.length; i += CONCURRENCY) {
        const batch = articles.slice(i, i + CONCURRENCY);
        const promises = batch.map((article, batchIndex) =>
            fetchAndProcess(article, i + batchIndex)
        );

        // Chờ tất cả bài trong batch hoàn thành
        await Promise.all(promises);
    }

    // Ghép kết quả theo đúng thứ tự (chỉ các bài thành công)
    const allContents: string[] = [];
    for (let i = 0; i < articles.length; i++) {
        const html = resultsMap.get(i);
        if (html) {
            allContents.push(html);
        }
    }

    // Thông báo nếu có bài lỗi
    if (failedArticles.length > 0) {
        alert(`⚠️ Có ${failedArticles.length}/${articles.length} bài bị lỗi!\n\nBấm nút "Tải Log Lỗi" để xem chi tiết.\nPDF sẽ chỉ chứa ${articles.length - failedArticles.length} bài thành công.`);
    }

    if (onProgress) {
        onProgress({
            current: articles.length,
            total: articles.length,
            currentTitle: 'Đang tạo PDF...',
            status: 'processing'
        });
    }

    // Cập nhật nội dung vào popup đã mở

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Xuất ${articles.length} bài viết - ${dateStr}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Open+Sans:wght@400;700;800&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                body { 
                    font-family: 'Merriweather', Georgia, serif; 
                    line-height: 1.8; 
                    font-size: 11.5pt; 
                    color: #000;
                    background: white;
                    padding: 2rem;
                }
                
                .container { max-width: 56rem; margin: 0 auto; }
                
                .article-item {
                    margin-bottom: 2rem;
                }
                
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
                
                @media print {
                    @page { 
                        margin: 1.5cm 2.2cm; 
                        size: A4; 
                    }
                    body { 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        padding: 0;
                    }
                    .article-item {
                        page-break-after: always;
                    }
                    .article-item:last-child {
                        page-break-after: auto;
                    }
                    h1 { page-break-after: avoid; }
                    .summary-box { page-break-inside: avoid; }
                    .article-content-body img { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                ${allContents.join('\n')}
            </div>
            <script>
                window.onload = function() {
                    const images = Array.from(document.getElementsByTagName('img'));
                    if (images.length === 0) {
                        setTimeout(() => { window.print(); }, 500);
                    } else {
                        let loaded = 0;
                        const checkPrint = () => {
                            loaded++;
                            if (loaded === images.length) {
                                setTimeout(() => { window.print(); }, 500);
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
                        // Timeout fallback sau 30s
                        setTimeout(() => { window.print(); }, 30000);
                    }
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();

    if (onProgress) {
        onProgress({
            current: articles.length,
            total: articles.length,
            currentTitle: 'Hoàn tất!',
            status: 'done'
        });
    }

    // Trả về kết quả
    return {
        success: true,
        totalArticles: articles.length,
        successCount: articles.length - failedArticles.length,
        failedArticles
    };
}
