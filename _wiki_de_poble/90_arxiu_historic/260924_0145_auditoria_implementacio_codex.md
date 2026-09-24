---
type: informe
status: esborrany
description: Resultat de la implementació autoritzada, regressions d’arrencada corregides i límits verificats de sessions, memòria i paginació.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d8369fc9-bd0d-462e-add4-955d083a633f:4b1a7a63-5844-4a1b-8127-fb2eb14dd0d1
---
# Implementació local: arquitectura, sessions i Notes

Informe de la implementació autoritzada per SDP-PROMPT-LOCAL-260924-IMP i de les regressions corregides durant el torn.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d8369fc9-bd0d-462e-add4-955d083a633f:4b1a7a63-5844-4a1b-8127-fb2eb14dd0d1 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T23:42:48.439Z |
| Modificació | 2026-09-23T23:42:48.439Z |
| Propietari | Codex |
| Aprovació humana | Autorització explícita SDP-PROMPT-LOCAL-260924-IMP i ordres posteriors de corregir les regressions. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, basat en GPT-6; la variant exacta no està exposada en esta sessió. |
| Tokens consumits | Mesurats reals: no disponibles. Estimats: no calculats; cap xifra inventada com a telemetria. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

260924: pla llegit i vinculat al torn `torn_d8369fc9-bd0d-462e-add4-955d083a633f`. Implementació, diagnòstic de les regressions comunicades pel Mestre i verificació local completats.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**VERD · Frontissa interna Model B.** `creaFrontissa.js` aplica catàleg congelat, origen HTTPS exacte, paràmetres permesos, DTO, límit de bytes, timeout, cancel·lació i redireccions denegades. `client.llig` conserva la signatura i denega els recursos no capturats; el catàleg real continua buit. No envia credencials SdP a Sollutia ni usa l’issuer com a API.

**VERD · Àmbits i sessió.** `useScopedResource` integrat en Core, Mur i Multimèdia. El primer render d’un altre usuari, generació, actor o tenant amaga el payload anterior. Importació de host compartida i cancel·lació en desmuntar. `sessionService` separa generació i ordre de consulta del rol, clona la configuració i rebutja instàncies concurrents incompatibles. `auth` identifica renovacions per epoch/origen, rebutja login tardà, avorta credencials substituïdes i invalida logout abans del primer await. Tres reintents amb backoff i caducitat respectada.

**VERD · Retenció.** `GlobalSaveManager` elimina promeses completades només si continuen sent les actuals i conserva com a màxim 256 revisions inactives. No expulsa claus amb cues, locks o writes. Esborranys pendents conservats i revisió remota sempre exigida. La cua del host executa sense acumular ordres ni sessions; les esperes cancel·lades es retiren del conjunt d’espera.

**VERD · Notes lleugeres i detall diferit.** `loadNotesPage` és una capacitat opcional interna i `loadNotes` conserva l’export, la forma del resultat i la resolució per `noteId`. Llistes amb columnes explícites sense `content`, pàgina màxima de 50 i cursor d’ID immutable per tenant/propietari; un rang amb total o una resposta buida confirmen el final. `request` continua retornant l’array; les metadades van per callback. Primer lot compatible en arrencar, continuació incremental quan Notes està oberta, màxim 1.024 pàgines. `NotesDetail` no munta l’editor d’un resum fins que arriba el cos. Fusió per ID/revisió conserva els detalls de la mateixa revisió i els esborranys. Mur i Multimèdia consulten exclusivament les seues fonts, sense Notes.

**Imprevistos corregits.** La primera integració va trencar l’arrencada en la prova StrictMode, cinc proves del provider i una prova antiga de paginació. Compartir la promesa d’importació del host resol l’espera reproduïda. S’ha restaurat la primera càrrega del provider, incloent `ready` sense usuari. S’ha conservat el retorn array de `request`. El test d’App i els cinc tests de NotesDataContext passen sense modificar-los. La prova antiga que exigia baixar 51 notes de colp s’ha substituït per comprovacions del contracte paginat: 50 inicials, cursor, final confirmat i cos absent.

S’han preservat les edicions visuals preexistents de Claude/MarIA. Sense canvis a Routes, NotesEditor, CSS ni esquema remot en este torn.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `node node_modules/vitest/vitest.mjs run --maxWorkers=2 --reporter=dot`: **103/103 proves, 28 fitxers**. Inclou l’App real amb StrictMode, els cinc casos originals de NotesDataContext, scopes dels providers, rols fora d’ordre, renovació/login tardans, paginació, detall diferit, Frontissa i retenció de 1.000 operacions.
- Suite amb concurrència per defecte: 98/99; timeout de 15 s al catàleg d’espècimens. Amb dos workers passa també eixe test, sense ampliar-ne el timeout ni editar-lo. No s’ha canviat la configuració global del runner.
- ESLint dels fitxers propis: zero errors i zero avisos. `git diff --check` dels fitxers propis: net. Una comprovació global posterior detecta un espai final en una skill modificada concurrentment, fora d’este torn.
- `vite build --outDir /private/tmp/sdp-impl-build`: passa; avís de chunks majors de 500 kB. Sense executar generadors de Wiki ni publicar.
- Portes enxufe, adaptadors i RLS estàtica: passen. La prova del global host viu en `tests/host.test.js` per no confondre el codi de simulació amb globals de producte d’E4.
- Navegador local `http://localhost:3340`: Xat renderitzat i Notes amb `nota=n1` i cos editorial complet, en el mode de dades de l’entorn. Sense autenticació o escriptures remotes de prova.
- `tancament.mjs --check --turn-id torn_d8369fc9-bd0d-462e-add4-955d083a633f`: `valid:false`, `state:planned`. Passen plantilles, autoritat, signatura del LEDGER i proves documentals. Fallen segell, identitat de `core-edicio-segura`, Wiki estricta i SCC (enllaços, ancoratges i estils en components aliens); també detecta escriptura concurrent. Es conserva el bloqueig global, sense afluixar les portes. El document nou passa `document.mjs check`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s’ha activat cap endpoint real de Sollutia, ni canviat la política de tokens del proveïdor, ni desplegat res. RLS remota amb dos usuaris/dos pobles continua pendent d’un entorn de prova; la porta SQL estàtica no l’acredita. Sense benchmark de 10.000 notes ni mesura de heap del navegador.

Compatibilitat deliberada: es precarrega només el primer lot de resums de Notes a l’arrencada; la càrrega zero absoluta de Notes fora de la ruta queda pendent. Les pàgines restants només avancen amb la vista Notes activa. La cerca local usa títol, subtítol, entradeta i etiquetes; el cos només participa quan s’ha carregat. El cursor no promet un snapshot transaccional davant insercions simultànies. No s’ha implementat encara un cursor públic de continuació per a Mur/Multimèdia, ni la substitució completa del proveïdor: estos treballs excedixen les quatre tasques concretes d’esta petorreta.

La política de purga d’esborranys en dispositius compartits continua pendent de decisió; no s’ha eliminat cap esborrany. El deute preexistent de segell, skills i graf documental no es declara reparat. Acta Marmota global pendent al final de la conversa.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

- [[260924_0045_pla_implementacio_arquitectura_codex]]
- [[260924_0055_auditoria_codex]]
