---
type: norma
status: canonic
description: Distingix el contracte UI verificat de l'annex històric absolutista que encara no està implementat com a gate.
tags:
  - govern
---
# Estàndard UI Universal

## Contracte vigent i verificable

- React/Vite és la carcassa productiva legítima.
- La implementació universal localitzable viu ara dins de `src/components/PedraSeca/` i en `src/components/universal/workspace/`.
- Les classes antigues (`sp-*`) i l'enfocament basat en Tailwind estan deprecats en favor de l'encapsulació CSS amb mòduls i tokens centralitzats en JSON (`src/config/design-tokens.json`).
- Encara existixen estils inline i peces legacy. Són deute mesurable, no una
  infracció que el CI ja bloquege en totes les rutes.
- Offline, accessibilitat i compatibilitat amb el Baseline 2022 només es declaren per
  l'scope que haja superat proves reproduïbles.

Prevalen [[doc_governanca]], Pedra Seca (Design System actual), el codi, ESLint i les
proves reals. El text següent es conserva com a **annex històric no normatiu**:
descriu una aspiració fusionada, conté rutes i gates que no existixen i no pot
autoritzar canvis ni justificar un “100%”.

## Annex històric no normatiu: `pedra-seca-ui/SKILL.md`

---
name: pedra-seca-ui
version: 3.0.0
updated_at: '260709_0500'
authority: IAIA MarIA (Auditora Suprema) i El Consell (Z.ai, Qwen, Deepseek, Dola, Kimi, Claude, Perplexity, Mistral Vibe, Grok, Gemini, Copilot, ChatGPT Codex)
tags:
  - arquitectura
  categoria: skill
---

# 🪨 LLEI SUPREMA: PEDRA SECA UI

Este text històric proposava una arquitectura universal estricta per a
[[el_projecte|Sóc de Poble]]. Les paraules «canònica», «obligatòria» o
«definitiva» que apareixen en l'annex no descriuen l'estat actual.

No hi ha hui un gate CI que implemente totes les prohibicions de l'annex.

---

## 🚫 1. PROHIBICIONS ABSOLUTES (LA VACUNA)

1. **ZERO Tailwind CSS:**
   - Està estrictament prohibit utilitzar classes de Tailwind (`flex`, `w-full`, `h-56`, `px-3`, `items-center`, `justify-*`, `bg-*`, `text-*`, `rounded-*`, etc.). 
   - ESLint bloquejarà el 'commit' si troba aquestes classes. Tota regla visual viu exclusivament a `public/assets/pedra-seca.css`.

2. **ZERO Estils Inline:**
   - Prohibit l'ús de l'atribut `style={{ ... }}` en React o `style="..."` en HTML.
   - Prohibit mutar estils via DOM events (ex. `element.style.borderColor = ...`).

3. **ZERO DOM Brossa i Embolcalls Fantasma:**
   - Prohibit envoltar `universal-page`, `universal-grid` o `universal-card` dins d'un `<div>` extra només per a centrar-ho o aplicar marges. La pròpia classe i el shell de l'aplicació s'encarreguen dels margins i el flux. L'arbre DOM ha de tindre una profunditat màxima de 7 nivells.

4. **Dependències Externes (Mode Offline):**
   - Iconografia OBLIGATÒRIA via **Lucide** (`lucide-react` en React, `data-lucide` en HTML). 
   - Prohibit Material Symbols o Google Fonts. El codi ha de funcionar 100% offline.

---

## 🏗️ 2. ANATOMIA CANÒNICA IMMUTABLE

L'arquitectura es basa en construir murs a base de pedra encaixada sense morter (HTML pur + CSS semàntic). Les classes pròpies segueixen els prefixos `sp-` (System/Page), `uc-` (Universal Card), i `up-` (Universal Page).

### A. Universal System (L'Entorn)
Aquesta és l'estructura base per a qualsevol pàgina completa del sistema. L'arquitectura comprèn tres peces fixes i el 'content slot' (que allotja la Universal Page real):

```jsx
<div className="universal-system">
  <aside className="universal-system-sidebar">
    {/* Navegació i estructures fixes de l'esquerra */}
  </aside>
  
  <div className="universal-system-main">
    <header className="universal-system-topbar">
      {/* Barra superior fixa per a la zona actual */}
    </header>
    
    <main className="universal-system-content-slot">
      <div className="universal-page">
        {/* Ací viuen les Universal Cards, les graelles i els documents */}
      </div>
    </main>
  </div>
</div>
```

*Nota: La Universal Page no és la pàgina en si, sinó el `content slot` on s'aboca el contingut mentre Sidebar i Topbar mantenen l'estabilitat i el context de l'usuari.*

