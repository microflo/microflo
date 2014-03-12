
var util = require("./util");
if (util.isBrowser()) {
    var def = require("../microflo/commandformat.json");
} else {
    var def = require("../microflo/commandformat.json");
}

module.exports = def
