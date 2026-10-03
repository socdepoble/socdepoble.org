---
type: informe
status: esborrany
description: 'Auditoria refutada de la petorreta 261002_1245: tractor de fatiga, login i Persona, gestoria 3T, Small Business, TPV, WordPress, App Grid Shell, snippet i auto-reproducció.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ffcc22bb-7c72-4381-8eed-a3f88b3e82c6:6e05a18a-a2a7-4c2e-bc89-bca18471f493
---
# Auditoria Extrema de Claude: fatiga, connexió, gestió integral i enxufabilitat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ffcc22bb-7c72-4381-8eed-a3f88b3e82c6:6e05a18a-a2a7-4c2e-bc89-bca18471f493 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-02T13:24:44.898Z |
| Modificació | 2026-10-02T14:25:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), mode Ultracode amb workflows |
| Tokens consumits | Sense telemetria exacta; més de 10 milions en subagents |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-02T13:24:44.898Z: esborrany creat; contingut i verificació pendents.

2026-10-02T12:29Z–13:25Z: torn torn_ffcc22bb obert (scope code); investigació en huit dimensions (A-G) amb un investigador i un refutador adversarial per dimensió i un crític de completesa; dimensió H (Gestió Integral d'Empresa) amb fonts primàries llegides amb el navegador integrat.

2026-10-02T13:10Z–14:05Z: construcció en paral·lel del tractor de fatiga (laboratori), de la Connexió Universal i dels mòduls de banc, cadascun amb revisió adversarial i correcció; dissenys de l'App Grid Shell i dels fluxos Small Business. Durant el torn el Mestre ha afegit set directives (Gestió Integral, Small Business, App Grid Shell, snippet, Editor, autonomia, sentinelles).

2026-10-02T14:05Z–14:25Z: fusible del Mestre i aterratge. El Mestre ha netejat de l'arbre els canvis a mitges de l'Editor i els dos scripts de credencials de `scratch/`. Document completat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Resum per al Mestre

Torn de Claude (Opus 5.5, Ultracode) sobre la petorreta [[261002_1245_prompt_claude_alarma_fatiga]] i set directives més que han arribat durant el torn. L'abast s'ha multiplicat per set; el Mestre ha activat el fusible i hem aterrat.

Què queda guanyat i verificat:

- **Fatiga.** Sabem per què MarIA no va avisar als 177 i el tractor està construït al laboratori `261002_1510_tractor_fatiga_claude`, amb 90/90 proves de node verdes, calibratge contra les dues sessions saturades reals i un pla de mutació que l'executor accepta. S'instal·la amb la lease del Mestre.
- **Connexió universal.** Totes les portes d'entrada aterren a `/el-meu-perfil`. La Persona ja naixia sola (el trigger existia): el que faltava era vore la fitxa d'una altra persona, i ara hi ha la RPC `perfil_public`, escrita i provada però **no aplicada** a cap base de dades.
- **Banc.** Tres mòduls purs nous (Norma 43, moviments del banc i conciliador) amb proves. No estan endollats a la Gestoria i no invaliden cap empremta signada.
- **Auditoria Extrema.** Nou dimensions investigades i refutades de manera adversarial. Nota global orientativa: **4,1/10** (taula del §2); qualificació per categories al final del document.

Què no ha aterrat: el snippet del Workspace i les reparacions de l'Editor. El Mestre n'ha netejat els canvis a mitges. Queden com a contracte per a demà (§4.2).

Què és urgent abans de cap `git push`: credencials i dades personals en commits locals no publicats, plans privats dins del `rag-index.json` públic i fixtures del banc amb valors reals (§5).

### 2. Nota de l'Auditoria Extrema

Cada nota és la que ha deixat el refutador adversarial de la dimensió, sobre la rúbrica de l'investigador. Les escales no són idèntiques (unes són mitjanes de subeixos i una és suma); la global és la mitjana simple dels eixos amb nota i s'ha de llegir com un judici orientatiu, no com una mesura (auditoria_canonica.md: cap puntuació inventada).

| Eix | Nota | D'on ix |
| --- | --- | --- |
| A · Tractor de fatiga (abans d'este torn) | 3 | Sensor existent però sense endollar; cap prova; canal viu sense dades |
| B1 · Arquitectura atòmica i hiper-enxufable | 4,8 | Contracte de 32 mètodes i un sol import de supabase-js; un sol adaptador real, el mode local dins de l'adaptador Supabase, doctrina de Sollutia contradictòria en quatre fonts |
| B2 · Auto-reproducció des de la web | 3 | Filosofia i contracte d'incrustació publicats; ni codi, ni esquema SQL, ni arrencada sencera |
| C · Gestoria amb dades reals | 5 | Full trimestral i plantilla bons; cap lectura bancària ni conciliació abans d'este torn |
| D · TPV, comerços i Nevera | no aplica | Només disseny: no hi ha codi de TPV |
| E · WordPress i Sollutia | 4,5 | Plugin robust i provat; fuita de plans privats al RAG i cap llista tancada del que Sollutia ha de lliurar |
| F · Connexió universal | 5 | Sessió i trigger sòlids; visibilitat, tornada i higiene de credencials febles |
| G · Governança del torn | 3,5 | Portes serioses, però contradiccions entre la petorreta, els hooks i el que Claude pot escriure |
| **Global orientativa** | **4,1** | Mitjana de set eixos |

Lectura de trellat: el Mas no està mal construït; té massa maquinària que no està endollada i massa doctrina que es contradiu. La millora més barata no és afegir peces, és endollar o retirar les que ja hi ha.

### 3. Què s'ha guanyat en este torn

#### 3.1 Tractor de fatiga (laboratori amb lease)

Per què MarIA no va avisar als 177 artefactes (FET, refutat):

1. `tooling/brain/termometre_context.mjs` existix des del 20-09, però només l'importa `.agents/hooks/preflight_matrix_wrapper.mjs`, i cap host executa eixe embolcall: `.agents/hooks.json` només registra `antigravity-hook.mjs`.
2. Encara que s'executara, l'embolcall fa `throw` a stderr i deixa stdout buit: el model no veuria mai l'avís.
3. El hook viu sí que corre abans de cada crida al model (2.510 invocacions des del 30-09) i el seu missatge efímer arriba de veres (51 a la transcripció dels 177), però `decidix` crida `preInvocation(ctx)` sense el payload: no pot mesurar res.
4. El cas 4 de `core-context-panic` depén d'introspecció: el model no veu `.user_uploaded`.

Mesures reals: la sessió dels 177 tenia 96 captures PNG i 81 notes de veu WebM/Opus (85,6 MB), 2.890 passos, 43 truncaments de context i 85 desvetlaments d'un `/schedule */10` dins de la mateixa conversa. El Mestre parla per veu: 86 de 118 torns humans no porten text escrit. A més, dues automatitzacions de Codex cada 5 minuts (ara en pausa) també amplificaven la fatiga.

Per què no s'han fet `scripts/immunitari/fatiga.mjs`, el cron ni `.immunitari/fatiga_alerta.md` del pla: un cron no pot injectar res al context del model i un fitxer que ningú no llig repetiria el patró de maquinària sense endollar. A més, Claude no pot escriure a `scripts/` ni a `.agents/` (governança).

Què s'ha construït al laboratori `02_investigacio_ia/261002_1510_tractor_fatiga_claude/`:

- `nous/tooling/brain/termometre_context.mjs`: mesurador únic i pur. Identifica la conversa només pel payload (`conversationId`, `transcriptPath`, `artifactDirectoryPath`), mai per «la sessió més recent». Mesura passos, pujades i MB. Nivells: N1 (1.200 passos, 100 pujades o 50 MB), N2 (2.000, 150, 80), N3 (2.800, 210, 110). Conserva `comptaArtefactes`, `avis` i `MISSATGE` per compatibilitat.
- `nous/tooling/gates/fatiga-hook.mjs`: segon hook amb nom, `sdp-fatiga`, a PreInvocation. Va a part del hook d'Olivera perquè el paquet pendent 260930b reescriu `antigravity-hook.mjs`. Mai llança; interruptor `.agents/runtime/fatiga-hook.off`; mode fase 0 (`.fase0`: mesura i traça sense injectar); traça a `.agents/runtime/fatiga-hook.log` amb noms de claus, sense valors.
- Política d'avís: N1 una vegada per conversa; N2 en pujar de nivell o cada 10 torns humans (apta per a veu) excepte si el Mestre escriu `#fatiga-vista`; N3 a cada torn i també quan desperta el planificador, no es pot silenciar i obliga a proposar l'Acta Marmota.
- `nous/.agents/skills/core-context-panic/SKILL.md.txt`: cas 4 reescrit amb el disparador mecànic i la frase literal del Mestre; regla nova (que el Mestre pot llevar abans d'aplicar): cap `/schedule` periòdic dins de la mateixa conversa sense ordre explícita.
- `nous/.agents/hooks.json` i `nous/.agents/cron/registre_tasques.json` (tasca `fatiga-cognitiva` amb llançador `antigravity-hook`).
- `prepara-pla.mjs`: genera el pla `sdp.mutation.v1` contrastant cada original amb el commit base 62b623339, i la Petorreta del seal.
- Fora del laboratori, ja aplicat: `src/sections/consola/mapa/construeixMapa.js` sap llegir el llançador `antigravity-hook`; `tests/fatiga-261002.test.mjs` prova el laboratori ara i els fitxers reals quan l'executor el deixe aplicat.

#### 3.2 Connexió universal: Persona i entrada directa al perfil

Causa real de «entre i em porta al Control»: la ruta per defecte ja era `/el-meu-perfil`, però el botó «Entrar» de la barra posava `?tornar=` amb la ruta actual (qualsevol, i per defecte `/xat`) i l'Onboarding l'obeïa per l'ordre T4 del 30-09.

Corregit (ordre del 02-10, que deroga T4 per a l'entrada): tota porta (contrasenya, registre amb sessió, Google per redirecció i per finestra) aterra a `/el-meu-perfil`. Fitxers: `OnboardingSection.jsx`, `useIdentitatDeLaBarra.js`, `rutaEntrada.js`, `App.jsx`, `oauthRelay.js` (neteja un `#access_token` que no ve del flux PKCE), `auth.js` (una fila absent es repara amb `completa_la_meua_alta` una sola vegada), `perfils.js`, `useCercaGlobal.js`, `indexCerca.js`, i les seues proves.

La Persona: el trigger `handle_new_user` ja creava el perfil i la pertinença al poble obert. El que la deixava «orfe» era que la fitxa d'una altra persona no s'obria en remot. Ara hi ha `supabase/migrations/2610021520_perfil_public.sql`: fitxa sencera per a la mateixa persona o si està publicada; nom, foto i poble per als veïns del mateix poble (coherent amb el §13 legal); res si ha demanat la baixa. **No està aplicada a cap base de dades.**

Pendent de decisió: abast de la visibilitat (opt-in al registre o visible per defecte), el text «El teu perfil queda privat» que contradiu el §13, el poble per defecte de producció, versionar la configuració de GoTrue, i l'entrada per codi de correu (OTP) com a via més simple.

#### 3.3 Banc i conciliació (mòduls purs, sense endollar)

- `src/sections/gestoria/nucli/c43.js`: llig la Norma 43 (registres 11, 22, 23, 24, 33, 88), guarda només els 4 últims dígits del compte, treballa en cèntims amb signe i valida les sumes de control.
- `movimentsBanc.js`: llig el CSV de moviments del banc i el fusiona amb la C43 (el CSV porta el nom del comerç que la C43 no porta).
- `concilia.js`: regles R1-R7 (número de factura dins del 23, CIF del creditor SEPA, import i finestra de dates, 1:N per quotes d'IVA, divisa amb comissió, rebut per número, anul·lacions); torna parelles amb confiança i incidències, i no modifica res.
- Proves: 57 vitest noves; la Gestoria passava 1.339/1.339 en tancar la construcció. `tests/gestoria-c43-real.test.mjs` llig l'extracte real i només afirma agregats (825 registres, 317 moviments, 147 al 3T).
- Cap empremta signada s'invalida: ningú importa encara els mòduls. Endollar-los vol un pla i tornar a signar el tractor (WebAuthn).
- El revisor va trobar defectes P2 (R1 pot fabricar una cita, R2 creua mesos amb quotes iguals, R5 sense finestra amb registre 24, R7 sense límit de dies) i que la porta Pedra Seca LLEI_08 passaria de 14 a 17 avisos. Queden per al pròxim torn de banc.
- La fixació de dades reals a les proves es tracta al §5.

#### 3.4 Gestoria 3T: el que diuen les dades

L'extracte del 3T és una Norma 43 vàlida que cobrix de gener al 2 d'octubre (147 moviments al 3T). L'xls del banc és BIFF8 real. Defectes del mòdul actual: un justificant de transferència («Justi_…») entra com a factura; dues factures de Sollutia del Kit Digital (1T) es paguen al 3T només per l'IVA; una factura en USD té una comissió de canvi separada; els rebuts s'aparellen per import i no pel número de factura que porten.

Factures que només el banc delata (sense PDF a la carpeta del 3T): una de Som Energia (FE26…618), tres rebuts de Lowi (els dos PDF xifrats probablement no són còpies), Google Cloud Platform, el forat RH6NJLVP-0004 d'Anthropic i el setembre d'un dels dos comptes de Google. El termini del 303 i el 130 del 3T acaba, segons la baralla de formació del repo, el 20 d'octubre: cal que el Mestre ho confirme amb la gestoria.

Qüestions per a la gestoria (no són consell fiscal): plantilla canònica (la negra/grisa dels xlsx del 14-07 o la verda del 04-07), IVA de les factures d'Anthropic (dues entitats, IVA espanyol repercutit) davant de Google (inversió del subjecte passiu), criteri de conversió de l'USD, i on van les quotes d'IVA del Kit Digital.

### 4. Contractes dissenyats (per als torns següents)

#### 4.1 App Grid Shell: relleu de la barra lateral per app

Requisit fonamental del Mestre: en entrar a una app (la Gestoria o qualsevol plugin), el menú lateral principal de Sóc de Poble desapareix i el substituïx el menú propi de l'app (referència: la Gestoria antiga amb «Panell de Control» i Tauler d'Inici, Facturació, Contactes, Burocràcia, Bancs, Impostos, Informes, Escàner Local).

Contracte proposat: cada app declara un manifest de navegació (id, títol de capçalera, entrades amb id, etiqueta, icona i ruta, entrada per defecte, permisos, privada o DEV) i la closca fa el relleu. La fletxa de la barra blava torna a Sóc de Poble. `aria-current` només a l'entrada activa. Un plugin de WordPress o Sollutia ha de poder registrar la seua app sense tocar el nucli. Baseline 2022, sense `:has()` ni `style=`.

**Clàusula innegociable dels slugs i la memòria de navegació (ordre del Mestre, 02-10-2026):** «Tot estat profund de l'aplicació ha de tindre el seu reflex immediat a la barra d'adreces del navegador (slugs i rutes de secció).» En entrar a una entitat (p. ex. «Gent de la Torre» o un comerç), la URL distingix exactament la secció (`/muro`, `/chat`, `/factures`...). Un enllaç copiat o enviat per WhatsApp obri exactament eixa secció a qui hi fa clic. Cap automatització, panell ni sentinella pot amagar la navegació. Conseqüències de disseny:

- cada entrada del manifest de navegació d'una app porta la seua ruta, i el relleu de barra lateral es deriva de la URL, no d'un estat intern;
- tornar arrere i avant del navegador ha de recórrer les seccions;
- el snippet i els diàlegs no poden canviar de secció sense canviar la URL;
- col·lisió coneguda: incrustada a WordPress, l'App usa un router en memòria; allí la ruta s'ha de reflectir a la URL de la pàgina amfitriona (paràmetre o fragment), perquè l'enllaç compartit també obriga la secció;
- el pla d'implementació de l'App Grid Shell que es cree en el torn en blanc ha d'heretar esta clàusula literalment, i la skill `sdp-app-grid-shell` l'ha d'incloure.

Conflicte a resoldre: el pla de l'Arbre Genealògic [[261002_0205_pla_implementacio_arbre_genealogic]] §7 diu que l'arbre «conserva la barra lateral de la closca amfitriona». El Mestre ha de dir si l'App Grid Shell també el governa.

#### 4.2 Universal Workspace, snippet i Editor (criteris d'acceptació)

No ha aterrat; queda com a contracte, amb les investigacions ja fetes (mapa del codi, mesures de responsivitat, doctrina i regressions):

1. El snippet és el mateix Universal Workspace en mode compacte, obert des de la Pàgina Universal en publicació o vistes i des d'altres pàgines, per desar la pàgina actual en una carpeta amb el bloc de píndoles blaves de metadades. Ha de servir després de bookmarklet o extensió.
2. Snippet i Workspace complet comparteixen una sola font de breakpoints i plegat.
3. La columna de carpetes comença tancada al snippet i a l'inici del Workspace.
4. En pantalla menuda, el Workspace passa a l'estil del snippet sense el fons blanc inútil.
5. Carpetes niades efectives i visibles fins a 3 nivells.
6. Mentre s'escriu una nota, la previsualització central és la Universal Card, no la capçalera sencera.
7. La barra blava es manté visible a l'Editor; els seus botons queden desactivats (`aria-disabled`) i, en clicar-los, un missatge ràpid explica què faran quan la pàgina estiga publicada.
8. Fora els buits morts a les caixes de carpetes i etiquetes, i els botons blaus gegants de l'edició desapareixen o es compacten quan el contingut ja s'ha triat.
9. Clàusula dels slugs (§4.1): la carpeta, la nota i la secció obertes es reflectixen a la URL, i un enllaç copiat obri exactament eixe estat.

La skill `sdp-app-grid-shell` s'ha d'actualitzar amb estes regles (amb lease).

#### 4.3 Gestoria de Poble amb Claude for Small Business

Font identificada i confirmada pel Mestre: el connector `small-business` d'Anthropic (knowledge-work-plugins; v0.3.0 amb 15 skills, ara v1.35.1 amb 44). Doctrina oficial, idèntica a la nostra matriu d'autoritat: «Claude does the work; you approve before anything sends, posts, or pays.» Cap agent envia, paga, presenta a l'AEAT, signa ni publica.

| Eina oficial | Departament | Peça local de Sóc de Poble | Porta humana | Connector |
| --- | --- | --- | --- | --- |
| Getting a pulse on your business | Tauler d'Inici | Report en text amb dades llegides; «no llegit» si falta | Només informa | Cap |
| Invoice chaser | Facturació | Esborranys de recordatori | Enviament manual | Gmail o M365 opcional |
| Margin analyzer | Facturació, TPV i Comerços | Escandalls i marges des de factures i TPV | Preus els decidix el negoci | Cap |
| Planning payroll | Bancs i Tresoreria | Previsió de caixa des de la C43 conciliada (sense nòmina dels EUA) | Cap pagament | PayPal opcional |
| Month-end prepper | Bancs i Tresoreria | `c43.js`, `movimentsBanc.js`, `concilia.js` | Aprovació per empremta | QuickBooks no |
| Closing the month | Informes | Resum de pèrdues i guanys en llenguatge planer | Enviament a la gestoria manual | Cap |
| Tax-season organizer | Impostos | Esborrany 303/130 (res de 1099) marcat «no és una declaració» | El Mestre lliura a la gestoria | Cap |
| Lead triager | Contactes | Seguiment de contactes i reserves | Cap missatge sense confirmació | HubSpot no |
| Contract reviewer | Burocràcia | Lectura planera amb senyals de risc, després d'anonimitzar (Llei 05) | Signatura humana | Docusign només per a signar a mà |
| Running your next campaign | Màrqueting (nou) | Pla de 30 dies amb `core-identitat-visual` | Publicar és humà | Canva opcional |
| Content strategist | Màrqueting (nou) | Pla de continguts des de vendes agregades | Publicar és humà | Cap |

Condicions: els connectors estan desactivats per defecte i les dades de la gestoria van amb `xarxa: 'cap'`; tot el que isca cap a un model extern s'anonimitza (Llei 05); emetre factures definitives amb programari propi cau dins de VeriFactu (RD 1007/2023). Perquè Claude opere de veres: obrir una sessió nova perquè carreguen les skills del plugin i ampliar `hooks-local` (avui bloqueja ListPlugins, SearchPlugins, WebSearch, WebFetch i qualsevol MCP de plugin) amb lease.

#### 4.4 Els 7 sentinelles d'autonomia (contracte aprovat; construcció en torn en blanc)

Contracte comú `sdp.sentinella.v1`: id, descripció, disparador, què llig i què escriu, xarxa (`cap` per defecte), dades personals, nivell L0-L2, eixida (bandera groga o roja, o informe en text), superfície (Tauler d'Inici, departament de l'App Grid Shell o Consola), porta humana (el sentinella proposa; l'humà aprova abans d'enviar, publicar o pagar) i proves. Doctrina a `.agents/skills/<id>/SKILL.md` (amb lease), mecànica en mòduls purs de `src` amb proves, i registre declaratiu a `.agents/cron/registre_tasques.json` amb un llançador que el Mapa puga verificar. Els informes «de nit» es calculen en obrir el Tauler l'endemà: no depenen d'un dimoni que pot no estar engegat.

| Sentinella | Disparador | Fa | Superfície |
| --- | --- | --- | --- |
| 1. Estructural (permisos i Connexió Universal) | En arrencar la sessió i capa estàtica al pre-commit | Contrasta sessió, perfil i pertinença amb un contracte propi derivat de les migracions; proposa la reparació (`completa_la_meua_alta`); de nit, RLS, migracions i `dist-secrets` | Consola |
| 2. Triturador Financer | Fitxers deixats a una carpeta de la Pàgina Universal | CSV, PDF i Norma 43 en lot local amb `c43.js`, `movimentsBanc.js`, `concilia.js` i el tractor de factures; assentaments i discrepàncies d'IVA pendents d'«Aprovar» | Bancs, Facturació, Impostos |
| 3. Cònsol de Vendes | En obrir el Tauler | Report en text des dels TPV adherits i els escandalls: on es perd i on es guanya | Tauler d'Inici |
| 4. Policia del Disseny | Proves vitest i `design_guard` al pre-commit | Pedra Seca i `sdp-app-grid-shell` com a regles que fallen abans del commit | Consola |
| 5. Auditoria d'Aparador | Carpeta d'imatges d'un comerç | Resolució, proporció, pes, format i EXIF GPS en local; revisió estètica multimodal només com a proposta | Comerços |
| 6. Enllaç del Torn | Tancament de torn al TPV | Nota de traspàs: vendes atípiques, caixa, incidències | TPV |
| 7. Detectiu del Poble | En obrir el Tauler | Punts de dolor recurrents de la bústia i la Pàgina Universal, anonimitzats | Tauler d'Inici |

Ordre recomanat: F1 (1, 2, 4), F2 (3, 6), F3 (5, 7). Cada sentinella nou necessita el seu flux aprovat a la Wiki (lliçó 261002).

#### 4.5 Llavor d'auto-reproducció

Resposta a «què ens falta perquè una IA reproduïsca el sistema llegint només la web»: el codi, l'esquema SQL i l'arrencada sencera. La filosofia i el contracte d'incrustació ja hi són. Proposta: un paquet publicable «Llavor» amb el contracte d'enxufe, l'esquema SQL de les migracions, el manifest de mòduls, el genotip i el procediment d'arrencada, i (decisió del Mestre) l'accés al codi. Requisit previ innegociable: netejar abans l'índex de git (§5), perquè un `git archive` d'avui publicaria credencials i plans privats.

#### 4.6 Sollutia: llista tancada del que ha de lliurar

Perquè l'enxufe funcione sense tocar codi: URL del backend i clau pública; orígens CORS permesos; emissor i audiència dels JWT i la forma del token; URL del relé OAuth; format del tenant (el codi exigix UUID a `src/config/backendConfig.js`); les RPC del contracte amb les seues formes jsonb; límits de peticions i el contracte d'errors. Cal fixar per escrit quin «Model» d'enxufe és el vigent: hui quatre fonts es contradiuen (AGENTS §8, l'ADR-2026-09 en esborrany, `src/GLOSSARI.md` i `src/ARCHITECTURE.md`).

### 5. Seguretat abans de cap push

1. **Credencials i dades personals en commits locals no publicats.** El Mestre ha esborrat `scratch/create_users.js` i `scratch/set_roles.js` de l'arbre, però continuen a la història local amb el `docker.env` de `supabase/.temp` (valors de demostració de la CLI: no cal rotar-los), la línia 44 de [[../10_actes/261002_1300_acta_marmota]] (contrasenya de prova) i un fitxer de `.sdp-paperera` amb una adreça personal repetida. Segons les refs locals, res posterior al 20-09 s'ha empés. Cal fer commit de les baixes i reescriure els commits locals abans del push. Ho decidix i ho fa el Mestre.
2. **Plans privats publicats.** Dos documents de `02_saber` amb `visibility: private` són dins de `rag-index.json` (tres còpies) i `slugIndex.json`. Cal regenerar el RAG filtrant per visibilitat i comprovar què servix el lloc en viu.
3. **Fixtures del banc amb valors reals: resolt.** El revisor va trobar valors de l'extracte real a les proves noves; en tancar, ja no en queda cap (detall a Verificació).
4. **Pre-commit saltat (inferència forta).** Amb els torns oberts, el pre-commit no podia passar; els commits d'avui s'han fet saltant-lo.
5. **Escàner de secrets sense endollar.** `tooling/lib/dist-secrets.mjs` ja detecta JWT i claus de Supabase, però no està al pre-commit. `set_roles.js` donava superadmin a tots els usuaris de la instància: si es recrea, que reba un sol usuari.

### 6. Decisions del Mestre

1. Netejar la història local (§5.1) i decidir la regeneració del RAG (§5.2) abans de cap push.
2. Aplicar el laboratori de fatiga amb lease i passar-lo una sessió en fase 0 a l'IDE real; triar llindars, paraula de reconeixement i la regla dels `/schedule`.
3. Aplicar `2610021520_perfil_public.sql` a la base local i de producció, i decidir l'abast de visibilitat i el text del formulari.
4. Gestoria 3T: confirmar la plantilla, aconseguir les factures que falten i portar les qüestions d'IVA a la gestoria abans del 20-10.
5. Banc: corregir els P2, decidir LLEI_08 i fer el pla del tractor `gestoria.banc` amb reaprovació.
6. Aprovar el contracte de l'App Grid Shell amb la clàusula innegociable dels slugs, actualitzar `sdp-app-grid-shell` i resoldre el conflicte amb l'Arbre §7 i amb el router en memòria de WordPress.
7. Obrir un torn en blanc per al Workspace, el snippet i l'Editor (§4.2).
8. Ordre de construcció dels 7 sentinelles.
9. Sessió nova amb el plugin Small Business carregat i ampliació de `hooks-local` per a les eines de lectura de plugins.
10. Cristal·litzar la lliçó de memòria com a skill (§8).

### 7. Relleu per a ESTAT i LEDGER

Claude no pot escriure a `.agents/` (governança). Text per a MarIA o el Mestre:

- ESTAT_ACTUAL · 2026-10-02 · Claude · Auditoria Extrema i aterratge. Torn torn_ffcc22bb; auditoria [[261002_1525_auditoria_claude]]. Fet: laboratori de fatiga (90/90 proves de node, pla acceptat per l'executor), login directe a /el-meu-perfil i RPC perfil_public (migració sense aplicar), mòduls de banc purs. No aterrat: snippet i Editor (netejats pel Mestre). Pendent: lease de fatiga, aplicar la migració, neteja de la història i del RAG abans de cap push, factures del 3T abans del 20-10, sentinelles en torn en blanc.
- LEDGER: `261002 | auditoria | claude | fatiga al laboratori, login al perfil, banc pur, 7 sentinelles en contracte`.

### 8. Lliçó de governança: memòria en pedra, no en caixa negra

El hook ha impedit que Claude escriga en la seua memòria persistent local. El Mestre ho ha definit com una defensa: cap aprenentatge en una caixa negra propietària; qualsevol aprenentatge a llarg termini es cristal·litza en Markdown com a skill a `.agents/skills/`. Claude no hi pot escriure. Lliçó proposada per a la secció «Lliçons del Mestre» de `.agents/skills/core-automillora/SKILL.md`:

`261002 · La memòria del Mas viu en pedra: el que un agent aprén a llarg termini es cristal·litza com a skill en Markdown a .agents/skills/ (amb lease), mai en una memòria privada de l'agent.`

Aprenentatges d'este torn per cristal·litzar: les eines que bloqueja `hooks-local` (Write fora del repo, ListPlugins, SearchPlugins, WebSearch, WebFetch, Monitor, shell composta) i que un workflow no es pot editar a mitges (cal aturar-lo i rellançar-lo).

### 9. Qui executa i qui verifica

| Tasca | Executa | Verifica |
| --- | --- | --- |
| Instal·lar el tractor de fatiga | El Mestre (lease i executor) | MarIA en una sessió real en fase 0 |
| Aplicar `perfil_public` | El Mestre | Codex amb proves de RLS amb sessió real |
| Netejar història i RAG | El Mestre | Codex amb `dist-secrets` i rg |
| Banc: P2 i pla del tractor | Claude | Codex |
| Workspace, snippet i Editor | Claude, torn en blanc | MarIA al navegador i Codex |
| Skill `sdp-app-grid-shell` i lliçó de memòria | Claude prepara el laboratori; el Mestre aplica amb lease | MarIA |
| Sentinelles | Claude per fases | Codex; el Mestre aprova cada flux a la Wiki |
| VeriFactu i fiscalitat | La gestoria i Perplexity per a fonts | El Mestre |
| Relleu d'ESTAT i LEDGER, Acta Marmota, Escriptori | MarIA | El Mestre |

### 10. Retroalimentació de la plantilla prompt_local

- La petorreta demana escriure a `scripts/` i `.agents/`, que el hook prohibix a Claude. Cal un camp «Abast d'escriptura» que diga què va amb lease.
- Les seccions `[pendent]` (Preflight, Model IA) arriben a l'agent sense omplir.
- Sis macro-objectius en un sol torn porten justament a la fatiga que el torn volia evitar: una petorreta per objectiu.
- MarIA va editar la petorreta sis vegades sense actualitzar Modificació ni l'Historial del Registre.
- El pla 0045 diu alhora «aprovat» i «Aprovació humana: pendent».
- La ruta `auditoria` copia al document la frase «Esta guia és consultiva…», que és de la guia i no de l'informe.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Proves executades per Claude al tancament:

- `node --test tests/fatiga-261002.test.mjs tests/antigravity-hook.test.mjs tests/backend_consolidacio.test.mjs tests/migracio-perfil-public.test.mjs tests/migracio-identitat-f1.test.mjs`: **90/90 verdes**, 0 fallades. Inclou el calibratge contra les transcripcions reals de les sessions 23b0cc39 i ab2072b5, el procés real del hook amb un brain fals, i que `prepara-pla.mjs` genera un pla que el `validatePlan` de l'executor accepta.
- `npx vitest run` sobre `src/data`, `src/sections/onboarding`, `src/sections/search` i la identitat: `src/data/sessionService.test.js` (7 roges) i `src/data/supabase/organizations.test.js` (3 roges) fallen com ja fallaven al commit de partida 62b623339 (exigència d'UUID del tenant i fixtures a mitges). Les traces «tenant_id requerix format UUID, rebut "test-demo"» de `OnboardingSection.jsx:77` vénen d'un mock antic de l'entorn de proves, segons el diagnòstic que el Mestre ha rebut; el soroll no ha deixat vore el recompte final i no el done per verificat.

Verificació adversarial: cada troballa de les nou dimensions ha passat per un refutador independent que ha tornat a obrir els fitxers i repetir les ordres; les refutades no entren en esta auditoria i les parcials hi entren amb la correcció. Cada construcció ha tingut un revisor i un corrector.

Banc: el revisor va donar «acceptable amb correccions»; Gestoria 1.339/1.339 en acabar la construcció. El corrector es va aturar en el fusible. Després, un agent acotat ha netejat les fixtures (§5.3): dates passades a l'any 2099, descriptors de comerç, imports i saldos substituïts per valors sintètics coherents en `c43.test.js`, `movimentsBanc.test.js`, `concilia.test.js` i tres comentaris de `concilia.js`. Comprovació amb `rg -F` de cada literal contra l'extracte i el CSV reals: cap coincidència; cap patró de DNI. `npx vitest run src/sections/gestoria`: **39 fitxers, 1.347 proves verdes**. Es conserven les etiquetes fixes del banc (text de plantilla que el lector necessita) i les diferències que ixen del càlcul. `tests/gestoria-c43-real.test.mjs` no porta cap valor real literal.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No s'ha consultat cap base de dades: ni la local ni la de producció. Tot el que es diu de Supabase ve de llegir les migracions; `perfil_public` no s'ha aplicat ni provat amb una sessió real.
- El tractor de fatiga no s'ha provat dins de l'IDE d'Antigravity: falta confirmar que el payload real de PreInvocation porta `conversationId` i `transcriptPath`, i que l'IDE fusiona els avisos de dos hooks. Per això existix la fase 0.
- No s'han llegit els valors del `docker.env` ni cap credencial; la classificació «valors de demostració» ve de comparar patrons.
- No s'ha comprovat què servix el lloc en viu ni si el repositori del fork és públic.
- Les qüestions fiscals (IVA d'Anthropic i Google, VeriFactu, termini del 3T) són preguntes per a la gestoria, no conclusions.
- El snippet i les reparacions de l'Editor no han aterrat; les construccions s'han aturat en el fusible i el Mestre ha netejat els canvis a mitges.
- No s'ha llegit `_wiki_de_poble/90_arxiu_historic/`.
- Les dades de la gestoria s'han llegit en local i a l'auditoria només hi ha agregats.

## Estat de l'Art i Qualificació

### Qualificació de la IA (criteri expert, no mètrica de navegador)

Puntuació de 0 a 100 amb el criteri de Claude després de llegir el codi, les proves i les portes d'este torn. «Projectada» suposa aplicades totes les correccions d'esta auditoria i els set sentinelles (els cinc del catàleg i els dos del front d'autonomia).

| Categoria | Nota actual | Nota projectada | Per què |
| --- | --- | --- | --- |
| Accessibilitat | 62 | 85 | Hi ha bona base (focus, rols, textos en valencià), però `aria-current` fix en columnes, botons de l'Editor sense estat clar i un deute d'accessibilitat documentat a les fletxes. La Policia del Disseny ho fixaria en proves. |
| Usabilitat | 55 | 82 | L'entrada portava a llocs aleatoris (ja corregit), el Workspace es trenca en pantalla menuda, hi ha buits morts i botons gegants a l'Editor i el Panell de Control té massa botons solts. |
| UX «Pedra Seca» | 60 | 86 | Doctrina madura i `design_guard`, però regressions recents (Universal Card, barra blava) i 14 avisos de LLEI_08. Amb l'App Grid Shell per app i la Policia del Disseny, la coherència deixaria de dependre de la memòria. |
| SEO | 55 | 78 | Hi ha manifest SEO i rutes privades amb `noindex`, però la Wiki només es llig executant JavaScript, falta l'OpenGraph promés i el RAG publica dos documents privats. |
| Resiliència del codi | 50 | 80 | Milers de proves i portes serioses, però proves roges a la base, maquinària sense endollar, un sol adaptador de backend, una capa local no documentada i commits que salten el pre-commit. |
| Seguretat i privacitat | 52 | 85 | RLS, `security definer` i `search_path` buit ben fets; credencials en la història local, plans privats al RAG i l'escàner de secrets sense endollar. |
| **Mitjana** | **56** | **83** | |

### Anàlisi d'iniciativa

Cada peça té parents coneguts. El *local-first* té els seus referents (l'assaig d'Ink & Switch de 2019, Obsidian, Anytype, Logseq); els espais de treball amb carpetes i snippets, en Notion i Raindrop; els TPV que funcionen sense xarxa, en Loyverse o en el mode offline d'Odoo; les suites obertes d'empresa amb TPV i comptabilitat, en Odoo i ERPNext; la participació ciutadana, en Decidim; l'autoallotjament comunitari, en Nextcloud o YunoHost; i els agents d'IA per a petites empreses, en Claude for Small Business i els assistents de Shopify o Intuit. El que no conec, amb el coneixement que tinc i sense haver-ho pogut contrastar amb una cerca en este torn, és una peça que les fonga totes a escala de poble: un sistema operatiu comunitari en valencià, amb el backend com a endoll intercanviable, incrustable en WordPress, on cada app porta el seu propi menú dins d'una closca comuna, on la gestoria i el TPV funcionen sense xarxa i els agents només proposen mentre la persona aprova, i on la meta declarada és que els constructors deixen de ser necessaris. No és un equivalent exacte de res; és una via nova feta amb pedres conegudes. El risc també és nou: la mateixa ambició que el fa únic és la que ha multiplicat per set l'abast d'este torn. Per a esdevenir «innecessaris», el camí és endollar i simplificar abans que afegir, perquè un sistema que es val per si mateix és un sistema amb poques peces i totes vives.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261002_1245_prompt_claude_alarma_fatiga]]
- [[261002_1245_pla_implementacio_alarma_fatiga]]
