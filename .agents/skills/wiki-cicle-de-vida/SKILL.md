---
type: skill
status: canonic
description: Flux de treball per a Soc de Poble i Protocol d'higiene cognitiva per evitar l'esgotament del context.
tags:
  - core
name: wiki-cicle-de-vida
triggers_on:
  - obrir el torn
  - tancar el torn
  - relleu documental
  - tancament de sessió
---
# Cicle de vida documental

1. Obri el torn: `node tooling/gates/obrir_torn.mjs --actor NOM --scope code --output /tmp/torn-NOM.json`. El punter és local i opcional; no sobreescriu un fitxer existent.
2. Llig la plantilla retornada per `document.mjs context`. Crea el document amb `document.mjs create --turn-id ID --route RUTA --file CAMI --title TITOL --description DESCRIPCIO`.
3. Completa els camps editorials. El prompt local copia literalment Context i Olivera; valida amb `document.mjs check --file CAMI`.
4. Vincula el pla aprovat amb `document.mjs plan --turn-id ID --file CAMI`. L’aprovació anterior continua vigent.
5. En arbre compartit declara els fitxers propis amb `document.mjs own --turn-id ID --file CAMI`. La zona humana i els canvis de codi fora d’abast continuen vigilats globalment.
6. Per a una promoció autoritzada, conserva el contingut i registra `document.mjs handoff --turn-id ID --file ORIGEN --to DESTI` després del moviment. El torn ha d’estar obert; no es reescriu història tancada. Les actes admeten `10_actes/` i l’Escriptori. Els noms nous són minúscules.
7. Actualitza el bloc ESTAT_ACTUAL d’ESTAT amb objectiu, següent acció, bloquejos, proves i responsable per rol. Afig el torn i els resultats al LEDGER. Conserva documents actius ancorats; no buides l’Escriptori.
8. Executa `node tooling/gates/tancament.mjs --check --turn-id ID`. És lectura. `--close --turn-id ID` segella el LEDGER dins de l’operació i repeteix comprovacions abans de persistir `closed`; si falla, no declara tancament.
9. Versiona documents, `.agents/runtime/turns/*.json`, `.agents/runtime/contracts/*.json` i `.claude/skills/` junts. No versionis locks ni punters locals. El pre-commit continua bloquejant quan hi ha errors.

## Retenció i memòria

La plantilla d’acta és `_wiki_de_poble/03_actuar/plantilles/acta.md`. Inclou inici, final observat, resultats i següent acció. No inventes mètriques d’eficiència ni d’estat humà. El coneixement consultiu viu a [[memoria_aprenentatges]].
El Somiador requerix un encàrrec explícit; no mou documents ancorats ni vinculats a torns. No s’executa per a fabricar un verd. No hi ha purga per antiguitat ni escriptures en `01_produccio` sense ordre explícita.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- [[memoria_aprenentatges]]
