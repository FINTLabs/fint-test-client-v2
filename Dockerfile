FROM node:20
COPY . /src
WORKDIR /src
RUN yarn && yarn build

FROM nginx:1.26.3
COPY --from=0 /src/dist/ /usr/share/nginx/html/test-client/
COPY --from=0 /src/dist/ /usr/share/nginx/html/
