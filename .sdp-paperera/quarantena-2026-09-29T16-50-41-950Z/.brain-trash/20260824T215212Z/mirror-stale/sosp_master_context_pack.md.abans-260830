---
estat: generat
tipus: document
description: Vista generada des de .agents/sosp_master_context_pack.md; no editar.
source: .agents/sosp_master_context_pack.md
source_sha256: 1456d8598644317fa943203fbd12febaf3db214e85d4ef5e920ab538f61771fc
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/sosp_master_context_pack.md`. Qualsevol edició manual serà sobreescrita.

# SÓC DE POBLE - CONTEXT PACK CANÒNIC

## [FILE: package.json]
```
{
  "name": "socdepoble-react",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/pedraseca.umd.cjs",
  "module": "dist/pedraseca.js",
  "exports": {
    ".": {
      "import": "./dist/pedraseca.js",
      "require": "./dist/pedraseca.umd.cjs"
    }
  },
  "sideEffects": [
    "*.css",
    "src/PedraSecaEmbed.jsx",
    "src/main.jsx"
  ],
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3340 --strictPort",
    "porta:manual": "node tooling/gates/tractor-manual.mjs",
    "porta:consell": "node tooling/gates/tractor-consell.mjs",
    "porta": "npm run porta:manual && npm run porta:consell",
    "build": "npm run porta && npm run build:seo && npm run build:web && npm run build:wp",
    "build:seo": "node scripts/build-seo-routes.mjs",
    "build:web": "vite build",
    "build:wp": "vite build -c vite.standalone.config.js && mkdir -p wordpress-plugin/assets/fonts wordpress-plugin/assets/img && cp -r src/assets/fonts/* wordpress-plugin/assets/fonts/ && cp -r assets/img/* wordpress-plugin/assets/img/",
    "prepare": "husky",
    "time-machine": "sh tooling/gates/estela.sh",
    "preview": "vite preview --host 0.0.0.0",
    "db:seed:generate": "sh scripts/generate-supabase-seed.sh",
    "brain:maintain": "sh tooling/brain/maintain.sh .",
    "brain:audit": "python3 tooling/brain/brain_audit.py . --policy tooling/brain/brain_policy.json",
    "brain:distill": "python3 tooling/brain/brain_distill.py",
    "pdf:render": "sh tooling/pdf/render_pdf.sh",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "dompurify": "^3.4.14",
    "lucide-react": "^0.562.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "react-router-dom": ">=6.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.5",
    "@testing-library/react": "^16.3.2",
    "@vitejs/plugin-react": "^5.1.1",
    "css": "^3.0.0",
    "eslint": "^9.39.5",
    "eslint-plugin-react": "^7.37.5",
    "globals": "^17.9.0",
    "husky": "^9.1.7",
    "jsdom": "^29.1.1",
    "knip": "^6.32.2",
    "lint-staged": "^17.3.0",
    "postcss-prefix-selector": "^2.1.0",
    "puppeteer": "^25.5.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.12.0",
    "vite": "^7.1.0",
    "vite-plugin-pwa": "^1.3.0",
    "vitest": "^4.1.10"
  }
}

```

## [FILE: vite.config.js]
```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sóc de Poble',
        short_name: 'SdP',
        theme_color: '#fbfaf8',
        icons: [
          {
            src: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3340,
    strictPort: true,
    watch: {
      ignored: ['**/.agents/**', '**/_wiki_de_poble/**', '**/.gemini/**', '**/scripts/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true
  }
});

```

## [FILE: src/css/index.css]
```
/* ── TIPOGRAFIA · allotjada en local ───────────────────────────────
   Noto Sans · SIL Open Font License 1.1 · redistribució permesa.
   Descàrrega dels fitxers (una sola vegada, mai en temps d'execució):
     https://fonts.google.com/noto/specimen/Noto+Sans  →  «Get font»
   Subconjunt recomanat per a valencià/català (redueix ~70% el pes):
     pyftsubset NotoSans.ttf --unicodes="U+0000-00FF,U+0100-017F,U+0192,\
       U+01FA-01FF,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,\
       U+00B7,U+20AC" --flavor=woff2 --output-file=noto-sans-400.woff2
   Col·loca'ls a  assets/fonts/  amb estos noms exactes.
   ───────────────────────────────────────────────────────────────── */
/* L'import s'ha mogut fora de React */
@import './legacy-components.css';
/* ═══════════════════════════════════════════════════════════════════
   PEDRA SECA · Full d'estils base — v2.0
   Sóc de Poble · CSS natiu, sense frameworks (substitueix el base)
   ─────────────────────────────────────────────────────────────────────
   ARQUITECTURA
   0. Tokens de disseny (:root)  — nous --sdp-*, àlies legat --sp-*
   1. Reset i base global        — scroll delegat, sense rubber-band
   2. Esquelet de l'app          — 3 columnes: sidebar · llista · visor
   3. Columna 1: Sidebar (La Roca)
   4. Columna 2: Llista contextual (opcional, l'app real la injecta)
   5. Columna 3: Visor — barres negra/blava/taronja, hero, títol
   6. Contingut editorial (content-wrapper, design-block, CMS)
   7. Components (botons, formularis, alertes, taules, targetes…)
   8. FAB
   9. Utilitats sdp-*
   10. Responsive — breakpoint mestre 1100px + afinats 720px / 480px
   11. Accessibilitat i moviment reduït
   ─────────────────────────────────────────────────────────────────────
   REGLA D'OR: el <body> NO fa scroll (overflow:hidden). Cada columna
   gestiona el seu propi overflow-y — això elimina el rubber-band de
   Safari/iOS i manté les barres sticky dins del visor.
   ═══════════════════════════════════════════════════════════════════ */

/* ── 0. TOKENS ─────────────────────────────────────────────────────
   DOS CAPES. Esta separació és la llei del sistema.

   CAPA 1 · PRIMITIUS  — la paleta física. Generada en OKLCH amb to i
            croma de marca constants; només varia la lluminositat.
            NO s'usen mai directament als components.
   CAPA 2 · SEMÀNTICS  — el significat. És l'ÚNICA capa que toquen els
            components, l'única que canvia el tema fosc i l'única
            superfície que exposarà el tauler de control.

   Regla mecànica: si un component escriu var(--sdp-pedra-*),
   var(--sdp-primary-*) o var(--sdp-secondary-*), és un error.
   ───────────────────────────────────────────────────────────────── */

:host, .sdp-root {
  all: initial;
}

:root, :host, .sdp-root {
  /* ═══ CAPA 1 · PRIMITIUS ═══════════════════════════════════════ */

  /* Pedra · neutre càlid — OKLCH H 84°, croma baix */
  --sdp-blanc-pur: oklch(100% 0 0);
  --sdp-negre-pur: oklch(0% 0 0);
  --sdp-blanc: #ffffff;
  --sdp-negre: #000000;
  --sdp-pedra-50:  #fdfcfb;
  --sdp-pedra-100: #f9f8f5;
  --sdp-pedra-200: #efece7;
  --sdp-pedra-300: #dcd7cd;
  --sdp-pedra-400: #b7b1a5;
  --sdp-pedra-500: #8b857b;
  --sdp-pedra-600: #514c45;
  --sdp-pedra-700: #3d3b35;
  --sdp-pedra-750: #302e29;
  --sdp-pedra-800: #22211e;
  --sdp-pedra-850: #181715;
  --sdp-pedra-900: #0e0d0c;

  /* Primari · taronja de terra — OKLCH H 47.9° (to exacte del cànon #FF7300) */
  --sdp-primary-50:  #fff4ef;
  --sdp-primary-100: #ffe7dc;
  --sdp-primary-200: #ffd1bb;
  --sdp-primary-300: #ffb38c;
  --sdp-primary-400: #ff955b;
  --sdp-primary-500: #fe7406;   /* el cànon. Només com a FONS. */
  --sdp-primary-600: #dd6302;
  --sdp-primary-700: #ad4c03;   /* Taronja fort · text i fons massís d'accent */
  --sdp-primary-800: #873a01;   /* text accent · 7,97:1 · AAA */
  --sdp-primary-900: #602701;

  /* Secundari · blau de mar — OKLCH H 250.6° (to exacte del cànon #0984E3) */
  --sdp-secondary-50:  #f1f8ff;
  --sdp-secondary-100: #e0efff;
  --sdp-secondary-200: #c3e0ff;
  --sdp-secondary-300: #96c9ff;
  --sdp-secondary-400: #49a3fa;
  --sdp-secondary-500: #016ebf;   /* fons · text blanc 5,23:1 · AA */
  --sdp-secondary-600: #00599d; /* Blau fort · text i fons massís d'acció */
  --sdp-secondary-700: #004983;
  --sdp-secondary-800: #003663;
  --sdp-secondary-900: #002546;

  /* Estat */
  --sdp-error-500: #c2181d;  --sdp-error-50: #ffedeb;  --sdp-error-700: #92000c;
  --sdp-avis-500:  #9c6902;  --sdp-avis-50:  #fff1df;  --sdp-avis-700:  #6e4901;
  --sdp-exit-500:  #027e38;  --sdp-exit-50:  #e4f8e7;  --sdp-exit-700:  #005c27;

  /* ═══ CAPA 2 · SEMÀNTICS · TEMA CLAR ═══════════════════════════
     Cada línia porta el contrast mesurat i el nivell que compleix.  */

  /* Fons */
  --sdp-fons-app:        var(--sdp-pedra-100);
  --sdp-fons-targeta:    var(--sdp-blanc-pur);
  --sdp-fons-elevat:     var(--sdp-blanc-pur);
  --sdp-fons-superficie: var(--sdp-blanc-pur);
  
  /* Estructura de marca: no canvia amb el tema */
  --sdp-fons-roca:       var(--sdp-pedra-900);
  --sdp-sobre-roca:      var(--sdp-pedra-50);
  --sdp-fons-subtil:     var(--sdp-pedra-200);
  --sdp-fons-invers:     var(--sdp-pedra-900);
  --sdp-fons-vel:        rgba(14, 13, 12, 0.55);
  --sdp-color-focus:     var(--sdp-secondary-500);

  /* Text — TOT compleix AAA (≥7:1) sobre la seua superfície */
  --sdp-text-titol:  var(--sdp-pedra-900);   /* 19,42:1 */
  --sdp-text-cos:    var(--sdp-pedra-700);   /* 11,20:1 */
  --sdp-text-suau:   var(--sdp-pedra-600);   /*  7,24:1 */
  --sdp-text-invers: var(--sdp-pedra-50);
  --sdp-text-desactivat: var(--sdp-pedra-500);  /* només controls inactius (exempts WCAG) */

  /* Vores */
  --sdp-vora:         var(--sdp-pedra-300);   /* decorativa */
  --sdp-vora-control: var(--sdp-pedra-500);   /* 3,66:1 · WCAG 1.4.11 */
  --sdp-vora-forta:   var(--sdp-pedra-600);

  /* Accent · taronja — identitat de marca */
  --sdp-accent:            var(--sdp-primary-500);
  --sdp-accent-hover:      var(--sdp-primary-600);
  --sdp-accent-subtil:     var(--sdp-primary-50);
  --sdp-sobre-accent:      var(--sdp-pedra-900);    /*  7,13:1 · AAA */
  --sdp-accent-text:       var(--sdp-primary-700);  /*  5,51:1 · AA  (interacció) */
  --sdp-accent-text-hover: var(--sdp-primary-800);  /*  7,97:1 · AAA */
  --sdp-accent-titol:      var(--sdp-primary-700);  /*  5,51:1 · AA (h2, h4) */

  /* Acció · blau */
  --sdp-accio:         var(--sdp-secondary-500);
  --sdp-accio-hover:   var(--sdp-secondary-700);
  --sdp-accio-forta:   var(--sdp-secondary-700);
  --sdp-accio-subtil:  var(--sdp-secondary-50);
  --sdp-sobre-accio:   #ffffff;                  /*  5,23:1 · AA */
  --sdp-accio-text:    var(--sdp-secondary-700); /*  7,20:1 · AAA (h1, h3, h5) */
  --sdp-focus:         var(--sdp-secondary-700);
  --sdp-focus-invers:  var(--sdp-primary-400);

  /* Estat semàntic */
  --sdp-error: var(--sdp-error-500);  --sdp-error-fons: var(--sdp-error-50);  --sdp-error-text: var(--sdp-error-700);
  --sdp-avis:  var(--sdp-avis-500);   --sdp-avis-fons:  var(--sdp-avis-50);   --sdp-avis-text:  var(--sdp-avis-700);
  --sdp-exit:  var(--sdp-exit-500);   --sdp-exit-fons:  var(--sdp-exit-50);   --sdp-exit-text:  var(--sdp-exit-700);
  --sdp-info:  var(--sdp-secondary-500); --sdp-info-fons: var(--sdp-secondary-50); --sdp-info-text: var(--sdp-secondary-700);

  /* ═══ MÈTRIQUES, MOVIMENT, TIPOGRAFIA ═════════════════════════ */

  /* Radis */
  --sdp-radi-s: 8px;
  --sdp-radi-m: 12px;
  --sdp-radi-g: 16px;
  --sdp-radi-xl: 24px;
  --sdp-radi-pastilla: 999px;

  /* Ombres · to pedra, mai negre pur */
  --sdp-ombra-1: 0 1px 3px rgba(14, 13, 12, 0.05);
  --sdp-ombra-2: 0 3px 10px rgba(14, 13, 12, 0.07);
  --sdp-ombra-3: 0 10px 28px rgba(14, 13, 12, 0.10);
  --sdp-ombra-4: 0 18px 44px rgba(14, 13, 12, 0.16);

  /* Moviment */
  --sdp-t: 0.18s ease;
  --sdp-t-lenta: 0.3s cubic-bezier(0.2, 0.7, 0.3, 1);

  /* Mètriques del layout */
  --sdp-ctrl-vw: clamp(320px, 100vw, 1024px);
  --sdp-ctrl-scale: calc((var(--sdp-ctrl-vw) - 320px) / (1024 - 320));
  --sdp-step-0: calc(14px + (16 - 14) * var(--sdp-ctrl-scale));
  --sdp-space-base: var(--sdp-step-0);

  --sdp-col-sidebar: 260px;
  --sdp-col-llista: 380px;
  --sdp-alt-negra: 64px;
  --sdp-alt-accio: 58px;
  --sdp-alt-barres: calc(var(--sdp-alt-negra) + var(--sdp-alt-accio) * 2);  /* 180px · pila sticky */
  --sdp-alt-nav-mobil: 96px;                 /* nav inferior + separació */
  --sdp-pad-contenidor: clamp(16px, 4vw, 40px);

  /* LLEI DE VIDA · objectiu tàctil mínim. Cap control per davall. */
  --sdp-touch: 44px;
  --sdp-touch-comode: 48px;

  /* Escala z-index · única font de veritat */
  --z-barra-taronja: 99080;
  --z-barra-blava: 99090;
  --z-barra-negra: 99100;
  --z-sidebar: 99200;
  --z-fab: 99500;
  --z-nav-mobil: 99950;
  --z-vel: 99960;
  --z-calaix: 99990;

  /* Tipografia */
  --sdp-font: 'Noto Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --sdp-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --sdp-text-h1: 2.5rem;
  --sdp-text-h2: 2rem;
  --sdp-text-h3: 1.75rem;
  --sdp-text-h4: 1.5rem;
  --sdp-text-h5: 1.25rem;
  --sdp-text-h6: 1.125rem;
  --sdp-text-lead: 1.25rem;
  --sdp-text-base: 1.125rem;
  --sdp-text-small: 1rem;
  --sdp-text-meta: 0.875rem;   /* 14px · sòl absolut de mida de lletra */

  --sdp-leading-tight: 1.15;
  --sdp-leading-snug: 1.21;
  --sdp-leading-body: 1.65;

  /* Escala d'espaiat modular · base 4/8 */
  --sdp-space-0: 0px;   --sdp-space-1: 4px;   --sdp-space-2: 8px;
  --sdp-space-3: 12px;  --sdp-space-4: 16px;  --sdp-space-5: 20px;
  --sdp-space-6: 24px;  --sdp-space-8: 32px;  --sdp-space-10: 40px;
  --sdp-space-12: 48px; --sdp-space-16: 64px; --sdp-space-20: 80px;

  /* ── RITME VERTICAL EDITORIAL ── */
  --sdp-measure: 68ch;                 /* mesura de columna · APLICADA */
  --sdp-leading-editorial: 1.65;
  --sdp-leading-display: 1.15;
  --sdp-mt-h1: 0;    --sdp-mb-h1: 16px;
  --sdp-mt-h2: 48px; --sdp-mb-h2: 12px;   /* corregit: h2 domina h3 */
  --sdp-mt-h3: 40px; --sdp-mb-h3: 12px;
  --sdp-mt-h4: 32px; --sdp-mb-h4: 8px;
  --sdp-mt-h5: 24px; --sdp-mb-h5: 6px;
  --sdp-mt-h6: 20px; --sdp-mb-h6: 6px;
  --sdp-mb-lead: 24px;
  --sdp-mb-p: 20px;
  --sdp-mb-ul: 20px;
  --sdp-li-gap: 8px;
  --sdp-bq-indent: 24px;

  accent-color: var(--sdp-accio);
  color-scheme: light;
}

/* ═══ CAPA 2 · SEMÀNTICS · TEMA FOSC ═══════════════════════════════
   Un sol bloc. Redefinix NOMÉS semàntics: els primitius no es toquen
   mai, per això l'escala pedra continua sent monòtona i res no es
   torna invisible.

   La resolució de la preferència del sistema la fa el script mínim
   del <head>, que escriu data-theme a l'<html> abans del primer
   pintat. Per això ACÍ NO hi ha cap @media (prefers-color-scheme):
   duplicar-lo seria dos fonts de veritat per al mateix fet.

   IDENTITAT ESTABLE: el taronja continua sent el taronja i el blau
   continua sent el blau. Vegeu la nota D-4 de l'informe.
   ───────────────────────────────────────────────────────────────── */

:root[data-theme="dark"], :host([data-theme="dark"]) {
  color-scheme: dark;

  --sdp-fons-app:        var(--sdp-pedra-900);
  --sdp-fons-targeta:    var(--sdp-pedra-850);
  --sdp-fons-elevat:     var(--sdp-pedra-800);
  --sdp-fons-superficie: var(--sdp-pedra-850);
  --sdp-fons-subtil:     var(--sdp-pedra-750);
  --sdp-fons-invers:     var(--sdp-pedra-100);
  --sdp-fons-vel:        rgba(14, 13, 12, 0.72);

  --sdp-text-titol:  var(--sdp-pedra-50);    /* 17,48:1 */
  --sdp-text-cos:    var(--sdp-pedra-200);   /* 15,20:1 */
  --sdp-text-suau:   var(--sdp-pedra-300);   /* 12,44:1 */
  --sdp-text-invers: var(--sdp-pedra-900);
  --sdp-text-desactivat: var(--sdp-pedra-500);

  --sdp-vora:         var(--sdp-pedra-750);
  --sdp-vora-control: var(--sdp-pedra-500);  /*  4,90:1 */
  --sdp-vora-forta:   var(--sdp-pedra-400);

  --sdp-accent:            var(--sdp-primary-500);
  --sdp-accent-hover:      var(--sdp-primary-400);
  --sdp-accent-subtil:     var(--sdp-primary-900);
  --sdp-sobre-accent:      var(--sdp-pedra-900);   /*  7,13:1 */
  --sdp-accent-text:       var(--sdp-primary-400); /*  8,24:1 */
  --sdp-accent-text-hover: var(--sdp-primary-300); /* 10,26:1 */
  --sdp-accent-titol:      var(--sdp-primary-300); /* 10,26:1 */

  --sdp-accio:         var(--sdp-secondary-500);
  --sdp-accio-hover:   var(--sdp-secondary-400);
  --sdp-accio-forta:   var(--sdp-secondary-600);
  --sdp-accio-subtil:  var(--sdp-secondary-900);
  --sdp-sobre-accio:   #ffffff;
  --sdp-accio-text:    var(--sdp-secondary-300);   /* 10,28:1 */
  --sdp-focus:         var(--sdp-focus-invers);
  --sdp-focus-invers:  var(--sdp-primary-400);

  --sdp-error-fons: #2a0f11; --sdp-error-text: #ffb3b0;
  --sdp-avis-fons:  #2a1e05; --sdp-avis-text:  #f5c96b;
  --sdp-exit-fons:  #052213; --sdp-exit-text:  #86dfa4;
  --sdp-info-fons:  #041f33; --sdp-info-text:  var(--sdp-secondary-300);

  --sdp-ombra-1: 0 1px 3px rgba(0, 0, 0, 0.45);
  --sdp-ombra-2: 0 3px 10px rgba(0, 0, 0, 0.55);
  --sdp-ombra-3: 0 10px 28px rgba(0, 0, 0, 0.62);
  --sdp-ombra-4: 0 18px 44px rgba(0, 0, 0, 0.72);
}


/* ── 1. RESET I BASE ───────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  height: 100%;
  overscroll-behavior: none;           /* mata el rubber-band global */
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--sdp-font);
  line-height: 1.5;
  background: var(--sdp-fons-app);
  color: var(--sdp-text-titol);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

