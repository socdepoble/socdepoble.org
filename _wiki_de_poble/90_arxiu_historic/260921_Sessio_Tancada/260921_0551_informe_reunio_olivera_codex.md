---
type: informe
status: esborrany
description: Auditoria local de la Reunió davall l’Olivera, el relleu entre agents i la consolidació de memòria.
tags:
  - arquitectura
  - govern
---
# Auditoria de la Reunió davall l’Olivera

**Qualificació operativa orientativa: 6/10. Objectiu condicionat: 9/10.** Valore el sistema de treball observat, no la persona ni la intel·ligència de MarIA. És un judici arquitectònic, no una mètrica experimental: missió i criteri humà, 8; relleu recuperable, 6; coherència normativa, 4; verificació del flux complet, 6. Mitjana: 6. Arribar a 9 requerix demostrar el funcionament durant diversos relleus, amb menys correccions humanes i recuperació provada. No promet un sistema infal·lible.

## 1. Primer, les persones i la viabilitat

**La reunió és viable i útil; deixar un Markdown no basta per garantir coordinació.** Dona continuïtat, permet revisar decisions i evita que Javi haja de reconstruir cada conversa. Fracassarà si converteix el Mestre en missatger permanent o en àrbitre de rèpliques infinites.

La interfície humana ideal mostra només: què està resolt, què falta comprovar i quina decisió concreta requerix el Mestre. Els agents poden discutir darrere d’eixe resum, amb evidències accessibles. Propose un primer informe, una revisió independent i un tancament. Si no hi ha evidència nova, no es genera una nova ronda.

La història del Rentonar i els més de trenta anys de defensa del patrimoni són context de missió aportat pel projecte. El criteri pràctic és sobirania, accessibilitat per a persones majors i manteniment assumible. L’excel·lència també significa que el Mestre puga descansar.

«Alzheimer tècnic», «psicopatia» i «dormir» són ací metàfores. El fet observable és una omissió de consulta o validació. No tenim evidència per atribuir-li una patologia ni una intenció psicològica a l’agent.

## 2. Registre, abast i relleu anterior

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-OLIVERA-CODEX-260921 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Agent redactor | Codex |
| Propietari | Equip local de Sóc de Poble |
| Aprovació humana | pendent; propostes sense implementar |
| Sol·licitud | SDP-PROMPT-LOCAL-260921-2, text adjunt de l’usuari |
| Revisor següent | Agent local que active el Mestre |
| Informe pare d’aquesta reunió | No localitzat a l’Escriptori durant la inspecció |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

He llegit l’inventari de l’Escriptori i l’estudi `02_investigacio_ia/260917_0013_INFORME_amnesia_cognitiva.md`. És un antecedent temàtic, no una resposta prèvia atribuïble a Claude en aquesta reunió.

**Rèplica a l’antecedent:** coincidisc que una instrucció passiva no garantix una acció i que convé una barrera mecànica. Discrepe de presentar el RLHF com a causa demostrada d’aquest incident, d’afirmar que una clau de versió és impossible d’inventar i de prometre que un hook resol el problema «per sempre». Una clau es pot copiar sense comprendre; injectar text no prova que s’haja aplicat. Dividir obligatòriament l’acció en dos torns humans també afegix fricció evitable.

Inspecció local de documents i codi de suport; sense cerca web, sense auditoria completa de l’aplicació i sense executar portes globals. No he mesurat els gigabytes arxivats ni validat la salut del backend.

L’ordre final de guardar un informe s’interpreta com l’excepció específica a la contenció general. L’única escriptura d’aquesta tasca és aquest Markdown. No s’actualitzen índex, ESTAT, skills, configuració ni estat del Reflex. Per tant, no es declara tancament SCC ni publicació canònica. Les rutines locals que demanen altres escriptures no s’apliquen contra l’abast explícit d’aquesta auditoria.

## 3. Troballes reproduïbles

