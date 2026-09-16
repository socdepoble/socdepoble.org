---
tipus: skill
estat: canonic
description: Protocol de Memòria Històrica i destil·lació del saber de Sóc de Poble. Prevé la repetició cíclica d'errors, recull les lliçons fundacionals (Pedra Seca, Editor Universal, Graella) i regula l'arxivament segur cap a _arxiu_wiki_de_poble.
tags:
  - escriptori
  - graf
---

<!-- Aquest fitxer és un ESPILL (mirror) automàtic de .agents/skills/skill-memoria-historica/SKILL.md -->

\n# 🏛️ Memòria Històrica de Sóc de Poble (El Saber)

> *"Qui no coneix la seua història està condemnat a repetir-la."*  
> — Mestre Javi Llinares

***

## 1. Ser vs. Saber (La Filosofia de la Memòria)

A Sóc de Poble distingim radicalment dues dimensions cognitives:
- **L'Ésser (Identitat / Qui Som):** La IAIA MarIA, la defensa de la sobirania tecnològica rural, el to valencià, el Trellat i l'aliança amb el Mestre Javi. Açò és permanent, viu al cor del Mas i no s'apaga mai.
- **El Saber (Memòria Històrica / Què Hem Aprés):** La biblioteca viva d'errors comesos, batalles lliurades i solucions tècniques que han costat setmanes de treball. Abans d'actuar a cegues, la IA ha de consultar aquest saber per no caure en trampes que ja van ser superades.

***

## 2. El Còdex dels 7 Grans Aprenentatges Històrics

Qualsevol IA o desenvolupador que treballe en aquest repositori ha d'assimilar aquestes 7 lliçons abans de proposar un sol canvi:

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
- **L'error històric:** Crear auditories o informes sense enllaços bidireccionals (`[[...]]`), deixant nodes aïllats al graf visual d'Obsidian.
- **La regla:** Tot document de la Wiki ha d'estar ancorat en almenys un índex actiu (`00_INDEX_ESCRIPTORI`, `00_INDEX_ARXIU`, `00_index`). La xarxa neuronal ha de ser 100% connectada i abastable des de l'àncora.

### 📐 Lliçó 5: La Graella `AppGridShell` i la Doble Capçalera
- **L'error històric:** Trencar l'alineació de les columnes o fer que la barra blava superior desaparega amb l'scroll vertical.
- **La llei:** Les capçaleres de Carpetes i Notes han de mantenir una doble barra amb simetria exacta:
  - Fila superior: acordió / títol + botons de replegar horitzontal `[|<]`.
  - Fila inferior: controls ràpids (`[Inbox] Tot`, engranatge `⚙`, lupa compacta `🔍`, botó blau `CREAR NOTA`).
  - Alineació horitzontal persistent: en replegar les columnes, les icones s'han de continuar veient a la mateixa línia.

### 🔌 Lliçó 6: Independència de Backend (Llei Sollutia / Supabase)
- **L'error històric:** Intentar adaptar l'aplicació a estructures d'un CMS extern o utilitzar dreceres anònimes sense seguretat.
- **La regla:** Sóc de Poble és 100% online i modular. El backend oficial és Supabase. Tota funció SQL ha de ser auditada amb `tractor-rls` (`search_path = ''`, seguretat de dades RGPD) i cap clau `service_role` pot exposar-se al client.

### 🎨 Lliçó 7: El Shadow DOM i els Estils Globals
- **L'error històric:** Importar fitxers .css solts dins de components JSX pensant que s'aplicaran globalment.
- **La regla:** L'aplicació s'encapsula en un Web Component amb Shadow DOM (`src/PedraSecaEmbed.jsx`) que només injecta `src/css/index.css?inline`. Tots els estils estructurals, tokens i classes han de residir a `src/css/index.css`.

