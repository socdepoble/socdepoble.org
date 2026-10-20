---
type: informe
status: esborrany
description: 'Implementació i verificació de la tasca 2 del pla 261020_2045: la llista viva UniversalListCard, sis modes, rajoles de 98 × 116 px i 375 px.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_21f449a9-9bea-4994-b8cb-c3e167ef8132:2331aca0-3f2b-44c9-affc-df2c9cd2aa85
---
# Auditoria Claude · El Comú, tasca 2: UniversalListCard

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_21f449a9-9bea-4994-b8cb-c3e167ef8132:2331aca0-3f2b-44c9-affc-df2c9cd2aa85 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T19:43:36.004Z |
| Modificació | 2026-10-20T21:26:00.000Z |
| Propietari | Claude Code (torn torn_21f449a9, actor claude, abast code) |
| Aprovació humana | Mestre Javi Llinares: ordre en xat del 261020 («Executa la Tasca 2») sobre el pla 261020_2045; este informe, pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code) |
| Tokens consumits | ~4,2 M en 17 subagents de dos fluxos (mapa: 9 agents, 2,6 M; revisió adversarial: 8 agents, 1,6 M), més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-20T18:39Z: llegits l'auditoria de Gemini (el fitxer real és `261020_2030_auditoria_gemini_enginyeria_inversa_bring_i_lovable.md`; el `261020_1952_…` del primer encàrrec no existix), l'acta 1930 i l'ESTAT. Flux de lectura de 9 agents (8 subsistemes i un crític) sobre el xat, les notes, Pedra Seca, el port, el Bar, els precedents i el procés.
- 2026-10-20T18:52Z: el Mestre fixa el pla oficial `261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md` i la v2.0.0 de l'auditoria, i ordena la tasca 2.
- 2026-10-20T19:08Z: torn obert (`obrir_torn.mjs --actor claude --scope code` → torn_21f449a9-9bea-4994-b8cb-c3e167ef8132) i pla vinculat (`document.mjs plan`, hash 61b8eab0…).
- 2026-10-20T19:10–19:40Z: nucli pur, extractor, hook, peça, full, textos a cinc llengües, catàleg, espècimen i proves; comprovació al navegador a 375 px.
- 2026-10-20T19:45–20:05Z: revisió adversarial de 8 agents (4 lents i un verificador per lent); s'han arreglat totes les troballes confirmades.
- 2026-10-20T20:12Z: primera redacció (tasca 2).
- 2026-10-20T20:20–20:45Z: el commit de la tasca 2 es prepara i s'assaja en una còpia de HEAD + 32 fitxers (sense executar-lo: espera la decisió del Mestre).
- 2026-10-20T20:40–21:25Z: segona ordre del Mestre en xat: els bloquejadors P0 de codi (P0-08, P0-09, P0-10/11, P0-01, P0-03) i la tasca 3 (la llista a Bombolla). Revisió adversarial de 8 agents més, bateria sencera i esta ampliació.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Què hi ha ara a l'arbre (res commitejat)

Una sola peça pública, `UniversalListCard`, a la carpeta que va ordenar el Mestre: `src/components/PedraSeca/UniversalListCard/`.

| Fitxer | Què és |
| --- | --- |
| `UniversalListCard.jsx` | La peça. Les sis vistes de mode són funcions internes (com a `UniversalTPV.jsx`): només s'exporta la peça, i la porta C1 del catàleg en té una entrada sola. |
| `UniversalListCard.css` | El full, dins de `@layer components`, importat des de `src/css/index.css` darrere de `tpv.css` i sense `layer()`. |
| `nucliComu.js`, `basesComu.js`, `modes/*.js` (6) | El nucli pur: la forma neutra, `aplicaAccio` (mai llança), els permisos, els comptes i la guarda anti-eco. |
| `extractorEspecificacio.js` | «2 kg de tomaca» → nom i quantitat; la fusió «2 kg + 1 kg». |
| `useLlistaComu.js` | L'estat viu: confirmada + tocs en vol, `onMuta` per al port de la tasca 4. |
| `exportaComu.js`, `textosComu.js` | La taula, el CSV (el de `src/utils/fulls`), el WhatsApp i els 247 textos `section.comu.*`. |
| `src/sections/disseny/cataleg/detalls/EspecimenUniversalListCard.jsx` | L'espècimen (Pedra Seca §9): els sis modes amb dades de mostra, «Qui toca» i el marc d'una bombolla de 375 px. |

