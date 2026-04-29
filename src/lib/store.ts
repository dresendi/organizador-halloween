import fs from "fs/promises";
import path from "path";
import type { Collection, Db, MongoClient } from "mongodb";
import { createLocationId, getDefaultLocationForHouse } from "./map-data";
import type { HalloweenData, Participant, SiteContent } from "./types";

type ParticipantDocument = {
  locationId: string;
  street: string;
  houseNumber: number;
  participantCount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

type SiteContentDocument = SiteContent & {
  _id: "main";
  updatedAt: Date;
};

type MongoContext = {
  client: MongoClient;
  db: Db;
  participants: Collection<ParticipantDocument>;
  content: Collection<SiteContentDocument>;
};

const defaultData: HalloweenData = {
  participants: [
    defaultParticipant("Calle 57B", 813, 4),
    defaultParticipant("Calle 57B", 799, 3),
    defaultParticipant("Calle 57B", 779, 5),
    defaultParticipant("Calle 57B", 761, 2),
    defaultParticipant("Calle 57B", 747, 6),
    defaultParticipant("Calle 57B", 741, 2),
    defaultParticipant("Calle 57", 790, 3),
    defaultParticipant("Calle 57", 776, 4),
    defaultParticipant("Calle 57", 759, 2),
    defaultParticipant("Calle 59", 748, 5)
  ],
  content: {
    news: [
      "El croquis se actualiza conforme los administradores registran casas participantes.",
      "La ruta recomendada empezara por Calle 57 y continuara hacia Calle 59."
    ],
    rules: [
      "Las casas con calabacita participan entregando dulces.",
      "Menores siempre acompanados por un adulto.",
      "Mantengamos banquetas y entradas libres para caminar con seguridad."
    ]
  }
};

function defaultParticipant(street: string, houseNumber: number, count: number): Participant {
  return {
    locationId: createLocationId(street, houseNumber),
    street,
    houseNumber,
    count,
    updatedAt: new Date().toISOString()
  };
}

const localDataDirectory = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const dataFile = path.join(localDataDirectory, "halloween-data.json");
const mongoRetryDelay = 60_000;
let mongoUnavailableUntil = 0;
let indexesReady = false;

async function getMongoContext(): Promise<MongoContext | null> {
  if (!process.env.MONGODB_URI) return null;
  if (Date.now() < mongoUnavailableUntil) return null;
  await ensureSrvCanResolve(process.env.MONGODB_URI);
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 2000
  });
  await client.connect();
  const db = client.db(process.env.DB_NAME || process.env.MONGODB_DB || "halloween_alzare");
  const context = {
    client,
    db,
    participants: db.collection<ParticipantDocument>("participant_houses"),
    content: db.collection<SiteContentDocument>("site_content")
  };
  await ensureMongoSchema(context);
  return context;
}

async function ensureMongoSchema({ participants, content }: MongoContext) {
  if (indexesReady) return;
  await participants.dropIndex("unique_house_number").catch(() => undefined);
  await migrateExistingParticipantDocuments(participants);
  await Promise.all([
    participants.createIndex({ locationId: 1 }, { unique: true, name: "unique_location_id" }),
    participants.createIndex({ street: 1, houseNumber: 1 }, { name: "street_house_number" }),
    participants.createIndex({ updatedAt: -1 }, { name: "updated_at_desc" }),
    content.updateOne(
      { _id: "main" },
      {
        $setOnInsert: {
          _id: "main",
          ...defaultData.content,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )
  ]);
  indexesReady = true;
}

async function migrateExistingParticipantDocuments(participants: Collection<ParticipantDocument>) {
  const oldParticipants = await participants.find({ locationId: { $exists: false } }).toArray();
  if (oldParticipants.length === 0) return;

  await participants.bulkWrite(
    oldParticipants.map((participant) => {
      const normalized = normalizeParticipant(participant);
      return {
        updateOne: {
          filter: { _id: participant._id },
          update: {
            $set: {
              locationId: normalized.locationId,
              street: normalized.street,
              houseNumber: normalized.houseNumber,
              participantCount: normalized.count,
              note: normalized.note,
              updatedAt: new Date(normalized.updatedAt)
            }
          }
        }
      };
    })
  );
}

async function ensureSrvCanResolve(uri: string) {
  if (!uri.startsWith("mongodb+srv://")) return;
  const hostname = new URL(uri).hostname;
  const { resolveSrv } = await import("dns/promises");
  await Promise.race([
    resolveSrv(`_mongodb._tcp.${hostname}`),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`DNS timeout para ${hostname}`)), 1500))
  ]);
}

function logMongoFallback(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  mongoUnavailableUntil = Date.now() + mongoRetryDelay;
  console.warn(`MongoDB no disponible, usando almacenamiento local: ${message}`);
}

function isVercelRuntime() {
  return Boolean(process.env.VERCEL);
}

function assertLocalWriteAllowed() {
  if (isVercelRuntime()) {
    throw new Error("MongoDB no esta disponible; no se guardo el cambio en Atlas.");
  }
}

async function readLocalData(): Promise<HalloweenData> {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    const data = JSON.parse(raw) as HalloweenData;
    return {
      ...data,
      participants: data.participants.map(normalizeParticipant)
    };
  } catch {
    await writeLocalData(defaultData);
    return defaultData;
  }
}

async function writeLocalData(data: HalloweenData) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

