---
type: informe
status: esborrany
description: "Implementació local de fortificació: canvis aplicats, proves reproduïbles i límits que impedixen certificar la cadena completa."
tags: [auditoria, implementacio]
visibility: private
reflex: sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:487f12a9-2eb0-4fbb-8e63-ce56d806bc9f
---
# Fortificació integrada: evidència i treball pendent

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-FORTIFICACIO-CODEX-260924-0420 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local; localhost:3340 |
| Creació | 2026-09-24 04:20 Europe/Madrid |
| Modificació | 2026-09-24 04:31 Europe/Madrid |
| Propietari | Codex; treball coordinat amb carril Claude i IAIA MarIA |
| Aprovació humana | Prompt d’implementació conjunta de les 03:25, rebut en esta conversa |
| Model IA | GPT-6, variant no exposada |
| Tokens consumits | Mesurats: no disponibles. Estimats: no calculats; no s’inventa telemetria. |

## Acte reflex

Rebut persistent sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:487f12a9-2eb0-4fbb-8e63-ce56d806bc9f. Torn de codi torn_55db196d-c3c1-4af0-b283-fb10e77b165c. Llegits governança, protocol, workflow, plantilla i pla compartit. Els lots de codi, eines i governança s’han preparat en temporals, revisat contra hashes base i aplicat mitjançant leases reals i executor CAS. Les metadades ordinàries d’Escriptori s’han regularitzat amb rebuts documentals.

## Historial

- 03:25: autorització d’implementació, que substituïx l’auditoria AFK anterior.
- Sessió d’integració: tres auxiliars preparen lots independents; aplicació centralitzada per evitar trepitjar canvis.
- Llegit el recull de Claude de les 03:56. Les afirmacions de finalització de les 03:57 atribuïdes externament a Codex eren prematures: aquell fitxer és una síntesi provisional, no este informe.
- No s’ha modificat la skill de sistema skill-creator. S’ha utilitzat i s’han reparat dues skills locals del projecte.

## Troballes

### Resultat per l’abast acordat

| Troballa | Resultat local i límit |
| --- | --- |
| C01 OAuth | Intent únic amb epoch i abort compartit entre OAuth/contrasenya/registre; logout cancel·la; retorns tardans no restauren sessió; finestres antigues no tanquen la següent. |
| C02 Xat | Scope d’usuari, actor, generació, tenant, backend i configuració; estat antic emmascarat immediatament, peticions avortades i callbacks obsolets descartats. Connexió anònima no fabrica missatge optimista. |
| C03 Perfil | Verificació d’identitat i epoch després d’await; no escriptura següent quan canvia sessió; PATCH ha de confirmar exactament la fila. Avatars filtrats en targeta, pàgina i barra superior. |
| C04 Exportadors | Política comuna manifest/RAG/slugs/SEO: exclusió de governança, Escriptori, actes, història, privats i symlinks fora de l’arrel. Notes/Xat noindex. 68 documents públics i 31 rutes SEO, 23 indexables en el build verificat. |
| C05 Ordres | Lectures amb argv exacte, cwd d’arrel i scripts auditats; operacions documentals separades. Es rebutgen shells i entorns alternatius, Unicode ambigu i ordres divergents. Cap excepció per prefix npm/node ni baseline mutadora. |
| C06 Plaquetes | Aprovació vinculada a recepta i hashes d’origen, confinament físic i executor exacte. Sense shell interpolat ni commit automàtic. Reversa/destrucció tanquen amb error fins a usar el circuit adequat. |
| C07 Accions | Connectar porta context i destinatari al Xat; desar en Notes usa l’API de Notes i navega a la nota; invalidació Mur conserva scope. |
| C08 SEO/semàntica | Propietari únic del head per ruta, neteja de metadades anteriors i respecte d’embed/iframe/configuració. Wiki manté un h1 de pàgina i desplaça el cos a h2–h6 conservant aparença. |
| C09 Contrast | Tokens específics de controls blaus: 9,21:1 normal i 7,20:1 hover en clar/fosc. No es declara AAA universal de tota l’aplicació. |
| C10 Mòbil | Barra de 320px conserva controls de 44px; s’eliminen marges que retallaven Perfil. DOM mesurat: Perfil acaba en x312 dins de320px CSS efectius, diana44px; el viewport s’ha restaurat. |
| C11 Catàleg/segell | Reconciliació revisada de core-higiene-escriptori i metadades de core-edicio-segura; 20 skills. Segell vàlid 88f0ec03b3910a6e95785b3a3e0e67a69170357a319a5c005474e0eec148104d. La divergència inicial no era sols core-edicio-segura. |
| C12 Portes/proves | Moltes portes reparades i executades. La cadena completa continua roja; no s’han augmentat baselines ni convertit errors en zero incidències. |
| C13 Integració real | Pendent: auth, API i RLS multiusuari contra staging Sollutia/Supabase real. Les proves locals i estàtiques no acrediten esta integració. |

### Aportacions de Claude i regressions d’integració

S’han preservat el diàleg natiu de Pedra Seca, Publicar taronja sense punts i la neteja de Tailwind/àrees tàctils. Codex ha corregit la data de la previsualització perquè també òbriga l’avís, la sintaxi JSX detectada per lint, el contrast de controls i la semàntica dels headings amb estil conservat. 84 comparacions de propietats CSS en navegador real han resultat equivalents.

El test de previsualització prova les sis accions amb diàleg i sense navegació ni alert natiu. Verificat en navegador a escriptori i finestra mòbil (390px de viewport sol·licitat; zoom del navegador conservat); la creu tanca i torna el focus a la data. Cap publicació ni modificació de dades reals efectuada. Després de la correcció, preview i editor mostren les mateixes quatre etiquetes i 11:00/25-04-26; verificat en DOM.

