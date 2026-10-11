import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACCESS_TOKEN_KEY = "roomfinder_access_token";
export const REFRESH_TOKEN_KEY = "roomfinder_refresh_token";
export const PROFILE_KEY = "roomfinder_user_profile";

export type UserRole = "seeker" | "owner";

export type UserProfile = {
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  profile_image?: string | null;
};

export async function saveSession(
  accessToken: string,
  refreshToken: string | undefined,
  profile: UserProfile
): Promise<void> {
  const values: [string, string][] = [
    [ACCESS_TOKEN_KEY, accessToken],
    [PROFILE_KEY, JSON.stringify(profile)],
  ];

  if (refreshToken) {
    values.push([REFRESH_TOKEN_KEY, refreshToken]);
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  await AsyncStorage.multiSet(values);
}

export async function getStoredProfile(): Promise<UserProfile | null> {
  try {
    const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);

    if (!storedProfile) {
      return null;
    }

    const profile = JSON.parse(storedProfile);

    if (
      !profile?.username ||
      (profile.role !== "seeker" && profile.role !== "owner")
    ) {
      return null;
    }

    return profile as UserProfile;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    PROFILE_KEY,
  ]);
}