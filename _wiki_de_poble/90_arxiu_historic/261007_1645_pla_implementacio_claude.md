---
type: document
status: esborrany
description: Pla d'implementació per a l'auditoria adversarial i neteja de la Consola Termodinàmica i avatars
tags:
  - implementacio
visibility: private
reflex: sdp:torn_25bffe5f-a964-4846-9254-c89a9ea0caf2:965917f4-4670-4b38-b41e-31e9e9fc7c75
---
# Auditoria Adversarial i Consola Termodinàmica

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_25bffe5f-a964-4846-9254-c89a9ea0caf2:965917f4-4670-4b38-b41e-31e9e9fc7c75 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T14:44:27.176Z |
| Modificació | 2026-10-07T14:44:27.176Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-07T14:44:27.176Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

[pendent]

**NOTA AFEGIDA DURANT L'AUDITORIA VISUAL (Per l'orquestradora MarIA i el Mestre):**
S'han detectat tres errors d'arquitectura crítics a solucionar durant aquesta implementació:
1. **Codi duplicat a l'Editor:** S'han trobat dues plantilles funcionant al mateix lloc ("Editar logotip" vs "Editar capçalera", possiblement per `UniversalEditorShell`). Cal revisar a fons on es duplica la plantilla en Notes/Mur/Mercat i unificar l'editor a *tot el sistema* de la millor forma possible perquè no hi haja codi redundant.
2. **Històric invisible (Llistat del Mur sota l'editor):** En obrir Notes Personals > Mercat (o Mur) per a un perfil concret, no s'estan llistant les targetes que eixe usuari ja té publicades (per ex., Sóc de Poble hauria de veure les notícies del mur sota l'editor). Esta lògica de llistar elements de la categoria per a l'avatar actiu ha d'estar disponible per tot el sistema.
3. **Pèrdua de URL a Targetes Vives (Productes):** Quan anem a editar un producte sencer (ex: samarreta-socdepoble), la Targeta Viva no renderitza el contingut sencer del producte. A més a més, el botó "Obri al Mercat" perd completament el *slug* complet i només redirigeix a l'arrel genèrica. El component original renderitzava el carrusel de fotos i les variacions sense perdre la localització de l'element; això s'ha de recuperar.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

[pendent]

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

[pendent]

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
