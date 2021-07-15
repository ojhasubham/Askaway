"use strict";

// Class definition
var SearchProvider = function () {
  // Private functions
  let selectedEmail = null;
  let selectedProviderId = null;
  let form = KTUtil.getById('new_message_form');
  var _handleNewMessageForm = function () {
    var validation;

    // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
    validation = FormValidation.formValidation(
      form,
      {
        fields: {
          email: {
            validators: {
              notEmpty: {
                message: 'Email is required'
              }
            }
          },
          message: {
            validators: {
              notEmpty: {
                message: 'Message description is required'
              }
            }
          }
        },
        plugins: {
          trigger: new FormValidation.plugins.Trigger(),
          bootstrap: new FormValidation.plugins.Bootstrap()
        }
      }
    );

    $('#new_message_submit').on('click', function (e) {
      e.preventDefault();
      // _loader.show();
      validation.validate().then(async function (status) {
        if (status == 'Valid') {
          _loader.show();
          let uploadFile = true;
          if($('#attachmentModal')[0].files && $('#attachmentModal')[0].files.length > 0) {
            _uploadFiles($('#attachmentModal')[0].files)
          }
          if(uploadFile){
            let msgSuccess = await _sendMessage({
              email: selectedEmail,
              text: $("textarea[name=message]").val(),
            })
            if(msgSuccess) {
              $("#newMessageModal").modal('toggle');
              swal.fire({
                text: response.message,
                icon: "success",
                buttonsStyling: false,
                confirmButtonText: "Ok, got it!",
                customClass: {
                  confirmButton: "btn font-weight-bold btn-light-primary"
                }
              }).then(function () {
                KTUtil.scrollTop();
              });
            }
            _loader.hide();
          } else {
            _loader.hide();
          swal.fire({
            text: "Sorry, looks like there are some errors detected, please try again.",
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
            KTUtil.scrollTop();
          });
        }
      });
    });
    $(".contact-btn").click(function (event) {
      event.preventDefault();
      _loader.show();
      if(token){
        if (event.target && event.target.value) {
          selectedEmail = event.target.value;
          selectedProviderId = $(event.target).attr('data-id')

          $('textarea[name=message]').val('');
          $("#newMessageModal").modal('toggle');
        }
      } else {
        window.location.href = "/auth/login";
      }
      _loader.hide();
    });
  }

  const _sendMessage = async function (body) {
    return new Promise((resolve, reject) => {
      $.ajax(`/api/messages`, {
        method: 'POST',
        async: true,
        contentType: 'application/json',
        processData: false,
        headers: getRequestHeaders(),
        data: JSON.stringify(body),
        success: async function (response) {
          if (response.status) {
            _loader.hide();
            resolve(true);
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
            resolve(false);
          }
        },
      });
    })
    
  }

  var _handleScheduleMeeting = function () {
    $('#scheduleMetting').click()
    $('#schedule_metting').on('click', function (e) {
      window.location.href = `/schedule-meeting/${selectedProviderId}`;
    })
  }

  var _handlefileUpload = function () {
    $('#attachmentModal').change(function(){
      $('#fileList').text('');
      let fileList = '';
      for(let file of $('#attachmentModal')[0].files){
        if(file !== 'undefined') {
          var maxSize = parseInt($(this).attr('data-max-size'),10),
          size = file.size;
          fileList += file.name + ', ';
          let isValid = maxSize > size;
          if(!isValid) {
            swal.fire({
              text: 'Please select file below 50MB',
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok, got it!",
              customClass: {
                confirmButton: "btn font-weight-bold btn-light-primary"
              }
            }).then(function () {
              KTUtil.scrollTop();
            });
            return null;
          }
        }
      }
      $('#fileList').text(fileList);
      
    });
  }
  var _clickEventDisable = function () {
    $('#newMessageModal').modal({backdrop:'static'})
    $('#new_message_submit').attr("disabled", true);
    $('#closemodal').attr("disabled", true);
  }
  var _clickEventEnable = function () {
    $('#newMessageModal').modal({backdrop:'dynamic'})
    $('#new_message_submit').attr("disabled", false);
    $('#closemodal').attr("disabled", false);
  }
  var _uploadFiles = function (files){
    return new Promise((resolve, reject) => {
      const fd = new FormData(); 
      for(let file of files){
        if(file !== 'undefined') {
          fd.append('attcahment', file); 
        }
      }
      
      _clickEventDisable();
      $('.progress').show();
      $.ajax(`/api/messages/upload`, {
        xhr: function() {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function(evt) {
            if (evt.lengthComputable) {
              var percentComplete = ((evt.loaded / evt.total) * 100);
              $(".progress-bar").width(percentComplete + '%');
              $(".progress-bar").html(percentComplete+'%');
            }
          }, false);
          return xhr;
        },
        method: 'POST',
        async: true,
        processData: false,
        contentType: false,
        mimeType: "multipart/form-data",
        processData: false,
        headers: getRequestHeaders(),
        data: fd,
        success: function (response) {
          _clickEventEnable();
          $('#attachmentModal').val('');
          $('#fileList').text('');
          if(response && JSON.parse(response)){
            let responseObj = JSON.parse(response)
            $('.progress').hide();
            if (responseObj.status) {
              const { message, data } = responseObj;
              if (message) {
                for (const file of data) {
                  const fileName = file.fd.split('message_media')[1];
                  _sendMessage({ email: selectedEmail, text: file.filename, fileName: fileName.replace(/[\/\\]/g, '') });
                }
                swal.fire({
                  text: message,
                  icon: "success",
                  buttonsStyling: false,
                  confirmButtonText: "Ok, got it!",
                  customClass: {
                    confirmButton: "btn font-weight-bold btn-light-primary"
                  }
                }).then(function () {
                  KTUtil.scrollTop();
                });
                resolve(true);
              }
            }
          }
          // _loader.hide();
        },
        beforeSend: function(){
          $('.progress').show();
          $(".progress-bar").width('0%');
        },
        error: function (error) {
          // _loader.hide();
          $('.progress').hide();
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
          reject(false)
        }
      });
      
    })
  }

  return {
    // public functions
    init: async function () {
      // hide progress bar
      $('.progress').hide();
      _handleNewMessageForm();

      _handleScheduleMeeting();

      _handlefileUpload();
    }
  };
}();

jQuery(document).ready(function () {
  SearchProvider.init();
});
