---
type: informe
status: canonic
description: Còdex històric de saviesa rural, casos d'ús autòctons, lliçons d'incidents per a les 38 skills i decisions arquitectòniques irreversibles destil·lats dels 573 fitxers de 90_arxiu_historic
tags:
  - govern
  - memoria
  - arquitectura
visibility: private
reflex: sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:c0208939-812f-499e-8dfd-3ae76d0e68be
---

# Còdex de Saviesa Rural, Casos d'Ús Autòctons, Lliçons per a les Skills i Decisions Irreversibles (Setembre – Octubre 2026)

> **Propòsit d'aquest document:** Preservar per sempre l'ànima etnogràfica, la memòria d'enginyeria i els antídots operatius destil·lats dels **573 fitxers** de `_wiki_de_poble/90_arxiu_historic/` i de `_wiki_de_poble/04_escriptori/01_produccio/` abans d'evacuar el sediment històric cap a `../_arxiu_wiki_de_poble/historics_2026/`. Cap agent futur ni cap iteració del Mas ha d'oblidar per què Sóc de Poble està construït així.

---

## 1. Tresors Etnogràfics i de Producte Rural («El Comú» en Acció)

Al llarg de les sessions de setembre i octubre —i bevent directament dels arxius històrics del Mestre Javi Llinares des del 2006 fins al Manifest de Poble del 2022—, el Consell ha descobert que **tota la vida organitzativa d'un poble es pot governar amb un únic motor d'elements col·lectius («El Comú»)** si es respecten les regles reals de la plaça, del bar, de l'assaig i del bancal.

### 1.1. La Banda de Música («El Rentonar» · La Torre de les Maçanes, 2006–2007)
Font primària: `_wiki_de_poble/04_escriptori/01_produccio/Banda La Torre - Gestió/`.

1. **El Full d'Eixida en un sol A4 (`Full_dEixides_-_Plantilla.xls` i `Planning Contrates 2007.xls`):**
   - Una actuació musical (passacarrer, processó, entrada mora o cristiana a Xixona, Alcoi o Relleu) exigeix resoldre d'un sol colp d'ull tres preguntes:
     * **Balanç per corda:** Quants músics calen per corda (`fusta`, `metall`, `percussio`) enfront dels confirmats reals (p. ex., `Necessaris: 28` vs `Confirmats: 26`, amb alerta immediata on falten un bombardí o dos clarinets).
     * **Logística de cotxes particulars:** Qui posa cotxe (`places_cotxe: 4`), qui va en quin vehicle i quants quilòmetres d'anada i tornada es bonifiquen per conductor ($\text{km} \times \text{tarifa/km}$).
     * **Distinció financera sagrada:** Els **músics de plantilla i educands** van per compromís associatiu (`0 €` de caixet individual, perquè el cobrament de l'actuació nodreix la caixa comuna de la Societat Musical), mentre que els **músics de reforç contractats** generen un cost directe de caixet (`50 €` – `90 €` per actuació) que es descompta automàticament del marge net de la contrata.
2. **La Loteria de Nadal i Reis en Dipòsit als Bars (`Full_de_control_loteria_nadal.ots`):**
   - Les associacions de poble es financen repartint talonaris o dècims en dipòsit als bars i comerços locals (Bar Amber, Bar Adrià, Forn, Cooperativa) i entre els socis:
     * **Fórmula canònica:** Dècim de cost nominal $20\text{ €}$ venut a $23\text{ €}$, generant **$3\text{ €}$ de donatiu net ($15\%$) per dècim** per a l'entitat.
     * **Cicle d'estat comptable:** `en_diposit` $\rightarrow$ `venut` (entrega d'efectiu liquidat) o `retornat` (devolució física de dècims no venuts abans del sorteig per no assumir-ne el cost).
3. **L'Escola d'Educands i la Pedagogia No Punitiva (`model_ficha_alumno_banda_1020.jpg` i `Model Fitxa dAlumne 2007.xls`):**
   - Seguiment mensual (octubre–juny) amb microgràfiques d'evolució (*sparklines*) en quatre pilars: **Assimilació de continguts**, **Actitud a l'aula**, **Estudi a casa** i **Assistència**, amb tutoria creuada entre el professor de llenguatge musical i el d'instrument, pensat per acompanyar el xiquet i la família sense estigmatitzar.

---

