FROM debian:buster-slim
RUN apt-get update
RUN apt-get install --no-install-recommends --no-install-suggests -y nginx
COPY nginx.conf /etc/nginx/
COPY default /etc/nginx/sites-available/
COPY data/ /var/www/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
