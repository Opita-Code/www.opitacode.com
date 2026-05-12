import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';

test.describe('Dashboard de Proyectos', () => {
  test('Redirige o muestra form si no hay sesión (Testado en auth.spec.ts pero validado aquí)', async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({ status: 401, headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify({ error: 'No session' }) });
    });
    await page.goto('/es/projects');
    await expect(page.locator('h2', { hasText: 'Acceso a Proyectos' })).toBeVisible();
  });

  test('Renderiza el dashboard correctamente cuando hay sesión y no hay proyectos', async ({ page }) => {
    // Mock /auth/me
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({ 
        status: 200, 
        headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' }, 
        body: JSON.stringify({ user: { email: 'client@opitacode.com', role: 'authenticated' } }) 
      });
    });

    // Mock /projects (Vacío)
    await page.route('**/api.opitacode.com/projects', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          status: 200, 
          headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' }, 
          body: JSON.stringify([]) 
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/es/projects');

    // Validar cabecera y email
    await expect(page.locator('h1', { hasText: 'Mis Proyectos' })).toBeVisible();
    await expect(page.locator('text=client@opitacode.com')).toBeVisible();

    // Validar Empty State
    await expect(page.locator('text=Aún no tienes proyectos.')).toBeVisible();
  });

  test('Renderiza proyectos y permite crear una nueva propuesta', async ({ page }) => {
    // Mock /auth/me
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({ 
        status: 200, 
        headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' }, 
        body: JSON.stringify({ user: { email: 'client@opitacode.com', role: 'authenticated' } }) 
      });
    });

    // Mock /projects (Con 1 proyecto)
    await page.route('**/api.opitacode.com/projects', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          status: 200, 
          headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' }, 
          body: JSON.stringify([
            { id: '1', title: 'Landing Page Vibe', description: 'Rediseño', status: 'PENDING', budget: 1500 }
          ]) 
        });
      } else if (route.request().method() === 'POST') {
        // Mock creación de proyecto
        await route.fulfill({ 
          status: 201, 
          headers: { 'Access-Control-Allow-Origin': 'http://localhost:4321', 'Access-Control-Allow-Credentials': 'true' }, 
          body: JSON.stringify([
            { id: '2', title: 'Nuevo Proyecto', description: 'Test e2e', status: 'PENDING', budget: 0 }
          ]) 
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/es/projects');

    // Validar que el proyecto mockeado se muestra
    await expect(page.locator('h3', { hasText: 'Landing Page Vibe' })).toBeVisible();
    await expect(page.locator('text=$1500')).toBeVisible();

    // Crear nueva propuesta
    await page.locator('button', { hasText: 'Nueva Propuesta' }).click();
    await page.fill('input[name="title"]', 'Nuevo Proyecto');
    await page.fill('textarea[name="description"]', 'Test e2e');
    await page.locator('button', { hasText: 'Enviar Propuesta' }).click();

    // Validar que el nuevo proyecto se renderizó (optimistic update o respuesta de la API)
    await expect(page.locator('h3', { hasText: 'Nuevo Proyecto' })).toBeVisible();
  });
});
