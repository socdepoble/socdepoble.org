---
type: skill
status: canonic
description: Flux de treball per a Soc de Poble i Protocol d'higiene cognitiva per evitar l'esgotament del context.
tags:
  - core
name: wiki-cicle-de-vida
prioritat: 1
triggers_on:
  - obrir el torn
  - tancar el torn
  - relleu documental
  - tancament de sessió
  - títol del xat
  - títol termodinàmic
contracte.llig:
  - _wiki_de_poble/02_saber/doc_governanca.md
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
---
# Cicle de vida documental

1. Tria l’abast real: `documents` per a documentació i `code` si també has de modificar codi. Obri el torn documental: `node tooling/gates/obrir_torn.mjs --actor NOM --scope documents --output /tmp/torn-NOM.json`. El punter és local i opcional; no sobreescriu un fitxer existent.
2. Per a crear documents, aplica el circuit únic de [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]]; esta skill governa el torn, el relleu i el tancament.
3. Completa els camps editorials. El prompt local copia literalment Context i Olivera; valida amb `document.mjs check --file CAMI`.
4. Vincula el pla aprovat amb `document.mjs plan --turn-id ID --file CAMI`. L’aprovació anterior continua vigent.
5. En arbre compartit declara els fitxers propis amb `document.mjs own --turn-id ID --file CAMI`. La zona humana i els canvis de codi fora d’abast continuen vigilats globalment.
6. Per a una promoció autoritzada, conserva el contingut i registra `document.mjs handoff --turn-id ID --file ORIGEN --to DESTI` després del moviment. El torn ha d’estar obert. La història tancada es conserva tal com es va segellar; l’única esmena admesa és la que registra `porta-olivera.mjs --arxiva` quan reapunta cap a l’arxiu un enllaç d’un document de torn tancat: comprova la preimatge, actualitza `verification.files` d’eixe document sense tocar la data ni les comprovacions del segell i deixa el rastre `archive-links` al registre del torn. Les actes noves es creen només a `10_actes/`. Els rebuts històrics conserven les destinacions de la seua instantània. Els noms nous són minúscules.
7. Aplica la «Transició d’onada» d’ací baix. Actualitza el bloc ESTAT_ACTUAL d’ESTAT amb objectiu, següent acció, bloquejos, proves i responsable per rol. Afig el torn i els resultats al LEDGER. Conserva documents actius ancorats; no buides l’Escriptori.
8. Executa `node tooling/gates/tancament.mjs --check --turn-id ID`. És lectura. `--close --turn-id ID` segella el LEDGER dins de l’operació i repeteix comprovacions abans de persistir `closed`; si falla, no declara tancament.
9. Versiona documents, `.agents/runtime/turns/*.json` i `.agents/runtime/contracts/*.json` junts (els enllaços de `.claude/skills/` són locals i no es versionen). No versionis locks ni punters locals. El pre-commit continua bloquejant quan hi ha errors.
10. **Títol Termodinàmic del xat.** En tancar una sessió d’Antigravity, MarIA lliura un únic Títol Termodinàmic per a anomenar el xat d’Antigravity que es tanca: una sola línia dins d’un bloc de codi, amb el format `aammdd_hhmm_tema`, de 70 caràcters com a màxim, amb la data i l’hora que torna `date` en el moment del tancament ([[core-temps-termodinamic/SKILL|core-temps-termodinamic]]), en minúscules, sense accents i amb guions baixos (AGENTS §2). El títol del xat de cada altra IA (Claude, Codex, Gemini o el Consell) va integrat dins del mateix bloc de prompt que el Mestre copia al xat d’eixa IA, a la primera línia del bloc: `Títol del xat: aammdd_hhmm_tema`. És el bloc de xat, no el fitxer del prompt a l’Escriptori, que continua començant pel frontmatter. Així el lliurament de tancament porta un sol títol solt, el del xat d’Antigravity.

## Transició d’onada

El procés únic uneix Llibre Mestre, retenció, pla i prompt. Marca FET només els ítems verificats i trasllada al pla següent els pendents amb la font citada. Un commit o un pla nou no consumix informes encara necessaris: conserva cada consumidor, torn vigent o retenció acreditada. MarIA aplica el procediment mecànic de [[core-higiene-escriptori/SKILL|core-higiene-escriptori]] només als consumits, primer en mode sec, després amb el relleu de rebut que corresponga. Crea el pla abans dels prompts pel circuit de [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]] i verifica portes i motius de retenció abans de convocar. No reescrigues rebuts tancats ni buides la taula.

## Retenció i memòria

La plantilla d’acta és `_wiki_de_poble/03_actuar/plantilles/acta.md`. Inclou inici, final observat, resultats i següent acció. No inventes mètriques d’eficiència ni d’estat humà. El coneixement consultiu viu a [[memoria_aprenentatges]].
El Somiador requerix un encàrrec explícit; no mou documents ancorats ni vinculats a torns. No s’executa per a fabricar un verd. No hi ha purga per antiguitat ni escriptures en `01_produccio` sense ordre explícita.

## Lliçons del Mestre

- **261101** | **Un sol títol en tancar.** En tancar una sessió d’Antigravity, MarIA lliura un únic Títol Termodinàmic (`aammdd_hhmm_…`, 70 caràcters com a màxim) per al xat d’Antigravity que es tanca, i el títol del xat de cada altra IA viatja integrat dins del bloc de prompt d’eixa IA.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- [[memoria_aprenentatges]]
