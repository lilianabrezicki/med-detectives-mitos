/* =========================================================================
   DETECTIVES DE MITOS — nav.js
   Estructura de navegación lineal progresiva, migas de pan, barra de progreso,
   glosario contextual (ventanas emergentes) y utilidades de accesibilidad.
   ========================================================================= */

const MED_PAGINAS = [
  { slug:'inicio',                archivo:'index.html',                  titulo:'Inicio: Cuartel General',        icono:'🏢' },
  { slug:'mision-reclutamiento',  archivo:'mision-reclutamiento.html',   titulo:'Misión de Reclutamiento',        icono:'🗂️' },
  { slug:'objetivos',             archivo:'objetivos.html',               titulo:'Hoja de Ruta (Objetivos)',       icono:'🧭' },
  { slug:'mapa-conceptual',       archivo:'mapa-conceptual.html',         titulo:'Tablero de Investigación',      icono:'🗺️' },
  { slug:'galeria-heroes',        archivo:'galeria-heroes.html',          titulo:'Galería de Sospechosos',        icono:'🖼️' },
  { slug:'viaje-del-heroe',       archivo:'viaje-del-heroe.html',         titulo:'Las Huellas del Camino',        icono:'🥾' },
  { slug:'caso-hercules',         archivo:'caso-hercules.html',           titulo:'El Caso Hércules',              icono:'🦁' },
  { slug:'detective-gramatical',  archivo:'detective-gramatical.html',    titulo:'Laboratorio Gramatical',        icono:'🧪' },
  { slug:'informe-final',         archivo:'informe-final.html',           titulo:'Informe del Caso',              icono:'📝' },
  { slug:'autoevaluacion',        archivo:'autoevaluacion.html',          titulo:'Control de Calidad (Rúbrica)',  icono:'✅' },
  { slug:'produccion-final',      archivo:'produccion-final.html',        titulo:'Entrega del Expediente',        icono:'📤' },
  { slug:'creditos',              archivo:'creditos.html',                titulo:'Créditos del Caso',             icono:'🎖️' },
];

/* =========================================================================
   Sesión de detectives (multi-usuario)
   Cada detective tiene su propio expediente (progreso y logros), guardado
   de forma independiente en localStorage bajo una clave propia.
   ========================================================================= */
const MED_KEY_DETECTIVE_ACTIVO   = 'medDetectiveActivo';
const MED_KEY_LISTA_DETECTIVES   = 'medDetectivesLista';
let MED_SLUG_ACTUAL = null;

function medClaveDatosDetective(nombre){
  return 'medDatosDetective__' + nombre;
}

function medObtenerListaDetectives(){
  try{
    const lista = JSON.parse(localStorage.getItem(MED_KEY_LISTA_DETECTIVES) || '[]');
    return Array.isArray(lista) ? lista : [];
  }catch(e){ return []; }
}
function medGuardarListaDetectives(lista){
  try{ localStorage.setItem(MED_KEY_LISTA_DETECTIVES, JSON.stringify(lista)); }catch(e){ /* no disponible */ }
}
function medRegistrarDetective(nombre){
  const lista = medObtenerListaDetectives();
  if(!lista.includes(nombre)){
    lista.push(nombre);
    medGuardarListaDetectives(lista);
  }
}

function medObtenerDetectiveActivo(){
  return localStorage.getItem(MED_KEY_DETECTIVE_ACTIVO) || null;
}
function medEstablecerDetectiveActivo(nombre){
  nombre = (nombre || '').trim();
  if(!nombre) return;
  try{ localStorage.setItem(MED_KEY_DETECTIVE_ACTIVO, nombre); }catch(e){}
  medRegistrarDetective(nombre);
  medDispararEventoDetective();
}
function medCerrarSesionDetective(){
  try{ localStorage.removeItem(MED_KEY_DETECTIVE_ACTIVO); }catch(e){}
  medDispararEventoDetective();
}
function medDispararEventoDetective(){
  document.dispatchEvent(new CustomEvent('medDetectiveCambiado', { detail:{ detective: medObtenerDetectiveActivo() } }));
}
function medEscaparHtml(texto){
  const d = document.createElement('div');
  d.textContent = texto;
  return d.innerHTML;
}

