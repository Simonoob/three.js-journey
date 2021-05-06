import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import CANNON, { World } from 'cannon'

/**
 * Debug
 */
const gui = new dat.GUI()

const debugObject = {}

debugObject.createSphere = () => createSphere(
    Math.random() * 0.5,
    {
        x: (Math.random() - 0.5) * 3,
        y: 3 + Math.random() * 3,
        z:(Math.random() - 0.5) * 3,
    })

debugObject.createBox = () => createBox(
    Math.random(),
    Math.random(),
    Math.random(),
    {
        x: (Math.random() - 0.5) * 3,
        y: 3 + Math.random() * 3,
        z:(Math.random() - 0.5) * 3,
    })

debugObject.clear = () => {
    objectsToUpdate.forEach(
    object => { 
        //remove physics and sound
        object.body.removeEventListener('collide', playHitSound)
        physicsWorld.removeBody(object.body)

        //remove mesh
        scene.remove(object.mesh)

        //remove from array to update

    })
    objectsToUpdate.length = 0
}
debugObject.autoBoxes = () => autoBoxes = !autoBoxes
debugObject.autoSpheres = () => autoSpheres = !autoSpheres

gui.add(debugObject, 'createSphere')
gui.add(debugObject, 'createBox')
gui.add(debugObject, 'autoSpheres')
gui.add(debugObject, 'autoBoxes')
gui.add(debugObject, 'clear')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

//
//*physics world
//

//init
const physicsWorld = new CANNON.World()
physicsWorld.gravity.set(0, -9.82, 0)
//*performance
physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld)
physicsWorld.allowSleep = true

//sounds
const hitSound = new Audio('sounds/hit.mp3')
let lastHit = 0

const playHitSound = (collision) =>{ 
    const impactStrength = collision.contact.getImpactVelocityAlongNormal()
    const currentTime = clock.getElapsedTime()
    if((currentTime - lastHit) < 0.01) {
        lastHit = clock.getElapsedTime()
        return
    }
    lastHit = clock.getElapsedTime()
    // console.log(collision.contact)
    if (impactStrength < 1) return
    const distance = camera.position.distanceTo(collision.target.position)
    hitSound.currentTime = 0
    const impactVolume = impactStrength > 10 ? 1 : impactStrength/10
    const distanceVolume = distance > 15 ? 1 : distance/15
    hitSound.volume = (impactVolume - distanceVolume) < 0 ? 0 : (impactVolume - distanceVolume)
    hitSound.play()
}

//materials referencese
const defaultMaterial = new CANNON.Material('default')

//contact materials

const defaultContact = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)

physicsWorld.addContactMaterial(defaultContact)
physicsWorld.defaultContactMaterial = defaultContact

// //create shape
// const sphereShape =  new CANNON.Sphere(0.5)

// //create body
// const sphereBody = new CANNON.Body({
//     mass:1,
//     position: new CANNON.Vec3(0,3,0),
//     shape: sphereShape,
// })

// sphereBody.applyLocalForce(new CANNON.Vec3(150,0,0), new CANNON.Vec3(0,0,0))

// //add body to the world
// physicsWorld.addBody(sphereBody)


//add floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()

floorBody.mass = 0
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0), Math.PI/2)
floorBody.addShape(floorShape)

physicsWorld.addBody(floorBody)


// /**
//  * Test sphere
//  */
// const sphere = new THREE.Mesh(
//     new THREE.SphereGeometry(0.5, 32, 32),
//     new THREE.MeshStandardMaterial({
//         metalness: 0.3,
//         roughness: 0.4,
//         envMap: environmentMapTexture
//     })
// )
// sphere.castShadow = true
// sphere.position.y = 0.5
// scene.add(sphere)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 3, 3, 7)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//*utils

const objectsToUpdate = []


//sphereGenerator
const sphereGeometry = new THREE.SphereBufferGeometry(1, 20,20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
})

const createSphere = (radius, positon) =>{
    //three.js mesh
    const mesh =  new THREE.Mesh(sphereGeometry, sphereMaterial) 
    mesh.scale.set(radius, radius, radius)
    mesh.castShadow = true
    mesh.position.copy(positon)
    scene.add(mesh)

    // cannon.js body
    const shape = new CANNON.Sphere(radius)
    const body = new CANNON.Body({
        mass:1,
        position: new CANNON.Vec3(0,3,0),
        shape,
    }) 
    body.position.copy(positon)
    physicsWorld.addBody(body)

    body.addEventListener('collide', playHitSound)

    //save in objects to update
    objectsToUpdate.push({
        mesh,
        body
    })
}


//boxGenerator
const boxGeometry = new THREE.BoxBufferGeometry(1, 1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
})

const createBox = (width, height, depth, positon) =>{
    //three.js mesh
    const mesh =  new THREE.Mesh(boxGeometry, boxMaterial) 
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.position.copy(positon)
    scene.add(mesh)

    // cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width/2,height/2,depth/2))
    const body = new CANNON.Body({
        mass:1,
        position: new CANNON.Vec3(0,3,0),
        shape,
    }) 
    body.position.copy(positon)
    physicsWorld.addBody(body)

    body.addEventListener('collide', playHitSound)

    //save in objects to update
    objectsToUpdate.push({
        mesh,
        body
    })
}

let autoBoxes = false
let autoSpheres = false

createSphere(0.5, {x: 0.2, y: 2, z: 0.2})
createBox(0.5, 0.5, 0.5, {x: -0.2, y: 3, z: -0.2})

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    //add forces
    // sphereBody.applyForce(new CANNON.Vec3(-0.5,0,0), sphereBody.position)

    //update physicsWorld
    physicsWorld.step(
        //framerate
        1/60,
        //time from last update/tick
        deltaTime,
        //buffer to catch up in case of delay
        3
    )
    if(autoBoxes) createBox(
        Math.random(),
        Math.random(),
        Math.random(),
        {
            x: (Math.random() - 0.5) * 3,
            y: 3 + Math.random() * 3,
            z:(Math.random() - 0.5) * 3,
        })

    if(autoSpheres) createSphere(
        Math.random() * 0.5,
        {
            x: (Math.random() - 0.5) * 3,
            y: 3 + Math.random() * 3,
            z:(Math.random() - 0.5) * 3,
        })
    //update scene objects
    objectsToUpdate.forEach(object=> {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
    })

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()