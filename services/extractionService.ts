
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

  // KIỂM TRA TRANG VIDEO/AUDIO TRƯỚC - Ưu tiên cao nhất
  let articleContent = '';
  let articleExcerpt = '';
  let articleByline = '';
  let articleSiteName = '';

  const briefEl = doc.querySelector('.brief-video, .brief-audio, .brief');
  const contentVideoEl = doc.querySelector('.content-video, .article-content.content-video');

  // Nếu là trang video/audio, lấy nội dung trực tiếp
  if (briefEl || contentVideoEl) {
    console.log('Detected video/audio page structure');

    // Lấy sapo/excerpt từ brief-video (NGUYÊN BẢN, không tóm tắt)
    if (briefEl && briefEl.textContent && briefEl.textContent.trim().length > 20) {
      articleExcerpt = briefEl.textContent.trim();
      console.log('Found brief-video for excerpt:', articleExcerpt.substring(0, 100));
    }

    // Lấy nội dung chính từ content-video (KHÔNG bao gồm brief để tránh lặp)
    if (contentVideoEl && contentVideoEl.textContent && contentVideoEl.textContent.trim().length > 50) {
      articleContent = contentVideoEl.innerHTML;
      console.log('Found content-video:', contentVideoEl.textContent.substring(0, 100));
    }

    // Nếu không có content riêng, thử kết hợp brief + content
    if (!articleContent && briefEl && contentVideoEl) {
      const container = document.createElement('div');
      container.appendChild(contentVideoEl.cloneNode(true));
      articleContent = container.innerHTML;
    }
  }

  // Nếu không phải trang video hoặc không lấy được nội dung, dùng Readability
  if (!articleContent || articleContent.replace(/<[^>]*>/g, '').trim().length < 200) {
    console.log('Falling back to Readability parser...');
    const reader = new Readability(doc.cloneNode(true) as Document, { charThreshold: 20 });
    const article = reader.parse();

    if (article) {
      // Chỉ sử dụng Readability nếu nội dung tốt hơn
      const readabilityTextLength = (article.content || '').replace(/<[^>]*>/g, '').trim().length;
      const currentTextLength = articleContent.replace(/<[^>]*>/g, '').trim().length;

      if (readabilityTextLength > currentTextLength) {
        articleContent = article.content || '';
        console.log('Readability provided better content, length:', readabilityTextLength);
      }

      if (!articleExcerpt) articleExcerpt = article.excerpt || '';
      if (!articleByline) articleByline = article.byline || '';
      if (!articleSiteName) articleSiteName = article.siteName || '';
    }
  }

  // FALLBACK: Nếu vẫn còn nội dung quá ngắn, thử trích xuất trực tiếp
  // Điều này giúp xử lý các trang có cấu trúc khác
  const contentContainer = document.createElement('div');

  if (!articleContent || articleContent.replace(/<[^>]*>/g, '').trim().length < 200) {
    console.log('Content still too short, trying additional fallback extraction...');

    let fallbackContent = '';

    // ĐẶC BIỆT CHO TRANG VIDEO/AUDIO: Kết hợp brief + content
    const briefEl = doc.querySelector('.brief-video, .brief-audio, .brief');
    const contentVideoEl = doc.querySelector('.content-video, .article-content, .content-audio');

    if (briefEl || contentVideoEl) {
      const container = document.createElement('div');

      // Thêm brief/sapo
      if (briefEl && briefEl.textContent && briefEl.textContent.trim().length > 20) {
        const briefP = document.createElement('p');
        briefP.innerHTML = briefEl.innerHTML;
        briefP.style.fontWeight = 'bold';
        container.appendChild(briefP);
        console.log('Found brief-video:', briefEl.textContent.substring(0, 100));
      }

      // Thêm nội dung chính
      if (contentVideoEl && contentVideoEl.textContent && contentVideoEl.textContent.trim().length > 50) {
        // Clone nội dung
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = contentVideoEl.innerHTML;
        container.appendChild(contentDiv);
        console.log('Found content-video:', contentVideoEl.textContent.substring(0, 100));
      }

      if (container.textContent && container.textContent.trim().length > 100) {
        fallbackContent = container.innerHTML;
        console.log('Using video/audio combined content, length:', fallbackContent.length);
      }
    }

    // Nếu không phải video, thử các selector phổ biến khác
    if (!fallbackContent) {
      // Các selector phổ biến cho nội dung bài viết
      const contentSelectors = [
        '.detail-video .big-video',
        '.detail-content',
        '.detail__content',
        '.article-content',
        '.article-body',
        '.post-content',
        '.entry-content',
        '.cms-body',
        '.video-content',
        '.video-detail',
        '.content-detail',
        '.news-content',
        'article .content',
        '.main-content article',
        '[class*="detail"] [class*="content"]',
        '[class*="article"] [class*="body"]'
      ];

      // Thử từng selector
      for (const selector of contentSelectors) {
        const el = doc.querySelector(selector);
        if (el && el.textContent && el.textContent.trim().length > 100) {
          fallbackContent = el.innerHTML;
          console.log('Found content using selector:', selector);
          break;
        }
      }
    }

    // Nếu vẫn không tìm thấy, thử tìm .sapo rồi lấy các phần tử tiếp theo
    if (!fallbackContent) {
      const sapoEl = doc.querySelector('.sapo, .summary, .excerpt, .lead, [class*="sapo"]');
      if (sapoEl) {
        const container = document.createElement('div');

        // Thêm sapo
        const sapoDiv = document.createElement('p');
        sapoDiv.innerHTML = sapoEl.innerHTML;
        container.appendChild(sapoDiv);

        // Tìm nội dung chính sau sapo
        let sibling = sapoEl.nextElementSibling;
        let collectedLength = 0;
        while (sibling && collectedLength < 10000) {
          // Bỏ qua các phần tử rác
          const className = sibling.className?.toLowerCase() || '';
          const tagName = sibling.tagName?.toLowerCase() || '';

          if (className.includes('related') || className.includes('share') ||
            className.includes('social') || className.includes('comment') ||
            className.includes('sidebar') || className.includes('ads') ||
            tagName === 'script' || tagName === 'style') {
            sibling = sibling.nextElementSibling;
            continue;
          }

          // Thêm nội dung
          if (sibling.textContent && sibling.textContent.trim().length > 0) {
            container.appendChild(sibling.cloneNode(true));
            collectedLength += sibling.textContent.length;
          }

          sibling = sibling.nextElementSibling;
        }

        if (container.textContent && container.textContent.trim().length > 100) {
          fallbackContent = container.innerHTML;
          console.log('Found content using sapo + siblings method');
        }
      }
    }

    // Nếu vẫn không có, tìm tất cả <p> trong main hoặc article
    if (!fallbackContent) {
      const mainAreas = doc.querySelectorAll('main, article, .main, .article, [role="main"]');
      for (const area of mainAreas) {
        const paragraphs = area.querySelectorAll('p');
        if (paragraphs.length > 2) {
          const container = document.createElement('div');
          paragraphs.forEach(p => {
            if (p.textContent && p.textContent.trim().length > 30) {
              container.appendChild(p.cloneNode(true));
            }
          });
          if (container.textContent && container.textContent.trim().length > 200) {
            fallbackContent = container.innerHTML;
            console.log('Found content using paragraph collection from', area.tagName);
            break;
          }
        }
      }
    }

    // Sử dụng fallback nếu tìm thấy
    if (fallbackContent && fallbackContent.replace(/<[^>]*>/g, '').trim().length > articleContent.replace(/<[^>]*>/g, '').trim().length) {
      articleContent = fallbackContent;
      console.log('Using fallback content, length:', fallbackContent.length);
    }
  }

  if (!articleContent) throw new Error('Không thể trích xuất nội dung.');

  contentContainer.innerHTML = articleContent;

  // 4. KIỂM TRA LẶP ẢNH ĐẠI DIỆN VỚI THÂN BÀI
  let mainImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

  const bodyImages = Array.from(contentContainer.querySelectorAll('img'));

  // LOGIC ĐƠN GIẢN VÀ TRIỆT ĐỂ:
  // Nếu nội dung bài viết ĐÃ CÓ ẢNH thì KHÔNG hiển thị ảnh thumbnail riêng biệt
  // Điều này đảm bảo 100% không bao giờ có 2 ảnh giống nhau ở đầu bài
  if (bodyImages.length > 0) {
    mainImage = '';
  }

  let summary = articleExcerpt;

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
    siteName: articleSiteName,
    title: finalTitle.replace(/\s+/g, ' ').trim(),
    author: articleByline,
    publishDate: '',
    content: contentContainer.innerHTML,
    summary: summary,
    mainImage: mainImage,
    url: url
  };
}
