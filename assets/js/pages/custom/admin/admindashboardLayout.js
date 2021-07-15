"use strict";

const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');

const states = {
	us: "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming",
	in: "Andaman and Nicobar Islands|Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chandigarh|Chhattisgarh|Dadra and Nagar Haveli|Daman and Diu|Delhi|Goa|Gujarat|Haryana|Himachal Pradesh|Jammu and Kashmir|Jharkhand|Karnataka|Kerala|Lakshadweep|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Orissa|Pondicherry|Punjab|Rajasthan|Sikkim|Tamil Nadu|Tripura|Uttar Pradesh|Uttaranchal|West Bengal"
}

let isDashboardLoaded = false;
let isPageLoaded = false;

const getRequestHeaders = () => {
	return { 'Authorization': token }
}

if (!(token && token === 'AsdbhcyTre$459*ujio')) {
	window.location.href = "/admin/auth/login";
}

let current_user = null;

// Class Definition
var AdminDashboardLayoutPage = function () {
	var _getCurrentUserData = async function (refresh_flag) {
		if (current_user && !refresh_flag) {
			return;
		}
		current_user = {
			first_name: 'Admin',
			last_name: 'Admin',
			email: 'Admin',
		}
		return;
	}

	var _setCurrentUserData = function (e) {
		if (current_user) {
			$('.current-user-name').text(current_user.first_name + ' ' + current_user.last_name);
			$('.current-user-name-1').text(current_user.first_name ? current_user.first_name.charAt(0).toUpperCase() : current_user.last_name ? current_user.last_name.charAt(0).toUpperCase() : '');
			$('.current-user-email').text(current_user.email);
			if (current_user.phone) $('.current-user-phone').text(current_user.phone);
			if (current_user.state && current_user.country) $('.current-user-location').text(current_user.state + ', ' + current_user.country);
			if (current_user.role === PROVIDER) {
				$('.for-student').hide();
				$('.for-provider').show();
				$('.current-user-role').text('Provider');
			} else if (current_user.role === STUDENT) {
				$('.for-provider').hide();
				$('.for-student').show();
				$('.current-user-role').text('User');
			}
			if (current_user.profilePic) {
				$(".current-user-profile-pic-div").css("background-image", `url('/api/file/profile-media?filename=${current_user.profilePic}')`);
			} else {
				$(".current-user-profile-pic-div").css("background-image", `url('/media/users/blank.png')`);
			}

		}
	}

	var _handleSignOutBtn = function (e) {
		$(".Sign-out-btn").click(function (e) {
			e.preventDefault()
			localStorage.clear();
			window.location = '/';
		});
	}

	// Public Functions
	return {
		// public functions
		updateUserData: async function () {
			await _getCurrentUserData(true);
			_setCurrentUserData();
		},
		init: async function () {
			await _getCurrentUserData(false);
			_setCurrentUserData();
			_handleSignOutBtn();

			isDashboardLoaded = true;
			if (isPageLoaded) {
				_loader.hide();
			}
		}
	};
}();

// Class Initialization
jQuery(document).ready(async function () {
	AdminDashboardLayoutPage.init();
});
