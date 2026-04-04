# CibiNet SSDS — Mermaid Diagrams

This file contains all Mermaid JS diagrams for the CibiNet Software System Design Specification (SSDS-002). Each diagram includes its unique ID, the SSDS section it belongs to, and a placement description. When finalizing the document in Word/Google Docs, embed the rendered diagram image at the indicated location.

---

## COLLAB-01 — System Collaboration Diagram: Donation Claiming Flow

**Belongs in:** Section 10 — System-Wide Design Decisions (opening paragraph, before 10.1)
**Placement:** Insert as "Figure 10.0 — System Collaboration Diagram: Donation Claiming Flow"
**Description:** Shows the object-level collaboration for the primary system flow — a Recipient claiming a donation. Objects are shown with their class names (instance:Class). Numbered messages show execution order. This is the most representative cross-component interaction in CibiNet.

```mermaid
graph LR
    RB([":Recipient Browser"])
    LC["aListingController\n:ListingController"]
    LM["aListing\n:Listing"]
    CM["aClaim\n:Claim"]
    NC["aNotificationController\n:NotificationController"]
    NM["aNotification\n:Notification"]
    AL["anAuditLog\n:AuditLog"]

    RB -->|"1: GET /api/listings/claim\n?listing_id&logistics_type"| LC
    LC -->|"2: query Listing WHERE status='available'"| LM
    LM -->|"3: return listing object"| LC
    LC -->|"4: listing.status = 'claimed'"| LM
    LC -->|"5: add new_claim; flush()"| CM
    CM -->|"6: claim_id assigned"| LC
    LC -->|"7: dispatch_claim_notifications()"| NC
    NC -->|"8: add donor_notification"| NM
    NC -->|"9: add recipient_notification"| NM
    LC -->|"10: add AuditLog(listing_claimed)"| AL
    LC -->|"11: commit()"| LM
    LC -->|"12: return coordination_id + logistics_packet"| RB
```

---

## ARCH-01 — Component Architecture Diagram

**Belongs in:** Section 10.1 — Software Component Architectural Design
**Placement:** Insert as "Figure 10.1 — CibiNet Component Architecture"
**Description:** Decomposition of CibiNet into its primary components across three layers (Frontend, Backend, Data) plus external integrations. Arrows show dependency direction. The Frontend communicates exclusively through the API client. The Background Scheduler is a daemon thread inside the WSGI process.

```mermaid
graph TB
    subgraph Frontend["Frontend Component (React/Vite :3000)"]
        AC["AuthContext.tsx\n(auth state + RBAC)"]
        MV["MapView\n(discovery UI)"]
        LF["ListingForm\n(donor create/edit)"]
        CUI["Claim UI\n(claim action)"]
        NUI["Notification UI\n(notification feed)"]
        CLI["api/client.ts\n(HTTP API client)"]
    end

    subgraph Backend["Backend Component (TurboGears WSGI :8080)"]
        RC["RootController"]
        APC["ApiController"]
        AUTH["AuthController\n(login, register, logout, check_status)"]
        LIST["ListingController\n(nearby, create, claim, update, delete, detail)"]
        CLAIM["ClaimController\n(mine, view)"]
        NOTIF["NotificationController\n(mine, mark_read, mark_all_read, unread_count)"]
        SYS["SystemController\n(cleanup, audit_log)"]
        USR["UserController\n(me, my_listings)"]
        SCHED["cleanup_scheduler()\nBackground Daemon Thread\nevery 300s"]
    end

    subgraph Data["Data Layer (SQLAlchemy + SQLite)"]
        SCH["schemas.py\n(sole response serializers)"]
        DB[("cibinet_dev.db\nSQLite")]
        UM["User Model"]
        LM["Listing Model"]
        CM["Claim Model"]
        NM["Notification Model"]
        ALM["AuditLog Model"]
    end

    subgraph External["External Services"]
        GEO["Nominatim Geocoding API\n(address → lat/lon, no API key)"]
        EMAIL["Email Gateway\n(SMTP — future implementation)"]
    end

    CLI --> APC
    RC --> APC
    APC --> AUTH
    APC --> LIST
    APC --> CLAIM
    APC --> NOTIF
    APC --> SYS
    APC --> USR
    SCHED -->|"calls run_cleanup() every 300s"| SYS

    AUTH --> UM
    LIST --> LM
    LIST --> CM
    LIST --> NM
    LIST --> ALM
    CLAIM --> CM
    NOTIF --> NM
    SYS --> ALM
    SYS --> LM
    USR --> UM

    LIST -->|"geocode_address()"| GEO
    NOTIF -.->|"future SMTP"| EMAIL

    UM & LM & CM & NM & ALM --> DB
    AUTH & LIST & CLAIM & NOTIF & SYS & USR --> SCH
```

