import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";

const PROJECT_ID = "subasta-vehiculos-907c4";
const DEMO_MARKER = "autopujo-academic-demo-v1";
const MANIFEST_PATH = path.resolve(".secrets", "evaluation-accounts.json");
const WIDTH = 960;
const HEIGHT = 540;

const catalog = [
  {
    id: "demo-toyota-corolla",
    brand: "Toyota",
    model: "Corolla SE",
    year: 2021,
    itemType: "Sedán",
    engine: "2.0L I4",
    transmission: "CVT",
    fuelType: "Gasolina",
    drivetrain: "FWD",
    cylinders: 4,
    damageLevel: "GREEN",
    basePrice: 20000,
    state: "UPCOMING",
    color: [32, 100, 190],
  },
  {
    id: "demo-honda-civic",
    brand: "Honda",
    model: "Civic Touring",
    year: 2020,
    itemType: "Sedán",
    engine: "1.5L Turbo",
    transmission: "CVT",
    fuelType: "Gasolina",
    drivetrain: "FWD",
    cylinders: 4,
    damageLevel: "YELLOW",
    basePrice: 24000,
    state: "LIVE",
    color: [180, 42, 50],
  },
  {
    id: "demo-mazda-cx5",
    brand: "Mazda",
    model: "CX-5 Grand Touring",
    year: 2022,
    itemType: "SUV",
    engine: "2.5L I4",
    transmission: "Automática",
    fuelType: "Gasolina",
    drivetrain: "AWD",
    cylinders: 4,
    damageLevel: "GREEN",
    basePrice: 36000,
    state: "LIVE",
    color: [112, 32, 50],
  },
  {
    id: "demo-hyundai-tucson",
    brand: "Hyundai",
    model: "Tucson Limited",
    year: 2019,
    itemType: "SUV",
    engine: "2.4L I4",
    transmission: "Automática",
    fuelType: "Gasolina",
    drivetrain: "AWD",
    cylinders: 4,
    damageLevel: "YELLOW",
    basePrice: 28500,
    state: "SOLD",
    color: [70, 82, 96],
  },
  {
    id: "demo-toyota-hilux",
    brand: "Toyota",
    model: "Hilux SRV",
    year: 2018,
    itemType: "Pickup",
    engine: "2.8L Turbo Diésel",
    transmission: "Manual",
    fuelType: "Diésel",
    drivetrain: "4WD",
    cylinders: 4,
    damageLevel: "RED",
    basePrice: 32000,
    state: "UNSOLD",
    color: [45, 110, 78],
  },
  {
    id: "demo-ford-mustang",
    brand: "Ford",
    model: "Mustang GT",
    year: 2017,
    itemType: "Coupé",
    engine: "5.0L V8",
    transmission: "Manual",
    fuelType: "Gasolina",
    drivetrain: "RWD",
    cylinders: 8,
    damageLevel: "GREEN",
    basePrice: 52000,
    state: "LIVE",
    color: [220, 130, 24],
  },
];

