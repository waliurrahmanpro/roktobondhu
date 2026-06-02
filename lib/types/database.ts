export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  blood_group: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  phone: string;
  last_donation_date: string | null;
  donation_availability: boolean;
  profile_picture_url: string | null;
  total_points: number;
  total_donations: number;
  reported_donations: number;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Omit<
  Profile,
  | "id"
  | "created_at"
  | "updated_at"
  | "profile_picture_url"
  | "total_points"
  | "total_donations"
  | "reported_donations"
  | "is_banned"
> & {
  profile_picture_url?: string | null;
  total_points?: number;
  total_donations?: number;
  reported_donations?: number;
  is_banned?: boolean;
};

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">
>;

export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export type BloodRequestStatus = "active" | "completed" | "removed";

export type BloodRequest = {
  id: string;
  user_id: string;
  patient_name: string;
  blood_group: BloodGroup;
  hospital_name: string;
  district: string;
  contact_number: string;
  urgency_level: UrgencyLevel;
  request_date: string;
  status: BloodRequestStatus;
  created_at: string;
  updated_at: string;
};

export type BloodRequestInsert = Omit<
  BloodRequest,
  "id" | "created_at" | "updated_at" | "status"
> & {
  status?: BloodRequestStatus;
};

export type DonorRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "reported";

export type DonationFeedbackStatus = "fine" | "reported";

export type DonationReportStatus = "pending" | "resolved" | "dismissed";

export type Donation = {
  id: string;
  donor_request_id: string;
  donor_id: string;
  receiver_id: string;
  feedback_status: DonationFeedbackStatus;
  feedback_message: string | null;
  report_status: DonationReportStatus | null;
  completed_at: string;
};

export type AdminUser = {
  id: string;
  user_id: string;
  created_at: string;
};

export type DonationWithProfiles = Donation & {
  donor_profile: ProfileSummary | null;
  receiver_profile: ProfileSummary | null;
};

export type DonorRequest = {
  id: string;
  donor_id: string;
  receiver_id: string;
  status: DonorRequestStatus;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  donor_request_id: string | null;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export type ProfileSummary = Pick<
  Profile,
  "user_id" | "full_name" | "blood_group" | "district" | "upazila" | "phone"
>;

/** Public donor page — no phone */
export type PublicDonorProfile = Pick<
  Profile,
  | "id"
  | "user_id"
  | "full_name"
  | "blood_group"
  | "division"
  | "district"
  | "upazila"
  | "profile_picture_url"
  | "total_points"
  | "total_donations"
  | "reported_donations"
  | "donation_availability"
  | "last_donation_date"
  | "created_at"
  | "updated_at"
>;

export type DonorRequestWithProfiles = DonorRequest & {
  donor_profile: ProfileSummary | null;
  receiver_profile: ProfileSummary | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      blood_requests: {
        Row: BloodRequest;
        Insert: BloodRequestInsert;
        Update: Partial<Omit<BloodRequest, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      donor_requests: {
        Row: DonorRequest;
        Insert: Omit<DonorRequest, "id" | "created_at">;
        Update: Partial<Pick<DonorRequest, "status">>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at" | "read_at">;
        Update: Partial<Pick<Notification, "read_at">>;
        Relationships: [];
      };
      donations: {
        Row: Donation;
        Insert: Omit<Donation, "id" | "completed_at">;
        Update: Partial<Donation>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, "id" | "created_at">;
        Update: Partial<AdminUser>;
        Relationships: [];
      };
    };
    Functions: {
      complete_donation: {
        Args: {
          p_request_id: string;
          p_feedback_status: string;
          p_feedback_message?: string | null;
        };
        Returns: undefined;
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
