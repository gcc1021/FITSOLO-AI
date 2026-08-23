/* 生成 web/js/cases-data.js：从 data/cases/*.json 读取并内嵌为浏览器全局数据 */
const fs = require('fs');
const path = require('path');
const ROOT = 'C:/Users/gcc83/Desktop/FITSOLO-AI';
const files = [
  'data/cases/case-01-fatloss-f28.json',
  'data/cases/case-02-musclegain-m24.json',
  'data/cases/case-03-shaping-f34.json'
];
const cases = files.map(f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf-8')));
const out = '/* 自动生成，勿手改。重新生成：node docs/tools/build-cases-data.js */\n'
  + '(function (root) { root.FITSOLO_CASES = ' + JSON.stringify(cases, null, 2) + '; })(typeof window !== \'undefined\' ? window : globalThis);\n';
fs.writeFileSync(path.join(ROOT, 'web/js/cases-data.js'), out, 'utf-8');
console.log('cases-data.js generated:', cases.length, 'cases');
