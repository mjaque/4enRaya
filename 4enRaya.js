'use strict'

console.log("Iniciando 4enRaya");
window.onload = preparar;

//Constantes
const FILAS = 6;
const COLS = 7;
const SVG_NS = "http://www.w3.org/2000/svg";
const COLOR0 = "white";
const COLOR_HUMANO = "blue";
const COLOR_IA = "red";
const OBJETIVO = 10;    //Jugamos a 10 puntos

//Variables Globales
let svg = null;
let turno = COLOR_HUMANO;  //Cambiará de COLOR
let tablero;      //Un array de colores (por columnas) de 7 arrays de 6 posiciones.
let vistaTablero;    //Un array de circles (por columnas) de 7 arrays de 6 posiciones.
let puntos = [0,0];    //Puntos de la partida [Humano, IA]
let pResultado;      //Elemento HTML con la información del resultado de la partida
let mensaje;       //Texto del mensaje ganar/perder
let nivel = 5;      //Nivel de juego
let pausa = false;    //Indica si el juego está en pausa
let contadorMovimientos = 0;
let rMargenY = 50;
let rAltura = 515;

//TODO: Poda alfa-beta
//Guardamos el valor mínimo (alfa, si es MIN(juega Humano)) o máximo (beta, si es MAX(juega IA)) de cada nivel.
//Si en al analizar una jugada de HUMANO, una opción no es inferior al mínimo...

/**
  Configura el tablero de juego.
**/
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
  let r = document.createElementNS(SVG_NS,"rect");
  r.setAttribute('x', 0);
  r.setAttribute('y', rMargenY);  //margen superior para las flechas
  r.setAttribute('rx', 20);
  r.setAttribute('ry', 20);
  r.setAttribute('width', 600);
  r.setAttribute('height', 515);
  svg.appendChild(r);
  
  mostrarPuntos();
  
  document.getElementById("btnSiguiente").addEventListener("click", iniciarPartida);
  
  iniciarPartida();
}

