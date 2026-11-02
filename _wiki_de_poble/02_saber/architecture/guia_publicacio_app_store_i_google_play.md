---
type: protocol
status: actiu
visibility: private
description: Textos per a copiar a App Store Connect i Google Play Console, respostes de privacitat deduïdes del codi, captures i passos pendents del Mestre.
tags:
  - maquina
  - legal
---
# Guia de publicació a l'App Store i a Google Play

Esta guia reunix el que cal copiar i enganxar per a pujar l'App de Sóc de Poble a les dues botigues, en valencià, castellà i anglés. Cada resposta de privacitat cita el fitxer que la justifica, i el que no s'ha verificat diu «No verificat». Els blocs per a copiar només porten el que s'ha verificat; el que encara s'ha de provar va apart, sota «Per verificar abans d'enviar». És un dossier intern i no es publica a la Wiki de l'App. La fa servir el Mestre en publicar, i qui toque dades o permisos de l'App.

## 1. Estat verificat i abast

- **Tall:** repositori a la branca `backup-notes-publish` amb HEAD `921c332ac` (2 de novembre de 2026), on valen totes les cites de línia, i producció de `https://socdepoble.org`, consultada l'1 de novembre de 2026. Les seccions 6.3 (identificadors del dispositiu) i 14.4 descriuen, a més, l'arbre viu del 2 de novembre sense commit (avisos push de la marató 261101_2143): `src/config/avisosPushXat.js`, `motiuPushNatiu` de `src/natiu/avisosPushNatius.js` i la secció «Funció `notifica-xat`» de `supabase/README.md` encara no són a cap commit. També són de l'arbre viu, amb la 2.3 esmenada de la marató (B10C legal, sense commit), les cites de `legalContent.js` de la secció 6.2 (`:132-138` i `:157-162`) i de l'apartat 13 (`:153`, a les seccions 6.2 i 14.1): a `921c332ac` l'apartat 11 portava encara la vinyeta dels proveïdors d'IA i l'apartat 13 queda una línia més avall. La resta de cites de `legalContent.js` valen igual als dos. També descriuen l'arbre viu sense commit (B9, marató 261101_2143) el pas 3 de la secció 14.2, el pas 1 de la secció 14.3 i el bloc «Obrir una botiga a `/page/descarregues`», amb la cita `PageDetailSection.descarregues.test.jsx:211`: a `921c332ac` i a `333af8c2c` els scripts de pujada encara no tenen `--canal`, no hi ha el registre `pujades.jsonl` ni la guarda `frasesCaducades`, i la línia 211 és una altra prova.
- **Identificador de l'App:** `org.socdepoble.app` a `capacitor.config.json`, `android/app/build.gradle` i el projecte d'Xcode.
- **Versions al repositori:** Android `versionCode 2` i `versionName "1.0.0"`; iOS `MARKETING_VERSION = 1.0.0` i `CURRENT_PROJECT_VERSION = 2`.
- **Fora d'esta guia:** compilar, signar i pujar binaris (`scripts/botigues/`), que són passos del Mestre (secció 14).
- **IDs del Llibre Mestre:** les entrades P0-18, P0-19 i P1-13 conserven el seu significat històric; esta guia és la T6 del prompt de la marató del 261101.

## 2. Dades fixes de les dues fitxes

| Camp | Valor | On es comprova |
| --- | --- | --- |
| Nom de l'App | Sóc de Poble | `ios/App/App/Info.plist` (CFBundleDisplayName) |
| Política de privacitat | `https://socdepoble.org/legal` | `src/config/sections.js:56`; en producció, 200 amb la descripció de privacitat |
| URL de suport | `https://socdepoble.org/legal` | Apartat 1 de la pàgina, amb el correu públic del projecte (`src/sections/text/legalContent.js:33`) |
| URL de màrqueting (opcional a Apple) | `https://socdepoble.org/projecte` | En producció, 200 |
| URL per a esborrar el compte (Google) | `https://socdepoble.org/legal#esborra-compte` | `src/sections/text/legalContent.js:182`; l'àncora és al paquet de producció |
| Correu de contacte de la fitxa | El correu públic de l'apartat 1 de `/legal` | Cap correu personal |
| Drets del contingut (Apple) | L'App mostra contingut que publiquen les persones usuàries | Normes a l'apartat 3 de `/legal` |
| Xifratge (Apple) | `ITSAppUsesNonExemptEncryption = false` | `ios/App/App/Info.plist:44` |

- **Llengües de la fitxa:** català (`ca`) per als textos en valencià, castellà (`es-ES`) i anglés (`en-GB` o `en-US`); la llengua principal la tria el Mestre.
- **Categoria proposada:** a Apple, «Social Networking» de principal i «News» de secundària; a Google, «Social». És una proposta, no una decisió.

## 3. Textos d'App Store Connect

La regla 2.3.10 d'Apple no admet noms d'altres plataformes mòbils a les metadades: estos textos no en nomenen cap. Les paraules clau van separades per comes sense espais, perquè Apple compta octets (secció 5).

### 3.1 Valencià (ca)

Nom:

```text
Sóc de Poble
```

Subtítol:

```text
La xarxa veïnal del teu poble
```

Text promocional:

```text
El mur, el xat, el mercat i el calendari del teu poble en una sola app, sense publicitat i sense rastreig.
```

Descripció:

```text
Sóc de Poble és la xarxa del teu poble: el lloc on el veïnat, les associacions, els comerços i l'ajuntament compartixen el que passa al municipi.

Què hi trobaràs:
• Mur: les publicacions, els avisos i les notícies del poble.
• Xat: converses amb el veïnat, amb fotos, vídeos i notes de veu.
• Mercat: anuncis entre veïns per a vendre, comprar o intercanviar.
• Calendari: l'agenda de festes, actes i activitats.
• Pobles: la fitxa de cada municipi, amb la seua gent i les seues entitats.
• Bloc de notes: les teues notes privades.

Per a publicar, xatejar o seguir persones i entitats, crea un compte o entra amb el que ja tens.

Les teues dades, sense lletra menuda:
• Sense publicitat i sense rastreig.
• Si una foto porta la ubicació, abans de publicar-la pots llevar-la o reduir-ne la precisió.
• Des de Perfil › Privacitat i dades pots descarregar una còpia de les teues dades i donar-te de baixa.

L'app parla valencià, castellà, anglés, basc i gallec.

Sóc de Poble naix a la Torre de les Maçanes, a l'Alacantí.
```

Paraules clau:

```text
veïnat,xat,mur,mercat,agenda,rural,municipi,ajuntament,associacions,notícies,comarca
```

### 3.2 Castellà (es-ES)

Nom:

```text
Sóc de Poble
```

Subtítol:

```text
La red vecinal de tu pueblo
```

Text promocional:

```text
El muro, el chat, el mercado y el calendario de tu pueblo en una sola app, sin publicidad y sin rastreo.
```

