
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../services/api";
import {
    ACCESS_TOKEN_KEY,
    clearSession,
    getStoredProfile,
} from "../../services/auth";

const API_ORIGIN = "http://192.168.1.69:8000";

type OwnerProfile = {
  username: string;
  email?: string;
  phone?: string;
  role: "owner" | "seeker";
  profile_image?: string | null;
};

function getProfileImage(imagePath?: string | null): string | null {
  if (!imagePath || typeof imagePath !== "string") {
    return null;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${API_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

export default function OwnerProfileScreen() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const stored = (await getStoredProfile()) as OwnerProfile | null;

      if (!stored) {
        router.replace("/auth/login");
        return;
      }

      if (stored.role !== "owner") {
        router.replace(
          stored.role === "seeker" ? "/seeker/home" : "/auth/login"
        );
        return;
      }

      setProfile(stored);

      try {
        const response = await api.get("/users/profile/");
        const data = response.data ?? {};
        const userData = data.user ?? data;
        const nestedProfile = data.profile ?? userData.profile ?? {};

        const role =
          nestedProfile.role ?? userData.role ?? stored.role;

        if (role !== "owner") {
          router.replace(
            role === "seeker" ? "/seeker/home" : "/auth/login"
          );
          return;
        }

        setProfile({
          username:
            userData.username ??
            nestedProfile.username ??
            stored.username,
          email:
            userData.email ??
            nestedProfile.email ??
            stored.email ??
            "",
          phone:
            nestedProfile.phone ??
            userData.phone ??
            stored.phone ??
            "",
          role: "owner",
          profile_image:
            nestedProfile.profile_image ??
            userData.profile_image ??
            stored.profile_image ??
            null,
        });
      } catch (apiError: any) {
        console.log(
          "FETCH OWNER PROFILE ERROR:",
          apiError?.response?.data || apiError?.message
        );

        setErrorMessage(
          "Showing saved account information. The latest profile could not be loaded."
        );
      }
    } catch (error: any) {
      console.log(
        "OWNER PROFILE ERROR:",
        error?.response?.data || error?.message
      );

      setErrorMessage("Unable to load your account information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const handlePickProfileImage = async () => {
    if (uploadingImage) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow RoomFinder to access your photos to select a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const selectedImage = result.assets[0];

      setPreviewImageUri(selectedImage.uri);
      setUploadingImage(true);

      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const formData = new FormData();

      formData.append(
        "profile_image",
        {
          uri: selectedImage.uri,
          name: selectedImage.fileName || "profile-image.jpg",
          type: selectedImage.mimeType || "image/jpeg",
        } as any
      );

      const response = await api.patch("/users/profile/", formData, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  },
});

      const savedImage =
        response.data?.profile_image ?? selectedImage.uri;

      setProfile((previous) =>
        previous
          ? {
              ...previous,
              profile_image: savedImage,
            }
          : previous
      );

      setPreviewImageUri(null);

      Alert.alert("Success", "Your profile picture has been updated.");
    } catch (error: any) {
      console.log(
        "PROFILE IMAGE UPLOAD ERROR:",
        error?.response?.data || error?.message
      );

      setPreviewImageUri(null);

      Alert.alert(
        "Upload failed",
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.message ||
          "Could not upload the profile picture."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    try {
      await clearSession();
      router.replace("/auth/login");
    } catch (error) {
      console.log("LOGOUT ERROR:", error);

      Alert.alert(
        "Logout failed",
        "Unable to log out. Please try again."
      );
    }
  };

  const imageUrl = getProfileImage(profile?.profile_image);
  const displayedImage = previewImageUri || imageUrl;

  const initial =
    profile?.username?.trim().charAt(0).toUpperCase() || "O";

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#194B38" />
        <Text style={styles.helper}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadProfile(true)}
            tintColor="#194B38"
          />
        }
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/owner/dashboard")}
        >
          <Text style={styles.backText}>← Back to dashboard</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OWNER WORKSPACE</Text>
        <Text style={styles.heading}>My profile</Text>
        <Text style={styles.subtitle}>
          View your account information and manage your RoomFinder activity.
        </Text>

        <View style={styles.profileCard}>
          <Pressable
            style={styles.avatarContainer}
            onPress={handlePickProfileImage}
            disabled={uploadingImage}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
          >
            {displayedImage ? (
              <Image
                source={{ uri: displayedImage }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}

            {!uploadingImage && (
              <View style={styles.editImageBadge}>
                <Text style={styles.editImageBadgeText}>✎</Text>
              </View>
            )}

            {uploadingImage && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#FFFFFF" size="small" />
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={handlePickProfileImage}
            disabled={uploadingImage}
          >
            <Text style={styles.changePhotoText}>
              {uploadingImage
                ? "Uploading photo..."
                : "Tap to change profile photo"}
            </Text>
          </Pressable>

          <Text style={styles.profileName}>
            {profile?.username || "House Owner"}
          </Text>

          <Text style={styles.profileEmail}>
            {profile?.email || "Email not provided"}
          </Text>

          <View style={styles.roleBadge}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>HOUSE OWNER</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account information</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Text style={styles.detailIcon}>@</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>
                {profile?.username || "Not available"}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Text style={styles.detailIcon}>✉</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email address</Text>
              <Text style={styles.detailValue}>
                {profile?.email || "Not provided"}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Text style={styles.detailIcon}>☎</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone number</Text>
              <Text style={styles.detailValue}>
                {profile?.phone || "Not provided"}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Text style={styles.detailIcon}>✓</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Account type</Text>
              <Text style={styles.detailValue}>House Owner</Text>
            </View>
          </View>
        </View>

        {!!errorMessage && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>✓</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>
              Build trust with room seekers
            </Text>
            <Text style={styles.tipText}>
              Keep your contact information accurate so people interested
              in your rooms can communicate with you more easily.
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/owner/manage-listings")}
        >
          <Text style={styles.primaryButtonText}>Manage my listings</Text>
          <Text style={styles.buttonArrow}>→</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>

        <Text style={styles.footer}>
          ROOMFINDER · YOUR PROPERTY, MADE SIMPLE
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F1",
  },
  centered: {
    flex: 1,
    backgroundColor: "#F6F7F1",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginBottom: 20,
  },
  backText: {
    color: "#194B38",
    fontSize: 13,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#66816C",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: {
    color: "#202B24",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 7,
  },
  subtitle: {
    color: "#69746B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 22,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#E6EAE2",
    alignItems: "center",
    padding: 24,
    marginBottom: 28,
  },
  avatarContainer: {
    width: 98,
    height: 98,
    borderRadius: 49,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4EDDF",
  },
  avatar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E4EDDF",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 49,
    backgroundColor: "#194B38",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
  },
  editImageBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#194B38",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  editImageBadgeText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 49,
  },
  changePhotoText: {
    color: "#286547",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 14,
  },
  profileName: {
    color: "#202B24",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  profileEmail: {
    color: "#788276",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4EDDF",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginTop: 15,
  },
  roleDot: {
    backgroundColor: "#50825B",
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  roleText: {
    color: "#286547",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  sectionTitle: {
    color: "#202B24",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 13,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAE2",
    borderRadius: 19,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  detailIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#E8EFE2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  detailIcon: {
    color: "#286547",
    fontSize: 19,
    fontWeight: "700",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: "#7B847A",
    fontSize: 11,
    marginBottom: 5,
  },
  detailValue: {
    color: "#294C35",
    fontSize: 14,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "#EDF0E9",
  },
  noticeCard: {
    backgroundColor: "#FFF5DF",
    borderRadius: 13,
    padding: 13,
    marginTop: 15,
  },
  noticeText: {
    color: "#725824",
    fontSize: 12,
    lineHeight: 18,
  },
  tipCard: {
    backgroundColor: "#E8EFE2",
    borderRadius: 17,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
  },
  tipIcon: {
    color: "#286547",
    fontSize: 20,
    fontWeight: "800",
    marginRight: 11,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: "#294C35",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  tipText: {
    color: "#687B68",
    fontSize: 11,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: "#194B38",
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 23,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  buttonArrow: {
    color: "#FFFFFF",
    fontSize: 21,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E8DF",
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  logoutButtonText: {
    color: "#A43A32",
    fontSize: 13,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  helper: {
    color: "#788276",
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  footer: {
    color: "#99A095",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 26,
  },
});