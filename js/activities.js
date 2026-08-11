/* =========================================================================
   DETECTIVES DE MITOS — activities.js
   Motor genérico de actividades: usado por todas las páginas del MED.
   Todas las funciones producen retroalimentación ELABORATIVA (nunca un simple
   "correcto/incorrecto"): explican el porqué y, cuando aplica, enlazan de
   vuelta al contenido correspondiente.
   ========================================================================= */

/* ---------- Utilidad genérica de feedback ---------- */
function medMostrarFeedback(idFeedback, esCorrecto, textoCorrecto, textoIncorrecto){
  const el = document.getElementById(idFeedback);
  if(!el) return;
  el.classList.remove('correcto','incorrecto');
  el.classList.add('mostrar', esCorrecto ? 'correcto' : 'incorrecto');
  el.innerHTML = `<span class="feedback__icono" aria-hidden="true">${esCorrecto ? '🟢' : '🔎'}</span>
    <span>${esCorrecto ? textoCorrecto : textoIncorrecto}</span>`;
  el.setAttribute('role','status');
  el.scrollIntoView({behavior:'smooth', block:'nearest'});
}
/* Nota: el registro de progreso y logros por detective se gestiona de forma
   centralizada en nav.js (medMarcarPaginaVisitada / medMarcarLogro), que ya
   guarda los datos en el expediente independiente del detective activo. */

/* ---------- Opción múltiple / Verdadero-Falso ---------- */
function medConfigurarOpcionMultiple(idContenedor, idFeedback, correctaValor, textoCorrecto, textoIncorrecto, logroClave){
  const cont = document.getElementById(idContenedor);
  if(!cont) return;
  const botones = cont.querySelectorAll('.opcion-btn');
  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      botones.forEach(b => b.disabled = true);
      const esCorrecta = btn.dataset.valor === correctaValor;
      botones.forEach(b => {
        if(b.dataset.valor === correctaValor) b.classList.add('correcta');
        else if(b === btn) b.classList.add('incorrecta');
      });
      medMostrarFeedback(idFeedback, esCorrecta, textoCorrecto, textoIncorrecto);
      if(typeof MED_SLUG_ACTUAL !== 'undefined' && MED_SLUG_ACTUAL){
        medGuardarRespuesta(MED_SLUG_ACTUAL, idContenedor, medEtiquetaParaCampo(cont) || 'Opción elegida',
          btn.textContent.trim() + (esCorrecta ? ' (correcta)' : ' (incorrecta)'));
      }
      if(esCorrecta && logroClave) medMarcarLogro(logroClave);
    });
  });
}

/* ---------- Detector heurístico de adjetivos en español ----------
   No existe un analizador gramatical real en el navegador, así que esta
   función combina (a) un diccionario de adjetivos frecuentes y pertinentes
   al tema del caso (cualidades físicas, de carácter y de peligrosidad) con
   (b) un conjunto reducido de sufijos que en español casi siempre marcan un
   adjetivo (-oso/-osa, -ico/-ica, -ivo/-iva, -ante, -ente, -ible, -able).
   Es una aproximación pedagógica, no un análisis morfosintáctico exacto:
   por eso el feedback siempre muestra qué palabras detectó, para que el
   propio estudiante pueda revisar y corregir si el sistema se equivocó. */
