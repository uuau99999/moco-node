# moco-node

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

below is how your contract file looks alike:

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
