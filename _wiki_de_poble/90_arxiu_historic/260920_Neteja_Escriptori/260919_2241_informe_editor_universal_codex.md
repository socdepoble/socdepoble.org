---
type: informe
status: esborrany
description: Auditoria local de l’editor universal, recuperació de notes i Sollutia, amb pla de redisseny per a IAIA MarIA.
tags:
  - disseny
  - seguretat
---

# Auditoria de l’editor universal i de la persistència

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260919-EDITOR-CODEX |
| Versió | 1.0.0 |
| Encàrrec | SDP-PROMPT-260919-2 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 22:41 CEST, rellotge local |
| Agent auditor | Codex |
| Executor destinatari | IAIA MarIA |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Tall inspeccionat | HEAD b398115f amb el canvi local preexistent de NotesDataContext |
| Contenció | Cap modificació de codi, migració, commit, desplegament o consulta externa |

## Vincles i entrades

- [[00_index_escriptori]]
- [[260919_2245_PROMPT_Auditoria_Sistema_i_Disseny_Apple]]
- [[260919_2154_auditoria_extrema_codex]]
- [[260919_2158_auditoria_extrema_claude]]

Font de veritat: arbre local actual. Els informes anteriors només servixen per identificar continuïtats; les conclusions d’ací s’han contrastat amb el codi actual. Llegida íntegrament la plantilla activa del Consell i aplicada la skill local Pedra Seca.

## 1. Dictamen

**Cal una refactorització acotada de la composició de l’editor i del seu CSS. La cua de desat necessita una correcció estructural abans de poder garantir la recuperació i l’aïllament.** No recomane substituir tota l’aplicació ni el motor de text.

La causa visual més concreta és una connexió perduda: bona part dels estils del Bloc exigeixen un avantpassat `.sdp-bloc`, però la composició actual de Notes no l’introduïx. Alhora, l’editor força una presentació de pàgina pública amb barres d’accions, autoria i capçalera dins de la superfície d’escriptura. Vegeu D01–D03.

L’Onada 1 aporta protecció útil a les lectures, però **no acredita aïllament total ni recuperació durable**. Quatre diagnòstics en memòria reproduïxen: creació antiga incorporada a un context nou, actualització antiga sobre un identificador coincident, recuperació d’IndexedDB amb identificador buit i eliminació d’un esborrany nou per una confirmació antiga. Vegeu S01–S03 i §8.

**Prioritat:** corregir els riscos de dades mentre es prepara l’espècimen visual; integrar el nou editor quan el contracte de desat siga comprovable. No es declara cap incident real, accés a dades de tercers ni vulneració del servidor en funcionament.

## 2. Mètode i límits

- **[CODI]** significa una propietat llegida en les línies citades.
- **[REPRODUÏT]** significa diagnòstic local executat, amb les limitacions descrites a §8.
- **[SUPÒSIT]** significa conseqüència condicionada que encara necessita la prova indicada.
- **[PROPOSTA]** significa comportament futur, no una API o funcionalitat que ja existisca.
- **P1:** corregir abans de confiar dades privades o escriptura important al flux afectat. **P2:** defecte funcional, visual o de mantenibilitat que cal resoldre en la consolidació.

No s’ha disposat d’una captura històrica inequívocament identificada en l’entrada d’aquest xat. No s’ha obert el navegador ni s’ha verificat el resultat visual en viu. Per tant, les causes del DOM/CSS són citables, però no s’afirma una comparació píxel a píxel, un contrast visual mesurat ni que siguen l’única causa de la degradació percebuda.

«Apple» s’utilitza com a direcció de producte: escriptura tranquil·la, jerarquia clara, navegació previsible i revelació progressiva de les eines. Les mesures proposades deriven del sistema local; no es presenten com a especificacions oficials d’Apple.

## 3. Auditoria del sistema de disseny

### D01 · P1 visual · Falta el punt d’entrada de la variant del Bloc

**[CODI]** Notes declara `presentation: { list: 'notes' }`. El workspace passa les columnes a `AppGridShell`, però no li passa la classe del bloc; el shell només afegix el `className` rebut. En canvi, els colors de navegació, controls i part del comportament de scroll depenen de `.sdp-bloc`. Evidència: [src/sections/notes/NotesSection.jsx:45–65](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesSection.jsx:45>); [src/components/universal/workspace/UniversalWorkspace.jsx:75–120](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:75>); [src/components/layout/AppGridShell.jsx:33–45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:33>); [src/components/layout/AppGridShell.jsx:175](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:175>); [src/css/modules.css:3221–3265](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:3221>); [src/css/modules.css:3400–3414](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:3400>).

Els botons de carpeta sí que porten `.sdp-bloc-nav-item`; consumixen variables declarades dins de `.sdp-bloc`. Sense eixe àmbit, les declaracions dependents d’aquestes variables no tenen el valor previst. La barra d’eines declara la seua variable de control localment, de manera que la fallada és desigual, no una desaparició de tot el CSS. Evidència: [src/components/universal/workspace/UniversalWorkspace.jsx:232–248](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:232>); [src/css/modules.css:3267–3300](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:3267>); [src/css/modules.css:3327–3329](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:3327>).

**[PROPOSTA]** Restituir l’àmbit explícit de la presentació de Notes en el shell i garantir que la navegació compartida tinga tokens propis o valors de reserva. Aplicar la classe sense revisar el component genèric deixaria altres consumidors amb el mateix problema. El catàleg de Disseny també usa `UniversalWorkspace`: [src/sections/disseny/DesignSection.jsx:60–68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/DesignSection.jsx:60>).

**Acceptació:** cada consumidor de la navegació resol color i mida dels controls; la variant Notes activa el CSS corresponent i el catàleg continua llegible.

### D02 · P2 · S’ha confós editar amb navegar una pàgina publicada

**[CODI]** `DocumentEditor` posa la barra d’eines i `UniversalEditorShell` força `chrome="context"`. `PageFrame` interpreta eixe mode com dues barres: navegació i autoria. `UniversalPage` proporciona accions per defecte de connectar, compartir, traduir i xat. Evidència: [src/components/universal/DocumentEditor.jsx:96–129](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:96>); [src/components/universal/UniversalEditorShell.jsx:157–174](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:157>); [src/components/universal/PageFrame.jsx:154–203](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:154>); [src/components/universal/PageFrame.jsx:216–246](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:216>); [src/components/universal/UniversalPage.jsx:17–32](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalPage.jsx:17>).

