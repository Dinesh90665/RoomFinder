import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../services/api";
import { getStoredProfile } from "../../services/auth";

type Environment = "quiet" | "normal" | "noisy";

export default function AddRoomScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rent, setRent] = useState("");
  const [location, setLocation] = useState("");
  const [roomSize, setRoomSize] = useState("");
  const [environment, setEnvironment] =
    useState<Environment>("quiet");

  const [photos, setPhotos] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check that only an authenticated house owner can use this screen.
  useEffect(() => {
    let active = true;

    const checkOwner = async () => {
      try {
        const profile = await getStoredProfile();

        if (!active) return;

        if (!profile) {
          router.replace("/auth/login");
          return;
        }

        if (profile.role !== "owner") {
          router.replace(
            profile.role === "seeker"
              ? "/seeker/home"
              : "/auth/login"
          );
        }
      } catch (error) {
        console.log("PROFILE CHECK ERROR:", error);

        if (active) {
          router.replace("/auth/login");
        }
      } finally {
        if (active) {
          setCheckingProfile(false);
        }
      }
    };

    checkOwner();

    return () => {
      active = false;
    };
  }, []);

  // Select room photos from the phone's gallery.
  const choosePhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 8,
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotos(result.assets.slice(0, 8));
      }
    } catch (error) {
      console.log("IMAGE PICKER ERROR:", error);

      Alert.alert(
        "Unable to select photos",
        "Please try opening your gallery again."
      );
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((current) =>
      current.filter((photo) => photo.uri !== uri)
    );
  };

  // Upload one image to an already-created room.
  const uploadPhoto = async (
    roomId: number,
    photo: ImagePicker.ImagePickerAsset,
    index: number
  ) => {
    const extension =
      photo.uri.split(".").pop()?.split("?")[0] || "jpg";

    const type =
      photo.mimeType ||
      (extension.toLowerCase() === "png"
        ? "image/png"
        : "image/jpeg");

    const formData = new FormData();

    formData.append("room", String(roomId));
    formData.append(
      "image",
      {
        uri: photo.uri,
        name:
          photo.fileName ||
          `room-${roomId}-${index + 1}.${extension}`,
        type,
      } as any
    );

    await api.post("rooms/images/uploads/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  const handleSubmit = async () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanLocation = location.trim();
    const cleanRoomSize = roomSize.trim();
    const rentAmount = Number(rent);

    if (
      !cleanTitle ||
      !cleanDescription ||
      !rent.trim() ||
      !cleanLocation
    ) {
      Alert.alert(
        "Required information",
        "Please enter the title, description, monthly rent, and location."
      );
      return;
    }

    if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
      Alert.alert(
        "Invalid rent",
        "Enter a valid monthly rent greater than zero."
      );
      return;
    }

    try {
      setSaving(true);

      // 1. Create the room listing.
      const response = await api.post("/rooms/", {
        title: cleanTitle,
        description: cleanDescription,
        rent: rentAmount,
        location: cleanLocation,
        room_size: cleanRoomSize,
        environment,
        availability: "available",
      });

      const roomId = response.data?.id;

      if (!roomId) {
        Alert.alert(
          "Room created, but response incomplete",
          "The server did not return a room ID. Check your Django room-creation response before submitting again."
        );
        return;
      }

      // 2. Upload selected photos to that room.
      let failedUploads = 0;

      for (let index = 0; index < photos.length; index++) {
        try {
          await uploadPhoto(roomId, photos[index], index);
        } catch (error: any) {
          failedUploads++;

          console.log(
            "PHOTO UPLOAD ERROR:",
            error?.response?.data || error?.message
          );
        }
      }

      if (failedUploads > 0) {
        Alert.alert(
          "Room created; some photos failed",
          `Your room listing was created, but ${failedUploads} photo(s) could not be uploaded. Check your Django image-upload endpoint. Do not submit the form again, or you may create a duplicate listing.`,
          [
            {
              text: "Back to Dashboard",
              onPress: () =>
                router.replace("/owner/dashboard"),
            },
          ]
        );

        return;
      }

      Alert.alert(
        "Listing created!",
        "Your room has been added to RoomFinder.",
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace("/owner/dashboard"),
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "CREATE ROOM ERROR:",
        error?.response?.data || error?.message
      );

      const data = error?.response?.data;

      const message = data
        ? Object.entries(data)
            .map(([field, value]) => {
              const detail = Array.isArray(value)
                ? value.join(", ")
                : String(value);

              return `${field}: ${detail}`;
            })
            .join("\n")
        : "Unable to connect to Django. Check that the backend is running and try again.";

      Alert.alert("Could not create room", message);
    } finally {
      setSaving(false);
    }
  };

  if (checkingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#194B38" />
        <Text style={styles.loadingText}>
          Checking your account...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.replace("/owner/dashboard")
              }
              accessibilityLabel="Back to owner dashboard"
            >
              <Text style={styles.backArrow}>←</Text>
            </Pressable>

            <View style={styles.brand}>
              <View style={styles.logoBox}>
                <Text style={styles.logoSymbol}>⌂</Text>
              </View>

              <Text style={styles.brandName}>RoomFinder</Text>
            </View>
          </View>

          {/* Introduction */}
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>
              OWNER WORKSPACE
            </Text>
          </View>

          <Text style={styles.heading}>List your room</Text>

          <Text style={styles.subtitle}>
            Share your property details and help someone
            discover their next home.
          </Text>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Room information
            </Text>

            <Text style={styles.sectionSubtitle}>
              Fields marked with * are required.
            </Text>

            <Text style={styles.label}>ROOM TITLE *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sunny room near college"
              placeholderTextColor="#929B90"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              editable={!saving}
              returnKeyType="next"
            />

            <Text style={styles.label}>DESCRIPTION *</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Describe facilities, rules, surroundings, and nearby places..."
              placeholderTextColor="#929B90"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              editable={!saving}
            />

            <Text style={styles.label}>MONTHLY RENT (NPR) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8000"
              placeholderTextColor="#929B90"
              value={rent}
              onChangeText={(value) =>
                setRent(value.replace(/[^0-9.]/g, ""))
              }
              keyboardType="decimal-pad"
              editable={!saving}
            />

            <Text style={styles.label}>LOCATION *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lakeside, Pokhara"
              placeholderTextColor="#929B90"
              value={location}
              onChangeText={setLocation}
              editable={!saving}
              returnKeyType="next"
            />

            <Text style={styles.label}>ROOM SIZE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12 x 10 ft"
              placeholderTextColor="#929B90"
              value={roomSize}
              onChangeText={setRoomSize}
              editable={!saving}
            />

            {/* Environment selector */}
            <Text style={styles.label}>ENVIRONMENT</Text>

            <View style={styles.environmentRow}>
              {(["quiet", "normal", "noisy"] as Environment[]).map(
                (option) => {
                  const selected = environment === option;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.environmentButton,
                        selected && styles.environmentButtonActive,
                      ]}
                      onPress={() => setEnvironment(option)}
                      disabled={saving}
                    >
                      <Text
                        style={[
                          styles.environmentText,
                          selected && styles.environmentTextActive,
                        ]}
                      >
                        {option.charAt(0).toUpperCase() +
                          option.slice(1)}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            {/* Photo picker */}
            <View style={styles.photoHeading}>
              <View style={styles.flex}>
                <Text style={styles.sectionTitle}>
                  Room photos
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Choose up to 8 pictures of your room.
                </Text>
              </View>

              <Text style={styles.photoCount}>
                {photos.length}/8
              </Text>
            </View>

            <Pressable
              style={styles.photoPicker}
              onPress={choosePhotos}
              disabled={saving}
            >
              <View style={styles.photoPickerIcon}>
                <Text style={styles.photoPlus}>＋</Text>
              </View>

              <Text style={styles.photoPickerTitle}>
                Choose photos
              </Text>

              <Text style={styles.photoPickerSubtitle}>
                Select images from your phone gallery
              </Text>
            </Pressable>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <View key={photo.uri} style={styles.photoItem}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoPreview}
                      resizeMode="cover"
                    />

                    <Pressable
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(photo.uri)}
                      disabled={saving}
                      accessibilityLabel="Remove photo"
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Availability information */}
            <View style={styles.availabilityNote}>
              <Text style={styles.checkmark}>✓</Text>

              <View style={styles.flex}>
                <Text style={styles.availabilityTitle}>
                  Available for rent
                </Text>

                <Text style={styles.availabilityText}>
                  This listing will be created with available status.
                </Text>
              </View>
            </View>

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !saving && styles.buttonPressed,
                saving && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    Publish room listing
                  </Text>

                  <Text style={styles.submitArrow}>→</Text>
                </>
              )}
            </Pressable>

            <Text style={styles.footerNote}>
              Please ensure that the rent, location, and property
              details are accurate before publishing.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F7F1",
  },

  flex: {
    flex: 1,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7F1",
  },

  loadingText: {
    color: "#69746B",
    marginTop: 12,
    fontSize: 13,
  },

  container: {
    paddingHorizontal: 21,
    paddingTop: 12,
    paddingBottom: 35,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8DF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backArrow: {
    color: "#194B38",
    fontSize: 25,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#194B38",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  logoSymbol: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: -3,
  },

  brandName: {
    color: "#194B38",
    fontSize: 20,
    fontWeight: "800",
  },

  // Introduction
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E4EDDF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 14,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#50825B",
    marginRight: 8,
  },

  eyebrowText: {
    color: "#41634A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  heading: {
    color: "#202B24",
    fontSize: 33,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  subtitle: {
    color: "#69746B",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
    marginBottom: 22,
  },

  // Form
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    padding: 19,
    borderWidth: 1,
    borderColor: "#E8EBE3",
  },

  sectionTitle: {
    color: "#202B24",
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#858E83",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  label: {
    color: "#526255",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    marginTop: 22,
    marginBottom: 9,
  },

  input: {
    minHeight: 51,
    borderWidth: 1,
    borderColor: "#E2E6DD",
    backgroundColor: "#FAFBF8",
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#26352B",
  },

  descriptionInput: {
    minHeight: 110,
    paddingTop: 14,
    paddingBottom: 12,
  },

  // Environment
  environmentRow: {
    flexDirection: "row",
    gap: 8,
  },

  environmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E6DD",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  environmentButtonActive: {
    backgroundColor: "#194B38",
    borderColor: "#194B38",
  },

  environmentText: {
    color: "#596657",
    fontSize: 11,
    fontWeight: "700",
  },

  environmentTextActive: {
    color: "#FFFFFF",
  },

  // Photos
  photoHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 29,
    marginBottom: 14,
  },

  photoCount: {
    color: "#286547",
    fontSize: 12,
    fontWeight: "800",
  },

  photoPicker: {
    borderWidth: 1.5,
    borderColor: "#CAD9C5",
    borderStyle: "dashed",
    borderRadius: 17,
    backgroundColor: "#F5F8F2",
    alignItems: "center",
    paddingVertical: 21,
    paddingHorizontal: 10,
  },

  photoPickerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#E1EBDD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  photoPlus: {
    color: "#286547",
    fontSize: 28,
    fontWeight: "600",
  },

  photoPickerTitle: {
    color: "#294C35",
    fontSize: 13,
    fontWeight: "800",
  },

  photoPickerSubtitle: {
    color: "#7C887B",
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 14,
  },

  photoItem: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E4EBDD",
    position: "relative",
  },

  photoPreview: {
    width: "100%",
    height: "100%",
  },

  removePhotoButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  removePhotoText: {
    color: "#9B4141",
    fontSize: 21,
    lineHeight: 23,
    fontWeight: "700",
  },

  // Availability
  availabilityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F5EC",
    borderRadius: 14,
    padding: 13,
    marginTop: 23,
    marginBottom: 23,
  },

  checkmark: {
    color: "#286547",
    fontSize: 17,
    fontWeight: "800",
    marginRight: 10,
  },

  availabilityTitle: {
    color: "#294C35",
    fontSize: 12,
    fontWeight: "800",
  },

  availabilityText: {
    color: "#718071",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  // Submit button
  submitButton: {
    minHeight: 56,
    borderRadius: 15,
    backgroundColor: "#194B38",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 15,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  submitDisabled: {
    opacity: 0.65,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  submitArrow: {
    position: "absolute",
    right: 18,
    color: "#FFFFFF",
    fontSize: 22,
  },

  footerNote: {
    color: "#929A8F",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 14,
  },
});