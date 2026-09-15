---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: auditoria de tractors i coherència (Grok)"
---
# 🛡️ INFORME DEL CONSELL — AUDITORIA DEL PAQUET `260914_2308_BUNDLE_auditoria` (Resposta de Grok)

**Font**: contingut del bundle (MANIFEST + cos dels fitxers). Entorn aïllat: només el que hi ha dins.

**Abast del contracte**: 529 fitxers, 3.374.765 bytes. Opcionals absents no crítics: `public/gestoria/index.html`, `public/gestoria/tauler.js`, `public/assets/pedra-seca.css`.

---

## 1. Estat verificable del MANIFEST

- Esquema `sdp.bundle.v2`, generat `2026-09-14T21:08:58.676Z`, arrel `socdepoble.org`, `verificat: true`.
- Contracte d’abast coherent: directoris inclosos, obligatoris presents (`package.json`, `vite.config.js`, `eslint.config.js`, `index.html`), extensions i dirs_exclosos declarats.
- Totals declarats coincideixen amb la llista de `fitxers` (hash + bytes + línies per entrada).
- **Causa de confiança**: el MANIFEST porta sha256 per fitxer; la verificació es pot repetir extraint cos i recalculant.

**Correcció mínima**: cap. El contracte ja declara què no s’hi veu.

---

## 2. Incoherències estructurals detectades al cos

### 2.1 Teixidora de sinapsis (escriptura bloquejada)

Fitxer: `tooling/wiki/teixidora_sinapsis.mjs`

```js
const PROCEDEIX = false; // fins que el Reflex torne
```

Qualsevol crida amb intenció d’escriptura llança:

```js
throw new Error('La teixidora està temporalment desactivada per escriptura fins que es complete la migració a Reflex.');
```

**Causa**: migració a Reflex incompleta; fail-closed intencionat.  
**Efecte**: dry-run funciona; no hi ha cosit real de `[[enllaços]]` al cos.  
**Correcció mínima verificable**:
1. Completar integració Reflex + pla + rollback.
2. Canviar `PROCEDEIX` només quan `openReflex` / `sealReflex` estiguin operatius i testats.
3. Afegir test que comprovi que `PROCEDEIX === true` implica acta a `04_escriptori` amb sha256 del canvi.

### 2.2 Scripts tombstone (P1)

- `tooling/wiki/update_glossari.cjs` → exit 2, missatge SDP-LOCK.
- Altres generadors legacy (extract-gemini, extract-perplexity, etc.) viuen sota `tooling/gates/legacy/`.

**Causa**: retir explícit fins a compilador v2 amb pla/Reflex/rollback.  
**Correcció mínima**: deixar-los com a tombstone; no reactivar sense `tractor-cognitiu` P4 (escriptura fora de canonada) en verd.

### 2.3 Doble esquema de frontmatter

Fitxers: `tooling/wiki/schema.json` i `tooling/wiki/esquema_frontmatter.json`.  
Porta: `tooling/wiki/tractor-esquemes.mjs` (lleis E1–E4).

**Causa històrica**: un esquema per al Reflex, un altre per a la porta; divergència de `tipus`/`estat`/required.  
**Estat actual al bundle**: la porta existeix i és fail-closed.  
**Correcció mínima verificable**:
1. Executar `node tooling/wiki/tractor-esquemes.mjs --json`.
2. Si `ok: false`, unificar enums i `required` en un sol fitxer canònic i fer que l’altre sigui un reexport o s’elimini.
3. Segellar deute a `.agents/deute/` només després de zero divergències.

### 2.4 Frontera OAuth (relé)

Fitxers: `src/data/oauthRelay.js` + `public/auth/callback.html`.  
Porta: `tooling/wiki/tractor-frontera-auth.mjs` (A1–A6).

**Causa potencial declarada al propi tractor**: `RELAY_PER_DEFECTE` vs URL documentada a l’HTML (històricament `.org` vs `.cat`).  
**Correcció mínima verificable**:
1. Una sola constant d’origen derivada (`relayOrigin()` des de `relayUrl()`).
2. `ORIGENS_PERMESOS` només amb `===` / `indexOf` / `includes` exacte (ja exigit per A2).
3. Validar `sdp_path` abans de `location.replace` (A5).
4. Re-executar el tractor; ha de sortir `ok: true` (avisos A4 tolerats si no hi ha amfitrió Sollutia encara).

### 2.5 Nomenclatura i rutes mortes

Porta: `tooling/wiki/tractor-nomenclatura.mjs` (N1–N3).  
Config: `tooling/wiki/nomenclatura.json`.

**Causa documentada**: migracions de carpetes sense actualitzar citacions (`00_SER_Brain_Identitat` citat des de codi/skills mentre l’estructura real és `01_ser`, etc.).  
**Correcció mínima**:
1. `node tooling/wiki/tractor-nomenclatura.mjs --arrel=. --pla` (només pla, no escriu).
2. Un sol commit atòmic: renoms + reescriptura de tots els `[[...]]` i rutes literals al mateix temps.
3. `--baseline` només quan N2 = 0 (o deute no puja).

