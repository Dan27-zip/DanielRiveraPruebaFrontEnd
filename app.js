// ── CONSTANTES ──────────────────────────────────
/** Límite de advertencia por gasto individual */
const LIMITE_SEGURIDAD = 2000000;

/** Íconos por categoría */
const ICONOS_CATEGORIA = {
  Transporte: '🚌',
  Comida:     '🍽',
  Alojamiento:'🏨',
  Otros:      '🎁'
};

// ── ESTADO GLOBAL ────────────────────────────────
/**
 * arregloGastos: arreglo principal donde se almacenan
 * objetos de gasto con la forma: { id, categoria, monto }
 */
let arregloGastos = [];

/** Contador incremental para generar IDs únicos */
let contadorId = 1;

/** ID del gasto que se está editando actualmente (null si no hay edición) */
let idEnEdicion = null;

// ── FUNCIONES DE VALIDACIÓN ──────────────────────

/**
 * Limpia los mensajes de error y clases de error del formulario.
 */
function limpiarErrores() {
  document.getElementById('selectCategoria').classList.remove('error');
  document.getElementById('inputMonto').classList.remove('error');
  document.getElementById('errCategoria').textContent = '';
  document.getElementById('errMonto').textContent = '';
}

/**
 * Valida los campos del formulario.
 * @returns {boolean} true si el formulario es válido, false en caso contrario.
 */
function validarFormulario() {
  const categoria = document.getElementById('selectCategoria').value;
  const montoStr  = document.getElementById('inputMonto').value.trim();
  let esValido    = true;

  limpiarErrores();

  // Validación: categoría no nula
  if (!categoria) {
    document.getElementById('selectCategoria').classList.add('error');
    document.getElementById('errCategoria').textContent = 'Debes seleccionar una categoría.';
    esValido = false;
  }

  // Validación: monto no nulo
  if (montoStr === '') {
    document.getElementById('inputMonto').classList.add('error');
    document.getElementById('errMonto').textContent = 'El monto no puede estar vacío.';
    esValido = false;
  } else if (isNaN(Number(montoStr)) || Number(montoStr) <= 0) {
    // Validación: monto debe ser un número positivo
    document.getElementById('inputMonto').classList.add('error');
    document.getElementById('errMonto').textContent = 'Ingresa un monto numérico mayor a 0.';
    esValido = false;
  }

  return esValido;
}

// ── FUNCIONES CRUD ──────────────────────────────

/**
 * CREAR: Crea un nuevo objeto gasto y lo agrega al arreglo.
 */
function crearGasto(categoria, monto, nombre) {
  const nuevoGasto = {
    id: contadorId++,
    categoria: categoria,
    monto: monto,
    nombre: nombre || ''
  };

  // Se agrega el objeto al arreglo de gastos
  arregloGastos.push(nuevoGasto);

  // Avisar si el monto supera el límite de seguridad
  if (monto > LIMITE_SEGURIDAD) {
    mostrarToast('⚠ Gasto supera el límite de seguridad ($2.000.000)', 'warning');
  } else {
    mostrarToast('✅ Gasto registrado correctamente.', 'success');
  }
}

/**
 * ACTUALIZAR: Modifica el gasto identificado por el ID en edición.
 */
function actualizarGasto(categoria, monto, nombre) {
  const indice = arregloGastos.findIndex(g => g.id === idEnEdicion);

  if (indice !== -1) {
    arregloGastos[indice].categoria = categoria;
    arregloGastos[indice].monto     = monto;
    arregloGastos[indice].nombre   = nombre || '';
    mostrarToast('✏️ Gasto actualizado.', 'info');
  }
}

/**
 * ELIMINAR: Remueve del arreglo el gasto con el id indicado.
 */
function eliminarGasto(idGasto) {
  arregloGastos = arregloGastos.filter(g => g.id !== idGasto);
  mostrarToast('🗑 Gasto eliminado.', 'info');
  renderizarTabla();
  actualizarResumen();
}

/**
 * LEER / CARGAR EDICIÓN: Carga los datos del gasto en el formulario para su edición.
 */
