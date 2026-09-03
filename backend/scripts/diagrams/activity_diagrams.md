# Naujan Tourism System - Activity Diagrams

## User Trip Planning Activity Diagram (Mermaid)

```mermaid
flowchart TD
    Start([User Starts Trip Planning]) --> Login{User Logged In?}
    
    Login -->|No| Register[Register New Account]
    Login -->|Yes| Dashboard[Go to Dashboard]
    Register --> LoginForm[Login with Credentials]
    LoginForm --> Dashboard
    
    Dashboard --> ViewAttractions[Browse Available Attractions]
    ViewAttractions --> FilterAttractions{Apply Filters?}
    
    FilterAttractions -->|Yes| ApplyFilter[Apply Category/Location Filter]
    FilterAttractions -->|No| SelectAttraction[Select Attraction]
    ApplyFilter --> SelectAttraction
    
    SelectAttraction --> ViewDetails[View Attraction Details]
    ViewDetails --> CheckWeather[Check Weather Information]
    CheckWeather --> AddToItinerary{Add to Itinerary?}
    
    AddToItinerary -->|Yes| CreateItinerary{Has Existing Itinerary?}
    AddToItinerary -->|No| SelectAnother[Select Another Attraction]
    
    CreateItinerary -->|No| NewItinerary[Create New Itinerary]
    CreateItinerary -->|Yes| ExistingItinerary[Add to Existing Itinerary]
    
    NewItinerary --> SetItineraryDetails[Set Title, Date, Description]
    SetItineraryDetails --> AddAttraction[Add Attraction to Itinerary]
    ExistingItinerary --> AddAttraction
    
    AddAttraction --> MoreAttractions{Add More Attractions?}
    MoreAttractions -->|Yes| SelectAnother
    MoreAttractions -->|No| OptimizeRoute[Optimize Route Order]
    
    OptimizeRoute --> ReviewItinerary[Review Complete Itinerary]
    ReviewItinerary --> SaveItinerary[Save Itinerary]
    SaveItinerary --> ShareItinerary{Share Itinerary?}
    
    ShareItinerary -->|Yes| GenerateLink[Generate Share Link]
    ShareItinerary -->|No| Complete([Trip Planning Complete])
    GenerateLink --> Complete
    
    SelectAnother --> ViewAttractions
    
    %% Styling
    classDef startEnd fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    
    class Start,Complete startEnd
    class Register,LoginForm,Dashboard,ViewAttractions,ApplyFilter,SelectAttraction,ViewDetails,CheckWeather,NewItinerary,SetItineraryDetails,AddAttraction,OptimizeRoute,ReviewItinerary,SaveItinerary,GenerateLink process
    class Login,FilterAttractions,AddToItinerary,CreateItinerary,MoreAttractions,ShareItinerary decision
```

## Attraction Management Activity Diagram (Mermaid)

