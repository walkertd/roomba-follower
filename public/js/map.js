'use strict';

var pathCanvas;
var pathLayer;
var robotBodyLayer;
var textLayer;

var xOffset;
var yOffset;

var xPrevious;
var yPrevious;

var robotData = [];

var lastPhase = '';
var lastCoordinates = null;

var playbackContinuous = false;
var playbackStep = 0;

$(document).ready(function () {
  // pathLayer = document.getElementById('path_layer');
  // robotBodyLayer = document.getElementById('robot_body_layer');
  // textLayer = document.getElementById('text_layer');

  pathCanvas = $('#map_canvas');
  pathCanvas.attr('width', sizeX);
  pathCanvas.attr('height', sizeY);

  // pathLayer.width = sizeX;
  // pathLayer.height = sizeY;

  // robotBodyLayer.width = sizeX;
  // robotBodyLayer.height = sizeY;

  // textLayer.width = sizeX;
  // textLayer.height = sizeY;

  $('#sizew').val(sizeX);
  $('#sizeh').val(sizeY);

  $('#offsetx').val(xOffset);
  $('#offsety').val(yOffset);

  $('#updateevery').val(updateEvery);
  updateMissionList();
  setPlaybackButtonStatus(false);

  // pathLayerContext = pathLayer.getContext('2d');
  // robotBodyLayerContext = robotBodyLayer.getContext('2d');
  // textLayerContext = textLayer.getContext('2d');

  // pathLayerContext.beginPath();
  // pathLayerContext.lineWidth = 1;
  // pathLayerContext.strokeStyle = '#000000';
  // pathLayerContext.lineCap = 'round';
});

function updateMissionList() {
  $.get('/api/list/missions', function (result) {
    var missionList = $('#missionList');
    missionList.empty();
    result.forEach(function (element, index, array) {
      $("<option />", {
        value: element,
        text: element
      }).appendTo(missionList);
    });
    $("#missionList selected").val(result[0]);
    $('#mapStatus').text(`Found ${result.length} missions in the database.`);
  });
}

function showMission() {
  clearMap();
  var missionNumber = $('#missionList').val();
  $('#mapStatus').text(`Displaying map for mission ${missionNumber}.`);
  $.get(`/api/scale/mission/${missionNumber}`, function (data) {
    scaleMapToFitLimits(data);
  });
  $.get(`/api/records/mission/${missionNumber}`, function (data) {
    robotData = data;
    xPrevious = parseInt(data[0].pose_x, 10);
    yPrevious = parseInt(data[0].pose_y, 10);
    playbackFirst();
    $('div#playbackStepInfo').show("easing");
    setPlaybackButtonStatus(true);
  });
}

function scaleMapToFitLimits(mapLimits) {
  var requiredHeight = parseInt(mapLimits.max_pose_x, 10) - parseInt(mapLimits.min_pose_x, 10) + 50;
  var requiredWidth = parseInt(mapLimits.max_pose_y, 10) - parseInt(mapLimits.min_pose_y, 10) + 50; // height and width are swapped with x and y since the map is rotated 90 degrees
  var scaleX = Math.max(pathCanvas.attr('width') / requiredWidth, 1.0);
  var scaleY = Math.max(pathCanvas.attr('height') / requiredHeight, 1.0);
  var mapScale = Math.min(scaleX, scaleY);

  // yOffset = (requiredHeight - parseInt(mapLimits.min_pose_x, 10)) / mapScale;
  // xOffset = (requiredWidth - parseInt(mapLimits.min_pose_y, 10)) / mapScale; 

  // tx = height - y_pos - yoffset;
  // ty = width - x_pos - xoffset;
  // yoffset = tx - height + y_pos;
  yOffset = Math.abs(Math.min(parseInt(mapLimits.min_pose_y, 10), 0));
  // xoffset = ty - width + x_pos; 
  xOffset = Math.abs(Math.min(parseInt(mapLimits.min_pose_x, 10), 0));

  $('#offsety').val(yOffset);
  $('#offsetx').val(xOffset);

  // var requiredWidth = parseInt(mapLimits.max_pose_x, 10) - parseInt(mapLimits.min_pose_x, 10) + 100;
  // var requiredHeight = parseInt(mapLimits.max_pose_y, 10) - parseInt(mapLimits.min_pose_y, 10) + 100;
  // var maxWidth = Math.max(sizeX, requiredWidth);
  // var maxHeight = Math.max(sizeY, requiredHeight);
  // var widthScale = sizeX / maxWidth;
  // var heightScale = sizeY / maxHeight;
  // mapScale = Math.max(widthScale, heightScale);
  // pathLayerContext.scale(mapScale, mapScale);
  // robotBodyLayerContext.scale(mapScale, mapScale);
  // textLayerContext.scale(mapScale, mapScale);
  // console.log(`Scaling to ${mapScale}`);
}

function setPlaybackButtonStatus(buttonStatus) {
  $('#playbackFirstButton').attr("disabled", !buttonStatus);
  $('#playbackReverseButton').attr("disabled", !buttonStatus);
  $('#playbackPauseButton').attr("disabled", !buttonStatus);
  $('#playbackForwardButton').attr("disabled", !buttonStatus);
  $('#playbackLastButton').attr("disabled", !buttonStatus);
  $('#playbackStepBackButton').attr("disabled", !buttonStatus);
  $('#playbackStepForwardButton').attr("disabled", !buttonStatus);
}

function playbackFirst() {
  playbackContinuous = false;
  playbackStep = 1;
  updateStep();
}

function playbackLast() {
  playbackContinuous = false;
  playbackStep = robotData.length;
  updateStep();
}

