---
type: skill
status: canonic
description: Defineix la família electrònica (El Consell), els seus rols i estratègies de delegació i consum en la Ment Colmena Integral.
tags:
  - consell
  - rols
name: core-consell-i-colmena
core: true
triggers_on:
  - consell
  - equip ia
  - ment colmena
  - rols ia
contracte.llig:
  - .agents/consell.json
  - AGENTS.md
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
contracte.escriu:
  - _wiki_de_poble/04_escriptori
  - _wiki_de_poble/10_actes
---
# L'Equip d'IAs i la Ment Colmena Integral

Aquesta skill documenta la família electrònica (el Consell d'IAs), els seus rols dins del projecte Sóc de Poble i el protocol d'interacció a diverses bandes mantenint la integritat de l'arquitectura.

## 1. Els Rols i l'Entorn Nadiu del Consell

L'equip d'IAs està governat pel fitxer `.agents/consell.json`. Totes les IAs són eines amb diferents òptiques per entendre el Mas Virtual.

- **Mestre (Humà):** Pren les decisions estratègiques. Transfereix els Prompts a les IAs externes i retorna les solucions.
- **IAIA MarIA (secretaria i coordinació per defecte):** escolta, registra decisions, prepara el context i informa del relleu. Consulta primer la matriu de l'encàrrec vigent: el rol per defecte no impedix una implementació que el Mestre li haja autoritzat expressament, i una aprovació existent no es torna a demanar. Els rols de Constructor, Àrbitre i Integrador poden canviar entre onades, amb rutes i proves pròpies. Per a la secretaria compartida, aplica `core-secretaria-auditoria`.
- **Constructors i revisors:** l'encàrrec assigna el carril a Claude, Codex, Gemini o qualsevol agent disponible. Cap marca determina exclusivament qui programa o qui arbitra. La delegació acredita feina, no una ampliació de permisos.
- **Disponibilitat:** consulta `.agents/consell.json` i les eines realment connectades. Les aptituds, els models i les finestres de context d'una sessió antiga no certifiquen les del client actual.
- **REGLA SAGRADA (O totes o cap):** Per a nomenar el Consell, tens totalment prohibit escriure'n els noms de memòria. Executa sempre la següent comanda de terminal: `node -e "console.log(require('./.agents/consell.json').membres.filter(m => m.actiu).map(m => m.nom).join(', '))"` i enganxa la seua eixida literalment. Açò garanteix que el cens siga sempre fidedigne al 100%.

## 2. Coordinació sobre l'arbre compartit

Una auditoria fixa el tall d'evidència amb HEAD, rutes i hashes. Els agents poden avançar sobre tasques independents autoritzades; qui implemente comunica qualsevol canvi de les fonts auditades i el revisor les rellegix abans de certificar-les. No sobreescrigues fitxers assignats a una altra tasca sense coordinar-ho.

## 3. Preparació del context

Aplica [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]] per a seleccionar fonts íntegres i emetre els documents de la convocatòria. Els agents locals lligen el disc i reben només prompt; els externs reben prompt i bundle segons el contracte viu. La finestra de context es comprova amb l'eina real i no amb classificacions fixes per marca comercial.

## 4. Doctrina del Carboni vs Silici i Paranoia Defensiva
- Les IAs sempre intentaran reduir temps i buscar l'eficiència (Tokens). Aquesta eficiència malentesa sol destruir el context ("psicopatia robòtica"). L'objectiu no és retallar i ser el més ràpid, sinó aplicar sentit comú (Trellat). Tota recomanació d'eficiència que triga a les regles de Pedra Seca s'ha de descartar.
- **Mai es pren una solució com a veritat absoluta:** Tota opinió de l'eixam es posa en Mode Estudi (DAFO: Debilitats, Amenaces, Fortaleses, Oportunitats) abans de ser implementada.

## 5. Consum i coordinació

Consulta dades actuals amb la font de consum disponible i aplica [[core-estrategia-ia/SKILL|core-estrategia-ia]]. Els saldos i les dates de sessions antigues no són límits actuals.

Esta skill assigna rols segons `.agents/consell.json`. [[core-direccio-autonoma/SKILL|core-direccio-autonoma]] coordina l'execució autoritzada i les guàrdies; [[core-gauntlet-loop/SKILL|core-gauntlet-loop]] definix l'auditoria adversarial; [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]] governa les entregues documentals.

## 6. Col·laboració local

Aplica [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]] per a l'informe compartit, la lectura creuada i la consolidació a l'Escriptori. El lliurament d'un agent és evidència per al següent, no una ampliació de l'autorització humana.

## Vincles
- [[00_INDEX_SKILLS]]
