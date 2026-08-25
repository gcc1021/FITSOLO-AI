(function () {
  'use strict';

  var canvas = document.getElementById('landingRings');
  var landing = document.getElementById('landingScreen');
  if (!canvas || !landing) return;

  var context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var frameId = 0;
  var width = 0;
  var height = 0;
  var pixelRatio = 1;
  var resizeQueued = false;
  var animationSeconds = 0;
  var previousTimestamp = 0;
  var proximity = 0;
  var proximityTarget = 0;
  var enterButton = document.getElementById('enterButton');

  function resize() {
    var bounds = landing.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function draw(timestamp) {
    var delta = previousTimestamp ? Math.min(40, timestamp - previousTimestamp) * 0.001 : 0;
    previousTimestamp = timestamp;
    proximity += (proximityTarget - proximity) * Math.min(1, delta * 7);
    animationSeconds += delta * (1 + proximity * 1.45);
    var seconds = reducedMotion.matches ? 0 : animationSeconds;
    var centerX = width * 0.5;
    var centerY = height * 0.54;
    var baseRadius = Math.min(width, height) * 0.205;
    var maxRadius = Math.hypot(width, height) * 0.48;
    var spacing = Math.max(62, Math.min(width, height) * 0.105);
    var travel = spacing * 1.7;
    var progress = reducedMotion.matches ? 0.32 : (seconds * 0.09) % 1;
    var breathe = reducedMotion.matches ? 0 : Math.sin(seconds * 0.9) * 5;
    var ringCount = Math.ceil((maxRadius - baseRadius) / spacing) + 3;

    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    for (var index = 0; index < ringCount; index += 1) {
      var radius = baseRadius + index * spacing + progress * travel + breathe;
      if (radius > maxRadius + spacing) continue;
      var normalized = (radius - baseRadius) / Math.max(1, maxRadius - baseRadius);
      var edgeFade = Math.max(0, 1 - normalized);
      var pulse = 0.72 + Math.sin(seconds * 0.62 - index * 0.54) * 0.28;
      var alpha = reducedMotion.matches ? 0.085 : (0.035 + edgeFade * 0.075) * pulse;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(244, 242, 234, ' + alpha.toFixed(3) + ')';
      context.stroke();
    }

    var haloRadius = baseRadius * (1.35 + (reducedMotion.matches ? 0 : Math.sin(seconds * 0.58) * 0.025));
    var gradient = context.createRadialGradient(centerX, centerY, baseRadius * 0.4, centerX, centerY, haloRadius);
    gradient.addColorStop(0, 'rgba(215, 255, 69, 0.018)');
    gradient.addColorStop(0.72, 'rgba(215, 255, 69, 0.032)');
    gradient.addColorStop(1, 'rgba(215, 255, 69, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, haloRadius, 0, Math.PI * 2);
    context.fill();

    if (!reducedMotion.matches && !document.hidden && !document.body.classList.contains('has-entered')) {
      frameId = window.requestAnimationFrame(draw);
    } else {
      frameId = 0;
    }
  }

  function start() {
    if (frameId || document.hidden || document.body.classList.contains('has-entered')) return;
    previousTimestamp = 0;
    frameId = window.requestAnimationFrame(draw);
  }

  function stop() {
    if (!frameId) return;
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function renderStill() {
    stop();
    draw(0);
  }

  resize();
  reducedMotion.matches ? renderStill() : start();

  window.addEventListener('resize', function () {
    if (resizeQueued) return;
    resizeQueued = true;
    window.requestAnimationFrame(function () {
      resizeQueued = false;
      resize();
      reducedMotion.matches ? renderStill() : start();
    });
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  reducedMotion.addEventListener('change', function () {
    reducedMotion.matches ? renderStill() : start();
  });

  landing.addEventListener('pointermove', function (event) {
    if (reducedMotion.matches) return;
    var bounds = enterButton.getBoundingClientRect();
    var centerX = bounds.left + bounds.width * 0.5;
    var centerY = bounds.top + bounds.height * 0.5;
    var distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    var influence = Math.max(0, 1 - distance / 300);
    proximityTarget = influence * influence;
  }, { passive: true });

  landing.addEventListener('pointerleave', function () {
    proximityTarget = 0;
  }, { passive: true });

  document.getElementById('enterButton').addEventListener('click', stop);
  function resumeAfterLandingReturn() {
    window.setTimeout(start, 0);
  }

  document.getElementById('backButton').addEventListener('click', resumeAfterLandingReturn);
  document.getElementById('brandBackButton').addEventListener('click', resumeAfterLandingReturn);
})();
