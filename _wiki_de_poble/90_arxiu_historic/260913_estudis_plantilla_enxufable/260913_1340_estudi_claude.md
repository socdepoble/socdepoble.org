---
tipus: document
estat: esborrany
description: Estudi de l'Auditoria de Claude (Plantilla Enxufable)
---
# Estudi de l'Auditoria de Claude (Plantilla Enxufable)

**Data i Hora:** 2026-09-13T13:40:00+02:00
**IA Auditora:** Claude 3.5 Sonnet (Opus 5)

## 1. Veredicte Principal
Claude indica que la Fase 4.5 ja estava encaminada al bundle (la meua teoria és que llegia fragments del prompt on es descrivia, o fitxers ja preparats parcialment), i per això **ha avançat directament a la Fase 5**: la toolbar ja no rep propietats com `isBold`, sinó que rep una llista iterativa de botons. 

## 2. P0 i Bugs Crítics Detectats (i solucionats)
Claude ha demostrat una capacitat d'anàlisi de codi espectacular, detectant problemes de domini que Codex havia passat per alt:
- **Bug de Facetes al Perfil:** La columna d'identitats no filtrava absolutament res perquè les facetes es declaraven sense `type`, de manera que el `ManagerContext` les ignorava. 
- **Bug de Selecció d'Identitat (P0):** Editar una associació escrivia sobre el perfil personal. `PerfilContext` tenia una màquina de selecció desconnectada de la closca, provocant que `identitatId` es quedara congelat a `'jo'`. Qualsevol canvi d'una entitat es guardava com a canvi del perfil personal de l'usuari (greu problema d'integritat de dades).
- **Bug Visual (Menú "/"):** Ha detectat que el CSS `.sdp-slash-menu` utilitzava variables que no existeixen en Sóc de Poble (`--sdp-fons`, etc.), provocant que el menú flotara sense fons ni radi per damunt del text.

## 3. Arquitectura Proposada
L'arquitectura proposada per Claude sembla molt robusta i filosòficament purista:
- `contractePlantilla.js` (esquema i normalització)
- `UniversalBackend.jsx` (les columnes pures)
- `UniversalEntityEditor.jsx` (columna 3 amb variant rica i plana)
- Ha separat l'editor en dos components en lloc d'usar un `if` perquè el perfil no pague la penalització de muntar TipTap si no cal.

## 4. DAFO
- **Fortaleses:** Identificació i resolució proactiva de bugs (P0), purisme React (evitar muntatges innecessaris de TipTap), optimització CSS (eliminació de classes òrfenes).
- **Oportunitats:** Tindre una arquitectura extremadament robusta i agnòstica.
- **Debilitats / Amenaces:** Ens ha de donar 12 fitxers i no sabem si introduirà massa complexitat respecte al delta més conservador de Codex. Caldrà avaluar-los.
