console.log("arena3d.js running...")

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import gsap from 'gsap';
import GUI from 'lil-gui';
import * as Tone from "tone"
import { FlyControls } from 'three/addons/controls/FlyControls.js';




/**
 * ========================================
 * GLOBAL USEFUL VARIABLES
 * ========================================
*/

let musicPlaybackRate = 0.5
let fovValue = 100
let isMusicOn = true


/**
 * ========================================
 * GUI
 * ========================================
*/
const gui = new GUI({title: "Arena 3D"});
const guiParameters = {
  openWebsite: function() {
    window.open('https://www.animanoir.xyz/', '_blank');
  },
  openMoreExperimentsWebsite: function() {
    window.open('https://animanoir-experiments.netlify.app/', '_blank');
  },
  isMusicOn: true
}

gui.add(guiParameters, 'openMoreExperimentsWebsite').name('+ experiments here')
gui.add(guiParameters, 'openWebsite').name('by animanoir.xyz')
gui.add(guiParameters , 'isMusicOn').name('Music:').onChange((value) => {
  isMusicOn = value;
  if (isMusicOn) {
    // Only start if Tone.js is ready
    if (Tone.loaded()) {
      samplePlayer.start();
    } else {
      Tone.loaded().then(() => {
        samplePlayer.start();
      });
    }
  } else {
    samplePlayer.stop();
  }
})

/**
 * ========================================
 * MUSIC/SFX
 * ========================================
*/

const samplePlayer = new Tone.Player({
  url: "/musicsfx/arena3d.ogg",
  loop: true
}
).toDestination()
Tone.loaded().then(() => {
  samplePlayer.start();
  samplePlayer.playbackRate = musicPlaybackRate
})

// Object that stores keys pressed.
let keysPressed = {}

function handleKeyDown(event){
  keysPressed[event.code] = true
  changePlaybackRate(event)
}

function handleKeyUp(event){
  delete keysPressed[event.code]
  if(Object.keys(keysPressed).length === 0){
    gsap.to(samplePlayer, {
      duration: 0.2,
      playbackRate: 0.5,
      ease: "power2.out"
    })
  }
}

function changePlaybackRate(event){
  if(event.code === "KeyW" || event.button == 0){
    
    gsap.to(samplePlayer, {
      duration: 0.2,
      playbackRate: 1.0,
      ease: "power2.out"
    })
  } else if(event.code === "KeyS" || event.button == 2) {
    gsap.to(samplePlayer, {
      duration: 0.2,
      playbackRate: 1.0,
      ease: "power2.out"
    })
  } 
}

window.addEventListener('keydown', handleKeyDown)
window.addEventListener('mousedown', handleKeyDown)
window.addEventListener('keyup', handleKeyUp)
window.addEventListener('mouseup', handleKeyUp)


/**
 * ========================================
 * LOADING MANAGER
 * ========================================
 */
const loadingBar = document.querySelector('#loading-bar')
const loadingManager = new THREE.LoadingManager(
  () => {
    window.setTimeout(() => {
          // console.log("loaded.")
    gsap.to(overlayMaterial.uniforms.uAlpha, {duration:3, value: 0, onComplete: () => {
      overlayMesh.visible = false;
    }})
    loadingBar.classList.add('ended')
    setTimeout(() => {
      
      loadingBar.remove()
    }, 1500)
    }, 500.0)
  },  
  (itemUrl, itemsLoaded, itemsTotal) => {
    const progressRatio = itemsLoaded / itemsTotal
    // console.log("progress: "+ progressRatio)
    if (progressRatio < 1){
      loadingBar.innerHTML = "loading: " + progressRatio
    }else{
      loadingBar.innerHTML = "fuck yeah everything is loaded..."

    }

  },

)


/**
 * ========================================
 * MAIN MOTHERFUCKING SCENE
 * ========================================
 */
const scene = new THREE.Scene();

/**
 * ========================================
 * LOAD OVERLAY
 * ========================================
 */

const overlayGeometry = new THREE.PlaneGeometry(window.innerWidth,window.innerHeight)
const overlayMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms:{
    uAlpha: {value: 1}
  },
  vertexShader: `
    void main(){
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uAlpha;
    void main(){
      gl_FragColor = vec4(0.0,0.0,0.0, uAlpha); 
    }
  `
})
const overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial)
// Add this line to ensure the overlay is rendered in front of everything
overlayMesh.renderOrder = 999;
// Make it a camera-facing plane that doesn't interfere with the scene's z-depth
overlayMesh.position.z = 0;
scene.add(overlayMesh)