const MED_DICCIONARIO_ADJETIVOS = new Set([
  'fuerte','fuertes','débil','débiles','enorme','enormes','gigante','gigantes',
  'pequeño','pequeña','pequeños','pequeñas','alto','alta','altos','altas',
  'bajo','baja','bajos','bajas','ágil','ágiles','veloz','veloces',
  'rápido','rápida','rápidos','rápidas','lento','lenta','lentos','lentas',
  'robusto','robusta','musculoso','musculosa','delgado','delgada',
  'joven','jóvenes','anciano','anciana','ancianos','ancianas',
  'hermoso','hermosa','hermosos','hermosas','feo','fea','feos','feas',
  'invulnerable','invulnerables','poderoso','poderosa','poderosos','poderosas',
  'valiente','valientes','valeroso','valerosa','valerosos','valerosas',
  'audaz','audaces','intrépido','intrépida','intrépidos','intrépidas',
  'astuto','astuta','astutos','astutas','sabio','sabia','sabios','sabias',
  'inteligente','inteligentes','ingenioso','ingeniosa','ingeniosos','ingeniosas',
  'leal','leales','fiel','fieles','honesto','honesta','honestos','honestas',
  'justo','justa','justos','justas','generoso','generosa','generosos','generosas',
  'solidario','solidaria','solidarios','solidarias','compasivo','compasiva','compasivos','compasivas',
  'empático','empática','empáticos','empáticas','altruista','altruistas',
  'humilde','humildes','noble','nobles','comprometido','comprometida','comprometidos','comprometidas',
  'decidido','decidida','decididos','decididas','perseverante','perseverantes',
  'tenaz','tenaces','paciente','pacientes','amable','amables','gentil','gentiles',
  'carismático','carismática','carismáticos','carismáticas',
  'protector','protectora','protectores','protectoras',
  'responsable','responsables','disciplinado','disciplinada','disciplinados','disciplinadas',
  'curioso','curiosa','curiosos','curiosas','creativo','creativa','creativos','creativas',
  'extrovertido','extrovertida','tímido','tímida','tímidos','tímidas',
  'feroz','feroces','temible','temibles','salvaje','salvajes',
  'peligroso','peligrosa','peligrosos','peligrosas',
  'misterioso','misteriosa','misteriosos','misteriosas',
  'oscuro','oscura','oscuros','oscuras','luminoso','luminosa','luminosos','luminosas',
  'brillante','brillantes','silencioso','silenciosa','silenciosos','silenciosas',
  'indestructible','indestructibles','resistente','resistentes',
  'implacable','implacables','despiadado','despiadada','despiadados','despiadadas',
  'malvado','malvada','malvados','malvadas','cruel','crueles','terrible','terribles',
  'monstruoso','monstruosa','monstruosos','monstruosas',
  'grande','grandes','bueno','buena','buenos','buenas','malo','mala','malos','malas',
  'nuevo','nueva','nuevos','nuevas','viejo','vieja','viejos','viejas',
  'importante','importantes','difícil','difíciles','fácil','fáciles',
  'especial','especiales','único','única','únicos','únicas',
  'real','reales','actual','actuales','moderno','moderna','modernos','modernas',
  'clásico','clásica','clásicos','clásicas','admirable','admirables',
  'ejemplar','ejemplares','extraordinario','extraordinaria','extraordinarios','extraordinarias'
]);
const MED_SUFIJOS_ADJETIVO = [/osos?$/,/osas?$/,/icos?$/,/icas?$/,/ivos?$/,/ivas?$/,/antes?$/,/entes?$/,/ibles?$/,/ables?$/];

function medEsAdjetivoProbable(palabraOriginal){
  const palabra = palabraOriginal.toLowerCase().replace(/[^a-záéíóúüñ]/g,'');
  if(palabra.length < 4) return false;
  if(MED_DICCIONARIO_ADJETIVOS.has(palabra)) return true;
  return MED_SUFIJOS_ADJETIVO.some(regex => regex.test(palabra));
}

/* Cuenta adjetivos DISTINTOS (sin repetir la misma palabra dos veces) en un
   texto libre. Devuelve la cantidad y la lista de palabras detectadas, para
   poder mostrárselas al estudiante como parte del feedback. */
function medContarAdjetivos(texto){
  const palabras = (texto || '').split(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+/).filter(Boolean);
  const vistos = new Set();
  const encontrados = [];
  palabras.forEach(p => {
    const clave = p.toLowerCase();
    if(!vistos.has(clave) && medEsAdjetivoProbable(p)){
      vistos.add(clave);
      encontrados.push(p);
    }
  });
  return { cantidad: encontrados.length, palabras: encontrados };
}

