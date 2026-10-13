export const dashboard = {
  title: 'Tableau de bord',
  greeting: 'Bonjour {name}',
  welcome: 'Voici ce qui se passe dans votre espace IA.',
  actions: {
    viewAnalytics: 'Améliorez votre ROI',
    exploreAgents: 'Découvrir les agents',
  },
  range: {
    '7d': '7 J',
    '30d': '30 J',
    '90d': '90 J',
  },
  metrics: {
    activeAgents: 'Agents actifs',
    conversations: 'Conversations',
    escalations: 'Escalades',
    leadsCaptured: 'Prospects captés',
    unresolvedTopics: 'Sujets non résolus',
  },
  agentPerformance: {
    title: 'Performance des agents',
    viewAll: 'Voir tous les agents',
    empty: 'Créez un agent pour voir sa performance ici.',
    conversations: 'Conversations',
    leads: 'Prospects',
    viewAgent: 'Voir l’agent',
  },
  activity: {
    title: 'Prospects récents',
    empty: 'Aucun prospect récent pour le moment.',
  },
  securityTip: {
    title: 'Protégez votre compte',
    description:
      'Activez la vérification en deux étapes : un mot de passe volé ne suffira plus à ouvrir votre espace.',
    action: 'L’activer',
    dismiss: 'Plus tard',
  },
  metricsEmpty:
    'Vos chiffres apparaîtront ici dès que des visiteurs commenceront à parler à un agent publié.',
  checklist: {
    title: 'Mise en route',
    progress: '{done} étapes sur {total} terminées',
    items: {
      organization_created: 'Créer votre organisation',
      team_member_invited: 'Inviter votre équipe',
      agent_created: 'Préparer vos agents IA',
      agent_published: 'Publier un agent',
      knowledge_source_added: 'Ajouter une source de connaissances',
    },
    hints: {
      organization_created: 'Fait pour vous lors de la création de votre compte.',
      team_member_invited:
        'Facultatif. Vous travaillez à plusieurs ? Invitez vos collègues quand vous le souhaitez.',
      agent_created: 'Fait pour vous. Vos agents sont prêts à être configurés.',
      agent_published: 'Mettez un agent en ligne pour que les visiteurs puissent lui parler.',
      knowledge_source_added:
        'Terminé dès qu’au moins une source a fini d’être traitée. Un site web peut prendre quelques minutes.',
    },
    optional: 'Facultatif',
    guideLink: 'Comment fonctionne la mise en route ?',
  },
};
