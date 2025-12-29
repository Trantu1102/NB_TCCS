import React from 'react';
import { ExcelArticle } from '../types';
import { generatePhieuKiemTra } from '../services/docxGenerator';

interface ArticleTableProps {
    articles: ExcelArticle[];
    onPreview: (article: ExcelArticle) => void;
    loadingArticleUrl: string | null;
}

export function ArticleTable({ articles, onPreview, loadingArticleUrl }: ArticleTableProps) {
    const handleExportDocx = async (article: ExcelArticle) => {
        try {
            await generatePhieuKiemTra(article);
        } catch (error) {
            console.error('Error generating DOCX:', error);
            alert('Lỗi khi tạo file DOCX');
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <div className="p-4 bg-gradient-to-r from-red-700 to-red-600 text-white">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    📋 Danh sách bài viết ({articles.length} bài)
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">STT</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Người tạo</th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày đăng</th>
                            <th className="px-3 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {articles.map((article) => (
                            <tr
                                key={article.stt}
                                className="hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-3 py-4 text-sm font-bold text-gray-900">
                                    {article.stt}
                                </td>
                                <td className="px-3 py-4">
                                    <div className="text-sm font-semibold text-gray-900 max-w-sm" title={article.title}>
                                        {article.title}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate max-w-sm mt-1" title={article.url}>
                                        {article.url}
                                    </div>
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-700 font-medium">
                                    {article.creator}
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-600">
                                    {article.publishDate}
                                </td>
                                <td className="px-3 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onPreview(article)}
                                            disabled={loadingArticleUrl === article.url}
                                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Xem trước và xuất PDF"
                                        >
                                            {loadingArticleUrl === article.url ? (
                                                <span className="animate-spin">⏳</span>
                                            ) : (
                                                <>👁️ PDF</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleExportDocx(article)}
                                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow"
                                            title="Xuất Phiếu kiểm tra DOCX"
                                        >
                                            📄 DOCX
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
