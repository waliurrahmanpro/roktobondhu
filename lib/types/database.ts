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
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Omit<
  Profile,
  "id" | "created_at" | "updated_at"
>;

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">
>;

export type UrgencyLevel = "critical" | "high" | "medium" | "low";

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
  created_at: string;
  updated_at: string;
};

export type BloodRequestInsert = Omit<
  BloodRequest,
  "id" | "created_at" | "updated_at"
>;

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
