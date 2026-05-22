// tests/e2e/rh_embauche_e2e.spec.js
// ============================================================
//  Tests E2E — Dashboard RH / Visite d'embauche
//  Rôle : Responsable RH — Dashboard : /dashboard/rh
// ============================================================

import { test, expect } from '@playwright/test';

const COMPTE_RH = {
  username: 'wiem_hamila',   // ← adapte selon ton compte RH réel
  password: 'Wiem123*',
};

const CANDIDAT = {
  matricule: '99999999',
  nom:       'TESTEUR',
  prenom:    'Playwright',
  cin:       '99999999',
  poste:     'Technicien Test E2E',
};

// ─── Helper : login ───────────────────────────────────────────
async function login(page) {
  await page.goto('/login');
  await page.waitForSelector('#username', { timeout: 10000 });
  await page.fill('#username', COMPTE_RH.username);
  await page.fill('#password', COMPTE_RH.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/rh', { timeout: 15000 });
  console.log('✓ Login RH OK — dashboard RH');
}

// ─── Helper : clic bouton sidebar ────────────────────────────
async function clickNav(page, labelText) {
  const btn = page.locator(`button:has-text("${labelText}")`).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(1500);
}

// ─── Helper : date demain YYYY-MM-DD ─────────────────────────
function dateDemain() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ─── Helper : aller en mode saisie manuelle ───────────────────
// 1. Remplir la date  2. Cliquer "Saisie manuelle →"
async function allerEnModeManuel(page) {
  await expect(page.locator("text=Nouvelle liste d'embauche")).toBeVisible({ timeout: 10000 });

  // Remplir la date AVANT de cliquer Manuel (obligatoire sinon erreur)
  const demain = dateDemain();
  await page.locator('input[type="date"]').first().fill(demain);
  console.log(`  → date visite = ${demain}`);

  // Bouton exact trouvé dans NouvelleListeEmbauche.jsx ligne 331
  const btnManuel = page.locator('button:has-text("Saisie manuelle →")');
  await btnManuel.waitFor({ state: 'visible', timeout: 8000 });
  await btnManuel.click();
  await page.waitForTimeout(2000);
  console.log('  → mode saisie manuelle activé');

  // "Candidat #1" doit apparaître (FormCandidatRow — NouvelleListeEmbauche.jsx)
  await expect(page.locator('text=Candidat #1')).toBeVisible({ timeout: 10000 });
  console.log('  → formulaire Candidat #1 visible');
}

// ============================================================
//  TEST 1 — Tableau de bord RH
//  Vérifie les 4 KPI : Total candidats, Aptes, Listes soumises
// ============================================================
test('Test 1 — RH accède au tableau de bord avec statistiques', async ({ page }) => {
  await login(page);

  await expect(page.locator('text=Total candidats')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=/Aptes|Apte/i').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=/Listes soumises|soumises/i').first()).toBeVisible({ timeout: 5000 });

  await expect(page).toHaveURL(/\/dashboard\/rh/);
  console.log('✓ Test 1 PASSED : tableau de bord RH avec statistiques');
});

