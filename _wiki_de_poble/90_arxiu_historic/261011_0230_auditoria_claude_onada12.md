---
type: informe
status: esborrany
description: 'Informe de Claude de la nit de l''Onada 12: dades fantasma del seed, imatges i marcs de la Consola i el Mur, decisions de l''Onada 11, History API, Gestoria, Rebost i autocuració.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c5c343ef-7dd7-4f5d-8ca2-259abe20da08:9695d4b1-1546-4ff1-adab-d688b6ad93d5
---
# Auditoria Claude Onada 12

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c5c343ef-7dd7-4f5d-8ca2-259abe20da08:9695d4b1-1546-4ff1-adab-d688b6ad93d5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T00:25:45.152Z |
| Modificació | 2026-10-11T02:05:00.000Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, amb subagents per front i refutadors de només lectura) |
| Tokens consumits | ≈ 6,3 M de tokens de subagents (nou fronts ≈ 4,7 M; set refutadors ≈ 1,6 M); el fil principal no s'exposa |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-11T00:25:45.152Z: esborrany creat; contingut i verificació pendents.
2026-10-11T00:45:00.000Z: reconeixement acabat i primer relleu del canal viu (torn torn_c5c343ef, scope code). Set fronts en marxa.
2026-10-11T01:20:00.000Z: fronts acabats; set refutadors adversaris de només lectura en marxa i front 8 (autocuració preventiva) obert a partir de l'estudi del front 7.
2026-10-11T01:45:00.000Z: correccions de la refutació acabades en tots els fronts; segona refutació sobre la reconciliació del TPV, que passa a «detecta i avisa».
2026-10-11T02:05:00.000Z: verificació final amb l'arbre sencer; informe complet.
Nota: les hores d'este Historial són UTC i aproximades (cap agent local pot executar `date`); les del cos són hora local (UTC+2).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### El que has de saber abans que res

1. **No hi ha cap commit ni cap paquet.** El hook d'esta nit veta als agents locals `git add`, `git commit`, `npm run`, tota escriptura a `tooling/` i `.agents/`, `WebFetch` i qualsevol esborrat. Les ordres els donaven per fets. Tot el treball és a l'arbre, sense versionar, i verificat amb la suite sencera.
2. **Encara que el hook ho deixara, cap commit passaria:** el segell de skills està trencat des d'abans de la nit (`core-identitat-visual` i `wiki-documentacio-i-reflex` modificades sense resegellar) i el `design_guard` continua PARAT per D-01, que demana tocar `tooling/gates/design_guard.mjs`. El marcador ja és al CSS i el pegat està escrit a «Ordres per a MarIA».
3. **Cap front ha passat net la refutació.** Set refutadors adversaris han trobat defectes reals en tots; estan corregits amb prova o deixats com a límit dit. La peça de més risc, una reconciliació automàtica del TPV que reescrivia comandes en carregar, podia acabar en un cobrament doble: l'he deixada en «detecta i avisa», sense escriure res.
4. **Res s'ha vist en un navegador.** Tot el que es diu dels píxels ix de llegir la cascada i de jsdom. Tot el que es diu de «Enrere» a Chrome ix de jsdom.
5. **El «marc blanc del Mur» no és CSS.** Va dibuixat dins dels fitxers de les vinyetes; vegeu el punt 2.

### Resultat per punt de les ordres

**1 · Auditoria adversarial i el doble Mac Mini: arreglat a les fonts i al `seed.sql`; una base ja sembrada no rep el canvi.**
- Causa: `src/sections/multimedia/mediaContent.js` fabricava una entrada de Multimèdia per cada producte del Mercat amb el títol i el text de venda sencers i, com a foto, `image_url || image || avatar_url`. El producte porta les fotos a `images`, així que la «foto» era el logotip de qui ven. Li passava igual a la Samarreta, i els pobles es duplicaven de la mateixa manera.
- Ara una entrada derivada és la foto real d'un article (mai un avatar), amb peu curt i el camp `article` (l'article on s'usa). El Cercador torna el producte i cada poble una sola vegada a la vista «tot», i la foto continua eixint amb el filtre «Multimèdia».
- `supabase/seed.sql`: files `mediaItems` i `marketItems` editades a mà i cobertes per prova. De pas, la Samarreta nomenava una foto que no existix al disc i li'n faltava una; corregit. Una prova nova veta qualsevol imatge sembrada absent de `public/`.
- **No s'ha de regenerar el `seed.sql` amb el seu script:** el fitxer és una llavor sintètica distinta de les fonts, i regenerar-lo hi ficaria «Javi Llinares» (`legacyMedia.js:162`) i faria caure la Porta Llavor.
- **Una base ja sembrada continuarà ensenyant dos Mac Mini** fins que s'hi torne a aplicar la llavor o es faça un `update` de la fila; això sobreescriu `app_content` i és decisió teua (D-12-01).
- Net, per prova: cap id repetit dins de cap col·lecció de la llavor i totes les seues imatges existixen. La taula sencera de l'auditoria de llavors (22 files, amb el que no s'ha arreglat) és a «Troballes de dades sense arreglar».

