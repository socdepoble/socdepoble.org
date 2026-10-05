---
type: document
status: esborrany
description: Pla per netejar petits deutes tècnics, emojis natius, tests i Open Graph.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_7a4fe1eb-e34b-4d4d-a1bf-a21d9ee32acb:33035b12-fbd4-4348-b86b-e7ea0f3d635d
---
# Marató d'Excel·lència (Onada Neteja i Poliment)

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7a4fe1eb-e34b-4d4d-a1bf-a21d9ee32acb:33035b12-fbd4-4348-b86b-e7ea0f3d635d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T18:31:40.955Z |
| Modificació | 2026-10-04T18:31:40.955Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | MarIA (Director) |
| Tokens consumits | No disponible de manera exacta |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-04T18:31:40.955Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
Durant l'auditoria adversarial profunda d'aquesta nit, s'ha descobert que `tractorTauler.js` segueix consumint la llista de fitxers si fem "Oblida" mentre està llegint, degut a l'absència d'un `AbortController`. D'altra banda, la recent inserció de `AppGridShell` restringeix l'espai visible i trenca els tests de renderització responsiva a `XatSection.test.jsx`. A més, cal preparar el front per a compartir a xarxes (og:image). Addicionalment, al modal d'Ajustos de l'usuari falta carregar l'avatar correcte i es mostren les inicials de fallback (ex. JL). També s'ha detectat que la columna lateral (sidebar) en vista mòbil és massa ampla (gairebé 450px), bloquejant tota la pantalla i impedint fer clic fora per tancar-la. Finalment, els enllaços d'autor a les targetes del Mercat estan trencats (apunten a 404 o rutes hardcodejades com /el-projecte) i el sistema de pujada d'avatars (retallador) falla actualment amb l'error "No s'ha pogut pujar el fitxer".

### 2. Canvis Proposats (Proposed Changes)

### [Acció: MODIFY] `src/sections/gestoria/tauler/nucli/tractorTauler.js`
Introduir la signal de l'`AbortController` dins del bucle `for...of` al consum de fitxers. Si `signal.aborted` passa a true, eixir del bucle ràpidament per alliberar memòria i evitar efectes paràsits.

### [Acció: MODIFY] `src/apps/xat/XatSection.test.jsx`
Ajustar els mocks del contenidor de ResizeObserver per complir els nous breakpoints a causa dels 250px extra de marge esquerre (AppGridShell).

### [Acció: MODIFY] `index.html`
Afegir les etiquetes Open Graph estàndard (`og:title`, `og:image`, `twitter:card`) amb la ruta de `iaia_maria_portada.jpg` per optimitzar la miniatura a WhatsApp.

### [Acció: NEW] `src/apps/disseny/... (nou component Emojis XL)`
Afegir una sub-pàgina de disseny visual amb grid CSS natiu (mida x5) per recollir els emojis de domini. Usarem el `<details>` natiu per a plegar categories.

### [Acció: MODIFY] `src/apps/components/...`
Escampar emojis natius en lloc de SVG allà on el context siga més rural i d'informació plana. Per al nou catàleg d'Emojis XL al panell de Disseny: les llistes de famílies han d'aparèixer desplegades per defecte (per evitar clics innecessaris) i han d'incloure **TOTS** els emojis del sistema en codi dur, no només una mostra de 8; encara que Mac no els pinte tots, els dispositius Android sí que ho faran. A més, **cada emoji ha de ser clicable i copiar-se automàticament al porta-retalls** (`navigator.clipboard.writeText`), per tal que el Mestre puga copiar-lo fàcilment del catàleg i enganxar-lo com a icona d'una carpeta o document a l'espai de treball.

### [Acció: MODIFY] `src/apps/... (Modal Ajustos i Perfil)`
S'han detectat errors constants en intentar desar camps del perfil (Avatar, Subtítol, Visibilitat) amb el missatge "no tens permís per a canviar este camp". Investigant el modal de privacitat, s'ha descobert la causa arrel: un error **Supabase 400 (PGRST204)** que indica `"Could not find the 'is_public' column of 'profiles' in the schema cache"`. A més, la creació d'empreses falla per un error de funcions sobrecarregades a PostgREST (`Could not choose the best candidate function between: public.create_organization(...)`). L'equip ha de revisar i netejar les migracions de Supabase o recarregar la cache de l'esquema per assegurar que la taula `profiles` i les funcions RPC (com `create_organization`) coincideixen exactament amb l'API que espera el client. Fins que no s'arregle això, la capa de dades (perfils i empreses) està bloquejada. Addicionalment, solucionar l'absència visual de l'avatar a la capçalera del modal d'Ajustos (es mostren les inicials 'JL').

### [Acció: MODIFY] `src/apps/mercat/... (Targetes de Mercat)`
Corregir els enllaços dels autors a les targetes del Mercat. Actualment 'Javi Llinares' porta a un 404 ("Perfil no trobat") i 'Sóc de Poble' porta a 'El Projecte' (comportament antic). Han d'enllaçar dinàmicament al perfil correcte de l'usuari o de l'empresa (`/perfil/:id` o equivalent).

