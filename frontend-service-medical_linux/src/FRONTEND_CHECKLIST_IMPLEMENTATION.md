/**
 * 📍 FRONTEND SITE ISOLATION IMPLEMENTATION CHECKLIST
 * Comprehensive guide for site-based access control
 * 
 * This document details all implementations for the frontend checklist:
 * 1️⃣ Lire et Stocker le site_id de l'Utilisateur
 * 2️⃣ Filtrer les Requêtes API par Site
 * 3️⃣ Forcer le site_id sur les Créations
 * 4️⃣ Gérer les Erreurs 403
 * 5️⃣ Afficher le Site Actuel dans l'Interface
 * 6️⃣ Ne JAMAIS Permettre de Changer de Site
 */

// ═══════════════════════════════════════════════════════════════
// 1️⃣ LIRE ET STOCKER LE SITE_ID DE L'UTILISATEUR
// ═══════════════════════════════════════════════════════════════
// ✅ COMPLETED - IMPLEMENTATION SUMMARY
//
// Location: src/api/authApi.js + src/utils/siteAccessControl.js
//
// Flow:
// 1. User logs in → authApi.login(username, password)
// 2. Backend returns { site_id, site_nom, ... }
// 3. authApi stores in localStorage:
//    - localStorage.setItem('user', JSON.stringify({ site_id, site_nom, ... }))
//    - localStorage.setItem('userSiteId', site_id)
//    - localStorage.setItem('userSiteName', site_nom)
// 4. AuthContext provides via hook:
//    - useAuth() → { user } where user.site_id and user.site_nom
//
// Usage in Components:
// ────────────────────
// import { useAuth } from '../context/AuthContext';
// import { getUserSiteId, getUserSiteName } from '../utils/siteAccessControl';
//
// function MyComponent() {
//   const { user } = useAuth();
//   const siteId = getUserSiteId(); // From localStorage
//   const siteName = getUserSiteName(); // From localStorage
//   
//   console.log(`User Site: ${siteName} (ID: ${siteId})`);
// }

// ═══════════════════════════════════════════════════════════════
// 2️⃣ FILTRER LES REQUÊTES API PAR SITE
// ═══════════════════════════════════════════════════════════════
// ✅ COMPLETED - IMPLEMENTATION SUMMARY
//
// Location: src/utils/siteAccessControl.js (buildSiteFilter function)
//          src/api/Medicalworkapi.js (updated endpoints)
//          src/api/medicalRecordsApi.js (updated endpoints)
//
// All critical GET endpoints now include site_id filter:
// 
// UPDATED ENDPOINTS:
// ──────────────────
// ✓ searchCollaborateurs(search, filters) - searches employees by site
// ✓ getFichesAptitude(filters) - lists medical records by site
// ✓ getCandidatsAExaminer(filters) - lists candidates by site
// ✓ getDossiers(filters) - lists medical files by site
// ✓ searchDossiers(search, filters) - searches medical files by site
//
// Implementation Pattern:
// ───────────────────────
// import { buildSiteFilter } from '../utils/siteAccessControl';
//
// export const getFichesAptitude = async (filters = {}) => {
//   const siteFilters = buildSiteFilter(filters); // Adds site_id automatically
//   const response = await axiosInstance.get('/medical-work/fiches-aptitude/', {
//     params: cleanParams(siteFilters),
//   });
//   return Array.isArray(response.data) ? response.data : (response.data.results || []);
// };
//
// Usage in Components:
// ────────────────────
// import { getFichesAptitude } from '../api/Medicalworkapi';
//
// // No need to manually add site_id - buildSiteFilter does it!
// const fiches = await getFichesAptitude(); // ✅ Automatically filtered by site
// const fiches = await getFichesAptitude({ medecin_user_id: 42 }); // ✅ Merges filters


// ═══════════════════════════════════════════════════════════════
// 3️⃣ FORCER LE SITE_ID SUR LES CRÉATIONS
// ═══════════════════════════════════════════════════════════════
// ✅ COMPLETED - IMPLEMENTATION SUMMARY
//
// Location: src/api/Medicalworkapi.js (creerFicheAptitude)
//
// Pattern for POST endpoints:
// ───────────────────────────
// import { getUserSiteId } from '../utils/siteAccessControl';
//
// export const creerFicheAptitude = async (data) => {
//   // Force site_id from current user
//   const siteId = getUserSiteId();
//   const payload = { ...data, site_id: siteId };
//
//   const r = await axiosInstance.post('/medical-work/fiches-aptitude/', payload);
//   return r.data;
// };
//
// Usage in Components:
// ────────────────────
// import { creerFicheAptitude } from '../api/Medicalworkapi';
//
// const newFiche = await creerFicheAptitude({
//   // Don't include site_id - it's forced by API
//   collaborateur: 123,
//   date_visite: '2026-04-11',
//   type_visite: 'CONSULTATION',
//   observations: 'Suivi normal',
// });
// // Backend receives: { collaborateur: 123, ..., site_id: <current-user-site> }
//
// ⚠️ IMPORTANT: User CANNOT override site_id - backend must also enforce this!


