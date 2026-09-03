// Modern SVG Icon Components for NaujanGO
// Replace all emojis with these professional icons

import React from 'react';

const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24"
};

// Document and admin icons
export const DocumentIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);

export const ChartPieIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M21 12.79A9 9 0 1111.21 3v9.58h9.58z" />
  </svg>
);

export const RouteIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M6 9v3a9 9 0 009 9h3" />
  </svg>
);

export const ChartLineUpIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M3 17h18" />
  </svg>
);

export const ArchiveIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2" />
    <path d="M10 12h4" />
  </svg>
);

// Navigation & UI Icons
export const MapIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

export const LocationIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const HotelIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export const AttractionIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const StarIcon = ({ size = 24, className = "", filled = false }) => (
  <svg width={size} height={size} className={className} {...iconProps} fill={filled ? "currentColor" : "none"}>
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

export const CalendarIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const UserIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const PhoneIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

export const EmailIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const GlobeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const SparklesIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export const HeartIcon = ({ size = 24, className = "", filled = false }) => (
  <svg width={size} height={size} className={className} {...iconProps} fill={filled ? "currentColor" : "none"}>
    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const SearchIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const FilterIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

export const ClockIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const MoneyIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const CheckIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const XIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const ChevronLeftIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M15 19l-7-7 7-7" />
  </svg>
);

export const ChevronRightIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const ChevronUpIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M19 15l-7-7-7 7" />
  </svg>
);

export const MenuIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const BookingIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

export const ShieldIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export const LogoutIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export const ChatIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export const SunIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export const CloudIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

export const EyeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const EyeOffIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export const PhotoIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const FilmIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 8h20M2 16h20M8 4v16M16 4v16" />
  </svg>
);

export const PaletteIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="11" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
    <circle cx="17" cy="14" r="1" fill="currentColor" />
    <path d="M12 22c1.1 0 2-.9 2-2 0-1.1-2-4-2-4s-2 2.9-2 4c0 1.1.9 2 2 2z" />
  </svg>
);

export const TypeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M4 7V4h16v3M9 20h6M12 4v16" />
  </svg>
);

export const MegaphoneIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3 11v2a6 6 0 006 6h1l2 2 2-2h1a6 6 0 000-12h-1L12 5l-2 2H9A6 6 0 003 13V11z" />
    <path d="M11 11h.01M16 11h.01" />
    <path d="M3 11l18-6" />
    <path d="M3 13l18 6" />
  </svg>
);

export const BellMegaphoneIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
    <path d="M21 8c0-2.4-.8-4.7-2.3-6.5" />
    <path d="M3 8C3 5.6 3.8 3.3 5.3 1.5" />
  </svg>
);

export const LayoutIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

export const PencilIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const MapPinIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const UtensilsIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M3 2v7a4 4 0 004 4h2a4 4 0 004-4V2M9 2v7m6-7v8a2 2 0 112 2m0 0h2m-4-6l2 2m0 0l2-2m-2 2v5" />
  </svg>
);

export const LoaderIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0110 10" style={{ animation: 'spin 1s linear infinite' }} strokeDasharray="15.7" />
  </svg>
);

export const WavesIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M2 6.5c1.395-1.165 3.19-1.865 5-1.865 1.81 0 3.605.7 5 1.865 1.395-1.165 3.19-1.865 5-1.865 1.81 0 3.605.7 5 1.865M2 12c1.395-1.165 3.19-1.865 5-1.865 1.81 0 3.605.7 5 1.865 1.395-1.165 3.19-1.865 5-1.865 1.81 0 3.605.7 5 1.865M2 17.5c1.395-1.165 3.19-1.865 5-1.865 1.81 0 3.605.7 5 1.865 1.395-1.165 3.19-1.865 5-1.865 1.81 0 3.605.7 5 1.865" />
  </svg>
);

export const UsersIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

export const LeafIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M11 22c5.523 0 10-1.343 10-3s-4.477-3-10-3-10 1.343-10 3 4.477 3 10 3z" />
    <path d="M7.73 13.3a7.673 7.673 0 0 1 6.77-3.4c2.5 0 4.817.88 6.387 2.41" />
  </svg>
);

export const MountainIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M8 3l4 7 4-7m3 14H5l.5-5L12 5l6.5 7.5L19 20z" />
  </svg>
);

