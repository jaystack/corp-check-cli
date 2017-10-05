FROM node:latest

WORKDIR /app

ADD .npmrc /root/.npmrc

ADD package.json package.json
ADD package-lock.json package-lock.json

RUN npm install -q

ADD . .

RUN npm run build
