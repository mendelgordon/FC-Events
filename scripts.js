
document.addEventListener('DOMContentLoaded', function () {
    // Format the date from the event text to a Date object
    function parseDateString(dateString) {
        const [, month, day] = dateString.split(' ');
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = monthNames.indexOf(month);
        const currentYear = new Date().getFullYear(); // Assume current year

        return new Date(`${monthIndex + 1}/${day.replace(",", "")}/${currentYear}`);
    }

    // Check and mark past dates
    function markPastDates() {
        const now = new Date();
        document.querySelectorAll('.program').forEach((program) => {
            const dates = program.querySelectorAll('.remove-top-margin span');
            let hasFutureDates = false;

            dates.forEach((dateSpan) => {
                const dateText = dateSpan.textContent.trim();
                const parsedDate = parseDateString(dateText);

                if (parsedDate < now) {
                    dateSpan.closest('.remove-top-margin').classList.add('is_past_date');
                } else {
                    hasFutureDates = true;
                }
            });

            if (!hasFutureDates) {
                program.classList.remove('active');
            }
        });
    }

    // Function to reset active classes on all filter links and set the clicked one as active
    function setActiveCategory(filterLink) {
        document.querySelectorAll('.js-add-filter').forEach((el) => {
            el.classList.remove('active');
        });
        filterLink.classList.add('active');

        // Update the header text with the selected category
        const categoryName = filterLink.querySelector('span').textContent;
        document.querySelector('.program-group-header-text').textContent = categoryName;
    }

    // Function to show or hide program details
    function toggleProgramDetails(programDetailsOpenLink) {
        // Hide all other program details and remove focus class
        document.querySelectorAll('.program-more-details').forEach((details) => {
            details.style.display = 'none';
        });
        document.querySelectorAll('.program').forEach((program) => {
            program.classList.remove('focus');
        });

        // Show the clicked program's details and add focus class
        const programDetails = programDetailsOpenLink.closest('.program').querySelector('.program-more-details');
        programDetails.style.display = 'block';
        programDetailsOpenLink.closest('.program').classList.add('focus');
    }

    // Function to show or hide filter options
    function toggleFilterOptions(filterGroupHeader) {
        const options = filterGroupHeader.querySelector('.program-filter-options');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    }

    // Function to filter and display the programs list
    function filterPrograms() {
        const activeCategory = document.querySelector('.js-add-filter.active');
        const activeFilters = document.querySelectorAll('.program-filter-options input:checked');

        const activeCategoryValue = activeCategory ? activeCategory.dataset.filterValue : 'all';
        const filters = Array.from(activeFilters).map((filter) => filter.value);

        // Filter the programs based on selected category and filters
        document.querySelectorAll('.program').forEach((program) => {
            const programFilters = JSON.parse(program.dataset.filter.replace(/'/g, '"'));
            const programGroups = programFilters.program_group;
            const programAudiences = programFilters.program_audience;
            const matchesCategory = activeCategoryValue === 'all' || programGroups.includes(activeCategoryValue);
            const matchesAudience = filters.length === 0 || filters.some((filter) => programAudiences.includes(filter));

            if (matchesCategory && matchesAudience) {
                program.style.display = 'block';
            } else {
                program.style.display = 'none';
            }
        });

        // Show no programs message if no programs match the filter
        const anyVisible = Array.from(document.querySelectorAll('.program')).some((program) => program.style.display !== 'none');
        document.querySelector('.no-program-matches').style.display = anyVisible ? 'none' : 'block';

        updateActiveFilters();
    }

    // Function to update active filters display
    function updateActiveFilters() {
        const activeFiltersContainer = document.querySelector('.js-active-filters-list');
        activeFiltersContainer.innerHTML = '';

        const activeFilters = document.querySelectorAll('.program-filter-options input:checked');
        activeFilters.forEach((filter) => {
            const filterTag = document.createElement('span');
            filterTag.classList.add('filter-tag');
            filterTag.innerHTML = `
      ${filter.nextElementSibling.textContent.trim()}&nbsp;
      <span data-filter-value="${filter.value}" data-filter-name="${filter.dataset.filterName}" class="filter-tag-remove js-filter-tag-remove">x</span>`;
            activeFiltersContainer.appendChild(filterTag);
        });

        // Update the filter header text to show the number of active filters
        const activeFilterCount = activeFilters.length;
        const filterHeader = document.querySelector('.active-filters-display');
        filterHeader.textContent = activeFilterCount === 0 ? 'all' : `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`;
    }

    // Function to hide filter options when clicking outside
    function hideFilterOptionsOnClickOutside(event) {
        const filterGroups = document.querySelectorAll('.program-filter-group');
        filterGroups.forEach((filterGroup) => {
            const options = filterGroup.querySelector('.program-filter-options');
            if (!filterGroup.contains(event.target)) {
                options.style.display = 'none';
            }
        });
    }

    // Event listener for category filter click
    document.querySelectorAll('.js-add-filter').forEach((filterLink) => {
        filterLink.addEventListener('click', (event) => {
            event.preventDefault();
            setActiveCategory(filterLink);
            filterPrograms();
        });
    });

    // Event listener for toggling program details
    document.querySelectorAll('.program-more-details-open').forEach((programDetailsOpenLink) => {
        programDetailsOpenLink.addEventListener('click', (event) => {
            event.preventDefault();
            toggleProgramDetails(programDetailsOpenLink);
        });
    });

    // Event listener for toggling filter options
    document.querySelectorAll('.program-filter-group .fd-toggle').forEach((filterGroupHeader) => {
        filterGroupHeader.addEventListener('click', () => {
            toggleFilterOptions(filterGroupHeader.closest('.program-filter-group'));
        });
    });

    // Event listener for checking/unchecking filter options
    document.querySelectorAll('.program-filter-options input').forEach((filterCheckbox) => {
        filterCheckbox.addEventListener('change', () => {
            filterPrograms();
        });
    });

    // Event listener for removing active filters
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('js-filter-tag-remove')) {
            const filterValue = event.target.dataset.filterValue;
            const filterName = event.target.dataset.filterName;

            document.querySelector(`.program-filter-options input[data-filter-name="${filterName}"][value="${filterValue}"]`).checked = false;
            filterPrograms();
        }
    });

    // Event listener for clicking outside the filter options
    document.addEventListener('click', hideFilterOptionsOnClickOutside);

    // Run on page load
    markPastDates();

    // Set default active category
    const defaultCategory = document.querySelector('.js-add-filter[data-filter-value="all"]');
    setActiveCategory(defaultCategory);

    // Initial filter of programs to match the default category
    filterPrograms();
});