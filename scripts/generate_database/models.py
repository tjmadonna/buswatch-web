import re
import string
from dataclasses import dataclass
from typing import Literal


class TupleConvertible:
    def as_tuple(self):
        return tuple(getattr(self, field.name) for field in self.__dataclass_fields__.values())


replacements = {
    "ccac": "CCAC",
    "ip": "IP",
    "mckspt": "McKeesport",
    "mckeesport": "McKeesport",
    "pgh": "Pittsburgh",
    "ymca": "YMCA",
    "mercy hospital": "Mercy Hospital",
    "va": "VA",
    "amtrak": "Amtrak",
    "pitt": "Pitt",
    "carnegie": "Carnegie",
    "mellon": "Mellon",
    "mt": "Mt",
}


def replace_match(match):
    word = match.group(0)
    return replacements.get(word.lower(), word)


def smart_title(s: str) -> str:
    s = s.strip()
    s = re.sub(r"(?<! )-(?! )", " - ", s)
    s = string.capwords(s)
    s = re.sub(r"(\d+)(St|Nd|Rd|Th)\b", lambda m: m.group(1) + m.group(2).lower(), s)
    for word in replacements:
        s = re.sub(rf"\b{re.escape(word)}\b", replace_match, s, flags=re.IGNORECASE)
    return s


@dataclass(frozen=True, slots=True)
class Route(TupleConvertible):
    id: str
    name: str
    color: str
    rtpidatafeed: Literal["Light Rail", "Port Authority Bus"]

    def as_tuple(self):
        return (self.id.upper(), smart_title(self.name), self.color, self.rtpidatafeed)


@dataclass(frozen=True, slots=True)
class Stop(TupleConvertible):
    id: str
    code: str
    name: str
    latitude: float
    longitude: float

    def as_tuple(self):
        return (
            self.id,
            self.code,
            smart_title(self.name),
            self.latitude,
            self.longitude,
        )


@dataclass(frozen=True, slots=True)
class RouteStop(TupleConvertible):
    route_id: str
    stop_id: str


@dataclass(frozen=True, slots=True)
class Trip(TupleConvertible):
    id: str
    direction: Literal["Inbound", "Outbound"]
    destination: str
    name: str
    route_id: str
    shape_id: str

    def as_tuple(self):
        return (
            self.id,
            self.direction,
            self.destination,
            smart_title(self.name),
            self.route_id.upper(),
            self.shape_id,
        )


@dataclass(frozen=True, slots=True)
class Shape(TupleConvertible):
    id: str
    latitude: float
    longitude: float
    sequence: int

    def as_tuple(self):
        return (
            self.id,
            self.latitude,
            self.longitude,
            self.sequence,
        )
