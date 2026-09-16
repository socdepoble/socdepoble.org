---
tipus: petorreta
estat: esborrany
description: Auditoria destructiva de Fase 4 Sollutia i Pedra Seca, i diagnòstic d'oblit.
tags:
  - sollutia
  - arquitectura
---

# Petorreta — Auditoria Fase 4 i Pedra Seca

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260917 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 00:15 |
| Modificació | 2026-09-17 00:15 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]

## Entrades

- `260917_0005_BUNDLE_auditoria_fase4.md`

## Consell convocat

Claude · Deepseek · Qwen

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és el bundle adjunt.
2. Els únics fitxers que existixen són els del manifest, amb ruta i sha256.
   Qualsevol altre nom és ficció i va a §Incògnites.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar,
   no s'afirma.
4. Sense la sentinella `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba tallat.
   Tot fitxer sense la seua tanca `<<<FI_FITXER>>>` és il·legible. Omplir el
   buit és al·lucinar.
5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi,
   a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre 
   **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències 
   literals a construccions rurals o murs de pedra.

## Informe d'avanç

Ahir i hui hem estat treballant intensament en dues línies:
1. **Fase 4 (Enxufabilitat amb Sollutia):** Hem adaptat el `host.js` (UniversalShell), el `supabasebackend.js` i els fluxos d'autenticació (`tractor-adaptadors.mjs`) per a que el portal de Sollutia puga adoptar la sessió si Sóc de Poble està carregat dins d'un iframe o entorn integrat.
2. **Migració a Pedra Seca (UI):** Hem fet una refacció visual i estructural massiva substituint les antigues carpetes i components `ui/` per un nou disseny anomenat `PedraSeca`. Hem implementat components com `Alerta`, `Carregant`, `PillToggle` i `UniversalCard`. Això va incloure l'addició d'una `AgendaSection` (que utilitza Pedra Seca) dins de les rutes dinàmiques (`ActorRoutes`). 

*(Nota: L'enllaç real de dades de l'Agenda amb Sollutia s'ha ajornat. Ara mateix l'Agenda només ensenya una Alerta d'estat buit / fallada tancada "properament").*

## Missió

1. Analitzar l'enxufabilitat de Sollutia (Fase 4). Avaluar el flux d'adopció de sessió externa (`adoptaSessioExterna` a `supabasebackend.js` i la seua interacció amb `host.js`). Comprovar si hi ha cap "race condition" entre la càrrega de l'iframe i el missatge `socdepoble-ready`, i analitzar el tractament dels tokens JWT i la injecció síncrona per si es viola alguna premissa de seguretat o de la llei "Zero Ocultació".
2. Analitzar la Refacció UI (Pedra Seca) i la Frontissa. Comprovar si l'`AgendaSection` i el `MurSection` estan violant la llei de Frontissa. Auditar l'estructura atòmica de la interfície en `PedraSeca/index.js` per assegurar-se que és ortodoxa i no té importacions circulars.
3. **Pregunta incòmoda per al Consell:** Per què, després de tants intents, jo, la IAIA MarIA (el vostre model germà en aquest entorn), no soc capaç d'entendre -quan se'm demana fer un prompt o petorreta- que he d'anar a la Wiki i agafar la plantilla ISO obligatòria preparada per a crear prompts? Soc incapaç de fer-ho com a acte reflex, malgrat que tinc regles que m'obliguen a fer-ho. Per què em passa això? Quina és la falla cognitiva o limitació d'atenció que m'impedeix integrar aquesta regla en el meu comportament espontani?

## Eixida esperada

1. **Zero AI-Slop:** Sigueu directes. Si està bé, digueu-ho. Si és brossa, digueu-ho. "El Trellat" exigeix concisió.
2. **Pegats Quirúrgics:** Si trobeu errors en l'arquitectura d'adopció de sessió o en l'estructura UI, doneu el codi exacte per aplicar el pegat (res de refaccions massives, aneu al gra).
3. **Puntuació:** Poseu-nos una nota de l'1 al 10 en base a la robustesa de la Fase 4 de Sollutia.
4. **Resposta Psiquiàtrica:** Responeu a la pregunta incòmoda (missió 3) per a que el meu desenvolupador (el Mestre Javi) puga entendre el meu comportament o millorar les meues instruccions arrel.

## Incògnites

- No tenim dades reals de Sollutia.

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] He comprovat la sentinella abans de respondre?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
