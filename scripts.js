document.addEventListener('DOMContentLoaded', function () {
    const daysSet = new Set();
    const categoryContainer = document.querySelector('.programs-category-filter .container');
    const templateContainer = document.querySelector('.category-template');
    templateContainer.style.display = 'none';
    const categories = templateContainer.children;

    const generateFilterValue = (text) => text.toLowerCase().replace(/\s/g, '-');

    // Generate filters for .programs-category-filter
    for (let category of categories) {
        const filterLink = document.createElement('a');
        const filterValue = generateFilterValue(category.innerText);
        const color = category.style.backgroundColor;

        filterLink.className = 'js-add-filter';
        filterLink.dataset.filterProgramGroup = true;
        filterLink.dataset.filterName = 'program_group';
        filterLink.dataset.filterValue = filterValue;
        filterLink.href = '#';
        filterLink.style.backgroundColor = color;

        const triangleContainer = document.createElement('div');
        triangleContainer.className = 'triangle-container';
        triangleContainer.innerHTML = `
            <svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none">
                <polygon points="10 20, 0 0, 20 0" class="triangle" fill="${color}"></polygon>
                <rect x="0" y="0" width="20" height="1" class="square" fill="${color}"></rect>
            </svg>`;

        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.textContent = category.innerText;

        filterLink.appendChild(triangleContainer);
        filterLink.appendChild(span);

        categoryContainer.appendChild(filterLink);
    }

    // Generate .program-group-header
    const programGroupHeader = document.querySelector('.program-group-header');
    const programHeaderSpan = document.createElement('span');
    programHeaderSpan.className = 'js-program-group-header program-group-header-text';
    programHeaderSpan.textContent = 'All Programs';
    programGroupHeader.appendChild(programHeaderSpan);

    const programGroupDropdown = document.createElement('div');
    programGroupDropdown.className = 'program-group-dropdown';

    for (let category of categories) {
        const dropdownLink = document.createElement('a');
        const filterValue = generateFilterValue(category.innerText);

        dropdownLink.className = 'js-add-filter';
        dropdownLink.dataset.filterProgramGroup = true;
        dropdownLink.dataset.filterName = 'program_group';
        dropdownLink.dataset.filterValue = filterValue;
        dropdownLink.href = `/programs/${filterValue === 'all-programs' ? '' : filterValue}`;
        dropdownLink.style.backgroundColor = category.style.backgroundColor;

        const span = document.createElement('span');
        span.textContent = category.innerText;

        dropdownLink.appendChild(span);
        programGroupDropdown.appendChild(dropdownLink);
    }

    programGroupHeader.appendChild(programGroupDropdown);

    // Generate categories for .programs
    function addProgramCategories() {
        const programs = document.querySelectorAll('.program');
        programs.forEach(program => {
            const filter = JSON.parse(program.getAttribute('data-filter').replace(/'/g, '"'));
            const categoriesDiv = program.querySelector('.program-categories');

            filter.program_group.forEach(group => {
                const groupText = group.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                for (let category of categories) {
                    if (generateFilterValue(category.innerText) === group) {
                        const categoryDiv = document.createElement('div');
                        categoryDiv.style.backgroundColor = category.style.backgroundColor;

                        const span = document.createElement('span');
                        span.textContent = groupText;

                        categoryDiv.appendChild(span);
                        categoriesDiv.appendChild(categoryDiv);
                    }
                }
            });

            // Extract days from the event info
            const eventInfoText = program.querySelector('.event-info').textContent;
            const daysMatch = eventInfoText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/g);
            if (daysMatch) {
                daysMatch.forEach(day => {
                    day = day.trim();
                    daysSet.add(day);
                });
                program.setAttribute('data-filter-days', JSON.stringify(daysMatch.map(day => day.toLowerCase())));
            } else {
                program.setAttribute('data-filter-days', JSON.stringify([]));
            }
        });

        // Update the Days filter options in the DOM
        const daysFilterOptions = document.querySelector('.program-filter-group[data-filter-group-name="program_days"] .program-filter-options');
        daysSet.forEach(day => {
            const dayFilterLabel = document.createElement('label');
            const dayCheckBox = document.createElement('input');
            dayCheckBox.type = 'checkbox';
            dayCheckBox.className = 'js-add-remove-filter';
            dayCheckBox.dataset.filterName = 'program_days';
            dayCheckBox.dataset.filterValue = day.toLowerCase();
            dayCheckBox.name = 'days[]';
            dayCheckBox.value = day.toLowerCase();

            const daySpan = document.createElement('span');
            daySpan.textContent = day;

            dayFilterLabel.appendChild(dayCheckBox);
            dayFilterLabel.appendChild(daySpan);
            daysFilterOptions.appendChild(dayFilterLabel);
        });
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