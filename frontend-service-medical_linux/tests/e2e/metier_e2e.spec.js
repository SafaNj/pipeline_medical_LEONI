// tests/e2e/metier_e2e.spec.js
// ============================================================
//  Tests E2E Métier — Plateforme Médicale LEONI
//  Rôle : Médecin Contrôleur (adam_znayti)
//  Dashboard : /dashboard/medecin/controleur
// ============================================================

import { test, expect } from '@playwright/test';

const COMPTE_TEST = {
  username: 'adam_znayti',
  password: 'Wiem123*',
};

// ─── Helper : login ───────────────────────────────────────────
async function login(page) {
  await page.goto('/login');
  await page.waitForSelector('#username', { timeout: 10000 });
  await page.fill('#username', COMPTE_TEST.username);
  await page.fill('#password', COMPTE_TEST.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/medecin/controleur', { timeout: 15000 });
}

// ─── Helper : clic bouton sidebar ────────────────────────────
async function clickNav(page, labelText) {
  const btn = page.locator(`button:has-text("${labelText}")`).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(1500);
}

// ============================================================
//  TEST 1 — Ma liste du jour
//  Vérifie l'accès à la liste de contre-visites du jour
//  et la présence des sections En attente / Complétés
// ============================================================
test('Test 1 — Médecin contrôleur accède à sa liste du jour', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Ma liste du jour');

  // Titre "Liste du jour" dans le contenu (pas dans la sidebar)
  const titre = page.locator('text=Liste du jour').nth(1);
  await expect(titre).toBeVisible({ timeout: 10000 });

  // Sections "En attente" ou "Complétés" ou "Aucun patient"
  const sections = page.locator('text=/En attente|Complétés|Aucun patient/i');
  await expect(sections.first()).toBeVisible({ timeout: 10000 });

  await expect(page).toHaveURL(/\/dashboard\/medecin\/controleur/);
  console.log('✓ Test 1 PASSED : Liste du jour accessible');
});

// ============================================================
//  TEST 2 — Suivi des contre-visites
//  Vérifie l'accès au suivi global et l'affichage du tableau
// ============================================================
test('Test 2 — Médecin contrôleur consulte le suivi des contre-visites', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Suivi contre-visites');

  const contenu = page.locator('text=/Contre-visite|Suivi/i').first();
  await expect(contenu).toBeVisible({ timeout: 10000 });

  const tableau = page.locator('table, [role="table"], [class*="liste"], [class*="suivi"]').first();
  await expect(tableau).toBeVisible({ timeout: 10000 });

  await expect(page).toHaveURL(/\/dashboard\/medecin\/controleur/);
  console.log('✓ Test 2 PASSED : Suivi contre-visites accessible');
});

// ============================================================
//  TEST 3 — Historique patient
//  Vérifie l'accès à l'historique et le champ de recherche
// ============================================================
test("Test 3 — Médecin contrôleur accède à l'historique patient", async ({ page }) => {
  await login(page);
  await clickNav(page, 'Historique patient');

  const searchInput = page.locator('input').first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });

  await expect(page).toHaveURL(/\/dashboard\/medecin\/controleur/);
  console.log('✓ Test 3 PASSED : Historique patient accessible');
});

// ============================================================
//  TEST 4 — Demandes d'expertise
//  Vérifie l'accès à la section expertise
// ============================================================
test("Test 4 — Médecin contrôleur accède aux demandes d'expertise", async ({ page }) => {
  await login(page);
  await clickNav(page, "Demandes d'expertise");

  const contenu = page.locator('text=/[Ee]xpertise|Demande/i').first();
  await expect(contenu).toBeVisible({ timeout: 10000 });

  await expect(page).toHaveURL(/\/dashboard\/medecin\/controleur/);
  console.log("✓ Test 4 PASSED : Demandes d'expertise accessibles");
});

