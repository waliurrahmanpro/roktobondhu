import { BLOOD_GROUPS, inputClassName, labelClassName } from "@/lib/constants";
import type { Profile } from "@/lib/types/database";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { DonationAvailabilityToggle } from "@/components/DonationAvailabilityToggle";
import { LocationCascadingSelect } from "@/components/LocationCascadingSelect";

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

      <LocationCascadingSelect
        defaultDivision={profile?.division}
        defaultDistrict={profile?.district}
        defaultUpazila={profile?.upazila}
        idPrefix="profile"
      />

      <div>
        <label htmlFor="full_address" className={labelClassName}>
          Full address (optional)
        </label>
        <textarea
          id="full_address"
          name="full_address"
          rows={3}
          placeholder="House/road, area, landmark…"
          defaultValue={profile?.full_address ?? ""}
          className={inputClassName}
        />
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
