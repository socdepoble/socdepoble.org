---
type: prompt
status: esborrany
description: "Prompt per a Claude: Refactoritzar i habilitar auto-updates al plugin de WordPress."
tags: [govern, wordpress, plugin, claude]
---
# Prompt d'Execució i Auditoria Local (SDP - v3.0)

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260929 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-29 21:45 |
| Modificació | 26-09-29 21:45 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD] |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | Claude |
| Tokens consumits | [pendent] |

## Historial

- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.
- **v3.0.0 (260927_1505):** Refactorització total cap a un format tècnic, concís i lliure de metàfores (eliminats "Olivera", "Masia"). S'optimitza per claredat tècnica mantenint la visió hipermodular.

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

L'usuari (Javi) necessita que el connector de WordPress `socdepoble-enxufe` (situat a `wordpress-plugin/socdepoble-enxufe.php`) s'actualitze i es convertisca en un **súper plugin de WordPress** (amb estructura per a ser plugin oficial i suport multi-servidor / Fedivers, ja que tenim dos servidors diferents a la base de proves). No obstant, i això és **CRÍTIC**, l'usuari subratlla que la prioritat absoluta demà mateix és la **enxufabilitat amb Sollutia**.

Açò vol dir que tot el que fem ara amb WordPress, tot i que ens desviem un poc per millorar el plugin, té com a objectiu principal assegurar i demostrar que amb Sollutia passarà exactament el mateix: ens podrem enxufar a Sollutia tan fàcilment com ho farem a WordPress. 

Per tant, la idea és no complicar-ho més ni posar més traves, sinó adonar-se del que necessita cada sistema i preparar el plugin pensant sempre en **com de fàcil serà l'enxufabilitat amb Sollutia**. No perdes de vista este objectiu quan dissenyes la solució d'actualitzacions i l'estructura del codi.

A l'arxiu `260929_2145_pla_implementacio_plugin_wp.md` de l'escriptori s'ha redactat el pla d'implementació per dur a terme aquesta evolució (Tasques T1, T2, T3).

## Tasques

- T1: Refactorització estructural i expansió del codi a `wordpress-plugin/socdepoble-enxufe.php` perquè esdevinga un plugin de qualitat oficial (incloent seguretat, bones pràctiques, i suport base per a la connexió amb múltiples servidors del Fedivers).
- T2: Proposar i codificar la solució perquè l'enllaç "Activar actualitzacions automàtiques" siga operatiu fàcilment (per exemple, integrant-ho amb GitHub si escau, o adaptant el codi de forma oficial).
- T3: Auditar el comportament de MarIA (jo, l'agent orquestrador). Encara estic fallant en seguir el "tractor cognitiu" (`core-higiene-escriptori`) que m'obliga a netejar l'escriptori (`04_escriptori`) abans d'iniciar una nova tasca o de redactar una petorreta. Analitza per què no ho faig sistemàticament i proposa una solució contundent perquè no torne a oblidar-me de netejar l'escriptori abans de començar.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** N/A (el desenvolupament del plugin es fa fora de l'entorn de react, sobre el fitxer `.php`).
- **Criteris d'Acceptació:** 
  - Codi documentat i net.
  - Mecanisme d'actualitzacions automàtiques dissenyat o implementat adequadament dins dels límits del sistema.

## Riscos

- Si tries integrar la llibreria Plugin Update Checker de GitHub, cal considerar si el repositori serà públic o privat (recomanem no deixar tokens exposats al codi base).

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
