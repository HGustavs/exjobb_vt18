'use strict';
var scene = new THREE.Scene();

var width = 600;
var height = 600;
var near = 0;
var far = 5;
var camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, near, far);

var renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(600, 600);
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
        
        // Save rendering time
        var renderedTimes = [];
        var getTimes;
        if(Array.isArray(JSON.parse(localStorage.getItem("time")))) {
            getTimes = JSON.parse(localStorage.getItem("time"));
            renderedTimes = renderedTimes.concat(getTimes);
        }
        renderedTimes.push(result);
        localStorage.setItem("time", JSON.stringify(renderedTimes));
        
        console.log(JSON.parse(localStorage.getItem("time")));
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
        var dotCoord = {};

        var dotQuantity = 0;

        // Source coordinates will be in Longitude/Latitude, WGS84
        var source = new proj4('EPSG:4326');

        // Destination coordinates in meters, global spherical mercators projection
        var dest = new proj4('EPSG:3785');

        function prepareCoordinates() {
            for(dotQuantity; dotQuantity < 50000; dotQuantity++){ 
                var coords = newCoordinate();
                var point = convertLatlon(coords.lat, coords.lon);
                point.value = coords.value;
                addID(point);
            }
        };

        function newCoordinate(){
            // Replace any commas with a dot to be able to render the coordinate
                var lat = jsonData[dotQuantity]["Latitude [degrees_north]"];
                var lon = jsonData[dotQuantity]["Longitude [degrees_east]"];
                var measurementValue = jsonData[dotQuantity]["PSAL [psu]"];
                // Makes value to a number if it is a string
                if(typeof measurementValue == "string"){
                    measurementValue = Number(jsonData[dotQuantity]["PSAL [psu]"]);
                }
                return {lat: lat, lon: lon, value: measurementValue};  
        };
        
        // Returns a point with x and y coordinates in meters
        function convertLatlon(lat, lon) {
            var point = proj4.toPoint([lon, lat, 0.0]);

            return proj4.transform(source.oProj, dest.oProj, point); 
        }

        function addID(point) { // Adds the coordinates and a value to an array
            var id = ((point.x + point.y) % jsonData.length) + "";
            var value = point.value; 
            // x and y coordinates in 10km instead of meters
            var x = point.x / 10000;
            var y = point.y / 10000;

            // Move the coordinates closer to origo
            var movedX = x - 30;
            var movedY = y - 780;

            // If coordinates has property of id, average the value 
            if(coordinates[id]) {
                coordinates[id].value = (value + coordinates[id].value) / 2;
            } else {
                // Create new coordinate
                coordinates[id] = {value : value, x : movedX, y : movedY};
            }
        };

        function dotSystem(){
            var canWidth = 300;
            var canHeight = 300;
            var gridSize = 4;

            for(var id in coordinates) {
                for(var x = -canWidth; x < canWidth; x += gridSize) {
                    for(var y = -canHeight; y < canHeight; y += gridSize) {
                        if(x <= coordinates[id].x && x + gridSize >= coordinates[id].x && y <= coordinates[id].y && y + gridSize >= coordinates[id].y) {
                            var dotID = x * y;
                            var value = coordinates[id].value;

                            if(dotCoord[dotID]) { // Make a average of the new and old value for every new value
                                dotCoord[dotID].value = (value + dotCoord[dotID].value) / 2;
                            } else { // To get a more accurate x and y coordinate, half of the gridSize is added
                                dotCoord[dotID] = {value : value, x : x + (gridSize/2), y : y + (gridSize/2)};
                            }
                        }
                    }
                }
            }
            createDot();

            console.log(dotCoord);
            console.log('NumberOfDotCoords: ' + Object.keys(dotCoord).length);
        };

        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3( 0, 0, 0));
        function createDot(){
            // Loop through all values and return the number with the highest value
            var max = 0;
            for(var i in dotCoord) {
                max = Math.max(dotCoord[i].value, max);
            }

            // Loop through all values and apply RGBA colors
            for(var id in dotCoord) {
                // Convert the value to rgba colors
                var rgba = value2rgba(dotCoord[id].value / max);

                var dotMaterial = new THREE.PointsMaterial({size: 4, sizeAttenuation: false, transparent: true});
                var dot = new THREE.Points(dotGeometry, dotMaterial);
                dot.material.color.setRGB(rgba[0], rgba[1], rgba[2]);
                // dot.material.opacity = rgba[3]; // Sets the opacity
                
                dot.position.x = dotCoord[id].x;
                dot.position.y = dotCoord[id].y;
                scene.add(dot);
            }
        }

        function value2rgba(value) {
            // define rgb variables
            var r, g, b;
            var h = 1 - value;
            var l = 1 - value * 0.55;
            // convert hue to rgb
            function hue2rgb(p, q, t) {
                if(t < 0) t++;
                if(t > 1) t--;
                if(t < 1 / 6) return p + (q - p) * 6 * t;
                if(t < 1 / 2) return q;
                if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
                }
            // ternary operator
            var q = l < 0.5 ? l * 2 : l + 1 - l;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
            // return RGBA
            return [r, g, b, value];
        }

        function animate() {
            prepareCoordinates();
            dotSystem();

            console.log(coordinates);
            console.log('NumberOfCoords: ' + Object.keys(coordinates).length);

            timer(start); // Start animation render timer
            renderer.render(scene, camera); // Render the scene with all the circles that been added
            timer(stop); // Stop and calculate the animation render time
        };

        console.log('DataLength: ' + jsonData.length)
        
        // Runs the script again to collect a certain amount of data
        if(localStorage.getItem("time") != null){
            if(JSON.parse(localStorage.getItem("time")).length < 10) {
                animate();
                location.reload();
            } else {
                console.log(JSON.parse(localStorage.getItem("time")));
            }
        } else {
            animate();
            location.reload();
        }
        
    };
};
xmlhttp.open("GET", "../Dataset/icesData.json", true);
xmlhttp.send();
