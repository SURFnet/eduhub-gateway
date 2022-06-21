FROM node:14 AS build-env
COPY . /app
WORKDIR /app
RUN cp config/system.config.yml.prod config/system.config.yml
RUN ln -sf /app/deploy-config/gateway.config.yml config/gateway.config.yml
RUN rm -rf node_modules
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs:14
COPY --from=build-env /app /app
WORKDIR /app
CMD ["server.js"]
EXPOSE 8080