/* ---------- Expediente (progreso + logros) del detective activo ---------- */
function medObtenerProgreso(){
  const activo = medObtenerDetectiveActivo();
  if(!activo) return {};
  try{
    const datos = JSON.parse(localStorage.getItem(medClaveDatosDetective(activo)) || '{}');
    return datos && typeof datos === 'object' ? datos : {};
  }catch(e){ return {}; }
}
function medGuardarProgreso(datos){
  const activo = medObtenerDetectiveActivo();
  if(!activo) return; /* sin detective identificado no se guarda nada */
  try{ localStorage.setItem(medClaveDatosDetective(activo), JSON.stringify(datos)); }catch(e){ /* almacenamiento no disponible */ }
}
function medMarcarPaginaVisitada(slug){
  const datos = medObtenerProgreso();
  if(!datos.visitadas) datos.visitadas = {};
  datos.visitadas[slug] = true;
  medGuardarProgreso(datos);
}
function medMarcarLogro(clave){
  const datos = medObtenerProgreso();
  if(!datos.logros) datos.logros = {};
  datos.logros[clave] = true;
  medGuardarProgreso(datos);
}
function medTieneLogro(clave){
  const datos = medObtenerProgreso();
  return !!(datos.logros && datos.logros[clave]);
}

function medObtenerDatosDetectivePorNombre(nombre){
  try{
    const datos = JSON.parse(localStorage.getItem(medClaveDatosDetective(nombre)) || '{}');
    return datos && typeof datos === 'object' ? datos : {};
  }catch(e){ return {}; }
}
/* Un detective "ya superó el caso" cuando llegó a entregar su expediente final
   (Producción Final), que es el logro que cierra formalmente la investigación.
   Se usa para impedir que otra persona reutilice ese nombre por error. */
function medDetectiveCompletoCaso(nombre){
  const datos = medObtenerDatosDetectivePorNombre(nombre);
  return !!(datos.logros && datos.logros['entrega-final']);
}

/* =========================================================================
   Registro genérico de respuestas (para el informe final descargable)
   Cada campo se guarda como { etiqueta, valor, fecha } bajo
   datos.respuestas[slug][idDelCampo]. Funciona en CUALQUIER página que use
   textarea/select/input/checkbox/radio con id, sin necesitar código
   específico por actividad.
   ========================================================================= */
function medEtiquetaParaCampo(el){
  if(el.id){
    const label = document.querySelector(`label[for="${el.id}"]`);
    if(label) return label.textContent.replace(/\s+/g,' ').trim();
  }
  if(el.name){
    const fila = el.closest('tr');
    const th = fila && fila.querySelector('th[scope="row"]');
    if(th) return th.textContent.replace(/\s+/g,' ').trim();
    const fieldset = el.closest('fieldset');
    const legend = fieldset && fieldset.querySelector('legend');
    if(legend) return legend.textContent.replace(/\s+/g,' ').trim();
  }
  if(el.getAttribute('aria-label')) return el.getAttribute('aria-label');
  const actividad = el.closest('.actividad');
  const titulo = actividad && actividad.querySelector('.actividad__titulo');
  if(titulo) return titulo.textContent.replace(/\s+/g,' ').trim() + (el.id ? ` (${el.id})` : '');
  return el.id || el.name || 'Respuesta';
}

function medGuardarRespuesta(slug, clave, etiqueta, valor){
  if(!slug || !clave) return;
  const datos = medObtenerProgreso();
  if(!datos.respuestas) datos.respuestas = {};
  if(!datos.respuestas[slug]) datos.respuestas[slug] = {};
  datos.respuestas[slug][clave] = { etiqueta, valor, fecha:new Date().toISOString() };
  medGuardarProgreso(datos);
}

