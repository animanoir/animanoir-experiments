console.log("melodyBird.js running...")
console.info("Bird model by: https://sketchfab.com/3d-models/bird-animations-alex-081fa7f0cfd649b9b07babb4c619acc7")

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import gsap from 'gsap';
import GUI from 'lil-gui';
import * as Tone from "tone"
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';


let musicPlaybackRate = 1.0
let isMusicOn = true
let birdModel;
let cameraFov = 75


/**
 * ========================================
 * GUI
 * ========================================
*/

const gui = new GUI({title: "Melody Bird (WIP)"});
const guiParameters = {
  cameraFov: 75,
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
  url: "/musicsfx/melodyBird-v1-ogg.ogg",
  loop: true
}
).toDestination()
Tone.loaded().then(() => {
  samplePlayer.start();
  samplePlayer.playbackRate = musicPlaybackRate
})

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
      loadingBar.innerHTML = "loaded..."

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

const camera = new THREE.PerspectiveCamera(cameraFov, sizes.width/sizes.height) // FOV, aspect ratio
scene.add(camera)

/**
 * ========================================
 * POST-PROCESSING CONFIGURATION
 * ========================================
 */
const unrealBloomPass = new UnrealBloomPass()
unrealBloomPass.strength = 0.5
unrealBloomPass.radius = 0.5
unrealBloomPass.threshold = 0.8

const filmPass = new FilmPass(
  0.2,  // noise intensity
)

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

/**
 * ========================================
 * SCENE AND ENVIRONMENT SETUP
 * ========================================
 */
const canvas = document.querySelector('canvas#maincanvas')
const rgbeLoader = new RGBELoader(loadingManager)
rgbeLoader.load('/environmentmaps/hdrs/puresky-4k.hdr', (hdrEnvMap) => {
  hdrEnvMap.mapping = THREE.EquirectangularReflectionMapping
scene.background = hdrEnvMap
scene.environment = hdrEnvMap

})
// scene.backgroundBlurriness = 0.05


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
 * ANIMATED MODEL SETUP
 * ========================================
 */
let birdModelMixer = null
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.load('/models/bird-gltf/scene.gltf', (model) => {
  birdModel = model.scene
  birdModelMixer = new THREE.AnimationMixer(birdModel)
  const birdAnimFlyOne = birdModelMixer.clipAction(model.animations[0])
  birdAnimFlyOne.play()
  
  birdModel.position.y = -1
  scene.add(birdModel)
}, undefined, function ( error ) { // undefined skips the onProgress function.
  console.error( error );
} )


/**
 * ========================================
 * AUDIO SETUP
 * ========================================
 */

// const listener = new THREE.AudioListener()
// camera.add(listener)

// const music = new THREE.Audio(listener)

// // load a sound and set it as the Audio object's buffer
// const audioLoader = new THREE.AudioLoader();
// audioLoader.load( '/musicsfx/acidBuddha.ogg', function( buffer ) {
// 	music.setBuffer( buffer );
// 	music.setLoop( true );
// 	music.setVolume( 0.5 );
// 	music.play();
// });

/**
 * ========================================
 * CAMERA EFFECTS CONFIGURATION
 * ========================================
 */

// Debug helper
const axesHelper = new THREE.AxesHelper(5);
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
renderer.shadowMap.autoUpdate = false
renderer.render(scene, camera)

/**
 * ========================================
 * CLOUD SHADER SYSTEM
 * ========================================
 */
const cloudParticleCount = 50;
const cloudParticles = [];
const cloudTexture = new THREE.TextureLoader(loadingManager).load('/textures/clouds/cloud3.png')
cloudTexture.minFilter = THREE.LinearFilter
cloudTexture.magFilter = THREE.LinearFilter
cloudTexture.format = THREE.RGBAFormat
cloudTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

// Cloud material using a custom shader
const cloudMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uTime: { value: 0.0 },
    uTexture: { value: cloudTexture }
  },
  vertexShader: `
    varying vec2 vUv;
    uniform float uTime;
    
    void main() {
      vUv = uv;
      
      // Add subtle vertex movement
      vec3 pos = position;
      pos.y += sin(pos.z * 0.05 + uTime * 0.2) * 0.2;
      pos.x += cos(pos.z * 0.05 + uTime * 0.1) * 0.1;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uTime;
    
    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      
      // Add soft edge fading
      float alpha = texColor.a;
      alpha *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, vUv.y);
      alpha *= smoothstep(0.0, 0.2, 1.0 - vUv.x) * smoothstep(0.0, 0.2, 1.0 - vUv.y) * 0.3;
      
      // Soft pulsing opacity
      alpha *= 0.8 + 0.2 * sin(uTime * 0.2 + vUv.x * vUv.y * 5.0);
      
      gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
    }
  `,
  side: THREE.DoubleSide,
  depthWrite: false
});

