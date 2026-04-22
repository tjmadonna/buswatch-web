import argparse
import csv
import dataclasses
import json
import os
import time
import traceback
import urllib.parse
import urllib.request

import database
import models


@dataclasses.dataclass(frozen=True, slots=True)
class Config:
    DB_CONN_STR: str
    GTFS_PATH: str
    TRUE_TIME_API_KEY: str
    TRUE_TIME_BASE_URL: str


def get_config() -> Config:
    """Loads configuration from config.ini file.

    Returns:
        Config: A Config object containing configuration settings.
    """
    parser = argparse.ArgumentParser(description="Buswatch Configuration")
    parser.add_argument(
        "--db-path",
        type=str,
        required=True,
        help="Path to the database file.",
    )
    parser.add_argument(
        "--gtfs-path",
        type=str,
        required=True,
        help="Path to the directory containing GTFS data files.",
    )
    parser.add_argument(
        "--true-time-base-url",
        type=str,
        required=True,
        help="Base URL for the TrueTime API.",
    )
    parser.add_argument(
        "--true-time-api-key",
        type=str,
        required=True,
        help="API key for accessing the TrueTime API.",
    )
    args = parser.parse_args()

    config = Config(
        DB_CONN_STR=args.db_path,
        GTFS_PATH=args.gtfs_path,
        TRUE_TIME_BASE_URL=args.true_time_base_url,
        TRUE_TIME_API_KEY=args.true_time_api_key,
    )
    if any(value is None for value in dataclasses.asdict(config).values()):
        missing_keys = [key for key, value in dataclasses.asdict(config).items() if value is None]
        raise ValueError(f"Missing configuration values: {', '.join(missing_keys)}")

    return config


def get_routes(config: Config) -> list[models.Route]:
    """Fetches bus and light rail routes from the Port Authority's TrueTime API.

    Args:
        config (Config): Configuration object containing API base URL and key.

    Returns:
        list[models.Route]: A list of Route objects containing route details.
    """
    routes = []
    base_url = f"{config.TRUE_TIME_BASE_URL}/getroutes"
    feeds = ["Port Authority Bus", "Light Rail"]
    for idx, feed in enumerate(feeds):
        query = urllib.parse.urlencode(
            {
                "key": config.TRUE_TIME_API_KEY,
                "format": "json",
                "rtpidatafeed": feed,
            }
        )

        url = f"{base_url}?{query}"
        print(f"Fetching routes from {url}")
        req = urllib.request.Request(url)
        req.add_header(
            "User-Agent",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.10 Safari/605.1.1",
        )
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch routes: {response.status} {response.reason}")
            data = response.read()

        parsed_json = json.loads(data.decode("utf-8"))
        parsed_routes = parsed_json.get("bustime-response", {}).get("routes", [])
        routes.extend(
            [
                models.Route(
                    id=r["rt"],
                    name=r["rtnm"],
                    color=r["rtclr"],
                    rtpidatafeed=r["rtpidatafeed"],
                )
                for r in parsed_routes
            ]
        )
        if idx < len(feeds) - 1:
            time.sleep(5)

    return routes


def get_stops(config: Config) -> list[models.Stop]:
    """Fetches bus stops from the Port Authority's GTFS data.

    Args:
        config (Config): Configuration object containing GTFS path.

    Returns:
        list[models.Stop]: A list of Stop objects containing stop details.
    """
    filename = os.path.join(config.GTFS_PATH, "stops.txt")
    with open(filename, "r") as f:
        reader = csv.DictReader(f)
        return [
            models.Stop(
                id=row["stop_id"],
                code=row["stop_code"],
                name=row["stop_name"],
                latitude=float(row["stop_lat"]),
                longitude=float(row["stop_lon"]),
            )
            for row in reader
        ]


def get_trips(routes: set[str], config: Config) -> list[models.Trip]:
    """Fetches trips and their associated stop times from the Port Authority's GTFS data.

    Args:
        routes (set[str]): A set of route IDs to filter trips.
        config (Config): Configuration object containing GTFS path.

    Returns:
        tuple[list[models.Trip], list[models.StopTrip]]: A tuple containing a list of Trip objects
            and a list of StopTrip objects.
    """
    filename = os.path.join(config.GTFS_PATH, "stop_times.txt")
    with open(filename, "r") as f:
        reader = csv.DictReader(f)
        trip_names = {row["trip_id"]: row["stop_headsign"] for row in reader}

    filename = os.path.join(config.GTFS_PATH, "trips.txt")
    with open(filename, "r") as f:
        reader = csv.DictReader(f)
        trips = [
            models.Trip(
                id=row["trip_id"],
                direction=("Inbound" if row["trip_headsign"].startswith("INBOUND") else "Outbound"),
                destination=row["trip_headsign"]
                .removeprefix("INBOUND-")
                .removeprefix("OUTBOUND-")
                .title(),
                name=trip_names[row["trip_id"]],
                route_id=row["route_id"],
                shape_id=row["shape_id"],
            )
            for row in reader
            if row["route_id"] in routes
        ]

    return trips


def get_shapes(config: Config) -> list[models.Shape]:
    filename = os.path.join(config.GTFS_PATH, "shapes.txt")
    with open(filename, "r") as f:
        reader = csv.DictReader(f)
        return [
            models.Shape(
                id=row["shape_id"],
                latitude=float(row["shape_pt_lat"]),
                longitude=float(row["shape_pt_lon"]),
                sequence=int(row["shape_pt_sequence"]),
            )
            for row in reader
        ]


def get_route_stops(trips: list[models.Trip], config: Config) -> list[models.RouteStop]:
    trip_route_map = {trip.id: trip.route_id for trip in trips}
    filename = os.path.join(config.GTFS_PATH, "stop_times.txt")
    stop_routes = {}
    with open(filename, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["trip_id"] not in trip_route_map:
                continue
            if row["stop_id"] not in stop_routes:
                stop_routes[row["stop_id"]] = set()
            stop_routes[row["stop_id"]].add(trip_route_map[row["trip_id"]])

    route_stops = []
    for stop_id, route_ids in stop_routes.items():
        for route_id in route_ids:
            route_stops.append(models.RouteStop(route_id=route_id, stop_id=stop_id))

    return route_stops


def main():
    config = get_config()

    conn = None
    cursor = None
    try:
        conn = database.get_connection(config.DB_CONN_STR)

        routes = get_routes(config)
        stops = get_stops(config)
        trips = get_trips({route.id for route in routes}, config)
        route_stops = get_route_stops(trips, config)

        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        cursor.executemany(
            "INSERT INTO routes (id, name, color, rtpidatafeed) VALUES (?, ?, ?, ?);",
            (route.as_tuple() for route in routes),
        )
        cursor.executemany(
            "INSERT INTO stops (id, code, name, latitude, longitude) VALUES (?, ?, ?, ?, ?);",
            (stop.as_tuple() for stop in stops),
        )
        cursor.executemany(
            (
                "INSERT INTO trips (id, direction, destination, name, route_id, shape_id) "
                "VALUES (?, ?, ?, ?, ?, ?);"
            ),
            (trip.as_tuple() for trip in trips),
        )
        cursor.executemany(
            "INSERT INTO routes_stops (route_id, stop_id) VALUES (?, ?);",
            (route_stop.as_tuple() for route_stop in route_stops),
        )
        cursor.executemany(
            "INSERT INTO shapes (id, latitude, longitude, sequence) VALUES (?, ?, ?, ?);",
            (shape.as_tuple() for shape in get_shapes(config)),
        )
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
