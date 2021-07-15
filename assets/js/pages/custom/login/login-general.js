"use strict";

// Class Definition
var KTLogin = function () {
	const phoneInput = document.querySelector("#phone");
	const phone = window.intlTelInput(phoneInput, {
		allowDropdown: false,
		separateDialCode: true,
		utilsScript: "../../js/utils.js",
		formatOnDisplay: false,
	});

	$('#phone').maxlength({
		warningClass: "label label-warning label-rounded label-inline",
		limitReachedClass: "label label-success label-rounded label-inline"
	});

	var countryData = window.intlTelInputGlobals.getCountryData();

	const highFrequencyCountries = ['in', 'us'];
	const highFrequencyCountryData = countryData.filter(i => highFrequencyCountries.includes(i.iso2))
	const restCountryData = countryData.filter(j => !highFrequencyCountries.includes(j.iso2))

	$('#country').append(`<optgroup label="Most used">`);
	highFrequencyCountryData.forEach(item => {
		$('#country').append(`<option value="${item.iso2}">${item.name}</option>`);
	});
	$('#country').append(`</optgroup>`);

	$('#country').append(`<optgroup label="Others">`);
	restCountryData.forEach(item => {
		$('#country').append(`<option value="${item.iso2}">${item.name}</option>`);
	});
	$('#country').append(`</optgroup>`);

	$('#country').select2({
		placeholder: "Select a country"
	});

	$("#country").change(function (event) {
		event.preventDefault();
		var selectedCountry = $("#country").val();
		phone.setNumber('');
		phone.setCountry(selectedCountry);
	});

	var _login;

	var _showForm = function (form) {
		var cls = 'login-' + form + '-on';
		var form = 'kt_login_' + form + '_form';

		_login.removeClass('login-forgot-on');
		_login.removeClass('login-signin-on');
		_login.removeClass('login-signup-on');

		_login.addClass(cls);

		KTUtil.animateClass(KTUtil.getById(form), 'animate__animated animate__backInUp');

		if (form === 'kt_login_signup_form') {
			phone.setCountry('in');
			phone.setNumber('');
			phone.setCountry('us');
		}
	}

	var _initPage = function () {
		if (page) {
			if (page === 'signup' || page === 'signup-provider') {
				if (page === 'signup-provider') {
					$('#kt_login_signup_title').text("Want to sign up as User?");
					$('#signup_role').text("Provider");
					$('input[name=role]').val(PROVIDER);
				} else {
					$('#kt_login_signup_title').text("Want to sign up as Provider?");
					$('#kt_login_signup_a').attr('href', "/auth/signup-provider");
				}
				_showForm('signup');
			} else if (page === 'forgot-password') {
				_showForm('forgot');
			} else {
				_showForm('signin');
			}
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
							},
							callback: {
								message: 'The value is not a valid email address',
								callback: function(input) {
									const value = input.value;
									if (value === '') {
										return true;
									}
									// I want the value has to pass both emailAddress and regexp validators
									return FormValidation.validators.emailAddress().validate({
											value: value,
										}).valid &&
										FormValidation.validators.regexp().validate({
											value: value,
											options: {
												regexp: /^[^\s@]+@[^\s@]+\.com+$/,
											},
										}).valid;
								},
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
					$.ajax('/api/login', {
						method: 'POST',
						contentType: 'application/json',
						processData: false,
						data: JSON.stringify({
							email: $("input[name=email]").val(),
							password: $("input[name=password]").val(),
						}),
						success: function (response) {
							if (response.status) {
								var token2 = `Bearer ${response.token}`;
								localStorage.setItem("token", token2);
								localStorage.setItem("userId", response.id);
								window.location = '/home'
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

		// Handle signup
		// $('#kt_login_signup').on('click', function (e) {
		// 	e.preventDefault();
		// 	window.location.href = '/auth/signup';
		// 	// _showForm('signup');
		// 	// phone.setCountry('in');
		// 	// phone.setNumber('');
		// 	// phone.setCountry('us');
		// });
	}

	var _handleSignUpForm = function (e) {
		var validation;
		var form = KTUtil.getById('kt_login_signup_form');

		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					first_name: {
						validators: {
							notEmpty: {
								message: 'First name is required'
							},
							stringLength: {
								min: 3,
								message: 'First name must be minimum 3 characters long'
							},
						}
					},
					last_name: {
						validators: {
							notEmpty: {
								message: 'Last name is required'
							},
							stringLength: {
								min: 3,
								message: 'Last name must be minimum 3 characters long'
							},
						}
					},
					country: {
						validators: {
							notEmpty: {
								message: 'Country is required'
							}
						}
					},
					phone: {
						validators: {
							notEmpty: {
								message: 'Phone is required'
							},
							stringLength: {
								min: 10,
								message: 'Phone must be minimum 10 numbers long'
							},
						}
					},
					nemail: {
						validators: {
							notEmpty: {
								message: 'Email address is required'
							},
							callback: {
								message: 'The value is not a valid email address',
								callback: function(input) {
									const value = input.value;
									if (value === '') {
										return true;
									}
									// I want the value has to pass both emailAddress and regexp validators
									return FormValidation.validators.emailAddress().validate({
											value: value,
										}).valid &&
										FormValidation.validators.regexp().validate({
											value: value,
											options: {
												regexp: /^[^\s@]+@[^\s@]+\.com+$/,
											},
										}).valid;
								},
							}
						}
					},
					npassword: {
						validators: {
							notEmpty: {
								message: 'The password is required'
							},
							stringLength: {
								min: 8,
								message: 'The password must be minimum 8 characters long'
							},
							regexp: {
								regexp: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{8,30}$/,
								message: 'The password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
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
								message: 'The password and its confirm are not the same'
							}
						}
					},
					agree: {
						validators: {
							notEmpty: {
								message: 'You must accept the terms and conditions'
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

		$('#kt_login_signup_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(function (status) {
				if (status == 'Valid') {
					if (!phone.isValidNumber()) {
						_loader.hide();
						swal.fire({
							text: "valid mobile number is required",
							icon: "error",
							buttonsStyling: false,
							confirmButtonText: "Ok, got it!",
							customClass: {
								confirmButton: "btn font-weight-bold btn-light-primary"
							}
						}).then(function () {
							KTUtil.scrollTop();
						});
						return;
					}

					$.ajax('/api/signup', {
						method: 'POST',
						contentType: 'application/json',
						processData: false,
						data: JSON.stringify({
							role: $("input[name=role]").val(),
							first_name: $("input[name=first_name]").val(),
							last_name: $("input[name=last_name]").val(),
							country: $("select[name=country]").val(),
							phone: phone.getNumber(),
							email: $("input[name=nemail]").val(),
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
									KTUtil.scrollTop();
									window.location.href = "/"
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

		// Handle cancel button
		$('#kt_login_signup_cancel').on('click', function (e) {
			e.preventDefault();

			window.location.href = '/auth/login';
			// _showForm('signin');
		});
	}

	var _handleSignUpGoogle = function (e) {
		$('#signup_with_google').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			const role = $('input[name=role]').val();
			window.location.href = '/auth/google/register/' + role;
		});
	}

	var _handleForgotForm = function (e) {
		var validation;
		const form = KTUtil.getById('kt_login_forgot_form');

		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					fp_email: {
						validators: {
							notEmpty: {
								message: 'Email address is required'
							},
							callback: {
								message: 'The value is not a valid email address',
								callback: function(input) {
									const value = input.value;
									if (value === '') {
										return true;
									}
									// I want the value has to pass both emailAddress and regexp validators
									return FormValidation.validators.emailAddress().validate({
											value: value,
										}).valid &&
										FormValidation.validators.regexp().validate({
											value: value,
											options: {
												regexp: /^[^\s@]+@[^\s@]+\.com+$/,
											},
										}).valid;
								},
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

		// Handle submit button
		$('#kt_login_forgot_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(function (status) {
				if (status == 'Valid') {
					$.ajax("/api/forgot-password", {
						method: 'POST',
						contentType: 'application/json',
						data: JSON.stringify({
							email: $("input[name=fp_email]").val()
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
									window.location.href = "/"
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

					KTUtil.scrollTop();
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

		// Handle cancel button
		$('#kt_login_forgot_cancel').on('click', function (e) {
			e.preventDefault();

			window.location.href = '/auth/login';
			// _showForm('signin');
		});
	}

	// Public Functions
	return {
		// public functions
		init: function () {
			_login = $('#kt_login');

			_initPage();
			_handleSignInForm();
			_handleSignUpForm();
			_handleSignUpGoogle();
			_handleForgotForm();

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
