export type UserRole = "user" | "admin" | "super_admin";

export type VerificationStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

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
  full_address: string | null;
  phone: string;
  date_of_birth: string | null;
  last_donation_date: string | null;
  next_eligible_date: string | null;
  donation_availability: boolean;
  nid_front_url: string | null;
  nid_back_url: string | null;
  verification_status: VerificationStatus;
  profile_picture_url: string | null;
  total_points: number;
  total_donations: number;
  reported_donations: number;
  is_banned: boolean;
  role: UserRole;
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
  | "role"
  | "full_address"
  | "date_of_birth"
  | "next_eligible_date"
  | "nid_front_url"
  | "nid_back_url"
  | "verification_status"
> & {
  next_eligible_date?: string | null;
  profile_picture_url?: string | null;
  full_address?: string | null;
  date_of_birth?: string | null;
  nid_front_url?: string | null;
  nid_back_url?: string | null;
  verification_status?: VerificationStatus;
  total_points?: number;
  total_donations?: number;
  reported_donations?: number;
  is_banned?: boolean;
  role?: UserRole;
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
  division: string | null;
  district: string;
  upazila: string | null;
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
  division?: string | null;
  upazila?: string | null;
};

export type MatchLog = {
  id: string;
  request_id: string;
  donor_id: string;
  match_score: number;
  accepted_at: string | null;
  donation_completed_at: string | null;
  created_at: string;
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

export type SiteSettings = {
  id: number;
  registration_enabled: boolean;
  blood_request_enabled: boolean;
  maintenance_mode: boolean;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PointTransaction = {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  balance_after: number;
  created_by: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
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
  blood_request_id: string | null;
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
  | "full_address"
  | "profile_picture_url"
  | "total_points"
  | "total_donations"
  | "reported_donations"
  | "donation_availability"
  | "verification_status"
  | "next_eligible_date"
  | "date_of_birth"
  | "is_banned"
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
      site_settings: {
        Row: SiteSettings;
        Insert: Omit<SiteSettings, "updated_at">;
        Update: Partial<SiteSettings>;
        Relationships: [];
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, "id" | "created_at" | "updated_at">;
        Update: Partial<Announcement>;
        Relationships: [];
      };
      point_transactions: {
        Row: PointTransaction;
        Insert: Omit<PointTransaction, "id" | "created_at">;
        Update: Partial<PointTransaction>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      match_logs: {
        Row: MatchLog;
        Insert: Omit<MatchLog, "id" | "created_at" | "accepted_at" | "donation_completed_at">;
        Update: Partial<MatchLog>;
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
      set_user_role: {
        Args: { p_user_id: string; p_new_role: string };
        Returns: undefined;
      };
      adjust_user_points: {
        Args: { p_user_id: string; p_delta: number; p_reason: string };
        Returns: undefined;
      };
      broadcast_notification: {
        Args: { p_title: string; p_message: string };
        Returns: number;
      };
      create_announcement: {
        Args: {
          p_title: string;
          p_body: string;
          p_notify_all?: boolean;
        };
        Returns: string;
      };
      update_site_settings: {
        Args: {
          p_registration_enabled: boolean;
          p_blood_request_enabled: boolean;
          p_maintenance_mode: boolean;
        };
        Returns: undefined;
      };
      insert_audit_log: {
        Args: {
          p_action: string;
          p_target_type?: string | null;
          p_target_id?: string | null;
          p_details?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      process_blood_request_matching: {
        Args: { p_request_id: string };
        Returns: number;
      };
      review_identity_verification: {
        Args: { p_user_id: string; p_action: "approve" | "reject" };
        Returns: undefined;
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
