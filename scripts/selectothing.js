// different easings for how its being dragged
// need a function that runs inside an event loop (while depressed)
// that checks to see if the user has scrolled but the y position hasnt moved,
//i.e. they are at the top of the window. if so, fire off a scroll call to scroll.

// I think onece the mouse has been depressed and hits the bottom, just have it scroll quickly till the user releases the button.

var SELECTED_CLASS = 'selected';
var SELECTED_REGEXP = new RegExp(SELECTED_CLASS);
var SCROLL_INCREMENT = 5;
var direction = null;

var SCROLL_OFFSET_SLOW = 25;
var SCROLL_OFFSET_FAST = screenHeight() / 4;

var SCROLL_SPEED_FAST = 10;
var SCROLL_SPEED_MEDIUM = 500;
var SCROLL_SPEED_SLOW = 1500;

var DIRECTION_UP = 'up';
var DIRECTION_DOWN = 'down';


var mouseIsDown = false;
var dragging = false;
var point = null;
var lastY = 0;
var scrollIntent = null;

var scrolledDistance;
var animationInterval;
// querySelectorAll returns a node list object, xform it into a standard array
var selectableList = [].slice.call(document.querySelectorAll('.selectable'), 0);

// Every time a new spot is clicked, until mouse is
// released, we will create a new startVector object.
var startVector = null;

var pageHeight = document.body.offsetHeight;
var pageWidth = document.body.offsetWidth;

/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
var easingFunctions = {
  // no easing, no acceleration
  linear: function (t) { return t; },
  // accelerating from zero velocity
  easeInQuad: function (t) { return t * t; },
  // decelerating to zero velocity
  easeOutQuad: function (t) { return t * (2 - t); },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
  // accelerating from zero velocity
  easeInCubic: function (t) { return t * t * t; },
  // decelerating to zero velocity
  easeOutCubic: function (t) { return (--t) * t * t + 1; },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function (t) { return t<.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },
  // accelerating from zero velocity
  easeInQuart: function (t) { return t * t * t * t; },
  // decelerating to zero velocity
  easeOutQuart: function (t) { return 1 - (--t) * t * t * t; },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - 8 *(--t) * t * t * t; },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t * t * t * t * t },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1 + (--t) * t * t * t * t },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function (t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t; },

  list: function() {
    return Object.keys(this);
  }
};


function isPageBottom() {
  return scrollTop() === (scrollHeight() - screenHeight());
}

function isPageTop() {
  return scrollTop() === 0;
}

// Is the user attempting to scroll past the bottom or top of the page?
function outOfPageBounds() {
  return scrollTop() > scrollHeight() || scrollTop() < 0;
}


function screenHeight() {
  return window.innerHeight;
}

function scrollTop() {
  return document.body.scrollTop;
}

var scrollHeight = function () {
  var height = null;

  return function() {
    if (height) {
      return height;
    }

    height = document.body.scrollHeight;

    return height;
  };
}();

function mouseMoveListener() {
  document.addEventListener('mousemove', onMouseMove);
}


function init() {
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
}

init();

function cleanup() {
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mousemove', onMouseMove);
}


function cancelAnimation() {
  isAnimating = false;
  clearInterval(animationInterval);
  animationInterval = null;
}

function onMouseDown(event) {
  event.preventDefault();

  mouseIsDown = true;

  mouseMoveListener();

  document.body.className = 'drag';

  var y = event.pageY,
      x = event.x;

  makeClickPoint(x, y);
  startVector = new Vector(x, y);
}

function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove);

  mouseIsDown = false;
  dragging = false;

  if (isAnimating) {
    cancelAnimation();
  }

  if (scrollIntent) {
    scrollIntent = null;
    cancelAnimation();
  }

  document.body.className = '';

  startVector = null;
  removePoint();
}

function onMouseMove(event) {
  if (!mouseIsDown) {
    return;
  }

  event.preventDefault();

  var x = event.x,
      y = event.y;


  if (!dragging) {
    dragging = true;
  }

  // if (!scrollIntent && y < 0) {
  //   scrollIntent = true;
  //   startAnimation(lastY, 0, 5000);
  // }

  setMouseDirection(y);
  shouldSelect();

  if ((y + scrollTop()) < scrollHeight()) {
    shouldScroll(y);
  }

  updatePoint(x, y);
}