A més, encara que no hi haja imatge, l’editor subministra un component «Inserir Capçalera», i `PageFrame` li reserva el lloc del hero. Evidència: [src/components/universal/UniversalEditorShell.jsx:286–309](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:286>); [src/components/universal/PageFrame.jsx:206–214](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:206>).

**[PROPOSTA]** Mantindre un sol model de document i separar tres presentacions: editar, llegir i previsualitzar la publicació. Durant l’escriptura, posar autoria, data, imatge de portada, categories i destí de publicació en un inspector opcional. Reutilitzar la presentació pública en la previsualització, amb les seues accions explícitament configurades.

### D03 · P2 · El títol hereta una capçalera de promoció i el cos no fixa la mesura editorial

**[CODI]** La capçalera comuna centra el text, aplica ombra i un radi literal de 36 px; el títol usa blau i una mida que depén del viewport. Els h2 globals són centrats i taronja. Aquestes regles arriben a l’editor mitjançant `PageFrame`. Evidència: [src/css/layout.css:283–309](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/layout.css:283>); [src/css/base.css:71–108](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/base.css:71>); [src/components/universal/PageFrame.jsx:249–309](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:249>).

El token de 68ch existix, però el límit verificat està en `.sdp-centre`; el contingut editable rep `editor-content page-content sdp-text-cos sdp-prose`, i la composició revisada no aplica `.sdp-centre` al cos. La classe `sdp-prose` no té regla pròpia en els fulls font inspeccionats. Evidència positiva del recorregut: [src/css/tokens.css:210–213](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:210>); [src/css/components.css:22](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/components.css:22>); [src/components/universal/richText/useUniversalRichText.js:63–66](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:63>); [src/components/universal/UniversalEditorShell.jsx:161–208](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:161>).

**[PROPOSTA]** Introduir una presentació editorial explícita dins dels components existents: títol i cos alineats a l’inici, text neutre, mateix eix de lectura, sense targeta ornamental al títol. Aplicar el límit de 68ch al contenidor real del text. Conservar `header.page-title` i el h1 únic; no canviar els h1 globals de tota la plataforma.

### D04 · P2 · Dos candidats a fer scroll i excepcions que no s’activen

**[CODI]** El detall fa `overflow-y: auto`; el contenidor de la pàgina continguda també. La regla que tanca el scroll exterior depén de `.sdp-bloc`, igual que la que desactiva els sticky de les barres interiors. Evidència: [src/css/modules.css:292–300](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:292>); [src/css/modules.css:3400–3414](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:3400>); [src/css/utilities.css:68–95](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/utilities.css:68>); [src/css/utilities.css:124–128](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/utilities.css:124>).

Açò acredita dues declaracions de scroll, **no dues barres visibles demostrades en totes les mides**.

**[PROPOSTA]** Assignar un únic propietari del scroll al document, amb `min-height: 0` en la cadena flex i eines fora del contenidor desplaçable. Navegació i llista mantenen cadascuna el seu scroll. No resoldre-ho alterant el body de l’amfitrió.

### D05 · P2 · Accions i metadades que no expliquen el seu estat real

**[CODI]** «Publicar» usa una icona de tres punts; en mode compacte s’oculta el text, i el botó no rep una etiqueta accessible independent. `DocumentEditor` no passa `publishDisabled`. La roda de configuració desemboca en un `console.log`. L’hora mostrada per a una nota ordinària es reemplaça per l’hora del render. Evidència: [src/components/universal/UniversalToolbar.jsx:39–50](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:39>); [src/components/universal/UniversalToolbar.jsx:127–135](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalToolbar.jsx:127>); [src/css/modules.css:3383–3390](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css:3383>); [src/components/universal/DocumentEditor.jsx:96–102](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:96>); [src/sections/notes/NotesContext.jsx:237](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:237>); [src/sections/notes/NotesEditor.jsx:47–55](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesEditor.jsx:47>).

**[PROPOSTA]** Acció de publicar amb nom inequívoc, estat ocupat i capacitat comprovada; menú de tres punts reservat a opcions. Eliminar o desactivar amb explicació la configuració no implementada. Mostrar «Darrera modificació» a partir de dades persistides. Separar estat de desat, privacitat i estat de publicació.

### D06 · P2 · Accessibilitat incompleta en navegació i camps

**[CODI]** Les carpetes usen `role="menu"` i `menuitem`, però el recorregut revisat no implementa navegació de menú per fletxes ni gestió de tabulació. `EditableField` és un `span contentEditable` amb placeholder visual, sense nom accessible ni contracte explícit de textbox. El botó de candau/globus tampoc té etiqueta textual. Evidència: [src/components/universal/workspace/UniversalWorkspace.jsx:199–248](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:199>); [src/components/universal/UniversalEditorShell.jsx:37–48](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:37>); [src/components/universal/UniversalEditorShell.jsx:313–321](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:313>).

**[PROPOSTA]** Per a carpetes, preferir navegació amb llista i botons natius, o implementar completament el patró de menú si realment correspon. Donar nom persistent a cada camp i cada acció. Conservar focus en canviar de panell, mostrar selecció sense dependre només del color i respectar les àrees tàctils de 44/48 px del sistema.

### D07 · P2 · La taula de continguts ix de l’arrel visual de l’editor

**[CODI]** El calaix d’índex es munta amb un portal a `document.body`. El menú Slash, en canvi, busca expressament l’arrel de l’editor. L’embed importa els estils per injectar-los al seu entorn encapsulat. Evidència: [src/components/universal/PageFrame.jsx:83–124](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:83>); [src/components/universal/richText/extensions/slash.js:20–27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/extensions/slash.js:20>); [src/PedraSecaEmbed.jsx:39](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:39>); [src/PedraSecaEmbed.jsx:74–85](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:74>).

**[SUPÒSIT]** En una incrustació amb CSS només dins del Shadow DOM, el calaix exterior pot perdre tokens i estil o heretar els de l’amfitrió. El mateix component declara `aria-modal`, però la implementació llegida només gestiona Escape; la captura i restauració de focus requerixen validació. Evidència: [src/components/universal/PageFrame.jsx:72–90](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:72>).

**[PROPOSTA]** Un destí de portals per instància i dins de la seua arrel, compartit pels menús i calaixos. Provar l’índex en embed, amb dues instàncies i amb teclat.

