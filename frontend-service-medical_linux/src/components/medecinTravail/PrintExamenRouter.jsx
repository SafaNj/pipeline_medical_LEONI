import { getSitePrintConfig } from '../../utils/siteConfig';
import PrintExamen from './Printexamen';
import PrintDemandeExamenComplementaireSousse from './PrintDemandeExamenComplementaireSousse';
import { resolveSiteTemplateFromSources, SITE_TEMPLATE_BRANCH } from '../../utils/siteTemplateResolver';

export default function PrintExamenRouter(props) {
  const cfg = getSitePrintConfig(props?.fiche, props?.form, props?.siteConfig);
  const templateBranch = resolveSiteTemplateFromSources(props?.fiche, props?.form, props?.siteConfig, cfg);
  if (templateBranch === SITE_TEMPLATE_BRANCH.MESSADINE) {
    return <PrintDemandeExamenComplementaireSousse {...props} />;
  }
  if (templateBranch === SITE_TEMPLATE_BRANCH.MATEUR) {
    return <PrintExamen {...props} />;
  }
  return <PrintExamen {...props} />;
}
