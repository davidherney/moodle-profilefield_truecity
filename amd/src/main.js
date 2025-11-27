// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Main code to support true city profile field.
 *
 * @module     profilefield_truecity/main
 * @copyright  2025 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import $ from 'jquery';
import Modal from 'core/modal_save_cancel';
import ModalEvents from 'core/modal_events';
import Notification from 'core/notification';
import Log from 'core/log';
import {get_strings as getStrings} from 'core/str';

/**
 * @type {jQuery|HTMLElement} Base container for the true city selector
 */
var $cotainerbase;

/**
 * @type {jQuery|HTMLElement} Country select list element
 */
var $countrylist;

/**
 * @type {jQuery|HTMLElement} Region select list element
 */
var $regionlist;

/**
 * @type {jQuery|HTMLElement} City select list element
 */
var $citylist;

/**
 * @type {jQuery|HTMLElement} Modal body container
 */
var $modalbody;

/**
 * @type {any} Currently selected location data
 */
var currentSelected = null;

/**
 * @type {string} Base URL for AJAX requests in order to fetch location data: countries, regions, and cities.
 */
var baseurl;

/**
 * Strings to load from server.
 *
 * @type {Array}
 */
var strings = [
    {key: 'failedtoloadcountrydata', component: 'profilefield_truecity'},
    {key: 'failedtoloadregiondata', component: 'profilefield_truecity'},
    {key: 'invalidregionsdataformat', component: 'profilefield_truecity'},
    {key: 'locationtext', component: 'profilefield_truecity', param: {city: '[CITY]', country: '[COUNTRY]'}},
    {key: 'notset', component: 'profilefield_truecity'},
    {key: 'selectacity', component: 'profilefield_truecity'},
    {key: 'selectaregion', component: 'profilefield_truecity'},
    {key: 'selectlocationtitle', component: 'profilefield_truecity'},
    {key: 'unknownregion', component: 'profilefield_truecity'},
];

/**
 * Loaded strings.
 *
 * @type {Array}
 */
var s = [];

/**
 * Load strings from server.
 */
async function loadStrings() {
    strings.forEach(one => {
        s[one.key] = one.key;
    });

    await getStrings(strings).then(function(results) {
        var pos = 0;
        strings.forEach(one => {
            console.log('Loaded string: ' + one.key + ' = ' + results[pos]);
            s[one.key] = results[pos];
            pos++;
        });
        return true;
    }).fail(function(e) {
        Log.debug('Error loading strings');
        Log.debug(e);
    });
}
// End of Load strings.

/**
 * Initialize module
 *
 * @param {string} uniqid Unique identifier for the field instance.
 * @param {string} url Base URL for AJAX requests in order to fetch location data: countries, regions, and cities.
 */