## 4. Pla visual per a IAIA MarIA

Tot aquest apartat és **[PROPOSTA]**. No s’ha aplicat.

### 4.1 Anatomia de l’escriptori

Mantindre la navegació de tres columnes i alinear les dues files superiors. La primera identifica el context; la segona conté les eines de cada columna. En l’editor, la data i la privacitat no han de competir amb el text.

Esquema conceptual, sense codi aplicable:

```
Carpetes             Notes                    Títol del document · Estat de desat
Tot · Configuració   Cerca · Nova nota         Format · Inspector · Previsualitzar
────────────────────────────────────────────────────────────────────────────────
Carpetes i etiquetes Llista de notes           Títol
                     Títol + extracte         Text del document
                     Data + estat             Text del document
                                              …
```

En mode concentració, plegar navegació i llista; deixar una barra compacta i el document. En mòbil, una vista cada vegada amb recorregut Carpetes → Notes → Document i retorn amb nom explícit. No reduir les àrees tàctils per fer cabre més icones.

La base existent ja preveu dues files en les columnes i una graella adaptable; és un punt de partida reutilitzable: [src/components/universal/workspace/UniversalWorkspace.jsx:176–198](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:176>); [src/components/universal/workspace/UniversalWorkspace.jsx:338–361](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:338>); [src/components/layout/AppGridShell.jsx:75–99](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:75>).

### 4.2 Contracte visual mesurable

| Peça | Decisió proposada |
| --- | --- |
| Navegació | Fons i text del conjunt `--sdp-crom-*`; conservar el caràcter fosc estable de Pedra Seca. |
| Llista | `--sdp-fons-targeta`, selecció amb tokens d’acció blaus i indicador addicional. Títol, extracte breu i data real. |
| Document | Superfície neutra, text `--sdp-text-cos`, títols `--sdp-text-titol`; sense barres de color dins del flux d’escriptura. |
| Amplades | Començar pels límits i presets actuals; validar 240 px de navegació i 300–320 px de llista al prototip. El document ocupa la resta. No fixar una amplada mínima que force scroll horitzontal en mòbil. |
| Controls | Alçada de fila amb `--sdp-alt-accio` —58 px actuals—; objectius de 44/48 px com a mínim. |
| Espai | Tokens de 8, 16, 24, 32 i 48 px. Marge editorial de 32/48 px en ample i 16 px en estret. |
| Lectura | Cos amb `--sdp-text-base`, amplada màxima `--sdp-measure` —68ch—, alineació inicial i separació editorial constant. |
| Títol | Escala existent adequada al document; neutralitzar centrat, ombra i cantonades de la capçalera pública només dins de l’editor. |
| Marca | Taronja en elements d’identitat i accents secundaris; blau en selecció i accions. |
| Moviment | Canvis previsibles, sense animar l’escriptura; respectar la preferència de moviment reduït. |

Tokens i mides existents: [src/css/tokens.css:86–128](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:86>); [src/css/tokens.css:155–173](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:155>); [src/css/tokens.css:185–213](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:185>); [src/css/tokens.css:226–240](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:226>). Límits de columnes: [src/components/layout/AppGridShell.jsx:8–19](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:8>).

**Decisió de coherència pendent de documentar, no de preguntar de nou al Mestre:** la skill prescriu interlineats 1.2/1.6, mentre que els tokens actuals declaren 1.15/1.65. IAIA MarIA ha de consolidar un criteri al sistema abans de canviar-los, sense aplicar un retoc global accidental. Evidència: [.agents/skills/pedra-seca/SKILL.md:52–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md:52>); [src/css/tokens.css:200–213](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/tokens.css:200>).

### 4.3 Escriure notes, articles i llibres amb el mateix nucli

| Presentació proposada | Contingut prioritari | Metadades secundàries |
| --- | --- | --- |
| Nota | Títol opcional i text immediat | Carpeta, etiquetes, modificació |
| Article | Títol, subtítol/entradeta opcionals, cos | Portada, autoria i destí de publicació |
| Manuscrit | Títol, jerarquia de capítols i cos continu | Índex, recompte, dades de l’obra i exportació |

No copiar el contingut en tres models independents. Compartir sanejament i model documental; variar la presentació i les capacitats. La composició actual ja separa l’adaptador de Notes del document i del shell: [src/sections/notes/NotesEditor.jsx:54–70](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesEditor.jsx:54>); [src/components/universal/DocumentEditor.jsx:25–77](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:25>).

Per a llibres, establir una entrega específica: jerarquia de capítols estable, índex, imatges amb text alternatiu i peus si es suporten, exportació semàntica i vista d’impressió. No simular paginació amb altura fixa sobre la pantalla editable. Les taules i altres estructures noves han de superar una prova completa d’editar → desar → carregar → exportar: la llista actual de tags permesos no inclou taules. Evidència: [src/utils/sanitize.js:71–87](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/utils/sanitize.js:71>). Aquesta proposta no afirma que el motor actual ja siga un maquetador de llibres.

### 4.4 Abast real del canvi

| Unitat existent | Intervenció proposada | Grau |
| --- | --- | --- |
| UniversalWorkspace | Restituir l’àmbit de presentació; corregir navegació compartida, etiquetes i jerarquia de controls | Mitjà |
| AppGridShell | Conservar graella i redimensionament; validar focus, IDs per instància i mides del contenidor | Baix/mitjà |
| NotesEditor | Passar capacitats i dades reals; autoria/data i configuració correcta dels mitjans | Baix/mitjà |
| DocumentEditor | Exposar presentació i estat de desat; publicar amb operació pendent i resultat explícit | Mitjà |
| UniversalEditorShell | Separar eines, inspector i document; deixar de forçar crom de pàgina pública | Alt dins d’aquesta unitat |
| PageFrame | Compartir estructura editorial amb una presentació acotada i portals dins de l’arrel adequada | Mitjà |
| CSS | Consolidar selectors actius, eliminar dependències mortes després de comprovar consumidors i aplicar tokens al DOM real | Mitjà |
| Persistència de Notes | Revisar àmbit, operacions durables, confirmació i reconciliació | Alt; independent de l’estètica |

