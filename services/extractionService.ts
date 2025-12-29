
import { Readability } from '@mozilla/readability';
import { ArticleContent } from '../types';

const IMAGE_URL_ATTRS = [
  'data-src', 'data-lazy-src', 'data-original', 'data-fallback-src',
  'data-actualsrc', 'data-srcset', 'data-img-src', 'data-url',
  'original', 'lazy-src', 'srcset', 'data-src-full', 'data-hi-res'
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Chuẩn hóa URL mạnh mẽ hơn để so sánh: 
 * - Bỏ protocol (http/https)
 * - Bỏ query string (?...)
 * - Bỏ fragment (#...)
 * - Bỏ slash cuối
 */
function normalizeUrlForComparison(url: string | null): string[] {
  if (!url) return ['', ''];
  let cleaned = url.trim();
  try {
    const u = new URL(cleaned);
    let path = u.pathname;
    if (path.endsWith('/')) path = path.slice(0, -1);

    // 1. Host + Path (Không quan tâm query/hash)
    let standard = (u.hostname + path).toLowerCase();

    // 2. Filename (Dùng cho trường hợp ảnh trùng tên nhưng khác thư mục thumb/full)
    let filename = path.split('/').pop()?.toLowerCase() || '';

    // Decode để so sánh chính xác hơn (ví dụ: dấu cách %20)
    try {
      standard = decodeURIComponent(standard);
      filename = decodeURIComponent(filename);
    } catch (e) { }

    return [standard, filename];
  } catch (e) {
    let raw = cleaned.replace(/^https?:\/\//i, '').split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
    try { raw = decodeURIComponent(raw); } catch (e) { }
    const parts = raw.split('/');
    const standard = parts.join('/');
    const filename = parts.pop() || '';
    return [standard, filename];
  }
}

function handleNoscriptImages(doc: Document) {
  const noscripts = doc.querySelectorAll('noscript');
  noscripts.forEach(noscript => {
    const content = noscript.textContent || '';
    if (content.includes('<img')) {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = content;
      const img = tempDiv.querySelector('img');
      if (img) {
        noscript.parentNode?.insertBefore(img, noscript);
      }
    }
  });
}

function handleLazyImages(doc: Document) {
  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    for (const attr of IMAGE_URL_ATTRS) {
      const value = img.getAttribute(attr);
      if (value) {
        let actualUrl = value.trim();
        if (attr.includes('srcset')) {
          actualUrl = value.split(',').pop()?.trim().split(' ')[0] || actualUrl;
        }
        if (actualUrl && (actualUrl.includes('/') || actualUrl.startsWith('data:'))) {
          img.setAttribute('src', actualUrl);
          break;
        }
      }
    }
  });
}

function resolveAllPaths(doc: Document, baseUrl: string) {
  const elements = doc.querySelectorAll('img, a, source, image');
  elements.forEach(el => {
    const attr = el.tagName === 'A' ? 'href' : 'src';
    const val = el.getAttribute(attr);
    if (val && !val.startsWith('http') && !val.startsWith('data:') && !val.startsWith('#')) {
      try {
        const absoluteUrl = new URL(val, baseUrl).href;
        el.setAttribute(attr, absoluteUrl);
      } catch (e) { }
    }
  });
}

/**
 * Xóa phần trùng lặp và làm sạch nội dung bài viết
 */
function cleanContent(container: HTMLElement, title: string, summary: string) {
  const normTitle = normalizeText(title);
  const normSummary = normalizeText(summary);
  const isTitleTruncated = title.includes('...');

  // Xóa các node đầu tiên nếu chúng là metadata, title, hoặc sapo lặp
  let node = container.firstElementChild;
  let count = 0;
  while (node && count < 15) { // Tăng số lần kiểm tra
    const nextNode = node.nextElementSibling;
    const rawText = node.textContent?.trim() || '';
    const text = normalizeText(rawText);

    // Bỏ qua node trống không có ảnh
    if (!text && !node.querySelector('img')) {
      node.remove();
      node = nextNode;
      continue;
    }

    let shouldDelete = false;

    // 1. Xóa nếu là metadata (thời gian, ngày tháng) dạng "16:54, ngày 25-12-2025"
    const dateRegex = /^\d{1,2}[:h]\d{2}.*?\d{1,2}[-/]\d{1,2}[-/]\d{4}/i;
    if (rawText.length < 80 && dateRegex.test(rawText)) {
      shouldDelete = true;
    }

    // 2. Xóa tiêu đề lặp
    if (!isTitleTruncated && normTitle.length > 10 && (normTitle === text || text.includes(normTitle) || normTitle.includes(text))) {
      shouldDelete = true;
    }

    // 3. XÓA SAPO TRIỆT ĐỂ:
    // - Nếu text bắt đầu bằng "xdđ" (prefix của trang)
    // - HOẶC nếu text trùng/chứa summary
    // - HOẶC nếu 80% đầu của text giống 80% đầu của summary
    if (text.startsWith('xdđ') || text.startsWith('xdd')) {
      shouldDelete = true;
    }

    if (normSummary.length > 20 && text.length > 20) {
      // Kiểm tra trùng hoàn toàn hoặc bao hàm
      if (normSummary.includes(text) || text.includes(normSummary)) {
        shouldDelete = true;
      }
      // Kiểm tra 80 ký tự đầu giống nhau
      const summaryStart = normSummary.substring(0, 80);
      const textStart = text.substring(0, 80);
      if (summaryStart === textStart || summaryStart.includes(textStart) || textStart.includes(summaryStart)) {
        shouldDelete = true;
      }
    }

    // 4. Xóa các đoạn ngắn trùng với title hoặc summary
    if (text.length > 10 && rawText.length < 300) {
      if (normTitle.includes(text) || normSummary.includes(text)) {
        shouldDelete = true;
      }
    }

    if (shouldDelete) {
      // Nếu node chứa ảnh, chỉ xóa text, giữ lại ảnh
      if (!node.querySelector('img')) {
        node.remove();
      }
    }

    node = nextNode;
    count++;
  }

  // Xóa các thành phần rác khác (Giữ lại iframe để hiển thị PDF)
  const unwanted = ['.related', '.ads', '.social-share', 'script', 'style', 'button', '.nav', '.footer', '.sidebar', '.breadcrumb', '.tags'];
  unwanted.forEach(s => container.querySelectorAll(s).forEach(el => el.remove()));

  // Xóa các dòng metadata thừa (ngày tháng, tên báo, thời gian lặp lại)
  const metadataPatterns = [
    /^thứ\s+(hai|ba|tư|năm|sáu|bảy|chủ nhật)/i,  // "Thứ tư, 19/11/2025"
    /^\d{1,2}:\d{2},?\s*(ngày)?\s*\d{1,2}[-/]\d{1,2}[-/]\d{4}/i,  // "18:45, ngày 19-11-2025"
    /^(báo|tin|nguồn:?)\s+[a-zA-ZÀ-ỹ\s]+$/i,  // "Báo Bắc Ninh"
    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,  // "19/11/2025"
  ];

  container.querySelectorAll('p, div, span').forEach(el => {
    const text = el.textContent?.trim() || '';
    if (text.length < 100) {  // Chỉ kiểm tra đoạn ngắn
      for (const pattern of metadataPatterns) {
        if (pattern.test(text)) {
          el.remove();
          break;
        }
      }
    }
  });

  // Xóa các iframe rác, chỉ giữ lại iframe có khả năng là PDF hoặc nội dung hữu ích
  container.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src') || '';
    const isPdf = src.toLowerCase().includes('.pdf') ||
      src.toLowerCase().includes('google.com/viewer') ||
      src.toLowerCase().includes('microsoft.com/en-us/office/type/pdf');
    if (!isPdf && !src.includes('youtube.com') && !src.includes('vimeo.com')) {
      iframe.remove();
    } else {
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.margin = '20px 0';
    }
  });

  // Chuẩn hóa hiển thị ảnh
  const seenImages = new Set<string>();
  container.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    const [normStandard, normFilename] = normalizeUrlForComparison(src);

    if (!src || src.length < 10 || seenImages.has(normStandard)) {
      img.remove();
    } else {
      seenImages.add(normStandard);
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '20px auto';
    }
  });
}

