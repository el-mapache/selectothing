var SELECTED_CLASS = 'selected';
var SCROLL_INCREMENT = 5;
var TOLERANCE = 0.95;
var direction = null;

var mouseIsDown = false;
var dragging = false;
var point = null;
var lastY = 0;
// querySelectorAll returns a node list object, xform it into a standard array
var selectableList = [].slice.call(document.querySelectorAll('.selectable'), 0);


// Every time a new spot is clicked, until mouse is
// released, we will create a new startVector object.
var startVector = null;

var pageHeight = document.body.offsetHeight;
var pageWidth = document.body.offsetWidth;

function isPageBottom() {
  return scrollTop() === (scrollHeight() - screenHeight());
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

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('mouseout', onMouseOut);

// document.addEventListener('mousein', onMouseIn);


function cleanup() {
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mouseup', onMouseUp);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseout', onMouseOut);
}

function onMouseOut(event) {
  // rather than debounce, we need to set an 'about to fire mouseup' flag, then
  // when/if the user mouses back in we can cancel the mouse up
  // this is a perfect use case for channels and an alt, where we
  //could do yield alt(cancel, mouseup) or something.
  var from = event.relatedTarget || event.toElement;

  if (!from || from.nodeName === "HTML") {
    onMouseUp();
  }
}

// function onMouseIn(event) {
//   var from = event.relatedTarget || event.toElement;

//   if (!from || from.nodeName === "HTML") {
//     console.log('out of window')
//     debounce(400, function() {
//       console.log('debounce done')
//       onMouseUp();
//     })();
//   }
// }

function onMouseDown(event) {
  event.preventDefault();

  mouseIsDown = true;

  document.addEventListener('mousemove', debounce(5, onMouseMove));

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


  dragging = true;

  setMouseDirection(y);

  shouldSelect(x, y);

  if ((y + scrollTop()) < scrollHeight()) {
    shouldScroll(x,y);
  }

  // not sure what the purpose of screenHeight - 40 is here
  if (!isPageBottom() && scrollTop() && (y > (screenHeight() - 40))) {
    var yy = 0;

    if (event.pageY > scrollHeight()) {
      yy = scrollHeight();
    }
    updatePoint(x, Math.abs(yy - scrollTop()));
  } else {
    updatePoint(x, y);
  }
}


function setMouseDirection(newY) {
  direction = (lastY < (newY+scrollTop())) ? 'down' : 'up';
}

// Is the user scrolling past the bottom of the page or the top?
function outOfPageBounds() {
  return (scrollTop() + SCROLL_INCREMENT) > scrollHeight() ||
         (scrollTop() + SCROLL_INCREMENT) <= 0
}


var animationInterval;
var timeElapsed = 0;


function shouldScroll(x, yPos) {
  var absY = Math.abs(yPos);

  if (outOfPageBounds()) {
    return;
  }

  if (yPos < 0) {
    dragScroll(0, -Math.abs(yPos)/4);
  }

  // if (yPos > (screenHeight() / 2)) {
  //   var endLocation = window.pageYOffset + (screenHeight() / 2);
  //   var currentLocation = window.pageYOffset;
  //   document.removeEventListener('mousemove', onMouseMove);
  //   while (currentLocation <= endLocation) {
  //     timeLapsed += 16;
  //     var distance = endLocation - currentLocation;
  //     var percentage = ( timeLapsed / parseInt(500, 10) );
  //     percentage = ( percentage > 1 ) ? 1 : percentage;
  //     var position = window.pageYOffset + ( distance * (--percentage) * percentage * percentage + 1 );
  //     window.scrollTo( 0, Math.floor(position) );
  //     currentLocation = position;
  //     updatePoint(x, currentLocation)
  //   }
  //   timeLapsed = 0;
  //   document.addEventListener('mousemove', debounce(5,onMouseMove));
  //   //window.scrollBy(0, 200);
  // }
  if (yPos > (screenHeight() - SCROLL_INCREMENT * 50) ||
     yPos < (SCROLL_INCREMENT * 50) || yPos > screenHeight()) {

    lastY = yPos + scrollTop();
    if (direction === 'down') {
      dragScroll(0, SCROLL_INCREMENT);
    } else {
      dragScroll(0, -SCROLL_INCREMENT);
    }
  }
}

function dragScroll(x, y) {
  window.scrollBy(0, y);
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

function hasCollision(a, b) {
  var rect1 = a.getBoundingClientRect(),
      rect2 = b.getBoundingClientRect();

  var result;

  if (rect1.left < rect2.left + rect2.width &&
      rect1.left + rect1.width > rect2.left &&
      rect1.top < rect2.top + rect2.height  &&
      rect1.height + rect1.top > rect2.top) {

    result = true;
  } else {
    result = false;
  }

  rect1 = null;
  rect2 = null;

  return result;
}

function hasSelected(node) {
  return (new RegExp(SELECTED_CLASS).test(node.className));
}

function shouldSelect(x, y) {
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

    unselected.forEach(function(item) {
      item.className = item.className.replace(' ' + SELECTED_CLASS, '');
    });

    selected.length = 0;
    unselected.length = 0;
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
  if (!point) {
    return;
  }

  document.body.removeChild(point);
  point = null;
}

function updatePoint(newX, newY) {
  var newPaddingTop;

  newY = newY + scrollTop();

  if (newX < startVector.x) {
    point.style.left = newX + 'px';
  }

  if (newY < startVector.y) {
    point.style.top = newY < 0 ? 0 : newY + 'px';
  }

  if (newX > pageWidth) {
    newX = pageWidth;
  }

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
  if (value > pageWidth) {
    return pageWidth;
  }
}

function log(message) {
  document.getElementById('log').textContent = message;
}

// Note: maybe it would be better to treat a negative number as the point to move to one page up,
// ie, -50 applied to a screen height of 700 would move the cursor up one screen to the position of 650.


// I should be recentering the screen when dragging