

var onLoad = function() {
    console.log("onload");
    var microflo = require('microflo');
    var util = microflo.util;

    var port = 3569;
    var ip = "localhost";

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


    var userInput = document.getElementById("uuidInput");
    chrome.storage.local.get('user-id', function(items) {
        var id = items['user-id'];
        if (id) {
            userInput.value = id;
        }
    });

    var runButton = document.getElementById("runButton");
    runButton.onclick = function() {
        var devName = document.getElementById("serialportSelect").value;
        var baudRate = parseInt(document.getElementById("baudrateSelect").value);
        var statusField = document.getElementById("runtimeStatus");

        // FIXME: this is not really a robust detection of runtime state
        runButton.disabled = true;
        statusField.innerHTML = "Starting";
        try {
            microflo.runtime.setupRuntime(devName, baudRate, port, "Error", "localhost");
        } catch (e) {
            statusField.innerHTML = "Error: " + e.message;
            runButton.disabled = false;
            throw e;
        }

        var registerButton = document.getElementById("registerButton");

        chrome.storage.local.get('runtime-id', function(items) {
            var id = items['runtime-id'];

            var user = userInput.value;
            try {
                var rt = microflo.runtime.createFlowhubRuntime(user, ip, port, id);
                if (!id) {
                    microflo.runtime.registerFlowhubRuntime(rt, function(err, ok) {
                        if (err) {
                            statusField.innerHTML = "Error: unable to register\n" + err;
                        } else {
                            var items = {
                                'runtime-id': rt.runtime.id,
                                'user-id': user
                            }
                            chrome.storage.local.set(items, function() {
                                //
                            });
                            statusField.innerHTML = "Running";
                        }
                    });
                } else {
                    statusField.innerHTML = "Running";
                    // TODO: ping registry
                }

            } catch (e) {
                statusField.innerHTML = "Error: " + e.message;
                throw e;
            }

        });

    }
}

window.addEventListener('load', onLoad, false);
