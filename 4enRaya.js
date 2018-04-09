console.log("Iniciando 4enRaya");
window.onload = preparar;

//Constantes
const FILAS = 6;
const COLS = 7;
const SVG_NS = "http://www.w3.org/2000/svg";
const COLOR0 = "white";
const COLOR_HUMANO = "blue";
const COLOR_IA = "red";
const OBJETIVO = 10;		//Jugamos a 10 puntos

//Variables Globales
var svg = null;
var turno = COLOR_HUMANO;	//Cambiará de COLOR
var tablero;			//Un array de colores (por columnas) de 7 arrays de 6 posiciones.
var vistaTablero;		//Un array de circles (por columnas) de 7 arrays de 6 posiciones.
var puntos = [0,0];		//Puntos de la partida [Humano, IA]
var pResultado;			//Elemento HTML con la información del resultado de la partida
var mensaje; 			//Texto del mensaje ganar/perder
var nivel = 5;			//Nivel de juego
var pausa = false;		//Indica si el juego está en pausa
var contadorMovimientos = 0;
var rMargenY = 50;
var rAltura = 515;

//TODO: Poda alfa-beta
//Guardamos el valor mínimo (alfa, si es MIN(juega Humano)) o máximo (beta, si es MAX(juega IA)) de cada nivel.
//Si en al analizar una jugada de HUMANO, una opción no es inferior al mínimo...

function preparar(){
	svg = document.getElementById("svg");
	pResultado = document.getElementById("pResultado");
	mensaje = document.getElementById("spanResultado");
	
	/*
		Son 6 filas y 7 columnas.
		Cada posición con radio 40 y margen 5
		Ancho: 7*(40*2 + 5) + 5 de margen al final = 600
		Alto:  6*(40*2 + 5) + 5 de margen al final = 600
	*/
	
	//<rect x="0" y="0" rx="20" ry="20" width="600" height="515" />
	r = document.createElementNS(SVG_NS,"rect");
	r.setAttribute('x', 0);
	r.setAttribute('y', rMargenY);	//margen superior para las flechas
	r.setAttribute('rx', 20);
	r.setAttribute('ry', 20);
	r.setAttribute('width', 600);
	r.setAttribute('height', 515);
	svg.appendChild(r);
	
	mostrarPuntos();
	
	document.getElementById("btnSiguiente").addEventListener("click", iniciarPartida);
	
	iniciarPartida();
}

function iniciarPartida(){
	
	pResultado.style.visibility = 'hidden';
	pausa = false;
	
	//Inicializamos los arrays
	tablero = new Array(FILAS);
	vistaTablero = new Array(FILAS);
	for(let i = 0; i < FILAS; i++){
		tablero[i] = new Array(COLS);
		vistaTablero[i] = new Array(COLS);
	}
	
	//<circle cx="" cy="" r="40" />
	var cRadio = 40;
	for(var i = 0; i < FILAS; i++){
		for (var j = 0; j < COLS; j++){
			var cy = 5 + rMargenY + cRadio + (2*cRadio+5)*i;
			var cx = 5 + 0 + cRadio + (2*cRadio+5)*j;
			c = document.createElementNS(SVG_NS,"circle");
			//c.id = 
			c.setAttribute('cx', cx);
			c.setAttribute('cy', cy);
			c.setAttribute('r', 40);
			c.style.fill = COLOR0;
			svg.appendChild(c);
			vistaTablero[i][j] = c;
			tablero[i][j] = COLOR0;
		}
	}
	
	//<polygon points="200,10 250,190 160,210" style="fill:lime;stroke:purple;stroke-width:1" />
	for (var i = 0; i < 7; i++){
		f = document.createElementNS(SVG_NS,"polygon");
		var p1X = 15 + 85*i;
		var p1Y = 15;
		var p2X = p1X + (86 - 15*2);
		var p2Y = p1Y;
		var p3X = p1X + (p2X - p1X) / 2;
		var p3Y = 40;
		f.setAttribute("points", p1X + "," + p1Y + " " + p2X + "," + p2Y + " " + p3X + "," + p3Y);
		f.setAttribute("data-col", i);
		svg.append(f);
		
		f.addEventListener("mouseover", cambiarColorFlecha);
		f.addEventListener("mouseout", borrarColorFlecha);
		f.addEventListener("click", clickColumna);
	}
	
	if (turno == COLOR_IA)
		jugarMaquina();
}

function cambiarColorFlecha(evento){
	var f = evento.target;
	f.style.fill =  turno;
}

