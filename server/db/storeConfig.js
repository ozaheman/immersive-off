const STORES = {
  PROJECTS: 'projects',
  SITE_DATA: 'siteData',
  FILES: 'files',
  HR_DATA: 'hrData',
  SETTINGS: 'settings',
  OFFICE_EXPENSES: 'officeExpenses',
  FINANCIAL_TEMPLATES: 'financialTemplates',
  HOLIDAYS: 'holidays',
  STAFF_LEAVES: 'staffLeaves',
  DESIGN_SCRUM: 'designScrum',
  BULLETIN: 'bulletin',
  VENDORS: 'vendors',
  REFERRAL_ACCOUNTS: 'referralAccounts',
  OTHER_ACCOUNTS: 'otherAccounts',
  ASSETS: 'assets',
  LETTER_DRAFTS: 'letterDrafts',
  SENT_LETTERS: 'sentLetters',
  RECIPIENT_HISTORY: 'recipientHistory'
};

const STORE_META = {
  [STORES.PROJECTS]: { keyPath: 'jobNo', autoIncrement: false },
  [STORES.SITE_DATA]: { keyPath: 'jobNo', autoIncrement: false },
  [STORES.FILES]: { keyPath: 'id', autoIncrement: true },
  [STORES.HR_DATA]: { keyPath: 'id', autoIncrement: true },
  [STORES.SETTINGS]: { keyPath: 'id', autoIncrement: false },
  [STORES.OFFICE_EXPENSES]: { keyPath: 'id', autoIncrement: true },
  [STORES.FINANCIAL_TEMPLATES]: { keyPath: 'id', autoIncrement: false },
  [STORES.HOLIDAYS]: { keyPath: 'id', autoIncrement: true },
  [STORES.STAFF_LEAVES]: { keyPath: 'id', autoIncrement: true },
  [STORES.DESIGN_SCRUM]: { keyPath: 'jobNo', autoIncrement: false },
  [STORES.BULLETIN]: { keyPath: 'id', autoIncrement: true },
  [STORES.VENDORS]: { keyPath: 'id', autoIncrement: true },
  [STORES.REFERRAL_ACCOUNTS]: { keyPath: 'id', autoIncrement: true },
  [STORES.OTHER_ACCOUNTS]: { keyPath: 'id', autoIncrement: true },
  [STORES.ASSETS]: { keyPath: 'id', autoIncrement: true },
  [STORES.LETTER_DRAFTS]: { keyPath: 'id', autoIncrement: true },
  [STORES.SENT_LETTERS]: { keyPath: 'id', autoIncrement: true },
  [STORES.RECIPIENT_HISTORY]: { keyPath: 'id', autoIncrement: true }
};

function getStoreMeta(storeName) {
  return STORE_META[storeName] || { keyPath: 'id', autoIncrement: true };
}

function parseKey(storeName, rawKey) {
  const meta = getStoreMeta(storeName);
  if (meta.autoIncrement) {
    const asNum = Number(rawKey);
    return Number.isFinite(asNum) ? asNum : rawKey;
  }
  return rawKey;
}

module.exports = {
  STORES,
  STORE_META,
  getStoreMeta,
  parseKey
};
