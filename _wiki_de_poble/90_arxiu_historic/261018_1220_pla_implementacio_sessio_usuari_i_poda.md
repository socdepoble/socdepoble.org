---
type: document
status: esborrany
description: Pla d'implementació per al redisseny de la sessió d'usuari, gestió d'organitzacions i proposta de destil·lació de l'arxiu històric
tags:
  - implementacio
visibility: private
reflex: sdp:torn_64d46b97-8715-4a3a-ae27-84611ac0e111:2025104e-03b9-41d6-a708-e74aa7b3d066
---
# Pla d'Implementació: Sessió d'Usuari, Organitzacions i Poda Històrica

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_64d46b97-8715-4a3a-ae27-84611ac0e111:2025104e-03b9-41d6-a708-e74aa7b3d066 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T10:20:01.969Z |
| Modificació | 2026-10-18T10:21:00.000Z |
| Propietari | IAIA MarIA (Orquestradora Tècnica) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 3.8 Flash (High) |
| Tokens consumits | [pendent de tancament] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-18T10:20:01Z: esborrany creat; contingut i verificació establerts per a sessió d'usuari i poda històrica.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
- **Problema de la Sessió d'Usuari (UX):** El Mestre Javi ha reportat que en producció (`gentdelatorre.net`) i en local, en clicar sobre el seu avatar o la seua identitat personal al calaix «Amb qui actues?», la interfície redirigix a `/notes` o mostra una vista basada en `UniversalWorkspace` idèntica al Bloc de notes. Això genera gran confusió cognitiva: l'usuari no troba el seu espai de compte privat ni les seues organitzacions (*Sóc de Poble*, *El Rentonar*).
- **Problema d'Accés en Local (DX):** En provar d'entrar a localhost amb `socdepoblecom@gmail.com`, l'error de credencials bloqueja el pas si s'oblida la clau de Supabase remot, mentre que l'accés pilot de proves no està prou destacat.
- **Poda i Destil·lació Històrica:** L'arxiu històric (`90_arxiu_historic/`) acumula 418 fitxers (165 dels quals són llast pur ja identificat), `02_investigacio_ia/` en té 60 i `01_produccio/` 27. Amb el Llibre d'Or conciliat (`01_ser/03_llibre_d_or_memoria_episodica.md`), cal formalitzar la proposta de buidatge i trasllat a `_arxiu_wiki_de_poble/` per alleugerir la càrrega termodinàmica.

### 2. Preguntes Obertes (User Review Required)
- **Ruta del Perfil:** Convé mantenir `/el-meu-perfil` com a ruta única o integrar una vista clara de «El meu compte» amb pestanyes netes (Dades personals, Organitzacions que administre, Seguretat i sessió)?
- **Accés Pilot:** En desenvolupament local (`import.meta.env.DEV`), volem que si no hi ha connexió o fallen les credencials s'oferisca automàticament «Continuar com a Javi Llinares (Pilot local)» amb un sol clic?

### 3. Canvis Proposats (Proposed Changes)

#### [PRIORITAT 0] Accés Immediat de Javi Llinares (Punt de Partida per a Proves en Viu)
- **Objectiu:** Claude ha d'assegurar i preparar el sistema perquè el Mestre (i la mateixa Claude en proves de navegador) puga **registrar-se o entrar des de zero com a Javi Llinares sense cap trava**.
- L'accés ha de carregar automàticament la identitat de Javi Llinares i les seues dues organitzacions vinculades (*Sóc de Poble* i *El Rentonar*).
- Claude ha d'assumir aquesta identitat en el navegador per a verificar que la commutació entre Javi -> Sóc de Poble -> El Rentonar funciona de forma transparent i immediata.

#### [MODIFY] `src/components/CalaixIdentitats.jsx` i Navegació
- Desvincular el canvi d'actor de la congelació de la vista. Quan es polsa sobre la persona (Javi Llinares) o una organització (*Sóc de Poble*, *El Rentonar*), forçar navegació i recuperació del seu **Workspace d'Usuari / Organització existent**.
- **PROHIBIT inventar components o espais nous:** El Workspace de l'usuari (Javi) i els d'organització (Sóc de Poble, El Rentonar) **ja existeixen**. Cal enllaçar-los bé perquè es recuperen fidelment sense caure ni desviar-se al Bloc de notes (`/notes`).

