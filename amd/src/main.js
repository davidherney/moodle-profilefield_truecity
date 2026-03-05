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
import TruecityAutocomplete from './autocomplete';

/**
 * @type {HTMLElement} Base container for the true city selector
 */
var containerBase;

/**
 * @type {TruecityAutocomplete} Country autocomplete instance
 */
var countryAC;

/**
 * @type {TruecityAutocomplete} Region autocomplete instance
 */
var regionAC;

/**
 * @type {TruecityAutocomplete} City autocomplete instance
 */
var cityAC;

/**
 * @type {HTMLElement} Modal body container
 */
var modalbody;

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

    const selectorid = `truecity-selector-${uniqid}`;
    containerBase = document.getElementById(selectorid);

    if (!containerBase) {
        Log.debug('profilefield_truecity: container not found: ' + selectorid);
        return;
    }

    // Initialize autocomplete controls. Countries are pre-loaded as <option> elements in the template.
    const countryContainer = containerBase.querySelector('[data-truecity-control="country"]');
    const defaultCountry = countryContainer ? countryContainer.dataset.default || '' : '';
    const regionContainer = containerBase.querySelector('[data-truecity-control="region"]');
    const cityContainer = containerBase.querySelector('[data-truecity-control="city"]');

    countryAC = new TruecityAutocomplete(countryContainer, {
        placeholder: s.selectacity,
        onChange: (value) => {
            regionAC.clear();
            cityAC.clear();
            if (value) {
                loadCountryRegions(value);
            }
        },
    });

    regionAC = new TruecityAutocomplete(regionContainer, {
        placeholder: s.selectaregion,
        onChange: (value) => {
            cityAC.clear();
            const countryCode = countryAC.getValue();
            if (value && countryCode) {
                loadRegionCities(countryCode, value);
            }
        },
    });

    cityAC = new TruecityAutocomplete(cityContainer, {
        placeholder: s.selectacity,
    });

    // Load current selected value from hidden input.
    const hiddenInput = document.querySelector('input[data-targetvalue="' + uniqid + '"]');
    const currentValue = hiddenInput ? hiddenInput.value : '';
    if (currentValue) {
        try {
            currentSelected = JSON.parse(currentValue);
        } catch (e) {
            Log.debug('profilefield_truecity: Error parsing current location JSON: ' + e);
        }
    }

    modalbody = containerBase.querySelector('.modal-body');

    var selectorModal;

    // Create and show modal with the selector content.
    Modal.create({
        title: s.selectlocationtitle,
        body: `<div id="${selectorid}-modal" class="truecity-selector-modal"></div>`,
    }).then(function(modal) {
        selectorModal = modal;

        // Add event listener for save button.
        modal.getRoot().on(ModalEvents.save, function() {
            const selectedCountry = countryAC.getValue();
            const selectedRegion = regionAC.getValue();
            const selectedCity = cityAC.getValue();

            // Validate that all required values are selected.
            if (!selectedCountry || !selectedRegion || !selectedCity) {
                arguments[0].preventDefault();
                // Remove previous alerts.
                const prevAlert = modalbody.querySelector('.alert');
                if (prevAlert) {
                    prevAlert.remove();
                }
                modalbody.insertAdjacentHTML('afterbegin',
                    '<div class="alert alert-danger" role="alert">' + s.selectacity + '</div>');
                return;
            }

            const countryName = countryAC.getLabel();
            const regionName = regionAC.getLabel();
            const cityName = cityAC.getLabel();

            // Create JSON object with values and names.
            const locationData = {
                country: {
                    value: selectedCountry,
                    name: countryName,
                },
                region: {
                    value: selectedRegion,
                    name: regionName,
                },
                city: {
                    value: selectedCity,
                    name: cityName,
                },
            };

            // Update location text display.
            const locationText = s.locationtext
                .replace('[COUNTRY]', countryName)
                .replace('[CITY]', cityName);

            const locationEl = containerBase.querySelector('.truecity-information [data-locationtext]');
            if (locationEl) {
                locationEl.textContent = locationText;
            }

            // Store JSON string in hidden input.
            if (hiddenInput) {
                hiddenInput.value = JSON.stringify(locationData);
            }

            // Close modal after save.
            modal.hide();
        });

        return modal;
    }).catch(Notification.exception);

    const openBtn = containerBase.querySelector('.truecity-information [data-act="openselector"]');
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            selectorModal.show();
            const modalTarget = document.getElementById(`${selectorid}-modal`);
            if (modalTarget && modalbody) {
                modalTarget.appendChild(modalbody);
                modalbody.classList.remove('hidden');
            }
        });
    }

    // Preselect default country and load its regions.
    if (defaultCountry) {
        // Clear currentSelected if country does not match.
        if (currentSelected && currentSelected.country && currentSelected.country.value !== defaultCountry) {
            currentSelected = null;
        }

        countryAC.setValue(defaultCountry);
        loadCountryRegions(defaultCountry);
    }
};

