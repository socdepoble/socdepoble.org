---
type: informe
status: esborrany
description: Inventari de només lectura del que l'Onada 9 pot esborrar o traslladar, amb mides, ordres exactes i les decisions que queden per al Mestre.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_7ffb2f2b-4897-44e5-a7da-844ac7c8e61a:8745e0b3-264e-48d6-8848-cd03cc44b6fd
---
# Inventari de l'Escombrada General · Onada 9

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7ffb2f2b-4897-44e5-a7da-844ac7c8e61a:8745e0b3-264e-48d6-8848-cd03cc44b6fd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-09T18:03:05.448Z |
| Modificació | 2026-10-09T18:12:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Code (Opus 5.5) |
| Tokens consumits | no mesurat: el harness no l'exposa a l'agent |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-09T18:03:05.448Z: esborrany creat; contingut i verificació pendents.
2026-10-09T18:12:00.000Z: inventari abocat. Un agent de només lectura el va fer a la vesprada; a les 20:05 he reverificat contra el disc els ZIP i l'arrel.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Origen i abast

**Ordre:** `261009_1330_requeriments_onada9_neteja.md`, línies 11-16. La transmet MarIA; no l'ha donada el Mestre al xat.

**Execució:** seguint el bloc de les 14:05 de `261009_1255_resposta_maria_a_claude.md`, Claude inventaria i MarIA executa. Claude no ha esborrat, mogut ni editat res d'este inventari.

**Retenció:** `core-empaquetat-wp` §4 i §5, i `tooling/higiene/cron_higiene.mjs:150-187`.

**Recomanació de via.** La skill §3 diu que cap agent no esborra res. Per això propose una via reversible: primer **traslladar** a una paperera fora del repo, i que el Mestre la buide quan torne. Les ordres de trasllat són a la secció A. L'esborrat definitiu és una sola línia per al Mestre, a la secció C.

### A · Ho pot executar MarIA amb l'ordre de l'Onada 9

#### A1 · `wordpress-plugin/builds/`: 17 ZIP fora de la retenció

