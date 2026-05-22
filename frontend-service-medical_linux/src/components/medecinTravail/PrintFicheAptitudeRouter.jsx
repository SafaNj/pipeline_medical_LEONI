import { getSitePrintConfig } from '../../utils/siteConfig';
import PrintFicheAptitude from './Printficheaptitude';
import PrintCertificatForAmt10Sousse from './PrintCertificatForAmt10Sousse';
import PrintFicheAptitudeMateur from './PrintFicheAptitudeMateur';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';

export default function PrintFicheAptitudeRouter(props) {
  const cfg = getSitePrintConfig(props?.fiche, props?.siteConfig);
  const templateBranch = resolveSiteTemplateFromSources(props?.fiche, props?.siteConfig, cfg);
  if (templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE) {
    return (
      <PrintCertificatForAmt10Sousse
        {...props}
        label={props?.label || "Imprimer certificat d'aptitude"}
        title={props?.title || "Imprimer certificat d'aptitude"}
      />
    );
  }
  if (templateBranch === SITE_TEMPLATE_BRANCH.MATEUR) {
    return <PrintFicheAptitudeMateur {...props} />;
  }
  return <PrintFicheAptitude {...props} />;
}
