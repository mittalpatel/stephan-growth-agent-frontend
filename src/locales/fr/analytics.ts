export const analytics = {
  title: 'Statistiques',
  description: 'Un résumé de l’activité : conversations, prospects et escalades.',
  range: {
    label: 'Période',
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '90 derniers jours',
  },
  empty:
    'Aucune activité sur cette période. Les chiffres apparaîtront dès que des visiteurs parleront à un agent publié.',
  error: 'Certains chiffres n’ont pas pu être chargés, les totaux peuvent donc être incomplets.',
  byAgent: {
    title: 'Par agent',
    agent: 'Agent',
    conversations: 'Conversations',
    leads: 'Prospects',
    escalations: 'Escalades',
  },
  locked: {
    title: 'Rapports détaillés',
    description:
      'Consultez toutes les tendances de conversation, les questions fréquentes et les sujets sans réponse, et exportez vos données pour les analyser.',
    cta: 'Souscrivez à une offre pour en voir plus',
    export: 'Exporter',
    exportLocked: 'L’export des données est disponible avec les offres payantes.',
  },
  metrics: {
    conversations: 'Conversations',
    messages: 'Messages',
    escalations: 'Escalades',
    leads: 'Prospects',
    unresolvedTopics: 'Sujets non résolus',
  },
};
