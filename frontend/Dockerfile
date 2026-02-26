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

# Define default backend environment variables (can be overridden on docker run)
ENV BACKEND_HOST="backend"
ENV BACKEND_PORT="8000"

# Place nginx.conf in the templates directory. 
# The nginx:alpine entrypoint will automatically substitute $BACKEND_HOST and $BACKEND_PORT 
# and write the result to /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Start Nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