Tocats de manera puntual: la façana `PedraSeca/index.js`, `src/css/index.css`, `registre.js`, `manifest.js` (ítem `estructura/llista-comu`, emoji 🧺), `detailRegistry.jsx`, `versio.js` i les 247 claus a `src/config/idiomes/{ca,es,en,eu,gl}.js`. Proves noves: 6 fitxers, 110 casos.

### 2. Els sis modes

| Mode | Forma | Qui pot fer què |
| --- | --- | --- |
| `rebost` | Rajoles | Tothom afig, commuta i buida el cistell; elimina qui ho va demanar o qui governa. Comparador Poble · Gran superfície amb el desplaçament. |
| `bar_tpv` | Rajoles | Tothom demana; qui demana la seua línia en suma o la lleva mentre és «demanat»; servir i cobrar és de qui governa. El preu és el de la carta. |
| `colla_cens` | Rajoles | Reclamar és un intercanvi atòmic (quota, «ple», «ja en tens un»); alliberar un lloc, només qui el té o qui governa. |
| `banda_eixida` | Files | Cada músic confirma, es dona de baixa o posa cotxe; la junta paga i és l'única que veu sous, total i fons. «Volen · Anem · Cotxes» i el que falta per corda. |
| `loteria_diposit` | Files | Les quatre signatures en el seu ordre; la societat signa la junta, el depositari amb compte signa ell; comptes en cèntims (20 € + 15 % = 23 €; 2,40 € + 25 % = 3 €; dècims a reservar per a les paperetes). |
| `escola_educand` | Files | Privada: només el professorat i la família. Lletres en paraules, nota mensual i evolució en línia, diàleg de tutoria. |

«Governar» és ser el propietari (`propietariId`) o un dels `configMode.gestors`. La identitat de cada toc és l'`actor` de la sessió, mai un text lliure (la vulnerabilitat de la Vila Gal·la). Ací és la regla local i optimista; la de veres l'ha de repetir el servidor (tasca 1).

### 3. L'ordre del Mestre, complida i verificada

- **98 × 116 px.** `inline-size: 6.125rem; block-size: 7.25rem`. En rem, perquè creixca amb la lletra de la persona; a 16 px fan exactament 98 × 116. Medit al navegador: 98 × 116.
- **300 ms.** `--sdp-durada-sostre` (300ms) amb `--sdp-corba-suau`. Al navegador, el mateix botó passa pel color intermedi als 120 ms i acaba al de «resolt». Per això el Rebost és una sola graella: amb dues seccions, la rajola canviava de lloc, React la tornava a muntar i la transició no es veia.
- **375 px.** En una bombolla de 375 px (uns 236 px de contingut) hi caben dues rajoles per fila. Al navegador, amb viewport 375 × 812, cap element de la peça desborda i la pàgina no fa scroll horitzontal. Cap regla de la peça fa scroll: viu dins de l'únic scroll del xat.
- **Sis modes**, amb el nucli, la vista, les proves i l'espècimen de cadascun.

### 4. Decisions preses (es poden revertir; requires_human_decision on es diu)

