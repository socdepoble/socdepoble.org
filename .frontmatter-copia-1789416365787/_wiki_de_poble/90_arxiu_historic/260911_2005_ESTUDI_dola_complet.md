---
tipus: estudi
estat: actiu
description: "Estudi complet de l'Auditoria de Dola sobre la Super Petorreta"
---
# 🧠 ESTUDI DE L'AUDITORIA: DOLA (COMPLETA)

**Data i Hora:** 260911_2005
**Origen:** Dola (Informe Canònic Final).

Dola ha presentat la dissecció més profunda de totes a nivell d'arquitectura React. No s'ha limitat a descriure els problemes, sinó que ha traçat l'arbre complet de dependències de `UniversalManager` fins arribar a `AppGridColumn`.

## 🎯 Aportacions Clau

### 1. Fixació Quirúrgica del Plegat (Notes)
Ha donat el codi JSX exacte per a fer que la roda dentada (Settings) i la lupa no desapareguen en mode *collapsed* dins de `ManagerFacets` i `ManagerList`. També ha marcat `NotesToolbar.jsx` i `notesContent.jsx` com a codi fantasma a purgar. (Tot això valida el que ja ha executat Codex localment).

### 2. Aïllament Extrem (Sollutia)
La solució de Dola per a Sollutia és sublim:
- Crea un `SollutiaAdapter.js` tancat hermèticament amb `Object.freeze()` per evitar que cap component pugui mutar les funcions de connexió.
- Afegeix un `ComponentIsolator.jsx` (`SollutiaSafeBoundary`) per a encapsular qualsevol codi aliè i evitar que trenque el nostre arbre de React si l'API falla.

### 3. Persistència del Resizer (Splitter)
El seu component `Splitter.jsx` és superior al plantejament estàndard perquè incorpora `persistenciaKey` usant el `localStorage`. Açò significa que si eixamples la columna de carpetes i tanques la web, en tornar a entrar mantindrà la mateixa amplada.

### 4. El Gran Catàleg de Disseny (9 Categories)
Ha sigut la IA que millor ha entès l'escala d'un Sistema de Disseny (Nivell Obsidian). Ha dictat **9 categories d'elements que falten** i ha suggerit dividir el document `DesignSectionContent.jsx` (que ja pesa 65KB) en subpàgines especialitzades:
- `DissenyFormularis.jsx` (Validacions, selects, condicionals)
- `DissenyNavegacio.jsx` (Paginacions, menús inferiors, tabs)
- `ModalUniversal.jsx` i sistema de Notificacions (Toasts).

## 🛠️ Acció Suggerida
Dola acaba d'elevar l'ambició del Sistema de Disseny. Quan anem a parlar amb **Claude Design** (com havíem planejat), hem d'exigir-li exactament l'estructura que ha dictat Dola: **Modals, Formularis Complexos i Navegació Mòbil**.

I la idea de dividir el catàleg de disseny en diverses "pàgines" (Formularis, Navegació, Components UI) ens salvarà de tenir un `DesignSectionContent.jsx` inmanejable.
