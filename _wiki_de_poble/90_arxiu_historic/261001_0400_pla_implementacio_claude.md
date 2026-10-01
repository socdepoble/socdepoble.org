---
type: document
status: esborrany
description: Planificacio per a Claude per la proxima sessio.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_4590f29d-d514-4ec5-9a04-5afeec9abb26:cbf35e8c-4dcb-4992-af76-0b7c297b238e
---
# Pla d'implementacio: Calendari, Poblacions i Metadades Plugin

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4590f29d-d514-4ec5-9a04-5afeec9abb26:cbf35e8c-4dcb-4992-af76-0b7c297b238e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T01:28:14.729Z |
| Modificació | 2026-10-01T01:28:14.729Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-01T01:28:14.729Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
Hem generat l'arxiu ZIP del plugin (`socdepoble-enxufe-v1.0.0-261001_0320.zip`) i, en pujar-lo a un entorn WordPress real (Gent de la Torre), l'activació falla amb un **error fatal** genèric. A més, hem detectat que a la pestanya de detalls del plugin a WordPress la "Descripció" i el "Registre de canvis" apareixen completament buits.
A més, amb el plugin de WP carregat, la Consola del navegador revela dos problemes de la UI (Pedra Seca):
1. Error 404 en els *assets*: `https://gentdelatorre.net/assets/fotos/iaia-maria.png` i el logo SVG. L'App està buscant les imatges a l'arrel del domini en comptes d'utilitzar el `plugin-url` o la base relativa on està instal·lat.
2. Error d'Accessibilitat (a11y): `aria-hidden="true"` s'aplica a l'ancestre `#app-grid-sidebar` mentre un botó del seu interior manté el focus, cosa que bloqueja els lectors de pantalla.
3. UX a Mòbil i Fedivers: La `FranjaAmfitrio` ocupa massa espai i té un text antic ("Estàs al servidor de..."). Cal redissenyar-la per ser "Connectat al node de..." amb un pilot lluminós, fer-la clicable per obrir una pàgina explicativa del Fedivers, i afegir-hi una "X" per tancar-la.
4. Calendari (Clon de Google Calendar): Cal començar a planificar l'arquitectura de la vista setmanal i mensual del calendari a imatge de Google Calendar.

Tot això impedeix la publicació del plugin de manera oficial i canònica, i empitjora l'experiència d'usuari mòbil. L'objectiu d'aquest pla és resoldre l'error fatal, els bugs de UI detectats, iniciar l'arquitectura visual del Fedivers i assentar les bases estructurals del Calendari.

### 2. Canvis Proposats (Proposed Changes)

#### [Acció: MODIFY] `wordpress-plugin/` (Error Fatal i Plantilla FSE)
S'han d'inspeccionar els fitxers de `wordpress-plugin/` (especialment `socdepoble-enxufe.php` i la carpeta `includes/`) a la recerca d'errors de sintaxi PHP o dependències mal resoltes que estiguin provocant el crash durant l'activació.
A més, cal revisar `includes/marcatge.php` per assegurar-se que el registre de la plantilla ("Sóc de Poble · pantalla completa") és perfectament compatible amb els temes moderns de blocs (FSE - Full Site Editing), de manera que aparegui correctament al selector visual de plantilles de Gutenberg.

#### [Acció: MODIFY] Rutes d'Assets a la UI
Corregir els components (ex: avatars, logos de la barra o del Navbar) perquè resolguin les imatges basant-se en la propietat base de l'enxufe o imports relatius, no rutes absolutes `/assets/...` que fallen fora del localhost.

#### [Acció: MODIFY] UX de la Franja Amfitrió i Fedivers
1. **FranjaAmfitrio:** Canviar el text a "Connectat al node de [nom]". Afegir un "pilot" (puntet groc/verd) que indiqui connexió. Afegir una "X" per tancar-la (guardant a `sessionStorage`).
2. **Nova Pàgina Fedivers:** Si l'usuari clica a la franja (fora de la X), s'obre una nova pàgina (ex: `/fedivers`) on s'explica què és l'arquitectura de nodes de Sóc de Poble, com qualsevol CMS (com WordPress) s'hi pot enxufar, i la visió de futur de connectar-se a altres xarxes descentralitzades com Mastodon.
3. **Perfil d'Usuari:** Integrar la llista de nodes coneguts al perfil d'usuari per gestionar les connexions.

#### [Acció: CREATE/MODIFY] Arquitectura del Calendari (Google Calendar)
Claude ha de dissenyar l'estructura de dades i l'esquelet de components de React per a la vista Setmanal i Mensual del Calendari. Atès que l'objectiu és replicar l'UX de Google Calendar, pot anar avançant tota la lògica d'ubicació d'esdeveniments a la graella, superposicions d'hores i navegació, mentre el Mestre prepara les captures de pantalla per a la fase de poliment visual (CSS).

#### [Acció: MODIFY] Accessibilitat a la Barra Lateral
Solucionar el problema de l'atribut `aria-hidden` a l'element `#app-grid-sidebar`. L'estratègia correcta segurament implica usar l'atribut HTML5 `inert` en el contenidor, o assegurar-se que es retira el focus del botó intern abans d'amagar el panell.

#### [Acció: MODIFY] `wordpress-plugin/readme.txt`
Completar el `readme.txt` seguint els estàndards de WordPress.org:
- Afegir una descripció completa ("Description") explicant què és l'App de Sóc de Poble i el seu funcionament desacoblat (Amfitrió / UI).
- Afegir el "Changelog" (Registre de canvis) per a la versió `1.0.0`.
- Especificar correctament els `Contributors`, `Tags`, `Requires at least`, etc.

#### [Acció: MODIFY] `wordpress-plugin/socdepoble-enxufe.php`
Revisar les metadades de la capçalera si cal per garantir que tot estigui correctament lligat.

### 3. Pla de Verificació (Verification Plan)
1. Es passaran les proves locals d'enxufe (`npm run test:node tests/enxufe-plugin.test.mjs`).
2. S'empaquetarà de nou el plugin.
3. El codi no ha de tenir regressions ni errors d'ESLint.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Les portes passaran l'auditoria, especialment `porta:enxufe` i els lints PHP si els tenim. El procés de zip serà silenciós i correcte.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Modificar el codi PHP sense tenir l'entorn de producció directe pot portar a blind calls. S'han de fer proves rigoroses i assegurar-se que s'entén la causa del fatal error abans de proposar el canvi.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
