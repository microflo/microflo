
const msgpack = require('msgpack-lite');
const codec = msgpack.createCodec({usemap: true});

// TODO: generate from fbp-protocol spec
var packInfo = {
    graph: {},
    network: {},
}
packInfo.graph.addnode = {
    payloadKeyMap: {
        'id': 0,
        'component': 1,
        'graph': 2,
        // NOTE: no metadata??
    },
    commandId: 1,
}

function packMessage(fbpMessage) {

    const { protocol, command, payload } = fbpMessage;
    console.log('p', protocol, command)
    const keyMapping = packInfo[protocol][command].payloadKeyMap;


    // TODO: handle non-flat objects
    var keyValuePairs = [];

    Object.keys(payload).forEach((fbpKey) => {
        const k = keyMapping[fbpKey];
        const v = payload[fbpKey];
        if (typeof k !== 'undefined') {
            keyValuePairs.push([ k, v ]);
        }
    })

    var input = new Map(keyValuePairs);
    var buffer = msgpack.encode(input, { codec: codec });
    return buffer;
}

var unpackMessage(packMessage) {

}

var input = {
    'protocol': 'graph',
    'command': 'addnode',
    'payload': {
        id: 'mynodeid',
        component: 'lib/MyComponent',
        graph: 'main',
    }
}
var buffer = packMessage(input);
var out = msgpack.decode(buffer, { codec: codec });

console.log(input)
console.log(buffer)
console.log(out)
