---
type: informe
status: esborrany
description: 'Implementacio de T1 a T4 amb decisions D1 D3 D4 D7 D15 D16 i D17: idioma autonom, estat de servidor inabastable, barra mobil de sis caselles i registre net pel port neutral, amb proves i verificacio al navegador.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c2f537df-a372-4dc4-a5ab-092c0a5bb004:cdf4a618-886f-47d2-8848-e542b3894893
---
# Auditoria Claude implementacio T1-T4 idioma dades barra i registre

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

**Dictamen: T1, T2, T3 i T4 estan implementades i provades en local, amb D1, D3, D4, D7 (Avisos), D15, D16 i D17.** El registre real d'un betatester no s'ha pogut fer de punta a punta perquè el Supabase local (`localhost:54321`) està aturat: el flux arriba fins al servidor i, si no respon, ho diu i no deixa l'app trencada. El paquet de WordPress no s'ha regenerat (el hook no deixa executar `npm run build:wp`) i, a més, la carpeta `wordpress-plugin/` ha desaparegut del disc durant el torn per l'acció d'un altre actor.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c2f537df-a372-4dc4-a5ab-092c0a5bb004:cdf4a618-886f-47d2-8848-e542b3894893 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T17:33:19.037Z |
| Modificació | 2026-09-30T19:20:00Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrador i 34 subagents del mateix model |
| Tokens consumits | Subagents: uns 7,8 M en 34 agents i 2.515 crides d'eina, segons els quatre workflows (lectura 2,13 M; implementació 2,14 M; revisió 2,42 M; correccions 1,15 M). Orquestrador: uns 0,6 M segons el comptador de context de la sessió |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-30T17:33:19.037Z: esborrany creat; contingut i verificació pendents.
- 2026-09-30 19:04 (hora local): torn `torn_c2f537df…` obert (abast `code`). Lectura íntegra del prompt, del pla de Fable, del pla i l'auditoria adversarial de Codex, de l'última Acta Marmota i de l'informe v1.0.0 de Fable (lectura dirigida, citada pel prompt; no RAG).
- 19:15: reproducció al navegador de les causes de T1 i T2 (apartat 1).
- 19:30: mapa de 8 lectors independents (una superfície cadascun), base compartida escrita per l'orquestrador i implementació en 7 paquets amb fitxers disjunts.
- 20:05: integració, bateria sencera i verificació al navegador a 360 i 375 píxels.
- 20:35: revisió adversarial (5 revisors i 5 escèptics): 21 troballes confirmades, totes corregides en 4 paquets més.
- 21:10: bateria final, portes i informe.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. El que cal saber en un minut

1. **L'anglés venia de l'amfitrió.** `UIContext` llegia `<html lang>` del WordPress (`en-US`) per damunt de la tria desada i, a més, desava el valor detectat com si l'haguera triat la persona. Ara mana, per este ordre, la tria explícita desada, una `language` vàlida de l'amfitrió i el valencià. El `lang` del document ja no hi compta.
2. **Els `ERR_CONNECTION_REFUSED` venien d'un canvi de mode sense permís.** Obrir `/registre` (el botó «Entrar» de la barra negra hi porta) cridava `enterRemoteMode` en muntar-se i desava per a sempre l'elecció remota, contra un Supabase local aturat. Ara es sonda el servidor abans (capacitat opcional `salut`); si no respon, no es desa res i la pantalla ho diu. Si ja s'està en remot amb el servidor caigut, el Mur i el Mercat oferixen «Tornar al mode de proves».
3. **La barra mòbil té sis caselles:** Xat, Mur, [Panell de Control], Pobles, Mercat i Telefonades. Telefonades obri un diàleg amb el text literal de D17 i no navega. Caben a 360 i 375 píxels (mesurat).
4. **Registre i entrada nets pel port neutral.** Codis d'error neutrals (`CODI_ENTRADA`), `?mode=entrar|crear`, `?tornar` validat fins a 2048 caràcters, àlies `/login`, `/entrar`, `/accedir` i `/crear-compte`, i `RequireAuth` obri «Entrar». Cap vista importa Supabase.
5. **Connectar aterra a la «Safata d’Entrada»** (la carpeta `f-connectats`, amb el mateix id) i la connexió és una còpia editable (D4), amb els drets de l'original i l'avís de drets reservats. Les notes noves naixen amb «CC BY-NC-SA 4.0» i «Copyright (C)» és l'última opció, amb text lliure (D15).