```mermaid
flowchart TD
    AdminStart([Admin Starts Content Management]) --> AdminLogin[Admin Login]
    AdminLogin --> AdminDashboard[Access Admin Dashboard]
    AdminDashboard --> ChooseAction{Choose Action}
    
    ChooseAction -->|Add New| AddAttraction[Add New Attraction]
    ChooseAction -->|Edit Existing| EditAttraction[Edit Existing Attraction]
    ChooseAction -->|Review Content| ReviewContent[Review User Content]
    ChooseAction -->|Manage Users| ManageUsers[Manage User Accounts]
    
    %% Add New Attraction Flow
    AddAttraction --> EnterBasicInfo[Enter Name, Description, Category]
    EnterBasicInfo --> AddLocation[Add GPS Coordinates]
    AddLocation --> UploadImages[Upload Attraction Images]
    UploadImages --> AddPOI{Add Points of Interest?}
    
    AddPOI -->|Yes| CreatePOI[Create Point of Interest]
    AddPOI -->|No| ValidateInfo[Validate Information]
    CreatePOI --> AddPOI
    
    ValidateInfo --> InfoValid{Information Valid?}
    InfoValid -->|No| FixErrors[Fix Validation Errors]
    InfoValid -->|Yes| SaveAttraction[Save Attraction to Database]
    FixErrors --> ValidateInfo
    
    SaveAttraction --> PublishAttraction{Publish Immediately?}
    PublishAttraction -->|Yes| SetActive[Set Status to Active]
    PublishAttraction -->|No| SetDraft[Set Status to Draft]
    
    %% Edit Existing Attraction Flow
    EditAttraction --> SearchAttraction[Search for Attraction]
    SearchAttraction --> SelectToEdit[Select Attraction to Edit]
    SelectToEdit --> LoadCurrentData[Load Current Information]
    LoadCurrentData --> ModifyInfo[Modify Information]
    ModifyInfo --> ValidateChanges[Validate Changes]
    ValidateChanges --> ChangesValid{Changes Valid?}
    
    ChangesValid -->|No| FixEditErrors[Fix Validation Errors]
    ChangesValid -->|Yes| SaveChanges[Save Changes]
    FixEditErrors --> ModifyInfo
    SaveChanges --> UpdateStatus[Update Status if Needed]
    
    %% Review Content Flow
    ReviewContent --> ViewPendingReviews[View Pending Reviews]
    ViewPendingReviews --> SelectReview[Select Review to Moderate]
    SelectReview --> ReadReview[Read Review Content]
    ReadReview --> ReviewDecision{Approve Review?}
    
    ReviewDecision -->|Approve| ApproveReview[Approve and Publish]
    ReviewDecision -->|Reject| RejectReview[Reject with Reason]
    ReviewDecision -->|Edit| EditReview[Edit and Approve]
    
    ApproveReview --> MoreReviews{More Reviews to Check?}
    RejectReview --> MoreReviews
    EditReview --> MoreReviews
    MoreReviews -->|Yes| ViewPendingReviews
    MoreReviews -->|No| ContentComplete
    
    %% Manage Users Flow  
    ManageUsers --> ViewUsers[View User List]
    ViewUsers --> SelectUser[Select User]
    SelectUser --> UserAction{Choose User Action}
    
    UserAction -->|View Details| ViewUserDetails[View User Details]
    UserAction -->|Edit Role| ChangeUserRole[Change User Role]
    UserAction -->|Suspend| SuspendUser[Suspend User Account]
    UserAction -->|Delete| DeleteUser[Delete User Account]
    
    ViewUserDetails --> UserManagementComplete
    ChangeUserRole --> UserManagementComplete
    SuspendUser --> UserManagementComplete
    DeleteUser --> UserManagementComplete
    
    %% End States
    SetActive --> ContentComplete([Content Management Complete])
    SetDraft --> ContentComplete
    UpdateStatus --> ContentComplete
    ContentComplete --> ContinueWork{Continue Working?}
    UserManagementComplete --> ContinueWork
    
    ContinueWork -->|Yes| AdminDashboard
    ContinueWork -->|No| AdminEnd([Admin Session End])
    
    %% Styling
    classDef startEnd fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef error fill:#ffebee,stroke:#f44336,stroke-width:2px
    
    class AdminStart,AdminEnd,ContentComplete startEnd
    class AdminLogin,AdminDashboard,AddAttraction,EditAttraction,ReviewContent,ManageUsers,EnterBasicInfo,AddLocation,UploadImages,CreatePOI,ValidateInfo,SaveAttraction,SetActive,SetDraft,SearchAttraction,SelectToEdit,LoadCurrentData,ModifyInfo,ValidateChanges,SaveChanges,UpdateStatus,ViewPendingReviews,SelectReview,ReadReview,ApproveReview,RejectReview,EditReview,ViewUsers,SelectUser,ViewUserDetails,ChangeUserRole,SuspendUser,DeleteUser,UserManagementComplete process
    class ChooseAction,AddPOI,InfoValid,PublishAttraction,ChangesValid,ReviewDecision,MoreReviews,UserAction,ContinueWork decision
    class FixErrors,FixEditErrors error
```

## Chatbot Interaction Activity Diagram (Mermaid)

