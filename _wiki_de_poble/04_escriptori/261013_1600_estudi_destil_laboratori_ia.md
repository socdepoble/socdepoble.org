---
type: informe
status: esborrany
description: 'Referència única destil·lada de 02_investigacio_ia: fonts d''avantguarda verificades, lliçons adoptades, hipòtesis pendents i llista de trasllat proposada a l''arxiu.'
tags:
  - consell
visibility: private
reflex: sdp:torn_5589b1ad-cd5a-4a05-819c-4757f693192d:7797675c-0eda-482a-8976-abc01cffbdd0
---
# Destil·lació del laboratori d'investigació IA

Referència única del laboratori `02_investigacio_ia/`: què ja viu al repo, quines fonts externes valen, quines hipòtesis cal provar i què pot anar a l'arxiu, amb la seua precondició. **Ningú ha mogut cap fitxer:** el trasllat és de MarIA o del Mestre (AGENTS §0.1 i §12).

<!-- SDP:SECTION estudi_ia.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5589b1ad-cd5a-4a05-819c-4757f693192d:7797675c-0eda-482a-8976-abc01cffbdd0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T13:39:45.172Z |
| Modificació | 2026-10-13T13:52:00Z |
| Propietari | agent-local |
| Aprovació humana | Encàrrec del pla 261013_1405 (Front G); la llista de trasllat és una proposta i no autoritza cap moviment |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/estudi_consell.md (v2.0.0) |
| Model IA | Claude Opus 5.5 |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION estudi_ia.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/estudi_consell.md; SHA-256 b3a2bcddf787a1540c83040aa9c3b51751ad7798a5fa1c50d09922980554f786. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION estudi_ia.s3 -->
## Historial

2026-10-13T13:39:45.172Z: esborrany creat; contingut i verificació pendents.
2026-10-13T13:42:00Z: llegides la plantilla viva, els mapes dels tres exploradors del laboratori (58 de 58 entrades), l'auditoria de Codex (§1, §2, §2.1, §5, §6 i §7) i el Front G del pla.
2026-10-13T13:47:00Z: verificats al disc els acoblaments de proves, els destins vius i el bloqueig de subcarpetes de la porta Olivera. La web externa la bloqueja el hook: les fonts externes es citen per la verificació de Codex o com a [NO VERIFICAT].
2026-10-13T13:51:07Z: seccions completades; cap fitxer mogut, cap skill ni codi tocat.
2026-10-13T13:52:00Z: `document.mjs check` vàlid, zero errors; hores de l'historial ajustades a l'hora real del disc.

<!-- SDP:SECTION estudi_ia.s4 -->
## Resultats

### Dictamen

- **Inventari:** 58 elements visibles, 36 carpetes i 22 fitxers, més `.DS_Store`. El recompte amb `ls` del 13-10 coincidix amb el de Codex (§5). Els exploradors han cobert les 58 entrades.
- **El laboratori guarda sobretot fonts d'obra ja feta.** 19 entrades poden anar a l'arxiu quan es complisquen precondicions mecàniques; 29 tenen encara una peça de valor que ha d'arribar abans a un destí viu; 10 s'han de conservar.
- **L'or és intern, no extern.** Les fonts externes són poques i mitja dotzena no tenen URL o no s'han pogut verificar. El valor real són contractes i dissenys propis: `sdp.mod.v1`, autointegritat, deduplicació semàntica, torns retirats i canari de portes.
- **Bloqueig de l'eina:** `tooling/gates/porta-olivera.mjs:985-990` rebutja qualsevol nom dins de subcarpetes, també `02_investigacio_ia`. L'índex de l'Escriptori té **326 àncores** al laboratori. Cap entrada es pot arxivar amb `--arxiva --nom`.
- **Bloqueig de proves:** una prova primària de Vitest llig un fitxer del laboratori sense guarda (`src/apps/bar/llavors/laParroquia.test.js:35,198`), i sis proves node de laboratori peten o fallen si el seu paquet desapareix (vegeu e).
- **Conflicte de doctrina:** l'ordre del 13-10 («Deixar `02_investigacio_ia/` net i destil·lat», pla, Front G) contradiu AGENTS §12 («laboratori permanent»), `TRACTOR_COGNITIU.txt:7` i la línia 51 de `260922_0500_informe_idees_noves_skills.md`. Una ordre humana explícita no és una neteja automàtica, i la lletra de §12 aguanta. El text de §12 i del README del laboratori l'ha d'esmenar el Mestre. Proposta: **laboratori de trànsit, el que s'ha destil·lat s'arxiva**.

### a) Referències d'or

Codex va verificar l'existència i el contingut d'estes fonts el **2026-10-13** (auditoria §5). Claude no les ha pogut revisar: el hook bloqueja la web. **Cap llicència està verificada**; abans d'adoptar codi cal llegir la `LICENSE` del commit concret.

#### a.1 Fonts verificades per Codex

