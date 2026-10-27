---
type: document
status: esborrany
description: Full de ruta per a la integració del menú compartir nativa a Android i iOS, notificacions i retocs de disseny al xat
tags:
  - implementacio
visibility: private
reflex: sdp:torn_ede6482b-cdb7-4466-aeeb-0cbd58776c98:de4301e6-cd7a-4d3f-9622-83bf5f656ded
---
# Pla d'Implementació: Share Target Nadiu, Notificacions i Fortificació del Xat

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ede6482b-cdb7-4466-aeeb-0cbd58776c98:de4301e6-cd7a-4d3f-9622-83bf5f656ded |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T15:13:10.014Z |
| Modificació | 2026-10-26T15:13:10.014Z |
| Propietari | MarIA |
| Aprovació humana | aprovat (ordre directa del Mestre Javi en àudio) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude 3.7 Sonnet (Local Cowork/Desktop) + IAIA MarIA (Orquestració) |
| Tokens consumits | En curs |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-26T15:13:10.014Z: esborrany creat; contingut i verificació pendents.
2026-10-26T16:15:00.000Z: pla aprovat pel Mestre; instruccions de fortificació, Share Target i notificacions integrades.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Share Target Nadiu (Menú de Compartir del Sistema)
- **Objectiu:** Permetre que en fer una captura de pantalla al mòbil o iPad i tocar «Compartir», aparega el logo de Sóc de Poble al costat de WhatsApp i Telegram.
- **Android (`android/app/src/main/AndroidManifest.xml`):**
  - Registrar `<intent-filter>` per a `android.intent.action.SEND` i `android.intent.action.SEND_MULTIPLE` amb `mimeType="image/*"` i `mimeType="text/plain"`.
  - A `MainActivity.java`, interceptar l'intent entrant en arrencada (`onCreate`) i en segon pla (`onNewIntent`), llegir l'URI de la imatge via `FileProvider` o stream i transmetre-la al WebView de Capacitor mitjançant un esdeveniment JS o cua de compartició.
- **iOS (`ios/App/App`):**
  - Configurar l'arquitectura de Share Extension amb l'App Group (`group.org.socdepoble.app`) i URL scheme per a rebre imatges des de la Share Sheet d'iOS.