1. **Doctrina de Pedra Seca damunt de la còpia literal de Bring!** La lletra no baixa de 14 px (l'etiqueta de Bring! és d'11). Els colors són tokens: actiu en el blau d'acció, «servit» en avís i resolt en èxit; cap `#EE524F` ni `#4FABA2`. La vora fa servir `--sdp-radi-s`, no els 3 px de Bring!. L'estat també es veu en dibuix (✓, rellotge, safata, monedes) i es diu en text al lector.
2. **Reimplementació pròpia de l'extractor**, a partir del comportament i no del codi de Bring!. Una prova de qualitat comprova que no hi ha cap tros de les seues expressions ni de les seues unitats. L'expressió que cita l'auditoria (§2.2) porta `[s]+` en lloc de `[\s]+` i no casa amb el seu propi exemple, i la seua llista d'unitats és alemanya, anglesa i xinesa. La nostra entén les unitats de les cinc llengües (dotzena, barra, manat, racions…).
3. **La fusió** concatena («2 kg + 1 kg»): així es veu que dues persones ho han demanat. La suma va a banda i només es fa quan totes les parts són de la mateixa magnitud. A 80 caràcters, la fusió es plega a la suma. Els recents són 12, com diu el pla, però la Nevera en guarda 20.
4. **La quantitat escrita a mà va a la taula.** El toc de Bring! a l'etiqueta de l'especificació no hi cap: dos objectius de 48 px no caben en una rajola de 116.
5. **Exportar com a imatge no està fet.** Necessita una dependència nova (`html2canvas`), i AGENTS prohibix `npm install` sense aprovació. Hi ha WhatsApp i CSV. **requires_human_decision: true.**
6. **La fitxa d'escola no s'exporta al WhatsApp**: és informació d'un menor. Per a la «M», el text és «Cal millorar» en lloc de «Mal», en coherència amb el seguiment no punitiu. **requires_human_decision: true.**
7. **El Bar.** El preu és el de la carta i, fora de la carta, només el posa qui governa. Les línies són de cada persona, que en suma les seues però no les d'altres. No hi ha cap pont amb l'app El Bar: és segellada, local i només de desenvolupament, i el pla no el demana en la tasca 2.
8. **`interactiva={false}`** pinta la peça sense cap control (cap botó, camp, píndola ni alerta), per al mode de selecció del xat, on el `<li>` sencer és una casella. Sense actor, la peça també es llig però no es toca.
9. **La clau de muntatge a Bombolla** l'ha decidida el Mestre en la segona ordre: `missatge.tipus === 'llista_comu'` (vegeu el §9).

### 5. El que han trobat els 9 agents del mapa i que condiciona les tasques 1, 3 i 4

- **El missatge del xat no pot portar l'estat viu.** `xat_envia` només accepta `tipus` 'text'. La versió del repo (2610081543, B08) desa `metadades` buides, i `XatContext` no envia mai `metadades`. Ni l'autor ni ningú pot fer UPDATE d'un missatge: la RLS el revoca. El temps real del xat només avisa d'INSERT («nous» per `xat:f:<fil>`). Conclusió: l'estat de la llista ha de viure en una taula pròpia amb una RPC, i el missatge porta només la referència. Això encaixa amb `comu_llistes` del pla. L'avís de canvi ha de ser un altre trigger o una branca de la política de `realtime.messages`.
- **Bombolla i Conversa.** Bombolla no està memoritzada, i cada tecla del compositor repinta totes les bombolles: la targeta ha de ser un fill memoritzat. Conversa no observa la mida de cap element (cap ResizeObserver ni `overflow-anchor`): una targeta que creix al final no es queda enganxada a baix. Cal provar-ho a iOS WKWebView en un aparell.
- **La doble escriptura de grups encara no existix al codi**, tot i que l'acta 1930 la dona per canon. `creaNota` descarta qualsevol camp que no siga de la llista blanca (`tipus`, `llistaId`). La carpeta «El Comú · Grups i Llistes» no existix al catàleg de carpetes, i una nota fora del catàleg desapareix de la barra. Tampoc no existix cap canal `#comunitat` al Mur.
- **El port.** `CAPACITATS_PER_DEFECTE` no existix: és `CAPACITATS` a `src/data/contracte.js`, i `backendPort.js` refusa les capacitats parcials. La paraula «offline-first», que fa servir l'auditoria v2, està vetada pels lint del xat.
- **L'SQL de l'auditoria** no porta `ENABLE ROW LEVEL SECURITY`, GRANTs ni polítiques (`.agents/rules/supabase_grants.md`, tractor-rls). Fa servir `poble_id text` en lloc de `tenant_id`, i un sol array JSONB serialitza tots els tocs en un sol bloqueig de fila. La migració l'aplica el Mestre, mai un agent.
- **El Bar.** `vistes/VistaVenda.jsx` no existix. No hi ha cap model d'estoc (l'Onada 12 el va declinar), ni cap estat pendent/cuina/servit/cobrat, i el seed de La Parròquia no porta ingredients.

### 6. Revisió adversarial i arranjaments

