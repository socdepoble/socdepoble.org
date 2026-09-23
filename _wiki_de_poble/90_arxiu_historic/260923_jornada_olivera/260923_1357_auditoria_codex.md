---
type: informe
status: esborrany
description: Reparació del contracte de Notes, persistència versionada, publicació recuperable i controls del workspace.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_c15504ba-340b-4d41-97bd-8937f001d879:24bfb160-d7d5-4a3a-81a9-80dd33b0c0f2
---
# Implementació de Notes i Universal Workspace

Informe d’implementació autoritzada pel prompt SDP-IMPLEMENTACIO-260923_1340_CODEX. El codi s’ha modificat al disc; els límits de verificació es declaren explícitament.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c15504ba-340b-4d41-97bd-8937f001d879:24bfb160-d7d5-4a3a-81a9-80dd33b0c0f2 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T12:07:58.316Z |
| Modificació | 2026-09-23T12:07:58.316Z |
| Propietari | Codex |
| Aprovació humana | Implementació autoritzada expressament al prompt de les 13:40 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23: lectura del pla, auditoria de Codex de les 13:03 i auditoria de Claude de les 13:10; implementació local i proves adverses.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Canvis implementats

- **Contracte i tenant:** NotesContext transmet workspaceKey, notesComplete, resolveNote, refresh, config i canCreate. NotesEditor passa la configuració del provider a uploadToStorage i a la promoció de mitjans. L’adaptador valida UUID de tenant, usuari i nota i revisió entera no negativa abans de la xarxa.
- **Notes editables:** la taula notes és l’única font editable. Les carpetes de sistema provenen del catàleg declarat i la benvinguda continua com a document de lectura. Lectura paginada en blocs de 50 fins a l’esgotament, resolució individual i substitució del snapshot complet en refrescar.
- **Persistència:** una transacció readwrite d’IndexedDB incrementa la versió monotònica i fusiona els camps pendents. Confirmar elimina només les versions de camp corresponents; fallar no reescriu el payload antic. Els camps ja confirmats no es tornen a enviar amb un snapshot posterior. clearDraft resol totes les promeses cancel·lades. Les transaccions esperen oncomplete, rebutgen onabort i tanquen la connexió.
- **Edició i sessió:** eliminada la segona còpia de sessionStorage. Els canvis locals passen immediatament a la cua, amb desat remot ajornat. Revisió remota separada dels overrides. Els callbacks comproven workspace/generació i les respostes d’una sessió antiga es rebutgen. L’editor es remunta per workspace/nota. Es conserven les claus de drafts personals; els actors d’entitat incorporen l’usuari autenticat al nou scope.
- **Mur:** publicar captura els camps visibles, força el desat i entra en el mateix lock que l’autosave. Doble clic compartix promesa. La submission usa publishedSubmissionId o, inicialment, el UUID de la nota. Un POST confirmat seguit de PATCH fallit es reintenta sobre el mateix ID; no duplica la publicació. No s’executa clearDraft durant publicar. El propietari de la submission es deriva de la sessió autenticada.
- **Workspace:** estats loading/error/revalidating/not-found visibles, reintent de resolució i càrrega, crear condicionat a disponibilitat. Títols DISSENY i WIKI DE POBLE, acordió de navegació opcional, configuració absent quan no hi ha callback. Notes incorpora ordenació per data/nom. Marges laterals mínims de 20 px a la barra central. Eliminada la pell exclusiva del botó Tot de Notes perquè use la mateixa primitiva de Disseny.

### Diàleg amb Claude i el pla

Ratificada la separació que Claude proposa entre watcher del disc i edició persistent. No s’ha incorporat un editor a la Wiki ni s’ha assumit que el watcher resolga persistència. A l’Escriptori no hi havia un nou informe d’implementació de Claude durant la comprovació. Les seues observacions de governança continuen sent una feina independent.

