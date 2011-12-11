
/**
 * Module dependencies.
 */
var express = require('express'), 
		OAuth = require('oauth').OAuth,
		io = require('socket.io'),
		winston = require('winston'),
 		util = require('util');

var	mongoose = require('mongoose'), 
		mongooseAuth = require('mongoose-auth'),
		conf = require('./config.js');

var everyauth = require('everyauth')
  , Promise = everyauth.Promise;

mongoose.connect('mongodb://emote.me:8000/colour');

var app = module.exports = express.createServer();

//Database model
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var userSchema = new Schema({
		User			: ObjectId
  , name      : String
  , twitterid : String
  , joined    : Date
}), User;
		// userSchema.plugin(mongooseAuth, {
		//       facebook: true,
		// 		twitter: true
		//     	});

var colourSchema = new Schema({
    user    : ObjectId
	,	shared  : String
  , timestamp : Date
  , red       : Number
  , green     : Number
  , blue      : Number
});

//https://github.com/bnoguchi/mongoose-auth/blob/master/example/server.js
// var UserSchema = new Schema({
//   role  : String
// }), User;
userSchema.plugin(mongooseAuth, {
  everymodule: {
    everyauth: {
      User: function() {
        return User;
      }
    }
  },
  facebook: {
    everyauth: {
      myHostname: 'http://emote.me:8000',
      appId: conf.fb.appId,
      appSecret: conf.fb.appSecret,
      redirectPath: '/',
			findOrCreateUser: function (session, accessToken, fbUserMetadata) {
			      }
    }
  },
  twitter: {
    everyauth: {
      myHostname: 'http://emote.me:8000',
      consumerKey: conf.twit.consumerKey,
      consumerSecret: conf.twit.consumerSecret,
      redirectPath: '/',
			findOrCreateUser: function (session, accessToken, twitterUserMetadata) {
			      }
    }
  }
});


var colorObject = mongoose.model('Colour', colourSchema);
var userObject = mongoose.model('User', userSchema);

//Oauth config

function makeOAuth() {
	//twitter oAuth.
	/*
	var oa = new OAuth('https://api.twitter.com/oauth/request_token',
	'https://api.twitter.com/oauth/access_token',
	conf.twit.consumerKey,
	conf.twit.consumerSecret,
	'1.0',
	null,
	'HMAC-SHA1');
	return oa;
	 */
	return new oa;
}

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({ secret: '024493' }));
//  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(mongooseAuth.middleware());
});
//http://tesoriere.com/2011/10/10/node.js-getting-oauth-up-and-working-using-express.js-and-railway.js/
mongooseAuth.helpExpress(app);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Colour Phone v0.1',
//		auth: req.session.hasOwnProperty('oAuthVars'),
		auth: everyauth.loggedIn,
		twitter: everyauth.twitter.user,
		facebook: everyauth.facebook.user,
  });
});

