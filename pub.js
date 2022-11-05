var mqtt = require('mqtt')

var options = {
    host: '34.124.157.130',
    port: 8883,
    protocol: 'mqtts',
    username: 'rvp20',
    password: 'Matkhau123',
    Idclient: 'deployment-m66308d5'
}

//initialize the MQTT client
var client = mqtt.connect(options);
var topic1 = "temperature-humidity";
//setup the callbacks
client.on('connect', function () {
    console.log('Connected');
});

client.on('error', function (error) {
    console.log(error);
});


client.on('message', function (topic, message) {
    //Called each time a message is received
    console.log('Received message:', topic, message);
});

// subscribe to topic 'my/test/topic'

// // publish message 'Hello' to topic 'my/test/topic'
client.publish(topic1, {"Temperature":24,"Humidity":88,"Light":35.33333588}.toString());client.subscribe(topic1);
