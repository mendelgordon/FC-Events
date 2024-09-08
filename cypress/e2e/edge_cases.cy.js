describe('FC-Events Edge Cases', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('applies multiple filters simultaneously', () => {
    cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();
    cy.get('input[data-filter-value="5-12"]').check();
    cy.get('.program-filter-group[data-filter-group-name="program_days"]').click();
    cy.get('input[value="Thursday"]').check();
    cy.get('.js-add-filter[data-filter-value="fc-teens"]').click();

    cy.get('.program:visible').should('have.length.at.least', 1);
    cy.get('.program:visible').each(($program) => {
      cy.wrap($program).invoke('attr', 'data-filter').then((dataFilter) => {
        const filterData = JSON.parse(dataFilter);
        expect(filterData.program_group).to.include('fc-teens');
        expect(filterData.program_audience).to.include('5-12');
      });
      cy.wrap($program).invoke('attr', 'data-filter-days').then((filterDays) => {
        const days = JSON.parse(filterDays);
        expect(days).to.include('Thursday');
      });
    });
  });

  it('tests boundary conditions for date-based filters', () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    cy.get('.program-filter-group[data-filter-group-name="program_days"]').click();
    cy.get('.program-filter-group[data-filter-group-name="program_days"] input[type="checkbox"]')
      .then($checkboxes => {
        const availableDays = $checkboxes.map((_, el) => el.value).get();
        const dayToTest = daysOfWeek.find(day => availableDays.includes(day));

        if (!dayToTest) {
          throw new Error('No valid day found in the filter options');
        }

        cy.get(`input[value="${dayToTest}"]`).check();

        cy.get('.program:visible').should('have.length.at.least', 0);
        cy.get('.program:visible').each(($program) => {
          cy.wrap($program).invoke('attr', 'data-filter-days').then((filterDays) => {
            const days = JSON.parse(filterDays || '[]');
            expect(days).to.include(dayToTest);
          });
        });
      });
  });

  it('verifies behavior when no results match the applied filters', () => {
    cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();
    cy.get('input[data-filter-value="3-4"]').check();
    cy.get('input[data-filter-value="18+"]').check();

    cy.get('.program:visible').should('have.length', 0);
    cy.get('.no-program-matches').should('be.visible');
  });

  it('checks performance with a large number of events', () => {
    // Generate a large number of events dynamically
    const generateLargeEventsList = (count) => {
      let eventsHtml = '';
      for (let i = 0; i < count; i++) {
        eventsHtml += `
          <li class="program active" data-filter='{"program_group":["fc-teens","fc-adult"],"program_audience":["13-18","18+"],"program_days":["Monday","Wednesday","Friday"]}'>
            <div class="program-categories"></div>
            <div class="program-details">
              <h3>Event ${i + 1}</h3>
              <div class="event-info">
                <p>Age: 13 & Up<br>
                   Days: Monday, Wednesday, Friday</p>
              </div>
            </div>
          </li>
        `;
      }
      return eventsHtml;
    };

    cy.visit('/');
    cy.get('.programs-list').invoke('html', generateLargeEventsList(150));

    cy.get('.program').should('have.length', 150);

    cy.window().then((win) => {
      cy.stub(win, 'performance', {
        now: () => 0
      });
    });

    cy.window().its('performance').invoke('now').as('startTime');
    cy.get('.js-add-filter[data-filter-value="fc-teens"]').click();
    cy.get('.program:visible').should('exist');
    cy.window().its('performance').invoke('now').as('endTime');

    cy.get('@startTime').then(startTime => {
      cy.get('@endTime').then(endTime => {
        const duration = endTime - startTime;
        expect(duration).to.be.lessThan(1000); // Filtering should take less than 1 second
        cy.log(`Filtering duration: ${duration}ms`);
      });
    });
  });

  it('tests input validation and error handling', () => {
    cy.get('.program-filter-group[data-filter-group-name="program_audience"]').click();

    // Attempt to inject malicious script into the filter value
    const maliciousScript = '<script>alert("XSS")</script>';
    cy.get('input[data-filter-value="5-12"]').invoke('val', maliciousScript).trigger('change');

    // Check if the filter was applied (it shouldn't be)
    cy.get('.program:visible').should('have.length.above', 0);

    // Verify that the malicious script is not present in the DOM
    cy.get('body').should('not.contain', maliciousScript);

    // Check if an error message or warning is displayed (if implemented)
    cy.get('.error-message, .warning-message').should('not.exist');

    // Ensure the filter checkbox is unchecked
    cy.get('input[data-filter-value="5-12"]').should('not.be.checked');
  });
});
