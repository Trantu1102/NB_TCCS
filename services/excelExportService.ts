import XLSX from 'xlsx-js-style';
import { ExcelArticle } from '../types';

// Định nghĩa style cho các ô
const headerStyle = {
    fill: {
        patternType: 'solid',
        fgColor: { rgb: 'FFFF99' }, // Màu vàng nhạt
    },
    font: {
        bold: true,
        sz: 11,
    },
    alignment: {
        horizontal: 'center',
        vertical: 'center',
        wrapText: true,
    },
    border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
    }
};

const titleStyle = {
    font: {
        bold: true,
        sz: 14,
    },
    alignment: {
        horizontal: 'left',
        vertical: 'center',
    },
};

const dataCellStyle = {
    border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
    },
    alignment: {
        vertical: 'center',
        wrapText: true,
    },
};

const numberCellStyle = {
    ...dataCellStyle,
    alignment: {
        horizontal: 'center',
        vertical: 'center',
    },
};

// Style cho hàng danh mục
const categoryRowStyle = {
    fill: {
        patternType: 'solid',
        fgColor: { rgb: 'FFFFCC' }, // Màu vàng nhạt hơn header
    },
    font: {
        bold: true,
        sz: 11,
    },
    alignment: {
        horizontal: 'left',
        vertical: 'center',
        wrapText: true, // Tự động xuống dòng nếu quá dài
    },
    border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
    }
};

