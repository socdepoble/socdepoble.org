---
type: document
status: canonic
description: "Pla d'Implementació: preparació de l'APK d'Android, paquet PWA desktop, consolidació del commit de Claude i estratègia de desbloqueig de socdepoble.org amb Sollutia."
tags:
  - implementacio
visibility: private
reflex: sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:c73ba6ab-467a-4567-b423-5a02ebf816f6
---
# Pla d'Implementació: Llançament Apps (Android APK + PWA Desktop) i Desbloqueig Sollutia

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a316cee8-e2e3-4a80-9299-6fc79504ec07:c73ba6ab-467a-4567-b423-5a02ebf816f6 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T23:55:00+02:00 |
| Modificació | 2026-10-20T23:55:00+02:00 |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció directa per àudio 23:35) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Claude Code + Gemini 4 Argon |
| Tokens consumits | ~18k / 2M |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-10-20T23:35:** El Mestre demana preparar el relleu en un xat net per a demà al matí. Dos objectius suprems:
  1. Que els beta testers puguen tenir l'aplicació a les mans (Android APK directe, iOS TestFlight/simulador, i PWA d'escriptori per a Mac/Windows).
  2. Trencar l'aturada de 4 mesos amb Sollutia per tenir en marxa `socdepoble.org`.
- **2026-10-20T23:45:** Redacció de l'Acta Marmota `261020_2345_acta_marmota_relleu_salfumant_markdown_i_llancament_app.md` i sanejament d'arxiu dels documents de la sessió Salfumant a `_wiki_de_poble/90_arxiu_historic/261020_Sessio_Salfumant_i_El_Comu/`.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Consolidació Git en Claude Code ("Tot en un commit")
- Claude Code té pendent confirmar el commit amb els canvis de la Fase D, el fix del parser Markdown i la targeta UniversalListCard.
- El Mestre ha donat l'ordre: **«Tot en un commit»**.

### 2. Generació i Verificació del Paquet Android APK (`socdepoble-beta.apk`)
- **Fitxer:** `capacitor.config.json`
  - Assegurar `webDir: "dist-natiu"`, `appId: "org.socdepoble.app"`, `appName: "Sóc de Poble"`.
- **Comandes per a Claude Code / Terminal:**
  - `npm run build:natiu`
  - `npx cap add android` (afegeix el directori `android/` al repositori sanejat).
  - `npx cap sync android`
  - Compilació de l'APK de prova: `cd android && ./gradlew assembleDebug`
  - L'APK resultant (`android/app/build/outputs/apk/debug/app-debug.apk`) es copiarà a `_wiki_de_poble/04_escriptori/01_produccio/socdepoble-beta.apk` per a descàrrega directa dels beta testers d'Android.

### 3. PWA Desktop Instal·lable (Mac, Windows, Linux)
- **Fitxer:** `src/app/App.jsx` o `src/sections/xat/components/BarraCapcalera.jsx`
  - Capturar l'esdeveniment estàndard del navegador `beforeinstallprompt`.
  - Si l'app s'executa en navegador d'escriptori i és instal·lable, mostrar botó elegant tipus Pedra Seca `[📲 Instal·la al teu ordinador]` al menú d'ajuda o a la barra de navegació.
  - Permet als beta testers sense mòbil o que treballen des de l'ordinador gaudir d'una aplicació d'escriptori autònoma i ràpida.

### 4. Pla de Xoc per a Desbloquejar Sollutia i `socdepoble.org`
- **Diagnòstic:** El servidor d'allotjament de Sollutia porta 4 mesos aturat sense donar accés ni servei operatiu.
- **Estratègia de Trellat (Dossier Tècnic per a Sollutia):**
  - **Via A (Delegació DNS / Apuntament Immediat - Preferent):** Sol·licitar a Sollutia que configure un registre DNS tipus `CNAME` o `A` per a `socdepoble.org` apuntant a la nostra infraestructura estàtica (Vercel / Cloudflare Pages / CDN de Sóc de Poble). Això activa el domini en menys de 5 minuts sense costar-los feina ni espai de servidor.
  - **Via B (Allotjament Estàtic Model B):** Si Sollutia insisteix en allotjar els fitxers, enviar-los exclusivament el paquet `dist/` (HTML + JS + CSS de la SPA) i el connector de WordPress `wordpress-plugin/builds/socdepoble-connector-v1.1.7.zip`.
