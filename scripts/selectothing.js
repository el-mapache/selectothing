var SELECTED_CLASS = 'selected';
var SCROLL_INCREMENT = 20;
var TOLERANCE = 0.95;
var direction = null;

var mouseIsDown = false;
var dragging = false;
var point = null;
// querySelectorAll returns a node list object, xform it into a standard array
var selectableList = [].slice.call(document.querySelectorAll('.selectable'), 0);

// Every time a new spot is clicked, until mouse is
// released, we will create a new startVector object.
var startVector = null;

var pageHeight = document.body.offsetHeight;

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

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('mousemove', onMouseMove);

function cleanup() {
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mousemove', onMouseMove);
}

function onMouseDown(event) {
  event.preventDefault();

  mouseIsDown = true;
  log('mouse is down at ' + event.x + ', ' + event.y, mouseIsDown);

  document.body.className = 'drag';

  var y = event.pageY,
      x = event.x;

  makeClickPoint(x, y);
  startVector = new Vector(x, y);
}

function onMouseUp(event) {
  event.preventDefault();

  mouseIsDown = false;
  dragging = false;

  log('mouse is up.', mouseIsDown);

  document.body.className = '';
  totalScroll = 0;

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

  dragging = true;

  shouldSelect(x, y);

  if ((event.y + scrollTop() < scrollHeight())) {
    shouldScroll(x,y);
  }


  if (scrollTop() && (y > (TOLERANCE * screenHeight()))) {
    var yy = null;
    if (event.pageY > scrollHeight()) {
      yy = scrollHeight;
    }
    updatePoint(x, Math.abs(yy - scrollTop()));
  } else {
    updatePoint(x, y);
  }

  log(selectableList.filter(function(item) {
    return hasSelected(item);
  }).length + ' items selected.');
}


function shouldScroll(yPos) {
  var screenHeight = window.innerHeight;
  var yTolerance = TOLERANCE * screenHeight;

  if (yPos < yTolerance) {
  	console.log('within tolerance', yPos, yTolerance)
    return;
  }


  if (scrollTop() < (scrollHeight() - screenHeight)) {
    window.scrollBy(0, SCROLL_INCREMENT);
  }
}

function scrollUp() {
  direction = 'up';
}

function scrollDown() {
  direction = 'down';
}

function hasCollision(a, b) {
  var rect1 = a.getBoundingClientRect();
  var rect2 = b.getBoundingClientRect();
  // cache results of b so i dont have to query the dom every time i scroll
  // over the same element.

  if (rect1.left < rect2.left + rect2.width &&
      rect1.left + rect1.width > rect2.left &&
      rect1.top < rect2.top + rect2.height &&
      rect1.height + rect1.top > rect2.top) {
    return true;
  }

  return false;
}

function hasSelected(node) {
  return (new RegExp(SELECTED_CLASS).test(node.className));
}

function shouldSelect(x, y) {
  selectableList.forEach(function(item) {
    if (hasCollision(point, item)) {

      if (hasSelected(item)) {
        return;
      }

      item.className = item.className + ' ' + SELECTED_CLASS;
    } else {
      item.className = item.className.replace(' ' + SELECTED_CLASS, '');
    }
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
}

function removePoint() {
  document.body.removeChild(point);
  point = null;
}

function updatePoint(newX, newY) {
  newY = newY + scrollTop();

  if (newX < startVector.x) {
    point.style.left = newX + 'px';
  }

  if (newY < startVector.y) {
    point.style.top = newY + 'px';
  }

  point.style.paddingRight = Math.abs(newX - startVector.x) + 'px';
  point.style.paddingTop = Math.abs(newY - startVector.y) + 'px';
}

function Vector(x,y) {
  this.x = x;
  this.y = y;
}

function log(message) {
  document.getElementById('log').textContent = message;
}