---
type: informe
status: esborrany
description: 'Auditoria de la sol·licitud d''ajuda IVC 2026 del FICIV: autobarem punt a punt, memòria, fitxa pressupostària, Annex I, calendari i lliurables per a Carmen Chaves.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c61b8383-89c7-4543-b80a-5e4db7c3df4c:150415db-889f-4182-9e9d-8b6181af7d57
---
# Auditoria Claude FICIV

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c61b8383-89c7-4543-b80a-5e4db7c3df4c:150415db-889f-4182-9e9d-8b6181af7d57 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T11:44:25.774Z |
| Modificació | 2026-10-11T12:10:00.000Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (Claude Code, fil únic, sense subagents) |
| Tokens consumits | ≈ 0,3 M al fil principal (la lectura dels huit textos plans en són ≈ 0,15 M) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-11T11:23:00.000Z: arrencada. El hook PreToolUse veta pdftotext, python, el Read de PDF (sense pdftoppm) i qualsevol escriptura fora del repositori. S'escriu un extractor PDFKit a `02_investigacio_ia/ficiv_extractor/extreu_pdf.swift` per si el Mestre l'ha de llançar.
2026-10-11T11:28:00.000Z: MarIA extrau els huit PDFs a `04_escriptori/textos_subvencio/`. Es llig tot: autobarem, fitxa pressupostària, nota informativa, full de mèrits, «memòria» (que és el catàleg), Annex I i convocatòria sencera, més els quatre documents vius de l'Escriptori.
2026-10-11T11:35:00.000Z: torn `torn_c61b8383` obert (actor claude, abast documents).
2026-10-11T11:44:25.774Z: esborrany creat; contingut i verificació pendents.
2026-10-11T11:55:00.000Z: lliurables escrits a `02_investigacio_ia/261011_1400_ficiv_claude/` (pressupost tabulat, escenaris, informe per a Carmen i esborrany de Memòria).
2026-10-11T12:10:00.000Z: informe complet. Hores UTC aproximades: cap agent local pot executar `date`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### El que has de saber abans que res

1. **El termini acaba, probablement, el dijous 15 d'octubre de 2026.** Quinze dies hàbils des del 23/09 (publicació al DOGV el 22/09), descomptant caps de setmana i els festius del 9 i el 12 d'octubre. Hui és diumenge 11. Queden quatre dies i la sol·licitud té dos forats grossos (punts 2 i 3). Cal confirmar la data al tràmit de la seu electrònica de l'IVC.
2. **No hi ha Memòria d'actuació.** El fitxer `Memoria actuación 2026.pdf` és el catàleg: mateixa mida en bytes (42.646.111) i mateix text extret (43.429 caràcters) que `catálogo.pdf`. La convocatòria (resolc 6.i) exigix una memòria detallada d'activitats; sense ella, la sol·licitud ix a la llista d'incompletes i cal esmenar en deu dies hàbils. He deixat un esborrany complet amb marques [COMPLETAR].
3. **La fitxa pressupostària firmada té un error de cel·les que la fa semblar deficitària en 11.131,28 €.** Els 7.500 € de patrocinis i els 3.631,28 € de taquilla estan escrits fora de les files que suma la fórmula: el subtotal privat marca 0,00 i el total d'ingressos 25.041,49. Amb les files al seu lloc, ingressos i despeses són exactament 36.172,77 €. Cal refer l'Excel, exportar i tornar a firmar; s'entreguen el `.xls` i el PDF.
4. **La puntuació real és d'uns 67 punts segurs, 77 si Novetlè es documenta i 82 amb la sostenibilitat ben acreditada.** Carmen suma 84,5, però inclou 2,5 punts que no existixen (el criteri 6 és tot o res) i tres criteris amb interrogant. El llindar és 50: entra de sobres. Com que la fórmula de repartiment és punts × import sol·licitat × coeficient comú, cada punt i cada euro pugen l'ajuda en la mateixa proporció.
5. **Es pot demanar més.** El topall individual és el 50 % del gasto executat en 2025 (36.575,41 €), és a dir 18.287,70 €, i Carmen demana 17.000 €. Pujar al màxim augmenta l'ajuda un 7,6 % sense cost, a canvi d'afegir al pressupost el cost de l'auditor, que ja és obligatori perquè el pressupost supera els 20.000 €.

