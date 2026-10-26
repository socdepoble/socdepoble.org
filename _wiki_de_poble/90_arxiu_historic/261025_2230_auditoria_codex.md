---
type: informe
status: esborrany
description: Validació independent dels quatre pegats de consentiment i àudio, recomptes de proves i límits de certificació global.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_53e51433-6912-4a51-97d4-991ec181f249:2aa169b9-8cf2-4529-951a-6c66fa0aff01
---
# Acceptació adversarial del consens 2120: cd1bb28a4

**Quatre pegats acceptats en l’abast provat; 10/10 global no certificat.** Precommit reexecutat3.410 verd, no3.419; les nou proves noves passen en la passada explícita.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_53e51433-6912-4a51-97d4-991ec181f249:2aa169b9-8cf2-4529-951a-6c66fa0aff01 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T22:07:21.270Z |
| Modificació | 2026-10-25T23:13:21+01:00 |
| Propietari | Codex |
| Aprovació humana | validació encarregada pel Mestre; sense publicació |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex · GPT-6 |
| Tokens consumits | mètrica de plataforma no disponible |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T23:11:45+01:00: acceptació independent del commit cd1bb28a4; precommit, fonts exactes, dos arnesos preparats i controls adversarials addicionals. Cap pegat de producte aplicat per Codex.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen final

**Conformitat tècnica als quatre pegats de `cd1bb28a4`, en l'abast provat. NO es certifica un 10/10 definitiu de tot el Mas electrònic.** No s'ha demostrat cap regressió nova P0/P1/P2 en els sis fitxers del commit. La reparació de C2120-01 supera l'arnès independent que fallava abans; les signatures antigues ja no anul·len l'intent nou i gravar silencia tant una veu activa com una que esperava signatura.

El tall verificat és `cd1bb28a4d640d0cfe9aa077c87842c68931cb8f`, branca `backup-notes-publish`, pare `20d11564e`: **6 fitxers, +324/−27**. Els sis fitxers vius coincidixen amb el commit. Cap font de producte s'ha modificat durant la validació.

**Rectificació del recompte:** el precommit reexecutat retorna **3.151 Vitest + 259 Node = 3.410**, no 3.419. Les nou proves noves existixen i passen, però estan a tres fitxers d'interfície que `PRECOMMIT_INCLUDE` no selecciona. La passada explícita dels tres fitxers dona **100/100**. No s'ha alterat la configuració per maquillar el recompte.

### Matriu de conformitat de requeriments (MCR)

| Requeriment | Estat | Evidència | Límit pendent |
|---|---|---|---|
| C2120-01: A→B→A amb alta/revocació en vol | [FET] | 4 proves independents del coordinador; 13 d'acceptació del revisor; serialització per org i reconciliació confirmada | Garantia dins de la instància muntada, sense convertir-la en cua persistent entre remuntatges. |
| Mantindre la protecció A→B, errors i lectures velles | [FET] | Resolució/rebuig tardà, GET reeixit/fallit després de confirmar i tres org amb operacions pendents | La resta d'accions de membres fora de TriaTitular no es modifica en este lot. |
| G2120-01: silenciar abans de gravar | [FET] | Reproductor actiu i signatura pendent callen abans de resoldre el permís del micròfon | Micròfon/altaveus físics no provats. |
| C2120-04/G2120-04: generació i error en pausa | [FET] | then/catch/finally antics no canvien l'intent vigent; error després de pausa no renova | La petició de signatura pot continuar en transport; s'invalida el seu efecte de vista. |
| G2120-05: reafirmar velocitat 1/1,5/2 | [FET] codi i model JS | font renovada, metadades, play extern, durada Infinity i velocitat heretada | [PARCIAL] certificació de plataforma: cap WebKit/iPhone real executat. |
| Proves noves del constructor | [FET] | Els tres fitxers modificats passen 100/100, incloses les nou noves | No formen part del precommit actual. |
| Precommit | [FET] | 165 fitxers/3.151 Vitest +259 Node; exit0 | Recompte anunciat 3.419 no reproduït; 38,66 s de paret amb treball concurrent, no certificació de <30 s. |
| Puresa Model B | [FET] en el diff | Tractor Enxufe i Frontissa exit0; cap canvi de port/SDK/SQL/paquet | Endpoints de Sollutia i RLS remota no provats en esta passada. |
| Certificació global definitiva | [PARCIAL] | Reserves C2120-02/03/05 i deute global conservats | Quatre pegats no equivalen a resoldre totes les reserves de 2120. |
| Tancament de govern | [PARCIAL] | Resultat final registrat a Verificació | Sense forçar segells ni eliminar deute alié. |

### C2120-01: reparació acceptada

