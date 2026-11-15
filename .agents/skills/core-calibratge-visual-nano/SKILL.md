---
type: skill
name: core-calibratge-visual-nano
prioritat: 2
description: Protocol d'enginyeria de prompts visuals del Nano, calibratge d'estils i creació de gags gamberros (Ibáñez/Berlanga) contraposats a la falsa felicitat asèptica.
status: actiu
tags:
  - identitat
  - disseny
  - nano
  - tractors
triggers_on:
  - crear imatge nano
  - calibrar imatges
  - gag visual
  - estil comic
  - estil cyberpunk
  - humor gamberro
version: 2.0.0
contracte.llig:
  - _wiki_de_poble/02_saber/identitat_visual.md
  - .agents/skills/core-identitat-visual/SKILL.md
  - public/assets/ui/plugins/disseny_vinyeta.jpg
  - public/assets/nano_cards/snippet_nano_card.jpg
contracte.escriu:
  - _wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md
---

# Calibratge visual i enginyeria de prompts del Nano

Esta skill defineix el procediment obligatori perquè les IAs generen il·lustracions consistents, divertides i fidels a l'univers gràfic de Sóc de Poble. S'aplica abans d'invocar qualsevol motor d'imatge del client, com el subagent `image-generator` o les eines del Nano. L'objectiu és mantindre sempre el mateix dibuixant, el mateix poble i el mateix humor costumista.

## 1. Ancoratge multi-imatge amb el cànon de les nou mestres

Esta secció fixa el bloqueig d'estil amb imatges de referència perquè cap vinyeta nova parega d'un altre poble o d'un altre estudi d'animació.

### 1.1 Procediment obligatori d'ancoratge visual

1. Prohibix la generació cega només des de text en el Registre A: invocar el motor sense referències visuals trenca el traç i deriva cap al clip-art anglosaxó.
2. Selecciona entre tres i quatre imatges mestres de la subsecció 1.2 que compartisquen composició amb l'escena sol·licitada (carrer coral, aparell mecànic o primer pla).
3. Passa les rutes absolutes d'estes imatges com a referències (`ImagePaths`) al subagent `image-generator` juntament amb el prompt descriptiu.
4. Exigix al prompt conservar exactament el mateix gruix de plumilla negra, trames manuals (`crosshatching`), paleta d'aquarel·la càlida i fisonomia del cànon adjunt.
5. Verifica sobre la imatge generada les sis invariants de la secció 2 abans d'entregar-la al Mestre; si pareix un altre dibuixant, descarta-la i regenera-la.

### 1.2 Els nou arxius mestres del cànon en alta resolució

- `public/assets/ui/plugins/disseny_vinyeta.jpg`: mur web de pedra seca en construcció estil *13, Rue del Percebe*, arquitecte amb llacet, obrers cisellant pestanyes i iaia amb carretó al sol.
- `public/assets/nano_cards/snippet_nano_card.jpg`: màquina gegant *TISORES RELLAMP* de fusta i ferro tallant el diari davant l'alqueria, amb gallines volant, ruc i tarongers.
- `public/assets/nano_cards/vehicle_nano_card.jpg`: *SEAT 600* taronja carregat fins al sostre per un camí de terra entre marges de pedra seca, oliveres i la iaia dalt amb un gall.
- `public/assets/nano_cards/govern_certificacio_nano_card.jpg`: el Mestre amb boina i faixa roja segellant papers al carrer assolellat davant dos robotets quadrats de xapa amb bombeta al cap.
- `public/assets/ui/plugins/cervell_vinyeta.jpg`: cervell metàl·lic gegant reblonat sobre erugues de tractor dalt d'un cadafal a la plaça del poble, amb llauradors debatent i una cabra.
- `public/assets/nano_cards/calendari_nano_card.jpg`: *CALENDARI AGRÍCOLA GEGANT* de fusta clavat a la façana exterior, amb llaurador en faixa i espardenyes agafant-se el cap mentre li vola la boina.
- `public/assets/ui/plugins/bascula_vinyeta.jpg`: pati assolellat de la cooperativa amb bàscula mecànica de `487 kg`, llauradors amb pantalons apedaçats rient i iaia anotant a la llibreta.
- `public/assets/nano_cards/metriques_nano_card.jpg`: panell de fusta amb manòmetres rurals clavat entre tarongers i oliveres, bicicleta vella i dos uelos amb boina i faixa gratant-se el cap.
- `public/assets/nano_cards/drets_autor_comic.jpg`: iaia brugueriana amb monyo, nas de patata i cullera de fusta defensant la cassola d'arròs al carrer davant un inspector amb gavardina.

## 2. Les sis invariants morfològiques del còmic de poble

Tota vinyeta del Registre A ha de complir simultàniament estes sis condicions observables sobre el llenç retornat.

