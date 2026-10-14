---
type: informe
status: esborrany
description: Auditoria forense de produccio i laboratori, higiene de consola i invariants de Gestoria; dictamen sense moure originals ni modificar codi.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ddb1c6a6-9ca9-4640-ae52-c0a585fa02d5:d68018b1-946d-4dae-8287-34764ce6289b
---
# Auditoria adversarial de producció, laboratori IA, consola i Gestoria

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ddb1c6a6-9ca9-4640-ae52-c0a585fa02d5:d68018b1-946d-4dae-8287-34764ce6289b |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-13T22:02:49.243Z |
| Modificació | 2026-10-13T23:42:18.355Z |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del torn: auditar i emetre dictamen; cap trasllat autoritzat |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-13T22:02:49.243Z: esborrany creat.

2026-10-13T22:18:02.536Z: auditoria consolidada, reproduccions contrastades i integritat verificada; dictamen emés per a decisió humana.

2026-10-13T22:18:58.929Z: validació documental correcta; tancament global no segellat per 437 incidències SCC fora de l’informe.

2026-10-13T23:42:18.355Z: primera ronda de vigilància: 730 proves passen; VIG-01 reproduït i refutat quant al salt de signatura; informe Claude encara pendent.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen executiu i tall auditat

**No és segur tractar producció com una carpeta de duplicats ni arxivar el laboratori només perquè Vitest no es pose roig.** S'han inventariat els **27 elements de producció** i contrastat les **19 propostes literals «Arxivar»** de l'estudi. Hi ha originals únics, àudios camuflats per extensió, dependències actives i comprovacions que desapareixen quan falta la font.

La Gestoria presenta **un P1 i tres P2 reproduïts amb dades sintètiques** malgrat 932 proves verdes. La consola té sediment verificat i fonts pendents; les seues 936 proves passen, amb una omesa. Este informe és un dictamen: **cap trasllat, eliminació ni canvi de codi executat**.

Tall: `HEAD 021a03eabf9c11a1bd3dd32eb55b58e4fd1e8929`, arbre amb canvis documentals previs de MarIA. Data de creació local: **2026-10-14, Europe/Madrid**; el nom usa `261014` en lloc del literal d'ahir `261013_HHMM` del prompt. L'informe seguix el circuit documental del torn `torn_ddb1c6a6-9ca9-4640-ae52-c0a585fa02d5` i el pla viu de jerarquia taronja, sense assumir-ne l'execució.

Prioritats: P1 = integritat amb impacte material; P2 = defecte funcional o pèrdua de verificació; P3 = manteniment/ergonomia. Totes les propostes de trasllat o quarantena tenen `requires_human_decision: true`, per AGENTS §12. Les recomanacions de codi són per al següent pla, no una autorització d'implementació.

### 1. Producció: inventari íntegre i triatge

Base de totes les rutes d'esta taula: `_wiki_de_poble/04_escriptori/01_produccio/`. Recompte físic: **10 carpetes + 17 fitxers = 27 elements**, amb **297 fitxers recursius i 224.912.711 bytes**. «Integrat» distingix còpia exacta, derivat i inspiració visual. Cap equivalència funcional completa es deduïx del nom.

| # | Element | Estat acreditat | Evidència i justificació | Acció proposada |
|---|---|---|---|---|
| 1 | `260911_0006_tasques_ui_standardization.md` | Actiu humà; assimilació parcial | UniversalCard actual a `src/components/PedraSeca/organismes/UniversalCard.jsx:352`; la ruta antiga del document no existix. Les variants no acrediten totes les tasques. | Conservar fins a tancar cada tasca. |
| 2 | `260911_0012_agenda_futur_extensio_chrome.md` | Actiu humà | Agenda futura; cap implementació Web Clipper acreditada en `src`. | Conservar; destil·lar primer al full de ruta. |
| 3 | `260911_0645_propostes_manifest_panell_control.md` | Actiu humà; assimilació parcial | `destinsControl.js:145-168` recull quatre categories, però no acredita totes les propostes socials del document. | Conservar fins a matriu de tasques implementades/pendents. |
| 4 | `Alergenos-ES_COPIA-ES_POT_BORRAR/` | Actiu humà amb duplicació parcial | 37 fitxers; 18 SVG iguals a `alergens_svg`, **19 addicionals sense duplicat local trobat**, inclòs `¡alergenos.af`, lock i 17 recursos. | **Conservar íntegra**: el nom «ES_POT_BORRAR» és una premissa refutada. |
| 5 | `Targetes_Davinci_Llestes/` | Integrat; còpia exacta | 18/18 JPG amb SHA-256 igual als 14 de `public/assets/ui/plugins` i 4 de `public/assets/nano_cards`; procedència a `indexConsola.js:65-70`. | Arxivar originals intactes, conservant els públics. |
| 6 | `WhatsApp-Clon-01/` | Integrat com a referència visual | 22 captures, cap còpia exacta fora de producció. Traça en `XatSection.jsx:5`, `UniversalWorkspace.jsx:61` i pla històric citat davall. | Arxivar referència intacta, després del tancament humà del disseny. |
| 7 | `WhatsApp-Clon-02/` | Integrat com a referència visual | 52 PNG; `src/sections/xat/components/FullAjustos.jsx:2-3` els acredita. No són codi integrat. | Arxivar referència intacta. |
| 8 | `alergens_svg/` | Integrat amb sanejament | 18 SVG originals; 14 derivats a `src/assets/alergens`. `src/components/PedraSeca/recursos/alergens.js:8-26` documenta transformació. Tres proves de fidelitat depenen de la presència dels originals. | **Conservar** fins a migrar explícitament eixa verificació. |
| 9 | `article-ayudawp.md` | Actiu humà documental | 402.404 B de captura HTML, no Markdown destil·lat. Font declarada i vinculada al checklist. | Arxivar intacte amb el lot AyudaWP. |
| 10 | `builds/` | Artefacte històric | ZIP v1.0.0, 108.273.432 B i 306 entrades de plugin/dist; cap consumidor actual de la ruta concreta. No executat. | Arxivar el ZIP intacte, amb versió i checksum. |
| 11 | `captura_claude_avatar.png` | Referència assimilada | Traça al retallador `useEnquadramentImatge.jsx:6-15` i informe històric. No és duplicat binari. | Arxivar referència intacta. |
| 12 | `captures_claude/` | Actiu humà | 40 captures sense mapa exhaustiu captura→funcionalitat ni duplicats exactes trobats. | Conservar fins a adjudicació humana. |
| 13 | `checklist-limpieza-wp-ayudawp-complet.csv` | Derivat textual complet | Huit seccions; 48.264 B. No conserva les fórmules del llibre. | Arxivar amb el lot AyudaWP. |
| 14 | `checklist-limpieza-wp-ayudawp.csv` | Duplicat parcial | 2.896 B; només Portada, fragment exacte del complet. | Arxivar com a exportació parcial, sense declarar equivalència completa. |
| 15 | `checklist-limpieza-wp-ayudawp.md` | Actiu humà buit | **0 bytes**: no conté checklist. | Quarantena documental amb ordre humana; no esborrar. |
| 16 | `checklist-limpieza-wp-ayudawp.txt` | Derivat equivalent en contingut | 48.280 B; igual al complet només després de transformar els separadors de secció. | Arxivar com a derivat, sense reescriure'l. |
| 17 | `checklist-limpieza-wp-ayudawp.xlsx` | Font funcional humana | **8 pestanyes, 85 fórmules**: Portada 50; Checklist 2; comprovacions online 20; reputació/retirades 11; prevenció 2. | Arxivar intacte com a font principal; mai substituir-lo pel CSV. |
| 18 | `contracte_graella.md` | Dependència executable viva | `tooling/gates/tractor-graella.mjs:26,35-39`; gate a `package.json:16` i `run-portes.mjs:46`. La porta passa. | **Conservar a la ruta actual**; trasllat només amb migració del consumidor. |
| 19 | `generador_sitemap.mjs` | Script humà aïllat obsolet | `:7-8` calcula `_wiki_de_poble/public/sitemap.xml`; `:36,40` escriu en executar-se. La via vigent és `build-seo-manifest.mjs`. | Quarantena; no executar per provar-lo. |
| 20 | `iaia_maria_avatar.jpg` | Integrat; duplicat exacte | Igual a `public/assets/uploads/brain/iaia_maria_avatar.jpg`; ús a `agentsSeed.js:107`. | Arxivar original intacte. |
| 21 | `iaia_maria_portada.jpg` | Integrat; duplicat exacte | Igual als dos públics; ús a `agentsSeed.js:108`. | Arxivar original intacte; deduplicar públics queda fora d'abast. |
| 22 | `loyverse_clon/` | Actiu humà; Back Office | 27 PNG. El TPV existent no acredita completar informes, rebuts, modificadors, impressores i administració. | Conservar fins al mapa d'assimilació Back Office. |
| 23 | `loyverse_clon_ipad/` | **Originals d'àudio i captures** | 20 `.img` són **WebM/Opus d'àudio**, més 9 PNG. Cap pista de vídeo; durades EBML sumen **1.604,148 s**. | **Conservar íntegra i protegida**; no és un clon ja consumit. |
| 24 | `loyverse_clon_mobil/` | Referència estructural assimilada | 36 JPEG; traça a `UniversalTPV.jsx:2-15` i `src/apps/bar/vistes/Tpv.jsx:4`. Sense còpies binàries. | Arxivar intacta quan es tanque humanament el bloc visual. |
| 25 | `mercat_nou_per_a_video.jpg` | Duplicat exacte integrat | Igual a la targeta de Mercat i còpies públiques; ús `pageContent.js:319`. | Arxivar còpia de vídeo intacta. |
| 26 | `mur_per_a_video.jpg` | Duplicat exacte integrat | Igual a la targeta del Mur i públic; ús `pageContent.js:309`. | Arxivar còpia de vídeo intacta. |
| 27 | `xat_portada.jpg` | Original humà no equivalent al públic | Original i públic 1024², però **SHA-256 i píxels diferents**; 1.192.696 vs 553.181 B. Públic consumit a `pageContent.js:399` i `xatsPerDefecte.js:186`. | **Conservar original**; transformació reversible no acreditada. |