### 1. Causes reproduïdes al navegador

| Fet | Evidència | Arrel |
| --- | --- | --- |
| L'app ix en anglés al WordPress | `http://localhost:8881/pedra-seca-demo/`: `document.documentElement.lang = 'en-US'`, `<soc-de-poble lang="en">`, barra «Chat · Wall · Market · Towns» | `UIContext.jsx:19-28` (lang del document per damunt de la tria) i `:30-32` (desava sempre el valor resolt) |
| `ERR_CONNECTION_REFUSED` al Mur i al Mercat | Vite 3340: clic a «Entrar» → `/registre` → es desa `sdp_embed_data-mode-choice:[…54321…] = {mode:'remote'}` i recarrega → `app_content` i `section_submissions` de mur, events, mercat i multimèdia fallen quatre vegades cadascun; el Mur i el Mercat mostren «No s'ha pogut carregar…» amb el missatge cru | `OnboardingSection.jsx` cridava `enterRemoteMode` en muntar-se; en un build l'elecció no caduca mai (`dataMode.js`, T13) i no hi havia eixida |

El Mestre va canviar la llengua de l'amfitrió a `ca` durant el torn; T1 continua igual, perquè l'app ha de ser autònoma siga quin siga l'amfitrió. L'elecció remota que deixà la reproducció al navegador compartit s'ha retirat amb el botó nou (apartat Verificació).

### 2. Què s'ha implementat

**Base neutral compartida (orquestrador).** `src/data/errorsBackend.js` (codis `CODI_ENTRADA`, `CODI_BACKEND_INABASTABLE`, `esBackendInabastable`, `ambCodi`); `src/config/rutaEntrada.js` (`rutaDEntrada`, `tornadaSegura` amb topall propi de 2048, `modeDEntrada`); `src/config/dataMode.js` (`eleccioRemotaActiva`, `exitRemoteMode`); capacitat opcional `salut: ['comprovaServidor']` a `contracte.js` i `backendPort.js` (el nucli continua en 32 mètodes).

**T1 · Idioma.** `i18n.js` (funcions pures `esLlenguaSuportada`, `llegeixIdiomaTriat`, `desaIdiomaTriat`, `resolIdioma`; tria desada a la mateixa clau amb càrrega `{v:2, codi}`, el valor cru antic s'esborra), `UIContext.jsx` (llengua derivada, cap escriptura en muntar, sincronització entre instàncies, `setLanguage` valida), `PedraSecaEmbed.jsx` (sanejador de `language`, `setLanguage` de l'API descarta codis no suportats, reemissió `sdp-language-changed`). El canvi calent d'`externalConfig.language` ara es veu sense reiniciar (defecte de Codex).

**T2 · Dades.** `runtime.js` marca la fallada de xarxa amb `codi: 'backend-inabastable'`; `content.js` no publica en mode de proves (`code: 'mode-local'`, sense cap petició); `EstatErrorDades.jsx` (compartit pel Mur i el Mercat): tres textos neutrals (servidor que no respon, error del servidor, xarxa), «Torna-ho a provar» i, si l'elecció remota ha substituït una demostració, «Tornar al mode de proves». El detall tècnic només es veu en desenvolupament.

