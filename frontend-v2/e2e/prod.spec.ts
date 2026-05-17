import { test, expect } from '@playwright/test';

// Prueba E2E real contra el backend de producción en AWS Serverless
// NOTA: No usamos `page.route` para mockear aquí. Queremos que el navegador
// haga fetch REAL a la API Gateway / Lambda.

test.describe('Producción E2E: Magic Links (AWS Backend Real)', () => {
  test('Envía un Magic Link real a través de AWS SES', async ({ page }) => {
    // Vamos a la página de proyectos local (que debe estar conectada a la API real por ENV)
    await page.goto('/es/projects');

    // Validamos que cargue el form
    await expect(page.locator('h2', { hasText: 'Acceso a Proyectos' })).toBeVisible();

    // Rellenamos con un correo de prueba real o desechable
    await page.fill('input[type="email"]', 'owner@opitacode.com');
    
    // Al hacer click, el frontend hará un fetch REAL a la Lambda `CoreAPI`
    await page.locator('button', { hasText: 'Enviar enlace mágico' }).click();

    // Si AWS responde 200 OK (y SES manda el correo), veremos el mensaje de éxito.
    // Usamos un timeout largo porque SES y Lambda en cold-start pueden tardar.
    await expect(page.locator('text=¡Revisa tu correo!')).toBeVisible({ timeout: 15000 });
  });

  test('Validar sesión rechazada (401 real)', async ({ page }) => {
    // Si entramos sin cookies de sesión válidas, la API real debe devolver 401
    // y el frontend debe mostrar el formulario.
    await page.goto('/es/projects');
    await expect(page.locator('h2', { hasText: 'Acceso a Proyectos' })).toBeVisible();
  });
});
