import fs from "fs/promises";
import path from "path";
import type { Collection, Db, MongoClient } from "mongodb";
import type { HalloweenData, Participant, SiteContent } from "./types";

type ParticipantDocument = {
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
    { houseNumber: 813, count: 4, updatedAt: new Date().toISOString() },
    { houseNumber: 799, count: 3, updatedAt: new Date().toISOString() },
    { houseNumber: 779, count: 5, updatedAt: new Date().toISOString() },
    { houseNumber: 761, count: 2, updatedAt: new Date().toISOString() },
    { houseNumber: 747, count: 6, updatedAt: new Date().toISOString() },
    { houseNumber: 741, count: 2, updatedAt: new Date().toISOString() },
    { houseNumber: 790, count: 3, updatedAt: new Date().toISOString() },
    { houseNumber: 776, count: 4, updatedAt: new Date().toISOString() },
    { houseNumber: 759, count: 2, updatedAt: new Date().toISOString() },
    { houseNumber: 748, count: 5, updatedAt: new Date().toISOString() }
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
  await Promise.all([
    participants.createIndex({ houseNumber: 1 }, { unique: true, name: "unique_house_number" }),
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

async function readLocalData(): Promise<HalloweenData> {
  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw) as HalloweenData;
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
  return {
    houseNumber: document.houseNumber,
    count: document.participantCount,
    note: document.note,
    updatedAt: document.updatedAt.toISOString()
  };
}

async function getMongoData(context: MongoContext): Promise<HalloweenData> {
  const [participants, content] = await Promise.all([
    context.participants.find({}).sort({ houseNumber: -1 }).toArray(),
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
      legacy.participants.map((participant) => ({
        houseNumber: participant.houseNumber,
        participantCount: participant.count,
        note: participant.note,
        createdAt: now,
        updatedAt: participant.updatedAt ? new Date(participant.updatedAt) : now
      })),
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
          { houseNumber: participant.houseNumber },
          {
            $set: {
              participantCount: participant.count,
              note: participant.note,
              updatedAt: now
            },
            $setOnInsert: {
              houseNumber: participant.houseNumber,
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

  const data = await readLocalData();
  const next: Participant = { ...participant, updatedAt: new Date().toISOString() };
  data.participants = [
    ...data.participants.filter((item) => item.houseNumber !== participant.houseNumber),
    next
  ].sort((a, b) => b.houseNumber - a.houseNumber);
  await writeLocalData(data);
}

export async function deleteParticipant(houseNumber: number) {
  try {
    const mongo = await getMongoContext();
    if (mongo) {
      try {
        await mongo.participants.deleteOne({ houseNumber });
        return;
      } finally {
        await mongo.client.close();
      }
    }
  } catch (error) {
    logMongoFallback(error);
  }

  const data = await readLocalData();
  data.participants = data.participants.filter((item) => item.houseNumber !== houseNumber);
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

  const data = await readLocalData();
  data.content = { news, rules };
  await writeLocalData(data);
}
