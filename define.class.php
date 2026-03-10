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
 * Text profile field definition.
 *
 * @package    profilefield_truecity
 * @copyright  2025 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Class profile_define_truecity
 *
 * @copyright  2025 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class profile_define_truecity extends profile_define_base {
    /**
     * Add elements for creating/editing a truecity profile field.
     *
     * @param MoodleQuickForm $form
     */
    public function define_form_specific($form) {
        // Param 1 is the base URI to search the countries and cities.
        $form->addElement('text', 'param1', get_string('baseuri', 'profilefield_truecity'));
        $form->setDefault('param1', 'https://recursos.bambuco.co/truecity/geonames/');
        $form->addHelpButton('param1', 'baseuri', 'profilefield_truecity');
        $form->setType('param1', PARAM_URL);

        // Param 2: whether this field updates the user's city and country in the profile.
        $form->addElement('selectyesno', 'param2', get_string('updateprofile', 'profilefield_truecity'));
        $form->addHelpButton('param2', 'updateprofile', 'profilefield_truecity');
        $form->setDefault('param2', 1);
    }

    /**
     * Validate the data from the add/edit profile field form.
     *
     * Only one truecity field is allowed because all instances write to the same
     * user.city and user.country columns.
     *
     * @param array|stdClass $data from the add/edit profile field form
     * @param array $files
     * @return array associative array of error messages
     */
    public function define_validate_specific($data, $files) {
        global $DB;

        $data = (object) $data;
        $err = [];

        // Only one truecity field is allowed if param2 is set to true.
        if (!empty($data->param2)) {
            $sql = 'SELECT id FROM {user_info_field} WHERE datatype = :datatype AND param2 = :param2';
            $params = ['datatype' => 'truecity', 'param2' => '1'];
            $existing = $DB->get_record_sql($sql, $params, IGNORE_MULTIPLE);
            if ($existing && (empty($data->id) || $existing->id != $data->id)) {
                $err['shortname'] = get_string('onlyone', 'profilefield_truecity');
            }
        }

        // Validate the base URI if provided.
        if (!empty($data->param1) && !filter_var($data->param1, FILTER_VALIDATE_URL)) {
            $err['param1'] = get_string('invalidbaseurl', 'profilefield_truecity');
        }

        return $err;
    }
}
