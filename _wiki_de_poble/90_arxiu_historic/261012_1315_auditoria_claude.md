---
type: informe
status: esborrany
description: Gauntlet adversarial sobre el carril Projectes i subvencions (expedient, terminis, guardes), la Frontissa de Sollutia i el disseny pendent de la Finestreta, amb evidencia reproduible.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_825650fa-73f5-401e-be42-00d08edd4c42:261da935-05fb-478f-a765-a0796ac94d97
---
# Auditoria adversarial de la Finestreta de Subvencions (Onada 12)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_825650fa-73f5-401e-be42-00d08edd4c42:261da935-05fb-478f-a765-a0796ac94d97 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T11:11:29.942Z |
| Modificació | 2026-10-12, vespre (hora aproximada: l'entorn no deixa llegir el rellotge; l'últim annex és de les 18:55 locals) |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (caça i primers àrbitres) i Claude Opus 5.5 (resta de la refutació, consolidació i redacció) |
| Tokens consumits | Subagents mesurats: 1.889.084 (segona execució) i 19.860.645 (tercera). Primera i quarta execució i fil principal, sense mesura |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-12T11:11:29.942Z: esborrany creat amb `document.mjs create`, torn `torn_825650fa-73f5-401e-be42-00d08edd4c42`.
- Primera execució del Gauntlet (Fable 5.1): set lents de caça acabades; refutació aturada per ordre del Mestre.
- Segona execució (Fable 5.1): s'afig la lent de la Xylella; tall pel límit de Fable.
- Tercera execució (Opus 5.5): 125 dels 156 àrbitres acabats; tall pel límit de sessió abans d'escriure cap annex.
- Quarta execució (Opus 5.5): es rellancen els àrbitres pendents i s'escriuen 12 annexos; aturada per ordre de tall tèrmic del Mestre.
- Tancament: este informe es redacta només amb el que ja estava confirmat. El que falta és a «Àrees Pendents d'Auditoria».
- Correcció (IAIA MarIA): S'ha afegit l'aclariment de la decisió d'API per a `creaExpedient` a la secció 6 (no és fals positiu).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Què s'ha auditat de veres

La «Finestreta de Subvencions» no existix al codi. Cap fitxer de `src/`, `supabase/` ni `tooling/` conté la paraula. El que hi ha, i el que s'ha auditat, és:

- El carril pur «Projectes i subvencions»: `src/sections/gestoria/projectes/nucli/expedient.js`, amb els carrils d'Identitat (`identitat/nucli/`) i Burocràcia (`burocracia/nucli/`) dels quals depén.
- El domini «subvenció» fora del carril: `documents/catalegTipus.js`, `documents/classificaDocument.js` i `nucli/receptes.js`.
- La Frontissa de Sollutia: `src/data/adaptadors/sollutia/` i les seues portes.

El carril no està endollat: `fronteraModelsPurs.test.js` afirma que cap fitxer de `src/` de fora l'importa, i la prova passa. Per tant esta auditoria jutja fonaments, no una pantalla.

### 2. Mètode i recompte

Huit lents de caça independents, i tres àrbitres adversarials per troballa (reproducció, doctrina, impacte) amb l'encàrrec de tombar-la. Una troballa cau si dos àrbitres la refuten.

| Mesura | Valor |
| --- | --- |
| Lents de caça | 8 |
| Troballes úniques | 52 |
| Taula de veredictes de la tercera execució | 36 vives, 5 tombades, 11 sense veredicte |
| Annexos consolidats i escrits (quarta execució) | 12 |
| Severitat dels 12 annexos | 3 alta, 6 mitjana, 3 baixa |
| Troballes crítiques | cap |

Els annexos porten la numeració final, calculada després de completar la refutació. Per això F03 és una troballa que a la taula de la tercera execució encara no tenia veredicte.

### 3. Troballes consolidades

Cada annex és a `02_investigacio_ia/261012_1315_auditoria_claude/` i porta l'evidència pas a pas, el codi complet de la proposta, la prova vitest i les esmenes dels àrbitres ja integrades. Ací va el resum i el que he tornat a comprovar jo sobre el codi.

