FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package configuration
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY bot ./bot

# Create directories for state (Baileys auth and cache)
RUN mkdir -p .iaia_auth var/baileys-runtime

# Start the bot
CMD ["pnpm", "run", "start"]
