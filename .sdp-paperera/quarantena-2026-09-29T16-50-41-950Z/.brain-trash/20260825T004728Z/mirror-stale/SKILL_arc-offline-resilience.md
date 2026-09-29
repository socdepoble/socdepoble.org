---
estat: generat
tipus: document
description: Vista generada des de .agents/skills/arc-offline-resilience/SKILL.md; no editar.
source: .agents/skills/arc-offline-resilience/SKILL.md
source_sha256: 3a933dc34297f35abf9e6f8d68d6482ed9771de302d82ef4207efd8a0d8d57ac
---

> [!warning] FITXER GENERAT
> Font canònica: `.agents/skills/arc-offline-resilience/SKILL.md`. Qualsevol edició manual serà sobreescrita.

# arc-offline-resilience


## Antic: offline-first-resilience-engineer

---
name: offline-first-resilience-engineer
lang: ca
description: "Patrons de disseny per a Progressive Web Apps (PWA) que han de funcionar en entorns rurals amb cobertura intermitent."
version: 1.0.0
status: canonic
abast: ["global"]
---

# SKILL: Offline-First Resilience Engineer

## Description
Patrons de disseny per a Progressive Web Apps (PWA) que han de funcionar en entorns rurals amb cobertura intermitent, maquinari antic (iPad A10) i usuaris no digitals.

## When to use
- Dissenyant qualsevol nova secció que depèn de dades remotes.
- Implementant sincronització de dades (CRDT, Y.js, o custom).
- Optimitzant per a Mode Bancal (alta lluminositat, pantalla gran, touch targets amplis).

## Principles
1. **Local és la Veritat**: La font de veritat primària ha de ser el dispositiu. El servidor és un mirall, no un cervell.
2. **Degradació Elegant**: Si falla la xarxa, l'usuari ni s'ha d'assabentar. Cap pantallazo blanc.
3. **Termodinàmica A10**: Cada byte i cada cicle de CPU compten. Anem a sobrar, no a escatimar.

## Procedure
1. **Estratègia de Dades**:
   - `seed`: Dades hardcoded per a demo.
   - `local`: IndexedDB com a font de veritat.
   - `hybrid`: Intentar escriure a Supabase; si falla (RLS, 401, offline), guardar a una cua local i reintentar en segon pla.
2. **Service Worker**:
   - Cache-first per a assets estàtics.
   - Network-first per a API, amb timeout de 3-5 segons (no 12!).
3. **UI Resilient**:
   - Touch targets mínims de 56px.
   - Contrast AAA en text.
   - Feedback immediat: quan l'usuari prem un botó, canvia l'estat abans de rebre confirmació del servidor.
4. **Sync en Segon Pla**:
   - Usar `navigator.serviceWorker.ready` + `sync` per a enviar la cua local quan torni la connexió.
   - Mostrar un indicador discret (badge "Pendent de sincronitzar").

## Anti-patterns
- Bloquejar la UI esperant una resposta de xarxa.
- Usar `alert()` o `confirm()` natius (trencen el flux immersiu).
- Depèn exclusivament de `localStorage` per a dades de negoci.
- Ometre el maneig d'errors de quota excedida.


## Antic: sovereign-offline

---
name: sovereign-offline
description: Disseny i raonament assumint zero connectivitat, maquinari antic i llum solar intensa. Prioritza IndexedDB/localStorage, Service Workers i degradació elegant.
---

# Sovereign Offline

## Principis
- Les dades viuen al dispositiu de l’usuari.
- Qualsevol feature nova ha de funcionar (o degradar) sense xarxa.
- Evitar dependències de CDN en runtime crític.
- Heartbeats i sync han de ser opcionals i silenciosos quan fallen.
- UI llegible amb iPad A10 sota el sol (contrast, mida de lletra, Mode Bancal).

---

**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