### 2.6 Skills i genoma (tractor cognitiu)

Porta: `tooling/wiki/tractor-cognitiu.mjs` (P1–P9).

Riscos detectables per disseny de la porta:
- Frontmatter fantasma al cos de `SKILL.md` (P1).
- Noms duplicats / col·lisions de node (P2).
- Guardes Reflex importades i mai cridades + `bypass` + `writeFile` (P3).
- Escriptura directa sense canonada en generadors (P4).
- Skills fora de l’abast RAG (P5).
- `triggers_on` absent o mal format (P8).
- Fitxers acompanyants sense consumidor (P9).

**Correcció mínima**:
1. Executar `node tooling/wiki/tractor-cognitiu.mjs --json`.
2. Resoldre només els `BLOQUEJANT`; els AVÍS no tanquen la porta llevat de `--avisos`.
3. Cap skill nova sense `name`, `description`, `triggers_on` al frontmatter real (no al cos).

---

## 3. Arquitectura Online-First (coherència de doctrina)

- ADR present: `_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md`.
- `vite.config.js` i `vite.standalone.config.js` orientats a SPA + build; watch ignora wiki/agents.
- Backend: Supabase (migrations + `src/data/supabaseBackend.js` + seed).
- No hi ha patrons Online-First/Online-First al nucli de l’app (coherent amb la Petorreta i l’ADR).

**Causa de risc residual**: qualsevol document o skill que parli d’“Online-First” o “Online-First” com a estat actual confondria el Consell.  
**Correcció mínima**: cercar al corpus (no a internet) les cadenes `Online-First|Online-First|Online-First|Online-First` i reescriure-les com a aspiració de llarg termini o eliminar-les del present.

---

## 4. Deute i portes (mecanisme de no-pujada)

Fitxers de deute sota `.agents/deute/`:
- `.frontmatter-deute.json`, `.nomenclatura-deute.json`, `.pedra-seca-deute.json`, `.rutes-deute.json`, `.vocabulari-deute.json`, etc.

Tots els tractors respecten el patró:
- `--baseline` segella el màxim actual.
- Execució normal: si el compte puja → exit 1.

**Correcció mínima verificable**: no tocar baselines a l’alça; només baixar deute amb canvis reals i després re-baseline.

---

## 5. Resum de causes arrel (ordenades per impacte)

| Prioritat | Causa | Efecte | Porta / evidència |
|-----------|--------|--------|-------------------|
| P0 | Teixidora amb `PROCEDEIX = false` | Zero cosit real d’enllaços | `teixidora_sinapsis.mjs` |
| P0 | Possible divergència relé OAuth | Camí 1 postMessage falla en silenci | `tractor-frontera-auth.mjs` A1 |
| P1 | Rutes wiki citades que no existixen | Enllaços i imports morts | `tractor-nomenclatura.mjs` N2 |
| P1 | Doble esquema frontmatter | Document vàlid per un validador, invàlid per l’altre | `tractor-esquemes.mjs` |
| P2 | Skills amb frontmatter fantasma / sense triggers | Genoma contaminat, càrrega impossible | `tractor-cognitiu.mjs` P1/P8 |
| P2 | Generadors amb `fs.writeFile*` sense canonada | Bypass de Reflex | `tractor-cognitiu.mjs` P4 |

---

## 6. Pla de correccions mínimes (ordre de treball)

1. **Frontera auth**  
   Unificar URL del relé; passar `tractor-frontera-auth.mjs` a verd.

2. **Esquemes**  
   Unificar `schema.json` ↔ `esquema_frontmatter.json`; passar `tractor-esquemes.mjs`.

3. **Nomenclatura**  
   Generar pla (`--pla`); aplicar renoms + reescriptura d’enllaços en un commit; passar N2.

4. **Cognitiu**  
   Netejar frontmatter fantasma i `triggers_on`; eliminar acompanyants orfes; passar bloquejants.

5. **Teixidora**  
   Només després de Reflex estable: habilitar escriptura amb pla + rollback + acta.

6. **Baseline**  
   Re-segellar deutes només quan els comptes no pugen.

Cap dependència nova. Cap Tailwind al core. Cap escriptura de dades personals. Si qualsevol pas implica pèrdua irreversible de cos canònic → activar SDP-LOCK i aturar.

---

## 7. Verificació final proposada (reproduïble)

```bash
node tooling/wiki/tractor-frontera-auth.mjs --json
node tooling/wiki/tractor-esquemes.mjs --json
node tooling/wiki/tractor-nomenclatura.mjs --arrel=. --json
node tooling/wiki/tractor-frontmatter.mjs --json
node tooling/wiki/tractor-cognitiu.mjs --json
```

Tots han de retornar `ok: true` (o deute ≤ baseline).  
Després, i només després, considerar reactivar la Teixidora.

**Ancoratge**: [[00_index]] · [[doc_governanca]] · ADR Online-First.
