const fs = require('fs');
const content = fs.readFileSync('prompt.md', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('Substitueix **tot `src/sections/notes/NotesDataContext.jsx`** per:')) + 2;
const endIndex = lines.findIndex((l, i) => i > startIndex && l.startsWith('```'));

const newNotesContext = lines.slice(startIndex + 1, endIndex).join('\n');
fs.writeFileSync('src/sections/notes/NotesDataContext.jsx', newNotesContext);
console.log('NotesDataContext.jsx applied!');
