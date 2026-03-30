#!/bin/sh
set -e

# download GTFS data
curl -o /tmp/gtfs.zip https://www.rideprt.org/developerresources/GTFS.zip

if [ ! -f /tmp/gtfs.zip ]; then
  echo "Failed to download GTFS data"
  exit 1
fi

# unzip GTFS data
if ! unzip -o /tmp/gtfs.zip -d /tmp/gtfs; then
  echo "Failed to unzip GTFS data"
  exit 1
fi
rm /tmp/gtfs.zip

python3 main.py \
  --db-path $DB_CONN_STR \
  --gtfs-path /tmp/gtfs \
  --true-time-base-url $TRUE_TIME_BASE_URL \
  --true-time-api-key $TRUE_TIME_API_KEY

rm -rf /tmp/gtfs