---

## CLASS-01 — AuthComponent Class Diagram

**Belongs in:** Section 11.1.1 — Software Unit Detailed Design (AuthComponent subsection)
**Placement:** Insert as "Figure 11.1.1-A — AuthComponent Class Diagram"
**Description:** Shows AuthController's dependencies: it reads/writes tg_session (interface), queries the User model, and serializes responses through UserSchema. Browser is the boundary class.

```mermaid
classDiagram
    class Browser {
        <<boundary>>
        +POST /api/auth/login()
        +POST /api/auth/register()
        +GET /api/auth/logout()
        +GET /api/auth/check_status()
    }

    class AuthController {
        +login(email, password) dict
        +register(email, password, role) dict
        +logout() dict
        +check_status() dict
    }

    class User {
        +user_id : Integer
        +email : String(255)
        +password_hash : Text
        +role : String(20)
        +created_at : DateTime
    }

    class UserSchema {
        <<schema>>
        -user_id : int
        -email : str
        -role : str
        -created_at : str
        +to_dict() dict
    }

    class tg_session {
        <<interface>>
        +user_id : int
        +user_role : str
        +save()
        +invalidate()
    }

    Browser --> AuthController : HTTP request
    AuthController --> User : query / add
    AuthController --> UserSchema : constructs
    AuthController --> tg_session : reads / writes
    UserSchema --> User : wraps
```

---

## CLASS-02 — ListingComponent Class Diagram

**Belongs in:** Section 11.1.1 — Software Unit Detailed Design (ListingComponent subsection)
**Placement:** Insert as "Figure 11.1.1-B — ListingComponent Class Diagram"
**Description:** The largest component. ListingController handles all listing and claim operations. Three schemas serve different response shapes. geocode_address() is a module-level utility function.

```mermaid
classDiagram
    class ListingController {
        +nearby(lat, lon, radius, food_type) dict
        +claim(listing_id, logistics_type) dict
        +create(**kwargs) dict
        +detail(listing_id) dict
        +update(**kwargs) dict
        +delete(listing_id) dict
    }

    class Listing {
        +listing_id : Integer
        +donor_id : Integer
        +food_type : String(100)
        +quantity : String(100)
        +status : String(20)
        +expiry_time : DateTime
        +latitude : Numeric(9,6)
        +longitude : Numeric(9,6)
        +address_text : Text
        +image_filename : String(255)
    }

    class Claim {
        +claim_id : Integer
        +listing_id : Integer
        +recipient_id : Integer
        +logistics_type : String(50)
        +external_ref_id : String(100)
        +safety_ack_received : Boolean
        +claimed_at : DateTime
    }

    class ListingMapSchema {
        <<schema — NFR-03: no address>>
        -listing_id : int
        -food_type : str
        -quantity : str
        -lat : float
        -lon : float
        -expiry_time : str
        -image_url : str
        +to_dict() dict
    }

    class ListingSchema {
        <<schema — full detail>>
        -listing_id : int
        -food_type : str
        -quantity : str
        -status : str
        -address_text : str
        -expiry_time : str
        -image_url : str
        +to_dict() dict
    }

    class LogisticsPacketSchema {
        <<schema — FR-04 handoff>>
        -address : str
        -lat : float
        -lon : float
        -logistics_type : str
        +to_dict() dict
    }

    class geocode_address {
        <<utility function>>
        +geocode_address(address_text) tuple
    }

    ListingController --> Listing : query / add / update / delete
    ListingController --> Claim : add / flush
    ListingController --> ListingMapSchema : uses in nearby()
    ListingController --> ListingSchema : uses in detail()
    ListingController --> LogisticsPacketSchema : uses in claim()
    ListingController --> geocode_address : calls in create() and update()
    ListingMapSchema --> Listing : wraps (lat/lon only)
    ListingSchema --> Listing : wraps (full)
    LogisticsPacketSchema --> Listing : wraps (coords + address)
```

