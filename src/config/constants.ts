// Define types for the structures used in the module
interface DefaultReferralFields {
  investmentLevel: number;
  username: number;
  firstName: number;
  lastName: number;
  depositBalance: number;
  createdAt: number;
  investmentSubLevel: number;
}

interface AnalyticsType {
  PROFIT: string;
  CREDIT: string;
  REWARD: string;
}

interface DocumentTypes {
  ID_CARD: string;
  PASSPORT: string;
  LICENSE: string;
}

interface Status {
  APPROVED: string;
  REJECTED: string;
  PENDING: string;
}

interface TransactionTypes {
  WITHDRAWAL: string;
  DEPOSIT: string;
  PROFIT: string;
  REWARD: string;
  REFERRAL_CREDIT: string;
}

interface WithdrawalTypes {
  DEPOSIT: string;
  PROFIT: string;
  REWARD: string;
}

interface RankConfig {
  title: string;
  rewardFrom: number;
  rewardTo: number;
  requiredSalesFrom: number;
  requiredSalesTo: number;
  weeklyMeetings: number;
  directReferralsRequired: number;
}

interface AllowedRoute {
  TITLE: string;
  ROUTE: {
    PATH: string;
    METHOD: string;
  }[];
}

// Define the main configuration object
const config = {
  DEFAULT_REFERRAL_FIELDS: {
    investmentLevel: 1,
    username: 1,
    firstName: 1,
    lastName: 1,
    depositBalance: 1,
    createdAt: 1,
    investmentSubLevel: 1,
  } as DefaultReferralFields,

  ANALYTICS_TYPE: {
    PROFIT: 'profits',
    CREDIT: 'credits',
    REWARD: 'rewards',
  } as AnalyticsType,

  DOCUMENT_TYPES: {
    ID_CARD: 'ID_CARD',
    PASSPORT: 'PASSPORT',
    LICENSE: 'LICENSE',
  } as DocumentTypes,

  STATUS: {
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    PENDING: 'PENDING',
  } as Status,

  TRANSACTION_TYPES: {
    WITHDRAWAL: 'WITHDRAWAL',
    DEPOSIT: 'DEPOSIT',
    PROFIT: 'PROFIT',
    REWARD: 'REWARD',
    REFERRAL_CREDIT: 'REFERRAL_CREDIT',
  } as TransactionTypes,

  WITHDRAWAL_TYPES: {
    DEPOSIT: 'DEPOSIT',
    PROFIT: 'PROFIT',
    REWARD: 'REWARD',
  } as WithdrawalTypes,

  DEFAULT_FEE_AMOUNT: 0.05,
  MINIMUM_WITHDRAWAL_AMOUNT: 10,

  NOTIFICATION_TYPES: {
    GENERAL: 'GENERAL',
    ACTIVITY: 'ACTIVITY',
    IMPORTANT: 'IMPORTANT',
  },

  RANK_CONFIG: [
    {
      title: 'Leader 1',
      rewardFrom: 300,
      rewardTo: 500,
      requiredSalesFrom: 10000,
      requiredSalesTo: 15000,
      weeklyMeetings: 5,
      directReferralsRequired: 25,
    },
    {
      title: 'Leader 2',
      rewardFrom: 750,
      rewardTo: 1500,
      requiredSalesFrom: 30000,
      requiredSalesTo: 50000,
      weeklyMeetings: 5,
      directReferralsRequired: 25,
    },
    {
      title: 'Leader 3',
      rewardFrom: 2000,
      rewardTo: 2500,
      requiredSalesFrom: 750000,
      requiredSalesTo: 1000000,
      weeklyMeetings: 4,
      directReferralsRequired: 50,
    },
    {
      title: 'Leader 4',
      rewardFrom: 3000,
      rewardTo: 7500,
      requiredSalesFrom: 150000,
      requiredSalesTo: 300000,
      weeklyMeetings: 4,
      directReferralsRequired: 50,
    },
    {
      title: 'Leader 5',
      rewardFrom: 10000,
      rewardTo: 20000,
      requiredSalesFrom: 500000,
      requiredSalesTo: 1000000,
      weeklyMeetings: 3,
      directReferralsRequired: 100,
    },
  ] as RankConfig[],

  ALLOWED_ROUTES: [
    {
      TITLE: 'Create User',
      ROUTE: [
        {
          PATH: '/api/v1/admin/profile',
          METHOD: 'POST',
        },
      ],
    },
    {
      TITLE: 'Edit User',
      ROUTE: [
        {
          PATH: '/api/v1/admin/profile',
          METHOD: 'PUT',
        },
      ],
    },
    {
      TITLE: 'Delete User',
      ROUTE: [
        {
          PATH: '/api/v1/admin/profile',
          METHOD: 'DELETE',
        },
      ],
    },
    {
      TITLE: 'View Dashboard',
      ROUTE: [
        {
          PATH: '/api/v1/admin/analytics',
          METHOD: 'GET',
        },
      ],
    },
    {
      TITLE: 'Manage Content',
      ROUTE: [],
    },
  ] as AllowedRoute[],
};

export default config;
