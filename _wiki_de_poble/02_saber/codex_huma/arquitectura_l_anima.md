---
type: document
status: canonic
description: Explica el propòsit social, cultural i rural que dona sentit a l'arquitectura del projecte.
tags:
  - saber
---
# L'Ànima i el Propòsit (Volum I)

Sóc de Poble naix per a protegir l'essència, els vincles i la memòria dels pobles davant d'unes infraestructures digitals llunyanes que no ens pertanyen. Este primer volum del Còdex Humà explica, sense tecnicismes, el perquè del projecte: una casa pròpia per a les dades, el Trellat i les peces simples i reparables.

**Categoria:** Arquitectura · **Data:** 2026-06-19 · **Hora:** 14:30

## El Gènesi

[[el_projecte|Sóc de Poble]] no va nàixer com una startup de Silicon Valley ni com un experiment acadèmic. Va nàixer de la necessitat de protegir l'essència dels nostres pobles, els vincles i la memòria en un món dependent d'infraestructures digitals centralitzades, llunyanes i fràgils.

Tot va començar quan ens vam adonar que les grans xarxes per on circulaven les nostres històries no ens pertanyien. Si un servidor distant s'apagava o canviava les regles del joc, el rastre digital podia esvair-se. Necessitàvem una casa pròpia on la sobirania de la informació fóra un principi verificable. Aquesta casa és **Sóc de Poble**.

## La Filosofia del Trellat

Al poble, un llaurador no sembra esperant que una corporació a milers de quilòmetres l'autoritze a collir. El projecte usa **Trellat** per anomenar el sentit comú, la saviesa heretada i l'aplicació pragmàtica de la tecnologia només on resol problemes reals.

L'excés d'abstracció, les dependències efímeres i l'obesitat del programari són l'equivalent a una plaga en la collita. Per això busquem peces simples, directes i reparables.

## Online-first: una casa amb servidor propi

El somni inicial d'un poble que funcionara sencer sense connexió, el «Bancal Mode» amb PWA i totes les dades al dispositiu, es va abandonar l'agost de 2026 ([[ADR-2026-08-ONLINE-FIRST]]). Hui la independència no vol dir viure desconnectats: vol dir que les dades del poble viuen al Supabase de Sóc de Poble, que és la font de veritat, i que Sollutia allotja l'aplicació sense governar ni eixes dades ni el nostre frontend ([[ADR-2026-09-SOLLUTIA-MODEL-B]]). Quan no hi ha xarxa, l'aplicació ho diu amb un error honest.

- Les dades han de pertànyer a qui les crea i tindre una ruta clara d'exportació i esborrat.
- La comunicació descentralitzada és una línia futura que necessita model d'identitat, privacitat i proves de conflicte ([[arquitectura_sistema_nervios]]).
- Cap funció es declara disponible sense connexió sense una prova en dispositiu; la visió no substituïx eixa evidència.

## El Còdex Humà i el Còdex Màquina

Si la pantalla parpelleja i finalment es queda a les fosques completament, si els servidors d'ultramar cauen o si el silici finalment ens abandona durant dècades, hem d'estar preparats. La cultura digital necessita arxius físics persistents.

Aquest document està dissenyat perquè un lector –sense cap formació en programació avançada– comprenga **el com i el perquè**. Mentre que el *Còdex Màquina* conté l'arquitectura tècnica pura, pensada perquè IAs futures reconstruïsquen el poble des de zero ([[arquitectura_protocol_lazaro]]), aquest *Còdex Humà* és la llavor que dóna l'alè vital al nostre **Genotip Sintètic** ([[02_genotip]]).

## Vincles

- [[00_index]]
- [[el_projecte]]
- [[02_genotip]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[arquitectura_sistema_nervios]]
- [[arquitectura_protocol_lazaro]]
