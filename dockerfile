FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
COPY . .

# Run tests
RUN npm test

EXPOSE 3000

CMD [ "npm", "start" ]