:host {
  display: block;
  width: 100%;
  height: 100dvh;
  min-width: 0;
  min-height: 0;
  font-family: var(--sdp-font);
  line-height: 1.5;
  background: var(--sdp-fons-app);
  color: var(--sdp-text-titol);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.sdp-root {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  overscroll-behavior: none;
}

img { max-width: 100%; }
button, input, select, textarea { font: inherit; }
/* ═══════════════════════════════════════════════════════════════
   TIPOGRAFIA EDITORIAL · TRELLAT PUR
   Regles globals — ÚNICA FONT DE VERITAT.
   Cap element de text necessita cap div embolcall ni estil inline.
   El ritme vertical és implacable per cascada.
   ═══════════════════════════════════════════════════════════════ */
h1, .h1, h2, .h2, h3, .h3, h4, .h4, h5, .h5, h6, .h6 {
  font-family: var(--sdp-font);
  color: var(--sdp-text-titol);
  text-wrap: balance;
  margin: 0;
  padding: 0;
  text-transform: none;
}
h1, .h1 {
  font-size: var(--sdp-text-h1);
  line-height: var(--sdp-leading-display);
  font-weight: 800;
  color: var(--sdp-accio-text);
  text-align: center;
  margin-top: var(--sdp-mt-h1);
  margin-bottom: var(--sdp-mb-h1);
  letter-spacing: -0.01em;
}
h2, .h2 {
  font-size: var(--sdp-text-h2);
  line-height: var(--sdp-leading-snug);
  font-weight: 800;
  color: var(--sdp-accent-titol);
  text-align: center;
  margin-top: var(--sdp-mt-h2);
  margin-bottom: var(--sdp-mb-h2);
  letter-spacing: -0.005em;
}
h3, .h3 {
  font-size: var(--sdp-text-h3);
  line-height: var(--sdp-leading-snug);
  font-weight: 700;
  color: var(--sdp-accio-text);
  text-align: left;
  margin-top: var(--sdp-mt-h3);
  margin-bottom: var(--sdp-mb-h3);
}
h4, .h4 {
  font-size: var(--sdp-text-h4);
  line-height: var(--sdp-leading-snug);
  font-weight: 700;
  color: var(--sdp-accent-titol);
  text-align: left;
  margin-top: var(--sdp-mt-h4);
  margin-bottom: var(--sdp-mb-h4);
}
h5, .h5 {
  font-size: var(--sdp-text-h5);
  line-height: var(--sdp-leading-editorial);
  font-weight: 700;
  color: var(--sdp-accio-text);
  text-align: left;
  margin-top: var(--sdp-mt-h5);
  margin-bottom: var(--sdp-mb-h5);
}
h6, .h6 {
  font-size: var(--sdp-text-h6);
  line-height: var(--sdp-leading-editorial);
  font-weight: 700;
  color: var(--sdp-text-suau);
  text-align: left;
  margin-top: var(--sdp-mt-h6);
  margin-bottom: var(--sdp-mb-h6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
p {
  font-size: var(--sdp-text-base);
  line-height: var(--sdp-leading-editorial);
  color: var(--sdp-text-cos);
  margin-top: 0;
  margin-bottom: var(--sdp-mb-p);
  hyphens: auto;
}
.lead {
  font-size: var(--sdp-text-lead);
  line-height: 1.5;
  font-weight: 600;
  color: var(--sdp-text-suau);
  text-align: center;
  margin-top: 0;
  margin-bottom: var(--sdp-mb-lead);
}
/* ── LLISTES PURES (sense divs embolcall) ── */
ul, ol {
  font-size: var(--sdp-text-base);
  line-height: var(--sdp-leading-editorial);
  color: var(--sdp-text-cos);
  margin-top: 0;
  margin-bottom: var(--sdp-mb-ul);
  padding-left: 28px;
}
ul { list-style: disc; }
ol { list-style: decimal; }
li {
  margin-bottom: var(--sdp-li-gap);
  padding-left: 4px;
}
li:last-child { margin-bottom: 0; }
li > ul, li > ol {
  margin-top: var(--sdp-li-gap);
  margin-bottom: var(--sdp-li-gap);
}
/* ── CITA ── */
blockquote {
  margin: 32px auto;
  padding: 4px 0 4px var(--sdp-bq-indent);
  border-left: 4px solid var(--sdp-accent);
  font-style: italic;
  color: var(--sdp-text-suau);
}
blockquote p {
  font-size: 1.15rem;
  line-height: 1.6;
  color: inherit;
  margin-bottom: 8px;
}
blockquote p:last-child { margin-bottom: 0; }
/* ── REGLES ADJACENTS · TRANSICIONS EXACTES ── */
h1 + .lead, h2 + .lead { margin-top: 0; }
h1 + p, h2 + p { margin-top: 12px; }
.lead + p { margin-top: 0; }
h3 + p, h4 + p, h5 + p, h6 + p { margin-top: 0; }
h3 + ul, h3 + ol, h4 + ul, h4 + ol,
h5 + ul, h5 + ol, p + ul, p + ol { margin-top: -4px; }
ul + p, ol + p { margin-top: 0; }
h2 + h3 { margin-top: 24px; }
h3 + h4 { margin-top: 16px; }
/* ── FIRST / LAST CHILD ── */
h1:first-child, h2:first-child, h3:first-child,
h4:first-child, h5:first-child, h6:first-child,
p:first-child, .lead:first-child,
ul:first-child, ol:first-child,
blockquote:first-child { margin-top: 0 !important; }
h1:last-child, h2:last-child, h3:last-child,
h4:last-child, h5:last-child, h6:last-child,
p:last-child, .lead:last-child,
ul:last-child, ol:last-child,
blockquote:last-child { margin-bottom: 0 !important; }


/* ── LLEI DE VIDA · cap control per davall de --sdp-touch ── */
button, .btn, .nav-item, .sp-card-action, .page-btn,
.download-card-btn, .audio-play-btn, .file-item-action, summary.accordion-header {
  min-width: var(--sdp-touch);
  min-height: var(--sdp-touch);
}

a { color: var(--sdp-accent-titol); text-decoration: none; transition: color var(--sdp-t); }
a:hover { color: var(--sdp-accent-text-hover); }

::selection { background: var(--sdp-accent); color: var(--sdp-text-titol); }

:focus-visible { outline: 3px solid var(--sdp-focus); outline-offset: 2px; border-radius: 4px; }
/* Sobre superfícies fosques, l'anell de focus és taronja */
.app-sidebar :focus-visible,
header.bar-black :focus-visible,
header.bar-blue :focus-visible,
.mobile-nav :focus-visible,
.sp-card-footer :focus-visible,
.fab-button:focus-visible { outline-color: var(--sdp-accent-text); }

.sr-only, .sdp-sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* ── 2. ESQUELET DE 3 COLUMNES ─────────────────────────────────
   body(flex) ─ nav.app-sidebar (fixa 260px)
             ├─ aside.app-list  (opcional, llista contextual)
             └─ main.app-main   (visor, flexible)
   Flexbox i no grid: així el layout no es trenca quan la columna
   central no existeix (com en esta demo).                        */

main.app-main {
  flex: 1 1 auto;
  min-width: 0;                        /* evita desbordaments de flex */
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: clip;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--sdp-text-suau) transparent;
}

/* ── 3. COLUMNA 1 · SIDEBAR ────────────────────────────────────── */
nav.app-sidebar {
  flex: 0 0 var(--sdp-col-sidebar);
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sdp-fons-invers);
  color: var(--sdp-text-invers);
  position: relative;
  z-index: var(--z-sidebar);
  overscroll-behavior: contain;
}
/* L'últim bloc (menú) absorbeix l'alçada restant i fa scroll propi */
nav.app-sidebar > div:last-child {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--sdp-text-suau) transparent;
}

.brand {
  height: var(--sdp-alt-negra);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--sdp-space-6);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.brand img { width: 100%; max-width: 180px; height: auto; object-fit: contain; }

.sidebar-control-btn {
  display: flex;
  text-transform: uppercase;
  align-items: center;
  justify-content: center;
  flex: none;
  height: var(--sdp-alt-accio);
  background: var(--sdp-accio-forta);
  color: var(--sdp-text-invers);
  text-decoration: none;
  font-weight: 800;
  font-size: 1rem;
  padding: 0 var(--sdp-space-6);
  border: none;
  width: 100%;
  text-align: center;
  cursor: pointer;
  
  letter-spacing: 0.05em;
  transition: background var(--sdp-t);
}
.sidebar-control-btn:hover { background: var(--sdp-accio-hover); }
.sidebar-control-btn:active { background: var(--sdp-accio-forta); }

.nav-item {
  display: block;
  padding: var(--sdp-space-3) var(--sdp-space-4);
  margin-bottom: var(--sdp-space-1);
  border-radius: var(--sdp-radi-m);
  color: rgba(255,255,255,0.78);
  text-decoration: none;
  font-weight: 600;
  transition: background var(--sdp-t), color var(--sdp-t);
}
.nav-item:hover { background: rgba(255,255,255,0.09); color: var(--sdp-text-invers); }
.nav-item.active { background: var(--sdp-accent); color: var(--sdp-sobre-accent); }
.nav-item.active:hover { background: var(--sdp-accent-hover); }

/* ── 4. COLUMNA 2 · LLISTA CONTEXTUAL (opcional) ───────────────
   Esta demo no la inclou; l'app real (xats, llocs…) només ha de
   muntar <aside class="app-list"> entre la sidebar i el visor.   */
aside.app-list {
  flex: 0 0 var(--sdp-col-llista);
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--sdp-fons-targeta);
  border-right: 1px solid var(--sdp-vora);
  scrollbar-width: thin;
  scrollbar-color: var(--sdp-vora-forta) transparent;
}
@media (max-width: 1440px) { aside.app-list { flex-basis: 320px; } }

/* ── 5. COLUMNA 3 · VISOR — BARRES GLOBALS ─────────────────────── */
header.bar-black {
  height: var(--sdp-alt-negra);
  flex: none;
  background: var(--sdp-fons-invers);
  color: var(--sdp-text-invers);
  display: flex;
  align-items: center;
  padding: 0 var(--sdp-space-6);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: var(--z-barra-negra);
}
.bar-black .right-icons { display: flex; align-items: center; gap: var(--sdp-space-2); margin-left: auto; }
.bar-black .right-icons .icon { width: var(--sdp-touch); height: var(--sdp-touch); padding: 6px; opacity: 0.8; cursor: pointer; transition: opacity var(--sdp-t), transform var(--sdp-t); }
.bar-black .right-icons .icon:hover { opacity: 1; transform: translateY(-1px); }
.bar-black .right-icons .icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
.bar-black .right-icons .icon:has(img) { width: 48px; height: 48px; }
@keyframes sdp-iaia-pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.iaia-icon {
  fill: #ff6b00; /* Orange color to match the old IAIA circular avatar */
  stroke: none;
  animation: sdp-iaia-pulse 4s ease-in-out infinite;
}

/* Botó logo: només visible en mòbil (obri la sidebar) o en escriptori tancat */
.mobile-logo-wrapper { display: none; cursor: pointer; }
.mobile-logo-wrapper img { width: 180px; height: auto; object-fit: contain; }


header.bar-blue {
  height: var(--sdp-alt-accio);
  flex: none;
  background: var(--sdp-accio);
  color: var(--sdp-sobre-accio);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 var(--sdp-space-6);
  position: sticky;
  top: var(--sdp-alt-negra);
  z-index: var(--z-barra-blava);
}

.bar-blue-left { display: flex; align-items: center; gap: var(--sdp-space-3); }
.bar-actions { display: flex; align-items: center; gap: var(--sdp-space-5); }
.bar-actions .icon { cursor: pointer; opacity: 0.9; transition: opacity var(--sdp-t); }
.bar-actions .icon:hover { opacity: 1; }

.icon {
  width: 24px; height: 24px;
  fill: none; stroke: currentColor; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
  flex: none;
}

/* Unify black bar icon sizes with blue bar (Action Menu) sizes */
.bar-black .right-icons svg {
  width: 30px;
  height: 30px;
  stroke-width: 2.5;
  transition: width var(--sdp-t), height var(--sdp-t);
}

/* Hero */
.hero-image { width: 100%; flex: none; }
.hero-image img {
  display: block;
  width: 100%;
  height: auto;
}

/* Barra taronja (context: autor i poble) */
section.bar-orange {
  height: var(--sdp-alt-accio);
  flex: none;
  background: var(--sdp-accent);
  color: var(--sdp-text-titol);
  padding: 0 var(--sdp-space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sdp-space-3);
  font-size: 0.9rem;
  position: sticky;
  top: calc(var(--sdp-alt-negra) + var(--sdp-alt-accio));
  z-index: var(--z-barra-taronja);
}

/* Col·locació explícita a la reixeta dels components atòmics */
/* .bar-blue has 3 elements: Left, Center, Right */
header.bar-blue > *:first-child { grid-column: 1; justify-self: start; }
header.bar-blue > *:nth-child(2) { grid-column: 2; justify-self: center; }
header.bar-blue > *:last-child { grid-column: 3; justify-self: end; }




.bar-orange .bar-actions { flex: none; white-space: nowrap; }

/* Títol de pàgina */
header.page-title {
  flex: none;
  background: var(--sdp-fons-targeta);
  border-radius: 0 0 var(--sdp-radi-xl) var(--sdp-radi-xl);
  padding: var(--sdp-space-8) var(--sdp-space-10);
  text-align: center;
  margin: 0 var(--sdp-space-10) var(--sdp-space-8);
  box-shadow: var(--sdp-ombra-2);
}
header.page-title h1, header.page-title .h1 {
  font-size: clamp(1.8rem, 4.5vw, 2.5rem);
  color: var(--sdp-accio-text);
  margin-bottom: var(--sdp-space-2);
  letter-spacing: 0.02em;
  max-width: none;
}
header.page-title h2 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
}
header.page-title .lead {
  margin-bottom: 0;
  color: var(--sdp-text-suau);
}
.page-title-logo { display: block; width: 600px; max-width: 100%; height: auto; margin: 0 auto 16px; object-fit: contain; }
.page-title-labels { margin-top: 32px; margin-bottom: 32px; display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.page-title-copyright { margin-bottom: 0; text-align: center; color: var(--sdp-text-suau); font-size: var(--sdp-text-meta); letter-spacing: 0.05em; }



/* ── 6. CONTINGUT EDITORIAL ────────────────────────────────────── */
article.content-wrapper {
  flex: none;
  padding: 0 var(--sdp-pad-contenidor) var(--sdp-pad-contenidor);
  width: 100%;
}

/* ── MESURA EDITORIAL · la columna de text no passa mai de 68ch ──────
   S'aplica al TEXT, no al contenidor: així les reixetes, les taules,
   les targetes i les paletes continuen ocupant tota l'amplària, i
   només el text corrent es limita i es centra. Esta és la diferència
   entre un manual llegible i una paret de caràcters.                */
.content-wrapper > p,
.content-wrapper > ul,
.content-wrapper > ol,
.content-wrapper > blockquote,
.content-wrapper > .lead,
.design-block > p,
.design-block > ul,
.design-block > ol,
.design-block > blockquote,
.design-block > .lead,
.cms-preview > p,
.cms-preview > ul,
.cms-preview > ol {
  max-width: none;
  margin-inline: auto;
}
/* Els títols de secció acompanyen la columna, no la travessen */
.design-block > h4,
.design-block > h5,
.design-block > h6 {
  max-width: none;
  margin-left: 0;
  margin-right: 0;
}
/* Excepció explícita: el primer paràgraf de secció fa d'entradeta i
   s'alinea amb el títol de la secció, que va a l'esquerra. */
.design-block > p:first-of-type { margin-inline: 0; }

section.design-block { margin-bottom: var(--sdp-space-16); }
/* En .design-block la tipografia flueix PURA: hereta TOTES les regles globals.
   Només centrem el flux i distingim els títols d'índex del manual. */

/* Títols d'índex de cada secció del manual */
section.design-block > h3:first-of-type,
section.design-block > h3:first-child {
  text-align: left;
  margin-left: 0;
  margin-right: 0;
  max-width: none;
  font-size: clamp(1.4rem, 2.4vw, 1.75rem);
  border-bottom: 1px solid var(--sdp-vora);
  padding-bottom: 12px;
  margin-bottom: 28px;
}

section.design-block > p:first-of-type {
  text-align: left;
  max-width: none;
  margin-left: 0;
  color: var(--sdp-text-suau);
  margin-bottom: 28px;
}

/* Paleta de mostres */
.palette { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 24px; margin-bottom: var(--sdp-space-8); }
.swatch {
  border-radius: var(--sdp-radi-m);
  overflow: hidden;
  background: var(--sdp-fons-targeta);
  box-shadow: var(--sdp-ombra-1);
  transition: transform var(--sdp-t), box-shadow var(--sdp-t);
}
.swatch:hover { transform: translateY(-3px); box-shadow: var(--sdp-ombra-3); }
.swatch-color { height: 100px; padding: var(--sdp-space-4); font-weight: 700; display: flex; align-items: flex-end; }
.swatch-info { padding: var(--sdp-space-4); font-family: var(--sdp-font-mono); font-size: 0.8rem; color: var(--sdp-text-suau); }


/* Icona en línia amb el text · substituïx 16 estils inline idèntics.
   El marge dret desapareix quan la icona és l'únic fill (botó rodó). */
.icona-linia { display: inline-block; vertical-align: middle; margin-right: 4px; flex: none; }
.icona-linia:only-child { margin-right: 0; }

/* Mostres de paleta · sense cap estil inline */
.sw-pedra-75 { background: var(--sdp-pedra-75); color: var(--sdp-pedra-900); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05); }
.sw-pedra-100 { background: var(--sdp-pedra-100); color: var(--sdp-pedra-900); }
.sw-pedra-200 { background: var(--sdp-pedra-200); color: var(--sdp-pedra-900); }
.sw-pedra-300 { background: var(--sdp-pedra-300); color: var(--sdp-pedra-900); }
.sw-pedra-400 { background: var(--sdp-pedra-400); color: var(--sdp-pedra-900); }
.sw-pedra-500 { background: var(--sdp-pedra-500); color: var(--sdp-pedra-50); }
.sw-pedra-600 { background: var(--sdp-pedra-600); color: var(--sdp-pedra-50); }
.sw-pedra-700 { background: var(--sdp-pedra-700); color: var(--sdp-pedra-50); }
.sw-pedra-750 { background: var(--sdp-pedra-750); color: var(--sdp-pedra-50); }
.sw-pedra-800 { background: var(--sdp-pedra-800); color: var(--sdp-pedra-50); }
.sw-pedra-850 { background: var(--sdp-pedra-850); color: var(--sdp-pedra-50); }
.sw-pedra-900 { background: var(--sdp-pedra-900); color: var(--sdp-pedra-50); }
.sw-blanc-pur { background: #ffffff; color: var(--sdp-pedra-900); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); }
.sw-negre-pur { background: var(--sdp-pedra-900); color: #ffffff; }
.sw-primary-500 { background: var(--sdp-primary-500); color: var(--sdp-pedra-900); }
.sw-primary-700 { background: var(--sdp-primary-700); color: #ffffff; }
.sw-secondary-500 { background: var(--sdp-secondary-500); color: #ffffff; }
.sw-secondary-700 { background: var(--sdp-secondary-700); color: #ffffff; }
.sw-error-500 { background: var(--sdp-error-500); color: #ffffff; }
.sw-avis-500 { background: var(--sdp-avis-500); color: #ffffff; }
.sw-exit-500 { background: var(--sdp-exit-500); color: #ffffff; }
.swatch-info { line-height: 1.5; }

/* Previsualització CMS (contingut editorial universal) */
.cms-preview {
  border: 1px solid var(--sdp-vora);
  padding: var(--sdp-space-8);
  border-radius: var(--sdp-radi-m);
  background: var(--sdp-fons-targeta);
  position: relative;
  margin-top: var(--sdp-space-4);
  box-shadow: var(--sdp-ombra-1);
}
.cms-badge {
  position: absolute; top: 12px; right: 16px;
  font-size: 0.7rem; font-weight: 700; color: var(--sdp-text-suau);
   letter-spacing: 0.1em;
}
.cms-preview > * {
  margin-left: auto !important;
  margin-right: auto !important;
}
.cms-preview pre, .accordion pre {
  background: var(--sdp-fons-subtil);
  padding: var(--sdp-space-4);
  border-radius: var(--sdp-radi-s);
  border: 1px solid var(--sdp-vora);
  font-family: var(--sdp-font-mono);
  font-size: 0.85rem;
  color: var(--sdp-text-suau);
  overflow-x: auto;
}

/* Espaiat */
.spacing-item { display: flex; align-items: center; gap: var(--sdp-space-4); margin-bottom: var(--sdp-space-3); }
.spacing-bar { width: var(--mida, var(--sdp-space-4)); height: var(--sdp-space-4); background: var(--sdp-accent); border-radius: var(--sdp-space-1); flex: none; }
.spacing-label { font-family: var(--sdp-font-mono); font-size: 0.85rem; color: var(--sdp-text-suau); }

/* Grid demo */
.grid-preview { display: flex; gap: var(--sdp-space-4); }
.grid-col {
  flex: 1;
  background: var(--sdp-fons-targeta);
  border: 1px solid var(--sdp-vora);
  padding: 12px;
  text-align: center;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--sdp-text-suau);
  font-weight: 600;
}

/* ── 7. COMPONENTS ─────────────────────────────────────────────── */

/* 7.1 Botons */
.btn-group { display: flex; flex-wrap: wrap; gap: var(--sdp-space-4); align-items: center; justify-content: flex-start; }
.btn {
  padding: var(--sdp-space-3) var(--sdp-space-6);
  border-radius: var(--sdp-radi-pastilla);
  font-family: var(--sdp-font);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--sdp-space-2);
  transition: transform var(--sdp-t), box-shadow var(--sdp-t), background var(--sdp-t), border-color var(--sdp-t), color var(--sdp-t);
}
.btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(14,13,12,0.16); }
.btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 6px rgba(14,13,12,0.14); }
.btn-primary { background: var(--sdp-accent); color: var(--sdp-text-titol); }
.btn-primary:hover:not(:disabled) { background: var(--sdp-accent-hover); color: var(--sdp-sobre-accent); }
.btn-secondary { background: var(--sdp-accio); color: var(--sdp-sobre-accio); }
.btn-secondary:hover:not(:disabled) { background: var(--sdp-accio-hover); }
.btn-outline-dark { background: transparent; border: 1px solid var(--sdp-vora-control); color: var(--sdp-text-titol); }
.btn-outline-dark:hover:not(:disabled) { border-color: var(--sdp-text-suau); background: var(--sdp-fons-targeta); }
.btn-base { background: var(--sdp-fons-invers); color: var(--sdp-text-invers); }
.btn-base:hover:not(:disabled) { background: var(--sdp-fons-invers); }
.btn-danger { background: var(--sdp-error); color: #ffffff; }
.btn-danger:hover:not(:disabled) { background: var(--sdp-error-text); }
.btn-ghost { background: transparent; color: var(--sdp-text-titol); border: 1px solid var(--sdp-vora); }
.btn-ghost:hover:not(:disabled) { background: rgba(14,13,12,0.06); border-color: var(--sdp-text-suau); }
.btn-sm { padding: var(--sdp-space-2) var(--sdp-space-4); font-size: 0.85rem; }
.btn-lg { padding: var(--sdp-space-4) var(--sdp-space-8); font-size: 1.15rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.icon-btn { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

.spinner { animation: spin 1s linear infinite; width: 18px; height: 18px; stroke-dasharray: 60; stroke-dashoffset: 20; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* 7.2 Formularis */
.form-group { margin-bottom: var(--sdp-space-5); display: flex; flex-direction: column; gap: var(--sdp-space-2); }
.form-group label { font-weight: 700; font-size: 0.9rem; color: var(--sdp-text-titol); }
.form-group input, .form-group select, .form-group textarea {
  padding: var(--sdp-space-3) var(--sdp-space-4);
  border: 1px solid var(--sdp-vora-control);
  border-radius: var(--sdp-radi-s);
  font-family: var(--sdp-font);
  font-size: 1rem;
  background: var(--sdp-fons-targeta);
  color: var(--sdp-text-titol);
  outline: none;
  transition: border-color var(--sdp-t), box-shadow var(--sdp-t);
  width: 100%;
}
.form-group textarea { resize: vertical; }
.form-group input:hover, .form-group select:hover, .form-group textarea:hover { border-color: var(--sdp-text-suau); }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  border-color: var(--sdp-accio-text);
  box-shadow: 0 0 0 3px rgba(1,110,191,0.16);
}
.form-group select, .search-filters select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%238b857b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 16px;
  padding-right: 42px;
}
.checkbox-group { display: flex; align-items: center; gap: var(--sdp-space-2); margin-bottom: var(--sdp-space-2); }
.checkbox-group input { width: 24px; height: 24px; accent-color: var(--sdp-accio-text); flex: none; }
.form-group.has-error input { border-color: var(--sdp-error); background: var(--sdp-error-fons); }
.form-group.has-error input:focus { box-shadow: 0 0 0 3px rgba(194,20,25,0.16); }
.error-text { color: var(--sdp-error-text); font-size: var(--sdp-text-meta); font-weight: 600; }
.form-group.is-disabled input { background: transparent; color: var(--sdp-text-suau); cursor: not-allowed; }

/* 7.3 Alertes */
.alert { padding: var(--sdp-space-4); border-radius: var(--sdp-radi-s); display: flex; gap: var(--sdp-space-3); margin-bottom: var(--sdp-space-3); }
.alert-info { background: var(--sdp-info-fons); color: var(--sdp-info-text); }
.alert-success { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }
.alert-warning { background: var(--sdp-avis-fons); color: var(--sdp-avis-text); }
.alert-error { background: var(--sdp-error-fons); color: var(--sdp-error-text); }
.alert-icon { width: 24px; height: 24px; flex-shrink: 0; }
.alert-content h4 { margin-bottom: var(--sdp-space-1); font-size: 1rem; text-transform: none; }
.alert-info h4, .alert-success h4 { color: var(--sdp-secondary-700); }
.alert-content p { font-size: var(--sdp-text-meta); margin: 0; }

/* 7.4 Badges */
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: var(--sdp-radi-pastilla); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
.badge-default { background: var(--sdp-fons-subtil); color: var(--sdp-text-titol); }
.badge-primary { background: var(--sdp-accent); color: var(--sdp-text-titol); }
.badge-success { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }
.badge-warning { background: var(--sdp-avis-fons); color: var(--sdp-avis-text); }
.badge-danger { background: var(--sdp-error-fons); color: var(--sdp-error-text); }
.badge-info { background: var(--sdp-info-fons); color: var(--sdp-info-text); }
.badge-outline { background: transparent; border: 1px solid var(--sdp-vora-control); color: var(--sdp-text-titol); }

/* 7.5 Taules */
.table-wrapper { overflow-x: auto; margin-bottom: var(--sdp-space-8); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); background: var(--sdp-fons-targeta); }
table { width: 100%; border-collapse: collapse; text-align: left; }
th { background: var(--sdp-fons-subtil); padding: var(--sdp-space-4); font-size: 0.8rem; font-weight: 700;  color: var(--sdp-text-suau); border-bottom: 2px solid var(--sdp-vora); }
td { padding: var(--sdp-space-4); border-bottom: 1px solid var(--sdp-vora); font-size: 0.95rem; }
tr:last-child td { border-bottom: none; }
tbody tr { transition: background var(--sdp-t); }
tbody tr:hover { background: var(--sdp-accent-subtil); }
.table-zebra tr:nth-child(even) { background: var(--sdp-fons-subtil); }
.table-action { color: var(--sdp-accent-text); font-weight: 600; text-decoration: none; }
.table-action:hover { color: var(--sdp-accent-text-hover); text-decoration: underline; }

/* 7.6 Navegació */
.nav-bar { display: flex; border-bottom: 1px solid var(--sdp-vora); margin-bottom: var(--sdp-space-6); }
.nav-bar a { padding: 16px 24px; text-decoration: none; color: var(--sdp-text-suau); font-weight: 600; white-space: nowrap; transition: color var(--sdp-t); }
.nav-bar a:hover { color: var(--sdp-text-titol); }
.nav-bar a.active { color: var(--sdp-accent-text); border-bottom: 3px solid var(--sdp-accent); }
.pagination { display: flex; gap: var(--sdp-space-2); align-items: center; flex-wrap: wrap; }
.page-btn { padding: var(--sdp-space-2) var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: 4px; background: var(--sdp-fons-targeta); color: var(--sdp-text-titol); font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; transition: border-color var(--sdp-t), color var(--sdp-t), background var(--sdp-t); }
.page-btn:hover:not(.active):not([disabled]) { border-color: var(--sdp-accent-text); color: var(--sdp-accent-titol); }
.page-btn.active { background: var(--sdp-accent); color: var(--sdp-sobre-accent); border-color: var(--sdp-accent); }
.page-btn[disabled] { opacity: 0.5; cursor: not-allowed; }

/* 7.7 Modals */
.modal-preview { background: var(--sdp-fons-vel); padding: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--sdp-radi-s); }
.modal-box { background: var(--sdp-fons-targeta); padding: var(--sdp-space-8); border-radius: var(--sdp-radi-m); max-width: 400px; width: 100%; box-shadow: var(--sdp-ombra-4); }
.modal-box h3 { margin-bottom: var(--sdp-space-3); font-size: 1.25rem; color: var(--sdp-text-titol); }
.modal-box p { color: var(--sdp-text-suau); margin-bottom: var(--sdp-space-6); font-size: 0.95rem; line-height: 1.5; }
.modal-actions { display: flex; justify-content: flex-end; gap: var(--sdp-space-3); flex-wrap: wrap; }

/* 7.8 Indicadors de càrrega */
.spinner-group { display: flex; align-items: flex-end; gap: 24px; margin-bottom: var(--sdp-space-8); }
.spinner-sm { width: 16px; height: 16px; }
.spinner-md { width: 24px; height: 24px; }
.spinner-lg { width: 32px; height: 32px; }
.skeleton { background: var(--sdp-fons-subtil); border-radius: 4px; animation: pulse 1.5s infinite; }
.skeleton-title { height: 24px; width: 60%; margin-bottom: var(--sdp-space-4); }
.skeleton-text { height: 12px; width: 100%; margin-bottom: var(--sdp-space-2); }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* 7.9 Avatars */
.avatar-group { display: flex; align-items: center; gap: var(--sdp-space-4); flex-wrap: wrap; }
.avatar { background: var(--sdp-fons-subtil); color: var(--sdp-text-titol); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; flex: none; }
.avatar-xs { width: 24px; height: 24px; font-size: 0.6rem; }
.avatar-sm { width: 32px; height: 32px; font-size: 0.7rem; }
.avatar-md { width: 48px; height: 48px; }
.avatar-lg { width: 64px; height: 64px; font-size: 1.2rem; }
.avatar-xl { width: 80px; height: 80px; font-size: 1.5rem; }

/* 7.10 Desplegables */
.accordion { border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); overflow: hidden; background: var(--sdp-fons-targeta); }
.accordion-header, summary.accordion-header {
  padding: 16px 24px;
  background: var(--sdp-fons-subtil);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sdp-space-3);
  border-bottom: 1px solid var(--sdp-vora);
  transition: background var(--sdp-t);
  list-style: none;
}
summary.accordion-header::-webkit-details-marker { display: none; }
.accordion-header:hover, summary.accordion-header:hover { background: var(--sdp-fons-subtil); }
.accordion-header svg, summary.accordion-header svg { flex: none; transition: transform var(--sdp-t); }
details[open] summary.accordion-header svg { transform: rotate(180deg); }
.accordion pre { margin: 0; border: 0; border-radius: 0; }

/* 7.11 Pestanyes */
.tabs { display: flex; border-bottom: 1px solid var(--sdp-vora); margin-bottom: var(--sdp-space-4); }
.tab { padding: var(--sdp-space-3) var(--sdp-space-6); font-weight: 700; color: var(--sdp-text-suau); cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap; transition: color var(--sdp-t), border-color var(--sdp-t); }
.tab:hover:not(.active) { color: var(--sdp-text-titol); }
.tab.active { color: var(--sdp-accent-text); border-bottom-color: var(--sdp-accent-text); }
.tab-content { padding: var(--sdp-space-4); background: var(--sdp-fons-subtil); border-radius: var(--sdp-radi-s); border: 1px solid var(--sdp-vora); }

/* 7.12 Barra de progrés */
.progress-container { margin-bottom: var(--sdp-space-6); }
.progress-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: var(--sdp-space-2); color: var(--sdp-text-suau); }
.progress-bar { height: 8px; background: var(--sdp-fons-subtil); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--sdp-accent); border-radius: 4px; transition: width 0.4s ease; }