function mostrarPuntos(){
	document.getElementById("puntosHumano").innerHTML = puntos[0];
	document.getElementById("puntosIA").innerHTML = puntos[1];
	if (puntos[0] >= OBJETIVO){
		alert("Tú ganas Humano... por ahora");
		location.reload();
	}
	if (puntos[1] >= OBJETIVO){
		alert("Te he ganado (como era de esperar) :)");
		location.reload();
	}
}

function borrarColorFlecha(evento){
	var f = evento.target;
	f.style.fill =  'white';
}

function clickColumna(evento){
	if (!pausa){
		var col = evento.target.getAttribute("data-col");
		jugar(col, tablero);
	}
	else
		console.log("Juego pausado.");
}

function jugar(col, tablero){
	if (!mover(col, tablero, turno)){	//Si el movimiento no es válido
		console.log("Mov. a " + col + " es ilegal");
		return;				//No hacemos nada
	}
	
	mostrar(tablero);
	
	console.log("Mov. " + (++contadorMovimientos) + " " + turno + " " + col);

	var ganador = verGanador(tablero);
	if (ganador == COLOR_HUMANO){
		pausa = true;
		console.log("Gana Humano");
		mensaje.innerHTML = 'Tú ganas humano';
		pResultado.style.visibility = "visible";
		puntos[0]++;
		mostrarPuntos();
	}
	else if (ganador == COLOR_IA){
		pausa = true;
		console.log("Gana IA");
		mensaje.innerHTML = '¡Yo gano!';
		pResultado.style.visibility = "visible";
		puntos[1]++;
		mostrarPuntos();
	}
	else {
		//Vemos si hay empate
		let hayEmpate = true;
		for (let i = 0; i < COLS; i++)
			if (verPrimerHueco(i, tablero) != -1){
				hayEmpate = false;
				break;
			}
		if (hayEmpate)
			empate();
		cambiarTurno();
	}
}

function mover(col, tablero, color){
	var fila = verPrimerHueco(col, tablero);
	if (fila == -1) return false;	//Fila llena

	tablero[fila][col] = color;
	return true;
}

function mostrar(tablero){
	for(let i = 0; i < FILAS; i++){
		for (let j = 0; j < COLS; j++)
		vistaTablero[i][j].style.fill = tablero[i][j];
	}
}

function verPrimerHueco(col, tablero){
	var i = FILAS - 1;
	while (i >= 0){
		if (tablero[i][col] == COLOR0)
			return i;
		i--;
	}
	//console.log("Columna Llena");
	return -1;
}

function cambiarTurno(){
	if (turno == COLOR_HUMANO){
		turno = COLOR_IA;
		if (!pausa)
			jugarIA();
	}
	else
		turno = COLOR_HUMANO;
}

/**
 * Decide el movimiento de la IA.
 * Utiliza el algoritmo MINIMAX
 */
function jugarIA(){
	var mejorValor = -2;
	var mejoresJugadas = new Array();
	
	for (let i = 0; i < COLS; i++){
		if (verPrimerHueco(i, tablero) != -1){ //No comprobamos los ilegales
			var valor = valorarJugada(tablero, COLOR_IA, i, 0)
			console.log("Valor de col " + i + " = " + valor);
			if (valor > mejorValor){
				mejorValor = valor;
				mejoresJugadas = [i];	//Borramos el array y metemos el nuevo valor
			}
			else if (valor == mejorValor){
				mejoresJugadas.push(i);
			}
		}
	}
	
	if (mejoresJugadas.length == 0)	//No hay ningún movimiento legal
		empate();
	else{
		//Elegimos aleatoriamente entre las mejores mejoresJugadas
		var col = mejoresJugadas[Math.floor(Math.random() * mejoresJugadas.length)];
		console.log("Juego " + col);
		jugar(col, tablero);
	}
}

/**
 * Calcula el valor de una jugada.
 * tablero 	- Situación del tablero antes del movimiento.
 * jugador	- Jugador que hace el movimiento (COLOR_IA | COLOR_HUMANO)
 * col		- Índice de la columna a mover.
 * profundidad	- Profundidad de la jugada en el árbol.
 * Devuelve:
 *	 1 si gana IA.
 * 	-1 si gana HUMANO.
 * 	 0 si la columna está llena o no hay ningún ganador.
 */
