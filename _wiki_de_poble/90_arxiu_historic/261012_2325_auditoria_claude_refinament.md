---
type: informe
status: esborrany
description: Retirada del rail intern, BarraApp amb grups, titular local i entrada que torna al Tauler, amb proves i verificació al navegador.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_835f94bd-d03c-4875-84f8-5870bd2c536c:81c0e06c-6409-4834-8c31-66b8454f3d96
---
# Auditoria Claude · Refinament de la Gestoria (barra única i titular)

Informe d'entrega del prompt [[261012_2245_prompt_claude_refinament]], que convoca les ordres [[261012_2145_ordre_unificacio_barra_maria]] i [[261012_2148_peticio_registre_mestre]]. Continua l'entrega [[261012_2117_auditoria_claude_gestoria_erp]] i contrasta l'auditoria viva de Codex [[261012_2022_auditoria_codex]] (rondes 5 i 6).

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_835f94bd-d03c-4875-84f8-5870bd2c536c:81c0e06c-6409-4834-8c31-66b8454f3d96 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T21:26:03.737Z |
| Modificació | 2026-10-12T21:40:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) |
| Tokens consumits | No mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-12T21:26:03.737Z: esborrany creat; contingut i verificació pendents.
2026-10-12T21:40:00.000Z: informe complet. Rail retirat, titular local, entrada que torna al Tauler, GES-06 i GES-07 de Codex corregides; 432 fitxers i 8.158 proves en verd; verificació al navegador.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum per al Mestre

- **Una sola barra.** La Gestoria ja no té menú propi. Es navega només amb la BarraApp de la plataforma, que ara agrupa els mòduls en «Operacions», «Diners i impostos» i «Arxiu i eines». En mòbil s'hereta el calaix de la plataforma.
- **El titular, de dos maneres.** Al Tauler, «Qui porta esta gestoria?» oferix:
  - «Configura el titular»: un nom i una població que viuen només en la memòria d'esta pàgina. Es pot provar ara mateix.
  - «Entra al compte»: l'entrada real, que en acabar torna al Tauler. Necessita el Supabase local, que ara no corre.
- **Dos troballes de Codex resoltes.** GES-06: el titular desat ara es pot canviar i oblidar sense dades del banc. GES-07: la tornada de Google ara aterra al mateix lloc que l'entrada.
- **Pendent de la teua mà.** Cal tornar a signar amb Touch ID els tractors `gestoria.tauler` i `gestoria.historic`.

### 1 · Ordre 2145: el rail intern, fora; la BarraApp, única

**Què hi havia.** `ShellGestoria` pintava un `<nav>` propi amb els onze mòduls i un botó de plegar. També hi havia una tira horitzontal en compacte, unes regles CSS pròpies i el pont `rutaDeModul`/`modulsServits` a `AppGestoria`. Eren dos llocs que guiaven la mateixa navegació.

**Què hi ha ara.**

- `src/sections/gestoria/tauler/ShellGestoria.jsx`:
  - Sense cap `<nav>` ni enllaços de mòdul.
  - `MODULS_GESTORIA` només descriu la pàgina: títol, subtítol, en obres i explicació.
  - El mòdul el diu la ruta (`modulActiu`). La closca no navega mai entre mòduls.
- `src/apps/gestoria/manifest.js:34`:
  - Declara tres `grups`.
  - Cada entrada porta el seu `grup` (`:41–51`). El Tauler queda sense grup i va primer.
  - L'ordre de les entrades no ha canviat.
- `src/apps/gestoria/AppGestoria.jsx`:
  - Ja no passa ni rep res de navegació.
  - Només `modulActiu` i `hrefEntrada` (`:133`).
- `src/css/modules.css` (bloc GESTORIA TAULER):
  - Retirades totes les regles del rail i de la seua tira compacta.
  - `.sdp-gestoria-closca__pagina` torna a `flex: 999 1 30rem`.
  - Dues classes noves amb regla: `.sdp-gestoria-titular` i `.sdp-gestoria-titular__nota`.
  - `src/css/layout.css`: només s'ha corregit un comentari que nomenava el rail.

**Risc de l'historial (prompt, §Riscos): verificat.**

