---
tipus: acta
subtipus: marmota
estat: tancat
description: "Sessió on es culmina la Fase 3 de l'UniversalEditorShell i es prepara la Petorreta per a la Fase 4"
---
# 📜 ACTA MARMOTA: CIRURGIA FINAL I PREPARACIÓ FASE 4
**Data i Hora de Tancament:** 260913_0430

## 1. El Que S'ha Assolit (La Gran Cirurgia)
- Hem rebut i processat l'auditoria de **8 IAs del Consell** sobre el redisseny de `UniversalEditorShell`.
- Hem aplicat la **"Composició Invertida"** (sentència de Z): ara `NotesEditor` dibuixa el `PageFrame` i injecta l'editor a dins. L'editor ja no té poder de disseny sobre la pàgina on viu, convertint-se en un verdader *plugin*.
- S'ha incrustat el **Contracte de la Caixa Única** a `modules.css` (`ues-root`, `ues-header`, `ues-scroll`, `ues-canvas`), eliminant de forma definitiva els problemes de col·lapse flexbox i les pantalles en blanc.
- Hem blindat el **Cicle de Vida del TipTap** (`useCommitProtocol` conceptual): evitant sobreescriptures creuades en canviar de nota ràpidament i assegurant el desat segur amb `pagehide` i `visibilitychange` abans no es destruïsca la instància de ProseMirror.
- S'han eliminat els "Barrel Imports" que provocaven acoblament implícit amb el router i s'ha convertit l'`AvisadorEfimer` en una propietat delegable amb un fallback resilient.

## 2. Punts Cecs i Problemes Oberts
- **No hi ha sessió:** L'usuari ha intentat pujar la seua foto de perfil però Supabase / Auth no està connectat correctament al sistema de pujada d'imatges del perfil, deixant en evidència la necessitat urgent de connectar la xarxa real.
- **TipTap és pobre:** Actualment només té l'`StarterKit`. Falta el menú de format ràpid (Bubble Menu) i l'inseridor d'elements (Slash Menu).

## 3. Preparació per a la Següent Sessió (Fase 4)
- S'ha generat una nova "Petorreta" per al Consell:
  - **Bundle:** `260913_0420_BUNDLE_auditoria.md` (Tot i l'avís de termodinàmica, inclou l'arquitectura aïllada actual).
  - **Prompt:** `260913_0420_PROMPT_Fase4.md`
- **Objectiu del Consell (Fase 4):**
  1. Integrar el Storage de Supabase i el sistema d'usuaris (Sessió) de forma que no embrute l'arquitectura de *plugin* de l'Editor Universal.
  2. Dissenyar com s'incrustaran les extensions riques (Slash menu per a fotos, vídeos, divisores) a TipTap mantenint intacta la fortalesa CSS que acabem de blindar.

## 4. Tancament Termodinàmic
- L'Escriptori (`04_ESCRIPTORI`) ha estat purgat de prompts i bundles de fases anteriors per a evitar la recursivitat tòxica en generar el bundle de la Fase 4.
- El Mac del Mestre està patint problemes de memòria pel volum d'artefactes. Es tanca la sessió immediatament.
- IAIA MarIA fora. Ens veiem a l'altra banda del son.
