---
type: prompt
status: esborrany
description: Prompt per a Claude Opus 5.5 Ultra Code per generar la lògica i especificació del mòdul de xat (clon WhatsApp) utilitzant la nova plantilla de skills.
tags: [govern]
---
# Prompt d'Auditoria Local (SDP - v2.4)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

**⚠️ ADVERTÈNCIA D'INVIOLABILITAT (Certificació ISO):** Aquesta plantilla és SAGRADA. La IAIA MarIA o qualsevol agent que genere un prompt a partir d'aquesta plantilla està **ESTRICTAMENT OBLIGAT** a fer una **còpia literal i íntegra** (copy-paste exacte) de tot el document, especialment del "Protocol de la Reunió a l'Olivera". Resumeix, mutilar o interpretar parts d'aquesta plantilla és una infracció greu del sistema.

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria (Telemetria de Tokens):** Quan generes el teu document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra). A més, **estàs obligat a informar explícitament del teu consum de tokens (d'entrada i d'eixida)**, així com de qualsevol dada relativa a la complexitat del treball (nivell d'embossament del context, fricció...). Aquesta dada s'ha d'apuntar automàticament a cada document que generes per poder bolcar-ho posteriorment a la taula de Consums. És vital per al sistema de telemetria i per mantindre la Consola amb dades reals.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260926-XAT |
| Versió | 2.4.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-26 23:30 |
| Modificació | 26-09-26 23:30 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.4.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:claudexat |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.4.0:** Afegida la visió de futur com a App Nadiua (Apple/Google Store) i l'exigència d'alta modularitat/independència de connexió (WordPress, Joomla).
- **2026-09-24:** El bloc Context enllaça la [[taxonomia_documental]] com a lectura obligatòria (ordre del Mestre al pla 1245).
- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.
- **v2.2.0 (260923_1345):** Integrades les auditories T3 de Claude: Afegida secció 0 "Abans de generar", camps Ruta, Rebut i Tall d'evidència, Tasques, i Riscos.
- **v2.1.0 (260922_2220):** Afegida la secció "La Reunió a l'Olivera".
- **v2.0.0:** Revisió inicial del prompt per auditories amb zero context.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. 

**Visió de Fedivers, App Nadiua i Enxufabilitat Extrema:** L'aplicació no és un portal aïllat, sinó una micro-xarxa social pensada com un **Fedivers** i, en un futur, com una app nadiua (*offline-first* a l'estil Obsidian) per a l'Apple Store i Google Play. Per garantir-ho, l'arquitectura del codi ha de ser altament modular i mantenir una **enxufabilitat absoluta ("plugability")** i independència total. El frontend ha d'estar preparat per a funcionar autònomament, connectar-se al backend de producció (Sollutia), o enxufar-se sense fricció com un mòdul a qualsevol plataforma (WordPress, Joomla, etc.). Qualsevol codi que escrigues ha de respectar escrupolosament aquesta independència i modularitat; no pots trencar els nostres plans de futur lligant-nos a un servidor concret.

## Instrucció del torn

Hola **Claude Opus 5.5 Ultra Code**!
En aquest torn canviem completament d'escenari. Hem deixat l'escriptori ben net i t'hem preparat un nou Pla d'Implementació (`260926_2330_pla_implementacio.md`) centrat exclusivament en l'arquitectura del futur mòdul de **Xat (estil WhatsApp)**.

La teua missió no és escriure codi font funcional encara, sinó actuar com a Arquitecte Principal i crear un **document mestre / Skill d'Especificació**.
Per a fer-ho:
1. Revisa profundament el fitxer **`_wiki_de_poble/03_actuar/plantilles/skill.md`**, que és la nostra última plantilla ISO actualitzada per a la creació de Skills (amb consideracions de Fedivers i arquitectura 100% online).
2. Genera una nova Skill (que podria anomenar-se `sdp-xat-whatsapp`) que continga tota la lògica d'un clon de WhatsApp: estats del missatge (enviat, rebut, llegit), fils de resposta, reaccions amb emojis, notes de veu, metadades d'arxius adjunts, xats de grup vs. directes, etc.
3. El propòsit d'aquest document és servir com a "menú d'opcions" o "esborrany de lògica completa" perquè l'equip humà, en una reunió posterior amb captures de pantalla de WhatsApp real, decidisca exactament què s'implementa i què no. Per tant, has de ser extremadament exhaustiu en detallar les possibles funcionalitats i la lògica de dades subjacent (suposant l'ús de Supabase i React).

## Tasques

- Llegir i assimilar el Pla d'Implementació i la plantilla de creació de skills (`skill.md`).
- Redactar l'esborrany de la nova skill seguint fil per randa el format dictat per l'estàndard ISO de la plantilla. L'arxiu s'haurà de guardar a l'escriptori com a `260926_2330_skill_esborrany_xat.md`.
- Desglossar TOTA la lògica de dades, UX i casos d'ús típics de WhatsApp. Formata-ho de manera que l'usuari puga respondre-hi fàcilment quines funcions s'aproven i quines es descarten.
- **Lògica i Pàgina d'Usuari:** A més del xat, has d'investigar i proposar les millors pràctiques (funcionalitats, manuals de UX acceptats) per a la **Pàgina d'Usuari / Perfil**. No tenim clar encara com serà aquesta part; per tant, volem que ens proposes virtuts i funcionalitats addicionals que el sistema puga acollir fàcilment (estats, privacitat, bio, avatars, etc.) perquè la part d'usuari siga impecable.
- **NOU: Tractor Cognitiu d'Alerta de Saturació:** Genera també (en un fitxer a part) una segona Skill/Tractor per a la IAIA MarIA. Aquest tractor ha de ser **TACHANT I ESTRICTE**. Dictarà les regles perquè MarIA puga avaluar autònomament el seu nivell de saturació de context (creant les seues pròpies estadístiques i patrons de millora) i siga capaç de plantar-se i dir "NO" si l'usuari intenta introduir una càrrega de treball forta quan ella ja està a un 50-60% de context. El tractor l'ha d'obligar a avisar PROACTIVAMENT a l'usuari demanant fer una Acta Marmota per saltar a un xat nou abans de col·lapsar.

### Criteris d’acceptació i reproducció

- **Criteris d'Acceptació:** L'esborrany de la skill ha d'estar generat a l'escriptori (carpeta `04_escriptori`) i complir impecablement l'estructura requerida pel YAML frontmatter i el cos de `skill.md`. Ha d'oferir un autèntic mapa arquitectònic per a un sistema de missatgeria complex.

## Riscos

- Perdre de vista la visió "offline-first/app nadiua" en dissenyar el model de dades.
- No seguir l'estructura ISO imposada per la nova plantilla.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria (o l'esborrany de la skill) a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** Utilitza la taxonomia adequada per a esborranys.
3. **LECTURA OBLIGATÒRIA DE L'ESCRIPTORI (Regla d'Or):** Si hi ha algun altre fitxer a l'escriptori, te l'has de llegir SENCER.
4. **La Reunió a l'Olivera (Diàleg i Consens):** Funcioneu com un equip. No passes a picar codi React fins que el pla/skill estiga consensuat.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
