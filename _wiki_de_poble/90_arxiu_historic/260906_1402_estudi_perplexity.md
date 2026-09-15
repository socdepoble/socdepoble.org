---
tipus: estudi
estat: actiu
description: Auditoria Perplexity
---

# Auditoria Perplexity

## 1. Troballes Crítiques
* **C-01 — Contracte Sollutia inexistent:** No hi ha clau d'idempotència, ni cua de lliuraments, ni política de reintents. Una petició pot crear duplicats si es perd la resposta. Recomana una taula `integration_operations`.
* **C-02 — Simulació d'èxit (Mentida a la UI):** `MyProfileSection.jsx` simula un desament correcte sense contactar amb el backend de veres.
* **C-03 — Dues fonts de veritat pel perfil:** Es mescla `getProfile` de Supabase amb les `user_metadata` locals.

## 2. Estat i Base de Dades
* **H-01 — RLS com a únic escut:** Falten proves d'accés negatives per confirmar que l'anònim no llig el que no toca.
* **H-02 — Operacions no transaccionals:** Crear una organització i afegir el creador no és atòmic. Pot quedar a mitges.
* **H-03 — Estat de càrrega massa global:** Confirma el monstre d'`AppDataContext` (i afig `PerfilContext`), demanant separar l'estat per responsabilitats.
* **H-04 — `useMemo` com a pedaç:** Amaga un problema d'estat de desament. Cal una màquina d'estats real (idle, saving, saved).

## 3. Contradiccions i Deute Tècnic
* **H-05 — Contradicció documental:** L'ADR diu Online-First, però el BIOS encara parla d'Online-First i Dexie.
* **H-06 — SDP-LOCK dèbil:** És un fitxer fràgil que un hook pot esborrar. Hauria d'estar vinculat al hash del commit.
* **H-07 — Injecció de Shell:** L'script de matriu `toolingbrainmatrix.mjs` executa comandes de terminal directament amb noms de fitxers temporals previsibles.

---
**Ancoratge de Seguretat:** [[00_index_escriptori]]
