util = require './util'
def = null
if util.isBrowser()
  def = require('../microflo/commandformat.json')
else
  def = require('../microflo/commandformat.json')
module.exports = def
