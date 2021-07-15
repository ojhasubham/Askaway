"use strict";

// Class definition
var UpdateStudentProfile = function () {
	// Elements
	var avatar;
	var offcanvas;
	let phone;
	let redirectTo = null;
	let profilePicFlag = null;

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

	function countryChangeHandler() {
		var selectedCountry = $("select[name=country]").val();
		phone.setNumber('');
		if (selectedCountry) {
			phone.setCountry(selectedCountry);
		}
	}

	function uploadProfilePicHandler(formData) {
		return $.ajax('/api/profile-pic', {
			method: 'POST',
			contentType: false,
			processData: false,
			headers: getRequestHeaders(),
			data: formData,
			success: function (result) {
				$("#kt_profile_avatar").removeClass("image-input-changed");
				$("#kt_profile_avatar").removeClass("image-input-empty");
				return result.status;
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
					return false;
				});
				return false;
			}
		});
	}

	async function setProfilePic() {
		_loader.show();
		switch (profilePicFlag) {
			case 'cancel':
				if (!current_user.profilePic) {
					setTimeout(() => {
						$("#kt_profile_avatar").addClass("image-input-empty");
						_loader.hide();
					}, 500);
				} else {
					_loader.hide();
				}
				break;
			case 'change':
				_loader.hide();
				break;
			case 'remove':
				if (current_user.profilePic) {
					await $.ajax(`/api/profile-pic`, {
						method: 'DELETE',
						async: true,
						contentType: 'application/json',
						processData: false,
						headers: getRequestHeaders(),
						success: function (response) {
							if (response.status) {
								DashboardLayoutPage.updateUserData();
								_loader.hide();
								swal.fire({
									text: "Profile Picture removed successfully",
									icon: "success",
									buttonsStyling: false,
									confirmButtonText: "Ok, got it!",
									customClass: {
										confirmButton: "btn font-weight-bold btn-light-primary"
									}
								}).then(function () {
									KTUtil.scrollTop();
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
				} else {
					$("#kt_profile_avatar").addClass("image-input-empty");
					_loader.hide();
				}
				break;
			default:
				_loader.hide();
				break;
		}
	}

	var _initForm = async function () {
		if (sessionStorage.getItem('redirectTo')) {
			redirectTo = sessionStorage.getItem('redirectTo');
			sessionStorage.removeItem('redirectTo');
		}

		$("#country").change(function (event) {
			event.preventDefault();
			countryChangeHandler();
		});

		const phoneInput = document.querySelector("#phone");
		phone = window.intlTelInput(phoneInput, {
			allowDropdown: false,
			separateDialCode: true,
			utilsScript: "../../js/utils.js",
			formatOnDisplay: false,
		});

		$('#phone').maxlength({
			warningClass: "label label-warning label-rounded label-inline",
			limitReachedClass: "label label-success label-rounded label-inline"
		});

		const countryData = window.intlTelInputGlobals.getCountryData();

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

		$('#state').select2({
			placeholder: "Select a country"
		});


		$("#country").change(function (event) {
			event.preventDefault();
			var selectedCountry = $("#country").val();
			phone.setNumber('');
			phone.setCountry(selectedCountry);

			const selectedStates = states && states[selectedCountry] && states[selectedCountry].split('|') || null;
			$('#state').empty();
			$('#state').append(`<option value="" disabled selected>Select State</option>`);
			if (selectedStates) {
				selectedStates.forEach(item => {
					$('#state').append(`<option value="${item}">${item}</option>`);
				});
			}
		});

		if (current_user) {
			if (current_user.role !== STUDENT) {
				window.location.href = "/profile/provider/update";
			}
		} else {
			await $.ajax('/api/profile', {
				method: 'GET',
				async: true,
				contentType: 'application/json',
				processData: false,
				headers: getRequestHeaders(),
				success: function (response) {
					if (response) {
						console.log('after response');

						if (response && response.role !== STUDENT) {
							window.location.href = "/profile/provider/update";
						}
						current_user = response;
					} else {
						window.location.href = "/home";
					}
				},
			})
		}

		if (current_user) {
			console.log('current_user : ', current_user);

			$("input[name=line1]").val(current_user.line1);
			$("input[name=line2]").val(current_user.line2);
			$("input[name=city]").val(current_user.city);

			if (current_user.country) {
				$('#country').val(current_user.country);
				$('#country').trigger('change');
			}

			if (current_user.state) {
				$('#state').val(current_user.state);
			}

			countryChangeHandler();
			phone.setNumber(current_user.phone);
			if (current_user.profilePic) {
				$("#kt_profile_avatar .image-input-wrapper").css("background-image", `url('/api/file/profile-media?filename=${current_user.profilePic}')`);
			} else {
				$("#kt_profile_avatar").addClass("image-input-empty");
			}
		}

		avatar = new KTImageInput('kt_profile_avatar');
		avatar.on('cancel', function (imageInput) {
			profilePicFlag = 'cancel';
			setProfilePic();
		});

		avatar.on('change', function (imageInput) {
			profilePicFlag = 'change';
			setProfilePic();
		});

		avatar.on('remove', function (imageInput) {
			profilePicFlag = 'remove';
			setProfilePic();
		});
	}

	var _handleUpdateProfileForm = function (e) {
		var validation;
		var form = KTUtil.getById('update_student_profile_form');

		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					line1: {
						validators: {
							notEmpty: {
								message: 'Address line 1 is required'
							}
						}
					},
					city: {
						validators: {
							notEmpty: {
								message: 'City is required'
							}
						}
					},
					state: {
						validators: {
							notEmpty: {
								message: 'State is required'
							}
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
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap()
				}
			}
		);

		console.log('last');

		$('#update_student_profile_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(async function (status) {
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

					const files = $('input[name=profile_avatar]')[0].files[0];
					if (profilePicFlag === 'change' && files) {
						const formData = new FormData();
						formData.append("profile", $('input[name=profile_avatar]')[0].files[0]);
						const response = await uploadProfilePicHandler(formData);
						console.log('response : ', response);
						if (!response || (response && !response.status)) {
							_loader.hide();
							return;
						}
					}

					await $.ajax('/api/profile', {
						method: 'PUT',
						contentType: 'application/json',
						processData: false,
						headers: getRequestHeaders(),
						data: JSON.stringify({
							line1: $("input[name=line1]").val(),
							line2: $("input[name=line2]").val(),
							city: $("input[name=city]").val(),
							state: $('#state').val(),
							country: $("select[name=country]").val(),
							phone: phone.getNumber(),

						}),
						success: function (result) {
							if (result.status) {
								_loader.hide();
								DashboardLayoutPage.updateUserData();
								swal.fire({
									text: result.message,
									icon: "success",
									buttonsStyling: false,
									confirmButtonText: "Ok, got it!",
									customClass: {
										confirmButton: "btn font-weight-bold btn-light-primary"
									}
								}).then(function () {
									// if (redirectTo) {
									// 	window.location.href = redirectTo;
									// } else {
									// 	KTUtil.scrollTop();
									// }
									window.location.href = '/home';
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
			_initAside();
			await _initForm();
			_handleUpdateProfileForm();
			_loader.hide();
		}
	};
}();

jQuery(document).ready(function () {
	UpdateStudentProfile.init();
});