function cargarEdicion(idGasto) {
  const gasto = arregloGastos.find(g => g.id === idGasto);
  if (!gasto) return;

  document.getElementById('selectCategoria').value = gasto.categoria;
  document.getElementById('inputMonto').value      = gasto.monto;
  if (document.getElementById('inputNombre')) document.getElementById('inputNombre').value = gasto.nombre || '';

  // Activar modo edición visual
  idEnEdicion = idGasto;
  document.getElementById('cardFormulario').classList.add('editing');
  document.getElementById('btnAgregar').textContent   = '💾 Guardar Cambios';
  document.getElementById('btnCancelar').style.display = 'block';

  document.getElementById('cardFormulario').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Cancela el modo edición y resetea el formulario.
 */
function cancelarEdicion() {
  idEnEdicion = null;
  limpiarFormulario();
  document.getElementById('cardFormulario').classList.remove('editing');
  document.getElementById('btnAgregar').textContent    = '➕ Agregar Gasto';
  document.getElementById('btnCancelar').style.display = 'none';
}

// ── LÓGICA DEL BOTÓN PRINCIPAL ───────────────────

/**
 * Punto de entrada del formulario para discernir entre Creación o Edición.
 */
function manejarFormulario() {
  if (!validarFormulario()) return;

  const categoria = document.getElementById('selectCategoria').value;
  const monto     = Number(document.getElementById('inputMonto').value);
  const nombre    = document.getElementById('inputNombre') ? document.getElementById('inputNombre').value.trim() : '';

  if (idEnEdicion === null) {
    crearGasto(categoria, monto, nombre);
  } else {
    actualizarGasto(categoria, monto, nombre);
    cancelarEdicion();
  }

  renderizarTabla();
  actualizarResumen();
  limpiarFormulario();
}

// ── FUNCIONES DE RENDERIZADO Y DOM ─────────────────────

/**
 * Limpia los campos de entrada del formulario.
 */
function limpiarFormulario() {
  document.getElementById('selectCategoria').value = '';
  document.getElementById('inputMonto').value      = '';
  if (document.getElementById('inputNombre')) document.getElementById('inputNombre').value = '';
  limpiarErrores();
}

/**
 * Renderiza dinámicamente las filas de la tabla según los objetos en el arreglo.
 */
function renderizarTabla() {
  const cuerpo      = document.getElementById('cuerpoTabla');
  const estadoVacio = document.getElementById('estadoVacio');

  cuerpo.innerHTML = '';

  if (arregloGastos.length === 0) {
    estadoVacio.style.display = 'block';
    return;
  }

  estadoVacio.style.display = 'none';

  arregloGastos.forEach((gasto, indice) => {
    const supera = gasto.monto > LIMITE_SEGURIDAD;

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td style="color:var(--color-muted); font-size:.82rem;">${indice + 1}</td>
      <td>
        <span class="cat-badge ${gasto.categoria}">
          ${ICONOS_CATEGORIA[gasto.categoria]} ${gasto.categoria}
        </span>
      </td>
      <td>
        <div class="expense-name">${gasto.nombre ? gasto.nombre : '-'}</div>
      </td>
      <td>
        <span class="monto-cell ${supera ? 'warning' : ''}">
          ${formatearPeso(gasto.monto)}
        </span>
      </td>
      <td>
        <div class="action-cell">
          <button class="btn btn-edit"   onclick="cargarEdicion(${gasto.id})">✏️ Editar</button>
          <button class="btn btn-delete" onclick="eliminarGasto(${gasto.id})">🗑 Eliminar</button>
        </div>
      </td>
    `;
    cuerpo.appendChild(fila);
  });
}

/**
 * Calcula totales globales y por categoría mediante .reduce() y muta el DOM.
 */
function actualizarResumen() {
  const totalesPorCategoria = arregloGastos.reduce((acumulador, gasto) => {
    acumulador[gasto.categoria] = (acumulador[gasto.categoria] || 0) + gasto.monto;
    return acumulador;
  }, {});

  const granTotal = arregloGastos.reduce((suma, gasto) => suma + gasto.monto, 0);

  const elTotal = document.getElementById('totalAcumulado');
  elTotal.textContent = formatearPeso(granTotal);

  if (granTotal > LIMITE_SEGURIDAD) {
    elTotal.classList.add('over-limit');
  } else {
    elTotal.classList.remove('over-limit');
  }

  actualizarPill('pillTransporte',   'Transporte',   totalesPorCategoria.Transporte   || 0, '🚌', 'active-transport');
  actualizarPill('pillComida',       'Comida',        totalesPorCategoria.Comida        || 0, '🍽', 'active-comida');
  actualizarPill('pillAlojamiento',  'Alojamiento',   totalesPorCategoria.Alojamiento  || 0, '🏨', 'active-alojamiento');
  actualizarPill('pillOtros',        'Otros',         totalesPorCategoria.Otros         || 0, '🎁', 'active-otros');
}

/**
 * Modifica las clases y texto de los Pills visuales de categorías.
 */
function actualizarPill(idElemento, nombre, total, icono, claseActiva) {
  const pill = document.getElementById(idElemento);
  pill.textContent = `${icono} ${nombre}: ${formatearPeso(total)}`;

  if (total > 0) {
    pill.classList.add(claseActiva);
  } else {
    pill.classList.remove(claseActiva);
  }
}

// ── FUNCIONES AUXILIARES ──────────────────────────

/**
 * Transforma valores numéricos a formato de divisa local chilena (CLP).
 */
function formatearPeso(valor) {
  return '$' + valor.toLocaleString('es-CL');
}

let timerToast = null;
/**
 * Levanta un Toast emergente de aviso en el frontend.
 */
function mostrarToast(mensaje, tipo = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `show ${tipo}`;

  if (timerToast) clearTimeout(timerToast);
  timerToast = setTimeout(() => {
    toast.className = '';
  }, 3000);
}

// ── ESCUCHADORES DE EVENTOS (LISTENERS) ───────────────────────────────────

document.getElementById('inputMonto').addEventListener('blur', function () {
  const val = this.value.trim();
  if (val === '') return;
  if (isNaN(Number(val)) || Number(val) <= 0) {
    this.classList.add('error');
    document.getElementById('errMonto').textContent = 'Ingresa un monto numérico mayor a 0.';
  } else {
    this.classList.remove('error');
    document.getElementById('errMonto').textContent = '';
  }
});

document.getElementById('selectCategoria').addEventListener('change', function () {
  if (this.value) {
    this.classList.remove('error');
    document.getElementById('errCategoria').textContent = '';
  }
});

document.getElementById('inputMonto').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') manejarFormulario();
});

// ── INICIALIZACIÓN INMEDIATA ────────────────────────────────
(function inicializar() {
  renderizarTabla();
  actualizarResumen();
})();