function playbackPause() {
  playbackContinuous = false;
}

function playbackForward(repeat) {
  if (repeat != null)
    playbackContinuous = repeat;
  else if (repeat == null && playbackContinuous == false)
    return;
  if (playbackStep < robotData.length) {
    playbackStep = playbackStep + 1;
    updateStep();
    if (playbackContinuous) {
      setTimeout(playbackForward, updateEvery);
    }
  }
}

function playbackReverse(repeat) {
  if (repeat != null)
    playbackContinuous = repeat;
  else if (repeat == null && playbackContinuous == false)
    return;
  if (playbackStep > 1) {
    playbackStep = playbackStep - 1;
    updateStep();
    if (playbackContinuous) {
      setTimeout(playbackReverse, updateEvery);
    }
  }
}

function updateStep() {
  $('#playbackCurrentStep').val(playbackStep);
  $('#playbackTotalSteps').val(robotData.length);

  var record = robotData[playbackStep - 1];

  $('#mapStatus').html(`Drawing step ${playbackStep} of ${robotData.length}`);
  $('#missionNum').html(record.mission_number);
  $('#missionStep').html(playbackStep);
  $('#missionTime').html(record.elapsed_time);
  $('#initiator').html(record.initiator);
  $('#cycle').html(record.cycle);
  $('#phase').html(record.phase);
  $('#batPct').html(record.battery_percent);
  $('#error').html(record.error);
  $('#sqft').html(record.area_cleaned);
  $('#expireM').html(record.expirem);
  $('#rechrgM').html(record.rechrgm);
  $('#notReady').html(record.notready);
  $('#theta').html(record.pose_theta);
  $('#x').html(record.pose_x);
  $('#y').html(record.pose_y);
  $('#binfull').html(record.bin_full.toString());
  $('#binpresent').html(record.bin_present.toString());

  drawStep(
    record.pose_x,
    record.pose_y,
    record.pose_theta,
    record.cycle,
    record.phase
  );

}

function coordinateTranslate(x, y) {
  x = pathCanvas.attr('width') - (parseInt(x, 10) + xOffset);
  y = (parseInt(y, 10) + yOffset);
  // var oldX = x;

  // x = 100; y = 100;

  // // rotate
  // x = y;
  // y = pathLayer.height - oldX;
  // x = pathLayer.width - x; 

  return { x: x, y: y };
}

function checkForTeleportation(x, y) {
  var distance = Math.sqrt(Math.pow(xPrevious - x, 2) + Math.pow(yPrevious - y, 2));
  xPrevious = x;
  yPrevious = y;
  return distance > 100;
}

function drawStep(x, y, theta, cycle, phase) {
  if (phase === 'charge') {
    // hack (getMission() dont send x,y if phase is diferent as run)
    x = 0;
    y = 0;
  }

  var isTeleporting = checkForTeleportation(x, y);

  var coordinates = coordinateTranslate(x, y);
  x = coordinates.x;
  y = coordinates.y;

  drawRobotBody(x, y, theta);

  // draw changes in status with text.
  if (phase !== lastPhase) {
    drawStatusText(x, y, phase);
    lastPhase = phase;
  } else {
    if (!isTeleporting) {
      if (lastCoordinates != null) {
        pathCanvas.drawLine({
          strokeStyle: '#000000',
          strokeWidth: 1,
          x1: lastCoordinates.x, y1: lastCoordinates.y,
          x2: x, y2: y,
          layer: true
        });
      }
    }
    lastCoordinates = {
      x: x,
      y: y
    };
  }
  pathCanvas.drawLayers();
}

function drawStatusText(x, y, phase) {
  //pathCanvas.removeLayer('textLayer');

  pathCanvas.drawText({
    fillStyle: 'blue',
    fontSize: 12,
    fontFamily: 'Calibri',
    x: x,
    y: y,
    text: phase,
    layer: true,
    name: 'textLayer'
  });

}

function drawRobotBody(x, y, theta) {
  theta = parseInt(theta, 10);

  var radius = 25;

  pathCanvas.removeLayer('robotBodyCircle');
  pathCanvas.removeLayer('robotBodyDirection');

  pathCanvas.drawArc({
    groups: ['robotBody'],
    x: x,
    y: y,
    radius: radius,
    fillStyle: 'green',
    strokeStyle: '#003300',
    strokeWidth: 3,
    layer: true,
    name: 'robotBodyCircle'
  }).drawVector({
    groups: ['robotBody'],
    strokeStyle: '#003300',
    strokeWidth: 3,
    x: x, y: y,
    a1: theta, l1: radius,
    layer: true,
    name: 'robotBodyDirection'
  });

}

function clearMap() {
  lastPhase = '';
  // console.log(pathCanvas);
  pathCanvas.clearCanvas();

  pathCanvas.removeLayers();

  pathLayer = null;
  robotBodyLayer = null;
  textLayer = null;
  lastCoordinates = null;

  // pathLayerContext.clearRect(0, 0, pathLayer.width, pathLayer.height);
  // robotBodyLayerContext.clearRect(0, 0, robotBodyLayer.width, robotBodyLayer.height);
  // textLayerContext.clearRect(0, 0, textLayer.width, textLayer.height);
  // pathLayerContext.beginPath();
  // robotBodyLayerContext.scale(1, 1);
  // textLayerContext.scale(1, 1);
  // pathLayerContext.scale(1, 1);
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

function shiftCanvas(ctx, w, h, dx, dy) {
  var imageData = ctx.getImageData(0, 0, w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.putImageData(imageData, dx, dy);
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

$('#updateevery').on('change', function () {
  updateEvery = getValue('#updateevery', updateEvery);
});

