"use strict";

// Class definition
var ProviderMyAccount = function () {
	// Elements
	var offcanvas;
	let routingText = 'Routing Number';
	let getStripeAccountTimeout = null;
	let _banksContentEl;
	let stripeAccount = null;

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

	async function getStripeAccount() {
		_loader.show();
		if (getStripeAccountTimeout) {
			clearTimeout(getStripeAccountTimeout);
			getStripeAccountTimeout = null;
		};
		await $.ajax(' /api/stripe-account', {
			method: 'GET',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: async function (response) {
				stripeAccount = response.data;
				setBankDetails();
				checkAccountStatus();
				_loader.hide();
			},
		})
	}

	function addBank(element, data) {
		var node = document.createElement("DIV");
		KTUtil.addClass(node, 'row');

		var html = '';
		if (data) {
			html += '<div class="col-xl-12">';
			html += '	<div class="card card-custom gutter-b card-stretch">';
			html += '		<div class="card-body d-flex flex-column justify-content-between border border-primary rounded">';
			html += '			<div class="d-flex align-items-center mb-3">';
			html += '				<div class="d-flex flex-column">';
			html += '					<span class="text-dark font-weight-bold text-hover-primary font-size-h4 mb-0">' + data.bank_name || 'BANK ACCOUNT' + '</span>';
			html += '					<span class="acc-status-badge label label-lg label-inline font-weight-bold py-4"></span>';
			if (data.default_for_currency) {
				html += '					<span class="label label-lg label-light-primary label-inline font-weight-bold py-4">Default</span>';
			}
			html += '				</div>';
			html += '			</div>';
			html += '			<div class="row">';
			html += '				<div class="col-md-6">';
			html += '					<div class="d-flex justify-content-between align-items-cente my-1">';
			html += '						<span class="text-dark-75 font-weight-bolder mr-2">Routing Number:</span>';
			html += '						<span class="text-muted text-hover-primary">' + data.routing_number || '-' + '</span>';
			html += '					</div>';
			html += '					<div class="d-flex justify-content-between align-items-cente my-1">';
			html += '						<span class="text-dark-75 font-weight-bolder mr-2">Account Holder Name:</span>';
			html += '						<span class="text-muted text-hover-primary">' + data.account_holder_name || 'ACCOUNT HOLDER NAME' + '</span>';
			html += '					</div>';
			html += '					<div class="d-flex justify-content-between align-items-cente my-1">';
			html += '						<span class="text-dark-75 font-weight-bolder mr-2">Account Number:</span>';
			html += '						<span class="text-muted text-hover-primary">*****' + data.last4 || '****' + '</span>';
			html += '					</div>';
			html += '				</div>';
			html += '				<div class="col-md-6 d-flex align-items-end justify-content-end">';
			html += '					<div class="text-right">';
			html += '						<button class="activate-btn mb-1 btn btn-sm btn-light-info font-weight-bolder text-uppercase d-none">Activate</button>';
			if (!data.default_for_currency) {
				html += '						<button class="default-bank-btn mb-1 btn btn-sm btn-light-primary font-weight-bolder text-uppercase"';
				html += '							value="' + data.id + '">set as Default</button>';
				html += '						<button';
				html += '							class="remove-bank-btn mb-1 btn btn-sm btn-light-danger font-weight-bolder text-uppercase"';
				html += '							value="' + data.id + '">Remove</button>';
			}
			html += '					</div>';
			html += '				</div>';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
			html += '</div>';
		} else {
			html += '	<div class="col-xl-12">';
			html += '		<div class="card card-custom gutter-b card-stretch">';
			html += '			<div class="card-body d-flex flex-column justify-content-between border border-primary rounded">';
			html += '				<div class="d-flex align-items-center">';
			html += '					<div class="d-flex flex-column">';
			html += '						<span class="text-dark font-weight-bold text-hover-primary font-size-h4 mb-0">No bank accounts found.</span>';
			html += '				  </div>';
			html += '				</div>';
			html += '			</div>';
			html += '		</div>';
			html += '	</div>';
		}

		KTUtil.setHTML(node, html);
		element.appendChild(node);
	}

	function checkAccountStatus() {
		$("#activate_acc_msg_div").addClass('d-none');
		$(".activate-btn").addClass('d-none');
		$("#activate_acc_msg").text('');
		if (stripeAccount) {
			if (stripeAccount.payouts_enabled) {
				$(".acc-status-badge").addClass('label-light-success');
				$(".acc-status-badge").text('Active');
			} else {
				const { eventually_due, pending_verification } = stripeAccount.requirements;
				if (pending_verification.length) {
					$(".acc-status-badge").addClass('label-light-info');
					$(".acc-status-badge").text('Pending');
					getStripeAccountTimeout = setTimeout(() => {
						getStripeAccount();
					}, 15000);
					return;
				}
				$(".acc-status-badge").addClass('label-light-danger');
				$(".acc-status-badge").text('Inactive');
				$(".activate-btn").removeClass('d-none');
				if (eventually_due.some(item => item === 'individual.address.line1' || item === 'individual.address.line2' || item === 'individual.address.city' || item === 'individual.address.state' || item === 'individual.address.postal_code')) {
					const msg = 'The provided Address including city, state and postal code is not seems correct. Please update the address in profile and click on activate button to activate your account. ';
					const el = '<a href="/profile/provider/update" id="update_profile" data-toggle="tooltip" title="click to update Profile">Update Profile</a>';
					$("#activate_acc_msg").html(msg + el);
					$("#activate_acc_msg_div").removeClass('d-none');
					$("#update_profile").click(() => {
						sessionStorage.setItem('redirectTo', location.pathname);
						window.location.href = '/profile/provider/update';
					});
				}
			}
		}
	}

	const updateStripeAccount = async () => {
		_loader.show();
		await $.ajax('/api/stripe-account', {
			method: 'PUT',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: async response => {
				if (response.status) {
					await getStripeAccount();
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
					if (response.profileError) {
						swal.fire({
							text: response.message + ' Please update your profile first.',
							icon: "error",
							buttonsStyling: false,
							confirmButtonText: "Ok, got it!",
							customClass: {
								confirmButton: "btn font-weight-bold btn-light-primary"
							}
						}).then(function () {
							sessionStorage.setItem('redirectTo', location.pathname);
							window.location.href = '/profile/provider/update';
						});
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
					}
				}
			},
		})
	}

	const setBankAccountDefault = async (bankAccountId) => {
		if (!confirm('Are you sure? Do you want to make this bank account as default?')) return;
		_loader.show();
		await $.ajax('/api/stripe-account/bank/default', {
			method: 'PUT',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			data: JSON.stringify({
				bankAccountId
			}),
			success: async response => {
				if (response.status) {
					await getStripeAccount();
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

	const deleteBankAccount = async (bankAccountId) => {
		if (!confirm('Are you sure? Do you want to remove this bank account from your account permanently?')) return;
		_loader.show();
		await $.ajax('/api/stripe-account/bank', {
			method: 'DELETE',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			data: JSON.stringify({
				bankAccountId
			}),
			success: async response => {
				if (response.status) {
					await getStripeAccount();
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

	function setBankDetails() {
		if (stripeAccount) {
			if (stripeAccount.external_accounts && stripeAccount.external_accounts.data && stripeAccount.external_accounts.data.length) {
				const bankAccounts = stripeAccount.external_accounts.data.filter(item => item.object === 'bank_account');

				$("#banks_content").empty();
				for (let i = 0; i < bankAccounts.length; i++) {
					const bank = bankAccounts[i];
					addBank(_banksContentEl, bank);
				}

				$(".default-bank-btn").click(async (event) => {
					event.preventDefault();
					_loader.show();
					if (event.target.value) {
						await setBankAccountDefault(event.target.value);
					} else {
						_loader.hide();
					}
				});

				$(".remove-bank-btn").click(async (event) => {
					event.preventDefault();
					_loader.show();
					if (event.target.value) {
						await deleteBankAccount(event.target.value);
					} else {
						_loader.hide();
					}
				});

				$(".activate-btn").click(async (event) => {
					event.preventDefault();
					_loader.show();
					if (current_user && current_user.stripeAccId) {
						await updateStripeAccount();
					} else {
						_loader.hide();
					}
				});

				return;
			}
		}

		$("#banks_content").empty();
		addBank(_banksContentEl);
	}

	var _initBanks = async function () {
		const setUser = async () => {
			if (current_user.role !== PROVIDER) {
				window.location.href = "/profile/user/my-account";
			}
			if (!current_user.line1) {
				_loader.hide();
				swal.fire({
					text: 'Please complete your profile first',
					icon: "info",
					buttonsStyling: false,
					confirmButtonText: "Ok, got it!",
					customClass: {
						confirmButton: "btn font-weight-bold btn-light-primary"
					}
				}).then(function () {
					sessionStorage.setItem('redirectTo', location.pathname);
					window.location.href = '/profile/provider/update';
				});
				return;
			}
			if (current_user.country === 'IN') {
				routingText = 'IFSC Number';
				$(".routingText").text(routingText)
			}
			if (current_user && current_user.stripeAccId) {
				await getStripeAccount();
			} else {
				setBankDetails();
				_loader.hide();
			}
		}

		if (current_user) {
			await setUser();
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
							await setUser();
						}
					} else {
						window.location.href = "/home";
					}
				},
			})
		}

		await $.ajax(' /api/provider-transactions', {
			method: 'GET',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: function (response) {
				if (response.status) {
					const { data } = response;
					if (data) {
						const { balance } = data;
						if (+balance) {
							const charge = +(balance * chargePer / 100).toFixed(2);
							const netBalance = +(balance - charge).toFixed(2);
							$("#account_balance").text(netBalance);
						} else {
							$("#account_balance").text(0);
						}
					}
				} else {
					_loader.hide();
					swal.fire({
						text: response.message,
						icon: "info",
						buttonsStyling: false,
						confirmButtonText: "Ok, got it!",
						customClass: {
							confirmButton: "btn font-weight-bold btn-light-primary"
						}
					}).then(function () {
						window.location.href = '/home';
					});
				}
			},
		})
	}

	var _handleNewBankAccountForm = function (e) {
		$("#add_bank_btn").click(() => {
			_loader.show();
			if (stripeAccount && stripeAccount.external_accounts && stripeAccount.external_accounts.data && stripeAccount.external_accounts.data.length >= 10) {
				_loader.hide();
				swal.fire({
					text: 'You can not add more than 10 banks',
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
			$("input[name=account_holder_name]").val('');
			$("input[name=routing_number]").val('');
			$("input[name=c_routing_number]").val('');
			$("input[name=account_number]").val('');
			$("input[name=c_account_number]").val('');
			$("#add_bank_account_modal").modal("toggle");
			_loader.hide();
		});

		var validation;
		var form = KTUtil.getById('add_bank_account_form');

		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		validation = FormValidation.formValidation(
			form,
			{
				fields: {
					account_holder_name: {
						validators: {
							notEmpty: {
								message: 'Account holder name is required'
							}
						}
					},
					routing_number: {
						validators: {
							notEmpty: {
								message: routingText + ' is required'
							}
						}
					},
					c_routing_number: {
						validators: {
							notEmpty: {
								message: 'Confirm ' + routingText + ' is required'
							},
							identical: {
								compare: function () {
									return form.querySelector('[name="routing_number"]').value;
								},
								message: 'Routing number and its confirm are not the same'
							}
						}
					},
					account_number: {
						validators: {
							notEmpty: {
								message: 'Bank account number is required'
							}
						}
					},
					c_account_number: {
						validators: {
							notEmpty: {
								message: 'Confirm bank account number is required'
							},
							identical: {
								compare: function () {
									return form.querySelector('[name="account_number"]').value;
								},
								message: 'Bank account number and its confirm are not the same'
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

		$('#add_bank_account_submit').on('click', function (e) {
			e.preventDefault();
			_loader.show();

			validation.validate().then(async function (status) {
				if (status == 'Valid') {
					if (stripeAccount && stripeAccount.external_accounts && stripeAccount.external_accounts.data && stripeAccount.external_accounts.data.length >= 10) {
						_loader.hide();
						swal.fire({
							text: 'You can not add more than 10 banks',
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

					let bankAccountToken = null;
					const data = {};
					$(".error").text("");

					await $.ajax('/api/stripe-token', {
						method: 'POST',
						contentType: 'application/json',
						processData: false,
						headers: getRequestHeaders(),
						data: JSON.stringify({
							bank_account: {
								country: current_user.country,
								currency: current_user.currency,
								account_holder_name: $('input[name=account_holder_name]').val(),
								routing_number: $('input[name=routing_number]').val(),
								account_number: $('input[name=account_number]').val(),
							}
						}),
						success: function (result) {
							if (result.status) {
								bankAccountToken = result.tokenId;
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
								if (result.param && result.err) {
									document.getElementById(result.param).innerText = result.err;
								}
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

					if (!bankAccountToken) {
						_loader.hide();
						return;
					} else {
						data.bankAccountToken = bankAccountToken;
					}

					await $.ajax('/api/stripe-account/bank', {
						method: 'POST',
						async: true,
						contentType: 'application/json',
						processData: false,
						headers: getRequestHeaders(),
						data: JSON.stringify(data),
						success: async response => {
							if (response.status) {
								$("#add_bank_account_modal").modal("toggle");
								await getStripeAccount();
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
								if (response.profileError) {
									swal.fire({
										text: response.message + ' Please update your profile first.',
										icon: "error",
										buttonsStyling: false,
										confirmButtonText: "Ok, got it!",
										customClass: {
											confirmButton: "btn font-weight-bold btn-light-primary"
										}
									}).then(function () {
										sessionStorage.setItem('redirectTo', location.pathname);
										window.location.href = '/profile/provider/update';
									});
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
								}
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
		init: async function () {
			_banksContentEl = KTUtil.getById('banks_content');

			_initAside();
			await _initBanks();
			_handleNewBankAccountForm();
		}
	};
}();

jQuery(document).ready(function () {
	ProviderMyAccount.init();
});
