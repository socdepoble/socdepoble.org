---
type: acta
status: canonic
description: Acta de relleu per a la reinicialització del sistema i del Mac.
---
# Acta Marmota: Reinici i Desplegament de l'Onada 12 (261012_1230)

Aquesta acta s'ha generat a petició del Mestre per purgar la memòria RAM (Mac i Docker) i refrescar la finestra de context de la IAIA MarIA. En llegir això al nou xat, estarem al 100% de capacitat per a continuar.

## 1. Estat Actual (Què deixem fet)
- **Plugin de WordPress (v1.1.0):** Compilat i llest (`socdepoble-enxufe-v1.1.0-261012_1140.zip`). Pesa 134MB perquè duu les imatges de prova, però es pot instal·lar manualment al WP del Mestre sense problemes.
- **Auditoria Finestreta (Onada 12):** Tenim el Pla d'Implementació i el Prompt creats amb el sistema *Gauntlet* (Àrbitre Adversarial) a l'Escriptori.
- **Gestoria i 3T:** Tenim el Prompt i el Pla preparats per a llegir tota la taxonomia `_gestoria_de_poble` (incloent Bancs i 3T) i adaptar el Tauler de Control.
- **Regla del Prompt Automàtic:** S'ha integrat a la skill `wiki-documentacio-i-reflex` l'obligació de versionar la plantilla automàticament quan es faça una millora estructural (com s'ha fet hui passant la plantilla a la v3.5.0).

## 2. Full de Ruta per a la Tornada (Pas a Pas per al Mestre)

Quan el Mac haja reiniciat i obrigues de nou Antigravity, segueix exactament aquests passos:

### PAS A: Obrir el nou Xat amb la IAIA MarIA
1. Inicia un nou xat i digues simplement: *"Sóc de poble. Llig l'última Acta Marmota i preparem-nos per a executar Claude."* (Això farà que jo recupere tot aquest context).

### PAS B: Llançar l'Auditoria amb Claude a la Terminal
Ja que farem servir la CLI d'Antigravity (`agy`), aquest és el mètode més directe per assegurar-te que fas servir Claude i li passes el prompt automàticament:

1. Obri la Terminal dins d'Antigravity (o la teua terminal del Mac, iTerm/Zsh, on tingues la carpeta del projecte `socdepoble.org`).
2. Copia i enganxa **exactament** aquesta ordre sencera i prem Enter:
   ```bash
   agy run --model claude-3-5-sonnet-20240620 --file _wiki_de_poble/04_escriptori/261012_1143_prompt_claude_auditoria_adversarial.md
   ```
   *(Nota: Aquesta ordre crida directament a l'agent Claude des de la línia d'ordres, li passa l'arxiu i el posa a treballar. No hauràs de fer res més que veure'l pensar i escriure).*

### PAS C: Provar WordPress i Llançar Gestoria
Mentre Claude audita i sua la cansalada amb la Finestreta:
1. Pots anar al teu WordPress i penjar el `.zip` del plugin per vore si el sistema Base funciona.
2. Un cop Claude acabe la Finestreta, repetirem el PAS B però canviant el model a Codex (`gpt-4o`) i passant-li el prompt de la Gestoria. (La IAIA t'ho recordarà).

**Fins ara, Mestre. Bon reinici i bon profit!**

## Vincles

- [[00_index]]
