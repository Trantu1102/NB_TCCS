
const https = require('https');

const url = "https://xaydungdang.tapchicongsan.org.vn/hoat-dong-cua-dia-phuong-co-so/dang-uy-cac-co-quan-trung-uong-tong-ket-cong-tac-kiem-tra-giam-sat-va-thi-hanh-ky-luat-cua-dang-nam-2025.html";

function fetch(targetUrl) {
  console.log("Fetching:", targetUrl);
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  };
  https.get(targetUrl, options, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return fetch(new URL(res.headers.location, targetUrl).href);
    }

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log("Status Code:", res.statusCode);
      const ogImage = data.match(/property="og:image"\s+content="([^"]+)"/) || data.match(/content="([^"]+)"\s+property="og:image"/);
      console.log("OG IMAGE:", ogImage ? ogImage[1] : "NOT FOUND");

      const images = data.match(/<img[^>]*src="([^"]+)"[^>]*>/g);
      if (images) {
        images.forEach((img, i) => {
          const src = img.match(/src="([^"]+)"/)?.[1];
          if (src && !src.includes('logo') && !src.includes('icon')) {
            console.log(`Image ${i}: ${src}`);
          }
        });
      }
    });
  });
}

fetch(url);