- **Xat (Frontend React):**
  - Integrar un listener per a les imatges/captures compartides.
  - Quan arriba una captura, obrir el Xat i carregar automàticament la imatge a la caixa de redacció (amb la seua miniatura i opció d'afegir peu de text) abans d'enviar-la al canal de proves o conversa activa.

### 2. Notificacions Push i Locals
- **Objectiu:** Proporcionar alertes immediates quan arriba un missatge o incidència a l'aplicació, parificant l'experiència amb WhatsApp/Telegram.
- **Infraestructura:**
  - Avaluar i configurar els connectors de Capacitor per a notificacions (`@capacitor/push-notifications` i `@capacitor/local-notifications`).
  - Permetre la recepció i emissió de notificacions visuals i sonores tant en primer pla com en segon pla.

### 3. Sanejament Visual i de Disseny del Xat (Pedra Seca)
- **Text d'accés:** Actualitzar la cadena `section.xat.sessio.calEntrar` a `src/config/idiomes/ca.js` i els components `XatSection.jsx` i `DialegNovaConversa.jsx` perquè mostren «Benvinguda a Sóc de Poble» en lloc de «Entra per buscar persones i enviar missatges.».
- **Maquetació mòbil dels botons:** Ajustar `.sdp-xat-acces > .sdp-alerta__accions` a `src/css/modules.css` perquè els botons «Connectar-se» i «Registrar-se» es distribuïsquen de forma equilibrada (en línia o amb espaiat harmònic) sense amuntegar-se a pantalles mòbils compactes.

### 4. Barra d'Estat i Icones Blanques del Sistema (Status Bar & Navigation Bar)
- **Objectiu:** Forçar que les icones del sistema (hora, bateria, wifi, cobertura) i els botons de navegació inferiors siguen blancs sobre fons negre, restaurant la visibilitat completa a Android i iOS.
- **Android (`styles.xml`):** Configurar `windowLightStatusBar = false`, `statusBarColor = #000000`, `windowLightNavigationBar = false` i `navigationBarColor = #000000`.
- **iOS (`Info.plist`):** Configurar `UIStatusBarStyleLightContent` permanent.

### 5. Taula de Continguts Integral (H1 a H6), Respiració sota Barra Negra (58px) i Jerarquia Cromàtica (Directiva del Mestre Javi)
- **Objectiu:** Resoldre la visualització erràtica del calaix de la Taula de Continguts (`TableOfContentsDrawer` a `PageFrame.jsx` / `modules.css`) en dispositius mòbils i escriptori, garantint la navegació completa de la jerarquia editorial (H1 a H6).
- **Posició sota la Barra Negra:** El calaix i el seu vel (`.toc-overlay` i `.toc-drawer`) han de començar per davall de la barra negra d'eines (`top: var(--sdp-alcada-barra-eines, 58px); height: calc(100dvh - var(--sdp-alcada-barra-eines, 58px));`), sense tapar la barra d'eines de 58px ni col·lidir amb la barra d'estat del dispositiu mòbil.
- **Inclusió de l'H1 de la Pàgina:** Estendre l'extracció de `TableOfContentsDrawer` perquè arreplegue l'H1 de la capçalera (`header.page-title h1`), que actualment queda ignorat en estar fora de `article.content-wrapper`.
- **Cobertura fins a H6 (Inclusió de Cards):** Assegurar el reconeixement de tots els encapçalaments d'H1 fins a H6. Com que les targetes (`UniversalCard`) utilitzen internament H3 i H4 com a títols i subtítols, la Taula de Continguts funcionarà com a índex complet de totes les cards i blocs editorials de la pàgina.
- **Jerarquia Cromàtica:** 
  - H1 en blau d'acció (`var(--sdp-accio-text)` / blau Pedra Seca).
  - H2 en color terracota/accent (`var(--sdp-accent-titol)`).
  - H3 en color de títol de secció (`var(--sdp-text-titol)`).
  - H4–H6 escalats harmònicament amb indentació visual per facilitar l'escaneig ràpid.

### 6. Erradicació de la Carpeta Regressiva a Notes, Estandardització d'Icones i Alineació Vertical (Directiva del Mestre Javi)
- **Objectiu:** Resoldre la dissonància visual i la falta d'alineació a la columna de Notes detectada pel Mestre:
  - **Extirpació del botó intrús:** Retirar el botó de carpeta (`categoryIcon || Folder` a `UniversalWorkspace.jsx:1444-1458`) que s'havia colat a l'esquerra del títol NOTES, duplicant funcions i trencant l'eix vertical.
  - **El misteri de la icona d'ordenar (20px vs 24px):** A `UniversalWorkspace.jsx:1494`, la icona `ArrowDownAZ` estava forçada artesanalment a `iconSize: 20`, fent-la visiblement minúscula en comparació amb la resta. S'unifiquen tots els glifs a una mida invariant (`24px` o `26px` més amable i punxable).
  - **Alineació vertical exacta entre files:** La Fila 1 (NOTES) i la Fila 2 (Cerca / Ordenar) han de compartir el mateix padding (`var(--sdp-space-4)` / 16px) i graella, garantint que la icona de Notes caiga a plom sobre la Lupa a l'esquerra, i el botó de Replegar caiga a plom sobre el botó d'Ordenar a la dreta.
  - **Cel·les tàctils invariants:** Totes les zones interactives conserven la cel·la de `48px × 48px` (`--sdp-touch`).

### 7. Desplegament Universal en 1 Clic i Traçabilitat de Versió Canònica (Directiva del Mestre Javi)
- **Objectiu:** Dotar la Consola d'Administració (`/consola`) i el conjunt de tractors de publicació d'una eina orquestradora per a publicar les actualitzacions a totes les plataformes suportades en un sol clic, sense haver de fer gestions manuals disperses:
  - **Plataformes objectiu:** Apple App Store (iOS/iPadOS/macOS Catalyst), Google Play Store (Android), Microsoft Store (Windows via PWABuilder/.msix), Linux (Flatpak/deb), PWA web i connector de WordPress (`<soc-de-poble>`).
  - **Orquestrador de pujada unificada:** Automatitzar el cicle `build` → `preflight` → `signatura` → `pujada` mitjançant les APIs oficials de cada botiga (App Store Connect API, Google Play Developer API, etc.).
- **Comptador i Visibilitat de la Versió Canònica del Sistema:**
  - Crear un registre explícit i visible del número de versió canònica (ex. `v1.0.1 (build 261026)`) visible clarament:
    1. A la **Consola d'Administració** (`/consola`).
    2. Als **Ajustos / Informació de l'App** (seguint el patró WhatsApp a *Ajustos > Ajuda > Info de l'aplicació*).
    3. Als peus de pàgina o metadades dels builds per a garantir la traçabilitat legal i canònica de cada lliurament.

