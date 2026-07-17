Paso a paso para el desarrollo del encargo:

Ruta sugerida de desarrollo: 
¿Por dónde empiezo?

______________
__________________________________
# 1.Crea los archivos de datos iniciales:

- Paso 1.
Crea manualmente en la raíz de tu proyecto los archivos peliculas.txt y series.txt con los ejemplos que te dio el enunciado.

_________________________________________________
# 2.Monta el Servidor y la ruta GET:

- Paso 2.
Inicia tu proyecto de Node (npm init -y). Te recomiendo usar Express (si tu curso lo permite) ya que facilita mucho el manejo de rutas, JSON y parámetros. Programa el método GET para leer los archivos de texto, convertirlos a JSON y enviarlos. Pruébalo directamente en tu navegador o con herramientas como Postman.

_________________________________________________
# 3.Programa el método POST:

- Paso 3.
Desarrolla la lógica para recibir el JSON del cliente y escribirlo/añadirlo (append) en el archivo de texto correspondiente.

_________________________________________________
# 4.Programa el método DELETE:

- Paso 4.
Crea la lógica para recibir el nombre del elemento, leer el archivo, excluir esa línea y reescribir el archivo.

_________________________________________________
# 5.Construye la interfaz de usuario (Frontend):

- Paso 5.
Crea tu index.html básico con los botones y formularios. Escribe el JavaScript para hacer los fetch() a tu servidor (primero el GET para listar, luego el POST para agregar) y finalmente programa la lógica de ordenamiento en el cliente.





_________________________________________________
## Que hicimos???

# Scroll horizontal del carrusel → suave

- Se agregó `scroll-behavior: smooth` al `.items-grid` en css
- Ahora cuando giras la rueda sobre el carrusel, el desplazamiento horizontal es animado en vez de instantáneo y es suave...

__2. Zoom de imágenes al hacer hover__ → más suave

- Antes: `500ms ease` (curva abrupta)
- Ahora: `600ms cubic-bezier(.25,.1,.25,1)` (curva suave, empieza y termina lentamente)

__3. Expansión de las tarjetas__ → más suave

- Antes: `360ms cubic-bezier(.2,.8,.2,1)`
- Ahora: `500ms cubic-bezier(.25,.1,.25,1)` (más lento y con aceleración/desaceleración más natural)

__4. Texto que aparece en las tarjetas__ → más suave

- Antes: `300ms ease`
- Ahora: `400ms cubic-bezier(.25,.1,.25,1)`


__5. GIF de éxito aparece ahora al agregar tanto películas como series.__

1. __`public/app.js`__ — se reemplazó `msgDiv.textContent` por `msgDiv.innerHTML` en ambos formularios (`agregarPelicula` y `agregarSerie`), insertando el GIF de Giphy después del mensaje de texto con un salto de línea.

2. __`public/styles.css`__ — se agregó la clase `.msg-gif` con:

   - `display: block` — para que ocupe su propia línea
   - `margin: 8px auto 0` — centrado horizontal
   - `max-width: 120px` — tamaño adecuado sin ocupar demasiado espacio
   - `border-radius: 8px` — bordes redondeados

   Además se agregó `text-align: center` a `.message` para centrar el texto.








