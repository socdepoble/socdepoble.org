---
type: informe
status: esborrany
description: Implementació i revisió creuada de co-publicació, GEDCOM, sessions de la IAIA, Panell de Control i làmines botàniques amb evidència CAS i MCR.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_1d2d8bd3-cc9d-4d25-a1bb-6c45be6fa100:ab067f89-61e9-4969-bba3-d2ffdace46c6
---
# Auditoria Codex de l’Onada R19 · Port, Panell i patrimoni

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1d2d8bd3-cc9d-4d25-a1bb-6c45be6fa100:ab067f89-61e9-4969-bba3-d2ffdace46c6 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T17:23:01.475Z |
| Modificació | 2026-11-11T20:28:38+01:00 |
| Propietari | Codex |
| Aprovació humana | Encàrrec directe R19 del Mestre i pla v1.1.0 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex · GPT-6 segons l’entorn. El pla assigna el carril GPT-6.1 Sol Ultra |
| Tokens consumits | El torn no exposa un comptador verificable |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T17:23:01.475Z · Esborrany creat pel circuit canònic.
- 2026-11-11T18:01:03+00:00 · Incorporats el segell, els tres loops, les proves adversarials i l’estat observat del consens.

- 2026-11-11T20:21:19+01:00 · Revisió 2 del CAS, conciliació amb Claude, correccions del Xat i del destí acreditat, contrast Carbon R19 i 77 actes òptiques per SHA.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

El carril Codex s’ha executat a `/tmp/sdp_codex_r19` i en còpies temporals de contrast. La base d’integració final `ec7ef78b2cafff58d966224f245b9d81d8d8eace` absorbix les preimatges R18, la guarda de document propi, els accessors de context, la cronologia i les correccions disjuntes de Claude observades fins a les 20:16 CET. El HEAD Git viu observat és `c07f78b83`. El CAS fixa 203 operacions i 47 precondicions, amb comparació de bytes i permisos sobre el viu.

### Matriu de Conformitat de Requeriments (MCR)

| Requeriment | Estat | Evidència i abast |
| --- | --- | --- |
| T1 · Port, padró, RLS i reversió | `[FET]` al clon | PostgreSQL 17.5 aplica dues vegades `2611111735`. Provats padró actiu, AAL2, versió, idempotència i bitàcola reversible. El destí del publicador acredita UUID i tipus. La prova adversarial reproduïx i corregix la col·lisió amb un slug UUID. L’adaptador local oferix reserva oficial i rebutja el traspàs del padró remot. |
| T1 · Consum de la Barra Taronja i administració | `[PARCIAL]` | Planta i llavor lligen el padró del port al clon Codex. El Kit Carbon R19 de les 19:54 és íntegre. La composició amb el delta de ruta exacta passa 73/73, amb clic real del router i preimatges del payload segellat. La incorporació d’eixe delta al kit Carbon continua pendent. |
| T2 · GEDCOM 5.5.1 / 7.0 | `[FET]` dins del model | 253 proves focals. REA comprova l’exportació i la reimportació, dates gregorianes qualificades, Sosa i fonts de vincles. Multimèdia, calendaris no gregorians i etiquetes alienes al model queden fora del tall. |
| T2 · Deduplicació assistida i privadesa familiar | `[FET]` al clon | Revalidació en la transacció i confirmació explícita. Les proves i el kit utilitzen dades genealògiques sintètiques. |
| T3 · Títol automàtic al Xat amb IAIA | `[FET]` al clon | La primera pregunta espera el commit del títol a IndexedDB. Dos fils provats en Chromium sobre el build conciliat, amb recàrrega immediata, títol normal i PIN redactat. Zero peticions d’escriptura al node i zero errors de consola. Missatges i esborranys dels fils nous viuen en memòria. La redacció és heurística. |
| T4 · Bar, Nevera, Salut, Lector i Genealogia | `[FET]` al clon | Bar coordina cobrament i torn. Nevera, Salut i Lector usen transaccions d’IndexedDB per a restaurar. Genealogia valida la revisió abans de fusionar o restaurar. L’assaig del Panell passa 4.830 proves i en deixa 2 omeses. |
| T4 · Gestoria i Avisador | `[PARCIAL]` | Gestoria restaura el llibre de factures i usa Web Locks per coordinar les dues bases. Avisador importa horaris sense contactes i requerix activació. L’enviament extern s’ha exercitat amb transport simulat. |
| T4 · Guarda botànica i quarantena | `[FET]` al clon | 117 plantes, 125 entrades de llavors i 19 registres d’arbres. Les 67 recreacions retirades tenen SHA i preimatge CAS. Les 44 fotos documentals d’arbres conserven la seua font i passen mides i empremtes. El build WordPress reutilitzat retira els 67 fitxers antics. |
| T4 · Càrrega diferida i geometria | `[FET]` en el tall observat | REA registra la petició del chunk en obrir el timó. En el build final, +200.000 caràcters exportats sumen 0 B a l’arrencada. Els mesuraments de 21 combinacions de ruta, tema i amplària donen 0 px de desbordament. |
| T4 · Morfologia i fotografia creuada | `[PARCIAL]` | 24 estudis corregits i 261 fitxes contrastades taxonòmicament. Auditades 329 variants òptiques, 3 orfes i les 77 aprovacions Carbon per SHA. El darrer lot deixa 74 candidatures, tres reserves i sis atribucions amb jurisdicció US incorrectament normalitzada. |
| T4 · Consens unànime | `[NO FET]` en este tall | El Tauler registra objeccions botàniques i els vots encara pendents. |
| Lliurament del Kit CAS i auditoria | `[FET]` | 203 operacions, 47 precondicions i 549 fitxers segellats. Assaig en còpia amb aplicació, reversió, repetició i fallada injectada després de retirar un WebP. Simulació sobre el viu registrada al segell. |

