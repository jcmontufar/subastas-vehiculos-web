import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const PROJECT_ID = "subasta-vehiculos-907c4";
const SECRET_DIRECTORY = path.resolve(".secrets");
const MANIFEST_PATH = path.join(SECRET_DIRECTORY, "evaluation-accounts.json");
const accountDefinitions = [
  {
    uid: "autopujo-eval-publicador-1",
    email: `publicador1@${PROJECT_ID}.test`,
    firstName: "Publicador",
    lastName: "Uno",
  },
  {
    uid: "autopujo-eval-publicador-2",
    email: `publicador2@${PROJECT_ID}.test`,
    firstName: "Publicador",
    lastName: "Dos",
  },
  {
    uid: "autopujo-eval-postor",
    email: `postor@${PROJECT_ID}.test`,
    firstName: "Postor",
    lastName: "Evaluación",
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
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Faltan variables administrativas: ${missing.join(", ")}`);
  }
  return values;
}

function generatePassword() {
  return `${randomBytes(18).toString("base64url")}aA1!`;
}

async function loadOrCreateManifest() {
  try {
    const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
    if (
      manifest.projectId !== PROJECT_ID ||
      !Array.isArray(manifest.accounts) ||
      manifest.accounts.length !== accountDefinitions.length
    ) {
      throw new Error("El manifiesto local no corresponde a esta evaluación");
    }
    return manifest;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    const manifest = {
      projectId: PROJECT_ID,
      createdAt: new Date().toISOString(),
      accounts: accountDefinitions.map((account) => ({
        ...account,
        password: generatePassword(),
      })),
    };
    await mkdir(SECRET_DIRECTORY, { recursive: true });
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    return manifest;
  }
}

async function findUser(auth, uid) {
  try {
    return await auth.getUser(uid);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
}

async function main() {
  if (!hasFlag("--apply")) {
    console.log(
      "Simulación: se prepararían tres cuentas exclusivas de evaluación y sus perfiles.",
    );
    console.log(
      `No se realizó ninguna escritura. Para aplicar: npm run accounts:prepare -- --apply --project ${PROJECT_ID}`,
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
  const manifest = await loadOrCreateManifest();
  const app = initializeApp({
    credential: cert(environment),
    databaseURL: environment.databaseURL,
  });
  const auth = getAuth(app);
  const database = getDatabase(app);

  for (const account of manifest.accounts) {
    const existing = await findUser(auth, account.uid);
    if (existing && existing.email !== account.email) {
      throw new Error(
        `El UID reservado ${account.uid} pertenece a otra cuenta`,
      );
    }
    if (existing && existing.customClaims?.autopujoEvaluation !== true) {
      throw new Error(
        `La cuenta existente ${account.uid} no tiene la marca de evaluación`,
      );
    }
    if (!existing) {
      await auth.createUser({
        uid: account.uid,
        email: account.email,
        password: account.password,
        displayName: `${account.firstName} ${account.lastName}`,
      });
      await auth.setCustomUserClaims(account.uid, {
        autopujoEvaluation: true,
      });
    }

    const profileRef = database.ref(`users/${account.uid}`);
    const profileSnapshot = await profileRef.get();
    if (profileSnapshot.exists()) {
      const profile = profileSnapshot.val();
      if (profile.uid !== account.uid || profile.email !== account.email) {
        throw new Error(`El perfil ${account.uid} contiene datos ajenos`);
      }
    } else {
      await profileRef.set({
        uid: account.uid,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: "00000000",
        createdAt: new Date().toISOString(),
      });
    }
  }

  console.log("Tres cuentas y perfiles de evaluación están preparados.");
  console.log(
    "Las contraseñas no se imprimieron. El manifiesto local ignorado por Git está en .secrets/evaluation-accounts.json.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error inesperado");
  process.exitCode = 1;
});
