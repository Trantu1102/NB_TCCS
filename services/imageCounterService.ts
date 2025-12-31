import { fetchHtmlContent } from './scraperService';

export interface ImageCountResult {
    khaiThac: number;  // Ảnh khai thác
    tuLieu: number;    // Ảnh tư liệu (Ảnh: Tư liệu)
    tacGia: number;    // Ảnh có tên tác giả
}

/**
 * Đếm ảnh trong bài viết dựa trên figcaption
 * - Ảnh: Tư liệu → Tư liệu
 * - Ảnh: [Tên tác giả] → Tác giả (trừ "Tin tổng hợp" và "KT + biên tập" → Tư liệu)
 * - Ảnh: [URL/link] → Khai thác
 * - Còn lại → Khai thác
 * 
 * @param articleType - Loại bài viết. Nếu là "Tin tổng hợp" hoặc "KT + biên tập" thì không có phương án tác giả
 */
export async function countImagesInArticle(url: string, articleType?: string): Promise<ImageCountResult> {
    // "Tin tổng hợp" và "KT + biên tập" KHÔNG cho phép tác giả (ảnh tác giả → tư liệu)
    // Các loại khác đều cho phép tác giả
    const lowerType = articleType?.toLowerCase() || '';
    const noAuthorTypes = ['tin tổng hợp', 'kt + biên tập'];
    const allowAuthor = !noAuthorTypes.includes(lowerType);

    try {
        const html = await fetchHtmlContent(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        let khaiThac = 0;
        let tuLieu = 0;
        let tacGia = 0;

        // Tìm vùng nội dung bài viết
        const contentSelectors = [
            '.article-content',
            '.content-video',
            '.content-news',
            '.content-magazine',
            '.detail-content',
            '.post-content',
            '.entry-content'
        ];

        let contentArea: Element | Document = doc;
        for (const sel of contentSelectors) {
            const found = doc.querySelector(sel);
            if (found) {
                contentArea = found;
                break;
            }
        }

        // Tìm tất cả IMG trong vùng nội dung (không phải figure để tránh nested)
        const images = contentArea.querySelectorAll('img');

        // Dùng Set để loại bỏ ảnh trùng
        const processedImageSrcs = new Set<string>();

        images.forEach(img => {
            const imgSrc = img.getAttribute('src') || '';

            // Bỏ qua icon, logo, ảnh share, nút print
            if (imgSrc.includes('icon') || imgSrc.includes('logo') || imgSrc.includes('_logo') ||
                imgSrc.includes('share') || imgSrc.includes('avatar') ||
                imgSrc.includes('print') || imgSrc.length < 10) return;

            // Bỏ qua nếu đã xử lý ảnh này
            if (processedImageSrcs.has(imgSrc)) return;
            processedImageSrcs.add(imgSrc);

            // Tìm figure chứa ảnh này
            const figure = img.closest('figure');
            if (!figure) {
                // Ảnh không trong figure → BỎ QUA (không phải ảnh bài viết)
                return;
            }

            // Tìm figcaption TRONG CÙNG NHẤT (innermost)
            // Lấy tất cả figcaption trong figure, chọn cái nhỏ nhất/sâu nhất
            const allCaptions = figure.querySelectorAll('figcaption');
            let bestCaption: Element | null = null;

            for (const cap of allCaptions) {
                // Tìm figcaption không chứa figure khác bên trong
                // và là cái chứa caption ngắn nhất (innermost)
                if (!bestCaption) {
                    bestCaption = cap;
                } else {
                    // Nếu caption hiện tại chứa bestCaption, dùng bestCaption (nhỏ hơn)
                    // Nếu bestCaption chứa caption hiện tại, dùng caption hiện tại (nhỏ hơn)
                    if (bestCaption.contains(cap)) {
                        bestCaption = cap;
                    }
                }
            }

            const captionText = (bestCaption?.textContent || '').trim();

            if (captionText.length === 0) {
                khaiThac++;
                return;
            }

            const lowerCaption = captionText.toLowerCase();

            // Kiểm tra pattern "Ảnh: Tư liệu"
            if (lowerCaption.includes('ảnh: tư liệu') || lowerCaption.includes('ảnh:tư liệu')) {
                tuLieu++;
                return;
            }

            // Kiểm tra pattern "TTXVN" hoặc "Ảnh: TTXVN" → Khai thác (ảnh từ Thông tấn xã)
            if (lowerCaption.includes('ttxvn')) {
                khaiThac++;
                return;
            }

            // Kiểm tra pattern "Ảnh: [something]" ở cuối chuỗi
            const photoByMatch = captionText.match(/[Ảả]nh\s*:\s*(.+)$/i);
            if (photoByMatch) {
                const authorName = photoByMatch[1].trim();

                // Loại bỏ các trường hợp KHÔNG phải tên tác giả (là URL)
                const isUrl =
                    authorName.toLowerCase().includes('http') ||
                    authorName.toLowerCase().includes('www.') ||
                    authorName.toLowerCase().includes('.com') ||
                    authorName.toLowerCase().includes('.vn') ||
                    authorName.toLowerCase().includes('.org') ||
                    authorName.toLowerCase().includes('.net');

                if (isUrl) {
                    khaiThac++;
                    return;
                }

                // Tên tác giả hợp lệ (không phải URL, không phải tư liệu)
                if (authorName.length > 0 && authorName.length <= 50 &&
                    !authorName.toLowerCase().includes('tư liệu')) {
                    // Chỉ tính là tác giả nếu loại bài cho phép (Tin mới, photos, Tin tức)
                    if (allowAuthor) {
                        tacGia++;
                    } else {
                        // Nếu không cho phép tác giả → tính là tư liệu
                        tuLieu++;
                    }
                    return;
                }
            }

            // Các trường hợp còn lại → Khai thác
            khaiThac++;
        });

        return { khaiThac, tuLieu, tacGia };
    } catch (error) {
        console.error('Error counting images:', error);
        return { khaiThac: 0, tuLieu: 0, tacGia: 0 };
    }
}