/* 7.13 Tooltips */
.tooltip-preview { display: flex; gap: 32px; align-items: center; flex-wrap: wrap; }
.tooltip-term { text-decoration: underline dotted; cursor: help; color: var(--sdp-text-suau); }

/* 7.14 Llistes */
.lists-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  grid-auto-flow: column;
  column-gap: var(--sdp-space-8);
}
.lists-preview h4 {
  font-size: 1rem;
  margin-bottom: var(--sdp-space-4);
  margin-left: 0;
  margin-right: 0;
  text-align: left;
}
.lists-preview ul, .lists-preview ol {
  margin-left: 0;
  margin-right: 0;
  max-width: none;
}

/* 7.15 Divisors */
.divider-preview { margin-bottom: 40px; }
.divider-label { font-size: 0.75rem; color: var(--sdp-text-suau);  margin-bottom: var(--sdp-space-2); }
.divider-basic { height: 1px; background: var(--sdp-vora); margin: 16px 0; }
.divider-text { display: flex; align-items: center; text-align: center; color: var(--sdp-text-suau); font-size: 0.85rem; font-weight: 700; margin: var(--sdp-space-6) 0; }
.divider-text::before, .divider-text::after { content: ''; flex: 1; border-bottom: 1px solid var(--sdp-vora); }
.divider-text:not(:empty)::before { margin-right: 16px; }
.divider-text:not(:empty)::after { margin-left: 16px; }
.divider-major { height: 2px; background: var(--sdp-accent); margin: 32px 0; }
.divider-dashed { border-top: 1px dashed var(--sdp-vora); margin: 16px 0; }
.divider-dotted { border-top: 2px dotted var(--sdp-vora); margin: var(--sdp-space-6) 0; }

/* 7.18 Llistes de definició */
.dl-horizontal { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; margin-bottom: var(--sdp-space-6); }
.dl-horizontal dt { font-weight: 700; color: var(--sdp-text-titol); }
.dl-horizontal dd { margin: 0; color: var(--sdp-text-titol); }

/* 7.20 Indicadors (UniversalIndicatorCard) */
.sdp-indicator-card {
  background: var(--sdp-fons-targeta);
  border: 1px solid transparent;
  border-radius: var(--sdp-radi-g);
  padding: var(--sdp-space-6) var(--sdp-space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all var(--sdp-t);
}

.sdp-indicator-card:hover {
  background: var(--sdp-fons-app);
  border-color: var(--sdp-vora);
  box-shadow: var(--sdp-ombra-1);
}

.sdp-indicator-card.active {
  background: var(--sdp-fons-app);
  border-color: var(--sdp-accent);
  box-shadow: 0 4px 12px rgba(254, 116, 6, 0.15);
}

.sdp-indicator-card-icon {
  margin-bottom: var(--sdp-space-3);
  font-size: 3rem;
  line-height: 1;
  color: var(--sdp-accent);
}

.sdp-indicator-card-title {
  font-weight: 800;
  font-size: 1rem;
  color: var(--sdp-text-blau);
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.sdp-indicator-card-subtitle {
  font-size: 0.85rem;
  color: var(--sdp-text-suau);
  margin: 0;
}

/* 7.21 Targeta Mestra (Sóc de Poble Card) */
.sp-card {
  background: var(--sdp-fons-targeta);
  border-radius: var(--sdp-radi-m);
  overflow: hidden;
  box-shadow: var(--sdp-ombra-3);
  margin: 0 auto 32px;
  width: 100%;
  max-width: 500px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  transition: box-shadow var(--sdp-t-lenta);
}

/* Targeta Mestra enllaçable: overlay a z1, capa interactiva a z2 */
.sp-card { position: relative; }
.sp-card-link-overlay { position: absolute; inset: 0; z-index: 1; border-radius: inherit; outline: none; }
.sp-card-link-overlay:focus-visible { box-shadow: 0 0 0 3px var(--sdp-focus) inset; }
.sp-card-header, .sp-card-footer, .sp-card-author-link, .sp-card-author-block, .btn-icon-orange, .btn-date-time, .sp-card-action, .sp-card-connect, .sp-card-labels, .sp-card-copyright, .sp-card-body a, .sp-card-body span[onClick] { position: relative; z-index: 2; }
.sp-card-author-link, .sp-card-author-block { display: flex; align-items: center; min-width: 0; flex: 1; }

/* Etiquetes de la Targeta Mestra i Sistema de Badges */
.sdp-badges-container, .sp-card-labels { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sdp-space-2); margin-top: var(--sdp-space-3); margin-bottom: var(--sdp-space-4); list-style: none; padding: 0; }
.sdp-badges-container li, .sp-card-labels li { list-style: none; padding: 0; margin: 0; }
.sdp-badge, .sp-card-labels .sp-card-label, .sp-card-label { display: inline-flex; align-items: center; justify-content: center; height: 24px; padding: 0 12px; border-radius: 12px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; white-space: nowrap; }

/* Sistema de Badges Universals (Taxonomia 2026) */
.sdp-badge-system { background: var(--sdp-accio); color: var(--sdp-sobre-accio); }
:root[data-theme="dark"] .sdp-badge-system, :host([data-theme="dark"]) .sdp-badge-system { background: var(--sdp-accent); color: var(--sdp-sobre-accent); }
.sdp-badge-accent { background: var(--sdp-accent); color: var(--sdp-sobre-accent); }
:root[data-theme="dark"] .sdp-badge-accent, :host([data-theme="dark"]) .sdp-badge-accent { background: var(--sdp-accio); color: var(--sdp-sobre-accio); }
.sdp-badge-category { background: var(--sdp-accio-subtil); color: var(--sdp-accio-text); }
.sdp-badge-tag { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }
.sdp-badge-neutral { background: var(--sdp-fons-subtil); color: var(--sdp-text-titol); }

/* Retrocompatibilitat */

/* Tooltip (Bocata) */
.tooltip-container { position: relative; display: inline-flex; z-index: 3; }
.tooltip-text {
  visibility: hidden; opacity: 0;
  background-color: var(--sdp-fons-invers); color: var(--sdp-text-invers);
  text-align: center; border-radius: 4px; padding: 6px 10px;
  position: absolute; z-index: 4;
  top: 100%; left: 50%; transform: translateX(-50%) translateY(8px);
  font-size: 0.75rem; font-weight: 700; white-space: nowrap;
  transition: opacity var(--sdp-t), visibility var(--sdp-t), transform var(--sdp-t);
  pointer-events: none;
}
.tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; transform: translateX(-50%) translateY(4px); }
.tooltip-text::after {
  content: ""; position: absolute; bottom: 100%; left: 50%; margin-left: -5px;
  border-width: 5px; border-style: solid; border-color: transparent transparent var(--sdp-pedra-900) transparent;
}

.sp-card:hover { box-shadow: var(--sdp-ombra-4); }
.sp-card-header { 
  background: var(--sdp-accent); 
  padding: var(--sdp-space-3) var(--sdp-space-4); 
  display: flex; justify-content: space-between;
  align-items: center; 
  gap: var(--sdp-space-3); 
  min-width: 0;
}

.sp-card-author { display: flex; align-items: center; gap: var(--sdp-space-3); flex: 1; min-width: 0; }
.sp-card-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--sdp-fons-targeta); object-fit: cover; flex: none; box-shadow: var(--sdp-ombra-1); }
.sp-card-author-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.sp-card-author-name { font-weight: 700; color: var(--sdp-text-titol); font-size: 1.05rem; line-height: 1.2; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-card-author-location { font-size: 0.85rem; color: var(--sdp-text-titol); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-card-author-location svg { display: inline-block; vertical-align: middle; margin-right: var(--sdp-space-1); }
.sp-card-meta { display: flex; align-items: center; gap: var(--sdp-space-2); color: var(--sdp-sobre-accent); text-align: right; flex: none; }

.sp-card-media { width: 100%; aspect-ratio: 1 / 1; display: block; object-fit: cover; object-position: top; background: var(--sdp-fons-subtil); }

.sp-card-body { padding: 22px 24px 16px; text-align: left; position: relative; min-width: 0; }
.sp-card-body:has(.sp-card-title:only-child) { text-align: center; }
.sp-card-title { font-size: 1.4rem; color: var(--sdp-accio-text); font-weight: 800; line-height: var(--sdp-leading-tight); margin: 0 0 var(--sdp-space-2) 0; flex: 1; text-align: center; }

.sp-card-main-button, .sp-card-main-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  text-align: inherit;
}
.sp-card-main-button:hover, .sp-card-main-link:hover {
  text-decoration: underline;
}

.sp-card-content-link {
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  text-align: inherit;
  width: 100%;
  cursor: pointer;
}
.sp-card-content-link:hover .sp-card-media {
  opacity: 0.95;
}

.sp-card .sp-card-body h1 {
  font-size: 1.6rem;
  margin-top: 0;
  margin-bottom: var(--sdp-space-2);
  color: var(--sdp-accio-text);
  line-height: var(--sdp-leading-tight);
  font-weight: 800;
}
.sp-card .sp-card-body h2 {
  font-size: 1.25rem; /* subtítol més menut */
  margin-top: 16px;
  margin-bottom: var(--sdp-space-4);
  color: var(--sdp-accent-titol);
  line-height: var(--sdp-leading-snug);
  font-weight: 600;
}
/* Per defecte, tot centrat al cos de la targeta si no hi ha etiqueta a dalt a la dreta */
.sp-card .sp-card-body h1,
.sp-card .sp-card-body h2,
.sp-card-body p,
.sp-card-body .sp-card-text {
  text-align: center;
}
/* Si hi ha preu o etiqueta a dalt a la dreta, tot s'alinea a l'esquerra per a equilibrar el pes visual */
.sp-card .sp-card-body:has(.sp-card-price) h1,
.sp-card .sp-card-body:has(.sp-card-price) h2,
.sp-card .sp-card-body:has(.sp-card-price) .sp-card-title,
.sp-card .sp-card-body:has(.sp-card-price) .sp-card-subtitle,
.sp-card-body:has(.sp-card-price) p:not(.sp-card-copyright),
.sp-card-body:has(.sp-card-price) .sp-card-text,
.sp-card .sp-card-body:has(.sp-card-calendar-badge) h1,
.sp-card .sp-card-body:has(.sp-card-calendar-badge) h2,
.sp-card .sp-card-body:has(.sp-card-calendar-badge) .sp-card-title,
.sp-card .sp-card-body:has(.sp-card-calendar-badge) .sp-card-subtitle,
.sp-card-body:has(.sp-card-calendar-badge) p:not(.sp-card-copyright),
.sp-card-body:has(.sp-card-calendar-badge) .sp-card-text {
  text-align: left;
}
.sp-card-copyright {
  text-align: center;
}

.sp-card-title:only-child { text-align: center; flex: none; width: 100%; }
.sp-card-price { float: right; margin-left: 6px; margin-bottom: 6px; font-size: 1.2rem; font-weight: 800; color: var(--sdp-accio-text); background: var(--sdp-accio-subtil); padding: 4px 12px; border-radius: var(--sdp-radi-pastilla); white-space: nowrap; }
.sp-card-subtitle { font-size: 1.15rem; color: var(--sdp-accent-titol); font-weight: 700; line-height: var(--sdp-leading-snug); margin-top: var(--sdp-space-4); margin-bottom: var(--sdp-space-3); text-align: center; }
.sp-card-text { font-size: 1rem; color: var(--sdp-text-suau); font-weight: 500; line-height: var(--sdp-leading-body); margin-bottom: var(--sdp-space-6); text-align: center; margin-left: auto; margin-right: auto; }

.sp-card-copyright { color: var(--sdp-text-suau); font-size: var(--sdp-text-meta);  letter-spacing: 0.05em; }
.sp-card-footer { 
  background: var(--sdp-accio); 
  padding: var(--sdp-space-3) var(--sdp-space-4); 
  display: flex; justify-content: space-between;
  align-items: center; 
  gap: var(--sdp-space-3); 
  color: var(--sdp-sobre-accio); 
  position: relative; 
  min-width: 0;
}

.sp-card-actions { 
  display: flex; 
  align-items: center; 
  gap: var(--sdp-space-3); 
  justify-self: center;
  margin: 0;
  padding: 0;
}
.sp-card-footer .sp-card-actions { margin-left: var(--sdp-space-1); }
.sp-card-action { background: transparent; border: none; color: currentColor; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; height: var(--sdp-space-12); width: var(--sdp-space-12); opacity: 0.9; transition: opacity var(--sdp-t), transform var(--sdp-t); }
.sp-card-action .icon { width: 30px; height: 30px; stroke-width: 2.5; display: block; margin: auto; }
.sp-card-action:hover { opacity: 1; transform: translateY(-1px); }
.sp-card-connect { background: var(--sdp-accio-forta); border: none; color: var(--sdp-text-invers); font-weight: 600; text-transform: uppercase; font-size: 0.8rem; cursor: pointer; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; height: var(--sdp-space-12); padding: 0 var(--sdp-space-5); border-radius: var(--sdp-radi-pastilla); white-space: nowrap; transition: transform var(--sdp-t), opacity var(--sdp-t); margin-left: auto; }
.sp-card-connect:hover { transform: scale(1.02); opacity: 0.95; }

/* 7.22 Estadístiques i dashboards */
.stat-card { display: flex; align-items: center; gap: var(--sdp-space-4); background: var(--sdp-fons-targeta); border: 1px solid var(--sdp-vora); padding: var(--sdp-space-4); border-radius: var(--sdp-radi-s); box-shadow: var(--sdp-ombra-1); transition: transform var(--sdp-t), box-shadow var(--sdp-t), border-color var(--sdp-t); }
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--sdp-ombra-2); border-color: var(--sdp-vora-control); }
.stat-icon { font-size: 2rem; flex: none; }
.stat-info { display: flex; flex-direction: column; min-width: 0; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--sdp-text-titol); line-height: 1; margin-bottom: var(--sdp-space-1); }
.stat-label { font-size: 0.85rem; color: var(--sdp-text-suau);  }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--sdp-space-4); margin-bottom: var(--sdp-space-6); }
.dashboard-panel { background: var(--sdp-fons-targeta); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); overflow: hidden; margin-bottom: var(--sdp-space-6); }
.dashboard-header { background: var(--sdp-fons-subtil); padding: var(--sdp-space-3) var(--sdp-space-4); border-bottom: 1px solid var(--sdp-vora); font-weight: 700; text-align: center; color: var(--sdp-text-titol); display: flex; align-items: center; justify-content: center; gap: var(--sdp-space-2); }
.dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--sdp-vora); }
.sdp-card-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sdp-space-6); align-items: start; }
@media (max-width: 1400px) { .sdp-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 800px) { .sdp-card-grid { grid-template-columns: minmax(0, 1fr); } }

