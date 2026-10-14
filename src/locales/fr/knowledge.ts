export const knowledge = {
  title: 'Sources de connaissances',
  description: 'Les contenus sur lesquels reposent les réponses de cet agent.',
  columns: {
    displayName: 'Nom',
    sourceType: 'Type',
    status: 'Statut',
    updatedAt: 'Mise à jour',
  },
  sourceType: {
    website: 'Site web',
    pdf: 'PDF',
  },
  status: {
    pending: 'En attente',
    processing: 'En cours de traitement',
    ready: 'Prête',
    failed: 'En échec',
    disabled: 'Désactivée',
  },
  filters: {
    statusLabel: 'Statut',
    sourceTypeLabel: 'Type',
  },
  list: {
    sectionTitle: 'Sources',
    searchPlaceholder: 'Rechercher des sources',
    errorTitle: 'Impossible de charger les sources de connaissances',
    errorDescription:
      'Une erreur est survenue lors du chargement de ces sources. Veuillez réessayer.',
    emptyTitle: 'Aucune source de connaissances pour le moment',
    emptyDescription:
      'Importez un PDF, comme votre FAQ ou votre grille tarifaire, ou ajoutez l’adresse de votre site. Vos agents répondent uniquement à partir de ce que vous ajoutez ici.',
    pendingHint:
      'Généralement prête en quelques minutes. Les grands sites riches en images peuvent prendre plus de temps.',
    failedHint:
      'Nous n’avons pu lire aucune page à cette adresse. Vérifiez qu’elle s’ouvre dans un navigateur, puis réessayez.',
    retry: 'Réessayer',
    choosePages: 'Choisir les pages',
    sharedNotice:
      'Les sources de connaissances sont partagées dans toute votre organisation. Chaque agent peut les lire, sauf si vous en limitez la liste ci-dessous.',
    emptyFilteredTitle: 'Aucune source ne correspond à vos filtres',
    emptyFilteredDescription: 'Essayez de modifier ou d’effacer vos filtres.',
  },
  processing: {
    line: {
      waiting: 'En attente',
      finding: 'Recherche des pages…',
      findingCount: {
        one: 'Recherche des pages… {count} trouvée pour l’instant',
        other: 'Recherche des pages… {count} trouvées pour l’instant',
      },
      choosing: {
        one: '{count} page trouvée. Choisissez celles à lire.',
        other: '{count} pages trouvées. Choisissez celles à lire.',
      },
      choosingNoCount: 'Pages trouvées. Choisissez celles à lire.',
      reading: {
        one: 'Lecture des pages : {done} sur {count}',
        other: 'Lecture des pages : {done} sur {count}',
      },
      readingNoCount: 'Lecture des pages…',
    },
    hint: 'Cela peut prendre quelques minutes. Vous pouvez continuer à travailler.',
    openSource: 'Ouvrir',
    one: 'Lecture de « {name} » en cours. Vous pouvez continuer à travailler, nous vous préviendrons quand ce sera prêt.',
    many: 'Lecture de {count} sources de connaissances en cours. Vous pouvez continuer à travailler, nous vous préviendrons quand elles seront prêtes.',
    readyToast: '« {name} » est prête. Vos agents peuvent maintenant s’en servir pour répondre.',
    failedToast:
      '« {name} » n’a pas pu être traitée. Ouvrez Connaissances pour voir ce qui s’est passé.',
    choosePages: 'Choisir les pages',
    found: { one: '{count} page trouvée', other: '{count} pages trouvées' },
    read: { one: '{done} page lue sur {count}', other: '{done} pages lues sur {count}' },
    more: '{count} de plus',
  },
  tips: {
    title: 'Que puis-je ajouter, et qu’est-ce qui fonctionne le mieux ?',
    whatTitle: 'Ce que vous pouvez ajouter',
    what: [
      'Votre site web : nous lisons ses pages pour vous. Collez simplement l’adresse, par exemple https://votreentreprise.fr.',
      'Des fichiers PDF : FAQ, grille tarifaire, brochure, carte, fiches produits ou conditions générales.',
    ],
    examplesTitle: 'De bons contenus pour commencer',
    examples: [
      'Les questions fréquentes et leurs réponses',
      'Vos services ou produits, avec les prix si vous les rendez publics',
      'Horaires d’ouverture, adresses et coordonnées',
      'Règles de réservation, de livraison, d’annulation et de remboursement',
    ],
    practicesTitle: 'Bonnes pratiques',
    practices: [
      'Tenez vos contenus à jour. Votre agent répète ce qu’il lit, y compris les anciens prix.',
      'Le texte simple fonctionne le mieux. Les images scannées de texte ne peuvent pas être lues.',
      'Écartez les pages qui ne doivent pas être citées, comme les pages de connexion ou les anciennes offres. Vous pourrez les exclure une fois le site lu.',
    ],
    guideLink: 'Lire le guide pas à pas',
  },
  actions: {
    addWebsite: 'Ajouter un site web',
    addPdf: 'Importer un PDF',
    edit: 'Renommer',
    delete: 'Supprimer la source',
    reprocess: 'Retraiter',
    recrawl: 'Chercher de nouvelles pages',
    viewPages: 'Voir les pages',
    moreActions: 'Plus d’actions pour {name}',
    recrawlSelected: 'Lire les pages sélectionnées',
    disable: 'Désactiver',
    enable: 'Activer',
  },
  rename: {
    title: 'Renommer la source',
    nameLabel: 'Nom',
    save: 'Enregistrer',
    cancel: 'Annuler',
  },
  deleteConfirm: {
    title: 'Supprimer cette source ?',
    description:
      'La source est supprimée de façon logique. Elle ne sera plus utilisée pour les prochains index, mais son historique est conservé.',
    action: 'Supprimer',
    cancel: 'Annuler',
  },
  toast: {
    renamed: 'Source renommée.',
    deleted: 'Source supprimée.',
    reprocessStarted: 'Retraitement lancé.',
    recrawlStarted: 'Recherche de nouvelles pages lancée.',
    recrawlAlreadyRunning: 'Nous cherchons déjà des pages sur ce site.',
    recrawlPagesStarted: 'Lecture des pages sélectionnées lancée.',
    disabled: 'Source désactivée.',
    enabled: 'Source activée.',
  },
  addWebsite: {
    title: 'Ajouter un site web',
    description:
      'Saisissez l’adresse de votre site. Nous trouvons ses pages et les lisons pour votre agent.',
    readMode: {
      label: 'Comment le lire ?',
      allLabel: 'Lire tout le site',
      allBadge: 'Recommandé',
      allDescription: 'Nous lisons toutes les pages trouvées. Vous pourrez en exclure ensuite.',
      chooseLabel: 'Choisir les pages moi-même',
      chooseDescription: 'Nous trouvons d’abord les pages, puis vous choisissez celles à lire.',
    },
    reading: {
      title: 'Lecture de votre site…',
      backgroundNotice:
        'Vous pouvez fermer cette fenêtre. Nous continuons et vous prévenons quand c’est prêt.',
      close: 'Fermer',
    },
    closeReview: {
      title: 'Lire maintenant les {count} pages sélectionnées ?',
      description:
        'La lecture n’a pas encore commencé. Nous pouvons lire les pages sélectionnées maintenant, ou vous pourrez choisir plus tard depuis la liste des connaissances.',
      titleNoCount: 'Lire maintenant les pages sélectionnées ?',
      readAll: 'Lire les pages sélectionnées',
      later: 'Je choisirai plus tard',
    },
    rootUrlLabel: 'URL du site',
    rootUrlPlaceholder: 'https://exemple.fr',
    viewExistingSource: 'Ouvrir la source qui couvre déjà ce site',
    scope: {
      toggle: 'Options avancées',
      maxPagesLabel: 'Nombre maximal de pages',
      maxPagesDescription:
        'Limitez le nombre de pages que nous cherchons. Laissez vide pour utiliser la limite de votre offre.',
      maxPagesPlaceholder: 'ex. 100',
      maxDepthLabel: 'Profondeur maximale des liens',
      maxDepthDescription:
        'Le nombre de liens suivis depuis la page de départ. 0 ne lit que la page de départ.',
      maxDepthPlaceholder: 'ex. 3',
      includePathsLabel: 'Ne lire que ces sections',
      includePathsDescription:
        'Ne lisez que les adresses situées sous ces chemins. La correspondance se fait par segment complet : « /blog » couvre « /blog/article-1 » mais pas « /blogger-inscription ». Laissez vide pour lire tout le site.',
      excludePathsLabel: 'Exclure ces chemins',
      excludePathsDescription:
        'Ignorez les URL situées sous ces chemins. La correspondance se fait par segment complet : « /blog » exclut « /blog/article-1 » mais pas « /blogger-inscription ».',
      addPath: 'Ajouter un chemin',
      removePath: 'Retirer',
      pathPlaceholder: '/blog',
    },
    submit: 'Commencer',
    discovering: {
      title: 'Recherche des pages…',
      description:
        'Nous suivons les liens de ce site pour lister ses pages. Cela peut prendre jusqu’à 10 minutes.',
      elapsed: 'En cours depuis {duration}',
      backgroundNotice:
        'Vous pouvez fermer cette fenêtre et continuer à travailler. Nous continuons, et la barre en haut de l’écran indique où nous en sommes.',
    },
    discoveryFailed: {
      title: 'Nous n’avons pas pu lire ce site',
      description: 'Une erreur est survenue lors de la recherche des pages de ce site.',
    },
    review: {
      title: 'Choisissez les pages à inclure',
      foundOn: 'Trouvées sur {site}',
      selectedCount: '{count} sur {total} sélectionnées',
      preselectedNotice:
        'Toutes les pages sont sélectionnées au départ. Décochez celles dont cet agent ne doit pas apprendre.',
      selectionHint: 'Seules les pages sélectionnées sont lues et ajoutées à cet agent.',
      searchPlaceholder: 'Rechercher par adresse',
      clearSearch: 'Effacer la recherche',
      filters: {
        label: 'Afficher',
        all: 'Toutes ({count})',
        selected: 'Sélectionnées ({count})',
        unselected: 'Non sélectionnées ({count})',
      },
      sectionsLabel: 'Aller à une section',
      selectShown: 'Sélectionner les pages affichées ({count})',
      selectAllPages: 'Tout sélectionner ({count})',
      noMatches: 'Aucune page ne correspond à ces filtres.',
      clearFilters: 'Effacer les filtres',
      filterCount: '{shown} pages affichées sur {total}',
      homePage: 'Page d’accueil',
      duplicate: 'Doublon',
      duplicateNotice: {
        one: '{count} page semble être une copie d’une autre adresse.',
        other: '{count} pages semblent être des copies d’autres adresses.',
      },
      deselectDuplicates: 'Ignorer les doublons',
      truncatedNotice: 'Affichage des {shown} premières pages sur {total} trouvées.',
      loadError: 'Impossible de charger les pages trouvées.',
      extract: 'Lire les pages sélectionnées',
      extractCount: {
        one: 'Lire {count} page',
        other: 'Lire {count} pages',
      },
      nothingSelected: 'Sélectionnez au moins une page pour continuer.',
      slowWarning:
        'Les grandes sélections prennent quelques minutes. Vous pouvez fermer cette fenêtre pendant le traitement.',
      noPages: 'Aucune page n’a été trouvée sur ce site.',
      noPagesDescription: 'Ajoutez plutôt les pages souhaitées par leur adresse.',
      addUrlToggle: 'Ajouter une page non trouvée',
      addUrlLabel: 'Adresse de la page',
      addUrlPlaceholder: 'https://exemple.fr/autre-page',
      addUrlAction: 'Ajouter la page',
      removeUrlHint: 'Retirer de la liste. Pour l’ignorer pour l’instant, décochez plutôt sa case.',
      removeUrlLabel: 'Retirer {url} de la liste',
    },
    extracting: {
      title: 'Lecture de vos pages…',
      description: 'Nous lisons chaque page choisie, une par une.',
      progress: '{done} pages lues sur {total}',
      elapsed: 'En cours depuis {duration}',
      backgroundNotice:
        'Vous pouvez fermer cette fenêtre et continuer à travailler. Nous continuons, et la barre en haut de l’écran indique où nous en sommes.',
    },
    extractionFailed: {
      title: 'Nous n’avons pas pu lire ces pages',
      description: 'Une erreur est survenue lors de la lecture des pages sélectionnées.',
    },
    closeWhileRunning: {
      title: 'Fermer et laisser le traitement se terminer en arrière-plan ?',
      description:
        'Nous continuons sans vous. La barre en haut de chaque écran indique où nous en sommes.',
      confirm: 'Fermer',
      cancel: 'Continuer à suivre',
    },
    done: {
      title: 'Site web ajouté',
      description:
        'Vos pages ont été lues. Votre agent pourra s’en servir dans moins d’une minute.',
      indexedLabel: 'Pages lues',
      failedLabel: 'Pages illisibles',
      skippedLabel: 'Pages ignorées car vides ou en double',
      failedListTitle: 'Pages que nous n’avons pas pu lire',
      moreFailed: 'Et {count} autres. Retrouvez-les toutes dans la liste des pages.',
      reviewPages: 'Voir les pages',
      close: 'Terminé',
    },
    close: 'Annuler',
  },
  addPdf: {
    title: 'Importer un PDF',
    description: 'L’agent va lire ce document et apprendre de son contenu.',
    dropzoneHint: 'Glissez un PDF ici',
    dropzoneActive: 'Déposez pour joindre ce PDF',
    dropzoneWrongType: 'Seuls les fichiers PDF peuvent être importés.',
    limitsHint: 'PDF uniquement, jusqu’à {size} Mo et {pages} pages.',
    tooLarge:
      'Ce fichier fait {size}. La limite est de {limit} Mo. Essayez un fichier plus petit, ou découpez-le en plusieurs parties.',
    submit: 'Importer',
    uploading: 'Import en cours…',
    duplicateSource: 'Ce PDF a déjà été importé sous le nom « {name} ».',
  },
  validation: {
    rootUrlRequired: 'Saisissez l’URL d’un site web.',
    rootUrlInvalid: 'Saisissez une URL valide.',
    rootUrlScheme: 'Saisissez une adresse de site qui commence par http:// ou https://.',
    nameRequired: 'Le nom est obligatoire.',
    maxPagesRange: 'Saisissez un nombre entre 1 et 1000.',
    maxDepthRange: 'Saisissez un nombre entre 0 et 10.',
    pathListTooLong: 'Vous pouvez ajouter jusqu’à 20 chemins.',
  },
  targets: {
    title: 'Périmètre des connaissances',
    description:
      'Choisissez parmi les sources partagées celles que cet agent utilise pour répondre. Cela détermine ce que couvrira son prochain index.',
    modeAll: 'Toutes les sources partagées, y compris celles ajoutées plus tard',
    modeAllDescription: 'Recommandé. Les nouvelles sources sont prises en compte automatiquement.',
    modeSelected: 'Uniquement les sources que je sélectionne',
    modeSelectedDescription:
      'Les sources ajoutées plus tard sont ignorées tant que vous ne les cochez pas ici.',
    selectedCount: '{selected} sur {total} sélectionnées',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    searchPlaceholder: 'Rechercher des sources',
    noSourcesMatch: 'Aucune source ne correspond à votre recherche.',
    saveChanges: 'Enregistrer le périmètre',
    discard: 'Annuler les modifications',
    noSources: 'Il n’y a encore aucune source partagée à sélectionner.',
    truncated: 'Affichage des {shown} premières sources sur {total}.',
    saved: 'Périmètre des connaissances mis à jour.',
    error: 'Le périmètre des connaissances n’a pas pu être chargé.',
  },
  pages: {
    title: 'Pages',
    description: 'Toutes les pages trouvées sur « {name} ».',
    backToKnowledge: 'Retour aux sources de connaissances',
    errorTitle: 'Impossible de charger les pages',
    errorDescription:
      'Une erreur est survenue lors du chargement de ces pages. Veuillez réessayer.',
    empty: 'Aucune page trouvée pour l’instant.',
    noPermissionTitle: 'Autorisation de consultation requise',
    noPermissionDescription: 'Vous n’avez pas l’autorisation de voir les pages de cette source.',
    alreadyListed: 'Cette page est déjà dans la liste.',
    failureReason: {
      notFound: 'Cette page n’existe plus sur le site (erreur {status}).',
      blocked:
        'Le site a refusé l’accès à cette page (erreur {status}). Elle demande peut-être une connexion.',
      rateLimited: 'Le site nous a demandé de ralentir. Réessayez de lire cette page plus tard.',
      serverError:
        'Le site a eu un problème pour afficher cette page (erreur {status}). Réessayez plus tard.',
      httpError: 'Le site a renvoyé une erreur pour cette page (erreur {status}).',
      unknown: 'Nous n’avons pas pu joindre cette page. Réessayez plus tard.',
    },
    reading: {
      description: 'Vous pouvez quitter cette page. Nous continuons.',
      badge: 'Lecture en cours',
    },
    summary: {
      total: 'Pages trouvées',
      indexed: 'Lues',
      notExtracted: 'Pas encore lues',
      failed: 'Illisibles',
      skipped: 'Ignorées car vides ou en double',
      excluded: 'Exclues',
    },
    lastChangedLabel: 'Dernière modification {when}',
    neverChanged: 'jamais',
    httpStatusLabel: 'HTTP {status}',
    pageStatus: {
      discovered: 'Pas encore lue',
      ready: 'Lue',
      failed: 'Échec du traitement',
      low_quality: 'Contenu insuffisant',
      duplicate: 'Contenu en double',
    },
    pageStatusHint: {
      discovered:
        'Nous avons trouvé cette page mais pas encore lu son texte. Cochez-la et cliquez sur « Lire les pages sélectionnées » pour l’ajouter.',
      low_quality:
        'Cette page contenait trop peu de texte pour être utile, elle a donc été ignorée.',
      duplicate:
        'Le contenu de cette page correspond à une autre page de ce site, elle a donc été ignorée.',
    },
    exclusionReason: {
      media:
        'Il s’agit d’une image, d’une vidéo ou d’un fichier, pas d’une page web, elle a donc été écartée.',
      duplicate:
        'Le contenu de cette page correspond à une autre page de ce site, elle a donc été écartée.',
      low_content:
        'Cette page contenait trop peu de texte pour être utile, elle a donc été écartée.',
      robots: 'Ce site demande aux robots de ne pas lire cette page.',
      path_filter: 'Cette page correspond à l’un des chemins que vous avez choisi d’exclure.',
      not_fetched:
        'Nous n’avons pas pu lire cette page la dernière fois. Cochez-la et cliquez sur « Lire les pages sélectionnées » pour réessayer.',
    },
    selectedCount: '{count} sélectionnées',
    selectAllLabel: 'Sélectionner toutes les pages affichées',
    selectionHint:
      'Cocher une page la sélectionne seulement. Rien ne se passe tant que vous ne cliquez pas sur « Lire les pages sélectionnées ».',
    guide: {
      title: 'Comment fonctionne cette page',
      steps: [
        'Toutes les pages trouvées sur votre site sont listées ici. Les pages « Lues » sont celles dont votre agent se sert pour répondre.',
        'Pour ajouter ou actualiser des pages, cochez-les et cliquez sur « Lire les pages sélectionnées ». Cocher seul ne change rien.',
        'Utilisez Exclure pour retirer une page des réponses de votre agent sans la supprimer. Inclure la réintègre.',
        'Certaines pages sont ignorées automatiquement parce qu’elles n’ont presque pas de texte ou en répètent une autre. Vous n’avez rien à faire.',
      ],
      excludeTitle: 'Que faut-il exclure ?',
      excludeExamples: [
        'Les pages de connexion, de compte, de panier et de paiement',
        'Les anciennes actualités, les événements passés et les offres expirées',
        'Les pages juridiques que vous ne voulez pas voir citées, comme la politique de cookies',
        'Les pages sur d’autres entreprises ou des sujets sans rapport',
      ],
    },
    searchPlaceholder: 'Rechercher dans ces pages',
    noMatches: 'Aucune page ne correspond à « {query} ».',
    filterCount: '{shown} pages affichées sur {total}.',
    addUrlHint: 'Il manque une page ? Ajoutez son adresse ici.',
    addUrlPlaceholder: 'https://exemple.fr/autre-page',
    addUrlAction: 'Ajouter l’URL',
    excludedBadge: 'Exclue',
    excludedHint:
      'Votre agent ne se sert pas de cette page. Cliquez sur Inclure pour l’utiliser de nouveau après la prochaine construction de l’index.',
    includeAction: 'Inclure',
    excludeAction: 'Exclure',
    includeTitle: 'Utiliser cette page de nouveau après la prochaine construction de l’index.',
    excludeTitle:
      'Garder cette page dans la liste sans que votre agent s’en serve. Vous pourrez l’inclure de nouveau plus tard.',
    removeAction: 'Retirer',
    removeTitle:
      'Supprimer cette page de la liste. Pour la garder listée sans l’utiliser, utilisez Exclure.',
    removeRowLabel: 'Retirer {url} de cette source',
    recrawlRowLabel: 'Sélectionner {url} pour la lire',
    truncatedNotice:
      'Cette source compte {total} pages, et seules les {shown} premières sont affichées. La recherche et les compteurs ci-dessus ne portent que sur les pages chargées.',
  },
  health: {
    title: 'Santé des connaissances',
    error: 'La santé n’a pas pu être chargée.',
    score: 'Score de santé',
    scoreValue: '{score}/100',
    sources: 'Sources',
    indexedChunks: 'Fragments indexés',
    lastUpdated: 'Dernière mise à jour',
    notAvailable: 'Pas encore',
    noSourcesHint: 'Ajoutez une source pour obtenir un score',
  },
  index: {
    title: 'Index de recherche',
    description:
      'La publication nécessite un index prêt, construit à partir des sources de connaissances de cet agent.',
    buildAction: 'Construire l’index',
    building: 'Construction…',
    buildingNotice:
      'Création de la v{number}. Votre agent continue de répondre avec la version précédente jusqu’à ce que celle-ci soit prête, en général en moins d’une minute.',
    versionLabel: 'v{number}',
    columns: {
      version: 'Version',
      status: 'Statut',
      chunkCount: 'Fragments',
      builtAt: 'Construit',
    },
    status: {
      building: 'En construction',
      ready: 'Prêt',
      failed: 'En échec',
    },
    empty: 'Aucun index n’a encore été construit.',
    emptyDescription:
      'Un index est construit automatiquement une fois les sources traitées, ou vous pouvez en construire un maintenant.',
    error: 'Les index n’ont pas pu être chargés.',
    notBuilt: 'Non construit',
    failure: {
      embedding:
        'Le service d’IA qui lit votre contenu était indisponible. C’est généralement temporaire.',
      vector_store:
        'La base de recherche n’a pas pu enregistrer votre contenu. C’est généralement temporaire.',
      saving: 'Votre contenu a été traité mais n’a pas pu être enregistré.',
      unexpected: 'Un problème est survenu pendant la construction.',
    },
    latestFailed: 'La dernière construction (v{number}) a échoué. {reason}',
    retry: 'Réessayer',
    toast: {
      buildStarted: 'Construction de l’index lancée.',
      buildReady: 'L’index de recherche v{number} est prêt ({chunks} éléments de contenu).',
      buildFailed: 'La création de l’index a échoué. Relancez-la.',
    },
  },
};