// Create cloud particles
function createCloudParticles() {
  for (let i = 0; i < cloudParticleCount; i++) {
    // Create a new geometry for each cloud with different dimensions
    const cloudGeometry = new THREE.PlaneGeometry(
      10 + Math.random() * 10,  // Width between 5 and 15
      6 + Math.random() * 5    // Height between 3 and 8
    );
    
    
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    
    // Distribute clouds in 3D space
    // Wide spread on X, moderate height on Y, deep distribution on Z
    cloud.position.set(
      (Math.random() - 0.5) * 40,    // X: -20 to 20
      Math.random() * 10,        // Y: 5 to 15 (above the bird)
      (Math.random() - 0.2) * 100    // Z: mostly ahead of the bird (-20 to 80)
    );
    
    // Slight random rotation for variety
    cloud.rotation.z = Math.random() * Math.PI * 0.1;
    
    // Set custom speed property to make each cloud move at different speeds
    cloud.speed = 0.5 + Math.random() * 1.5;
    
    // Add to scene and store in our array
    scene.add(cloud);
    cloudParticles.push(cloud);
  }
}

// Call the function to create clouds
createCloudParticles();

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
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set( 0, 1, -3);
controls.update();
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
// effectComposer.addPass(unrealBloomPass)
// effectComposer.addPass(bokehPass)
effectComposer.addPass(filmPass)

/**
 * ========================================
 * PERLIN NOISE IMPLEMENTATION
 * ========================================
 */
// Simple Perlin noise implementation
const perlin = {
  // Permutation table
  p: new Array(512),
  
  // Initialize permutation table with random values
  init: function() {
    for(let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(Math.random() * 256);
    }
    
    // Duplicate to avoid overflow
    for(let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i];
    }
  },
  
  // Get noise value at position (x, y)
  noise: function(x, y = 0) {
    // Find unit cube containing the point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    // Get relative position within cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);
    
    // Hash coordinates
    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;
    
    // Blend noise from 4 corners
    return this.lerp(
      v,
      this.lerp(
        u, 
        this.grad(this.p[A], x, y),
        this.grad(this.p[B], x - 1, y)
      ),
      this.lerp(
        u,
        this.grad(this.p[A + 1], x, y - 1),
        this.grad(this.p[B + 1], x - 1, y - 1)
      )
    );
  },
  
  // Fade function
  fade: function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  },
  
  // Linear interpolation
  lerp: function(t, a, b) {
    return a + t * (b - a);
  },
  
  // Gradient function
  grad: function(hash, x, y) {
    // Convert low 4 bits of hash to 12 gradient directions
    const h = hash & 15;
    const grad = 1 + (h & 7); // 1, 2, ..., 8
    
    // 8 discrete directional derivatives
    if (h & 8) return -grad * x;
    return grad * x;
  }
};

// Initialize the Perlin noise
perlin.init();

/**
 * ========================================
 * ANIMATION LOOP
 * ========================================
 */
let mainClock = new THREE.Clock
let previousTime = 0.0
function animate(){
  requestAnimationFrame(animate);
  const elapsedTime = mainClock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime
  
  // Update cloud shader uniform
  cloudMaterial.uniforms.uTime.value = elapsedTime * 1.2;
  
  // Animate cloud particles
  cloudParticles.forEach(cloud => {
    // Move clouds in negative Z direction (toward the camera)
    cloudParticles.y = 0.0
    cloud.position.z -= cloud.speed * deltaTime;
    
    // When a cloud passes beyond the camera, reset its position far ahead
    if (cloud.position.z < camera.position.z - 10) {
      cloud.position.z = camera.position.z + 20 + Math.random() * 20;
      cloud.position.x = (Math.random() - 0.5) * 40;
      cloud.position.y = Math.random() * 10;
    }
  });
  
  // Disable orbit controls when we have the bird model
  if (birdModel) {
    controls.enabled = false;

    // Use Perlin noise for camera movement
    const noiseScale = 0.3; // Controls how fast the noise pattern changes
    const noiseAmplitude = 0.4; // Controls how much the camera moves
    
    // Get noise values for X and Y offsets
    const cameraOffsetX = perlin.noise(elapsedTime * noiseScale) * noiseAmplitude;
    const cameraOffsetY = perlin.noise(elapsedTime * noiseScale + 100) * noiseAmplitude;
    
    // Position camera behind and slightly above the bird, with Perlin noise offsets
    camera.position.x = birdModel.position.x + cameraOffsetX;
    camera.position.y = birdModel.position.y + 3.0 + cameraOffsetY;
    camera.position.z = birdModel.position.z - 5;
    
    const lookAheadDistance = 8.0
    const cameraTargetPoint = new THREE.Vector3(
      birdModel.position.x + cameraOffsetX * 0.5, // Add slight offset to look direction too
      birdModel.position.y + cameraOffsetY * 0.5,
      birdModel.position.z + lookAheadDistance 
    )
    camera.lookAt(cameraTargetPoint);
  } else {
    controls.update();
  }

  // Animation mixer
  if(birdModelMixer != null){
    birdModelMixer.update(deltaTime)
  }
  
  // Render the scene
  effectComposer.render()
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