Descripció:

```text
Sóc de Poble es la red de tu pueblo: el lugar donde el vecindario, las asociaciones, los comercios y el ayuntamiento comparten lo que pasa en el municipio.

Qué encontrarás:
• Muro: las publicaciones, los avisos y las noticias del pueblo.
• Chat: conversaciones con el vecindario, con fotos, vídeos y notas de voz.
• Mercado: anuncios entre vecinos para vender, comprar o intercambiar.
• Calendario: la agenda de fiestas, actos y actividades.
• Pueblos: la ficha de cada municipio, con su gente y sus entidades.
• Bloc de notas: tus notas privadas.

Para publicar, chatear o seguir a personas y entidades, crea una cuenta o entra con la que ya tienes.

Tus datos, sin letra pequeña:
• Sin publicidad y sin rastreo.
• Si una foto lleva la ubicación, antes de publicarla puedes quitarla o reducir su precisión.
• Desde Perfil › Privacidad y datos puedes descargar una copia de tus datos y darte de baja.

La app habla valenciano, castellano, inglés, euskera y gallego.

Sóc de Poble nace en La Torre de les Maçanes, en l'Alacantí.
```

Paraules clau:

```text
vecinos,chat,muro,mercado,agenda,rural,municipio,ayuntamiento,asociaciones,noticias,comarca
```

### 3.3 Anglés (en)

Nom:

```text
Sóc de Poble
```

Subtítol:

```text
Your village's local network
```

Text promocional:

```text
Your village's wall, chat, market and calendar in one app, with no ads and no tracking.
```

Descripció:

```text
Sóc de Poble is your village's network: the place where neighbours, associations, local shops and the town council share what is happening in town.

What you will find:
• Wall: posts, notices and news from your village.
• Chat: conversations with your neighbours, with photos, videos and voice notes.
• Market: listings between neighbours to sell, buy or swap.
• Calendar: the schedule of festivals, events and activities.
• Towns: a page for each town, with its people and its organisations.
• Notebook: your private notes.

To post, chat or follow people and organisations, create an account or sign in with the one you already have.

Your data, no small print:
• No ads and no tracking.
• If a photo carries its location, you can remove it or lower its precision before posting.
• From Profile › Privacy and data you can download a copy of your data and close your account.

The app speaks Valencian, Spanish, English, Basque and Galician.

Sóc de Poble was born in La Torre de les Maçanes, in l'Alacantí.
```

Paraules clau:

```text
neighbours,village,chat,wall,market,events,rural,town,council,community,local news
```

### 3.4 Per verificar abans d'enviar

Els blocs de dalt només diuen el que el codi demostra. La lectura sense compte no hi va: depén del servidor de producció i no s'ha provat en un dispositiu (secció 9). Si una prova amb el build que s'envia confirma que el Mur, els Pobles i el Calendari es lligen sense entrar, es pot posar esta frase al començament del paràgraf «Per a publicar…» de cada descripció:

```text
Pots llegir el contingut públic sense crear cap compte.
```

```text
Puedes leer el contenido público sin crear ninguna cuenta.
```

```text
You can read public content without an account.
```

I estos textos promocionals poden substituir els de dalt:

```text
El mur, el xat, el mercat i el calendari del teu poble en una sola app. Pots llegir sense compte, sense publicitat i sense rastreig.
```

```text
El muro, el chat, el mercado y el calendario de tu pueblo en una sola app. Puedes leer sin cuenta, sin publicidad y sin rastreo.
```

```text
Your village's wall, chat, market and calendar in one app. Read without an account, with no ads and no tracking.
```

Amb estes frases, els recomptes canvien com diu la secció 5.

## 4. Textos de Google Play Console

El títol és el mateix nom de l'App. La descripció completa és, en cada llengua, la mateixa descripció de la secció 3: no nomena cap altra plataforma.

### 4.1 Valencià (ca)

Títol:

```text
Sóc de Poble
```

Descripció breu:

```text
El mur, el xat, el mercat i el calendari del teu poble, sense publicitat.
```

Descripció completa: la de la secció 3.1.

### 4.2 Castellà (es-ES)

Títol:

```text
Sóc de Poble
```

Descripció breu:

```text
El muro, el chat, el mercado y el calendario de tu pueblo, sin publicidad.
```

Descripció completa: la de la secció 3.2.

### 4.3 Anglés (en)

Títol:

```text
Sóc de Poble
```

Descripció breu:

```text
Your village's wall, chat, market and calendar, with no ads or tracking.
```

Descripció completa: la de la secció 3.3.

## 5. Recompte de caràcters

Comptats amb un script de Node sobre els textos d'esta guia: els caràcters són punts de codi (`[...text].length`) i els octets, UTF-8 (`Buffer.byteLength`). Apple limita les paraules clau i les notes de revisió en octets, no en caràcters.

| Botiga | Camp | Límit | ca | es | en |
| --- | --- | --- | --- | --- | --- |
| Apple | Nom | 30 caràcters | 12 | 12 | 12 |
| Apple | Subtítol | 30 caràcters | 29 | 27 | 28 |
| Apple | Text promocional | 170 caràcters | 106 | 104 | 87 |
| Apple | Descripció | 4.000 caràcters | 1.019 | 1.028 | 1.008 |
| Apple | Paraules clau | 100 octets | 86 | 91 | 82 |
| Apple | Notes de revisió (secció 11) | 4.000 octets | | | 1.199 |
| Google | Títol | 30 caràcters | 12 | 12 | 12 |
| Google | Descripció breu | 80 caràcters | 73 | 74 | 72 |
| Google | Descripció completa | 4.000 caràcters | 1.019 | 1.028 | 1.008 |

- **Amb les frases de la secció 3.4:** text promocional de 132, 128 i 112 caràcters, i descripció de 1.075, 1.087 i 1.056.
- **Amb les dues frases per verificar de la secció 11:** notes de 1.451 octets.
- Cap paraula clau té menys de tres caràcters, com demana Apple.
- Si es retoca un text, cal tornar-lo a comptar: les lletres amb accent ocupen dos octets a les paraules clau.

## 6. Formulari Data Safety de Google Play

Les definicions són les de Google: «recollir» és transmetre dades fora del dispositiu, i «compartir» és passar-les a un tercer que no és un proveïdor de servei. L'App no porta cap SDK d'analítica, d'errors ni de publicitat (`package.json`, dependències).

### 6.1 Recollida, seguretat i eliminació