/**
 * Load regions for a given country.
 *
 * @param {string} countryCode The selected country code.
 */
function loadCountryRegions(countryCode) {
    const countryJsonUrl = `${baseurl}/countries/${countryCode}.json`;
    Log.debug('Loading regions from URL: ' + countryJsonUrl);

    $.ajax({
        url: countryJsonUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (Array.isArray(data)) {
                populateRegions(data);
            } else {
                Log.debug('profilefield_truecity: Invalid regions data format');
                Notification.exception(new Error(s.invalidregionsdataformat));
            }
        },
        error: function(xhr, status, error) {
            Log.debug('profilefield_truecity: Error fetching country data: ' + error);
            Notification.exception(new Error(s.failedtoloadcountrydata));
        },
    });
}

/**
 * Populate the regions control based on the selected country.
 *
 * @param {Array} regions Array of region objects.
 */
function populateRegions(regions) {
    regions = regions.sort((a, b) => a.n.localeCompare(b.n));
    const items = regions.map(region => {
        let name = region.n;
        if (!name || name.trim() === '' || name === 'UNKNOWN') {
            name = s.unknownregion;
        }
        return {value: String(region.i), label: name};
    });

    regionAC.setItems(items);

    if (currentSelected && currentSelected.region) {
        regionAC.setValue(currentSelected.region.value);
        const selectedRegion = regionAC.getValue();
        currentSelected.region = null;

        if (selectedRegion) {
            const countryCode = countryAC.getValue();
            loadRegionCities(countryCode, selectedRegion);
        }
    }
}

/**
 * Load cities for a given country and region.
 *
 * @param {string} countryCode The selected country code.
 * @param {string} regionCode The selected region code.
 */
function loadRegionCities(countryCode, regionCode) {
    const regionJsonUrl = `${baseurl}/regions/${countryCode}_${regionCode}.json`;
    Log.debug('Loading cities from URL: ' + regionJsonUrl);

    $.ajax({
        url: regionJsonUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            if (Array.isArray(data)) {
                populateCities(data);
            } else {
                Log.debug('profilefield_truecity: Invalid cities data format');
                Notification.exception(new Error(s.invalidregionsdataformat));
            }
        },
        error: function(xhr, status, error) {
            Log.debug('profilefield_truecity: Error fetching region data: ' + error);
            Notification.exception(new Error(s.failedtoloadregiondata));
        },
    });
}

/**
 * Populate the cities control based on the selected region.
 *
 * @param {Array} cities Array of city objects.
 */
function populateCities(cities) {
    cities = cities.sort((a, b) => a.n.localeCompare(b.n));
    const items = cities.map(city => ({value: String(city.i), label: city.n}));

    cityAC.setItems(items);

    if (currentSelected && currentSelected.city) {
        Log.debug('Preselecting city: ' + currentSelected.city.value);
        cityAC.setValue(currentSelected.city.value);
        currentSelected.city = null;
    }
}