---

## CLASS-03 — NotificationComponent Class Diagram

**Belongs in:** Section 11.1.1 — Software Unit Detailed Design (NotificationComponent subsection)
**Placement:** Insert as "Figure 11.1.1-C — NotificationComponent Class Diagram"
**Description:** dispatch_claim_notifications() is a module-level function called by ListingController. NotificationController handles read-state management. All responses go through NotificationSchema.

```mermaid
classDiagram
    class dispatch_claim_notifications {
        <<module function>>
        +dispatch(claim, listing, donor, recipient) void
    }

    class NotificationController {
        +mine() dict
        +mark_read(notification_id) dict
        +mark_all_read() dict
        +unread_count() dict
    }

    class Notification {
        +notification_id : Integer
        +user_id : Integer
        +type : String(50)
        +message_body : Text
        +is_read : Boolean
        +sent_at : DateTime
    }

    class NotificationSchema {
        <<schema>>
        -notification_id : int
        -type : str
        -message_body : str
        -is_read : bool
        -sent_at : str
        +to_dict() dict
    }

    dispatch_claim_notifications --> Notification : add x2 (donor + recipient)
    NotificationController --> Notification : query / update
    NotificationController --> NotificationSchema : uses
    NotificationSchema --> Notification : wraps
```

---

## CLASS-04 — SystemComponent Class Diagram

**Belongs in:** Section 11.1.1 — Software Unit Detailed Design (SystemComponent subsection)
**Placement:** Insert as "Figure 11.1.1-D — SystemComponent Class Diagram"
**Description:** run_cleanup() uses an isolated SQLAlchemy session (thread-safe). cleanup_scheduler() is the daemon thread entry point. SystemController exposes manual triggers.

```mermaid
classDiagram
    class cleanup_scheduler {
        <<daemon thread function>>
        +cleanup_scheduler() void
        -interval : 300s
    }

    class run_cleanup {
        <<module function>>
        +run_cleanup() int
        -uses: isolated Session()
    }

    class SystemController {
        +cleanup() dict
        +audit_log(limit) dict
    }

    class AuditLog {
        +log_id : Integer
        +user_id : Integer
        +action : String(100)
        +entity_type : String(50)
        +entity_id : Integer
        +timestamp : DateTime
    }

    class AuditLogSchema {
        <<schema>>
        -log_id : int
        -user_id : int
        -action : str
        -entity_type : str
        -entity_id : int
        -timestamp : str
        +to_dict() dict
    }

    class Listing {
        +status : String(20)
        +expiry_time : DateTime
    }

    cleanup_scheduler --> run_cleanup : calls every 300s
    SystemController --> run_cleanup : calls (manual /api/system/cleanup)
    run_cleanup --> Listing : query + set status='expired'
    run_cleanup --> AuditLog : add per expired listing
    SystemController --> AuditLog : query for audit_log()
    SystemController --> AuditLogSchema : uses
    AuditLogSchema --> AuditLog : wraps
```

---

## SEQ-01 — Sequence Diagram: UC01 User Authentication

**Belongs in:** Section 11.3.1 — Sequence Diagrams (first diagram)
**Placement:** Insert as "Figure 11.3.1-A — Sequence Diagram: UC01 User Authentication"
**Description:** Login flow from browser through AuthController. Password is SHA-256 hashed client-side before comparison. Session cookie is set on success. Interface classes (Browser, tg_session) appear on the sequence.

