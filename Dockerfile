FROM node:14 AS build-env
COPY . /app
WORKDIR /app
RUN cp config/system.config.yml.prod config/system.config.yml
RUN rm -rf node_modules
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs:14
COPY --from=build-env /app /app
WORKDIR /app
CMD ["server.js"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=2s --start-period=5s --retries=2 CMD ["/nodejs/bin/node", "healthcheck.js", "||", "exit", "1"]