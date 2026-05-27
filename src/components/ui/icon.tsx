"use client"

/**
 * Semantic icon map. The approved design uses a custom hospitality icon set;
 * the locked stack (CLAUDE.md) standardises on lucide-react. We map the
 * design's names to the closest lucide line icons at matching stroke weight,
 * so screen code keeps referencing icons by intent (Icon name="House").
 */
import {
  LayoutDashboard, CalendarRange, Plus, Sparkles, BedDouble, User, MessageCircle,
  LineChart, Settings, Home, ChevronDown, Search, Bell, ArrowRight, Clock,
  Calendar, MapPin, TriangleAlert, MoreVertical, LogOut, DollarSign,
  TrendingUp, Check, X, Pencil, Trash2, FileText, type LucideIcon,
} from "lucide-react"

const MAP = {
  Layout: LayoutDashboard,
  Grid: CalendarRange,
  Plus,
  Sparkles,
  Bed: BedDouble,
  User,
  Message: MessageCircle,
  Sparkline: LineChart,
  Settings,
  House: Home,
  ChevronDown,
  Search,
  Bell,
  ArrowRight,
  Clock,
  Calendar,
  Pin: MapPin,
  Alert: TriangleAlert,
  MoreVertical,
  Logout: LogOut,
  Dollar: DollarSign,
  TrendUp: TrendingUp,
  Check,
  X,
  Edit: Pencil,
  Trash: Trash2,
  File: FileText,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof MAP

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.6,
  className,
  style,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}) {
  const C = MAP[name]
  return <C size={size} strokeWidth={strokeWidth} className={className} style={style} />
}
