"use strict";

// Class Definition
var StudentMeetingHistory = function () {
  var _MeetingHistoryContentEl;
  let meeting_history_data = null;

  var _checkCurrentUser = function (e) {
    if (current_user) {
      if (current_user.role !== STUDENT) {
        window.location.href = "/provider/meeting-history";
      }
      return;
    } else {
      return $.ajax('/api/profile', {
        method: 'GET',
        async: true,
        contentType: 'application/json',
        processData: false,
        headers: getRequestHeaders(),
        success: function (response) {
          if (response) {
            if (response && response.role !== STUDENT) {
              window.location.href = "/provider/meeting-history";
            }
            current_user = response;
          } else {
            window.location.href = "/home";
          }
        },
      })
    }
  }

  var _getMeetingHistoryData = function (e) {
    if (meeting_history_data) {
      return;
    }

    return $.ajax('/api/meeting-history', {
      method: 'GET',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      success: function (response) {
        if (response && response.status) {
          const { data } = response;
          if (data.length) {
            meeting_history_data = data;
          }
        } else {
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

  async function generateReceipt(eventId) {
    _loader.show();
    if (eventId && meeting_history_data && meeting_history_data.length) {
      const historyItem = meeting_history_data.find(item => item.id === eventId);
      if (historyItem) {
        $('.receiptDate').text(moment().format('LL'));
        $('.receiptOrderNo').text(historyItem.chargeId);
        $('.receiptPartyName').text(historyItem.studentName);

        $("#receiptItemsTbody").empty();
        $("#receiptItemsTbody").append(`
        <tr>
          <td class="w-50">Meeting: ${historyItem.topic}</td>
          <td>${moment(historyItem.start_time).format('LL')}</td>
          <td>${historyItem.duration}</td>
          <td>${historyItem.currency} ${historyItem.rate}</td>
          <td>${historyItem.currency} ${historyItem.amount}</td>
          </tr>
          `);

        $('.receiptSubtotal').text(historyItem.currency + ' ' + historyItem.amount);
        $('.receiptTax').text('-');
        $('.receiptTotal').text(historyItem.currency + ' ' + historyItem.amount);
        await downloadReceipt('receipt-' + historyItem.chargeId);
        _loader.hide();
      }
    } else {
      _loader.hide();
    }
  }

  async function downloadReceipt(fileName) {
    var element = document.getElementById('receipt');
    var opt = {
      margin: 1,
      filename: fileName + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    await html2pdf().from(element).set(opt).save();
  }

  function addMeetingHistoryRecord(element, indexNo, data) {
    var historyEl = KTUtil.find(element, '#meeting_history_tbody');

    var node = document.createElement("TR");

    var html = '';
    if (data) {
      html += '  <td class="px-0 py-6">' + indexNo + '</td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.topic + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + moment(data.start_time).format('MM/DD/YYYY h:mm A') + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.duration + ' min.</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.providerName + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.chargeDuration + ' min.</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.currency + ' ' + data.rate + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.currency + ' ' + data.amount + '</span></td>';
      if (data.paymentStatus === PAYMENT_PAID) {
        html += '  <td><span class="label label-lg label-inline label-light-success">Paid</span></td>';
      } else if (data.paymentStatus === PAYMENT_PENDING) {
        html += '  <td><span class="label label-lg label-inline label-light-info">Pending</span></td>';
      } else {
        html += '  <td><span class="label label-lg label-inline">-</span></td>';
      }
      html += '  <td class="text-center">';
      if (data.recordings && data.recordings.video) {
        html += '    <a class="btn btn-sm btn-light-primary font-weight-bolder text-uppercase" title="Download recorded Video" href="/api/file/meeting-media?filename=' + data.recordings.video + '&access_token=' + token + '" download="' + data.recordings.video + '">Video</a>';
      } else {
        html += '    N/A';
      }
      html += '  </td>';
      html += '  <td class="text-center">';
      if (data.recordings && data.recordings.audio) {
        html += '    <a class="btn btn-sm btn-light-primary font-weight-bolder text-uppercase" title="Download recorded Video" href="/api/file/meeting-media?filename=' + data.recordings.audio + '&access_token=' + token + '" download="' + data.recordings.audio + '">Audio</a>';
      } else {
        html += '    N/A';
      }
      html += '  </td>';
      html += '  <td class="text-center">';
      if (data.recordings && data.recordings.chat) {
        html += '    <a class="btn btn-sm btn-light-primary font-weight-bolder text-uppercase" title="Download recorded Video" href="/api/file/meeting-media?filename=' + data.recordings.chat + '&access_token=' + token + '" download="' + data.recordings.chat + '">Chat</a>';
      } else {
        html += '    N/A';
      }
      html += '  </td>';
      html += '  <td class="text-center 321"><a class="download_receipt_btn flaticon-download icon-lg text-success" id="' + data.id + '"></a></td>';
    } else {
      html += '  <td colspan="13" class="text-center">';
      html += '    <span class="text-dark-75 font-weight-bolder d-block font-size-lg">No Meeting history found</span>';
      html += '  </td>';
    }

    KTUtil.setHTML(node, html);
    historyEl.appendChild(node);
  }

  var _setMeetingHistoryData = function (e) {
    _loader.show();
    $("#meeting_history_tbody").empty();
    if (meeting_history_data && meeting_history_data.length) {
      meeting_history_data.forEach((meetingHistory, index) => {
        addMeetingHistoryRecord(_MeetingHistoryContentEl, index + 1, meetingHistory);
      });

      $(".download_receipt_btn").click(async (event) => {
        event.preventDefault();
        _loader.show();
        const eventId = event.target.id;

        if (eventId) {
          generateReceipt(eventId);
        } else {
          _loader.hide();
        }
      });
      _loader.hide();
    } else {
      addMeetingHistoryRecord(_MeetingHistoryContentEl);
      _loader.hide();
    }
  }

  // Public Functions
  return {

    // public functions
    init: async function () {
      // Elements
      _MeetingHistoryContentEl = KTUtil.getById('kt_content');

      await _checkCurrentUser();
      await _getMeetingHistoryData();
      _setMeetingHistoryData();
    }
  };
}();

// Class Initialization
jQuery(document).ready(async function () {
  StudentMeetingHistory.init();
});
