// Gõ lệnh node index.js để bắt đầu chạy server

var express = require('express')  // Module xử lí chung
var mysql = require('mysql2')     // Module cho phép sử dụng cơ sở dữ liệu mySQL 
var mqtt = require('mqtt')        // Module cho phép sử dụng giao thức mqtt

var app = express()
var port = 6060                   // Port của localhost do mình chọn

var exportCharts = require('./export.js') // Require file export.js

app.use(express.static("public"))
app.set("views engine", "ejs")
app.set("views", "./views")

var server = require("http").Server(app)
var io = require('socket.io')(server)

app.get('/', function (req, res) {
    res.render('home.ejs')
})

app.get('/history', function (req, res) {
    res.render('history.ejs')
})

server.listen(port, function () {
    console.log('Server listening on port ' + port)
})

//----------------------MQTT-------------------------
var options = {
    host: '34.124.157.130',
    port: 8883,
    protocol: 'mqtts',
    username: 'rvp20',
    password: 'Matkhau123'
}
var client = mqtt.connect('mqtt://broker.emqx.io:1883',{clientId: 'deployment-m66308d5'});


// // initialize the MQTT clientq 'mqtt://broker.hivemq.com:1883',{clientId: 'clientId-vn5n6NKqX8'}
// // declare topics
var topic1 = "livingroomLight";
var topic2 = "livingroomAirConditioner";
var topic3 = "television";
var topic4 = "bedroomLight";
var topic5 = "bedroomAirConditioner";
var topic6 = "airVent";

var topic_list = ["temperature-humidity"];

client.on("connect", function () {
    console.log("connected mqtt " + client.connected);
});

client.on("error", function (error) {
    console.log("Can't connect" + error);
    process.exit(1)
});



// SQL--------Temporarily use PHPMyAdmin------------------------------
var con = mysql.createConnection({
    host: '192.168.1.30',
    port: 3306,
    user: 'root',
    password: 'matkhau123',
    database: 'rvp_database'
});
// //---------------------------------------------CREATE TABLE-------------------------------------------------
con.connect(function (err) {
    if (err) throw err;
    console.log("mysql connected");
    var sql = "CREATE TABLE IF NOT EXISTS sensors11(ID int(10) not null primary key auto_increment, Time datetime not null, Temperature int(3) not null, Humidity int(3) not null, Light int(5) not null )"
    con.query(sql, function (err) {
        if (err)
            throw err;
        console.log("Table created");
    });
})

// var humi_graph = [];
// var temp_graph = [];
// var date_graph = [];
client.subscribe("temperature-humidity");
var m_time
var newTemp
var newHumi
var newLight


// //--------------------------------------------------------------------
var cnt_check = 0;
client.on('message', function (topic, message) {
    console.log("topic:" + topic.toString());
    console.log("message is " + message);
    // console.log("topic is " + topic)
    const objData = JSON.parse(message);
    if (topic == "temperature-humidity") {
        cnt_check = cnt_check + 1;
        newTemp = objData.Temperature;
        newHumi = objData.Humidity;
        newLight = objData.Light;
    }

    if (cnt_check == 1) {
        console.log("ready to save");
        var n = new Date();
        var month = n.getMonth() + 1;
        var Date_and_Time = n.getFullYear() + "-" + month + "-" + n.getDate() + " " + n.getHours() + ":" + n.getMinutes() + ":" + n.getSeconds();
        var sql = "INSERT INTO sensors11 (Time, Temperature, Humidity, Light) VALUES ('" + Date_and_Time.toString() + "', '" + newTemp + "', '" + newHumi + "', '" + newLight + "')"
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Table inserted");
            console.log(Date_and_Time + " " + newTemp + " " + newHumi + " " + newLight);
        });
        exportCharts(con, io);
        cnt_check = 0;
    }
})
// //----Socket---------Control devices----------------------------

io.on('connection', function (socket) {
    console.log("socket " + socket.id + " connected")
    socket.on('disconnect', function () {
        console.log(socket.id + " disconnected")
    })

    socket.on("livingroomLightChange", function (data) {
        if (data == "on") {
            console.log('Livingroom light ON')
            client.publish(topic1, 'livingroomLightOn');
        }
        else {
            console.log('Livingroom light OFF')
            client.publish(topic1, 'livingroomLightOff');
        }
    })

    socket.on("livingroomAirConditionerChange", function (data) {
        if (data == "on") {
            console.log('Livingroom air conditioner ON')
            client.publish(topic2, 'livingroomAirConditionerOn');
        }
        else {
            console.log('Livingroom air conditioner OFF')
            client.publish(topic2, 'livingroomAirConditionerOff');
        }
    })

    socket.on("televisionChange", function (data) {
        if (data == "on") {
            console.log('Television ON')
            client.publish(topic3, 'televisionOn');
        }
        else {
            console.log('Television OFF')
            client.publish(topic3, 'televisionOff');
        }
    })

    socket.on("bedroomLightChange", function (data) {
        if (data == "on") {
            console.log('Bedroom light ON')
            client.publish(topic4, 'bedroomLightOn');
        }
        else {
            console.log('Bedroom light OFF')
            client.publish(topic4, 'bedroomLightOFF');
        }
    })

    socket.on("bedroomAirConditionerChange", function (data) {
        if (data == "on") {
            console.log('Bedroom air conditioner ON')
            client.publish(topic5, 'bedroomAirConditionerON');
        }
        else {
            console.log('Bedroom air conditioner  OFF')
            client.publish(topic5, 'bedroomAirConditionerOFF');
        }
    })
    socket.on("airVentChange", function (data) {
        if (data == "on") {
            console.log('Air vent ON')
            client.publish(topic6, 'airVentOn');
        }
        else {
            console.log('Air vent OFF')
            client.publish(topic6, 'airVentOff');
        }
    })

    // Send data to History page
    var sql1 = "SELECT * FROM sensors11 ORDER BY ID"
    con.query(sql1, function (err, result, fields) {
        if (err) throw err;
        console.log("Full Data selected");
        var fullData = []
        result.forEach(function (value) {
            var m_time = value.Time.toString().slice(4, 24);
            fullData.push({ id: value.ID, time: m_time, temp: value.Temperature, humi: value.Humidity, light: value.Light })
        })
        io.sockets.emit('send-full', fullData)
    })
})
