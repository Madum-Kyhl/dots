FROM node:alpine
WORKDIR /app
COPY . /app
EXPOSE 8080
CMD ["node", "server.js"]