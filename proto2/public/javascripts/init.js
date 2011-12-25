var connections = {}, mouseX = 0, mouseY = 0, 
	prevMouseX = 0, prevMouseY = 0, userid = 0;
var user = 0;
var context, canvas;

function load() {
	canvas = document.getElementById("draw");
	context = canvas.getContext("2d");
};

SCREEN_W = window.innerWidth;
SCREEN_H = window.innerHeight;
window.addEventListener( 'resize', onWindowResize, function(event){
	console.log("Window resized:",event);
});
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
		var x = event.touches[0].pageX;
		var y = event.touches[0].pageY;
		var h = (x/window.innerWidth);
		var s = (y/window.innerHeight);
		var l = 1.0; 
		var color = hsvToRgb(h*360,s*100,l*100);
		console.log( h, s, l, color );
		socket.emit( "msg", color );
		colourBG( color[0], color[0], color[1], color[2] );
});



//Initial connection
var socket = new io.connect('http://emote.me:8000');
//socket.connect();

socket.on('connect', function() {
		console.log( "Oh hey, connected");
		
	});
	
socket.on('colour', function(data) {
//	console.log( data );
//	while( position != data.length ) {
		console.log( 
			", r:" + data[0] + 
			", g:" + data[1] + 
			", b:" + data[2] );

		colourBG( data[0], data[0], data[1], data[2] );
});
	
socket.on('disconnect', function() {
		console.log('disconnected');
	});
	
function onDocumentMouseMove(event) {
	var h = (event.x/window.innerWidth);
	var s = (event.y/window.innerHeight);
	var l = 1.0; 
	var color = hsvToRgb(h*360,s*100,l*100);
	console.log( h, s, l, color );
	socket.emit( "msg", color );
	colourBG( color[0], color[0], color[1], color[2] );
//	console.log('Mouse moving',event);
}	


//http://www.devinrolsen.com/basic-jquery-touchmove-event-setup/
/*$('#canvas').bind('touchmove',function(e){
      e.preventDefault();
      var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      var elm = $(this).offset();
      var x = touch.pageX - elm.left;
      var y = touch.pageY - elm.top;
      if(x < $(this).width() && x > 0){
	      if(y < $(this).height() && y > 0){
       
									var h = (touch.pageX/window.innerWidth);
									var s = (touch.pageY/window.innerHeight);
									var l = 1.0; 
									var color = hsvToRgb(h*360,s*100,l*100);
									console.log( h, s, l, color );
									socket.emit( "msg", color );

                  console.log(touch.pageY+' '+touch.pageX);
	      }
      }
}); */

function onWindowResize( event ) {
	SCREEN_H = window.innerHeight;
	SCREEN_W = window.innerWidth;
	console.log('window: ' + SCREEN_H + ",", + SCREEN_W);
}


function sendSocket(message) {
  socket.emit('message',message);
};

function colourBG( id, r, g, b ) {
	$("#canvas").css('background-color','rgb(' + r + ',' + g + ',' + b + ')');
};

function clearLast( x, y) {
	context.fillStyle = "#ffffff";
	context.fillRect( x, y, 10, 10);
}


function populateFriends() {
	$().get('/getFriends', function(res) {
		console.log( res )
	});
}

//http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
function hsvToRgb(h, s, v) {
	var r, g, b;
	var i;
	var f, p, q, t;
 
	// Make sure our arguments stay in-range
	h = Math.max(0, Math.min(360, h));
	s = Math.max(0, Math.min(100, s));
	v = Math.max(0, Math.min(100, v));
 
	// We accept saturation and value arguments from 0 to 100 because that's
	// how Photoshop represents those values. Internally, however, the
	// saturation and value are calculated from a range of 0 to 1. We make
	// That conversion here.
	s /= 100;
	v /= 100;
 
	if(s == 0) {
		// Achromatic (grey)
		r = g = b = v;
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
 
	h /= 60; // sector 0 to 5
	i = Math.floor(h);
	f = h - i; // factorial part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));
 
	switch(i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
 
		case 1:
			r = q;
			g = v;
			b = p;
			break;
 
		case 2:
			r = p;
			g = v;
			b = t;
			break;
 
		case 3:
			r = p;
			g = q;
			b = v;
			break;
 
		case 4:
			r = t;
			g = p;
			b = v;
			break;
 
		default: // case 5:
			r = v;
			g = p;
			b = q;
	}
 
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}