/**
 * ========================================
 * CAMERA SETUP
 * ========================================
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(fovValue, sizes.width/sizes.height) // FOV, aspect ratio
camera.position.z = 5.0
scene.add(camera)

/**
 * ========================================
 * POST-PROCESSING CONFIGURATION
 * ========================================
 */
const filmPass = new FilmPass()

// Configure BokehPass with appropriate parameters
const bokehPass = new BokehPass(scene, camera, {
  focus: 1.2,        // Focus distance (adjust based on your scene)
  aperture: 0.0025,  // Aperture - smaller values give more pronounced bokeh
  maxblur: 0.01,     // Maximum blur amount
  width: window.innerWidth,
  height: window.innerHeight
})

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */
function getPixelRatio(){
  // Using Math.min prevents a pixel ratio upper than 2, which is unnecessary
  return Math.min(window.devicePixelRatio, 2) 
}
/**
 * Maps a value from one range to another
 * @param {number} value - The value to map
 * @param {number} fromMin - The minimum of the input range
 * @param {number} fromMax - The maximum of the input range
 * @param {number} toMin - The minimum of the output range
 * @param {number} toMax - The maximum of the output range
 * @returns {number} - The mapped value
 */
function mapRange(value, fromMin, fromMax, toMin, toMax) {
  // First normalize the value to 0-1 range
  const normalizedValue = (value - fromMin) / (fromMax - fromMin);
  // Then scale to target range
  return toMin + normalizedValue * (toMax - toMin);
}

const fetchArenaImages = async () => {
  return fetch(`https://api.are.na/v2/channels/metaxis-digital/contents?per=30&sort=position&direction=desc`)
    .then(response => {
      if (!response.ok) {
        throw new Error('There was an error fetching from Are.na.');
      }
      return response.json();
    })
    .then(data => {
      const { contents } = data;
      return contents;
    })
    .catch(error => {
      console.error('Error fetching images from Are.na:', error);
      return [];
    });
}

// Use the Promise with .then()
fetchArenaImages().then(images => {
  console.info('Arena images loaded:', images);
  
  if (images && images.length > 0) {

    images.map((img => {    
    // Create an image element and texture
    const isGif = img.image?.original?.url?.toLowerCase().endsWith('.gif');
    const image = new Image();
    image.crossOrigin = "Anonymous"; // Important for CORS
    image.src = img.image?.display?.url || img.image?.original?.url;
    
    const texture = new THREE.Texture(image);
    texture.mipmaps = false
    
    // Update texture when the image loads
    image.onload = () => {
      texture.needsUpdate = true;
      // Create and add the plane with the texture
      const simplePlaneGeometry = new THREE.PlaneGeometry();
      const simplePlaneMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
      });
      const simplePlaneMesh = new THREE.Mesh(simplePlaneGeometry, simplePlaneMaterial);
      simplePlaneMesh.position.x = (Math.random() - 0.5) * 5.0
      simplePlaneMesh.position.y = (Math.random() - 0.5) * 5.0
      simplePlaneMesh.position.z = Math.random() * 5 - 3
      scene.add(simplePlaneMesh);
      simplePlaneMesh.lookAt(camera.position)
      
    };
    }))
  }
});

/**
 * ========================================
 * SCENE AND ENVIRONMENT SETUP
 * ========================================
 */
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)
const canvas = document.querySelector('canvas#maincanvas')


// Environment map
const environmentMap = cubeTextureLoader.load([
  '/environmentmaps/chinese/individual/px.png',
  '/environmentmaps/chinese/individual/nx.png',
  '/environmentmaps/chinese/individual/py.png',
  '/environmentmaps/chinese/individual/ny.png',
  '/environmentmaps/chinese/individual/pz.png',
  '/environmentmaps/chinese/individual/nz.png',
])
scene.environment = environmentMap
// scene.background = environmentMap
scene.environmentIntensity = 5.0

/**
 * ========================================
 * LIGHTING CONFIGURATION
 * ========================================
 */
// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

/**
 * ========================================
 * CAMERA EFFECTS CONFIGURATION
 * ========================================
 */
// Drunken camera effect configuration
const drunkenEffect = {
  enabled: true,
  positionIntensity: 0.1,      // How much the camera position sways
  rotationIntensity: 0.1,    // How much the camera rotation sways
  speed: 1.0,                // Speed of the swaying motion
  complexity: 3              // How complex the movement patterns are (1-5)
};

// Container for original camera state
const originalCameraState = {
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion()
};

