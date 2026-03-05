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
 * Custom autocomplete control for truecity profile field.
 *
 * @module     profilefield_truecity/autocomplete
 * @copyright  2025 David Herney @ BambuCo
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * A lightweight autocomplete input control.
 *
 * Renders an <input> with a filterable dropdown list.
 * Filters items by partial case-insensitive match anywhere in the label.
 */
export default class TruecityAutocomplete {

    /**
     * @param {HTMLElement} container The container element to render into.
     * @param {object} options Configuration options.
     * @param {string} [options.placeholder=''] Placeholder text for the input.
     * @param {Function} [options.onChange=null] Callback when selection changes: onChange(value, label).
     */
    constructor(container, options = {}) {
        this.container = container;
        this.placeholder = options.placeholder || '';
        this.onChange = options.onChange || null;
        this.items = [];
        this.filteredItems = [];
        this.selectedValue = null;
        this.selectedLabel = null;
        this.highlightedIndex = -1;
        this.isOpen = false;
        this.disabled = false;

        this._loadInitialItems();
        this._render();
        this._bindEvents();
    }

    /**
     * Read <option> elements already present in the container and use them as initial items.
     */
    _loadInitialItems() {
        const options = this.container.querySelectorAll('option');
        if (options.length === 0) {
            return;
        }
        options.forEach(opt => {
            if (opt.value) {
                this.items.push({value: opt.value, label: opt.textContent.trim()});
            }
        });
        this.filteredItems = [...this.items];
    }

    /**
     * Build the DOM structure inside the container.
     */
    _render() {
        this.container.innerHTML = '';
        this.container.classList.add('truecity-autocomplete');

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'form-control truecity-autocomplete-input';
        this.input.placeholder = this.placeholder;
        this.input.setAttribute('autocomplete', 'off');
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-autocomplete', 'list');
        this.input.setAttribute('aria-expanded', 'false');

        this.dropdown = document.createElement('ul');
        this.dropdown.className = 'truecity-autocomplete-dropdown';
        this.dropdown.setAttribute('role', 'listbox');

        this.container.appendChild(this.input);
        this.container.appendChild(this.dropdown);
    }