export function extractArticleData(html: string, url: string): ArticleContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  handleNoscriptImages(doc);
  handleLazyImages(doc);
  resolveAllPaths(doc, url);

  // 1. Tiêu đề thô từ Meta
  let metaTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent || '';
  metaTitle = metaTitle.replace(/\s+[-|]\s+.*$/, '').trim();

  // 2. KHÔI PHỤC TIÊU ĐỀ ĐẦY ĐỦ (Title Recovery)
  let finalTitle = metaTitle;
  const prefix = metaTitle.replace('...', '').trim();

  const headings = Array.from(doc.querySelectorAll('h1, h2, .title, .post-title, .entry-title'));
  for (const h of headings) {
    const hText = h.textContent?.trim() || '';
    if (hText.toLowerCase().includes(prefix.toLowerCase()) && hText.length > finalTitle.length) {
      finalTitle = hText;
    }
  }

  // 3. Trích xuất nội dung bằng Readability
  const reader = new Readability(doc, { charThreshold: 20 });
  const article = reader.parse();
  if (!article) throw new Error('Không thể trích xuất nội dung.');

  if (article.title && article.title.length > finalTitle.length && !article.title.includes('...')) {
    finalTitle = article.title;
  }

  const contentContainer = document.createElement('div');
  contentContainer.innerHTML = article.content;

  // 4. KIỂM TRA LẶP ẢNH ĐẠI DIỆN VỚI THÂN BÀI
  let mainImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

  const bodyImages = Array.from(contentContainer.querySelectorAll('img'));

  // LOGIC ĐƠN GIẢN VÀ TRIỆT ĐỂ:
  // Nếu nội dung bài viết ĐÃ CÓ ẢNH thì KHÔNG hiển thị ảnh thumbnail riêng biệt
  // Điều này đảm bảo 100% không bao giờ có 2 ảnh giống nhau ở đầu bài
  if (bodyImages.length > 0) {
    mainImage = '';
  }

  let summary = article.excerpt || '';

  // 5. Làm sạch nội dung (bao gồm cả xóa lặp metadata ở đầu)
  cleanContent(contentContainer, finalTitle, summary);

  // 6. KIỂM TRA SAPO TRÙNG LẶP SAU KHI LÀM SẠCH
  // Nếu nội dung bài viết VẪN CHỨA đoạn Sapo, thì ẩn Sapo riêng biệt đi
  const contentText = normalizeText(contentContainer.textContent || '');
  const normSummary = normalizeText(summary);

  if (normSummary.length > 30) {
    // Kiểm tra 100 ký tự đầu của summary có trong content không
    const summaryStart = normSummary.substring(0, 100);
    if (contentText.includes(summaryStart) || contentText.startsWith(summaryStart.substring(0, 50))) {
      summary = ''; // Ẩn Sapo vì nó đã có trong nội dung
    }
  }

  return {
    siteName: article.siteName || '',
    title: finalTitle.replace(/\s+/g, ' ').trim(),
    author: article.byline || '',
    publishDate: '',
    content: contentContainer.innerHTML,
    summary: summary,
    mainImage: mainImage,
    url: url
  };
}