**Protecció d'àudios.** Les 20 `.img` es van identificar per contingut EBML (`TrackType=2`, `CodecID=A_OPUS`), no per l'extensió. S'han inspeccionat metadades, sense escolta/transcripció ni eixida de dades. El dictamen inicial basat només en extensions ha quedat refutat abans de l'entrega.

**Ancoratge.** L'índex conté referències individuals als documents, targetes, al·lèrgens, build i gràfics de vídeo, però no acredita ancoratge complet de totes les captures ni del conjunt Alergenos. «Porta Olivera 0» valida l'abast del primer nivell, no certifica per si sola tots els 297 descendents. Cal completar l'ancoratge per recurs/lot sense moure'ls; la porta SCC és el contrast del graf complet.

#### Matriu d'arxivat segura de producció

Base suggerida **encara no creada**: `_wiki_de_poble/90_arxiu_historic/261014_produccio/`. Resolució final: Mestre o MarIA. Mantindre el nom i arbre original de cada lot, inclosos originals gràfics.

| Lot | Elements de la taula | Destí proposat | Condició abans d'aplicar |
|---|---|---|---|
| Originals gràfics copiats | 5,20,21,25,26 | `originals_grafics/<nom_original>` | Manifest binari abans/després; conservar públics i procedència. |
| Referències visuals | 6,7,11,24 | `referencies_visuals/<nom_original>` | Tancament humà del disseny i mapa font→component. |
| AyudaWP | 9,13,14,16,17 | `ayudawp/<nom_original>` | XLSX com a font funcional; CSV/TXT com a derivats; àncores actualitzades. |
| Paquet antic | 10 | `builds/<nom_original>` | Sense executar, extraure ni reconstruir el ZIP. |
| Quarantena | 15,19 | `quarantena/<nom_original>` | Motiu, hash i resolució humana; cap eliminació automàtica. |
| Retenció | 1,2,3,4,8,12,18,22,23,27 | Ruta actual | Originals, dependència activa o assimilació pendent. |

**Balanç del dictamen: 10 conservar, 15 candidats a arxiu intacte, 2 a quarantena.** És una proposta condicionada, no 17 moviments autoritzats. El manifest ha de recollir ruta anterior, destí, bytes i SHA-256 de cada fitxer, versió del component consumidor, decisió i responsable. Després d'una eventual còpia/moviment: comprovar tots els hashes, actualitzar àncores, portes i proves, i conservar el mapa invers de restauració. La porta Olivera no admet directament subcarpetes: no substituir el procediment per una ordre massiva improvisada.

Checksums forenses destacats:

| Peça | SHA-256 |
|---|---|
| ZIP v1.0.0 | `f9b7c607aa43d9b57a836aa452e233972bf1e3685bbeecc2368027df19ebd18e` |
| Màster `¡alergenos.af` | `148d973af33a2ff77984f3a1b953ccc5c1174f5e683354db4c5a05e9cf68d64b` |
| XLSX AyudaWP | `283d31b1b56e11d0efa734a8d43e80f7df8a18d98afa9047c20e379655a9e28f` |
| `xat_portada.jpg` original | `eaf409cf89e4c2212d1607f06fc000597966fc142a4a3af8301aa07696033ae3` |
| `xat_portada.jpg` públic | `0b7b718c81b15409c4777b908c476db3e5ce8ac10a926340d0a01431809746a2` |

### 2. Laboratori IA: les 19 propostes i la cobertura que es perdria

L'estudi separa **19 «Arxivar», 29 «Destil·lar i arxivar» i 10 «Conservar»**. Les 19 són 6 fitxers i 13 carpetes, 127 fitxers interns versionats, exclòs `.DS_Store`. La simulació ha retirat **només estes 19 d'una còpia temporal**, preservant els originals. No s'ha trobat import executiu d'estes entrades al producte; sí corredors condicionals i dependències creuades.

