"use strict";

// Class definition
var ChangePassword = function () {
	// Elements
	var offcanvas;

	// Private functions
	var _initAside = function () {
		// Mobile offcanvas for mobile mode
		offcanvas = new KTOffcanvas('kt_profile_aside', {
			overlay: true,
			baseClass: 'offcanvas-mobile',
			//closeBy: 'kt_user_profile_aside_close',
			toggleBy: 'kt_subheader_mobile_toggle'
		});
	}

	var _handleChangePasswordForm = function (e) {
		var validation;
		var form = KTUtil.getById('change_password_form');

		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					crPassword: {
						validators: {
							notEmpty: {
								message: 'The current password is required'
							}
						}
					},
					password: {
						validators: {
							notEmpty: {
								message: 'The new password is required'
							},
							stringLength: {
								min: 8,
								message: 'The new password must be minimum 8 characters long'
							},
							regexp: {
								regexp: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{8,30}$/,
								message: 'The new password must be between 8 and 30 char, contain at least one uppercase letter, one lowercase letter, one number and one special character'
							},
						}
					},
					cnPassword: {
						validators: {
							notEmpty: {
								message: 'The verify password is required'
							},
							identical: {
								compare: function () {
									return form.querySelector('[name="password"]').value;
								},
								message: 'The new password and its confirm are not the same'
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

		$('#change_password_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(async function (status) {
				if (status == 'Valid') {
					$.ajax(`/api/change-password`, {
						method: 'POST',
						async: true,
						contentType: 'application/json',
						processData: false,
						headers: getRequestHeaders(),
						data: JSON.stringify({
							password: $('input[name=password]').val(),
							currentPassword: $('input[name=crPassword]').val()
						}),
						success: function (result) {
							if (result.status) {
								$('input[name=crPassword]').val('');
								$('input[name=password]').val('');
								$('input[name=cnPassword]').val('');
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
									if (redirectTo) {
										window.location.href = redirectTo;
									} else {
										KTUtil.scrollTop();
									}
								});
							} else {
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
							scrollTop: $(messages[0]).focus().offset().top - 50
						  }, 1000);
					});
				}
			});
		});
	}

	return {
		// public functions
		init: function () {
			_initAside();
			_handleChangePasswordForm();

			isPageLoaded = true;
			if (isDashboardLoaded) {
				_loader.hide();
			}
		}
	};
}();

jQuery(document).ready(function () {
	ChangePassword.init();
});
