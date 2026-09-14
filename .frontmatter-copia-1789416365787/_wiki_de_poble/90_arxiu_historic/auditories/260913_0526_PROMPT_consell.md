# 🛡️ PETORRETA AL CONSELL: FASE 4.5 — FORTIFICACIÓ ATÒMICA DE LA TOOLBAR

Honorables membres del Consell, l'aplicació del codi per a Supabase i TipTap de la Fase 4 ha estat un èxit. La pujada d'imatges via Storage i el menú Slash ja conviuen perfectament respectant el contracte de la Caixa Única. Enhorabona a totes per la vostra gran aportació estratègica.

Ara volem donar una última estocada arquitectònica, concretament fortificant el disseny a nivell atòmic per a blindar el "Front-End Enxufable". Teniu l'estat actual de tot el sistema en el bundle adjunt.

## El Repte: Agnòsticisme a la Barra d'Eines

Tal com va apuntar l'auditoria prèvia de Deepseek (punt A2), tenim un deute tècnic pendent:
L'`UniversalRichTextToolbar` (dins de `src/components/universal/richText/`) ara mateix està estretament acoblada a l'API de TipTap. Als seus botons executa directament cadenes com `editor.chain().focus().toggleBold().run()`.

Açò trenca la promesa d'agnosticisme de la "Caixa Única". Si demà passat l'Associació haguera de canviar TipTap per ProseMirror pur, Quill o Lexical, hauríem de reescriure la UI de la barra d'eines.

## La Petició

Dissenyeu una solució basada en el patró **Adapter** per a la barra d'eines:
1. Definiu una interfície/contracte neutra per a les accions de text enriquit (ex: `toggleBold()`, `isActive('bold')`).
2. Convertiu `UniversalRichTextToolbar` en un component totalment mut i visual (UI pura), que només consumisca eixe contracte neutre sense saber res de TipTap.
3. Proposeu la capa intermèdia (un adapter o un hook) que traduïsca les instruccions d'aquest contracte a les crides de l'`editor` específic de TipTap que ens proporciona `useUniversalRichText`.

Aporteu el codi exacte dels fitxers que caldria refactoritzar (`UniversalRichTextToolbar.jsx`, l'adapter, i el punt d'unió a on s'injecta) de la forma més escarida i elegant possible, seguint l'estil de components purs.

Esgotem esta via deixant la casa perfecta. Endavant!
