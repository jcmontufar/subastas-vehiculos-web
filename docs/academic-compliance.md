# Matriz de cumplimiento académico

Última auditoría: 1 de octubre de 2026.

Estados: **Verificado** significa que existe evidencia ejecutada; **Parcial** indica que la implementación está verificada pero falta producción o evidencia visual; **Pendiente** requiere una acción externa todavía no autorizada.

|   # | Serie | Criterio                                     | Estado     | Evidencia verificable / pendiente                                                                                                                |
| --: | ----- | -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | S1.1  | Sitio público funcional                      | Pendiente  | Build local aprobado previamente; falta desplegar y probar una URL real de Vercel.                                                               |
|   2 | S1.1  | Repositorio Git y README con URL             | Parcial    | Historial local y README auditados; no existe remoto ni URL pública autorizados.                                                                 |
|   3 | S1.1  | Tres usuarios de prueba                      | Pendiente  | `scripts/create-evaluation-users.mjs` está preparado y su simulación fue ejecutada; no se crearon cuentas reales.                                |
|   4 | S1.2  | Registro, login y logout                     | Verificado | Registro real verificado en FIX-01; UI en `registro`, `login` y `Header`. Pruebas definitivas en producción pendientes.                          |
|   5 | S1.2  | Protección anónima y catálogo público        | Verificado | `ProtectedPage`, API 401 y pruebas `vehicles-api`/`auctions-api`; lecturas públicas reales y privadas 401 en FIX-03.                             |
|   6 | S2.1  | Ficha técnica y niveles de daño              | Verificado | `vehicleSchema`, `VehicleForm`, `DamageBadge` y pruebas de validación.                                                                           |
|   7 | S2.1  | Cinco fotografías y carrusel                 | Verificado | Esquema exige 5–12 imágenes; reglas validan tipo/tamaño; `ImageCarousel`; pruebas unitarias y de Storage con emulador y Firebase real.           |
|   8 | S2.2  | Inventario público                           | Verificado | `GET /api/vehicles`, Home y reglas públicas; consulta real comprobada en FIX-03.                                                                 |
|   9 | S2.2  | Siete filtros combinables                    | Verificado | Año, marca, modelo, combustible, transmisión, tren y daño; pruebas `filters.test.ts`.                                                            |
|  10 | S3.1  | Precio actualizado sin F5                    | Verificado | Listener `auctions/{id}/public`; Firebase real midió actualizaciones en 723 ms y 616 ms durante FIX-03.                                          |
|  11 | S3.1  | Temporizador y cuatro estados                | Verificado | Reloj con offset de servidor; transición `LIVE` a `SOLD` y rechazo posterior comprobados contra Firebase real.                                   |
|  12 | S3.1  | Indicadores Ganando/Superado                 | Parcial    | Estados privados A/B se verificaron en Firebase real y la UI los representa; falta comprobación visual simultánea en dos sesiones de producción. |
|  13 | S3.1  | Identidades e historial privados             | Verificado | Reglas reales devolvieron 401 para `private`, historial y perfiles ajenos; `leaderUid` nunca forma parte del estado público.                     |
|  14 | S3.2  | Validación servidor, centavos, 10 % y fechas | Verificado | Route Handler + `applyBid`; pruebas de primera puja, redondeo, inicio/cierre y edición bloqueada.                                                |
|  15 | S3.2  | Concurrencia segura                          | Verificado | Transacción sobre la subasta completa; prueba real simultánea produjo una confirmación 201 y un conflicto 409 sin sobrescritura.                 |

## Evidencia por entorno

- **Unitarias:** 35/35 en la validación de FIX-03.
- **Firebase Emulator Suite:** 10/10 en la validación de FIX-03.
- **Firebase real:** autenticación, reglas, publicación temporal, Storage, listeners, privacidad, concurrencia y cierre comprobados; todos los recursos temporales fueron eliminados.
- **Visual local (auditoría actual):** Home, registro y login revisados a 1440, 768 y 390 px sin desbordamiento horizontal; menú móvil y redirección anónima comprobados. Detalle, carrusel, edición y pujas visuales esperan el seed autorizado.
- **Producción:** no ejecutada porque aún no existe despliegue autorizado.

En la comprobación final actual, `npm run test:emulators` no llegó a ejecutar assertions: el emulador de Realtime Database terminó al inicializar Netty con `Unable to establish loopback connection` bajo el JDK 23 instalado. Los puertos estaban libres. Se conserva como evidencia el pase 10/10 anterior, pero esta ejecución se reporta como fallo de entorno y debe repetirse con JDK 21 antes de publicar.

## Brechas que impiden declarar la entrega completa

1. Crear y validar tres cuentas desechables de evaluación.
2. Ejecutar el seed académico real y revisar visualmente sus 30 imágenes.
3. Crear el remoto GitHub y realizar el primer push.
4. Desplegar en Vercel, registrar su dominio en Firebase Authentication y probar la URL.
5. Ejecutar las pruebas visuales responsive y la prueba cruzada A/B en producción.
6. Incorporar al README la URL real y las credenciales desechables una vez comprobadas.
