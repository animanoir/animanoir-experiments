console.log("melodyBird.js running...")
console.info("Bird model by: https://sketchfab.com/3d-models/bird-animations-alex-081fa7f0cfd649b9b07babb4c619acc7")

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'
// import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'
import gsap from 'gsap';
import GUI from 'lil-gui';
import * as Tone from "tone"
// import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/Addons.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * ========================================
 * MAIN MOTHERFUCKING SCENE
 * ========================================
 */
const scene = new THREE.Scene();


/**
 * ========================================
 * FETCHING & 3D TEXT SYSTEM
 * ========================================
 */

let globalFont
const fontLoader = new FontLoader()
fontLoader.load(
  '/font/Roboto_Regular.json', 
  (font) => {
    globalFont = font
  },
  // Optional progress callback
  (xhr) => {
    // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
  },
  // Optional error callback
  (error) => {
    console.error('Font loading error:', error)
  }
)

let thoughtsArray = [];
let isDataFetched = false;

const fetchArenaData = async (channel) => {
  // If we've already fetched data, don't fetch again
  if (isDataFetched) {
    return Promise.resolve(thoughtsArray);
  }
  
  return fetch(`https://api.are.na/v2/channels/${channel}/contents?per=10&sort=position&direction=desc`)
    .then(response => {
      if (!response.ok) {
        throw new Error('There was an error fetching from Are.na.');
      }
      return response.json();
    })
    .then(data => {
      const { contents } = data;
      thoughtsArray = contents;
      isDataFetched = true;
      console.info("Arena data fetched:", thoughtsArray);
      return contents;
    })
    .catch(error => {
      console.error('Error fetching thoughtsArray from Are.na:', error);
      // Use fallback data in case of error
      thoughtsArray = [
        { content: "What if, but for eternity?" },
        { content: "Vanishing life..." },
        { content: "I miss you so, so much..." },
        { content: "One is the distance between the words" },
        { content: "A path is made by flying on it" },
        { content: "Wandering far & unfettered!" }
      ];
      isDataFetched = true;
      return thoughtsArray;
    });
}

// Initialize the application only after data is fetched
function initializeAfterDataFetch() {
  fetchArenaData('feed-the-melody-bird')
    .then(() => {
      // Now that we have data, create the first text
      createNewText();
      // Continue with the rest of your initialization if needed
    });
}

// Call this function to start the initialization process
initializeAfterDataFetch();

// Store the text mesh globally so we can access it in the animation loop
let currentTextMesh = null;
let randomThoughtSpeedTowardsCamera = 3.0;

function createNewText() {
  // Check if we have thoughtsArray
  if (!isDataFetched || !thoughtsArray || thoughtsArray.length === 0) {
    console.log("No data available yet, waiting...");
    return; // Exit if data isn't available
  }
  
  // If font is already loaded, create text immediately
  if (globalFont) {
    createTextWithLoadedFont(thoughtsArray);
  } else {
    // If font is not loaded yet, wait for it
    console.log("Font not loaded yet. Waiting...");
    const checkFontInterval = setInterval(() => {
      if (globalFont) {
        console.log("Font now loaded, creating text");
        clearInterval(checkFontInterval);
        createTextWithLoadedFont(thoughtsArray);
      }
    }, 100);
    
    // Also set a timeout to prevent infinite checking
    setTimeout(() => {
      clearInterval(checkFontInterval);
      console.error("Font loading timed out");
    }, 5000);
  }
}

