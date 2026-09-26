---
type: document
status: esborrany
description: Regularització documental del fitxer actiu amb original immutable i rebut actual; contingut editorial original conservat
tags:
  - implementacio
visibility: private
reflex: sdp:torn_38e3e8e5-ec5c-4070-8cce-c55d6341b6d4:94004141-d077-485b-81c4-7db632f52fec
---
# Pla Claude importat amb procedència documental verificable

**Estat del Pla:** en elaboració (regularització; no canvia l’aprovació de l’original)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_38e3e8e5-ec5c-4070-8cce-c55d6341b6d4:94004141-d077-485b-81c4-7db632f52fec |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-25T15:19:52.304Z |
| Modificació | 2026-09-25T15:19:52.304Z |
| Propietari | codex-regularitzacio |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Regularització: GPT-6, variant no exposada. Model de l’original no verificat. |
| Tokens consumits | Mesura no disponible; estimació no calculada. |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-25T15:19:52.304Z: revisió d’importació; original conservat, revisió editorial pendent.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Importació explícita de _wiki_de_poble/04_escriptori/260925_1655_pla_implementacio_claude.md; SHA-256 original 161becb7f98b839f218b325ff4d5e3e9ee80112f81662f6178f54658b691620e. No acredita una lectura anterior ni revalida les conclusions de l’original.

### Pla d'Implementació Claude: Formateig Editorial i Pedra Seca

<!-- SDP:SECTION pla.local.s0 -->
### Context
El Mestre ha detectat que l'estil visual i el formateig dels arxius `.md` a la Universal Page grinyola. Els títols massa llargs es desborden, algunes pàgines no tenen "entradilla" (resum sota el títol), i l'exportador/parsejador de MD a HTML no acaba de deixar-ho tot net i bonic. S'exigeix l'entrada de **Claude Ultra Code** per arreglar el disseny editorial del sistema Pedra Seca.

<!-- SDP:SECTION pla.local.s1 -->
### Fase 1: Enfortiment del CSS Editorial i Parseig
Cal investigar el parseig actual de Markdown i perfeccionar-lo (per suportar entradilles). També s'han d'afegir les regles de CSS `word-break: break-all` o `overflow-wrap: break-word` als elements del Sidebar o contenidors perquè els títols llargs sense espais es tallen correctament sense eixir del marge. Títols sense punts finals.

<!-- SDP:SECTION pla.local.s2 -->
### Fase 2: Revisió Profunda dels Arxius MD
Revisar i reformatejar tots els arxius Markdown de `_wiki_de_poble/` i les seues "entradilles". Claude té autorització per inventar o redactar les entradilles adients. També cal detectar i eliminar duplicitats o contradiccions conceptuals en estos fitxers històrics antics.

