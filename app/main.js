

var onLoad = function() {
    console.log("onload");
    var microflo = require('microflo');
    var util = microflo.util;

    // TODO: filter obviously invalid connections, like ttySx

    var select = document.getElementById("serialportSelect");
    var onGetDevices = function(ports) {
      for (var i=0; i<ports.length; i++) {
        var port = ports[i];
        console.log(port.path, port);

        if (port.path.search("/dev/ttyS") !== -1) {
            continue;
        }

        var option = document.createElement('option');
        option.text = port.path;
        select.add(option);
      }
    }
    chrome.serial.getDevices(onGetDevices);

    var addBaudRates = function(id) {
        var select = document.getElementById(id);
        var rates = [
            [9600, "Arduino"],
            [115200, "Tiva-C"]
        ];
        rates.forEach(function(item, idx) {
            var option = document.createElement('option');
            option.value = item[0];
            var desc = item[1] ? item[0] + " ("+item[1]+")" : item[0];
            option.text = desc;
            select.add(option);
        });
    }
    addBaudRates('baudrateSelect');


    document.configForm.onsubmit = function() {
        var devName = document.getElementById("serialportSelect").value;
        var baudRate = parseInt(document.getElementById("baudrateSelect").value);
        var port = 3569;

        microflo.runtime.setupRuntime(devName, baudRate, port, "Error", "localhost");

        return true;
    }

}

window.addEventListener('load', onLoad, false);
