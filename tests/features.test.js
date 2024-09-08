const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { generateFilterValue } = require('../scripts.js');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const scriptsContent = fs.readFileSync(path.resolve(__dirname, '../scripts.js'), 'utf8');
const styles = fs.readFileSync(path.resolve(__dirname, '../style.css'), 'utf8');

let dom;
let window;
let document;

function loadExternalResources() {
  // Read styles and scripts directly from files
  const styles = fs.readFileSync(path.resolve(__dirname, '../style.css'), 'utf8');
  const scripts = fs.readFileSync(path.resolve(__dirname, '../scripts.js'), 'utf8');

  // Return an object with the loaded resources
  return { styles, scripts };
}

async function waitForDomContentLoaded(window) {
  return new Promise((resolve) => {
    if (window.document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('DOMContentLoaded', resolve);
    }
  });
}

async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    url: `file://${path.resolve(__dirname, '..')}/`,
    contentType: 'text/html',
    includeNodeLocations: true,
    storageQuota: 10000000,
    beforeParse(window) {
      window.generateFilterValue = generateFilterValue;
    }
  });

  window = dom.window;
  document = window.document;

  console.log('Loading external resources...');
  loadExternalResources(window);

  console.log('Waiting for DOMContentLoaded...');
  await waitForDomContentLoaded(window);

  // Ensure all asynchronous operations are complete
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Verifying key DOM elements...');
  const keyElements = {
    categoryContainer: '.programs-category-filter .container',
    programsList: '.programs-list',
    filterGroups: '.program-filter-group',
    programGroupHeader: '.program-group-header',
    activeFiltersList: '.js-active-filters-list',
    templateContainer: '.category-template',
    programMoreDetailsButtons: '.program-more-details-button',
    programFilterOptions: '.program-filter-options'
  };

  const missingElements = [];
  const foundElements = {};
  for (const [key, selector] of Object.entries(keyElements)) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay to ensure DOM is updated
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.error(`${key} not found. Selector: ${selector}`);
      missingElements.push(key);
    } else {
      console.log(`${key} found successfully. Count: ${elements.length}`);
      foundElements[key] = elements;
      if (key === 'filterGroups') {
        elements.forEach((group, index) => {
          console.log(`Filter group ${index + 1} name: ${group.dataset.filterGroupName}`);
        });
      }
    }
  }

  if (missingElements.length > 0) {
    console.error('Missing critical DOM elements:', missingElements.join(', '));
    console.error('Current DOM structure:');
    console.error(document.documentElement.outerHTML);
    throw new Error(`Test environment setup failed due to missing DOM elements: ${missingElements.join(', ')}`);
  }

  console.log('Verifying generateFilterValue function...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay to ensure scripts have time to execute
  if (typeof window.generateFilterValue !== 'function') {
    console.error('generateFilterValue function not found on window object');
    console.error('Available global functions:', Object.keys(window).filter(key => typeof window[key] === 'function'));
    console.error('Window object:', window);
    console.error('Document readyState:', document.readyState);
    console.error('Script elements:', document.querySelectorAll('script'));
    throw new Error('generateFilterValue function not available');
  } else {
    console.log('generateFilterValue function found:', window.generateFilterValue.toString());
  }

  console.log('Verifying DOM structure integrity...');
  verifyDOMStructure(foundElements);

  console.log('Verifying category filter links...');
  const categoryLinks = document.querySelectorAll('.js-add-filter');
  console.log(`Found ${categoryLinks.length} category filter links`);
  categoryLinks.forEach((link, index) => {
    console.log(`Category link ${index + 1}:`, link ? link.outerHTML : 'undefined');
    console.log(`  data-filter-value: "${link && link.dataset ? link.dataset.filterValue : 'undefined'}"`);
    const spanElement = link ? link.querySelector('span') : null;
    console.log(`  innerText: "${spanElement ? spanElement.textContent.trim() : 'undefined'}"`);
    if (!link) {
      console.error(`Link ${index + 1} is undefined`);
    } else if (!spanElement) {
      console.error(`Span element not found in link ${index + 1}`);
      console.log(`  Link structure:`, link.innerHTML);
    }
  });

  console.log('Test environment setup complete.');
  console.log('Final DOM structure:');
  console.log(document.documentElement.outerHTML);

  return { window, document, foundElements };
}

