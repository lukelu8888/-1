export type CustomerMasterDataLocale = 'en' | 'es' | 'pt' | 'ar';

export type CustomerMasterDataCopy = {
  localeLabel: string;
  languageNames: Record<CustomerMasterDataLocale, string>;
  pageTitle: string;
  pageSubtitle: string;
  pageDescription: string;
  tabs: {
    basic: { label: string; description: string };
    bank: { label: string; description: string };
    people: { label: string; description: string };
    portal: { label: string; description: string };
    documents: { label: string; description: string };
  };
  actions: {
    back: string;
    edit: string;
  };
  profile: {
    title: string;
    description: string;
    editEnterpriseInfo: string;
    cancel: string;
    saveChanges: string;
    companyInformation: string;
    contactInformation: string;
    addressInformation: string;
    companyName: string;
    businessType: string;
    website: string;
    contactPerson: string;
    email: string;
    phone: string;
    mobile: string;
    businessAddress: string;
    required: string;
    notSet: string;
    enterCompanyName: string;
    enterContactPersonName: string;
    enterEmailAddress: string;
    enterPhoneNumber: string;
    enterMobileNumber: string;
    enterBusinessAddress: string;
    noteLabel: string;
    noteText: string;
    validationRequired: string;
    validationEmail: string;
    saveSuccess: string;
    saveQueued: string;
    saveCloudError: string;
    companyColumnTitle: string;
    contactColumnTitle: string;
    businessTypes: {
      Retailer: string;
      Importer: string;
      Wholesaler: string;
      Distributor: string;
      'E-commerce': string;
      Other: string;
    };
  };
  bank: {
    title: string;
    description: string;
    sectionCompany: string;
    sectionSettlement: string;
    sectionAccounts: string;
    sectionPrivate: string;
    companyName: string;
    billingAddress: string;
    taxId: string;
    save: string;
    cancel: string;
    edit: string;
    saveSuccess: string;
    accountType: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    swiftCode: string;
    iban: string;
    currency: string;
    branchAddress: string;
    primaryUse: string;
    paymentNote: string;
    remark: string;
    notSet: string;
    privateNotice: string;
    quotationHint: string;
    localPublicAccount: string;
    usdPublicAccount: string;
    localPrivateAccount: string;
    localIncomingUse: string;
    usdIncomingUse: string;
    localPrivateUse: string;
    types: {
      primary: string;
      alternate: string;
      private: string;
    };
    uses: {
      incoming: string;
      refund: string;
      internal: string;
    };
    placeholders: {
      companyName: string;
      billingAddress: string;
      taxId: string;
      bankName: string;
      accountName: string;
      accountNumber: string;
      swiftCode: string;
      iban: string;
      currency: string;
      branchAddress: string;
      primaryUse: string;
      paymentNote: string;
      remark: string;
    };
  };
  contacts: {
    metrics: {
      total: string;
      totalDesc: string;
      active: string;
      activeDesc: string;
      loginEnabled: string;
      loginEnabledDesc: string;
      owners: string;
      ownersDesc: string;
    };
    title: string;
    description: string;
    syncing: string;
    closeInviteForm: string;
    inviteMember: string;
    fields: {
      fullName: string;
      title: string;
      businessEmail: string;
      loginEmail: string;
    };
    subTabs: {
      people: string;
      access: string;
      roles: string;
    };
    viewModes: {
      list: string;
      org: string;
    };
    filters: {
      searchPeople: string;
      searchAccess: string;
      searchRoles: string;
      roleFilter: string;
      statusFilter: string;
      allRoles: string;
      allStatuses: string;
    };
    actions: {
      invite: string;
      activate: string;
      suspend: string;
      resendInvite: string;
      copyInviteLink: string;
      viewDetails: string;
      updateRole: string;
      openPermissionCenter: string;
      close: string;
      saveRole: string;
    };
    table: {
      contact: string;
      emails: string;
      role: string;
      status: string;
      loginAccess: string;
      actions: string;
      lastLogin: string;
      inviteSent: string;
      enabled: string;
      disabled: string;
      title: string;
      businessEmail: string;
      loginEmail: string;
      roleCode: string;
      roleSummary: string;
      employeeNo: string;
    };
    helperTexts: {
      people: string;
      access: string;
      roles: string;
    };
    dialogs: {
      peopleDetails: string;
      accountDetails: string;
      changeRole: string;
      basicInfo: string;
      contactInfo: string;
      businessSetup: string;
      loginInfo: string;
      securityInfo: string;
      permissionInfo: string;
      currentRole: string;
      changedRole: string;
      roleDescription: string;
      selectRole: string;
      notSelected: string;
      notOpened: string;
    };
    identityTitle: string;
    identityDescription: string;
    roleLabels: {
      Owner: string;
      Purchaser: string;
      Finance: string;
      Viewer: string;
    };
    permissionLabels: {
      manageEnterpriseProfile: string;
      manageMembers: string;
      createInquiries: string;
      viewPrices: string;
      placeOrders: string;
      viewFinanceDocs: string;
      uploadPaymentProof: string;
      viewBillingDetails: string;
      readOnlyAccess: string;
    };
    statusLabels: {
      active: string;
      invited: string;
      suspended: string;
    };
    messages: {
      nameAndLoginRequired: string;
      memberInvited: string;
      memberInvitedQueued: string;
      invitationCopied: string;
      invitationCreateFailed: string;
      accessUpdated: string;
      accessUpdatedQueued: string;
      resendRequiresCustomer: string;
      resendCopied: string;
      resendFailed: string;
      inviteLinkNotReady: string;
      inviteLinkCopied: string;
      teamMemberFallback: string;
      invitationPending: string;
      currentSession: string;
      enterpriseOwnerTitle: string;
    };
  };
  portal: {
    title: string;
    description: string;
    refresh: string;
    demo: string;
    helperTitle: string;
    helperText: string;
    metrics: {
      hubs: string;
      hubsHint: string;
      accounts: string;
      accountsHint: string;
      pending: string;
      pendingHint: string;
      risk: string;
      riskHint: string;
    };
    sections: {
      hubObjects: string;
      overview: string;
      selected: string;
      principles: string;
      accountPool: string;
    };
    empty: {
      hubs: string;
      overview: string;
      accountPool: string;
      selected: string;
    };
    labels: {
      owner: string;
      region: string;
      latestSync: string;
      linkedAccounts: string;
      pendingNotify: string;
      riskCount: string;
      customer: string;
      supplier: string;
      thirdParty: string;
      loginEmail: string;
      organization: string;
      passwordMirror: string;
      phone: string;
      currentStatus: string;
      source: string;
      notifiedAt: string;
      recommendedAction: string;
    };
    actions: {
      copyPassword: string;
      markNotified: string;
      resync: string;
      invalidate: string;
      clear: string;
    };
    principles: {
      p1Title: string;
      p1Text: string;
      p2Title: string;
      p2Text: string;
      p3Title: string;
      p3Text: string;
    };
  };
  documents: {
    title: string;
    defaultsTitle: string;
    edit: string;
    save: string;
    cancel: string;
    saveSuccess: string;
    fields: {
      signer: string;
      email: string;
      phone: string;
      currency: string;
      timezone: string;
      footerNote: string;
    };
    placeholders: {
      signer: string;
      email: string;
      phone: string;
      currency: string;
      timezone: string;
      footerNote: string;
    };
    notSet: string;
  };
};

const languageNames = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
} satisfies Record<CustomerMasterDataLocale, string>;

