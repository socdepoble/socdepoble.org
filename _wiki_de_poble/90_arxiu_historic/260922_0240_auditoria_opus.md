---
type: informe
status: esborrany
description: Auditoria actualitzada de fortificació, contracte documental, graf, sincronització i expedient OEPM amb proves del torn.
visibility: private
reflex: "Llegits prompt_local.md, auditoria_canonica.md, pla.md i protocolledge.json; torn_1790037477445. Declaració de lectura, no rebut autenticat."
tags:
  - auditoria
  - fortificacio
  - codex
---
# Fortificació final: auditoria de l’estat real

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-260922-0240 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; branca backup-notes-publish |
| Creació | 2026-09-22 02:40 Europe/Madrid |
| Modificació | 2026-09-22 02:45 Europe/Madrid |
| Propietari | Agents Locals — Codex |
| Aprovació humana | Pendent del pla; auditoria executada per encàrrec |
| Autoria | Codex; sufix opus conservat per instrucció expressa de la petorreta |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Dictamen

El Bloc A millora la connexió amb Claude, però **el contracte documental no està garantit**. Les cinc evasions de la revisió 0136 continuen passant. Les ordres encara divergeixen entre plantilla, guia, router i codi, i els controls no acrediten ni el torn ni el compliment de les seccions. Afegir més text a les skills no resol aquest problema.

La solució proposada és un contracte executable únic, amb generació guiada, comprovació comuna independent de l’eina d’escriptura i torns persistents. Pot garantir estructura i traçabilitat observables; cap rebut pot demostrar comprensió mental ni prometre que una IA no s’equivoque mai.

El graf ja està implementat parcialment: no cal començar de zero. La sincronització des dels Markdown continua absent. El lint torna a tindre un error. L’OEPM confirma un suspens que obliga a actualitzar l’estat burocràtic.

## Acte reflex i historial de l’experiment

Abans de redactar s’han llegit íntegrament la plantilla local, el router, la guia d’auditoria i la plantilla del pla, així com les skills sdp-workflow i wiki-documentacio-i-reflex. S’ha consultat wiki-busca-skills, nom viu del procediment que el workflow encara cita com skill-busca-skills.

Seqüència heretada: Part 2 de MarIA → auditories 0054/0056 → Bloc A 0125 → revisió Codex 0136 → unificació del Workspace i Acta Marmota 0235 → present auditoria. S’han consultat directament el pla Opus 0054 i l’auditoria Codex 0136 de l’arxiu perquè l’encàrrec demana revisar-los; no s’ha ingerit l’arxiu en RAG ni s’ha fet cap bundle.

ESTAT i LEDGER identifiquen P0/P1 com a pendents. ON_ESTIC té data 00:36:52 UTC, però una data fresca no prova per si sola l’activació automàtica del hook. L’arbre ja contenia canvis de MarIA/Claude, inclosos porta-reflex, tests, graf i pàgines; no s’han sobreescrit ni s’han fet commits.

## Proves executades

| Comprovació | Resultat d’aquest torn |
| --- | --- |
| npm run lint | 378 problemes: 1 error i 377 avisos; no passa --max-warnings=0 |
| node --test tests/porta-reflex.test.mjs | 17 passen; 0 fallen |
| Cinc payloads Write adversarials enviats a porta-reflex | Tots retornen 0; cap document invàlid escrit |
| cataleg_skills.mjs --check | Verd, 16 skills |
| tractor-atomic.mjs | Verd |
| obrir_torn.mjs --json | Retorna torn_1790037477445, sense persistència |
| Inventari del runner importat | 50 passos, no 48 |
| Manifest existent | 135 ítems, 0 IDs duplicats; 100 de 606 referències no resolen |
| Tancament en còpia temporal reduïda | Exit 1; dos errors d’estil; el manifest canvia amb --check |
| Inventari .brain-reports | 5 fitxers; 4.902.758 bytes |
| Inventari .brain-trash | 45 fitxers; 1.441.728 bytes |
| 04_escriptori/02_investigacio_ia | Cap fitxer; prompt especial no recuperat d’aquesta carpeta |

El recompte de referències prové de cercar ?item= al manifest existent i comparar destins amb els IDs; inclou possibles exemples dins del contingut i no és una prova de navegació al navegador. No s’ha executat la cadena completa ni el build perquè són processos amb efectes laterals i el lint ja falla. No hi ha certificat global verd.

## Troballes amb evidència i reparació

### C01 — Alta: una declaració lliure substitueix el rebut

