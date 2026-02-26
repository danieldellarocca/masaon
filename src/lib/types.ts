export type Role = 'guide' | 'student';

export interface User {
  id: string;
  name: string;
  role: Role;
  tripId?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  location: string;
  activities: string;
}

export interface Trip {
  id: string;
  name: string;
  joinCode: string;
  itinerary: ItineraryDay[];
  notices: Notice[];
  logistics: BoardingStatus[];
  wakeUpTime?: string;
  lightsOutTime?: string;
  clothingGuide?: string;
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