```mermaid
sequenceDiagram
    actor User as :Donor or Recipient Browser
    participant UI as :Web UI (AuthContext)
    participant AC as :AuthController
    participant DB as :User (SQLite)
    participant S as :tg_session

    User->>UI: Enter email + password, click Login
    UI->>AC: POST /api/auth/login(email, password)
    AC->>AC: SHA-256 hash(password)
    AC->>DB: query(User).filter_by(email, password_hash)
    alt Valid credentials
        DB-->>AC: user object
        AC->>S: session['user_id'] = user.user_id
        AC->>S: session['user_role'] = user.role
        AC->>S: session.save()
        AC-->>UI: HTTP 200 {status: "success", user: UserSchema}
        UI-->>User: Redirect to role dashboard
    else Invalid credentials
        DB-->>AC: None
        AC-->>UI: HTTP 401 {error: "Invalid credentials"}
        UI-->>User: Display error message
    end
```

---

## SEQ-02 — Sequence Diagram: UC02 Post Surplus Food

**Belongs in:** Section 11.3.1 — Sequence Diagrams
**Placement:** Insert as "Figure 11.3.1-B — Sequence Diagram: UC02 Post Surplus Food"
**Description:** Donor creates a listing. Geocoding contacts Nominatim; on failure, a default NYC coordinate is used. session.flush() assigns listing_id before the AuditLog is written.

```mermaid
sequenceDiagram
    actor Donor as :Donor Browser
    participant UI as :Web UI (ListingForm)
    participant LC as :ListingController
    participant GEO as :Nominatim Geocoding API
    participant LM as :Listing (SQLite)
    participant AL as :AuditLog (SQLite)

    Donor->>UI: Submit form (food_type, quantity, address_text, hours_until_expiry, image)
    UI->>LC: POST /api/listings/create(kwargs)
    LC->>LC: Check tg_session role == 'Donor'
    LC->>LC: Validate food_type, quantity, address_text present
    LC->>GEO: geocode_address(address_text)
    alt Geocoding succeeds
        GEO-->>LC: (lat, lon)
    else Geocoding fails / timeout
        GEO-->>LC: Exception caught
        LC->>LC: default lat=40.7128, lon=-74.0060
    end
    LC->>LC: expiry_dt = utcnow + timedelta(hours)
    LC->>LC: save_upload(image) → image_filename
    LC->>LM: add(new_listing); flush()
    LM-->>LC: listing_id assigned
    LC->>AL: add(AuditLog action='listing_created', entity_id=listing_id)
    LC->>LM: commit()
    LC-->>UI: HTTP 200 {status: "success", listing_id, expires_at}
    UI-->>Donor: Display success confirmation
```

---

## SEQ-03 — Sequence Diagram: UC03 Geographic Discovery

**Belongs in:** Section 11.3.1 — Sequence Diagrams
**Placement:** Insert as "Figure 11.3.1-C — Sequence Diagram: UC03 Geographic Discovery"
**Description:** Recipient queries available listings using a bounding-box calculation (radius/111 degrees per km). ListingMapSchema deliberately omits address_text (NFR-03). Results return within 3 seconds (NFR-01).

```mermaid
sequenceDiagram
    actor Recipient as :Recipient Browser
    participant UI as :Map View
    participant LC as :ListingController
    participant LM as :Listing (SQLite)

    Recipient->>UI: Open map, enter location / use geolocation
    UI->>LC: GET /api/listings/nearby?lat&lon&radius&food_type
    LC->>LC: Check tg_session role == 'Recipient'
    LC->>LC: delta = float(radius) / 111.0
    LC->>LM: query(Listing).filter(status='available', expiry_time > now, lat/lon within delta, food_type ILIKE)
    LM-->>LC: List of matching Listing objects
    LC->>LC: Serialize each with ListingMapSchema (no address_text)
    LC-->>UI: HTTP 200 {listings: [{id, food, quantity, lat, lon, expiry_time}, ...]}
    UI-->>Recipient: Render map pins (addresses hidden)
    alt No listings in radius
        UI-->>Recipient: "No listings found — try expanding your search radius"
    end
```

---

## SEQ-04 — Sequence Diagram: UC04 Initiate Logistics Handoff

