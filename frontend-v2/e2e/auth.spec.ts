import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';

test.describe('Autenticación con Magic Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({ 
        status: 401, 
        headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' },
        body: JSON.stringify({ error: 'No session' }) 
      });
    });
    // Visitar la página de proyectos en español
    await page.goto('/es/projects');
  });

  test('Renderiza el formulario correctamente si no hay sesión', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'Acceso a Proyectos' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Enviar enlace mágico' })).toBeVisible();
  });

  test('Muestra un error cuando la API falla', async ({ page }) => {
    // Interceptar la petición al backend y forzar un error 500
    await page.route('**/auth/request', async (route: Route) => {
      await route.fulfill({
        status: 500,
        headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' },
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.fill('input[type="email"]', 'test@opitacode.com');
    await page.locator('button', { hasText: 'Enviar enlace mágico' }).click();

    // Validar el mensaje de error en la UI
    await expect(page.locator('text=Ocurrió un error')).toBeVisible();
  });

  test('Muestra mensaje de éxito cuando la API responde 200', async ({ page }) => {
    // Interceptar la petición al backend y responder éxito
    await page.route('**/auth/request', async (route: Route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' },
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Magic link sent' }),
      });
    });

    await page.fill('input[type="email"]', 'success@opitacode.com');
    await page.locator('button', { hasText: 'Enviar enlace mágico' }).click();

    // Validar el mensaje de éxito
    await expect(page.locator('text=¡Revisa tu correo!')).toBeVisible();
    // Validar que el input se vació
    await expect(page.locator('input[type="email"]')).toHaveValue('');
  });

  test('Muestra error si la redirección desde el backend incluye ?error=', async ({ page }) => {
    await page.goto('/es/projects?error=invalid_token');
    
    // Este requerimiento es para el Toast o Banner que agregaremos en index.astro
    await expect(page.locator('text=El enlace mágico es inválido o ha expirado')).toBeVisible();
  });
});