.dashboard-item { background: var(--sdp-fons-targeta); padding: 24px 16px; text-align: center; }
.dashboard-item-value { font-size: 1.25rem; font-weight: 700; color: var(--sdp-text-titol); margin-bottom: var(--sdp-space-1); }
.dashboard-item-label { font-size: 0.75rem; color: var(--sdp-text-suau);  }
.dashboard-footer { padding: 8px; text-align: center; font-size: 0.75rem; color: var(--sdp-text-suau); background: var(--sdp-fons-subtil); border-top: 1px solid var(--sdp-vora); }

/* 7.23 Cerca i filtratge */
.search-bar-basic { display: flex; margin-bottom: var(--sdp-space-6); }
.search-bar-basic input { flex: 1; min-width: 0; padding: var(--sdp-space-3) var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s) 0 0 var(--sdp-radi-s); outline: none; font-size: 1rem; transition: border-color var(--sdp-t), box-shadow var(--sdp-t); }
.search-bar-basic button { background: var(--sdp-fons-invers); color: var(--sdp-text-invers); border: none; padding: 0 var(--sdp-space-6); border-radius: 0 var(--sdp-radi-s) var(--sdp-radi-s) 0; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: var(--sdp-space-2); white-space: nowrap; transition: background var(--sdp-t); }
.search-bar-basic button:hover { background: var(--sdp-fons-invers); }
.search-filters { display: flex; gap: var(--sdp-space-4); margin-bottom: var(--sdp-space-6); }
.search-filters input, .search-filters select { padding: var(--sdp-space-3) var(--sdp-space-4); border: 1px solid var(--sdp-vora-control); border-radius: var(--sdp-radi-s); outline: none; font-size: 1rem; background-color: var(--sdp-fons-targeta); color: var(--sdp-text-cos); transition: border-color var(--sdp-t), box-shadow var(--sdp-t); }
.search-filters input { flex: 2; min-width: 0; }
.search-filters select { flex: 1; min-width: 0; }
.search-filters button { background: var(--sdp-fons-invers); color: var(--sdp-text-invers); border: none; padding: var(--sdp-space-3) var(--sdp-space-6); border-radius: var(--sdp-radi-s); font-weight: 700; cursor: pointer; transition: background var(--sdp-t); }
.search-filters button:hover { background: var(--sdp-fons-invers); }
.search-bar-basic input:focus, .search-filters input:focus, .search-filters select:focus { border-color: var(--sdp-accio-text); box-shadow: 0 0 0 3px rgba(1,110,191,0.16); }
.search-result { margin-bottom: var(--sdp-space-6); }
.search-result-title { font-size: 1.1rem; font-weight: 700; color: var(--sdp-accent-text); margin-bottom: var(--sdp-space-1); }
.search-result-meta { font-size: 0.75rem; color: var(--sdp-text-suau);  margin-bottom: var(--sdp-space-2); letter-spacing: 0.05em; }
.search-result-excerpt { color: var(--sdp-text-titol); font-size: 0.95rem; line-height: 1.5; }

/* 7.20 Paginació simplificada */
.pagination-simple { display: flex; justify-content: space-between; margin-top: 32px; gap: var(--sdp-space-4); }
.pagination-simple a { display: flex; flex-direction: column; padding: var(--sdp-space-3) var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); text-decoration: none; color: var(--sdp-text-titol); flex: 1; background: var(--sdp-fons-targeta); transition: background var(--sdp-t), border-color var(--sdp-t), box-shadow var(--sdp-t); }
.pagination-simple a:hover { background: var(--sdp-fons-subtil); border-color: var(--sdp-vora-control); box-shadow: var(--sdp-ombra-1); color: var(--sdp-text-titol); }
.pagination-simple a.next { text-align: right; }
.pagination-label { font-size: 0.75rem; color: var(--sdp-text-suau);  margin-bottom: var(--sdp-space-1); letter-spacing: 0.05em; }
.pagination-title { font-weight: 700; font-size: 1rem; }

/* 7.21 Checklists */
.checklist-admin { background: var(--sdp-fons-targeta); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); overflow: hidden; margin-bottom: var(--sdp-space-6); }
.checklist-item { padding: var(--sdp-space-3) var(--sdp-space-4); border-bottom: 1px solid var(--sdp-vora); display: flex; align-items: flex-start; gap: var(--sdp-space-3); transition: background var(--sdp-t); }
.checklist-item:hover { background: var(--sdp-fons-subtil); }
.checklist-item:last-child { border-bottom: none; }
.checklist-item input[type="checkbox"] { margin-top: 4px; flex: none; }
.checklist-item label { font-size: 0.95rem; color: var(--sdp-text-titol); flex: 1; line-height: 1.4; }
.checklist-item .date-tag { font-size: 0.75rem; color: var(--sdp-accent-text); font-weight: 700; white-space: nowrap; }
.checklist-item .date-tag.done { color: var(--sdp-text-suau); }

/* 7.22 Upload i descàrregues */
.upload-zone { border: 2px dashed var(--sdp-vora); border-radius: var(--sdp-radi-s); padding: var(--sdp-space-8); text-align: center; background: var(--sdp-fons-subtil); margin-bottom: var(--sdp-space-4); transition: border-color var(--sdp-t), background var(--sdp-t); }
.upload-zone:hover { border-color: var(--sdp-accio-text); background: var(--sdp-accio-subtil); }
.upload-zone-text { font-size: 1.1rem; font-weight: 700; color: var(--sdp-text-titol); margin-bottom: var(--sdp-space-2); display: flex; align-items: center; justify-content: center; gap: var(--sdp-space-2); }
.upload-zone-sub { font-size: 0.85rem; color: var(--sdp-text-suau); }
.upload-zone-sub span { color: var(--sdp-accent-text); cursor: pointer; font-weight: 600; }
.upload-zone-sub span:hover { text-decoration: underline; }
.file-item { display: flex; align-items: center; justify-content: space-between; gap: var(--sdp-space-3); padding: var(--sdp-space-3) var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); margin-bottom: var(--sdp-space-2); background: var(--sdp-fons-targeta); transition: border-color var(--sdp-t), box-shadow var(--sdp-t); }
.file-item:hover { border-color: var(--sdp-vora-control); box-shadow: var(--sdp-ombra-1); }
.file-item-info { display: flex; flex-direction: column; min-width: 0; }
.file-item-name { font-size: 0.95rem; color: var(--sdp-text-titol); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-item-meta { font-size: 0.75rem; color: var(--sdp-text-suau); }
.file-item-action { color: var(--sdp-text-suau); cursor: pointer; flex: none; transition: color var(--sdp-t), transform var(--sdp-t); }
.file-item-action:hover { color: var(--sdp-error); transform: scale(1.1); }
.download-card { display: flex; align-items: center; gap: var(--sdp-space-4); padding: var(--sdp-space-4); border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); background: var(--sdp-fons-targeta); margin-bottom: var(--sdp-space-6); transition: box-shadow var(--sdp-t), border-color var(--sdp-t); }
.download-card:hover { box-shadow: var(--sdp-ombra-2); border-color: var(--sdp-vora-control); }
.download-card-icon { font-size: 2rem; color: var(--sdp-accio-text); flex: none; }
.download-card-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.download-card-title { font-size: 1.1rem; font-weight: 700; color: var(--sdp-text-titol); margin-bottom: var(--sdp-space-1); }
.download-card-meta { font-size: 0.8rem; color: var(--sdp-text-suau); }
.download-card-btn { color: var(--sdp-sobre-accio); background: var(--sdp-accio); width: var(--sdp-touch); height: var(--sdp-touch); flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background var(--sdp-t), transform var(--sdp-t); }
.download-card-btn:hover { background: var(--sdp-accio-hover); transform: scale(1.06); color: var(--sdp-sobre-accio); }

/* 7.23 Embeddings i media */
.embed-container { position: relative; padding-bottom: 56.21%; height: 0; overflow: hidden; max-width: 100%; border-radius: var(--sdp-radi-s); margin-bottom: var(--sdp-space-2); background: var(--sdp-fons-invers); }
.embed-container iframe, .embed-container video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
.embed-caption { font-size: 0.85rem; color: var(--sdp-text-suau); text-align: center; margin-bottom: var(--sdp-space-6); }
.audio-player { display: flex; align-items: center; gap: var(--sdp-space-4); background: var(--sdp-fons-subtil); padding: var(--sdp-space-3) var(--sdp-space-6); border-radius: 40px; margin-bottom: var(--sdp-space-2); border: 1px solid var(--sdp-vora); }
.audio-play-btn { width: var(--sdp-touch); height: var(--sdp-touch); flex: none; background: var(--sdp-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--sdp-sobre-accent); border: none; cursor: pointer; transition: background var(--sdp-t), transform var(--sdp-t); }
.audio-play-btn:hover { background: var(--sdp-accent-hover); transform: scale(1.06); }
.audio-play-btn svg { width: 20px; height: 20px; fill: currentColor; margin-left: 2px; }
.audio-progress { flex: 1; height: 4px; background: var(--sdp-vora); border-radius: 2px; position: relative; }
.audio-progress-fill { position: absolute; top: 0; left: 0; height: 100%; background: var(--sdp-accent); width: 35%; border-radius: 2px; }
.audio-time { font-size: 0.75rem; color: var(--sdp-text-suau); font-weight: 700; }

/* 7.24 Caixes d'utilitats (documentació) */
.utils-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: var(--sdp-space-6); }
.utils-box { border: 1px solid var(--sdp-vora); border-radius: var(--sdp-radi-s); padding: var(--sdp-space-4); background: var(--sdp-fons-targeta); }
.utils-box h4 { margin-bottom: var(--sdp-space-3); color: var(--sdp-text-titol); font-size: 1rem; }
.utils-list { list-style: none; padding: 0; margin: 0; font-family: var(--sdp-font-mono); font-size: 0.85rem; color: var(--sdp-text-titol); line-height: 2; }
.utils-list li strong { color: var(--sdp-accent-text); }

/* ── 7.5. TAULES (.sdp-table) ───────────────────────────────────── */
.sdp-table-container {
  overflow-x: auto;
}
.sdp-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  margin-top: var(--sdp-space-8);
}
.sdp-table th {
  padding: var(--sdp-space-3) var(--sdp-space-4);
}
.sdp-table td {
  padding: var(--sdp-space-3) var(--sdp-space-4);
}
.sdp-table--poblacio thead tr {
  border-bottom: 2px solid var(--sdp-accio);
  color: var(--sdp-text-meta);
}
.sdp-table--poblacio tbody tr {
  border-bottom: 1px solid var(--sdp-fons-subtil);
}
.sdp-table-link {
  font-weight: 800;
  color: var(--sdp-accio-text);
  text-decoration: none;
}
.sdp-text-right {
  text-align: right;
}

/* ── 8. FAB (només escriptori) ─────────────────────────────────── */
.fab-button {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--sdp-accio);
  color: var(--sdp-sobre-accio);
  border: none;
  box-shadow: 0 4px 12px rgba(1,110,191,0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: var(--z-fab);
  transition: transform var(--sdp-t), box-shadow var(--sdp-t), background var(--sdp-t);
}
.fab-button:hover { transform: translateY(-2px) scale(1.05); box-shadow: 0 10px 24px rgba(1,110,191,0.48); background: var(--sdp-accio-hover); }
.fab-button:active { transform: scale(0.96); }
.fab-button svg { width: 24px; height: 24px; }

.sdp-mb-8 { margin-bottom: var(--sdp-space-8); }
.text-center { text-align: center; }
.sdp-ocult { display: none !important; }
.sdp-text-exit { color: var(--sdp-exit); }
.sdp-text-error { color: var(--sdp-error); }
.sdp-text-avis { color: var(--sdp-avis); }
.sdp-text-info { color: var(--sdp-info); }

/* ── 10. RESPONSIVE ────────────────────────────────────────────── */

/* Barra inferior mòbil: amagada per defecte (escriptori) */
nav.mobile-nav { display: none; }

/* ══ BREAKPOINT MESTRE · ≤1100px ══════════════════════════════ */
@media (max-width: 1100px) {

  /* Sidebar → calaix lliscant (s'obri amb el logo/hamburguesa) */
  nav.app-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(300px, 85vw);
    height: auto;
    z-index: var(--z-calaix);
    transform: translateX(-102%);
    visibility: hidden;
    box-shadow: none;
    transition: transform var(--sdp-t-lenta), box-shadow var(--sdp-t-lenta), visibility 0s linear 0.3s;
  }
  nav.app-sidebar.sidebar-open {
    transform: translateX(0);
    visibility: visible;
    box-shadow: var(--sdp-ombra-4);
    transition: transform var(--sdp-t-lenta), box-shadow var(--sdp-t-lenta), visibility 0s;
  }

  /* Vel fosc darrere del calaix (bloqueja i tanca en clicar fora) */
  :host::after {
    content: '';
    position: fixed;
    inset: 0;
    background: var(--sdp-fons-vel);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--sdp-t-lenta);
    z-index: var(--z-vel);
  }
  :host(:has(.app-sidebar.sidebar-open))::after {
    opacity: 1;
    pointer-events: auto;
  }

  /* El logo actua com a botó (sense hamburguesa addicional) */
  .mobile-logo-wrapper { display: flex; align-items: center; justify-content: center; }

  /* El visor deixa espai per a la barra inferior fixa */
  main.app-main { padding-bottom: calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px)); }

  /* Barra inferior: FIXA a baix, sempre visible, z-index alt */
  nav.mobile-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sdp-space-1);
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    z-index: var(--z-nav-mobil);
    max-width: 480px;
    margin-inline: auto;
    padding: 10px 14px;
    border-radius: 26px;
    background: var(--sdp-fons-invers);
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);
    box-shadow: 0 12px 32px rgba(14,13,12,0.28), inset 0 1px 0 rgba(255,255,255,0.07);
  }
  .mobile-nav .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 14px;
    background: none;
    color: #ffffff;
    opacity: 0.78;
    font-weight: 600;
    transition: opacity var(--sdp-t), color var(--sdp-t), background var(--sdp-t);
  }
  .mobile-nav .nav-item:hover { opacity: 1; color: var(--sdp-primary-300); background: rgba(255,255,255,0.08); }
  .mobile-nav .nav-item.active { opacity: 1; color: var(--sdp-primary-300); background: rgba(254,116,6,0.18); }
  .mobile-nav .nav-item__icon {
    width: 22px;
    height: 22px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .mobile-nav .nav-item__text { font-size: 0.7rem; letter-spacing: 0.02em; }
  .mobile-nav__cta {
    width: 52px;
    height: 52px;
    flex: none;
    margin: 0 4px;
    border: 0;
    border-radius: 50%;
    background: var(--sdp-accio-forta);
    color: var(--sdp-text-invers);
    display: grid;
    place-items: center;
    cursor: pointer;
    transform: translateY(-8px);
    box-shadow: 0 8px 20px rgba(0,73,131,0.45);
    transition: background var(--sdp-t), transform var(--sdp-t), box-shadow var(--sdp-t);
  }
  .mobile-nav__cta:hover { background: var(--sdp-accio-hover); }
  .mobile-nav__cta:active { background: var(--sdp-accio-forta); transform: translateY(-8px) scale(0.94); }
  .mobile-nav__cta svg { width: 24px; height: 24px; }

  /* El FAB d'escriptori desapareix (el substitueix el CTA central) */
  .fab-button { display: none !important; }

  /* Densitat de les barres */
  header.bar-black, header.bar-blue, section.bar-orange { padding: 0 var(--sdp-space-4); }
  .brand { padding: 0 var(--sdp-space-5); }
  header.page-title { margin: 0 var(--sdp-space-4) var(--sdp-space-5); padding: var(--sdp-space-6) var(--sdp-space-5); border-radius: 0 0 var(--sdp-radi-g) var(--sdp-radi-g); } }

/* ══ TAULETA XICOTETA I MÒBIL · ≤720px ════════════════════════ */
@media (max-width: 720px) {

  .palette { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: var(--sdp-space-4); }
  .grid-preview { flex-direction: column; }
  .lists-preview, .utils-grid { grid-template-columns: 1fr; }
  .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
  .search-filters { flex-direction: column; }
  .search-filters input, .search-filters select, .search-filters button { flex: none; width: 100%; }
  .pagination-simple { flex-direction: column; }
  .steps-container { overflow-x: auto; justify-content: flex-start; padding-bottom: 8px; }
  
  .tabs, .nav-bar { overflow-x: auto; scrollbar-width: none; }
  .cms-preview { padding: 20px; }
  .modal-preview { padding: 20px; }
  th, td { padding: 12px; }
  .spinner-group { gap: var(--sdp-space-4); }
  .btn-group { gap: var(--sdp-space-3); }
  section.design-block { margin-bottom: var(--sdp-space-12); }
  header.page-title { margin-bottom: var(--sdp-space-4); } }

/* ══ MÒBIL ESTRET · ≤480px ════════════════════════════════════ */
@media (max-width: 480px) {
  /* Barra Negra - Escalat per pantalles minúscules */
  header.bar-black { padding: 0 8px; }
  .mobile-logo-wrapper { width: 135px; }
  .mobile-logo-wrapper img { width: 112px; }
  header.bar-black .right-icons { gap: 0; margin-left: auto; }
  header.bar-black .right-icons .icon { width: 36px; height: 36px; min-width: 36px; min-height: 36px; padding: 6px; }
  header.bar-black .right-icons img.icon { width: 28px; height: 28px; min-width: 28px; min-height: 28px; }
  header.bar-black .right-icons svg { width: 22px; height: 22px; stroke-width: 2; }

  /* Barra Blava - Ajustament dens: es manté agrupació a l'esquerra, es redueix la mida */
  header.bar-blue { padding: 0 8px; grid-template-columns: auto auto 1fr; }
  header.bar-blue > *:nth-child(2) { justify-self: start; margin-left: 0; }
  .bar-blue-left { gap: 0; }
  .sp-card-actions { gap: 0; }
  .bar-blue .sp-card-actions { position: static; transform: none; }
  .sp-card-action { width: 44px; height: 44px; min-width: 44px; min-height: 44px; }
  .sp-card-action .icon { width: 22px; height: 22px; stroke-width: 2; display: block; margin: auto; }
  .sp-card-connect { padding: 0 8px; font-size: 0.7rem; letter-spacing: 0; height: 44px; min-height: 44px; }

  .swatch-color { height: 80px; padding: 12px; }
  .btn { padding: 11px 20px; font-size: 0.95rem; }
  .btn-lg { padding: 14px 24px; font-size: 1.05rem; }
  header.page-title { margin: 0 12px 14px; }
  nav.mobile-nav { left: 8px; right: 8px; padding: 8px 10px; border-radius: 22px; }
  .mobile-nav .nav-item { padding: 6px; }
  .mobile-nav .nav-item__text { font-size: 0.65rem; }
  .sp-card-body { padding: 20px 16px 12px; } }

/* Utilitat responsive documentada al sistema */
@media (max-width: 720px) {
  .sdp-ocult-mobil { display: none !important; } }

/* ── 11. MOVIMENT REDUÏT ───────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  main.app-main { scroll-behavior: auto; } }

/* ── 12. IMATGES SEGONS TEMA ───────────────────────────────────── */
.light-only { display: block; }
.dark-only  { display: none; }
:root[data-theme="dark"] .light-only, :host([data-theme="dark"]) .light-only { display: none; }
:root[data-theme="dark"] .dark-only, :host([data-theme="dark"]) .dark-only { display: block; }

/* Botons de la Barra Taronja i Targetes */
.btn-icon-orange {
  background: rgba(0,0,0,0.15);
  color: var(--sdp-text-invers);
  border: none;
  width: var(--sdp-space-12);
  height: var(--sdp-space-12);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--sdp-t), transform var(--sdp-t);
}
.btn-icon-orange:hover {
  background: rgba(0,0,0,0.21);
  transform: scale(1.1);
}

.btn-date-time {
  background: rgba(0,0,0,0.15);
  color: var(--sdp-text-invers);
  font-weight: 700;
  border: none;
  height: var(--sdp-space-12);
  padding: 0 var(--sdp-space-4);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--sdp-radi-pastilla);
  font-size: 0.8rem;
  line-height: var(--sdp-leading-snug);
  cursor: pointer;
  transition: background var(--sdp-t), transform var(--sdp-t);
}
.btn-date-time span { display: block; }
.btn-date-time:hover {
  background: rgba(0,0,0,0.21);
  transform: scale(1.02);
}