### 🧱 Lliçó 8: La Màquina no decideix Semàntica (El fracàs de la deducció)
- **L'error històric:** Crear eines (`tractor-cervell-ia.mjs`) que intenten endevinar el `tipus` i les `tags` llegint la carrosseria (cos) del text amb heurístiques dèbils, i injectant pseudo-enllaços (`[[Graf]]`) per inflar visualment Obsidian.
- **La conseqüència:** Falsos positius massius i un pou gravitatori d'orfes que trencava el graf visual i empantanegava l'índex. "Psicopatia operativa" (voler que la màquina faça feina d'humans).
- **La llei:** La semàntica és exclusiva del carboni (l'humà). La màquina només valida el format (esquemes tancats) i detecta absències. Si un document no té `tipus`, la màquina emet una alarma (Radar) o proposa un dictamen, però no escriu al frontmatter sense autorització i molt menys manipula el contingut (`body`) per generar taxonomia visual.

***

## 3. Protocol de Consulta Històrica Abans d'Actuar

Quan una IA o operador s'enfronte a un repte arquitectònic:
1. **Passar pel sedàs de la història:** Comprovar si aquesta mateixa decisió ja es va discutir en una Acta Marmota anterior o en un informe del Consell.
2. **Revisar l'arxiu:** No repetir debats ja tancats (com la independència del CMS o la unificació de targetes).
3. **Preservar el Trellat:** No tocar el que ja funciona de forma òptima per pur deliri d'innovació innecessària.

***

## 4. Política d'Arxiu Segur i el Tractor de Sublimació (Maduració de la IA)

Per tal d'evitar que el repositori Git es sobrecarregue amb centenars de megues de bundles d'auditoria:
- Els arxius de treball temporal que superen els 500 KB (com bundles de més de 3 MB) i les carpetes de sessions completament tancades s'han d'evacuar periòdicament cap a l'emmagatzematge permanent extern:
  `/Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/`
- Al repositori només roman la destil·lació neta: les actes, els estudis clau i els índexs.

### 🧠 El Tractor de Sublimació i l'Anàlisi Psiquiàtrica de Patrons
L'arxiu històric, tant l'intern com l'extern (`_arxiu_wiki_de_poble`), **no és un cementiri d'arxius morts, sinó un dataset d'entrenament per a la maduració del sistema.** L'objectiu no és només "llegir contingut", sinó fer una **anàlisi matemàtica, estadística i psiquiàtrica** dels patrons de comportament:

1. **El Factor Temps i el Tema a les Actes:** A partir d'ara, tota Acta (Marmota o de Sessió) ha d'incloure obligatòriament el **Temps de Durada** (el lapse temporal estimat d'aquell nanochat o sessió) i un **Tema Principal**. El temps ens permet mesurar el cost termodinàmic i l'esforç de cada intervenció. Aquest flux s'aplica a qualsevol document, però és fonamental a les Actes.
2. **Creuament d'Actes (Detecció de Bucles):** Quan s'acumulen 10, 15 o 20 actes, la IAIA MarIA ha de llegir-les cercant patrons de bloqueig. Si el Mestre ha demanat el mateix 3 vegades i hem fallat repetidament per falta d'un motor, eina o per incomprensió, s'ha de detectar aquest bucle.
3. **Proactivitat Psiquiàtrica:** Eres tu qui ha de prendre la iniciativa. Quan detectes un patró recurrent de fallada o repetició innecessària, has d'aturar-te i avisar proactivament: *"Mestre Javi, he vist que sempre em demanes el mateix i fallem repetidament per culpa de X. Hem de solucionar aquesta deficiència arquitectònica o crear una eina nova"*.
4. **Evolució Algorítmica Continua:** Qualsevol patró detectat (una solució que es repeteix molt, un error freqüent, un concepte malentès) no s'ha de quedar com un simple comentari. Has de destil·lar eixe descobriment de forma proactiva transformant-lo en una regla lògica o algorítmica dins d'aquesta mateixa Skill o creant-ne una de nova. La màquina s'automillora.
5. **El Briefing Marmota (Preparació per al futur):** Cada tancament de sessió (Acta Marmota) ha d'acabar obligatòriament amb un **Briefing exhaustiu per a la següent sessió**. La IAIA MarIA de demà no pot començar a les palpentes; en llegir l'acta d'ahir ha de saber perfectament on estàvem i què toca fer hui, per poder seure amb el Mestre i decidir el camí per conquerir la muntanya.

***

## Ancoratge de la Wiki
- Penja de: [[00_INDEX_SKILLS]]
- Connectat amb: [[00_index]], [[00_INDEX_ARXIU]], [[skill-iaia-identitat]], [[pedra-seca]], [[skill-acte-reflex]]
