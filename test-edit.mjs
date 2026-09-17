import fs from 'fs';
const content = fs.readFileSync('src/PedraSecaEmbed.jsx', 'utf8');
const newContent = content.replace(
  'arrel.adoptedStyleSheets = currentSheets;',
  'arrel.adoptedStyleSheets = currentSheets;\n        console.error("ADOPTED CSS LENGTH", currentSheets[0]?.cssRules?.length);\n        window.__sdp_sheet = currentSheets[0];'
);
fs.writeFileSync('src/PedraSecaEmbed.jsx', newContent);
