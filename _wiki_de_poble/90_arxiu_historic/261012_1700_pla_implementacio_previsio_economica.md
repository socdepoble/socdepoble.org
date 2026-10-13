---
type: document
status: esborrany
description: Pla per afegir deteccio de factures recurrents (ex. Lowi) i previsio economica a la Gestoria
tags:
  - implementacio
visibility: private
reflex: sdp:torn_2ded46a0-6215-44ab-9567-8531b539fc27:83313903-2e1b-4b45-828c-8d5b8374c3a3
---
# Previsio Economica i Factures Recurrents

**Estat del Pla:** [en elaboració]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2ded46a0-6215-44ab-9567-8531b539fc27:83313903-2e1b-4b45-828c-8d5b8374c3a3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T14:51:24.393Z |
| Modificació | 2026-10-12T14:51:24.393Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini |
| Tokens consumits | N/A |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-12T14:51:24.393Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
La necessitat detectada és triple:
1. **Factures Recurrents i Previsió**: L'usuari indica que hi ha serveis (com Lowi) que no es comptabilitzen tots els mesos per oblit, creant deutes invisibles. Es necessita monitoritzar els patrons de despesa, detectar "factures fantasma" i calcular una projecció econòmica anual.
2. **Conciliació Intel·ligent**: Es busca automatitzar la feixuga tasca de lligar moviments bancaris amb factures, oferint suggeriments automàtics al pur estil *Holded*.
3. **Evolució cap a un Sistema de Partida Doble (Estil GNU Cash) 100% Automatitzat**: Inicialment pensàvem en taules planes per a despeses de llar i d'empresa, però sent l'usuari autònom, estes caixes estan estretament lligades. Es migrarà cap a un motor comptable complet de **partida doble** (on cada apunt té un Dèbit i un Crèdit), a l'estil de *GNU Cash*. La diferència clau és que **la complexitat estarà completament abstreta per a l'usuari**. L'autònom no ha de saber què és un Dèbit o un Crèdit; la IA (a través dels *skills* i el motor) s'encarregarà de quadrar-ho tot només mirant els moviments del banc i de la caixa, classificant-ho automàticament entre llar i empresa.
4. **L'Estrella Polar (Objectiu Final)**: Tot aquest sistema no és només per tenir gràfics bonics, sinó per poder **automatitzar completament la Declaració de la Renda i la liquidació d'impostos (IVA, IRPF)**. El motor comptable i l'Assistent Financer IA han de ser capaços, a final de trimestre/any, de llegir els llibres majors (que ja estaran perfectament quadrats i categoritzats) i generar o fins i tot presentar els models tributaris sense necessitat de passar per un gestor humà tradicional.

#### Referències de Suport (GNU Cash)
- [Features](https://www.gnucash.org/features.phtml)
- [FAQ Oficial](https://wiki.gnucash.org/wiki/FAQ) (Base de coneixement per a la lògica de Partida Doble)

### 2. Preguntes Obertes (User Review Required)
- **Motor GNU Cash (Partida Doble)**: Estàs disposat a que transformem l'arquitectura de dades actual de la Gestoria cap a un model d'Apunt Comptable (Diari/Major) on cada despesa de la casa implica moure fons del "Compte d'Empresa" al "Compte Personal"? És un canvi profund de paradigma (molt més potent i lliure d'errors a llarg termini).
- **Definició de Patrons Recurrents:** Volem deduir-los 100% automàticament comparant moviments similars de fa N mesos, o preferim crear un "llibre de contractes/subscripcions" explícit on tu indiques manualment que Lowi cobra X€ cada mes?
- **Conciliació Assistida**: T'agradaria que el sistema, a banda de suggerir ("Vols conciliar este moviment amb esta factura?"), puga arribar a fer-ho de forma desatesa al 100% si hi ha una confiança molt alta basant-se en l'import i el proveïdor?

### 3. Canvis Proposats (Proposed Changes)
- **[ACTUACIÓ PRÈVIA] Caçera de Skills Comptables:** Abans de programar, utilitzarem el tractor/skill `wiki-busca-skills` per rastrejar repositoris de GitHub i extraure lògiques, eines i *skills* de comptabilitat que ja existisquen per a Claude/GPT. No reinventarem la roda; adaptarem la seua intel·ligència financera al nostre motor.
- **[ACTUACIÓ PRÈVIA 2] Estudi del Pla General Comptable**: Creació del *Chart of Accounts* (Pla de Comptes) base inspirat en GNU Cash (Actius, Passius, Ingressos, Despeses, Equitat) adaptat a la realitat de l'autònom (separant Llar i Empresa).
- **[NEW] `src/sections/gestoria/tauler/nucli/motorComptable.js`**
  Un motor pur (Double-Entry Engine) per a construir llibres majors, validant que l'equació fonamental `Actius = Passius + Patrimoni + (Ingressos - Despeses)` suma zero sempre. Aquest motor operarà de forma invisible.
- **[NEW] `src/sections/gestoria/tauler/nucli/assistentFinancerIA.js`**
  Capa d'intel·ligència artificial que llegirà el banc i la caixa i generarà els apunts de Partida Doble automàticament, ocultant la complexitat comptable a l'usuari.
- **[NEW] `src/sections/gestoria/tauler/nucli/previsio.js`**
  Un mòdul centralitzat encarregat de la detecció d'anomalies i factures fantasma (facturació recurrent) comparant l'historial amb l'any vigent.
- **[MODIFY] `src/sections/gestoria/tauler/nucli/concilia.js`**
  Ampliació del sistema actual per oferir l'algoritme de **Conciliació Intel·ligent**, generant "propostes de conciliació" amb índexs de confiança.
- **[MODIFY] `src/sections/gestoria/tauler/targetesTauler.js`**
  1. Panell de "Conciliacions Pendents" a l'estil Holded (amb botons de confirmar suggeriments).
  2. Panell d'Alertes per a factures recurrents absents (Targeta Roja).
  3. Termòmetre de liquiditat global basat en els saldos del motor de Partida Doble.

### 4. Pla de Verificació (Verification Plan)
- **Proves unitàries a `motorComptable.test.js`**:
  - Assegurar que qualsevol apunt desequilibrat (on Crèdit != Dèbit) provoca error, fent indestructible la compatibilitat amb l'estil GNU Cash.
- **Proves unitàries a `concilia.test.js` i `previsio.test.js`**:
  - Un patró històric de 12 mesos, avaluant-ho en el mes 4 sense factures => detecta factures fantasma.
  - Simulació d'arribada d'un CSV bancari on un moviment té exactament el mateix import i CIF que una factura pendent => llança la proposta de conciliació automàtica.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

El desenvolupament requerirà `vitest` i validació manual als diferents dispositius abans de pujar el commit, seguint l'estàndard del repositori per a cada Tractor alterat.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Moure l'arquitectura des de "llistes de factures planes" fins a una **Comptabilitat de Partida Doble** incrementa dramàticament la complexitat inicial del sistema. L'esforç de programació serà molt alt per adaptar els lectors de CSV al format de bitàcola comptable (Diari).
- Possibilitat de falsos positius en la conciliació automàtica i els patrons recurrents automàtics, que caldrà mitigar amb confirmacions d'usuari i marges de tolerància als algoritmes.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
