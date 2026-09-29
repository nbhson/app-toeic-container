FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY src ./src
# Runtime data (keys, stats, question bank) must survive rebuilds:
# mount a volume at /app/data (see docker-compose.yml).
RUN mkdir -p /app/data && chown -R node:node /app
# Run as non-root for least privilege.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
