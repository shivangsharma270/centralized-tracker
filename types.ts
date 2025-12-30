
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
