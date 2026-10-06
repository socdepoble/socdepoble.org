---
type: document
status: esborrany
description: Pla per resoldre els bloquejos mecànics, el commit atòmic i el crash de useSession
tags:
  - implementacio
visibility: private
reflex: sdp:torn_6f2b5c7d-b0de-4b08-a27f-e867dff0765c:628620ed-72cd-4877-9605-ee28842974a8
---
# Pla d'Implementació: Resolucions de l'Auditoria Fable

**Estat del Pla:** [en elaboració]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6f2b5c7d-b0de-4b08-a27f-e867dff0765c:628620ed-72cd-4877-9605-ee28842974a8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T11:06:20.441Z |
| Modificació | 2026-10-05T11:06:20.441Z |
| Propietari | Opus 5.5 Ultracode |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Opus 5.5 Ultracode |
| Tokens consumits | Sense comptador de cost; 9,12 M tokens de subagents en l'execució de les Fases 1-3 (vegeu el Registre de 261006_0025_auditoria_opus) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-05T11:06:20.441Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Fase 1: Higiene i Tractors (CRÍTIC)
- [ ] **Pas 1.1:** Auditar i arreglar el trencament del **Segell de Skills**.
- [ ] **Pas 1.2:** Resoldre el forat mecànic de la Porta Olivera (`porta-olivera.mjs`) respecte a la categoria `produccio` aplicant Tècniques d'Investigació.
- [ ] **Pas 1.3:** Investigar el patró d'error recurrent d'"àncores a documents absents" en `00_index_escriptori.md`. Aplicar la Tècnica d'Investigació per descobrir si hi ha un error al codi dels tractors que lliguen les pàgines o a l'script de validació.

### Fase 2: Crash de useSession i Neteja UI (T1, T3)
- [ ] **Pas 2.1:** Atacar el crash de `useSession` a través d'un test d'integració (`ControlSection.sessio.test.jsx`).
- [ ] **Pas 2.2:** Realitzar la neteja de la Consola Termodinàmica i les seues targes d'ús.

### Fase 3: El Commit Atòmic (T2)
- [ ] **Pas 3.1:** Eliminar fitxers brossa gegants (com el bundle de 67MB `261005_1154_BUNDLE_null.md`).
- [ ] **Pas 3.2:** Revertir els paràmetres temporals (ex. `stable.json`).
- [ ] **Pas 3.3:** Finalitzar l'auditoria amb instruccions per al Commit Atòmic.

### Fase 4: Enxufabilitat i Mode Local (Model B)
- [ ] **Pas 4.1:** Permetre l'accés a `/app/gestoria` (i a la resta d'apps locals com el TPV i la Nevera) sense que la guarda `RequireAuth` redirigisca a `/registre`. El sistema complet s'ha d'obrir en local i sense connexió de xarxa al backend per a poder explorar-lo.

### Fase 5: Unificació Visual Rebost i TPV (Patró Loyverse)
- [ ] **Pas 5.1:** Redissenyar la "Nevera/Rebost" i la "Llista de la compra" aprofitant el format visual i estructural del TPV clonat de Loyverse ("La Parròquia"). **NOTA PER A CLAUDE:** El Mestre ha deixat les captures originals de referència de Loyverse a `_wiki_de_poble/04_escriptori/01_produccio/loyverse_clon` i `_wiki_de_poble/04_escriptori/01_produccio/loyverse_clon_mobil`. A més, tens les **noves captures de l'iPad** disponibles a `_wiki_de_poble/04_escriptori/01_produccio/loyverse_clon_ipad`.
- [ ] **Pas 5.2:** Integrar el catàleg de productes (llista de Mercadona) aplicant aquest disseny Loyverse (productes categoritzats en graella) de forma que el codi dels llistats d'articles siga estructuralment idèntic tant per a vendre (TPV) com per a emmagatzemar/comprar (Rebost).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- **Tests verds:** El test d'integració reproduïx i arregla el crash.
- **Porta Olivera verda:** Acaba l'auditoria sense deixar restes i arxiva bé.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Manipular manualment segells o LEDGER pot corrompre l'estat.
- Oblidar netejar l'escriptori provocarà el tancament de l'husky i el fracàs del commit.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
