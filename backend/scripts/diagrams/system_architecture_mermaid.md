# Naujan Tourism System Architecture Diagrams (Mermaid)

## System Overview (High-Level)

```mermaid
graph TB
    subgraph "System Users"
        T[👤 Tourist<br/>Visitor]
        RU[👤 Registered User<br/>Trip Planner]
        A[👤 Administrator<br/>Content Manager]
    end
    
    subgraph "Core Tourism Platform"
        WA[🌐 Tourism Web Application<br/>Vue.js Frontend]
        API[⚙️ API Server<br/>Node.js/Express]
        DB[(🗄️ Tourism Database<br/>MySQL)]
    end
    
    subgraph "System Features"
        AM[🏛️ Attraction<br/>Management]
        TP[🗺️ Trip Planning<br/>& Itineraries]
        RS[⭐ Review &<br/>Rating System]
        CB[🤖 AI Tourism<br/>Chatbot]
        WI[🌤️ Weather<br/>Integration]
    end
    
    subgraph "External Services"
        OW[🌦️ OpenWeather<br/>API]
        CL[☁️ Cloudinary<br/>Image CDN]
        MA[🗺️ Maps API<br/>Future Feature]
    end
    
    %% User interactions
    T -->|Browse & Explore| WA
    RU -->|Plan & Review| WA
    A -->|Manage Content| WA
    
    %% Core system flow
    WA <-->|API Calls<br/>REST| API
    API <-->|CRUD<br/>Operations| DB
    
    %% Feature integration
    API --> AM
    API --> TP
    API --> RS
    API --> CB
    API --> WI
    
    %% External service integration
    WI -->|Fetches Data| OW
    AM -->|Image Storage| CL
    TP -.->|Route Planning| MA
    
    %% Data storage
    AM --> DB
    TP --> DB
    RS --> DB
    CB --> DB
    
    %% Styling
    classDef userNode fill:#e1bee7,stroke:#8e24aa
    classDef coreNode fill:#bbdefb,stroke:#1976d2
    classDef featureNode fill:#c8e6c9,stroke:#388e3c
    classDef externalNode fill:#fff3e0,stroke:#f57c00
    classDef futureNode fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5
    
    class T,RU,A userNode
    class WA,API,DB coreNode
    class AM,TP,RS,CB,WI featureNode
    class OW,CL externalNode
    class MA futureNode
```

## Frontend Architecture

```mermaid
graph TB
    subgraph "PRESENTATION LAYER"
        SPA[Vue.js 3 Single Page Application]
        
        subgraph "Page Components"
            PP[Public Pages<br/>• Home<br/>• Attractions<br/>• Details<br/>• Contact]
            AP[Auth Pages<br/>• Login<br/>• Register]
            UP[User Pages<br/>• Profile<br/>• Itinerary<br/>• Reviews<br/>• Chatbot]
            AD[Admin Pages<br/>• Dashboard<br/>• Manage<br/>• Users<br/>• Content]
        end
        
        subgraph "Component Layer"
            LC[Layout Components<br/>• Navbar<br/>• Footer<br/>• Sidebar]
            UC[UI/UX Components<br/>• Swiper<br/>• Modal<br/>• Form]
            BC[Business Components<br/>• AttrCard<br/>• ReviewBox<br/>• ChatBot]
            UT[Utility Components<br/>• Auth<br/>• API<br/>• Utils]
        end
        
        subgraph "State Management"
            VRS[Vue Reactive State]
            LS[Local Storage]
            SM[Session Management]
        end
    end
    
    SPA --> PP
    SPA --> AP
    SPA --> UP
    SPA --> AD
    
    PP --> LC
    AP --> UC
    UP --> BC
    AD --> UT
    
    LC --> VRS
    UC --> LS
    BC --> SM
```

## Backend Architecture

