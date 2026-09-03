# Naujan Tourism System - Graphviz DOT Diagrams

## System Overview (High-Level DOT Format)

```dot
digraph SystemOverview {
    rankdir=TB;
    node [shape=box, style=filled];
    
    // Title
    label="Naujan Tourism Application - System Overview";
    labelloc=top;
    fontsize=16;
    fontname="Arial Bold";
    
    // User Types
    subgraph cluster_users {
        label="System Users";
        color=purple;
        style=filled;
        fillcolor=plum;
        
        Tourist [label="Tourist\n(Visitor)", shape=ellipse, fillcolor=lightcyan];
        RegisteredUser [label="Registered\nUser", shape=ellipse, fillcolor=lightcyan];
        Admin [label="System\nAdministrator", shape=ellipse, fillcolor=lightcyan];
    }
    
    // Core System Components
    subgraph cluster_core {
        label="Core Tourism Platform";
        color=blue;
        style=filled;
        fillcolor=lightblue;
        
        WebApp [label="Tourism Web Application\n(Vue.js Frontend)", fillcolor=lightcyan];
        APIServer [label="API Server\n(Node.js/Express)", fillcolor=lightcyan];
        Database [label="Tourism Database\n(MySQL)", shape=cylinder, fillcolor=lightcyan];
    }
    
    // Key Features
    subgraph cluster_features {
        label="System Features";
        color=green;
        style=filled;
        fillcolor=lightgreen;
        
        AttractionMgmt [label="Attraction\nManagement", fillcolor=lightcyan];
        TripPlanning [label="Trip Planning\n& Itineraries", fillcolor=lightcyan];
        ReviewSystem [label="Review &\nRating System", fillcolor=lightcyan];
        ChatBot [label="AI Tourism\nChatbot", fillcolor=lightcyan];
        WeatherInfo [label="Weather\nIntegration", fillcolor=lightcyan];
    }
    
    // External Services
    subgraph cluster_external {
        label="External Services";
        color=orange;
        style=filled;
        fillcolor=lightyellow;
        
        WeatherAPI [label="OpenWeather\nAPI", fillcolor=lightcyan];
        CloudinaryAPI [label="Cloudinary\nImage CDN", fillcolor=lightcyan];
        MapsAPI [label="Maps API\n(Future)", fillcolor=lightgray];
    }
    
    // Data Flow - Users to System
    Tourist -> WebApp [label="Browse & Explore"];
    RegisteredUser -> WebApp [label="Plan & Review"];
    Admin -> WebApp [label="Manage Content"];
    
    // Core System Flow
    WebApp -> APIServer [label="API Calls\n(REST)"];
    APIServer -> Database [label="CRUD\nOperations"];
    
    // Feature Integration
    APIServer -> AttractionMgmt [label="Manages"];
    APIServer -> TripPlanning [label="Processes"];
    APIServer -> ReviewSystem [label="Handles"];
    APIServer -> ChatBot [label="Powers"];
    APIServer -> WeatherInfo [label="Provides"];
    
    // External Service Integration
    WeatherInfo -> WeatherAPI [label="Fetches Data"];
    AttractionMgmt -> CloudinaryAPI [label="Image Storage"];
    TripPlanning -> MapsAPI [label="Route Planning", style=dashed];
    
    // Data Storage
    AttractionMgmt -> Database;
    TripPlanning -> Database;
    ReviewSystem -> Database;
    ChatBot -> Database;
    
    // Color coding
    edge [color=black];
    
    // Legend
    subgraph cluster_legend {
        label="Legend";
        color=gray;
        style=filled;
        fillcolor=lightgray;
        
        LegendUser [label="Users", shape=ellipse, fillcolor=plum];
        LegendCore [label="Core System", fillcolor=lightblue];
        LegendFeature [label="Features", fillcolor=lightgreen];
        LegendExternal [label="External APIs", fillcolor=lightyellow];
        LegendFuture [label="Future Feature", fillcolor=lightgray];
    }
}
```

## System Architecture (DOT Format)