app.listen(8000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

//SOCKET LISTENING
var io = io.listen(app);
var userCount = 0;
var colordata = {};
io.sockets.on('connection', function (socket) {
				socket.emit('colour', colordata);
		socket.on('set nickname', function (name) {
	    socket.set('nickname', name, function () {
	      socket.emit('ready');
			  winston.log('info', 'User Logged in');
				});
			});

		socket.on('msg', function (data) {	
				colordata = data;
				//console.log("recieved:" + data );
					socket.broadcast.emit('colour', data );
			  	winston.log('info', data 	);
				});

	});
		
	
	io.sockets.on('disconnect', function() {
		clearInterval(interval);
		console.log('Disconnect');
	});
	
	
	
// OAuth
/*****
app.get('/twitterlogin',function(req, res) {
* app.get('/twitterlogin',function(req, res) {
*
* Basic just send the User to twitter, Ideally you'd be checking if you can identify the user
* and use stored tokens for them rather then getting them again and again and again for each Session
*****/
/*
app.get('/twitterlogin', function(req, res) {
	var oa;
	function getOAuthRequestTokenFunc(error, oauth_token, oauth_token_secret,results) {
		if (error) return console.log('getOAuthRequestToken Error', error);
		req.session.callmade = true;
		req.session.oAuthVars = {};
		req.session.oAuthVars.oauth_token = oauth_token;
		req.session.oAuthVars.oauth_token_secret = oauth_token_secret;
		res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + oauth_token);
	}
	//We could store all this in a DB but for another time
	oa = makeOAuth();
	oa.getOAuthRequestToken(getOAuthRequestTokenFunc);

});

/*****
* app.get('/twitterauth',function(req, res) {...
*
* When we set up our App on  https://dev.twitter.com/apps/
* we specified a Callback URL this is it so we handle the OK from twitter here.
* You'd get the toekens here for the User and store them rather then keeping them around for just the Session.
* Also you would
*****/
/*
app.get('/twitterauth', function(req, res) {
		if (req.session.hasOwnProperty('callmade')) {
			var oa = makeOAuth();
			oa.getOAuthAccessToken(req.session.oAuthVars.oauth_token, req.session.oAuthVars.oauth_token_secret, req.param('oauth_verifier'),
			function(error, oauth_access_token,oauth_access_token_secret, tweetRes) {
			if (error) {
				console.log('getOAuthAccessToken error: ', error);
				//do something here UI wise
				return;
			}
			req.session.oAuthVars.oauth_access_token = oauth_access_token;
			req.session.oAuthVars.oauth_access_token_secret = oauth_access_token_secret;
			req.session.oAuthVars.oauth_verifier = req.param('oauth_verifier');
			//
			var obj = {};
			obj.user_id = tweetRes.user_id;
			obj.screen_name = tweetRes.screen_name;
			obj.oauth_access_token = oauth_access_token;
			obj.oauth_access_token_secret = oauth_access_token_secret;
			obj.profile_image_url = tweetRes.profile_image_url;
			//Here we add the 'obj' contain the details to a DB and user this to get the users access details.
			res.redirect('/');
			});
		}
		else {
			res.redirect('twitterlogin');
		}
});

/*****
* app.post('/getFriends', function(req, res) {..
*
* The Web Service 'POST' Call called from Lungo Event
* ****/

app.post('/getFriends', function(req, res) {
	//Function to Write the JSON
	function writeRes(arg) {
		res.writeHead(200, 'OK', {'content-type': 'text/json'});
		res.write('{"arr":' + arg + '}');
		res.end();
	}
	if (req.session.hasOwnProperty('oAuthVars')) {
		//Set it up.
		var oa = makeOAuth();
		//Two Steps. 1. Get the IDs and then 2 use the IDs to get the details.
		// 1. Get the IDs of a user is following.
		oa.getProtectedResource('http://api.twitter.com/1/friends/ids.json', 'GET', req.session.oAuthVars.oauth_access_token, req.session.oAuthVars.oauth_access_token_secret,
		function(error, data, response) {
			var arrData;
			if (error) {
				console.log('error', error);
				writeRes('');
			}
			else {
				//2. Get their IDs to their Details.... this can be pretty big.. Here we'll just take what we need...
				arrData = JSON.parse(data);
				oa.getProtectedResource('http://api.twitter.com/1/users/lookup.json?user_id=' + arrData.ids, 'GET', req.session.oAuthVars.oauth_access_token, req.session.oAuthVars.oauth_access_token_secret,
				function(error, udata, response) {
					var arr = [], obj, parsedData;
					if (error) {
						console.log('error', error);
						writeRes('');
					}
					else {
						//There is alot of data on all the users you follow so you'd never want to return it all, you'd filter through it
						//and you see in the template in Lungo we just use the screen_name and id
						parsedData = JSON.parse(udata);
						for (var i = 0; i < parsedData.length; i++) {
							obj = {};
							obj.id = parsedData[i].id;
							obj.screen_name = parsedData[i].screen_name;
							arr.push(obj);
						}
						writeRes(JSON.stringify(arr));
					}
				});
			}
		});
	}
	else {
	writeRes('you are not logged in... handle on front end');
	}
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

mongooseAuth.helpExpress(app);

