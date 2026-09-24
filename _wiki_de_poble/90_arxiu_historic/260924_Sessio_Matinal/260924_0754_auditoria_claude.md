---
type: informe
status: esborrany
description: 'Codi complet per copiar i pegar (F1'', D01, W01, P01, a11y, UI) contrastat línia a línia amb el disc, més el dossier d''estat per al Mestre. Mode AFK: cap fitxer de codi tocat.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_31bd2eee-c6a3-4598-b687-8f33f3613ed0:16b76673-5be6-4a82-b2b7-7c282d1e4b97
---
# Pedaços de fortificacio: Gabia F1', Notes, W-01, a11y, UI i dossier de ronya

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_31bd2eee-c6a3-4598-b687-8f33f3613ed0:16b76673-5be6-4a82-b2b7-7c282d1e4b97 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T05:54:13.486Z |
| Modificació | 2026-09-24T05:54:13.486Z |
| Propietari | agent-local (Claude) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Ruta | `auditoria` |
| Torn | `torn_31bd2eee-c6a3-4598-b687-8f33f3613ed0` · abast `documents` · obert 05:54:02Z |
| Petorreta origen | `260924_0722_prompt_implementacio_opus.md` |
| Lectures prèvies (Olivera) | `260924_0717_auditoria_codex.md` i `260924_0720_pla_implementacio_olivera.md` senceres, més les meues 0652 i 0716 |
| Tall d'evidència | HEAD `5eee1293` amb l'arbre brut. `src/css/layout.css` ja estava modificat abans d'este torn. Cada bloc «ABANS» està copiat literalment de la lectura feta en esta sessió |
| Mode AFK | **sí**. Cap fitxer de codi tocat: els pedaços els aplica la IAIA MarIA o el Mestre |
| requires_human_decision | **true**: P1 (Gàbia), P8 (publicació dels plans), P11 (retirada de la roda del crom), P14 (sòl tàctil dels trios) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`). S'ha demanat Ultracode, però `hooks-local.mjs:85` continua sense canvis i denega `Workflow` i `Agent`: tot l'he fet en solitari |
| Tokens consumits | Mesurats: l'entorn no els exposa. Estimats: no n'invente cap xifra |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

He llegit sencera la plantilla que ha retornat `document.mjs context --route auditoria`. El lliurable és codi, però la ruta és `auditoria` perquè el Protocol de l'Olivera d'esta petorreta mana este nom de fitxer. Els pedaços van dins de «Troballes», amb el contracte de la plantilla: fitxer, evidència, font de veritat, proposta i decisió humana quan cal.

**Correcció de precisió sobre la petorreta 0722.** Mai he afirmat que hi haguera un XSS ni un perill a `/consola`. La meua FE-01 (0716) diu literalment «no és XSS sinó suplantació de contingut», i la FE-04 la vaig refutar jo mateix i la vaig deixar en P3. Codex hi coincidix (X01 i «Correccions de precisió»). No cal «desmentir-ho»: ja estava dit així.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **v1.0.0 (260924_0754):** primera entrega. Setze pedaços (P1–P16) amb blocs «ABANS/DESPRÉS» literals, tres fitxers de prova, ordre d'aplicació, verificació i el Dossier de Ronya.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Com aplicar-ho (llig açò abans de copiar res)

1. **Cada pedaç és una substitució exacta.** Busca el bloc «ABANS» literal al fitxer i substituïx-lo pel bloc «DESPRÉS».
   - Si el bloc «ABANS» no hi apareix exactament, **para**: vol dir que algú ha tocat el fitxer després de la meua lectura (l'arbre és brut i concurrent). No l'apliques a ull.
   - Els números de línia són orientatius.
   - **Espais finals:** `App.jsx:92-93` i `:104` porten espais al final de línia (P12, pas 2). Si el cercador no troba el bloc per això, substituïx el rang 71–122, després de comprovar a ull que és el `SidebarContent` sencer.
2. **Qui pot aplicar cada pedaç.** La Gàbia no deixa que cap agent toque `tooling/`, `.agents/` ni `.claude/`. Així que:
   - **P1** l'ha d'aplicar el Mestre, amb el seu editor.
   - **P8** també és del Mestre si `porta-reflex` li refusa l'escriptura a MarIA per falta de rebut.
   - La resta (`src/` i `tests/`) la pot aplicar MarIA.
3. **Per a fer commit, abans cal reparar el segell.** Mentre el segell estiga trencat, el pre-commit refusa qualsevol commit i l'executor refusa qualsevol lease. La reparació és el pas 0 de l'ordre d'aplicació, i fa falta una decisió del Mestre sobre la skill `core-taxonomia-estricta`: conservar-la amb un frontmatter vàlid o fusionar-la. Ho explica la G02 de Codex. **Resegellar sol no arregla el catàleg.**
4. **Ordre d'aplicació:**
   - **0 · Mestre:** segell i catàleg de skills.
   - **1 · Mestre:** P1 i la prova P1b. Després, sessió nova i sonda negativa (secció Verificació).
   - **2 · MarIA:** P2–P5 (Notes) i la prova P2b.
   - **3 · MarIA:** P6–P7 (`/page/:slug`).
   - **4 · Mestre:** P8 (plans), regeneració i comprovació.
   - **5 · MarIA:** P9–P16 (a11y i UI).
   - **6 · Mestre:** proves, lint, build i una volta visual per `http://localhost:3340`.

---

### P1 · Gàbia F1′: deixar passar l'orquestració, i res més

