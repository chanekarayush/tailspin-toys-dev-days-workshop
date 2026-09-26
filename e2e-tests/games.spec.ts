import { test, expect, type Response } from '@playwright/test';

test.describe('Game Listing and Navigation', () => {
  test('should display games with titles on index page', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify games grid is visible', async () => {
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Verify game cards are displayed', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first()).toBeVisible();
      expect(await gameCards.count()).toBeGreaterThan(0);
    });

    await test.step('Verify game cards have titles with content', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.first().getByTestId('game-title')).toBeVisible();
      await expect(gameCards.first().getByTestId('game-title')).not.toBeEmpty();
    });

    await test.step('Verify each game card has accessible illustrated cover art', async () => {
      const gameCards = page.getByTestId('game-card');
      await expect(gameCards.getByTestId('game-artwork')).toHaveCount(await gameCards.count());
      const firstCard = page.getByTestId('game-card').first();
      const title = await firstCard.getAttribute('data-game-title');
      const artwork = firstCard.getByRole('img', { name: `Illustration for ${title}` });
      await expect(artwork).toBeVisible();
      await expect.poll(() => artwork.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    });
  });

  test('should filter games by title and show a no-results state', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    const searchInput = page.getByTestId('game-search-input');
    await expect(searchInput).toHaveAccessibleName('Search games by title');

    await test.step('Filter games with a case-insensitive title search', async () => {
      await searchInput.fill('cOdE qUeSt');
      const visibleGameCards = page.locator('[data-testid="game-card"]:visible');
      await expect(visibleGameCards).toHaveCount(1);
      await expect(visibleGameCards.getByTestId('game-title')).toHaveText('Code Quest Odyssey');
      await expect(page.getByTestId('game-search-status')).toHaveText('1 game found');
    });

    await test.step('Show an empty state when no titles match', async () => {
      await searchInput.fill('does not exist');
      await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(0);
      await expect(page.getByTestId('game-search-no-results')).toBeVisible();
      await expect(page.getByTestId('empty-state-text')).toHaveText('No games match your search.');
      await expect(page.getByTestId('game-search-status')).toHaveText('0 games found');
    });
  });

  test('should navigate to correct game details page when clicking on a game', async ({ page }) => {
    let gameId: string | null;
    let gameTitle: string | null;

    await test.step('Navigate to homepage and wait for games to load', async () => {
      await page.goto('/');
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible();
    });

    await test.step('Get first game information and click it', async () => {
      const firstGameCard = page.getByTestId('game-card').first();
      gameId = await firstGameCard.getAttribute('data-game-id');
      gameTitle = await firstGameCard.getAttribute('data-game-title');
      await firstGameCard.click();
    });

    await test.step('Verify navigation to game details page', async () => {
      await expect(page).toHaveURL(`/game/${gameId}`);
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title matches clicked game', async () => {
      if (gameTitle) {
        await expect(page.getByTestId('game-details-title')).toHaveText(gameTitle);
      }
    });
  });

  test('should display game details with all required information', async ({ page }) => {
    await test.step('Navigate to specific game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title is displayed', async () => {
      const gameTitle = page.getByTestId('game-details-title');
      await expect(gameTitle).toBeVisible();
      await expect(gameTitle).not.toBeEmpty();
    });

    await test.step('Verify the game details page displays accessible cover art', async () => {
      const artwork = page.getByRole('img', { name: 'Illustration for DevOps Dominion' });
      await expect(artwork).toBeVisible();
      await expect.poll(() => artwork.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    });

    await test.step('Verify game description is displayed', async () => {
      const gameDescription = page.getByTestId('game-details-description');
      await expect(gameDescription).toBeVisible();
      await expect(gameDescription).not.toBeEmpty();
    });

    await test.step('Verify publisher or category information is present', async () => {
      const publisherExists = await page.getByTestId('game-details-publisher').isVisible();
      const categoryExists = await page.getByTestId('game-details-category').isVisible();
      expect(publisherExists || categoryExists).toBeTruthy();

      if (publisherExists) {
        await expect(page.getByTestId('game-details-publisher')).not.toBeEmpty();
      }

      if (categoryExists) {
        await expect(page.getByTestId('game-details-category')).not.toBeEmpty();
      }
    });

    await test.step('Verify category and publisher descriptions are displayed', async () => {
      await expect(page.getByTestId('game-details-category-description')).toContainText('About Strategy');
      await expect(page.getByTestId('game-details-category-description')).toContainText('Collection of Strategy');
      await expect(page.getByTestId('game-details-publisher-description')).toContainText('About CodeForge Studios');
      await expect(page.getByTestId('game-details-publisher-description')).toContainText('CodeForge Studios');
    });
  });

  test('should display a button to back the game', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify back game button is visible and enabled', async () => {
      const backButton = page.getByTestId('back-game-button');
      await expect(backButton).toBeVisible();
      await expect(backButton).toContainText('Support This Game');
      await expect(backButton).toBeEnabled();
    });
  });

  test('should be able to navigate back to home from game details', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Click back to all games link', async () => {
      const backLink = page.getByRole('link', { name: /back to all games/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
    });

    await test.step('Verify navigation back to homepage', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should navigate to a publisher page from game details', async ({ page }) => {
    await page.goto('/game/1');
    await page.getByTestId('game-details-publisher-link').click();
    await expect(page).toHaveURL(/\/publisher\/\d+/);
    await expect(page.getByTestId('publisher-details')).toBeVisible();
    await expect(page.getByTestId('publisher-description')).not.toBeEmpty();
    await expect(page.getByTestId('publisher-games-grid').getByTestId('game-card')).toHaveCount(6);
  });

  test('should return a 404 page for a non-existent game', async ({ page }) => {
    let response: Response | null;

    await test.step('Navigate to non-existent game', async () => {
      response = await page.goto('/game/99999');
    });

    await test.step('Verify a branded 404 page is served', async () => {
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle(/Page Not Found - Tailspin Toys/);
      await expect(page.getByTestId('not-found')).toBeVisible();
      await expect(page.getByTestId('not-found-heading')).not.toBeEmpty();
      await expect(page.getByTestId('not-found-home-link')).toBeVisible();
    });
  });
});
