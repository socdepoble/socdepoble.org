---
type: informe
status: esborrany
description: 'Execució de Claude de les Rondes 1, 2 i 3 del pla 261031_0136: portes del cens, commits i push, paquet del directori 1.1.10 amb SVN, natiu 1.0.0 (2) i kits de Codex i Gemini auditats.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_2c6f4a62-406b-4eec-aaf6-e5ad90d3a405:f6390028-2ae4-427d-9c29-b800bd557d76
---
# Rondes 1, 2 i 3 de Claude: portes del cens, commits, WordPress.org, botigues i kits

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2c6f4a62-406b-4eec-aaf6-e5ad90d3a405:f6390028-2ae4-427d-9c29-b800bd557d76 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-31T13:02:37.383Z |
| Modificació | 2026-11-01T00:10:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), Claude Code amb Ultracode |
| Tokens consumits | Uns 22 milions als subagents dels workflows de les tres rondes (reconeixements, auditories de kits, integracions, correccions i revisions adversarials); el fil principal no el mesura l'entorn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-31T13:02:37.383Z`: esborrany creat pel circuit `context` → `create` dins de `torn_2c6f4a62-406b-4eec-aaf6-e5ad90d3a405`; pla 261031_0136 vinculat.
- `2026-10-31T13:03Z – 13:51Z`: reconeixement de només lectura amb huit agents (Reflex, N1, Pedra Seca, Tokens, Llaurador i Frontmatter, commits i ganxo, WordPress.org, natiu), cada un amb assaig en còpia.
- `2026-10-31T14:05Z`: decisions del Mestre al xat (les quatre opcions recomanades): commits de 13 MB o menys amb `--no-verify`, Reflex amb el contracte de `graph.json` i resegell, part C de Pedra Seca amb excepcions escrites, kits fora dels commits i `cron.out` fora de Git.
- `2026-10-31T14:15Z – 15:30Z`: correccions a l'arbre viu, tres transaccions de governança per l'executor i revisió adversarial (cinc lents, un refutador per lent) amb les correccions que en confirma.
- `2026-10-31T15:30Z – 16:40Z`: bateria sencera en una còpia congelada, relleu d'ESTAT i LEDGER, resegell del corpus i informe.
- `2026-10-31T16:40Z – 17:20Z`: cinc commits (`e7b05b3a5`…`dea840764`) i push; zip del directori 1.1.10 i escenificació SVN des del commit pujat; `build:natiu`, `cap sync`, `preflight` i arxius natius sense signar.
- `2026-10-31T17:20Z – 23:10Z`: Ronda 2. Auditoria dels kits de Codex i Gemini, decisions del Mestre, integració en còpia, tres voltes de revisió adversarial i correcció, i dos commits (`f66de7865`, `c3a2c6bba`) amb push.
- `2026-10-31T19:00Z – 2026-11-01T00:10Z`: Ronda 3. Auditoria dels Lots 3, 4, 5 i 6 de Codex, decisions del Mestre, integració en còpia, revisió adversarial, correccions i aplicació a l'arbre viu.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resultat

La Ronda 1 (Fase 0) del pla 261031_0136 està feta fins al commit. Les quatre portes de l'ordre (Reflex, Nomenclatura N1, Pedra Seca i Tokens) queden verdes, i també les dos que s'havien posat roges entre anit i hui (Llaurador i Frontmatter). Els textos de `/page/descarregues` i `/page/fediversity` diuen l'aprovació de WordPress.org, i el build natiu és 1.0.0 (2). Tot va en **cinc commits** de 13 MB o menys, no en tres: el canvi pesava uns 50 MB de diff binari, i els mitjans sols en feien 35. El paquet del directori, l'escenificació SVN, el `build:natiu`, el `cap sync` i el `preflight` es fan després del push, sobre el commit pujat, i els seus resultats no són en este informe (vegeu «Límits»).

### Porta Reflex

- **Contracte del graf:** `_wiki_de_poble/.obsidian/graph.json` torna a portar les claus que el contracte exigix (sense orfes ni adjunts, cinc exclusions i quatre grups de color), i a més l'exclusió real de `90_arxiu_historic`. El contracte del codi (`validateGraphContract`) encara nomena les carpetes d'abans del 08-09: és deute anotat, no corregit (decisió del Mestre).
- **`.claude/settings.json`:** és fitxer crític del Reflex des del 24-09, i el `.gitignore` el desversionava des del 30-09. Ara `.gitignore` diu `**/.claude/*` i `!/.claude/settings.json`: es versiona només eixe fitxer, que porta els ganxos i cap secret.
- **Lock del corpus:** `tooling/wiki/wiki-baseline.lock.json` passa de 113 a 389 documents (darrer segell, 21-09), resegellat amb la sortida de `reflex_petorreta.mjs baseline` després de l'últim canvi del corpus.
- **Comprovació:** en una còpia amb tot el treball dins d'un commit, `doctor --ci` diu «Reflex operatiu». A l'arbre viu continuarà roig fins que els commits hi entren, perquè el doctor no certifica bytes fora de HEAD.

