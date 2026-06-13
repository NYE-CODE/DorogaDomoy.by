// Atoms
export {
  Button,
  buttonVariants,
  Input,
  Text,
  Icon,
  Badge,
  badgeVariants,
  Spinner,
} from './atoms';
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  InputProps,
  TextProps,
  TextVariant,
  TextAs,
  IconProps,
  IconSize,
  BadgeProps,
  BadgeVariant,
  SpinnerProps,
  SpinnerSize,
} from './atoms';

// Molecules
export {
  FormField,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  Modal,
  ModalTrigger,
  ModalClose,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  DropdownItem,
  DropdownGroup,
  DropdownLabel,
  DropdownSeparator,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './molecules';
export type {
  FormFieldProps,
  CardProps,
  ModalProps,
  ModalContentProps,
  ModalHeaderProps,
  DropdownProps,
  DropdownItemProps,
} from './molecules';

// Organisms (UI shells — не путать с widgets/layout/Header)
export {
  Header as UiHeader,
  Sidebar,
  DataTable,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Form as UiForm,
} from './organisms';
export type {
  HeaderOrganismProps,
  SidebarOrganismProps,
  DataTableOrganismProps,
  FormOrganismProps,
} from './organisms';

// Legacy primitives (Radix/shadcn) — постепенно заменяются molecules/atoms
export * from './_primitives/accordion';
export * from './_primitives/alert';
export * from './_primitives/aspect-ratio';
export * from './_primitives/avatar';
export * from './_primitives/breadcrumb';
export * from './_primitives/calendar';
export * from './_primitives/checkbox';
export * from './_primitives/collapsible';
export * from './_primitives/command';
export * from './_primitives/context-menu';
export * from './_primitives/dropdown-menu';
export * from './_primitives/empty-state';
export * from './_primitives/hover-card';
export * from './_primitives/menubar';
export * from './_primitives/navigation-menu';
export * from './_primitives/page-loader';
export * from './_primitives/popover';
export * from './_primitives/progress';
export * from './_primitives/radio-group';
export * from './_primitives/resizable';
export * from './_primitives/scroll-area';
export * from './_primitives/skeleton';
export * from './_primitives/slider';
export * from './_primitives/switch';
export * from './_primitives/table';
export * from './_primitives/tabs';
export * from './_primitives/textarea';
export * from './_primitives/toggle';
export * from './_primitives/toggle-group';
export * from './_primitives/tooltip';

export { cn } from '@/shared/lib/classNames';
export { useScrollLock } from './_primitives/use-scroll-lock';
export { useIsMobile } from '@/shared/hooks/use-mobile';