- Cada clic a la BarraApp afig exactament una entrada a l'historial.
- Enrere i Avant restauren el mòdul, el títol i l'element marcat (`aria-current`).
- La closca no es desmunta entre mòduls: Full, període, vista, ull i titular local es conserven. Codex ho posava com a condició d'acceptació a la ronda 5.
- Ho fixen les proves «la navegació i els mòduls» (`ShellGestoria.test.jsx`) i la de la BarraApp (`AppGestoria.test.jsx`). Al navegador: Tauler → Impostos → Enrere → Avant.

**Mòbil.** El calaix de la plataforma (botó «Obrir menú» de la barra negra) porta la BarraApp amb els tres grups i les onze entrades.

La tira d'icones que demanava l'ordre «si és possible, sempre que s'integre amb el component global» **no s'ha conservat**, per dos motius:

- Mantindre-la dins de la closca seria tornar a tindre dos llocs de navegació.
- Integrar-la al component global és un canvi de la plataforma, no de la Gestoria. Demanaria una clau nova de manifest, una `TiraApp` a la closca de la plataforma i una versió nova del nucli.

`requires_human_decision: true`: si la vols, és una tasca de plataforma pròpia, amb pla.

**Barres que acompanyen el scroll (prompt, §Riscos): intactes.** En mòbil, a 375 × 812:

| Acció | `data-sdp-barres` | Barra negra | «Tornar a dalt» |
| --- | --- | --- | --- |
| Baixar | `totes` | visible | — |
| Pujar | absent | visible | visible |

Les proves S2 (`useBarresAmbScroll`, `BotoTornarADalt`, layout) continuen verdes.

### 2 · Ordre 2148: el titular i l'entrada que torna al Tauler

**Camí A · Titular local (es pot provar ara).** Fitxers: `ShellGestoria.jsx:150, 169, 190, 254, 309, 319, 364`.

- **On ix.** Mentre la boina diu «Titular sense configurar», el Tauler mostra l'avís «Qui porta esta gestoria?» amb «Configura el titular».
- **El diàleg.** Només existix mentre és obert, perquè el seu encapçalament no arribe a l'Índex de la pàgina. Demana:
  - Nom (obligatori; `titularLocalDe` neteja els espais);
  - Població (opcional).
- **En desar:**
  - el nom va a la boina de la pàgina i de cada targeta;
  - el Tauler saluda «Hola, Javi Llinares!»;
  - el focus va a l'H1;
  - el titular escrit ací mana sobre el fitxer de l'empresa que el tractor llig després.
- **Privacitat.** Viu només en `useState`: res a `localStorage`, `sessionStorage` ni IndexedDB, i recarregar l'esborra. Al navegador s'ha comprovat que no hi ha cap clau desada.
- **GES-06 (Codex, P2): confirmada i corregida.** Abans, el nom desat no es podia corregir ni esborrar si no hi havia lectura del banc: «Oblida les dades» només ix amb lectura i amb el tractor aprovat. Ara, quan el titular ve d'esta pàgina, el Tauler mostra l'avís «Titular d’esta pàgina» amb dos botons:
  - «Canvia el titular»: obri el diàleg amb el que ja hi havia.
  - «Oblida el titular»: torna les portes i porta el focus a l'H1.

  Funciona sense extractes i amb el tractor pendent. «Oblida les dades» també l'esborra, com abans.

**Camí B · Entrar al compte (necessita GoTrue local).**

- **Les portes.** Sense sessió, el nom de la boina i el botó «Entra al compte» porten a `/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Ftauler`.
  - El pont de sessió de la plataforma (`useSessioApp`) dona `teSessio` i `rutaEntrada`.
  - `entradaAlTauler` (`AppGestoria.jsx:72`) hi fixa la tornada al Tauler.
  - Amb sessió, el nom porta al perfil i «Entra al compte» desapareix.
- **L'excepció.** L'ordre del Mestre del 261002 manava aterrar sempre al perfil. Ara hi ha una excepció estreta i escrita, `aterratgeDespresDEntrar` (`src/config/rutaEntrada.js:69`):
  - només una tornada segura a `/app/gestoria/<entrada>` mana on s'aterra;
  - la resta, també la Bar (que envia la seua tornada), continua anant al perfil.

  L'abast inicial era qualsevol `/app/<id>/<entrada>`. L'he estret a la Gestoria abans de la ronda 6 de Codex, que ho confirma.