Quatre lents (nucli, accessibilitat i 375 px, privacitat i seguretat, contracte), amb un verificador per lent que intentava refutar cada troballa: 33 troballes, 26 confirmades, algunes repetides entre lents. **S'han arreglat totes les confirmades**, cadascuna amb la seua prova:

- **Hook (alta).** Amb dos tocs en vol rebutjats, quedava un toc fantasma que el servidor no havia acceptat mai, i la llista s'encallava. La resposta del servidor amb la mateixa revisió es descartava com si fora un ressò. Ara la llista pintada és sempre `confirmada + pendents`, i els pendents es tornen a aplicar amb el seu rellotge i els seus ids. La resposta directa del servidor mana; una altra llista, o cap, reinicia la vista (una fitxa privada ja no es pot quedar pintada); l'alerta «llista-invalida» se'n va quan arriba la bona.
- **Accessibilitat.** Al Bar i al Rebost amb peticions repetides, l'estat ja no es veu només pel color. El focus torna al títol quan el control premut desapareix. Amb `interactiva={false}` no queda cap botó ni alerta. Les etiquetes del cotxe i del pagament són fixes i l'estat va a `aria-pressed`. La rajola del Bar ja no porta `aria-pressed`. Les accions de cada músic es diuen pel seu nom. Els textos sense espais no desborden. La columna d'accions es diu «Accions» i la capçalera de fila del Bar és el nom.
- **Nucli.** Un músic pagat no es pot donar de baixa fins que la junta desfà el pagament. Anotar un mes que la capa no portava també es guarda. Sense cap quantitat comparable, el comparador no inventa cap estalvi. Un camp de retornats buit ja no és un zero. `aplicaAccio` no llança mai. Una persona sense nom és «Algú», mai el seu id intern.
- **Refutades (7).** Un rebost on tothom pot buidar el cistell és una regla escrita, no un forat. La resta són formes de dades que cap camí de la tasca 2 no produïx. Amb tot, s'ha endurit el preu del Bar i la captura d'excepcions.

### 7. Governança i estat

- **Torn.** `torn_21f449a9` és obert i amb el pla vinculat. Claude no escriu a `.agents/`, i per això ESTAT i LEDGER, i amb ells el tancament (`tancament.mjs --close`), queden per a MarIA o el Mestre.
- **El pla de MarIA.** «Estat del Pla» encara és la tria de la plantilla (CONV-06). Si el pla canvia, el vincle del torn dona «Pla absent o modificat».
- **Turns de documents.** Els de MarIA (`torn_1be1a18c`, `torn_83d9b889`) veuran canvis a `src/` i `tests/` i, en tancar, avisaran «fora de l'abast documental».
- **Res commitejat.** El primer pas del pre-commit (`frontissa-contingut`) ja falla pels canvis d'altres mans a `pageContent.js` i `legalContent.js`. El commit queda a decisió del Mestre, amb índex temporal i llista explícita, com a la Fase D.
- **L'escriptori s'ha mogut durant el torn.** Altres mans han arxivat l'informe de la Fase D i han deixat una auditoria nova de Gemini (`261020_2100_…`). No s'hi ha tocat res.

### 8. Decisions que són del Mestre (requires_human_decision: true)

1. Exportar com a imatge: afegir `html2canvas` o deixar CSV i WhatsApp.
2. ~~La clau de la tasca 3~~: decidida, `missatge.tipus === 'llista_comu'`.
3. El text de la «M» de l'escola («Cal millorar» o «Mal»).
4. **Les dades personals dins de l'auditoria de Gemini**, preses de `01_produccio/Banda La Torre - Gestió/`: noms reals de músics i de dipositaris, imports de 2007, i una fitxa d'alumne amb nom i cognom. Qui pot llegir este document, i si cal anonimitzar-lo.
5. **La loteria amb recàrrec** (venda de dècims a 23 €) i la tributació del donatiu: cal una comprovació legal abans de la tasca 4. Això no és cap consell legal.
6. **Les vulnerabilitats de la Vila Gal·la** són d'una app de tercers en producció. Si són reals, toca una comunicació responsable, no publicar-les.
7. **Els noms dins del JSONB d'`elements_comu`** no s'esborren en cascada quan es purga un compte (RGPD). Cal decidir com es purguen, en la tasca 1.

### 9. Segona tanda (261020, nit): bloquejadors P0 de codi i tasca 3