### 8. REA i Calibratge Visual de Converses: Superar WhatsApp al Mil·límetre (Directiva del Mestre Javi)
- **Objectiu:** Reestructurar la pantalla d'entrada de Converses (`src/sections/xat/`) prenent com a font de veritat el banc de 74 captures de pantalla de WhatsApp (`WhatsApp-Clon-01` i `WhatsApp-Clon-02`), no per a copiar-lo mimèticament, sinó per superar-ne l'ergonomia rural i l'elegància visual:
  - **Mida de l'Avatar / Miniatura:** Augmentar el diàmetre de l'avatar a **74px–76px** (davant els 68-70px de WhatsApp), oferint una presència visual nítida i de fàcil reconeixement per a la gent gran del poble.
  - **Alçada matemàtica de la Targeta de Conversa:** Reduir l'alçada de cada fila de conversa dels 128px actuals (amb massa espai buit i desmanegat) a **96px** exactes (`var(--sdp-space-24)` o `2 × var(--sdp-touch)` = `2 × 48px`). Aquesta alçada canònica permet que a la pantalla d'entrada càpiguen 6 o 7 converses completes sense desbordament.
  - **Compactació harmònica de Títol i Lema:** Apropar la distància vertical entre el nom del contacte/grup i el lema/últim missatge (`margin-bottom: var(--sdp-space-1)` o 2-4px), eliminant els espais buits gratuïts i creant una targeta compacta, integrada i visualment cohesionada.
  - **Poda radical de la Fila 1:** Retirar immediatament el botó inventat dels tres punts `[...]` situat entre el calaix de carpetes i el títol «Converses». Substituir la selecció manual per la **pulsació llarga (Long Press)** a sobre de cada conversa com fa WhatsApp.
  - **Cerca intel·ligent col·lapsable per Lupa (Superar Meta AI):** En lloc de tindre la caixa de text de cerca ocupant 48px verticals permanentment a la Fila 2 com fa Meta per imposar el seu cercador, activar la cerca desplegable mitjançant la icona de la **Lupa**. Quan no es cerca, eixe espai s'allibera completament per a les píndoles de filtre i les converses.
  - **Píndoles de filtre de categories:** Introduir el carrusel de píndoles horitzontals (`[Totes]`, `[No llegits]`, `[Pobles]`, `[Grups]`, etc.) sota la capçalera per filtrar a 1 sol toc, alliberant la vista de botons intrusius.

### 9. Sistema Unificat de Botons Pedra Seca i Governança Visual de Tokens a la Consola (Directiva del Mestre Javi)
- **Objectiu:** Erradicar qualsevol botó pegat a vores, divisors o compositors (com el cas de `[ Pregunta a la IAIA ]` tocant literalment la caixa d'`Escriu un missatge...`), garantint que cap estil s'aplique de forma ad-hoc ni es convertisca en "fantasma":
  - **Marges perimetrals estandarditzats:** Els botons han de respirar lateralment (`margin-inline: var(--sdp-space-4)` / 16px o contenidor amb padding), conferint l'elegància i categoria visual que exigeix el disseny.
  - **Espaiat vertical harmònic:** Separació vertical mínima de `margin-block: var(--sdp-space-3)` (12px) per a botons solitaris respecte a altres elements.
  - **Separació d'agrupacions per `gap`:** Els botons agrupats (ex. «Connectar-se» i «Registrar-se») mantindran la seua separació harmònica exclusivament mitjançant `gap: var(--sdp-space-3)` al contenidor flex, evitant la duplicació de marges quan van junts.
  - **Governança des de la Consola d'Administració:** Totes les mètriques de botons han de brollar de tokens CSS a `tokens.css` per a poder ser calibrades i modificades visualment per l'administrador des del Panell de Control (`/consola`), aplicant-se automàticament a tot el sistema.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Execució de la suite de precommit: `npm run test:precommit` (3.413 proves verdes garantides).
2. Proves noves de regressió per al text i els botons del Xat (`XatSection.acces.capes.test.js` i `XatSection.avatars.test.jsx`).
3. Validació de la sintaxi i build de Capacitor: `npm run build:natiu` i comprovació del manifest d'Android.
4. Passada de portes de governança i tancament: `node tooling/gates/porta-olivera.mjs` i `node tooling/gates/run-portes.mjs --diagnostic`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Permisos i FileProvider a Android:** Les URIs d'imatges compartides des d'altres aplicacions requereixen permisos de lectura temporals (`FLAG_GRANT_READ_URI_PERMISSION`). Cal copiar o resoldre la imatge de forma segura sense provocar excepcions de seguretat `SecurityException`.
2. **Preservació de la Llei de l'Enxufabilitat:** Cap canvi natiu pot trencar la versió web purament SPA o el connector de WordPress. La lògica de recepció d'intents ha de ser un *enhancement* progressiu actiu només quan s'executa sota Capacitor.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
