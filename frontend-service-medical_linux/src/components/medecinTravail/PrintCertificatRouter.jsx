import { getSitePrintConfig } from '../../utils/siteConfig';
import PrintCertificat from './Printcertificat';
import PrintCertificatForAmt10Sousse from './PrintCertificatForAmt10Sousse';
import PrintCertificatAptitudeMateur from './PrintCertificatAptitudeMateur';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';

export default function PrintCertificatRouter(props) {
  const cfg = getSitePrintConfig(props?.fiche, props?.form, props?.siteConfig);
  const templateBranch = resolveSiteTemplateFromSources(props?.fiche, props?.form, props?.siteConfig, cfg);
  if (templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE) {
    return <PrintCertificatForAmt10Sousse {...props} />;
  }
  if (templateBranch === SITE_TEMPLATE_BRANCH.MATEUR) {
    return <PrintCertificatAptitudeMateur {...props} />;
  }
  return <PrintCertificat {...props} />;
}
