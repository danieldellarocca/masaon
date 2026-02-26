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
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  location: string;
  activities: string;
  sites?: SiteVisit[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface Trip {
  id: string;
  name: string;
  joinCode: string;
  itinerary: ItineraryDay[];
  notices: Notice[];
  logistics: BoardingStatus[];
  emergencyContacts: EmergencyContact[];
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
  status: 'open' | 'resolved';
  timestamp: string;
}
