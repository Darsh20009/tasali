FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --registry https://registry.npmjs.org

COPY . .

RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["npm", "start"]
