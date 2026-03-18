FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Cria pasta de uploads
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
