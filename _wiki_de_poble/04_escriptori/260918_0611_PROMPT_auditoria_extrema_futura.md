---
type: macro_prompt
status: esborrany
description: Prompt d'auditoria extrema per a cercar fallades, contradiccions d'skills i millores futures (DAFO).
tags:
  - auditoria
  - arquitectura
---

# Petorreta — Auditoria Extrema i Visió de Futur

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 06:11 |
| Modificació | 26-09-18 06:11 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[arquitectura_cognitiva]]
- [[pedra_seca]]

## Entrades

(Al ser per a agents locals com Claude Fable i Codex, teniu accés de lectura directe al sistema de fitxers i no cal cap bundle extern).

## Consell convocat

Claude Fable (nivell mitjà) i ChatGPT Codex.

## Contracte de realitat

1. **PROHIBICIÓ ESTRICTA DE MODIFICAR CODI**: Teniu permís de lectura al disc local de l'usuari per auditar. No obstant això, **TENIU TOTALMENT PROHIBIT** editar, modificar o esborrar absolutament cap línia de codi o fitxer. Només heu d'escriure l'informe sol·licitat a l'Escriptori.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**.
4. **PROTOCOL ANTI-CERCA**: Estrictament prohibit buscar per web. Tot es fa de manera estàtica.
5. Us esteu ficant en el paper de la **IAIA MarIA** (la ment eixam, l'arquitecta). Analitzeu l'ecosistema sencer amb mentalitat forense, arquitectònica i de govern.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

El projecte s'ha auditat recentment. S'han trobat defectes (llista blanca de Supabase, timeouts bloquejants del runtime i publicació del RAG intern), els quals la IAIA MarIA està implementant ara mateix. 
Ara, volem una avaluació total dissenyada específicament per *garantir el futur*.

## Situació i dades opaques

- Hi ha 17 portes de control de qualitat que estan en roig per deute previ.
- Ens preocupa l'estabilitat i la coherència del nostre exèrcit d'agents (a la carpeta `.agents/skills` i a `tooling/`). Poden tindre contradiccions lògiques.
- **Fantasmes a la UI (Problema actual crític):** Hem iterat molt sobre l'Arquitectura Universal i la pàgina de Notes (`UniversalWorkspace`, columnes, etc.) i s'han quedat "fantasmes" de CSS (marge, padding, divs inútils, píxels desalineats). El disseny original estava bé, però ara està trencat.

## Missió

Vull una **Auditoria Extrema Total** en l'àmbit d'arquitectura, de codi UI i, sobretot, dels propis agents. Has de bombardejar el sistema. Desmuntar-lo. Fer arquitectura inversa fins als fonaments per trencar-lo estaticament, esbrinant tots els fallos possibles.

1. Quan trobes els errors o punts cecs a qualsevol carpeta del projecte, no et quedes en l'arranjament a curt termini: **proposa solucions i millores futures** que blinden l'arquitectura. Aplica casos d'ús crítics (edge-cases) que no s'hagen donat encara.
2. Analitza en profunditat la carpeta `.agents/skills/`, i els scripts relacionats. Busca **contradiccions, obsolescències i redundàncies** als nostres procediments o a l'arquitectura cognitiva, i proposa com millorar els scripts de la maquinària d'automatització.
3. Dissenya una matriu **DAFO (Debilitats, Amenaces, Fortaleses, Oportunitats)** extrema que relacione la situació del codi base, el tooling i la fortalesa estructural de tot l'ecosistema.
4. **FANTASMES I UI UNIVERSAL:** Audita a fons la pàgina de Notes i els components `UniversalWorkspace` / `UniversalColumn`. Us adjuntem l'antiga plantilla del Bloc de Notes com a referència (on el disseny sí que estava bé).
   - Busca i identifica **divs innecessaris** i **estils orfes/fantasmes** que estan trencant el layout. Usa sempre el sistema Pedra Seca; no inventes colors ni estils nous excepte si és inevitable (ex. el botó fosc "Tot").
   - **Regla dels 58px:** Totes les capçaleres de les columnes han de fer exactament **58px d'altura** per alinear-se amb la barra superior blava. Actualment, el div on posa "Carpetes" és massa menut, i el de "Tutorial" és massa gran.
   - **Capçalera "Carpetes" (i panells esquerres):** Fons gris clar. A l'esquerra porta un botó elegant més fosc ("Tot" amb icona) que s'ha d'incloure al sistema, i al seu costat el botó de roda dentada per a la gestió. Això és estàndard per a tots els blocs (Notes, Disseny, Usuaris). Quan la columna de carpetes *es plega cap avall (acordió)*, **només** s'ha de plegar el contingut, la barra amb "Tot" i la roda dentada no s'han de tocar ni amagar.
   - **Columna central ("Notes"):** No necessita plegar cap avall. Les icones de la capçalera (llibreta i lupa) s'han de mantindre visibles quan la columna es col·lapsa *cap a l'esquerra*.
   - Si veus que alguna cosa es desvia 1 píxel, **esbrina per què**. No s'han de fer ajustos "a ull". Tot ha d'encaixar perfectament sense ratlles blanques estranyes entre columnes. L'arquitectura universal dependrà d'una neteja absoluta d'estos fantasmes.

## Eixida esperada

Genera a `_wiki_de_poble/04_escriptori/` un únic fitxer que porte per nom `AAMMDD_HHMM_informe_futur_dafo_fable_codex.md` amb el resum executiu, la matriu DAFO completa, els casos d'ús esbrinats, les contradiccions en skills detectades, i les possibles solucions futures.

## Incògnites

- Desconeixem com evolucionarà la interacció entre els diversos components de la UI Kit (Pedra Seca) quan el codi s'escale 10x.
- Com es comportarà el *tooling* del frontend respecte als agents de manteniment.

## Bateria de veritat

- [ ] He citat només rutes reals en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT]?
- [ ] Totes les solucions són a futur?
- [ ] He revisat les contradiccions dels skills en `.agents/skills/`?
- [ ] El document creat passa `tractor-frontmatter.mjs --estricte`?
