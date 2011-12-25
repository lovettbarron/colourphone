/************************
 * Startup dependencies. *
*************************/
var express = require('express'), 
		OAuth = require('oauth').OAuth,
		io = require('socket.io'),
//		connect = require('connect'), //Automatic in express I think?
		winston = require('winston'),
 		util = require('util');

var	mongoose = require('mongoose'), 
		mongooseAuth = require('mongoose-auth'),
		conf = require('./config.js');

var everyauth = require('everyauth')
  , Promise = everyauth.Promise;

/// Everyauth stuff and mongoose
everyauth.debug = true;

everyauth.everymodule.moduleErrback( function (err) {
  console.log ( err );
});

//Connect to Database
var db = mongoose.connect('mongodb://localhost/colour', function(err) {
	if( err ) {	console.log(err); }
	else { console.log("Successful connection"); }
});

var app = module.exports = express.createServer();


/************************
 * Database setup       *
*************************/

//Database model
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
	
var userSchema = new Schema({}), User;

/*
var userSchema = new Schema({
	userID: ObjectId
	, twitterid : { type: String, required: true, index: { unique:true, sparse:true } }
	, name      : {
			first: String
			, last: String
			}
	, online: Boolean	
	, joined    : Date
	, Friends		: {}}
), User;
*/

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
			//findOrCreateUser: function (session, accessToken, fbUserMetadata) {}
    }
  },
  twitter: {
    everyauth: {
      myHostname: 'http://emote.me:8000',
      consumerKey: conf.twit.consumerKey,
      consumerSecret: conf.twit.consumerSecret,
      redirectPath: '/',
	//		findOrCreateUser: function (session, accessToken, twitterUserMetadata) {}
    }
  }
});

mongoose.model('User', userSchema);

User = mongoose.model('User');	

var colourSchema = new Schema({
    user    : ObjectId
	, shared	: ObjectId
  , timestamp : Date
  , red       : Number
  , green     : Number
  , blue      : Number
});


//var colorObject = mongoose.model('Colour', colourSchema);
//var userObject = mongoose.model('User', userSchema);

//Oauth config


// Configuration
/************************
 * Server config        *
*************************/

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
    title: 'Colour Phone v0.2',
		auth: everyauth.loggedIn,
		twitter: everyauth.twitter.user,
		facebook: everyauth.facebook.user,
  });
});

app.get('/login', function(req, res) {
	res.render('login', {
		title: 'Login',
		
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
	
/*****
* app.post('/getFriends', function(req, res) {..
* ****/

app.get('/getFriends', function(req, res) {
	
	function makeOAuth() {
		//twitter oAuth.

		var oa = new OAuth('https://api.twitter.com/oauth/request_token',
		'https://api.twitter.com/oauth/access_token',
		conf.twit.consumerKey,
		conf.twit.consumerSecret,
		'1.0',
		null,
		'HMAC-SHA1');
		return oa;
	}
	
 	//Function to Write the JSON
	function writeRes(arg) {
		res.writeHead(200, 'OK', {'content-type': 'text/json'});
		res.write('{"arr":' + arg + '}');
		res.end();
	}
	
	if ( everyauth.loggedIn ) {		
		http.get({
			host: 'https://api.twitter.com/'
			, port: 80
			, path: '1/friends/ids.json?cursor=-1&user_id=' + everyauth.twitter.user.id
			}, function(res) {
				console.log("Resp: " + res.statusCode);
				/*			db.users.find({
				
				})*/
				console.log( res );
				socket.emit( 'friends', res );
			}).on('error', function(e) {
			  console.log("err: " + e.message);
				});

				} // end logged in block
	else { //Not logged in block
		console.log('Not loggedin	')	
		socket.emit('friends','you are not logged in... handle on front end');
	}
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});