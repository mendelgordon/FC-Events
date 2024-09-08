// Utility functions
const generateFilterValue = (text) => {
    console.log('Input to generateFilterValue:', text);
    try {
        if (text === null || text === undefined) {
            console.warn('Null or undefined input provided to generateFilterValue');
            return '';
        }
        if (typeof text !== 'string') {
            console.warn(`Non-string input provided to generateFilterValue. Type: ${typeof text}`);
            text = String(text);
        }
        const trimmedText = text.trim();
        if (trimmedText === '') {
            console.warn('Empty string provided to generateFilterValue');
            return '';
        }
        const result = trimmedText.toLowerCase().replace(/\s+/g, '-');
        console.log('Generated filter value:', result);
        return result;
    } catch (error) {
        console.error('Error in generateFilterValue:', error);
        return ''; // Return empty string instead of re-throwing to prevent breaking the UI
    }
};

// Expose utility functions globally
if (typeof window !== 'undefined') {
    window.generateFilterValue = generateFilterValue;
} else if (typeof global !== 'undefined') {
    global.generateFilterValue = generateFilterValue;
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded event fired');
    const daysSet = new Set();
    const categoryContainer = document.querySelector('.programs-category-filter .container');
    console.log('Category container:', categoryContainer);
    const templateContainer = document.querySelector('.category-template');
    console.log('Template container:', templateContainer);
    if (!templateContainer) {
        console.error('Template container not found');
        return;
    }
    templateContainer.style.display = 'none';
    const categories = Array.from(templateContainer.children);
    console.log('Categories:', categories);
    const categoriesMap = new Map();

    // Cache frequently accessed DOM elements
    const programGroupHeader = document.querySelector('.program-group-header');
    console.log('Program group header:', programGroupHeader);

    // Initialize categoriesMap
    categories.forEach((category, index) => {
        console.log(`Processing category ${index}:`, category);
        const filterValue = generateFilterValue(category.innerText);
        console.log(`Generated filter value: ${filterValue}`);
        categoriesMap.set(filterValue, {
            text: category.innerText,
            color: category.style.backgroundColor
        });
    });
    console.log('Categories map:', categoriesMap);

    // Generate filters for .programs-category-filter
    const fragment = document.createDocumentFragment();
    for (let category of categories) {
        const filterValue = generateFilterValue(category.innerText);
        const color = category.style.backgroundColor;

        const filterLink = document.createElement('a');
        filterLink.className = 'js-add-filter';
        filterLink.dataset.filterProgramGroup = 'true';
        filterLink.dataset.filterName = 'program_group';
        filterLink.dataset.filterValue = filterValue;
        filterLink.href = '#';
        filterLink.style.backgroundColor = color;

        filterLink.innerHTML = `
            <div class="triangle-container">
                <svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none">
                    <polygon points="10 20, 0 0, 20 0" class="triangle" fill="${color}"></polygon>
                    <rect x="0" y="0" width="20" height="1" class="square" fill="${color}"></rect>
                </svg>
            </div>
            <span style="background-color: ${color}">${category.innerText}</span>
        `;

        fragment.appendChild(filterLink);
    }
    categoryContainer.appendChild(fragment);

    // Generate .program-group-header
    const programHeaderSpan = document.createElement('span');
    programHeaderSpan.className = 'js-program-group-header program-group-header-text';
    programHeaderSpan.textContent = 'All Programs';
    programGroupHeader.appendChild(programHeaderSpan);

    const programGroupDropdown = document.createElement('div');
    programGroupDropdown.className = 'program-group-dropdown';

    const dropdownFragment = document.createDocumentFragment();
    categories.forEach(category => {
        const filterValue = generateFilterValue(category.innerText);
        const dropdownLink = document.createElement('a');
        dropdownLink.className = 'js-add-filter';
        dropdownLink.dataset.filterProgramGroup = 'true';
        dropdownLink.dataset.filterName = 'program_group';
        dropdownLink.dataset.filterValue = filterValue;
        dropdownLink.href = `/programs/${filterValue === 'all-programs' ? '' : filterValue}`;
        dropdownLink.style.backgroundColor = category.style.backgroundColor;
        dropdownLink.innerHTML = `<span>${category.innerText}</span>`;
        dropdownFragment.appendChild(dropdownLink);
    });

    programGroupDropdown.appendChild(dropdownFragment);
    programGroupHeader.appendChild(programGroupDropdown);

    // Generate categories for .programs
    function addProgramCategories() {
        const programs = document.querySelectorAll('.program');
        const daysFilterOptions = document.querySelector('.program-filter-group[data-filter-group-name="program_days"] .program-filter-options');
        const daysFragment = document.createDocumentFragment();

        programs.forEach(program => {
            const filter = JSON.parse(program.getAttribute('data-filter').replace(/'/g, '"'));
            const categoriesDiv = program.querySelector('.program-categories');

            const categoryFragment = document.createDocumentFragment();
            filter.program_group.forEach(group => {
                const category = categoriesMap.get(group);
                if (category) {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.style.backgroundColor = category.color;
                    categoryDiv.innerHTML = `<span>${category.text}</span>`;
                    categoryFragment.appendChild(categoryDiv);
                }
            });
            categoriesDiv.appendChild(categoryFragment);

            // Extract days from the event info
            const eventInfoElement = program.querySelector('.event-info');
            let programDays = [];
            if (eventInfoElement) {
                const daysMatch = eventInfoElement.textContent.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/g);
                if (daysMatch) {
                    programDays = daysMatch.map(day => day.trim());
                    programDays.forEach(day => daysSet.add(day));
                }
            }
            program.dataset.filterDays = JSON.stringify(programDays);
        });

        // Update the Days filter options in the DOM
        const dayFilterTemplate = document.createElement('template');
        daysSet.forEach(day => {
            dayFilterTemplate.innerHTML = `
                <label>
                    <input type="checkbox" class="js-add-remove-filter" data-filter-name="program_days"
                           data-filter-value="${day}" name="days[]" value="${day}">
                    <span>${day}</span>
                </label>
            `;
            daysFragment.appendChild(dayFilterTemplate.content.cloneNode(true));
        });
        daysFilterOptions.appendChild(daysFragment);
    }

    addProgramCategories();

    function setActiveCategory(filterLink) {
        console.log('setActiveCategory called with:', filterLink);
        if (!filterLink) {
            console.error('setActiveCategory: filterLink is null or undefined');
            return;
        }
        document.querySelectorAll('.js-add-filter').forEach(el => {
            if (el && el.classList) el.classList.remove('active');
        });
        if (filterLink.classList) {
            filterLink.classList.add('active');
        } else {
            console.error('setActiveCategory: filterLink.classList is undefined');
        }

        const spanElement = filterLink.querySelector('span');
        const categoryName = spanElement ? spanElement.textContent : 'Unknown Category';
        const headerElement = document.querySelector('.program-group-header-text');
        if (headerElement) {
            headerElement.textContent = categoryName;
        } else {
            console.error('setActiveCategory: .program-group-header-text element not found');
        }
    }

    function toggleProgramDetails(programDetailsOpenLink) {
        document.querySelectorAll('.program-more-details').forEach(details => details.style.display = 'none');
        document.querySelectorAll('.program').forEach(program => program.classList.remove('focus'));

        const programDetails = programDetailsOpenLink.closest('.program').querySelector('.program-more-details');
        programDetails.style.display = 'block';
        programDetailsOpenLink.closest('.program').classList.add('focus');
    }

    function toggleFilterOptions(filterGroupHeader) {
        const options = filterGroupHeader.querySelector('.program-filter-options');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    }

    function filterPrograms() {
        console.log('filterPrograms function called');
        const activeCategory = document.querySelector('.js-add-filter.active');
        const activeAudienceFilters = document.querySelectorAll('.program-filter-group[data-filter-group-name="program_audience"] input:checked');
        const activeDaysFilters = document.querySelectorAll('.program-filter-group[data-filter-group-name="program_days"] input:checked');

        const activeCategoryValue = activeCategory ? activeCategory.dataset.filterValue : 'all-programs';
        const audienceFilters = Array.from(activeAudienceFilters).map(filter => filter.value);
        const daysFilters = Array.from(activeDaysFilters).map(filter => filter.value);

        console.log('Active filters:', { activeCategoryValue, audienceFilters, daysFilters });

        let visibleCount = 0;
        document.querySelectorAll('.program').forEach((program, index) => {
            console.log(`\nProcessing program ${index + 1}:`);
            console.log('Program HTML:', program.outerHTML);

            const programFilters = JSON.parse(program.dataset.filter.replace(/'/g, '"'));
            console.log('Program filters:', programFilters);

            const programGroups = programFilters.program_group;
            const programAudiences = programFilters.program_audience;
            const programDays = JSON.parse(program.dataset.filterDays || '[]');
            console.log('Program days:', programDays);

            const matchesCategory = activeCategoryValue === 'all-programs' || programGroups.includes(activeCategoryValue);
            console.log('Matches category:', matchesCategory, '(Active:', activeCategoryValue, ', Program:', programGroups, ')');

            const matchesAudience = audienceFilters.length === 0 || audienceFilters.every(filter => programAudiences.includes(filter));
            console.log('Matches audience:', matchesAudience, '(Filters:', audienceFilters, ', Program:', programAudiences, ')');

            const matchesDays = daysFilters.length === 0 || daysFilters.some(filter => programDays.includes(filter));
            console.log('Matches days:', matchesDays, '(Filters:', daysFilters, ', Program:', programDays, ')');

            const isVisible = matchesCategory && matchesAudience && matchesDays;
            program.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;

            console.log('Program visibility:', {
                id: program.id,
                isVisible,
                matchesCategory,
                matchesAudience,
                matchesDays
            });
        });

        console.log('Total visible programs:', visibleCount);

        const noResultsElement = document.querySelector('.no-program-matches');
        noResultsElement.style.display = visibleCount === 0 ? 'block' : 'none';
        console.log('No results message visibility:', noResultsElement.style.display);

        updateActiveFilters();
    }

    function updateActiveFilters() {
        const activeFiltersContainer = document.querySelector('.js-active-filters-list');
        activeFiltersContainer.innerHTML = '';

        const activeFilters = document.querySelectorAll('.program-filter-options input:checked');
        activeFilters.forEach(filter => {
            const filterTag = document.createElement('span');
            filterTag.classList.add('filter-tag');
            filterTag.innerHTML = `
            ${filter.nextElementSibling.textContent.trim()}&nbsp;
            <span data-filter-value="${filter.value}" data-filter-name="${filter.dataset.filterName}" class="filter-tag-remove js-filter-tag-remove">x</span>`;
            activeFiltersContainer.appendChild(filterTag);
        });

        const activeFilterCount = activeFilters.length;
        const filterHeader = document.querySelector('.active-filters-display');
        filterHeader.textContent = activeFilterCount === 0 ? 'all' : `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`;
    }

    function hideFilterOptionsOnClickOutside(event) {
        const filterGroups = document.querySelectorAll('.program-filter-group');
        filterGroups.forEach(filterGroup => {
            const options = filterGroup.querySelector('.program-filter-options');
            if (!filterGroup.contains(event.target)) options.style.display = 'none';
        });
    }

    document.querySelectorAll('.js-add-filter').forEach(filterLink => {
        filterLink.addEventListener('click', event => {
            event.preventDefault();
            setActiveCategory(filterLink);
            filterPrograms();
        });
    });

    document.querySelectorAll('li.program').forEach(program => {
        program.addEventListener('click', () => {
            toggleProgramDetails(program.querySelector('.program-more-details-open'));
        });
    });

    document.querySelectorAll('.program-filter-group .fd-toggle').forEach(filterGroupHeader => {
        filterGroupHeader.addEventListener('click', () => toggleFilterOptions(filterGroupHeader.closest('.program-filter-group')));
    });

    document.querySelectorAll('.program-filter-options input').forEach(filterCheckbox => {
        filterCheckbox.addEventListener('change', filterPrograms);
    });

    document.addEventListener('click', event => {
        const target = event.target;
        if (target.classList.contains('js-filter-tag-remove')) {
            const { filterValue, filterName } = target.dataset;
            document.querySelector(`.program-filter-options input[data-filter-name="${filterName}"][value="${filterValue}"]`).checked = false;
            filterPrograms();
        }
    });

    document.addEventListener('click', hideFilterOptionsOnClickOutside);

    const defaultCategory = document.querySelector('.js-add-filter[data-filter-value="all-programs"]');
    setActiveCategory(defaultCategory);
    filterPrograms();
});
