# Proyecto: Asistente de Cocina IA

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

### Opciones Comunes para todos los modos:
-   **Selector de Porciones:** El usuario debe poder especificar para cuántas personas es la receta (selector de 1 a 8).
-   **Selector de Dieta Ampliado:** El menú de dietas debe incluir: Ninguna, Vegetariana, Vegana, Keto, Mediterránea, Paleo y Sin Gluten.

### Respuesta de la IA y Procesamiento en la App (¡ARQUITECTURA IMPORTANTE!):
-   **Para el modo "Plan Semanal", la IA debe devolver la respuesta estructurada como un objeto JSON válido.** Este JSON debe contener una lista de días, y para cada día, una lista de comidas con sus detalles (nombre, calorías, nutrientes, %VD, etc.) y también una lista de la compra consolidada.
-   **Para los modos de receta única:** La respuesta puede ser en texto formateado (Markdown) e incluir la lista de la compra cuando sea aplicable.

### Funcionalidades Adicionales de la Interfaz (Pulido UX):
-   **Renderizado desde JSON:** El JavaScript del frontend (`index.js`) será responsable de leer el JSON del Plan Semanal y generar el HTML para mostrarlo de forma bonita en la web.
-   **Botón de Copiar:** El botón para copiar la "Lista de la Compra" debe funcionar para todos los modos aplicables, conservando el formato.
-   **Botón de Exportar a CSV:** El JavaScript del frontend (`index.js`) leerá el JSON del Plan Semanal y generará un archivo CSV perfectamente formateado (con punto y coma como separador).

---

## Guía de Estilo Visual (Versión 1.0)
-   **Ambiente General:** Limpio, Fresco y Confiable.
-   **Paleta de Colores:** Fondo: `#F8F9FA`, Principal: `#2D6A4F`, Acento: `#FF8C42`, Texto: `#212529`.
-   **Tipografía (de Google Fonts):** Títulos: `Poppins`, Texto Normal: `Lato`.