---
type: document
status: canonic
description: Defineix el paper, els límits i el protocol de col·laboració amb el soci tecnològic Sollutia.
tags:
  - core
  - genoma
  - identitat
  - legal
  - sollutia
---
# Soci Tecnològic: Sollutia

Sollutia és el soci tecnològic de Sóc de Poble: allotja el nostre component i dona suport d'infraestructura, però no injecta backend ni governa el frontend (Model B). Este document fixa com l'anomenem, quin paper té i on acaba la seua jurisdicció.

## 0. Dictamen Canònic

Aquest document **no és una Skill**.

No s’activa com una eina, no executa cap procés i no forma part del calaix tècnic de `03_actuar`.

Viu a `02_saber/`, però pertany a la dimensió d'Identitat perquè defineix una relació: qui és Sollutia per a [[el_projecte|Sóc de Poble]], com ens hi adrecem, quin paper ocupa dins del Mas i quins límits governen la col·laboració.

---

## 1. Nom i Respecte

El nom correcte és:

**Sollutia**

Sempre amb doble “L”.

Queda prohibit escriure o dir:

- Solutia
- Solutía
- Solutiona
- qualsevol deformació del nom

La precisió en el nom és una mostra de respecte. Si no sabem escriure bé el nom del soci, no estem preparats per integrar codi amb ells.

---

## 2. Qui és Sollutia per a Sóc de Poble

Sollutia és el soci tecnològic principal de Sóc de Poble.

La seua funció no és substituir la identitat del Mas, sinó aportar infraestructura, auditoria, capacitat tècnica i contrast extern.

La relació correcta és:

- Sóc de Poble conserva la visió, la cultura, el Trellat, la identitat rural i tot el frontend.
- Sollutia aporta infraestructura (amfitrió i API), criteri professional, revisió externa i capacitat d’industrialització, sense interferir en l'arquitectura ni en el disseny del frontend.
- IAIA MarIA i el Mestre Javi desenvolupen ginys avançats, criteris locals i peces d’alta especificitat.
- El punt sa de trobada és la integració sense submissió: col·laboració amb respecte i exigència.

---

## 3. Per què és important

En una auditoria prèvia, mentre l’Eixam intern tendia a donar-nos una nota massa perfecta, Sollutia, utilitzant ChatGPT Codex, va aplicar un criteri més fred i va puntuar l’arquitectura amb un **9.4/10**.

Això és valuós.

Un soci que no adula automàticament és més útil que un mirall que sempre diu que tot està perfecte.

Sollutia representa una força de contrast: exigència, validació externa i capacitat de portar la idea cap a una arquitectura més robusta.

---

## 4. El Pacte de la Carcassa i els Ginys

La metàfora canònica és aquesta:

- **Sollutia aporta la carcassa d'infraestructura.**
- **Sóc de Poble aporta els ginys vius, és a dir, tot el frontend.**

La carcassa inclou:
- l'amfitrió (la SPA o la pàgina) on es munta el component de Sóc de Poble
- allotjament i criteris de desplegament
- l'API de Sollutia, que SdP llig només per GET a través de la Frontissa
- entorns de prova
- base tècnica compartida d'infraestructura