### Autobarem punt a punt (criteri · Carmen · Claude · risc · prova clau)

| # | Criteri (punts) | Carmen | Claude | Risc | Prova que decidix |
| --- | --- | --- | --- | --- | --- |
| 1 | Llistat ICAA o xarxa amb requisits (5) | 5 | 5 | Baix | Pàgina del llistat ICAA 2026 amb FICIV i certificat ECFA. Llevar «en calidad de suplentes»: no aporta res. |
| 2 | Activitats per a nous públics (5) | 5 | 5 | Baix | Programa 2026 amb tallers, gimcanes, fitxes didàctiques, jurat infantil, Animateen. |
| 3 | Obres en valencià ≥ 20 % (5) | 5 | 5 | Mitjà | Diu 15 obres, en llista 14 i escriu 23,21 % (seria 13/56). Taula de les 56 obres de 2025 amb columna de versió. |
| 4 | Secció competitiva internacional (5) | 5 | 5 | Baix | Bases publicades i palmarés. |
| 5 | Premis en metàl·lic + pagaments per selecció (2,5 + 2,5) | 5 | 5 | Baix | Bases amb dotació, justificant del premi, factures de screening fee dins del PDF. |
| 6 | Convidats nacionals i internacionals (5) | «2,5?» | 0 (5 si es prova) | Alt | No hi ha mitja puntuació. Única via: Raúl García resident a Singapur, si va vindre en persona. Si no, 0. |
| 7 | Jurat internacional edició anterior (5) | 0 | 0 | — | Per a 2027: un jurat estranger són 5 punts i el viatge és subvencionable. |
| 8 | Paritat (2+1+1+1) | 5 | 5 amb l'edició 2026 | Mitjà | Error: Claude Barras és home; en 2025 només 1 de 5 llargs té directora (20 %). Amb 2026: llargs 2/4, curts 6/11 (11 dones de 23 persones), jurat 2/4, equip 3/5, ponents 8/15. No escriure «81 %»: més del 60 % ja no és paritat (LO 2/2024). |
| 9 | Sostenibilitat, 2 de 8 requisits (5) | 5 | 5 si es documenta | Mitjà | Sòlids: 6é (MRW ISO 14001, Correos Express) i 8é (100 arbres al Túria). El 3r (Cines Lys com a «agent») és fluix. URL trencada «httpscineslscomecols». |
| 10 | Difusió en valencià (5) | 5 | 5 | Mitjà | El catàleg adjuntat és en castellà. Captura datada de la web en valencià, cartell i programa de mà. |
| 11 | Pressupost 2025 entre 25.000 i 50.000 (16 de 20) | 16 | 16 | Baix | Cal «gasto real realizado»: fitxa justificativa 2025, informe d'auditor o compte aprovat; una previsió no val. |
| 12 | Edicions anteriors (11 de 15) | 11 | 11 | Baix | El cartell de la XII només prova l'actual. Taula de les 11 edicions amb cartell o premsa. |
| 13 | Difusió presencial en més d'un municipi (5) | «5?» | 5 si Novetlè es va fer | Alt | FICIV en Ruta anul·lat el 2/10 per alerta roja i «traslladat al 6 i 7». Certificat de l'Ajuntament de Novetlè o del CEIP Jaime I. |
| 14 | Incidència social, municipi més menut (5) | «5?» | 5 amb Novetlè, 1 sense | Alt | Mateix certificat. Novetlè té menys de 1.000 habitants (xifra INE a confirmar); València sola dóna 1 punt. |
| 15 | Projeccions accessibles (5) | 5 | 5 | Baix | Confirmació de la distribuïdora o fitxa del DCP amb pista SPS de «Nina y el secreto del erizo». |

Suma: segurs 67 (1, 2, 3, 4, 5, 8, 10, 11, 12, 15) · amb Novetlè 77 (sense Novetlè, 68) · amb sostenibilitat 82 · amb convidat internacional provat 87.

### Fitxa pressupostària

