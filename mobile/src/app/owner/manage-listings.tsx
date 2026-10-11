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
import { getStoredProfile } from "../../services/auth";

const API_ORIGIN = "http://192.168.1.69:8000";

type Room = {
  id: number;
  owner: string;
  title: string;
  description: string;
  rent: string | number;
  location: string;
  room_size: string;
  environment: string;
  availability: string;
  images?: (
    | string
    | { id?: number; image?: string }
  )[];
};

function getRoomImage(room: Room): string | null {
  const firstImage = room.images?.[0];

  const imagePath =
    typeof firstImage === "string"
      ? firstImage
      : firstImage?.image;

  if (!imagePath) return null;

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${API_ORIGIN}${
    imagePath.startsWith("/") ? "" : "/"
  }${imagePath}`;
}

export default function ManageListings() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadListings = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const profile = await getStoredProfile();

        if (!profile || profile.role !== "owner") {
          router.replace("/auth/login");
          return;
        }

        const response = await api.get("/rooms/");
        const data = response.data;

        const allRooms: Room[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        // Display only rooms owned by this account.
        const myRooms = allRooms.filter(
          (room) => room.owner === profile.username
        );

        setRooms(myRooms);
      } catch (error: any) {
        console.log(
          "LOAD LISTINGS ERROR:",
          error?.response?.data || error?.message
        );

        setErrorMessage(
          error?.response?.data?.detail ||
            "Unable to load your listings. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void loadListings();

      return undefined;
    }, [loadListings])
  );

  const deleteRoom = (room: Room) => {
    Alert.alert(
      "Delete listing",
      `Are you sure you want to delete "${room.title}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/rooms/${room.id}/`);

              setRooms((current) =>
                current.filter(
                  (item) => item.id !== room.id
                )
              );

              Alert.alert(
                "Success",
                "Your room listing has been deleted."
              );
            } catch (error: any) {
              console.log(
                "DELETE LISTING ERROR:",
                error?.response?.data || error?.message
              );

              Alert.alert(
                "Delete failed",
                error?.response?.data?.detail ||
                  "Unable to delete this listing."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator
          size="large"
          color="#194B38"
        />
        <Text style={styles.helper}>
          Loading your listings...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadListings(true)}
            tintColor="#194B38"
          />
        }
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back to dashboard
          </Text>
        </Pressable>

        <Text style={styles.eyebrow}>
          OWNER WORKSPACE
        </Text>

        <Text style={styles.heading}>
          My listings
        </Text>

        <Text style={styles.subtitle}>
          View and manage the rooms you have listed on RoomFinder.
        </Text>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryNumber}>
              {rooms.length}
            </Text>
            <Text style={styles.summaryLabel}>
              Your listings
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/owner/add-room")}
          >
            <Text style={styles.addButtonText}>
              + Add room
            </Text>
          </Pressable>
        </View>

        {errorMessage ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Could not load listings
            </Text>

            <Text style={styles.helper}>
              {errorMessage}
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => void loadListings()}
            >
              <Text style={styles.primaryButtonText}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⌂</Text>

            <Text style={styles.emptyTitle}>
              No listings yet
            </Text>

            <Text style={styles.helper}>
              Add your first room to help people find a place to live.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/owner/add-room")}
            >
              <Text style={styles.primaryButtonText}>
                Create a listing
              </Text>
            </Pressable>
          </View>
        ) : (
          rooms.map((room) => {
            const imageUrl = getRoomImage(room);

            return (
              <View
                key={room.id}
                style={styles.roomCard}
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.roomImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderIcon}>
                      ⌂
                    </Text>
                    <Text style={styles.placeholderText}>
                      No photo available
                    </Text>
                  </View>
                )}

                <View style={styles.roomDetails}>
                  <View style={styles.roomTopRow}>
                    <Text
                      style={styles.roomTitle}
                      numberOfLines={2}
                    >
                      {room.title}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        room.availability === "available"
                          ? styles.availableBadge
                          : styles.rentedBadge,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {room.availability === "available"
                          ? "Available"
                          : "Rented"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.location}>
                    Location: {room.location}
                  </Text>

                  <Text style={styles.rent}>
                    Rs. {Number(room.rent).toLocaleString()}
                    <Text style={styles.perMonth}>
                      {" "}/ month
                    </Text>
                  </Text>

                  <Text style={styles.meta}>
                    Room size: {room.room_size || "Not specified"}
                  </Text>

                  <Text style={styles.meta}>
                    Environment: {room.environment || "Not specified"}
                  </Text>

                  <Text
                    style={styles.description}
                    numberOfLines={3}
                  >
                    {room.description}
                  </Text>

                  <View style={styles.actions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() =>
                        router.push({
                          pathname: "/owner/edit-room",
                          params: {
                            id: String(room.id),
                          },
                        })
                      }
                    >
                      <Text style={styles.editButtonText}>
                        Edit details
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => deleteRoom(room)}
                    >
                      <Text style={styles.deleteButtonText}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}

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
  },
  content: {
    paddingHorizontal: 20,
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
    fontWeight: "700",
    fontSize: 13,
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
  },
  summary: {
    backgroundColor: "#E7EEE1",
    borderRadius: 18,
    padding: 18,
    marginTop: 22,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryNumber: {
    color: "#194B38",
    fontSize: 28,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#607460",
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#194B38",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  roomCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6EAE2",
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 17,
  },
  roomImage: {
    width: "100%",
    height: 190,
    backgroundColor: "#E9EDE5",
  },
  imagePlaceholder: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EDE5",
  },
  placeholderIcon: {
    color: "#66816C",
    fontSize: 40,
  },
  placeholderText: {
    color: "#768273",
    fontSize: 12,
    marginTop: 5,
  },
  roomDetails: {
    padding: 16,
  },
  roomTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  roomTitle: {
    color: "#202B24",
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  availableBadge: {
    backgroundColor: "#E3F1E4",
  },
  rentedBadge: {
    backgroundColor: "#F1E9DA",
  },
  statusText: {
    color: "#315C3C",
    fontSize: 10,
    fontWeight: "800",
  },
  location: {
    color: "#69746B",
    fontSize: 12,
    marginTop: 8,
  },
  rent: {
    color: "#194B38",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 12,
  },
  perMonth: {
    color: "#788276",
    fontSize: 11,
    fontWeight: "400",
  },
  meta: {
    color: "#68766A",
    fontSize: 12,
    marginTop: 8,
  },
  description: {
    color: "#788276",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 17,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#194B38",
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  deleteButton: {
    backgroundColor: "#FBEAEA",
    borderRadius: 11,
    paddingHorizontal: 17,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAE2",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  emptyIcon: {
    color: "#66816C",
    fontSize: 40,
  },
  emptyTitle: {
    color: "#202B24",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 7,
    textAlign: "center",
  },
  helper: {
    color: "#788276",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#194B38",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  footer: {
    color: "#99A095",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 15,
  },
});