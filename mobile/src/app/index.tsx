import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6F7F1"
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>⌂</Text>
            </View>

            <Text style={styles.logoText}>RoomFinder</Text>
          </View>

          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>NEPAL</Text>
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.introduction}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>
              YOUR NEXT CHAPTER STARTS HERE
            </Text>
          </View>

          <Text style={styles.heading}>
            Find a place
          </Text>

          <Text style={styles.headingGreen}>
            to call home.
          </Text>

          <Text style={styles.description}>
            Discover rooms that match your lifestyle,
            location, and budget. Your next home starts here.
          </Text>
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroBadge}>
              ROOMS MADE SIMPLE
            </Text>

            <Text style={styles.sparkle}>✦</Text>
          </View>

          <View style={styles.illustration}>
            <View style={styles.illustrationCircle}>
              <Text style={styles.houseEmoji}>🏡</Text>
            </View>

            <View style={styles.floatingLabel}>
              <Text style={styles.floatingLabelIcon}>⌕</Text>
              <Text style={styles.floatingLabelText}>
                Find your fit
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            More than a room.
          </Text>

          <Text style={styles.heroDescription}>
            A space for your next beginning.
          </Text>

          <View style={styles.divider} />

          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.footerTitle}>
                Explore places
              </Text>

              <Text style={styles.footerDescription}>
                Search by location and budget
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>↗</Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⌕</Text>
            <Text style={styles.featureText}>Easy search</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>₹</Text>
            <Text style={styles.featureText}>Your budget</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⌖</Text>
            <Text style={styles.featureText}>Your location</Text>
          </View>
        </View>

        {/* Get started */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/auth/register")}
        >
          <Text style={styles.primaryButtonText}>
            Get Started
          </Text>

          <Text style={styles.primaryArrow}>→</Text>
        </Pressable>

        {/* Login */}
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginBold}>Login</Text>
          </Text>
        </Pressable>

        <Text style={styles.bottomText}>
          FIND YOUR SPACE. START YOUR STORY.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F7F1",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 23,
    paddingTop: 16,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logoBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#194B38",
    justifyContent: "center",
    alignItems: "center",
  },

  logoIcon: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: -4,
  },

  logoText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#194B38",
    letterSpacing: -0.7,
  },

  locationBadge: {
    backgroundColor: "#E5EBDD",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
  },

  locationText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#194B38",
    letterSpacing: 1,
  },

  introduction: {
    marginBottom: 25,
  },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E7EDE2",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 20,
    marginBottom: 19,
    gap: 7,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#50825B",
  },

  eyebrowText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#41634A",
    letterSpacing: 0.8,
  },

  heading: {
    fontSize: 39,
    fontWeight: "800",
    color: "#202B24",
    letterSpacing: -1.5,
    lineHeight: 45,
  },

  headingGreen: {
    fontSize: 39,
    fontWeight: "800",
    color: "#286547",
    letterSpacing: -1.5,
    lineHeight: 46,
  },

  description: {
    color: "#69746B",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 330,
  },

  heroCard: {
    backgroundColor: "#194B38",
    borderRadius: 26,
    padding: 19,
    marginBottom: 16,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroBadge: {
    color: "#DCEBDD",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  sparkle: {
    color: "#DCEBDD",
    fontSize: 22,
  },

  illustration: {
    height: 145,
    marginTop: 16,
    marginBottom: 19,
    borderRadius: 20,
    backgroundColor: "#2D6049",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  illustrationCircle: {
    height: 100,
    width: 100,
    borderRadius: 50,
    backgroundColor: "#DFEACE",
    alignItems: "center",
    justifyContent: "center",
  },

  houseEmoji: {
    fontSize: 53,
  },

  floatingLabel: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },

  floatingLabelIcon: {
    fontSize: 18,
    color: "#194B38",
  },

  floatingLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#194B38",
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  heroDescription: {
    fontSize: 13,
    color: "#DCEBDD",
    marginTop: 6,
  },

  divider: {
    height: 1,
    backgroundColor: "#426B54",
    marginVertical: 18,
  },

  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  footerDescription: {
    fontSize: 10,
    color: "#DCEBDD",
    marginTop: 5,
  },

  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E4ECD9",
    justifyContent: "center",
    alignItems: "center",
  },

  arrowText: {
    color: "#194B38",
    fontSize: 25,
    fontWeight: "600",
  },

  features: {
    flexDirection: "row",
    marginBottom: 22,
    gap: 8,
  },

  feature: {
    flex: 1,
    minHeight: 74,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7EAE1",
  },

  featureIcon: {
    fontSize: 22,
    color: "#286547",
    marginBottom: 5,
    fontWeight: "600",
  },

  featureText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#344538",
  },

  primaryButton: {
    height: 57,
    backgroundColor: "#194B38",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 18,
    position: "relative",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  primaryArrow: {
    position: "absolute",
    right: 21,
    color: "#FFFFFF",
    fontSize: 22,
  },

  loginButton: {
    alignItems: "center",
    paddingVertical: 5,
  },

  loginText: {
    color: "#727970",
    fontSize: 13,
  },

  loginBold: {
    color: "#194B38",
    fontWeight: "800",
  },

  bottomText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.7,
    color: "#98A096",
    textAlign: "center",
    marginTop: 26,
  },
});