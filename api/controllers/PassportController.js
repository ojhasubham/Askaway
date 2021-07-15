/**
 * PassportController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var passport = require('passport');
const sails = require('sails');

const authService = require('../services/authService');
const categories = require('../codes/categories');
const zoomService = require('../services/zoomService');
const { PROVIDER, STUDENT, STATUS_ACTIVE, STATUS_PENDING, ROLES, EVERYONE } = require('../codes');

const LOGIN_ACTION = 'login';
const REGISTER_ACTION = 'register';

module.exports = {

  googleAuthLogin: function (req, res) {
    const state = { action: LOGIN_ACTION };
    passport.authenticate('google', { scope: ['email', 'profile'], state: JSON.stringify(state) })(req, res);
  },

  googleAuthRegister: function (req, res) {
    const { role } = req.allParams();
    const state = { action: REGISTER_ACTION, role };
    passport.authenticate('google', { scope: ['email', 'profile'], state: JSON.stringify(state) })(req, res);
  },

  googleCallback: function (req, res, next) {
    passport.authenticate('google', async function (err, googleUser) {
      if (err) {
        console.log('google callback error: ' + err);
        return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { errText: 'Login rejected by provider.' } });
      } else {
        const allParams = req.allParams();
        const state = allParams && allParams.state && JSON.parse(allParams.state) || {};
        const { action } = state;
        console.log('state : ', state);
        console.log('google credentials : ', googleUser);

        const createUserFromGoogleData = params => {
          return new Promise(async (resolve, reject) => {
            const { provider, providerRegId, first_name, last_name, email, password, role, status, emailVerified } = params;
            let _first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            let _last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
            let data = {
              first_name: _first_name,
              last_name: _last_name,
              full_name: _first_name + ' ' + _last_name,
              email,
              password,
              role,
              status,
              verifyToken: Math.random().toString(36).replace('0.', ''),
              accountProvider: provider,
              accountProviderRegId: providerRegId
            };

            await user.create(data);

            const newUser = await user.findOne({ email });
            if (newUser && newUser.id) {
              const { id: userId } = newUser;

              if (emailVerified) {
                resolve(userId);

                if (role === PROVIDER) {
                  let zoomUserInfo = {
                    email: newUser.email,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                  };

                  const newZoomUser = await zoomService.createUser(zoomUserInfo);
                  if (newZoomUser) {
                    const zoomUserData = {
                      userId,
                      zoomUserId: newZoomUser.id,
                      zoomResponse: newZoomUser,
                    };
                    await zoomUser.create(zoomUserData);
                  }

                  await user.updateOne({ id: userId }).set({ status: STATUS_ACTIVE });
                  await providerTransactions.create({ balance: 0, userId });
                }

                return;
              } else {
                await sendRegVerifyEmail(
                  req,
                  email,
                  newUser.verifyToken,
                  newUser.phone,
                  newUser.country
                );

                return resolve(true);
              }
            }

            return resolve(false);
          })
        }

        switch (action) {
          case LOGIN_ACTION:
            try {
              console.log('login with google');
              const { email } = googleUser;
              if (email) {
                const current_user = await user.findOne({ email });

                if (current_user) {
                  if (current_user.id) {
                    const { id: userId, role, status } = current_user;

                    if (status === STATUS_PENDING)
                      return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { errText: 'Email Id is Not verified.' } });

                    if (userId) {
                      const token = await authService.generateAccessToken({ id: userId, email, role }, 120000);
                      return res.view('user/home', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: { token, userId } });
                    }
                  }
                } else {
                  const { id, provider, name, first_name, last_name, emailVerified } = googleUser;
                  const role = STUDENT;
                  const data = {
                    provider,
                    providerRegId: id,
                    first_name: first_name && last_name && first_name || name,
                    last_name: last_name || '',
                    email,
                    password: '',
                    role,
                    status: emailVerified && STATUS_ACTIVE || STATUS_PENDING,
                    emailVerified
                  };
                  const userId = await createUserFromGoogleData(data);
                  if (userId) {
                    if (userId === true) {
                      return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { msgText: 'signup successful please Verify your Email to login.' } });
                    }

                    const token = await authService.generateAccessToken({ id: userId, email, role }, 120000);
                    return res.view('user/home', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: { token, userId } });
                  }
                }
              }

              return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { errText: 'Email Id Not Found.' } });
            } catch (error) {
              sails.log.error('Error in login with google : ', error);
              return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { errText: 'Error in login with google.' } });
            }

          case REGISTER_ACTION:
            try {
              console.log('register with google');
              const { id, provider, name, first_name, last_name, email: googleEmail, emailVerified } = googleUser;

              if (googleEmail && emailVerified) {

                const email = googleEmail.trim().toLowerCase();
                const role = +state.role;
                console.log('Received signup request for email: ' + email);

                if (!EVERYONE.includes(role))
                  return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'signup', data: { errText: 'Role is Invalid.' } });

                const getUser = await user.findOne({ email });
                if (getUser)
                  return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'signup', data: { errText: 'Email is already exists.' } });
                else {
                  const data = {
                    provider,
                    providerRegId: id,
                    first_name: first_name && last_name && first_name || name,
                    last_name: last_name || '',
                    email,
                    password: '',
                    role,
                    status: emailVerified && role === STUDENT && STATUS_ACTIVE || STATUS_PENDING,
                    emailVerified
                  };
                  const userId = await createUserFromGoogleData(data);

                  if (userId) {
                    if (userId === true) {
                      return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { msgText: 'signup successful please Verify your Email to login.' } });
                    }

                    const token = await authService.generateAccessToken({ id: userId, email, role }, 120000);
                    return res.view('user/home', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: { token, userId, msgText: 'signup successfully.' } });
                  }
                }
              }

              return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'signup', data: { errText: 'Your email is not verified.' } });
            } catch (error) {
              sails.log.error('Error in user signup with google : ', error);
              return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'signup', data: { errText: 'Error in user signup with google.' } });
            }

          default:
            return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { errText: 'Action declined.' } });
        }
      }
    })(req, res, next);
  },

  facebookAuth: function (req, res, next) {
    passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
  },

  facebookCallback: function (req, res, next) {
    passport.authenticate('facebook', async function (err, facebookUser) {
      if (err) {
        console.log('facebook callback error: ' + err);
        return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: { errText: 'Login rejected by provider.' } });
      } else {
        console.log('facebook credentials');
        console.log(facebookUser);

        const { id, provider, email } = facebookUser;

        if (email) {

          const current_user = await user.findOne({ email });

          if (current_user && current_user.id) {
            console.log('current_user.id : ', current_user.id);

            const { id: userId, role } = current_user;
            if (userId) {
              const token = await authService.generateAccessToken({ id: userId, email, role }, 120000);
              return res.view('user/home', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: { token, userId } });
            }
          }
        }

        res.json(user);
      }
    })(req, res, next);
  },
};