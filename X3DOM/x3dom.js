
var coordinates = {}; // Array to hold coordinate id

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

        var dotQuantity = 0;

        function newCoordinate() {
            var latCoordinate = jsonData[dotQuantity]["Provets latitud (DD)"];
            var longCoordinate = jsonData[dotQuantity]["Provets longitud (DD)"];
            var newLat = latCoordinate.replace(",","."); // Replace any commas with a dot to be able to render the coordinate
            var newLong = longCoordinate.replace(",",".");

            addID(newLat, newLong);
        };

        function addID(x, y) {
            var id = y + x * 600; // 600 is the width of the canvas
            
            if(coordinates[id]) {
                coordinates[id] += 100;
            } else {
                coordinates[id] = 100;
            }

        };

        for(dotQuantity; dotQuantity < jsonData.length; dotQuantity++){
            newCoordinate();
        }

        // console.log(jsonData.length)
        console.log(coordinates);
    }
};
xmlhttp.open("GET", "../Dataset/testData.json", true);
xmlhttp.send();