```mermaid
flowchart TD
    UserStart([User Needs Tourism Help]) --> OpenChatbot[Open Chatbot Interface]
    OpenChatbot --> SelectLanguage{Select Language}
    
    SelectLanguage -->|English| SetEnglish[Set Language: English]
    SelectLanguage -->|Spanish| SetSpanish[Set Language: Spanish]
    SelectLanguage -->|Tagalog| SetTagalog[Set Language: Tagalog]
    
    SetEnglish --> StartConversation[Start New Conversation]
    SetSpanish --> StartConversation
    SetTagalog --> StartConversation
    
    StartConversation --> ShowWelcome[Show Welcome Message]
    ShowWelcome --> UserInput[User Types Question/Request]
    UserInput --> ProcessInput[Process User Input]
    ProcessInput --> AnalyzeIntent[Analyze User Intent]
    
    AnalyzeIntent --> QueryType{Determine Query Type}
    
    QueryType -->|Attraction Info| GetAttractionInfo[Retrieve Attraction Information]
    QueryType -->|Weather Query| GetWeatherInfo[Get Weather Data]
    QueryType -->|Travel Planning| ProvidePlanningHelp[Provide Planning Assistance]
    QueryType -->|General Help| ProvideGeneralInfo[Provide General Tourism Info]
    QueryType -->|Unknown| AskClarification[Ask for Clarification]
    
    GetAttractionInfo --> FormatResponse[Format Response Message]
    GetWeatherInfo --> CheckWeatherAPI[Check Weather API]
    CheckWeatherAPI --> FormatResponse
    ProvidePlanningHelp --> QueryDatabase[Query Tourism Database]
    QueryDatabase --> FormatResponse
    ProvideGeneralInfo --> FormatResponse
    
    AskClarification --> ShowClarification[Show Clarification Options]
    ShowClarification --> UserClarifies[User Provides Clarification]
    UserClarifies --> ProcessInput
    
    FormatResponse --> ShowResponse[Display Response to User]
    ShowResponse --> OfferFollowUp[Offer Follow-up Questions]
    OfferFollowUp --> UserFollowUp{User Wants to Continue?}
    
    UserFollowUp -->|Yes| FollowUpType{Follow-up Type}
    UserFollowUp -->|Change Language| SelectLanguage
    UserFollowUp -->|End Chat| EndConversation[End Conversation]
    
    FollowUpType -->|New Question| UserInput
    FollowUpType -->|More Details| GetMoreDetails[Get Additional Details]
    FollowUpType -->|Related Info| GetRelatedInfo[Get Related Information]
    
    GetMoreDetails --> FormatResponse
    GetRelatedInfo --> FormatResponse
    
    EndConversation --> SaveConversation[Save Conversation History]
    SaveConversation --> ShowFeedback{Request Feedback?}
    
    ShowFeedback -->|Yes| CollectFeedback[Collect User Feedback]
    ShowFeedback -->|No| ChatComplete([Chat Session Complete])
    CollectFeedback --> SaveFeedback[Save Feedback to Database]
    SaveFeedback --> ChatComplete
    
    %% Error Handling
    ProcessInput --> InputError{Input Processing Error?}
    InputError -->|Yes| ShowError[Show Error Message]
    InputError -->|No| AnalyzeIntent
    ShowError --> UserInput
    
    %% Styling
    classDef startEnd fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef error fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef language fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    
    class UserStart,ChatComplete startEnd
    class OpenChatbot,StartConversation,ShowWelcome,UserInput,ProcessInput,AnalyzeIntent,GetAttractionInfo,GetWeatherInfo,CheckWeatherAPI,ProvidePlanningHelp,QueryDatabase,ProvideGeneralInfo,FormatResponse,ShowResponse,OfferFollowUp,GetMoreDetails,GetRelatedInfo,EndConversation,SaveConversation,CollectFeedback,SaveFeedback,ShowClarification,UserClarifies process
    class SelectLanguage,QueryType,UserFollowUp,FollowUpType,ShowFeedback,InputError decision
    class ShowError error
    class SetEnglish,SetSpanish,SetTagalog language
```

## User Review Submission Activity Diagram (Mermaid)

