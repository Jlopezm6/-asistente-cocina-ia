const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/src', express.static('src'));

// === ENDPOINT PRINCIPAL: GENERA JSON COMPLETO CON TODA LA INFORMACIÓN ===
app.post('/api/generate', async (req, res) => {
    try {
        const { mode, ingredientesPrincipales, ingredientes, recetaOriginal, cambiosSolicitados, caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta } = req.body;

        // Validación según el modo
        if (!mode) {
            return res.status(400).json({ error: 'Modo es requerido' });
        }

        if (mode === 'receta-ingredientes' && !ingredientesPrincipales) {
            return res.status(400).json({ error: 'Ingredientes principales son requeridos para modo receta-ingredientes' });
        }

        if (mode === 'limpia-neveras' && !ingredientes) {
            return res.status(400).json({ error: 'Ingredientes son requeridos para modo limpia-neveras' });
        }

        if (mode === 'adaptador-inteligente' && !recetaOriginal) {
            return res.status(400).json({ error: 'Receta original es requerida para modo adaptador-inteligente' });
        }

        if (mode === 'plan-semanal') {
            if (!caloriasObjetivo || caloriasObjetivo < 800 || caloriasObjetivo > 5000) {
                return res.status(400).json({ error: 'Objetivo de calorías válido es requerido para modo plan-semanal (800-5000)' });
            }
            if (!comidasSeleccionadas || !Array.isArray(comidasSeleccionadas) || comidasSeleccionadas.length === 0) {
                return res.status(400).json({ error: 'Al menos una comida debe ser seleccionada para modo plan-semanal' });
            }
        }

        if (!personas || !dieta) {
            return res.status(400).json({ error: 'Número de personas y dieta son requeridos' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada' });
        }

        console.log('📥 Datos recibidos en servidor:', { mode, ingredientesPrincipales, ingredientes, recetaOriginal, cambiosSolicitados, caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta });
        
        const prompt = construirPrompt(mode, { ingredientesPrincipales, ingredientes, recetaOriginal, cambiosSolicitados, caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta });
        console.log('📝 Prompt generado, longitud:', prompt.length);
        
        const resultado = await llamarGeminiAPI(prompt, apiKey);

        res.json({ resultado });
    } catch (error) {
        console.error('Error generando resultado:', error);
        console.error('Error details:', error.message);
        
        // Dar más información específica del error
        if (error.message.includes('503')) {
            res.status(503).json({ error: 'El servicio de IA está temporalmente no disponible. Por favor, inténtalo de nuevo en unos momentos.' });
        } else if (error.message.includes('429')) {
            res.status(429).json({ error: 'Demasiadas peticiones. Por favor, espera un momento antes de intentar de nuevo.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
        }
    }
});

// === ENDPOINT: GENERAR CALENDARIO PDF ===
app.post('/api/generate-calendar-pdf', async (req, res) => {
    try {
        console.log('📅 Datos recibidos para calendario PDF:', req.body);
        const { mode, caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta } = req.body;

        // Validación específica para plan semanal
        if (!caloriasObjetivo || caloriasObjetivo < 800 || caloriasObjetivo > 5000) {
            return res.status(400).json({ error: 'Objetivo de calorías válido es requerido (800-5000)' });
        }
        if (!comidasSeleccionadas || !Array.isArray(comidasSeleccionadas) || comidasSeleccionadas.length === 0) {
            return res.status(400).json({ error: 'Al menos una comida debe ser seleccionada' });
        }
        if (!personas || !dieta) {
            return res.status(400).json({ error: 'Número de personas y dieta son requeridos' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada' });
        }

        const prompt = construirPromptCalendarioPDF({ caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta });
        console.log('📝 Prompt calendario PDF generado, longitud:', prompt.length);
        
        const htmlCalendario = await llamarGeminiAPI(prompt, apiKey);
        console.log('✅ HTML calendario generado, longitud:', htmlCalendario.length);

        res.json({ htmlCalendario });
    } catch (error) {
        console.error('❌ Error generando calendario PDF:', error);
        console.error('Error details:', error.message);
        if (error.message.includes('503')) {
            res.status(503).json({ error: 'El servicio de IA está temporalmente no disponible. Por favor, inténtalo de nuevo en unos momentos.' });
        } else if (error.message.includes('429')) {
            res.status(429).json({ error: 'Demasiadas peticiones. Por favor, espera un momento antes de intentar de nuevo.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
        }
    }
});

// === ENDPOINT: GENERAR RECETARIO PDF ===
app.post('/api/generate-recipes-pdf', async (req, res) => {
    try {
        const { mode, caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta } = req.body;

        // Validación específica para plan semanal
        if (!caloriasObjetivo || caloriasObjetivo < 800 || caloriasObjetivo > 5000) {
            return res.status(400).json({ error: 'Objetivo de calorías válido es requerido (800-5000)' });
        }
        if (!comidasSeleccionadas || !Array.isArray(comidasSeleccionadas) || comidasSeleccionadas.length === 0) {
            return res.status(400).json({ error: 'Al menos una comida debe ser seleccionada' });
        }
        if (!personas || !dieta) {
            return res.status(400).json({ error: 'Número de personas y dieta son requeridos' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada' });
        }

        const prompt = construirPromptRecetarioPDF({ caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta });
        const htmlRecetario = await llamarGeminiAPI(prompt, apiKey);

        res.json({ htmlRecetario });
    } catch (error) {
        console.error('Error generando recetario PDF:', error);
        if (error.message.includes('503')) {
            res.status(503).json({ error: 'El servicio de IA está temporalmente no disponible. Por favor, inténtalo de nuevo en unos momentos.' });
        } else if (error.message.includes('429')) {
            res.status(429).json({ error: 'Demasiadas peticiones. Por favor, espera un momento antes de intentar de nuevo.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
        }
    }
});

// === NUEVO ENDPOINT: ENRIQUECIMIENTO PROGRESIVO - DETALLES DE RECETA ===
app.post('/api/get-recipe-details', async (req, res) => {
    try {
        const { nombreReceta, personas, dieta } = req.body;

        // Validación
        if (!nombreReceta) {
            return res.status(400).json({ error: 'Nombre de receta es requerido' });
        }

        if (!personas || !dieta) {
            return res.status(400).json({ error: 'Número de personas y dieta son requeridos' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada' });
        }

        const prompt = construirPromptRecetaDetallada(nombreReceta, personas, dieta);
        const detalleReceta = await llamarGeminiAPI(prompt, apiKey);

        res.json({ detalleReceta });
    } catch (error) {
        console.error('Error obteniendo detalles de receta:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

function construirPrompt(mode, data) {
    let prompt = '';
    
    if (mode === 'receta-ingredientes') {
        prompt = construirPromptRecetaIngredientes(data);
    } else if (mode === 'limpia-neveras') {
        prompt = construirPromptLimpiaNeveras(data);
    } else if (mode === 'adaptador-inteligente') {
        prompt = construirPromptAdaptadorInteligente(data);
    } else if (mode === 'plan-semanal') {
        prompt = construirPromptPlanSemanal(data);
    }
    
    return prompt;
}

function construirPromptRecetaIngredientes(data) {
    const { ingredientesPrincipales, personas, dieta } = data;
    
    let prompt = `Eres un chef experto especializado en crear recetas perfectas a partir de ingredientes clave. Tu especialidad es el modo "Receta por Ingredientes", donde tomas uno o varios ingredientes principales y creas una receta deliciosa e innovadora.

INGREDIENTES PRINCIPALES: ${ingredientesPrincipales}
NÚMERO DE PERSONAS: ${personas}
TIPO DE DIETA: ${dieta}

INSTRUCCIONES ESPECÍFICAS:
- Crea una receta completa y deliciosa que DESTAQUE los ingredientes principales proporcionados
- Los ingredientes principales deben ser los protagonistas de la receta
- Puedes agregar ingredientes complementarios comunes (especias, condimentos, verduras básicas, etc.)
- Ajusta todas las cantidades exactamente para ${personas} ${personas === '1' ? 'persona' : 'personas'}
- ${dieta !== 'ninguna' ? `La receta DEBE ser completamente compatible con una dieta ${dieta}` : 'No hay restricciones dietéticas específicas'}
- Sugiere una receta equilibrada y nutritiva

FORMATO DE RESPUESTA REQUERIDO:
**🥗 [NOMBRE ATRACTIVO DE LA RECETA]**

**👥 Porciones:** ${personas} ${personas === '1' ? 'persona' : 'personas'}

**📋 Ingredientes:**
[Lista detallada con cantidades exactas ajustadas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**⏱️ Tiempo de preparación:** [X minutos]
**⏱️ Tiempo de cocción:** [X minutos]
**⏱️ Tiempo total:** [X minutos]

**🔥 Instrucciones:**
[Pasos numerados claros y detallados]

**📊 INFORMACIÓN NUTRICIONAL (por porción):**
- **Calorías aproximadas:** [X kcal]
- **Proteínas:** [X g]
- **Grasas:** [X g] 
- **Carbohidratos:** [X g]
- **Fibra:** [X g]
- **Vitaminas y Minerales Destacados:** [Ejemplo: Vitamina C: 45% VD, Hierro: 15% VD, Calcio: 20% VD]

**💡 Consejos del Chef:**
[1-2 consejos para resaltar los ingredientes principales]

### Lista de la Compra

**🥬 VERDURAS Y HORTALIZAS:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🥩 CARNES Y PESCADOS:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🥛 LÁCTEOS Y HUEVOS:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🌾 CEREALES Y LEGUMBRES:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🍎 FRUTAS:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🧄 CONDIMENTOS Y ESPECIAS:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🥜 FRUTOS SECOS Y SEMILLAS:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🫒 ACEITES Y VINAGRES:**
[Lista organizada con cantidades exactas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**📦 OTROS PRODUCTOS:**
[Cualquier otro ingrediente necesario no clasificado en las categorías anteriores]

IMPORTANTE: La información nutricional es OBLIGATORIA y debe ser un cálculo aproximado realista basado en los ingredientes utilizados.`;

    return prompt;
}

function construirPromptLimpiaNeveras(data) {
    const { ingredientes, personas, dieta } = data;
    
    let prompt = `Eres un chef experto especializado en crear recetas innovadoras y deliciosas. Tu especialidad es el modo "Limpia-Neveras", donde creas recetas únicas utilizando ingredientes específicos que el usuario tiene disponible.

INGREDIENTES DISPONIBLES: ${ingredientes}
NÚMERO DE PERSONAS: ${personas}
TIPO DE DIETA: ${dieta}

INSTRUCCIONES ESPECÍFICAS:
- Crea una receta completa y deliciosa utilizando PRINCIPALMENTE los ingredientes proporcionados
- Puedes sugerir ingredientes adicionales básicos (sal, pimienta, aceite, etc.) si son necesarios
- Ajusta todas las cantidades exactamente para ${personas} ${personas === '1' ? 'persona' : 'personas'}
- ${dieta !== 'ninguna' ? `La receta DEBE ser completamente compatible con una dieta ${dieta}` : 'No hay restricciones dietéticas específicas'}

FORMATO DE RESPUESTA REQUERIDO:
**🍳 [NOMBRE ATRACTIVO DE LA RECETA]**

**👥 Porciones:** ${personas} ${personas === '1' ? 'persona' : 'personas'}

**📋 Ingredientes:**
[Lista detallada con cantidades exactas ajustadas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**⏱️ Tiempo de preparación:** [X minutos]
**⏱️ Tiempo de cocción:** [X minutos]
**⏱️ Tiempo total:** [X minutos]

**🔥 Instrucciones:**
[Pasos numerados claros y detallados]

**📊 INFORMACIÓN NUTRICIONAL (por porción):**
- **Calorías aproximadas:** [X kcal]
- **Proteínas:** [X g]
- **Grasas:** [X g] 
- **Carbohidratos:** [X g]
- **Fibra:** [X g]
- **Vitaminas y Minerales Destacados:** [Ejemplo: Vitamina A: 30% VD, Potasio: 12% VD, Magnesio: 18% VD]

**💡 Consejos del Chef:**
[1-2 consejos útiles para mejorar la receta]

IMPORTANTE: La información nutricional es OBLIGATORIA y debe ser un cálculo aproximado realista basado en los ingredientes utilizados. Incluir siempre el porcentaje del Valor Diario Recomendado (%VD) para las vitaminas y minerales más importantes.`;

    return prompt;
}

function construirPromptAdaptadorInteligente(data) {
    const { recetaOriginal, cambiosSolicitados, personas, dieta } = data;
    
    let prompt = `Eres un chef experto especializado en adaptar y modificar recetas existentes de manera inteligente. Tu especialidad es el modo "Adaptador Inteligente", donde tomas una receta base y la transformas según las solicitudes específicas y necesidades del usuario.

RECETA ORIGINAL A ADAPTAR:
${recetaOriginal}

CAMBIOS SOLICITADOS POR EL USUARIO:
${cambiosSolicitados || 'Ningún cambio específico solicitado - optimiza la receta'}

PARÁMETROS DE ADAPTACIÓN:
- NÚMERO DE PERSONAS: ${personas}
- TIPO DE DIETA: ${dieta}

INSTRUCCIONES ESPECÍFICAS:
- Analiza la receta original y aplica TODOS los cambios solicitados por el usuario
- Adapta completamente para ${personas} ${personas === '1' ? 'persona' : 'personas'}
- Ajusta TODAS las cantidades proporcionalmente 
- ${dieta !== 'ninguna' ? `Modifica la receta para que sea 100% compatible con una dieta ${dieta}. Sustituye ingredientes si es necesario` : 'Respeta las preferencias dietéticas indicadas'}
- Si el usuario solicita cambios específicos (más saludable, picante, vegano, etc.), implementa esas modificaciones
- Mantén el espíritu de la receta original mientras incorporas las mejoras solicitadas
- Explica claramente qué cambios hiciste y por qué

FORMATO DE RESPUESTA REQUERIDO:
**🔄 [NOMBRE DE LA RECETA ADAPTADA INTELIGENTEMENTE]**

**👥 Porciones:** ${personas} ${personas === '1' ? 'persona' : 'personas'}

**📋 Ingredientes Adaptados:**
[Lista completa con cantidades exactas ajustadas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**🧠 Adaptaciones Inteligentes Realizadas:**
[Explica detalladamente qué cambios se hicieron según las solicitudes del usuario y adaptaciones dietéticas]

**⏱️ Tiempo de preparación:** [X minutos]
**⏱️ Tiempo de cocción:** [X minutos] 
**⏱️ Tiempo total:** [X minutos]

**🔥 Instrucciones Adaptadas:**
[Pasos numerados claros y detallados, adaptados a los nuevos ingredientes, técnicas y cantidad]

**📊 INFORMACIÓN NUTRICIONAL (por porción):**
- **Calorías aproximadas:** [X kcal]
- **Proteínas:** [X g]
- **Grasas:** [X g]
- **Carbohidratos:** [X g]
- **Fibra:** [X g]
- **Vitaminas y Minerales Destacados:** [Ejemplo: Vitamina E: 25% VD, Zinc: 20% VD, Ácido Fólico: 35% VD]

**💡 Consejos del Adaptador Inteligente:**
[1-2 consejos específicos sobre las adaptaciones realizadas y cómo mejorar aún más la receta]

IMPORTANTE: La información nutricional es OBLIGATORIA y debe reflejar la receta adaptada con todos los cambios e ingredientes nuevos. Incluir siempre el porcentaje del Valor Diario Recomendado (%VD) para las vitaminas y minerales más importantes.`;

    return prompt;
}

function construirPromptPlanSemanal(data) {
    const { caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta } = data;
    
    // Convertir las comidas seleccionadas en texto legible
    const comidasTexto = comidasSeleccionadas.map(comida => {
        switch(comida) {
            case 'desayuno': return 'Desayuno';
            case 'comida': return 'Comida/Almuerzo';
            case 'merienda': return 'Merienda/Snack';
            case 'cena': return 'Cena';
            default: return comida;
        }
    }).join(', ');
    
    let prompt = `Eres un nutricionista experto. Crea un plan de comidas semanal básico con nombres de recetas y información nutricional completa.

PARÁMETROS DEL PLAN:
- OBJETIVO CALÓRICO DIARIO: ${caloriasObjetivo} kcal
- COMIDAS A PLANIFICAR: ${comidasTexto}
- NÚMERO DE PERSONAS: ${personas}
- TIPO DE DIETA: ${dieta}
- PREFERENCIAS: ${preferencias || 'Sin preferencias específicas'}

INSTRUCCIONES:
- Crear plan para 7 días (Lunes a Domingo)
- Solo nombres de recetas con información nutricional completa
- ${dieta !== 'ninguna' ? `Compatible con dieta ${dieta}` : 'Sin restricciones dietéticas'}
- Lista de compra básica por categorías
- Incluir vitaminas y minerales destacados por receta

FORMATO DE RESPUESTA OBLIGATORIO:
Responde ÚNICAMENTE con un objeto JSON válido:

{
  "planSemanal": [
    {
      "dia": "Lunes",
      "comidas": [
        {
          "tipo": "Desayuno",
          "nombre": "Avena cremosa con frutos rojos",
          "calorias": 320,
          "proteinas": 12,
          "grasas": 8,
          "carbohidratos": 45,
          "fibra": 6,
          "vitaminas": "Vitamina C: 45% VD, Hierro: 15% VD, Magnesio: 20% VD"
        }
      ],
      "totalCalorias": ${caloriasObjetivo},
      "resumenNutricional": {
        "proteinas": 85,
        "grasas": 65,
        "carbohidratos": 280,
        "fibra": 30,
        "vitaminasDestacadas": "Vitamina A: 120% VD, Vitamina C: 180% VD, Calcio: 95% VD"
      }
    }
  ],
  "listaCompra": [
    {
      "categoria": "Lácteos y Huevos",
      "items": ["2L leche de almendra", "12 huevos"]
    },
    {
      "categoria": "Cereales y Legumbres",
      "items": ["500g avena", "1kg arroz integral"]
    }
  ]
}

REQUISITOS:
1. JSON válido sin texto adicional
2. Nombres de recetas con nutrición completa (incluir vitaminas)
3. Resumen nutricional diario
4. Lista de compra consolidada para ${personas} personas
5. 7 días completos con comidas seleccionadas: ${comidasTexto}`;

    return prompt;
}

// === NUEVAS FUNCIONES PARA GENERAR HTML DE PDF ===

function construirPromptCalendarioPDF(data) {
    const { caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta } = data;
    const fechaHoy = new Date().toLocaleDateString('es-ES');
    
    // Convertir las comidas seleccionadas en texto legible
    const comidasTexto = comidasSeleccionadas.map(comida => {
        switch(comida) {
            case 'desayuno': return 'Desayuno';
            case 'comida': return 'Comida/Almuerzo';
            case 'merienda': return 'Merienda/Snack';
            case 'cena': return 'Cena';
            default: return comida;
        }
    }).join(', ');
    
    let prompt = `Eres un nutricionista y diseñador experto. Crea primero un plan semanal completo y luego genera HTML profesional para calendario PDF.

PARÁMETROS DEL PLAN:
- OBJETIVO CALÓRICO DIARIO: ${caloriasObjetivo} kcal
- COMIDAS A PLANIFICAR: ${comidasTexto}
- NÚMERO DE PERSONAS: ${personas}
- TIPO DE DIETA: ${dieta}
- PREFERENCIAS: ${preferencias || 'Sin preferencias específicas'}

PASO 1: Crear plan semanal completo (7 días)
PASO 2: Generar HTML para PDF calendario apaisado

INSTRUCCIONES HTML:
- HTML completo autónomo con CSS inline
- Diseño calendario tabla/rejilla para 7 días
- Estilo profesional: Principal #2D6A4F, Acento #FF8C42, Fondo #F8F9FA
- Tipografía: Poppins títulos, Lato texto
- Formato A4 horizontal (landscape)
- Información nutricional por día

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con el HTML completo, sin texto adicional ni markdown.

El HTML debe incluir:
1. Encabezado "CALENDARIO SEMANAL" y fecha ${fechaHoy}
2. Tabla 7 días con comidas, nombres recetas, calorías
3. Resumen nutricional diario (proteínas, grasas, carbohidratos)
4. Info plan (${personas} personas, dieta ${dieta}) en pie
5. CSS inline para estilos profesionales

IMPORTANTE: Solo HTML puro, sin explicaciones ni bloques de código. Crear el plan completo y luego el HTML.`;

    return prompt;
}

function construirPromptRecetarioPDF(data) {
    const { caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta } = data;
    const fechaHoy = new Date().toLocaleDateString('es-ES');
    
    // Convertir las comidas seleccionadas en texto legible
    const comidasTexto = comidasSeleccionadas.map(comida => {
        switch(comida) {
            case 'desayuno': return 'Desayuno';
            case 'comida': return 'Comida/Almuerzo';
            case 'merienda': return 'Merienda/Snack';
            case 'cena': return 'Cena';
            default: return comida;
        }
    }).join(', ');
    
    let prompt = `Eres un nutricionista y chef experto. Crea primero un plan semanal completo y luego genera recetas detalladas en HTML para PDF.

PARÁMETROS DEL PLAN:
- OBJETIVO CALÓRICO DIARIO: ${caloriasObjetivo} kcal
- COMIDAS A PLANIFICAR: ${comidasTexto}
- NÚMERO DE PERSONAS: ${personas}
- TIPO DE DIETA: ${dieta}
- PREFERENCIAS: ${preferencias || 'Sin preferencias específicas'}

PASO 1: Crear plan semanal completo (7 días)
PASO 2: Desarrollar recetas completas con ingredientes e instrucciones
PASO 3: Generar HTML para PDF recetario vertical

INSTRUCCIONES HTML:
- HTML completo autónomo con CSS inline
- Formato recetario profesional con portada
- Cada receta página separada (page-break-after: always)
- Estilo profesional: Principal #2D6A4F, Acento #FF8C42, Fondo #F8F9FA
- Tipografía: Poppins títulos, Lato texto
- Formato A4 vertical (portrait)
- Incluir ingredientes, instrucciones, nutrición, consejos

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con el HTML completo, sin texto adicional ni markdown.

El HTML debe incluir:
1. Portada "RECETARIO SEMANAL" y fecha ${fechaHoy}
2. Cada receta completa: nombre, ingredientes con cantidades exactas para ${personas} personas, instrucciones paso a paso, información nutricional, consejos
3. Formato limpio y legible para impresión
4. Saltos de página entre recetas
5. CSS inline para estilos profesionales

IMPORTANTE: Solo HTML puro, sin explicaciones ni bloques de código. Crear plan completo, desarrollar todas las recetas detalladas y luego el HTML.`;

    return prompt;
}

function construirPromptRecetaIndividual(nombreReceta, personas, dieta) {
    let prompt = `Eres un chef experto especializado en recetas detalladas. Necesito que generes una receta completa para "${nombreReceta}".

PARÁMETROS:
- NOMBRE DE LA RECETA: ${nombreReceta}
- NÚMERO DE PERSONAS: ${personas}
- TIPO DE DIETA: ${dieta}

INSTRUCCIONES:
- Genera la receta completa con ingredientes exactos y preparación detallada
- Ajusta todas las cantidades exactamente para ${personas} ${personas === '1' ? 'persona' : 'personas'}
- ${dieta !== 'ninguna' ? `La receta DEBE ser completamente compatible con una dieta ${dieta}` : 'Sin restricciones dietéticas específicas'}
- Incluye información nutricional completa con porcentajes VD

FORMATO DE RESPUESTA REQUERIDO:
**🍳 ${nombreReceta}**

**👥 Porciones:** ${personas} ${personas === '1' ? 'persona' : 'personas'}

**📋 Ingredientes:**
[Lista detallada con cantidades exactas ajustadas para ${personas} ${personas === '1' ? 'persona' : 'personas'}]

**⏱️ Tiempo de preparación:** [X minutos]
**⏱️ Tiempo de cocción:** [X minutos]
**⏱️ Tiempo total:** [X minutos]

**🔥 Instrucciones:**
[Pasos numerados claros y detallados]

**📊 INFORMACIÓN NUTRICIONAL (por porción):**
- **Calorías aproximadas:** [X kcal]
- **Proteínas:** [X g]
- **Grasas:** [X g] 
- **Carbohidratos:** [X g]
- **Fibra:** [X g]
- **Vitaminas y Minerales Destacados:** [Ejemplo: Vitamina C: 45% VD, Hierro: 15% VD, Calcio: 20% VD]

**💡 Consejos del Chef:**
[1-2 consejos útiles para perfeccionar la receta]

IMPORTANTE: La información nutricional es OBLIGATORIA y debe ser un cálculo aproximado realista basado en los ingredientes utilizados. Incluir siempre el porcentaje del Valor Diario Recomendado (%VD) para las vitaminas y minerales más importantes.`;

    return prompt;
}

function construirPromptRecetaDetallada(nombreReceta, personas, dieta) {
    let prompt = `Eres un chef experto. Necesito los detalles completos de esta receta específica.

RECETA SOLICITADA: "${nombreReceta}"
NÚMERO DE PERSONAS: ${personas}
TIPO DE DIETA: ${dieta}

INSTRUCCIONES:
- Proporciona una receta completa y detallada para la receta nombrada exactamente como se solicita
- ${dieta !== 'ninguna' ? `La receta debe ser compatible con dieta ${dieta}` : 'Sin restricciones dietéticas específicas'}
- Ajustar porciones para ${personas} ${personas === '1' ? 'persona' : 'personas'}
- Incluir toda la información necesaria para preparar la receta

FORMATO DE RESPUESTA OBLIGATORIO:
Responde ÚNICAMENTE con un objeto JSON válido sin texto adicional:

{
  "nombre": "${nombreReceta}",
  "tipo": "[Tipo de comida: Desayuno/Comida/Cena/etc]",
  "tiempoPreparacion": "[minutos]",
  "tiempoCoccion": "[minutos]",
  "tiempoTotal": "[minutos]",
  "dificultad": "[Fácil/Intermedio/Difícil]",
  "porciones": ${personas},
  "ingredientes": [
    {
      "item": "[Nombre del ingrediente]",
      "cantidad": "[Cantidad específica con unidad]",
      "categoria": "[Verduras/Proteínas/Lácteos/etc]"
    }
  ],
  "instrucciones": [
    "Paso 1: [Instrucción detallada]",
    "Paso 2: [Instrucción detallada]"
  ],
  "informacionNutricional": {
    "calorias": "[número]",
    "proteinas": "[gramos]",
    "grasas": "[gramos]",
    "carbohidratos": "[gramos]",
    "fibra": "[gramos]",
    "vitaminas": "[Ejemplo: Vitamina C: 45% VD, Hierro: 15% VD]"
  },
  "consejos": [
    "[Consejo útil 1]",
    "[Consejo útil 2]"
  ],
  "variaciones": [
    "[Variación opcional 1]",
    "[Variación opcional 2]"
  ],
  "conservacion": "[Instrucciones de almacenamiento]"
}

REQUISITOS CRÍTICOS:
1. JSON válido sin texto antes o después
2. Información nutricional realista por porción
3. Ingredientes con cantidades específicas para ${personas} ${personas === '1' ? 'persona' : 'personas'}
4. Instrucciones paso a paso claras
5. Compatible con dieta ${dieta}`;

    return prompt;
}

async function llamarGeminiAPI(prompt, apiKey, maxRetries = 3) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    for (let intento = 0; intento < maxRetries; intento++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error('Respuesta inesperada de la API de Gemini');
                }
            }

            // Si es error 503 o 429, intentar retry con backoff
            if (response.status === 503 || response.status === 429) {
                const waitTime = Math.pow(2, intento) * 1000; // 1s, 2s, 4s
                console.log(`⏳ Intento ${intento + 1}/${maxRetries} falló (${response.status}). Reintentando en ${waitTime}ms...`);
                
                if (intento < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            if (intento === maxRetries - 1) {
                throw error;
            }
        }
    }
}

app.post('/api/get-recipe', async (req, res) => {
    try {
        const { nombreReceta, personas, dieta } = req.body;

        // Validación
        if (!nombreReceta) {
            return res.status(400).json({ error: 'Nombre de receta es requerido' });
        }

        if (!personas || !dieta) {
            return res.status(400).json({ error: 'Número de personas y dieta son requeridos' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada' });
        }

        const prompt = construirPromptRecetaIndividual(nombreReceta, personas, dieta);
        const receta = await llamarGeminiAPI(prompt, apiKey);

        res.json({ receta });
    } catch (error) {
        console.error('Error generando receta individual:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint de prueba para PDF básico
app.get('/test-pdf', (req, res) => {
    const simpleHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: white; }
        h1 { color: #2D6A4F; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <h1>CALENDARIO SEMANAL TEST</h1>
    <table>
        <tr>
            <th>Día</th>
            <th>Desayuno</th>
            <th>Comida</th>
        </tr>
        <tr>
            <td>Lunes</td>
            <td>Tostadas con aguacate (400 kcal)</td>
            <td>Ensalada mediterránea (600 kcal)</td>
        </tr>
        <tr>
            <td>Martes</td>
            <td>Yogur con frutos secos (350 kcal)</td>
            <td>Pollo a la plancha (650 kcal)</td>
        </tr>
    </table>
</body>
</html>`;
    res.send(simpleHTML);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});