| Pregunta | Resposta | Evidència |
| --- | --- | --- |
| L'App recull o compartix dades dels tipus exigits? | Sí | Taula de la secció 6.2 |
| Totes les dades es xifren en trànsit? | Sí | `vite.natiu.config.js:250` (el binari para sense un Supabase `https`); `capacitor.config.json` (`androidScheme: https`, `allowMixedContent: false`) |
| Hi ha manera de demanar l'eliminació de les dades? | Sí | Dins de l'App (secció 8) i per correu (`legalContent.js:182`) |
| URL per a esborrar el compte | `https://socdepoble.org/legal#esborra-compte` | Explica els dos camins, què s'esborra, què es conserva i els terminis |
| Es poden esborrar dades sense esborrar el compte? | Sí, en part | Notes (`src/data/supabase/notes.js:261`); la resta de continguts, No verificat |
| Comptes que es poden crear | Correu i contrasenya; Apple a iOS i Google, quan estiguen actius (secció 9) | `src/data/supabase/auth.js:522`, `:639`; `src/natiu/entradaSocial.js:41` |

### 6.2 Tipus de dades recollides

Cap tipus es compartix: Supabase, Sollutia i Google Workspace són encarregats del tractament per contracte (`legalContent.js:132-138`), i la IAIA MarIA de l'aplicació no envia el que li escrius a cap proveïdor d'intel·ligència artificial: respon al dispositiu (`legalContent.js:157-162`; `src/data/iaiaLocal.js:43-44`; la guarda és `src/sections/text/legal.iaia.test.js`). Amb compte, la pregunta al xat de la IAIA es publica al xat públic de la seua pàgina (fila «Activitat › Altre contingut generat»). A l'App nativa no hi ha «Vore mapa» i no es connecta a OpenStreetMap (`legalContent.js:242`; `src/sections/mur/MapaFotografic.jsx:842`). Només l'historial de cerques podria marcar-se com a processat de manera efímera, i només amb la comprovació de la secció 14.1.

| Categoria › tipus | Obligatori o opcional | Finalitats | Evidència |
| --- | --- | --- | --- |
| Informació personal › Nom | Obligatori (pot ser un pseudònim) | Funcionalitat; gestió del compte | `legalContent.js:96`; `src/data/supabase/perfils.js:101` |
| Informació personal › Adreça electrònica | Obligatori | Funcionalitat; gestió del compte; frau, seguretat i compliment | `legalContent.js:95` i `:101` (empremta per a la prova del consentiment) |
| Informació personal › Identificadors d'usuari | Obligatori | Funcionalitat; gestió del compte; frau, seguretat i compliment | `legalContent.js:95` (identificador d'Apple o Google); `src/data/supabase/moderacio.js:106` |
| Ubicació › Ubicació aproximada | Opcional | Funcionalitat | `src/components/universal/enquadrament/geolocalitzacio.js:14-20` (precisions «100m» i «poble»); la política ho diu a `legalContent.js:98` (apartat 8) i `:153` (apartat 13) |
| Ubicació › Ubicació precisa | Opcional | Funcionalitat | `geolocalitzacio.js:28` (precisió «exacta» de sèrie a les fotos de publicació); `src/utils/imageUtils.js:17-30`; la política ho diu a `legalContent.js:98` (apartat 8) i `:153` (apartat 13) |
| Missatges › Altres missatges a l'App | Opcional | Funcionalitat | `legalContent.js:97`, `:124`; el xifratge d'extrem a extrem encara no és actiu (`src/data/supabase/xatXifrat.js:9-13`) |
| Fotos i vídeos › Fotos | Opcional | Funcionalitat | `src/data/xatMultimedia.js:18-22`; foto de perfil (`legalContent.js:96`) |
| Fotos i vídeos › Vídeos | Opcional | Funcionalitat | `xatMultimedia.js:20` |
| Fitxers d'àudio › Gravacions de veu o so | Opcional | Funcionalitat | `xatMultimedia.js:21` (notes de veu del xat) |
| Contactes | Opcional | Funcionalitat | Seguiments, el graf social de l'App (`legalContent.js:99`; `src/data/supabase/seguiments.js:118`). Decisió del Mestre (secció 14.1) |
| Activitat › Altre contingut generat | Opcional | Funcionalitat; frau, seguretat i compliment | Publicacions, notes, consultes a la IAIA MarIA i denúncies (`legalContent.js:97`, `:102`, `:105`) |
| Activitat › Altres accions | Opcional | Funcionalitat; frau, seguretat i compliment | Bloquejos i acceptació de les normes (`moderacio.js:149`, `:216`) |
| Activitat › Historial de cerques a l'App | Opcional | Funcionalitat | La cerca del directori va dins de la URL de PostgREST, una paraula per filtre `ilike` (`src/data/supabase/organizations.js:212-220` i `:254-259`), i la de membres del xat, dins de la crida `membres_del_poble` (`src/data/supabase/xat.js:825-828`). Google demana declarar-la encara que el tractament siga efímer. Processat de manera efímera: Sí només si es confirma que ni l'API ni els registres de Supabase guarden la consulta (secció 14.1); fins aleshores, No |

### 6.3 Dades que l'App no recull

- **Interaccions i analítica:** No. El build natiu para si porta Umami (`vite.natiu.config.js:261-262`) i la telemetria no envia res des de `localhost`, l'origen de l'App (`src/data/telemetria.js:145-153`, `:223`).
- **Registres d'errors i diagnòstics:** No. Cap SDK d'errors a `package.json`.
- **Identificadors del dispositiu:** No. El connector de push (`@capacitor/push-notifications`) no és a `package.json` i l'adaptador natiu només es registra amb la bandera `AVISOS_PUSH_XAT_ACTIUS` (apagada, `src/config/avisosPushXat.js`); sense el connector, diu `sense-connector` i no registra cap testimoni (`src/natiu/avisosPushNatius.js`, `motiuPushNatiu`). No hi ha identificador de publicitat.
- **Calendari:** No. Google Calendar no funciona dins de l'App (`vite.natiu.config.js:264-266`).
- **Fitxers i documents:** No. El xat només admet imatge, vídeo i veu (`xatMultimedia.js:18-22`).
- **Traduccions:** No ix cap text: el botó «Traduir» encara no traduïx dins de l'App nativa (`legalContent.js:243`).
- **Dades del SDK d'inici de sessió de Google:** No verificat. Cal contrastar la fitxa de Google Sign-In al Google Play SDK Index abans d'enviar el formulari.
- **Adreça IP i registres tècnics:** no són cap tipus del formulari; la política ho explica (`legalContent.js:100`).

## 7. Privacitat a l'App Store

### 7.1 Etiqueta de privacitat

