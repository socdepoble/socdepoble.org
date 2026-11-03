---
name: core-telemetria-huma
prioritat: 2
type: skill
status: actiu
triggers_on: ["inici de sessió", "tancament de sessió", "fatiga", "nanochat"]
description: Registra el temps observat i les mètriques disponibles de les sessions, sense inventar jornades, costos ni valoracions de salut humana.
contracte.llig:
  - .agents/ESTAT.md
  - .agents/protocolledge.json
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
---
# Telemetria humana i de sessions

Esta skill deixa un relleu de temps i esforç quan l'encàrrec o el tancament de jornada ho necessiten. Un xat és una sessió observada; encadenar-ne diversos no prova treball continu. El temps de pauses, descans i activitat fora del registre és desconegut llevat que la persona l'haja declarat.

## Registre amb procedència

1. Consulta les actes i l'ESTAT relacionats amb la sessió. Usa la primera i l'última evidència datada per indicar l'interval observat, amb les seues fonts. No deduïsques una hora real d'inici ni una jornada sense pauses.
2. Registra artefactes i errors comptables amb el seu denominador. Costos, crèdits, tokens i nombre de sessions només se sumen si hi ha una font compatible i sense duplicats; si no, escriu «no mesurat». No inventes un percentatge d'al·lucinacions o d'eficiència.
3. Sobre la persona, recull només allò que haja comunicat voluntàriament i els fets necessaris per a l'encàrrec. No inferisques fatiga, hormones, salut física o capacitat cognitiva de la veu, de l'hora o del nombre de missatges. No convertisques esta skill en un interrogatori ni en una avaluació mèdica.
4. En tancar, deixa inici i final observats, fonts, pauses conegudes i pendents. El registre per a la Consola Termodinàmica és un relleu documental: esta skill no escriu dades de producte ni acredita que s'hagen importat.

## Cobertura

`tooling/wiki/document.mjs` i `tooling/gates/tancament.mjs` comproven estructura i continuïtat documental. No mesuren la jornada humana ni validen estimacions de salut o cost. La telemetria de producte de `src/data/telemetria.js` és una font distinta: no hi atribuïsques dades personals o sessions de xat que no recull.

## Vincles

- [[00_INDEX_SKILLS]]
- [[wiki-cicle-de-vida/SKILL]]
