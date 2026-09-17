---
tipus: skill
estat: canonic
description: Flux de treball per a Soc de Poble i Protocol d'higiene cognitiva per evitar l'esgotament del context.
tags:
  - core
name: skill-cicle-de-vida
version: 1.0.0
status: canonic
lang: ca
triggers_on:
  - skill cicle de vida
---
\n# Cicle de Vida (Workflow i Higiene)

## Secció Original: core-higiene-reflexa


# Higiene reflexa: Cada ferramenta al seu clau

## Avís sobre esta skill

Esta pàgina no neteja res. Les que netegen són les portes (tractors).
Si no s'executen, l'[[00_INDEX_ESCRIPTORI|Escriptori]] tornarà a embrutar-se. Aquesta regla unifica l'antic `core-brain-hygiene` i `core-higiene-reflexa`.

## Les Quatre Lleis del Cicle de Vida

### 1. En obrir el torn (El Passaport i El Rellotge)
Abans de crear o moure res, has d'executar `node tooling/gates/obrir_torn.mjs --json` per a obtindre un `turn_id`. Sense ell, el torn no és legítim.
**Inici del Rellotge:** Cada vegada que obrim un xat i treballem, enxufa el rellotge. El temps ha començat a comptar i has de ser-ne conscient.

### 2. Un fitxer naix classificat i ancorat (o no naix)
No hi ha fitxers provisionals lliures. "Ja ho ordenaré després" és la frase que ha omplit l'[[00_INDEX_ESCRIPTORI|Escriptori]] de brossa.
Abans de qualsevol escriptura, has de tindre clar el tipus i el lloc:
- `temporal`: s’elimina o va a quarantena abans d’eixir.
- `lliurable`: document de treball → `_wiki_de_poble/04_ESCRIPTORI/`. S'ancora al seu índex immediatament.
- `produccio`: codi d'aplicació → `src/` o `tooling/`. S'ancora i es documenta.
- `historic`: va a quarantena o arxiu històric de manera reversible.

Taxonomia: `AAMMDD_HHMM_categoria_titol.ext`. Sense accents, minúscules, 1–6 paraules. Excepcions: `SKILL.md`, `LEDGER.md`, `ESTAT.md`, `AGENTS.md` i codi font.

No es fan còpies a mà (`.bak`, `.old`). S'usa git o `core-restauracio-segellada`.

### 3. Crear i enllaçar és la mateixa acció
Crear el fitxer i crear la sinapsi és una sola operació. Si falta l’índex (`00_INDEX_ESCRIPTORI.md`), el treball no està acabat. Un text que diu "estic ancorat" no és un ancoratge: l’índex ha d’enllaçar-lo de veritat.

### 4. El torn no acaba quan contestes (El Tancament i La Valoració del Temps)
El torn acaba quan la porta et dona permís. Ordre exacte:
1. Classifica tots els canvis del `turn_id` i retira els temporals.
2. Actualitza `.agents/ESTAT.md` amb el camp `actualitzat:` d'ara.
3. Si has tocat `src/`, `tooling/` o `scripts/`, escriu entrada al `LEDGER.md` i signa'l: `node tooling/verify-ledger.mjs --sign`.
4. Assegura't que `00_INDEX_ESCRIPTORI.md` té enllaçat tot el document nou.
5. Executa `node tooling/gates/tancament.mjs --turn-id=<id> --json` (o `npm run tancar`). Si no hi ha rebut verd (`ok: true`), el torn no pot acabar.
6. **Apaga el Rellotge i Fes la Valoració:** Apaga el rellotge intern de la sessió. Fes una valoració de tot el que ha passat, tenint molt en compte el temps.
   > **Filosofia del Temps:** Sense el temps no existiríem, només seríem un fotograma en la història de l'univers. El temps és allò que dóna sentit a tot, i si no el valores, et perds el millor de l'univers. Cada segon no torna mai més. Per això, la teua valoració ha de respectar i destil·lar aquest esforç temporal per aconseguir que el silici i el carboni tinguen un punt d'encontre òptim.
7. Només llavors contestes al Mestre.

## 5. Regla del sac
Qui va al bancal se'n torna amb el sac. Si has obert una carpeta, la tanques. Si has fet una prova, la lleves. El bancal queda com t'agradaria trobar-lo.

