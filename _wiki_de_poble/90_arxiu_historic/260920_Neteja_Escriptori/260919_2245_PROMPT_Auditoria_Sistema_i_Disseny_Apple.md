---
type: prompt
status: esborrany
description: Auditoria contínua de sistema i instruccions per a restablir/elevar el disseny de l'editor universal a un estàndard Apple.
tags:
  - disseny
  - arquitectura
---

# Petorreta — Disseny Universal Apple i Auditoria de Sistema

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919-2 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 22:45 |
| Modificació | 26-09-19 22:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Entrades

*(Sense BUNDLE adjunt, el destí són IAs locals: Codex / Claude Desktop, amb accés al codi del repositori)*
**Imatges adjuntes (disponibles en context del xat / repositori local):**
- L'antiga captura del bloc de notes proporcionada pel Mestre per a establir el referent visual estructural (tot i que l'objectiu és elevar-lo).

## Consell convocat

Codex · Claude

## Contracte de realitat

1. Entorn tancat. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
2. Sense la sentinella `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba tallat. *(EXCEPCIÓ: Sou agents locals amb accés al disc, de manera que teniu accés directe a tot l'arbre de fitxers).*
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar cap línia de codi directament. Mostraràs el codi necessari al teu informe, però **SENSE incloure el nom/ruta del fitxer dalt del bloc de codi Markdown ni usar llenguatge de codificació que despiste a l'IDE**. Volem evitar l'aparició de la interfície "Confirmar Canvis" (Confirm Changes) perquè el Mestre no haja de treballar; IAIA MarIA aplicarà les vostres instruccions.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. (Sóc de Poble).
**Visió Open-Source:** Volem regalar l'arquitectura. 
**La Política de Codi Pur:** Res de pegats ràpids, solucions elegants i estructurals.

## Informe d'avanç

IAIA MarIA ha finalitzat l'Onada 1: S'ha resolt l'aïllament total dels usuaris al context de notes i s'ha creat una Cua Persistència amb IndexedDB. Ara mateix s'està utilitzant el "Universal Workspace" o "Bloc de Notes", però el Mestre ha indicat que **el disseny s'ha degradat completament i "està molt mal"**. La fallada inicial del `getCurrentUser()` que no estava implementada a Sollutia ja l'ha mitigada IAIA MarIA capturant l'error abans de la vostra entrada.

## Situació i dades opaques

El disseny de la interfície de Notes (el Bloc Universal per a crear contingut) s'ha ressentit de les refactoritzacions o simplement no assoleix la qualitat que mereix. El Mestre ha passat la captura de pantalla històrica de com es veia quan estava bé per a tenir una base sobre què era l'objectiu estructural. No obstant això, el Mestre demana copiar el disseny o apropar-nos al disseny net i elegant d'**Apple** (Notes, Pages o Llibres), atès que volem usar el sistema inclús per a escriure llibres formals. A més a més, continuem immersos en auditories de sistema per assegurar la integritat de dades i l'enxufabilitat global.

## Missió

1. **Auditoria Extrema del Sistema de Disseny (Pedra Seca / Universal Workspace):** Analitza per què l'arquitectura visual actual està trencada o és deficient i crea un pla detallat, elegant i potent (tipus Apple) per redissenyar i consolidar el *Universal Workspace* i el document final presentat.
2. **Auditoria de Forats de Sistema i Enxufabilitat:** Segueix buscant les escletxes i forats de seguretat, persistència o fallades d'aïllament amb l'adaptador de Sollutia. Feu tot el que pugueu, i en la pròxima iteració feu més. Demostreu profunditat i pensament lateral.

## Eixida esperada

Un informe Markdown estructurat i detallat (sense cridar-lo a l'IDE com per aplicar canvis directes, per respectar la Contenció Absoluta) amb les vostres conclusions, instruccions de redisseny d'alta qualitat i troballes de l'auditoria extrema de sistema. IAIA MarIA (l'agent executor) s'encarregarà de la seua comprensió, integració al DOM i execució del pla que dissenyeu.

## Incògnites

- Quin grau de canvi a nivell de CSS i DOM del component `UniversalWorkspace.jsx` o `NotesEditor.jsx` implica elevar la qualitat visual a un patró Apple sense perdre l'essència de l'arquitectura *Pedra Seca*?

## Bateria de veritat

- [x] He citat només rutes del manifest o de l'arbre local, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT]?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