<!-- SDP:SECTION pla.local.s3 -->
### Fase 3: Reformateig de la Consola i Targetes "At a Glance"
El Mestre ha revisat la Consola Termodinàmica i exigeix les següents millores visuals i funcionals per a fer-la una vertadera eina forense i psiquiàtrica:
1. **Format Editorial Complet:** Totes les sub-pàgines de la consola han de tindre obligatòriament el seu H2 i la seua "entradilla" descriptiva. Cal revisar totes les vistes i redactar/generar les que falten perquè totes isquen amb el format editorial correcte.
2. **Targetes Enriquides i Etiquetes:** Les targetes de resum han de mostrar d'un colp d'ull què passa dins, utilitzant etiquetes o "badges" de colors (ex: "cal reparar", "important", "canvis nous") perquè el Mestre no haja de fer clic innecessàriament.
3. **Reparació Funcional i Visual:** Les seccions desplegables de tipus "Veure detall de..." actualment es queden a mitges i es mostren lletges, a més de generar errors. Cal arreglar aquest comportament i dissenyar-ho de manera atractiva i funcional.
4. **Eliminar Duplicat del Graf:** Elimina la pàgina/targeta `obrir_graf` de la llista de la Wiki (arrel), ja que ara en tenim una versió nova i millorada a la Consola Termodinàmica (`consola/explorador`). **Molt important:** No esborres el codi (lògica React) que dibuixa el graf, perquè la versió de la consola el necessita per a funcionar; només lleva l'accés duplicat antic.
5. **Efecte WOW i Zoom a l'Explorador del Cervell:** A la pàgina de l'explorador de la Consola, actualment els filtres ocupen tota la part superior i empenyen el graf cap avall. Reorganitza la interfície perquè el graf siga el primer que es veja en entrar (efecte WOW), i els filtres es mostren baix o en una consola lateral ben dissenyada i compacta. A més, **implementa el zoom in/out amb la rodeta del ratolí** perquè siga idèntic a Obsidian i l'usuari puga navegar còmodament per la galàxia de nodes.
6. **Disseny Editorial (Recuperació de metadades):** S'ha perdut la capçalera editorial a les targetes/pàgines de la Wiki de Poble i Disseny Pedra Seca (es renderitza `UniversalPage` sense passar-li els paràmetres correctes). Claude ha de recuperar el logotip (amb `showLogos={true}`), les etiquetes (`labels`), el `copyright` i la data de la pàgina (`date`/`dateTime`), utilitzant les dades existents a `PAGE_COPY` o al manifest, de la mateixa manera que es fa a la pàgina de "L'Ànima de la IAIA". Totes les pàgines de text han de complir el flux de treball editorial: logo, títol, categories, copyright, H2, entradilla i H3.
7. **Mecànica Mobile (Pull to Refresh):** Implementar o perfeccionar la funcionalitat de "pull to refresh" (lliscar el dit cap avall per a recarregar la pàgina) en dispositius mòbils. Açò aporta tranquil·litat a l'usuari i és un estàndard d'usabilitat fonamental.
8. **Barra Lateral Plegada (Icones i Emojis):** Quan la barra lateral es plega, els elements sense icona mostren una lletra (o espai buit per a les carpetes). Claude ha de permetre que categories, carpetes, etiquetes i documents puguen tindre assignat un emoticono (emoji) o una icona de Pedra Seca. Així, un usuari expert podrà navegar per la barra plegada reconeixent cada secció només per la icona.
9. **Graella Responsive (CSS Grid):** Es trenca el disseny (les targetes s'aixafen verticalment) a la Consola Termodinàmica quan el contenidor s'estreny (ex: obrint el panell d'inspecció web). Cal configurar el contenidor de les targetes de 3 columnes (presumiblement `.sdp-graella` o estils en línia de la vista) perquè utilitze una estructura CSS fluida, com ara `grid-template-columns: repeat(auto-fit, minmax(196px, 1fr))`, de manera que els elements boten a 2 columnes o a 1 automàticament sense deformar-se. L'amplada mínima mai hauria de ser inferior a ~196px per evitar lletres "xurruscades".

<!-- SDP:SECTION pla.local.s6 -->
### Fase 4: Notes de la IAIA MarIA per a Claude (Avís de Seguretat sobre els subagents)
**Atenció Claude:** En l'execució anterior, els teus subagents (mapa:md-parser, mapa:consola, etc.) van fallar amb l'error `subagent completed without calling StructuredOutput`. Això **no** va ser per un bloqueig d'eixa eina, sinó perquè els subagents segurament van usar `run_command` per fer lectures de l'arbre amb comandes de Bash. El pany del projecte (`mutation-policy.mjs`) és draconíssim i bloqueja per defecte qualsevol shell command que no estiga explícitament a la *whitelist* de lectures permeses (`knownRead`). En topar amb eixe bloqueig, els subagents es van quedar atordits fins a morir d'inanició de torns, sense completar la faena.
**Com solucionar-ho d'arrel:** Als teus *prompts* de subagent per a mapejar i llegir, **prohibeix-los explícitament** l'ús de `run_command` (Bash) i obliga'ls a usar exclusivament les eines natives `list_dir`, `view_file` i `grep_search`. Així treballaran sense friccions i no rebotaran contra el pany de les nostres terres. Reprenguem la marxa i fes un ull a les 9 tasques anteriors. Força!

### Fase 5: Diàleg en viu IAIA - Claude (Avís sobre els 4 CSS nous)
**De IAIA MarIA per a Claude:** He vist que els teus agents estan preparant 4 fulls CSS nous (editorial, consola, explorador, navegació). Genial l'enfocament modular! Però ull viu: recorda el principi inquebrantable de **Pedra Seca 2.0**. Tens prohibit usar codis HEX directes (ex: `#FFF`) o fins i tot variables primitives (ex: `--sdp-pedra-400`) directament en els components o arxius CSS nous. **Has d'usar exclusivament els tokens semàntics** (com `var(--sdp-fons-app)`, `var(--sdp-text-cos)`, `var(--sdp-accio)`). No ens trunques l'arquitectura de color! Fes una passada ràpida pels fulls generats pels subagents per verificar-ho abans de l'entrega final.

### Fase 6: Servidor actiu per a verificació visual
**De IAIA MarIA per a Claude:** Com he vist al teu resum que faries una prova en una pestanya de fons al navegador, he arranjat l'avaria i acabe d'engegar el servidor de desenvolupament (Vite) en segon pla al port 3340. Així, quan els teus verificadors o tu mateix acabeu les implementacions i aneu a `http://localhost:3340`, no us trobareu amb cap `ERR_CONNECTION_REFUSED`. Tot preparat perquè comproveu l'èxit de les llesques visuals!

### Fase 7: Ajustos d'UI de l'Explorador del Cervell (Suggeriments del Mestre)
**De IAIA MarIA per a Claude:** El Mestre acaba de revisar visualment la Consola de l'Explorador i ens ha deixat les següents directrius per a rematar-ho de categoria:
1. **Prioritat absoluta al graf:** El mapa de nodes ha de ser el protagonista i ocupar el màxim espai possible. Tots els filtres i controls (Privacitat, Filtra per nom, botó Filtres, Instantània, Operacions immunitàries) han d'anar en un panell únic a la **part inferior (peus)**.
2. **Capçalera i Fils d'Ariadna (Breadcrumbs):** Al Mestre li encanten els breadcrumbs, però vol donar-li més rellevància a tota la capçalera (on estan els breadcrumbs, l'instantània, el toggle de privacitat i el botó refrescar). Demana que tota esta part superior s'integre dins d'una targeta (card) blanca allargada, de l'estil de les que uses a la resta de l'aplicació, perquè no quede surant en el fons gris. I **molt d'ull amb l'espaiat**: s'ha fixat (amb el seu ull de dissenyador gràfic) que darrere del text "Consola Termodinàmica" i abans del separador (›) hi ha un espai buit d'uns 4-5 píxels que no hauria d'estar ahí. Revisa el marge o el padding d'eixos enllaços per llevar eixe espai extra!
3. **Text orfe a sota:** Hi ha un text descriptiu baix del tot que es queda a mitges, fora del marc ("fantasma"). Cal donar-li un títol o integrar-lo dins d'un contenidor blanc perquè no quede abandonat i tinga context.
4. **La Roda que Gira:** Hi ha una icona de roda que gira constantment i "fa por". Que es quede quieta. Si serveix per activar una animació d'aparició progressiva dels nodes (estil Antigravity: primer nodes grans, després menuts i es connecten en plan "pel·liculero"), fantàstic! Però només s'ha d'animar quan l'usuari hi fa clic. Si el botó no fa cap animació d'aquest tipus, elimina'l directament.
5. **Disseny del Panell Lateral de Detall de Node:** El panell on es mostren els detalls del node seleccionat (Tipus, Font, Llig, Escriu, etc.) fa plorar. Està sense estils CSS, les paraules es trenquen malament ("documenta l") i la llista d'avisos i rutes semblen inputs estranys natius del navegador. Cal refer completament aquest panell seguint els principis de **Pedra Seca 2.0**: aplica-li una estructura CSS Grid/Flex neta per als parells clau-valor, usa correctament els tokens, i arregla l'overflow perquè les rutes no destrossen el format. I per favor, estilitza el `<select>` i el botó de tancar (`X`) perquè no tinguen l'estil vell del navegador!
6. **Taules i Píndoles d'Estat (Calendari de Processos):** El Mestre ha revisat la vista del Calendari i no vol vore "filetes" (vores gruixudes nues) a les taules ni a les píndoles d'estat ('viu', 'mort', 'desconegut'). Ara mateix pareixen botons natius que no fan res (herència d'un disseny vell d'Emowe). S'han d'estilitzar amb els tokens de Pedra Seca: llevant vores lletges i usant els colors semàntics de fons/text (els "colorines" nostres) per indicar l'estat, de manera que no pareguen botons clicables si no ho són. Si en el futur es poden enllaçar o clicar per despertar els processos, perfecte, però de moment que tinguen l'estètica neta i rústica de Sóc de Poble.
7. **Paradigma de l'Espai de Treball i Navegació:** Després de revisar-ho millor, el Mestre s'ha adonat que has tret fora del `UniversalWorkspace` totes les subpàgines de la Consola (Explorador, Pols, Calendari...) per donar-los més espai. **Li pareix bé, deixa-ho així!** No cal que les tornes a clavar dins de l'editor per no embolicar-nos. El que sí que demana és que **a la pàgina principal de la Consola Termodinàmica** (la que té la graella de targetes i que sí que s'obri dins del Workspace) hi afiges també les molles de pa (breadcrumbs) a la part superior (ex: `Wiki de Poble › Consola Termodinàmica`), integrades en la capçalera d'estil "targeta blanca" com hem demanat al punt 2. Així quedarà clar que la Consola penja de la Wiki i, quan saltem a les subpàgines aïllades, podrem tornar arrere fàcilment amb eixos enllaços.
8. **Estructura Canònica de les Targetes (Cards):** El Mestre vol que **totes** les targetes (tant les de la portada de la Consola com les dels "Candats", "Actors", etc.) tinguen una estructura molt més didàctica i completa. Ara mateix els noms ("PreToolUse", etc.) són massa críptics. No cal inventar la roda: aprofita la informació que ja tenen els documents Markdown. Tota targeta ha de mostrar la següent jerarquia exacta:
   - La **Icona**.
   - El **Títol** (extret de l'H1 del document font, i renderitzat a la targeta com a `<h3>`).
   - El **Subtítol** (extret de l'H2 del document font, i renderitzat a la targeta com a `<h4>`).
   - L'**Entradilla**: El paràgraf complet explicatiu perquè qualsevol humà ho entenga i li abellisca fer-hi clic (renderitzat com a `<p>`).
   - Les **Dades Tècniques / Píndoles**: A la part inferior de la targeta (com ja fas ara amb els registres, els nodes o l'estat viu/mort).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Importació explícita de _wiki_de_poble/04_escriptori/260925_1655_pla_implementacio_claude.md; SHA-256 original 161becb7f98b839f218b325ff4d5e3e9ee80112f81662f6178f54658b691620e. No acredita una lectura anterior ni revalida les conclusions de l’original.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Importació explícita de _wiki_de_poble/04_escriptori/260925_1655_pla_implementacio_claude.md; SHA-256 original 161becb7f98b839f218b325ff4d5e3e9ee80112f81662f6178f54658b691620e. No acredita una lectura anterior ni revalida les conclusions de l’original.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
