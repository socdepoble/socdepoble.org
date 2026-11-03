---
type: acta
status: esborrany
description: 'Tres kits CAS verificats i dipositats per a Claude: generador canònic, consumidor F7 de lectura i build sense Finder; 540 Vitest i 46 Node, amb E2EE apagat.'
tags:
  - acta
visibility: private
reflex: sdp:torn_858b8642-1deb-48dd-a79e-da025c5d6abe:d85a37ca-2bf1-49b8-86c9-d053724ccc2d
---
# Acta Marmota · Lliurament dels tres kits Codex de l’Onada 3 del Teler Invertit

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_858b8642-1deb-48dd-a79e-da025c5d6abe:d85a37ca-2bf1-49b8-86c9-d053724ccc2d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T19:16:46.039Z |
| Modificació | 2026-11-02T19:16:46.039Z |
| Propietari | Codex |
| Aprovació humana | Ordre directa del Mestre: carrils O3-CODEX-1/2/3 i kits en còpia aïllada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | Codex, basat en GPT-6; identificador exacte del backend no exposat |
| Tokens consumits | No exposats per la telemetria disponible |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 4d4b9d269e40c3084dead7c3f14cf63dd58fd4a7e7f4d075d2d09ef90f8a6d48. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- Primer rebut observat: 2026-11-02T19:54:14+01:00, torn `torn_858b8642-1deb-48dd-a79e-da025c5d6abe`. Entrada per Acta Marmota1929, estat actual, prompt1918 íntegre i fonts canòniques.
- 2026-11-02T20:19:16+01:00: tres carrils construïts, corregits per doble parell i dipositats amb CAS verificat. Auditoria1638, Llibre Mestre, ESTAT i LEDGER actualitzats; documents vigents conservats per a Claude. No s’ha consumit ni arxivat l’onada sencera, que continua amb els altres dos rols.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### Lliurament tècnic

Tres kits sota `../_investigacio_ia_de_poble/`, amb LLEGEIX_ME, manifest CAS i modes, payload, preimatges, canvis.patch, lliurament.json, evidència i SHA256SUMS verificat després del dipòsit:

- **261102_kit_codex_kit_carril:** tooling/gates/kit-carril.mjs, tests/kit-carril.test.mjs i tooling/tests/node-suite-manifest.json. CAS estricte, staging complet, lock cooperatiu i rollback capturable; Frontissa de confiança sobre candidat. 29 proves pròpies +9 de política i 29 independents. La CLI per symlink i la divergència d’una precondició del candidat provat fallaven: reproduïdes i corregides abans de congelar. L’aplicador no promet transacció multi-fitxer davant SIGKILL ni bloqueja editors aliens.
- **261102_kit_codex_recuperacio_consumidor_ui:** consumidor i24 proves a src/data/recuperacio/, lectura readonly/token de cerimònies i suport de lectura de material. 46 precondicions sobre la cadena F7, sense reempaquetar-la. SAS només local complet, SDPN amb firma real, zero booleans d’autoritat de UI i zero escriptures de registres durant la lectura. Doble parell reproduí/corregí revocació foreign-tab durant await, cancel·lació remota encara comptant SAS, instal·lació d’epoch en lectura i disputa local després del snapshot. 483 F7 passades +1 omesa històrica, 7 comprovacions independents finals. El contracte públic és llegix(pid,{signal})/tanca; no entrega material ni accions.
- **261102_kit_codex_build_net_dsstore:** plugin Vite, registre al config web, prova dedicada i manifest Node. Exclou .DS_Store, .DS-Store i ._* abans d’emetre public/, conserva .well-known i generadors, no altera la font i saneja l’eixida incremental sense seguir symlinks. WP/natiu mantenen filtre previ; modular sense còpia de public/. 8 proves noves i84 regressions passades amb5 omissions històriques.

