---
type: skill
name: core-higiene-escriptori
prioritat: 1
description: Usa-la en arrencar, quan el hook avise o l'Escriptori estiga brut, abans de convocar (pla primer, prompt després) i abans de tancar. Cada viu porta motiu; el consumit s'arxiva amb la porta Olivera.
status: actiu
tags: [govern]
triggers_on:
  - prompt per a
  - pla d'implementació
  - escriptori brut
  - escriptori net
  - neteja l'escriptori
  - higiene
  - classificacio de documents de treball
  - arrencada de sessió
  - briefing de taula
  - declarats vius
version: 4.0.0
---

# Higiene de l'Escriptori

Definició única (AGENTS §0.1): l'Escriptori està net quan `npm run porta:olivera` ix amb 0. Vol dir Safata d'Entrada buida, cada document solt del primer nivell ancorat a `00_index_escriptori.md`, cap àncora a un document absent i cap document de torn consumit fora de «## Activitat en curs». Net no vol dir buit (AGENTS §12).

Verd no vol dir consumit. La porta conserva tot el que està declarat a «## Activitat en curs», siga del dia que siga, i `document.mjs create` hi declara viu cada document que naix. Des de la porta v4 (261009), la declaració porta el seu motiu i caduca amb ell: si ningú la revisa, el document es queda a la taula, però l'informe el marca 🍂 quan el motiu ja no es comprova, i `npm run olivera:arxiva` continua responent «Res a arxivar» perquè només s'emporta el que no està declarat. Per això la neteja té moments fixos i es fa amb les ordres de la porta.

Una declaració de viu és una línia de «## Activitat en curs» amb el document i, darrere de «·», per què continua:

- `- [[document]] · per a [[consumidor]]`: el document que el necessita, present a la taula i viu ell mateix. Dos documents que es declaren l'un per a l'altre, sense cap torn ni retenció, no sostenen ningú.
- `- [[document]] · torn_ID`: un torn obert i vigent que el fa servir. El rebut del frontmatter (`reflex: sdp:torn_…`) ja compta com a torn implícit mentre el torn siga obert.
- `- [[document]] · Mestre aammdd: motiu`: una retenció que ha decidit el Mestre.

Sense motiu, amb el consumidor arxivat o sense vida, o amb el torn tancat o caducat, el document és ranci per a la convocatòria encara que siga d'avui. La fase la decidix la bandera `.agents/olivera-fase.json`: en «avis» la porta ho diu (també `document.mjs context` i `create` d'un prompt, per stderr), i en «bloqueig» no deixa convocar ni tancar fins que es resol.

## Qui la fa

L'orquestradora (MarIA) o el Mestre. Claude i Codex no poden moure fitxers. La neteja es fa abans d'escriure el prompt o el pla, no dins del prompt.

## Quan

1. **En arrencar cada conversa**, després de llegir l'Acta Marmota i l'ESTAT i abans de la primera resposta al Mestre.
2. **Quan el hook d'Antigravity injecta un missatge**: «[Briefing de taula …]» (porta verda amb documents declarats vius; una vegada per conversa i jornada) o «[Escriptori brut …]» (porta roja).
3. **Abans de convocar**: abans de crear un prompt, una petorreta, un pla o una auditoria, amb el procediment «Convocatòria» d'ací baix.
4. **Abans de tancar la sessió**, abans de l'Acta Marmota i del relleu a l'ESTAT.

## Procediment: reflexiona → observa → actua → verifica → informa

