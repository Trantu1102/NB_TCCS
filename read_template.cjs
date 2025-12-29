const mammoth = require('mammoth');
const fs = require('fs');

mammoth.convertToHtml({ path: './Vidu-Phieu kiem tra XDD.docx' })
    .then(result => {
        fs.writeFileSync('template_html.html', result.value);
        console.log('HTML saved to template_html.html');
        console.log('\n=== RAW TEXT ===');
        return mammoth.extractRawText({ path: './Vidu-Phieu kiem tra XDD.docx' });
    })
    .then(result => {
        console.log(result.value);
    })
    .catch(e => console.log('Error:', e.message));
