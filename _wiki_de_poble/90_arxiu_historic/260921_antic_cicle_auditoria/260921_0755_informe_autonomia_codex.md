---
type: informe
status: esborrany
description: Barreres verificades per a autonomia LLM i proposta de cicle obligatori amb el Calendari Agricola com a prova.
---
# Consell — Autonomia Plug & Play

## Registre i abast
- Identificador: SDP-INFORME-AUTONOMIA-CODEX-260921.
- Agent: ChatGPT Codex. Propietari: Consell. Aprovació humana: pendent.
- Entorn local, HEAD d79bd0f9 més canvis previs sense confirmar. Sense cerca web, secrets ni connexions a producció.
- Auditoria dirigida de Brain, entrada/eixida, Pedra Seca, contracte agrícola, Supabase i notificacions. No és una revisió exhaustiva de tot el codi ni una certificació de producció.
- Contraste amb els informes de Codex 0653, Claude 0701 i el pla de MarIA 0655. Les seues notes numèriques no són telemetria ni es traslladen a aquest dictamen.

## Dictamen
Podria començar el mòdul i construir una versió de proves. No puc acreditar hui el lliurament autònom complet fins al mòbil real. Hi ha fonaments reutilitzables (components, tokens, adaptadors Supabase, SQL, portes i CI), però el cicle encara depén d'interpretació humana i reparacions de governança. La identitat es pot transmetre; la competència i el lliurament s'han de provar.

## Proves actuals
| Comprovació | Resultat |
| --- | --- |
| cataleg_skills.mjs --check | exit 0, 17 skills coherents |
| reflex_petorreta.mjs doctor --ci | exit 1: AGENTS arrel absent, corpus/baseline divergent i canvis no durables |
| obrir_torn.mjs | exit 0, declara el Mas net |
| tancament.mjs --json | exit 1: 22 ORPHAN_OPERATIVE i 1 PEDRA_SECA_INLINE_STYLE |
| Reflex open/seal per a aquest informe | open injecta una plantilla; seguir literalment el protocol crea un tercer fitxer i seal el rebutja. Resolució local: retirar només la còpia temporal injectada, verificada idèntica a l'original; seal passa |

El catàleg i la separació Despertar/Somiador ja estan corregits respecte dels informes anteriors. Somiador també comprova col·lisions. No repetisc aquests defectes com si continuaren igual.

## P1 — Arrancada i autoritat no portables
**Evidència:** falta AGENTS.md a l'arrel; BOOTSTRAP encara apunta a skills/pedra-seca, ruta reanomenada. El protocol d'auditoria canònica encara enumera taxonomia antiga i porta:esquemes, absent de package.json. hooks.json només enumera noms d'eines d'un entorn concret.
**Impacte:** una IA nova pot no descobrir les regles o topar amb instruccions impossibles; no basta afirmar que el BIOS sempre es carrega.
**Correcció:** entrada arrel mínima cap a fonts úniques; validar totes les rutes/comandes publicades; adaptador d'eines per agent i prova d'arrancada des de clon net. Manifest de capacitats (lectura, edició, shell, proves, permisos) i diagnòstic JSON estable. No duplicar la Constitució per cada marca.
**Decisió humana:** no per a coherència de rutes; sí per a fixar els límits de delegació.

## P1 — Les portes no comparteixen una precondició efectiva
**Evidència:** obrir_torn comprova SDP-LOCK, però no la salut que doctor acaba de rebutjar. porta-reflex busca literalment reflex:; JSON invàlid o payload desconegut pot acabar en exit 0. SCC usa 04_ESCRIPTORI/00_Bandeja_d_Entrada mentre les carpetes reals són minúscules; captura errors de lectura i pot saltar comprovacions. Açò importa especialment en Linux.
**Impacte:** absència de pany es presenta com a salut; un rebut textual no demostra lectura ni neteja. La lease criptogràfica del Reflex és més forta, però no equival a mediació universal de totes les escriptures.
**Correcció:** estat únic del cicle i operacions mediades; qualsevol error d'I/O o payload desconegut falla. CI valida sobre arbre versionat i prova també Linux sensible a majúscules. No relaxar baselines per fabricar verd.
**Decisió humana:** no per a corregir falsos verds.

## P1 — Neteja semàntica sense contracte executable
**Evidència:** wiki-documentacio-i-reflex exigeix destil·lar i retirar brossa; AGENTS §12 protegeix treball pendent i producció humana. Somiador agrupa per nom/mida, encara confia que l'agent haja destil·lat, mou documents sense estat de tancament, contempla l'arxiu extern prohibit pel protocol i absorbeix errors del Llaurador. No s'ha executat sobre l'escriptori real.
**Causa de l'oblit:** la skill és una instrucció recuperable, no una precondició del sistema. Brossa no té predicat mecànic. Reconnectar Somiador cegament a Despertar retiraria memòria viva.
**Decisió humana:** sí per a la política d'arxivament i delegació; no cal decidir document a document quan la política ja ho determine inequívocament.

