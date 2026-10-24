FROM node:alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "backend/server.js"]