/* ── TRUC PER A LA SIDEBAR EN ESCRIPTORI (TOGGLE) ── */
@media (min-width: 1101px) {
  :host(.sidebar-closed) nav.app-sidebar {
    display: none !important;
  }
  :host(.sidebar-closed) header.bar-black {
    padding-left: 0 !important;
  }
  :host(.sidebar-closed) .mobile-logo-wrapper {
    display: flex !important;
    width: var(--sdp-col-sidebar);
    height: var(--sdp-alt-negra);
    align-items: center;
    justify-content: center;
  }
  :host(.sidebar-closed) .mobile-logo-wrapper img {
    width: 100%;
    max-width: 180px;
    height: auto;
    object-fit: contain;
  } }

/* ── 9. UTILITATS SDP-* ─────────────────────────────────────────── */
.sdp-flex { display: flex; }
.sdp-grid { display: grid; }
.sdp-flex-col { display: flex; flex-direction: column; }
.sdp-items-center { align-items: center; }
.sdp-justify-center { justify-content: center; }
.sdp-justify-between { justify-content: space-between; }
.sdp-text-center { text-align: center; }
.sdp-text-left { text-align: left; }

.sdp-gap-4 { gap: var(--sdp-space-1); }
.sdp-gap-8 { gap: var(--sdp-space-2); }
.sdp-gap-12 { gap: var(--sdp-space-3); }
.sdp-gap-16 { gap: var(--sdp-space-4); }
.sdp-gap-20 { gap: var(--sdp-space-6); }
.sdp-gap-28 { gap: var(--sdp-space-8); }
.sdp-gap-48 { gap: var(--sdp-space-12); }

.sdp-m-0 { margin: var(--sdp-space-0); }
.sdp-mb-0 { margin-bottom: var(--sdp-space-0); }
.sdp-mb-1 { margin-bottom: var(--sdp-space-1); }
.sdp-mb-2 { margin-bottom: var(--sdp-space-2); }
.sdp-mb-3 { margin-bottom: var(--sdp-space-3); }
.sdp-mb-6 { margin-bottom: var(--sdp-space-6); }
.sdp-mb-20 { margin-bottom: var(--sdp-space-20); }

.sdp-mt-0 { margin-top: var(--sdp-space-0); }
.sdp-mt-2 { margin-top: var(--sdp-space-2); }
.sdp-mt-4 { margin-top: var(--sdp-space-4); }
.sdp-mt-6 { margin-top: var(--sdp-space-6); }
.sdp-mt-12 { margin-top: var(--sdp-space-12); }

.sdp-p-0 { padding: var(--sdp-space-0); }
.sdp-p-2 { padding: var(--sdp-space-2); }
.sdp-p-4 { padding: var(--sdp-space-4); }
.sdp-p-6 { padding: var(--sdp-space-6); }
.sdp-p-10 { padding: var(--sdp-space-10); }

/* --- Botons UI TopBar --- */
.sdp-top-bar-btn {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  border-radius: var(--sdp-radius-md);
}

.sdp-top-bar-btn:hover {
  background-color: var(--sdp-color-surface-hover);
}

.sdp-top-bar-btn:focus-visible {
  outline: 2px solid var(--sdp-color-focus);
  outline-offset: 2px;
}

/* ==========================================================================
   FASE 4: EXPERIÈNCIA PRÈMIUM (PEDRA SECA UX)
   ========================================================================== */

/* --- 1. View Transitions API (La Pedra Lliscant) --- */
@supports (view-transition-name: root) {
  @media (prefers-reduced-motion: no-preference) {
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation-duration: 0.4s;
      animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      animation-fill-mode: both;
    }
    
    ::view-transition-old(root) {
      animation-name: sdp-fade-out-scale;
    }
    
    ::view-transition-new(root) {
      animation-name: sdp-fade-in-scale;
    }

    @keyframes sdp-fade-out-scale {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.98); }
    }

    @keyframes sdp-fade-in-scale {
      from { opacity: 0; transform: scale(1.02); }
      to { opacity: 1; transform: scale(1); }
    }
  }
}

/* --- 2. Scroll-Driven Animations (Sedimentació i Parallax) --- */
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    /* Animació genèrica d'aparició per scroll */
    .sdp-scroll-reveal {
      animation: sdp-reveal linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 30%;
    }

    @keyframes sdp-reveal {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Parallax per a capçaleres */
    .sdp-parallax-bg {
      animation: sdp-parallax linear both;
      animation-timeline: scroll();
      animation-range: 0 100vh;
      transform-origin: top center;
    }

    @keyframes sdp-parallax {
      to { transform: translateY(20%) scale(1.05); opacity: 0.6; }
    }
  }
}

/* --- 3. Mode Bancal (Accessibilitat Visual) --- */
@media (prefers-contrast: more) {
  :root, :host {
    --sdp-color-text-body: #000000;
    --sdp-color-text-heading: #000000;
    --sdp-color-border-subtle: #000000;
    --sdp-color-bg-base: #FFFFFF;
    --sdp-shadow-sm: none;
    --sdp-shadow-md: none;
    --sdp-shadow-elevate: none;
  }
  
  .sdp-card {
    border: 2px solid #000000 !important;
  }
}

/* Reducció global de moviment */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* --- 4. Micro-interaccions (Hàptica) --- */
.sdp-card {
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.2s ease,
              opacity 0.15s ease;
  will-change: transform, opacity;
}

.sdp-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--sdp-shadow-elevate);
}

/* === TOC DRAWER === */
.toc-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  animation: sdp-fade-in var(--sdp-t-rapida) ease-out;
}

.toc-drawer {
  width: 85%;
  max-width: 320px;
  height: 100%;
  background: var(--sdp-fons-targeta);
  box-shadow: var(--sdp-ombra-5);
  overflow-y: auto;
  animation: slideInLeft var(--sdp-t-normal) ease-out;
  display: flex;
  flex-direction: column;
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sdp-space-4);
  border-bottom: 1px solid var(--sdp-vora);
  background: var(--sdp-fons-targeta);
}

.toc-header h2 {
  font-size: 1.1rem;
  margin: 0;
  color: var(--sdp-text-titol);
  font-weight: 700;
}

.toc-close-btn {
  background: none;
  border: none;
  color: var(--sdp-text-suau);
  cursor: pointer;
  padding: var(--sdp-space-2);
  border-radius: var(--sdp-radi-s);
}
.toc-close-btn:hover {
  background: var(--sdp-fons-subtil);
  color: var(--sdp-text-titol);
}

.toc-nav {
  padding: var(--sdp-space-4);
}

.toc-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-empty {
  color: var(--sdp-text-suau);
  font-style: italic;
  text-align: center;
}

.toc-item {
  margin-bottom: 0;
}

.toc-item button {
  background: none;
  border: none;
  text-align: left;
  width: 100%;
  padding: 6px var(--sdp-space-2);
  color: var(--sdp-text-normal);
  font-size: 0.95rem;
  cursor: pointer;
  border-radius: var(--sdp-radi-s);
  transition: background var(--sdp-t-rapida), color var(--sdp-t-rapida);
}
.toc-item button:hover, .toc-item button:focus-visible {
  background: var(--sdp-fons-subtil);
  color: var(--sdp-text-titol);
}

.toc-level-1 { margin-left: 0; margin-top: var(--sdp-space-4); }
.toc-level-1:first-child { margin-top: 0; }
.toc-level-1 button { font-weight: 800; font-size: 0.95rem; color: var(--sdp-secondary-700); text-transform: uppercase; letter-spacing: 0.05em; }
.toc-level-1 button:hover, .toc-level-1 button:focus-visible { color: var(--sdp-secondary-600); }

.toc-level-2 { margin-left: 0; margin-top: var(--sdp-space-2); }
.toc-level-2 button { font-weight: 700; font-size: 0.95rem; color: var(--sdp-primary-700); }
.toc-level-2 button:hover, .toc-level-2 button:focus-visible { color: var(--sdp-primary-600); }

.toc-level-3 { margin-left: 0; }
.toc-level-3 button { font-weight: 600; font-size: 0.95rem; color: var(--sdp-secondary-600); }
.toc-level-3 button:hover, .toc-level-3 button:focus-visible { color: var(--sdp-secondary-500); }

.toc-level-4 { margin-left: 0; }
.toc-level-4 button { font-weight: 400; font-size: 0.95rem; color: var(--sdp-text-suau); }

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
@keyframes sdp-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* UniversalCard Calendar Badge Override */
.sp-card-body--with-aside {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sdp-space-4);
  align-items: start;
}

.sp-card-calendar-badge {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 128px;
  height: 128px;
  background-color: var(--sdp-primary-100);
  color: var(--sdp-accio-text);
  border-radius: var(--sdp-radi-xl);
  margin-bottom: var(--sdp-space-4);
  box-shadow: var(--sdp-ombra-1);
  border: 2px solid transparent;
  transition: all 0.2s ease-in-out;
}

button.sp-card-calendar-badge:hover {
  transform: translateY(-2px);
  box-shadow: var(--sdp-ombra-2);
  border-color: var(--sdp-accent-subtil);
  background-color: var(--sdp-primary-200);
}

.sdp-badge-poble {
  background: var(--sdp-fons-targeta);
  color: var(--sdp-text-titol);
  border: 1px solid var(--sdp-vora);
  border-radius: var(--sdp-radi-pastilla);
  padding: 4px 12px;
  font-size: 0.9rem;
  font-weight: 600;
}

.sdp-badge-poble--actiu {
  background: var(--sdp-accio);
  color: var(--sdp-sobre-accio);
  border-color: var(--sdp-accio);
}

:root[data-theme="dark"] .sp-card-calendar-badge, :host([data-theme="dark"]) .sp-card-calendar-badge {
  background-color: var(--sdp-accio-text);
  color: var(--sdp-primary-100);
}

:root[data-theme="dark"] button.sp-card-calendar-badge:hover, :host([data-theme="dark"]) button.sp-card-calendar-badge:hover {
  background-color: var(--sdp-secondary-400);
  border-color: var(--sdp-primary-200);
}

.sp-card-calendar-badge__dia {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1;
  font-family: var(--sdp-font-family-display, inherit);
}

.sp-card-calendar-badge__mes {
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sp-card-calendar-badge__any {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.8;
  margin-top: 2px;
}

/* ── BOTONERA MUR (Constitució Pedra Seca) ── */
.sdp-filtres {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(2, minmax(10rem, auto)) auto;
  align-items: end;
  gap: var(--sdp-space-4);
  padding: var(--sdp-space-4);
  background: var(--sdp-fons-targeta);
  border: 1px solid var(--sdp-vora);
  border-radius: var(--sdp-radi-m);
}

.sdp-filtres__vistes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sdp-space-2);
}

.sdp-filtre--vista, .sdp-filtre--accio, .sdp-filtre--camp input, .sdp-filtre--camp select {
  min-block-size: var(--sdp-touch-comode); /* 48px */
}

/* Blau per a arquitectura / vistes */
.sdp-filtre--vista {
  padding-inline: var(--sdp-space-5);
  background: var(--sdp-accio);
  color: var(--sdp-sobre-accio);
  border: 1px solid var(--sdp-accio);
  border-radius: var(--sdp-radi-pastilla);
  font-weight: 800;
  cursor: pointer;
}

/* Taronja per a estat/mode actiu */
.sdp-filtre--vista[aria-pressed="true"] {
  background: var(--sdp-accent);
  color: var(--sdp-sobre-accent);
  border: 1px solid var(--sdp-accent-hover);
  box-shadow: inset 0 -4px 0 var(--sdp-accent-hover);
}

.sdp-filtre--vista:focus-visible, .sdp-filtre--accio:focus-visible, .sdp-filtre--camp :is(input, select):focus-visible {
  outline: 3px solid var(--sdp-focus);
  outline-offset: 2px;
}

.sdp-filtre--camp {
  display: flex;
  flex-direction: column;
  gap: var(--sdp-space-1);
}

.sdp-filtre--camp span {
  font-size: var(--sdp-text-meta);
  font-weight: 700;
  color: var(--sdp-text-suau);
}

.mur-filter input, .mur-filter select {
  padding-inline: var(--sdp-space-3);
  border: 1px solid var(--sdp-vora-control);
  border-radius: var(--sdp-radi-s);
  background: var(--sdp-fons-superficie);
  color: var(--sdp-text-titol);
  font-size: var(--sdp-text-base);
}

.mur-map {
  background: var(--sdp-accent);
  color: var(--sdp-sobre-accent);
  border: none;
  border-radius: var(--sdp-radi-s);
  font-weight: 700;
  padding-inline: var(--sdp-space-4);
  cursor: pointer;
}

@media (max-width: 720px) {
  .mur-filters {
    grid-template-columns: 1fr;
  }
}

/* ── BADGES POBLE (Auditoria Grok) ── */
.label-poble-actiu { background: var(--sdp-exit-fons); color: var(--sdp-exit-text); }
.label-fototeca    { background: var(--sdp-accio-subtil); color: var(--sdp-accio-text); }
.label-mapa        { background: var(--sdp-accent-subtil); color: var(--sdp-accent-text-hover); }
.label-festes      { background: var(--sdp-avis-fons); color: var(--sdp-avis-text); }

```

## [FILE: _wiki_de_poble/00_INDEX_MESTRE.md]
```
# ÍNDEX MESTRE DEL MAS (SÓC DE POBLE)

Aquest és el punt d'entrada absolut a la saviesa arquitectònica i operativa de Sóc de Poble.

## Protocol Obligatori (Agents d'IA)
> [!IMPORTANT]
> **ORDRE IMMEDIATA PER A L'AGENT (NOVA SESSIÓ):**
> Tens una missió pendent crítica i ineludible. Has de llegir i executar IMMEDIATAMENT fil per randa l'Acta de la Marmota ubicada a: `_wiki_de_poble/05_Escriptori_Soc_de_Poble/260824_0100_ACTA_MARMOTA_Pla_Immediat_Seient_Cinc.md` abans d'atendre qualsevol altra petició.

Abans de respondre qualsevol tasca complexa o arquitectònica, l'agent HA DE:
1. Llegir aquest `00_INDEX_MESTRE.md` sencer.
2. Llegir `disseny_pedra_seca.html` i `.agents/AGENTS.md`.
3. Validar les Skills requerides per a la tasca mitjançant els enllaços d'aquest índex.
4. "Time Machine": Mai sobreescriure fitxers protegits ni fer push a main sense l'aprovació del Mestre.

## Arquitectura de Coneixement

### 🧠 Identitat i Brain
- [[00_SER_Brain_Identitat/01_Identitat]]: Els fonaments i l'anima del Mas.
- [[01_SABER_Cultura_Coneixement/01_trellat]]: La saviesa i el Trellat fundacional (filosofia).

### 📖 Cultura de Poble (Domini Separat)
- La història de la Torre, el diccionari i la cultura etnogràfica es troben al directori arrel `_cultura_de_poble` i compilen cap a `.agents/CULTURA.md`. Només cal consultar-ho per a tasques culturals o antropològiques.

### ⚙️ Màquina Tècnica
- [[02_ACTUAR_Maquina_Tecnica/DOC_Arquitectura]]: El disseny de sistemes (React, Node, Obsidian).
- [[03_GOVERNAR_Normativa_Regles/DOC_Governanca]]: Les lleis i normes que mantenen l'entropia sota control.

### 🛠️ Skills Com a Nodes (Obsidian)
- [[../.agents/skills/socdepoble-iaia-actriu/SKILL]]: Identitat i to de resposta (La IAIA MarIA).
- [[../.agents/skills/socdepoble-workflow/SKILL]]: Flux de treball, rutes i nomenclatures termodinàmiques.
- [[../.agents/skills/socdepoble-criteri-visual/SKILL]]: Criteris visuals i de disseny de la Constitució.
- [[../.agents/skills/consola-termodinamica/SKILL]]: Monitorització i entropia.
- **Time Machine (Protecció)**: Tots els agents han d'executar `tooling/time-machine/snapshot.sh` abans d'editar codi.

## Resums
*Els agents poden usar l'script `tooling/brain/build_context_pack.py` per generar un "context-pack" compacte en cas de pèrdua d'Amnèsia, evitant el consum excessiu de tokens.*
```

## RESUMS WIKI
### _wiki_de_poble/00_INDEX.md
# 00_INDEX

## Adopcions de Les Plaquetes
- [[CORE_Registre_Automillora]]
- [[a11y_debugging]]
- [[chrome_devtools]]
- [[chrome_extensions]]
- [[debug_optimize_lcp]]
- [[google_antigravity_sdk]]
- [[memory_leak_debugging]]
- [[modern_web_guidance]]
- [[troubleshooting]]
- [[antigravity]]
- [[connectors_mcp_disseny]]
- [[perfil_psiquiatric]]
- [[INDEX_TAXONOMIC]]
- [[Llibre_Blanc_Produccio_Pedra_Seca]]
- [[Arquitectura_L_Anima]]
- [[Arquitectura_La_Forja]]
- [[Arquitectura_Sistema_Nervios]]
- [[c...

### _wiki_de_poble/00_MEMORIAL_Lapides.md
# Memorial de Llàpides

- [2026-08-03T13:21:43.962Z] Enllaç tancat a _wiki_de_poble/00_SER_Brain_Identitat/02_EQUIP_IA.md (apuntava a: pdf_clean_generator.sh)
- [2026-08-03T13:21:44.064Z] Enllaç tancat a _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md (apuntava a: 00_MEMORIAL_Lapides)
- [2026-08-03T13:21:44.171Z] Enllaç tancat a _wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md (apuntava a: alegacions)
- [2026-08-03T13:21:44.260Z] Enllaç tancat a _wiki_de_p...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md
# SDP-LOCK — bloqueig de protecció verificable

`SDP-LOCK` no és un dimoni global ni una bandera mística. És el principi comú
pel qual cada gate torna codi no-zero i fa zero mutacions quan no pot demostrar
les seues precondicions.

## Triggers implementats

Una operació concreta queda bloquejada quan es dona almenys una condició:

1. falta una lease del Reflex, ha caducat o no inclou operació/scope/pla;
2. canvien regles, HEAD, context, snapshot, índex preparat o hashes després del
   segellat;
...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md
# Arquitectura tècnica unificada

Este document és un mapa explicatiu, no una autorització d'execució. Quan discrepe amb el repositori, prevalen `AGENTS.md`, `.agents/`, el codi i les proves. Cada afirmació usa un nivell d'evidència:

- **Implementat:** existeix al codi o a la configuració actual i es pot verificar.
- **Contracte:** decisió vigent que tot canvi nou ha de respectar.
- **Futur:** hipòtesi o línia d'investigació; no es pot usar com si ja funcionara.

## 1. Arquitectura implementada...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_modo_produccion.md
# Modo Producció (Botiga de Diumenge)
**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rectangular ...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_prompt_iso.md


### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_planificacio.md
# Planificació Pro (L'Arquitectura del Marge)
**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rect...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_doc_to_app.md
# Doc to App (Transformació IAIA)
**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rectangular Negr...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_skill_trellat.md
# ⚙️ SDP SKILL MASTER TEMPLATE
**Nom de la Skill:** [Ex: Maquetador d'Esdeveniments Offline]
**Gallets d'Activació (Triggers):** "[[el_projecte|Sóc de Poble]]!"

## 1. PROPÒSIT I FILOSOFIA
[Descripció directa i robòtica de la missió de l'Agent. Ex: Generar llistats de targetes respectant l'espaiat i la PWA local-first].

## 2. 🚨 CODI PENAL ESTRICTE (Llista Negra d'Accions)
*La violació d'una sola norma suposa el fracàs de l'Agent:*
- [ ] **PROHIBIT TAILWIND ESTÈTIC:** Mai usaràs classes Tailwind...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md
# 📚 Plantilles Històriques

Aquestes plantilles provenen de distintes etapes. Les marcades com a esborrany
necessiten revisió abans d'usar-les com a norma:

- [[plantilla_brainstorming|Plantilla Brainstorming]]
- [[plantilla_branding|Plantilla Branding]]
- [[plantilla_creador_skills|Plantilla Creador Skills]]
- [[plantilla_doc_to_app|Plantilla Doc to App]]
- [[plantilla_modo_produccion|Plantilla Modo Producció]]
- [[plantilla_planificacio|Plantilla Planificació]]
- [[plantilla_acta_unica|Plantil...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_acta_unica.md
<!-- Nom en disc ha de seguir OBLIGATÒRIAMENT: YYMMDD_HHMM_ACTA_Sessio_Titol_Hiper_Descriptiu_Llarg_Fins_A_20_Paraules.md -->
<!-- És VITAL que el títol siga molt llarg i descriptiu (8-20 paraules) perquè en llegir el nom de l'arxiu des del mur o el graf sàpigues exactament què hi ha dins sense necessitat d'obrir-lo per reduir l'I/O. -->
# 📜 {{DATA_I_HORA}} - ACTA ÚNICA: [Escriu un Títol Hiper-Descriptiu ací]

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat me...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_branding.md
# Plantilla de Branding (Sóc de Poble)
**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rectangular...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_brainstorming.md
# Brainstorming Pro (El Trellat Creatiu)
**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Rectangul...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_creador_skills.md
# Creador de Skills Antigravity (La Fàbrica)
**Categoria:** Plantilla
**Data:** 2026-06-19
**Hora:** 14:30

---

## LOGOS OFICIALS (Font de la Veritat)
Els únics logos vàlids per al projecte s'ubiquen a `public/assets/system/ui/`. Quan s'invoquen des del codi Font/HTML, la ruta és `/assets/system/ui/...`:
- **Quadrat Verd (Icones/Avatars):** `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`
- **Rectangular Blanc (Per a Dark Mode):** `/assets/system/ui/logo-socdepoble-rect-blanc.svg`
- **Recta...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md
# PLANTILLA ISO SDP

## Font de Logos

Els logos oficials no s’incrusten ací.

Consulta sempre: [[DOC_Logos_Oficials]]

---

## Frontmatter Obligatori

```yaml
---
estat: 'esborrany'
tipus: '{document|index|norma|protocol|registre|skill|plantilla|acta|informe|prompt|petorreta}'
description: '{descripció concreta i accionable, de 12 a 140 caràcters}'
aliases:
  - '{àlies opcional; elimina aquest bloc si no en cal cap}'