Root ha reconstituït una còpia nova des de l’arbre brut inicial (HEAD4ee8d78c40b85cb3c6ce6914feb0b04557c3a50c), aplicat els kits i la cadena F7 amb preimatges/hashes verificats i passat **540 Vitest +1 omesa en24 fitxers, 46/46 Node, lint net, Frontissa16/16 i Design Guard3055/0/0**. L’omissió Shamir conserva la porta externa pendent. Els pegats passen git apply --check; re-aplicacions dels tres kits es rebutgen sense canvis persistents ni lock orfe.

Build web complet en còpia exclusiva:893 fitxers, zero Finder, entrada235.375 B gzip sota250.000 B; configuració pública sintètica i mode local. Un segon build del constructor havia buidat l’eixida d’una prova concurrent dins d’una primera còpia: es repetí en una còpia exclusiva i s’ha conservat només esta última com a evidència de l’artefacte. L’avís de chunks grans continua visible.

### Decisió termodinàmica i context

El treball pesant i les revisions han sigut del carril Codex, sense consultar Claude ni crear cap seguiment recurrent. No s’ha llegit quota real, canviat model, utilitzat crèdits o declarat cap restabliment no observat. No s’inferix estat emocional del Mestre ni estalvi numèric. L’equip ha llegit íntegrament els documents vius de primer nivell, amb lectura distribuïda del Llibre/índex i prompt1532; l’ordre1918 substituïx els antics bucles de30m.

Cap font del producte escrita al viu per Codex: els hashes de totes les rutes dels carrils continuen iguals a l’entrada. Només relleu documental, sense commit, deploy, SQL remot, secrets ni dependències noves. E2EE continua apagat. Sis automatitzacions Codex existents PAUSED, antic heartbeat eliminat i cap timer nou.

### Aprenentatge per a l’onada següent

El manifest Node és una ruta compartida entre constructors: cal ordre d’aplicació o rebase explícit conservant totes les suites, mai force. Les precondicions han de fixar tant el destí com el candidat provat. La verificació del lliurament s’ha de fer sobre bytes congelats: root detectà un últim canvi de la cota d’historial després d’una congelació preliminar i regenerà/aplicà el kit definitiu abans de repetir540 proves. Proposta per a la plantilla: distingir final de carril i transició de l’onada completa, així es conserva el context necessari dels altres agents sense arxivaments prematurs. No s’ha modificat la plantilla fora de carril.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Claude, Àrbitre/materialitzador:** revisar LLEGEIX_ME i manifest de cada kit; Kit Carril primer, build net després. Si Gemini ja ha ampliat el manifest Node, rebase estricte conservant totes les proves.
2. **F7 abans consumidor:** idea48→restauracio→diposit→rpc→observacio→cancel→material→consumidor. Cancel s’ha inclòs en la verificació i no és una acció de l’API de lectura. No executar precondicions antigues després de material.
3. **Responsables de producció/criptografia:** integració visual, sessió i persistència física reals, revisió externa de protocol i quarantena del viu; no certificats per estos kits. Els snapshots entre BDs independents no garantixen frescor després de l’última lectura. Claude confirma al relleu T-08 la materialització de les dues regressions històriques; root ha copiat només els seus cinc canvis al laboratori i ha revalidat62/62 en les cinc suites exigides.
4. Tancament global comprovat:8/8 portes verdes. El segell estricte del torn es rebutja per cinc canvis de codi aliens i quatre captures humanes posteriors a l’obertura; captura2017 ancorada, bytes humans i baseline intactes. Es documenta el límit, sense declarar el torn closed.
5. Cap bloquejant pendent de construcció dels tres carrils. Cap temporitzador o automatització nova que haja de continuar després d’este xat. El resultat formal de tancament queda al registre del torn.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261102_1638_auditoria_codex]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[../90_arxiu_historic/261102_1918_prompt_teler_invertit_onada3_codex_gemini_constructors_claude_arbitre|261102_1918_prompt_teler_invertit_onada3_codex_gemini_constructors_claude_arbitre]]