function medRestaurarRespuestas(slug){
  const datos = medObtenerProgreso();
  const guardadas = (datos.respuestas && datos.respuestas[slug]) || {};
  Object.keys(guardadas).forEach(clave => {
    const valor = guardadas[clave].valor;
    const porId = document.getElementById(clave);
    if(porId){
      if(porId.tagName === 'SELECT' || porId.tagName === 'TEXTAREA' ||
         (porId.tagName === 'INPUT' && (porId.type === 'text'))){
        porId.value = valor;
      } else if(porId.tagName === 'INPUT' && porId.type === 'checkbox'){
        porId.checked = (valor === 'Sí');
      }
      return;
    }
    /* Grupos de radios: la clave es el atributo name; el valor guardado es el texto de la etiqueta elegida */
    const radios = document.querySelectorAll(`input[type="radio"][name="${clave}"]`);
    radios.forEach(r => {
      const etiquetaLabel = r.closest('label');
      const textoOpcion = etiquetaLabel ? etiquetaLabel.textContent.replace(/\s+/g,' ').trim() : r.value;
      r.checked = (textoOpcion === valor);
    });
  });
}

function medConfigurarAutoguardado(slug){
  const contenedor = document.getElementById('contenido') || document.body;

  contenedor.querySelectorAll('textarea[id], select[id], input[type="text"][id]').forEach(el => {
    const evento = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evento, () => medGuardarRespuesta(slug, el.id, medEtiquetaParaCampo(el), el.value));
  });

  contenedor.querySelectorAll('input[type="checkbox"][id]').forEach(el => {
    el.addEventListener('change', () => medGuardarRespuesta(slug, el.id, medEtiquetaParaCampo(el), el.checked ? 'Sí' : 'No'));
  });

  const nombresRadio = new Set();
  contenedor.querySelectorAll('input[type="radio"][name]').forEach(el => nombresRadio.add(el.name));
  nombresRadio.forEach(nombre => {
    contenedor.querySelectorAll(`input[type="radio"][name="${nombre}"]`).forEach(el => {
      el.addEventListener('change', () => {
        const marcado = contenedor.querySelector(`input[type="radio"][name="${nombre}"]:checked`);
        if(!marcado) return;
        const etiquetaLabel = marcado.closest('label');
        const textoElegido = etiquetaLabel ? etiquetaLabel.textContent.replace(/\s+/g,' ').trim() : marcado.value;
        medGuardarRespuesta(slug, nombre, medEtiquetaParaCampo(marcado), textoElegido);
      });
    });
  });

  medRestaurarRespuestas(slug);
}

/* =========================================================================
   Informe final descargable (.txt) — reúne todas las respuestas guardadas
   de TODAS las pantallas visitadas por el detective activo.
   ========================================================================= */
function medGenerarInformeTexto(){
  const detective = medObtenerDetectiveActivo() || 'Detective sin identificar';
  const datos = medObtenerProgreso();
  const visitadas = datos.visitadas || {};
  const logros = datos.logros || {};
  const respuestas = datos.respuestas || {};
  const total = MED_PAGINAS.length;
  const hechas = MED_PAGINAS.filter(p => visitadas[p.slug]).length;

  let out = '';
  out += '======================================================\n';
  out += ' EXPEDIENTE DE INVESTIGACIÓN — DETECTIVES DE MITOS\n';
  out += '======================================================\n';
  out += `Detective: ${detective}\n`;
  out += `Fecha de generación: ${new Date().toLocaleString('es-AR')}\n`;
  out += `Misiones completadas: ${hechas} de ${total}\n\n`;

  MED_PAGINAS.forEach(p => {
    const camposPagina = respuestas[p.slug];
    const visitoPagina = visitadas[p.slug];
    if(!visitoPagina && !camposPagina) return;
    out += `------------------------------------------------------\n`;
    out += `${p.icono} ${p.titulo}\n`;
    out += `------------------------------------------------------\n`;
    if(camposPagina && Object.keys(camposPagina).length){
      Object.values(camposPagina).forEach(campo => {
        const vacio = campo.valor === '' || campo.valor === null || campo.valor === undefined;
        const valorTexto = vacio ? '(sin completar)' : String(campo.valor);
        out += `• ${campo.etiqueta}:\n  ${valorTexto}\n\n`;
      });
    } else {
      out += '(Pantalla visitada, sin respuestas registradas)\n\n';
    }
  });

  const listaLogros = Object.keys(logros);
  out += '======================================================\n';
  out += ` LOGROS OBTENIDOS (${listaLogros.length})\n`;
  out += '======================================================\n';
  out += listaLogros.length ? listaLogros.map(l => `✔ ${l}`).join('\n') : '(Sin logros registrados todavía)';
  out += '\n';
  return out;
}

