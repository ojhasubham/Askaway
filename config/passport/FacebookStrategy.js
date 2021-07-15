var passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  request = require('request');

var verifyHandler = function (req, token, tokenSecret, profile, done) {

  process.nextTick(function () {
    var url = 'https://graph.facebook.com/v2.10/me?access_token=%s&fields=id,email,first_name,last_name';
    url = url.replace('%s', token);

    var options = { method: 'GET', url: url, json: true };
    request(options, function (err, response) {
      if (err) {
        console.log('fb err : ', err);
        return done(null, null);
      }

      console.log('fb response : ', response);

      var data = {
        id: response.body.id,
        first_name: response.body.first_name,
        last_name: response.body.last_name,
        email: response.body.email
      };

      return done(null, data);
    });
  });
};

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL,
  passReqToCallback: true
}, verifyHandler));