document.addEventListener('DOMContentLoaded', function () {
    const daysSet = new Set();
    const categoryContainer = document.querySelector('.programs-category-filter .container');
    const templateContainer = document.querySelector('.category-template');
    templateContainer.style.display = 'none';
    const categories = Array.from(templateContainer.children);
    const categoriesMap = new Map();

    const generateFilterValue = (text) => text.toLowerCase().replace(/\s/g, '-');

    // Cache frequently accessed DOM elements
    const programGroupHeader = document.querySelector('.program-group-header');

    // Initialize categoriesMap
    categories.forEach(category => {
        const filterValue = generateFilterValue(category.innerText);
        categoriesMap.set(filterValue, {
            text: category.innerText,
            color: category.style.backgroundColor
        });
    });

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
                    programDays = daysMatch.map(day => day.trim().toLowerCase());
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
                           data-filter-value="${day.toLowerCase()}" name="days[]" value="${day.toLowerCase()}">
                    <span>${day}</span>
                </label>
            `;
            daysFragment.appendChild(dayFilterTemplate.content.cloneNode(true));
        });
        daysFilterOptions.appendChild(daysFragment);
    }

    addProgramCategories();

    function setActiveCategory(filterLink) {
        document.querySelectorAll('.js-add-filter').forEach(el => el.classList.remove('active'));
        filterLink.classList.add('active');

        const categoryName = filterLink.querySelector('span').textContent;
        document.querySelector('.program-group-header-text').textContent = categoryName;
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
        const activeCategory = document.querySelector('.js-add-filter.active');
        const activeAudienceFilters = document.querySelectorAll('.program-filter-group[data-filter-group-name="program_audience"] input:checked');
        const activeDaysFilters = document.querySelectorAll('.program-filter-group[data-filter-group-name="program_days"] input:checked');

        const activeCategoryValue = activeCategory ? activeCategory.dataset.filterValue : 'all-programs';
        const audienceFilters = Array.from(activeAudienceFilters).map(filter => filter.value);
        const daysFilters = Array.from(activeDaysFilters).map(filter => filter.value);

        document.querySelectorAll('.program').forEach(program => {
            const programFilters = JSON.parse(program.dataset.filter.replace(/'/g, '"'));
            const programGroups = programFilters.program_group;
            const programAudiences = programFilters.program_audience;
            const programDays = JSON.parse(program.dataset.filterDays);

            const matchesCategory = activeCategoryValue === 'all-programs' || programGroups.includes(activeCategoryValue);
            const matchesAudience = audienceFilters.length === 0 || audienceFilters.some(filter => programAudiences.includes(filter));
            const matchesDays = daysFilters.length === 0 || daysFilters.some(filter => programDays.includes(filter));

            program.style.display = matchesCategory && matchesAudience && matchesDays ? 'block' : 'none';
        });

        const anyVisible = Array.from(document.querySelectorAll('.program')).some(program => program.style.display !== 'none');
        document.querySelector('.no-program-matches').style.display = anyVisible ? 'none' : 'block';

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

    document.querySelectorAll('.program-more-details-open').forEach(programDetailsOpenLink => {
        programDetailsOpenLink.addEventListener('click', event => {
            event.preventDefault();
            toggleProgramDetails(programDetailsOpenLink);
        });
    });

    document.querySelectorAll('.program-filter-group .fd-toggle').forEach(filterGroupHeader => {
        filterGroupHeader.addEventListener('click', () => toggleFilterOptions(filterGroupHeader.closest('.program-filter-group')));
    });

    document.querySelectorAll('.program-filter-options input').forEach(filterCheckbox => {
        filterCheckbox.addEventListener('change', filterPrograms);
    });

    document.addEventListener('click', event => {
        if (event.target.classList.contains('js-filter-tag-remove')) {
            const filterValue = event.target.dataset.filterValue;
            const filterName = event.target.dataset.filterName;

            document.querySelector(`.program-filter-options input[data-filter-name="${filterName}"][value="${filterValue}"]`).checked = false;
            filterPrograms();
        }
    });

    document.addEventListener('click', hideFilterOptionsOnClickOutside);

    const defaultCategory = document.querySelector('.js-add-filter[data-filter-value="all-programs"]');
    setActiveCategory(defaultCategory);
    filterPrograms();
});
