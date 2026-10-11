
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { UserProfile } from "../../services/auth";
import { saveSession } from "../../services/auth";

import api from "../../services/api";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
const handleLogin = async () => {
  if (!username.trim() || !password) {
    Alert.alert(
      "Missing information",
      "Please enter your username and password."
    );
    return;
  }

  let credentialsAccepted = false;

  try {
    setLoading(true);

    // 1. Authenticate with Django.
    const response = await api.post("/users/login/", {
      username: username.trim(),
      password,
    });

    const access = response.data?.access;
    const refresh = response.data?.refresh;

    if (!access) {
      Alert.alert(
        "Login Error",
        "The server did not return an access token."
      );
      return;
    }

    credentialsAccepted = true;

    // 2. Fetch the authenticated user's profile.
    const profileResponse = await api.get("/users/profile/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });

    const profile = profileResponse.data as UserProfile;

    // 3. Check the role before choosing a destination.
    if (profile.role !== "seeker" && profile.role !== "owner") {
      throw new Error(
        "Your profile does not contain a valid account role."
      );
    }

    // 4. Save the tokens and profile on the device.
    await saveSession(access, refresh, profile);

    // 5. Navigate to the correct dashboard.
    if (profile.role === "owner") {
      router.replace("/owner/dashboard");
    } else {
      router.replace("/seeker/home");
    }
  } catch (error: any) {
    console.log("LOGIN FLOW ERROR:", error?.response?.data ?? error?.message);

    const data = error?.response?.data;

    const serverMessage =
      data?.detail ??
      (data
        ? Object.entries(data)
            .map(([field, value]) =>
              `${field}: ${
                Array.isArray(value) ? value.join(", ") : String(value)
              }`
            )
            .join("\n")
        : error?.message);

    if (credentialsAccepted) {
      Alert.alert(
        "Profile Setup Failed",
        `Your credentials were accepted, but RoomFinder couldn't finish loading your profile or saving your session. ${
          serverMessage || "Please try again."
        }`
      );
    } else {
      Alert.alert(
        "Login Failed",
        serverMessage || "Please check your username and password."
      );
    }
  } finally {
    setLoading(false);
  }
};
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace("/")}
              accessibilityLabel="Back to welcome screen"
            >
              <Text style={styles.backArrow}>←</Text>
            </Pressable>

            <View style={styles.brand}>
              <View style={styles.logoBox}>
                <Text style={styles.logoSymbol}>⌂</Text>
              </View>

              <Text style={styles.logoText}>RoomFinder</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          {/* Welcome Section */}
          <View style={styles.introduction}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>
                YOUR SPACE IS WAITING
              </Text>
            </View>

            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.titleGreen}>back.</Text>

            <Text style={styles.subtitle}>
              Sign in to discover rooms, manage your listings,
              and continue your RoomFinder journey.
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formCard}>
            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>Sign in</Text>
              <Text style={styles.formDescription}>
                Enter your account details below.
              </Text>
            </View>

            {/* Username */}
            <View style={styles.field}>
              <Text style={styles.label}>USERNAME</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>@</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#A0A79F"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  accessibilityLabel="Username"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>●</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0A79F"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={() => handleLogin()}
                  accessibilityLabel="Password"
                />

                <Pressable
                  style={styles.visibilityButton}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading}
                >
                  <Text style={styles.visibilityText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Helpful information */}
            <View style={styles.tipContainer}>
              <View style={styles.tipIconBox}>
                <Text style={styles.tipIcon}>✓</Text>
              </View>

              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>
                  Your home journey continues
                </Text>

                <Text style={styles.tipDescription}>
                  Sign in with the username and password
                  you used when registering.
                </Text>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && !loading && styles.buttonPressed,
                loading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Signing in..." : "Login to RoomFinder"}
              </Text>

              {!loading && (
                <Text style={styles.loginArrow}>→</Text>
              )}
            </Pressable>

            <Text style={styles.securityText}>
              Keep your account credentials private and secure.
            </Text>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              New to RoomFinder?{" "}
            </Text>

            <Pressable
              onPress={() => router.replace("/auth/register")}
              disabled={loading}
            >
              <Text style={styles.registerLink}>
                Create an account
              </Text>
            </Pressable>
          </View>

          <Text style={styles.bottomText}>
            FIND YOUR SPACE. START YOUR STORY.
          </Text>
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

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 23,
    paddingTop: 12,
    paddingBottom: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 36,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E9E0",
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  logoSymbol: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -3,
  },

  logoText: {
    color: "#194B38",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  headerSpacer: {
    width: 42,
  },

  // Introduction
  introduction: {
    marginBottom: 28,
  },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E7EDE2",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 18,
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
    letterSpacing: 0.8,
  },

  title: {
    fontSize: 39,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.3,
    color: "#202B24",
  },

  titleGreen: {
    fontSize: 39,
    lineHeight: 45,
    fontWeight: "800",
    letterSpacing: -1.3,
    color: "#286547",
  },

  subtitle: {
    color: "#69746B",
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
  },

  // Form Card
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 21,
    borderWidth: 1,
    borderColor: "#E8EBE3",
    shadowColor: "#194B38",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  formHeading: {
    marginBottom: 25,
  },

  formTitle: {
    color: "#202B24",
    fontSize: 22,
    fontWeight: "800",
  },

  formDescription: {
    color: "#818980",
    fontSize: 13,
    marginTop: 6,
  },

  field: {
    marginBottom: 21,
  },

  label: {
    color: "#526255",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 9,
  },

  inputContainer: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E6DD",
    borderRadius: 14,
    backgroundColor: "#FAFBF8",
    paddingHorizontal: 13,
  },

  inputPrefix: {
    width: 25,
    fontSize: 17,
    fontWeight: "600",
    color: "#62816A",
    textAlign: "center",
    marginRight: 8,
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 53,
    color: "#26352B",
    fontSize: 14,
    paddingVertical: 0,
  },

  visibilityButton: {
    paddingLeft: 8,
    paddingVertical: 10,
  },

  visibilityText: {
    color: "#286547",
    fontSize: 12,
    fontWeight: "700",
  },

  // Helpful tip
  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F1F5ED",
    borderRadius: 14,
    padding: 13,
    marginTop: 1,
    marginBottom: 23,
  },

  tipIconBox: {
    height: 27,
    width: 27,
    backgroundColor: "#DCE9D7",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  tipIcon: {
    fontSize: 16,
    fontWeight: "800",
    color: "#286547",
  },

  tipContent: {
    flex: 1,
  },

  tipTitle: {
    color: "#294C35",
    fontSize: 12,
    fontWeight: "800",
  },

  tipDescription: {
    color: "#718071",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  // Login Button
  loginButton: {
    height: 57,
    backgroundColor: "#194B38",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  loginArrow: {
    color: "#FFFFFF",
    position: "absolute",
    right: 19,
    fontSize: 23,
  },

  securityText: {
    textAlign: "center",
    color: "#90978E",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 15,
    paddingHorizontal: 5,
  },

  // Footer
  registerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 27,
  },

  registerText: {
    color: "#747D73",
    fontSize: 13,
  },

  registerLink: {
    color: "#194B38",
    fontSize: 13,
    fontWeight: "800",
  },

  bottomText: {
    color: "#99A095",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 26,
  },
});