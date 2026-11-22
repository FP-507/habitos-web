# Racha · Registro de hábitos

App web para registrar hábitos diarios: marca los días que cumples, mira tu racha actual, tu mejor racha y un mapa de calor de las últimas 12 semanas. Hecha con **HTML, CSS y JavaScript puro**, sin frameworks ni dependencias.

![tests](https://github.com/FP-507/habitos-web/actions/workflows/tests.yml/badge.svg)

**[Ver la demo →](https://fp-507.github.io/habitos-web/)** · Notas para retomar el proyecto: [DESARROLLO.md](DESARROLLO.md)

## Funciones

- Agregar hábitos con nombre y color (no permite nombres repetidos).
- Marcar o desmarcar cualquiera de los últimos 7 días.
- Racha actual, mejor racha y porcentaje cumplido en 30 días.
- Mapa de calor de 12 semanas por hábito.
- Exportar e importar tus datos en JSON, con validación del archivo.
- Modo claro y oscuro automático, diseño adaptable a celular y accesible con teclado y lector de pantalla.
- Los datos se guardan en `localStorage`: no salen de tu navegador.

## Cómo ejecutarlo

Los módulos de JavaScript necesitan un servidor local (no funcionan abriendo el archivo directamente):

```bash
npm start          # sirve la carpeta en http://localhost:3000
```

O con Python: `python -m http.server 8000`.

## Tests

La lógica (rachas, porcentajes, fechas, validación) está separada de la interfaz en `src/habitos.js`, así que se prueba con el runner nativo de Node, sin instalar nada:

```bash
npm test
```

## Decisiones técnicas

- **Lógica pura separada del DOM:** las funciones reciben datos y devuelven datos nuevos sin modificar los originales, lo que las hace fáciles de probar.
- **Fechas locales:** se usa `AAAA-MM-DD` en hora local en lugar de `toISOString()`, que usa UTC y en Panamá (UTC−5) cambiaría el día después de las 7 p. m.
- **Seguridad:** el texto del usuario se inserta con `textContent`, nunca con `innerHTML`, para evitar inyección de HTML.
- **Importación segura:** los datos importados se validan campo por campo antes de usarse.

## Estructura

```
index.html
styles.css
src/
  habitos.js   # lógica pura
  app.js       # interfaz y almacenamiento
tests/
  habitos.test.js
```
