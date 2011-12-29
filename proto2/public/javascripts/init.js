var connections = {}, mouseX = 0, mouseY = 0, 
	prevMouseX = 0, prevMouseY = 0, userid = 0;
var user = 0;
var friends = new Array();
var context, canvas;
/*
function load() {
	canvas = document.getElementById("draw");
	context = canvas.getContext("2d");
}; */

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

//Initial connection
var socket = new io.connect('http://emote.me:8000');
//var colour = new io.connect('http://emote.me:8000/colour')
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

//		colourBG( data[0], data[1], data[2], data[3] );
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

//Colour communication

colour.on('connect', function () {
  colour.emit('hi!');
});

//User object for pop and interaction
var userObject = function( _id, _name, _colour, _updated, _responded ) {
	this.initialize.apply( this, arguments );
}

$.extend( userObject.prototype, {
		id: null
		, name: null
		, updated: null
		, initialize: function ( _id, _name, _colour, _updated, _responded ) {
				var id = _id
				, name = _name
				, colour = _colour
				, updated = _updated
				, responded = _responded;
				console.log("user id" + id + " instantiated.");
				$( 'div.user.' + id ).bind( 'mousemove', (function(event){
					console.log( 'interacting with ' + id );
					var canvasPos = {
						x : $(this).offset().left
						, y : $(this).offset().top
					};
					var canvasSize = {
						x: $(this).width()
						, y: $(this).height()
					};
					var h = ( (event.pageX - canvasPos.x) / canvasSize.x );
					var s = ( (event.pageY - canvasPos.y) / canvasSize.y );
					var l = 1.0; 
					var colour = hsvToRgb(h*360,s*100,l*100);
					
				//	console.log( JSON.stringify(event.pageX), JSON.stringify(event.pageY), colour, JSON.stringify(canvasSize), JSON.stringify(canvasPos) );
					
					var msg = { 
						id: id
						, val1 : colour[0]
						, val2 : colour[1]
						, val3 : colour[2]
						, timestamp : new Date()
						 };

				$('div.user.' + id ).children('div.colourPreview')
					.css('background-color','rgb(' + msg.val1 + ',' + msg.val2 + ',' + msg.val3 + ')');

					socket.emit( "msg", msg, function(err) {
							console.log("sent: " + msg + " ? err: " + err);
						});
				}));
		}
		, sendColour: function( $e ) {
		}
		, updateColour: function() {
		}
		
	});


function populateFriends() {
	$.get('/friends', function(data) {
		 console.log('sent/recieved:' + JSON.stringify(data));
		 socket.emit('you',data.you); // I know this is absolutely the wrong way to do this.

		$("#twitter").html(data.html, function(res, err) {
			if( err ) console.log("Render err: " + err);
			console.log( "Rendered resp: " + res);
			});
			console.log( JSON.stringify(data.friends) );
			for( key in data.friends )
		 	friends.push( 
					new userObject( 
							data.friends[key].id
							, data.friends[key].name
							, data.friends[key].colour
							, data.friends[key].updated
							, data.friends[key].responded  ) 
					);
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