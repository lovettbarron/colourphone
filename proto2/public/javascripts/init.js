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
//document.addEventListener( 'mousemove', onDocumentMouseMove, false );

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

$().ready( function() {

	$('div.user').mousemove(function(e){
		$(this).css('background-color', 'black');
		var userId = $(this).attr('class')[1]
		console.log( 'interacting with ' + userId );
		var canvasPos = findPos( this );
		var canvasSize = {
			x: $(this).width()
			, y: $(this).height()
		}
		var h = ( (e.x - canvasPos.x) / canvasSize.x );
		var s = ( (e.y - canvasPos.y) / canvasSize.y );
		var l = 1.0; 
		var colour = hsvToRgb(h*360,s*100,l*100);
		console.log( h, s, l, color );
		var msg = { 
			id: canvasId
			, val1 : colour[0]
			, val2 : colour[1]
			, val3 : colour[2]
			, timestamp : new Date()
			 };
		socket.emit( "msg", msg, function(err, msg) {
			console.log("sent: " + msg + " ? err: " + err)
		});
		colourBG( canvasId , color[0], color[1], color[2] );
	});
	
	
})

//Initial connection
var socket = new io.connect('http://emote.me:8000');
var colour = new io.connect('http://emote.me:8000/colour')
//socket.connect();

socket.on('connect', function() {
		console.log( "Oh hey, connected");
		
	});
	
socket.on('colour', function(data) {
//	console.log( data );
//	while( position != data.length ) {
		console.log( 
			"id: " + data[0] +
			", r:" + data[1] + 
			", g:" + data[2] + 
			", b:" + data[3] );

		colourBG( data[0], data[1], data[2], data[3] );
});

socket.on('friends', function(data) {
	var friendList = $().parseJSON(data);

	var userList = $("#twitter");
	for ( login in friendList ) {
		var curUser = $("<div/>").addClass('user').addClass(friendList.twit.id).appendTo(userList);
		$("<div/>").addClass('userImg').addClass(friendList.twit.id)
				.html("<img src='" + friendList.twit.profileImageUrl + "' />" ).appendTo(curUser);
		$("<div/>").addClass('userName').addClass(friendList.twit.id)
				.html(friendList.twit.profileImageUrl + "' />" ).appendTo(curUser);
		}
	console.log( "Got friends: " + data );
});
	
socket.on('disconnect', function() {
		console.log('disconnected');
	});
	
	
/*function onDocumentMouseMove(event) {
	var h = (event.x/window.innerWidth);
	var s = (event.y/window.innerHeight);
	var l = 1.0; 
	var color = hsvToRgb(h*360,s*100,l*100);
	console.log( h, s, l, color );
	socket.emit( "msg", color );
	colourBG( color[0], color[0], color[1], color[2] );
//	console.log('Mouse moving',event);
}	*/


//http://stackoverflow.com/questions/5085689/tracking-mouse-position-in-canvas
function findPos(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

$('canvas').mouseleave( function(e) {
	
})

function onWindowResize( event ) {
	SCREEN_H = window.innerHeight;
	SCREEN_W = window.innerWidth;
	console.log('window: ' + SCREEN_H + ",", + SCREEN_W);
}


function sendSocket(message) {
  socket.emit('message',message);
};

function colourBG( id, r, g, b ) {
	$('div.' + id + ' > div.colourPreview')
		.css('background-color','rgb(' + r + ',' + g + ',' + b + ')');
	};

function clearLast( x, y) {
	context.fillStyle = "#ffffff";
	context.fillRect( x, y, 10, 10);
	}


function populateFriends() {
	$.get('/friends', function(data) {
		console.log('sent/recieved:' + JSON.stringify(data));
		$("#twitter").html(data, function(res, err) {
			if( err ) console.log("Render err: " + err);
			console.log( "Rendered resp: " + res);
			});
		});
	}


//Colour communication

colour.on('connect', function () {
  colour.emit('hi!');
});




















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