---
tipus: document
estat: esborrany
description: "🛡️ ESTUDI: AUDITORIA DE SEGURETAT I ENCHUFABILIDAD A SOLLUTIA"
---
# 🛡️ ESTUDI: AUDITORIA DE SEGURETAT I ENCHUFABILIDAD A SOLLUTIA
Data: 2026-09-12
Objectiu: Consolidar les auditories de l'Eixam (Claude, Deepseek, Qwen, etc.) per a tindre la memòria fresca a l'hora d'implementar sense saturar el context termodinàmic.

## 1. CONCLUSIONS DE L'EIXAM FINS ARA

### 🧠 CLAUDE (El Mestre d'Obres Analític)
Claude ha destapat forats molt específics i letals que l'escàner orfe no veia, amb un pla d'acció clar:
1. **El forat SQL (`public.updateOrganization`):** Un error de sintaxi al SQL (un nom de mètode de JS en lloc d'una taula) feia rollback de la migració. La privacitat RLS sobre `profiles` NO s'estava aplicant.
2. **Fuita de memòria i sessió al Xat (`supabaseBackend.js`):** El socket `Realtime` sobreviu al `logout()`. Un usuari desconnectat continua rebent missatges amb el token antic. Cal implementar `tancaRealtime()` i `reautenticaRealtime()`.
3. **Bloqueig de Gestoria (`useGestoriaData.js`):** Importa un Dexie inexistent. Claude proposa usar `teCapacitat('gestoria')` de `backendPort.js` com a degradació elegant, tractant Gestoria com a mòdul opcional en lloc de trencar l'app sencera.
4. **La Porta d'Importacions:** Claude proposa crear un nou script `tractor-importacions.mjs` per a evitar per sempre les importacions mortes (com la de Dexie) abans d'arribar al build.

### 🧠 QWEN (El Filòsof de l'Arquitectura)
Qwen ha validat la importància de la Llei de l'Enxufabilitat:
- S'ha de crear un **adaptador intermediari (facade)** per a Dexie/Sollutia, sent els components visuals 100% agnòstics.
- L'`AuthProvider` ha de ser una capa intermèdia que reba el JWT sense lligar la lògica del component.

### 🧠 DEEPSEEK (L'Auditor de Seguretat)
Deepseek està en procés de revisar la governança i la seguretat profunda de l'arquitectura. Se li ha instruït que prioritze l'estabilitat de l'API de Sollutia, la seguretat del JWT i l'agnosticisme dels components.

---

## 2. PLA D'IMPLEMENTACIÓ (ORDRE DE FOC)

Seguint la directriu de Claude, executarem les solucions en este ordre:

- [x] **PAS 1: Seguretat SQL (Molt Crític)**
  - Corregir `supabase/migrations/260912_1500_correccio_privacitat_perfils.sql`.
  - Canviar `public.updateOrganization` per `public.organizations`.
  - Assegurar que la política RLS actua sobre `visibility`.
- [x] **PAS 2: Seguretat de Sessió (Xat i Supabase)**
  - Afegir `tancaRealtime()` i `reautenticaRealtime()` a `src/data/supabaseBackend.js`.
  - Cridar `tancaRealtime()` al fer `logout()`.
- [x] **PAS 3: Enchufabilidad i Bloqueig de Gestoria**
  - Reescriure `useGestoriaData.js` per a no dependre de `Dexie`.
  - Endollar-lo a la capacitat `loadGestoria` de `backendPort.js`.
  - Afegir la barrera visual a `GestoriaSection.jsx` quan no hi haja capacitat.
- [x] **PAS 4: Estabilitat del Tooling**
  - Crear `tooling/gates/tractor-importacions.mjs` i afegir-lo a `run-portes.mjs`.
  - Arreglar les importacions de `.cjs` a `.mjs` als compiladors de la Wiki.
