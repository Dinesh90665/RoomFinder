import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  clearSession,
  getStoredProfile,
} from "../../services/auth";

export default function OwnerDashboard() {
  const [username, setUsername] = useState("there");
  const [loading, setLoading] = useState(true);

  // Check the logged-in user's profile.
  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const profile = await getStoredProfile();

        if (!active) return;

        if (!profile) {
          router.replace("/auth/login");
          return;
        }

        // Only house owners can access this dashboard.
        if (profile.role !== "owner") {
          router.replace(
            profile.role === "seeker"
              ? "/seeker/home"
              : "/auth/login"
          );
          return;
        }

        setUsername(profile.username || "there");
      } catch (error) {
        console.log("OWNER PROFILE ERROR:", error);

        if (active) {
          router.replace("/auth/login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Log out and clear the saved session.
  const handleLogout = async () => {
    try {
      await clearSession();
      router.replace("/auth/login");
    } catch (error) {
      console.log("LOGOUT ERROR:", error);

      Alert.alert(
        "Logout Failed",
        "Unable to log out. Please try again."
      );
    }
  };

  // Navigate to the Add Room screen.
  const handleAddRoom = () => {
    router.push("/owner/add-room");
  };

  // Navigate to the Manage Listings screen.
  const handleManageListings = () => {
    router.push("/owner/manage-listings");
  };

  const handleOwnerProfile = () => {
  router.push("/owner/profile");
};

  // Show loading screen while checking the profile.
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#194B38" />

        <Text style={styles.loadingText}>
          Loading your dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Text style={styles.logo}>⌂</Text>
            </View>

            <View>
              <Text style={styles.brandName}>
                RoomFinder
              </Text>

              <Text style={styles.brandTagline}>
                OWNER WORKSPACE
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Log out
            </Text>
          </Pressable>
        </View>

        {/* Account Role */}
        <View style={styles.roleBadge}>
          <View style={styles.roleDot} />

          <Text style={styles.roleBadgeText}>
            HOUSE OWNER
          </Text>
        </View>

        {/* Welcome Section */}
        <Text style={styles.greeting}>
          Welcome back, {username}!
        </Text>

        <Text style={styles.title}>
          Your property,{"\n"}made simple.
        </Text>

        <Text style={styles.subtitle}>
          List your rooms, share property details, and help
          people discover their next home.
        </Text>

        {/* Main Add Room Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Text style={styles.heroIcon}>⌂</Text>
          </View>

          <Text style={styles.heroTitle}>
            Ready to rent out a room?
          </Text>

          <Text style={styles.heroText}>
            Add your property details, set the monthly rent,
            and upload photos to showcase your room.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.addRoomButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleAddRoom}
          >
            <Text style={styles.addRoomButtonText}>
              + Add a room listing
            </Text>

            <Text style={styles.addRoomArrow}>
              →
            </Text>
          </Pressable>
        </View>

        {/* Workspace Heading */}
        <Text style={styles.sectionTitle}>
          Your workspace
        </Text>

        <Text style={styles.sectionSubtitle}>
          Manage your property information with RoomFinder.
        </Text>

        {/* Add New Room */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.cardPressed,
          ]}
          onPress={handleAddRoom}
        >
          <View style={styles.actionIconBox}>
            <Text style={styles.actionIcon}>
              ＋
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Add a new room
            </Text>

            <Text style={styles.actionDescription}>
              Enter rent, location, room size, and photos.
            </Text>
          </View>

          <Text style={styles.actionArrow}>
            ›
          </Text>
        </Pressable>

        {/* Manage My Listings */}
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.cardPressed,
          ]}
          onPress={handleManageListings}
        >
          <View style={styles.secondaryIconBox}>
            <Text style={styles.secondaryIcon}>
              ▤
            </Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
              Manage my listings
            </Text>

            <Text style={styles.actionDescription}>
              View, edit, and delete your room listings.
            </Text>
          </View>

          <Text style={styles.actionArrow}>
            ›
          </Text>
        </Pressable>
        {/* My Profile */}
<Pressable
  style={({ pressed }) => [
    styles.actionCard,
    pressed && styles.cardPressed,
  ]}
  onPress={handleOwnerProfile}
