// ES Module version of led.js
let led; //Imagen transparente.
let galaxia; //Imagen que va dentro de led.
let x = -200; //Eje x de la imagen para que se mueva.
let alpha = 0; //Transparencia de la imagen para un efecto lindo de aparición.

//Array of images
const galaxias = ["./n1.jpg", "./n2.jpg", "./n3.jpg", "./n4.jpg"];
let galaxiaElegida;

const frase = [
  {
    arriba: 'Léeme',
    abajo: '...',
  },
  {
    arriba: 'Te dedico',
    abajo: 'a un poema.',
  },
  {
    arriba: 'Se',
    abajo: 'eterno.',
  },
  {
    arriba: 'Y hazme',
    abajo: 'el click.',
  }
];

let fraseIndex = 0;

// Make p5.js functions available in the global scope for ES modules
window.preload = function() {
  //Selecciona un index de galaxias al azar
  galaxiaElegida = Math.floor(random(galaxias.length));
  galaxia = loadImage(galaxias[galaxiaElegida]);
  led = loadImage("./led-transparente.png");
};

window.setup = function() {
  //Usa un div con id p5 como canvas.
  let cnv = createCanvas(301, 455);
  cnv.parent("p5");
  textSize(25);
  textAlign(CENTER);
};

window.draw = function() {
  background(255);
  text(frase[fraseIndex].arriba, width / 2, height / 2);
  text(frase[fraseIndex].abajo, width / 2, (height / 2) + 20);
  cambiarNebula();
  //Máscara transparente
  image(led, 0, 0);
};

// Esta función hace el cambio de las nébulas que salen dentro de Led.
function cambiarNebula() {
  // x es el eje x donde se mueve la ImageBitmapRenderingContext.
  x += 0.29;
  // alpha es para el efecto como de aparecer.
  alpha += 3;
  push();

  // Cuando es mayor o igual a -100, hace lo que está dentro, que es como reiniciar.
  if (x >= -100) {
    fraseIndex++;
    if (fraseIndex >= frase.length) {
      fraseIndex = 0;
    }
    galaxiaElegida = Math.floor(random(galaxias.length));
    galaxia = loadImage(galaxias[galaxiaElegida]);
    x = -200;
    alpha = 0;
  }
  tint(255, alpha);
  image(galaxia, x, 0);
  pop();
}