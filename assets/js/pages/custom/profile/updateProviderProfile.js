"use strict";

// Class definition
var UpdateProviderProfile = function () {
	// Elements
	let avatar;
	let offcanvas;
	let phone;
	let keywords;
	let catTagify;
	let subCatTagify;
	let subCatController;
	let arrows;
	let profilePicFlag = null;
	let redirectTo = null;
	let timeSlotCount = 0;
	let satTimeSlotCount = 0;
	let leavesCount = 0;
	let leaveDayMeetings = [];
	let selectedCurrency = null;
	let selectedCountryName = null;

	if (KTUtil.isRTL()) {
		arrows = {
			leftArrow: '<i class="la la-angle-right"></i>',
			rightArrow: '<i class="la la-angle-left"></i>'
		}
	} else {
		arrows = {
			leftArrow: '<i class="la la-angle-left"></i>',
			rightArrow: '<i class="la la-angle-right"></i>'
		}
	}

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

		const selectedCountry = $("select[name=country]").val();
		phone.setNumber('');
		if (selectedCountry) {
			phone.setCountry(selectedCountry);

			const _country = countries[selectedCountry.toUpperCase()];
			if (_country) {
				selectedCurrency = _country.currency.split(",")[0];
				$("#currency").text(selectedCurrency);
				selectedCountryName = _country.name;
			}
			$("#input[name=rate]").val("");

			const selectedStates = states && states[selectedCountry] && states[selectedCountry].split('|') || null;
			$('#state').empty();
			$('#state').append(`<option value="" disabled selected>Select State</option>`);
			if (selectedStates) {
				selectedStates.forEach(item => {
					$('#state').append(`<option value="${item}">${item}</option>`);
				});
			}
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

	var addTimeSlot = (targetId = '') => {
		timeSlotCount = timeSlotCount + 1;
		$("#" + targetId + "TimeSlotDiv").append(`
		<div class="row" id="${targetId + 'TimeSlotDiv' + timeSlotCount}" >
			<div class="col-md-4 col-sm-12">
				<label for="time slot">From</label>
				<div class="input-group timepicker">
					<input class="form-control form-control-lg form-control-solid timeSlotFrom" data-target=${targetId}  id='${targetId}timeSlotFrom${timeSlotCount}'
						name="${timeSlotCount}" readonly="readonly" type="text" />
				</div>
			</div>
			<div class="col-md-4 col-sm-12">
				<label for="time slot">To</label>
				<div class="input-group timepicker">
					<input class="form-control form-control-lg form-control-solid timeSlotTo" data-target=${targetId} id='${targetId}timeSlotTo${timeSlotCount}'
						name="${timeSlotCount}" readonly="readonly" type="text" />
				</div>
			</div>
			<div class="col-md-4 col-sm-12 d-flex align-items-end">
				<button type="button" class="btn btn-danger removeSlotBtn" id="${targetId}" value="${timeSlotCount}">Remove</button>
			</div>
			<div class="col-md-12">
				<hr>
			</div>
		</div>
    `);

		$(`#${targetId}timeSlotFrom${timeSlotCount}`).timepicker({
			defaultTime: '08:00 AM'
		});
		$(`#${targetId}timeSlotTo${timeSlotCount}`).timepicker({
			defaultTime: '08:00 PM'
		});

		$(".removeSlotBtn").off("click").on("click", function (event) {
			event.preventDefault();
			if ($(".timeSlotFrom").length > 1) {
				$("#" + this.id + "TimeSlotDiv" + this.value).remove();
			} else {
				swal.fire({
					text: "Minimum one Time Slot required",
					icon: "error",
					buttonsStyling: false,
					confirmButtonText: "Ok, got it!",
					customClass: {
						confirmButton: "btn font-weight-bold btn-light-primary"
					}
				});
			}
		});
	}

	const addSatTimeSlot = () => {
		satTimeSlotCount = satTimeSlotCount + 1;
		$("#satTimeSlotDiv").append(`
        <div class="row" id="satTimeSlotDiv${satTimeSlotCount}">
          <div class="col-md-4 col-sm-12">
						<label for="time slot">From</label>
						<div class="input-group timepicker">
							<input class="form-control form-control-lg form-control-solid satTimeSlotFrom" id='satTimeSlotFrom${satTimeSlotCount}'
								name="${satTimeSlotCount}" readonly="readonly" type="text" />
						</div>
          </div>
          <div class="col-md-4 col-sm-12">
						<label for="time slot">To</label>
						<div class="input-group timepicker">
							<input class="form-control form-control-lg form-control-solid satTimeSlotTo" id='satTimeSlotTo${satTimeSlotCount}'
								name="${satTimeSlotCount}" readonly="readonly" type="text" />
						</div>
          </div>
          <div class="col-md-4 col-sm-12 d-flex align-items-end">
						<button type="button" class="btn btn-danger removeSatSlotBtn" value="${satTimeSlotCount}">Remove</button>
          </div>
          <div class="col-md-12">
            <hr">
          </div>
        </div>
      `);

		$(`#satTimeSlotFrom${satTimeSlotCount}`).timepicker({
			defaultTime: '08:00 AM'
		});
		$(`#satTimeSlotTo${satTimeSlotCount}`).timepicker({
			defaultTime: '08:00 PM'
		});

		$(".removeSatSlotBtn").off("click").on("click", function (event) {
			event.preventDefault();
			$("#satTimeSlotDiv" + this.value).remove();
		});
	}

	const addLeave = () => {
		leavesCount = leavesCount + 1;
		$("#leavesDiv").append(`
			<div class="row" id="leavesDiv${leavesCount}">
				<div class="col-md-8 col-sm-12">
					<label for="leave date">Leave Date (MM/DD/YYYY)</label>
					<div class="input-group date">
						<input type="text" class="form-control form-control-lg form-control-solid leaveDate"
							id="leaveDate${leavesCount}" name="${leavesCount}" readonly="readonly"
							placeholder="Select date" />
						<div class="input-group-append">
							<span class="input-group-text">
								<i class="la la-calendar-check-o"></i>
							</span>
						</div>
					</div>
				</div>
				<div class="col-md-4 col-sm-12 d-flex align-items-end">
					<button type="button" class="btn btn-danger removeLeaveBtn"
						value="${leavesCount}">Remove</button>
				</div>
				<div class="col-md-12">
					<hr>
				</div>
			</div>
    `);

		$(`#leaveDate${leavesCount}`).daterangepicker({
			buttonClasses: ' btn',
			applyClass: 'btn-primary',
			cancelClass: 'btn-secondary'
		});

		$(".removeLeaveBtn").off("click").on("click", function (event) {
			event.preventDefault();
			$("#leavesDiv" + this.value).remove();
		});
	}

	const updateProfileHandler = async () => {
		_loader.show();
		leaveDayMeetings = [];
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

		if ($(".timeSlotFrom").length) {
			let err = null;
			$(".timeSlotFrom").each((i, el) => {
				const target = $(el).attr('data-target');
				if ($("#" + target + "timeSlotFrom" + el.name).val() && $("#" + target + "timeSlotTo" + el.name).val()) {
					const from = moment(moment().format("YYYY-MM-DD") + " " + $("#" + target + "timeSlotFrom" + el.name).val(), 'YYYY-MM-DD h:mm A');
					const to = moment(moment().format("YYYY-MM-DD") + " " + $("#" + target + "timeSlotTo" + el.name).val(), 'YYYY-MM-DD h:mm A');
					if (moment(from).isAfter(to)) {
						if (!err) err = 'Please select valid Time Slots.';
						return;
					}
					if (to.diff(from, 'minutes') < 30) {
						if (!err) err = 'Time slots must be of minimum 30 minutes.';
						return;
					}
				} else {
					if (!err) err = 'Please fill-up all Time Slots.';
					return;
				}
			})

			if (err) {
				_loader.hide();
				swal.fire({
					text: err,
					icon: "error",
					buttonsStyling: false,
					confirmButtonText: "Ok, got it!",
					customClass: {
						confirmButton: "btn font-weight-bold btn-light-primary"
					}
				});
				return;
			}
		} else {
			_loader.hide();
			swal.fire({
				text: "Time Slots required",
				icon: "error",
				buttonsStyling: false,
				confirmButtonText: "Ok, got it!",
				customClass: {
					confirmButton: "btn font-weight-bold btn-light-primary"
				}
			});
			return;
		}

		if ($(".satTimeSlotFrom").length) {
			let err = null;
			$(".satTimeSlotFrom").each((i, el) => {
				if ($("#satTimeSlotFrom" + el.name).val() && $("#satTimeSlotTo" + el.name).val()) {
					const from = moment(moment().format("YYYY-MM-DD") + " " + $("#satTimeSlotFrom" + el.name).val(), 'YYYY-MM-DD h:mm A');
					const to = moment(moment().format("YYYY-MM-DD") + " " + $("#satTimeSlotTo" + el.name).val(), 'YYYY-MM-DD h:mm A');
					if (moment(from).isAfter(to)) {
						if (!err) err = 'Please select valid sat-sun Time Slots.';
						return;
					}
					if (to.diff(from, 'minutes') < 30) {
						if (!err) err = 'Time slots must be of minimum 30 minutes.';
						return;
					}
				} else {
					if (!err) err = 'Please fill-up all Time Slots.';
					return;
				}
			})

			if (err) {
				_loader.hide();
				swal.fire({
					text: err,
					icon: "error",
					buttonsStyling: false,
					confirmButtonText: "Ok, got it!",
					customClass: {
						confirmButton: "btn font-weight-bold btn-light-primary"
					}
				});
				return;
			}
		}

		if ($(".leaveDate").length) {
			let err = null;
			$(".leaveDate").each((i, el) => {
				if (!$("#leaveDate" + el.name).val()) {
					if (!err) err = 'Please fill-up all Leave Dates.';
					return;
				}
			})

			if (err) {
				_loader.hide();
				swal.fire({
					text: err,
					icon: "error",
					buttonsStyling: false,
					confirmButtonText: "Ok, got it!",
					customClass: {
						confirmButton: "btn font-weight-bold btn-light-primary"
					}
				});
				return;
			}
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

		let newTimeSlots = [];
		$(".timeSlotFrom").each((i, el) => {
			let timeslote = []
			const target = $(el).attr('data-target');
			const index = newTimeSlots.findIndex(el => el.day === target)
			const from = $("#" + target + "timeSlotFrom" + el.name).val()
			const to = $("#" + target + "timeSlotTo" + el.name).val()
			if (index > -1) {
				newTimeSlots[index].timeSlots.push({
					from: moment(moment().format("YYYY-DD-MM") + " " + from, "YYYY-DD-MM h:m A").tz('UTC').format('k:m'),
					to: moment(moment().format("YYYY-DD-MM") + " " + to, "YYYY-DD-MM h:m A").tz('UTC').format('k:m')
				})
			} else {
				timeslote.push({
					from: moment(moment().format("YYYY-DD-MM") + " " + from, "YYYY-DD-MM h:m A").tz('UTC').format('k:m'),
					to: moment(moment().format("YYYY-DD-MM") + " " + to, "YYYY-DD-MM h:m A").tz('UTC').format('k:m')
				})
				newTimeSlots.push({
					timeSlots: timeslote,
					day: target
				})
			}
		})
		let updateTimeSlote;
		if(newTimeSlots && newTimeSlots.length > 0) {
			updateTimeSlote = moment.now();
		}
		// let newSatTimeSlots = [];
		// $(".satTimeSlotFrom").each((i, el) => {
		// 	const from = $("#satTimeSlotFrom" + el.name).val()
		// 	const to = $("#satTimeSlotTo" + el.name).val()
		// 	newSatTimeSlots.push({
		// 		from: moment(moment().format("YYYY-DD-MM") + " " + from, "YYYY-DD-MM h:m A").tz('UTC').format('k:m'),
		// 		to: moment(moment().format("YYYY-DD-MM") + " " + to, "YYYY-DD-MM h:m A").tz('UTC').format('k:m')
		// 	})
		// })

		let newLeaves = [];
		$(".leaveDate").each((i, el) => {
			const startDate = $('#leaveDate' + el.name).data('daterangepicker').startDate;
			const endDate = $('#leaveDate' + el.name).data('daterangepicker').endDate;
			const leaveDate = {
				start: startDate,
				end: endDate
			}
			newLeaves.push(leaveDate);
		})

		let newCat = catTagify.value.map(item => { return { id: item.id, name: item.value } });
		let newSubCat = subCatTagify.value.map(item => { return { id: item.id, name: item.value } });

		await $.ajax('/api/profile', {
			method: 'PUT',
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			data: JSON.stringify({
				summary: $("textarea[name=summary]").val(),
				linkedInUrl: $("input[name=linkedInUrl]").val(),
				blogUrl: $("input[name=blogUrl]").val(),
				website: $("input[name=website]").val(),
				keywords: keywords.value.map(item => item.value).join(','),
				id_number: $("input[name=id_number]").val(),
				rate: $("input[name=rate]").val(),
				dob: {
					day: moment($('input[name=dob]').val(), "YYYY/MM/DD").format('DD'),
					month: moment($('input[name=dob]').val(), "YYYY/MM/DD").format('MM'),
					year: moment($('input[name=dob]').val(), "YYYY/MM/DD").format('YYYY'),
				},
				currency: selectedCurrency,
				countryName: selectedCountryName,
				cat: newCat,
				subCat: newSubCat,
				line1: $("input[name=line1]").val(),
				line2: $("input[name=line2]").val(),
				city: $("input[name=city]").val(),
				state: $('#state').val(),
				country: $("select[name=country]").val(),
				postal_code: $("input[name=postal_code]").val(),
				phone: phone.getNumber(),
				timeSlots: newTimeSlots,
				// satTimeSlots: newSatTimeSlots,
				leaves: newLeaves,
				timeSloteUpdateAt: updateTimeSlote,
				companyName: $("input[name=companyName]").val(),
			}),
			success: function (result) {
				if (result.status) {
					DashboardLayoutPage.updateUserData();
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
						if (result.meetings) {
							leaveDayMeetings = result.meetings;
							$("#meetingsTbody").html('');
							result.meetings.forEach(item => {
								$("#meetingsTbody").append(`
                  <tr>
                    <td>${item.zoomResponse.topic}</td>
                    <td>${moment(item.zoomResponse.start_time).format('MM/DD/YYYY h:mm A')}</td>
                    <td>${item.zoomResponse.duration}</td>
                  </tr>
                `);
							});
							$("#meetingsModal").modal('toggle');
						}
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

	const deleteMeetings = async meetings => {
		if (meetings && meetings.length) {
			for (let j = 0; j < meetings.length; j++) {
				const meeting = meetings[j];
				await deleteMeeting(meeting.meetingId);
			}
		}
	}

	const deleteMeeting = meetingId => {
		return $.ajax(`/api/meeting/${meetingId}`, {
			method: 'DELETE',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: function (response) {
				if (response.status) {
					return true;
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
					return false;
				}
			}
		})
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

		$("[id='addSlotBtn']").click(function (event) {
			let targetId = $(event.currentTarget).attr('data-target')
			event.preventDefault();
			addTimeSlot(targetId);
		});

		$("#addSatSlotBtn").click(function (event) {
			event.preventDefault();
			addSatTimeSlot();
		});

		$("#addLeaveBtn").click(function (event) {
			event.preventDefault();
			addLeave();
		});

		addTimeSlot();

		$("#delete_meetings_submit").click(async event => {
			event.preventDefault();
			if (!confirm("Are you sure! Do you want to delete this meetings??")) {
				return;
			}
			_loader.show();

			await deleteMeetings(leaveDayMeetings);
			$("#meetingsModal").modal('toggle');
			await updateProfileHandler();
		});

		var keywordsInput = document.querySelector('input[name=keywords]');
		keywords = new Tagify(keywordsInput);

		let catInput = document.querySelector('input[name=cat]');
		catTagify = new Tagify(catInput, {
			enforceWhitelist: true,
			skipInvalid: true,
			dropdown: {
				closeOnSelect: false,
				enabled: 0,
				maxItems: Infinity,
				searchKeys: ['value']  // very important to set by which keys to search for suggesttions when typing
			},
			whitelist: categories.map(item => { return { id: item.id, value: item.name } }),
		});

		catTagify.on('change', catOnSelectSuggestion)

		function catOnSelectSuggestion(e) {
			let selected_cat = catTagify.value;
			subCatTagify.removeAllTags()

			if (selected_cat && selected_cat.length) {
				subCatTagify.settings.whitelist.length = 0; // reset the whitelist

				subCatController && subCatController.abort();
				subCatController = new AbortController();

				let whitelist = [];

				selected_cat.forEach(cat_item => {
					const found_cat = categories.find(item => item.id === cat_item.id);
					if (found_cat) {
						whitelist = [...whitelist, ...found_cat.subCategories.map(item => { return { id: item.id, value: item.name } })]
					}
				});

				// update inwhitelist Array in-place
				subCatTagify.settings.whitelist.splice(0, whitelist.length, ...whitelist)
			}
		}

		let subCatInput = document.querySelector('input[name=subCat]');
		subCatTagify = new Tagify(subCatInput, {
			enforceWhitelist: true,
			skipInvalid: true,
			dropdown: {
				closeOnSelect: false,
				enabled: 0,
				maxItems: Infinity,
				searchKeys: ['value']  // very important to set by which keys to search for suggesttions when typing
			},
			whitelist: [],
		});

		document.getElementById('keywords_remove').addEventListener('click', keywords.removeAllTags.bind(keywords));

		var phoneInput = document.querySelector("#phone");
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
			placeholder: "Select a state"
		});

		let summaryEL = $('#summary');
		autosize(summaryEL);

		if (current_user) {
			if (current_user.role !== PROVIDER) {
				window.location.href = "/profile/user/update";
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
						if (response && response.role !== PROVIDER) {
							window.location.href = "/profile/user/update";
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

			$("textarea[name=summary]").val(current_user.summary);
			autosize.update(summaryEL);

			$("input[name=linkedInUrl]").val(current_user.linkedInUrl);
			$("input[name=blogUrl]").val(current_user.blogUrl);
			$("input[name=companyName]").val(current_user.companyName);
			$("input[name=website]").val(current_user.website);
			keywords.addTags(current_user.keywords);
			catTagify.addTags(current_user.cat && current_user.cat.map(item => { return { id: item.id, value: item.name } }))
			subCatTagify.addTags(current_user.subCat && current_user.subCat.map(item => { return { id: item.id, value: item.name } }))

			if (current_user.country) {
				$('#country').val(current_user.country);
				$('#country').trigger('change');
			}

			$("input[name=id_number]").val(current_user.id_number);
			$("input[name=rate]").val(current_user.rate);
			if (current_user.dob) $('input[name=dob]').val(current_user.dob.year + '-' + current_user.dob.month + '-' + current_user.dob.day);
			$("input[name=line1]").val(current_user.line1);
			$("input[name=line2]").val(current_user.line2);
			$("input[name=city]").val(current_user.city);
			$("select[name=country]").val(current_user.country);
			countryChangeHandler();
			$('select[name=state]').val(current_user.state);
			$("input[name=postal_code]").val(current_user.postal_code);
			phone.setNumber(current_user.phone);

			if (current_user.profilePic) {
				$("#kt_profile_avatar .image-input-wrapper").css("background-image", `url('/api/file/profile-media?filename=${current_user.profilePic}')`);
			} else {
				$("#kt_profile_avatar").addClass("image-input-empty");
			}

			if (current_user.currency) {
				$('#currency').text(current_user.currency);
				selectedCurrency = current_user.currency;
			}
			if (current_user.countryName) {
				selectedCountryName = current_user.countryName;
			}

			if (current_user.timeSlots && current_user.timeSlots.length) {
				current_user.timeSlots.forEach((parentItem, parentIndex) => {
					parentItem.timeSlots && parentItem.timeSlots.forEach((item, index) => {
						// if ((index + 1) !== 1) {
						addTimeSlot(parentItem.day);
						// }
						const from = moment.utc(moment().format("YYYY-MM-DD") + " " + item.from, "YYYY-MM-DD H:m").local().format('h:mm A');
						const to = moment.utc(moment().format("YYYY-MM-DD") + " " + item.to, "YYYY-MM-DD H:m").local().format('h:mm A');
						$("#" + parentItem.day + "timeSlotFrom" + (index + 1)).timepicker('setTime', from);
						$("#" + parentItem.day + "timeSlotTo" + (index + 1)).timepicker('setTime', to);

					})
				})
			}

			if (current_user.satTimeSlots && current_user.satTimeSlots.length) {
				current_user.satTimeSlots.forEach((item, index) => {
					addSatTimeSlot();
					const from = moment.utc(moment().format("YYYY-MM-DD") + " " + item.from, "YYYY-MM-DD H:m").local().format('h:mm A');
					const to = moment.utc(moment().format("YYYY-MM-DD") + " " + item.to, "YYYY-MM-DD H:m").local().format('h:mm A');

					$("#satTimeSlotFrom" + (index + 1)).timepicker('setTime', from);
					$("#satTimeSlotTo" + (index + 1)).timepicker('setTime', to);
				})
			}

			if (current_user.leaves && current_user.leaves.length) {
				current_user.leaves.forEach((item, index) => {
					addLeave();
					$("#leaveDate" + (index + 1)).daterangepicker({
						startDate: moment(item.start).format('MM-DD-YYYY'),
						endDate: moment(item.end).format('MM-DD-YYYY')
					});
				})
			}

			if (current_user.state) {
				$('#state').val(current_user.state);
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
		var form = KTUtil.getById('update_provider_profile_form');

		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					summary: {
						validators: {
							notEmpty: {
								message: 'Profile summary is required'
							},
							stringLength: {
								min: 50,
								message: 'The Profile summary must be more than 50 characters'
							}
						}
					},
					linkedInUrl: {
						validators: {
							notEmpty: {
								message: 'Linked in Profile link is required',
								enabled: false
							}
						}
					},
					keywords: {
						validators: {
							notEmpty: {
								message: 'keywords for search is required'
							}
						}
					},
					id_number: {
						validators: {
							notEmpty: {
								message: 'Last 4 digits of the SSN is required'
							},
							stringLength: {
								min: 4,
								max: 4,
								message: 'SSN last digits must be 4 numbers long'
							},
						}
					},
					dob: {
						validators: {
							notEmpty: {
								message: 'Date of birth is required'
							}
						}
					},
					rate: {
						validators: {
							notEmpty: {
								message: 'Hourly Rate is required'
							}
						}
					},
					cat: {
						validators: {
							notEmpty: {
								message: 'Categories are required'
							}
						}
					},
					subCat: {
						validators: {
							notEmpty: {
								message: 'Sub categories are required'
							}
						}
					},
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
					postal_code: {
						validators: {
							notEmpty: {
								message: 'Postal code is required'
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
					companyName: {
						validators: {
							notEmpty: {
								message: 'Company Name is required'
							},
							stringLength: {
								min: 3,
								message: 'The Profile summary must be more than 3 characters'
							}
						}
					},
					blogUrl: {
						validators: {
							notEmpty: {
								message: 'Blog URL is required',
								enabled: false
							}
						}
					},
					website: {
						validators: {
							notEmpty: {
								message: 'Website is required',
								enabled: false
							}
						}
					},
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap()
				}
			}
		)
			.on('core.element.validated', function (e) {
				// remove check mark icon when value os null.

				// e.element presents the field element
				// e.valid indicates the field is valid or not
				if (e.field === 'blogUrl' || e.field === 'website') {
					const validators = validation.getFields()[e.field].validators;
					const iconPlugin = validation.getPlugin('icon');
					const iconElement = iconPlugin && iconPlugin.icons.has(e.element) ? iconPlugin.icons.get(e.element) : null;
					const value = validation.getElementValue(e.field, e.element);
					if (value === '') {
						// Now the field is empty and valid
						// Remove the success color from the container
						const container = FormValidation.utils.closest(e.element, '.has-success');
						FormValidation.utils.classSet(container, {
							'has-success': false
						});

						// Remove 'is-valid' class from the field element
						FormValidation.utils.classSet(e.element, {
							'is-valid': false
						});

						// Hide the icon
						iconElement && (iconElement.style.display = 'none');
					} else {
						iconElement && (iconElement.style.display = 'block');
					}
				}
			});

		$('#update_provider_profile_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(async function (status) {
				if (status == 'Valid') {
					updateProfileHandler();
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
	UpdateProviderProfile.init();
});
