
// FIXME: emscripten can't run in Chrome app due to eval() use
// https://github.com/kripken/emscripten/issues/2312

var setLed = function(On) {
    var controller = document.getElementById("controller").contentDocument;
    var ledLight = controller.getElementById("pin13led-light");
    ledLight.setAttributeNS(null, 'opacity', On ? '1' : '0');
}

Module["print"] = function(str) {
    console.log(str);

    // HACK: use a custom I/O backend instead, communicate via host-transport
    var tok = str.split(" ");
    if (tok.length > 3 && tok[2].indexOf("::DigitalWrite") !== -1) {
        var pin = tok[5].replace("pin=","").replace(",","");
        pin = parseInt(pin);
        var state = tok[6] === "value=ON";
        if (pin === 13) {
            setLed(state);
        }
    }
}

var onLoad = function() {
    console.log("onload");
    var microflo = require('microflo');

    // From Emscripten
    var runtime = Module['_emscripten_runtime_new']();
    setInterval(function() {
        Module['_emscripten_runtime_run'](runtime);
    }, 100);
}

window.addEventListener('load', onLoad, false);
