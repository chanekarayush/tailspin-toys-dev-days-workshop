import { test, expect } from '@playwright/test';

test.describe('Game catalog filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('filters by multiple categories and publisher together', async ({ page }) => {
    const categoryFilters = page.getByTestId('game-filters').getByRole('checkbox');
    const publisherFilter = page.getByTestId('publisher-filter');

    await categoryFilters.nth(0).check();
    await categoryFilters.nth(1).check();
    await publisherFilter.selectOption({ label: 'CodeForge Studios' });

    await expect(page.getByTestId('filter-results-count')).toHaveText('Showing 3 games');
    await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(3);
    await expect(page.getByTestId('filtered-empty-state')).toBeHidden();
  });

  test('shows an accessible empty state and can clear filters', async ({ page }) => {
    const publisherFilter = page.getByTestId('publisher-filter');
    await publisherFilter.evaluate((select) => {
      (select as HTMLSelectElement).add(new Option('Unavailable publisher', 'unavailable'));
    });
    await publisherFilter.selectOption('unavailable');

    await expect(page.getByTestId('filtered-empty-state')).toBeVisible();
    await expect(page.getByTestId('filtered-empty-state')).toHaveRole('status');
    await expect(page.getByTestId('filter-results-count')).toHaveText('Showing 0 games');

    await page.getByTestId('clear-filters').click();
    await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(21);
    await expect(page.getByTestId('filter-results-count')).toHaveText('Showing 21 games');
  });
});