- Capítols reconstruïts (la fitxa extreta els desordena): CAP 1 lloguer 3.538,00; CAP 2 gestió de pel·lícules 4.911,00; CAP 3 comunicació 2.883,30; CAP 4 convidats 2.030,79; CAP 5 premis 850,00; CAP 6 personal 13.216,61; CAP 7 altres professionals 4.215,50; CAP 8 vídeo i disseny 800,00; CAP 9 varis 87,57; CAP 10 buit; CAP 11 digitalització 2.240,00; CAP 12 quota d'associacions 300,00; CAP 13 assessors 1.100,00. Suma exacta 36.172,77 €.
- Ingressos: IVC 17.000 (47,0 %), Ajuntament de València 8.041,49 (22,2 %), patrocinis dels col·legis d'Òptics, Psicòlegs i Podòlegs 7.500 (20,7 %), vendes i recursos propis 3.631,28 (10,0 %). Total 36.172,77: equilibrat i sense marge.
- **La trampa de l'equilibri.** Si a la justificació es justifica menys gasto, els ingressos declarats superen el gasto i l'IVC minora euro a euro (art. 19.3 LGS; exemple literal de la nota informativa). Protecció: pressupostar tots els costos reals (assegurances, drets, impremta, web, subtitulat, auditor) i deixar un marge de despesa cobert amb recursos propis, que no computen com a ingrés (resolc 14.2.a.2.a). «Ventas y recursos propios» mescla ingrés (taquilla) amb autofinançament: separar-los.
- Topalls: indirectes ≤ 7 % dels directes (assessors + auditor + quota ECFA = 2.700 € supera els ≈ 2.434 €; passar la quota a directe o ajustar); treball de socis ≤ 40 % dels directes (CAP 6 sol és el 37,7 %; amb CAP 7 seria el 49,7 %); subcontractació ≤ 50 % i mai més del 50 % a una mateixa empresa (CAP 2 + 6 + 7 sumen el 61,8 % si els factura un sol proveïdor); convidats només jurats, ponents i equips a més de 100 km; tot pagat per transferència abans del 30/11/2026; informe d'auditor ROAC obligatori.
- Escenaris (fitxer `escenaris_financament.csv`): A actual corregit (17.000, X = 1.394.000); B màxim legal (18.287,70 amb CAP 13 a 2.400 €, X = 1.499.591, +7,6 %); C màxim amb marge (gasto 40.000, dèficit 2.539,53 cobert per l'associació, protegix l'ajuda fins a un 6 % de desviació). Taules de sensibilitat gasto justificat → IVC cobrable per a B i C.

### Memòria d'actuació

El catàleg no demostra la definició de festival del resolc 1.4.I (unitat programàtica, bases prèvies i públiques, secció competitiva amb jurat, tres dies intensius, pressupost ≥ 5.000). La XII edició va del 23/09 al 08/10 (exposicions fins al 13/10) amb activitat quasi diària i set jornades de projecció pública: cal presentar-la com una sola unitat amb les mateixes dates a l'Annex I, la memòria i la fitxa. L'esborrany seguix l'ordre dels 15 criteris, inclou la taula dia a dia i la secció «Cumplimiento de la definición de festival». Errors del catàleg a corregir abans d'adjuntar-lo: inauguració «23 de octubre» (és setembre), «del 24 al 8 de octubre», gimcana «03 de septiembre», sinopsi de Barracuda sota «Olivia», crèdits de «Lights» sota «Ostrich», i erratas (Belñla, PRESENTCION, EDUCTIVA, OTUBRE).

### Annex I

- El PDF de la carpeta mescla pàgines de l'Annex I (codi IA-14580-01-E, apartats A a H) amb pàgines de l'Annex III de guió i desenvolupament de projectes: el text extret les repetix tres vegades. Carmen ha de comprovar que el formulari que firma només té les pàgines IA-14580; si no, tornar a baixar-lo del tràmit.
- Camp a camp a `INFORME_PARA_CARMEN.txt` §6: modalitat Festival; dates 23/09/2026 a 13/10/2026 (o 08/10, però iguals a tot arreu); pressupost igual al de la fitxa; 11 edicions; executat 2025 36.575,41; E.1 declarar l'Ajuntament de València (8.041,49 €, 22,2 %); E.2 minimis dels tres últims anys; F exempta de discapacitat i no obligada a pla d'igualtat (< 50 treballadors); G/H no oposar-se i sí autoritzar AEAT, TGSS i ATV; firma del representant amb certificat.

### Documentació administrativa de l'associació (resolc 6.b, 6.c, 6.e)

