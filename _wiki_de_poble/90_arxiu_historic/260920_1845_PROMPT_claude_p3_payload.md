---
type: petorreta
status: esborrany
description: Solució del Payload P3 (p_kind i p_name) a creaOrganitzacio
tags:
  - sollutia
  - arquitectura
---

# Petorreta — Resolució Payload P3

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260920 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 18:45 |
| Modificació | 26-09-20 18:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-20 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (App de ChatGPT)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **LLEGIDA DEL PLA:** Si hi ha un Pla d'Implementació actiu o un esborrany a `_wiki_de_poble/04_escriptori/`, tens l'obligació de llegir-lo per a comprendre l'estratègia global abans de proposar codi.
4. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
5. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
6. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. **CRÍTIC PER A CLAUDE I CODEX:** Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers (com `replace`, `edit`, `write`) que generen el botó verd de "Confirmar Canvis" (Apply Changes) a la teua interfície. Si el Mestre humà prem eixe botó per accident, pot desmuntar tot el sistema. Per a evitar-ho, tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables. Mai utilitzes les teues eines d'edició de sistema operatiu.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Hem resolt els defectes P1 i P2 (Frontera i Estabilitat, toast i CSS netejats). Ens queda un últim forat per tancar de l'auditoria B: el payload de `creaOrganitzacio`.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

L'auditoria prèvia va detectar que a `PerfilShell.jsx` (línia ~101) fem `creaOrganitzacio({ slug: ... })`, però el backend de Sollutia necessita obligatòriament els camps `p_kind` i `p_name` per instanciar-la correctament. L'ESTAT deia erròniament que faltava el slug, quan realment el que falta és enviar aquests dos camps.

## Missió

1. Analitza a fons l'arbre de crides des de `PerfilShell.jsx` -> `PerfilContext.jsx` -> `supabaseBackend.js` (o l'arrel de dades rellevant) referent a `creaOrganitzacio`.
2. Proposa la modificació teòrica (citant ruta i línies exactes) per injectar o capturar els camps `p_kind` i `p_name` de manera elegant. Si l'UI no els demana actualment (és només un botó de "+ NOVA ORG"), proposa com introduir un valor per defecte o un procés simple que assegure l'èxit de la petició cap a Sollutia.

## Eixida esperada

Text explicatiu amb anàlisi teòrica. Qualsevol codi ha d'estar en blocs de text pla (sense ruta al capçal) per evitar la detecció automàtica del botó "Apply Changes".

## Incògnites

- No sabem exactament si Sollutia espera uns enums concrets per a `p_kind`, per la qual cosa pots mirar al codi si hi ha alguna pista o proposar-ne un d'estàndard (ex: 'org', 'company').

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