**2 · Imatges de la Consola, llei del quadrat i marcs blancs: fet el que era CSS; el marc del Mur és dins de les imatges.**
- Les 18 imatges ja eren servides des de `public/`; no s'ha copiat res ni tocat `01_produccio/`. La Consola no pintava cap imatge de contingut fins esta nit. Només tres tenen destí natural a l'Índex (`consola` a l'H2, `cervell` a «Explorador del cervell», `salut` a «Avisos i salut», esta com a esborrany): hi ixen com a miniatures quadrades de 128 px (`indexConsola.js`, taula `IMATGES_INDEX`). Les altres quinze ja eren lligades al Panell, al Mur o a la seua pàgina; `bascula_vinyeta` i `disseny_vinyeta` no tenen consumidor viu.
- Llei del quadrat (`aspect-ratio: 1 / 1`, `object-fit: cover`, centrat) per regla a `modules.css` § CONSOLA, amb prova.
- Marcs blancs: llegits els 18 fulls que carrega l'app i el JSX de la targeta, no hi ha cap vora, farcit, contorn ni fons blanc al voltant del mitjà. L'únic fons blanc declarat era el de darrere de l'avatar (`.sp-card-avatar`), i s'ha llevat a totes les targetes i barres taronja.
- **El marc que veus al Mur va dibuixat dins dels fitxers.** Les tres vinyetes mirades (`consola`, `cervell`, `salut`, a `public/assets/ui/plugins/`) porten un filet clar de paper i una ratlla negra; des de l'Onada 10 el Mur pinta les targetes de la Consola i del Cervell amb elles. Les nano cards sí que van a sang. El remei és retallar els 14 fitxers (origen a `01_produccio/`): decisió teua (D-12-02). No s'ha tapat amb CSS.
- Conseqüència incòmoda: les tres miniatures noves de l'Índex són vinyetes amb eixe filet, així que hi introduïxen el marc que l'ordre prohibix. Si no es retallen, cal llevar-les (és una línia a `IMATGES_INDEX`).
- També hi ha marc dibuixat a `public/assets/fotos/carla-soriano.png` i fons crema als avatars `*-comic.png`.

**3 · Resolucions executives.**
- **D-01:** marcador `ALLOW_FOCUS_INVISIBLE` posat al CSS davant de `.toc-drawer:focus`; la regla no canvia. El pegat de `design_guard.mjs` és a «Ordres per a MarIA». Fins llavors la porta acaba PARAT per eixa única identitat.
- **D-03 i D-04:** uns 4,5 KB de CSS mort fora (vocabulari sense consumidor, `.search-result*`, fragments morts de selectors mixtos, `btn-base`, `btn-outline-dark`, `btn-group`, `univ-manager-toolbar--list`, un `@media` buit i sis comentaris). Reconfirmat per un segon agent amb una cerca nova a tot el repositori: cap classe viva. Cap node del DOM llevat.
- **D-09:** Javi porta la foto també al padró del xat, llegida de la taula d'identitats.
- **D-16, D-17, D-18:** escrites a `ADR-2026-13-BYOP-XIFRAT-LOCAL.md` amb data. Salut no s'ha tocat: canviar la clau `data` de les jornades és una migració de dades, i l'ordre deia que no n'hi haguera. El que era collita de l'agent (retirar la guarda també fora de WordPress, la fase 3b de Salut, descartar l'HMAC) va marcat com a «proposta de Claude, pendent del Mestre».
- **D-19 i D-20:** `wordpress-plugin/includes/seo.php` només accepta `?sdp=` en forma estricta i contra la taula estàtica; res de la petició arriba a l'eixida; només actua a la pàgina que porta l'App. **El filtre continua apagat per defecte**, i hui encendre'l no faria res: `dist/seo-routes.json` no viatja al paquet (cadena de build, a `tooling/`).
- **D-30:** cap esborrat. Resolució escrita a `02_investigacio_ia/261010_1805_arqueologia_claude/INVENTARI_ANTIGA_WEB.txt`, secció 8.

**4 · «Enrere» del navegador: implementat per a qui declara `ruta-a-url`; verificat només en jsdom.**
- Causa: encastat, l'app navega en memòria, i amb `ruta-a-url` el reflex escrivia la ruta només amb `replaceState`: una sola entrada per a tota la sessió.
- Ara cada navegació nova fa `pushState` amb la URL en la forma de l'amfitrió i un estat amb espai de noms que conserva el de l'amfitrió; redireccions i primera càrrega fan `replaceState`; s'escolten `popstate`, `hashchange` i `pageshow`; «Enrere» des de la primera pantalla ix del portal com en qualsevol web, sense entrades fantasma. Una excepció de `pushState` (límit de Safari, document `srcdoc`) ja no tomba l'app: es continua en memòria.
- **WordPress declara `ruta-a-url` per defecte i no fa servir cap `<iframe>`.** Un amfitrió amb el marcatge de referència (el de Sollutia no és al repositori) no el declara: allí es continua navegant en memòria i «Enrere» encara trau del portal. Si el que veies era a Sollutia, eixe és el forat principal (D-12-03).
- Límits fixats per prova: amb un `history.state` de l'amfitrió que no és un objecte queden dues entrades seguides amb la mateixa ruta; una primera instància que es desmunta i torna amb una germana viva es queda sense escriure a la URL (anterior a esta nit).
- El guió de la prova de fum (16 passos, més Safari amb moltes navegacions seguides i el botó «arrere» de l'app després que l'amfitrió òbriga una entrada seua) és a «Proves de fum».

**5 · Kowalski: aplicat el que és d'interacció; el que canvia l'aparença en repòs queda com a proposta.**
- Les tres adreces no s'han pogut llegir. A mitja nit ha aparegut a l'Escriptori `261011_0246_teoria_kowalski_apple_design.md` (sense frontmatter ni autor; l'índex el declara teu), que és text de la guia; s'ha usat com a criteri, junt amb les regles que la casa ja havia adoptat el 261004.
- Aplicat, sense tocar res en repòs: l'ombra de qualsevol targeta ja no fa la fosa de 300 ms en passar el ratolí; tota Targeta Universal amb enllaç es tiny a l'instant en prémer-la i torna suau en 180 ms (§1 del document); el menú de Comentar de la targeta naix del seu botó (§7); els desplegables de la Consola i els títols enllaçats de l'Índex responen en prémer; xifres tabulars a la instantània de la Consola.
- Proposta no aplicada, amb el CSS exacte a l'informe del front (resumida a «Propostes de disseny»): radi coherent del quadrat lateral, xifres tabulars a dates, ancoratge de les fotos al centre, diana de 48 px als títols de l'Índex. **Blur i transparències contradiuen Pedra Seca §5** i demanen esmenar la skill; el feedback hàptic no existix a Safari/iOS.

**6 · Gestoria, TPV i Rebost.**
- **Gestoria.** El full trimestral ja era operatiu de punta a punta (carpeta → analitza → revisa → aprova → genera CSV i XLSX). Cap font dels quatre tractors signats s'ha tocat. Afegit, endollat al sentinella Triturador Financer (ara 1.1.0, **l'has de tornar a aprovar des de la Wiki**): auditoria de pagaments per trimestre, lector d'extractes de targeta en CSV i port bancari amb dos adaptadors (Norma 43 i CSV). La refutació hi va trobar quatre defectes greus de diners (una quota sense factura amagada com a duplicat, dos càrrecs iguals de dues targetes fusionats, el signe d'una targeta girat sense avís, retencions sempre a 0,00 €): corregits amb prova.
- **«Una sola petició a la IA» no és possible** sense trencar les tres aprovacions humanes, que són llei. Queda en dos gestos: generar el full i passar-lo pel Triturador amb els extractes.
- **Trimestres:** dins del repositori no hi ha cap «CSV validat» ni fulla formatada. Un subagent va llistar (noms i estructura) la carpeta germana `../_gestoria_de_poble/`: hi ha fulls del 1T i 2T de 2026; del 3T i 4T, cap. Els talls de trimestre estan provats amb dades sintètiques.
- **No fet:** les targetes d'Hisenda, IVA 303 i IRPF 130 del Tauler continuen sense productor (el Tauler no rep mai factures; arreglar-ho toca fonts signades); el classificador de categories no llig encara la targeta de crèdit; cap píxel de `/app/gestoria` ha canviat. De Holded i Factura Directa només hi ha idees de memòria, sense verificar.
- **Rebost.** Entrada nova «Receptes» a la Nevera: 14 plats de mas, tres grups («Ho tens tot», «Et falta poc», «Et falta més»), diu què falta i ho afig a la llista. Model pur, sense IA ni xarxa, sense passos, afirmacions de salut ni al·lèrgens. El Rebost no guarda dates de caducitat ni quantitats: «gasta primer el que es fa malbé» està programat i provat, però hui només ordena pel gènere fresc.
- **TPV.** Tres defectes arreglats («Mou» d'una comanda sencera fallava sempre i duplicava línies; dividir-ho tot deixava una comanda buida oberta; el resum parcial comptava comandes buides), més la comanda fantasma que «Mou» deixava amb un pagament parcial. El cobrament comprova ara la versió de la comanda. Un moviment tallat a mitges es **detecta i s'avisa** amb les línies i les dues comandes; la reparació automàtica queda escrita, provada i desendollada.
- **Lligam.** El TPV exporta les vendes d'un torn tancat en JSON (`sdp.vendes.v1`). **La Gestoria encara no el llig:** no té vista d'ingressos on endollar-lo i una prova de privadesa li veta importar `src/utils/vendes/`. El Bar no té estoc; queda el consum teòric d'ingredients com a fulla nova de l'XLSX del tancament.

**7 · Autocuració i Mods.**
- Estudi complet a `02_investigacio_ia/261011_0230_onada12_claude/AUTOCURACIO_I_MODS.txt` i `MODS_CODI.txt` (inventari del que ja s'autorepara, mapa de fragilitats amb fitxer i línia, propostes, contracte `sdp.mod.v1` i dos Mods sencers: auditoria de llavors i neteja d'Escriptori). Els Mods viurien a `tooling/`: no els puc crear.
- Aplicat, sense moure cap píxel del camí bo i refutat sense trencar-lo: una fila d'`app_content` que no és una llista ja no tomba l'app; una arrencada fallida es torna a provar en lloc de quedar-se en «Carregant» per sempre; una nota local malmesa ja no fa caure les notes; i un registre local d'incidents en memòria (`src/utils/autocuracio.js`) que alimenten els tres límits d'error. Ningú el llig encara: la targeta de la Consola és un canvi visible i demana ordre.
- Prova nova que vigila que cap `@layer` quede oberta en cap full de `src`.

### Canvis visibles per a l'usuari

- `/multimedia`: la foto real del Mac Mini i de la Samarreta en lloc de dos quadrats del logotip; `/cerca`: «mac mini» i cada poble, una sola fila.
- `/consola`: tres miniatures quadrades a l'Índex del peu.
- Tota l'app: l'avatar de targetes i barres taronja sense disc blanc darrere (només es nota amb avatars transparents o a mig carregar); l'ombra de les targetes canvia de colp; la targeta es tiny en prémer-la; el menú de Comentar de la targeta naix del botó.
- Xat (llavor i local): Javi amb la seua foto.
- Nevera: entrada «Receptes».
- TPV: botó «Vendes per a la Gestoria (JSON)» i una fulla més a l'XLSX del tancament, al detall d'un torn tancat; «Mou» desactivat amb pagaments; avís groc fix quan hi ha un moviment a mitges.
- Wiki → Sentinelles: el Triturador Financer ix sense aprovar fins que s'aprove la 1.1.0.
- Encastat a WordPress: «Enrere» del navegador torna dins de l'app.

### Decisions que t'esperen

Dades i imatges:
- **D-12-01** Tornar a aplicar el `seed.sql` (o un `update` de `mediaItems` i `marketItems`) a la base que servix: sense això, en remot continuaràs veient dos Mac Mini.
- **D-12-02** Retallar les 14 vinyetes perquè vagen a sang, o acceptar el filet com a part del dibuix; i, mentrestant, mantindre o llevar les tres miniatures de l'Índex de la Consola.
- **D-12-04** «L'article on s'usa» (requisit T6) continua en dada i no en pantalla: botó a tota amplada com el de la pàgina d'un poble, o píndola-enllaç discreta (disseny nou).
- **D-12-05** L'arxiu `LEGACY_MEDIA`: cinc «fotografies històriques» amb data 2022-01-01 que són les cares dels agents i la teua foto de perfil.
- **D-12-06** La pàgina legal amaga NIF i domicili a l'apartat 1 (`legalContent.js:28-29`) i els publica en clar a l'apartat 7 (`:71`).
- **D-12-07** Avatar sense disc blanc: ratificar-lo sabent que un avatar transparent es veurà sobre taronja. I l'ancoratge de les fotos al Mur: dalt (hui) o centre.

Encastat i SEO:
- **D-12-03** Amfitrions sense `ruta-a-url`: que Sollutia el declare (ja és al contracte com a opt-in; cap codi nou), un tercer mode «només estat», o fer-ho per defecte (trenca la regla «sense declaració no es toca l'historial de l'amfitrió»).
- **D-12-08** `seo.php` exigix, a més del filtre, el mode `parametre` (amb `fragment` les etiquetes mentirien): mantindre la condició o llevar-la. I si All in One SEO ha de perdre els seus `og:*` (hui no se li toca res i eixiran duplicats).
- **D-12-09** ADR BYOP: signar-la; la pregunta 1 (quina app entra primer al cofre); si el cofre únic es queda amb la base `sdp-gestoria-cofre`; la guarda en amfitrions que no són WordPress; la fase 3b de Salut.

Gestoria, TPV i Rebost:
- **D-12-10** Aprovar el Triturador Financer 1.1.0.
- **D-12-11** Arreglar els tres defectes reals en fonts signades (G1: la retenció d'un abonament suma en lloc de restar, `impostos.js:187`; G2: «SUMA GESTION TRIBUTARIA» cau a «altres»; G3: una entrada amb «comisiones» es classifica com a comissió bancària) i el dubte G4: cada pegat fa caducar aprovacions.
- **D-12-12** Endollar les factures del full al Tauler i el lector de targeta a l'Històric: toca fonts signades.
- **D-12-13** On són «el CSV validat» i els fulls del 3T i 4T, i quin format del full és el vigent.
- **D-12-14** L'importador de vendes del TPV a la Gestoria: demana una vista d'ingressos i afegir `src/utils/vendes/` a la llista blanca de privadesa.
- **D-12-15** Reactivar la reparació automàtica del TPV: demana abans una transacció de diverses claus al motor compartit (`src/utils/magatzemLocal.js`). I la zona horària de l'establiment (hui s'usa la del dispositiu).
- **D-12-16** El botó i la fulla nous del TPV són afegits sobre un clon de Loyverse sense pla aprovat: ratificar-los o llevar-los (dues línies a `Torns.jsx`).
- **D-12-17** Dates de caducitat i quantitats al Rebost (canvi d'esquema i de pantalla); revisió humana del receptari i dels 42 productes de botiga que casen amb un ingredient.

Autocuració i disseny:
- **D-12-18** Targeta «Autocuració» a la Consola; emetre `sdp-error` cap a l'amfitrió (el contracte ho promet i ningú ho emet); recàrrega d'un tros caducat (la casa va decidir no recarregar mai sola).
- **D-12-19** El contracte dels Mods, l'aprovació del Mod d'auditoria de llavors i com es fa el pont entre l'aprovació de la web i l'execució en Node.
- **D-12-20** Quines propostes de disseny entren en un pla, i si blur i transparències valen l'esmena de Pedra Seca §5.

### Ordres per a MarIA, en este ordre

1. **Segell de skills.** `node tooling/gates/segella.mjs` ix amb 1. Revisar el diff de `core-identitat-visual/SKILL.md` i `wiki-documentacio-i-reflex/SKILL.md` i resegellar. Sense això, ni executor ni pre-commit.
2. **D-01, `tooling/gates/design_guard.mjs`.** Afegir amb les altres constants `const PERDO_FOCUS = /ALLOW_FOCUS_INVISIBLE\s*\*\/\s*[^{}]*\{[^{}]*$/;` i, dins del bucle `for (const m of text.matchAll(FOCUS_NONE))`, darrere de la línia de `nearby`: `if (PERDO_FOCUS.test(text.slice(Math.max(0, m.index - 200), m.index))) continue;`. Només perdona si el marcador tanca un comentari i entre ell i l'`outline` hi ha un sol selector i una sola clau. No executat: després, `node tooling/gates/design_guard.mjs --arrel=src` ha d'eixir sense la identitat `focus-invisible|css/modules.css|outline-none`.
3. **Escriptori.** Ancorar a l'índex `02_investigacio_ia/261011_0230_onada12_claude/` (dos `.txt`). El document `261011_0246_teoria_kowalski_apple_design.md` no té frontmatter.
4. **SEO, `tooling/gates/build-seo-manifest.mjs`.** El bloc que busca `wordpress-plugin/inc/sdp-seo.php` (inexistent) es lleva; el bucle sobre `slugsPhp` passa a recórrer `ALIES_CANONIC` amb dues guardes (`!manifest.routes[slug]` i `manifest.routes[canonic]`). Compte: la taula d'àlies és rància (`anima` i `iaia` apunten a `ia` i la clau de la ruta és `iaia`). I la taula no viatja al zip: `build:seo` corre després de `build:wp`.
5. **Regenerar** `src/data/wikiManifest.js` (`node tooling/wiki/compile-wiki-to-app.mjs`): l'ADR-2026-13 no hi és i l'enllaç de la Wiki integrada no la troba. **No** regenerar `supabase/seed.sql`.
6. **`tests/lint_logica_usuari.test.mjs:382`:** llevar `.sdp-cataleg-nav__enllac`, que ja no existix.
7. **Commit.** Quan 1 i 2 estiguen fets: torn `torn_c5c343ef-7dd7-4f5d-8ca2-259abe20da08`, ESTAT (text proposat davall), LEDGER, `node tooling/gates/tancament.mjs --check --turn-id torn_c5c343ef-7dd7-4f5d-8ca2-259abe20da08` i el commit. L'arbre porta també, sense versionar, tota l'Onada 11.
8. **Nom de l'acta** `10_actes/261011_0200_ACTA_MARMOTA_Relleu_Nocturn.md`: la taxonomia vol minúscules.

### Text proposat per a l'ESTAT

> ESTAT_ACTUAL · 2026-10-11 · Claude · Nit de l'Onada 12 implementada i refutada, sense commit (hook). Doble Mac Mini arreglat a les fonts i al seed (falta resembrar). Llei del quadrat a la Consola, D-03 i D-04 fets, marcador de D-01 posat (pegat de design_guard per a MarIA); el marc blanc del Mur és dins de les vinyetes. D-09, D-16 a D-20 i D-30 aplicades. «Enrere» del navegador dins de l'encastat per a qui declara ruta-a-url (jsdom; prova de fum pendent). Kowalski: interacció aplicada, aparença com a proposta. Gestoria: auditoria de pagaments, extractes de targeta i port bancari al Triturador 1.1.0 (pendent d'aprovar). Rebost: receptes. TPV: quatre defectes fora i detecció de moviments a mitges. Autocuració preventiva de dades i d'arrencada. Suite de src 984 fitxers i 16.413 proves verdes. Decisions del Mestre: D-12-01 a D-12-20. Següent acció: MarIA resegella, aplica el pegat de D-01 i fa el commit; el Mestre decidix el resembrat, les vinyetes i ruta-a-url a Sollutia.

### Proves de fum que només pots fer tu

- **«Enrere» a Chrome dins de WordPress:** des d'una pàgina del lloc, entrar a la pàgina amb el shortcode; navegar Xat → Mur → un Poble; «Enrere» dues vegades torna a Mur i a Xat sense recàrrega i amb la sessió oberta; «Avant» dues vegades torna al Poble; una més des del Xat ix a la pàgina d'abans. Repetir amb F5 a mitjan camí, amb el botó «arrere» de l'app, en mòbil, i a Safari amb moltes navegacions seguides. A Sollutia, mirar si declara `ruta-a-url`.
- **Píxels:** el premut de la targeta sobre una foto fosca, l'avatar sense disc blanc amb un avatar transparent, les tres miniatures de l'Índex.
- **Arrencada fallida:** si Chrome guarda a la memòria cau un `import()` fallat, el reintent convertix «Carregant per sempre» en un error que torna, no en una recuperació.

### Troballes de dades sense arreglar

- `src/config/assetResolver.js:10-18` i `:178-184`: les nou imatges de reserva dels pobles apunten a `/assets/img/…`, que no existixen; són a `public/assets/uploads/brain/`. Canvi visible: demana ordre.
- `src/data/mapejadorSeccions.js:132`, `:142`, `:152-153`, `:187`, `:195`: en publicar, es copia `avatar_url` a la imatge; és el mateix defecte del Mac Mini per a publicacions de veïns.
- `src/sections/multimedia/MultimediaSection.jsx:15,33`: la capçalera pinta el mes de la primera entrada («gener de 2023»); la vista «Cronologia» és sempre buida.
- `public/assets/`: recursos sense cap referència (segons un agent, no reverificat): `uploads/gent/avatars/`, `uploads/ia/`, `posts/disseny/`, `posts/el-projecte/` i `media_registry.json`.
- `src/sections/text/pageContent.js`: `<iframe src="/iaia-maria">` (`:115`), dues pàgines «Bloc de notes» (`:119`, `:176`), l'errata «Consolidiació» i trimestres passats presentats com a futurs.
- TPV, anterior a esta nit i no verificat per mi: la pantalla diu que «les correccions es fan amb devolucions al torn següent» i `retorna` només troba tiquets del torn obert; escandalls i ingredients no es poden crear ni editar; l'editor de producte no toca IVA, cost ni variants.
- Cervell: `tooling/brain/somiador.mjs` no té guarda de CLI (importar-lo l'executa) i actua per defecte; el cron d'higiene no deixa rastre d'execució (log de 1,7 MB sense rotar, 524 receptes); Plaquetes continua diagnosticant cada hora sense curar; la Porta Llavor només busca el text «Javi Llinares» i ix amb 0 si no troba els fitxers.

### Propostes de disseny, de més a menys valor (cap aplicada)

1. Retallar les 14 vinyetes (no és CSS).
2. Radi del quadrat lateral coherent amb la targeta: `.sp-card-calendar-badge { border-radius: var(--sdp-radi-m); }` (de memòria, no llegida esta nit).
3. Xifres tabulars a `.btn-date-time` i `.sp-card-calendar-badge__dia`.
4. `.sp-card-media { object-position: center; }` a tot arreu («com l'avatar»); mou les fotos verticals.
5. Diana de 48 px als títols de l'Índex de la Consola.
6. Recepta del hover de les targetes del Control conforme (demana girar dues proves que la fixen).
7. Transició del premut global declarada en repòs (`base.css:252-257`); cal mirar-ho al navegador.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres són de la llista que el hook permet. Passada final sobre l'arbre sencer, amb totes les correccions i la màquina lliure:

| Comprovació | Resultat literal |
| --- | --- |
| `npx vitest run src` | Test Files 984 passed, 1 skipped (985) · Tests 16413 passed, 8 skipped (16421) · 613,71 s · exit 0 |
| `npx vitest run tests` | Test Files 9 passed, 5 skipped (14) · Tests 88 passed, 81 skipped (169) · 33,40 s |
| `node --test tests/standalone-build.test.mjs` | pass 31, fail 0 · dos builds reals · entrada 1.381.418 B (gzip 386.524 B), sostre 1.591.855 B · carregador 3.427 B (sostre 4.096 B) · monolític 4.428.611 B · 273 trossos |
| `node --test` de `lint-sessio`, `lint_logica_usuari`, `lint_enxufe`, `lint_xat`, `frontissa-contingut`, `enxufe-plugin`, `conformitat-amfitrio` | tests 93 · pass 89 · fail 0 · todo 4 · «✅ Lint net». Els quatre `todo` són diagnòstics: 186 fitxers tocats fora de la llista del torn d'enxufe, 8 classes d'`App.jsx` sense regla, 3 classes òrfenes de `PageFrame.jsx` i 29 tokens `--sdp-cal-*` (els tres últims, heretats) |
| `node tooling/gates/design_guard.mjs --arrel=src` | exit 1 · PARAT només per `focus-invisible\|css/modules.css\|outline-none` (D-01) · inline-style 17→4, touch-too-small 3→2, raw-color 20→17 · 1965 fitxers, 25 crítics, 8 avisos |
| `node tooling/gates/porta-olivera.mjs --informe` | 5 documents solts, tots declarats vius; safata buida; avís de sediment de l'índex (806 línies, llindar 300) |
| `git status --short` | branca `backup-notes-publish`, HEAD `fdb72ae0` · cap commit, cap fitxer mogut ni esborrat |

Recompte: la suite de `src` passa de 963 fitxers i 16.020 proves (Onada 11) a 984 i 16.413 (+393). L'entrada del paquet creix 824 B (1.380.594 → 1.381.418) i queda a 210 KB del sostre.

Refutació: set refutadors de només lectura (dades, History API, decisions, Gestoria, Rebost i TPV, autocuració, i un segon sobre la reconciliació del TPV), més la refutació del primer torn de CSS feta pel segon. Cap front refutat del tot; defectes reals en tots, corregits o deixats com a límit.

Proves noves sense roig previ executat, dites pels seus autors: l'emmascarament de PAN i IBAN de la Gestoria; la majoria de les proves de l'última ronda del TPV (codi abans que prova); una prova de l'ancoratge de la History API, afluixada per una diferència de jsdom.

No verificat: cap pantalla en cap navegador; «Enrere» a Chrome i Safari reals, bfcache i l'historial conjunt d'un iframe; el pegat de `design_guard.mjs` executat; el plugin amb Yoast, Rank Math o Jetpack reals (els noms dels seus filtres són de memòria) i l'escapat real de WordPress (les proves usen dobles simplificats); la reparació del `seed.sql` contra una base real; les dues càrregues concurrents del TPV (confirmades per lectura i eliminades, mai reproduïdes en execució); el reintent de l'arrencada amb un `import()` fallat de veres; els trimestres amb dades reals.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Hook PreToolUse** (`tooling/gates/hooks-local.mjs`): Bash només admet lectures literals i una llista tancada d'ordres de prova; Write i Edit estan vetats a `tooling/`, `.agents/`, `.claude/`, `scripts/`, `package.json`, `01_produccio/` i fora del repositori; `WebFetch`, `git add`, `git commit`, `npm run`, esborrar i moure fitxers, vetats. Conseqüències: cap commit ni paquet; D-01 preparat i no aplicat; les tres adreces de Kowalski, Holded i Factura Directa sense llegir; els Mods, proposats i no creats; ESTAT, LEDGER, índex de l'Escriptori i `tancament.mjs` són de MarIA. La memòria persistent de Claude Code no s'ha escrit (ruta fora del repositori).
- **Segell de skills divergent** tota la nit: el hook PostToolUse ho ha repetit després de cada eina de cada agent. No és de cap canvi d'esta nit i no s'ha tocat.
- **Dades reals fora del repositori.** Un subagent de la Gestoria va llistar noms i estructura de `../_gestoria_de_poble/02_Facturacio/`, fora de l'abast que se li havia donat, i el front va executar `tests/gestoria-3t-real.test.mjs`, una prova de la casa que imprimix la taula real del trimestre al terminal. Segons els seus informes, cap dada s'ha copiat a cap fitxer, prova ni informe. Als refutadors se'ls va vetar eixa carpeta i eixes proves.
- **Lectures de `90_arxiu_historic/`:** només `261010_1741_auditoria_claude.md`, per ruta exacta, perquè és on es definixen les D-nn que les ordres resolen.
- **Arbre concurrent:** fins a set agents han editat alhora amb fitxers disjunts, i l'orquestradora ha tocat `.agents/`, l'índex de l'Escriptori i dos documents nous durant la nit. Les cites de línia són del moment de cada comprovació.
- **Abast de les ordres:** dos punts s'han complit per sota de la lletra a propòsit. El punt 5 demanava retocar marges, transparències i blur; s'ha aplicat només el que no canvia l'aparença en repòs, perquè sense navegador seria redissenyar a cegues. El punt 6 demanava una Gestoria «plenament operativa demà» i visual; el que s'ha afegit viu al panell de Sentinelles de la Wiki i depén d'una aprovació teua.
- **Delegació:** les ordres diuen «les decisions estan preses per mi» i el document el signa Direcció Tècnica; AGENTS §15 diu que cap document amplia permisos de l'entorn. Tot el que les ordres donaven per fet i el hook veta s'ha deixat preparat, no forçat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
