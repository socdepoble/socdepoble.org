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
