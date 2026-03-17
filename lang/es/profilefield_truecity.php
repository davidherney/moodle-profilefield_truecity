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
 * Strings for component 'profilefield_truecity', language 'es'
 *
 * @package    profilefield_truecity
 * @category   string
 * @copyright  2026 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['baseuri'] = 'URI base';
$string['baseuri_help'] = 'La URI base para buscar los países y ciudades.
Debe haber un archivo por país con todas las regiones y un archivo por región con todas las ciudades.';
$string['failedtoloadcountrydata'] = 'Error al cargar los datos del país';
$string['failedtoloadregiondata'] = 'Error al cargar los datos de la región';
$string['invalidbaseurl'] = 'URI base no válida';
$string['invalidregionsdataformat'] = 'Formato de datos de regiones no válido';
$string['locationtext'] = '{$a->city}, {$a->country}';
$string['notset'] = 'No establecido';
$string['onlyone'] = 'Solo se permite un campo de ciudad real para actualizar el perfil del usuario.';
$string['pluginname'] = 'Ciudad real';
$string['privacy:metadata:profilefield_truecity:data'] = 'Datos del usuario del campo de perfil de usuario Ciudad real';
$string['privacy:metadata:profilefield_truecity:dataformat'] = 'El formato de los datos del usuario del campo de perfil de usuario Ciudad real';
$string['privacy:metadata:profilefield_truecity:fieldid'] = 'El ID del campo de perfil';
$string['privacy:metadata:profilefield_truecity:tableexplanation'] = 'Datos de perfil adicionales';
$string['privacy:metadata:profilefield_truecity:userid'] = 'El ID del usuario cuyos datos son almacenados por el campo de perfil de usuario Ciudad real';
$string['region'] = 'Región';
$string['selectacity'] = 'Seleccionar una ciudad';
$string['selectaregion'] = 'Seleccionar una región';
$string['selectlocation'] = 'Seleccionar';
$string['selectlocationtitle'] = 'Seleccionar ubicación';
$string['unknownregion'] = 'Nombre de región desconocido';
$string['updateprofile'] = 'Actualizar perfil de usuario';
$string['updateprofile_help'] = 'Si está habilitado, la ciudad y el país seleccionados actualizarán los campos de ciudad y país en el perfil del usuario. Si está deshabilitado, la selección se almacena solo como datos de campo de perfil personalizado.';
