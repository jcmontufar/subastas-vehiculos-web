# Matriz de cumplimiento académico

Última auditoría: 2 de octubre de 2026.

Estados: **Verificado** significa que existe evidencia ejecutada; **Parcial** indica que la implementación está verificada pero falta producción o evidencia visual; **Pendiente** requiere una acción externa todavía no autorizada.

|   # | Serie | Criterio                                     | Estado     | Evidencia verificable / pendiente                                                                                                                |
| --: | ----- | -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | S1.1  | Sitio público funcional                      | Verificado | Vercel respondió 200 en Home y en la API real; producción: `https://subastas-vehiculos-web.vercel.app`.                                           |
|   2 | S1.1  | Repositorio Git y README con URL             | Verificado | Rama `main` pública en `github.com/jcmontufar/subastas-vehiculos-web`; README incluye ambas URL.                                                  |
|   3 | S1.1  | Tres usuarios de prueba                      | Verificado | Tres cuentas descartables autenticaron contra Firebase real y leyeron únicamente su perfil correspondiente.                                     |
|   4 | S1.2  | Registro, login y logout                     | Verificado | Formulario de registro cargó en producción y dos cuentas independientes iniciaron sesión en dominios aislados.                                  |
|   5 | S1.2  | Protección anónima y catálogo público        | Verificado | `ProtectedPage`, API 401 y pruebas `vehicles-api`/`auctions-api`; lecturas públicas reales y privadas 401 en FIX-03.                             |
|   6 | S2.1  | Ficha técnica y niveles de daño              | Verificado | `vehicleSchema`, `VehicleForm`, `DamageBadge` y pruebas de validación.                                                                           |
|   7 | S2.1  | Cinco fotografías y carrusel                 | Verificado | Esquema exige 5–12 imágenes; reglas validan tipo/tamaño; `ImageCarousel`; pruebas unitarias y de Storage con emulador y Firebase real.           |
|   8 | S2.2  | Inventario público                           | Verificado | `GET /api/vehicles`, Home y reglas públicas; consulta real comprobada en FIX-03.                                                                 |
|   9 | S2.2  | Siete filtros combinables                    | Verificado | Año, marca, modelo, combustible, transmisión, tren y daño; pruebas `filters.test.ts`.                                                            |
|  10 | S3.1  | Precio actualizado sin F5                    | Verificado | Listener `auctions/{id}/public`; Firebase real midió actualizaciones en 723 ms y 616 ms durante FIX-03.                                          |
|  11 | S3.1  | Temporizador y cuatro estados                | Verificado | Reloj con offset de servidor; transición `LIVE` a `SOLD` y rechazo posterior comprobados contra Firebase real.                                   |
|  12 | S3.1  | Indicadores Ganando/Superado                 | Verificado | Dos sesiones de producción mostraron “¡Vas ganando esta subasta!” y “Tu oferta ha sido superada” sin recargar.                                  |
|  13 | S3.1  | Identidades e historial privados             | Verificado | Reglas reales devolvieron 401 para `private`, historial y perfiles ajenos; `leaderUid` nunca forma parte del estado público.                     |
|  14 | S3.2  | Validación servidor, centavos, 10 % y fechas | Verificado | Route Handler + `applyBid`; pruebas de primera puja, redondeo, inicio/cierre y edición bloqueada.                                                |
|  15 | S3.2  | Concurrencia segura                          | Verificado | Transacción sobre la subasta completa; prueba real simultánea produjo una confirmación 201 y un conflicto 409 sin sobrescritura.                 |

## Evidencia por entorno

- **Unitarias:** 36/36 después de añadir la regresión que conserva metadatos superiores de la subasta.
- **Firebase Emulator Suite:** 10/10 en la validación de FIX-03.
- **Firebase real:** autenticación, reglas, publicación temporal, Storage, listeners, privacidad, concurrencia y cierre comprobados; todos los recursos temporales fueron eliminados.
- **Visual local:** Home, registro y login revisados a 1440, 768 y 390 px sin desbordamiento horizontal; menú móvil y redirección anónima comprobados.
- **Producción:** Home, inventario de seis vehículos, detalle con cinco fotografías, login A/B, formulario de publicación, registro, temporizador, listeners e indicadores visuales comprobados. La API pública devolvió 200; una subasta finalizada rechazó pujas con 409; Storage rechazó sobrescritura con `storage/unauthorized`.

En la comprobación final actual, `npm run test:emulators` no llegó a ejecutar assertions: el emulador de Realtime Database terminó al inicializar Netty con `Unable to establish loopback connection`. El fallo se reprodujo tanto con el JDK 23 instalado como con Temurin JDK 21.0.12.1 portable y forzando IPv4. Los puertos estaban libres. Se conserva como evidencia el pase 10/10 anterior, pero estas ejecuciones se reportan como fallo de loopback del host.

## Pendientes manuales

1. Agregar `subastas-vehiculos-web.vercel.app` en **Firebase Console > Authentication > Settings > Authorized domains**. El login por correo fue validado, pero el dominio sigue ausente y debe autorizarse antes de habilitar proveedores con redirección.
2. Repetir `npm run test:emulators` en otro host Windows con loopback funcional; JDK 21 y JDK 23 fallaron aquí antes de ejecutar assertions. Se conserva la evidencia previa 10/10.
