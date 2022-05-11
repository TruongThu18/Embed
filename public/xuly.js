var socket = io ("http://localhost:3300")
socket.on("server-update-data", function (data) {

    // Home page
    $("#currentTemp").html(data.temp)
    $("#currentHumi").html(data.humi)
    $("#currentLight").html(data.light)

    // Warning mode
    var warningSection = document.getElementById("warningSection")
    if (data.temp > 35 || data.humi < 50) {
        warningSection.classList.add("warning-mode-on")
    } else {
        warningSection.classList.remove("warning-mode-on")
    }
    //History page
    $("#id-content").append("<div class='h-para'>" + data.id + "</div>")
    $("#time-content").append("<div class='h-para'>" + data.time + "</div>")
    $("#temp-content").append("<div class='h-para'>" + data.temp + "</div>")
    $("#humi-content").append("<div class='h-para'>" + data.humi + "</div>")
    $("#light-content").append("<div class='h-para'>" + data.light + "</div>")
})

socket.on("send-full", function (data) {
    // History page
    $("#light-content").html("")
    $("#time-content").html("")
    $("#temp-content").html("")
    $("#humi-content").html("")
    $("#id-content").html("")

    // console.log(data)
    data.forEach(function (item) {
        $("#light-content").append("<div class='h-para'>" + item.light + "</div>")
        $("#time-content").append("<div class='h-para'>" + item.time + "</div>")
        $("#temp-content").append("<div class='h-para'>" + item.temp + "</div>")
        $("#humi-content").append("<div class='h-para'>" + item.humi + "</div>")
        $("#id-content").append("<div class='h-para'>" + item.id + "</div>")
    })
})

// ---- Control devices ----



function gardenLight() {
    var checkBox = document.getElementById("gardenLight");
    if (checkBox.checked == true) {
       // alert('LED On')
        socket.emit("gardenLightChange", "on")
    } else {
         //alert('LED Off')
        socket.emit("gardenLightChange", "off")
    }
}



// ---- RTC ----