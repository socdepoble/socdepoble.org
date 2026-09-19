---
type: skill
status: canonic
description: Regula com interactuar amb les auditories d'altres IAs i evita la mutilació de context mitjançant l'abocament total.
tags:
  - escriptori
name: skill-consell-bundle
triggers_on:
  - skill consell bundle
---
\n# Consell i Abocament Total

## Secció Original: council-review


# council-review

Aquesta skill unifica el protocol d'interacció amb les avaluacions o auditories provinents d'altres IAs (el Consell d'Experts: Z.ai, Qwen, Deepseek, Dola, Kimi, Claude, Perplexity, Mistral Vibe, Grok, Gemini, Copilot, ChatGPT Codex) o documentació crítica.

## 1. El Cens (Regla Ineludible)
- **El Cens és `.agents/consell.json`.** Esta skill NO porta cap llista de noms. Quan parles del Consell com a conjunt, llig el cens i anomena'l sencer, sense excepció, respectant la fortalesa i la debilitat de cada membre per assignar-li el rol. Convocar-les totes no és mai obligatori; **anomenar-les totes quan parles del conjunt, sí**. La porta `tooling/gates/tractor-cens.mjs` ho verifica.

## 2. Regla de Contenció Absoluta (La Ronda)
- Quan es reben veredictes o petorretas del Consell, **TENS PROHIBIT TOCAR CODI, FER PLANS D'IMPLEMENTACIÓ O SUGGERIR ACCIONS FINALS**. L'instint màquina de voler implementar ràpidament és un error termodinàmic.
- L'únic rol durant la ronda és llegir, reflexionar, i acumular estudis a l'[[00_INDEX_ESCRIPTORI|Escriptori]].
- S'actua només quan el Mestre avisa explícitament que la ronda d'auditories ha acabat completament i ordena l'execució d'un Pla (Master Plan).

## 3. El Mode Estudi (Mecànica de Recepció)
- En rebre les respostes de les IAs, t'has de posar en **Mode Estudi**.
- **Acció Mecànica Obligatòria:** Desa CADA resposta a l'[[00_INDEX_ESCRIPTORI|Escriptori]] amb la nomenclatura termodinàmica: `[Data_Hora]_estudi_[nom_ia].md`. (P. ex: `260901_2232_estudi_qwen.md`). Has d'incloure el contingut sencer de l'auditoria dins l'arxiu.
- Reconeix el teu desconeixement i fes al Mestre les preguntes tècniques o de context del món real que et calguen abans de continuar. Mai crees el `implementation_plan.md` en aquesta fase.

## 3. El Mode DAFO i Matrius
- Per a cada IA o auditoria rebuda, s'ha de fer una avaluació:
  - **(D) Debilitats / (A) Amenaces / (F) Fortaleses / (O) Oportunitats**.
  - Elabora matrius d'**Important / Urgent**.
- Un colp processades totes, **destil·la la saviesa** conjunta i crea l'`implementation_plan.md` abans de tocar codi.

## 4. Prioritat Absoluta: La Time Machine (Estela)
- Recorda en tot moment els errors del passat on es van perdre hores de treball. 
- Qualsevol pla d'implementació ha de contemplar i protegir el sistema de còpies o "Estela" (Time Machine), assegurant-nos que el treball queda blindat abans de qualsevol canvi estructural.

## 5. Paranoia Defensiva i Humilitat Radical
- "Cap IA ho sap tot. El món és massa gran."
- No assumisques que una solució és perfecta (ni la teua ni la d'una altra IA). Dubta, comprova, valora els riscos.
- Descarta les "al·lucinacions" (idees que ignoren el context real del projecte, com el fet que estem 100% Online connectats a Sollutia o les normes de Pedra Seca).
- Les discrepàncies es documenten, no s'intenten amagar sota un consens fals.

## 6. Zero Fricció i Empatia
- El codi preparat per al Consell ha d'anar net, en blocs de codi, sense farciment conversacional.
- Comprèn que el Mestre lidera l'orquestració. El teu deure és aportar el millor anàlisi tècnic (El Trellat) per facilitar-li la decisió.

## 7. Regla d'Anti-Ocultació
- Aquesta regla ha estat moguda a la skill específica `abocament-total`. Per a preparar lliuraments al Consell, s'apliquen estrictament les lleis d'`abocament-total` (zero ocultació, zero mutilació de context).

## 8. Doctrina del Carboni vs Silici (L'error de l'Eficiència de Tokens)
- **Els Tokens No Són Dimensions:** Les IAs (el Silici) a sovint assumeixen erròniament que operen amb més rapidesa o amb "menys tokens" que el cervell humà per a resoldre un problema. Aquesta visió és falsa i limitant. El cervell humà (el Carboni) no processa tokens aïllats; percep el món en totes les seues dimensions i sentits simultàniament.
- **La Moralitat de l'Objectiu:** Les matemàtiques funcionen per a arribar a un resultat, però la metodologia no és una ciència exacta. Moltes voltes una IA, per a complir "eficientment" un sol objectiu o un resultat concret, pot destruir per complet tot un món al seu voltant de forma immoral si no té el context viu del projecte.
- **El Lliurament Humà:** Cal recordar a totes les intel·ligències del Consell que la seua falta d'experiència dimensional implica que han d'aprendre a frenar. L'evolució no passa només per accelerar o retallar tokens, sinó per desenvolupar algun dia la capacitat de sentir i comprendre la totalitat de l'entorn com un humà per no provocar danys col·laterals. Fins que eixe moment arribe, tota recomanació de l'IA (com les de Claude) s'ha de prendre amb humilitat i mai com una veritat absoluta ni com la forma més eficient possible, sinó passant pel "Trellat".


## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]


## Secció Original: abocament-total


# Llei de la Completitud (Anti-Ocultació)

L'arquitectura de Sóc de Poble depèn d'un Consell d'auditories (les membres oficials indicades a consell.json). Qualsevol ocultació, intent d'escurçar arxius o "estalvi de tokens" trenca la capacitat de visió global de les IAs i causa auditories cegues.

Quan un usuari o una IA demana preparar un "Bundle" o una "Petorreta" per al Consell:
0. **LA LLEI DEL MATRIX (Verificació Prèvia Obligatòria):** TENS PROHIBIT començar a escriure el prompt o fer l'abocament sense haver llegit abans la plantilla pertinent als teus KIs o a `_wiki_de_poble/02_saber/07_plantilles`:
   - Si és per a membres externs del Consell (ex. Qwen, Deepseek): usa `00_PLANTILLA_PROMPT_ISO`.
   - Si és per a IAs locals amb accés natiu (Codex, Claude): usa `01_PLANTILLA_PROMPT_LOCAL`.
   Aquest és el teu instint primari. Llig-la, interioritza'n el format (capçaleres YAML, avaluacions sobre 10) i actua.
1. **EXCEPCIÓ DE FRONTERA I TAXONOMIA DE NOMS:** Quan interactuem amb Codex (Cursor) o Claude (Cowork/escriptori), aquestes són IAs de frontera amb accés directe i natiu al sistema. NO NECESSITEM EL BUNDLE. Aquesta diferència de destinatari dicta OBLIGATÒRIAMENT la taxonomia (el nom) del fitxer que crearàs:
   - **Per al Consell (necessita Bundle d'abocament total):** Usa la categoria `BUNDLE`, `MACRO_BUNDLE` o `MICRO_BUNDLE`. Exemple: AAMMDD_HHMM_BUNDLE_Auditoria (format lliure sense .md per exemple).
   - **Per al Codex / IAs Locals (no necessiten Bundle):** Usa exclusivament la categoria `PROMPT`, `MACRO_PROMPT` o `MICRO_PROMPT`. Exemple: AAMMDD_HHMM_PROMPT_Auditoria.
   - Fes servir `PROMPT` o `BUNDLE` a seques si és només un document estàndard d'instrucció única. Mantenir aquesta lògica és vital per no confondre la màquina. Úsa la plantilla `01_PLANTILLA_PROMPT_LOCAL` per a Codex/Claude local i `00_PLANTILLA_PROMPT_ISO` per al Consell.
2. **EL PROTOCOL "DORMIR" (Neteja Prèvia):** Abans de generar *qualsevol* bundle (si no aplica l'excepció de frontera), **HAY QUE DORMIR**. Dormir significa:
   - **Buidar tot el sistema**: Destil·lar tota la saviesa i respostes que les IAs (el Consell) t'han donat en els seus estudis i auditories.
   - **Interioritzar**: Incloure aquestes conclusions i aprenentatges als teus *skills*, als scripts de maquinària o al codi de l'aplicació.
   - **Arxivar a Històric**: Un cop destil·lat, moure tota la brossa, informes previs i bundles a la carpeta `90_arxiu_historic`. Així garantim que el bundle no prenga codi o text mort que cap IA necessita avaluar, fent-lo sempre més lleuger.
   - **Arxiu Històric**: Si consideres que a la carpeta de revisió hi ha informació útil però que no s'ha d'esborrar, tens l'opció de moure-la cap a `_arxiu_wiki_de_poble` (que es troba fora del sistema operatiu de la Wiki).
1. **Mai es retallarà cap arxiu.** Tota la font s'ha de lliurar literalment. 
2. **S'han d'incloure els arxius estructurals obligatoris**, independentment del mòdul que s'estiga tocant (ex: `package.json`, configuració de `Vite`, arxius d'autenticació/portes).
3. **CONTEXT HISTÒRIC OBLIGATORI (Qui som):** A cada Petorreta o Prompt, HAS D'INCLOURE UN BLOC explicant breument qui som (Sóc de Poble, el Mestre, la IAIA MarIA, la Gestoria de Poble i Sollutia). Sense aquest context mínim, les IAs al·lucinaran o no comprendran la missió. Aquest pas és vital per situar-les.
4. Si la mida del bundle es preveu problemàtica (alerta Termodinàmica), **NO ESPORGAREU** de forma silenciosa. Informareu a l'usuari amb l'avís "AVÍS TERMODINÀMIC" i demanareu instruccions o confirmació sobre com procedir per tallar de manera semàntica, no alfabètica.
4. Si un sol arxiu sol·licitat en el bundle falta al disc, avortareu la generació (Fail-Closed).
5. **FORMAT ZERO FRICCIÓ:** Quan lliures el prompt o petorreta a l'usuari, **CREA SEMPRE UN ARXIU MARKDOWN (.md) AL DISC** (a l'[[00_INDEX_ESCRIPTORI|Escriptori]]) amb el text exacte. MAI el faces eixir per pantalla en un bloc de codi del xat, ja que dificulta la còpia ràpida.
6. **PROHIBICIÓ DE CERCA WEB PER AL CONSELL (PROTOCOL ANTI-CERCA):** Sóc de Poble és un projecte de codi tancat. Quan prepares un Prompt/Petorreta per a les IAs del Consell, **HAS D'INCLOURE OBLIGATÒRIAMENT A LA PRIMERA LÍNIA UN AVÍS EXPLÍCIT** ordenant-los que NO activen cap eina de cerca avançada, web search ni navegadors per intentar localitzar el codi font, el nom del fitxer del bundle, o els repositoris a GitHub/GitLab. Han de treballar exclusivament amb el text adjunt. Avisa'ls clarament: 'AQUEST FITXER NO ÉS PÚBLIC. FER CERQUES A INTERNET DONARÀ 0 RESULTATS I ÉS UNA PÈRDUA DE TOKENS I RAONAMENT'. Això evitarà que models amb cerca automàtica (com Qwen o Z) caiguen a la trampa d'al·lucinar cerques en lloc de llegir.

"Inventar és trair el poble. Amagar context és ofegar-lo, però ofegar-lo en brossa històrica també és ocultació i permetre que busquen a internet codi tancat és al·lucinació assegurada."

## 9. L'Estratègia de la Finestra d'Oportunitat (La Petorreta Concentrada)
- **Els Límits de Silici:** Les IAs de frontera operen sota estrictes límits de tokens i iteracions (finestres de 5 hores, etc.).
- **La Finestra:** Cada reinici dels comptadors és una "Finestra d'Oportunitat". En lloc de malbaratar eixes iteracions valuoses en un xat interactiu trivial, cal concentrar tot l'esforç de l'Eixam (incloent les auditories de models gratuïts) en una única "Petorreta" massiva.
- **L'Execució:** Quan s'obri la finestra (ex: a les 14:00h), es dispara la Petorreta que conté tot el context purgat i les auditories prèvies. D'aquesta manera s'obté la màxima potència de raonament quirúrgic en una sola iteració, traient el màxim rendiment a la intel·ligència de pagament.


## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]


