---
type: informe
status: esborrany
description: 'Tasca 5: estat real de l''empaquetat mòbil per a App Store i Google Play, fitxa a punt, bloquejants de revisió i passos per al Mestre i els agents.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_fb1e82c4-a176-495d-8b74-fc0fc4a449a7:574b0c90-20ee-46f2-8298-f942011a134f
---
# Botigues d'apps: estat real, fitxa i camí crític

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_fb1e82c4-a176-495d-8b74-fc0fc4a449a7:574b0c90-20ee-46f2-8298-f942011a134f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T12:07:49.340Z |
| Modificació | 2026-10-08T12:07:49.340Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code; recerca d'un subagent de només lectura, redacció de l'orquestrador) |
| Tokens consumits | uns 0,45 M (subagent de recerca) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-08T12:07:49.340Z: esborrany creat; contingut i verificació pendents.
2026-10-08T12:15Z: informe de la tasca 5 del prompt `261008_1201` redactat a partir de la recerca de només lectura.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

Encàrrec (tasca 5 del prompt `261008_1201_prompt_claude.md`, afegida a les 13:03): preparar la publicació a l'App Store i a Google Play revisant la documentació de la «gestoria de poble», i automatitzar tot el que es puga perquè el Mestre no s'haja de barallar amb les pantalles.

Convencions: **[V]** vol dir verificat al disc o al navegador en este torn. **[NO VERIFICAT]** vol dir política de botiga o fet extern que no s'ha pogut comprovar.
- **LAB1:** `02_investigacio_ia/261003_1330_empaquetat_mobil_claude/`.
- **LAB2:** `02_investigacio_ia/261004_0605_nit_claude/`.

### Resum en deu línies

1. **La faena feta és paper i preparació.** Hi ha un pla, una fitxa camp per camp, un runbook, els scripts de pujada en `.txt` i una entrada nativa mínima. No hi ha cap app nativa: ni Capacitor, ni `android/`, ni `ios/`, ni icones de botiga, ni comptes de prova [V].
2. **URGENT.** La URL de privacitat de la fitxa (`https://socdepoble.org/legal`) dona «No s'ha trobat» a producció hui, i `/page/legal` també falla [V, navegador]. Sense una URL pública de privacitat que funcione no es pot omplir cap de les dues fitxes.
3. **Pagament a Apple.** Als extractes de la gestoria consta un càrrec anual d'Apple a principi d'any, que quadra amb la quota del programa de desenvolupadors. Que siga eixa quota i no una altra subscripció està [NO VERIFICAT]: ho dirà `developer.apple.com` › Membership.
4. **Titular de l'app: la gran incògnita.**
   - LAB1 `LLEGIU_PRIMER.txt:44-47` diu que el compte d'Apple és d'organització.
   - El text legal diu que el responsable és una persona física (`src/sections/text/legalContent.js:25-27`).
   - Al disc no hi ha cap D-U-N-S.