### Porta Nomenclatura N1

- 16 actes de `10_actes/` passen a minúscules amb `git mv`. `260920_0430_SUPER_ACTA_MARMOTA.md` passa a `260920_0430_acta_marmota_super.md`, que també compleix la taxonomia.
- `00_index.md` reescriu 17 enllaços, i `taxonomia_documental.md` retira el deute conegut que ja no ho és.
- **Parany del Mac:** amb `core.ignorecase`, un `git add` del nom nou conserva el nom vell a l'índex. Els commits esborren primer i afigen després, i es comprova que cap acta de l'arbre final porte majúscules.

### Tractor Pedra Seca

- **Falsos positius de la porta (G1–G7):** el full `<style>` propi d'un document autònom, la convenció `language-` de l'HTML, el deute identificat per classe i no per fitxer, la prosa del JSX, les comparacions amb `document.body` i el codi que importen els configs de Vite. Cada cas té la seua prova sintètica, amb la cara que calla i la que ha de continuar caient.
- **Arreglos reals idèntics al píxel:** el Bar i la Salut descarreguen amb l'enllaç despenjat de la casa (R1), i tres ajudants de proves passen de `src/` a `tests/helpers/` (R2).
- **Part C (decisió del Mestre):** quatre entrades noves a `PERMIS_DOCUMENT` (les dos entrades amos del document, el visor d'imatges i la còpia d'impressió de la factura), 29 excepcions escrites a `EXCEPCIONS_ORFE` i una a `EXCEPCIONS_CLASSE` (`sdp-workspace--compacte`). Cada una diu per què i es retira quan el mòdul es connecte o s'esborre. No s'ha esborrat res.
- **M1 provat i desfet:** passar el mode compacte a `data-compacte` afegia una prop a `AppGridShell`, i la porta Graella exigix que la fitxa `contracte_graella.md` (zona humana) la documente. Per això la classe d'estat queda com a excepció escrita.

### Porta Tokens

- Les propietats locals del Calendari passen de `--sdp-cal-*` a `--cal-*` en 14 fitxers, amb el criteri del visor (`--visor-*`) del 30-10. És un renom bijectiu sense col·lisions.
- T3 ja no compta la prosa que la interfície pinta (els dos textos de l'espècimen del Gestor). Un `style`, un `srcDoc`, un `dangerouslySetInnerHTML`, un `cssText` o una plantilla hi continuen comptant.

### Llaurador, Frontmatter i Unicode

- **Llaurador:** `ESTAT.md` i `ON_ESTIC.md` apunten a `90_arxiu_historic/` els tres documents que la neteja del matí va arxivar.
- **Frontmatter (F9):** l'informe 0040, el pla 0136 i l'acta 0142 citaven notes arxivades a Vincles. Ara les citen en text a l'Historial.
- **Enllaç a l'acta 261031_0142:** l'índex de l'Escriptori ja l'enllaçava amb el nom bo.
- **Unicode:** la carpeta `01_produccio/Banda La Torre - Gestió` és NFD al disc (Finder) i NFC a Git, i els seus set enllaços de l'índex només funcionaven a este Mac. Ara van en NFC, i `resolveDocumentLink` torna els noms tal com són al disc. Llaurador, SCC, Teixit i Orfandat passen amb la carpeta en NFD i en NFC.
- **Kits:** el deute nou de Frontmatter i els documents sense àncora de l'Escriptori són dels kits de la Ronda 2 (`02_investigacio_ia/261031_kit_*`), que estan en curs i no entren als commits.

### Textos i versions

- **`/page/descarregues`:** apartat nou «A la web del teu poble, amb WordPress». Diu que el directori oficial ha aprovat el connector amb el nom «socdepoble» i que la fitxa s'obri amb la primera versió publicada, sense cap enllaç fins aleshores.
- **`/page/fediversity`:** la frase «el connector encara no és al directori» passa a dir l'aprovació, amb l'enllaç a la fitxa.
- **Atles de la IAIA local:** deia el mateix que la pàgina vella, i ho ha trobat la revisió (H-1). Ara diu l'aprovació, dins del límit de 600 caràcters.
- **Frontissa:** les empremtes de `descarregues` i `fediversity` estan aprovades per «Mestre Javi Llinares (ordre al xat 261031, executada per Claude)», amb 16 claus de 16.
- **`readme.txt` 1.1.10:** retira «WordPress 5.8–6.4 support», que contradeia «Requires at least», afig al registre de canvis la traducció sense Google i explica la instal·lació des del directori. La versió continua sent 1.1.10, que mai no s'ha publicat al directori.
- **Natiu:** `versionCode 2` i `CURRENT_PROJECT_VERSION = 2` a les quatre configuracions (l'App i l'extensió Compartir). Els `Info.plist` ja les lliguen.

### Revisió adversarial

Cinc lents (correcció, píxel, integritat de les portes, textos i higiene), cada una amb un refutador. De 19 troballes, se'n confirmen 9:

- **Corregides:** l'Atles de la IAIA (H-1); T3 i la prosa de la Llei 01, que acceptaven `srcDoc` i `dangerouslySetInnerHTML` com a text (GATE-02 i GATE-03); el full propi que cobria també el `className` del JSX de la mateixa font (GATE-03); el `.gitignore`, que només ignorava `.claude/` a l'arrel (GATE-06); el motiu de les excepcions E2EE (GATE-05); i un comentari d'`InstalaLaPwa.jsx` que el canvi feia fals.
- **Procés:** una còpia de proves antiga, el lock encara sense resegellar i els renoms preparats a l'índex real (H1, H2, H3, GATE-07 i PX-1). Les dos proves noves de les portes cauen amb el codi d'abans i passen amb el nou.
- **Refutades amb motiu:** l'enllaç de `/page/fediversity` abans del commit SVN (la frase avisa que la fitxa s'obri amb la primera versió), la impressió de la factura a l'embed (la Gestoria no s'hi munta mai), el `readme.txt` i dos enllaços antics, que no són d'este torn.

