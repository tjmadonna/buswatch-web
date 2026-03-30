CREATE TABLE routes (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    rtpidatafeed TEXT NOT NULL CHECK (rtpidatafeed IN ('Port Authority Bus', 'Light Rail'))
);

CREATE TABLE stops (
    id TEXT NOT NULL PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL
);
CREATE INDEX idx_stops_code ON stops (code);
CREATE INDEX idx_stops_latitude_longitude ON stops (latitude, longitude);

CREATE TABLE routes_stops (
    route_id TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    PRIMARY KEY (route_id, stop_id),
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id)
);
CREATE INDEX idx_routes_stops_route_id ON routes_stops (route_id);
CREATE INDEX idx_routes_stops_stop_id ON routes_stops (stop_id);

CREATE TABLE trips (
    id TEXT NOT NULL PRIMARY KEY,
    direction TEXT NOT NULL CHECK (direction IN ('Inbound', 'Outbound')),
    destination TEXT NOT NULL,
    name TEXT NOT NULL,
    route_id TEXT NOT NULL,
    FOREIGN KEY (route_id) REFERENCES routes(id)
);
CREATE INDEX idx_trips_route_id ON trips (route_id);
CREATE INDEX idx_trips_direction_destination_route_id ON trips (direction, destination, route_id);