### Mètode MIT, Gauntlet i Google EGM

1. **Acumulació multidireccional.** El pla i el dossier es contrasten amb la font viva, els dos adaptadors, el catàleg SQL, els fitxers de Carbon i Claude, les col·leccions del Node 0 i l’execució a Chromium.
2. **Cinc nuclis.** El padró acredita qui publica. El port manté la frontera entre autoritat i crèdit. IndexedDB imposa la versió de cada mutació privada. GEDCOM determina els camps que viatgen i la projecció els limita. La identitat òptica i els bytes determinen si una variant es pot carregar i presentar.
3. **Filtre Feynman.** Un traspàs modifica el publicador efectiu. Una restauració només és vàlida si l’estat llegit encara és el vigent. Una llicència autoritza l’ús d’una imatge i la revisió botànica n’acredita el contingut visible.
4. **Test socràtic.** S’han intentat escriptures amb versió obsoleta, intercanvis de node a mitjan lectura, reintents després d’un canvi de recurs, persistència d’un PIN, aprovació d’una cita inventada i publicació d’un altre cultivar amb una llicència vàlida.
5. **Correcció i consolidació.** Els contraexemples han canviat el port, la transacció del Panell, el control del títol, el test botànic, el sanejament del paquet reutilitzat i la documentació pública del contracte. Queden enregistrats els casos que depenen de revisió externa.

L’Elefant ha examinat l’arrencada, els límits de producció i la composició entre carrils. Les perspectives dels Peixets han contrastat arquitectura, contracte, concurrència, privadesa, mantenibilitat, proves, fotografia i integració. REA ha verificat el comportament en Chromium i dos mòduls del WordPress compilat. El punt de represa del context es va conservar a `/tmp/sdp-r19-evidence/CONTINUITAT.md`.

### Dimensions D01–D15

L’escala situa en 5 una capacitat parcial observada, en 8 una capacitat local amb proves adversarials i en 10 l’acceptació completa dins de la dimensió.

