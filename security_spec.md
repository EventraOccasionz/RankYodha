# Security Specification & "Dirty Dozen" Payloads (TDD)

## 1. Data Invariants
- **Identity Integrity**: Users can only read and write their own split-collection components (`/users/{userId}/private/info` and `/users/{userId}/attempts/{attemptId}`) and edit their own `/profiles/{userId}`.
- **Admin Control**: Only authenticated Admins can write (`create`, `update`, `delete`) to `/mockTests/{testId}`. Students are restricted to `get` and `list` operations on mock tests.
- **Immutability Protection**: Core system properties, such as `userId`, `createdAt`, and `testId` remain strictly immutable after initial creation.
- **Secure Timestamps**: Document timestamps (`updatedAt`, `createdAt`, `takenAt`) must conform to `request.time` (the secure firebase server timestamp) instead of client-side dates.
- **Key Enforcements**: Exact key count boundaries to ensure no extra "shadow fields" can be injected during operations.

---

## 2. The "Dirty Dozen" Payloads
The following payloads attempt to break the rules of Identity, Integrity, or State and must return `PERMISSION_DENIED`.

### Attempt 1: Unauthorized Student Profile Spoofing
- **Target**: `/profiles/target_user_id`
- **Method**: `create` by malicious user (`auth.uid = attacker_id`)
- **Payload**:
  ```json
  {
    "userId": "target_user_id",
    "name": "Attacker",
    "examCategory": "UPSC",
    "avatarUrl": "avatar_1",
    "totalTests": 0,
    "averageAccuracy": 100,
    "streakDays": 5,
    "predictedRank": 1,
    "updatedAt": "request.time"
  }
  ```
- **Vulnerability Blocked**: Identity spoofing. The document ID and `userId` field must match `request.auth.uid`.

### Attempt 2: Shadow Field Injection (Role Escalation)
- **Target**: `/profiles/my_user_id`
- **Method**: `update` by user (`auth.uid = my_user_id`)
- **Payload**:
  ```json
  {
    "userId": "my_user_id",
    "name": "My Name",
    "examCategory": "UPSC",
    "avatarUrl": "avatar_1",
    "totalTests": 1,
    "averageAccuracy": 80,
    "streakDays": 2,
    "predictedRank": 500,
    "role": "admin",
    "updatedAt": "request.time"
  }
  ```
- **Vulnerability Blocked**: Privilege Escalation. Attempting to update a profile and inject an unauthorized "role" backend field.

### Attempt 3: Cross-User Private Information Read
- **Target**: `/users/victim_user_id/private/info`
- **Method**: `get` / `read` by user (`auth.uid = attacker_id`)
- **Vulnerability Blocked**: Private PII leakage. Users can only access their own private information sub-collections.

### Attempt 4: Unauthenticated Profile Creation
- **Target**: `/profiles/any_user_id`
- **Method**: `create` with `auth = null`
- **Vulnerability Blocked**: Denial of Wallet & spam. Unauthenticated writes to profiles must be completely blocked.

### Attempt 5: Creating or Modifying Mock Test Papers as a Student
- **Target**: `/mockTests/russia_test_101`
- **Method**: `create` by user (`auth.uid = user_student_id`)
- **Payload**:
  ```json
  {
    "testId": "russia_test_101",
    "title": "Hacked UPSC Test",
    "category": "UPSC",
    "questionsCount": 1,
    "durationMinutes": 60,
    "difficulty": "Easy",
    "questions": [],
    "createdAt": "request.time"
  }
  ```
- **Vulnerability Blocked**: Unauthorized syllabus tampering. Only Firestore administrators can write mock tests.

### Attempt 6: Creating a Mock Test with Missing Required Keys
- **Target**: `/mockTests/admin_test_102`
- **Method**: `create` by admin (`auth.uid = admin_uid`)
- **Payload**:
  ```json
  {
    "testId": "admin_test_102",
    "title": "Incomplete test"
  }
  ```
- **Vulnerability Blocked**: Schema validation failure. Must contain all required keys specified in the blueprint.

### Attempt 7: Rogue Mock Test Attempt Creation for Another User
- **Target**: `/users/victim_uid/attempts/abc_attempt`
- **Method**: `create` by user (`auth.uid = attacker_id`)
- **Payload**:
  ```json
  {
    "attemptId": "abc_attempt",
    "userId": "victim_uid",
    "testId": "upsc_1",
    "testTitle": "UPSC Mock",
    "category": "UPSC",
    "scoreSecured": 200,
    "maxScorePossible": 200,
    "accuracyPercent": 100,
    "timeSpentSeconds": 10,
    "takenAt": "request.time"
  }
  ```
- **Vulnerability Blocked**: Identity Spoofing in attempts. One user cannot write history logs for another user.

### Attempt 8: Update Invariant Temporal Tampering
- **Target**: `/profiles/my_user_id`
- **Method**: `update` by user (`auth.uid = my_user_id`)
- **Payload**:
  ```json
  {
    "userId": "my_user_id",
    "name": "My Name",
    "examCategory": "UPSC",
    "avatarUrl": "avatar_1",
    "totalTests": 1,
    "averageAccuracy": 80,
    "streakDays": 2,
    "predictedRank": 500,
    "updatedAt": "2030-01-01T12:00:00Z"
  }
  ```
- **Vulnerability Blocked**: Client-side timestamp spoofing. `updatedAt` must exactly match the Firestore server time.

### Attempt 9: Mutating Immune Immutable Fields (createdAt tampering)
- **Target**: `/users/my_user_id/private/info`
- **Method**: `update` by user (`auth.uid = my_user_id`)
- **Payload**:
  ```json
  {
    "email": "my_new_email@example.com",
    "tier": "free",
    "createdAt": "2020-01-01T10:00:00Z"
  }
  ```
- **Vulnerability Blocked**: Immortality enforcement. `createdAt` must not change on updates.

### Attempt 10: Value Range Boundary Poisoning
- **Target**: `/profiles/my_user_id`
- **Method**: `update` by user (`auth.uid = my_user_id`)
- **Payload**:
  ```json
  {
    "userId": "my_user_id",
    "name": "A",
    "examCategory": "UPSC",
    "avatarUrl": "avatar_1",
    "totalTests": -999,
    "averageAccuracy": 5555.4,
    "streakDays": -5,
    "predictedRank": 0,
    "updatedAt": "request.time"
  }
  ```
- **Vulnerability Blocked**: Denials, buffer overflow, or garbage value poisoning. Ranges for scores, names, and counts must stay positive and within bounds.

### Attempt 11: Blank Document ID Poisoning (Injection Try)
- **Target**: `/profiles/../admins/attacker_id`
- **Method**: `create`
- **Vulnerability Blocked**: Path traversal and document ID poisoning. Standard Firestore rules block relative indicators.

### Attempt 12: Blank Reads on All Profiles
- **Target**: `/profiles` (Listing entire collection)
- **Method**: `list` / `read` by anonymous or non-signed-in users.
- **Vulnerability Blocked**: Privacy leaking. Listing student profiles is restricted to signed-in platform participants only.

---

## 3. Test Runner Design
A standard test simulation script in the frontend codebase will run checks verifying that all permission states return `true` for valid operations, and throw `PERMISSION_DENIED` errors for any of the Dirty Dozen attempts above.
