export const approvals = {
  title: 'Validations',
  description:
    'Les actions que vos agents souhaitent réaliser et qui doivent être validées par une personne avant d’être exécutées.',
  status: {
    pending: 'En attente',
    approved: 'Validée',
    rejected: 'Refusée',
  },
  risk: {
    low: 'Risque faible',
    medium: 'Risque moyen',
    high: 'Risque élevé',
  },
  filters: {
    statusLabel: 'Statut',
  },
  table: {
    title: 'Action',
    status: 'Statut',
    risk: 'Risque',
    created: 'Demandée',
  },
  list: {
    errorTitle: 'Impossible de charger les validations',
    errorDescription: 'Une erreur est survenue lors du chargement des validations en attente.',
    emptyTitle: 'Aucune validation pour le moment',
    emptyDescription: 'Les actions qui nécessitent votre accord apparaîtront ici.',
    emptyFilteredTitle: 'Aucune validation ne correspond à vos filtres',
    emptyFilteredDescription: 'Essayez d’effacer les filtres pour voir plus de résultats.',
  },
  detail: {
    title: 'Détails de la validation',
    aiAction: 'Action proposée',
    reason: 'Motif',
    preview: 'Aperçu',
    rejectionReason: 'Motif du refus',
  },
  actions: {
    approve: 'Valider',
    reject: 'Refuser',
  },
  reject: {
    title: 'Refuser cette action',
    reasonLabel: 'Motif',
    reasonPlaceholder: 'Expliquez pourquoi cette action ne doit pas être exécutée.',
  },
  toast: {
    approved: 'Validée.',
    rejected: 'Refusée.',
  },
};