**Es conserven 5 ZIP:**
- els 3 de `stable.json` (1.0.5, del 7 d'octubre a les 16:02: enxufe, spa i directori/enxufe);
- el de l'última Onada, `socdepoble-enxufe-v1.0.6-261008_2330.zip`;
- **provisionalment**, `socdepoble-enxufe-v1.0.6-261008_2036.zip` (vegeu la pregunta P1).

Reverificat al disc a les 20:05: la llista coincidix.

| ZIP | Mida B |
|---|---|
| builds/socdepoble-enxufe-v1.0.2-261004_0527.zip | 128.772.259 |
| builds/socdepoble-enxufe-v1.0.3-261004_1916.zip | 130.751.256 |
| builds/socdepoble-enxufe-v1.0.3-261006_2357.zip | 132.605.298 |
| builds/socdepoble-enxufe-v1.0.5-261008_1133.zip | 134.595.507 |
| builds/socdepoble-spa-v1.0.2-261004_0527.zip | 128.714.439 |
| builds/socdepoble-spa-v1.0.3-261004_1916.zip | 130.692.619 |
| builds/socdepoble-spa-v1.0.3-261006_2357.zip | 132.546.621 |
| builds/socdepoble-spa-v1.0.4-261005_0442.zip | 132.511.998 |
| builds/directori/socdepoble-enxufe-v1.0.1-261003_1324.zip | 108.397.116 |
| builds/directori/socdepoble-enxufe-v1.0.2-261004_0421.zip | 128.715.648 |
| builds/directori/socdepoble-enxufe-v1.0.2-261004_0527.zip | 128.711.867 |
| builds/directori/socdepoble-enxufe-v1.0.3-261004_1459.zip | 130.688.600 |
| builds/directori/socdepoble-enxufe-v1.0.3-261004_1514.zip | 130.688.612 |
| builds/directori/socdepoble-enxufe-v1.0.3-261004_1545.zip | 130.690.350 |
| builds/directori/socdepoble-enxufe-v1.0.3-261004_1916.zip | 130.690.350 |
| builds/directori/socdepoble-enxufe-v1.0.3-261006_2357.zip | 132.544.933 |
| builds/directori/socdepoble-enxufe-v1.0.4-261005_0442.zip | 132.509.727 |
| **Total (17)** | **2.204.827.200** |

**Canals vells (versionats):** `1.0.1.json`, `1.0.2.json`, `1.0.3.json` i `1.0.4.json`. Nomenen ZIP que se'n van. `empaqueta.mjs:615` els torna a escriure a cada paquet.

**Es conserven:**
- `1.0.5.json` i `stable.json`, que són el canal estable;
- `directori/dist/`, que és la font d'`empaqueta.mjs:483-495` i la llig `tests/natiu-build.test.mjs:392`.

```bash
mkdir -p ../.sdp-paperera-builds/onada9-261009/directori
mv -n wordpress-plugin/builds/socdepoble-enxufe-v1.0.2-261004_0527.zip wordpress-plugin/builds/socdepoble-enxufe-v1.0.3-261004_1916.zip wordpress-plugin/builds/socdepoble-enxufe-v1.0.3-261006_2357.zip wordpress-plugin/builds/socdepoble-enxufe-v1.0.5-261008_1133.zip ../.sdp-paperera-builds/onada9-261009/
mv -n wordpress-plugin/builds/socdepoble-spa-v1.0.2-261004_0527.zip wordpress-plugin/builds/socdepoble-spa-v1.0.3-261004_1916.zip wordpress-plugin/builds/socdepoble-spa-v1.0.3-261006_2357.zip wordpress-plugin/builds/socdepoble-spa-v1.0.4-261005_0442.zip ../.sdp-paperera-builds/onada9-261009/
mv -n wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.1-261003_1324.zip wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.2-261004_0421.zip wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.2-261004_0527.zip wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.3-261004_1459.zip ../.sdp-paperera-builds/onada9-261009/directori/
mv -n wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.3-261004_1514.zip wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.3-261004_1545.zip wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.3-261004_1916.zip wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.3-261006_2357.zip wordpress-plugin/builds/directori/socdepoble-enxufe-v1.0.4-261005_0442.zip ../.sdp-paperera-builds/onada9-261009/directori/
git rm wordpress-plugin/builds/1.0.1.json wordpress-plugin/builds/1.0.2.json wordpress-plugin/builds/1.0.3.json wordpress-plugin/builds/1.0.4.json
```

**Via canònica alternativa:** la de la skill §4, `node tooling/higiene/cron_higiene.mjs --l2` i després `--l2 --confirma CODI`. Demana un TTY, i que cap torn obert s'haja tocat en les últimes 2 hores (`cron_higiene.mjs:454,519`). Per això no la pot executar un agent amb torns vius.

#### A2 · Arrel de `socdepoble.org`

| Element | Mida | Git | Qui el referencia | Motiu |
|---|---|---|---|---|
| `scratch-banner.py` | 476 B | sí | ningú | guió solt |
| `fix_anchors.mjs` | 937 B | sí | ningú | àncores a cegues a l'índex |
| `pnpm-workspace.yaml` | 151 B | sí | ningú | el repo usa npm i `package-lock.json` |
| `scratch/` | ≈383 KB | 34 fitxers sí | `.gitignore:47`, llista de salts de `verificador-scc.mjs:29` | guions de prova vells. **Atenció:** a les 15:00 MarIA hi va deixar `commit_onada7.sh` i `commit_msg.txt`. Trasllada `scratch/` **després** del commit de l'Onada 8. |
| `release/` | 6.148 B (`.DS_Store`) | no | ningú (`empaqueta.mjs:645-651` només escriu dins de `builds/`) | carpeta vella |
| `tools/` | 11.298 B (5 `.py`) | sí | ningú | conversors vells |
| `dist/` | ≈137,6 MB | no | `npm run preview` | build web vell, amb un `rag-index.json` d'1 MB (canal de fuita del cervell). Es regenera amb `npm run build`. |
| `.wwebjs_cache/` | 1.152.918 B | sí | només llistes de denegats (`vite.config.js:79`, `eslint.config.js:8`) | llibreria abandonada |
| `var/plantilla-viva/informe.md` | 24.289 B | no | només una fixture sintètica | informe derivat |
| `var/workflows/construccio-sdp-261002-esquelet.js` | 76.815 B | no | ningú | esquelet d'un workflow vell |
| `docs/` i `scripts/portes/porta-vigencia.mjs` | 7.703 + 14.977 B | sí | la porta només la citen `docs/`, no cap script, `.husky`, `tooling` ni prova | registre d'una porta inerta. **Toca `scripts/`, que és governança:** confirma-ho abans. |

```bash
mkdir -p ../.sdp-paperera-mestre/onada9-261009
git rm scratch-banner.py fix_anchors.mjs pnpm-workspace.yaml
git rm -r -q --cached tools .wwebjs_cache
mv -n tools .wwebjs_cache release dist ../.sdp-paperera-mestre/onada9-261009/
mv -n var/plantilla-viva/informe.md var/workflows/construccio-sdp-261002-esquelet.js ../.sdp-paperera-mestre/onada9-261009/
rmdir var/plantilla-viva var/workflows
```

**Després del commit de l'Onada 8:**
```bash
git rm -r -q --cached scratch
mv -n scratch ../.sdp-paperera-mestre/onada9-261009/
```

**Només si es confirma la porta de vigència:**
```bash
git rm -r -q --cached docs scripts/portes/porta-vigencia.mjs
mv -n docs ../.sdp-paperera-mestre/onada9-261009/
mv -n scripts/portes/porta-vigencia.mjs ../.sdp-paperera-mestre/onada9-261009/
```

**Es conserven:**
- `requirements/` (`tractor-psicopatia.mjs:48`);
- `bot/` (Dockerfile, `edge_rag.mjs`);
- `assets/img/` (`assetResolver.js:10-18`; la Llei del Píxel ho impedix);
- `var/cerca/`, que és viu (`tests/cerca-consulta.test.mjs`);
- `vercel.json` (`src/pwa/manifest.test.js:143-147`);
- els fitxers del nucli i totes les carpetes de configuració amb punt.

#### A3 · Wiki i Escriptori

| Element | Mida | Proposta |
|---|---|---|
| `_wiki_de_poble/.quarantena-260830/` | 129.814 B (12 fitxers, versionats) | Trasllat. Són còpies de codi del 8 de setembre i un esborrany de `plantilla_prompt_iso.md`, el patró de la plantilla ressuscitada. Les proves l'exclouen pel nom. |
| `_wiki_de_poble/01_produccio/260925_1550_briefing_ui_editor_claude.md` | 1.668 B | Moure a `90_arxiu_historic/` i esborrar la carpeta, que repetix el nom de `04_escriptori/01_produccio` fora de la taxonomia. **Risc:** si el briefing de la barra d'eines de l'editor encara és pendent, ha d'anar a l'Escriptori i no a l'arxiu. |
| `04_escriptori/02_investigacio_ia/vigilante_plugin/` | buida | `rmdir`. |

```bash
git rm -r -q --cached _wiki_de_poble/.quarantena-260830
mv -n _wiki_de_poble/.quarantena-260830 ../.sdp-paperera-mestre/onada9-261009/
git mv _wiki_de_poble/01_produccio/260925_1550_briefing_ui_editor_claude.md _wiki_de_poble/90_arxiu_historic/260925_1550_briefing_ui_editor_claude.md
rmdir _wiki_de_poble/01_produccio
rmdir _wiki_de_poble/04_escriptori/02_investigacio_ia/vigilante_plugin
```

#### A4 · Directori pare `Som de Poble/`

| Element | Mida | Proposta |
|---|---|---|
| `260921_0725_informe_auditoria_arquitectura_seguretat.md` | 39.088 B | Moure a `_wiki_de_poble/90_arxiu_historic/`: és un dictamen de seguretat amb valor històric. |
| `260921_0725_proves_auditoria_arquitectura_seguretat.mjs` | 7.179 B | Moure amb l'informe, perquè comparteixen hora. **Risc:** si entra en stage, la cadena del pre-commit pot queixar-se del `.mjs`. En eixe cas, deixeu-lo sense versionar. |
| `_disseny_de_poble/`, `oficina_de_poble/` | buides | `rmdir`. |

```bash
mv -n ../260921_0725_informe_auditoria_arquitectura_seguretat.md ../260921_0725_proves_auditoria_arquitectura_seguretat.mjs _wiki_de_poble/90_arxiu_historic/
rmdir ../_disseny_de_poble ../oficina_de_poble
```

Els veïns `_*_de_poble` es conserven (`VEINS.md:16-19`).

**Balanç del bloc A:** ≈2.344.222.015 B (2,34 GB) passen a la paperera. Ixen del repo i no s'allibera espai fins que el Mestre la buide.

### B · Només amb un sí del Mestre, element per element

| Element | Mida | Per què no ho decidix MarIA |
|---|---|---|
| `socdepoble-enxufe-v1.0.6-261008_2036.zip` | 135.747.087 B | P1: `10_actes/261008_2300_acta_marmota.md:13` el dona per lliurat a Sollutia i WordPress |
| `01_produccio/Alergenos-ES_COPIA-ES_POT_BORRAR/` | ≈29,6 MB | zona humana (AGENTS §12) |
| `01_produccio/checklist-limpieza-wp-ayudawp` en `.md`, `.csv`, `.txt` i `.xlsx` | 118.247 B | zona humana; són duplicats del `-complet.csv` |
| `01_produccio/builds/socdepoble-enxufe-v1.0.0-261001_0320.zip` | 108.273.432 B | zona humana |
| `.snapshots/` | 378.130.330 B | còpies de seguretat del Mestre |
| `.wiki-safety/` | ≈6,9 MB | còpies `.bak` de la Wiki antiga |
| `.wwebjs_auth/` | ≈104,7 MB | sessió de WhatsApp, dades personals. Esborrar-la del disc no la trau de l'historial (commit `5a5d7023`). |
| `var/baileys-runtime/` | ≈266 KB | memòria cau de missatges, dades personals |
| `wordpress-plugin/builds/migracions_pendents.sql` | 153.315 B | no el llig cap codi, però és SQL de producció |
| `Dockerfile`, `docker-compose.yml`, `.dockerignore` | 914 B | brossa només si el bot no es desplega amb Docker |
| `_templates/gestoria_base/` | 2.835 B | pot ser la plantilla d'alta de la Gestoria |

### C · Esborrat definitiu (Mestre)

Quan el Mestre haja revisat la paperera:
```bash
rm -rf ../.sdp-paperera-builds/onada9-261009 ../.sdp-paperera-mestre/onada9-261009
```

### Preguntes obertes

- **P1.** Quin paquet hi ha instal·lat a Sollutia i a WordPress, el `2036` o el `2330`?
- **P2.** Els dos 1.0.6 no tenen canal: no hi ha `1.0.6.json` i `stable.json` és del 7 d'octubre. El paquet de l'última Onada no té cap sha256 registrat. Segons la skill §5, l'Acta Marmota ha de citar pel nom els paquets que es conserven. Ho fa l'acta de l'Onada 8.
- **P3.** Els `git rm` i `git mv` de fitxers versionats poden fer saltar el `tancament.mjs --check` dels torns oberts, perquè les seues línies de base hi citen camins. Feu-los després de tancar els torns, o en un torn nou.
- **P4.** Vistos de passada, fora d'abast:
  - les 9 imatges que `assetResolver.js` servix des de `/assets/img/` no són a `public/` i probablement no carreguen en producció;
  - `../_arxiu_wiki_de_poble` no té el `00_PORTAL.md` que exigix `VEINS.md:28`;
  - `mapa-visual-agentes.zip` és versionat malgrat la regla `*.zip`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Comprovacions fetes:**
- A les 20:05 he tornat a llistar al disc `wordpress-plugin/builds/` i `builds/directori/`: els 22 ZIP i les seues mides coincidixen amb la taula.
- He llistat també l'arrel. L'única diferència amb l'inventari de la vesprada són els dos fitxers que MarIA va deixar a `scratch/` a les 15:00.
- La suma dels 17 ZIP és 2.204.827.200 B. Al bloc A hi he restat el `2036` (135.747.087 B), que passa al B.

No he executat cap ordre de trasllat ni d'esborrat.

**Després de la neteja, MarIA verifica:**
```bash
git status --short
ls -la wordpress-plugin/builds wordpress-plugin/builds/directori
node tooling/higiene/cron_higiene.mjs
npm run porta:olivera
npx vitest run src tests
node --test tests/standalone-build.test.mjs tests/natiu-build.test.mjs tests/enxufe-empaqueta.test.mjs
```

Han de quedar 4 ZIP a `builds/` (3, més el `2036` mentre no hi haja resposta a P1) i 1 a `directori/`.

**Missatge de commit proposat:** «chore(onada9): escombrada general a la paperera (inventari Claude 261009_2005)».

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Fonts que no s'han llegit:** el contingut dels secrets (`.env*`, `.iaia_auth`), les sessions i dades personals (`.wwebjs_auth`, `var/baileys-runtime`), les còpies (`.snapshots`, `.wiki-safety`), `90_arxiu_historic/`, el `.mjs` del directori pare i `01_produccio/`. D'estos només en conec el nom i la mida.
- **Versionat:** `git ls-files` no passa el hook. El versionat es deduïx de `rg -a` sobre `.git/index` i pot errar en algun camí amb caràcters especials.
- **Mides:** les marcades amb ≈ vénen de blocs de 512 B i sobreestimen una mica.
- **Autoritat:** l'ordre de l'Onada 9 ve d'un document de MarIA, no del Mestre al xat. Per això propose trasllat i no esborrat, i deixe el bloc B sencer per al Mestre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261009_1330_requeriments_onada9_neteja]]
- [[261009_1245_auditoria_claude]]