**Calendari editorial persistent pendent:** la nota actual no té camp de data de publicació; Supabase usa columnes i whitelist explícites. Afegir-lo a les consultes sense desplegar la migració trencaria Notes. No s’ha simulat un desat local que es perderia en recarregar. Cal migració compatible, desplegament del contracte i prova de persistència abans de donar esta petició per resolta.

S’han revisat també les curses d’escriptura documental: creació exclusiva de draft, índex sense truncament, comprovació d’inode/enllaços i reemplaçament CAS. El contracte del PanellCrom només admet el seu token exacte amb HEX6 validat; els hexadecimals de prosa generada es distingixen de CSS executable. Les proves adversàries preserven els rebutjos.

### Deute que impedix el verd global

- Contracte documental i SCC finalment verds: regularitzats els prompts externs i registrats els relleus dels noms substituïts. Un rebut acredita procedència, no una nova autorització rebuda en esta conversa.
- Reflex doctor: fitxers crítics nous sense versionar, canvis durables fora de HEAD i hash de corpus divergent després de moviments històrics previs. No s’ha fet un commit massiu d’un arbre compartit ni s’ha regenerat el baseline per amagar-ho.
- Nomenclatura: 13 noms antics fora de snake_case i dues cites de ruta mortes en el tall inspeccionat. Frontmatter: metadades antigues fora d’enum/vocabulari. Doctrina: cites històriques abreujades, amb línies o a destins moguts.
- Crom: la porta exigix una píndola lateral; layout conserva una instrucció expressa anterior del Mestre de bloc complet. No s’ha canviat eixa decisió visual només per satisfer el gate.
- Sollutia: dos adaptadors sense entrada funcional; catàleg de recursos buit de manera deliberada. No s’han afegit imports decoratius per silenciar orfandat.

### Rèplica i següent revisió

La revisió profunda posterior té sentit després de consolidar estos canvis i resoldre el deute conegut. Prioritzaria regressions independents de sessió/publicació i proves reals de contracte/RLS sobre una altra auditoria general sense desplegament ni dades noves. No s’ha verificat cap execució externa de «60 agents», cap quota ni les afirmacions d’Ultra que figuren en prompts acabats de crear.

Millora de la plantilla: separar autorització humana rebuda, proposta documental i evidència de cada passada; afegir propietari de cada lot i hash base; no publicar progrés intermedi com a conclusió final d’un altre agent. Els camps de model i tokens han de continuar admetent «variant no exposada» i «mesurats no disponibles».

## Verificació

Tall final: **227/227 Node**, **187/187 React en 41 fitxers**, **lint sense errors ni avisos**. Proves de sessió, scopes, URLs, metadata, publicació, ordres, filesystem, contractes AST i UI integrades al repositori.

| Comprovació | Resultat |
| --- | --- |
| npm test -- --run | 187/187; 59,24s en la passada final de fonts React |
| node --test tests/*.test.mjs | 227/227; 23,22s després de tots els lots d’eines |
| npm run lint | Exit0 després dels últims lots |
| npm run build | Web + WordPress + RAG + slugs + SEO, exit0 |
| Segell / LEDGER / skills | Vàlids; hash del segell indicat en C11 |
| Contracte documental / SCC | 8 documents vàlids; graf sense errors en el tall final |
| Design Guard | Passa contra baseline existent; 41 crítics i 5 avisos heretats encara registrats |
| Pedra Seca | Classes77/91, tokens4/4, inline14/14, encapsulament10/13, i18n0; falla pels dos adaptadors Sollutia orfes |
| Consell / Frontissa / importacions / cadena | Passen; Frontissa provada offline sense activar recursos reals |
| npm run porta | Exit1 a Doctrina:155 referències no resoltes |
| tancament --check | valid:true, state:planned. Este check documental local no substituïx npm run porta; no s’ha marcat closed. |
| Reflex doctor --ci | Exit1: fitxers crítics/corpus sense versionar, hash de corpus divergent i canvis fora de HEAD |

S’ha corregit el detector de secrets perquè una menció documental al nom del rol no es tracte com una credencial; les URL de projecte, claus i JWT continuen detectats amb proves negatives/positives i sense exposar-ne valors. La validació d’enllaços comprova noms de destins físics exclosos del manifest sense llegir-ne el cos: 47 referències reconegudes, zero enllaços realment absents en el manifest públic.

Build web i WordPress correcte; avís informatiu de chunk web major de 500 kB i feed Mur seed buit. Design Guard passa contra el sostre existent, amb deute heretat encara present: no equival a zero infraccions. Portes cromàtica, innerHTML i RLS estàtica verificades individualment.

### Proposta de migració editorial (no executada)

La base mínima és una columna nullable `publication_date timestamptz` en `public.notes`, independent d’updated_at. Ordre necessari: desplegar migració compatible; ampliar selectors/whitelist i mapeig d’adaptadors; usar una sola data en editor/preview/publicació; afegir picker amb confirmació, cancel·lació i zona horària; provar desat i recàrrega. No implica publicació programada automàtica.

## Límits

Treball local, sense deploy, push, migració remota ni validació de backend real. No es declara que les 13+15 troballes estiguen totes tancades ni que npm run porta siga verd. Els canvis aliens preexistents i els documents de la zona humana s’han preservat. Les garanties de filesystem usen les primitives disponibles; no substituïxen aïllament del sistema operatiu contra un procés maliciós amb els mateixos permisos.

## Vincles

- [[00_index_escriptori]]
- [[260924_0245_pla_implementacio_fortificacio]]
- [[260924_0356_auditoria_claude]]
- [[260924_0357_auditoria_codex]]