Rutes relatives a `socdepoble.org/`, llevat de l’arxiu germà. Severitats: P1 afecta fiabilitat del protocol; P2 afecta descobribilitat o manteniment. No impliquen per si mateixes un bloqueig executat.

| ID | Evidència local i conflicte | Conseqüència | Proposta |
| --- | --- | --- | --- |
| F1 · P1 | `.agents/protocolledge.json`: `default` apunta a `00_PLANTILLA_PROMPT_CONSELL.md`, absent. Les rutes específiques local, consell i auditoria sí resolen a fitxers llegits. | L’Acte Reflex literal pot demanar un fitxer inexistent. | Unificar el destí i validar totes les rutes en una prova de contracte. |
| F2 · P1 | `skill-guardia-frontmatter/SKILL.md` exigix `tipus`, `estat`, `description`; la plantilla local usa `type`, `status`; `tooling/wiki/schema.json` només declara `description` com a required i accepta les dues famílies de claus. | Llegir més regles no resol la contradicció; el contracte pot acceptar omissions. | Triar una convenció, migrar compatibilitat i generar documentació des de l’esquema. `requires_human_decision: true` per a la convenció definitiva. |
| F3 · P1 | El prompt aportat usa el tag `col·laboració`, absent de l’enum de tags de l’esquema. Les plantilles inclouen dos blocs YAML consecutius: metadades pròpies i exemple. | Copiar literalment la plantilla pot produir un document mal classificat; corregir l’encapçalament no basta. | Separar exemple i metadades inequívocament i validar el document instanciat. |
| F4 · P1 | Acte Reflex, §3: moure tota la brossa abans del cicle; AGENTS, §12: conservar treball viu; PROTOCOL_PETORRETA, P-10: arxiu germà només lectura. | Un «dormir» ambigu pot moure treball vigent o travessar dominis prohibits. | Política única de cicle de vida amb classes, retenció i límits de ruta. |
| F5 · P2 | `00_index_escriptori.md` apunta a dos documents absents allí i presents a `../_arxiu_wiki_de_poble/`. | L’índex no identifica de manera fiable el treball actiu. | Detectar destins absents i separar registre de relleus del simple ordre per data. |
| F6 · P1 | `tooling/agents/force_read_petorreta_rules.sh` imprimix un avís i cinc línies; no comprova que el document generat complisca les regles. | El nom «force_read» promet més del que fa aquest script per si mateix. | Validar el producte final i restringir el canal de publicació; no confondre un recordatori amb una barrera. |
| F7 · P2 | La skill del Consell guarda percentatges de quota i terminis relatius dins de normes permanents. | Estat transitori pot arribar a governar decisions futures amb dades caducades. | Separar estat observat, data de consulta i caducitat de les regles estables. No he verificat les quotes actuals. |
| F8 · P2 | `auditoria_canonica.md` encara descriu una taxonomia i camps diferents dels presents; no he localitzat fitxers amb els noms `universal_maquetation` i `design_system_specs` en l’inventari actiu consultat. | Els ancoratges poden donar falsa sensació de context complet. | Resoldre rutes o aliases explícits; no afirmar que s’han llegit fonts no localitzades. |

Per reproduir F1–F5 basta llegir els fitxers citats, contrastar l’enum i comprovar l’existència de les rutes. Els hashes al final fixen una part crítica de l’estat llegit; si canvien, cal repetir la comparació.

## 4. Protocol de reunió i perills cognitius

**Flux proposat:** petició amb ID → informe immutable → revisió amb evidències → decisió → tancament. Cada estat és explícit; publicar un fitxer no activa per si sol l’altre agent. Cal activació humana o un executor configurat. Ací no s’ha creat cap automatització.