function fromParticipantDocument(document: ParticipantDocument): Participant {
  const normalized = normalizeParticipant(document);
  return {
    locationId: normalized.locationId,
    street: normalized.street,
    houseNumber: normalized.houseNumber,
    count: normalized.count,
    note: normalized.note,
    updatedAt: normalized.updatedAt
  };
}

function normalizeParticipant(
  participant: Partial<Omit<ParticipantDocument, "updatedAt">> &
    Partial<Omit<Participant, "updatedAt">> & {
    count?: number;
    participantCount?: number;
    updatedAt?: Date | string;
  }
): Participant {
  const houseNumber = Number(participant.houseNumber);
  const fallbackLocation = getDefaultLocationForHouse(houseNumber);
  const street = participant.street || fallbackLocation.street;
  const locationId = participant.locationId || createLocationId(street, houseNumber);
  const updatedAt =
    participant.updatedAt instanceof Date
      ? participant.updatedAt.toISOString()
      : participant.updatedAt || new Date().toISOString();

  return {
    locationId,
    street,
    houseNumber,
    count: Number(participant.participantCount ?? participant.count ?? 1),
    note: participant.note,
    updatedAt
  };
}

async function getMongoData(context: MongoContext): Promise<HalloweenData> {
  const [participants, content] = await Promise.all([
    context.participants.find({}).sort({ street: 1, houseNumber: -1 }).toArray(),
    context.content.findOne({ _id: "main" })
  ]);

  if (participants.length === 0) {
    const migratedData = await migrateLegacySiteData(context);
    if (migratedData) return migratedData;
    await seedDefaultParticipants(context);
    return defaultData;
  }

  return {
    participants: participants.map(fromParticipantDocument),
    content: content ? { news: content.news, rules: content.rules } : defaultData.content
  };
}

async function migrateLegacySiteData(context: MongoContext): Promise<HalloweenData | null> {
  const legacy = await context.db.collection<HalloweenData>("site_data").findOne({});
  if (!legacy) return null;
  const now = new Date();

  if (legacy.participants.length > 0) {
    await context.participants.insertMany(
      legacy.participants.map((participant) => {
        const normalized = normalizeParticipant(participant);
        return {
          locationId: normalized.locationId,
          street: normalized.street,
          houseNumber: normalized.houseNumber,
          participantCount: normalized.count,
          note: normalized.note,
          createdAt: now,
          updatedAt: normalized.updatedAt ? new Date(normalized.updatedAt) : now
        };
      }),
      { ordered: false }
    );
  }

  await context.content.updateOne(
    { _id: "main" },
    {
      $set: {
        news: legacy.content.news,
        rules: legacy.content.rules,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  return legacy;
}

async function seedDefaultParticipants(context: MongoContext) {
  const now = new Date();
  await context.participants.insertMany(
    defaultData.participants.map((participant) => ({
      locationId: participant.locationId,
      street: participant.street,
      houseNumber: participant.houseNumber,
      participantCount: participant.count,
      note: participant.note,
      createdAt: now,
      updatedAt: now
    })),
    { ordered: false }
  );
}

export async function getHalloweenData(): Promise<HalloweenData> {
  try {
    const mongo = await getMongoContext();
    if (mongo) {
      try {
        return await getMongoData(mongo);
      } finally {
        await mongo.client.close();
      }
    }
  } catch (error) {
    logMongoFallback(error);
  }
  return readLocalData();
}

export async function saveParticipant(participant: Omit<Participant, "updatedAt">) {
  try {
    const mongo = await getMongoContext();
    if (mongo) {
      try {
        const now = new Date();
        await mongo.participants.updateOne(
          { locationId: participant.locationId },
          {
            $set: {
              street: participant.street,
              houseNumber: participant.houseNumber,
              participantCount: participant.count,
              note: participant.note,
              updatedAt: now
            },
            $setOnInsert: {
              locationId: participant.locationId,
              createdAt: now
            }
          },
          { upsert: true }
        );
        return;
      } finally {
        await mongo.client.close();
      }
    }
  } catch (error) {
    logMongoFallback(error);
  }

  assertLocalWriteAllowed();
  const data = await readLocalData();
  const next: Participant = { ...participant, updatedAt: new Date().toISOString() };
  data.participants = [
    ...data.participants.filter((item) => item.locationId !== participant.locationId),
    next
  ].sort((a, b) => a.street.localeCompare(b.street) || b.houseNumber - a.houseNumber);
  await writeLocalData(data);
}

export async function deleteParticipant(locationId: string) {
  try {
    const mongo = await getMongoContext();
    if (mongo) {
      try {
        await mongo.participants.deleteOne({ locationId });
        return;
      } finally {
        await mongo.client.close();
      }
    }
  } catch (error) {
    logMongoFallback(error);
  }

  assertLocalWriteAllowed();
  const data = await readLocalData();
  data.participants = data.participants.filter((item) => item.locationId !== locationId);
  await writeLocalData(data);
}

export async function saveContent(news: string[], rules: string[]) {
  try {
    const mongo = await getMongoContext();
    if (mongo) {
      try {
        await mongo.content.updateOne(
          { _id: "main" },
          { $set: { news, rules, updatedAt: new Date() } },
          { upsert: true }
        );
        return;
      } finally {
        await mongo.client.close();
      }
    }
  } catch (error) {
    logMongoFallback(error);
  }

  assertLocalWriteAllowed();
  const data = await readLocalData();
  data.content = { news, rules };
  await writeLocalData(data);
}