- **Escenari exterior mediterrani assolellat:** totes les escenes passen a l'aire lliure, a ple sol, entre places empedrades, façanes d'ocre i pedra seca, teulades àrabs, tarongers i oliveres. Prohibides les habitacions fosques o tancades; taules i panells es trauen sempre al carrer o al bancal.
- **Anatomia brugueriana i vestimenta valenciana:** proporció rabassuda (`1:3.5`), nassos redons de patata, ulls ovals expressius i zero realisme anatòmic. Indumentària rural autèntica: boina negra, faixa roja o negra, camisa arremangada, jupetí, pantalons apedaçats, espardenyes de veta i mocador o monyo amb davantal; prohibits petos texans americans i pentinats anime.
- **Acció cinètica teatral i psicologia viva:** cada personatge executa una acció física clara (cisellar, segellar, córrer, assenyalar, gratar-se el cap o volar-li la boina). Prohibida la posa estàtica frontal de foto escolar, el somriure dental d'anunci en primer pla i qualsevol caricatura lletja o desdentada.
- **Enginyeria de fusta, ferro colat i robotets de bombeta:** artefactes monumentals de fusta, ferro rovellat, cordes i manòmetres estil Professor Bacteri, o xicotets aprenents quadrats de xapa reblonada amb bombeta incandescent al cap. Prohibits els robots humanoides de llanda dels anys cinquanta i les icones flotants.
- **Traç de plumilla negra, trames i aquarel·la a sang:** línia de tinta negra amb gruix orgànic, trames manuals (`crosshatching`) i color càlid d'aquarel·la i gouache sota cel blau net. Composició *full bleed* sense marcs blancs exteriors, acció centrada, zero banderes i exportació quadrada a `1600x1600 px`.
- **Rètols físics integrats i valencià impecable:** per defecte s'aplica zero text si l'encàrrec no en demana. Quan el gag requerix un rètol, es pinta sobre fusta o xapa amb una a tres paraules en valencià normatiu impecable (com `TISORES RELLAMP` o `DESTIL·LADOR DE CARAJILLO`), sense bafarades invasives.

## 3. Selecció de registre i control d'anti-exemples

Esta secció delimita els tres registres gràfics del projecte i documenta els patrons descartats pel Mestre.

### 3.1 Els tres registres visuals del sistema

- **Registre A (Còmic gamberro Bruguera i Berlanga):** vinyetes de plugins, targetes de la Consola, campanyes del Mur i explicacions didàctiques; seguix obligatòriament les seccions 1 i 2.
- **Registre B (Cyberpunk rural de pedra seca):** maquinària conceptual d'alt contrast on conviuen silici, vàlvules, coure i marges de pedra seca de la muntanya alacantina.
- **Registre C (Fotografia panoràmica realista):** portades institucionals i paisatges nítids amb llum daurada mediterrània, bancals d'oliveres i pobles de muntanya.

### 3.2 Anti-exemple descartat per deriva d'estil

- **Evidència arxivada:** la captura `_wiki_de_poble/04_escriptori/01_produccio/261113_captura_mestre/261113_2134_antiexemple_rebutjat_la_veu_nano_v3.jpg` i l'històric de *La caldera de descàrregues* mostren què passa quan es genera sense ancoratge visual.
- **Motius de rebuig:** interior fosc tipus soterrani, roba moderna anglosaxona (peto texà i cabell anime), quatre figures estàtiques mirant a càmera, robots de llanda americans, icones clip-art flotants i somriures beatífics de fullet religiós.

## 4. Calibratge amb el Mestre i govern d'actius

Seguix estos passos després de cada generació per conservar la traçabilitat i l'aprenentatge del sistema.

1. Entrega la proposta visual segons el registre del brief i indica quines imatges mestres has passat en `ImagePaths`.
2. Si el Mestre assenyala una desviació d'estil, incorpora la regla concreta en esta skill i en `[[03_llibre_mestre_tasques_i_idees]]` abans de repetir la tirada.
3. Guarda les proves al directori d'investigació o d'escriptori autoritzat; no sobreescrigues cap recurs de `public/` fora del carril d'integració vigent.
4. Registra la validació d'humor, traç i fidelitat al cànon com a revisió visual humana, mai com un verd mecànic de porta.

## Lliçons del Mestre

- **261030** | **El punt gamberro d'Ibáñez contra el món feliç**: Prohibides les màquines polides i els traços suaus de conte infantil. Cal plumilla brugueriana amb `crosshatching`, asimetria caòtica d'inventor rural, animals enredant entre cables i rostres de dibuix animat amables, sense deformacions lletges ni mellades.
- **261105** | **Zero dentadures d'anunci i resolució `1600x1600 px`**: Cap personatge en primer pla ha de mostrar fileres de dents blanques d'anunci; cada figura expressa la seua psicologia socarrona amb gest propi. Les vinyetes quadrades s'exporten a `1600x1600 px`.
- **261113** | **Cànon de les nou mestres i bloqueig d'estil multi-imatge**: Generar només des de text canvia de poble i de pel·lícula de dibuixos. Tota vinyeta nova s'ancora passant tres o quatre imatges mestres de `public/` en `ImagePaths`, sempre a ple sol exterior, amb vestimenta valenciana tradicional i acció cinètica.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-identitat-visual/SKILL]]
- [[03_llibre_mestre_tasques_i_idees]]
