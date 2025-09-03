document.addEventListener('DOMContentLoaded', function() {
    // === REFERENCIAS A ELEMENTOS DEL DOM ===
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const respuestaDiv = document.getElementById('respuesta');
    
    // Botones de generar para cada modo
    const generarIngredientesBtn = document.getElementById('generar-ingredientes');
    const generarLimpiaBtn = document.getElementById('generar-limpia');
    const generarAdaptadorBtn = document.getElementById('generar-adaptador');
    const generarPlanBtn = document.getElementById('generar-plan');
    
    // Botones de acciones para Plan Semanal
    const copiarListaBtn = document.getElementById('copiar-lista');
    const exportarCalendarioPdfBtn = document.getElementById('exportar-calendario-pdf');
    const verTodasRecetasBtn = document.getElementById('ver-todas-recetas');
    const exportarRecetarioPdfBtn = document.getElementById('exportar-recetario-pdf');
    
    // === INICIALIZACIÓN ===
    initializeTabs();
    initializeEventListeners();
    
    // === 1. LÓGICA PARA LAS 4 PESTAÑAS ===
    
    /**
     * Inicializa la funcionalidad de pestañas
     */
    function initializeTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                switchTab(targetTab);
            });
        });
    }
    
    /**
     * Cambia entre pestañas
     */
    function switchTab(targetTab) {
        // Remover clase active de todos los botones y contenidos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activar el botón y contenido correspondiente
        document.querySelector(`[data-tab="${targetTab}"]`).classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        // Ocultar respuesta al cambiar de pestaña
        respuestaDiv.classList.remove('show');
        ocultarBotonesAccion();
    }
    
    // === 2. EVENT LISTENERS Y LÓGICA DE BOTONES GENERAR ===
    
    /**
     * Inicializa todos los event listeners
     */
    function initializeEventListeners() {
        // Botones de generar para cada modo
        generarIngredientesBtn.addEventListener('click', () => handleGenerate('receta-ingredientes'));
        generarLimpiaBtn.addEventListener('click', () => handleGenerate('limpia-neveras'));
        generarAdaptadorBtn.addEventListener('click', () => handleGenerate('adaptador-inteligente'));
        generarPlanBtn.addEventListener('click', () => handleGenerate('plan-semanal'));
        
        // Botones de acciones para Plan Semanal
        copiarListaBtn.addEventListener('click', copiarListaCompra);
        exportarCalendarioPdfBtn.addEventListener('click', exportarCalendarioPDF);
        verTodasRecetasBtn.addEventListener('click', verTodasLasRecetas);
        exportarRecetarioPdfBtn.addEventListener('click', exportarRecetarioPDF);
    }
    
    /**
     * Detecta el modo activo y llama al backend
     */
    async function handleGenerate(mode) {
        const data = collectFormData(mode);
        
        // Validar datos
        if (!validateFormData(data, mode)) {
            return;
        }
        
        // Mostrar estado de carga
        mostrarCargando(mode);
        
        try {
            await generarReceta(data, mode);
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al generar la receta. Por favor, inténtalo de nuevo.');
        } finally {
            ocultarCargando(mode);
        }
    }
    
    /**
     * Recopila los datos del formulario según el modo activo
     */
    function collectFormData(mode) {
        switch (mode) {
            case 'receta-ingredientes':
                return {
                    mode: 'receta-ingredientes',
                    ingredientesPrincipales: document.getElementById('ingredientes-principales').value.trim(),
                    personas: document.getElementById('personas-ingredientes').value,
                    dieta: document.getElementById('dieta-ingredientes').value
                };
                
            case 'limpia-neveras':
                return {
                    mode: 'limpia-neveras',
                    ingredientes: document.getElementById('ingredientes-nevera').value.trim(),
                    personas: document.getElementById('personas-limpia').value,
                    dieta: document.getElementById('dieta-limpia').value
                };
                
            case 'adaptador-inteligente':
                return {
                    mode: 'adaptador-inteligente',
                    recetaOriginal: document.getElementById('receta-original').value.trim(),
                    cambiosSolicitados: document.getElementById('cambios-solicitados').value.trim(),
                    personas: document.getElementById('personas-adaptador').value,
                    dieta: document.getElementById('dieta-adaptador').value
                };
                
            case 'plan-semanal':
                const comidasSeleccionadas = [];
                const checkboxes = document.querySelectorAll('input[name="comidas"]:checked');
                checkboxes.forEach(checkbox => {
                    comidasSeleccionadas.push(checkbox.value);
                });
                
                return {
                    mode: 'plan-semanal',
                    caloriasObjetivo: document.getElementById('calorias-objetivo').value,
                    comidasSeleccionadas: comidasSeleccionadas,
                    preferencias: document.getElementById('preferencias-plan').value.trim(),
                    personas: document.getElementById('personas-plan').value,
                    dieta: document.getElementById('dieta-plan').value
                };
                
            default:
                return {};
        }
    }
    
    /**
     * Valida los datos del formulario
     */
    function validateFormData(data, mode) {
        switch (mode) {
            case 'receta-ingredientes':
                if (!data.ingredientesPrincipales) {
                    alert('Por favor, ingresa al menos un ingrediente principal');
                    return false;
                }
                break;
                
            case 'limpia-neveras':
                if (!data.ingredientes) {
                    alert('Por favor, ingresa los ingredientes que tienes disponibles en la nevera');
                    return false;
                }
                break;
                
            case 'adaptador-inteligente':
                if (!data.recetaOriginal) {
                    alert('Por favor, ingresa la receta original que quieres adaptar');
                    return false;
                }
                break;
                
            case 'plan-semanal':
                if (!data.caloriasObjetivo || data.caloriasObjetivo < 800 || data.caloriasObjetivo > 5000) {
                    alert('Por favor, ingresa un objetivo de calorías válido (entre 800 y 5000)');
                    return false;
                }
                if (!data.comidasSeleccionadas || data.comidasSeleccionadas.length === 0) {
                    alert('Por favor, selecciona al menos una comida para planificar');
                    return false;
                }
                break;
        }
        return true;
    }
    
    /**
     * Llama al backend para generar receta
     */
    async function generarReceta(data, mode) {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        mostrarReceta(result.receta, mode);
    }
    
    // === 3. LÓGICA PARA MOSTRAR PLAN SEMANAL CON BOTONES CLICABLES ===
    
    /**
     * Muestra la receta generada según el modo
     */
    function mostrarReceta(recetaTexto, mode) {
        const titulos = {
            'receta-ingredientes': '🥗 Tu Receta por Ingredientes',
            'limpia-neveras': '🗄️ Tu Receta Limpia-Neveras',
            'adaptador-inteligente': '🔄 Tu Receta Adaptada',
            'plan-semanal': '📅 Tu Plan Semanal Personalizado'
        };
        
        const titulo = titulos[mode] || '🍳 Tu Receta Personalizada';
        let html = '';
        
        // Manejo especial para Plan Semanal (JSON)
        if (mode === 'plan-semanal') {
            try {
                // Limpiar respuesta JSON de posibles bloques Markdown
                let jsonTexto = limpiarJSONDeMarkdown(recetaTexto);
                const planData = JSON.parse(jsonTexto);
                
                html = `
                    <div class="receta-resultado">
                        <h3>${titulo}</h3>
                        <div class="receta-contenido">
                            ${renderizarPlanSemanal(planData)}
                        </div>
                    </div>
                `;
                
                // Almacenar datos JSON para uso en otras funciones
                window.planSemanalData = planData;
                
            } catch (error) {
                console.error('Error al parsear JSON del plan semanal:', error);
                html = `
                    <div class="receta-resultado">
                        <h3>${titulo}</h3>
                        <div class="receta-contenido">
                            <p>Error al procesar el plan semanal. Por favor, inténtalo de nuevo.</p>
                        </div>
                    </div>
                `;
            }
        } else {
            // Manejo normal para otros modos
            html = `
                <div class="receta-resultado">
                    <h3>${titulo}</h3>
                    <div class="receta-contenido">
                        ${formatearReceta(recetaTexto)}
                    </div>
                </div>
            `;
        }
        
        respuestaDiv.innerHTML = html;
        respuestaDiv.classList.add('show');
        
        // Mostrar botones según el modo
        mostrarBotonesAccion(mode, recetaTexto);
        
        // Añadir event listeners a los botones de receta (solo para plan semanal)
        if (mode === 'plan-semanal') {
            agregarEventListenersRecetas();
        }
    }
    
    /**
     * Renderiza el plan semanal desde JSON a HTML con botones clicables
     */
    function renderizarPlanSemanal(planData) {
        if (!planData || !planData.planSemanal || !planData.listaCompra) {
            return '<p>Error: Formato de datos del plan semanal inválido.</p>';
        }
        
        let html = '<div class="plan-semanal-container">';
        
        // Renderizar días del plan
        html += '<div class="plan-dias">';
        planData.planSemanal.forEach(diaData => {
            html += `
                <div class="dia-container">
                    <h4 class="dia-titulo">🗓️ ${diaData.dia}</h4>
                    <div class="comidas-container">
            `;
            
            diaData.comidas.forEach(comida => {
                const emojiComida = {
                    'Desayuno': '🥐',
                    'Comida': '🍽️', 
                    'Almuerzo': '🍽️',
                    'Merienda': '🥨',
                    'Cena': '🌙'
                };
                
                html += `
                    <div class="comida-item">
                        <h5>${emojiComida[comida.tipo] || '🍽️'} ${comida.tipo}</h5>
                        <div class="comida-details">
                            <p><strong>📋 Receta:</strong> 
                                <button class="receta-btn" 
                                        data-receta="${comida.nombre}" 
                                        data-personas="${planData.personas || 2}" 
                                        data-dieta="${planData.dieta || 'ninguna'}">
                                    ${comida.nombre}
                                </button>
                            </p>
                            <p><strong>📊 Nutrición:</strong> ${comida.calorias} kcal | Proteínas: ${comida.proteinas}g | Grasas: ${comida.grasas}g | Carbohidratos: ${comida.carbohidratos}g</p>
                            ${comida.vitaminas ? `<p><strong>💎 Destacados:</strong> ${comida.vitaminas}</p>` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += `
                        <div class="dia-total">
                            <p><strong>📈 Total del día:</strong> ~${diaData.totalCalorias} kcal</p>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        // Renderizar lista de compra
        html += `
            <div class="lista-compra-container">
                <h4>🛒 Lista de la Compra Semanal</h4>
                <div class="categorias-container">
        `;
        
        planData.listaCompra.forEach(categoria => {
            const emojiCategoria = {
                'Lácteos y Huevos': '🥛',
                'Verduras y Hortalizas': '🥬', 
                'Carnes y Pescados': '🥩',
                'Cereales y Legumbres': '🌾',
                'Frutas': '🍎',
                'Condimentos y Especias': '🧄',
                'Frutos Secos y Semillas': '🥜',
                'Aceites y Vinagres': '🫒',
                'Otros Productos': '📦'
            };
            
            html += `
                <div class="categoria-compra">
                    <h5>${emojiCategoria[categoria.categoria] || '📦'} ${categoria.categoria.toUpperCase()}</h5>
                    <ul class="items-lista">
            `;
            
            categoria.items.forEach(item => {
                html += `<li>- ${item}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        });
        
        html += '</div></div></div>';
        return html;
    }
    
    /**
     * Añade event listeners a los botones de recetas del plan semanal
     */
    function agregarEventListenersRecetas() {
        const botonesReceta = document.querySelectorAll('.receta-btn');
        botonesReceta.forEach(boton => {
            boton.addEventListener('click', async function() {
                const nombreReceta = this.getAttribute('data-receta');
                const personas = this.getAttribute('data-personas');
                const dieta = this.getAttribute('data-dieta');
                
                await obtenerRecetaIndividual(nombreReceta, personas, dieta);
            });
        });
    }
    
    /**
     * Obtiene una receta individual del backend
     */
    async function obtenerRecetaIndividual(nombreReceta, personas, dieta) {
        try {
            mostrarCargandoReceta(nombreReceta);
            
            const response = await fetch('/api/get-recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombreReceta: nombreReceta,
                    personas: personas,
                    dieta: dieta
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            mostrarRecetaDetallada(nombreReceta, result.receta);
            
        } catch (error) {
            console.error('Error obteniendo receta individual:', error);
            mostrarErrorReceta(nombreReceta, 'Error al cargar la receta. Por favor, inténtalo de nuevo.');
        }
    }
    
    // === 4. LÓGICA DEL BOTÓN 'VER TODAS LAS RECETAS' ===
    
    /**
     * Ve todas las recetas del plan semanal progresivamente
     */
    async function verTodasLasRecetas() {
        if (!window.planSemanalData || !window.planSemanalData.planSemanal) {
            alert('No hay un plan semanal válido para mostrar las recetas');
            return;
        }
        
        const textoOriginal = verTodasRecetasBtn.textContent;
        verTodasRecetasBtn.textContent = '⏳ Cargando Recetas...';
        verTodasRecetasBtn.disabled = true;
        
        try {
            // Crear contenedor para todas las recetas
            let todasRecetasContainer = document.getElementById('todas-recetas');
            if (!todasRecetasContainer) {
                todasRecetasContainer = document.createElement('div');
                todasRecetasContainer.id = 'todas-recetas';
                todasRecetasContainer.className = 'todas-recetas-container';
                respuestaDiv.appendChild(todasRecetasContainer);
            }
            
            // Limpiar contenedor
            todasRecetasContainer.innerHTML = `
                <div class="todas-recetas-header">
                    <h3>🍽️ Todas las Recetas del Plan Semanal</h3>
                    <button class="cerrar-todas-recetas" onclick="cerrarTodasRecetas()">✖</button>
                </div>
                <div id="recetas-lista" class="recetas-lista"></div>
            `;
            
            const recetasLista = document.getElementById('recetas-lista');
            
            // Recopilar todas las recetas únicas
            const recetasUnicas = new Set();
            const planData = window.planSemanalData;
            
            planData.planSemanal.forEach(diaData => {
                diaData.comidas.forEach(comida => {
                    recetasUnicas.add(comida.nombre);
                });
            });
            
            const recetasArray = Array.from(recetasUnicas);
            let contador = 0;
            
            // Procesar recetas una por una
            for (const nombreReceta of recetasArray) {
                contador++;
                
                // Mostrar placeholder de carga
                const recetaPlaceholder = document.createElement('div');
                recetaPlaceholder.className = 'receta-item-loading';
                recetaPlaceholder.innerHTML = `
                    <div class="receta-item-header loading-header">
                        <h4>🔄 ${nombreReceta}</h4>
                        <span class="receta-contador">${contador}/${recetasArray.length}</span>
                    </div>
                    <div class="loading-content">Cargando receta...</div>
                `;
                
                recetasLista.appendChild(recetaPlaceholder);
                recetaPlaceholder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                try {
                    // Obtener receta del backend
                    const response = await fetch('/api/get-recipe', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            nombreReceta: nombreReceta,
                            personas: planData.personas || 2,
                            dieta: planData.dieta || 'ninguna'
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    // Reemplazar placeholder con contenido real
                    recetaPlaceholder.className = 'receta-item-completa';
                    recetaPlaceholder.innerHTML = `
                        <div class="receta-item-header">
                            <h4>✅ ${nombreReceta}</h4>
                            <span class="receta-contador">${contador}/${recetasArray.length}</span>
                        </div>
                        <div class="receta-item-contenido">
                            ${formatearReceta(result.receta)}
                        </div>
                    `;
                    
                } catch (error) {
                    console.error(`Error cargando receta ${nombreReceta}:`, error);
                    
                    recetaPlaceholder.className = 'receta-item-error';
                    recetaPlaceholder.innerHTML = `
                        <div class="receta-item-header error-header">
                            <h4>❌ ${nombreReceta}</h4>
                            <span class="receta-contador">${contador}/${recetasArray.length}</span>
                        </div>
                        <div class="error-content">Error al cargar esta receta</div>
                    `;
                }
                
                // Pausa entre recetas
                if (contador < recetasArray.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Restaurar botón
            verTodasRecetasBtn.textContent = '✅ Recetas Cargadas';
            verTodasRecetasBtn.classList.add('completed');
            
            setTimeout(() => {
                verTodasRecetasBtn.textContent = textoOriginal;
                verTodasRecetasBtn.classList.remove('completed');
                verTodasRecetasBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error('Error en verTodasLasRecetas:', error);
            alert('Error al cargar las recetas. Por favor, inténtalo de nuevo.');
            
            verTodasRecetasBtn.textContent = textoOriginal;
            verTodasRecetasBtn.disabled = false;
        }
    }
    
    // === 5. LÓGICA PARA 'DESCARGAR CALENDARIO EN PDF' ===
    
    /**
     * Exporta el calendario semanal a PDF usando html2pdf con tabla-rejilla
     */
    function exportarCalendarioPDF() {
        try {
            // Verificar datos del plan semanal
            if (!window.planSemanalData || !window.planSemanalData.planSemanal) {
                alert('No hay un plan semanal válido para exportar');
                return;
            }
            
            // Cambiar estado del botón
            const textoOriginal = exportarCalendarioPdfBtn.textContent;
            exportarCalendarioPdfBtn.textContent = '📅 Generando PDF...';
            exportarCalendarioPdfBtn.disabled = true;
            
            const planData = window.planSemanalData;
            const templateDiv = document.getElementById('pdf-calendario-template');
            
            if (!templateDiv) {
                throw new Error('No se encontró el div de plantilla PDF');
            }
            
            const fechaHoy = new Date().toLocaleDateString('es-ES');
            
            // Generar HTML de tabla-rejilla en la plantilla
            templateDiv.innerHTML = `
                <div style="
                    font-family: 'Poppins', 'Lato', Arial, sans-serif;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    padding: 20px;
                    box-sizing: border-box;
                ">
                    <!-- Encabezado -->
                    <div style="
                        background: linear-gradient(135deg, #2D6A4F 0%, #245c41 100%);
                        color: white;
                        text-align: center;
                        padding: 30px;
                        margin-bottom: 30px;
                        border-radius: 10px;
                    ">
                        <h1 style="
                            font-family: 'Poppins', Arial, sans-serif;
                            font-size: 36px;
                            font-weight: 700;
                            margin: 0 0 10px 0;
                            letter-spacing: 2px;
                        ">CALENDARIO SEMANAL</h1>
                        <p style="
                            font-family: 'Lato', Arial, sans-serif;
                            font-size: 18px;
                            margin: 0;
                            opacity: 0.9;
                        ">Generado el ${fechaHoy}</p>
                    </div>
                    
                    <!-- Tabla-Rejilla del Calendario -->
                    <table style="
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        border-radius: 10px;
                        overflow: hidden;
                    ">
                        <!-- Encabezados de días -->
                        <thead>
                            <tr>
                                ${generarEncabezadosTabla()}
                            </tr>
                        </thead>
                        <!-- Contenido de días -->
                        <tbody>
                            <tr>
                                ${generarCeldasTabla(planData)}
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Información adicional -->
                    <div style="
                        text-align: center;
                        font-family: 'Lato', Arial, sans-serif;
                        font-size: 14px;
                        color: #6C757D;
                        margin-top: 20px;
                    ">
                        <p style="margin: 8px 0; font-weight: 600;">
                            Plan para ${planData.personas || 2} persona${(planData.personas || 2) > 1 ? 's' : ''}
                            ${planData.dieta && planData.dieta !== 'ninguna' ? ` • Dieta: ${planData.dieta.charAt(0).toUpperCase() + planData.dieta.slice(1)}` : ''}
                        </p>
                        <p style="margin: 8px 0; font-style: italic;">
                            Generado por Asistente de Cocina IA
                        </p>
                    </div>
                </div>
            `;
            
            // Configurar y ejecutar html2pdf
            const opciones = {
                margin: 10,
                filename: 'calendario-semanal.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    allowTaint: true
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'landscape' 
                }
            };
            
            // Generar y descargar PDF
            html2pdf().set(opciones).from(templateDiv).save().then(() => {
                console.log('PDF generado exitosamente');
                
                // Limpiar contenido
                templateDiv.innerHTML = '';
                
                // Feedback visual de éxito
                exportarCalendarioPdfBtn.textContent = '✅ Calendario Generado';
                exportarCalendarioPdfBtn.classList.add('exported');
                
                setTimeout(() => {
                    exportarCalendarioPdfBtn.textContent = textoOriginal;
                    exportarCalendarioPdfBtn.classList.remove('exported');
                    exportarCalendarioPdfBtn.disabled = false;
                }, 2500);
                
            }).catch(error => {
                console.error('Error en html2pdf:', error);
                throw error;
            });
            
        } catch (error) {
            console.error('Error al exportar calendario PDF:', error);
            alert('Error al generar el calendario. Por favor, inténtalo de nuevo.');
            
            exportarCalendarioPdfBtn.textContent = '📅 Descargar Calendario en PDF';
            exportarCalendarioPdfBtn.disabled = false;
        }
    }
    
    /**
     * Genera los encabezados de la tabla del calendario
     */
    function generarEncabezadosTabla() {
        const diasSemana = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
        
        return diasSemana.map(dia => `
            <th style="
                background: linear-gradient(135deg, #FF8C42 0%, #E57125 100%);
                color: white;
                padding: 15px 10px;
                font-family: 'Poppins', Arial, sans-serif;
                font-weight: 600;
                font-size: 14px;
                text-align: center;
                border: none;
            ">${dia}</th>
        `).join('');
    }
    
    /**
     * Genera las celdas de contenido para la tabla del calendario
     */
    function generarCeldasTabla(planData) {
        const maxDays = Math.min(planData.planSemanal.length, 7);
        let celdas = '';
        
        // Generar celdas para los días disponibles
        for (let i = 0; i < maxDays; i++) {
            const diaData = planData.planSemanal[i];
            
            celdas += `
                <td style="
                    background: #F8F9FA;
                    padding: 15px 10px;
                    vertical-align: top;
                    min-height: 300px;
                    border: 1px solid #DEE2E6;
                    position: relative;
                    width: 14.28%;
                ">
                    <!-- Nombre del día -->
                    <div style="
                        font-family: 'Poppins', Arial, sans-serif;
                        font-weight: 600;
                        color: #2D6A4F;
                        font-size: 12px;
                        text-align: center;
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #FF8C42;
                    ">
                        ${diaData.dia.length > 10 ? diaData.dia.substring(0, 10) + '...' : diaData.dia}
                    </div>
                    
                    <!-- Comidas del día -->
                    <div style="font-family: 'Lato', Arial, sans-serif; font-size: 10px;">
                        ${generarComidasTabla(diaData.comidas)}
                    </div>
                    
                    <!-- Total de calorías -->
                    ${diaData.totalCalorias ? `
                        <div style="
                            position: absolute;
                            bottom: 8px;
                            left: 8px;
                            right: 8px;
                            background: linear-gradient(135deg, #2D6A4F 0%, #245c41 100%);
                            color: white;
                            text-align: center;
                            padding: 6px 4px;
                            border-radius: 4px;
                            font-family: 'Poppins', Arial, sans-serif;
                            font-weight: 600;
                            font-size: 9px;
                        ">
                            Total: ${diaData.totalCalorias} kcal
                        </div>
                    ` : ''}
                </td>
            `;
        }
        
        // Rellenar celdas vacías si hay menos de 7 días
        for (let i = maxDays; i < 7; i++) {
            celdas += `
                <td style="
                    background: #FFFFFF;
                    border: 1px solid #DEE2E6;
                    min-height: 300px;
                    opacity: 0.3;
                    width: 14.28%;
                "></td>
            `;
        }
        
        return celdas;
    }
    
    /**
     * Genera el HTML para las comidas de un día en la tabla
     */
    function generarComidasTabla(comidas) {
        const emojiComida = {
            'Desayuno': '🥐',
            'Comida': '🍽️',
            'Almuerzo': '🍽️', 
            'Merienda': '🥨',
            'Cena': '🌙'
        };
        
        const maxComidas = Math.min(comidas.length, 4);
        
        return comidas.slice(0, maxComidas).map(comida => `
            <div style="
                margin-bottom: 10px;
                padding: 6px;
                background: white;
                border-radius: 4px;
                border-left: 3px solid #FF8C42;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            ">
                <div style="
                    font-weight: 600;
                    color: #2D6A4F;
                    font-size: 10px;
                    margin-bottom: 3px;
                ">
                    ${emojiComida[comida.tipo] || '🍽️'} ${comida.tipo}
                </div>
                <div style="
                    color: #212529;
                    font-size: 9px;
                    line-height: 1.3;
                    margin-bottom: 3px;
                ">
                    ${comida.nombre.length > 25 ? comida.nombre.substring(0, 25) + '...' : comida.nombre}
                </div>
                <div style="
                    color: #6C757D;
                    font-size: 8px;
                ">
                    ${comida.calorias || 0} kcal
                </div>
            </div>
        `).join('');
    }
    
    // === 6. LÓGICA PARA 'COPIAR LISTA DE LA COMPRA' ===
    
    /**
     * Copia la lista de compra al portapapeles
     */
    async function copiarListaCompra() {
        try {
            let textoLista = '';
            
            // Detectar si es Plan Semanal (JSON) o receta normal
            if (window.planSemanalData && window.planSemanalData.listaCompra) {
                // Plan Semanal: generar texto desde JSON
                textoLista = generarTextoListaCompra(window.planSemanalData.listaCompra);
            } else {
                // Otros modos: extraer desde HTML
                const respuestaContent = respuestaDiv.innerHTML;
                const listaMatch = respuestaContent.match(/### Lista de la Compra( Semanal)?[\s\S]*?(?=<h3>|$)/i);
                
                if (!listaMatch) {
                    alert('No se encontró la lista de compra en la respuesta');
                    return;
                }
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = listaMatch[0];
                textoLista = tempDiv.textContent || tempDiv.innerText || '';
                textoLista = formatearTextoLista(textoLista);
            }
            
            // Copiar al portapapeles
            await navigator.clipboard.writeText(textoLista);
            
            // Feedback visual
            const textoOriginal = copiarListaBtn.textContent;
            copiarListaBtn.textContent = '✅ ¡Copiado!';
            copiarListaBtn.classList.add('copied');
            copiarListaBtn.disabled = true;
            
            setTimeout(() => {
                copiarListaBtn.textContent = textoOriginal;
                copiarListaBtn.classList.remove('copied');
                copiarListaBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error al copiar al portapapeles:', error);
            alert('Error al copiar la lista. Por favor, inténtalo de nuevo.');
        }
    }
    
    /**
     * Genera texto formateado de lista de compra desde datos JSON
     */
    function generarTextoListaCompra(listaCompra) {
        let texto = '🛒 Lista de la Compra Semanal\r\n\r\n';
        
        listaCompra.forEach(categoria => {
            const emojiCategoria = {
                'Lácteos y Huevos': '🥛',
                'Verduras y Hortalizas': '🥬', 
                'Carnes y Pescados': '🥩',
                'Cereales y Legumbres': '🌾',
                'Frutas': '🍎',
                'Condimentos y Especias': '🧄',
                'Frutos Secos y Semillas': '🥜',
                'Aceites y Vinagres': '🫒',
                'Otros Productos': '📦'
            };
            
            texto += `${emojiCategoria[categoria.categoria] || '📦'} ${categoria.categoria.toUpperCase()}\r\n`;
            categoria.items.forEach(item => {
                texto += `- ${item}\r\n`;
            });
            texto += '\r\n';
        });
        
        return texto.trim();
    }
    
    // === 7. FUNCIONES DE UTILIDAD ===
    
    /**
     * Exporta solo el recetario completo a PDF
     */
    async function exportarRecetarioPDF() {
        // Implementación placeholder - se puede expandir según necesidades
        alert('Función de recetario PDF en desarrollo');
    }
    
    /**
     * Limpia el texto JSON de posibles bloques Markdown
     */
    function limpiarJSONDeMarkdown(texto) {
        let textoLimpio = texto.trim();
        
        if (textoLimpio.startsWith('```json') || textoLimpio.startsWith('```JSON')) {
            const lineas = textoLimpio.split('\n');
            
            if (lineas[0].startsWith('```json') || lineas[0].startsWith('```JSON')) {
                lineas.shift();
            }
            
            if (lineas[lineas.length - 1].trim() === '```') {
                lineas.pop();
            }
            
            textoLimpio = lineas.join('\n').trim();
        } else if (textoLimpio.startsWith('```') && textoLimpio.endsWith('```')) {
            textoLimpio = textoLimpio.slice(3, -3).trim();
        }
        
        return textoLimpio;
    }
    
    /**
     * Formatea el texto de la receta para mostrar correctamente
     */
    function formatearReceta(texto) {
        return texto
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }
    
    /**
     * Formatea texto de lista extraído de HTML
     */
    function formatearTextoLista(texto) {
        return texto
            .replace(/\*\*/g, '*')
            .replace(/[ \t]+/g, ' ')
            .replace(/\*([^*\n]+)\*/g, '\n*$1*\n')
            .replace(/([🥬🥩🥛🌾🍎🧄🥜🫒📦])/g, '\n$1')
            .replace(/(### Lista de la Compra( Semanal)?)/g, '$1\n')
            .replace(/([^\n])\s*[-•]\s*/g, '$1\n- ')
            .replace(/([^\n])\s*\*\s*([^*])/g, '$1\n* $2')
            .replace(/\n\s*\n\s*\n+/g, '\n\n')
            .replace(/^\s+/gm, '')
            .replace(/\s+$/gm, '')
            .replace(/(\*[^*\n]+\*)\s*\n([^\n*])/g, '$1\n\n$2')
            .trim()
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n/g, '\r\n');
    }
    
    /**
     * Muestra estado de carga
     */
    function mostrarCargando(mode) {
        const loadingMessages = {
            'receta-ingredientes': 'Creando receta perfecta con tus ingredientes...',
            'limpia-neveras': 'Analizando tu nevera y creando la mejor receta...',
            'adaptador-inteligente': 'Adaptando receta según tus preferencias...',
            'plan-semanal': 'Generando tu plan semanal personalizado de 7 días...'
        };
        
        const loadingText = loadingMessages[mode] || 'Generando receta...';
        respuestaDiv.innerHTML = `<div class="loading">${loadingText}</div>`;
        respuestaDiv.classList.add('show');
        
        const button = getButtonByMode(mode);
        if (button) {
            button.disabled = true;
            button.textContent = 'Generando...';
        }
    }
    
    /**
     * Oculta el estado de carga
     */
    function ocultarCargando(mode) {
        const button = getButtonByMode(mode);
        const originalTexts = {
            'receta-ingredientes': 'Crear Receta',
            'limpia-neveras': 'Limpiar Nevera',
            'adaptador-inteligente': 'Adaptar Receta',
            'plan-semanal': 'Generar Plan Semanal'
        };
        
        if (button) {
            button.disabled = false;
            button.textContent = originalTexts[mode] || 'Generar';
        }
    }
    
    /**
     * Obtiene el botón correspondiente al modo
     */
    function getButtonByMode(mode) {
        const buttons = {
            'receta-ingredientes': generarIngredientesBtn,
            'limpia-neveras': generarLimpiaBtn,
            'adaptador-inteligente': generarAdaptadorBtn,
            'plan-semanal': generarPlanBtn
        };
        return buttons[mode] || null;
    }
    
    /**
     * Muestra un mensaje de error
     */
    function mostrarError(mensaje) {
        respuestaDiv.innerHTML = `
            <div class="error">
                <h3>❌ Error</h3>
                <p>${mensaje}</p>
            </div>
        `;
    }
    
    /**
     * Muestra los botones de acción según el modo
     */
    function mostrarBotonesAccion(mode, recetaTexto) {
        if (mode === 'plan-semanal' && window.planSemanalData && window.planSemanalData.listaCompra) {
            // Plan Semanal: mostrar todos los botones
            copiarListaBtn.style.display = 'block';
            exportarCalendarioPdfBtn.style.display = 'block';
            verTodasRecetasBtn.style.display = 'block';
            exportarRecetarioPdfBtn.style.display = 'block';
        } else if ((mode === 'receta-ingredientes' && recetaTexto.includes('### Lista de la Compra'))) {
            // Receta por Ingredientes: solo botón copiar
            copiarListaBtn.style.display = 'block';
            exportarCalendarioPdfBtn.style.display = 'none';
            verTodasRecetasBtn.style.display = 'none';
            exportarRecetarioPdfBtn.style.display = 'none';
        } else {
            ocultarBotonesAccion();
        }
    }
    
    /**
     * Oculta todos los botones de acción
     */
    function ocultarBotonesAccion() {
        copiarListaBtn.style.display = 'none';
        exportarCalendarioPdfBtn.style.display = 'none';
        verTodasRecetasBtn.style.display = 'none';
        exportarRecetarioPdfBtn.style.display = 'none';
    }
    
    /**
     * Muestra estado de carga para una receta específica
     */
    function mostrarCargandoReceta(nombreReceta) {
        let detalleContainer = document.getElementById('receta-detalle');
        if (!detalleContainer) {
            detalleContainer = document.createElement('div');
            detalleContainer.id = 'receta-detalle';
            detalleContainer.className = 'receta-detalle-container';
            respuestaDiv.appendChild(detalleContainer);
        }
        
        detalleContainer.innerHTML = `
            <div class="receta-detallada">
                <div class="receta-detalle-header">
                    <h4>🍽️ ${nombreReceta}</h4>
                    <button class="cerrar-receta" onclick="cerrarRecetaDetalle()">✖</button>
                </div>
                <div class="loading">Cargando receta completa...</div>
            </div>
        `;
        
        detalleContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Muestra la receta detallada
     */
    function mostrarRecetaDetallada(nombreReceta, recetaTexto) {
        const detalleContainer = document.getElementById('receta-detalle');
        if (!detalleContainer) return;
        
        detalleContainer.innerHTML = `
            <div class="receta-detallada">
                <div class="receta-detalle-header">
                    <h4>🍽️ ${nombreReceta}</h4>
                    <button class="cerrar-receta" onclick="cerrarRecetaDetalle()">✖</button>
                </div>
                <div class="receta-detalle-contenido">
                    ${formatearReceta(recetaTexto)}
                </div>
            </div>
        `;
    }
    
    /**
     * Muestra error al cargar una receta
     */
    function mostrarErrorReceta(nombreReceta, mensaje) {
        const detalleContainer = document.getElementById('receta-detalle');
        if (!detalleContainer) return;
        
        detalleContainer.innerHTML = `
            <div class="receta-detallada">
                <div class="receta-detalle-header">
                    <h4>❌ Error - ${nombreReceta}</h4>
                    <button class="cerrar-receta" onclick="cerrarRecetaDetalle()">✖</button>
                </div>
                <div class="error-contenido">
                    <p>${mensaje}</p>
                </div>
            </div>
        `;
    }
    
    // === FUNCIONES GLOBALES PARA BOTONES DE CERRAR ===
    
    /**
     * Cierra el detalle de receta
     */
    window.cerrarRecetaDetalle = function() {
        const detalleContainer = document.getElementById('receta-detalle');
        if (detalleContainer) {
            detalleContainer.remove();
        }
    }
    
    /**
     * Cierra el contenedor de todas las recetas
     */
    window.cerrarTodasRecetas = function() {
        const todasRecetasContainer = document.getElementById('todas-recetas');
        if (todasRecetasContainer) {
            todasRecetasContainer.remove();
        }
        
        if (verTodasRecetasBtn.classList.contains('completed')) {
            verTodasRecetasBtn.textContent = '🍽️ Ver Todas las Recetas';
            verTodasRecetasBtn.classList.remove('completed');
            verTodasRecetasBtn.disabled = false;
        }
    }
    
});