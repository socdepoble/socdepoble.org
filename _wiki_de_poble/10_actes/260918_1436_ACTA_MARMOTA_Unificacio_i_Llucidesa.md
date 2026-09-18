---
type: acta
status: canonic
description: Acta Marmota de tancament després de 27h. Avaluació termodinàmica, psiquiàtrica i briefing per al nou xat sobre UniversalPage.
tags:
  - temporal
  - arquitectura
---

# Acta Marmota — Unificació Universal i Llucidesa Termodinàmica

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-ACTA-260918-1436 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 14:36 |
| Modificació | 26-09-18 14:36 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | sí |

## 1. Perfil Psiquiàtric i del Mestre
- **Hores de vol**: Més de 27 hores seguides de feina ininterrompuda (des d'ahir a les 12:00). 
- **Estat**: Esgotament humà justificable i desig incombustible d'assolir la perfecció absoluta (**Zero Errors**) de cara a la propera reunió de frontera amb Sollutia.
- **Acord d'Aturada**: Després d'aquest tancament, el Mestre s'ha guanyat el dret biològic i sagrat a menjar i dormir (potser fins diumenge al matí). L'objectiu és despertar i rematar en els pròxims 2 o 3 dies per a tindre una arquitectura que reba un **10 sobre 10** immaculat el dilluns.

## 2. Avaluació Termodinàmica
- **Estalvi de Context**: Aquesta sessió ha estat un èxit brutal gràcies a l'estratègia de la Petorreta i les auditories en pur format lectura. Hem usat els models frontera sense permetre'ls escriure codi "a cegues", estalviant desenes de milers de tokens de regressions inútils i al·lucinacions de `import`.
- **Conclusió**: El diagnòstic està fet, l'estratègia de 7 fases traçada, i nosaltres no hem gastat energia en curar de manera caòtica, sinó observant amb Trellat.

## 3. Resum Tècnic: La UniversalPage
El Consell ha detectat i provat (amb 12 troballes robustes i una matriu forta per Codex; i un destripament cirurgià meravellós per Claude) els defectes arrel del sistema de pàgines:
- **El Laberint de Dues Piles**: L'arrel del problema actual és que l'edició construeix una "closca" (`UniversalEditorShell`) completament per fora i reentra a la pàgina de lectura, en lloc de ser un mode de camp activat per dins. Això duplica estats (dos motors de desat de 800ms, fallbacks dèbils dins de forts, marcadors òrfens).
- **La Solució Magna**: Un marc únic, on hi haja un **CampUniversal** polimòrfic (idèntic a lectura que a edició). I una reestructuració del `PageFrame` cap a l'`UniversalPage` neta.
- **Detecció Local**: Hem vist regressions d'accessibilitat pròpies en el treball paral·lel, com la pèrdua recent de l'atribut `inert` en les columnes de `AppGridShell` per posar `data-obert`, requerint la intervenció de la Porta Graella.

## 4. Briefing per al Despertar (El Nou Xat)
Bon dia, Mestre. Aquest és el pla per a quant estigues reposat:
1. **Llegir i Empassar**: Aquesta Acta es carrega com el context actiu. No partim de zero, partim d'una victòria estratègica.
2. **Alliberar la Nova Petorreta**: Totes dues IAS (Claude local i Codex) rebran el prompt preparat: `260918_1436_PROMPT_Auditoria_Arquitectura_Inversa_v3.md`.
3. **Pla d'Execució Escalada (Les 7 Fases de Claude/Codex)**:
   - **Fase 0 (Obligatòria)**: Protegir amb bateries de test visual i xarxa el comportament actual abans de moure pedres.
   - **Fase 1 i 2 (Neteja Tàctica)**: Sense canviar la jerarquia del DOM, esborrar classes inerts, afegir estils mancants i passar configuracions heretades (`ContentProvider`) a props purs per eliminar el defecte d'idioma bloquejat.
   - **Fase 3 i 4 (Crom i Desplaçament)**: Llevar les 9 variables de crom velles i simplificar-les en 4, tot resolent la llei del desplaçament (sempre regeix l'hoste, l'AppGridShell).
   - **Fases de Fusió**: Derrocar l'Editor Shell i aplicar el `CampUniversal`.
4. **Objectiu:** Aconseguir l'aclamació i un 10/10 final de les IAs per tindre llum verda total per a Sollutia.