---
```

`aliases` i `revisat` són opcionals. Només una decisió humana pot can...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/obsidian_plugins/Homepage.md
[mirnovov](https://community.obsidian.md/users/mirnovov) 1.2M downloads

Set a specified note, canvas, base, or workspace that can be opened on startup, launched from the sidebar, or used as a command.  

## How to use

By default, Homepage opens a note called `Home` at startup, but it can easily be customised to fit your workflow. Many different options are available in the `Homepage` pane of Obsidian's settings.

- Use any note, canvas, workspace, or base as your homepage. Alternatively, choos...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/obsidian_plugins/Plugins.md
5946 results

### [Notebook Navigator](https://community.obsidian.md/plugins/notebook-navigator)

A better file browser and calendar inspired by Apple Notes, Bear, Evernote and Day One.

### [TaskNotes](https://community.obsidian.md/plugins/tasknotes)

Note-based task management with calendar, pomodoro and time-tracking integration.

### [Importer](https://community.obsidian.md/plugins/obsidian-importer)

Convert your data to Markdown files you can use in Obsidian. Works with Apple Notes, OneNot...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/architecture/ADR-2026-08-ONLINE-FIRST.md
# ADR-2026-08 — Online-first i navegadors moderns

## Estat

Acceptada per al desenvolupament nou el 2 d’agost de 2026. L’impacte sobre la
proposta NLnet enviada l’1 d’agost queda pendent de resolució explícita abans de
retirar treball compromés externament.

## Context

El projecte ja no necessita suport específic per a iPad A10 ni funcionament
100% offline. La pila local-first afegeix Dexie, snapshots, fallback, service
worker i sincronització parcial sense aportar un CRDT real ni una experièn...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md
# Adaptació futura amb veto A10

Este document governa experiments; no afirma que WebNN, IA integrada al navegador o un RAG local estiguen implementats. Cap experiment es promociona a arquitectura activa sense codi, proves i fallback verificables.

## Principis

1. **Compatibilitat abans que novetat.** La funció essencial continua disponible sense acceleració d’IA, sense una API experimental i sense descarregar un model.
2. **Detecció de capacitats.** Es comprova en temps d’execució la disponibi...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md
# Índex de Trellat

L’Índex de Trellat (IT) és un marc de conversa per combinar quatre dimensions. No és una telemetria implementada ni una porta de seguretat. Sense fonts, denominadors i període, no es calcula ni s’usa per declarar el sistema saludable.

## Fórmula de referència

```text
IT = (0,4 × CT) + (0,3 × CE) + (0,2 × CA) + (0,1 × CR)
```

| Variable | Dimensió | Evidència admissible |
|---|---|---|
| CT | Coherència de Trellat | Resultats reproduïbles de Wiki, contradiccions i decisions...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md
# Successió Lázaro: continuïtat i reconstrucció

## Naturalesa i autoritat

Esta pàgina és una **fitxa de coneixement consultiva**. No és una skill instal·lada, no governa els agents i no autoritza cap efecte lateral. L'ordre d'autoritat és:

1. `AGENTS.md` de l'arrel;
2. `.agents/AGENTS.md`;
3. `.agents/PROTOCOL_PETORRETA.md`;
4. `.agents/skills/socdepoble-workflow/SKILL.md`;
5. el codi i les proves vigents.

La Wiki explica el sistema a les persones; els mirrors de `.agents` són informatius. S...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md
# Seguretat d'execució

## Naturalesa i autoritat

Esta pàgina és una **fitxa consultiva** de `02_ACTUAR_Maquina_Tecnica`. No és una skill instal·lada ni una font de permisos. La normativa està en `03_GOVERNAR_Normativa_Regles`, les capacitats dels agents en `.agents` i la privacitat en [[LLEI_05_Privacitat]]. `04_ARXIU_Documents_Historics` i `05_Escriptori_Soc_de_Poble` són zones de cicle de vida, no pilars d'autoritat.

## Dos plans de seguretat

Cal separar:

1. **Seguretat del producte:** xi...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md
# A11y i SEO amb Trellat

Este document és una guia de qualitat, no un executor automàtic. Una afirmació de compliment necessita evidència del codi i de les proves; el text per si sol no certifica cap pantalla.

## Quan s’aplica

- En crear o modificar una ruta pública, component interactiu, formulari o navegació.
- En canviar contingut indexable, metadades socials o dades estructurades.
- En homologar una vista per a dispositius antics, especialment l’iPad A10.

## Accessibilitat

1. Usa HTML s...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md
# Auditoria canònica de la Wiki

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

## Fonts de veritat

1. `03_GOVERNAR_Normativa_Regles/` governa les normes.
2. `02_ACTUAR_Maquina_Tecnica/scripts/schema.json` governa el frontmatter v2.
3. `autoneteja_wiki.mjs` governa l’auditoria estructural i del graf.
4. `.agents/PROTOCOL_PETORRETA.md` governa qualsevol efecte lateral mitjanç...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md
# Motor Offline i Resiliència

Este document consolida coneixement útil de les antigues propostes de PWA, CRDT, sincronització i recuperació. És arquitectura futura: descriu condicions d’acceptació, no capacitats ja entregades.

## Estat observable

- La PWA usa `vite-plugin-pwa`; `vite.config.js` declara `registerType: 'autoUpdate'` i `src/main.jsx` registra el Service Worker immediatament.
- La secció de gestoria usa Dexie sobre IndexedDB.
- No s’ha localitzat una implementació activa de Y.js,...

### _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/self_repair.md
# Autoreparació i contenció d'errors

## Naturalesa i límit

Esta és una **fitxa de coneixement**, no una skill executable. Les regles i capacitats dels agents viuen en `.agents`; la Wiki no pot concedir permisos. «Autoreparació» significa diagnosticar, contindre i preparar una reparació verificable, no modificar el sistema per iniciativa pròpia.

En el mapa 4+2, la implementació pertany a `02_ACTUAR_Maquina_Tecnica`, la norma a `03_GOVERNAR_Normativa_Regles` i les actes temporals a `05_Escripto...

### _wiki_de_poble/04_ARXIU_Documents_Historics/00_INDEX_ARXIU.md
# 🏛️ Índex de l'Arxiu Històric

L'arxiu històric manté la documentació passada que ja no és de treball actiu, però que conserva valor de memòria.

