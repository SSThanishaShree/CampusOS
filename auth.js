import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, onAuthStateChanged,
  updateProfile, reload
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8C63G2lSA8gEUza0REt0IcuSnoOVe8_A",
  authDomain: "campusos-5cafb.firebaseapp.com",
  projectId: "campusos-5cafb",
  storageBucket: "campusos-5cafb.firebasestorage.app",
  messagingSenderId: "225178486667",
  appId: "1:225178486667:web:f06ae1deaaf2cd2d78d18e",
  measurementId: "G-NMWR52G1ZN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const $ = id => document.getElementById(id);
const DOMAIN = "bmsce.ac.in";
let dashboardLoaded = false;

function showMessage(message, type = "info") {
  const el = $("authMessage");
  el.textContent = message;
  el.className = `auth-message show ${type}`;
}
function clearMessage() {
  const el = $("authMessage");
  el.textContent = "";
  el.className = "auth-message";
}
function validCollegeEmail(value) {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@bmsce\.ac\.in$/.test(email);
}
function friendlyError(error) {
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email. Try signing in.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account found for this email. Create an account first.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Wait a little and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/operation-not-allowed": "Email/Password sign-in is not enabled in Firebase Authentication.",
    "auth/unauthorized-domain": "This website domain isn't authorised in Firebase. Add your Netlify hostname under Authentication → Settings → Authorized domains."
  };
  return messages[code] || `Couldn't complete that action (${code || "unknown error"}). Check Firebase settings and try again.`;
}
function setBusy(form, busy, buttonText) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = buttonText || "Please wait…";
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
  }
  button.disabled = busy;
}
function switchMode(mode) {
  const signup = mode === "signup";
  $("loginForm").hidden = signup;
  $("signupForm").hidden = !signup;
  $("showLogin").classList.toggle("active", !signup);
  $("showSignup").classList.toggle("active", signup);
  clearMessage();
}
$("showLogin").addEventListener("click", () => switchMode("login"));
$("showSignup").addEventListener("click", () => switchMode("signup"));

$("signupForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  clearMessage();
  const name = $("signupName").value.trim();
  const email = $("signupEmail").value.trim().toLowerCase();
  const password = $("signupPassword").value;
  if (!validCollegeEmail(email)) {
    showMessage("Use an email ending exactly in @bmsce.ac.in.", "error");
    return;
  }
  if (password.length < 6) {
    showMessage("Password must contain at least 6 characters.", "error");
    return;
  }
  setBusy(form, true, "Creating account…");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    await signOut(auth);
    form.reset();
    switchMode("login");
    showMessage("Account created! Open the verification email sent to " + email + ", click its link, then return here and sign in. Check Spam/Junk if it doesn't arrive.", "success");
  } catch (error) {
    showMessage(friendlyError(error), "error");
  } finally {
    setBusy(form, false);
  }
});

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  clearMessage();
  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  if (!validCollegeEmail(email)) {
    showMessage("Use your BMSCE email ending in @bmsce.ac.in.", "error");
    return;
  }
  setBusy(form, true, "Signing in…");
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await reload(credential.user);
    if (!credential.user.emailVerified) {
      try { await sendEmailVerification(credential.user); } catch {}
      await signOut(auth);
      showMessage("Your email isn't verified yet. We've tried sending another verification email. Open the link in your inbox, then sign in again.", "error");
      return;
    }
    showMessage("Signed in successfully.", "success");
  } catch (error) {
    showMessage(friendlyError(error), "error");
  } finally {
    setBusy(form, false);
  }
});

$("forgotPassword").addEventListener("click", async () => {
  clearMessage();
  const email = $("loginEmail").value.trim().toLowerCase();
  if (!validCollegeEmail(email)) {
    showMessage("Enter your BMSCE email in the email field first.", "error");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("If an account exists for this address, a password reset email has been sent.", "success");
  } catch (error) {
    showMessage(friendlyError(error), "error");
  }
});

$("logoutButton").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.reload();
  } catch (error) {
    showMessage(friendlyError(error), "error");
  }
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    $("authScreen").hidden = false;
    $("campusApp").hidden = true;
    return;
  }
  try {
    await reload(user);
    if (!user.emailVerified) {
      await signOut(auth);
      $("authScreen").hidden = false;
      $("campusApp").hidden = true;
      showMessage("Verify your email before accessing CampusOS.", "error");
      return;
    }
    // Data is namespaced by Firebase UID, so browser-local records don't mix between accounts.
    window.CAMPUSOS_UID = user.uid;
    $("profileName").textContent = user.displayName || "BMSCE Student";
    $("profileEmail").textContent = user.email || "Verified student";
    $("profileAvatar").textContent = (user.displayName || user.email || "B").trim().charAt(0).toUpperCase();
    $("topAvatar").textContent = (user.displayName || user.email || "B").trim().charAt(0).toUpperCase();
    $("topbarUserEmail").textContent = user.email || "Verified student";
    $("authScreen").hidden = true;
    $("campusApp").hidden = false;
    if (!dashboardLoaded) {
      dashboardLoaded = true;
      await import("./script.js");
    }
  } catch (error) {
    console.error("CampusOS auth state error:", error);
    $("authScreen").hidden = false;
    $("campusApp").hidden = true;
    showMessage("Couldn't validate your sign-in. Check your connection and try again.", "error");
  }
});