- **Dades per a rastrejar-te:** cap.
- **Dades vinculades a tu:** adreça electrònica, nom, identificador d'usuari, fotos o vídeos, dades d'àudio, altre contingut de l'usuari, correus o missatges de text, ubicació precisa, ubicació aproximada i contactes.
- **Finalitat de totes:** funcionalitat de l'App.
- **Dades no vinculades a tu:** cap.
- **Historial de cerques:** pendent. Per a Apple, «recollir» és guardar la dada més temps del que cal per a servir la petició en temps real. Si els registres de l'API de Supabase guarden la consulta (secció 14.1), cal afegir-lo a l'etiqueta, vinculat i per a funcionalitat, i també a `PrivacyInfo.xcprivacy`.
- **SDK de Google Sign-In 9.2.0:** el seu manifest declara nom, correu, telèfon i ubicació aproximada, només per a funcionalitat; identificador d'usuari i altres tipus de dades, per a funcionalitat i també per a analítica; i identificador del dispositiu i altres dades d'ús, només per a analítica. Hui no s'invoca a iOS (secció 9). Si s'encén Google a iOS, l'etiqueta les ha d'incloure, amb l'analítica on el manifest la declara.

### 7.2 Manifest de privacitat

`ios/App/App/PrivacyInfo.xcprivacy` passa `plutil -lint` i diu el mateix que l'etiqueta.

- **NSPrivacyTracking:** `false`, i **NSPrivacyTrackingDomains** buit.
- **NSPrivacyCollectedDataTypes:** els deu tipus de la secció 7.1, tots vinculats, sense rastreig i amb la finalitat `AppFunctionality`.
- **NSPrivacyAccessedAPITypes:** `UserDefaults` amb el motiu `CA92.1`. El necessita el connector `@capgo/capacitor-social-login`, que usa `UserDefaults.standard` i no porta manifest propi.
- **Codi propi de l'App:** el Swift de `ios/App/App/` i de l'extensió Compartir només llig `fileSizeKey`, que no és cap API amb motiu obligatori.
- **SDK amb manifest propi:** Capacitor i Cordova 8.5.3, GoogleSignIn 9.2.0, AppAuth 2.1.0, GTMAppAuth 5.0.0, GTMSessionFetcher 3.5.0, GoogleUtilities 8.1.5 i Promises 2.4.1. Xcode ajunta els seus manifests amb el de l'App en l'informe de privacitat.
- **AppCheckCore 11.3.2:** no porta manifest i guarda el seu testimoni de depuració amb `GULUserDefaults`; el motiu `CA92.1` de l'App ho cobrix.
- **On s'ha comprovat:** al `Package.resolved` del projecte i a les còpies dels paquets de DerivedData d'este Mac, l'1 de novembre de 2026.

## 8. Eliminació del compte dins de l'app

La regla 5.1.1(v) d'Apple i Google Play demanen que el compte es puga esborrar des de l'App. El camí real és este:

1. Entra amb el teu compte: l'App obri el Perfil (`src/config/rutaEntrada.js:28`). Des del Xat, també s'hi arriba tocant l'avatar de dalt (`src/sections/xat/components/ClosCaXat.jsx:349`).
2. Toca «Privacitat i dades» a la llista del Perfil (`TEXTOS_PRIVACITAT_LLISTA` a `src/sections/profile/perfilModel.js:133-136`). L'element es pinta en la llengua de la interfície (`src/sections/profile/PerfilShell.jsx:252-267`): «Privacidad y datos» en castellà i «Privacy and data» en anglés.
3. Baixa fins a «Donar-se de baixa» i toca «Donar-me de baixa» (`src/sections/profile/DetallPrivacitat.jsx:650`).
4. Confirma amb «Sí, donar-me de baixa» (`DetallPrivacitat.jsx:660`), que crida `demanaBaixa` (`src/data/supabase/compte.js:126`).

- **Tocs des del Perfil:** dos per a iniciar l'eliminació i un de confirmació.
- **Efecte:** el perfil s'amaga al moment, es tanquen totes les sessions i el compte s'esborra als 30 dies; amb Apple, fins a 7 dies més (`legalContent.js:121`).
- **Còpia de les dades:** a la mateixa pantalla (`compte.js:95`).
- **Condició:** l'apartat només ix si el servidor oferix la capacitat `compte` o `consentiment` (`src/sections/profile/PerfilShell.jsx:229-230`). No verificat en un dispositiu en este torn.

## 9. Inici de sessió i accés sense registre

- **Lectura sense compte:** el Mur, els Pobles, el Calendari i les pàgines es poden llegir sense entrar. Només dues rutes porten guarda de sessió, el Perfil i l'administració (`src/app/App.jsx:1044`, `:1106`); el Xat demana entrar per a conversar. No verificat en un dispositiu en este torn.
- **Correu i contrasenya:** `src/data/supabase/auth.js:522` (registre) i `:639` (entrada).
- **Sign in with Apple:** el dret `com.apple.developer.applesignin` és a `ios/App/App/App.entitlements`. Des de D-10 (pla 261101_1246), el botó d'Apple només ix a iOS si el build porta `VITE_APPLE_OAUTH_ACTIU=true` (`src/natiu/entrada.jsx:72`; `proveidorsDe`, `src/natiu/entradaSocial.js:41-46`). Sense el flag, o amb `false`, el botó no ix. El flag va a `.env.natiu.local` o al procés del build, mai a `.env.local`, que el build natiu no hereta. Un valor que no siga exactament `true` o `false` para el build (`errorsEntornNatiu`, `vite.natiu.config.js:280-282`).
- **Apple al servidor:** segons P0-03, P0-04 i P0-23 del Llibre Mestre, el proveïdor d'Apple de Supabase, la clau `.p8`, els secrets i la funció `compte-apple` estan pendents del Mestre. No verificat en viu en este torn.
- **Google a iOS:** apagat fins que hi haja els dos clients; `Info.plist:38` porta encara l'esquema de reserva `com.googleusercontent.apps.pendent` (P0-03).
- **Google a Android:** només si el build porta el client web (`entradaSocial.js:47`). Apple no s'oferix a Android (decisió D7), tampoc amb `VITE_APPLE_OAUTH_ACTIU=true`.
- **Regla 4.8 d'Apple:** amb el correu propi i Apple, es complix. Sense Apple, a iOS tampoc ix Google, encara que el build porte els dos clients: només queda el correu, i també es complix (`src/natiu/entradaSocial.js:44` i `src/config/entradaNativa.js:73`).
- **Bloquejant de revisió (resolt per D-10 a partir del build 2):** un botó d'Apple visible que falla al servidor és motiu de rebuig (regla 2.1). El build 1, ja pujat (P0-23), encara el mostra; des del build 2, el botó està amagat si no s'encén explícitament. Cal posar `VITE_APPLE_OAUTH_ACTIU=true` a `.env.natiu.local` només quan el proveïdor d'Apple estiga encés a Supabase (P0-03 i P0-04), i compilar un build nou. Sense el flag, la revisió veu el correu i prou.

## 10. Classificació d'edat i categories