```dot
digraph SystemArchitecture {
    rankdir=TB;
    node [shape=box, style=filled];
    
    // Subgraphs for layers
    subgraph cluster_presentation {
        label="Presentation Layer";
        color=blue;
        style=filled;
        fillcolor=lightblue;
        
        SPA [label="Vue.js SPA", fillcolor=lightcyan];
        PublicPages [label="Public Pages", fillcolor=lightcyan];
        AuthPages [label="Auth Pages", fillcolor=lightcyan];
        UserPages [label="User Pages", fillcolor=lightcyan];
        AdminPages [label="Admin Pages", fillcolor=lightcyan];
        
        Components [label="Components Layer", fillcolor=lightcyan];
        StateManager [label="State Management", fillcolor=lightcyan];
    }
    
    subgraph cluster_application {
        label="Application Layer";
        color=green;
        style=filled;
        fillcolor=lightgreen;
        
        ExpressServer [label="Express.js Server", fillcolor=lightcyan];
        APIRoutes [label="API Routes", fillcolor=lightcyan];
        Controllers [label="Controllers", fillcolor=lightcyan];
        Middleware [label="Middleware", fillcolor=lightcyan];
        Services [label="Services", fillcolor=lightcyan];
    }
    
    subgraph cluster_business {
        label="Business Logic Layer";
        color=orange;
        style=filled;
        fillcolor=lightyellow;
        
        Models [label="Data Models", fillcolor=lightcyan];
        Validators [label="Validators", fillcolor=lightcyan];
        Helpers [label="Helper Functions", fillcolor=lightcyan];
        Utils [label="Utilities", fillcolor=lightcyan];
    }
    
    subgraph cluster_data {
        label="Data Layer";
        color=red;
        style=filled;
        fillcolor=mistyrose;
        
        MySQL [label="MySQL Database", shape=cylinder, fillcolor=lightcyan];
        ExternalAPIs [label="External APIs", fillcolor=lightcyan];
        FileStorage [label="File Storage", fillcolor=lightcyan];
        Cache [label="Cache System", fillcolor=lightcyan];
    }
    
    // Connections
    SPA -> PublicPages;
    SPA -> AuthPages;
    SPA -> UserPages;
    SPA -> AdminPages;
    
    PublicPages -> Components;
    AuthPages -> Components;
    UserPages -> Components;
    AdminPages -> Components;
    
    Components -> StateManager;
    
    SPA -> ExpressServer [label="HTTP/HTTPS"];
    
    ExpressServer -> APIRoutes;
    APIRoutes -> Middleware;
    Middleware -> Controllers;
    Controllers -> Services;
    
    Services -> Models;
    Controllers -> Validators;
    Services -> Helpers;
    Middleware -> Utils;
    
    Models -> MySQL;
    Services -> ExternalAPIs;
    Controllers -> FileStorage;
    ExpressServer -> Cache;
}
```

## Database Entity Relationship (DOT Format)

```dot
digraph DatabaseSchema {
    rankdir=TB;
    node [shape=record, style=filled, fillcolor=lightblue];
    
    Users [label="{Users|user_id (PK)\lusername\lemail\lpassword_hash\lfirst_name\llast_name\lrole\lcreated_at\lupdated_at}"];
    
    Attractions [label="{Attractions|attraction_id (PK)\lname\ldescription\llatitude\llongitude\lcategory\limage_url\lis_active\lcreated_at\lupdated_at}"];
    
    Itineraries [label="{Itineraries|itinerary_id (PK)\luser_id (FK)\ltitle\ldescription\ltravel_date\ltotal_distance\lestimated_time\lcreated_at\lupdated_at}"];
    
    ItineraryAttractions [label="{Itinerary_Attractions|itinerary_id (FK)\lattraction_id (FK)\lvisit_order\lestimated_duration\lnotes}"];
    
    Reviews [label="{Reviews|review_id (PK)\luser_id (FK)\lattraction_id (FK)\lrating\lcomment\lis_approved\lcreated_at\lupdated_at}"];
    
    ChatbotConversations [label="{Chatbot_Conversations|conversation_id (PK)\luser_id (FK)\lsession_id\llanguage\lstarted_at\lended_at}"];
    
    ChatbotMessages [label="{Chatbot_Messages|message_id (PK)\lconversation_id (FK)\lsender_type\lmessage_text\lresponse_text\lcreated_at}"];
    
    PointsOfInterest [label="{Points_Of_Interest|poi_id (PK)\lattraction_id (FK)\lname\ldescription\llatitude\llongitude\lcategory}"];
    
    WeatherData [label="{Weather_Data|weather_id (PK)\lattraction_id (FK)\ltemperature\lweather_condition\lhumidity\lwind_speed\lrecorded_at}"];
    
    // Relationships
    Users -> Itineraries [label="1:N"];
    Users -> Reviews [label="1:N"];
    Users -> ChatbotConversations [label="1:N"];
    
    Attractions -> ItineraryAttractions [label="1:N"];
    Attractions -> Reviews [label="1:N"];
    Attractions -> PointsOfInterest [label="1:N"];
    Attractions -> WeatherData [label="1:N"];
    
    Itineraries -> ItineraryAttractions [label="1:N"];
    
    ChatbotConversations -> ChatbotMessages [label="1:N"];
}
```

## Data Flow Diagram (DOT Format)