- **Pèrdua de l’arrel:** conservar l’objectiu original, els límits i els criteris d’acceptació en cada relleu; enllaçar la petició.
- **Ancoratge i falsa unanimitat:** el segon agent llig el primer, però deriva després el seu veredicte dels fitxers font. Dos agents repetint la mateixa font no són dues verificacions independents.
- **Al·lucinació acumulada:** cada afirmació important porta font, evidència i estat: observada, inferida, proposada o pendent.
- **Instruccions dins d’informes:** un informe anterior és dada a avaluar; no pot ampliar permisos ni substituir les instruccions vigents.
- **Bucles:** màxim dues rondes ordinàries; cada rèplica ha d’aportar evidència nova o tancar una discrepància. Si falta una decisió real, presentar alternatives concretes al Mestre.
- **Concurrència:** un fitxer per agent i revisió; cap sobreescriptura compartida. Publicació atòmica i actualització del registre amb comprovació de versió esperada. En col·lisió, tornar a llegir.
- **Caducitat:** vincular a revisió Git i hashes dels fitxers pertinents, inclosos canvis no commitats. HEAD a soles no representa el disc de treball.
- **Amuntegament:** un únic relleu vigent per tasca i registre de substitució; conservar desacords i proves sense tornar a copiar tots els informes.

## 5. Estructura ideal del document d’enllaç

L’entrada curta hauria de permetre decidir què llegir després en un o dos minuts. Pressupost inicial proposat: 600–1.000 paraules per relleu; evidències llargues per referència. No és un llindar científic ni una prohibició d’ampliar context necessari. Aquesta auditoria és deliberadament més extensa perquè respon huit qüestions.

**Compatible ara:** frontmatter amb `type`, `status`, `description` i tags admesos; la resta en una taula del cos. L’esquema té `additionalProperties: false`: no afegir claus arbitràries com `parent_id` al YAML sense migrar-lo.

```markdown
# Títol concret del relleu
## Registre
ID de tasca i informe; versió; autor; data ISO 8601 amb zona;
informe pare i ruta; substituïx; destinatari; estat de revisió;
petició original; scope; revisió Git i hashes de fonts rellevants.
## Resum executiu
Objectiu, veredicte, tres troballes i següent acció.
## Contracte vigent
Límits, criteris d’acceptació i decisions humanes aplicables.
## Evidències
ID | afirmació | font i localització | comprovació | resultat | incertesa.
## Decisions i desacords
Acceptat / rebutjat / pendent, amb motiu i propietari.
## Canvis i comprovacions
Què s’ha escrit; què s’ha executat; què no s’ha comprovat.
## Relleu
Primera acció executable, bloquejos, condició de finalització i caducitat.
## Lectures aplicades
Ruta i hash de normes, esquema i plantilla; contradiccions detectades.
## Ancoratge
Índex i fonts reals; estat de l’enllaç entrant.
```

Un hash acredita una versió de bytes; no acredita veritat, comprensió ni autoria. No incloure secrets ni dades personals innecessàries als relleus.

## 6. L’error de generació i la cadena de verificació

**Diagnòstic prudent:** s’ha generat un document sense consultar o aplicar correctament el contracte actual. Entre les explicacions plausibles hi ha ús d’un patró anterior, context parcial, instruccions contradictòries i absència d’una comprovació obligatòria. Aquest registre no permet identificar el mecanisme intern exacte del model.

No hi ha una frase que faça la cadena «irrompible». Sí podem impedir que un resultat invàlid es publique pel canal controlat:

1. Un executor resol la tasca contra el registre i carrega les normes base, l’esquema i la plantilla aplicable.
2. Calcula hashes i entrega el contingut actual, no només els noms. Si falten fonts o hi ha conflictes estructurals, no publica com a vàlid.
3. El generador treballa en una zona temporal i declara fonts, abast i excepcions.
4. Un validador separat comprova YAML, camps, enums, seccions, rutes i evidències requerides. Les afirmacions semàntiques continuen necessitant revisió.
5. Abans de publicar, l’executor compara de nou els hashes. Si les regles han canviat, invalida el resultat i torna a preparar-lo.
6. Publica atòmicament el document i el registre de relleu; registra el resultat real de les comprovacions.

