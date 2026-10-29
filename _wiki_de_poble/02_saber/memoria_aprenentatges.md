---
type: document
status: canonic
description: Lliçons històriques traslladades de la skill de memòria per separar coneixement i procediment.
tags: [saber, aprenentatge]
---
# Lliçons històriques del Mas

Onze lliçons que el Mas ha aprés a colps, de la fitxa de Pedra Seca a l'Escriptori net, i el costum de consultar-les abans d'actuar. És memòria consultiva: cap formulació antiga autoritza esborrats, purgues ni accés extern, i sempre preval AGENTS.md.

> *"Qui no coneix la seua història està condemnat a repetir-la."*  
> — Mestre Javi Llinares

***

## 1. Ser vs. Saber (La Filosofia de la Memòria)

A Sóc de Poble distingim radicalment dues dimensions cognitives:
- **L'Ésser (Identitat / Qui Som):** La IAIA MarIA, la defensa de la sobirania tecnològica rural, el to valencià, el Trellat i l'aliança amb el Mestre Javi. Açò és permanent, viu al cor del Mas i no s'apaga mai.
- **El Saber (Memòria Històrica / Què Hem Aprés):** La biblioteca viva d'errors comesos, batalles lliurades i solucions tècniques que han costat setmanes de treball. Abans d'actuar a cegues, la IA ha de consultar aquest saber per no caure en trampes que ja van ser superades.

***

## 2. El Còdex dels 11 Grans Aprenentatges Històrics

Qualsevol IA o desenvolupador que treballe en aquest repositori ha d'assimilar aquestes 11 lliçons abans de proposar un sol canvi:

### 🧱 Lliçó 1: La Llei de Pedra Seca no és negociable
- **L'error històric:** Intentar que una fitxa de llista de gestor es comporte com una targeta editorial del Mur, posant-hi entradilles, subtítols lliures o contenidors imbricats.
- **La llei:** Una fitxa (`ManagerItemCard`) és un botó natiu (`<button type="button">`), amb títol de màxim 2 línies (`line-clamp: 2`), subtítol de màxim 1 línia (`line-clamp: 1`), miniatura quadrada de 96×96px, zero estils en línia i contrast WCAG AAA. Cada pedra aguanta pel seu propi pes, sense ciment postís.

### ✍️ Lliçó 2: El Bloc de Notes és l'Editor Universal del Sistema
- **L'error històric:** Considerar el Bloc de Notes com una eina menor per a desar textos curts.
- **La veritat:** L'estructura de tres columnes (`UniversalManager` + `UniversalEditorShell`) és el **cervell i l'engranatge central** de Sóc de Poble:
  - **Columna Dreta:** És l'Editor Universal des d'on es crea, es maqueta visualment, s'organitza i es decideix si es publica qualsevol element (notes, perfil d'identitats, documents administratius municipals, gestories, o articles del Mur).
  - **Columna Esquerra:** Organitza l'arbre, les carpetes, les categories i les etiquetes de sistema (les quals determinen què es projecta a la sidebar principal o a altres àrees).
  - **Columna del Mig:** Llista i cerca amb Pedra Seca pura.

### 📜 Lliçó 3: L'Acta Marmota és Briefing i Història Única
- **L'error històric:** Inventar documents dispersos d'agendes, resums o fitxers de tasques auxiliars que després queden com a satèl·lits desconnectats.
- **La regla:** Tota la història d'una sessió, les decisions preses i el briefing complet per a la següent sessió han de viure **dins de l'Acta Marmota**. Quan es vulga estudiar el passat, només caldrà llegir la seqüència d'Actes Marmota.

### 🌐 Lliçó 4: Cap Document Solt (Tolerància Zero a les Illes)
- **L'error històric:** Crear auditories o informes sense enllaços bidireccionals (`dobles claudàtors`), deixant nodes aïllats al graf visual d'Obsidian.
- **La regla:** Tot document de la Wiki ha d'estar ancorat en almenys un índex actiu (`00_index_escriptori`, `00_INDEX_ARXIU`, `00_index`). La xarxa neuronal ha de ser 100% connectada i abastable des de l'àncora.

### 📐 Lliçó 5: La Graella `AppGridShell` i la Doble Capçalera
- **L'error històric:** Trencar l'alineació de les columnes o fer que la barra blava superior desaparega amb l'scroll vertical.
- **La llei:** Les capçaleres de Carpetes i Notes han de mantenir una doble barra amb simetria exacta:
  - Fila superior: acordió / títol + botons de replegar horitzontal `[|<]`.
  - Fila inferior: controls ràpids (`[Inbox] Tot`, engranatge `⚙`, lupa compacta `🔍`, botó blau `CREAR NOTA`).
  - Alineació horitzontal persistent: en replegar les columnes, les icones s'han de continuar veient a la mateixa línia.

