import avatar01 from "@/assets/avatar_01_afro_woman.png";
import avatar02 from "@/assets/avatar_02_south_asian_man.png";
import avatar03 from "@/assets/avatar_03_east_asian_woman.png";
import avatar04 from "@/assets/avatar_04_bald_black_man.png";
import avatar05 from "@/assets/avatar_05_latina_woman.png";
import avatar06 from "@/assets/avatar_06_older_white_man.png";
import avatar07 from "@/assets/avatar_07_young_white_man.png";
import avatar08 from "@/assets/avatar_08_hijab_woman.png";
import avatar09 from "@/assets/avatar_09_short_hair_black_woman.png";
import avatar10 from "@/assets/avatar_10_east_asian_man.png";
import avatar11 from "@/assets/avatar_11_older_black_woman.png";
import avatar12 from "@/assets/avatar_12_middle_eastern_man.png";
import avatar13 from "@/assets/avatar_13_locs_man.png";
import avatar14 from "@/assets/avatar_14_south_asian_headscarf.png";
import avatar15 from "@/assets/avatar_15_pacific_islander.png";
import avatar16 from "@/assets/avatar_16_teen_girl_south_asian.png";
import avatar17 from "@/assets/avatar_17_east_asian_bob.png";
import avatar18 from "@/assets/avatar_18_sea_man.png";
import avatar19 from "@/assets/avatar_19_mixed_woman.png";
import avatar20 from "@/assets/avatar_20_latino_man.png";
import avatar21 from "@/assets/avatar_21_north_african_woman.png";
import avatar22 from "@/assets/avatar_22_european_man_middle.png";
import avatar23 from "@/assets/avatar_23_black_woman_braids.png";
import avatar24 from "@/assets/avatar_24_south_asian_young_man.png";
import avatar25 from "@/assets/avatar_25_older_east_asian_woman.png";
import avatar26 from "@/assets/avatar_26_older_african_man.png";
import avatar27 from "@/assets/avatar_27_hijab_teal.png";
import avatar28 from "@/assets/avatar_28_blond_man.png";
import avatar29 from "@/assets/avatar_29_sea_woman.png";
import avatar30 from "@/assets/avatar_30_european_woman_redhair.png";
import avatar31 from "@/assets/avatar_31_mixed_asian_latina.png";
import avatar32 from "@/assets/avatar_32_east_asian_crop.png";
import avatar33 from "@/assets/avatar_33_fatima.png";

export interface CitySenseAvatar {
  id: string;
  image: string;
}

export const citySenseAvatars: CitySenseAvatar[] = [
  { id: "avatar-01", image: avatar01 },
  { id: "avatar-02", image: avatar02 },
  { id: "avatar-03", image: avatar03 },
  { id: "avatar-04", image: avatar04 },
  { id: "avatar-05", image: avatar05 },
  { id: "avatar-06", image: avatar06 },
  { id: "avatar-07", image: avatar07 },
  { id: "avatar-08", image: avatar08 },
  { id: "avatar-09", image: avatar09 },
  { id: "avatar-10", image: avatar10 },
  { id: "avatar-11", image: avatar11 },
  { id: "avatar-12", image: avatar12 },
  { id: "avatar-13", image: avatar13 },
  { id: "avatar-14", image: avatar14 },
  { id: "avatar-15", image: avatar15 },
  { id: "avatar-16", image: avatar16 },
  { id: "avatar-17", image: avatar17 },
  { id: "avatar-18", image: avatar18 },
  { id: "avatar-19", image: avatar19 },
  { id: "avatar-20", image: avatar20 },
  { id: "avatar-21", image: avatar21 },
  { id: "avatar-22", image: avatar22 },
  { id: "avatar-23", image: avatar23 },
  { id: "avatar-24", image: avatar24 },
  { id: "avatar-25", image: avatar25 },
  { id: "avatar-26", image: avatar26 },
  { id: "avatar-27", image: avatar27 },
  { id: "avatar-28", image: avatar28 },
  { id: "avatar-29", image: avatar29 },
  { id: "avatar-30", image: avatar30 },
  { id: "avatar-31", image: avatar31 },
  { id: "avatar-32", image: avatar32 },
  { id: "avatar-33", image: avatar33 },
];

export const getCitySenseAvatar = (
  id: string | null | undefined
): CitySenseAvatar | null => {
  if (!id) {
    return null;
  }

  return (
    citySenseAvatars.find((avatar) => avatar.id === id) ?? null
  );
};