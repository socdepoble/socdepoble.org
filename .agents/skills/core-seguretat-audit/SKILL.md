---
name: core-seguretat-audit
type: skill
status: actiu
description: Protocol integral de ciberseguretat i auditoria de vulnerabilitats per a tota la Colmena (Claude Code, MarIA, Codex i Gemini), inspirat en Claude Security (threat modeling, SAST, verificació independent de pegats i informes SARIF).
triggers_on:
  - seguretat
  - claude-security
  - vulnerabilitats
  - threat model
  - threat modeling
  - sast
  - sarif
  - auditoria seguretat
  - cwe
contracte.llig:
  - AGENTS.md
  - _wiki_de_poble/00_index.md
  - _wiki_de_poble/04_escriptori/
contracte.escriu:
  - _wiki_de_poble/04_escriptori/
  - _wiki_de_poble/10_actes/
---

# Protocol Canònic de Ciberseguretat i Auditories (Claude Security & Colmena)

Aquest procediment estableix l'estàndard de seguretat ofensiva i defensiva per a tot el repositori de **Sóc de Poble**. Garanteix que cap línia de codi, migració de Supabase o paquet per a les botigues d'aplicacions (App Store i Google Play) continga vulnerabilitats que puguen comprometre la privacitat dels veïns, la sobirania de les dades o la continuïtat del servei.

Inspirat directament en el model d'enginyeria de **Claude Security** (Anthropic), aquest protocol és d'obligat compliment per a **totes** les entitats del sistema: **Claude Code** (via el seu plugin natiu), **IAIA MarIA**, **GPT Codex** i **Gemini 4 Argon**.

---

## 1. Els Tres Principis Inviolables de la Seguretat Rural

1. **Zero Confiança en el Client (Frontend no atorga poder):** Qualsevol verificació de rol (Veí, Editor de Poble, Superadministrador) ha d'estar validada al servidor (Supabase RLS, JWT, claim segur o sessió de l'amfitrió). La interfície només reflecteix permisos; mai els concedeix.
2. **Privacitat per Defecte (Trellat del Poble):** Les dades personals dels veïns (telèfons, correus, ubicacions exactes) són sagrades. Tot perfil nou o dada de contacte naix privada per defecte llevat d'expressa decisió de l'usuari.
3. **Pegats Verificats per Tercers (Regla del Doble Parell):** Cap correcció de seguretat s'aplica automàticament. Un agent genera el diagnòstic i el pegat (`.patch`), un segon agent independent valida amb la suite de proves que el pegat resol el forat sense trencar res, i el Mestre (humà) o l'orquestradora l'aplica amb `git apply`.

---

## 2. Les 4 Capes de Defensa en Profunditat

| Capa | Eina / Actor | Àmbit d'Acció | Freqüència |
| :--- | :--- | :--- | :--- |
| **Capa 1: En sessió** | Linter + Seguretat preventiva | Prevenció d'injeccions, XSS i fugues de claus en escriure codi | A cada torn de desenvolupament |
| **Capa 2: Auditoria estàtica** | MarIA / Codex / Gemini | Revisió de polítiques RLS a Supabase, permisos d'Storage i crides RPC | Abans de cada migració de base de dades |
| **Capa 3: Deep Scan Natiu** | Plugin `claude-security` (Claude Code) | Mapatge multi-agent, model d'amenaces complet i exportació SARIF | Abans de tancar branques o releases |
| **Capa 4: Auditoria creuada** | Gauntlet Loop Colmena | Contrast adversarial entre Claude, Codex i Gemini | Abans de cada enviament a App Store / Google Play / Producció |

---

## 3. Instal·lació i Ús de Claude Security a Claude Code

Per a l'agent de consola **Claude Code**, el procediment oficial s'executa a través del seu mercat oficial de plugins:

### Instal·lació:
```text
/plugin install claude-security@claude-plugins-official
```

### Execució d'un escaneig complet o focalitzat:
- Escaneig interactiu: `/claude-security` (triar **Scan codebase**).
- Escaneig ràpid de la branca actual: `/claude-security scan my branch`.
- Escaneig d'un commit concret: `scan commit <hash>`.

### Generació de pegats:
- Des del menú: `/claude-security` -> **Suggest patches**.
- Per llenguatge natural: `fix finding F1`.
- Els pegats es desen a `CLAUDE-SECURITY-<timestamp>/patches/F1.patch` i **s'apliquen manualment** amb:
```bash
git apply CLAUDE-SECURITY-<timestamp>/patches/F1.patch
```

---

## 4. Format dels Lliurables de Seguretat (Estàndard Colmena)

Tota sessió d'auditoria de seguretat (execute Claude Code el seu plugin o l'execute Codex/Gemini/MarIA manualment) ha de dipositar els resultats a l'Escriptori o a la carpeta canònica de seguretat amb la següent taxonomia:

1. **`CLAUDE-SECURITY-RESULTS.md` / `aammdd_hhmm_auditoria_seguretat.md`:**  
   Informe estructurat en Markdown que detalla cada vulnerabilitat trobada (`F1`, `F2`, ...):
   - **ID de la troballa:** Codi únic (ex. `F1`).
   - **Tipologia CWE:** Categoria segons el catàleg MITRE CWE (ex. `CWE-284: Improper Access Control`).
   - **Severitat:** Crítica, Alta, Mitjana o Baixa.
   - **Escenari d'explotació:** Explicació concisa de com un atacant podria aprofitar-la.
   - **Recomanació i pegat proposat:** Fitxer i línia exacta afectada amb el fragment de codi segur.
2. **`CLAUDE-SECURITY-RESULTS.sarif` (opcional si es requereix integració CI/GitHub):**  
   Format estàndard JSON SARIF 2.1.0 per a ingesta automatitzada en panells de control de seguretat.
3. **`patches/F<n>.patch`:**  
   Fitxer diff estàndard de Git llest per a ser revisat i aplicat amb `git apply`.

---

## 5. Llista de Comprovació de Seguretat Específica de Sóc de Poble

Abans de donar el vistiplau a qualsevol paquet mòbil o release de WordPress:

- [ ] **Cap clau mestra (Service Role) al frontend:** Només es permet `SUPABASE_ANON_KEY`. La clau `service_role` mai ha d'aparéixer a `src/` ni a bundles públics.
- [ ] **Polítiques RLS actives a totes les taules:** Cap taula pública de Supabase pot tindre `Row Level Security` desactivat (`DISABLE ROW LEVEL SECURITY` és motiu de parada immediata).
- [ ] **Validació d'extensió i mida d'arxius (Storage):** Les imatges i vídeos no poden superar els límits establerts (màxim 10 MB per defecte) i només s'admeten tipus MIME segurs (`image/webp`, `image/jpeg`, `image/png`, `video/mp4`).
- [ ] **Privacitat de Perfils:** El nom i cognoms només s'exposen públicament si l'usuari ha marcat explícitament la casella de perfil públic.
- [ ] **Frontissa Sollutia:** Tota petició a l'amfitrió és estrictament de lectura (GET) i no s'executa cap codi arbitrari procedent de respostes HTML/JSON no sanejades.

---

## Vincles
- [[core-gauntlet-loop/SKILL]]
- [[core-edicio-segura/SKILL]]
- [[.agents/index]]
