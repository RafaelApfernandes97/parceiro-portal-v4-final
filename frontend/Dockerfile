# ── Stage 1: Build Angular ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx ng build --configuration production

# ── Stage 2: Serve com Nginx ──
FROM nginx:alpine

# Remove config padrão
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/parceiro-portal-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
