'use strict';
var scene = new THREE.Scene();

var width = 50;
var height = 50;
var near = 0;
var far = 5;
var camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, near, far);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(600, 600);
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
        var values = {};

        var dotQuantity = 0;

        // Source coordinates will be in Longitude/Latitude, WGS84
        var source = new proj4('EPSG:4326');

        // Destination coordinates in meters, global spherical mercators projection
        var dest = new proj4('EPSG:3785');

        function prepareCoordinates() {
            for(dotQuantity; dotQuantity < jsonData.length; dotQuantity++){
                var coords = newCoordinate();
                var point = convertLatLon(coords.lat, coords.lon);
                point.sal = coords.sal;
                addID(point);
            }
        };

        function newCoordinate(){
            // Replace any commas with a dot to be able to render the coordinate
            var lat = jsonData[dotQuantity]["Provets latitud (DD)"].replace(",",".");
            var lon = jsonData[dotQuantity]["Provets longitud (DD)"].replace(",",".");
            var salinity = jsonData[dotQuantity]["M�tv�rde"];
               // Makes salinity to a number if it is a string
               if(typeof salinity == "string"){
                   salinity = Number(jsonData[dotQuantity]["M�tv�rde"].replace(",","."));
               }
               return {lat: lat, lon: lon, sal: salinity};
        };
        
        // Returns a point with x and y coordinates in meters
        function convertLatLon(lat, lon) {
            var point = proj4.toPoint([lon, lat, 0.0]);
            return proj4.transform(source.oProj, dest.oProj, point); 
        }

        function addID(point) { // Adds the coordinates and a value to an array
            var id = ((point.x + point.y) % jsonData.length) + "";
            var radius = point.sal/10;
            // x and y coordinates in 100km instead of meters
            var x = point.x / 100000;
            var y = point.y / 100000;

            // Move the coordinates closer to origo
            var movedX = x - 15;
            var movedY = y - 85;

            // If coordinates has property of id, increase radius
            // if(coordinates[id]) {
            //     coordinates[id].radius += radius;
            // } else {
            //     // Create new coordinate
                coordinates[id] = {radius : radius, x : movedX, y : movedY};
            // }
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

        function createCircle() {
            // Loop through all values and return the number with the highest value
            var max = 0;
            for(var i in values) {
                max = Math.max(values[i].value, max);
            }
            // Loop through all values and apply RGBA colors
            for(var id in values) {
                // Convert the value to rgba colors
                var rgba = value2rgba(values[id].value / max);
                var radius = values[id].value * 0.1;
                var geometry = new THREE.CircleGeometry(radius, 32);
                var material = new THREE.MeshBasicMaterial({transparent: true});
                var circle = new THREE.Mesh(geometry, material);
                circle.material.color.setRGB(rgba[0], rgba[1], rgba[2]);
                circle.material.opacity = rgba[3];

                // Retrieve the x and y coordinate and set circle position
                circle.position.x = values[id].x;
                circle.position.y = values[id].y;
                scene.add(circle);
            }
        };
        
        var animate = function () {
                prepareCoordinates();
                render();
                createCircle();

            timer(start); // Start animation render timer
            renderer.render(scene, camera);
            timer(stop); // Stop and calculate the animation render time
        };

        console.log("DataLength: " + jsonData.length)

        // Sets a limit on how much data should be collected
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
xmlhttp.open("GET", "../Dataset/5000rows.json", true);
xmlhttp.send();
