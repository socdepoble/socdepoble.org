import fs from 'fs';
const content = fs.readFileSync('src/PedraSecaEmbed.jsx', 'utf8');
const newContent = content.replace(
  'this.root = this.attachShadow({ mode: \'closed\' });',
  'this.root = this.attachShadow({ mode: \'closed\' });\n    window.__sdp_root = this.root;'
);
fs.writeFileSync('src/PedraSecaEmbed.jsx', newContent);
