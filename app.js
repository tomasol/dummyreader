const express = require('express')
const bodyParser = require('body-parser')
const rp = require('request-promise-native');

const app = express()
app.use(bodyParser.json())
const port = 3000

const readersPrefix = '/readers'

const pathRegex = /^\/openconfig-interfaces:interfaces\/interface\[name='(.*)'\]\/config$/
const mtuRegex = /^mtu (\d+)$/m
const descriptionRegex = /^description '?(.+?)'?$/m
const shutdownRegex = /^shutdown$/m
const typeRegex = /^interface\s+(.+)$/m
const ethernetIfcRegx = /^\d+\/\d+$/

function parseValue(regex, input, closure, callClosureOnlyOnMatch) {
  let match = regex.exec(input)
  if (callClosureOnlyOnMatch && match == null) {
    return // undefined will be removed from json
  }
  return closure(match)
}

function parseIfcType(ifcName) {
  if (ifcName.indexOf("lag") == 0) {
    return "iana-if-type:Ieee8023adLag";
  } else if (ifcName.indexOf("vlan") == 0) {
    return "iana-if-type:L3ipvlan";
  } else if (ethernetIfcRegx.exec(ifcName)) {
    return "iana-if-type:ethernetCsmacd";
  }
  return "iana-if-type:Other";
}

async function reader(path, cli) {
  let pathMatch = pathRegex.exec(path)
  if (pathMatch == null) {
    throw "Cannot parse path"
  }
  let ifcName = pathMatch[1]
  const cmd = "show running-config interface " + ifcName
  cliResponse = await cli.executeRead(cmd)
  let model = {"name":ifcName}
  model["mtu"] = parseValue(mtuRegex, cliResponse, function(match){return parseInt(match[1])}, true)
  model["description"] = parseValue(descriptionRegex, cliResponse, function(match){return match[1]}, true)
  model["enabled"] = parseValue(shutdownRegex, cliResponse, function(match) {return match == null})
  model["type"] = parseValue(typeRegex, cliResponse, function(match) {return parseIfcType(match[1])}, true)
  return model
}

app.post(readersPrefix + '/openconfig-interfaces:interfaces/interface/config', async (req, res, next) => {
  // parse path
  console.log("req.body:", req.body)
  let path = req.body["path"]
  console.log("req.body.path:", path)
  let executeRead = async function(cmd) {
    let cliResponse
    if (req.body["cmd"] != null && typeof req.body["cmd"][cmd] === "string") {
      cliResponse = req.body["cmd"][cmd]
    } else {
      let executeCliCommandEndpoint = req.body["executeCliCommandEndpoint"]
      console.log("Reading from", executeCliCommandEndpoint)
      let reqJSON = {"cmd": cmd}
      var options = {
        method: 'POST',
        uri: executeCliCommandEndpoint,
        body: reqJSON,
        json: true // Automatically stringifies the body to JSON
      }
      cliResponse = await rp(options)
    }
    console.log("Got cli response:", cliResponse)
    return cliResponse
  }
  const cli = {"executeRead": executeRead}
  let model = await reader(path, cli)
  console.log("Sending back", model)
  res.send(model)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

/*
curl -v localhost:3000/readers/openconfig-interfaces:interfaces/interface/config -H "Content-Type: application/json" -d \

'{"deviceType":"ubnt", "deviceVersion":"1", "path":"/openconfig-interfaces:interfaces/interface[name='\''4/1'\'']/config", "executeCliCommandEndpoint":"http://172.8.0.85:4000/executeCliCommand/secret"}'

'{"deviceType":"ubnt", "deviceVersion":"1", "path":"/openconfig-interfaces:interfaces/interface[name='\''4/1'\'']/config", "cmd":{"show running-config interface 4/1":"foo\nmtu 99\ndescription descr\nshutdown\ninterface 2/2"}}'

curl -v 172.8.0.85:4000/executeCliCommand/secret -d "{\"cmd\":\"show running-config\"}"

 */