// Helper function to create text once the font is loaded
function createTextWithLoadedFont(thoughtsArray) {
  // Choose a random text from the available thoughtsArray
  const randomIndex = Math.floor(Math.random() * thoughtsArray.length);
  const selectedText = thoughtsArray[randomIndex];
  
  if (selectedText && selectedText.content) {
    console.log("Selected text: "+selectedText.content)
    // Create text geometry
    const textGeometry = new TextGeometry(selectedText.content, {
      font: globalFont,
      size: 0.3,
      height: 0.1,
      depth: 0.1
    });
    
    // Center the text geometry
    textGeometry.computeBoundingBox();
    textGeometry.center();
    // Create a material for the text with fade-in effect
    const textMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000,
      metalness: 0.0,
      roughness: 1.0,
      transparent: false,
      opacity: 0.0 // Start transparent for fade-in effect
    });
    
    // Create a mesh with the geometry and material
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.scale.x = -1.0;
    
    // Position the text far ahead of the camera
    // textMesh.position.set(
    //   0, // Centered horizontally
    //   birdModel ? birdModel.position.y + 2 : 2, // Slightly above the bird
    //   camera.position.z + 40 // Start far ahead
    // );

    textMesh.position.set(Math.random() * 2.0,Math.random() * 5.0,20)

    
    // Remove the previous text if it exists
    if (currentTextMesh) {
      scene.remove(currentTextMesh);
    }
    
    // Store the new text mesh globally
    currentTextMesh = textMesh;
    
    // Add the mesh to the scene
    scene.add(textMesh);
    
    // Fade in the text
    gsap.to(textMesh.material, {
      opacity: 1.0,
      duration: 5.0
    });
  }
}

let musicPlaybackRate = 1.0
let isMusicOn = true
let birdModel;
let cameraFov = 75

// Define movement variables at the top level of your script
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
const maxSpeed = 5.0; 
const maxXDistance = 5; // Maximum distance from center
const acceleration = 3.0
const decceleration = 5.0

// Add these variables at the top level with your other camera variables
let cameraOffsetXTarget = 0;
let cameraOffsetZTarget = 0;
let currentCameraOffsetX = 0;
let currentCameraOffsetZ = 0;
const cameraFollowSpeed = 0.5; // How quickly the camera follows the bird's X movement
const maxCameraXOffset = 0.8;  // Maximum camera offset in X direction

// Add these variables at the top level with your other movement variables
const maxRollAngle = 0.8;
let targetRollAngle = 0; // Target roll angle that changes based on movement

// Add these variables at the top level of your script
let currentVelocityY = 0.0; // Initialize vertical velocity
const maxYDistance = 8; // Maximum distance up/down from center

// At the top level, add a variable for pitch-based roll
const maxPitchRollAngle = 0.2; // Maximum roll angle from pitch (climbing/diving)
let targetPitchRollAngle = 0;

/**
 * ========================================
 * GUI
 * ========================================
*/

const gui = new GUI({title: "Melody Bird (WIP)", width: 250});
const guiParameters = {
  openWebsite: function() {
    window.open('https://www.animanoir.xyz/', '_blank');
  },
  openMoreExperimentsWebsite: function() {
    window.open('https://animanoir-experiments.netlify.app/', '_blank');
  },
  isMusicOn: true,
  controls: "Move: WASD keys"
}

gui.add(guiParameters, 'openMoreExperimentsWebsite').name('+ experiments here')
gui.add(guiParameters, 'openWebsite').name('by animanoir.xyz')
gui.add(guiParameters, 'controls').name('Controls:').disable()
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
 * UTILITY FUNCTIONS
 * ========================================
 */
function getPixelRatio(){
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
 * LIGHTING CONFIGURATION
 * ========================================
 */
// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);


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
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);


/**
 * ========================================
 * RENDERER SETUP
 * ========================================
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  toneMapping: THREE.AgXToneMapping,
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
    uTexture: { value: cloudTexture },
    uAlphaFactor: {value: 0.3}
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
    uniform float uAlphaFactor;
    
    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      float alphaFactor = 0.3;
      
      // Add soft edge fading
      float alpha = texColor.a;
      alpha *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, vUv.y);
      alpha *= smoothstep(0.0, 0.2, 1.0 - vUv.x) * smoothstep(0.0, 0.2, 1.0 - vUv.y) * uAlphaFactor;
      
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
      10 + Math.random() * 10,
      6 + Math.random() * 5
    );
    
    // Create a unique material for each cloud
    const individualCloudMaterial = cloudMaterial.clone();
    // Each material has its own set of uniforms
    individualCloudMaterial.uniforms = {
      uTime: { value: 0.0 },
      uTexture: { value: cloudTexture },
      uAlphaFactor: { value: 0.3 }
    };
    
    const cloud = new THREE.Mesh(cloudGeometry, individualCloudMaterial);
    
    // Store the material directly on the cloud object for easy access
    cloud.cloudMaterial = individualCloudMaterial;
    
    // Position, rotation, speed setup...
    cloud.position.set(
      (Math.random() - 0.5) * 40,
      Math.random() * 10,
      (Math.random() - 0.2) * 100
    );
    cloud.rotation.z = Math.random() * Math.PI * 0.1;
    cloud.speed = 0.5 + Math.random() * 1.5;
    
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
// const controls = new OrbitControls(camera, renderer.domElement);
// camera.position.set( 0, 1, -3);
// controls.update();
/**
 * ========================================
 * POST-PROCESSING SETUP
 * ========================================
 */
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(getPixelRatio())
const renderPass = new RenderPass(scene, camera)
let fxaaPass = new ShaderPass( FXAAShader );
const filmPass = new FilmPass(
  0.2,  // noise intensity
)