`src/sections/profile/GestioMembres.jsx:80-150` conserva una operació en vol per organització. En tornar a A, recupera l'ocupació i el valor pendent d'A; una confirmació d'A només pinta si A és visible. El comptador de confirmacions impedix que una lectura anterior —reeixida o fallida— desfaça l'escriptura confirmada. El finally lleva l'operació del mapa i allibera la vista corresponent.

L'arnès del coordinador passa les dos direccions false→true/true→false amb A→B→A i els controls A→B per resolve/reject. Els deu casos nous del revisor, més les tres proves noves del constructor, cobrixen també una intenció oposada després de completar, tres organitzacions simultànies amb ordre diferent, lectures velles i desmuntatge sense contaminar una instància nova. Són assercions d'acceptació; no es compten com a reparació els antics tests que afirmaven el defecte.

**Reserva menor preexistent, P3:** si confirma l'escriptura mentre la lectura continua pendent, `:137` hereta `carregant:true`; `:163` pot mantindre la casella desactivada encara que ja mostre èxit i no estiga desant. La lectura l'allibera quan acaba; no s'ha mostrat corrupció ni bloqueig infinit del transport Supabase amb termini. Prova separada a `/tmp/sdp2120-consentpatch-independent.log`. Refinament tècnic opcional: fixar carregant:false en confirmar. No invalida la correcció de consentiment reproduïda. `requires_human_decision: false` per a eixe refinament.

No s'ha certificat persistència d'escriptures entre eixir del panell i crear una instància completament nova. Tampoc es dona per resolta la família antiga de respostes tardanes d'afegeix/canviaRol/confirmaLleva, que ja estava diferenciada al Llibre.

### G2120-01: pausa abans del micròfon acceptada

`callaVeuActiva()` a `AdjuntXat.jsx:40-49` allibera la propietat i crida calla sobre la nota anterior. `ControlsAdjunt.jsx:157` la crida després de la guarda d'ocupació i abans de demanar el micròfon. Les dos proves d'integració del nostre arnès munten reproductor i gravadora reals: pausa síncrona de playback actiu, i signatura pendent que, resolent després de gravar, no fixa src ni torna a fer play.

Això acredita la coordinació JS. No s'ha simulat una mesura acústica ni s'ha afirmat capturar feedback físic.

### C2120-04/G2120-04 i G2120-05: signatures i velocitat acceptades amb límit natiu

`AdjuntXat.jsx:144-172` guarda la generació a then/catch/finally; callar i prémer pausa la invaliden i netegen recarregant. El finally comprova la generació sense exigir volSonar, de manera que un error vigent també buida carregant. `fallaCarrega` no renova una veu que ja no ha de sonar.

Les proves cobrixen error antic després de pausa/represa i A→B→A, finally antic mentre l'intent nou està carregant, error vigent, rebuig després de callar i rebuig antic de play. La reproducció externa legítima continua prenent la veu i pausant l'altra nota: no s'ha introduït una guarda estricta que trenque eixe contracte.

`fixaVelocitat` consulta el valor actual del mòdul i fixa defaultPlaybackRate/playbackRate en metadades i play (`:208-215,270`). Passen 1/1,5/2, canvi de font, reinici de velocitat modelat i durada Infinity. **És prova de la reparació JavaScript, no certificació Safari/WebKit en dispositiu.**

**Hipòtesi refutada com a regressió nova:** onPlay extern no posa volSonar=true; això ja passava al pare. Després d'una represa externa seguida d'error, el pare demanava una signatura que després descartava; ara la guarda ni la demana. Cap dels dos recuperava eixe camí: deute anterior, no recuperació trencada pel pegat. El contrast usa un component del pare separat, sense substituir ni reparar la font viva.

### Què continua impedint el 10/10 global

| Reserva de 2120 | Estat després de cd1bb28a4 | Què falta |
|---|---|---|
| C2120-02 · XHR | Oberta, P2 condicional | El control responseURL és posterior al possible reenviament del cos. No canvia cap transport en este commit. Conservar redirect:error o acreditar/decidir explícitament el compromís. |
| C2120-03 · Storage | Oberta | upload/sign/remove poden continuar després del termini del wrapper. Falta cancel·lació o reconciliació d'efectes tardans; cap canvi a storage.js. |
| C2120-05 · WP antic | Oberta, condicional al sòl antic | Canvi de locale i variant/sòl del paquet encara pendents; idioma.php no canvia. |
| Suite sencera i govern | Sense certificat nou global | L'última suite sencera de 20d11564e tenia 3 fallades; no s'ha repetit ara. El precommit i les dirigides no substituïxen eixe resultat. |
| Plataformes natives | Parcial | Cap prova real nova d'iOS/WebKit, Android físic o WP5.8/PHP7.4. |

La lectura íntegra del prompt2230, Gemini2120v1.1 i Llibre confirma que el consens **manté** C2120-02/03/05. La declaració «aprovat pel Mestre» del prompt autoritza els quatre pegats; no és acceptació concreta dels riscos exclosos. El títol «10/10 absolut» no canvia les proves ni tanca estes reserves.

