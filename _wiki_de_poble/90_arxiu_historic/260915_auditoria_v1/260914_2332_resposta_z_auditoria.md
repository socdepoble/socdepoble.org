---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: auditoria bloquejada per bundle truncat (Z)"
---
# 🛡️ INFORME DEL CONSELL — AUDITORIA DEL PAQUET `260914_2308_BUNDLE_auditoria` (Resposta de Z)

## Veredicte

**AUDITORIA BLOQUEJADA (B1).** El cos del bundle no ha arribat: només s'ha rebut el bloc `MANIFEST`, i tallat en sec a mitja entrada (`src/sections/pobles/townsSeed.js`, sha256 truncat a `11df640211d`). El propi contracte del bundle mana «extrau el cos i compara les sumes»: sense cossos no hi ha evidència verificable del codi ni de la Wiki. Auditar sense evidència seria invenció, i això és exactament el que aquest sistema prohibeix. A sota es lliura l'auditoria completa de **l'evidència sí disponible** (manifest + petorreta).

---

## 1. Evidència verificada

### 1.1 Petorreta ↔ MANIFEST — 6/6 hashes ✓

He comparat el bloc `SDP-ISO-CONTEXT` de la petorreta contra les entrades del manifest:

| Ruta | sha256 (prefix…sufix) | Resultat |
|---|---|---|
| `01_ser/00_bios.md` | `5dbace81…c8de34` | ✓ |
| `01_ser/02_genotip.md` | `980417e9…7f84f1` | ✓ |
| `02_saber/doc_governanca.md` | `5a37a967…e04693` | ✓ |
| `02_saber/doc_logos_oficials.md` | `70d4ea7c…e0861` | ✓ |
| `02_saber/07_plantilles/plantilla_iso_sdp.md` | `978fc4f0…c2835` | ✓ |
| `02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md` | `294ee25a…0c32f` | ✓ |

**L'ancoratge d'identitat de la petorreta és autèntic respecte al manifest.** Aquesta és l'única verificació criptogràfica possible en aquest estat.

### 1.2 Coherència temporal ✓

`generat: 2026-09-14T21:08:58.676Z` = 23:08:58 CEST = nom del fitxer `260914_2308`. Coherent amb l'acta `260914_2257_acta_marmota_relleu_auditories` que l'ha motivat.

### 1.3 Cobertura rebuda

- Declarat: **529 fitxers / 3.374.765 bytes**, `verificat: true`.
- Rebut: **≈320 entrades (~61%)**, compte aproximat sobre el text lliurat.
- Zona no visible (ordenació del manifest, tot el que va després de `src/`): resta de `src/sections/`, **`supabase/` sencer (migracions + RLS)**, `tests/`, `tooling/`, `vite.config.js`. El directori `assets/` (declarat al contracte) no aporta cap entrada visible: cal confirmar si és buit o queda a la zona tallada.

---

## 2. Troballes sobre l'evidència disponible

| # | Severitat | Troballa |
|---|---|---|
| T1 | 🔴 | **Cos del bundle absent.** Impossible verificar cap sha256 de fitxer, impossible analitzar codi o Wiki. |
| T2 | 🔴 | **Zona crítica invisible:** tot `supabase/` (RLS, base legal de dades personals segons `llei_05_privacitat`), `oauthRelay.js` + `public/auth/callback.html` (flux GoTrue), i `package.json` (comprovació de dependències supèrflues / Tailwind). |
| T3 | 🟡 | **3 `absents_no_critics`:** `public/gestoria/index.html`, `public/gestoria/tauler.js`, `public/assets/pedra-seca.css`. Risc de referències penjants via `assetResolver.js`/`host.js` — inverificable sense cossos. |
| T4 | 🟡 | **Monòlits detectables per mida** (senyal de deute, coherent amb `.agents/deute/`): `i18n.js` 85.404 B/1.708 l., `legat.css` 72.837 B/2.184 l., `DesignSectionContent.jsx` 63.831 B/1.348 l., `supabaseBackend.js` 51.995 B/1.475 l., `App.jsx` 30.334 B/697 l. |
| T5 | 🟡 | **Cobertura de tests baixa a la zona visible:** 5 fitxers `*.test.*` visibles (App, AppGridResizer, PillToggle, UniversalCard, NotesDataContext) davant ~170 mòduls de `src/`. El directori `tests/` queda a la zona tallada. |
| T6 | 🟢 | `.agents/SKILLS_SEAL.json` amb `nl_final: false` (higiene menor, 1 byte). |
| T7 | ✓ | **Frontissa Sollutia estructuralment modular** — coherent amb l'objectiu declarat: `dto.js` (769 B), `esquema.js` (2.544 B), `traductor.js` (2.099 B), `sollutia/client.js` (2.350 B), `sollutia/recursos.js` (720 B). Separació de responsabilitats neta; el contingut queda pendent de cossos. |

---

## 3. Causes

- **C1 (probable): transport.** El tall és dur, a mitja entrada i amb marcat `[...]`: símptoma de límit de mida/tokens del canal, no de generació corrupta.
- **C2 (a descartar): generació.** El manifest és ben format fins al tall, amb coherència temporal i d'ancoratge (§1). La falla és de lliurament, no de forja.

## 4. Correccions mínimes verificables

**M1 — Reemet el bundle partit per àmbits** (p. ex. `_wiki_de_poble` / `.agents` / `src` / `scripts`+arrel / `supabase`+`tests`+`tooling`+`assets`). Verificació de cada part des de l'arrel `socdepoble.org`:

```bash
jq -r '.fitxers[] | "\(.sha256)  \(.ruta)"' PART.json | sha256sum -c -
```

**M2 — Verifica els totals del manifest complet:**

```bash
jq '{n: (.fitxers|length), bytes: ([.fitxers[].bytes]|add)}' BUNDLE.json
# esperat: n=529, bytes=3374765
```

**M3 — Resol els 3 absents:** cerca referències; si n'hi ha, restaura o repunta via `assetResolver.js`; si no, purga'ls del contracte.

```bash
grep -rn "gestoria/index.html\|gestoria/tauler.js\|pedra-seca.css" src/ public/ index.html
```

**M4 — Afegeix el salt de línia final a `SKILLS_SEAL.json`** (canvi d'1 byte, verificable per nou hash):

```bash
printf '\n' >> .agents/SKILLS_SEAL.json
```

---

## 5. Regles de tancament — compliment

- Cerca web: **no realitzada** (entorn aïllat respectat; tota l'evidència és del bundle).
- dades personals: **no tocades** (només metadades de manifest).
- SDP-LOCK: **no activat** — auditoria de només lectura, sense risc de destrucció.
- Yapping, dependències, Tailwind al Core: res a afegir ni proposar sense `package.json` llegible.

## 6. Desbloqueig

Reenvieu el bundle partit (M1). Amb els cossos, el Consell executa l'auditoria canònica sobre: frontissa Sollutia, `oauthRelay` + `callback.html`, `supabaseBackend` + RLS, i els monòlits T4 — sempre amb correccions mínimes i verificables.

*Actua amb Trellat. El Baseline 2022 fa de jutge.*
