
import { User } from './types.ts';

/**
 * MASTER ASSOCIATE REGISTRY
 * To persist users "in the app itself" for access from anywhere, 
 * add their details to this array.
 */
export const HARDCODED_ASSOCIATES: User[] = [
  {
    empId: "123456",
    name: "Default Associate",
    passwordHash: btoa("password123"), // b64 of 'password123'
    role: 'associate',
    permissions: ['GlobalSummary', 'SocialMedia']
  }
];
