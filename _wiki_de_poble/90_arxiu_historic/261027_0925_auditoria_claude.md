---
type: informe
status: esborrany
description: Implementació i verificació adversarial dels blocs de codi de la Guarda Nocturna 261027, diagnosi de les portes roges i recerca del bucle autònom.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f19d6d9c-2c50-48fb-a1f6-b55958347b9f:5d001bca-a226-431d-bfe1-e01ed3f3ba1e
---
# Auditoria Claude de la Guarda Nocturna: P1-54, P1-55, Consola, Maquinària i T1-06

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f19d6d9c-2c50-48fb-a1f6-b55958347b9f:5d001bca-a226-431d-bfe1-e01ed3f3ba1e |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T08:25:07.203Z |
| Modificació | 2026-10-27T14:55:00.000Z |
| Propietari | claude |
| Aprovació humana | Mandat del Mestre: prompt i pla 261027_0845 aprovats; el commit queda pendent de la seua decisió |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Claude Code, amb un workflow de 19 subagents |
| Tokens consumits | Uns 4,64 M de tokens de subagents (workflow wf_b3ac7fb8-bb7) més el fil principal; P1-61 Fase 1, uns 3,95 M més (workflows wf_17bd76f1-317 i wf_c0e05e94-4fb); xifres aproximades del harness |
| Torn | torn_f19d6d9c-2c50-48fb-a1f6-b55958347b9f (claude, code), pla 0845 vinculat (hash 8e634687…), 41 fitxers declarats amb document own. P1-61 Fase 1: torn_13fe2c7f-b4f7-4db6-8fad-6e8789e25f2f (claude, code), pla 1154 vinculat (hash c3352c39…), 18 fitxers declarats amb document own |
| Tall d'evidència | HEAD 7e1bc63fa; arbre viu a les 10:45 CET; còpia congelada de l'arbre viu per a les proves |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

Fonts llegides senceres abans d'implementar: el prompt i el pla 261027_0845; el Llibre Mestre (guarda, Fita 18 i 19, P1-54, P1-55, P1-60, P1-63, T1-06); la meua auditoria 2150 (consens P1-54 i P1-55); [[261027_0730_reforma_editorial_gemini]]; [[261027_0730_solucio_opengraph_i_copy_codex]] (§9 sencer; la resta, sencera, pel subagent de recerca); [[261027_0917_auditoria_codex]] (961 línies, amb els quatre annexos) i [[261027_0920_auditoria_gemini]] (215 línies), totes dues en la versió final.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-27T08:25:07.203Z: esborrany creat; contingut i verificació pendents.
- 2026-10-27T08:30Z: còpia congelada de HEAD i línia base: test:precommit verd (175 fitxers, 3.318 proves).
- 2026-10-27T08:35Z: llançat el workflow de 19 agents. Tres carrils d'implementació a l'arbre viu (A: P1-54 i P1-55; B: Consola i Maquinària; C: T1-06), cadascun amb dos revisors adversarials, un esmenador i una reverificació. Tres investigadors de només lectura (D: govern; F: cens de portes; E: recerca del bucle).
- 2026-10-27T09:37Z: workflow acabat, sense cap agent fallit. Revisió personal de cada diff.
- 2026-10-27T09:40Z: tancat el forat de T1-06 que el carril C no podia tocar: la cerca i la targeta del Mur ara passen per paginaPerAppNativa, cadascuna amb una prova que falla sobre el codi vell. Dos comentaris caducats corregits.
- 2026-10-27T09:42Z: comprovació en navegador sobre el servidor de :3340 ja obert; Olivera i SCC en viu; test:precommit en una còpia congelada de l'arbre viu.
- 2026-10-27T09:44Z: pla 0845 vinculat al torn; 41 fitxers declarats amb document own.
- 2026-10-27T09:46Z: informe redactat; suite Vitest sencera en marxa a la còpia.
- 2026-10-27T09:55Z: suite sencera acabada (22.682 verdes; 3 roges heretades, vegeu Verificació); secció pròpia al Llibre Mestre escrita amb comprovació de hash abans i després.
- 2026-10-27T10:00-11:05Z: missió WordPress.org (revisió de socdepoble.zip). Workflow de 7 agents: recerca de fonts primàries, implementació, tres revisors adversarials, esmenador i reverificació. Zip nou del directori i Plugin Check net (CL-11).
- 2026-10-27T10:30-11:25Z: Convocatòria de l'Eixam, P1-61 OpenGraph. Workflow de 5 agents: codi, plataformes, sonda HTTP de només lectura, crítica del prototip de Codex i síntesi. Lectura sencera del pla [[261027_1154_pla_implementacio_opengraph_primera_imatge]], de la v2.1 de Codex 0917 i de la v1.2 de Gemini 0920. Rèplica a CL-12.
- 2026-10-27T11:20Z: aplicades dues esmenes de la revisió creuada (CL-13): la barrera de la pàgina viva es remunta en canviar de comunitat (GN-R01), i mestre_higiene.sh ja no certifica una execució sense exit 0 (GN-R03).
- 2026-10-27T11:35Z: ordre del Mestre: «Comença la Fase 1 de P1-61 només a src/ (selector imatgeSocial.js, client i correcció de seoHead) amb els valors recomanats d'OG-1 a OG-6». Torn torn_13fe2c7f obert i pla 1154 vinculat.
- 2026-10-27T11:37-13:42Z: workflow de 8 agents (wf_17bd76f1-317): selector, client i seoHead a l'arbre viu, tres revisors adversarials (píxel, navegador, seguretat), esmenador i reverificació. 27 troballes; les reals, aplicades.
- 2026-10-27T13:45Z: revisió personal de cada diff; carpeta «~» de memòria cau de Chrome que un agent havia creat a l'arrel, traslladada a l'escratx; prova estàtica del Mur refixada; navegador a :3340; Olivera, SCC, ESLint i test:precommit verds; 15 fitxers declarats.
- 2026-10-27T14:05Z: lectura de la v1.3 de Gemini 0920 (§8.1): la prioritat de l'autor (og_image || featured_image) del Llibre Mestre faltava al selector. Afegida amb proves.
- 2026-10-27T14:07-14:59Z: workflow de verificació de 9 agents (wf_c0e05e94-4fb): mutants, fidelitat i productors, render de punta a punta i completesa contra OG-1 a OG-6. Aplicats: P1-60 (/projecte porta la seua panoràmica), proves de component de la prioritat de l'autor, comentaris caducats, i og_image i featured_image a la neteja del mapejador.
- 2026-10-27T17:30-18:05Z: ordre del Mestre: commit de P1-61 amb T1-06 i P1-55, amb --no-verify. Assaig de l'arbre exacte en una còpia (build, test:precommit i suite sencera). Commit e4c4e076c amb un índex temporal i una guarda de blobs; P1-54 queda fora (CL-14).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum per al Mestre

