---
type: informe
status: esborrany
description: Revisió local de rutes, CSS i seguretat PWA amb reproduccions de dues incidències i 513 proves seleccionades.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_b3675da1-5bcb-453e-b655-b4416d91b0ff:a07893a2-b814-426a-b70d-99b72d0c7966
---
# Auditoria independent post-Onada 3

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b3675da1-5bcb-453e-b655-b4416d91b0ff:a07893a2-b814-426a-b70d-99b72d0c7966 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T17:13:03.787Z |
| Modificació | 2026-10-03T17:17:00Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex (GPT-6) |
| Tokens consumits | No disponibles en esta sessió; no estimats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-03T17:13:03.787Z: informe creat després de la revisió local i de dues reproduccions; cap correcció de codi aplicada. L'aprovació humana continua pendent.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dues incidències confirmades. No es pot declarar «Arquitectura segellada».** Les dues existien abans de l'Onada 3: són deute vigent, no regressions atribuïdes a esta onada.

### F1 · P1 · El vigilant de l'emergent invalida el retorn OAuth amb COOP

**Fitxer:** `src/data/oauthRelay.js:385–390`; neteja definitiva a `:337`; prova incompleta a `src/data/oauthRelay.test.js:114–130`.

Quan el proveïdor separa l'emergent en un altre grup de contextos amb COOP, el `WindowProxy` que conserva la finestra mare pot retornar `closed === true` encara que la persona continue autenticant-se. És el comportament documentat de [Window.open en MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/open). El codi només contempla COOP dins del `catch`, com si llegir `closed` haguera de llançar una excepció.

Al primer tic de 700 ms, `esperaCodi` rebutja l'entrada, retira els escoltadors `message` i `storage`, i el `finally` d'`entraAmbGoogle` esborra el verificador PKCE. Quan arriba el retorn, el camí alternatiu per `storage` ja no pot completar l'entrada. Afecta el navegador que usa emergents; el camí de redirecció de la PWA instal·lada evita este vigilant.

**Reproducció executada:** s'ha carregat el codi actual d'`oauthRelay.js` en un context Node VM, substituint només dependències externes, navegador i temporitzadors. S'ha cridat `entraAmbGoogle` amb configuració sintètica, un emergent amb `closed: true` i s'ha executat el primer tic abans del retorn. Resultat:

```json
{"error":"S'ha tancat la finestra abans d'acabar d'entrar.","listeners":[],"verifierPresent":false,"fetches":0}
```

La prova existent titulada «Camí 2 (COOP)» manté `closed: false` i injecta l'esdeveniment `storage` abans d'este escenari; per això passa. La condició defectuosa també figura en `HEAD` anterior a l'onada.

**Severitat i contracte:** P1, perquè talla un camí principal d'autenticació en el cas que el mateix mòdul afirma suportar; contradiu el retorn fiable a l'amfitrió exigit per P1 de l'Onada 3 i la Llei de l'Enxufabilitat.

**Proposta conservadora:** no usar `WindowProxy.closed` com a prova suficient de cancel·lació després d'una navegació entre orígens. Mantindre el retorn autoritzat per `storage` i el termini màxim, o usar un flux de redirecció que no depenga d'eixa referència. Afegir una prova on `closed` esdevé `true`, passa almenys un tic i arriba després el codi; completar-la amb una prova real del proveïdor amb COOP. No s'ha aplicat cap canvi. `requires_human_decision: false` per a reconéixer el defecte; el disseny definitiu de la correcció correspon al pla posterior.

### F2 · P2 · El full de ruta conserva 39 enllaços interns lligats al domini de producció

**Fitxer:** `src/sections/text/pageContent.js:126`, HTML de `PAGE_COPY.roadmap`. Camí de renderització: `src/app/App.jsx:845` → `TextRoute` → `src/sections/text/TextSection.jsx:29`.

Hi ha **39 àncores actives**, fora de comentaris HTML, a `https://socdepoble.org/auditoria/llavor/...`; per exemple, `https://socdepoble.org/auditoria/llavor/plantilles-mestre`. En obrir `/roadmap` des d'una instal·lació WordPress o un altre amfitrió, estos enllaços depenen del domini fix i naveguen fora de la instal·lació.

`resolRecursosDeHtml` resol recursos, però no transforma estos `href`. `hrefInternDeClic` només intercepta rutes relatives a l'arrel o consultes: retorna `null` per a estes URL completes. La reproducció amb `PAGE_COPY.roadmap.html`, JSDOM i la funció real `hrefInternDeClic({button: 0}, ancora, '/comunitat')` ha comptat 39 coincidències i 39 retorns `null`.

**Severitat i contracte:** P2, eixida concreta del guió de portabilitat: la navegació pròpia del full de ruta queda acoblada a `socdepoble.org`. El fitxer no té canvis respecte de `HEAD`; és deute heretat. No es confonen amb este defecte els dominis d'una llista de confiança, les metadades SEO ni les referències històriques.

**Proposta conservadora:** relacionar cada llavor amb el seu destí intern vigent i emetre la ruta que entén el router. No basta llevar el domini mecànicament: no s'ha localitzat una ruta React vigent `/auditoria/llavor/*`. Si alguna destinació ha de ser expressament externa, documentar-la com a tal. `requires_human_decision: true` només per a decidir el destí de les llavors sense equivalència vigent.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Base:** arbre de treball local sobre `b22b168b9ed6935e0d4a91ed6d39fc2697d24f19` (Onada 2). L'Onada 3 conté canvis sense commit; s'ha revisat el contingut del disc, no una versió desplegada.

