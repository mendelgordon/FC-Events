// DOM Elements
const programsList = document.querySelector('.js-programs-filter-result');
const filterButtons = document.querySelectorAll('.js-add-filter');
const checkboxFilters = document.querySelectorAll('.js-add-remove-filter');
const activeFiltersList = document.querySelector('.js-active-filters-list');
const noProgramsMessage = document.querySelector('.js-no-programs-message');
const programGroupHeader = document.querySelector('.js-program-group-header');

// State
let activeFilters = {
    program_group: 'all',
    program_audience: []
};

// Event Listeners
filterButtons.forEach(button => {
    button.addEventListener('click', handleFilterButtonClick);
});

checkboxFilters.forEach(checkbox => {
    checkbox.addEventListener('change', handleCheckboxFilterChange);
});

document.querySelectorAll('.program-more-details-button').forEach(button => {
    button.addEventListener('click', toggleProgramDetails);
});

// Filter Functions
function handleFilterButtonClick(event) {
    event.preventDefault();
    const filterName = event.currentTarget.dataset.filterName;
    const filterValue = event.currentTarget.dataset.filterValue;

    activeFilters[filterName] = filterValue;
    updateActiveFilters();
    applyFilters();
    updateProgramGroupHeader(filterValue);
}

function handleCheckboxFilterChange(event) {
    const filterName = event.target.dataset.filterName;
    const filterValue = event.target.dataset.filterValue;

    if (event.target.checked) {
        activeFilters[filterName].push(filterValue);
    } else {
        activeFilters[filterName] = activeFilters[filterName].filter(value => value !== filterValue);
    }

    updateActiveFilters();
    applyFilters();
}

function applyFilters() {
    const programs = programsList.querySelectorAll('.program');
    let visiblePrograms = 0;

    programs.forEach(program => {
        const programData = JSON.parse(program.dataset.filter);
        const isVisible = (
            (activeFilters.program_group === 'all' || programData.program_group.includes(activeFilters.program_group)) &&
            (activeFilters.program_audience.length === 0 || activeFilters.program_audience.some(audience => programData.program_audience.includes(audience)))
        );

        program.classList.toggle('active', isVisible);
        if (isVisible) visiblePrograms++;
    });

    noProgramsMessage.classList.toggle('show', visiblePrograms === 0);
}

function updateActiveFilters() {
    activeFiltersList.innerHTML = '';

    Object.entries(activeFilters).forEach(([filterName, filterValue]) => {
        if (Array.isArray(filterValue)) {
            filterValue.forEach(value => {
                addActiveFilterTag(filterName, value);
            });
        } else if (filterValue !== 'all') {
            addActiveFilterTag(filterName, filterValue);
        }
    });
}

function addActiveFilterTag(filterName, filterValue) {
    const tag = document.createElement('span');
    tag.classList.add('filter-tag');
    tag.innerHTML = `${filterValue} <span class="filter-tag-remove" data-filter-name="${filterName}" data-filter-value="${filterValue}">×</span>`;
    activeFiltersList.appendChild(tag);

    tag.querySelector('.filter-tag-remove').addEventListener('click', removeActiveFilter);
}

function removeActiveFilter(event) {
    const filterName = event.target.dataset.filterName;
    const filterValue = event.target.dataset.filterValue;

    if (Array.isArray(activeFilters[filterName])) {
        activeFilters[filterName] = activeFilters[filterName].filter(value => value !== filterValue);
    } else {
        activeFilters[filterName] = 'all';
    }

    updateActiveFilters();
    applyFilters();
    updateProgramGroupHeader('all');
}

function updateProgramGroupHeader(groupName) {
    const groupNames = {
        all: 'All Programs',
        jr: 'FC Junior',
        teens: 'FC Teens',
        adult: 'FC Adult',
        parents: 'Parents',
        families: 'Families',
        community: 'Community',
        friendmaker: 'Friendmaker'
    };

    programGroupHeader.textContent = groupNames[groupName] || 'All Programs';
}

function toggleProgramDetails(event) {
    event.preventDefault();
    const program = event.target.closest('.program');
    program.classList.toggle('focus');
    const detailsSection = program.querySelector('.program-more-details');
    detailsSection.style.display = program.classList.contains('focus') ? 'block' : 'none';
}

// Initialize
updateActiveFilters();
applyFilters();
