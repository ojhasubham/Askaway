"use strict";

// Class Definition
var KTLogin = function () {

	var _login;

	var _showForm = function (form) {
		var cls = 'login-' + form + '-on';
		var form = 'kt_login_' + form + '_form';

		_login.removeClass('login-forgot-on');
		_login.removeClass('login-signin-on');
		_login.removeClass('login-signup-on');

		_login.addClass(cls);

		KTUtil.animateClass(KTUtil.getById(form), 'animate__animated animate__backInUp');

	}

	var _initPage = function () {
		if (page) {
				_showForm('signin');
		}

		if (errText) {
			swal.fire({
				text: errText,
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

		if (msgText) {
			swal.fire({
				text: msgText,
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
	}

	var _handleSignInForm = function () {
		var validation;
		const form = KTUtil.getById('kt_login_signin_form');
		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					email: {
						validators: {
							notEmpty: {
								message: 'Email address is required'
							}
						}
					},
					password: {
						validators: {
							notEmpty: {
								message: 'Password is required'
							}
						}
					}
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					submitButton: new FormValidation.plugins.SubmitButton(),
					//defaultSubmit: new FormValidation.plugins.DefaultSubmit(), // Uncomment this line to enable normal button submit after form validation
					bootstrap: new FormValidation.plugins.Bootstrap()
				}
			}
		);

		$('#kt_login_signin_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(function (status) {
				if (status == 'Valid') {
					$.ajax('/api/admin/login', {
						method: 'POST',
						contentType: 'application/json',
						processData: false,
						data: JSON.stringify({
							email: $("input[name=email]").val(),
							password: $("input[name=password]").val(),
						}),
						success: function (response) {
							if (response.status) {
								localStorage.setItem("token", response.token);
								window.location = '/admin/home'
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
					});
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

		// Handle forgot button
		$('#kt_login_forgot').on('click', function (e) {
			e.preventDefault();
			window.location.href = '/auth/forgot-password'
			// _showForm('forgot');
		});
	}





	// Public Functions
	return {
		// public functions
		init: function () {
			_login = $('#kt_login');

			_initPage();
			_handleSignInForm();

			_loader.hide();
		}
	};
}();

// Class Initialization
jQuery(document).ready(async function () {
	const token = localStorage.getItem("token");
	if (token) window.location = "/home";
	KTLogin.init();
});
