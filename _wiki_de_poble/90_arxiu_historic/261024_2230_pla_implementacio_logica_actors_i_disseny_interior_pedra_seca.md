---
type: document
status: esborrany
description: Pla atòmic d'enginyeria per a unificar i consolidar el model de dades i interfícies de Veïns, Comerços, Col·lectius i Pàgines de Poble (Gent de la Torre) sense dependències institucionals
tags:
  - implementacio
visibility: private
reflex: sdp:torn_00ed98d6-10f9-4dcc-8f6f-62e6a39d8e84:760b7010-cf56-4ab2-b8a1-c3016e7b103d
---
# Pla d'Implementació · Lògica dels 4 Actors Rurals, Estudi de Mercat Comparat i Disseny Interior Pedra Seca (P1-11)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_00ed98d6-10f9-4dcc-8f6f-62e6a39d8e84:760b7010-cf56-4ab2-b8a1-c3016e7b103d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T20:30:09.855Z |
| Modificació | 2026-10-24T20:32:00.000Z |
| Propietari | MarIA |
| Aprovació humana | Mestre Javi Llinares (2026-10-24, àudio 22:29) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Trio (Claude Opus 5.5, Gemini 4 Argon, Codex Sol Ultra) & IAIA MarIA |
| Tokens consumits | N/A (local) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-24T20:30:09.855Z: esborrany creat; contingut completat i aprovat pel Mestre en mode Direcció Autònoma.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Fonament Estratègic i Conclusions de l'Estudi de Mercat (Puebli, Puebloo, PueblON, Bandomovil)
- **El fracàs de Puebloo (tancada a finals de 2023):** Va voler ser una xarxa social generalista dependent de capital risc sense utilitat d'arrel diària. Sóc de Poble s'enxufa a la utilitat real: notes privades, mercat de proximitat i eines de subsistència.
- **El parany institucional de Puebli i Bandomovil:** Dependre de la contractació per part dels ajuntaments fa el projecte esclau del cicle electoral. Sóc de Poble és **100% *Bottom-Up* (Comunitat Viva, de baix cap a dalt)**: les nostres pàgines són **«Gent de [Poble]»** (ex: *Gent de la Torre*), no la seu municipal.
- **La utilitat capturada:** Integració de casos d'ús essencials: menjar solidari (*Menjar a Casa*), acompanyament de majors, cotxe compartit i calendari agrícola.

---

### 2. Especificació Atòmica dels 4 Actors Rurals