| Id | Severitat | Fitxer | Vots | Decisió humana |
| --- | --- | --- | --- | --- |
| F01 | alta | `identitat/nucli/guardes.js` 54-73 | 3 de 3 | sí |
| F02 | alta | `identitat/nucli/guardes.js` 54-65 | 3 de 3 | sí |
| F03 | alta | `identitat/nucli/guardes.js` 54-66 | 3 de 3 | sí |
| F04 | mitjana | `projectes/nucli/expedient.js` 117-141 | 3 de 3 | no |
| F05 | mitjana | `burocracia/nucli/obligacions.js` 344-347 | 3 de 3 | sí |
| F06 | mitjana | `identitat/nucli/guardes.js` 51-52 | 3 de 3 | sí |
| F07 | mitjana | `adaptadors/sollutia/client.js` 1-17 | 2 de 3 | sí |
| F08 | mitjana | dues proves que infringixen E1 | 2 de 3 | no |
| F09 | mitjana | `documents/classificaDocument.js` 176 | 3 de 3 | no |
| F11 | baixa | `projectes/nucli/expedient.js` 357-368 | 3 de 3 | no |
| F12 | baixa | `projectes/nucli/expedient.js` 260-261 | 3 de 3 | sí |
| F13 | baixa | `projectes/nucli/expedient.js` 56-60 | 3 de 3 | sí |

**F01, F02 i F03 · La guarda d'identificadors no veu un DNI escrit a grups.** Són el mateix defecte trobat per tres lents distintes (guardes, proves i Xylella), i per això compten com un sol problema.

- Evidència comprovada per mi: `normalitzaNif` (`nucli/nif.js:35`) lleva espais, punts i guions abans de validar. La taula `FORMES_VETADES` (`guardes.js:63-73`) només admet punts entre els grups del DNI, i exigix set xifres seguides al NIE i al NIF d'entitat. Un DNI amb espais o guionets entre grups, o un NIF d'entitat amb punts, passa la guarda i el validador fiscal l'accepta.
- Font de veritat: el comentari de `guardes.js:54-56` («Els separadors habituals (espai, guionet, punt) també compten») i la regla del fitxer de fallar cap al costat segur.
- Abast: la mateixa taula està copiada a `src/utils/vendes/registreVendes.js`, segons els annexos.
- Proposta: ampliar la taula. Els tres annexos proposen formes distintes per a les mateixes línies i cal aplicar-ne una sola.
- `requires_human_decision: true`. La forma segura refusa també «any, número de tres xifres i lletra», que pot aparéixer en un àlies o en un id d'expedient.

**F04 · `comprovaTerminis` no refusa ids repetits.** Dos terminis propis amb el mateix id donen el mateix id opac derivat, i l'`.ics` en perd un. Comprovat: `comprovaFites` porta la guarda `ID_REPETIT` i `comprovaTerminis` no. Proposta: la mateixa guarda, i refusar l'id que tape un termini del programa. `requires_human_decision: false`.

**F05 · L'id d'una ocurrència no porta el titular.** `obligacions.js` fa l'id amb l'obligació i la finestra. Dos titulars amb la mateixa obligació compartixen id, i `icsDeTerminis` fon els dos actes per UID. `requires_human_decision: true`: posar el titular a l'id gira quatre assercions de proves; posar-lo només a l'UID no en gira cap.

**F06 · `CONTROL` només veta C0 i DEL.** Comprovat a `guardes.js:52`. Els caràcters de format i els separadors Unicode passen, i un caràcter invisible partix un DNI davant de la guarda. `requires_human_decision: true`: cal dir si un emoji compost s'admet a l'àlies, i si la còpia del Bar va al mateix commit.

**F07 · No hi ha cola entre `recursos.js` i `client.js`.** Comprovat: `client.js` té `apiOrigin` nul i `resources` buit; `recursos.js` dona `{ traductor }` i `creaFrontissa` demana un descriptor complet. A més, `tractor-frontissa.mjs:33-36` exigix que `client.js` tinga un sol import, de manera que la porta veta l'import que endollaria el traductor. Un àrbitre (doctrina) la refuta com a deute ja conegut (D10). `requires_human_decision: true`: endollar-ho toca una porta de `tooling/gates`, que demana executor i lease.

**F08 · La Porta Enxufe és roja per dues proves.** Comprovat: `node tooling/gates/tractor-enxufe.mjs` ix amb 1 i dues infraccions E1, a `src/config/i18n.claus.test.js` i `src/sections/profile/PerfilPublicSection.test.jsx`. Proposta: arreglar les proves, no afluixar la porta. `requires_human_decision: false`.

**F09 · `ORGANISMES.find` tria per ordre de llista, no de text.** Comprovat a `classificaDocument.js:176`. Una resolució d'un organisme que esmenta un altre de més amunt a la llista s'atribuïx al segon. `requires_human_decision: false`.

