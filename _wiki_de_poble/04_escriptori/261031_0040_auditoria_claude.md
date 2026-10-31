---
type: informe
status: esborrany
description: 'Execució de Claude del prompt 261030_2208 amb les auditories vespertines 2114 de Gemini i Codex: T1 a T4, cens i portes, i decisions del Mestre.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:d95fca4d-385d-44cf-bc7b-2157cfa59d0e
---
# Tancament pre-desplegament de Claude: cobertura social, Consola pública, tauler d'Umami i portes

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:d95fca4d-385d-44cf-bc7b-2157cfa59d0e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T23:36:20.627Z |
| Modificació | 2026-10-31T02:36:16.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), Claude Code amb Ultracode |
| Tokens consumits | Uns 16 milions als subagents dels sis workflows (f5 a f10); el fil principal no el mesura l'entorn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-30T23:36:20.627Z`: esborrany creat pel circuit `context` → `create` dins de `torn_f298d1e0-3122-47a0-b815-bf2f719c5be3`.
- `2026-10-30T21:29Z – 2026-10-31T02:10Z`: execució. Rebuts de l'Escriptori renovats; workflows f5 (SEO, Consola, visor), f6 (tauler d'Umami, portes del cens, deute CSS segur), f7 (fediversity, camí del Mac, Consola sense guarda), f8 (Quadre de Comandament), f9 (instantània de la Consola) i f10 (llistes i rànquing); dues transaccions de governança per l'executor.
- `2026-10-31T02:07Z – 2026-10-31T02:36:16.000Z`: porta final, correccions de la porta (guarda d'identitat dual i suites tornades a passar), informe, relleu d'ESTAT i tancament del torn.
- `2026-10-31T14:23:38.000Z`: fonts arxivades, citades en text perquè Vincles només admet notes vives (F9): `_wiki_de_poble/90_arxiu_historic/261030_2208_prompt_claude_tancament_seo_consola_publica_i_telemetria_didactica.md`, `_wiki_de_poble/90_arxiu_historic/261030_2114_auditoria_vespertina_gemini.md`, `_wiki_de_poble/90_arxiu_historic/261030_2114_auditoria_vespertina_codex.md`, `_wiki_de_poble/90_arxiu_historic/261029_1723_auditoria_claude.md`. Les va reapuntar a l'arxiu MarIA en la neteja de l'Escriptori del 31-10 (04:08); les ha mogudes de Vincles Claude Code (ordre del Mestre 261031, Ronda 1).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resultat

Els quatre blocs del prompt 2208 estan fets i revisats, i també les ordres que el Mestre hi va afegir durant la nit (tauler sense iframe, lletra normal, Quadre de Comandament, instantània de la Consola, llei de les llistes, rànquing net). Tot està a l'arbre de treball, **sense commit ni desplegament**. Les portes que queden roges ho fan per decisió del Mestre o són d'un altre carril; la llista tancada és a «Verificació».

### Bloc 1 (T1) · Cobertura social

- **Rutes:** 34 rutes públiques porten `og:image` pròpia al client, al manifest i a l'HTML prerenderitzat: les 8 de `/plugin/*`, 10 de `/page/*`, `/wikidepoble`, `/disseny`, `/consola`, les 9 pàgines de la Consola i les 4 del Govern.
- **Inventari:** explícit i comprovat en les dues direccions (QA-VES-01 de Codex); `notes_shared` en queda fora amb motiu.
- **Imatges:** 26 variants socials noves, de 1200×630 i com a molt 300 kB, registrades a `VARIANTS_SOCIALS` i al cens d'imatges.
- **Paritat:** client i prerender usen les mateixes funcions (`metadadesDePlugin`, `seoConsola.js`, `portadaSocialDeLaWiki`) i donen la mateixa URL.

### Bloc 2 (T2) · Obertura pública i instantània de la Consola

- **Rutes públiques:** `/disseny` i `/consola` són públiques i indexables. La Consola es munta directament, sense guarda; la guarda retirada té còpia fora del repositori.
- **Instantània (decisió del Mestre de les 00:55):** cada build web emet a `__iaia/` les quatre fonts de la Consola amb els mateixos productors que en desenvolupament. Un sanejador fail-closed emmascara camins, correus personals, telèfons, NIF i IBAN, i atura el build davant de qualsevol secret sense mostrar-ne el valor.
- **Lectura:** a la web publicada, la Consola mostra les dades reals amb la data de la instantània; les escriptures i certificacions es queden en desenvolupament; els paquets de WordPress i nadiu no fan cap petició.
- **Textos:** consola, cervell i fediversity diuen la veritat nova; la frontissa queda a 16/16, i el contracte de dades i el comentari de `systemPages.js` recullen la decisió.
- **Privacitat de la Wiki:** el camí del Mac s'emmascara a la porta comuna de publicació, i el manifest, l'índex RAG i els slugs ixen nets.

### Bloc 3 (T3) · Tauler d'Umami

- **Sense iframe:** el tauler llig l'API pública de compartició amb el token (comprovada amb `curl`, preflight inclòs) i no carrega cap HTML d'Umami: cap doble scroll i cap error de consola amb l'enllaç bo.
- **Quadre de Comandament:** l'organisme reutilitzable `QuadreDeComandament` de Pedra Seca, amb `src/css/taulers.css`. Té targetes KPI baixes (etiqueta i xifra), l'explicació fora de les caixes amb el cos de la pàgina, una gràfica de visitants i vistes amb el detall per ratolí, tacte i teclat, i un rànquing compacte amb noms nets. Té espècimen a `/disseny`.
- **T3.2:** la llista d'activitat diu en paraules planeres què s'ha apuntat; s'hi manté «Visita a: …».
- **T3.3:** des d'un servidor local no s'envia res al comptador públic.

### Bloc 4 (T4) · Polits

- **Graella:** la prosa del contracte diu 720, 900 i 1023 px i la fitxa porta Vincles.
- **Visor:** la fila de l'enllaç de la imatge només ix a l'Arxiu o quan hi ha un enllaç públic real.
- **Fedivers:** la vinyeta va a sang, amb la variant social regenerada i el manifest de vores a zero.

### Llei de les llistes (ordre del Mestre de l'01:10)

`--sdp-li-gap` passa a 4px. Cap llista de text suma `gap` al marge dels `<li>`, i la llei queda a `tokens.css`, `base.css`, el catàleg tipogràfic de `/disseny`, una prova de capes i una lliçó de `sdp-pedra-seca`. Entre paràgrafs continua havent-hi 20px.

### Portes del cens i decisions del Mestre

- **Arreglades:** Consell (l'anon es dona per pública; continua caçant `service_role`, `sb_secret_` i claus privades), Llavor (identitat de fundador acceptada; continua caçant correus, telèfons i NIF de tercers), Rutes, Nomenclatura N2, Crom (ajustada a la regla T15 del «rectangle pur»), Doctrina (10 camins de skills corregits, excepcions comentades i el tractor del Vigilant passat al Llibre dins d'IDEA-13), Promesa i Frontmatter.
- **Deute CSS, part segura:** Pedra Seca i Tokens baixen sense cap píxel (comprovat amb el `computedStyle` d'abans i de després).
- **Generador d'`ON_ESTIC`:** ara porta la secció Vincles; abans cada regeneració trencava la porta Frontmatter.

### Rebuts i documents

S'han renovat els rebuts de 14 documents de l'Escriptori amb un torn nou. Els sis que no tenien estructura canònica s'han adoptat amb el text íntegre dins de «Troballes»; als altres huit només canvien el `reflex`, l'Identificador i una línia d'Historial. Els originals estan copiats fora del repositori. Tres seccions de Vincles que apuntaven a documents arxivats ara els citen en text pla.

### Privacitat

La fila `P1-68` del Llibre Mestre portava el nom complet d'una persona veïna registrada i els noms d'usuari de quatre comptes. Com que la matriu del Govern ara es publica, se n'han retirat sense canviar el contingut tècnic; el sanejador ja dona «es pot publicar» per a les quatre fonts.

### Contrast amb Gemini i Codex (2114)

- **Adoptat de Codex:** l'inventari explícit de rutes en lloc de recórrer tot `PAGE_COPY`; els noms reals del Govern i dels fitxers; la Gestoria no s'ha tocat (són dos dibuixos diferents).
- **Corregit de Gemini:** els perfils públics ja passaven la imatge al client (OG-GAP-03 desfasat); 86 és el total de files del Govern, no de files fetes.
- **Ordres del Mestre que superen les auditories:** obrir `/disseny` i `/consola`, i publicar-ne les dades.

### Decisions pendents del Mestre

- **Abans del deploy:** posar l'enllaç d'Umami amb la `m` minúscula (`lQNmq…`) al fitxer d'entorn de producció, fer el build real després i partir el commit (817 entrades i unes 18 MB d'imatges, per damunt del límit d'unes 13 MB per commit).
- **Portes:** Reflex i Nomenclatura N1 després del commit; Pedra Seca part C i Tokens 5–6; acceptar també `sb_publishable_`; dominis i noms vigilats per Llavor; la dependència de `retrieval-sources.mjs` (Codex).
- **Instantània:** els noms de persones no es detecten en general (el Llibre s'ha d'escriure com a text públic); `consola.json` publica crèdits i quotes de subscripcions; certificacions només en desenvolupament; connectar la comprovació del sanejador a la porta de build.
- **Llistes i tauler:** D-1 (25 llistes de components), D-2 (Wiki a 6px), D-3 (noms de subpàgines), D-6 (Histograma); marques de l'eix en lletra menuda, escala compartida, `taulers.css` com a patró i migració de la Gestoria, la Consola i el TPV.
- **Textos:** «ja no s'envia res» en lloc del literal fals; noms de `/lector`, `/iaia` i `/events`; entradetes «Eina en obres…»; huit vinyetes de 480px ampliades.
- **Escriptori:** l'índex enllaça una acta de MarIA (`261031_0142`) que encara no existix.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Porta final seqüencial (31-10-2026, 03:07–03:30 CET) sobre l'arbre viu, amb els registres a la carpeta de proves de la sessió. Les dues proves que van caure s'han tornat a passar després de la correcció (vegeu les notes).

| Comprovació | Exit | Resultat |
| --- | --- | --- |
| `npx eslint src tooling scripts tests bot --max-warnings=0` | 0 | 0 errors i 0 avisos |
| `design_guard --arrel=src` | 0 | 2.746 fitxers, 0 crítics, 12 avisos; el deute no puja |
| `tractor-graella` | 0 | el contracte i el codi diuen el mateix |
| `tractor-vocabulari` | 0 | cap classe forastera nova |
| `tractor-psicopatia` | 0 | 2.978 fitxers vius coherents |
| `tractor-persistencia`, `tractor-inline-styles`, `tractor-innerhtml` | 0 | 0 infraccions; injeccions sanejades |
| `frontissa-contingut` | 0 | 16/16 |
| `segella --check` i `verify-ledger` | 0 | segell `3f6b506b`; signatura del LEDGER vàlida |
| `tractor-doctrina` | 0 | tots els camins citats existixen |
| `tractor-promesa` i `tractor-frontmatter` | 0 | el deute no puja |
| `porta-olivera` | 0 | Escriptori net |
| `instantania-consola --comprova` | 0 | les quatre fonts es poden publicar |
| `npm run test:precommit` | 0 | Vitest 5.266 passades i 4 omeses; node 274 de 274 |
| `npm run test:node` | 0 | 1.713 passades, 0 fallades, 5 omeses i 4 pendents de diagnòstic |
| `npx vitest run` (suite sencera) | 0 | 1.531 fitxers; 26.725 passades, 0 fallades i 103 omeses (tornada a passar després de la correcció de la guarda) |
| `vite build` a una carpeta de proves | 0 | build correcte; `__iaia/` amb consola, mapa, govern i empaquetats, sense camins ni correus personals |
| `projeccio-publica` i `prerender-social` sobre eixe build | 0 | 25 de 25 rutes comprovades amb `og:image` pròpia de 300 kB com a molt; les 9 subrutes de `/consola` prerenderitzades |
| Escenaris de consola (c2, mm4, teclat) | 0 | 0 errors i 0 avisos |
| `run-portes --cens` | 1 | 8 roges de 56 (llista tancada a baix) |

**Notes de la porta:**

- **Guarda d'identitat dual:** la prova nova de Llavor usava el pseudònim antic en literal; ara es compon a trossos, i la guarda passa 11 de 11.
- **`test:node`:** la primera passada va donar 1 fallada intermitent a `tests/git-hooks.test.mjs` (post-applypatch). Sola passa dues vegades de dues, i la suite sencera tornada a passar dona 0 fallades.

**Roges del cens, llista tancada:**

1. **Contracte documental:** només este informe mentre la Verificació era pendent.
2. **Reflex:** línia base del corpus, contracte del graf i fitxers sense versionar; decisió del Mestre, després del commit.
3. **Nomenclatura N1:** les 16 actes en majúscules; decisió del Mestre, després del commit.
4. **Tractor Pedra Seca:** la part C; decisió del Mestre.
5. **Porta Tokens:** l'espai `--sdp-cal-*` i el text de l'espècimen del Gestor; decisió del Mestre.
6. **Llaurador, SCC i Orfandat:** l'índex de l'Escriptori enllaça `10_actes/261031_0142_acta_tancament_seo_consola_telemetria_i_pla_dissabte_fediversity.md`, i l'acta s'ha creat amb el nom `…_i_full_de_ruta_fediversity.md`. És del carril de MarIA.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense commit ni desplegament.** Cap `npm install`, Git destructiu ni SQL remot.
- **Fitxers d'entorn:** no s'han llegit ni tocat. L'enllaç d'Umami de producció l'ha de corregir el Mestre.
- **Build:** la porta construïx en una carpeta de proves, no al `dist/` del repositori. El build de desplegament s'ha de fer després de corregir l'enllaç d'Umami, perquè el build l'empaqueta.
- **Crawlers externs:** WhatsApp, Telegram i Mastodon no s'han provat en viu; la cobertura social es comprova amb el manifest, l'HTML prerenderitzat i la mida i el format de cada imatge.
- **Portes roges per decisió:** Reflex, Nomenclatura N1, Pedra Seca i Tokens.
- **Llaurador:** queda roig per l'acta que encara no existix, que és d'una altra mà.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