0. **L'Acte Reflex Pre-Arxivament (L'Aturada de Seguretat):** Abans de fer l'acció d'arxivar cap fitxer o netejar l'Escriptori, és obligatori fer-te esta pregunta: *«Hi ha alguna tasca pendent? Algú altre (un altre agent com Codex/Claude o el Mestre) encara necessita llegir aquest informe o prompt?»*. Fes un cop d'ull ràpid al context. Si hi ha un flux pendent que requereix el fitxer (ex: «llança-li-ho a Codex quan acabe Claude»), atura't absolutament. No arxives res fins que la dependència siga resolta.
   - **Quan està resolta:** quan el document que havia de produir l'altre agent (la seua auditoria, el seu informe o la seua acta) ja és a l'Escriptori, o quan el seu torn està tancat o caducat.
   - **Mentre no ho està:** el document continua declarat viu i ho dius al Mestre en la línia d'informe (pas 5): qui el necessita i per a què. Una dependència que no saps nomenar no protegix cap document: torna a preguntar-t'ho.
1. **Observa:** `npm run porta:olivera`. És el mode informe: no llig stdin ni mou res. El mode hook necessita `--hook` i un payload. Llig també els «🌿 Declarats vius»: cada nom és una decisió pendent, no un verd.
2. **Decidix el que viu:** tot document que ha de continuar s'ancora a `00_index_escriptori.md` davall d'una capçalera `## Activitat en curs`, una línia per document i amb el seu motiu darrere de «·» (procediment «Convocatòria», pas 3). L'informe llista cada declarat viu amb el seu motiu, i `--arxiva` se'n du la línia sencera.
3. **Actua**, sempre amb les ordres de la porta Olivera (`node tooling/gates/porta-olivera.mjs`), primer amb `--sec` per a vore què faria i després sense:
   - Consumits de jornades anteriors no declarats: `npm run olivera:arxiva`.
   - Declarats vius que ja no necessita ningú, de hui o d'abans: `--arxiva --nom FITXER`, un `--nom` per document. Per nom ixen documents i artefactes solts del primer nivell, de qualsevol extensió, amb categoria de torn, `produccio` o `avaluacio`, i amb la part termodinàmica del nom en minúscules: els `BUNDLE`, `PROMPT` i `ABSENTS` que escriu `crear_bundle` no ixen per nom (el remei és ANC-06, de `crear_bundle`), i per a eixos preguntes al Mestre.
   - Una sessió sencera a una carpeta pròpia de l'arxiu: afig `--sessio aammdd_Nom` a l'ordre anterior.
   - Àncores de fora d'«Activitat en curs»: sense `--reapunta`, `--arxiva` les despenja; amb `--reapunta`, les reescriu cap al document arxivat (`[[../90_arxiu_historic/…]]`). El document que es queda sense cap àncora rep una línia amb camí davall de «## Arxivat amb la Porta Olivera»: sempre amb `--reapunta`, i sense la bandera només si és un Markdown amb rebut d'un torn obert, perquè el `handoff` no el deixe sense àncora.
   - Reanomenar un document de la taula: `--renomena VELL --a NOU`. Reescriu les àncores i imprimix el relleu del torn.
   - Àncores a documents absents: `--repara`.
   - Amb rebut de torn: l'ordre `document.mjs handoff` que imprimix la porta.
   - «## Arxivat amb la Porta Olivera» creix amb cada arxivat de torn obert i la porta no la poda: quan el torn d'una línia ja està tancat, lleva la línia amb l'eina d'edició en la neteja de tancament.
   - Safata d'Entrada: classifica o arxiva cada element fins que quede buida.
   - Si la porta no et deixa fer el gest (categoria que no ix per nom, nom amb majúscules, subcarpeta, àncora ambigua o relleu impossible), no el faces a mà: ni `mv`, ni `rm`, ni scripts, `sed` o `node -e` sobre l'índex. Pregunta al Mestre.
4. **Verifica:** `npm run porta:olivera` ix amb 0, `npm run porta:orfandat` no puja orfes i saps dir, per a cada declarat viu, qui el necessita.
5. **Informa:** una línia al Mestre amb el que has mogut, el que has conservat i, per a cada document conservat, qui el necessita i per a què.

## Procediment: Convocatòria (Onada nova)

La feina viva de l'Onada anterior passa a la següent pel pla nou, mai per la taula.

