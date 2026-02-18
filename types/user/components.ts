import type { Asset } from "@/types/asset";
import type { CartItem } from "@/types/cart";
import type { ReactNode } from "react";

export type AssetCardProps = {
  item: Asset;
  onAdd: (item: CartItem) => void;
  onAddedSuccess?: () => void;
  type?: "peminjaman" | "permintaan";
  addModal?: "office" | "default" | "kategori";
  allItems?: Asset[];
  loading?: boolean;
};

export interface NavbarProps {
  title: string;
  breadcrumb?: string[];
  leftAction?: ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  cartCount?: number;
  onCartClick?: () => void;
  showCart?: boolean;
  showSearch?: boolean;
  rightAction?: ReactNode;
  cartLabel?: string;
}

export type SidebarProps = {
  className?: string;
  onToggle?: (v: boolean) => void;
};

export interface SidebarItemProps {
  href: string;
  label: string;
  icon?: ReactNode;
  collapsed: boolean;
}

export interface SidebarGroupProps {
  title: string;
  icon?: ReactNode;
  collapsed: boolean;
  children?: ReactNode;
}