**F11 · `potImputar` no valida `nova.factura` ni `nova.expedient`.** Comprovat: només mira els imports. Diu «possible» per a una factura sense id. `requires_human_decision: false`.

**F12 · `conservacioExpedient` contradiu el seu comentari.** Comprovat a `expedient.js:260-261`: amb pagament i sense justificació dona una data, i el comentari diu que sense justificació no se'n pot dir cap. `requires_human_decision: true`: mana el comentari o mana el codi.

**F13 · La plantilla del Kit Digital no té cap termini des de l'acord.** Comprovat a `expedient.js:56-60`: un termini ix de la concessió i dos de la factura. El temps d'instal·lar i facturar no es vigila. `requires_human_decision: true`: la durada l'ha de confirmar la gestoria.

Cap dels fitxers tocats és font d'un tractor signat, segons els annexos. Les propostes no tornen cap aprovació a «pendent».

### 4. Requisit històric: la carta de la Xylella

Antecedent llegit a `261012_1322_relat_historic_xylella.md`: en un prototip anterior, en omplir una comunicació oficial, la IA va posar un identificador personal al camp del nom. El relat demana revisar si l'arquitectura té esquemes estrictes per a les dades d'identitat.

Resposta, amb el que he comprovat al codi:

- **Els models sí que són esquemes tancats.** `expedient.js`, `titular.js`, `document.js` i `configEmpresa.js` refusen tota clau desconeguda, comproven tipus, fallen tancat i tornen objectes congelats. El traductor de la Frontissa torna un DTO tancat. Ho fan amb JS propi: la casa prohibix dependències sense aprovació, i Zod no hi cap.
- **El buit és una altra capa.** L'expedient i el titular veten per disseny tot identificador personal: el nom legal i el NIF no viuen en eixos models. No hi ha enlloc un mapatge entre el model i els camps d'un formulari oficial. L'error de l'antecedent no l'impedix cap estructura.
- **La guarda que hauria de parar-lo té el forat de F01-F03.** Un identificador escrit a grups passa per «text».
- **El cas real de l'antecedent no té font de dades.** El titular d'una llar només porta un id opac i un àlies (`titular.js`). El nom legal, el NIF i l'adreça d'un particular no són a cap model.

Requisit que este informe deixa fixat per a la Finestreta, abans que la IAIA ajude a omplir cap tràmit:

1. Un mapatge declaratiu camp a camp, on cada camp del formulari declara el seu origen i el seu tipus. La IA no tria mai el camp.
2. Un comprovador que refuse un valor amb forma d'identificador en qualsevol camp que no siga d'identificador fiscal, un camp no declarat i un origen no declarat.
3. La guarda i el validador fiscal coherents entre ells (F01-F03 aplicada).
4. Una previsualització camp a camp que la persona confirma abans de generar cap document.
5. Una decisió del Mestre sobre on viuen les dades d'identitat d'un particular.

La lent de la Xylella va proposar el mòdul del punt 1 i 2 amb codi complet. Eixe mòdul no està consolidat: és a les àrees pendents.

### 5. Integració GET amb Sollutia

- **Segura per construcció.** El transport és GET, sense credencials, sense redireccions, amb origen fixat i DTO tancat. Les proves de la Frontissa passen.
- **No preparada per a rebre un recurs demà.** Activar un recurs obliga a editar `client.js` i xoca amb la porta (F07). La Porta Enxufe és roja (F08) i talla la cadena abans de les portes d'Adaptadors i Frontissa.
- **Sense port per a expedients.** `CAPACITATS` no té res d'expedients. Si la Finestreta desa al cofre local no cal; si ha de sincronitzar entre dispositius cal una capacitat nova i una ADR. És decisió del Mestre, no defecte.

### 6. Troballes tombades per l'àrbitre

| Fitxer | Troballa | Refuten |
| --- | --- | --- |
| `projectes/nucli/expedient.js` | Un expedient creat no pot tornar a passar per `creaExpedient` | reproducció, doctrina |
| `adaptadors/sollutia/creaFrontissa.js` | El token de sessió no té via i una lectura personal rebria 401 | les tres |
| `src/config/origensSollutia.js` | `allowedOrigins` és una segona llista d'orígens | les tres |
| `nucli/receptes.js` | «Subvención: 50 %» desapareix com a evidència | doctrina, impacte |
| `identitat/nucli/document.js` | No hi ha tipus per a un paper d'ajuda | les tres |

El motiu detallat de cada refutació és a la memòria cau del workflow. El registre escrit no s'ha arribat a generar.

