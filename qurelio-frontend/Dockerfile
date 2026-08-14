# Production Dockerfile for Qurelio React Frontend

# Stage 1: Build React SPA
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve Built Assets with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ../deployment/nginx/qurelio.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