**Scope:** tooling/gates/porta-reflex.mjs, funció validar. Només exigeix 20 caràcters a reflex per a prompt/informe/acta. Un informe amb reflex inventat, sense Registre ni historial, passa. El mateix passa amb status patata, recipient fantasma i type duplicat. **Conflicte:** schema.json limita enums i propietats; la petorreta exigeix actes reflexos i historial. **Reparació:** parser únic, esquema complet, seccions per tipus i registre extern de torn/plantilla/artefacte. `requires_human_decision: false` sobre la correcció; P0 del pla fixa el contracte abans d’implementar-lo.

Reproducció mínima, des de l’arrel del repositori:

```sh
node --input-type=module <<'JS'
import {spawnSync} from 'node:child_process';
const content = '---\ntype: informe\nstatus: patata\ndescription: Document adversarial de prova\nreflex: rebut completament inventat sense verificacio\n---\n# Prova\n';
const p = spawnSync(process.execPath, ['tooling/gates/porta-reflex.mjs'], {
  input: JSON.stringify({tool_name:'Write',tool_input:{file_path:'_wiki_de_poble/04_escriptori/prova.md',content}}), encoding:'utf8'
});
console.log({exit:p.status,stderr:p.stderr});
JS
```

### C02 — Alta: frontera d’escriptura incompleta

**Scope:** dinsAmbit/normalitza a porta-reflex.mjs; .claude/settings.json. Una ruta equivalent amb /./ davant de 04_escriptori evita includes i accepta text sense YAML. Edit no implementa replace_all; Antigravity pot validar només el primer fragment. Matcher només Write/Edit/NotebookEdit. **Conflicte:** garantia de validar el document resultant independentment de l’eina. **Reparació:** camins canònics amb symlinks i cwd real, reconstrucció exacta o rebuig de l’operació desconeguda i porta final sobre fitxers modificats. Afegir Bash al matcher sense analitzar l’operació no basta. No s’ha demostrat activació dels hooks en una sessió real de Claude. `requires_human_decision: false`.

### C03 — Alta: tancament sense torn verificat i --check amb escriptures

**Scope:** obrir_torn.mjs genera Date.now però no desa estat; tancament.mjs copia turn_id al JSON sense consultar registre. compile-wiki-to-app.mjs acaba en writeFileSync també amb --check. El tancament crida --check sense --strict, i els enllaços trencats són només avisos. **Prova:** còpia temporal, turn_id inventat retornat al resultat i hash del manifest canviat; tancament roig per estils, no per torn fals. **Reparació:** màquina d’estats i comprovació pura separada de generació; error si manca registre. `requires_human_decision: false`.

Còpia usada: /var/folders/sq/8kwdjm2j32z_s3w0ssy3ypdh0000gn/T/sdp-fortificacio-yv7lwr9p; log tancament.log. Exclosos arxiu, producció humana i .obsidian; no certifica l’arbre complet. Els dos errors són PEDRA_SECA_INLINE_STYLE a AppGridColumn.jsx i BrainGraph.jsx. No s’ha restaurat cap fitxer del checkout amb versions antigues.

### C04 — Alta: contradiccions de l’engranatge de skills

**Scope:** prompt_local.md té frontmatter de plantilla seguit immediatament de frontmatter d’exemple; auditoria_canonica.md encara descriu taxonomia antiga i només cinc claus admeses; schema.json ja admet tags, visibility i reflex; pla.md no explicita type del document fill. El default del router és prompt_consell, mentre la skill descriu prompt_local com a default. sdp-workflow cita skill-busca-skills però el directori viu és wiki-busca-skills. La skill documental mana categories en majúscules i netejar l’escriptori; AGENTS exigeix minúscules i conservar treball viu. **Efecte:** fins i tot un agent que llig tot rep instruccions contradictòries. **Reparació:** cada plantilla declara tipus de sortida i versió; exemples delimitats com a codi; guia i skills derivades del mateix contracte. `requires_human_decision: false` per alinear amb la constitució vigent.

### C05 — Alta: la Porta Reflex del runner és una altra eina

**Scope:** run-portes.mjs i package.json. porta:reflex executa tooling/wiki/reflex_petorreta.mjs doctor --ci, no tooling/gates/porta-reflex.mjs. El catàleg verd no certifica la càrrega de skills en cada arnés. capabilities.json descriu system.audit amb «compliment absolut», una garantia que els controls observats no sostenen. **Reparació:** separar IDs de diagnòstic i validació documental; registrar cobertura, efectes i proves negatives de cada porta. `requires_human_decision: false`.

