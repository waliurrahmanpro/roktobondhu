export type DonorBadge = {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
};

export function getDonorBadge(totalPoints: number): DonorBadge {
  if (totalPoints >= 500) {
    return {
      name: "Hero Donor",
      color: "text-purple-900",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300",
      icon: "🦸",
    };
  }
  if (totalPoints >= 250) {
    return {
      name: "Gold Donor",
      color: "text-yellow-900",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-300",
      icon: "🥇",
    };
  }
  if (totalPoints >= 100) {
    return {
      name: "Silver Donor",
      color: "text-slate-700",
      bgColor: "bg-slate-200",
      borderColor: "border-slate-300",
      icon: "🥈",
    };
  }
  if (totalPoints >= 50) {
    return {
      name: "Bronze Donor",
      color: "text-amber-900",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-300",
      icon: "🥉",
    };
  }
  return {
    name: "New Donor",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    icon: "🌱",
  };
}
