var client;
var lastMsg;

//var mqttHost = "mqtt.eclipseprojects.io";
var mqttHost = (window.location.hostname == "wx.senia.org" ? "wxgen.senia.org" : "mqtt.eclipseprojects.io");
var mqttPort = (window.location.protocol == "https:" ? 443 : 80);
var mqttUseSSL = (window.location.protocol == "https:" ? true : false);
//var mqttUri = (window.location.protocol == "https:" ? "/wss/" : "/ws/");
//var mqttUri = "/mqtt";
if (window.location.hostname == "wx.senia.org") {
 var mqttUri = (window.location.protocol == "https:" ? "/wss/" : "/ws/");
} else {
 var mqttUri = "/mqtt";
}


  // Create a client instance
  client = new Paho.MQTT.Client(mqttHost, mqttPort, mqttUri, "web_" + parseInt(Math.random() * 100, 10));

  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;
  var options = {
    useSSL: mqttUseSSL,
    onSuccess:onConnect,
    onFailure:doFail
  }

  // connect the client
  client.connect(options);

  // called when the client connects
  function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    client.subscribe("wx.senia.org/weather/loop");
  }

  function doFail(e){
    console.log(e);
  }

  // called when the client loses its connection
  function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log("onConnectionLost:"+responseObject.errorMessage);
    }
    client.connect(options);
  }

  // called when a message arrives
  function onMessageArrived(message) {
    //console.log("onMessageArrived:"+message.payloadString);
    var msg = JSON.parse(message.payloadString);
    $('#temp').text(parseFloat(msg.outTemp_F).toFixed(1));
    $('#windspeed').text(parseFloat(msg.windSpeed_mph).toFixed(0));
    $('#maxWindCurent.metric_value').text(parseFloat(msg.windGust_mph).toFixed(0));
    $('#humidity').text(parseFloat(msg.outHumidity).toFixed(1));
    $('#windchill').text(parseFloat(msg.windchill_F).toFixed(1));
    if (typeof msg.windDir != 'undefined') {
        $('#windDirOrdinal').text(Windrose.getPoint(msg.windDir, { depth: 2 }).symbol);
        $('#windDir').html(parseFloat(msg.windDir).toFixed(0)+"&deg;");
        if (msg.windDir < 22.5) {
                $('#windVector').html("&#8593")
        } else if (msg.windDir < 67.5) {
                $('#windVector').html("&#8599")
        } else if (msg.windDir < 112.5) {
                $('#windVector').html("&#8594")
        } else if (msg.windDir < 157.5) {
                $('#windVector').html("&#8600")
        } else if (msg.windDir < 202.5) {
                $('#windVector').html("&#8595")
        } else if (msg.windDir < 247.5) {
                $('#windVector').html("&#8601")
        } else if (msg.windDir < 292.5) {
                $('#windVector').html("&#8592")
        } else if (msg.windDir < 337.5) {
                $('#windVector').html("&#8598")
        } else {
                $('#windVector').html("&#8593")
        }
    } else {
        $('#windDirOrdinal').text("-");
        $('#windDir').text("-");
    }

    $('#pressure').text(parseFloat(msg.barometer_inHg).toFixed(2));
    $('#dewpt').text(parseFloat(msg.dewpoint_F).toFixed(1));
    $('#rainrate').text(parseFloat(msg.rainRate_inch_per_hour).toFixed(2));
    $('#dailyrain').text(parseFloat(msg.dayRain_in).toFixed(2)+" in");
    $('#stormRainTotal').text(parseFloat(msg.stormRain_in).toFixed(2)+" in");
    $('#current_rainrate').text(parseFloat(msg.rainRate_inch_per_hour).toFixed(2)+" in/hr");
    $('#solarradiation').text(parseFloat(msg.radiation_Wpm2).toFixed(0));
    $('#uvindex').text(parseFloat(msg.UV).toFixed(1));
    $('#datetime').text(new Date(parseFloat(msg.dateTime).toFixed(0) * 1000).toLocaleString('en-US', { 
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));



  }
