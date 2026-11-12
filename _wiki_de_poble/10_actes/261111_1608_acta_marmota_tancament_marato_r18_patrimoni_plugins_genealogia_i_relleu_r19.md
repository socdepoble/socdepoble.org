---
type: acta
status: esborrany
description: Tancament de la Marató R18 (nucli verge i 7 connectors desendollables, Arbre Genealògic, biblioteca multipoble d'arbres, làmines botàniques del Node 0 i mapes Pedra Seca) i relleu per a l'auditoria R19.
tags:
  - acta
visibility: private
---
# 261111_1608 · Acta Marmota: Tancament R18 (Patrimoni, Connectors, Genealogia, Làmines Node 0 i Barra Taronja) i Relleu R19

**Nom termodinàmic d'aquesta sessió que es tanca:** `261111_1608_r18_patrimoni_plugins_genealogia_i_barra_taronja`

## 1. Resum Executiu del Tancament `R18` (100% Compilat i Segellat abans de Reiniciar el Mac)

1. **Correcció d'Urgència en Viu a `/page/arbres-monumentals` (`SquareBadge`):**
   - Corregit l'import per defecte trencat a `src/sections/patrimoni/FitxaArbreMonumental.jsx` (`import { SquareBadge } from '../../components/PedraSeca/organismes/SquareBadge.jsx'`), eliminant l'`ErrorBoundary` en carregar la secció d'arbres monumentals.
2. **Llei Innegociable de la Barra Taronja («Només Comptes Registrats a Sóc de Poble»):**
   - **Prohibit inventar usuaris no registrats a la Barra Taronja (`BarraTaronja` / `topBarData`):** S'han corregit `ReceptesWorkspaceSection.jsx`, `ReceptaDetailSection.jsx`, `HerbariWorkspaceSection.jsx`, `BancLlavorsWorkspaceSection.jsx` i la branca sense ruta registrada de `NaturaPatrimoniWorkspaceSection.jsx`. Quan l'obra prové d'una associació o font documental externa que encara no té compte registrat a Sóc de Poble (com l'*Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»* a `/page/receptes`), **qui publica a la Barra Taronja és `Sóc de Poble`** (`/empresa/socdepoble`, amb el seu avatar oficial verd i logotip), mentre que **tota l'autoria intel·lectual i la llicència de l'obra es mantenen íntegres al peu de títol i al bloc de crèdits** (`COPYRIGHT_QUE_DINEM` + `CreditsQueDinem`). Quan l'entitat sí que està registrada al padró fundacional (com **Associació El Rentonar** amb ruta `/rentonar` als 20 ítems del llibre d'arbres de La Torre), manté la seua pròpia Barra Taronja i logotip.
   - **Autoria exclusiva de `Sóc de Poble` a `/page/herbari`:** Eliminat per complet qualsevol projecte etnobotànic extern no registrat a `src/sections/text/pageContent.dretsPatrimoni.js`, `src/sections/patrimoni/HerbariWorkspaceSection.jsx` i comentaris de `src/sections/text/pageContent.js`, i blindat amb prova automàtica en `src/sections/patrimoni/AutoriaDosNivellsArbres.test.jsx`. Tot `/page/herbari` i les seues 117 fitxes les publica exclusivament **Sóc de Poble**.
