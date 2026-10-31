---
type: document
status: esborrany
description: El JSON que llegirà la Consola Termodinàmica, les fonts que el compilen i el camp contracte que necessiten les skills perquè el mapa no depenga de prosa.
tags:
  - saber
  - arquitectura
  - graf
---
# Contracte de dades de la Consola

La Consola React no llig prosa ni rastreja el disc: llig un únic JSON generat per un compilador determinista de node. Este document fixa eixe esquema, les fonts que el compilen i el camp `contracte` que necessiten les skills perquè el mapa no depenga de prosa.

És el mateix camí que ja seguix la Wiki: `tooling/wiki/compile-wiki-to-app.mjs` genera `src/data/wikiManifest.js`. El navegador no pot llegir els plist ni executar git, i un compilador es pot provar.

## Què prenem de l'esquema d'Emowe

L'opció `--json` de `mapa_agentes.py` escriu:

- `version` i `generado`;
- `skills[]`, `aristas[]` (triples origen, destí i força) i `avisos{ruta: […]}`;
- `tareas[]` i `dicen[]`;
- `sistema{tablero, programadas, flujos, vigilante}`;
- `flujos[]`, `inferidos[]` i `actores{}`;
- els exemples de demostració.

Tres idees d'eixe esquema valen or:

1. **Cada dada porta el seu nivell de confiança.**
2. **El que falta es pinta, no s'amaga.** Per això té la caixa opaca i la caixa grisa. És la mateixa regla que la [[00_portada]] imposa a les mètriques: si falta una peça, `N/A`, mai un verd inventat.
3. **Tot el que és de demostració porta la xapa «exemple»** i es pot filtrar.

## Esquema proposat: `sdp.mapa.v1`

```json
{
  "schema": "sdp.mapa.v1",
  "generat": "AAAA-MM-DDTHH:MM:SSZ",
  "tall": { "branca": "…", "commit": "…", "arbre_net": false },
  "nodes": [
    { "id": "skill:sdp-workflow", "tipus": "skill",
      "font": ".agents/skills/sdp-workflow/SKILL.md",
      "atributs": { "core": true } }
  ],
  "arestes": [
    { "de": "ruta:pla.implementacio", "a": "skill:sdp-workflow",
      "tipus": "governa", "confianca": "declarat",
      "evidencia": ".agents/protocolledge.json" }
  ],
  "tasques": [
    { "id": "plaquetes-diagnostic", "estat": "viu" }
  ],
  "avisos": [
    { "node": "skill:wiki-cicle-de-vida", "codi": "disparador-decoratiu",
      "severitat": "mitjana", "evidencia": ".agents/skills_index.json" }
  ],
  "salut": [
    { "metrica": "conformitat-documental", "valor": "N/A",
      "numerador": null, "denominador": null,
      "font": "tooling/gates/porta-documents.mjs", "prova": null }
  ]
}
```

- **Tipus de node:** `skill`, `plantilla`, `ruta`, `script`, `hook`, `tasca`, `agent`, `document` i `porta`.
- **Tipus d'aresta:** `crida`, `llig`, `escriu`, `dispara`, `encamina`, `carrega` i `governa`.
- **Confiança:** `declarat`, `derivat` o `inferit` (vegeu [[01_fluxos_skills]]).
- **`tall`:** fixa branca i commit. Dos mapes només són comparables si se sap de quin arbre ixen.

## El camp que necessiten les skills

El frontmatter de les skills es valida contra `tooling/wiki/schema.json`, que té `additionalProperties: false`. **Qualsevol camp nou fa fallar la porta de frontmatter** fins que s'amplie l'esquema. Això és una decisió de govern, perquè l'esquema viu dins de `tooling/`.

Proposta: un sol camp niat, `contracte`. Seria opcional al principi i obligatori per a les skills nucli:

```yaml
contracte:
  llig:
    - .agents/protocolledge.json
    - _wiki_de_poble/03_actuar/plantilles/prompt_local.md
  escriu:
    - _wiki_de_poble/04_escriptori/AAMMDD_HHMM_prompt_*.md
  crida:
    - wiki-cicle-de-vida
  programacio: null
```

- Les claus són verbs (`llig`, `escriu`, `crida`) per a dir exactament la relació. Tot el que ve d'ací és confiança `declarat`.
- `programacio` apunta a un `id` de `.agents/cron/registre_tasques.json` (vegeu [[02_calendari]]).

**Regles de validació** (porta determinista nova):

1. Cada ruta de `llig` i `escriu` existix, o és un patró amb comodí que respecta la taxonomia `AAMMDD_HHMM_categoria_titol`.
2. Cada nom de `crida` té carpeta a `.agents/skills/` amb un `SKILL.md` vàlid. Es comprova contra el disc, no contra l'índex, que pot estar ranci.
3. Cada `programacio` existix al registre de tasques.
4. Es rebutja qualsevol ruta dins de `90_arxiu_historic/` (AGENTS §5).