function medNombreArchivoExpediente(){
  const detective = medObtenerDetectiveActivo() || 'sin-identificar';
  const limpio = detective.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\-]+/g,'_');
  return `Expediente_${limpio}_${new Date().toISOString().slice(0,10)}.txt`;
}

function medDescargarInformeTexto(){
  const nombreArchivo = medNombreArchivoExpediente();
  const contenido = medGenerarInformeTexto();
  const blob = new Blob([contenido], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombreArchivo;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return nombreArchivo;
}

function medRenderizarNav(slugActual){
  const cont = document.getElementById('expediente-nav-lista');
  if(!cont) return;
  const progreso = medObtenerProgreso();
  const visitadas = progreso.visitadas || {};
  cont.innerHTML = MED_PAGINAS.map((p, i) => {
    const activo = p.slug === slugActual ? ' activo' : '';
    const hecho = visitadas[p.slug] ? ' hecho' : '';
    const aria = p.slug === slugActual ? ' aria-current="page"' : '';
    return `<li><a class="${activo.trim()}" href="${p.archivo}"${aria}>
      <span aria-hidden="true">${p.icono}</span> ${i+1}. ${p.titulo}
      <span class="sello-check${hecho}"></span>
    </a></li>`;
  }).join('');
}

function medRenderizarMapaRuta(slugActual){
  const cont = document.getElementById('mapa-ruta');
  if(!cont) return;
  const progreso = medObtenerProgreso();
  const visitadas = progreso.visitadas || {};
  cont.innerHTML = MED_PAGINAS.map((p, i) => {
    let estado = 'pendiente';
    if(visitadas[p.slug]) estado = 'hecho';
    if(p.slug === slugActual) estado = 'actual';
    const esUltimo = i === MED_PAGINAS.length - 1;
    return `
      <a class="paso-ruta paso-ruta--${estado}" href="${p.archivo}" role="listitem" ${p.slug === slugActual ? 'aria-current="page"' : ''}>
        <span class="paso-ruta__nodo">
          <span aria-hidden="true">${p.icono}</span>
          <span class="paso-ruta__numero">${i+1}</span>
        </span>
        <span class="paso-ruta__titulo">${p.titulo}${p.slug === slugActual ? ' <em>(estás aquí)</em>' : ''}</span>
      </a>
      ${!esUltimo ? '<span class="paso-ruta__conector" aria-hidden="true"></span>' : ''}
    `;
  }).join('');
}

function medRenderizarBreadcrumbs(slugActual){
  const cont = document.getElementById('breadcrumbs-lista');
  if(!cont) return;
  const idx = MED_PAGINAS.findIndex(p => p.slug === slugActual);
  const pagina = MED_PAGINAS[idx];
  cont.innerHTML = `
    <li><a href="index.html"> 🏢 Inicio</a></li> 
    ${idx > 0 ? `<li><span aria-hidden="true">${pagina.icono}</span> <span aria-current="page">${pagina.titulo}</span></li>` : `<li aria-current="page">Cuartel General</li>`}
  `; 
}

function medActualizarProgreso(slugActual){
  medMarcarPaginaVisitada(slugActual);
  const progreso = medObtenerProgreso();
  const visitadas = progreso.visitadas || {};
  const total = MED_PAGINAS.length;
  const hechas = MED_PAGINAS.filter(p => visitadas[p.slug]).length;
  const pct = Math.round((hechas/total)*100);
  const barra = document.getElementById('progreso-barra');
  const texto = document.getElementById('progreso-texto');
  if(barra){ barra.style.width = pct + '%'; barra.setAttribute('aria-valuenow', String(pct)); }
  if(texto){ texto.textContent = `Expediente completado: ${hechas} de ${total} misiones (${pct}%)`; }
  medRenderizarNav(slugActual);
  medRenderizarMapaRuta(slugActual);
}

function medConfigurarNavegacionPasos(slugActual){
  const idx = MED_PAGINAS.findIndex(p => p.slug === slugActual);
  const anterior = document.getElementById('nav-anterior');
  const siguiente = document.getElementById('nav-siguiente');
  if(anterior){
    if(idx > 0){
      anterior.href = MED_PAGINAS[idx-1].archivo;
      anterior.textContent = `⟵ ${MED_PAGINAS[idx-1].titulo}`;
    } else { anterior.style.visibility = 'hidden'; }
  }
  if(siguiente){
    if(idx < MED_PAGINAS.length - 1){
      siguiente.href = MED_PAGINAS[idx+1].archivo;
      siguiente.textContent = `${MED_PAGINAS[idx+1].titulo} ⟶`;
    } else { siguiente.style.visibility = 'hidden'; }
  }
}

/* ---------------- Glosario contextual (ventanas emergentes) ---------------- */
const MED_GLOSARIO = {
  monomito: {
    termino:'Monomito',
    texto:'Estructura narrativa descrita por Joseph Campbell, presente en mitos de muchas culturas. Describe el "Viaje del Héroe" en 12 etapas. Hoy trabajaremos las cinco etapas principales: la Llamada, la Ayuda, las Pruebas, la Recompensa y el Retorno.'
  },
  nemea:{
    termino:'Nemea',
    texto:'Región de la antigua Grecia donde, según el mito, habitaba el León de Nemea: una fiera de piel invulnerable que Hércules debía derrotar como su primer trabajo.'
  },
  adjetivo:{
    termino:'Adjetivo',
    texto:'Categoría gramatical que acompaña al sustantivo para describir una cualidad: "feroz", "invulnerable", "valiente". Un buen detective usa adjetivos precisos para caracterizar a sus sospechosos y héroes.'
  },
  verbo:{
    termino:'Verbo',
    texto:'Categoría gramatical que expresa acciones, procesos o estados: "rugir", "disparar", "transformarse". En el relato, los verbos muestran lo que el héroe hace y cómo cambia.'
  },
  construccion_nominal:{
    termino:'Construcción nominal',
    texto:'Grupo de palabras organizado alrededor de un sustantivo (por ejemplo "el guerrero de piel invulnerable") que amplía la información sobre un personaje u objeto.'
  },
  heroe:{
    termino:'Héroe / Heroína',
    texto:'Figura, real o ficticia, que se distingue por actuar con valentía, sacrificio o sabiduría en beneficio de otros, y cuyos rasgos valorados cambian según la época y la cultura.',
    imagenRAE:'img/RAE.webp'
  },
  caracterizacion:{
    termino:'Caracterización',
    texto:'Conjunto de recursos (adjetivos, acciones, diálogos) que un autor usa para construir la personalidad y apariencia de un personaje.'
  },
  cohesion:{
    termino:'Cohesión textual',
    texto:'Propiedad de un texto en la que las ideas se conectan de forma lógica mediante conectores, pronombres y un orden claro, evitando saltos que confundan al lector.'
  },
  adecuacion:{
    termino:'Adecuación',
    texto:'Ajuste del lenguaje, el registro y el contenido de un texto al propósito y al destinatario para el que fue escrito.'
  }
};

function medAbrirGlosario(clave){
  const datos = MED_GLOSARIO[clave];
  if(!datos) return;
  const overlay = document.getElementById('modal-glosario');
  const titulo = document.getElementById('modal-glosario-titulo');
  const texto = document.getElementById('modal-glosario-texto');
  if(!overlay || !titulo || !texto) return;
  titulo.textContent = '🔍 ' + datos.termino;
  texto.textContent = datos.texto;

  /* Enlace opcional a la definición de la RAE (abre una captura/imagen, no un sitio externo) */
  const enlacePrevio = document.getElementById('modal-glosario-enlace-rae');
  if(enlacePrevio) enlacePrevio.remove();
  if(datos.imagenRAE){
    const enlace = document.createElement('button');
    enlace.type = 'button';
    enlace.id = 'modal-glosario-enlace-rae';
    enlace.className = 'enlace-rae';
    enlace.textContent = '📖 Ver definición completa en la RAE';
    enlace.addEventListener('click', () => medAbrirImagenRAE(datos.imagenRAE, datos.termino));
    texto.insertAdjacentElement('afterend', enlace);
  }

  overlay.classList.add('abierto');
  overlay.querySelector('.modal-caja').focus();
}
function medCerrarGlosario(){
  const overlay = document.getElementById('modal-glosario');
  if(overlay) overlay.classList.remove('abierto');
}

/* ---------------- Visor de imagen de la RAE (modal creado dinámicamente) ---------------- */
function medAsegurarModalImagenRAE(){
  if(document.getElementById('modal-imagen-rae')) return;

  if(!document.getElementById('estilos-enlace-rae')){
    const estilo = document.createElement('style');
    estilo.id = 'estilos-enlace-rae';
    estilo.textContent = `
      .enlace-rae{
        display:inline-block;
        margin-top:.75rem;
        padding:.5rem 1rem;
        background:#1A237E;
        color:#F5F1E3;
        border:none;
        border-radius:6px;
        font-size:.95rem;
        cursor:pointer;
      }
      .enlace-rae:hover, .enlace-rae:focus{ background:#283593; }
      .modal-caja--imagen-rae{ max-width:min(90vw, 700px); }
      .modal-caja--imagen-rae img{ max-width:100%; height:auto; display:block; border-radius:4px; }
      .modal-caja--imagen-rae figcaption{ margin-top:.5rem; font-size:.85rem; color:#555; }
    `;
    document.head.appendChild(estilo);
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-imagen-rae';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','modal-imagen-rae-titulo');
  overlay.innerHTML = `
    <div class="modal-caja modal-caja--imagen-rae" tabindex="-1">
      <button class="modal-cerrar" id="modal-imagen-rae-cerrar" aria-label="Cerrar ventana">✕</button>
      <h3 id="modal-imagen-rae-titulo"></h3>
      <figure>
        <img id="modal-imagen-rae-img" src="" alt="">
        <figcaption>Fuente: Diccionario de la lengua española, Real Academia Española (RAE).</figcaption>
      </figure>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('modal-imagen-rae-cerrar').addEventListener('click', medCerrarImagenRAE);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) medCerrarImagenRAE(); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') medCerrarImagenRAE(); });
}

function medAbrirImagenRAE(ruta, termino){
  medAsegurarModalImagenRAE();
  const overlay = document.getElementById('modal-imagen-rae');
  const titulo = document.getElementById('modal-imagen-rae-titulo');
  const img = document.getElementById('modal-imagen-rae-img');
  titulo.textContent = '📖 RAE — ' + termino;
  img.src = ruta;
  img.alt = 'Captura de la definición de "' + termino + '" en el Diccionario de la RAE';
  overlay.classList.add('abierto');
  overlay.querySelector('.modal-caja').focus();
}

function medCerrarImagenRAE(){
  const overlay = document.getElementById('modal-imagen-rae');
  if(overlay) overlay.classList.remove('abierto');
}

/* ---------------- Barra de detective (identidad / cambiar / cerrar sesión) ---------------- */
function medRenderizarBarraDetective(){
  const acciones = document.querySelector('.med-header__acciones');
  if(!acciones) return;
  let barra = document.getElementById('detective-barra');
  if(!barra){
    barra = document.createElement('div');
    barra.className = 'detective-barra';
    barra.id = 'detective-barra';
    acciones.appendChild(barra);
  }
  const activo = medObtenerDetectiveActivo();
  if(activo){
    barra.innerHTML = `
      <span class="detective-barra__nombre">🕵️ Detective: <strong>${medEscaparHtml(activo)}</strong></span>
      <button class="btn-detective-accion" id="btn-cambiar-detective" type="button">🔄 Cambiar</button>
      <button class="btn-detective-accion" id="btn-cerrar-sesion-detective" type="button">🚪 Cerrar sesión</button>
    `;
    const btnCambiar = document.getElementById('btn-cambiar-detective');
    const btnCerrar = document.getElementById('btn-cerrar-sesion-detective');
    if(btnCambiar) btnCambiar.addEventListener('click', () => medAbrirModalDetective(false));
    if(btnCerrar) btnCerrar.addEventListener('click', () => {
      if(confirm(`¿Cerrar sesión de detective ${activo}? Tu expediente queda guardado y podrás volver a elegirlo cuando quieras.`)){
        medCerrarSesionDetective();
        medAbrirModalDetective(true);
      }
    });
  } else {
    barra.innerHTML = '';
  }
}

/* ---------------- Modal de identificación de detective ---------------- */
function medAsegurarModalDetective(){
  if(document.getElementById('modal-detective')) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-detective';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','modal-detective-titulo');
  overlay.innerHTML = `
    <div class="modal-caja modal-caja--detective" tabindex="-1">
      <button class="modal-cerrar" id="modal-detective-cerrar" aria-label="Cerrar ventana">✕</button>
      <h3 id="modal-detective-titulo">🕵️ Identifícate, detective</h3>
      <p>Escribe tu nombre para abrir tu propio expediente de investigación, o elige un/a detective que ya participó en este caso.</p>
      <div class="detective-form">
        <label for="input-nombre-detective">Nombre del detective:</label>
        <input type="text" id="input-nombre-detective" autocomplete="off" placeholder="Ej.: Ana, Marcos...">
        <button class="btn btn-dorado" id="btn-confirmar-detective" type="button">Abrir expediente</button>
      </div>
      <div class="feedback incorrecto" id="detective-aviso" role="alert" aria-live="polite" style="display:none;"></div>
      <div class="detective-lista-existentes" id="detective-lista-existentes"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('modal-detective-cerrar').addEventListener('click', medCerrarModalDetective);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) medCerrarModalDetective(); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') medCerrarModalDetective(); });

  document.getElementById('btn-confirmar-detective').addEventListener('click', () => {
    const input = document.getElementById('input-nombre-detective');
    const nombre = input.value.trim();
    if(!nombre){ medMostrarAvisoDetective('Por favor, escribe tu nombre de detective.'); return; }
    if(medDetectiveCompletoCaso(nombre)){
      medMostrarAvisoDetective(`El/la detective "${nombre}" ya resolvió por completo este caso (su expediente fue entregado). Si esa investigación es tuya, ya está archivada y no hace falta reabrirla. Si eres otra persona, elige un nombre distinto para abrir tu propio expediente.`);
      return;
    }
    medOcultarAvisoDetective();
    medEstablecerDetectiveActivo(nombre);
    medCerrarModalDetective(true);
    medRefrescarSesionUI();
  });
  document.getElementById('input-nombre-detective').addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); document.getElementById('btn-confirmar-detective').click(); }
  });
  document.getElementById('input-nombre-detective').addEventListener('input', medOcultarAvisoDetective);
}

