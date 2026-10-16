---
type: acta
status: esborrany
description: 'Relleu de l’auditoria del perfil: proves de partida, casos adversarials, deute de CI i punts de continuïtat per a Claude i MarIA.'
tags:
  - acta
visibility: private
reflex: sdp:torn_9674401f-d730-449d-97ae-1c09b98d9dbf:995a3a02-32c4-450b-97db-d22168fd31f5
---
# Acta Marmota Codex — relleu de l’auditoria de la Fase 1

Relleu del treball de Codex per a Claude i MarIA. No declara acabada la implementació de la Fase 1 ni substituïx el dictamen de l’informe vinculat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_9674401f-d730-449d-97ae-1c09b98d9dbf:995a3a02-32c4-450b-97db-d22168fd31f5 |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T17:33:34.042Z |
| Modificació | 2026-10-15T17:51:45.532611+00:00 |
| Propietari | codex |
| Aprovació humana | Auditoria i relleu autoritzats pel mandat del Mestre; sense nova consulta |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Codex; model exacte no exposat |
| Tokens consumits | No mesurats |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-10-15T17:26:23.144Z: torn documental de Codex obert.

2026-10-15T17:33:34.042Z: acta creada mentre acaba la CI i el constructor prepara el pegat. L’hora final del treball encara no està mesurada; no s’inventa duració, estalvi ni estat humà.

<!-- SDP:SECTION acta.s4 -->
## Resultats

S’han llegit el Pla i el Prompt canònics de les 19:00, el BIOS, els procediments documentals i el context actiu. L’informe s’ha creat mitjançant `document.mjs context/create` a la ruta exigida: [[261015_1945_auditoria_codex]]. Tres revisions paral·leles de Codex han contrastat targetes, editor i cobertura, sense assumir els rols de Claude o Gemini.

Sobre la base `2a65ebb6a19d985b5a457a5b388764ca8edc7bd0`, les 50 suites enfocades passen (639 proves), però encara exigixen comportaments anteriors a la Fase 1. Un assaig temporal independent reprodueix cinc incompliments de persona i passa tres controls d’article/organització. La distinció essencial és entre una persona representada i un article escrit per una persona: el segon conserva drets i categories. També cal preservar les preferències de llicència de les notes.

La CI completa ha acabat amb eixida 1: Node 936 passen, 4 fallen, 1 salt i 3 TODO (944 casos); Vitest 17.691 passen, 2 fallen i 89 salts (17.782 casos, 1.041 fitxers). Les quatre fallades Node provenen de fixtures WordPress que pressuposen una clau buida. Les dues Vitest esperen una URL d'avatar antiga i una pàgina de drets sense la targeta legal incorporada. Les fonts de les sis fallades són idèntiques a HEAD; no s'ha alterat cap clau ni comprovació per fabricar verd. La CI ha coincidit amb edicions de Claude i no acredita el tall final.

El pegat de Claude resol T1–T3 en les proves independents: 8/8 acceptacions de targetes/vistes/PDF i 5/5 integrades d'editor/llista/emojis, amb hashes abans/després estables. La revisió dels tests actualitzats conserva persistència i herència T39. ESLint passa sobre els huit fitxers productius modificats.

La bateria ampliada de producte (79 fitxers) registra 1.068 proves passades i una fallada F4: `SectionItemCard.test.jsx:45` exigia categories d'entitat damunt d'una ruta persona. Claude ha corregit la fixture després del relleu i el repàs passa 5/5, 2,38 s, amb els 2.034 hashes font estables. Els dos tests editats durant la bateria inicial també passen el repàs: 81/81, 7,02 s, amb 2.034 hashes estables. Estos recomptes se solapen i no se sumen. No queda cap defecte funcional nou confirmat en l'abast revisat.

La navegació real al perfil privat ha redirigit a registre, perquè el navegador d’auditoria no té sessió. No hi ha certificació visual privada, mòbil ni responsive. La cobertura jsdom no substituïx esta comprovació.

Codex no ha editat `src/`, tests del producte, dependències, Supabase, secrets ni zones humanes. L’informe i l’acta viuen a l’Escriptori, ancorats automàticament; les sondes i traces locals viuen a `/tmp`. No s’ha creat cap monitor recurrent. El primer informe de Claude s’ha llegit, però encara era una plantilla sense resultats; el seu codi sí s’ha contrastat directament. Gemini4 també s’ha llegit íntegrament: acord amb la distinció persona/obra, T39 i port de xarxa; matisos sobre rail menut, llavor vs RSS real i absència d’evidència de fidelitat REA consignats a l’informe.

Tancament final comprovat: `valid:false`, estat `planned`, 454 incidències. Olivera, plantilles, autoritat, ledger, segell, skills i compilació de Wiki passen; SCC falla amb les mateixes 453 incidències del graf (411 àncores, 23 enllaços, 19 orfes), més l'error d'abast documental pel delta compartit de codi de Claude. ESTAT i LEDGER tenen el relleu, i el segell de ledger és vàlid. Informe i acta són vàlids individualment. Cap falsa clausura ni modificació d'originals aliens per fabricar verd.

Millora proposada per a les plantilles: demanar sempre el SHA/base del pegat, separar proves de regressió d’acceptació i distingir CI primària de laboratori/sessió. Els camps de model, tokens, temps i estat humà han d’admetre «no mesurat»; cap inferència presentada com a lectura del sistema.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. F4 resolt per Claude i revalidat per Codex; la correcció de producte de T1–T3 supera les acceptacions independents.
2. MarIA: separar CI1/CI2 (sis fallades preexistents) i deute del graf documental de la implementació del perfil; el tancament mecànic continua roig.
3. Verificació visual autenticada i responsive: pendent perquè el navegador d'auditoria redirigix a registre; no s'ha demanat sessió ni credencials.
4. Cobertura durable recomanada: traslladar al test de producte l'assert explícit de drets absents al `srcdoc` A4/portada amb llicència antiga. Ja passa en l'assaig independent temporal; és cobertura, no defecte funcional confirmat.

Auditoria lliurada a l'Escriptori; totes les execucions de proves iniciades per Codex han acabat. Cap monitor propi creat ni tasca recurrent pendent de desactivar.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261015_1945_auditoria_codex]]
- [[261015_1900_pla_implementacio_xat_identitat_i_perfil]]
- [[261015_1900_prompt_gauntlet_claude_codex_gemini]]
