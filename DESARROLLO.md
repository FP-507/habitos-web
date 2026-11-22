# Notas de desarrollo · Racha (registro de hábitos)

Guía para retomar el proyecto: cómo está armado, por qué y cómo cambiarlo.

## Puesta en marcha

```bash
npm start      # sirve la carpeta en http://localhost:3000 (usa npx serve; no hay dependencias instaladas)
npm test       # runner nativo de Node (node --test), Node 18 o superior
```

Los módulos ES (`type="module"`) no funcionan abriendo `index.html` con doble clic: hace falta un servidor. La demo se publica con GitHub Pages desde la rama principal (carpeta raíz).

## Arquitectura

```
index.html ──► src/app.js (DOM, eventos, localStorage) ──► src/habitos.js (lógica pura)
styles.css
```

| Archivo | Responsabilidad |
|---|---|
| `src/habitos.js` | Funciones puras sobre fechas y hábitos. No toca el DOM ni `localStorage`: recibe datos y devuelve datos nuevos |
| `src/app.js` | Estado (`habitos`), `cargar`/`guardar` en `localStorage`, `pintar()` que redibuja la lista, formulario, exportar e importar |
| `styles.css` | Variables de color con modo claro y oscuro (`prefers-color-scheme`), diseño adaptable |
| `tests/habitos.test.js` | 11 tests de la lógica |

### Datos

Se guardan en `localStorage` con la clave `racha.habitos.v1`, como una lista de:

```json
{ "id": "uuid", "nombre": "Leer", "color": "#00798c", "creado": "2026-11-01", "dias": ["2026-11-01", "2026-11-03"] }
```

`dias` está ordenado y sin repetidos. El formato de exportación es el mismo.

### Ciclo de la interfaz

Cada acción (marcar día, crear, borrar, importar) produce un arreglo nuevo de hábitos, llama a `guardar()` y luego a `pintar()`, que reconstruye la lista completa. Con pocos hábitos es simple y suficientemente rápido, y evita estados desincronizados.

## Decisiones

- **Fechas como texto `AAAA-MM-DD` en hora local.** `toISOString()` usa UTC y en Panamá (UTC−5) cambiaría el día después de las 7 p. m. Los textos así se comparan y ordenan correctamente como cadenas.
- **Inmutabilidad:** `alternarDia` devuelve un hábito nuevo; los tests verifican que el original no cambie.
- **Racha actual tolerante:** si hoy todavía no se marcó, la racha cuenta desde ayer (no se "rompe" a las 12:01 a. m.).
- **Porcentaje justo:** los días anteriores a la creación del hábito no cuentan. Marcar un día anterior a la creación adelanta la fecha de inicio.
- **Seguridad:** el texto del usuario se inserta con `textContent`, nunca con `innerHTML`. Los datos importados pasan por `validarImportacion`, que revisa cada campo, recorta el nombre a 40 caracteres y elimina días duplicados.
- **Accesibilidad:** botones reales para cada día con etiqueta para lectores de pantalla y navegación con teclado.
- **Sin frameworks ni build:** se publica tal cual en GitHub Pages.

## Cómo extenderlo

- **Nueva estadística:** escribir la función pura en `habitos.js`, probarla en `tests/habitos.test.js` y mostrarla en `pintar()`.
- **Hábitos semanales (por ejemplo, 3 veces por semana):** agregar un campo `meta` al hábito, tenerlo en cuenta en `rachaActual` y `porcentaje` y aceptarlo en `validarImportacion`.
- **Cambiar el formato guardado:** subir la versión de la clave (`racha.habitos.v2`) y migrar en `cargar()` los datos de la versión anterior.
- **Más días visibles:** `ultimosDias(hoy, 7)` en `pintar()` y `SEMANAS_MAPA` para el mapa de calor.

## Pendientes

- Sincronización entre dispositivos (hoy los datos viven solo en el navegador).
- Recordatorios con notificaciones del navegador.
- Reordenar hábitos arrastrándolos.
