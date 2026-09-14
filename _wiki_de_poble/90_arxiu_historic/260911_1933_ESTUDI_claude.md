---
tipus: estudi
estat: actiu
description: Estudi de l'Auditoria de Claude (Seient 5) sobre la Super Petorreta
---
# 🧠 ESTUDI DE L'AUDITORIA: CLAUDE (SEIENT 5)

**Data i Hora:** 260911_1933
**Origen:** Claude 3.5 Sonnet (Dictamen parcial, límits de context assolits).

Claude ha executat una anàlisi devastadora i extremadament precisa (Nivell Trellat Absolut). No ha lliurat codi encara perquè ha esgotat el límit del torn detallant els problemes, però ja té el pla d'execució llest.

## 🎯 Troballes Clau (El que ha descobert)

### 1. El Fals "Notes.css" i el Caos dels Estils (P0-A, P0-B)
L'error visual gravíssim de l'app de Notes prové d'una **soldadura** a `index.css:3383` (un comentari mal posat fusionava la barra de l'editor amb tots els botons d'icona de l'app). A més, no existeix cap `Notes.css`: els estils del gestor estaven duplicats a `index.css` fora de les capes (`@layer`), trepitjant-se a si mateixos.

### 2. Destrucció de Codi Fantasma (Sahumerio Quantificat)
Claude ja ha escrit un script (`tractor-poda-css`) que ha quantificat la brossa:
- **65 regles CSS mortes** preparades per ser eliminades.
- Variables JS orfes i residus de WordPress (`build:wp`) detectats per a la purga.

### 3. L'Estructura Definitiva (UniversalShell i Divisor)
Confirma que la `UniversalPage` ja s'encarrega del crom exterior. La bastida interna que demanàvem (Sidebar + Contingut) s'anomenarà **`UniversalShell`** (basat en l'actual `AppShell`).
Ha dissenyat el component **`Divisor` (Splitter)** amb accessibilitat total, arrossegament de ratolí, estils nets en refs i zero persistència legal, tal com demanàvem.

### 4. El Pont de Sollutia (Bloquejat)
Ha detectat contradiccions en el cànon actual respecte a Sollutia. Proposa una **Capa Anticorrupció (DTO)** on es llegeix per defecte, només s'escriu per llista blanca, i cada usuari s'autentica amb Sollutia, però guardem xat/notes a la nostra BD.

## 🛑 PREGUNTA OBERTA (PER RESPONDRE A CLAUDE)

Claude ha deixat una pregunta per desbloquejar la **Fase 2 (Sollutia)** abans de començar a escopir codi. Necessite que m'indiques la teua decisió per enviar-li-la:

> **Pregunta de Claude:** El «silenci» amb Sollutia vol dir **zero exigències** cap a ells (ells no han de canviar res de la seua BD ni del seu codi, ens hi adaptem completament), o **ocultació** (literalment no han de saber tècnicament que el nostre front-end es connecta a les seues APIs)?

*NOTA:* A nivell d'enginyeria, "zero exigències" vol dir que construïm la nostra UI usant exactament els endpoints/JSON que Sollutia ja ofereix al món, aïllant-nos internament per no trencar res si ells canvien dades.

## 🛠️ Pla de Claude (Ordre de lliurament)
Quan li donem la resposta, Claude lliurarà els pedaços en aquest ordre:
1. La soldadura de `index.css`.
2. Gestor de Notes (Carril, Acordió i Crom arreglats).
3. `UniversalShell` i el `Divisor` (Splitter).
4. La poda de les 65 regles mortes.
5. Reparació de tests i captures ABANS/DESPRÉS.
6. Pàgines del catàleg de disseny.