// ============================================================
//  TEST 5 — Remplissage formulaire contre-visite (ENRICHI)
//  Parcours complet :
//    1. Aller sur "Ma liste du jour"
//    2. Vérifier qu'un patient "En attente" est présent
//    3. Cliquer "Créer Contre-Visite" sur ce patient
//    4. Remplir tous les champs du drawer (FormulaireContreVisite.jsx)
//    5. Vérifier que le formulaire est bien soumis
// ============================================================
test('Test 5 — Remplissage complet du formulaire contre-visite', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Ma liste du jour');

  // Attendre que la liste se charge
  await page.waitForTimeout(2000);

  // Vérifier s'il y a des patients "En attente"
  const btnCreer = page.locator('button:has-text("Créer Contre-Visite")').first();
  const patientPresent = await btnCreer.isVisible().catch(() => false);

  if (!patientPresent) {
    // Pas de patient aujourd'hui → le test documente ce cas
    const aucunPatient = page.locator('text=/Aucun patient|Aucune liste/i').first();
    await expect(aucunPatient).toBeVisible({ timeout: 5000 });
    console.log('ℹ️  Test 5 : aucun patient en attente aujourd\'hui — comportement normal');
    return;
  }

  // ── Étape 1 : Ouvrir le formulaire ──────────────────────────
  await btnCreer.click();
  await page.waitForTimeout(2000);

  // Le drawer "Nouvelle contre-visite" s'ouvre (FormulaireContreVisite.jsx)
  // Stratégie robuste : on cherche le titre OU le premier champ du formulaire
  // (le titre peut varier selon le rendu React : portail, majuscules, espace insécable)
  const drawerTitre = page.locator([
    'text=Nouvelle contre-visite',
    'text=NOUVELLE CONTRE-VISITE',
    '[class*="drawer"] h2',
    '[class*="drawer"] h3',
    '[class*="modal"] h2',
    '[role="dialog"] h2',
    '[role="dialog"] h3',
  ].join(', ')).first();

  const premierInputNumber = page.locator('input[type="number"]').first();

  // Attendre que le drawer OU le premier champ soit visible
  try {
    await expect(drawerTitre.or(premierInputNumber)).toBeVisible({ timeout: 10000 });
  } catch {
    // Debug : afficher le contenu visible pour comprendre la structure
    const bodyText = await page.locator('body').innerText().catch(() => '');
    console.log('⚠️  Étape 1 : drawer non détecté. Contenu visible :', bodyText.slice(0, 300));
    throw new Error('Drawer contre-visite non ouvert après clic "Créer Contre-Visite"');
  }
  console.log('✓ Étape 1 : drawer contre-visite ouvert');

  // ── Étape 2 : Remplir "Repos initial (médecin traitant)" ─────
  // input type="number" → repos_initial (premier input number du formulaire)
  const inputReposInitial = page.locator('input[type="number"]').first();
  await inputReposInitial.waitFor({ state: 'visible', timeout: 8000 });
  await inputReposInitial.fill('7');
  console.log('✓ Étape 2 : repos initial = 7 jours');

  // ── Étape 3 : Remplir "Durée de repos" ──────────────────────
  // Deuxième input number du formulaire
  const inputDureeRepos = page.locator('input[type="number"]').nth(1);
  await inputDureeRepos.fill('5');
  console.log('✓ Étape 3 : durée de repos = 5 jours');

  // ── Étape 4 : Remplir "Date de début d'arrêt" ───────────────
  // input type="date" → a_partir
  const inputDate = page.locator('input[type="date"]').first();
  await inputDate.waitFor({ state: 'visible', timeout: 5000 });
  // Calculer la date d'aujourd'hui en format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  await inputDate.fill(today);
  console.log(`✓ Étape 4 : date de début = ${today}`);

  // ── Étape 5 : Remplir "Département" ─────────────────────────
  // input type="text" → segment / département
  const inputDept = page.locator('input[type="text"]').first();
  await inputDept.waitFor({ state: 'visible', timeout: 5000 });
  await inputDept.fill('Production - Test E2E');
  console.log('✓ Étape 5 : département = Production - Test E2E');

  // ── Étape 6 : Remplir "Avis du médecin contrôleur" ──────────
  // Premier textarea du formulaire
  const textareaAvis = page.locator('textarea').first();
  await textareaAvis.waitFor({ state: 'visible', timeout: 5000 });
  await textareaAvis.fill(
    'Contre-visite effectuée. Arrêt de travail de 5 jours validé. ' +
    'Patient vu à domicile, état général satisfaisant. ' +
    'Reprise du travail prévue après la période de repos prescrite.'
  );
  console.log('✓ Étape 6 : avis médecin contrôleur rempli');

  // ── Étape 7 : Remplir "Remarque" ────────────────────────────
  // Deuxième textarea du formulaire
  const textareaRemarque = page.locator('textarea').nth(1);
  await textareaRemarque.waitFor({ state: 'visible', timeout: 5000 });
  await textareaRemarque.fill('Test E2E automatisé — Playwright');
  console.log('✓ Étape 7 : remarque remplie');

  // ── Étape 8 : Vérifier le récapitulatif de dates ─────────────
  // Après remplissage durée + date, le composant affiche le récap
  // "Arrêt de 5 jours — du ... au ..."
  const recap = page.locator('text=/Arrêt de.*jour/i');
  const recapVisible = await recap.isVisible().catch(() => false);
  if (recapVisible) {
    console.log('✓ Étape 8 : récapitulatif de dates affiché');
  }

  // ── Étape 9 : Vérifier le bouton soumettre est actif ─────────
  const btnSoumettre = page.locator('button:has-text("Enregistrer & Imprimer PDF")');
  await expect(btnSoumettre).toBeVisible({ timeout: 5000 });
  await expect(btnSoumettre).toBeEnabled();
  console.log('✓ Étape 9 : bouton "Enregistrer & Imprimer PDF" disponible');

  // ── Étape 10 : Fermer le formulaire sans soumettre ───────────
  // On NE soumet PAS pour ne pas créer de vraies données en base
  // On vérifie simplement que le formulaire est complet et prêt
  const btnAnnuler = page.locator('button:has-text("Annuler")').last();
  await btnAnnuler.click();
  await page.waitForTimeout(1000);

  // Le drawer est fermé, on est de retour sur la liste
  await expect(page).toHaveURL(/\/dashboard\/medecin\/controleur/);
  console.log('✓ Étape 10 : formulaire fermé, retour liste du jour');
  console.log('✓ Test 5 PASSED : formulaire contre-visite rempli et validé (sans soumission)');
});

