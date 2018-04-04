
function setCoordinate(){ // Change the coordinates in the scene
    var oldCoordinate = document.getElementById('coordinateID').getAttribute('point');
    console.log('The old value was ' + oldCoordinate);    
    var setNewCoordinate = document.getElementById('coordinateID').setAttribute('point', '0 0 1, 2 0 1, 1 1 1 ');
    
    var newCoordinate = document.getElementById('coordinateID').getAttribute('point');
    console.log('The new value is ' + newCoordinate);
}