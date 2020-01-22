const http = require('http');
const Yang = require('yang-js');
// const yangInstance2 = require('./openconfig@0.1.6/iana-if-type.yang');
// const yangInstance = require('./openconfig@0.1.6/openconfig-interfaces.yang');

// const yangInstance = Yang.parse(`  import openconfig-interfaces {
//   prefix yang;
// }`);
const hostname = '127.0.0.1';
const port = 3000;

const yangInstance = Yang.import('openconfig-interfaces');

const model = yangInstance.eval({
  "openconfig-interfaces:interfaces":{
    "interface":[
      {
      "state":{},
      "config":{
        "enabled":"true"
      },
      "name":"0",
      "type":"iana-if-type:Ieee8023adLag"
      }
    ]
  }
});

console.log(model);

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World');
// });
//server.listen(port, hostname, () => {
//  console.log(`Server running at http://${hostname}:${port}/`);
//});