| Codi | Dimensió | Nota | Evidència i límit |
| --- | --- | --- | --- |
| D01 | Enxufabilitat i Port Neutral (Model B) | 8/10 | E1–E4, contracte simètric i 54 capacitats declarades amb 156 mètodes i 219 casos. Integració remota pendent. |
| D02 | Seguretat, RLS, Auth AAL2 i Sanejament | 8/10 | Padró actiu, destí acreditat per UUID i tipus, AAL2, permisos denegats, CAS PostgreSQL local i zero troballes de literals de credencial en 4.856 fonts. |
| D03 | Disseny Pedra Seca i Coherència Geomètrica | 8/10 | Design Guard i Pedra Seca passats. El contrast global reprodueix fallades de CSS prèvies a R19. |
| D04 | Accessibilitat WCAG 2.2 AAA i Ergonomia Rural | 7/10 | Control per rol, focus i temes contrastats en Chromium. La prova cobreix les rutes mesurades. |
| D05 | Rendiment i Pressupost del Nucli Verge | 8/10 | 217.726 B gzip-9 web i 1.662.932 B de mòduls inicials a WordPress. El chunk botànic queda fora de l’arrencada. |
| D06 | Local-First, Resiliència Offline i Privadesa | 8/10 | Transaccions natives, restauració, deduplicació i títol local. L’enviament d’Avisador usa transport simulat. |
| D07 | Paritat Pentalingüe i Qualitat Editorial | 8/10 | Avisos del Xat i de l’Avisador en cinc llengües. L’inventari públic del port concorda amb el codi. |
| D08 | Custòdia Patrimonial i Ètica d’Autoria | 6/10 | Text literal i crèdits preservats. Quarantena de recreacions i diverses candidatures òptiques encara pendents. |
| D09 | SEO Semàntic, Social Cards i Federació POSSE | 6/10 | 261 rutes del router verificades. El tall R19 no exercita desplegament d’ActivityPub. |
| D10 | Dades Obertes i Portabilitat Municipal | 8/10 | GEDCOM i còpies d’eines amb reimportació i validació. Abast del model documentat al kit. |
| D11 | Qualitat de Proves i Verificació Mecànica | 6/10 | Bateries afectades i reexecucions acotades. Les suites globals conserven fallades heretades i temps d’espera atribuïts, amb resultats desglossats al kit. |
| D12 | Compatibilitat Multi-Dispositiu i WebKit Rural | 7/10 | Chromium a 375, 768 i 1440 px en clar i fosc en les rutes principals. Safari i aplicacions natives queden fora del tall. |
| D13 | Governança Documental i Higiene d’Escriptori | 7/10 | Rebut, Pla vinculat i Olivera. Frontissa té nou empremtes pendents i el tancament global registra incidències documentals. |
| D14 | Gratuïtat Radical i Claredat del Sistema de Plugins | 8/10 | Entrades locals del Panell, Genealogia oberta en beta i càrrega diferida. |
| D15 | Sostenibilitat Estratègica i Orquestració Colmena | 5/10 | Correccions composades amb Carbon i Claude. La revisió botànica i les signatures resten obertes. |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **CAS.** Revisió 2 amb `SHA256SUMS` `269ccd509c30cfc979e08064fea6434d287bb7f46d325e4a7f5857fe7f858b51`, manifest `18835a964b9b751588639a47f0d2f1785ba688b30d25bb48a31a1544aa635010` i pegat `3e3249aeffb3d5f0928222725951560df390cdd6efac863b4af7ace45b5105b1`. El primer inventari `a39af94e…` queda substituït. La reproducció verifica bytes, modes, repetició, reversió, deriva de precondicions i recuperació d’errors capturats. `../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/README_INTEGRACIO.md`
- **Portes i proves.** Lint del clon amb la correcció de seguretat i dels vint fitxers conciliats, Enxufe E1–E4, RLS estàtica sobre 97 fitxers, Design Guard, Pedra Seca i persistència passen. PostgreSQL prova ACL, aplicació doble, revocació de visibilitat seguida de reintent, pèrdua d’AAL2 i aïllament de poble. Les 61 proves del catàleg amb 91 migracions consten a l’evidència. La migració del Mur afegida a les 20:05 és posterior a eixe assaig i queda fora del payload Codex. PGlite exercita connexions serials. La concurrència PostgreSQL amb dues connexions natives queda sense comprovació dinàmica en este entorn.
- **Bateries focals.** Port 1.416, Genealogia 253 i Panell 4.830 amb dues omissions. La passada conciliada del contracte, perfils, textos, Xat, contextos i rigor passa 382/382. La composició de les correccions disjuntes de Claude passa 307/311 en el primer intent, amb quatre temps d’espera. Les reexecucions, els límits originals i les durades estan registrats per cas. Els recomptes focals se solapen.
- **Suite global i atribució.** La primera passada va donar 36.594 proves verdes, 512 fallades i 117 omissions. Les correccions de l’inventari, el corpus i l’import cru de context tenen regressió específica. La passada posterior va donar 36.622 verdes, 486 fallades i 117 omissions. 485 fallades coincidixen exactament amb la passada anterior i la diferència és el temps d’espera de la comprovació estricta de tot `src/`. El predicat original, amb les tres sondes, acaba amb 3.777 fonts i zero diagnòstics després de 579.478 ms sota càrrega. El `listen EPERM` de Telemetria es reprodueix a la preimatge. La passada conciliada completa registra 36.593 passades, 524 fallades i 117 omissions. Les 39 fallades noves passen en reexecució amb els límits originals. La passada addicional del clon T1 acaba interrompuda ordenadament a les 20:17 amb codi 130 i sense resultat complet. Els registres figuren a `evidencia/execucio/RESULTATS.md`.
- **Artefactes i runtime.** Web 217.726 B gzip-9 d’entrada. WordPress 1.662.932 B de mòduls inicials i 3.427 B de carregador. L’estrès porta el chunk botànic de 12.836 a 212.870 B amb 0 B addicionals a l’arrencada. El build reutilitzat retira les 67 recreacions i preserva una substitució emesa a la mateixa ruta. La prova Chromium del build final recupera els dos fils immediatament, sense missatges duradors. Els identificadors REA del Panell, Genealogia, timó i WordPress consten als JSON del kit. Les 261 rutes de catàleg i les 21 mesures de geometria conserven el tall d’execució indicat.
- **Contrast de Claude.** L’informe de les 20:16 emet el vot integrar_amb_condicions sobre el kit anterior. La revisió 2 concilia les preimatges, aporta la prova PostgreSQL executada i explicita que la verificació remota dels 156 mètodes continua pendent. Les preimatges conciliades preserven Genealogia oberta, el paquet de l’amfitrió i el missatge de document propi en cinc llengües. Les dues darreres divergències editorials van fer fallar el CAS abans de conciliar-les. El COMMIT R18 i el desplegament continuen en el carril de MarIA i Claude. [Informe de Claude](../90_arxiu_historic/261111_1741_auditoria_claude.md)
- **Contrast de Carbon.** El Kit R19 de les 19:54 conté 99 fitxers íntegres. Carbon ha emés un vot formal d’acord sobre la composició i la porta botànica. El contrast independent de les rutes exactes conserva el delta pendent. L’inventari té SHA `772ab2eefe452bdafb66d8ec4d1086372ffecd47806f0fc1ec616e613cb54f42`. El delta opcional `3bb71b8d18d485cf7f8ca066b2ebdcc9b81a159a95088c1030b0a3c12145e737` passa 73/73 i lint sobre les preimatges exactes del seu segell. Les 77 aprovacions d’imatge remeten a actes Codex pel mateix SHA. Tres conserven objecció i sis normalitzen malament CC BY 3.0 US. Els camps `observacioCodex` del lot nou copien la descripció esperada de Carbon i ometen reserves prèvies. `evidencia/creuada/carbon-77/` conserva els 77 casos i les declaracions originals.
- **Contrast del Node 0.** El productor v2.3.1 passa 10 proves sintètiques. L’eixida v2.3 de les 19:11 té SHA `12519718f2534ba283718a52e21ef44b8089aa8b4b378d2c7ddbaa92692289cb`, 30 registres i zero aprovacions per a injecció. Deu són candidatures amb cita i vint exigixen contrast. Diversos caràcters continuen equivocats. La cura local de Carbon té set contradiccions d’òrgan documentades per SHA. Les 329 variants originals, els duplicats i els 3 orfes consten a les actes.
- **Taxonomia.** 117 plantes, 125 entrades del Banc i 19 arbres, amb 174 literals científics únics. El contrast CoL XR i GBIF registra 191 coincidències exactes acceptades, 18 sinònims exactes i 52 fitxes anotades. S’han preservat els literals documentals i les fonts dels casos ambigus a `evidencia/patrimoni/taxonomia/`.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