```mermaid
flowchart TD
    ReviewStart([User Wants to Write Review]) --> UserLoggedIn{User Logged In?}
    
    UserLoggedIn -->|No| RequireLogin[Require User Login]
    UserLoggedIn -->|Yes| SelectAttraction[Select Attraction to Review]
    
    RequireLogin --> LoginProcess[User Login Process]
    LoginProcess --> SelectAttraction
    
    SelectAttraction --> CheckExistingReview{Has User Reviewed This?}
    CheckExistingReview -->|Yes| ShowExistingReview[Show Existing Review]
    CheckExistingReview -->|No| StartNewReview[Start New Review]
    
    ShowExistingReview --> EditOrNew{Edit Existing or Create New?}
    EditOrNew -->|Edit| LoadExistingData[Load Existing Review Data]
    EditOrNew -->|New| CannotReview[Show: Cannot Review Twice]
    CannotReview --> ReviewComplete([Review Process Complete])
    
    LoadExistingData --> EditReviewForm[Edit Review Form]
    StartNewReview --> NewReviewForm[New Review Form]
    
    EditReviewForm --> EnterRating[Enter/Update Star Rating]
    NewReviewForm --> EnterRating
    
    EnterRating --> RatingValid{Rating Between 1-5?}
    RatingValid -->|No| ShowRatingError[Show Rating Error]
    RatingValid -->|Yes| EnterComment[Enter Review Comment]
    ShowRatingError --> EnterRating
    
    EnterComment --> CommentLength{Comment Length OK?}
    CommentLength -->|Too Short| ShowLengthError[Show: Comment Too Short]
    CommentLength -->|Too Long| ShowLengthError
    CommentLength -->|Valid| ValidateContent[Validate Content]
    ShowLengthError --> EnterComment
    
    ValidateContent --> ContentClean{Content Appropriate?}
    ContentClean -->|No| ShowContentError[Show: Inappropriate Content]
    ContentClean -->|Yes| UploadPhotos{Upload Photos?}
    ShowContentError --> EnterComment
    
    UploadPhotos -->|Yes| SelectPhotos[Select Photos to Upload]
    UploadPhotos -->|No| PreviewReview[Preview Review]
    
    SelectPhotos --> ValidatePhotos[Validate Photo Format/Size]
    ValidatePhotos --> PhotosValid{Photos Valid?}
    PhotosValid -->|No| ShowPhotoError[Show Photo Error]
    PhotosValid -->|Yes| UploadToCloud[Upload to Cloudinary]
    ShowPhotoError --> SelectPhotos
    
    UploadToCloud --> PreviewReview
    PreviewReview --> UserConfirm{User Confirms Submission?}
    
    UserConfirm -->|No| BackToEdit[Back to Edit Form]
    UserConfirm -->|Yes| SubmitReview[Submit Review]
    BackToEdit --> EditReviewForm
    
    SubmitReview --> SaveToDatabase[Save to Database]
    SaveToDatabase --> SetPendingStatus[Set Status: Pending Approval]
    SetPendingStatus --> NotifyModerators[Notify Moderators]
    NotifyModerators --> ShowSuccessMessage[Show Success Message]
    ShowSuccessMessage --> OfferMoreReviews{Review Another Attraction?}
    
    OfferMoreReviews -->|Yes| SelectAttraction
    OfferMoreReviews -->|No| ReviewComplete
    
    %% Error Handling
    SaveToDatabase --> DatabaseError{Database Error?}
    DatabaseError -->|Yes| ShowDatabaseError[Show Database Error]
    DatabaseError -->|No| SetPendingStatus
    ShowDatabaseError --> UserConfirm
    
    %% Styling
    classDef startEnd fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef process fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef error fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    
    class ReviewStart,ReviewComplete startEnd
    class RequireLogin,LoginProcess,SelectAttraction,ShowExistingReview,LoadExistingData,EditReviewForm,StartNewReview,NewReviewForm,EnterRating,EnterComment,ValidateContent,SelectPhotos,ValidatePhotos,UploadToCloud,PreviewReview,BackToEdit,SubmitReview,SaveToDatabase,SetPendingStatus,NotifyModerators process
    class UserLoggedIn,CheckExistingReview,EditOrNew,RatingValid,CommentLength,ContentClean,UploadPhotos,PhotosValid,UserConfirm,OfferMoreReviews,DatabaseError decision
    class ShowRatingError,ShowLengthError,ShowContentError,ShowPhotoError,ShowDatabaseError,CannotReview error
    class ShowSuccessMessage success
```

---

## PlantUML Activity Diagrams

```plantuml
@startuml TripPlanningActivity
title Trip Planning Activity Diagram

start
:User starts trip planning;

if (User logged in?) then (no)
    :Register new account;
    :Login with credentials;
else (yes)
endif

:Go to dashboard;
:Browse available attractions;

if (Apply filters?) then (yes)
    :Apply category/location filter;
else (no)
endif

:Select attraction;
:View attraction details;
:Check weather information;

if (Add to itinerary?) then (no)
    :Select another attraction;
    stop
else (yes)
endif

if (Has existing itinerary?) then (no)
    :Create new itinerary;
    :Set title, date, description;
else (yes)
endif

:Add attraction to itinerary;

if (Add more attractions?) then (yes)
    :Select another attraction;
    backward:Browse available attractions;
else (no)
endif

:Optimize route order;
:Review complete itinerary;
:Save itinerary;

if (Share itinerary?) then (yes)
    :Generate share link;
else (no)
endif

stop

@enduml
```

```plantuml
@startuml ChatbotActivity
title Chatbot Interaction Activity Diagram

start
:User needs tourism help;
:Open chatbot interface;

switch (Select language?)
case (English)
    :Set language: English;
case (Spanish)  
    :Set language: Spanish;
case (Tagalog)
    :Set language: Tagalog;
endswitch

:Start new conversation;
:Show welcome message;

repeat
    :User types question/request;
    :Process user input;
    :Analyze user intent;
    
    switch (Query type?)
    case (Attraction info)
        :Retrieve attraction information;
    case (Weather query)
        :Get weather data;
    case (Travel planning)
        :Provide planning assistance;
    case (General help)
        :Provide general tourism info;
    case (Unknown)
        :Ask for clarification;
        :Show clarification options;
        :User provides clarification;
        backward:Process user input;
    endswitch
    
    :Format response message;
    :Display response to user;
    :Offer follow-up questions;
    
repeat while (User wants to continue?) is (yes)
->no;

:End conversation;
:Save conversation history;

if (Request feedback?) then (yes)
    :Collect user feedback;
    :Save feedback to database;
else (no)
endif

stop

@enduml
```

---

**Usage Instructions:**
1. Copy any activity diagram code and paste into Mermaid Live Editor (https://mermaid.live/) or PlantUML online
2. The diagrams show detailed workflows for key system processes
3. Use these diagrams for system documentation, user training, and development planning
4. Each diagram includes error handling and decision points for complete workflow coverage