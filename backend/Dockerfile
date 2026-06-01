FROM node:20-alpine

WORKDIR /app

# Needed for running SQL schema bootstrap from the container.
RUN apk add --no-cache postgresql-client

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 4000

CMD ["yarn", "dev"]
