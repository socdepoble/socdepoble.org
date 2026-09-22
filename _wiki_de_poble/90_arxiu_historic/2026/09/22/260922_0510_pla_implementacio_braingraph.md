---
type: document
status: canonic
description: "Pla d'implementació per a resoldre errors i afegir panells al BrainGraph"
tags:
  - govern
---
# Pla d'Implementació: Millora del BrainGraph (Cas d'Ús: Reunió a l'Olivera)

Aquest Pla d'Implementació ha sigut generat per la IAIA MarIA (Antigravity) i es deixa a l'escriptori explícitament perquè les IAs de frontera (Codex, Claude) el puguen llegir mentre treballen o mentre fan la seua auditoria.

## Tasca Principal
Solucionar els errors tècnics de la consola relacionats amb el `BrainGraph` i implementar millores d'usabilitat sol·licitades pel Mestre.

## Passos d'Implementació (per a les IAs de frontera)

1. **Arreglar Errors de Consola:**
   - **Esdeveniment Passiu:** El problema `Unable to preventDefault inside passive event listener invocation` prové del comportament per defecte de React 18 / navegadors moderns amb `onWheel`. S'ha d'eliminar l'ús de l'atribut `onWheel` directament sobre el `<canvas>` al JSX, i en lloc d'això, usar un `useEffect` que faça un `addEventListener('wheel', handleWheel, { passive: false })` vinculat al `ref` del canvas.
   - **Error CSP de Worker:** Cal analitzar d'on ix exactament la petició per crear un worker des d'un URL *blob*. Si és D3 o una altra biblioteca, cal afegir `worker-src 'self' blob:;` a la Content Security Policy (`index.html`), o reconfigurar la càrrega del script.

2. **Panell Lateral i Botonera:**
   - Moure el `.sdp-brain-graph-controls` perquè estiga posicionat en absolut a la part superior dreta. S'haurà de retocar el CSS per donar-li un índex Z adequat i un fons clar si cal.
   - Crear un component o div dedicat per al **Panell Lateral d'Informació** (a l'estil Obsidian). Aquest panell ha de reaccionar a l'estat local: quan l'usuari faça clic a un node, l'identificador del node s'emmagatzema a l'estat i el panell lateral es desplega mostrant la seua informació (id, etiqueta, tipus, títol).

3. **Millora Visual ("Colorines"):**
   - Garantir que `COLORS` té variables CSS funcionals i agradables. 
   - Que el zoom inicial done una perspectiva espectacular del graf ("un espectacle").

> **Nota per a Codex / Claude:** Llig aquest pla. Si el consideres millorable abans de començar a picar el codi final, reflecteix-ho a la teua auditoria! La vostra col·laboració és clau.
