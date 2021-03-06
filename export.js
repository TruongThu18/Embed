var humi_graph = [];
var temp_graph = [];
var light_graph = [];
var date_graph = [];
function exportChart(con, io) {
    var m_time
    var newTemp
    var newHumi
    var newLight
    var sql1 = "SELECT * FROM sensors11 ORDER BY ID DESC limit 1"
    con.query(sql1, function (err, result, fields) {
        if (err) throw err;
        console.log("Data selected");
        result.forEach(function (value) {
            m_time = value.Time.toString().slice(4, 24);
            newTemp = value.Temperature
            newHumi = value.Humidity
            newLight = value.Light
            console.log(m_time + " " + value.Temperature + " " + value.Humidity + " " +  value.Light);
            io.sockets.emit('server-update-data', { id: value.ID, time: m_time, temp: value.Temperature, humi: value.Humidity, light: value.Light })
        })
        if (humi_graph.length < 6) {
            humi_graph.push(newHumi);
        }
        else {
            for (i = 0; i < 5; i++) {
                humi_graph[i] = humi_graph[i + 1];
            }
            humi_graph[5] = newHumi;
        }

        if (temp_graph.length < 6) {
            temp_graph.push(newTemp);
        }
        else {
            for (u = 0; u < 5; u++) {
                temp_graph[u] = temp_graph[u + 1];
            }
            temp_graph[5] = newTemp;
        }
        if (light_graph.length < 6) {
            light_graph.push(newLight);
        }
        else {
            for (l = 0; l < 5; l++) {
                light_graph[l] = light_graph[l + 1];
            }
            light_graph[5] = newLight;
        }

        if (date_graph.length < 6) {
            date_graph.push(m_time);
        }
        else {
            for (x = 0; x < 5; x++) {
                date_graph[x] = date_graph[x + 1];
            }
            date_graph[5] = m_time;
        }
        io.sockets.emit("server-send-humi_graph", humi_graph);
        io.sockets.emit("server-send-temp_graph", temp_graph);
        io.sockets.emit("server-send-light_graph", light_graph);
        io.sockets.emit("server-send-date_graph", date_graph);
        
    });
}
module.exports = exportChart
