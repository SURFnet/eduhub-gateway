# Run this script from repo root.  Pass it --max-old-space-size=50 to
# constrain memory and trigger out of memories errors.

docker-compose -f dev/docker-compose-leaktest.yml up -d
cat <<EOF

Run the following command:

  ab -n 5000 -A fred:96557fbdbcf0ac9d83876f17165c0f16 http://localhost:8080/courses

EOF
exec node "$@" dev/server-leaktest.js > leaktest.log
