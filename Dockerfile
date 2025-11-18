# Stage 1: Build the app
FROM node:25-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

ENV PORT=8000
EXPOSE 8000
CMD ["npm", "start"]