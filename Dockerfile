FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies from lockfile for deterministic builds.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build the web bundle.
COPY . .
RUN yarn build

FROM nginx:1.27-alpine AS runtime

# Serve the static CRA build via Nginx.
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]