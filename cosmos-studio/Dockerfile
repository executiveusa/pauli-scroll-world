# COSMOS Studio — API + pipeline runtime
FROM node:20-alpine

# ffmpeg is a hard dependency of stage 03 (frame extraction / seam lock) and
# stage 04 (assembly).
RUN apk add --no-cache ffmpeg bash

WORKDIR /app

COPY server/package.json server/
RUN cd server && npm install --omit=dev

COPY . .

ENV NODE_ENV=production PORT=3000
EXPOSE 3000

# Secrets come from the environment (compose env_file / Infisical) — never baked in.
CMD ["node", "server/index.js"]