3. **Arquitectura `R18a` + `R18.2` + `R18-EXTREME` Consolidada:**
   - **Nucli Verge i 7 Connectors Desendollables (`P0-113`):** `gestoria`, `tpv`, `nevera`, `avisador` (`/page/avisador` restituït de forma honesta com a `EN_PROVES`), `biblioteca`, `genealogia` (`/app/genealogia`) i `iaia-sabuda` governats per literals `VITE_SDP_APP_* !== '0'`.
   - **Arbre Genealògic Local i Privat (`P0-110` · `src/apps/genealogia/`):** Graella Pedra Seca d'avantpassats, fitxes familiars i xifratge local sense **cap nom ni cognom personal ni familiar dins del repositori Git ni de `dist/`** (els Llibres de Família romanen intactes a `/Users/javillinares/Documents/10 Família/`).
   - **URLs Canòniques Compartibles i `BarraBlava` en tots els Workspaces (`P0-115` + `P0-117`):** Rutes pròpies `/page/:slug/:itemSlug` (`/page/receptes/que-dinem`, `/page/receptes/conserva-de-tomaca`, `/page/arbres-monumentals/arbre-01-albers-blancs-del-pont`, `/page/herbari/herbari-001-acacia-robinia`) amb botó de compartir a la `BarraBlava` i `useSEO` dinàmic.
   - **67 Làmines Botàniques Fotorrealistes del `Node 0` (`P0-118`):** Generades localment a `0,00 €` amb `Z-Image-Turbo-mflux-4bit` al Mac mini M4 per a **24 espècies** (12 de l'Herbari + 12 del Banc de Llavors) i connectades via `src/data/patrimoni/laminesBotaniquesNode0.js` sense mutar les transcripcions literals dels PDFs.
   - **Mapes Propis Geolocalitzats a Sóc de Poble (`SquareBadge` + `MapaPoble`):** Evacuades fora de `public/` les `20` captures de mapa de 2020 i les `98` captures de l'antic blog WordPress cap a `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/resguard_mapes_arbres_pendents_llicencia/`, usant les coordenades GPS pròpies dels 19 arbres sobre el mapa propi de Sóc de Poble.

## 2. Tasques i Idees del Mestre Encuades per a la Nova Ronda d'Auditoria Multi-IA (`Onada R19` Post-Reinici)

Quan el Mestre reinicie el Mac i òbriga el nou xat amb `Claude`, `Codex`, `Gemini` i les `8 Escoles del Node 0`, el **Pla d'Implementació `R19`** abordarà en paral·lel:

1. **Deute Tècnic Restant, Arbitratge de Commit (`COMMIT R18`) i Sincronització Remota:**
   - **Carril 0 de `R19` (`COMMIT R18` sencer amb hook, com es va fer a `R16b · 0027b698d`):** Els canvis de `R18` romanen 100% desats al disc SSD local i desplegats en viu a Firebase Hosting (`soc-de-poble`, entrada web rebaixada a **`216,4 KB` gzip** i arrencada estàtica del connector WordPress rebaixada a **`1.661.886 B`**, `75,5 KB` per sota del trinquet `1.737.422 B`). En obrir `R19`, tancar el commit unificat aprovant les 9 empremtes de `frontissa-contingut.mjs` (inclosa `dispositius` / `R16-AA4`), netejant les mencions històriques de `tractor-cens.mjs` i certificant les llicències de les imatges noves de patrimoni.
   - **Reanomenat intern d'identificadors JS de l'Herbari:** Tota menció pública a l'antic projecte no registrat ja ha sigut eliminada al 100% de la interfície; en `R19`, reanomenar també els identificadors interns de codi (`zonaCanaleta` → `zonaHerbari`, `zonesCanaleta` → `zonesHerbari`, `localitzacionsCanaleta` → `localitzacionsHerbari` i el nom del fixture intern).
   - Aplicar a Supabase producció la migració pendent `supabase/migrations/2611110455_revisions_editorials_wp.sql` (capacitat `revisionsEditorialsWp` del port neutral `53/53`) quan es tanque la revisió de governança.
2. **Nova Funcionalitat Dissenyada pel Mestre · «Traspàs d'Autoria i Co-Publicació Multi-Entitat a la Barra Taronja»:**
   - **Regla base ja activa:** Cap entitat no registrada pot aparéixer mai com a publicadora a la Barra Taronja (mentre no estiga registrada, publica `Sóc de Poble` i es reconeix l'autoria a crèdits/llicència).
   - **Evolució `R19+` a dissenyar i auditar per totes les IAs:**
     - **Traspàs de propietat/publicació:** Quan una associació real (p. ex. l'*Associació Gastronòmica «Fins rebentar com Sangonereta»* o un ajuntament) es registre oficialment a Sóc de Poble, l'administrador podrà traspassar-li l'autoria de publicació de les seues pàgines/llibres amb un sol clic.
     - **Co-publicació multi-entitat i multi-poble:** Permetre que un mateix article o catàleg tinga **més d'un publicador registrat** (p. ex. `Sóc de Poble` + `Associació El Rentonar`, o una coordinadora comarcal de diversos pobles), mostrant a la Barra Taronja un **avatar compost d'estil grup de xat** i enumerant els publicadors i els seus pobles fins on càpiguen amb netedat responsive.
3. ** Següents Fases de Genealogia (`P0-110`) i Laboratori Botànic del Node 0 (`P0-118`):**
   - Importador/exportador `GEDCOM 5.5.1 / 7.0` local, assistent d'entrevista oral amb veu per a gent gran i deduplicació local assistida dels Llibres de Família del Mestre (sempre 100% fora de Git).
   - Completar la generació local nocturna al Node 0 de les làmines restants de les `117` plantes de l'Herbari i les `125` varietats del Banc de Llavors amb validació botànica doctoral 4x4.
4. **Protocol de Noms Termodinàmics de Sessió (`iaia-maria-core`):**
   - Incorporat ja a `iaia-maria-core/SKILL.md`: en tancar cada xat, MarIA lliura tant el nom termodinàmic del xat que es tanca com l'obertura d'1 línia `Sóc de poble · aammdd_hhmm_rXX_tema` perquè la barra lateral d'Antigravity indexe totes les converses amb ordre cronològic i sentit semàntic.

## Vincles
- [[00_index]]
- [[03_llibre_mestre_tasques_i_idees]]
