# Stage 1: Build the app
FROM node:25-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx react-router build

# Stage 2: Run with @react-router/serve
FROM node:25-alpine

WORKDIR /app

COPY --from=builder /app/build /app/build
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package*.json /app/

EXPOSE 3000
CMD ["npx", "react-router-serve", "build/server/index.js"]