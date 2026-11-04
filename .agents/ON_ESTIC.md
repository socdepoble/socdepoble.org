---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-11-04T12:52:12.414Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 903fb2f7c

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-11-04T16:15:00+01:00 · IAIA MarIA · torn_5730b50a-1c94-4007-a60a-8ba515a77cba · Correu enviat a NLnet (`2026-08-1a6`), `/page/fediversity` en paraules de poble, cantons quadrats `.sdp-hero-video` i compte Mastodon `@depoble@mastodont.cat`

- **Acta Marmota vigent:** [261103_1724_acta_marmota_codex_gauntlet_fediversity_i_pendents_verificats](../_wiki_de_poble/10_actes/261103_1724_acta_marmota_codex_gauntlet_fediversity_i_pendents_verificats.md).
- **Informes finals del Teler i Gauntlet a l'Escriptori:**
  - MarIA (v4.2.0 · MCR + Carril MarIA `FEDI-11/12/21/24/25/26` + `IDEA-71` + Desplegament Dual): [261103_1542_auditoria_maria](../_wiki_de_poble/90_arxiu_historic/261103_1542_auditoria_maria.md)
  - Codex (Carril 2): [261103_1531_auditoria_codex](../_wiki_de_poble/90_arxiu_historic/261103_1531_auditoria_codex.md)
  - Codex (Gauntlet Fediversity `FEDI-13` a `FEDI-20`, `FEDI-22/23`): [261103_1604_auditoria_codex_gauntlet_fediversity](../_wiki_de_poble/90_arxiu_historic/261103_1604_auditoria_codex_gauntlet_fediversity.md)
  - Claude (v1.9.0 · Àrbitre Rondes 3–7 + `FEDI-22/23/26` + `sondaConnexions.js`): [261103_1624_auditoria_claude](../_wiki_de_poble/90_arxiu_historic/261103_1624_auditoria_claude.md)
- **Fites consolidades i desplegades en producció (`https://socdepoble.org` i `https://socdepoble.cat`):**
  1. **`FEDI-26` i `D-13` (Connexions Persona↔Persona i Persona↔Entitat sempre al Registre Social, Públiques per Defecte amb Interruptor d'1 Clic, i «Formar part» al Xat de l'Entitat):** Commit `903fb2f7c` pujat a `fork/backup-notes-publish`.
  2. **Cantons quadrats al vídeo protagonista (`.sdp-hero-video` en `src/css/components.css`) + `/page/fediversity` explicat «En paraules de poble» (`src/sections/text/pageContent.js`, frontissa `16/16` aprovada):** Desplegat en viu tant a `https://socdepoble.org` com a `https://socdepoble.cat`.
  3. **Correu de resposta enviat a Michiel Leenaars i a l'equip d'NLnet (`2026-08-1a6@nlnet.nl`) el 04-11-2026 a les 16:08 CET:** Captura arxivada a `261104_1615_correu_enviat_nlnet_michiel_leenaars_2026_08_1a6.jpg` (captura de 01_produccio no versionada).
  4. **Relleu estratègic per al pròxim xat fresc (després del reinici de l'ordinador del Mestre):**
     - **Compte oficial de Mastodon de Sóc de Poble (`https://mastodont.cat/@depoble` · `@depoble@mastodont.cat`):** Connectar un pont bidireccional entre Sóc de Poble i `@depoble@mastodont.cat` perquè el que es publique a Sóc de Poble es publique automàticament a Mastodon i el que es publique des de Mastodon puga entrar a Sóc de Poble.
     - **Xat (Clon de WhatsApp millorat) i Usabilitat del Panell de Control:** Prioritat número 1 per al llançament d'usuaris reals.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.

## Vincles

- [[00_index]]