- **GES-07 (Codex, candidat P2): confirmada i corregida.** Hi havia dos llocs que decidien on aterrar:
  - `OnboardingSection` ja usava la decisió nova.
  - La closca (`App.jsx`), en tornar de Google per redirecció, navegava sempre al perfil. Guanyava qui navegava l'últim.

  Ara la closca llig la consulta amb què s'ha muntat, que és la de la tornada (`App.jsx:432`), i passa per la mateixa funció (`:460–461`). `urlDeTornada` ja conservava el `?tornar` de la pàgina. Tres proves noves a `App.test.jsx` munten el callback global, que és el que Codex trobava a faltar:
  - la porta de la Gestoria aterra al Tauler;
  - la decisió és de la closca, també fora de `/registre`;
  - la porta d'una altra app va al perfil.

**El que l'entrada NO fa, i és a propòsit.**

- **No porta dades financeres.** Les xifres continuen eixint dels extractes que tria la persona i del tractor aprovat. Entrar al compte deixa la persona al Tauler, amb el mateix estat que tenia.
- **No posa el nom del compte a la boina.** El pont 261006 no deixa passar el nom de la persona a les apps. Fer-ho és la decisió D2, que continua pendent. Amb sessió i sense titular local, la boina segueix dient «Titular sense configurar».

### 3 · Contrast amb Codex (ronda 6, 23:16)

