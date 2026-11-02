import * as React from 'react';

declare module '@radix-ui/react-checkbox' {
  export interface CheckboxIndicatorProps {
    children?: React.ReactNode;
    className?: string;
  }
}

declare module '@radix-ui/react-dialog' {
  export interface DialogTriggerProps {
    children?: React.ReactNode;
    asChild?: boolean;
    className?: string;
  }
  export interface DialogOverlayProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface DialogContentProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface DialogTitleProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface DialogDescriptionProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface DialogCloseProps {
    children?: React.ReactNode;
    className?: string;
  }
}

declare module '@radix-ui/react-select' {
  export interface SelectTriggerProps {
    children?: React.ReactNode;
    className?: string;
    id?: string;
    asChild?: boolean;
  }
  export interface SelectContentProps {
    children?: React.ReactNode;
    className?: string;
    asChild?: boolean;
  }
  export interface SelectItemProps {
    children?: React.ReactNode;
    className?: string;
    asChild?: boolean;
  }
  export interface SelectIconProps {
    children?: React.ReactNode;
    className?: string;
    asChild?: boolean;
  }
  export interface SelectViewportProps {
    children?: React.ReactNode;
    className?: string;
  }
}

declare module '@radix-ui/react-switch' {
  export interface SwitchThumbProps {
    className?: string;
  }
}

declare module '@radix-ui/react-tabs' {
  export interface TabsListProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface TabsTriggerProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface TabsContentProps {
    children?: React.ReactNode;
    className?: string;
  }
}

declare module '@radix-ui/react-accordion' {
  export interface AccordionMultipleProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface AccordionSingleProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface AccordionHeaderProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface AccordionTriggerProps {
    children?: React.ReactNode;
    className?: string;
  }
  export interface AccordionContentProps {
    children?: React.ReactNode;
    className?: string;
  }
}