5. **Google Play.** No hi ha rastre del pagament del compte. Els documents diuen que està «a mig configurar» (LAB1 `LLEGIU_PRIMER.txt:48-53`).
6. **El bloquejant de revisió més gran és la moderació, i afecta també el web.** No es pot denunciar, ni bloquejar, ni amagar. No hi ha protecció de menors. Coincidix amb els bloquejants B01 i B02 de [[261008_1355_auditoria_claude]].
7. **Esborrar el compte des de l'app sí que existix** (`src/sections/profile/DetallPrivacitat.jsx:228` i `:289`; purga als 30 dies). Falta la URL web d'esborrat que exigix Play, i comprovar que `pg_cron` programa la purga a producció.
8. **Què es pot automatitzar.** Textos, recursos, codi, builds i pujades poden anar per les API oficials, amb claus que el Mestre crea una sola vegada. No es poden automatitzar les accions legals, les credencials, els acords, la DSA ni «Enviar a revisió».
9. **El «plugin d'automatització web» (Claude in Chrome) el denega el hook del projecte** (`tooling/gates/hooks-local.mjs:84-90`). Només s'admet el navegador integrat. Obrir-lo és un canvi de governança amb lease.
10. **El cronograma de LAB1 (enviament entre el 10 i el 12 d'octubre) ha caducat.** La lease de Capacitor no s'ha fet.

### 1. Estat real: el que diuen els documents i el que hi ha al disc

**Fet i present [V]**
- **PWA:**
  - `public/manifest.webmanifest` i `public/sw.js` existixen.
  - El manifest només porta la icona de 180×180 (`manifest.webmanifest:13-20`).
  - Falten les icones de 192, de 512 i maskable (LAB1 `FASE0_PWA.txt:274-291`).
- **Base nativa prèvia a la lease:**
  - `vite.natiu.config.js` amb directori `dist-natiu`, entrada `/src/natiu/entrada.jsx` i CSP nativa (`:32-33`, `:68`). Veta Umami i Google Calendar (`:245-250`).
  - `src/natiu/` només té l'entrada i dues proves.
- **Scripts de pujada (preflight, puja-ios, puja-android):** només com a `.txt` a LAB1 `nous/botigues/`. No estan instal·lats.
- **`capacitor.config.json`:** només com a esborrany de LAB1 (`appId org.socdepoble.app`, `webDir dist-natiu`).

**Absent [V]**
- Cap dependència `@capacitor/*`, ni scripts `build:natiu` o `cap:*`.
- Cap `capacitor.config.json` a l'arrel, ni `android/`, `ios/`, `dist-natiu/` o `resources/`.
- Cap PNG de 512 ni de 1024, ni imatge destacada, ni captures.
- Cap selector de poble en temps d'execució, ni OAuth natiu, ni Sign in with Apple, ni moderació.

**Només als documents [NO VERIFICAT]**
- Que el compte d'Apple és d'organització amb D-U-N-S.
- Que el compte de Play està a mig configurar.
- Que la purga programada (`pg_cron`, tasca `sdp-purga-baixes`, `2609261500_identitat_perfil_f1.sql:1469-1471`) està activa a producció.

### 2. La «gestoria de poble»

No és un tràmit ni una app per a les botigues. Són dues coses:
- **(a)** La carpeta privada germana del repositori (`../_gestoria_de_poble`, fora de git), on viuen les proves d'identitat legal: alta censal, papers d'una associació, factures i extractes, Kit Digital i una marca a l'OEPM (LAB2 `MAPA_EMPRESA_GESTORIA.txt:27-35` i `:62-96`).
- **(b)** El mòdul Gestoria de l'app.

Per a les botigues importa la (a): d'ella depenen el D-U-N-S, la declaració DSA i la verificació de Google.

**Candidats a titular (cap no està confirmat):**
- La persona física, que és el que diu hui la política enllaçada.
- Una associació amb papers a la gestoria (`MAPA :72`). El tutor no troba evidència que l'associació del pla director estiga constituïda (LAB2 `TUTOR_EMPRESARIAL.txt:59-63`).

**Conseqüència:** la fitxa, el copyright i el responsable de la política de privacitat han de ser la mateixa entitat (decisió D3 de LAB2 `BLOQUEJANTS_BOTIGUES.txt:110-114`). `requires_human_decision: true`.

**Avís:** la gestoria té un expedient de marca a l'OEPM amb un suspens de forma pendent (`MAPA :84`). Cal mirar si afecta el nom «Sóc de Poble» abans de nomenar l'app.

**Apple [NO VERIFICAT les condicions vigents]**
- Un compte d'organització exigix D-U-N-S i poder per a obligar l'entitat; la botiga ensenya l'entitat com a venedor.
- Un compte individual ensenya la persona.

**Google Play [NO VERIFICAT]**
- Quota única.
- Un compte personal nou exigix una prova tancada de 12 testers durant 14 dies abans de producció.
- Un compte d'organització demana D-U-N-S i verificació.
- Les dues botigues demanen la declaració de comerciant de la DSA per a distribuir a la UE.

### 3. Fitxa de botiga a punt per a copiar

Base: LAB2 `FITXES_BOTIGUES.txt`, contrastada amb el codi d'avui.

**[CONDICIÓ Bx]** vol dir que la frase només s'envia si la tasca Bx de LAB1 `BOTIGUES.txt` està feta el dia de l'enviament.
- B1: moderació (denunciar i bloquejar).
- B3: selector de poble.
- B6: Snippet com a destí de «Compartix».

**Identitat**
- Nom: «Sóc de Poble» (12 c).
- Bundle ID / applicationId: `org.socdepoble.app` (decisió D1, irreversible).
- SKU d'iOS: `socdepoble-ios`.
- Idioma principal: català, si App Store Connect l'oferix [NO VERIFICAT]; segon idioma, castellà.
- Categoria: Apple, Social Networking (i Lifestyle com a secundària); Play, Social.
- Preu: gratuïta, sense compres dins de l'app.

**Subtítol d'iOS (màxim 30)**
- ca: «La xarxa pública del poble» (26 c).
- es: «La red pública del pueblo» (25 c).

**Descripció curta de Play (màxim 80)**
- ca: «La xarxa pública del teu poble: mur, xat, mercat i notes, sense publicitat.» (75 c)
- es: «La red pública de tu pueblo: muro, chat, mercado y notas, sin publicidad.» (73 c)

**Text promocional d'iOS**
- ca: «El mur, el xat i el mercat del teu poble, en una sola app. Sense publicitat i sense vendre dades: fet al poble, per al poble.»
- es: «El muro, el chat y el mercado de tu pueblo, en una sola app. Sin publicidad y sin vender datos: hecho en el pueblo, para el pueblo.»

**Descripció llarga (valencià)**

> [CONDICIÓ B3] Sóc de Poble és la xarxa pública del teu poble. Tria el teu poble i hi trobaràs el mur amb el que hi passa, el xat amb els veïns i les entitats, el mercat d'anuncis entre veïns, l'agenda i el teu bloc de notes.
>
> · Sense publicitat i sense vendre dades: no fem perfils comercials de ningú.
> · Fet al poble, per al poble: hereu de més de trenta anys d'activisme rural.
> · [CONDICIÓ B6] Des del botó Compartix del telèfon, pots desar qualsevol enllaç a les teues notes.
>
> Per a escriure al mur o al xat cal un compte. [CONDICIÓ B1] Pots denunciar qualsevol contingut i bloquejar qualsevol persona; ho revisem a mà.
>
> Pots esborrar el teu compte des de l'app quan vulgues.

**Descripció llarga (castellà; l'ha de revisar algú que el parle de casa)**

> [CONDICIÓN B3] Sóc de Poble es la red pública de tu pueblo. Elige tu pueblo y encontrarás el muro con lo que pasa, el chat con los vecinos y las entidades, el mercado de anuncios entre vecinos, la agenda y tu bloc de notas.
>
> · Sin publicidad y sin vender datos: no hacemos perfiles comerciales de nadie.
> · Hecho en el pueblo, para el pueblo: heredero de más de treinta años de activismo rural.
> · [CONDICIÓN B6] Desde el botón Compartir del teléfono, puedes guardar cualquier enlace en tus notas.
>
> Para escribir en el muro o en el chat hace falta una cuenta. [CONDICIÓN B1] Puedes denunciar cualquier contenido y bloquear a cualquier persona; lo revisamos a mano.
>
> Puedes borrar tu cuenta desde la app cuando quieras.

**Paraules clau d'iOS (màxim 100)**
- ca: `rural,veïns,comunitat,xat,mercat,notes,entitats,associacions,comarca,agenda,valencià`
- es: `pueblo,rural,vecinos,comunidad,chat,mercado,notas,asociaciones,comarca,agenda`
- «ajuntament» queda fora a propòsit, perquè suggeriria una app oficial.

**Adreces web**
- **Privacitat:** `https://socdepoble.org/legal` (`src/config/systemPages.js:42`). **No s'obri a producció** [V].
- **Suport:** proposta d'una pàgina pròpia «Suport i contacte».
- **Lloc web:** `https://socdepoble.org/projecte`.
- **URL d'esborrat del compte (obligatòria a Play):** no existix. Proposta: pàgina «Com esborrar el teu compte», amb el camí dins de l'app, la petició per correu i els terminis.

**Classificació per edats**
- **Fets [V]:**
  - L'app té contingut generat per usuaris i xat.
  - Qualsevol membre pot obrir un xat directe amb qualsevol altre, sense acceptació ni bloqueig.
  - Els fils de pàgina no tenen moderació.
  - El text legal admet persones de 14 anys (`legalContent.js:48`), però l'alta no demana l'edat (`OnboardingSteps.jsx:43` i `:269-284`).
- **Apple:** User-Generated Content Sí; Messaging and Chat Sí; Parental Controls, Age Assurance, Unrestricted Web Access i Advertising No.
- **Tram de la classificació** (`requires_human_decision: true`):
  - (a) 13+, només quan existisquen la moderació, el bloqueig i la declaració d'edat a l'alta;
  - (b) 16+ mentre no n'hi haja.
- **Play:** públic objectiu 13-15, 16-17 i 18+ (opció a) o 16-17 i 18+ (opció b), i mai 12 o menys. «Appeal to children»: No.

**Privacitat: respostes provisionals segons el codi real**
- **Apple App Privacy.** Tot «Linked», sense «Tracking», amb finalitat App Functionality:
  - nom o pseudònim i correu;
  - fotos (avatar, capçaleres, imatges del text);
  - missatges del xat;
  - altre contingut (Mur, Mercat, agenda, notes);
  - identificador d'usuari;
  - el poble com a dada de perfil.
- **Seguretat i compliment:** la base de dades guarda, en cada consentiment, un resum (hash) de la IP i el navegador (`2609261500_identitat_perfil_f1.sql:581-588`). Cal declarar-ho.
- **No es declara:** telèfon (no n'hi ha; cal llevar-lo del text legal, `:75`), ubicació, salut, finances ni dades d'ús.
  - **Ubicació:** no hi ha cap `navigator.geolocation`. Ara bé, el retallador oferix «geolocalitzar la imatge», apagat de sèrie i encara no persistit. Si s'endolla, caldrà declarar la ubicació com a opcional.
- **Google Data safety:**
  - Recollida: Sí. Xifratge en trànsit: Sí. Petició d'esborrat: Sí (falta la URL web). Compartir: cap.
  - Tipus: nom, correu, identificador i poble (requerits); missatges, fotos i contingut (opcionals); diagnòstic de seguretat per la IP i el navegador.

**Exportació de xifratge**
- `ITSAppUsesNonExemptEncryption = NO`.
- **PERILL:** la targeta pendent del xat promet «xifratge extrem a extrem» (`src/sections/xat/XatControlSection.jsx:46`). Cal llevar-la (també del web) amb ordre del Mestre. `requires_human_decision: true`.

### 4. Bloquejants de revisió

| Norma | Estat al codi | Què falta |
| --- | --- | --- |
| Apple 1.2 i Play UGC / seguretat infantil | No n'hi ha cap control [V] | Denunciar, bloquejar, amagar i expulsar; filtre; condicions amb tolerància zero; contacte; estàndards de seguretat infantil publicats; protecció de menors (B01 i B02 de l'auditoria del xat). Prioritat P0. |
| Apple 4.2, funcionalitat mínima | Codi dins del binari, closca sense xarxa | Cap funció nativa encara: destí «Compartix», mode sense connexió i, a la v1.1, notificacions. |
| Apple 5.1.1(v) i Play, esborrat del compte | Existix dins de l'app [V] | URL web d'esborrat; comprovar `pg_cron` a producció. |
| Apple 4.8 i OAuth natiu | «Entrar amb Google» es pinta sense condició (`OnboardingSection.jsx:414-445`) | A la v1 d'iOS, només correu i contrasenya (D5-b), o OAuth natiu. |
| Apple 4.3, spam | Una sola app per a tots els pobles exigix selector en temps d'execució | Selector de poble (B3). |
| Apple 2.1, completesa | Targetes «pendent» al xat (`XatControlSection.jsx:45-46`) | Amagar la Gestoria, la Consola i les eines de desenvolupament dins de l'app. |
| Apple 5.1.1(i), política | La URL no s'obri; el text contradiu l'app (dades al telèfon, telèfon d'entrada, proveïdors d'IA sense crides) | Un canvi revisat de `legalContent.js`, amb ordre del Mestre. |
| Recursos | No n'hi ha | Icones de 1024 i 512, captures, imatge destacada de 1024×500, poble de demostració i comptes de prova. |

### 5. Automatització realista

**Frontera:** cap agent escriu contrasenyes, codis 2FA o frases de keystore; ni crea comptes, claus o testers; ni accepta acords; ni fa declaracions legals, la DSA o «Enviar a revisió». Cada «Desa» o «Envia» d'un portal necessita un sí del Mestre per a eixa acció.

**El que poden fer els agents sense el Mestre:**
- **Codi:**
  - moderació (B1), selector de poble (B3) i amagar Google a iOS;
  - pàgines d'esborrat, suport i seguretat infantil, pel camí `SYSTEM_PAGES` + `PAGE_COPY` + `UniversalPage`, amb ordre per a cada text visible.
- **Recursos:** quan el Mestre haja triat la icona, generar 1024 sense alfa, 512, 192 i maskable amb `sips` i `qlmanage` de macOS, sense instal·lar res. Ho ha d'executar MarIA o el Mestre: la shell de Claude està confinada.
- **Textos:** una carpeta de metadades per idioma generada des de la fitxa.
- **Captures:**
  - esborranys al navegador integrat sobre el poble de demostració;
  - les definitives, al simulador quan existisca `ios/`.

**Pujar la fitxa sense pantalles: dues vies.** Decisió del Mestre, `requires_human_decision: true`.
- **(a) Sense dependències:**
  - App Store Connect API, amb un JWT ES256 signat amb `node:crypto` i la clau `.p8`;
  - Google Play Developer API, amb un JWT RS256 i el JSON del compte de servei;
  - tot amb Node 22 i `fetch`, coherent amb la pedra seca. Els noms exactes dels endpoints estan [NO VERIFICAT].
- **(b) fastlane (deliver, supply, pilot):** és una gemma de Ruby; instal·lar-la requerix l'aprovació del Mestre.

**El que les API no fan [NO VERIFICAT]:**
- Apple: crear l'app, les etiquetes d'App Privacy, la DSA, i els acords, impostos i banca.
- Play: crear l'app i el compte, l'IARC, el públic objectiu, l'accés a l'app, la declaració d'anuncis i la primera pujada de l'AAB.

Per a estes pantalles, la via és el navegador integrat amb el Mestre ja dins de la sessió: l'agent escriu els camps no personals i el Mestre prem «Desa».

### 6. Camí crític

**Per al Mestre (en ordre):**
1. **M1** (10 min). Mirar a `developer.apple.com` › Membership el tipus d'entitat, el nom legal, el Team ID i la data de renovació.
2. **M2.** Decidir el titular únic (D3) i la declaració DSA (D4). Si el titular és una entitat sense D-U-N-S, demanar-lo ja, perquè tarda dies o setmanes. Mirar l'estat de la marca a l'OEPM.
3. **M3** (5 min). Donar les ordres per a:
   - llevar la promesa d'E2E;
   - el canvi de `legalContent.js`;
   - les pàgines noves (esborrat, suport i seguretat infantil).
4. **M4** (10 min). Fer que `https://socdepoble.org/legal` responga a producció: desplegar el build actual o publicar una pàgina estàtica.
5. **M5** (5 min). Consultar a Supabase si existix la tasca `sdp-purga-baixes` a `cron.job`.
6. **M6** (30 min). Prendre les decisions de LAB2 `FITXES_BOTIGUES.txt:547-569` i triar la icona.
7. **M7.** Alta a Google Play Console (15 min, més els dies de verificació).
8. **M8.** A App Store Connect: acords, la clau de l'API i «New App» amb `org.socdepoble.app`.
9. **M9.** Claus d'API d'Apple i de Google, desades fora del repositori.
10. **M10.** La lease de Capacitor amb MarIA (`package.json` és governança).
11. **M11.** Clau de pujada d'Android, Xcode i la primera pujada de l'AAB.
12. **M12.** Poble de demostració i comptes de prova (cap agent crea comptes).
13. **M13.** Els qüestionaris, amb l'agent al costat.
14. **M14.** «Enviar a revisió».

**Per als agents:**
- **C1:** esmenar `FITXES_BOTIGUES.txt` amb les quatre diferències d'ací:
  - la URL de privacitat no funciona;
  - la promesa d'E2E;
  - el resum de la IP i el navegador;
  - la geolocalització d'imatges.
- **C2:** moderació i protecció de menors (2-3 dies). Depén de les decisions de B01 i B02.
- **C3:** pàgines legals noves (mig dia). Depén de M3.
- **C4:** generar les icones (MarIA o el Mestre).
- **C5:** el mòdul de metadades i els scripts de les API, al laboratori i amb proves. Depén de la tria de via.
- **C6 i C7:** la lease i l'entrada nativa amb el selector de poble.
- **C8:** les captures definitives.
- **C9:** les pujades, amb un sí per a cadascuna.
- **C10:** les pantalles al navegador integrat, amb el Mestre present.

**Camí crític:** M1 → M2 (titular i D-U-N-S) → M7 i M8 → M9 → lease → entrada nativa → pujades. En paral·lel: moderació, legals i la URL de privacitat.

**Estimació honesta:** no es pot enviar res a revisió abans d'unes dues setmanes de treball efectiu, més els dies de verificació de Google i, si cal, del D-U-N-S, més 3-7 dies per cada rebuig d'Apple.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Abast i mètode**
- Recerca de només lectura feta per un subagent, contrastant cada document dels laboratoris LAB1 i LAB2 amb el codi present al disc.
- Ordres de lectura usades: `ls` de l'arrel, de `public/`, `scripts/`, `tests/` i `release/`; `grep` de Capacitor, OAuth, moderació i geolocalització a `src/` i `supabase/`; lectura de `package.json`, del manifest, de `vite.natiu.config.js` i de `legalContent.js`.
- Tot el que porta [V] s'ha comprovat així.

**Comprovació en viu**
- La URL de privacitat s'ha comprovat al navegador integrat, sense sessió i en una pestanya de fons tancada en acabar.
- `/legal` i `/page/legal` donen «No s'ha trobat» a producció.

**Lectures sensibles, declarades per transparència**
- Per a localitzar el pagament a Apple, el subagent va llegir tres línies dels extractes bancaris de `../_gestoria_de_poble`.
- No se'n reproduïx cap número de compte, cap saldo ni cap import en este document.
- No s'ha llegit `90_arxiu_historic`.

**Cap acció externa**
- No s'ha entrat en cap compte ni consola.
- No s'ha enviat cap formulari.
- No s'ha creat, mogut ni esborrat cap fitxer, tret d'este informe.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Les polítiques de les botigues** (guies d'Apple, polítiques de Play, quotes, prova tancada de 12 testers, DSA, qüestionaris d'edat) venen del coneixement fins a mitjan 2026 i estan [NO VERIFICAT] amb el text vigent. Cal comprovar-les abans de cada enviament.
- **El titular legal i el D-U-N-S** no es poden deduir del disc. Els documents es contradiuen (organització o persona física).
- **Proves de LAB1:** no s'han tornat a executar (les 15 de 16 verdes de `FASE_PRELEASE_FETA.txt:468-481` són d'aquell moment).
- **Automatització real de les consoles:** no es pot fer des d'esta sessió. Claude in Chrome està denegat pel hook i les consoles necessiten la sessió del Mestre. La via possible és el navegador integrat amb el Mestre present, o les API amb claus que el Mestre cree.
- **Text legal (`legalContent.js`):** té contradiccions amb l'app i publica dades personals del responsable en un apartat que diu que estan protegides (`:28-29` contra `:71`). No les reproduïsc. Cal una revisió amb ordre del Mestre i assessorament. `requires_human_decision: true`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261008_1355_auditoria_claude]]
