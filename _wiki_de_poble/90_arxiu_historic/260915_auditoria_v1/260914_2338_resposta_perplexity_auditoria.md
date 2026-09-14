---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: Perplexity"
---
# 🛡️ INFORME DEL CONSELL — AUDITORIA DEL PAQUET `260914_2308_BUNDLE_auditoria` (Resposta de Perplexity)

**Veredicte**
Resultat: NO APTE per a donar-lo per tancat. El bundle és estructuralment verificable i declara l’abast, el manifest i les sumes SHA-256, però l’evidència disponible mostra riscos importants de coherència entre la wiki, les portes executables i la integració online amb Sollutia. No propose cap mutació automàtica ni cap canvi de dades.

El bundle conté 529 fitxers i aproximadament 3,37 MB, amb manifest de ruta, bytes, línies i SHA-256. També declara explícitament directoris inclosos, fitxers obligatoris, opcionals i absents no crítics.

---

## Troballes

| ID | Severitat | Causa | Evidència |
|---|---|---|---|
| **AUD-01** | Crítica | El paquet acredita el contingut del bundle, però no acredita per si mateix l’execució satisfactòria de totes les portes sobre aquest arbre. | El bundle documenta el manifest i la verificació SHA-256, però el resultat d’auditoria executable no apareix com a rebut complet. |
| **AUD-02** | Alta | Hi ha risc de confondre documentació futura amb capacitats actuals. | La wiki declara que l’aplicació actual depén de serveis remots i que offline-first complet, CRDT i independència del servidor no són garanties vigents. |
| **AUD-03** | Alta | Les portes de deute poden quedar parades o omeses si falten dependències, fitxers baseline o scripts executables. | `consolidarbaselines.mjs` diferencia PARAT, OMÉS, PENDENT, ACTIVA i CREIX; el propi codi adverteix que una porta parada no és una porta verda. |
| **AUD-04** | Alta | Existeix una frontera d’integració Sollutia que necessita una verificació explícita del port, del contracte i del punt de congelació. | `tractor-enxufe.mjs` defineix E1–E4: backend darrere del port, contracte sincronitzat, segellat fora del cicle de vida i una sola superfície global. |
| **AUD-05** | Mitjana | La política visual té deute declarat i pot produir falsos verds si només es compten literals o regles buides. | `designguard`, `censcromatic` i `tractor-estucat` separen soroll, rampes neutres, vocabulari absent i regles CSS buides. |
| **AUD-06** | Alta | La wiki conté referències que poden no correspondre amb rutes reals; això trenca la reproducibilitat de l’auditoria. | `tractor-doctrina.mjs` existeix precisament perquè s’havien detectat camins citats en `AGENTS.md` que no existien, com `src/universal/UniversalComponents.jsx`. |
| **AUD-07** | Mitjana | La privacitat i les dades personals no tenen marge per a automatismes no justificats. | La skill d’auditoria exigeix no introduir contingut privat o sensible en embeddings o telemetria sense base jurídica i control humà. |

---

## Causa principal
La causa principal no és una única línia defectuosa, sinó una desconnexió entre tres nivells de veritat:
- **Bundle documental:** el paquet conté fitxers i hashes declarats.
- **Portes operatives:** els scripts poden executar, fallar, quedar parats o ometre dependències.
- **Arquitectura real:** el sistema és Online-First, amb React SPA, Supabase, GoTrue i RLS; la sobirania local és futura, no una capacitat actual.

El risc és que un bundle ben format es presente com una auditoria completada encara que alguna porta no haja arrancat, no tinga baseline o no haja produït un rebut verificable. El mateix codi de consolidació identifica aquesta confusió com un defecte conegut: “una porta parada és pitjor que una porta roja”.

---

## Correccions mínimes

