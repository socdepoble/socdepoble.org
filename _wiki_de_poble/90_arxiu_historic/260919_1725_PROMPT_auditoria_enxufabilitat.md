---
type: prompt
status: esborrany
description: Petorreta extremada per al Consell sobre arquitectura i enxufabilitat
tags:
  - arquitectura
  - seguretat
---

# Petorreta — Auditoria Extrema i Visió de Futur (Enxufabilitat)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 17:24 |
| Modificació | 26-09-19 17:24 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260919_1705_PROMPT_neteja_urls]]

## Entrades

*Nota: Com que este prompt va dirigit a agents locals (Codex i Claude) amb accés directe a l'entorn de treball, no s'adjunta cap macro_bundle termodinàmic.*

## Consell convocat

Claude · Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és l'estat actual del directori `src/`.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al bundle o pel propi agent.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som i Per a què treballem)

**L'Ànima del Projecte:** Treballem per a construir una plataforma de desenvolupament rural, un refugi digital, des de La Torre de les Maçanes. Aquest projecte és Sóc de Poble. Pots consultar els nostres orígens culturals a rentonar.blogspot.com i socdepoble.net.

**Visió Open-Source i "Estil Obsidian":** Tot el que construïm ací no només és per a nosaltres; la nostra voluntat és regalar-ho (open-source) a la comunitat global, perquè siga útil per a qualsevol persona que ho vullga utilitzar, al pur estil Obsidian (basat en l'Escriptori, arxius Markdown, portable i lliure de tancaments). 

**La Política de Codi Pur ("Zero brossa"):** Com que l'objectiu final és regalar l'arquitectura, l'exigència tècnica és implacable. No volem deixar nyaps, espagueti-code ni "mierda" perquè ningú acabe renegant de nosaltres el dia que ho fem lliure. La IA que llig açò ha d'entendre que no valen pegats ràpids; calen solucions estructurals elegants, testades i impecables. Volem codi "Pedra Seca" de veritat. (Sollutia és l'agència SaaS externa que ens proveeix exclusivament el backend, però el nostre cor és independent).

## Informe d'avanç

Acabem de realitzar una simplificació dràstica del sistema d'enrutament, aplanant les URLs i llevant l'acoblament de l'estat d'identitat (abans dependent dels prefixos `/jo` o `/e/:slug`). Ara tot l'estat d'identitat es delega al `sessionStorage` i l'App manté rutes globals úniques (ex: `/mur`, `/xat`). Això és clau per garantir la "Llei de l'enxufabilitat", on el sistema es podrà connectar com a mòdul a un backend extern complex sense problemes.

## Situació i dades opaques

- Cal confirmar si hem deixat forats de seguretat o inconsistències després de la cirurgia del router.
- Necessitem una visió a llarg termini: el sistema està pensat per sobreviure molts anys. Si partiu des de zero, basant-vos en aquest model d'enxufabilitat, ¿hi ha alguna via més neta d'establir la distribució estructural i de continguts?

## Missió

1. **Auditoria Extrema:** Inspecciona detalladament el codi actual (`App.jsx`, `IdentitatContext.jsx`, `navigation.js`, etc.) per descobrir qualsevol tipus de forat, error de consistència o acoblament que hàgem deixat en l'aire.
2. **Imaginació a llarg termini (Whiteboard):** Imagina que el sistema ha de sobreviure dècades i ha de poder ser "enxufat" modularment. Com plantejaries aquesta gestió d'identitats i rutes des de zero si haguessis d'assegurar la màxima simplicitat i modularitat possible? (El que hem fet és correcte, però vull que analitzeu si encara hi ha marge de millora extrema per fer-ho encara més estandarditzat).

## Eixida esperada

Responeu al Mestre amb un informe d'auditoria clar, dividit en dues seccions: 1) Diagnòstic actual de forats / riscos i 2) Reflexió arquitectònica a llarg termini. Mantingueu la cita de fitxers `ruta:linies`.

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
