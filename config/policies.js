/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  UserController: {
    getProfile: "auth",
    changePassword: "auth",
    updateProfile: "auth",
    uploadProfilePic: "auth",
    deleteProfilePic: "auth",
    getProviderList: "noAuth",
    login: "noAuth",
    signup: "noAuth",
    updateForgetPassword: "noAuth",
    forgetPassword: "noAuth",
  },
  MeetingController: {
    createScheduledMeeting: "auth",
    getMeetings: "auth",
    deleteMeeting: "auth",
    getMeetingHistory: "auth",
    getUpcomingMeetings: "auth",
    getPendingRatingMeetings: "auth",
    addMeetingRating: "auth",
    getProviderTransactions: "auth",
    providerRedeemBalance: "auth",
    createStripeToken: "auth",
    createStripeCustomer: "auth",
    getStripeCustomer: "auth",
    updateStripeAccount: "auth",
    getStripeAccount: "auth",
    addStripeAccountBank: "auth",
    getStripeAccountBanks: "auth",
    setDefaultStripeAccountBank: "auth",
    deleteStripeAccountBank: "auth",
    addStripeCustomerCard: "auth",
    getStripeCustomerCards: "auth",
    setDefaultStripeCustomerCard: "auth",
    deleteStripeCustomerCard: "auth",
    getFileMeetingMedia: "auth",
    zoomWebhookMeetings: "zoomWebhookAuth",
    zoomWebhookRecordings: "zoomWebhookAuth",
  },
  MessageController: {
    sendNewMessage: "auth",
    getMessagesList: "auth",
    sendMessage: "auth",
    getMessages: "auth",
    uploadAttachment: 'auth',
    getFileMessageMedia: 'noAuth'
  },
  PassportController: {
    googleAuthLogin: "noAuth",
    googleAuthRegister: "noAuth",
    googleCallback: "noAuth",
    facebookAuth: "noAuth",
    facebookCallback: "noAuth",
  },

  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ***************************************************************************/

  // '*': true,
  // '*': 'noCache'
};
