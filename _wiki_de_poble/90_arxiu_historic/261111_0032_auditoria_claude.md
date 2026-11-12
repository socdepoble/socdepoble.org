---
type: informe
status: esborrany
description: Kit R17.1A (interceptor de recuperació d'Android, App Link, ull, safe-area, hidratació) i anàlisi del Kit R17.1B amb Vitest focal i àrbitre adversari
tags:
  - auditoria
visibility: private
reflex: sdp:torn_546d6e14-ae92-4745-bf75-1b19fd9d2b1d:6a9a7439-5ae9-4df2-9ffe-2a4a78aef17c
---
# Auditoria Gauntlet de Claude · Onada R17 Carril 1 (Kit R17.1A i R17.1B)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_546d6e14-ae92-4745-bf75-1b19fd9d2b1d:6a9a7439-5ae9-4df2-9ffe-2a4a78aef17c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-10T23:32:11.939Z |
| Modificació | 2026-11-11T00:06:05.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) · Claude Code, Ultracode |
| Tokens consumits | Sense comptador per torn a la sessió; subagents dels workflows: 3.043.821 (Kit R17.1A, 12 agents) + 669.513 (àrbitre de l'interceptor, 3 agents) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-10T23:32:11.939Z · Esborrany creat amb el circuit documental (torn_546d6e14).
- 2026-11-11T00:06:05.000Z · Kit R17.1A i Kit R17.1B (WordPress) implementats, passats per l'àrbitre adversari i verificats amb Vitest focal i amb el build real de WordPress.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Condició d'execució

La sessió corre dins de `socdepoble.org`, amb els hooks actius, com demana l'avís `v4.23118.1`. `tooling/gates/hooks-local.mjs` només admet lectures, edicions de `src/`, `npx vitest run`, `node --test tests/…` i el circuit documental. Bloqueja `npm run build`, `npm run lint`, `cap sync`, `firebase deploy`, `git commit`, `git push` i `python3`. El Mestre ha triat que Claude implemente i verifique, i que ell llance el build i el desplegament amb el bloc lliurat per a cada Kit (AskUserQuestion, 261111). L'únic build fet ací és el de WordPress dins de `tests/standalone-build.test.mjs`, una ordre que el hook permet i que compila en una carpeta temporal.

### Matriu de Conformitat de Requeriments (MCR)

| Requeriment del Pla | Estat | Evidència / Fitxer comprovat | Motiu si no s'ha assolit |
| :--- | :--- | :--- | :--- |
| T1.1 · Enllaç de recuperació compartit (`/auth/v1/verify`, `type=recovery`, `token_hash=`, `#access_token=`) mai al Xat; obri la contrasenya nova | `[FET]` | `src/natiu/compartirNatiu.js` (intercepció a `rep()`, sobre el text sencer, abans del registre i de `sdp:compartir_natiu`), `src/config/compartirNatiu.js` (`pareixCredencialDAutenticacio`, defensa en profunditat), `src/data/tornadaRecuperacio.js` (`enllacDeRecuperacioEnText`, desembolcalla Safe Links i `google.com/url`), `src/data/recuperacioPendent.js` (`ofereixAdrecaDeRecuperacio`, `avisaEnllacDAccesInservible`), `src/app/App.jsx` (`atenTornada`, escoltes), `src/natiu/entrada.jsx` (connexió de producció). Proves: `src/natiu/compartirNatiu.autenticacio.test.js` i la prova AH-R17-11 de `src/config/compartirNatiu.test.js` (munta l'entrada nativa de veres) i d'`App.test.jsx` | Segueix R2 del Mestre: el token no es verifica en arribar, sinó en «Desa». Per això l'App fa el camí de l'enllaç pendent (`anunciaEnllacDeRecuperacio`), no `marcaRecuperacioPendent`, que és el de compatibilitat amb sessió. |
| T1.2 · `intent-filter` `ACTION_VIEW` `BROWSABLE` `autoVerify` per a la recuperació | `[NO FET]` | Implementat i retirat dins del torn: `AndroidManifest.xml` i `CompartirNatiuPlugin.java` tornen a HEAD | Les tres lents de l'àrbitre coincidixen en una P1. Android no pot filtrar pel fragment, i `pathPrefix="/registre"` s'enduria l'alta, l'OAuth web, els convits i els enllaços caducats, que l'App perdria en silenci. Cal un camí exclusiu (p. ex. `/registre/recupera`) a `paginaDeLaRecuperacio`, a la llista de Redirect URLs de GoTrue i al filtre, a més de l'empremta de Play a `scripts/botigues/associacio-apps.json`. Decisió del Mestre. Es trasllada al pla següent. |
| T1.3 · Ull `👁️` a «Nou valor per a contrasenya» | `[FET]` | `src/sections/profile/DetallAjust.jsx` (reutilitza `ControlContrasenya` i la clau `section.login.registre.ullContrasenya`, amb `aria-pressed`), `DetallAjust.contrasenya.test.jsx` | Placeholder retirat pel criteri d'acceptació 2 («cap text tallat a 320×480»): 257 px de text en 164 px de caixa. |
| T1.3 · Solapament del títol de `/el-meu-perfil` sota la barra blava | `[PARCIAL]` | Mesura en DOM reconstruït a 375×812 i 320×480 (sense sessió): cap solapament | No reproduït. Cal la captura de Sofía o una sessió en un Android real. Hipòtesi: a 320×480 les barres del Perfil no s'amaguen mai (`FRACCIO_VISOR`) i hi queden 286 px de crom fix. |
| T1.4 · Safe-area de baix al calaix CONTROL i al «Descarta» dels fulls inferiors | `[FET]` | `src/css/layout.css`, `src/css/components.css`, `calaixControl.zonaSegura.capes.test.jsx`, `Dialeg.zonaSegura.capes.test.jsx` | `env(safe-area-inset-bottom, 0px)` sobre el coixí que ja hi havia: sense zona segura, la pantalla queda idèntica. |
| T1.4 · Zoom del 400 % (320×480) | `[FET]` | Garanties existents fixades amb proves: full inferior `max-height: min(88dvh, 48rem)` i `overflow-y: auto`; calaix `var(--sdp-calaix-alt)` | No s'ha posat `max-height: 100dvh` al calaix: taparia la barra negra (O4-CLAUDE-1b). La garantia que ja hi ha és més estreta. |
| T1.4 · Guarda `isHydrated` dels esborranys de `/notes` i `/xat` | `[FET]` | `src/sections/notes/useLocalSandbox.js` (`fusionaTeclejat`), `NotesEditor.jsx`; reproduït en roig (7 de 7) i verd després | `/notes` amb sessió i `/xat` ja estaven protegits, i ho demostren proves noves. |
| T2.1 · Entrada de WordPress per davall d'1.630.000 B | `[FET]` | `vite.standalone.config.js` (`trossDArrencadaDelPaquet`), `tests/standalone-build.test.mjs`, `src/apps/plataforma/pesDelNucli.test.js` | Premissa corregida: no és un IIFE, és el tros ESM del paquet trossejat, i ja passava el sostre abans de R16a (1.713.206 B el 07/11). |
| T2.2 · Assimilar `kit_r16_c_arrelament_i_origen` | `[NO FET]` | Anàlisi de lectura del kit | Parent `01fd75c9c` ≠ HEAD `0027b698d`. El CAS és tot o res i `package.json` tornaria a 1.1.0. Uns 84 camins de producte coincidixen amb R16a o R16b, i la subnavegació, La IAIA Sabuda, el nomenclàtor i l'enquadrament ja han entrat. El README del kit prohibix copiar payloads a mà. Cal un rebase de Codex sobre `0027b698d` amb només el que és nou. |
| T2.3 · `build:natiu` + `cap sync` | `[PENDENT DEL MESTRE]` | Ordres al bloc de lliurament | El hook les bloqueja. |
| T2.3 · Comprovador de `versio-viva` amb fallback offline | `[NO FET]` | Anàlisi de lectura | Cap peça al repo. R16a i R16b en van rebutjar intents per la CSP nativa, el CORS, els valors escrits a mà i els botons cap a canals tancats. La forma honesta passa per la capacitat `versioClient` (camp nou `versio_recomanada`, migració SQL del Mestre) i per un `versio-viva.json` del mateix origen a la web. És una Onada pròpia. |
| T3 · Kits R17.2 (Codex) i R17.3 (Gemini Carbon) | `[NO FET]` | `261111_0012_auditoria_codex.md` llegit | El prompt mana desplegar R17.1A i R17.1B abans. Codex encara no tenia el recompte de Vitest i el seu pegat ha de conservar el canvi de `useLocalSandbox.js` del Carril 1. Del Kit R17.3 no hi ha cap kit al dipòsit. |

### Gauntlet de l'interceptor (3 lents, cap P0)

- P1 · El filtre `/registre` era massa ample: retirat (vegeu T1.2).
- P1 · Una credencial no consumible obria el Xat amb un fals error de fotos. Corregit: no fa cap lot, avisa (`EVENT_ENLLAC_DACCES_INSERVIBLE`) i l'App porta a l'entrada amb un missatge propi en les cinc llengües.
- P1 · Cap prova cobria la connexió de producció. Corregit: la prova AH-R17-11 munta `entrada.jsx` de veres.
- P2 aplicades: doble i triple codificació (`%253D`), cap fals positiu de `type=signup|invite`, `auth.socdepoble.org` sempre a la llista d'orígens i reintent amb l'esdeveniment `online`.
- P2 obertes:
  - login-CSRF. Ja existia a la web; sense App Link no queden vectors nous sense un gest de la persona. Mitigació proposada: comparar l'usuari de `/verify` amb la sessió viva abans del PUT.
  - Logs de depuració de Capacitor (`loggingBehavior`).

### WordPress (T2.1): mesura del build real

- Abans: entrada de 1.737.422 B, que és també l'arrencada.
- Amb `trossDArrencada` sencer: entrada de 681.752 B, però arrencada de 1.778.177 B (+40.755 B). El grup `pobles-aplec` feia estàtic contingut d'articles que a WordPress és diferit.
- Amb `trossDArrencadaDelPaquet` (sense `pobles-aplec`): entrada de 741.904 B (gzip 244.375 B) i arrencada de 1.733.512 B (−3.910 B). Les 42 proves de `tests/standalone-build.test.mjs` passen.
- Trinquet nou: `SOSTRE_DE_L_ARRENCADA_ESTATICA = 1737422` (l'entrada sencera d'abans d'R17). Partir l'entrada no pot fer créixer l'arrencada.
- Observació: el web també agrupa `pobles-aplec` i pot tindre el mateix efecte. Està sense mesurar.

### Altres troballes per a MarIA i el Mestre

- El Llibre Mestre viu porta el literal `[truncated for diff preview]` a la fila P0-75 i, en el moment de la lectura, no tenia cap fila de P0-78 a P0-95. Codex també ho va veure. Ara algú el reescriu (624 línies de diferència): s'ha de revisar contra HEAD.
- `src/natiu/entrada.test.jsx` depenia de `.env.local` (`VITE_APP_ISSUER`): ara és hermètica.
- `App.appsLocals.test.jsx` i `barraBlavaEstreta.capes.test.js` només fallaven amb càrrega: en una màquina descarregada passen (45 de 45).
- Política de la hidratació, per a confirmar: la tecla feta damunt de la benvinguda es descarta si el camp té un esborrany desat propi. L'alternativa és pintar «Carregant…».
- La barra lateral fixa (≥1024 px) no porta la zona segura de baix (tauleta Android apaïsada). Decisió del Mestre.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `npx vitest run` dels 14 fitxers focals del Kit R17.1A (interceptor, App, perfil, Dialeg, calaix, pantalla completa, hidratació, xat) · 305 de 305 (01:06).
- `npx vitest run` de les 10 suites de l'interceptor, Android i App · 293 en verd i 1 omesa (iOS sense projecte).
- `npx vitest run src/app/App.appsLocals.test.jsx src/css/barraBlavaEstreta.capes.test.js` · 45 de 45.
- `npx vitest run` de 6 proves de qualitat amb ESLint de les zones tocades · 38 de 38.
- `node --test tests/standalone-build.test.mjs` · 42 de 42, amb el build real de WordPress (monolític i trossejat).
- `npx vitest run src/apps/plataforma/pesDelNucli.test.js` · el sostre de l'entrada falla sobre el dist vell del 07/11 (1.713.206 B), un deute heretat. Passarà quan el `npm run build` del Mestre refaça el dist.
- Pendent del Mestre: `npm run lint`, `npm run build`, `npm run build:natiu`, `npx cap sync`, el desplegament i la sonda.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No s'ha compilat cap APK ni s'ha provat en cap dispositiu Android: la intercepció es demostra amb un pont fals de Capacitor i amb l'entrada nativa de veres en jsdom.
- La zona segura i el 400 % es demostren amb proves de CSS i de DOM: a l'escriptori `env()` val 0.
- El solapament del títol del Perfil no s'ha reproduït.
- `npm run lint` no s'ha executat (hook); el pre-commit el passa.
- Retroalimentació de la plantilla `prompt_local`: el preflight hauria de comprovar que l'agent pot executar els builds que se li demanen, o declarar que el desplegament és del Mestre, i hauria de citar el tall real del Llibre Mestre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261110_2334_pla_implementacio_onada_r17_pentacanal_android_workspaces_i_drets]]
- [[261110_2334_prompt_claude_onada_r17_android_pentacanal_i_integracio]]
- [[261111_0012_auditoria_codex]]
- [[03_llibre_mestre_tasques_i_idees]]