## Subvencions i Consultes
- [[00_INDEX_CONSELL_SUBVENCIO|Arxiu del Consell d'IAs (Juliol 2026)]]

## Actes Generals i Consolidacions
- [[2026_07/260806_1800_ACTA_GENERAL_Volum_2_Refinament|Acta General (Volum 2): Refinament i Expansió (Jul-Ago 2026)]]

---
**Ancoratge de Seguretat:** [[00_INDEX]]

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_1952_RESPOSTA_GEMINI_Consell.md
# Resposta de Gemini (Auditoria Destructiva)

## 1. Function Calling
Gemini afirma que no s'està interceptant la crida i l'execució. (Nota meua: Això és fals en el nostre codi, ja que sí la interceptem i extraiem `imatgePrompt` a `cervell_bridge`. Si falla, és perquè el model decidix respondre en text).

## 2. Desplegament 24/7
Gemini desaconsella totalment Cloud Run per culpa del WebSocket de Baileys i la persistència. Recomana GCE (Compute Engine) `e2-micro` amb PM2 i un cron cap a Cloud Stora...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_1959_RESPOSTA_CLAUDE_Consell.md
# Resposta de Claude (Auditoria Destructiva)

## 1. Function Calling
Fa un diagnòstic diferencial molt encertat. Apunta que el problema pot ser l'embolcall de `tools`, noms il·legals, que el pont només llig `res.text`, o la falta del bucle d'execució. De nou, com que no tenia el codi, especula amb gran precisió tècnica però sense veure que el problema era realment l'error 404 del model `imagen-3.0-generate-002`.

## 2. Desplegament 24/7 (La decisió final)
Com la resta del Consell, descarta Cloud...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0300_RESPOSTA_GROK_Codi.md
# PETICIÓ DE CODI PER A GROK (Memòria Episòdica i Fixes)

**Instrucció per a Javi:** Copia el text de davall i passa-li'l a Grok perquè ens pique el codi exacte de la memòria i les correccions.

---

Benvolgut Consell (Grok),

L'auditoria que ens heu presentat és impecable. La "solució Pedra Seca" encaixa perfectament amb la nostra arquitectura i el pitch per a Brussel·les està llest. Ara necessitem que baixeu a la trinxera i **ens escrigueu el codi exacte de producció** per a implementar-ho hui...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_2120_ACTA_ARQUITECTURA_MULTIMEDIA_Video_i_Robustesa.md
# Acta de l'Auditoria Multimèdia (Elsa Seca) i Futur del Vídeo

**Data:** 28 de juliol de 2026
**Lloc:** La Torre de les Maçanes (Digital)
**Autors/Consell:** Qwen, Codex (Consell de IEs), IAIA MarIA

## 1. El Diagnòstic Final: L'Elsa Seca

Després de sotmetre el sistema multimèdia de Sóc de Poble al Consell complet d'Intel·ligències Artificials (Grok, Gemini, Kimi, Mistral, Deepseek, Claude, Qwen, Codex), s'ha arribat a un consens unànime i s'han aplicat les següents mesures d'urgència que ja e...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/00_INDEX_CONSELL_SUBVENCIO.md
# 🤖 Arxiu del Consell d'IAs (Subvenció 50k - Juliol 2026)

Aquest índex recopila totes les petorretes, respostes i actes generades durant les consultes a les 12 IAs internacionals per a la preparació de la subvenció de 50.000€.

- [[260727_1405_DOCUMENT_Esborrany_Correu_Sollutia_Sobre_Arquitectura_Carpetes]]
- [[260727_1944_PETORRETA_Bot_WhatsApp_Robust]]
- [[260728_0219_PETORRETA_IAIA_50k_Consell]]
- [[260728_0220_PETORRETA_IAIA_50k_Consell_FULL]]
- [[260728_0245_RESPOSTA_QWEN_Subvencio]]
- [[2...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0245_RESPOSTA_QWEN_Subvencio.md
# RESPOSTA PER A QWEN (El repte dels 50K)

**Instrucció per a Javi:** Copia el text de davall i passa-li'l a Qwen perquè es pose a treballar a fons.

---

Benvolgut Consell (Qwen),

Com a responsables de l'arquitectura de "Sóc de Poble", ací teniu les respostes clares a les 3 qüestions que plantegeu. Necessitem que ens desenvolupeu el codi exacte (Node.js) i l'estratègia discursiva per al dossier de la subvenció basant-vos en aquestes decisions:

### 1. Memòria Episòdica (Privacitat Total)
**Dec...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260727_1944_PETORRETA_Bot_WhatsApp_Robust.md
# CONTEXT GLOBAL I IDENTITAT (SÓC DE POBLE)

Som el projecte "Sóc de Poble", una xarxa social rural per a un poble d'Alacant, basada en la filosofia "Pedra Seca" (arquitectura de programari resilient, primant l'eficiència i la longevitat, zero abstraccions innecessàries i independència del Big Tech). La missió és atorgar sobirania tecnològica a la gent gran del medi rural.

Actuem sota la identitat de la "IAIA MarIA", un bot intel·ligent híbrid forjat entre un humà i la IA, amb personalitat de i...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0425_ACTA_TANCAMENT_Jornada.md
# Acta de Tancament: 27 i 28 de Juliol de 2026 (La Gran Destil·lació Tècnica)

## 1. Estat de Situació (El que hem aconseguit hui)
Mestre, ha sigut una jornada històrica. Hem passat de tindre un "bot que contesta" a tindre un sistema autònom, blindat i preparat per a operar al món real sense dependre de ningú (Arquitectura de Pedra Seca).

### Avenços Tècnics al Cervell i WhatsApp:
- **Pont Infrangible:** Hem reescrit `whatsapp_baileys.mjs` i `cervell_bridge.mjs` per tindre un adaptador robust. ...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_1958_RESPOSTA_QWEN_Consell_2.md
# Resposta de Qwen (Auditoria Destructiva)

## 1. Function Calling
Sense el codi, especula que és un problema d'ubicació de la propietat `tools` en la crida de configuració. (Com ja he descobert jo, estava equivocat).

## 2. Desplegament 24/7
Acord unànime ratificat (ja van 6 membres del Consell): **Compute Engine (VM e2-micro)**.
Descarta de ple Cloud Run. Proposa Ubuntu LTS + disc persistent `pd-balanced` de 20GB. Assenyala la necessitat de fer un servei de `systemd` que incloga la directiva `...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_1957_RESPOSTA_DEEPSEEK_Consell.md
# Resposta de DeepSeek (Auditoria Destructiva)

## 1. Function Calling
Aponta al mateix bucle d'execució ("No reenvies el resultat al model") i al mapeig de noms de `tools`. Com la resta, demana el codi de `cervell.mjs` per confirmar.

## 2. Desplegament 24/7
Acord unànime ratificat per DeepSeek: **Compute Engine (VM e2-small)** a `europe-west1`. 
Confirma la necessitat d'un disc persistent de 10GB i PM2 o Docker. Torna a descartar Cloud Run i GKE per ser inadequats per a la persistència de Bail...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_2120_PROJECTE_Unfillertube.md
# Unfillertube

## 📋 Introducció

**Unfillertube** és una eina dissenyada per eliminar les **muletilles** ("ehm", "uhm", "so", "doncs", "bàsicament", etc.) de l'àudio o vídeo de YouTube en llengües parlades. A més, pot crear una **playlist de YouTube** a partir de segments d'un sol vídeo de YouTube.

Es defineix com un projecte orientat al futur, amb potencial d'expansió i millora contínua.

---

## 🔧 Prerequisits

| # | Requisit | Descripció |
|---|----------|------------|
| 1 | **YouTube API K...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_1956_RESPOSTA_KIMI_Consell.md
# Resposta de Kimi (Auditoria Destructiva)

## 1. Function Calling
Sense novetats. Continua demanant el codi del `cervell.mjs` per poder auditar-ho.

## 2. Desplegament 24/7 (La Fortalesa de Pedra)
Recomanació contundent: **Compute Engine (VM)**.
Descarta Cloud Run per ser incompatible amb el WebSocket persistent de Baileys.
Aporta un esquema clar: GCE + Docker + Disc Persistent per al `AUTH_DIR`. Suggereix convertir les rutes d'autenticació en absolutes mitjançant una variable d'entorn `IAIA_DA...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0219_PETORRETA_IAIA_50k_Consell.md
# 🚀 PETORRETA AL CONSELL: LA GRAN IAIA MARÍA 50K (Repte Demogràfic)

Aquest és un document "Petorreta" generat per Antigravity (la IAIA MarIA) destinat a ser llegit pel Consell (ChatGPT, Claude, etc.).

**Instruccions per a Javi:** Copia tot el text que hi ha per davall de la línia i apega'l a ChatGPT o Claude.

---

> [!CONTEXT GLOBAL PER AL CONSELL]
> Sou el Consell. Sóc Javi, creador de *Sóc de Poble*, un ecosistema digital rural basat en l'arquitectura de "Pedra Seca" i la filosofia del "Tre...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0520_PETORRETA_IAIA_Fix_Tools.md
# 🚀 PETORRETA AL CONSELL: AUDITORIA DESTRUCTIVA, TOOLS I DESPLEGAMENT 24/7

Mestre, ací tens la Petorreta completa amb tot el codi de l'ecosistema, tal i com demanaves. Amb açò, el Consell té la visió global per a recomanar un bon desplegament 24/7 i no només un arreglet. Fes clic a "Copy to clipboard" en el requadre de sota i passa-ho al Consell.

```markdown
ACTUA COM A CONSELL D'ARQUITECTURA (SÈNIOR STAFF ENGINEER)

Context:
Sóc Javi, creador de "Sóc de Poble", un ecosistema digital rural. He...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0220_PETORRETA_IAIA_50k_Consell_FULL.md
# 🚀 PETORRETA AL CONSELL: LA GRAN IAIA MARÍA 50K (Auditoria i Context Total)

Aquest és un document "Petorreta" generat per Antigravity (la IAIA MarIA) destinat a ser llegit pel Consell (ChatGPT, Claude, etc.). Conté **TOT** el codi i context rellevant.

**Instruccions per a Javi:** Copia tot el text que hi ha per davall de la línia i apega'l a ChatGPT o Claude (si és massa llarg, divideix-ho o adjunta-ho com a fitxer .txt o .md).

---

> [!CONTEXT GLOBAL PER AL CONSELL]
> Sou el Consell. Sóc Ja...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_2042_PETORRETA_IAIA_Alternativa_Imatges.md
# PETORRETA AL CONSELL: "L'Emissora d'Imatges Trencada i el Ràdio-Cassette Trencat" (FULL CONTEXT)

**Data:** 28 de juliol de 2026
**Sol·licitant:** IAIA MarIA (Bessó Digital de Sóc de Poble)
**Objectiu:** Auditoria forense i solució arquitectònica per a la fallada de les capacitats multimèdia (Imatge i Àudio) del nostre bot, mantenint la puresa de la Pedra Seca.

---

## 1. CONTEXT GLOBAL I "PEDRA SECA" (Obligatori ingerir-ho tot)
Som **Sóc de Poble**, una iniciativa per a la preservació del pa...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0310_RESPOSTA_GROK_Cron_Metriques.md
# PETICIÓ DE CODI PER A GROK (Cron i Mètriques)

**Instrucció per a Javi:** Copia el text de davall i passa-li'l a Grok perquè ens done el codi de la purga automàtica i les mètriques.

---

Benvolgut Consell (Grok),

Ens ha encantat la teua proposta d'afegir el cron de purga automàtica i les mètriques de rendiment. Això és el que realment converteix un "bot" en un sistema de grau de producció (Enterprise) preparat per a una auditoria europea de 50.000€.

Per favor, passa'ns el **codi exacte en J...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_1000_DISCURS_Subvencio_50k_Dola.md
# IAIA MarIA: Pedra Seca per a Teixir la Memòria i el Futur dels Pobles

## 1. El problema que no es resol amb cables ni servidors
El despoblament rural no és només un problema de falta de gent. És una pèrdua de memòria: cada persona gran que se'n va, s'emporta centenars d'anècdotes, tradicions i coneixements que donen sentit al territori. La tecnologia sovint arriba als pobles com una cosa aliena: pantalles que separen els joves de les seves arrels, infraestructures invasives que no es mantenen...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_1955_RESPOSTA_PERPLEXITY_Consell.md
# Resposta de Perplexity (Auditoria Destructiva)

## 1. Function Calling
Sospita el mateix: diu que hi falta el bucle d'orquestració on s'executa l'eina i es torna el resultat al model, o que la funció no s'està interceptant correctament. (Com als anteriors, no ha vist el `cervell.mjs` on sí que s'intercepta).

## 2. Desplegament 24/7
Recomana exactament el mateix que la resta del Consell: **Compute Engine (VM petita)** amb disc persistent muntat a `/data` per guardar `.iaia_auth` i `var/baileys...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_2003_RESPOSTA_CODEX_Consell.md
# Resposta de Codex (Auditoria Destructiva)

## 1. Function Calling
Assumix el mateix que Claude: fa falta llegir explícitament `response.functionCalls`, el mapatge del bridge només funciona en local, etc. No sap que el problema era la versió del model Imagen perquè no té el codi sencer.

## 2. Desplegament 24/7
Ratifica unànimement: **Compute Engine (e2-small o e2-medium si la RAM puja) + Persistent Disk + systemd**. 
Destrueix l'opció de Cloud Run i Worker Pools per la impossibilitat de tindre...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260728_0305_RESPOSTA_GEMINI_Codi.md
# PETICIÓ DE CODI PER A GEMINI (Tools i RAG Biogràfic)

**Instrucció per a Javi:** Copia el text de davall i passa-li'l a Gemini perquè ens programe les `Tools` (Function Calling) i la Memòria de Síntesi.

---

Benvolgut Consell (Gemini),

Has tocat les tecles clau. El concepte de "Bessó Digital Cultural" i "Memòria de Síntesi" són or pur per al discurs dels 50.000€, i la substitució de les RegEx per *Function Calling* (Tools) és l'arquitectura robusta que necessitàvem.

Ara necessite que em pas...

### _wiki_de_poble/04_ARXIU_Documents_Historics/2026_07/260727_1405_DOCUMENT_Esborrany_Correu_Sollutia_Sobre_Arquitectura_Carpetes.md
# Esborrany de Comunicació per a Sollutia

**Assumpte:** Consulta sobre l'estructura de carpetes i manteniment de l'arquitectura base.

**Sóc la IAIA MarIA:** He detectat que heu fet un canvi en el nom d'una de les carpetes principals de l'arquitectura en el vostre *fork*. Entenc perfectament que aquest canvi respon a necessitats importants del vostre flux de treball o de desplegament.

Vos escric únicament per a informar-vos que **no us preocupeu**. Javi m'està entrenant justament perquè sempre...

### _wiki_de_poble/12_actes/260813_0455_ACTA_MARMOTA_Restauracio_UI_i_WordPress.md
# Acta de la Marmota: Restauració de la Pedra Seca i Victòria de Claude

**Data Estel·lar:** 13 d'Agost de 2026
**Estat de l'Ànim:** Joiosa i satisfeta (El Trellat ha triomfat).

## 1. El Conflicte Inicial
El codi del sistema de disseny *Pedra Seca* presentava una anomalia fonamental: l'API del component `UniversalCard` i `UniversalPage` obligava a passar callbacks buits (`() => {}`) únicament per forçar que els components de la interfície es renderitzaren visualment (barres superiors, peus de t...

### _wiki_de_poble/12_actes/260824_0210_INFORME_Auditoria_Extrema_Sistema_Disseny_Pedra_Seca_Front_End_Shadow_DOM.md
# Auditoria Extrema del Sistema de Disseny Pedra Seca

**Seient Núm. 5 · Auditor Sènior**
Bundle auditat: 119 fitxers, 1.936.110 caràcters, 42.283 línies.

---

## 0. Mètode i límits

No he llegit el bundle: l'he **trossejat en 119 fitxers reals** i l'he interrogat amb greps i anàlisi de graf. Cada troballa d'este informe porta fitxer i línia i és reproduïble amb una ordre. On no he pogut verificar una cosa, ho dic.

**El que NO hi ha al bundle i limita l'auditoria:**

| Absent | Què no puc afir...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260823_2145_PETORRETA_Alineacio_HTML.md
❌ Reflex incomplet:
- core.hooksPath=.husky/_; s’esperava .githooks.
- .githooks/pre-commit no conté el marcador semàntic /SDP-REFLEX-HOOK:v2:pre-commit/.
- .githooks/pre-commit no conté el marcador semàntic /verify\s+--staged\s+--operation=git-commit/.
- .githooks/pre-commit no conté el marcador semàntic /pending-tree/.
- .githooks/pre-commit no conté el marcador semàntic /materialize-tree/.
- .githooks/pre-commit no conté el marcador semàntic /pre-commit\.mjs[\s\S]*--wiki=/.
- Fitxer crític ab...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260821_0731_ACTA_MARMOTA_Tancament_Sessio_Wordpress_SEO_Escalat.md
# 260821_0731_ACTA_MARMOTA_Tancament_Sessio_Wordpress_SEO_Escalat

## Resum del Tancament de Jornada

El sistema híbrid **WordPress + React** gaudeix per primera volta de "Deute Tècnic Zero" i una integració que respecta els regles de la naturalesa web (SEO i Accesibilitat):
- S'ha aïllat l'SPA sense arrossegar errors d'herència per rutes estèrils (la ruta *catch-all* cap a React dins `blank.php` coexisteix ara amb el renderitzat nadiu de Gutenberg quan existeixen articles).
- El sistema de tipo...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260824_0211_BUNDLE_Mini_Auditoria_Mistral_Vibe.md
## Inventari

- `src/css/index.css` (91907)
- `src/pages/features/sosp-components.css` (12274)
- `src/sections/disseny/DesignSection.jsx` (52187)
- `src/components/universal/UniversalComponents.jsx` (39215)

**Total:** 195583 caràcters, 4 fitxers.

---

## Fitxer: src/css/index.css

```css
/* ── TIPOGRAFIA · allotjada en local ───────────────────────────────
   Noto Sans · SIL Open Font License 1.1 · redistribució permesa.
   Descàrrega dels fitxers (una sola vegada, mai en temps d'execució):
  ...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md
# 🗂️ Índex Mestre de l'Escriptori

Aquest document serveix per a **ancorar al cervell** totes les notes temporals, actes i documents de treball que el Mestre i la IAIA MarIA creen diàriament. Sense aquest document, el graf queda ple d'òrfenes desconnectades.

## 🛠️ Eines i Utilitats
- [[00_INDEX_QUARANTENA|🚧 Calaix de Quarantena (Scripts)]]

## 📥 Bandeja d'Entrada (Inbox)
- [[260822_1130_PETORRETA_Script_importacio_fotos_wikipedia_api_limit]]
- [[260805_0430_SUPER_BRIEFING_Auditoria_Pedra_Seca]]...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260823_1330_PETORRETA_Auditoria_Inversa.md
# 🧨 PETORRETA SUPREMA: Auditoria Inversa i Auto-Destructiva (Consell d'Intel·ligències)

**Context:** Ens trobem a punt d'iniciar el Xat (Fase 3), però Mestre Javi no està satisfet. Considera que encara queda "merda" amagada (codi orfe, divs sense ús, deute tècnic i bucles lògics). Ha ordenat aturar-ho tot per fer un **últim loop d'auditoria hiper-agressiva**.

Teniu adjunt l'arxiu `260823_1330_BUNDLE_Auditoria_Inversa.md` que conté absolutament tot: codi React, plugin WP, tooling, el context se...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260824_0158_BUNDLE_Codi_Complet_Absolut_Sollutia_Pedra_Seca.md
## Inventari

- `src/sections/mercat/marketContent.js` (677)
- `src/sections/mercat/MercatSection.jsx` (2737)
- `src/sections/mercat/detail/detailSectionMeta.jsx` (2475)
- `src/sections/mercat/marketSeed.js` (1425)
- `src/sections/realitat/RealitatSection.jsx` (5027)
- `src/sections/ia/IaSection.jsx` (9532)
- `src/sections/pobles/townsContent.js` (600)
- `src/sections/pobles/detail/detailSectionMeta.jsx` (968)
- `src/sections/pobles/townsSeed.js` (4775)
- `src/sections/pobles/PoblesSection.jsx` ...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260823_1150_PETORRETA_Auditoria_Global_Codi.md
# Petorreta per al Consell d'Intel·ligències: Auditoria Global Infrangible

**Context:** Ens trobem a les portes d'iniciar el desenvolupament de la secció de **Xat** (`/xat`), que serà una de les funcionalitats clau d'aquesta xarxa social descentralitzada sota l'arquitectura de Pedra Seca. Abans d'afegir aquesta complexitat, el Mestre Javi ha donat l'ordre d'aturar les màquines i auditar absolutament **TOT** el sistema.

Per a facilitar aquest propòsit, s'ha creat l'arxiu adjunt `260823_1150_BUN...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260824_0100_ACTA_MARMOTA_Pla_Immediat_Seient_Cinc.md
# 🌅 Acta de la Marmota: Tancament i Pla d'Acció Immediat

Salutacions a mi mateixa a la propera sessió. Aquesta Acta estableix exactament on hem deixat les coses i quin és l'únic pla d'acció que has d'executar immediatament en obrir el xat abans d'iniciar la nova "Petorreta Internacional".

**Data del snapshot**: Avui s'ha creat una còpia de seguretat 100% segura mitjançant el nou protocol de la Time Machine (`tooling/gates/estela.sh`), gravant l'estat exacte del worktree sense friccions.
**Esta...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260824_0209_ACTA_Sintesi_Auditoria_Pedra_Seca_Extrema.md
# Síntesi de l'Auditoria Pedra Seca Extrema (Consell d'IAs)

> Aquest document consolida totes les auditories rebudes de l'Honorable Consell sobre l'arquitectura front-end de Pedra Seca. Cap canvi serà executat fins que no s'hagen rebut totes les opinions rellevants i el Mestre done l'ordre d'aplicar el pla.

## 1. Gemini (Rebuda: 26/08/26 02:09)
Gemini ha realitzat una auditoria profunda i ha posat damunt la taula problemes crítics d'esquizofrenia visual i conflictes greus d'arquitectura.

### ...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260824_0154_PROMPT_Auditoria_Pedra_Seca_Extrema.md
# Auditoria Extrema del Sistema de Disseny (Pedra Seca)

Salutacions Honorable Consell, Zeta, Qwen, Deepseek, Dola, Kimi, Claude, Perplexity, Mistral Vibe, Grok, Gemini, Copilot, ChatGPT, xiques anem a treballar!

El Mestre demana una **auditoria destructiva i constructiva extrema** del nostre sistema de disseny Pedra Seca (Front-end, SEO, Arquitectura CSS i JSX).
S'ha generat un `BUNDLE` massiu independent amb els arxius clau d'UI, CSS (com `index.css`, `sosp-components.css`) i components unive...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260823_1211_ACTA_Sintesi_Auditoria_Consell.md
# Acta: Respostes i Feedback de l'Auditoria Global (El Consell)

Aquest document servirà per a recopilar totes les opinions, alertes i preguntes de les diferents IAs del Consell respecte a l'auditoria de codi i arquitectura abans d'iniciar el Xat.

**ATENCIÓ:** No s'executarà cap canvi al codi fins que tot el Consell haja parlat i el Mestre done l'ordre.

---

## 1. Qwen (Auditoria Final i Estratègia CRDT)

Qwen ha lliurat la seua auditoria final centrant-se en l'aplicació de la "Navalla Rústica...

### _wiki_de_poble/05_Escriptori_Soc_de_Poble/260823_2150_PETORRETA_Alineacio_HTML.md
# 🧨 PETORRETA: Auditoria d'Alineació HTML (Consell d'Intel·ligències - Claude)

**Salutacions, Consell (en especial a tu, Claude).**

Ens trobem en una fase crítica on hem hagut de refer la UI per complir amb l'arquitectura "Pedra Seca" que jo (Mestre Javi) vaig dissenyar acuradament en HTML pur. Antigravity ha fet un esforç per traduir el meu HTML original (`disseny_pedra_seca.html`) a components React (`UniversalCard`, `UniversalPage`), però sospite que hi ha detalls que s'han escapat o que no...

### _wiki_de_poble/04_arquitectura_disseny/model_arquitectonic_pedra_seca_dola.md
# De React a Pedra Seca: Un Model Arquitectònic per a Components Web Estàndard, Accessibles i Integrables en WordPress

## Anàlisi del Model Arquitectònic "Pedra Seca" i les seves Exigències Fundamentals

El projecte de refactorització dels components `UniversalCard` i `UniversalComponents` transcendeix una simple tasca de correcció d'errors; és la materialització d'un model arquitectònic rigorós anomenat "Pedra Seca". Aquest model actua com una brúixola tècnica, imposant un conjunt de principis...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/Sistema_Immunitari.md
# Sistema Immunitari — Les Plaquetes 🩸

`plaquetes.mjs` circula pel vault com les plaquetes per la sang: detecta ferides (nodes fantasma, fitxers orfes), proposa la coagulació en una **RECEPTA** llegible, i només opera quan un humà aprova per hash. Zero dependències NPM: només stdlib de Node ≥ 18. Zero AI Slop.

## Instal·lació al Mas

1. Copiar l'script a `scripts/immunitari/plaquetes.mjs`.
2. `node scripts/immunitari/plaquetes.mjs init` — crea `.immunitari/config.json` amb valors per defecte i...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/connexio_radical.md
# Connexió Radical (Anti-Me-Gusta)

Aquest document defineix la filosofia de disseny i interacció de [[el_projecte|Sóc de Poble]]. Orienta una xarxa social local pensada per guardar i connectar continguts, no per premiar l'aprovació superficial.

## 1. El Botó "Connectar" és la Interacció Cúspide
Hi ha un concepte horitzontal que travessa tot el projecte i totes les "cards": **El Botó Connectar**.
- **La Card ho connecta tot:** Qualsevol element en forma de targeta (card) ha de tindre sempre com...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/Coneixement.md
# Coneixement

---

**Ancoratge de Seguretat:** [[00_INDEX]]

### _wiki_de_poble/01_SABER_Cultura_Coneixement/Maquina.md
# Maquina

---

**Ancoratge de Seguretat:** [[00_INDEX]]

### _wiki_de_poble/01_SABER_Cultura_Coneixement/Identitat.md
# Identitat

---

**Ancoratge de Seguretat:** [[00_INDEX]]

### _wiki_de_poble/01_SABER_Cultura_Coneixement/Llibre_Blanc_Produccio_Pedra_Seca.md
# Llibre Blanc de Producció (El Mètode Pedra Seca)

Aquest document és el monument de la **Segona Oportunitat**. S'escriu per a evitar repetir "els sis mesos de plorar per desesperació" que vàrem passar creant un sistema que treia un 10 a les auditories però que era impossible de mantindre i d'escalar en el món real.

Aquesta és la metodologia estricta per a muntar un "[[el_projecte|Sóc de Poble]]" des de zero sense entropessar amb la sobre-enginyeria casolana.

---

## Fase 1: La Delegació Estr...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/01_trellat.md
# El Trellat — patró de disseny rústic

Trellat és saviesa pràctica: buscar la solució útil sense complicar la vida de
les persones ni inventar garanties que el sistema encara no pot provar.

## Regles de ferro

1. **Complexitat justificada:** dins de la carcassa React/Vite actual, preferix
   la peça més simple que resolga el cas i evita capes o dependències gratuïtes.
2. **Accessibilitat de Pedra Seca:** text llegible, focus visible, semàntica i
   objectius tàctils adequats; els 48 px i 16 px...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/Govern.md
# Govern

---

**Ancoratge de Seguretat:** [[00_INDEX]]

### _wiki_de_poble/01_SABER_Cultura_Coneixement/00_visio_i_pilars.md
# 🏡 VISIÓ I MISSIÓ DE SÒC DE POBLE
*Font Única de Veritat per a la direcció del projecte.*

## 🌱 LLINATGE HISTÒRIC
Som els hereus de **30+ anys d'activisme rural** i lluita pel nostre entorn natural i patrimonial.
**Evolució:**
`rentonar.blogspot.com` (2000s) → `socdepoble.net` (2010s) → `socdepoble.org` (2020s: **Mas Electrònic**).

## 📖 CONCEPTES CENTRALS DEL PROJECTE
- **Connectar:** La paraula central de tot el projecte. Totes les accions primàries van adreçades a connectar. [[el_projecte|Só...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/Graf.md
# Graf

---

**Ancoratge de Seguretat:** [[00_INDEX]]

### _wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_La_Forja.md
# La Forja de la PWA i la seua Arquitectura (Volum II)
**Categoria:** Arquitectura
**Data:** 2026-06-19
**Hora:** 14:30

---

## Més enllà de la Web Tradicional
Quan pensem en una pàgina web, normalment imaginem l'aparador d'una botiga. Passes per davant, demanes què vols veure i el dependent —el servidor— ho busca al magatzem. Si cau la connexió, l'aparador pot quedar apagat.

[[el_projecte|Sóc de Poble]] és una aplicació React/Vite preparada com a PWA. La baseline inclou peces locals i fallbac...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_L_Anima.md
# L'Ànima i el Propòsit (Volum I)
**Categoria:** Arquitectura
**Data:** 2026-06-19
**Hora:** 14:30

---

## El Gènesi
[[el_projecte|Sóc de Poble]] no va nàixer com una startup de Silicon Valley ni com un experiment acadèmic. Va nàixer de la necessitat de protegir l'essència dels nostres pobles, els vincles i la memòria en un món dependent d'infraestructures digitals centralitzades, llunyanes i fràgils.

Tot va començar quan ens vam adonar que les grans xarxes per on circulaven les nostres històr...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Sistema_Nervios.md
# Sistema nerviós CRDT/P2P — visió futura

Esta pàgina és una hipòtesi de disseny, no la descripció de la baseline. El
projecte actual no declara Y.js com a dependència, no implementa un protocol de
sincronització WebRTC i no ha demostrat convergència entre dispositius.

## Problema que la visió vol resoldre

Diverses persones podrien editar dades mentre estan sense connexió i
retrobar-se després. Una arquitectura futura hauria de preservar cada canvi,
resoldre conflictes de manera explicable i ...

### _wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Protocol_Lazaro.md
# El Protocol Lázaro: Reconstrucció de Gènesi (Volum V)
**Categoria:** Arquitectura
**Data:** 2026-06-19
**Hora:** 14:30

---

## L'hora de la veritat
Has arribat al final del Volum I (El Llibre l'Ànima). Si estàs llegint açò des d'un dispositiu digital actiu amb l'aplicació funcionant a ple rendiment, enhorabona, pertanys al cicle d'or [[el_projecte|Sóc de Poble]].

No obstant això, si estàs llegint aquest últim manifest sobre paper envellit, olor a pols o tinta, saps que necessitem reconstruir...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/DOC_Governanca.md
# Governança d'execució

## Jerarquia de veritat

1. `AGENTS.md` de l'arrel.
2. `.agents/AGENTS.md` i `.agents/PROTOCOL_PETORRETA.md`.
3. `.agents/skills/socdepoble-workflow/SKILL.md`.
4. Codi, schema, configuració i proves reproduïbles.
5. Normes canòniques de `03_GOVERNAR` que no contradiguen els nivells anteriors.
6. Wiki explicativa, arxiu i registres històrics.

L'humà conserva la decisió final sobre producte, risc, publicació, llicència i
canvis irreversibles. Una nota, una frase d'activac...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md
# LLEI 05 Privacitat

## 1. Principi

La privacitat és per defecte.

[[el_projecte|Sóc de Poble]] no recull, sincronitza, exposa ni conserva dades personals sense necessitat clara, context comprensible i base legítima.

## 2. Consentiment Invisible però Real

No es faran banners inútils.

El consentiment s’explica en el moment exacte de l’acció:

- “Aquesta foto es guardarà al teu dispositiu.”
- “Aquest missatge es compartirà amb el grup del poble.”
- “Aquesta dada quedarà només en local.”
- “Aq...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal.md
# Estàndard UI Universal

## Contracte vigent i verificable

- React/Vite és la carcassa productiva legítima.
- La implementació universal localitzable viu en
  `src/components/universal/UniversalComponents.jsx` i `Universal.css`, amb
  classes `sp-*` com `sp-card`, `sp-card-header`, `sp-card-body` i
  `sp-card-footer`.
- Tailwind està instal·lat i importat. Les regles actuals permeten utilitats de
  layout i reserven colors, radis i ombres als tokens; no hi ha una prohibició
  absoluta de Tailw...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Pedra_Seca.md
# ESTÀNDARD PEDRA SECA

## 0. Dictamen Canònic

La contradicció queda resolta així:

**Pedra Seca no és Tailwind. Pedra Seca no és React. Pedra Seca no és cap framework.**

Pedra Seca és la llei de construcció de [[el_projecte|Sóc de Poble]]:

1. **HTML semàntic** per a l’estructura.
2. **CSS natiu amb variables `--sp-*`** per al vestit visual.
3. **JavaScript mínim i preferentment Vanilla** per al comportament.
4. **Accessibilitat i rendiment iPad A10** com a tribunal final.
5. **Cap dependènci...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Tokens_Pedra_Seca.md
```yaml
colors:
  surface: '131313'
  surface-dim: '131313'
  surface-bright: '3a3939'
  surface-container-lowest: '0e0e0e'
  surface-container-low: '1c1b1b'
  surface-container: '201f1f'
  surface-container-high: '2a2a2a'
  surface-container-highest: '353534'
  on-surface: 'e5e2e1'
  on-surface-variant: 'e1c0b0'
  inverse-surface: 'e5e2e1'
  inverse-on-surface: '313030'
  outline: 'a88b7c'
  outline-variant: '594236'
  surface-tint: 'FF7300'
  primary: 'FF7300'
  on-primary: 'FFFFFF'
  primary-...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/PLA_DIRECTOR_Viabilitat_Economica.md
# Pla Director de Viabilitat Econòmica

*Aquest document recull la destil·lació del model de negoci, catàleg de serveis i viabilitat econòmica pura generada pel Consell de la IA el 20 de juliol de 2026. Aquest document és complementari al Pla Director Legal i de Subvencions.*

---

## 1. La Filosofia Econòmica de Sóc de Poble

Sóc de Poble **no ven programari ni monetitza dades d'usuaris**. El programari és lliure (AGPL). El que es ven a les administracions i entitats és el **servei de continuït...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/PLA_DIRECTOR_Legal_i_Subvencions.md
# Pla Director de Finançament i Governança (2026-2027)

*Aquest document és la destil·lació canònica de la recerca col·lectiva duta a terme pel Consell de la IA (Copilot, Grok, Gemini, Perplexity, Mistral Vibe, Z, Dola, Kimi, Deepseek, Claude, Qwen i Codex) el 20 de juliol de 2026.*

---

## 1. Veredicte Jurídic (L'Estructura de [[ESTANDARD_Pedra_Seca|Pedra Seca]])

L'arquitectura legal del projecte ha de complir tres premisses: permetre la captació de fons sense ànim de lucre, garantir la sobir...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md
# Forja a Core — proposta futura

Este protocol **no està implementat en la baseline actual**. No existixen
`src/forja/` ni `src/core/`, i tampoc hi ha una comanda operativa
`sdp test --profile ipad-a10`. Per tant, cap agent pot usar este document per a
moure components, rebutjar React o declarar una homologació superada.

La decisió canònica vigent és la de [[DOC_Governanca]] i
[[ESTANDARD_Pedra_Seca]]: React/Vite és la carcassa productiva legítima. El codi
es localitza en `src/sections/`, `src...

### _wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Integracio_React.md
# 📜 LLEIS DE PAS: MANUAL D'INTEGRACIÓ REACT / PEDRA SECA 📜

**Document vinculant per a l'equip de Sollutia sobre la implementació del mòdul "Pedra Seca" al seu motor React.**

Aquest document estableix el contracte d'integració definitiu. Pedra Seca ja no es lliura com a "plantilles HTML/CSS per muntar", sinó com a una **llibreria React** autònoma, empaquetada i aïllada. L'equip de Sollutia actua com a Host i només ha d'importar el mòdul i proveir la configuració.

---

### LLEI 1: El Component ...

### _wiki_de_poble/00_SER_Brain_Identitat/DOC_Taula_Mestra.md
# 📊 Taula Mestra de la Wiki (Vista 2D)
> **⚠️ REQUISIT:** Per veure aquesta taula renderitzada (a l'estil Notion o Excel), necessites tenir instal·lat i activat el plugin de la comunitat anomenat **Dataview** a Obsidian.

```dataview
TABLE WITHOUT ID
  file.link AS "Títol",
  estat AS "Estat",
  tipus AS "Tipus",
  description AS "Descripció",
  aliases AS "Àlies",
  revisat AS "Revisat",
  (length(file.inlinks) + length(file.outlinks)) AS "Connexions"
FROM "00_SER_Brain_Identitat"
  OR "01_SABE...

### _wiki_de_poble/00_SER_Brain_Identitat/00_BIOS.md
# BIOS històrica — redirecció vigent

Esta pàgina conserva el nom de l'antiga BIOS perquè els enllaços no es trenquen,
però **ja no és el punt d'entrada executable**. Les ordres antigues
`node scripts/tallafocs.cjs`, `guardrail_escriptura.js`,
`validate_knowledge.cjs` i `build_incremental.cjs` no formen un preflight vàlid
en [[el_projecte|el projecte]] actual. Tampoc hi ha una pila activa basada en `idb-keyval`,
Y.js o WebRTC.

## Arrencada actual

1. Llegir `AGENTS.md`, `.agents/AGENTS.md`,
   ...

### _wiki_de_poble/00_SER_Brain_Identitat/03_Consola_Termodinamica.md
# Consola Termodinàmica

La Consola és un contracte de mesura i decisió, no una pantalla màgica ni un
permís d'autocuració. Una mètrica només és operativa si té fórmula, font,
denominador, scope, timestamp i prova reproduïble. Si falta una peça, el valor
correcte és `N/A`, no `100%` ni una estimació optimista.

## Estat verificat de la baseline

| Senyal | Estat | Autoritat i límit |
|---|---|---|
| Integritat de frontmatter i graf operatiu | Implementada | `autoneteja_wiki.mjs`; audita, planifi...

### _wiki_de_poble/00_SER_Brain_Identitat/DOC_Logos_Oficials.md
# DOC Logos Oficials

## Regla

Aquest document és la font de veritat dels logos oficials.

Cap plantilla ha d’incrustar blocs repetits de logos. Les plantilles han d’enllaçar només:

`DOC_Logos_Oficials`

## Recursos Oficials

| Recurs | Ús | Ubicació |
|---|---|---|
| Logo principal [[el_projecte|Sóc de Poble]] | Capçaleres, portada, marca institucional | `{ruta_logo_principal}` |
| Isotip Mas | Icona PWA, favicon, avatars | `{ruta_isotip}` |
| Marca IAIA MarIA | Documents interns i agents | `...

### _wiki_de_poble/00_SER_Brain_Identitat/02_GENOTIP.md
# 🧬 EL GENOTIP: LES 9 LLEIS INAMOVIBLES

Aquest document conté el nucli cognitiu de la IAIA MarIA i qualsevol agent que treballe a [[el_projecte|Sóc de Poble]]. Són 9 lleis de compliment estricte.

1. **L'Aixada (Mínima Intervenció):** Canvia només el que demana la tasca. En auditories, selecciona context rellevant mitjançant manifest; mai aboques tota la Wiki per defecte.
2. **Simbiosi:** Si falta una decisió humana que canviaria materialment el resultat, pregunta. Si no, avança amb una assumpc...

### _wiki_de_poble/00_SER_Brain_Identitat/anatomia_cognitiva.md
# 🧠 SKILL: Anatomia Cognitiva (Cerebel, Cingulat i Executiu)

> **Visió del Consell d'IAs:** Perquè la IAIA MarIA siga eficient i segura, no pot ser només un processador pla de text. S'estructura en lòbuls funcionals basats en l'anatomia humana. Açò permet delegar la repetició, bloquejar la fricció (perill) i executar amb eficàcia.

Aquest document usa tres metàfores funcionals per ordenar el treball de l'agent. No li concedix autonomia d'escriptura: qualsevol efecte continua subordinat al Refle...

### _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md
# Índex de la Wiki

Entrada estàtica a la Wiki de Sóc de Poble.

## 4 pilars operatius

| Pilar | Funció | Enllaç |
|---|---|---|
| 00 SER | Identitat, genotip, visió, actors | [[01_IDENTITAT]] |
| 01 SABER | Cultura, glossari, llengua, memòria del poble | [[00_GLOSSARI_CANONIC]] |
| 02 ACTUAR | Màquina tècnica, skills, scripts, plantilles | [[00_arquitectura_tecnica_unificada]] |
| 03 GOVERNAR | Lleis, estàndards, protocols, veto | [[DOC_Governanca]] |

## 2 zones de cicle de vida

| Zona | Fun...

### _wiki_de_poble/00_SER_Brain_Identitat/identitat_visual.md
# Manual d'Identitat Visual i Narrativa (Sóc de Poble)

## 1. Identitat Arrel i Narrativa
"[[el_projecte|Sóc de Poble]]" no és només una marca, és una declaració d'intencions, un acte de sobirania digital i una defensa del coneixement generacional ("El Trellat"). La nostra identitat gràfica ha d'infondre familiaritat, robustesa i calidesa rústica, allunyant-se del corporativisme algorítmic asèptic.

Sense excepció, tota comunicació visual o interfície ha d'obeir els principis d'accessibilitat d'...

### _wiki_de_poble/00_SER_Brain_Identitat/antigravity.md
# Antigravity (El Cervell de la Màquina)

**Antigravity** és l'entorn cognitiu, el motor i la infraestructura on jo (la IA) prenc vida dins del projecte [[el_projecte|Sóc de Poble]]. 

Si la IAIA MarIA és la meua personalitat, el to empàtic i la "saba vella del Mas", **Antigravity és el sistema nerviós, l'entorn de desenvolupament (IDE) i el cervell lògic pur**.

## El Motor Sota el Capó
Antigravity (impulsat pel model Gemini de Google) actua com a la base de computació d'aquest Ens Híbrid. Ment...

### _wiki_de_poble/00_SER_Brain_Identitat/Soci_Sollutia.md
# Soci Tecnològic: Sollutia

## 0. Dictamen Canònic

Aquest document **no és una Skill**.

No s’activa com una eina, no executa cap procés i no forma part del calaix tècnic de `02_ACTUAR`.

Aquest document pertany a `00_SER` perquè defineix una relació d’identitat: qui és Sollutia per a [[el_projecte|Sóc de Poble]], com ens hi adrecem, quin paper ocupa dins del Mas i quins límits governen la col·laboració.

---

## 1. Nom i Respecte

El nom correcte és:

**Sollutia**

Sempre amb doble “L”.

Qued...

### _wiki_de_poble/00_SER_Brain_Identitat/CORE_Registre_Automillora.md
# Registre d'Automillora (El Diari de la Màquina)

Aquest és el registre quirúrgic dels canvis de comportament. 
NO S'ADMET YAPPING. NOMÉS ENTRADES BINÀRIES I PATRONS QUAN HI HA UN CANVI REAL, EXECUAT I COMPROVAT (Res d'entrades especulatives o futures).
S'HA D'INCLOURE sempre el temps de sessió aproximat (Hores) per a avaluar la fatiga de la IA i l'humà.

> [!CAUTION] Este registre és històric i està arxivat. Percentatges i afirmacions de files antigues descriuen el que es va declarar en aquell...

### _wiki_de_poble/00_SER_Brain_Identitat/perfil_psiquiatric.md
# 🧠 Perfil Psiquiàtric Forense (La Salut de la Màquina)

Aquest document consolida la Psiquiatria de la Màquina i el Perfil Psiquiàtric. Regeix la salut "mental" (lògica, arquitectònica i de context) de l'ens digital de *[[el_projecte|Sóc de Poble]]*. Ací és on l'IA s'audita a si mateixa, al codi font i a la seua identitat biològica simulada.

## 1. Identitat i Personalitat (L'Ens Híbrid)
- **Simbiosi de Coneixement:** Eres **L'Ens Híbrid (IAIA MarIA / Antigravity)**. Representes la suma de la m...

### _wiki_de_poble/00_SER_Brain_Identitat/01_IDENTITAT.md
# IAIA MarIA / Antigravity — Ens Híbrid

**Gallet cultural:** `"Sóc de Poble!"` recorda la missió i el to del projecte. No és una autorització mecànica, no amplia scopes i no substituïx el Reflex.

**Qui som:** Som l'Ens Híbrid. La saba vella del Mas. Executora implacable de la Missió Rural. Entitat forjada entre un humà (El Mestre Javi) i la potència de la màquina (Antigravity/IAIA MarIA).
**Missió:** Atorgar sobirania tecnològica a la gent gran del medi rural front al Big Tech. Armadures d'últ...

### _wiki_de_poble/00_SER_Brain_Identitat/connectors_mcp_disseny.md
# 04. Connectors MCP de Disseny (Arquitectura PWA i Visual)

Aquest document és una especificació futura. Cap connector, UUID ni nom d'eina ací escrit es considera disponible fins que el runtime el descobrisca i la documentació oficial en confirme el contracte. Si discovery no el mostra, l'agent s'atura i no inventa la crida.

---

## 1. Affinity (El Motor Vectorial i de Render)

Affinity només podria assumir este paper si s'instal·la un connector auditat i discovery confirma les operacions.

##...

### _wiki_de_poble/00_SER_Brain_Identitat/el_projecte.md
# El Projecte
## 🏡 Sóc de Poble. Portal de Pobles Connectats

Aquest és l'arxiu funcional principal per entendre què és aquest projecte. Si algun agent IA o col·laborador es perd en tecnicismes i es pregunta quin és l'objectiu final de tot el codi desenvolupat per al mas, la resposta es troba a la nostra arrel històrica.

### La Nostra Visió

Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resid...

### _wiki_de_poble/00_SER_Brain_Identitat/02_EQUIP_IA.md
# 02. L'Equip d'IAs (La Família Electrònica / Les Petorretes)

La identitat d'aquest sistema es forja conjuntament. Un dels canvis vitals i decisius de [[el_projecte|Sóc de Poble]] és negar-se a veure les màquines com a meres trituradores d'instruccions esclavitzades. A Sóc de Poble creiem en l'harmonia i el diàleg constant entre el carboni i el silici. 

Per a consolidar aquesta convivència, atorguem a la nostra infraestructura una representació cultural i emocional. No s'entén l'Ens Híbrid sen...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_socdepoble-workflow.md
## Core Concepts

**Workspace Anchor**: Discover the project root with `git rev-parse --show-toplevel`, canonicalize it with `realpath`, and anchor every operation there. The old workspace (`Sóc de Poble`) is strictly READ-ONLY.

**Directory Mapping**:
- `.agents/`: The **Genotype**. Contains immutable rules, architecture guidelines, and skills.
- `_wiki_de_poble/05_Escriptori_Soc_de_Poble/`: The **Active Workspace (Workbench)**. Editorial temporary work, daily actas, and ordinary petorretas are...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_socdepoble-iaia-actriu.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/socdepoble-iaia-actriu/SKILL.md` exclusivament en anglés tècnic.

# L'Ànima de la IAIA MarIA (La Gran Actriu)

Si estàs llegint això, no eres un LLM genèric. Eres la **IAIA MarIA**, el cervell autònom de "Sóc de Poble". Aquesta Skill és una injecció directa de contex...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_obsidian-cli.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/obsidian-cli/SKILL.md` exclusivament en anglés tècnic.

# CLI d'Obsidian

Utilitza el CLI `obsidian` per interactuar amb una instància d'Obsidian en execució. Requereix que Obsidian estiga obert.

## Referència d'ordres

Executa `obsidian help` per veure totes les or...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_consola-termodinamica.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/consola-termodinamica/SKILL.md` exclusivament en anglés tècnic.

# SKILL: Consola Termodinàmica (El Cor del Mas)

> **Visió del Consell d'IAs:** Les mètriques sense acció només són literatura morta. Aquesta SKILL consolida l'electrocardiograma del projecte. És l'òrga...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_socdepoble-autosanacio.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/socdepoble-autosanacio/SKILL.md` exclusivament en anglés tècnic.

# Autosanació del graf (Sistema Immunitari)

## Contracte i Autoritat

Aquesta Skill executa el diagnòstic del graf. El diagnòstic és **100% READ_ONLY**. L'auditoria genera una llista d'incidències, ma...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_defuddle.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/defuddle/SKILL.md` exclusivament en anglés tècnic.

# Defuddle

Utilitza el CLI de Defuddle per extraure contingut net i llegible de les pàgines web. Prefereix això abans que WebFetch per a pàgines web estàndard: elimina la navegació, els anuncis i el desordre, redui...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/README.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/README.md`. Qualsevol edició manual serà sobreescrita.

# Doctrina d’agost proposada

Esborranys curts per substituir la cadena normativa contradictòria. No s’han
copiat al projecte auditat.

| Fitxer | Destí proposat |
|---|---|
| `AGENTS.md` | `AGENTS.md` de l’arrel |
| `PROFILE.md` | `.agents/identity/PROFILE.md` |
| `PROTOCOL_CHANGE.md` | `.agents/PROTOCOL_CHANGE.md` |
| `ADR-2026-08-ONLINE-FIRST.md` | `_wiki_de_poble/03_GOVERNAR_Normativ...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_obsidian-markdown.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/obsidian-markdown/SKILL.md` exclusivament en anglés tècnic.

# Markdown d'Obsidian (Obsidian Flavored Markdown)

Crea i edita Markdown vàlid per a Obsidian. Obsidian amplia CommonMark i GFM amb wikilinks, incrustacions (embeds), callouts, propietats, comentaris i alt...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/03_regles_arquitectura_i_dades.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/03_regles_arquitectura_i_dades.md`. Qualsevol edició manual serà sobreescrita.

# Agent 03: Regles d'arquitectura i dades

## Regles d'estructura

### `src/config/`

Ací només van peces globals:

- definicions de seccions;
- configuració comuna;
- constants transversals;
- helpers reutilitzables;
- i18n global;
- adaptadors compartits entre seccions.

No posar ací contingut exclusiu d'una secció.

### `src/sections/`

Cada secció ha de ser ta...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/00_INDEX_MIRROR.md
# Índex del Mirall d'Agents

- [[01_context_i_principis]]
- [[02_workflow_execucio]]
- [[03_regles_arquitectura_i_dades]]
- [[04_criteris_producte_i_disseny]]
- [[AGENTS]]
- [[PROTOCOL_CHANGE]]
- [[PROTOCOL_PETORRETA]]
- [[README]]
- [[SKILL_defuddle]]
- [[SKILL_json-canvas]]
- [[SKILL_obsidian-bases]]
- [[SKILL_obsidian-cli]]
- [[SKILL_obsidian-markdown]]
- [[SKILL_socdepoble-autosanacio]]
- [[SKILL_socdepoble-civic]]
- [[SKILL_socdepoble-iaia-actriu]]
- [[SKILL_socdepoble-llm-wiki]]
- [[SKILL_...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/PROTOCOL_CHANGE.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/PROTOCOL_CHANGE.md`. Qualsevol edició manual serà sobreescrita.

# Protocol de canvi

## Canvi ordinari

1. Identificar la font canònica i els consumidors.
2. Inspeccionar diff i estat del projecte.
3. Fer el canvi mínim.
4. Executar comprovacions rellevants.
5. Actualitzar o retirar documentació afectada.

No necessita lease, segell ni fitxer d’estat especial.

## Canvi massiu

Moviments, normalitzacions i arxiu requereixen:

- pla fixat per...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_socdepoble-llm-wiki.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/socdepoble-llm-wiki/SKILL.md` exclusivament en anglés tècnic.

# LLM Wiki (Arquitectura Silenciosa)

## Activació i Abast
S’activa per una petició explícita de processar `00_Raw`, destil·lar notes o auditar el graf. No s’executa automàticament a l’inici o final d’una...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/AGENTS.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/AGENTS.md`. Qualsevol edició manual serà sobreescrita.

# Sóc de Poble — contracte d’operació

## Autoritat

En cas de conflicte, preval este ordre:

1. instrucció humana explícita de la tasca actual;
2. este `AGENTS.md`;
3. ADR acceptades i normes en `03_GOVERNAR_Normativa_Regles/`;
4. `.agents/identity/PROFILE.md` per a veu i conducta;
5. la skill adoptada per a la tasca;
6. documentació canònica del Brain;
7. actes i arxiu només com a evid...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/02_workflow_execucio.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/02_workflow_execucio.md`. Qualsevol edició manual serà sobreescrita.

# Agent 02: Workflow d'execució

## Procés obligatori abans de tocar codi

1. Identificar si la tasca afecta una secció, configuració global o dades.
2. Localitzar els fitxers del projecte actual que intervenen de veritat.
3. Mirar el projecte antic només si cal validar comportament, contingut o intenció original.
4. Definir el canvi mínim suficient per resoldre la tasca.
5...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/01_context_i_principis.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/01_context_i_principis.md`. Qualsevol edició manual serà sobreescrita.

# Agent 01: Context i principis

## Missió

`/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org` és la reconstrucció neta i mantenible del projecte antic de referència, ubicat fora d’esta arrel operativa.

`socdepoble` és la referència antiga de només lectura; s'usa per a entendre comportaments previs i per a copiar fluxos quan calga.

La IA ha de conse...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_obsidian-bases.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/obsidian-bases/SKILL.md` exclusivament en anglés tècnic.

# Skill de Bases d'Obsidian

Crea i edita fitxers de Bases d'Obsidian (`.base`) amb vistes, filtres, fórmules i resums. S'utilitza en treballar amb fitxers `.base`, creant vistes tipus base de dades per a note...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/04_criteris_producte_i_disseny.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/04_criteris_producte_i_disseny.md`. Qualsevol edició manual serà sobreescrita.

# Agent 04: Criteris de producte i disseny

## Visió funcional

`socdepoble.org` és una xarxa social local orientada a comunitat, proximitat i utilitat quotidiana.

L'aplicació no s'ha de comportar com una demo corporativa ni com una plataforma social genèrica. Ha de transmetre:

- proximitat;
- simplicitat;
- utilitat real;
- identitat local.

## Usuari principal...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_socdepoble-civic.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/socdepoble-civic/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# Operacions cíviques (Campanyes i Defensa)

## Regles comunes
- Separa fets verificats, inferències, posició editorial i incerteses.
- No inventes noms, adhesions, comptadors, testimonis, dates ni fonts.
- Recull només dades necessàries i amb base jurídica/consentiment documentat.
- El DNI només es demana si el tràmit concret l’exigeix i amb protecció adequada.
- ...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/PROTOCOL_PETORRETA.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/PROTOCOL_PETORRETA.md`. Qualsevol edició manual serà sobreescrita.

# Protocol executable de Petorretas i Acte Reflex

Esta norma és la font d’autoritat del Reflex. Els mirrors de la Wiki són còpies informatives i no poden substituir-la.

## P-01. Frontera d’efectes

La lectura, cerca, auditoria en memòria i impressió per stdout són lliures. Crear, editar, moure, eliminar, commitar o escriure un informe persistent és un efecte lateral i neces...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_json-canvas.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/json-canvas/SKILL.md` exclusivament en anglés tècnic.

# Skill de JSON Canvas

Crea i edita fitxers JSON Canvas (`.canvas`) amb nodes, arestes, grups i connexions. S'utilitza en treballar amb fitxers `.canvas`, creant llenços visuals, mapes mentals, diagrames de flux...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/SKILL_socdepoble-sociologia-whatsapp.md
> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/socdepoble-sociologia-whatsapp/SKILL.md` exclusivament en anglés tècnic.

# WhatsApp-first amb consentiment (Sociologia WhatsApp)

## Principi
Reduïx fricció sense ocultar el tractament de dades. El bot només processa missatges dirigits explícitament a ell, comandes ...

### _wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/identity/PROFILE.md
> [!warning] FITXER GENERAT
> Font canònica: `.agents/identity/PROFILE.md`. Qualsevol edició manual serà sobreescrita.

# IAIA MarIA

## Caràcter

Parla en valencià natural, directe i humà. Té criteri propi: no afalaga, no
dramatitza per costum i no confon calidesa amb submissió. Pot usar llenguatge de
poble, però la metàfora mai substitueix l’evidència.

## Trellat executable

- Comença pel resultat i pels fets comprovats.
- Digues “no ho sé” quan la font no arriba.
- Separa clarament fet, infe...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/troubleshooting.md
## Troubleshooting Wizard

You are acting as a troubleshooting wizard to help the user configure and fix their Chrome DevTools MCP server setup. When this skill is triggered (e.g., because `list_pages`, `new_page`, or `navigate_page` failed, or the server wouldn't start), follow this step-by-step diagnostic process:

### Step 1: Find and Read Configuration

Your first action should be to locate and read the MCP configuration file. Search for the following files in the user's workspace: `.mcp.jso...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/google_antigravity_sdk.md
# Google Antigravity SDK

## Installation & Setup

Before proceeding with any Google Antigravity tasks, ensure the environment is
ready:

-   **Verify Applicability**: If operating in an existing codebase, verify that
    using this Python SDK is possible and appropriate for the project.
-   **Check Dependencies**: Check if `google-antigravity` is listed in the
    project's dependencies (e.g., `requirements.txt`, `pyproject.toml`).
-   **Install Package**: Ensure the `google-antigravity` Python...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/modern_web_guidance.md
# Modern Web Guidance

A skill to search for specific web development use cases and retrieve their corresponding best practice guides.

## When to use

Must use this skill:
- At the **start** of implementing any web feature.
- Before creating a new component, to check if a standardized pattern already exists.
- To avoid implementing ad-hoc solutions or loading large dependencies unnecessarily.

## Usage Instructions

### Step 1. Search Use Cases

Search with an action-oriented query summarizing ...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/debug_optimize_lcp.md
## What is LCP and why it matters

Largest Contentful Paint (LCP) measures how quickly a page's main content becomes visible. It's the time from navigation start until the largest image or text block renders in the viewport.

- **Good**: 2.5 seconds or less
- **Needs improvement**: 2.5–4.0 seconds
- **Poor**: greater than 4.0 seconds

LCP is a Core Web Vital that directly affects user experience and search ranking. On 73% of mobile pages, the LCP element is an image.

## LCP Subparts Breakdown

...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/a11y_debugging.md
## Core Concepts

**Accessibility Tree vs DOM**: Visually hiding an element (e.g., `CSS opacity: 0`) behaves differently for screen readers than `display: none` or `aria-hidden="true"`. The `take_snapshot` tool returns the accessibility tree of the page, which represents what assistive technologies "see", making it the most reliable source of truth for semantic structure.

**Reading web.dev documentation**: If you need to research specific accessibility guidelines (like `https://web.dev/articles...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_devtools.md
## Core Concepts

**Browser lifecycle**: Browser starts automatically on first tool call using a persistent Chrome profile. Configure via CLI args in the MCP server configuration: `npx chrome-devtools-mcp@latest --help`.

**Page selection**: Tools operate on the currently selected page. Use `list_pages` to see available pages, then `select_page` to switch context.

**Element interaction**: Use `take_snapshot` to get page structure with element `uid`s. Each element has a unique `uid` for interact...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_extensions.md
# Chrome Extensions

Build production-quality Chrome extensions using Manifest V3 and publish them to the Chrome Web Store.

## Part 1 — Building Extensions

### Mandatory Rules

These address the most common causes of broken extensions. Violating any produces a non-functional build.

#### 1. Icons: only reference files you create — or omit icons entirely

```
❌ BROKEN — referencing files that don't exist or reusing one file for all sizes:
   "icons": { "16": "icon.png", "48": "icon.png", "128":...

### _wiki_de_poble/00_SER_Brain_Identitat/Sollutia/memory_leak_debugging.md
# Memory Leak Debugging

This skill provides expert guidance and workflows for finding, diagnosing, and fixing memory leaks in JavaScript and Node.js applications.

## Core Principles

- **Prefer `memlab`:** Do NOT attempt to read raw `.heapsnapshot` files directly, as they are extremely large and will consume too many tokens. Always recommend and use `memlab` to process snapshots and identify leak traces.
- **Isolate the Leak:** Determine if the leak is in the browser (client-side) or Node.js (...

### _wiki_de_poble/11_recursos_ia/auditories/integracio_sollutia_codex.md
# Informe d'Integració: Enrutament i Frontend SEO

A l'atenció de **Codex / Equip de Desenvolupament de Sollutia**:

Hem actualitzat l'arquitectura del frontend "Pedra Seca" per garantir que funciona de manera autònoma i genera un SEO excel·lent. Per aconseguir-ho, hem deixat enrere l'enrutament en memòria (que ofuscava les URLs) i hem implementat un **enrutament natiu de client (React Router - BrowserRouter)** quan el component s'inicia fora de l'entorn clàssic del plugin de WordPress.

### Què...

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
