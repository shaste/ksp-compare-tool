FROM node:10.18.1-alpine3.10

WORKDIR /src
COPY . .
RUN npm install && npm run build

FROM nginx:1.17.8-alpine
COPY --from=0 /src/public /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
