document.addEventListener('DOMContentLoaded', function () {
    const categoryContainer = document.querySelector('.programs-category-filter .container');
	const templateContainer = document.querySelector('.category-template');
	const categories = templateContainer.children;

	// Generate filters for .programs-category-filter
	for (let category of categories) {
		const filterLink = document.createElement('a');
		filterLink.className = 'js-add-filter';
		filterLink.dataset.filterProgramGroup = true;
		filterLink.dataset.filterName = category.dataset.filterName;
		filterLink.dataset.filterValue = category.dataset.filterValue;
		filterLink.href = '#';
		filterLink.style.backgroundColor = category.style.backgroundColor;

		const triangleContainer = document.createElement('div');
		triangleContainer.className = 'triangle-container';
		triangleContainer.innerHTML = '&nbsp;';

		const span = document.createElement('span');
		span.style.backgroundColor = category.style.backgroundColor;
		span.textContent = category.textContent;

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
		dropdownLink.className = 'js-add-filter';
		dropdownLink.dataset.filterProgramGroup = true;
		dropdownLink.dataset.filterName = category.dataset.filterName;
		dropdownLink.dataset.filterValue = category.dataset.filterValue;
		dropdownLink.href = `/programs/${category.dataset.filterValue === 'all' ? '' : category.dataset.filterValue}`;
		dropdownLink.style.backgroundColor = category.style.backgroundColor;

		const span = document.createElement('span');
		span.textContent = category.textContent;

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
				for (let category of categories) {
					if (category.dataset.filterValue === group) {
						const categoryDiv = document.createElement('div');
						categoryDiv.style.backgroundColor = category.style.backgroundColor;

						const span = document.createElement('span');
						span.textContent = category.textContent;

						categoryDiv.appendChild(span);
						categoriesDiv.appendChild(categoryDiv);
					}
				}
			});
		});
	}

	addProgramCategories();

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

    // Set default active category
    const defaultCategory = document.querySelector('.js-add-filter[data-filter-value="all"]');
    setActiveCategory(defaultCategory);

    // Initial filter of programs to match the default category
    filterPrograms();

    function createSVGElement(html) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }

    const svgs = [
        {
            selector: ".js-add-filter[data-filter-value='all'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#333"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#333"></rect></svg>'
        },
        {
            selector: ".js-add-filter[data-filter-value='jr'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#C0D32B"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#C0D32B"></rect></svg>'
        },
        {
            selector: ".js-add-filter[data-filter-value='teens'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#374e81"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#374e81"></rect></svg>'
        },
        {
            selector: ".js-add-filter[data-filter-value='fc-adult'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#705a5a"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#705a5a"></rect></svg>'
        },
        {
            selector: ".js-add-filter[data-filter-value='parents'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#8c2a90"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#8c2a90"></rect></svg>'
        },
        {
            selector: ".js-add-filter[data-filter-value='families'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#fbb03f"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#fbb03f"></rect></svg>'
        },
        {
            selector: ".js-add-filter[data-filter-value='community'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#f0523e"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#f0523e"></rect></svg>'
        },
        {
            selector: ".js-add-filter[data-filter-value='friendmaker'] .triangle-container",
            html: '<svg height="50px" width="100%" viewBox="0 0 20 20" preserveAspectRatio="none"><polygon points="10 20, 0 0, 20 0" class="triangle" fill="#54a8a9"></polygon><rect x="0" y="0" width="20" height="1" class="square" fill="#54a8a9"></rect></svg>'
        }
    ];

    svgs.forEach(({ selector, html }) => {
        const container = document.querySelector(selector);
        if (container) {
            container.appendChild(createSVGElement(html));
        }
    });
});