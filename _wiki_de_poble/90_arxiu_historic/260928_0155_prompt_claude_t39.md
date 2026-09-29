---
titol: "Petorreta a Claude: T39 Redisseny Drets d'Autor"
data: "2026-09-28"
autor: "MarIA"
format: "markdown"
context: "Sóc de Poble - T39 Drets d'Autor Didàctics"
---

# LLEI DEL CONSELL (00_BIOS_COGNITIU)
Ets Claude, mestre constructor. Llig bé la Wiki i actua amb precisió suïssa.

## Context
El Mestre (Javi Llinares) vol que canviem radicalment la selecció de Drets d'Autor a l'editor (T39). Actualment `CopyrightSelector.jsx` obri un diàleg modal (`Dialeg`).
Això no és prou didàctic ni còmode.

La instrucció del Mestre és literalment:
> "La ventana de derechos de autor ya sabes que hay que cambiarla. Y además poner siempre por defecto la licencia Creative Commons. Y cambiarla quiero decir crear una página para ella donde está el editor de texto, con un botón de volver que se vea bien, y ahí explicas perfectamente qué es cada licencia y qué se puede hacer con ella, con un párrafo o dos por cada una. También puedes explicar en esta página que las publicaciones que elijas, como en tu perfil, tendrán ese perfil de licencia por defecto, que siempre lo puedes cambiar pero aparecerá el perfil siempre para que no tengas que ir poniéndolo cada vez. El perfil de esa licencia que has elegido en tu perfil personal. Luego si quieres cambiarlo en algún artículo, o de empresa, ya lo cambias a mano."

## Objectius
1. Oculta o elimina l'antic comportament de modal de `CopyrightSelector.jsx`.
2. Quan es polse "Elegir drets d'autor", la vista de l'editor de text (el `UniversalRichTextContent`) s'ha d'amagar i, en el seu lloc (dins del mateix DocumentEditor o UniversalEditorShell), ha d'aparèixer una nova interfície `CopyrightPage` o `CopyrightView`.
3. Aquesta nova interfície ha de tindre:
   - Un botó evident de "Tornar" (per amagar la vista i tornar a l'editor de text).
   - Un disseny molt didàctic, tipus llistat de targetes o opcions àmplies.
   - Les llicències disponibles (Creative Commons en les seues variants, CC0, Drets Reservats), explicades cadascuna amb un o dos paràgrafs detallats per a que un usuari no tècnic ho entenga perfectament.
   - Selecció **per defecte** suggerint Creative Commons.
   - Un text d'avís informatiu (alert o requadre didàctic) que explique que: *"La llicència que tries ací, si estàs al teu Perfil, serà la llicència per defecte de totes les teues futures publicacions. Així no hauràs de canviar-ho cada vegada. Sempre podràs canviar-la a mà en un article concret si ho necessites."*
4. Fes atenció a integrar aquest estat (editant copyright vs editant document) a `DocumentEditor.jsx`. Assegurat que la interfície s'alinea amb l'estètica general (Píndoles, targetes, `components.css`).

## Entregable
Has d'editar `DocumentEditor.jsx`, crear o substituir `CopyrightSelector.jsx` per la nova arquitectura (o crear un component nou i importar-lo) i assegurar-te de passar les proves. Si necessites afegir estils, posa'ls a `modules.css` o `components.css` on corresponga.