    /**
     * Bind all event listeners.
     */
    _bindEvents() {
        this.input.addEventListener('input', () => {
            if (this.disabled) {
                return;
            }
            this._filter(this.input.value);
            this._open();
        });

        this.input.addEventListener('focus', () => {
            if (this.disabled) {
                return;
            }
            this.input.select();
            this._filter(this.input.value);
            this._open();
        });

        this.input.addEventListener('blur', () => {
            // Delay to allow click on dropdown items to fire first.
            setTimeout(() => this._resolveOnBlur(), 150);
        });

        this.input.addEventListener('keydown', (e) => {
            if (this.disabled) {
                return;
            }
            this._handleKeydown(e);
        });

        // Close dropdown when clicking outside.
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this._close();
            }
        });
    }

    /**
     * Handle keyboard navigation.
     *
     * @param {KeyboardEvent} e The keydown event.
     */
    _handleKeydown(e) {
        if (!this.isOpen && e.key !== 'ArrowDown' && e.key !== 'Enter') {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!this.isOpen) {
                    this._filter(this.input.value);
                    this._open();
                } else {
                    this._moveHighlight(1);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._moveHighlight(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.isOpen && this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredItems.length) {
                    this._selectItem(this.filteredItems[this.highlightedIndex]);
                }
                break;
            case 'Escape':
                this._close();
                break;
        }
    }

    /**
     * Move the highlighted index by a delta and update the UI.
     *
     * @param {number} delta The direction to move (+1 or -1).
     */
    _moveHighlight(delta) {
        const len = this.filteredItems.length;
        if (len === 0) {
            return;
        }
        this.highlightedIndex = Math.max(0, Math.min(len - 1, this.highlightedIndex + delta));
        this._updateHighlight();
        this._scrollToHighlighted();
    }

    /**
     * Update highlight classes on existing <li> elements without rebuilding the DOM.
     */
    _updateHighlight() {
        const items = this.dropdown.querySelectorAll('.truecity-autocomplete-item');
        items.forEach((li, i) => {
            if (i === this.highlightedIndex) {
                li.classList.add('truecity-autocomplete-item-active');
                li.setAttribute('aria-selected', 'true');
            } else {
                li.classList.remove('truecity-autocomplete-item-active');
                li.removeAttribute('aria-selected');
            }
        });
    }

    /**
     * Scroll the dropdown so the highlighted item is visible.
     */
    _scrollToHighlighted() {
        const active = this.dropdown.querySelector('.truecity-autocomplete-item-active');
        if (active) {
            active.scrollIntoView({block: 'nearest'});
        }
    }

    /**
     * Filter items based on query text (case-insensitive partial match).
     *
     * @param {string} query The search text.
     */
    _filter(query) {
        const q = (query || '').toLowerCase().trim();
        if (q === '') {
            this.filteredItems = [...this.items];
        } else {
            this.filteredItems = this.items.filter(item => item.label.toLowerCase().includes(q));
        }
        this.highlightedIndex = -1;
        this._renderDropdown();
    }

    /**
     * Render the dropdown list from filteredItems.
     */
    _renderDropdown() {
        this.dropdown.innerHTML = '';
        this.filteredItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'truecity-autocomplete-item';
            li.setAttribute('role', 'option');
            li.textContent = item.label;
            if (index === this.highlightedIndex) {
                li.classList.add('truecity-autocomplete-item-active');
                li.setAttribute('aria-selected', 'true');
            }
            if (this.selectedValue !== null && item.value === this.selectedValue) {
                li.classList.add('truecity-autocomplete-item-selected');
            }
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                this._selectItem(item);
            });
            // Highlight on hover — only toggle classes, never re-render.
            li.addEventListener('mouseenter', () => {
                this.highlightedIndex = index;
                this._updateHighlight();
            });
            this.dropdown.appendChild(li);
        });
    }

    /**
     * Select an item and fire the onChange callback.
     *
     * @param {object} item The item to select ({value, label}).
     */
    _selectItem(item) {
        this.selectedValue = item.value;
        this.selectedLabel = item.label;
        this.input.value = item.label;
        this._close();
        if (this.onChange) {
            this.onChange(item.value, item.label);
        }
    }

    /**
     * Resolve the input value on blur.
     * If the text matches exactly one item (case-insensitive), auto-select it.
     * Otherwise, restore the previous selection or clear the input.
     */
    _resolveOnBlur() {
        // Already has a valid selection matching the input — nothing to do.
        if (this.selectedValue !== null && this.input.value === this.selectedLabel) {
            return;
        }

        const text = this.input.value.trim().toLowerCase();

        // Try exact match (case-insensitive).
        if (text !== '') {
            const match = this.items.find(item => item.label.toLowerCase() === text);
            if (match) {
                this._selectItem(match);
                return;
            }
        }

        // No match — restore previous selection or clear.
        if (this.selectedLabel) {
            this.input.value = this.selectedLabel;
        } else {
            this.input.value = '';
        }
    }

    /**
     * Open the dropdown.
     */
    _open() {
        if (this.filteredItems.length === 0) {
            this._close();
            return;
        }
        this.isOpen = true;
        this.dropdown.classList.add('show');
        this.input.setAttribute('aria-expanded', 'true');
        this._updateDropDirection();
    }

    /**
     * Detect if the dropdown overflows the viewport and switch to dropup if needed.
     */
    _updateDropDirection() {
        // Reset to default (down) before measuring.
        this.dropdown.classList.remove('truecity-autocomplete-dropup');

        const rect = this.dropdown.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (rect.bottom > viewportHeight && rect.top > rect.height) {
            this.dropdown.classList.add('truecity-autocomplete-dropup');
        }
    }

    /**
     * Close the dropdown.
     */
    _close() {
        this.isOpen = false;
        this.highlightedIndex = -1;
        this.dropdown.classList.remove('show');
        this.dropdown.classList.remove('truecity-autocomplete-dropup');
        this.input.setAttribute('aria-expanded', 'false');
    }

    /**
     * Replace the list of available items.
     *
     * @param {Array} items Array of {value, label} objects.
     */
    setItems(items) {
        this.items = items || [];
        this.filteredItems = [...this.items];
        this.selectedValue = null;
        this.selectedLabel = null;
        this.input.value = '';
        this.highlightedIndex = -1;
        this._renderDropdown();
    }

    /**
     * Get the currently selected value.
     *
     * @returns {string|null} The selected value or null.
     */
    getValue() {
        return this.selectedValue;
    }

    /**
     * Get the currently selected label.
     *
     * @returns {string|null} The selected label or null.
     */
    getLabel() {
        return this.selectedLabel;
    }

    /**
     * Programmatically select an item by value.
     *
     * @param {string} value The value to select.
     */
    setValue(value) {
        const item = this.items.find(i => i.value === value);
        if (item) {
            this.selectedValue = item.value;
            this.selectedLabel = item.label;
            this.input.value = item.label;
        }
    }

    /**
     * Clear selection and all items.
     */
    clear() {
        this.items = [];
        this.filteredItems = [];
        this.selectedValue = null;
        this.selectedLabel = null;
        this.input.value = '';
        this.highlightedIndex = -1;
        this._renderDropdown();
        this._close();
    }

    /**
     * Disable the control.
     */
    disable() {
        this.disabled = true;
        this.input.disabled = true;
        this._close();
    }

    /**
     * Enable the control.
     */
    enable() {
        this.disabled = false;
        this.input.disabled = false;
    }
}