/* ---------- Respuesta libre (cuadro de texto) con contador y feedback fijo ----------
   minAdjetivos (opcional): si la consigna pide "usa al menos N adjetivos",
   pasar ese número aquí. El contador de caracteres se convierte también en
   contador de adjetivos detectados en vivo, y el envío se bloquea con un
   feedback específico (mostrando qué adjetivos ya se detectaron) si no se
   alcanza el mínimo pedido. */
function medConfigurarRespuestaLibre(idTextarea, idContador, idBotonEnviar, idFeedback, textoFeedback, logroClave, minCaracteres, minAdjetivos){
  const textarea = document.getElementById(idTextarea);
  const contador = document.getElementById(idContador);
  const boton = document.getElementById(idBotonEnviar);
  if(!textarea || !boton) return;
  const actualizarContador = () => {
    if(!contador) return;
    if(minAdjetivos){
      const { cantidad } = medContarAdjetivos(textarea.value);
      contador.textContent = `${textarea.value.length} caracteres — ${cantidad} adjetivo${cantidad === 1 ? '' : 's'} detectado${cantidad === 1 ? '' : 's'} (mínimo ${minAdjetivos})`;
    } else {
      contador.textContent = `${textarea.value.length} caracteres`;
    }
  };
  textarea.addEventListener('input', actualizarContador);
  actualizarContador();
  boton.addEventListener('click', () => {
    const min = minCaracteres || 10;
    if(textarea.value.trim().length < min){
      medMostrarFeedback(idFeedback, false,
        '', `Tu informe todavía es muy breve, detective. Agrega más pistas y detalles (al menos ${min} caracteres) antes de continuar.`);
      return;
    }
    if(minAdjetivos){
      const { cantidad, palabras } = medContarAdjetivos(textarea.value);
      if(cantidad < minAdjetivos){
        const detalle = palabras.length
          ? ` Hasta ahora detectamos ${cantidad}: ${palabras.join(', ')}.`
          : ' Todavía no detectamos ningún adjetivo en tu texto.';
        medMostrarFeedback(idFeedback, false, '',
          `La consigna pide al menos ${minAdjetivos} adjetivo${minAdjetivos === 1 ? '' : 's'} (palabras que describan una cualidad, como "feroz" o "valiente").${detalle} Agrega más recursos descriptivos y vuelve a intentarlo.`);
        return;
      }
    }
    medMostrarFeedback(idFeedback, true, textoFeedback, '');
    if(logroClave) medMarcarLogro(logroClave);
    boton.disabled = true;
    textarea.setAttribute('aria-readonly','true');
  });
}

/* ---------- Arrastrar y soltar: ordenar tarjetas (Monomito) ---------- */
function medInicializarOrdenamiento(idLista){
  const lista = document.getElementById(idLista);
  if(!lista) return;
  let arrastrado = null;
  lista.querySelectorAll('.dnd-ficha').forEach(ficha => {
    ficha.setAttribute('draggable','true');
    ficha.addEventListener('dragstart', () => { arrastrado = ficha; ficha.classList.add('arrastrando'); });
    ficha.addEventListener('dragend', () => { ficha.classList.remove('arrastrando'); });
    // Alternativa accesible por teclado: botones subir/bajar
    const subir = ficha.querySelector('.mover-arriba');
    const bajar = ficha.querySelector('.mover-abajo');
    if(subir) subir.addEventListener('click', () => {
      const anterior = ficha.previousElementSibling;
      if(anterior) lista.insertBefore(ficha, anterior);
      ficha.focus();
    });
    if(bajar) bajar.addEventListener('click', () => {
      const siguiente = ficha.nextElementSibling;
      if(siguiente) lista.insertBefore(siguiente, ficha);
      ficha.focus();
    });
  });
  lista.addEventListener('dragover', (e) => {
    e.preventDefault();
    lista.classList.add('sobre-drag');
    const despues = [...lista.querySelectorAll('.dnd-ficha:not(.arrastrando)')].find(f => {
      const box = f.getBoundingClientRect();
      return e.clientY <= box.top + box.height/2;
    });
    if(!arrastrado) return;
    if(despues) lista.insertBefore(arrastrado, despues);
    else lista.appendChild(arrastrado);
  });
  lista.addEventListener('dragleave', () => lista.classList.remove('sobre-drag'));
  lista.addEventListener('drop', (e) => { e.preventDefault(); lista.classList.remove('sobre-drag'); });
}

