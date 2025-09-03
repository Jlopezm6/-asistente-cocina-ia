# Proyecto: Asistente de Cocina IA (v2.0 en desarrollo)

## Contexto
Es una aplicación web con múltiples modos de uso para generar recetas y planes de comidas personalizados, utilizando la API de Google Gemini.

## Stack tecnológico (Herramientas usadas)
- Frontend: HTML5, CSS3, JavaScript (Todo en la carpeta /public)
- Backend: Node.js con Express (en el archivo server.js para manejar la API key de forma segura)

## Funcionalidades Clave
### Interfaz de Usuario y Lógica:
La interfaz debe presentar 4 modos de uso claros, idealmente como pestañas:

1.  **"Receta por Ingredientes":** El modo principal y por defecto. El usuario introduce uno o varios ingredientes clave para generar una receta.
    -   *Campos necesarios:* Un `textarea` para "Ingredientes Principales".

2.  **"Limpia-Neveras":** El usuario introduce una lista exhaustiva de ingredientes que tiene disponibles para que la IA cree una receta que los aproveche al máximo.
    -   *Campos necesarios:* Un `textarea` más grande para "Ingredientes que tienes en la nevera".

3.  **"Adaptador Inteligente":** El usuario pega una receta existente y pide modificaciones.
    -   *Campos necesarios:* Un `textarea` para "Receta Original" y otro para "Cambios Solicitados".

4.  **"Plan Semanal":** El modo más avanzado. El usuario define un objetivo calórico diario y qué comidas desea planificar, y la IA genera un plan de comidas completo para 7 días.
    -   *Campos necesarios:*
        -   Un `input` numérico para "Objetivo de Calorías Diarias (aprox.)".
        -   `Checkboxes` (casillas de verificación) para seleccionar las comidas deseadas (Desayuno, Comida, Merienda, Cena).
        -   Un `textarea` para "Ingredientes Base o Preferencias".

### Opciones Comunes para todos los modes:
-   **Selector de Porciones:** El usuario debe poder especificar para cuántas personas es la receta (selector de 1 a 8).
-   **Selector de Dieta Ampliado:** El menú de dietas debe incluir: Ninguna, Vegetariana, Vegana, Keto, Mediterránea, Paleo y Sin Gluten.

### Respuesta de la IA y Procesamiento en la App (ARQUITECTURA DE DOS PASOS):
-   **Para el modo "Plan Semanal" (Paso 1 - Generar Plan):** La primera llamada a la IA debe generar un JSON con el calendario-resumen (Día, Comida, Nombre de Receta, Nutrientes) y la Lista de la Compra.
-   **Para el modo "Plan Semanal" (Paso 2 - Generar Receta a Demanda):** Cuando el usuario haga clic en el nombre de una receta del plan, se debe hacer una **segunda llamada a la IA** pidiendo únicamente la receta completa para ese plato.
-   **Para los modos de receta única:** La respuesta puede ser en texto formateado (Markdown) e incluir la lista de la compra cuando sea aplicable.

### Funcionalidades Adicionales de la Interfaz (Pulido UX):
-   **Plan Interactivo y "Ver Todas":** El plan semanal se muestra con recetas clicables y un botón "Ver Todas las Recetas" para cargarlas dinámicamente.
-   **Botón de Copiar:** Copia la "Lista de la Compra" conservando el formato.
-   **DOS Botones de Descarga en PDF Separados:**
    1.  **Botón "Descargar Calendario en PDF":** Debe generar un PDF de una página, visualmente atractivo (estilo rejilla, como el ejemplo), usando nuestra Guía de Estilo y mostrando solo el resumen del plan semanal.
    2.  **Botón "Descargar Recetario en PDF":** Debe generar un PDF de múltiples páginas, bien formateado, que contenga únicamente las recetas completas de todo el plan semanal.

---

## Guía de Estilo Visual (Versión 1.0)
-   **Ambiente General:** Limpio, Fresco y Confiable.
-   **Paleta de Colores:** Fondo: `#F8F9FA`, Principal: `#2D6A4F`, Acento: `#FF8C42`, Texto: `#212529`.
-   **Tipografía (de Google Fonts):** Títulos: `Poppins`, Texto Normal: `Lato`.