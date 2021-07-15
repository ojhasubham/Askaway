/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var bcrypt = require('bcryptjs');
const sails = require('sails');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const cache = require('memory-cache');
var shortid = require('shortid');

const dirname = process.cwd();
const { sendRegVerifyEmail, sendPassVerifyEmail } = require('../services/email');
const zoomService = require('../services/zoomService');
const txtService = require('../services/textService');
const authService = require('../services/authService');
const { isEmpty } = require('../validation');

const { errorAlert } = require('../utils/userActivityLog')

const { getIpToTimezone, getRequestToIp, isValidTimeZone } = require('../utils')

const {
  PROVIDER,
  STUDENT,
  EVERYONE,
  ROLES,
  STATUS_ACTIVE,
  STATUS_PENDING,
  LOGIN_ERROR_1,
  REGISTER_ERROR_1
} = require('../codes');
const categories = require('../codes/categories');

module.exports = {
  updateProviderProfilePage: (req, res) => {
    const countries = require('../codes/countries.json');

    res.view('profile/updateProviderProfile', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, countries, data: {} });
  },

  updateStudentProfilePage: (req, res) => {
    res.view('profile/updateStudentProfile', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
  },

  authPage: (req, res) => {
    const { page } = req.allParams();
    const authPages = ['login', 'signup', 'signup-provider', 'forgot-password'];

    if (req.path === '/') {
      return res.view('user/login', { layout: 'commonLayout', ROLES, page: 'login', data: {} });
    }

    if (page && authPages.includes(page)) {
      return res.view('user/login', { layout: 'commonLayout', ROLES, page, data: {} });
    }

    return res.notFound();
  },

  homePage1: (req, res) => {
    res.view('user/home1', { categories, PROVIDER, STATUS_ACTIVE, data: {} });
  },

  homePage: (req, res) => {
    res.view('user/home', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
  },

  forgetPasswordVerifyPage: (req, res) => {
    const { id } = req.allParams();
    return res.view('user/forgetPasswordVerify', { layout: 'commonLayout', id });
  },

  changePasswordPage: (req, res) => {
    res.view('profile/changePassword', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
  },

  providerProfile: async (req, res) =>{
    const userData = await user.findOne({ providerUniqueId: req.params.providerid });
    console.log(userData);
  },

  providersPage: async (req, res) => {
    try {
      let { search, skip, limit } = req.query;
      if (search) {
        search = search.trim();
        search = search.split(' ' + process.env.SEARCH_SEPARATOR_CHARACTER + ' ')[0];

        if (+search) {
          return res.view('pages/searchProvider', { layout: 'common/mainPageLayout', providers: [], search, categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
        }
        skip = +skip && +skip || 0;
        limit = +limit && +limit || 10; // default limit 10

        const providers = await user.find({
          where: {
            role: PROVIDER,
            status: STATUS_ACTIVE,
            or: [
              { keywords: { contains: search } },
              { first_name: { contains: search } },
              { last_name: { contains: search } },
              { full_name: { contains: search } },
              { email: { contains: search } },
              { city: { contains: search } },
              { state: { contains: search } },
              { countryName: { contains: search } },
              { 'cat.name': { contains: search } },
              { 'subCat.name': { contains: search } }
            ],
          },
          skip,
          limit
        }).meta({ enableExperimentalDeepTargets: true });

        let providersList = [];
        for (let i = 0; i < providers.length; i++) {
          const provider_data = providers[i];
          let { id: providerUserId } = provider_data;
          let studentRatings = [];

          var meetingHistory = await meeting_taken_history.find({
            where: { providerUserId },
          });

          if (meetingHistory && meetingHistory.length) {
            for (let j = 0; j < meetingHistory.length; j++) {
              const meetingHistoryData = meetingHistory[j];
              if (meetingHistoryData && meetingHistoryData.students && meetingHistoryData.students.length) {
                for (let k = 0; k < meetingHistoryData.students.length; k++) {
                  const studentData = meetingHistoryData.students[k];

                  if (!isEmpty(studentData.rating)) {
                    studentRatings.push(studentData.rating)
                  }
                }
              }
            }
          }
          let ratingsAvg = 0;
          let ratingsCount = studentRatings.length;
          let ratingsSum = studentRatings.reduce((a, b) => a + b, 0);
          if (ratingsCount) ratingsAvg = ratingsSum / ratingsCount;

          providersList.push({ ...provider_data, ratingsCount, ratingsAvg });
        }

        return res.view('pages/searchProvider', { layout: 'common/mainPageLayout', providers: providersList, search, categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
      } else {
        res.redirect('/home');
      }
    } catch (error) {
      sails.log.error('Error in search provider page : ', error);
      return res.send({
        status: false,
        message: 'Error in search provider page',
      });
    }
  },

  getProfile: (req, res) => {
    const { id } = req.userData;
    let { id: providerId } = req.query;

    user.findOne({ _id: providerId || id }).exec(async (err, result) => {
      if (err) {
        return res.send(500, { err: err });
      }
      if (result) {
        delete result.password;
        delete result.verifyToken;
        return res.send(result);
      }

      return res.send({
        status: false,
        message: 'User not found.',
      });
    });
  },

  verifyAccount: async (req, res) => {
    const userData = await user.findOne({ verifyToken: req.params.token });
    let newZoomUser = null;
    if (userData) {
      const { id, status, first_name, last_name, email, role } = userData;
      if (status === STATUS_ACTIVE) {
        return res.view('user/verifyAccount', {
          layout: 'commonLayout',
          status: true,
          title: 'Verify Successful',
          message: 'Your Email Address is already verified. You can login now.'
        });
      }

      if (role === PROVIDER) {
        let zoomUserInfo = {
          email,
          first_name,
          last_name,
        };

        newZoomUser = await zoomService.createUser(zoomUserInfo);
        if (newZoomUser) {
          const zoomUserData = {
            userId: id,
            zoomUserId: newZoomUser.id,
            zoomResponse: newZoomUser,
          };
          console.log('before zoomUser create', zoomUserData);
          await zoomUser.create(zoomUserData);
        }
      }

      if (role === PROVIDER || role === STUDENT) {
        console.log('before updateOne');
        await user.updateOne({ id }).set({ status: STATUS_ACTIVE });
        if (role === PROVIDER) {
          await providerTransactions.create({ balance: 0, userId: id });
        }
      }
      return res.view('user/verifyAccount', {
        layout: 'commonLayout',
        status: true,
        title: 'Verify Successful',
        message: 'Thank you for Verifying your Email Address. You can login to your account now.'
      });
    }

    return res.view('user/verifyAccount', {
      layout: 'commonLayout',
      status: false,
      title: 'Verify Unsuccessful',
      message: 'Your Email address can not be verified. Invalid token provided.'
    });
  },

  providerProfile: async (req, res) => {
    sails.log('Opening provider page');
    try {
       let providerId = req.params.providerid
       const providers = await user.find({where: {providerUniqueId: providerId}});
        let providersList = [];
        for (let i = 0; i < providers.length; i++) {
          const provider_data = providers[i];
          let { id: providerUserId } = provider_data;
          let studentRatings = [];

          var meetingHistory = await meeting_taken_history.find({
            where: { providerUserId },
          });

          if (meetingHistory && meetingHistory.length) {
            for (let j = 0; j < meetingHistory.length; j++) {
              const meetingHistoryData = meetingHistory[j];
              if (meetingHistoryData && meetingHistoryData.students && meetingHistoryData.students.length) {
                for (let k = 0; k < meetingHistoryData.students.length; k++) {
                  const studentData = meetingHistoryData.students[k];

                  if (!isEmpty(studentData.rating)) {
                    studentRatings.push(studentData.rating)
                  }
                }
              }
            }
          }
          let ratingsAvg = 0;
          let ratingsCount = studentRatings.length;
          let ratingsSum = studentRatings.reduce((a, b) => a + b, 0);
          if (ratingsCount) ratingsAvg = ratingsSum / ratingsCount;

          providersList.push({ ...provider_data, ratingsCount, ratingsAvg });
        }

        return res.view('pages/providerProfile', { layout: 'common/mainPageLayout', providers: providersList, providerId, categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
      
    } catch (error) {
      sails.log.error('Error in provider unique profile page : ', error);
      return res.send({
        status: false,
        message: 'Error in provider unique profile page',
      });
    }
},


  signup: async (req, res) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const role = +req.body.role;
      const { password, first_name, last_name, country, phone } = req.body;
      console.log('Received signup request for email: ' + email)
      if (!EVERYONE.includes(+role))
        return res.send({ status: false, message: 'Role is Invalid.' });

      let timezone;
      const ip = await getRequestToIp(req);
      if(ip) {
        timezone = await getIpToTimezone(ip)
      }
      const getUser = await user.findOne({ email });
      if (getUser)
        return res.send({ status: false, message: 'Email is already exists.' });
      else
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            res.json({
              status: false,
              message: 'Not found',
            });
          } else {
            let _first_name = first_name.charAt(0).toUpperCase() + first_name.slice(1);
            let _last_name = last_name.charAt(0).toUpperCase() + last_name.slice(1);
            let data = {
              first_name: _first_name,
              last_name: _last_name,
              full_name: _first_name + ' ' + _last_name,
              email,
              country,
              phone,
              password: hash,
              role,
              status: STATUS_PENDING,
              verifyToken: Math.random().toString(36).replace('0.', ''),
              register_timezone: timezone,
              register_ip: ip
            };
            user.create(data).then(async () => {
              res.status(200).send({
                status: true,
                message: 'signup successful please Verify your Email to login.',
              });

              let roleName = null;
              if (role === STUDENT) {
                roleName = 'User'
              } else if (role === PROVIDER) {
                roleName = 'Provider'
              }

              const textResponse = await txtService.sendSignUpText(
                'You have signed up as a :' + roleName + ' on asknanswr with the email address : ' + email,
                phone
              )

              const response = await sendRegVerifyEmail(
                req,
                email,
                data.verifyToken,
                phone,
                country
              ).catch(error => {
                //TODO: Fix error handline here
                console.log('error :' + error);
              });
            })
          }
        });
    } catch (error) {
      errorAlert(REGISTER_ERROR_1, req.body, error);
      sails.log.error('Error in user signup : ', error);
      return res.send({
        status: false,
        message: 'Error in user signup',
      });
    }
  },

  login: async (req, res) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const { password } = req.body;
      let timezone;
      const ip = await getRequestToIp(req);
      if(ip) {
        timezone = await getIpToTimezone(ip)
      }

      const getUser = await user.findOne({email: email });
      if (!getUser)
        return res.send({ status: false, message: 'Email Id Not Found' });
      if (getUser.status === STATUS_PENDING)
        return res.send({ status: false, message: 'Email Id is Not verified' });
      else
        bcrypt.compare(password, getUser.password, async (err, result) => {
          if (err) {
            return res.send({
              status: false,
              message: 'Please Enter valid Password.',
            });
          } else if (result) {
            if(timezone && isValidTimeZone(timezone)){
              // for update timzone
              await  user.updateOne({email: email}).set({timezone: timezone, ip: ip})
            }
            const token = await authService.generateAccessToken({ id: getUser.id, email: getUser.email, role: getUser.role, timezone: timezone ? timezone : getUser.timezone }, 120000);
            res.status(200).send({
              status: true,
              message: 'Successful',
              id: getUser.id,
              token: token,
            });
          } else {
            res.send({
              status: false,
              message: 'Please enter valid credentials.',
            });
          }
        });
    } catch (error) {
      delete req.body.password;
      errorAlert(LOGIN_ERROR_1, req.body, error);
      sails.log.error('Error in login : ', error);
      return res.send({
        status: false,
        message: 'Error in login',
      });
    }
  },

  updateForgetPassword: async (req, res) => {
    try {
      const getUser = await user.findOne({
        forgetPasswordToken: req.params.token,
      });
      if (!getUser)
        return res.send({
          status: false,
          message: 'Token is Invalid',
        });

      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          return res.send({
            status: false,
            message: 'Not found',
          });
        } else {
          var data = {
            password: hash,
            forgetPasswordToken: Math.random().toString(36).replace('0.', ''),
          };
          user.update({ _id: req.params.id }, data).exec((err, result) => {
            if (err) {
              return res.send(500, { err: err });
            }
            res.json({
              status: true,
              message: 'Password updated successfully',
            });
          });
        }
      });
    } catch (error) {
      sails.log.error('Error in update forget Password : ', error);
      return res.send({
        status: false,
        message: 'Error in update forget Password',
      });
    }
  },

  forgetPassword: async (req, res) => {
    try {
      const getUser = await user.findOne({ email: req.body.email });
      if (!getUser)
        return res.send({ status: false, message: 'Email is Not Found' });
      const data = {
        forgetPasswordToken: Math.random().toString(36).replace('0.', ''),
      };
      await user.updateOne({ email: req.body.email }).set(data);

      const response = await sendPassVerifyEmail(
        req,
        req.body.email,
        data.forgetPasswordToken,
        getUser.phone,
        getUser.country
      );

      if (!response) {
        return res.send({ status: false, message: 'Email Id Not Found' });
      }

      res.send({
        status: true,
        message: 'Forget password link sent to your email Id',
      });
    } catch (error) {
      sails.log.error('Error in reset forget Password : ', error);
      return res.send({
        status: false,
        message: 'Error in reset forget Password',
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const getUser = await user.findOne({ _id: req.userData.id });
      if (!getUser) return res.send({ status: false, message: 'User not found' });

      bcrypt.compare(
        req.body.currentPassword,
        getUser.password,
        (err, result) => {
          if (result) {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
              if (err) {
                return res.send({ state: false, message: 'Not found' });
              } else {
                var data = {
                  password: hash,
                };
                user
                  .update({ _id: req.userData.id }, data)
                  .exec((err, result) => {
                    if (err) {
                      return res.send(500, { err: err });
                    } else {
                      res.json({
                        status: true,
                        message: 'Password updated successfully',
                      });
                    }
                  });
              }
            });
          } else {
            res.json({
              status: false,
              message: 'your current password is Incorrect',
            });
          }
        }
      );
    } catch (error) {
      sails.log.error('Error in change Password : ', error);
      return res.send({
        status: false,
        message: 'Error in change Password',
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id, role } = req.userData;
      console.log('req.userData : ', req.userData);

      if (role === PROVIDER) {
        const { summary, linkedInUrl, blogUrl, website, keywords, country, countryName, line1, line2, city, state, postal_code, dob, id_number, phone, currency, rate, cat, subCat, timeSlots, timeSloteUpdateAt, leaves, companyName } = req.body;
        const userData = await user.findOne({ id });
        let providerUniqueId;
          if (userData) {
            if (leaves && leaves.length) {
              const searchDates = leaves.map(item => moment(item, "MM/DD/YYYY").format("MM/DD/YYYY"));
              const meetingsList = await meetings.find({
                providerUserId: id,
                status: { in: [STATUS_ACTIVE, STATUS_PENDING] },
                meetingDate: searchDates
              })

              if (meetingsList && meetingsList.length) {
                return res.send({
                  status: false,
                  message: 'scheduled meeting found on your leave days.',
                  meetings: meetingsList
                });
              }
            }
          let newData;
          
          if(userData.providerUniqueId == null){
             providerUniqueId = shortid.generate();
             newData = { summary, linkedInUrl, blogUrl, website, keywords, country, countryName, line1, line2, city, state, postal_code, dob, id_number, phone, currency, rate, cat, subCat, timeSlots, timeSloteUpdateAt, leaves, companyName,providerUniqueId };    
          }else{
            providerUniqueId = userData.providerUniqueId;
             newData = { summary, linkedInUrl, blogUrl, website, keywords, country, countryName, line1, line2, city, state, postal_code, dob, id_number, phone, currency, rate, cat, subCat, timeSlots, timeSloteUpdateAt, leaves, companyName };
          }
          await user.updateOne({ id }).set(newData);
        } else {
          return res.json({
            status: false,
            message: 'User not found',
          });
        }
        res.json({
          status: true,
          message: 'Provider profile updated successfully. Your unique url is : ' + `${req.protocol}://${req.get('host')}/p/` + providerUniqueId
        });
      } else if (role === STUDENT) {
        const { country, line1, line2, city, state, phone } = req.body;
        const userData = await user.findOne({ id });

        const newData = { country, line1, line2, city, state, phone };
        if (userData) {
          await user.updateOne({ id }).set(newData);
        } else {
          return res.json({
            status: false,
            message: 'User not found',
          });
        }

        res.json({
          status: true,
          message: 'User profile updated successfully',
        });
      }
    } catch (error) {
      sails.log.error('Error in update provider Profile : ', error);
      return res.send({
        status: false,
        message: 'Error in update provider Profile',
      });
    }
  },

  uploadProfilePic: async (req, res) => {
    try {
      const { id } = req.userData;

      const userData = await user.findOne({ id });

      if (userData) {
        const pr = req.file('profile');
        const fileExt = pr._files[0].stream.filename && pr._files[0].stream.filename.split('.').pop().toLowerCase() || '.jpg';
        const fileName = Date.now() + '-profilePic-' + id + '.' + fileExt;

        pr.upload({
          maxBytes: 2 * 1024 * 1024, // 2MB
          dirname: path.resolve(dirname, 'profile_media'),
          saveAs: fileName
        }, async function whenDone(err, uploadedFiles) {
          if (err) {
            return res.json({
              status: false,
              message: 'Server error.',
              err,
            });
          }

          // If no files were uploaded, respond with an error.
          if (uploadedFiles.length === 0) {
            return res.json({
              status: false,
              message: 'Profile pic can not be uploaded.',
            });
          }

          user.update(id, { profilePic: fileName }).exec(function (err) {
            if (err) {
              return res.json({
                status: false,
                err,
              });
            }

            return res.json({
              status: true,
              message: 'Profile pic uploaded successfully.',
              profilePic: fileName
            });
          });

          const { profilePic: currentProfilePic } = userData;
          if (currentProfilePic) {
            fs.unlink(dirname + '/profile_media/' + currentProfilePic, function (err) {
              if (err) {
                console.error('delete profile pic file error', err);
              }
            });
          }
        });
      } else {
        return res.json({
          status: false,
          message: 'User not found.',
        });
      }
    } catch (error) {
      sails.log.error('Error in upload Profile pic : ', error);
      return res.send({
        status: false,
        message: 'Error in upload Profile pic.',
      });
    }
  },

  deleteProfilePic: async (req, res) => {
    try {
      const { id } = req.userData;
      const userData = await user.findOne({ id });

      if (userData) {
        const { profilePic: currentProfilePic } = userData;
        if (currentProfilePic) {
          fs.unlink(dirname + '/profile_media/' + currentProfilePic, function (err) {
            if (err) {
              console.error('delete profile pic file error', err);
            }
          });
        }

        user.update(id, { profilePic: '' }).exec(function (err) {
          if (err) {
            return res.json({
              status: false,
              err,
            });
          }

          return res.json({
            status: true,
            message: 'Profile picture removed successfully.',
          });
        });
      } else {
        return res.json({
          status: false,
          message: 'User not found.',
        });
      }
    } catch (error) {
      sails.log.error('Error in remove Profile pic : ', error);
      return res.send({
        status: false,
        message: 'Error in remove Profile pic.',
      });
    }
  },

  getFileProfileMedia: async (req, res) => {
    try {
      let { filename } = req.allParams();

      if (filename) {
        const filePath = await fileService.getFile('profile_media', filename);
        if (filePath) {
          return res.sendFile(filePath);
        }
      }

      return res.status(404).send({
        status: false,
        message: 'file not found.',
      });
    } catch (error) {
      sails.log.error('Error in get file of profile media : ', error);
      return res.status(500).send({
        status: false,
        message: 'Error in get file of profile media',
      });
    }
  },

  getProviderList: async (req, res) => {
    try {
      const providersList = cache.get('providersList');
      console.log(providersList);

      return res.send({
        status: true,
        data: providersList,
      });
    } catch (error) {
      sails.log.error('Error in get provider list : ', error);
      return res.status(500).send({
        status: false,
        message: 'Error in get provider list',
      });
    }
  },
};
