FROM node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client && apt-get clean
