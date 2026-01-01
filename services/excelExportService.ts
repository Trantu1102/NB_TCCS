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
    // Cột: A=TT | B=Tác giả | C=Tiêu đề | D=Loại bài viết | E,F=Xếp loại bài | G,H,I=Ảnh | J=Xếp loại ảnh | K=Ghi chú
    data.push([
        { v: 'TT', t: 's', s: headerStyle },                    // A - TT
        { v: 'Tác giả', t: 's', s: headerStyle },               // B - Tác giả
        { v: 'Tiêu đề', t: 's', s: headerStyle },               // C - Tiêu đề (có label)
        { v: 'Loại bài viết', t: 's', s: headerStyle },         // D - Loại bài viết
        { v: '     Xếp loại bài', t: 's', s: headerStyle },     // E - Xếp loại bài (merge E-F)
        { v: '', t: 's', s: headerStyle },                      // F
        { v: 'Ảnh', t: 's', s: headerStyle },                   // G - Ảnh (merge G-I)
        { v: '', t: 's', s: headerStyle },                      // H
        { v: '', t: 's', s: headerStyle },                      // I
        { v: 'Xếp loại ảnh', t: 's', s: headerStyle },          // J - Xếp loại ảnh
        { v: 'Ghi chú', t: 's', s: headerStyle }                // K - Ghi chú
    ]);

    // Dòng 5: Sub-header
    data.push([
        { v: '', t: 's', s: headerStyle },                      // A
        { v: '', t: 's', s: headerStyle },                      // B
        { v: '', t: 's', s: headerStyle },                      // C
        { v: '', t: 's', s: headerStyle },                      // D
        { v: 'Tác giả', t: 's', s: headerStyle },               // E - Xếp loại - Tác giả
        { v: 'Biên tập', t: 's', s: headerStyle },              // F - Xếp loại - Biên tập
        { v: 'Khai thác', t: 's', s: headerStyle },             // G - Ảnh - Khai thác
        { v: 'Tư liệu', t: 's', s: headerStyle },               // H - Ảnh - Tư liệu
        { v: 'Tác giả', t: 's', s: headerStyle },               // I - Ảnh - Tác giả
        { v: '', t: 's', s: headerStyle },                      // J
        { v: '', t: 's', s: headerStyle }                       // K
    ]);

    // Thêm dữ liệu bài viết
    articles.forEach((article, index) => {
        const row = [
            { v: index + 1, t: 'n', s: numberCellStyle },                                // A - TT
            { v: article.author || article.creator || '', t: 's', s: dataCellStyle },    // B - Tác giả
            { v: article.title, t: 's', s: dataCellStyle },                              // C - Tiêu đề
            { v: article.type || '', t: 's', s: dataCellStyle },                         // D - Loại bài viết
            { v: '', t: 's', s: numberCellStyle },                                       // E - Xếp loại bài - Tác giả
            { v: '', t: 's', s: numberCellStyle },                                       // F - Xếp loại bài - Biên tập
            article.imageKhaiThac ? { v: article.imageKhaiThac, t: 'n', s: numberCellStyle } : { v: '', t: 's', s: numberCellStyle },  // G - Khai thác
            article.imageTuLieu ? { v: article.imageTuLieu, t: 'n', s: numberCellStyle } : { v: '', t: 's', s: numberCellStyle },      // H - Tư liệu
            article.imageTacGia ? { v: article.imageTacGia, t: 'n', s: numberCellStyle } : { v: '', t: 's', s: numberCellStyle },      // I - Tác giả (ảnh)
            { v: '', t: 's', s: numberCellStyle },                                       // J - Xếp loại ảnh
            { v: '', t: 's', s: dataCellStyle }                                          // K - Ghi chú
        ];
        data.push(row);
    });

    // Tạo worksheet từ dữ liệu
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Thiết lập độ rộng cột (theo mẫu)
    ws['!cols'] = [
        { wch: 4 },    // A - TT
        { wch: 18 },   // B - Tác giả
        { wch: 55 },   // C - Tiêu đề
        { wch: 14 },   // D - Loại bài viết
        { wch: 8 },    // E - Xếp loại bài - Tác giả
        { wch: 8 },    // F - Xếp loại bài - Biên tập
        { wch: 8 },    // G - Khai thác
        { wch: 8 },    // H - Tư liệu
        { wch: 8 },    // I - Tác giả (ảnh)
        { wch: 10 },   // J - Xếp loại ảnh
        { wch: 15 }    // K - Ghi chú
    ];

    // Thiết lập chiều cao dòng
    ws['!rows'] = [
        { hpt: 15 },   // Dòng 1 - trống
        { hpt: 25 },   // Dòng 2 - Tiêu đề tạp chí
        { hpt: 20 },   // Dòng 3 - Khoảng thời gian
        { hpt: 15 },   // Dòng 4 - trống (cách)
        { hpt: 35 },   // Dòng 5 - Header chính
        { hpt: 25 },   // Dòng 6 - Sub-header
    ];

    // Merge cells cho header (đúng theo mẫu)
    ws['!merges'] = [
        // Merge tiêu đề tạp chí B2-E2 (row 1, col 1-4)
        { s: { r: 1, c: 1 }, e: { r: 1, c: 4 } },
        // Merge khoảng thời gian B3-E3 (row 2, col 1-4)
        { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } },
        // Merge "Xếp loại bài" từ E5 đến F5 (index 4-5, row 4)
        { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
        // Merge "Ảnh" từ G5 đến I5 (index 6-8, row 4)
        { s: { r: 4, c: 6 }, e: { r: 4, c: 8 } },
    ];

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách bài viết');

    // Tạo tên file
    const now = new Date();
    const exportFileName = fileName || `BaoCao_${formatDateForFileName(now)}.xlsx`;

    // Xuất file
    XLSX.writeFile(wb, exportFileName);
}

function calculateDateRange(articles: ExcelArticle[]): string {
    // Lấy danh sách ngày đăng hợp lệ
    const dates: Date[] = [];

    articles.forEach(article => {
        if (article.publishDate) {
            // Parse ngày theo format "dd/mm/yyyy" hoặc "dd/mm"
            const dateParts = article.publishDate.split('/');
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
