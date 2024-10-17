FROM node:23 AS build-env
COPY . /app
WORKDIR /app
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs:18
COPY --from=build-env /app /app
WORKDIR /app
CMD ["server.js"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=2s --start-period=5s --retries=2 CMD ["/nodejs/bin/node", "healthcheck.js", "||", "exit", "1"]