### 1. Afegir un rebut d’auditoria obligatori
Crear un únic rebut immutable o atòmic amb:
```json
{ 
  "bundle": "260914_2308_BUNDLE_auditoria.md", 
  "manifestVerified": true, 
  "treeVerified": false, 
  "gates": { 
    "wikiauditstrict": "NOT_RUN", 
    "precommitsdp": "NOT_RUN", 
    "tractor-enxufe": "NOT_RUN", 
    "tractor-doctrina": "NOT_RUN", 
    "tractor-estucat": "NOT_RUN" 
  }, 
  "status": "INCOMPLETE", 
  "requiresHumanDecision": true 
}
```
**Regla mínima:**
- `PASS` només si la porta ha arrancat i ha acabat amb codi 0.
- `FAIL` si ha trobat infraccions.
- `BLOCKED` si falta una dependència, script o baseline.
- `NOT_RUN` si no s’ha executat.
Mai convertir BLOCKED o NOT_RUN en verd.

### 2. Verificar el contracte Sollutia
Executar i conservar l’evidència de les quatre lleis del `tractor-enxufe`:
- cap import directe de `supabaseBackend.js` fora del port;
- exports del port i contracte coincidents;
- congelació de la implementació fora de connectedCallback;
- globals declarats en una única superfície pública.

Aquesta és la correcció prioritària perquè afecta directament la capacitat futura de separar el frontend de la implementació Supabase sense trencar el sistema. No cal extraure encara cap “core” nou: la governança vigent diu que les fronteres actives continuen en `src/sections`, `src/components`, `src/config` i `src/data`.

### 3. Consolidar baselines sense reduir el deute
Executar la consolidació només en mode diagnòstic i després generar baselines únicament per a les portes que:
- existeixen;
- arranquen;
- mesuren realment el deute;
- escriuen el seu fitxer esperat;
- queden revisables al manifest.
El baseline ha de ser un sostre: el nombre d’infraccions només pot baixar. Regenerar-lo per amagar un increment és incorrecte i ha de quedar prohibit.

### 4. Corregir rutes documentals inexistents
Executar `tractor-doctrina` sobre els àmbits normatius i reparar només les referències que siguen demostrablement incorrectes.
**Correcció mínima:**
- substituir una ruta inexistent per la ruta real quan el suggeriment és inequívoc;
- si hi ha més d’una candidata, marcar `requiresHumanDecision`;
- no crear fitxers ficticis per satisfer la porta;
- no tocar documents històrics ni mirrors per fer-los passar.

### 5. Separar clarament actual i futur
En qualsevol informe del paquet, mantindre aquesta classificació:
- **ACTIU:** React SPA + Supabase + GoTrue + RLS. 
- **ACTIU PARCIAL:** PWA i persistència local limitada en zones concretes. 
- **NO ACREDITAT:** offline-first complet, CRDT general, P2P, sobirania local. 
- **FUTUR:** arquitectura descentralitzada i independència del backend central.

Això evita atribuir a l’aplicació actual garanties que la pròpia wiki qualifica com a futures o no demostrades.

---

## Pla de verificació
Ordre recomanat, sense modificar dades ni fitxers de producte:
1. Verificar el manifest del bundle i les sumes SHA-256.
2. Executar l’auditoria canònica de wiki en mode JSON.
3. Executar el verificador estricte de wiki.
4. Executar `tractor-doctrina`.
5. Executar `tractor-enxufe`.
6. Executar les portes de disseny i CSS, inclòs `tractor-estucat`.
7. Consolidar el resultat en el rebut d’auditoria.
8. Rebutjar el tancament si qualsevol porta queda BLOCKED, NOT_RUN o sense evidència.

## SDP-LOCK
No cal activar un bloqueig destructiu sobre dades, perquè no s’ha sol·licitat cap mutació i no hi ha evidència d’una operació de destrucció en curs.
Sí que cal un bloqueig de publicació de l’auditoria fins que:
- totes les portes crítiques tinguen estat explícit;
- el contracte d’enxufe amb Sollutia estiga comprovat;
- les rutes normatives inexistents estiguen resoltes o acceptades humanament;
- el rebut final distingisca PASS, FAIL, BLOCKED i NOT_RUN.

**Conclusió:** el paquet és una bona base auditable, però ara mateix és un bundle verificable amb auditoria incompleta, no una auditoria tècnica tancada.
