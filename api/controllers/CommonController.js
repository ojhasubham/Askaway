
const {
  PROVIDER,
  STUDENT,
  EVERYONE,
  ROLES,
  STATUS_ACTIVE,
  STATUS_PENDING,
} = require('../codes');
const categories = require('../codes/categories');

module.exports = { 
      homePage: (req, res) => {
        res.view('common/home', { layout: 'common/mainPageLayout', categories, PROVIDER, STUDENT, data: {}});
      },
      aboutPage: (req, res) => {
        res.view('common/about', { layout: 'common/mainPageLayout', categories, PROVIDER, STUDENT, data: {}});
      },
      teamPage: (req, res) => {
        res.view('common/team', { layout: 'common/mainPageLayout', categories, PROVIDER, STUDENT, data: {}});
      },
      contactPage: (req, res) => {
        res.view('common/contact', { layout: 'common/mainPageLayout', categories, PROVIDER, STUDENT, data: {}});
      },
}
