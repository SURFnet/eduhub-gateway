FROM node:14

COPY . /app
WORKDIR /app
RUN cp config/system.config.yml.prod config/system.config.yml

RUN npm install
CMD npm start

EXPOSE 8080
