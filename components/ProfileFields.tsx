import {
  BLOOD_GROUPS,
  DIVISIONS,
  inputClassName,
  labelClassName,
} from "@/lib/constants";
import type { Profile } from "@/lib/types/database";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { DonationAvailabilityToggle } from "@/components/DonationAvailabilityToggle";

type ProfileFieldsProps = {
  profile?: Profile | null;
  showEmail?: boolean;
  email?: string;
  showProfilePicture?: boolean;
};

export function ProfileFields({
  profile,
  showEmail = false,
  email = "",
  showProfilePicture = false,
}: ProfileFieldsProps) {
  return (
    <>
      {showProfilePicture && (
        <ProfilePictureUpload currentUrl={profile?.profile_picture_url} />
      )}

      {showEmail && (
        <div>
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email}
            className={inputClassName}
          />
        </div>
      )}

      <div>
        <label htmlFor="full_name" className={labelClassName}>
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile?.full_name ?? ""}
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="blood_group" className={labelClassName}>
            Blood group
          </label>
          <select
            id="blood_group"
            name="blood_group"
            required
            defaultValue={profile?.blood_group ?? ""}
            className={inputClassName}
          >
            <option value="" disabled>
              Select group
            </option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="phone" className={labelClassName}>
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="01XXXXXXXXX"
            defaultValue={profile?.phone ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="division" className={labelClassName}>
            Division
          </label>
          <select
            id="division"
            name="division"
            required
            defaultValue={profile?.division ?? ""}
            className={inputClassName}
          >
            <option value="" disabled>
              Select division
            </option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="district" className={labelClassName}>
            District
          </label>
          <input
            id="district"
            name="district"
            type="text"
            required
            placeholder="e.g. Dhaka"
            defaultValue={profile?.district ?? ""}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="upazila" className={labelClassName}>
            Upazila
          </label>
          <input
            id="upazila"
            name="upazila"
            type="text"
            required
            placeholder="e.g. Mirpur"
            defaultValue={profile?.upazila ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="last_donation_date" className={labelClassName}>
            Last donation date
          </label>
          <input
            id="last_donation_date"
            name="last_donation_date"
            type="date"
            defaultValue={profile?.last_donation_date ?? ""}
            className={inputClassName}
          />
        </div>
        <DonationAvailabilityToggle
          defaultOn={profile?.donation_availability ?? true}
        />
      </div>
    </>
  );
}
