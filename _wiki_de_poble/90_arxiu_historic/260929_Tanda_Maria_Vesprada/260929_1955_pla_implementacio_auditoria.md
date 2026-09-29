# Pla d'Implementació: Auditoria Visual i Bugfixes (T13, T14)

## Estat i Objectiu
S'ha detectat una incidència múltiple que cal resoldre de manera coordinada. Aquest pla actua de full de ruta immutable per a l'agent encarregat (Claude/Codex o MarIA).

## Tasques

- [ ] **Higiene i Rigor Metodològic**: Revisar/crear el Tractor Cognitiu d'Automillora perquè MarIA no pugui ometre mai més (a) Netejar l'escriptori i (b) Crear aquest Pla d'Implementació abans del prompt.
- [ ] **T14 (Pantalla Blanca Enxufe WP)**: Corregir l'error `Uncaught ReferenceError: process is not defined` provinent de `vite.standalone.config.js` o dependències.
- [ ] **Bug Fix (Supabase 400)**: Corregir error d'autenticació `invalid_credentials` per a permetre l'accés.
- [ ] **Visual Bug (Login Form)**: Aplicar padding/marges al formulari de login seguint l'arquitectura Pedra Seca.
- [ ] **T13 (Bug Fix: Empty Seed Data)**: Arreglar la lògica de precedència a `src/config/dataMode.js` sense trencar el botó de "Connectar".
- [ ] **T6 (Automillora Proactiva)**: Integrar la proposta pendent de l'anterior pla de Codex.

## Consens tècnic
Claude o l'agent assignat ha de generar el seu informe i, si resol els bugs, verificar que passa els criteris d'acceptació esmentats al prompt. Cap prompt s'envia si el seu corresponent checkbox no es troba en un Pla d'Implementació.

## Vincles
- [[260929_1839_prompt_claude_auditoria_visual.md]]
