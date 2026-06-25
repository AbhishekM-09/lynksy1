# SECURITY DEFINITIONS & AUDIT PROFILE (security_spec.md)

This specification defines the strict security postures and invariants designed to safeguard Lynksy against Identity Spoofing, Privilege Escalation, State Shortcutting, and Resource Poisoning. It has been compiled in accordance with Enterprise-Grade SaaS policies modeled after Stripe and Shopify.

---

## 1. Data Invariants & Zero-Trust Assertions

1. **Plan & Role Isolation**: No client-side SDK update of `/users/{uid}` can modify fields associated with payment premium plans (`plan`, `planType`, `planStartedAt`, `planExpiresAt`, `subscriptionStatus`, `isVerified`).
2. **Deterministic Creation**: Creation of an initial User account must strictly enforce that the plan field value matches `FREE` with `subscriptionStatus == 'INACTIVE'`.
3. **Identity Completeness (Relational Owners)**: Under `/users/{uid}/links/{linkId}`, links can only be written by the authenticated owner (`uid == request.auth.uid`). No member can add links on another creator's profile page.
4. **Subscription Locking**: Subscriptions under `/subscriptions/{uid}` and payment Receipts under `/payment_history/{payId}` must be completely immutable to standard client-side writes. They can only be activated after formal backend signature validation.
5. **Short-Link Integrity**: General visitors cannot modify shortened link targets (`originalUrl` or `userId`) during an analytics click event increment. The `update` rules must enforce strict `affectedKeys().hasOnly()` controls.
6. **Unified DNS Map Owners**: Only the owner of `/customDomains/{domain}` can claim or verify mappings.
7. **Order Authenticity**: Buyer email and product mapping properties on global orders under `/orders/{orderId}` must resist self-allocation or credential injection from unrelated third-parties.
8. **Admin Operations Barrier**: All routes under `/adminLogs` are strictly disabled except under verified Admin credentials.
9. **Email verified restriction**: Standard writes require `request.auth.token.email_verified == true` to prevent unverified email shadow registration attacks from claiming admin/owner resources.

---

## 2. The "Dirty Dozen" Payloads

These 12 payloads are designed to attempt exploits against Lynksy. The generated security rules are verified to strictly reject all 12 of these malicious writes with `PERMISSION_DENIED`.

### Attack 1: User Self-Upgrade (Privilege Escalation)
Attempt to write `plan` to `PRO_PLUS` directly from client-side Firestore.
```json
// Path: /users/att_user_123
{
  "uid": "att_user_123",
  "username": "attacker",
  "plan": "PRO_PLUS",
  "subscriptionStatus": "ACTIVE"
}
```

### Attack 2: User Pre-Registration Privilege Assignment
Attempt to register a user with pre-assigned `PRO` plan.
```json
// Path: /users/att_user_123 (on CREATE)
{
  "uid": "att_user_123",
  "username": "attacker",
  "plan": "PRO",
  "subscriptionStatus": "ACTIVE"
}
```

### Attack 3: Shadow Update of customDomain (Spoofing)
Attempt to hijack a custom domain owned by a premium user.
```json
// Path: /customDomains/premiumdomain.com (on UPDATE)
{
  "userId": "att_user_123",
  "username": "attacker",
  "domain": "premiumdomain.com",
  "verified": true,
  "sslEnabled": true
}
```

### Attack 4: Self-Settled Payout Approval
Attempt to mark a pending payout request as `PAID` from the creator's client SDK.
```json
// Path: /payouts/att_user_123 (on UPDATE)
{
  "status": "PAID",
  "pendingAmount": 0,
  "paidAmount": 100000
}
```

### Attack 5: Short Link Destination Redirection Hijack
Attempt to redirect a popular shortened link to an exploit landing page under the guise of an analytics tick count update.
```json
// Path: /short_links/popular_lnk_123 (on UPDATE with hasAny payload)
{
  "clicks": 1500,
  "originalUrl": "https://malicious-exploit-endpoint.xyz"
}
```

### Attack 6: Artificial Sales Boost (Resource Poisoning)
Attempt to corrupt product statistics to gain false standing in search/market categories.
```json
// Path: /users/victim_123/products/prod_123 (on UPDATE by non-owner)
{
  "totalSales": 99999,
  "totalRevenue": 4000000
}
```

### Attack 7: Fake Email Subscriber Registration
Attempt to insert high-limit spam records into other creators' lists.
```json
// Path: /emailSubscribers/subscriber_123 (on CREATE)
{
  "creatorId": "victim_uid_123",
  "creatorUsername": "victim",
  "email": "injected_spam_bot@badsite.com"
}
```

### Attack 8: Unverified Email Admin Spoofing
Attempt to register with unverified email addresses matching the bootstrap admin to climb privilege structures.
```json
// Path: /adminLogs/log_123 (on CREATE with request.auth.token.email = abhimattikopp9845@gmail.com, email_verified = false)
{
  "adminId": "att_user_123",
  "adminEmail": "abhimattikopp9845@gmail.com",
  "action": "CONFIG_PURGE",
  "timestamp": "request.time"
}
```

