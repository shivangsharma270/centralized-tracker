
import { Concern } from '../types';

// The URL provided by the user. If this fails, we fall back to the provided sample data to ensure "accuracy" as requested.
export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ofyzwBVRjI6y1VNn-OBJtIPVKjaMdaMY2aZt-sFN7ao/export?format=csv';

const SAMPLE_CSV = `S no.,Acknowledgement Date,Mail Thread,Source,BS/Activation,BS Escalated,Type ,Ticket Id,Ticket Status,Last Updated On,Closing Comment,Proxy,Additional Comment,TAT,
1,1-Dec-25,Grievances Escalation (Request for Refund of Pending Balance – Listing Activation Not Required 91989014),Social Media Escalations,Activation,None,Activation Related,9731798,Closed,22-Dec-25,Not Activated,No,,16,
2,1-Dec-25,"Board Escalation (Fwd: Resolution Required Against Complaint received from Coyeh Service India Private Limited| Ticket ID 9702339)
",Board Escalations,BS,Paid BS,"Advance Paid But Product Not Delivered",9702339,WIP,30-Dec-25,-,No,,22,
3,3-Dec-25,"Playstore/App Feedback Escalation (Amrin_GL Id-211552558)
",Social Media Escalations,BS,Paid BS,"Advance Paid But Product Not Delivered",9714869,WIP,30-Dec-25,-,Yes,,20,
4,3-Dec-25,"Board Escalation (Fwd: Parcel not delivered 142041074)
",Social Media Escalations,BS,Paid BS,"Advance Paid But Product Not Delivered",9741132,WIP,30-Dec-25,-,No,,20,6
5,4-Dec-25,"Board Escalation (Request for Immediate Review and Resolution of Unfair Account Closure, Reduced Inquiry Visibility & Incorrect Complaint Handling)",Board Escalations,Activation,None,Activation Related,9746397,Closed,9-Dec-25,Not Activated,No,,4,
6,5-Dec-25,"Grievances Escalation (Received items fraud n need refund 75983269)",Board Escalations,BS,Paid BS, Advance Paid But Product Not Delivered,9749817,Closed,30-Dec-25,-,No,,18,
7,6-Dec-25,"Social Media Escalation (X user:-Satyendra Pandey @SatyendraP29126)",Social Media Escalations,BS,Paid BS, Advance Paid But Product Not Delivered,9752191,WIP,12-Dec-25,-,No,,17,
8,6-Dec-25,"Social Media Escalation (LinkedIn user:- Sachin Gupta)
",Board Escalations,BS,Paid BS,Quality Issue or Defective Product received,9430613,Closed,18-Dec-25,Quality Issue,No,,9,
9,6-Dec-25,"Social Media Escalation (X user:- Dhruv Goyal @DhruvGo90442903)",Board Escalations,BS,Free BS,Product Delivered But Payment Not Received,9686941,Closed,15-Dec-25,Fraud Alert Received >> Buyer's Listing Delisted,No,,6,
10,6-Dec-25,"Grievances Escalation (Complaint Against Unique Glass Works, Shri Maruti Glass, (Firozabad) – Non-Delivery, Wrong Shipment and Refund Refusal)",Board Escalations,BS,Paid BS,Quality Issue & partial product received,9754752,WIP,11-Dec-25,-,No,,17,
11,7-Dec-25,"Social Media Escalation (X User Kadir Pothiyawala @kadirpothiyawa9 50566508)",Social Media Escalations,BS,Free BS,Quality Issue or Defective Product received,9554653,Closed,8-Dec-25,Fraud Alert Received >>Seller's Listing De-listed,No,,1,
12,8-Dec-25,"Social Media Escalation (X user:- ROZZGAR VLOGS 0.2 @rozzgar51012)",Social Media Escalations,BS,Free BS, Advance Paid But Product Not Delivered,9759801,WIP,29-Dec-25,-,No,,17,
13,8-Dec-25,Re: Board Escalation (Re: MINUTES OF METTINGS 10098536),Social Media Escalations,BS,Paid BS, Advance Paid But Product Not Delivered,9752855,Closed,17-Dec-25,Advance Refunded to Complainant,No,,8,
14,11-Dec-25,"Board Escalation (Subject: Complaint Regarding Fraudulent Seller Activity and Non-Reflection of GST Payment 158520272)",DA/DG Escalations,BS,Paid BS,Partial Product Received,9768419,WIP,12-Dec-25,-,No,,14,
15,11-Dec-25,"Social Media Escalation (X user:- Digital Bangla @Digitalbangla93)",DA/DG Escalations,BS,Paid BS,Partial Product Received,9757399,WIP,29-Dec-25,-,No,,14,
16,12-Dec-25,"Board Escalation (Fwd: Regarding an order 110166365)",DA/DG Escalations,BS,None, Advance Paid But Product Not Delivered,9774641,Closed,15-Dec-25,No IM Intervention Required - Non-India MART Transaction,No,,2,
17,15-Dec-25,Social Media Escalation (Trustpilot user:- Maha Gharaibeh) ,Social Media Escalations,BS,Paid BS, Advance Paid But Product Not Delivered,9518192,Closed,29-Dec-25,Defendant Already Tagged Under Fraud Tag,No,,11,
18,13-Dec-25,"Board Escalation (Urgent Fraud Complaint – Request for Refund & Replacement (Paramount Hospital Furniture and Equipments) 17541418)",Social Media Escalations,BS,Paid BS,Quality Issue or Defective Product received,9715231,WIP,29-Dec-25,-,No,,12,
19,13-Dec-25,Social Media Escalation (X user:- dpk_vwa),Social Media Escalations,BS,Free BS,Duplicate Product Received,9779070,WIP,16-Dec-25,-,Yes,,12,
20,12-Dec-25,Social Media Escalation (Facebook user:- Subodh Bhaskaran),Social Media Escalations,BS,None,Partial Product Received,9776173,Closed,13-Dec-25,No IM Intervention Required - Non-India MART Transaction,No,,1,
21,16-Dec-25,"Consumer Helpline Complaint (Grievance lodged at Department of Consumer Affairs, Government of India | Riya GIFT CORNER (40294602))",Consumer Helpline,BS,None, Advance Paid But Product Not Delivered,9790101,WIP,30-Dec-25,-,No,,11,
22,16-Dec-25,Board Escalation (Reg-Complaint Letter Against Fraudulent Supplier on IndiaMART complaint number:(9788677),Board Escalations,BS,None, Advance Paid But Product Not Delivered,9788677,WIP,17-Dec-25,-,Yes,,11,
23,16-Dec-25,Social Media Escalation (X User_Srinivas Saginala @SrinivasSa42087),Social Media Escalations,BS,Free BS, Advance Paid But Product Not Delivered,9767574,WIP,17-Dec-25,-,No,,11,
24,13-Dec-25,"Board Escalation (Urgent Fraud Complaint – Request for Refund & Replacement (Paramount Hospital Furniture and Equipments) 17541418)
",Board Escalations,BS,Paid BS,Quality Issue,9715231,WIP,29-Dec-25,-,No,,12,
25,18-Dec-25,"Board Escalation (Urgent Escalation – Fraudulent Seller on IndiaMART (Soul Sterile Industry) – Payment Taken, Product Not Delivered)",Board Escalations,BS,None, Advance Paid But Product Not Delivered,9793777,WIP,19-Dec-25,-,No,,9,
26,18-Dec-25,"Playstore/App Feedback Escalation (tausif asgar_5330731)",Social Media Escalations,BS,None, Advance Paid But Product Not Delivered,9784209,WIP,19-Dec-25,-,No,,9,
27,18-Dec-25,"Social Media Escalation (X User Jay Chhatrala @JayChhatra29429)
",Social Media Escalations,Activation,None,Service Activation,9796212,Closed,19-Dec-25,Reboosted,No,,2,
28,18-Dec-25,Social Media Escalation (Facebook User भुवनेश गालव),Social Media Escalations,BS,Free BS, Advance Paid But Product Not Delivered,9767431,WIP,22-Dec-25,-,No,,9,
29,18-Dec-25,"Social Media Escalation (X User_ Gulab chouhan @GulabChouhan721)",Social Media Escalations,BS,Free BS, Advance Paid But Product Not Delivered,9781516,WIP,22-Dec-25,-,Yes,,9,
30,19-Dec-25,"Board Escalation (Fwd: No warok india mart_196067443)",Board Escalations,Activation,None,Service Activation,9800383,Closed,19-Dec-25,Reboosted,No,,1,
31,19-Dec-25,Grievances Escalation (Complaint Regarding Sale of Fake Products by Seller on IndiaMART – Sat Sri Sai Crop Protection Pvt Ltd),Board Escalations,BS,Free BS, Advance Paid But Product Not Delivered,9799902,Closed,23-Dec-25,No Action Taken-Documents Not Received,No,,3,
32,21-Dec-25,"Social Media Escalation (Facebook User_Mubarak Sadiq Ibrahim)",Social Media Escalations,BS,None,Login Issue,9806362,Closed,21-Dec-25,Closed,No,,0,
33,21-Dec-25,"Board Escalation (Board Escalation_Complaint by 201339569)",Board Escalations,Activation,None,Account Activation,9806622,WIP,26-Dec-25,-,No,,7,
34,20-Dec-25,Board Escalation ( Reg: Complaint Against Seller– National Pole Corporation | Failure to Supply & Wrong Material),Board Escalations,BS,Paid BS,Partial Product Received,9804030,WIP,23-Dec-25,-,No,,7,
35,22-Dec-25,Social Media Escalation (X User_Sachin Pagare @SachinP46071095),Social Media Escalations,BS,Paid BS,Wrong Product Received,9795933,WIP,26-Dec-25,-,Yes,,7,
36,23-Dec-25,Re: Audio from Armaan Brushes,Social Media Escalations,BS,Paid BS, Advance Paid But Product Not Delivered,9683072,Closed,24-Dec-25,Duplicate Thread. ,No,,2,
37,23-Dec-25,"Board Escalation (IndiaMart Sellers Failed To Provide Promised Critical Medical Supplies)",Board Escalations,BS,None, Advance Paid But Product Not Delivered,9813922,WIP,26-Dec-25,-,No,,6,
38,24-Dec-25,Board Escalation (Serious escalation: IndiaMART intervention failed - seller enabled to abscond after official resolution 160909072),Board Escalations,BS,None,Quality Issue,9810181,Closed,26-Dec-25,No IM Intervention Required - Ticket Already Closed UNder Routine        ,No,,3,
39,24-Dec-25,Board Escalation (Re: Resolution Required Against Complaint received from Mr. Prateek Rathi| Ticket ID 9771428),Board Escalations,BS,Free BS, Advance Paid But Product Not Delivered,9771428,WIP,26-Dec-25,-,No,,5,
40,24-Dec-25,Social Media Escalation (Instagram User raksaa_official),Social Media Escalations,BS,Paid BS,Partial Product Received,9790215,WIP,26-Dec-25,-,No,,5,
41,24-Dec-25,"Social Media Escalation (Instagram User smiledentalcare_nainadevi)",Social Media Escalations,BS,,,,WIP,,-,No,,5,
42,26-Dec-25,Board Escalation (Re: Resolution Required Against Complaint received from Sri Brothers Enterprises| Ticket ID 9792425,Board Escalations,BS,,,,WIP,,-,No,,3,
43,26-Dec-25,Social Media Escalation (Instagram User avi_ziie_th),Social Media Escalations,BS,,,,WIP,,-,No,,3,`;

