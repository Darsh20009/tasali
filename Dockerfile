FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN set -eu; \
    sed -i 's|http://package-firewall\.replit\.local/npm/|https://registry.npmjs.org/|g' package-lock.json 2>/dev/null || true; \
    sed -i 's|https://package-firewall\.replit\.local/npm/|https://registry.npmjs.org/|g' package-lock.json 2>/dev/null || true; \
    if ! npm ci --include=dev --registry https://registry.npmjs.org; then \
      echo "npm ci failed; recent npm diagnostics:" >&2; \
      log="$(ls -1t /root/.npm/_logs/*-debug-0.log 2>/dev/null | head -n 1 || true)"; \
      if [ -n "$log" ]; then tail -n 120 "$log"; fi; \
      exit 1; \
    fi; \
    if [ ! -x node_modules/.bin/vite ] || [ ! -x node_modules/.bin/esbuild ]; then \
      echo "npm ci did not install Vite and esbuild; recent npm diagnostics:" >&2; \
      log="$(ls -1t /root/.npm/_logs/*-debug-0.log 2>/dev/null | head -n 1 || true)"; \
      if [ -n "$log" ]; then tail -n 120 "$log"; fi; \
      exit 1; \
    fi

COPY . .

RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]
