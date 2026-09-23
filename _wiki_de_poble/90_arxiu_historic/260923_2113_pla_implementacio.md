---
type: document
status: esborrany
description: Pla compartit de les cinc peticions UI, concretat amb evidència de Codex; pendent de consens amb Claude i MarIA.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_1830f064-07fa-450e-a121-26e037a3fb16:b6004f23-2b17-41c1-b43a-a869ddab647d
---
# Pla d’Implementació — Foraster, Crom, registre i notes

**Estat del Pla:** en elaboració; pendent del consens exigit pel prompt.

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1830f064-07fa-450e-a121-26e037a3fb16:b6004f23-2b17-41c1-b43a-a869ddab647d |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T19:25:42.039Z |
| Modificació | 2026-09-23T19:25:42.039Z |
| Propietari | Olivera; aportació Codex |
| Aprovació humana | Petició rebuda; execució de codi condicionada al consens AFK de l’Olivera. |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | GPT-6; variant no exposada |
| Tokens consumits | Mesurats reals: no disponibles. Estimació orientativa del torn: 18000–25000; no és telemetria mesurada. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

21:13: esborrany de MarIA. 21:20–21:30: revisió Codex, contracte documental completat i propostes concretes incorporades. Es conserva la ruta compartida i els cinc objectius originals. Auditoria: [[260923_2120_auditoria_codex]]. Cap implementació iniciada per este torn.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Consens i ordre

Codex aporta el diagnòstic verificat. Falten la nova auditoria de Claude i la consolidació de MarIA. No interpretar el rebut ni este pla com un consens ja aconseguit. Primer registre/avatar/estat buit; després Crom amb contrast; finalment corpus i persistència corporativa. No tocar codi abans del consens establit pel Mestre.

### 1. Avís de Beta Testers

MODIFY OnboardingSection.jsx: avís comú abans de Google i formulari manual amb funcionalitats limitades, registre, novetats i petició explícita de feedback mòbil. Text complet en C6 de l’auditoria. Conservar els controls existents; no activar comunicacions externes.

### 2. Integració del Panell Crom

MODIFY App.jsx, PanellCrom.jsx, crom.js i CSS de components: muntar el disparador per superadmin o capacitat corporativa verificada; resoldre .sdp-root quan el botó realment es munte. Canviar el to principal a partir del taronja. Validar els contrastos en sRGB després de la conversió i ajustar la paleta; conservar colors d’estat i fotografies. Afegir layout de panell/mostres. Proposta inicial: efecte sobre la instància activa durant la sessió; persistència compartida requerix contracte explícit. No usar el nom de perfil ni actor-preference com a prova de permisos.

### 3. Poblament Seed de Sóc de Poble

MODIFY appSeed.js i adaptadors de notes quan la font editorial estiga identificada. Hui només hi ha n1/n2 i MOCK_FEED buit: falta concretar quines publicacions són el corpus. Assignar origen estable i carpetes, sense duplicats. Lectura pública dels exemples; edició de notes natives autoritzades amb UUID, revision i propietat real. MODIFY NotesEditor/DocumentEditor/NotesContext per impedir que un exemple no desable aparente desament o publicació. Les consultes per actor corporatiu necessiten model/permís de backend coherent amb RLS; no basta omplir arrays.

### 4. Avatar Foraster

MODIFY NotesEditor.jsx, UniversalEditorShell.jsx i PageFrame.jsx: absència explícita d’avatar, UserRound blanc/fosc i fallback d’error recuperable. Preservar avatars vàlids i logo de n1. «Nom del poble del foraster» només en el cas anònim. Verificar també l’estat sense nota activa.

### 5. Capçalera i Logotip

MODIFY UniversalEditorShell.jsx i CSS de l’estat d’inserció: contenidor blanc amb espai interior; botó menut sense estirar, àrea tàctil suficient; paràgraf centrat «Pots pujar qualsevol tipus d’imatge o arxiu multimèdia.» sota cada botó. El text original del Mestre usa apòstrof recte: conservar-lo si cal coincidència literal.

MODIFY useHeroImageHandler.js i renderer/contracte de media compartit: suport real per als formats abans d’afirmar-lo; imatge passa per compressió, vídeo/àudio/arxiu segueixen ruta compatible i es renderitzen amb el tipus correcte. Revisar storage i errors. Limitar la regla blanca a inserció, sense alterar fotos ni AppGridShell.

### Decisions que falten

La font editorial concreta no és al seed del Mur. MarIA/Consell ha de localitzar-la o el Mestre identificar-la. Cal confirmar en el consens l’abast de persistència de Crom; la proposta temporal no equival a publicar un tema per a tots els usuaris. No crear articles, rols ni permisos ficticis.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Estat actual: 5/5 proves de NotesDataContext passen; DOM anònim verificat en n1/n2/registre. Encara no valida els canvis proposats.

Acceptació després d’implementar:
- Registre: text visible abans dels dos accessos, mòbil i escriptori.
- Avatar: anònim, src trencat, avatar vàlid, logo corporatiu i canvi de perfil sense regressió.
- Crom: fora → comprovant → superadmin, aplicar verd/groc, restaurar, navegar seccions, clar/fosc i dos arrels independents; mesurar contrast de les parelles semàntiques.
- Notes: corpus/cartafolis correctes, cap duplicat, visitant només lectura, editor autoritzat desa i recarrega; usuari alié no escriu.
- Media: inserir/cancel·lar/substituir, imatge/vídeo/àudio/arxiu admesos, errors explícits; botó compacte i text centrat a 390 i 1440 px.
- Lint acotat, proves de permisos i persistència, build:web i build:wp; document.mjs check i tancament. No declarar acabat per proves de càrrega seed soles.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Fals desament de seed; elevació per nom/actor local; contrast variable; text multimèdia incompatible amb image/*; fallback que substituïx avatars vàlids; CSS que afecta capçaleres amb imatge. Canvis concurrents existents: revisar diff abans d’executar, no sobreescriure feina aliena. No s’han mogut arxius històrics ni tocat la zona humana.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_2120_auditoria_codex]]
- [[260923_2113_prompt_execucio_olivera]]