Ancoratges de les responsabilitats actuals: [src/components/universal/workspace/UniversalWorkspace.jsx:30–120](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/workspace/UniversalWorkspace.jsx:30>); [src/components/layout/AppGridShell.jsx:33–45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:33>); [src/components/layout/AppGridShell.jsx:210–257](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/layout/AppGridShell.jsx:210>); [src/sections/notes/NotesEditor.jsx:22–70](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesEditor.jsx:22>); [src/components/universal/DocumentEditor.jsx:105–129](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:105>); [src/components/universal/UniversalEditorShell.jsx:136–211](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:136>); [src/components/universal/PageFrame.jsx:127–163](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/PageFrame.jsx:127>).

**No donar una estimació en dies sense prototip i proves.** El canvi no és només CSS: ocultar barres sense retirar les responsabilitats i accions associades mantindria la confusió.

### 4.5 Ordre d’integració visual

1. Crear l’espècimen viu amb dades locals al catàleg, seguint el requisit de prototipatge del sistema. Mostrar nota buida, nota llarga, error, conflicte i càrrega.
2. Restituir la variant visual i fixar el propietari del scroll. Verificar les altres seccions consumidores abans de tocar estils globals.
3. Reorganitzar l’editor en eines + document + inspector; comprovar teclat i ordre de focus.
4. Connectar estats reals de persistència i publicació.
5. Afegir la presentació de manuscrit i provar documents llargs abans d’oferir exportació formal.

El catàleg actual integra espècimens mitjançant un registre de càrrega; l’espècimen del gestor descriu el contracte però no munta un segon editor de prova complet. Evidència: [src/sections/disseny/DesignSection.jsx:10–27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/DesignSection.jsx:10>); [src/sections/disseny/cataleg/detalls/EspecimenGestor.jsx:4–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/disseny/cataleg/detalls/EspecimenGestor.jsx:4>). Requisit de la skill: [.agents/skills/pedra-seca/SKILL.md:76–79](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/pedra-seca/SKILL.md:76>).

## 5. Auditoria de dades, seguretat i enxufabilitat

### S01 · P1 · Les mutacions antigues travessen el canvi de context

**[CODI + REPRODUÏT]** La càrrega comprova generació i àmbit, però `updateNote` aplica la resposta sobre el payload actual buscant només l’ID. En creació, `myConfig` i `config`, així com `myActor` i `actorKey`, són valors de la mateixa clausura. La comparació no consulta l’àmbit vigent quan arriba la resposta. Evidència: [src/sections/notes/NotesDataContext.jsx:60–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:60>); [src/sections/notes/NotesDataContext.jsx:119–132](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:119>); [src/sections/notes/NotesDataContext.jsx:156–169](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:156>).

El muntatge actual conserva aquests providers sense una clau per actor, de manera que cal protegir les transicions dins del provider: [src/app/App.jsx:485–501](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/App.jsx:485>).

**Desencadenant:** crear sota A, passar a B amb dades carregades i rebre la resposta d’A. La nota d’A entra a la llista de B. En actualització, cal un ID coincident entre contextos per substituir una nota de B; eixa precondició es va incloure en la prova. S’ha reproduït la funció de mutació extreta del codi, no el recorregut complet d’autenticació al navegador.

**[PROPOSTA]** Capturar l’àmbit d’origen de l’operació i comparar-lo amb `prev.scopeKey` i una generació vigent abans d’escriure en estat. La resposta d’A només pot confirmar la seua operació durable; mai modificar el visor de B. Cancel·lar o posar en espera l’enviament privat quan canvie la sessió.

### S02 · P1 · La clau persistent es recupera amb un identificador buit

**[CODI + REPRODUÏT]** `actorKey` usa `tipus::id`; `scopeKey` l’incorpora; la clau d’IndexedDB afig `:noteId`. El lector usa `split(':')[1]`, que en una clau ordinària retorna la cadena buida. La fusió posterior busca `persistentDrafts[n.id]`, per la qual cosa no aplica eixe esborrany. Evidència: [src/app/contexts/IdentitatContext.jsx:36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/IdentitatContext.jsx:36>); [src/sections/notes/NotesDataContext.jsx:27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:27>); [src/sections/notes/GlobalSaveManager.js:55–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:55>); [src/sections/notes/GlobalSaveManager.js:103–116](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:103>); [src/sections/notes/NotesDataContext.jsx:65–68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:65>).

Resultat local: per a una clau sintètica amb nota `note-1`, el conjunt recuperat conté `""` i la consulta de `note-1` no retorna cap esborrany.

**[PROPOSTA]** Clau composta estructurada i camps explícits d’àmbit/document; no reconstruir identitats amb separadors que també apareixen als valors. Migrar les claus existents preservant els registres dubtosos per a recuperació. No buidar IndexedDB com a correcció.

### S03 · P1 · Una confirmació antiga elimina una versió més nova

**[CODI + REPRODUÏT]** Cada nota ocupa una sola entrada persistent. Mentre un desat està en vol, una nova edició substituïx l’entrada; quan el primer acaba, esborra la clau sencera sense comparar la versió confirmada. Evidència: [src/sections/notes/GlobalSaveManager.js:112–123](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:112>); [src/sections/notes/GlobalSaveManager.js:131–143](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:131>).

**Reproducció:** versió A en vol → versió B persistida i pendent de debounce → confirmació d’A. B continua en la cua de memòria, però la seua còpia persistent desapareix. Una fallada de pestanya en eixe interval compromet la recuperació de B.

En l’altre sentit, un desat fallit torna a escriure el seu payload antic sobre la mateixa clau; pot substituir camps nous que ja s’hi havien guardat. Evidència: [src/sections/notes/GlobalSaveManager.js:144–154](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:144>).

**[PROPOSTA]** Confirmacions associades a una operació o generació immutable. Esborrar només l’operació confirmada dins d’una transacció, conservar les posteriors i no sobreescriure-les en un reintent. La cua persistent ha de distingir pendent, en vol i confirmat, i coordinar també dues pestanyes; els locks actuals viuen només al singleton JavaScript: [src/sections/notes/GlobalSaveManager.js:82–86](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:82>); [src/sections/notes/GlobalSaveManager.js:159–164](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:159>).

### S04 · P1 · L’àmbit no identifica sempre la persona autenticada i el backend real

**[CODI]** L’àmbit combina backend nominal, actor i tenant. L’actor pot ser una entitat seleccionada en una preferència compartida de sessió; la comprovació de pertinença està deixada per al futur. No inclou separadament l’usuari autenticat. A més, `backendId` no figura en les claus permeses de la configuració de l’embed. Evidència: [src/sections/notes/NotesDataContext.jsx:25–27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:25>); [src/app/contexts/IdentitatContext.jsx:17–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/IdentitatContext.jsx:17>); [src/PedraSecaEmbed.jsx:155–165](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:155>).

