# AutoPujo — plataforma de subastas de vehículos

Primera fase de una plataforma web de subastas vehiculares construida con Next.js, React, TypeScript, Tailwind CSS, shadcn/ui y Firebase. Esta entrega incluye autenticación, catálogo público, filtros, publicación con fotografías, edición de publicaciones propias y API REST. El motor de pujas en tiempo real queda expresamente fuera de esta fase.

## Estado de despliegue

- URL pública: **pendiente de configurar por el propietario del proyecto**.
- Firebase: **requiere las credenciales del proyecto en `.env.local`**.
- Mientras Firebase Admin no está configurado, el catálogo muestra tres registros demostrativos de solo lectura para permitir revisar la interfaz. No se presentan como datos persistidos.

## Usuarios de prueba

La rúbrica solicita tres usuarios. Deben crearse después de habilitar Firebase Authentication; no se incluyen contraseñas inventadas ni credenciales reales en el repositorio.

| Perfil       | Correo                              | Contraseña           | Estado    |
| ------------ | ----------------------------------- | -------------------- | --------- |
| Publicador 1 | `pendiente+publicador1@example.com` | Definir fuera de Git | Pendiente |
| Publicador 2 | `pendiente+publicador2@example.com` | Definir fuera de Git | Pendiente |
| Postor       | `pendiente+postor@example.com`      | Definir fuera de Git | Pendiente |

Reemplaza esta tabla por las credenciales de prueba definitivas antes de entregar o desplegar el proyecto. Nunca uses contraseñas de producción.

## Requisitos

- Node.js 20.9 o posterior
- npm
- Un proyecto Firebase con plan compatible con los servicios utilizados

## Inicio local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Completa `.env.local` antes de probar registro, inicio de sesión, publicación o edición.

## Variables de entorno

Consulta `.env.example`. Las variables `NEXT_PUBLIC_FIREBASE_*` pertenecen a la aplicación web y pueden llegar al navegador. Las variables `FIREBASE_*` corresponden al Admin SDK y se usan únicamente en Route Handlers del servidor.

Para `FIREBASE_PRIVATE_KEY`, conserva los saltos de línea escapados (`\n`) dentro de comillas.

## Configuración manual de Firebase

1. Crea un proyecto en Firebase Console y registra una aplicación web.
2. En **Authentication > Sign-in method**, habilita **Correo electrónico/contraseña**.
3. Crea una instancia de **Realtime Database** y copia su URL.
4. Habilita **Storage** y copia el nombre del bucket.
5. En **Configuración del proyecto > Cuentas de servicio**, genera una clave privada para el Admin SDK. Guarda sus valores solo en `.env.local` o en secretos del proveedor de despliegue.
6. Instala Firebase CLI, inicia sesión y vincula el proyecto:

   ```bash
   firebase login
   firebase use --add
   firebase deploy --only database,storage
   ```

   Esto publica `database.rules.json` y `storage.rules`.

7. Agrega los dominios locales y de producción a **Authentication > Settings > Authorized domains**.
8. Crea tres cuentas de prueba y actualiza la tabla anterior.

### Diagnóstico de registro

Si el registro muestra `auth/invalid-api-key` o
`auth/api-key-not-valid.-please-pass-a-valid-api-key.`, vuelve a Firebase Console >
Configuración del proyecto > General > Tus apps, abre la aplicación web y copia
el valor actual de `apiKey` a `NEXT_PUBLIC_FIREBASE_API_KEY`. Después reinicia el
servidor de Next.js. Si utilizas restricciones en Google Cloud Console, la clave
debe pertenecer al mismo proyecto y permitir Identity Toolkit API y Token Service
API. Un error `auth/operation-not-allowed` requiere habilitar el proveedor
Correo electrónico/contraseña, mientras que `auth/unauthorized-domain` requiere
agregar el dominio en Authentication > Settings > Authorized domains.

Las escrituras de vehículos desde el cliente están denegadas por las reglas. La API verifica el ID token, valida el contenido y usa Admin SDK. Storage permite que cada usuario escriba únicamente dentro de su carpeta y limita archivos a imágenes menores de 8 MB.

## API REST

| Método | Ruta                | Acceso                       |
| ------ | ------------------- | ---------------------------- |
| GET    | `/api/vehicles`     | Público                      |
| GET    | `/api/vehicles/:id` | Público                      |
| POST   | `/api/vehicles`     | Token Firebase obligatorio   |
| PUT    | `/api/vehicles/:id` | Token Firebase y propietario |

Las rutas protegidas esperan `Authorization: Bearer <ID_TOKEN>`.

## Estructura principal

```text
src/
├── app/                    # App Router, páginas y Route Handlers
├── components/             # UI, layout, autenticación y vehículos
├── contexts/               # Estado global de autenticación
├── lib/
│   ├── auth/               # Verificación de token en servidor
│   └── firebase/           # Web SDK y Admin SDK separados
└── types/                  # Modelo de dominio
```

## Validación de calidad

```bash
npm run lint
npm run typecheck
npm run build
```

## Alcance pendiente

La siguiente fase debe implementar las pujas con transacciones atómicas de Realtime Database, reglas y validaciones en servidor, actualización sin refrescar, postores anónimos e indicadores “Vas ganando” y “Tu oferta ha sido superada”.
