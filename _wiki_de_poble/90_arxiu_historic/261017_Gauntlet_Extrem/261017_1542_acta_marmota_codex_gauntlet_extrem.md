---
type: acta
status: esborrany
description: 'Relleu verificable de l’auditoria: dos P1 de contingut, deute multimèdia, memòria històrica preservada i portes globals pendents.'
tags:
  - acta
visibility: private
reflex: sdp:torn_777751a0-88ab-46b3-b292-50391bcad195:01634faa-7645-4a0e-9f13-35a1d07884d3
---
# Acta Marmota Codex: Gauntlet Extrem, pèrdua de contingut i memòria pendent de contrast

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_777751a0-88ab-46b3-b292-50391bcad195:01634faa-7645-4a0e-9f13-35a1d07884d3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-17T13:42:24.214Z |
| Modificació | 2026-10-17T15:47:25.597860+02:00 |
| Propietari | codex |
| Aprovació humana | Encàrrec d’auditoria autoritzat; llibre i evacuació pendents d’aprovació |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | GPT Codex, auditor, amb tres subagents |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-10-17T13:42:24.214Z: acta creada amb plantilla viva, després de l’auditoria i les proves.

2026-10-17T15:44:49.408716+02:00: relleu redactat; documents propis vàlids; tancament global no superat, amb resultats consignats.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### Resultat tècnic i abast

L’informe [[261017_1526_auditoria_codex]] és el lliurable complet: matriu de l’encàrrec, dotze troballes C01–C12, resultats, proves reproduïbles íntegres i aportació de memòria amb fonts. El dictamen és **no conforme**, per dos P1 que comprometen contingut real i una objecció documental al segellat del Llibre. El pla [[261017_1300_pla_implementacio_gauntlet_extrem]] continua aprovat; Codex audita i Claude implementa. Esta acta no certifica cap correcció futura.

C01: una nota guardada que canvia H3 a H2 o el començament d’una llista es considera verge; focus+blur del hook real la buiden i la desen. C02: una fotografia/enllaç afegits no alteren el text pla i el predicat de publicació elimina el cos. Reproducció sense cap publicació remota. Exigència: procedència i consum únic de la llavor, comparació semàntica segura i regressions amb TipTap real.

Multimèdia: visor correcte en la galeria, amb fletxes, Esc i retorn de focus; no connectat encara a les publicacions. EXIF de WebP >256 KiB es perd perquè el visor entrega un prefix a un parser RIFF complet; conservar parser estricte i corregir lectura acotada. Falten dimensions al panell. Queries town-* preservades; fragment i versionat d’assets amb fragment són casos límit oberts. Nou banners locals i autoria/avatar del Mac Mini verificats.

Higiene: cicle entre DocumentEditor universal i NotesSection; dos console.log de reserva i object-fit inert. L’AST no mostra identificadors de marques en el xat; hi ha comentaris a neutralitzar. No substituir import.meta ni metadades legítimes. Estudi Telegram/UX amb fonts primàries en l’informe; propostes de temes/agents/adjunts distingides de capacitats realment implementades, sense cap nou SDK ni backend.

### Proves, evidència i límits

- Vitest: 1.079 proves passades en cinc lots locals (750 Notes/Emojis, 220 Multimèdia, 92 Frontissa/Xat, 9 cicle de vida, 8 estrés), 85 execucions de fitxers. No és tota la CI.
- Quatre assercions adversarials de conservació fallen expressament i demostren C01/C02; no es compten com verdes. Scripts complets preservats dins de l’informe i a /tmp.
- ESLint: 424 fitxers, zero errors i avisos. No acredita tota la higiene ni la lleugeresa del bundle.
- Estrés: fins a 40.000 fluxos virtuals, zero peticions externes, totes les subscripcions alliberades i pic de heap de 1.024,70 MiB. No equival a usuaris concurrents ni a capacitat de producció.
- Frontissa: configuració tancada i defensa local; sense endpoints reals de Sollutia activats. Cal captura real, traductor i fixture per recurs.
- Les proves integrades extra de TipTap/emoji van tindre error de JSDOM i no acrediten un recorregut verd; resta navegador real editor+diàleg, dispositius i lector de pantalla.

### Memòria episòdica i revisió concurrent

