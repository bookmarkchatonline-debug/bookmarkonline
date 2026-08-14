# Bugfix Requirements Document

## Introduction

This document defines the requirements for fixing two critical issues in the music platform:

1. **Opportunities Loading Failure**: The public Opportunities page fails to load due to a field name mismatch between opportunity creation (using `active`) and the public query (using `isActive`).

2. **User Visibility Problem**: New users created with `role: 'artist'` may not appear immediately in public-facing queries (`getTopCreators`, `getAllArtists`) that filter by `where('role', '==', 'artist')`, despite being visible in the admin dashboard which queries all users without filters.

The root cause analysis shows:
- **Opportunities**: Admin creates opportunities with `active: true` (line 47 in `Opportunities.jsx`), but public page queries for `isActive: true`
- **Users**: Timing/consistency issue where Firestore queries may not immediately reflect newly created user documents, even though the role is correctly set during registration
- **Firebase Rules**: Confirmed NOT blocking reads (both collections have `allow read: if true`)

## Bug Analysis

### Current Behavior (Defect)

#### 1.1 Opportunity Creation Field Mismatch
1.1 WHEN an admin creates a new opportunity THEN the system writes the field `active: true` to Firestore

1.2 WHEN the public Opportunities page queries for opportunities THEN the system queries with `where('isActive', '==', true)` which does not match the stored field name

1.3 WHEN the field names don't match (`active` vs `isActive`) THEN the query returns zero results and the page displays an empty state or error

#### 1.2 Composite Index Mismatch
1.4 WHEN Firestore attempts to execute the query with `isActive` + `orderBy('deadline')` THEN it requires a composite index for `isActive` + `deadline`

1.5 WHEN the composite index exists for `isActive` + `deadline` but documents have the field `active` instead THEN the index cannot be utilized effectively and queries may fail

#### 1.3 User Visibility Timing Issue
1.6 WHEN a new user registers with `role: 'artist'` via `registerWithEmail` or `loginWithGoogle` THEN the document is written to Firestore with the correct role

1.7 WHEN public queries (`getTopCreators`, `getAllArtists`) immediately fetch users with `where('role', '==', 'artist')` THEN there may be a timing delay where newly created users are not yet reflected in query results

1.8 WHEN the admin dashboard queries all users without filters using `getDocs(collection(db, 'users'))` THEN newly created users appear immediately because no index lookup is required

### Expected Behavior (Correct)

#### 2.1 Consistent Opportunity Field Naming
2.1 WHEN an admin creates a new opportunity THEN the system SHALL write the field `isActive: true` to Firestore (matching the query field name)

2.2 WHEN the public Opportunities page queries for opportunities THEN the system SHALL successfully retrieve all opportunities where `isActive: true`

2.3 WHEN opportunities are created with the correct field name THEN the composite index for `isActive` + `deadline` SHALL be properly utilized

#### 2.2 Reliable User Visibility
2.4 WHEN a new user registers with `role: 'artist'` THEN the system SHALL ensure the user appears in public-facing queries that filter by role

2.5 WHEN existing opportunities in the database have the old field name `active` THEN the system SHALL handle the migration gracefully (either by updating existing documents or documenting manual migration steps)

### Unchanged Behavior (Regression Prevention)

#### 3.1 Admin Dashboard Functionality
3.1 WHEN an admin views the Users page THEN the system SHALL CONTINUE TO fetch all users without role filters

3.2 WHEN an admin views the Opportunities page THEN the system SHALL CONTINUE TO fetch all opportunities without active status filters

#### 3.2 Opportunity Display Logic
3.3 WHEN opportunities are displayed on the public page THEN the system SHALL CONTINUE TO show deadline countdown, urgency indicators, and submission buttons correctly

3.4 WHEN opportunities have optional fields (prize, requirements, link) THEN the system SHALL CONTINUE TO display them conditionally

#### 3.3 User Registration Flow
3.5 WHEN users register via email/password or Google OAuth THEN the system SHALL CONTINUE TO create user profiles with all required fields (username, email, avatarUrl, bio, role, plan, creatorLevel, stats)

3.6 WHEN user profiles are created THEN the system SHALL CONTINUE TO initialize stats with zeros and set creatorLevel to 'Rising Artist'

#### 3.4 Query Performance and Indexes
3.7 WHEN public pages query tracks by `isPublic` + `likes` or `isPublic` + `createdAt` THEN the system SHALL CONTINUE TO use existing composite indexes efficiently

3.8 WHEN users are queried by `role` + `stats.totalLikes` or `role` + `stats.weeklyLikes` THEN the system SHALL CONTINUE TO use existing composite indexes efficiently

#### 3.5 Firebase Security Rules
3.9 WHEN users or opportunities are queried from public pages THEN the system SHALL CONTINUE TO allow reads as per the existing rules (`allow read: if true`)

3.10 WHEN admins create opportunities THEN the system SHALL CONTINUE TO enforce admin-only write access as per existing rules
