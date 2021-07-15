var passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth2').Strategy;

//var verifyHandler = function(req, token, tokenSecret, profile, done) {
var verifyHandler = function (accessToken, refreshToken, profile, cb, done) {
  var data = {
    id: cb.id,
    provider: cb.provider,
    name: cb.displayName,
    first_name: cb.given_name,
    last_name: cb.family_name,
    email: cb.emails[0].value,
    emailVerified: cb.email_verified
  };

  return done(null, data);
};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, verifyHandler));
