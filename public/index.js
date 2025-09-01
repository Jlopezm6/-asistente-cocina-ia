document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos de la interfaz
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const respuestaDiv = document.getElementById('respuesta');
    
    // Botones de generar para cada modo
    const generarIngredientesBtn = document.getElementById('generar-ingredientes');
    const generarLimpiaBtn = document.getElementById('generar-limpia');
    const generarAdaptadorBtn = document.getElementById('generar-adaptador');
    const generarPlanBtn = document.getElementById('generar-plan');
    const copiarListaBtn = document.getElementById('copiar-lista');
    const exportarCsvBtn = document.getElementById('exportar-csv');
    
    // Inicializar funcionalidad de pestañas
    initializeTabs();
    
    // Event listeners para botones de generar
    generarIngredientesBtn.addEventListener('click', async function() {
        await handleGenerate('receta-ingredientes');
    });
    
    generarLimpiaBtn.addEventListener('click', async function() {
        await handleGenerate('limpia-neveras');
    });
    
    generarAdaptadorBtn.addEventListener('click', async function() {
        await handleGenerate('adaptador-inteligente');
    });
    
    generarPlanBtn.addEventListener('click', async function() {
        await handleGenerate('plan-semanal');
    });
    
    // Event listener para el botón de copiar lista
    copiarListaBtn.addEventListener('click', function() {
        copiarListaCompra();
    });
    
    // Event listener para el botón de exportar CSV
    exportarCsvBtn.addEventListener('click', function() {
        exportarPlanCSV();
    });
    
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
     * @param {string} targetTab - ID de la pestaña objetivo
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
    }
    
    /**
     * Maneja la generación de recetas según el modo activo
     * @param {string} mode - Modo activo ('receta-ingredientes', 'limpia-neveras', 'adaptador-inteligente' o 'plan-semanal')
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
     * Recopila los datos del formulario según el modo
     * @param {string} mode - Modo activo
     * @returns {Object} Datos del formulario
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
                // Recopilar comidas seleccionadas
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
     * @param {Object} data - Datos a validar
     * @param {string} mode - Modo activo
     * @returns {boolean} True si los datos son válidos
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
                // Los cambios solicitados son opcionales, pero se recomienda incluirlos
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
                // Las preferencias son opcionales
                break;
        }
        return true;
    }
    
    /**
     * Muestra el estado de carga
     * @param {string} mode - Modo activo
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
        
        // Deshabilitar botón correspondiente
        const button = getButtonByMode(mode);
        if (button) {
            button.disabled = true;
            button.textContent = 'Generando...';
        }
    }
    
    /**
     * Oculta el estado de carga
     * @param {string} mode - Modo activo
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
     * @param {string} mode - Modo activo
     * @returns {HTMLElement|null} Elemento del botón
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
     * Genera la receta llamando al backend
     * @param {Object} data - Datos del formulario
     * @param {string} mode - Modo activo
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
    
    /**
     * Limpia el texto JSON de posibles bloques Markdown
     * @param {string} texto - Texto que puede contener JSON en bloque Markdown
     * @returns {string} JSON limpio listo para parsear
     */
    function limpiarJSONDeMarkdown(texto) {
        // Remover espacios en blanco al inicio y final
        let textoLimpio = texto.trim();
        
        // Verificar si está envuelto en bloque de código Markdown
        if (textoLimpio.startsWith('```json') || textoLimpio.startsWith('```JSON')) {
            // Encontrar la primera línea (```json o ```JSON)
            const lineas = textoLimpio.split('\n');
            
            // Remover primera línea si es el delimitador de inicio
            if (lineas[0].startsWith('```json') || lineas[0].startsWith('```JSON')) {
                lineas.shift();
            }
            
            // Remover última línea si es el delimitador de cierre
            if (lineas[lineas.length - 1].trim() === '```') {
                lineas.pop();
            }
            
            // Reconstruir el texto sin los delimitadores
            textoLimpio = lineas.join('\n').trim();
        }
        // También manejar caso donde solo hay ``` al inicio y final sin 'json'
        else if (textoLimpio.startsWith('```') && textoLimpio.endsWith('```')) {
            // Remover primer y último ```
            textoLimpio = textoLimpio.slice(3, -3).trim();
        }
        
        return textoLimpio;
    }
    
    /**
     * Muestra la receta generada
     * @param {string} recetaTexto - Texto de la receta
     * @param {string} mode - Modo utilizado
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
                // Almacenar datos JSON para uso en exportación
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
        
        // Mostrar botones según el modo y contenido
        if (mode === 'plan-semanal' && window.planSemanalData && window.planSemanalData.listaCompra) {
            // Plan Semanal: mostrar ambos botones
            copiarListaBtn.style.display = 'block';
            exportarCsvBtn.style.display = 'block';
        } else if ((mode === 'receta-ingredientes' && recetaTexto.includes('### Lista de la Compra'))) {
            // Receta por Ingredientes: solo botón copiar
            copiarListaBtn.style.display = 'block';
            exportarCsvBtn.style.display = 'none';
        } else {
            // Otros modos: ocultar ambos botones
            copiarListaBtn.style.display = 'none';
            exportarCsvBtn.style.display = 'none';
        }
    }
    
    /**
     * Formatea el texto de la receta para mostrar correctamente
     * @param {string} texto - Texto sin formatear
     * @returns {string} Texto formateado en HTML
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
     * Muestra un mensaje de error
     * @param {string} mensaje - Mensaje de error
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
                
                // Convertir HTML a texto plano y formatear
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
            
            // Restaurar después de 2 segundos
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
     * @param {Array} listaCompra - Array de categorías con items
     * @returns {string} Texto formateado para portapapeles
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
    
    /**
     * Formatea texto de lista extraído de HTML
     * @param {string} texto - Texto sin formatear
     * @returns {string} Texto formateado para portapapeles
     */
    function formatearTextoLista(texto) {
        return texto
            // Preservar asteriscos (*) que usa la IA para formatting
            .replace(/\*\*/g, '*')  // Convertir ** a * simple para mejor compatibilidad
            // Limpiar espacios múltiples en la misma línea, pero preservar saltos de línea
            .replace(/[ \t]+/g, ' ')
            // Preservar estructura de categorías con asteriscos
            .replace(/\*([^*\n]+)\*/g, '\n*$1*\n')  // Asegurar que categorías con * estén en líneas separadas
            // Asegurar formato de categorías con emojis
            .replace(/([🥬🥩🥛🌾🍎🧄🥜🫒📦])/g, '\n$1')
            // Asegurar título con espaciado adecuado
            .replace(/(### Lista de la Compra( Semanal)?)/g, '$1\n')
            // Preservar items de lista con guiones o asteriscos
            .replace(/([^\n])\s*[-•]\s*/g, '$1\n- ')  // Guiones y bullets
            .replace(/([^\n])\s*\*\s*([^*])/g, '$1\n* $2')  // Asteriscos como bullets
            // Limpiar líneas vacías múltiples pero mantener separación de categorías
            .replace(/\n\s*\n\s*\n+/g, '\n\n')
            // Limpiar espacios al inicio y final de cada línea
            .replace(/^\s+/gm, '')
            .replace(/\s+$/gm, '')
            // Asegurar que cada categoría tenga separación adecuada
            .replace(/(\*[^*\n]+\*)\s*\n([^\n*])/g, '$1\n\n$2')
            .trim()
            // Normalizar saltos de línea para compatibilidad del portapapeles
            .replace(/\r\n/g, '\n')  // Convertir Windows CRLF a LF
            .replace(/\r/g, '\n')    // Convertir Mac CR a LF
            .replace(/\n/g, '\r\n'); // Convertir a Windows CRLF para máxima compatibilidad
    }
    
    /**
     * Renderiza el plan semanal desde JSON a HTML
     * @param {Object} planData - Datos del plan semanal en formato JSON
     * @returns {string} HTML formateado
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
                            <p><strong>📋 Receta:</strong> ${comida.nombre}</p>
                            ${comida.ingredientes ? `<p><strong>🛒 Ingredientes:</strong> ${comida.ingredientes.join(', ')}</p>` : ''}
                            ${comida.preparacion ? `<p><strong>👨‍🍳 Preparación:</strong> ${comida.preparacion}</p>` : ''}
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
     * Exporta el plan semanal a un archivo CSV
     */
    function exportarPlanCSV() {
        try {
            // Verificar si hay datos JSON del plan semanal
            if (!window.planSemanalData || !window.planSemanalData.planSemanal) {
                alert('No hay un plan semanal válido para exportar');
                return;
            }
            
            const planData = window.planSemanalData;
            
            // Crear encabezados CSV
            const csvRows = [];
            csvRows.push(['Dia', 'Comida', 'Receta', 'Calorias', 'Proteinas', 'Grasas', 'Carbohidratos', 'Fibra', 'Vitaminas']);
            
            // Generar filas de datos desde JSON
            planData.planSemanal.forEach(diaData => {
                diaData.comidas.forEach(comida => {
                    csvRows.push([
                        diaData.dia,
                        comida.tipo,
                        comida.nombre,
                        comida.calorias,
                        comida.proteinas,
                        comida.grasas,
                        comida.carbohidratos,
                        comida.fibra || '',
                        comida.vitaminas || ''
                    ]);
                });
            });
            
            // Convertir a CSV con punto y coma como separador
            const csvContent = csvRows.map(row => 
                row.map(field => {
                    // Escapar comillas en el contenido
                    const stringField = String(field).replace(/"/g, '""');
                    // Envolver en comillas si contiene punto y coma o saltos de línea
                    return stringField.includes(';') || stringField.includes('\n') || stringField.includes('"') 
                        ? `"${stringField}"` 
                        : stringField;
                }).join(';')
            ).join('\r\n'); // Usar CRLF para máxima compatibilidad con Excel
            
            // Crear y descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'plan-semanal.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Feedback visual
                const textoOriginal = exportarCsvBtn.textContent;
                exportarCsvBtn.textContent = '✅ ¡Exportado!';
                exportarCsvBtn.classList.add('exported');
                exportarCsvBtn.disabled = true;
                
                setTimeout(() => {
                    exportarCsvBtn.textContent = textoOriginal;
                    exportarCsvBtn.classList.remove('exported');
                    exportarCsvBtn.disabled = false;
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error al exportar CSV:', error);
            alert('Error al exportar el plan. Por favor, inténtalo de nuevo.');
        }
    }
});