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

const primaryStreetSectors = mapBlocks.slice(0, 5).flatMap((block) =>
  [...block.top, ...block.bottom].map((house) => [house.number, block.label] as const)
);

const houseStreetByNumber = new Map<number, string>(primaryStreetSectors);

export function getHouseStreetLabel(houseNumber: number) {
  return houseStreetByNumber.get(houseNumber) || "Calle sin asignar";
}

export function formatHouseLocation(houseNumber: number) {
  return `${getHouseStreetLabel(houseNumber)} - Casa ${houseNumber}`;
}