**Proves executades:** 22 fitxers, **513 proves passades**, en dues execucions de Vitest. No s'han afegit ni modificat proves.

```bash
./node_modules/.bin/vitest run \
  src/data/oauthRelay.test.js src/data/oauthRelay.amfitrio.test.js \
  src/data/oauthRelay.pwa.test.js src/data/tornadaRecuperacio.test.js \
  src/data/recuperacioPendent.test.js src/data/supabase/auth.recuperacio.test.js \
  src/data/supabase/sessionIsolation.test.js src/pwa \
  src/components/universal/workspace/UniversalWorkspace.mestreDetall.test.jsx
# 12 fitxers; 159 proves passades

./node_modules/.bin/vitest run \
  src/sections/profile/PerfilShell.ambit.test.js src/config/assetResolver.test.js \
  src/app/enllacosInterns.test.js src/data/identitat.persistencia.test.js \
  src/data/supabase/auth.persistencia.test.js src/data/sessionService.persistencia.test.js \
  src/sections/notes/GlobalSaveManager.test.js src/data/autodesament \
  src/config/capaDelPaquet.test.js src/PedraSecaEmbed.config.test.jsx
# 10 fitxers; 354 proves passades
```

**Comprovacions dirigides:** cerca transversal de dominis, navegacions, escriptures de tokens, emmagatzematge, punts d'injecció HTML i selectors CSS; lectura dels fluxos OAuth i recuperació, identitat, política de persistència, Service Worker, registre PWA, aïllament de notes, magatzems IndexedDB locals, router i resolució d'actius. Contrast dels canvis de CSS de perfil, graella i mestre-detall amb les capes i el Shadow DOM de l'enxufe.

**Context compartit llegit:** `AGENTS.md`, genotip, índex de la Wiki, taxonomia documental, índex de l'Escriptori i els quatre documents de torn del primer nivell: pla de MarIA de les 12:50, prompt d'Onada 3 de Claude de les 12:50, auditoria de Claude de les 13:30 i prompt de Codex de les 19:00. L'auditoria de Claude encara es presenta com a pla v0.2 i el pla de MarIA té apartats pendents; no s'han tractat com a evidència d'execució. També s'ha contrastat l'esmena PWA del laboratori d'Onada 4.

**Protocol documental:** porta Olivera inicial i final correctes; informe creat i ancorat amb `document.mjs create`; `document.mjs check` retorna `valid: true`.

`node tooling/gates/tancament.mjs --check --turn-id torn_b3675da1-5bcb-453e-b655-b4416d91b0ff` retorna **exit 1, 584 errors**. Passen plantilles, autoritat, segell, catàleg de skills i compilació estricta de la Wiki. Fallen la signatura del LEDGER i SCC; a més, el torn documental queda en `context_loaded` perquè no té un pla vinculat ni relleu al LEDGER. Entre les incidències SCC hi ha annexos de producció i laboratori sense ancoratge. S'ha executat la porta requerida, però **no s'ha segellat el torn ni reparat la governança fora de l'abast de l'auditoria**. Este resultat no s'ha presentat com una fallada de les 513 proves de producte.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

La revisió és estàtica i amb proves locals dirigides; no equival a una lectura línia a línia de tot el repositori ni de tot el laboratori recursiu de l'Escriptori. S'han llegit els documents de torn del primer nivell i el context tècnic indicat; no es certifica la totalitat dels annexos de producció i investigació. Esta és una limitació respecte de l'abast literal del prompt.

No s'ha fet una entrada real amb Google, una recuperació per correu, una inspecció de la configuració GoTrue desplegada, una instal·lació en iOS/Android ni una comparació visual de totes les pantalles. F1 és una reproducció del codi davant un comportament documentat del navegador, no una mesura de freqüència en producció. No s'ha reproduït cap altra fuita global de CSS ni una exposició nova de tokens causada pel Service Worker; això no certifica absència de vulnerabilitats.

El refresh token persistent en `localStorage` amb política `local` és una decisió D1 documentada anterior a l'onada, amb JWT i perfil en emmagatzematge de pestanya. Continua sent llegible per JavaScript del mateix origen; una PWA o un Shadow DOM no creen una frontera de seguretat contra scripts d'eixe origen. Els magatzems locals d'apps que es declaren d'ús del dispositiu tampoc són una frontera entre comptes. No s'ha convertit esta política explícita en una regressió atribuïda a Onada 3 ni s'ha demostrat una via nova d'exfiltració.

**Retroalimentació de `prompt_local`:** incloure SHA base i inventari exacte de l'onada; separar deutes heretats de regressions; enumerar els documents actius i aclarir si «tot l'Escriptori» inclou els laboratoris recursius; exigir proves de navegador real per a COOP i iOS PWA, i evidència separada de la configuració GoTrue i la plantilla de correu. El recompte de proves verdes no acredita estos contractes externs.

No s'ha modificat codi de producte, CSS, configuració desplegada ni dades d'usuari. Les úniques escriptures de treball són l'informe i el registre documental necessari.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261003_1250_pla_implementacio_maria]]
- [[261003_1250_prompt_claude_onada_3]]
- [[261003_1330_auditoria_claude]]
- [[261003_1900_prompt_codex_auditoria]]
