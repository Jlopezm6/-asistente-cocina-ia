# <s Asistente de Cocina IA v2.0

Una aplicaci�n web inteligente para generar recetas y planes de comidas personalizados utilizando Google Gemini AI.

## ( Caracter�sticas

### <� **4 Modos de Uso**
1. **Receta por Ingredientes** - Genera recetas basadas en ingredientes clave
2. **Limpia-Neveras** - Aprovecha al m�ximo los ingredientes disponibles
3. **Adaptador Inteligente** - Modifica recetas existentes seg�n tus necesidades
4. **Plan Semanal** - Crea planes nutricionales completos para 7 d�as

### <� **Funcionalidades Avanzadas**
-  **Informaci�n nutricional completa** (calor�as, prote�nas, grasas, carbohidratos, vitaminas)
-  **Lista de compra autom�tica** organizada por categor�as
-  **M�ltiples tipos de dieta** (Vegetariana, Vegana, Keto, Mediterr�nea, Paleo, Sin Gluten)
-  **Escalado autom�tico** para 1-8 personas
-  **Descarga de calendarios y recetarios** en formato HTML/PDF
-  **Arquitectura optimizada** para evitar errores de rate limiting

## =� Instalaci�n

### Requisitos previos
- Node.js (versi�n 14 o superior)
- API Key de Google Gemini

### Configuraci�n

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/asistente-cocina-ia.git
   cd asistente-cocina-ia
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` y a�ade tu API key de Google Gemini:
   ```
   GEMINI_API_KEY=tu_api_key_real_aqui
   PORT=3000
   ```

4. **Inicia el servidor:**
   ```bash
   npm start
   ```

5. **Abre tu navegador:**
   ```
   http://localhost:3000
   ```

## =� Stack Tecnol�gico

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **IA:** Google Gemini API
- **PDF:** Descarga HTML + impresi�n nativa del navegador

## =� Uso

### Plan Semanal (Modo Avanzado)
1. Selecciona el objetivo de calor�as diarias (800-5000 kcal)
2. Elige las comidas a planificar (desayuno, comida, merienda, cena)
3. Especifica el n�mero de personas (1-8)
4. Selecciona el tipo de dieta
5. A�ade preferencias opcionales
6. �Genera tu plan personalizado!

### Descarga de PDFs
1. Genera un plan semanal
2. Haz click en "Descargar Calendario PDF" o "Descargar Recetario PDF"
3. Se descargar� un archivo HTML optimizado
4. Abre el archivo HTML en tu navegador
5. Usa Ctrl+P (Cmd+P en Mac) � "Guardar como PDF"

## <� Arquitectura

### Consultas Optimizadas
- **Consulta Principal:** Plan b�sico con informaci�n nutricional
- **Consulta Calendario:** HTML optimizado para formato apaisado
- **Consulta Recetario:** Recetas detalladas con ingredientes e instrucciones

### Sistema de Retry
- Retry autom�tico para errores 503/429
- Backoff exponencial (1s, 2s, 4s)
- Manejo inteligente de rate limiting

## =' API Endpoints

- `POST /api/generate` - Generar plan b�sico
- `POST /api/generate-calendar-pdf` - Generar HTML de calendario
- `POST /api/generate-recipes-pdf` - Generar HTML de recetario

## > Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'A�adir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## =� Licencia

Este proyecto est� bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para m�s detalles.

## =O Reconocimientos

- **Google Gemini AI** por la potencia de generaci�n de contenido
- **Claude Code** por la asistencia en el desarrollo
- Inspirado en la necesidad de una alimentaci�n saludable y planificada

---

P **�Dale una estrella si este proyecto te ha sido �til!**