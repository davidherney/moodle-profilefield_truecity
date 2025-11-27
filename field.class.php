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

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/form/autocomplete.php');

/**
 * Class profile_field_truecity
 *
 * @copyright  2025 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class profile_field_truecity extends profile_field_base {
    /**
     * Indicates if we are in editing mode
     *
     * @var bool
     */
    public $editingmode = false;

    /**
     * Overwrite the base class to display the data for this field
     */
    public function display_data() {

        if (!$this->editingmode) {
            return '';
        }

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
     * Display the name of the profile field.
     *
     * @param bool $escape
     * @return string
     */
    public function display_name(bool $escape = true): string {
        if (!$this->editingmode) {
            return '';
        }

        return parent::display_name($escape);
    }

    /**
     * Add fields for editing a text profile field.
     *
     * @param moodleform $mform
     */
    public function edit_field_add($mform) {
        global $USER, $OUTPUT, $PAGE;

        $this->editingmode = true;
        $baseurl = rtrim($this->field->param1, '/');
        $uniqid = uniqid();

        if (empty($baseurl)) {
            return;
        }

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

        // Store the field data in a hidden field as JSON.
        $mform->addElement(
            'hidden',
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

        // Remove the original fields if exists, i.e. we are not on the signup page.
        if ($mform->elementExists('city')) {
            $mform->removeElement('city');
        }
        if ($mform->elementExists('country')) {
            $mform->removeElement('country');
        }
    }

    /**
     * Tweaks the edit form
     * @param MoodleQuickForm $mform instance of the moodleform class
     * @return bool
     */
    public function edit_after_data($mform) {
        if ($this->field->visible == PROFILE_VISIBLE_NONE && !has_capability('moodle/user:update', context_system::instance())) {

            if ($mform->elementExists('city')) {
                $mform->removeElement('city');
            }
            if ($mform->elementExists('country')) {
                $mform->removeElement('country');
            }
        }
        return parent::edit_after_data($mform);
    }

    /**
     * Saves the data coming from form
     *
     * @param stdClass $usernew data coming from the form
     */
    public function edit_save_data($usernew) {
        global $DB;

        if (!isset($usernew->{$this->inputname})) {
            // Field not present in form, probably locked and invisible - skip it.
            return;
        }

        parent::edit_save_data($usernew);

        $fielddata = json_decode($usernew->{$this->inputname}, true);
        if (empty($fielddata) || !is_array($fielddata)) {
            return;
        }

        $data = new stdClass();
        $data->id = $usernew->id;

        if (isset($fielddata['country'])) {
            $data->country = $fielddata['country']['value'];
        }

        if (isset($fielddata['city'])) {
            $data->city = $fielddata['city']['name'];
        }

        $DB->update_record('user', $data);
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
