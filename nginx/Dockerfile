FROM nginx:alpine

# Install necessary packages including certbot for SSL
RUN apk add --no-cache certbot certbot-nginx bash

# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf
