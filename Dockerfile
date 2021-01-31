# user latest alpine linux
FROM alpine:latest as base
# add node and npm
RUN apk update
RUN apk add --no-cache git nodejs npm make gcc g++ python2 && ln -sf python2 /usr/bin/python

# set env variable so environment knows it is in docker
ENV IN_DOCKER true
# Create app directory and set it as the workdir
# RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json ./
RUN git clone https://github.com/Vault74/Vault74-Contracts.git src/contracts
RUN npm install && \
    npm rebuild bcrypt --build-from-source && \
    apk del make gcc g++
RUN npm i -g truffle
RUN cd src/contracts && truffle build && cd ../..

# FROM base AS prod
# RUN echo "this is the stage that sets VAR=TRUE"

# FROM base AS dev_local
# RUN echo "this is the stage that sets VAR=TRUE"

# FROM base AS dev_remote
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080 8081 443

CMD [ "npm", "run", "dev"]