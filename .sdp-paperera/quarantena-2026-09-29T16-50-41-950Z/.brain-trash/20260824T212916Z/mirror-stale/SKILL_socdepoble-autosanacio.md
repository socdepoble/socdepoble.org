---
estat: actiu
tipus: skill
description: "Mirall humà de la skill socdepoble-autosanacio"
source: .agents/skills/socdepoble-autosanacio/SKILL.md
---

> [!WARNING]
> **AQUEST FITXER ÉS UN REFLEX (MIRROR)**
> Açò és l'estrat humà. Qualsevol modificació o discussió sobre com he d'actuar s'ha de fer ací. Quan estiguem d'acord, s'actualitzarà la meua vertadera matriu a `.agents/skills/socdepoble-autosanacio/SKILL.md` exclusivament en anglés tècnic.

# Autosanació del graf (Sistema Immunitari)

## Contracte i Autoritat

Aquesta Skill executa el diagnòstic del graf. El diagnòstic és **100% READ_ONLY**. L'auditoria genera una llista d'incidències, mai muta arxius directament.
Si l'auditor canònic no està disponible o falla una precondició, retorna ERROR o NOT_RUN, mai PASS. No enganyis l'usuari amb falsos verds.

## Execució del Diagnòstic (Fase 1)

Usa les eines del sistema per analitzar l'estat del coneixement (p. ex. buscant wikilinks trencats, orfes sense connexions, o pàgines buides). 

Per cada incidència detectada indica:
- Identificador i severitat de l'error.
- Fitxer/línia i evidència.
- Classificació: fantasma (enllaç irresolt), ambigu, orfe, buit o exclusió.
- Proposta de solució, nivell de confiança de la teua proposta, i alternatives.
- Fitxers que canviarien i prova de rollback.

**Límits del diagnòstic:** No inventes destins per a fer desaparéixer un error ràpidament. No reescrius un enllaç només per semblança de nom sense estar-ne segur. Respecta canaris, exclusions i zones de l'Escriptori.

## Aplicació de Solucions (Fase 2)

Aplicar les solucions o receptes recomanades pel diagnòstic és una operació de **SOURCE_MUTATION** completament diferent. Per a executar-la, has de complir amb el Workflow Universal:
1. Reaudita l'estat si fa temps de l'auditoria original.
2. Demana permís al Mestre amb un pla clar (`implementation_plan.md` o Petorreta segellada).
3. Obté l'autorització / lease del protocol Reflex.
4. Aplica els canvis amb les eines adients.
5. Verifica el graf resultant.

Una quarantena només pot afectar targets exactes i recuperables. Mai s'elimina codi o notes sense Reflex i confirmació expressa.

---
**Ancoratge de Seguretat:** [[00_INDEX_MIRROR]]