function shouldScroll(yPos) {
  if (outOfPageBounds()) {
    return;
  }

  var speed = SCROLL_SPEED_SLOW;
  var easing = 'easeOutQuint';

 if (!isAnimating) {
    var startLocation = window.pageYOffset;
    var endLocation;

    if (direction === DIRECTION_UP && (yPos < 200)) {
      if (yPos < 20) {
        endLocation = startLocation - SCROLL_OFFSET_FAST;
        speed = SCROLL_SPEED_FAST;
        easing = 'linear';
      }
      endLocation = startLocation - SCROLL_OFFSET_SLOW;
    } else if (direction === DIRECTION_DOWN && (yPos > (screenHeight() - 200))) {
      if (yPos > screenHeight() - 20) {
        endLocation = startLocation + SCROLL_OFFSET_FAST;
        speed = SCROLL_SPEED_FAST;
        easing = 'linear';
      }
      endLocation = startLocation + SCROLL_OFFSET_SLOW;
    } else {
      return;
    }

    startAnimation(startLocation, endLocation, speed, easing);
  }
}

function setMouseDirection(newY) {
  direction = (lastY < (newY + scrollTop())) ? DIRECTION_DOWN : DIRECTION_UP;
}

var isAnimating = false;

function startAnimation(start, end, speed, easing) {
  var currentLocation  = start;
  var timeElapsed = 0;
  var distance = end - start;
  isAnimating = true;

  speed = speed || 200;
  easing = easingFunctions[easing] || easingFunctions.easeInOutCubic;


  function onTick() {
    // this statement is too complicated and can be simplified, not sure how yet.
    if (((currentLocation >= end) && distance > 0) ||
        ((currentLocation <= end) && distance < 0) ||
         currentLocation === 0 && distance < 0 ||
         currentLocation === end) {

      cancelAnimation();
    } else {

      timeElapsed += 16;
      var percentage = timeElapsed / parseInt(speed, 10);
      percentage = percentage > 1 ? 1 : percentage;
      var position = currentLocation + (distance * easing(percentage));
      window.scrollTo(0, position | 0);
      currentLocation = window.pageYOffset;
    }
    lastY = window.pageYOffset;
  }

  animationInterval = setInterval(onTick, 16);
}

// super naive axis aligned bounding box check.
function hasCollision(a, b) {
  var rect1 = a.getBoundingClientRect(),
      rect2 = b.getBoundingClientRect();

  var result = false;

  if (rect1.left < rect2.left + rect2.width &&
      rect1.left + rect1.width > rect2.left &&
      rect1.top < rect2.top + rect2.height  &&
      rect1.height + rect1.top > rect2.top) {

    result = true;
  }

  rect1 = null;
  rect2 = null;

  return result;
}

function hasSelected(node) {
  return (SELECTED_REGEXP.test(node.className));
}


// Loops through all selectable items on the page on every mousemove to see if something
// should be selected.  actually seems not terribly unperformant, at least 
// not with ~400 selectable items on the page.
function shouldSelect() {
  var selected = [];
  var unselected = [];

  selectableList.forEach(function(item) {
    if (hasCollision(point, item)) {

      if (hasSelected(item)) {
        return;
      }

      selected.push(item);
    } else {
      unselected.push(item)
    }
    item = null;
  });

  window.requestAnimationFrame(function() {
    selected.forEach(function(item) {
      item.className = item.className + ' ' + SELECTED_CLASS;
    });
    selected.length = 0;
    selected = null;
  });

  window.requestAnimationFrame(function() {
    unselected.forEach(function(item) {
      item.className = item.className.replace(' ' + SELECTED_CLASS, '');
    });
    unselected.length = 0;
    unselected = null;
  });
}

function makeClickPoint(x, y) {
  var isPoint = document.querySelector('.click-point');

  point = isPoint ? isPoint : document.createElement('span');
  point.className = 'click-point ripple';
  point.style.top  = y + 'px';
  point.style.left = x + 'px';
  point.style.position = 'absolute';

  document.body.appendChild(point);

  lastY = y;
}

function removePoint() {
  if (!point) {
    return;
  }

  document.body.removeChild(point);
  point = null;
}

function updatePoint(newX, newY) {
  if (newY <= 0 && isPageTop() || newY > pageHeight) {
    return;
  }

  newY = newY + scrollTop();

  if (newX < startVector.x) {
    point.style.left = newX + 'px';
  }

  if (newY < startVector.y) {
    point.style.top = newY < 0 ? 0 : newY + 'px';
  }

  newX = clampX(newX);

  if (newY > pageHeight) {
    newY = scrollHeight();
  } else if (newY < 0) {
    newY = point.style.paddingTop + startVector.y;
  }

  point.style.padding = Math.abs(newY - startVector.y) + 'px 0px 0px ' + Math.abs(newX - startVector.x) + 'px';
}

function Vector(x,y) {
  this.x = x;
  this.y = y;
}

function clampX(value) {
  return value > pageWidth ? pageWidth : value;
}

function debounce(interval, callback) {
  var lastCall = +new Date;

  return function() {
    var thisCall = +new Date;

    if (thisCall - lastCall >= interval) {
      lastCall = thisCall;
      thisCall = null;
      callback.apply(null, arguments);
    }
  };
}