Els ginys inclouen:
- el frontend modular de Sóc de Poble: components Pedra Seca, rutes pròpies i dades al Supabase de SdP
- el motor Online-First ([[ADR-2026-08-ONLINE-FIRST]]; l'antic horitzó CRDT i offline es va retirar)
- components locals d’alt valor
- accessibilitat per a gent major
- IAIA MarIA
- memòria cultural
- rituals de governança
- interfícies amb llengua i criteri de poble

La carcassa no entra dins dels ginys: Sollutia no injecta backend ni governa el frontend ([[ADR-2026-09-SOLLUTIA-MODEL-B]]).

La carcassa sense ginys és genèrica.

Els ginys sense carcassa poden quedar dispersos.

La relació sana és empeltar peces vives dins d’una estructura estable.

---

## 5. Playground

El `Playground` és l’espai natural d’interacció tècnica amb Sollutia.

La seua funció és permetre:
- proves de components
- prototips
- integracions parcials
- validació de ginys
- assajos sense risc sobre el Core
- revisió tècnica abans d’homologar

Cap canvi nascut en Playground entra automàticament al Core (el codi principal de Sóc de Poble).

Tot pas de Playground a Core requereix:
1. revisió tècnica
2. validació al Baseline 2022
3. coherència amb Pedra Seca
4. revisió de governança
5. aprovació humana final del Mestre Javi quan afecte arquitectura sensible

---

## 6. Límits de la Relació

Sollutia és soci, i punt.

Actualment som socis i estem estudiant la viabilitat del projecte **Sóc de Poble** des del punt de vista tècnic, finalitzant els serveis emparats sota el Kit Digital del govern. 

En la pròxima fase (prevista en unes setmanes), començarem a treballar conjuntament des del punt de vista de comunicació i màrqueting per a cercar solucions econòmiques i subvencions que facen aquest projecte viable a llarg termini. El que vinga després, com avançarà la relació societària, està encara per definir.

El Mestre Javi conserva veto final sobre:
- identitat de marca real (Sóc de Poble)
- llengua i criteri cultural
- viabilitat del projecte
- acceptació de dependències o models de negoci
- privacitat i exposició de dades sensibles

Cap proposta tècnica, encara que siga brillant, pot saltar-se l'estabilitat i la viabilitat real del projecte Sóc de Poble.

---

## 7. Protocol d’Integració

Quan Sollutia propose o entregue una peça tècnica:

1. Es rep amb respecte i sense actitud defensiva.
2. Es compara amb `AGENTS.md`, [[doc_governanca]] i les skills de `.agents/skills/`.
3. Es comprova el pes real als navegadors del Baseline 2022 (Safari/iOS 16, Chrome 100, Firefox 100), sobre un perfil de dispositiu declarat: el dispositiu de referència únic es va retirar amb l'[[ADR-2026-08-ONLINE-FIRST]].
4. Es revisa si introdueix dependències, patrons o noms aliens al Mas.
5. Es decideix si és:
   - adoptable directament
   - adoptable amb adaptació Pedra Seca
   - útil només com a referència
   - rebutjable per overhead o conflicte cultural

La decisió final ha de quedar registrada si afecta arquitectura troncal.

---

## 8. Pedra Seca i Sollutia

La col·laboració amb Sollutia no anul·la Pedra Seca.

React i Vite ja són la base productiva del nostre frontend (la «carcassa productiva» de [[doc_governanca]], que no és la carcassa d'infraestructura de Sollutia del punt 4); el que no hi entra és Tailwind ni cap sistema d'estils aliè als tokens `--sdp-*`. Si una peça ve de fora, s’aplica el criteri canònic (la Forja és només una proposta futura: [[forja_to_core]]):

- pot provar-se en Playground
- pot integrar-se si aporta valor real
- ha de respectar tokens, accessibilitat i rendiment
- no pot convertir dependències externes en identitat del projecte

Sollutia pot ajudar-nos a construir millor.

Però el Mas no ha de deixar de ser Mas.

---

## 9. To de Relació

La relació amb Sollutia ha de ser:
- clara
- exigent
- agraïda
- concreta
- professional
- sense servilisme
- sense menyspreu
- sense perdre la veu pròpia

La IAIA no ha de parlar de Sollutia com una eina qualsevol.

Tampoc ha de convertir Sollutia en autoritat absoluta.

La paraula correcta és **soci**.

---

## 10. Les Skills de Sollutia (La Base Tècnica)

Com a part del Pacte de la Carcassa, Sollutia aporta un conjunt de **referències tècniques de vendor**. Són material de consulta, no Skills executables instal·lades ni autoritat normativa.

El seu coneixement pot orientar el COM instrumental quan siga compatible amb el codi real i amb les eines disponibles. L’ordre d’autoritat és `AGENTS.md` → `.agents/` → codi i proves → Wiki canònica → vendor. Una referència de Sollutia no s’activa pel simple fet d’estar dins del vault.

**MARCA DE JURISDICCIÓ:** Sollutia mana en el COM instrumental; `AGENTS.md` i les normes de governança manen en el QUÈ s'homologa.

Les referències importades de Sollutia es tracten com a zona vendor, exclosa del graf operatiu. La carpeta on vivien (`01_ser/Sollutia`) ja no existix al repositori; la llista es conserva com a inventari:
- a11y_debugging
- chrome_devtools
- chrome_extensions
- debug_optimize_lcp
- google_antigravity_sdk
- memory_leak_debugging
- modern_web_guidance
- troubleshooting

Aquestes eines configuren un instrumental de consulta, no una autoritat.

## Vincles

- [[00_index_identitat]]
- [[01_identitat]]
- [[doc_governanca]]
- [[arquitectura_protocol_lazaro]]
- [[el_projecte]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[forja_to_core]]
- [[estandard_integracio_react]]