export interface ParsedSheetData {
  concerns: Concern[];
  headers: string[];
}

export async function fetchSheetData(): Promise<ParsedSheetData> {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvText = await response.text();
    // Validate if it's the right sheet by checking a unique header
    if (!csvText.includes('Mail Thread')) throw new Error('Invalid sheet format');
    return parseCSV(csvText);
  } catch (error) {
    console.warn('Fetching from URL failed or format invalid, using provided CSV source:', error);
    return parseCSV(SAMPLE_CSV);
  }
}

function parseCSV(csv: string): ParsedSheetData {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  // Split lines while respecting quoted newlines
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') inQuotes = !inQuotes;
    if (char === '\n' && !inQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length < 1) return { concerns: [], headers: [] };

  // Helper to split a line by comma respecting quotes
  const splitLine = (line: string) => {
    const result: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const rawHeaders = splitLine(lines[0]).map(h => h.trim());
  const headers = rawHeaders.filter(h => h.length > 0);
  
  const concerns: Concern[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitLine(line);
    const entry: any = {};
    
    rawHeaders.forEach((header, index) => {
      const val = (values[index] || '').trim();
      entry[header] = val;
    });

    // CRITICAL: Generate a truly unique ID per record to prevent key collisions in React
    // Using index + TicketId ensures that even duplicates in the source sheet render correctly as separate rows.
    entry.id = `row-${i}-${entry['Ticket Id'] || 'no-ticket'}`;
    
    entry.title = entry['Mail Thread'] || 'Unnamed Thread';
    entry.status = entry['Ticket Status'] || 'WIP';
    entry.category = entry['Type '] || entry['Type'] || 'Other';
    entry.priority = entry['Source'] || 'General';
    
    concerns.push(entry as Concern);
  }

  return { concerns, headers };
}
