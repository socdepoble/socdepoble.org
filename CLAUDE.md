@.agents/QUI_SOC.md
@.agents/ON_ESTIC.md
@AGENTS.md
@.agents/skills/wiki-cicle-de-vida/SKILL.md
@.agents/skills/wiki-documentacio-i-reflex/SKILL.md
@.agents/skills/sdp-workflow/SKILL.md

REFLEX DE CORRECCIÓ
Quan el Mestre corregisca una conducta (no un bug de codi, sinó un HÀBIT):
1. ATURA la resposta. No contestes encara.
2. ESCRIU la lliçó a .agents/skills/<skill-afectada>/SKILL.md dins de la secció
   "## Lliçons del Mestre", en forma POSITIVA (què cal fer), amb data AAMMDD,
   sense citar mai la forma incorrecta.
3. AFIG una línia a .agents/LEDGER.md: "AAMMDD | correcció | <skill> | <resum 10 paraules>".
4. Només ara contesta al Mestre, començant per: "Anotat a <skill>: <lliçó>."
Si no saps quina skill toca, crea .agents/skills/skill-llicons-pendents/SKILL.md.
Si el Mestre repeteix una correcció ja anotada, és una FALLA DE CÀRREGA, no
d'aprenentatge: registra-la al LEDGER com a "recaiguda" i revisa l'ancoratge de les skills.