export const init = async(uniqid, url) => {
    baseurl = url;

    await loadStrings();

    const selectorid = `#truecity-selector-${uniqid}`;
    $cotainerbase = $(`${selectorid}`);
    $countrylist = $(`${selectorid} select[name="profilefield_truecity_country"]`);
    $regionlist = $(`${selectorid} select[name="profilefield_truecity_region"]`);
    $citylist = $(`${selectorid} select[name="profilefield_truecity_city"]`);

    // Load current selected value from hidden input.
    const $hiddenInput = $('input[data-targetvalue="' + uniqid + '"]');
    const currentValue = $hiddenInput.val();
    if (currentValue) {
        try {
            currentSelected = JSON.parse(currentValue);
        } catch (e) {
            Log.debug('profilefield_truecity', 'Error parsing current location JSON: ' + e);
        }
    }

    $modalbody = $cotainerbase.find('.modal-body');

    var selectorModal;

    console.log('Creating modal for truecity selector');
    // Create and show modal with the selector content
    Modal.create({
        title: s.selectlocationtitle,
        body: `<div id="${selectorid.substring(1)}-modal" class="truecity-selector-modal"></div>`,
    }).then(function(modal) {
        selectorModal = modal;

        // Add event listener for save button
        modal.getRoot().on(ModalEvents.save, function() {
            // Get selected values
            const selectedCountry = $countrylist.val();
            const selectedRegion = $regionlist.val();
            const selectedCity = $citylist.val();

            // Validate that all required values are selected.
            if (!selectedCountry || !selectedRegion || !selectedCity) {
                arguments[0].preventDefault();
                $modalbody.find('.alert').remove();
                $modalbody.prepend('<div class="alert alert-danger" role="alert">' + s.selectacity + '</div>');
                return;
            }

            const countryName = $countrylist.find('option:selected').text();
            const regionName = $regionlist.find('option:selected').text();
            const cityName = $citylist.find('option:selected').text();

            // Create JSON object with values and names
            const locationData = {
                country: {
                    value: selectedCountry,
                    name: countryName
                },
                region: {
                    value: selectedRegion,
                    name: regionName
                },
                city: {
                    value: selectedCity,
                    name: cityName
                }
            };

            // Update location text display
            const locationText = s.locationtext
                .replace('[COUNTRY]', countryName)
                .replace('[CITY]', cityName);

            $cotainerbase.find('.truecity-information [data-locationtext]').text(locationText);

            // Store JSON string in hidden input
            $hiddenInput.val(JSON.stringify(locationData));

            // Close modal after save
            modal.hide();
        });

        return modal;
    }).catch(Notification.exception);

    $cotainerbase.find('.truecity-information [data-act="openselector"]').on('click', function() {
        selectorModal.show();
        $(`${selectorid}-modal`).append($modalbody);
        $modalbody.removeClass('hidden');
    });

    // Get the currently selected country.
    const selectedCountry = $countrylist.val();
    $countrylist.on('change', function() {
        const countryCode = $(this).val();
        $modalbody.find('.alert').remove();

        // Deselect and clear region and city selects
        deselectAutocompleteItems($regionlist);
        deselectAutocompleteItems($citylist);
        clearSelect($regionlist);
        clearSelect($citylist);

        if (countryCode && countryCode != '') {
            loadCountryRegions(countryCode);
        }
    });

    // If a country is selected, fetch its JSON data.
    if (selectedCountry) {
        // Clear currentSelected if country not matches.
        if (currentSelected && currentSelected.country && currentSelected.country.value !== selectedCountry) {
            currentSelected = null;
        }

        loadCountryRegions(selectedCountry);
    }
};

/**
 * Load regions for a given country.
 *
 * @param {string} countryCode The selected country code.
 */
function loadCountryRegions(countryCode) {
    const countryuri = `${baseurl}/countries`;
    const countryJsonUrl = `${countryuri}/${countryCode}.json`;

    $.ajax({
        url: countryJsonUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (Array.isArray(data)) {
                // Handle the country data.
                populateRegions(data);
            } else {
                Log.debug('profilefield_truecity', 'Invalid regions data format');
                Notification.exception(new Error(s.invalidregionsdataformat));
            }
        },
        error: function(xhr, status, error) {
            Log.debug('profilefield_truecity', 'Error fetching country data: ' + error);
            Notification.exception(new Error(s.failedtoloadcountrydata));
        }
    });
}

/**
 * Populate the regions dropdown based on the selected country.
 *
 * @param {Array} regions Array of region objects.
 */