### C06 — Alta: publicació documental sense filtre de privacitat

**Scope:** compile-wiki-to-app.mjs recorre .agents i Wiki; només filtra arxivat/quarantena, no visibility: private. No exclou explícitament producció humana. **Evidència de codi:** falta el predicat de visibilitat abans d’items.push. El manifest existent té zero ítems etiquetats private: això no refuta la fallada ni prova una filtració nova en producció. **Reparació:** manifest públic per allowlist de contingut publicable i corpus local separat. Ha d’estar resolt abans d’activar un watcher que amplifique la publicació. `requires_human_decision: true` per decidir quins documents han de ser públics; default proposat: privats.

### C07 — Mitjana: regressió concreta de lint

**Scope:** src/sections/text/pageContent.js:111, no-dupe-keys per notes duplicat; total 377 avisos actuals, no els 372/374 de l’històric. Hi ha avisos de hooks, no únicament variables sobrants. **Reparació:** fusionar la definició notes preservant contingut, eliminar imports/variables sobrants i revisar closures/dependències amb proves de comportament. Cap desactivació global d’ESLint. `requires_human_decision: false`.

### C08 — Mitjana: graf present però funcionalitat incompleta

**Scope:** BrainGraph.jsx, useForceLayout.js i WikiDePobleSection.jsx. Hi ha canvas, nodes/categories/tags, zoom i pausa. No hi ha panell de filtres; onNodeClick es rep però no s’usa, i Wiki munta BrainGraph sense callback. El context canvas rep cadenes var(--token), que cal resoldre a colors amb getComputedStyle. Hi ha estils en línia, bucles de repulsió quadràtics i cerques find per aresta. useMemo amb [] fixa les dades al muntatge. **Reparació:** millorar aquest component amb selectors, navegació, tokens resolts, índex per ID, invalidació de dades i alternativa accessible. `requires_human_decision: false`; la ubicació final de la icona pot decidir-se després.

### C09 — Mitjana: migració incompleta i productors vius

**Scope:** .brain-reports i .brain-trash; maintain.sh segueix generant .brain-reports; brain_distill.py manté .brain-trash per defecte; quarantena_espills.mjs també l’escriu. **Efecte:** esborrar ara sense migrar productors recrearia residus. **Reparació:** inventari amb hashes, classificació de duplicats/únics, canvi de destins i prova de restauració abans de purgar els residus autoritzats. No s’han llegit les antigues skills de la paperera com a normes. `requires_human_decision: false` per al pla de migració demanat; contingut únic sense destí es conserva.

## OEPM — verificació oficial d’aquest torn

La consulta pública [CEO M4392826](https://ceo.oepm.es/detalleExpediente?numExp=M4392826), oberta i llegida al navegador el 22/09/2026, mostra **En tramitación**, presentació el 18/07/2026 i classes 09, 35, 41 i 45. L’acte del **21/09/2026** és **PUBL.SUSPENSO SOLICITUD DE F.RESOL: 14/09/2026**.

La pestanya DOCUMENTOS retorna que no hi ha resultats. Per tant, **no s’ha pogut llegir la resolució ni validar el termini jurídic del 21/10/2026**; es manté com a termini intern aportat per l’encàrrec. Cal obtindre la notificació de MIO o del titular, identificar motiu i termini, preparar l’esmena i conservar el justificant de presentació. No s’ha enviat cap missatge ni presentat cap tràmit.

El document local de juliol a la Gestoria diu que la sol·licitud està presentada i que no s’esperen oposicions. És context històric, no estat actual ni prova que el suspens siga per oposició. La consulta no acredita concessió. `requires_human_decision: true` per a la resposta formal quan es conega la notificació.

## Rèplica a l’Olivera i pla

Es confirma la revisió 0136: el Bloc A és parcial. Es rectifica el punt de partida del pla Opus: A1–A4 ja estan al disc; la verificació en host d’A5 continua sense prova en aquest torn; el graf ja existeix i el lint té una regressió nova. Tampoc tots els warnings són inofensius. Els 50 passos i els productors de residus s’han de tractar explícitament.

Pla detallat, deixat abans de cap canvi funcional: [[260922_0240_pla_implementacio_codex]]. No es modifica codi en aquesta fase d’auditoria i preparació. S’actualitzen índex, ESTAT i LEDGER per donar continuïtat al mateix experiment.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260922_0240_pla_implementacio_codex]]
