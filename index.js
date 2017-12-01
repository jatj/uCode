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

// IPC module 
const {ipcMain} = require('electron')

// Path module para los directorios de archivos
var path = require('path')

// Almacenara la ventana principal del proyecto
let windows = [];
// Almacenan las propiedades de la pantalla
let screen = null;
let display = null;
let area = null;

// Función que se ejecutara cuando la ventana es cerrada
function onClosed(index) {
	// Elimina la referencia de la ventana principal, si se tuvieran más ventanas se
	// necesitaria utilizar un arreglo para almacenarlas
	windows[index] = null;
}

// Función de retorno que se ejecuta cuando la aplicación esta lista
function createWindow(index) {
	// Inicializa una nueva ventana con un tamaño de 600 x 400
	const win = new electron.BrowserWindow({
		width: area.width,
		height: area.height,
		backgroundColor: '#3EB2BF',
		icon: path.join(__dirname, 'assets/images/uCode.png')
	});
	
	// Carga el archivo index.html que se encuentra en la raiz del proyecto dentro de la ventana
	win.loadURL(`file://${__dirname}/index.html`);
	
	// Se enlaza el evento de que la ventana se cerro con la funcion de retorno onClosed
	win.on('closed', onClosed, index);

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
	for(let i = 0; i < windows.length; i++){
		if (!windows[i]) {
			windows.push(createWindow(windows.length));
		}
	}
});

// Evento que se llama cuando la aplicación se encuentra lista
app.on('ready', () => {
	// Se obtienen las dimensiones de la pantalla en uso
	screen = electron.screen;
	display = screen.getPrimaryDisplay();
  area = display.workArea;
	// Se crea una nueva ventana, la ventana principal
	windows.push(createWindow(windows.length));
});

// Evento que escucha los eventos de los editores de crear nueva netnana
ipcMain.on('newWindow', (event, msg) => {
  createWindow(windows.length);
});
