// Gõ lệnh node index.js để bắt đầu chạy server

var express = require('express')  // Module xử lí chung
var mysql = require('mysql2')     // Module cho phép sử dụng cơ sở dữ liệu mySQL 
var mqtt = require('mqtt')        // Module cho phép sử dụng giao thức mqtt

var app = express()
var port = 3300                // Port của localhost do mình chọn

var exportCharts = require('./export.js') // Require file export.js chart

app.use(express.static("public"))
app.set("views engine", "ejs")
app.set("views", "./views")

var server = require("http").Server(app)
var io = require('socket.io')(server)

app.get('/', function (req, response) {
    response.render("home.ejs");
})
app.get('/history', function (req, response) {
    response.render("history.ejs");
})
server.listen(port, function () {
    console.log('Server listening on port ' + port)
})

//----------------------MQTT-------------------------
// var options = {
//     host: 'f024039c5e1346ab96fba6477e83ce81.s1.eu.hivemq.cloud',
//     port: 8883,
//     protocol: 'mqtts',
//     username: 'kita228',
//     password: 'Kitaanhs123'
// }

var client = mqtt.connect('mqtt://broker.hivemq.com:1883',{clientId: 'Kita-Esp8266'});

//var client = mqtt.connect('io.adafruit.com:1883')
// declare topics
var topic1 = "gardenMotor";
var topic2 = "gardenLight";
var topic3 = "gardenFan";

var topic_list = ["docs"];
console.log("connected flag  " + client.connected);
client.on("connect", function () {
    console.log("connected mqtt " + client.connected);
});

client.on("error", function (error) {
    console.log("Can't connect" + error);
    process.exit(1)
});



// SQL--------Temporarily use MyAdmin------------------------------
var con = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'truongthu',
    database: 'vietanh'
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

client.subscribe("docs");
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
    if (topic == "docs") {
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
        var sql = "INSERT INTO sensors11 (Time, Temperature, Humidity, Light) VALUES ('" + Date_and_Time.toString() + "', '" + newTemp + "', '" + newHumi + "','" + 0 + "')"
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Table inserted");
            console.log(Date_and_Time + " " + newTemp + " " + newHumi + " " + newLight);
        });
        // var sql = "DELETE FROM sensors11 WHERE humidity ='2147483647'";
        // con.query(sql, function (err, result) {
        // if (err) throw err;
        // console.log("Number of records deleted: " + result.affectedRows);
        //     });
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

    socket.on("gardenMotorChange", function (data) {
        if (data == "on") {
            console.log('gardenMotor ON')
            client.publish(topic1, 'gardenMotorOn');
        }
        else {
            console.log('gardenMotor  OFF')
            client.publish(topic1, 'gardenMotorOff');
        }
    })

    socket.on("gardenLightChange", function (data) {
        if (data == "on") {
            console.log('gardenLight ON')
            client.publish(topic2, 'gardenLightOn');
        }
        else {
            console.log('gardenLight OFF')
            client.publish(topic2, 'gardenLightOff');
        }
    })

    socket.on("gardenFanChange", function (data) {
        if (data == "on") {
            console.log('gardenFan ON')
            client.publish(topic3, 'gardenFanOn');
        }
        else {
            console.log('gardenFan OFF')
            client.publish(topic3, 'gardenFanOff');
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
            fullData.push({ id: value.ID, time: m_time, temp: value.Temperature, humi: value.Humidity, light: 0 })
        })
        io.sockets.emit('send-full', fullData)
    })
})