export const customerMasterDataCopy: Record<CustomerMasterDataLocale, CustomerMasterDataCopy> = {
  en: {
    localeLabel: 'Portal Language',
    languageNames,
    pageTitle: 'Customer Enterprise Center',
    pageSubtitle: 'Basic Information / Bank Accounts / People & Accounts Center',
    pageDescription: 'Maintain customer-facing enterprise records, payment accounts, and team access from one place for your foreign trade ERP portal.',
    tabs: {
      basic: { label: 'Basic Information', description: 'Company profile, contact details, and business address' },
      bank: { label: 'Bank Accounts', description: 'Settlement accounts, SWIFT, IBAN, and billing references' },
      people: { label: 'People & Accounts Center', description: 'Manage contacts, login access, and customer-side roles' },
      portal: { label: 'External Portal Mapping Center', description: 'Map customer logins, linked portals, and third-party access pools' },
      documents: { label: 'Document Defaults', description: 'Default signer, footer, currency, and timezone settings' },
    },
    actions: {
      back: 'Back',
      edit: 'Edit',
    },
    profile: {
      title: 'Basic Information',
      description: 'Manage your company information and contact details',
      editEnterpriseInfo: 'Edit Basic Information',
      cancel: 'Cancel',
      saveChanges: 'Save Changes',
      companyInformation: 'Company Information',
      contactInformation: 'Contact Information',
      addressInformation: 'Address Information',
      companyName: 'Company Name',
      businessType: 'Business Type',
      website: 'Website',
      contactPerson: 'Contact Person',
      email: 'Email',
      phone: 'Phone',
      mobile: 'Mobile',
      businessAddress: 'Business Address',
      required: 'Required',
      notSet: 'Not set',
      enterCompanyName: 'Enter company name',
      enterContactPersonName: 'Enter contact person name',
      enterEmailAddress: 'email@example.com',
      enterPhoneNumber: '+1 (555) 123-4567',
      enterMobileNumber: '+1 (555) 987-6543',
      enterBusinessAddress: 'Enter complete business address',
      noteLabel: 'Note:',
      noteText: 'This information is used when you submit inquiries, quotations, and orders. Keep it current for accurate customer-side processing.',
      validationRequired: 'Please fill in all required fields',
      validationEmail: 'Please enter a valid email address',
      saveSuccess: 'Profile updated successfully!',
      saveQueued: 'Profile saved locally and queued for cloud sync.',
      saveCloudError: 'Failed to save profile to cloud',
      companyColumnTitle: 'Company',
      contactColumnTitle: 'Contact',
      businessTypes: {
        Retailer: 'Retailer',
        Importer: 'Importer',
        Wholesaler: 'Wholesaler',
        Distributor: 'Distributor',
        'E-commerce': 'E-commerce',
        Other: 'Other',
      },
    },
    bank: {
      title: 'Bank Accounts',
      description: 'Maintain the customer company settlement accounts used for deposits, balances, refunds, and finance document matching.',
      sectionCompany: 'Company Billing Identity',
      sectionSettlement: 'Settlement Accounts',
      sectionAccounts: 'Account Details',
      sectionPrivate: 'Private Account',
      companyName: 'Legal Company Name',
      billingAddress: 'Billing Address',
      taxId: 'Tax / VAT / Registration ID',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit Bank Accounts',
      saveSuccess: 'Bank account details saved',
      accountType: 'Account Type',
      bankName: 'Bank Name',
      accountName: 'Account Name',
      accountNumber: 'Account Number',
      swiftCode: 'SWIFT Code',
      iban: 'IBAN',
      currency: 'Currency',
      branchAddress: 'Branch Address',
      primaryUse: 'Primary Use',
      paymentNote: 'Payment Note',
      remark: 'Remark',
      notSet: 'Not set',
      privateNotice: 'Private account information should be handled carefully and only shown to authorized managers.',
      quotationHint: 'Customer settlement instructions can differ by language and scenario. Keep public and internal accounts clearly separated.',
      localPublicAccount: 'Local Public Account',
      usdPublicAccount: 'USD Public Account',
      localPrivateAccount: 'Local Private Account',
      localIncomingUse: 'Local incoming payments',
      usdIncomingUse: 'USD incoming payments',
      localPrivateUse: 'Local private use',
      types: { primary: 'Primary Settlement', alternate: 'Alternate / Refund', private: 'Private Account' },
      uses: { incoming: 'Incoming payments', refund: 'Refunds and adjustments', internal: 'Internal use only' },
      placeholders: {
        companyName: 'Enter your legal entity name',
        billingAddress: 'Enter billing address',
        taxId: 'Enter tax, VAT, or registration number',
        bankName: 'Enter bank name',
        accountName: 'Enter account name',
        accountNumber: 'Enter account number',
        swiftCode: 'Enter SWIFT code',
        iban: 'Enter IBAN if applicable',
        currency: 'USD / EUR / BRL / ...',
        branchAddress: 'Enter branch address',
        primaryUse: 'Describe how this account is used',
        paymentNote: 'Add payment note',
        remark: 'Add internal remark',
      },
    },
    contacts: {
      metrics: {
        total: 'Team Members',
        totalDesc: 'Contacts linked to this customer enterprise',
        active: 'Active Accounts',
        activeDesc: 'Members currently active',
        loginEnabled: 'Login Enabled',
        loginEnabledDesc: 'Accounts allowed to sign in',
        owners: 'Enterprise Owners',
        ownersDesc: 'Members who can manage the enterprise',
      },
      title: 'People & Accounts Center',
      description: 'Manage customer enterprise contacts, login access, and business roles separately from company master data.',
      syncing: 'Syncing...',
      closeInviteForm: 'Close Invite Form',
      inviteMember: 'Invite Member',
      fields: {
        fullName: 'Full name',
        title: 'Title / Position',
        businessEmail: 'Business email',
        loginEmail: 'Login email',
      },
      subTabs: {
        people: 'People Directory',
        access: 'Account Access',
        roles: 'Role Permissions',
      },
      viewModes: {
        list: 'List View',
        org: 'Org View',
      },
      filters: {
        searchPeople: 'Search name / title / email / role',
        searchAccess: 'Search account / login email / role',
        searchRoles: 'Search member / role / permission',
        roleFilter: 'Role Filter',
        statusFilter: 'Status Filter',
        allRoles: 'All Roles',
        allStatuses: 'All Statuses',
      },
      actions: {
        invite: 'Invite',
        activate: 'Activate',
        suspend: 'Suspend',
        resendInvite: 'Resend Invite',
        copyInviteLink: 'Copy Invite Link',
        viewDetails: 'Details',
        updateRole: 'Update Role',
        openPermissionCenter: 'Open Permission Center',
        close: 'Close',
        saveRole: 'Save Role',
      },
      table: {
        contact: 'Contact',
        emails: 'Emails',
        role: 'Role',
        status: 'Status',
        loginAccess: 'Login Access',
        actions: 'Actions',
        lastLogin: 'Last login',
        inviteSent: 'Invite sent',
        enabled: 'Enabled',
        disabled: 'Disabled',
        title: 'Title',
        businessEmail: 'Business Email',
        loginEmail: 'Login Email',
        roleCode: 'Role Code',
        roleSummary: 'Role Summary',
        employeeNo: 'No.',
      },
      helperTexts: {
        people: 'Keep member records reusable for orders, approvals, directories, and customer-side collaboration.',
        access: 'Manage login availability, invitation links, and account security from one list.',
        roles: 'Align customer-side responsibilities and permissions clearly by business role.',
      },
      dialogs: {
        peopleDetails: 'People Details',
        accountDetails: 'Account Details',
        changeRole: 'Change Role',
        basicInfo: 'Basic Info',
        contactInfo: 'Contact Info',
        businessSetup: 'Business Setup',
        loginInfo: 'Login Info',
        securityInfo: 'Security Info',
        permissionInfo: 'Permission Info',
        currentRole: 'Current Role',
        changedRole: 'Changed Role',
        roleDescription: 'Role Description',
        selectRole: 'Select New Role',
        notSelected: 'Not Selected',
        notOpened: 'Not Opened',
      },
      identityTitle: 'Current Account Identity',
      identityDescription: 'Keep the current signed-in user profile separate from enterprise contacts and permissions.',
      roleLabels: {
        Owner: 'Owner',
        Purchaser: 'Purchaser',
        Finance: 'Finance',
        Viewer: 'Viewer',
      },
      permissionLabels: {
        manageEnterpriseProfile: 'Manage enterprise profile',
        manageMembers: 'Manage members',
        createInquiries: 'Create inquiries',
        viewPrices: 'View prices',
        placeOrders: 'Place orders',
        viewFinanceDocs: 'View finance documents',
        uploadPaymentProof: 'Upload payment proof',
        viewBillingDetails: 'View billing details',
        readOnlyAccess: 'Read-only access',
      },
      statusLabels: {
        active: 'Active',
        invited: 'Invited',
        suspended: 'Suspended',
      },
      messages: {
        nameAndLoginRequired: 'Name and login email are required',
        memberInvited: 'Member invited to enterprise account center',
        memberInvitedQueued: 'Member invited locally and queued for cloud sync',
        invitationCopied: 'Invitation link copied. Share it with the new member to activate the account.',
        invitationCreateFailed: 'Failed to create invitation link',
        accessUpdated: 'Member access updated',
        accessUpdatedQueued: 'Member changes saved locally and queued for cloud sync',
        resendRequiresCustomer: 'Customer account context is required to resend invitations',
        resendCopied: 'Fresh invite link copied for',
        resendFailed: 'Failed to resend invite',
        inviteLinkNotReady: 'Invite link is not ready yet',
        inviteLinkCopied: 'Invite link copied',
        teamMemberFallback: 'Team Member',
        invitationPending: 'Invitation pending',
        currentSession: 'Current session',
        enterpriseOwnerTitle: 'Enterprise Owner',
      },
    },
    portal: {
      title: 'External Portal Mapping Center',
      description: 'Use the customer enterprise as the hub object and map linked customer, supplier, and third-party access pools in one place.',
      refresh: 'Refresh Mirror',
      demo: 'Structure Preview',
      helperTitle: 'Hub-first portal mapping',
      helperText: 'The page focuses on the enterprise hub object first, then shows the external account pools attached beneath it.',
      metrics: {
        hubs: 'Hub Objects',
        hubsHint: 'Customer-side hub records',
        accounts: 'External Accounts',
        accountsHint: 'Linked accounts across all pools',
        pending: 'Pending Notice',
        pendingHint: 'Synced but not yet notified',
        risk: 'Risk Mirrors',
        riskHint: 'Invalid or cleared mappings',
      },
      sections: {
        hubObjects: 'Hub Objects',
        overview: 'Hub Mapping Overview',
        selected: 'Selected External Account',
        principles: 'Why This Layout',
        accountPool: 'Account Pool',
      },
      empty: {
        hubs: 'No hub objects yet',
        overview: 'Select a hub object to review the attached external account pools.',
        accountPool: 'No accounts in this pool',
        selected: 'Select an external account to review details and suggested actions.',
      },
      labels: {
        owner: 'Owner',
        region: 'Region',
        latestSync: 'Latest Sync',
        linkedAccounts: 'Linked Accounts',
        pendingNotify: 'Pending Notice',
        riskCount: 'Risk Count',
        customer: 'Customer',
        supplier: 'Supplier',
        thirdParty: 'Third Party',
        loginEmail: 'Login Email',
        organization: 'Organization',
        passwordMirror: 'Password Mirror',
        phone: 'Phone',
        currentStatus: 'Current Status',
        source: 'Source',
        notifiedAt: 'Notified At',
        recommendedAction: 'Recommended Action',
      },
      actions: {
        copyPassword: 'Copy Password',
        markNotified: 'Mark Notified',
        resync: 'Resync',
        invalidate: 'Mark Invalid',
        clear: 'Clear Mirror',
      },
      principles: {
        p1Title: '1. Focus on the hub object first',
        p1Text: 'Review which external objects are attached to the customer enterprise before diving into single account details.',
        p2Title: '2. Upgrade from single password to account pools',
        p2Text: 'Customer, supplier, and third-party access can coexist, so the layout manages them as linked pools.',
        p3Title: '3. Layer operations by object level',
        p3Text: 'The hub gives the overview, the pool shows scale, and the single account exposes the next action.',
      },
    },
    documents: {
      title: 'Document Defaults',
      defaultsTitle: 'Document Defaults',
      edit: 'Edit · Edit',
      save: 'Save',
      cancel: 'Cancel',
      saveSuccess: 'Document defaults saved',
      fields: {
        signer: 'Default Signer',
        email: 'Default Email',
        phone: 'Default Phone',
        currency: 'Default Currency',
        timezone: 'Default Timezone',
        footerNote: 'Default Footer Note',
      },
      placeholders: {
        signer: 'Enter default signer',
        email: 'docs@example.com',
        phone: '+1 555 123 4567',
        currency: 'USD',
        timezone: 'UTC',
        footerNote: 'Enter default footer note',
      },
      notSet: 'Not set',
    },
  },
  es: {
    localeLabel: 'Idioma del portal',
    languageNames,
    pageTitle: 'Centro Empresarial del Cliente',
    pageSubtitle: 'Información básica / Cuentas bancarias / Centro de personas y cuentas',
    pageDescription: 'Mantenga en un solo lugar los datos empresariales orientados al cliente, las cuentas de cobro y el acceso del equipo dentro del portal ERP de comercio exterior.',
    tabs: {
      basic: { label: 'Información básica', description: 'Perfil de la empresa, contactos y dirección comercial' },
      bank: { label: 'Cuentas bancarias', description: 'Cuentas de cobro, SWIFT, IBAN y referencias de facturación' },
      people: { label: 'Centro de personas y cuentas', description: 'Gestione contactos, accesos y roles del lado del cliente' },
      portal: { label: 'Centro de mapeo de portales', description: 'Mapee accesos del cliente, portales vinculados y cuentas de terceros' },
      documents: { label: 'Valores por defecto de documentos', description: 'Firmante, pie de página, moneda y zona horaria predeterminados' },
    },
    actions: {
      back: 'Volver',
      edit: 'Editar',
    },
    profile: {
      title: 'Información básica',
      description: 'Gestione la información de su empresa y los datos de contacto',
      editEnterpriseInfo: 'Editar información básica',
      cancel: 'Cancelar',
      saveChanges: 'Guardar cambios',
      companyInformation: 'Información de la empresa',
      contactInformation: 'Información de contacto',
      addressInformation: 'Información de dirección',
      companyName: 'Nombre de la empresa',
      businessType: 'Tipo de negocio',
      website: 'Sitio web',
      contactPerson: 'Persona de contacto',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      mobile: 'Móvil',
      businessAddress: 'Dirección comercial',
      required: 'Obligatorio',
      notSet: 'Sin definir',
      enterCompanyName: 'Ingrese el nombre de la empresa',
      enterContactPersonName: 'Ingrese el nombre del contacto',
      enterEmailAddress: 'correo@empresa.com',
      enterPhoneNumber: '+34 600 123 456',
      enterMobileNumber: '+34 600 987 654',
      enterBusinessAddress: 'Ingrese la dirección comercial completa',
      noteLabel: 'Nota:',
      noteText: 'Esta información se utiliza cuando envía consultas, cotizaciones y pedidos. Manténgala actualizada para un procesamiento correcto del lado del cliente.',
      validationRequired: 'Complete todos los campos obligatorios',
      validationEmail: 'Ingrese un correo electrónico válido',
      saveSuccess: 'Perfil actualizado correctamente',
      saveQueued: 'El perfil se guardó localmente y quedó en cola para sincronización en la nube.',
      saveCloudError: 'No se pudo guardar el perfil en la nube',
      companyColumnTitle: 'Empresa',
      contactColumnTitle: 'Contacto',
      businessTypes: {
        Retailer: 'Minorista',
        Importer: 'Importador',
        Wholesaler: 'Mayorista',
        Distributor: 'Distribuidor',
        'E-commerce': 'Comercio electrónico',
        Other: 'Otro',
      },
    },
    bank: {
      title: 'Cuentas bancarias',
      description: 'Mantenga las cuentas de cobro de la empresa cliente para anticipos, saldos, reembolsos y conciliación financiera.',
      sectionCompany: 'Identidad fiscal de facturación',
      sectionSettlement: 'Cuentas de liquidación',
      sectionAccounts: 'Detalle de cuentas',
      sectionPrivate: 'Cuenta privada',
      companyName: 'Razón social',
      billingAddress: 'Dirección de facturación',
      taxId: 'NIF / IVA / Registro',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar cuentas bancarias',
      saveSuccess: 'Datos bancarios guardados',
      accountType: 'Tipo de cuenta',
      bankName: 'Banco',
      accountName: 'Titular de la cuenta',
      accountNumber: 'Número de cuenta',
      swiftCode: 'Código SWIFT',
      iban: 'IBAN',
      currency: 'Moneda',
      branchAddress: 'Dirección de la sucursal',
      primaryUse: 'Uso principal',
      paymentNote: 'Nota de pago',
      remark: 'Observación',
      notSet: 'Sin definir',
      privateNotice: 'La información de la cuenta privada debe tratarse con cuidado y mostrarse solo a gestores autorizados.',
      quotationHint: 'Las instrucciones de cobro pueden variar según idioma y escenario. Mantenga separadas las cuentas públicas e internas.',
      localPublicAccount: 'Cuenta pública local',
      usdPublicAccount: 'Cuenta pública en USD',
      localPrivateAccount: 'Cuenta privada local',
      localIncomingUse: 'Cobros locales',
      usdIncomingUse: 'Cobros en USD',
      localPrivateUse: 'Uso privado local',
      types: { primary: 'Cuenta principal', alternate: 'Alternativa / reembolsos', private: 'Cuenta privada' },
      uses: { incoming: 'Cobros recibidos', refund: 'Reembolsos y ajustes', internal: 'Solo uso interno' },
      placeholders: {
        companyName: 'Ingrese la razón social',
        billingAddress: 'Ingrese la dirección de facturación',
        taxId: 'Ingrese el NIF, IVA o registro',
        bankName: 'Ingrese el banco',
        accountName: 'Ingrese el titular',
        accountNumber: 'Ingrese el número de cuenta',
        swiftCode: 'Ingrese el SWIFT',
        iban: 'Ingrese el IBAN si aplica',
        currency: 'USD / EUR / BRL / ...',
        branchAddress: 'Ingrese la dirección de la sucursal',
        primaryUse: 'Describa el uso de esta cuenta',
        paymentNote: 'Agregue una nota de pago',
        remark: 'Agregue una observación interna',
      },
    },
    contacts: {
      metrics: {
        total: 'Miembros del equipo',
        totalDesc: 'Contactos vinculados a esta empresa cliente',
        active: 'Cuentas activas',
        activeDesc: 'Miembros actualmente activos',
        loginEnabled: 'Acceso habilitado',
        loginEnabledDesc: 'Cuentas autorizadas para iniciar sesión',
        owners: 'Propietarios de la empresa',
        ownersDesc: 'Miembros con capacidad de administrar la empresa',
      },
      title: 'Centro de personas y cuentas',
      description: 'Gestione contactos empresariales, accesos y roles comerciales por separado de los datos maestros de la empresa.',
      syncing: 'Sincronizando...',
      closeInviteForm: 'Cerrar formulario',
      inviteMember: 'Invitar miembro',
      fields: {
        fullName: 'Nombre completo',
        title: 'Cargo / puesto',
        businessEmail: 'Correo corporativo',
        loginEmail: 'Correo de acceso',
      },
      subTabs: {
        people: 'Directorio de personas',
        access: 'Acceso a cuentas',
        roles: 'Permisos por rol',
      },
      viewModes: {
        list: 'Vista de lista',
        org: 'Vista organizativa',
      },
      filters: {
        searchPeople: 'Buscar nombre / cargo / correo / rol',
        searchAccess: 'Buscar cuenta / correo de acceso / rol',
        searchRoles: 'Buscar miembro / rol / permiso',
        roleFilter: 'Filtro de rol',
        statusFilter: 'Filtro de estado',
        allRoles: 'Todos los roles',
        allStatuses: 'Todos los estados',
      },
      actions: {
        invite: 'Invitar',
        activate: 'Activar',
        suspend: 'Suspender',
        resendInvite: 'Reenviar invitación',
        copyInviteLink: 'Copiar enlace',
        viewDetails: 'Detalle',
        updateRole: 'Actualizar rol',
        openPermissionCenter: 'Abrir centro de permisos',
        close: 'Cerrar',
        saveRole: 'Guardar rol',
      },
      table: {
        contact: 'Contacto',
        emails: 'Correos',
        role: 'Rol',
        status: 'Estado',
        loginAccess: 'Acceso',
        actions: 'Acciones',
        lastLogin: 'Último acceso',
        inviteSent: 'Invitación enviada',
        enabled: 'Habilitado',
        disabled: 'Deshabilitado',
        title: 'Cargo',
        businessEmail: 'Correo corporativo',
        loginEmail: 'Correo de acceso',
        roleCode: 'Código de rol',
        roleSummary: 'Resumen del rol',
        employeeNo: 'N.º',
      },
      helperTexts: {
        people: 'Mantenga fichas reutilizables para pedidos, aprobaciones, directorios y colaboración del lado del cliente.',
        access: 'Administre acceso, enlaces de invitación y seguridad de cuentas desde una sola lista.',
        roles: 'Alinee claramente las responsabilidades y permisos del cliente por rol de negocio.',
      },
      dialogs: {
        peopleDetails: 'Detalle de personas',
        accountDetails: 'Detalle de cuenta',
        changeRole: 'Cambiar rol',
        basicInfo: 'Información básica',
        contactInfo: 'Información de contacto',
        businessSetup: 'Configuración comercial',
        loginInfo: 'Información de acceso',
        securityInfo: 'Información de seguridad',
        permissionInfo: 'Información de permisos',
        currentRole: 'Rol actual',
        changedRole: 'Nuevo rol',
        roleDescription: 'Descripción del rol',
        selectRole: 'Seleccione un nuevo rol',
        notSelected: 'Sin seleccionar',
        notOpened: 'No habilitada',
      },
      identityTitle: 'Identidad de la cuenta actual',
      identityDescription: 'Mantenga separado el perfil del usuario conectado de los contactos y permisos de la empresa.',
      roleLabels: {
        Owner: 'Propietario',
        Purchaser: 'Compras',
        Finance: 'Finanzas',
        Viewer: 'Visualizador',
      },
      permissionLabels: {
        manageEnterpriseProfile: 'Gestionar perfil empresarial',
        manageMembers: 'Gestionar miembros',
        createInquiries: 'Crear consultas',
        viewPrices: 'Ver precios',
        placeOrders: 'Realizar pedidos',
        viewFinanceDocs: 'Ver documentos financieros',
        uploadPaymentProof: 'Subir comprobantes de pago',
        viewBillingDetails: 'Ver datos de facturación',
        readOnlyAccess: 'Acceso de solo lectura',
      },
      statusLabels: {
        active: 'Activo',
        invited: 'Invitado',
        suspended: 'Suspendido',
      },
      messages: {
        nameAndLoginRequired: 'El nombre y el correo de acceso son obligatorios',
        memberInvited: 'Miembro invitado al centro de cuentas',
        memberInvitedQueued: 'Miembro invitado localmente y en cola para sincronización',
        invitationCopied: 'Enlace de invitación copiado. Compártalo para activar la cuenta.',
        invitationCreateFailed: 'No se pudo crear el enlace de invitación',
        accessUpdated: 'Acceso del miembro actualizado',
        accessUpdatedQueued: 'Cambios guardados localmente y en cola para sincronización',
        resendRequiresCustomer: 'Se requiere contexto de cuenta cliente para reenviar invitaciones',
        resendCopied: 'Se copió un enlace nuevo para',
        resendFailed: 'No se pudo reenviar la invitación',
        inviteLinkNotReady: 'El enlace aún no está listo',
        inviteLinkCopied: 'Enlace copiado',
        teamMemberFallback: 'Miembro del equipo',
        invitationPending: 'Invitación pendiente',
        currentSession: 'Sesión actual',
        enterpriseOwnerTitle: 'Propietario de la empresa',
      },
    },
    portal: {
      title: 'Centro de mapeo de portales',
      description: 'Use la empresa cliente como objeto central y vincule en un solo lugar las cuentas del cliente, proveedores y terceros.',
      refresh: 'Actualizar espejo',
      demo: 'Vista estructural',
      helperTitle: 'Mapeo centrado en el objeto principal',
      helperText: 'La página primero muestra la empresa cliente como objeto eje y después los grupos de cuentas externas vinculadas.',
      metrics: {
        hubs: 'Objetos eje',
        hubsHint: 'Registros principales del lado cliente',
        accounts: 'Cuentas externas',
        accountsHint: 'Cuentas vinculadas en todos los grupos',
        pending: 'Pendientes de aviso',
        pendingHint: 'Sincronizadas pero no notificadas',
        risk: 'Espejos de riesgo',
        riskHint: 'Mapeos inválidos o limpiados',
      },
      sections: {
        hubObjects: 'Objetos eje',
        overview: 'Resumen del mapeo',
        selected: 'Cuenta externa seleccionada',
        principles: 'Principios del diseño',
        accountPool: 'Grupo de cuentas',
      },
      empty: {
        hubs: 'Aún no hay objetos eje',
        overview: 'Seleccione un objeto eje para revisar las cuentas externas vinculadas.',
        accountPool: 'No hay cuentas en este grupo',
        selected: 'Seleccione una cuenta externa para revisar detalles y acciones sugeridas.',
      },
      labels: {
        owner: 'Responsable',
        region: 'Región',
        latestSync: 'Última sincronización',
        linkedAccounts: 'Cuentas vinculadas',
        pendingNotify: 'Pendientes',
        riskCount: 'Riesgo',
        customer: 'Cliente',
        supplier: 'Proveedor',
        thirdParty: 'Tercero',
        loginEmail: 'Correo de acceso',
        organization: 'Organización',
        passwordMirror: 'Espejo de contraseña',
        phone: 'Teléfono',
        currentStatus: 'Estado actual',
        source: 'Origen',
        notifiedAt: 'Notificado',
        recommendedAction: 'Acción sugerida',
      },
      actions: {
        copyPassword: 'Copiar contraseña',
        markNotified: 'Marcar notificado',
        resync: 'Resincronizar',
        invalidate: 'Marcar inválido',
        clear: 'Limpiar espejo',
      },
      principles: {
        p1Title: '1. Priorice el objeto eje',
        p1Text: 'Revise primero qué objetos externos cuelgan de la empresa cliente antes de entrar al detalle de una cuenta.',
        p2Title: '2. Pase de una contraseña a grupos de cuentas',
        p2Text: 'Cliente, proveedor y tercero pueden coexistir, por eso el diseño los gestiona como grupos conectados.',
        p3Title: '3. Capas de operación por nivel',
        p3Text: 'El eje da la visión global, el grupo muestra escala y la cuenta individual expone la siguiente acción.',
      },
    },
    documents: {
      title: 'Valores por defecto de documentos',
      defaultsTitle: 'Valores por defecto de documentos',
      edit: 'Editar · Edit',
      save: 'Guardar',
      cancel: 'Cancelar',
      saveSuccess: 'Valores por defecto guardados',
      fields: {
        signer: 'Firmante predeterminado',
        email: 'Correo predeterminado',
        phone: 'Teléfono predeterminado',
        currency: 'Moneda predeterminada',
        timezone: 'Zona horaria predeterminada',
        footerNote: 'Nota predeterminada del pie',
      },
      placeholders: {
        signer: 'Ingrese firmante predeterminado',
        email: 'docs@empresa.com',
        phone: '+34 600 123 456',
        currency: 'USD',
        timezone: 'UTC',
        footerNote: 'Ingrese la nota del pie',
      },
      notSet: 'Sin definir',
    },
  },
  pt: {
    localeLabel: 'Idioma do portal',
    languageNames,
    pageTitle: 'Central Empresarial do Cliente',
    pageSubtitle: 'Informações básicas / Contas bancárias / Central de pessoas e contas',
    pageDescription: 'Mantenha em um só lugar os dados empresariais voltados ao cliente, as contas financeiras e o acesso da equipe no portal ERP de comércio exterior.',
    tabs: {
      basic: { label: 'Informações básicas', description: 'Perfil da empresa, contatos e endereço comercial' },
      bank: { label: 'Contas bancárias', description: 'Contas de recebimento, SWIFT, IBAN e referências fiscais' },
      people: { label: 'Central de pessoas e contas', description: 'Gerencie contatos, acessos e funções do lado do cliente' },
      portal: { label: 'Central de mapeamento de portais', description: 'Mapeie logins do cliente, portais vinculados e contas de terceiros' },
      documents: { label: 'Padrões de documentos', description: 'Assinante, rodapé, moeda e fuso horário padrão' },
    },
    actions: {
      back: 'Voltar',
      edit: 'Editar',
    },
    profile: {
      title: 'Informações básicas',
      description: 'Gerencie as informações da empresa e os dados de contato',
      editEnterpriseInfo: 'Editar informações básicas',
      cancel: 'Cancelar',
      saveChanges: 'Salvar alterações',
      companyInformation: 'Informações da empresa',
      contactInformation: 'Informações de contato',
      addressInformation: 'Informações de endereço',
      companyName: 'Nome da empresa',
      businessType: 'Tipo de negócio',
      website: 'Site',
      contactPerson: 'Pessoa de contato',
      email: 'E-mail',
      phone: 'Telefone',
      mobile: 'Celular',
      businessAddress: 'Endereço comercial',
      required: 'Obrigatório',
      notSet: 'Não definido',
      enterCompanyName: 'Informe o nome da empresa',
      enterContactPersonName: 'Informe o nome do contato',
      enterEmailAddress: 'email@empresa.com',
      enterPhoneNumber: '+55 11 4000-1234',
      enterMobileNumber: '+55 11 99999-1234',
      enterBusinessAddress: 'Informe o endereço comercial completo',
      noteLabel: 'Observação:',
      noteText: 'Estas informações são usadas ao enviar consultas, cotações e pedidos. Mantenha tudo atualizado para um processamento correto no lado do cliente.',
      validationRequired: 'Preencha todos os campos obrigatórios',
      validationEmail: 'Informe um e-mail válido',
      saveSuccess: 'Perfil atualizado com sucesso',
      saveQueued: 'O perfil foi salvo localmente e ficou na fila para sincronização em nuvem.',
      saveCloudError: 'Falha ao salvar o perfil na nuvem',
      companyColumnTitle: 'Empresa',
      contactColumnTitle: 'Contato',
      businessTypes: {
        Retailer: 'Varejista',
        Importer: 'Importador',
        Wholesaler: 'Atacadista',
        Distributor: 'Distribuidor',
        'E-commerce': 'E-commerce',
        Other: 'Outro',
      },
    },
    bank: {
      title: 'Contas bancárias',
      description: 'Mantenha as contas financeiras da empresa cliente para adiantamentos, saldos, reembolsos e conciliação documental.',
      sectionCompany: 'Identidade fiscal de cobrança',
      sectionSettlement: 'Contas de liquidação',
      sectionAccounts: 'Detalhes das contas',
      sectionPrivate: 'Conta privada',
      companyName: 'Razão social',
      billingAddress: 'Endereço de faturamento',
      taxId: 'CNPJ / IVA / Registro',
      save: 'Salvar',
      cancel: 'Cancelar',
      edit: 'Editar contas bancárias',
      saveSuccess: 'Dados bancários salvos',
      accountType: 'Tipo de conta',
      bankName: 'Banco',
      accountName: 'Titular da conta',
      accountNumber: 'Número da conta',
      swiftCode: 'Código SWIFT',
      iban: 'IBAN',
      currency: 'Moeda',
      branchAddress: 'Endereço da agência',
      primaryUse: 'Uso principal',
      paymentNote: 'Observação de pagamento',
      remark: 'Observação',
      notSet: 'Não definido',
      privateNotice: 'As informações da conta privada devem ser tratadas com cuidado e exibidas apenas a gestores autorizados.',
      quotationHint: 'As instruções financeiras podem variar por idioma e cenário. Mantenha contas públicas e internas bem separadas.',
      localPublicAccount: 'Conta pública local',
      usdPublicAccount: 'Conta pública em USD',
      localPrivateAccount: 'Conta privada local',
      localIncomingUse: 'Recebimentos locais',
      usdIncomingUse: 'Recebimentos em USD',
      localPrivateUse: 'Uso privado local',
      types: { primary: 'Conta principal', alternate: 'Alternativa / reembolso', private: 'Conta privada' },
      uses: { incoming: 'Recebimentos', refund: 'Reembolsos e ajustes', internal: 'Somente uso interno' },
      placeholders: {
        companyName: 'Informe a razão social',
        billingAddress: 'Informe o endereço de faturamento',
        taxId: 'Informe CNPJ, IVA ou registro',
        bankName: 'Informe o banco',
        accountName: 'Informe o titular',
        accountNumber: 'Informe o número da conta',
        swiftCode: 'Informe o código SWIFT',
        iban: 'Informe o IBAN se aplicável',
        currency: 'USD / EUR / BRL / ...',
        branchAddress: 'Informe o endereço da agência',
        primaryUse: 'Descreva o uso desta conta',
        paymentNote: 'Adicione observação de pagamento',
        remark: 'Adicione observação interna',
      },
    },
    contacts: {
      metrics: {
        total: 'Membros da equipe',
        totalDesc: 'Contatos vinculados a esta empresa cliente',
        active: 'Contas ativas',
        activeDesc: 'Membros atualmente ativos',
        loginEnabled: 'Login habilitado',
        loginEnabledDesc: 'Contas autorizadas a entrar',
        owners: 'Proprietários da empresa',
        ownersDesc: 'Membros que podem administrar a empresa',
      },
      title: 'Central de pessoas e contas',
      description: 'Gerencie contatos empresariais, acesso de login e papéis de negócio separadamente dos dados mestres da empresa.',
      syncing: 'Sincronizando...',
      closeInviteForm: 'Fechar formulário',
      inviteMember: 'Convidar membro',
      fields: {
        fullName: 'Nome completo',
        title: 'Cargo / função',
        businessEmail: 'E-mail corporativo',
        loginEmail: 'E-mail de acesso',
      },
      subTabs: {
        people: 'Diretório de pessoas',
        access: 'Acesso à conta',
        roles: 'Permissões por função',
      },
      viewModes: {
        list: 'Visualização em lista',
        org: 'Visualização organizacional',
      },
      filters: {
        searchPeople: 'Buscar nome / cargo / e-mail / função',
        searchAccess: 'Buscar conta / e-mail de acesso / função',
        searchRoles: 'Buscar membro / função / permissão',
        roleFilter: 'Filtro de função',
        statusFilter: 'Filtro de status',
        allRoles: 'Todas as funções',
        allStatuses: 'Todos os status',
      },
      actions: {
        invite: 'Convidar',
        activate: 'Ativar',
        suspend: 'Suspender',
        resendInvite: 'Reenviar convite',
        copyInviteLink: 'Copiar link',
        viewDetails: 'Detalhes',
        updateRole: 'Atualizar função',
        openPermissionCenter: 'Abrir central de permissões',
        close: 'Fechar',
        saveRole: 'Salvar função',
      },
      table: {
        contact: 'Contato',
        emails: 'E-mails',
        role: 'Função',
        status: 'Status',
        loginAccess: 'Acesso',
        actions: 'Ações',
        lastLogin: 'Último acesso',
        inviteSent: 'Convite enviado',
        enabled: 'Habilitado',
        disabled: 'Desabilitado',
        title: 'Cargo',
        businessEmail: 'E-mail corporativo',
        loginEmail: 'E-mail de acesso',
        roleCode: 'Código da função',
        roleSummary: 'Resumo da função',
        employeeNo: 'Nº',
      },
      helperTexts: {
        people: 'Mantenha registros reutilizáveis para pedidos, aprovações, diretórios e colaboração do lado do cliente.',
        access: 'Gerencie acesso, links de convite e segurança de conta em uma única lista.',
        roles: 'Alinhe responsabilidades e permissões do cliente com clareza por função de negócio.',
      },
      dialogs: {
        peopleDetails: 'Detalhes da pessoa',
        accountDetails: 'Detalhes da conta',
        changeRole: 'Alterar função',
        basicInfo: 'Informações básicas',
        contactInfo: 'Informações de contato',
        businessSetup: 'Configuração comercial',
        loginInfo: 'Informações de login',
        securityInfo: 'Informações de segurança',
        permissionInfo: 'Informações de permissão',
        currentRole: 'Função atual',
        changedRole: 'Função alterada',
        roleDescription: 'Descrição da função',
        selectRole: 'Selecione a nova função',
        notSelected: 'Não selecionado',
        notOpened: 'Não habilitada',
      },
      identityTitle: 'Identidade da conta atual',
      identityDescription: 'Mantenha o perfil do usuário conectado separado dos contatos e permissões da empresa.',
      roleLabels: {
        Owner: 'Proprietário',
        Purchaser: 'Compras',
        Finance: 'Financeiro',
        Viewer: 'Visualizador',
      },
      permissionLabels: {
        manageEnterpriseProfile: 'Gerenciar perfil da empresa',
        manageMembers: 'Gerenciar membros',
        createInquiries: 'Criar consultas',
        viewPrices: 'Ver preços',
        placeOrders: 'Fazer pedidos',
        viewFinanceDocs: 'Ver documentos financeiros',
        uploadPaymentProof: 'Enviar comprovante de pagamento',
        viewBillingDetails: 'Ver dados de faturamento',
        readOnlyAccess: 'Acesso somente leitura',
      },
      statusLabels: {
        active: 'Ativo',
        invited: 'Convidado',
        suspended: 'Suspenso',
      },
      messages: {
        nameAndLoginRequired: 'Nome e e-mail de acesso são obrigatórios',
        memberInvited: 'Membro convidado para a central de contas',
        memberInvitedQueued: 'Membro convidado localmente e colocado na fila de sincronização',
        invitationCopied: 'Link do convite copiado. Compartilhe com o novo membro para ativar a conta.',
        invitationCreateFailed: 'Falha ao criar o link do convite',
        accessUpdated: 'Acesso do membro atualizado',
        accessUpdatedQueued: 'Alterações salvas localmente e colocadas na fila de sincronização',
        resendRequiresCustomer: 'É necessário contexto de conta cliente para reenviar convites',
        resendCopied: 'Novo link de convite copiado para',
        resendFailed: 'Falha ao reenviar o convite',
        inviteLinkNotReady: 'O link ainda não está pronto',
        inviteLinkCopied: 'Link copiado',
        teamMemberFallback: 'Membro da equipe',
        invitationPending: 'Convite pendente',
        currentSession: 'Sessão atual',
        enterpriseOwnerTitle: 'Proprietário da empresa',
      },
    },
    portal: {
      title: 'Central de mapeamento de portais',
      description: 'Use a empresa cliente como objeto central e conecte em um só lugar as contas do cliente, fornecedores e terceiros.',
      refresh: 'Atualizar espelho',
      demo: 'Prévia estrutural',
      helperTitle: 'Mapeamento centrado no objeto principal',
      helperText: 'A página mostra primeiro a empresa cliente como objeto eixo e depois os grupos de contas externas ligados a ela.',
      metrics: {
        hubs: 'Objetos centrais',
        hubsHint: 'Registros principais do lado do cliente',
        accounts: 'Contas externas',
        accountsHint: 'Contas ligadas em todos os grupos',
        pending: 'Avisos pendentes',
        pendingHint: 'Sincronizadas, mas ainda não notificadas',
        risk: 'Espelhos de risco',
        riskHint: 'Mapeamentos inválidos ou limpos',
      },
      sections: {
        hubObjects: 'Objetos centrais',
        overview: 'Visão geral do mapeamento',
        selected: 'Conta externa selecionada',
        principles: 'Princípios do layout',
        accountPool: 'Grupo de contas',
      },
      empty: {
        hubs: 'Ainda não há objetos centrais',
        overview: 'Selecione um objeto central para revisar os grupos de contas externas vinculadas.',
        accountPool: 'Não há contas neste grupo',
        selected: 'Selecione uma conta externa para revisar detalhes e ações sugeridas.',
      },
      labels: {
        owner: 'Responsável',
        region: 'Região',
        latestSync: 'Última sincronização',
        linkedAccounts: 'Contas vinculadas',
        pendingNotify: 'Pendentes',
        riskCount: 'Risco',
        customer: 'Cliente',
        supplier: 'Fornecedor',
        thirdParty: 'Terceiro',
        loginEmail: 'E-mail de acesso',
        organization: 'Organização',
        passwordMirror: 'Espelho de senha',
        phone: 'Telefone',
        currentStatus: 'Status atual',
        source: 'Origem',
        notifiedAt: 'Notificado em',
        recommendedAction: 'Ação sugerida',
      },
      actions: {
        copyPassword: 'Copiar senha',
        markNotified: 'Marcar notificado',
        resync: 'Ressincronizar',
        invalidate: 'Marcar inválido',
        clear: 'Limpar espelho',
      },
      principles: {
        p1Title: '1. Comece pelo objeto central',
        p1Text: 'Veja primeiro quais objetos externos estão ligados à empresa cliente antes de entrar no detalhe de uma conta.',
        p2Title: '2. Saia da senha única para grupos de contas',
        p2Text: 'Cliente, fornecedor e terceiro podem coexistir; por isso o layout gerencia tudo como grupos conectados.',
        p3Title: '3. Operações em camadas',
        p3Text: 'O objeto central dá a visão geral, o grupo mostra escala e a conta individual expõe a próxima ação.',
      },
    },
    documents: {
      title: 'Padrões de documentos',
      defaultsTitle: 'Padrões de documentos',
      edit: 'Editar · Edit',
      save: 'Salvar',
      cancel: 'Cancelar',
      saveSuccess: 'Padrões de documentos salvos',
      fields: {
        signer: 'Assinante padrão',
        email: 'E-mail padrão',
        phone: 'Telefone padrão',
        currency: 'Moeda padrão',
        timezone: 'Fuso horário padrão',
        footerNote: 'Nota padrão do rodapé',
      },
      placeholders: {
        signer: 'Informe o assinante padrão',
        email: 'docs@empresa.com',
        phone: '+55 11 4000-1234',
        currency: 'USD',
        timezone: 'UTC',
        footerNote: 'Informe a nota do rodapé',
      },
      notSet: 'Não definido',
    },
  },
  ar: {
    localeLabel: 'لغة البوابة',
    languageNames,
    pageTitle: 'مركز بيانات شركة العميل',
    pageSubtitle: 'المعلومات الأساسية / الحسابات البنكية / مركز الأشخاص والحسابات',
    pageDescription: 'حافظ على بيانات الشركة الموجهة للعميل وحسابات التحصيل وصلاحيات الفريق في مكان واحد داخل بوابة ERP للتجارة الخارجية.',
    tabs: {
      basic: { label: 'المعلومات الأساسية', description: 'ملف الشركة وبيانات التواصل والعنوان التجاري' },
      bank: { label: 'الحسابات البنكية', description: 'حسابات التحصيل وSWIFT وIBAN وبيانات الفوترة' },
      people: { label: 'مركز الأشخاص والحسابات', description: 'إدارة جهات الاتصال وحق الدخول والأدوار من جانب العميل' },
      portal: { label: 'مركز ربط البوابات الخارجية', description: 'ربط حسابات العميل والبوابات المرتبطة وحسابات الجهات الخارجية' },
      documents: { label: 'الإعدادات الافتراضية للمستندات', description: 'الموقّع الافتراضي والتذييل والعملة والمنطقة الزمنية' },
    },
    actions: {
      back: 'رجوع',
      edit: 'تحرير',
    },
    profile: {
      title: 'المعلومات الأساسية',
      description: 'إدارة معلومات الشركة وبيانات التواصل',
      editEnterpriseInfo: 'تعديل المعلومات الأساسية',
      cancel: 'إلغاء',
      saveChanges: 'حفظ التغييرات',
      companyInformation: 'معلومات الشركة',
      contactInformation: 'معلومات التواصل',
      addressInformation: 'معلومات العنوان',
      companyName: 'اسم الشركة',
      businessType: 'نوع النشاط',
      website: 'الموقع الإلكتروني',
      contactPerson: 'جهة الاتصال',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      mobile: 'الجوال',
      businessAddress: 'العنوان التجاري',
      required: 'مطلوب',
      notSet: 'غير محدد',
      enterCompanyName: 'أدخل اسم الشركة',
      enterContactPersonName: 'أدخل اسم جهة الاتصال',
      enterEmailAddress: 'name@company.com',
      enterPhoneNumber: '+966 50 123 4567',
      enterMobileNumber: '+966 55 987 6543',
      enterBusinessAddress: 'أدخل العنوان التجاري الكامل',
      noteLabel: 'ملاحظة:',
      noteText: 'تُستخدم هذه المعلومات عند إرسال الاستفسارات وعروض الأسعار والطلبات. احرص على تحديثها لضمان دقة المعالجة من جانب العميل.',
      validationRequired: 'يرجى تعبئة جميع الحقول المطلوبة',
      validationEmail: 'يرجى إدخال بريد إلكتروني صالح',
      saveSuccess: 'تم تحديث الملف بنجاح',
      saveQueued: 'تم حفظ الملف محلياً ووضعه في قائمة المزامنة السحابية.',
      saveCloudError: 'تعذر حفظ الملف في السحابة',
      companyColumnTitle: 'الشركة',
      contactColumnTitle: 'جهة الاتصال',
      businessTypes: {
        Retailer: 'تاجر تجزئة',
        Importer: 'مستورد',
        Wholesaler: 'تاجر جملة',
        Distributor: 'موزع',
        'E-commerce': 'تجارة إلكترونية',
        Other: 'أخرى',
      },
    },
    bank: {
      title: 'الحسابات البنكية',
      description: 'إدارة حسابات الشركة العميلة المستخدمة للدفعات المقدمة والرصيد والاسترداد ومطابقة المستندات المالية.',
      sectionCompany: 'هوية الفوترة القانونية',
      sectionSettlement: 'حسابات التسوية',
      sectionAccounts: 'تفاصيل الحسابات',
      sectionPrivate: 'الحساب الخاص',
      companyName: 'الاسم القانوني للشركة',
      billingAddress: 'عنوان الفوترة',
      taxId: 'الرقم الضريبي / السجل',
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل الحسابات البنكية',
      saveSuccess: 'تم حفظ بيانات الحساب البنكي',
      accountType: 'نوع الحساب',
      bankName: 'اسم البنك',
      accountName: 'اسم الحساب',
      accountNumber: 'رقم الحساب',
      swiftCode: 'رمز SWIFT',
      iban: 'IBAN',
      currency: 'العملة',
      branchAddress: 'عنوان الفرع',
      primaryUse: 'الاستخدام الرئيسي',
      paymentNote: 'ملاحظة الدفع',
      remark: 'ملاحظة',
      notSet: 'غير محدد',
      privateNotice: 'يجب التعامل مع معلومات الحساب الخاص بحذر وإظهارها فقط للمديرين المخولين.',
      quotationHint: 'قد تختلف تعليمات التحصيل حسب اللغة والسيناريو. احرص على الفصل بين الحسابات العامة والداخلية.',
      localPublicAccount: 'الحساب العام المحلي',
      usdPublicAccount: 'الحساب العام بالدولار',
      localPrivateAccount: 'الحساب الخاص المحلي',
      localIncomingUse: 'مدفوعات محلية واردة',
      usdIncomingUse: 'مدفوعات واردة بالدولار',
      localPrivateUse: 'استخدام خاص محلي',
      types: { primary: 'حساب رئيسي', alternate: 'بديل / استرداد', private: 'حساب خاص' },
      uses: { incoming: 'المدفوعات الواردة', refund: 'الاسترداد والتسويات', internal: 'للاستخدام الداخلي فقط' },
      placeholders: {
        companyName: 'أدخل الاسم القانوني',
        billingAddress: 'أدخل عنوان الفوترة',
        taxId: 'أدخل الرقم الضريبي أو السجل',
        bankName: 'أدخل اسم البنك',
        accountName: 'أدخل اسم الحساب',
        accountNumber: 'أدخل رقم الحساب',
        swiftCode: 'أدخل رمز SWIFT',
        iban: 'أدخل رقم IBAN إن وجد',
        currency: 'USD / EUR / SAR / ...',
        branchAddress: 'أدخل عنوان الفرع',
        primaryUse: 'اشرح استخدام هذا الحساب',
        paymentNote: 'أضف ملاحظة دفع',
        remark: 'أضف ملاحظة داخلية',
      },
    },
    contacts: {
      metrics: {
        total: 'أعضاء الفريق',
        totalDesc: 'جهات الاتصال المرتبطة بهذه الشركة العميلة',
        active: 'الحسابات النشطة',
        activeDesc: 'الأعضاء النشطون حالياً',
        loginEnabled: 'الدخول مفعّل',
        loginEnabledDesc: 'الحسابات المسموح لها بتسجيل الدخول',
        owners: 'مالكو الشركة',
        ownersDesc: 'الأعضاء القادرون على إدارة الشركة',
      },
      title: 'مركز الأشخاص والحسابات',
      description: 'إدارة جهات الاتصال المؤسسية وحق الدخول والأدوار التجارية بشكل مستقل عن البيانات الأساسية للشركة.',
      syncing: 'جارٍ المزامنة...',
      closeInviteForm: 'إغلاق نموذج الدعوة',
      inviteMember: 'دعوة عضو',
      fields: {
        fullName: 'الاسم الكامل',
        title: 'المنصب / الوظيفة',
        businessEmail: 'البريد المهني',
        loginEmail: 'بريد تسجيل الدخول',
      },
      subTabs: {
        people: 'دليل الأشخاص',
        access: 'الوصول إلى الحساب',
        roles: 'صلاحيات الأدوار',
      },
      viewModes: {
        list: 'عرض القائمة',
        org: 'عرض تنظيمي',
      },
      filters: {
        searchPeople: 'ابحث بالاسم / المنصب / البريد / الدور',
        searchAccess: 'ابحث بالحساب / بريد الدخول / الدور',
        searchRoles: 'ابحث بالعضو / الدور / الصلاحية',
        roleFilter: 'تصفية الدور',
        statusFilter: 'تصفية الحالة',
        allRoles: 'كل الأدوار',
        allStatuses: 'كل الحالات',
      },
      actions: {
        invite: 'دعوة',
        activate: 'تفعيل',
        suspend: 'تعليق',
        resendInvite: 'إعادة إرسال الدعوة',
        copyInviteLink: 'نسخ رابط الدعوة',
        viewDetails: 'تفاصيل',
        updateRole: 'تحديث الدور',
        openPermissionCenter: 'فتح مركز الصلاحيات',
        close: 'إغلاق',
        saveRole: 'حفظ الدور',
      },
      table: {
        contact: 'جهة الاتصال',
        emails: 'رسائل البريد',
        role: 'الدور',
        status: 'الحالة',
        loginAccess: 'إمكانية الدخول',
        actions: 'الإجراءات',
        lastLogin: 'آخر دخول',
        inviteSent: 'تم إرسال الدعوة',
        enabled: 'مفعّل',
        disabled: 'معطّل',
        title: 'المنصب',
        businessEmail: 'البريد المهني',
        loginEmail: 'بريد الدخول',
        roleCode: 'رمز الدور',
        roleSummary: 'ملخص الدور',
        employeeNo: 'الرقم',
      },
      helperTexts: {
        people: 'احتفظ بسجلات الأعضاء قابلة لإعادة الاستخدام في الطلبات والموافقات والدليل والتعاون من جانب العميل.',
        access: 'أدر إتاحة الدخول وروابط الدعوة وأمان الحساب من قائمة واحدة.',
        roles: 'نسّق مسؤوليات وصلاحيات جانب العميل بوضوح حسب الدور التجاري.',
      },
      dialogs: {
        peopleDetails: 'تفاصيل الشخص',
        accountDetails: 'تفاصيل الحساب',
        changeRole: 'تغيير الدور',
        basicInfo: 'المعلومات الأساسية',
        contactInfo: 'معلومات التواصل',
        businessSetup: 'إعدادات العمل',
        loginInfo: 'معلومات الدخول',
        securityInfo: 'معلومات الأمان',
        permissionInfo: 'معلومات الصلاحيات',
        currentRole: 'الدور الحالي',
        changedRole: 'الدور الجديد',
        roleDescription: 'وصف الدور',
        selectRole: 'اختر الدور الجديد',
        notSelected: 'غير محدد',
        notOpened: 'غير مفعّل',
      },
      identityTitle: 'هوية الحساب الحالي',
      identityDescription: 'افصل ملف المستخدم الحالي عن جهات الاتصال المؤسسية والصلاحيات.',
      roleLabels: {
        Owner: 'مالك',
        Purchaser: 'مشتريات',
        Finance: 'مالية',
        Viewer: 'مشاهد',
      },
      permissionLabels: {
        manageEnterpriseProfile: 'إدارة ملف الشركة',
        manageMembers: 'إدارة الأعضاء',
        createInquiries: 'إنشاء استفسارات',
        viewPrices: 'عرض الأسعار',
        placeOrders: 'إنشاء الطلبات',
        viewFinanceDocs: 'عرض المستندات المالية',
        uploadPaymentProof: 'رفع إثبات الدفع',
        viewBillingDetails: 'عرض بيانات الفوترة',
        readOnlyAccess: 'صلاحية قراءة فقط',
      },
      statusLabels: {
        active: 'نشط',
        invited: 'مدعو',
        suspended: 'معلّق',
      },
      messages: {
        nameAndLoginRequired: 'الاسم وبريد تسجيل الدخول مطلوبان',
        memberInvited: 'تمت دعوة العضو إلى مركز الحسابات',
        memberInvitedQueued: 'تمت الدعوة محلياً ووضعها في انتظار المزامنة',
        invitationCopied: 'تم نسخ رابط الدعوة. شاركه مع العضو الجديد لتفعيل الحساب.',
        invitationCreateFailed: 'تعذر إنشاء رابط الدعوة',
        accessUpdated: 'تم تحديث صلاحيات العضو',
        accessUpdatedQueued: 'تم حفظ التغييرات محلياً ووضعها في انتظار المزامنة',
        resendRequiresCustomer: 'يلزم وجود سياق حساب عميل لإعادة إرسال الدعوات',
        resendCopied: 'تم نسخ رابط دعوة جديد لـ',
        resendFailed: 'تعذر إعادة إرسال الدعوة',
        inviteLinkNotReady: 'رابط الدعوة غير جاهز بعد',
        inviteLinkCopied: 'تم نسخ رابط الدعوة',
        teamMemberFallback: 'عضو فريق',
        invitationPending: 'الدعوة قيد الانتظار',
        currentSession: 'الجلسة الحالية',
        enterpriseOwnerTitle: 'مالك الشركة',
      },
    },
    portal: {
      title: 'مركز ربط البوابات الخارجية',
      description: 'استخدم شركة العميل ككائن محوري واربط في مكان واحد حسابات العميل والموردين والجهات الخارجية.',
      refresh: 'تحديث المرآة',
      demo: 'عرض هيكلي',
      helperTitle: 'ربط قائم على الكائن المحوري',
      helperText: 'تعرض الصفحة أولاً شركة العميل بوصفها الكائن الأساسي ثم مجموعات الحسابات الخارجية المربوطة تحتها.',
      metrics: {
        hubs: 'الكائنات المحورية',
        hubsHint: 'السجلات الرئيسية من جانب العميل',
        accounts: 'الحسابات الخارجية',
        accountsHint: 'الحسابات المرتبطة عبر كل المجموعات',
        pending: 'بانتظار الإخطار',
        pendingHint: 'تمت المزامنة ولم يتم الإخطار بعد',
        risk: 'المرايا الخطرة',
        riskHint: 'الربط غير الصالح أو الذي تمت إزالته',
      },
      sections: {
        hubObjects: 'الكائنات المحورية',
        overview: 'نظرة عامة على الربط',
        selected: 'الحساب الخارجي المحدد',
        principles: 'مبادئ التصميم',
        accountPool: 'مجموعة الحسابات',
      },
      empty: {
        hubs: 'لا توجد كائنات محورية بعد',
        overview: 'اختر كائناً محورياً لمراجعة مجموعات الحسابات الخارجية المربوطة به.',
        accountPool: 'لا توجد حسابات في هذه المجموعة',
        selected: 'اختر حساباً خارجياً لمراجعة التفاصيل والإجراءات المقترحة.',
      },
      labels: {
        owner: 'المالك',
        region: 'المنطقة',
        latestSync: 'آخر مزامنة',
        linkedAccounts: 'الحسابات المرتبطة',
        pendingNotify: 'قيد الإخطار',
        riskCount: 'عدد المخاطر',
        customer: 'العميل',
        supplier: 'المورد',
        thirdParty: 'طرف ثالث',
        loginEmail: 'بريد الدخول',
        organization: 'الجهة',
        passwordMirror: 'مرآة كلمة المرور',
        phone: 'الهاتف',
        currentStatus: 'الحالة الحالية',
        source: 'المصدر',
        notifiedAt: 'وقت الإخطار',
        recommendedAction: 'الإجراء المقترح',
      },
      actions: {
        copyPassword: 'نسخ كلمة المرور',
        markNotified: 'تحديد كمُخطر',
        resync: 'إعادة المزامنة',
        invalidate: 'تحديد كغير صالح',
        clear: 'مسح المرآة',
      },
      principles: {
        p1Title: '1. ابدأ بالكائن المحوري',
        p1Text: 'راجع أولاً ما هي الكيانات الخارجية المربوطة بشركة العميل قبل النزول إلى تفاصيل الحساب الواحد.',
        p2Title: '2. الانتقال من كلمة مرور واحدة إلى مجموعات حسابات',
        p2Text: 'قد تتعايش حسابات العميل والمورد والطرف الثالث في الوقت نفسه، لذلك يُدار كل ذلك كمجموعات مترابطة.',
        p3Title: '3. تقسيم العمليات حسب المستوى',
        p3Text: 'يعطي الكائن المحوري النظرة العامة، وتُظهر المجموعة الحجم، ويعرض الحساب الفردي الإجراء التالي.',
      },
    },
    documents: {
      title: 'الإعدادات الافتراضية للمستندات',
      defaultsTitle: 'الإعدادات الافتراضية للمستندات',
      edit: 'تحرير · Edit',
      save: 'حفظ',
      cancel: 'إلغاء',
      saveSuccess: 'تم حفظ إعدادات المستندات',
      fields: {
        signer: 'الموقّع الافتراضي',
        email: 'البريد الافتراضي',
        phone: 'الهاتف الافتراضي',
        currency: 'العملة الافتراضية',
        timezone: 'المنطقة الزمنية الافتراضية',
        footerNote: 'ملاحظة التذييل الافتراضية',
      },
      placeholders: {
        signer: 'أدخل الموقّع الافتراضي',
        email: 'docs@company.com',
        phone: '+966 50 123 4567',
        currency: 'USD',
        timezone: 'UTC',
        footerNote: 'أدخل ملاحظة التذييل',
      },
      notSet: 'غير محدد',
    },
  },
};

export const CUSTOMER_MASTER_DATA_LOCALE_STORAGE_KEY = 'cosun_customer_master_data_locale_v1';
export const CUSTOMER_MASTER_DATA_LOCALE_EVENT = 'cosun-customer-master-data-locale-change';

export function resolveCustomerMasterDataLocale(input?: string | null): CustomerMasterDataLocale {
  const normalized = String(input || '').toLowerCase();
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('pt')) return 'pt';
  if (normalized.startsWith('ar')) return 'ar';
  return 'en';
}
