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
        global $USER;

        if (!$this->editingmode) {
            return '';
        }

        $a = new stdClass();
        $a->city = '';
        $a->country = '';

        if (!empty($this->field->param2) && $this->userid > 0) {
            $targetuser = empty($this->userid) || $this->userid == $USER->id ? $USER : core_user::get_user($this->userid);
            if (property_exists($targetuser, 'city') && is_string($targetuser->city)) {
                $a->city = $targetuser->city;
            }
            if (property_exists($targetuser, 'country') && is_string($targetuser->country)) {
                $a->country = !empty($targetuser->country) ? get_string($targetuser->country, 'countries') : '';
            }
        }

        if (!empty($this->data) && (empty($a->city) || empty($a->country))) {
            $fielddata = json_decode($this->data, true);
            if (empty($fielddata) || !is_array($fielddata)) {
                return '';
            }
            $a->city = $fielddata['city']['name'] ?? '';
            $a->country = !empty($fielddata['country']['name']) ? $fielddata['country']['name'] : '';
        }

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
        global $OUTPUT, $PAGE, $USER;

        $this->editingmode = true;
        $baseurl = rtrim($this->field->param1, '/');
        $uniqid = uniqid();

        if (empty($baseurl)) {
            return;
        }

        $defaultcountry = '';
        if ($this->userid > 0) {
            $targetuser = empty($this->userid) || $this->userid == $USER->id ? $USER : core_user::get_user($this->userid);
            if (property_exists($targetuser, 'country') && is_string($targetuser->country)) {
                $defaultcountry = $targetuser->country;
            }
        }

        if (empty($defaultcountry)) {
            $defaultcountry = get_config('moodle', 'country');
        }

        // Build countries list for the template.
        $countries = get_string_manager()->get_list_of_countries(true);
        $countriesoptions = [];
        foreach ($countries as $code => $name) {
            $countriesoptions[] = ['value' => $code, 'label' => $name];
        }

        // Store the field data in a hidden field as JSON.
        $mform->addElement(
            'text',
            $this->inputname,
            format_string($this->field->name),
            ['data-targetvalue' => $uniqid, 'class' => 'profilefield-truecity-input']
        );
        $mform->setType($this->inputname, PARAM_RAW);

        $selectorhtml = $OUTPUT->render_from_template('profilefield_truecity/selector', [
            'currentinfo' => $this->display_data(),
            'uniqid' => $uniqid,
            'countries' => $countriesoptions,
            'defaultcountry' => $defaultcountry ?: '',
        ]);

        $PAGE->requires->js_call_amd('profilefield_truecity/main', 'init', [
            $uniqid,
            $baseurl,
        ]);

        $mform->addElement('static', $this->inputname . '_static', '', $selectorhtml);

        if (!empty($this->field->param2)) {
            // Remove the original fields if exists, i.e. we are not on the signup page.
            if ($mform->elementExists('city')) {
                $mform->removeElement('city');
            }
            if ($mform->elementExists('country')) {
                $mform->removeElement('country');
            }
        }
    }

    /**
     * Tweaks the edit form
     * @param MoodleQuickForm $mform instance of the moodleform class
     * @return bool
     */
    public function edit_after_data($mform) {
        if (
            $this->field->visible == PROFILE_VISIBLE_NONE &&
            !has_capability('moodle/user:update', context_system::instance()) &&
            !empty($this->field->param2)
        ) {
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
        global $CFG;

        if (!isset($usernew->{$this->inputname})) {
            // Field not present in form, probably locked and invisible - skip it.
            return;
        }

        parent::edit_save_data($usernew);

        $fielddata = json_decode($usernew->{$this->inputname}, true);
        if (empty($fielddata) || !is_array($fielddata)) {
            return;
        }

        if (!empty($this->field->param2)) {
            $data = new stdClass();
            $data->id = $usernew->id;

            if (isset($fielddata['country'])) {
                $data->country = $fielddata['country']['value'];
            }

            if (isset($fielddata['city'])) {
                $data->city = $fielddata['city']['name'];
            }

            require_once($CFG->dirroot . '/user/lib.php');
            user_update_user($data, false);
        }
    }

    /**
     * Validate the form field from profile page.
     *
     * @param stdClass $usernew
     * @return array error messages for the form validation
     */
    public function edit_validate_field($usernew) {
        $errors = parent::edit_validate_field($usernew);

        $value = $usernew->{$this->inputname} ?? '';

        if (empty($value) && !$this->is_required()) {
            return $errors;
        }

        $fielddata = json_decode($value, true);

        $hascity = !empty($fielddata['city']['name']);
        $hascountry = !empty($fielddata['country']['value']);

        if (!$hascity || !$hascountry) {
            $errors[$this->inputname] = get_string('required');
        }

        return $errors;
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
