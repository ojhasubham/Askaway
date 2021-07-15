"use strict";

let providersList = null;

// Class definition
var SearchProviderSection = function () {
  // Private functions
  var _getProvidersList = async function (e) {
    if (providersList) {
      return;
    }
    await $.ajax('/api/provider-list', {
      method: 'GET',
      async: true,
      contentType: 'application/json',
      processData: false,
      headers: getRequestHeaders(),
      success: function (response) {
        if (response && response.status) {
          const { data: providersData } = response;
          if (providersData && providersData.length) {
            providersList = providersData;
          }
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
  }

  var _setProvidersList = function () {
    var substringMatcher = function (strs) {
      return function findMatches(q, cb) {
        let matches, substrRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, function (i, str) {
          if (substrRegex.test(str.full_name) || substrRegex.test(str.email) || substrRegex.test(str.cat) || substrRegex.test(str.subCat) || substrRegex.test(str.keywords)) {
            let text = '';
            text += str.full_name;
            if (str.cat) text += ' ' + SEARCH_SEPARATOR_CHARACTER + ' ' + str.cat;
            if (str.keywords) text += ' ' + SEARCH_SEPARATOR_CHARACTER + ' ' + str.keywords;
            matches.push(text);
          }
        });

        cb(matches);
      };
    };

    $('#search_provider')
      .typeahead({
        hint: true,
        highlight: true,
        minLength: 1,
        classNames: {
          menu: 'tt-menu w-100',
        }
      }, {
        name: 'provider',
        source: substringMatcher(providersList || [])
      })
      .on('typeahead:selected', (e) => {
        $("#search_provider_form").submit();
      });
      if($('#search_provider_guest')) {
        $('#search_provider_guest')
        .typeahead({
          hint: true,
          highlight: true,
          minLength: 1,
          classNames: {
            menu: 'tt-menu w-100',
          }
        }, {
          name: 'provider',
          source: substringMatcher(providersList || [])
        })
        .on('typeahead:selected', (e) => {
          $("#search_provider_form_guest").submit();
        });
      }
  }

  return {
    // public functions
    init: async function () {
      await _getProvidersList();
      _setProvidersList();
    }
  };
}();

jQuery(document).ready(function () {
  SearchProviderSection.init();
});
