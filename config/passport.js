var localStrategy = require('passport-local').Strategy;
var User = require('../models/user.js');
var config = require('../config/database');
var passport = require('passport');
module.exports = function(passport){
	
	passport.use(new localStrategy(
	  	function(username, password, done) {
	    User.findOne({ username: username }, function(err, user) {
	      if (err) { return done(err); }
	      if (!user) {
	        return done(null, false);
	      }
	      var ok=(user.password.length==password.length);
		  for(let i=0;i<user.password.length;i++)
		  {
		    if(user.password[i]!=password[i])
		    {
		      	ok=0;
		    }
		  }
		  if (ok) {
	         return done(null, user);
	      } else {
	          return done(null, false);
	      }
	    });
	  }
	));


	passport.serializeUser(function(user, done) {
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
	    	done(err, user);
	  	});
	});
};