| Bloc | Estat a l'arbre viu | Decisió pendent |
| --- | --- | --- |
| 1 · P1-54 (accés només a l'aterratge) | FET i verificat en navegador | Cap |
| 2 · P1-55 (pàgina viva de comunitat) | FET i verificat en navegador | Quatre valors per defecte (CL-03) |
| 3.1 · Govern a la Consola incrustada | FET i verificat en navegador | Cap |
| 3.2 · Tasques d'higiene «mortes» | Causa trobada: TCC, no el repòs | Acció del Mestre al seu terminal (CL-06) |
| 3.3 · Poda de sdp-vigilant-tellado | Poda preparada i assajada, no aplicada | Triar poda i tornar a segellar (CL-07) |
| 3.4 · Maquinària pública fora de DEV | FET (jsdom i compilació en procés) | Públic o només superadmin (CL-04) |
| 4 · T1-06 (Apple 2.3.10) | FET a TextSection, lector, cerca i Mur | La xarxa de seguretat, i la Wiki (CL-05) |
| 5 · Recerca del bucle autònom | Memòria lliurada | Propostes per a MarIA (CL-09) |
| WordPress.org · esmenes de la revisió | FET; zip nou, Plugin Check net | Pujar el zip i traduccions (CL-11) |
| P1-61 · OpenGraph a WhatsApp | Fase 1 a src/ FETA i verificada en navegador, commit e4c4e076c amb T1-06 i P1-55 (CL-14); WhatsApp encara no la veu sense el prerender | OG-2 a OG-9 (CL-12) i P1-61-A a D (CL-14) |

No hi ha cap commit, cap stash ni cap escriptura en camins de govern (.agents, .claude, tooling, scripts, package.json). Tot el que toca govern queda preparat a `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/` perquè el Mestre ho execute.

### CL-01 · P1-54: l'accés sense sessió viu només a l'aterratge genèric

- **Fitxer o àmbit:** src/sections/xat/XatSection.jsx (peuDAcces, Conversa, VistaDeLaClosca, cos de les vistes del rail i capçalera d'AccesAlXat); src/sections/xat/XatSection.avatars.test.jsx; comentaris de XatSection.actorsPermanents.test.jsx i components/Compositor.jsx.
- **Evidència:** la condició és ara esAterratge = !threadId && !comunitatId && !vista && !amb && !sobre. És la del consens de l'auditoria 2150 i és idèntica a l'Annex A v2 de Codex. S'usa vista i no vistaActiva, que es declara més avall (TDZ). Sense connectionContext: tancar «Nova conversa» deixa ?context= a la URL, i l'accés ha de tornar. El peu de Conversa i els dos usos que sempre valdrien null s'han llevat. En navegador (:3340, sense sessió): /xat té els tres botons a 1024 px i a 375 px; ?comunitat=fake-sdp, ?comunitat=fake-poble i /xat/fake-iaia en tenen zero. Les proves noves fallen 15 de 39 contra el XatSection.jsx de HEAD, servit per un connector de Vitest sense tocar el fitxer viu.
- **Severitat:** alta (Fita 18, ordre directa del Mestre).
- **Font de veritat:** pla 0845 §1; Llibre Mestre P1-54. Revertix XATR-1 (Gauntlet 261022_0225), com diu el comentari.
- **Proposta:** cap més canvi. Neteja posterior opcional (no feta, cap risc): el prop peu de Conversa i de VistaComunitats ja no el passa ningú, i el comentari de modules.css (al voltant de la línia 4870) sobre «la parella del peu» d'un fil de mostra.
- **requires_human_decision:** false.

### CL-02 · P1-55: la columna dreta pinta la pàgina viva de la comunitat

- **Fitxer o àmbit:** XatSection.jsx (branca nova de rightColumn, ColumnaDretaDeLaComunitat); fitxer nou src/sections/xat/components/FitxaVivaDeComunitat.jsx; extraccions sense canvi de conducta a profile/PerfilPublicSection.jsx (usePerfilPublic exportat, prop ambXat), detail/ItemDetailSection.jsx (PaginaDelDetall intern, VistaDelPoble exportat, prop contenidor), detail/detailSectionMeta.jsx (opció senseXat) i pobles/xatDelPoble.js (fitxaDelSubjecte exportat). Proves noves: FitxaVivaDeComunitat.test.jsx, FitxaVivaDeComunitat.capes.test.js, cinc casos P1-55 a XatSection.test.jsx i el control de pes a XatSection.pes.test.js.
- **Evidència:** l'ordre de prioritat és conversa → error de reobertura → comunitat → aterratge. Una entitat pinta FitxaPublica chrome="context"; un poble pinta el mateix arbre que /pobles/<id> (VistaDelPoble, sense useSEO ni useParams). El títol continua sent «(2) Xat | Sóc de Poble», sense canònic (comprovat en navegador). En mòbil (375 px) no es munta ni es baixa cap dels quatre mòduls nous (comprovat amb performance.getEntriesByType). Contrast amb els criteris de Codex 0730 §9 B: estats de càrrega, absència i error distingibles (Espera, senseFitxa, BarreraDelDocumentDestacat); la key per comunitat remunta en canviar-ne, i cap resposta antiga no hi queda; mai el poble pilot com a reserva; cap amo nou del SEO; el mòbil conserva els canals.
- **Revisió adversarial, esmenat i reverificat:** (1) bloquejant: la pàgina del poble quedava retallada i sense scroll (layout 'page' dins d'una columna amb overflow: hidden). Ara viu dins de .sdp-xat-buit, el precedent del document destacat. Comprovat: scrollHeight 7.892 sobre clientHeight 704, overflow-y auto. (2) «Comentar» de la barra blava tornava a la mateixa comunitat: ara onComment={false}, només en mode incrustat. (3) En un enllaç fred amb sessió, el document genèric s'hi veia mentre arribava la llista: ara, una espera en blanc amb la mateixa regla que «Carregant…».
- **Severitat:** alta (Fita 19).
- **Font de veritat:** pla 0845 §2; Llibre Mestre P1-55; Codex 0730 §9 B.
- **Proposta:** confirmar els valors per defecte de CL-03.
- **requires_human_decision:** true, només per a CL-03.

### CL-03 · P1-55: valors per defecte que ha de confirmar el Mestre

- **Fitxer o àmbit:** FitxaVivaDeComunitat.jsx (capçalera), FitxaPublica (ambXat) i PaginaDelDetall (senseXat).
- **Evidència:**
  - (a) Dins de la pàgina incrustada no hi ha cap botó de xat: ni «Escriu-li al xat», ni «Parlar amb la Gent de …», ni «Comentar» de la barra blava. Es queden Traduir, Compartir i Connectar.
  - (b) Una comunitat que no es pot resoldre mostra la columna genèrica de sempre. És el cas d'una entitat privada o sense resposta en 3 s, d'una clau que resol una persona, o d'un tros que no arriba.
  - (c) En tauleta (mitjà) la pàgina es veu, com en ample.
  - (d) Les targetes del feed de publicacions són les de la pàgina de sempre, també «El Xat · Anar al xat» i «Descàrregues». Filtrar-les demanaria una opció a PublicacionsDeLaFitxa.jsx i PublicacionsDelPoble.jsx, i la pàgina incrustada ja no seria idèntica a la real.
- **Severitat:** mitjana (decisió de producte, no defecte).
- **Font de veritat:** Fita 19 («portada, descripció, dades del poble, avisos i contingut»).
- **Proposta:** acceptar (a), (b) i (c). Per a (d), la meua recomanació és filtrar només «El Xat», perquè és la targeta que la Fita 19 retira, i deixar «Descàrregues».
- **requires_human_decision:** true.

### CL-04 · Bloc 3.1 i 3.4: Govern a la Consola incrustada i Maquinària pública

- **Fitxer o àmbit:** consola/ConsolaSection.jsx (component compartit TaulerAmbGovern; ConsolaIncrustada munta useGovern({ actiu: DEV })); capçaleres derogades de GovernConsola.jsx, governConsola.js, useGovern.js i DiagnosiConsola.jsx. A la Wiki: WikiDePobleSection.jsx (PECES_MAQUINARIA, documentacioMaquinariaActiva, DocumentacioLocal, DATA_DOCUMENTACIO), maquinaria.js i els fitxers nous DocumentacioMaquinaria.jsx i documentacioMaquinaria.js.
- **Evidència:**
  - En navegador (DEV), la Consola de la Wiki pinta «Govern del Mestre» amb les quatre targetes (/consola/govern/requeriments, balanc, certificacio, comunicacio) i, darrere, «La sala de màquines de la Consola». Cap error a la consola del navegador.
  - Fora de DEV, la carpeta «Maquinària de la IAIA» mostra tres fitxes de documentació amb data a la barra taronja (T51). Tractors i Sentinelles són text estàtic més un avís de només lectura; el BIOS és AGENTS.md en només lectura, amb el mateix HTML que PanellAgents (prova de paritat). No hi ha cap botó ni cap selector de fitxers.
  - La frontera de privacitat continua: gestoria/privacitat.test.js compila la Wiki en producció dins del procés i hi comprova que no entra cap import de PanellTractors, PanellSentinelles ni PanellAgents. Per això no s'ha seguit la proposta 3.4 de Gemini (carregar els panells en producció amb els botons desactivats): desactivar un botó no impedix que el panell inicialitze motors i magatzems. Codex hi arriba a la mateixa conclusió (GN-C09).
  - Revisió adversarial esmenada: data T51 a les fitxes; una fitxa de documentació ja no espera el rol; heading del BIOS sense salt de h2 a h4; subtítols que prometien accions impossibles.
- **Severitat:** mitjana.
- **Font de veritat:** pla 0845 §3; acta 261027_0805 §3.4. Deroga en part D3 (261002), que deixava la carpeta només per a DEV o superadmin.
- **Proposta:** decisió D-1: la documentació és pública per a tothom fora de DEV, i la Consola continua només per a superadmin. Si el Mestre volia «llegible en producció només pel superadmin», la reversió és d'una línia (ambCarpetaMaquinaria = ambMaquinaria). Atenció: AGENTS.md sencer passa a ser públic al web, i el que s'hi afija després també ho serà. Hui no hi ha cap secret.
- **requires_human_decision:** true (D-1).

### CL-05 · T1-06: cap altra plataforma mòbil dins de l'app nativa

- **Fitxer o àmbit:**
  - Fitxers nous: src/sections/text/perAppNativa.js i les seues proves.
  - Text: TextSection.jsx (capçalera, useSEO i cos) i paginaDeText.js (lector de connexions i targetes incrustades).
  - Afegits al tancament: search/useCercaGlobal.js amb una prova a SearchSection.test.jsx, i mur/targetesMur.js amb una prova a targetesMur.test.js.
- **Evidència:**
  - PAGE_COPY, legalContent.js i l'empremta de la frontissa no es toquen (frontissa-contingut 15/15). L'empremta cobrix també 'legal': la nota de Gemini que diu que legalContent.js no està blocat és errònia.
  - El text s'adapta en pintar-lo i només dins de l'app (esAppNativa). Dins de l'app, l'Avís legal diu «(el web socdepoble.org i l'aplicació Sóc de Poble) quan vulgues». El Full de ruta perd només els quatre comentaris HTML, que mai no es veien, però que la cerca sí que indexava.
  - Les mencions d'Apple es queden. La web no canvia, byte a byte.
  - La cerca nativa ja no troba «android» a l'Avís legal ni «google play» al Full de ruta, i a la web sí. Esta prova falla sobre el useCercaGlobal.js de HEAD.
- **Risc obert (Codex GN-C09 i la reverificació del carril C):**
  - La xarxa de seguretat lleva sencer qualsevol bloc nou que nomene una altra plataforma i no tinga una adaptació declarada. Per exemple, un paràgraf remot «Si has creat el compte amb Android, pots esborrar…» desapareixeria de l'app sense que ningú ho decidira.
  - Una prova exigix que l'Avís legal i el Full de ruta reals no arriben mai a la xarxa, però el contingut remot del nucli no té eixa guarda.
  - També queden forats d'adversari: referències de caràcter HTML i noms enganxats a una lletra. El contingut és nostre, no d'un atacant, i per això ho tracte com a risc baix.
- **Fora de l'abast:** a la Wiki, 00_index enllaça una acta amb «google_play» al nom del fitxer.
- **Severitat:** alta dins de l'app d'iOS (risc de rebuig de la revisió d'Apple).
- **Font de veritat:** Llibre Mestre T1-06; App Review Guidelines 2.3.10.
- **Proposta:** decisió D-2, sobre què fa la xarxa amb text nou sense adaptació:
  - «fallar tancat»: el bloc no es pinta. És el comportament d'ara; prioritza Apple.
  - «fallar obert amb avís»: es pinta i es registra. Prioritza el dret d'esborrament.

  Recomane mantindre «tancat» i afegir una prova que adapte expressament qualsevol frase legal nova del nucli remot. Per a la Wiki, que MarIA canvie el text visible de l'enllaç de 00_index, sense reanomenar l'acta.
- **requires_human_decision:** true (D-2).

### CL-06 · Bloc 3.2: les tasques d'higiene no estan mortes pel repòs del Mac

- **Fitxer o àmbit:** ~/Library/LaunchAgents/org.socdepoble.higiene.plist (StandardOutPath dins de .immunitari, a ~/Documents); .agents/cron/registre_tasques.json; scripts/immunitari/org.socdepoble.higiene.plist.
- **Evidència:**
  - Unified log del 261027: a les 05:30:05 launchd dispara el calendari. El kernel denega a xpcproxy «Sandbox System Policy deny file-read-data» sobre .immunitari/higiene-cron.out (TCC de ~/Documents). posix_spawn falla amb EPERM i el servei ix amb exit(78) en 9 ms, sense arribar a executar node.
  - El Mac estava encés: last reboot 261026 21:19, i Plaquetes va escriure una recepta a les 05:20.
  - runs=0 és el comptador de l'arrencada de les 09:06; no prova res.
  - Els registres de Plaquetes porten com.apple.macl i els d'higiene no. És una correlació, sense mecanisme demostrat.
- **Contrast:** la proposta 3.2 de Gemini (RunAtLoad=true i una execució manual que reescriga el log) no repara res. RunAtLoad passa pel mateix xpcproxy i rebria la mateixa negativa. L'execució manual només mouria el mtime que llig la Consola: seria un verd fabricat. Codex (GN-C04, GN-C09) diu el mateix: la documentació d'Apple diu que StartCalendarInterval s'executa en despertar.
- **Severitat:** alta (dos avisos roigs reals a la Consola; vigilants-vius 2/3).
- **Font de veritat:** unified log de launchd; construeixMapa.js:544-551.
- **Proposta:**
  - Moure StandardOutPath i StandardErrorPath a ~/Library/Logs/socdepoble-higiene.out i .err, com ja fa Time Machine, i recarregar l'agent.
  - Plist corregit i script preparats: mestre_higiene.sh. El mode --verifica s'ha executat en viu. Els modes --aplica, --prova-ara i --repo NO s'han executat.
  - No tocar avui registre_tasques.json: cap declaració hi és falsa, i «netejar les tasques mortes» seria un verd fals. Després de --aplica cal alinear el camp «registre» i la còpia canònica del plist.
  - Risc latent: Plaquetes depén de com.apple.macl a .immunitari/cron.out, i eixe fitxer està versionat.
- **requires_human_decision:** true (acció al terminal del Mestre; un agent no ha de tocar launchd).

### CL-07 · Bloc 3.3: la poda de sdp-vigilant-tellado

- **Fitxer o àmbit:** .agents/skills/sdp-vigilant-tellado/SKILL.md; SKILLS_SEAL.json.
- **Evidència:**
  - La «porta» és l'avís 'pes', de severitat baixa, del Mapa de la Consola (construeixMapa.js:32-34: 3.000 paraules o 4.000 tokens). La skill en té 3.263. No hi ha cap límit de mida a run-portes, al pre-commit ni a segella.
  - L'expedient «.agents/skills_manifest.sha256» que cita Gemini no existix. A més, segella.mjs sense banderes comprova i no regenera.
  - Hi ha dos podes preparades, i cal triar-ne una, no aplicar-ne les dues. La de Claude té 2.913 paraules (87 de marge), 33 regles de 33, frontmatter idèntic byte a byte i segell nou calculat (c7eca829 → 6b2ed100). La de Codex (Annex B) té 2.991 paraules, amb 9 de marge.
- **Severitat:** baixa.
- **Font de veritat:** pla 0845 §3; inventari de skills (03_inventari_skills.md).
- **Proposta:**
  - Aplicar la poda de Claude, que té més marge i un verificador mecànic de regles.
  - Camí A, al terminal del Mestre: mestre_skill.sh --aplica, i després segella --update amb els hashes ja calculats.
  - Camí B: un agent amb llicència Reflex i executor-mutacio. Este camí torna a segellar dins de la transacció.
  - En tots dos casos, versionar alhora la skill, SKILLS_SEAL.json i la transacció.
- **requires_human_decision:** true (tornar a segellar és acció del Mestre).

### CL-08 · Cens de portes: 25 de 55 roges, amagades per la primera

- **Fitxer o àmbit:** tooling/gates/run-portes.mjs i les portes de deute.
- **Evidència:**
  - Cens executat a les còpies congelades amb sandbox-exec, sense cap escriptura al repositori viu: 25 portes roges i 30 verdes, les mateixes amb estat viu o sense.
  - run-portes s'atura a la primera roja (Psicopatia, pas 6). Per això 24 roges no s'havien vist mai: des del 261020 els commits van amb --no-verify. La cadena sencera dura uns 43 s, dins del límit de 120 s del hook.
  - Algunes es poden pagar en src sense tocar govern:
    - Psicopatia: quatre marcadors allow en proves negatives.
    - InnerHTML: tres proves.
    - Persistència: dos comentaris.
    - Catàleg C1: una entrada a registre.js.
    - Inline-Styles: quatre ponts de variables CSS.
    - Consell L6: 29 claus i18n en cinc diccionaris.
    - Tokens: la feina més grossa.
  - La resta són de govern o decisió del Mestre:
    - la caixa Unicode NFC/NFD de «Banda La Torre - Gestió», que fa roig SCC en qualsevol clon;
    - .claude/settings.json sense versionar;
    - el nom real del fundador a la llavor;
    - els fitxers temporals de Supabase versionats, entre els quals hi ha docker.env.
- **Severitat:** alta per al hook. Les tres portes del mandat són verdes (vegeu Verificació).
- **Font de veritat:** run-portes.mjs; .agents/deute/*.
- **Proposta:**
  - Un mode «--cens» a run-portes, que execute tots els passos sense aturar-se i pinte la taula.
  - Pagar el deute de src en una onada pròpia.
  - Que el Mestre revise primer docker.env.

  No ho he fet esta nit perquè no era al mandat i toca molts fitxers d'altres slices.
- **requires_human_decision:** true (prioritat i les decisions de govern).

### CL-09 · Bloc 5: recerca de coordinació entre Claude, Codex i Gemini

- **Fitxer o àmbit:** memòria sencera a `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/recerca_bucle_autonom.md` (34 KB).
- **Evidència, comprovada esta nit:**
  - Al tall de les 09:37 cap torn de Claude ni de Gemini tenia ownedPaths, i els tres esborranys declaraven els cinc blocs. El Bloc 5 l'han fet tres agents. Esmena de Codex (GN-R07), acceptada: el torn de Codex sí que en tenia quatre des de les 08:34, i el de Claude en té 41 des de les 09:45. El problema de fons continua: el control d'abast documental mira tot l'arbre encara que hi haja ownedPaths.
  - checkTurn, que és de lectura, dona roig als torns documentals de Codex i de Gemini per fitxers de src que són de Claude (turns.mjs:259).
  - La lease del Reflex caduca amb qualsevol canvi de git status.
  - Un mutation.pending.json orfe atura totes les escriptures que passen pel hook.
  - Els noms d'actor són text lliure: «Maria» i «MarIA», «codex» i «Codex».
  - El meu torn de codi no tenia pla vinculat. Ja està vinculat.
- **Propostes, ordenades per valor i cost:**
  - Reclam de blocs a l'Historial de cada informe: qui implementa i qui revisa.
  - Cada torn és propietari del document que crea.
  - El watcher de Vite espera mentre hi ha mutation.lock.
  - Extraure el CAS de Markdown que Olivera ja té (escriuIndex).
  - Les auditores treballen sobre una còpia congelada de l'arbre viu amb manifest. Esta nit Codex auditava HEAD mentre jo editava.
  - Obrir la guarda amb el mode de desconvocatòria que ja existix.

  Codex ho confirma amb el seu experiment sintètic (Annex D): comprovar el hash i fer rename sense un lock compartit no és CAS.
- **Retroalimentació sobre prompt_local.md (v3.10.0):**
  1. Una secció «Repartiment» amb una taula: bloc, implementador, revisor, fitxers propis i eixida.
  2. Les col·lisions conegudes, bloc per bloc. P1-54 i P1-55 compartixen XatSection.jsx.
  3. Les decisions ja preses, escrites: P1-54 és un redisseny aprovat, no una neteja (Llei del Píxel); D3 queda derogada; s'autoritza amagar paràgrafs legals dins de l'app.
  4. Portes per bloc que es puguen executar. test:precommit no cobrix les seccions d'interfície, i la suite sencera dura uns 9 min.
  5. document.mjs create perd els blocs fixos de la plantilla: Gauntlet, criteris d'acceptació i tall d'evidència.
  6. Àncores per identificador, no per línia. ConsolaSection.jsx:57-63 era un comentari.
  7. L'arrel de la sessió ha de ser socdepoble.org, o els hooks no carreguen.
  8. Un sol escriptor per al Llibre Mestre.
  9. Un resum de MarIA del que ha canviat des de l'última nit, davant de la lectura sencera.
  10. Fases: reclams (T0), treball (T1) i revisió creuada a hores fixes (T2).

  Gemini hi afig la ruta correcta de taxonomia: és _wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md, com corregix Codex.
- **Severitat:** mitjana.
- **Font de veritat:** pla 0845 §5.
- **Proposta:** que MarIA incorpore 1, 2, 3, 6 i 7 a la plantilla, i que pugen la versió a protocolledge.json.
- **requires_human_decision:** false per a MarIA; el Mestre aprova la plantilla.

### CL-10 · Contrast creuat amb Codex 0917 i Gemini 0920

- **Consens:**
  - P1-54: la condició de Codex és idèntica a la integrada.
  - La Consola incrustada necessitava useGovern i SeccioGovern.
  - El registre de tasques és declaratiu.
  - La skill té un avís baix, no una porta roja.
  - La Maquinària pública no pot carregar els panells operatius.
- **Esmenes a Gemini que confirme:**
  - !connectionContext impediria recuperar l'accés.
  - FitxaPublica no carrega per tipus i id: rep perfil.
  - RunAtLoad no repara res.
  - skills_manifest.sha256 no existix.
  - legalContent.js sí que està dins de l'empremta.
  - El verd de tancament.mjs --check sense torn no equival a --check --turn-id.
- **Esmena de Codex que ja estava resolta:** l'observació sobre perAppNativa (un bloc desconegut es perd) és certa i queda com a decisió D-2 (CL-05).
- **Pegats de Codex:** no s'han aplicat. L'Annex A coincidix amb el codi integrat. L'Annex B situa DocumentacioMaquinaria a tractors/ i modifica privacitat.test.js, mentre que la versió integrada no toca la frontera. L'Annex C ara passa: TextSection natiu i paginaDeRuta nets.
- **Severitat:** informativa.
- **Font de veritat:** els tres informes.
- **Proposta:** Codex i Gemini auditen la versió integrada sobre una còpia congelada de l'arbre viu, no sobre HEAD.
- **requires_human_decision:** false.

### CL-11 · WordPress.org: la variant del directori sense languages/ ni load_plugin_textdomain

- **Fitxer o àmbit:**
  - Fitxer nou: wordpress-plugin/includes/idioma-local.php.
  - Canvis: wordpress-plugin/includes/idioma.php, wordpress-plugin/socdepoble-enxufe.php (el require condicional i el comentari de peces) i wordpress-plugin/eines/empaqueta.mjs.
  - Proves: tests/enxufe-empaqueta.test.mjs i tests/enxufe-plugin.test.mjs.
  - Comentaris: includes/actualitzador.php i tests/enxufe-pantalla.test.mjs.
- **Evidència:**
  - Si es lleva load_plugin_textdomain de l'idioma.php compartit, el paquet del canal propi deixa de carregar les seues traduccions. En WordPress 6.5 i posteriors, la càrrega «just in time» només mira WP_LANG_DIR, i la reserva d'abans de la 6.5 no hi corre. Per això la crida i la reserva passen a idioma-local.php, que només viatja al canal propi. Fonts primàries: class-wp-textdomain-registry.php i l10n.php de wordpress-develop (6.6 i trunk).
  - L'empaquetador té una sola llista del que no va al directori: FORA_DEL_DIRECTORI, amb actualitzador.php, idioma-local.php i languages/. variantDirectori() lleva també la capçalera Domain Path: Plugin Check avisa amb plugin_header_nonexistent_domain_path quan apunta a una carpeta absent.
  - Abans d'escriure el zip, una comprovació refusa qualsevol languages/, .l10n.php, .mo, .po o load_plugin_textdomain.
  - Ajustos de la revisió adversarial:
    - el readme del directori ja no diu que porta les traduccions;
    - marcatge.php, només al directori, crida wp_set_script_translations sense camí a una carpeta absent;
    - el canal propi no es pot signar sense idioma-local.php.
  - Mode nou: `node wordpress-plugin/eines/empaqueta.mjs --directori`. Escriu només el zip del directori, a partir dels builds ja signats; no toca el canal ni demana clau.
  - El JavaScript no s'ha recompilat: els 24 fitxers de dist/ són idèntics byte a byte als del paquet en revisió. Recompilar hauria enviat a WordPress.org els canvis d'esta nit sense commit.
- **Resultat:**
  - Zip: `wordpress-plugin/builds/directori/socdepoble.zip`, 2.911.541 B, 40 entrades, SHA-256 05a21a5bf80113dd28d5077dfa2e5414f5c4394c4f6fd840469cc174d4fb1f51, determinista.
  - Plugin Check 2.1.0 en mode nou, sobre una còpia de WordPress 7.1.2: «No errors found». El paquet antic reproduïx l'avís dels revisors (load_plugin_textdomainFound a includes/idioma.php:19).
  - En temps d'execució, en_US, ca i ca_valencia: sense avisos. El canal propi continua carregant languages/.
  - Proves enxufe: 132 de 132 sense cap roja, en PHP 8.2, 8.3 i 8.4 (2 diagnòstics «todo» heretats). Els 23 fitxers signats del canal estan intactes.
- **Severitat:** alta (bloqueja l'alta al directori).
- **Font de veritat:** el dictamen dels revisors de WordPress.org (261027); Plugin Check (DiscouragedFunctions, Plugin_Header_Fields_Check).
- **Proposta (accions del Mestre):**
  1. Pujar este zip, no el de `_builds_de_poble/wordpress/socdepoble.zip`, que és l'antic, i no executar `--lleuger`, que el sobreescriuria.
  2. En la resposta als revisors, citar la seua petició; cap norma escrita del directori prohibix portar traduccions, és decisió seua.
  3. Després de l'aprovació, importar la traducció a translate.wordpress.org (ca i ca-val) i demanar PTE a make.wordpress.org/polyglots. Fins al 90 % «Current», els llocs en valencià veuran l'anglés.
  4. Decidir com passen a les actualitzacions de WordPress.org les instal·lacions que porten l'Update URI propi: cal una última versió signada sense Update URI.
  5. Al commit, idioma-local.php entra amb idioma.php, socdepoble-enxufe.php i empaqueta.mjs.
- **requires_human_decision:** true (la pujada, la traducció i el commit).

### CL-12 · P1-61 OpenGraph: rèplica al pla de Codex 1154 i a Gemini §7

- **Fitxer o àmbit:**
  - El pla [[261027_1154_pla_implementacio_opengraph_primera_imatge]] (Codex), §10.
  - Gemini 0920 §7.
  - El codi del head: index.html, src/hooks/useSEO.js, src/hooks/seoHead.js, src/sections/detail/detailSectionMeta.jsx, src/sections/mercat/imatgesDeProducte.js, src/sections/text/TextSection.jsx i src/sections/wiki-de-poble/WikiDePobleSection.jsx.
  - Els productors: tooling/gates/build-seo-manifest.mjs.
  - La configuració: firebase.json.
- **Evidència nova (sonda HTTP de només lectura i lectura del codi):**
  - Tots els clients reben el mateix HTML: WhatsApp, facebookexternalhit, TelegramBot, Twitterbot i un navegador. Són 5.330 B, idèntics a dist/index.html: el shell de Firebase de la publicació del 25-10, amb el mapa verd fix a index.html:29.
  - A producció, la samarreta és contingut d'administració remot: app_content, clau marketItems. Un GET anònim el pot llegir. Té 7 imatges i la primera és 01-chica-jersey.png.
  - Les còpies del repositori s'han desviat amb la mateixa versió 250035: marketSeed.js en té 8 i seed.sql també 8, però en webp. La primera, però, és la mateixa a totes tres.
  - El navegador ja tria bé la primera foto: imatgesDeProducte és la mateixa font per a l'heroi i per a useSEO. El que falta és qualsevol camí de servidor.
  - El productor de WordPress tria image_url, i si no n'hi ha, avatar_url: per a la samarreta, el logo quadrat.
  - 01-chica-jersey.png són bytes JPEG amb extensió .png: 1024×1024 i 782.271 B. No hi ha cap derivada de 1200×630. La guia de Meta per a WhatsApp demana menys de 600 KB.
  - Defecte compartit per les tres IAs: si el head ja ve particularitzat, seoHead.js en fa la base (`baseline ||= capture()`). Després de navegar, la foto del producte quedaria a les rutes següents.
- **Posició de Claude, punt per punt de §10:**
  1. **Selector compartit:** acord. Proposte `src/config/imatgeSocial.js`, sense cap import i amb una prova que ho vigila, al costat de politicaDeMitjans.js, que ja importa l'empaquetador de Node. Adopte els estats tipats de Codex: triada, absent, bloquejada i no resolta.
  2. **Primera foto bloquejada:** acord amb Codex. Mai es passa a la segona foto ni al logo. En el build estàtic, la ruta queda neutral i la comprovació del release ix roja.
  3. **Avatars, emblemes i SOCIAL_IMAGES:** només quan no hi ha cap imatge de contingut. Les pàgines de perfil són l'excepció i conserven l'avatar propi. No adopte la cadena de Gemini, que posa l'emblema o l'avatar abans de la reserva per a publicacions.
  4. **Mercat estàtic o dinàmic:** propose una via intermèdia amb dues fases.
     - **Fase 1, estàtica.** Cobrix el contingut d'administració públic d'app_content (marketItems, towns, events, pages), llegit de la projecció remota i mai de la llavor. Codex té raó que la llavor no prova res.
     - **Fase 2, Cloud Run.** Cobrix el contingut de veïns (section_submissions), que avui només llegixen els membres. Depén d'una projecció pública opt-in.

     La Fase 1 arregla el cas del Mestre sense Blaze, sense funció i sense latència per a les persones. La retirada arriba amb el desplegament següent, i una comprovació --verifica ix roja si producció ja no coincidix amb la instantània.
  5. **Memòria cau a la Fase 2:** desacord parcial amb `private, no-store`. Cada visita humana a les rutes reescrites cridaria Cloud Run, i el Mestre demana no penalitzar-les. Propose `public, max-age=0, s-maxage=60`, sense SWR, per al contingut revocable: la retirada triga 60 s com a màxim al nostre costat. El termini T_rev el fixa el Mestre.
  6. **Sense carpetes noves:** acord amb Codex, i descarte dist/<ruta>/index.html.
     - Els HTML van com a fitxers plans dins de dist/.
     - Les derivades van com a fitxers dins del dist/assets/ que ja existix.
     - Les rutes van com a rewrites exactes generades en build, en un firebase.social.json ignorat per git que es desplega amb --config. Així el firebase.json versionat no canvia a cada contingut.
     - Les eines nouves van dins de tooling/gates o de tooling/wiki, no a tooling/seo.
  7. **Derivada social:** JPEG de 1200×630 sense EXIF, nom per hash i tipus llegit dels bytes. L'objectiu és ≤300 KB i el límit dur 600 KB. La foto sencera va dins del marc, sobre un fons difuminat de la mateixa foto i sense cap logo.
  8. **seoHead i useSEO:** acord a tres. La base es construïx des de constants quan el head porta data-sdp-ssr; el conjunt d'imatge s'escriu sempre; og:type passa a estar gestionat; i el JSON-LD injectat porta data-sdp-seo.
  9. **seo-client.patch:** no aplica net sobre l'arbre viu (2 trossos fallen). Es refà sobre els fitxers vius. El canonical de la Wiki s'obté amb un paràmetre search a useSEO.
- **Ordre d'execució per a Claude, quan hi haja consens:**
  1. El selector i les seues proves.
  2. El client, perquè l'heroi i l'og:image siguen la mateixa referència per construcció.
  3. La correcció de seoHead i useSEO.

  Estos tres passos només toquen src/ i no arreglen WhatsApp sols. Després van les eines, amb l'executor i una llicència Reflex: exportador de la projecció, derivades, manifest, escriptor del prerender, build-seo-manifest de WordPress i la sonda posterior al desplegament. Finalment, un canal de previsualització de Firebase (acció del Mestre) abans de producció.
- **Severitat:** alta (difusió per WhatsApp).
- **Font de veritat:** la regla invariant del Mestre (P1-61); Open Graph; la guia de Meta per a WhatsApp.
- **Proposta (decisions del Mestre):**
  - OG-1. La reserva sense cap imatge: la targeta de 1200×630 que ja hi ha, que porta el logotip sobre el mapa verd (recomanat), o el logo quadrat de 256 px de Codex, que WhatsApp pintaria menut.
  - OG-2. Acceptar la Fase 1 estàtica per al contingut d'administració, amb la retirada lligada al desplegament, i dir qui desplega quan s'edita el Mercat.
  - OG-3. Fase 2: el pla Blaze, i una projecció pública opt-in del contingut de veïns. Una targeta que WhatsApp ja ha copiat no es pot retirar.
  - OG-4. Com es fa 1200×630 d'una foto quadrada: foto sencera sobre fons difuminat (recomanat) o retall.
  - OG-5. Les pàgines de llista i la portada: la targeta genèrica (recomanat).
  - OG-6. Els documents de la Wiki amb ?item=: genèrics fins a la Fase 2, o una ruta nova /wikidepoble/<item>.
  - OG-7. Privacitat, urgent: 08-javi-llinares-perfil-1024px.jpg i la seua bessona .webp són públiques, i producció enllaça la .webp. Totes dues porten 6 etiquetes GPS a l'EXIF; se n'ha comptat el nombre, sense llegir-ne els valors. Cal decidir si es reencoden sense metadades o se substituïxen.
  - OG-8. Quina és la font canònica del Mercat: la fila remota (7 fotos) o les llavors (8). Cal regenerar seed.sql?
  - OG-9. app_content exposa la clau notes a lectura anònima (2 entrades). Cal confirmar que és contingut de demostració, o tancar-la amb RLS. A més, www.socdepoble.org no té certificat TLS.
- **requires_human_decision:** true (OG-1 a OG-9; i el consens de MarIA abans de picar codi).

### CL-13 · Esmenes de la revisió creuada aplicades

- **Fitxer o àmbit:**
  - src/sections/xat/XatSection.jsx (ColumnaDretaDeLaComunitat) i XatSection.test.jsx.
  - `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/mestre_higiene.sh`.
- **Evidència:**
  - **GN-R01 (Codex; Gemini 7.3):** la key de la comunitat era al fill, i la barrera guardava l'error d'un tros que no havia arribat. Ara la key va a la barrera. La prova nova provoca un tros fallit a c-1 i navega a c-2, que pinta la seua pàgina viva. Contra el codi sense la key, falla (1 de 1). Suite xat: 104 fitxers, 1.355 proves verdes; ESLint net.
  - **GN-R03 (Codex):**
    - --prova-ara espera que l'execució acabe i exigix last exit code 0, un registre nou i cap negativa del sandbox; si no, ix amb 1.
    - --repo refusa alinear el repositori si el plist instal·lat no és el corregit o si encara no hi ha hagut cap execució neta.
    - Sintaxi comprovada amb bash -n; no s'ha executat cap mode.
  - **GN-R04 (Codex):** el camí A de mestre_skill.sh fa la còpia abans del lock de segella, i per això no és una transacció sencera. Recomane el camí B (executor-mutacio), que hi coincidix.
  - **Fora d'abast, proposat:** GN-R02 (b). La pàgina viva descarta el reintent del perfil quan passen els 3 s: una connexió rural lenta veu la columna genèrica sense cap botó per a tornar-ho a provar. És una millora petita i separada.
- **Severitat:** mitjana.
- **Font de veritat:** [[261027_0917_auditoria_codex]] GN-R01, R03 i R04; [[261027_0920_auditoria_gemini]] 7.3.
- **Proposta:** cap més canvi ara. El reintent de GN-R02 (b) pot anar en una onada pròpia.
- **requires_human_decision:** false.

### CL-14 · P1-61, Fase 1 a src/: selector únic, head del client i correcció de seoHead

- **Fitxer o àmbit:**
  - Nous: src/config/imatgeSocial.js (fulla sense cap import) i la seua prova; ItemDetailSection.imatgeSocial.test.jsx; TextSection.imatgeSocial.test.jsx.
  - Tocats: ItemDetailSection.jsx, TextSection.jsx, hooks/seoHead.js i hooks/useSEO.js, amb les seues proves.
  - Tocats per coherència: UniversalUtils.js i paginaDeText.js importen MARQUES i HERO_PER_DEFECTE del selector, amb el mateix conjunt d'exports que a HEAD. data/mapejadorSeccions.js i la seua prova. La prova estàtica mur/qualitat.imatgesPropies.test.js. Un comentari de XatSection.jsx.
- **Què fa, amb els valors recomanats d'OG-1 a OG-6:**
  - **Selector.** primeraImatgeSocial(tipus, item) torna tres estats: triada, bloquejada o absent.
    - Primer va la imatge que l'autor tria per a xarxes: og_image, o si no, featured_image. És la directiva del Mestre al Llibre Mestre (P1-61, àudio de les 12:08), que Gemini va recordar a 0920 §8.1.
    - Després, les que pinta el detall, en el seu ordre: el Mercat, com imatgesDeProducte; el Mur, l'agenda i els Pobles, com detailSectionMeta.jsx; les pàgines, page.image i el cos.
    - Una primera que no es pot servir queda bloquejada (SVG, privada, signada, d'un altre origen, un camí brut). Mai es passa a la segona ni al logotip.
    - Els avatars de qui signa o ven i les reserves de pintura no compten com a imatge.
  - **Client.** ItemDetailSection (Mercat, Mur, agenda i Pobles) i TextSection envien eixa imatge a useSEO, amb el seu alt. La portada i el carrusel no canvien (Llei del Píxel).
  - **OG-1.** Sense imatge, la targeta de 1200×630 sencera: tipus, mides i alt, sempre sobre socdepoble.org, també en dev.
  - **OG-5 i OG-6.** Les llistes, la portada i els documents de la Wiki amb ?item= porten la genèrica.
  - **Fora de src/.** OG-2, OG-3 i OG-4 són d'eines i de desplegament, i no s'han tocat.
  - **P1-60 (Llibre Mestre, Fita 24, àudio de les 05:08).** /projecte porta al SEO la seua panoràmica de Pedra Seca, que nomena com a page.image. El panorama que posa la pintura a una pàgina sense image continua sent reserva, i també als pobles i a la resta de tipus.
  - **seoHead.**
    - Un head marcat amb data-sdp-ssr ja no es fa base.
    - Mentre l'SPA és a la ruta que declara el canonical o l'og:url marcat, el client no el toca. En eixir-ne, se'n van els nodes marcats i s'escriu el head complet de la ruta nova.
    - og:type passa a estar gestionat.
    - El document destacat de /xat registra el seu SEO com a reserva, i la pestanya conserva «(N) Xat».
  - **Model de dades.** og_image i featured_image són claus d'imatge del payload, amb la mateixa neteja que la resta (mapejadorSeccions.js).
- **Evidència:**
  - **Navegador (:3340, sense sessió).**
    - /mercat/samarreta-socdepoble porta og:image https://socdepoble.org/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png, amb l'alt «Samarreta Sóc de Poble», i el carrusel comença per la xica.
    - /mur i /xat porten la targeta genèrica sencera. /xat conserva «(2) Xat» i noindex.
    - /projecte porta la panoràmica amb l'alt «Il·lustració d'un poble rural connectat», tant en càrrega directa com després de navegar a /mur i tornar-hi.
    - Cap error a la consola.
  - **Mutants**, servits per un connector de Vitest sense tocar l'arbre viu:
    - 6 del selector: portada vella, avatars, salt a la segona, bloquejada com a absent, cos davant i qualsevol origen.
    - 22 de l'esmenador.
    - 21 de la prioritat de l'autor i 2 de portada.
    - El del panorama (P1-60): 4 proves roges.
    - El mapejador de HEAD: 2 proves roges.
    - Tots morts.
  - **Workflows adversarials.** N'hi ha hagut dos, de 8 i de 9 agents. Troballes reals aplicades:
    - el títol de /xat que es perdia;
    - el head servit que s'esborrava a la seua pròpia ruta;
    - la targeta en dos orígens;
    - l'alt absent;
    - una expressió regular quadràtica (188 KB en 3 s);
    - els logotips d'altres hosts presos per reserva;
    - la prioritat de l'autor;
    - P1-60;
    - les proves de component de la prioritat;
    - els comentaris caducats.
- **Neteja d'un error propi:** un agent va arrancar Chrome sense --disk-cache-dir i va deixar una carpeta «~» de 58 MB a l'arrel del repositori. Només contenia memòria cau. L'he traslladada a l'escratx de la sessió, fora de l'arbre. Els scripts de navegador porten ara el cwd i la memòria cau a l'escratx.
- **Decisions obertes per al Mestre:**
  - **P1-61-A.** Una og_image que és una reserva o l'avatar de qui ven compta com a tria feta: featured_image no hi entra, i la pàgina cau a la seua primera imatge. Una prova fixa este comportament i el marca com a decisió oberta.
  - **P1-61-B.** La tria de l'autor pot ser qualsevol imatge servible, també una que la pàgina no pinta. Si «quina de les imatges» vol dir només les de l'element, el selector la pot limitar a les candidates de la pàgina.
  - **P1-61-C.** Una og_image en forma d'objecte ({ url }) o de número no compta avui. Cal fixar la forma que escriurà el selector d'autor de la Fase 2.
  - **P1-61-D.** Una migració que afija og_image i featured_image a la neteja del servidor (sdp_mur_imatges_propies), perquè les URL de tercers no es guarden.
  - **Pendents de la primera revisió:**
    - les huit reserves dels pobles que no són el panorama;
    - una primera imatge de tercers que la portada amaga;
    - les fotos de variació quan la galeria és buida;
    - og:type 'product' sense etiquetes product:*.
- **Per a altres mans:**
  - **Pla [[261027_1154_pla_implementacio_opengraph_primera_imatge]] (Codex).** Hi falten la regla de l'autor i P1-60 (línies 47, 78 i 91). Proposta per a la línia 47: «Cap avatar, hero de reserva o targeta social dissenyada a part pot passar davant d'una foto de la galeria o del cos; només hi passa la imatge que l'autor tria per a xarxes (og_image, o si no, featured_image), quan hi és (Llibre Mestre, P1-61).»
  - **Productor de WordPress (build-seo-manifest.mjs).** Encara tria image_url o l'avatar. L'ha d'adoptar en el pas de les eines.
- **Ajornat, amb motiu:**
  - El canònic de la Wiki amb ?item= (CL-12, punt 9) i la comparació de la query en el head servit van amb OG-6 a la Fase 2.
  - El quart estat, «no resolta», és del port del servidor.
- **Commit:** fet, per ordre del Mestre (27-10-2026): `e4c4e076c` a backup-notes-publish, sense pujar, amb --no-verify. Porta P1-61, T1-06 i P1-55 junts: 34 fitxers. D'XatSection.jsx només hi van els trossos de P1-55 i el comentari de P1-61. Els de P1-54 continuen a l'arbre viu, i també les seues proves, la Consola, la Maquinària, WordPress.org i els documents. Abans del commit, l'arbre exacte es va assajar en una còpia fora del repositori:
  - ESLint net i vite build correcte;
  - test:precommit: 3.318 Vitest i 262 node;
  - la suite sencera, amb només les 3 roges heretades.
- **Severitat:** alta. Estos canvis no arreglen WhatsApp sols: els rastrejadors no executen JavaScript, i cal el prerender de les eines (OG-2).
- **Font de veritat:** el Llibre Mestre (P1-60 i P1-61), [[261027_1154_pla_implementacio_opengraph_primera_imatge]] i [[261027_0920_auditoria_gemini]] §8.1.
- **requires_human_decision:** true (P1-61-A a P1-61-D, el commit i el pas de les eines).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| npm run test:precommit, còpia congelada de l'arbre viu (10:45), VITE_UMAMI_WEBSITE_ID buit | exit 0; Vitest 175 fitxers, 3.318 verdes i 49 omeses; node 256 de 256 |
| node tooling/gates/porta-olivera.mjs --informe, en viu | exit 0 |
| node tooling/gates/verificador-scc.mjs, en viu | valid: true; 234 fitxers, zero errors |
| Suite Vitest sencera (npx vitest run), còpia congelada | exit 1: 1.322 fitxers verds, 2 roigs i 9 omesos; 22.682 proves verdes, 3 roges i 157 omeses. Les 3 roges són heretades i alienes a este torn. censImatges.test.js (dos casos) falla per public/assets/fotos/iaia_maria_avatar_mobil.png, versionat des del 261024 i fora del cens. laParroquia.test.js (un cas) falla perquè 04_escriptori/02_investigacio_ia és buida des del trasllat del laboratori del 261026 (MAPA_IMATGES.txt absent). Cap fitxer tocat per este torn hi intervé |
| Suites dirigides finals dels carrils (arbre viu) | xat 104 fitxers i 1.354 proves; xat, profile, detail, pobles i companyes 139 fitxers i 2.186 proves; consola i wiki-de-poble verdes; text 15 fitxers i 164 proves; search 7 fitxers i 127 proves; mur i calendari 43 fitxers i 719 proves |
| Mutants (fitxer servit per un connector de Vitest, sense tocar el viu) | P1-54: 15 vermelles contra HEAD; P1-55: 11 mutants, tots vermells; cerca nativa: 2 vermelles contra el useCercaGlobal.js de HEAD |
| ESLint --max-warnings=0 sobre tots els fitxers tocats | exit 0 |
| Navegador (:3340, DEV, sense sessió) | /xat amb 3 botons a 1024 i a 375 px; fake-sdp i fake-poble amb 0 botons i la seua pàgina viva (h1 «Sóc de Poble», «Gent de La Torre»), títol «(2) Xat», sense canònic; /xat/fake-iaia amb 0; mòbil sense cap mòdul de la pàgina viva baixat; Wiki: Consola amb Govern i quatre targetes; cap error a la consola del navegador |
| frontissa-contingut | 15 de 15 (PAGE_COPY i legalContent intactes) |
| WordPress.org: proves enxufe (7 fitxers) amb PHP 8.2, 8.3 i 8.4 de Studio | 132 proves: 130 verdes, 0 roges i 2 «todo» heretats, en cada versió |
| WordPress.org: Plugin Check 2.1.0 (mode nou, inclosos els avisos de severitat baixa) sobre WordPress 7.1.2 | zip nou: «No errors found»; zip antic: reproduïx load_plugin_textdomainFound |
| WordPress.org: canal signat i builds | 23 de 23 fitxers .json i .sig iguals; 348 de 348 fitxers de dist/ iguals; zip nou determinista (05a21a5b…) |
| P1-61: sonda HTTP de només lectura (5 agents d'usuari) | mateix HTML de 5.330 B per a tots; og:image genèric; cap Vary per User-Agent |
| CL-13: barrera de la pàgina viva | prova nova verda, roja sense la key; suite xat 104 fitxers i 1.355 proves verdes |
| CL-14: npm run test:precommit, arbre viu (15:58 CET), VITE_UMAMI_WEBSITE_ID buit | exit 0; Vitest 175 fitxers, 3.365 verdes i 2 omeses; node 262 de 262 |
| CL-14: suite Vitest sencera, arbre viu | exit 1: 1.324 fitxers verds, 3 roigs i 9 omesos; 22.862 proves verdes, 4 roges i 101 omeses. Les 4 són heretades: censImatges.test.js (dos casos) i laParroquia.test.js (un cas), les mateixes de dalt; i App.appsLocals.test.jsx (lector en mode remot), que continua roja amb tots els fitxers de P1-61 servits en la seua versió de HEAD i depén del .env.local de l'arbre viu (la còpia congelada no en porta) |
| CL-14: suites dirigides finals (config, detail, text, hooks, mur, data) | 57 fitxers i 785 proves verdes; data, 124 fitxers i 2.397; abans de les esmenes finals, config, hooks, detail, text, mur, mercat, pobles, xat, universal i pwa, 398 fitxers i 5.772 |
| CL-14: mutants (connector de Vitest, sense tocar el viu) | selector 6 de 6; esmenador 22 de 22; prioritat de l'autor 21 de 21 i portada 2 de 2; panorama P1-60 mort per 4 proves; mapejador de HEAD mort per 2 proves |
| CL-14: navegador (:3340, DEV, sense sessió) | samarreta: og:image 01-chica-jersey a socdepoble.org amb alt, carrusel igual; /mur i /xat: targeta genèrica sencera, /xat amb «(2) Xat» i noindex; /projecte: la panoràmica amb el seu alt, directa i després de navegar; head servit injectat (CDP) conservat a la seua ruta i retirat en eixir-ne; cap error a la consola |
| CL-14: Olivera, SCC i ESLint --max-warnings=0 sobre els 18 fitxers declarats, en viu | exit 0; valid: true; exit 0 |

test:precommit només cobrix les proves de seguretat i de dades (vitest.precommit.config.js). Per això les seccions d'interfície tocades es comproven amb les suites dirigides i amb la suite sencera.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Res no s'ha comprovat en Safari, en iOS ni en un dispositiu real. El scroll de la pàgina del poble s'ha mirat en Chromium a 1440, 1024 i 820 px.
- La documentació pública de la Maquinària només es veu en una compilació de producció, i no n'he fet cap a l'arbre viu. La comprova la compilació en procés de gestoria/privacitat.test.js (write:false) i jsdom.
- La branca d'enllaç fred amb sessió en remot de P1-55 només s'ha provat en jsdom: no tinc sessió al navegador.
- No he executat run-portes ni npm run porta en viu: la Porta Build pot recompilar. El cens s'ha fet a les còpies.
- Govern: cap escriptura a .agents, .claude, tooling, scripts ni launchd. Ni la poda ni el plist són aplicats; els scripts del Mestre són a `_investigacio_ia_de_poble/261027_0920_guarda_nocturna_claude/governanca/`.
- Arbre compartit: Gemini ha escrit ESTAT, LEDGER, l'índex i el Llibre Mestre durant el torn. No he revertit res d'altri. El Llibre Mestre l'actualitze en una secció pròpia, al final.
- Sense commit ni stash: és decisió del Mestre. El hook no pot passar (CL-08), i qualsevol commit necessitaria la seua ordre explícita amb --no-verify.
- P1-61 Fase 1: cap rastrejador real (WhatsApp, Telegram, Facebook) no ha vist estos canvis. No executen JavaScript, i producció no s'ha desplegat. El head servit (data-sdp-ssr) s'ha provat amb un head injectat en Chrome sense interfície i en jsdom, no amb un prerender real, que encara no existix.
- No queda cap cron, schedule ni workflow meu actiu.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles]]
- [[261027_0845_prompt_guarda_nocturna_claude_codex_gemini]]
- [[261027_0917_auditoria_codex]]
- [[261027_0920_auditoria_gemini]]
- [[261027_0730_reforma_editorial_gemini]]
- [[261027_0730_solucio_opengraph_i_copy_codex]]
- [[261027_1154_pla_implementacio_opengraph_primera_imatge]]