Acta fundacional, estatuts inscrits, inscripció al Registre Autonòmic d'Associacions, junta directiva inscrita, acreditació de la representació i DNI, alta al Cens (036) amb l'activitat (requisit per a ser beneficiari, resolc 3.2.a), certificat de secretaria posterior al 22/09/2026 amb el nombre de socis, justificant de quotes anterior a la publicació (o certificat que els estatuts no en fixen), i els tres certificats tributaris només si no s'autoritza la consulta. Cap document per enllaç (resolc 5.4).

### Lliurables

- `02_investigacio_ia/261011_1400_ficiv_claude/INFORME_PARA_CARMEN.txt`: informe accessible en castellà (la llengua de l'expedient) amb l'urgent, els 15 criteris, les correccions del full de mèrits, la fitxa, l'Annex I, la documentació, el PDF únic de mèrits i el que convé preparar per a 2027.
- `02_investigacio_ia/261011_1400_ficiv_claude/ESBORRANY_MEMORIA_ACTUACION.txt`: memòria d'actuació completa amb marques [COMPLETAR].
- `02_investigacio_ia/261011_1400_ficiv_claude/pressupost_ficiv_2026.csv`: la fitxa en forma tabular (separador «;», decimals amb coma) amb tipus de cost i la norma que afecta cada capítol.
- `02_investigacio_ia/261011_1400_ficiv_claude/escenaris_financament.csv`: tres escenaris, dues taules de sensibilitat i la taula de topalls.
- `02_investigacio_ia/ficiv_extractor/extreu_pdf.swift`: extractor PDFKit sense dependències, no executat perquè MarIA va fer l'extracció. Decisió de MarIA: conservar-lo com a eina del Mas o arxivar-lo.

### Ordres per a MarIA, en este ordre

1. Passar a Carmen l'`INFORME_PARA_CARMEN.txt` i l'esborrany de Memòria hui mateix: el termini és dijous.
2. **Dades personals al repositori.** `04_escriptori/textos_subvencio/` conté el NIF de l'associació i noms de persones; la carpeta és al primer nivell de l'Escriptori i no és cap document ancorable. Si el remot és públic, no s'ha de versionar ni esta carpeta ni `261011_1400_ficiv_claude/`: moure-les a `01_produccio/` (zona humana) o excloure-les de git és decisió del Mestre (requires_human_decision: true).
3. Arxivar `textos_subvencio/` amb la porta Olivera quan Carmen haja rebut el material, i decidir el destí de `ficiv_extractor/`.
4. Validar este document amb `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261011_1400_auditoria_claude_ficiv.md` després de qualsevol retoc, actualitzar ESTAT i LEDGER (text proposat davall) i tancar els torns `torn_c61b8383` (meu) i `torn_39e9e0e0` (pla i prompt) amb `tancament.mjs --check`.

### Text proposat per a l'ESTAT

> ESTAT_ACTUAL · 2026-10-11 · Claude · Auditoria FICIV entregada. La «memòria» presentada és el catàleg, la fitxa pressupostària firmada té un error de cel·les (ingressos reals 36.172,77 €, no 25.041,49) i la puntuació realista és 67 segurs, 77 amb Novetlè, 82 amb sostenibilitat. Es pot demanar 18.287,70 € en lloc de 17.000. Termini probable: dijous 15/10. Lliurables per a Carmen a 02_investigacio_ia/261011_1400_ficiv_claude/. Següent acció: MarIA entrega el material a Carmen i el Mestre decidix on viuen els textos amb dades personals.

### Retroalimentació de la plantilla prompt_local

- El bloc fix «Context Tècnic i Arquitectònic» (Sollutia, Frontissa, Fedivers) no té res a vore amb un encàrrec no tècnic com este i consumix context. Convindria una ruta `prompt.local` amb el bloc condicional, o una ruta germana per a encàrrecs documentals externs.
- El prompt apuntava a una carpeta de PDFs fora del repositori que cap agent local pot llegir amb el hook vigent (sense pdftoppm el Read de PDF no funciona; pdftotext i python estan vetats). La plantilla hauria de demanar a l'orquestradora que deixe les fonts en text pla dins de l'Escriptori abans de convocar, com ha acabat fent MarIA.
- La lectura obligatòria de «qualsevol altre document present a 04_escriptori/» obliga a llegir ordres de nit, teoria de disseny i una acta sense cap relació amb l'encàrrec. Caldria limitar-la als documents que el prompt cita o que porten la mateixa hora termodinàmica.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Suma dels 13 capítols de la fitxa | 36.172,77 € exactes, igual que el total declarat |
| Suma dels quatre ingressos (17.000 + 8.041,49 + 7.500 + 3.631,28) | 36.172,77 €: el dèficit de -11.131,28 € de la fitxa firmada és un error de cel·les |
| Topall d'ajuda (50 % de 36.575,41) | 18.287,70 €; 17.000 sol·licitats estan dins; 22.000 no s'hi arriba |
| Topall d'indirectes (7 % dels directes) | ≈ 2.434 € amb CAP 12 i 13 indirectes; afegir l'auditor el supera |
| `Memoria actuación 2026.pdf` i `catálogo.pdf` | mateixa mida (42.646.111 B) i mateixa longitud de text extret (43.429 caràcters): duplicats |
| Recomptes de paritat 2026 | fets nom a nom sobre el catàleg i el full de mèrits; sexe inferit pel nom en tres casos (J. Jefferies, Chen-Yun Hu, Anh Tú Nguyen), exclosos del recompte |
| Percentatge d'obres en valencià 2025 | 14 títols llistats sobre 56 = 25 %; les xifres del full (15 i 23,21 %) no quadren entre si |
| Termini | 15 dies hàbils des del 23/09/2026 → 15/10/2026 si el 9 i el 12 d'octubre són inhàbils; sense festius seria el 13/10 |
| Convocatòria | llegida sencera (resolcs 1 a 16); la cua del text extret repetix tres vegades els annexos |
| `node tooling/wiki/document.mjs create` | esborrany creat i ancorat a l'índex; rebut 150415db |
| `node tooling/gates/porta-olivera.mjs --informe` | 8 documents solts, tots declarats vius (inclòs este); cap consumit de jornades anteriors; safata buida; avisos CONV-07 de sediment de l'índex (809 línies, 12 seccions buides), anteriors a esta sessió |
| `node tooling/wiki/document.mjs check --file …auditoria_claude_ficiv.md` | vegeu el resultat literal al xat, executat després del darrer retoc |

No verificat per falta d'accés web (el hook veta WebFetch): el llistat ICAA 2026, la població oficial de Novetlè, la celebració de FICIV en Ruta els dies 6 o 7 d'octubre, les certificacions de MRW i Correos Express, i el calendari oficial de dies inhàbils de la Generalitat.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Hook PreToolUse** (`tooling/gates/hooks-local.mjs`): Bash només admet lectures literals; Write i Edit vetats fora del repositori, a `tooling/`, `.agents/`, `.claude/` i `01_produccio/`; el Read de PDF demana `pdftoppm`, que no és instal·lat i no es pot instal·lar sense Homebrew ni permisos. Per això l'extractor Swift es va escriure però no es va executar, i els lliurables per a Carmen són `.txt` i `.csv` dins del laboratori. Les hores d'este document són aproximades.
- **Llengua.** Els lliurables per a Carmen són en castellà perquè el seu expedient (memòria, full de mèrits, fitxa) és en castellà i l'IVC l'admet; este informe és en valencià.
- **Fonts.** Tot ix dels huit textos plans que va extraure MarIA; no he vist els PDFs originals ni les imatges incrustades al full de mèrits (21 MB), així que no puc dir quines proves ja hi són i quines falten: la columna «Prova que decidix» és el que la comissió voldrà vore.
- **Dades no verificables.** Les meues estimacions de punts suposen que els fets declarats són certs i documentables; no he pogut comprovar-los. El recompte de paritat inferix el sexe pel nom.
- **PostToolUse `segell-auto`** ha repetit «segell divergent» després de cada eina: ve d'abans d'esta sessió (ja ho anotava l'auditoria de l'Onada 12) i no s'ha tocat.
- **ESTAT, LEDGER, índex de l'Escriptori i tancament** són de MarIA: no puc escriure a `.agents/`.
- **Dades personals.** Esta auditoria cita el NIF de l'associació i noms que ja constaven als documents de Carmen; no afig cap dada nova. La decisió sobre on viuen els textos extrets és del Mestre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261011_1314_pla_implementacio_ficiv]]
- [[261011_1314_prompt_claude_ficiv]]
