---
tipus: petorreta
estat: canonic
description: "Petorreta al Consell: Auditoria d'Uniformització del Disseny de la Gestoria de Poble i Blindatge del Selector de Píndola (3T)"
---
# 🛡️ PETORRETA AL CONSELL: UNIFORMITZACIÓ DEL DISSENY DE LA GESTORIA I PRESERVACIÓ DEL SELECTOR DE PÍNDOLA (3T)

## Font de Logos

Els logos oficials no s’incrusten ací.
Consulta sempre: [[doc_logos_oficials]]

---

## Objectiu

Auditar la integració de la Gestoria de Poble (rescatada per a la campanya fiscal del 3r Trimestre) i uniformitzar el seu disseny visual amb el sistema canònic de Pedra Seca de Sóc de Poble, evitant qualsevol contaminació o duplicació de CSS, i blindant el component selector tipus píndola (`[Universal Cards] [Vista Comprimida]`).

`OBJECTIU: Auditar la maquinària de la Gestoria de Poble, definir el camí d'uniformització visual amb UniversalCard i blindar com a patró canònic el selector de vistes en píndola.`

---

## Context Necessari

- **Bundle aparellat:** `260911_0624_BUNDLE_auditoria.md` (Conté el repositori sencer, arquitectura i codi actiu).
- **Fitxers clau afectats:**
  - `public/gestoria/index.html` i `public/gestoria/tauler.js` (Maquinària autònoma de càlcul fiscal, Dexie.js i tauler).
  - `public/assets/pedra-seca.css` (Full d'estils autònom antic rescatat).
  - `src/components/ui/UniversalCard.jsx` i `src/css/index.css` (Arquitectura de targetes i tokens canònics de la SPA React).
  - `src/sections/control/ControlSection.jsx` (Panell de Control on s'enllaça la Gestoria dins d'Utilitats).

---

## La Preocupació del Mestre i Directrius Fundacionals

A les 06:19 del matí, el Mestre Javi ha traslladat una instrucció cabdal per a la continuïtat del projecte:

1. **Blindar el Selector de Píndola:**
   > *"Cuando borres el diseño, recuerda que este tipo de botón de elección me encanta, me gusta mucho, ¿okey?"*
   - L'element interactiu `<div class="toggle-cards">` amb el selector de pastilla arrodonida `[Universal Cards] [Vista Comprimida]` és un patró ergonòmic que el Mestre vol preservar de manera sagrada en tota la plataforma.

2. **Zero Contaminació ni Duplicitat de Disseny:**
   > *"Te has pillado el diseño que teníamos antes que era puro, pero era puro para su momento. Ahora no es el diseño actual... cambia los colores... sobre naranja nunca va el blanco (salvo casos concretos como hora y fecha)... intenta ver cómo evitar que se mezcle el diseño antiguo con el nuevo. He sufrido tanto con el diseño duplicado... que uniformicen el diseño de todo entre todas las IAs, por favor."*
   - La Gestoria es va concebre originalment en una etapa anterior. La integració d'emergència per al 3T no pot introduir regressions ni barrejar fulls d'estil que puguen tacar l'aplicació principal.
   - Cal un criteri ferm: com s'ha de convergir cap al `UniversalCard` modern mantenint la potència dels càlculs fiscals i la claredat visual.

---

## Preguntes Clau per al Consell d'IAs

Demanem a **Dola, Deepseek, Z, Claude, Qwen, Codex, Perplexity, Gemini, Grok i Mistral Vibe** que dictaminen:

1. **Despullament Absolut i Adopció del Sistema Universal:**
   - La Gestoria té detalls bons (com els botons de data), però no segueix el sistema reglat. Té una reixeta de 4 columnes (en lloc de 3), altures diferents i CSS/Tailwind antics.
   - Heu de despullar absolutament la Gestoria de tot el seu CSS i Tailwind. Ha de quedar completament neta.
   - Un cop neta, ha d'absorbir 100% el disseny de la `Universal Page` i les `Universal Cards` del sistema (incloent la reixeta de màxim 3 columnes). Volem que en canviar el disseny al sistema base, s'aplique automàticament ací.

2. **Blindatge del Selector de Píndola (Toggle View):**
   - Proposta d'extracció del selector `[Universal Cards] [Vista Comprimida]` com a component canònic reutilitzable de Pedra Seca (`PillToggle` / `VistaToggle`) tant per a Web Components com per a React JSX, amb accessibilitat ARIA, transició suau i estils nets.

3. **TopBar, SideBar i Plantilla de Sistema (Inmutabilitat Light/Dark Mode):**
   - La barra superior negra (`TopBar`) i la barra lateral (`SideBar`) són completament inmutables en disseny. **No canvien mai el seu disseny ni colors entre el mode clar (Light Mode) i el mode fosc (Dark Mode)**. Mantenen sempre els mateixos colors i aparença.
   - S'ha d'esborrar la TopBar vella de la Gestoria i col·locar exactament la nostra (amb els logotips i mides actuals).
   - A la SideBar, s'han d'esborrar els "fantasmes" antics (botons de punta a punta) i adoptar de manera estricta els botons actuals, que tenen els extrems completament arredonits (circulats).
   - Tota la Gestoria ha d'incloure aquesta plantilla de sistema universal (TopBar i SideBar inmutables) i després aplicar la `Universal Page` totalment neta al contingut central.

4. **Auditoria Destructiva i Constructiva (Cap a un 10/10 del Sistema Universal):**
   - Necessitem netejar el codi al màxim. Doneu-nos una estructura Flexbox universal que siga tan sòlida i versàtil que servisca per a la Gestoria, per al Perfil d'usuari i per al Bloc de Notes.
   - Feu una auditoria destructiva i constructiva radical. Busqueu els forats del codi actual. Volem tancar l'arquitectura amb un 10 absolut (especialment per facilitar la futura integració perfecta amb Sollutia). Si tenim el codi base impecable, podrem millorar el Bloc de Notes i escalar sense por.

---

## Instrucció Principal per a les IAs Auditores

`EXECUTA: Analitza el bundle 260911_0624_BUNDLE_auditoria.md, avalua la integració de public/gestoria/ i proposa el full de ruta i codi per a uniformitzar el disseny sota Pedra Seca i encapsular el selector de píndola com a component canònic.`

---

## Output Esperat

- **Format:** Markdown net en document d'estudi canònic (`AAMMDD_HHMM_ESTUDI_nom_ia.md`).
- **Sense al·lucinacions ni dependències:** Propostes de mínim canvi quirúrgic, pur HTML/CSS/JS, coherents amb la Llei de Pedra Seca.

---

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Online-First' ni 'Online-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## Tancament Obligatori

- No yapping.
- No dependències supèrflues.
- No Tailwind al Core.
- No tocar dades personals sense base legal.
- Si hi ha risc de destrucció, activa SDP-LOCK.
- PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn aïllat (air-gapped). Tens prohibit malbaratar tokens cercant termes a internet. Tota la informació està en el bundle adjunt. Llig-lo i no el busques fora.

## Sinapsis

- [[00_bios]]
- [[02_genotip]]
- [[doc_governanca]]
- [[doc_logos_oficials]]
- [[pedra_seca]]
- [[estandard_ui_universal]]

## Taxonomia

- **Categoria:** [[maquina]]
- **Etiquetes:** [[gestoria]], [[disseny]], [[pedra_seca]], [[petorreta]], [[consell]]

**Ancoratge de Seguretat:** [[00_index]]
