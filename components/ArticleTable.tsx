import React, { useState } from 'react';
import { ExcelArticle } from '../types';
import { generatePhieuKiemTra } from '../services/docxGenerator';
import { countImagesInArticle } from '../services/imageCounterService';
import { exportArticlesToExcel } from '../services/excelExportService';

interface ArticleTableProps {
    articles: ExcelArticle[];
    onPreview: (article: ExcelArticle) => void;
    loadingArticleUrl: string | null;
    onUpdateArticle?: (updatedArticle: ExcelArticle) => void;
}

export function ArticleTable({ articles, onPreview, loadingArticleUrl, onUpdateArticle }: ArticleTableProps) {
    const [countingUrl, setCountingUrl] = useState<string | null>(null);
    const [countingAll, setCountingAll] = useState(false);

    const handleExportDocx = async (article: ExcelArticle) => {
        try {
            await generatePhieuKiemTra(article);
        } catch (error) {
            console.error('Error generating DOCX:', error);
            alert('Lỗi khi tạo file DOCX');
        }
    };

    const handleCountImages = async (article: ExcelArticle) => {
        if (!onUpdateArticle) return;

        setCountingUrl(article.url);
        try {
            const counts = await countImagesInArticle(article.url, article.type);
            onUpdateArticle({
                ...article,
                imageKhaiThac: counts.khaiThac,
                imageTuLieu: counts.tuLieu,
                imageTacGia: counts.tacGia,
                imageCountLoaded: true,
            });
        } catch (error) {
            console.error('Error counting images:', error);
            alert(`Lỗi khi đếm ảnh bài "${article.title.substring(0, 50)}...". Vui lòng thử lại!`);
        } finally {
            setCountingUrl(null);
        }
    };

    const handleCountAllImages = async () => {
        if (!onUpdateArticle || countingAll) return;

        setCountingAll(true);

        // Lọc các bài chưa đếm
        const articlesToCount = articles.filter(a => !a.imageCountLoaded);

        // Số luồng đồng thời (5 luồng)
        const CONCURRENCY = 5;

        // Hàm đếm 1 bài
        const countArticle = async (article: ExcelArticle) => {
            try {
                const counts = await countImagesInArticle(article.url, article.type);
                onUpdateArticle({
                    ...article,
                    imageKhaiThac: counts.khaiThac,
                    imageTuLieu: counts.tuLieu,
                    imageTacGia: counts.tacGia,
                    imageCountLoaded: true,
                });
            } catch (error) {
                console.error('Error counting images for:', article.url, error);
            }
        };

        // Chia thành các batch và xử lý song song
        for (let i = 0; i < articlesToCount.length; i += CONCURRENCY) {
            const batch = articlesToCount.slice(i, i + CONCURRENCY);
            setCountingUrl(`Đang đếm ${i + 1}-${Math.min(i + CONCURRENCY, articlesToCount.length)}/${articlesToCount.length}`);
            await Promise.all(batch.map(countArticle));
        }

        setCountingUrl(null);
        setCountingAll(false);
    };

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <div className="p-4 bg-gradient-to-r from-red-700 to-red-600 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    📋 Danh sách bài viết ({articles.length} bài)
                </h3>
                <div className="flex items-center gap-2">
                    {onUpdateArticle && (
                        <button
                            onClick={handleCountAllImages}
                            disabled={countingAll}
                            className="px-4 py-2 bg-white text-purple-700 text-sm font-bold rounded-lg hover:bg-purple-50 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
                        >
                            {countingAll ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang đếm...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Đếm ảnh tất cả
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => exportArticlesToExcel(articles)}
                        className="px-4 py-2 bg-white text-green-700 text-sm font-bold rounded-lg hover:bg-green-50 flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
                        title="Xuất danh sách ra file Excel"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
                            <path d="M8 13h8v1.5H8zM8 16h5v1.5H8z" />
                        </svg>
                        Xuất Excel
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">STT</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Loại</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tác giả</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Người tạo</th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày đăng</th>
                            {/* Cột đếm ảnh */}
                            <th className="px-2 py-3 text-center text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50" title="Ảnh khai thác">K.thác</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50" title="Ảnh tư liệu">T.liệu</th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-green-600 uppercase tracking-wider bg-green-50" title="Ảnh có tác giả">T.giả</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[150px]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {articles.map((article, index) => (
                            <tr
                                key={article.stt}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-2 py-4 text-sm font-bold text-gray-900">
                                    {index + 1}
                                </td>
                                <td className="px-2 py-4">
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-gray-900 hover:text-red-600 max-w-xs truncate block transition-colors duration-200"
                                        title={article.title}
                                    >
                                        {article.title}
                                    </a>
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-600">
                                    <select
                                        value={article.type || ''}
                                        onChange={(e) => {
                                            if (onUpdateArticle) {
                                                onUpdateArticle({
                                                    ...article,
                                                    type: e.target.value,
                                                    imageCountLoaded: false, // Reset để đếm lại nếu cần
                                                });
                                            }
                                        }}
                                        className="px-2 py-1 text-xs font-medium bg-blue-50 border border-blue-200 rounded-lg text-blue-800 cursor-pointer hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                    >
                                        <option value="">-- Chọn loại --</option>
                                        <option value="Tin tức">Tin tức</option>
                                        <option value="Tin mới">Tin mới</option>
                                        <option value="Tin tổng hợp">Tin tổng hợp</option>
                                        <option value="KT + biên tập">KT + biên tập</option>
                                        <option value="photos">Photos</option>
                                        <option value="Emagazine">Emagazine</option>
                                        <option value="Mega story">Mega story</option>
                                        <option value="Video">Video</option>
                                        <option value="Audio">Audio</option>
                                    </select>
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-700 font-medium max-w-[100px] truncate" title={article.author}>
                                    {article.author || '-'}
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-700 font-medium max-w-[100px] truncate" title={article.creator}>
                                    {article.creator}
                                </td>
                                <td className="px-2 py-4 text-sm text-gray-600 whitespace-nowrap">
                                    {article.publishDate}
                                </td>
                                {/* Cột đếm ảnh */}
                                <td className="px-2 py-4 text-center bg-orange-50">
                                    {article.imageCountLoaded ? (
                                        <span className="text-sm font-bold text-orange-600">{article.imageKhaiThac || 0}</span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="px-2 py-4 text-center bg-blue-50">
                                    {article.imageCountLoaded ? (
                                        <span className="text-sm font-bold text-blue-600">{article.imageTuLieu || 0}</span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="px-2 py-4 text-center bg-green-50">
                                    {article.imageCountLoaded ? (
                                        <span className="text-sm font-bold text-green-600">{article.imageTacGia || 0}</span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap min-w-[150px]">
                                    <div className="flex items-center justify-center gap-2 flex-nowrap">
                                        {onUpdateArticle && (
                                            <button
                                                onClick={() => handleCountImages(article)}
                                                disabled={countingUrl === article.url}
                                                className={`group inline-flex items-center justify-center w-9 h-9 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${article.imageCountLoaded ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'}`}
                                                title={article.imageCountLoaded ? 'Đếm lại ảnh' : 'Đếm ảnh trong bài'}
                                            >
                                                {countingUrl === article.url ? (
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : article.imageCountLoaded ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onPreview(article)}
                                            disabled={loadingArticleUrl === article.url}
                                            className="group inline-flex items-center justify-center w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                            title="Xem trước và xuất PDF"
                                        >
                                            {loadingArticleUrl === article.url ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                                                    <path d="M8 12h8v2H8zm0 4h5v2H8z" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleExportDocx(article)}
                                            className="group inline-flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                                            title="Xuất file Word"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
                                                <path d="M8 13l1.5 5 1.5-3 1.5 3 1.5-5h1.5l-2.5 7h-1l-1.5-3-1.5 3h-1L6 13h1.5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