### 1.2. El Cens de Festes, Fadrins i Colles (Vila Gal·la · 70 Vestits Romans)
Font primària: Auditoria REA de `gali-costume-hub.lovable.app` (`261020_1952_auditoria_gemini_enginyeria_inversa_bring_i_lovable.md`).

1. **Assignació Col·laborativa de Vestuari i Rols de Festa:**
   - Organitzar una filà, una colla de fadrins o un campament fester de 70 persones (Senat, Patrici, Pretorià, Legionari, Poble Romà, Xiquets) des del WhatsApp produeix caos quan dos veïns reclamen alhora la mateixa disfressa o encàrrec.
2. **Lliçó Tècnica Crítica (CAS Atòmic vs *Thundering Herd*):**
   - L'enginyeria inversa de Vila Gal·la va demostrar com s'evita que dos festers agafen el mateix rol en el mateix mil·lisegon: un `UPDATE` condicionat en base de dades (`WHERE id = $1 AND reclamat_per IS NULL`, traduït a PostgREST com `.eq("id", id).is("claimed_by", null).select()`). Si torna 0 files, algú s'ha avançat i es mostra un avís net sense sobreescriure res.
   - Al contrari, vam descobrir el patró tòxic a evitar: disparar un `SELECT *` complet per a tots els clients connectats cada vegada que canvia una fila (el *thundering herd* de $N^2$ lectures). En Sóc de Poble s'aplica directament el `payload.new` de Supabase Realtime sobre l'estat local i s'ignora el propi eco.

---

### 1.3. El Bar de la Plaça («La Parròquia») i el Rebost Familiar (Loyverse + Bring! + Nevera)
Fonts primàries: `01_produccio/loyverse_clon/export_items-6.csv`, `261013_1600_estudi_destil_laboratori_ia.md`, `261020_1952_auditoria_gemini_enginyeria_inversa_bring_i_lovable.md`.

1. **Separació entre Taulell Tàctil (1 toc) i Despatx (Back Office):**
   - Quan el cambrer del casino té la barra plena a l'hora de l'esmorzar, necessita rajoles grans de toc directe i tiquets oberts per taula (`Taula 4 - Terrassa`), no formularis comptables. Els costos de proveïdor, l'escandall i el marge brut pertanyen exclusivament a la vista de Despatx en pantalla gran.
2. **Els 11 Grups de Modificadors Reals d'un Esmorzar de Poble:**
   - L'exportació real de *La Parròquia* (`export_items-6.csv`) va revelar l'ontologia exacta d'un bar valencià: `TIPUS DE PA`, `GRANDÀRIA D'ENTREPÀ` (sencer / mig), `COMPLEMENTS D'ESMORZAR`, `PUNT DE LA CARN`, `TIPUS DE LLET`, `EXTRES`, `SALSES`, `GUARNICIÓ`, `TEMPERATURA`, `FORMAT DE CERVESA` i `COMBINATS`. En lloc d'embrutar la graella, s'obrin en una safata inferior (`BottomSheet`) només quan l'element els té definits.
3. **El Comparador Rural amb el Cost Ocult de la Benzina:**
   - Comprar al poble pareix més car només si s'amaga el viatge a la ciutat. Sóc de Poble incorpora a la cistella la **calculadora de desplaçament comarcal** ($30\text{ km A/T} \times 0,25\text{ €/km} = 7,50\text{ €}$ de benzina i desgast + $45\text{ min}$ de vida), demostrant amb números que fer la compra a la botiga del carrer Major i al forn del poble ix més rendible i manté viva la plaça.
4. **Del Rebost a la Cassola (14 Plats Tradicionals i 176 Sinònims):**
   - El motor de `src/apps/nevera/nucli/` creua els ingredients disponibles al rebost amb 14 receptes patrimonials (olleta, borreta, pericana, espencat, gaspatxos, arròs al forn...) entenent **176 sinònims autòctons** (`bajoca` / `bajoqueta` / `fesol tendre`, `tomaca` / `tomata`, `creïlla` / `pataca`), i permet enviar amb un sol clic els ingredients que falten a la llista reactiva del xat familiar.

---

### 1.4. Les 8 Targetes d'Acció del Manifest de Poble (2022–2026) i la Gestoria Rural
Fonts primàries: `01_produccio/260911_0645_propostes_manifest_panell_control.md`, `261011_1314_pla_implementacio_ficiv.md`, `261013_1405_pla_implementacio_gestoria_jarvis.md`, `261002_0205_pla_implementacio_arbre_genealogic.md`.

