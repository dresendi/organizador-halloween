import fs from "fs/promises";
import path from "path";
import type { HalloweenData, Participant } from "./types";

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

const dataFile = path.join(process.cwd(), "data", "halloween-data.json");

async function getMongoCollection() {
  if (!process.env.MONGODB_URI) return null;
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || process.env.MONGODB_DB || "halloween_alzare");
  return { client, collection: db.collection<HalloweenData>("site_data") };
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

export async function getHalloweenData(): Promise<HalloweenData> {
  const mongo = await getMongoCollection();
  if (mongo) {
    try {
      const data = await mongo.collection.findOne({});
      if (data) return { participants: data.participants, content: data.content };
      await mongo.collection.insertOne(defaultData);
      return defaultData;
    } finally {
      await mongo.client.close();
    }
  }
  return readLocalData();
}

export async function saveParticipant(participant: Omit<Participant, "updatedAt">) {
  const data = await getHalloweenData();
  const next: Participant = { ...participant, updatedAt: new Date().toISOString() };
  data.participants = [
    ...data.participants.filter((item) => item.houseNumber !== participant.houseNumber),
    next
  ].sort((a, b) => b.houseNumber - a.houseNumber);
  await saveData(data);
}

export async function deleteParticipant(houseNumber: number) {
  const data = await getHalloweenData();
  data.participants = data.participants.filter((item) => item.houseNumber !== houseNumber);
  await saveData(data);
}

export async function saveContent(news: string[], rules: string[]) {
  const data = await getHalloweenData();
  data.content = { news, rules };
  await saveData(data);
}

async function saveData(data: HalloweenData) {
  const mongo = await getMongoCollection();
  if (mongo) {
    try {
      await mongo.collection.updateOne({}, { $set: data }, { upsert: true });
      return;
    } finally {
      await mongo.client.close();
    }
  }
  await writeLocalData(data);
}
