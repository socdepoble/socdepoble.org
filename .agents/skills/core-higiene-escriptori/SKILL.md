---
type: skill
name: core-higiene-escriptori
description: Tractor cognitiu que obliga a mantindre l'Escriptori (04_escriptori) net abans d'iniciar noves tasques o petorretes.
status: actiu
tags: [govern]
triggers_on:
  - classificacio de documents de treball
---

# LLEI D'HIGIENE DE L'ESCRIPTORI (TRACTOR COGNITIU)

Aquesta skill es carrega com a Tractor per garantir que l'Escriptori de treball (`04_escriptori`) es manté ordenat i net, prevenint l'acumulació d'auditories, prompts i plans d'implementació antics que generen confusió.

## PROCEDIMENT OBLIGATORI D'AUTONETEJA

No faces la neteja ni l'arxivament a mà. Existeix una eina de governança automàtica expressament per a això que has d'utilitzar SEMPRE per evitar àncores fantasma.

1. **EXECUCIÓ DE LA PORTA**: Executa directament l'script `node tooling/gates/porta-olivera.mjs`. Sense bandera mutadora, este script només diagnostica i no arxiva. Revisa les incidències i conserva els documents que encara estan en ús. Un arxivament autoritzat requerix el circuit de mutació vigent, un pla exacte i la verificació posterior de les àncores; la data per si sola no autoritza moure contingut.
2. **COMPROVACIÓ VISUAL**: Verifica amb `ls -l _wiki_de_poble/04_escriptori/` que l'eina ha deixat la taula neta d'elements del dia anterior. 
3. **LLENÇ NET**: Només quan l'escriptori estiga degudament garbellat per l'Olivera, pots procedir a redactar els nous documents (petorretes) per al Consell.

*Aquest procediment assegura que l'Escriptori siga un reflex fidel de l'"Activitat en curs", tal com dicten les lleis de la Constitució del Poble, i evita la frustració del Mestre en vore el seu bancal ple de brossa electrònica antiga.*
