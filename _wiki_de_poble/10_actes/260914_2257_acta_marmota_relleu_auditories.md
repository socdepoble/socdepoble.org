---
type: acta
status: historic
description: Relleu termodinàmic per a processar respostes d'auditoria.
tags:
  - escriptori
---
\n# Acta Marmota - Relleu Auditories (14/09/2026)

## Context Actual
Hem arribat a la fi de la capacitat d'aquesta sessió (context saturat amb 151 artefactes i múltiples fitxers d'auditoria). En aquest torn, hem resolt el deute de les **Portes (Gates)**:
1. **Porta Nomenclatura**: S'han suprimit els problemes relacionats amb fitxers en `camelCase` o `PascalCase` a la carpeta `skills_mirror` i s'ha corregit el script de sincronització (`sincronitzar_skills.mjs`). També s'han mogut certs fitxers antics de l'Escriptori.
2. **Porta Llaurador d'Índexs**: S'han enllaçat manualment tots els arxius "orfes", incloent tots els generats al directori de producció, scripts temporals i l'índex per als `skills_mirror`.
3. **Porta Cadena**: S'han traslladat diversos scripts inactius antics (`extract-gemini.mjs`, `tractor-capes.mjs`, etc.) al directori `legacy/` per a que no intervinguen en el cicle d'integració.
4. **Porta Catàleg**: S'han afegit les entrades al catàleg (`registre.js`) per a components que estaven llançant alertes de "Falta de tipificació" com `Avatar`, `GrupAvatars`, `Botonera` i `Taula`.
5. **Porta Reflex**: Totes les modificacions al graf i l'estat actual s'han guardat en un commit atòmic, i posteriorment s'ha executat un `node tooling/wiki/reflex_petorreta.mjs baseline` satisfactori.

## Resolució d'Estils (Botonera UI)
S'ha solucionat el problema indicat sobre l'aparença visual on els botons tocaven amb els títols:
- S'ha afegit a `layout.css` les classes `.sdp-control-actions` (que aporten un `margin-bottom` de `var(--sdp-space-6)` perquè respiren per la part inferior) i la classe `.sdp-btn-ample`. Estes classes s'havien utilitzat però es van ometre del CSS base després de l'eliminació d'estils incrustats (inline styles).

## Instruccions per a la Pròxima Sessió (Punt d'inici)
- **Objectiu:** Rebre, llegir i processar les 151 (o menys) solucions/informes (les **petorretas**) generades pel Consell de models de IA.
- S'han d'ingressar les respostes (potser creant fitxers `260914_..._RESPOSTA_...md` directament a l'escriptori) i fer una "Gran Destil·lació" per veure quins suggeriments sobre Arquitectura, Seguretat (Sollutia) i Visual/React-Day-Picker tenen sentit per aplicar.
- Cal netejar l'escriptori o processar les tasques d'aquí abans d'omplir-lo de nou.