### [Acció: FIX - REGRESSIÓ CRÍTICA] `src/sections/... (AppGridShell / Panell d'Identitat i Contextos)`
S'han detectat dues regressions greus introduïdes recentment:
1. **Desaparició del Calaix d'Identitat (Right Drawer):** Abans, en fer clic a l'avatar de dalt a la dreta, s'obria un panell lateral dret (idèntic al de l'esquerra) on es podia canviar entre el perfil personal (Javi) i les empreses (Sóc de Poble), a més de desconnectar. Aquest calaix ha desaparegut completament.
2. **Errors de Context fora de Provider:** En navegar a certes rutes com `/el-meu-perfil` o en intentar tancar sessió des de Control, l'aplicació "peta" amb pantalla blanca i errors com `useIdentitat ha de ser usat dins de IdentitatProvider` o `useSession ha de ser usat dins de SessionProvider`. Cal revisar l'arbre de Providers de l'AppGridShell o del Router per assegurar que totes les pàgines i panells estan dins dels contextos necessaris.

### [Acció: MODIFY] `supabase/config.toml`
El port per defecte configurat al `SITE_URL` de Supabase en local és el `3000`. Això fa que els enllaços de recuperació de contrasenya apunten a port 3000 en comptes del `3340` (on corre Vite), donant un error `Cannot GET /`. Cal actualitzar el `config.toml` per alinear-lo amb l'entorn de Sóc de Poble (`http://127.0.0.1:3340`).

### [Acció: MODIFY] `src/sections/... (Sidebar / AppGridShell)`
Revisar les icones de les carpetes. El Mestre ha detectat que a la "Wiki de Poble" hi ha una carpeta que conté "Tractors" i "Sentinelles" però té una icona d'enllaç en lloc d'una icona de carpeta. Cal corregir l'assignació d'icones per a reflectir adequadament si un element és un directori o un document final.

### [Acció: IMPLEMENT] `src/apps/... (Notes Personals / Universal Workspace)`
Implementar la lògica de recull i filtratge de publicacions de l'usuari (o empresa) a la vista de "Notes Personals". Totes les targetes i publicacions que l'usuari (ex: Javi o Sóc de Poble) haja creat en qualsevol secció (ex: Mercat, Mur) han d'aparèixer automàticament a l'espai personal dins de la seua carpeta corresponent (ex: Carpeta Mercat). Les publicacions que no tinguen una carpeta predefinida aniran a la carpeta "Altres notes". Addicionalment, cal comprovar que el formulari de "Nova organització" permet la creació de "Grups" a més d'empreses.

### [Acció: MODIFY] `src/sections/... (AppGridShell / Sidebar)`
La columna lateral (sidebar) ha de tindre una amplada dinàmica adaptada al contingut més llarg, però amb un límit màxim de 300px (ex: si la paraula més llarga fa 200px, la barra en fa 240px amb padding). Si sobrepassa els 300px, es tallarà amb punts suspensius (`text-overflow: ellipsis`). L'objectiu és deixar el màxim "aire" possible a la pantalla per fer clic fora i tancar-la. (Aquest límit de 300px serà modulable en el futur des del Panell de Control de Disseny, que ja està planificat a l'agenda).

### [Acció: MODIFY] `.agents/skills/sdp-pedra-seca/SKILL.md` (o manual equivalent)
Afegir al reglament de disseny el principi innegociable de "Tornada arrere lliure de tensió" en pantalles mòbils: Cap menú emergent o barra pot bloquejar el 100% de la pantalla; l'usuari ha de veure clarament espai de la vista anterior on poder fer clic per eixir-ne sense frustració.

### [Acció: IMPLEMENT] `src/components/... (Editor Universal / Tiptap)`
S'ha detectat que falta un element a l'Editor Universal: damunt del títol (per exemple "Sóc de Poble"), s'ha de col·locar un botó que permeta incloure una imatge. En aquest cas concret servirà per poder incloure sempre el logotip apaïsat i negre, mantenint la coherència en tot el sistema. Cal implementar aquest botó d'imatge de manera universal en l'editor.

### [Acció: MODIFY] `src/components/layout/AppGridShell.jsx` (i associats)
L'usuari ha detectat que a la barra de navegació inferior per a mòbils s'ha colat "Telefonades". Això cal esborrar-ho completament de la barra, ja que és una funció pròpia de WhatsApp que ací no té sentit. La barra mòbil (i els tests/manifests que la validen) ha de contindre exclusivament els 4 botons principals més el botó central d'ajustos en aquest ordre exacte: Xat, Mur, la roda d'Ajustos (Panell de Control al mig), Mercat i finalment Pobles.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Passar tota la suite de tests amb `npm run test:ci`.
2. Validar que la compilació amb `npm run build` o `vite build` funcione correctament.
3. Fer un Lighthouse extrem per a auditar PWA, SEO i Performance, demanat expressament per la directiva.
4. L'Agent local haurà de realitzar una visió integral (a 10-20 anys) per garantir l'estabilitat del model.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

L'ús excessiu d'emojis a plataformes velles pot mostrar quadrats buits; farem servir fallback on siga possible. L'`AbortController` s'ha d'implementar curosament per no matar el fetch dels arxius que SÍ importen si es prem dues vegades per accident.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