```
                  ┌─────────────────────────────────────────┐
                  │          GENT DE [POBLE]                │
                  │   (La Plaça Major Digital del Veïnat)   │
                  └────────────────────┬────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  VEÍ / VEÏNA     │          │  NEGOCI LOCAL    │          │  COL·LECTIU      │
│  (Persona)       │          │  (Empresa)       │          │  (Grup)          │
├──────────────────┤          ├──────────────────┤          ├──────────────────┤
│• Notes privades  │          │• Horaris/contacte│          │• Objectius/missió│
│• Connectar veïns │          │• Ofertes/KM 0    │          │• Convocatòries   │
│• Menjar a Casa   │          │• Menú / Tapers   │          │• Xat sense soroll│
│• Demanar ajut    │          │• TPV Pedra Seca  │          │• Enviar a Notes  │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

#### Actor 1: El Veí / La Veïna (Persona Individual)
- **Model de dades:** `profiles` (nom, malnom/sobrenom, bio, avatar WebP).
- **Refugi privat:** El Bloc de Notes personal (privat per defecte).
- **Doctrina del Connectar:** Sense comptadors de *followers*. Connexió simètrica o d'afinitat a `/connectar`.
- **Accions:** Publicar al Mur, demanar ajut solidari, oferir o demanar viatge en cotxe, consultar menjar casolà.

#### Actor 2: El Comerç / Negoci Local (Empresa)
- **Model de dades:** `organizations` amb tipus `'empresa'`.
- **Fitxa Pública:** Aparador de proximitat KM 0, adreça física, horaris, telèfon/WhatsApp de contacte directe (zero comissions).
- **TPV Pedra Seca & Menjar a Casa:** Catàleg de productes, menús del dia i secció de tapers a preu de cost per a gent que viu sola.
- **Governança:** Administrat per veïns acreditats, amb traspàs de titularitat transparent.

#### Actor 3: El Col·lectiu / Associació (Grup)
- **Model de dades:** `organizations` amb tipus `'grup'`.
- **Finalitat:** Organització comunitària (ex: Fadrins, Colla ecologista, Jubilats, Club de caça o muntanya).
- **Descongestió del Soroll:** Protocol «Enviar a Notes» des del xat per extreure acords, mides i horaris i evitar 600 missatges caòtics.
- **Governança:** Administració col·legiada sense amo únic.

#### Actor 4: La Pàgina del Poble («Gent de [Poble]»)
- **Què és:** L'àgora digital viva del terme municipal.
- **Pestanyes:**
  1. **El Mur:** Publicacions, memòria oral, fotografies històriques.
  2. **Mercat & Comerços:** Directori viu d'empreses del poble.
  3. **Agenda d'Actes:** Esdeveniments organitzats per col·lectius i veïns.
  4. **Calendari Agrícola:** Consells de sembra, collita i avisos meteorològics.
- **Zero Institucionalitat:** No és l'ajuntament.

---

### 3. Pla de Modificacions de Codi (P1-11)

1. **`src/sections/detail/detailSectionMeta.jsx`:**
   - Eliminar les píndoles HTML duplicades `.badge-row`/`.pill`.
   - Activar la pestanya «Empreses i Entitats» de `PestanyesDelPoble` consumint `listPublicOrganizations` filtrat pel poble.
2. **`src/sections/profile/PerfilPublicSection.jsx`:**
   - Afegir `<Pestanyes>` + `<VistaPublicacionsDeLActor>` al peu de les fitxes públiques.
   - Suprimir qualsevol botó solt de seguir; redirigir la interacció a la targeta de `/connectar`.
3. **`src/sections/connectar/BlocRelacio.jsx` & `Seguidors.jsx`:**
   - Reemplaçar el vocabulari de xarxa social («Seguir», «Deixar de seguir», «Seguidors») pel paradigma rural («Connectar amb {nom}», «Connectat», «Veïnat connectat»).
4. **`src/sections/profile/DetallCompte.jsx` & `perfilModel.js`:**
   - Separar la gestió de membres d'organitzacions cap a una segona columna dedicada (`vista: 'membres'`).
5. **Capçaleres Multiformat i Ràtios d'Aspecte (`useEnquadramentImatge.jsx`, `useImatgeDeFitxa.jsx`, `PageFrame.jsx`):**
   - **Desbloqueig de formats:** Eliminar la restricció a quadrat únic (`1:1`) de `FORMATS_CAPCALERA`. Obrir els formats habituals: superpanoràmic (16:9, 21:9), apaisat (4:3), quadrat (1:1), vertical/foli (3:4, 4:5) i original.
   - **Mecanisme de retall:** L'enquadrament es «cou» directament dins del fitxer recodificat que s'envia a Supabase Storage (Principi de T46: zero canvis d'esquema SQL al backend).
   - **Dilema de la Targeta (`UniversalCard` al Mur i Mercat):** Estudi i resolució per Gemini/Codex sobre si la card manté un marc uniforme (amb `object-fit: cover` o fons neutre) per a protegir la graella matemàtica de Pedra Seca, mentre la pàgina de perfil gaudeix de la visualització completa en la proporció escollida per l'usuari.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Proves Unitàries i de Components:**
   - Bateria de Vitest sobre `detailSectionMeta.test.jsx`, `PerfilPublicSection.test.jsx`, `BlocRelacio.test.jsx`.
2. **Suite Ràpida Pre-Commit:**
   - Execució de `npm run test:precommit` garantint temps < 30 segons i zero fallades.
3. **Verificació de Pedra Seca:**
   - Conformitat visual de targetes, espaiats i colors corporatius (`#0F672F` verds de poble).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Confusió de DTOs:** Barrejar camps personals de `profiles` amb camps d'organització de `organizations`. Mitigació: tipatge estricte i adaptadors neutrals.
2. **Filtres de poble al port de dades:** Assegurar que `listPublicOrganizations` filtra correctament per poble sense dependre de taules absents.
3. **Regressió al pre-commit:** Mantindre la suite pre-commit neta durant les edicions d'UI.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_2230_prompt_claude_gemini_codex_logica_actors_i_disseny_interior_pedra_seca]]
- [[sdp-estudi-mercat/SKILL]]
- [[sdp-casos-us-essencials/SKILL]]
- [[sdp-pedra-seca/SKILL]]