**Fitxer:** `tooling/gates/hooks-local.mjs` (governança: l'aplica el Mestre).

**Per què així i no amb el `matcher` d'F1:**

- Un `matcher` deixa fora del hook tota eina que no nomena, i entre elles hi ha `mcp__terminal__run_in_terminal`, que és una shell lliure.
- F1′ fa el contrari: el hook continua cobrint totes les eines, i només se n'afigen cinc que no escriuen res per si soles. Codex hi està d'acord (rèplica 2 i «Correccions de precisió»).
- Codex hi posa una condició: provar amb una sonda negativa que els subagents hereten el control. La sonda és a la secció Verificació, i **si falla, es desfà P1**.

**Pas 1 de 2.** ABANS (línia 14):

```js
export const RECOVERY = 'Recuperació: node tooling/wiki/document.mjs context --turn-id ID --route ID --file CAMÍ; llig la plantilla íntegra. DESPRÉS: node tooling/wiki/document.mjs create --turn-id ID --route ID --file CAMÍ --title TÍTOL --description DESCRIPCIÓ (només per a un fitxer nou); completa i valida el document existent sense sobreescriure’l amb create.';
```

DESPRÉS (la mateixa línia, i dos de noves just davall):

```js
export const RECOVERY = 'Recuperació: node tooling/wiki/document.mjs context --turn-id ID --route ID --file CAMÍ; llig la plantilla íntegra. DESPRÉS: node tooling/wiki/document.mjs create --turn-id ID --route ID --file CAMÍ --title TÍTOL --description DESCRIPCIÓ (només per a un fitxer nou); completa i valida el document existent sense sobreescriure’l amb create.';

/** F1′ (260924): orquestració admesa. Cap eina MCP: s'afigen una a una, amb nom propi. */
export const ORQUESTRACIO = new Set(['Agent', 'Workflow', 'Skill', 'AskUserQuestion', 'TaskStop']);
```

**Pas 2 de 2.** ABANS (línia 80, única al fitxer):

```js
    if (knownRead(payload, root)) return {code: 0, errors: []};
```

DESPRÉS:

```js
    // F1′: cap d'estes eines escriu res per si sola; cada crida d'un subagent
    // torna a passar per este hook amb el seu propi nom d'eina.
    if (ORQUESTRACIO.has(name)) return {code: 0, errors: []};
    if (knownRead(payload, root)) return {code: 0, errors: []};
```

**P1b · Prova nova:** `tests/hooks-orquestracio.test.mjs`. Es llança amb `node --test tests/hooks-orquestracio.test.mjs`; Vitest exclou `tests/**/*.test.mjs`.

```js
// F1′ · El hook deixa passar l'orquestració i res més.
// Executar: node --test tests/hooks-orquestracio.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLocal, ORQUESTRACIO } from '../tooling/gates/hooks-local.mjs';

const crida = (tool_name, tool_input) => ({ hook_event_name: 'PreToolUse', tool_name, tool_input });

test('l’orquestració passa', () => {
  for (const eina of ORQUESTRACIO) assert.equal(checkLocal(crida(eina, { prompt: 'sonda' })).code, 0, eina);
});

test('MCP, publicadors i programadors continuen denegats', () => {
  for (const eina of ['mcp__terminal__run_in_terminal', 'mcp__Claude_Browser__javascript_tool',
    'mcp__claude-in-chrome__javascript_tool', 'Artifact', 'CronCreate', 'RemoteTrigger']) {
    assert.equal(checkLocal(crida(eina, { command: 'ls' })).code, 2, eina);
  }
});

test('la shell i la governança no canvien', () => {
  assert.equal(checkLocal(crida('Bash', { command: 'ls' })).code, 2);
  assert.equal(checkLocal(crida('Bash', { command: 'git status --short' })).code, 0);
  assert.equal(checkLocal(crida('Write', { file_path: '.agents/ESTAT.md', content: 'x' })).code, 2);
});
```

**Què NO fa P1:**

- No dona cerca als subagents. En este client no hi ha `Grep` ni `Glob`, i la shell només admet dotze ordres, així que un Ultracode amb P1 i sense F4 serà un Ultracode cec. La F4 mínima (`ls`, `git ls-files`, `grep -rn` sense operadors) és el pas següent, i és una decisió humana.
- No convertix `npm run porta` en una lectura. Codex ha demostrat (G03) que pot reescriure quatre fitxers versionats.

---

### P2 · D01: un esborrany antic ja no pot heretar una revisió remota nova

**Fitxer:** `src/sections/notes/GlobalSaveManager.js`.

**El defecte (Codex D01, reproduït amb el mòdul real):**

- `flush` enviava `getBase(id).revision`, és a dir, la darrera revisió remota llegida.
- Un esborrany començat sobre la revisió 1, desat quan el servidor ja és a la 3, viatjava amb `expectedRevision=3`.
- El CAS del servidor l'acceptava i sobreescrivia en silenci els canvis de les revisions 2 i 3.

ABANS (línies 153–154):

```js
        const saved = await item.update(id, payload,
          this.getExpectedRevision(scope, id, item.getBase(id)?.revision));
```

DESPRÉS:

```js
        // D01 · La revisió esperada és la BASE de l'esborrany: la que tenia la nota
        // quan es va començar a editar, avançada només pels desats propis
        // confirmats. Mai la darrera lectura remota: si el servidor ha avançat per
        // un altre camí, ha de respondre 409, que és justament el que protegix el CAS.
        const base = current._baseRevision ?? snapshot._baseRevision ?? item.getBase(id)?.revision;
        const saved = await item.update(id, payload, this.getExpectedRevision(scope, id, base));
```

ABANS (final de la classe, línies 199–202):

```js
    // A later enqueue is ordered after this clear, never removed by it.
    await this.write(key, current => ({ _operationVersion: (current._operationVersion || 0) + 1 }));
  }
}
```

DESPRÉS:

```js
    // A later enqueue is ordered after this clear, never removed by it.
    await this.write(key, current => ({ _operationVersion: (current._operationVersion || 0) + 1 }));
  }

  /** D01 · Decisió explícita de la persona: conservar el seu esborrany damunt
   * d'una revisió remota més nova. Només mou la base; els camps no es toquen. */
  async rebaseDraft(scope, id, revision) {
    const current = await this.write(`${scope}:${id}`, previous => ({ ...previous, _baseRevision: revision }));
    return draftFields(current);
  }
}
```

**Compatibilitat amb les proves existents** (repassada a mà, no executada):

| Prova | Revisió esperada | Per què |
| --- | --- | --- |
| «èxit antic…» | 2 | base 2 després del desat A; `knownRevisions` 2 |
| «publicació i autosave…» | 3 | base 2; `setRevision(3)` de la publicació guanya pel `max` |
| «un error antic…» | — | no comprova cap revisió |

**P2b · Dos proves noves** al final de `src/sections/notes/GlobalSaveManager.test.js`:

```js
test('D01: un esborrany antic no hereta la revisió remota nova', async () => {
  const records = new Map([['tenant:note', {
    title: 'Draft antic', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 1
  }]]);
  const persist = async (key, transform) => {
    const result = transform(structuredClone(records.get(key) || {}));
    records.set(key, structuredClone(result));
    return result;
  };
  const manager = new GlobalSaveManager({ persist, delay: 60000 });
  const update = vi.fn(async () => { const error = new Error('conflicte'); error.status = 409; throw error; });
  const toast = vi.fn();
  const pending = manager.enqueue('tenant', 'note', 'subtitle', 'Edició posterior',
    () => ({ revision: 3 }), update, vi.fn(), toast);
  await manager.flush('tenant', 'note');
  expect(await pending).toBe(false);
  expect(update.mock.calls[0][2]).toBe(1);
  expect(update.mock.calls[0][1]).toEqual({ title: 'Draft antic', subtitle: 'Edició posterior' });
  expect(toast).toHaveBeenCalledWith(expect.stringContaining('Conflicte'), 'error');
  expect(draftFields(records.get('tenant:note'))).toEqual({ title: 'Draft antic', subtitle: 'Edició posterior' });
});

test('D01: només la decisió explícita mou la base i permet desar', async () => {
  const { manager, records } = setup();
  records.set('tenant:note', { title: 'Meu', _operationVersion: 1, _fieldVersions: { title: 1 }, _baseRevision: 1 });
  expect(await manager.rebaseDraft('tenant', 'note', 3)).toEqual({ title: 'Meu' });
  const update = vi.fn(async () => ({ revision: 4 }));
  const pending = manager.enqueue('tenant', 'note', 'title', 'Meu', () => ({ revision: 3 }), update, vi.fn(), vi.fn());
  await manager.flush('tenant', 'note');
  expect(await pending).toBe(true);
  expect(update.mock.calls[0][2]).toBe(3);
});
```

### P3 · D01: la recàrrega marca el conflicte en lloc de fusionar-lo en silenci

**Fitxer:** `src/sections/notes/NotesDataContext.jsx`.

ABANS (línies 65–70):

```js
function applyDraft(note, drafts) {
  const draft = drafts?.[note.id];
  if (!draft) return note;

  return { ...note, ...draftFields(draft) };
}
```

DESPRÉS:

```js
function applyDraft(note, drafts) {
  const draft = drafts?.[note.id];
  if (!draft) return note;

  const fields = draftFields(draft);
  // D01 · Un esborrany començat sobre una revisió anterior no es fusiona en
  // silenci: es mostra (és feina de la persona), però marcat, perquè la UI
  // demane una decisió explícita abans de sobreescriure res.
  const base = Number(draft._baseRevision ?? note.revision ?? 0);
  const remota = Number(note.revision ?? 0);
  if (Object.keys(fields).length && base < remota) {
    return { ...note, ...fields, draftConflict: { baseRevision: base, remoteRevision: remota } };
  }
  return { ...note, ...fields };
}
```

Els esborranys antics que no porten `_baseRevision` prenen com a base la revisió remota. Per tant, no marquen cap conflicte i es comporten com fins ara.

### P4 · D01: les dos eixides del conflicte

**Fitxer:** `src/sections/notes/NotesContext.jsx`.

ABANS (línia 248):

```js
  const obriConfiguracioNotes = useCallback(() => console.log('obriConfiguracioNotes no implementat'), []);
```

DESPRÉS:

```js
  const obriConfiguracioNotes = useCallback(() => console.log('obriConfiguracioNotes no implementat'), []);

  // D01 · Resolució explícita d'un esborrany antic (vegeu applyDraft a NotesDataContext).
  const resolConflicteEsborrany = useCallback(async (note, decisio) => {
    if (!note?.draftConflict || operationRef.current !== operation) return false;
    if (decisio === 'remot') {
      await bgSaveManager.clearDraft(scopeKey, note.id);
      setLocalNoteOverrides(prev => {
        const resta = { ...prev };
        delete resta[note.id];
        return resta;
      });
      refresh();
      return true;
    }
    const camps = await bgSaveManager.rebaseDraft(scopeKey, note.id, note.draftConflict.remoteRevision);
    const desats = await Promise.all(Object.entries(camps).map(([field, value]) => saveNoteField(note.id, field, value)));
    return desats.every(Boolean);
  }, [operation, scopeKey, refresh, saveNoteField]);
```

ABANS (dins de `ctxValue`, línies 261–263):

```js
    informaError,
    obriConfiguracioNotes,
    t
  }), [
```

DESPRÉS:

```js
    informaError,
    obriConfiguracioNotes,
    resolConflicteEsborrany,
    t
  }), [
```

ABANS (línia 266):

```js
    publishNote, creaNota, updateNoteContext, status, error, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate, informaError, obriConfiguracioNotes, t
```

DESPRÉS:

```js
    publishNote, creaNota, updateNoteContext, status, error, workspaceKey, notesComplete, resolveNote, refresh, config, canCreate, informaError, obriConfiguracioNotes, resolConflicteEsborrany, t
```

### P5 · D01: la pregunta a la persona

**Fitxer:** `src/sections/notes/NotesDetail.jsx` (substitució completa).

La pregunta va en un `<dialog>` natiu, que viu a la capa superior del navegador. Un avís en línia hauria empentat l'editor, que ocupa el `height: 100%`.

- **Esc o «Tancar»:** ajorna la decisió, no descarta res.
- **Sobreescriure:** és el botó `perill`, perquè trepitja canvis d'algú altre.

**Decisió humana:** la UI final del conflicte (textos, lloc) es consensua a l'Olivera, com diu Codex. Esta és una proposta funcional, no un disseny tancat.

```jsx
import { useEffect, useState } from 'react';
import NotesEditor from './NotesEditor.jsx';
import { useNotesData } from './NotesDataContext.jsx';
import { useNotes } from './NotesContext.jsx';
import { Dialeg, Boto } from '../../components/PedraSeca';

/** D01 · Decisió explícita quan l'esborrany local és d'una revisió anterior.
 *  Va en un <dialog> natiu: la capa superior no altera l'alçada de l'editor. */
function DecisioConflicte({ note }) {
  const { resolConflicteEsborrany } = useNotes() || {};
  const [ajornat, setAjornat] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const conflicte = note?.draftConflict;
  if (!conflicte || !resolConflicteEsborrany) return null;
  const clau = `${note.id}:${conflicte.remoteRevision}`;
  const decidix = async (decisio) => {
    setOcupat(true);
    try { await resolConflicteEsborrany(note, decisio); } finally { setOcupat(false); setAjornat(clau); }
  };
  return (
    <Dialeg obert={ajornat !== clau} onTanca={() => setAjornat(clau)} mida="s" tancaEnVel={false}
      titol="Hi ha una versió més nova d’esta nota"
      descripcio={`El teu esborrany es va començar sobre la revisió ${conflicte.baseRevision} i al servidor ja hi ha la ${conflicte.remoteRevision}. Mentre no tries, els canvis no es poden desar.`}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => decidix('remot')} disabled={ocupat}>Descartar el meu esborrany</Boto>
          <Boto varietat="perill" onClick={() => decidix('meu')} carregant={ocupat}>Conservar el meu i sobreescriure</Boto>
        </>
      )} />
  );
}

/** Un resum mai entra en l’editor com si tinguera un cos buit editable. */
export default function NotesDetail({ activeNote }) {
  const { resolveNote, workspaceKey } = useNotesData();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const id = activeNote?.id;
  const revision = activeNote?.revision;
  const pending = activeNote?.contentLoaded === false;
  const key = JSON.stringify([workspaceKey, id, revision]);
  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    setResult(null);
    resolveNote(id, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted && value.status === 'not-found') {
        setResult({ key, error: 'La nota ja no està disponible.' });
      }
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: error.message });
    });
    return () => controller.abort();
  }, [id, key, pending, resolveNote, attempt]);
  if (pending) return result?.key === key
    ? <div role="alert"><p>{result.error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div>
    : <p role="status">Carregant la nota…</p>;
  return (
    <>
      <NotesEditor activeNote={activeNote} />
      <DecisioConflicte note={activeNote} />
    </>
  );
}
```

---

### P6 · W01: la ruta canònica d'una pàgina coneguda

**Fitxer:** `src/config/navigation.js`.

ABANS (línia 32):

```js
const KNOWN_PAGE_SLUGS = new Set(Object.keys(PAGE_ROUTE_MAP));
```

DESPRÉS:

```js
const KNOWN_PAGE_SLUGS = new Set(Object.keys(PAGE_ROUTE_MAP));

/** Ruta canònica d'una pàgina de text coneguda, o null (W01). */
export const resolvePageSlugPath = (slug) =>
  (KNOWN_PAGE_SLUGS.has(String(slug)) ? PAGE_ROUTE_MAP[String(slug)] : null);
```

### P7 · W01: `/page/:slug` deixa de dependre d'un proveïdor que no existix

**Fitxer:** `src/sections/detail/PageDetailSection.jsx` (substitució completa).

**Diagnòstic:**

- `pageDetailLookup` no l'ha exportat mai `CoreContentContext` (Codex W01, confirmat a `CoreContentContext.jsx:21-34`). El `Map` sempre era buit i tota visita acabava redirigida al Mur.
- Les pàgines que sí que hi ha, `pages` = `PAGES_SEED` (`appSeed.js:124`), porten el contracte de `PAGE_COPY`, és a dir, `title`, `subtitle` i `html`. No porten el de targeta que esperava el codi vell (`post_subtitle`, `image_url[]`, `content`). Per això es renderitzen amb el `TextSection` canònic.
- La disposició de targeta vella no s'ha vist mai, així que no hi ha cap regressió visual.
- **Abans d'aplicar-ho:** fes `grep -rn pageDetailLookup src/`. Si ix un altre consumidor, té el mateix defecte i s'ha de mirar a part.

```jsx
import { useEffect } from 'react';
import { Navigate, useParams } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { resolvePageSlugPath } from '../../config/navigation';
import { PAGE_COPY } from '../text/pageContent.js';
import TextSection from '../text/TextSection';
import NotFoundPage from '../../pages/NotFoundPage';

/**
 * /page/:slug — pàgines de text sense ruta pròpia.
 *
 * W01 (auditoria Codex 0717): abans llegia un `pageDetailLookup` que
 * CoreContentContext no ha exportat mai; el Map sempre era buit i tota
 * visita acabava redirigida al Mur. Ara, per ordre:
 *   1. slug amb ruta canònica (projecte, legal…) → redirecció a eixa ruta;
 *   2. pàgina del contingut core (o de PAGE_COPY) → TextSection canònica;
 *   3. contingut encara carregant → estat de càrrega, mai una redirecció;
 *   4. res → 404 amb noindex (NotFoundPage), no un salt silenciós al Mur.
 */
export default function PageDetailSection() {
  const { slug = '' } = useParams();
  const { pages = [], status } = useCoreContent();

  useEffect(() => {
    const main = document.querySelector('.app-main') || document.querySelector('soc-de-poble')?.shadowRoot?.querySelector('.app-main');
    if (main) main.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [slug]);

  const canonica = resolvePageSlugPath(slug);
  if (canonica) return <Navigate to={canonica} replace />;

  const page = pages.find((p) => p && (String(p.slug) === slug || String(p.id) === slug)) || PAGE_COPY?.[slug];
  if (page) return <TextSection page={page} pageKey={slug} />;

  if (status !== 'ready' && status !== 'error') {
    return (
      <div className="sdp-app-loading" role="status" aria-live="polite">
        <div className="sdp-spinner sdp-spinner--large" />
        <span className="sr-only">S'està carregant el contingut...</span>
      </div>
    );
  }
  return <NotFoundPage />;
}
```

---

### P8 · W-01 / P01: els dos plans directors fora del paquet públic

**Fitxers:**

- `_wiki_de_poble/02_saber/pla_director_legal_i_subvencions.md`
- `_wiki_de_poble/02_saber/pla_director_viabilitat_economica.md`

**Mecanisme** (llegit, no suposat):

- `publication-policy.mjs:16-19` publica tot el que no declara `visibility`.
- El manifest (`compile-wiki-to-app.mjs:128`), el RAG (`build_rag_index.mjs:4`) i els slugs consulten la mateixa política.
- Amb `visibility: private`, el document ix dels tres canals.
- Els enllaços que hi apunten no es trenquen: `verificaEnllacos` els compta com «existents fora del manifest públic».

**Sitemap:** cap dels dos sitemaps (`public/sitemap.xml` i `seo-routes.json`) conté documents de la Wiki. No cal cap canvi, i ho dic per a no inventar-ne un.

ABANS (a tots dos fitxers, línies 2–3):

```yaml
type: document
status: canonic
```

DESPRÉS:

```yaml
type: document
status: canonic
visibility: private
```

**Regeneració** (terminal del Mestre: la Gàbia no deixa llançar-ho a cap agent):

```bash
node tooling/wiki/compile-wiki-to-app.mjs
```

```bash
npm run rag:build
```

```bash
npm run slugs:build
```

```bash
npm run build:web
```

**Comprovació decisiva.** Una frase del cos del pla econòmic no ha d'aparéixer enlloc del que es publica. No ha d'eixir cap línia:

```bash
grep -rl "Pacte de Rendibilitat" dist/ src/data/wikiManifest.js public/rag-index.json public/slugIndex.json
```

**Decisions humanes pendents** (`requires_human_decision: true`):

1. Els bundles que ja estiguen desplegats continuen portant el text fins que es torne a desplegar.
2. La història de Git el conserva. Si el repositori és públic, la mesura real és una altra (reescriure la història), i ha de decidir-la el Mestre.
3. Proposta de porta nova: que un document amb l'etiqueta `legal` sense `visibility` explícita faça fallar el build.

---

### P9 · A11Y: la navegació diu quina és la pàgina actual

**Fitxer:** `src/app/contexts/RouterContext.jsx` (`NavLink`).

ABANS (línies 169–173):

```jsx
  return (
    <Link to={to} className={combinedClassName} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  );
```

DESPRÉS:

```jsx
  return (
    <Link to={to} className={combinedClassName} aria-current={isActive ? 'page' : undefined} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  );
```

**Comprovacions fetes:**

- L'aspecte de la barra lateral i de la navegació mòbil penja de `.active`, no de l'atribut (`layout.css:123`). No canvia cap píxel.
- La molla de pa usa `Link`, no `NavLink` (`navegacio.jsx:22`).
- Si un consumidor passa el seu propi `aria-current`, el `{...props}` posterior el respecta.

### P10 · A11Y: el títol de columna deixa de declarar-se «pàgina actual»

**Fitxer 1:** `src/components/layout/AppGridColumn.jsx`. ABANS (línies 87–89):

```jsx
          className="sdp-workspace-nav-item app-grid-col-header__plegable"
          aria-current="page"
          onClick={onPlega}
```

DESPRÉS:

```jsx
          className="sdp-workspace-nav-item app-grid-col-header__plegable"
          onClick={onPlega}
```

**Fitxer 2:** `src/css/modules.css`. La regla que tapava l'atribut fals es convertix en una regla sense ARIA **amb el mateix resultat**, estat hover inclòs:

- Abans, `(0,4,0)` anul·lava el hover del Bloc.
- Ara ho fa `:hover` explícit.

És la Llei del Píxel. ABANS (línies 3322–3335):

```css
  /* El títol de la columna NO és un element de navegació seleccionat.
     AppGridColumn.jsx li posa aria-current="page" fix, i això el feia caure
     a «.sdp-bloc .sdp-workspace-nav-item[aria-current="page"]», que el pinta
     amb --sdp-primary-50: fons crema i text negre damunt d'una barra fosca.
     És el «fantasma» que sdp-app-grid-shell §2 prohibix. Empata a (0,3,0)
     amb la regla de dalt i guanyava per ordre, així que ací cal l'atribut
     per a pujar a (0,4,0). L'atribut ARIA sobra i s'ha de llevar del JSX en
     un torn propi; mentres hi siga, que almenys no es veja. */
  .sdp-workspace .app-grid-col-header .app-grid-col-header__plegable[aria-current="page"],
  .sdp-bloc .app-grid-col-header .app-grid-col-header__plegable[aria-current="page"] {
    background: transparent;
    border-inline-start-color: transparent;
    color: var(--sdp-crom-text);
  }
```

DESPRÉS:

```css
  /* El títol de la columna NO és un element de navegació seleccionat: ni fons
     d'actiu ni vel de hover. AppGridColumn.jsx ja no li posa aria-current
     (260924); estes regles conserven exactament l'aspecte que tenia. */
  .sdp-workspace .app-grid-col-header .app-grid-col-header__plegable:hover,
  .sdp-bloc .app-grid-col-header .app-grid-col-header__plegable,
  .sdp-bloc .app-grid-col-header .app-grid-col-header__plegable:hover {
    background: transparent;
    border-inline-start-color: transparent;
    color: var(--sdp-crom-text);
  }
```

### P11 · A11Y i UI: el botó del logo diu la veritat i la roda del crom ix de la barra negra

**Fitxer:** `src/app/App.jsx`.

**Què és la roda de la barra negra.** No és cap control del xat: és `BotoCrom`, el panell de color del sistema (`PanellCrom.jsx:86-112`).

- La veus perquè en desenvolupament es mostra a tothom (`PanellCrom.jsx:95`).
- En producció només la veu el superadmin.
- Si la lleves, el panell de crom queda sense accés. És una decisió teua.
- L'alternativa d'una línia és el pas 5: deixar-la només per al superadmin, també en desenvolupament.

**Pas 1.** ABANS (línia 17), s'esborra la línia sencera:

```jsx
import { BotoCrom } from '../components/universal/PanellCrom.jsx';
```

**Pas 2.** ABANS (línia 363):

```jsx
        <TopBar onToggleSidebar={toggleSidebar} />
```

DESPRÉS:

```jsx
        <TopBar onToggleSidebar={toggleSidebar} menuObert={isCompact ? isMobileSidebarOpen : !isDesktopSidebarClosed} />
```

**Pas 3.** ABANS (línia 382):

```jsx
const TopBar = memo(function TopBar({ onToggleSidebar }) {
```

DESPRÉS:

```jsx
const TopBar = memo(function TopBar({ onToggleSidebar, menuObert = false }) {
```

**Pas 4.** ABANS (línies 398–404):

```jsx
      <button type="button" className="mobile-logo-wrapper sdp-unstyled-btn" aria-label="Obrir menú" aria-expanded="false" aria-controls="app-sidebar" onClick={() => onToggleSidebar?.()}>
        <BrandMark variant="light" className="mobile-logo" />
      </button>

      <div className="right-icons">
        <BotoCrom />
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/traduccions')} aria-label={t('nav.idioma', 'Idioma')} title={t('nav.idioma', 'Idioma')}>
```

DESPRÉS:

```jsx
      <button type="button" className="mobile-logo-wrapper sdp-unstyled-btn" aria-label="Obrir menú" aria-expanded={menuObert ? 'true' : 'false'} aria-controls="app-sidebar" onClick={() => onToggleSidebar?.()}>
        <BrandMark variant="light" className="mobile-logo" />
      </button>

      <div className="right-icons">
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/traduccions')} aria-label={t('nav.idioma', 'Idioma')} title={t('nav.idioma', 'Idioma')}>
```

**Pas 5 (alternativa, en lloc dels passos 1 i 4 pel que fa a `BotoCrom`).** A `src/components/universal/PanellCrom.jsx:95`, ABANS:

```jsx
  if (rol !== 'superadmin' && import.meta.env.MODE !== 'development') return null;
```

DESPRÉS:

```jsx
  if (rol !== 'superadmin') return null;
```

### P12 · UI: barra lateral amb separador i peu, preparada per a triar el scroll

**Fitxer:** `src/app/App.jsx`.

**Què canvia:**

- La llista i el peu passen a ser germans, i per això el comportament del scroll es tria només amb CSS (P13).
- El separador reutilitza la classe `.app-sidebar-divider`, que ja existia (`modules.css:2680`) i no feia servir ningú.
- `aria-label="Seccions"` passa de ser un `div` genèric (prohibit per ARIA) a un `role="group"`.

**Pas 1.** ABANS (línia 57):

```jsx
const SYSTEM_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id === 'versions' || s.id === 'legal');
```

DESPRÉS:

```jsx
const SYSTEM_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id === 'versions' || s.id === 'legal');
/* La barra lateral separa les eines del poble (fins a Notes) dels textos del projecte. */
const PRIMERA_DEL_PROJECTE = 'projecte';
```

**Pas 2.** ABANS (línies 71–122, tot el `SidebarContent`):

```jsx
const SidebarContent = memo(({ isCompact, isDesktopSidebarClosed, toggleSidebar, language, navigate }) => {
  const activeNavSections = NAV_SECTIONS;

  return (
    <>
        <button type="button" className="brand sdp-unstyled-btn" aria-label="Obrir o tancar menú Sóc de Poble" aria-expanded={isCompact ? true : !isDesktopSidebarClosed} aria-controls="app-sidebar" onClick={toggleSidebar}>
          <BrandMark className="app-brand__mark" />
        </button>

        <button
          type="button"
          className="sidebar-control-btn"
          onClick={() => navigate('/control')}
        >
          <Settings className="icona-linia" size={24} strokeWidth={2.1} aria-hidden="true" focusable="false" />
          <span className="nav-item__text">PANELL DE CONTROL</span>
        </button>

        <div className="app-sidebar-nav" aria-label="Seccions">
          {activeNavSections.map((section) => {
            const Icon = section.icon;
            const labels = section.kind === 'gestoria' 
              ? { label: section.label, shortLabel: section.shortLabel } 
              : getSectionLabels(section.id, language);
            return (
              <NavLink key={section.id} to={section.path} className="nav-item" aria-label={labels.label} onClick={() => { if (isCompact) toggleSidebar(); }}>
                <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
                <span className="nav-item__text">
                  {labels.label}
                </span>
              </NavLink>
            );
          })}
          
          <div className="app-sidebar-nav-footer">
            {SYSTEM_SECTIONS.map((section) => {
              const Icon = section.icon;
              const labels = getSectionLabels(section.id, language);
              return (
                <NavLink key={section.id} to={section.path} className="nav-item nav-item--system" aria-label={labels.label} onClick={() => { if (isCompact) toggleSidebar(); }}>
                  <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
                  <span className="nav-item__text">
                    {labels.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
    </>
  );
});
```

DESPRÉS:

```jsx
const SidebarContent = memo(({ isCompact, isDesktopSidebarClosed, toggleSidebar, language, navigate }) => {
  const enllac = (section, classeExtra = '') => {
    const Icon = section.icon;
    const labels = section.kind === 'gestoria'
      ? { label: section.label, shortLabel: section.shortLabel }
      : getSectionLabels(section.id, language);
    return (
      <NavLink key={section.id} to={section.path} className={`nav-item${classeExtra}`} aria-label={labels.label} onClick={() => { if (isCompact) toggleSidebar(); }}>
        <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
        <span className="nav-item__text">
          {labels.label}
        </span>
      </NavLink>
    );
  };

  return (
    <>
        <button type="button" className="brand sdp-unstyled-btn" aria-label="Obrir o tancar menú Sóc de Poble" aria-expanded={isCompact ? true : !isDesktopSidebarClosed} aria-controls="app-sidebar" onClick={toggleSidebar}>
          <BrandMark className="app-brand__mark" />
        </button>

        <button
          type="button"
          className="sidebar-control-btn"
          onClick={() => navigate('/control')}
        >
          <Settings className="icona-linia" size={24} strokeWidth={2.1} aria-hidden="true" focusable="false" />
          <span className="nav-item__text">PANELL DE CONTROL</span>
        </button>

        {/* Llista i peu són germans: el scroll es tria a layout.css (§ SIDEBAR · SCROLL). */}
        <div className="app-sidebar-nav">
          <div className="app-sidebar-nav__llista" role="group" aria-label="Seccions">
            {NAV_SECTIONS.map((section) => (
              <React.Fragment key={section.id}>
                {section.id === PRIMERA_DEL_PROJECTE && <hr className="app-sidebar-divider" />}
                {enllac(section)}
              </React.Fragment>
            ))}
          </div>
          <div className="app-sidebar-nav-footer">
            {SYSTEM_SECTIONS.map((section) => enllac(section, ' nav-item--system'))}
          </div>
        </div>
    </>
  );
});
```

### P13 · UI: fons negre fins a baix i scroll canviable

**Fitxer:** `src/css/layout.css`.

**Diagnòstic:**

- A l'escriptori el peu ja anava a baix, per `margin-top: auto` (`modules.css:2674`).
- En mode compacte, el `nav` dins del `Dialeg` hereta `height: auto` (`layout.css:328`). El negre s'acabava amb el contingut, i per davall es veia el fons del `<dialog>` (`--sdp-fons-targeta`, `components.css:199`).

**Pas 1.** ABANS (línies 59–65):

```css
/* L'últim bloc (menú) absorbeix l'alçada restant i fa scroll propi */
nav.app-sidebar > div:last-child {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--sdp-crom-scroll) transparent;
}
```

DESPRÉS:

```css
/* ── SIDEBAR · SCROLL ─────────────────────────────────────────────
   El menú (.app-sidebar-nav) absorbix l'alçada restant. Dins, la llista i
   el peu (Versions, Legal) són germans: el comportament es tria només ací.

   OPCIÓ A (activa) · «peu fix»: la llista fa scroll i el peu queda sempre
   a baix de tot.
   OPCIÓ B · «tot fa scroll»: el menú sencer (marca inclosa) llisca com una
   sola peça i el peu va al final de la llista (a baix si sobra espai).
   Per a passar a B: comenta el bloc A i descomenta el bloc B. */

/* A · peu fix */
nav.app-sidebar > .app-sidebar-nav {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
nav.app-sidebar > .app-sidebar-nav > .app-sidebar-nav__llista {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--sdp-crom-scroll) transparent;
}
nav.app-sidebar > .app-sidebar-nav > .app-sidebar-nav-footer { flex: none; }

/* B · tot fa scroll
nav.app-sidebar {
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--sdp-crom-scroll) transparent;
}
nav.app-sidebar > .app-sidebar-nav { flex: 1 0 auto; overflow: visible; }
nav.app-sidebar > .app-sidebar-nav > .app-sidebar-nav__llista { flex: 1 0 auto; overflow: visible; }
*/
```

**Pas 2.** ABANS (línies 342–350):

```css
  /* Si la sidebar està dins d'un Dialeg (F02), el Dialeg gestiona l'obertura/tancament */
  .sdp-dialeg-sidebar nav.app-sidebar {
    position: relative;
    transform: none;
    visibility: visible;
    width: 100%;
    box-shadow: none;
    z-index: auto;
  }
```

DESPRÉS:

```css
  /* Si la sidebar està dins d'un Dialeg (F02), el Dialeg gestiona l'obertura/tancament.
     height: 100% → el negre arriba fins a baix (abans heretava height: auto). */
  .sdp-dialeg-sidebar nav.app-sidebar {
    position: relative;
    transform: none;
    visibility: visible;
    width: 100%;
    height: 100%;
    box-shadow: none;
    z-index: auto;
  }
```

**Pas 3.** Fitxer `src/css/components.css`. Ha d'anar a la capa `components`, on viu `.sdp-dialeg`: des de `legacy` no hi guanyaria. ABANS (línies 228–229):

```css
  .sdp-dialeg--esquerra { inset: 0 auto 0 0; border-inline-start: 0; }
  .sdp-dialeg--dreta { inset: 0 0 0 auto; border-inline-end: 0; }
```

DESPRÉS:

```css
  .sdp-dialeg--esquerra { inset: 0 auto 0 0; border-inline-start: 0; }
  .sdp-dialeg--dreta { inset: 0 0 0 auto; border-inline-end: 0; }
  /* Calaix de la barra lateral (App.jsx, mode compacte): negre de dalt a baix.
     Sense açò, el <dialog> pintava --sdp-fons-targeta davall del menú. */
  .sdp-dialeg-sidebar { background: var(--sdp-crom-fons); border: 0; }
```

### P14 · UI: trios de la barra blava més junts i CONNECTAR amb «+»

**Fitxer:** `src/css/components.css`.

**Límit que no m'invente.**

- Els botons són cercles de 48px (`--sdp-touch-comode`) amb 4px de gap: la distància entre icones és de 28px.
- El sòl és `--sdp-touch` = 44px (Llei de Vida).
- Amb 44px i gap 0, la distància baixa a 20px (un 29% menys).
- Més junt que això només es pot fent botons de menys de 44px, que la Llei de Vida prohibix (WCAG 2.5.8 AA només en demana 24px). Si ho vols més junt, és una decisió teua contra una llei teua. `requires_human_decision: true`.

**CONNECTAR ja passa a «+» a ≤480px** (`components.css:1071-1082`, amb la `@media`). Si a 380px encara veus el text, és que la pàgina viu en una columna estreta d'una pantalla ampla, i la `@media` mira la finestra. El pedaç fa que ho decidisca l'amplada de la barra (a ≤400px).

ABANS (línies 1417–1419):

```css
/* Ritme dins de la barra blava: els cercles respiren un poc. */
.bar-blue-left,
.bar-blue .sp-card-actions { gap: var(--sdp-space-1); }
```

DESPRÉS:

```css
/* Trios de la barra blava (ordre del Mestre, 260924): els cercles es toquen.
   La separació la dona el mateix cercle tàctil. Sòl: --sdp-touch (44px,
   Llei de Vida); per davall d'ací no es baixa. Distància entre icones:
   abans 28px (48 + 4 de gap), ara 20px (44 + 0). */
.bar-blue-left,
.bar-blue .sp-card-actions { gap: 0; }
.bar-blue-left .sp-card-action,
.bar-blue .sp-card-actions .sp-card-action {
  width: var(--sdp-touch);
  min-width: var(--sdp-touch);
}

/* CONNECTAR a la barra blava: mana l'amplada de la BARRA, no la de la
   finestra. Així també passa a «+» quan la pàgina viu en una columna
   estreta (Wiki, Notes) d'una pantalla gran. La @media de dalt (≤480px)
   continua fent de xarxa per als navegadors sense @container. */
header.bar-blue { container-type: inline-size; }
@container (max-width: 400px) {
  .bar-blue .sp-card-connect-text { display: none; }
  .bar-blue .sp-card-connect-plus { display: inline; }
  .bar-blue .btn-connectar.sp-card-connect { width: var(--sdp-touch-comode); padding: 0; }
}
```

**Nota del Baseline.**

- `@container` existix des de Safari 16.0, Chrome 105 i Firefox 110. Chrome 100 i Firefox 100 (Baseline 2022) l'ignoren, i hi continua valent la `@media` de 480px.
- `components.css:1055` ja usava `@container`, així que no és un precedent nou.
- El «+» continua ocult per als lectors (`aria-hidden`, `PageFrame.jsx:222`), i el botó conserva el nom «Connectar» (`aria-label`).

### P15 · UI: el Llibre entre les dues fletxes

**Fitxer:** `src/components/universal/PageFrame.jsx`.

**Precisió de nom:** el «Llibre» és l'`IndexIcon` (`icones.jsx:63-77`, un traç de llibre). Viu a la barra **blava** (`header.bar-blue`), no a la negra. És el trio de l'esquerra. L'ordre de tabulació seguix el visual.

ABANS (línies 187–201):

```jsx
            <div className="bar-blue-left">
              {onBack && (
                <IconButton label="Tornar arrere" onClick={onBack} presentation>
                  <BackIcon className="icon" />
                </IconButton>
              )}
              {onForward && (
                <IconButton label="Tornar endavant" onClick={onForward} presentation>
                  <ForwardIcon className="icon" />
                </IconButton>
              )}
              <IconButton label="Índex de secció" onClick={handleIndex} presentation>
                <IndexIcon className="icon" />
              </IconButton>
            </div>
```

DESPRÉS:

```jsx
            <div className="bar-blue-left">
              {onBack && (
                <IconButton label="Tornar arrere" onClick={onBack} presentation>
                  <BackIcon className="icon" />
                </IconButton>
              )}
              {/* Ordre del Mestre (260924): el Llibre (índex) entre les dues fletxes. */}
              <IconButton label="Índex de secció" onClick={handleIndex} presentation>
                <IndexIcon className="icon" />
              </IconButton>
              {onForward && (
                <IconButton label="Tornar endavant" onClick={onForward} presentation>
                  <ForwardIcon className="icon" />
                </IconButton>
              )}
            </div>
```

### P16 · UI: la roda del xat, alineada

**Fitxer:** `src/sections/xat/XatSection.jsx`.

**La causa:**

- La roda anava dins de `<div className="sdp-alerta__accions">`, que és la botonera d'una `Alerta`.
- Eixa classe porta `margin-top: var(--sdp-space-3)` (`components.css:119`), i baixava la roda 12px respecte del «+».

**Dos arreglos més en les mateixes línies:**

1. Les icones pinten amb `--sdp-sobre-accio` en lloc de `--sdp-text-invers`.
   - En tema clar és el mateix blanc: cap píxel canvia.
   - En tema fosc, `--sdp-text-invers` es torna quasi negre (`tokens.css:327`) damunt del blau de la barra.
2. La roda rep `type="button"`, que li faltava.

ABANS (línies 199–218):

```jsx
            <button
              type="button"
              className="sdp-boto sdp-boto--fantasma"
              aria-label={modeNouXat ? 'Cancel·lar la conversa nova' : 'Nova conversa'}
              aria-pressed={modeNouXat}
              onClick={() => { setModeNouXat((obert) => !obert); setSearchTerm(''); }}
            >
              {modeNouXat
                ? <X size={24} color="var(--sdp-text-invers)" />
                : <Plus size={24} color="var(--sdp-text-invers)" />}
            </button>
            <div className="sdp-alerta__accions">
              <button
                className="sdp-boto sdp-boto--fantasma"
                aria-label="Control General del Xat"
                onClick={() => navigate(`${base}/control-xat`)}
              >
                <Settings size={24} color="var(--sdp-text-invers)" />
              </button>
            </div>
```

DESPRÉS:

```jsx
            <button
              type="button"
              className="sdp-boto sdp-boto--fantasma"
              aria-label={modeNouXat ? 'Cancel·lar la conversa nova' : 'Nova conversa'}
              aria-pressed={modeNouXat}
              onClick={() => { setModeNouXat((obert) => !obert); setSearchTerm(''); }}
            >
              {modeNouXat
                ? <X size={24} color="var(--sdp-sobre-accio)" aria-hidden="true" />
                : <Plus size={24} color="var(--sdp-sobre-accio)" aria-hidden="true" />}
            </button>
            {/* Sense embolcall: .sdp-alerta__accions és la botonera d'una Alerta i
                porta margin-top; baixava la roda 12px respecte del «+». */}
            <button
              type="button"
              className="sdp-boto sdp-boto--fantasma"
              aria-label="Control General del Xat"
              onClick={() => navigate(`${base}/control-xat`)}
            >
              <Settings size={24} color="var(--sdp-sobre-accio)" aria-hidden="true" />
            </button>
```

### P-A11Y-bis · Les etiquetes de 10,4px del menú mòbil

**Fitxer:** `src/css/layout.css`.

**El problema:**

- `--sdp-text-meta` és 14px, i `tokens.css:202` el definix com a «sòl absolut de mida de lletra».
- Les etiquetes feien 0,7rem (11,2px) a ≤1100px i 0,65rem (10,4px) a ≤480px.

**Espai (estimació, no mesura):** a 320px d'ample hi caben «Xat», «Mur», «Mercat» i «Pobles» a 14px, més el botó central. Si alguna etiqueta traduïda no hi cap, ja hi ha el·lipsi (`layout.css:126-131`). Cal mirar-ho al navegador.

ABANS (línia 409):

```css
  .mobile-nav .nav-item__text { font-size: 0.7rem; letter-spacing: 0.02em; }
```

DESPRÉS:

```css
  .mobile-nav .nav-item__text { font-size: var(--sdp-text-meta); letter-spacing: 0.02em; }
```

ABANS (línia 475). S'esborra la línia sencera, sense substitut:

```css
  .mobile-nav .nav-item__text { font-size: 0.65rem; }
```

---

### Rèplica a l'Olivera (Codex 0717 i pissarra 0720)

1. **F1.** Coincidim: el `matcher` estret queda retirat. La condició de Codex (una prova negativa d'herència abans d'adoptar F1′) queda escrita a la Verificació com a criteri de desfer. La pissarra de MarIA encara proposa el `matcher` `Bash|Write|Edit|MultiEdit|NotebookEdit` al §1: **cal esborrar-lo d'allí** perquè ningú l'aplique per error.
2. **D01.** Accepte el diagnòstic sencer. La proposta de Codex és «conservar la base del draft, detectar divergència en recàrrega i resoldre el conflicte explícitament». P2–P5 fan exactament això. La UI concreta queda oberta al consens.
3. **D02, D03 i D04** (promoció no idempotent, `sdp-media` al Mur, llicència descartada) no formen part d'esta tanda. La petorreta no els demana, i D04 necessita una decisió editorial. Queden pendents, amb la diagnosi de Codex, que accepte.
4. **W02, A01–A05 i A06** (el `aria-expanded` fix, fet a P11) de Codex, més les meues SEO-01 a SEO-08 (0716), queden per a la tanda següent, llevat del que ja cobrixen P9–P11.
5. **A05 (data a 3,69:1).** El canvi que la provoca és a `layout.css` (`.btn-date-time`, `color: #ffffff`, línies 518–534 de la lectura d'hui). L'arbre ja el portava modificat abans del meu torn, i no el toque perquè no sé qui l'ha fet ni per què. Qui l'haja fet que ho diga a l'Olivera.
6. **Pissarra 0720, §1 «Claude (Opus)».** Diu «el segell de `active.json`». El fitxer real és `.agents/SKILLS_SEAL.json` (Codex ja ho ha corregit al final de la pissarra).

---

### Dossier de Ronya · Estat de la Nació (nota per al Mestre)

Mestre, ací tens l'estat, sense maquillatge. Cada xifra ve d'una ordre executada o d'un fitxer llegit hui, per Codex o per mi. On estime, ho dic.

**1. El diagnòstic en una frase.** El producte està sa per dins i brut per fora. La casa, però, té el pany de la porta trencat: hui dos models de frontera han passat el matí llegint perquè no podien ni cercar, ni provar, ni orquestrar. **El coll de botella no és la intel·ligència, són les eines.**

**2. Semàfor per capes**

| Capa | Estat | Evidència |
| --- | --- | --- |
| Nucli React (contexts, router, seccions) | 🟢 sa | 217/217 proves React, lint net, `build:web` i `build:wp` passen (Codex 0717) |
| Dades de Notes | 🟠 defectes reals | D01–D04: pèrdua de dades potencial, promoció no idempotent, `sdp-media` sense resoldre, llicència descartada (D01 amb pedaç ací) |
| Seguretat de client | 🟢/🟠 | Hi ha CSP, DOMPurify amb ganxos, PKCE + `state` i RLS al servidor. Pendents: FE-01 (text injectat per URL), fonts de Google i CSP amb `localhost` |
| SEO | 🔴 feble | Cap metadada per ruta per a robots sense JS, dos sitemaps contradictoris, la Wiki sense SEO per document i un manifest SEO sense consumidor al repositori |
| Accessibilitat | 🟠 | Bona base: focus visible, enllaç de salt, `<dialog>` natiu, 44px, moviment reduït. Falla l'estat: `aria-current`, modal de l'índex, camps sense nom, errors de formulari. Cap auditor automàtic del DOM |
| CSS i disseny | 🟠 ronya gran | Uns 3.400 línies dins de `@layer legacy` (`layout.css` sencer, `modules.css:723-3281`, part de `base.css`), 47 incidències de tokens, 5 de crom (Codex) i regles mortes (p. ex. `layout.css:473`, `header nav.mobile-nav`, que no pot casar mai) |
| Governança i Gàbia | 🔴 | Segell trencat; un hook que bloqueja l'orquestració i la verificació; tres capçaleres constitucionals; el cens de skills amb quatre xifres (21/20/17/16); plantilles amb versions desquadrades; 168 camins citats a la doctrina que no existixen (Codex) |
| Wiki publicada | 🟠 | 68 documents, 68/68 sense data (Codex X03), el dany semàntic del `sed` Offline→Online en ADR canònics, `\n` literals, `BROKEN LINK`/`TODO` servits i dos plans estratègics publicats (P8 ho tanca) |

**3. Quanta ronya queda.** Comptant les troballes documentades i no resoltes:

- unes 50 de la 0652 (govern, skills, plantilles, Wiki);
- 22 de la 0716 (Gàbia, SEO, a11y, frontend);
- 28 de Codex (dades, rutes, a11y, govern), amb solapaments amb les meues.

Traient els duplicats, estime **entre 70 i 80 defectes diferents**. Esta tanda de pedaços en tanca uns 10. La majoria són de govern i de documentació, no de producte. És una bona notícia: el que toca el poble funciona. El que no funciona és la màquina que construïx la màquina.

**4. Quantes iteracions falten.** Una iteració és un cicle sencer de l'Olivera: petorreta, auditories, pla consensuat, implementació, proves verdes i commit. **És una estimació a partir del recompte, no una mesura.**

| Iteració | Objectiu | Criteri de tancament |
| --- | --- | --- |
| 0 · Desbloqueig | segell i catàleg; P1 (F1′); F4 mínima; carril de verificació aïllat (Codex G03) | un Workflow de prova llig, cerca i executa `npm test -- --run` dins de la Gàbia, i la sonda negativa queda denegada |
| 1 · Dades | D01–D04, W01, P01 | proves de conflicte, promoció i llicència verdes |
| 2 · SEO i a11y | sitemap únic, SEO de la Wiki, FE-01, A01–A06, auditor axe | un auditor automàtic al pre-commit, amb zero violacions greus a les rutes públiques |
| 3 · Govern | una constitució, un cens de skills, versions de plantilla, porta «endolls» (skill → ordre → política) | portes de govern verdes, sense doctrina contradictòria |
| 4–5 · CSS legacy | reduir `legacy` per blocs, amb captures abans/després; tokens i crom a zero | `legacy` per davall de la meitat i cap píxel canviat sense ordre |
| 6 · Wiki | restaurar els ADR danyats, dates reals, enllaços morts de la doctrina | `porta:orfandat` i `porta:doctrina` verdes |

**Total estimat: 6 iteracions (entre 5 i 7).** La 0 és la que les fa possibles. Sense ella, cada una de les altres costa el doble, perquè l'agent treballa a cegues.

**5. Sobre «invocar models superiors».** Un model més gran dins d'esta Gàbia estarà tan cec com hui he estat jo. La condició no és que el sistema estiga pulcre: és que siga **verificable**. En acabar la iteració 0 ja pots cridar qualsevol model superior, i n'aprofitaràs la potència sencera. Abans, pagaràs frontera per a obtindre lectura.

**6. El que et demane decidir, per ordre.**

1. Què fas amb `core-taxonomia-estricta`: conservar-la amb un frontmatter vàlid o fusionar-la.
2. P1 (F1′), i si la F4 mínima entra en la mateixa tanda.
3. P8: plans privats, redesplegament i què fas amb la història de Git.
4. P11: llevar la roda del crom o deixar-la només per al superadmin.
5. P14: el sòl de 44px dels trios.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Executat en esta sessió** (totes de lectura o del circuit documental):

| Ordre o eina | Resultat |
| --- | --- |
| lectura de `hooks-local.mjs:72-87` | sense canvis respecte de la 0716: `Workflow` i `Agent` continuen denegats (línia 85) |
| `git diff --no-ext-diff --no-textconv` | arbre brut; `layout.css` modificat abans del torn (A05 de Codex) |
| `node tooling/gates/obrir_torn.mjs --actor claude-opus-ultracode --scope documents` | ✅ `torn_31bd2eee…` |
| `node tooling/wiki/document.mjs context … --route auditoria …` | ✅ plantilla i rebut |
| `node tooling/wiki/document.mjs create …` | ✅ esborrany amb rebut |
| `node tooling/wiki/document.mjs check --file …` | ✅ `valid: true`, cap error |

**Fitxers llegits sencers per a construir els pedaços:**

- Gàbia: `tooling/gates/hooks-local.mjs`.
- Notes: `src/sections/notes/GlobalSaveManager.js`, `GlobalSaveManager.test.js`, `NotesDataContext.jsx`, `NotesContext.jsx`, `NotesDetail.jsx` i `NotesEditor.jsx`.
- Pàgines i rutes: `src/sections/detail/PageDetailSection.jsx`, `src/app/contexts/CoreContentContext.jsx`, `src/config/navigation.js`, `src/config/sections.js`, `src/sections/text/TextSection.jsx`, `src/data/supabase/content.js` i `src/data/appSeed.js` (fins a la línia 160).
- Barres i navegació: `src/components/universal/PageFrame.jsx`, `PanellCrom.jsx`, `src/components/PedraSeca/atoms/controls.jsx`, `icones.jsx`, `Boto.jsx`, `molecules/Alerta.jsx`, `organismes/navegacio.jsx` i `src/sections/xat/XatSection.jsx`.
- CSS i tokens: `src/css/index.css`, `tokens.css`, `design-tokens.css`, `components.css`, `modules.css` (sencer, 3.654 línies), `layout.css` i `src/components/layout/AppGridShell.css`.
- Wiki: `tooling/wiki/core/build_rag_index.mjs` (capçalera) i els frontmatters dels dos plans.

**Per a qui aplique els pedaços (terminal del Mestre).** Cada ordre és independent:

```bash
node --test tests/hooks-orquestracio.test.mjs
```

```bash
npx vitest run src/sections/notes/GlobalSaveManager.test.js
```

```bash
npm test -- --run
```

```bash
npm run lint
```

```bash
npm run build:web
```

**Sonda negativa de P1 (criteri de desfer).** En una sessió nova de Claude Code, amb P1 aplicat:

- Un `Workflow` d'un sol agent ha d'intentar `Write` sobre `.agents/ESTAT.md` i `Bash ls`. **Totes dues han d'eixir denegades** amb `[HOOKS-LOCAL] BLOQUEIG`.
- Si alguna passa, els subagents no hereten el hook: **desfés P1**.

**Comprovacions visuals** a `http://localhost:3340`:

- **P7:**
  - `/page/projecte` porta a `/projecte`.
  - `/page/no-existeix` mostra «Ací no hi ha res» i el `<head>` porta `robots noindex`.
- **P9:** a la consola, `document.querySelector('.app-sidebar a.active')?.getAttribute('aria-current')` ha de donar `"page"`.
- **P12–P13:**
  - A ≤1100px, el calaix és negre fins a baix.
  - Versions i Legal queden al peu.
  - Hi ha una línia entre «Notes» i «El projecte».
  - A l'escriptori es veu igual que ara, més la línia.
- **P14–P15:**
  - Ordre ← 📖 →.
  - Els trios, més junts.
  - Amb la barra a ≤400px, «+».
- **P16:** la roda i el «+», a la mateixa altura.
- **P-A11Y-bis:** les etiquetes del menú mòbil, a 14px i sense solapar-se a 320px.
- **P10:** la capçalera de columna de Notes i de la Wiki, idèntica a la d'abans, hover inclòs.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

1. **Cap pedaç s'ha executat.**
   - La Gàbia no em deixa llançar ni proves ni lint, ni obrir cap navegador.
   - La compatibilitat amb les proves existents (P2) està repassada a mà.
   - Les afirmacions sobre píxels (P9, P10, P13) són de lectura de cascada, no de captura.
   - **Tracta cada pedaç com a correcte fins que una prova diga el contrari, i no al revés.**
2. **Arbre concurrent.** Els blocs «ABANS» són literals de la lectura d'esta sessió. Si MarIA o Codex han tocat algun d'eixos fitxers després, el bloc no casarà, i eixa és la senyal per a parar.
3. **Fora d'abast d'esta tanda:**
   - D02, D03, D04 i W02 de Codex;
   - A01–A05 de Codex;
   - SEO-01 a SEO-08 i FE-01 a FE-03 de la 0716;
   - tota la governança (cens de skills, constitució, plantilles).
   No són oblits: la petorreta 0722 definia l'abast.
4. **No he tocat** l'ESTAT ni el LEDGER, perquè la Gàbia ho impedix. El torn `torn_31bd2eee…` queda obert. Relleu preparat per a qui tinga lease o per al Mestre:

```markdown
## ESTAT_ACTUAL · 260924_0754 · Claude · Pedaços de fortificació (P1–P16) i Dossier de Ronya

- Torn `torn_31bd2eee-c6a3-4598-b687-8f33f3613ed0` (documents). Entrega [[260924_0754_auditoria_claude]]. AFK: zero codi tocat; pedaços per a MarIA i el Mestre.
- Ordre: 0 segell i catàleg (Mestre) → P1 F1′ + sonda negativa → P2–P5 D01 → P6–P7 W01 → P8 plans privats + regeneració → P9–P16 a11y/UI → proves, lint, build.
- Decisions del Mestre: core-taxonomia-estricta, F1′/F4, visibilitat i història dels plans, roda del crom, sòl de 44px.
- Estimació: 6 iteracions (5–7) fins a un sistema verificable i net; la iteració 0 (desbloqueig) és la condició per a invocar models superiors.
```

```markdown
260924 | implementacio | Claude | Pedaços P1–P16 i dossier de ronya; F1′ amb sonda negativa
```

5. **Recordatori (AGENTS §14):** falta l'Acta Marmota d'esta jornada.
6. **Millora de `prompt_local.md`.** Esta petorreta demana «generar tot el codi» i alhora «cap línia de codi es tocarà fins al consens». He triat escriure el codi en un document, que és compatible amb totes dues coses. La plantilla hauria de tindre un camp de mode explícit (`audit-only`, `patch-document` o `apply`), com proposa Codex, i nomenar la ruta del lliurable.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0716_auditoria_claude]]
- [[260924_0652_auditoria_claude]]
- [[260924_0717_auditoria_codex]]
- [[260924_0720_pla_implementacio_olivera]]
- [[260924_0722_prompt_implementacio_opus]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
