export type ProfileVisibility = {
  showUpcomingTrips: boolean;
  showRecentReviews: boolean;
  showOrganizedTrips: boolean;
  showPastAttendance: boolean;
};

export type Profile = {
  id: string;
  userId: string;
  username: string;
  bio: string | null;
  pronouns: string | null;
  style: string | null;
} & ProfileVisibility;

