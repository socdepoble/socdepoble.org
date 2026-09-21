FROM node:20-alpine

# Set the working directory to the bot's directory
WORKDIR /app/bot

# Install pnpm
RUN npm install -g pnpm

# Copy only the bot's package configuration
COPY bot/package.json ./

# Install dependencies (no lockfile was provided in bot/ before, so we install directly)
RUN pnpm install

# Copy the rest of the bot application code
COPY bot/ ./

# Create directories for state (Baileys auth and cache)
RUN mkdir -p .iaia_auth var/baileys-runtime

# Start the bot
CMD ["pnpm", "run", "start"]