**Belongs in:** Section 11.3.1 — Sequence Diagrams
**Placement:** Insert as "Figure 11.3.1-D — Sequence Diagram: UC04 Logistics Handoff"
**Description:** Triggered as the final return step within UC05. After a successful claim commit, the system generates a LogisticsPacket exposing full address and coordinates. For third_party logistics_type, this packet is intended for forwarding to an external delivery API.

```mermaid
sequenceDiagram
    participant LC as :ListingController
    participant LM as :Listing (SQLite)
    participant LPS as :LogisticsPacketSchema
    actor Recipient as :Recipient Browser

    Note over LC,Recipient: Triggered at the end of a successful UC05 Claim transaction
    LC->>LM: Read address_text, latitude, longitude
    LM-->>LC: Full coordinate + address data
    LC->>LPS: LogisticsPacketSchema(listing, logistics_type)
    LPS-->>LC: {address, lat, lon, logistics_type}
    LC-->>Recipient: HTTP 200 {coordination_id: "COORD-N", logistics_packet: {...}}
    Note over Recipient: Recipient now has full donor address post-claim
    alt logistics_type == 'third_party'
        Note over Recipient: Packet structured for forwarding to external delivery API
    end
```

---

## SEQ-05 — Sequence Diagram: UC05 Donation Claiming

**Belongs in:** Section 11.3.1 — Sequence Diagrams
**Placement:** Insert as "Figure 11.3.1-E — Sequence Diagram: UC05 Donation Claiming"
**Description:** The core atomic claim-lock transaction. Listing is queried with status='available' filter; if another user already claimed it, the query returns None and a 409 is returned. All writes (status update, claim, notifications, audit log) are committed atomically.

```mermaid
sequenceDiagram
    actor Recipient as :Recipient Browser
    participant UI as :Web UI
    participant LC as :ListingController
    participant LM as :Listing (SQLite)
    participant CM as :Claim (SQLite)
    participant NC as dispatch_claim_notifications()
    participant NM as :Notification (SQLite)
    participant AL as :AuditLog (SQLite)

    Recipient->>UI: Click "Claim" button on listing
    UI->>LC: GET /api/listings/claim?listing_id&logistics_type
    LC->>LC: Check tg_session role == 'Recipient'
    LC->>LC: Validate logistics_type in {self_pickup, third_party}
    LC->>LM: query(Listing).filter_by(listing_id, status='available')
    alt Listing is available
        LM-->>LC: listing object
        LC->>LM: listing.status = 'claimed'
        LC->>CM: add(new_claim); flush()
        CM-->>LC: claim_id assigned
        LC->>NC: dispatch_claim_notifications(claim, listing, donor, recipient)
        NC->>NM: add(Notification type='claim_received' for donor)
        NC->>NM: add(Notification type='claim_confirmed' for recipient)
        LC->>AL: add(AuditLog action='listing_claimed', entity_id=listing_id)
        LC->>LM: commit()
        LC-->>UI: HTTP 200 {status:"success", coordination_id, logistics_packet}
        UI-->>Recipient: Show coordination_id and pickup info
    else Listing already claimed or expired
        LM-->>LC: None
        LC-->>UI: HTTP 409 {error: "Item unavailable"}
        UI-->>Recipient: Show conflict error
    end
```

---

## SEQ-06 — Sequence Diagram: UC06 Automated Safety Pruning

**Belongs in:** Section 11.3.1 — Sequence Diagrams
**Placement:** Insert as "Figure 11.3.1-F — Sequence Diagram: UC06 Automated Safety Pruning"
**Description:** Background daemon thread calls run_cleanup() every 300 seconds. run_cleanup() uses an isolated SQLAlchemy session (not the shared web-request session) for thread safety. Manual trigger also available via /api/system/cleanup.

```mermaid
sequenceDiagram
    participant SCHED as cleanup_scheduler()\nDaemon Thread
    participant RC as run_cleanup()
    participant CS as Isolated Session\n(separate SQLAlchemy session)
    participant LM as :Listing (SQLite)
    participant AL as :AuditLog (SQLite)

    loop Every 300 seconds
        SCHED->>RC: run_cleanup()
        RC->>CS: Session() — new isolated session
        RC->>LM: query(Listing).filter(expiry_time < now, status='available')
        LM-->>RC: List of expired listings
        loop For each expired listing
            RC->>LM: listing.status = 'expired'
            RC->>AL: add(AuditLog action='listing_expired', user_id=None)
        end
        RC->>CS: commit()
        CS->>CS: close()
        RC-->>SCHED: count of expired listings removed
    end
    Note over SCHED,AL: Manual trigger: GET /api/system/cleanup calls run_cleanup() directly
```