El Mestre va enviar dues versions de l'ordre; mana la segona, que corregix el P0-08.

**P0-08 · `src/sections/text/legalContent.js`.**
- L'apartat 1 té la redacció harmonitzada. El Rentonar (CIF G-03967668, validat per TechSoup i Goodstack), amb el dígit de control correcte. El reconeixement comarcal de la Coordinadora d'Estudis Eòlics del Comtat i l'Aplec pel Territori. I el titular i promotor responsable davant la LSSI-CE i la subvenció NLnet (50.000 €): Fco. Javier Llinares García, NIF 21476359V, Carrer Sant Isidre Llaurador, 16, 03108 - La Torre de les Maçanes (Alacant).
- L'apartat 7 continua igual que a HEAD, amb les mateixes dades.
- Les 15 «conta» que volien dir el compte d'usuari són ara «compte»: 14 de visibles i l'assumpte del `mailto`. La concordança és correcta («un compte … el donarem de baixa», «s'esborren amb ell»). El verb «contar» es queda.
- `id="esborra-compte"` s'ha afegit a l'`<h5>`, com vas ordenar. El sanejador de l'app el lleva sempre: la prova `sanitize.test.js` ho fixa. L'àncora que funciona a l'app, a WordPress i al mòbil continua sent `data-sdp-ancora`, des de la Fase D. **El P0-06 de veres és publicar**: producció és un desplegament de Firebase vell que no porta `/legal#esborra-compte`.
- La primera versió de l'ordre (canviar de titular a una «Associació Cultural Sóc de Poble») es va fer i es va desfer quan va arribar la segona. El prompt de l'escriptori `261020_2235_prompt_gemini_auditoria_salfumant_sistema_i_android.md` (línia 113) ja deia que el titular havia de continuar sent la persona física, per la subvenció.

**P0-09 · `src/sections/text/pageContent.js`.**
- Fora l'iframe recursiu de `/iaia-maria`, que portava estil en línia i una classe sense cap regla.
- L'enllaç ara és `<a href="/wiki">`, com vas ordenar. `/wiki` no existia i anava a «Pàgina no trobada», així que s'ha afegit a `src/app/App.jsx` `<Route path="wiki">` → `/wikidepoble`, com el `/skills` d'abans.
- Prova nova: `anima.sanejament.test.js`.

**P0-10 / P0-11 · diccionaris.**
- «ítems» no apareix en cap valor de `ca.js` ni de cap altra llengua; només en comentaris de codi. No hi ha res a canviar.
- Les claus `section.comu.*` de `es`, `en`, `eu` i `gl` que coincidixen amb el valencià són paraules que es diuen igual en eixa llengua: «Sí», «No», «Total», «Abril», «Mes», «Regular», «Barra», les lletres E/B/R/M/X, «Taula» i «Plantilla» en basc, «Places» i «Format» en anglés, «Corda» i «Baixa» en gallec. Cap no ha quedat en valencià en brut.

**P0-01 · `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql`.**
- **La fuga.** El `grant select (contact_email, public_email) … to anon, authenticated` i la política «public read public organizations» deixaven qualsevol visitant llegir el correu privat de les organitzacions públiques.
- **L'arranjament.** Ara hi ha `revoke select (contact_email) … from public, anon, authenticated` i només `grant select (public_email)`. El correu privat el llig només qui administra l'organització, per l'RPC `contacte_organitzacio`.
- **Per què n'hi ha prou.** `organizations` funciona amb permisos de columna (`revoke all` a l'esquema inicial), i per tant el REVOKE de columna és efectiu. El fitxer és idempotent: tornar-lo a aplicar tanca també una base on s'haguera aplicat la versió d'abans.
- **Documentació i prova.** Entrada nova a `supabase/README.md` («NO aplicada: l'aplica el Mestre») i prova estàtica `organitzacionsCorreu.migracio.test.js`, que també veu un futur GRANT de taula sencera.

**P0-03 · `ios/App/App/Info.plist` (no fet: bloquejat).** No hi ha cap identificador de client iOS de Google en cap `.env` ni enlloc del repo. L'esquema `com.googleusercontent.apps.<id>` naix del client iOS que s'ha de crear a Google Cloud. `vite.natiu.config.js` ja refusa un id sense el seu esquema. **requires_human_decision: true.**

**Tasca 3 · la llista a la bombolla.**
- `Bombolla.jsx` munta `TargetaLlistaComu` quan `missatge.tipus === 'llista_comu'` i `metadades.llista` passa `validaLlista` (`src/sections/xat/llistaComu.js`). Sense una instantània llegible (un mode nou, sense títol), pinta el text de sempre.
- `TargetaLlistaComu` és `React.memo`, i l'actor ve memoritzat de `XatSection` (`joId`, `joNom`, `senseSessio`) per props, a través de `Conversa`. La prova escriu quatre lletres al compositor i la targeta no es torna a pintar. Si es lleva el `memo`, la prova falla.
- **Mode de selecció.** La bombolla és una casella i la targeta queda sense cap control.
- **Text sense llista.** Un missatge de text pinta el DOM de sempre.
- **CSS del xat.** `.sdp-xat-bombolla--llista:focus-within { z-index: 1 }` va a `modules.css`, perquè els suggeriments d'«Afig…» no queden davall de la bombolla següent. El `filter` de la bombolla en fa un context d'apilament: troballa de la revisió.
- **Catàleg.** L'espècimen del xat (`EspecimenXat.jsx`) porta la bombolla amb llista, també en mode de selecció, les files de contracte i `versio.js`. El lint del xat inclou els fitxers nous.
- **Geometria a 375 px.** Amb la llista de missatges a 351 px en mode estret, la bombolla fa 239 px, la targeta 215 i hi caben 2 rajoles per fila. A la columna del catàleg (237 px, pel rail) n'hi cap 1, i el botó «Afig» baixa davall del camp en lloc de partir-se.
- **Encara no es pot veure en un xat de veres.** El servidor no accepta `tipus` 'llista_comu': `xat_envia` només admet 'text' i el CHECK de `xat_missatges` no el porta. És la tasca 1, igual que el port (`onMutaLlista`, tasca 4).

**Revisió adversarial de la tanda.** 8 agents en 4 lents (text legal, tasca 3, SQL i rutes, regressions) han donat 3 troballes confirmades, totes arreglades: els suggeriments tapats, el reconeixedor més permissiu que la targeta i la prova del P0-01 cega als GRANT de taula. Se n'han refutat 5. L'aposició sobre la Coordinadora i l'Aplec és editorial, i el projecte ja la publica a l'Aplec 2023. La versió 2.1 del text legal i la frontissa són d'abans de la tanda.

**Frontissa.** `frontissa-contingut.mjs` demana la teua aprovació per a `legal`, que ja divergia a HEAD per la Fase D, per a `anima` (P0-09) i per a `constitucio`, que és d'una altra mà. **requires_human_decision: true**:
```
node tooling/gates/frontissa-contingut.mjs --aprova legal --per "Mestre Javi Llinares"
node tooling/gates/frontissa-contingut.mjs --aprova anima --per "Mestre Javi Llinares"
```

**El commit de la tasca 2** està preparat i assajat:
- índex temporal i llista de 32 fitxers;
- en una còpia de HEAD més estos fitxers (arbre `df59bcee`): Vitest sencer en verd (1.195 fitxers i 20.284 proves), lint a 0, i taxonomia, plantilla viva i porta-documents en verd;
- frontissa, Reflex, tancament i run-portes fallen igual que a HEAD sol, i la bateria Node té les mateixes fallades que HEAD.

No s'ha executat. Ara és vell: `UniversalListCard.css` ha canviat en esta tanda, i la guarda del script l'aturaria. Cal tornar-lo a assajar, sol o junt amb esta tanda.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves de la peça.** `npx vitest run src/components/PedraSeca/UniversalListCard/ src/config/i18n.comu.test.js src/components/PedraSeca/qualitat.universalListCard.test.js` → **110 de 110** en verd. Cobrixen el nucli (els sis modes, permisos, comptes, anti-eco), l'extractor, el hook (10 casos, amb els de la revisió), la peça (els sis modes, lectura, privacitat, focus, taula) i la qualitat: ESLint a zero, tokens, escala, 48 px, 1:1, cap scroll, la geometria de 98 × 116 i els 300 ms, Baseline 2022, C1, C2 i C3, i cap tros de Bring!. També la paritat de les 247 claus a les cinc llengües.
- **Bateria dirigida.** `npx vitest run src/sections/disseny src/components/PedraSeca src/config src/css src/components/universal tests/lint_xat.test.mjs tests/lint_logica_usuari.test.mjs` → **305 fitxers, 4.569 proves, totes en verd** (exit 0). No s'ha corregut la bateria sencera (més de 10 minuts).
- **ESLint.** `npx eslint src/components/PedraSeca/UniversalListCard/ --max-warnings=0` → 0.
- **Portes globals.** Ja eren roges abans d'este torn: tractor-cataleg (C1 `ENQUADRAMENTS_AVATAR`, d'`Avatar.jsx`, no tocat), tractor-pedra-seca, design_guard, tractor-tokens, tractor-vocabulari i tractor-inline-styles. Cap informe (`tractor-pedra-seca --detall` inclòs) no nomena cap fitxer, classe, token ni clau d'este torn, llevat d'una: la V3 del vocabulari («cap .css sota src/components») marca `UniversalListCard.css` igual que ja marca `tpv.css`, `pecesApps.css`, `catalegColleccio.css` i `alergens.css`, el patró establit dels fulls de peça. tractor-classes ix 0; les seues «mortes» són heurístiques i també hi surt `.sdp-pindola`.
- **Documents i tancament.** `document.mjs check` sobre este informe dona vàlid, i `porta-olivera.mjs` ix 0, amb els avisos de sediment de l'índex d'abans. `tancament.mjs --check --turn-id torn_21f449a9…` ix 1:
  - falta el relleu d'este torn a `.agents/ESTAT.md` i `.agents/LEDGER.md`, que Claude no escriu;
  - la resta de fallades són d'abans i alienes a este torn: la signatura del LEDGER, el segell, enllaços de l'índex cap a `02_investigacio_ia` i scc.
