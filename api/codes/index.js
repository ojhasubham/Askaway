//Role constants
module.exports.PROVIDER = 1;
module.exports.STUDENT = 2;
module.exports.EVERYONE = [this.PROVIDER, this.STUDENT];
module.exports.ROLES = { PROVIDER: this.PROVIDER, STUDENT: this.STUDENT };

// Week Days
module.exports.WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];


//user status
module.exports.STATUS_PENDING = 10;
module.exports.STATUS_ACTIVE = 20;
module.exports.STATUS_DELETED = 30;
module.exports.STATUS_DEACTIVE = 40;

//payment status
module.exports.PAYMENT_PENDING = 10;
module.exports.PAYMENT_PAID = 20;
module.exports.PAYMENT_REFUNDED = 30;

//zoom user type status
module.exports.ZOOM_USER_BASIC = 1;
module.exports.ZOOM_USER_LICENSED = 2;

//log type code;
module.exports.LOGIN_ERROR_1 = 'Error In Login Api 1';
module.exports.REGISTER_ERROR_1 = 'Error In Register Api 1';
module.exports.SCHEDULE_ERROR_1 = 'Error In Schedule Meeting Api 1';
module.exports.SCHEDULE_ERROR_1 = 'Error In Schedule Meeting Api 1';
module.exports.DELETE_MEETING_BY_MEETINGDATA_ERROR_1 = 'Error In Delete Meeting By MeetingData Api 1';
module.exports.PROVIDER_RATING_ERROR_1 = 'Error In Provider Rating Api 1';
module.exports.PROVIDER_RATING_ERROR_2 = 'Error In Provider Rating Api 2';
module.exports.CONFIRM_MEETING_ERROR_1 = 'Error In Confirm Meeting Api 1';
module.exports.DELETE_MEETING_ERROR_1 = 'Error In Delete Meeting Api 1';
module.exports.GET_MEETING_ERROR_1 = 'Error In Get Meeting By Provider Userid Api 1';
module.exports.CREATE_STRIPE_CUSTOMER_ERROR_1 = 'Error In create Stripe Customer Api 1';
module.exports.GET_STRIPE_CUSTOMER_ERROR_1 = 'Error In Get Stripe Customer Api 1';
module.exports.CREATE_STRIPE_TOKEN_ERROR_1 = 'Error In Meeting Controller Create Stripe Token Api 1';
module.exports.ADD_STRIPE_CARD_ERROR_1 = 'Error In Meeting Controller Add Stripe Card Api 1';
module.exports.GET_STRIPE_CARD_ERROR_1 = 'Error In Meeting Controller Get Stripe Card Api 1';
module.exports.SET_STRIPE_DEFAULT_CARD_ERROR_1 = 'Error In Meeting Controller Set Stripe Default Card Api 1';
module.exports.DELETE_STRIPE_CARD_ERROR_1 = 'Error In Meeting Controller Delete Stripe Card Api 1';
module.exports.GET_STRIPE_ACCOUNT_MEETING_ERROR_1 = 'Error In Meeting Controller Get Stripe Account Api 1';
module.exports.PROVIDER_REDEEM_BALANCE_ERROR_1 = 'Error In Meeting Controller Provider Redeem Balance Api 1';
module.exports.UPDATE_STRIPE_ACCOUNT_MEETING_ERROR_1 = 'Error In Meeting Controller Update Stripe Account Api 1';
module.exports.ADD_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1 = 'Error In Meeting Controller Add Stripe Bank Account Api 1';
module.exports.GET_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1 = 'Error In Meeting Controller Get Stripe Bank Account Api 1';
module.exports.SET_STRIPE_BANK_ACCOUNT_DEFAULT_MEETING_ERROR_1 = 'Error In Meeting Controller Set Stripe Bank Account Default Api 1';
module.exports.DELETE_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1 = 'Error In Meeting Controller Delete Stripe Bank Account Api 1';

module.exports.GET_MEETING_HISTORY_ERROR_1 = 'Error In Get Meeting History Api 1';
module.exports.GET_UPCOMING_MEETING_ERROR_1 = 'Error In Get Upcoming Meeting Api 1';
module.exports.GET_PENDING_MEETING_RATING_ERROR_1 = 'Error In Get Pending Meeting Review Api 1';
module.exports.ADD_MEETING_RATING_ERROR_1 = 'Error In Add Meeting Review Api 1';
module.exports.GET_PROVIDER_TRANSCTION_ERROR_1 = 'Error In Add Meeting Review Api 1';

module.exports.GET_FILEMEETING_MEDIA_ERROR_1 = 'Error In Get File Meeting Media Api 1';


//zoom service errors
module.exports.ZOOM_CREATE_SCHEDULE_MEETING_ERROR_1 = 'Error In Zoom Service Schedule Meeting Api 1';
module.exports.ZOOM_API_ERROR_1 = 'Error In Zoom Api 1';

//Stripe service error
module.exports.STRIPE_ERROR = 'Error In Stripe 1';
module.exports.STRIPE_CREATE_TOKEN = 'Error In Stripe Create Token 1';
module.exports.SRIPE_CREATE_CUSTOMER_1 = 'Error In Stripe Create Customer 1';
module.exports.STRIPE_CARD_ADD_ERROR_1 = 'Error In Add Stripe Card Api 1';
module.exports.STRIPE_CARD_GET_ERROR_1 = 'Error In Get Stripe Card Api 1';
module.exports.STRIPE_CARD_DELETE_ERROR_1 = 'Error In Delete Stripe Card Api 1';
module.exports.GET_STRIPE_ACCOUNT_ERROR_1 = 'Error In Get Stripe Account Api 1';
module.exports.UPDATE_STRIPE_ACCOUNT_ERROR_1 = 'Error In Update Stripe Account Api 1';
module.exports.SRIPE_CREATE_TRANSFER = 'Error In Stripe Create Transfer 1';
module.exports.ADD_STRIPE_BANK_ACCOUNT_ERROR_1 = 'Error In Add Stripe Bank Account Api 1';
module.exports.GET_STRIPE_BANK_ACCOUNT_ERROR_1 = 'Error In Get Stripe Bank Account Api 1';
module.exports.SET_STRIPE_BANK_ACCOUNT_ERROR_1 = 'Error In Set Stripe Bank Account Api 1';
module.exports.UPDATE_STRIPE_BANK_ACCOUNT_ERROR_1 = 'Error In Update Stripe Bank Account Api 1';