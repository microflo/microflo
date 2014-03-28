var onLoad = function() {
    console.log("onload");
    var microflo = require('microflo');

    // Testing Chrome serial connection API
    console.log("Attempting to get serial devices using Chrome API")
    var onGetDevices = function(ports) {
      for (var i=0; i<ports.length; i++) {
        console.log(ports[i].path);
      }
    }
    chrome.serial.getDevices(onGetDevices);

    var stringReceived = '';
    var connectionId = null;

    var onReceiveCallback = function(info) {
        console.log("onReceiveCallback", info);
        if (info.connectionId == connectionId && info.data) {
          var str = convertArrayBufferToString(info.data);
          if (str.charAt(str.length-1) === '\n') {
            stringReceived += str.substring(0, str.length-1);
            onLineReceived(stringReceived);
            stringReceived = '';
          } else {
            stringReceived += str;
          }
        }
    };

    chrome.serial.onReceive.addListener(onReceiveCallback);

    var onConnect = function(connectionInfo) {
        if (connectionInfo) {
            connectionId = connectionInfo.connectionId;
            console.log("connected", connectionInfo);

            chrome.serial.send(connectionId, "ss", function(sendinfo, error) {
                console.log("Attempted send: ", sendinfo, error);
            });
        } else {
            console.log("Connection to serialport failed!");
        }
    }

    // Connect to the serial port
    var devName = "/dev/ttyUSB1";
    chrome.serial.connect(devName, {bitrate: 9600}, onConnect);
}

window.addEventListener('load', onLoad, false);