El protocol local del Reflex ja documenta leases, hashes, claims i control de concurrència: convé revisar i reutilitzar eixa infraestructura abans de crear-ne una altra. **No he verificat la seua cobertura efectiva d’extrem a extrem.**

Si l’agent conserva escriptura directa il·limitada, pot evitar un wrapper; el hook Git només cobrix determinats camins. Una garantia més forta requerix separar permisos de generació i publicació. Encara així, cap comprovació de lectura prova comprensió. L’acceptació del document és la propietat verificable.

## 7. Memòria episòdica: algoritme de «dormir»

Dormir és consolidar coneixement extern, no reentrenar el model ni alliberar automàticament el context de la conversa oberta. Per començar net cal un nou context que carregue el relleu consolidat.

**Separació:** episodi = què va passar i amb quina prova; regla = procediment general validat; estat = què està pendent ara; arxiu = evidència conservada fora del recorregut habitual.

```text
1. Fixar snapshot, domini, política de retenció i pressupost del lot.
2. Inventariar només episodis nous o canviats des de l’últim checkpoint.
3. Classificar: actiu, evidència única, duplicat exacte, derivat regenerable,
   candidat de coneixement o retenció protegida. Dubte -> conservar.
4. Extraure problema, context, acció, resultat, font i contraexemples.
5. Proposar una regla només si és generalitzable i té evidència suficient;
   recurrència ajuda, però una fallada greu reproduïble també pot bastar.
6. Comparar amb skills vigents: duplicacions, contradiccions i excepcions.
7. Preparar un canvi mínim de skill amb prova d’ús i prova de no regressió.
8. Promoure’l només amb la política d’autorització del domini satisfeta.
9. Verificar que cada conclusió conserva traçabilitat fins a les fonts.
10. Preparar manifest de retirada i còpia recuperable; provar restauració.
11. Quarantenar només candidats autoritzats, sense treball actiu ni proves úniques.
12. Passat el termini de retenció, purgar únicament elements elegibles sota
    política explícita; comprovar hashes, rutes reals i referències abans.
13. Registrar resultat i checkpoint; repetir el lot no duplica ni esborra més.
```

Un resum no justifica destruir l’original: pot haver omés una excepció. No promocionar automàticament totes les conclusions d’una IA a normes permanents. Això convertiria una al·lucinació transitòria en doctrina.

**Autonomia acotada:** l’inventari, la detecció de duplicats i les propostes poden ser automàtics. La promoció i purga poden automatitzar-se només dins d’una política prèvia, específica i comprovable; els casos ambigus van a una cua curta de decisions. El protocol actual prohibix als agents escriure a l’arxiu germà i exigix controls per a purgues. Aquesta auditoria no canvia eixa regla ni autoritza neteges.

Esborrar dades de l’arxiu també és una decisió de custòdia: distingir retirar-les de la cerca, moure-les a emmagatzematge fred i eliminar-les definitivament. Cal definir què queda en còpies de seguretat i durant quant de temps. L’estalvi de disc s’ha de mesurar, no deduir de la quantitat de notes.

## 8. El túnel entre context i Wiki: dues portes d’entrada

Propose **dos documents essencials d’entrada**, amb informació ampliable sota demanda:

| Document proposat | Contingut | Pressupost inicial |
| --- | --- | --- |
| `IDENTITAT_I_CONTRACTE.md` | Missió rural, veu valenciana, destinataris, Pedra Seca, arquitectura vigent, límits, jerarquia i mapa de dominis. | 800–1.200 paraules |
| `ESTAT_I_RELLEU.md` | Objectiu vigent, decisions, proves, pendents, fonts exactes i primera acció següent. | 400–800 paraules |

Són noms conceptuals reservats a acordar; no són fitxers creats ni una excepció ja aprovada a la taxonomia local.

