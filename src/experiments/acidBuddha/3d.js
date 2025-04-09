console.log("3j.js running...")

/**
 * ========================================
 * IMPORTS AND DEPENDENCIES
 * ========================================
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'


/**
 * ========================================
 * POST-PROCESSING CONFIGURATION
 * ========================================
 */
const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 0.5
unrealBloomPass.radius = 0.5
unrealBloomPass.threshold = 0.5

const filmPass = new FilmPass()

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
 * ========================================
 * SCENE AND ENVIRONMENT SETUP
 * ========================================
 */
let buddhaModel;
const cubeTextureLoader = new THREE.CubeTextureLoader()
const canvas = document.querySelector('canvas#maincanvas')
const scene = new THREE.Scene();

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

// Add directional light
// const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
// directionalLight.position.set(1, 2, 3);
// scene.add(directionalLight);

/**
 * ========================================
 * MODEL LOADING
 * ========================================
 */
const gltfLoader = new GLTFLoader();
gltfLoader.load('/models/buddha/scene.gltf', (model) => {
  console.info("Model loaded successfully.")
  buddhaModel = model.scenes[0]
  scene.add(buddhaModel)
}, undefined, function ( error ) { // undefined skips the onProgress function.
  console.error( error );
} )

// Commented out sphere code
// const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32)
// const sphereMaterial = new THREE.MeshBasicMaterial({
//   color: 'red',
//   wireframe: true
// })
// const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
// sphereMesh.scale.set(5,5,5)
// scene.add(sphereMesh)
// console.info(sphereMesh.position.distanceTo(camera.position))

/**
 * ========================================
 * CAMERA SETUP
 * ========================================
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(75, sizes.width/sizes.height) // FOV, aspect ratio
camera.position.z = 2.0
scene.add(camera)


const listener = new THREE.AudioListener()
camera.add(listener)

const music = new THREE.Audio(listener)

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( '/musicsfx/acidBuddha.ogg', function( buffer ) {
	music.setBuffer( buffer );
	music.setLoop( true );
	music.setVolume( 0.5 );
	music.play();
});

/**
 * ========================================
 * CAMERA EFFECTS CONFIGURATION
 * ========================================
 */
// Drunken camera effect configuration
const drunkenEffect = {
  enabled: true,
  positionIntensity: 0.5,      // How much the camera position sways
  rotationIntensity: 0.5,    // How much the camera rotation sways
  speed: 1.0,                // Speed of the swaying motion
  complexity: 5              // How complex the movement patterns are (1-5)
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
 * WINDOW RESIZE HANDLING
 * ========================================
 */
const handleResize = () => {
  console.log("Window is being resized...")
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
effectComposer.addPass(unrealBloomPass)
effectComposer.addPass(filmPass)

/**
 * ========================================
 * ANIMATION LOOP
 * ========================================
 */
let mainClock = new THREE.Clock
function animate(){
  requestAnimationFrame(animate);
  const elapsedTime = mainClock.getElapsedTime();
  
  // Apply drunken camera effect
  applyCameraDrunkenEffect(camera, elapsedTime, drunkenEffect);
  
  // Rotate model if loaded
  if (buddhaModel) {
    buddhaModel.rotation.y = elapsedTime;
    camera.lookAt(buddhaModel.position)
  }
  
  // Rotate environment map
  if(environmentMap){
    scene.environmentRotation.x = elapsedTime * 5.0;
    // scene.environmentRotation.y = elapsedTime * 5.0;
    // scene.environmentRotation.z = elapsedTime;
  }

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