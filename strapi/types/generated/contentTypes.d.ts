import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'>;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> & Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deviceId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    userId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> & Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAboutAbout extends Struct.SingleTypeSchema {
  collectionName: 'abouts';
  info: {
    description: 'Write about yourself and the content you create';
    displayName: 'About';
    pluralName: 'abouts';
    singularName: 'about';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocks: Schema.Attribute.DynamicZone<
      ['shared.media', 'shared.quote', 'shared.rich-text', 'shared.slider']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::about.about'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiAppointmentAppointment extends Struct.CollectionTypeSchema {
  collectionName: 'appointments';
  info: {
    description: 'Online appointment booking for parent-teacher meetings';
    displayName: 'Appointment';
    pluralName: 'appointments';
    singularName: 'appointment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    endTime: Schema.Attribute.Time & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::appointment.appointment'> &
      Schema.Attribute.Private;
    meetingLink: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    reminderSent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    requestedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    startTime: Schema.Attribute.Time & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['pending', 'confirmed', 'cancelled', 'completed']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher-profile.teacher-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<['in-person', 'online', 'phone']> &
      Schema.Attribute.DefaultTo<'in-person'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiArticleArticle extends Struct.CollectionTypeSchema {
  collectionName: 'articles';
  info: {
    description: 'Create your blog content';
    displayName: 'Article';
    pluralName: 'articles';
    singularName: 'article';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::author.author'>;
    blocks: Schema.Attribute.DynamicZone<
      ['shared.media', 'shared.quote', 'shared.rich-text', 'shared.slider']
    >;
    category: Schema.Attribute.Relation<'manyToOne', 'api::category.category'>;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::article.article'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiAttendanceLogAttendanceLog extends Struct.CollectionTypeSchema {
  collectionName: 'attendance_logs';
  info: {
    description: 'Yoklama kay\u0131tlar\u0131 (y\u00FCz tan\u0131ma dahil)';
    displayName: 'Attendance Log';
    pluralName: 'attendance-logs';
    singularName: 'attendance-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    confidenceScore: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deviceId: Schema.Attribute.String;
    eventType: Schema.Attribute.Enumeration<['check_in', 'check_out']> & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::attendance-log.attendance-log'> &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    method: Schema.Attribute.Enumeration<['face_recognition', 'manual', 'qr_code', 'card']> &
      Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    photo: Schema.Attribute.Media<'images'>;
    photoUrl: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    recordedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    verifiedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiAuditLogAuditLog extends Struct.CollectionTypeSchema {
  collectionName: 'audit_logs';
  info: {
    description: 'KVKK uyumlu de\u011Fi\u015Ftirilemez eri\u015Fim loglar\u0131';
    displayName: 'Denetim Kayd\u0131 (Audit Log)';
    pluralName: 'audit-logs';
    singularName: 'audit-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    action: Schema.Attribute.Enumeration<
      [
        'create',
        'read',
        'update',
        'delete',
        'login',
        'logout',
        'login_failed',
        'twofa_setup',
        'twofa_verify',
        'twofa_disable',
        'export',
        'print',
        'bkds_verify',
        'kvkk_consent',
      ]
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    entityId: Schema.Attribute.String;
    entityName: Schema.Attribute.String;
    entityType: Schema.Attribute.String & Schema.Attribute.Required;
    errorMessage: Schema.Attribute.Text;
    hash: Schema.Attribute.String;
    ipAddress: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::audit-log.audit-log'> &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    newValues: Schema.Attribute.JSON;
    previousHash: Schema.Attribute.String;
    previousValues: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String;
    success: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    userAgent: Schema.Attribute.Text;
  };
}

export interface ApiAuthorAuthor extends Struct.CollectionTypeSchema {
  collectionName: 'authors';
  info: {
    description: 'Create authors for your content';
    displayName: 'Author';
    pluralName: 'authors';
    singularName: 'author';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    articles: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    avatar: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::author.author'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiBepGelisimIzlemeBepGelisimIzleme extends Struct.CollectionTypeSchema {
  collectionName: 'bep_gelisim_izlemeleri';
  info: {
    description: 'BEP Geli\u015Fimi \u0130zleme \u00D6zet Formu - d\u00F6nemlik de\u011Ferlendirme';
    displayName: 'BEP Geli\u015Fim \u0130zleme (Ek-5 G\u00D6F)';
    pluralName: 'bep-gelisim-izlemeleri';
    singularName: 'bep-gelisim-izleme';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    academicYear: Schema.Attribute.String & Schema.Attribute.Required;
    achievedGoals: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    akademikProgress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    approvalStatus: Schema.Attribute.Enumeration<
      ['taslak', 'ogretmen_onay', 'veli_onay', 'tamamlandi']
    > &
      Schema.Attribute.DefaultTo<'taslak'>;
    bep: Schema.Attribute.Relation<'manyToOne', 'api::bireysel-egitim-plani.bireysel-egitim-plani'>;
    bepUpdateRequired: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    bilisselProgress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    challenges: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    dilIletisimProgress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    evaluationDate: Schema.Attribute.Date & Schema.Attribute.Required;
    evaluationPeriod: Schema.Attribute.Enumeration<
      ['donem_basi', 'ara_degerlendirme', 'donem_sonu']
    > &
      Schema.Attribute.Required;
    evaluator: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    inProgressGoals: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::bep-gelisim-izleme.bep-gelisim-izleme'
    > &
      Schema.Attribute.Private;
    motorProgress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    nextSteps: Schema.Attribute.Text;
    notAchievedGoals: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    overallProgress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    ozbakimProgress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    parentFeedback: Schema.Attribute.Text;
    parentSignatureDate: Schema.Attribute.Date;
    publishedAt: Schema.Attribute.DateTime;
    recommendedChanges: Schema.Attribute.Text;
    semester: Schema.Attribute.Enumeration<['guz', 'bahar']> & Schema.Attribute.Required;
    skillAreaProgress: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    sosyalProgress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    strengths: Schema.Attribute.Text;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiBireyselEgitimPlaniBireyselEgitimPlani extends Struct.CollectionTypeSchema {
  collectionName: 'bireysel_egitim_planlari';
  info: {
    description: 'Bireysel E\u011Fitim Plan\u0131 - Kaba de\u011Ferlendirmeden otomatik olu\u015Fur';
    displayName: 'Bireysel E\u011Fitim Plan\u0131 (BEP)';
    pluralName: 'bireysel-egitim-planlari';
    singularName: 'bireysel-egitim-plani';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    altBasamaklar: Schema.Attribute.JSON & Schema.Attribute.Required;
    approvedAt: Schema.Attribute.DateTime;
    approvedBy: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
    baslangicTarihi: Schema.Attribute.Date & Schema.Attribute.Required;
    bitisTarihi: Schema.Attribute.Date & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    degerlendirmeYontemleri: Schema.Attribute.JSON;
    donem: Schema.Attribute.String & Schema.Attribute.Required;
    egitimOrtami: Schema.Attribute.String;
    kabaDegerlendirme: Schema.Attribute.Relation<
      'oneToOne',
      'api::kaba-degerlendirme.kaba-degerlendirme'
    >;
    kisaVadeliAmaclar: Schema.Attribute.JSON;
    kullanilanMateryaller: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::bireysel-egitim-plani.bireysel-egitim-plani'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.RichText;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['draft', 'active', 'completed', 'archived']> &
      Schema.Attribute.DefaultTo<'draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    uzunVadeliAmaclar: Schema.Attribute.JSON;
  };
}

export interface ApiCategoryCategory extends Struct.CollectionTypeSchema {
  collectionName: 'categories';
  info: {
    description: 'Organize your content into categories';
    displayName: 'Category';
    pluralName: 'categories';
    singularName: 'category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    articles: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::category.category'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiContactMessageContactMessage extends Struct.CollectionTypeSchema {
  collectionName: 'contact_messages';
  info: {
    displayName: 'ContactMessage';
    pluralName: 'contact-messages';
    singularName: 'contact-message';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::contact-message.contact-message'> &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text;
    name: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiDonemSonuDegerlendirmeDonemSonuDegerlendirme
  extends Struct.CollectionTypeSchema {
  collectionName: 'donem_sonu_degerlendirmeleri';
  info: {
    description: "D\u00F6nem Sonu De\u011Ferlendirme Formu - PKT'den otomatik olu\u015Fur";
    displayName: 'D\u00F6nem Sonu De\u011Ferlendirme';
    pluralName: 'donem-sonu-degerlendirmeleri';
    singularName: 'donem-sonu-degerlendirme';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    degerlendirmeTarihi: Schema.Attribute.Date & Schema.Attribute.Required;
    donem: Schema.Attribute.String & Schema.Attribute.Required;
    egitimciGorusleri: Schema.Attribute.RichText;
    gelecekDonemOneriler: Schema.Attribute.RichText;
    genelDegerlendirme: Schema.Attribute.RichText;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::donem-sonu-degerlendirme.donem-sonu-degerlendirme'
    > &
      Schema.Attribute.Private;
    mebbisRefId: Schema.Attribute.String;
    pkt: Schema.Attribute.Relation<'oneToOne', 'api::performans-kayit.performans-kayit'>;
    publishedAt: Schema.Attribute.DateTime;
    sonuclar: Schema.Attribute.JSON;
    status: Schema.Attribute.Enumeration<['draft', 'completed', 'approved']> &
      Schema.Attribute.DefaultTo<'draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    syncedToMebbis: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    ulasilamayanAmaclar: Schema.Attribute.JSON;
    ulasilanAmaclar: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    veliGorusleri: Schema.Attribute.RichText;
  };
}

export interface ApiErpRoleErpRole extends Struct.CollectionTypeSchema {
  collectionName: 'erp_roles';
  info: {
    description: 'Custom ERP roles with permissions';
    displayName: 'ERP Role';
    pluralName: 'erp-roles';
    singularName: 'erp-role';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    displayName: Schema.Attribute.String & Schema.Attribute.Required;
    isSystem: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    level: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::erp-role.erp-role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    permissions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'plugin::users-permissions.user'>;
  };
}

export interface ApiFaqFaq extends Struct.CollectionTypeSchema {
  collectionName: 'faqs';
  info: {
    description: '';
    displayName: 'FAQ';
    pluralName: 'faqs';
    singularName: 'faq';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::faq.faq'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    question: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiFaturaFatura extends Struct.CollectionTypeSchema {
  collectionName: 'faturalar';
  info: {
    description: '\u00D6zel e\u011Fitim faturalar\u0131 - MEBBIS ile senkronize';
    displayName: 'Fatura';
    pluralName: 'faturalar';
    singularName: 'fatura';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ay: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      >;
    birimFiyat: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    donem: Schema.Attribute.String & Schema.Attribute.Required;
    faturaNo: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    faturaTarihi: Schema.Attribute.Date & Schema.Attribute.Required;
    kalemler: Schema.Attribute.JSON;
    kdvOrani: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    kdvTutar: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::fatura.fatura'> &
      Schema.Attribute.Private;
    mebbisOnayTarihi: Schema.Attribute.DateTime;
    mebbisRefId: Schema.Attribute.String;
    netTutar: Schema.Attribute.Decimal;
    notes: Schema.Attribute.RichText;
    pdfUrl: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['draft', 'pending', 'approved', 'paid', 'cancelled']> &
      Schema.Attribute.DefaultTo<'draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    syncedToMebbis: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    toplamSaat: Schema.Attribute.Decimal;
    toplamTutar: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vadeTarihi: Schema.Attribute.Date;
    yil: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

export interface ApiFileShareFileShare extends Struct.CollectionTypeSchema {
  collectionName: 'file_shares';
  info: {
    displayName: 'File Share';
    pluralName: 'file-shares';
    singularName: 'file-share';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    downloadCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    expiresAt: Schema.Attribute.DateTime;
    file: Schema.Attribute.Relation<'manyToOne', 'api::storage-file.storage-file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::file-share.file-share'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.String;
    permissions: Schema.Attribute.Enumeration<['read', 'write', 'share', 'all']> &
      Schema.Attribute.DefaultTo<'read'>;
    publishedAt: Schema.Attribute.DateTime;
    sharedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    sharedWith: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    shareType: Schema.Attribute.Enumeration<['user', 'group', 'link', 'email']> &
      Schema.Attribute.DefaultTo<'user'>;
    token: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiGalleryGallery extends Struct.CollectionTypeSchema {
  collectionName: 'galleries';
  info: {
    description: '';
    displayName: 'Gallery';
    pluralName: 'galleries';
    singularName: 'gallery';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    alt: Schema.Attribute.String;
    category: Schema.Attribute.Enumeration<
      ['E\u011Fitim', 'Sosyal Aktivite', 'Dan\u0131\u015Fmanl\u0131k']
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::gallery.gallery'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiGlobalGlobal extends Struct.SingleTypeSchema {
  collectionName: 'globals';
  info: {
    description: 'Define global settings';
    displayName: 'Global';
    pluralName: 'globals';
    singularName: 'global';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    defaultSeo: Schema.Attribute.Component<'shared.seo', false>;
    favicon: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::global.global'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    siteDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    siteName: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiHeroHero extends Struct.SingleTypeSchema {
  collectionName: 'heroes';
  info: {
    description: '';
    displayName: 'Hero';
    pluralName: 'heroes';
    singularName: 'hero';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    images: Schema.Attribute.Media<'images', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::hero.hero'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    stats: Schema.Attribute.Component<'shared.stat', true>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiKabaDegerlendirmeKabaDegerlendirme extends Struct.CollectionTypeSchema {
  collectionName: 'kaba_degerlendirmeler';
  info: {
    description: "Kaba De\u011Ferlendirme Formu - MEBBIS'ten performans ve ihtiya\u00E7lar\u0131 \u00E7eker";
    displayName: 'Kaba De\u011Ferlendirme';
    pluralName: 'kaba-degerlendirmeler';
    singularName: 'kaba-degerlendirme';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    createdFromMebbis: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    degerlendirmeTarihi: Schema.Attribute.Date & Schema.Attribute.Required;
    donem: Schema.Attribute.String & Schema.Attribute.Required;
    gelisimAlanlari: Schema.Attribute.JSON;
    ihtiyaclar: Schema.Attribute.JSON & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::kaba-degerlendirme.kaba-degerlendirme'
    > &
      Schema.Attribute.Private;
    mebbisRefId: Schema.Attribute.String;
    notes: Schema.Attribute.RichText;
    performanslar: Schema.Attribute.JSON & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['draft', 'completed', 'approved']> &
      Schema.Attribute.DefaultTo<'draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiKontrolListesiKontrolListesi extends Struct.CollectionTypeSchema {
  collectionName: 'kontrol_listeleri';
  info: {
    description: '\u00D6\u00C7\u00C7/MEB Kontrol Listesi formu - Beceri de\u011Ferlendirme';
    displayName: 'Kontrol Listesi (Ek-2)';
    pluralName: 'kontrol-listeleri';
    singularName: 'kontrol-listesi';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    attachments: Schema.Attribute.Media<'images' | 'files' | 'videos', true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    evaluationCriteria: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    evaluationDate: Schema.Attribute.Date & Schema.Attribute.Required;
    evaluator: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::kontrol-listesi.kontrol-listesi'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    performanceLevel: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    result: Schema.Attribute.Enumeration<
      ['basarili', 'gelisiyor', 'basarisiz', 'degerlendirilemedi']
    >;
    skillArea: Schema.Attribute.Enumeration<
      ['ozbak\u0131m', 'gunluk_yasam', 'akademik', 'sosyal', 'motor', 'dil_iletisim', 'bilissel']
    > &
      Schema.Attribute.Required;
    skillName: Schema.Attribute.String & Schema.Attribute.Required;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    targetBehavior: Schema.Attribute.Text & Schema.Attribute.Required;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiKvkkOnamKvkkOnam extends Struct.CollectionTypeSchema {
  collectionName: 'kvkk_onamlari';
  info: {
    description: 'Ki\u015Fisel Verilerin Korunmas\u0131 Kanunu kapsam\u0131nda al\u0131nan onam formlar\u0131';
    displayName: 'KVKK Onam Formu';
    pluralName: 'kvkk-onamlari';
    singularName: 'kvkk-onam';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    bilgilendirmeMetni: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    dijitalImza: Schema.Attribute.Text;
    formVersion: Schema.Attribute.String & Schema.Attribute.DefaultTo<'1.0'>;
    gecerlilikBitisTarihi: Schema.Attribute.Date;
    imzaliForm: Schema.Attribute.Media<'images' | 'files'>;
    ipAddress: Schema.Attribute.String;
    iptalNedeni: Schema.Attribute.Text;
    iptalTarihi: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::kvkk-onam.kvkk-onam'> &
      Schema.Attribute.Private;
    onamDurumu: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    onamTarihi: Schema.Attribute.DateTime & Schema.Attribute.Required;
    onamTuru: Schema.Attribute.Enumeration<
      ['bkds_biyometrik', 'genel_kvkk', 'fotograf_video', 'saglik_bilgileri', 'pazarlama_iletisim']
    > &
      Schema.Attribute.Required;
    person: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    personType: Schema.Attribute.Enumeration<['ogrenci', 'personel', 'veli']> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    studentProfile: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    userAgent: Schema.Attribute.Text;
  };
}

export interface ApiLocationLogLocationLog extends Struct.CollectionTypeSchema {
  collectionName: 'location_logs';
  info: {
    description: 'GPS konum kay\u0131tlar\u0131';
    displayName: 'Location Log';
    pluralName: 'location-logs';
    singularName: 'location-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accuracyMeters: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    heading: Schema.Attribute.Decimal;
    latitude: Schema.Attribute.Decimal & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::location-log.location-log'> &
      Schema.Attribute.Private;
    longitude: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    recordedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    route: Schema.Attribute.Relation<'manyToOne', 'api::service-route.service-route'>;
    source: Schema.Attribute.Enumeration<['gps', 'network', 'manual']> &
      Schema.Attribute.DefaultTo<'gps'>;
    speedKmh: Schema.Attribute.Decimal;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiNextcloudSyncNextcloudSync extends Struct.CollectionTypeSchema {
  collectionName: 'nextcloud_syncs';
  info: {
    description: 'Nextcloud kullan\u0131c\u0131 e\u015Fle\u015Ftirme';
    displayName: 'Nextcloud Sync';
    pluralName: 'nextcloud-syncs';
    singularName: 'nextcloud-sync';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    homeFolderPath: Schema.Attribute.String;
    lastError: Schema.Attribute.Text;
    lastSyncAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::nextcloud-sync.nextcloud-sync'> &
      Schema.Attribute.Private;
    nextcloudDisplayName: Schema.Attribute.String;
    nextcloudUserId: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    quotaTotal: Schema.Attribute.BigInteger;
    quotaUsed: Schema.Attribute.BigInteger & Schema.Attribute.DefaultTo<'0'>;
    syncStatus: Schema.Attribute.Enumeration<['active', 'suspended', 'error']> &
      Schema.Attribute.DefaultTo<'active'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiOgrenciGrubuOgrenciGrubu extends Struct.CollectionTypeSchema {
  collectionName: 'ogrenci_gruplari';
  info: {
    description: 'Otomatik veya manuel olu\u015Fturulan \u00F6\u011Frenci gruplar\u0131';
    displayName: '\u00D6\u011Frenci Grubu';
    pluralName: 'ogrenci-gruplari';
    singularName: 'ogrenci-grubu';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assistantTeachers: Schema.Attribute.Relation<'manyToMany', 'plugin::users-permissions.user'>;
    autoGenerated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    currentCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    focusArea: Schema.Attribute.Enumeration<
      ['ozbak\u0131m', 'akademik', 'sosyal', 'motor', 'dil_iletisim', 'bilissel', 'karma']
    >;
    groupType: Schema.Attribute.Enumeration<
      ['yas_grubu', 'seviye_grubu', 'beceri_alan\u0131', 'ogretmen_grubu', 'ozel_grup']
    > &
      Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::ogrenci-grubu.ogrenci-grubu'> &
      Schema.Attribute.Private;
    maxAge: Schema.Attribute.Integer;
    maxCapacity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<8>;
    minAge: Schema.Attribute.Integer;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    primaryTeacher: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    schedule: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    skillLevel: Schema.Attribute.Enumeration<['baslangic', 'orta', 'ileri']>;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPerformansKayitPerformansKayit extends Struct.CollectionTypeSchema {
  collectionName: 'performans_kayitlari';
  info: {
    description: 'Performans Kay\u0131t Tablosu - Planlama ekran\u0131ndan saat ve mod\u00FCller otomatik gelir';
    displayName: 'Performans Kay\u0131t Tablosu (PKT)';
    pluralName: 'performans-kayitlari';
    singularName: 'performans-kayit';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    baslangicTarihi: Schema.Attribute.Date & Schema.Attribute.Required;
    bep: Schema.Attribute.Relation<'manyToOne', 'api::bireysel-egitim-plani.bireysel-egitim-plani'>;
    bitisTarihi: Schema.Attribute.Date & Schema.Attribute.Required;
    calismaModulleri: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    degerlendirmeler: Schema.Attribute.JSON;
    donem: Schema.Attribute.String & Schema.Attribute.Required;
    egitimciDegerlendirmeleri: Schema.Attribute.JSON;
    genelDegerlendirme: Schema.Attribute.Enumeration<
      ['basarisiz', 'gelisiyor', 'basarili', 'cok_iyi']
    > &
      Schema.Attribute.DefaultTo<'gelisiyor'>;
    haftalikSaatler: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::performans-kayit.performans-kayit'
    > &
      Schema.Attribute.Private;
    mebbisRefId: Schema.Attribute.String;
    notes: Schema.Attribute.RichText;
    publishedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    syncedToMebbis: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPortfolyoKontrolPortfolyoKontrol extends Struct.CollectionTypeSchema {
  collectionName: 'portfolyo_kontrol_listeleri';
  info: {
    description: '\u00D6\u011Frenci portfolyosu de\u011Ferlendirme kontrol listesi';
    displayName: 'Portfolyo Kontrol Listesi (Ek-6)';
    pluralName: 'portfolyo-kontrol-listeleri';
    singularName: 'portfolyo-kontrol';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    academicYear: Schema.Attribute.String & Schema.Attribute.Required;
    assessmentFormsExist: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    attachments: Schema.Attribute.Media<'images' | 'files' | 'videos', true>;
    bepCopyExists: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    evaluationDate: Schema.Attribute.Date & Schema.Attribute.Required;
    evaluator: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::portfolyo-kontrol.portfolyo-kontrol'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    overallCompleteness: Schema.Attribute.Enumeration<['eksik', 'kismen_tam', 'tam', 'mukemmel']>;
    parentFeedbackExists: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    photoCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    portfolyoItems: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<{
        bepKopyasi: false;
        calismaOrnekleri: false;
        digerMateryaller: false;
        fotograflar: false;
        kabaDegerlendirme: false;
        kontrolListesi: false;
        ogrenciOzdegerlendirme: false;
        performansKayitlari: false;
        veliGorusleri: false;
        videolar: false;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    selfEvaluationExists: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    semester: Schema.Attribute.Enumeration<['guz', 'bahar']> & Schema.Attribute.Required;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    videoCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    workSamplesCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiPortfolyoPuanlamaPortfolyoPuanlama extends Struct.CollectionTypeSchema {
  collectionName: 'portfolyo_puanlamalari';
  info: {
    description: 'Portfolyo dereceli puanlama anahtar\u0131 - rubrik de\u011Ferlendirme';
    displayName: 'Portfolyo Dereceli Puanlama (Ek-7)';
    pluralName: 'portfolyo-puanlamalari';
    singularName: 'portfolyo-puanlama';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    academicYear: Schema.Attribute.String & Schema.Attribute.Required;
    areasForImprovement: Schema.Attribute.Text;
    contentQualityNotes: Schema.Attribute.Text;
    contentQualityScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    evaluationDate: Schema.Attribute.Date & Schema.Attribute.Required;
    evaluator: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::portfolyo-puanlama.portfolyo-puanlama'
    > &
      Schema.Attribute.Private;
    organizationNotes: Schema.Attribute.Text;
    organizationScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    overallGrade: Schema.Attribute.Enumeration<
      ['yetersiz', 'gelisiyor', 'yeterli', 'iyi', 'cok_iyi']
    >;
    presentationNotes: Schema.Attribute.Text;
    presentationScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    progressEvidenceNotes: Schema.Attribute.Text;
    progressEvidenceScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    publishedAt: Schema.Attribute.DateTime;
    recommendations: Schema.Attribute.Text;
    selfReflectionNotes: Schema.Attribute.Text;
    selfReflectionScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    semester: Schema.Attribute.Enumeration<['guz', 'bahar']> & Schema.Attribute.Required;
    strengths: Schema.Attribute.Text;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    totalScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 24;
          min: 6;
        },
        number
      >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    varietyNotes: Schema.Attribute.Text;
    varietyScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface ApiProcessProcess extends Struct.CollectionTypeSchema {
  collectionName: 'processes';
  info: {
    description: '';
    displayName: 'Process';
    pluralName: 'processes';
    singularName: 'process';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::process.process'> &
      Schema.Attribute.Private;
    number: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiRaporRapor extends Struct.CollectionTypeSchema {
  collectionName: 'raporlar';
  info: {
    description: 'Otomatik olu\u015Fturulan raporlar - Ek-4, D\u00F6nem Sonu, Kurum Performans vb.';
    displayName: 'Rapor';
    pluralName: 'raporlar';
    singularName: 'rapor';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ay: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 12;
          min: 1;
        },
        number
      >;
    baslangicTarihi: Schema.Attribute.Date;
    baslik: Schema.Attribute.String & Schema.Attribute.Required;
    bitisTarihi: Schema.Attribute.Date;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    donem: Schema.Attribute.String;
    excelUrl: Schema.Attribute.String;
    icerik: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::rapor.rapor'> &
      Schema.Attribute.Private;
    mebbisExported: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    olusturmaTarihi: Schema.Attribute.DateTime & Schema.Attribute.Required;
    ozet: Schema.Attribute.RichText;
    pdfUrl: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    raporTipi: Schema.Attribute.Enumeration<
      ['ek4', 'donem_sonu', 'ogrenci_gelisim', 'kurum_performans', 'devamsizlik', 'fatura_ozet']
    > &
      Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['generating', 'ready', 'error']> &
      Schema.Attribute.DefaultTo<'generating'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher-profile.teacher-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    yil: Schema.Attribute.Integer;
  };
}

export interface ApiRouteStopRouteStop extends Struct.CollectionTypeSchema {
  collectionName: 'route_stops';
  info: {
    description: 'Servis duraklar\u0131';
    displayName: 'Route Stop';
    pluralName: 'route-stops';
    singularName: 'route-stop';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    estimatedArrivalOffsetMinutes: Schema.Attribute.Integer;
    latitude: Schema.Attribute.Decimal & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::route-stop.route-stop'> &
      Schema.Attribute.Private;
    longitude: Schema.Attribute.Decimal & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    route: Schema.Attribute.Relation<'manyToOne', 'api::service-route.service-route'>;
    stopOrder: Schema.Attribute.Integer & Schema.Attribute.Required;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiScheduleSchedule extends Struct.CollectionTypeSchema {
  collectionName: 'schedules';
  info: {
    description: 'Ders, terapi, toplant\u0131 programlar\u0131';
    displayName: 'Schedule';
    pluralName: 'schedules';
    singularName: 'schedule';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    attendees: Schema.Attribute.Relation<'manyToMany', 'plugin::users-permissions.user'>;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.RichText;
    endTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    isAllDay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::schedule.schedule'> &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    recurrenceRule: Schema.Attribute.String;
    scheduleType: Schema.Attribute.Enumeration<['class', 'therapy', 'meeting', 'event']> &
      Schema.Attribute.Required;
    startTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['scheduled', 'cancelled', 'completed']> &
      Schema.Attribute.DefaultTo<'scheduled'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiServiceRouteServiceRoute extends Struct.CollectionTypeSchema {
  collectionName: 'service_routes';
  info: {
    description: 'Servis g\u00FCzergahlar\u0131';
    displayName: 'Service Route';
    pluralName: 'service-routes';
    singularName: 'service-route';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    afternoonDepartureTime: Schema.Attribute.Time;
    assignedStudents: Schema.Attribute.Relation<
      'manyToMany',
      'api::student-profile.student-profile'
    >;
    assistant: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    capacity: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    driver: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    estimatedDurationMinutes: Schema.Attribute.Integer;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service-route.service-route'> &
      Schema.Attribute.Private;
    morningDepartureTime: Schema.Attribute.Time;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    stops: Schema.Attribute.Relation<'oneToMany', 'api::route-stop.route-stop'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    vehiclePlate: Schema.Attribute.String;
  };
}

export interface ApiServiceService extends Struct.CollectionTypeSchema {
  collectionName: 'services';
  info: {
    description: '';
    displayName: 'Service';
    pluralName: 'services';
    singularName: 'service';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    features: Schema.Attribute.Component<'shared.feature', true>;
    icon: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service.service'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiStorageFileStorageFile extends Struct.CollectionTypeSchema {
  collectionName: 'storage_files';
  info: {
    displayName: 'Storage File';
    pluralName: 'storage-files';
    singularName: 'storage-file';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    aiTags: Schema.Attribute.JSON;
    checksum: Schema.Attribute.String;
    children: Schema.Attribute.Relation<'oneToMany', 'api::storage-file.storage-file'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    etag: Schema.Attribute.String;
    isDirectory: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::storage-file.storage-file'> &
      Schema.Attribute.Private;
    locked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lockedAt: Schema.Attribute.DateTime;
    lockedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    metadata: Schema.Attribute.JSON;
    mimeType: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    parent: Schema.Attribute.Relation<'manyToOne', 'api::storage-file.storage-file'>;
    path: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    size: Schema.Attribute.BigInteger & Schema.Attribute.DefaultTo<'0'>;
    storageBackend: Schema.Attribute.Enumeration<['local', 's3', 'nextcloud']> &
      Schema.Attribute.DefaultTo<'local'>;
    storagePath: Schema.Attribute.String;
    thumbnailUrl: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiStudentProfileStudentProfile extends Struct.CollectionTypeSchema {
  collectionName: 'student_profiles';
  info: {
    description: '\u00D6\u011Frenci profil bilgileri';
    displayName: 'Student Profile';
    pluralName: 'student-profiles';
    singularName: 'student-profile';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    bloodType: Schema.Attribute.Enumeration<
      [
        'A_positive',
        'A_negative',
        'B_positive',
        'B_negative',
        'AB_positive',
        'AB_negative',
        'O_positive',
        'O_negative',
      ]
    >;
    classroom: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    dateOfBirth: Schema.Attribute.Date;
    disabilityLevel: Schema.Attribute.Enumeration<['mild', 'moderate', 'severe', 'profound']>;
    disabilityType: Schema.Attribute.String;
    emergencyContactName: Schema.Attribute.String;
    emergencyContactPhone: Schema.Attribute.String;
    enrollmentDate: Schema.Attribute.Date;
    faceEncodingUpdatedAt: Schema.Attribute.DateTime;
    facePhoto: Schema.Attribute.Media<'images'>;
    facePhotoUrl: Schema.Attribute.String;
    gender: Schema.Attribute.Enumeration<['male', 'female', 'other']>;
    graduationDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::student-profile.student-profile'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.RichText;
    parentGuardian: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    studentNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiTeacherProfileTeacherProfile extends Struct.CollectionTypeSchema {
  collectionName: 'teacher_profiles';
  info: {
    description: '\u00D6\u011Fretmen profil bilgileri';
    displayName: 'Teacher Profile';
    pluralName: 'teacher-profiles';
    singularName: 'teacher-profile';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    bio: Schema.Attribute.RichText;
    certifications: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    department: Schema.Attribute.String;
    employeeNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    hireDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::teacher-profile.teacher-profile'> &
      Schema.Attribute.Private;
    officeLocation: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    specialization: Schema.Attribute.String;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiTeamMemberTeamMember extends Struct.CollectionTypeSchema {
  collectionName: 'team_members';
  info: {
    description: '';
    displayName: 'Team Member';
    pluralName: 'team-members';
    singularName: 'team-member';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    link: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::team-member.team-member'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    objectPosition: Schema.Attribute.String;
    order: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiTelafiEgitimiTelafiEgitimi extends Struct.CollectionTypeSchema {
  collectionName: 'telafi_egitimleri';
  info: {
    description: 'Yap\u0131lamayan derslerin telafi takibi - MEB mevzuat\u0131na uygun';
    displayName: 'Telafi E\u011Fitimi';
    pluralName: 'telafi-egitimleri';
    singularName: 'telafi-egitimi';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    compensationDate: Schema.Attribute.Date;
    compensationEndTime: Schema.Attribute.Time;
    compensationSchedule: Schema.Attribute.Relation<'manyToOne', 'api::schedule.schedule'>;
    compensationStartTime: Schema.Attribute.Time;
    completedDate: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deadlineDate: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::telafi-egitimi.telafi-egitimi'> &
      Schema.Attribute.Private;
    missedDate: Schema.Attribute.Date & Schema.Attribute.Required;
    missedDuration: Schema.Attribute.Integer & Schema.Attribute.Required;
    missedEndTime: Schema.Attribute.Time;
    missedStartTime: Schema.Attribute.Time;
    notes: Schema.Attribute.Text;
    originalSchedule: Schema.Attribute.Relation<'manyToOne', 'api::schedule.schedule'>;
    publishedAt: Schema.Attribute.DateTime;
    reason: Schema.Attribute.Enumeration<
      [
        'ogrenci_hastalik',
        'ogrenci_izin',
        'ogretmen_hastalik',
        'ogretmen_izin',
        'kurum_tatil',
        'mucbir_sebep',
        'diger',
      ]
    > &
      Schema.Attribute.Required;
    reasonDetails: Schema.Attribute.Text;
    status: Schema.Attribute.Enumeration<
      ['beklemede', 'planlanmis', 'tamamlanmis', 'suresi_dolmus', 'iptal']
    > &
      Schema.Attribute.DefaultTo<'beklemede'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiTenantTenant extends Struct.CollectionTypeSchema {
  collectionName: 'tenants';
  info: {
    description: 'Companies using the ERP system';
    displayName: 'Tenant';
    pluralName: 'tenants';
    singularName: 'tenant';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    contactEmail: Schema.Attribute.Email;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    domain: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::tenant.tenant'> &
      Schema.Attribute.Private;
    mebbisPassword: Schema.Attribute.String & Schema.Attribute.Private;
    mebbisUsername: Schema.Attribute.String & Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    students: Schema.Attribute.Relation<'oneToMany', 'api::student-profile.student-profile'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'>;
  };
}

export interface ApiTerapiCetveliTerapiCetveli extends Struct.CollectionTypeSchema {
  collectionName: 'terapi_cetvelleri';
  info: {
    description: "Ayl\u0131k terapi cetveli - MEBB\u0130S'ten \u00E7ekilir";
    displayName: 'Terapi Cetveli (Ek-4)';
    pluralName: 'terapi-cetvelleri';
    singularName: 'terapi-cetveli';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    importedFromMebbis: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::terapi-cetveli.terapi-cetveli'> &
      Schema.Attribute.Private;
    mebbisImportDate: Schema.Attribute.DateTime;
    month: Schema.Attribute.String & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    sessions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    status: Schema.Attribute.Enumeration<['taslak', 'onaylandi', 'mebbise_aktarildi']> &
      Schema.Attribute.DefaultTo<'taslak'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student-profile.student-profile'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    totalBireysel: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalGrup: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalHours: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    year: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

export interface ApiTwoFactorAuthTwoFactorAuth extends Struct.CollectionTypeSchema {
  collectionName: 'two_factor_auths';
  info: {
    description: 'TOTP tabanl\u0131 iki fakt\u00F6rl\u00FC kimlik do\u011Frulama';
    displayName: '\u0130ki Fakt\u00F6rl\u00FC Do\u011Frulama (2FA)';
    pluralName: 'two-factor-auths';
    singularName: 'two-factor-auth';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    backupCodes: Schema.Attribute.JSON & Schema.Attribute.Private & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    failedAttempts: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    isEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    lastUsedAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::two-factor-auth.two-factor-auth'> &
      Schema.Attribute.Private;
    lockedUntil: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    secret: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    trustedDevices: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'> &
      Schema.Attribute.Unique;
  };
}

export interface ApiUcretHesaplamaUcretHesaplama extends Struct.CollectionTypeSchema {
  collectionName: 'ucret_hesaplamalari';
  info: {
    description: 'MEB \u00FCcret art\u0131\u015F form\u00FCl\u00FC hesaplama - \u00DCFE+T\u00DCFE tabanl\u0131';
    displayName: '\u00DCcret Hesaplama';
    pluralName: 'ucret-hesaplamalari';
    singularName: 'ucret-hesaplama';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicYear: Schema.Attribute.String & Schema.Attribute.Required;
    allowedIncreaseRate: Schema.Attribute.Decimal;
    averageInflation: Schema.Attribute.Decimal;
    basePriceBireysel: Schema.Attribute.Decimal & Schema.Attribute.Required;
    basePriceGrup: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    effectiveDate: Schema.Attribute.Date & Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::ucret-hesaplama.ucret-hesaplama'> &
      Schema.Attribute.Private;
    mebApprovalDate: Schema.Attribute.Date;
    mebApprovalNumber: Schema.Attribute.String;
    multiplier: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1.05>;
    newPriceBireysel: Schema.Attribute.Decimal;
    newPriceGrup: Schema.Attribute.Decimal;
    notes: Schema.Attribute.Text;
    previousYearDecemberTufe: Schema.Attribute.Decimal & Schema.Attribute.Required;
    previousYearDecemberUfe: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release-action'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['ready', 'blocked', 'failed', 'done', 'empty']> &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<'manyToOne', 'plugin::content-releases.release'>;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::i18n.locale'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow-stage'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<'manyToOne', 'plugin::review-workflows.workflow'>;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'> &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'>;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'>;
  };
}

export interface PluginUsersPermissionsUser extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>;
    tenant: Schema.Attribute.Relation<'manyToOne', 'api::tenant.tenant'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    userType: Schema.Attribute.Enumeration<['parent', 'teacher', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'admin'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::about.about': ApiAboutAbout;
      'api::appointment.appointment': ApiAppointmentAppointment;
      'api::article.article': ApiArticleArticle;
      'api::attendance-log.attendance-log': ApiAttendanceLogAttendanceLog;
      'api::audit-log.audit-log': ApiAuditLogAuditLog;
      'api::author.author': ApiAuthorAuthor;
      'api::bep-gelisim-izleme.bep-gelisim-izleme': ApiBepGelisimIzlemeBepGelisimIzleme;
      'api::bireysel-egitim-plani.bireysel-egitim-plani': ApiBireyselEgitimPlaniBireyselEgitimPlani;
      'api::category.category': ApiCategoryCategory;
      'api::contact-message.contact-message': ApiContactMessageContactMessage;
      'api::donem-sonu-degerlendirme.donem-sonu-degerlendirme': ApiDonemSonuDegerlendirmeDonemSonuDegerlendirme;
      'api::erp-role.erp-role': ApiErpRoleErpRole;
      'api::faq.faq': ApiFaqFaq;
      'api::fatura.fatura': ApiFaturaFatura;
      'api::file-share.file-share': ApiFileShareFileShare;
      'api::gallery.gallery': ApiGalleryGallery;
      'api::global.global': ApiGlobalGlobal;
      'api::hero.hero': ApiHeroHero;
      'api::kaba-degerlendirme.kaba-degerlendirme': ApiKabaDegerlendirmeKabaDegerlendirme;
      'api::kontrol-listesi.kontrol-listesi': ApiKontrolListesiKontrolListesi;
      'api::kvkk-onam.kvkk-onam': ApiKvkkOnamKvkkOnam;
      'api::location-log.location-log': ApiLocationLogLocationLog;
      'api::nextcloud-sync.nextcloud-sync': ApiNextcloudSyncNextcloudSync;
      'api::ogrenci-grubu.ogrenci-grubu': ApiOgrenciGrubuOgrenciGrubu;
      'api::performans-kayit.performans-kayit': ApiPerformansKayitPerformansKayit;
      'api::portfolyo-kontrol.portfolyo-kontrol': ApiPortfolyoKontrolPortfolyoKontrol;
      'api::portfolyo-puanlama.portfolyo-puanlama': ApiPortfolyoPuanlamaPortfolyoPuanlama;
      'api::process.process': ApiProcessProcess;
      'api::rapor.rapor': ApiRaporRapor;
      'api::route-stop.route-stop': ApiRouteStopRouteStop;
      'api::schedule.schedule': ApiScheduleSchedule;
      'api::service-route.service-route': ApiServiceRouteServiceRoute;
      'api::service.service': ApiServiceService;
      'api::storage-file.storage-file': ApiStorageFileStorageFile;
      'api::student-profile.student-profile': ApiStudentProfileStudentProfile;
      'api::teacher-profile.teacher-profile': ApiTeacherProfileTeacherProfile;
      'api::team-member.team-member': ApiTeamMemberTeamMember;
      'api::telafi-egitimi.telafi-egitimi': ApiTelafiEgitimiTelafiEgitimi;
      'api::tenant.tenant': ApiTenantTenant;
      'api::terapi-cetveli.terapi-cetveli': ApiTerapiCetveliTerapiCetveli;
      'api::two-factor-auth.two-factor-auth': ApiTwoFactorAuthTwoFactorAuth;
      'api::ucret-hesaplama.ucret-hesaplama': ApiUcretHesaplamaUcretHesaplama;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
