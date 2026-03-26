
import { test, expect } from '@playwright/test';

test.describe('BEP Generation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock the BEP generation API
        await page.route('**/api/ai/generate-bep', async route => {
            const json = {
                studentName: "Ali Yılmaz",
                bepDate: "20.01.2026",
                performanceLevel: "Öğrenci harfleri tanıyor.",
                longTermGoals: ["Okuma yazma öğrenir"],
                shortTermGoals: ["Harfleri birleştirir"],
                teachingMethods: ["Doğrudan Öğretim"],
                materials: ["Okuma fişleri"],
                evaluationMethods: ["Gözlem"],
                recommendations: ["Evde tekrar yapılsın"]
            };
            await route.fulfill({ json });
        });

        // Use a relative path as configured in playwright
        await page.goto('/dashboard/bep-ai');

        // CRITICAL: Wait for React hydration to complete before interacting.
        // Without this, Playwright types into server-rendered HTML before React
        // attaches event handlers, causing state to never update.
        await expect(page.getByTestId('bep-generator-root')).toHaveAttribute('data-hydrated', 'true', { timeout: 15000 });
    });

    test('should allow user to generate and edit a BEP', async ({ page }) => {
        // Wait for page to load
        await expect(page.getByRole('heading', { name: 'BEP Asistanı' })).toBeVisible();

        // 1. Fill Observations
        const obsTextarea = page.getByTestId('observations-input');
        await obsTextarea.scrollIntoViewIfNeeded();
        await obsTextarea.click();
        await obsTextarea.fill('Ali harfleri tanıyor ama hecelemede zorlanıyor.');
        await expect(obsTextarea).toHaveValue('Ali harfleri tanıyor ama hecelemede zorlanıyor.');
        
        // 2. Fill Strengths
        const strengthsTextarea = page.locator('textarea[id="strengths-input"]');
        await strengthsTextarea.scrollIntoViewIfNeeded();
        await strengthsTextarea.fill('Görsel hafızası iyi.');
        await expect(strengthsTextarea).toHaveValue('Görsel hafızası iyi.');

        // 3. Generate
        const generateButton = page.getByTestId('generate-bep-button');
        
        // Wait for the button to enable. React state might lag slightly behind DOM updates.
        await expect(generateButton).toBeEnabled({ timeout: 15000 });
        await generateButton.click();

        // 4. Verify Result
        await expect(page.getByText('Taslak Hazır')).toBeVisible({ timeout: 10000 });
        
        // Verify student name appears in an input/textarea
        // Using a more robust selector for the student name field
        await expect(page.locator('input[value="Ali Yılmaz"]')).toBeVisible({ timeout: 10000 });

        // 5. Edit a goal
        // In our component, list items are textareas
        const goalTextarea = page.locator('textarea').filter({ hasText: "Harfleri birleştirir" });
        await expect(goalTextarea).toBeVisible();
        await goalTextarea.fill('Harfleri hecelere böler');

        // 6. Save
        // Handle alert dialog
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('başarıyla kaydedildi');
            await dialog.accept();
        });

        await page.click('button:has-text("Kaydet")');
    });
});
