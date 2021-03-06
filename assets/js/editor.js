// Carga jQuery
window.$ = window.jQuery = require('jquery');
// Carga los modules a utilizar
const {remote} = require('electron')
// Permiten cambiar el menu
const {Menu, MenuItem} = remote
const Window = require('electron').remote.getCurrentWindow()
// Mostrar dialog box
const dialog = require('electron').remote.dialog
// Gestor de archivos
const fs = require('fs');
// Controlar procesos
const { ipcRenderer } = require('electron');

// Configuración default del editor en lenguaje y tema
const DEFAULT_MODE = "ace/mode/javascript";
const DEFAULT_THEME = "ace/theme/monokai";

// Evento cuando la página esta lista
$(()=>{
	// Lista de Opciones de sintaxis
	var modeOptions = [];
	// Lista de opciones de temas
	var themeOptions = [];
	// Lista de editores o tabs en la ventana
	var editors = [];
	// Tema actual
	var currTheme = DEFAULT_THEME;
	// función que inicializa los modeOptions y themeOptions, además de ejecutar la función addEditor
	function codeEditorSetup(){
		// ################### Lista de lenguajes ###################
		// Obtiene todos los modos o lenguajes de sintaxis disponibles
		var modelist = ace.require("ace/ext/modelist");
		// Genera un arreglo de opciones de menu para cambiar la sintaxis
		for (let i = 0; i < modelist.modes.length; i++) {
			let modeOption = {
				label: modelist.modes[i].caption,
				click(){
					var editor = getActiveEditor();
					editor.editor.getSession().setMode(modelist.modes[i].mode);
				}
			}

			// Chequea el lenguaje por default
			if(modelist.modes[i].mode == DEFAULT_MODE)
				modeOption.checked = true;

			modeOptions.push(modeOption);	
		}
		// ################### Lista de temas ###################
		// Obtiene todos los temas disponibles
		var themelist = ace.require("ace/ext/themelist");
		// Genera un arreglo de opciones de menu para cambiar el tema
		for (let i = 0; i < themelist.themes.length; i++) {
			let themeOption = {
				label: themelist.themes[i].caption,
				type: 'radio',
				click: function(){
					currTheme = themelist.themes[i].theme;
					for (var j = editors.length - 1; j >= 0; j--) {
						editors[j].editor.setTheme(themelist.themes[i].theme);
					}
				}
			}

			// Chequea el tema por default
			if(themelist.themes[i].theme == DEFAULT_THEME)
				themeOption.checked = true;

			themeOptions.push(themeOption);	
		}

		addEditor();

		$("body").on("click", "span.delete",function(){
			console.log("click en delete");
			removeEditor($(this).attr("data-index"));
		})
	}
	// función que añade el markup HTML necesario para crear una nueva tab en el index.html, dentro de este tab inicializa un editor con el tema actual 
	// (currTheme) y con el lenguaje por default (DEFAULT_MODE)
	function addEditor(){
		// ################### Desactiva el editor actual ###################
		var activeEditor = getActiveEditor();
		if(activeEditor != null){
			$("#liEditor_"+activeEditor.index).removeClass("active");
			$("#tabEditor_"+activeEditor.index).removeClass("active");
		}
		// ################### Agrega HTML ###################
		let active = (editors.length == 0) ? ' active' : '';
		let tab = `
			<li id="liEditor_${editors.length}" role="presentation" class="${active}"><a href="#tabEditor_${editors.length}" aria-controls="tabEditor_${editors.length}" role="tab" data-toggle="tab"><span class="nombreCodigo">Código #${editors.length}</span> <span class="glyphicon glyphicon-remove delete" data-index="${editors.length}"></span></a></li>
		`;
		let tabContent = `
			<div role="tabpanel" class="tab-pane ${active}" id="tabEditor_${editors.length}">
				<section class="editor" id="editor_${editors.length}"></section>
			</div>
		`;
		$("ul[role='tablist']").append(tab);
		$(".tab-content").append(tabContent);

		// ################### Configuracion de editor ###################
		// Genera el area para editar el texto en el elemento con el id="main"
		let editor = ace.edit("editor_"+editors.length);
		// Da el tema por default monokai
	  editor.setTheme(currTheme);
	  // Da el lenguaje por default JavaScript
	  editor.getSession().setMode(DEFAULT_MODE);
	  // Oculta el margen de impresion
	  editor.setShowPrintMargin(false);
	  // Manda resizar el editor cuando se resizea la ventanana
	  $(window).resize(()=>{
	  	editor.resize();
		});
		editors.push({
			editor:editor,
			index:editors.length,
			id: "editor_"+editors.length
		});
		setActiveEditor(editors[editors.length - 1]);
	}
	// función que regresa el valor del editor activo en la ventana, si no hay ningún editor activo regresa nulo
	function getActiveEditor(){
    for (var i = editors.length - 1; i >= 0; i--) {
    	if($("#"+editors[i].id).parent().hasClass("active")){
	      return editors[i];
    	}
		}
		return null;
	}
	// función que obtiene un índice y pone como activo al editor que se encuentra en ese índice del arreglo editors
	function setActiveEditor(editor){
		if(editor == null) return;
    $("#liEditor_"+editor.index).addClass("active");
		$("#tabEditor_"+editor.index).addClass("active");
	}
	// función que elimina el editor que esta en el indice proporcionado y pone activo el primer editor que se encuentre
	function removeEditor(index){
		dialog.showMessageBox({
			type:"warning",
			title:"Cerrar archivo",
			message: "¿Estás seguro que deseas cerrar el archivo?",
			buttons:["Aceptar", "Cancelar"],
			cancelId:1
		},(res) => {
	    if(res == 0){
	    	$( "#liEditor_"+index ).remove();
	    	$( "#tabEditor_"+index ).remove();
	    	// Regresa al primer codigo
	    	setActiveEditor(editors[0]);
	    }
		});
	}
	// función que elimina el editor que se encuentra activo
	function closeActiveEditor(){
  	var editor = getActiveEditor();
  	removeEditor(editor.index);
  }
  // Inicializa el menu de un template y lo añade a la ventana
	function menuSetup(){
	  // Template para el menu de la aplicación
	  const menuTemplate = [
	  	{
				label: 'Archivo',
				id: 'archivo',
				submenu: [
					{
						label: 'Nuevo archivo',
						click: addEditor,
						accelerator: 'CommandOrControl+N'
					},
					{ 
						label: 'Abrir archivo', 
						click: openFile,
						accelerator: 'CommandOrControl+O'
					},
					{ 
						label: 'Guardar', 
						click: saveFile,
						accelerator: 'CommandOrControl+S'
					},
					{ 
						label: 'Guardar como', 
						click: saveAsFile,
						accelerator: 'CommandOrControl+Shift+S'
					},
					{
						type: 'separator'
					},
					{ 
						label: 'Cerrar archivo', 
						click: closeActiveEditor,
						accelerator: 'CommandOrControl+W'
					}
				]
			},
	  	{
	      label: 'Editar',
	      id: 'editar',
	      submenu: [
	        { label: 'Deshacer', role: 'undo' },
	        { label: 'Rehacer', role: 'redo' },
	        {type: 'separator'},
	        { label: 'Cortar', role: 'cut' },
	        { label: 'Copiar', role: 'copy' },
	        { label: 'Pegar', role: 'paste' },
	        { label: 'Seleccionar todo', role: 'selectall' }
	      ]
	    },
	    {
	      label: 'Ventana',
	      id: "ventana",
	      submenu: [
	      	{ 
	      		label: 'Nueva ventana', 
	      		click: function(){
	      			ipcRenderer.send('newWindow', 1);
	      		},
	      		accelerator: 'CommandOrControl+Shift+N'
	      	},
	        { label: 'Minimizar', role: 'minimize' },
	        { label: 'Cerrar', role: 'close', accelerator: 'CommandOrControl+Shift+W' }
	      ]
	    },
	  	{
	  		label: 'Vista',
	  		id: 'vista',
	  		submenu: [
	  			{ label: 'Pantalla completa', role: 'togglefullscreen' }
	  		]
	  	},
	  	{
	  		label: 'Configuración',
	  		id: 'configuracion',
	  		submenu: [
	  			{
	  				label: 'Lenguaje',
	  				submenu: modeOptions
	  			},
	  			{
	  				label: 'Temas',
	  				submenu: themeOptions
	  			}
	  		]
	  	},
	  	{
	  		label: 'Ayuda',
	  		id: 'ayuda',
	  		submenu: [
	  			{
	  				label: 'Más información',
	  				click(){
	  					remote.shell.openExternal('https://github.com/jatj/uCode');
	  				}
	  			}
	  		]
	  	}
	  ]

	  menu = Menu.buildFromTemplate(menuTemplate);
		Window.setMenu(menu);
	}
	// Crea un nuevo editor, abre un archivo y pone el contenido del archivo en el editor
	function openFile(){
		dialog.showOpenDialog((fileNames) => {
	    // fileNames is an array that contains all the selected
	    if(fileNames === undefined){
	      console.log("No se selecciono el archivo");
	      return;
	    }
	    
	    fs.readFile(fileNames[0], 'utf-8', (err, data) => {
	      if(err){
	        console.log("Error :" + err.message);
	        return;
	      }
	      addEditor();

	      editors[editors.length - 1].editor.insert(data);
	      editors[editors.length - 1].path = fileNames[0];
	      let tokens = fileNames[0].split("\\");
	      $("#liEditor_"+editors[editors.length - 1].index + " .nombreCodigo").text(tokens[tokens.length - 1])
	    });
		});
  }
  // Guarda un archivo como
  function saveAsFile(){
  	saveFile(true);
  }
  // Guarda archivo si el archivo es nuevo o si el parametro saveAs es verdadero busca un nuevo path para guardarlo, 
  // si el archivo fue abierto y tiene registrado el path
  function saveFile(saveAs){
  	var editor = getActiveEditor();

  	var filepath = editor.path;
  	var content = editor.editor.getValue();

  	if(filepath != "" && filepath != null && filepath != undefined && saveAs != true){
	  	fs.writeFile(filepath, content, (err) => {
	  	    if (err) {
	  	        alert("Error al guardar el archivo" + err.message);
	  	        console.log(err);
	  	        return;
	  	    }
	  	});
  	}else{
	  	dialog.showSaveDialog({
		    properties: ['createDirectory', 'promptToCreate ']
		  },(dirPath)=>{
		  	if(dirPath == "" || dirPath == null || dirPath == undefined) return;
		  	fs.writeFile(dirPath, content, (err) => {
		  	    if (err) {
		  	        alert("Error al guardar el archivo" + err.message);
		  	        console.log(err);
		  	        return;
		  	    }else{
		  	    	editor.path = dirPath;
		  	    	let tokens = dirPath.split("\\");
		  	    	$("#liEditor_"+editor.index + " .nombreCodigo").text(tokens[tokens.length - 1]);
		  	    }
		  	});
		  })
  	}
  }

	codeEditorSetup();

	menuSetup();
});