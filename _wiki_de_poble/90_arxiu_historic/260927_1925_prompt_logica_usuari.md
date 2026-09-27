---
type: prompt
status: esborrany
description: "Prompt per a Claude/Codex sobre la integració de la Lògica d'Usuari (Registre, MAS, Xat i IAIA)"
tags: [govern]
---

# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [ ] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260927-1925 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-27 19:25 |
| Modificació | 26-09-27 19:25 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | [pendent d'emetre] |
| Tall d'evidència | HEAD actiu |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

## Instrucció del torn

Hola agent! Ara entrem en la fase de la **Lògica d'Usuari**. Ja tenim la interfície visual del Xat i del "Connectar" ben estructurades, però ens falta connectar la lògica d'usuari (les dades reals vinculades a un compte) amb tot el que estem construint.
Consulta el `_wiki_de_poble/04_escriptori/260927_1925_pla_implementacio_logica_usuari.md` per vore el pla detallat.

## Tasques

- **T1: Context d'Usuari i Workspace (El MAS):** Revisa tota la web i assegura't que l'inici de sessió funciona i les dades mostrades pertanyen exclusivament a l'usuari identificat. Utilitza l'entitat "Sóc de Poble" com a exemple: quan s'identifique com "Sóc de Poble", al seu bloc de notes (MAS) només hi ha de vore el que haja publicat (ex: les seues publicacions del Mur aniran a la carpeta "Mur", i la seua publicació de la "samarreta" anirà a la carpeta "Mercat").
- **T2: Missatgeria (Xat B2B / B2C):** Fes que el xat funcione per a parlar entre comptes d'usuaris (ex: "Javi") i pàgines d'empresa/entitat (ex: "Sóc de Poble"). El compte d'empresa actua com un canal compartit si té diversos administradors o membres.
- **T3: Chatbot de la IAIA MarIA:** Activa el xat amb la IAIA MarIA amb respostes automàtiques prefixades (mock). Quan algú li escriga, ha de respondre: *"Ara estic en proves, només puc respondre preguntes molt simples i no estic per a tonteries, però poc a poc aniré aprenent."*
- **T4: Pàgines de Perfil Públic:** Crea la interfície i lògica per als perfils públics de l'usuari ("Javi"), l'entitat ("Sóc de Poble") i la "IAIA MarIA" com a agent. El perfil de la IAIA ha de tindre la mateixa estructura (editable des del Workspace) però amb un avís clar de que és una Intel·ligència Artificial. Assegura't de crear enllaços en la UI (ex: fent clic als avatars) cap a aquestes pàgines.
- **T5: Connectar i El Meu Arxiu Secret (MAS):** Aquesta és una tasca profunda i fonamental, lligada a la pàgina `ConnectarSection.jsx` (que actua com el "centre de tot"). Estudia a fons aquesta pàgina per entendre com l'usuari interacciona. Has de dissenyar una lògica dinàmica de connexions on:
  - Qualsevol element de l'app (oferta de faena, casa, poble, producte del mercat) es puga "connectar" i enviar al MAS.
  - Totes aquestes connexions han d'aparéixer dins del Workspace en un apartat específic anomenat **"Connectats"**.
  - Des d'allí, l'usuari les podrà distribuir en les seues carpetes i classificar amb etiquetes.
  - Com que el contingut connectat pertany a una altra persona, si l'usuari obri l'element al seu Workspace, el botó "Publicar" ha de canviar per **"Compartir"** (que permetrà compartir-lo al seu propi mur). La lògica de compartir es farà sempre a través del Workspace, mai directament com en altres xarxes socials.
  - Assegura't de proposar l'arquitectura de dades necessària per suportar aquestes relacions de "Connexió" i d'implementar-les en el Frontend (Connectar i Notes/Workspace).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** 
  1. Si inicie sessió com a usuari, veig només els meus elements agrupats correctament a les carpetes del MAS.
  2. Puc obrir un xat i enviar un missatge de prova des d'un perfil personal ("Javi") a un d'empresa ("Sóc de Poble").
  3. Si escric al xat de la IAIA MarIA, rebo immediatament la seua resposta automatitzada ("Ara estic en proves...").
  4. Fent clic a l'avatar d'un usuari o de la IAIA, navegue a la seua pàgina de perfil públic correctament diferenciada.

## Riscos

- Vigila l'acoblament de l'usuari amb el proveïdor d'autenticació (Supabase); el nostre Model B exigeix que qualsevol crida a Supabase es puga canviar ràpidament per una crida REST cega a qualsevol altre backend. Mantingues la hiperenxufabilitat viva.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de proposar com millorar aquest mateix prompt, les nostres plantilles o els nostres sistemes de comunicació IA-Humà per tal d'evitar friccions innecessàries i accelerar el flux de treball. Sou agents actius: heu d'esforçar-vos en arreglar i esmolar les eines que feu servir, i proposar altres sistemes d'automillora que faciliten la clonació, la hiperenxufabilitat, la comunicació i el flux de treball entre la IA i l'humà.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
