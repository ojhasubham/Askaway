"use strict";

// Class Definition
var KTLogin = function () {
	var _showForm = function (form) {
		KTUtil.animateClass(KTUtil.getById('reset_password_form'), 'animate__animated animate__backInUp');
	}

	var _handleResetPasswordForm = function (e) {
		var validation;
		var form = KTUtil.getById('reset_password_form');

		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					npassword: {
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
					cpassword: {
						validators: {
							notEmpty: {
								message: 'The password confirmation is required'
							},
							identical: {
								compare: function () {
									return form.querySelector('[name="npassword"]').value;
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

		// Handle submit button
		$('#reset_password_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(function (status) {
				console.log('status : ', status);

				if (status == 'Valid') {
					$.ajax(`/api/forgot-password/verify/${id}`, {
						method: 'POST',
						contentType: 'application/json',
						data: JSON.stringify({
							password: $("input[name=npassword]").val(),
						}),
						success: function (result) {
							if (result.status) {
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
									window.location.href = "/";
								});
							}
							else {
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
			_showForm();
			_handleResetPasswordForm();

			_loader.hide();
		}
	};
}();

// Class Initialization
jQuery(document).ready(async function () {
	KTLogin.init();
});
