
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
    });

    test('should allow user to generate and edit a BEP', async ({ page }) => {
        // Wait for page to load
        await expect(page.getByRole('heading', { name: 'BEP Asistanı' })).toBeVisible();

        // 1. Fill Observations
        await page.fill('textarea[id="observations-input"]', 'Ali harfleri tanıyor ama hecelemede zorlanıyor.');
        
        // 2. Fill Strengths
        await page.fill('textarea[id="strengths-input"]', 'Görsel hafızası iyi.');

        // 3. Generate
        await page.click('button:has-text("BEP Raporu Oluştur")');

        // 4. Verify Result
        await expect(page.getByText('Taslak Hazır')).toBeVisible({ timeout: 10000 });
        
        // Verify student name appears in an input/textarea
        const nameInput = page.locator('input').filter({ hasText: /Ali Yılmaz/ }).or(page.locator('input[value="Ali Yılmaz"]'));
        await expect(nameInput.first()).toBeVisible();

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