function medVerificarOrdenamiento(idLista, idFeedback, ordenCorrecto, mapaFeedbackError, logroClave){
  const lista = document.getElementById(idLista);
  if(!lista) return;
  const actual = [...lista.querySelectorAll('.dnd-ficha')].map(f => f.dataset.id);
  let esCorrecto = true, indiceError = -1;
  for(let i=0;i<ordenCorrecto.length;i++){
    if(actual[i] !== ordenCorrecto[i]){ esCorrecto = false; indiceError = i; break; }
  }
  if(esCorrecto){
    medMostrarFeedback(idFeedback, true,
      '¡Caso resuelto! Ordenaste correctamente las cinco etapas del Monomito: Llamada, Ayuda, Pruebas, Recompensa y Retorno. Comprendiste cómo se organiza el Viaje del Héroe.', '');
    if(logroClave) medMarcarLogro(logroClave);
  } else {
    const idFicha = actual[indiceError];
    const explicacion = mapaFeedbackError[idFicha] || 'Esa pista no encaja en esa posición. Revisa el video y vuelve a intentarlo.';
    medMostrarFeedback(idFeedback, false, '', explicacion);
  }
  if(typeof MED_SLUG_ACTUAL !== 'undefined' && MED_SLUG_ACTUAL){
    const ordenTexto = [...lista.querySelectorAll('.dnd-ficha')].map(f => f.textContent.trim()).join(' → ');
    medGuardarRespuesta(MED_SLUG_ACTUAL, idLista, medEtiquetaParaCampo(lista),
      (esCorrecto ? '(orden correcto) ' : '(orden incorrecto) ') + ordenTexto);
  }
}

/* ---------- Clasificación en columnas (adjetivos / verbos) ---------- */
function medInicializarClasificacion(idBanco, idsColumnas){
  const banco = document.getElementById(idBanco);
  const columnas = idsColumnas.map(id => document.getElementById(id)).filter(Boolean);
  const zonas = [banco, ...columnas].filter(Boolean);
  let arrastrado = null;
  function activarFicha(ficha){
    ficha.setAttribute('draggable','true');
    ficha.addEventListener('dragstart', () => { arrastrado = ficha; ficha.classList.add('arrastrando'); });
    ficha.addEventListener('dragend', () => { ficha.classList.remove('arrastrando'); });
  }
  if(banco) banco.querySelectorAll('.dnd-ficha').forEach(activarFicha);
  zonas.forEach(zona => {
    zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('sobre-drag'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('sobre-drag'));
    zona.addEventListener('drop', (e) => {
      e.preventDefault(); zona.classList.remove('sobre-drag');
      if(arrastrado){ zona.appendChild(arrastrado); activarFicha(arrastrado); }
    });
  });
  // alternativa accesible: select por ficha
  if(banco) banco.querySelectorAll('select.selector-columna').forEach(sel => {
    sel.addEventListener('change', () => {
      const destino = document.getElementById(sel.value);
      const ficha = sel.closest('.dnd-ficha');
      if(destino && ficha){ destino.appendChild(ficha); }
    });
  });
}

