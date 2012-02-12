var connections = {}, mouseX = 0, mouseY = 0, 
	prevMouseX = 0, prevMouseY = 0, userid = 0;
var user = 0;
var friends = new Array();
var friendsJSON = new Array();
var context, canvas;

SCREEN_W = window.innerWidth;
SCREEN_H = window.innerHeight;
window.addEventListener( 'resize', onWindowResize, function(event){
	console.log("Window resized:",event);
});

function onWindowResize( event ) {
	SCREEN_H = window.innerHeight;
	SCREEN_W = window.innerWidth;
	console.log('window: ' + SCREEN_H + ",", + SCREEN_W);
}

function colourBG( id, r, g, b ) {
	$('div.' + id + ' > div.colourPreview')
		.css('background-color','rgb(' + r + ',' + g + ',' + b + ')');
	};

function clearLast( x, y) {
	context.fillStyle = "#ffffff";
	context.fillRect( x, y, 10, 10);
	}


//User object for pop and interaction
var userObject = function( _id, _name, _colour, _updated, _responded ) {
	this.initialize.apply( this, arguments );
};

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
				console.log("user " + id + " instantiated.");
	
			$('div.user.'+id).on({
				click : function(event) {
					event.preventDefault();
					alert('clicked ' + event);
				},
				touchmove: function(event) {
			
				},
				mousemove: function(event) {
			
				},
		
			})
	}});


function populateFriends() {
var data = {};
data.friends = {'friend1': { 'id':123, 'name':'blah1' }, 'friend2': { 'id':234, 'name':'blah2' }, 'friend3': { 'id':345, 'name':'blah3' }, 'friend4': { 'id':456, 'name':'blah4' }, 'friend5': { 'id':567, 'name':'blah5' }, 'friend6': { 'id':678, 'name':'blah6' }, 'friend7': { 'id':789, 'name':'blah7' }, 'friend8': { 'id':890, 'name':'blah8' }, 'friend9': { 'id':901, 'name':'blah9' } };

			console.log( JSON.stringify(data.friends) );
			for( var key in data.friends ){
			friendsJSON.push({ "id" : data.friends[key].id });
		 	friends.push( 
					new userObject( 
							data.friends[key].id
							, data.friends[key].name
							, data.friends[key].colour
							, data.friends[key].updated
							, data.friends[key].responded  ) 
					);
		};
};


function moveColour(id, $_target) {
		console.log( 'interacting with ' + id );
		var canvasPos = {	x : $($target).offset().left, y : $($target).offset().top	};
		var canvasSize = { x: $($target).width(), y: $($target).height() };
		var h = ( (event.pageX - canvasPos.x) / canvasSize.x );
		var s = ( (event.pageY - canvasPos.y) / canvasSize.y );
		var l = 1.0; 
		var colour = hsvToRgb(h*360,s*100,l*100);		
		var colourMsg = { 
			id: id, model: 'RGB'
			, val1 : colour[0], val2 : colour[1], val3 : colour[2]
			, timestamp : new Date()
			 };
			
	$('div.user.' + id )
		.children('div.colourPreview')
		.css(
			'background-color'
			,'rgb(' + colourMsg.val1 + ',' + colourMsg.val2 + ',' + colourMsg.val3 + ')'
		 );
		
	for( var key in friendsJSON ) {
		if( friendsJSON[key].id == id ) {
			if( colourMsg.val1 !== undefined
				&& colourMsg.val2 !== undefined
				&& colourMsg.val3 !== undefined
				) {
			friendsJSON[key].colour = colourMsg;
			console.log('buffered colour in ' + JSON.stringify(friendsJSON[key] ) );
				}
			}
		}
};




//http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
function hsvToRgb(h,s,v){var r,g,b;var i;var f,p,q,t;h=Math.max(0,Math.min(360,h));s=Math.max(0,Math.min(100,s));v=Math.max(0,Math.min(100,v));s/=100;v/=100;if(s==0){r=g=b=v;return[Math.round(r*255),Math.round(g*255),Math.round(b*255)]}h/=60;i=Math.floor(h);f=h-i;p=v*(1-s);q=v*(1-s*f);t=v*(1-s*(1-f));switch(i){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;default:r=v;g=p;b=q}return[Math.round(r*255),Math.round(g*255),Math.round(b*255)]};