// Es una directiva de ECMAScript 5, la cual indica que todo el código
// se ejecutará en modo estricto. Limitando a no poder usar variables 
// sin declarar, entre otras restricciones. 
// Mas información: https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/Modo_estricto 
'use strict';
// Inicializa la aplicacion de electron
const electron = require('electron');
const app = electron.app;

// Agrega utilidades como shorcuts para abrir la consola o para recargar la aplicación
require('electron-debug')();

// Almacenara la ventana principal del proyecto
let mainWindow;
// Función que se ejecutara cuando la ventana es cerrada
function onClosed() {
	// Elimina la referencia de la ventana principal, si se tuvieran más ventanas se
	// necesitaria utilizar un arreglo para almacenarlas
	mainWindow = null;
}
// Función de retorno que se ejecuta cuando la aplicación esta lista
function createMainWindow() {
	// Inicializa una nueva ventana con un tamaño de 600 x 400
	const win = new electron.BrowserWindow({
		width: 600,
		height: 400
	});
	// Carga el archivo index.html que se encuentra en la raiz del proyecto dentro de la ventana
	win.loadURL(`file://${__dirname}/index.html`);
	// Se enlaza el evento de que la ventana se cerro con la funcion de retorno onClosed
	win.on('closed', onClosed);
	// Regresa el valor de la  ventana
	return win;
}
// Evento que se ejecuta cuando todas las ventanas de la aplicación son cerradas
app.on('window-all-closed', () => {
	// En el caso de estar corriendo en MacOS se cierra la aplicación, ya que de lo contrario
	// la aplicación permaneceria corriendo en background
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
// Evento que se llama cuando la aplicación se encuentra activa
app.on('activate', () => {
	// Si no se ha generado la ventana principal, se crea una nueva
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});
// Evento que se llama cuando la aplicación se encuentra lista
app.on('ready', () => {
	// Se crea una nueva ventana, la ventana principal
	mainWindow = createMainWindow();
});