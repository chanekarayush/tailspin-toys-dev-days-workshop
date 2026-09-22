import { expect, test } from '@playwright/test';

test.describe('Wishlist', () => {
  test('should save a supported game and offer a link to the wishlist', async ({ page }) => {
    await page.goto('/game/1');
    await page.evaluate(() => {
      window.localStorage.removeItem('tailspin-wishlist');
    });

    await page.getByTestId('back-game-button').click();

    await expect(page.getByTestId('back-game-button')).toBeDisabled();
    await expect(page.getByTestId('support-game-button-label')).toHaveText('Added to Wishlist');
    await expect(page.getByTestId('wishlist-toast')).toBeVisible();
    await expect(page.getByTestId('wishlist-toast-link')).toHaveAttribute('href', /wishlist/);
    const savedGames = await page.evaluate(() => JSON.parse(window.localStorage.getItem('tailspin-wishlist') ?? '[]'));
    expect(savedGames).toEqual([
      expect.objectContaining({ id: 1, title: 'DevOps Dominion' }),
    ]);

    await page.getByTestId('wishlist-toast-link').click();
    await expect(page).toHaveURL(/\/wishlist$/);
    await expect(page.getByTestId('wishlist-count')).toHaveText('1 game saved');
    await expect(page.getByTestId('wishlist-grid')).toContainText('DevOps Dominion');
  });

  test('should show the empty state and clear saved games from the wishlist page', async ({ page }) => {
    await page.goto('/wishlist');

    await expect(page.getByTestId('wishlist-empty')).toBeVisible();
    await expect(page.getByTestId('wishlist-count')).toHaveText(/0 games saved/i);

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'tailspin-wishlist',
        JSON.stringify([
          {
            id: 1,
            title: 'Nebula Heist',
            description: 'A cosmic caper in orbit.',
            starRating: 4.8,
            category: { id: 1, name: 'Strategy', description: 'Strategy' },
            publisher: { id: 1, name: 'Orbit Works', description: 'Publisher' },
          },
        ]),
      );
    });

    await page.reload();

    await expect(page.getByTestId('wishlist-empty')).toBeHidden();
    await expect(page.getByTestId('wishlist-grid')).toBeVisible();
    await expect(page.getByTestId('wishlist-count')).toContainText('1 game saved');

    await page.getByRole('button', { name: /clear all games/i }).click();
    await expect(page.getByTestId('wishlist-empty')).toBeVisible();
    await expect(page.getByTestId('wishlist-count')).toContainText('0 games saved');
  });
});
