# Be Safe - Women Safety Android Application

A comprehensive Women Safety Android application designed to help women in emergency situations. The app provides multiple emergency trigger mechanisms, instant location sharing, emergency calls, and educational self-defense content.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [How Each Feature Works](#how-each-feature-works)
4. [App Flow & Navigation](#app-flow--navigation)
5. [Technical Architecture](#technical-architecture)
6. [Database Structure](#database-structure)
7. [Permissions Used](#permissions-used)
8. [API Integrations](#api-integrations)
9. [File Structure](#file-structure)
10. [How to Use the App](#how-to-use-the-app)

---

## Overview

**App Name:** Be Safe
**Package:** `com.example.women_safety`
**Platform:** Android
**Backend:** Firebase Realtime Database

This app provides a safety solution for women through:
- Multiple emergency trigger mechanisms (shake, voice, button)
- Automatic SMS with live GPS location
- Emergency calling to saved contacts
- Siren alarm system
- Self-defense tutorial videos
- Emergency helpline directory

---

## Key Features

| Feature | Trigger Method | What Happens |
|---------|---------------|--------------|
| **Shake Detection** | Shake phone vigorously for 300ms | Sends SMS + Plays siren + Vibrates |
| **Voice Command** | Say "HELP" loudly | Sends SMS + Makes emergency call |
| **Volume Down** | Hold volume down for 1 second | Makes emergency call |
| **Siren Alarm** | Toggle switch in app | Loud siren sound plays |
| **Emergency Contacts** | Add in Relatives section | Receives SMS alerts |
| **Location Sharing** | Automatic with emergencies | Google Maps link sent via SMS |
| **Helpline Numbers** | Tap to call | Direct dial to emergency services |
| **Self-Defense Videos** | Watch in app | YouTube tutorials embedded |

---

## How Each Feature Works

### 1. Shake Detection Emergency System

**File:** `Activity_home.java` (Lines 228-296)

```
How it works:
1. App constantly monitors the phone's accelerometer sensor
2. Calculates movement intensity using formula: sqrt(x² + y² + z²)
3. If intensity > 12.0 for 300+ milliseconds continuously:
   → Phone vibrates for 2 seconds
   → Siren alarm starts playing
   → Gets current GPS location
   → Sends SMS to ALL emergency contacts with Google Maps link
```

**Technical Details:**
- Uses `SensorManager` with `TYPE_ACCELEROMETER`
- Threshold: 12.0 (acceleration magnitude)
- Duration: 300 milliseconds minimum
- Runs in foreground when app is open

---

### 2. Volume Down Long Press Emergency Call

**File:** `Activity_home.java` (Lines 499-529)

```
How it works:
1. App intercepts volume down button press
2. Records the time when button is pressed
3. When released, checks if held for 1+ second
4. If yes → Makes direct call to PRIMARY emergency contact
```

**Technical Details:**
- Overrides `onKeyDown()` and `onKeyUp()` methods
- Uses `KEYCODE_VOLUME_DOWN`
- Threshold: 1000 milliseconds (1 second)
- Calls primary contact stored in `emergencyContact` field

---

### 3. Voice Recognition "HELP" Detection

**File:** `Activity_home.java` (Lines 531-590)

```
How it works:
1. SpeechRecognizer continuously listens for voice
2. Converts speech to text
3. Checks if text contains the word "help" (case-insensitive)
4. If detected:
   → Sends emergency SMS with location
   → Makes emergency call to primary contact
5. Restarts listening after each detection cycle
```

**Technical Details:**
- Uses `SpeechRecognizer` API
- Language: English (en-US)
- Requires `RECORD_AUDIO` permission
- Runs continuously while on home screen

---

### 4. Emergency SMS with Location

**File:** `Activity_home.java` (Lines 329-385)

**Message Format:**
```
Hello, I am in danger, Please urgently reach me out.
Here is my live location:

Google Maps Link: https://www.google.com/maps?q=28.7041,77.1025
```

**Recipients:**
1. Primary Emergency Contact (from registration)
2. All relatives added in the app

**Technical Details:**
- Uses `FusedLocationProviderClient` for GPS
- Sends via `SmsManager.sendTextMessage()`
- Gets last known location for instant response

---

### 5. Siren Alarm System

**File:** `Activity_home.java` (Lines 98, 314-317)

```
How it works:
1. Toggle switch in the home screen UI
2. When ON → Plays loud siren sound from app resources
3. When OFF → Stops the siren
4. Also automatically triggered by shake detection
```

**Technical Details:**
- Uses `MediaPlayer` class
- Audio file: `res/raw/siren`
- Can be manually toggled or auto-triggered

---

### 6. Background Location Tracking

**File:** `LocationService.java`

```
How it works:
1. Service starts when user logs in
2. Every 5 minutes, fetches current GPS coordinates
3. Uploads to Firebase with:
   - Latitude
   - Longitude
   - Google Maps link
4. Continues even when app is closed
```

**Firebase Path:** `locations/{userEmail}/location/{locationId}`

**Technical Details:**
- Runs as Android Service
- Update interval: 5 minutes (300,000 ms)
- Uses `FusedLocationProviderClient`
- Survives app closure

---

### 7. Auto-Start on Boot

**File:** `BootReceiver.java`

```
How it works:
1. Listens for device boot completion
2. Checks SharedPreferences if user was logged in
3. If logged in → Automatically starts LocationService
4. Location tracking resumes without opening app
```

**Technical Details:**
- Extends `BroadcastReceiver`
- Listens for `BOOT_COMPLETED` action
- Checks `isLoggedIn` flag in SharedPreferences

---

### 8. Relatives Management System

**Files:**
- `Activity_relatives.java` - Menu
- `Activity_add_relatives.java` - Add new
- `Activity_display_relatives.java` - View/Delete/Call
- `Activity_update_relative.java` - Edit existing

```
How it works:
1. User can add multiple emergency contacts (relatives)
2. Each relative has: Name, Phone, Relationship
3. Stored in Firebase under user's profile
4. All relatives receive emergency SMS
5. Can directly call any relative from the list
```

**Firebase Path:** `Users/{userId}/relatives/{relativeId}`

**Data Stored:**
| Field | Description |
|-------|-------------|
| relativeId | Unique ID (auto-generated) |
| name | Relative's full name |
| phone | Phone number |
| relationship | e.g., Mother, Father, Brother |

---

### 9. User Authentication System

**Files:**
- `Activity_login.java` - Login
- `Activity_register.java` - Registration
- `Activty_verify_email.java` - OTP verification

```
Registration Flow:
1. User enters: Full Name, Email, Phone, Emergency Contact, Password
2. App generates 6-digit OTP
3. Sends OTP to email via SMTP (JavaMail API)
4. User enters OTP to verify
5. Account created in Firebase

Login Flow:
1. User enters email and password
2. App queries Firebase for matching credentials
3. If found → Login successful, redirect to Home
4. Saves login state in SharedPreferences
```

**OTP Email:** Sent from `womensafety06@gmail.com`

---

### 10. Password Recovery System

**Files:**
- `Activity_forgot_password.java` - Enter email
- `Activity_new_password.java` - OTP + New password
- `Activity_changed.java` - Success screen

```
How it works:
1. User enters registered email
2. App checks if email exists in Firebase
3. Generates 6-digit OTP
4. Sends OTP to email
5. User enters OTP + New password
6. Password updated in Firebase
```

---

### 11. Emergency Helpline Directory

**File:** `Activity_emergency.java`

**Pre-configured Numbers:**
| Service | Number |
|---------|--------|
| Women Helpline | 1091 |
| Police | 100 |
| Women Commission | 7827-170-170 |
| Women Helpline (All India) | 181 |
| Student/Child Helpline | 1098 |

**Features:**
- One-tap to call
- Uses `RecyclerView` with `HelplineAdapter`
- Each item has call button with phone icon

---

### 12. Self-Defense Video Tutorials

**File:** `Activity_selfdefence.java`

**Embedded YouTube Videos:**
1. 5 Self-Defense Moves Every Woman Should Know
2. Self Defence for Women - The most Effective Techniques
3. 8 Self-defense techniques every woman should know
4. Most Common Women's Self Defense - Krav Maga for Beginners
5. 5 EASY Self Defence Moves Every Woman MUST Learn

**Technical Details:**
- Videos embedded via WebView
- YouTube iframe embed with autoplay disabled
- Scrollable list using RecyclerView

---

### 13. User Profile Management

**File:** `Activity_profile.java`

```
Features:
1. View all user information
2. Edit profile details
3. Update in Firebase
4. Logout functionality
```

**Displayed Fields:**
- Full Name
- Email
- Phone
- Emergency Contact

---

### 14. Interactive Onboarding/Tutorial

**Files:**
- `Activity_how.java` - Onboarding with animations
- `OnboardingAdapter.java` - ViewPager adapter

**Features:**
- Step-by-step app usage guide
- Lottie animations for visual appeal
- Swipeable screens using ViewPager2
- Dot indicators for navigation

---

## App Flow & Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP STARTUP                               │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  Splash Screen  │
                    │   (1.3 sec)     │
                    └────────┬────────┘
                             │
           ┌─────────────────┴─────────────────┐
           │                                   │
           ▼                                   ▼
   ┌───────────────┐                 ┌─────────────────┐
   │ Not Logged In │                 │  Already Logged │
   │               │                 │       In        │
   └───────┬───────┘                 └────────┬────────┘
           │                                   │
           ▼                                   │
   ┌───────────────┐                          │
   │  Login Screen │◄─────────────────────────┤
   └───────┬───────┘                          │
           │                                   │
    ┌──────┴──────┐                           │
    │             │                           │
    ▼             ▼                           ▼
┌────────┐  ┌──────────┐              ┌─────────────┐
│Register│  │ Forgot   │              │    HOME     │
│  New   │  │ Password │              │   SCREEN    │
│ User   │  │          │              │  (Main Hub) │
└────┬───┘  └──────────┘              └──────┬──────┘
     │                                       │
     ▼                                       │
┌─────────┐                                  │
│  OTP    │                                  │
│ Verify  │──────────────────────────────────┘
└─────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      HOME SCREEN FEATURES                        │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │    HOME     │
                        │   SCREEN    │
                        └──────┬──────┘
                               │
     ┌─────────┬───────┬───────┼───────┬───────┬─────────┐
     │         │       │       │       │       │         │
     ▼         ▼       ▼       ▼       ▼       ▼         ▼
┌─────────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐
│Relatives│ │Help-│ │Self │ │ My  │ │ How │ │ Log │ │Emergency│
│  Menu   │ │lines│ │ Def │ │Prof-│ │ To  │ │ Out │ │Triggers │
└────┬────┘ └─────┘ │Video│ │ ile │ │ Use │ └─────┘ └────┬────┘
     │              └─────┘ └─────┘ └─────┘              │
     │                                                   │
     ▼                                          ┌────────┴────────┐
┌─────────┐                                     │                 │
│Add View │                              ┌──────▼─────┐  ┌────────▼───────┐
│Relatives│                              │   SHAKE    │  │  VOICE "HELP"  │
└─────────┘                              │  DETECTION │  │   DETECTION    │
                                         └──────┬─────┘  └────────┬───────┘
                                                │                 │
                                                └────────┬────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  EMERGENCY SMS  │
                                               │  + SIREN ALARM  │
                                               │  + PHONE CALL   │
                                               └─────────────────┘
```

---

## Technical Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Language** | Java |
| **UI** | XML Layouts |
| **Backend** | Firebase Realtime Database |
| **Location** | Google Play Services (FusedLocationProviderClient) |
| **Maps** | Google Maps SDK |
| **Email** | JavaMail API (SMTP) |
| **Animations** | Lottie Library |
| **Voice** | Android SpeechRecognizer |
| **Sensors** | Accelerometer via SensorManager |

### Key Android Components

| Type | Components |
|------|------------|
| **Activities** | 18 total (Splash, Login, Register, Home, etc.) |
| **Services** | LocationService, BackgroundService |
| **Receivers** | BootReceiver, AlarmReceiver |
| **Adapters** | HelplineAdapter, VideoAdapter, OnboardingAdapter, RelativeAdapter |
| **Models** | User, LocationData, Helpline, OnboardingItem, Relative |

---

## Database Structure

### Firebase Realtime Database

```
Firebase Database
│
├── Users/
│   └── {userId}/
│       ├── fullName: "John Doe"
│       ├── phone: "9876543210"
│       ├── emergencyContact: "9123456789"
│       ├── email: "john@email.com"
│       ├── password: "hashedpassword"
│       └── relatives/
│           ├── {relativeId1}/
│           │   ├── relativeId: "abc123"
│           │   ├── name: "Jane Doe"
│           │   ├── phone: "9988776655"
│           │   └── relationship: "Mother"
│           └── {relativeId2}/
│               └── ...
│
├── locations/
│   └── {userEmail}/
│       └── location/
│           └── {locationId}/
│               ├── latitude: 28.7041
│               ├── longitude: 77.1025
│               └── googleMapsLink: "https://..."
│
└── UserLocations/
    └── {userEmail}/
        ├── latitude: 28.7041
        └── longitude: 77.1025
```

### SharedPreferences (Local Storage)

**File Name:** `UserPrefs`

| Key | Type | Purpose |
|-----|------|---------|
| `isLoggedIn` | Boolean | Track login state |
| `email` | String | Current user's email |
| `uid` | String | Firebase user ID |

---

## Permissions Used

| Permission | Purpose | When Used |
|------------|---------|-----------|
| `SEND_SMS` | Send emergency SMS | Shake/Voice triggers |
| `RECEIVE_SMS` | Receive messages | Background operation |
| `READ_SMS` | Read messages | Message verification |
| `CALL_PHONE` | Make emergency calls | Volume down / Voice |
| `ACCESS_FINE_LOCATION` | Precise GPS location | Emergency SMS |
| `ACCESS_COARSE_LOCATION` | Approximate location | Fallback |
| `INTERNET` | Firebase / Email | Always |
| `ACCESS_NETWORK_STATE` | Check connectivity | Before network ops |
| `VIBRATE` | Alert vibration | Emergency triggers |
| `RECORD_AUDIO` | Voice recognition | "HELP" detection |
| `RECEIVE_BOOT_COMPLETED` | Auto-start service | On device boot |

---

## API Integrations

### 1. Firebase Realtime Database
- **Purpose:** Store users, relatives, locations
- **Project ID:** `women-safety-7a024`

### 2. Google Maps API
- **Purpose:** Display maps, generate location links
- **Used in:** MapsActivity, Emergency SMS

### 3. Google Play Services Location
- **Purpose:** Get device GPS coordinates
- **Class:** `FusedLocationProviderClient`

### 4. JavaMail API (SMTP)
- **Purpose:** Send OTP verification emails
- **Server:** smtp.gmail.com:587
- **Sender:** womensafety06@gmail.com

### 5. YouTube Embed
- **Purpose:** Self-defense tutorial videos
- **Method:** WebView with iframe embed

---

## File Structure

```
app/
├── src/main/
│   ├── java/com/example/women_safety/
│   │   │
│   │   ├── Activities (Screens)
│   │   ├── Activity_splash.java      # Splash screen
│   │   ├── Activity_login.java       # Login
│   │   ├── Activity_register.java    # Registration
│   │   ├── Activty_verify_email.java # OTP verification
│   │   ├── Activity_home.java        # Main dashboard
│   │   ├── Activity_emergency.java   # Helpline numbers
│   │   ├── Activity_relatives.java   # Relatives menu
│   │   ├── Activity_add_relatives.java
│   │   ├── Activity_display_relatives.java
│   │   ├── Activity_update_relative.java
│   │   ├── Activity_selfdefence.java # Video tutorials
│   │   ├── Activity_profile.java     # User profile
│   │   ├── Activity_forgot_password.java
│   │   ├── Activity_new_password.java
│   │   ├── Activity_changed.java     # Success screen
│   │   ├── Activity_how.java         # Onboarding
│   │   ├── Activity_location.java    # OpenStreetMap
│   │   ├── Activity_parent.java      # Live tracking
│   │   ├── MapsActivity.java         # Google Maps
│   │   │
│   │   ├── Services
│   │   ├── LocationService.java      # Background location
│   │   ├── BackgroundService.java    # Foreground service
│   │   │
│   │   ├── Receivers
│   │   ├── BootReceiver.java         # Boot listener
│   │   ├── AlarmReceiver.java        # Alarm handler
│   │   │
│   │   ├── Adapters
│   │   ├── HelplineAdapter.java      # Helpline list
│   │   ├── VideoAdapter.java         # Video list
│   │   ├── OnboardingAdapter.java    # Onboarding pages
│   │   ├── HowToUseAdapter.java      # How-to fragments
│   │   │
│   │   ├── Models
│   │   ├── Model/User.java           # User data model
│   │   ├── LocationData.java         # Location model
│   │   ├── Helpline.java             # Helpline model
│   │   ├── OnboardingItem.java       # Onboarding model
│   │   │
│   │   ├── Fragments
│   │   ├── Screen1Fragment.java
│   │   ├── Screen2Fragment.java
│   │   │
│   │   └── Utilities
│   │       └── JavaMailAPI.java      # Email sender
│   │
│   ├── res/
│   │   ├── layout/                   # XML layouts
│   │   ├── drawable/                 # Images/icons
│   │   ├── raw/                      # Audio files (siren)
│   │   └── values/                   # Colors, strings
│   │
│   └── AndroidManifest.xml           # App config
│
└── google-services.json              # Firebase config
```

---

## How to Use the App

### First Time Setup
1. Install the app
2. Grant all required permissions (SMS, Call, Location, Microphone)
3. Register with email, phone, and primary emergency contact
4. Verify email with 6-digit OTP
5. Login to the app

### Adding Emergency Contacts
1. Go to "Relatives" from home screen
2. Tap "Add Relative"
3. Enter name, phone number, relationship
4. Save - they will now receive emergency SMS

### Using Emergency Features

| Emergency | Action |
|-----------|--------|
| **Shake Alert** | Shake phone vigorously for 1 second |
| **Voice Alert** | Say "HELP" loudly when app is open |
| **Silent Alert** | Hold volume down button for 1 second |
| **Manual Siren** | Toggle siren switch on home screen |

### What Happens in Emergency
1. Phone vibrates for 2 seconds
2. Loud siren alarm plays
3. SMS sent to ALL contacts with your exact location
4. Direct call made to your primary contact

---

## For Exhibition Demo

### Quick Demo Points

1. **Registration Flow**
   - Show email OTP verification
   - Explain Firebase data storage

2. **Shake Detection**
   - Demonstrate shaking phone
   - Show SMS sent to contacts
   - Play siren sound

3. **Voice Recognition**
   - Say "HELP" to trigger emergency
   - Show voice detection working

4. **Volume Button**
   - Long press volume down
   - Show emergency call initiation

5. **Contact Management**
   - Add a relative
   - Show in Firebase console
   - Delete/Update operations

6. **Background Location**
   - Show LocationService running
   - Display location in Firebase

7. **Helpline & Self-Defense**
   - Show emergency numbers
   - Play self-defense video

### Key Selling Points

1. **Multiple Trigger Methods** - Works in different scenarios
2. **Automatic Location Sharing** - No typing needed in emergency
3. **Background Tracking** - Family can monitor location
4. **Works Offline** - SMS works without internet
5. **Boot Persistence** - Auto-starts on phone restart

---

## Security Note

**Important:** This app stores passwords in plain text in Firebase. For production use, implement proper password hashing (bcrypt, Argon2) and consider using Firebase Authentication instead of custom auth.

---

## Credits

**Libraries Used:**
- Firebase Realtime Database
- Google Play Services Location
- Google Maps SDK
- Lottie Animation Library
- JavaMail API
- ViewPager2
- Material Design Components

---

## License

This project is for educational purposes.

---

*Built for Women Safety - Every woman deserves to feel safe.*
