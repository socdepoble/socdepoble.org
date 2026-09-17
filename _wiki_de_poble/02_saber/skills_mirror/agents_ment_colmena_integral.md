---
name: ment-colmena-integral
description: Protocol d'interacció a 4 bandes (Mestre, MarIA, Claude, Codex) per a delegació de tasques complexes sense trencar l'arquitectura.
version: 1.0.0
status: canonic
lang: ca
triggers_on:
  - ment colmena integral
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/ment-colmena-integral/SKILL.md -->

# Ment Colmena Integral (Reunió a 4)

Aquesta skill defineix el procediment oficial per a col·laborar amb IAs de frontera (Claude 3.5 Sonnet i OpenAI o1/Codex) mantenint la integritat del projecte Sóc de Poble.

## 1. Els Rols i l'Entorn Nadiu del Consell

> **NOTA D'ENTORN:** Tot el treball amb el Consell es realitza a través d'**aplicacions natives d'escriptori per a Mac** (ex. Claude App) vinculades directament al projecte `socdepoble.org`, mai en pestanyes de navegador web. Aquestes aplicacions funcionen com a autèntics creadors de codi (IDE) amb capacitats d'agent local i permisos de lectura. La IAIA MarIA ha de recordar sempre aquest context.

- **Mestre (Humà):** Pren les decisions estratègiques i aprova els dissenys. Administra els permisos de carpeta (lectura) en l'app nativa i transfereix els Bundles (com a ZIP o text) a les IAs externes i retorna les solucions a MarIA.
- **IAIA MarIA (Agent Local):** Executora única. Genera el context (Bundles/Petorretas), audita el codi retornat per les IAs externes usant els Tractors, i ho implementa de forma segura al disc.
- **Claude (Mestre d'Obra / Disseny):** Expert en UI/UX, CSS (Salfumà) i l'arquitectura visual Pedra Seca. Se li assignen tasques com extrapolar sistemes de disseny (ex: Apple) per blindar visualment Sóc de Poble.
- **Codex / OpenAI o1 (Arquitecte Lògic):** Especialista en estructures de dades, backend (Supabase), algoritmes i lògica pura (ex: blocs de notes universals, CRDTs, bases de dades).

## 2. El Protocol d'Aïllament (Air-Gap) i el Mode Cowork

L'aïllament (que les IAs externes no tinguin connexió directa via MCP per escriure al disc) és una mesura de seguretat INTENCIONAL per evitar l'amnèsia cognitiva i la destrucció del codi. Tot codi d'una IA externa ha de passar per l'embut de MarIA i els Tractors (`npm run gate`) abans de ser guardat.

> **ATENCIÓ AMB EL MODE "COWORK" DE CLAUDE:** Si a l'app nativa s'activa el mode "Cowork" i s'agrega la carpeta de treball, Claude actua com un agent amb permisos d'escriptura i no s'atura fins acabar. Això **trenca el protocol d'aïllament**. Si s'utilitza Cowork, els canvis aniran directes al disc eludint la supervisió de MarIA. Per defecte (i per a auditories segures), s'ha d'utilitzar el mode "Chat" amb permisos "Només tu" (de lectura/coneixement) o aportant el ZIP.

## 3. Com invocar la Ment Colmena

Quan l'usuari vulga delegar una tasca al Consell, la IAIA MarIA ha de:
1. Identificar si el repte és de Disseny (Claude) o de Lògica (Codex).
2. Generar el Bundle rellevant usant `node tooling/brain/crear_bundle.mjs`.
3. Redactar el PROMPT específic on s'imposen les restriccions arquitectòniques pertinents.
4. Pausar l'execució i esperar que l'usuari aporte la resposta del Consell.
5. Aplicar la solució executant SEMPRE les portes de validació.
