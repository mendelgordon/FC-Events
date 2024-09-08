describe('FC-Events Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the main page successfully', () => {
    cy.get('.programs-category-filter').should('be.visible');
    cy.get('.programs-list').should('be.visible');
    cy.get('.program-filter-group').should('have.length.at.least', 2);
  });

  describe('Program categorization and filtering', () => {
    it('displays program categories', () => {
      cy.get('.programs-category-filter .js-add-filter').should('have.length.at.least', 5);
    });

    it('filters programs by category', () => {
      cy.get('.js-add-filter[data-filter-value="fc-teens"]').click();
      cy.get('.program:visible').should('have.length.at.least', 1);
      cy.get('.program:hidden').should('exist');
      cy.get('.program:visible').each(($program) => {
        cy.wrap($program).invoke('attr', 'data-filter').then((dataFilter) => {
          const filterData = JSON.parse(dataFilter);
          expect(filterData.program_group).to.include('fc-teens');
        });
      });
    });

    it('shows no results message for impossible filter combination', () => {
      cy.log('Starting impossible filter combination test');

      // Check initial state
      cy.log('Checking initial state');
      cy.get('.program').should('be.visible').then($programs => {
        cy.log(`Initial number of visible programs: ${$programs.length}`);
        expect($programs.length).to.be.greaterThan(0);
      });
      cy.get('.no-program-matches').should('not.be.visible');

      // Apply first filter (3-4)
      cy.log('Applying first filter (3-4)');
      cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();
      cy.get('input[data-filter-value="3-4"]').as('filter3-4').check();
      cy.get('@filter3-4').should('be.checked');
      cy.wait(500); // Wait for filter to apply

      cy.get('.program:visible').then($visiblePrograms => {
        cy.log(`Visible programs after first filter: ${$visiblePrograms.length}`);
        expect($visiblePrograms.length).to.be.greaterThan(0);
        $visiblePrograms.each((index, program) => {
          const dataFilter = JSON.parse(Cypress.$(program).attr('data-filter'));
          expect(dataFilter.program_audience).to.include('3-4');
          cy.log(`Program ${index + 1} data-filter:`, JSON.stringify(dataFilter));
        });
      });

      // Apply second filter (13-18)
      cy.log('Applying second filter (13-18)');
      cy.get('input[data-filter-value="13-18"]').as('filter13-18').check();
      cy.get('@filter13-18').should('be.checked');
      cy.wait(500); // Wait for filter to apply

      // Check final state
      cy.log('Checking final state');
      cy.get('.program:visible').should('have.length', 0);
      cy.get('.no-program-matches')
        .should('be.visible')
        .and('contain.text', 'Oops, there are no programs that match your selected category/filters.');

      // Log all programs and their data-filter attributes for debugging
      cy.log('Logging all programs data-filter attributes');
      cy.get('.program').each(($program, index) => {
        cy.wrap($program).invoke('attr', 'data-filter').then((dataFilter) => {
          cy.log(`Program ${index + 1} data-filter: ${dataFilter}`);
        });
        cy.wrap($program).invoke('css', 'display').then((display) => {
          cy.log(`Program ${index + 1} display: ${display}`);
        });
      });
    });
  });

  describe('Age-based audience filtering', () => {
    it('allows filtering by audience', () => {
      cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();
      cy.get('input[data-filter-value="5-12"]').check();
      cy.get('.program:visible').should('have.length.at.least', 1);
      cy.get('.program:visible').each(($program) => {
        cy.wrap($program).invoke('attr', 'data-filter').then((dataFilter) => {
          const filterData = JSON.parse(dataFilter);
          expect(filterData.program_audience).to.include('5-12');
        });
      });
      cy.get('.program:hidden').should('exist');
    });

    it('combines multiple audience filters', () => {
      cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();
      cy.get('input[data-filter-value="5-12"]').check();
      cy.get('input[data-filter-value="13-18"]').check();
      cy.get('.program:visible').should('have.length.at.least', 1);
      cy.get('.program:visible').each(($program) => {
        cy.wrap($program).invoke('attr', 'data-filter').then((dataFilter) => {
          const filterData = JSON.parse(dataFilter);
          expect(filterData.program_audience).to.satisfy((audience) =>
            audience.includes('5-12') || audience.includes('13-18')
          );
        });
      });
      cy.get('.program:hidden').should('exist');
    });
  });

  describe('Day-based filtering', () => {
    it('allows filtering by day', () => {
      cy.get('.program-filter-group[data-filter-group-name="program_days"]').click();
      cy.get('input[value="Thursday"]').check();
      cy.get('.program:visible').should('have.length.at.least', 1);
      cy.get('.program:visible').each(($program) => {
        cy.wrap($program).invoke('attr', 'data-filter-days').then((filterDays) => {
          const days = JSON.parse(filterDays);
          expect(days).to.include('Thursday');
        });
      });
      cy.get('.program:hidden').should('exist');
    });
  });

  describe('Program details expansion', () => {
    it('expands program details', () => {
      cy.get('.program-more-details-button').first().click();
      cy.get('.program-more-details').first().should('be.visible');
    });

    it('collapses previously expanded details when opening new ones', () => {
      cy.get('.program-more-details-button').first().click();
      cy.get('.program-more-details-button').eq(1).click();
      cy.get('.program-more-details').first().should('not.be.visible');
      cy.get('.program-more-details').eq(1).should('be.visible');
    });
  });

  describe('Active filter display and removal', () => {
    it('displays active filters', () => {
      cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();
      cy.get('input[data-filter-value="5-12"]').check();
      cy.get('.js-active-filters-list').should('contain', 'Ages 5-12');
    });

    it('removes active filters', () => {
      cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();
      cy.get('input[data-filter-value="5-12"]').check();
      cy.get('.js-filter-tag-remove').click();
      cy.get('.js-active-filters-list').should('be.empty');
    });
  });
});
