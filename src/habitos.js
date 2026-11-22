// Lógica pura del registro de hábitos: sin DOM ni localStorage, para poder probarla.

/** Fecha local en formato AAAA-MM-DD (evita el desfase de zona horaria de toISOString). */
export function fechaISO(fecha = new Date()) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

export function desdeISO(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function sumarDias(iso, n) {
  const f = desdeISO(iso);
  f.setDate(f.getDate() + n);
  return fechaISO(f);
}

/** Los últimos `n` días terminando en `hoy`, del más antiguo al más reciente. */
export function ultimosDias(hoy, n) {
  return Array.from({ length: n }, (_, i) => sumarDias(hoy, i - n + 1));
}

export function crearHabito(nombre, color, hoy = fechaISO()) {
  const limpio = nombre.trim();
  if (!limpio) throw new Error("El hábito necesita un nombre");
  if (limpio.length > 40) throw new Error("El nombre es demasiado largo (máx. 40)");
  return {
    id: crypto.randomUUID(),
    nombre: limpio,
    color,
    creado: hoy,
    dias: [],
  };
}

/**
 * Marca o desmarca un día. Devuelve un hábito nuevo (no modifica el original).
 * Marcar un día anterior a la creación adelanta la fecha de inicio, para poder
 * registrar lo que ya hiciste antes de agregar el hábito.
 */
export function alternarDia(habito, fecha) {
  const dias = habito.dias.includes(fecha)
    ? habito.dias.filter((d) => d !== fecha)
    : [...habito.dias, fecha].sort();
  const creado = fecha < habito.creado ? fecha : habito.creado;
  return { ...habito, dias, creado };
}

/** Días seguidos cumplidos hasta hoy. Si hoy aún no se marcó, cuenta desde ayer. */
export function rachaActual(habito, hoy) {
  const hechos = new Set(habito.dias);
  let dia = hechos.has(hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;
  while (hechos.has(dia)) {
    racha++;
    dia = sumarDias(dia, -1);
  }
  return racha;
}

export function mejorRacha(habito) {
  let mejor = 0;
  let actual = 0;
  let anterior = null;
  for (const dia of [...habito.dias].sort()) {
    actual = anterior && sumarDias(anterior, 1) === dia ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
    anterior = dia;
  }
  return mejor;
}

/** Porcentaje cumplido en los últimos `n` días, sin contar días antes de crear el hábito. */
export function porcentaje(habito, hoy, n = 30) {
  const dias = ultimosDias(hoy, n).filter((d) => d >= habito.creado);
  if (dias.length === 0) return 0;
  const hechos = new Set(habito.dias);
  return Math.round((dias.filter((d) => hechos.has(d)).length / dias.length) * 100);
}

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida datos importados desde un archivo JSON. Lanza un error si no son válidos. */
export function validarImportacion(datos) {
  if (!Array.isArray(datos)) throw new Error("El archivo debe contener una lista de hábitos");
  return datos.map((h, i) => {
    const ok =
      h &&
      typeof h.id === "string" &&
      typeof h.nombre === "string" &&
      h.nombre.trim() &&
      typeof h.color === "string" &&
      FECHA_RE.test(h.creado) &&
      Array.isArray(h.dias) &&
      h.dias.every((d) => FECHA_RE.test(d));
    if (!ok) throw new Error(`El hábito #${i + 1} no tiene el formato correcto`);
    return { id: h.id, nombre: h.nombre.trim().slice(0, 40), color: h.color, creado: h.creado, dias: [...new Set(h.dias)].sort() };
  });
}