1. **Absorbix:** abans de crear el pla nou, copia-hi sencers els ítems de l'Onada anterior que encara són vius (tasques futures, preguntes obertes, decisions pendents), cadascun amb la seua font citada amb `[[…]]`. El pla nou és l'única pissarra que cita el prompt.
2. **Arxiva el pla vell:** quan el pla nou ja conté el que era viu, el pla de l'Onada anterior ix amb `node tooling/gates/porta-olivera.mjs --arxiva --sec --nom FITXER` i, si la simulació quadra, sense `--sec`.
3. **Declara cada viu amb el seu motiu** a «## Activitat en curs», una línia per document i sense repetir-lo: `· per a [[consumidor]]`, `· torn_ID` o `· Mestre aammdd: motiu`. L'informe de la porta mostra cada viu amb el seu motiu (🌿), o 🍂 si cap motiu no es comprova.
4. **Fes nàixer el pla primer:** el `pla_implementacio` naix abans que el prompt, a la mateixa jornada i amb el mateix HHMM (la Trinitat: pla, prompt de Claude i prompt de Codex). Arriba complet a la convocatòria: «Estat del Pla» triat, i Verificació i Riscos escrits.
5. **Fes la secció 0 del prompt** marcant les caselles del Preflight. Una secció 0 que només diu `[pendent]` no compta com a feta.
6. **Verifica:** `npm run porta:olivera` ix amb 0, cap viu no porta 🍂 i cap línia no diu «[CONV-…]», llevat de «[CONV-07]»: el sediment de l'índex és una mètrica, no una tasca de la convocatòria.

## Límits

`01_produccio/` i `02_investigacio_ia/` queden fora: la porta només veu el primer nivell de l'Escriptori. `--arxiva` trasllada i mai sobreescriu ni esborra, i el que ja és a `90_arxiu_historic/` no s'esborra (AGENTS §5). Pares i preguntes al Mestre només si caldria tocar `01_produccio/` o `02_investigacio_ia/`, esborrar un fitxer, o si la mateixa acció falla dues vegades (AGENTS §10).

## Preflight mecànic de convocatòries

`document.mjs context` i `create` per a `prompt.local` o `prompt.consell` comproven la taula i la convocatòria v4 (vida justificada, àncores sense repetir, trinitat i pla complet) abans d'emetre un rebut nou; en fase «avis» la convocatòria només avisa. Si fallen, resol la classificació amb la porta; el rebut no substituïx la higiene. Les auditories poden documentar una taula bruta. Un document solt creat pel circuit queda declarat viu a «## Activitat en curs», i el sosté el torn del seu rebut mentre el torn siga obert; després necessita un consumidor o una retenció del Mestre. `tancament.mjs` passa la porta i avisa dels vius que només sosté el torn que es tanca.

Una prova de diagnosi etiquetada `[DEFECTE]` pot passar perquè reproduïx el defecte: registra-la com a deute confirmat, no com a reparació. L'informe d'higiene ha de comprovar una taula i un índex existents; zero documents sobre una arrel absent no és verd.

## Lliçons del Mestre

- **260929 · La neteja és acció de l'orquestradora.** Quan l'Escriptori està brut, MarIA l'arxiva amb la porta, verifica el verd i després escriu el prompt.
- **260924 · Arxivar i despenjar l'àncora són un sol acte.** `--arxiva` fa les dues coses en la mateixa passada.
- **260924 · Una àncora pot ser l'únic fil que sosté un document.** Abans de llevar-la, mira on viu el fitxer.
- **260930 · L'Acte Reflex Pre-Arxivament.** Mai més arxives un informe acabat de generar si saps que el següent pas era enviar-lo a un altre agent (ex. Codex). Si ho fas, li furtaràs el document mentre el llig. L'orquestradora no tanca la porta de la sala fins que tots els obrers n'han eixit.

## Vincles
- [[00_INDEX_SKILLS]]
