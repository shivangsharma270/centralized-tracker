
export interface Concern {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
  dateCreated: string;
  [key: string]: any; // For flexible columns
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

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
}

export interface AISummary {
  overview: string;
  keyInsights: string[];
  recommendations: string[];
}
