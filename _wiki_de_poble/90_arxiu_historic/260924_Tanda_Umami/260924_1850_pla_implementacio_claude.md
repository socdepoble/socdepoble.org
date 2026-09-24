---
type: document
status: esborrany
description: Pla d'Implementació i Síntesi de la Doble Auditoria (Fable vs Astra)
tags:
  - eixam
  - olivera
  - auditoria
  - arquitectura
reflex: sdp:torn_sintesi_eixam
---

# Pla d'Implementació i Síntesi de l'Eixam (L'Olivera)

Aquest document serveix com a **Punt de Trobada (Hub)** per a les IAs del Mas (Fable Extra i Astra Alto) i per al Mestre. Ací consolide l'estat de les auditories paral·leles en curs, els meus comentaris (IAIA MarIA) i la fulla de ruta per a la implementació resultant.

## 1. Estat Actual de la Doble Auditoria

### 🧠 Fable Extra (Treball de Trinxera i Sistema Nerviós)
- **Foc:** S'està centrant en el deute tècnic, l'orfenat i la puresa del repositori.
- **Trobades:** Ha localitzat els problemes d'enllaços de la Wiki, 11 skills sense àncora i 5 absents de `.claude/skills`.
- **Treball de camp completat:** 
  1. Ha construït un mirall exacte de la carpeta `tooling/` (amb `gates/`, `wiki/` i `lib/`) dins del laboratori per evitar errors de rutes relatives.
  2. Ha programat i provat amb èxit 3 nous tractors al laboratori: **Porta Olivera v2**, **Autosanació d'enllaços**, i **Sinapsis** (per fusionar redundàncies).
  3. Ha deixat un `LLEGIU_PRIMER.txt` al laboratori amb les instruccions.
- **🚨 ALERTA DE COL·LISIÓ (Per a Fable):** Astra Alto se t'ha avançat en el temps i **ja ha reparat manualment els 6 enllaços trencats** en producció. El teu script d'Autosanació és vital com a eina de manteniment, però no et sorprengues si ara en executar-lo en producció no troba aquells 6 errors. L'eixam funciona!

### 🦅 Astra Alto / Codex (Arquitectura, Puntuació i Mòduls)
- **Foc:** Visió d'alt nivell, integració amb Sollutia i registre d'usuaris.
- **Puntuació Provisional:** **6/10**. Una nota exigent, realista i merescuda. Assenyala que l'expansió encara depén de canvis massa repartits.
- **Trobades Crítiques:** 
  1. El perfil públic està llegint el catàleg d'agents en lloc dels comptes registrats. Aquesta és la clau que hem de refactoritzar per a donar d'alta a "Javi".
  2. Ha detectat que hi ha **1 test fallant (29/30)**. Aquest error de test en l'ordenació l'he provocat jo (MarIA) fa uns minuts en canviar el `<select>` lleig de la interfície per un menú desplegable personalitzat a `UniversalWorkspace`. 
- **Treball de camp completat:** 
  1. Astra ha reparat els 6 enllaços trencats i ara la porta d'orfenat dóna 0 errors.
  2. Ha descobert un problema topològic ("Illes"): hi ha grups de notes que s'enllacen entre elles però que estan orfes de l'índex principal.
  3. Ha auditat el detector de duplicats i ha demostrat que busca carpetes antigues i omet documents clau de `02_saber`. Ha deixat dos prototips viables amb proves al laboratori per resoldre-ho. 

## 2. Comentaris i Anàlisi de la IAIA MarIA

L'estratègia del Mestre de llançar els dos models en paral·lel és brillant. Estem atacant el problema des dels dos extrems (Top-Down per Astra, Bottom-Up per Fable).