export function exportArticlesToExcel(articles: ExcelArticle[], fileName?: string): void {
    // Tạo workbook mới
    const wb = XLSX.utils.book_new();

    // Tính khoảng thời gian từ ngày đăng nhỏ nhất đến lớn nhất
    const dateRange = calculateDateRange(articles);

    // Tạo dữ liệu theo format mẫu Excel với style
    const data: { v: string | number | null; t?: string; s?: object }[][] = [];

    // Dòng 1: trống
    data.push([{ v: '', t: 's' }]);

    // Dòng 2: Tiêu đề tạp chí
    data.push([
        { v: '', t: 's' },
        { v: 'TẠP CHÍ XÂY DỰNG ĐẢNG ', t: 's', s: titleStyle }
    ]);

    // Dòng 3: Khoảng thời gian
    data.push([
        { v: '', t: 's' },
        { v: dateRange, t: 's', s: { font: { italic: true }, alignment: { horizontal: 'left' } } }
    ]);

    // Dòng 4: trống (để cách bảng)
    data.push([{ v: '', t: 's' }]);

    // Dòng 5: Header chính (theo mẫu Excel)
    // Cột: A=TT | B=Tác giả | C=Tiêu đề | D=Loại bài viết | E=Ngày xuất bản | F,G=Xếp loại bài | H,I,J=Ảnh | K=Xếp loại ảnh | L=Ghi chú
    data.push([
        { v: 'TT', t: 's', s: headerStyle },                    // A - TT
        { v: 'Tác giả', t: 's', s: headerStyle },               // B - Tác giả
        { v: 'Tiêu đề', t: 's', s: headerStyle },               // C - Tiêu đề
        { v: 'Loại bài viết', t: 's', s: headerStyle },         // D - Loại bài viết
        { v: 'Ngày xuất bản', t: 's', s: headerStyle },         // E - Ngày xuất bản (MỚI)
        { v: 'Xếp loại bài', t: 's', s: headerStyle },          // F - Xếp loại bài (merge F-G)
        { v: '', t: 's', s: headerStyle },                      // G
        { v: 'Ảnh', t: 's', s: headerStyle },                   // H - Ảnh (merge H-J)
        { v: '', t: 's', s: headerStyle },                      // I
        { v: '', t: 's', s: headerStyle },                      // J
        { v: 'Xếp loại ảnh', t: 's', s: headerStyle },          // K - Xếp loại ảnh
        { v: 'Ghi chú', t: 's', s: headerStyle }                // L - Ghi chú
    ]);

    // Dòng 6: Sub-header
    data.push([
        { v: '', t: 's', s: headerStyle },                      // A
        { v: '', t: 's', s: headerStyle },                      // B
        { v: '', t: 's', s: headerStyle },                      // C
        { v: '', t: 's', s: headerStyle },                      // D
        { v: '', t: 's', s: headerStyle },                      // E - Ngày xuất bản
        { v: 'Tác giả', t: 's', s: headerStyle },               // F - Xếp loại - Tác giả
        { v: 'Biên tập', t: 's', s: headerStyle },              // G - Xếp loại - Biên tập
        { v: 'Khai thác', t: 's', s: headerStyle },             // H - Ảnh - Khai thác
        { v: 'Tư liệu', t: 's', s: headerStyle },               // I - Ảnh - Tư liệu
        { v: 'Tác giả', t: 's', s: headerStyle },               // J - Ảnh - Tác giả
        { v: '', t: 's', s: headerStyle },                      // K
        { v: '', t: 's', s: headerStyle }                       // L
    ]);

    // Nhóm bài viết theo danh mục
    const articlesByCategory = new Map<string, ExcelArticle[]>();
    articles.forEach(article => {
        const category = article.category || 'Chưa phân loại';
        if (!articlesByCategory.has(category)) {
            articlesByCategory.set(category, []);
        }
        articlesByCategory.get(category)!.push(article);
    });

    // Thêm dữ liệu bài viết theo từng danh mục
    let rowIndex = 1;
    const categoryRowIndices: { rowIdx: number; category: string }[] = []; // Lưu vị trí các dòng danh mục
    const articleRowIndices: number[] = []; // Lưu vị trí các dòng bài viết (có STT)

    articlesByCategory.forEach((categoryArticles, category) => {
        // Thêm hàng tiêu đề danh mục
        const categoryRow = [
            { v: '', t: 's', s: categoryRowStyle },
            { v: category, t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle },
            { v: '', t: 's', s: categoryRowStyle }
        ];
        categoryRowIndices.push({ rowIdx: data.length, category }); // Lưu vị trí dòng danh mục
        data.push(categoryRow);

        // Thêm các bài viết trong danh mục
        categoryArticles.forEach(article => {
            const row = [
                { v: rowIndex, t: 'n', s: numberCellStyle },                                  // A - TT
                { v: article.author || article.creator || '', t: 's', s: dataCellStyle },    // B - Tác giả
                { v: article.title, t: 's', s: dataCellStyle },                              // C - Tiêu đề
                { v: article.type || '', t: 's', s: dataCellStyle },                         // D - Loại bài viết
                { v: article.publishDateFull || article.publishDate || '', t: 's', s: numberCellStyle }, // E - Ngày xuất bản (MỚI)
                { v: '', t: 's', s: numberCellStyle },                                       // F - Xếp loại bài - Tác giả
                { v: '', t: 's', s: numberCellStyle },                                       // G - Xếp loại bài - Biên tập
                article.imageKhaiThac ? { v: article.imageKhaiThac, t: 'n', s: numberCellStyle } : { v: '', t: 's', s: numberCellStyle },  // H - Khai thác
                article.imageTuLieu ? { v: article.imageTuLieu, t: 'n', s: numberCellStyle } : { v: '', t: 's', s: numberCellStyle },      // I - Tư liệu
                article.imageTacGia ? { v: article.imageTacGia, t: 'n', s: numberCellStyle } : { v: '', t: 's', s: numberCellStyle },      // J - Tác giả (ảnh)
                { v: '', t: 's', s: numberCellStyle },                                       // K - Xếp loại ảnh
                { v: '', t: 's', s: dataCellStyle }                                          // L - Ghi chú
            ];
            articleRowIndices.push(data.length); // Lưu vị trí dòng bài viết
            data.push(row);
            rowIndex++;
        });
    });

    // Tạo worksheet từ dữ liệu
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Thiết lập độ rộng cột (theo mẫu)
    ws['!cols'] = [
        { wch: 4 },    // A - TT
        { wch: 18 },   // B - Tác giả
        { wch: 55 },   // C - Tiêu đề
        { wch: 14 },   // D - Loại bài viết
        { wch: 12 },   // E - Ngày xuất bản (MỚI)
        { wch: 8 },    // F - Xếp loại bài - Tác giả
        { wch: 8 },    // G - Xếp loại bài - Biên tập
        { wch: 8 },    // H - Khai thác
        { wch: 8 },    // I - Tư liệu
        { wch: 8 },    // J - Tác giả (ảnh)
        { wch: 10 },   // K - Xếp loại ảnh
        { wch: 15 }    // L - Ghi chú
    ];

    // Thiết lập chiều cao dòng
    const rows: { hpt: number }[] = [
        { hpt: 15 },   // Dòng 1 - trống
        { hpt: 25 },   // Dòng 2 - Tiêu đề tạp chí
        { hpt: 20 },   // Dòng 3 - Khoảng thời gian
        { hpt: 15 },   // Dòng 4 - trống (cách)
        { hpt: 35 },   // Dòng 5 - Header chính
        { hpt: 25 },   // Dòng 6 - Sub-header
    ];

    // Set chiều cao 36pt cho tất cả dòng bài viết (có STT) - đủ chứa 2 dòng text
    articleRowIndices.forEach(rowIdx => {
        rows[rowIdx] = { hpt: 36 };
    });

    // Tính chiều cao động cho các dòng danh mục (dựa trên độ dài tên)
    // Chiều cao cơ bản = 30pt, mỗi dòng thêm = 18pt
    categoryRowIndices.forEach(({ rowIdx, category }) => {
        const charsPerLine = 50; // Số ký tự tối đa mỗi dòng (ước tính)
        const numLines = Math.ceil(category.length / charsPerLine) || 1;
        const height = 30 + (numLines - 1) * 18;
        rows[rowIdx] = { hpt: Math.max(30, height) };
    });

    ws['!rows'] = rows;

    // Merge cells cho header (đúng theo mẫu)
    const merges = [
        // Merge tiêu đề tạp chí B2-F2 (row 1, col 1-5)
        { s: { r: 1, c: 1 }, e: { r: 1, c: 5 } },
        // Merge khoảng thời gian B3-F3 (row 2, col 1-5)
        { s: { r: 2, c: 1 }, e: { r: 2, c: 5 } },
        // Merge "Xếp loại bài" từ F5 đến G5 (index 5-6, row 4)
        { s: { r: 4, c: 5 }, e: { r: 4, c: 6 } },
        // Merge "Ảnh" từ H5 đến J5 (index 7-9, row 4)
        { s: { r: 4, c: 7 }, e: { r: 4, c: 9 } },
    ];

    // Merge các ô của hàng danh mục từ cột B đến cột L (để tên danh mục không bị cắt)
    categoryRowIndices.forEach(({ rowIdx }) => {
        // Merge từ cột B (1) đến cột L (11) cho mỗi dòng danh mục
        merges.push({ s: { r: rowIdx, c: 1 }, e: { r: rowIdx, c: 11 } });
    });

    ws['!merges'] = merges;

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách bài viết');

    // Tạo tên file
    const now = new Date();
    const exportFileName = fileName || `BaoCao_${formatDateForFileName(now)}.xlsx`;

    // Xuất file
    XLSX.writeFile(wb, exportFileName);
}

function calculateDateRange(articles: ExcelArticle[]): string {
    // Lấy danh sách ngày xuất bản hợp lệ (ưu tiên publishDateFull)
    const dates: Date[] = [];

    articles.forEach(article => {
        const dateStr = article.publishDateFull || article.publishDate;
        if (dateStr) {
            // Parse ngày theo format "dd/mm/yyyy" hoặc "dd/mm"
            const dateParts = dateStr.split('/');
            if (dateParts.length >= 2) {
                const day = parseInt(dateParts[0], 10);
                const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
                const year = dateParts.length >= 3 ? parseInt(dateParts[2], 10) : new Date().getFullYear();
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    dates.push(date);
                }
            }
        }
    });

    if (dates.length === 0) {
        const now = new Date();
        return `Từ ${formatDate(now)} đến ${formatDate(now)})`;
    }

    // Tìm ngày nhỏ nhất và lớn nhất
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return `Từ ${formatDate(minDate)} đến ${formatDate(maxDate)})`;
}

function formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateForFileName(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}${month}${year}`;
}
