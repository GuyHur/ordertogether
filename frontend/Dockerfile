# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency definition files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the source code and build
COPY . .
RUN npm run build

# Server Stage
FROM nginx:alpine

# Remove default nginx contents
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts to nginx folder
COPY --from=build /app/dist /usr/share/nginx/html

# Replace the default Nginx config to support frontend routing and reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Start Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
