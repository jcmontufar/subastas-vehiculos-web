# Auditoría final — AutoPujo / Examen WebDev 2026

**Fecha de ejecución:** 2 de octubre de 2026, 17:48–18:12 (America/Guatemala)  
**Aplicación auditada:** <https://subastas-vehiculos-web.vercel.app>  
**Repositorio:** <https://github.com/jcmontufar/subastas-vehiculos-web>  
**Firebase:** `subasta-vehiculos-907c4`  
**Versión publicada comprobada:** `c0f1472f5c68310bb8cbe0400a8ad1ab5bcc3589` (`main`)  
**Navegador:** Google Chrome estable, controlado con Playwright, en contextos aislados.

## A. Resumen ejecutivo

Se ejecutaron 74 comprobaciones registradas contra la aplicación publicada y Firebase real: 73 resultaron **CUMPLE** y una **NO CUMPLE**. Cinco de los seis criterios académicos cumplen íntegramente. El criterio S1.2 queda como **NO CUMPLE** porque la interfaz publicada reconoce la sesión y habilita las opciones privadas, pero no muestra el nombre ni el correo del usuario autenticado.

El defecto de identificación se corrigió de forma mínima en el árbol local: el encabezado ahora muestra `displayName` o, como respaldo, el correo del usuario. La corrección pasó lint, TypeScript, 36 pruebas y build, y se comprobó en Chrome contra un build local de producción. No se publicó porque la auditoría exige autorización antes de desplegar una corrección.

No quedó ningún criterio académico como **NO VERIFICADO**. La suite auxiliar de emuladores sí quedó sin ejecutarse porque Realtime Database Emulator terminó con código 1 durante el arranque, antes de iniciar Vitest; las pruebas principales equivalentes se ejecutaron contra Firebase real.

Los vehículos definitivos no fueron alterados. Se creó el lote temporal `-P2z3SCvdbyhb6olyUYQ`, se usó para publicación, edición, Storage y pujas, y se eliminaron al final el vehículo, la subasta y sus cinco objetos. Una comprobación suplementaria utilizó un recurso `audit-history-*`, también eliminado.

## B. Matriz de evaluación

| Criterio | Nombre oficial     | Puntos del documento | Estado        | Requisitos examinados                                                                          | Procedimiento y evidencia                                                                                                                                                                                        | Hallazgos                                                                                                                                                                  |
| -------- | ------------------ | -------------------: | ------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1.1     | Git y publicación  |                  2.5 | **CUMPLE**    | URL, Home, CSS/JS, fotos, API, rutas, consola, GitHub, README, cuentas y commit                | Chrome sobre producción, API REST, `git ls-remote` y metadatos de Vercel. [Home](audit-evidence/01-home-produccion.png)                                                                                          | HTTP 200, seis tarjetas, imágenes válidas, consola sin errores críticos. Vercel `READY`; `gitSource.sha`, `origin/main` y checkout coinciden en `c0f1472`.                 |
| S1.2     | Autenticación      |                  2.5 | **NO CUMPLE** | Anónimo, login, persistencia, logout, protección, privacidad y registro                        | Tres contextos independientes; rutas y endpoint de pujas; formulario de registro. [Login](audit-evidence/11-login.png)                                                                                           | Auth, permisos y registro funcionan. Falta identificación nominal visible del usuario en la versión publicada. Corrección local preparada y verificada, aún no desplegada. |
| S2.1     | Vehículo y galería |                  2.5 | **CUMPLE**    | Ficha técnica, daños, carrusel, publicación, validaciones, cinco fotos, Storage y edición      | Navegación real y lote temporal exclusivo. [Detalle](audit-evidence/02-detalle-vehiculo.png), [formulario](audit-evidence/03-publicacion-formulario.png)                                                         | Los tres niveles aparecen; galería sin roturas; propietario edita y otro usuario recibe denegación. Storage rechazó sobrescritura con HTTP 403.                            |
| S2.2     | Catálogo y filtros |                  2.5 | **CUMPLE**    | Seis vehículos, siete filtros, cuatro combinaciones, limpiar, vacío, navegación y diseño claro | Cada selector se cambió y se comparó el resultado visible con el inventario esperado. [Home y filtros](audit-evidence/01-home-produccion.png)                                                                    | Todos los filtros individuales y combinados aplicaron conjunción; sin desbordamiento en 390/768/1440 px.                                                                   |
| S3.1     | Tiempo real        |                    3 | **CUMPLE**    | Dos sesiones, oferta, listeners, indicadores, privacidad, ausencia de recarga y temporizador   | Contextos A/B simultáneos sobre el lote temporal. [A ganando](audit-evidence/04-postor-a-oferta.png), [A superado](audit-evidence/05-postor-a-superado.png), [B ganando](audit-evidence/06-postor-b-ganando.png) | B recibió Q20,000.01 y el mínimo Q22,000.02 sin recarga; luego A recibió “Tu oferta ha sido superada”. Contadores de visitante y autenticado avanzaron 10 segundos.        |
| S3.2     | Reglas de puja     |                    2 | **CUMPLE**    | Base estricta, 10 %, fechas, concurrencia, historial y cierre                                  | Interfaz más API real y lectura administrativa únicamente para confirmar consistencia del recurso temporal. [Finalizada](audit-evidence/07-subasta-finalizada.png)                                               | Q19,999 y Q20,000 rechazados; Q20,000.01 aceptado. Concurrencia: HTTP 201/409, dos ofertas públicas y dos entradas privadas. Cierre `SOLD`/`UNSOLD` correcto.              |

