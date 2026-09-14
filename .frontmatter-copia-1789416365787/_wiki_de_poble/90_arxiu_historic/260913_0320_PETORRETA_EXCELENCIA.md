---
tipus: petorreta
data: "260913_0320"
objectiu: "Stress-test arquitectònic (Fase 3 complida)"
---

# CONSELL D'IA: AUDITORIA DE L'EDITOR UNIVERSAL (POST-REFACTORITZACIÓ)

Honorables membres del Consell, us convidem a auditar l'última evolució del component `UniversalEditorShell` i l'arquitectura circumdant a Sóc de Poble. En sessions anteriors, vau advertir (i amb raó) que el que anomenàvem "Plugin" era en realitat una "façana" estretament acoblada a la placa base del sistema. Hem aplicat la "Cirurgia Major" de la Fase 3 per a resoldre això.

## 🎯 OBJECTIU DE L'AUDITORIA

Es tracta d'avaluar si les recents modificacions han aconseguit **veritablement el desacoblament i l'aïllament arquitectònic**. Llegiu el *bundle* adjunt (`260913_0320_BUNDLE_auditoria.md`) i responeu a aquestes tres preguntes, sent tan durs i analítics com sempre:

1. **La Independència de la Closca:** `UniversalEditorShell` rep ara un `id` i gestiona internament el *debouncing* (amb `useRef`). Utilitza `PageFrame` en lloc de `UniversalPage` (el qual està lliure de dependències al router). És ara un vertader "Plugin/Shell" independent que es podria incrustar en qualsevol host (com l'Escriptori de Sollutia)? Hi detecteu alguna nova via d'acoblament tòxic o fuga de memòria als events?

2. **L'Encapsulament del Motor (TipTap):** Hem extret TipTap cap a un mòdul propi: `useUniversalRichText`, `UniversalRichTextToolbar`, i `UniversalRichTextContent`. `NotesEditor` ara actua exclusivament com a adaptador de dades (host). Està TipTap veritablement tancat i controlat en la nova estructura? El protocol de desat (*debounce*, `pagehide`, flush de seguretat) és prou resistent en el cicle de vida de React?

3. **La Higiene Global i SEO:** `TableOfContentsDrawer` ja no busca `.content-wrapper` indiscriminadament per tot el document sinó només dins del `contentRef` assignat. Hem centralitzat la des-HTML-ització en `contentAdapter.js` per extreure text pla (SEO/previsualització). La higiene s'ha respectat?

4. **El Misteri de la Pantalla en Blanc:** Tot i no donar cap error a la consola ni a la compilació, actualment la plantilla de l'editor (tant al bloc com al perfil, a través de `UniversalEditorShell`) es renderitza completament en blanc (zona de contingut invisible). Sospitem fortament d'un col·lapse de CSS (flexbox, `editor-scroll-area`) o un desajust en la nova relació pare-fill (`UniversalEditorShell` cridant a `PageFrame`). Es demana que **redissenyeu, arregleu i separeu perfectament l'estructura del contingut visual** perquè la plantilla torne a ser funcional sense aquests defectes d'estil/layout.

Sigueu crítics, no tingueu pietat si trobeu alguna imperfecció. El Pedra Seca només admet l'excel·lència.