### Contrast i retroalimentació

Gemini ha rectificat formalment el mapa de posicions a300 i ha incorporat C2120-01/C2120-04: concorda amb l'evidència de 2120. Esta passada accepta el paquet acordat, mantenint separades la conformitat del codi i la certificació global. No s'ha tocat l'informe company.

Millora concreta del prompt i del relleu: publicar el recompte real del log, distingir quines proves selecciona precommit i presentar el paquet com a reparació dels quatre casos. No sumar automàticament nou al recompte anterior ni anunciar una certificació nativa a partir de fireEvent.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Execució | Resultat | Evidència |
|---|---|---|
| Precommit | exit0;165 fitxers/3.151 Vitest +259 Node,0 fallades;38,66s paret | /tmp/sdp-cd1bb28-precommit.log |
| Tres fitxers de proves modificats | 100/100;7,45s paret | /tmp/sdp-cd1bb28-changed-tests.log |
| Acceptació consentiment coordinador | 4/4;1,42s paret | /tmp/sdp-cd1bb28-concurrency-acceptance.log |
| Acceptació consentiment independent | 13passen/1P3omés i executat a part;1,43s | /tmp/sdp2120-consentpatch-acceptance.log |
| Arnès d'àudio segur | 163passen/1candidatnoacreditatomés;7,38s paret | /tmp/sdp-cd1bb28-audio-acceptance.log |
| Àudio addicional independent | 6passen/44noexecutades pel filtre;869ms | /tmp/sdp2120-audio-cd1-independent.log |
| Lint | exit0, cap error/avís | /tmp/sdp-cd1bb28-lint.log |
| Model B | Enxufe i Frontissa exit0 | /tmp/sdp-cd1bb28-enxufe.log i /tmp/sdp-cd1bb28-frontissa.log |
| Fonts exactes | 6/6 iguals al commit | /tmp/sdp-cd1bb28-manifest.json |

No se sumen les bateries: les originals i les nou proves noves se solapen entre execucions. El primer intent del selector de consentiment fallà perquè exigia un nom accessible que excloïa l'ajuda de Casella; s'ha corregit només el selector temporal. Les dos primeres invocacions de tractors usaren una ruta incompleta i no executaren la porta; els resultats de la taula són els de les rutes canòniques tooling/gates. Cap d'estes incidències d'arnès és un defecte del producte.

L'arnès d'àudio d'acceptació rebutja SDP_AUDIO_PRIOR/GUARDED/OWNERSHIP i transforma només proves. No s'ha validat un producte amb el pegat experimental d'epoch injectat. Les caches temporals estan separades de les del servidor de desenvolupament.

Lectura completa del diff dels sis fitxers; revisió independent de consentiment i àudio. Context nou: prompt2230 (148línies/13.199B), Gemini2120v1.1 (229/33.807B), Llibre (195/138.449B abans d'actualitzar), a més dels informes i normativa ja llegits a2120. No s'ha tornat a carregar arxiu fred ni secrets.

**Tancament global final:** `tancament.mjs --check --turn-id torn_53e51433-6912-4a51-97d4-991ec181f249` retorna exit1, valid:false, state:planned i1.393 incidències heretades. Passen Olivera, plantilles, Autoritat, LEDGER i skills; fallen segell, Wiki i SCC, més les metadades antigues del Llibre. Cap error del nou informe2230. No es declara tancament mecànic ni se força el segell. Evidència: `/tmp/sdp-cd1bb28-tancament.json`. Checksum LEDGER previ i posterior vàlids; diff-check0. Fonts6/6 revalidades iguals al commit després de les proves. Tots els subagents i processos propis han finalitzat.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Abast: validar els quatre pegats de cd1bb28a4 i donar un dictamen proporcionat a les proves. No és una nova auditoria exhaustiva de tots els mòduls ni una publicació. No s'han modificat fonts, dependències, autenticació, SQL, skills, comptes ni remots; cap commit/push/desplegament. Només informe, Llibre, ancoratge i relleus documentals.

Les proves del mitjà i del micròfon són JSDOM; no acrediten WebKit/iPhone físic. Els ports es simulen per controlar l'ordre de promeses. No s'ha repetit tota la suite de22.436 proves perquè el diff és delimitat i s'han completat les dirigides i el precommit; el deute anterior queda explícit.

Cap cron, watcher o servidor propi iniciat. Tots els processos de proves i subagents acaben abans del relleu. El tancament global es registra sense forçar un verd ni cancel·lar serveis compartits aliens.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_2120_auditoria_codex]]
- [[261025_2120_auditoria_gemini]]
- [[261025_2230_prompt_claude_implementacio_4_pegats_consens_10_10]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
