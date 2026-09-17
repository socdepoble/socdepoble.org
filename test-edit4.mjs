import fs from 'fs';
const content = fs.readFileSync('src/PedraSecaEmbed.jsx', 'utf8');
const newContent = content.replace(
  'arrel.adoptedStyleSheets = currentSheets;',
  'arrel.adoptedStyleSheets = currentSheets;\n        const testDiv = document.createElement("div"); testDiv.id = "test-font"; testDiv.style.fontFamily = "var(--sdp-font)"; testDiv.innerText = "TEST FONT"; arrel.appendChild(testDiv); setTimeout(() => console.error("FONT RESOLVED TO:", window.getComputedStyle(testDiv).fontFamily), 1000);'
);
fs.writeFileSync('src/PedraSecaEmbed.jsx', newContent);