>
  <View style={styles.secondaryIconBox}>
    <Text style={styles.secondaryIcon}>●</Text>
  </View>

  <View style={styles.actionContent}>
    <Text style={styles.actionTitle}>
      My profile
    </Text>

    <Text style={styles.actionDescription}>
      View your account and contact information.
    </Text>
  </View>

  <Text style={styles.actionArrow}>›</Text>
</Pressable>

        {/* Helpful Note */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>
            ✓
          </Text>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Make your listing stand out
            </Text>

            <Text style={styles.infoText}>
              Use clear photos, accurate rent, and detailed
              descriptions to help room seekers understand
              what your property offers.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          FIND YOUR SPACE. HELP SOMEONE FIND THEIRS.
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

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F6F7F1",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#69746B",
    marginTop: 12,
    fontSize: 13,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 35,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    height: 43,
    width: 43,
    borderRadius: 14,
    backgroundColor: "#194B38",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "bold",
    marginTop: -3,
  },

  brandName: {
    fontSize: 20,
    color: "#194B38",
    fontWeight: "800",
  },

  brandTagline: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#899486",
    marginTop: 3,
  },

  logoutButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8DF",
  },

  logoutText: {
    color: "#194B38",
    fontWeight: "700",
    fontSize: 12,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  // Role Badge
  roleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E4EDDF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 17,
  },

  roleDot: {
    height: 7,
    width: 7,
    borderRadius: 4,
    backgroundColor: "#50825B",
    marginRight: 8,
  },

  roleBadgeText: {
    color: "#286547",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Welcome
  greeting: {
    fontSize: 15,
    color: "#6A756B",
    marginBottom: 9,
  },

  title: {
    fontSize: 37,
    lineHeight: 44,
    letterSpacing: -1,
    fontWeight: "800",
    color: "#202B24",
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#69746B",
    marginTop: 12,
    marginBottom: 25,
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#194B38",
    borderRadius: 24,
    padding: 21,
    marginBottom: 28,
  },

  heroIconBox: {
    height: 53,
    width: 53,
    backgroundColor: "#2D6049",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  heroIcon: {
    fontSize: 36,
    color: "#E1EDD7",
    fontWeight: "bold",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    marginBottom: 9,
  },

  heroText: {
    fontSize: 13,
    color: "#DCEBDD",
    lineHeight: 21,
    marginBottom: 21,
  },

  addRoomButton: {
    minHeight: 54,
    backgroundColor: "#E4ECD9",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 18,
  },

  addRoomButtonText: {
    color: "#194B38",
    fontSize: 14,
    fontWeight: "800",
  },

  addRoomArrow: {
    position: "absolute",
    right: 17,
    fontSize: 23,
    color: "#194B38",
  },

  // Workspace
  sectionTitle: {
    fontSize: 20,
    color: "#202B24",
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 19,
    color: "#7B847A",
    marginTop: 5,
    marginBottom: 15,
  },

  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8EBE3",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  cardPressed: {
    opacity: 0.8,
  },

  actionIconBox: {
    height: 46,
    width: 46,
    borderRadius: 14,
    backgroundColor: "#E4EDDF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  actionIcon: {
    color: "#286547",
    fontSize: 30,
    fontWeight: "600",
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    color: "#294C35",
    fontWeight: "800",
    fontSize: 13,
  },

  actionDescription: {
    color: "#798477",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  actionArrow: {
    fontSize: 27,
    color: "#286547",
    marginLeft: 8,
  },

  secondaryIconBox: {
    height: 46,
    width: 46,
    borderRadius: 14,
    backgroundColor: "#F0F2EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  secondaryIcon: {
    color: "#72816F",
    fontSize: 27,
  },

  // Helpful Note
  infoCard: {
    backgroundColor: "#E8EFE2",
    borderRadius: 17,
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
  },

  infoIcon: {
    color: "#286547",
    fontSize: 20,
    fontWeight: "800",
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: "#294C35",
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 6,
  },

  infoText: {
    color: "#687B68",
    fontSize: 11,
    lineHeight: 18,
  },

  // Footer
  footerText: {
    color: "#99A095",
    textAlign: "center",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginTop: 28,
  },
});