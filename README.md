# moco-node [![Build Status](https://api.travis-ci.org/uuau99999/moco-node.svg?branch=master)](https://travis-ci.org/uuau99999/moco-node)

## Description

A moco server implements with node

## Usage

```
    let stubServer = new MocoServer('your_contract_dir', your_port);
    ...

    // start stub server
    stubServer.start();

    // add stub to server
    stubServer.givenStub('your_contract_stub_description');

    // stop stub server
    stubServer.stop();
```

below is how your contract file looks like:

```
[{
    "description": "[b-api]should_return_weather_given_local_city_name",
    "request": {
        "method": "POST",
        "uri": "/graphql",
        "json": {
            "query": "{getWeatherByCityName(city:\"苏州\"){temperature weather washIndex weatherId}}"
        }
    },
    "response": {
        "status": 200,
        "json": {
            "data": {
                "getWeatherByCityName": {
                    "temperature": "20℃~27℃",
                    "weather": "多云",
                    "washIndex": "洗车指数:较不宜",
                    "weatherId": [
                        "01",
                        "01",
                        "01"
                    ]
                }
            }
        }
    }
}]
```

Note that the stub is search based on your contract description, and the uri that the request to match can be like this: '/account/:varying_var/get/'

## Api

### new MocoServer('contract_dir', port | options) : MocoServer

Initialize a MocoServer instance. Contract dir is a path relative to your project root directroy. The second argument can either be a port number or an options object. See exmaple below:

```
const server = new MocoServer('contracts', {
    defaultPort: 5001,
    tagPortMapping: {
        tag1: 5002,
        tag2: 5003,
        'b-api': 5004,
        ...
    }
});
```

If you pass an options object to constructor, MocoServer will start a server for every tag you defined in tagPortMapping. So you can define your contract description like this: '\[your_tag\]your_description'. Then if you pass this to your givenStub function, the stub will only match this contract request only in server port mapping to your tag. For example, given the MocoServer and contract file shown above, you can fire a request like this:

```
server.givenStub('[b-api]should_return_weather_given_local_city_name');

...

fetch('http://localhost:5004/graphql' {
    method: 'POST',
    body: JSON.stringify({
        query:
            "{getWeatherByCityName(city:\"苏州\")
            {temperature weather washIndex weatherId}}"
    })
})
```

and you will get a response like this:

```
"response": {
    "status": 200,
    "json": {
        "data": {
            "getWeatherByCityName": {
                "temperature": "20℃~27℃",
                "weather": "多云",
                "washIndex": "洗车指数:较不宜",
                "weatherId": [
                    "01",
                    "01",
                    "01"
                ]
            }
        }
    }
}
```

Note that if you provide a tag that does not exist in tagPortMapping, the request will go to the default port.

### .start() : Promise

    start a stub server.

### .givenStub('stub_description') : void

    add a stub which searched from in your contract directory to your stub server.

### .stop() : void

    stop a stub server.

### .getContratMap() : Map<string, Contract>

    return a contract map.

### .cleanContractMap() : void

    clean contract map.

### .buildContractMap() : Promise<Map<string, Contract>>

    build contract map.

### .clearStubs() : void

    clear all stubs
