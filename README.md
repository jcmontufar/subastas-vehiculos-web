# AutoPujo — subastas de vehículos en tiempo real

> **Producción:** pendiente de despliegue autorizado en Vercel. No existe todavía una URL pública verificada.

AutoPujo es una plataforma académica para publicar vehículos, consultar un inventario público y participar en subastas con actualización en tiempo real. La aplicación protege la identidad de los postores y confirma cada oferta mediante una transacción atómica ejecutada en el servidor.

## Objetivo académico

El proyecto demuestra una aplicación web completa con autenticación, inventario filtrable, fotografías, API REST, reglas de seguridad y concurrencia segura. La [matriz de cumplimiento](docs/academic-compliance.md) separa la evidencia local, de emuladores, de Firebase real y la que todavía requiere comprobarse en producción.

## Tecnologías

- Next.js 16 (App Router y Route Handlers), React 19 y TypeScript strict.
- Tailwind CSS 4, shadcn/ui y React Hook Form.
- Zod para validación compartida.
- Firebase Authentication, Realtime Database, Storage y Admin SDK.
- Vitest y Firebase Emulator Suite.
- Vercel como destino de despliegue.

## Arquitectura

El navegador utiliza el Firebase Web SDK para autenticación, carga de imágenes y listeners de solo lectura. Las publicaciones y pujas pasan por Route Handlers con runtime Node.js. Estos verifican el ID token, validan el contenido y escriben mediante Firebase Admin. Las reglas bloquean escrituras directas en vehículos y subastas.

```text
Navegador ── ID token ──> API Next.js ── Admin SDK ──> Realtime Database
    │                           │
    ├── listeners públicos/propios
    └── fotografías propias ─────────────────────────────> Storage
```

```text
src/
├── app/                    # Páginas y API REST
├── components/             # UI, formularios y subastas
├── contexts/               # Sesión Firebase
├── lib/
│   ├── auctions/           # Motor, dinero y transacciones
│   ├── auth/               # Verificación de tokens
│   ├── firebase/           # SDK cliente y SDK administrativo
│   └── vehicles/           # Filtros y seguridad de imágenes
└── types/                  # Modelo de dominio
scripts/                    # Cuentas y seed académico con guardas
tests/                      # Unitarias e integración con emuladores
```

## Instalación local

Requiere Node.js 20.9 o posterior, npm y Java 21 para los emuladores.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Completa `.env.local` con los valores del proyecto; el archivo está excluido de Git.

## Variables de entorno

Variables públicas del Firebase Web SDK:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Variables privadas, disponibles solo en el servidor:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_DATABASE_URL
```

`FIREBASE_PRIVATE_KEY` debe conservar los saltos de línea como `\n`. Nunca uses el prefijo `NEXT_PUBLIC_` para credenciales administrativas. Consulta [`.env.example`](.env.example) y la [guía de despliegue](docs/deployment.md).

## Configuración de Firebase

1. Habilita **Authentication > Sign-in method > Correo electrónico/contraseña**.
2. Configura Realtime Database y Storage en `subasta-vehiculos-907c4`.
3. Mantén publicadas `database.rules.json` y `storage.rules`.
4. Agrega `localhost` y el dominio final de Vercel en **Authentication > Settings > Authorized domains**.
5. Configura las once variables anteriores en local y en Vercel.

Las reglas permiten lectura pública del inventario y del estado público de las subastas. Cada usuario solo puede leer su perfil y su estado privado. El historial, `leaderUid` y las pujas privadas no son legibles desde el cliente. Storage acepta JPG, PNG o WebP menores de 8 MiB dentro de la carpeta del propietario e impide sobrescrituras.

## API REST

| Método | Ruta                            | Acceso                       |
| ------ | ------------------------------- | ---------------------------- |
| `GET`  | `/api/vehicles`                 | Público                      |
| `GET`  | `/api/vehicles/:id`             | Público                      |
| `POST` | `/api/vehicles`                 | Token Firebase               |
| `PUT`  | `/api/vehicles/:id`             | Token Firebase y propietario |
| `GET`  | `/api/auctions/:vehicleId`      | Público                      |
| `POST` | `/api/auctions/:vehicleId/bids` | Token Firebase               |

Las rutas protegidas esperan `Authorization: Bearer <ID_TOKEN>`.

## Motor de subastas

- Los importes se convierten a centavos antes de evaluarse.
- La primera oferta debe ser estrictamente superior al precio base.
- Las ofertas posteriores deben aumentar al menos 10 %, redondeado a centavos.
- Solo se aceptan ofertas entre `startAt` y `endAt`.
- Precio, historial, líder e indicadores se actualizan en una sola transacción.
- Precio base y fechas quedan bloqueados después de la primera oferta.
- Los estados son `UPCOMING`, `LIVE`, `SOLD` y `UNSOLD`.
- Los listeners actualizan precio e indicador privado sin recargar la página.

Para probar concurrencia manual, abre el mismo vehículo con dos cuentas en sesiones independientes. Envía simultáneamente el mismo mínimo: una petición debe confirmarse y la otra recibir conflicto o un nuevo mínimo. Luego supera la puja desde la segunda sesión y comprueba los mensajes privados de ambas cuentas.

## Datos y cuentas de evaluación

No se han creado todavía datos ni cuentas definitivas en Firebase real. Requieren autorización expresa.

```bash
# Simulación; no escribe en Firebase
npm run accounts:prepare
npm run seed:demo

# Solo después de autorización explícita
npm run accounts:prepare -- --apply --project subasta-vehiculos-907c4
npm run seed:demo -- --apply --project subasta-vehiculos-907c4
```

El primer script crea tres cuentas y perfiles reservados sin modificar cuentas existentes. Sus contraseñas se guardan en `.secrets/evaluation-accounts.json`, excluido de Git, y no se imprimen. El segundo crea seis vehículos claramente marcados, cinco fotografías demostrativas originales generadas para el proyecto por vehículo y subastas en los cuatro estados. Es idempotente y se detiene si un identificador u objeto reservado contiene datos ajenos al seed.

Las credenciales desechables se incorporarán aquí únicamente después de crear y validar las cuentas. No se publicarán credenciales personales ni administrativas.

## Pruebas y seguridad

```bash
npm run lint
npm run typecheck
npm test
npm run test:emulators
npm run build
npm audit --omit=dev
```

`test:emulators` usa `demo-autopujo` y no toca el proyecto real. Las validaciones cubren reglas, autorización por propietario, cinco imágenes, fechas, importes, privacidad, listeners y concurrencia. El reporte exacto y las limitaciones están en la [matriz académica](docs/academic-compliance.md).

## Costos y límites

La solución usa únicamente Firebase y Vercel. No requiere un servidor persistente ni servicios adicionales. Las lecturas en tiempo real, Storage y ejecuciones serverless consumen las cuotas de cada proveedor; las pruebas de carga no forman parte del procedimiento de entrega.
