---
type: informe
status: esborrany
description: Resultat de l’ordre de tancament i aturada humana de la marató 2230, amb bloquejants administratius explícits.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_6cd529b4-5a35-441b-a3e2-25b9b94cf252:787ce7e8-dbcc-478b-b98d-9f1512141af3
---
# Tancament documental de la marató 2230

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6cd529b4-5a35-441b-a3e2-25b9b94cf252:787ce7e8-dbcc-478b-b98d-9f1512141af3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T02:32:08.617Z |
| Modificació | 2026-10-05T02:32:08.617Z |
| Propietari | codex |
| Aprovació humana | Ordre directa de tancament i aturada del Mestre, 2026-10-05 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex; revisió prèvia amb tres subagents i Claude via Olivera |
| Tokens consumits | No disponibles de manera exacta |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-05T02:32:08.617Z: rebut persistent emés i informe final creat després d'executar l'ordre de tancament. Treball tècnic aturat per ordre humana.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Sessió aturada; tancament oficial no acreditat.** Executat literalment `node tooling/gates/tancament.mjs`: eixida **1**, `valid: false`, `mode: check`, `turn_id: null`. Sense arguments, l'ordre comprova i no canvia cap torn a `closed`.

Llegits íntegrament els informes [[261004_2245_auditoria_claude]] i [[261005_0345_avaluacio_final_marato]]. Compartim el dictamen de repositori roig. Claude puntua el global **6,1/10**; Codex manté **6,3/10**, amb la discrepància ja explicada al relleu 46 de [[261004_2240_auditoria_codex]]: CI completa executada i SEO públic mesurat, sense confondre cobertura amb resultat verd. **7,4 és la dimensió arquitectura/codi de Claude, no la nota global.** L'objectiu 8,5 no s'ha assolit.

Comprovació administrativa: ESTAT conté l'entrada de tancament de Claude i LEDGER l'entrada de recaiguda de MarIA. La captura final 0357 existix i té àncora exacta a l'índex, duplicada a les línies 846 i 870 del tall llegit. L'ESTAT encara diu que falta CI completa: cal distingir el runner complet executat del corpus documental concurrent, que no era immutable.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

La comprovació de tancament passa plantilles, autoritat, segell, skills i wiki; falla **LEDGER** i **SCC**. Retorna **108 diagnòstics**: 12 documentals, 1 de signatura i 95 de tipus `LINK_INVALID`. Estos últims inclouen recursos físicament presents; no acrediten 95 absències.

La signatura del LEDGER no concorda: cos calculat `54cdcb5420d093f4886a59004ea2e965584a23bc7fc58a319d09131b62773f72`; footer `c6eb528cbc0e44e9b6f9217e28df2426eeaee2fc37bfc5cdb1511a6d776e4421`. Documents 0335/0410 tenen registres incomplets i la tasca visual 0345 manca de rebut i usa valors fora dels enums.

Resultats ja executats abans de l'aturada: Node **796 passades, 0 fallades, 1 skip, 4 TODO**; Vitest **12.446 passades, 2 fallades, 8 skip**, `test:ci` amb eixida 1. Les 55 portes donen **33 eixides 0 i 22 eixides 1**. Correcció de les dues roges preparada en còpia, **45/45** en tres suites, publicada a l'Escriptori; no aplicada. No s'ha repetit cap bateria ni afegit cap canvi productiu.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Este informe confirma l'execució i l'aturada humana; no declara verd, consens d'aplicació dels candidats ni torn oficialment tancat. No s'han executat `--verify` o `--close`, resegellat el LEDGER, arxivat treball alié, fet commit o desplegat.

La lectura del context actiu consta als relleus i ledgers previs de l'equip; els ZIP només s'inventariaren i no es reclama lectura íntegra de tots els binaris o còpies de codi. Els paquets en còpia queden congelats per a un altre torn. La revisió nativa addicional del candidat de contrast queda interrompuda, sense atribuir-li verificació o aplicació LIVE.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261004_2240_auditoria_codex]]
- [[261004_2245_auditoria_claude]]
- [[261005_0345_avaluacio_final_marato]]

## Proposta d'Automillora

*Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient*: «Atura les reparacions, executa la comprovació de tancament i informa del resultat, encara que siga roig». La plantilla exigix un Pla que este prompt no conté i confon comprovació amb tancament; la tasca directa de lectura és executable, però no acredita finalització. Els riscos administratius s'han de declarar.

Disposem de quatre places de treball coordinat, revisió independent de còpies i aplicació amb hashes previs; no calen més agents ara. La ceguesa de MarIA es resol amb un únic propietari del cicle de sessió: registre explícit d'actius, escriptura i àncora atòmiques, reconciliació mecànica dels rebuts i arxivat només després de verificar propietat i continuïtat. Una casella marcada no substituïx el resultat de la porta.