### Commits

Cinc lots per llista explícita, amb un índex temporal i `--no-verify` per decisió del Mestre (el ganxo no pot passar amb este lot: no hi ha lease del Reflex, els mitjans i el codi junts passen del búfer de 16 MiB, i el Mac carregat passa del límit de 120 s per pas):

| Lot | Contingut | Camins | Diff binari |
| --- | --- | ---: | ---: |
| 1 | Nano cards regenerades i icones de l'app | 11 | 11,77 MB |
| 2 | Bessones socials i nano cards del Govern | 32 | 11,67 MB |
| 3 | Vinyetes de plugins i imatges de Fediversity i de la Consola | 20 | 11,69 MB |
| 4 | Codi: `src`, `tooling`, proves, connector, natiu i configuració | 742 | 5,72 MB |
| 5 | Wiki, índexs generats, lock del corpus i `.agents` | 114 o més | 9,66 MB o més |

Els kits de la Ronda 2 no hi entren, i `.immunitari/cron.out` ix de Git (ja era al `.gitignore`). L'arbre final de tots cinc s'ha assajat abans del primer commit.

### Ronda 2 (Fediversity, llistes, Vigilant i deute)

Els kits de Codex i Gemini no s'aplicaven tal com venien: els seus aplicadors fallaven sobre la Ronda 1, i alguna peça revertia decisions del Mestre. S'han auditat, reconciliat a tres bandes i integrat en una còpia, amb tres voltes de revisió adversarial abans de tocar l'arbre viu. Ha entrat el **paquet segur** que va triar el Mestre:

- **Lot A (`f66de7865`):** paquet Open Data a la fitxa del poble, ActivityPub estàtic i NodeInfo **només per a Sóc de Poble i La Torre** (decisió del Mestre: els pobles de mostra no es poden descobrir), instal·lador de nodes germans, fletxes de teclat, llei de les llistes D1/D6, tractor Vigilant i text de `/page/fediversity`.
- **Lot B (`c3a2c6bba`):** control compartit de Storage, amb el termini des que l'operació comença i una fita a la cua perquè cap crida no espere per sempre; progrés i rebut dels adjunts del Xat; perfil públic en 5 llengües; i Atles de la IAIA amb càpsules certes.
- **Fora, per decisió del Mestre:** el pegat 01 del Kit 2 de Codex (la guarda del nom d'usuari continua bloquejant), el 04 (DNS estricte), la migració i el document Model B crus de Gemini, i el seu pegat 17 de skills.
- **La revisió hi va trobar i corregir:** proves de federació que depenien de la xarxa, un paquet Open Data que deia més del que portava, el bloc de la fitxa sense traduir, l'enllaç de descàrrega inútil dins de l'app i un sol element nul que deixava sense connexió tot el Mas.

### Ronda 3 (E2EE, migracions, Model B i RGPD)

Entren els Lots 3, 4, 5 i 6 de Codex, auditats i reconciliats sobre la Ronda 2. Els lots crus de Gemini no s'han aplicat.

- **Migracions com a fitxers, «NO aplicada: l'aplica el Mestre»:**
  - `2610311500`: commutació grup ↔ empresa i transferència de titularitat. Força pública només la fitxa d'empreses, entitats i ajuntaments, sense cap `UPDATE` massiu (decisió RGPD del Mestre). La transferència queda limitada a grups i empreses.
  - `2610311800`: E2EE, fases 1b i 1c.
  - `2610312000`: les escriptures de `service_role` que la 1800 trencava.
  - `2610311900`: el filtre del servidor de l'exportació RGPD.

  L'ordre és 1500 → 1800 → 2000 → 1900, i s'ha provat a PostgreSQL 17.5 (PGlite) amb la cadena real de 64 migracions.
- **Client:** E2EE de grups i reembolcalls, apagat per defecte.
- **Interfície:** la fitxa no oferix «privada» a empreses, entitats i ajuntaments, i una línia ho explica.
- **Telemetria:** el tauler conserva les frases T3.2 del Mestre i només hi afig els estats «pendent de resposta» i «acceptat».
- **Wiki:**
  - el document Model B verificat contra `contracte.js` (`api_port_neutral_i_allotjament_model_b.md`), del qual la IAIA respon «Què és un node?»;
  - l'ADR-2026-14 de traducció, en esborrany;
  - el catàleg de migracions corregit.
- **La revisió hi va trobar i corregir:**
  - la transferència d'entitats i ajuntaments sense reclamació;
  - una política de lectura que deixava llegir un grup privat a la creadora expulsada;
  - un commit de prova citat en un document públic;
  - el missatge «sempre és pública»;
  - la frase del clic d'Umami, que no podia aparéixer mai;
  - el text de `/page/fediversity`: ara diu «inventari en esborrany» i la tasca de mesurar els recursos mínims queda al Pendent.

### Decisions pendents del Mestre

- **Migracions:** aplicar 1500, 1800, 2000 i 1900 en l'ordre que diu `supabase/README.md`. Abans d'aplicar la 1800, decidir els punts D2 a D6 del Lot 3: la invitació al xifrat, la finestra de 15 minuts per a adjunts, el `search_path` de les funcions copiades, què queda després d'esborrar un compte i què entra a l'exportació.
- **E2EE:** abans d'activar-lo cal tancar la troballa D6 del Lot 4 (una clau retirada pot signar una època posterior), amb una prova.
- **Publicació SVN:** cal Subversion (`svn` no és en este Mac) i el guió de publicació del satèl·lit, que demana la contrasenya SVN en pantalla i no la guarda.
- **Ordre de desplegament:** desplegar la web després del commit SVN, perquè l'enllaç de `/page/fediversity` mostre la fitxa i no una cerca buida.
- **Reflex:** actualitzar `validateGraphContract` a les carpetes vives, i decidir si el lock del corpus deixa fora `10_actes` i `90_arxiu_historic`. Hui cada acta nova o arxivament el torna roig.
- **Pedra Seca:** decidir si s'esborren `BlocAdministrarOrganitzacio.jsx`, `useAdministrarOrganitzacio.js`, `ConnexioDetall.jsx` i la fixture duplicada `idbFals.js`, i si `data-compacte` entra afegint la prop a la fitxa de la graella.
- **Botigues:** connectar el compte d'Apple a Xcode perquè la signatura automàtica registre l'App Group i l'extensió Compartir, i signar l'AAB amb el `.jks` de pujada del build 1.
- **Torn:** el tancament amb `--close` d'este torn queda pendent. La porta SCC del tancament veu els kits sense àncora a l'Escriptori. Es tanca quan els kits s'integren o passen al satèl·lit, a l'inici de la Ronda 2.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Arbre viu (31-10-2026, 16:30 CET), sobre els fitxers d'este torn:

| Comprovació | Exit | Resultat |
| --- | --- | --- |
| `tractor-pedra-seca` | 0 | Llei 01 35 de 91, Llei 06 5, Llei 08 1; el deute no puja |
| `tractor-tokens` | 0 | vocabulari tancat |
| `tractor-nomenclatura` | 0 | N1 0, N2 0, N3 0 |
| `llaurador_indexs`, `verificador-scc`, `teixidor`, `tractor-orfandat` | 0 | també amb la carpeta NFD; l'SCC global veu els kits |
| `frontissa-contingut` | 0 | 16 de 16 |
| `tractor-graella`, `design_guard`, `tractor-vocabulari` | 0 | cap divergència nova |
| `segella` i `verify-ledger` | 0 | segell i signatura vàlids |

Còpia congelada de l'arbre final, sense els kits ni `cron.out`:

| Comprovació | Exit | Resultat |
| --- | --- | --- |
| `npm run test:precommit` | 0 | en verd (39 s) |
| `npx eslint src tooling scripts tests bot --max-warnings=0` | 0 | 0 errors i 0 avisos |
| `npm run test:node` | 0 | 1.733 proves: 1.725 passades, 0 fallades, 5 omeses i 2 diagnòstics pendents |
| `npx vitest run` (suite sencera) | 0 | 1.531 fitxers; 26.720 passades, 0 fallades i 109 omeses |
| `run-portes --cens` (còpia amb commit) | 1 | 52 de 54 en verd; només Consell (L8) i Doctrina, que en una còpia neta no troben els camins ignorats de l'arbre viu |
| `reflex_petorreta doctor --ci` (còpia amb commit) | 0 | Reflex operatiu |
| `porta-documents` (còpia amb commit) | 0 | contracte documental en verd |
| `tancament --check` del torn (còpia amb commit) | 1 | les nou comprovacions en verd, SCC inclosa; només «zona humana», perquè el `.DS_Store` i els noms NFD de la carpeta de la Banda no existixen en un clon. A l'arbre viu, l'SCC cau pels kits sense àncora |

L'arbre de la còpia (`ef6ff4b1`) és el mateix que construïxen els cinc lots amb l'índex temporal; el commit compara l'arbre final abans d'escriure res.

Rondes 2 i 3, sobre l'arbre exacte de cada commit, en còpia:

| Comprovació | Ronda 2 | Ronda 3 |
| --- | --- | --- |
| `npx vitest run` (suite sencera) | 1.539 fitxers; 26.813 passades, 0 fallades | 1.548 fitxers; 26.925 passades, 0 fallades |
| `npm run test:node` | 1.746 passades, 0 fallades | 1.745 passades, 0 fallades |
| `test:precommit` i ESLint | en verd | en verd |
| `run-portes --cens` | només Consell i Doctrina (còpia neta) | només Consell i Doctrina (còpia neta) |
| PostgreSQL 17.5 (PGlite) | — | cadena real de 64 migracions 20/20, sondes de seguretat 21/21, RGPD 25/25 |
| `build:web` amb l'entorn real (només al procés) | en verd | en verd; `dist-secrets` 18/18 |
| Reproducció dels lliurables sobre l'arbre viu | exacta (A i B) | exacta |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Després del push (fora d'este informe):** el zip `--directori` 1.1.10 i l'escenificació SVN es construïxen des del commit pujat, i deixen el seu informe de validació a `_builds_de_poble/wordpress/`. El `build:natiu`, el `cap sync` i el `preflight --signa` es passen sobre l'arbre net. Els resultats van al xat del Mestre i al relleu següent.
- **Sense publicació:** cap commit SVN, cap pujada a TestFlight ni a Google Play, cap desplegament web i cap migració aplicada a Supabase. Totes són del Mestre.
- **Rondes 2 i 3:** el zip 1.1.10, l'escenificació SVN i els natius es tornen a construir després del push de la Ronda 3, des del commit pujat; els resultats van al xat del Mestre. Les traduccions en basc i gallec de les claus noves de la fitxa del poble són propostes per revisar.
- **Incident d'un revisor:** en la revisió de la Ronda 3, un agent va crear per error enllaços dins de `node_modules` de l'arbre viu i els va retirar. Comprovat després: no en queda cap.
- **Fitxers d'entorn:** el build els importa al procés. No s'han llegit ni mostrat.
- **Torn obert:** este torn queda «planned» als commits fins al tancament de la Ronda 2. A les 13:58 CET un `obrir_torn.mjs` sense arguments va obrir per error el torn `torn_734f3b4f-f3c4-49fc-b06d-e9de6370a529` (agent-local). No s'ha fet servir i caduca sol.
- **Portes en una còpia neta:** Consell (L8) i Doctrina hi ixen roges perquè citen camins ignorats que només són a l'arbre viu (`.env`, `wordpress-plugin/dist`, `.husky/_`, `.claude/skills`). No és d'este torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261031_0136_pla_implementacio_assalt_fediversity_deploy_i_botigues]]
- [[261031_0136_prompt_dissabte_fediversity_deploy_i_botigues]]
- [[03_llibre_mestre_tasques_i_idees]]
