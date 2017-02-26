'use strict';
window.onload = startApp;

var pathLayerContext;
var robotBodyLayerContext;
var textLayerContext;

var pathLayer;
var robotBodyLayer;
var textLayer;

var records;

var lastPhase = '';
var mapping = true;

function startApp() {
  pathLayer = document.getElementById('path_layer');
  robotBodyLayer = document.getElementById('robot_body_layer');
  textLayer = document.getElementById('text_layer');

  pathLayer.width = sizeX;
  pathLayer.height = sizeY;

  records = 0;

  robotBodyLayer.width = sizeX;
  robotBodyLayer.height = sizeY;

  textLayer.width = sizeX;
  textLayer.height = sizeY;

  $('#sizew').val(sizeX);
  $('#sizeh').val(sizeY);

  $('#offsetx').val(xOffset);
  $('#offsety').val(yOffset);

  $('#updateevery').val(updateEvery);
  updateMissionList();
  startMissionLoop();

  pathLayerContext = pathLayer.getContext('2d');
  robotBodyLayerContext = robotBodyLayer.getContext('2d');
  textLayerContext = textLayer.getContext('2d');

  pathLayerContext.beginPath();
  pathLayerContext.lineWidth = 1;
  pathLayerContext.strokeStyle = '#000000';
  pathLayerContext.lineCap = 'round';
}

function updateMissionList() {
  $.get('/api/list/missions', function (result) {
    var missionList = $('#missionList');
    missionList.empty();
    result.forEach(function(element, index, array) {
      $("<option />", {
        value: element,
        text: element
      }).appendTo(missionList);
    });
    $("#missionList selected").val(result[0]);
    $('#mapStatus').text(`Found ${result.length} missions in the database.`);
    // $('#missionList').on('input', function(e) {
    //   var selected = $(this).val();
    //   $('#mapStatus').text(`Selected mission ${selected}`);
    // });
  });
}

function showMission() {

}

function startMissionLoop() {
  if (mapping) {
    $('#mapStatus').html('starting mission loop...');
    $.get('/api/local/info/mission', function (data) {
      messageHandler(data);
      setTimeout(startMissionLoop, updateEvery);
    });
  } else {
    $('#mapStatus').html('stopped');
  }
}

function addMissionData(msg) {
  records = records + 1;

  var table = $('#missiondata').DataTable();
  table.row.add([
    records,
    msg.cleanMissionStatus.cycle,
    msg.cleanMissionStatus.phase,
    msg.cleanMissionStatus.expireM,
    msg.cleanMissionStatus.rechrgM,
    msg.cleanMissionStatus.error,
    msg.cleanMissionStatus.notReady,
    msg.cleanMissionStatus.mssnM,
    msg.cleanMissionStatus.sqft,
    msg.cleanMissionStatus.initiator,
    msg.cleanMissionStatus.nMssn,
    msg.pose.theta,
    msg.pose.point.x,
    msg.pose.point.y,
    msg.bin.present,
    msg.bin.full
  ]).draw(false);


}

function messageHandler(msg) {
  // msg is the object returned by dorita980.getMission() promise.

  addMissionData(msg);

  // msg.ok.time = new Date().toISOString();
  $('#mapStatus').html('drawing...');
  $('#last').html(records);
  $('#missionNum').html(msg.cleanMissionStatus.nMssn);
  $('#missionTime').html(msg.cleanMissionStatus.mssnM);
  $('#cycle').html(msg.cleanMissionStatus.cycle);
  $('#phase').html(msg.cleanMissionStatus.phase);
  $('#flags').html(msg.cleanMissionStatus.flags);
  $('#batPct').html(msg.cleanMissionStatus.batPct);
  $('#error').html(msg.cleanMissionStatus.error);
  $('#sqft').html(msg.cleanMissionStatus.sqft);
  $('#expireM').html(msg.cleanMissionStatus.expireM);
  $('#rechrgM').html(msg.cleanMissionStatus.rechrgM);
  $('#notReady').html(msg.cleanMissionStatus.notReady);
  $('#theta').html(msg.pose.theta);
  $('#x').html(msg.pose.point.x);
  $('#y').html(msg.pose.point.y);

  drawStep(
    msg.pose.point.x,
    msg.pose.point.y,
    msg.pose.theta,
    msg.cleanMissionStatus.cycle,
    msg.cleanMissionStatus.phase
  );
}

function drawStep(x, y, theta, cycle, phase) {
  if (phase === 'charge') {
    // hack (getMission() dont send x,y if phase is diferent as run)
    x = 0;
    y = 0;
  }

  x = parseInt(x, 10) + xOffset;
  y = parseInt(y, 10) + yOffset;
  var oldX = x;

  // rotate
  x = y;
  y = pathLayer.height - oldX;
  x = pathLayer.width - x;

  drawRobotBody(x, y, theta);

  // draw changes in status with text.
  if (phase !== lastPhase) {
    textLayerContext.font = 'normal 12pt Calibri';
    textLayerContext.fillStyle = 'blue';
    textLayerContext.fillText(phase, x, y);
    lastPhase = phase;
  } else {
    pathLayerContext.lineTo(x, y);
    pathLayerContext.stroke();
  }
}

