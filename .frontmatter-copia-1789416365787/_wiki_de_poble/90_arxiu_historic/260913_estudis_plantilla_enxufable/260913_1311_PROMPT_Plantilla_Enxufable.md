# 🛡️ PETORRETA AL CONSELL: LA PLANTILLA ENXUFABLE (Universal Backend)

## Context i Visió Estratègica
Adjunt teniu el Bundle complet del projecte `socdepoble.org` actualitzat.
Estem accelerant el pas. L'objectiu és tindre el sistema en producció el més prompte possible perquè els usuaris puguen registrar-se i actuar (crear pàgines, entitats, perfils).
Actualment tenim un "Bloc de Notes" que funciona molt bé (utilitzant `UniversalManager` i `UniversalEditorShell`), però necessitem que aquesta arquitectura siga una **Plantilla Enxufable** genèrica. Aquesta plantilla s'ha d'utilitzar com a sistema de gestió (backend) independent per a diferents dominis:
1. El Bloc de Notes.
2. La Gestió d'Usuaris i Perfils (crear i editar persones, grups, entitats).
3. La Gestoria (en el futur).

Cada instància d'aquesta plantilla ha de tindre el seu propi menú, però l'estructura i l'editor han de ser els mateixos.

## Objectius i Instruccions
Us demanem que ens proporcioneu el CODI COMPLET per a assolir açò, estalviant-nos el màxim temps de picar codi:

### 1. Refactor de la Toolbar (Fase 4.5)
El component `UniversalRichTextToolbar` (la barra d'eines blava de l'editor) coneix íntimament TipTap (`editor.chain()`, etc). 
- Volem aplicar el **Patró Adapter**: crear un contracte neutre (`state` i `exec`) i un `useTipTapAdapter(editor)`.
- `UniversalRichTextToolbar` ha de passar a ser un component mut que només rep aquest contracte per *props*. L'agnosticisme (Caixa Única) ha de ser total.

### 2. Abstracció de la Plantilla Enxufable
Consolideu `UniversalManager` i `UniversalEditorShell` en un sistema genèric que puga rebre menús, llistes i editors per *props* o *slots*. Ha de ser totalment independent del domini (no ha de saber si edita notes o perfils).

### 3. Implementació al Bloc de Notes
Refactoritzeu l'actual `NotesEditor.jsx` (i fitxers relacionats si cal) perquè consumisca aquesta nova Plantilla Enxufable genèrica.

### 4. Implementació a la Gestió de Perfils
Refactoritzeu `PerfilShell.jsx`, `DetallAjust.jsx` (i qualsevol altre fitxer de la secció de perfil) perquè DEIXEN de ser un formulari aïllat i es convertisquen en una SEGONA INSTÀNCIA d'aquesta Plantilla Enxufable. L'editor de perfils ha de ser igual que el bloc de notes: el mateix editor universal, la mateixa estructura de columnes, però gestionant l'entitat "Perfil" (nom, avatar, etc).

Si us plau, doneu-nos tots els fitxers modificats o creats necessaris. Sigueu exhaustius i doneu-nos codi a punt per a ser reemplaçat.

## Bloc Fixe d’Identitat
**Filosofia:** Sóc de Poble és una aplicació web connectada (Online-First / React SPA). Actuem amb Trellat i mínima intervenció. No uses Tailwind. El disseny "Pedra Seca" de la `UniversalPage` és sagrat.