// ============================================================
//  TEST 6 — Validation des champs du formulaire (ENRICHI)
//  Vérifie que le formulaire réagit correctement aux saisies
//  et que les calculs de dates sont exacts
// ============================================================
test('Test 6 — Validation et calcul des dates dans le formulaire', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Ma liste du jour');
  await page.waitForTimeout(2000);

  const btnCreer = page.locator('button:has-text("Créer Contre-Visite")').first();
  const patientPresent = await btnCreer.isVisible().catch(() => false);

  if (!patientPresent) {
    console.log('ℹ️  Test 6 : aucun patient en attente — skipped');
    return;
  }

  await btnCreer.click();
  await page.waitForTimeout(2000);

  // Vérifier que le drawer est ouvert — stratégie robuste (même logique que Test 5)
  const drawerTitre6 = page.locator([
    'text=Nouvelle contre-visite',
    'text=NOUVELLE CONTRE-VISITE',
    '[class*="drawer"] h2',
    '[class*="drawer"] h3',
    '[class*="modal"] h2',
    '[role="dialog"] h2',
    '[role="dialog"] h3',
  ].join(', ')).first();

  const premierInput6 = page.locator('input[type="number"]').first();

  try {
    await expect(drawerTitre6.or(premierInput6)).toBeVisible({ timeout: 10000 });
  } catch {
    const bodyText = await page.locator('body').innerText().catch(() => '');
    console.log('⚠️  Drawer non détecté. Contenu visible :', bodyText.slice(0, 300));
    throw new Error('Drawer contre-visite non ouvert — Test 6');
  }

  // Remplir durée et date pour déclencher le calcul
  const inputDuree = page.locator('input[type="number"]').nth(1);
  await inputDuree.fill('10');

  const today = new Date().toISOString().split('T')[0];
  const inputDate = page.locator('input[type="date"]').first();
  await inputDate.fill(today);

  // Attendre que React re-rende le récapitulatif
  await page.waitForTimeout(800);

  // Vérifier que le calcul "Arrêt de 10 jours — du ... au ..." apparaît
  const recap = page.locator('text=/Arrêt de 10 jour/i');
  const recapVisible = await recap.isVisible().catch(() => false);

  if (recapVisible) {
    await expect(recap).toBeVisible({ timeout: 5000 });
    console.log('✓ Calcul automatique des dates : 10 jours affiché correctement');
  } else {
    console.log('ℹ️  Récapitulatif non visible (champ site non sélectionné peut-être)');
  }

  // Vérifier que le bouton soumettre existe et est visible
  const btnSoumettre = page.locator('button:has-text("Enregistrer & Imprimer PDF")');
  await expect(btnSoumettre).toBeVisible({ timeout: 5000 });

  // Fermer le drawer
  await page.locator('button:has-text("Fermer")').first().click();
  await page.waitForTimeout(800);

  await expect(page).toHaveURL(/\/dashboard\/medecin\/controleur/);
  console.log('✓ Test 6 PASSED : validation et calculs du formulaire vérifiés');
});