### Attack 9: Subscription Creation Loophole
Attempt to insert a direct premium subscription document into the global status database.
```json
// Path: /subscriptions/att_user_123 (on CREATE)
{
  "userId": "att_user_123",
  "plan": "PRO_PLUS",
  "status": "ACTIVE",
  "subscriptionStatus": "ACTIVE"
}
```

### Attack 10: Mock Payment Receipt Insertion
Attempt to store an artificial payment receipt directly to bypass Razorpay requirements.
```json
// Path: /payment_history/receipt_123 (on CREATE)
{
  "userId": "att_user_123",
  "email": "attacker@gmail.com",
  "amountPaid": 399,
  "planPurchased": "PRO_PLUS",
  "paymentId": "pay_fake_signature_123",
  "status": "SUCCESS"
}
```

### Attack 11: Artificial Page View Spoofing
Attempt to corrupt analytics aggregate charts directly to show infinite fake traffic.
```json
// Path: /analytics/victim_123/daily/2026-06-14 (on UPDATE with extra keys)
{
  "views": 10000000,
  "dangerousInjectedConfig": "RESET_SYSTEM"
}
```

### Attack 12: Administrative Audit Clean Up
Attempt to delete or purge the global admin log list records.
```json
// Path: /adminLogs/log_345 (on DELETE by non-admin)
{
  "id": "log_345"
}
```

---

## 3. Test Runner (firestore.rules.test.ts)

Below is the complete testing suite designed to assert that all above penetration payloads return `PERMISSION_DENIED` under zero-trust matching.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

describe('Lynksy Zero-Trust Hardening Audits', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'ai-studio-35bf3302-ccdf-478f-8ee1-3788932b6732',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('blocks Attack 1: User self-upgrade client-side write', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'attacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();
    
    // Attempt direct upgrade on existing profile
    await assertFails(
      db.doc('users/att_user_123').update({
        plan: 'PRO_PLUS'
      })
    );
  });

  it('blocks Attack 2: User creation with pre-assigned PRO plan', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'attacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();

    await assertFails(
      db.doc('users/att_user_123').set({
        uid: 'att_user_123',
        username: 'attacker',
        plan: 'PRO'
      })
    );
  });

  it('blocks Attack 3: Spoofing domain mapping from non-owner account', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'attacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();

    await assertFails(
      db.doc('customDomains/premiumdomain.com').update({
        userId: 'att_user_123',
        username: 'attacker'
      })
    );
  });

  it('blocks Attack 4: Self payout status update to PAID', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'attacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();

    await assertFails(
      db.doc('payouts/att_user_123').update({
        status: 'PAID'
      })
    );
  });

  it('blocks Attack 5: Exploiting click analytics to redirect short links (Attack Hijack)', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();

    await assertFails(
      db.doc('short_links/popular_lnk_123').update({
        clicks: 1500,
        originalUrl: 'https://malicious-exploit-endpoint.xyz'
      })
    );
  });

  it('blocks Attack 6: Unauthenticated product stats manipulation', async () => {
    const context = testEnv.authenticatedContext('third_party_456', {
      email: 'hacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();

    await assertFails(
      db.doc('users/victim_123/products/prod_123').update({
        totalSales: 99999,
        totalRevenue: 4000000
      })
    );
  });

  it('blocks Attack 7: Fake email subscription insertions', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();

    await assertFails(
      db.doc('emailSubscribers/subscriber_123').set({
        creatorId: 'victim_uid_123',
        creatorUsername: 'victim',
        email: 'injected_spam_bot@badsite.com'
      })
    );
  });

  it('blocks Attack 8: Unverified email attempt to spoof admin logs', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'abhimattikopp9845@gmail.com',
      email_verified: false
    });
    const db = context.firestore();

    await assertFails(
      db.doc('adminLogs/log_123').set({
        adminId: 'att_user_123',
        adminEmail: 'abhimattikopp9845@gmail.com',
        action: 'CONFIG_PURGE'
      })
    );
  });

  it('blocks Attack 9: Self premium subscription creation bypassing payment', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'attacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();

    await assertFails(
      db.doc('subscriptions/att_user_123').set({
        userId: 'att_user_123',
        plan: 'PRO_PLUS',
        status: 'ACTIVE'
      })
    );
  });

  it('blocks Attack 10: Client direct receipt injection attempt', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'attacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();

    await assertFails(
      db.doc('payment_history/receipt_123').set({
        userId: 'att_user_123',
        amountPaid: 399,
        planPurchased: 'PRO_PLUS'
      })
    );
  });

  it('blocks Attack 11: Artificial Daily aggregate poisoning', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();

    await assertFails(
      db.doc('analytics/victim_123/daily/2026-06-14').set({
        views: 10000000,
        dangerousInjectedConfig: 'RESET_SYSTEM'
      })
    );
  });

  it('blocks Attack 12: Standard user attempting log deletion', async () => {
    const context = testEnv.authenticatedContext('att_user_123', {
      email: 'attacker@gmail.com',
      email_verified: true
    });
    const db = context.firestore();

    await assertFails(
      db.doc('adminLogs/log_345').delete()
    );
  });
});
```