function medMostrarAvisoDetective(mensaje){
  const aviso = document.getElementById('detective-aviso');
  if(!aviso) return;
  aviso.textContent = mensaje;
  aviso.style.display = 'flex';
}
function medOcultarAvisoDetective(){
  const aviso = document.getElementById('detective-aviso');
  if(!aviso) return;
  aviso.style.display = 'none';
  aviso.textContent = '';
}

function medCerrarModalDetective(forzar){
  const overlay = document.getElementById('modal-detective');
  if(!overlay) return;
  /* Si la identificación es obligatoria (aún no hay detective activo), no se puede cerrar sin elegir uno */
  if(!forzar && overlay.dataset.obligatorio === 'true' && !medObtenerDetectiveActivo()) return;
  overlay.classList.remove('abierto');
}

function medAbrirModalDetective(obligatorio){
  medAsegurarModalDetective();
  const overlay = document.getElementById('modal-detective');
  overlay.dataset.obligatorio = obligatorio ? 'true' : 'false';
  const cerrarBtn = document.getElementById('modal-detective-cerrar');
  if(cerrarBtn) cerrarBtn.style.display = obligatorio ? 'none' : '';

  const listaCont = document.getElementById('detective-lista-existentes');
  const lista = medObtenerListaDetectives();
  if(lista.length){
    listaCont.innerHTML = '<p class="detective-lista-titulo">📋 Detectives existentes — toca para continuar sin escribir de nuevo tu nombre:</p>' +
      lista.map(n => {
        const completo = medDetectiveCompletoCaso(n);
        const claseExtra = completo ? ' detective-chip--resuelto' : '';
        const etiqueta = completo ? ` <span class="detective-chip__sello">✅ Caso resuelto</span>` : '';
        return `<button class="detective-chip${claseExtra}" data-nombre="${medEscaparHtml(n)}" data-resuelto="${completo ? 'true' : 'false'}" type="button">🕵️ ${medEscaparHtml(n)}${etiqueta}</button>`;
      }).join('');
    listaCont.querySelectorAll('.detective-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const nombre = btn.dataset.nombre;
        if(btn.dataset.resuelto === 'true'){
          medMostrarAvisoDetective(`El/la detective "${nombre}" ya resolvió por completo este caso (su expediente fue entregado). Si esa investigación es tuya, ya está archivada. Si eres otra persona, escribe un nombre distinto arriba para abrir tu propio expediente.`);
          return;
        }
        medOcultarAvisoDetective();
        medEstablecerDetectiveActivo(nombre);
        medCerrarModalDetective(true);
        medRefrescarSesionUI();
      });
    });
  } else {
    listaCont.innerHTML = '';
  }
  const input = document.getElementById('input-nombre-detective');
  if(input) input.value = '';
  medOcultarAvisoDetective();
  overlay.classList.add('abierto');
  const caja = overlay.querySelector('.modal-caja');
  if(caja) caja.focus();
}