```mermaid
graph TB
    subgraph "APPLICATION LAYER"
        ES[Express.js Server Application]
        
        subgraph "API Routes"
            AR["/api/auth"]
            ATR["/api/attractions"]
            UR["/api/users"]
            CR["/api/chat"]
            IR["/api/itinerary"]
        end
        
        subgraph "Controllers"
            AC[AuthController]
            ATC[AttractionController]
            UC[UserController]
            CC[ChatController]
            IC[ItineraryController]
        end
        
        subgraph "Middleware"
            AM[Auth Middleware]
            CORS[CORS Handler]
            LOG[Logger]
            VAL[Validator]
            ERR[Error Handler]
        end
        
        subgraph "Services"
            AS[Auth Service]
            ATS[Attraction Service]
            US[User Service]
            CS[Chat Service]
            IS[Itinerary Service]
        end
    end
    
    subgraph "BUSINESS LOGIC LAYER"
        subgraph "Models"
            UM[User Model]
            ATM[Attraction Model]
            RM[Review Model]
            IM[Itinerary Model]
        end
        
        subgraph "Validators"
            IV[Input Validator]
            SV[Schema Validator]
            BV[Business Validator]
            SEV[Security Validator]
        end
        
        subgraph "Helpers"
            PH[Password Helper]
            JH[JWT Helper]
            CH[Crypto Helper]
            UH[Upload Helper]
        end
    end
    
    subgraph "INTEGRATION LAYER"
        subgraph "Database"
            MYS[MySQL Database]
            PM[Pool Management]
            ORM[ORM/Query Builder]
        end
        
        subgraph "External APIs"
            WA[Weather API]
            MA[Maps API]
            GA[Geocoding API]
        end
        
        subgraph "File Storage"
            CLD[Cloudinary]
            UP[Upload Handler]
            CDN[CDN Integration]
        end
        
        subgraph "Cache System"
            MEM[Memory Cache]
            RED[Redis Cache]
            SES[Session Store]
        end
    end
    
    ES --> AR
    AR --> AC
    AC --> AM
    AM --> AS
    AS --> UM
    UM --> MYS
```

## Database Schema (ERD)

```mermaid
erDiagram
    USERS {
        int user_id PK
        string username
        string email
        string password_hash
        string first_name
        string last_name
        enum role
        datetime created_at
        datetime updated_at
    }
    
    ATTRACTIONS {
        int attraction_id PK
        string name
        text description
        decimal latitude
        decimal longitude
        string category
        string image_url
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    ITINERARIES {
        int itinerary_id PK
        int user_id FK
        string title
        text description
        date travel_date
        decimal total_distance
        int estimated_time
        datetime created_at
        datetime updated_at
    }
    
    ITINERARY_ATTRACTIONS {
        int itinerary_id FK
        int attraction_id FK
        int visit_order
        time estimated_duration
        text notes
    }
    
    REVIEWS {
        int review_id PK
        int user_id FK
        int attraction_id FK
        int rating
        text comment
        boolean is_approved
        datetime created_at
        datetime updated_at
    }
    
    CHATBOT_CONVERSATIONS {
        int conversation_id PK
        int user_id FK
        string session_id
        string language
        datetime started_at
        datetime ended_at
    }
    
    CHATBOT_MESSAGES {
        int message_id PK
        int conversation_id FK
        enum sender_type
        text message_text
        text response_text
        datetime created_at
    }
    
    POINTS_OF_INTEREST {
        int poi_id PK
        int attraction_id FK
        string name
        text description
        decimal latitude
        decimal longitude
        string category
    }
    
    WEATHER_DATA {
        int weather_id PK
        int attraction_id FK
        decimal temperature
        string weather_condition
        int humidity
        decimal wind_speed
        datetime recorded_at
    }
    
    USERS ||--o{ ITINERARIES : creates
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ CHATBOT_CONVERSATIONS : initiates
    
    ATTRACTIONS ||--o{ ITINERARY_ATTRACTIONS : includes
    ATTRACTIONS ||--o{ REVIEWS : receives
    ATTRACTIONS ||--o{ POINTS_OF_INTEREST : contains
    ATTRACTIONS ||--o{ WEATHER_DATA : has
    
    ITINERARIES ||--o{ ITINERARY_ATTRACTIONS : contains
    
    CHATBOT_CONVERSATIONS ||--o{ CHATBOT_MESSAGES : contains
```

## Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Client Tier"
        UI[User Interface<br/>Vue.js Components]
        UX[User Interaction]
        BR[Browser Engine]
    end
    
    subgraph "Application Tier"
        API[API Endpoints<br/>Express.js Routes]
        BL[Business Logic<br/>Controllers & Services]
        MW[Middleware<br/>Auth, Validation, CORS]
    end
    
    subgraph "Data Tier"
        DB[(MySQL Database<br/>Data Storage)]
        EXT[External APIs<br/>Weather, Maps]
        FS[File Storage<br/>Cloudinary CDN]
    end
    
    %% User interactions
    UX --> UI
    UI --> BR
    
    %% HTTP/HTTPS communication
    BR -->|HTTP/HTTPS<br/>JSON Requests| API
    API -->|HTTP/HTTPS<br/>JSON Responses| BR
    
    %% Server processing
    API --> MW
    MW --> BL
    BL --> MW
    MW --> API
    
    %% Data layer communication
    BL -->|SQL Queries| DB
    DB -->|Result Sets| BL
    BL -->|API Calls| EXT
    EXT -->|JSON Data| BL
    BL -->|Upload/CDN| FS
    FS -->|URLs/Metadata| BL
    
    %% Styling
    classDef clientTier fill:#e1f5fe
    classDef appTier fill:#f3e5f5
    classDef dataTier fill:#e8f5e8
    
    class UI,UX,BR clientTier
    class API,BL,MW appTier
    class DB,EXT,FS dataTier
```

## Security Architecture

```mermaid
graph TD
    subgraph "Security Layers"
        IL[Input Layer Security]
        TL[Transport Layer Security]
        AL[Application Layer Security]
        DL[Data Layer Security]
    end
    
    subgraph "Input Security"
        CSV[Client-side Validation]
        XSS[XSS Protection]
        CSRF[CSRF Tokens]
    end
    
    subgraph "Transport Security"
        HTTPS[HTTPS/TLS Encryption]
        SH[Secure Headers]
        CORS_SEC[CORS Configuration]
    end
    
    subgraph "Application Security"
        AUTH[Authentication Middleware]
        AUTHZ[Authorization Checks]
        VAL_SEC[Input Validation]
        RL[Rate Limiting]
    end
    
    subgraph "Data Security"
        PQ[Parameterized Queries]
        DAC[Database Access Control]
        DE[Data Encryption]
        BS[Backup Security]
    end
    
    IL --> CSV
    IL --> XSS
    IL --> CSRF
    
    TL --> HTTPS
    TL --> SH
    TL --> CORS_SEC
    
    AL --> AUTH
    AL --> AUTHZ
    AL --> VAL_SEC
    AL --> RL
    
    DL --> PQ
    DL --> DAC
    DL --> DE
    DL --> BS
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV[Local Development<br/>Hot-reload<br/>Test Database]
    end
    
    subgraph "Testing"
        TEST[Automated Testing<br/>Unit Tests<br/>Integration Tests]
    end
    
    subgraph "Staging"
        STAGE[Staging Environment<br/>Production-like<br/>Real APIs]
    end
    
    subgraph "Production"
        PROD[Production Server<br/>High Availability<br/>Monitoring]
        LB[Load Balancer]
        CDN_PROD[CDN Network]
        DB_CLUSTER[Database Cluster]
    end
    
    DEV --> TEST
    TEST --> STAGE
    STAGE --> PROD
    
    PROD --> LB
    LB --> CDN_PROD
    LB --> DB_CLUSTER
    
    classDef dev fill:#fff2cc
    classDef test fill:#d5e8d4
    classDef stage fill:#ffe6cc
    classDef prod fill:#f8cecc
    
    class DEV dev
    class TEST test
    class STAGE stage
    class PROD,LB,CDN_PROD,DB_CLUSTER prod
```

---

**Usage Instructions:**
1. Copy any diagram code and paste it into Mermaid Live Editor: https://mermaid.live/
2. Use in VS Code with Mermaid Preview extension
3. Include in documentation platforms that support Mermaid (GitHub, GitLab, etc.)
4. Export as PNG/SVG from Mermaid Live Editor for presentations