- **Segona tanda, bateria sencera.** `npm test -- --run` sobre l'arbre viu final, que inclou també els canvis d'altres mans, dona **1.198 fitxers i 20.312 proves en verd, cap fallada** (100 omeses, 585 s). `npm run lint` dona 0. A la bateria Node (`npm run test:node`) hi ha les mateixes fallades que a HEAD sol (storage, «cap permís s'hereta», diagnòstics heretats) i el diagnòstic `todo` dels fitxers sense commitejar. Les portes de disseny no porten cap identitat nova d'esta tanda.
- **Navegador.** Al navegador del panell, sobre el servidor de desenvolupament :3340 i l'espècimen, amb viewport 375 × 812, s'ha comprovat:
  - la rajola fa 98 × 116 px;
  - la transició dura 0,3 s, amb el color intermedi als 120 ms i el mateix node;
  - cap element desborda i el scroll horitzontal és 0;
  - el toc passa la tomaca al cistell;
  - el Bar mostra el dibuix de cada estat;
  - la Banda i la Loteria caben en 375 px.

  Captures fetes durant el torn.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Fora d'esta tasca.** El port i la migració (tasques 1 i 4) i la doble escriptura no s'han tocat. La tasca 3 ja munta la peça a Bombolla, però un xat de veres encara no pot rebre un missatge `llista_comu` fins a la tasca 1. Es veu al catàleg: `/disseny?categoria=estructura&item=estructura-llista-comu` i, dins d'una bombolla, `/disseny?categoria=fonaments&item=fonaments-xat`.
- **No fet.** El P0-03, que espera el client iOS de Google.
- **Sense aparells reals.** No s'ha provat en un aparell iOS ni Android ni en el WebView de Capacitor: el comportament de l'scroll del xat quan la targeta creix s'ha de mirar en la tasca 3.
- **Traduccions.** Les de l'eusquera i el gallec són pròpies i curtes, i convé que les revise algú que en siga parlant.
- **Res commitejat**, cap migració escrita i cap dependència nova.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261020_2045_pla_implementacio_el_comu_i_llistes_reactives]]
- [[261020_2030_auditoria_gemini_enginyeria_inversa_bring_i_lovable]]
- [[261020_1930_acta_marmota_relleu_fase_d_i_enginyeria_inversa_bring_lovable]]
