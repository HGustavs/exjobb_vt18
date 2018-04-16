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
var result; // The time difference between start and stop

// Timer. Calculate the rendering time
function timer(time) {
    if (time == start) {
        start = Date.now();
    } else if (time == stop) {
        stop = Date.now();
        result = stop - start;

        // Save rendering times
        var renderTimes = [];
        var getTimes = localStorage.getItem("time");
        renderTimes.push(getTimes, result);
        localStorage.setItem("time", renderTimes);
        console.log(renderTimes);
    } else {
        console.log("Timer was not set correctly");
    }
};

// Get the data from the json file
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var jsonData = JSON.parse(this.responseText);
        
        // Objects to hold coordinates and relevant values
        var coordinates = {}; 
        var values = {};

        // When finished is true, render() is run
        var startRender = true;
        var dotQuantity = 0;

        // Source coordinates will be in Longitude/Latitude, WGS84
        var source = new proj4('EPSG:4326');

        // Destination coordinates in meters, global spherical mercators projection
        var dest = new proj4('EPSG:3785');

        function prepareCoordinates() {
            for(dotQuantity; dotQuantity < jsonData.length; dotQuantity++){
                var coords = newCoordinate();
                var point = convertLatLon(coords.lat, coords.lon);
                addID(point);
            }
        };

        function newCoordinate(){
            // Replace any commas with a dot to be able to render the coordinate
            var lat = jsonData[dotQuantity]["Provets latitud (DD)"].replace(",",".");
            var lon = jsonData[dotQuantity]["Provets longitud (DD)"].replace(",",".");
            return {lat: lat, lon: lon};
        };
        
        // Returns a point with x and y coordinates in meters
        function convertLatLon(lat, lon) {
            var point = proj4.toPoint([lon, lat, 0.0]);
            return proj4.transform(source.oProj, dest.oProj, point); 
        }

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
                coordinates[id].radius += 0.03;
            } else {
                // Create new coordinate
                coordinates[id] = {radius : 0.03, x : movedX, y : movedY};
            }
        };

        function render(){
            for(var id in coordinates) {
                var radius = coordinates[id].radius;

                // Retrieve the x and y coordinate
                var xpoint = coordinates[id].x;
                var ypoint = coordinates[id].y;

                // If x are within the radius, run loop
                for(var x = xpoint - radius; x < xpoint + radius; x++) {
                    for(var y = ypoint - radius; y < ypoint + radius; y++) {
                        var distance = Math.sqrt(Math.pow((x - xpoint), 2) + Math.pow((y - ypoint), 2));
                        if(distance > radius) {
                            continue;
                        } else {
                            var value = radius - 1 * distance;
                            // Set an ID for the coordinate
                            var id = ((x + y) % jsonData.length) + "";
                            // If coordinates has property of id, add value
                            if(values[id]) {
                                values[id].value += value;
                            } else {
                                // Creates a new value
                                values[id] = {value : value, x : x, y : y};
                            }
                        }
                    }
                }
            }
        };

        function createCircle() {
            for(var id in values) {
                var radius = values[id].value * 0.1;
                var geometry = new THREE.CircleGeometry(radius, 32);
                var material = new THREE.MeshBasicMaterial({color: 0xdd3333, transparent: true, opacity: 0.2});
                var circle = new THREE.Mesh(geometry, material);

                // Retrieve the x and y coordinate and set circle position
                circle.position.x = values[id].x;
                circle.position.y = values[id].y;
                scene.add(circle);
            }
        };
        
        var animate = function () {
            requestAnimationFrame(animate);

            if(startRender == true) {
                prepareCoordinates();
                render();
                
                timer(start); // Start animation render timer
                createCircle();
                timer(stop); // Stop and calculate the animation render time
                startRender = false;
            }

            renderer.render(scene, camera);
        };

        console.log("DataLength: " + jsonData.length)
        animate();
        console.log(localStorage.getItem("time").length);
        // Sets a limit on how much data should be collected
        if(localStorage.getItem("time").length < 3000){
            location.reload();
        }
        
    };
};
xmlhttp.open("GET", "../Dataset/15000rows.json", true);
xmlhttp.send();
