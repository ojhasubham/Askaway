"use strict";

// Class definition
var StudentMyAccount = function () {
	// Elements
	var offcanvas;
	let stripe;
	let stripeElements;
	let _cardsContentEl;
	let card;
	let stripeCustomer = null;

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

	async function getStripeCustomer() {
		_loader.show();
		await $.ajax('/api/stripe-customer', {
			method: 'GET',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: function (response) {
				if (response && response.status) {
					const { data } = response;
					if (data && data.id) {
						stripeCustomer = data;
						setCardDetails();
					}
					_loader.hide();
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
					return;
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
				return;
			}
		});
	}

	function addCard(element, data, default_source) {
		var node = document.createElement("DIV");
		KTUtil.addClass(node, 'row');

		var html = '';
		if (data) {
			html += '	<div class="col-xl-12">';
			html += '		<div class="card card-custom gutter-b card-stretch">';
			html += '			<div class="card-body d-flex flex-column justify-content-between border border-primary rounded">';
			html += '				<div class="d-flex align-items-center mb-3">';
			html += '					<div class="d-flex flex-column">';
			html += '						<span class="text-dark font-weight-bold text-hover-primary font-size-h4 mb-0">' + data.brand || 'PAYMENT CARD' + '</span>';
			if (data.id === default_source) {
				html += '						<span class="label label-lg label-light-primary label-inline font-weight-bold py-4">Default</span>';
			}
			html += '					</div>';
			html += '				</div>';
			html += '				<div class="row">';
			html += '					<div class="col-md-6">';
			html += '						<div class="d-flex justify-content-between align-items-cente my-1">';
			html += '							<span class="text-dark-75 font-weight-bolder mr-2">Card Number:</span>';
			html += '							<span class="text-muted text-hover-primary">**** **** **** ' + data.last4 || '****' + '</span>';
			html += '						</div>';
			html += '						<div class="d-flex justify-content-between align-items-center">';
			html += '							<span class="text-dark-75 font-weight-bolder mr-2">Expiration date:</span>';
			html += '							<span class="text-muted font-weight-bold">';
			html += '							  ' + (data.exp_month && data.exp_year) && data.exp_month + '/' + data.exp_year || '-';
			html += '							</span>';
			html += '						</div>';
			html += '					</div>';
			html += '					<div class="col-md-6 d-flex align-items-end justify-content-end">';
			if (!(data.id === default_source)) {
				html += '						<div>';
				html += '						  <button class="default-card-btn btn btn-sm btn-light-primary font-weight-bolder text-uppercase" value="' + data.id + '">';
				html += '						    set as Default';
				html += '						  </button>';
				html += '						  <button class="remove-card-btn btn btn-sm btn-light-danger font-weight-bolder text-uppercase" value="' + data.id + '">Remove</button>';
				html += '						</div>';
			}
			html += '					</>';
			html += '				</div>';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
		} else {
			html += '	<div class="col-xl-12">';
			html += '		<div class="card card-custom gutter-b card-stretch">';
			html += '			<div class="card-body d-flex flex-column justify-content-between border border-primary rounded">';
			html += '				<div class="d-flex align-items-center">';
			html += '					<div class="d-flex flex-column">';
			html += '						<span class="text-dark font-weight-bold text-hover-primary font-size-h4 mb-0">No cards found.</span>';
			html += '				  </div>';
			html += '				</div>';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
		}

		KTUtil.setHTML(node, html);
		element.appendChild(node);
	}

	const setCustomerCardDefault = async (cardId) => {
		if (!confirm('Are you sure? Do you want to make this card as default?')) return;
		_loader.show();
		await $.ajax('/api/stripe-customer/card/default', {
			method: 'PUT',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			data: JSON.stringify({
				cardId
			}),
			success: async response => {
				if (response.status) {
					const { data } = response;
					if (data && data.id) {
						stripeCustomer = data;
						setCardDetails();
					} else {
						await getStripeCustomer();
					}
					_loader.hide();
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
		})
	}

	const deleteCustomerCard = async (cardId) => {
		if (!confirm('Are you sure? Do you want to remove this card from your account permanently?')) return;
		_loader.show();
		$.ajax('/api/stripe-customer/card', {
			method: 'DELETE',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			data: JSON.stringify({
				cardId
			}),
			success: async response => {
				if (response.status) {
					await getStripeCustomer();
					_loader.hide();
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
				} else {
					_loader.hide();
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
			},
		})
	}

	function setCardDetails() {
		if (stripeCustomer) {
			if (stripeCustomer.sources && stripeCustomer.sources.data && stripeCustomer.sources.data.length) {
				const cards = stripeCustomer.sources.data.filter(item => item.object === 'card');
				if (cards.length) {
					const { default_source } = stripeCustomer;

					$("#cards_content").empty();
					cards.forEach(item => {
						addCard(_cardsContentEl, item, default_source);
					});

					$(".default-card-btn").click(async (event) => {
						event.preventDefault();
						if (event.target.value) {
							setCustomerCardDefault(event.target.value);
						}
					});

					$(".remove-card-btn").click(async (event) => {
						event.preventDefault();
						if (event.target.value) {
							deleteCustomerCard(event.target.value);
						}
					});

					return;
				}
			}
		}

		$("#cards_content").empty();
		addCard(_cardsContentEl);
	}

	var _initNewCardForm = async function () {
		$("#add_card_btn").click(() => {
			_loader.show();
			if (stripeCustomer && stripeCustomer.sources && stripeCustomer.sources.data && stripeCustomer.sources.data.length >= 10) {
				_loader.hide();
				swal.fire({
					text: 'You can not add more than 10 cards',
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
			card.clear();
			$("#add_card_modal").modal("toggle");
			_loader.hide();
		});

		async function checkUser() {
			if (current_user.role !== STUDENT) {
				window.location.href = "/profile/provider/my-account";
			}
			if (!current_user.line1) {
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
					sessionStorage.setItem('redirectTo', location.pathname);
					window.location.href = '/profile/user/update';
				});
				return;
			}
			if (current_user.stripeCusId) {
				await getStripeCustomer();
			} else {
				setCardDetails();
				_loader.hide();
			}
		}

		if (current_user) {
			checkUser();
		} else {
			await $.ajax('/api/profile', {
				method: 'GET',
				async: true,
				contentType: 'application/json',
				processData: false,
				headers: getRequestHeaders(),
				success: async function (response) {
					if (response) {
						current_user = response;
						if (current_user) {
							checkUser();
						}
					} else {
						window.location.href = "/home";
					}
				},
			})
		}
	}

	var _handleNewCardForm = function (e) {
		card = stripeElements.create("card");
		card.mount("#card-element");

		card.on("change", ({ error }) => {
			const displayError = document.getElementById('card-errors');
			if (error) {
				displayError.textContent = error.message;
			} else {
				displayError.textContent = '';
			}
		});

		$("#add_card_submit").click(function (event) {
			event.preventDefault();
			_loader.show();
			stripe.createToken(card).then(async (result) => {
				if (result.error) {
					// Inform the user if there was an error.
					var errorElement = document.getElementById('card-errors');
					errorElement.textContent = result.error.message;
					_loader.hide();
				} else {
					await addCardByToken(result.token.id);
				}
			});
		});

		async function addCardByToken(sourceToken) {
			_loader.show();
			if (stripeCustomer && stripeCustomer.sources && stripeCustomer.sources.data && stripeCustomer.sources.data.length >= 10) {
				_loader.hide();
				swal.fire({
					text: 'You can not add more than 10 cards',
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

			await $.ajax('/api/stripe-customer/card', {
				method: 'POST',
				async: true,
				contentType: 'application/json',
				processData: false,
				headers: getRequestHeaders(),
				data: JSON.stringify({
					sourceToken
				}),
				success: async response => {
					if (response.status) {
						$("#add_card_modal").modal("toggle");
						await getStripeCustomer();
						_loader.hide();
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
			});
		}
	}

	return {
		// public functions
		init: function () {
			stripe = Stripe(STRIPE_API_KEY);
			stripeElements = stripe.elements();
			_cardsContentEl = KTUtil.getById('cards_content');

			_initAside();
			_initNewCardForm();
			_handleNewCardForm();
		}
	};
}();

jQuery(document).ready(function () {
	StudentMyAccount.init();
});