function medRefrescarSesionUI(){
  medRenderizarBarraDetective();
  if(MED_SLUG_ACTUAL){
    medActualizarProgreso(MED_SLUG_ACTUAL);
    medConfigurarAutoguardado(MED_SLUG_ACTUAL);
  }
}

/* ---------------- Botón de ayuda flotante ---------------- */
function medMostrarAyuda(mensaje){
  alert('🔎 Pistas de Detective\n\n' + mensaje);
}

/* ---------------- Narración / audio simulado ---------------- */
function medAlternarAudio(boton, textoGuion){
  const activo = boton.getAttribute('aria-pressed') === 'true';
  if(activo){
    boton.setAttribute('aria-pressed','false');
    boton.innerHTML = '🔊 Escuchar audio';
    window.speechSynthesis && window.speechSynthesis.cancel();
  } else {
    boton.setAttribute('aria-pressed','true');
    boton.innerHTML = '⏸️ Detener audio';
    if('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(textoGuion);
      u.lang = 'es-ES';
      u.onend = () => { boton.setAttribute('aria-pressed','false'); boton.innerHTML = '🔊 Escuchar audio'; };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }
}

/* ---------------- Inicialización común ---------------- */
function medInicializarPagina(slugActual){
  document.addEventListener('DOMContentLoaded', () => {
    MED_SLUG_ACTUAL = slugActual;

    medRenderizarBarraDetective();
    medRenderizarNav(slugActual);
    medRenderizarBreadcrumbs(slugActual);
    medRenderizarMapaRuta(slugActual);
    medActualizarProgreso(slugActual);
    medConfigurarNavegacionPasos(slugActual);
    medConfigurarAutoguardado(slugActual);

    /* Identificación del detective al principio: si no hay nadie identificado
       todavía, se abre el expediente de ingreso (obligatorio) antes de continuar.
       En la pantalla de Inicio (Cuartel General), la identificación se pide
       SIEMPRE: si había una sesión activa de una visita anterior, se cierra
       primero, para que cada vez que se inicia el MED se elija/confirme el
       detective de nuevo. */
    if(slugActual === 'inicio'){
      if(medObtenerDetectiveActivo()){
        medCerrarSesionDetective();
        medRenderizarBarraDetective();
      }
      medAbrirModalDetective(true);
    } else if(!medObtenerDetectiveActivo()){
      medAbrirModalDetective(true);
    }

    const overlay = document.getElementById('modal-glosario');
    if(overlay){
      overlay.addEventListener('click', (e) => { if(e.target === overlay) medCerrarGlosario(); });
      document.addEventListener('keydown', (e) => { if(e.key === 'Escape') medCerrarGlosario(); });
    }
  });
}
