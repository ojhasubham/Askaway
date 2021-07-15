'use strict';

// Class Definition
var UserPage = (function () {
	let users = [];

	var _getUserTable = async function (e) {
		_loader.show();
		await $.ajax('/api/admin/users', {
			method: 'GET',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: function (response) {
				_loader.hide();
				if (response && response.status) {
					const { data: usersData } = response;
					if (usersData.length) {
						users = [];
						usersData.map((user) => {
							let newUser = [];
							newUser.push(user.id);
							newUser.push(user.first_name);
							newUser.push(user.last_name);
							newUser.push(user.email);
							newUser.push(user.country);
							newUser.push(_getStatus(user.status));
							newUser.push(moment(user.createdAt).format('L'));
							newUser.push(_getActions(user));
							users.push(newUser);
						});
					}
				} else {
					_loader.hide();
					swal.fire({
						text: response.message,
						icon: 'error',
						buttonsStyling: false,
						confirmButtonText: 'Ok, got it!',
						customClass: {
							confirmButton: 'btn font-weight-bold btn-light-primary',
						},
					}).then(function () {
						KTUtil.scrollTop();
					});
				}
			},
			error: function (error) {
				_loader.hide();
				swal.fire({
					text: error.responseText,
					icon: 'error',
					buttonsStyling: false,
					confirmButtonText: 'Ok, got it!',
					customClass: {
						confirmButton: 'btn font-weight-bold btn-light-primary',
					},
				}).then(function () {
					KTUtil.scrollTop();
				});
			},
		});
	};

	const _getActions = function (data) {
		let html = '';
		if (data.status === STATUS_PENDING) {
			html +=
				"<button class='btn btn-icon btn-light btn-hover-primary btn-sm mx-3 w-50 resend' data-id=" +
				data.id +
				'>Resend</button>';
		} else if (data.status === STATUS_DEACTIVE) {
			html +=
				"<button class='btn btn-icon btn-light btn-hover-primary btn-sm mx-3 w-50 activeUser' data-id=" +
				data.id +
				'>Active</button>';
		} else {
			html +=
				"<button class='btn btn-icon btn-light btn-hover-primary btn-sm mx-3 w-50 deactiveUser' data-id=" +
				data.id +
				'>Deactive</button>';
		}
		return html;
	};

	const changeUserStatus = async function (id, status) {
		_loader.show();
		await $.ajax('/api/admin/user/changeStatus', {
			method: 'POST',
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			data: JSON.stringify({ userId: id, status: status }),
			success: async function (result) {
				_loader.hide();
				if (result.status) {
					await _getUserTable();
					_setUserTable();
					swal.fire({
						text: result.message,
						icon: 'success',
						buttonsStyling: false,
						confirmButtonText: 'Ok, got it!',
						customClass: {
							confirmButton: 'btn font-weight-bold btn-light-primary',
						},
					}).then(function () {
						KTUtil.scrollTop();
					});
				}
			},
			error: function (error) {
				_loader.hide();
				swal.fire({
					text: error.responseText,
					icon: 'error',
					buttonsStyling: false,
					confirmButtonText: 'Ok, got it!',
					customClass: {
						confirmButton: 'btn font-weight-bold btn-light-primary',
					},
				}).then(function () {
					KTUtil.scrollTop();
				});
			},
		});
	};
	const resendVerificationMail = async function (id) {
		await $.ajax('/api/admin/resend-verifymail', {
			method: 'POST',
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			data: JSON.stringify({ userId: id }),
			success: async function (result) {
				if (result.status) {
					swal.fire({
						text: result.message,
						icon: 'success',
						buttonsStyling: false,
						confirmButtonText: 'Ok, got it!',
						customClass: {
							confirmButton: 'btn font-weight-bold btn-light-primary',
						},
					}).then(function () {
						KTUtil.scrollTop();
					});
				}
			},
			error: function (error) {
				_loader.hide();
				swal.fire({
					text: error.responseText,
					icon: 'error',
					buttonsStyling: false,
					confirmButtonText: 'Ok, got it!',
					customClass: {
						confirmButton: 'btn font-weight-bold btn-light-primary',
					},
				}).then(function () {
					KTUtil.scrollTop();
				});
			},
		});
	};

	const _getStatus = function (status) {
		switch (status) {
			case STATUS_PENDING:
				return 'Pending';
			case STATUS_ACTIVE:
				return 'Active';
			case STATUS_DELETED:
				return 'Deleted';
			case STATUS_DEACTIVE:
				return 'Deactive';
			default:
				return 'Pending';
		}
	};

	const _getRole = function (role) {
		switch (role) {
			case PROVIDER:
				return 'Provider';
			case STUDENT:
				return 'Student';
			default:
				return 'Student';
		}
	};
	const _setUserTable = function () {
		// datatable draw
		if ($.fn.DataTable.isDataTable('#userTable')) {
			$('#userTable').DataTable().clear().destroy();
		}
		$.extend($.fn.dataTableExt.oStdClasses, {
			sFilterInput: 'form-control',
            sLengthSelect: 'form-control',
            sPageButton: 'btn btn-info font-weight-bolder font-size-sm mr-2'
		});
		var table = $('#userTable').DataTable({
			data: users,
			dom: 'Bfrtip',
			buttons: [
				{
					text: 'Download As Excel',
					extend: 'excelHtml5',
					autoFilter: true,
					sheetName: 'Exported data',
					className: 'btn btn-info font-weight-bolder font-size-sm',
					init: function (api, node, config) {
						$(node).removeClass('dt-button');
					},
				},
			],
			columns: [
				{ title: '_id', visible: false },
				{ title: 'First Name' },
				{ title: 'Last Name' },
				{ title: 'Email' },
				{ title: 'Country' },
				{ title: 'Status' },
				{ title: 'Date' },
				{ title: 'Action' },
			],
		});
		$('#userTable tbody .deactiveUser').on('click', function () {
			const id = $(this).attr('data-id');
			changeUserStatus(id, STATUS_DEACTIVE);
		});

		$('#userTable tbody .activeUser').on('click', function () {
			const id = $(this).attr('data-id');
			changeUserStatus(id, STATUS_ACTIVE);
		});

		$('#userTable tbody').on('click', '.resend', function () {
			const id = $(this).attr('data-id');
			resendVerificationMail(id);
		});
	};

	// Public Functions
	return {
		// public functions
		init: async function () {
			//config datepicker
			$('#datepicker').daterangepicker({
				startDate: '1-1-2000',
				endDate: '12-12-2035',
				locale: {
					format: 'M/DD',
				},
			}, function(start, end, label) {
                $('#kt_daterangepicker_2 .form-control').val( start.format('YYYY-MM-DD') + ' / ' + end.format('YYYY-MM-DD'));
            });
			$('#datepicker').on('change', function (data) {
				_setUserTable();
			});

			// config date picker search
			$.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
				try {
					const min = $("input[name='datetimes']").data('daterangepicker').startDate.format('YYYY-MM-DD');
					const max = $("input[name='datetimes']").data('daterangepicker').endDate.format('YYYY-MM-DD');
					const startDate = new Date(data[6]);
					if (min == null && max == null) {
						return true;
					}
					if (min == 'Invalid date' && max == 'Invalid date') {
						return true;
					}
					if (moment(startDate).isBetween(min, max)) {
						return true;
					}
					return false;
				} catch (error) {
					return true;
				}
			});

			await _getUserTable();
			_setUserTable();
			_loader.hide();
		},
	};
})();

// Class Initialization
jQuery(document).ready(async function () {
	UserPage.init();
});
