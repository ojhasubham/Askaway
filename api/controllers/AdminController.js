
const {
  PROVIDER,
  STUDENT,
  EVERYONE,
  ROLES,
  STATUS_ACTIVE,
  STATUS_DEACTIVE,
  STATUS_PENDING,
  STATUS_DELETED,
  LOGIN_ERROR_1
} = require('../codes');
const categories = require('../codes/categories');
const { errorAlert } = require('../utils/userActivityLog')
const { sendRegVerifyEmail } = require('../services/email');

module.exports = { 

    authPage: (req, res) => {
        const { page } = req.allParams();
        const authPages = ['login'];
    
        if (req.path === '/') {
          return res.view('admin/login', { layout: 'commonLayout', ROLES, page: 'login', data: {} });
        }
    
        if (page && authPages.includes(page)) {
          return res.view('admin/login', { layout: 'commonLayout', ROLES, page, data: {} });
        }
    
        return res.notFound();
      },
      login: async (req, res) => {
        try {
          const email = req.body.email.trim().toLowerCase();
          const { password } = req.body;
          if(email !== 'admin') {
            return res.send({ status: false, message: 'Email Id Not Found' });
          } else if(password !== 'admin@123') {
            return res.send({ status: false, message: 'Please Enter valid Password.' });
          } else {
            res.status(200).send({
              status: true,
              message: 'Successful',
              token: 'AsdbhcyTre$459*ujio',
            });
          }
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
      homePage: (req, res) => {
        res.view('admin/home', { layout: 'admin/admindashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, STATUS_PENDING, STATUS_DELETED, STATUS_DEACTIVE, data: {} });
      },

      userPage: (req, res) => {
        res.view('admin/user', { layout: 'admin/admindashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, STATUS_PENDING, STATUS_DELETED, STATUS_DEACTIVE, data: {} });
      },

      getAllUsers: async (req, res) => {
        const users = await user.find({});
        // .select('first_name last_name full_name role city state country phone email status _id');
        if(users && users.length > 0){
          res.send({
            status: true,
            message: 'Users Get Successfully',
            data: users
          })
        } else {
          res.send({
            status: false,
            message: 'Error in Get Users'
          })
        }
      }, 

      changeUserStatus: async (req, res) => {
        const { userId, status } = req.body;

        const updateUser = await user.updateOne({_id: userId}).set({ status: status })
        if(updateUser && updateUser.id){
          res.send({
            status: true,
            message: 'Users Update Successfully',
          })
        } else {
          res.send({
            status: false,
            message: 'Error in Update Users'
          })
        }
      },

      resendVerificationMail: async(req, res) => {
        const {userId} = req.body;
        const userData = await user.findOne({_id: userId});
        if(userData && userData.email) {
         sendRegVerifyEmail(
            req,
            userData.email,
            userData.verifyToken,
            userData.phone,
            userData.country
          ).catch(error => {
            //TODO: Fix error handline here
            console.log('error :' + error);
          });
          
          res.status(200).send({
            status: true,
            message: 'signup successful please Verify your Email to login.',
          });
        } else {
          return res.send({
            status: false,
            message: 'Error in Resend Veryfication mail ',
          });
        }
      }
}
