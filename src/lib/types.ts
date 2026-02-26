export type Role = 'guide' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  tripId?: string;
}

export interface SiteVisit {
  name: string;
  time: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  location: string;
  activities: string;
  sites?: SiteVisit[];
  lat?: number;
  lng?: number;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface TripStudent {
  id: string;
  name: string;
}

export interface Trip {
  id: string;
  name: string;
  joinCode: string;
  itinerary: ItineraryDay[];
  notices: Notice[];
  logistics: BoardingStatus[];
  emergencyContacts: EmergencyContact[];
  students: TripStudent[];
  reports?: RoomReport[];
  wakeUpTime?: string;
  lightsOutTime?: string;
  activeRestStop?: {
    endTime: string; // ISO string
    confirmedStudentIds: string[];
  };
  activeBoarding?: {
    confirmedStudentIds: string[];
  };
}

export interface Notice {
  id: string;
  content: string;
  timestamp: string;
}

export interface BoardingStatus {
  studentId: string;
  studentName: string;
  status: 'pending' | 'confirmed';
  type: 'bus' | 'meal' | 'other';
}

export interface RoomReport {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  description: string;
  status: 'open' | 'reported' | 'fixed';
  timestamp: string;
  photoUrl?: string;
}