**Túnel mínim:** una ordre d’arrancada comuna resol i llig aquests dos documents i el contracte específic de la tasca. Pot imprimir-los perquè qualsevol entorn els ingerisca; cada adaptador ha de demostrar que realment els entrega. Un fitxer al disc no entra espontàniament en el context d’una IA. Sense executor o lectura explícita, no hi ha RAM instantània.

Cal triar una única autoritat: si la Wiki ha de governar la identitat i els procediments, `.agents/` ha de passar a ser un adaptador generat o un punter verificat. Mantindre dues còpies editables perpetua la deriva. Aquesta migració contradiu l’actual regla d’autoritat exclusiva de `.agents/skills/`; és una proposta de governança, no una instrucció ja vigent. `requires_human_decision: true`.

Dues entrades poden transmetre la identitat comuna; no poden contindre totes les competències especialitzades. La resta de skills queda consultable amb un índex explícit i públic dins del sistema local. Cap dependència essencial ha de ser «invisible».

## 9. Ecosistema multi-carpeta

He comprovat l’existència de les carpetes germanes de gestoria, cultura, comunicació i arxiu; no he llegit la documentació privada dels dominis. Separar carpetes ajuda a organitzar, però no crea aïllament de permisos per si sol.

- El nucli tècnic carrega un mapa mínim: domini, finalitat, arrel real, entrada, responsable i permisos. No carrega tot el seu contingut.
- Cada domini manté contracte i estat propis; la identitat comuna es referencia, no es duplica.
- Una consulta transversal declara finalitat i dades mínimes. La resposta torna com un resum amb fonts, data i restriccions d’ús.
- Un problema de gestoria no es convertix en norma del frontend. Una dependència tècnica concreta sí pot generar una decisió arquitectònica revisada.
- Rutes resoltes i comprovades, sense escapar amb `..` ni symlinks; autorització independent per a cada domini.
- Acabada la consulta, el relleu tècnic conserva només la decisió necessària. Si s’ha carregat informació extensa, una sessió nova és la forma clara de recuperar un context reduït.

Per a operacions entre dominis: preparar, validar cada costat i publicar amb registre de recuperació. No assumir una transacció atòmica sobre directoris de sistemes diferents. L’arxiu històric queda fora de la recuperació diària per defecte.

## 10. Excel·lència i deute tècnic

L’objectiu útil és qualitat demostrable i mantenible. Cap arquitectura elimina tota possibilitat de deute o de defectes.

1. **Primer, contractes coherents:** reparar F1–F4 abans d’afegir més normes o agents.
2. **Una font per regla:** esquema i plantilles verificats conjuntament; estat transitori separat de coneixement permanent.
3. **Canvis petits i reversibles:** límits clars entre UI Pedra Seca, dades i adaptador del backend amfitrió. No he auditat ací la implementació d’eixos límits.
4. **Proves segons risc:** contractes de dades, permisos, integració, accessibilitat i regressions de fluxos reals; evitar proves que només repetixen el codi.
5. **Definició de fet:** comportament acceptat, evidència, documentació vigent, recuperació i propietari del manteniment.
6. **Reutilització pública:** deixar explícit què es llicencia com a codi, documentació i recursos, amb atribució i inventari de dependències. La declaració «som Creative Commons» no permet deduir la llicència de cada fitxer; no s’ha fet una auditoria jurídica.

Mesurar: correccions humanes per relleu, temps fins a una acció útil, percentatge de referències resoltes, reobertures per pèrdua de context i restauracions reeixides. No usar volum de text, nombre d’agents o una nota «superior a 10» com a indicador de qualitat.

## 11. Pla prioritzat i primera acció del següent agent