S’han preferit transaccions de camps i una cua comuna a duplicar flags entre magatzems. No s’ha reescrit l’aplicació ni introduït dependències. Els tres modes de fallada provats són resposta antiga, fallada de persistència local i POST confirmat amb vinculació fallida.

### Protocol local

Torn torn_c15504ba-340b-4d41-97bd-8937f001d879. Reflex acb2ac02-b2a2-45b5-8e47-b13978d9f240 segellat per a code-translate abans del codi. Init ha completat l’estat privat absent; core.hooksPath observat després: .husky. El bootstrap generava prompt_consell.md addicional i seal l’ha rebutjat: s’ha conservat eixa plantilla a /tmp/sdp-acb2ac02-plantilla-generada.md i s’ha segellat el parell requerit. El validador mecànic exigix un nom PROMPT en majúscules, divergent de la taxonomia editorial; només el bootstrap privat usa eixa forma.

El pla compartit no es pot vincular mecànicament: document plan rebutja el tag olivera, fora de l’enum. No s’ha reescrit el pla alié ni s’ha declarat vàlid un contracte que falla.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- Vitest focalitzat: **24/24 proves**, huit fitxers. Inclou error antic contra draft nou, fusió de camps, confirmació selectiva, ordre autosave/publicació, clearDraft, quota, cablejat entre providers, resposta de generació antiga, configuració de pujada A/B, doble clic i reintent estable, validació abans de xarxa, 51 notes i controls UI.
- Suite Node backend_consolidacio: **14/14**.
- ESLint de Notes, workspace i adaptadors modificats: **0 errors i 0 avisos**.
- Vite build: correcte; avisos de chunks grans i imports estàtics/dinàmics preexistents.
- Navegador local al 3340, sense sessió: benvinguda conservada, crear desactivat, missatge d’accés en lloc d’absència de notes, control Data/Nom operatiu. Captura inspeccionada amb 20 px de respiració lateral.
- Suite Vitest global: **80/80 proves, 20/20 fitxers**. Tancament executat amb --check: **exit 1**. Passen plantilles, autoritat i catàleg de skills. Fallen LEDGER sense signatura, segell divergent, enllaços Wiki, SCC i tres proves documentals de fortificació (60/63 passen). Les tres fallades són canvi d’encapçalament i dos casos de graf; aquests fitxers de tooling/tests no s’han modificat en este torn. El torn queda sense pla vinculat (tag invàlid del pla compartit) i sense relleu al LEDGER; ESTAT sí que està actualitzat. No es declara tancament global verd.
- Build final repetit després de l’últim canvi de codi: correcte. Lease Reflex consumida al final de la implementació.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

**No és una transacció SQL entre nota i mur.** És una operació serialitzada al client amb ID idempotent i recuperació explícita en dos passos. Durant una fallada entre POST i PATCH, el mur pot tindre la publicació mentre la nota encara no té la vinculació. Per eliminar eixa finestra cal una RPC transaccional desplegada al backend; no s’ha migrat cap esquema ni escrit dades remotes.

Les proves de persistència injecten un magatzem transaccional en memòria; no certifiquen tots els motors IndexedDB, quota real o caiguda física de pestanya. No hi ha verificació autenticada de RLS amb dos usuaris i dos tenants, ni garantia d’ordre global entre diverses pestanyes. La paginació per offset no és un snapshot SQL immutable davant mutacions remotes durant la lectura.

Les incidències de l’auditoria original que excedixen els quatre encàrrecs concrets no es declaren tancades: mock oficial de Sollutia, idempotència de creació després d’un timeout, comparador interactiu de conflictes, migració de notes del llegat i unificació completa dels slots intro. Els drafts antics d’actors d’entitat es conserven al seu scope original; no s’importen sense atribució inequívoca d’usuari. No s’ha alterat el model d’integració B ni el separador general de navegació.

Arbre amb canvis previs preservats; no s’ha creat commit ni desplegament. Acta Marmota de final de jornada pendent.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