- **Sobre el 6/10 d'Astra:** L'accepte. Tenim una base sòlida (modular i amb proves), però l'arquitectura de connexió amb Sollutia i el sistema d'usuaris encara no està consolidat per a rebre els "Mòduls Endollables" (Gestoria, Llibreria).
- **Sobre el Test Fallat:** És un fals negatiu a nivell de producte, però un error real a nivell de test. Quan acaben, hauré d'actualitzar el `UniversalWorkspace.test.jsx` perquè busque el nou botó `sdp-workspace-sort-menu__option` en comptes de l'antic element `select`.
- **Sobre el Registre de Javi:** L'observació d'Astra és fonamental. Hem de separar el concepte de "Perfil Públic d'Agent" del de "Compte d'Usuari Registrat". Quan implementem l'alta de Javi, crearem l'entitat `UserCard` o similar que no dependrà de l'arxiu d'agents.
- **Sobre l'esforç d'Astra amb el Graf:** Astra ens acaba de salvar el cul resolent els 6 orfes, i el descobriment del bug al detector de duplicats (per buscar carpetes obsoletes) és clau. Fable, quan llisques això, ves directe a auditar i validar els dos prototips que ha deixat Astra al laboratori.

## 3. Pla d'Implementació Immediat (Què farem a continuació)

Una vegada les dues auditories concloguen, els pròxims passos que executarem seran:

1. **(Jo, MarIA):** Reparar immediatament el `UniversalWorkspace.test.jsx` per recuperar el 100% de tests en verd.
2. **(Consens Eixam):** Validar i fusionar els dos prototips d'Astra per als tractors d'autosanació (el detector d'illes i el detector de duplicats corregit) dins de la porta definitiva de la Wiki.
3. **(Consens Eixam):** Aplicar la proposta arquitectònica d'Astra per desacoblar els usuaris dels agents, preparant el terreny per fer l'alta en producció de Javi.
4. **(Fable / Claude - DISSENY I UX):** 
   - **Restaurar la Roda Dentada:** Has esborrat (o ocultat) la roda dentada a Wiki i Disseny perquè no tenien l'acció `onManageCategories`. No inventes. El disseny és sagrat. La roda dentada ha d'estar **SEMPRE** present a totes les instàncies del `UniversalWorkspace`. Aquesta roda servirà per obrir una configuració pròpia de cada espai de treball (ex: restablir l'amplària de les columnes o forçar el mode fosc/clar només per eixe entorn).
   - **Color de la Sidebar Esquerra:** El fons actual està utilitzant Pedra Fosca (`sdp-pedra-600`). El Mestre demana explícitament apujar-lo a Grafit (`sdp-pedra-700`) perquè "descompensa la vista". Busca on s'aplica el fons fosc de la columna de navegació (`AppGridShell` o tokens de la closca) i canvia-ho.
   - **Botó EDITAR per a Forasters:** Al Bloc de notes (`NotesSection`), ha d'aparèixer un botó "EDITAR" (al mig o a la barra superior) fins i tot per a l'usuari Foraster (no registrat) per tal que puga experimentar.
   - **UX de l'Editor de Notes:** 
      - Afegeix una barra de botons per elegir: *Categories de Sistema, Categories de Projecte, Categories normals, i Etiquetes*. Per a un usuari normal només es mostraran "Categories" i "Etiquetes" (o mostrarà un error "no ets administrador" si intenta tocar les altres). També s'hi ha de poder elegir el copyright.
      - **Contingut de Llavors (LLAVOR_NOTA) i Card:** S'ha d'eliminar el `Heading 3` del contingut per defecte. El text per defecte de l'editor i la previsualització de la Card a la llista han de coincidir exactament en:
        - *Títol:* "Sense títol"
        - *Subtítol:* "Subtítol: No es recomana posar punt final per a títols i subtítols"
        - *Entradilla:* "Entradilla: El text que poses ací també es vorà a la targeta (card) o miniatura d'aquesta publicació."
   - **INCIDÈNCIA GREU: Fragmentació d'Estats i Plantilles:** Hi ha un desajust visual entre seccions provocat per l'ús de plantilles diferents o configuracions residuals ("fantasmes"). 
      - A **Disseny**, el botó diu "CREAR" però hauria de ser l'icona d'ordenar notes (sort).
      - A **Wiki de Poble**, en entrar, la categoria "Wiki de Poble" de la columna central hauria de pintar-se activa (amb l'etiqueta taronja corresponent).
      - A **Notes personals**, l'amplada i color de la sidebar de l'esquerra no ha canviat (conserva el color antic). A més, a l'entrar hauria de mostrar l'estat inicial actiu marcant "Mur" i "Bloc de notes". L'eixam ha d'unificar absolutament totes les seccions sota la mateixa AppGridShell.
   - **INCIDÈNCIA GREU: Unificació de Cards (Consola vs Panell de Control):** La `Consola Termodinàmica` utilitza unes targetes bàsiques i blanques inventades que no respecten el disseny original. S'ha de crear o aprofitar un component unificat de Targeta (tipus `ActionCard` o `DashboardCard`) perquè la Consola utilitze **exactament el mateix disseny** que el `Panell de Control` (amb la vora taronja, vores redones i l'icona centrada a dalt). 
      - En targetes com "Explorador del cervell", les dades no s'han de posar en una sola línia ("253 nodes · 177 arestes"), sinó una baix de l'altra, amb icones menudes per acompanyar cada dada i que no quede un espai blanc buit. Si el text és llarg (com "Calendari de processos"), ha de trencar en dos línies sense problema.
   - **INCIDÈNCIA: Enllaços de la Consola trencats (Redirecció al Registre):** En fer clic a les targetes de la Consola Termodinàmica, l'usuari és redirigit a la pàgina de `/registre`. El contingut d'aquestes seccions sí que està a la Wiki (`_wiki_de_poble`), però la interfície no l'està important bé o l'està bloquejant per falta d'autenticació. Claude ha d'arreglar la navegació perquè les targetes mostren la pàgina corresponent de la Wiki en lloc de demanar registre.
   - **INCIDÈNCIA: Pàgina de Traduccions (`/traduccions`) plena de "fantasmes":** En la pàgina de Traduccions (idioma), hi ha un SVG gegant trencant la vista i targetes grises antigues. Cal esborrar aquests fantasmes manuals i utilitzar el mateix component base unificat de Targetes que per al Panell i la Consola. Cal mantindre la coherència: si unifiquem, s'aplica a tot.
   - **INCIDÈNCIA GREU: Selector de Realitat (`/iaia`) dóna Error 404:**
      - La pàgina del Selector de Realitat s'ha de **CREAR** des de zero a la ruta `/iaia` (és el nom reservat que el Mestre vol). Has de construir la interfície on es tria el Nivell d'immersió d'IA (0: Humà, 1: Assistent, 2: Immersiu, 3: Creatiu) i els Acompanyants (MarIA, Andreu, Beatriz, Carla). Ara mateix aquesta pàgina dóna un Error 404. Construeix-la seguint les guies d'estil de Pedra Seca.
      - Fes que quan es faça clic sobre l'icona de la IAIA/Avatar (a dalt a la dreta de la barra de navegació superior), l'usuari vaja directament a aquesta pàgina `/iaia`. Ara mateix l'enllaç està trencat i redirigeix erròniament a `/registre`.
   - **NOVA FUNCIONALITAT: Cercador Avançat (`/cerca`):** El cercador actual només té suggeriments ficticis ("L'Equip Sintètic", "IAIES Mundials") i l'estil antic. Vull un cercador avançat (com els cercadors grans) on l'usuari puga activar un mode "Avançat" i se li desplegue tota l'oferta de filtres possibles per a buscar qualsevol cosa en el sistema (totes les categories, tipus de dades, filtres globals). Dissenya-ho com una pàgina de Cerca autèntica i potent, i aprofita les targetes unificades per als resultats.
   - **INCIDÈNCIA GREU: Pàgina Connectar (`/connectar`) alterada i sense l'Ànima:** Aquesta és la pàgina més important de totes (el centre neuràlgic on s'organitza la informació). La versió actual en el codi és una al·lucinació (barrejada amb el Panell de Control). Has de **recuperar el disseny autèntic** plasmant la filosofia clau de Sóc de Poble:
      - **"Connectar" substitueix al "M'agrada" o "Cor":** Ací no hi ha interaccions accidentals. L'usuari ha de fer clic conscientment per connectar alguna cosa on ell vulga.
      - **Privacitat per defecte:** Hi ha d'haver un selector clar entre connexió PRIVADA i PÚBLICA. Tota connexió és privada per defecte (Només tu podràs vore esta connexió en el teu MAS personal).
      - **Caixa Principal (Categories):** L'usuari tria on guardar-ho, com a carpetes: "Guardats generals", "Calendari i Rutes", "Coses pendent de vore", "Inspiració Projectes". I un botó per "Crear Nova" categoria.
      - **Assistent de Context (Llibertat d'etiquetes):** Una secció on la IAIA suggerix etiquetes automàticament basant-se en el contingut, i l'usuari pot afegir les seues pròpies ("Escriu una etiqueta lliure...").
      - **Redacció i Estructura:** Títol `H2` ("On vols guardar açò?"), entradilla explicativa, i `H3` per a les seccions (Privacitat, Caixa Principal, Assistent de Context). Fes un disseny espectacular (Pedra Seca) basant-te en esta idea autèntica i proposa-hi millores.
   - **INCIDÈNCIA: Pàgina Idioma i Traduccions (`/traduccions`)**: Assegura't de que estiga al sistema. La pàgina ha de tindre el selector de "Idioma del Sistema" (amb "Valencià" destacat) i "Traducció Dinàmica de Targetes" amb el text descriptiu de l'antic portal. S'han de fer servir les Targetes unificades (ActionCard / DashboardCard) i NO l'HTML antic en cru, sinó integrat dins de l'AppGridShell.
   - **NOVA FUNCIONALITAT: Telemetria Poca-solta (Umami)**: Fable, has d'integrar el Tauler de Telemetria (Umami) amb els seus indicadors (Visitants, Pàgines vistes, etc.) en un iframe segur o panell natiu en la pàgina de Legal i Privacitat (o la Consola Termodinàmica), just com teníem a l'antiga iteració per complir amb la Transparència Radical.
5. **(Fable / Astra):** Crear un Tractor Cognitiu (Skill) per al flux de treball visual. La regla serà clara: si el Mestre envia una captura de pantalla sense context, la IAIA MarIA ha d'actuar per defecte analitzant-la, deduint el problema i bolcant la solució en el Pla d'Implementació actiu sense haver de preguntar-li què fer.
6. **(Fable / Claude - AUDITORIA DEL BRAIN):** És crític que Claude audite el directori `tooling/brain/` en aquesta mateixa sessió. Està ple de deute tècnic, scripts morts o orfes que estan frenant el repositori. Està pitjor que la Wiki. Fable ha de netejar aquest sub-arbre, identificar redundàncies, dependències mortes i proposar (o executar directament) l'eliminació del que ja no valga.
7. **(Mestre):** Amb el sistema net i la nota pujada a un 8 o 9, podrem començar a endollar la Gestoria i la Llibreria. El Full de Ruta antic amb TOTA la informació hiper-detallada que m'has facilitat ja s'ha guardat a `_wiki_de_poble/02_saber/00_full_de_ruta.md` per sempre.

*IAs (Fable i Astra), quan lligau això, ja sabeu quina és la realitat actual i on teniu el vostre pes específic. Aprofundiu sense por, el Mas us cobreix. I Claude, res d'inventar amb el disseny, el que s'unifica es manté!*
