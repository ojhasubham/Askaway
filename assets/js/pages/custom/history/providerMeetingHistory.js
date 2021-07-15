"use strict";

// Class Definition
var ProviderMeetingHistory = function () {
  var _MeetingHistoryContentEl;
  let meeting_history_data = null;

  var _checkCurrentUser = function (e) {
    if (current_user) {
      if (current_user.role !== PROVIDER) {
        window.location.href = "/user/meeting-history";
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
            if (response && response.role !== PROVIDER) {
              window.location.href = "/user/meeting-history";
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
        const balance = historyItem.balanceAdded;
        const charge = +(balance * chargePer / 100).toFixed(2);
        const netBalance = +(balance - charge).toFixed(2);

        $('.receiptDate').text(moment().format('LL'));
        $('.receiptOrderNo').text(historyItem.id);
        $('.receiptPartyName').text(historyItem.providerName);

        $("#receiptItemsTbody").empty();
        $("#receiptItemsTbody").append(`
        <tr>
        <td class="w-50">Meeting: ${historyItem.topic}</td>
        <td>${moment(historyItem.start_time).format('LL')}</td>
        <td>${historyItem.duration}</td>
        <td>${historyItem.currency} ${historyItem.rate}</td>
        <td>${historyItem.currency} ${netBalance}</td>
        </tr>
        `);

        $('.receiptSubtotal').text(historyItem.currency + ' ' + netBalance);
        $('.receiptTax').text('-');
        $('.receiptTotal').text(historyItem.currency + ' ' + netBalance);
        await downloadReceipt('receipt-' + historyItem.id);
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
      const balance = data.balanceAdded;
      const charge = +(balance * chargePer / 100).toFixed(2);
      const netBalance = +(balance - charge).toFixed(2);

      let studentsHtml = '';
      if (data.students && data.students.length) {
        data.students.forEach((student, i) => {
          studentsHtml += `<span>${student.studentName}</span>${data.students.length > i + 1 && '<hr class="m-0"/>' || ''}`
        });
      }

      html += '  <td class="px-0 py-6">' + indexNo + '</td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.topic + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + moment(data.start_time).format('MM/DD/YYYY h:mm A') + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.duration + ' min.</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + studentsHtml + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + data.currency + ' ' + data.rate + '</span></td>';
      html += '  <td><span class="text-dark-75 font-weight-bolder d-block font-size-lg">' + netBalance + '</span></td>';
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
  ProviderMeetingHistory.init();
});
