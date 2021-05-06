const scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry( 1, 1 ,1 );

const material = new THREE.MeshBasicMaterial({color: 0xff0000 });

//actual object 
// geometry and material must be provided in this order
// kinda like skeleton and muscles
const mesh = new THREE.Mesh(geometry, material);

//add object to the scene, still not visible beacause no camera === no sight
scene.add( mesh );


//sizes
const sizes ={
    width: 800,
    height: 600
}

//camera
//vertical FOV usually 45/555 degrees, now 75 to see more laterally
//RATIO = width/height
const camera = new THREE.PerspectiveCamera( 75, sizes.width/sizes.height );

//move the camera toward us on outside the cube
camera.position.z = 3; 

scene.add( camera );


//rederer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector(".canvas")
})

//resize renderer
renderer.setSize(sizes.width,sizes.height);

//render scene with the camera
renderer.render(scene, camera);
