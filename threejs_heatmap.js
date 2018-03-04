var scene = new THREE.Scene();

var width = 500000;
var height = 500000;
var near = 0;
var far = 5;
var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, near, far );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var start;
var stop;

// Timer. Calculate the rendering time
function timer(time) {
    if (time == start) {
        start = Date.now();
    } else if (time == stop) {
        stop = Date.now();
        var result = stop - start;
        console.log(result);
    } else {
        console.log("Timer was not set correctly");
    }
}

timer(start); // Start animation render timer

// Creating a dot
var dotGeometry = new THREE.Geometry();
dotGeometry.vertices.push(new THREE.Vector3( 0, 0, 0));
var dotMaterial = new THREE.PointsMaterial( { size: 2, sizeAttenuation: false } );
function createDot() {
    var dot = new THREE.Points( dotGeometry, dotMaterial );
    
    dot.position.x = Math.floor(Math.random()*500000) - 250000;
    dot.position.y = Math.floor(Math.random()*500000) - 250000;
    
    scene.add( dot );
}

var numberOfDots = 0;

var animate = function () {
    requestAnimationFrame( animate );
    
    while (numberOfDots < 10000) {
        createDot();
        numberOfDots ++;
    };

    renderer.render(scene, camera);
};

animate();

timer(stop); // Stop and calculate the animation render time