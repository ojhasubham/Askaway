"use strict";

// Class definition
var ScheduleMeeting = function () {
  // Elements
  var calendarEl;
  let events = []; // events that will display on calendar
  let meetingEvents = []; // meeting events that will display on calendar
  let meetingId = null;
  let meeting = null;
  let meetings = [];
  let scheduleMeetStart = null;
  let scheduleMeetEnd = null;
  let provider_data = null;
  let rescheduleMeetId = null;
  let selectedMaxDate = null;

  let stripe;
  let stripeElements;
  let tz;
  let calendar;

  // Private functions
  const setScheduleMeetingModal = (start, end) => {
    _loader.show();
    if (current_user && !current_user.stripeCusId) {
      $("#pay_detail_modal").modal("toggle");
      scheduleMeetStart = start;
      scheduleMeetEnd = end;
      _loader.hide();
      return
    } else if (scheduleMeetStart) {
      scheduleMeetStart = null;
      scheduleMeetEnd = null;
    }

    // const newMinDate = moment(start).format("YYYY-MM-DD HH:mm");
    const newDate = moment(start).format("YYYY-MM-DD");
    const newTime = moment(start).format("HH:mm A");
    // const newMaxDate = moment(end).subtract(minTimeSlotDuration, 'minutes').format("YYYY-MM-DD HH:mm");
    selectedMaxDate = moment(end).subtract(minTimeSlotDuration, 'minutes').format("MM/DD/YYYY hh:mm A");

    // $('input[name=startTime]').datetimepicker('setStartDate', newMinDate);
    // $('input[name=startTime]').datetimepicker('setEndDate', newMaxDate);

    $('input[name=startTime]').val(newDate);
    // $('input[name=startTime]').datetimepicker('update');
    // $('input[name=startTime]').datetimepicker('show');
    // $('input[name=startTime]').datetimepicker('hide');

    $('input[name=startTimeN]').timepicker('setTime', newTime);

    setDurationHandler();

    $("#schedule_meeting_modal").modal("toggle");
    _loader.hide();
  }

  const setMeetingModal = (meeting) => {
    meetingId = meeting.meetingId;
    $("#meeting_topic").text(meeting.zoomResponse.topic);
    $("#meeting_agenda").text(meeting.zoomResponse.agenda);
    $("#meeting_questions").text(meeting.questions);
    $("#meeting_start_time").text(moment(meeting.zoomResponse.start_time).format('MM-DD-YYYY hh:mm A'));
    $("#meeting_duration").text(meeting.zoomResponse.duration + ' Mins');
    $("#meeting_modal").modal("toggle");
    _loader.hide();
  }

  const setDurationHandler = () => {
    if (rescheduleMeetId) {
      $('option[durId]').attr("disabled", false);
      $('option[durId]').hide();
    } else {
      const minDate = moment($('input[name=startTime]').val() + ' ' + $('input[name=startTimeN]').val())

      const maxDate = moment(selectedMaxDate);

      const duration = maxDate && maxDate.diff(minDate, 'minutes') + minTimeSlotDuration || 0;

      $('option[durId]').attr("disabled", true);
      $('option[durId]').hide();

      $('option[durId]:lt(' + Math.floor(duration / minTimeSlotDuration) + ')').attr("disabled", false);
      $('option[durId]:lt(' + Math.floor(duration / minTimeSlotDuration) + ')').show();
      $("select[name=duration]").val("");
    }
  }

  async function deleteMeeting(meetId) {
    if (!rescheduleMeetId && !confirm("Are you sure! Do you want to cancel this meeting??")) {
      return;
    }

    _loader.show();
    await $.ajax(`/api/meeting/${meetId}`, {
      method: 'DELETE',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      success: function (response) {
        if (response.status) {
          if (rescheduleMeetId) {
            return;
          }
          _loader.hide();
          swal.fire({
            text: response.message,
            icon: "success",
            buttonsStyling: false,
            confirmButtonText: "Ok, got it!",
            customClass: {
              confirmButton: "btn font-weight-bold btn-light-primary"
            }
          }).then(function () {
            location.reload();
          });
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
      }
    })
  }

  async function createStripeCustomer(sourceToken) {
    await $.ajax('/api/stripe-customer', {
      method: 'POST',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      data: JSON.stringify({
        sourceToken
      }),
      success: function (response) {
        if (response.status) {
          current_user.stripeCusId = response.stripeCusId;
          _loader.hide();
          swal.fire({
            text: response.message,
            icon: "success",
            buttonsStyling: false,
            confirmButtonText: "Ok, got it!",
            customClass: {
              confirmButton: "btn font-weight-bold btn-light-primary"
            }
          }).then(function () {
            _loader.show();
            setScheduleMeetingModal(scheduleMeetStart, scheduleMeetEnd);
            $("#pay_detail_modal").modal('toggle');
            _loader.hide();
          });
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
    });
  }

  function checkUser() {
    if (current_user && !current_user.line1) {
      swal.fire({
        text: "Please complete your profile first",
        icon: "info",
        buttonsStyling: false,
        confirmButtonText: "Ok, got it!",
        customClass: {
          confirmButton: "btn font-weight-bold btn-light-primary"
        }
      }).then(function () {
        sessionStorage.setItem('redirectTo', location.pathname);
        if (current_user.role === STUDENT) {
          window.location.href = '/profile/user/update';
        } else if (current_user.role === PROVIDER) {
          window.location.href = '/profile/provider/update';
        }
      });
      return;
    }
  }

  async function _initPage() {
    if (current_user) {
      checkUser();
    } else {
      await $.ajax('/api/profile', {
        method: 'GET',
        async: true,
        contentType: 'application/json',
        processData: false,
        headers: getRequestHeaders(),
        success: async function (response) {
          if (response) {
            current_user = response;
            checkUser();
          } else {
            window.location.href = "/home";
          }
        },
      })
    }
  }

  function _initScheduleMeetingForm() {
    // $('input[name=startTime]').datetimepicker({
    //   format: "mm/dd/yyyy HH:ii P",
    //   showMeridian: true,
    //   autoclose: true,
    //   startDate: moment().format("YYYY-MM-DD HH:mm"),
    // });

    // $('input[name=startTime]').datetimepicker().on('changeDate', function (ev) {
    //   setDurationHandler();
    // })

    $('input[name=startTimeN]').timepicker({
      minuteStep: 5,
      defaultTime: '',
      showSeconds: false,
      showMeridian: true,
      // snapToStep: true
    });

    $('input[name=startTimeN]').timepicker().on('changeTime.timepicker', function (e) {
      console.log('called');

      setDurationHandler();
    });

    $("#reschedule_meeting_btn").click(function (event) {
      event.preventDefault();
      if (meeting) {
        sessionStorage.setItem('rescheduleMeetId', meeting.meetingId)
        sessionStorage.setItem('rescheduleStatus', "active");
      }

      location.reload();
    });

    $("#delete_meeting_btn").click(async function (event) {
      event.preventDefault();
      _loader.hide();
      await deleteMeeting(meetingId);
    });
  }

  function _initPaymentDetailsForm() {
    const card = stripeElements.create("card");
    card.mount("#card-element");

    card.on("change", ({ error }) => {
      const displayError = document.getElementById('card-errors');
      if (error) {
        displayError.textContent = error.message;
      } else {
        displayError.textContent = '';
      }
    });

    $("#pay_details_submit").click(function (event) {
      event.preventDefault();
      _loader.show();

      stripe.createToken(card).then(async (result) => {
        if (result.error) {
          // Inform the user if there was an error.
          var errorElement = document.getElementById('card-errors');
          errorElement.textContent = result.error.message;
          _loader.hide();
        } else {
          await createStripeCustomer(result.token.id);
        }
      });
    });
  }

  async function _getMeetingsData() {
    await $.ajax('/api/meetings/' + id, {
      method: 'GET',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      success: function (response) {
        if (response) {
          meetings = response;
        }
      },
      error: function (error) {
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
    });
  }

  function _setMeetingsData() {
    if (rescheduleMeetId) {
      meeting = meetings.find(item => (item.meetingId === rescheduleMeetId && (item.studentUserId === userId || item.providerUserId === userId)));
      console.log('meeting : ', meeting);
      if (meeting) {
        minTimeSlotDuration = meeting.zoomResponse.duration;
        $("#schedule_meeting_title").text('Reschedule Meeting');
        $("input[name=topic]").val(meeting.zoomResponse.topic);
        $("input[name=topic]").attr("disabled", true);
        $("input[name=agenda]").val(meeting.zoomResponse.agenda);
        $("textarea[name=questions]").val(meeting.questions);
        $("select[name=duration]").val(meeting.zoomResponse.duration);
        $("select[name=duration]").attr("disabled", true);
      } else {
        swal.fire({
          text: "Meeting not found under your account",
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok, got it!",
          customClass: {
            confirmButton: "btn font-weight-bold btn-light-primary"
          }
        }).then(function () {
          location.reload();
        });
      }
    }
  }

  async function _getProviderData() {
    await $.ajax('/api/profile?id=' + id, {
      method: 'GET',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      success: function (response) {
        if (response) {
          provider_data = response;
        }
      },
      error: function (error) {
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

  async function _setProviderData() {
    $('.schedule_meeting_provider_name').text(provider_data.first_name + ' ' + provider_data.last_name);
    $('.schedule_meeting_provider_rate').text(provider_data.currency + " " + provider_data.rate);
    // $('.schedule_meeting_provider_email').text(provider_data.email);
    const today = new Date();
    const { timeSlots, satTimeSlots, leaves, timeSloteUpdateAt } = provider_data;
    if (timeSlots && timeSlots.length) {
      let startDate = moment();//today date (This is the start date)
      let endDate = moment().add(1, 'months');//Date after 3 months from today (This is the end date)
      if(timeSloteUpdateAt){
        endDate = moment(timeSloteUpdateAt).add(1, 'months')
      }
      //extracting date from objects in MM-DD-YYYY format
      startDate = moment(startDate._d).format('MM-DD-YYYY');
      endDate = moment(endDate._d).format('MM-DD-YYYY');
      const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      timeSlots.forEach(parentItem => {
        const day = parentItem.day;
        parentItem.timeSlots.forEach(item => {

          //creating JS date objects
        const tsFrom = moment.utc(moment().format("MM-DD-YYYY") + " " + item.from).local().format('HH:mm'); // utc to local time conversion
        const tsTo = moment.utc(moment().format("MM-DD-YYYY") + " " + item.to).local().format('HH:mm'); // utc to local time conversion
        let start = new Date(startDate + " " + tsFrom);
        let to = new Date(startDate + " " + tsTo);
        let end = new Date(endDate);

        //Logic for getting rest of the dates between two dates("FromDate" to "EndDate")
        let dateArr = []; //Array where rest of the dates will be stored
        let dayIndex  = weekday.indexOf(day);
        while (start < end) {
          if ((Math.abs(to - start) / (1000 * 60)) >= minTimeSlotDuration && start > today && dayIndex > -1 && start.getDay() == dayIndex) {
            dateArr.push({
              start: moment(start).format(),
              to: moment(to).format(),
            });
          }
          let newDate = start.setDate(start.getDate() + 1);
          let newTo = to.setDate(to.getDate() + 1);
          start = new Date(newDate);
          to = new Date(newTo);
        }

        events = events.concat(dateArr.map(item => {
          return {
            title: "Available",
            start: item.start,
            end: item.to,
          }
        }));
      });
      
    })
    }


    if (leaves && leaves.length) {
      events = events.filter(ev => {
        const evDate = moment(ev.start);
        return !leaves.some(lv => {
          return evDate.isBetween(moment(lv.start), moment(lv.end))
        })
      })
    }

    if (rescheduleMeetId) {
      if (events.length === 0) {
        swal.fire({
          text: "No time slots found for this meeting",
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok, got it!",
          customClass: {
            confirmButton: "btn font-weight-bold btn-light-primary"
          }
        }).then(function () {
          location.reload();
        });
      } else {
        swal.fire({
          text: "Select time slot to reschedule meeting",
          icon: "info",
          buttonsStyling: false,
          confirmButtonText: "Ok, got it!",
          customClass: {
            confirmButton: "btn font-weight-bold btn-light-primary"
          }
        }).then(function () {
          KTUtil.scrollTop();
        });
      }
    }

    if (!rescheduleMeetId && sessionStorage.getItem('rescheduleStatus')) {
      swal.fire({
        text: "Meeting Reschedule cancelled.",
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok, got it!",
        customClass: {
          confirmButton: "btn font-weight-bold btn-light-primary"
        }
      }).then(function () {
        KTUtil.scrollTop();
      });
      sessionStorage.removeItem('rescheduleStatus');
    }
  }

  var _initCalender = function () {
    meetings.forEach(meet => {
      const meetStart = moment(meet.zoomResponse.start_time);
      const meetEnd = moment(meet.zoomResponse.start_time).add(meet.zoomResponse.duration, 'm');

      let newEvents = [];
      events.forEach((event, index) => {
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);

        if (moment(eventStart).isSameOrBefore(meetStart) && moment(eventEnd).isSameOrAfter(meetStart) // when time slot covers whole meeting
          || moment(meetStart).isSameOrBefore(eventStart) && moment(meetEnd).isSameOrAfter(eventEnd) // when meeting covers whole time slot
          || moment(meetStart).isSameOrBefore(eventStart) && moment(meetEnd).isSameOrAfter(eventStart) // when meeting start before time slot and end within the time slot
        ) {
          if (meetStart.diff(eventStart, "minutes") >= minTimeSlotDuration) {
            newEvents.push({
              ...event,
              end: meetStart.format()
            })
          }
          if (eventEnd.diff(meetEnd, "minutes") >= minTimeSlotDuration) {
            newEvents.push({
              ...event,
              start: meetEnd.format()
            })
          }
          events.splice(index, 1);
        }
      });
      events = [...events, ...newEvents];
    });
    meetingEvents = meetings.map(meet => {
      return {
        title: "Occupied",
        start: meet.zoomResponse.start_time,
        end: moment(meet.zoomResponse.start_time).add(meet.zoomResponse.duration, 'm').format(),
        id: meet.id,
        color: "#ffa500",
      }
    })

    const eventClick = (info) => {
      _loader.show();
      if (calendar && calendar.state && calendar.state.viewType === "dayGridMonth" && info.event.start) {
        const dateStr = moment(info.event.start).format("YYYY-MM-DD");
        calendar.changeView('timeGridDay', dateStr);
        _loader.hide();
        return;
      }
      if (!rescheduleMeetId && info.event.id) {
        meeting = meetings.find(item => item.id === info.event.id) || null;
        if (meeting && (meeting.studentUserId === userId || meeting.providerUserId === userId)) {
          setMeetingModal(meeting)
        }
      } else if (!info.event.id) {
        setScheduleMeetingModal(info.event.start, info.event.end);
      } else {
        _loader.hide();
      }

      // visited events
      info.el.style.borderColor = 'red';
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
      plugins: ['interaction', 'dayGrid', 'timeGrid'],
      defaultView: 'dayGridMonth',
      // defaultDate: '2020-04-07',
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth timeGridDay'
      },
      dateClick: function (info) {
        calendar.changeView('timeGridDay', info.dateStr);
      },
      navLinks: true,
      eventColor: '#19ce45', // default color                                                                                 
      events: [...events, ...meetingEvents],
      // timeZoneParam: tz,
      eventClick
    });

    calendar.render();
  }

  function _handleScheduleMeetingForm() {
    var validation;
    var form = KTUtil.getById('schedule_meeting_form');

    // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
    validation = FormValidation.formValidation(
      form,
      {
        fields: {
          topic: {
            validators: {
              notEmpty: {
                message: 'Topic is required'
              }
            }
          },
          agenda: {
            validators: {
              notEmpty: {
                message: 'Agenda is required'
              }
            }
          },
          questions: {
            validators: {
              notEmpty: {
                message: 'Questions is required'
              }
            }
          },
          startTime: {
            validators: {
              notEmpty: {
                message: 'Start Date is required'
              }
            }
          },
          startTimeN: {
            validators: {
              notEmpty: {
                message: 'Start Time is required'
              }
            }
          },
          duration: {
            validators: {
              notEmpty: {
                message: 'Duration is required'
              }
            }
          },
        },
        plugins: {
          trigger: new FormValidation.plugins.Trigger(),
          bootstrap: new FormValidation.plugins.Bootstrap()
        }
      }
    );

    $('#schedule_meeting_submit').on('click', function (e) {
      e.preventDefault();
      _loader.show();

      validation.validate().then(async function (status) {
        if (status == 'Valid') {
          const data = {
            topic: $('input[name=topic]').val(),
            agenda: $('input[name=agenda]').val(),
            questions: $('textarea[name=questions]').val(),
            start_time: moment($('input[name=startTime]').val() + ' ' + $('input[name=startTimeN]').val()).format("YYYY-MM-DDTHH:mm:ss"),
            duration: $('select[name=duration]').val(),
            timezone: tz,
            isReschedule: false,
          };

          if (rescheduleMeetId) {
            data.isReschedule = true;
          }

          $.ajax(`/api/meeting/${id}`, {
            method: 'POST',
            async: true,
            contentType: 'application/json',
            processData: false,
            headers: getRequestHeaders(),
            data: JSON.stringify(data),
            success: async function (response) {
              if (response.status) {
                if (rescheduleMeetId) {
                  await deleteMeeting(rescheduleMeetId);
                  sessionStorage.removeItem('rescheduleStatus');
                  $('.modal').modal('hide');
                  _loader.hide();
                  swal.fire({
                    text: "Meeting rescheduled successfully",
                    icon: "success",
                    buttonsStyling: false,
                    confirmButtonText: "Ok, got it!",
                    customClass: {
                      confirmButton: "btn font-weight-bold btn-light-primary"
                    }
                  }).then(function () {
                    location.reload();
                  });
                } else {
                  $('#close_schedule_meeting_modal').click();
                  _loader.hide();
                  swal.fire({
                    text: response.message,
                    icon: "success",
                    buttonsStyling: false,
                    confirmButtonText: "Ok, got it!",
                    customClass: {
                      confirmButton: "btn font-weight-bold btn-light-primary"
                    }
                  }).then(function () {
                    location.reload();
                  });
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
            }
          })
        } else {
          let messages = [].slice.call(form.querySelectorAll('[data-validator]'))
					let errorMsg = "Sorry, looks like there are some errors detected, please try again.";
					if(messages && messages[0]){
						errorMsg = messages[0].textContent;
					}
          _loader.hide();
          swal.fire({
            text: errorMsg,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok, got it!",
            customClass: {
              confirmButton: "btn font-weight-bold btn-light-primary"
            }
          }).then(function () {
            $('html, body').animate({
							scrollTop: $(messages[0]).focus().offset().top - 125
						  }, 1000);
          });
        }
      });
    });
  }

  return {
    // public functions
    init: async function () {
      rescheduleMeetId = +sessionStorage.getItem('rescheduleMeetId');
      sessionStorage.removeItem('rescheduleMeetId');

      calendarEl = document.getElementById('meeting_schedule_calendar');
      stripe = Stripe(STRIPE_API_KEY);
      stripeElements = stripe.elements();
      tz = moment.tz.guess(true);

      await _initPage();
      _initScheduleMeetingForm();
      await _getMeetingsData();
      _setMeetingsData();
      await _getProviderData();
      _setProviderData();
      _initCalender();
      _initPaymentDetailsForm();
      _handleScheduleMeetingForm();

      _loader.hide();
    }
  };
}();

jQuery(document).ready(function () {
  ScheduleMeeting.init();
});
