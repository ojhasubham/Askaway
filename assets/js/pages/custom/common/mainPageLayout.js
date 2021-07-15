"use strict";
const token = localStorage.getItem('token');

const getRequestHeaders = () => {
	return { 'Authorization': token }
}
let current_user = null;
// Class Definition
var MainPageLayoutPage = function () {
    var _getCurrentUserData = async function (refresh_flag) {
		if (current_user && !refresh_flag) {
			return;
		}
		await $.ajax('/api/profile', {
			method: 'GET',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: function (response) {
				if (response) {
					current_user = response;
				}
			},
		})

		return;
    }
    
    var _handleSignOutBtn = function (e) {
		$(".Sign-out-btn").click(function (e) {
			e.preventDefault()
			localStorage.clear();
			window.location = '/';
		});
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

			if (!current_user.line1 && current_user.role === PROVIDER) {
				let profile_redirect_url = null;
				if (current_user.role === STUDENT && window.location.pathname !== '/profile/user/update') {
					profile_redirect_url = '/profile/user/update';
				} else if (current_user.role === PROVIDER && window.location.pathname !== '/profile/provider/update') {
					profile_redirect_url = '/profile/provider/update';
				}
				if (profile_redirect_url) {
					_loader.hide();
					swal.fire({
						text: "Please complete your profile first",
						icon: "info",
						buttonsStyling: false,
						confirmButtonText: "Ok, got it!",
						customClass: {
							confirmButton: "btn font-weight-bold btn-light-primary"
						}
					}).then(function () {
						sessionStorage.setItem('redirectTo', window.location.pathname);
						window.location.href = profile_redirect_url;
					});
				}
			}
		}
	}

  // Public Functions
  return {
    // public functions
    init: async function () {
        if(token) {
            await _getCurrentUserData();
            _setCurrentUserData();
            _handleSignOutBtn()
            $('.is-token').show();
            $('.is-login').hide();
        } else {
            $('.is-token').hide();
            $('.is-logn').show();
        }
        $('.hamburger-menu').click(function () {

            if($('.hamburger-menu').hasClass('open')) {
                $('.hamburger-menu').removeClass('open')
                $('.basic-header-content-wrapper').removeClass('with-shadow')
                $('.header-menu-component-wrapper').removeClass('is-open')
            } else {
                $('.hamburger-menu').addClass('open')
                $('.basic-header-content-wrapper').addClass('with-shadow')
                $('.header-menu-component-wrapper').addClass('is-open')
            }
        })
        if(window && window.location && window.location.pathname && window.location.pathname !== "/") {
            $('.searchBox').hide();
        }
        _loader.hide();
    }
  };
}();

// Class Initialization
$(document).ready(async function () {
    MainPageLayoutPage.init();
});