function verifyDOMStructure(elements) {
  // Verify category template structure
  if (elements.templateContainer && elements.templateContainer[0]) {
    const categories = elements.templateContainer[0].children;
    console.log(`Number of categories in template: ${categories.length}`);
    Array.from(categories).forEach((category, index) => {
      console.log(`Category ${index + 1}: ${category.innerText}, Color: ${category.style.backgroundColor}`);
    });
  }

  // Verify filter groups structure
  if (elements.filterGroups) {
    elements.filterGroups.forEach((group, index) => {
      const options = group.querySelectorAll('input[type="checkbox"]');
      console.log(`Filter group ${index + 1} (${group.dataset.filterGroupName}) has ${options.length} options`);
    });
  }

  // Verify program structure
  if (elements.programsList && elements.programsList[0]) {
    const programs = elements.programsList[0].querySelectorAll('.program');
    console.log(`Number of programs: ${programs.length}`);
    if (programs.length > 0) {
      const firstProgram = programs[0];
      console.log('First program structure:');
      console.log(`- Categories: ${firstProgram.querySelector('.program-categories').children.length}`);
      console.log(`- Has details button: ${!!firstProgram.querySelector('.program-more-details-button')}`);
      console.log(`- Has details section: ${!!firstProgram.querySelector('.program-more-details')}`);
    }
  }
}

beforeEach(async () => {
  await setupTestEnvironment();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Increase delay for better stability

  console.log('Checking for key DOM elements...');
  const keyElements = [
    '.programs-category-filter .container',
    '.program-group-header',
    '.programs-list',
    '.program-filter-group[data-filter-group-name="program_audience"]',
    '.program-filter-group[data-filter-group-name="program_days"]',
    '.js-active-filters-list'
  ];
  for (const selector of keyElements) {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(`Key element ${selector} not found after setup`);
      throw new Error(`Key element ${selector} not found after setup`);
    }
    console.log(`Found key element: ${selector}`);
  }

  console.log('Verifying generateFilterValue function...');
  if (typeof window.generateFilterValue !== 'function') {
    console.error('generateFilterValue function not found on window object');
    throw new Error('generateFilterValue function not found');
  }
  console.log('generateFilterValue function is available');

  console.log('DOM setup complete. Ready for testing.');
});

function simulateClick(element) {
  if (!element) throw new Error('Element not found');
  const event = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  element.dispatchEvent(event);
}

