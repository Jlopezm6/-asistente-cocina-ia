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

        const prompt = construirPrompt(mode, { ingredientesPrincipales, ingredientes, recetaOriginal, cambiosSolicitados, caloriasObjetivo, comidasSeleccionadas, preferencias, personas, dieta });
        const receta = await llamarGeminiAPI(prompt, apiKey);

        res.json({ receta });
    } catch (error) {
        console.error('Error generando receta:', error);
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
    
    let prompt = `Eres un nutricionista y chef experto. Crea un plan de comidas semanal completo basado en los siguientes parámetros:

PARÁMETROS DEL PLAN:
- OBJETIVO CALÓRICO DIARIO: ${caloriasObjetivo} kcal
- COMIDAS A PLANIFICAR: ${comidasTexto}
- NÚMERO DE PERSONAS: ${personas}
- TIPO DE DIETA: ${dieta}
- PREFERENCIAS: ${preferencias || 'Sin preferencias específicas'}

INSTRUCCIONES:
- Crear plan completo para 7 días (Lunes a Domingo)
- Cada día debe sumar aproximadamente ${caloriasObjetivo} kcal
- ${dieta !== 'ninguna' ? `Compatible con dieta ${dieta}` : 'Sin restricciones dietéticas'}
- Recetas calculadas para ${personas} ${personas === '1' ? 'persona' : 'personas'}
- Incluir información nutricional detallada con porcentajes VD
- Generar lista de compra consolidada por categorías

FORMATO DE RESPUESTA OBLIGATORIO:
Responde ÚNICAMENTE con un objeto JSON válido sin texto adicional. Estructura exacta:

{
  "planSemanal": [
    {
      "dia": "Lunes",
      "comidas": [
        {
          "tipo": "Desayuno",
          "nombre": "Avena con frutas y nueces",
          "calorias": 320,
          "proteinas": 12,
          "grasas": 8,
          "carbohidratos": 45,
          "fibra": 6,
          "vitaminas": "Vitamina B6: 15% VD, Magnesio: 20% VD"
        }
      ],
      "totalCalorias": ${caloriasObjetivo}
    }
  ],
  "listaCompra": [
    {
      "categoria": "Lácteos y Huevos",
      "items": ["2L leche de avena", "12 huevos"]
    },
    {
      "categoria": "Verduras y Hortalizas", 
      "items": ["3kg tomates", "2kg cebollas"]
    },
    {
      "categoria": "Carnes y Pescados",
      "items": ["1kg pollo", "500g salmón"]
    },
    {
      "categoria": "Cereales y Legumbres",
      "items": ["500g avena", "1kg arroz integral"]
    },
    {
      "categoria": "Frutas",
      "items": ["2kg plátanos", "1kg manzanas"]
    },
    {
      "categoria": "Condimentos y Especias",
      "items": ["sal", "pimienta", "aceite oliva"]
    }
  ]
}

REQUISITOS CRÍTICOS:
1. JSON válido sin texto antes o después
2. Incluir los 7 días completos
3. Solo comidas seleccionadas: ${comidasTexto}
4. Para cada comida: SOLO nombre de receta y datos nutricionales (NO incluir ingredientes ni preparación)
5. Valores nutricionales realistas (números enteros)
6. Lista de compra consolidada con cantidades totales para ${personas} ${personas === '1' ? 'persona' : 'personas'}
7. Incluir porcentajes VD para vitaminas/minerales principales`;

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

async function llamarGeminiAPI(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Respuesta inesperada de la API de Gemini');
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});