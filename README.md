# ☪️ Zakat Tracker — Smart Islamic Finance Manager

**Zakat Tracker** is a comprehensive, modern, and privacy-focused mobile application designed to help Muslims calculate, track, and manage their Zakat obligations with precision and ease. Built with **React Native** and **Expo**, it combines real-time financial data with authentic Islamic jurisprudence (**Maliki Fiqh**) to ensure accurate calculations.

---

## 🌟 Key Features

### 1. 🪙 Real-Time Market Data
- **Live Gold & Silver Prices:** Fetches up-to-the-minute global spot prices for Gold (XAU) and Silver (XAG).
- **Currency Conversion:** Automatically converts prices from USD to **Moroccan Dirham (MAD)** using live exchange rates.
- **Manual Overrides:** Allows users to manually input exchange rates if preferred.

### 2. 🧮 Advanced Zakat Calculation
- **Nisab Calculation:** Automatically calculates the Nisab threshold based on:
  - **Gold (85g)**
  - **Silver (595g)** (Recommended for maximum benefit to the poor)
  - **Auto-Selection:** Intelligently highlights the relevant threshold.
- **Wealth Input:** Easy input for total Zakatable assets (cash, savings, gold, silver).
- **Instant Results:** Immediately displays:
  - Whether Zakat is due (✅ / ❌).
  - Exact Zakat amount (2.5%).
  - Remaining amount needed to reach Nisab (if not due).

### 3. 📅 Monthly Tracking & Progress
- **Monthly Sessions:** Automatically organizes wealth and payment records by month (e.g., "February 2026").
- **Payment Management:** 
  - Add partial Zakat payments throughout the month.
  - Edit or delete payment entries.
  - View a detailed list of all transactions.
- **Visual Progress:** A dynamic progress bar shows the percentage of Zakat paid vs. remaining balance.
- **History Archive:** Access past months' records to review historical Zakat payments and wealth status.

### 4. 📚 Islamic Educational Resources
- **Authentic Sources:** Features a curated collection of **Quranic verses** and **Hadiths** regarding charity and Zakat.
- **Fiqh Rules:** Displays key rules from the **Maliki Madhab** to educate users on the jurisprudence of Zakat.
- **Auto-Slider:** Beautifully animated slider presenting these quotes on the home screen.

### 5. 🌍 Localization & UI
- **Bilingual Support:** Full support for **Arabic (Right-to-Left)** and **English (Left-to-Right)**.
- **Modern Design:** 
  - Elegant Islamic aesthetic with a Green & Gold color palette.
  - Haptic feedback for interactions.
  - Smooth layout animations.
  - Responsive design that adapts to all phone sizes.

### 6. 🔒 Privacy First
- **Local Storage:** All financial data, history, and preferences are stored securely on the device using `AsyncStorage`.
- **No Cloud Sync:** Your sensitive financial data never leaves your phone.

---

## 📱 User Interface Highlights

*   **Home Dashboard:** Central hub for prices, calculation, and current month's tracking.
*   **Wealth Details Modal:** Manage specific wealth entries (Cash, Bank, Gold, etc.).
*   **Payment Modal:** Quick interface to log Zakat payments.
*   **History Screen:** A calendar-based view to navigate through past months and years.
*   **App Guide:** Interactive tutorial overlay for new users.

---

## 🛠️ Technical Stack

*   **Framework:** [React Native](https://reactnative.dev/) (Expo SDK 52)
*   **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useCallback`) & Custom Hooks.
*   **Storage:** `@react-native-async-storage/async-storage`
*   **Animations:** React Native `Animated` & `LayoutAnimation`.
*   **UX Enhancements:** `expo-haptics` for tactile feedback.
*   **Build Tool:** Expo Application Services (**EAS**) for APK generation.

---

## 🚀 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd zakat-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the app:**
    ```bash
    npx expo start
    ```

4.  **Run on Device:**
    *   Scan the QR code with the **Expo Go** app (Android/iOS).
    *   Or run on an emulator: press `a` for Android, `i` for iOS.

---

## 📦 Building the APK (Android)

To generate an installable APK file for Android devices:

1.  Install EAS CLI:
    ```bash
    npm install -g eas-cli
    ```
2.  Login to Expo:
    ```bash
    eas login
    ```
3.  Build the APK:
    ```bash
    eas build --platform android --profile preview
    ```

---

## 👥 Credits & Development

Developed with ❤️ by:
*   **Adil Chagri**
*   **Chouaib Jbel**
*   **Amine Bazaoui**

---

*“Take, [O, Muhammad], from their wealth a charity by which you purify them and cause them increase.”* (At-Tawbah: 103)