FROM node:24 AS build

WORKDIR /src

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.27.5

COPY --from=build /src/dist/ /usr/share/nginx/html/test-client/

COPY --from=build /src/dist/ /usr/share/nginx/html/

COPY default.conf /etc/nginx/conf.d/default.conf