## C. Evidencias individuales

### C.1 Despliegue y repositorio

1. Se abrió la URL pública en una sesión limpia y se esperó a que terminara la actividad de red.
2. Se observó el hero, estilos claros, siete filtros y seis tarjetas; todas las imágenes cargaron con ancho natural mayor que cero.
3. `GET /api/vehicles` respondió HTTP 200 con seis vehículos.
4. Se recorrieron Home, login, registro, publicación, detalle, edición y endpoints dinámicos. No se observaron errores críticos de consola. Las cancelaciones `ERR_ABORTED` de precargas RSC de Next.js y los HTTP 409 provocados intencionalmente no se clasificaron como errores de aplicación.
5. `git ls-remote origin refs/heads/main` devolvió el mismo SHA del checkout. La API autenticada de Vercel informó despliegue `READY`, `source=git`, `gitSource.ref=main` y SHA `c0f1472...`.
6. README contiene la URL pública y tres cuentas descartables. Las contraseñas no se copiaron a capturas, trazas ni este documento.

### C.2 Visitante y autenticación

| Acción                                            | Esperado                | Obtenido                                     | Estado    |
| ------------------------------------------------- | ----------------------- | -------------------------------------------- | --------- |
| Abrir Home, filtros, detalle y subasta sin sesión | Lectura pública         | Contenido visible y API pública HTTP 200     | CUMPLE    |
| Abrir `/publicar` anónimamente                    | Redirección a login     | `/login?next=%2Fpublicar`                    | CUMPLE    |
| Enviar puja sin token                             | Rechazo                 | HTTP 401                                     | CUMPLE    |
| Leer historial privado o estado ajeno             | Rechazo                 | HTTP 401 en ambos casos                      | CUMPLE    |
| Login de tres cuentas en contextos aislados       | Acceso                  | Las tres autenticaron                        | CUMPLE    |
| Recargar una sesión                               | Persistencia            | La sesión y navegación privada permanecieron | CUMPLE    |
| Cerrar sesión y abrir área privada                | Bloqueo                 | Redirección a login                          | CUMPLE    |
| Identificar nominalmente al usuario               | Nombre o correo visible | Solo se mostraban las opciones privadas      | NO CUMPLE |

El formulario de registro mostró nombre, apellido, correo, teléfono, contraseña y confirmación. Se observaron mensajes en español para longitudes inválidas y contraseñas distintas. No se creó una cuenta nueva porque no era necesario para comprobar el formulario.

### C.3 Vehículo, galería, publicación y edición

La ficha mostró año, tipo, marca, modelo, motor, transmisión, combustible, tren de manejo, cilindros y nivel de daño. Se confirmaron ejemplos visuales verde, amarillo y rojo. El carrusel tenía cinco fotografías, avanzó y retrocedió, y ninguna imagen resultó rota.

En el formulario de publicación se comprobaron campos obligatorios, precio cero inválido, cierre anterior al inicio, rechazo de menos de cinco imágenes, cinco previsualizaciones y eliminación previa de una imagen. Se publicaron cinco PNG en Firebase Storage, se persistió el vehículo y se editó el modelo. Un segundo usuario no pudo abrir el formulario de edición. Un intento de crear nuevamente el primer objeto de Storage recibió HTTP 403.

### C.4 Catálogo y filtros

Se modificaron de forma independiente Año, Marca, Modelo, Combustible, Transmisión, Tren de manejo y Nivel de daño. Después se probaron:

- marca + modelo;
- año + combustible;
- marca + nivel de daño;
- combustible + transmisión + nivel de daño.

En todos los casos el número de tarjetas coincidió con los vehículos que satisfacían todos los valores. También se comprobó el estado “No hay resultados” y que “Limpiar” restauró las seis tarjetas.

### C.5 Responsive

Home, formulario de publicación y detalle/subasta se midieron en 390, 768 y 1440 px. `scrollWidth` nunca superó `clientWidth`. Menú, tarjetas, formulario, galería, temporizador, puja, indicadores y botones permanecieron utilizables. Evidencias: [móvil](audit-evidence/08-responsive-mobile.png), [tablet](audit-evidence/09-responsive-tablet.png) y [desktop](audit-evidence/10-responsive-desktop.png).

## D. Problemas encontrados

### D.1 El encabezado no identifica nominalmente al usuario autenticado

