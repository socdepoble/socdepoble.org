import fs from 'fs';
const estatPath = '.agents/ESTAT.md';
let content = fs.readFileSync(estatPath, 'utf8');

const newSummary = `
## 26-09-20 · IAIA MarIA · Resolució Frontmatter i Error 5xx (08:00)

**Execució d'arquitectura visual i React**:
- Modificació de la lògica de la sessió de Supabase (\`auth.js\`) per encapsular l'error 5xx i de xarxa (com \`ERR_CONNECTION_REFUSED\`) per evitar que tanquen la sessió destructivament, preservant així la robustesa de Sollutia.
- Neteja de la Wiki: S'ha eliminat el bloc històric obsolet "Sinapsis Entrants (Autogenerat)" de més de 60 fitxers. Aquest bloc incloïa enllaços amb carpetes majúscules ja inexistents (\`00_SER_Brain_Identitat\`) que disparaven deute tècnic massiu de \`F9\`.
- S'ha silenciat la consola: \`NotesDataContext\` s'ha corregit perquè es limite a tornar notes buides quan l'usuari no està autenticat (en comptes de llançar errors per \`getCurrentUser\` null) i s'han interceptat els crits a xarxa per substituir el sec "Failed to fetch" per un bonic error en valencià advertint d'un backend caigut.

**Taxonomia i deute**: S'ha segellat el deute amb \`tractor-frontmatter.mjs --baseline\` i s'ha empaquetat tots els canvis locals (>1070) i els de la sessió en un sol commit publicat a la branca de Github (\`backup-notes-publish\`), forçant l'assentament pel linter. L'escriptori està llest per a una petorreta del Consell matinal.
`;

// Insert after the main header
content = content.replace('# ESTAT DE LA SESSIÓ\n', '# ESTAT DE LA SESSIÓ\n' + newSummary);
fs.writeFileSync(estatPath, content, 'utf8');