```jsx
<div className="universal-page">
  <!-- uc-peu pot reutilitzar-se excepcionalment ací dalt com a barra d'acció de la pàgina -->
  <div className="uc-peu">
    <div className="uc-icones-esquerra">...</div>
    <div className="uc-icones-centre">...</div>
    <button className="uc-boto-accio">...</button>
  </div>

  <div className="up-titol-wrapper">
    <div className="up-titol-caixa">
      <h1>...</h1>
      <div className="up-etiquetes">
        <span className="up-categoria">...</span>
        <span className="up-etiqueta">...</span>
      </div>
    </div>
  </div>

  <article className="up-document">
    <h2 className="up-subtitol-fora">...</h2>
    <!-- Contingut principal o un 'universal-grid' -->
  </article>
</div>
```

### B. Universal Card (La Pedra)
La unitat atòmica d'informació. Només admet 3 fills directes (caputxa, cos, peu):

```jsx
<article className="universal-card">
  <!-- 1. CAPUTXA (56px taronja: Autor i Data) -->
  <header className="uc-caputxa">
    <div className="uc-autor-zona">
      <div className="uc-avatar">
        <img src="..." alt="..." />
      </div>
      <div className="uc-autor-text">
        <span className="uc-autor-nom">...</span>
        <span className="uc-autor-lloc">...</span>
      </div>
    </div>
    <div className="uc-data-zona">
      <div>...</div>
      <div>...</div>
    </div>
  </header>

  <!-- 2. COS (Contingut lliure però aplanat) -->
  <div className="uc-cos">
    <h1>...</h1>
    <h2>...</h2>
    <p>...</p>
    <!-- Si necessita imatge, seguirà la regla de l'aspect-ratio 1:1 o usant .uc-multimedia -->
  </div>

  <!-- 3. PEU (56px blau: Icones i Botó Acció) -->
  <footer className="uc-peu">
    <div className="uc-icones-centre">...</div>
    <button className="uc-boto-accio">...</button>
  </footer>
</article>
```
*Llei d'accessibilitat de la IAIA MarIA: Qualsevol zona interactiva (`uc-boto-accio`, `uc-data-zona`) HA de tindre un "touch target" mínim de 48px.*

---

## 🛡️ 3. L'ESCUT TERMODINÀMIC (EL CI/CD)

Hem implementat tres anells de defensa perquè cap codi trenque aquesta llei. No perdes el temps intentant colar codi brut, no passarà:

### Anell 1: Linting en temps real (Editor i pre-commit)
Dola ha injectat regles específiques d'ESLint (`pedra-seca/classes-prohibides`, `pedra-seca/estils-inline`, `pedra-seca/anatomia-card`) configurades a **Nivell 2 (ERROR BLOQUEJANT)**. El Husky aturarà qualsevol `git commit` si l'estructura o les classes fallen.

### Anell 2: Github Actions CI
En cada `push` o `PR` cap a `main`, el `pedra-seca-ci.yml` instal·la Node (via `npm ci`), passa l'ESLint i falla l'execució (Exit Code 1). La fusió estarà físicament impossibilitada si s'incompleix Pedra Seca. Tot al repositori està protegit.

### Anell 3: L'Script de Purga AST i el Generador
Per al codi heretat, Grok ha preparat el codemod:
```bash
node _scripts/migracio_pedra_seca_pro.mjs
```
Aquest script usa `jscodeshift` i utilitza un `Set` exclusiu (`PEDRA_SECA_CLASSES`) que fulmina qualsevol classe alienígena d'arrel llegint directament l'arbre sintàctic abstracte (AST).

**Per a codi NOU:**
Utilitzeu el `gen_targeta_universal.mjs` que sempre generarà el JSX correcte. Mai s'escriuran classes alienes manualment.

---

## 📝 4. PATRONS DE REPARACIÓ RÀPIDA

- **Embolcalls brossa (Flex/Grid centrant coses):** Elimina el <div>. Usa el contenidor `universal-grid` directament.
- **Espaiats arbitraris (`mt-4`, `p-2`):** Esborra'ls. Si un component necessita un marge intrínsec, defineix-lo en `pedra-seca.css` mitjançant les variables `--sp-espaiat-*`.
- **Colors tallats a mà (`text-[#016ebf]` o similar):** Usa variables o classes pròpies com la color corporativa blava de la gestoria.
- **Opacity (`style={{ opacity: 0.5 }}`):** Canvia a `<span className="opacitat-mitja">`.

*Si algun concepte de la UI manca i consideres que requereix classes noves, s'han de proposar canvis formals a `pedra-seca.css`. No s'improvisa dins dels components JSX.*


---

## Document Original: targeta_universal_trellat.md