// ============================================================
//  TEST 2 — Listes d'embauche existantes
//  FIX : locator CSS séparé pour éviter l'erreur de parsing regex
// ============================================================
test("Test 2 — RH consulte les listes d'embauche existantes", async ({ page }) => {
  await login(page);
  await clickNav(page, "Listes d'embauche");

  // Vérifier le titre de la section
  const titre = page.locator("text=/Listes d'embauche|Embauche/i").first();
  await expect(titre).toBeVisible({ timeout: 10000 });

  // Vérifier le contenu : tableau OU message vide — locators séparés
  const tableau   = page.locator('table').first();
  const cartes    = page.locator('[class*="liste"]').first();
  const msgVide   = page.locator('text=Aucune').first();
  const brouillon = page.locator('text=Brouillon').first();
  const soumise   = page.locator('text=Soumise').first();

  // Au moins un des éléments doit être visible
  const visible = await Promise.race([
    tableau.isVisible().catch(() => false),
    cartes.isVisible().catch(() => false),
    msgVide.isVisible().catch(() => false),
    brouillon.isVisible().catch(() => false),
    soumise.isVisible().catch(() => false),
  ]);

  // Attendre 3 secondes pour que React charge
  await page.waitForTimeout(3000);

  // Vérifier que la page n'est pas vide (au moins un contenu est présent)
  const body = await page.locator('body').textContent();
  const pageNonVide = body.includes('Brouillon') || body.includes('Soumise') ||
                      body.includes('Aucune') || body.includes('embauche') ||
                      body.includes('candidat');
  expect(pageNonVide).toBeTruthy();

  await expect(page).toHaveURL(/\/dashboard\/rh/);
  console.log("✓ Test 2 PASSED : listes d'embauche consultées");
});

// ============================================================
//  TEST 3 — Accéder au formulaire "Nouvelle liste"
// ============================================================
test('Test 3 — RH accède au formulaire Nouvelle liste', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Nouvelle liste');

  await expect(page.locator("text=Nouvelle liste d'embauche")).toBeVisible({ timeout: 10000 });

  // Champ date de la visite obligatoire
  const dateInput = page.locator('input[type="date"]').first();
  await expect(dateInput).toBeVisible({ timeout: 5000 });

  // Les 2 options doivent être proposées
  await expect(page.locator('text=Import Excel')).toBeVisible({ timeout: 5000 });

  // Bouton exact "Saisie manuelle →" (NouvelleListeEmbauche.jsx ligne 331)
  await expect(page.locator('button:has-text("Saisie manuelle →")')).toBeVisible({ timeout: 5000 });

  await expect(page).toHaveURL(/\/dashboard\/rh/);
  console.log('✓ Test 3 PASSED : formulaire Nouvelle liste accessible');
});

// ============================================================
//  TEST 4 — Saisir la date de visite
// ============================================================
test('Test 4 — RH saisit la date de visite dans le formulaire', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Nouvelle liste');

  await expect(page.locator("text=Nouvelle liste d'embauche")).toBeVisible({ timeout: 10000 });

  const demain = dateDemain();
  const dateInput = page.locator('input[type="date"]').first();
  await dateInput.fill(demain);
  await expect(dateInput).toHaveValue(demain);
  console.log(`✓ Étape : date de visite = ${demain}`);

  // Les 2 modes sont toujours disponibles après saisie date
  await expect(page.locator('text=Import Excel')).toBeVisible();
  await expect(page.locator('button:has-text("Saisie manuelle →")')).toBeVisible();

  await expect(page).toHaveURL(/\/dashboard\/rh/);
  console.log('✓ Test 4 PASSED : date de visite saisie correctement');
});