- **Gravedad técnica:** baja; afecta el cumplimiento explícito y la claridad de sesión, no la autorización.
- **Funcionalidad afectada:** autenticación, criterio S1.2.
- **Reproducción:** iniciar sesión en producción y observar el encabezado. Aparecen “Mis publicaciones”, “Publicar” y “Salir”, pero ningún nombre o correo.
- **Causa:** el componente `Header` consumía `user` solo para elegir la navegación autenticada.
- **Corrección preparada:** mostrar `user.displayName || user.email` con etiqueta accesible “Usuario autenticado”.
- **Segunda verificación:** Chrome contra `next start` local mostró el identificador, navegación privada y sesión. Lint, typecheck, 36 pruebas y build pasan.
- **Pendiente:** desplegar y repetir la comprobación en producción. Requiere autorización explícita.

### D.2 Firebase Emulator Suite no inicia Realtime Database en este host

- **Gravedad técnica:** informativa para la auditoría; no afecta la producción comprobada.
- **Reproducción:** `npm run test:emulators` inicia Database y Storage, pero Database Emulator termina con código 1 antes de Vitest.
- **Corrección recomendada:** revisar la instalación/loopback de Java o ejecutar la suite en CI/Linux. No se cambió código ni reglas por un fallo del entorno.
- **Cobertura alternativa real:** privacidad, Storage, fechas, concurrencia e historial se probaron directamente contra el proyecto Firebase real.

## E. Pruebas de seguridad

- Un anónimo puede leer únicamente inventario y estado público.
- La API de pujas sin token devuelve HTTP 401.
- `auctions/{id}/private` devuelve HTTP 401 sin autenticación.
- Un usuario autenticado puede leer su `userState`, pero recibe HTTP 401 al pedir el de otro UID.
- La respuesta pública no contiene UID, nombre, correo ni teléfono del postor.
- La edición por un usuario no propietario fue rechazada.
- Storage permitió crear archivos propios y rechazó sobrescribir un objeto existente con HTTP 403.
- No se modificaron reglas, facturación, cuentas personales ni publicaciones definitivas.

## F. Pruebas en tiempo real

1. A y B abrieron el mismo lote temporal en contextos independientes.
2. A ofertó Q20,000.01. A mostró “¡Vas ganando esta subasta!”.
3. Sin recargar B, su precio actual pasó a Q20,000.01 y el siguiente mínimo a Q22,000.02.
4. B ofertó exactamente Q22,000.02. B mostró el indicador de ganador y A recibió “Tu oferta ha sido superada”.
5. Ninguna acción de verificación usó F5, `window.location.reload()` o navegación para propagar la oferta; el cambio llegó por el listener de Realtime Database.
6. Los temporizadores de visitante y usuario autenticado descendieron diez segundos de forma continua.
7. Dos solicitudes simultáneas con el mismo mínimo produjeron HTTP 201 y HTTP 409. Una comprobación suplementaria confirmó `bidCount=2`, dos entradas privadas y precio ganador consistente; no hubo sobrescritura ni pérdida del historial.
8. Tras forzar el cierre del recurso temporal, una nueva oferta devolvió `AUCTION_ENDED`; con ofertas se obtuvo `SOLD` y sin ofertas `UNSOLD`.

## G. Pendientes

- Publicar la corrección de identificación de usuario y volver a auditar S1.2 en Vercel.
- La suite de emuladores no llegó a ejecutar sus casos en este host; queda pendiente corregir el entorno Java/loopback. No hay pruebas de Firebase real pendientes dentro de los seis criterios.
- Si se agregan proveedores OAuth en el futuro, debe verificarse el dominio de Vercel en Firebase Authentication. La auditoría actual usó únicamente correo/contraseña.

## H. Conclusión técnica

La aplicación publicada demostró de forma real el despliegue, inventario, publicación y edición controlada, filtros, privacidad, Storage, listeners, reglas monetarias, concurrencia atómica y cierres. Cinco criterios quedaron comprobados como CUMPLE. S1.2 queda factual y temporalmente como NO CUMPLE por la ausencia de identificación nominal en el encabezado publicado, aunque la corrección ya está preparada y verificada localmente. No se asigna nota ni se anticipa la evaluación del catedrático.

## Registro de verificaciones automatizadas

| Comando                  | Resultado                                                               |
| ------------------------ | ----------------------------------------------------------------------- |
| `npm run lint`           | CUMPLE, código 0                                                        |
| `npm run typecheck`      | CUMPLE, código 0                                                        |
| `npm test`               | CUMPLE, 6 archivos y 36/36 pruebas                                      |
| `npm run test`           | CUMPLE, 6 archivos y 36/36 pruebas en la corrida previa a la corrección |
| `npm run build`          | CUMPLE, Next.js 16.3.7 compiló 9 páginas y rutas dinámicas              |
| `npm run test:emulators` | NO VERIFICADO: Database Emulator terminó con código 1 antes de Vitest   |

El registro estructurado de las acciones en producción está en [`audit-results.json`](audit-evidence/audit-results.json). No contiene tokens, UID personales ni contraseñas.