**T3 · Barra mòbil.** `App.jsx` (ordre explícit, Telefonades com a botó amb `aria-haspopup="dialog"` i el `Dialeg` existent, focus que torna al botó també en Safari), `layout.css` (compactada amb tokens: coixins `--sdp-space-*`, radis `--sdp-radi-*`, caselles ≥ `--sdp-touch`, botó central `--sdp-touch-comode`; retallada amb punts suspensius com a xarxa; regla morta `header nav.mobile-nav` esborrada), `nav.panel` = «Panell de Control», espècimen `EspecimenNavMobil` i manifest al dia.

**D16, D17, D7, D3 · Xat i Panell.** «Novetats» amagada (`amagada: true`, entrada conservada) i targeta «Ajustos del xat» al Panell cap a `/control-xat`; vista Telefonades del rail amb el text de D17; Compositor en només lectura per a un canal sense `potEscriure: true` i guarda a `sendChatMessage`; «Gestoria» deixa de dir «ACTIU» i de portar a una ruta inexistent, «Missatges per a dubtes» porta a `/xat`, entradeta i títol SEO del Panell corregits.

**T4 · Registre i entrada.** Adaptador (`auth.js`): traducció dels errors de GoTrue a codis neutrals (credencials, correu pendent, contrasenya feble, compte existent, massa intents, servidor inabastable, desconegut), `MODE_LOCAL` en mode de proves i `comprovaServidor` (GET `/auth/v1/health`, 5 s, mai rebutja). Vista (`OnboardingSection`, `OnboardingSteps`, `onboardingModel`): espera que el port estiga llest, sonda abans de canviar de mode, marca d'un sol ús perquè «Tornar al mode de proves» no es desfaça, controls desactivats sense gir quan el servidor no respon, errors amb l'espècimen `Alerta`, `?mode` i `?tornar`. `App.jsx` (àlies i crida a `recullTornadaOAuth` només en remot), `RequireAuth` (obri «Entrar»), barra negra i administració d'organitzacions (tornada amb el camí i la consulta sencers), `useSEO` (`/entrar` privat).

