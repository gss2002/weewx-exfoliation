var client;
var lastMsg;

var mqttCandidates = [];
var mqttIndex = 0;

function buildCandidates() {
  if (window.location.hostname === "wx.senia.org") {
    // wx.senia.org behavior (single backend)
    if (window.location.protocol === "https:") {
      mqttCandidates = [{ host: "wxgen.senia.org", port: 443, useSSL: true,  uri: "/wss/" }];
    } else {
      mqttCandidates = [{ host: "wxgen.senia.org", port: 80,  useSSL: false, uri: "/ws/"  }];
    }
  } else {
    // Public brokers: try Mosquitto first, then HiveMQ
    if (window.location.protocol === "https:") {
      mqttCandidates = [
        { host: "test.mosquitto.org",  port: 8081, useSSL: true, uri: "/mqtt" },
        { host: "broker.hivemq.com",   port: 8884, useSSL: true, uri: "/mqtt" }
      ];
    } else {
      mqttCandidates = [
        { host: "test.mosquitto.org",  port: 8080, useSSL: false, uri: "/mqtt" },
        { host: "broker.hivemq.com",   port: 8000, useSSL: false, uri: "/mqtt" }
      ];
    }
  }
}

function connectAttempt(index) {
  mqttIndex = index || 0;

  if (mqttIndex >= mqttCandidates.length) {
    console.log("❌ All MQTT brokers failed");
    return;
  }

  var cfg = mqttCandidates[mqttIndex];
  console.log("🔌 Trying MQTT:", cfg.host + ":" + cfg.port + cfg.uri, "SSL=" + cfg.useSSL);

  // Create a NEW client per attempt (cleanest for Paho)
  client = new Paho.MQTT.Client(
    cfg.host,
    cfg.port,
    cfg.uri,
    "web_" + parseInt(Math.random() * 100000, 10)
  );

  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  var options = {
    useSSL: cfg.useSSL,
    timeout: 5,
    onSuccess: onConnect,
    onFailure: function (e) {
      console.log("❌ Connect failed:", cfg.host, e && e.errorMessage ? e.errorMessage : e);
      // try next broker
      connectAttempt(mqttIndex + 1);
    }
  };

  client.connect(options);
}

// called when the client connects
function onConnect() {
  console.log("✅ Connected");
  client.subscribe("wx.senia.org/weather/loop");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject && responseObject.errorCode !== 0) {
    console.log("⚠️ onConnectionLost:", responseObject.errorMessage);
  }

  // Try reconnect to the SAME broker first. If that fails, failover.
  var cfg = mqttCandidates[mqttIndex];
  var options = {
    useSSL: cfg.useSSL,
    timeout: 5,
    onSuccess: onConnect,
    onFailure: function (e) {
      console.log("❌ Reconnect failed:", cfg.host, e && e.errorMessage ? e.errorMessage : e);
      connectAttempt(mqttIndex + 1);
    }
  };

  // If Paho thinks it's still connected, disconnect before reconnecting
  try { client.disconnect(); } catch (err) {}

  // small delay helps avoid immediate reconnect loops
  setTimeout(function () {
    try {
      client.connect(options);
    } catch (err) {
      console.log("❌ Exception during reconnect:", err);
      connectAttempt(mqttIndex + 1);
    }
  }, 1000);
}

// called when a message arrives
function onMessageArrived(message) {
  var msg = JSON.parse(message.payloadString);
  $('#temp').text(parseFloat(msg.outTemp_F).toFixed(1));
  $('#windspeed').text(parseFloat(msg.windSpeed_mph).toFixed(0));
  $('#maxWindCurent.metric_value').text(parseFloat(msg.windGust_mph).toFixed(0));
  $('#humidity').text(parseFloat(msg.outHumidity).toFixed(1));
  $('#windchill').text(parseFloat(msg.windchill_F).toFixed(1));
  if (typeof msg.windDir != 'undefined') {
    $('#windDirOrdinal').text(Windrose.getPoint(msg.windDir, { depth: 2 }).symbol);
    $('#windDir').html(parseFloat(msg.windDir).toFixed(0) + "&deg;");
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
  $('#dailyrain').text(parseFloat(msg.dayRain_in).toFixed(2) + " in");
  $('#stormRainTotal').text(parseFloat(msg.stormRain_in).toFixed(2) + " in");
  $('#current_rainrate').text(parseFloat(msg.rainRate_inch_per_hour).toFixed(2) + " in/hr");
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

// ---- start it up ----
buildCandidates();
connectAttempt(0);