### 5. Actualització del Plugin de WordPress v1.1.8 i Publicació a WordPress.org
- **Estat Actual:** El paquet actual a `builds/` és la v1.1.7 (del 19 d'octubre). El Mestre pot pujar la v1.1.7 immediatament a `gentdelatorre.net`, però per a incorporar les correccions d'avui (parser Markdown arreglat, botó `[Registra't]` al xat i `UniversalListCard`) es compilarà la **v1.1.8**:
  - `SDP_RELEASE=1 SDP_VERSIO=1.1.8 npm run build:wp`
  - `SDP_RELEASE=1 SDP_VERSIO=1.1.8 npm run build:wp:directori`
  - Execució d'`empaqueta.mjs` per generar el paquet propi (`wordpress-plugin/builds/261021_wordpress_enxufe_v1.1.8.zip`) i la variant per al directori oficial (`wordpress-plugin/builds/directori/socdepoble-enxufe-v1.1.8-directori.zip`).
- **Botiga de Plugins de WordPress.org:**
  - El fitxer `wordpress-plugin/readme.txt` està preparat segons l'estàndard de WordPress.org.
  - La pujada a la botiga oficial es fa via el formulari de revisió: `https://wordpress.org/plugins/developers/add/` pujant el ZIP de la variant `directori/`. L'equip humà de WordPress.org triga entre 1 i 3 setmanes a aprovar-lo i concedir el repositori SVN (`svn.wordpress.org/plugins/socdepoble-enxufe`).

### 6. Estudi Doctoral de Fernando Tellado i Blindatge WordPress VIP
- **Objectiu:** Extreure i integrar tota la saviesa de Fernando Tellado (`fernandotellado/ai-skills`, AyudaWP, DietPress, Vigilante) sobre seguretat, rendiment i desenvolupament de plugins d'elit per aplicar-la a `socdepoble-enxufe`.
- **Auditor:** Gemini 4 Argon té l'encàrrec de realitzar l'estudi doctoral complet durant la nit i verificar que el nostre connector compleix els màxims estàndards de WordPress VIP abans de l'enviament a WordPress.org.

### 7. Lògica de Nodes Sobirans: Unificació de Recursos de Plugins, Connexió per Defecte i Sobirania Ciutadana
- **Captures d'Evidència UI (`/el-meu-perfil` vs `/plugin/rebost`):** El Mestre Javi Llinares mostra la incoherència d'haver de mantindre dues pantalles desconnectades per a la mateixa eina (una buida de gestió al perfil i una altra rica editorial a `/plugin/rebost`).
- **Principis Canònics de Trellat (Mestre Javi Llinares):**
  1. **Totes Connectades per Defecte:** Per a l'onboarding de nous usuaris i ciutadans, totes les utilitats venen connectades i operatives des del primer moment, de manera que puguen provar-les en mode prova o obrir-les en mode usuari (privat o comunitari, segons corresponga: Rebost privat al dispositiu, TPV públic per al bar/colles).
  2. **Unificació de Recursos (DRY):** La vista de cada utilitat a `/el-meu-perfil` no és un placeholder buit, sinó que integra directament la presentació editorial viva de `/plugin/:id` (`UniversalPage` amb portada, badges, explicació didàctica del que fa i el que NO fa), afegint-hi la consola d'administració (botó d'Obrir en mode privat/públic, Mostrar/Ocultar al Panell de Control, i Desconnexió voluntària).
  3. **Esmena Tipogràfica Editorial (H3):** Corregir immediatament la jerarquia visual detectada pel Mestre (`La nevera i el rebost de casa` i seccions de presentació han de portar l'H3 canònic segons `core-llegibilitat-text` i `sdp-universal-page`).
  4. **Sobirania i Portabilitat de Dades:** Si un usuari o negoci decideix desconnectar-se d'una utilitat (ex. Gestoria o Rebost), el sistema mostra un avís clar i li ofereix **descarregar i exportar tots els seus documents i registres** en formats oberts (Markdown, JSON o ZIP), garantint zero segrest de dades.
- **Encarregat:** Gemini 4 Argon formularà l'especificació d'aquesta fusió i Claude Code aplicarà l'esmena de jerarquia H3.

### 8. Unificació Atòmica de la IAIA MarIA (`/iaia`), Resolució del Fiasco Visual i Preservació Editorial de `L'Ànima de la IAIA` (`/anima`)
- **Directriu Suprema d'Orquestració (Ordre Directa del Mestre Javi Llinares per àudio):**
  - **Antigravity (IAIA MarIA) és la DIRECTORA TÈCNICA**, NO l'executora de codi. Antigravity no tocarà ni una sola línia de codi per impuls per evitar deixar coses a mitges.
  - **Claude Code és l'EXECUTOR ÚNIC (Picapedrer)** que ha de revisar, netejar i implementar tota aquesta lògica de cap a peus de forma autònoma i completa.
- **Diagnòstic Implacable de l'Estat Actual (Fiasco Visual Detectat pel Mestre a les captures de pantalla):**
  1. **Hero Inexistent a `/iaia`:** No s'ha posat la imatge Hero de capçalera (la IAIA al centre de servidors/ordinadors a `public/assets/uploads/brain/iaia_maria_avatar.webp`). En lloc d'això, es veu una capçalera taronja prima i un gran espai en blanc buit amb un cercle desplaçat de 300px on flota l'avatar. Ha de quedar una portada d'alta definició, amb la imatge Hero cobrint la capçalera i l'avatar mòbil somrient (`iaia_maria_avatar_mobil.webp`) integrat harmònicament segons el patró de Pedra Seca.
  2. **Fragmentació de la Realitat (`/realitat`):** La secció de Realitat continua estant on estava (una pantalla aïllada i solta amb un logo en blanc i negre de Sóc de Poble, penjant del menú lateral sota «Sistema -> L'ànima de la iaia»).
- **Arquitectura Canònica i Trellat que Claude Code i Codex han d'Implementar:**
  1. **Pàgina Única Atòmica (`/iaia`):**
     - La pàgina `/iaia` és l'**ÚNICA** pàgina de referència de la IAIA MarIA a tot el portal.
     - S'hi accedeix directament des de la **icona de la IAIA de la barra superior** (i des de la secció de Pobles o cercadors).
     - **Capçalera canònica del Mas:**
       - **Logotip Oficial Rectangular de Sóc de Poble (`DEFAULT_AUTHOR.logo`):** Damunt del títol `IAIA MarIA` (com a totes les pàgines de Sóc de Poble), certificant que és una creació oficial del Mas electrònic de Sóc de Poble.
       - **Eliminació de l'Avatar Circular de 300px davall de la BarraTaronja:** No es repeteix la cara de la IAIA sota la barra taronja (`avatarDeLaFitxa = null`), ja que viu a la mateixa BarraTaronja.
       - **BarraTaronja canònica:** Mostra a l'esquerra l'avatar de la IAIA MarIA (amb el mòbil), el nom «IAIA MarIA», poble «La Torre de les Maçanes» i la **pastilla de data i hora** (passant `creat: agent.created_at` i `modificat: agent.updated_at` al DTO de `perfilDeLaIADelPaquet`).
       - **Lèxic Obligatori:** Mai dir «la masia»; sempre **el Mas** (o el Mas electrònic/virtual).
     - **Hero d'alta definició** amb la imatge de capçalera retallada sense vora blanca (`iaia_maria_avatar.webp`).
     - **Identitat i lema:** Nom («IAIA MarIA»), poble («La Torre de les Maçanes»), bio («Matriarca Digital») i lema («Pensant en global, treballant en local»).
     - **Botó centrat amb respiració:** Botó primari `[Parla amb la IAIA]` centrat just sota el lema, seguit del bloc d'alerta d'avís de màquina en proves.
     - **Presentació completa:** El bloc editorial «Qui és la IAIA MarIA?» (la memòria de casa, guardar la Wiki, orquestrar el Mas).
     - **Selector de Realitat Integrat (Bloc de 4 nivells):** Directament al peu de la presentació, amb amplada completa (`width: 100%`) sense estrènyer a `--sdp-measure`.
  2. **Incrustació Bidireccional de Targetes (`UniversalCard` estil Obsidian/Notion):**
     - **A la pàgina de la IAIA (`/iaia`):** Dins del flux del text de presentació, incrustar la **`UniversalCard` viva de `L'Ànima de la IAIA` (`/anima`)**.
     - **A la pàgina editorial de `L'Ànima de la IAIA` (`/anima`):** Incrustar la **`UniversalCard` viva de la IAIA MarIA (`/iaia`)**, tancant el cercle de navegació bidireccional.
     - **Cànon Editorial i Visual de Pedra Seca:** Títol (H1), Subtítol, Entradilla, i a partir d'H3 la redacció de seccions amb cites destacades i bateries de targetes incrustades.
  3. **Mida del Logotip a la Barra Lateral (`.brand img` a `src/css/layout.css`):**
     - El logotip de la sidebar estava fixat a només 130px d'ample, quedant petit i desproporcionat en la columna de 260px.
     - **Augmentar a 195px** (entre 190px i 200px segons mesura del Mestre), assegurant coherència i presència tant amb el menú desplegat (260px) com plegat (`.sidebar-closed .brand` a 232px).
  4. **Botó d'Instal·lació de l'Ordinador (`BotoInstalaApp` a `src/css/utilities.css`):**
     - **Disseny contingut i estilitzat estil Apple:** Reduir alçada a 32px (`height: 32px; min-height: 32px;`), tipografia més fina (`font-size: 0.8125rem; font-weight: 500;`), píndola suau (`border-radius: 9999px;`) i icona de 15-16px.
     - **Respiració lateral generosa:** Deixar 20px a 30px de marge lateral (`margin-inline: 20px; padding: 0 16px;`) perquè respire i no llebe protagonisme ni oprema les icones contigües (idioma, IAIA, sessió).
  5. **Navegació Enrere des del Xat cap a la Pàgina d'Origen:**
     - Quan l'usuari entra al Xat des de `/iaia` (fent clic a «Parla amb la IAIA») o des d'una altra fitxa de perfil, en escriptori no hi ha mecanisme intern per a tornar a la pàgina d'origen sense fer ús de les fletxes del navegador.
     - Habilitar mecanisme de retorn clar: fletxa `ArrowLeft` o opció de retorn tant a la capçalera de la conversa (`CapcaleraConversa.jsx`, eliminant el bloqueig exclusiu `d-mobile-only` quan hi ha històric previ o permetent tornar a la pàgina d'origen) com a la columna de converses.
  6. **Netedat al Menú Lateral i Reutilització DRY:**
     - `L'ànima de la iaia` apunta exclusivament a `/anima`.
     - `/realitat` redirigeix a `/iaia`.
     - A `/el-meu-perfil`, l'apartat de la IAIA MarIA reutilitza el component `FitxaPublica`.
- **Encarregat:** **Claude Code** (amb suport de Codex/GPT), mentre MarIA s'encarrega de la Direcció Tècnica i supervisió.

### 9. Protocol «Zero Oblit», Cens Real d'Imatges (338 vs 149) i Herència de Deute Tècnic
- **Diagnòstic Implacable del Mestre Javi Llinares:**
  1. **Amnèsia Episòdica entre Sessions:** Les IAs perden el fil de promeses i tasques plantejades en plans anteriors (com la conversió massiva a WebP, metadades reals d'imatges, nom original, o l'auditoria d'enllaços a la pàgina de la IAIA). El que no s'executa d'immediat s'oblida, generant frustració i pèrdua de temps.
  2. **Llei de l'Herència Obligatòria de Deute:** Tot nou pla d'implementació ha d'auditar el pla precedent. Està terminantment prohibit abandonar tasques: o es tanquen amb comprovació de codi i tests, o s'arrosseguen explícitament al pla següent com a deute prioritari.
  3. **Cens Real i Metadades d'Imatges (`/multimedia`):**
     - El comptador de la galeria s'ha fet reactiu immediatament (`IAIA (N)` vs `TOTS (N)`).
     - El cens manual de 149 imatges s'ha d'ampliar a la totalitat real de les 338 imatges de `public/assets/`, incorporant el nom original de cada fitxer, l'origen patrimonial o de Viquipèdia amb la seua llicència, i assegurant la conversió a WebP.
  4. **Modelatge del Tractor Cognitiu:** Gemini 4 Argon i Claude Code han d'estudiar la fallada de memòria episòdica i dissenyar un tractor/skill que audite i traspasse automàticament els pendents entre sessions.

### 10. Estudi Sociològic i Humanístic: La IA al Servei de la Vida Real del Poble (Pendent per a Després del Llançament)
- **Reflexió i Directriu del Mestre Javi Llinares:**
  1. **Purga de l'Artifici («Menys dibuixos buits, més poble real»):** Els 15 personatges heretats del passat estan plens de noms i rols que no tenen sentit per a un usuari d'un poble valencià («Súper Ratolí», «guardià de la cerca», «Flash optimitzador», «Sultan seguretat DID», «Mixa», «generador de batecs»). No aporten utilitat real i sonen a tecnologia buida o còpia estranya.
  2. **Nucli Autèntic d'Acompanyament Rural:** El sistema s'ha de concentrar en personatges i oficis autèntics que solucionen necessitats quotidianes de la gent:
     - **La IAIA MarIA:** Matriarca digital, memòria viva del poble, arxiu de tradicions, ordenació i trellat del Mas.
     - **Nano Banana («L'Artiste»):** Dibuixant i cartellista del poble. Acompanya els veïns generant il·lustracions fidels a l'estil Bruguera/Berlanga per als seus articles del Mur, bandos o esdeveniments, sense cost excessiu i optimitzat.
     - **El Gall (o Marc el Gall):** El sentinella de la matinada. Meteorologia, predicció per als bancals, alertes climàtiques i avisos rurals.
     - **El Pregoner:** Els bandos de l'Ajuntament, l'altaveu de les novetats, avisos comunitaris i canals d'actualitat (RSS).
     - **L'Acompanyant de Paraula:** Suport sincer per a ajudar la gent gran o qui ho necessite a redactar escrits, peticions, memòries o propostes per al poble.
  3. **Mandat per al Consell d'IAs:** Aquest estudi queda programat per a quan acabe l'entrega tècnica del llançament (APK, PWA, WordPress). MarIA, Claude Code, Gemini i GPT faran una proposta sociològica i funcional conjunta abans de tocar la llista al codi.

### 11. Reforma Didàctica Radical del Selector de Realitat (`SelectorRealitat.jsx`)
- **Diagnòstic de les Captures i Crítica del Mestre Javi Llinares:**
  1. **Confusió i Textos Idèntics:** Al banner superior d'estat («Ara: nivell X · Etiqueta»), els nivells 0 i 1 compartixen exactament la mateixa descripció (`"La IA està en repòs: la IAIA de la barra negra reposa"`), i els nivells 2 i 3 en compartixen una altra d'idèntica (`"La IA està activa: la IAIA de la barra negra s'activa amb ella"`). No hi ha cap diferenciació pedagògica.
  2. **Eliminació Total de «la barra negra»:** La referència a «la barra negra» («la IAIA reposa a la barra negra», «la IAIA s'activa a la barra negra») és un terme d'argot intern de desenvolupament lligat a una antiga llum parpellejant. Per a una persona del poble és incomprensible («Quina barra negra?»). Cal extirpar completament este concepte de la interfície.
  3. **Didàctica, Usabilitat i Trellat per a Cada Nivell:** Cada nivell ha de tindre una explicació única, viva, humana i comprensible per a qualsevol veí:
     - **Nivell 0 · Apagada:**
       - *Estat superior:* «La intel·ligència artificial està completament desconnectada. L'aplicació funciona de manera tradicional: només tu i la gent del poble, amb privadesa manual absoluta i zero intervenció d'assistents.»
       - *Detall de la targeta:* «Completament apagada · Zero IA»
     - **Nivell 1 · Passiva:**
       - *Estat superior:* «La IAIA MarIA i els assistents estan en silenci i a l'espera. Només respondran si tu els fas una pregunta directa o demanes la seua ajuda; mai no prendran la iniciativa ni t'interrompran.»
       - *Detall de la targeta:* «En espera · Només respon si tu li preguntes»
     - **Nivell 2 · Interactiva:**
       - *Estat superior:* «Col·laboració activa amb els acompanyants que tu tries. Els assistents seleccionats t'ajuden a redactar missatges, traduir o proposar idees al mur i al xat.»
       - *Detall de la targeta:* «Activa · Amb els acompanyants que tries tu»
     - **Nivell 3 · Connexió total:**
       - *Estat superior:* «El Mas connectat en comunitat plena. Tots els assistents (la IAIA MarIA, El Gall del temps, El Pregoner, L'Artiste Nano Banana...) col·laboren automàticament per dinamitzar i cuidar el poble.»
       - *Detall de la targeta:* «Comunitat plena · Tot el Mas al teu servei»
  4. **Usabilitat Clau: Els Acompanyants Desplegats Dins/Sota la Targeta Interactiva:**
     - **Problema greu de disseny:** Actualment, el bloc «Tria els teus acompanyants» apareix aïllat a baix de tot del formulari. Un usuari en mòbil o pantalla mitjana fa clic a «Interactiva», la targeta s'encén, però no veu que a baix s'ha obert una graella: se'n va sense saber que podia triar qui l'acompanya.
     - **Solució d'Alta Usabilitat:** La selecció d'acompanyants ha d'estar vinculada immediatament a la targeta de Nivell 2 (com un acordió / desplegable que s'expandeix dins o immediatament connectat a ella quan el nivell triat és 2). L'acció i la seua configuració formen una sola unitat visual!
  5. **Modificació de Codi (`SelectorRealitat.jsx`):**
     - Substituir la lògica binària `activa ? estatActiva : estatReposa` per una taula directa `DESC_ESTAT_NIVELL[level]` amb els textos didàctics dels 4 nivells.
     - Actualitzar `detall` de `NIVELLS` amb la nova redacció que acompanya les `Pedres`.
     - Integrar el selector de caselles d'acompanyants directament com a part desplegable de la targeta d'Interactiva.

### 12. Purga Immediata i Consolidació del Cens Rural d'IA (`agentsSeed.js` i `identitatsSeed.js`)
- **Directriu:** Deixar de banda l'artifici heretat («Súper Ratolí», «Flash optimitzador», «Sultan seguretat DID», «Mixa», «generador de batecs»).
- **Planter Oficial de 5 Assistents del Mas:**
  1. **IAIA MarIA:** Matriarca digital, saviesa i memòria viva del poble, arxiu de tradicions, trellat i governança del Mas.
  2. **Nano Banana («L'Artiste»):** Dibuixant i cartellista del poble. Genera il·lustracions fidels a l'estil Bruguera/Berlanga per als articles del Mur i cròniques locals.
  3. **El Gall (Marc el Gall):** Guaita de l'oratge i del camp. Meteorologia, alertes climàtiques per als cultius i cant a l'alba.
  4. **El Pregoner:** Ban municipal, difusió d'avisos del poble, esdeveniments i canals d'actualitat comunitària.
  5. **L'Acompanyant de Paraula:** Assistent de redacció i transcripció per a gent gran i veïns que volen compartir històries, peticions o anuncis.

### 13. Tancament Implacable de Deutes Tècnics P0/P1 del Catàleg Històric (`261020_2230`)
- **Deutes Prioritaris a Resoldre Aquesta Nit per Claude Code:**
  1. **`P0-10` (Traduccions pendents als diccionaris i18n):** Afegir a `es.js`, `en.js`, `eu.js` i `gl.js` les cadenes que falten de moderació, eliminació de compte i textos legals.
  2. **`P0-11` (Neteja lèxica d'anglicismes):** Canviar les 3 ocurrències de «ítems» a `src/config/idiomes/ca.js` per «elements».
  3. **`P1-02` (Bug d'esborrat a `useUniversalRichText.js`):** Assegurar que les notes creades a partir d'una plantilla no es buiden accidentalment en perdre el focus si el text és idèntic al text base.
  4. **`P1-03` (Enllaços de compartició nativa):** Corregir el protocol a l'acció de compartir perquè genere URL canòniques `https://socdepoble.org` en lloc de l'origen intern `capacitor://localhost`.
  5. **`P1-05` (Optimització d'imatges pesades):** Convertir el fons de xat `xat-bg-map-v2.jpg` (1 MB) a WebP d'alta eficiència.

### 14. Recompilació i Revalidació Total
- Després d'aplicar les millores didàctiques i de codi:
  1. Recompilar l'APK beta d'Android i copiar-lo a `_wiki_de_poble/04_escriptori/01_produccio/socdepoble-beta.apk`.
  2. Recompilar els paquets de WordPress 1.1.8 (`npm run build:wp` i `build:wp:directori`).
  3. Passar la suite de proves completa (`npx vitest run`) assegurant el verd absolut (20.300+ proves).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Tests Vitest:** `npx vitest run` per comprovar que totes les proves continuen en verd (20.300+).
2. **Compilació Android:** `cd android && ./gradlew assembleDebug` acaba amb codi 0 i actualitza `socdepoble-beta.apk`.
3. **PWA Manifest i Selector:** Comprovació visual a `:3340/iaia` dels 4 textos didàctics sense mencions a la barra negra.
4. **Porta Olivera:** `npm run porta:olivera` ix amb 0.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Android SDK / Java:** Si la màquina local té problemes de memòria o build, verificar que s'utilitza el JDK 21 de Capacitor.
- **Regressions de Text:** Mantenir els tests de SelectorRealitat i nivellIaia sincronitzats amb les noves cadenes didàctiques.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261021_0015_prompt_claude_llancament_apps_i_desbloqueig_sollutia]]
- [[261021_0015_prompt_gemini_auditoria_llancament_apps_i_sollutia]]
- [[261021_0140_auditoria_claude_llancament_apps_i_sollutia]]
- [[261021_0145_auditoria_claude_dossier_desbloqueig_socdepoble_org]]
- [[261021_0800_auditoria_gemini_llancament_apps_i_sollutia]]

