// Interfaz: conecta la lógica de habitos.js con el DOM y localStorage.
import {
  alternarDia,
  crearHabito,
  desdeISO,
  fechaISO,
  mejorRacha,
  porcentaje,
  rachaActual,
  sumarDias,
  ultimosDias,
  validarImportacion,
} from "./habitos.js";

const CLAVE = "racha.habitos.v1";
const COLORES = ["#d1495b", "#edae49", "#00798c", "#30638e", "#6a4c93", "#2a9d8f"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const SEMANAS_MAPA = 12;

const $ = (sel) => document.querySelector(sel);
let habitos = cargar();

function cargar() {
  try {
    return validarImportacion(JSON.parse(localStorage.getItem(CLAVE) ?? "[]"));
  } catch {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(habitos));
  } catch {
    avisar("No se pudo guardar en este navegador (¿modo privado?).", true);
  }
}

function avisar(texto, error = false) {
  const el = $("#mensaje");
  el.textContent = texto;
  el.classList.toggle("error", error);
}

function pintarColores() {
  const fs = $(".colores");
  COLORES.forEach((c, i) => {
    const input = Object.assign(document.createElement("input"), {
      type: "radio", name: "color", value: c, id: `color-${i}`, checked: i === 0,
    });
    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.style.setProperty("--c", c);
    label.title = `Color ${i + 1}`;
    fs.append(input, label);
  });
}

function crearDia(habito, iso, hoy) {
  const btn = document.createElement("button");
  const fecha = desdeISO(iso);
  const hecho = habito.dias.includes(iso);
  btn.type = "button";
  btn.className = "dia" + (iso === hoy ? " hoy" : "");
  btn.setAttribute("aria-pressed", String(hecho));
  btn.setAttribute("aria-label", `${fecha.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}: ${hecho ? "cumplido" : "sin marcar"}`);
  btn.innerHTML = `<span class="nombre-dia"></span><span class="num"></span>`;
  btn.querySelector(".nombre-dia").textContent = DIAS_CORTOS[fecha.getDay()];
  btn.querySelector(".num").textContent = fecha.getDate();
  btn.addEventListener("click", () => {
    habitos = habitos.map((h) => (h.id === habito.id ? alternarDia(h, iso) : h));
    guardar();
    pintar();
    document.querySelector(`[data-id="${habito.id}"] .dia[data-fecha="${iso}"]`)?.focus();
  });
  btn.dataset.fecha = iso;
  return btn;
}

function crearMapa(habito, hoy) {
  // Empieza en el domingo de hace 11 semanas, para que cada columna sea una semana.
  const inicio = sumarDias(hoy, -desdeISO(hoy).getDay() - (SEMANAS_MAPA - 1) * 7);
  const hechos = new Set(habito.dias);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < SEMANAS_MAPA * 7; i++) {
    const iso = sumarDias(inicio, i);
    const celda = document.createElement("span");
    celda.className = "celda" + (iso > hoy ? " futuro" : hechos.has(iso) ? " hecho" : "");
    frag.append(celda);
  }
  return frag;
}

function pintar() {
  const hoy = fechaISO();
  const lista = $("#lista");
  const tpl = $("#tpl-habito");
  lista.replaceChildren();

  for (const habito of habitos) {
    const nodo = tpl.content.firstElementChild.cloneNode(true);
    nodo.dataset.id = habito.id;
    nodo.style.setProperty("--color", habito.color);
    nodo.querySelector(".habito-nombre").textContent = habito.nombre;
    const racha = rachaActual(habito, hoy);
    nodo.querySelector(".stat-racha").textContent = racha;
    nodo.querySelector(".txt-racha").textContent = racha === 1 ? "día de racha" : "días de racha";
    nodo.querySelector(".stat-mejor").textContent = mejorRacha(habito);
    nodo.querySelector(".stat-pct").textContent = porcentaje(habito, hoy);
    nodo.querySelector(".semana").append(...ultimosDias(hoy, 7).map((d) => crearDia(habito, d, hoy)));
    nodo.querySelector(".mapa").append(crearMapa(habito, hoy));
    const borrar = nodo.querySelector(".btn-borrar");
    borrar.setAttribute("aria-label", `Borrar «${habito.nombre}»`);
    borrar.addEventListener("click", () => {
      if (!confirm(`¿Borrar «${habito.nombre}» y todo su historial?`)) return;
      habitos = habitos.filter((h) => h.id !== habito.id);
      guardar();
      pintar();
      avisar(`Se borró «${habito.nombre}».`);
    });
    lista.append(nodo);
  }

  $("#vacio").hidden = habitos.length > 0;
  const cumplidos = habitos.filter((h) => h.dias.includes(hoy)).length;
  $("#resumen-hoy").textContent = `${cumplidos}/${habitos.length}`;
  $("#resumen-racha").textContent = Math.max(0, ...habitos.map((h) => rachaActual(h, hoy)));
}

$("#form-nuevo").addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = new FormData(e.target);
  try {
    const nuevo = crearHabito(datos.get("nombre"), datos.get("color"));
    if (habitos.some((h) => h.nombre.toLowerCase() === nuevo.nombre.toLowerCase())) {
      throw new Error("Ya tienes un hábito con ese nombre");
    }
    habitos = [...habitos, nuevo];
    guardar();
    pintar();
    e.target.nombre.value = "";
    // Selecciona el siguiente color para que cada hábito se distinga.
    const siguiente = COLORES[(COLORES.indexOf(nuevo.color) + 1) % COLORES.length];
    e.target.querySelector(`input[value="${siguiente}"]`).checked = true;
    avisar(`Agregado «${nuevo.nombre}». Márcalo cada día que lo cumplas.`);
  } catch (error) {
    avisar(error.message, true);
  }
});

$("#exportar").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(habitos, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `habitos-${fechaISO()}.json`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#importar").addEventListener("change", async (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  try {
    const importados = validarImportacion(JSON.parse(await archivo.text()));
    if (habitos.length && !confirm(`Esto reemplaza tus ${habitos.length} hábitos actuales. ¿Continuar?`)) return;
    habitos = importados;
    guardar();
    pintar();
    avisar(`Importados ${importados.length} hábitos.`);
  } catch (error) {
    avisar(`No se pudo importar: ${error.message}`, true);
  } finally {
    e.target.value = "";
  }
});

$("#fecha-hoy").textContent = new Date().toLocaleDateString("es", {
  weekday: "long", day: "numeric", month: "long",
});
pintarColores();
pintar();