| # estudi | Entrada de `02_investigacio_ia/` | Dependència i decisió |
|---|---|---|
| 2 | `260924_0200_skill_core_higiene_escriptori.txt` | Cap consumidor executable trobat; candidata amb manifest/àncores i revisió de les lliçons pendents. |
| 5 | `261002_1655_tractor_fluxos.md` | Cap consumidor executable trobat; candidata. |
| 9 | `261004_0045_mcp_prompts_chat.md` | Cap consumidor executable trobat; candidata. |
| 20 | `Planificador de mejora de flujos de trabajo · Claude Academy.webloc` | Cap consumidor executable; conservar referència destil·lada. |
| 21 | `Todos los recursos · Claude Academy.webloc` | Cap consumidor executable; conservar referència destil·lada. |
| 22 | `mapa-visual-agentes.zip` | Cap consumidor executable; la igualtat amb NEXUS és evidència de l'estudi, **no revalidada** en esta revisió de dependències. |
| 24 | `260924_1410_tractors_claude/` | Cap consumidor executable trobat; candidata amb traça d'integració. |
| 25 | `260924_1505_tractor_plantilles_claude/` | Cap consumidor executable trobat; candidata. |
| 27 | `260924_1706_prototips_codex/` | Cap consumidor executable trobat; candidata. |
| 28 | `260924_1815_tractor_plantilla_literal/` | `plantilla-viva-installacio.test.mjs:131-145` **comprova instal·lació i captura errors**. Absència tolerada hui; dos errors previs de Context persistixen. Corregir l'estudi. |
| 29 | `260926_1200_infraestructura_fons/` | Cap consumidor executable trobat; candidata. |
| 31 | `260930_0040_governanca_claude/` | Cinc corredors `governanca-260930-*` amb imports guardats. **47 casos passen a omesos** en el conjunt enfocat. Retindre fins a decidir cobertura permanent. |
| 33 | `261002_1510_tractor_fatiga_claude/` | `fatiga-261002.test.mjs:48,64-87,102-108` prioritza instal·lació/transacció; tolerat en l'estat actual. Preservar prova instal·lada i transacció. |
| 42 | `261003_1330_produccio_claude/` | Comentaris a `RecuperacioSteps.jsx:6` i `src/data/supabase/auth.js:525`. Repuntar-los; no són imports executius. |
| 45 | `261004_2240_marato_claude/` | Cap consumidor executable; abans cal destil·lar les tres tècniques indicades a l'estudi. |
| 46 | `261006_0055_olivera_ancores_opus/` | Corredor Olivera ja omés per transacció. Higiene `:433-434` retorna si falta; `261006_0300_ledger_claude/t6_higiene/prepara-pla.mjs:173-179` accepta transacció instal·lada. Preservar-la. |
| 48 | `261007_1715_auditoria_claude/` | Cap consumidor executable; abans cal destil·lar la tríada del 403. |
| 49 | `261007_2215_auditoria_claude/` | Cap consumidor executable; registrar pendents de migració i IdentitatContext. Aplicació remota no comprovada. |
| 53 | `261009_1330_logotips_png_claude/` | `laboratori-logotips-261009.test.js:17-23,46-59`: desapareixen **6 comprovacions que passen** i la generació de 9 casos del manifest. Promoure fixture i verificació permanent abans d'arxivar. |

**P2 LAB-01 — Verd per omissió.** L'estudi `:283` anomena «sense dependents» una tongada que inclou #31, #33, #46 i #53. Són dependències tolerants, no absents. L'acceptació «passen o salten» no respecta l'objectiu de conservar comprovacions de `tooling/tests/node-suite-manifest.json:8`. Criteri proposat: mateix conjunt d'assercions rellevants contra fonts canòniques; qualsevol retirada requereix decisió explícita i substitució identificada.

**Correcció de l'estudi e.2, #28.** No és cert, per a l'arbre actual, que desaparega el paquet i aparega necessàriament un error de lectura: `construeix()` consulta la marca instal·lada a `:138` abans de `p.text()` i captura l'error a `:140`. Les dos fallades originals són `contextResumit():210`, «el bloc Context ha d'aparéixer una sola vegada», observades als casos `:260,304`; no són fallades causades per l'arxivat.

