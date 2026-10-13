import type { Translations } from '..';

import { agents } from './agents';
import { analytics } from './analytics';
import { approvals } from './approvals';
import { auth } from './auth';
import { billing } from './billing';
import { buttons, common, dateRangePicker, navigation, pagination } from './common';
import { conversations } from './conversations';
import { integrations } from './integrations';
import { dashboard } from './dashboard';
import { errors } from './errors';
import { guide } from './guide';
import { header } from './header';
import { knowledge } from './knowledge';
import { leads } from './leads';
import { legal } from './legal';
import { marketing } from './marketing';
import { notifications } from './notifications';
import { organizations } from './organizations';
import { projects } from './projects';
import { userProfile } from './userProfile';

export const fr: Translations = {
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
  approvals,
  integrations,
  billing,
  guide,
};