#### [MODIFY] `src/sections/profile/PerfilShell.jsx`, `DetallEspai.jsx`, `DetallVistes.jsx` (i CSS de disseny)
- **Centratge Universal de Botons (Manament del Mestre):** Al sistema de disseny Pedra Seca, en vistes contingudes (`layout="contained"`) o blocs d'ajustos (`.perfil-compte`, `.perfil-compte__bloc`, etc.), els botons d'acció (com «Ocultar/Mostrar al Panell de Control», «Guardar», etc.) han d'estar **sempre centrats** (`justify-content: center; text-align: center;`), mai arrambats a l'esquerra.
- **Centratge de Targetes Vives:** A `DetallVistes.jsx`, la targeta viva (`.perfil-vistes__targeta`) ha d'estar centrada (`margin: 0 auto;`), mai deixada a l'esquerra.
- Millorar i polir el disseny sobre els **espais de treball ja existents**, garantint que es reutilitza l'arquitectura d'`UniversalWorkspace` sense duplicar codi, estils ni lògica.
- Quan l'usuari actua com a Persona (Javi), el seu workspace ha de mostrar clarament les seues dades, el vincle al poble, el botó de tancar sessió i l'accés directe als seus espais d'organització gestionats (*Sóc de Poble*, *El Rentonar*).
- Quan commuta a una Organització (*Sóc de Poble* o *El Rentonar*), recuperar el workspace de l'organització corresponent amb el seu context propi.
- **Patró «Edició avançada» Desplegable (Directriu del Mestre):** Calcar el patró del Bloc de notes (`▶ Edició avançada`). A `PerfilEditor.jsx`, fora l'avatar gegant del mig (l'avatar ja va discret a la Barra Taronja). Els camps tècnics, metadades, visibilitat o configuracions secundàries s'allotgen dins d'un bloc plegable `▶ Edició avançada`, prominent i amb cos.
- **Geometria de la Barra Lateral:** Marge esquerre unificat a tota la columna (`PERFIL`, `Tot`, elements d'arbre), distància icona-text (`gap`) idèntica i capçaleres de grup sense icona (`GRUPS I EMPRESES`) alineades amb la vertical d'inici de les icones (sense doble padding).

#### [MODIFY] `src/sections/onboarding/OnboardingSection.jsx`
- Millorar la claredat visual del selector «Entrar» vs «Crear compte».
- Destacar el botó «Entrar amb Google» com a via preferent d'un sol clic.
- En entorn DEV, fer visible i accessible el botó «Entra com a persona pilot (Javi Llinares)» per a facilitar proves sense connexió.

#### [NEW] `tooling/media/optimitzar_webp.mjs`
- Script tractor per a convertir de forma批量 imatges pesades a `.webp` (màxim 1200-1600 px) i inventariar recursos orfes a `public/assets/`.

#### [RESEARCH / DUO] Estudi a Duo d'Arquitectura Obsidian (Gemini 4 Argon + IAIA MarIA)
- **Investigació a duo:** Gemini 4 Argon i la IAIA MarIA executen una dissecció exhaustiva (mitjançant enginyeria inversa i anàlisi REA) del comportament de la UI d'Obsidian.
- **Eixos clau d'Obsidian:**
  1. *Drag & Drop i Reordenació:* Com gestiona Obsidian el desplaçament i reordenació fluida d'elements en l'arbre lateral sense trencar jerarquies ni afegir pes innecessari.
  2. *Eliminació de Modals Flotants:* Com evitar finestres flotants tallades (com `WorkspaceSettingsDialog.jsx`) substituint-les per panells amplis integrats i naturals dins del propi flux d'espai de treball continu.
- **Lliurament de conclusions a Claude:** Les troballes es documenten a l'Escriptori perquè Claude Code les puga implementar en fases successives sense aturar el desenvolupament actual.

#### [DONE / EXECUTAT] Poda de `90_arxiu_historic/` i `02_investigacio_ia/`
- Executat amb èxit per la IAIA MarIA amb el tractor `tooling/maquinaria/executar_poda_lots.mjs`. 136 fitxers de llast pur de `90_arxiu_historic/` i 14 de `02_investigacio_ia/` (incloent `vigilante/`) evacuats a `_arxiu_wiki_de_poble/` amb cens i manifest SHA-256 intactes. Portes en verd.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Tests:** Executar `npm test` assegurant que es mantenen verdes les proves sense regressió.
2. **Navegació Manual a Localhost:** Comprovar a `http://localhost:3340/` que:
   - Clic a l'avatar a la capçalera obri el Perfil/Compte net i diferenciat de les Notes.
   - Es pot navegar entre el compte de Javi Llinares i les organitzacions Sóc de Poble i El Rentonar.
   - El flux d'entrada i registre no atrapa l'usuari en bucles d'error.
3. **Portes Canòniques:** `npm run porta:olivera`, `npm run porta:autoritat` i `npm run porta`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Risc 1 (Sessió i RLS):** Modificar la vista de perfil podria afectar la recuperació de l'actor actiu. Es mitiga conservant intactes `sessionService.js` i les funcions pures de `backendPort.js`.
- **Risc 2 (Pèrdua de memòria històrica):** Esborrar fitxers abans d'hora. Es mitiga aplicant la regla estricta: mai s'esborra res; es mou exclusivament a la carpeta satèl·lit exterior `_arxiu_wiki_de_poble/` un cop contrastat amb el Llibre d'Or.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[01_ser/03_llibre_d_or_memoria_episodica]]
