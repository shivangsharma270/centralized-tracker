
export interface Concern {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
  dateCreated: string;
  [key: string]: any; 
}

export interface ProxyConcern {
  id: string;
  'S no.': string;
  'Acknowledgement Date': string;
  'Owner': string;
  'Ticket ID': string;
  'Defendant GLID': string;
  'Defendant Mobile': string;
  'BS Complaints': string;
  'Unresolved BS Complaints': string;
  'Complainant GLID': string;
  'Introduction Found': string;
  'MM Seller GLID': string;
  'MM Date': string;
  'Suspected Seller GLID': string;
  'Product': string;
  'Dispute Amount': string;
  'Complaint Type': string;
  'Called Buyers': string;
  'Called Seller': string;
  'Case Study Thread': string;
  'Document Link': string;
  'Additional Mobile, UPI or other details': string;
  'Status': string;
  'Reason': string;
  'Case Study(RCA) Sheet Link': string;
  [key: string]: any;
}

export interface LegalConcern {
  id: string;
  'Worked Date': string;
  'HOD Name': string;
  'Type': string;
  'Intimation Date BS Conflict/PWIM Team': string;
  'Reply By (Date) BS Conflict Team': string;
  'TAT BS Conflilct': string;
  'Subject': string;
  'Thread Status': string;
  [key: string]: any;
}

export interface ImportantThread {
  id: string;
  'S. No.': string;
  'Threads Subject': string;
  'Tasks to be done': string;
  'Start Date': string;
  'Team': string;
  'Owner': string;
  'Status': string;
  'EDD - Closure': string;
  'Remarks': string;
  [key: string]: any;
}

export interface AISummary {
  overview: string;
  keyInsights: string[];
  recommendations: string[];
}

export interface GlobalSummary {
  executiveSummary: string;
  statusColor: 'green' | 'amber' | 'red';
  departmentalDeepDive: {
    social: string;
    proxy: string;
    legal: string;
    important: string;
  };
  keyPriorities: string[];
}

export type MainTabType = 'GlobalSummary' | 'SocialMedia' | 'Proxy' | 'Legal' | 'Important' | 'AdminPanel';

export interface User {
  empId: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'associate';
  permissions: MainTabType[];
}