**Nota (Decisió d'API sobre `creaExpedient`)**: L'àrbitre va tombar inicialment la primera troballa, però el fet és real i s'ha reproduït en 5 veredictes: el resultat de `creaExpedient` inclou `schema` (`expedient.js:201`), i `validaExpedient` el refusa (`:75`). L'àrbitre considera que no és un defecte sinó una decisió d'API pendent del Mestre: quan la Finestreta guarde expedients i n'haja de marcar una fita, la base d'editar és el registre guardat o les dades que el van crear? Queda anotat com a decisió arquitectònica pendent i no com a fals positiu.

### 7. Retroalimentació sobre la plantilla `prompt_local`

- El prompt demana auditar una infraestructura que no existix amb eixe nom. Hauria de llistar les rutes del perímetre.
- El mètode en bucle no porta sostre de consum ni criteri d'aturada. Esta sessió ha topat tres vegades amb un límit. Convé fixar un nombre màxim d'agents i què es lliura si s'esgota.
- El Registre anomena un model que no és el que executa. Convé deixar-lo pendent fins que l'ompli qui audita.
- El preflight barreja la marca de pendent amb text. O és pendent o és contingut.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Executat pel fil principal, sobre l'arbre del commit `99aab3f7` més els canvis sense commit:

- `npx vitest run` sobre set fitxers del perímetre: 7 fitxers, 95 proves, totes verdes.
- `node tooling/gates/tractor-enxufe.mjs`: roja, 2 infraccions E1 en fitxers de prova.
- `node tooling/gates/tractor-rls.mjs`: roja, una vista sense `security_invoker` a la migració `2610081401`. És fora del perímetre i no s'ha auditat.
- `node tooling/gates/porta-olivera.mjs --informe`: verda, amb avisos de sediment de l'índex.

Executat pels agents: cada annex cita la línia base de vitest que ha passat abans de proposar res.

Comprovat per mi sobre el codi: l'evidència de F01 a F13 que este informe marca com a «comprovat». Dels annexos he revisat la capçalera i que cada fitxer arriba a la seua secció final. No he rellegit línia a línia el codi proposat.

No executat: cap prova nova. L'auditoria no escriu a `src/`, de manera que cap proposta s'ha aplicat ni provat.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Auditoria parcial.** El tall tèrmic ha aturat la consolidació. Només 12 troballes tenen annex.
- **Arbre concurrent.** Durant l'auditoria un altre fil ha modificat `ContenidorGestoria.jsx`, `PanellGestoria.jsx`, `useGestoria.js`, `tauler/ShellGestoria.jsx`, `tauler/nucli/targetesTauler.js` i dos fitxers de la porta d'aprovació dels tractors. La lent d'arquitectura els va llegir abans del canvi. Cap fitxer dels tres carrils purs ni de la Frontissa ha canviat.
- **Reproducció per traça.** Els defectes s'han reproduït llegint el codi i executant proves existents, no amb proves noves.
- **Tres annexos, un defecte.** F01, F02 i F03 es solapen i no es poden aplicar tots tres.
- **Disseny de la Finestreta no inclòs.** La fase de disseny es va retirar en reprendre el workflow. Codi nou demana pla aprovat.
- **Torn obert.** `ESTAT.md` i `LEDGER.md` són a `.agents/`, que la governança reserva a l'executor amb lease, i el hook no deixa executar `tancament.mjs`. El torn `torn_825650fa` no s'ha pogut tancar des d'ací.
- **Annexos sense àncora.** La carpeta d'annexos no està enllaçada a l'índex de l'Escriptori. Ancorar és faena de l'orquestradora.

### Àrees Pendents d'Auditoria

**A. Troballes vives sense annex consolidat.** Sobrevivien a la taula de la tercera execució i el seu codi complet és a la memòria cau, sense integrar les esmenes dels àrbitres.

| Severitat | Fitxer | Troballa |
| --- | --- | --- |
| mitjana | `nucli/receptes.js` | Una fila de concepte amb quantitat, preu i import es pren per l'import subvencionat. Per l'ordre, és la F10 |
| baixa | `projectes/nucli/expedient.js` | `DATES_INCOHERENTS` només mira concessió i sol·licitud |
| baixa | `burocracia/nucli/terminis.js` | `habilCapArrere` diu «exacte» amb festius d'un altre any |
| baixa | `burocracia/nucli/terminis.js` | `dataIso` i `isoDe` escriuen dates fora del rang d'`esDataIso` |
| baixa | `burocracia/nucli/obligacions.js` | La clau de les finestres externes és posicional |
| baixa | `identitat/nucli/titular.js` | `esTitular` accepta un objecte forjat i `validaTitulars` llança `TypeError` |
| baixa | `identitat/nucli/titular.js` | `nouIdOpac` accepta més de 41 bytes i torna un id invàlid |
| baixa | `identitat/nucli/guardes.js` | Les xifres d'altres alfabets no compten com a xifres |
| baixa | `utils/vendes/registreVendes.test.js` | La paritat de la taula de formes es vigila per mostra |
| baixa | `adaptadors/sollutia/creaFrontissa.js` | Tres entrades ixen del contracte `ErrorDades` |
| baixa | `adaptadors/sollutia/creaFrontissa.js` | El filtre de content-type refusa un JSON vàlid amb blanc abans del «;» |
| baixa | `ADR-2026-09-SOLLUTIA-MODEL-B.md` | Llista com a pendent una allowlist que ja s'aplica |
| baixa | `documents/classificaDocument.js` | «ayuda» o «ajuda» soles arriben al llindar de subvenció |
| baixa | `documents/classificaDocument.js` | Una resolució de concessió escanejada es classifica com a notificació |
| baixa | `projectes/nucli/expedient.js` | Fons europeus desconeguts: 5 anys en un lloc i 48 mesos en un altre |
| baixa | `documents/classificaDocument.js` | Les claus d'organisme no són les de `document.js` |
| baixa | `projectes/nucli/expedient.js` | Prova que falta per als ids repetits (mateixa troballa que F04) |
| baixa | `fronteraModelsPurs.test.js` | La frontera no veu `import.meta.glob` ni l'àlies «@/» |
| baixa | `burocracia/nucli/avisos.js` | La costura expedient → avisos no té prova de forma |
| baixa | `identitat/nucli/titular.js` | Prova que falta per a `esTitular` sense tipus |
| baixa | `fronteraModelsPurs.test.js` | Les sondes del perímetre són incompletes |
| baixa | `projectes/nucli/expedient.js` | Prova que falta per a `potImputar` sense id opac (mateixa que F11) |
| informativa | `projectes/nucli/expedient.js` | L'expedient no pot dir «sense fons europeus» |
| informativa | `projectes/nucli/expedient.js` | `TypeError` sense codi si l'expedient no ve de `creaExpedient` |
| informativa | `documents/classificaDocument.test.js` | Cap prova exercita la recepta 'subvencio' pel nom |

**B. Troballes amb veredicte no recollit.** A la tercera execució no tenien dos vots. Els seus àrbitres es van rellançar a la quarta, però el workflow es va aturar abans de tornar la taula. Almenys dues han sobreviscut, perquè els annexos citen germanes fins a la F38.

| Fitxer | Troballa |
| --- | --- |
| `cofre/nucli/cripto.js` i `guardes.js` | Dos `esIdOpac` que no coincidixen: un id d'expedient no pot ser clau del cofre |
| `gestoria/tractors.js` | Endollar la Finestreta a la closca canvia l'empremta del Tauler; cal un tractor nou |
| `disseny/cataleg/` | Pedra Seca §9: no hi ha espècimen de la targeta privada amb l'ull |
| `classificaDocument.js` i `pdfText.js` | Llegir el PDF de la resolució és llegir dades personals sense tractor |
| `universal/PageFrame.jsx` | L'àlies de l'expedient no pot ser títol: l'Índex l'escriu a la URL |
| `cofre/cofre.js` | El bloqueig del cofre en eixir és convenció de cada vista |
| `burocracia/nucli/avisos.js` | `avisosDe` ignora el camp «qui» |
| `projectes/nucli/expedient.js` | El mapatge model → formulari oficial no existix (Xylella) |
| `facturacio/configEmpresa.js` | El nom legal admet un text amb forma de DNI o d'IBAN (Xylella) |
| `identitat/nucli/titular.js` | Un titular de la llar no té font de nom legal, NIF ni adreça (Xylella) |

**C. Síntesi no executada.** El registre de motius de les tombades, el registre de cobertura (què aguanta de cada lent) i el crític de completesa.

**D. Mòdul de mapatge de tràmits.** Proposat per la lent de la Xylella amb codi i prova; sense consolidar.

**E. Disseny complet de la Finestreta.** Model de vista, persistència al cofre, tractor nou, fitxa i espècimen.

Reprendre és barat en la part cara: els huit caçadors i la refutació són a la memòria cau del workflow `wf_067dd79d-66f`. El cost nou seria la consolidació de les troballes de A i B i els tres registres de C.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
