# Live Commerce Hub

# 📘 SELLER PLATFORM – DETAILED FUNCTIONAL DESCRIPTION

This platform is designed to allow individuals or shop owners to **sell products through live sales, live auctions, and gallery listings**, while managing orders, inventory, analytics, and communication with buyers in one unified system.

The platform follows a **step-by-step onboarding flow**, ensuring sellers understand how the platform works, agree to terms, and securely create their accounts before accessing the seller dashboard.

---

## 🎨 DESIGN & EXPERIENCE OVERVIEW

The application uses a **dark-themed, premium interface** built with:

* **Black** as the base color (trust, seriousness)
* **Sea Green** for warmth and stability
* **Brown** as the accent (growth, action, success)

The interface is highly **interactive**, with smooth page transitions, animated buttons, hover effects, and real-time feedback.
Every action (save, submit, update, go live) gives visual confirmation to the user.

---

## 🟢 LANDING PAGE (ENTRY POINT)

The first page is intentionally **simple and distraction-free**.

### Purpose:

* Encourage sellers to start onboarding immediately.

### Elements:

* A single central button: **“Become a Seller”**
* No extra text or clutter
* Button includes animation to attract attention

Clicking the button smoothly moves the user to the next page.

---

## 🟢 HOW THE PLATFORM WORKS + FAQ PAGE

### Purpose:

* Educate sellers on **how they can earn money**
* Build confidence before registration

### Content Explanation:

Sellers are shown:

* How live sales allow real-time selling
* How auctions increase product value
* How gallery items can be sold without going live
* How buyer communication helps close sales faster

### FAQ Section:

Common doubts are answered here, such as:

* Payment timelines
* GST requirements
* Cancellation policies
* Whether live selling is mandatory

This page removes confusion and prepares users for commitment.

---

## 🟢 TERMS & CONDITIONS PAGE

### Purpose:

* Legal acknowledgment
* Transparency about platform rules

### Key Points Explained:

* Seller must pay **8% commission** to the platform
* Fraud, fake listings, or misuse is strictly prohibited
* Violation can result in account suspension or legal action

### Important Rule:

The **Continue button remains disabled** until the seller checks:

> “I have read and agree to the Terms & Conditions”

This ensures legal compliance.

---

## 🟢 AUTHENTICATION & ACCOUNT CREATION

### Purpose:

* Secure onboarding
* Identity verification

The seller can either **Log In** or **Sign Up**.

---

### 🔐 SIGN-UP FLOW (IN DETAIL)

#### Step 1: Personal Information

The seller provides:

* Full name
* Gender
* Age
* Aadhaar number (validated)
* Residential address

This ensures identity authenticity.

---

#### Step 2: Shop Information (Same Screen)

* Shop name
* GST number (optional)
* Shop address

A checkbox allows:

> “Same as personal address”

When selected, the shop address is automatically filled.

---

#### Step 3: Account Credentials

* Email address
* Password

### Security Feature:

A **unique alphanumeric security code** is auto-generated at signup.

* Shown only once
* Required during first login
* Acts as an extra protection layer

If forgotten, the seller can recover it via email.

---

## 🟢 BUSINESS PROFILE DETAILS

### Purpose:

* Understand seller background
* Improve platform personalization

Sellers specify:

* Whether they are new or experienced
* Optional social media IDs (Instagram, Facebook, Twitter)

This step is optional and skippable.

---

## 🟢 CATEGORY & SUB-CATEGORY SELECTION

### Purpose:

* Define what the seller intends to sell

### Functionality:

* Search-based category selection
* Predefined common categories
* Multiple categories allowed
* Sub-categories optional

If a suitable category is missing, sellers can:

* Select “Other”
* Enter a custom category or sub-category

---

# 🏠 SELLER DASHBOARD (CORE SYSTEM)

Once onboarding is complete, the seller reaches the **home dashboard**, which acts as the control center.

---

## 🔹 NAVIGATION BAR (LEFT SIDE)

The sidebar provides quick access to:

* Overview
* Create Listing
* Orders Detail
* Items
* Analysis
* Settings

Transitions between sections are smooth and animated.

---

## 🔹 OVERVIEW PAGE

### Purpose:

* Quick performance snapshot

### Displays:

* Pending orders count
* Active listings count
* Active bid count

### Live Listings Panel:

Each live session shows:

* Title
* Live duration (real-time)
* Number of viewers
* Buttons to:

  * Edit
  * View
  * Start / Stop live

This gives sellers full live-session control.

---

## 🔹 CREATE LISTING PAGE

### Purpose:

* Create live auctions or sales

### Flow:

1. Choose **Auction** or **Sale**
2. Select category/sub-category
3. Enter title and description
4. Upload thumbnail (optional)
5. Set start date and time

Each listing gets a **unique alphanumeric ID**.

Sellers can:

* Save as draft
* Go live instantly

---

## 🔹 ORDERS DETAIL PAGE

### Purpose:

* Manage buyer orders efficiently

### Search & Filter Options:

Orders can be searched using:

* Order ID
* Auction ID
* Date range
* Amount range

### Order Information:

* Buyer name
* Order date
* Order source (Bid or Gallery)

### Seller Actions:

* Chat with buyers
* Update order status
* Bulk update multiple orders
* Add expected delivery date

---

## 🔹 ITEMS (INVENTORY MANAGEMENT)

### Purpose:

* Manage gallery items

### Features:

* Create item galleries
* Upload multiple images per item
* Define quantity and description
* Select category/sub-category

### Variants & Dimensions:

* Predefined lists for:

  * Dimensions (length, weight, volume)
  * Variants (color, size)
* Custom entries allowed if not listed

### Stock Logic:

* Quantity auto-reduces on purchase
* When quantity reaches zero → item becomes **Out of Stock**

---

## 🔹 ANALYSIS PAGE

### Purpose:

* Business insights

### Analytics Provided:

* Hourly
* Daily
* Weekly
* Monthly
* Yearly performance

### Metrics:

* Items sold
* Revenue trends

Sellers can switch between **Auction** and **Sales** data.

---

## 🔹 SETTINGS PAGE

### Purpose:

* Account control

### Options:

* Edit personal details
* Edit shop details
* Manage notifications
* Save changes only when modified
* Secure sign-out

---

## 🧠 OVERALL SYSTEM BEHAVIOR

* Every button works without failure
* No broken links or dead screens
* Real-time updates where required
* Data remains consistent across modules
* Secure, scalable, production-ready

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mercexseller.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0d363024-4a2b-4739-9d94-2e2dcb51e135).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
