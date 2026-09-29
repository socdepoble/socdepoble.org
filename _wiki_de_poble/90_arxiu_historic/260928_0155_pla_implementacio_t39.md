---
titol: "Pla d'Implementació T39: Redisseny de Drets d'Autor"
data: "2026-09-28"
estat: "esborrany"
---

# Pla d'Implementació: Redisseny de la Selecció de Drets d'Autor (T39)

## Objectius
1. Eliminar el diàleg modal (`Dialeg`) actual per a la selecció de drets d'autor a l'editor.
2. Crear una vista completa (`CopyrightPage` o similar) que substituïsca l'editor de text quan la persona prem «Elegir drets d'autor».
3. Mostrar un llistat complet de llicències (posant Creative Commons per defecte) amb 1-2 paràgrafs explicatius per a cadascuna.
4. Explicar clarament en aquesta vista que la llicència triada a la fitxa del Perfil serà la llicència per defecte de totes les publicacions noves que es creen, estalviant així el treball de fer-ho cada vegada.

## Canvis Arquitectònics

### 1. `CopyrightPage.jsx` (Nou component)
- Un component presentacional que reba `value`, `onSave`, i `onCancel`.
- Dins, un contenidor d'estil `.sdp-article` o similar que mostre:
  - Un botó clar de tornar arrere (Cancel·lar).
  - Un llistat visual de llicències (CC BY, CC0, Copyright estricte, etc.), amb espai per a l'explicació didàctica de cadascuna (paràgrafs detallats).
  - L'avís pedagògic sobre l'herència del perfil: *"La llicència que tries al teu perfil personal s'aplicarà per defecte a totes les teues publicacions..."*.
  - L'opció de text lliure (per a CC0 i altres).

### 2. `DocumentEditor.jsx`
- Afegir un estat local `[editantCopyright, setEditantCopyright] = useState(false)`.
- Modificar el botó de la ranura de llicència (que actualment obri un diàleg) perquè faça `setEditantCopyright(true)`.
- Quan `editantCopyright` siga cert, en lloc de passar `<UniversalRichTextContent editor={editor} />` a `UniversalEditorShell`, passar `<CopyrightPage onSave={...} onCancel={() => setEditantCopyright(false)} />`.
- Assegurar-se que les eines (toolbar) desapareixen o queden desactivades mentre s'edita el copyright.

### 3. Model de Dades (`perfilCamps.js` i creadors)
- El camp `copyright` ja existix a les fitxes de perfil.
- Assegurar-se que els creadors de notes i articles (fora de l'abast d'aquest torn, però cal deixar-ho preparat) miren la sessió de la persona per agafar la seua llicència. Aquest pas concret pot requerir ajustar el `NotesEditor` i el `UniversalPage` posteriorment si no reben la sessió, però l'explicació didàctica s'ha d'implementar ara.

## Execució
- Desenvolupar `CopyrightPage.jsx` reutilitzant l'estètica de targetes o opcions llistades de Sóc de Poble.
- Integrar-ho a `DocumentEditor.jsx` sense trencar l'arquitectura de ranures d'UniversalEditorShell.
- Provar que es pot desar i que es pot tornar arrere sense desar.