**[SUPÒSIT]** A i B seleccionant la mateixa entitat i tenant poden compartir la clau d’esborranys malgrat ser persones diferents. La generació de sessió provoca recàrrega, però no canvia la clau d’emmagatzematge. Canviar de projecte/backend dins del mateix origen també necessita una identitat d’instal·lació que no quede reduïda al valor de reserva `supabase`.

**[PROPOSTA]** Àmbit privat explícit: instal·lació/backend, tenant, subjecte autenticat i actor autoritzat. No incloure tokens secrets en claus. Mantindre la generació de sessió com a barrera del treball en vol, sense convertir cada renovació en una nova identitat durable. Validar permisos de l’actor al servidor.

### S05 · P1 · Recuperar un esborrany no reprén l’enviament ni resol el conflicte

**[CODI]** La recuperació retorna payloads per fusionar amb notes; no rehidrata operacions executables. La cua només arranca des d’`enqueue`. En un 409 mostra un avís i resol `false`; no oferix reconciliació. `knownRevisions` sempre preval sobre la revisió base i només s’actualitza en un desat reeixit. Evidència: [src/sections/notes/GlobalSaveManager.js:47–79](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:47>); [src/sections/notes/GlobalSaveManager.js:89–100](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:89>); [src/sections/notes/GlobalSaveManager.js:103–165](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:103>); [src/sections/notes/NotesDataContext.jsx:55–68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:55>).

**Desencadenant deduït del codi:** la cua coneix revisió 2, una altra sessió arriba a 3, es produïx 409 i la recàrrega porta 3; el següent enviament continua demanant 2. Canviar cegament a 3 tampoc resol el conflicte semàntic.

Hi ha una segona incongruència: la recàrrega per timeout busca la paraula anglesa `timeout` en el missatge, però el transport crea `TimeoutError` amb un missatge en valencià que no la conté. Evidència: [src/sections/notes/NotesDataContext.jsx:133–137](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:133>); [src/data/supabase/runtime.js:73–77](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:73>).

**[PROPOSTA]** Recuperació explícita de la cua, reintents amb espera i pausa en autenticació/conflicte. En 409 conservar versió base, remota i local i oferir una resolució comprovable. En timeout, considerar resultat desconegut i reconciliar abans de repetir. Classificar errors per contracte estable, no per text traduït.

### S06 · P1 · La durabilitat arriba després del primer debounce i no té estat observable

**[CODI]** El cos actualitza primer l’override de sessió i espera 800 ms abans d’invocar el desat; els altres camps també esperen 800 ms. Només aleshores `enqueue` escriu IndexedDB i espera uns altres 600 ms per enviar. Evidència: [src/components/universal/DocumentEditor.jsx:46–76](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:46>); [src/components/universal/richText/useUniversalRichText.js:53–61](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:53>); [src/components/universal/UniversalEditorShell.jsx:95–104](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/UniversalEditorShell.jsx:95>); [src/sections/notes/NotesContext.jsx:83–93](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:83>); [src/sections/notes/GlobalSaveManager.js:115–164](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:115>).

Els hooks de `pagehide`/visibilitat fan flush, però no poden acreditar per si sols que una transacció asíncrona haja acabat abans de morir la pestanya. El gestor tampoc espera el resultat de `saveDraftToIDB` en encolar. Hi ha errors d’obertura que es registren a consola i errors de transacció que rebutgen una promesa sense consumidor en aquest camí. Evidència: [src/components/universal/richText/useUniversalRichText.js:89–108](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:89>); [src/sections/notes/GlobalSaveManager.js:19–30](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:19>); [src/sections/notes/GlobalSaveManager.js:115–116](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:115>).

**[PROPOSTA]** Registrar la intenció durable des de l’edició i aplicar el debounce a la xarxa. Cap sistema ha de prometre persistència d’una tecla abans que l’escriptura durable estiga confirmada. Exposar els estats «pendent al dispositiu», «desat al dispositiu», «sincronitzant», «sincronitzat», «conflicte» i «error de desat local» amb significat real. La retenció local privada necessita política d’eixida de sessió i recuperació per al mateix subjecte; una clau separada és aïllament lògic, no xifrat.

### S07 · P2 · La reconciliació confon notes noves, eliminades i fora de pàgina

**[CODI]** `localOnly` reté qualsevol nota local que no aparega en la resposta remota. No limita eixa conservació a creacions confirmades pendents de veure’s en el llistat. El servidor retorna només 50 notes; els drafts només s’apliquen a notes que ja venen en el payload. Evidència: [src/sections/notes/NotesDataContext.jsx:73–88](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:73>); [src/sections/notes/NotesDataContext.jsx:65–68](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:65>); [src/data/supabase/notes.js:19–28](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js:19>).

**Conseqüència condicionada:** una nota eliminada o que deixe de ser accessible pot continuar en memòria; després d’un reinici, una nota fora de les 50 carregades pot tindre un draft persistent que no es presenta. L’absència en una pàgina no és prova d’eliminació, i conservar-la sempre tampoc és correcte.

**[PROPOSTA]** Paginació real, càrrega per ID del document obert, registre de creacions locals i recuperació explícita dels documents amb operacions pendents. Tractar 404/403 com a estats diferenciats sense publicar el draft com si continuara accessible.

### S08 · P1 d’integració · El catch de getCurrentUser no resol el contracte de Sollutia

**[CODI]** La mitigació actual captura l’error i continua amb `userId` nul, però consulta el mètode abans de `quanLlest`. `getCurrentUser` continua sent obligatori al contracte i `configura` rebutja un backend que no complete el nucli. Evidència: [src/sections/notes/NotesDataContext.jsx:49–57](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:49>); [src/data/contracte.js:2–35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/contracte.js:2>); [src/host.js:157–163](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js:157>).

A més, l’oient general de `sdp:auth-change` fa una crida no protegida al mateix mètode. La sincronització ordinària sí que el captura. Evidència: [src/data/sessionService.js:35–42](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js:35>); [src/data/sessionService.js:129–136](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js:129>).

**[PROPOSTA]** Fer explícit si la identitat la proporciona el contracte de backend o un port de sessió separat. Amb el contracte actual, l’adaptador ha d’implementar el mètode. Esperar la barrera d’arrencada abans de llegir-ne la identitat; distingir «sense sessió» de «backend incomplet». No certificar la integració perquè haja desaparegut una excepció de consola.