| Cas d'Ús Rural | Problema real al poble | Solució dissenyada a Sóc de Poble |
| --- | --- | --- |
| **1. Cotxe de Poble** | Aïllament per falta d'autobús per baixar a l'hospital de Sant Joan, a Alcoi o a Xixona. | Targeta de places lliures (`Qui baixa demà a les 8:00?`) amb repartiment de despesa i llista reactiva de passatgers. |
| **2. Mans Veïnes (Banc de Temps)** | Gent major sola que necessita canviar una bombeta, recollir receptes de la farmàcia o encendre l'estufa de llenya. | Microencàrrecs veïnals de confiança amb reclamació atòmica (`Jo m'acoste en eixir de treballar`). |
| **3. Animalets i Ramaderia** | Gossos perduts per les partides rurals, adopcions de cadells o avisos de ramat solt. | Alerta geolocalitzada per partida rural amb foto quadrada 1:1 i contacte directe amb l'amo. |
| **4. Banc de Terres i Masos** | Bancals d'oliveres i ametlers abandonats que es converteixen en polvorins d'incendi i focus de *Xylella fastidiosa*. | Emparellament entre propietaris majors que no poden llaurar i jóvens o veïns que volen cuidar l'hort o fer llenya. |
| **5. Tractor i Eines Compartides** | Comprar una estelladora de llenya, una biotrituradora o un motocultor per usar-lo dos dies a l'any. | Calendari de préstec mancomunat i torns de llaurada col·lectiva per partides. |
| **6. Compres Col·lectives (El Comú)** | Cost elevat del gasoil agrícola, pèl·lets, llenya d'alzina o sacs de farina comprats individualment. | Comanda conjunta del poble amb barra de progrés cap al llindar de descompte per camió complet. |
| **7. El Pregoner i Finestreta Única** | Bàndols municipals que no s'escolten als masos i ofec burocràtic davant subvencions (FICIV, PAC, ajudes Xylella). | Bàndol escrit i locutat en àudio clar + analitzador de convocatòries oficials (`src/apps/gestoria/` i estudi FICIV `261011_1314`) que tradueix el DOGV al valencià de carrer. |
| **8. Arbre Genealògic i Malnoms** | Quan mor una persona major, s'esborra la memòria de qui era fill de qui, de quin mas venia la família i quin era el seu malnom. | Mòdul hexagonal d'Arbre Genealògic (`261002_0205`) amb entrevista oral guiada per la IAIA MarIA i exportació estàndard GEDCOM 7.0. |

---

## 2. Aprenentatges i Esmenes Permanents per a les 38 Skills (`.agents/skills/`)

Abans d'evacuar els 239 informes d'auditoria de `90_arxiu_historic/`, deixem segellades les **10 lliçons de sang i ferro** apreses d'incidents reals durant aquests dos mesos. Totes elles han de romandre blindades dins de `.agents/skills/` (seguint la matriu de l'auditoria `261020_2100_auditoria_gemini_skills_i_textos_publics.md`):

1. **Mai editar taules de govern amb `sed -i` o expressions regulars a cegues (`core-escriptori-net` / `core-preflight-check`):**
   - *Incident històric:* En sessions d'octubre, scripts d'automatització van truncar columnes del `LEDGER.md` en intentar canviar estats amb reemplaçaments de text crus.
   - *Llei permanent:* Tota transició documental passa exclusivament per `node tooling/govern/document.mjs` i es valida amb `node tooling/gates/porta-olivera.mjs`.
2. **Prohibició absoluta de `GRANT SELECT` de taula sencera o de columnes privades a `anon` (`core-seguretat-audit`):**
   - *Incident històric (Fase C §4):* La migració `2610181915_organitzacions_correu_i_membres.sql` va fer `grant select (contact_email, public_email) on table public.organizations to anon, authenticated;`, exposant el correu privat d'administració a qualsevol petició anònima.
   - *Llei permanent:* RLS activat en totes les taules + `GRANT SELECT` columna a columna, mai exposant `contact_email`, `telefon_privat` ni metadades d'usuari al rol `anon`.
3. **Vigilància de fitxers d'enllaç (`.webloc`, `.url`, `.desktop`) contra fuites de tokens (`core-seguretat-audit`):**
   - *Incident històric:* Un simple fitxer d'escriptori macOS (`Bóveda Comunidad — Revolutia IA.webloc`, commit `ed6077ff`) contenia a l'URL el paràmetre `?mcp_token=...` cap a un servidor d'n8n.
   - *Llei permanent:* Prohibició d'incorporar fitxers `.webloc`/`.url` al repositori i escaneig sistemàtic de *query strings* amb credencials (`token=`, `key=`, `secret=`).
4. **Fals verd d'orfandat quan s'afig un segon punt d'entrada al bundler (`core-analisi-estatic-codi` / `sdp-empaquetat-natiu`):**
   - *Incident històric (Fase D §9):* Quan es va crear `src/natiu/entrada.jsx` per a Capacitor, `tractor-pedra-seca.mjs` només seguia el graf des de `src/main.jsx`. Qualsevol mòdul exclusiu de natiu podia parèixer orfe o bé quedar fora dels tractors web.
   - *Llei permanent:* Tot punt d'entrada de Vite (`vite.config.js` i `vite.natiu.config.js`) ha d'estar declarat a la constant `ENTRADES` del tractor d'orfandat.
5. **Rehidratació silenciosa de `facebook-ios-sdk` (229 MB) en Swift Package Manager (`sdp-empaquetat-natiu`):**
   - *Incident històric (Fase D §3.2):* `@capgo/capacitor-social-login` arrossega per defecte `FBSDKLoginKit` i 229 MB binaris d'iOS si no es neutralitza al `Package.swift` local i es compila amb `-onlyUsePackageVersionsFromResolvedFile`.
   - *Llei permanent:* Mantenir el vendoring net a `tooling/natiu/vendor/capacitor-social-login` i verificar sempre en `preflight.mjs` que `Package.resolved` no continga `facebook-ios-sdk`.
6. **Buidat accidental de notes quan s'usa el contingut com a bandera d'estat (`sdp-validacio-dom-gauntlet`):**
   - *Incident històric (`C01`/`C02`):* Deduhir si una nota és una «plantilla verge» comparant només si l'HTML coincideix amb la llavor (`esLlavorDeNota`) provoca que una nota desada voluntàriament amb eixe text es buide en tornar-la a obrir.
   - *Llei permanent:* Separar sempre la metadada d'origen (`esEsborranyEfimer: boolean`) del valor textual de l'editor.
7. **Fals verd en `vitest --coverage` sense llindars explícits (`core-validacio- canvis`):**
   - *Incident històric (`261013_1600`):* Executar cobertura sense `thresholds` configurats a `vite.config.js` retorna codi d'eixida `0` encara que la cobertura caiga.
   - *Llei permanent:* Verificar sempre l'efecte real del test sobre les branques modificades i no confiar en un exit code `0` buit.
8. **Enllaços trencats en compartir des de WebView natiu (`sdp-empaquetat-natiu`):**
   - *Incident històric (`F7` Fase C):* Usar `window.location.origin` per construir URLs compartibles genera `capacitor://localhost/...` a iOS i `https://localhost/...` a Android.
   - *Llei permanent:* Tota URL pública per a compartir (`navigator.share` o porta-retalls) ha d'usar una constant canònica `ORIGEN_PUBLIC_WEB = 'https://socdepoble.org'`.
