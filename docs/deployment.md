# Despliegue seguro en GitHub y Vercel

Este procedimiento no debe ejecutarse sin autorización explícita del propietario de las cuentas externas.

## 1. Preparación de GitHub

Nombre requerido: `subastas-vehiculos-web`.

Antes del primer push:

```bash
git status
git log --oneline
git check-ignore .env.local
git ls-files
```

Confirma que `.env.local`, `.secrets/`, claves privadas, logs y `.vercel/` no estén versionados. Crea el repositorio sin inicializar archivos remotos y enlaza el remoto solo tras revisar el destino.

## 2. Variables de Vercel

Configura estas variables para Production, Preview y Development cuando corresponda:

| Variable                                   | Exposición | Origen                               |
| ------------------------------------------ | ---------- | ------------------------------------ |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Cliente    | Configuración de la app web Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Cliente    | Configuración de la app web Firebase |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL`        | Cliente    | URL de Realtime Database             |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Cliente    | ID del proyecto                      |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Cliente    | Bucket de Storage                    |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Cliente    | Configuración de la app web          |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Cliente    | Configuración de la app web          |
| `FIREBASE_PROJECT_ID`                      | Servidor   | Cuenta de servicio                   |
| `FIREBASE_CLIENT_EMAIL`                    | Servidor   | Cuenta de servicio                   |
| `FIREBASE_PRIVATE_KEY`                     | Servidor   | Cuenta de servicio, con saltos `\n`  |
| `FIREBASE_DATABASE_URL`                    | Servidor   | URL de Realtime Database             |

No copies secretos a `vercel.json`, al repositorio ni a variables `NEXT_PUBLIC_*`. Los cuatro Route Handlers administrativos declaran `runtime = "nodejs"`.

## 3. Publicación y Firebase Authentication

1. Importa el repositorio en Vercel.
2. Configura las once variables sin mostrarlas en logs ni capturas.
3. Ejecuta el deployment y conserva la URL resultante.
4. Agrega únicamente el hostname de Vercel a **Firebase Console > Authentication > Settings > Authorized domains**.
5. Ejecuta un redeploy si cambió alguna variable con prefijo `NEXT_PUBLIC_`.

## 4. Validación posterior

- Anónimo: Home, filtros, detalle, temporizador y bloqueo de pujas.
- Cuenta 1: login, publicación con cinco imágenes y edición propia.
- Cuentas 2 y 3: pujas cruzadas, listeners e indicadores visuales.
- API: GET público, POST/PUT autenticado y rechazo 401/403.
- Firebase: lectura pública, privacidad de `private` y estado por UID.
- Storage: carga válida y rechazo de sobrescritura.
- Responsive: 1440 px, 768 px y 390 px sin desbordamientos.

Registra resultados reales en `docs/academic-compliance.md`. No marques producción como verificada solo porque el build terminó.