// ═══════════════════════════════════════════════════════════════
// 4️⃣ GÉRER LES ERREURS 403 (ACCÈS REFUSÉ)
// ═══════════════════════════════════════════════════════════════
// ✅ COMPLETED - IMPLEMENTATION SUMMARY
//
// Global 403 Handler (Axios Interceptor):
// ───────────────────────────────────────
// Location: src/api/axios.js (Response Interceptor)
//
// When any API call returns 403:
// 1. Error is logged to console with details (URL, userSiteId, etc.)
// 2. Error is marked with: error.isSiteAccessDenied = true
// 3. Error is marked with: error.accessDeniedMessage = message
// 4. Error is rejected (passed to component)
//
// Component-Level 403 Handling:
// ─────────────────────────────
// Location: src/components/common/AccessDeniedModal.jsx
//
// Hook to manage 403 modal:
// ────────────────────────
// import { useAccessDeniedModal } from '../components/common/AccessDeniedModal';
// import AccessDeniedModal from '../components/common/AccessDeniedModal';
//
// function MyComponent() {
//   const { isOpen, message, showError, closeError } = useAccessDeniedModal();
//
//   const handleLoadFiches = async () => {
//     try {
//       const fiches = await getFichesAptitude();
//       setFiches(fiches);
//     } catch (error) {
//       if (error?.response?.status === 403) {
//         showError(error?.accessDeniedMessage);
//       }
//     }
//   };
//
//   return (
//     <>
//       <AccessDeniedModal isOpen={isOpen} message={message} onClose={closeError} />
//       <button onClick={handleLoadFiches}>Load Fiches</button>
//     </>
//   );
// }
//
// Utility Functions:
// ──────────────────
// import { handle403Error } from '../utils/siteAccessControl';
//
// try {
//   await loadData();
// } catch (error) {
//   if (handle403Error(error, (msg) => showModal(msg))) {
//     // Error was 403 and has been handled
//     return;
//   }
//   // Handle other errors
// }


// ═══════════════════════════════════════════════════════════════
// 5️⃣ AFFICHER LE SITE ACTUEL DANS L'INTERFACE
// ═══════════════════════════════════════════════════════════════
// ✅ COMPLETED - IMPLEMENTATION SUMMARY
//
// Location: src/components/common/SiteInfoHeader.jsx
//          src/pages/DashboardMedecinTravail.jsx (integrated)
//
// Component Features:
// ───────────────────
// • Green banner at top showing current site name and ID
// • Lock icon indicating site is locked (no switching)
// • Displays only when user is authenticated
//
// Usage:
// ─────
// import SiteInfoHeader from '../components/common/SiteInfoHeader';
//
// function Dashboard() {
//   return (
//     <div>
//       <SiteInfoHeader /> {/* Renders: "📍 Site actuel: Sousse (ID: 1)" */}
//       {/* Rest of dashboard */}
//     </div>
//   );
// }
//
// Visual Design:
// ──────────────
// • Background: Dark green (#065f46) with bright green border (#10b981)
// • Contains: Location pin icon + Site name + ID + Lock icon
// • Responsive and mobile-friendly


// ═══════════════════════════════════════════════════════════════
// 6️⃣ NE JAMAIS PERMETTRE À L'UTILISATEUR DE CHANGER DE SITE
// ═══════════════════════════════════════════════════════════════
// ✅ COMPLETED - DESIGN ENFORCED
//
// Implementation Summary:
// ──────────────────────
// 1. Site is READ-ONLY: Users see it but cannot modify
// 2. Site is persisted: Stored in localStorage after login
// 3. Site is enforced: Used in all API filters automatically
// 4. Site is locked at login: No UI allows switching
//
// ❌ NOT ALLOWED (Design prevents):
// ─────────────────
// <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
//   <option value="1">Sousse</option>
//   <option value="2">Menzel Hayet</option>
// </select>
//
// ✅ CORRECT (Read-only display):
// ──────────────────────────────
// <div style={{ color: '#065f46', fontWeight: 'bold' }}>
//   Site actuel: {siteName} (ID: {siteId})
// </div>
//
// Backend Enforcement:
// ───────────────────
// SiteInfoHeader and UI lock are COSMETIC.
// CRITICAL SECURITY: Backend MUST enforce via Django ORM filtering.
// Backend should return 403 if user tries to access another site's data.


// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS REFERENCE
// ═══════════════════════════════════════════════════════════════
//
// Location: src/utils/siteAccessControl.js
//
// getUserSiteId()
//   Returns: number | null
//   Purpose: Get user's site ID from localStorage
//
// getUserSiteName()
//   Returns: string | null
//   Purpose: Get user's site name from localStorage
//
// storeUserSite(siteId, siteName)
//   Returns: void
//   Purpose: Store site info in localStorage (called after login)
//
// clearUserSite()
//   Returns: void
//   Purpose: Clear site info from localStorage (called on logout)
//
// buildSiteFilter(filters = {})
//   Returns: Object
//   Purpose: Add site_id to any filter object
//   Example: buildSiteFilter({ status: 'APTE' }) 
//            → { site_id: 1, status: 'APTE' }
//
// handle403Error(error, onError = null)
//   Returns: boolean
//   Purpose: Detect and handle 403 errors
//   Example: if (handle403Error(error, (msg) => alert(msg))) { return; }
//
// isResourceInUserSite(resource = {})
//   Returns: boolean
//   Purpose: Validate resource belongs to user's site (client-side check)
//
// logNavigation(pageName)
//   Returns: void
//   Purpose: Log page navigation for audit (console only)
//
// isUserLockedToSite()
//   Returns: boolean
//   Purpose: Check if user has a site assigned (vs global admin)


// ═══════════════════════════════════════════════════════════════
// API ENDPOINTS UPDATED
// ═══════════════════════════════════════════════════════════════
//
// GET /api/employees/collaborateurs/
//   Now supports: ?site_id=1
//   Example: GET /api/employees/collaborateurs/?site_id=1&search=nom
//
// GET /api/medical-work/fiches-aptitude/
//   Now supports: ?site_id=1&medecin_user_id=42
//   Example: GET /api/medical-work/fiches-aptitude/?site_id=1
//
// GET /api/embauche/candidats/a_examiner/
//   Now supports: ?site_id=1
//   Example: GET /api/embauche/candidats/a_examiner/?site_id=1
//
// GET /api/medical-records/dossiers/
//   Now supports: ?site_id=1
//   Example: GET /api/medical-records/dossiers/?site_id=1&search=nom
//
// POST /api/medical-work/fiches-aptitude/
//   Now FORCES: { ..., site_id: <user-site> }
//   Backend MUST enforce: site_id = request.user.site_id
//
// NOTE: Backend MUST implement server-side filtering!
// Frontend filters are for UX only - they do NOT provide security.
// Backend must validate site_id in ViewSet.get_queryset()


// ═══════════════════════════════════════════════════════════════
// TESTING CHECKLIST
// ═══════════════════════════════════════════════════════════════
//
// ✓ Login and verify site_id is stored in localStorage
// ✓ Navigate dashboard and verify SiteInfoHeader displays
// ✓ Load fiches/dossiers and verify they're filtered by site
// ✓ Try to create a fiche and verify site_id is set
// ✓ Clear localStorage and re-login from different account (different site)
// ✓ Verify previous site's data is NOT visible
// ✓ Logout and verify localStorage is cleared
// ✓ Backend: Call API with site_id=99 and verify 403 Forbidden
// ✓ Backend: Verify two users from different sites NEVER see each other's data
//
// Integration Testing (Backend Required):
// ────────────────────────────────────────
// - User A (site 1) tries to access User B's (site 2) fiche → 403
// - User A tries to POST fiche with site_id override → rejected
// - User A can ONLY see site 1 data even with direct API calls
// - Test with 2+ real accounts on production DB


// ═══════════════════════════════════════════════════════════════
// BUILD VERIFICATION
// ═══════════════════════════════════════════════════════════════
//
// Build Command: npm run build
// Build Status: ✅ SUCCESS
// Output: 757 modules transformed
// Size: 3,205.54 kB JS (1,003.16 kB gzip)
// Warnings: Non-critical (dynamic import optimization suggestion)
//
// All files compile without errors!