| Troballa | Estat després d'esta entrega |
| --- | --- |
| GES-06 | Resolta (§2, camí A). |
| GES-07 | Resolta (§2, camí B), amb proves de la closca. |
| Abast de l'excepció a totes les apps | Ja resolt; Codex el descarta a la ronda 6. |
| GES-05 | Deixa d'aplicar: el rail ja no existix. |
| GES-01..03 (retencions a l'historial CSV, snapshot fiscal antic, data fiscal del banc) | Obertes. Fora de l'abast d'este prompt; no les he tocades. |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Com ho prova el Mestre a la previsualització

**Camí A, el titular local** (ara mateix, sense cap servei més):

1. Obri `http://localhost:3340/app/gestoria/tauler`.
2. A l'avís «Qui porta esta gestoria?», prem «Configura el titular».
3. Escriu el nom «Javi Llinares». La població és opcional.
4. Prem «Desa». Ha de passar això:
   - la boina diu «Javi Llinares»;
   - el text diu «Hola, Javi Llinares!»;
   - ix l'avís «Titular d’esta pàgina».
5. Prova «Canvia el titular» i «Oblida el titular». Recarregar la pàgina també l'oblida.
6. Navega amb la BarraApp (per exemple, Impostos) i torna amb Enrere: el titular es conserva mentre la pàgina no es recarrega.

**Camí B, el compte real.** Necessita GoTrue a `127.0.0.1:54321`, és a dir, el Supabase local amb Docker.

1. Abans de res, cal decidir com s'arrenca: el repo no té `supabase/config.toml`, i no l'he creat. És decisió teua.
2. Amb el Supabase en marxa, prem «Entra al compte» (o el nom de la boina).
3. Entra o crea el compte a `/registre`.
4. La pàgina ha de tornar sola a `/app/gestoria/tauler`.
5. Per a vore xifres: «Obri el panell de Tractors» → aprova `gestoria.tauler` amb Touch ID → «Tria els extractes del banc».

El botó «Forçar entrada local (Mock)» de `/registre` no entra a cap compte: no serveix per a esta prova.

### Proves

- `npx vitest run` sobre dotze carpetes:
  - `src/sections/gestoria`, `src/sections/tractors`, `src/apps`, `src/app`, `src/css`, `src/hooks`;
  - `src/sections/disseny`, `src/components/PedraSeca`, `src/components/layout`, `src/sections/onboarding`, `src/config`, `src/sections/wiki-de-poble`.
- Resultat: **432 fitxers, 8.158 proves passades, 2 omeses, 0 fallades** (23:22).
- Proves noves o adaptades:
  - `ShellGestoria.test.jsx`: closca sense navegació; cada mòdul; les portes del titular; el diàleg; canviar i oblidar sense lectura; Cancel·la.
  - `AppGestoria.test.jsx`: grups del manifest; la BarraApp sense rail; `hrefEntrada` amb i sense sessió; `entradaAlTauler`.
  - `rutaEntrada.test.js`: `aterratgeDespresDEntrar` (tornades de la Gestoria, sí; perfil per a nou casos més).
  - `OnboardingSection.test.jsx`: contrasenya i navegador cap al Tauler; la Bar, al perfil.
  - `App.test.jsx`: les tres tornades d'OAuth.
  - `App.appsLocals.test.jsx`: el [CONTROL] de l'entrada; la pintura amb sessió i sense, que ara només difereix en la porta del compte i ho comprova.
  - `WikiDePobleSection.migracioGestoria.test.jsx`: el doble sense rail.

### Navegador

Fet al servidor `vite-dev` (port 3340), en una pestanya pròpia, sense tocar la de l'usuari.

- **Escriptori:**
  - la BarraApp mostra els tres grups i no hi ha cap rail;
  - el flux A complet;
  - historial Tauler → Impostos → Enrere → Avant;
  - consola sense errors.
- **Mòbil (375 × 812):**
  - el calaix porta els grups i les onze entrades;
  - les barres s'amaguen i tornen;
  - «Tornar a dalt» ix en pujar.
- **Fiabilitat de les captures.** Al final de la sessió, el panell del navegador anava a pocs fotogrames (un `requestAnimationFrame` de 1,7 a 5,7 s) i les captures quedaven velles. Per això les comprovacions de mòbil s'han fet sobre el DOM (atributs, rectangles i focus), no sobre les captures.

### Portes i segells

- **No s'han pogut executar** `npm run lint`, `eslint` ni les portes `node tooling/gates/tractor-*.mjs`. El hook `hooks-local.mjs` les bloqueja («Eina opaca o shell no confinada»). No les he forçades.
  - La suite de Vitest inclou les proves de Pedra Seca, de classes òrfenes i de tokens.
  - El pre-commit les tornarà a passar.
- **Segell divergent.** Després de cada edició, `segell-auto.mjs` respon «segell divergent; cap resegellat automàtic». Esta entrega toca fonts del tractor `gestoria.tauler` (`ShellGestoria.jsx`). L'entrega 2117 ja havia tocat `Tauler.jsx` i `targetesTauler.js`, que també són de `gestoria.historic`.
  - Cal re-signar amb Touch ID `gestoria.tauler` i `gestoria.historic`.
  - No he intentat cap resegellat.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### Abast

- **Registre real no executat.**
  - No hi ha GoTrue local.
  - No he escrit cap credencial ni he creat cap compte.
  - El camí B està cobert per proves amb sessió sintètica, no per una entrada real.
- **Router en memòria dins d'un amfitrió.** Si la pàgina amfitriona es recarrega sencera per a tornar de Google, el router en memòria perd el `?tornar`. En eixe cas s'aterra al perfil, que és el comportament anterior.
- **Pendent de decisió del Mestre:**
  - D2, el nom del compte a la boina;
  - la tira d'icones mòbil com a peça de plataforma;
  - com s'arrenca el Supabase local.
- **Obertes i fora d'abast:** GES-01..03.
- **No tocat:** `01_produccio/`, el port neutral, la Frontissa ni els adaptadors de Sollutia.

### Retroalimentació de les plantilles

1. **`prompt_local`: el context compartit.** Demana llegir sencers tots els documents de l'Escriptori: 24 fitxers i uns 250 kB, la majoria d'onades anteriors. Proposta: limitar la lectura obligatòria als documents de la convocatòria i a les auditories de la mateixa onada, citats per nom. La resta només si el prompt els nomena.
2. **`prompt_local`: precondicions d'entorn.** El prompt demanava «registrar-se com a Javi Llinares dins del previsualitzador», però el servei que ho fa possible no corria. Proposta: una secció «Precondicions d'entorn» (serveis en marxa, dades de prova) i una altra «Criteris d'acceptació verificables».
3. **Ruta `auditoria`.** Lliura `auditoria_canonica.md`, que és un protocol per auditar la Wiki, no un informe d'entrega de codi. A més, conté una línia «BROKEN LINK: skills» amb un TODO. Proposta: una ruta `informe.entrega` amb les seccions Canvis, Com provar-ho, Proves, Límits.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261012_2245_prompt_claude_refinament]]
- [[261012_2145_ordre_unificacio_barra_maria]]
- [[261012_2148_peticio_registre_mestre]]
- [[261012_2117_auditoria_claude_gestoria_erp]]
- [[261012_2022_auditoria_codex]]