function valorarJugada(tablero, jugador, col, profundidad){
	
	if (verPrimerHueco(col, tablero) == -1)	//Columna llena
		return 0;		//Peor es perder
	
	if (profundidad == nivel)	//Si hemos llegado al último nivel
		return 0;		// ya no valoramos la jugada
		
	//Hacemos una copia del tablero
	var tablero1 = copiarTablero(tablero);
	
	mover(col, tablero1, jugador);
	
	//Vemos si la jugada es terminal
	if (jugador == COLOR_IA){
		if (verGanador(tablero1) == COLOR_IA) //Si es terminal -> 1
			return 1;
		//Profundizamos buscando la mejor jugada de Humano (MIN)
		let min = 1;
		for (let col2 = 0; col2 < COLS; col2++){
			let tablero2 = copiarTablero(tablero1);
			let valor = valorarJugada(tablero2, COLOR_HUMANO, col2, profundidad + 1);
			//console.log("\tIA: Valor de col " + col2 + " = " + valor);
			if (valor < min)
				min = valor;
		}
		return min;
	}
	else {
		if (verGanador(tablero1) == COLOR_HUMANO)	//Si es terminal -> -1
			return -1;
		//Profundizamos buscando la mejor jugada de IA (MAX)
		let max = -2;
		for (let col2 = 0; col2 < COLS; col2++){
			let tablero2 = copiarTablero(tablero1);
			let valor = valorarJugada(tablero1, COLOR_IA, col2, profundidad + 1);
			//console.log("\tHumano: Valor de col " + col2 + " = " + valor);
			if (valor > max)
				max = valor;
		}
		return max;
	}
	
	return 0;	//Si no gana ninguno devolvemos cero
	
		//IA - Escojo la jugada que maximiza el valor (mi mejor jugada)
		//HUMANO - Escojo la jugada que minimiza el valor (su mejor jugada)
}

function empate(){
	console.log("Empate");
	alert("Empate");
	pResultado.style.visibility = "visible";
}

function copiarTablero(tablero){
	var copiaTablero = new Array(FILAS);
	for(var i = 0; i < FILAS; i++)
		copiaTablero[i] = tablero[i].slice();
	
	return copiaTablero;
}

function verGanador(tablero){
	//Buscamos en horizontal
	for (var f = 0; f < FILAS; f++){
		var n1 = 0;
		var n2 = 0;
		for (var c = 0; c < COLS; c++){
			if (tablero[f][c] == COLOR0){
				n1 = 0;
				n2 = 0;
			}
			else if (tablero[f][c] == COLOR_HUMANO){
				n1++;
				n2 = 0;
				if (n1 == 4)
					return COLOR_HUMANO;
			}
			else{
				n1 = 0;
				n2++;
				if (n2 == 4)
					return COLOR_IA;
			}
		}
	}
	
	//Buscamos en vertical de abajo a arriba
	for (var c = 0; c < COLS; c++){
		var n1 = 0;
		var n2 = 0;
		for (var f = FILAS-1; f >= 0; f--){	//De abajo a arriba para poder cortar.
			if (tablero[f][c] == COLOR0){
				break;	//Ya no hay mas en la columna.
			}
			else if (tablero[f][c] == COLOR_HUMANO){
				n1++;
				n2 = 0;
				if (n1 == 4)
					return COLOR_HUMANO;
			}
			else{
				n1 = 0;
				n2++;
				if (n2 == 4)
					return COLOR_IA;
			}
		}
	}
	
	//Buscamos en diagonal de izquierda a derecha
	for (var i = -(COLS + 4); i < COLS; i++){
		var n1 = 0;
		var n2 = 0;
		for (var f = 0; f < FILAS; f++){
			var c = i + f;
			if ((c < 0) || (c >= COLS))
				continue;
			if (tablero[f][c] == COLOR0){
				n1 = 0;
				n2 = 0;
			}
			else if (tablero[f][c] == COLOR_HUMANO){
				n1++;
				n2 = 0;
				if (n1 == 4)
					return COLOR_HUMANO;
			}
			else{
				n1 = 0;
				n2++;
				if (n2 == 4)
					return COLOR_IA;
			}
		}
	}
	
	//Buscamos en diagonal de derecha a izquierda
	for (var i = 0; i < COLS + 4; i++){
		var n1 = 0;
		var n2 = 0;
		for (var f = 0; f < FILAS; f++){
			var c = i - f;
			if ((c < 0) || (c >= COLS))
				continue;
			if (tablero[f][c] == COLOR0){
				n1 = 0;
				n2 = 0;
			}
			else if (tablero[f][c] == COLOR_HUMANO){
				n1++;
				n2 = 0;
				if (n1 == 4)
					return COLOR_HUMANO;
			}
			else{
				n1 = 0;
				n2++;
				if (n2 == 4)
					return COLOR_IA;
			}
		}
	}
	return undefined;
}