/**
 * English Translations
 */

const English = {
  options: 'Options',
  appearance: 'Appearance',
  system: 'System',
  mode: 'Mode',
  changeMode: 'Switch between light and dark mode',
  lightMode: 'Light',
  darkMode: 'Dark',
  color: 'Color',
  changeColor: 'Change theme color',
  goHome: 'Go to home screen',
  save: 'Save',
  cancel: 'Cancel',
  unknownError: 'Something went wrong. Please try again.',
  requestFailed: 'Request failed ({{status}})',
  apiUrlMissing: 'Set the API URL in Settings first.',
  downloadFailed: 'Could not open the file. Please try again.',
  idLabel: 'ID',
  ok: 'OK',
  back: 'Back',
  edit: 'Edit',
  delete: 'Delete',
  deleteConfirmTitle: 'Delete this entry?',
  deleteConfirmMessage: 'It will be removed from your records.',
  entityNotFound:
    'This entry is not loaded anymore. Go back and open it again from the list.',
  emptyList: 'Nothing here yet.',
  year: 'Year',
  errorNoItems: 'Add at least one item.',
  errorOwnerRequired: 'Choose a business, car or house first.',
  errorAmountInvalid: 'Enter a valid amount.',
  errorPercentageInvalid: 'The usage percentage must be between 1 and 100.',
  errorKmInvalid: 'Enter the distance travelled.',
  errorNumberInvalid: 'Enter a valid number.',
  savedPartially:
    'Saved {{saved}} of {{total}} items. The others were not saved: {{error}}',
  editExpenseTitle: 'Edit business expense',
  editCarExpenseTitle: 'Edit car expense',
  editHouseExpenseTitle: 'Edit house expense',
  editIncomeTitle: 'Edit income',
  editTravelLogTitle: 'Edit travel log',
  editMiscFileTitle: 'Edit misc file',
  expenseItem: 'Expense item',
  expenseType: 'Expense type',
  addItem: 'Add item',
  usagePercentage: 'Usage percentage (1-100%)',
  saveChanges: 'Save changes',
  amountTypeLabel: 'Amount type',
  hasTpsLabel: 'TPS (CA 5%)',
  hasTvqLabel: 'TVQ (QC 9.975%)',
  attachedFiles: 'Attached files',
  travelledKm: 'Distance travelled',
  consumptionOptional: 'Consumption (optional)',
  amountOptional: 'Amount (optional)',
  pickFiles: 'Pick files',
  takePicture: 'Take a picture',
  pickImages: 'Pick images from the gallery',
  dropFilesHere: 'Drop files here',
  dragFilesHere: 'Drag files here or click to select',
  selectFiles: 'Select files',
  dropImagesHere: 'Drop images here',
  dragImagesHere: 'Drag images here or click to select',
  selectImages: 'Select images',
  imageFailedToLoad: 'Failed to load',
  all: 'All',
  tps: 'TPS',
  tvq: 'TVQ',
  notApplicable: 'N/A',
  businessId: 'Business',
  carId: 'Car',
  houseId: 'House',
  dpaCategory: 'DPA category',
  creationDate: 'Created',
  screen404: "This screen doesn't exist",
  titleNotFound: 'Not Found',
  titleSettings: 'Settings',
  titleBusiness: 'Business',
  titleExpenses: 'Expenses',
  titleCarExpenses: 'Car Expenses',
  titleHouseExpenses: 'House Expenses',
  titleIncomes: 'Incomes',
  titleTravelLogs: 'Travel Logs',
  titleMiscFiles: 'Misc Files',
  titleReports: 'Reports',
  settingsSaved: 'Settings saved',
  unsavedChanges: 'You have unsaved changes.',
  paymentMethod: 'Payment method',
  notSpecified: 'Not specified',
  paymentMethods: {
    Cash: 'Cash',
    Interac: 'Interac',
    Check: 'Cheque',
    WireTransfer: 'Wire transfer',
    CreditCard: 'Credit card',
    DebitCard: 'Debit card',
  },
  dpaCategoryLabel: 'CCA class (e.g. Class 8)',
  invoiceLines: 'Invoice lines',
  invoiceLine: 'Line',
  addLine: 'Add line',
  invoiceLinesHint: 'With lines, the income total is the sum of the lines.',
  settingsSavedForSession:
    'Settings applied for this session. On the web they are read from the .env file.',
  default: 'default',
  orange: 'orange',
  red: 'red',
  violet: 'violet',
  indigo: 'indigo',
  blue: 'blue',
  teal: 'teal',
  cyan: 'cyan',
  green: 'green',
  lime: 'lime',
  olive: 'olive',
  brown: 'brown',
  apiSettings: 'API Settings',
  apiUrl: 'API URL',
  apiKey: 'Api key',
  userId: 'User ID',
  businessIds: 'Business IDs',
  carIds: 'Car IDs',
  houseIds: 'House IDs',
  createIncomeTitle: 'Create a new income',
  createExpenseTitle: 'Create a new expense',
  createCarExpenseTitle: 'Create a new car expense',
  createHouseExpenseTitle: 'Create a new house expense',
  createTravelLogTitle: 'Create a new travel log',
  createMiscFileTitle: 'Create a new misc file',
  defaultHasTps: 'Default TPS',
  defaultHasTvq: 'Default TVQ',
  home: 'Home',
  homeComingSoon: 'Show stats on home page (soon).',
  invoiceDate: 'Invoice date',
  clientName: 'Client name',
  description: 'Description',
  subtotal: 'Subtotal',
  hasTps: 'Has TPS',
  hasTvq: 'Has TVQ',
  notes: 'Notes',
  files: 'Files',
  amount: 'Amount',
  carExpenseType: {
    Gaz: 'Gaz',
    Oil: 'Oil',
    Maintenance: 'Maintenance',
    Repair: 'Repair',
    CarWash: 'Car wash',
    Insurance: 'Insurance',
    Toll: 'Toll',
    Unclassified: 'Unclassified (please dont)',
    Licence: 'License (permis de conduire)',
    Electricity: 'Electricity (zero-emission vehicule)',
    Registration: 'Registration (immatriculation)',
    ParkingFees: 'Parking Fees',
  },
  amountType: {
    NoTaxes: 'No taxes',
    TaxesIncluded: 'Taxes included',
    TaxesExcluded: 'Amount + taxes',
  },
  miscFileCategory: {
    Medical: 'Medical',
    CarAnnualKm: 'Car Annual Km (start and end of year)',
    CarRelated: 'Car Related',
    HouseRelated: 'House Related',
    BusinessRelated: 'Business Related',
    Personal: 'Personal',
    Others: 'Others',
  },
  houseExpenseType: {
    Unclassified: 'Unclassified (please dont)',
    Electricity: 'Electricity (hydro-quebec)',
    Insurance: 'Insurance',
    Maintenance: 'Maintenance / Cleaning',
    Internet: 'Internet',
    Rent: 'Rent',
    Heating: 'Heating',
    MortgageInterest: 'Mortgage Interest (house)',
    Phone: 'Phone (house phone)',
  },
  businessExpenseType: {
    Unclassified: 'Unclassified (please dont)',
    Advertising: 'Advertising and Promotion',
    MealsAndEntertainment: 'Meals and Entertainment',
    BadDebts: 'Bad Debts (someone didnt pay you)',
    Insurance: 'Professional Insurance',
    InterestAndBankCharges: 'Interest And Bank Charges',
    BusinessTaxesLicencesAndMemberships:
      'Professional Licences and Memberships',
    OfficeExpenses: 'Office Expenses (minor costs)',
    OfficeStationeryAndSupplies: 'Office Supplies (bigger costs)',
    ProfessionalFees: 'Professional Services',
    ManagementAndAdministrationFees: 'Administrative Services',
    BusinessRent: 'Business Rent',
    RepairsAndMaintenance: 'Repairs and Maintenance',
    SalariesAndWages: 'Salaries and Wages',
    PropertyTaxes: 'Property Taxes',
    TravelExpenses: 'Travel Expenses',
    Utilities: 'Telephone',
    FuelCosts: 'Fuel Costs',
    DeliveryFreightAndExpress: 'Delivery, Freight and Express',
    CapitalCostAllowance: 'Equipments, Tools, Furniture (CCA)',
  },
  businessExpenseTypeDescription: {
    unclassified: 'Just pick something else.',
    advertising:
      'Expenses to promote your business.\n\
Examples:\n\
 - Online ads (Google, Facebook)\n - Business cards\n\
 - Flyers or brochures\n - Website costs (only the promotional part)\n\
Not claimable:\n\
 - Ads directed at political parties or candidates\n\
 - Sponsorships that are personal in nature\n\
 - Meals during advertising events',
    mealsAndEntertainment:
      '50% of reasonable food, beverage, and entertainment expenses related to earning income.\n\
Examples:\n\
 - Taking a client to lunch or coffee\n\
 - Meals while traveling for work\n\
Not claimable:\n\
 - Personal meals\n\
 - Meals with friends or family unless clearly stated business-related',
    badDebts:
      'Amounts previously included in income but now uncollectible (never paid by clients).',
    insurance:
      'Insurance directly related to your business.\n\
Examples:\n\
 - Commercial liability insurance\n\
 - Equipment or inventory insurance\n\
Not claimable:\n\
 - Life insurance (unless its required by a lender and business-related)\n\
 - Personal home or auto insurance (unless portion used for business)',
    interestAndBankCharges:
      'Fees related to business banking or business loans.\n\
Examples:\n\
 - Interest on business credit cards or loans\n\
 - Monthly business account fees\n\
Not claimable:\n\
 - Interest on personal credit cards\n\
 - Bank fees on personal accounts',
    businessTaxesLicencesAndMemberships:
      'Mandatory business fees.\n\
Examples:\n\
 - Business license fees\n\
 - Trade association dues\n\
 - Municipal taxes related to business operations\n\
Not claimable:\n\
 - Club memberships (e.g., golf clubs, gyms)\n\
 - Fines or penalties',
    officeExpenses:
      'Minor costs for running your office.\n\
Examples:\n\
 - Pens, staples, paper clips\n\
 - Small desk accessories\n\
Not claimable:\n\
 - Computers or furniture (these are capital assets CCA)\n\
 - Supplies used personally',
    officeStationeryAndSupplies:
      'Supplies used directly in your business.\n\
Examples:\n\
 - Printer ink\n\
 - Envelopes\n\
 - Postage\n\
Not claimable:\n\
 - Supplies used personally\n\
 - Capital items like printers',
    professionalFees:
      'Fees paid to professionals for business-related services.\n\
Examples:\n\
 - Lawyer for business contracts\n\
 - Accountant for tax filing\n\
Not claimable:\n\
 - Personal legal fees (e.g., divorce)\n\
 - Financial planner for personal finances',
    managementAndAdministrationFees:
      'Fees paid to others for managing or administering part of your business.\n\
Examples:\n\
 - Fees paid to a management company\n\
 - Administrative consultant services\n\
Not claimable:\n\
 - Payments to employees (should go under salaries)\n\
 - Personal management services',
    businessRent:
      'Rent paid for business premises.\n\
Examples:\n\
 - Renting an office or retail space\n\
 - Coworking space fees\n\
Not claimable:\n\
 - Rent for personal residence\n\
 - Security deposits',
    repairsAndMaintenance:
      'Cost of repairing or maintaining business assets.\n\
Examples:\n\
 - Fixing business equipment\n\
 - Painting the office\n\
Not claimable:\n\
 - Home repairs (unless business-use-of-home portion)\n\
 - Major renovations (capital expense)',
    salariesAndWages: 'Amounts paid to employees.',
    propertyTaxes:
      'Business portion of property taxes on your business location.',
    // Keyed by the stored value, which is 'TravelExpenses' (capital T) for this type.
    TravelExpenses:
      'Travel for business purposes.\n\
Examples:\n\
 - Flights, hotels, taxis for business trips\n\
 - Travel to conferences\n\
Not claimable:\n\
 - Commuting from home to regular work location\n\
 - Personal vacations, even if you "talked business"',
    utilities:
      'Telephone.\nCell phone unless used for business (only business portion allowed).',
    fuelCosts: 'Fuel used for equipment or heating.',
    deliveryFreightAndExpress: 'Cost to ship goods or documents.',
    capitalCostAllowance:
      'Annual depreciation on your furnitures, equipments, vehicules, laptop, camera, etc.\n\
    ',
  },
  // Reports page
  reportsFromDate: 'From Date',
  reportsToDate: 'To Date',
  reportsSelectDates: 'Please select from and to dates',
  reportsDownloadSuccess: 'Report downloaded successfully',
  reportsDownloadError: 'Failed to download report',
  reportsSaveDialog: 'Save {{filename}}',
  reportsDownloadHouseExpenses: 'Download House Expenses Report',
  reportsDownloadCarExpenses: 'Download Car Expenses Report',
  reportsDownloadMiscFiles: 'Download Misc Files Report',
  reportsDownloadDuplicates: 'Download Duplicates Report',
  titleDuplicates: 'Duplicates',
  // Viewer screens
  viewerDetails: 'Details',
  viewerImages: 'Images',
  viewerFiles: 'Files',
  viewerExpenseType: 'Type',
  viewerTotal: 'Total',
  viewerDeductiblePercentage: 'Deductible %',
  viewerDeductibleTotal: 'Deductible Total',
  viewerDate: 'Date',
  viewerCategory: 'Category',
  viewerReason: 'Reason',
  viewerTravelDate: 'Travel Date',
  viewerTotalKm: 'Total KM',
  viewerConsumption: 'Consumption',
  viewExpenseTitle: 'View Expense',
  viewCarExpenseTitle: 'View Car Expense',
  viewHouseExpenseTitle: 'View House Expense',
  viewIncomeTitle: 'View Income',
  viewMiscFileTitle: 'View Misc File',
  viewTravelLogTitle: 'View Travel Log',
}

export default English
