/** Demo module strings, removed by `npm run strip-demo`. */
export const projects = {
  title: 'Projets',
  description: 'Tout ce que montre le modèle, dans un module amovible.',

  list: {
    searchPlaceholder: 'Rechercher des projets…',
    emptyTitle: 'Aucun projet pour le moment',
    emptyDescription: 'Créez votre premier projet pour le voir ici.',
    emptyFilteredTitle: 'Aucun projet ne correspond à ces filtres',
    emptyFilteredDescription: 'Essayez d’effacer un filtre ou d’élargir votre recherche.',
    errorTitle: 'Impossible de charger les projets',
    errorDescription: 'Une erreur est survenue lors du chargement de la liste. Réessayez.',
    resultCount: {
      one: '{count} projet',
      other: '{count} projets',
    },
  },

  columns: {
    name: 'Nom',
    status: 'Statut',
    category: 'Catégorie',
    owner: 'Propriétaire',
    createdAt: 'Créé',
    updatedAt: 'Mis à jour',
  },

  detail: {
    title: 'Détails du projet',
    notFoundTitle: 'Projet introuvable',
    notFoundDescription: 'Il a peut-être été supprimé, ou vous n’y avez pas accès.',
    backToList: 'Retour aux projets',
    archivedNotice: 'Ce projet est archivé et ne peut pas être modifié.',
  },

  form: {
    createTitle: 'Nouveau projet',
    editTitle: 'Modifier le projet',
    nameLabel: 'Nom',
    namePlaceholder: 'ex. Projet de référence',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'À quoi sert ce projet ?',
    statusLabel: 'Statut',
    categoryLabel: 'Catégorie',
  },

  validation: {
    nameRequired: 'Le nom est obligatoire.',
    nameTooLong: 'Le nom doit contenir 200 caractères au maximum.',
    descriptionTooLong: 'La description doit contenir 5000 caractères au maximum.',
  },

  actions: {
    create: 'Nouveau projet',
    edit: 'Modifier',
    delete: 'Supprimer',
    export: 'Exporter',
  },

  confirm: {
    deleteTitle: 'Supprimer ce projet ?',
    deleteDescription: 'Un administrateur pourra le restaurer, mais il disparaîtra des listes.',
  },

  toast: {
    created: 'Projet créé.',
    updated: 'Projet mis à jour.',
    deleted: 'Projet supprimé.',
  },

  status: {
    draft: 'Brouillon',
    active: 'Actif',
    archived: 'Archivé',
  },

  category: {
    standard: 'Standard',
    premium: 'Premium',
    legacy: 'Ancien',
  },

  access: {
    title: 'Partager le projet',
    shareButton: 'Partager',
    description:
      'Ajoutez des personnes de votre organisation et choisissez ce qu’elles peuvent faire.',
    addPeoplePlaceholder: 'Ajouter des personnes par nom ou e-mail…',
    noMatches: 'Aucun membre correspondant',
    everyoneAdded: 'Tous les membres de l’organisation ont déjà accès.',
    addButton: 'Ajouter',
    ownerBadge: 'Propriétaire',
    orgWideBadge: '{role} · tous les projets',
    orgWideBadgeFallback: 'Tous les projets',
    orgWideAccessHint:
      'Ce rôle a accès à tous les projets de l’organisation, il ne peut donc pas être modifié ici.',
    peopleWithAccessTitle: 'Personnes ayant accès',
    removeAriaLabel: 'Retirer l’accès',
    columns: {
      name: 'Nom',
      email: 'E-mail',
      accessLevel: 'Niveau d’accès',
      grantedBy: 'Accordé par',
      grantedAt: 'Accordé le',
    },
    levels: {
      none: 'Aucun accès',
      viewer: 'Lecteur',
      editor: 'Éditeur',
      manager: 'Gestionnaire',
    },
    emptyTitle: 'Personne n’a encore accès',
    emptyDescription: 'Ajoutez un membre ci-dessus pour lui donner accès à ce projet.',
    errorTitle: 'Impossible de charger les accès',
    errorDescription:
      'Une erreur est survenue lors du chargement des personnes ayant accès. Réessayez.',
    toast: {
      granted: 'Accès mis à jour.',
      revoked: 'Accès retiré.',
    },
  },

  files: {
    title: 'Fichiers',
    description: 'Les fichiers joints à ce projet.',
    uploadButton: 'Importer un fichier',
    columns: {
      name: 'Nom',
      size: 'Taille',
      contentType: 'Type',
      owner: 'Importé par',
      uploadedAt: 'Importé le',
    },
    emptyTitle: 'Aucun fichier pour le moment',
    emptyDescription: 'Importez un fichier ci-dessus pour le voir ici.',
    errorTitle: 'Impossible de charger les fichiers',
    errorDescription: 'Une erreur est survenue lors du chargement des fichiers. Réessayez.',
    previewUnavailable: 'Aucun aperçu disponible pour ce type de fichier.',
    previewClose: 'Fermer l’aperçu',
    previewLoadError: 'Impossible de charger ce PDF pour l’aperçu.',
    pdf: {
      pageOf: 'Page {current} sur {total}',
      previousPage: 'Page précédente',
      nextPage: 'Page suivante',
      zoomIn: 'Zoom avant',
      zoomOut: 'Zoom arrière',
    },
    form: {
      title: 'Importer un fichier',
      nameLabel: 'Nom',
      namePlaceholder: 'ex. Rapport T3',
      dropzoneHint: 'Glissez un fichier ici',
      dropzoneActive: 'Déposez pour le joindre',
      submit: 'Importer',
    },
    validation: {
      nameRequired: 'Le nom est obligatoire.',
      nameTooLong: 'Le nom doit contenir 200 caractères au maximum.',
      fileRequired: 'Choisissez un fichier à importer.',
      fileTooLarge: 'Ce fichier dépasse {limit}. Choisissez un fichier plus petit.',
    },
    actions: {
      download: 'Télécharger',
      rename: 'Renommer',
      delete: 'Supprimer',
      preview: 'Aperçu',
    },
    confirm: {
      deleteTitle: 'Supprimer ce fichier ?',
      deleteDescription: 'Cette action est irréversible.',
    },
    toast: {
      uploaded: 'Fichier importé.',
      renamed: 'Fichier renommé.',
      deleted: 'Fichier supprimé.',
    },
  },
};