### S09 · P1 · La privacitat dels adjunts no equival a la privacitat de les notes

**[CODI]** La política de Notes restringix la lectura al propietari membre del tenant; la dels adjunts privats permet propietari **o qualsevol membre del tenant**. Evidència: [supabase/migrations/260914_0000_schema_notes.sql:53–59](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260914_0000_schema_notes.sql:53>); [supabase/migrations/260919_1650_bucket_mitjans_privats.sql:17–26](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260919_1650_bucket_mitjans_privats.sql:17>).

Aquesta és una discrepància real en el SQL versionat. **[SUPÒSIT]** Si les polítiques estan desplegades, un membre del tenant amb la ruta d’un adjunt pot quedar autoritzat a llegir-lo encara que no puga llegir la nota. No s’ha fet una prova remota ni es declara una filtració ocorreguda.

També hi ha una incompatibilitat de rutes: Notes puja amb `{ carpeta: 'notes' }` sense tenant ni config; el transport usa `user.id` com a primer segment de reserva, mentre que la política privada comprova allí la pertinença al tenant. Promoure copia la mateixa ruta al bucket públic, que exigix l’usuari al primer segment. Evidència: [src/sections/notes/NotesEditor.jsx:15–18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesEditor.jsx:15>); [src/data/supabase/storage.js:102–123](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js:102>); [supabase/migrations/260919_1650_bucket_mitjans_privats.sql:28–35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260919_1650_bucket_mitjans_privats.sql:28>); [src/data/supabase/storage.js:167–191](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js:167>); [supabase/migrations/260913_0500_bucket_mitjans.sql:22–32](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260913_0500_bucket_mitjans.sql:22>).

**[PROPOSTA]** Política de lectura d’adjunts coherent amb el document privat, àmbit/configuració obligatoris en upload i convenció deliberada de rutes privades/públiques. Tancar-ho amb matriu A/B × tenant A/B, inclosa la resolució d’URLs firmades. Conservar l’original privat és una millora ja present: [src/data/supabase/storage.js:187–189](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js:187>).

### S10 · P1 · Publicar continua sent una operació parcial sense idempotència del document

**[CODI]** El flux promou imatges abans d’enviar la publicació i després desa `isPublished`. Ignora els resultats booleans d’alguns desats previs. El transport genera un ID nou quan la crida no en proporciona cap; l’upsert per ID no evita duplicats entre dos IDs nous. El resultat de la publicació no es vincula al document en aquest flux. Evidència: [src/sections/notes/NotesContext.jsx:172–219](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:172>); [src/data/supabase/content.js:52–66](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/content.js:52>).

**Desencadenant:** la publicació s’accepta però falla la confirmació del client o el marcatge de la nota; el reintent pot crear una segona publicació. Si la promoció s’ha completat però el pas següent falla, poden quedar còpies públiques encara que el document continue mostrant estat privat.

**[PROPOSTA]** Identitat estable de publicació, revisió concreta del document i resultat reutilitzable. Publicar una instantània explícita després de confirmar el desat; retornar i conservar la referència de publicació. Preparar els mitjans amb control de visibilitat i una política de compensació/neteja. Desactivar l’acció mentre està en curs, sense confiar només en el bloqueig visual per evitar duplicats.

### S11 · P1 d’integritat · La inserció asíncrona d’imatges no fixa el document destinatari

**[CODI]** L’ordre Slash conserva una referència a `editor`, espera selecció, compressió i pujada i després hi inserix la imatge. No comprova ID, àmbit o destrucció abans de la inserció final. El hook de l’editor sincronitza documents per `id`; la clau de remuntatge està al shell fill, no a tot `DocumentEditor`. Evidència: [src/components/universal/richText/extensions/index.js:105–129](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/extensions/index.js:105>); [src/components/universal/richText/useUniversalRichText.js:50–87](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:50>); [src/components/universal/DocumentEditor.jsx:70–77](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:70>); [src/components/universal/DocumentEditor.jsx:105–108](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/DocumentEditor.jsx:105>).

**[SUPÒSIT]** Iniciar una imatge a A, obrir B abans que acabe i reutilitzar la mateixa instància de l’editor pot inserir-la a B. Cal reproducció amb editor real i latència controlada; no es dona per observat al navegador.

**[PROPOSTA]** Lligar selecció, rang i pujada al document i àmbit d’origen. Si canvien, conservar el resultat com a adjunt pendent d’A o cancel·lar la inserció amb avís. No inserir automàticament en el document que casualment estiga obert al final.

### S12 · P2 · El port acumula implementacions i no és una frontera per instància

**[CODI + REPRODUÏT]** `setBackendImplementation` copia mètodes sobre l’objecte existent, sense substituir-lo sencer. Si es configura un segon backend complet sense una capacitat opcional que tenia el primer, la capacitat anterior pot continuar anunciada. El servei de sessió manté una sola configuració global i la cua de notes és singleton. Evidència: [src/data/backendPort.js:5–26](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:5>); [src/data/backendPort.js:44–46](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:44>); [src/data/sessionService.js:5–13](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js:5>); [src/data/sessionService.js:30–33](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/sessionService.js:30>); [src/sections/notes/GlobalSaveManager.js:169](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:169>).

La reproducció amb dos backends sintètics complets confirma que, després d’injectar el segon sense mitjans, `teCapacitat('mitjans')` continua retornant `true`. No s’ha connectat cap servei extern.

El client Supabase ja rebutja explícitament URLs de backend diferents dins del mateix document; això és una limitació declarada, no una capacitat multi-backend resolta. Evidència: [src/data/supabase/config.js:26–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/config.js:26>).

**[PROPOSTA]** Substitució atòmica de la implementació abans del segellat i capacitats derivades només d’eixa implementació. Declarar el límit d’una identitat/backend per document o introduir una instància explícita de serveis. No prometre aïllament entre embeds perquè el CSS estiga encapsulat.

### S13 · P1 condicional · Les notes heretades d’app_content continuen sent una font potencialment pública

