import { buildCertificatAptitudeSousseHTML } from '../components/medecinTravail/PrintCertificatAptitudeSousse';
import { buildFicheAptitudeOnlyHTML } from '../components/medecinTravail/Printficheaptitude';
import { buildFicheAptitudeMaturHTML, medecinDisplayNameFromUser } from '../components/medecinTravail/PrintFicheAptitudeMateur';
import { SITE_TEMPLATE_BRANCH, resolveSiteTemplateFromSources } from './siteTemplateResolver';

function pickUserFromPrintSources(sources = []) {
  for (let i = sources.length - 1; i >= 0; i -= 1) {
    const s = sources[i];
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    if (
      (s.prenom != null && String(s.prenom).trim() !== '')
      || (s.nom != null && String(s.nom).trim() !== '')
      || (s.email != null && String(s.email).trim() !== '')
    ) {
      return s;
    }
  }
  for (let i = sources.length - 1; i >= 0; i -= 1) {
    const s = sources[i];
    if (s && typeof s === 'object' && !Array.isArray(s) && s.role != null) return s;
  }
  return null;
}

export function resolveFichePrintTemplate(...sources) {
  const branch = resolveSiteTemplateFromSources(...sources);
  if (branch === SITE_TEMPLATE_BRANCH.MESSADINE) return 'MESSADINE';
  if (branch === SITE_TEMPLATE_BRANCH.MATEUR) return 'MATEUR';
  return 'MENZEL';
}

/**
 * HTML d’impression fiche d’aptitude : même logique que {@link ../components/medecinTravail/Nouvellefiche.jsx} —
 * certificat FOR-AMT-10 / GMTGS (Messadine) ou mise en page « Fiche d’aptitude » Menzel.
 *
 * @param {object} fiche
 * @param {object} printCfg — résultat de `getSitePrintConfig(fiche, …)`
 * @param {...object} sourcesBeforePrintCfg — ex. `user`, ou `ligneListe, user` (passés à `resolveFichePrintTemplate` avant `printCfg`)
 */
export function buildFicheAptitudePrintHtml(fiche, printCfg, ...sourcesBeforePrintCfg) {
  const tpl = resolveFichePrintTemplate(fiche, ...sourcesBeforePrintCfg, printCfg);
  if (tpl === 'MESSADINE') {
    return buildCertificatAptitudeSousseHTML(fiche, fiche, printCfg);
  }
  if (tpl === 'MATEUR') {
    const med = medecinDisplayNameFromUser(pickUserFromPrintSources(sourcesBeforePrintCfg));
    return buildFicheAptitudeMaturHTML(fiche, printCfg, med ? { medecin_connecte_nom: med } : undefined);
  }
  return buildFicheAptitudeOnlyHTML(fiche, printCfg);
}