**D1, D4, D10-A · Connectar.** Carpeta `f-connectats` = «Safata d’Entrada» (icona `Inbox`); verb Connectar a tota la superfície de Connectar; «Entra per a connectar» en lloc de «Simular Guardat»; toast amb la carpeta triada; espera explícita mentre carreguen el Bloc o l'original; error del Bloc amb reintent. Connexió editable: es desen subtítol i entradeta, `NotesDetail` obri `NotesEditor`, en republicar ix el cos editat amb enllaç i autoria si el cos no els porta, i els drets són els de l'original (`origen.drets`, mai de l'URL), de només lectura a l'editor. D10-A: una adreça dins del paràmetre `text` s'accepta, sense la puntuació final i amb l'entradeta tallada per punts de codi.

**D15 · Llicències.** `LLICENCIA_PER_DEFECTE = 'CC BY-NC-SA 4.0'` només per a les notes noves de «CREAR NOTA» sense herència (no retroactiu, mai per a contingut d'altri); «Copyright (C)» és l'última opció, amb text lliure, 256 caràcters en total comptats per punts de codi.

**i18n.** 21 claus noves o canviades, als cinc idiomes, cobertes per `i18n.claus.test.js`.

### 3. Decisions preses per l'orquestrador (reversibles, per a revisar)

| Decisió | Motiu |
| --- | --- |
| La precedència d'idioma és tria desada > `language` de l'amfitrió > valencià; `element.setLanguage()` compta com a amfitrió | Ordre T1 i Llei de l'Enxufabilitat |
| T16 (entrar a `/registre` canvia de mode) es conserva, però només si el servidor respon | Evita revertir una decisió fixada per prova i tanca la trampa |
| Sense sonda concurrent (circuit breaker) a `runtime.js` | Tocaria totes les peticions; amb la sonda i l'eixida n'hi ha prou |
| Telefonades és un diàleg, no una ruta ni una secció | No encén «Xat», no carrega el Xat i no entra al manifest SEO |
| El botó central no porta `aria-current` a `/control` | Garantia T61 fixada per prova |
| CC per defecte: BY-NC-SA 4.0 | El pla aprovat diu «CC No Comercial»; ShareAlike és coherent amb la llicència del codi |
| El retall del xat continua a «Altres notes» | D1 parla del que es connecta; un retall és teu |
| La regla de la llavor que fa administradora dels Avisos qualsevol persona amb sessió no es toca | La fixa `localXat.test.js:122`; D7 es veu en remot |

### 4. Revisió adversarial

Cinc revisors (idioma; sessió i dades; barra i xat; Connectar; doctrina) i un escèptic per dimensió. Han sobreviscut 21 troballes (3 mitjanes, 18 baixes) i totes estan corregides amb proves que fallen sense la correcció:

- **Mitjanes:** la sonda es decidia abans que el port estiguera instal·lat (carrera en la primera càrrega de `/registre`); la tornada es perdia per damunt de 300 caràcters (un `/connectar` compartit); «Obrint el teu Bloc…» es quedava per sempre si el Bloc fallava.
- **Baixes:** «Tornar al mode de proves» es desfeia sol a `/registre`; gir infinit al botó; text de GoTrue en anglés; focus en Safari; títol de la pestanya; «Ajustos del xat» sense traduir; tres claus d'`NotesEditor` absents; «Revisa la connexió» per a errors del servidor; prova T63.2 que no arribava a l'asserció (el mock de `XatContext` ara conserva el mòdul real i la prova passa); mode cru a Connectar; drets de l'original sense `t()`; connectar abans de resoldre l'original; puntuació enganxada i entradeta massa llarga a D10-A; autoria omesa en republicar; drets relicenciables a l'editor; títol i emoticona de l'original a la fitxa; tall silenciós de «Copyright (C)».
- **Descartades per l'escèptic** (deute previ o comportament documentat): el portal de l'índex a `document.body` (és l'H2 de Codex), els títols del Panell en basc i gallec, els 5xx com a «no respon», la guarda de `sendChatMessage` amb un objecte parcial, el botó «Entrar» a `/registre`, les adreces amb credencials a l'entradeta i el nom d'una prova del Mur.

### 5. Pendents i fora d'abast

| Pendent | Estat |
| --- | --- |
| D7 «General» només amb moderació | No fet: D7 i D18 es contradiuen («General dalt» a la comunitat) i no hi ha cap capacitat de moderació. Decisió del Mestre |
| D8, D9, D13, D18, D10-B | No fets: canvien l'aterratge, el model de «Comentar» (T63.2), l'espai de noms (cal ADR i migració) i el manifest (l'ADR-2026-08 el veda). El mapa de viabilitat és al lector de rutes |
| Recuperació de contrasenya i reenviament de la confirmació | No fets: necessiten plantilles de correu amb `{{ .Token }}` i SMTP, que no estan versionats (no hi ha `supabase/config.toml`) |
| Ruta després de la recàrrega en incrustació | En router de memòria, el canvi de mode torna a la ruta inicial: calen dos clics per a entrar |
| Errors de Google a `oauthRelay.js` | Alguns porten text del proveïdor sense codi; la porta `tractor-frontera-auth` protegix eixe fitxer |
| Barra a 360 píxels en castellà | Falta 1 píxel: «Llamadas» es retallaria amb punts suspensius (a 375 hi cap tot) |
| `ConnexioDetall.jsx` | Sense cap ús des de D4; no s'ha esborrat |
| Textos de `ControlSection` i títols SEO fora de `t()` | Deute previ |
| Majúscula de «Panell de control» a la barra lateral | La fixa la prova T61; la barra mòbil diu «Panell de Control» |
| Paquet de WordPress | Cal `npm run build:wp` perquè els canvis arriben a `localhost:8881`; el hook no el deixa executar |
| `wordpress-plugin/` esborrat del disc | Ho ha fet un altre actor durant el torn (16 fitxers en `D` a `git status`, i també `scratch/socdepoble-wordpress-plugin.zip`; ha aparegut `.agents/skills/core-empaquetat-wp/`). No s'ha tocat ni restaurat |
| Portes que el hook no admet | `porta:tokens`, `vocabulari`, `inlinestyles`, `cataleg`, `pedra-seca`, `crom` i `psicopatia`: les ha de passar l'orquestradora o el Mestre abans del commit |

### 6. Relleu per a ESTAT i LEDGER

ESTAT i LEDGER són camins de governança. `executor-mutacio.mjs` exigix un segell previ vàlid i el segell és divergent des d'abans del torn («Segell previ invàlid; reconciliació explícita requerida»). El relleu queda ací per a l'orquestradora:

- **ESTAT_ACTUAL · 2026-09-30 · Claude (Opus 5.5) · T1–T4 implementades.** Torn `torn_c2f537df-a372-4dc4-a5ab-092c0a5bb004`. Idioma autònom (valencià per defecte), sonda de servidor abans de passar a remot i eixida al mode de proves, barra mòbil de sis caselles amb l'avís de D17, registre i entrada amb codis neutrals, Safata d'Entrada, connexió editable i CC per defecte. Revisió adversarial: 21 troballes confirmades i corregides. Informe `260930_1930_auditoria_claude`. Següent acció: el Mestre revisa les decisions de l'apartat 3 i al navegador; `npm run build:wp` i registre real amb Supabase en marxa. Bloquejos: segell divergent, `wordpress-plugin/` absent del disc.
- **LEDGER:** «260930 | torn | Claude | T1-T4 idioma, dades, barra mòbil, registre, Safata; revisió adversarial i correccions».

### 7. Proposta d'Automillora (retroalimentació de `prompt_local`)

1. **El Preflight va arribar buit** («[pendent]»). Amb l'estat dels servidors (Supabase aturat, bundle de WordPress en desenvolupament, elecció remota desada) s'haurien estalviat dos lectors.
2. **Les decisions D1–D18 barregen ordre i context.** Convé separar «implementa en este torn» de «respecta si toques», i dir quines tasques cobrix cada decisió (per exemple, D7 General i D18 es contradiuen).
3. **«L'usuari es pot registrar» necessita un servidor.** El criteri d'acceptació hauria de dir amb quin backend es prova (Supabase local en marxa, o un transport simulat).
4. **El pla vinculat no es pot vincular.** `260930_1730_pla_implementacio_fable.md` porta «Model IA» i «Tokens» en «[pendent]» i `document.mjs plan` el rebutja; la plantilla hauria d'acceptar `N/D` per a documents de l'orquestradora.
5. **El hook bloqueja eines necessàries per a tancar** (`npm run build:wp`, `tancament.mjs --check`, `npm run lint`): convé una llista d'ordres de lectura i de construcció admeses per a Claude, o que MarIA les execute en el mateix torn.
6. **L'arbre és concurrent.** Durant el torn han canviat `tooling/`, `.agents/skills/` i s'ha esborrat `wordpress-plugin/`. El prompt hauria de dir qui més treballa i sobre quins camins.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Què | Com | Resultat |
| --- | --- | --- |
| Bateria sencera | `npx vitest run src tests` (21:03, després de les correccions) | 246 fitxers, 3.784 de 3.785 proves en verd. L'única roja és prèvia al torn: «en mode estret, des de la llista es torna a la conversa oberta» (`XatSection.test.jsx`, busca `.app-grid-header-btn`, que el Xat no pinta en estret des del 260927). L'altra roja prèvia (T63.2) ara passa. Abans de les correccions: 3.708 de 3.710 |
| Lint dels fitxers del torn | `node --test tests/lint-sessio.test.mjs tests/lint_xat.test.mjs` | 21 de 21 en verd (ESLint amb `--max-warnings=0`) |
| Altres linters | `node --test tests/lint_enxufe.test.mjs tests/lint_logica_usuari.test.mjs` | `lint_enxufe` sense fallades (diagnòstics `todo` previs). `lint_logica_usuari`: una fallada per `--sdp-radi-base` a `src/css/modules.css`, fitxer que no s'ha tocat en el torn (modificat a les 15:58, abans d'obrir-lo) |
| Enxufabilitat | `node tooling/gates/tractor-enxufe.mjs` | E1–E4 en verd |
| Disseny | `node tooling/gates/design_guard.mjs --arrel=src` | Igual que la línia base: una sola identitat NOVA, l'`h1-multiple` previ de `DocumentPrintPreview.jsx`; `inline-style` de 17 a 4 i `raw-color` de 20 a 17 |
| Barra mòbil a 375 i 360 píxels | Navegador integrat, mesura del DOM real | 375: caselles de 44, 44, 48, 54, 57 i 92 píxels, cap rètol retallat, barra de 71 píxels. 360: 339 píxels de caselles en 344 útils, cap retall. Amb la lletra real, en els cinc idiomes: ca 340, es 345 (1 píxel de més a 360), en 291, eu 337 i gl 339 |
| Telefonades | Clic real | Full inferior amb el text literal de D17, sense canvi de ruta; en tancar amb «Entesos» el focus torna al botó |
| Mur en remot amb el servidor caigut | Clic real | Text neutral, «Torna-ho a provar» i «Tornar al mode de proves»; este últim esborra l'elecció i el Mur torna a la llavor |
| Càrrega neta | Pestanya nova a `/mur` | Cap error a la consola i cap petició a `54321` |
| `/entrar` directe amb el servidor caigut | Pestanya nova | Espera el port, una sola sonda a `/auth/v1/health`, avís «El servidor del poble no respon…», cap elecció remota desada, formulari desactivat sense gir, pestanya «Entrar o crear compte» |

Cap prova amb xarxa real: tot contra backends falsos pel port o transports simulats. Cada paquet va prendre línia base abans de tocar res i les correccions es van comprovar revertint-les temporalment.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- El registre d'un betatester no s'ha fet contra un servidor real: Supabase local està aturat i arrencar-lo demana Docker i ordres que el hook no admet.
- El WordPress local continua amb el paquet anterior: sense `npm run build:wp` els canvis no hi arriben, i la carpeta del connector ha desaparegut del disc.
- Les captures del navegador van fallar quan el panell estava amagat; la verificació es va fer amb el DOM i el text de la pàgina.
- El focus en Safari iOS s'ha corregit segons l'especificació; no s'ha provat en un iPhone.
- Les traduccions al basc i al gallec no les ha revisades cap persona nativa.
- No s'ha escrit a ESTAT ni a LEDGER ni s'ha tancat el torn: el segell de governança és divergent des d'abans i `tancament.mjs` no és una ordre admesa pel hook.
- L'arbre és compartit: altres actors han editat `tooling/`, `.agents/` i han esborrat `wordpress-plugin/` mentre durava el torn. No s'ha atribuït res d'això al torn ni s'ha revertit.
- La xifra de tokens de l'orquestrador és aproximada.
- La memòria persistent de Claude no s'ha pogut actualitzar (el hook bloqueja tota escriptura fora del repositori). La lliçó que s'hi volia desar: amb agents editant `src/` en paral·lel, l'HMR del Vite executa versions intermèdies a les pestanyes obertes i pot deixar `data-mode-choice` desat al localStorage compartit; per a verificar, cal esborrar-lo i obrir una pestanya nova.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260930_1730_prompt_claude]]
- [[260930_1730_pla_implementacio_fable]]
- [[260930_1650_auditoria_codex_adversarial]]