effectComposer.addPass(fxaaPass)
effectComposer.addPass(renderPass)
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
let currentVelocityX = 0.0;

function animate(){
  requestAnimationFrame(animate);
  const elapsedTime = mainClock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;
  
  // Handle bird movement inside the animation loop with smooth acceleration
  if(birdModel) {
    // Calculate target velocity based on input
    let targetVelocityX = 0;
    let targetVelocityY = 0;
    
    if(moveLeft && birdModel.position.x < maxXDistance) {
      targetVelocityX = maxSpeed;
      targetRollAngle = -maxRollAngle;
    } else if(moveRight && birdModel.position.x > -maxXDistance) {
      targetVelocityX = -maxSpeed;
      targetRollAngle = maxRollAngle;
    } else {
      targetRollAngle = 0;
    }
    
    // Add vertical movement targets
    if(moveUp && birdModel.position.y < maxYDistance) {
      targetVelocityY = maxSpeed * 0.7; // Slightly slower vertical movement
      targetPitchRollAngle = maxPitchRollAngle; // Roll slightly when climbing
    } else if(moveDown && birdModel.position.y > -maxYDistance/2) { // Less distance downward
      targetVelocityY = -maxSpeed * 0.7;
      targetPitchRollAngle = -maxPitchRollAngle; // Roll slightly in the opposite direction when diving
    } else {
      targetPitchRollAngle = 0;
    }

    // Smoothly interpolate current X velocity
    if(targetVelocityX !== 0) {
      currentVelocityX = THREE.MathUtils.lerp(
        currentVelocityX,
        targetVelocityX,
        acceleration * deltaTime
      );
    } else {
      currentVelocityX = THREE.MathUtils.lerp(
        currentVelocityX,
        0,
        decceleration * deltaTime
      );
    }
    
    // Smoothly interpolate current Y velocity
    if(targetVelocityY !== 0) {
      currentVelocityY = THREE.MathUtils.lerp(
        currentVelocityY,
        targetVelocityY,
        acceleration * deltaTime
      );
    } else {
      currentVelocityY = THREE.MathUtils.lerp(
        currentVelocityY,
        0,
        decceleration * deltaTime
      );
    }
    
    // Apply velocities
    birdModel.position.x += currentVelocityX * deltaTime;
    birdModel.position.y += currentVelocityY * deltaTime;
    
    // Constrain positions within bounds
    birdModel.position.x = THREE.MathUtils.clamp(
      birdModel.position.x, 
      -maxXDistance, 
      maxXDistance
    );
    
    birdModel.position.y = THREE.MathUtils.clamp(
      birdModel.position.y, 
      -maxYDistance/2, 
      maxYDistance
    );
    
    // Add pitch effect (rotation around X axis) when moving up/down
    const targetPitchAngle = currentVelocityY * 0.02; // Scale factor for pitch amount
    birdModel.rotation.x = THREE.MathUtils.lerp(
      birdModel.rotation.x,
      targetPitchAngle,
      4.0 * deltaTime
    );
    
    // Combine the turning roll and the pitch roll for more natural flight
    // The pitch roll is added on top of the existing turning roll
    const combinedRollAngle = targetRollAngle + targetPitchRollAngle;
    
    // Smoother rotation based on velocity rather than input directly
    // This makes the bird lean into turns more naturally
    // const targetRotationZ = -currentVelocityX * 0.2; // Scale factor for rotation amount
    
    // Apply the combined roll angle (from turning and pitch)
    birdModel.rotation.z = THREE.MathUtils.lerp(
      birdModel.rotation.z,
      combinedRollAngle,
      3.0 * deltaTime
    );
  }
  
  // Update cloud shader uniform
  cloudMaterial.uniforms.uTime.value = elapsedTime * 1.2;
  
  // Animate cloud particles
  cloudParticles.forEach(cloud => {
    // Move clouds in negative Z direction (toward the camera)
    cloudParticles.y = 0.0
    cloud.position.z -= cloud.speed * deltaTime;
    
    // When a cloud passes beyond the camera, reset its position far ahead
    if (cloud.position.z < camera.position.z - 10) {
      // Now this will work because cloud.cloudMaterial exists
      gsap.fromTo(cloud.cloudMaterial.uniforms.uAlphaFactor, 
        {value: 0.0}, 
        {value: 0.3, duration: 3}
      );
      
      cloud.position.z = camera.position.z + 20 + Math.random() * 20;
      cloud.position.x = (Math.random() - 0.5) * 40;
      cloud.position.y = Math.random() * 10;
    }
  });
  
  // Disable orbit controls when we have the bird model
  if (birdModel) {
    // controls.enabled = false;

    // Use Perlin noise for camera movement
    const noiseScale = 0.25; 
    const noiseAmplitude = 0.35;
    
    // Get noise values for Y offset only
    const cameraOffsetY = perlin.noise(elapsedTime * noiseScale + 100) * noiseAmplitude;
    
    // Update camera offset target based on movement input
    if (moveLeft) {
      cameraOffsetXTarget = maxCameraXOffset; // Camera moves right as bird moves left
    } else if (moveRight) {
      cameraOffsetXTarget = -maxCameraXOffset; // Camera moves left as bird moves right
    } else {
      cameraOffsetXTarget = 0; // Return to center when no keys pressed
    }
    
    // Smoothly interpolate current camera offset toward target
    currentCameraOffsetX = THREE.MathUtils.lerp(
      currentCameraOffsetX,
      cameraOffsetXTarget,
      deltaTime * cameraFollowSpeed
    );

    currentCameraOffsetZ = THREE.MathUtils.lerp(
      currentCameraOffsetZ,
      cameraOffsetZTarget,
      deltaTime * cameraFollowSpeed
    )
    
    // Fixed camera position with no dependency on bird's X position
    // Only follow the bird in Z direction, keep X at center (0) plus offset
    const lookAheadDistance = 8.0
    const cameraTargetPoint = new THREE.Vector3(
      0, // Fixed X at center
      birdModel.position.y + cameraOffsetY * 0.5,
      birdModel.position.z + lookAheadDistance 
    )
    
    // Position camera with fixed X position (perlin noise + movement-based offset)
    camera.position.x = cameraOffsetY * 0.5 + currentCameraOffsetX; 
    camera.position.y = birdModel.position.y + 2.5 + cameraOffsetY;
    camera.position.z = birdModel.position.z - 5.0 + currentCameraOffsetZ;
    
    camera.lookAt(cameraTargetPoint);
  } 

  camera.rotateZ(Math.PI * Math.sin(elapsedTime * 0.5) * 0.1)
  // Animation mixer
  if(birdModelMixer != null){
    birdModelMixer.update(deltaTime)
  }
  
  // Move the text towards the camera
  if (currentTextMesh) {
    // Move text towards camera
    currentTextMesh.position.z -= randomThoughtSpeedTowardsCamera * deltaTime;

    
    // If the text is behind the camera, create a new one
    if (currentTextMesh.position.z < camera.position.z - 5) {
      createNewText();
    }
  }
  
  // Render the scene
  effectComposer.render()
}

// Update your key handlers to set flags instead of directly moving the bird
document.onkeydown = (e) => {
  if(e.key === "a" || e.key === "A") {
    moveLeft = true;
  } else if(e.key === "d" || e.key === "D") {
    moveRight = true;
  } else if(e.key === "w" || e.key === "W") {
    moveUp = true;
  } else if(e.key === "s" || e.key === "S") {
    moveDown = true;
  }
}

// Add key up handler to stop movement when keys are released
document.onkeyup = (e) => {
  if(e.key === "a" || e.key === "A") {
    moveLeft = false;
  } else if(e.key === "d" || e.key === "D") {
    moveRight = false;
  } else if(e.key === "w" || e.key === "W") {
    moveUp = false;
  } else if(e.key === "s" || e.key === "S") {
    moveDown = false;
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