**La Parròquia (#41) queda fora de les 19.** La dependència rígida de `src/apps/bar/llavors/laParroquia.test.js:35,198` és real: retirar addicionalment `261003_1330_parroquia_claude/MAPA_IMATGES.txt` de la còpia reproduïx `ENOENT`. La prova declara originals humans absents `0/199`; només s'ha verificat el mapa versionat, no fidelitat sobre eixos 199 originals.

**Graf i eina.** `tooling/lib/document-corpus.mjs:17-32` recorre dinàmicament el laboratori i `:9-14` exclou l'arxiu. El trasllat canvia el graf encara que no canvie cap import. `porta-olivera.mjs:990` continua rebutjant el trasllat amb `--arxiva --nom` dins de subcarpetes. Mantindre la transacció reversible, manifest i actualització explícita d'àncores de l'estudi; no declarar «0 dependències» per una cerca literal buida.

### 3. Consola i Panell de Control

La ruta convocada `src/pages/admin/SolatgeConsole.jsx` és **obsoleta i absent**. Superfície revisada: `src/sections/consola/`, `src/sections/control/`, els productors `tooling/vite/consola-iaia.mjs` i `tooling/brain/mapa-consola.mjs`, i els blocs pertinents de `src/css/modules.css`.

| ID | Prioritat i evidència | Conseqüència | Sanejament proposat |
|---|---|---|---|
| CON-01 | P3. `peces.jsx:47-66`: `TargetaResum` i `Xifra` estan marcades obsoletes. Cerca de consumidors: només es criden entre elles i en `peces.test.jsx:43-79`. | Segona recepta de targeta que ja no utilitza cap pàgina productiva. | Retirar exports i migrar/retirar les proves específiques amb decisió de cobertura. No tocar `TargetaConsola` ni el `Xifra` propi de Gestoria, que sí té consumidors. Actualitzar també la referència documental de `src/sections/disseny/cataleg/manifest.js:476`. |
| CON-02 | P3. `consola-iaia.mjs:89-108` encara llig i retorna `credits` i `estrategia_consum`; `consolaContent.js:71-73,109-114` els descarta. | Lectura i transport sense consumidor de la UI auditada. | Retirar camps i lectures després de confirmar que no hi ha consumidor extern del JSON; mantindre els fitxers originals. |
| CON-03 | P2 de cobertura de dades. `recullConsola():103-115` no publica `termometria`; `recullFonts():306-334` no aporta `portaDocuments` ni `cadenaPortes`, que `construeixMapa.js:914-917` requerix. | «Artefactes actius» no es pot mesurar; dos indicadors de salut sempre N/A amb este productor. | Connectar resultats datats d'una execució verificable o presentar-los com a fonts pendents. No substituir N/A per zero ni executar tota la bateria en cada petició. |
| CON-04 | P3. `ControlSection.jsx:454-520` pinta Utilitats i Maquinària encara que totes les seues targetes estiguen amagades. `EspaiDelPanell():261-264` sí que evita este cas. | H2, entradetes i graelles buides després d'excloure Snippet/RSS/TPV. | Calcular visibles una vegada i no muntar la secció buida, aplicant la mateixa regla dels espais. |
| CON-05 | P3. `useFontDev.js:49-56` comprova DEV però no `actiu` dins de `carrega`. Desactivar tampoc reinicia estat/valor. | El contracte «actiu false no llig res» no es complix en una recàrrega manual; conserva dades antigues en desactivar. Dos casos sintètics reproduïts; no s’ha acreditat que un consumidor actual cride manualment el hook mentre està inactiu. | Guardar l'activació vigent en la callback i definir explícitament l'estat desactivat. **No és una fallada de la barrera de producció**, que sí bloqueja lectures fora de DEV. |
| CON-06 | P3. `ConsolaSection.jsx:395-401` munta tauler, índex i diagnòstic sense els controls del peu; estos sí apareixen a les subpàgines. | El tauler es queda amb la instantània carregada; per refrescar o canviar privacitat cal entrar en una subpàgina. | Proposar accés als controls al tauler. És canvi d'UI: `requires_human_decision: true`; no fer-ho dins d'una neteja de píxel idèntic. |
| CON-07 | P3/pendent del pla. `modules.css:6785-6792` manté radi de targeta i subratllat del selector de vistes. | Front 4 del pla encara no executat en este tall. | Aplicar el canvi quan l'executor implemente el pla. **El token citat `--sdp-radius-pill` no existix**; el disponible és `--sdp-radi-pastilla` (`tokens.css:181`). Conservar una distinció perceptible de l’estat seleccionat quan es retire el subratllat. |

**Mètriques realment observades.** Una execució local del productor ha retornat 280 nodes, 244 arestes, 13 tasques, 7 avisos i 20 mètriques: 18 amb valor i 2 N/A (`conformitat-documental`, `cadena-portes`). El pols té 38 rebuts i 1 registre de consum, però no camp termometria. No confondre «un registre de consum» amb mesura completa dels tokens. El mapa compta 266 torns caducats de 278: és sediment de governança, no 266 processos executant-se.

**Allò que no s'ha de llevar com a “mort”.** Les nou targetes del tauler tenen rutes i contingut; sense fonts en producció expressen absència perquè el middleware és local/DEV. El Panell conserva set portes «Publicar» inactives, però les targetes tenen «Saber-ne més»: són funcionalitat pendent, no codi mort. L'índex i el diagnòstic repetixen navegació per ordres documentades; plegar-los és una proposta d'ergonomia que requerix decisió visual, no una correcció automàtica.

**Pedra Seca.** La cerca de les 52 classes `sdp-consola`, `sdp-mapa`, `sdp-explorador` i `sdp-control` declarades a `modules.css` no ha trobat cap classe sense menció en codi no de proves; això no demostra que totes les branques es renderitzen. La regla `.sdp-consola__quieta:hover` (`:5485-5490`) conserva ombra d'una recepta antiga: candidata a revisar junt amb CON-01, sense atribuir-li un defecte visual observat. La resta de blocs revisats usa tokens, focus i àrees de toc; no s'ha fet QA visual exhaustiva de cada amplada/tema.

### 4. Invariants de l'Escàner, Finestreta i consumidors de Gestoria

**Límit de la partida doble:** estes peces no implementen llibre major ni assentaments amb suma del deure igual a suma de l'haver. Escàner radiografia i passa extractes al Tauler; Finestreta prepara identitat i valors confirmats per al cofre. La comprovació de Norma 43 (`c43.js:299-328`) és conciliació `saldo inicial + haver − deure = saldo final`, una propietat distinta. No s'atorga certificació comptable/fiscal a partir d'estes suites.

#### GES-01 · P1 · Comptes CSV diferents es convertixen en un únic compte

Fonts: `escaner/nucli/escaner.js:833`, `tauler/nucli/resumTauler.js:344`. L'Escàner preselecciona `bancs/banc_a.csv` i `bancs/banc_b.csv`; el consumidor agrega tots els CSV amb `id: csv`. Dos comptes amb saldos 900 € i 1.800 € i moviments diferents donen **900 € de caixa, un compte, completa=true i cap avís**, en lloc de 2.700 €.

El saldo agregat condiciona les previsions. Exigir associació explícita dels extractes a una identitat de compte opaca, o marcar incompleta la caixa mentre siga ambigua. No inferir automàticament un compte per fitxer: poden ser períodes del mateix compte. **Deute anterior del consumidor**, present abans de `cc9d2e89` i atribuït per blame a `2022ee328` del 2026-10-04; el nou Escàner exposa eixa limitació. No s'ha demostrat que abans sumara bé els comptes.

#### GES-02 · P2 · Saldo inconsistent presentat com a caixa completa

Fonts: `resumTauler.js:125,537`, `cabinaAvio.js:180`. Norma 43 sintètica: inicial 1.000 €, càrrec 100 €, peu 9.900 €. El parser produïx **SALDO/alta**, però l'agregat usa 9.900 € i `completa=true`. L'avís queda al compte, mentre avisos globals és buit; la Cabina confia en l'indicador complet.

La targeta individual sí diu «Revisa l'extracte»: no hi ha desaparició total de l'avís. Cal propagar validesa del saldo fins a caixa/cobertura/Cabina i distingir saldo declarat de saldo conciliat. **Deute anterior del consumidor heretat per la Cabina nova**, no regressió d'un parser recent.

#### GES-03 · P2 · Formulari que combina persona i tribut d'un altre titular

Fonts: `finestreta/nucli/formularisFinestreta.js:170`, `Finestreta.jsx:645`. `contextDe` resol el tribut per id sense validar `tribut.titular === persona.id`; el selector oferix tots els tributs. Amb una fitxa vàlida de persona A i entitat E, el formulari `suma-sollicitud` posa **PROVA, ANNA** i la referència tributària d'E com a camps `llest`.

Filtrar la UI i validar també al nucli la coherència de titular. Cas reproduït amb model admés/cofre, però el flux habitual crea una sola persona. **Defecte de la peça nova** afegida en `cc9d2e89`; no hi ha equivalent anterior per afirmar regressió. No s'ha presentat cap tràmit real.

#### GES-04 · P2 · Deduplicació de tributs entre titulars

Font: `finestreta/nucli/fitxaIdentitat.js:389`. `tributDelGrup` recupera una referència/id abans de validar-ne titular. Dues fusions amb la mateixa referència, fonts diferents i destinataris explícits A/B deixen **un sol tribut d'A amb les dos fonts**. El destí B s'ignora.

La clau de deduplicació ha d'incloure titular; coincidència entre titulars ha de generar conflicte, no fusió silenciosa. Defecte de peça nova en `cc9d2e89`. Límit: reproduït al nucli públic; el hook actual no oferix un selector general de múltiples destinataris.

**Controls favorables verificats.** Aprovació del tractor abans de llegir Font; Escàner sense persistència dels bytes; separació proposta/confirmació i `perAlCofre` sense alternatives; diners de Finestreta en cèntims enters segurs; cancel·lació per torn/AbortController; oblit de Font i neteja en bloquejar cofre; escriptures del cofre serialitzades amb comprovació de sessió. No s'ha confirmat una carrera de persistència en el camí real. Estes garanties no compensen els quatre errors semàntics reproduïts.

**Model B.** Cap proposta introduïx backend nou ni accés directe de Sollutia al port de dades. Els defectes són en transformacions i agregats locals. Endpoints reals, captures, traductors i fixtures de Sollutia no s'han provat: no es declara conformitat amb una API no lliurada.

### 5. Seqüència recomanada i millores de la plantilla

Primer, corregir GES-01 i fer visible la qualitat de saldo de GES-02; després tancar coherència de titular GES-03/04. En paral·lel documental, conservar explícitament màsters/àudios i migrar comprovacions de fidelitat abans d'arxivar laboratoris. Després, un pla acotat per CON-01/02/04/05 i fonts pendents CON-03. Els canvis visuals continuen en el pla de Claude; no duplicar-ne l'execució.

La plantilla `prompt_local` es pot millorar sense modificar-la en este torn:

1. Demanar inventari real amb data/hashes, no donar per cert «duplicats obsolets» o «clons integrats».
2. Identificar formats per signatura de contingut i conservar originals/derivats/inspiració com categories separades.
3. Enumerar les entrades exactes a traslladar. Distingir fallada nova, fallada prèvia, prova omesa i cas que deixa de generar-se.
4. Resolució de rutes obsoletes abans d'actuar; este prompt encara apunta a SolatgeConsole absent.
5. Exigir reproducció sintètica dels invariants, delimitant partida doble, conciliació, identitat i idempotència.
6. Tall HEAD + estat de l'arbre, fitxers reservats per agent i un informe viu; evitar relectura de tot l'arxiu o repetició de suites sense canvi.
7. Àmbit de tancament de monitors per id/propietari: els de la missió; no confondre torns caducats amb processos ni aturar còpies de seguretat estructurals.
8. Nom del document generat amb data local real i tokens «no disponibles» quan no hi ha comptador verificable.

### 6. Vigilància autoritzada · ronda del 14-10, 01:37–01:42 CEST

**Treball en curs, no entrega final.** La instrucció humana posterior activa un únic heartbeat cada 15 minuts. L’informe de Claude `261014_0110_auditoria_claude.md` continua amb Troballes, Verificació i Límits pendents (1.781 bytes). Llegits també l’índex actual, el prompt de Claude actualitzat i els dos documents de Gemini 0130: són encàrrecs i plans, no un final d’onada. La menció de 17.283 proves verdes és la referència inicial; no acredita esta entrega. No s’ha activat la condició de desconvocatòria.

El tall té **29 fitxers de codi/proves canviats i 3 afegits** respecte de la comprovació de les 00:18, tots aliens a esta auditoria. Les afirmacions d’integritat del dictamen inicial corresponen a eixe instant; no volen dir que Claude haja deixat de treballar. S’ha revisat el diff actual, sense modificar-lo ni declarar acceptació de l’onada.

#### VIG-01 · P3 · «Oblida» no cancel·la el lot d’aprovació DEV

`src/sections/tractors/PanellTractors.jsx:401-403` desactiva l’aprovació individual i la revocació mentre treballa el lot, però `:433` deixa actiu **Oblida les aprovacions** i el diàleg `:440-448` en permet la confirmació. `useTractors.js:244` continua el lot sobre la instantània de files; `oblidaTot():250-253` esborra i refresca sense cancel·lar escriptures ni la sèrie.

**Reproducció observada:** retindre `magatzem.afegixRegistre` amb una promesa, començar `aprovaTotsPendents`, executar `oblidaTot`, comprovar que el registre queda buit i alliberar la promesa. Torna a haver-hi registre després de l’oblit. Amb dos manifests sintètics de confirmació tornen dos registres i dos estats aprovats. Amb un manifest de signatura i l’autenticador simulat de les proves del repositori, reapareix un registre, però les claus continuen buides i **el tractor queda pendent**. Les dos proves `[DEFECTE WIP]` passen perquè reproduïxen el comportament, no perquè el corregisquen.

**Refutació essencial:** els sis tractors reals exigixen signatura. La verificació canònica rebutja el registre amb la clau ja esborrada (`aprovacio.js:208-209`); **no s’ha demostrat salt de consentiment ni execució d’un tractor personal sense signatura**. El defecte acreditat és el buidatge no definitiu i la continuació del lot; una nova aprovació vàlida requeriria els gestos humans corresponents. La carrera subjacent també podia existir en la via individual després d’un tancament forçat del modal (doble Escape, `DialegAprovacio.jsx:79-83`); el lot nou exposa una via directa a la UI. No s’atribuïx tota la carrera a esta implementació.

Recomanació al següent canvi: desactivar «Oblida» mentre hi ha un lot, o cancel·lar-lo amb una generació/època comprovada abans de cada escriptura i de cada tractor següent. Verificar que després d’un oblit confirmat no reapareixen registres. Cap reparació aplicada per Codex.

#### Resultats acotats del tall

| Bloc | Resultat | Límit |
|---|---|---|
| Finestreta | 8 fitxers, **364 proves passen**. Cap regressió nova confirmada en selecció massiva, relectura amb hash/MIME, comprovació d’aprovació i revocació de blob. | Visor PDF real, CSP i bloqueig de finestres dels navegadors no exercitats. No revalida GES-01–04. |
| Tractors, Workspace i Agenda | 5 fitxers, **105 proves passen**, inclosa eliminació del botó i crida DEV en la compilació de producció de la sonda. | VIG-01 queda fora de la cobertura existent. Cap QA visual exhaustiva. |
| Dades seed/remotes | 12 fitxers, **261 proves passen**, sense fallades ni omissions. Rentonar no hereta l’owner pilot; el xat remot manté el rebuig de destinataris seed sense UUID. | La conformitat remota usa dobles del servidor; no acredita Supabase desplegat ni API real de Sollutia. |
| Reproducció VIG-01 | **2 casos `[DEFECTE WIP]`** en directori temporal, un de confirmació i un de signatura. | Cap ús de dades ni magatzem personals. |

En total, **730 proves funcionals passen**, a més de les dos reproduccions del defecte. No s’ha repetit la bateria general de 17.283 casos. Model B: cap canvi observat en `backendPort.js`, adaptadors de Supabase remots ni Frontissa Sollutia. La selecció massiva de Finestreta marca només «demanar», no llig bytes; la relectura comprova aprovació, vetats, tipus i hash. Les URL es revoquen en perdre la Font o tancar el cofre; la documentació advertix que això no buida una pestanya que ja ha carregat el PDF.

CON-07 ha canviat respecte de la base: el selector ja no té subratllat, hereta el radi de píndola i usa la parella de colors revisada; el propi comentari CSS registra un desbordament d’uns 6 px a 375 px pendent de decisió visual. No es presenta eixe pendent documentat com una regressió sorpresa ni com una decisió autoritzada a Codex.

Comandes de la ronda:

```bash
./node_modules/.bin/vitest run src/sections/gestoria/finestreta --maxWorkers=2 --reporter=dot
./node_modules/.bin/vitest run src/sections/tractors/useTractors.test.jsx src/sections/tractors/PanellTractors.test.jsx src/sections/tractors/PanellTractors.produccio.test.js src/css/jerarquiaWorkspace.capes.test.js src/components/PedraSeca/organismes/VistaAgenda.test.jsx --maxWorkers=2
./node_modules/.bin/vitest run src/data/appSeed.onboarding.test.js src/data/appSeed.fantasmes.test.js src/data/identitatsSeed.autoria.test.js src/data/localPerfils.test.js src/data/localXat.test.js src/data/supabase/perfils.fundacionals.test.js src/data/supabase/perfils.test.js src/data/supabase/xat.test.js src/data/supabase/xat.destinatari.test.js src/data/supabase/conformitat.test.js src/data/conformitat/kit.test.js src/apps/plataforma/autoria.test.js --maxWorkers=2 --reporter=json --outputFile=/private/tmp/sdp-review-seed-0137.json
```

Logs locals de la ronda: `/tmp/codex-gestoria-wip-vitest-0137.log`, `/tmp/sdp-vigilancia-261014-0137-tractors-css.log`, `/private/tmp/sdp-review-seed-0137.json` i `.log`, i `/tmp/sdp-vigilancia-261014-0137-race.log`. Reproducció VIG-01 a `/private/tmp/sdp-vigilancia-261014-0137/race.test.jsx`: reutilitza les fixtures sintètiques de la capçalera de `useTractors.test.jsx`, amb imports absoluts, i afegix estos casos:

```js
test('[DEFECTE WIP] oblidar durant lot no impedix que reapareguen aprovacions', async () => {
 const base=crearMagatzemMemoria(); let allibera, entrades=0;
 const espera=new Promise(r=>{allibera=r});
 const magatzem={...base,afegixRegistre:async r=>{entrades++; if(entrades===1) await espera; return base.afegixRegistre(r);}};
 const cataleg=catalegTractors([manifest(),manifest({id:'prova.segon',nom:'Segon de prova'})],GLOB);
 const {result}=await munta({magatzem,tractors:cataleg});
 let lot;
 await act(async()=>{lot=result.current.aprovaTotsPendents();});
 await waitFor(()=>expect(entrades).toBe(1));
 await act(async()=>{await result.current.oblidaTot();});
 expect(await magatzem.registres()).toEqual([]);
 await act(async()=>{allibera();await lot;});
 expect((await magatzem.registres()).map(r=>r.tractor)).toEqual(['prova.lector','prova.segon']);
 expect(result.current.tractors.map(t=>t.estat)).toEqual(['aprovat','aprovat']);
});

test('[DEFECTE WIP] catàleg de signatura: torna el registre, però la porta el deixa pendent sense clau', async () => {
 const base=crearMagatzemMemoria(); let allibera, entrades=0;
 const espera=new Promise(r=>{allibera=r});
 const magatzem={...base,afegixRegistre:async r=>{entrades++; await espera; return base.afegixRegistre(r);}};
 const aut=await creaAutenticador(); const credentials=credencialsFalses(aut);
 const {result}=await munta({magatzem,tractors:[CATALEG[1]],entorn:entornAmb(credentials)});
 await waitFor(()=>expect(result.current.webauthn).toBe(true));
 let lot;
 await act(async()=>{lot=result.current.aprovaTotsPendents();});
 await waitFor(()=>expect(entrades).toBe(1));
 await act(async()=>{await result.current.oblidaTot();});
 expect(await magatzem.registres()).toEqual([]); expect(await magatzem.claus()).toEqual([]);
 await act(async()=>{allibera();await lot;});
 expect(await magatzem.registres()).toHaveLength(1);
 expect(await magatzem.claus()).toEqual([]);
 expect(result.current.tractors[0].estat).toBe('pendent');
});
```

Punt de comparació per al pròxim despertar: manifest ordenat de `src`/`tooling`, SHA-256 `7596f12ceca74b11178eae1ebaa9bee77a1455a3a24d6c1e6b3f08fa39c05d4f`; còpia local `/tmp/sdp-vigilancia-261014-0137-code.json`. Per sobreviure a la neteja de temporals, es preserven les empremtes dels 32 fitxers diferents de la base:

```text
84e84de96449553b995fd662c597a5da3d318f1ffae22183ece017e1caac1eda  src/app/App.test.jsx
385d60184723742a549887316ba537959b06655dc3d1870f9d3c800d79914a1a  src/components/PedraSeca/organismes/VistaAgenda.test.jsx
15bce43800e50eec9bcc13329668a5cc305ab590f84cfb5362ee108bf1be0c16  src/css/jerarquiaWorkspace.capes.test.js
1086f1d2439f5983ff43fdf140f36c58b094390fa718e6013fd3670993ad1473  src/css/modules.css
b2339c7e13e4e04b2d6125a60ed318c8281b2e9404beab642e76aa1e9fd35592  src/css/tokens.css
758c49ccbff4d04bc916945247d05c83bee13077573b51f302cbe75a42d16f7c  src/data/appSeed.js
53fa7978ad1f7e8164daed1c616a60df9915f1e460e4cc54dc15704931b5a6a2  src/data/appSeed.onboarding.test.js
046f4ec6ce8f75580d5f477ca94b3a2d99519b7454916a7cd1c14502bfed5aa5  src/data/conformitat/kit.js
3eae2ac2e797773bc859e185207b88c87289ff62f89298af4436fd75bc3d04bb  src/data/identitatsSeed.js
b54972117dfdc319e115c2745eed0680df65402ea10f7b9bdf01f89f5d249673  src/data/localPerfils.test.js
3751c47160e1ae7ac35815c90236bb121314bd8681dc67bba2dbadc14dde4a9d  src/data/localXat.js
aa98ad1c633bdcd4fbe978157b2193ff54c2398e198bced4766c1c6be851714e  src/data/localXat.test.js
8cc529eaf5eb3c60da23c518d4111c91f67f5f43ac2f0fd0186e245c21b0fac3  src/data/qualitat.test.js
6e4319e689fe0ec0df81fefbfb42c60e28823331499958954ad6d318149cf06c  src/data/supabase/perfils.fundacionals.test.js
c9694931796e1c50628490a454d38f3fb4e579f381815d2c4827d9c8426962a1  src/data/xatSeed.js
3323e0961cb0a1701ebb40342b7fe9dacbe4df598b184b54015ee87f94fbbadf  src/sections/disseny/cataleg/detalls/EspecimenCalendari.jsx
46badb0181bfb7982b67b385a2b1c2c3aaeaf19f53b96df5f95b55c7e9d80d2e  src/sections/gestoria/finestreta/Finestreta.jsx
bb701f2eba3517e184ae1b7d33da44a951e6c5aa665e62b4e1ab23624f9a28a8  src/sections/gestoria/finestreta/Finestreta.test.jsx
fee6014daf4f1ffb5b84b0dbceb73152d61674e61da012b84c8ac4213ad33a2d  src/sections/gestoria/finestreta/nucli/tractorIdentitat.js
3538acba6d2aaf3163cbf27f792fc0c00f3a4313263ce21a8027c3c598435cfb  src/sections/gestoria/finestreta/nucli/tractorIdentitat.test.js
4035ea565ea2b8aff60d581dcf55a48486e393f52146791e3fd02709513cad0c  src/sections/gestoria/finestreta/useFinestreta.js
948f7d6162dfc0adaa294e7c5aef2530ef40018d9f351899553886592e6e7852  src/sections/gestoria/finestreta/useFinestreta.test.jsx
0a8783a6439cb3d86aff3c4c31acfd25dcbe8b19d16c3c6822fb500cd9469be9  src/sections/gestoria/fitxes/gestoria_identitat.md
b5755a8112bda85144bc869bf1a2e853b7eb7c415135bc2c5b0d455cf5fe0c53  src/sections/gestoria/privacitat.test.js
b8014e5b4fd20f11d588dac6c2316493369ffd1cb321a961de5c1dff1cd68014  src/sections/gestoria/tractors.js
62315fff717224570cd80cbee108de59c73ff066f41466fe3fe7c7c9c37dbb57  src/sections/tractors/PanellTractors.jsx
4e4a9c6377048d5216b4e39657dec557ee2592ead7be3c0da770bd868e1aa7e6  src/sections/tractors/PanellTractors.produccio.test.js
38f113f8afabe91ceb077508293c1dd8e91936b8492cdd6db5163eb1b2244f28  src/sections/tractors/PanellTractors.test.jsx
d8104ea5406ac44c16856582321c01d9e70b0000218c82fa640983c994cad3b1  src/sections/tractors/qualitat.test.js
a6614de8c8d6d58feec8a20258e54cd5f8fe22248eef5db84f816889a94e5f59  src/sections/tractors/useTractors.js
43404b96254813da8323d8ce019fbf417f1030a1531c148d3d6ae4c37f888743  src/sections/tractors/useTractors.test.jsx
7e86b4d71230b6581db389ba2d29949b326a56e8f4e0845e6207729ee8e477ee  src/sections/wiki-de-poble/WikiDePobleSection.einesLocals.test.jsx
```

La vigilància continua activa per ordre humana; esta ronda acaba sense deixar proves ni subagents treballant. Només el planificador farà el següent despertar. En detectar un informe final real de MarIA o Claude amb totes les proves verdes, es cancel·larà el heartbeat sense exigir corregir les incidències SCC globals prèvies.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat i abast |
|---|---|
| Porta Olivera inicial | Eixida 0; sediment d'índex: 840 línies i 12 seccions buides, no bloquejant. |
| `tractor-graella.mjs` | PASS, amb dependència viva de `contracte_graella.md`. |
| Vitest Escàner + Finestreta | 12 fitxers, **451 proves passen**. |
| Vitest Tauler/cofre/diners/c43/moviments/conciliació/fronteres/privacitat | 24 fitxers, **481 proves passen**. Total Gestoria: **932**. |
| Vitest consola/control/Kowalski | 52 fitxers, **936 passen, 1 omesa**. |
| Dos casos `[DEFECTE]` useFontDev en directori temporal | **2 reproduccions passen** perquè acrediten el comportament incorrecte; no són proves de correcció. |
| Laboratori original: Parròquia + logotips + Olivera | **26 passen, 10 omeses**, cap fallada. |
| Còpia temporal: anteriors + higiene, abans | **26 passen, 17 omeses**, 43 casos. |
| Mateixa còpia sense les 19 entrades | **20 passen, 14 omeses**, 34 casos; **6 verdes perdudes i 9 casos menys**. |
| Control addicional sense #41 Parròquia | **19 passen, 1 falla, 1 omesa**; ENOENT MAPA_IMATGES. Fora del trasllat de les 19. |
| Node laboratori original, set fitxers | **39 passen, 34 fallen, 4 omeses**: roig previ. |
| Node mateixa còpia abans | **35 passen, 38 fallen, 4 omeses**; quatre fallades extres de context respecte de l'original. |
| Node mateixa còpia sense les 19 | **24 passen, 2 fallen, 51 omeses**. Cap nom nou passa a fallar; no equival a conservar cobertura. |
| Plantilla-viva sobre originals | **6 passen, 2 fallen, 2 omeses**; errors previs del bloc Context. |

La còpia de laboratori omet `.git`, runtime, producció humana i arxiu. És un experiment controlat de dependències, no certificació global de regressió. Els quatre errors addicionals de context pertanyen a la còpia abans del trasllat (fonts-vigilancia real, paquet/mirall, còpia tooling i bateria v3). La comparació vàlida és entre els dos estats d'eixa mateixa còpia.

Comandes enfocades, sempre amb el Vitest local i sense descàrregues:

```bash
./node_modules/.bin/vitest run src/sections/gestoria/escaner src/sections/gestoria/finestreta --maxWorkers=2
./node_modules/.bin/vitest run src/sections/gestoria/tauler src/sections/gestoria/cofre src/sections/gestoria/nucli/diners.test.js src/sections/gestoria/nucli/c43.test.js src/sections/gestoria/nucli/movimentsBanc.test.js src/sections/gestoria/nucli/concilia.test.js src/sections/gestoria/fronteraModelsPurs.test.js src/sections/gestoria/privacitat.test.js --maxWorkers=2
./node_modules/.bin/vitest run src/sections/consola src/sections/control src/css/kowalskiMurConsola.capes.test.js --maxWorkers=2
./node_modules/.bin/vitest run src/apps/bar/llavors/laParroquia.test.js tests/laboratori-logotips-261009.test.js tests/laboratori-olivera-261006.test.js tests/laboratori-higiene-261006.test.js --maxWorkers=2
node --test --test-concurrency=2 tests/plantilla-viva-installacio.test.mjs tests/governanca-260930-lease.test.mjs tests/governanca-260930-mapa.test.mjs tests/governanca-260930-maria.test.mjs tests/governanca-260930-olivera.test.mjs tests/governanca-260930-t1.test.mjs tests/fatiga-261002.test.mjs
```

**Evidència de sessions.** Logs provisionals en `/private/tmp/sdp-lab-*` i `/tmp/sdp-auditoria-261014-consola-tests.log`; els resultats rellevants i reproduccions es conserven en este informe perquè el dictamen no depenga de temporals. La còpia de laboratori ha sigut eliminada, mai els originals.

### Reproduccions sintètiques de Gestoria

Les quatre eixides observades, amb imports i fixtures autocontinguts en l'annex executable de baix:

```jsonl
{"cas":1,"seleccionats":["bancs/banc_a.csv","bancs/banc_b.csv"],"avisos":[],"moviments":2,"caixa":{"saldo":90000,"completa":true,"comptes":1,"exclosos":[],"motiu":null}}
{"cas":2,"parser":[{"codi":"SALDO","severitat":"alta"}],"avisosGlobals":[],"avisosCompte":1,"caixa":{"saldo":990000,"completa":true,"comptes":1,"exclosos":[],"motiu":null}}
{"cas":3,"camps":[{"id":"cognomsNom","valor":"PROVA, ANNA","estat":"llest"},{"id":"referenciaSuma","valor":"OBJ123456","estat":"llest"}]}
{"cas":4,"destinataris":["tit_abababababababab","tit_acacacacacacacac"],"tributs":[{"titular":"tit_abababababababab","fonts":["suma_a.pdf","suma_b.pdf"]}]}
```

Executar des de l’arrel del repositori. Només transforma dades sintètiques en memòria:

```bash
node --input-type=module <<'JS'
import { analitzaCarpeta } from './src/sections/gestoria/escaner/nucli/escaner.js';
import { llegeixMovimentsCsv } from './src/sections/gestoria/nucli/movimentsBanc.js';
import { llegeixC43 } from './src/sections/gestoria/nucli/c43.js';
import { reduixC43 } from './src/sections/gestoria/tauler/nucli/tractorTauler.js';
import { comptesDe, resumTauler } from './src/sections/gestoria/tauler/nucli/resumTauler.js';
import { fitxaBuida, afegixTitular, afegixTribut, entraAMa, fusionaPropostes, nouIdFitxa } from './src/sections/gestoria/finestreta/nucli/fitxaIdentitat.js';
import { FORMULARIS, omplixFormulari } from './src/sections/gestoria/finestreta/nucli/formularisFinestreta.js';
const out = x => console.log(JSON.stringify(x));
const routes = ['bancs/banc_a.csv', 'bancs/banc_b.csv'];
const scan = analitzaCarpeta({
  entrades: routes.map((ruta, i) => ({ ruta, mida: 100 + i })),
  formats: Object.fromEntries(routes.map(r => [r, 'csv-tauler']))
});
const csv = (saldo, import_) => ({
  lectura: llegeixMovimentsCsv(
    `Fecha,F. valor,Concepto,Importe,Saldo\n2026-10-13,2026-10-13,prova,${import_},${saldo}`
  )
});
const c1 = comptesDe({ csv: [csv('900.00', '-100.00'), csv('1800.00', '-200.00')] });
out({ cas: 1, seleccionats: scan.extractes.filter(e => e.preseleccionat).map(e => e.ruta),
  avisos: c1.avisos, moviments: c1.comptes[0].moviments.length, caixa: resumTauler(c1).caixa });
const n = (x, len) => String(x).padStart(len, '0');
const t = (x, len) => String(x).padEnd(len, ' ').slice(0, len);
const key = '999900010000004321';
const rows = [
  `11${key}2610012610132${n(100000, 14)}9783${t('SINTETIC', 26)}${t('', 3)}`,
  `22${t('', 4)}0001261013261013990001${n(10000, 14)}${n(0, 10)}${t('', 12)}${t('', 16)}`,
  `33${key}${n(1, 5)}${n(10000, 14)}${n(0, 5)}${n(0, 14)}2${n(990000, 14)}978${t('', 4)}`
];
const raw = rows.concat(`88${'9'.repeat(18)}${n(rows.length, 6)}${t('', 54)}`).join('\r\n');
const lectura = llegeixC43(raw);
const c2 = comptesDe({ extractes: [{ lectura: reduixC43(lectura) }] });
out({ cas: 2, parser: lectura.avisos.map(a => ({ codi: a.codi, severitat: a.severitat })),
  avisosGlobals: c2.avisos, avisosCompte: c2.comptes[0].avisos, caixa: resumTauler(c2).caixa });
const ara = '2026-10-14T00:00:00Z';
const id = (prefix, value) => nouIdFitxa(prefix, new Uint8Array(8).fill(value));
const A = id('tit', 1), B = id('tit', 2), E = id('tit', 3), T = id('trb', 1);
let f3 = afegixTitular(fitxaBuida(), {id:A,tipus:'persona',ambit:'LLAR',alies:'Persona A'});
f3 = afegixTitular(f3, {id:E,tipus:'entitat',ambit:'ENTITAT',alies:'Entitat E'});
f3 = entraAMa(f3, {titular:A,camp:'identificacio.nom',valor:'Anna'}, {ara});
f3 = entraAMa(f3, {titular:A,camp:'identificacio.cognom1',valor:'Prova'}, {ara});
f3 = afegixTribut(f3, {id:T,titular:E});
f3 = entraAMa(f3, {titular:T,camp:'tribut.referenciaSuma',valor:'OBJ123456'}, {ara});
const form = omplixFormulari(FORMULARIS.find(f => f.id === 'suma-sollicitud'), f3, {tribut:T});
out({cas:3,camps:form.camps.filter(c=>['cognomsNom','referenciaSuma'].includes(c.id)).map(({id,valor,estat})=>({id,valor,estat}))});
let f4 = fitxaBuida();
for (const [tit, alies] of [[A,'Persona A'],[B,'Persona B']]) {
  f4=afegixTitular(f4,{id:tit,tipus:'persona',ambit:'LLAR',alies});
}
const proposta = (ruta, hash) => ({
  titularRol:'tribut',camp:'tribut.referenciaSuma',valor:'OBJ123456',
  font:{tipus:'document',ruta,sha256:hash.repeat(64),tipusDocument:'suma',regla:'ref-suma'}
});
f4=fusionaPropostes(f4,[proposta('suma_a.pdf','a')],{desti:{persona:A}});
f4=fusionaPropostes(f4,[proposta('suma_b.pdf','b')],{desti:{persona:B}});
out({cas:4,destinataris:[A,B],tributs:f4.tributs.map(t=>({titular:t.titular,fonts:t.camps['tribut.referenciaSuma'].fonts.map(f=>f.ruta)}))});
JS
```

### Reproducció aïllada del contracte de useFontDev

Fitxer temporal `hook.test.js`, amb import del hook substituït per la ruta absoluta del repositori auditat. Vitest en entorn `jsdom`, sense escriure tests en `src`:

```js
import {act,cleanup,renderHook} from '@testing-library/react';
import {test,expect,vi,afterEach} from 'vitest';
import {useFontDev} from "/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/useFontDev.js";
afterEach(()=>{cleanup();vi.unstubAllEnvs();});
test('[DEFECTE] actiu false encara permet carrega manual',async()=>{
 vi.stubEnv('DEV',true);const carregador=vi.fn(async()=>({n:1}));
 const {result}=renderHook(()=>useFontDev(carregador,{actiu:false}));
 expect(carregador).not.toHaveBeenCalled();await act(async()=>result.current.carrega());
 expect(carregador).toHaveBeenCalledTimes(1);expect(result.current.estat).toBe('ready');
});
test('[DEFECTE] desactivar conserva ready i dades anteriors',async()=>{
 vi.stubEnv('DEV',true);const carregador=vi.fn(async()=>({n:1}));
 const {result,rerender}=renderHook(({actiu})=>useFontDev(carregador,{actiu}),{initialProps:{actiu:true}});
 await act(async()=>{});rerender({actiu:false});
 expect(result.current.estat).toBe('ready');expect(result.current.valor).toEqual({n:1});
});
```

Configuració temporal emprada:

```js
export default {test:{environment:"jsdom",maxWorkers:1,include:["*.test.js"]}};
```

### Integritat i tancament

Verificació final SHA-256: **774/774 fitxers de producció i laboratori idèntics**, sense afegits ni absències; **2.297/2.297 fitxers de `src` i `tooling` idèntics**, sense afegits ni absències. Manifest conjunt de protegits: `f9aca22d7cb5020e4d51799eb124f685d872b11eb7288ec8ec5ff1ab83cf23f8`; manifest de codi: `91814aff9fa3e691a47fd1216efaba9210b417aed7a57be2f6aa8e0b45d71699` (JSON ordenat ruta→SHA-256).

Relleu d’ESTAT i LEDGER executat amb dues leases de `governance-write` explícites i consumides. Transaccions `64188e59-0dff-44d4-adbd-c7cf397567bf` i `31ea6412-9ec0-409e-9000-727b8561a59c`. S’ha preservat tot el contingut previ; LEDGER i segell de skills verificats. Els rebuts i el segell són derivats mecànics del circuit. Cap agent de l’equip ha creat un monitor ni deixa processos actius.

`document.mjs check --turn-id … --file …`: **vàlid, sense errors**. `tancament.mjs --check --turn-id …`: **eixida 1**. Passen Olivera, plantilles, autoritat, LEDGER, segell, skills i compilació Wiki estricta; falla SCC amb **437 incidències globals**: 10 `LINK_INVALID`, 408 `ESCRIPTORI_UNANCHORED` i 19 `ORPHAN_OPERATIVE`. Cap incidència es referix a este informe o al seu torn. Entre els casos hi ha un enllaç antic d’arqueologia no resolt, documents del laboratori/producció no ancorats i actes operatives òrfenes.

El contracte documental del torn i la integritat de la zona humana passen. **No es declara el repositori globalment sanejat ni el torn segellat com a tancat**; es manté `planned` perquè el verificador global és roig. No s’ha executat `--close`, no s’han alterat els controls ni corregit massivament 437 entrades fora d’abast. L’estat persistent d’un torn no és un procés o un cron en execució. L’informe queda emés amb esta limitació explícita.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Lectura íntegra dels documents actius de primer nivell: índex, estudi del laboratori, pla 1930, prompt de Claude 1930 i encàrrec Codex 2355; també metadada `.ancora_sessio.json`. Llegits AGENTS, BOOTSTRAP, Genotip, índex mestre, estat actual, taxonomia, workflow, circuit documental, plantilla viva i Pedra Seca. Els fragments de codi/proves i binaris són una inspecció dirigida; no es declara lectura semàntica íntegra dels 774 fitxers protegits.

L'equip delegat ha inspeccionat les 27 entrades i les 19 dependències. Només s'han consultat informes històrics identificats per traça d'integració (pla `261001_Sessio_Matinada/260930_2135_pla_implementacio_claude.md:54`, auditoria `261006_2250_auditoria_claude.md:170-177`, prompt `261006_1140_prompt_claude.md:63,70` i informe `261008_1352_informe_progres_claude.md:56`). No s'ha fet ingesta automàtica de l'arxiu històric ni s'ha usat com a còpia normativa del cervell.

No s'ha comprovat la fidelitat visual de cada captura, la semàntica dels àudios, còpies fora del repositori o dins de tots els comprimits, normativa fiscal, ni recursos externs de l'estudi. La cerca de duplicats per hash exclou `.git`, `node_modules`, `dist`, `.vite`, `coverage` i `.sdp-reflex`; el ZIP de `builds/` sí s’ha hashejat. L'absència de duplicat és respecte d'eixe univers. Cap lectura de documents financers reals per a les reproduccions i cap xarxa externa per a dades privades.

No s'han modificat aplicació, tests, tooling, dependències, plantilles ni regles de governança; l'únic lliurable d'auditoria és este document, amb el seu ancoratge i relleu mecànic obligatori. En el dictamen inicial no s'ha publicat, desplegat ni creat cap monitor; la vigilància posterior consta a la ronda 6. La inspecció local trobà quatre automatitzacions Codex anteriors totes `PAUSED`; no hi havia monitor Codex actiu d'esta missió a cancel·lar. Els LaunchAgents de Time Machine i Plaquetes són infraestructura preexistent; no s'han desactivat com si foren treballs d'este torn. El cron de MarIA esmentat al prompt no s'ha identificat com a programació accessible d'esta missió: no es declara cancel·lat sense evidència.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261013_1600_estudi_destil_laboratori_ia]]
- [[261013_1930_pla_implementacio_jerarquia_taronja_i_operativitat]]
- [[261013_2355_prompt_codex_sanejament_produccio_i_laboratori]]
