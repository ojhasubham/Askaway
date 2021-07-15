"use strict";

let upcoming_meetings = null;
let pending_rating_meetings = null;
let current_meeting_id = null;

// Class Definition
var HomePage = function () {
  var _getUpcomingMeetingData = async function (e) {
    if (upcoming_meetings) {
      return;
    }
    await $.ajax('/api/upcoming-meetings', {
      method: 'GET',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      success: function (response) {
        if (response && response.status) {
          const { data: meetingsData } = response;
          if (meetingsData.length) {
            upcoming_meetings = meetingsData;
          }
        } else {
          _loader.hide();
          swal.fire({
            text: response.message,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok, got it!",
            customClass: {
              confirmButton: "btn font-weight-bold btn-light-primary"
            }
          }).then(function () {
            KTUtil.scrollTop();
          });
        }
      },
      error: function (error) {
        _loader.hide();
        swal.fire({
          text: error.responseText,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok, got it!",
          customClass: {
            confirmButton: "btn font-weight-bold btn-light-primary"
          }
        }).then(function () {
          KTUtil.scrollTop();
        });
      }
    })
  }

  var _setUpcomingMeetingData = function (e) {
    $("#upcoming_meetings_tbody").empty();
    if (upcoming_meetings && upcoming_meetings.length) {
      upcoming_meetings.forEach((meeting, index) => {
        $("#upcoming_meetings_tbody").append(`
          <tr>
            <td class="pl-0 py-6">${index + 1}</td>
            <td class="pl-0">
              <span class="text-dark-75 font-weight-bolder d-block font-size-lg">${meeting.zoomResponse.topic}</span>
            </td>
            <td>
              <span class="text-dark-75 font-weight-bolder d-block font-size-lg">
                ${moment(meeting.zoomResponse.start_time).format('MM/DD/YYYY h:mm A')}
              </span>
            </td>
            <td>
              <span class="text-info font-weight-bolder d-block font-size-lg">${meeting.zoomResponse.duration} min.</span>
            </td>
            <td>
              <span class="label label-lg label-inline ${meeting.status === STATUS_ACTIVE && 'label-light-success' || 'label-light-primary'}">
                ${meeting.status === STATUS_ACTIVE && 'Confirmed' || 'Pending'}
              </span>
            </td>
            <td class="d-flex justify-content-center">
              ${current_user && current_user.role === PROVIDER ? meeting.status === STATUS_ACTIVE && `<a class="btn btn-sm btn-light-info font-weight-bolder mx-2 px-5" href="` + meeting.zoomResponse.start_url + `" target="_black">
                Start
              </a>` || `<a class="btn btn-sm btn-light-success font-weight-bolder mx-2" href="/meetings/` + meeting.meetingId + `/` + meeting.confirmToken + `/confirm" target="_black" onClick="location.reload();">
                Confirm
              </button>
              <a class="btn btn-sm btn-light-danger font-weight-bolder mx-2" href="/meetings/` + meeting.meetingId + `/` + meeting.confirmToken + `/cancel" target="_black" onClick="location.reload();">
                Cancel
              </button> ` : ``}
            </td>
          </tr>
        `);
      });
    } else {
      $("#upcoming_meetings_tbody").append(`
        <tr>
          <td colspan="6" class="text-center">
            <span class="text-dark-75 font-weight-bolder d-block font-size-lg">No Upcoming Meetings found</span>
          </td>
        </tr>
      `);
    }
  }

  var _getPendingRatingMeetings = async function (e) {
    await $.ajax('/api/meetings/rating/pending', {
      method: 'GET',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      success: function (response) {
        if (response && response.status) {
          const { data: meetingsData } = response;
          if (meetingsData.length) {
            pending_rating_meetings = meetingsData;
          }
        } else {
          _loader.hide();
          swal.fire({
            text: response.message,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok, got it!",
            customClass: {
              confirmButton: "btn font-weight-bold btn-light-primary"
            }
          }).then(function () {
            KTUtil.scrollTop();
          });
        }
      },
      error: function (error) {
        _loader.hide();
        swal.fire({
          text: error.responseText,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok, got it!",
          customClass: {
            confirmButton: "btn font-weight-bold btn-light-primary"
          }
        }).then(function () {
          KTUtil.scrollTop();
        });
      }
    })
  }

  var _setPendingRatingMeetings = function (e) {
    if (pending_rating_meetings && pending_rating_meetings.length) {
      $("#rating").rateYo({
        fullStar: true
      });
      const meeting = pending_rating_meetings.find(item => !item._isUpdated);

      if (meeting) {
        current_meeting_id = meeting.meetingId;
        $("#meeting_topic").text(meeting.topic);
        $("#add_meeting_rating_modal").modal("toggle");
      }
    }
  }

  var _handleMeetingRatingForm = function (e) {
    $('#add_meeting_rating_submit').on('click', async function (e) {
      e.preventDefault();
      _loader.show();

      if (!(+$("#rating").rateYo("option", "rating") > 0)) {
        swal.fire({
          text: 'Rating is required',
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok, got it!",
          customClass: {
            confirmButton: "btn font-weight-bold btn-light-primary"
          }
        }).then(function () {
          KTUtil.scrollTop();
        });

        _loader.hide();
        return;
      }

      await $.ajax('/api/meeting/' + current_meeting_id + '/rating', {
        method: 'POST',
        contentType: 'application/json',
        processData: false,
        headers: getRequestHeaders(),
        data: JSON.stringify({
          rating: +$("#rating").rateYo("option", "rating"),
          ratingComments: $('textarea[name=ratingComments]').val(),
        }),
        success: function (result) {
          if (result.status) {
            let newData = pending_rating_meetings;
            pending_rating_meetings.forEach((item, i) => {
              if (item.meetingId === current_meeting_id) {
                newData[i]._isUpdated = true;
              }
            });
            pending_rating_meetings = newData;
            $("#rating").rateYo("option", "rating", 0);
            $('input[name="rating"]').prop('checked', false);
            $("#add_meeting_rating_modal").modal("toggle");

            _loader.hide();
            swal.fire({
              text: result.message,
              icon: "success",
              buttonsStyling: false,
              confirmButtonText: "Ok, got it!",
              customClass: {
                confirmButton: "btn font-weight-bold btn-light-primary"
              }
            }).then(function () {
              KTUtil.scrollTop();
              _setPendingRatingMeetings();
            });
          } else {
            $("#rating").rateYo("option", "rating", 0);
            $('input[name="rating"]').prop('checked', false);
            $("#add_meeting_rating_modal").modal("toggle");

            _loader.hide();
            swal.fire({
              text: result.message,
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok, got it!",
              customClass: {
                confirmButton: "btn font-weight-bold btn-light-primary"
              }
            }).then(function () {
              KTUtil.scrollTop();
              _setPendingRatingMeetings();
            });
          }
        },
        error: function (error) {
          _loader.hide();
          swal.fire({
            text: error.responseText,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok, got it!",
            customClass: {
              confirmButton: "btn font-weight-bold btn-light-primary"
            }
          }).then(function () {
            KTUtil.scrollTop();
          });
        }
      })
    });
  }


  var _initTable = async function () {
    const checkUser = () => {
      if (current_user.role === PROVIDER) {
        $("#upcoming_meeting_action_th").removeClass("d-none");
      }
    }
    if (current_user) {
      checkUser();
    } else {
      await $.ajax('/api/profile', {
        method: 'GET',
        async: true,
        contentType: 'application/json',
        processData: false,
        headers: getRequestHeaders(),
        success: function (response) {
          if (response) {
            current_user = response;
            checkUser();
          }
        },
      })
    }
  }

  // Public Functions
  return {
    // public functions
    init: async function () {
      await _getPendingRatingMeetings();
      _setPendingRatingMeetings();
      _handleMeetingRatingForm();
      await _initTable();
      await _getUpcomingMeetingData();
      _setUpcomingMeetingData();
      _loader.hide();
    }
  };
}();

// Class Initialization
jQuery(document).ready(async function () {
  HomePage.init();
});