function medVerificarClasificacion(idsColumnas, idFeedback, solucion, logroClave){
  let correctas = 0, total = 0, primerError = null;
  const resumen = [];
  idsColumnas.forEach(idCol => {
    const col = document.getElementById(idCol);
    if(!col) return;
    col.querySelectorAll('.dnd-ficha').forEach(f => {
      total++;
      const enColumnaCorrecta = solucion[f.dataset.id] === idCol;
      if(enColumnaCorrecta) correctas++;
      else if(!primerError) primerError = f.dataset.id;
      resumen.push(`  - "${f.textContent.replace(/Mover a….*$/,'').trim()}" → ${idCol}${enColumnaCorrecta ? '' : ' (incorrecto)'}`);
    });
  });
  const totalEsperado = Object.keys(solucion).length;
  const esCorrecto = correctas === totalEsperado && total === totalEsperado;
  if(esCorrecto){
    medMostrarFeedback(idFeedback, true,
      'Excelente trabajo de laboratorio: separaste correctamente los adjetivos de los verbos. Estas herramientas gramaticales te servirán para caracterizar a tu propio héroe.', '');
    if(logroClave) medMarcarLogro(logroClave);
  } else {
    medMostrarFeedback(idFeedback, false, '',
      'Todavía hay pistas en la columna equivocada. Recuerda: los adjetivos describen cualidades (feroz, invulnerable) y los verbos indican acciones (rugir, atacar). Revisa cada ficha y vuelve a intentarlo.');
  }
  if(typeof MED_SLUG_ACTUAL !== 'undefined' && MED_SLUG_ACTUAL){
    const clave = 'clasificacion__' + idsColumnas.join('_');
    medGuardarRespuesta(MED_SLUG_ACTUAL, clave, 'Clasificación (' + idsColumnas.join(' / ') + ')',
      (esCorrecto ? '(clasificación correcta)\n' : `(${correctas} de ${totalEsperado} correctas)\n`) + resumen.join('\n'));
  }
}

/* ---------- Resaltado interactivo de texto ---------- */
function medConfigurarResaltado(idTexto, categoriaActiva){
  const cont = document.getElementById(idTexto);
  if(!cont) return;
  cont.querySelectorAll('.palabra-resaltable').forEach(span => {
    span.setAttribute('role','button');
    span.setAttribute('tabindex','0');
    const alternar = () => {
      const cat = categoriaActiva();
      span.classList.remove('marcada-adjetivo','marcada-verbo');
      if(span.dataset.marcado === cat){
        span.dataset.marcado = '';
      } else {
        span.dataset.marcado = cat;
        span.classList.add(cat === 'adjetivo' ? 'marcada-adjetivo' : 'marcada-verbo');
      }
    };
    span.addEventListener('click', alternar);
    span.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); alternar(); } });
  });
}

function medVerificarResaltado(idTexto, idFeedback, solucion, logroClave){
  const cont = document.getElementById(idTexto);
  if(!cont) return;
  let aciertos = 0, errores = 0, total = Object.keys(solucion).length;
  cont.querySelectorAll('.palabra-resaltable').forEach(span => {
    const esperado = solucion[span.dataset.id];
    const marcado = span.dataset.marcado || null;
    span.classList.remove('marcada-correcta','marcada-incorrecta');
    if(esperado){
      if(marcado === esperado){ aciertos++; span.classList.add('marcada-correcta'); }
      else { errores++; span.classList.add('marcada-incorrecta'); }
    } else if(marcado){ errores++; span.classList.add('marcada-incorrecta'); }
  });
  if(aciertos === total && errores === 0){
    medMostrarFeedback(idFeedback, true,
      'Hallazgo perfecto, detective: identificaste todos los adjetivos y verbos que describen al León de Nemea. Estas palabras crean la atmósfera de peligro del relato.', '');
    if(logroClave) medMarcarLogro(logroClave);
  } else {
    medMostrarFeedback(idFeedback, false, '',
      `Encontraste ${aciertos} de ${total} pistas correctas. Las palabras marcadas en rojo no coinciden: revisa si describen una cualidad (adjetivo) o una acción (verbo) y vuelve a intentarlo.`);
  }
  if(typeof MED_SLUG_ACTUAL !== 'undefined' && MED_SLUG_ACTUAL){
    const marcadas = [...cont.querySelectorAll('.palabra-resaltable')]
      .filter(s => s.dataset.marcado)
      .map(s => `${s.textContent.trim()} (${s.dataset.marcado})`);
    medGuardarRespuesta(MED_SLUG_ACTUAL, idTexto, medEtiquetaParaCampo(cont),
      `(${aciertos} de ${total} correctas) ` + marcadas.join(', '));
  }
}