**[CODI]** `loadNotes` fusiona notes de la taula privada amb notes de `app_content`. El mapatge també incorpora notes de llavor. La política posterior de `app_content` permet lectura anònima i autenticada de qualsevol clau distinta d’`agents`; per tant, la clau `notes` no queda exclosa. Evidència: [src/data/supabase/notes.js:19–28](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js:19>); [src/data/supabase/runtime.js:96–107](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:96>); [supabase/migrations/260916_0600_politiques_superadmin_organitzacions.sql:23–35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260916_0600_politiques_superadmin_organitzacions.sql:23>).

**[SUPÒSIT]** Si una migració antiga ha deixat notes privades en eixe payload, continuen exposades per una via diferent de la taula `notes`. No es coneix el contingut de la BD desplegada. Si només conté exemples públics, no hi ha eixa filtració, però s’ha de declarar eixa condició.

**[PROPOSTA]** Separar exemples públics i notes privades en dades i presentació. Auditar el payload heretat i la migració real amb un operador autoritzat; no inferir privacitat pel nom de la secció. La RLS de la nova taula no protegix les còpies antigues.

## 6. Protocol de desat proposat

Aquest és un contracte conceptual; els termes d’aquesta secció no són noms de funcions o variables existents.

1. **Identificar:** document, backend/instal·lació, tenant, subjecte, actor autoritzat i generació de sessió vigent.
2. **Registrar:** contingut o canvi pendent amb seqüència local i revisió remota de base. Confirmar l’escriptura local abans de mostrar «desat al dispositiu».
3. **Enviar:** una operació immutable per document i àmbit; l’autenticació vigent ha de coincidir amb la identitat d’origen. Posar en espera les d’altres sessions.
4. **Confirmar:** validar el rebut del servidor, avançar la revisió coneguda i retirar només l’operació confirmada. Mantindre edicions posteriors.
5. **Reconciliar:** en 409 comparar base, canvi local i versió remota; en timeout aclarir si l’operació es va aplicar; en 403/404 conservar el text recuperable sense continuar enviant a cegues.
6. **Recuperar:** rehidratar operacions i documents pendents en tornar a entrar amb el mateix subjecte. No presentar un draft restaurat com a sincronitzat.
7. **Publicar:** operació separada, idempotent i sobre una revisió explícita; amb mitjans i privacitat verificats.

Diagrama conceptual de confirmació:

```
Edició → pendent de desat local → confirmada al dispositiu → pendent d’enviament
                                                            ↓
                                                       en enviament
                                                   ↙        ↓        ↘
                                               error     confirmada   conflicte
                                                 ↓           ↓          ↓
                                              reintent   retirar només  resolució
                                                         eixa operació  explícita
```

**Invariants per a les proves:** una resposta d’A no canvia la vista de B; confirmar N no elimina N+1; una operació pendent conserva la seua identitat; no hi ha «sincronitzat» sense confirmació remota; no hi ha publicació duplicada per repetir el mateix intent.

## 7. Ordre de treball i bateria d’acceptació

| Onada | Treball | Condició d’eixida |
| --- | --- | --- |
| 1 | S01–S06: àmbit, claus durables, confirmació i conflictes | Proves d’intercalació, fallada i reinici correctes; cap contaminació entre contextos |
| 2 | D01–D04: espècimen, variant, composició i scroll | Document escrivible i jerarquia estable en les mides de contenidor acordades |
| 3 | S08–S13 i D07: contracte Sollutia, mitjans, publicació i portals | Mateixa matriu funcional amb backend local simulat i adaptador real de proves |
| 4 | D05–D06 i S07: estats, accessibilitat i recuperació completa | Teclat, lector de pantalla, errors visibles i documents fora de la primera pàgina accessibles |
| 5 | Manuscrit i rendiment | Reobertura i exportació sense pèrdues; escriptura fluida en dispositiu de referència |

L’espècimen visual i les correccions de dades poden avançar com a treballs independents; la integració final depén del contracte de desat.

### Proves funcionals que han de quedar automatitzades

| Cas | Resultat exigible |
| --- | --- |
| Crear en A; passar a B; resoldre A | B no rep cap nota d’A |
| Actualitzar en A amb ID repetit en B | B conserva la seua nota |
| Clau amb `persona::…`, `entitat::…` i identificadors amb separadors | Recuperació inequívoca del document correcte |
| A en vol, B durable, ACK d’A, caiguda abans d’enviar B | B es recupera |
| A falla després que B s’haja persistit | El payload antic no substituïx B |
| Dues pestanyes editen la mateixa nota | Cap ACK elimina treball de l’altra; conflicte visible |
| IndexedDB indisponible, quota o avortament | No es mostra durabilitat falsa; recuperació/exportació temporal disponible |
| Servidor confirma però la resposta es perd | Reconciliació sense repetir cegament ni duplicar publicació |
| Revisió local 2, remota 3, després 409 | Resolució explícita i següent desat possible |
| Logout/login amb la mateixa entitat seleccionada | Cap draft d’A es mostra ni s’envia com a B |
| Nota eliminada, 51a nota i deep link | Estats diferenciats, recuperació i càrrega per ID |
| Pujada a A amb canvi a B abans d’acabar | Imatge només vinculada a A o operació cancel·lada |
| Membre B del poble d’A demana adjunt privat d’A | Accés denegat, llevat de compartició explícita |
| Doble clic o reintent de publicació | Una sola publicació amb identitat estable |
| Backend complet sense una capacitat opcional | La capacitat anterior no sobreviu al canvi d’implementació |

### Proves visuals i editorials

- Contenidors de 360, 768, 1024 i 1440 px; comprovació addicional a les fronteres actuals de 720 i 1090 px. La mesura ha de ser del contenidor, no només de la finestra.
- Temes clar/fosc, zoom del 200%, teclat virtual, títol llarg, paraula sense espais i document sense títol.
- Un sol scroll del document, eines accessibles, cursor visible i retorn de focus després de tancar inspector o índex.
- Botons compactes amb nom accessible; Tab, Enter, Espai i Escape funcionals; la selecció no depén exclusivament del color.
- Nota curta, article amb portada i manuscrit sintètic de 50.000 paraules com a prova d’esforç proposada, sense declarar-ne el rendiment abans de mesurar-lo.
- Per al manuscrit, perfilar serialització i cerca: el codi actual extrau HTML complet en cada actualització i deriva text de contingut sense límit per a la nota modificada. Evidència: [src/components/universal/richText/useUniversalRichText.js:53–61](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/components/universal/richText/useUniversalRichText.js:53>); [src/sections/notes/NotesContext.jsx:118–149](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesContext.jsx:118>).
- Embed amb estils de l’amfitrió deliberadament diferents; índex i menús dins de l’arrel correcta. Dues instàncies per comprovar límits documentats, no per presumir aïllament.
- Round trip de tots els blocs permesos, sense canviar jerarquia de capítols ni perdre referències d’imatge; exportació sense controls de l’editor.