El codi i la migració es lliuren per CAS. L’aplicació i la reversió s’han provat en una còpia. Les 67 recreacions queden retirades del paquet i recuperables des de les preimatges. Les fotos candidates es guarden fora del paquet públic. L’exportació per defecte de Genealogia omet dades identificatives de persones vives i notes col·laterals quan hi ha persones protegides. El Xat conserva UUID i títol local i manté la conversa i els esborranys dels fils nous en memòria. La inferència opcional pot rebre la pregunta si el node i el nivell la tenen activada.

El consens a quatre bandes continua pendent. Claude declara 24 estudis morfològics nous que encara requerixen un lliurament amb identificadors i text per fer el contrast. L’oblit individual dels títols de la IAIA continua pendent. Les reserves per taxó, òrgan, accés varietal i llicència del Tauler es mantenen obertes fins a la revisió dels carrils. La correcció de navegació exacta del kit Carbon continua com a delta verificat pendent d’incorporació. La guarda admet la llicència original CC BY 3.0 US amb la seua URL exacta després de la prova específica.

El tancament global de la Wiki va trobar documents de l’Escriptori sense àncora i relleus pendents. El rebut de l’auditoria i el seu contracte es comproven individualment. El Tauler conserva les objeccions i el resultat de cada ronda. `../_investigacio_ia_de_poble/261111_1720_mesa_consens_migdiada_r19/TAULER_CONVERSA_I_CONSENS_R19.md`

El segell final passa les 549 sumes i la simulació CAS sobre el viu en la reverificació de les 20:27. El document canònic i la signatura del LEDGER passen la comprovació. El tancament global registra 148 incidències, amb 112 documents sense àncora, 33 orfes operatius, dos vincles antics i la detecció de codi alié a l’abast documental del torn. Cap incidència referencia esta auditoria. L’inventari de processos de les 20:27 no troba runners, servidors ni perfils Chromium temporals del carril Codex. La parada acordada és a les 20:30 CET.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni|261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[../90_arxiu_historic/261111_1720_prompt_codex_onada_r19_commit_r18_copublicacio_i_patrimoni|261111_1720_prompt_codex_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[03_llibre_mestre_tasques_i_idees]]
