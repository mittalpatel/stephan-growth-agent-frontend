export const agents = {
  title: 'Agents',
  description: 'Les agents IA configurés pour votre organisation.',
  status: {
    active: 'Actif',
    paused: 'En pause',
    archived: 'Archivé',
  },
  levelBasic: 'Niveau 1 · Essentiel',
  freeDuringTrial: 'Gratuit pendant l’essai',
  actions: {
    edit: 'Enregistrer les modifications',
    publish: 'Publier',
    rollback: 'Revenir à cette version',
  },
  columns: {
    name: 'Nom',
    status: 'Statut',
    inboxEmail: 'E-mail de réception',
    updatedAt: 'Mis à jour',
  },
  card: {
    routesTo: 'Transmis à {email}',
    openAgent: 'Ouvrir l’agent',
    updated: 'Mis à jour le {date}',
  },
  capabilities: {
    supports_website_knowledge: 'Connaissances issues du site web',
    supports_pdf_knowledge: 'Connaissances issues de PDF',
    supports_lead_capture: 'Capture de prospects',
    supports_human_handoff: 'Transfert vers une personne',
  },
  types: {
    title: 'Types d’agents',
    description: 'Les types d’agents prévus sur la plateforme.',
    available: 'Disponible',
    comingSoon: 'Bientôt disponible',
    errorTitle: 'Impossible de charger les types d’agents',
    errorDescription:
      'Une erreur est survenue lors du chargement du catalogue. Veuillez réessayer.',
    roadmap: {
      website_sales_support: {
        name: 'Ventes et support du site',
        description:
          'Un assistant commercial IA formé sur les connaissances de votre entreprise, qui guide les visiteurs, répond à leurs questions et capte des prospects qualifiés à toute heure.',
        plannedCapabilities: [],
        upgrade: {
          title: 'Débloquez l’intelligence commerciale',
          bullets: [
            'Enrichir automatiquement les prospects',
            'Identifier les informations sur l’entreprise',
            'Analyser l’intention d’achat',
            'Générer des messages personnalisés',
            'Synchroniser les données enrichies avec votre CRM',
          ],
          cta: 'Passer à Avancé',
        },
        workflow: [
          'Site web et PDF',
          'Exploration et import',
          'Extraction et nettoyage',
          'Index de connaissances',
          'Question du visiteur',
          'Recherche',
          'Réponse sourcée',
          'Historique de conversation',
          'Tableau de bord des prospects',
        ],
      },
      sevo: {
        name: 'SEvO',
        description:
          'Forme votre équipe à l’AEO, au GEO, au SEO et à l’expérience SEvO, et fournit les étapes précises pour devenir visible dans les LLM et la recherche moderne.',
        plannedCapabilities: [
          'Analyse du site web',
          'Analyse SEO',
          'Recommandations AEO',
          'Recommandations GEO',
          'Visibilité dans les LLM',
          'Accompagnement à la mise en œuvre',
        ],
        upgrade: {
          title: 'Débloquez l’automatisation avancée',
          bullets: [
            'Revue automatisée de la mise en œuvre',
            'Suivi continu de la visibilité',
            'Comparaison avec les concurrents',
            'Recommandations prioritaires',
          ],
          cta: 'Découvrir Avancé',
        },
        workflow: [
          'Analyse du site web',
          'Audit recherche et LLM',
          'Points faibles',
          'Recommandations',
          'Étapes de mise en œuvre',
          'Suivi de la visibilité',
        ],
      },
      content_strategy: {
        name: 'Stratégie de contenu',
        description:
          'Construit un plan de contenu hebdomadaire à partir de votre site, de votre base de connaissances et de deux thèmes stratégiques, et produit automatiquement des publications LinkedIn et réseaux sociaux fidèles à votre marque.',
        plannedCapabilities: [
          'Planification hebdomadaire du contenu',
          'Publications LinkedIn',
          'Publications sur les réseaux sociaux',
          'Respect de la marque et du ton',
          'Relecture du contenu',
          'Processus de publication',
        ],
        upgrade: {
          title: 'Débloquez le contenu avancé',
          bullets: [
            'Articles de blog',
            'Newsletters',
            'Contenus d’appel',
            'Campagnes multicanales',
            'Génération de prospects avancée',
          ],
          cta: 'Découvrir Avancé',
        },
        workflow: [
          'Connaissances et thèmes',
          'Plan hebdomadaire',
          'Brouillons de publications',
          'Vérification de la marque et du ton',
          'Relecture et validation',
          'Publication',
        ],
      },
      lead_outreach: {
        name: 'Prospection',
        description:
          'Récupère les prospects Meta Lead Ads, les enrichit et les note, les synchronise avec votre CRM et mène des conversations WhatsApp assistées par l’IA, avec validation humaine intégrée.',
        plannedCapabilities: [
          'Meta Lead Ads',
          'Synchronisation CRM',
          'Notation des prospects',
          'Enrichissement',
          'Conversations WhatsApp',
          'Suivi des prospects',
        ],
        upgrade: {
          title: 'Débloquez l’automatisation avancée',
          bullets: [
            'Séquences de suivi multicanales',
            'Automatisation plus poussée du CRM',
            'Règles de qualification personnalisées',
            'Rapports par campagne',
          ],
          cta: 'Découvrir Avancé',
        },
        workflow: [
          'Meta Lead Ads',
          'Réception des prospects',
          'Enrichissement et notation',
          'Synchronisation CRM',
          'Conversation WhatsApp',
          'Transfert qualifié',
        ],
      },
    },
  },
  marketplace: {
    eyebrow: 'Agents IA',
    title: 'Choisissez les agents qui font grandir votre entreprise',
    description:
      'Tous les agents partagent une même base de connaissances : passer de la vente à la visibilité, au contenu ou à la prospection se fait dans un seul espace connecté.',
    categories: {
      all: 'Tous',
      sales: 'Ventes',
      growth: 'Croissance',
      marketing: 'Marketing',
      automation: 'Automatisation',
    },
    capabilitiesLabel: 'Ce qu’il fait',
    comingSoonNote: 'Pas encore disponible.',
    notProvisioned: 'Non configuré',
    notProvisionedNote:
      'Disponible sur la plateforme, mais pas encore configuré pour votre organisation.',
    emptyCategory: 'Aucun agent dans cette catégorie pour le moment.',
  },
  tiers: {
    level2Eyebrow: 'Niveau 2',
    upgradeTitle: 'Ce qu’apporte le niveau suivant',
    banner: {
      eyebrow: 'Niveau 4 · Sur mesure',
      title: 'Un agent généraliste, conçu sur mesure pour votre marque',
      description:
        'Une fois que votre équipe a prouvé la valeur des agents de base, nous créons un agent entièrement à votre image, formé sur votre entreprise, pour repérer et accélérer vos opportunités.',
      action: 'Parler à notre équipe',
    },
  },
  list: {
    searchPlaceholder: 'Rechercher des agents',
    errorTitle: 'Impossible de charger les agents',
    errorDescription:
      'Une erreur est survenue lors du chargement de vos agents. Veuillez réessayer.',
    emptyTitle: 'Aucun agent pour le moment',
    emptyDescription: 'Aucun agent n’a encore été configuré pour votre organisation.',
    emptyFilteredTitle: 'Aucun agent ne correspond à vos filtres',
    emptyFilteredDescription: 'Essayez de modifier ou d’effacer vos filtres.',
  },
  form: {
    nameLabel: 'Nom',
    inboxEmailLabel: 'E-mail de la boîte de réception humaine',
    statusLabel: 'Statut',
    enabledLanguagesLabel: 'Langues',
    enabledLanguagesDescription:
      'Les langues dans lesquelles cet agent répond. Chaque langue activée doit avoir son message d’accueil, son message de secours et sa mention IA dans l’onglet Brouillon avant que l’agent puisse être republié.',
    enabledLanguagesSearchPlaceholder: 'Rechercher des langues',
    enabledLanguagesSelectAll: 'Tout sélectionner',
    enabledLanguagesDeselectAll: 'Tout désélectionner',
    enabledLanguagesSelectedCount: '{selected} sur {total} sélectionnées',
    enabledLanguagesNoMatches: 'Aucune langue ne correspond à votre recherche.',
    defaultLanguageLabel: 'Langue par défaut',
    defaultLanguageDescription:
      'Utilisée pour le message d’accueil du widget et chaque fois qu’un visiteur écrit dans une langue que cet agent ne prend pas en charge.',
  },
  toast: {
    updated: 'Agent mis à jour.',
    published: 'Agent publié.',
    rolledBack: 'Retour à la version sélectionnée effectué.',
    draftSaved: 'Brouillon enregistré.',
    draftCreateFailed: 'Impossible de créer un nouveau brouillon. Réessayez.',
    publishNoDraft: 'Enregistrez un brouillon avant de publier.',
    publishDisclosureRequired:
      'La mention IA ne peut pas être désactivée. Activez-la avant de publier.',
  },
  validation: {
    nameRequired: 'Le nom est obligatoire.',
    nameTooLong: 'Le nom doit contenir 200 caractères au maximum.',
    emailInvalid: 'Saisissez une adresse e-mail valide.',
    invalidSelection: 'Choisissez l’une des options proposées.',
    listItemRequired: 'Saisissez une valeur ou supprimez cette ligne.',
    listItemTooLong: 'Ce texte est trop long.',
    listTooLong: 'Vous pouvez ajouter jusqu’à 20 éléments.',
    enabledLanguagesRequired: 'Activez au moins une langue.',
    defaultLanguageNotEnabled: 'La langue par défaut doit faire partie des langues activées.',
  },
  detail: {
    backToList: 'Retour aux agents',
    configure: 'Configurer',
    upgrade: 'Passer à l’offre supérieure',
    checklist: {
      title: 'Mettre votre widget en ligne',
      description: 'Ce qu’il reste à faire pour que cet agent réponde aux visiteurs de votre site.',
      stepDraft: 'Modifier votre brouillon',
      stepKnowledge: 'Ajouter des connaissances pour qu’il puisse répondre',
      stepKnowledgeHint:
        'Terminé dès qu’au moins une source a fini d’être traitée. Un site web peut prendre quelques minutes.',
      stepPublish: 'Le publier',
      stepDomain: 'Autoriser le domaine de votre site',
      stepEmbed: 'Obtenir votre code d’intégration',
      goTo: 'Y aller',
      review: 'Revoir',
      progress: '{done} sur {total} terminées',
      allDone: 'Tout est prêt. Cet agent peut être intégré à votre site.',
      next: 'Étape suivante : {step}',
      showAll: 'Voir toutes les étapes',
      hideAll: 'Masquer les étapes',
    },
    tabs: {
      overview: 'Vue d’ensemble',
      conversations: 'Conversations',
      prospects: 'Prospects',
      knowledge: 'Connaissances',
      settings: 'Paramètres',
      draft: 'Brouillon',
      publish: 'Publication',
      test: 'Test',
    },
    tabPurpose: {
      draft:
        'Modifiez ce que dit votre agent et son apparence. Les changements restent privés jusqu’à la publication.',
      publish:
        'Mettez votre dernier brouillon en ligne sur votre site, ou revenez à une version précédente.',
      test: 'Posez des questions à votre agent pour vérifier ses réponses. Il utilise votre brouillon, ou la version en ligne s’il n’y a pas de brouillon.',
    } as Partial<Record<string, string>>,
    overview: {
      title: 'Vue d’ensemble',
      slugLabel: 'Identifiant',
      agentTypeLabel: 'Type d’agent',
      createdAtLabel: 'Créé le',
      cancel: 'Annuler',
      performanceTitle: 'Performance',
      performanceError: 'Impossible de charger la performance de cet agent.',
      noActivity:
        'Aucune activité sur cette période. Les chiffres apparaîtront dès que des visiteurs discuteront avec l’agent sur votre site.',
      capabilitiesTitle: 'Fonctionnalités',
      howItWorksTitle: 'Comment ça marche',
      stepLabel: 'Étape {number}',
    },
    draft: {
      title: 'Brouillon',
      description:
        'Les modifications faites ici restent privées jusqu’à la publication. Les visiteurs ne verront rien de nouveau tant que vous ne publiez pas depuis l’onglet Publication.',
      noDraftYet:
        'Vous ne modifiez rien pour le moment. Commencez une modification pour faire des changements.',
      startEditing: 'Commencer à modifier',
      instructionsLabel: 'Instructions',
      instructionsDescription:
        'Les consignes que cet agent suit dans chaque conversation. Soyez précis sur le ton, le périmètre et ce qu’il ne doit jamais faire.',
      instructionsPlaceholder: 'Décrivez comment cet agent doit se comporter et répondre.',
      disclosureEnabledLabel: 'Indiquer qu’il s’agit d’un agent IA',
      disclosureEnabledDescription:
        'Informe chaque visiteur qu’il parle à une IA. Obligatoire dans la plupart des pays : cette option ne peut pas être désactivée, seulement reformulée.',
      displayNameLabel: 'Nom du bot',
      displayNameDescription:
        'Le nom affiché en haut du widget, différent du nom de l’agent ci-dessus. Laissez vide pour utiliser ce nom.',
      displayNameBlank: 'Saisissez un nom, ou laissez vide pour utiliser le nom de l’agent.',
      localizedTextTitle: 'Messages en {language}',
      localizedTextDescription:
        'Ce que lisent les visiteurs dans cette langue. Le message d’accueil, le message de secours et la mention IA sont obligatoires pour publier.',
      basicsHeading: 'Instructions et identité',
      basicsDescription: 'Comment l’agent se comporte et le nom qu’il porte dans le widget.',
      useDefault: 'Utiliser la valeur par défaut',
      discardChanges: 'Annuler les modifications',
      greetingLabel: 'Message d’accueil',
      greetingDescription: 'Le premier message que voient les visiteurs en ouvrant le widget.',
      greetingPlaceholder: 'Bonjour ! Comment puis-je vous aider ?',
      fallbackMessageLabel: 'Message de secours',
      fallbackMessageDescription:
        'Affiché quand l’agent n’est pas assez sûr de sa réponse, au lieu de deviner.',
      fallbackMessagePlaceholder: 'Je n’ai pas encore de réponse à cette question.',
      disclosureTextLabel: 'Texte de la mention IA',
      disclosureTextDescription: 'Le texte exact de la mention IA affichée dans le widget.',
      disclosureTextPlaceholder: 'Vous discutez avec un agent IA.',
      unsupportedLanguageMessageLabel: 'Message pour les langues non prises en charge (facultatif)',
      unsupportedLanguageMessageDescription:
        'Affiché quand un visiteur écrit dans une langue que cet agent ne prend pas en charge et que « Refuser poliment » est choisi plus bas. Laissez vide pour utiliser le message par défaut.',
      unsupportedLanguageMessagePlaceholder:
        'Désolé, je ne peux pas encore vous aider dans cette langue. Essayez en français.',
      consentTextLabel: 'Texte de consentement pour la capture de prospects (facultatif)',
      consentTextDescription:
        'Affiché au-dessus du formulaire de contact du widget, avant que le visiteur envoie ses coordonnées. Laissez vide pour utiliser le texte par défaut de la plateforme.',
      consentTextPlaceholder:
        'En envoyant ce formulaire, vous acceptez d’être contacté au sujet de votre demande.',
      thankYouTextLabel: 'Message de remerciement après capture (facultatif)',
      thankYouTextDescription:
        'Affiché après l’envoi du formulaire de contact. Laissez vide pour utiliser le texte par défaut de la plateforme.',
      thankYouTextPlaceholder: 'Merci ! Nous revenons vers vous très vite.',
      themeTitle: 'Thème du widget',
      themeColorsHeading: 'Couleurs',
      colorPrimaryLabel: 'Principale',
      colorPrimaryDescription:
        'La couleur principale du widget : en-tête, bouton d’ouverture et liens.',
      colorSecondaryLabel: 'Secondaire',
      colorSecondaryDescription: 'Une couleur d’appoint pour les éléments secondaires.',
      colorBackgroundLabel: 'Arrière-plan',
      colorBackgroundDescription: 'La couleur de fond extérieure du panneau du widget.',
      colorSurfaceLabel: 'Surface',
      colorSurfaceDescription: 'Le fond derrière chaque message et chaque carte.',
      colorTextLabel: 'Texte',
      colorTextDescription: 'La couleur de texte par défaut du widget.',
      colorSuccessLabel: 'Succès',
      colorSuccessDescription:
        'Utilisée pour les messages de confirmation, comme un prospect bien enregistré.',
      colorWarningLabel: 'Avertissement',
      colorWarningDescription: 'Utilisée pour les messages qui demandent l’attention du visiteur.',
      colorErrorLabel: 'Erreur',
      colorErrorDescription: 'Utilisée pour les erreurs, comme un envoi qui a échoué.',
      colorPlaceholder: '#0B1E3D',
      colorMustBeHex: 'Saisissez une couleur hexadécimale comme #0B1E3D.',
      contrastFailing:
        'Trop difficile à lire sur {against} : le contraste est de {ratio} pour 1, il faut au moins 4,5 pour 1.',
      contrastPassing: 'Contraste de {ratio} pour 1 sur {against}.',
      useSuggestedColor: 'Utiliser la couleur suggérée ({color})',
      themeTypographyHeading: 'Typographie',
      typographyFontFamilyLabel: 'Police',
      typographyFontFamilyDescription:
        'La police utilisée dans tout le widget, limitée à une liste sûre pour que le texte s’affiche toujours correctement.',
      typographyFontFamilyOptions: {
        'system-ui': 'Police du système',
        Inter: 'Inter',
        Roboto: 'Roboto',
        'Open Sans': 'Open Sans',
        Lato: 'Lato',
        Montserrat: 'Montserrat',
        'Source Sans Pro': 'Source Sans Pro',
        'Nunito Sans': 'Nunito Sans',
        'Work Sans': 'Work Sans',
        Poppins: 'Poppins',
      },
      themeWidgetHeading: 'Apparence du widget',
      widgetPositionLabel: 'Position du bouton',
      widgetPositionDescription: 'Le coin de l’écran où apparaît le bouton d’ouverture.',
      widgetPositionOptions: {
        bottom_right: 'En bas à droite',
        bottom_left: 'En bas à gauche',
        top_right: 'En haut à droite',
        top_left: 'En haut à gauche',
      },
      widgetLauncherShapeLabel: 'Forme du bouton',
      widgetLauncherShapeDescription: 'La forme du bouton d’ouverture quand le widget est fermé.',
      widgetLauncherShapeOptions: {
        circle: 'Cercle',
        rounded_square: 'Carré arrondi',
        pill: 'Pilule',
      },
      widgetModeLabel: 'Mode de couleur',
      widgetModeDescription:
        'Si le widget utilise toujours un thème clair ou sombre, ou suit le réglage du système du visiteur.',
      widgetModeOptions: {
        light: 'Clair',
        dark: 'Sombre',
        auto: 'Selon le système du visiteur',
      },
      themeLogoHeading: 'Logo',
      logoLogoUrlLabel: 'URL du logo',
      logoLogoUrlDescription: 'Affiché en haut du widget à la place de l’icône par défaut.',
      logoLogoUrlPlaceholder: 'https://votreentreprise.fr/logo.png',
      logoFaviconUrlLabel: 'URL du favicon',
      logoFaviconUrlDescription:
        'Utilisé quand une petite icône carrée est nécessaire, comme dans les aperçus d’onglet du widget. Non rempli automatiquement par « Rétablir les valeurs de l’organisation ».',
      logoFaviconUrlPlaceholder: 'https://votreentreprise.fr/favicon.png',
      resetToOrgDefault: 'Rétablir les valeurs de l’organisation',
      resetToOrgDefaultConfirmTitle: 'Rétablir le thème par défaut de l’organisation ?',
      resetToOrgDefaultConfirmDescription:
        'Tous les champs du thème ci-dessus seront remplacés par l’identité visuelle actuelle de votre organisation. Cela ne s’applique qu’une fois le brouillon enregistré.',
      resetToOrgDefaultFailed: 'Impossible de charger le thème par défaut de l’organisation.',
      livePreviewNote:
        'La bulle de discussion dans le coin de l’écran est un aperçu en direct de votre widget, tel que les visiteurs le verront sur votre site. Chaque modification s’y applique immédiatement, avant même l’enregistrement.',
      previewOpen: 'Ouvrir l’aperçu du widget',
      previewClose: 'Fermer l’aperçu du widget',
      previewInputPlaceholder: 'Écrivez un message…',
      behaviorRuntimeHeading: 'Réglage des réponses',
      behaviorRuntimeDescription:
        'Facultatif. Les valeurs par défaut conviennent à la plupart des agents : ne les modifiez que si vous savez ce dont vous avez besoin.',
      groundednessThresholdLabel: 'Seuil de fiabilité',
      groundednessThresholdDescription:
        'À quel point une réponse doit correspondre à la base de connaissances pour que l’agent la donne, de 0 (répond même avec une correspondance faible) à 1 (ne répond qu’avec une correspondance quasi exacte).',
      groundednessThresholdPlaceholder: 'ex. 0,7',
      groundednessThresholdRange: 'Saisissez un nombre entre 0 et 1.',
      unsupportedLanguageBehaviorLabel: 'Comportement pour les langues non prises en charge',
      unsupportedLanguageBehaviorDescription:
        'Ce que fait l’agent quand un visiteur écrit dans une langue qu’il ne prend pas en charge.',
      unsupportedLanguageBehaviorOptions: {
        answer_in_default_language: 'Répondre dans la langue par défaut',
        polite_decline: 'Refuser poliment',
        escalate_to_human: 'Transférer à une personne',
      },
      retrievalContextTurnsLabel: 'Échanges pris en compte pour la recherche',
      retrievalContextTurnsDescription:
        'Le nombre d’échanges précédents pris en compte lors de la recherche d’une réponse dans la base de connaissances.',
      retrievalContextTurnsPlaceholder: 'ex. 2',
      retrievalContextTurnsRange: 'Saisissez un nombre entier entre 1 et 20.',
      maxHistoryMessagesLabel: 'Nombre maximal de messages en mémoire',
      maxHistoryMessagesDescription:
        'Le nombre de messages précédents que l’agent garde en tête pour la réponse en cours.',
      maxHistoryMessagesPlaceholder: 'ex. 10',
      maxHistoryMessagesRange: 'Saisissez un nombre entier entre 1 et 100.',
      moderationCategoriesLabel: 'Catégories de modération (automutilation)',
      moderationCategoriesDescription:
        'Des catégories de modération supplémentaires vérifiées avant l’envoi d’une réponse, en plus de celles de la plateforme.',
      moderationCategoriesPlaceholder: 'Nom d’une catégorie de modération',
      suggestedQuestionsLabel: 'Questions suggérées',
      suggestedQuestionsDescription:
        'Des questions proposées aux visiteurs pour qu’ils cliquent au lieu d’écrire. 6 maximum.',
      suggestedQuestionsPlaceholder: 'Une question que les visiteurs peuvent choisir',
      suggestedQuestionsTooMany: 'Ajoutez au maximum {limit} questions suggérées.',
      prohibitedClaimsLabel: 'Affirmations interdites',
      prohibitedClaimsDescription:
        'Des affirmations que l’agent ne doit jamais faire, comme des promesses de prix ou des garanties.',
      prohibitedClaimsPlaceholder: 'Une affirmation que cet agent ne doit jamais faire',
      addListItem: 'Ajouter',
      removeListItem: 'Retirer',
      advancedHeading: 'Avancé (développeurs)',
      advancedDescription:
        'Réservé à la configuration technique. La plupart des agents n’en ont jamais besoin.',
      behaviorConfigAdvancedLabel: 'Configuration avancée du comportement (JSON)',
      behaviorConfigAdvancedDescription:
        'Tout autre réglage de comportement non couvert ci-dessus, comme un ton de voix défini pour toute l’organisation dans votre identité visuelle.',
      configPlaceholder: '{}',
      configMustBeObject: 'Saisissez un objet JSON valide, par exemple {}',

      handoffHeading: 'Transfert',
      handoffDescription:
        'Des phrases qui transfèrent immédiatement la conversation à une personne, avant toute réponse de l’agent. À ne pas confondre avec les phrases déclencheuses de la qualification des prospects plus bas, qui proposent plutôt le formulaire de contact.',
      humanHandoffEnabledLabel: 'Autoriser le transfert vers une personne',
      humanHandoffEnabledDescription:
        'Si désactivé, l’agent ne transfère jamais de lui-même et les phrases ci-dessous sont ignorées. Les escalades de sécurité et la prise en main par un opérateur fonctionnent toujours.',
      leadCaptureEnabledLabel: 'Autoriser la capture de prospects',
      leadCaptureEnabledDescription:
        'Si désactivé, l’agent ne propose jamais le formulaire de contact et les phrases déclencheuses ci-dessous sont ignorées.',
      sendInformationEmailEnabledLabel: 'Autoriser les e-mails d’information',
      sendInformationEmailEnabledDescription:
        'Si désactivé, l’agent ne peut pas envoyer par e-mail aux visiteurs les informations qu’ils ont demandées.',
      handoffTriggerPhrasesLabel: 'Phrases déclencheuses',
      handoffTriggerPhrasesDescription:
        'Sans phrase, ce transfert ne se déclenche jamais de lui-même ; l’agent peut quand même transférer quand un visiteur demande explicitement une personne.',
      handoffTriggerPhrasePlaceholder: 'résilier mon abonnement',

      qualificationHeading: 'Qualification des prospects',
      qualificationDescription:
        'Les règles qui déterminent si un prospect capté est qualifié, partiel ou non qualifié. Si tout est laissé vide, chaque prospect reste non qualifié.',
      qualificationTriggerPhrasesLabel: 'Phrases déclencheuses',
      qualificationTriggerPhrasesDescription:
        'Quand un message de visiteur contient l’une de ces phrases, le formulaire de contact est toujours proposé. Sans phrase, l’agent décide quand le proposer.',
      qualificationTriggerPhrasePlaceholder: 'demander un devis',
      qualificationRequiredFieldsLabel: 'Requis pour être qualifié',
      qualificationRequiredFieldsDescription:
        'Un prospect à qui il manque l’un de ces champs reste non qualifié, quel que soit son score. L’e-mail est toujours recueilli, il n’apparaît donc pas ici.',
      qualificationFormRequiredFieldsLabel: 'Obligatoires dans le formulaire',
      qualificationFormRequiredFieldsDescription:
        'Les champs qu’un visiteur doit remplir pour envoyer le formulaire de contact. Restez bref : chaque champ obligatoire réduit le nombre d’envois. Un prospect peut être capté sans les champs requis pour être qualifié, il obtient simplement un score plus bas.',
      qualificationQuestionsLabel: 'Notation',
      qualificationQuestionsDescription:
        'Les points qu’un prospect obtient pour chaque information fournie. Chaque champ ne peut figurer qu’une fois. Le score d’un prospect est la part de ces points obtenue, de 0 à 100.',
      qualificationQuestionsEmpty:
        'Aucune règle de notation pour le moment. Chaque prospect restera non qualifié.',
      qualificationFieldColumn: 'Champ',
      qualificationWeightColumn: 'Points',
      qualificationAddQuestion: 'Ajouter une règle',
      qualificationRemoveQuestion: 'Retirer la règle',
      qualificationQualifiedThresholdLabel: 'Qualifié à partir de',
      qualificationQualifiedThresholdDescription:
        'Le pourcentage du total des points nécessaire pour qu’un prospect soit qualifié.',
      qualificationPartialThresholdLabel: 'Partiel à partir de',
      qualificationPartialThresholdDescription:
        'Le pourcentage du total des points nécessaire pour qu’un prospect soit partiel. Doit être inférieur ou égal au seuil de qualification.',
      qualifiableField: {
        name: 'Nom',
        phone: 'Téléphone',
        interest_note: 'Note d’intérêt',
      },
      qualificationFieldInvalid: 'Choisissez l’un des champs proposés.',
      qualificationFieldDuplicated: 'Ce champ est déjà noté plus haut.',
      qualificationWeightRange: 'Saisissez un nombre entier entre 1 et 100.',
      qualificationThresholdRange: 'Saisissez un nombre entier entre 0 et 100.',
      qualificationTooManyQuestions: 'Vous pouvez ajouter jusqu’à 20 règles de notation.',
      qualificationThresholdsIncomplete: 'Définissez les deux seuils, ou laissez-les vides.',
      qualificationThresholdOrder:
        'Le seuil partiel ne peut pas être supérieur au seuil de qualification.',
      save: 'Enregistrer le brouillon',
      saving: 'Enregistrement…',
      unsavedChanges: 'Vous avez des modifications non enregistrées.',
      leaveConfirmTitle: 'Quitter sans enregistrer ?',
      leaveConfirmDescription:
        'Votre brouillon contient des modifications non enregistrées. Quitter cet onglet les annule.',
      leaveConfirmStay: 'Rester ici',
      leaveConfirmDiscard: 'Annuler les modifications',
      saveBlockedByContrast:
        'Corrigez le contraste des couleurs signalé ci-dessus avant d’enregistrer. Le serveur refuse un enregistrement avec ces couleurs en l’état.',
      loading: 'Chargement du brouillon…',
    },
    publish: {
      title: 'Publication',
      description:
        'Les visiteurs voient toujours la version en ligne. Publier la remplace immédiatement par votre brouillon.',
      draftStatus: 'Brouillon',
      publishedStatus: 'En ligne sur votre site',
      liveBadge: 'En ligne',
      unpublishedBadge: 'Non publié',
      publishedAt: 'Publié le {date}',
      draftHint:
        'Essayez-le dans l’onglet Test avant de publier, pour que les visiteurs ne tombent jamais sur une mauvaise réponse.',
      testFirst: 'Tester d’abord',
      startDraft: 'Commencer un brouillon',
      noDraft: 'Aucune modification non publiée.',
      noPublished: 'Cet agent n’a jamais été publié.',
      publishAction: 'Publier le brouillon',
      publishConfirmTitle: 'Publier ce brouillon ?',
      publishConfirmDescription:
        'Le brouillon devient immédiatement la version en ligne utilisée par les visiteurs.',
      historyTitle: 'Historique des versions',
      versionLabel: 'Version {number}',
      rollbackAction: 'Revenir en arrière',
      rollbackConfirmTitle: 'Revenir à cette version ?',
      rollbackConfirmDescription:
        'La version sélectionnée est republiée et remplace celle qui est actuellement en ligne.',
      rollbackPickerLabel: 'Version à restaurer',
      rollbackPickerPlaceholder: 'Choisir une version',
      rollbackPickerErrorTitle: 'Impossible de charger l’historique des versions',
      rollbackPickerRetry: 'Réessayer',
      rollbackPickerEmpty: 'Aucune version antérieure à restaurer.',
      rollbackVersionByEmail: 'Version {number}, publiée par {email}',
      rollbackVersionUnpublished: 'Version {number}, publiée le {date}',
      rollbackVersionUnknownPublisher: 'un opérateur inconnu',
    },
    test: {
      title: 'Tester votre agent',
      description:
        'Posez les questions que poseraient vos visiteurs. Les réponses viennent de votre brouillon non publié, et rien ici n’est enregistré ni montré aux visiteurs.',
      draftVersion: 'Brouillon v{version}',
      liveDescription:
        'Il n’y a pas de brouillon, vous testez donc la version en ligne que voient les visiteurs. Rien ici n’est enregistré ni montré aux visiteurs.',
      liveVersion: 'Test de la version en ligne v{version}',
      clear: 'Effacer',
      questionLabel: 'Votre question',
      questionPlaceholder: 'Saisissez une question qu’un visiteur pourrait poser…',
      questionRequired: 'Saisissez d’abord une question.',
      keyboardHint: 'Entrée pour poser la question, Maj + Entrée pour aller à la ligne.',
      submit: 'Demander',
      asking: 'Réflexion…',
      youLabel: 'Vous',
      agentLabel: 'Agent',
      greetingLabel: 'Message d’accueil vu en premier par les visiteurs',
      suggestionsLabel: 'Essayez une question suggérée',
      emptyTitle: 'Posez votre première question',
      emptyDescription: 'Voyez comment votre agent répond avant de le publier.',
      independentNote:
        'Chaque question reçoit une réponse indépendante, sans tenir compte des questions précédentes.',
      retry: 'Réessayer',
      errorFallback: 'L’agent n’a pas pu répondre. Veuillez réessayer.',
      confidence: {
        answered: 'Répondu',
        clarify: 'Précision nécessaire',
        fallback: 'Message de secours',
        handoff: 'Transféré',
      },
      confidenceHelp: {
        answered: 'Vos connaissances suffisaient pour répondre.',
        clarify: 'L’agent demanderait d’abord une précision au visiteur.',
        fallback:
          'Rien de pertinent n’a été trouvé, les visiteurs recevraient donc votre message de secours.',
        handoff: 'Cette question serait transmise à une personne de votre équipe.',
      },
      citationsLabel: 'Sources',
      citationsCount: { one: '{count} source', other: '{count} sources' },
      noCitations: 'Aucune source n’a été utilisée pour cette réponse.',
      noDraftTitle: 'Rien à tester pour le moment',
      noDraftDescription:
        'La publication efface le brouillon. Créez-en un nouveau à partir de la version publiée pour continuer à tester.',
      createDraft: 'Créer un brouillon',
      noPermissionTitle: 'Vous ne pouvez pas lancer de tests',
      noPermissionDescription: 'Demandez à un administrateur l’autorisation de tester les agents.',
      citationPage: 'p. {page}',
    },
    notFound: {
      title: 'Agent introuvable',
      description: 'Cet agent n’existe pas ou vous n’y avez pas accès.',
    },
    errorTitle: 'Impossible de charger cet agent',
    errorDescription:
      'Une erreur est survenue lors du chargement de cet agent. Veuillez réessayer.',
  },
  settings: {
    title: 'Paramètres',
    description:
      'Les domaines autorisés, les clés de déploiement et comment intégrer cet agent à un site.',
    noPermissionTitle: 'Autorisation de consultation requise',
    noPermissionDescription: 'Vous n’avez pas l’autorisation de voir les paramètres de cet agent.',
    identity: {
      title: 'Détails de l’agent',
      description:
        'Le nom interne, l’adresse qui reçoit les e-mails de transfert et de prospects, et si l’agent est actif.',
      metadataHeading: 'À propos de cet agent',
      notSet: 'Non défini',
    },
    install: {
      title: 'Installer sur votre site',
      description:
        'Deux étapes : autorisez votre domaine, puis collez le code d’intégration sur votre site.',
      step: 'Étape {number}',
    },
    domains: {
      title: 'Domaines autorisés',
      description:
        'Ajoutez chaque domaine où le widget doit fonctionner. Le widget ne se charge sur aucun autre domaine : ajoutez le vôtre avant de coller le code d’intégration.',
      addedAt: 'Ajouté le {date}',
      hostnameLabel: 'Nom d’hôte',
      hostnamePlaceholder: 'www.exemple.fr',
      add: 'Ajouter le domaine',
      remove: 'Retirer le domaine',
      removeConfirmTitle: 'Retirer ce domaine ?',
      removeConfirmDescription: 'Le widget cessera immédiatement de se charger sur ce nom d’hôte.',
      empty: 'Aucun domaine ajouté pour le moment.',
      added: 'Domaine ajouté.',
      removed: 'Domaine retiré.',
      loadError: 'Impossible de charger les domaines autorisés.',
      validation: {
        hostnameRequired: 'Saisissez un nom d’hôte.',
        hostnameTooLong: 'Le nom d’hôte doit contenir 255 caractères au maximum.',
        hostnameInvalid: 'Saisissez un nom d’hôte valide, comme www.exemple.fr.',
      },
    },
    keys: {
      title: 'Clés émises',
      description:
        'Tous les identifiants émis jusqu’ici, dont un pour chaque code d’intégration généré ci-dessus. Révoquez-en un pour arrêter immédiatement tout widget qui l’utilise.',
      revoke: 'Révoquer',
      createdAt: 'Créée le {date}',
      revokedAt: 'Révoquée le {date}',
      revoked: 'Clé de déploiement révoquée.',
      revokeConfirmTitle: 'Révoquer cette clé de déploiement ?',
      revokeConfirmDescription:
        'Tout widget utilisant cette clé cessera immédiatement de fonctionner.',
      empty: 'Aucune clé émise. Générez un code d’intégration ci-dessus pour en créer une.',
      status: {
        active: 'Active',
        revoked: 'Révoquée',
      },
      loadError: 'Impossible de charger les clés de déploiement.',
    },
    embed: {
      title: 'Obtenir votre code d’intégration',
      description: 'Suivez ces étapes pour ajouter le widget de discussion à votre site.',
      previewShow: 'Aperçu du widget',
      previewHide: 'Masquer l’aperçu',
      previewLoading: 'Chargement de l’aperçu…',
      previewHint:
        'Voici votre widget en ligne, dans le coin de l’écran, tel que le verront les visiteurs. Modifiez son apparence dans l’onglet Brouillon, puis publiez.',
      steps: [
        'Cliquez sur « Générer le code d’intégration » ci-dessous. Une balise script prête à coller est créée, avec son propre identifiant intégré.',
        'Copiez le code tout de suite. Il contient une clé secrète affichée une seule fois.',
        'Collez le code juste avant la balise de fermeture </body> de votre site.',
        'Il ne fonctionne que sur un domaine ajouté ci-dessus.',
      ],
      generate: 'Générer le code d’intégration',
      loadError: 'Impossible de générer le code d’intégration.',
      warning:
        'Ce code contient une nouvelle clé secrète et n’est affiché qu’une fois. Copiez-le maintenant, il ne pourra plus être affiché.',
      snippetLabel: 'Code d’installation',
      copyLabel: 'Copier le code',
      copied: 'Code copié dans le presse-papiers.',
      copyFailed: 'Copie automatique impossible. Sélectionnez et copiez le code manuellement.',
      done: 'Je l’ai enregistré',
    },
  },
};
