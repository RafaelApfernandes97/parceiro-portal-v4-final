FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p uploads && chown -R node:node uploads
USER node
EXPOSE 3000
CMD ["node", "server.js"]
