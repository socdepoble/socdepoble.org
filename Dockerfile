# Imatge del bot de WhatsApp de la IAIA (bot/). QA-R2-07 i P-16 dels residus
# (261030): cervell.mjs importa ../tooling, així que la imatge reproduïx dins de
# /app l'arbre del repositori que carrega el bot (/app/bot i els mòduls de
# /app/tooling). El graf de mòduls, els secrets exclosos, el Node i l'usuari els
# fixa tests/empaquetat-bot.test.mjs. Node exacte dins dels engines del
# package.json de l'arrel, el mateix que la CI.
# La Wiki no entra a la imatge: es munta només de lectura (docker-compose.yml).
# La persona (bot/persona/IAIA_MARIA.md) és del Mestre: entra amb bot/ si existix.
FROM node:22.20.0-alpine

ENV NODE_ENV=production IAIA_PROJECT_ROOT=/app

WORKDIR /app/bot

# Dependències del bot. bot/ encara no té fitxer de bloqueig: fins que n'hi
# haja un, esta instal·lació no és reproduïble.
COPY bot/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Els mòduls de tooling/ que importa el cervell: edge_rag, rag-index-wire,
# frontmatter, publication-policy, retrieval-sources i lib/arrel.mjs.
COPY tooling/lib/ /app/tooling/lib/
COPY tooling/wiki/core/ /app/tooling/wiki/core/
COPY tooling/wiki/lib/ /app/tooling/wiki/lib/

# L'índex públic que escriu el productor (npm run rag:build): RUTES.indexRag.
COPY public/rag-index.json /app/public/rag-index.json

# El codi del bot. El .dockerignore en deixa fora .env, .iaia_auth i var/.
COPY bot/ ./

# Estat mutable (sessió de Baileys, runtime i memòries) de l'usuari sense
# privilegis. Els volums que s'hi munten han de ser escrivibles per l'uid 1000.
RUN mkdir -p .iaia_auth var/baileys-runtime var/memoria \
 && chown -R node:node .iaia_auth var

USER node

# node directament, sense npm ni pnpm pel mig: rep el SIGTERM de docker stop.
CMD ["node", "index.mjs"]
