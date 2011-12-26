/************************
 * Startup dependencies. *
*************************/
var express = require('express'), 
		OAuth = require('oauth').OAuth,
		io = require('socket.io'),
//		connect = require('connect'), //Automatic in express I think?
		winston = require('winston'),
 		util = require('util');

//Session stores
var MemoryStore  = express.session.MemoryStore;
var sessionStore = new MemoryStore();

var MongoStore = require('connect-mongo');

//Mongo stores
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
	
var userSchema = new Schema({
	name					: {
		first	: String
		, last: String
	}		
	, twtFriends	: {}
	, joined			: Date
	, online			: Boolean
}), User;

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
	app.use(express.session({ secret: '024493', key: 'express.sid' }));
  app.use(express.static(__dirname + '/public'));
  app.use(mongooseAuth.middleware());
});

//Socket.io and express joiner
app.use(express.session({store: sessionStore
    , secret: 'secret'
    , key: 'express.sid'}));

/* // Tests the session function/get ID
app.use(function (req, res) {
    res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
	}); */

//Connect-mongo session support
app.use(express.session({
    secret: '024493',
    store: new MongoStore({
      db: "colour-sessions"
    })
  }));

mongooseAuth.helpExpress(app);

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


/************************
/************************
/************************
/************************
 *  Routing and app      *
*************************/
//var theUser = new User({});

app.get('/', function(req, res){
	res.cookie('colourphone', 'yes', { 
			expires: new Date(Date.now() + 900000)
			, httpOnly: true
			, secure: true 
		});
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

/*************************
 * Websockets and returns *
*************************/
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
	


/***********************************************
 * Session wrangling														*
 * http://www.danielbaulig.de/socket-ioexpress/ *    
************************************************/
var Session = express.session.Session;
//var parseCookie = express.utils.parseCookie;

io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
					data.sessionID = JSON.stringify(data.headers.cookie).split('=')[1];
					console.log("Session ID is " + data.sessionID );
        data.sessionStore = sessionStore;
        sessionStore.get(data.sessionID, function (err, session) {
            if (err || !session) {
                accept('Error', false);
            } else {
                // create a session object, passing data as request and our
                // just acquired session data
                data.session = new Session(data, session);
                accept(null, true);
            }
        });
    } else {
       return accept('No cookie transmitted.', false);
    }
});
	
	
//Socket.io Session handling		
io.sockets.on('connection', function (socket) {
    var hs = socket.handshake;
    console.log('A socket with sessionID ' + hs.sessionID 
        + ' connected!');
    var intervalID = setInterval(function () {
        hs.session.reload( function () { 
            hs.session.touch().save();
        });
    }, 60 * 1000);
    socket.on('disconnect', function () {
        console.log('A socket with sessionID ' + hs.sessionID 
            + ' disconnected!');
        clearInterval(intervalID);
    });

});
	
	io.sockets.on('disconnect', function() {
		clearInterval(interval);
		console.log('Disconnect');
	});
	
/*****
* app.post('/getFriends', function(req, res) {..
* ****/
function makeOAuth() {
	return new oauth.OAuth('https://api.twitter.com/oauth/request_token',
	'https://api.twitter.com/oauth/access_token',
	conf.twit.consumerKey,
	conf.twit.consumerSecret,
	'1.0',
	null,
	'HMAC-SHA1');
}

app.get('/friends', function(req, res) {
	var response = {};
//	var theUser = new User();

	//User.find({ 'twit' : { 'id' : req.session.auth.twitter.id } }, function(err, docs) {
		//console.log('User set up' +  err);
	//});
	
	var oa = new OAuth('https://api.twitter.com/oauth/request_token'
								, 'https://api.twitter.com/oauth/access_token'
								, conf.twit.consumerKey
								, conf.twit.consumerSecret
								, '1.0'
								, null
								, 'HMAC-SHA1');

  oa.getProtectedResource("http://api.twitter.com/1/friends/ids.json"
		, "GET"
		, req.session.auth.twitter.accessToken
		, req.session.auth.twitter.accessTokenSecret
		, function (error, data) {
	    	if (error) {
		      console.log("Prob getting followers: " + JSON.stringify(error) );
					console.log("accessToken: " +  req.session.auth.twitter.accessToken );
					console.log("accessSecret: " + req.session.auth.twitter.accessTokenSecret );
					console.log("User data: " + JSON.stringify(req.session.auth) );
		    	}
		    var obj = JSON.parse(data);
				console.log( "Recieved object:" + JSON.stringify(obj) );
		
				User.find({ 'twit.id' : { $in : obj.id } }, function(err, docs) {
					console.log("Error retrieving friends: " + err);
					console.log( JSON.stringify( docs ) );
					response = docs.id;
					});
				});
				
			res.send(response.id);
	  }); // end oauth attempt
	});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});