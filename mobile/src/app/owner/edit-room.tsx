import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../services/api";
import { getStoredProfile } from "../../services/auth";

type Environment = "quiet" | "normal" | "noisy";
type Availability = "available" | "rented";

export default function EditRoom() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const roomId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rent, setRent] = useState("");
  const [location, setLocation] = useState("");
  const [roomSize, setRoomSize] = useState("");
  const [environment, setEnvironment] =
    useState<Environment>("normal");
  const [availability, setAvailability] =
    useState<Availability>("available");

  useEffect(() => {
    let active = true;

    const loadRoom = async () => {
      try {
        if (!roomId) {
          throw new Error("Room ID is missing.");
        }

        const profile = await getStoredProfile();

        if (!profile || profile.role !== "owner") {
          router.replace("/auth/login");
          return;
        }

        const response = await api.get(`/rooms/${roomId}/`);
        const room = response.data;

        if (room.owner !== profile.username) {
          router.replace("/owner/manage-listings");
          return;
        }

        if (!active) return;

        setTitle(room.title ?? "");
        setDescription(room.description ?? "");
        setRent(String(room.rent ?? ""));
        setLocation(room.location ?? "");
        setRoomSize(room.room_size ?? "");
        setEnvironment(room.environment ?? "normal");
        setAvailability(room.availability ?? "available");
      } catch (error: any) {
        console.log(
          "LOAD ROOM ERROR:",
          error?.response?.data || error?.message
        );

        if (active) {
          setErrorMessage(
            error?.response?.data?.detail ||
              error?.message ||
              "Unable to load this room."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRoom();

    return () => {
      active = false;
    };
  }, [roomId]);

  const handleSave = async () => {
    if (
      !title.trim() ||
      !rent.trim() ||
      !location.trim() ||
      !roomSize.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Enter the title, rent, location, and room size."
      );
      return;
    }

    const rentValue = Number(rent);

    if (!Number.isFinite(rentValue) || rentValue <= 0) {
      Alert.alert(
        "Invalid rent",
        "Enter a valid monthly rent."
      );
      return;
    }

    if (!roomId) {
      Alert.alert("Error", "Room ID is missing.");
      return;
    }

    setSaving(true);

    try {
      await api.patch(`/rooms/${roomId}/`, {
        title: title.trim(),
        description: description.trim(),
        rent: rentValue,
        location: location.trim(),
        room_size: roomSize.trim(),
        environment,
        availability,
      });

      Alert.alert(
        "Listing updated",
        "Your room details have been saved.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace("/owner/manage-listings"),
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "UPDATE ROOM ERROR:",
        error?.response?.data || error?.message
      );

      const details = error?.response?.data;

      const message =
        typeof details?.detail === "string"
          ? details.detail
          : "Unable to update this listing. Check your information and try again.";

      Alert.alert("Update failed", message);
    } finally {
      setSaving(false);
    }
  };

  const renderChoice = (
    label: string,
    value: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <Pressable
      key={value}
      style={[
        styles.choice,
        selected && styles.choiceSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.choiceText,
          selected && styles.choiceTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#194B38" />
        <Text style={styles.helper}>
          Loading room details...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.heading}>
          Could not open this listing
        </Text>

        <Text style={styles.helper}>
          {errorMessage}
        </Text>

        <Pressable
          style={styles.saveButton}
          onPress={() =>
            router.replace("/owner/manage-listings")
          }
        >
          <Text style={styles.saveButtonText}>
            Back to my listings
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ← Back to listings
          </Text>
        </Pressable>

        <Text style={styles.eyebrow}>
          OWNER WORKSPACE
        </Text>

        <Text style={styles.heading}>
          Edit your room
        </Text>

        <Text style={styles.helper}>
          Update the information room seekers see on RoomFinder.
        </Text>

        <Text style={styles.label}>Room title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Single room near college"
          placeholderTextColor="#929B91"
        />

        <Text style={styles.label}>Monthly rent (Rs.) *</Text>
        <TextInput
          style={styles.input}
          value={rent}
          onChangeText={setRent}
          keyboardType="decimal-pad"
          placeholder="8000"
          placeholderTextColor="#929B91"
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Pokhara"
          placeholderTextColor="#929B91"
        />

        <Text style={styles.label}>Room size *</Text>
        <TextInput
          style={styles.input}
          value={roomSize}
          onChangeText={setRoomSize}
          placeholder="e.g. 12 x 10 ft"
          placeholderTextColor="#929B91"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the room and its facilities..."
          placeholderTextColor="#929B91"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Environment</Text>
        <View style={styles.choices}>
          {renderChoice(
            "Quiet",
            "quiet",
            environment === "quiet",
            () => setEnvironment("quiet")
          )}

          {renderChoice(
            "Normal",
            "normal",
            environment === "normal",
            () => setEnvironment("normal")
          )}

          {renderChoice(
            "Noisy",
            "noisy",
            environment === "noisy",
            () => setEnvironment("noisy")
          )}
        </View>

        <Text style={styles.label}>Availability</Text>
        <View style={styles.choices}>
          {renderChoice(
            "Available",
            "available",
            availability === "available",
            () => setAvailability("available")
          )}

          {renderChoice(
            "Rented",
            "rented",
            availability === "rented",
            () => setAvailability("rented")
          )}
        </View>

        <Pressable
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          disabled={saving}
          onPress={() => void handleSave()}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              Save changes
            </Text>
          )}
        </Pressable>
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
    padding: 22,
    paddingBottom: 40,
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
    fontSize: 29,
    fontWeight: "800",
    marginTop: 7,
  },
  helper: {
    color: "#788276",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  label: {
    color: "#294C35",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 19,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0E7DC",
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#202B24",
    fontSize: 14,
  },
  textArea: {
    minHeight: 105,
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  choice: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#DCE4D8",
    paddingHorizontal: 15,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
  },
  choiceSelected: {
    backgroundColor: "#194B38",
    borderColor: "#194B38",
  },
  choiceText: {
    color: "#536252",
    fontSize: 12,
    fontWeight: "700",
  },
  choiceTextSelected: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#194B38",
    borderRadius: 14,
    minHeight: 52,
    marginTop: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.65,
  },
});