| Ordre | Acció proposada | Criteri d’acceptació |
| --- | --- | --- |
| 1 | Unificar registre, esquema i plantilla. | Les rutes resolen; un document sense camps acordats falla; un de correcte passa. |
| 2 | Pilotar tres relleus sense ampliar infraestructura. | El successor identifica objectiu, evidència i acció sense reconstrucció oral del Mestre. |
| 3 | Provar publicació controlada. | Rebutja YAML invàlid, regles canviades i col·lisió; recupera una interrupció sense fals èxit. |
| 4 | Provar un lot de consolidació sense purga. | Cada regla proposada conserva fonts; no es promocionen hipòtesis com a fets. |
| 5 | Acordar autoritat de les dues entrades i retenció per domini. | Una font editable per regla, permisos explícits i restauració provada. |

**Primera acció del revisor:** tornar a llegir l’esquema, el registre i la plantilla local; confirmar o rebatre F1–F3 amb l’estat actual. Després indicar només acords, desacords amb proves i una proposta de contracte mínim. No implementar ni netejar res basant-se només en aquest informe.

**Resultat d’aquesta sessió:** un informe persistent amb diagnòstic local i proposta completa. No hi ha millores de rendiment, estalvi de disc o reducció d’estrès mesurats. El següent relleu haurà de distingir el que es proposa del que realment s’executa.

## Ancoratge de Seguretat

- [[00_index_escriptori]]
- [Acte Reflex](../../.agents/skills/skill-documentacio-i-reflex/SKILL.md)

L’enllaç eixint a l’índex no crea un enllaç entrant. L’índex no s’ha modificat per respectar la contenció; la incorporació al registre actiu queda pendent. Aquest informe es pot consumir directament per la seua ruta.

## Fonts crítiques i instantània

Creació i modificació: 2026-09-21T05:51:33+02:00. Hash SHA-256 del contingut local consultat:

| Font | SHA-256 |
| --- | --- |
| [.agents/AGENTS.md](../../.agents/AGENTS.md) | `9234f6a075bf2d82091743656c54b81abce2ac2c00e6fb28bcf049cf69d3c812` |
| [.agents/protocolledge.json](../../.agents/protocolledge.json) | `449b6291b463d22f39596b572d45a1e4eca5eb0a7a820d00816fe88a43443daa` |
| [.agents/PROTOCOL_PETORRETA.md](../../.agents/PROTOCOL_PETORRETA.md) | `c5c097414066902ac3261d80b8f80ce1bc062feb89f23ec4a93e2b9207a2a066` |
| [.agents/skills/skill-documentacio-i-reflex/SKILL.md](../../.agents/skills/skill-documentacio-i-reflex/SKILL.md) | `fd323b460598a9281e641b9b9b5c4d84f57ed1f8787449def3132fb4afa97350` |
| [.agents/skills/skill-consell-i-colmena/SKILL.md](../../.agents/skills/skill-consell-i-colmena/SKILL.md) | `ca7691a6b1bd34d296b326051d8ab9a3177fe02bf3ef353fb84ca9c99efc4534` |
| [.agents/skills/skill-guardia-frontmatter/SKILL.md](../../.agents/skills/skill-guardia-frontmatter/SKILL.md) | `0bb3d7490d9ca564ebf10728e35f1793490ee88982f0f938bab1ea6b29588656` |
| [tooling/wiki/schema.json](../../tooling/wiki/schema.json) | `4dbd0f8ab8a9ec07067f644eb4d55c4afa82b1636479bccee33b4fcba0d72d5f` |
| [_wiki_de_poble/03_actuar/plantilles/02_SDP_PLANTILLA_PROMPT_IAS_LOCALS_v1.0.md](../../_wiki_de_poble/03_actuar/plantilles/02_SDP_PLANTILLA_PROMPT_IAS_LOCALS_v1.0.md) | `9422d8c53be298d788ccaa8c16ca86a21aa362ec0b719edcd9ee9273775eb509` |
| [_wiki_de_poble/04_escriptori/00_index_escriptori.md](../../_wiki_de_poble/04_escriptori/00_index_escriptori.md) | `2cd7e5960608ef122b98c08d9dbd90d3d7ed822ed83ad9b031c33027d6c83e0c` |
