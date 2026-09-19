# Pla d'Implementació — Arquitectura Sidebar i TopBar Atòmiques

Aquest pla consolida les troballes estructurals de Claude i Codex per resoldre l'encavalcament i l'estat fragmentat de la interfície.

## 1. El Defecte Arrel i la Solució CSS (Visió Claude)
L'encavalcament d'1 píxel en el llindar de 1100px està causat per la manca de `min-width: 0` a la Sidebar. El contingut (el botó de "Panell de Control") força l'amplada a 277px en lloc dels 260px del token.

### Modificacions CSS:
- **`src/css/layout.css`**: Afegir `min-width: 0` a `nav.app-sidebar`, `.sidebar-control-btn` i `.nav-item__text`.
- Eliminar la classe morta `.app-shell` de `layout.css` ja que `.sdp-root` ja actua com a base flex.
- **`AppGridShell.css` i `PerfilShell.css`**: Eliminar l'embolcall intern `@layer components { ... }` per evitar la doble capa `components.components` que perd prioritat (detectat per Claude).

## 2. La Reestructuració del Layout (Visió Codex)
L'estat del calaix i la visibilitat estan fragmentats entre classes invertides (`sidebar-open` vs `sidebar-closed`) i no tenen un únic amo. A més, el vel no funciona. Codex proposa una solució brillant utilitzant components que ja tenim:

### Nou Component `AppShell`
- Crearem un component `AppShell` explícit.
- Utilitzarà un `ResizeObserver` per mesurar l'amplada i dictar si estem en mode `wide` (> 1100px) o `compact` (<= 1100px).
- **En mode `wide`:** `nav.app-sidebar` i `main.app-main` conviuen com a germans Flexbox.
- **En mode `compact`:** S'utilitza el component `Dialeg` (amb `costat="esquerra"`) existent a `src/components/PedraSeca/organismes/Dialeg.jsx`. Ací dins es renderitzarà la navegació, aprofitant gratis la modalitat, el bloqueig de focus, Escape i el vel oscurit.

## 3. TopBar i Rutes
- Substituir la icona genèrica per l'autèntic `Globe` de `src/icons.jsx`.
- **Selector d'IA:** El botó d'IA a la TopBar obrirà un popover atòmic que comparteix l'estat global de la IA (Nivell) amb `RealitatSection.jsx`. S'elimina l'animació infinita de la llum quan està "apagada".
- **Conflicte de Rutes (`/iaia`):** Com adverteix Codex, `/iaia` està agafada pel xat (`/jo/xat/iaia-maria`). L'"Ànima" es mantindrà accessible a `/ia` (o remapejarem el manifest web a `/realitat`).

## 4. Estabilitat del Backend
- Arreglar `backendPort.js` perquè `recullTornadaOAuth` no llance excepcions síncrones que maten tot l'arbre de React, bloquejant el renderitzat complet de l'aplicació.

## Instruccions per a la Següent Sessió:
Aquest pla es troba ancorat a l'escriptori. En iniciar el proper xat net, l'Agent haurà de llegir aquest pla i procedir a implementar-lo per parts, delegant els retocs o tasques a les IAs locals si cal.