## Fonts que el compilador llig tal com estan

| Font | Què aporta |
|---|---|
| `.agents/protocolledge.json` | rutes, plantilles, skills, seccions i destins |
| `.agents/skills_index.json` | cens de skills i `triggers_on` |
| `.agents/cervell.json` | ordre d'arrencada |
| `.claude/settings.json` | hooks per esdeveniment de Claude Code |
| `.agents/hooks.json` | hooks declarats d'Antigravity, sense consumidor acreditat |
| `package.json` | ordres npm i l'script que crida cadascuna |
| `.agents/cron/registre_tasques.json` | tasques, amb els camps nous de [[02_calendari]] |
| `.husky/<esdeveniment>` i `git config core.hooksPath` | text dels hooks de git instal·lats, per a jutjar les tasques `git-hook` (`fonts.hooksGit`) |
| `.agents/consell.json` | les dotze membres del Consell i el rol de cadascuna |
| `.agents/runtime/turns/*.json` | torns, rebuts i estat del cicle de vida |
| `tooling/wiki/schema.json` | validesa del frontmatter |
| `src/sections/text/pageContent.js` i consumidors | claus estructurals que vigila la frontissa de contingut ([[05_actors_i_salut]]) |

## Semàfor, problemes a la vista i honestedat (Onada 6)

La interfície pinta la gravetat amb tres colors, i el compilador no fabrica cap verd. El codi és a `src/sections/consola/semafor.js` i `src/sections/consola/mapa/construeixMapa.js`.

- **Semàfor.** Un avís `alta` és roig, i un `mitjana` o `baixa` és taronja. Sense cap avís, la targeta és verda i diu «En ordre». El que només informa (una relació inferida, una mètrica `N/A`, «Canvis nous») és neutre. Cap to de salut no és blau.
- **Un sol criteri a tot arreu.** Un avís té el mateix color a totes les targetes. Per exemple, una skill òrfena (`orfe`, mitjana) és taronja a l'Explorador, a Avisos i salut, a l'Inventari i a la xifra «skills òrfenes». Cada enllaç trencat de la coberta de l'Explorador pren la gravetat dels seus avisos.
- **Etiquetes de les peces.** `VIU`, `ACTIU` i `EN MARXA` van en verd; `MORT` i `SENSE CONSUMIDOR`, en roig; la resta (`SENSE LLANÇADOR`, `PARCIAL`, `DESCONEGUT`, `FALTA`), en taronja.
- **Inventari.** El semàfor d'una skill és el de l'avís més greu, no el del recompte. Un sol avís alt ja la fa roja.
- **Verd amb base.** Una targeta només diu «En ordre» si la seua font es pot llegir i ho mesura tot:
  - el pols, amb la termometria i un rebut datat;
  - Avisos i salut, amb totes les mètriques mesurades (cap `N/A` i almenys una mètrica);
  - Agents atòmics, amb cap peça `SENSE MESURA`.

  Sense base, la targeta no porta ni verd ni roig. Un avís alt sí que la fa roja, perquè el roig té base.
- **Les xifres.** Les xifres del tauler i les de dins de les pàgines i del pols porten la mateixa etiqueta que el tauler: «Cal reparar», «Important» o «En ordre».
  - Una xifra que compta avisos pren el color del més greu.
  - Una que compta tasques pren el del pitjor estat: viva, verd; morta, roig; la resta, taronja; sense cap tasca, cap color.
  - Una que compta el que falta (llocs sense lector, candats per acreditar, skills fora del manifest) és taronja o roja si n'hi ha, i verda si no n'hi ha cap.
  - Les que només diuen una mida (nodes, arestes, rutes documentals, cadenes, suggeriments, punts de trobada, agents atòmics, registres de consum, skills del manifest i del nucli, rebuts de lectura, operacions immunitàries) informen i no porten cap etiqueta.
- **Problemes a la vista.** Cada targeta diu quins problemes té: com a molt cinc, i «i N més». Ho fan les cobertes del tauler, els tres panells del pols, les xifres i les peces del Mapa (cada peça, els seus avisos). Cada problema porta davant una marca amb el color del semàfor: la severitat d'un avís, l'estat d'una tasca, el color d'una skill a l'Inventari o el que falta. Les rutes van en `<Mono>`, que el mode privacitat amaga. La targeta continua portant a la seua pàgina.
- **Ordre de reparació.** El botó de l'Inventari i de l'Explorador només copia. Cada línia diu, en un comentari de shell, quin avís repara. El segell no es torna a segellar des d'ací: es copia el diagnòstic (`node tooling/gates/segella.mjs`, sense `--update`), i el segell nou passa per l'executor de mutacions amb una lease.

