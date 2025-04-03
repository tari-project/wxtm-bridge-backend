FROM node:18-buster

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client && apt-get clean
