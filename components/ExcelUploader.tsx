import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { ExcelArticle } from '../types';

interface ExcelUploaderProps {
    onDataLoaded: (articles: ExcelArticle[]) => void;
    onError: (error: string) => void;
}

export function ExcelUploader({ onDataLoaded, onError }: ExcelUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseExcelFile = (file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Skip first 3 rows (title, timestamp, headers)
                const articles: ExcelArticle[] = [];
                for (let i = 3; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row[0] && row[3]) { // Has STT and URL
                        // Clean URL - remove &preview=1 if present
                        let url = String(row[3] || '');
                        url = url.replace('&preview=1', '').replace('?preview=1', '');

                        articles.push({
                            stt: Number(row[0]) || i - 2,
                            title: String(row[1] || ''),
                            status: String(row[2] || ''),
                            url: url,
                            type: String(row[4] || ''),
                            category: String(row[5] || ''),
                            publishDate: String(row[6] || ''),
                            publishDateFull: String(row[7] || ''),
                            creator: String(row[8] || ''),
                            views: Number(row[9]) || 0,
                            displayStatus: String(row[10] || ''),
                        });
                    }
                }

                if (articles.length === 0) {
                    onError('Không tìm thấy bài viết trong file Excel.');
                    return;
                }

                onDataLoaded(articles);
            } catch (err) {
                onError('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.');
            }
        };

        reader.onerror = () => {
            onError('Không thể đọc file. Vui lòng thử lại.');
        };

        reader.readAsBinaryString(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            onError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
            return;
        }

        parseExcelFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file) {
            const validExtensions = ['.xlsx', '.xls'];
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (!validExtensions.includes(fileExtension)) {
                onError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
                return;
            }

            parseExcelFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all duration-200"
        >
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-600 font-semibold">
                Kéo thả file Excel vào đây
            </p>
            <p className="text-gray-400 text-sm mt-1">
                hoặc click để chọn file (.xlsx, .xls)
            </p>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
