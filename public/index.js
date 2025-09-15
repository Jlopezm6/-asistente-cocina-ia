document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS ---
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const generateBtn = document.getElementById('generate-button');
    const responseDiv = document.getElementById('response');
    const pdfTemplate = document.getElementById('pdf-template');
    const motivationalQuote = document.getElementById('motivational-quote');

    let currentMode = 'receta-ingredientes';
    
    // --- FRASES MOTIVADORAS ---
    const motivationalQuotes = [
        "Estás a un paso de empezar a mejorar tu salud",
        "No hay un día perfecto, el mejor momento es ahora",
        "Cada comida saludable es una victoria personal",
        "Tu cuerpo es tu hogar, cuídalo con amor",
        "Pequeños cambios, grandes resultados",
        "Plantando semillas de bienestar cada día",
        "La salud es la mayor riqueza que puedes tener",
        "Elevando tu energía con cada elección inteligente",
        "Alimenta tu cuerpo, nutre tu alma",
        "Eres el chef de tu propia transformación"
    ];
    
    // Rotar frases motivadoras cada 8 segundos
    let quoteIndex = 0;
    function rotateQuote() {
        if (motivationalQuote) {
            // Efecto de fade out
            motivationalQuote.style.opacity = '0';
            motivationalQuote.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                motivationalQuote.innerHTML = `<p>${motivationalQuotes[quoteIndex]}</p>`;
                // Efecto de fade in
                motivationalQuote.style.opacity = '1';
                motivationalQuote.style.transform = 'translateY(0)';
                quoteIndex = (quoteIndex + 1) % motivationalQuotes.length;
            }, 300);
        }
    }
    
    // Iniciar rotación de frases
    rotateQuote(); // Mostrar primera frase inmediatamente
    setInterval(rotateQuote, 12000); // Cambiar cada 12 segundos

    // --- INICIALIZACIÓN ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentMode = tab.dataset.tab;
            tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === currentMode));
            tabContents.forEach(c => c.classList.toggle('active', c.id === currentMode));
            responseDiv.innerHTML = '';
        });
    });

    generateBtn.addEventListener('click', handleGenerate);
    
    // --- UTILIDADES PDF ---
    function checkHTML2PDF() {
        if (typeof html2pdf === 'undefined') {
            console.error('❌ html2pdf no está disponible');
            alert('Error: La librería de generación de PDF no está disponible. Recarga la página e inténtalo de nuevo.');
            return false;
        }
        return true;
    }
    
    // --- VALIDACIÓN DE INGREDIENTES PELIGROSOS ---
    const INGREDIENTES_PROHIBIDOS = [
        // Químicos y tóxicos
        'disolvente', 'disolventes', 'solvente', 'solventes', 'acetona', 'gasolina', 'queroseno',
        'alcohol isopropílico', 'metanol', 'etanol industrial', 'amoniaco', 'lejía', 'cloro',
        'ácido sulfúrico', 'ácido clorhídrico', 'soda cáustica', 'hidróxido de sodio',
        'formaldehído', 'benceno', 'tolueno', 'xileno', 'mercurio', 'plomo', 'arsénico',
        
        // Sustancias no comestibles
        'cadáver', 'cadáveres', 'carne podrida', 'carne en mal estado', 'moho', 'hongos tóxicos',
        'setas venenosas', 'bayas venenosas', 'plantas tóxicas', 'hojas de ruibarbo',
        'semillas de manzana', 'huesos de durazno', 'almendras amargas',
        
        // Medicamentos y drogas
        'medicamento', 'medicamentos', 'pastillas', 'píldoras', 'droga', 'drogas',
        'marihuana', 'cannabis', 'cocaína', 'heroína', 'lsd', 'éxtasis',
        
        // Productos de limpieza
        'detergente', 'jabón para platos', 'limpiador', 'desinfectante', 'blanqueador',
        'suavizante', 'quitamanchas', 'lustramuebles', 'cera',
        
        // Otros peligrosos
        'vidrio', 'metal', 'plástico', 'papel', 'cartón', 'madera', 'tierra', 'arena',
        'pintura', 'barniz', 'pegamento', 'silicona', 'yeso', 'cemento', 'cal',
        'insecticida', 'pesticida', 'veneno', 'raticida', 'herbicida',
        'combustible', 'aceite de motor', 'grasa industrial', 'lubricante'
    ];
    
    function validateIngredientsSafety(text) {
        if (!text || typeof text !== 'string') return { isValid: true };
        
        const textLower = text.toLowerCase().trim();
        const dangerousIngredients = [];
        
        for (const prohibited of INGREDIENTES_PROHIBIDOS) {
            if (textLower.includes(prohibited.toLowerCase())) {
                dangerousIngredients.push(prohibited);
            }
        }
        
        if (dangerousIngredients.length > 0) {
            return {
                isValid: false,
                dangerousIngredients,
                message: `⚠️ Ingredientes no permitidos detectados: ${dangerousIngredients.join(', ')}. Por favor, usa solo ingredientes comestibles y seguros.`
            };
        }
        
        return { isValid: true };
    }
    
    // --- FUNCIONES ALTERNATIVAS DE PDF ---
    function openPrintWindow(htmlContent, title = 'Documento') {
        try {
            // Intentar abrir ventana emergente
            const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (!printWindow) {
                console.log('⚠️ Pop-up bloqueado, usando método alternativo...');
                return openPrintInSamePage(htmlContent, title);
            }
            
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 20px; }
                            @page { margin: 0.5in; size: A4 landscape; }
                            .no-print { display: none; }
                        }
                        body { 
                            font-family: 'Lato', Arial, sans-serif; 
                            line-height: 1.4; 
                            color: #212529;
                            background: white;
                            font-size: 12px;
                        }
                        h1 { 
                            font-family: 'Poppins', Arial, sans-serif; 
                            color: #2D6A4F; 
                            font-weight: bold;
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        h2, h3 { 
                            font-family: 'Poppins', Arial, sans-serif; 
                            color: #2D6A4F; 
                            font-weight: 600;
                        }
                        table { 
                            border-collapse: collapse; 
                            width: 100%; 
                            margin: 10px 0;
                        }
                        td, th { 
                            border: 1px solid #DEE2E6; 
                            padding: 8px; 
                            vertical-align: top;
                            font-size: 11px;
                        }
                        th { 
                            background-color: #F8F9FA; 
                            font-weight: bold;
                            color: #2D6A4F;
                        }
                        .nutrition-info { 
                            background-color: #F8F9FA; 
                            padding: 5px; 
                            border-radius: 3px;
                            font-size: 10px;
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                                setTimeout(() => window.close(), 1000);
                            }, 500);
                        }
                    </script>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            return true;
            
        } catch (error) {
            console.error('❌ Error abriendo ventana:', error);
            return openPrintInSamePage(htmlContent, title);
        }
    }
    
    function openPrintInSamePage(htmlContent, title) {
        // Método alternativo: descargar como archivo HTML
        const blob = new Blob([`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.4; padding: 20px; }
                    h1, h2, h3 { color: #2D6A4F; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid #ddd; padding: 8px; }
                    @media print { @page { margin: 0.5in; } }
                </style>
            </head>
            <body>
                ${htmlContent}
                <div class="no-print" style="margin-top: 30px; padding: 15px; background: #e8f5e8; border: 2px solid #2D6A4F; border-radius: 8px; page-break-before: always;">
                    <p style="margin: 0; font-weight: bold; color: #2D6A4F;">💡 Para guardar como PDF:</p>
                    <p style="margin: 5px 0 0 0; color: #2D6A4F;">• Usa Ctrl+P (Windows) o Cmd+P (Mac)</p>
                    <p style="margin: 0; color: #2D6A4F;">• Selecciona "Guardar como PDF" en destino</p>
                </div>
            </body>
            </html>
        `], { type: 'text/html' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title.toLowerCase().replace(/\s+/g, '-') + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('📄 Se ha descargado un archivo HTML. Ábrelo y usa Ctrl+P / Cmd+P para guardarlo como PDF.');
        return false;
    }

    // TEMPORAL: Función de prueba para PDF
    window.testPDF = function() {
        console.log('🧪 Probando PDF alternativo...');
        
        const htmlSimple = `
            <h1 style="color: red;">TEST PDF ALTERNATIVO</h1>
            <p>Este es un texto de prueba usando window.print()</p>
            <p>Si aparece este texto, el sistema funciona.</p>
            <p>Usa Ctrl+P o Cmd+P para guardar como PDF.</p>
        `;
        
        openPrintWindow(htmlSimple, 'Test PDF');
        console.log('✅ Ventana de impresión abierta');
    };

    // --- LÓGICA PRINCIPAL ---
    async function handleGenerate() {
        console.log('🚀 Iniciando generación con modo:', currentMode);
        const formData = collectFormData(currentMode);
        console.log('📋 FormData completo:', formData);
        
        // Validar datos básicos
        if (!validateFormData(formData, currentMode)) {
            console.error('❌ Validación fallida');
            return;
        }
        
        setLoading(true);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const responseData = await response.json();
            let resultText = responseData.resultado;
            
            console.log('📥 Respuesta cruda del servidor:', resultText.substring(0, 200) + '...');
            
            // Limpiar markdown si existe
            if (resultText.startsWith('```json')) {
                resultText = resultText.substring(7, resultText.length - 3).trim();
            }
            
            let data;
            try {
                data = JSON.parse(resultText);
                console.log('✅ JSON parseado correctamente:', data);
                
                // Guardar plan generado si es plan semanal
                if (currentMode === 'plan-semanal' && data.planSemanal) {
                    window.lastGeneratedPlan = data;
                    console.log('💾 Plan semanal guardado para PDFs:', {
                        dias: data.planSemanal.length,
                        primerDia: data.planSemanal[0]?.dia,
                        comidas: data.planSemanal[0]?.comidas?.length
                    });
                } else {
                    console.log('⚠️ No se guardó plan:', { currentMode, hasPlan: !!data.planSemanal });
                }
            } catch (jsonError) {
                console.error('❌ Error parseando JSON:', jsonError);
                console.log('📄 Texto que causó el error:', resultText.substring(0, 500));
                
                // Si no es JSON válido, tratar como texto plano
                data = {
                    tipo: 'texto',
                    contenido: resultText,
                    modo: currentMode
                };
                console.log('🔧 Usando fallback de texto plano');
            }
            
            // Almacenar datos para uso posterior
            window.lastResponseData = data;
            window.lastFormData = formData; // Almacenar formData para PDFs
            // NO resetear plan aquí, se guardará cuando se parsee correctamente
            
            // Renderizar respuesta según el modo
            renderResponse(data, currentMode, formData);

        } catch (error) {
            console.error('Error en la generación:', error);
            
            let errorMessage = 'Error desconocido';
            if (error.message.includes('503')) {
                errorMessage = '🔄 El servicio de IA está temporalmente sobrecargado. Por favor, espera unos minutos e inténtalo de nuevo.';
            } else if (error.message.includes('429')) {
                errorMessage = '⏰ Demasiadas peticiones. Por favor, espera 30 segundos e inténtalo de nuevo.';
            } else if (error.message.includes('500')) {
                errorMessage = '⚠️ Error interno del servidor. Por favor, inténtalo de nuevo.';
            } else {
                errorMessage = `❌ Error: ${error.message}`;
            }
            
            responseDiv.innerHTML = `<div class="error">${errorMessage}</div>`;
        } finally {
            setLoading(false);
        }
    }

    function collectFormData(mode) {
        const formData = { mode: mode };
        
        // Recolectar opciones comunes (personas y dieta)
        const personasSelect = document.getElementById('personas');
        const dietaSelect = document.getElementById('dieta');
        
        if (personasSelect) {
            formData.personas = personasSelect.value;
        }
        
        if (dietaSelect) {
            formData.dieta = dietaSelect.value;
        }
        
        // Recolectar datos específicos según el modo
        switch (mode) {
            case 'receta-ingredientes':
                const ingredientesPrincipales = document.getElementById('ingredientes-principales');
                if (ingredientesPrincipales) {
                    formData.ingredientesPrincipales = ingredientesPrincipales.value.trim();
                }
                break;
                
            case 'limpia-neveras':
                const ingredientesNevera = document.getElementById('ingredientes-nevera');
                if (ingredientesNevera) {
                    formData.ingredientes = ingredientesNevera.value.trim();
                }
                break;
                
            case 'adaptador-inteligente':
                const recetaOriginal = document.getElementById('receta-original');
                const cambiosSolicitados = document.getElementById('cambios-solicitados');
                if (recetaOriginal) {
                    formData.recetaOriginal = recetaOriginal.value.trim();
                }
                if (cambiosSolicitados) {
                    formData.cambiosSolicitados = cambiosSolicitados.value.trim();
                }
                break;
                
            case 'plan-semanal':
                const caloriasObjetivo = document.getElementById('calorias-objetivo');
                const preferenciasPlan = document.getElementById('preferencias-plan');
                
                if (caloriasObjetivo) {
                    formData.caloriasObjetivo = caloriasObjetivo.value;
                }
                
                if (preferenciasPlan) {
                    formData.preferencias = preferenciasPlan.value.trim();
                }
                
                // Recolectar checkboxes de comidas
                const comidasSeleccionadas = [];
                const checkboxes = document.querySelectorAll('input[name="comidas"]');
                checkboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        comidasSeleccionadas.push(checkbox.value);
                    }
                });
                formData.comidasSeleccionadas = comidasSeleccionadas;
                break;
        }
        
        console.log('📋 Datos recolectados:', formData);
        console.log('🔍 Modo:', formData.mode);
        console.log('👥 Personas:', formData.personas);
        console.log('🍽️ Dieta:', formData.dieta);
        
        // Validación específica por modo
        if (formData.mode === 'receta-ingredientes' && !formData.ingredientesPrincipales) {
            console.error('❌ Error: ingredientesPrincipales vacío');
        }
        if (formData.mode === 'limpia-neveras' && !formData.ingredientes) {
            console.error('❌ Error: ingredientes vacío');
        }
        if (formData.mode === 'adaptador-inteligente' && !formData.recetaOriginal) {
            console.error('❌ Error: recetaOriginal vacío');
        }
        
        return formData;
    }
    
    function validateFormData(data, mode) {
        console.log('🔍 Validando datos para modo:', mode);
        console.log('📊 Datos a validar:', data);
        
        switch (mode) {
            case 'receta-ingredientes':
                console.log('🥕 Validando ingredientes principales:', data.ingredientesPrincipales);
                if (!data.ingredientesPrincipales || data.ingredientesPrincipales.trim() === '') {
                    console.error('❌ ingredientesPrincipales está vacío');
                    alert('Por favor, ingresa al menos un ingrediente principal');
                    return false;
                }
                
                // Validar ingredientes peligrosos
                const safetyCheck = validateIngredientsSafety(data.ingredientesPrincipales);
                if (!safetyCheck.isValid) {
                    console.error('❌ Ingredientes peligrosos detectados:', safetyCheck.dangerousIngredients);
                    alert(safetyCheck.message);
                    return false;
                }
                break;
                
            case 'limpia-neveras':
                if (!data.ingredientes) {
                    alert('Por favor, ingresa los ingredientes que tienes en la nevera');
                    return false;
                }
                
                // Validar ingredientes peligrosos
                const safetyCheckNevera = validateIngredientsSafety(data.ingredientes);
                if (!safetyCheckNevera.isValid) {
                    console.error('❌ Ingredientes peligrosos detectados:', safetyCheckNevera.dangerousIngredients);
                    alert(safetyCheckNevera.message);
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
                
                // Validar ingredientes peligrosos en preferencias (si existen)
                if (data.preferencias && data.preferencias.trim() !== '') {
                    const safetyCheckPlan = validateIngredientsSafety(data.preferencias);
                    if (!safetyCheckPlan.isValid) {
                        console.error('❌ Ingredientes peligrosos detectados en preferencias:', safetyCheckPlan.dangerousIngredients);
                        alert(safetyCheckPlan.message);
                        return false;
                    }
                }
                break;
        }
        return true;
    }

    function setLoading(isLoading, mode = currentMode) {
        generateBtn.disabled = isLoading;
        
        if (isLoading) {
            const motivationalMessages = {
                'receta-ingredientes': [
                    '🍳 Creando tu receta perfecta...',
                    '✨ Transformando ingredientes en magia...',
                    '🥗 Preparando algo delicioso para ti...',
                    '👨‍🍳 El chef IA está trabajando...'
                ],
                'limpia-neveras': [
                    '🗄️ Aprovechando al máximo tu nevera...',
                    '♻️ Creando magia con lo que tienes...',
                    '🌟 Convirtiendo sobras en manjares...',
                    '💚 Reduciendo desperdicio, creando sabor...'
                ],
                'adaptador-inteligente': [
                    '🧠 Adaptando tu receta inteligentemente...',
                    '🔄 Mejorando y personalizando...',
                    '⚡ Optimizando tu receta favorita...',
                    '🎯 Creando la versión perfecta para ti...'
                ],
                'plan-semanal': [
                    '📅 Preparando tu plan semanal personalizado...',
                    '🥇 Diseñando tu camino hacia una mejor salud...',
                    '💪 Creando tu rutina nutricional perfecta...',
                    '🎯 Planificando tu éxito nutricional...',
                    '🌟 Construyendo hábitos saludables para ti...',
                    '🚀 Elevando tu bienestar a otro nivel...'
                ]
            };
            
            const messages = motivationalMessages[mode] || motivationalMessages['receta-ingredientes'];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            generateBtn.textContent = randomMessage;
        } else {
            generateBtn.textContent = 'Generar';
        }
    }
    
    function renderResponse(data, mode, originalFormData) {
        console.log('🎨 Renderizando respuesta. Modo:', mode, 'Data:', data);
        
        // Si es solo texto plano (fallback), mostrarlo como tal
        if (data.tipo === 'texto') {
            responseDiv.innerHTML = `
                <div class="single-recipe-container">
                    <h3>Resultado (Formato Texto)</h3>
                    <div class="recipe-text-content">
                        <pre>${data.contenido}</pre>
                    </div>
                </div>
            `;
            return;
        }
        
        if (mode === 'plan-semanal' && data.planSemanal && data.listaCompra) {
            // TEMPORALMENTE DESACTIVADO: Enriquecimiento progresivo para evitar rate limiting
            // startProgressiveEnrichment(data, originalFormData);
            renderFinalWeeklyPlan(data, originalFormData);
        } else {
            // Renderizar receta normal para otros modos
            renderSingleRecipe(data, mode);
        }
    }
    
    // === ENRIQUECIMIENTO PROGRESIVO ===
    
    async function startProgressiveEnrichment(initialData, originalFormData) {
        console.log('🚀 Iniciando enriquecimiento progresivo...');
        
        // Mostrar plan inicial con datos básicos y feedback de carga
        renderInitialWeeklyPlan(initialData, originalFormData);
        
        // Extraer todas las recetas del plan
        const allRecipes = [];
        initialData.planSemanal.forEach(dia => {
            dia.comidas.forEach(comida => {
                allRecipes.push({
                    nombre: comida.nombre,
                    tipo: comida.tipo,
                    dia: dia.dia,
                    calorias: comida.calorias || 0,
                    proteinas: comida.proteinas || 0,
                    grasas: comida.grasas || 0,
                    carbohidratos: comida.carbohidratos || 0
                });
            });
        });
        
        console.log(`📋 Total de recetas a enriquecer: ${allRecipes.length}`);
        
        // Inicializar sistema de acumulación de datos
        window.enrichedRecipes = {};
        window.totalRecipes = allRecipes.length;
        window.completedRecipes = 0;
        
        // Actualizar feedback de progreso
        updateProgressFeedback(0, allRecipes.length);
        
        // Iniciar peticiones en paralelo para obtener detalles
        const promises = allRecipes.map(async (receta, index) => {
            try {
                await new Promise(resolve => setTimeout(resolve, index * 200)); // Stagger requests
                const detalles = await fetchRecipeDetails(receta.nombre, originalFormData.personas, originalFormData.dieta);
                
                // Acumular datos enriquecidos
                window.enrichedRecipes[receta.nombre] = {
                    ...receta,
                    detallesCompletos: detalles
                };
                
                window.completedRecipes++;
                
                // Actualizar feedback de progreso
                updateProgressFeedback(window.completedRecipes, window.totalRecipes);
                
                console.log(`✅ Enriquecida: ${receta.nombre} (${window.completedRecipes}/${window.totalRecipes})`);
                
                // Si todas las recetas están listas, renderizar plan completo
                if (window.completedRecipes === window.totalRecipes) {
                    await finalizeEnrichedPlan(initialData, originalFormData);
                }
                
            } catch (error) {
                console.error(`❌ Error enriqueciendo ${receta.nombre}:`, error);
                
                // Marcar como completado aunque haya fallado para no bloquear el proceso
                window.completedRecipes++;
                updateProgressFeedback(window.completedRecipes, window.totalRecipes);
                
                // Si todas las recetas están procesadas (con o sin error), finalizar
                if (window.completedRecipes === window.totalRecipes) {
                    await finalizeEnrichedPlan(initialData, originalFormData);
                }
            }
        });
        
        // Timeout de seguridad (30 segundos máximo)
        setTimeout(async () => {
            if (window.completedRecipes < window.totalRecipes) {
                console.warn('⚠️ Timeout alcanzado, finalizando con datos parciales...');
                await finalizeEnrichedPlan(initialData, originalFormData);
            }
        }, 30000);
    }
    
    async function fetchRecipeDetails(nombreReceta, personas, dieta) {
        const response = await fetch('/api/get-recipe-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreReceta,
                personas,
                dieta
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        // Parse JSON si viene como string
        let detalleReceta = result.detalleReceta;
        if (typeof detalleReceta === 'string') {
            // Limpiar markdown si existe
            if (detalleReceta.startsWith('```json')) {
                detalleReceta = detalleReceta.substring(7, detalleReceta.length - 3).trim();
            }
            detalleReceta = JSON.parse(detalleReceta);
        }
        
        return detalleReceta;
    }
    
    function updateProgressFeedback(completed, total) {
        const progressContainer = document.getElementById('enrichment-progress');
        if (progressContainer) {
            const percentage = Math.round((completed / total) * 100);
            progressContainer.innerHTML = `
                <div class="progress-info">
                    <p>🔄 Enriqueciendo recetas... ${completed}/${total} completadas (${percentage}%)</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
            
            if (completed === total) {
                progressContainer.innerHTML = `
                    <div class="progress-complete">
                        <p>✅ ¡Todas las recetas enriquecidas! Generando vista final...</p>
                    </div>
                `;
            }
        }
    }
    
    async function finalizeEnrichedPlan(initialData, originalFormData) {
        console.log('🎉 Finalizando plan enriquecido...');
        
        // Construir datos finales combinando inicial + enriquecido
        const enrichedPlanData = {
            planSemanal: initialData.planSemanal.map(dia => ({
                ...dia,
                comidas: dia.comidas.map(comida => {
                    const enrichedRecipe = window.enrichedRecipes[comida.nombre];
                    if (enrichedRecipe && enrichedRecipe.detallesCompletos) {
                        return {
                            ...comida,
                            recetaCompleta: enrichedRecipe.detallesCompletos,
                            ingredientes: enrichedRecipe.detallesCompletos.ingredientes || [],
                            instrucciones: enrichedRecipe.detallesCompletos.instrucciones || [],
                            tiempoPreparacion: enrichedRecipe.detallesCompletos.tiempoPreparacion || 0,
                            tiempoCoccion: enrichedRecipe.detallesCompletos.tiempoCoccion || 0,
                            consejos: enrichedRecipe.detallesCompletos.consejos || [],
                            variaciones: enrichedRecipe.detallesCompletos.variaciones || []
                        };
                    }
                    return comida;
                })
            })),
            listaCompra: initialData.listaCompra
        };
        
        // Almacenar datos finales globalmente
        window.lastResponseData = enrichedPlanData;
        
        // Renderizar plan final completo
        renderFinalWeeklyPlan(enrichedPlanData, originalFormData);
    }
    
    function renderInitialWeeklyPlan(data, originalFormData) {
        const html = `
            <div class="weekly-plan-container">
                <h3>📅 Tu Plan Semanal Personalizado</h3>
                <div class="plan-info">
                    <p><strong>Para:</strong> ${originalFormData.personas || 2} persona${(originalFormData.personas || 2) > 1 ? 's' : ''}</p>
                    <p><strong>Dieta:</strong> ${originalFormData.dieta === 'ninguna' ? 'Sin restricciones' : originalFormData.dieta}</p>
                    <p><strong>Objetivo calórico:</strong> ${originalFormData.caloriasObjetivo} kcal/día</p>
                </div>
                
                <div id="enrichment-progress" class="enrichment-progress">
                    <div class="progress-info">
                        <p>🚀 Preparando plan detallado...</p>
                    </div>
                </div>
                
                <div class="days-grid">
                    ${renderDaysGrid(data.planSemanal)}
                </div>
                
                <div class="shopping-list">
                    <h4>🛒 Lista de la Compra Semanal</h4>
                    ${renderShoppingList(data.listaCompra)}
                </div>
                
                <div class="action-buttons-loading">
                    <p>⏳ Los botones de descarga se activarán cuando todas las recetas estén listas...</p>
                </div>
            </div>
        `;
        
        responseDiv.innerHTML = html;
    }
    
    function renderFinalWeeklyPlan(data, originalFormData) {
        // Guardar datos del plan para uso posterior (PDF con instrucciones)
        window.lastPlanData = data;
        
        const html = `
            <div class="weekly-plan-container">
                <h3>📅 Tu Plan Semanal Personalizado</h3>
                <div class="plan-info">
                    <p><strong>Para:</strong> ${originalFormData.personas || 2} persona${(originalFormData.personas || 2) > 1 ? 's' : ''}</p>
                    <p><strong>Dieta:</strong> ${originalFormData.dieta === 'ninguna' ? 'Sin restricciones' : originalFormData.dieta}</p>
                    <p><strong>Objetivo calórico:</strong> ${originalFormData.caloriasObjetivo} kcal/día</p>
                </div>
                
                <div class="action-buttons action-buttons-top">
                    <button id="copy-shopping-btn" class="action-btn copy-btn">
                        📋 Copiar Lista de Compra
                    </button>
                    <button id="view-all-recipes-btn" class="action-btn view-all-btn">
                        🍽️ Ver Todas las Recetas
                    </button>
                    <button id="download-calendar-btn" class="action-btn calendar-btn">
                        📅 Descargar Calendario PDF
                    </button>
                    <button id="download-recipes-btn" class="action-btn recipes-btn">
                        📖 Descargar Recetario PDF
                    </button>
                </div>
                
                <div class="completion-notice">
                    <p>✨ <strong>¡Plan completo!</strong> Tu plan nutricional personalizado está listo. Usa los botones de arriba para descargar o gestionar tu plan.</p>
                </div>
                
                <div class="days-grid">
                    ${renderDaysGrid(data.planSemanal, true)}
                </div>
                
                <div class="shopping-list">
                    <h4>🛒 Lista de la Compra Semanal</h4>
                    ${renderShoppingList(data.listaCompra)}
                </div>
            </div>
        `;
        
        responseDiv.innerHTML = html;
        
        // Activar todos los botones funcionales
        setupActionButtons(data);
        
        // Configurar interactividad de recetas
        setupRecipeInteractions(data);
    }

    function renderWeeklyPlan(data, originalFormData) {
        const html = `
            <div class="weekly-plan-container">
                <h3>📅 Tu Plan Semanal Personalizado</h3>
                <div class="plan-info">
                    <p><strong>Para:</strong> ${originalFormData.personas || 2} persona${(originalFormData.personas || 2) > 1 ? 's' : ''}</p>
                    <p><strong>Dieta:</strong> ${originalFormData.dieta === 'ninguna' ? 'Sin restricciones' : originalFormData.dieta}</p>
                    <p><strong>Objetivo calórico:</strong> ${originalFormData.caloriasObjetivo} kcal/día</p>
                </div>
                
                <div class="days-grid">
                    ${renderDaysGrid(data.planSemanal)}
                </div>
                
                <div class="shopping-list">
                    <h4>🛒 Lista de la Compra Semanal</h4>
                    ${renderShoppingList(data.listaCompra)}
                </div>
                
                <div class="action-buttons">
                    <button id="copy-shopping-btn" class="action-btn copy-btn">
                        📋 Copiar Lista de Compra
                    </button>
                    <button id="download-calendar-btn" class="action-btn calendar-btn">
                        📅 Descargar Calendario PDF
                    </button>
                    <button id="download-recipes-btn" class="action-btn recipes-btn">
                        📖 Descargar Recetario PDF
                    </button>
                </div>
            </div>
        `;
        
        responseDiv.innerHTML = html;
        
        // Agregar event listeners a los botones
        setupActionButtons(data);
    }
    
    function renderDaysGrid(planSemanal, showEnrichedData = false) {
        return planSemanal.map(dia => `
            <div class="day-card">
                <h5 class="day-title">🗓️ ${dia.dia}</h5>
                <div class="meals">
                    ${dia.comidas.map((comida, index) => `
                        <div class="meal-item ${comida.recetaCompleta ? 'enriched' : ''}" 
                             data-recipe-name="${comida.nombre}" 
                             data-day="${dia.dia}"
                             data-meal-index="${index}">
                            <div class="meal-header">
                                <span class="meal-type">${getMealEmoji(comida.tipo)} ${comida.tipo}</span>
                                ${comida.recetaCompleta ? '<span class="enriched-badge">✨</span>' : ''}
                            </div>
                            <div class="meal-name clickable-recipe" title="Click para ver detalles completos">
                                ${comida.nombre}
                            </div>
                            <div class="meal-nutrition">
                                📊 ${comida.calorias || 0} kcal | 
                                P: ${comida.proteinas || 0}g | 
                                G: ${comida.grasas || 0}g | 
                                C: ${comida.carbohidratos || 0}g
                                ${comida.vitaminaC || comida.vitaminaD || comida.calcio || comida.hierro ? `
                                <div class="vitamins-info">
                                    🍊 ${comida.vitaminaC ? `Vit.C: ${comida.vitaminaC}mg` : ''} 
                                    ${comida.vitaminaD ? `Vit.D: ${comida.vitaminaD}μg` : ''} 
                                    ${comida.calcio ? `Ca: ${comida.calcio}mg` : ''} 
                                    ${comida.hierro ? `Fe: ${comida.hierro}mg` : ''}
                                </div>` : ''}
                                ${comida.preparacion && comida.preparacion.length > 0 ? `
                                <div class="preparation-steps">
                                    <span class="prep-title">👨‍🍳 Preparación:</span>
                                    <ol class="prep-list">
                                        ${comida.preparacion.map(paso => `<li>${paso}</li>`).join('')}
                                    </ol>
                                </div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${dia.totalCalorias ? `
                    <div class="day-total">
                        <strong>📈 Total: ${dia.totalCalorias} kcal</strong>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    function renderShoppingList(listaCompra) {
        // Si listaCompra es un array (formato antiguo), usar la lógica anterior
        if (Array.isArray(listaCompra)) {
            return `
                <div class="categories-grid">
                    ${listaCompra.map(categoria => `
                        <div class="category-card">
                            <h6 class="category-title">${getCategoryEmoji(categoria.categoria)} ${categoria.categoria}</h6>
                            <ul class="items-list">
                                ${categoria.items.map(item => `<li>• ${item}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Si es un objeto (nuevo formato JSON), convertir a categorías
        if (typeof listaCompra === 'object' && listaCompra !== null) {
            const categorias = Object.entries(listaCompra)
                .filter(([key, items]) => Array.isArray(items) && items.length > 0)
                .map(([key, items]) => ({
                    categoria: getCategoryName(key),
                    items: items
                }));
            
            return `
                <div class="categories-grid">
                    ${categorias.map(categoria => `
                        <div class="category-card">
                            <h6 class="category-title">${getCategoryEmoji(categoria.categoria)} ${categoria.categoria}</h6>
                            <ul class="items-list">
                                ${categoria.items.map(item => `<li>• ${item}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Fallback si no hay lista de compra
        return '<p>Lista de compra no disponible</p>';
    }
    
    function renderSingleRecipe(data, mode) {
        const titles = {
            'receta-ingredientes': '🥗 Tu Receta por Ingredientes',
            'limpia-neveras': '🗄️ Tu Receta Limpia-Neveras',
            'adaptador-inteligente': '🔄 Tu Receta Adaptada'
        };
        
        console.log('🎨 Renderizando receta individual. Data:', data);
        
        // Si data ya es un objeto con estructura de receta (nuevo formato JSON)
        let recipeData = data;
        let recipeContent = data;
        
        // Si data tiene una propiedad 'resultado' que es string (formato antiguo)
        if (data.resultado && typeof data.resultado === 'string') {
            try {
                // Limpiar markdown si existe
                let resultString = data.resultado;
                if (resultString.startsWith('```json')) {
                    resultString = resultString.substring(7, resultString.length - 3).trim();
                }
                if (resultString.startsWith('```')) {
                    resultString = resultString.substring(3, resultString.length - 3).trim();
                }
                
                // Intentar parsear como JSON
                const parsedData = JSON.parse(resultString);
                recipeData = parsedData;
                recipeContent = parsedData;
                console.log('✅ Parseado desde resultado string:', parsedData);
            } catch (e) {
                // Si no es JSON, mantener como texto formateado
                console.log('⚠️ No es JSON, renderizando como texto:', e);
                recipeContent = data.resultado;
            }
        }
        
        const html = `
            <div class="single-recipe-container">
                <h3>${titles[mode] || '🍳 Tu Receta'}</h3>
                
                ${renderSingleRecipeContent(recipeContent, recipeData)}
                
                ${recipeData.listaCompra ? `
                    <div class="shopping-list">
                        <h4>🛒 Lista de la Compra</h4>
                        ${renderShoppingList(recipeData.listaCompra)}
                    </div>
                    
                    <div class="action-buttons">
                        <button id="copy-shopping-btn" class="action-btn copy-btn">
                            📋 Copiar Lista de Compra
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        responseDiv.innerHTML = html;
        
        // Solo configurar botón de copiar si hay lista de compra
        if (recipeData.listaCompra) {
            setupCopyButton(recipeData);
        }
    }
    
    function renderSingleRecipeContent(content, fullData) {
        // Si el contenido es un objeto (JSON parseado correctamente)
        if (typeof content === 'object' && content !== null) {
            return `
                <div class="recipe-structured-content">
                    ${content.nombre ? `
                        <div class="recipe-name-section">
                            <h4>🍽️ ${content.nombre}</h4>
                        </div>
                    ` : ''}
                    
                    ${content.descripcion ? `
                        <div class="recipe-description">
                            <p>${content.descripcion}</p>
                        </div>
                    ` : ''}
                    
                    ${content.tiempoPreparacion || content.tiempoCoccion ? `
                        <div class="recipe-time-info">
                            ${content.tiempoPreparacion ? `<span>⏱️ Preparación: ${content.tiempoPreparacion} min</span>` : ''}
                            ${content.tiempoCoccion ? `<span>🔥 Cocción: ${content.tiempoCoccion} min</span>` : ''}
                            ${content.tiempoTotal ? `<span>📍 Total: ${content.tiempoTotal} min</span>` : ''}
                        </div>
                    ` : ''}
                    
                    ${content.porciones ? `
                        <div class="recipe-servings">
                            <p><strong>👥 Porciones:</strong> ${content.porciones}</p>
                        </div>
                    ` : ''}
                    
                    ${content.ingredientes && Array.isArray(content.ingredientes) ? `
                        <div class="recipe-ingredients">
                            <h4>🥘 Ingredientes</h4>
                            <ul>
                                ${content.ingredientes.map(ing => `
                                    <li>${typeof ing === 'object' ? `${ing.cantidad || ''} ${ing.item || ing.nombre || ''}` : ing}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${content.instrucciones && Array.isArray(content.instrucciones) ? `
                        <div class="recipe-instructions">
                            <h4>🔥 Instrucciones</h4>
                            <ol>
                                ${content.instrucciones.map(paso => `<li>${paso}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}
                    
                    ${content.informacionNutricional ? `
                        <div class="recipe-nutrition">
                            <h4>📊 Información Nutricional (por porción)</h4>
                            <div class="nutrition-grid">
                                ${content.informacionNutricional.calorias ? `<div><strong>🔥 Calorías:</strong> ${content.informacionNutricional.calorias}</div>` : ''}
                                ${content.informacionNutricional.proteinas ? `<div><strong>🥩 Proteínas:</strong> ${content.informacionNutricional.proteinas}</div>` : ''}
                                ${content.informacionNutricional.grasas ? `<div><strong>🧈 Grasas:</strong> ${content.informacionNutricional.grasas}</div>` : ''}
                                ${content.informacionNutricional.carbohidratos ? `<div><strong>🌾 Carbohidratos:</strong> ${content.informacionNutricional.carbohidratos}</div>` : ''}
                                ${content.informacionNutricional.fibra ? `<div><strong>🌿 Fibra:</strong> ${content.informacionNutricional.fibra}</div>` : ''}
                            </div>
                            ${content.informacionNutricional.vitaminas ? `
                                <div class="nutrition-vitamins">
                                    <h5>🍊 Vitaminas y Minerales Destacados:</h5>
                                    <p>${content.informacionNutricional.vitaminas}</p>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    ${content.consejos && Array.isArray(content.consejos) ? `
                        <div class="recipe-tips">
                            <h4>💡 Consejos del Chef</h4>
                            <ul>
                                ${content.consejos.map(consejo => `<li>${consejo}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${content.variaciones && Array.isArray(content.variaciones) ? `
                        <div class="recipe-variations">
                            <h4>🔄 Variaciones</h4>
                            <ul>
                                ${content.variaciones.map(variacion => `<li>${variacion}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${content.conservacion ? `
                        <div class="recipe-storage">
                            <h4>📦 Conservación</h4>
                            <p>${content.conservacion}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            // Si el contenido es texto (markdown o texto plano)
            return `
                <div class="recipe-text-content">
                    ${formatRecipeText(content || 'Receta no disponible')}
                </div>
            `;
        }
    }
    
    function setupActionButtons(data) {
        // Botón copiar lista de compra
        const copyBtn = document.getElementById('copy-shopping-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => copyShoppingList(data.listaCompra));
        }
        
        // Botón ver todas las recetas
        const viewAllBtn = document.getElementById('view-all-recipes-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => showAllRecipesModal(data));
        }
        
        // Botón descargar calendario PDF
        const calendarBtn = document.getElementById('download-calendar-btn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', downloadCalendarPDF);
        }
        
        // Botón descargar recetario PDF
        const recipesBtn = document.getElementById('download-recipes-btn');
        if (recipesBtn) {
            recipesBtn.addEventListener('click', downloadRecipesPDF);
        }
    }
    
    function setupCopyButton(data) {
        const copyBtn = document.getElementById('copy-shopping-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => copyShoppingList(data.listaCompra));
        }
    }
    
    function copyShoppingList(listaCompra) {
        let texto = '🛒 Lista de la Compra\n\n';
        
        listaCompra.forEach(categoria => {
            texto += `${getCategoryEmoji(categoria.categoria)} ${categoria.categoria.toUpperCase()}\n`;
            categoria.items.forEach(item => {
                texto += `• ${item}\n`;
            });
            texto += '\n';
        });
        
        navigator.clipboard.writeText(texto).then(() => {
            const btn = document.getElementById('copy-shopping-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ ¡Copiado!';
            btn.style.backgroundColor = '#22c55e';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('Error al copiar la lista. Inténtalo de nuevo.');
        });
    }
    
    async function downloadCalendarPDF() {
        if (!window.lastFormData || !window.lastPlanData) {
            alert('No hay datos de plan disponibles. Genera primero un plan semanal.');
            return;
        }
        
        const btn = document.getElementById('download-calendar-btn');
        const originalText = btn.textContent;
        btn.textContent = '📅 Generando calendario...';
        btn.disabled = true;
        
        try {
            console.log('📄 Generando calendario con nueva función local...');
            
            // Usar mi nueva función generateCalendarHTML
            const htmlCalendario = generateCalendarHTML(window.lastPlanData);
            
            // Abrir ventana de impresión directamente
            console.log('🖨️ Abriendo ventana de impresión para calendario...');
            openPrintWindow(htmlCalendario, 'Calendario Semanal');
            
            btn.textContent = '✅ Ventana de impresión abierta';
            btn.style.backgroundColor = '#22c55e';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error generando calendario PDF:', error);
            btn.textContent = originalText;
            btn.disabled = false;
            alert('Error al generar el calendario PDF. Inténtalo de nuevo.');
        }
    }
    
    async function downloadRecipesPDF() {
        if (!window.lastFormData || !window.lastPlanData) {
            alert('No hay datos de plan disponibles. Genera primero un plan semanal.');
            return;
        }
        
        const btn = document.getElementById('download-recipes-btn');
        const originalText = btn.textContent;
        btn.textContent = '📖 Obteniendo instrucciones...';
        btn.disabled = true;
        
        try {
            // Paso 1: Obtener las instrucciones de todas las recetas
            const response = await fetch('/api/instrucciones-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planSemanal: window.lastPlanData.planSemanal,
                    personas: window.lastFormData.personas,
                    dieta: window.lastFormData.dieta
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            btn.textContent = '📖 Generando recetario...';
            
            const result = await response.json();
            let instrucciones = result.instrucciones;
            
            // Parse JSON si viene como string
            if (typeof instrucciones === 'string') {
                // Limpiar markdown si existe
                if (instrucciones.startsWith('```json')) {
                    instrucciones = instrucciones.substring(7, instrucciones.length - 3).trim();
                }
                instrucciones = JSON.parse(instrucciones);
            }
            
            // Paso 2: Generar HTML del recetario
            const htmlRecetario = generateRecipesHTML(instrucciones.recetas);
            
            // Paso 3: Abrir ventana de impresión
            console.log('🖨️ Abriendo ventana de impresión para recetario...');
            openPrintWindow(htmlRecetario, 'Recetario Semanal');
            
            btn.textContent = '✅ Ventana de impresión abierta';
            btn.style.backgroundColor = '#22c55e';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error generando recetario PDF:', error);
            btn.textContent = originalText;
            btn.disabled = false;
            
            if (error.message.includes('429') || error.message.includes('Demasiadas')) {
                alert('Demasiadas peticiones a la IA. Por favor espera 30 segundos e inténtalo de nuevo.');
            } else {
                alert('Error al generar el recetario PDF. Inténtalo de nuevo.');
            }
        }
    }
    
    function generateRecipesHTML(recetas) {
        const recetasHTML = recetas.map(receta => `
            <div class="recipe-item">
                <div class="recipe-header">
                    <h3>${receta.nombre}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-day">${receta.dia}</span> • 
                        <span class="recipe-type">${receta.tipo}</span> • 
                        <span class="recipe-time">${receta.tiempoTotal || '30 min'}</span> • 
                        <span class="recipe-difficulty">${receta.dificultad || 'Fácil'}</span>
                    </div>
                </div>
                
                <div class="recipe-content">
                    <div class="ingredients-section">
                        <h4>🛒 Ingredientes (${receta.porciones || '2'} personas)</h4>
                        <ul class="ingredients-list">
                            ${receta.ingredientes.map(ing => `
                                <li><strong>${ing.cantidad || ''}</strong> ${ing.item}</li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="instructions-section">
                        <h4>👨‍🍳 Instrucciones</h4>
                        <ol class="instructions-list">
                            ${receta.instrucciones.map(paso => `
                                <li>${paso}</li>
                            `).join('')}
                        </ol>
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div style="font-family: 'Poppins', 'Lato', Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2D6A4F; margin-bottom: 10px;">📖 Recetario Semanal</h1>
                    <p style="color: #666; font-size: 16px;">Instrucciones detalladas para tu plan nutricional</p>
                </div>
                
                <style>
                    .recipe-item {
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        margin-bottom: 25px;
                        padding: 20px;
                        background: #ffffff;
                        page-break-inside: avoid;
                    }
                    .recipe-header h3 {
                        color: #2D6A4F;
                        margin: 0 0 8px 0;
                        font-size: 20px;
                    }
                    .recipe-meta {
                        color: #666;
                        font-size: 14px;
                        margin-bottom: 15px;
                    }
                    .recipe-content {
                        display: grid;
                        grid-template-columns: 1fr 2fr;
                        gap: 20px;
                    }
                    .ingredients-section h4,
                    .instructions-section h4 {
                        color: #FF8C42;
                        margin: 0 0 10px 0;
                        font-size: 16px;
                    }
                    .ingredients-list {
                        margin: 0;
                        padding-left: 20px;
                    }
                    .ingredients-list li {
                        margin-bottom: 5px;
                        color: #333;
                    }
                    .instructions-list {
                        margin: 0;
                        padding-left: 20px;
                    }
                    .instructions-list li {
                        margin-bottom: 8px;
                        color: #333;
                        line-height: 1.4;
                    }
                    @media print {
                        .recipe-item {
                            page-break-inside: avoid;
                            margin-bottom: 20px;
                        }
                    }
                </style>
                
                ${recetasHTML}
            </div>
        `;
    }
    
    function generateCalendarHTML(data) {
        // Funciones auxiliares para generar el HTML
        function getUniqueMealTypes(planData) {
            const mealTypes = new Set();
            planData.planSemanal.forEach(dia => {
                dia.comidas.forEach(comida => {
                    mealTypes.add(comida.tipo);
                });
            });
            return Array.from(mealTypes);
        }
        
        function calculateDayNutrition(dia, nutrient) {
            if (!dia || !dia.comidas) return 0;
            return dia.comidas.reduce((total, comida) => {
                return total + (comida[nutrient] || 0);
            }, 0);
        }
        
        const uniqueMealTypes = getUniqueMealTypes(data);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Calendario Semanal Nutricional</title>
                <style>
                    @page { 
                        size: A4 landscape; 
                        margin: 15mm; 
                    }
                    body { 
                        font-family: 'Arial', sans-serif; 
                        margin: 0; 
                        padding: 0; 
                        background: #f8f9fa;
                        color: #333;
                    }
                    .container { 
                        background: white; 
                        max-width: 100%; 
                        margin: 0 auto; 
                        border-radius: 8px; 
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header { 
                        background: linear-gradient(135deg, #2D6A4F 0%, #3f906f 100%); 
                        color: white; 
                        padding: 20px; 
                        text-align: center; 
                    }
                    .header h1 { 
                        margin: 0; 
                        font-size: 24px; 
                        font-weight: bold; 
                    }
                    .header p { 
                        margin: 5px 0 0 0; 
                        opacity: 0.9; 
                        font-size: 14px; 
                    }
                    
                    /* Calendar Table - Comidas por día */
                    .calendar-section { 
                        padding: 20px; 
                    }
                    .section-title { 
                        color: #2D6A4F; 
                        font-size: 18px; 
                        margin-bottom: 15px; 
                        text-align: center; 
                        border-bottom: 2px solid #2D6A4F; 
                        padding-bottom: 5px; 
                    }
                    .calendar-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 25px;
                    }
                    .calendar-table th { 
                        background: #2D6A4F; 
                        color: white; 
                        padding: 12px 8px; 
                        text-align: center; 
                        font-weight: bold; 
                        font-size: 12px;
                    }
                    .calendar-table td { 
                        border: 1px solid #dee2e6; 
                        padding: 10px 8px; 
                        vertical-align: top; 
                        font-size: 10px; 
                    }
                    .meal-type { 
                        font-weight: bold; 
                        color: #FF8C42; 
                        text-align: center; 
                        padding: 8px; 
                        background: #fff5f0;
                    }
                    .meal-name { 
                        font-weight: 600; 
                        color: #333; 
                        margin-bottom: 3px; 
                    }
                    .meal-calories { 
                        color: #FF8C42; 
                        font-weight: bold; 
                        font-size: 9px; 
                    }
                    
                    /* Nutrition Summary - Segunda página/sección */
                    .nutrition-section { 
                        padding: 20px; 
                        background: #f8f9fa; 
                        page-break-before: always;
                    }
                    .nutrition-grid { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                        gap: 15px; 
                        margin-top: 15px; 
                    }
                    .day-nutrition { 
                        background: white; 
                        border-radius: 8px; 
                        padding: 15px; 
                        border-left: 4px solid #2D6A4F;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .day-title { 
                        color: #2D6A4F; 
                        font-weight: bold; 
                        font-size: 14px; 
                        margin-bottom: 10px; 
                        text-align: center; 
                    }
                    .nutrition-item { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 5px; 
                        font-size: 11px; 
                    }
                    .nutrition-item strong { 
                        color: #555; 
                    }
                    .nutrition-value { 
                        font-weight: bold; 
                        color: #FF8C42; 
                    }
                    .total-calories { 
                        background: #FF8C42; 
                        color: white; 
                        padding: 8px; 
                        border-radius: 4px; 
                        text-align: center; 
                        font-weight: bold; 
                        margin-top: 10px; 
                    }
                    
                    .footer { 
                        background: #2D6A4F; 
                        color: white; 
                        padding: 15px; 
                        text-align: center; 
                        font-size: 12px; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- PÁGINA 1: CALENDARIO DE COMIDAS -->
                    <div class="header">
                        <h1>📅 CALENDARIO SEMANAL NUTRICIONAL</h1>
                        <p>Plan personalizado para ${data.personas || 2} persona${(data.personas || 2) > 1 ? 's' : ''} | Dieta: ${data.dieta || 'General'}</p>
                    </div>
                    
                    <div class="calendar-section">
                        <h2 class="section-title">🍽️ Menú Semanal</h2>
                        <table class="calendar-table">
                            <thead>
                                <tr>
                                    <th style="width:12%;">Comida</th>
                                    ${data.planSemanal.map(dia => `<th>${dia.dia}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${uniqueMealTypes.map(tipoComida => `
                                    <tr>
                                        <td class="meal-type">${getMealEmoji(tipoComida)} ${tipoComida}</td>
                                        ${data.planSemanal.map(dia => {
                                            const comida = dia.comidas.find(c => c.tipo === tipoComida);
                                            return `<td>
                                                ${comida ? `
                                                    <div class="meal-name">${comida.nombre}</div>
                                                    <div class="meal-calories">${comida.calorias || 0} kcal</div>
                                                ` : '<div style="color: #999;">-</div>'}
                                            </td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- PÁGINA 2: INFORMACIÓN NUTRICIONAL DETALLADA -->
                    <div class="nutrition-section">
                        <h2 class="section-title">📊 Información Nutricional Detallada</h2>
                        <div class="nutrition-grid">
                            ${data.planSemanal.map(dia => `
                                <div class="day-nutrition">
                                    <div class="day-title">${dia.dia}</div>
                                    
                                    <div class="nutrition-item">
                                        <strong>Proteínas:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.proteinas || calculateDayNutrition(dia, 'proteinas')).toFixed(1)}g</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <strong>Grasas:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.grasas || calculateDayNutrition(dia, 'grasas')).toFixed(1)}g</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <strong>Carbohidratos:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.carbohidratos || calculateDayNutrition(dia, 'carbohidratos')).toFixed(1)}g</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <strong>Fibra:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.fibra || calculateDayNutrition(dia, 'fibra')).toFixed(1)}g</span>
                                    </div>
                                    
                                    <hr style="margin: 10px 0; border: 1px solid #eee;">
                                    
                                    <div class="nutrition-item">
                                        <strong>Vitamina C:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.vitaminaC || calculateDayNutrition(dia, 'vitaminaC')).toFixed(1)}mg</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <strong>Vitamina D:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.vitaminaD || calculateDayNutrition(dia, 'vitaminaD')).toFixed(1)}μg</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <strong>Calcio:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.calcio || calculateDayNutrition(dia, 'calcio')).toFixed(0)}mg</span>
                                    </div>
                                    <div class="nutrition-item">
                                        <strong>Hierro:</strong>
                                        <span class="nutrition-value">${(dia.resumenNutricional?.hierro || calculateDayNutrition(dia, 'hierro')).toFixed(1)}mg</span>
                                    </div>
                                    
                                    <div class="total-calories">
                                        Total: ${dia.totalCalorias || calculateDayNutrition(dia, 'calorias')} kcal
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p><strong>Plan Nutricional Personalizado</strong> | Los valores nutricionales son aproximados</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    function generateRecipesHTML(data) {
        return `
            <div style="font-family: 'Poppins', 'Lato', Arial, sans-serif; width: 100%; padding: 20px;">
                <h1 style="text-align: center; color: #FF8C42; margin-bottom: 40px;">📖 RECETARIO SEMANAL</h1>
                ${data.planSemanal ? data.planSemanal.map((dia, diaIndex) => 
                    dia.comidas.map((comida, comidaIndex) => `
                        <div style="page-break-before: ${diaIndex === 0 && comidaIndex === 0 ? 'avoid' : 'always'}; padding: 20px 0;">
                            <h2 style="color: #2D6A4F; border-bottom: 2px solid #FF8C42; padding-bottom: 10px;">
                                🍽️ ${comida.nombre}
                            </h2>
                            <div style="margin: 20px 0; line-height: 1.6;">
                                <p><strong>Tipo de comida:</strong> ${getMealEmoji(comida.tipo)} ${comida.tipo}</p>
                                <p><strong>Información nutricional:</strong> ${comida.calorias || 0} kcal | 
                                Proteínas: ${comida.proteinas || 0}g | Grasas: ${comida.grasas || 0}g | 
                                Carbohidratos: ${comida.carbohidratos || 0}g</p>
                                ${comida.recetaCompleta || comida.instrucciones || comida.descripcion || 'Receta detallada disponible próximamente.'}
                            </div>
                        </div>
                    `).join('')
                ).join('') : '<p>No hay recetas disponibles para generar el recetario.</p>'}
            </div>
        `;
    }
    
    // === FUNCIONES AUXILIARES PARA HTML ===
    
    function getUniqueMealTypes(data) {
        const mealTypes = new Set();
        data.planSemanal.forEach(dia => {
            dia.comidas.forEach(comida => {
                mealTypes.add(comida.tipo);
            });
        });
        return Array.from(mealTypes);
    }
    
    function calculateDayNutrition(dia, nutrient) {
        if (!dia || !dia.comidas) return 0;
        return dia.comidas.reduce((total, comida) => {
            return total + (comida[nutrient] || 0);
        }, 0);
    }
    
    // === FUNCIONES DE INTERACTIVIDAD ===
    
    function setupRecipeInteractions(data) {
        // Hacer las recetas clickeables
        document.querySelectorAll('.clickable-recipe').forEach(recipeElement => {
            recipeElement.addEventListener('click', function() {
                const recipeName = this.closest('.meal-item').dataset.recipeName;
                showRecipeDetailModal(recipeName, data);
            });
        });
    }
    
    function showRecipeDetailModal(recipeName, planData) {
        // Encontrar la receta en los datos
        let selectedRecipe = null;
        planData.planSemanal.forEach(dia => {
            dia.comidas.forEach(comida => {
                if (comida.nombre === recipeName && comida.recetaCompleta) {
                    selectedRecipe = comida;
                }
            });
        });
        
        if (!selectedRecipe || !selectedRecipe.recetaCompleta) {
            alert('Los detalles de esta receta no están disponibles.');
            return;
        }
        
        const modal = createModal(`
            <div class="recipe-detail-content">
                <h3>🍽️ ${selectedRecipe.nombre}</h3>
                <div class="recipe-meta">
                    <p><strong>Tipo:</strong> ${selectedRecipe.tipo} | <strong>Calorías:</strong> ${selectedRecipe.calorias || 0} kcal</p>
                    <p><strong>Tiempo:</strong> ${selectedRecipe.tiempoPreparacion || 0}min prep + ${selectedRecipe.tiempoCoccion || 0}min cocción</p>
                    <p><strong>Dificultad:</strong> ${selectedRecipe.recetaCompleta.dificultad || 'Media'}</p>
                </div>
                
                <div class="recipe-nutrition">
                    <h4>📊 Información Nutricional</h4>
                    <div class="nutrition-grid">
                        <div>Proteínas: ${selectedRecipe.proteinas || 0}g</div>
                        <div>Grasas: ${selectedRecipe.grasas || 0}g</div>
                        <div>Carbohidratos: ${selectedRecipe.carbohidratos || 0}g</div>
                        <div>Fibra: ${selectedRecipe.recetaCompleta.informacionNutricional?.fibra || 0}g</div>
                    </div>
                </div>
                
                <div class="recipe-ingredients">
                    <h4>🥘 Ingredientes</h4>
                    <ul>
                        ${(selectedRecipe.ingredientes || []).map(ing => `
                            <li>${ing.cantidad || ''} ${ing.item || ing}</li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="recipe-instructions">
                    <h4>🔥 Instrucciones</h4>
                    <ol>
                        ${(selectedRecipe.instrucciones || []).map(paso => `
                            <li>${paso}</li>
                        `).join('')}
                    </ol>
                </div>
                
                ${selectedRecipe.consejos && selectedRecipe.consejos.length > 0 ? `
                    <div class="recipe-tips">
                        <h4>💡 Consejos del Chef</h4>
                        <ul>
                            ${selectedRecipe.consejos.map(consejo => `<li>${consejo}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `);
        
        document.body.appendChild(modal);
    }
    
    function showAllRecipesModal(planData) {
        const allRecipes = [];
        planData.planSemanal.forEach(dia => {
            dia.comidas.forEach(comida => {
                if (comida.recetaCompleta) {
                    allRecipes.push({
                        ...comida,
                        dia: dia.dia
                    });
                }
            });
        });
        
        const modal = createModal(`
            <div class="all-recipes-content">
                <h3>🍽️ Todas las Recetas del Plan Semanal</h3>
                <p class="recipes-count">Total: ${allRecipes.length} recetas completas</p>
                
                <div class="recipes-grid">
                    ${allRecipes.map(receta => `
                        <div class="recipe-card">
                            <h4>${getMealEmoji(receta.tipo)} ${receta.nombre}</h4>
                            <div class="recipe-card-meta">
                                <span class="recipe-day">📅 ${receta.dia}</span>
                                <span class="recipe-calories">📊 ${receta.calorias || 0} kcal</span>
                            </div>
                            <div class="recipe-card-time">
                                ⏱️ ${(receta.tiempoPreparacion || 0) + (receta.tiempoCoccion || 0)} min total
                            </div>
                            <div class="recipe-card-preview">
                                🥘 ${(receta.ingredientes || []).slice(0, 4).map(ing => ing.item || ing).join(', ')}
                                ${(receta.ingredientes || []).length > 4 ? '...' : ''}
                            </div>
                            <button class="view-recipe-btn" data-recipe-name="${receta.nombre}">
                                Ver Receta Completa
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="modal-actions">
                    <button id="download-all-recipes" class="action-btn recipes-btn">
                        📖 Descargar Todas en PDF
                    </button>
                </div>
            </div>
        `);
        
        // Event listeners para botones dentro del modal
        modal.querySelectorAll('.view-recipe-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const recipeName = this.dataset.recipeName;
                // Cerrar modal actual y mostrar detalle
                document.body.removeChild(modal);
                showRecipeDetailModal(recipeName, planData);
            });
        });
        
        const downloadAllBtn = modal.querySelector('#download-all-recipes');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                // Cerrar modal y descargar PDF
                document.body.removeChild(modal);
                downloadRecipesPDF();
            });
        }
        
        document.body.appendChild(modal);
    }
    
    function createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'recipe-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                ${content}
            </div>
        `;
        
        // Cerrar modal al hacer click en X o en overlay
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Cerrar con ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
                document.removeEventListener('keydown', escHandler);
            }
        });
        
        return modal;
    }
    
    // Funciones auxiliares
    function getMealEmoji(tipo) {
        const emojis = {
            'Desayuno': '🥐',
            'Comida': '🍽️',
            'Almuerzo': '🍽️',
            'Merienda': '🥨',
            'Cena': '🌙'
        };
        return emojis[tipo] || '🍽️';
    }
    
    function getCategoryEmoji(categoria) {
        const emojis = {
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
        return emojis[categoria] || '📦';
    }
    
    function getCategoryName(key) {
        const names = {
            'verduras': 'Verduras y Hortalizas',
            'carnes': 'Carnes y Pescados',
            'lacteos': 'Lácteos y Huevos',
            'cereales': 'Cereales y Legumbres',
            'frutas': 'Frutas',
            'condimentos': 'Condimentos y Especias',
            'frutosSecos': 'Frutos Secos y Semillas',
            'aceites': 'Aceites y Vinagres',
            'otros': 'Otros Productos'
        };
        return names[key] || 'Otros Productos';
    }
    
    function formatRecipeText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }
    
    function generateTestPDF(data) {
        if (!pdfTemplate) return console.error("Plantilla PDF no encontrada");

        // Dibujar HTML en la plantilla
        pdfTemplate.innerHTML = `<h1>Prueba PDF</h1><p>Datos recibidos: ${Object.keys(data).length} claves.</p>`;
        
        // Usar html2pdf
        html2pdf().from(pdfTemplate).save('test.pdf');
    }
});