9. **Sincronització dels 5 diccionaris d'idioma en cada fase (`core-traduccio-valencia`):**
   - *Incident històric (`261020_2100`):* En tancar la Fase D, les 31 claus noves d'OAuth, moderació i esborrat de compte es van escriure en valencià dins d'`eu.js` i `gl.js` (i 12 dins d'`es.js` i `en.js`) per passar el test d'estructura de claus sense traduir-ne el contingut.
   - *Llei permanent:* Prohibició de copiar cadenes en valencià com a *placeholder* dins d'`es.js`, `en.js`, `eu.js` o `gl.js`, especialment en fluxos legals i de revisió de botigues.
10. **Antídot contra el *Thundering Herd* en llistes reactives (`sdp-clon-loiverse` / `sdp-optimitzacio-rendiment`):**
    - *Incident històric (REA Vila Gal·la):* Refrescar tota la taula en cada esdeveniment de WebSocket multiplica el trànsit per $N^2$ quan 50 veïns editen alhora.
    - *Llei permanent:* Actualització optimista local + mutació puntual amb `payload.new` + filtre d'eco amb `client_mutation_id`.

---

## 3. Decisions Arquitectòniques Irreversibles (Els 8 Pactes Fundacionals)

Aquestes decisions, destil·lades de dos mesos de debat al Consell, tenen rang constitucional i **no es poden revertir** en cap refactorització futura:

1. **El Pacte de Sollutia (Model B/C) i la Frontissa Neutral (Doctrina Tellado):**
   - **Sóc de Poble (Associació sense ànim de lucre, NIF `G-03967668`)** és i serà sempre una utilitat pública gratuïta, lliure de publicitat i sobirana per als veïns i les associacions rurals.
   - **Sollutia S.L.** aporta l'enginyeria d'avantguarda i comercialitza la tecnologia en mercats professionals externs (Model B/C), finançant el Mas sense cobrar peatges al poble.
   - El codi manté una **frontissa neutral i desacoblada**: no depèn de cap CMS monolític ni de cap proveïdor tancat que puga segrestar les dades veïnals.
2. **Puresa Matemàtica de Pedra Seca i Geometria de 3 Columnes:**
   - L'arquitectura visual es regeix per proporcions exactes, alt contrast accessible per a la gent major (mínim 28 px en títols de lectura i botons tàctils generosos $\ge 48\text{ px}$), estètica editorial **Bruguera / Chumy Chúmez / Màrius Serra** i **graella màxima de 3 columnes** (`repeat(auto-fill, minmax(300px, 1fr))` amb sostre de 3). Queda prohibida per sempre la quarta columna i qualsevol graella *masonry* desordenada.
3. **Llei de la Imatge Universal Square (`1200×1200 px`, WebP `q85`) i Privacitat EXIF:**
   - Tota imatge del sistema (avatars, portades, elements del Comú, rajoles del TPV) s'estandarditza en relació d'aspecte quadrada 1:1 (`1200×1200 px` en WebP `q85` per a detall i miniatures lleugeres per a graella).
   - Les coordenades EXIF només es llegeixen o conserven quan la fotografia forma part del patrimoni públic o l'usuari ho autoritza per al mapa històric, i s'esborren per defecte en pujades personals privades.
4. **Arquitectura Hexagonal de Plugins Rurals (`sdp.modul.v1`):**
   - Cada aplicació d'ofici (`src/apps/bar`, `src/apps/nevera`, `src/apps/gestoria`, `src/apps/lector`, `src/apps/salut` i futurs mòduls com `genealogia`) separa estrictament el seu **`nucli/`** (lògica pura sense React ni DOM, testejable al 100% en mil·lisegons) de la seua **`vista/`** i de les seues **`llavors/`**, registrant-se al sistema mitjançant un manifest declaratiu (`contracteModul.js`).
5. **Unificació d'«El Comú» (`public.elements_comu` + `UniversalListCard`):**
   - Es descarta per sempre tindre motors separats per a «productes de botiga», «ingredients de la nevera», «vestits de festa» o «places de cotxe». Tot element col·lectiu del poble és un **Element del Comú** amb 5 modes de comportament (`rebost`, `tpv`, `cens`, `esdeveniment`, `loteria`) i reclamació atòmica lliure de col·lisions.
6. **Seguretat per Disseny i Dret a l'Oblit Real (App Store 1.2 i 5.1.1(v)):**
   - Cap taula de Supabase pot existir sense RLS. Tot usuari té dret a esborrar el seu compte en 2 tocs des de dins de l'app (`public.esborra_propi_compte()`) i des de la web pública (`/legal#esborra-compte`), i disposa d'eines immediates per denunciar contingut o bloquejar qualsevol compte abusiu.
7. **Doble Eixida des d'un Sol Codi Font (Web PWA + Capacitor 8 Natiu):**
   - El repositori produeix simultàniament la web pública (`dist/`) i el paquet mòbil natiu per a iOS i Android (`dist-natiu/` amb comentaris legals eliminats i pes $< 10\text{ MB}$) sense bifurcar mai els components de la interfície.
8. **La Veu de la IAIA MarIA i la Llengua del Poble:**
   - El sistema parla en un **valencià viu, càlid, precís i d'arrel** (amb suport complet en castellà, anglès, basc i gallec), lliure d'AI slop corporatiu, d'anglicismes innecessaris i de tecnicismes freds: tecnologia punta amb ànima de masia i trellat de plaça.