```dot
digraph DataFlow {
    rankdir=LR;
    node [style=filled];
    
    subgraph cluster_client {
        label="Client Tier";
        color=blue;
        style=filled;
        fillcolor=lightblue;
        
        User [label="User", shape=ellipse, fillcolor=lightcyan];
        Browser [label="Browser\n(Vue.js)", fillcolor=lightcyan];
    }
    
    subgraph cluster_server {
        label="Server Tier";
        color=green;
        style=filled;
        fillcolor=lightgreen;
        
        WebServer [label="Web Server\n(Express.js)", fillcolor=lightcyan];
        AppLogic [label="Application\nLogic", fillcolor=lightcyan];
        Middleware [label="Middleware\nLayer", fillcolor=lightcyan];
    }
    
    subgraph cluster_data {
        label="Data Tier";
        color=red;
        style=filled;
        fillcolor=mistyrose;
        
        Database [label="MySQL\nDatabase", shape=cylinder, fillcolor=lightcyan];
        ExtAPI [label="External\nAPIs", fillcolor=lightcyan];
        FileStore [label="File\nStorage", fillcolor=lightcyan];
    }
    
    // Data flow
    User -> Browser [label="Interact"];
    Browser -> WebServer [label="HTTP Request\n(JSON)"];
    WebServer -> Browser [label="HTTP Response\n(JSON)"];
    
    WebServer -> Middleware [label="Route"];
    Middleware -> AppLogic [label="Process"];
    AppLogic -> Middleware [label="Result"];
    Middleware -> WebServer [label="Response"];
    
    AppLogic -> Database [label="SQL Query"];
    Database -> AppLogic [label="Data"];
    
    AppLogic -> ExtAPI [label="API Call"];
    ExtAPI -> AppLogic [label="JSON Data"];
    
    AppLogic -> FileStore [label="Upload"];
    FileStore -> AppLogic [label="URL"];
}
```

## Security Architecture (DOT Format)

```dot
digraph SecurityArchitecture {
    rankdir=TB;
    node [shape=box, style=filled, fillcolor=lightcyan];
    
    subgraph cluster_input {
        label="Input Layer Security";
        color=blue;
        style=filled;
        fillcolor=lightblue;
        
        ClientValidation [label="Client-side\nValidation"];
        XSSProtection [label="XSS\nProtection"];
        CSRFTokens [label="CSRF\nTokens"];
    }
    
    subgraph cluster_transport {
        label="Transport Layer Security";
        color=green;
        style=filled;
        fillcolor=lightgreen;
        
        HTTPS [label="HTTPS/TLS\nEncryption"];
        SecureHeaders [label="Secure\nHeaders"];
        CORSConfig [label="CORS\nConfiguration"];
    }
    
    subgraph cluster_application {
        label="Application Layer Security";
        color=orange;
        style=filled;
        fillcolor=lightyellow;
        
        AuthMiddleware [label="Authentication\nMiddleware"];
        AuthzChecks [label="Authorization\nChecks"];
        InputValidation [label="Input\nValidation"];
        RateLimiting [label="Rate\nLimiting"];
    }
    
    subgraph cluster_data {
        label="Data Layer Security";
        color=red;
        style=filled;
        fillcolor=mistyrose;
        
        ParamQueries [label="Parameterized\nQueries"];
        DBAccessControl [label="Database\nAccess Control"];
        DataEncryption [label="Data\nEncryption"];
        BackupSecurity [label="Backup\nSecurity"];
    }
    
    // Security flow
    ClientValidation -> HTTPS;
    XSSProtection -> SecureHeaders;
    CSRFTokens -> CORSConfig;
    
    HTTPS -> AuthMiddleware;
    SecureHeaders -> AuthzChecks;
    CORSConfig -> InputValidation;
    
    AuthMiddleware -> ParamQueries;
    AuthzChecks -> DBAccessControl;
    InputValidation -> DataEncryption;
    RateLimiting -> BackupSecurity;
}
```

}
```

---

**Usage Instructions:**

1. **For Graphviz:**
   - Install Graphviz: `winget install graphviz` (Windows) or visit https://graphviz.org/
   - Save any diagram code to a `.dot` file
   - Generate image: `dot -Tpng filename.dot -o output.png`
   - Or use online: http://magjac.com/graphviz-visual-editor/

2. **For Online Tools:**
   - Use online Graphviz editors: https://dreampuf.github.io/GraphvizOnline/
   - Copy and paste the DOT code directly

3. **VS Code Extensions:**
   - Install "Graphviz (dot) language support" extension
   - Install "Graphviz Interactive Preview" for live preview

**Note:** Activity Diagram, Context Diagram, and DFD Level 0 have been moved to a separate file: `activity_context_dfd_diagrams.md`