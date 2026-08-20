FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
ENV DATA_DIR=/var/lib/rootcause-bitcoin-defense

COPY --chown=node:node . .
RUN mkdir -p /var/lib/rootcause-bitcoin-defense \
  && chown -R node:node /var/lib/rootcause-bitcoin-defense

USER node
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