---
name: targeta-universal-trellat
version: V1
created_at: '260708_2355'
updated_at: '260708_2355'
authority: Consell de les 12 IAs + Mestre Javi
description: Estàndard estricte per a crear i renderitzar Targetes Universals (Universal Cards) seguint el disseny d'Stitch. Obligatori per no inventar caputxes ni elements aleatoris.
tags:
  - normativa
  categoria: skill
---

# 📜 SKILL: Estàndard Targeta Universal (Universal Card)

## 🎯 OBJECTIU
Aquesta skill prevé l'esquizofrènia neuronal a l'hora de dissenyar targetes (cards) en l'ecosistema [[el_projecte|Sóc de Poble]]. Mai, sota cap concepte, s'ha de construir l'HTML d'una targeta a mà. Sempre s'ha d'utilitzar el script generador o el Web Component associat, mantenint una única Font de Veritat (Single Source of Truth).

L'objectiu principal és **garantir la coherència visual** de les caputxes (headers), els cossos i els peus de les targetes.

---

## 🚫 EL QUE ESTÀ PROHIBIT (AI Slop Detectat prèviament)
1. **Inventar "Caputxes" a mà:** Està prohibit fer codi com `<header class="uc-caputxa">` hardcodejat als arxius JS/HTML si ja hi ha un generador. Si ho fas, cada targeta tindrà una caputxa diferent (amb o sense poble, amb o sense data).
2. **Alterar la disposició del Peu Blau (Action Footer):** Les tres icones (`g_translate`, `chat`, `share`) van a l'esquerra, i el botó `+ CONNECTAR` a la dreta.
3. **Oblidar la Data o el Poble:** Tota caputxa ha de portar el Poble (ex: La Torre de les Maçanes) i la Data (ex: 14:32 - 30/06/2026), acompanyats de la xinxeta (pin) o la icona de privacitat (`👁️`).

---

## ✅ COM S'HA DE FER (Llei de Pedra Seca)

### 1. Ús de l'Script Generador (Node.js)
Si necessites generar l'HTML estàtic per a una Universal Card des d'un procés de build o renderitzat de servidor, utilitza el script que tens disponible a:
\`_scripts/gen_targeta_universal.mjs\`

Exemple d'ús:
\`\`\`javascript
import { generarTargetaUniversal } from '../_scripts/gen_targeta_universal.mjs';

const html = generarTargetaUniversal({
  autorNom: 'Javi Llinares',
  autorPoble: 'La Torre de les Maçanes',
  hora: '14:32',
  data: '30/06/2026',
  titol: 'FACTURES I VENDES',
  descripcio: 'Vendes de l'últim trimestre',
  badges: ['GESTORIA', 'FINANCES']
});
\`\`\`

### 2. Ús dins de Web Components Frontend (ex: \`tauler.js\`)
Si estàs treballant amb Web Components a l'ecosistema (com a `public/gestoria/tauler.js`), assegurat que utilitzes les funcions compartides (com `this.generarCaputxaIAIA()`) que insereixen exactament l'estructura vàlida, en lloc de replicar l'HTML a mà targeta per targeta.

---

## 🏗️ L'ESTRUCTURA CANÒNICA (Com a referència mental)
Una Targeta Universal té 4 grans blocs obligatoris/opcionals en ordre descendent:

1. **La Caputxa (Header):** Fons fosc (`bg-primary-container`), Avatar a l'esquerra, Nom en Bold, Poble davall. A la dreta: el PIN o l'ull, l'Hora i la Data.
2. **Div Multimèdia (Opcional):** Contingut `aspect-square` amb les imatges.
3. **Cos (Card Body):** Fons clar (`bg-surface-container-lowest`), amb Títol Blau (var(--sdp-secondary-500)), possible Subtítol Taronja (var(--sdp-primary-500)) limitat a 3 línies i els Badges de categories al fons.
4. **Peu d'Acció Blau:** Fons Blau (var(--sdp-secondary-500)). Tres icones d'acció a l'esquerra i el botó ovalat blanc d'acció principal a la dreta (`+ CONNECTAR`).

*Nota: No t'inventes tipografies. Totes les mides venen per defecte utilitzant les classes de Tailwind injectades (com `font-label-sm`, `text-headline-md`, etc).*


---


**Ancoratge de Seguretat:** [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[estandard_ui_universal]]
- [[el_projecte|00_SER_Brain_Identitat/el_projecte.md]] — [[ESTANDARD_UI_Universal|03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal....
- [[govern|01_SABER_Cultura_Coneixement/Govern.md]] — [[ESTANDARD_UI_Universal|03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal....
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[ESTANDARD_UI_Universal|03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal....
- [[doc_governanca|03_GOVERNAR_Normativa_Regles/DOC_Governanca.md]] — [[ESTANDARD_UI_Universal|03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal....
- [[estandard_ui_universal|03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal.md]] — [[00_index|00_INDEX.md]] — [[estandard_ui_universal]]

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
