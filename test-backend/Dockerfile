FROM debian:buster-slim
RUN apt-get update
RUN apt-get install --no-install-recommends --no-install-suggests -y nginx
COPY nginx.conf /etc/nginx/
COPY default /etc/nginx/sites-available/
ARG WWW_DATA_DIR=data/
COPY ${WWW_DATA_DIR:-data}/ /var/www/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
