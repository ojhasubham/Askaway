"use strict";

// Class definition
var KTAppChat = function () {
	var _chatAsideEl;
	var _chatAsideOffcanvasObj;
	var _chatContentEl;
	let users = null;
	let selectedThread = null;

	async function getUsersList() {
		await $.ajax('/api/messages', {
			method: 'GET',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: async response => {
				if (response.status) {
					const { data } = response;
					users = data;
					$('#users_div').empty();
					if (users && users.length) {
						if (users && users.length) {
							users.forEach(item => {
								addUser(_chatAsideEl, item);
							});

							$(".user_a").click(async event => {
								event.preventDefault();
								_loader.show();
								const id = event.target && event.target.id || null;
								if (selectedThread && selectedThread.id === id) {
									_loader.hide();
									return;
								}
								if (id) {
									await getMessages(id);
								} else {
									_loader.hide();
								}
							});

							if (selectedThread && selectedThread.id) {
								await getMessages(selectedThread.id);
							} else {
								selectedThread = users[0];
								await getMessages(selectedThread.id);
							}
						} else {
							$("#users_div").append(`No User found! click on New message button above to message new user.`);
						}
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
		});
	}

	function addUser(element, data) {
		var usersEl = KTUtil.find(element, '#users_div');
		var scrollEl = KTUtil.find(element, '.scroll');

		const userType = data.user1 === userId && 2 || 1;

		var node = document.createElement("DIV");
		KTUtil.addClass(node, 'd-flex align-items-center justify-content-between mb-5');

		var html = '';
		html += '<div class="d-flex align-items-center">';
		html += '  <div class="symbol symbol-circle symbol-50 mr-3">';
		html += '    <img alt="Pic" src="/media/users/blank.png" />';
		html += '  </div>';
		html += '  <div class="d-flex flex-column">';
		html += '	   <a href="javascript:;" id="' + data.id + '" class="text-dark-75 text-hover-primary font-weight-bold font-size-lg user_a">' + data['name' + userType] + '</a>';
		html += '  </div>';
		html += '</div>';

		KTUtil.setHTML(node, html);
		usersEl.appendChild(node);
		scrollEl.scrollTop = parseInt(KTUtil.css(usersEl, 'height'));

		var ps;
		if (ps = KTUtil.data(scrollEl).get('ps')) {
			ps.update();
		}
	}

	function addMessage(element, isCurrentUser, data) {
		var messagesEl = KTUtil.find(element, '.messages');
		var scrollEl = KTUtil.find(element, '.scroll');

		var node = document.createElement("DIV");
		var html = '';
		if (isCurrentUser) {
			KTUtil.addClass(node, 'd-flex flex-column mb-5 align-items-end');
			if (data.id) {
				KTUtil.addClass(node, data.id);
			}
			html += '<div class="d-flex align-items-center">';
			html += '	<div>';
			html += '		<span class="text-muted font-size-sm">' + moment(data.dateTime).format("MM/DD/YYYY h:mA") + '</span>';
			html += '	</div>';
			html += '</div>';
			html += '<div class="d-flex align-items-center">';
			html += '	<div class="d-flex">';
			html += '		<span class="text-muted font-size-sm">';
			if (data.id) {
				html += '		<div class="progress">';
				html += '			<div class="progress-bar"></div>';
				html += '		</div>';
			}
			if (data.filename) {
				html += '    	<a class="btn btn-sm mt-2 btn-light-primary font-weight-bolder text-uppercase" title="Click to download" target="_blank" href="/api/file/messages-media?filename=' + data.filename + '&access_token=' + token + '" download="' + data.filename + '" > ' + data.text + '</a>';
			} else {
				html += '		<pre class="pre-word-wrap mt-2 rounded p-5 bg-light-primary text-dark-50 font-weight-bold font-size-lg text-right max-w-400px">' + data.text + '</pre>';
			}
			html += '		</span>';
			html += '		<div class="d-grid">';
			html += '			<div class="symbol symbol-circle symbol-40 ml-3">';
			html += '				<img alt="Pic" src="/media/users/blank.png"/>';
			html += '			</div>';
			html += '			<a href="#" class="text-dark-75 text-hover-primary font-weight-bold font-size-h6 ml-5">You</a>';
			html += '		</div>';
			html += '	</div>';
			html += '</div>';
		} else {
			KTUtil.addClass(node, 'd-flex flex-column mb-5 align-items-start');
			var html = '';
			html += '<div class="d-flex align-items-center">';
			html += '	<div>';
			html += '		<span class="text-muted font-size-sm">' + moment(data.dateTime).format("MM/DD/YYYY h:mA") + '</span>';
			html += '	</div>';
			html += '</div>';
			html += '<div class="d-flex align-items-center">';
			html += '<div class="d-grid">';
			html += '	<div class="symbol symbol-circle symbol-40 mr-3">';
			html += '		<img alt="Pic" src="/media/users/blank.png"/>';
			html += '	</div>';
			html += '   <a href="#" class="text-dark-75 text-hover-primary font-weight-bold font-size-h6">' + selectedThread && selectedThread.user1 === userId && selectedThread.name2 || selectedThread.name1 + '</a>';
			html += '</div>';

			html += '<div class="d-flex">';
			html += '	<span class="text-muted font-size-sm">';
			if (data.filename) {
				html += '    <a class="btn btn-sm mt-2 btn-light-primary font-weight-bolder text-uppercase" title="Click to download" target="_blank" href="/api/file/messages-media?filename=' + data.filename + '&access_token=' + token + '" download="' + data.filename + '" > ' + data.text + '</a>';
			} else {
				html += '	<pre class="pre-word-wrap mt-2 rounded p-5 bg-light-success text-dark-50 font-weight-bold font-size-lg text-left max-w-400px">' + data.text + '</pre>';
			}
			html += '	</span>';
			html += '</div>';
			html += '</div>';

		}

		KTUtil.setHTML(node, html);
		messagesEl.appendChild(node);
		scrollEl.scrollTop = parseInt(KTUtil.css(messagesEl, 'height'));

		var ps;
		if (ps = KTUtil.data(scrollEl).get('ps')) {
			ps.update();
		}
	}

	async function getMessages(messageId) {
		_loader.show();
		await $.ajax(`/api/messages/${messageId}`, {
			method: 'GET',
			async: true,
			contentType: 'application/json',
			processData: false,
			headers: getRequestHeaders(),
			success: function (response) {
				if (response.status) {
					const { data } = response;
					if (data) {
						$('#attachment').val('');
						selectedThread = data;
						if ($('#users_div a.text-primary').length) {
							$('#users_div a.text-primary').addClass('text-dark-75');
							$('#users_div a.text-primary').removeClass('text-primary');
						}
						$('#users_div a[id=' + selectedThread.id + ']').addClass('text-primary');
						$('#users_div a[id=' + selectedThread.id + ']').removeClass('text-dark-75');
						$('.selected_thread_name').text(selectedThread.user1 === userId && selectedThread.name2 || selectedThread.name1);
						const { messages, id } = selectedThread;
						$('.messages').empty();
						if (messages && messages.length) {
							const currentUserType = data.user1 === userId && 'user1' || 'user2';
							for (let i = 0; i < messages.length; i++) {
								const item = messages[i];
								addMessage(_chatContentEl, currentUserType === item.type, item);
							}
						}
					}
				}
				_loader.hide();
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

	// Private functions
	var _initAside = async function () {
		// Mobile offcanvas for mobile mode
		_chatAsideOffcanvasObj = new KTOffcanvas(_chatAsideEl, {
			overlay: true,
			baseClass: 'offcanvas-mobile',
			//closeBy: 'kt_chat_aside_close',
			toggleBy: 'kt_app_chat_toggle'
		});

		// User listing
		var cardScrollEl = KTUtil.find(_chatAsideEl, '.scroll');
		var cardBodyEl = KTUtil.find(_chatAsideEl, '.card-body');
		var searchEl = KTUtil.find(_chatAsideEl, '.input-group');

		await getUsersList();

		if (cardScrollEl) {
			// Initialize perfect scrollbar(see:  https://github.com/utatti/perfect-scrollbar)
			KTUtil.scrollInit(cardScrollEl, {
				mobileNativeScroll: true,  // Enable native scroll for mobile
				desktopNativeScroll: false, // Disable native scroll and use custom scroll for desktop
				resetHeightOnDestroy: true,  // Reset css height on scroll feature destroyed
				handleWindowResize: true, // Recalculate hight on window resize
				rememberPosition: true, // Remember scroll position in cookie
				height: function () {  // Calculate height
					var height;

					if (KTUtil.isBreakpointUp('lg')) {
						height = KTLayoutContent.getHeight();
					} else {
						height = KTUtil.getViewPort().height;
					}

					if (_chatAsideEl) {
						height = height - parseInt(KTUtil.css(_chatAsideEl, 'margin-top')) - parseInt(KTUtil.css(_chatAsideEl, 'margin-bottom'));
						height = height - parseInt(KTUtil.css(_chatAsideEl, 'padding-top')) - parseInt(KTUtil.css(_chatAsideEl, 'padding-bottom'));
					}

					if (cardScrollEl) {
						height = height - parseInt(KTUtil.css(cardScrollEl, 'margin-top')) - parseInt(KTUtil.css(cardScrollEl, 'margin-bottom'));
					}

					if (cardBodyEl) {
						height = height - parseInt(KTUtil.css(cardBodyEl, 'padding-top')) - parseInt(KTUtil.css(cardBodyEl, 'padding-bottom'));
					}

					if (searchEl) {
						height = height - parseInt(KTUtil.css(searchEl, 'height'));
						height = height - parseInt(KTUtil.css(searchEl, 'margin-top')) - parseInt(KTUtil.css(searchEl, 'margin-bottom'));
					}

					// Remove additional space
					height = height - 2;

					return height;
				}
			});
		}
	}

	var _handeMessaging = async function (element, msg = false) {
		var textarea = KTUtil.find(element, 'textarea');
		let messageText = textarea.value.trim();
		let body = {
			text: messageText
		}
		if(msg) {
			body.text = msg.text;
			body.fileName = msg.fileName;
		}

		if (body.text.length === 0) {
			return;
		}
		if (selectedThread && selectedThread.id) {
			_loader.show();
			await $.ajax(`/api/messages/${selectedThread.id}`, {
				method: 'POST',
				async: true,
				contentType: 'application/json',
				processData: false,
				headers: getRequestHeaders(),
				data: JSON.stringify(body),
				success: async function (response) {
					if (response.status) {
						textarea.value = '';
						addMessage(element, true, { dateTime: Date.now(), text: body.text, filename: body.fileName });
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
			return;
		}
	}

	var _initMessages = function (element) {
		KTUtil.on(element, '.card-footer .chat-send', 'click', async function (e) {
			e.preventDefault();
			_loader.show();
			await _handeMessaging(element);
			_loader.hide();
		});
	}

	var _uploadFiles = function (files) {
		let isValid = true;
		const fd = new FormData();
		for(let file of files){
			if(file !== 'undefined') {
				fd.append('attcahment', file);
			}
		}

		$('.progress').show();
		$.ajax(`/api/messages/upload`, {
			xhr: function () {
				var xhr = new window.XMLHttpRequest();
				xhr.upload.addEventListener("progress", function (evt) {
					if (evt.lengthComputable) {
						var percentComplete = ((evt.loaded / evt.total) * 100);
						$(".progress-bar").width(percentComplete + '%');
						$(".progress-bar").html(percentComplete + '%');
					}
				}, false);
				return xhr;
			},
			method: 'POST',
			async: true,
			processData: false,
			contentType: false,
			mimeType: "multipart/form-data",
			processData: false,
			headers: getRequestHeaders(),
			data: fd,
			success: function (response) {
				if (response && JSON.parse(response)) {
					let responseObj = JSON.parse(response)
					$('.progress').hide();
					if (responseObj.status) {
						const { message, data } = responseObj;
						if (message) {
							for (const file of data) {
								const fileName = file.fd.split('message_media')[1];
								_removemessage(file.filename.split('.')[0])
								_handeMessaging(_chatContentEl, { fileName: fileName.replace(/[\/\\]/g, ''), text: file.filename });
							}
							swal.fire({
								text: message,
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
				}
				_loader.hide();
			},
			beforeSend: function () {
				$('.progress').show();
				$(".progress-bar").width('0%');
			},
			error: function (error) {
				_loader.hide();
				$('.progress').hide();
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

	var _handlefileUpload = function (element) {
		$('#attachment').change(function () {
			for (let file of $('#attachment')[0].files) {
				if (file !== 'undefined') {
					var maxSize = parseInt($(this).attr('data-max-size'), 10),
						size = file.size;
					let isValid = maxSize > size;
					if (!isValid) {
						swal.fire({
							text: 'Please select file below 50MB',
							icon: "error",
							buttonsStyling: false,
							confirmButtonText: "Ok, got it!",
							customClass: {
								confirmButton: "btn font-weight-bold btn-light-primary"
							}
						}).then(function () {
							KTUtil.scrollTop();
						});
						return null;
					}
					addMessage(_chatContentEl, true, { dateTime: Date.now(), text: file.name, id: file.name.split('.')[0] });
				}
			}
			_uploadFiles($('#attachment')[0].files)
		});
	}

	var _removemessage = function (id) {
		$('.' + id).attr('style', 'display:none !important');
	}

	return {
		// Public functions
		init: async function () {
			$('.progress').hide();
			// Elements
			_chatAsideEl = KTUtil.getById('kt_chat_aside');
			_chatContentEl = KTUtil.getById('kt_chat_content');

			// Init aside and user list
			await _initAside();

			// Init inline chat example
			KTLayoutChat.setup(_chatContentEl);

			// Init messages
			_initMessages(_chatContentEl);

			// Trigger click to show popup modal chat on page load
			if (KTUtil.getById('kt_app_chat_toggle')) {
				setTimeout(function () {
					KTUtil.getById('kt_app_chat_toggle').click();
				}, 1000);
			}

			// file upload
			_handlefileUpload();

			_loader.hide();


		}
	};
}();

jQuery(document).ready(function () {
	KTAppChat.init();
});
