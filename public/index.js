document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS ---
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const generateBtn = document.getElementById('generate-button');
    const responseDiv = document.getElementById('response');
    const pdfTemplate = document.getElementById('pdf-template');

    let currentMode = 'receta-ingredientes';

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
    
    // TEMPORAL: Función de prueba para PDF
    window.testPDF = async function() {
        console.log('🧪 Probando PDF simple...');
        
        try {
            const response = await fetch('/test-pdf');
            const htmlSimple = await response.text();
            
            const pdfTemplate = document.getElementById('pdf-template');
            pdfTemplate.innerHTML = htmlSimple;
            pdfTemplate.style.display = 'block';
            pdfTemplate.style.visibility = 'visible';
            
            const options = {
                margin: 0.5,
                filename: 'test-calendario.pdf',
                html2canvas: { 
                    scale: 1,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { 
                    unit: 'in',
                    format: 'a4',
                    orientation: 'landscape' 
                }
            };
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await html2pdf().set(options).from(pdfTemplate).save();
            
            pdfTemplate.style.display = 'none';
            pdfTemplate.innerHTML = '';
            
            console.log('✅ PDF de prueba generado');
        } catch (error) {
            console.error('❌ Error en PDF de prueba:', error);
        }
    };

    // --- LÓGICA PRINCIPAL ---
    async function handleGenerate() {
        const formData = collectFormData(currentMode);
        
        // Validar datos básicos
        if (!validateFormData(formData, currentMode)) {
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
            
            // Limpiar markdown si existe
            if (resultText.startsWith('```json')) {
                resultText = resultText.substring(7, resultText.length - 3).trim();
            }
            
            const data = JSON.parse(resultText);
            
            // Almacenar datos para uso posterior
            window.lastResponseData = data;
            window.lastFormData = formData; // Almacenar formData para PDFs
            
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
        switch (mode) {
            case 'receta-ingredientes':
                if (!data.ingredientesPrincipales) {
                    alert('Por favor, ingresa al menos un ingrediente principal');
                    return false;
                }
                break;
                
            case 'limpia-neveras':
                if (!data.ingredientes) {
                    alert('Por favor, ingresa los ingredientes que tienes en la nevera');
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

    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        generateBtn.textContent = isLoading ? 'Generando...' : 'Generar';
    }
    
    function renderResponse(data, mode, originalFormData) {
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
        const html = `
            <div class="weekly-plan-container">
                <h3>📅 Tu Plan Semanal Personalizado</h3>
                <div class="plan-info">
                    <p><strong>Para:</strong> ${originalFormData.personas || 2} persona${(originalFormData.personas || 2) > 1 ? 's' : ''}</p>
                    <p><strong>Dieta:</strong> ${originalFormData.dieta === 'ninguna' ? 'Sin restricciones' : originalFormData.dieta}</p>
                    <p><strong>Objetivo calórico:</strong> ${originalFormData.caloriasObjetivo} kcal/día</p>
                </div>
                
                <div class="completion-notice">
                    <p>✨ <strong>¡Plan completo!</strong> Todas las recetas han sido enriquecidas con ingredientes, instrucciones y consejos detallados. Haz click en cualquier receta para ver sus detalles.</p>
                </div>
                
                <div class="days-grid">
                    ${renderDaysGrid(data.planSemanal, true)}
                </div>
                
                <div class="shopping-list">
                    <h4>🛒 Lista de la Compra Semanal</h4>
                    ${renderShoppingList(data.listaCompra)}
                </div>
                
                <div class="action-buttons">
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
    
    function renderSingleRecipe(data, mode) {
        const titles = {
            'receta-ingredientes': '🥗 Tu Receta por Ingredientes',
            'limpia-neveras': '🗄️ Tu Receta Limpia-Neveras',
            'adaptador-inteligente': '🔄 Tu Receta Adaptada'
        };
        
        // Intentar parsear el resultado si viene como string JSON
        let recipeData = data;
        let recipeContent = data.receta || data.resultado;
        
        if (typeof recipeContent === 'string') {
            try {
                // Limpiar markdown si existe
                if (recipeContent.startsWith('```json')) {
                    recipeContent = recipeContent.substring(7, recipeContent.length - 3).trim();
                }
                if (recipeContent.startsWith('```')) {
                    recipeContent = recipeContent.substring(3, recipeContent.length - 3).trim();
                }
                
                // Intentar parsear como JSON
                const parsedData = JSON.parse(recipeContent);
                recipeData = { ...data, ...parsedData };
                recipeContent = parsedData;
            } catch (e) {
                // Si no es JSON, mantener como texto formateado
                console.log('No es JSON, renderizando como texto:', e);
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
                    
                    ${content.informacionNutricional || content.calorias ? `
                        <div class="recipe-nutrition">
                            <h4>📊 Información Nutricional (por porción)</h4>
                            <div class="nutrition-grid">
                                ${content.calorias ? `<div>Calorías: ${content.calorias} kcal</div>` : ''}
                                ${content.proteinas ? `<div>Proteínas: ${content.proteinas}g</div>` : ''}
                                ${content.grasas ? `<div>Grasas: ${content.grasas}g</div>` : ''}
                                ${content.carbohidratos ? `<div>Carbohidratos: ${content.carbohidratos}g</div>` : ''}
                                ${content.informacionNutricional?.fibra ? `<div>Fibra: ${content.informacionNutricional.fibra}g</div>` : ''}
                                ${content.informacionNutricional?.vitaminas ? `<div>Vitaminas: ${content.informacionNutricional.vitaminas}</div>` : ''}
                            </div>
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
        if (!window.lastFormData) {
            alert('No hay datos de plan disponibles. Genera primero un plan semanal.');
            return;
        }
        
        console.log('📅 Datos que se enviarán para calendario PDF:', window.lastFormData);
        
        const btn = document.getElementById('download-calendar-btn');
        const originalText = btn.textContent;
        btn.textContent = '📅 Generando calendario...';
        btn.disabled = true;
        
        try {
            // Llamar al nuevo endpoint para generar calendario PDF
            const response = await fetch('/api/generate-calendar-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.lastFormData),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
                console.error('❌ Error del servidor:', errorData);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Respuesta del servidor:', result);
            let htmlCalendario = result.htmlCalendario;
            
            // Limpiar markdown si existe
            if (htmlCalendario.startsWith('```html')) {
                htmlCalendario = htmlCalendario.substring(7, htmlCalendario.length - 3).trim();
            }
            if (htmlCalendario.startsWith('```')) {
                htmlCalendario = htmlCalendario.substring(3, htmlCalendario.length - 3).trim();
            }
            
            if (!pdfTemplate) {
                throw new Error("Plantilla PDF no encontrada");
            }
            
            // Insertar HTML generado por la IA
            console.log('📄 HTML limpio para PDF (primeros 200 chars):', htmlCalendario.substring(0, 200));
            pdfTemplate.innerHTML = htmlCalendario;
            pdfTemplate.style.display = 'block';
            pdfTemplate.style.visibility = 'visible';
            pdfTemplate.style.position = 'absolute';
            pdfTemplate.style.top = '0';
            pdfTemplate.style.left = '0';
            pdfTemplate.style.width = '100%';
            pdfTemplate.style.height = 'auto';
            pdfTemplate.style.zIndex = '9999';
            
            // Configurar opciones para calendario (landscape) - más simples para mejor compatibilidad
            const options = {
                margin: 0.5,
                filename: 'calendario-semanal.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: 1200,
                    height: 800
                },
                jsPDF: { 
                    unit: 'in',
                    format: [11, 8.5],
                    orientation: 'landscape' 
                }
            };
            
            // Crear blob con el HTML y descargar
            const blob = new Blob([htmlCalendario], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const a = document.createElement('a');
            a.href = url;
            a.download = 'calendario-semanal.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Limpiar template
            pdfTemplate.innerHTML = '';
            btn.textContent = '✅ Archivo HTML descargado';
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
            
            if (error.message.includes('429') || error.message.includes('Demasiadas')) {
                alert('Demasiadas peticiones a la IA. Por favor espera 30 segundos e inténtalo de nuevo.');
            } else {
                alert('Error al generar el calendario PDF. Inténtalo de nuevo.');
            }
        }
    }
    
    async function downloadRecipesPDF() {
        if (!window.lastFormData) {
            alert('No hay datos de plan disponibles. Genera primero un plan semanal.');
            return;
        }
        
        const btn = document.getElementById('download-recipes-btn');
        const originalText = btn.textContent;
        btn.textContent = '📖 Generando recetario...';
        btn.disabled = true;
        
        try {
            // Llamar al nuevo endpoint para generar recetario PDF
            const response = await fetch('/api/generate-recipes-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.lastFormData),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            let htmlRecetario = result.htmlRecetario;
            
            // Limpiar markdown si existe
            if (htmlRecetario.startsWith('```html')) {
                htmlRecetario = htmlRecetario.substring(7, htmlRecetario.length - 3).trim();
            }
            if (htmlRecetario.startsWith('```')) {
                htmlRecetario = htmlRecetario.substring(3, htmlRecetario.length - 3).trim();
            }
            
            if (!pdfTemplate) {
                throw new Error("Plantilla PDF no encontrada");
            }
            
            // Insertar HTML generado por la IA
            console.log('📖 HTML limpio para recetario (primeros 200 chars):', htmlRecetario.substring(0, 200));
            pdfTemplate.innerHTML = htmlRecetario;
            pdfTemplate.style.display = 'block';
            pdfTemplate.style.visibility = 'visible';
            pdfTemplate.style.position = 'absolute';
            pdfTemplate.style.top = '0';
            pdfTemplate.style.left = '0';
            pdfTemplate.style.width = '100%';
            pdfTemplate.style.height = 'auto';
            pdfTemplate.style.zIndex = '9999';
            
            // Configurar opciones para recetario (portrait) - más simples para mejor compatibilidad
            const options = {
                margin: 0.5,
                filename: 'recetario-semanal.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 1,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width: 800,
                    height: 1000
                },
                jsPDF: { 
                    unit: 'in',
                    format: [8.5, 11],
                    orientation: 'portrait' 
                },
                pagebreak: { mode: ['avoid-all', 'css'] }
            };
            
            // Crear blob con el HTML y descargar
            const blob = new Blob([htmlRecetario], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recetario-semanal.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Limpiar template
            pdfTemplate.innerHTML = '';
            btn.textContent = '✅ Archivo HTML descargado';
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
    
    function generateCalendarHTML(data) {
        return `
            <div style="font-family: 'Poppins', 'Lato', Arial, sans-serif; width: 100%; padding: 20px;">
                <h1 style="text-align: center; color: #2D6A4F; margin-bottom: 30px;">📅 CALENDARIO SEMANAL</h1>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
                    ${data.planSemanal.map(dia => `
                        <div style="border: 2px solid #DEE2E6; border-radius: 8px; padding: 10px; background: #F8F9FA;">
                            <h4 style="color: #2D6A4F; margin: 0 0 10px 0; font-size: 14px; text-align: center;">${dia.dia}</h4>
                            ${dia.comidas.map(comida => `
                                <div style="background: white; margin-bottom: 8px; padding: 6px; border-radius: 4px; font-size: 10px;">
                                    <div style="font-weight: bold; color: #FF8C42;">${getMealEmoji(comida.tipo)} ${comida.tipo}</div>
                                    <div style="color: #212529; margin: 2px 0;">${comida.nombre}</div>
                                    <div style="color: #6C757D; font-size: 9px;">${comida.calorias || 0} kcal</div>
                                </div>
                            `).join('')}
                            ${dia.totalCalorias ? `<div style="text-align: center; font-weight: bold; color: #2D6A4F; font-size: 11px; margin-top: 8px;">Total: ${dia.totalCalorias} kcal</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
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