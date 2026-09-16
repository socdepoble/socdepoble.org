---
tipus: acta
estat: canonic
description: ACTA MARMOTA - Transició del Tractor a Radar i Troballes de Z
tags:
  - maquina
---
# Acta Marmota: L'Assecat del Graf i la Saviesa de Z
**Data/Hora:** 16 de setembre de 2026, 05:40h

## 1. Resum del Cicle (On ho hem deixat)
S'ha donat per finalitzada la conversa actual per esgotament del context de les IAs i fatiga del cicle (Claude s'ha quedat sense tokens en ple generació de l'auditoria extrema de Sollutia).
L'estat de l'escriptori s'ha purgat, verificat (`node tooling/gates/tancament.mjs` executat amb èxit) i tots els orfes s'han ancorat als índexs corresponents. La sessió està tancada.

## 2. El que hem aconseguit hui
- **Cirurgia del Tractor:** Hem transformat completament `tractor-cervell-ia.mjs`. Ha deixat de ser un element d'escriptura heurística destructiva (escriptura "psicòpata") i ara és exclusivament un **Radar** que genera dictàmens per consola, respectant la integritat del Frontmatter.
- **Assecat del Graf Visual:** Mitjançant el codemod `codemod_assecar_graf.mjs`, hem eliminat massivament els blocs de taxonomia incrustats al cos de 52 documents. La Teixidora s'ha actualitzat per no injectar més brossa.
- **Resolució de la "Purga Inversa":** Dola ens va aconsellar no dependre d'una llista tancada de "claus roïnes", sinó permetre NOMÉS les claus del `schema.properties`. Ho hem implementat al Radar.

## 3. Les Lliçons de Z (Pendent d'assimilar)
Z ens ha regalat un dictamen profund. Va adonar-se que el micro-bundle estava truncat (només rebia el manifest i la capçalera), un indici de la seua gran capacitat d'anàlisi deductiva.
Z ens deixa tasques importants d'espartanisme de cara a demà:
- El graf visual d'Obsidian s'asseca de veritat **retirant la generació de "Sinapsis Entrants"** de la Teixidora i confiant completament en la gestió nativa de *backlinks* de l'editor. Allò autogenerat no és evidència.
- Cal consolidar els *Schemas* (n'hi ha 4).
- Cal registrar els 5 manaments de Z a la memòria històrica (ex: "La quarantena no es llegeix", "Allò generat no és evidència").

## 4. Què fer només obrir els ulls demà (Tasques)
1. **Llegir aquesta Acta Marmota.**
2. **Rebre l'Auditoria de Sollutia:** El Mestre ens passarà el text/codi que Claude ha aconseguit generar sobre l'arquitectura inversa de Sollutia abans de penjar-se. Haurem d'integrar eixos descobriments al codi de la *App* (recursos, auth relay).
3. **Poda de Tractors:** Començar a consolidar l'excés de "tractors" seguint l'advertència del Consell, evitant el risc de deriva de la veritat i la duplicació de lògiques de `schema`.
4. **Assimilació de Z:** Traslladar els axiomes de Z a `.agents/skills/skill-memoria-historica/SKILL.md`.

## 5. El Contracte
El context és net. Demà comencem amb el dictamen de seguretat de Sollutia a la safata d'entrada i un graf molt més sec i autèntic.