/**
  Inicia la partida.

  - Inicializa los arrays de tablero y vistaTablero. 
  - Crea los círculos del tablero. 
  - Crea las flechas de pulsación. 
  - Captura los eventos de mouseover, mouseout y click
**/
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
  let cRadio = 40;
  for(let i = 0; i < FILAS; i++){
    for (let j = 0; j < COLS; j++){
      let cy = 5 + rMargenY + cRadio + (2*cRadio+5)*i;
      let cx = 5 + 0 + cRadio + (2*cRadio+5)*j;
      let c = document.createElementNS(SVG_NS,"circle");
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
  for (let i = 0; i < 7; i++){
    let f = document.createElementNS(SVG_NS,"polygon");
    let p1X = 15 + 85*i;
    let p1Y = 15;
    let p2X = p1X + (86 - 15*2);
    let p2Y = p1Y;
    let p3X = p1X + (p2X - p1X) / 2;
    let p3Y = 40;
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

/**
  Atención al mouseover sobre una flecha.
**/
function cambiarColorFlecha(evento){
  let f = evento.target;
  f.style.fill =  turno;
}

/**
  Muestra los puntos de cada jugador.
**/
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

/**
  Atención al mouseout sobre una flecha.
**/
function borrarColorFlecha(evento){
  let f = evento.target;
  f.style.fill =  'white';
}

/**
  Atención al click sobre una columna.
  @param evento {MouseEvent} Evento de click recibido.
**/
function clickColumna(evento){
  if (!pausa){
    let col = evento.target.getAttribute("data-col");
    jugar(col, tablero);
  }
  else
    console.log("Juego pausado.");
}

/**
  Realiza una jugada.
  Comprueba si el movimiento es válido. Luego comprueba si hay algún ganador o si hay empate.
  Si no ha terminado la partida, cambia el turno.
  @param col {Number} Número de la columna en la que se realiza la jugada.
  @param tablero {Object} Objeto tablero sobre el que se realiza la jugada. Este puede ser el tablero real, o uno donde la IA simula jugadas.
**/
function jugar(col, tablero){
  if (!mover(col, tablero, turno)){  //Si el movimiento no es válido
    console.log("Mov. a " + col + " es ilegal");
    return;        //No hacemos nada
  }
  
  mostrar(tablero);
  
  console.log("Mov. " + (++contadorMovimientos) + " " + turno + " " + col);

  let ganador = verGanador(tablero);
  if (ganador == COLOR_HUMANO){
    pausa = true;
    console.log("Gana Humano");
    mensaje.innerHTML = 'Tú ganas humano';
    pResultado.style.visibility = "visible";
    puntos[0]++;
    mostrarPuntos();
    nivel++;
  }
  else if (ganador == COLOR_IA){
    pausa = true;
    console.log("Gana IA");
    mensaje.innerHTML = '¡Yo gano!';
    pResultado.style.visibility = "visible";
    puntos[1]++;
    mostrarPuntos();
    nivel--;
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

/**
  Realiza el movimiento.
  Busca el primer hueco de la columna elegida y cambia el estado del tablero.
  @param col {Number} Número de la columna.
  @param tablero {Object} Objeto tablero sobre el que se realiza la jugada. Este puede ser el tablero real, o uno donde la IA simula jugadas.
  @param color {String} Nombre del color de la jugada.  
**/
function mover(col, tablero, color){
  let fila = verPrimerHueco(col, tablero);
  if (fila == -1) return false;  //Fila llena

  tablero[fila][col] = color;
  return true;
}

/**
  Muestra las fichas del tablero.
  Para ello cambia el atributo fill del círculo.
  @param tablero {Object} Objeto tablero.
**/
function mostrar(tablero){
  for(let i = 0; i < FILAS; i++){
    for (let j = 0; j < COLS; j++)
    vistaTablero[i][j].style.fill = tablero[i][j];
  }
}

/**
  Busca el primer hueco en una columna del tablero.
  @param col {Number} Número de la columna.
  @param tablero {Object} Objeto tablero sobre el que se realiza la jugada. Este puede ser el tablero real, o uno donde la IA simula jugadas.
**/
function verPrimerHueco(col, tablero){
  let i = FILAS - 1;
  while (i >= 0){
    if (tablero[i][col] == COLOR0)
      return i;
    i--;
  }
  //console.log("Columna Llena");
  return -1;
}

/**
  Cambia el turno de juego.
**/
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
  Decide el movimiento de la IA.
  Utiliza el algoritmo MINIMAX
**/
function jugarIA(){
  let mejorValor = -2;
  let mejoresJugadas = new Array();
  
  for (let i = 0; i < COLS; i++){
    if (verPrimerHueco(i, tablero) != -1){ //No comprobamos los ilegales
      let valor = valorarJugada(tablero, COLOR_IA, i, 0)
      console.log("Valor de col " + i + " = " + valor);
      if (valor > mejorValor){
        mejorValor = valor;
        mejoresJugadas = [i];  //Borramos el array y metemos el nuevo valor
      }
      else if (valor == mejorValor){
        mejoresJugadas.push(i);
      }
    }
  }
  
  if (mejoresJugadas.length == 0)  //No hay ningún movimiento legal
    empate();
  else{
    //Elegimos aleatoriamente entre las mejores mejoresJugadas
    let col = mejoresJugadas[Math.floor(Math.random() * mejoresJugadas.length)];
    console.log("Juego " + col);
    jugar(col, tablero);
  }
}

/**
  Calcula el valor de una jugada.
  @param tablero {Object} Objeto tablero sobre el que se realiza la jugada. Este puede ser el tablero real, o uno donde la IA simula jugadas.
  @param jugador {String} Jugador que hace el movimiento (COLOR_IA | COLOR_HUMANO)
  @param col {Number} Número de la columna del movimiento.
  @param profundidad {Number} Profundidad de la jugada en el árbol.
  @return {Number} 1 si gana IA. -1 si gana HUMANO. 0 si la columna está llena o no hay ningún ganador.
**/
function valorarJugada(tablero, jugador, col, profundidad){
  
  if (verPrimerHueco(col, tablero) == -1)  //Columna llena
    return 0;    //Peor es perder
  
  if (profundidad == nivel)  //Si hemos llegado al último nivel
    return 0;    // ya no valoramos la jugada
    
  //Hacemos una copia del tablero
  let tablero1 = copiarTablero(tablero);
  
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
    if (verGanador(tablero1) == COLOR_HUMANO)  //Si es terminal -> -1
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
  
  return 0;  //Si no gana ninguno devolvemos cero
  
    //IA - Escojo la jugada que maximiza el valor (mi mejor jugada)
    //HUMANO - Escojo la jugada que minimiza el valor (su mejor jugada)
}

/**
  Muesta el empate en el interfaz.
**/
function empate(){
  console.log("Empate");
  alert("Empate");
  pResultado.style.visibility = "visible";
}

/**
  Devuelve una copia de un tablero.
  @param tablero {Object} Tablero a copiar.
  @return {Object} Copia del tablero.
**/ 
function copiarTablero(tablero){
  let copiaTablero = new Array(FILAS);
  for(let i = 0; i < FILAS; i++)
    copiaTablero[i] = tablero[i].slice();
  
  return copiaTablero;
}

/**
  Detecta si hay un ganador.
  @param tablero {Object} Tablero a analizar.
  @return {String} Color del ganador (COLOR_IA | COLOR_HUMANO) o undefined si no hay ganador
**/
function verGanador(tablero){
  //Buscamos en horizontal
  for (let f = 0; f < FILAS; f++){
    let n1 = 0;
    let n2 = 0;
    for (let c = 0; c < COLS; c++){
      if (tablero[f][c] == COLOR0){
        n1 = 0;
        n2 = 0;
      }
      else if (tablero[f][c] == COLOR_HUMANO){
        n1++;
        n2 = 0;
        if (n1 == 4){
          return COLOR_HUMANO;
		}
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
  for (let c = 0; c < COLS; c++){
    let n1 = 0;
    let n2 = 0;
    for (let f = FILAS-1; f >= 0; f--){  //De abajo a arriba para poder cortar.
      if (tablero[f][c] == COLOR0){
        break;  //Ya no hay mas en la columna.
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
  for (let i = -(COLS + 4); i < COLS; i++){
    let n1 = 0;
    let n2 = 0;
    for (let f = 0; f < FILAS; f++){
      let c = i + f;
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
  for (let i = 0; i < COLS + 4; i++){
    let n1 = 0;
    let n2 = 0;
    for (let f = 0; f < FILAS; f++){
      let c = i - f;
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