export const InfoIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const UploadIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const Edit2Icon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const PlusIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} className={className} {...iconProps}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Export all icons as a collection
export const Icons = {
  // Primary names
  Map: MapIcon,
  Location: LocationIcon,
  MapPin: MapPinIcon,
  Hotel: HotelIcon,
  Attraction: AttractionIcon,
  Star: StarIcon,
  Calendar: CalendarIcon,
  User: UserIcon,
  Phone: PhoneIcon,
  Email: EmailIcon,
  Globe: GlobeIcon,
  Sparkles: SparklesIcon,
  Loader: LoaderIcon,
  Waves: WavesIcon,
  Users: UsersIcon,
  Leaf: LeafIcon,
  Mountain: MountainIcon,
  Info: InfoIcon,
  Heart: HeartIcon,
  Search: SearchIcon,
  Filter: FilterIcon,
  Clock: ClockIcon,
  Money: MoneyIcon,
  Check: CheckIcon,
  X: XIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  ChevronUp: ChevronUpIcon,
  Menu: MenuIcon,
  Booking: BookingIcon,
  Shield: ShieldIcon,
  Logout: LogoutIcon,
  Chat: ChatIcon,
  Sun: SunIcon,
  Cloud: CloudIcon,
  Eye: EyeIcon,
  EyeOff: EyeOffIcon,
  ChartPie: ChartPieIcon,
  Route: RouteIcon,
  ChartLineUp: ChartLineUpIcon,
  Archive: ArchiveIcon,
  Document: DocumentIcon,
  Photo: PhotoIcon,
  Film: FilmIcon,
  Palette: PaletteIcon,
  Type: TypeIcon,
  Megaphone: MegaphoneIcon,
  Bell: BellMegaphoneIcon,
  Layout: LayoutIcon,
  Pencil: PencilIcon,
  Utensils: UtensilsIcon,
  Upload: UploadIcon,
  Edit2: Edit2Icon,
  Plus: PlusIcon,
  // Aliases with "Icon" suffix for compatibility
  MapIcon: MapIcon,
  LocationIcon: LocationIcon,
  MapPinIcon: MapPinIcon,
  HotelIcon: HotelIcon,
  AttractionIcon: AttractionIcon,
  StarIcon: StarIcon,
  CalendarIcon: CalendarIcon,
  UserIcon: UserIcon,
  PhoneIcon: PhoneIcon,
  EmailIcon: EmailIcon,
  GlobeIcon: GlobeIcon,
  SparklesIcon: SparklesIcon,
  LoaderIcon: LoaderIcon,
  WavesIcon: WavesIcon,
  UsersIcon: UsersIcon,
  LeafIcon: LeafIcon,
  MountainIcon: MountainIcon,
  InfoIcon: InfoIcon,
  HeartIcon: HeartIcon,
  SearchIcon: SearchIcon,
  FilterIcon: FilterIcon,
  ClockIcon: ClockIcon,
  MoneyIcon: MoneyIcon,
  CheckIcon: CheckIcon,
  XIcon: XIcon,
  ChevronLeftIcon: ChevronLeftIcon,
  ChevronRightIcon: ChevronRightIcon,
  ChevronUpIcon: ChevronUpIcon,
  MenuIcon: MenuIcon,
  BookingIcon: BookingIcon,
  ShieldIcon: ShieldIcon,
  LogoutIcon: LogoutIcon,
  ChatIcon: ChatIcon,
  SunIcon: SunIcon,
  CloudIcon: CloudIcon,
  EyeIcon: EyeIcon,
  EyeOffIcon: EyeOffIcon,
  ChartPieIcon: ChartPieIcon,
  RouteIcon: RouteIcon,
  ChartLineUpIcon: ChartLineUpIcon,
  ArchiveIcon: ArchiveIcon,
  DocumentIcon: DocumentIcon,
  PhotoIcon: PhotoIcon,
  FilmIcon: FilmIcon,
  PaletteIcon: PaletteIcon,
  TypeIcon: TypeIcon,
  MegaphoneIcon: MegaphoneIcon,
  BellIcon: BellMegaphoneIcon,
  LayoutIcon: LayoutIcon,
  PencilIcon: PencilIcon,
  UtensilsIcon: UtensilsIcon,
  UploadIcon: UploadIcon,
  Edit2Icon: Edit2Icon,
  PlusIcon: PlusIcon,
};

export default Icons;
