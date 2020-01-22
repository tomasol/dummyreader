const http = require('http');
const Yang = require('yang-js');

const hostname = '127.0.0.1';
const port = 3000;

const schema = `
  container foo {
    leaf a { type string; }
    leaf b { type uint8; }
  }
`;

const model = Yang.parse(schema).eval({
    foo: {
      a: 'apple',
      b: 10,
    }
  });

console.log(model.foo.b);
console.log(model.foo.a);


const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

//server.listen(port, hostname, () => {
//  console.log(`Server running at http://${hostname}:${port}/`);
//});
