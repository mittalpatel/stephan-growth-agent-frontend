import { agents } from './agents';
import { analytics } from './analytics';
import { auth } from './auth';
import { buttons, common, dateRangePicker, navigation, pagination } from './common';
import { conversations } from './conversations';
import { dashboard } from './dashboard';
import { errors } from './errors';
import { header } from './header';
import { knowledge } from './knowledge';
import { leads } from './leads';
import { legal } from './legal';
import { marketing } from './marketing';
import { notifications } from './notifications';
import { organizations } from './organizations';
import { projects } from './projects';
import { userProfile } from './userProfile';

/**
 * The English catalog — the source of truth for the `Translations` type.
 *
 * One namespace per file. Namespaces are flat and feature-shaped, not
 * component-shaped: two components rendering "Save" share `buttons.save` rather
 * than each owning a copy that drifts.
 *
 * `as const` matters. Without it every value widens to `string`, the derived
 * `Translations` type stops distinguishing keys, and a second locale could
 * satisfy it while missing half the catalog.
 */
export const en = {
  common,
  buttons,
  pagination,
  navigation,
  dateRangePicker,
  auth,
  header,
  errors,
  dashboard,
  userProfile,
  legal,
  marketing,
  notifications,
  organizations,
  // Demo module — removed by `npm run strip-demo`.
  projects,
  agents,
  knowledge,
  conversations,
  leads,
  analytics,
} as const;