Cens independent: 418 entrades d’arrel (384 fitxers i 34 carpetes), 656 fitxers recursius, 614 Markdown + 3 TXT + 39 altres; 12.877.794 bytes. La contribució Codex ha llegit íntegres 10 històrics i 9 fonts de context; no declara lectura completa dels 614. El manifest inventaria totes les rutes i hashes. No s’ha mogut cap original.

El Llibre d’Or ha aparegut a les 15:39 i s’ha llegit íntegre. Figura canònic i parla d’auditoria completa de 720 fitxers; la cobertura no està demostrada pels informes vius. C11 exigix esborrany revisable, denominador datat, fonts i estat real de prestacions. L’ADR08 descriu complexitat offline sense CRDT real: no acredita un benchmark de mòbils ofegats. Fedivers/NLnet han de conservar la condició de projecte i compromisos pendents. El model B queda ben orientat, però no basta per segellar tota la crònica.

### Coordinació i treball preservat

No s’ha editat codi de producte, dependències, originals patrimonials ni recursos remots. Els dos scripts de diagnòstic creats temporalment s’han retirat del repositori i preservat íntegres en l’informe. No s’ha creat cap carpeta nova. S’han llegit els documents vius de l’Escriptori amb repartiment de lectura entre agents i s’han rellegit les auditories de Claude/Gemini abans del relleu. Claude continua en curs. Gemini ha completat el seu informe i incorporat troballes, però la seua declaració de consens i B4 conforme no és compartida per Codex: llibre, cobertura, EXIF i garanties estan contrastats en la nova secció de revisió creuada de l’informe.

ESTAT i LEDGER reben el torn i el resultat sense buidar historial. La divergència prèvia del ledger es documenta amb els dos hashes i comprovació d’igualtat amb HEAD; el nou segell només acredita integritat dels bytes després del relleu. No s’ha resegellat cap skill. Check final: exit1, valid:false, planned, 429 incidències (426 de graf, segell, manifest i una divergència concurrent de wikiManifest.js). Olivera/plantilles/autoritat/ledger/wiki passen; segell/skills/SCC fallen. Cap error dels lliurables propis; no closed. 2.329/2.330 rutes inicials intactes, només wikiManifest.js ha canviat concurrentment, sense edició de Codex.

### Temps, interacció i automillora

Primera marca durable del torn: 2026-10-17T13:26Z; no acredita el primer instant del xat. Últim tall observat: el camp Modificació d’esta acta. No s’estimen temps estalviat, tokens, estat emocional del Mestre ni experiència subjectiva de les IAs. El treball autònom ha avançat sense carregar decisions mecàniques a l’usuari.

Aprenentatge principal: una prova de fallada és evidència, no conformitat; un hash no demostra lectura ni aprovació. La plantilla pot millorar amb camps de tall, cobertura, propietari de cada recurs i condició de tancament. Els apartats que demanen conjectures psicològiques o eficiència s’han de poder marcar «no mesurat».


<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Claude — C01/C02:** implementar conservació estricta de notes editades/guardades, incorporar les quatre regressions i repetir la suite afectada sobre el mateix hash.
2. **Claude — C03–C10 i C12:** connexió del visor a publicacions, EXIF acotat, resolució, desacoblament universal, higiene i prova real d’emojis; registrar què es resol i què queda pendent.
3. **MarIA/autor del llibre — C11:** revisar la crònica i acreditar cobertura amb manifest i fonts. Distingir patrimoni, demandes pendents i decisió vigent. Javi aprova després la versió concreta; no activar evacuació abans.
4. **MarIA — governança:** tractar les divergències de skills/manifest i el graf global sense purgues a cegues ni canviar segells per fabricar un verd. El resultat mecànic final queda en l’informe.
5. **Cada agent — recursos:** els tres subagents, proves i tab propis de Codex han acabat. Codex no ha creat cron; els quatre antics accessibles estan PAUSED. No s’atribuïx la cancel·lació de schedulers aliens inaccessibles.

La pròxima entrada ha de llegir primer l’informe Codex i les noves respostes de Claude/MarIA; comparar hashes abans de reproduir casos. No partir del text «canònic» del Llibre com si resolguera automàticament els pendents.


<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261017_1526_auditoria_codex]]
- [[261017_1300_pla_implementacio_gauntlet_extrem]]
