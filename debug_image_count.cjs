const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function debugImageCount() {
    const url = 'https://xaydungdang.tapchicongsan.org.vn/hoat-dong-cua-lanh-dao-dang-va-nha-nuoc/hoi-nghi-ban-giao-cong-tac-truong-ban-tuyen-giao-va-dan-van-trung-uong.html';

    try {
        const response = await fetch(url);
        const html = await response.text();

        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Tìm vùng nội dung bài viết trước
        const contentSelectors = [
            '.article-content',
            '.content-video',
            '.content-news',
            '.content-magazine',
            '.detail-content',
            '.post-content',
            '.entry-content',
            'article',
            '.main-content'
        ];

        let contentArea = null;
        for (const sel of contentSelectors) {
            contentArea = doc.querySelector(sel);
            if (contentArea) {
                console.log('Tìm thấy vùng nội dung với selector:', sel);
                break;
            }
        }

        if (!contentArea) {
            console.log('KHÔNG TÌM THẤY VÙNG NỘI DUNG - dùng toàn bộ document');
            contentArea = doc;
        }

        let khaiThac = 0;
        let tuLieu = 0;
        let tacGia = 0;

        // Chỉ tìm figure TRONG vùng nội dung
        const figures = contentArea.querySelectorAll('figure');
        console.log('\n=== FIGURES TRONG VÙNG NỘI DUNG:', figures.length, '===\n');

        figures.forEach((figure, i) => {
            const img = figure.querySelector('img');
            const caption = figure.querySelector('figcaption');

            if (!img) {
                console.log(`Figure ${i + 1}: KHÔNG CÓ IMG - BỎ QUA`);
                return;
            }

            const captionText = (caption?.textContent || '').trim();
            const imgSrc = img.getAttribute('src') || '';

            console.log(`\n=== Figure ${i + 1} ===`);
            console.log('IMG src:', imgSrc.substring(0, 60) + '...');
            console.log('Caption:', captionText ? `"${captionText}"` : '(TRỐNG)');

            let classification = '';

            if (captionText.length === 0) {
                classification = 'KHAI THÁC (không có caption)';
                khaiThac++;
            } else {
                const lowerCaption = captionText.toLowerCase();

                if (lowerCaption.includes('ảnh: tư liệu') || lowerCaption.includes('ảnh:tư liệu')) {
                    classification = 'TƯ LIỆU';
                    tuLieu++;
                } else {
                    const photoByMatch = captionText.match(/[Ảả]nh\s*:\s*(.+)$/i);

                    if (photoByMatch) {
                        const authorName = photoByMatch[1].trim();
                        console.log('  -> Match "Ảnh:":', `"${authorName}"`);

                        const isNotAuthor =
                            authorName.toLowerCase().includes('tư liệu') ||
                            authorName.toLowerCase().includes('http') ||
                            authorName.toLowerCase().includes('www.') ||
                            authorName.toLowerCase().includes('.com') ||
                            authorName.toLowerCase().includes('.vn') ||
                            authorName.toLowerCase().includes('.org') ||
                            authorName.toLowerCase().includes('.net') ||
                            authorName.length > 50;

                        if (authorName.length > 0 && !isNotAuthor) {
                            classification = `TÁC GIẢ (${authorName})`;
                            tacGia++;
                        } else {
                            classification = `KHAI THÁC (bị loại: ${isNotAuthor ? 'không hợp lệ' : 'rỗng'})`;
                            khaiThac++;
                        }
                    } else {
                        classification = 'KHAI THÁC (không match pattern Ảnh:)';
                        khaiThac++;
                    }
                }
            }

            console.log('=> Phân loại:', classification);
        });

        console.log('\n========== KẾT QUẢ ==========');
        console.log('Khai thác:', khaiThac);
        console.log('Tư liệu:', tuLieu);
        console.log('Tác giả:', tacGia);
        console.log('TỔNG:', khaiThac + tuLieu + tacGia);

    } catch (error) {
        console.error('Error:', error);
    }
}

debugImageCount();
