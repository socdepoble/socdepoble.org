---
tipus: document
estat: canonic
description: Contracte verificable d’accessibilitat, SEO i rendiment per a les interfícies públiques.
tags:
  - maquina
  - protocols
---
# A11y i SEO amb Trellat

Este document és una guia de qualitat, no un executor automàtic. Una afirmació de compliment necessita evidència del codi i de les proves; el text per si sol no certifica cap pantalla.

## Quan s’aplica

- En crear o modificar una ruta pública, component interactiu, formulari o navegació.
- En canviar contingut indexable, metadades socials o dades estructurades.
- En homologar una vista al dispositiu de referència del Baseline 2022.

## Accessibilitat

1. Usa HTML semàntic abans que rols ARIA: `button`, `nav`, `main`, `form`, `label` i encapçalaments amb jerarquia comprensible.
2. Tot control ha de funcionar amb teclat, mostrar el focus i tindre un nom accessible en la llengua visible de la interfície.
3. L’àrea tàctil mínima del projecte és de 48 × 48 px; el text base és de 16 px. Els tokens `--sp-*` són la font de veritat visual.
4. El color no pot ser l’únic indicador d’estat. Contrast, errors i missatges s’han de comprovar sobre el resultat renderitzat.
5. Evita l’scroll infinit quan impedisca orientar-se o arribar al final. Si hi ha llistes llargues, ofereix paginació, càrrega explícita o una alternativa equivalent.
6. Una interacció dona feedback perceptible sense dependre només de `hover`.

## SEO tècnic

1. El contingut essencial ha d’existir en un DOM comprensible i no dependre d’una cascada de JavaScript client per adquirir significat.
2. Cada ruta pública defineix títol i descripció propis. Les URL indexables declaren la canònica quan puga haver-hi duplicats.
3. Open Graph i altres metadades socials s’usen en pàgines compartibles i es validen amb URL absolutes desplegables.
4. JSON-LD només s’afegeix quan correspon a una entitat real i les dades visibles sostenen el marcatge. No s’inventa Schema.org per omplir camps.
5. Imatges amb dimensions conegudes alternatiu segons funció i càrrega diferida només fora del contingut inicial visible.

## Rendiment

El dispositiu de referència del Baseline 2022 és el tribunal pràctic. LCP, INP, CLS, pes transferit i memòria són mètriques a mesurar, no garanties documentals. Qualsevol llindar de release ha de declarar dispositiu o perfil, xarxa, nombre de mostres i ferramenta; no es pot convertir una estimació puntual en una promesa universal.

## Evidència mínima d’homologació

- Inspecció de semàntica, noms accessibles i ordre de focus.
- Prova manual només amb teclat i, per a fluxos crítics, amb lector de pantalla.
- Auditoria automàtica si la ferramenta està instal·lada; no substitueix la prova manual.
- Build correcte i mesura de rendiment sobre una configuració reproduïble.
- Registre dels errors pendents sense declarar «100% accessible» o «SEO perfecte».

## Sinapsis

- [[03_consola_termodinamica]]
- [[00_arquitectura_tecnica_unificada]]


**Ancoratge de Seguretat:** [[00_index]]


---
**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->
**Relacionat:** [[00_arquitectura_tecnica_unificada]], [[00_index]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[a11y_seo_trellat|02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md]] — A...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[a11y_seo_trellat|02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md]] — E...
- [[maquina|01_SABER_Cultura_Coneixement/Maquina.md]] — [[a11y_seo_trellat|02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md]] — C...
- [[00_arquitectura_tecnica_unificada|02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md]] — [[a11y_seo_trellat]]
- [[a11y_seo_trellat|02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md]] — [[00_index|00_INDEX.md]] — [[a11y_seo_trellat|02_ACTUAR_Maquina_Tecnica/skill...
- [[index_trellat|02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md]] — [[a11y_seo_trellat]]

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