| Font | Problema de Sóc de Poble que servix | Dades i xarxa | Decisió |
| --- | --- | --- | --- |
| [Impeccable](https://github.com/pbakaus/impeccable) | Regles deterministes de tipografia, espaiat i composició per estendre `tooling/gates/design_guard.mjs` i `tractor-tokens.mjs` | Separar mesura determinista de crítica LLM; no importar un gust visual aliè a Pedra Seca | **Experimentar:** portar regles com a proves pròpies, sense dependència |
| [Kowalski, skills](https://github.com/emilkowalski/skills) | Temps i corbes del moviment | Doctrina, sense codi | **Adoptat:** `sdp-pedra-seca` §5 i `src/css/tokens.css` |
| [Playwright, snapshots](https://playwright.dev/docs/test-snapshots) | Mecanitzar la Llei del Píxel | Dependència nova: cal aprovació (QUI_SOC §5) | **Descartar la dependència; experimentar la idea** amb Chrome del sistema (c, hipòtesi 12) |
| [Agent Skills](https://github.com/addyosmani/agent-skills) | Comparar el cicle pla, construcció, prova i entrega amb `sdp-workflow` §1-4 | Benchmarks d'un altre corpus | **Experimentar:** comparació, no instal·lació |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | Estalvi de tokens | Les xifres d'un altre model no prometen estalvi local | **Descartar** mentre no hi haja prova local |
| [Graphify](https://github.com/Graphify-Labs/graphify) | Graf de codi per a agents | Documents i imatges poden eixir cap al model configurat | **Descartar la instal·lació:** ho cobrixen `tooling/brain/mapa-consola.mjs` i l'Explorador; només mirar-ne la interfície de consulta |
| [OmniRoute](https://github.com/devolkus/omniroute) | Encaminar prompts entre proveïdors | Context cap a tercers: xoca amb la privacitat de la Gestoria i el Model B | **Descartar** |
| [prompts.chat](https://github.com/f/prompts.chat) | Biblioteca de prompts amb servidor MCP | Un MCP extern és superfície de fuita; els prompts naixen de `.agents/protocolledge.json` | **Descartar:** només fitxa de procedència |
| [Thermos](https://github.com/cursor/plugins/blob/main/thermos/README.md) | Revisió periòdica de la salut del codi | Proposa dues revisions i síntesi; les tres lents de SdP serien adaptació pròpia | **Experimentar:** mesurar falsos positius abans de cap porta bloquejant |
| [GnuCash, guia](https://www.gnucash.org/docs/v5/C/gnucash-guide/basics-accounting1.html) | Invariants de partida doble i tipus de compte; el passiu «impostos a pagar» del 303 i el 130 per a la Cabina | Només doctrina, cap programari | **Adoptar els invariants** |
| [Paperasse](https://github.com/romainsimon/paperasse) | Skills d'agent per a tràmits | Fiscalitat francesa: no es trasllada al Mas | **Referència** per a skills fiscals |
| [Grocy](https://github.com/grocy/grocy) | Model d'inventari i lots per a la Nevera i el Bar | Backend autoallotjat: no passa al Mas | **Referència de domini** |
| [Qwen](https://github.com/QwenLM/Qwen3.8) | IAIA local, privacitat per localitat | Cap benchmark validat | **Experimentar** només amb protocol (c, hipòtesi 11) |

Codex cita a més [ActivityPub](https://www.w3.org/TR/activitypub/) (§4) per al Fedivers. Cap entrada del laboratori l'estudia (c, hipòtesi 17).

#### a.2 Fonts del laboratori sense verificar

Totes **[NO VERIFICAT]**: el hook ha bloquejat WebFetch el 13-10 i Codex no les consigna.

| Font, tal com consta | Entrada d'origen | Ús possible | Decisió |
| --- | --- | --- | --- |
| llama.cpp (`github.com/ggml-org/llama.cpp`), Ollama (`github.com/ollama/ollama`), LM Studio | `261002_1705_sobirania_tecnologica_qwen.md` | Inferència local | Experimentar amb protocol |
| Chroma (`github.com/chroma-core/chroma`), Qdrant (`github.com/qdrant/qdrant`) | Ídem | Memòria vectorial local si el RAG deixa `rag-index.json` | Ajornar |
| FastMCP (`github.com/jlowin/fastmcp`) | Ídem | Servidors MCP locals propis | Ajornar |
| Capacitor 8 (`capacitorjs.com/docs/updating/8-0`) | `261003_1330_empaquetat_mobil_claude/` | Fases 1 i 2 de l'app nativa | Conservar al runbook |
| Odoo, ERPNext, Ever-Gauzy, Idurar, Dolibarr (repositoris de GitHub) | `261012_1915_arquitectura_visual_erp.md` | Patrons d'UX per a la Cabina | Referència: estructura sí, estil només Pedra Seca |
| Claude Academy: planificador de fluxos i catàleg de casos d'ús | `261002_1650_carboni_silici_fluxos.md` i els dos `.webloc` | Convertir fluxos repetits en skills | Referència |
| Kimi, «Financial Modeling Skills for Agents» (sense URL exacta) | `261012_1715_gnucash_arrel.md` | Raonament financer | Verificar abans de citar |
| AyudaWP, 77 comprovacions per a un WordPress infectat (`ayudawp.com/comprobaciones-limpiar-wordpress-infectado/`) | `vigilante/` | Runbook d'incidents i enduriment del connector de WordPress | Destil·lar els patrons; les còpies crues són a `01_produccio/` (zona humana) |
| Vigilant 3.0.4, connector de WordPress (`vigilante/readme.txt:8` declara **GPL v2 o posterior**: evidència local) | `vigilante/` | Doctrina d'autointegritat | Destil·lar; el PHP de tercers no ha de viure a la Wiki |
| WWDC18, «Designing Fluid Interfaces» (sense URL) | `261011_0246_teoria_kowalski_apple_design.md` | Gestos interrompibles | Citar-la a `sdp-pedra-seca` §5 |
| Pace, Awesome Designs, Image to 3D | `261002_1730_eines_disseny_ia.md` | Sense identificar | Descartar |

### b) Lliçons ja adoptades al repo

La còpia del laboratori és redundant: el destí viu mana. Verificació: «disc» vol dir comprovat amb `ls` o `grep` el 13-10; «explorador», afirmat pel mapa d'exploradors sense comprovació pròpia.

| Tècnica o lliçó | Entrada d'origen | Destí viu | Verificació |
| --- | --- | --- | --- |
| Instantànies sense tocar HEAD, l'índex ni la branca | `260924_1410_tractors_claude/` | `tooling/brain/time-machine.mjs` | Disc |
| Frontissa de contingut amb empremta per clau | `260924_1410_tractors_claude/` | `tooling/gates/frontissa-contingut.mjs`, `.agents/contingut_estructural.json` | Disc |
| Porta de taxonomia `aammdd_hhmm_categoria_titol` | `260924_1410_tractors_claude/` | `tooling/gates/porta-taxonomia.mjs`, `tooling/wiki/taxonomia.json` | Disc |
| Mapa `sdp.mapa.v1` | `260924_1410_tractors_claude/`, `260926_1200_infraestructura_fons/` | `tooling/brain/mapa-consola.mjs` | Disc |
| Plantilla viva tancada per defecte, que revisa el text candidat abans del disc | `260924_1505_tractor_plantilles_claude/`, `260924_1815_tractor_plantilla_literal/` | `tooling/gates/porta-plantilla-viva.mjs` | Disc |
| Quatre estats de disponibilitat d'un mòdul | `260924_1706_prototips_codex/` | `src/apps/plataforma/interruptors.js` (`ESTATS_APP`) | Disc |
| Termòmetre de context i hook de fatiga | `261002_1510_tractor_fatiga_claude/` | `tooling/brain/termometre_context.mjs`, `tooling/gates/fatiga-hook.mjs` | Disc; Codex hi confirma coincidència |
| Peus històrics del LEDGER i fonts de vigilància | `260930_0040_governanca_claude/`, `261006_0300_ledger_claude/` | `tooling/brain/fonts-vigilancia.mjs` | Disc; Codex: el paquet Ledger té 7 fitxers coincidents i 9 diferents |
| Hook d'Antigravity amb `force_ask` i briefing de taula | `260930_0400_governanca_claude/`, `261006_0300_ledger_claude/` | `tooling/gates/antigravity-hook.mjs` | Disc |
| Àncores amb camí, `--reapunta`, `--repara`, `--renomena` i convocatòria v4 | `261006_0055_olivera_ancores_opus/`, `261009_0400_higiene_claude/` | `tooling/gates/porta-olivera.mjs` | Disc |
| Cron d'higiene L0, L1 i L2 sense esborrar mai | `261009_0400_higiene_claude/` | `tooling/higiene/cron_higiene.mjs` | Disc; Codex hi confirma coincidència |
| Cada document viu porta motiu darrere de «·» | `261009_0400_higiene_claude/` | Lliçó 261009 de `wiki-documentacio-i-reflex` | Disc |
| Maquetació verificable R1-R22 | `261006_0300_ledger_claude/` | `.agents/skills/core-maquetacio-markdown/SKILL.md` | Disc |
| Frase canònica del Model B | `261006_0300_ledger_claude/` | AGENTS §8 i QUI_SOC §5 | Disc |
| Mapa d'agents d'Emowe | `001 NEXUS/`, `mapa-visual-agentes.zip` | `src/sections/consola/mapa/` (crèdit a `grafMapa.js`) | Disc |
| Regles Impeccable i Kowalski | `261002_1730_eines_disseny_ia.md`, `261004_0045_skills_kowalski_impeccable.md` | `.agents/skills/sdp-pedra-seca/SKILL.md` §4 (l. 52) i §5 (l. 61), `src/css/tokens.css` | Disc |
| Lector RSS sobirà, sense analitzadors de tercers | `261003_1330_lector_rss_claude/` | `src/apps/lector/nucli/` | Disc |
| Sentinelles, part de codi | `261002_1745_sentinelles_claude/` | `src/sections/tractors/sentinelles/` | Disc |
| Enquadrament, EXIF i geolocalització voluntària | `261003_1330_onada4_claude/` | `src/components/universal/enquadrament/` | Disc |
| Fonts locals Noto Sans | `261003_1330_onada4_claude/` | `src/css/tipografia-estreta.css`, `public/fonts/` | Disc |
| PWA, Fase 0 | `261003_1330_empaquetat_mobil_claude/` | `src/pwa/registre.js`, `_wiki_de_poble/02_saber/architecture/ADR-2026-10-APPS-DEL-DISPOSITIU.md` | Disc |
| Cadena Veri*Factu només d'afegir | `261004_0605_nit_claude/` | `src/sections/gestoria/facturacio/registre/` | Disc |
| Recuperació de rutes `lazy()` i cancel·lació cooperativa | `261004_2240_marato_claude/` | `src/app/RouteErrorBoundary.jsx`, `src/apps/plataforma/lazyRoute.js` | Disc |
| Paginació opcional de seccions | `261007_2215_auditoria_claude/` | `_wiki_de_poble/02_saber/architecture/ADR-2026-11-PAGINACIO-SECCIONS.md` | Disc |
| Autocuració C1-C4 | `261011_0230_onada12_claude/` | `src/utils/autocuracio.js` | Disc |
| Logotips PNG rasteritzats al navegador | `261009_1330_logotips_png_claude/` | `public/assets/system/ui/` | Disc |
| Importador de Loyverse | `261003_1330_parroquia_claude/` | `src/apps/bar/nucli/loyverse.js` | Disc |
| Especificacions de producció de l'Onada 3 | `261003_1330_produccio_claude/` | Recuperació de contrasenya, destinacions i vista de mes | Explorador |

#### b.2 Lliçons a mig instal·lar

El **Reflex de Correcció** demana skill i LEDGER alhora. Estes peces són precondició d'arxiu i només les pot escriure **MarIA o el Mestre** amb lease (Claude i Codex no escriuen a `.agents/`):

- **Clonar és copiar l'estructura, no l'estil (261003):** el LEDGER la té (`.agents/LEDGER.md:795`), però `.agents/skills/sdp-pedra-seca/SKILL.md` no té secció «Lliçons del Mestre». **Urgent:** el Front E s'inspira en ERP.
- **Directives d'imatge (261010):** `core-identitat-visual` ja té el text zero; falten el conflicte resolt en gag sense agressió i el rètol escrit lletra a lletra.
- **Gestos interrompibles (WWDC18):** subsecció «Gestos» a `sdp-pedra-seca` §5. L'abast és complementari amb les transicions CSS curtes de la mateixa secció i s'ha d'escriure.
- **Alçar la mà davant d'un flux repetit sense automatitzar:** a `core-automillora`.
- **Dues lliçons del 260924** caigudes de `core-higiene-escriptori` v4: un avís que no fa caure la porta és decisió del torn; una skill nomena l'eina, no la parafraseja.
- **Decisions tancades del Lector:** l'excepció 16:9 només al Lector i cap barra de pestanyes inferior en mòbil, a `sdp-pedra-seca` i `sdp-app-grid-shell`.
- **Canvi de fase avís a bloqueig:** al procediment de `core-higiene-escriptori`. Avui l'expliquen `.agents/olivera-fase.json:2` i `tooling/gates/antigravity-hook.mjs:55` apuntant al laboratori.
- **Procediment de desbloqueig de portes:** a `core-context-panic` o `core-edicio-segura`.
- **Reflex de Correcció dins d'AGENTS.md:** Antigravity no carrega CLAUDE.md (diagnosi de `261006_0300_ledger_claude/`, segons l'explorador).
- **Punters canònics al laboratori o a l'arxiu:** `.agents/skills/core-informes-pdf/SKILL.md:27` apunta a `261012_0040_sistema_informes_claude/`; `.agents/skills/sdp-workflow/SKILL.md` §0 apunta a un document de `90_arxiu_historic/` que AGENTS §5 prohibix llegir en procediments automàtics. Proposta: repuntar el segon a la referència canònica de (a) quan es promoga.

### c) Hipòtesis obertes que val la pena conservar

| # | Hipòtesi | Entrada d'origen | Prova que la validaria | Responsable |
| --- | --- | --- | --- | --- |
| 1 | **Deduplicació semàntica amb decisions que caduquen:** noms repetits, títols semblants (Jaccard ≥0,6), paràgrafs repetits, deriva del cens i documents sense àncora; «mantindre» caduca als 90 dies i «fusionar» o «arxivar» torna a bloquejar als 14 | `260924_1700_tractors_claude/` | Mas sintètic on cada detector troba el seu cas sembrat; en 50 deteccions reals, almenys el 80% són certes; una decisió vençuda torna a avisar | Laboratori nou i lease |
| 2 | **Autosanació d'enllaços a l'estil Obsidian:** sufix de camí més llarg i només cures mecàniques | `260924_1700_tractors_claude/` | Vault sintètic amb fitxers moguts: `LINK_INVALID` de `verificador-scc.mjs .` baixa sense orfes nous; `01_produccio` i `90_arxiu_historic` intactes | Laboratori nou i lease |
| 3 | **Torns retirats** per als ~260 caducats: estat terminal `retired`, nota de qui ho ordena, eixida 1 si és parcial | `260930_0400_governanca_claude/` | Rebasat sobre `tooling/documental/turns.mjs`: un torn caducat passa a `retired` i mai a `closed`; vius i tancats intactes; el Mapa deixa de comptar-lo com a caducat | Lease; la mètrica visible necessita ordre del Mestre |
| 4 | **Porta de GRANTs abans del 30-10-2026** (`.agents/rules/supabase_grants.md`) | `260930_0400_governanca_claude/` | Una migració fixture amb `CREATE TABLE` a `public` sense GRANTs fa fallar `tooling/gates/tractor-rls.mjs`; avui R5 (l. 200-237) només mira GRANT sense política | Lease; **urgent, queden 17 dies** |
| 5 | **Contracte `sdp.mod.v1`:** simula per defecte, aplica només amb el codi del pla, informe JSON únic, abast absent = eixida 2 i mai verd | `261011_0230_onada12_claude/` | Un mod de prova sense abast ix amb 2; amb codi incorrecte no aplica; mai mou amb `fs`, sempre per la porta | Fitxa Wiki i laboratori |
| 6 | **Activació lligada a l'aprovació:** Fase 0 observa, Fase 1 bloqueja només si l'empremta coincidix | `261003_1330_anticipacio_claude/` | Canviar un byte d'una font del tractor el torna a Fase 0 | Laboratori |
| 7 | **Canari de portes:** un defecte sembrat per porta i un control negatiu; cada porta queda viva, verd inert, cega o sorollosa | `261002_1745_skills_claude/` | Cada porta falla amb el seu canari a `os.tmpdir()` i passa amb el control | Laboratori; mecanitza «portes que ixen verd sense comprovar» |
| 8 | **Evidència que caduca:** un resultat de més de tres dies no compta com a verificat i mai es mostra un verd antic com a actual; portes mesurables amb `portes-ultim.json` de menys de 24 h, si no N/A | `vigilante/SECURITY.md`, `261009_0400_consola_claude/` | La Consola mostra N/A quan l'última mesura és vella | Front F posterior i lease |
| 9 | **Validar nom i ruta abans d'emetre el rebut** | `261009_1245_onada7_claude/` | `tests/laboratori-onada7-261009.test.js` verd sobre l'arbre aplicat | Lease amb ordre del Mestre |
| 10 | **Protocol d'avaluació de corpus:** cobertura N de N, contradiccions, riscos d'alt cost i recàlcul en moure la data de tall | `261002_1705_sobirania_tecnologica_qwen.md` (només la metodologia) | Carpeta RAW sintètica, criteri RAW de Codex §6: tots els fitxers vistos, duplicats i dates incongruents marcats, resultat recalculat amb una altra data | Front D |
| 11 | **IAIA local** amb inferència al Mas | `261002_1705_sobirania_tecnologica_qwen.md` | Benchmark amb checkpoint, quantització, context, maquinari i corpus declarats (Codex §5) | Investigació; cap compra ni ADR abans |
| 12 | **Llei del Píxel sense dependències:** Chrome del sistema, 3 amplades per 2 temes, context aïllat | `261003_1330_skills_disseny_claude/` (`sdp-qa-visual`) | Un canvi nul dona zero diferències; base capturada abans del primer canvi | Lease de skills |
| 13 | **Gràfics sense biblioteques:** una pregunta per gràfic, agregació pura, estats buit, zero i error | `261003_1330_skills_disseny_claude/` (`sdp-grafics-dades`) | Proves de la Cabina amb dades buides i tot a zero | El Front E ja la pot seguir |
| 14 | **Bucle d'ingesta RSS a proposta de skill**, amb aprovació humana de cada proposta | `261012_1825_workflow_rss_skills.md` | Una font fixture genera propostes i cap edició automàtica de skills; reutilitza `src/apps/lector/nucli/` | Fase 0 de `wiki-busca-skills` |
| 15 | **Tríada de salut del codi:** duplicació, hipertròfia i rendiment | `261012_1815_skills_antislop_thermos.md` | Mesurar falsos positius sobre un mes de commits abans de bloquejar | Experimental |
| 16 | **Entrades i eixides declarades a cada skill** | `001 NEXUS/` | El Mapa deriva fluxos de declaracions i no de prosa | Lliçó per a les skills |
| 17 | **Fedivers:** projectar el Mur públic com a actor federat | Cap; ActivityPub la cita Codex §4 | Un estudi de federació servidor a servidor, separat del backend amfitrió | Pendent d'obrir |
| 18 | **Arquitectura sense promoure:** ADR multimèdia, contracte `SDP_AUTH_REQUEST`, política de Redirect URLs de GoTrue, trucades WebRTC (D17) i cablejat de la Frontissa (D10) | `261003_1330_onada4_claude/`, `261004_0605_nit_claude/`, `261006_0300_ledger_claude/`, `261012_1315_auditoria_claude/` | Cada peça com a ADR a `02_saber/architecture/` amb la seua prova de conformitat | MarIA o el Mestre |

### d) Correcció de la nota de mercat

La nota `261011_0310_auditoria_mercat_puebli_bandomovil.md` generalitza sobre la competència. Codex la contradiu amb fonts públiques consultades el 2026-10-13 (§5):

- **Puebli** no es reduïx a bàndols, notícies i incidències. La seua [pàgina pública](https://www.puebli.es/descubre-la-app) mostra mercat, habitatge, feina, esdeveniments i cotxe compartit, i els seus [termes](https://www.puebli.es/terms-of-service) preveuen visitants d'informació pública. L'afirmació que no es veu res sense pagament ni registre no se sosté.
- **Bandomovil** ([web](https://www.bandomovil.com/)) presenta participació, propostes i consultes: no és només comunicació d'un sentit.
- **Puebloo** no s'ha verificat prou.
- Estes fonts no acrediten l'experiència privada, els preus ni les prestacions internes de cap competidor.

**Què es conserva:** requisits propis de Sóc de Poble, sense inventar mancances alienes.

- **Lectura pública sense registre.**
- **Comunicació horitzontal** de veí a veí.
- **Publicació densa com a targeta interactiva** dins del Mur (enquestes, llistes) amb `UniversalCard`.

**Destí:** un document de `sdp-estudi-mercat` (seccions A-E) a `02_saber`, amb la data de consulta de cada font.

### e) Llista de trasllat proposada

Proposta per a **MarIA o el Mestre**. Regla de Codex (§5), que esta llista seguix: **cobertura útil al producte, cap import del laboratori, manifest amb hashes i decisió, arxiu reversible amb àncores actualitzades per l'orquestradora.**

#### e.1 Per què la porta no servix i com fer-ho

`node tooling/gates/porta-olivera.mjs --arxiva --nom NOM` només admet documents solts del primer nivell (`porta-olivera.mjs:985-990`). Tota entrada del laboratori, fitxer o carpeta, viu en una subcarpeta. Procediment proposat:

1. **Observar:** `node tooling/gates/porta-olivera.mjs`.
2. **Manifest:** per a cada entrada que complisca la precondició, camí relatiu, mida i SHA-256 de cada fitxer a `_wiki_de_poble/90_arxiu_historic/261013_Laboratori_IA/MANIFEST.json` (o la sessió que trie MarIA).
3. **Moure de manera reversible:** `git mv "_wiki_de_poble/04_escriptori/02_investigacio_ia/ENTRADA" "_wiki_de_poble/90_arxiu_historic/261013_Laboratori_IA/ENTRADA"`. Desfer és el `git mv` invers i comparar hashes.
4. **Àncores:** `node tooling/gates/porta-olivera.mjs --repara --sec`, i després sense `--sec`. La cerca troba per nom els fitxers solts arxivats un nivell davall de `90_arxiu_historic/` (`porta-olivera.mjs:341-365`). Els fitxers de dins d'una carpeta queden més fons: la cerca no hi baixa i la seua àncora es retiraria com a «sense destí». Per a les carpetes, MarIA lleva les àncores amb l'eina d'edició (el hook d'Antigravity demana confirmació per a les escriptures de shell a l'índex) i deixa una línia per carpeta a «## Arxivat amb la Porta Olivera», amb el camí del manifest en `codi`, no com a enllaç.
5. **Verificar:** `node tooling/gates/porta-olivera.mjs` ix amb 0; `node tooling/gates/verificador-scc.mjs .` (amb el punt; sense, dona orfes falsos); les proves de la taula e.2 passen o salten.
6. **Informar** el Mestre en una línia i anotar-ho a ESTAT i al LEDGER.

#### e.2 Acoblaments de proves verificats al disc el 13-10

| Prova | Entrada | Efecte si l'entrada desapareix |
| --- | --- | --- |
| `src/apps/bar/llavors/laParroquia.test.js:35,198` (Vitest primària) | `261003_1330_parroquia_claude/` | Llig `MAPA_IMATGES.txt` sense guarda: **la suite principal es posa roja** |
| `tests/tractor-sinapsis.test.mjs:9`, `tests/tractor-autosanacio.test.mjs:9` | `260924_1700_tractors_claude/` | L'alternativa de `tooling/wiki/` no existix: peten en importar |
| `tests/porta-olivera-v2.test.mjs:15` | `260924_1700_tractors_claude/` | Carrega la porta instal·lada, que ja no exporta `rancisDeSessio`, `caselles` ni `segellDeSessio`: fallen |
| `tests/petorreta-generador.test.mjs:21`, `tests/porta-receptor.test.mjs:18-21` | `260927_1310_reflex_maria/` | Sense alternativa instal·lada: peten en importar |
| `tests/plantilla-viva-installacio.test.mjs:51,90,94` | `260924_1815_tractor_plantilla_literal/` | Llig els pegats sense guarda; només la l. 251 en té |
| `tests/olivera-arxiva-261002.test.mjs:69,141` | `261009_1245_onada7_claude/` | Exigix el laboratori o la seua transacció: falla expressament |
| `tests/lint-torn-261002.test.mjs:20` | `261002_1745_olivera_arxiva_claude/` | Tolera fitxers absents (l. 307-323, només diagnòstic): no bloqueja |
| Corredors amb `skipIf` o guarda: `governanca-260930-*`, `governanca-260930b-*`, `fatiga-261002`, `anticipacio-261003`, `laboratori-*-261006`, `laboratori-*-261009`, `src/sections/consola/laboratori261009.test.js`, `olivera-arxiva-261002` (l. 85 i 247) | Diverses | Salten soles; els seus LLEGIU demanen retirar-les en el mateix commit |

**Política de la suite:** `tooling/tests/node-suite-manifest.json:8` diu que «cap prova ni asserció es retira». Retirar o reescriure qualsevol prova d'esta taula és **decisió del Mestre**.

#### e.3 Decisió per entrada

**Conservar** = es queda al laboratori. **Destil·lar i arxivar** = primer el valor a un destí viu, després el trasllat. **Arxivar** = trasllat quan es complisca la precondició.

| # | Entrada | Proposta | Precondició abans de moure |
| --- | --- | --- | --- |
| 1 | `260922_0500_informe_idees_noves_skills.md` | Destil·lar i arxivar | Valor recollit a (a); la nota de la l. 51 cau amb l'esmena de §12 |
| 2 | `260924_0200_skill_core_higiene_escriptori.txt` | Arxivar | Substituït per `core-higiene-escriptori` v4; opcional, recuperar dues lliçons (b.2) |
| 3 | `261002_0150_investigacio_plugins_claude.md` | Destil·lar i arxivar | Duplicat de l'1; llevar-lo de «Recursos de Producció en curs» de l'índex |
| 4 | `261002_1650_carboni_silici_fluxos.md` | Destil·lar i arxivar | Lliçó a `core-automillora` (b.2) |
| 5 | `261002_1655_tractor_fluxos.md` | Arxivar | Skill mai instal·lada, redundant amb `core-automillora` i `core-context-panic` |
| 6 | `261002_1705_sobirania_tecnologica_qwen.md` | Destil·lar i arxivar | Conclusions no validades (Codex); només eines i metodologia, a (a.2) i (c) |
| 7 | `261002_1730_eines_disseny_ia.md` | Destil·lar i arxivar | Ja absorbit a `sdp-pedra-seca` §4-5 |
| 8 | `261003_1330_llicons_claude.txt` | Destil·lar i arxivar | Lliçó del clon instal·lada a `sdp-pedra-seca` (b.2) |
| 9 | `261004_0045_mcp_prompts_chat.md` | Arxivar | Cap; fitxa a (a) |
| 10 | `261004_0045_skills_kowalski_impeccable.md` | Destil·lar i arxivar | Ja absorbit; seguiment de regles detectores a (a) |
| 11 | `261010_2200_tractor_ortografia_valenciana.md` | Destil·lar i arxivar | Retenció viva del Mestre (índex, l. 48); completar `core-identitat-visual` (b.2) |
| 12 | `261011_0246_teoria_kowalski_apple_design.md` | Destil·lar i arxivar | Retenció viva del Mestre (índex, l. 47); subsecció «Gestos» (b.2) |
| 13 | `261011_0310_auditoria_mercat_puebli_bandomovil.md` | Destil·lar i arxivar | Reescrita a (d); avui no té àncora |
| 14 | `261012_1322_relat_historic_xylella.md` | Conservar | Retenció del Mestre (índex, l. 45) per al Front H; arxivar quan la regressió del Front H (un NIF mai cau en un camp de nom) siga verda |
| 15 | `261012_1715_gnucash_arrel.md` | Conservar | Recerca viva per als fronts D i E; ancorar-la amb `· per a [[261013_1405_pla_implementacio_gestoria_jarvis]]` |
| 16 | `261012_1815_skills_antislop_thermos.md` | Destil·lar i arxivar | Hipòtesi 15 de (c) |
| 17 | `261012_1825_workflow_rss_skills.md` | Destil·lar i arxivar | Hipòtesi 14 de (c) |
| 18 | `261012_1915_arquitectura_visual_erp.md` | Conservar | Referència del Front E en curs; ancorar-la amb motiu i arxivar quan aterre la Cabina |
| 19 | `TRACTOR_COGNITIU.txt` | Conservar | README de la carpeta; el Mestre en reescriu el text amb AGENTS §12 |
| 20 | `Planificador de mejora de flujos de trabajo · Claude Academy.webloc` | Arxivar | Cap; la URL és a l'entrada 4 |
| 21 | `Todos los recursos · Claude Academy.webloc` | Arxivar | Cap; la URL és a l'entrada 4 |
| 22 | `mapa-visual-agentes.zip` | Arxivar | Cap: 18 fitxers idèntics per SHA-256 als de `001 NEXUS/` (Codex); no s'extrau |
| 23 | `001 NEXUS/` | Destil·lar i arxivar | Procedència (Emowe, v0.1) i hipòtesi 16; `instalar.sh` no s'executa mai |
| 24 | `260924_1410_tractors_claude/` | Arxivar | Cap; tot instal·lat i cap prova en depén |
| 25 | `260924_1505_tractor_plantilles_claude/` | Arxivar | Cap; instal·lat a `porta-plantilla-viva.mjs` |
| 26 | `260924_1700_tractors_claude/` | Destil·lar i arxivar | Hipòtesis 1 i 2; decisió del Mestre sobre tres proves (e.2); `core-maquetacio-markdown/SKILL.md:34` en cita un fitxer |
| 27 | `260924_1706_prototips_codex/` | Arxivar | Cap; absorbit a `interruptors.js` |
| 28 | `260924_1815_tractor_plantilla_literal/` | Arxivar | Decisió del Mestre sobre `plantilla-viva-installacio.test.mjs` |
| 29 | `260926_1200_infraestructura_fons/` | Arxivar | Cap; aplicat |
| 30 | `260927_1310_reflex_maria/` | Destil·lar i arxivar | Dues idees a una skill: el camí correcte ha de ser el més barat, i el receptor valida i avisa sense bloquejar; decisió del Mestre sobre dues proves (e.2) |
| 31 | `260930_0040_governanca_claude/` | Arxivar | Hashes al manifest: Codex adverteix que ha divergit del viu |
| 32 | `260930_0400_governanca_claude/` | Destil·lar i arxivar | Hipòtesis 3 i 4 en un laboratori nou rebasat |
| 33 | `261002_1510_tractor_fatiga_claude/` | Arxivar | Cap; instal·lat i el seu LLEGIU ja ordena arxivar |
| 34 | `261002_1745_olivera_arxiva_claude/` | Destil·lar i arxivar | Superat per `261006_0055`; procediment de desbloqueig a una skill (b.2) |
| 35 | `261002_1745_sentinelles_claude/` | Conservar | Fins reconciliar (Codex): codi viu a `src/sections/tractors/sentinelles/`, skill `sdp-sentinelles` absent |
| 36 | `261002_1745_skills_claude/` | Destil·lar i arxivar | Cua de 13 esborranys: el Mestre decidix en una sola lease què s'instal·la i què es descarta |
| 37 | `261003_1330_anticipacio_claude/` | Destil·lar i arxivar | Hipòtesi 6 i detector de laboratoris aplicats sense arxivar |
| 38 | `261003_1330_empaquetat_mobil_claude/` | Conservar | Única especificació viva de Capacitor (Fases 1 i 2); hi apunten `src/pwa/registre.js:3`, `src/pwa/sw.test.js:5` i `src/natiu/entrada.jsx:4` |
| 39 | `261003_1330_lector_rss_claude/` | Destil·lar i arxivar | Decisions del Lector a skills (b.2); corregir el «backend (Sollutia)» del seu §3 (Codex) |
| 40 | `261003_1330_onada4_claude/` | Destil·lar i arxivar | Hipòtesi 18 i la referència de la Gestoria; repuntar `pageContent.js:148`, `pageContent.roadmap.test.js:13`, `tipografia-estreta.css:12`, `fontsLocals.test.js:7`, `oauthRelay.js:45` i `ADR-2026-10-APPS-DEL-DISPOSITIU.md:28` |
| 41 | `261003_1330_parroquia_claude/` | Conservar | Moure `MAPA_IMATGES.txt` al costat del consumidor i ajustar `laParroquia.test.js:35`, amb ordre |
| 42 | `261003_1330_produccio_claude/` | Arxivar | Repuntar `RecuperacioSteps.jsx:6` i `src/data/supabase/auth.js:525` |
| 43 | `261003_1330_skills_disseny_claude/` | Destil·lar i arxivar | Hipòtesis 12 i 13, en la mateixa lease que l'entrada 36 |
| 44 | `261004_0605_nit_claude/` | Destil·lar i arxivar | Quatre documents a la Wiki: resiliència ERP G1-G12, model de casa i mode cens, ADR de trucades WebRTC, tutor empresarial i llistes de botigues |
| 45 | `261004_2240_marato_claude/` | Arxivar | Tres tècniques en una línia de `core-tecniques-investigacio`: disseny propi abans del diff aliè, ACK per hash de contingut, congelar i un sol executor de proves |
| 46 | `261006_0055_olivera_ancores_opus/` | Arxivar | Cap; aplicat i els corredors salten |
| 47 | `261006_0300_ledger_claude/` | Destil·lar i arxivar | Decisions obertes (D9, D10, Reflex a AGENTS, §16 contra §12, superfície d'aprovació de skills) a un document canònic; `antigravity-hook.mjs:61,75` en citen la diagnosi |
| 48 | `261007_1715_auditoria_claude/` | Arxivar | La tríada del 403 de perfil a les notes del Front A |
| 49 | `261007_2215_auditoria_claude/` | Arxivar | Migració `2610072230` sense aplicar i punt B d'`IdentitatContext` a ESTAT |
| 50 | `261009_0400_consola_claude/` | Destil·lar i arxivar | Fonts mesurables i torns caducats al Front F; repuntar `02_saber/03_consola_termodinamica/04_contracte_de_dades.md:149` |
| 51 | `261009_0400_higiene_claude/` | Destil·lar i arxivar | Procediment de fase a `core-higiene-escriptori` (b.2); files obertes de l'inventari de brossa a ESTAT |
| 52 | `261009_1245_onada7_claude/` | Conservar | Sense aplicar; `olivera-arxiva-261002.test.mjs:141` falla si desapareix sense transacció |
| 53 | `261009_1330_logotips_png_claude/` | Arxivar | Cap; aplicat i la prova salta |
| 54 | `261010_1805_arqueologia_claude/` | Destil·lar i arxivar | Declaració viva de Fable (índex, l. 52, àncora a una carpeta); llista d'esborrat diferit (D-30) a una nota de deute |
| 55 | `261011_0230_onada12_claude/` | Destil·lar i arxivar | Hipòtesi 5 a una fitxa Wiki; C7-C18 com a deute |
| 56 | `261012_0040_sistema_informes_claude/` | Conservar | `core-informes-pdf/SKILL.md:27` hi apunta; promoure-ho a `tooling/pdf/` amb fonts locals: avui el generador crida Google Fonts |
| 57 | `261012_1315_auditoria_claude/` | Conservar | Dotze pegats verificats sense aplicar (F01-F13, sense F10), pendents de decisió del Mestre |
| 58 | `vigilante/` | Destil·lar i arxivar | Autointegritat, runbook d'incidents f0-f7 i forats de SdP a `02_saber/protocols_tecnics/` |

**Primera tongada sense dependents** (només manifest i àncores): entrades 2, 5, 9, 20, 21, 22, 24, 25, 27, 29, 31, 33, 46 i 53.

#### e.4 Discrepàncies amb Codex i com es resolen

- **`tests/lint-torn-261002.test.mjs:20`:** Codex la posa entre els imports que bloquegen; al disc tolera fitxers absents. No bloqueja.
- **Acoblaments que Codex no llista:** `laParroquia.test.js` (suite primària), `tractor-autosanacio`, `porta-receptor`, `plantilla-viva-installacio` i `olivera-arxiva-261002:141`. Amplien la seua llista; no la contradiuen.
- **`001 NEXUS/`:** Codex hi veu una referència experimental; l'explorador, obra absorbida. Es destil·la (procedència i hipòtesi 16) i s'arxiva. El zip va a l'arxiu de seguida: hi ha consens.
- **`261002_1745_sentinelles_claude/`:** l'explorador proposava arxivar després d'instal·lar la skill. Guanya Codex: es conserva fins a la reconciliació.
- **Relleus, arqueologia, logotips i onades:** Codex demana conservar-los fins a tancar la traçabilitat. L'explorador declara haver-los llegit tots. El manifest amb hashes i el `git mv` reversible conserven la traçabilitat; cada trasllat espera la seua precondició i la decisió és de MarIA.

### Higiene de seguretat

- `001 NEXUS/mapa-de-mis-agentes/instalar.sh:11` baixa un instal·lador i l'executa amb `sh`: **no s'executa mai**.
- Els quatre `vigilante/wf_*.json` (mode 600, uns 5,3 MB) porten camins locals i interioritats del repo: **mai en un bundle ni en el RAG**.
- El PHP GPL de tercers de `vigilante/` no ha de viure en l'arbre de la Wiki que publica el connector de WordPress.
- `261006_0300_ledger_claude/` registra un bolcat de `.env` en transcripcions d'Antigravity: **cal revisar-lo i rotar les claus** (segons l'explorador; no comprovat ací).

### Avaluació DAFO

- **(F) Fortaleses:** la majoria del laboratori ja ha aterrat en destins vius verificables; els acoblaments estan mapejats amb línia exacta.
- **(D) Debilitats:** fonts sense URL, un informe amb xifres de models no verificables, lliçons a mig instal·lar i cap casa canònica per a les referències.
- **(A) Amenaces:** un trasllat a cegues posa roja la suite primària, trenca sis proves de laboratori, deixa 326 àncores fantasma i deixa `core-informes-pdf` apuntant al buit.
- **(O) Oportunitats:** deduplicació semàntica, `sdp.mod.v1`, canari de portes i evidència que caduca curen el mateix mal que ha omplit el laboratori; el bucle RSS amb aprovació humana evitaria que es tornara a omplir.

### Matriu d'urgència i importància

- **Urgent i important:** porta de GRANTs abans del 30-10; lliçó del clon a `sdp-pedra-seca` mentre es construïx la Cabina; no tocar `261003_1330_parroquia_claude/` abans de moure el seu fitxer.
- **Important però no urgent:** promoure (a) i (c) a `02_saber`; lease única de skills; torns retirats; destil·lació de `vigilante/`; Frontissa D10.
- **Urgent però no important:** primera tongada d'arxiu (14 entrades sense dependents).
- **Ni urgent ni important:** Ponytail, OmniRoute, Pace, Awesome Designs i Image to 3D.

<!-- SDP:SECTION estudi_ia.s5 -->
## Fonts

**Llegides íntegrament per Claude en este torn:**

- La plantilla viva `_wiki_de_poble/03_actuar/plantilles/estudi_consell.md` v2.0.0, entregada per `document.mjs context`.
- [[261013_1405_pla_implementacio_gestoria_jarvis]], fronts F, G i H (l. 85-108).
- [[261013_1510_auditoria_codex]]: l. 1-119 (§1, §2, §2.1 i §3), l. 200-282 (§5, §6 i §7) i l. 536-575.
- [[261013_1510_auditoria_claude]]: l. 43-87.
- Els mapes dels tres exploradors de laboratori, 58 de 58 entrades (eixida del workflow d'orquestració, fora del repo i no persistent).
- Del laboratori: `TRACTOR_COGNITIU.txt`, `261011_0310_auditoria_mercat_puebli_bandomovil.md`, `261012_1322_relat_historic_xylella.md` i `vigilante/readme.txt` (l. 1-12).

**Verificades al disc amb `ls`, `grep` o lectura dirigida:** les proves de la taula e.2; `tooling/gates/porta-olivera.mjs` (l. 336-375 i 985-990); `tooling/tests/node-suite-manifest.json:8`; `tooling/gates/tractor-rls.mjs:200-237`; `.agents/rules/supabase_grants.md`; `.agents/LEDGER.md:795`; `.agents/skills/sdp-pedra-seca/SKILL.md`; `.agents/skills/core-informes-pdf/SKILL.md:27`; `.agents/olivera-fase.json:2`; `tooling/gates/antigravity-hook.mjs:55,61,75`; el recompte de 326 àncores i les retencions de l'índex (l. 45-52); i l'existència de cada destí marcat «Disc» a (b).

**Pendents, no llegides per Claude:** el contingut de la resta d'entrades del laboratori, on es confia en els exploradors i en Codex; els quatre `vigilante/wf_*.json`, que Codex declara no auditats; el PDF de `001 NEXUS/` i el zip, que no s'ha extret.

**Fonts externes:** les de (a.1) i (d) per la verificació de Codex del 2026-10-13; les de (a.2) són [NO VERIFICAT]. Cap llicència verificada.

<!-- SDP:SECTION estudi_ia.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261013_1510_auditoria_codex]]
- [[261013_1510_auditoria_claude]]
