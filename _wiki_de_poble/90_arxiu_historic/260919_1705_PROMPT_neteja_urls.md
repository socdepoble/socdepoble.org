---
type: prompt
status: actiu
description: Auditoria sobre la necessitat i les alternatives als prefixos d'URL /jo/ i /e/:slug/
tags:
  - arquitectura
  - disseny
---

# Petorreta — Neteja i Simplificació de URLs (Routing)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919-URLS |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 17:05 |
| Modificació | 26-09-19 17:05 |
| Agent redactor | IAIA MarIA |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[arquitectura_tecnica]]

## Entrades

- (Capçalera: Sense bundle explícit, els agents locals lligen del sistema de fitxers)

## Consell convocat

Claude · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és l'arbre del projecte local.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al bundle o pel propi agent.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Pots consultar els nostres orígens culturals a rentonar.blogspot.com i socdepoble.net.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho (open-source) a la comunitat global, perquè siga útil per a qualsevol persona que ho vullga utilitzar, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Volem solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat.

## Informe d'avanç

El Mestre està preocupat per l'estètica i la llegibilitat de les URLs (Ruting) actuals de l'aplicació. En analitzar l'arxiu `src/app/App.jsx`, podem comprovar que l'arquitectura de rutes fa ús intensiu de prefixos dependents de la identitat de l'usuari actiu (ActorRoutes):

- Un usuari humà corrent és rediriqit i navega sota el namespace `/jo/` (ex. `/jo/mur`, `/jo/notes`).
- Un usuari que actua en nom d'una entitat (ex. ajuntament, comerç) navega sota el namespace `/e/:slug/` (ex. `/e/ajuntament/notes`).

El problema sorgeix quan aquestes URLs es comparteixen (ex. per WhatsApp). Un enllaç com `socdepoble.org/jo/mur` o `socdepoble.org/e/ajuntament/notes` resulta confús, trenca la usabilitat i difereix notablement d'estàndards web més nets tipus WordPress (`socdepoble.org/mur`, `socdepoble.org/notes`).

## Situació i dades opaques

El Mestre entén que l'ús del namespace a la URL té l'avantatge teòric de comunicar clarament a l'aplicació sota quina identitat (actor) està treballant l'usuari, permetent el canvi de context només canviant d'URL. Tanmateix, rebutja l'empobriment de l'experiència en compartir enllaços.

Volem saber si podem unificar totes les rutes (eliminar `/jo` i `/e/:slug`) de la URL visible, delegant l'estat d'actuació (quina identitat assumeix l'usuari) únicament a la sessió local o a un context (React Context / LocalStorage), sense que la URL canvie. 

## Missió

1. Analitza l'arquitectura actual a `src/app/App.jsx` i determina quin és l'impacte d'eliminar completament els prefixos `/jo` i `/e/:slug` de les rutes.
2. Argumenta els pros i els contres d'aquesta eliminació respecte al model actual (SEO, deep linking, recàrrega de pàgines i persistència d'identitat).
3. Proposa alternatives clares i de qualitat "Pedra Seca" per aconseguir URLs netes sense trencar la funcionalitat multi-identitat (on un usuari pot ser ell mateix o gestionar diverses entitats). 
4. Si la teua recomanació és mantenir-ho tal com està perquè és la millor opció tècnica, explica-ho amb contundència perquè el Mestre ho assumisca. Si hi ha una manera millor (URLs netes a l'estil WordPress), detalla exactament com modificaríem l'App.jsx i el Context d'Identitat.

## Eixida esperada

Respon a aquesta petorreta amb un dictamen en format markdown directament a la interfície. L'informe ha de ser contundent, clar i recolzat per la lectura del codi (citant rutes i línies).

## Incògnites

- Quin és l'impacte real sobre les eines de compartició quan un usuari envia un enllaç a un altre membre que podria no tenir els permisos de la mateixa entitat?

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] El document respecta l'esquema de petorretas?
