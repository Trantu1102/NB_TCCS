
import React, { useState } from 'react';
import { fetchHtmlContent } from './services/scraperService';
import { extractArticleData } from './services/extractionService';
import { printToPdf } from './components/PDFGenerator';
import { ExcelUploader } from './components/ExcelUploader';
import { ArticleTable } from './components/ArticleTable';
import { ArticleContent, ExcelArticle } from './types';

type AppMode = 'single' | 'excel';

const DEFAULT_LOGO = '/logo-xaydungdang.png';

function App() {
  const [mode, setMode] = useState<AppMode>('excel');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingArticleUrl, setLoadingArticleUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ArticleContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<ExcelArticle[]>([]);
  const [currentExcelCreator, setCurrentExcelCreator] = useState<string>('');
  const [currentExcelAuthor, setCurrentExcelAuthor] = useState<string>('');
  const [currentExcelTitle, setCurrentExcelTitle] = useState<string>('');

  const handleScrape = async (targetUrl: string) => {
    if (!targetUrl) return;
    setLoading(true);
    setLoadingArticleUrl(targetUrl);
    setError(null);
    setExtractedData(null);
    try {
      const html = await fetchHtmlContent(targetUrl);
      const data = extractArticleData(html, targetUrl);

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const dateStr = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="pubdate"]')?.getAttribute('content') ||
        doc.querySelector('.publish-date, .date, .time, .post-date')?.textContent?.trim() || '';

      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            data.publishDate = `${hours}:${minutes}, ngày ${day}-${month}-${year}`;
          } else {
            data.publishDate = dateStr.replace(/[+-]\d{4}$/, '').replace('T', ' ').trim();
          }
        } catch {
          data.publishDate = dateStr.replace(/[+-]\d{4}$/, '').replace('T', ' ').trim();
        }
      }

      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi không thể trích xuất dữ liệu.');
    } finally {
      setLoading(false);
      setLoadingArticleUrl(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleScrape(url);
  };

  const handleArticlePreview = async (article: ExcelArticle) => {
    setUrl(article.url);
    setCurrentExcelAuthor(article.author || '');
    setCurrentExcelTitle(article.title || '');
    await handleScrape(article.url);
  };

  const handleExcelDataLoaded = (loadedArticles: ExcelArticle[]) => {
    setArticles(loadedArticles);
    setError(null);
    setExtractedData(null);
  };

  const handleExcelError = (errorMessage: string) => {
    setError(errorMessage);
    setArticles([]);
  };

  const handleClearExcel = () => {
    setArticles([]);
    setExtractedData(null);
    setError(null);
  };

  const handleBackToTable = () => {
    setExtractedData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white shadow-lg p-6 mb-8 rounded-xl border border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo Section */}
            <div className="flex items-center gap-5">
              <img src={DEFAULT_LOGO} className="h-16 object-contain" alt="Logo" />
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => { setMode('single'); setArticles([]); setExtractedData(null); }}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'single' ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                🔗 Nhập link đơn
              </button>
              <button
                onClick={() => { setMode('excel'); setExtractedData(null); }}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'excel' ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📊 Từ file Excel
              </button>
            </div>
          </div>

          {/* Single URL Input (shown in single mode) */}
          {mode === 'single' && (
            <form onSubmit={handleFormSubmit} className="flex gap-2 mt-6">
              <input
                type="url" required value={url} onChange={e => setUrl(e.target.value)}
                placeholder="Dán link bài viết cần chuyển đổi..."
                className="flex-grow p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <button disabled={loading} className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg text-sm font-black uppercase transition-all shadow-md active:scale-95">
                {loading ? 'Đang trích xuất...' : 'Trích xuất'}
              </button>
            </form>
          )}
        </div>

        {/* Error Display */}
        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded shadow-sm">{error}</div>}

        {/* Excel Mode - Upload or Table */}
        {mode === 'excel' && articles.length === 0 && !extractedData && (
          <ExcelUploader onDataLoaded={handleExcelDataLoaded} onError={handleExcelError} />
        )}

        {/* Excel Mode - Article Table */}
        {mode === 'excel' && articles.length > 0 && !extractedData && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <button
                onClick={handleClearExcel}
                className="text-gray-500 hover:text-red-600 text-sm font-semibold flex items-center gap-1"
              >
                ← Chọn file khác
              </button>
            </div>
            <ArticleTable
              articles={articles}
              onPreview={handleArticlePreview}
              loadingArticleUrl={loadingArticleUrl}
              onUpdateArticle={(updatedArticle) => {
                setArticles(prev => prev.map(a =>
                  a.stt === updatedArticle.stt ? updatedArticle : a
                ));
              }}
            />
          </div>
        )}

        {/* Preview Section */}
        {extractedData && (
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-4">
                {mode === 'excel' && articles.length > 0 && (
                  <button
                    onClick={handleBackToTable}
                    className="text-gray-500 hover:text-red-600 text-sm font-semibold flex items-center gap-1"
                  >
                    ← Quay lại danh sách
                  </button>
                )}
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bản xem trước trích xuất</span>
              </div>
              <button
                onClick={() => printToPdf('printable-content', DEFAULT_LOGO)}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-black text-sm shadow-lg transition-all"
              >
                XUẤT PDF
              </button>
            </div>

            <div id="printable-content" className="p-10 md:p-16 bg-white font-merriweather">
              {/* Header Logo */}
              <div className="text-center mb-12">
                <img src={DEFAULT_LOGO} className="max-h-12 mx-auto mb-3 object-contain" />
                <div className="text-[12pt] font-bold text-gray-600 uppercase tracking-[0.1em] border-t border-gray-200 pt-4 inline-block w-full max-w-2xl font-opensans">
                  Chuyên trang của Tạp chí Cộng sản nghiên cứu, tuyên truyền nghiệp vụ công tác Đảng
                </div>
              </div>

              {/* Title Section - Auto-resize based on length, prefer Excel title */}
              {(() => {
                const displayTitle = currentExcelTitle || extractedData.title;
                return (
                  <h1
                    className={`font-black text-center mb-6 leading-tight text-gray-900 block w-full h-auto overflow-visible whitespace-normal break-words px-2 ${displayTitle.length > 150 ? 'text-xl' :
                      displayTitle.length > 100 ? 'text-2xl' :
                        'text-3xl'
                      }`}
                  >
                    {displayTitle}
                  </h1>
                );
              })()}

              {/* Author from Excel */}
              {currentExcelAuthor && (
                <div className="text-center mb-6">
                  <span className="text-base font-bold text-gray-800 uppercase tracking-wide">
                    {currentExcelAuthor}
                  </span>
                </div>
              )}

              {/* Metadata line */}
              <div className="text-center mb-10 text-gray-700 border-b border-gray-100 pb-8 flex flex-col items-center">
                {extractedData.publishDate && <div className="text-lg mb-1 text-gray-500">{extractedData.publishDate}</div>}
              </div>

              {/* SAPO (Summary) */}
              {extractedData.summary && (
                <div className="summary-box mb-10 text-xl font-bold text-justify leading-relaxed text-gray-900">
                  {extractedData.summary}
                </div>
              )}

              {/* Featured Image */}
              {extractedData.mainImage && (
                <div className="mb-12">
                  <img src={extractedData.mainImage} className="w-full h-auto rounded-lg shadow-sm mx-auto" alt="Featured" />
                </div>
              )}

              {/* Body Content */}
              <div
                className="article-content-body prose prose-xl max-w-none text-justify text-gray-900 leading-relaxed font-merriweather"
                style={{ fontSize: '11.5pt', color: '#1a1a1a' }}
                dangerouslySetInnerHTML={{ __html: extractedData.content }}
              />

              {/* Footer */}
              <div className="mt-24 pt-10 border-t border-gray-100 text-center">
                <p className="text-[12px] text-gray-300 mt-2 italic">Nguồn: {extractedData.url}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
