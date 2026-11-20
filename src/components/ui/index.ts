/**
 * Bibliotheque de primitives LEONIDA.
 * Tous les modules de l'application importent depuis ce point d'entree :
 *   import { Button, Card, useToast } from '@/components/ui'
 */

export { Avatar } from './Avatar'
export type { AvatarProps, AvatarSize } from './Avatar'

export { Badge, asBadgeTone } from './Badge'
export type { BadgeProps, BadgeSize, BadgeTone } from './Badge'

export { Button } from './Button'
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button'

export { Card, CardHeader } from './Card'
export type { CardPadding, CardProps, CardVariant } from './Card'

export { ConfirmDialog } from './ConfirmDialog'
export type { ConfirmDialogProps } from './ConfirmDialog'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

export { ErrorState } from './ErrorState'
export type { ErrorStateProps } from './ErrorState'

export { Field, fieldIds } from './Field'
export type { FieldIds, FieldProps } from './Field'

export { Icon } from './Icon'
export type { IconName, IconProps } from './Icon'

export { ImageUploader } from './ImageUploader'
export type { ImageUploaderProps } from './ImageUploader'

export { Input } from './Input'
export type { InputProps } from './Input'

export { Modal } from './Modal'
export type { ModalProps, ModalSize } from './Modal'

export { Select } from './Select'
export type { SelectOption, SelectProps } from './Select'

export { Sheet } from './Sheet'
export type { SheetProps } from './Sheet'

export { Skeleton, SkeletonAvatar } from './Skeleton'
export type { SkeletonProps, SkeletonRadius } from './Skeleton'

export { Spinner } from './Spinner'
export type { SpinnerProps, SpinnerSize } from './Spinner'

export { Switch } from './Switch'
export type { SwitchProps } from './Switch'

export { Tabs } from './Tabs'
export type { TabItem, TabsProps } from './Tabs'

export { Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'

export { Toast } from './Toast'
export type { ToastInput, ToastItem, ToastProps, ToastRenderer, ToastVariant } from './Toast'

export { ToastProvider, useToast } from './ToastProvider'

/* ----------------------------------------------------- aides internes utiles */
export { cx } from './cx'
export { MOBILE_QUERY, useIsMobile, useMediaQuery } from './useMediaQuery'
export { useBodyScrollLock, useEscapeKey, useFocusTrap } from './useOverlay'
