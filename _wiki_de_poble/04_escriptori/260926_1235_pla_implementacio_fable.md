---
type: document
status: esborrany
description: Pla de la Sessió per a Fable Medio
tags:
  - implementacio
visibility: private
reflex: sdp:torn_72024433-78cb-475a-8ba5-a10b6360c6e4:ded86420-faf6-4bb1-b49d-da7b29904c2a
---
# Pla per Identitat Dual i UI WhatsApp

**Estat del Pla:** [en elaboració]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_72024433-78cb-475a-8ba5-a10b6360c6e4:ded86420-faf6-4bb1-b49d-da7b29904c2a |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T10:33:21.000Z |
| Modificació | 2026-09-26T10:33:21.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Fable Máximo (Claude) |
| Tokens consumits | no mesurats per la IAIA MarIA; els de l'auditoria de Fable consten al seu Registre |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-26T10:33:21.000Z: esborrany creat; contingut i verificació pendents.
2026-09-26T12:30Z (aproximat): Fable omple la fila «Tokens consumits» del Registre perquè la porta Reflex exigix el Registre complet per a poder escriure, i afig la seua aportació a «Canvis proposats» i «Verificació». Cap altra línia de la IAIA s'ha tocat.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Aquesta sessió té l'objectiu que l'auditor IA **Fable Máximo** ens aporte solucions per implementar la lògica d'Inici de Sessió i la UI del Xat, i un redisseny de la interfície del graf interactiu.
- Es definirà la lògica per darrere del registre (Identitat Dual, Supabase, `IdentitatContext`). A més a més, ha d'incloure dues funcionalitats crítiques per defecte: l'exportació completa de dades d'usuari i la baixa definitiva amb esborrat. L'esborrat ha de contemplar una política de quarantena o "soft delete" si la llei ho requereix per seguretat, però permetent que l'usuari puga reutilitzar el seu correu. Tota la lògica ha d'estar pensada per a un ecosistema de **xarxa social hipermodular (fedivers)**. (Nota important: Ja existeixen a la base de dades taules per a aquest propòsit com `connections`, `realms` i `user_realms`, no cal inventar res des de zero, cal utilitzar-les).
- **Integració al Workspace existent:** Tota la gestió d'usuari (backend per a l'usuari final) s'ha d'integrar directament en l'AppGridShell / UniversalWorkspace que ja existeix, adaptant les carpetes i menús existents (ex: Notes Personals, Grups, Etiquetes) i afegint una secció d'utilitats (per a Gestoria, Llibreria, etc.). L'objectiu és no crear un "backend" separat.
- **Editor Universal (Perfil):** El perfil d'usuari s'ha d'editar reutilitzant l'Editor Universal actual (la `Card` i Tiptap). Es requereix a més una **millora visual estructural**: moure la barra blava d'accions a la part superior (davall de la barra negra) i moure la barra d'eines de text davall de l'entradilla fent que tinga comportament **sticky** (que s'ancore a dalt en fer scroll).
- Es dissenyarà una interfície clònica a WhatsApp (pensant en el context de món rural), utilitzant les eines React/CSS de l'esquema actual.
- Es redissenyarà `ExploradorMapa.jsx` i `BrainGraph.jsx` per tal de moure tots els controls i filtres a la part superior, eliminar la llegenda redundant i inventar un panell de detalls de nodes més usable. El graf ha de quedar a la part inferior.

### Aportació de Fable (auditoria [[260926_1330_auditoria_claude]], versió 1.1.1)

**Ordre de fases proposat.** F1 identitat (onboarding, selector d'identitat, `author_org_id` al DTO, migració curta de grants i cascades, perfil sobre DocumentEditor) → F2 federació, només després del bolcat de l'esquema viu → F3 xat sobre la graella de tres columnes → F4 explorador. Fitxers, proves i portes de cada fase a §6 de l'auditoria; codi a §1.6, §2.1, §3.6 i §4.5.

**El que canvia respecte del que este Pla dona per fet:**
- El servidor ja sap publicar com a organització: `section_submissions.author_org_id`, la política d'inserció, `pot_signar_com_organitzacio` i el trigger que escriu el nom de l'autor existixen (I2). El client no envia mai l'organització: és una columna al DTO, cap migració.
- Cap fitxer del repositori crea `connections`, `realms`, `user_realms` ni `posts` (I11): s'han llegit senceres les 18 migracions i la llavor. Si existixen al Supabase viu, cal bolcar-les al repositori abans de qualsevol codi de federació (D9). Mentrestant, el que sí que hi ha: `towns` (realm dins d'una instància) i `town_memberships` (pertinença de persones a pobles).
- Tres forats de servidor que la interfície no pot tapar: `organizations.logo_url` sense grants i absent de `list_my_organizations` (I12); `author_org_id` amb `on delete cascade` que esborra publicacions en esborrar l'organització (I13); l'alta amb Google d'una persona nova pot fallar al trigger que exigix `tenant_id` (I14, a provar en staging).
- Xat: Realtime desactivat a propòsit a la migració de correccions (bloc comentat), topall dur de 50 missatges sense paginació, padró que amaga qui no ha consentit, i menús fantasma (X1-X9). El clon de WhatsApp és la graella amb la columna esquerra plegada com a rail d'icones; codi complet a §3.6, amb el nom accessible «Nova conversa» que `App.test.jsx` espera.
- Explorador: el panell «fatal» és l'inspector de `BrainGraph`, compartit amb la Wiki. Props noves amb valors per defecte intactes (Llei del Píxel) i quadre de comandament dalt; el CSS conserva byte a byte les nou regles de color que `grafMapa.test.js` compara (E1-E4, §4.5).
- Exportació de dades i baixa amb quarantena (afegit en este Pla): l'esquema no té `deleted_at`, ni RPC d'exportació, ni de baixa; esborrar `auth.users` arrossega en cascada el perfil, les pertinences, els missatges propis i les converses que la persona va crear, i deixa orfes publicacions i notes. Disseny en dos passos amb anonimització i tasca programada a I15; decisió D12.
- Barra blava dalt i eines de text ancorades davall de l'entradilla: `UniversalEditorShell` amb `posicioEines` per defecte intacte (I16); decisió D13.

**Directives del Mestre rebudes pel xat** (federació hipermodular, reutilitzar les taules existents, perfil amb l'Editor Universal): recollides a §0 de l'auditoria perquè Codex les veja.

**Res es toca fins que el Mestre tanque D1-D13** (§7 de l'auditoria) i s'òbriga un torn `code`: el torn actual és de documents i porta un rebut fantasma que impedix tancar-lo (§8).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- **L'auditor haurà d'entregar:** l'informe d'auditoria resolutiu.
- Aquest pla està en fase d'elaboració i rebrà les notes de l'auditoria a posteriori.
- Auditoria de Fable entregada: [[260926_1330_auditoria_claude]] (versió 1.1.1, `document.mjs check` pendent d'executar per qui tinga lease). Abans de la F1: `npx vitest run src/sections/profile src/sections/onboarding src/data/supabase`, `npm run porta:enxufe`, `npm run porta:rls`; abans de la F2: bolcat de l'esquema viu al repositori; abans de la F3: `npx vitest run src/sections/xat src/app` i navegador a 3340 en ample, mitjà i estret; abans de la F4: `npx vitest run src/components/universal/graph src/sections/consola` i la Wiki idèntica píxel a píxel.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Conflicte amb variables i tokens de Pedra Seca.
- Riscos d'acoblament i Vendor Lock-in (Supabase / React).
- Càrrega innecessària d'estat als contexts globals.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
