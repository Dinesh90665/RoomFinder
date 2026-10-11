import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../services/api";
import {
  clearSession,
  getStoredProfile,
  type UserProfile,
} from "../../services/auth";

type TabName = "Home" | "Rent" | "Saved" | "About" | "Profile";
type FilterName = "All" | "Quiet" | "Under 10k";

type RoomImageValue = string | { image?: string };

type Room = {
  id: number;
  title: string;
  description?: string;
  rent: string | number;
  location: string;
  room_size?: string;
  environment?: string;
  availability?: string;
  owner?: string;
  image?: string;
  images?: RoomImageValue[];
};

const API_ORIGIN = "http://192.168.1.69:8000";

const NAV_ITEMS: {
  key: TabName;
  icon: string;
  label: string;
}[] = [
  { key: "Home", icon: "⌂", label: "Home" },
  { key: "Rent", icon: "⌕", label: "Rent" },
  { key: "Saved", icon: "♡", label: "Saved" },
  { key: "About", icon: "i", label: "About" },
  { key: "Profile", icon: "●", label: "Profile" },
];

function getRoomImage(room: Room): string | undefined {
  const firstImage = room.images?.[0];

  const path =
    typeof firstImage === "string"
      ? firstImage
      : firstImage?.image || room.image;

  if (!path) return undefined;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function formatRent(rent: string | number): string {
  const amount = Number(rent);

  if (Number.isNaN(amount)) return `NPR ${rent}`;

  return `NPR ${amount.toLocaleString("en-IN")}`;
}

function RoomCard({
  room,
  saved,
  onToggleSaved,
}: {
  room: Room;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const imageUrl = getRoomImage(room);

  const showDetails = () => {
    Alert.alert(
      room.title,
      [
        `Rent: ${formatRent(room.rent)}`,
        `Location: ${room.location}`,
        `Room size: ${room.room_size || "Not provided"}`,
        `Environment: ${room.environment || "Not specified"}`,
        "",
        room.description || "No additional description provided.",
      ].join("\n")
    );
  };

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.roomImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.roomImagePlaceholder}>
            <Text style={styles.roomPlaceholderIcon}>⌂</Text>
            <Text style={styles.placeholderText}>RoomFinder</Text>
          </View>
        )}

        <View style={styles.availableBadge}>
          <View style={styles.availableDot} />
          <Text style={styles.availableText}>Available</Text>
        </View>

        <Pressable
          style={styles.favoriteButton}
          onPress={onToggleSaved}
          accessibilityLabel={
            saved ? "Remove from saved rooms" : "Save room"
          }
        >
          <Text
            style={[
              styles.favoriteIcon,
              saved && styles.favoriteIconActive,
            ]}
          >
            {saved ? "♥" : "♡"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.roomContent}>
        <Text style={styles.roomTitle} numberOfLines={1}>
          {room.title}
        </Text>

        <View style={styles.roomLocationRow}>
          <Text style={styles.locationIcon}>⌖</Text>
          <Text style={styles.roomLocation} numberOfLines={1}>
            {room.location}
          </Text>
        </View>

        <View style={styles.roomDetailsRow}>
          <Text style={styles.roomDetail}>
            {room.room_size || "Size not listed"}
          </Text>

          <Text style={styles.roomDetailDot}>•</Text>

          <Text style={styles.roomDetail}>
            {room.environment || "Normal"}
          </Text>
        </View>

        <View style={styles.roomCardFooter}>
          <View>
            <Text style={styles.priceCaption}>MONTHLY RENT</Text>
            <Text style={styles.roomPrice}>
              {formatRent(room.rent)}
            </Text>
          </View>

          <Pressable
            style={styles.detailsButton}
            onPress={showDetails}
          >
            <Text style={styles.detailsButtonText}>Details ↗</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function SeekerHomeScreen() {
  const [tab, setTab] = useState<TabName>("Home");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterName>("All");
  const [savedIds, setSavedIds] = useState<number[]>([]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    setRoomError("");

    try {
      const response = await api.get("/rooms/");
      const data = response.data;
      console.log(
  "ROOM DATA:",
  JSON.stringify(data, null, 2)
);


      const list: Room[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

setRooms(list);
    } catch (error: any) {
      console.log(
        "ROOMS API ERROR:",
        error?.response?.data || error?.message
      );

      setRoomError(
        "We couldn't load rooms right now. Check your connection and try again."
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const storedProfile = await getStoredProfile();

      if (!active) return;

      if (!storedProfile) {
        router.replace("/auth/login");
        return;
      }

      if (storedProfile.role !== "seeker") {
        router.replace(
          storedProfile.role === "owner"
            ? "/owner/dashboard"
            : "/auth/login"
        );
        return;
      }

      setProfile(storedProfile);

      try {
        const response = await api.get("/rooms/");

        if (!active) return;

        const data = response.data;

        const list: Room[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        setRooms(list);
      } catch (error: any) {
        console.log(
          "ROOMS API ERROR:",
          error?.response?.data || error?.message
        );

        if (active) {
          setRoomError(
            "We couldn't load rooms right now. Check your connection and try again."
          );
        }
      } finally {
        if (active) setLoadingRooms(false);
      }
    };

    initialize().catch(() => {
      if (active) router.replace("/auth/login");
    });

    return () => {
      active = false;
    };
  }, []);

  const toggleSaved = (id: number) => {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id]
    );
  };

  const handleLogout = async () => {
    try {
      await clearSession();
      router.replace("/auth/login");
    } catch {
      Alert.alert("Error", "Unable to log out. Please try again.");
    }
  };

  const availableRooms = rooms.filter(
    (room) => !room.availability || room.availability === "available"
  );

  const filteredRooms = availableRooms.filter((room) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      `${room.title} ${room.location} ${room.description || ""}`
        .toLowerCase()
        .includes(searchText);

    const matchesFilter =
      filter === "All" ||
      (filter === "Quiet" &&
        room.environment?.toLowerCase() === "quiet") ||
      (filter === "Under 10k" && Number(room.rent) <= 10000);

    return matchesSearch && matchesFilter;
  });

  const savedRooms = filteredRooms.filter((room) =>
    savedIds.includes(room.id)
  );

  const displayedRooms =
    tab === "Saved"
      ? availableRooms.filter((room) => savedIds.includes(room.id))
      : filteredRooms;

  const openRent = () => {
    setTab("Rent");
  };

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <Text style={styles.searchIcon}>⌕</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        onFocus={() => setTab("Rent")}
        placeholder="Search location or room..."
        placeholderTextColor="#8B958A"
        style={styles.searchInput}
        returnKeyType="search"
        accessibilityLabel="Search available rooms"
      />

      <Pressable
        style={styles.searchButton}
        onPress={openRent}
        accessibilityLabel="Search rooms"
      >
        <Text style={styles.searchButtonText}>→</Text>
      </Pressable>
    </View>
  );

  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {(["All", "Quiet", "Under 10k"] as FilterName[]).map(
        (item) => (
          <Pressable
            key={item}
            style={[
              styles.filterChip,
              filter === item && styles.filterChipActive,
            ]}
            onPress={() => setFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item === "Under 10k" ? "Under NPR 10k" : item === "All" ? "All rooms" : item}
            </Text>
          </Pressable>
        )
      )}
    </ScrollView>
  );

  const renderListings = (items: Room[]) => {
    if (loadingRooms) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#286547" />
          <Text style={styles.loadingText}>Finding available rooms...</Text>
        </View>
      );
    }

    if (roomError) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>⌁</Text>
          <Text style={styles.emptyTitle}>Couldn't load rooms</Text>
          <Text style={styles.emptyText}>{roomError}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadRooms}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            {tab === "Saved" ? "♡" : "⌂"}
          </Text>

          <Text style={styles.emptyTitle}>
            {tab === "Saved"
              ? "No saved rooms yet"
              : "No matching rooms found"}
          </Text>

          <Text style={styles.emptyText}>
            {tab === "Saved"
              ? "Tap the heart on a room to save it for later."
              : "Try another search or check again later."}
          </Text>

          {tab !== "Saved" && (
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setSearch("");
                setFilter("All");
              }}
            >
              <Text style={styles.retryButtonText}>
                Clear filters
              </Text>
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <View style={styles.listingsContainer}>
        {items.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            saved={savedIds.includes(room.id)}
            onToggleSaved={() => toggleSaved(room.id)}
          />
        ))}
      </View>
    );
  };

  const renderHome = () => (
    <>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>ROOMFINDER NEPAL</Text>
          </View>
          <Text style={styles.heroSparkle}>✦</Text>
        </View>

        <Text style={styles.heroTitle}>
          Find a place{"\n"}to call home.
        </Text>

        <Text style={styles.heroSubtitle}>
          Good spaces. Clear prices. A better way to find your next home.
        </Text>

        <Pressable
          style={styles.heroButton}
          onPress={openRent}
        >
          <Text style={styles.heroButtonText}>
            Explore available rooms
          </Text>
          <Text style={styles.heroButtonArrow}>→</Text>
        </Pressable>

        <View style={styles.heroDecoration}>
          <Text style={styles.heroHouse}>⌂</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Where would you like to live?</Text>
        <Text style={styles.sectionSubtitle}>
          Start with a location, neighbourhood, or room name.
        </Text>
        {renderSearch()}
        {renderFilters()}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeadingBlock}>
          <Text style={styles.sectionTitle}>Rent available</Text>
          <Text style={styles.sectionSubtitle}>
            {availableRooms.length} listing
            {availableRooms.length === 1 ? "" : "s"} currently available
          </Text>
        </View>

        <Pressable onPress={openRent}>
          <Text style={styles.seeAll}>See all →</Text>
        </Pressable>
      </View>

      {renderListings(availableRooms.slice(0, 2))}

      <Pressable
        style={styles.aboutBanner}
        onPress={() => setTab("About")}
      >
        <View style={styles.aboutBannerIcon}>
          <Text style={styles.aboutBannerIconText}>i</Text>
        </View>
        <View style={styles.aboutBannerContent}>
          <Text style={styles.aboutBannerTitle}>
            A better way to find a room
          </Text>
          <Text style={styles.aboutBannerText}>
            Learn how RoomFinder helps seekers and owners connect.
          </Text>
        </View>
        <Text style={styles.aboutBannerArrow}>→</Text>
      </Pressable>
    </>
  );

  const renderRent = () => (
    <>
      <Text style={styles.pageEyebrow}>EXPLORE LISTINGS</Text>
      <Text style={styles.pageTitle}>Rent available</Text>
      <Text style={styles.pageSubtitle}>
        Find a room that fits your location and budget.
      </Text>

      {renderSearch()}
      {renderFilters()}

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Available rooms</Text>
        <Text style={styles.resultsCount}>{displayedRooms.length} found</Text>
      </View>

      {renderListings(displayedRooms)}
    </>
  );

  const renderSaved = () => (
    <>
      <Text style={styles.pageEyebrow}>YOUR COLLECTION</Text>
      <Text style={styles.pageTitle}>Saved rooms</Text>
      <Text style={styles.pageSubtitle}>
        Keep the rooms you like together in one place.
      </Text>

      {renderListings(savedRooms)}
    </>
  );

  const renderAbout = () => (
    <>
      <Text style={styles.pageEyebrow}>OUR PURPOSE</Text>
      <Text style={styles.pageTitle}>About RoomFinder</Text>
      <Text style={styles.pageSubtitle}>
        Helping people find spaces where they can feel at home.
      </Text>

      <View style={styles.aboutHero}>
        <Text style={styles.aboutHeroIcon}>⌂</Text>
        <Text style={styles.aboutHeroTitle}>
          Finding a room should feel easier.
        </Text>
        <Text style={styles.aboutHeroText}>
          RoomFinder brings room seekers and property owners together
          with clear listings, rent details, and helpful property
          information.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>What you can do</Text>

      {[
        {
          icon: "⌕",
          title: "Explore available rooms",
          text: "Search listings and compare rent and location.",
        },
        {
          icon: "♡",
          title: "Save your favourites",
          text: "Keep track of rooms you'd like to revisit.",
        },
        {
          icon: "⌂",
          title: "Support better connections",
          text: "Help seekers and owners discover suitable matches.",
        },
      ].map((item) => (
        <View key={item.title} style={styles.aboutFeature}>
          <View style={styles.aboutFeatureIcon}>
            <Text style={styles.aboutFeatureIconText}>{item.icon}</Text>
          </View>
          <View style={styles.aboutFeatureContent}>
            <Text style={styles.aboutFeatureTitle}>{item.title}</Text>
            <Text style={styles.aboutFeatureText}>{item.text}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderProfile = () => (
    <>
      <Text style={styles.pageEyebrow}>YOUR ACCOUNT</Text>
      <Text style={styles.pageTitle}>My profile</Text>
      <Text style={styles.pageSubtitle}>
        Your RoomFinder account information.
      </Text>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {profile?.username?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>

        <Text style={styles.profileName}>
          {profile?.username || "RoomFinder user"}
        </Text>

        <View style={styles.profileRoleBadge}>
          <Text style={styles.profileRoleText}>ROOM SEEKER</Text>
        </View>

        <View style={styles.profileDivider} />

        <Text style={styles.profileLabel}>USERNAME</Text>
        <Text style={styles.profileValue}>{profile?.username || "—"}</Text>

        <Text style={styles.profileLabel}>EMAIL ADDRESS</Text>
        <Text style={styles.profileValue}>{profile?.email || "Not provided"}</Text>

        <Text style={styles.profileLabel}>PHONE NUMBER</Text>
        <Text style={styles.profileValue}>{profile?.phone || "Not provided"}</Text>
      </View>

      <Pressable
        style={styles.logoutButtonLarge}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonLargeText}>Log out of RoomFinder</Text>
      </Pressable>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoSymbol}>⌂</Text>
          </View>
          <View>
            <Text style={styles.brandName}>RoomFinder</Text>
            <Text style={styles.brandTagline}>YOUR NEXT HOME</Text>
          </View>
        </View>

        <Pressable
          style={styles.avatarButton}
          onPress={() => setTab("Profile")}
          accessibilityLabel="Open profile"
        >
          <Text style={styles.avatarText}>
            {profile?.username?.charAt(0).toUpperCase() || "U"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "Home" && renderHome()}
        {tab === "Rent" && renderRent()}
        {tab === "Saved" && renderSaved()}
        {tab === "About" && renderAbout()}
        {tab === "Profile" && renderProfile()}
      </ScrollView>

      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const active = tab === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View
                style={[
                  styles.navIconBox,
                  active && styles.navIconBoxActive,
                ]}
              >
                <Text
                  style={[
                    styles.navIcon,
                    active && styles.navIconActive,
                  ]}
                >
                  {item.icon}
                </Text>
              </View>

              <Text
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                ]}
              >
                {item.label === "Rent" ? "Rent Available" : item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F7F1",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#F6F7F1",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#194B38",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  logoSymbol: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "800",
    marginTop: -4,
  },

  brandName: {
    color: "#194B38",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  brandTagline: {
    color: "#849080",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginTop: 3,
  },

  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#E2EBDD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D3DECD",
  },

  avatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#194B38",
  },

  mainScroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 7,
    paddingBottom: 25,
  },

  // Home hero
  heroCard: {
    backgroundColor: "#194B38",
    borderRadius: 26,
    padding: 22,
    marginBottom: 25,
    overflow: "hidden",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heroBadge: {
    backgroundColor: "#2D6049",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },

  heroBadgeText: {
    fontSize: 9,
    color: "#E2EBDD",
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  heroSparkle: {
    color: "#DCE8D3",
    fontSize: 24,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 43,
  },

  heroSubtitle: {
    color: "#DCEBDD",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 300,
  },

  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E4ECD9",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginTop: 22,
    alignSelf: "flex-start",
    minWidth: 230,
  },

  heroButtonText: {
    color: "#194B38",
    fontWeight: "800",
    fontSize: 12,
  },

  heroButtonArrow: {
    color: "#194B38",
    fontSize: 19,
    fontWeight: "700",
    marginLeft: 15,
  },

  heroDecoration: {
    position: "absolute",
    right: -14,
    bottom: 70,
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: "#3C6D50",
    justifyContent: "center",
    alignItems: "center",
  },

  heroHouse: {
    color: "#47775A",
    fontSize: 75,
    fontWeight: "800",
  },

  // Search
  searchSection: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#202B24",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: "#7B847A",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E9E0",
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    marginTop: 15,
  },

  searchIcon: {
    fontSize: 28,
    color: "#62816A",
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 50,
    color: "#26352B",
    fontSize: 13,
  },

  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#194B38",
    justifyContent: "center",
    alignItems: "center",
  },

  searchButtonText: {
    fontSize: 23,
    color: "#FFFFFF",
  },

  filterContainer: {
    paddingTop: 12,
    paddingBottom: 3,
    gap: 8,
  },

  filterChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E8DE",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },

  filterChipActive: {
    backgroundColor: "#194B38",
    borderColor: "#194B38",
  },

  filterText: {
    color: "#536254",
    fontSize: 11,
    fontWeight: "700",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionHeadingBlock: {
    flex: 1,
  },

  seeAll: {
    color: "#286547",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },

  pageEyebrow: {
    color: "#50805C",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    marginTop: 13,
    marginBottom: 9,
  },

  pageTitle: {
    color: "#202B24",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  pageSubtitle: {
    color: "#737D72",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 18,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 15,
  },

  resultsCount: {
    fontSize: 11,
    color: "#7B847A",
    fontWeight: "600",
  },

  // Room cards
  listingsContainer: {
    gap: 16,
  },

  roomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E8EBE3",
    overflow: "hidden",
    marginBottom: 15,
  },

  roomImageContainer: {
    height: 178,
    backgroundColor: "#E7EDE2",
    position: "relative",
  },

  roomImage: {
    width: "100%",
    height: "100%",
  },

  roomImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2EBDD",
  },

  roomPlaceholderIcon: {
    color: "#3D7150",
    fontSize: 67,
    fontWeight: "800",
  },

  placeholderText: {
    color: "#65816A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 5,
  },

  availableBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3C9563",
    marginRight: 6,
  },

  availableText: {
    color: "#286547",
    fontSize: 10,
    fontWeight: "800",
  },

  favoriteButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  favoriteIcon: {
    fontSize: 23,
    color: "#526255",
  },

  favoriteIconActive: {
    color: "#C14848",
  },

  roomContent: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 16,
  },

  roomTitle: {
    color: "#26352B",
    fontSize: 17,
    fontWeight: "800",
  },

  roomLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  locationIcon: {
    color: "#50805C",
    fontSize: 18,
    marginRight: 6,
  },

  roomLocation: {
    flex: 1,
    color: "#6C786B",
    fontSize: 12,
  },

  roomDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
  },

  roomDetail: {
    color: "#7B8579",
    fontSize: 11,
  },

  roomDetailDot: {
    color: "#9DA69A",
    marginHorizontal: 8,
  },

  roomCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEF0EA",
    paddingTop: 13,
    marginTop: 14,
  },

  priceCaption: {
    color: "#8A9587",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },

  roomPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#194B38",
  },

  detailsButton: {
    backgroundColor: "#E8F0E4",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  detailsButtonText: {
    color: "#286547",
    fontSize: 11,
    fontWeight: "800",
  },

  // Loading and empty states
  loadingContainer: {
    paddingVertical: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#718071",
    fontSize: 12,
    marginTop: 12,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EBE2",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 20,
  },

  emptyIcon: {
    color: "#50805C",
    fontSize: 44,
    marginBottom: 10,
  },

  emptyTitle: {
    color: "#26352B",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    color: "#7B847A",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    backgroundColor: "#194B38",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 15,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // About banner
  aboutBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EFE2",
    borderRadius: 18,
    padding: 15,
    marginTop: 24,
  },

  aboutBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#D5E3D0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  aboutBannerIconText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#286547",
  },

  aboutBannerContent: {
    flex: 1,
  },

  aboutBannerTitle: {
    color: "#294C35",
    fontSize: 12,
    fontWeight: "800",
  },

  aboutBannerText: {
    color: "#687B68",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  aboutBannerArrow: {
    color: "#286547",
    fontSize: 23,
    marginLeft: 5,
  },

  // About page
  aboutHero: {
    backgroundColor: "#194B38",
    borderRadius: 23,
    padding: 22,
    marginTop: 9,
    marginBottom: 27,
  },

  aboutHeroIcon: {
    fontSize: 48,
    color: "#E4ECD9",
    marginBottom: 14,
  },

  aboutHeroTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 30,
  },

  aboutHeroText: {
    color: "#DCEBDD",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },

  aboutFeature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E8EBE3",
    padding: 15,
    marginTop: 12,
  },

  aboutFeatureIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7EFE2",
    marginRight: 12,
  },

  aboutFeatureIconText: {
    color: "#286547",
    fontSize: 26,
    fontWeight: "700",
  },

  aboutFeatureContent: {
    flex: 1,
  },

  aboutFeatureTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#294C35",
  },

  aboutFeatureText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#758075",
    marginTop: 5,
  },

  // Profile
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E7EBE2",
    padding: 22,
    alignItems: "center",
    marginTop: 8,
  },

  profileAvatar: {
    width: 75,
    height: 75,
    borderRadius: 25,
    backgroundColor: "#194B38",
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },

  profileName: {
    color: "#26352B",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 13,
  },

  profileRoleBadge: {
    backgroundColor: "#E7EFE2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 9,
  },

  profileRoleText: {
    color: "#286547",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  profileDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#ECEFE8",
    marginVertical: 22,
  },

  profileLabel: {
    width: "100%",
    color: "#8B9588",
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "800",
    marginTop: 14,
  },

  profileValue: {
    width: "100%",
    color: "#29392D",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },

  logoutButtonLarge: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E7DD",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 19,
  },

  logoutButtonLargeText: {
    color: "#9B4141",
    fontWeight: "800",
    fontSize: 13,
  },

  // Bottom navigation
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 3,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8EBE3",
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingVertical: 3,
  },

  navIconBox: {
    width: 37,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  navIconBoxActive: {
    backgroundColor: "#E4EDDF",
  },

  navIcon: {
    color: "#859083",
    fontSize: 22,
    fontWeight: "600",
  },

  navIconActive: {
    color: "#194B38",
    fontWeight: "800",
  },

  navLabel: {
    color: "#879083",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 3,
    textAlign: "center",
  },

  navLabelActive: {
    color: "#194B38",
    fontWeight: "800",
  },
});