---

## SEQ-07 — Sequence Diagram: UC07 Dispatch Fulfillment Notification

**Belongs in:** Section 11.3.1 — Sequence Diagrams
**Placement:** Insert as "Figure 11.3.1-G — Sequence Diagram: UC07 Dispatch Fulfillment Notification"
**Description:** dispatch_claim_notifications() is called within the UC05 claim transaction after flush(). This ensures claim_id exists before building the Coordination ID. Both Notification records are staged but not committed — ListingController owns the final commit.

```mermaid
sequenceDiagram
    participant LC as :ListingController
    participant NC as dispatch_claim_notifications()
    participant NM as :Notification (SQLite)
    participant DB as SQLite commit

    Note over LC,DB: Called after session.flush() — claim_id is available but not yet committed
    LC->>NC: dispatch_claim_notifications(claim, listing, donor, recipient)
    NC->>NC: coordination_id = "COORD-{claim.claim_id}"
    NC->>NC: Build donor_msg with food_type, qty, coordination_id, recipient.email, logistics_type
    NC->>NM: session.add(Notification user_id=donor.user_id, type='claim_received')
    NC->>NC: Build recipient_msg with food_type, qty, coordination_id, donor.email, address, logistics_type
    NC->>NM: session.add(Notification user_id=recipient.user_id, type='claim_confirmed')
    Note over NC,NM: Records staged in session — NOT yet committed
    LC->>DB: commit() — claim + notifications + audit_log committed atomically
```

---

## STATE-01 — State Diagram: Listing Lifecycle

**Belongs in:** Section 11.3.2 — State Diagrams
**Placement:** Insert as "Figure 11.3.2-A — State Diagram: Listing Lifecycle"
**Description:** The Listing entity has three possible states. Transition to 'claimed' is atomic via the claim-lock transaction. Transition to 'expired' is autonomous via the background scheduler. Both terminal states remove the listing from the discovery map.

```mermaid
stateDiagram-v2
    [*] --> available : Donor submits POST /api/listings/create\n(listing_id assigned via flush)

    available --> claimed : Recipient calls GET /api/listings/claim\n[Atomic transaction: listing.status = 'claimed'\nClaim record created + notifications dispatched]

    available --> expired : Background scheduler run_cleanup()\n[expiry_time < utcnow AND status == 'available'\nAuditLog action=listing_expired written]

    claimed --> [*] : Terminal — donation fulfilled\n(hidden from discovery map)\n(full address visible in ClaimSchema)

    expired --> [*] : Terminal — safety window elapsed\n(hidden from discovery map)\n(address remains obfuscated)

    note right of available
        Visible on map via ListingMapSchema
        address_text excluded (NFR-03)
        Only lat/lon exposed for pinning
    end note
```

---

## STATE-02 — State Diagram: Notification Read State

**Belongs in:** Section 11.3.2 — State Diagrams
**Placement:** Insert as "Figure 11.3.2-B — State Diagram: Notification Read State"
**Description:** Notification records are created with is_read=False by dispatch_claim_notifications(). They transition to is_read=True when the user explicitly marks them read.

```mermaid
stateDiagram-v2
    [*] --> unread : dispatch_claim_notifications() creates record\n(is_read = False)

    unread --> read : GET /api/notifications/mark_read?notification_id\nor GET /api/notifications/mark_all_read\n(is_read = True, committed)

    read --> [*] : Terminal — notification acknowledged
```

---

## ACT-01 — Activity Diagram: Donation Claiming Process

**Belongs in:** Section 11.3.3 — Activity Diagrams
**Placement:** Insert as "Figure 11.3.3-A — Activity Diagram: Donation Claiming Process"
**Description:** End-to-end activity flow for UC05 (Donation Claiming), including all guard conditions, the atomic database transaction, and the exception rollback path.