Codis i fonts noves del compilador:

| Canvi | Què fa |
|---|---|
| `frontissa-roja` (alta) | Un avís per cada error de `fonts.frontissa.errors`, sobre la seua clau dins del registre d'empremtes: el node és `document:.agents/contingut_estructural.json#CLAU`. Sense clau, porta el número de l'error; una clau repetida porta `-2`, `-3`… Es repara amb una aprovació humana (`--aprova CLAU --per NOM`). |
| `ledger-invalid` | L'evidència diu la causa: el cos s'ha editat sense tornar-lo a segellar, o falta el segell. Els segells fòssils i les línies mal formades es compten a part. |
| `crida-inexistent` | No compta el nom d'un hook declarat a `.agents/hooks.json` (per exemple `sdp-fatiga`). |
| `fora-cataleg-claude` | Si `CLAUDE.md` importa la skill amb `@`, l'avís continua però baixa a `baixa`, i l'evidència ho diu. |
| Subtasques (`llancador.tipus: tasca`) | Una subtasca sense `script` propi i amb la mare viva és `desconegut`, mai `viu`. |
| `fonts.portaDocuments` | Rep l'eixida de `checkDocuments` (`{ valid, checked, errors }`) i mesura `conformitat-documental` com a documents sense cap error sobre els comprovats. Un error que no és de cap document compta com un document més que falla. Amb `checked: 0` és `N/A`: per defecte la porta només comprova els documents canviats, i amb l'arbre net no en comprova cap. |
| `fonts.cadenaPortes` | Rep l'eixida de `run-portes.mjs --diagnostic` (`{ valid, failures, total? }`) i mesura `cadena-portes`. |

Sense alguna d'estes dues fonts, la mètrica continua en `N/A`. Des del 2026-10-26, la closca (`tooling/brain/mapa-consola.mjs`) les passa: executa `porta-documents.mjs` i `run-portes.mjs --diagnostic` en un procés fill, amb temps límit, i només en llig el JSON de l'eixida estàndard. Sense script, sense JSON coherent, amb error de llançament, temps esgotat, senyal o límit de buffer, la mètrica continua en `N/A`. Una eixida 0 exigix `valid: true`; una eixida 1 exigix `valid: false`. El tancament per caducitat dels torns és una baixa administrativa i no crea ni recalcula verificacions de fitxers. Una porta roja és, a més, un avís alt: `porta-documents-roja`, un per document amb errors, i `cadena-portes-roja`, un per a la cadena.

## On viu l'eixida

**El fet, hui.** Al servidor de desenvolupament, el mapa i els JSON de dades de la Consola es compilen **en viu**, a cada petició, des de git i des de fitxers de l'ordinador on es treballa: els servix el middleware `tooling/vite/consola-iaia.mjs` (`vite serve`, només lectures i només des de localhost). La **web publicada** en porta la **instantània sanejada** de cada build (d'ací baix). Cap de les dues coses entra al manifest públic de la Wiki, a `public/rag-index.json`, al paquet de WordPress ni a l'app nativa.

**Decisió presa** (ordre del Mestre del 30-10-2026, prompt `261030_2208`, T2.2): la **interfície** de la Consola és **pública**, també en producció, sense compte ni rol. Queden derogades les dues opcions que hi havia en suspens: ni només en desenvolupament ni darrere del rol de superadministració.

**Decisió presa** (decisió del Mestre del 31-10-2026, afegida a T2.2 del mateix prompt): «Sí, vull que la web publicada mostre una instantània sanejada amb totes les dades reals de la Consola a qualsevol usuari (no una Consola buida amb estat 'absent')». Per això:

