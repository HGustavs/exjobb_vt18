var scene = new THREE.Scene();

var width = 150;
var height = 150;
var near = 0;
var far = 5;
var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, near, far );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Variables for timing the rendering
var start;
var stop;
var result; // The difference between start and stop

// Timer. Calculate the rendering time
function timer(time) {
    if (time == start) {
        start = Date.now();
    } else if (time == stop) {
        stop = Date.now();
        result = stop - start;
        console.log(result);
    } else {
        console.log("Timer was not set correctly");
    }
};

// Get the data from the json file
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var jsonData = JSON.parse(this.responseText);
       
        var newLat;
        var newLong;
        var dotQuantity = 0;

        // Creating a dot
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3( 0, 0, 0));
        var dotMaterial = new THREE.PointsMaterial( { size: 1, sizeAttenuation: false } );
        function createDot() {
            var dot = new THREE.Points( dotGeometry, dotMaterial );

            newCoordinates();
            dot.position.x = newLat;
            dot.position.y = newLong;
            scene.add( dot );
        };

        function newCoordinates(){
            var latCoordinate = jsonData[dotQuantity]["Provets latitud (DD)"];
            var longCoordinate = jsonData[dotQuantity]["Provets longitud (DD)"];
            newLat = latCoordinate.replace(",","."); // Replace any commas with a dot to be able to render the coordinate
            newLong = longCoordinate.replace(",",".");
        };

        var animate = function () {
            requestAnimationFrame( animate );
            for(dotQuantity; dotQuantity < jsonData.length; dotQuantity++){
                createDot();
            };
            renderer.render(scene, camera);
        };

        console.log(jsonData.length)
        timer(start); // Start animation render timer
        animate();
        timer(stop); // Stop and calculate the animation render time
    };
};
xmlhttp.open("GET", "../Dataset/testData.json", true);
xmlhttp.send();
