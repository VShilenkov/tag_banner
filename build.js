const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const buildDir = path.join(srcDir, 'build');

fs.mkdirSync(buildDir, { recursive: true });

const css = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');
const modelJs = fs.readFileSync(path.join(srcDir, 'categories.js'), 'utf8');
const appJs = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf8');
const viewTemplate = fs.readFileSync(path.join(srcDir, 'view.html'), 'utf8');

const builtHtml = viewTemplate
    .replace('{{CSS}}', css)
    .replace('{{MODEL_JS}}', modelJs)
    .replace('{{APP_JS}}', appJs);

const outputPath = path.join(buildDir, 'banner.html');
fs.writeFileSync(outputPath, builtHtml, 'utf8');
console.log(`Built banner.html successfully at ${outputPath}`);