- **La instantània.** En cada `vite build` del web (`vite.config.js`), el connector `sdp:consola-instantania` de `tooling/vite/consola-iaia.mjs` crida **els mateixos productors** que el middleware (`recullConsola`, `recullMapa`, `compilaGovern` i `recullEmpaquetats`) i emet `dist/__iaia/consola.json`, `mapa.json`, `govern.json` i `empaquetats.json`. Cada font porta el seu camp `generat`: l'instant de la instantània, o el de `SOURCE_DATE_EPOCH` en un build reproduïble. Una font que no es pot produir (sense git o sense Llibre, com al build de `flake.nix`) ix com un sobre d'error amb un text fix, i la Consola la pinta com a error.
- **El sanejador** (`tooling/vite/instantania-consola.mjs`, fail-closed). **Emmascara** els camins de l'ordinador (la carpeta de l'usuari passa a `~`, amb `emmascaraCamins` de `tooling/wiki/lib/publication-policy.mjs`), els correus de persones (tota adreça que no siga una de les tres que la web ja publica a WebFinger, `CORREUS_PUBLICS`, ni d'un domini sintètic: una altra bústia `@socdepoble.org` també s'emmascara), els telèfons, els NIF, NIE i DNI (també sense lletra, si porten «DNI», «NIF» o «NIE» davant), els IBAN i els CCC, les targetes (Luhn i prefix de targeta) i les IP privades (també les de Tailscale). **Atura el build**, sense mostrar el valor, davant d'un JWT, una clau de Supabase, un token Bearer, credencials, tokens o signatures dins d'una URL, un token d'un proveïdor conegut (GitHub, Anthropic, OpenAI, Google, AWS, Slack, Discord, Stripe, Matrix, GitLab, npm, Hugging Face), una assignació o un camp JSON amb nom de secret (`JWT_SECRET=…`, `SMTP_PASS: …`, `"password": "…"`), una clau privada, el valor d'un secret de l'entorn (tots els `.env*` de l'arrel, de `supabase/` i de `supabase/functions/`, també `.env.botigues.local`, i el procés; les contrasenyes des de 8 caràcters) o el nom d'usuari del sistema fora d'un camí. El missatge diu el tipus i el camí dins del JSON, fet amb les claus ja emmascarades. Els **noms de persones, les adreces postals i els noms d'usuari de tercers no es poden caçar**: el que la instantània publica del Llibre Mestre s'ha d'escriure com a text públic.
- **La porta de publicabilitat.** `node tooling/vite/instantania-consola.mjs --comprova` construïx la instantània real de l'arbre amb els productors i l'entorn del build, diu font per font si es pot publicar i ix amb 1, sense mostrar cap valor, si `vite build` s'aturaria. La prova `tooling/vite/instantania-consola.test.mjs` escaneja amb regles pròpies totes les fonts reals, també la que s'atura pel nom d'usuari (la torna a sanejar sense eixa guarda), i ho diu com a diagnòstic sense posar-se roja. Que la porta corra dins de `porta:build` és una decisió pendent del Mestre: `tooling/gates/` és camí de govern.
- **La lectura.** La Consola publicada llig `/__iaia/*.json` amb un GET al mateix origen i sense credencials, i diu que són la instantània publicada i de quan: l'avís «Instantània publicada» del tauler, el peu de cada pàgina i l'Índex, que explica que les fonts ixen de la instantània de cada publicació i no promet cap Refrescar. Les **lectures en viu** i les **escriptures** (les certificacions del Govern i les eines locals) continuen **només en desenvolupament**: a la web publicada la Certificació només explica què fan els tres verbs, sense botons ni registre.
- **La caducitat.** La matriu del Govern publicada es data amb l'instant de la instantània, no amb el rellotge de qui la mira: una instantània no envellix sola. El tauler ho diu amb l'avís «Instantània publicada» i la data. Cap temps de paret de la matriu (`mcr.at`, que és el `mtime` del Llibre, i `trasllat.at`) no passa de l'instant de la instantània: es fixa a eixe instant, com mana reproducible-builds per als `mtime`, i un build amb `SOURCE_DATE_EPOCH` sobre una còpia neta no pinta la matriu obsoleta per «data futura».
- **Els paquets sense instantània.** El connector de WordPress (`vite.standalone.config.js`) i l'app nativa (`vite.natiu.config.js`) no en porten: la Consola hi diu que les dades no estan disponibles en este entorn i no fa cap petició.
- **L'allotjament.** Firebase servix `/__iaia/*.json` com a fitxers estàtics: un fitxer que existix passa davant de la reescriptura de l'SPA, amb `Content-Type: application/json` i `Cache-Control: no-cache` (`firebase.json`).

**On es decidix al codi:**

- **La barrera de sessió:** la ruta `/consola/*` de `src/app/App.jsx`, que munta la Consola sense `RequireAuth`. Hui no n'hi ha cap.
- **Les lectures:** `src/sections/consola/fontsConsola.js` (en viu amb `DEV`; la instantània amb la bandera `SDP_CONSOLA_INSTANTANIA` que segella el build web; en cap altre paquet) i `tooling/vite/consola-iaia.mjs` (el middleware, només `vite serve` i només des de localhost; el connector del build, la instantània).
- **Les escriptures:** `ambEscriptures` de `src/sections/consola/fontsConsola.js`, només amb `DEV`.

Derogat: «Pendent del Mestre. […] Fins que el Mestre la prenga, no se'n publica cap» i «les lectures en viu (`/__iaia/*`) continuen només en desenvolupament: fora de `vite serve`, la Consola diu que no té dades».

## Vincles

- [[00_portada]]
- [[01_fluxos_skills]]
- [[02_calendari]]
- [[03_inventari_skills]]
- [[05_actors_i_salut]]