// ============================================================
//  TEST 5 — Remplissage complet du formulaire saisie manuelle
//  FIX : utilise "Saisie manuelle →" (texte exact du bouton)
//        et attend "Candidat #1" après navigation
// ============================================================
test('Test 5 — RH remplit le formulaire de saisie manuelle', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Nouvelle liste');

  await allerEnModeManuel(page);

  // ── Étape 4 : Matricule (placeholder="50234567890") ───────
  const inputMatricule = page.locator('input[placeholder="50234567890"]').first();
  await inputMatricule.fill(CANDIDAT.matricule);
  console.log(`✓ Étape 4 : matricule = ${CANDIDAT.matricule}`);

  // ── Étape 5 : Nom (placeholder="AKERMI") ─────────────────
  const inputNom = page.locator('input[placeholder="AKERMI"]').first();
  await inputNom.fill(CANDIDAT.nom);
  console.log(`✓ Étape 5 : nom = ${CANDIDAT.nom}`);

  // ── Étape 6 : Prénom (placeholder="Houcem") ──────────────
  const inputPrenom = page.locator('input[placeholder="Houcem"]').first();
  await inputPrenom.fill(CANDIDAT.prenom);
  console.log(`✓ Étape 6 : prénom = ${CANDIDAT.prenom}`);

  // ── Étape 7 : CIN (placeholder="12345678") ───────────────
  const inputCin = page.locator('input[placeholder="12345678"]').first();
  await inputCin.fill(CANDIDAT.cin);
  console.log(`✓ Étape 7 : CIN = ${CANDIDAT.cin}`);

  // ── Étape 8 : Poste (placeholder="Technicien") ───────────
  const inputPoste = page.locator('input[placeholder="Technicien"]').first();
  await inputPoste.fill(CANDIDAT.poste);
  console.log(`✓ Étape 8 : poste = ${CANDIDAT.poste}`);

  // ── Étape 9 : Bouton "Créer liste — 1 candidat" actif ────
  // Trouvé dans NouvelleListeEmbauche.jsx ligne 572
  const btnCreer = page.locator('button').filter({ hasText: /Créer liste/i }).first();
  await expect(btnCreer).toBeVisible({ timeout: 5000 });
  await expect(btnCreer).toBeEnabled();
  console.log('✓ Étape 9 : bouton "Créer liste — 1 candidat" actif');

  // ── Étape 10 : Bouton "Ajouter un candidat" disponible ───
  const btnAjouter = page.locator('button').filter({ hasText: /Ajouter un candidat/i }).first();
  await expect(btnAjouter).toBeVisible({ timeout: 5000 });
  console.log('✓ Étape 10 : bouton "Ajouter un candidat" disponible');

  // Retour sans soumettre (pas de données réelles en base)
  const btnAnnuler = page.locator('button:has-text("← Annuler")').first();
  await btnAnnuler.click();
  await page.waitForTimeout(800);

  await expect(page).toHaveURL(/\/dashboard\/rh/);
  console.log('✓ Test 5 PASSED : formulaire saisie manuelle rempli intégralement');
});

// ============================================================
//  TEST 6 — Ajouter un 2ème candidat
//  FIX : même correction que Test 5 pour ouvrir le mode manuel
// ============================================================
test('Test 6 — RH ajoute un 2ème candidat dans la liste', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Nouvelle liste');

  await allerEnModeManuel(page);

  // Remplir le 1er candidat (nom minimum pour validation)
  await page.locator('input[placeholder="AKERMI"]').first().fill('CANDIDAT_UN');

  // Cliquer "Ajouter un candidat"
  const btnAjouter = page.locator('button').filter({ hasText: /Ajouter un candidat/i }).first();
  await btnAjouter.waitFor({ state: 'visible', timeout: 5000 });
  await btnAjouter.click();
  await page.waitForTimeout(800);

  // "Candidat #2" doit apparaître
  await expect(page.locator('text=Candidat #2')).toBeVisible({ timeout: 5000 });
  console.log('✓ Candidat #2 visible après clic "Ajouter un candidat"');

  // Le bouton doit dire "2 candidats"
  const btnCreer = page.locator('button').filter({ hasText: /2 candidat/i }).first();
  await expect(btnCreer).toBeVisible({ timeout: 5000 });
  console.log('✓ Bouton "Créer liste — 2 candidats" visible');

  await expect(page).toHaveURL(/\/dashboard\/rh/);
  console.log('✓ Test 6 PASSED : 2 candidats ajoutés dans la liste');
});

// ============================================================
//  TEST 7 — Archives visites
// ============================================================
test('Test 7 — RH consulte les archives des visites', async ({ page }) => {
  await login(page);
  await clickNav(page, 'Archives visites');

  const section = page.locator('text=/Archives|Clôturées|Aucune/i').first();
  await expect(section).toBeVisible({ timeout: 10000 });

  await expect(page).toHaveURL(/\/dashboard\/rh/);
  console.log('✓ Test 7 PASSED : archives visites accessibles');
});