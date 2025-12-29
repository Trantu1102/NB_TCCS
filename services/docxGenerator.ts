import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ExcelArticle } from '../types';

// Create a "Phiếu kiểm tra" document for an article - matching exact template
export async function generatePhieuKiemTra(article: ExcelArticle): Promise<void> {
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

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, bottom: 720, left: 1134, right: 1134 },
                },
            },
            children: [
                // TẠP CHÍ CỘNG SẢN - Left aligned, bold, size 13, NOT italic
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

                // Tin tổng hợp: [TIÊU ĐỀ] + (1 ảnh KT)
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Tin tổng hợp: ', size: size14, font }),
                        new TextRun({ text: article.title, bold: true, italics: true, size: size14, font }),

                    ],
                    spacing: { after: 120 },
                }),

                // Tác giả + Bút danh
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Tác giả: ', size: size14, font }),
                        new TextRun({ text: article.creator || '……………………', size: size14, font }),
                        new TextRun({ text: '\t\t\tBút danh: ……………… ', size: size14, font }),
                        new TextRun({ text: '(tổng hợp)', italics: true, size: size14, font }),
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

                // Người chữa lần 1: Vũ Trung Duy
                new Paragraph({
                    children: [new TextRun({ text: 'Người chữa lần 1: Vũ Trung Duy', size: size14, font })],
                    spacing: { after: 120 },
                }),

                // Người chữa lần 2: Lê Hải
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

                // Table with vertical divider in the middle
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        // Header row: Phó Tổng Biên tập | Tổng Biên tập
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: 'Phó Tổng Biên tập', bold: true, size: size14, font })],
                                            alignment: AlignmentType.CENTER,
                                        }),
                                    ],
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    borders: verticalBorderRight,
                                    margins: { right: 400 },
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: 'Tổng Biên tập', bold: true, size: size14, font })],
                                            alignment: AlignmentType.CENTER,
                                        }),
                                    ],
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    borders: verticalBorderLeft,
                                    margins: { left: 400 },
                                }),
                            ],
                        }),
                        // Đăng số row
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: 'Đăng số:……………………………...', size: size14, font })],
                                        }),
                                    ],
                                    borders: verticalBorderRight,
                                    margins: { right: 400 },
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: 'Đăng số:……………………………...', size: size14, font })],
                                        }),
                                    ],
                                    borders: verticalBorderLeft,
                                    margins: { left: 400 },
                                }),
                            ],
                        }),
                        // Xếp loại row
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: 'Xếp loại: Nhuận bút……Biên tập……', size: size14, font })],
                                        }),
                                    ],
                                    borders: verticalBorderRight,
                                    margins: { right: 400 },
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: 'Xếp loại: Nhuận bút……Biên tập……', size: size14, font })],
                                        }),
                                    ],
                                    borders: verticalBorderLeft,
                                    margins: { left: 400 },
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });

    // Generate and download the document
    const blob = await Packer.toBlob(doc);
    const fileName = `Phieu_Kiem_Tra_${article.stt}_${sanitizeFileName(article.title)}.docx`;
    saveAs(blob, fileName);
}

// Helper function to sanitize file name
function sanitizeFileName(name: string): string {
    return name
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
}
