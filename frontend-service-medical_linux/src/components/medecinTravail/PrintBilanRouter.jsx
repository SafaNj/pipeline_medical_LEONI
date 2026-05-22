import { getSitePrintConfig } from '../../utils/siteConfig';
import PrintBilan from './Printbilan';
import PrintDemandeAnalyseBiologiqueSousse from './PrintDemandeAnalyseBiologiqueSousse';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';

export default function PrintBilanRouter(props) {
  const cfg = getSitePrintConfig(props?.fiche, props?.form, props?.siteConfig);
  const templateBranch = resolveSiteTemplateFromSources(props?.fiche, props?.form, props?.siteConfig, cfg);
  if (templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE) {
    return <PrintDemandeAnalyseBiologiqueSousse {...props} />;
  }
  if (templateBranch === SITE_TEMPLATE_BRANCH.MATEUR) {
    return <PrintBilan {...props} />;
  }
  return <PrintBilan {...props} />;
}
