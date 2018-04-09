'use strict';

function setCoordinate(){ // Change the coordinates in the scene
    var oldCoordinate = document.getElementById('coordinateID').getAttribute('point');
    console.log('The old value was ' + oldCoordinate);    
    //var setNewCoordinate = document.getElementById('coordinateID').setAttribute('point', '0 0 0, 2 0 0, 1 1 0');
    
    var newCoordinate = document.getElementById('coordinateID').getAttribute('point');
    console.log('The new value is ' + newCoordinate);
};

// Get the data from the json file
var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var jsonData = JSON.parse(this.responseText);

        // Objects to hold coordinate id and value id
        var coordinates = {}; 
        var values = {};
        
        var dotQuantity = 0;
        // Source coordinates will be in Longitude/Latitude, WGS84
        var source = new proj4('EPSG:4326');

        // Destination coordinates in meters, global spherical mercators projection
        var dest = new proj4('EPSG:3785');

        var canvasWidth = document.getElementById('x3d').getAttribute('width');
        var width = Number(canvasWidth.replace("px",""));

        function prepareCoordinates() {
            var coords = newCoordinate();
            var point = convertLatlon(coords.lat, coords.lon);

            addID(point);
        };

        function newCoordinate() {
            // Replace any commas with a dot to be able to render the coordinate
            var lat = jsonData[dotQuantity]["Provets latitud (DD)"].replace(",",".");
            var lon = jsonData[dotQuantity]["Provets longitud (DD)"].replace(",",".");
            return {lat: lat, lon: lon};
        };

        // Returns a point with x and y coordinates in meters
        function convertLatlon(lat, lon) {
            var point = proj4.toPoint([lon, lat, 0.0]);
            return proj4.transform(source.oProj, dest.oProj, point);
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

        function render(){
            for(var id in coordinates) {
                var radius = coordinates[id].radius;

                // Retrieve the x and y coordinate
                var xpoint = coordinates[id].x;
                var ypoint = coordinates[id].y
                
                // If x are within the radius, run loop
                for(var x = xpoint - radius; x < xpoint + radius; x++) {
                    for(var y = ypoint - radius; y < ypoint + radius; y++) {
                        var distance = Math.sqrt(Math.pow((x - xpoint), 2) + Math.pow((y - ypoint), 2));
                        if(distance > radius) {
                            continue;
                        } else {
                            var value = radius - 1 * distance;
                            // retrieve the ID for the coordinate
                            var id = x + y;
                            // If coordinates has property of id, add radius value
                            if(values[id]) {
                                values[id] += value;
                            } else {
                                // Creates a new value
                                values[id] = value;
                            }
                        }
                    }
                }
            }
        };

        for(dotQuantity; dotQuantity < jsonData.length; dotQuantity++){
            prepareCoordinates();
        }
        render();
        // console.log(jsonData.length);
        console.log(coordinates);
        console.log(Object.keys(values).length);
    }
};
xmlhttp.open("GET", "../Dataset/testData.json", true);
xmlhttp.send();