### Tractor proposat: cicle obligatori, no esborrat obligatori
1. cicle obrir crea identificador i inventari, comprova rutes, permisos, versions, treball pendent i estat real de portes.
2. higiene plan genera pla amb origen, destí, hashes, estat d'episodi i motiu. Només arxiva documents explícitament tancats amb destil·lació i pendents preservats en context actiu. Antiguitat i nom no basten.
3. higiene aplica exigeix lease lligada al pla, bloqueig de concurrència, preimatges, comprovació prèvia de totes les col·lisions, registre durable i recuperació d'interrupcions. Exclou producció humana i arxiu extern.
4. Recalcula ancoratges i genera rebut amb digest d'inventari, pla i resultats. Fallada o mutació concurrent invalida el rebut; no hi ha missatge de descans complet si falla el Llaurador.
5. Generadors de prompt/bundle i mutadors exigeixen un cicle preparat per als scopes afectats. Quan no hi ha res arxivable, el rebut acredita una comprovació sense moviments. Cicle següent torna a verificar.
6. El tancament registra decisions, pendents, proves i acta de relleu. L'entrada següent consumeix aquest estat estructurat abans del relat lliure.

**Proves d'acceptació:** pendent conservat; tancat destil·lat arxivat; col·lisió sense pèrdua; indexador fallit dona no-zero; segon intent idempotent; interrupció recuperable; rutes Linux; fitxer concurrent preservat; producció humana intacta. El criteri és absència de residus tancats sense processar, no escriptori buit.

## P1 — El cas agrícola encara no és un contracte de producte complet
**Evidència:** sdp-calendari-agricola v2 defineix usuari/cultiu/data, UI i SMS mock, però no concreta comarca, varietat, sembra versus trasplantament, origen/versionat de dades, fus horari, recurrència ni criteris de lliurament.
**Impacte:** una IA pot produir una demo plausible inventant decisions de negoci. No és autonomia fiable.
**Correcció:** conjunt local validat de regles agronòmiques i casos de prova; model de subscripció amb baixa i preferències; dades de prova explícitament fictícies; especificació del comportament quan falten dades. No inventar dates de plantació.
**Decisió humana:** sí, validar font agronòmica, territori i canal/política de servei.

## P1 — Falta demostrar la cadena persistent fins al mòbil
**Evidència:** no he trobat implementació agrícola ni enviament SMS en les cerques dirigides de src, supabase, bot i tooling; la skill exigeix mock fins a aprovar API i costos. Un xat existent no acredita SMS. supabase/README encara prescriu aplicar SQL manualment al panell.
**Correcció proposada:** taules modulars de regles/subscripcions, cua transaccional d'avisos, treballador servidor planificat, adaptador de canal mock/real, claus de deduplicació, reintents limitats, baixa efectiva, pressupost i comprovació d'estat del proveïdor. Ha de funcionar amb el navegador tancat i distingir acceptat pel proveïdor de lliurat. Credencials exclusives del servidor.
**Decisió humana:** sí, proveïdor, cost i desplegament real. Es poden deixar preautoritzats amb límits; la IA no els ha d'inventar.

## P1 — Falta una prova executable integral del backend nou
**Evidència:** hi ha CI, proves i tractor-rls; aquest últim inspecciona SQL amb expressions regulars, no executa polítiques contra PostgreSQL. En els fitxers revisats no apareix un entorn Supabase local amb reset automatitzat i prova agrícola integral.
**Correcció:** crear base descartable, aplicar totes les migracions des de zero, provar accés entre dos usuaris/pobles, subscripció i baixa, rellotge controlat, execució repetida sense duplicats, fallada de proveïdor i recuperació. Provar també actualització d'una base anterior. Afegir aquest recorregut a CI i un desplegament reversible amb diagnòstic.
**Decisió humana:** no per a proves locals; sí per a permisos d'entorn real.

## P2 — Successió i aprenentatge encara no estan acreditats
Una Wiki pot conservar personalitat i decisions; no transfereix automàticament les capacitats del model. El Sistema Immunitari v1 tracta ferides del graf i rebutja mode autònom; no és un planificador de desenvolupament ni una avaluació de qualitat funcional.
**Correcció:** coneixement estable separat d'estat de tasques; cada lliçó amb font, cas reproduïble, abast i prova de regressió; promoció a norma revisada, no autoedició lliure de guardes. Prova de relleu amb almenys dos models diferents, inclòs un model obert, mateix clon i criteris; mesurar intervencions humanes, errors i recuperació. AGPL i Markdown són bones bases, però falta demostrar operació transferible (configuració, migracions, còpies i restauració).

## Ordre d'execució
1. Alinear entrada, contractes, rutes i portes; establir un estat versionat reproduïble sense perdre canvis pendents.
2. Implementar cicle/higiene segur aprofitant Reflex i Llaurador; provar errors i relleu.
3. Tancar especificació agrícola i completar la cadena en entorn descartable amb SMS mock.
4. Delegar explícitament permisos/costos; validar desplegament i lliurament real.
5. Repetir des de zero amb un altre model sense explicacions addicionals.

**Proximitat:** base suficient per a un pilot autònom acotat; autonomia de producció encara no demostrada. No hi ha percentatge honest sense aquesta prova. El llindar és completar el recorregut i recuperar fallades amb evidència, no afegir més regles al prompt.

## Ancoratge
- [[00_index_escriptori]]
- [[260921_0745_prompt_autonomia_llm_plug_and_play]]
- [[260921_0653_informe_auditoria_brain_codex]]
- [[260921_0701_informe_auditoria_brain_claude]]
