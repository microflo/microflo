require('coffee-script/register');
module.exports = require('./index.coffee');
if (require.main == module) {
    module.exports.main();
}