- **Edat mínima de les condicions:** 16 anys, sense cap excepció amb el permís de la família, a la web i a les apps (`legalContent.js:51`, condicions 2.3, en vigor des de l'1 de novembre de 2026; dimensió D13 del pla 261101_1246, carril T8). Abans eren 14 anys. La guarda és `src/sections/text/legal.edat.test.js`.
- **Qüestionari d'Apple:** contingut generat per les persones usuàries, sí; missatgeria i xat, sí; publicitat, no; controls parentals i verificació d'edat, no.
- **Apple, sobreescriptura:** Apple diu que, si les condicions fixen una edat mínima superior a la calculada, «you must override to a rating that adheres to the requirements». Amb 16 anys a les condicions, la classificació de l'App Store és 16+: si el qüestionari en calcula una de menor (13+), cal sobreescriure-la a 16+.
- **Google (IARC):** declarar que les persones interactuen, que es compartix contingut generat i que es pot compartir la ubicació d'una foto.
- **Google, públic objectiu:** les franges de 16 i 17 anys i de 18 anys o més, sense cap franja infantil, coherent amb els 16 anys de les condicions.

## 11. Notes per als revisors

Per al camp «Notes» d'App Review Information i per a «Accés a l'aplicació» de Google Play. El compte de prova el crea el Mestre i les seues dades van als camps de credencials de cada consola, mai a este document.

```text
Sóc de Poble is a community app for small villages: a wall of local posts, chat, a market between neighbours and a calendar. It is the same service as https://socdepoble.org.

Demo account: the sign-in details are in the "Sign-in required" fields of this App Review Information section. Use them with email and password on the sign-in screen ("Sign in to your account").

Account deletion (Guideline 5.1.1(v)): sign in. The Profile screen opens right after signing in; it can also be reached from the avatar at the top of Chat. Tap "Privacy and data", scroll to "Close your account", tap "Close my account" and confirm with "Yes, close my account". The screen explains the grace period and what is deleted after it; our privacy policy (https://socdepoble.org/legal) states that the data are deleted within 30 days. The same screen offers a download of the user's data.

User-generated content (Guideline 1.2): every post, chat message, person and organisation page has a "⋮" menu to report it, also without an account; signed-in users can block a person or an organisation. Users accept the community rules before publishing.

Privacy: no advertising, no tracking and no analytics inside the app.
```

- **Etiquetes en anglés citades:** són les del diccionari anglés de l'App, `src/config/idiomes/en.js`, amb les claus `section.perfil.privacitat.pagina.titol`, `section.perfil.privacitat.baixa.titol`, `section.perfil.privacitat.baixa.boto` i `section.perfil.privacitat.baixa.confirma`. Es citen per clau perquè les línies del diccionari es mouen.
- **Baixa:** el bloc descriu la pantalla (`DetallPrivacitat.jsx:648-660`) i la política (`legalContent.js:121`), no el que fa el servidor, que no s'ha provat en este torn.
- **Analítica:** «no analytics inside the app» val mentre Google Sign-In no s'invoque a iOS; si s'encén, cal revisar la frase amb la secció 7.1.

Per verificar abans d'enviar, i fora del bloc fins que es verifique:

- **Accés sense compte:** si una prova amb el build que s'envia confirma la lectura sense entrar (secció 9), es pot posar este paràgraf darrere del primer:

```text
Access without an account: the Wall, the Towns pages, the Calendar and the information pages can be read without signing in. An account is only needed to post, chat or follow people and organisations.
```

- **Moderació:** només quan la revisió de denúncies en 24 hores de l'apartat 3 de `/legal` funcione (P0-18), es pot posar esta frase al final del paràgraf «User-generated content»:

```text
Reports are reviewed by a person within 24 hours.
```

## 12. Captures i gràfics

### 12.1 Mides exigides hui

| Botiga | Dispositiu | Mides en píxels | Exigència |
| --- | --- | --- | --- |
| Apple | iPhone amb Dynamic Island, pantalla mitjana (6,1" i 6,3") | 1206 × 2622 o 1179 × 2556 | Obligatòria segons «Required device sizes» |
| Apple | iPhone amb Dynamic Island, pantalla gran (6,9" i 6,7") | 1320 × 2868, 1290 × 2796 o 1260 × 2736 | Recomanada: sense ella, la de 6,5" passa a ser obligatòria |
| Apple | iPhone amb Face ID, pantalla gran (6,5") | 1284 × 2778 o 1242 × 2688 | Obligatòria si falten les de pantalla gran amb Dynamic Island |
| Apple | iPad de 13" | 2064 × 2752 o 2048 × 2732 | Obligatòria: l'App funciona a l'iPad (`TARGETED_DEVICE_FAMILY = "1,2"`) |
| Apple | iPad Pro de 12,9" (2a generació) | 2048 × 2732 | Opcional: s'escala de la de 13" |
| Apple | iPhone Duo | 1398 × 2034 (exterior) i 2007 × 2853 (interior) | Obligatòria des d'abril de 2027 per a builds amb el SDK d'iOS 27.1 o posterior |
| Google | Telèfon | Entre 320 i 3840; el costat llarg, com a molt el doble del curt | De 2 a 8; per a les recomanacions, 4 de 1080 × 1920 o més |
| Google | Tauletes de 7" i 10" | Entre 1080 i 7680, en 16:9 o 9:16 | Opcionals |
| Google | Gràfic destacat | 1024 × 500, JPEG o PNG de 24 bits sense alfa | Obligatori |
| Google | Icona | 512 × 512, PNG de 32 bits amb alfa, 1024 KB com a molt | Obligatòria |

- **Apple:** d'1 a 10 captures per mida, en JPEG o PNG, sense canal alfa.
- **Contradicció de la font:** la pàgina d'Apple demana la pantalla mitjana com a obligatòria i, alhora, diu que la de 6,5" ho és si falten les grans. Pujar les tres mides d'iPhone de la taula evita el dubte.

### 12.2 Captures existents

- **Les de `04_escriptori/01_produccio/261101_025*_captura_sistema_*`:** són captures d'escriptori de 1024 × 881. No valen per a cap casella de cap botiga: ni proporció de telèfon ni el mínim de 1080 de les tauletes.
- **El bàner del connector (`wordpress-plugin/assets/banner-1544x500.png`):** sí que val per al gràfic destacat, reescalat i farcit amb el seu verd (`#00662E`).
- **La icona (`public/icona-app-512.png`):** 512 × 512 en RGB sense alfa; cal passar-la a RGBA si Google la rebutja.

### 12.3 Comandes

Les captures noves es fan al simulador amb l'App instal·lada, una per pantalla (Mur, Xat, Pobles, Calendari, Perfil). Els fitxers van a l'Escriptori del Mac, fora del repositori i sense carpetes noves.

```bash
xcrun simctl list devices available | grep -E "iPhone 18 Pro|iPad Pro 13-inch"
UDID=$(xcrun simctl list devices available | grep -m1 "iPhone 18 Pro Max (" | grep -oE "[0-9A-F]{8}(-[0-9A-F]{4}){3}-[0-9A-F]{12}")
xcrun simctl boot "$UDID"
open -a Simulator
xcrun simctl io booted screenshot --type=png --mask=ignored ~/Desktop/sdp-iphone-gran-01-mur.png
sips -g pixelWidth -g pixelHeight -g hasAlpha ~/Desktop/sdp-iphone-gran-01-mur.png
xcrun simctl shutdown booted
```

L'UDID és propi de cada Mac: la segona línia el trau de la llista de simuladors instal·lats, perquè `simctl boot` demana l'UDID, i la resta de comandes usen `booted`. Repetix el mateix canviant el nom del `grep -m1` per «iPhone 18 Pro (» (pantalla mitjana) i per «iPad Pro 13-inch (M5) (». Si una captura no ix exactament a una mida acceptada, ajusta-la i lleva-li l'alfa:

```bash
sips -z 2868 1320 ~/Desktop/sdp-iphone-gran-01-mur.png --out ~/Desktop/sdp-iphone-gran-01-mur-1320x2868.png
sips -z 2622 1206 ~/Desktop/sdp-iphone-mitja-01-mur.png --out ~/Desktop/sdp-iphone-mitja-01-mur-1206x2622.png
sips -s format jpeg -s formatOptions 92 ~/Desktop/sdp-iphone-gran-01-mur-1320x2868.png --out ~/Desktop/sdp-appstore-iphone-gran-01-mur.jpg
```

Per a Google, la captura de l'iPhone és massa llarga (2868 / 1320 passa del doble). Es reescala a 1080 d'ample i es retalla des de dalt a 1920 d'alt. El retall el fa Python, com la icona de més avall: `sips -c` amb `--cropOffset 0 0` retalla pel centre i perd la capçalera de l'App, i amb un altre desplaçament perd una fila o una columna.

```bash
sips --resampleWidth 1080 ~/Desktop/sdp-iphone-gran-01-mur.png --out ~/Desktop/sdp-play-tmp.png
python3 -c "from PIL import Image; Image.open('$HOME/Desktop/sdp-play-tmp.png').crop((0, 0, 1080, 1920)).convert('RGB').save('$HOME/Desktop/sdp-play-telefon-01-mur.png')"
sips -s format jpeg -s formatOptions 92 ~/Desktop/sdp-play-telefon-01-mur.png --out ~/Desktop/sdp-play-telefon-01-mur.jpg
```

Per a les tauletes de Google, des d'una captura horitzontal de l'iPad, reescalada a 1440 d'alt i farcida a 16:9:

```bash
sips --resampleHeight 1440 ~/Desktop/sdp-ipad-horitzontal-01-mur.png --out ~/Desktop/sdp-play-tmp.png
sips -p 1440 2560 --padColor 00662E ~/Desktop/sdp-play-tmp.png --out ~/Desktop/sdp-play-tauleta-01-mur.png
sips -s format jpeg -s formatOptions 92 ~/Desktop/sdp-play-tauleta-01-mur.png --out ~/Desktop/sdp-play-tauleta-01-mur.jpg
```

Gràfic destacat i icona de Google, des de l'arrel del repositori:

```bash
sips --resampleWidth 1024 wordpress-plugin/assets/banner-1544x500.png --out ~/Desktop/sdp-play-tmp.png
sips -p 500 1024 --padColor 00662E ~/Desktop/sdp-play-tmp.png --out ~/Desktop/sdp-play-grafic.png
sips -s format jpeg -s formatOptions 92 ~/Desktop/sdp-play-grafic.png --out ~/Desktop/sdp-play-grafic-destacat-1024x500.jpg
python3 -c "from PIL import Image; Image.open('public/icona-app-512.png').convert('RGBA').save('$HOME/Desktop/sdp-play-icona-512.png')"
```

- **Provades en este torn:** totes estes comandes s'han executat sobre imatges de prova de les mateixes mides, i n'ixen les mides de la taula, sense alfa. Del retall de Google també s'ha comprovat el contingut: amb una franja marcada a les files de dalt de la captura, el retall la conserva sencera.
- **Revisió visual:** el retall de 1920 deixa fora la part de baix de la pantalla (unes 426 files després de reescalar); cal mirar cada captura abans de pujar-la.

## 13. Android App Links i /.well-known

- **Producció hui:** `https://socdepoble.org/.well-known/assetlinks.json` torna `[]`, i `apple-app-site-association` torna `{"applinks":{"apps":[],"details":[]}}`, amb `cache-control: private, no-store`. Són els fitxers que genera Firebase Hosting amb `appAssociation` en `AUTO`, el valor per defecte.
- **Què fa AUTO:** l'API de Firebase Hosting diu que els fitxers «will be automatically created from the apps that exist in the Firebase project», fora del repositori.
- **Què fa NONE:** cap tractament especial; sense fitxer propi, eixes rutes donen 404.
- **Decisió:** `firebase.json` porta ara `"appAssociation": "NONE"`. Després del pròxim desplegament, les dues rutes de `/.well-known/` tornaran 404 fins que hi haja empremtes reals, i `/apple-app-site-association` de l'arrel tornarà l'SPA, com qualsevol ruta desconeguda.
- **L'App no reclama enllaços:** cap intent-filter amb `android:autoVerify` a `AndroidManifest.xml` i cap domini associat a `App.entitlements` (`src/natiu/associacioDominis.test.js`).
- **Generador:** `tooling/vite/associacio-apps.mjs` emet `dist/.well-known/assetlinks.json` només amb empremtes a `scripts/botigues/associacio-apps.json` i només per a `https://socdepoble.org`. Arriba pel circuit de governança i cal registrar-lo a `vite.config.js`.
- **Forma exacta:** `relation` `delegate_permission/common.handle_all_urls`, `namespace` `android_app`, `package_name` `org.socdepoble.app` i `sha256_cert_fingerprints` en majúscules amb dos punts. Ho fixa `tooling/vite/associacio-apps.test.mjs`.

Per a encendre App Links calen, junts, estos passos:

1. Copiar l'empremta SHA-256 de la clau de signatura de Google Play Console (Integritat de l'app › Signatura de l'app) a `scripts/botigues/associacio-apps.json`.
2. Afegir a `AndroidManifest.xml` un intent-filter `autoVerify` per a `https://socdepoble.org`.
3. Fer que l'entrada nativa escolte l'enllaç rebut i hi navegue.
4. Actualitzar `src/natiu/associacioDominis.test.js`, construir, desplegar i comprovar l'enllaç amb `adb shell pm get-app-links org.socdepoble.app`.

## 14. Passos pendents del Mestre

### 14.1 Decisions comunes

1. Triar la llengua principal de cada fitxa i les categories (secció 2).
2. Confirmar «Contactes» al Data Safety i a l'etiqueta d'Apple pel graf de seguiments, o retirar-lo de les dues bandes i de `PrivacyInfo.xcprivacy`.
3. Fet (marató 261101_2143, T11-05): la ubicació, la data i les dades de la càmera de les fotos són a l'apartat 8 de `/legal` (`legalContent.js:98`), amb les dues etiquetes de la casella i que el fitxer d'una foto publicada és en un espai públic, i qui les veu, a l'apartat 13 (`:153`), dins de la versió 2.3; la guarda és `src/sections/text/legal.ubicacioFotos.test.js`, que llig el codi (i les apps natives, sense cap permís d'ubicació). Falta que el Mestre torne a construir i desplegue el web i, després, aplique `supabase/migrations/2611012257_politica_privacitat_2_3.sql`, que segella la 2.3 al servidor (pas 12 de l'ordre de `supabase/README.md`).
4. Mirar al tauler de Supabase si els registres de l'API guarden la URL o el cos de les peticions amb la consulta de cerca, i quant de temps. Si no la guarden, l'historial de cerques es marca com a efímer al Data Safety (secció 6.2). Si la guarden, a més, s'afig a l'etiqueta d'Apple (secció 7.1), a `ios/App/App/PrivacyInfo.xcprivacy` (`NSPrivacyCollectedDataTypeSearchHistory`, vinculat, sense rastreig i per a `AppFunctionality`) i a `TIPUS_DE_DADES` de `src/natiu/projecteIos.test.js`.
5. Crear el compte de prova per a les dues consoles, amb correu i contrasenya.
6. Posar en marxa la revisió real de denúncies en 24 hores (P0-18).
7. Desplegar el lloc web perquè `appAssociation: NONE` arribe a producció.
8. Amb el build que s'envia, fer en un dispositiu cada pas de les notes de la secció 11 i del camí de baixa de la secció 8, i comprovar que el Mur i els Pobles es lligen sense compte. Les frases de les seccions 3.4 i 11 que depenen d'eixa prova només s'afigen si passa.

### 14.2 App Store

1. Sign in with Apple: des del build 2, el botó està amagat per defecte (D-10). Si es vol oferir, cal encendre'l primer al servidor: proveïdor d'Apple a Supabase, clau `.p8`, secrets i funció `compte-apple` (P0-03 i P0-04). Després cal posar `VITE_APPLE_OAUTH_ACTIU=true` a `.env.natiu.local` abans del build.
2. Compilar un build nou amb un `CURRENT_PROJECT_VERSION` que no s'haja pujat mai (el build 1 ja està gastat, P0-23) i el paquet web del mateix commit.
3. Pujar-lo amb `scripts/botigues/puja-ios.mjs` després del `preflight.mjs`. Per a la botiga, amb el canal de producció (B9, marató 261101_2143): `node scripts/botigues/preflight.mjs --plataforma ios --canal produccio`, després `node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 2 --canal produccio --compila` (arxiva, exporta i verifica; el rebut porta el sha256 de l'IPA i el «sí» exacte) i, en una altra execució, `node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 2 --canal produccio --confirma=produccio:1.0.0+2@<els 12 primers del sha256 del rebut>`. A iOS, intern i producció són la mateixa pujada: no cal cap grup de TestFlight ni cap provador, però Apple processa tota build i l'App Review és l'únic camí a la botiga. El script només puja; adjuntar la build a la versió, «Publicació de la versió: manual» i «Envia a App Review» són del Mestre (punts P9 i S6 de `RUNBOOK_BOTIGUES_IA.txt`, al laboratori `_investigacio_ia_de_poble/261003_1330_empaquetat_mobil_claude/`, fora del repositori). Si la build ja s'ha pujat al canal intern, no se'n puja una altra: s'adjunta la mateixa a la versió (el registre `SDP_BUILDS_DIR/pujades.jsonl` ho para).
4. Omplir la fitxa amb les seccions 2, 3 i 5, l'etiqueta de la secció 7.1 i el qüestionari d'edat de la secció 10. Abans de publicar els textos de la secció 3 amb les frases de la 3.4, comprovar en un dispositiu que el Mur i els Pobles es lligen sense compte.
5. Pujar les captures de la secció 12 i omplir les notes de la secció 11 amb el compte de prova.
6. Respondre la conformitat de xifratge: només xifratge exempt, com diu `Info.plist`.
7. Enviar a revisió.

### 14.3 Google Play

1. Signar l'AAB amb la clau de pujada i pujar-lo amb `scripts/botigues/puja-android.mjs`, primer a la pista de proves. Per a la pista de producció (B9, marató 261101_2143), sempre en esborrany: `node scripts/botigues/preflight.mjs --plataforma android --canal produccio` (exigix `SDP_BUILDS_DIR`, on viu el registre de pujades). Opció A, per defecte (signa el Mestre a Android Studio › Build › Generate Signed Bundle): `node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 2 --canal produccio` en sec, que amb l'AAB signat el verifica en local i dona el rebut amb el sha256 i el «sí» exacte; després `node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 2 --canal produccio --confirma=produccio:1.0.0+2@<els 12 primers del sha256 del rebut>`. Opció B (signa el script amb les claus del fitxer d'entorn): la mateixa ordre amb `--compila` dona el rebut i el «sí», i el «sí» va en una altra execució. Comprovació a mà, si cal: `shasum -a 256 android/app/build/outputs/bundle/release/app-release.aab | cut -c1-12`. El script mai no escriu `completed` ni fa cap desplegament per fases: «Envia a revisió» a Play Console › Production és del Mestre (P9 del RUNBOOK de botigues citat a la secció 14.2). Un compte personal no pot publicar a producció fins que passa el pas 2 (o amb un compte d'organització, D-B9-2): fins llavors, `--validate_only` para amb l'eixida 8 i no es puja res.
2. Completar la prova tancada que demana Play per a comptes personals nous (P0-23: 12 provadors durant 14 dies).
3. Omplir la fitxa amb les seccions 2, 4 i 5 i el gràfic destacat i la icona de la secció 12. Abans de publicar la descripció completa amb la frase de la secció 3.4, comprovar en un dispositiu que el Mur i els Pobles es lligen sense compte.
4. Omplir el Data Safety amb la secció 6 i l'URL per a esborrar el compte.
5. Respondre el qüestionari IARC i el públic objectiu de la secció 10.
6. Donar les credencials de prova a «Accés a l'aplicació».
7. Copiar l'empremta de la clau de signatura de Play si es vol encendre App Links (secció 13).
8. Enviar a producció.

**Obrir una botiga a `/page/descarregues` (B9, annex B pas 5 de la spec B9-BOTIGUES).** Tot en un sol commit:

1. La URL pública a la línia del canal de `src/config/canalsDeBotiga.js`.
2. El text de `PAGE_COPY.descarregues` reescrit amb l'annex A, i `node tooling/gates/frontissa-contingut.mjs --aprova descarregues --per Mestre`. La guarda `frasesCaducades` de `canalsDeBotiga.test.js` diu quines frases sobren, i el missatge de la prova diu què cal fer.
3. Les proves que cauen. L'autoritat és esta comanda, no els números de línia:

   `npx vitest run src/config/canalsDeBotiga.test.js src/config/systemPages.test.js src/sections/detail/PageDetailSection.descarregues.test.jsx src/sections/detail/InstalaLaPwa.test.jsx src/app/App.descarregues.test.jsx --maxWorkers=2`

   Simulacre del 2026-11-02 a les 04:55, en una còpia aïllada, amb només Google Play obert i el text sense reescriure: en cauen **16 de 74**.
   - **12 a `PageDetailSection.descarregues.test.jsx`:** els escenaris que esperen només WordPress.org a les zones d'acció, i «una botiga oberta…», que comprova que la ranura està tancada abans d'obrir-la.
   - **2 a `canalsDeBotiga.test.js`:** la llista de canals oberts i la guarda.
   - **1 a `InstalaLaPwa.test.jsx`:** «hui, només WordPress.org».
   - **1 a `src/config/systemPages.test.js`:** l'honestedat del cos (`:256` i `:257`).
   - `App.descarregues.test.jsx` no en perd cap.

   Quan es reescriga el text, canvien també:
   - les cinc línies de la guarda que mosseguen el text d'avui;
   - `systemPages.test.js:266` i `:281`, si se suprimix l'apartat de TestFlight (només amb l'App Store oberta);
   - `PageDetailSection.descarregues.test.jsx:211` (l'`h4` «Apple TestFlight»).

El botó ja diu «Disponible a Google Play» o «Disponible a l'App Store» en les cinc llengües.

### 14.4 Avisos push natius (APNs i FCM), quan el Mestre ho aprove

Esta nit no s'ha instal·lat res (D-B8C-3). L'App ja porta l'adaptador, darrere de la bandera i sense connector: no ensenya cap interruptor fins al pas 3. El servidor (migració, secrets, funció `notifica-xat` i encesa) va primer, en l'ordre de `supabase/README.md` (secció «Funció `notifica-xat`»).

1. **Connector:** comprovar quina 8.x és compatible amb `@capacitor/core` 8.5.3 i instal·lar-la exacta:

   ```bash
   npm view @capacitor/push-notifications@8 version
   npm install --save-exact @capacitor/push-notifications@<la 8.x que ha tornat la comanda anterior>
   npx cap sync
   ```

2. **Plataformes:**
   - **Android:** crear el projecte de Firebase i posar `android/app/google-services.json` (el `build.gradle` ja aplica el connector de Google si el fitxer hi és). El canal `xat` el crea l'App amb el primer avís local; fins llavors, un push de FCM amb `channel_id: xat` cau al canal per defecte del sistema.
   - **iOS:** activar «Push Notifications» a l'App ID del portal d'Apple, fer un perfil nou, posar `aps-environment` = `production` a `ios/App/App/App.entitlements` i afegir a `AppDelegate.swift` els dos delegats que demana el connector (`didRegisterForRemoteNotificationsWithDeviceToken` i `didFailToRegisterForRemoteNotificationsWithError`). La clau `.p8` d'APNs va als secrets de la funció (`supabase/README.md`, secció «Funció `notifica-xat`»).
3. **Bandera:** `src/config/avisosPushXat.js` → `export const AVISOS_PUSH_XAT_ACTIUS = true;` (el mateix pas que encén la web). Després, el build natiu.
4. **Preflight de B9:** amb el connector, ha d'exigir `aps-environment = production`, `google-services.json` present (sense mostrar-ne el contingut) i els delegats d'APNs.
5. **Privacitat a les botigues (abans d'enviar):** el testimoni de push és un identificador del dispositiu. Cal canviar §6.3 i §7.1 d'esta guia (Data Safety: «Identificadors del dispositiu: Sí, per a la funcionalitat de l'App, no es compartix per a publicitat»; etiqueta d'Apple: «Device ID», vinculat, sense rastreig, `AppFunctionality`) i el `PrivacyInfo.xcprivacy`.
6. **Prova en un aparell de veres:**
   - activar des d'Ajustos del Xat → Notificacions;
   - rebre l'avís cec;
   - tocar-lo amb l'App tancada: ha d'obrir `/xat` i, si hi ha un sol fil no llegit, el fil. Este cas depén que el connector lliure el toc a l'oient que es registra en arrencar, i cal comprovar-ho al dispositiu;
   - tancar la sessió: l'aparell deixa de rebre avisos.
7. **Decisió pendent (R12 de l'especificació B8-SERVIDOR de la marató 261101_2143):** sense gest, l'App no torna a desar el testimoni (D-B8C-12). Per això, al cap de 60 dies sense que la persona torne a tocar l'interruptor, el servidor el considera vell i els avisos natius s'aturen. Per a renovar-lo sense inscriure ningú de nou cal la petició P-B8C→B8S-1: una renovació sense reclam, que només actualitza una fila que ja és de la persona i mai n'insereix cap.

## 15. Fonts oficials consultades

Totes consultades l'1 de novembre de 2026.

- [App Store Connect · App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information): nom i subtítol de 30 caràcters.
- [App Store Connect · Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information): text promocional de 170, descripció de 4.000, paraules clau de 100 octets i notes de 4.000 octets.
- [App Store Connect · Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications): mides de la secció 12.1.
- [App Store Connect · Age ratings values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions): valors 4+, 9+, 13+, 16+ i 18+.
- [App Store Connect · Set an app age rating](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating): sobreescriptura obligatòria quan les condicions fixen una edat mínima superior.
- [Apple · App privacy details](https://developer.apple.com/app-store/app-privacy-details/): definicions de «collect», contactes i ubicació.
- [Google Play · Store listing](https://support.google.com/googleplay/android-developer/answer/9859152): títol de 30, descripció breu de 80 i completa de 4.000.
- [Google Play · Preview assets](https://support.google.com/googleplay/android-developer/answer/9866151): icona, gràfic destacat i captures.
- [Google Play · Data safety](https://support.google.com/googleplay/android-developer/answer/10787469): tipus de dades, recollida, compartició i finalitats.
- [Google Play · Account deletion](https://support.google.com/googleplay/android-developer/answer/13327111): camí dins de l'App i enllaç web.
- [Firebase Hosting · API firebasehosting v1beta1](https://firebasehosting.googleapis.com/$discovery/rest?version=v1beta1): `ServingConfig.appAssociation`, revisió 20261018.
- [Firebase Hosting · Configure Hosting behavior](https://firebase.google.com/docs/hosting/full-config): AUTO per defecte, actualitzada el 21 d'octubre de 2026.

## Vincles

- [[00_arquitectura_tecnica_unificada]]
- [[llei_05_privacitat]]
- [[index_trellat]]
- [[00_index]]
