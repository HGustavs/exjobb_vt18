'use strict';
var scene = new THREE.Scene();

var width = 100;
var height = 100;
var near = 0;
var far = 5;
var camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, near, far);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); 

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
        
        // Objects to hold coordinates
        var coordinates = {}; 

        // When finished is true, render() is run
        var finished = false;
        var dotQuantity = 0;

        // Source coordinates will be in Longitude/Latitude, WGS84
        var source = new proj4('EPSG:4326');

        // Destination coordinates in meters, global spherical mercators projection
        var dest = new proj4('EPSG:3785');

        function prepareCoordinates() {
            var coords = newCoordinate();
            var point = convertLatlon(coords.lat, coords.lon);

            addID(point);
        };

        // Returns a point with x and y coordinates in meters
        function convertLatlon(lat, lon) {
            var point = proj4.toPoint([lon, lat, 0.0]);
            return proj4.transform(source.oProj, dest.oProj, point); 
        }

        function newCoordinate(){
            // Replace any commas with a dot to be able to render the coordinate
            var lat = jsonData[dotQuantity]["Provets latitud (DD)"].replace(",",".");
            var lon = jsonData[dotQuantity]["Provets longitud (DD)"].replace(",",".");
            return {lat: lat, lon: lon};
        };
        
        function addID(point) { // Adds the coordinates and a value to an array
            var id = ((point.x + point.y) % jsonData.length) + "";
            var radius = 0;
            // x and y coordinates in 100km instead of meters
            var x = point.x / 100000;
            var y = point.y / 100000;

            // Move the coordinates closer to origo
            var movedX = x - 15;
            var movedY = y - 85;

            // If coordinates has property of id, increase radius
            if(coordinates[id]) {
                coordinates[id].radius += 1;
            } else {
                // Create new coordinate
                coordinates[id] = {radius : 1, x : movedX, y : movedY};
            }
        };

        // Creating a dot
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3( 0, 0, 0));
        var dotMaterial = new THREE.PointsMaterial( { size: 2, sizeAttenuation: false } );
        function createDot() {
            for(var id in coordinates) {
                var dot = new THREE.Points(dotGeometry, dotMaterial);
                
                // Retrieve the x and y coordinate
                var x = coordinates[id].x;
                var y = coordinates[id].y;

                dot.position.x = x;
                dot.position.y = y;
                scene.add(dot);
            }
        };
        
        var animate = function () {
            requestAnimationFrame(animate);
            for(dotQuantity; dotQuantity < jsonData.length; dotQuantity++){
                prepareCoordinates();
            };
            
            if(finished == false) {
                createDot();
                finished = true;
            }

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
