# Observability stack

This tree contains a development (local) setup for logging
infrastructure that mimics the production setup.

It is intended to be run in combination with the
`../docker-compose-with-logging-and-redis.yml` file in the parent directory.

## Starting the supporting services

You can start the supporting services by running

    cd observability # this directory
    docker-compose start

You can access the UI using username: admin and password: admin at
http://localhost:9000/

## Initializing Graylog

After starting the system for the first time you need to log in and
add the expected inputs:

 - go to http://localhost:9000/system/inputs
 - select input "GELF TCP"
 - click "Launch new input"
 - enter a title, i.e. "Gelf input"
 - click "Save"

## Graylog dev setup is brittle

In development, we run the graylog system (graylog, elasticsearch,
fluentd, mongo) using docker-compose, which we shut down and
restart/rebuild regularly, as you would expect when doing development.

We also run all the services that generate logs in docker, mostly to
ensure we've got a single method for delivering logs; services log to
STDOUT / STDERR in a JSON format, one line per message, and there is a
single fluentd process running that forwards the logs to Graylog using
the GELF TCP connector.

When log messages do not show up in Graylog, which happens quite
often, it's difficult to find out why. Sometimes a full state reset
(shut down containers, remove volumes, restart) of the graylog system
works, sometimes it does not. Sometimes elasticsearch complains about
indexes not being available.

The simplest brute-force way out is to shutdown the observability
stack and removing its state (removing the associated volumes):

    docker-compose down -v  # note the -v option

## Debugging hints

If logs do not show up in graylog, heck out the logs of the
`docker-compose` process for this directory. Especially, take note of
any issues reported by `fluentd` and `graylog` - some json keys are
required and leaving them off will mean messages get dropped.

## Prometheus metrics

The prometheus interface will be available at http://localhost:9090/
and should attempt to scrape the gateway metrics.

You can query what's going on with the metrics by executing the
following query in the prometheus UI:

    {service="ooapi-gateway"}

To see the metrics from prometheus itself, do

    {service="prometheus"}