/**
 * Apply a drunken camera effect with modular properties
 * @param {THREE.Camera} camera - The camera to apply the effect to
 * @param {number} elapsedTime - The elapsed time from the clock
 * @param {Object} effect - Configuration object for the effect
 */
function applyCameraDrunkenEffect(camera, elapsedTime, effect) {
  if (!effect.enabled) return;
  
  // Store original camera state
  originalCameraState.position.copy(camera.position);
  originalCameraState.quaternion.copy(camera.quaternion);
  
  // Position sway
  camera.position.x += Math.sin(elapsedTime * 1.1 * effect.speed) * effect.positionIntensity;
  camera.position.y += Math.sin(elapsedTime * 0.9 * effect.speed) * effect.positionIntensity;
  
  // Add complexity to the movement
  if (effect.complexity > 1) {
    camera.position.x += Math.sin(elapsedTime * 2.2 * effect.speed) * effect.positionIntensity * 0.3;
    camera.position.y += Math.sin(elapsedTime * 1.8 * effect.speed) * effect.positionIntensity * 0.3;
  }
  
  if (effect.complexity > 2) {
    camera.position.z += Math.sin(elapsedTime * 1.4 * effect.speed) * effect.positionIntensity * 0.2;
  }
  
  // Rotation sway
  camera.rotateX(Math.sin(elapsedTime * 0.5 * effect.speed) * effect.rotationIntensity);
  camera.rotateZ(Math.sin(elapsedTime * 0.6 * effect.speed) * effect.rotationIntensity);
}

// Debug helper
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

/**
 * ========================================
 * RENDERER SETUP
 * ========================================
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.setPixelRatio(getPixelRatio())
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)


/**
 * ========================================
 * CONTROLS
 * ========================================
 */
let controls

controls = new FlyControls( camera, renderer.domElement);

controls.movementSpeed = 0.5;
controls.rollSpeed = 0.3;
controls.autoForward = false;
controls.dragToLook = false;

/**
 * ========================================
 * WINDOW RESIZE HANDLING
 * ========================================
 */
const handleResize = () => {
  // console.log("Window is being resized...")
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  
  // Update camera aspect ratio
  camera.aspect = sizes.width/sizes.height
  camera.updateProjectionMatrix();

  // Update renderer and effects
  renderer.setSize(sizes.width, sizes.height)
  effectComposer.setSize(sizes.width, sizes.height)
  
  // Re-render the scene after resize
  renderer.render(scene, camera)
  renderer.setPixelRatio(getPixelRatio())
}

window.addEventListener('resize', handleResize)

// Controls (currently disabled)
// const controls = new OrbitControls(camera, renderer.domElement);

/**
 * ========================================
 * POST-PROCESSING SETUP
 * ========================================
 */
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(getPixelRatio())
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

effectComposer.addPass(bokehPass)
effectComposer.addPass(filmPass)

/**
 * ========================================
 * ANIMATION LOOP
 * ========================================
 */
let mainClock = new THREE.Clock
let delta 
function animate(){
  requestAnimationFrame(animate);
  delta = mainClock.getDelta()
  controls.update( delta );
  const elapsedTime = mainClock.getElapsedTime();
  
  // controls.update();
  
  // Apply drunken camera effect
  applyCameraDrunkenEffect(camera, elapsedTime, drunkenEffect);

  // camera.lookAt(0,0,0)
  
  // Rotate environment map
  // if(environmentMap){
  //   scene.environmentRotation.x = elapsedTime * 5.0;
  //   // scene.environmentRotation.y = elapsedTime * 5.0;
  //   // scene.environmentRotation.z = elapsedTime;
  // }

  // Controls update (commented out)
  // controls.update();
  
  // Render the scene
  effectComposer.render()
  
  // Reset camera state after rendering to prevent accumulation
  if (drunkenEffect.enabled) {
    camera.position.copy(originalCameraState.position);
    camera.quaternion.copy(originalCameraState.quaternion);
  }
}








animate();










/**
 * ========================================
 * PERSONAL NOTES
 * ========================================
 */
/*
Position: x, y, z.
Position inherits from Vector3.

Rotation uses Euler.
Math.PI (half rotation).
reorder(xyz): This changes the order of rotation.
It is better to use Quaternions for rotation.

Group things to move them at the same time.

Methods:
distanceTo()
normalize()
set(x, y, z): Change the 3 values at the same time.
lookAt(object to look at)

Pixel ratio is the quantity of pixels rendered to the screen. It is exponential.
*/