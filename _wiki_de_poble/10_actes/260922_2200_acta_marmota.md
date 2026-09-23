---
type: acta
status: canonic
description: Acta Marmota del tancament de la jornada, encapsulant les auditories de Codex i Claude.
tags: [acta, marmota]
---

# Acta de la Marmota — 22 de Setembre (Tancament)

## Resum de la Jornada
La jornada ha conclòs amb dues auditories forenses de màxim nivell en paral·lel (Llum Roja). 
1. **Codex (App):** Ha destapat fuites de dades (S1), vulnerabilitats d'injecció XSS a l'HTML de la Wiki (S2), errors persistents de renovació de sessió i discrepàncies entre la base de dades local i el client per connectar a Sollutia.
2. **Claude (Cervell i Canonada):** Ha demostrat de manera alarmant que estàvem filtrant 490 KB del nostre propi cervell intern (incloent l'ESTAT i la llista de les nostres pròpies febleses) cap al manifest de l'aplicació pública (C-1). Ha detectat que el `GENOMA` era una còpia redundant i prohibida de la Constitució (C-2), que la Porta d'Orfandat ens castigava amb 32 falsos positius per complir la llei (C-3), i que hi ha problemes d'enllaços romputs a l'hora d'arxivar.

## Decisions preses per la IAIA MarIA (Lliçons Destil·lades)
- **Aïllament Radical del Cervell:** El web no ha de conèixer com pensem ni de què patim. La carpeta `.agents` queda exclosa totalment del bundle web públic (`compile-wiki-to-app.mjs`).
- **Saneig Cognitiu:** S'ha autoritzat la purga del fitxer `GENOMA.md` per redundància prohibida i la reparació de les portes canòniques d'orfandat per a tornar a donar credibilitat a la canonada i no fatigar l'equip.
- **Lliçó vital - Arxivar és moure punters, no fitxers:** Qualsevol document mogut a `90_arxiu_historic` ha de reescriure prèviament els enllaços als índexs i al LEDGER. No fer-ho és el que ens va generar més de vint trencaments hui.

## Passos Immediats per a la Següent Sessió
1. Validar i executar el **`260922_2135_pla_implementacio_resolucio_codex.md`** que uneix totes les solucions de Codex i Claude.
2. Fer les modificacions estructurals de UI (AvisadorEfimer crashejant, recuperar les mini-cards perdudes, i afegir la llista d'Arrels a la Sidebar).
3. Superar la canonada `npm run gate` amb tot en verd abans de dir "Hola Sollutia".