function hasFlag(name) {
  return process.argv.includes(name);
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requireEnvironment() {
  const values = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de Firebase: ${missing.join(", ")}`);
  }
  return values;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function createDemoImage(baseColor, variant) {
  const rows = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  const wheelY = 390 + variant * 3;
  for (let y = 0; y < HEIGHT; y += 1) {
    const rowStart = y * (WIDTH * 4 + 1);
    rows[rowStart] = 0;
    for (let x = 0; x < WIDTH; x += 1) {
      const index = rowStart + 1 + x * 4;
      const sky = y < 360;
      let color = sky
        ? [225 - Math.floor(y / 12), 239 - Math.floor(y / 18), 250]
        : [58 + Math.floor(y / 20), 67 + Math.floor(y / 20), 78];
      const body = y > 270 && y < 390 && x > 150 && x < 820;
      const roof = y > 205 && y <= 300 && x > 315 && x < 660;
      const hoodSlope = y > 245 && y < 310 && x > 660 && x < 790;
      const wheel =
        Math.hypot(x - (290 + variant * 5), y - wheelY) < 58 ||
        Math.hypot(x - (690 - variant * 5), y - wheelY) < 58;
      const hub =
        Math.hypot(x - (290 + variant * 5), y - wheelY) < 27 ||
        Math.hypot(x - (690 - variant * 5), y - wheelY) < 27;
      if (body || roof || hoodSlope) {
        const highlight = Math.max(0, 28 - Math.floor((y - 230) / 5));
        color = baseColor.map((value) => Math.min(255, value + highlight));
      }
      if (roof && y < 275 && x > 350 && x < 625) color = [55, 78, 98];
      if (wheel) color = [22, 26, 32];
      if (hub) color = [176, 184, 194];
      if ((x + variant * 73) % 290 < 3 && sky) color = [205, 220, 236];
      rows[index] = color[0];
      rows[index + 1] = color[1];
      rows[index + 2] = color[2];
      rows[index + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(rows, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function scheduleFor(state, now) {
  const hour = 3_600_000;
  const day = 24 * hour;
  if (state === "UPCOMING") return [now + day, now + 8 * day];
  if (state === "LIVE") return [now - hour, now + 14 * day];
  return [now - 3 * day, now - 2 * day];
}

function minimumBid(basePriceCents, currentBidCents) {
  return currentBidCents === null
    ? basePriceCents + 1
    : currentBidCents + Math.ceil(currentBidCents / 10);
}

async function getDownloadUrl(bucket, objectPath, buffer) {
  const file = bucket.file(objectPath);
  const [exists] = await file.exists();
  if (!exists) {
    const token = randomUUID();
    await file.save(buffer, {
      resumable: false,
      preconditionOpts: { ifGenerationMatch: 0 },
      metadata: {
        contentType: "image/png",
        metadata: {
          firebaseStorageDownloadTokens: token,
          autopujoDemo: DEMO_MARKER,
        },
      },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
  }
  const [metadata] = await file.getMetadata();
  if (metadata.metadata?.autopujoDemo !== DEMO_MARKER) {
    throw new Error(`El objeto ${objectPath} no pertenece al seed académico`);
  }
  const token = metadata.metadata?.firebaseStorageDownloadTokens;
  if (!token)
    throw new Error(`El objeto ${objectPath} no tiene token de descarga`);
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

async function main() {
  if (!hasFlag("--apply")) {
    console.log(
      "Simulación: se prepararían 6 vehículos, 30 imágenes propias y subastas UPCOMING, LIVE, SOLD y UNSOLD.",
    );
    console.log(
      `No se realizó ninguna escritura. Para aplicar: npm run seed:demo -- --apply --project ${PROJECT_ID}`,
    );
    return;
  }
  if (option("--project") !== PROJECT_ID) {
    throw new Error(`Confirma el destino con --project ${PROJECT_ID}`);
  }
  const environment = requireEnvironment();
  if (environment.projectId !== PROJECT_ID) {
    throw new Error(
      "FIREBASE_PROJECT_ID no coincide con el proyecto autorizado",
    );
  }
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (manifest.projectId !== PROJECT_ID || manifest.accounts?.length !== 3) {
    throw new Error("Primero prepara las tres cuentas de evaluación");
  }
  const owner = manifest.accounts[0];
  const bidder = manifest.accounts[2];
  const app = initializeApp({
    credential: cert(environment),
    databaseURL: environment.databaseURL,
    storageBucket: environment.storageBucket,
  });
  const database = getDatabase(app);
  const auth = getAuth(app);
  const bucket = getStorage(app).bucket();
  const now = Date.now();
  const updates = {};

  for (const account of [owner, bidder]) {
    const user = await auth.getUser(account.uid);
    if (
      user.email !== account.email ||
      user.customClaims?.autopujoEvaluation !== true
    ) {
      throw new Error(
        `La cuenta ${account.uid} no es una cuenta de evaluación`,
      );
    }
  }

  for (const definition of catalog) {
    const existing = await database.ref(`vehicles/${definition.id}`).get();
    if (existing.exists() && existing.val().demoMarker !== DEMO_MARKER) {
      throw new Error(`El registro ${definition.id} no pertenece al seed`);
    }
    const existingAuction = await database
      .ref(`auctions/${definition.id}`)
      .get();
    if (
      existingAuction.exists() &&
      existingAuction.val().demoMarker !== DEMO_MARKER
    ) {
      throw new Error(`La subasta ${definition.id} no pertenece al seed`);
    }
    const images = [];
    for (let index = 0; index < 5; index += 1) {
      const objectPath = `vehicles/${owner.uid}/academic-demo/${definition.id}/${index + 1}.png`;
      images.push({
        id: `${definition.id}-${index + 1}`,
        url: await getDownloadUrl(
          bucket,
          objectPath,
          createDemoImage(definition.color, index),
        ),
        storagePath: objectPath,
        order: index,
      });
    }
    const [start, end] = scheduleFor(definition.state, now);
    const startAt = new Date(start).toISOString();
    const endAt = new Date(end).toISOString();
    const timestamp = new Date(now).toISOString();
    const basePriceCents = definition.basePrice * 100;
    const sold = definition.state === "SOLD";
    const currentBidCents = sold ? basePriceCents + 100 : null;
    updates[`vehicles/${definition.id}`] = {
      ...definition,
      state: null,
      color: null,
      ownerId: owner.uid,
      images,
      startAt,
      endAt,
      createdAt: existing.val()?.createdAt ?? timestamp,
      updatedAt: timestamp,
      demoMarker: DEMO_MARKER,
    };
    const auction = {
      public: {
        vehicleId: definition.id,
        basePriceCents,
        currentBidCents,
        minimumNextBidCents: minimumBid(basePriceCents, currentBidCents),
        bidCount: sold ? 1 : 0,
        startAt,
        endAt,
        status: definition.state,
        updatedAt: timestamp,
      },
      private: sold
        ? {
            leaderUid: bidder.uid,
            bids: {
              "demo-winning-bid": {
                id: "demo-winning-bid",
                vehicleId: definition.id,
                bidderId: bidder.uid,
                amountCents: currentBidCents,
                createdAt: new Date(end - 60_000).toISOString(),
              },
            },
          }
        : { bids: {} },
      userStates: sold
        ? {
            [bidder.uid]: {
              hasBid: true,
              isWinning: true,
              lastBidCents: currentBidCents,
              updatedAt: timestamp,
            },
          }
        : {},
      demoMarker: DEMO_MARKER,
    };
    updates[`auctions/${definition.id}`] = auction;
  }
  await database.ref().update(updates);
  console.log(
    "Inventario académico preparado: 6 vehículos y 4 estados de subasta.",
  );
  console.log("No se eliminó ni sobrescribió ningún registro ajeno al seed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error inesperado");
  process.exitCode = 1;
});
