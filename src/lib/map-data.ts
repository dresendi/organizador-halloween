import type { MapBlock } from "./types";

const odd = (start: number, end: number) => {
  const houses = [];
  for (let n = start; n >= end; n -= 2) houses.push({ number: n, side: "top" as const });
  return houses;
};

const even = (start: number, end: number) => {
  const houses = [];
  for (let n = start; n >= end; n -= 2) houses.push({ number: n, side: "bottom" as const });
  return houses;
};

export const mapBlocks: MapBlock[] = [
  { id: "82-80a", label: "Calle 82 a 80A", top: odd(817, 803), bottom: even(816, 802) },
  { id: "80a-80", label: "Calle 80A a 80", top: odd(801, 787), bottom: even(800, 786) },
  { id: "80-78a", label: "Calle 80 a 78A", top: odd(785, 771), bottom: even(784, 770) },
  { id: "78a-78", label: "Calle 78A a 78", top: odd(769, 755), bottom: even(768, 754) },
  { id: "78-76a", label: "Calle 78 a 76A", top: odd(753, 739), bottom: even(752, 738) },
  { id: "59-82-80a", label: "Calle 59", top: odd(817, 803), bottom: even(816, 802) },
  { id: "59-80a-80", label: "Calle 59", top: odd(801, 787), bottom: even(800, 786) },
  { id: "59-80-78a", label: "Calle 59", top: odd(785, 771), bottom: even(784, 770) },
  { id: "59-78a-78", label: "Calle 59", top: odd(769, 755), bottom: even(768, 754) },
  { id: "59-78-76a", label: "Calle 59", top: odd(753, 739), bottom: even(752, 738) }
];

export const allHouseNumbers = Array.from(
  new Set(mapBlocks.flatMap((block) => [...block.top, ...block.bottom].map((house) => house.number)))
).sort((a, b) => b - a);

export type HouseLocation = {
  locationId: string;
  street: string;
  houseNumber: number;
};

export const mapStreets = ["Calle 57", "Calle 57B", "Calle 59"] as const;

export function createLocationId(street: string, houseNumber: number) {
  return `${street.toLowerCase().replace(/\s+/g, "-")}-${houseNumber}`;
}

export const allHouseLocations: HouseLocation[] = mapStreets.flatMap((street) =>
  allHouseNumbers.map((houseNumber) => ({
    locationId: createLocationId(street, houseNumber),
    street,
    houseNumber
  }))
);

export const allHouseLocationIds = allHouseLocations.map((location) => location.locationId);

const houseLocationById = new Map(allHouseLocations.map((location) => [location.locationId, location]));

const primaryStreetSectors = mapBlocks.slice(0, 5).flatMap((block) =>
  [...block.top, ...block.bottom].map((house) => [house.number, block.label] as const)
);

export function getHouseStreetLabel(houseNumber: number) {
  return new Map<number, string>(primaryStreetSectors).get(houseNumber) || "Calle sin asignar";
}

export function getHouseLocation(locationId: string) {
  return houseLocationById.get(locationId);
}

export function getDefaultLocationForHouse(houseNumber: number) {
  return getHouseLocation(createLocationId("Calle 57B", houseNumber)) || allHouseLocations[0];
}

export function formatHouseLocationByParts(street: string, houseNumber: number) {
  return `${street} - ${houseNumber}`;
}

export function formatHouseLocation(locationId: string) {
  const location = getHouseLocation(locationId);
  return location ? formatHouseLocationByParts(location.street, location.houseNumber) : "Ubicacion sin asignar";
}