```mermaid
flowchart TD
    Start([Recipient clicks Claim on a listing]) --> AuthCheck{Session authenticated?\ntg_session.get user_id}
    AuthCheck -->|No| Err401[HTTP 401\nNot Authenticated]
    AuthCheck -->|Yes| RoleCheck{user_role == Recipient?}
    RoleCheck -->|No| Err403[HTTP 403\nForbidden — Donors cannot claim]
    RoleCheck -->|Yes| LogisticsCheck{logistics_type in\nself_pickup, third_party?}
    LogisticsCheck -->|No| Err400[HTTP 400\nInvalid logistics_type]
    LogisticsCheck -->|Yes| QueryListing[Query Listing\nWHERE listing_id AND status='available']
    QueryListing --> ListingFound{Listing returned?}
    ListingFound -->|No — already claimed or expired| Err409[HTTP 409\nItem Unavailable]
    ListingFound -->|Yes| SetStatus[Set listing.status = 'claimed']
    SetStatus --> CreateClaim[Create Claim object\nsession.add + session.flush\nclaim_id assigned]
    CreateClaim --> Dispatch[dispatch_claim_notifications\nadd donor Notification claim_received\nadd recipient Notification claim_confirmed]
    Dispatch --> WriteAudit[session.add AuditLog\naction=listing_claimed\nentity_id=listing_id]
    WriteAudit --> Commit{session.commit}
    Commit -->|Success| BuildPacket[Build LogisticsPacketSchema\ncoordination_id = COORD-claim_id]
    BuildPacket --> Return200[HTTP 200\ncoordination_id + logistics_packet]
    Commit -->|Exception| Rollback[session.rollback]
    Rollback --> Err500[HTTP 500\nDatabase Error]
```

---

## DEPLOY-01 — Deployment Architecture Diagram

**Belongs in:** Section 12.1 — Physical Deployment Architecture Diagram
**Placement:** Insert as "Figure 12.1 — CibiNet Physical Deployment Architecture"
**Description:** Side-by-side view of the development and production deployment environments. The development environment uses the Vite dev server proxy. Production targets an Nginx reverse proxy with HTTPS termination in front of the same TurboGears WSGI process.

```mermaid
graph TB
    subgraph DEV["Development Environment"]
        Browser1["Web Browser"]
        subgraph DevHost["Developer Workstation (localhost)"]
            Vite["Vite Dev Server :3000\n(serves React app)\n(proxies /api/* → :8080)"]
            TG1["TurboGears WSGI :8080\n(RootController → ApiController\n→ sub-controllers)"]
            SQLite1[("cibinet_dev.db\nSQLite — local disk")]
            Sched1["cleanup_scheduler()\nDaemon Thread (300s interval)"]
        end
        Nom1["Nominatim\nGeocoding API\n(external)"]
    end

    subgraph PROD["Production Deployment (Target)"]
        Browser2["Web Browser"]
        subgraph CloudVM["Cloud VM / PaaS"]
            Nginx["Nginx Reverse Proxy :443\n(HTTPS termination)"]
            StaticBundle["React Bundle\ndist/ (static files)"]
            TG2["TurboGears WSGI :8080"]
            SQLite2[("cibinet_prod.db\nSQLite — persistent volume")]
            Sched2["Daemon Scheduler Thread"]
        end
        Nom2["Nominatim\nGeocoding API"]
        EmailGW["Email Gateway\n(SMTP — future)"]
    end

    Browser1 -->|"HTTP :3000"| Vite
    Vite -->|"proxy /api/*"| TG1
    TG1 <--> SQLite1
    Sched1 -->|"calls run_cleanup()"| TG1
    TG1 -->|"geocode_address()"| Nom1

    Browser2 -->|"HTTPS :443"| Nginx
    Nginx -->|"GET static assets"| StaticBundle
    Nginx -->|"forward /api/*"| TG2
    TG2 <--> SQLite2
    Sched2 -->|"calls run_cleanup()"| TG2
    TG2 -->|"geocode_address()"| Nom2
    TG2 -.->|"future SMTP"| EmailGW
```
