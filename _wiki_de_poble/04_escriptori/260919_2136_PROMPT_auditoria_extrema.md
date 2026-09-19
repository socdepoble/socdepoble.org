---
type: petorreta
status: esborrany
description: Auditoria extrema d'arquitectura, resiliència i proves d'estrès per a 10.000 usuaris simultanis.
tags:
  - arquitectura
  - seguretat
---

# Petorreta — Auditoria Extrema i Estrès (Claude / Codex)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 21:36 |
| Modificació | 26-09-19 21:36 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. **CRÍTIC PER A CLAUDE I CODEX:** Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers (com `replace`, `edit`, `write`) que generen el botó verd de "Confirmar Canvis" (Apply Changes) a la teua interfície. Si el Mestre humà prem eixe botó per accident, pot desmuntar tot el sistema. Per a evitar-ho, tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables. Mai utilitzes les teues eines d'edició de sistema operatiu.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

El sistema base, l'Editor Universal, la Graella i la resolució d'identitat ja estan funcionant. Recentment s'han podat errors de recursió i d'amnesia cognitiva, així com els bucles infinits provocats per instàncies mal concebudes del context (`NotesContext`, `IdentitatContext`). Ara busquem l'excel·lència i preparació per l'entorn real.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

L'humà (el Mestre) **no és programador** de professió; ell gestiona l'arquitectura i ens guia, però tot això "li queda molt gran". La seua gran inquietud actual, atès que encara no hem sortit a producció ni tenim usuaris reals connectats, és la següent: **¿Hi ha alguna cosa fonamental que puguem canviar ARA MATEIX a la base, per molt radical que siga, que ens garantisca la resiliència i durabilitat extrema del projecte?** 

Volem assegurar-nos que, el dia de demà, quan ni el Mestre ni jo estiguem ací, qualsevol persona puga agafar aquest codi i treballar de forma útil sense que un deute tècnic ofegant paralitze el seu flux de treball. Volem saber si la base actual pot ser una "base immutable" on el sistema puga créixer únicament a base d'"enxufes" (mòduls o plugins) sense trencar mai el que ja està auditat i construït.

## Missió

1. **Avaluació de l'Arquitectura de Base i Resiliència a Llarg Termini:** Hi ha res que calga canviar ARA des dels fonaments (encara que siga un canvi radical) per evitar un deute tècnic insalvable en el futur? Avalua si el sistema està preparat per a una arquitectura basada en "enxufes/plugins" on noves idees es puguen afegir sense trencar la base immutable ja construïda.
2. **Auditoria Extrema (Defectes Ocults):** Revisa el codi (especialment la gestió d'estats globals, els Contextos, els CRDTs i la persistència) i detecta qualsevol programació feta que puga fallar de manera catastròfica en el futur. Cerca vulnerabilitats silencioses, fuites de memòria o comportaments no deterministes.
3. **Proves d'Estrès Teòriques (10.000 usuaris):** Analitza com es comportarà aquest client (React + Vite + preact/compat) i la seua comunicació amb la base de dades si demà entren 10.000 usuaris junts alhora ("Slashdot effect"). Reventarà? On hi ha colls d'ampolla en la sincronització de l'editor o al mur? Proposa mecanismes d'estabilització.
4. **Puntuació Global:** Al final del teu informe, posa-li una **Nota (del 0 al 10)** a l'arquitectura actual. Volem saber realment en quin punt estem. Sinceritat brutal. Respon a la pregunta de l'usuari: A quin nivell estem per aconseguir aquest somni de resiliència?

## Eixida esperada

Redacta un document detallat al disc amb format Markdown anomenat (per exemple) `260919_2136_auditoria_extrema.md` dins de `_wiki_de_poble/04_escriptori/`. Recorda: les respostes directes vostres s'anomenen SEMPRE "auditoria". L'"estudi" serà elaborat posteriorment per la IAIA MarIA. No ens mostres cap botó de "Confirmar Canvis", tot s'ha d'explicar amb exemples al text i línies concretes.

## Incògnites

- No tenim dades reals de telemetria en producció, per tant la teua avaluació de l'estrès de 10.000 usuaris s'haurà de basar en les pautes d'arquitectura clientside que estem utilitzant.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
