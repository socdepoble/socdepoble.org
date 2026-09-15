---
tipus: document
estat: esborrany
description: 1. Arquitectura global (estat actual)
---
**Auditoria tècnica del sistema (bundle 260909_2111) + pàgina legal**

Anàlisi basada exclusivament en el contingut del bundle (manifest, codi font, wiki, gates, tractors, esquemes i tests). Cap cerca externa.

### 1. Arquitectura global (estat actual)

- **Stack canònic**: React (via Preact/compat) + Vite + Supabase (Online-First estricte, ADR-2026-08). Dexie present però subordinat. No hi ha Online-First ni Online-First operatiu.
- **Nucli d’identitat**: `.agents/` (BIOS, PROTOCOL_PETORRETA, genotip 9+1 lleis, skills) + `_wiki_de_poble/` (Ser / Saber / Actuar).
- **Gates / tractors**: sistema fort de fail-closed (frontmatter, esquemes, frontera-auth, cognitiu, pedra-seca, sollutia, rutes, etc.). Deute segellat i baseline.
- **Volum**: 428 fitxers, ~2,97 MB. Contingut textual molt concentrat en:
  - `src/css/index.css` (122 kB / 3511 línies)
  - `src/config/i18n.js` (83 kB)
  - `src/sections/text/pageContent.js` (119 kB)
  - `src/data/supabaseBackend.js` (35 kB)
  - `src/app/App.jsx` (28 kB)
  - `src/components/universal/UniversalElements.jsx` (28 kB)

El sistema és coherent amb Online-First + Trellat + Baseline 2022, però el pes de contingut estàtic i CSS generat està desproporcionat respecte a la lògica d’aplicació.

### 2. Problemes crítics de qualitat / rendiment / robustesa

| Prioritat | Problema | Evidència al bundle | Impacte |
|-----------|----------|---------------------|---------|
| P0 | Contingut legal/estàtic monolític | `pageContent.js` 119 kB | Bundle inicial gran, dificultat de manteniment, risc de desalineació amb i18n |
| P0 | CSS monolític | `index.css` 122 kB | Càrrega inicial, especificitat alta, difícil purga |
| P1 | i18n monolític | `i18n.js` 83 kB | Mateix problema de bundle i de sincronia amb contingut legal |
| P1 | Manca de separació clara legal vs. restant | No existeix `legalContent.js` dedicat; tot va a `pageContent.js` + `TextSection.jsx` | Desalineació fàcil entre rutes, SEO i contingut |
| P2 | OAuth / frontera-auth | `oauthRelay.js` + `public/auth/callback.html` + tractor-frontera-auth | Ja té gates, però qualsevol divergència d’origen mata el Camí 1 en silenci |
| P2 | Frontmatter / esquemes | Dos esquemes (`schema.json` + `esquema_frontmatter.json`) + tractor-esquemes | Coherència vigilada, però deute històric encara present |
| P3 | Skills i miralls | Múltiples skills + miralls a wiki + tractors cognitius | Overhead de manteniment; RAG i sinapsis limitades |

### 3. Diagnòstic específic de la pàgina legal

**Causa arrel més probable** (segons estructura del bundle):

1. Tot el contingut textual (inclosa la legal) viu dins `src/sections/text/pageContent.js` (119 kB). No hi ha mòdul dedicat `legalContent.js`.
2. `TextSection.jsx` és un contenidor prim que consumeix `pageContent`.
3. Les rutes i la navegació (`src/config/navigation.js`, `sections.js`) tracten “text” de forma genèrica.
4. L’i18n (`i18n.js`) i el contingut legal no estan sincronitzats per clau estable; qualsevol canvi de clau o de estructura trenca la pàgina sense error de compilació.
5. SEO (`useSEO.js`) i UniversalPage esperen metadades estructurades que el bloc legal actual pot no subministrar de forma consistent.
6. Possible desalineació amb el baseline de privacitat (`LLEI_05_Privacitat.md`) i amb els texts legals exigits per Sollutia / integració.

