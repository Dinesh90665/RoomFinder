
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
import api from "../../services/api";

type UserRole = "seeker" | "owner";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [role, setRole] = useState<UserRole>("seeker");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your username, email, and password."
      );
      return;
    }

    if (!email.trim().includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak password",
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password mismatch",
        "Your passwords do not match. Please try again."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/users/register/", {
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
      });

      Alert.alert(
        "Welcome to RoomFinder!",
        "Your account has been created successfully.",
        [
          {
            text: "Continue to Login",
            onPress: () => router.replace("/auth/login"),
          },
        ]
      );
    } catch (error: any) {
      console.log("REGISTER ERROR FULL:", error);
      console.log("SERVER RESPONSE:", error?.response?.data);
      console.log("REQUEST URL:", error?.config?.baseURL, error?.config?.url);

      const responseData = error?.response?.data;

      let message = "Unable to create your account. Please try again.";

      if (responseData) {
        message =
          typeof responseData === "string"
            ? responseData
            : Object.entries(responseData)
                .map(
                  ([field, value]) =>
                    `${field}: ${
                      Array.isArray(value)
                        ? value.join(", ")
                        : String(value)
                    }`
                )
                .join("\n");
      }

      Alert.alert("Registration Failed", message);
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
              accessibilityLabel="Go back to welcome screen"
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

          {/* Introduction */}
          <View style={styles.introduction}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>
                LET'S GET YOU STARTED
              </Text>
            </View>

            <Text style={styles.title}>Create account</Text>

            <Text style={styles.subtitle}>
              Join RoomFinder to discover a place to live
              or share your property with others.
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Your details
            </Text>

            <Text style={styles.sectionDescription}>
              Enter your information below.
            </Text>

            {/* Username */}
            <View style={styles.field}>
              <Text style={styles.label}>USERNAME</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>@</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
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

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>✉</Text>

                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#A0A79F"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  accessibilityLabel="Email address"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.label}>
                PHONE NUMBER
                <Text style={styles.optional}>  (OPTIONAL)</Text>
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>☎</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#A0A79F"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                  returnKeyType="next"
                  accessibilityLabel="Phone number"
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
                  placeholder="At least 8 characters"
                  placeholderTextColor="#A0A79F"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  returnKeyType="next"
                  accessibilityLabel="Password"
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                  style={styles.visibilityButton}
                >
                  <Text style={styles.visibilityText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputPrefix}>●</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter password again"
                  placeholderTextColor="#A0A79F"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  accessibilityLabel="Confirm password"
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  style={styles.visibilityButton}
                >
                  <Text style={styles.visibilityText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Account Role */}
            <View style={styles.roleSection}>
              <Text style={styles.label}>I WANT TO...</Text>

              <Pressable
                style={[
                  styles.roleCard,
                  role === "seeker" && styles.selectedRoleCard,
                ]}
                onPress={() => setRole("seeker")}
                disabled={loading}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    role === "seeker" &&
                      styles.selectedRoleIconBox,
                  ]}
                >
                  <Text style={styles.roleIcon}>⌕</Text>
                </View>

                <View style={styles.roleContent}>
                  <Text
                    style={[
                      styles.roleTitle,
                      role === "seeker" &&
                        styles.selectedRoleTitle,
                    ]}
                  >
                    Find a room
                  </Text>

                  <Text style={styles.roleDescription}>
                    I'm looking for a place to live.
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    role === "seeker" && styles.radioSelected,
                  ]}
                >
                  {role === "seeker" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.roleCard,
                  role === "owner" && styles.selectedRoleCard,
                ]}
                onPress={() => setRole("owner")}
                disabled={loading}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    role === "owner" &&
                      styles.selectedRoleIconBox,
                  ]}
                >
                  <Text style={styles.roleIcon}>⌂</Text>
                </View>

                <View style={styles.roleContent}>
                  <Text
                    style={[
                      styles.roleTitle,
                      role === "owner" &&
                        styles.selectedRoleTitle,
                    ]}
                  >
                    List my property
                  </Text>

                  <Text style={styles.roleDescription}>
                    I'm a house owner with a room to rent.
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    role === "owner" && styles.radioSelected,
                  ]}
                >
                  {role === "owner" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>
            </View>

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !loading && styles.buttonPressed,
                loading && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading
                  ? "Creating your account..."
                  : "Create Account"}
              </Text>

              {!loading && (
                <Text style={styles.submitArrow}>→</Text>
              )}
            </Pressable>

            <Text style={styles.privacyText}>
              Your information will be used to create
              your RoomFinder account.
            </Text>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?{" "}
            </Text>

            <Pressable
              onPress={() => router.replace("/auth/login")}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Login</Text>
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
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
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
    fontSize: 25,
    color: "#194B38",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: "#194B38",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  logoSymbol: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -3,
  },

  logoText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#194B38",
    letterSpacing: -0.6,
  },

  headerSpacer: {
    width: 42,
  },

  // Introduction
  introduction: {
    marginBottom: 24,
  },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E7EDE2",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },

  eyebrowDot: {
    height: 7,
    width: 7,
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
    color: "#202B24",
    fontSize: 33,
    fontWeight: "800",
    letterSpacing: -1,
  },

  subtitle: {
    color: "#69746B",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
  },

  // Form card
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
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

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#202B24",
  },

  sectionDescription: {
    color: "#818980",
    fontSize: 13,
    marginTop: 5,
    marginBottom: 23,
  },

  field: {
    marginBottom: 19,
  },

  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#526255",
    marginBottom: 9,
  },

  optional: {
    color: "#9BA39A",
    fontWeight: "500",
    letterSpacing: 0,
  },

  inputContainer: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E6DD",
    borderRadius: 13,
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
    height: 51,
    fontSize: 14,
    color: "#26352B",
    paddingVertical: 0,
  },

  visibilityButton: {
    paddingVertical: 10,
    paddingLeft: 8,
  },

  visibilityText: {
    color: "#286547",
    fontWeight: "700",
    fontSize: 12,
  },

  // Role selector
  roleSection: {
    marginTop: 5,
    marginBottom: 22,
  },

  roleCard: {
    minHeight: 83,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E8E0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 13,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },

  selectedRoleCard: {
    backgroundColor: "#F0F5EC",
    borderColor: "#286547",
    borderWidth: 1.5,
  },

  roleIconBox: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#F0F2EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  selectedRoleIconBox: {
    backgroundColor: "#DCE9D7",
  },

  roleIcon: {
    fontSize: 28,
    fontWeight: "600",
    color: "#286547",
  },

  roleContent: {
    flex: 1,
    paddingRight: 5,
  },

  roleTitle: {
    color: "#344538",
    fontSize: 13,
    fontWeight: "800",
  },

  selectedRoleTitle: {
    color: "#194B38",
  },

  roleDescription: {
    color: "#828980",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#CCD3C8",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#286547",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#286547",
  },

  // Submit button
  submitButton: {
    height: 56,
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

  submitText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  submitArrow: {
    position: "absolute",
    right: 19,
    color: "#FFFFFF",
    fontSize: 23,
  },

  privacyText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#90978E",
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 8,
  },

  // Footer
  loginContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  loginText: {
    fontSize: 13,
    color: "#747D73",
  },

  loginLink: {
    fontSize: 13,
    fontWeight: "800",
    color: "#194B38",
  },

  bottomText: {
    color: "#99A095",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 25,
  },
});