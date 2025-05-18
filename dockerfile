FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

#RUN yarn build uncomment for production

CMD ["yarn", "dev"] 
# Or "yarn start" if you built for production