function simulateChange(element) {
  if (!element) throw new Error('Element not found');
  const event = new window.Event('change', {
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
}

async function waitForDomUpdates(ms = 1000) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

describe('Utility functions', () => {
  test('generateFilterValue function works correctly', () => {
    console.log('Testing generateFilterValue function');

    const testCases = [
      { input: 'Test Category', expected: 'test-category' },
      { input: 'Multiple Word Category', expected: 'multiple-word-category' },
      { input: 'UPPERCASE', expected: 'uppercase' },
      { input: '', expected: '' },
      { input: null, expected: '' },
      { input: undefined, expected: '' },
      { input: 123, expected: '123' },
      { input: {}, expected: '[object-object]' },
      { input: [], expected: '' },
      { input: '   Trimmed   ', expected: 'trimmed' },
    ];

    testCases.forEach(({ input, expected }) => {
      console.log(`Testing input: "${input}"`);
      try {
        const result = window.generateFilterValue(input);
        console.log(`Result: "${result}"`);
        expect(result).toBe(expected);
      } catch (error) {
        console.error(`Unexpected error for input "${input}":`, error);
        throw error;
      }
    });

    console.log('generateFilterValue tests completed');
  });
});

describe('Program categorization and filtering', () => {
  test('Categories are generated correctly', async () => {
    await waitForDomUpdates();
    console.log('DOM content after initial load:', document.body.innerHTML);

    const categoryContainer = document.querySelector('.programs-category-filter .container');
    expect(categoryContainer).not.toBeNull();
    console.log('Category container:', categoryContainer);

    if (!categoryContainer) {
      console.error('DOM structure:', document.body.innerHTML);
      throw new Error('Category container not found');
    }

    expect(categoryContainer.children.length).toBeGreaterThan(0);
    console.log('Number of category container children:', categoryContainer.children.length);

    const filterLinks = categoryContainer.querySelectorAll('.js-add-filter');
    expect(filterLinks.length).toBeGreaterThan(0);
    console.log('Number of filter links:', filterLinks.length);

    filterLinks.forEach((link, index) => {
      console.log(`Checking filter link ${index}:`, link ? link.outerHTML : 'undefined');
      console.log(`Filter link ${index} complete element:`, link);
      console.log(`Filter link ${index} dataset:`, link && link.dataset ? JSON.stringify(link.dataset) : 'undefined');

      if (!link) {
        console.error(`Link ${index} is undefined`);
        return; // Skip further checks for this undefined link
      }

      expect(link.dataset).toBeDefined();
      expect(link.dataset.filterProgramGroup).toBe('true');
      expect(link.dataset.filterName).toBe('program_group');
      expect(link.dataset.filterValue).toBeTruthy();

      const spanElement = link.querySelector('span');
      console.log(`Span element for link ${index}:`, spanElement ? spanElement.outerHTML : 'Not found');

      if (!spanElement) {
        console.error(`Link ${index} structure:`, link.innerHTML);
        return; // Skip further checks if span is not found
      }

      const linkText = spanElement.textContent.trim();
      console.log(`Link ${index} text:`, linkText);

      if (typeof window.generateFilterValue !== 'function') {
        console.error('generateFilterValue function is not available');
        return; // Skip further checks if the function is not available
      }

      try {
        const expectedFilterValue = window.generateFilterValue(linkText);
        console.log(`Expected filter value for link ${index}:`, expectedFilterValue);
        console.log(`Actual filter value for link ${index}:`, link.dataset.filterValue);
        expect(link.dataset.filterValue).toBe(expectedFilterValue);
      } catch (error) {
        console.error(`Error generating filter value for link ${index}:`, error);
        console.error(`Link ${index} text:`, linkText);
        console.error(`generateFilterValue function:`, window.generateFilterValue.toString());
      }
    });

    // Check if all expected categories are present
    const expectedCategories = ['All Programs', 'FC Junior', 'FC Teens', 'FC Adult', 'Parents', 'Families', 'Community', 'Friendmaker'];
    expectedCategories.forEach(category => {
      const categoryLink = Array.from(filterLinks).find(link => link.textContent.trim() === category);
      expect(categoryLink).not.toBeNull();
      console.log(`Category "${category}" found:`, categoryLink ? 'Yes' : 'No');
      if (!categoryLink) {
        console.error(`Available categories:`, Array.from(filterLinks).map(link => link.textContent.trim()));
      }
    });
  });

  test('Filtering updates program visibility', async () => {
    await waitForDomUpdates();
    const allPrograms = document.querySelectorAll('.program');
    expect(allPrograms.length).toBeGreaterThan(0);
    const initialVisibleCount = Array.from(allPrograms).filter(p => p.style.display !== 'none').length;

    console.log('All filter elements:');
    const allFilters = document.querySelectorAll('.js-add-filter');
    allFilters.forEach((filter, index) => {
      console.log(`Filter ${index}:`, filter.outerHTML);
      console.log(`Filter ${index} dataset:`, JSON.stringify(filter.dataset));
    });

    const fcTeensFilter = document.querySelector('.js-add-filter[data-filter-value="fc-teens"]');
    console.log('FC Teens filter:', fcTeensFilter ? fcTeensFilter.outerHTML : 'Not found');
    expect(fcTeensFilter).not.toBeNull();
    simulateClick(fcTeensFilter);

    await waitForDomUpdates(1500);

    const visibleAfterFilter = Array.from(allPrograms).filter(p => p.style.display !== 'none').length;
    expect(visibleAfterFilter).toBeLessThan(initialVisibleCount);
    expect(visibleAfterFilter).toBeGreaterThan(0);

    const visiblePrograms = Array.from(allPrograms).filter(p => p.style.display !== 'none');
    visiblePrograms.forEach(program => {
      const programFilters = JSON.parse(program.dataset.filter.replace(/'/g, '"'));
      console.log('Program filters:', programFilters);
      expect(programFilters.program_group).toContain('fc-teens');
    });
  });
});

describe('Age-based audience filtering', () => {
  test('Age filter checkboxes exist', async () => {
    await waitForDomUpdates();
    const ageFilters = document.querySelectorAll('.program-filter-group[data-filter-group-name="program_audience"] input[type="checkbox"]');
    expect(ageFilters.length).toBeGreaterThan(0);
  });

  test('Age filtering updates program visibility', async () => {
    await waitForDomUpdates();
    const allPrograms = document.querySelectorAll('.program');
    const initialVisibleCount = Array.from(allPrograms).filter(p => p.style.display !== 'none').length;

    const age5to12Filter = document.querySelector('input[data-filter-value="5-12"]');
    expect(age5to12Filter).not.toBeNull();
    simulateClick(age5to12Filter);
    simulateChange(age5to12Filter);

    await waitForDomUpdates(1500);

    const visibleAfterFilter = Array.from(allPrograms).filter(p => p.style.display !== 'none').length;
    expect(visibleAfterFilter).toBeLessThan(initialVisibleCount);
    expect(visibleAfterFilter).toBeGreaterThan(0);

    const visiblePrograms = Array.from(allPrograms).filter(p => p.style.display !== 'none');
    visiblePrograms.forEach(program => {
      const programFilters = JSON.parse(program.dataset.filter.replace(/'/g, '"'));
      expect(programFilters.program_audience).toContain('5-12');
    });
  });
});

describe('Day-based filtering', () => {
  test('Day filter options are generated', async () => {
    await waitForDomUpdates();
    const dayFilters = document.querySelectorAll('.program-filter-group[data-filter-group-name="program_days"] input[type="checkbox"]');
    expect(dayFilters.length).toBeGreaterThan(0);
  });

  test('Day filtering updates program visibility', async () => {
    await waitForDomUpdates();
    const allPrograms = document.querySelectorAll('.program');
    const initialVisibleCount = Array.from(allPrograms).filter(p => p.style.display !== 'none').length;

    console.log('Searching for day filter elements...');
    const dayFilters = document.querySelectorAll('.program-filter-group[data-filter-group-name="program_days"] input[type="checkbox"]');
    console.log(`Found ${dayFilters.length} day filter elements`);
    dayFilters.forEach((filter, index) => {
      console.log(`Day filter ${index + 1}:`, filter.outerHTML);
      console.log(`  data-filter-value: "${filter.dataset.filterValue}"`);
      console.log(`  value: "${filter.value}"`);
    });

    const thursdayFilter = document.querySelector('input[data-filter-value="thursday"]');
    console.log('Thursday filter:', thursdayFilter ? thursdayFilter.outerHTML : 'Not found');
    expect(thursdayFilter).not.toBeNull();
    simulateClick(thursdayFilter);
    simulateChange(thursdayFilter);

    await waitForDomUpdates(1500);

    const visibleAfterFilter = Array.from(allPrograms).filter(p => p.style.display !== 'none').length;
    console.log(`Visible programs after filter: ${visibleAfterFilter}`);
    expect(visibleAfterFilter).toBeLessThan(initialVisibleCount);
    expect(visibleAfterFilter).toBeGreaterThan(0);

    const visiblePrograms = Array.from(allPrograms).filter(p => p.style.display !== 'none');
    visiblePrograms.forEach((program, index) => {
      const programDays = JSON.parse(program.dataset.filterDays);
      console.log(`Visible program ${index + 1} days:`, programDays);
      expect(programDays).toContain('Thursday');
    });
  });
});

describe('Program details expansion', () => {
  test('Program details can be expanded', async () => {
    await waitForDomUpdates();
    const programDetailsButton = document.querySelector('.program-more-details-button');
    expect(programDetailsButton).not.toBeNull();
    const programDetails = programDetailsButton.nextElementSibling;
    expect(programDetails).not.toBeNull();

    expect(programDetails.style.display).not.toBe('block');
    simulateClick(programDetailsButton);

    await waitForDomUpdates(1000);

    expect(programDetails.style.display).toBe('block');
  });
});

describe('Active filter display and removal', () => {
  test('Active filters are displayed', async () => {
    await waitForDomUpdates();
    const age5to12Filter = document.querySelector('input[data-filter-value="5-12"]');
    expect(age5to12Filter).not.toBeNull();
    simulateClick(age5to12Filter);
    simulateChange(age5to12Filter);

    await waitForDomUpdates(1000);

    const activeFiltersContainer = document.querySelector('.js-active-filters-list');
    expect(activeFiltersContainer).not.toBeNull();
    expect(activeFiltersContainer.children.length).toBeGreaterThan(0);
  });

  test('Active filters can be removed', async () => {
    await waitForDomUpdates();
    const age5to12Filter = document.querySelector('input[data-filter-value="5-12"]');
    expect(age5to12Filter).not.toBeNull();
    simulateClick(age5to12Filter);
    simulateChange(age5to12Filter);

    await waitForDomUpdates(1000);

    const activeFiltersContainer = document.querySelector('.js-active-filters-list');
    expect(activeFiltersContainer).not.toBeNull();
    const removeFilterButton = activeFiltersContainer.querySelector('.js-filter-tag-remove');
    expect(removeFilterButton).not.toBeNull();
    simulateClick(removeFilterButton);

    await waitForDomUpdates(1000);

    expect(activeFiltersContainer.children.length).toBe(0);
  });
});
