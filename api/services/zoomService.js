const nodemailer = require('nodemailer');
var handlebars = require('handlebars');
var fs = require('fs');
var sails = require('sails');

const jwt = require('jsonwebtoken');
const axios = require('axios');

const { errorAlert } = require('../utils/userActivityLog')
const {ZOOM_CREATE_SCHEDULE_MEETING_ERROR_1, ZOOM_API_ERROR_1} = require('../codes')

const baseURL = 'https://api.zoom.us/v2';
const methods = ['get', 'post', 'put', 'update', 'delete', 'patch'];

module.exports.getJwtToken = () => {
  const now = new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + 60 * 90;

  const token = jwt.sign(
    {
      aud: null,
      iss: process.env.ZOOM_API_KEY,
      exp,
      iat,
    },
    process.env.ZOOM_API_SECRET
  );

  return token;
};

const zoomAPI = async ({
  url,
  method,
  params = false,
  body = false,
  contentType = null,
}) => {
  try {
  const axiosInstance = axios.create({
    baseURL,
    headers: {
      'content-type': contentType ? contentType : 'application/json',
      Authorization: 'Bearer ' + this.getJwtToken(),
    },
  });

  method = method.toLowerCase();
  if (methods.includes(method)) {
    const request = axiosInstance[method];
    let args = [];
    if (method == 'get') {
      args = params ? [...args, { params }] : args;
    } else {
      args = [...args, body];
    }
    return request(url, ...args)
      .then((res) => {
        if (res.status === 204 && !res.data) {
          return true;
        }
        return res.data;
      })
      .catch((err) => {
        console.error('err : ', err);
        return false;
      });
  } else {
    sails.log.error(`zoomAPI Invalid HTTP Method - ${method} url - ${url}`);
    return false;
  }
} catch (error) {
  errorAlert(ZOOM_API_ERROR_1, {url: url, method: method, body: body}, error);
}
};

module.exports.createUser = async (user_info) => {
  try {
    const url = '/users';
    const method = 'post';
    const body = {
      action: 'create',
      user_info: {
        ...user_info,
        type: 1,  // basic.
      },
    };
    const response = await zoomAPI({ url, method, body });
    console.log('create user response : ', response);

    return response;
  } catch (error) {
    sails.log.error('Error in zoom create user : ', error);
    return false;
  }
};

module.exports.createScheduledMeeting = async (userId, meeting_info) => {
  try {
    const { topic, agenda, start_time, duration, timezone } = meeting_info;
    const url = '/users/' + userId + '/meetings';
    const method = 'post';
    const body = {
      topic,
      type: 2, // scheduled meeting
      start_time,
      timezone,
      agenda,
      duration,
      settings: {
        host_video: true,
        participant_video: true,
        // cn_meeting:false, // host meeting in china
        // in_meeting:true, // host meeting in india
        join_before_host: true,
        mute_upon_entry: false,
        watermark: false,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        audio: "both",
        auto_recording: "cloud",
        enforce_login: true,
        close_registration: false,
        waiting_room: true,
        meeting_authentication: true
      }
    };
    const response = await zoomAPI({ url, method, body });

    return response;
  } catch (error) {
    errorAlert(ZOOM_CREATE_SCHEDULE_MEETING_ERROR_1, {userId, ...meeting_info}, error);
    sails.log.error('Error in zoom create scheduled meeting : ', error);
    return false;
  }
};

module.exports.updateScheduledMeeting = async (meetingId, meeting_info) => {
  try {
    const { topic, start_time, duration, timezone } = meeting_info;
    const url = '/meetings/' + meetingId;
    const method = 'patch';
    const body = {
      topic,
      type: 2, // scheduled meeting
      start_time,
      timezone,
      duration,
      settings: {
        host_video: true,
        participant_video: true,
        // cn_meeting:false, // host meeting in china
        // in_meeting:true, // host meeting in india
        join_before_host: true,
        mute_upon_entry: false,
        watermark: false,
        use_pmi: false,
        approval_type: 0, // Automatically approve
        audio: "both",
        auto_recording: "cloud",
        enforce_login: true,
        close_registration: false,
        waiting_room: true,
        meeting_authentication: true
      }
    };
    const response = await zoomAPI({ url, method, body });
    console.log('update meeting response : ', response);

    return response;
  } catch (error) {
    sails.log.error('Error in zoom update scheduled meeting : ', error);
    return false;
  }
};

module.exports.deleteMeeting = async (meetingId) => {
  try {
    const url = '/meetings/' + meetingId;
    const method = 'delete';
    const response = await zoomAPI({ url, method });

    return response;
  } catch (error) {
    sails.log.error('Error in zoom delete meeting : ', error);
    return false;
  }
};

module.exports.reportMeetingParticipants = async (meetingId) => {
  try {
    const url = '/report/meetings/' + meetingId + '/participants';
    const method = 'get';
    const response = await zoomAPI({ url, method });

    return response;
  } catch (error) {
    sails.log.error('Error in get report of meeting participants : ', error);
    return false;
  }
};

module.exports.updateUser = async (userId, data) => {
  try {
    const url = '/users/' + userId;
    const method = 'patch';
    const body = data;
    const response = await zoomAPI({ url, method, body });

    console.log('update user response : ', response);
    return response;
  } catch (error) {
    sails.log.error('Error in zoom update user : ', error);
    return false;
  }
};

module.exports.setUserType = async (userId, type) => {
  try {
    const data = {
      type
    };

    return this.updateUser(userId, data);
  } catch (error) {
    sails.log.error('Error in zoom set user type : ', error);
    return false;
  }
};

module.exports.updateUserSettings = async (userId, data) => {
  try {
    const url = '/users/' + userId + '/settings';
    const method = 'patch';
    const body = data;
    const response = await zoomAPI({ url, method, body });

    console.log('update user settings response : ', response);
    return response;
  } catch (error) {
    sails.log.error('Error in zoom update user settings : ', error);
    return false;
  }
};

module.exports.setUserCloudRecording = async (userId) => {
  try {
    const data = {
      recording: {
        local_recording: false,
        cloud_recording: true,
        record_speaker_view: true,
        record_gallery_view: true,
        record_audio_file: true,
        save_chat_text: true,
        show_timestamp: false,
        recording_audio_transcript: false,
        auto_recording: 'cloud',
      },
    };
    return this.updateUserSettings(userId, data);

  } catch (error) {
    sails.log.error('Error in zoom set user cloud recording : ', error);
    return false;
  }
};
