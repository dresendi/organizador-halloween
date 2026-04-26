import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || process.env.MONGODB_DB || "halloween_alzare";

if (!uri) {
  console.error("Missing MONGODB_URI. Add it to .env.local or your shell environment.");
  process.exit(1);
}

const streets = ["Calle 57", "Calle 57B", "Calle 59"];
const houseNumbers = [
  817, 816, 815, 814, 813, 812, 811, 810, 809, 808, 807, 806, 805, 804, 803, 802,
  801, 800, 799, 798, 797, 796, 795, 794, 793, 792, 791, 790, 789, 788, 787, 786,
  785, 784, 783, 782, 781, 780, 779, 778, 777, 776, 775, 774, 773, 772, 771, 770,
  769, 768, 767, 766, 765, 764, 763, 762, 761, 760, 759, 758, 757, 756, 755, 754,
  753, 752, 751, 750, 749, 748, 747, 746, 745, 744, 743, 742, 741, 740, 739, 738
];

function createLocationId(street, houseNumber) {
  return `${street.toLowerCase().replace(/\s+/g, "-")}-${houseNumber}`;
}

function normalizeParticipant(participant) {
  const houseNumber = Number(participant.houseNumber);
  const street = participant.street || "Calle 57B";
  return {
    locationId: participant.locationId || createLocationId(street, houseNumber),
    street,
    houseNumber,
    participantCount: Number(participant.participantCount ?? participant.count ?? 1),
    note: participant.note,
    createdAt: participant.createdAt ? new Date(participant.createdAt) : new Date(),
    updatedAt: participant.updatedAt ? new Date(participant.updatedAt) : new Date()
  };
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(dbName);
  const participants = db.collection("participant_houses");
  const content = db.collection("site_content");
  const locations = db.collection("house_locations");

  await participants.dropIndex("unique_house_number").catch(() => undefined);
  await participants.createIndex({ locationId: 1 }, { unique: true, name: "unique_location_id" });
  await participants.createIndex({ street: 1, houseNumber: 1 }, { name: "street_house_number" });
  await participants.createIndex({ updatedAt: -1 }, { name: "updated_at_desc" });
  await locations.createIndex({ locationId: 1 }, { unique: true, name: "unique_location_id" });

  const allLocations = streets.flatMap((street) =>
    houseNumbers.map((houseNumber) => ({
      locationId: createLocationId(street, houseNumber),
      street,
      houseNumber,
      label: `${street} - ${houseNumber}`,
      updatedAt: new Date()
    }))
  );

  await locations.bulkWrite(
    allLocations.map((location) => ({
      updateOne: {
        filter: { locationId: location.locationId },
        update: { $set: location },
        upsert: true
      }
    }))
  );

  await content.updateOne(
    { _id: "main" },
    {
      $setOnInsert: {
        _id: "main",
        news: [
          "El croquis se actualiza conforme los administradores registran casas participantes.",
          "La ruta recomendada empezara por Calle 57 y continuara hacia Calle 59."
        ],
        rules: [
          "Las casas con calabacita participan entregando dulces.",
          "Menores siempre acompanados por un adulto.",
          "Mantengamos banquetas y entradas libres para caminar con seguridad."
        ],
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  const legacy = await db.collection("site_data").findOne({});
  if (legacy?.participants?.length) {
    await participants.bulkWrite(
      legacy.participants.map((participant) => {
        const normalized = normalizeParticipant(participant);
        return {
          updateOne: {
            filter: { locationId: normalized.locationId },
            update: { $set: normalized },
            upsert: true
          }
        };
      })
    );
  }

  const oldParticipants = await participants.find({ locationId: { $exists: false } }).toArray();
  if (oldParticipants.length) {
    await participants.bulkWrite(
      oldParticipants.map((participant) => {
        const normalized = normalizeParticipant(participant);
        return {
          updateOne: {
            filter: { _id: participant._id },
            update: { $set: normalized },
            upsert: false
          }
        };
      })
    );
  }

  console.log(`MongoDB initialized: ${dbName}`);
  console.log("Collections ready: participant_houses, site_content, house_locations");
} finally {
  await client.close();
}