**Símptomes esperats**:
- Contingut legal incompletó o desfasat en català/valencià.
- Ruta `/legal` (o equivalent) mostra fallback o text genèric.
- Consola neta en dev però contingut incorrecte en producció.
- Problemes de SEO / accessibilitat a la pàgina legal.

### 4. Propostes de millora (ordenades per impacte / esforç)

#### A. Pàgina legal (correcció immediata – mínima intervenció)

1. Extreure el bloc legal de `pageContent.js` a un mòdul dedicat:
   ```js
   // src/sections/text/legalContent.js
   export const legalContent = {
     ca: { /* ... */ },
     // altres idiomes si cal
   };
   ```
2. Fer que `pageContent.js` reexporti o compose només el que no és legal.
3. Actualitzar `TextSection.jsx` (o crear `LegalSection.jsx` si la ruta ho justifica) perquè consumeixi `legalContent` de forma explícita.
4. Garantir que les claus i18n i les metadades SEO de la pàgina legal estiguin alineades amb `LLEI_05_Privacitat.md` i amb els requisits de Sollutia.
5. Afegir un test de fum mínim que verifiqui que la ruta legal retorna contingut no buit i amb les seccions obligatòries (avis legal, privacitat, cookies, contacte).

Això resol la desalineació sense tocar l’arquitectura global.

#### B. Millores sistèmiques (qualitat / rendiment)

1. **CSS**: dividir `index.css` en tokens + components + seccions. Aplicar `purge-css` / `salfuma-css` de forma més agressiva al build de producció. Objectiu: < 40 kB gzippats.
2. **Contingut estàtic**: moure tot el contingut llarg (legal, glossari, textos de seccions) a fitxers JSON o MD processats en build-time, no a JS runtime.
3. **i18n**: dividir per namespace (common, legal, mur, xat, …) i carregar sota demanda o per ruta.
4. **Bundle inicial**: revisar `App.jsx` + Universal* per code-splitting de seccions pesades (Notes, Xat, Dispositius, Disseny).
5. **Auth**: mantenir el tractor-frontera-auth com a porta obligatòria; no relaxar la comparació exacta d’orígens.
6. **Frontmatter / wiki**: continuar amb el deute segellat; no permetre pujada de F1–F6. El tractor-esquemes ja evita divergències entre els dos validadors.

#### C. Robustesa operativa

- Mantindre el flux Petorreta + lease + seal + consume per a qualsevol mutació.
- No introduir noves dependències.
- No Tailwind al core.
- Baseline 2022 (Safari/iOS 16, Chrome 100) com a sòl.
- Tots els generators han de passar per la canonada (no `fs.writeFile` directe).

### 5. Pla d’acció recomanat (ordre d’execució)

1. Extreure i estabilitzar el contingut legal → `legalContent.js` + actualització de `TextSection` / ruta.
2. Verificar que la pàgina legal renderitza correctament i passa SEO + a11y bàsic.
3. Reduir pes de `pageContent.js` + `i18n.js` + `index.css` (divisió + purge).
4. Afegir test de fum de la ruta legal.
5. Revisar un cop el deute de frontmatter i els tractors (ja estan en bon estat).

### 6. Veredicte

El sistema és sòlid en governança (Petorreta, gates, Online-First, Trellat) i en la frontera d’autenticació. El punt feble actual és el **contingut monolític** (especialment la pàgina legal enterrada dins `pageContent.js`) i el pes de CSS/i18n. 

La correcció de la pàgina legal és de baixa complexitat i alt impacte: separar el mòdul legal, alinear-lo amb la llei de privacitat i amb les rutes, i garantir que no depengui de claus i18n fràgils.

Cap canvi estructural profund és necessari ara mateix. Prioritzar la separació del contingut legal i la reducció de pes del bundle inicial.
