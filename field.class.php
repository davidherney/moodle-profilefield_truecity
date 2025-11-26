<?php
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
 * True city profile field.
 *
 * @package    profilefield_truecity
 * @copyright  2025 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use core\plugininfo\format;

/**
 * Class profile_field_truecity
 *
 * @copyright  2025 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class profile_field_truecity extends profile_field_base {
    /**
     * Overwrite the base class to display the data for this field
     */
    public function display_data() {
        global $USER;
        $value = '';
        $a = new stdClass();
        $a->city = $USER->city;
        $a->country = !empty($USER->country) ? get_string($USER->country, 'countries') : '';

        if (empty($a->city) && empty($a->country)) {
            return get_string('notset', 'profilefield_truecity');
        } else if (empty($a->city)) {
            $value = $a->country;
            return $value;
        } else if (empty($a->country)) {
            $value = $a->city;
            return $value;
        } else {
            $value = get_string('locationtext', 'profilefield_truecity', $a);
        }

        return $value;
    }

    /**
     * Add fields for editing a text profile field.
     *
     * @param moodleform $mform
     */
    public function edit_field_add($mform) {
        global $USER, $OUTPUT, $PAGE;

        $baseurl = $this->field->param1;
        $uniqid = uniqid();

        $defaultcountry = $USER->country;
        if (empty($defaultcountry)) {
            $defaultcountry = get_config('moodle', 'country');
        }
        $attributes = ['multiple' => false, 'placeholder' => get_string('selectacountry')];

        $formattedoptions = get_string_manager()->get_list_of_countries(true);

        $countrieslist = new \MoodleQuickForm_autocomplete('profilefield_truecity_country', '', $formattedoptions, $attributes);
        $countrieslist->setMultiple(false);
        if (!empty($defaultcountry) && array_key_exists($defaultcountry, $formattedoptions)) {
            $countrieslist->setValue($defaultcountry);
        }

        $attributes['placeholder'] = get_string('selectaregion', 'profilefield_truecity');
        $regionslist = new \MoodleQuickForm_autocomplete('profilefield_truecity_region', '', [], $attributes);
        $regionslist->setMultiple(false);

        $attributes['placeholder'] = get_string('selectacity', 'profilefield_truecity');
        $citieslist = new \MoodleQuickForm_autocomplete('profilefield_truecity_city', '', [], $attributes);
        $citieslist->setMultiple(false);

        // Se debe cambiar a un campo hidden para almacenar el JSON.
        $mform->addElement(
            'text',
            $this->inputname,
            format_string($this->field->name),
            ['data-targetvalue' => $uniqid]
        );
        $mform->setType($this->inputname, PARAM_RAW);

        $selectorhtml = $OUTPUT->render_from_template('profilefield_truecity/selector', [
            'countrieslisthtml' => $countrieslist->toHtml(),
            'regionlisthtml' => $regionslist->toHtml(),
            'citylisthtml' => $citieslist->toHtml(),
            'currentinfo' => $this->display_data(),
            'uniqid' => $uniqid,
        ]);

        $PAGE->requires->js_call_amd('profilefield_truecity/main', 'init', [
            $uniqid,
            $baseurl,
        ]);

        $mform->addElement('static', $this->inputname . '_static', format_string($this->field->name), $selectorhtml);
    }

    /**
     * Process the data before it gets saved in database
     *
     * @param string|null $data
     * @param stdClass $datarecord
     * @return string|null
     */
    public function edit_save_data_preprocess($data, $datarecord) {
        if ($data === null) {
            return null;
        }
        return core_text::substr($data, 0, $this->field->param2);
    }

    /**
     * Return the field type and null properties.
     * This will be used for validating the data submitted by a user.
     *
     * @return array the param type and null property
     * @since Moodle 3.2
     */
    public function get_field_properties() {
        return [PARAM_TEXT, NULL_NOT_ALLOWED];
    }
}
