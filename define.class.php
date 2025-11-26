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
        $form->setDefault('param1', 'http://www.example.com/city/');
        $form->addHelpButton('param1', 'baseuri', 'profilefield_truecity');
        $form->setType('param1', PARAM_URL);
    }
}
