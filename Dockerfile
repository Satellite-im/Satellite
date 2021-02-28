# user latest alpine linux
FROM alpine:latest as base
# add node and npm
RUN apk update
RUN apk add --no-cache git nodejs npm make gcc g++ python2 && ln -sf python2 /usr/bin/python

# Create a group and user
RUN addgroup -S node && adduser -S node -G node

# Switch over to use node user
USER node

# Create node specific files and access rights
RUN mkdir /home/node/.npm-global ; \
    mkdir -p /home/node/app ; \
    chown -R node:node /home/node/app ; \
    chown -R node:node /home/node/.npm-global
ENV PATH=/home/node/.npm-global/bin:$PATH
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global

# set env variable so environment knows it is in docker
ENV IN_DOCKER true
# Create app directory and set it as the workdir
# RUN mkdir -p /home/node/app
WORKDIR /home/node/app

# Install app dependencies
COPY package.json ./
RUN git clone https://github.com/Vault74/Vault74-Contracts.git src/contracts
RUN npm i -g truffle && \
    npm install && \
    npm rebuild bcrypt --build-from-source

# Switch to root user
USER root
# Delete non needed buildtools
RUN apk del make gcc g++
# Switch to node user
USER node

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