## 8. Verificació executada

### Suite existent seleccionada

Executada amb Node v24.13.0 i Vitest v4.1.10, sense xarxa i amb memòria cau de proves desactivada:

- Proves de l’estat del workspace.
- Proves del redimensionador.
- Prova del proveïdor de Notes.

**Resultat: 4 casos passen i 1 falla; 2 fitxers passen i 1 falla.** La fallada és `useSession ha de ser usat dins de SessionProvider`. El test embolcalla només amb `NotesDataProvider`, però aquest ara crida `useSession`. Evidència: [src/sections/notes/NotesDataContext.test.jsx:4–13](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.test.jsx:4>); [src/sections/notes/NotesDataContext.jsx:24–26](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:24>); [src/app/contexts/SessionContext.jsx:41–44](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/app/contexts/SessionContext.jsx:41>).

Aquesta fallada no prova que la pantalla real no tinga provider: l’embed sí que el munta. Evidència: [src/PedraSecaEmbed.jsx:57–66](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/PedraSecaEmbed.jsx:57>). Prova que el test actual no acredita ni la creació ordinària ni les garanties noves de l’Onada 1.

### Diagnòstics sense fitxers de codi nous

| Diagnòstic | Mètode | Resultat |
| --- | --- | --- |
| Recuperació de clau | Import del gestor real i substitut mínim d’IndexedDB en memòria | Clau recuperada buida; falta la nota esperada |
| ACK antic contra draft nou | Mateix gestor, servidor simulat amb promesa controlada | El draft B desapareix d’IndexedDB mentre continua en memòria |
| Resposta de creació d’A dins de B | Extracció AST de la funció real; `setData` i API controlats | Llista de B conté «Privada A» i «Privada B» |
| Resposta d’actualització d’A dins de B | Funció real extreta; ID coincident entre àmbits | La nota de B queda substituïda per «Privada A» |
| Capacitat residual del backend | Port real i dos backends sintètics que compleixen el nucli | Mitjans continua anunciat encara que el segon backend no el declara |

El substitut d’IndexedDB comprova l’ordre de les operacions del gestor; no certifica quota, bloqueig de base, transaccions del navegador ni caiguda física. Les funcions extretes comproven les guardes de mutació; no certifiquen un login complet ni les polítiques remotes. Dades exclusivament sintètiques; cap nota real oberta o modificada.

### Frontmatter i preservació

La porta global estricta s’ha executat abans d’afegir aquest informe: **roja per deute preexistent**, amb 220 documents inspeccionats i recomptes F1=16, F2=89, F3=10, F4=3, F5=1, F6=0, F7=14, F8=0. No s’ha executat el codemod ni segellat un baseline per tapar-lo.

El resultat de la validació individual d’aquest informe i la comprovació final d’empremtes es consignen al registre final següent. Una validació individual verda no convertix en verd el corpus complet.

No s’ha executat el tancament global sobre l’arbre compartit: comença sincronitzant i reescrivint documents de skills, fora del lliurament acotat d’aquesta auditoria. Evidència: [tooling/gates/tancament.mjs:18–24](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:18>); [tooling/wiki/sincronitzar_skills.mjs:41–57](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:41>). No es declara tancament general ni Acta Marmota completats; el relleu d’aquesta auditoria queda en aquest informe.

## 9. Incògnites i garanties que no es poden donar

1. Comparació visual exacta amb la captura històrica i comportament real de scroll/focus als dispositius del Mestre.
2. Implementació efectiva de Sollutia, contracte de sessió i forma dels seus resultats; el fitxer local de recursos inspeccionat només declara traducció de perfil: [src/data/adaptadors/sollutia/recursos.js:1–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/adaptadors/sollutia/recursos.js:1>).
3. Migracions i polítiques aplicades a la BD real, contingut heretat en `app_content` i permisos efectius dels buckets.
4. Volum màxim de llibre, formats d’exportació obligatoris, col·laboració simultània i retenció dels esborranys privats. El redisseny base pot avançar sense atribuir al producte capacitats encara no acordades.
5. Si les respostes de l’adaptador són completes i normalitzades: la mutació actual substituïx la nota pel valor retornat, i el gestor espera una revisió. Cal que el contracte ho exigisca i ho valide. Evidència: [src/sections/notes/NotesDataContext.jsx:121–129](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/NotesDataContext.jsx:121>); [src/sections/notes/GlobalSaveManager.js:133–138](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/notes/GlobalSaveManager.js:133>).

## 10. Bateria de veritat

- [x] Conclusions sobre codi vinculades a rutes reals i línies del tall local.
- [x] Propostes i supòsits diferenciats de fets reproduïts.
- [x] Pedra Seca interpretat com a sistema de disseny.
- [x] Sense cerca web ni accés al backend real.
- [x] Sense modificacions de codi ni blocs aplicables automàticament a fitxers.
- [x] Limitacions de les proves i de la inspecció visual declarades.
- [x] Deute global de frontmatter declarat, sense atribuir-lo a aquest informe.

## 11. Registre final de verificació

- Informe individual validat amb el tractor real, l’esquema i el pany canònics copiats a un directori temporal aïllat: **exit 0**, un document, F1–F8 a zero, mode `--estricte`.
- **138 cites** comprovades mecànicament: les 46 rutes citades existixen i tots els intervals de línies són vàlids. Aquesta comprovació complementa, però no substituïx, la lectura de les evidències.
- **241 empremtes SHA-256** de fonts i migracions coincideixen entre la captura anterior a la verificació documental i la comprovació final; `git diff` conserva el mateix canvi de codi preexistent.
- Escriptures pròpies al projecte: aquest informe i el seu enllaç a l’índex de l’Escriptori. `.agents/ESTAT.md` no s’ha modificat; aquesta auditoria no declara executat el tancament administratiu global.
- Cinc diagnòstics locals amb dades sintètiques; cap fitxer nou de codi ni proves incorporades al repositori.
- Registre mecànic de la validació: [frontmatter-individual.log](/private/tmp/sdp-editor-audit-260919-xq_k70do/frontmatter-individual.log).