function drawRobotBody(x, y, theta) {
  theta = parseInt(theta, 10);
  var radio = 15;
  robotBodyLayerContext.clearRect(0, 0, robotBodyLayer.width, robotBodyLayer.height);
  robotBodyLayerContext.beginPath();
  robotBodyLayerContext.arc(x, y, radio, 0, 2 * Math.PI, false);
  robotBodyLayerContext.fillStyle = 'green';
  robotBodyLayerContext.fill();
  robotBodyLayerContext.lineWidth = 3;
  robotBodyLayerContext.strokeStyle = '#003300';
  robotBodyLayerContext.stroke();

  var outerX = x + radio * Math.cos((theta - 90) * (Math.PI / 180));
  var outerY = y + radio * Math.sin((theta - 90) * (Math.PI / 180));

  robotBodyLayerContext.beginPath();
  robotBodyLayerContext.moveTo(x, y);
  robotBodyLayerContext.lineTo(outerX, outerY);
  robotBodyLayerContext.strokeStyle = '#003300';
  robotBodyLayerContext.lineWidth = 3;
  robotBodyLayerContext.stroke();
}

function clearMap() {
  lastPhase = '';
  pathLayerContext.clearRect(0, 0, pathLayer.width, pathLayer.height);
  robotBodyLayerContext.clearRect(0, 0, robotBodyLayer.width, robotBodyLayer.height);
  textLayerContext.clearRect(0, 0, textLayer.width, textLayer.height);
  pathLayerContext.beginPath();
}

function toggleMapping() {
  mapping = !mapping;
  if (mapping) startMissionLoop();
}

function getValue(name, actual) {
  var newValue = parseInt($(name).val(), 10);
  if (isNaN(newValue)) {
    alert('Invalid ' + name);
    $(name).val(actual);
    return actual;
  }
  return newValue;
}

function downloadCanvas() {
  var bodyCanvas = document.getElementById('robot_body_layer');
  var pathCanvas = document.getElementById('path_layer');

  var bodyContext = bodyCanvas.getContext('2d');
  bodyContext.drawImage(pathCanvas, 0, 0);

  document.getElementById('download').href = bodyCanvas.toDataURL();
  document.getElementById('download').download = 'current_map.png';
}

function shiftCanvas(ctx, w, h, dx, dy) {
  var imageData = ctx.getImageData(0, 0, w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.putImageData(imageData, dx, dy);
}

function saveValues() {
  var values = {
    'offsetX': getValue('#offsetx', xOffset),
    'offsetY': getValue('#offsety', yOffset),
    'sizeW': getValue('#sizew', pathLayer.width),
    'sizeH': getValue('#sizeh', pathLayer.height),
    'pointIntervalMs': updateEvery
  };
  $.post('/map/values', values, function (data) {
  });
}

$('.metrics').on('change', function () {
  var w = getValue('#sizew', pathLayer.width);
  var h = getValue('#sizeh', pathLayer.height);
  if (pathLayer.width !== w) {
    pathLayerContext.beginPath();
    shiftCanvas(textLayerContext, w, h, (w - pathLayer.width), 0);
    shiftCanvas(pathLayerContext, w, h, (w - pathLayer.width), 0);
    var imgDataW = pathLayerContext.getImageData(0, 0, pathLayer.width, pathLayer.height);
    var imgDataT1 = textLayerContext.getImageData(0, 0, textLayer.width, textLayer.height);
    pathLayer.width = w;
    robotBodyLayer.width = w;
    textLayer.width = w;
    pathLayerContext.putImageData(imgDataW, 0, 0);
    textLayerContext.putImageData(imgDataT1, 0, 0);
  }

  if (pathLayer.height !== h) {
    pathLayerContext.beginPath();
    shiftCanvas(textLayerContext, w, h, 0, (h - pathLayer.height));
    shiftCanvas(pathLayerContext, w, h, 0, (h - pathLayer.height));
    var imgDataH = pathLayerContext.getImageData(0, 0, pathLayer.width, pathLayer.height);
    var imgDataT2 = textLayerContext.getImageData(0, 0, textLayer.width, textLayer.height);
    pathLayer.height = h;
    robotBodyLayer.height = h;
    textLayer.height = h;
    pathLayerContext.putImageData(imgDataH, 0, 0);
    textLayerContext.putImageData(imgDataT2, 0, 0);
  }

  var newYOffset = getValue('#offsety', yOffset);
  if (newYOffset !== yOffset) {
    pathLayerContext.beginPath();
    shiftCanvas(pathLayerContext, w, h, (yOffset - newYOffset), 0);
    shiftCanvas(textLayerContext, w, h, (yOffset - newYOffset), 0);
    yOffset = newYOffset;
  }
  var newXOffset = getValue('#offsetx', xOffset);
  if (newXOffset !== xOffset) {
    pathLayerContext.beginPath();
    shiftCanvas(pathLayerContext, w, h, 0, (xOffset - newXOffset));
    shiftCanvas(textLayerContext, w, h, 0, (xOffset - newXOffset));
    xOffset = newXOffset;
  }
});

$('.action').on('click', function () {
  var me = $(this);
  var path = me.data('action');
  me.button('loading');
  $.get(path, function (data) {
    me.button('reset');
    $('#apiresponse').html(JSON.stringify(data));
  });
});

$('#updateevery').on('change', function () {
  updateEvery = getValue('#updateevery', updateEvery);
});