function populateRegions(regions) {
    // Deselect all options first
    $regionlist.find('option').prop('selected', false);

    // Clear and repopulate the select
    $regionlist.empty();
    $regionlist.append('<option value=""></option>');

    regions = regions.sort((a, b) => a.n.localeCompare(b.n));
    regions.forEach(region => {
        let name = region.n;
        if (!name || name.trim() === '' || name == 'UNKNOWN') {
            name = s.unknownregion;
        }
        $regionlist.append(`<option value="${region.i}">${name}</option>`);
    });

    if (currentSelected && currentSelected.region) {
        // Preselect the region if available.
        $regionlist.val(currentSelected.region.value);
        currentSelected.region = null;
    } else {
        // Set to empty value explicitly.
        $regionlist.val('');
    }

    // Trigger change event to update autocomplete UI.
    $regionlist.trigger('change');

    // Get the currently selected region.
    const selectedRegion = $regionlist.val();

    // Add event listener for region change (only once).
    $regionlist.off('change.truecity').on('change.truecity', function() {
        const regionCode = $(this).val();
        const countryCode = $countrylist.val();
        $modalbody.find('.alert').remove();

        deselectAutocompleteItems($citylist);
        clearSelect($citylist);

        if (regionCode && regionCode != '' && countryCode) {
            loadRegionCities(countryCode, regionCode);
        }
    });

    // If a region is already selected, load its cities.
    if (selectedRegion && selectedRegion != '') {
        const countryCode = $countrylist.val();
        loadRegionCities(countryCode, selectedRegion);
    }
}

/**
 * Load cities for a given country and region.
 *
 * @param {string} countryCode The selected country code.
 * @param {string} regionCode The selected region code.
 */
function loadRegionCities(countryCode, regionCode) {
    const regionuri = `${baseurl}/regions`;
    const regionJsonUrl = `${regionuri}/${countryCode}_${regionCode}.json`;

    $.ajax({
        url: regionJsonUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (Array.isArray(data)) {
                // Handle the country data.
                populateCities(data);
            } else {
                Log.debug('profilefield_truecity', 'Invalid cities data format');
                Notification.exception(new Error(s.invalidregionsdataformat));
            }
        },
        error: function(xhr, status, error) {
            Log.debug('profilefield_truecity', 'Error fetching region data: ' + error);
            Notification.exception(new Error(s.failedtoloadregiondata));
        }
    });
}

/**
 * Populate the cities dropdown based on the selected region.
 *
 * @param {Array} cities Array of city objects.
 */
function populateCities(cities) {
    // Deselect all options first
    $citylist.find('option').prop('selected', false);

    $citylist.empty();
    $citylist.append('<option value=""></option>');

    cities = cities.sort((a, b) => a.n.localeCompare(b.n));
    cities.forEach(city => {
        $citylist.append(`<option value="${city.i}">${city.n}</option>`);
    });

    if (currentSelected && currentSelected.city) {
        // Preselect the city if available.
        $citylist.val(currentSelected.city.value);
        currentSelected.city = null;
    } else {
        // Set to empty value explicitly.
        $citylist.val('');
    }

    // Add event listener for city change (only once).
    $citylist.off('change.truecity').on('change.truecity', function() {
        $modalbody.find('.alert').remove();
    });

    // Trigger change event to update autocomplete UI
    $citylist.trigger('change');
}

/**
 * Clear a select element and reset it to empty state.
 * Works with autocomplete-enhanced selects.
 *
 * @param {jQuery} $select The select element to clear.
 */
function clearSelect($select) {
    // First, deselect all options before removing them
    $select.find('option').prop('selected', false);

    // Now empty and add blank option
    $select.empty();
    $select.append('<option value=""></option>');
    $select.val('');

    // Trigger change to update autocomplete UI
    $select.trigger('change');
}

/**
 * Deselect all items in an autocomplete-enhanced select by clicking on the badges.
 * This properly triggers the autocomplete's deselection logic.
 *
 * @param {jQuery} $select The select element to deselect items from.
 */
function deselectAutocompleteItems($select) {
    // The autocomplete elements are added to the same container as the original select.
    const $parent = $select.parent();

    // Find the selection container (where the badges are shown).
    // Class .form-autocomplete-selection is standard for Moodle autocomplete.
    const $selectionContainer = $parent.find('.form-autocomplete-selection');

    if (!$selectionContainer.length) {
        return;
    }

    // Find all selected items (badges).
    const $selectionItems = $selectionContainer.find('[role="option"]');

    // Click on each badge to trigger the deselection logic of the autocomplete component.
    $selectionItems.each(function() {
        $(this).trigger('click');
    });

    // Clear any remaining active value state on the container.
    $selectionContainer.attr('data-active-value', '');
}