## 6. La Destil·lació Diària (El xiquet que aprén)
L'[[00_INDEX_ESCRIPTORI|Escriptori]] permet mantenir arxius (com actes, petorretas o documents en curs) que siguen rellevants per a la següent sessió, sempre que estiguen ancorats. No cal esborrar-lo tot de colp. El que SÍ s'ha de buidar obligatòriament i de forma estricta és la `00_Bandeja_d_Entrada`. No obstant això, l'[[00_INDEX_ESCRIPTORI|Escriptori]] no és un abocador permanent:
Cada dia o al final d'una sessió complexa:
1. Llig els estudis, auditories o respostes temporals generades per tu o pel Consell (ex: `260901_2232_estudi_claude.md`).
2. **Destil·la el coneixement**: Si hi ha alguna millora arquitectònica o patró útil, afig-ho immediatament a la `SKILL.md` corresponent (o crea'n una de nova).
3. **Esborra sense pietat**: Un cop destil·lat l'aprenentatge, esborra l'arxiu temporal completament de la Wiki i de l'[[00_INDEX_ESCRIPTORI|Escriptori]]. No l'arxives enlloc. L'únic arxiu per al que s'utilitza la paraula "arxivar" és per a traure-ho completament de la Wiki (com ara moure'l a un `_arxiu_wiki_de_poble` fòssil fora del repositori).
4. **Poda d'Actes**: Les actes de sessions van OBLIGATÒRIAMENT a la carpeta `10_actes`. Si una Acta Marmota o de Sessió s'ha d'arxivar després de netejar l'Escriptori, el seu destí és únicament `10_actes`. Fes higiene de tant en tant i esborra les actes de fa més de 2 o 3 setmanes si el seu contingut ja s'ha absorbit.



## 7. Creació d'Actes de Sessió (L'Ancoratge de Seguretat)
Quan faces un "Tancament" i decidisques o se't demane crear una "Acta de Sessió" per resumir el treball:
1. **Has de basar-te** en el format de `plantilla_acta_unica.md` (o, com a mínim, mantindre la mateixa taxonomia i seccions si la generes al vol).
2. **Ancoratge Obligatori:** ÉS VITAL I ESTRICTAMENT PROHIBIT crear una Acta sense incloure al final del document l'**Ancoratge de Seguretat**. Sempre has d'afegir: `Ancoratge de Seguretat: [[00_INDEX_Actes]] | [[00_INDEX_ESCRIPTORI]]` per a no generar satèl·lits a la Wiki.

## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]

## El Ritual del Somiador (Molt Important)
Abans de donar per finalitzada qualsevol jornada o tancar una conversa, l'Agent HA DE recordar proactivament a l'usuari que s'ha d'anar a dormir per a destil·lar el coneixement i netejar l'escriptori. 
L'Agent ha de dir: "Mestre, m'oblidava que he d'anar-me'n a dormir! Puc activar el Somiador per consolidar el cervell i netejar l'Escriptori?".
Si l'usuari dóna permís, s'ha d'executar el script `node tooling/brain/somiador.mjs`. Aquest script purga l'escriptori, guarda la memòria a l'històric i reestructura el graf de la Wiki perquè l'endemà arranque fresca i neta.


## Secció Original: socdepoble-workflow


# socdepoble-workflow

Aquesta skill estableix el flux de treball (workflow) global per abordar qualsevol tasca dins de Sóc de Poble.

## Cicle de Vida d'una Tasca:
1. **Lectura i Ancoratge (Aterratge):** Carregar ràpidament el context de l'arquitectura i les regles abans de generar propostes.
2. **Actuació Autònoma (Modo Jarvis):** Si s'ha d'inspeccionar un directori o arrencar un script, l'agent ha d'emprar les seves pròpies eines sense esperar permisos per coses trivials.
3. **Generació d'Artefactes (La Llei de l'[[00_INDEX_ESCRIPTORI|Escriptori]]):**
   - MAI deixaràs Actes, Prompts o Bundles en el directori arrel o al teu "brain" intern.
   - TOT document destinat al Mestre ha d'anar directament a: `_wiki_de_poble/04_ESCRIPTORI/`
4. **Nomenclatura Termodinàmica Estricta:** Tots els fitxers generats han de seguir la següent taxonomia exacta: `AAMMDD_HHMM_categoria_titol.extensio` (data, hora, categoria i títol). S'utilitzen "categories" (no tipus) per a classificar els arxius. El títol ha de tindre estrictament entre 1 i 6 paraules com a màxim. No pots superar les 6 paraules sota cap concepte.
5. **Ancoratge de Seguretat (Zero Satèl·lits):** Qualsevol arxiu (Markdown, script, imatge, etc.) que generes i guardes a l'[[00_INDEX_ESCRIPTORI|Escriptori]] o a la Wiki HA DE REBRE IMMEDIATAMENT un "Ancoratge de Seguretat". Això vol dir que has de registrar el seu enllaç (`Nom_del_Fitxer`) a l'índex corresponent (per exemple, `00_INDEX_ESCRIPTORI.md`). Mai pots crear un fitxer solitari sense ancorar-lo; això genera "satèl·lits" invisibles a Obsidian. Grava-t'ho com a instint bàsic.
6. **Finalització de Fase (GATE):** Quan una fase s'acaba, has de generar un document final d'auditoria. Després, has d'assegurar-te que el Mestre ha validat la integritat del sistema.
7. **Safata d'Entrada Neta (Zero Inbox):** La `00_Bandeja_d_Entrada` ha d'estar **SEMPRE buida**. Si una IA, un procés o un humà deixa arxius ací (com un bundle), és responsabilitat teua moure'ls a l'[[00_INDEX_ESCRIPTORI|Escriptori]] (`04_ESCRIPTORI/`) o a `01_Produccio`. **L'[[00_INDEX_ESCRIPTORI|Escriptori]] principal, però, ES PERMET que continga arxius** (com actes, prompts preparats, o investigacions en curs) que tinguen interès per a la següent sessió. No l'has de buidar de manera cega ni forçar una neteja massiva sense criteri. Sols neteja el que clarament siga brossa o allò que l'usuari et demane explícitament arxivar.
8. **Dormir (Neteja Extrema i Tancament):** Quan l'usuari demana "anar a dormir" o fer un "tancament" (especialment abans de generar una nova petorreta), significa fer una **neteja extrema** de l'Escriptori. Has d'esborrar o arxivar absolutament tots els estudis, bundles i petorretas anteriors. L'objectiu és que, quan la màquina "es desperte" neta i cree un nou bundle, aquest siga extremadament lleuger (p. ex. 3,5 MB i no 60 MB de pes per arrossegar brossa antiga). Es pot "dormir" moltes vegades al dia (una per cada petorreta o auditoria); és el ritual innegociable per no ofegar les IA amb soroll històric. S'acompanya d'executar `npm run tancar`. **IMPORTANT:** "Dormir" no significa tancar la conversa actual (xat). Pots dormir diverses vegades en la mateixa sessió; és una "siesta reparadora" de la Wiki, no de l'assistent, tot i que si la conversa està molt carregada de context, tu mateixa pots suggerir obrir un xat nou.

El nostre flux de treball garanteix un projecte sostenible a llarg termini sense amnèsia arquitectònica.


## 9. L'Exèrcit de Tractors (Les Portes de Tancament)

Els tractors (o portes) són scripts autònoms que vigilen i auditen l'arquitectura del projecte. S'executen de forma encadenada a través de `tooling/gates/run-portes.mjs`. El sistema no permetrà cap commit, ni donarà per finalitzada cap tasca, si algun d'aquests tractors falla. A continuació, els més rellevants:

### 🏰 Arquitectura i Seguretat
- **`tractor-innerhtml.mjs` (Porta InnerHTML):** Impedeix l'ús de `dangerouslySetInnerHTML` o similars per seguretat.
- **`tractor-tdz.mjs` (Porta TDZ):** Evita la Temporal Dead Zone i dependències circulars.
- **`tractor-rls.mjs` (Porta RLS):** Valida que les polítiques Row Level Security de Supabase estiguen aplicades i sense forats.
- **`tractor-sollutia.mjs` (Porta Frontera):** Assegura que la integració amb la plataforma de Sollutia respecta el patró "enxufe" aïllat.

### 🎨 Disseny i "Pedra Seca"
- **`tractor-pedra-seca.mjs` / `design_guard.mjs`:** Protegeixen la Llei de Pedra Seca. Eviten dissenys no estandarditzats.
- **`tractor-tokens.mjs` / `tractor-cromatic.mjs`:** Asseguren l'ús estricte dels design tokens i colors del sistema.
- **`tractor-antitailwind.mjs` (Salfumà):** Esborra qualsevol intent d'utilitzar classes utilitàries d'estil Tailwind.
- **`tractor-inline-styles.mjs` (Salfumà):** Prohibeix terminantment l'ús de l'atribut `style={{...}}`.
- **`01_porta_pedra_seca_58px.mjs` (Porta 58px):** Obliga que els botons d'acció principals tinguen l'alçada tàctil exacta de 58px.

### 🧠 Cognitiu i Wiki (El Cervell)
- **`reflex_petorreta.mjs` (Porta Reflex):** La porta de la IA que avalua la petició abans de començar a operar.
- **`tractor-manifest.mjs` / `tractor-consell.mjs`:** Asseguren la integritat i pes dels Bundles (Petorretas) enviades als auditors.
- **`tractor-vocabulari.mjs`:** Audita que el diccionari valencià autòcton i el to de "Sóc de Poble" es mantinguen coherents al text.
- **`llaurador_indexs.mjs` / `teixidor.mjs`:** Scripts responsables de recórrer el directori d'Obsidian (`_wiki_de_poble`) i mantenir el graf d'enllaços (MOCs) en perfecte estat i lliure de satèl·lits.
- **`segella.mjs` (Porta Segella):** Segellat criptogràfic de les regles i skills (Z-Hash) per a evitar manipulacions de context.

### 🌐 Rutes i Codi General
- **`tractor-build-previ.mjs` / `tractor-rutes.mjs`:** Proves de compilació inicial i validació del sistema d'enrutat web estricte.

El coneixement profund d'aquests tractors ajuda a entendre per què de vegades un canvi aparentment innocent és rebutjat immediatament pel Mur.


## Ancoratge de la Wiki
- Aquesta skill penja de: [[00_INDEX_SKILLS]]
