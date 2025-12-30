const https = require('https');
const fs = require('fs');

// Fetch using CORS proxy to get raw HTML
const targetUrl = 'https://xaydungdang.tapchicongsan.org.vn/videos/phat-dong-phong-trao-thi-dua-yeu-nuoc-giai-doan-2026-20306.html';
const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

https.get(proxyUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const html = json.contents;

            // Save raw HTML
            fs.writeFileSync('debug_video_page.html', html);
            console.log('HTML saved to debug_video_page.html');
            console.log('Total HTML length:', html.length);

            // Find all class names
            const classMatches = html.match(/class="[^"]+"/g) || [];
            const allClasses = new Set();
            classMatches.forEach(m => {
                const classes = m.replace('class="', '').replace('"', '').split(/\s+/);
                classes.forEach(c => allClasses.add(c));
            });

            console.log('\n=== All Classes Found ===');
            const classArray = Array.from(allClasses).sort();
            classArray.forEach(c => {
                if (c.includes('content') || c.includes('body') || c.includes('article') ||
                    c.includes('detail') || c.includes('text') || c.includes('sapo') ||
                    c.includes('video') || c.includes('post') || c.includes('entry')) {
                    console.log('  -', c);
                }
            });

            // Search for XDĐ text to find content location
            const xddIndex = html.indexOf('XDĐ -');
            if (xddIndex > -1) {
                console.log('\n=== Content starts at index:', xddIndex);
                console.log('Preview around XDĐ:');
                console.log(html.substring(xddIndex - 200, xddIndex + 500));
            }

            // Find body text pattern
            const bodyMatch = html.match(/Ngày 27-12-2025[\s\S]{0,2000}/);
            if (bodyMatch) {
                console.log('\n=== Body text found ===');
                console.log(bodyMatch[0].substring(0, 500));
            }

        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw response preview:', data.substring(0, 500));
        }
    });
}).on('error', e => console.error('Request error:', e));
