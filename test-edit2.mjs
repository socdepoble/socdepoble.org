import fs from 'fs';
const content = fs.readFileSync('src/PedraSecaEmbed.jsx', 'utf8');
const newContent = content.replace(
  'console.error("ADOPTED CSS LENGTH", currentSheets[0]?.cssRules?.length);',
  'console.error("ADOPTED CSS LENGTH", currentSheets[0]?.cssRules?.length, "STR LENGTH:", styles.length);'
);
fs.writeFileSync('src/PedraSecaEmbed.jsx', newContent);