/* ---------- Lista de cotejo (checklist autoaplicable) ---------- */
function medConfigurarListaCotejo(idLista, idResultado){
  const lista = document.getElementById(idLista);
  const resultado = document.getElementById(idResultado);
  if(!lista) return;
  const casillas = lista.querySelectorAll('input[type="checkbox"]');
  casillas.forEach(c => c.addEventListener('change', () => {
    const marcadas = [...casillas].filter(x => x.checked).length;
    if(resultado){
      resultado.textContent = `Has verificado ${marcadas} de ${casillas.length} criterios de calidad.`;
      if(marcadas === casillas.length){
        resultado.textContent += ' ¡Tu expediente cumple con el control de calidad! Ya puedes enviarlo.';
      }
    }
  }));
}

/* ---------- Rúbrica interactiva ---------- */
function medConfigurarRubrica(idFormulario, idResultado){
  const form = document.getElementById(idFormulario);
  const resultado = document.getElementById(idResultado);
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const grupos = [...new Set([...form.querySelectorAll('input[type=radio]')].map(i => i.name))];
    let respondidos = 0, puntaje = 0;
    grupos.forEach(nombre => {
      const marcado = form.querySelector(`input[name="${nombre}"]:checked`);
      if(marcado){ respondidos++; puntaje += Number(marcado.value); }
    });
    if(respondidos < grupos.length){
      resultado.innerHTML = `<p><strong>Faltan criterios por evaluar.</strong> Revisa cada fila de la rúbrica antes de cerrar el caso.</p>`;
      return;
    }
    const maximo = grupos.length * 3;
    const pct = Math.round((puntaje/maximo)*100);
    let mensaje = '';
    if(pct >= 85) mensaje = '¡Excelente informe, detective! Has usado tus herramientas gramaticales y narrativas para dar vida a un nuevo héroe. Tu expediente está listo para el archivo de casos resueltos.';
    else if(pct >= 60) mensaje = 'Buen trabajo de investigación. Tu informe está en proceso: revisa los criterios marcados como "Por mejorar" antes de la entrega final para fortalecer la cohesión y la descripción del personaje.';
    else mensaje = 'Este expediente necesita más trabajo de campo. Vuelve al texto, revisa la ortografía, la cohesión entre las ideas y los adjetivos usados, y preséntate de nuevo al control de calidad.';
    resultado.innerHTML = `<p><strong>Resultado del control de calidad: ${pct}%</strong></p><p>${mensaje}</p>`;
    if(pct >= 60) medMarcarLogro('rubrica-informe-final');
    if(typeof MED_SLUG_ACTUAL !== 'undefined' && MED_SLUG_ACTUAL){
      medGuardarRespuesta(MED_SLUG_ACTUAL, idFormulario, 'Rúbrica de autoevaluación', `${pct}% — ${mensaje}`);
    }
  });
}

/* ---------- Ventanas emergentes de la galería (hotspots) ---------- */
function medAbrirFichaGaleria(titulo, texto){
  const overlay = document.getElementById('modal-glosario');
  const t = document.getElementById('modal-glosario-titulo');
  const c = document.getElementById('modal-glosario-texto');
  if(!overlay) return;
  t.textContent = '🖼️ ' + titulo;
  c.textContent = texto;
  overlay.classList.add('abierto');
}