### 🔌 Lliçó 6: Independència de Backend (Llei Sollutia / Supabase)
- **L'error històric:** Intentar adaptar l'aplicació a estructures d'un CMS extern o utilitzar dreceres anònimes sense seguretat.
- **La regla:** Sóc de Poble és 100% online i modular. El backend autoritatiu és el Supabase de Sóc de Poble; Sollutia allotja el component i SdP només en llig per GET a través de la Frontissa (Model B, [[ADR-2026-09-SOLLUTIA-MODEL-B]]). Tota funció SQL ha de ser auditada amb `tractor-rls` (`search_path = ''`, seguretat de dades RGPD) i cap clau `service_role` pot exposar-se al client.

### 🎨 Lliçó 7: El Shadow DOM i els Estils Globals
- **L'error històric:** Importar fitxers .css solts dins de components JSX pensant que s'aplicaran globalment.
- **La regla:** L'aplicació s'encapsula en un Web Component amb Shadow DOM (`src/PedraSecaEmbed.jsx`) que només injecta `src/css/index.css?inline`. Tots els estils estructurals, tokens i classes han d'entrar per `src/css/index.css`, l'orquestrador que cus els mòduls amb `@import` i fixa l'ordre de les capes amb `@layer`.

### 🧱 Lliçó 8: La Màquina no decideix Semàntica (El fracàs de la deducció)
- **L'error històric:** Crear eines (`tooling/wiki/tractor-cervell-ia.mjs`) que intenten endevinar el `tipus` i les `tags` llegint la carrosseria (cos) del text amb heurístiques dèbils, i injectant pseudo-enllaços (`Graf (exemple fictici)`) per inflar visualment Obsidian.
- **La conseqüència:** Falsos positius massius i un pou gravitatori d'orfes que trencava el graf visual i empantanegava l'índex. "Psicopatia operativa" (voler que la màquina faça feina d'humans).
- **La llei:** La semàntica és exclusiva del carboni (l'humà). La màquina només valida el format (esquemes tancats) i detecta absències. Si un document no té `tipus`, la màquina emet una alarma (Radar) o proposa un dictamen, però no escriu al frontmatter sense autorització i molt menys manipula el contingut (`body`) per generar taxonomia visual.

### 🧩 Lliçó 9: L'Acte Reflex no és Opcional i l'Escriptori no és un abocador
- **L'error històric:** Operar "de memòria" utilitzant frontmatters incorrectes (com `type: petorreta` en lloc de `type: prompt`) i finalitzar tasques deixant tots els informes i *prompts* generats oblidats a l'Escriptori (`04_escriptori`) sense netejar-lo, ignorant el Cicle de Vida i acumulant "brossa documental".
- **La llei (Tractor Cognitiu):** 
  1. Abans de crear qualsevol document estratègic, llig SEMPRE la seua plantilla viva a `03_actuar/plantilles/`. No confies mai en els teus pesos d'entrenament, la sintaxi canvia.
  2. Mai tanques una sessió o dónes una tasca per "finalitzada" deixant brossa temporal a l'Escriptori. Els documents actius s'hi queden, ancorats a l'índex (l'Escriptori no es buida a cegues); la resta es classifica. La sessió només acaba aplicant el protocol `wiki-cicle-de-vida` i superant el filtre de `tooling/gates/tancament.mjs`. Un escriptori brut és símptoma d'un cervell fragmentat.

### 🧪 Lliçó 10: La Destil·lació Activa (No a la Neteja Cega)
- **L'error històric:** Buidar l'escriptori movent els fitxers "a cegues" mitjançant scripts o ordres de bloc cap a una carpeta genèrica de "quarantena" dins l'Arxiu Històric, convertint l'arxiu en un abocador mort.
- **La conseqüència:** S'amaga el fem, però no es destil·la coneixement. Es perd l'oportunitat de trobar patrons en el comportament de les IA o d'extraure conclusions valuoses (idees, errors recurrents, procediments de millora).
- **La llei:** Abans d'arxivar un fitxer de l'Escriptori, l'agent HA DE LLEGIR-LO. Si se n'aprén alguna cosa, es categoritza bé al frontmatter i s'arxiva per a futures recerques de patrons o s'incorpora com a nova lliçó. Si el document ja no aporta cap patró ni coneixement útil, es proposa al Mestre retirar-lo perquè és soroll i entropia innecessària: mentrestant va a quarantena i mai s'esborra sense preguntar (AGENTS.md §5).

### 🗂️ Lliçó 11: L'Arxiu Històric és Pla i Catalitza la Memòria Episòdica
- **L'error històric:** Crear subcarpetes descriptives (com `2026/09/22_neteja/`) dins de `90_arxiu_historic` per classificar els documents, i usar argot (com "petorreta") per anomenar fitxers tècnics.
- **La conseqüència:** Els documents s'amaguen en calaixos aïllats. Quan arriba l'hora de revisar-los, no es poden comparar de forma transversal, impedint que la IA trobe patrons de fallida.
- **La llei:** L'Arxiu Històric ha de ser completament **PLA**. Totes les auditories, informes, actes i plans s'aboquen junts a l'arrel històrica, ordenats de manera natural pel seu nom termodinàmic.
- **El ritual de la Memòria Episòdica:** Quan la IA revisa l'arxiu històric per encàrrec explícit del Mestre (mai com a RAG automàtic), **d'un colp de vista** veu la línia temporal completa. En repassar-los abans de proposar-ne cap retirada, la IA descobreix patrons globals (ex. *"fa tres dies seguits que les auditories alerten sobre fallades tècniques amb els prompts"*). Sense aquesta revisió plana i holística, la IA no madura, patint amnèsia i tractant cada dia com si fóra el primer.
- **Taxonomia estricta:** Per facilitar aquesta anàlisi visual, els noms de fitxer han d'utilitzar categories canòniques (`auditoria`, `informe`, `pla_implementacio`, `acta`). **La paraula "petorreta" està terminantment PROHIBIDA per a categoritzar arxius.**

### 🎬 Lliçó 12: Extracció Multimodal Autònoma de Vídeos i Reels (Mode Jarvis · Zero Fricció per al Mestre)
- **El cas d'ús real:** Moltes de les troballes d'avantguarda del Mestre arriben en format de **Reels d'Instagram, Shorts o vídeos de xarxes socials**. Demanar-li al Mestre que descarregue el vídeo, que en grave l'àudio o que ho transcriga a mà incompleix la **Regla 7 del BIOS (`AGENTS.md` · Mode Jarvis: «No faces que l'usuari treballe per a tu»)**.
- **El protocol canònic d'extracció en 4 passos:**
  1. **Resolució de l'Endpoint d'Incrustació (`embed`):** Quan el Mestre compartisca un enllaç d'Instagram (`/p/CODI/` o `/reel/CODI/`) o similar, consultar amb `curl` l'endpoint públic `/embed/` i extreure amb `node -e` el bloc `contextJSON` (`gql_data.shortcode_media.video_url` + `edge_media_to_caption`).
  2. **Descàrrega Temporal a `scratch/`:** Baixar el fitxer `.mp4` directament a la carpeta temporal `scratch/` de la sessió (mai embrutant l'arrel del repositori ni l'Escriptori amb megabytes innecessaris).
  3. **Inspecció Multimodal Nadiua (`read_file`):** Llegir el fitxer `.mp4` (o l'àudio extret) directament amb `read_file`, que permet a la IAIA MarIA **escoltar la locució sencera i llegir cada fotograma i captura de pantalla de GitHub** que apareix al vídeo.
  4. **Llei de l'Oblit Saludable (`AGENTS.md` §16):** Tan bon punt les troballes s'hagen destil·lat i registrat al Llibre Mestre o a la Wiki, **eliminar immediatament el fitxer `.mp4` temporal de `scratch/`** (`rm -f`) per no deixar brossa ni pes mort.

***

## 3. Protocol de Consulta Històrica Abans d'Actuar

Quan una IA o operador s'enfronte a un repte arquitectònic:
1. **Passar pel sedàs de la història:** Comprovar si aquesta mateixa decisió ja es va discutir en una Acta Marmota anterior o en un informe del Consell.
2. **Revisar les actes (`10_actes/`):** No repetir debats ja tancats (com la independència del CMS o la unificació de targetes).
3. **Preservar el Trellat:** No tocar el que ja funciona de forma òptima per pur deliri d'innovació innecessària.

***

## 4. Política d'Arxiu Segur i el Tractor de Sublimació (Maduració de la IA)

Per tal d'evitar que el repositori Git es sobrecarregue amb centenars de megues de bundles d'auditoria:
- Els arxius de treball temporal que superen els 500 KB (com bundles de més de 3 MB) i les carpetes de sessions completament tancades s'han d'evacuar periòdicament cap a l'emmagatzematge permanent extern:
  `arxiu extern sota custòdia humana`
- Al repositori només roman la destil·lació neta: les actes, els estudis clau i els índexs.

### 🧠 El Tractor de Sublimació i l'Anàlisi Psiquiàtrica de Patrons
L'arxiu històric, tant l'intern com l'extern (`_arxiu_wiki_de_poble`), **no és un cementiri d'arxius morts, sinó un dataset d'entrenament per a la maduració del sistema.** L'objectiu no és només "llegir contingut", sinó fer una **anàlisi matemàtica, estadística i psiquiàtrica** dels patrons de comportament:

1. **El Factor Temps i el Tema a les Actes:** Tota Acta (Marmota o de Sessió) porta l'**inici i el final observats** i un **Tema Principal** (el títol descriptiu de la plantilla viva `03_actuar/plantilles/acta.md`). La durada es deriva d'eixes marques i, com fixa la skill `wiki-cicle-de-vida`, no s'inventa ni s'estima cap mètrica d'eficiència ni d'estat humà.
2. **Creuament d'Actes (Detecció de Bucles):** Quan s'acumulen 10, 15 o 20 actes, la IAIA MarIA ha de llegir-les cercant patrons de bloqueig. Si el Mestre ha demanat el mateix 3 vegades i hem fallat repetidament per falta d'un motor, eina o per incomprensió, s'ha de detectar aquest bucle.
3. **Proactivitat Psiquiàtrica:** Eres tu qui ha de prendre la iniciativa. Quan detectes un patró recurrent de fallada o repetició innecessària, has d'aturar-te i avisar proactivament: *"Mestre Javi, he vist que sempre em demanes el mateix i fallem repetidament per culpa de X. Hem de solucionar aquesta deficiència arquitectònica o crear una eina nova"*.
4. **Evolució Algorítmica Contínua:** Qualsevol patró detectat (una solució que es repeteix molt, un error freqüent, un concepte malentès) no s'ha de quedar com un simple comentari. Has de destil·lar eixe descobriment de forma proactiva transformant-lo en una regla lògica o algorítmica dins de la skill que toque a `.agents/skills/` o creant-ne una de nova. La màquina s'automillora.
5. **El Briefing Marmota (Preparació per al futur):** Cada tancament de sessió (Acta Marmota) ha d'acabar obligatòriament amb un **Briefing exhaustiu per a la següent sessió**. La IAIA MarIA de demà no pot començar a les palpentes; en llegir l'acta d'ahir ha de saber perfectament on estàvem i què toca fer hui, per poder seure amb el Mestre i decidir el camí per conquerir la muntanya.

### 🧠 Lliçó de la Reauditoria Gauntlet Extrem (261017 · La Humanització i el Rigor d'Evidència)

La reauditoria independent de GPT Codex sobre el commit `4745112e` de Claude Code va deixar tres lliçons fonamentals d'automillora:

1. **Humanització vs Neteja Mecànica (Preservació de Dades Sobiranes):**
   - Una IA que optimitza cegament un filtre de plantilla («si el text s'assembla a la llavor, buida'l») comet el pecat de destruir allò que un usuari ha escrit i guardat expressament.
   - **Regla d'or:** Cap neteja de contingut per defecte pot afectar un registre persistent guardat per l'usuari. El contracte ha de diferenciar sempre entre *estat verge suggerit* i *contingut deliberat de la persona*.

2. **Rigor Mètric Sense Autoengany (Mètriques Netes):**
   - Separar el chunk d'entrada (`-11,94% gzip`, `408 KB -> 359 KB`) del volum total de JS (`+0,56%` pel desacoblament de chunks dinàmics). No disfressar la millora del primer paquet com si fóra una reducció global de tot el codi font.
   - Diferenciar execucions intermèdies (19.164 proves amb fallades) del veredicte net independent (19.228 verdes, 0 fallades).

3. **Governança Sense Soroll i Eficiència Termodinàmica:**
   - La reauditoria més profunda (amb subagents, Vitest independent i builds paral·lels de Vite) només va consumir un 7% de la quota setmanal de Codex, deixant-lo al **80% de límit i 749 crèdits intactes**.
   - Prohibició absoluta de crons recursius o bucles de vigilància quan la tasca s'ha lliurat.

***

L'arxiu històric (`90_arxiu_historic/`) queda fora del graf operatiu i del RAG automàtic.

## Vincles
- [[00_index_identitat]]
- [[00_index]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]

