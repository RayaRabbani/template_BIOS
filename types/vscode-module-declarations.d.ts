declare module "@/components/asset-card" {
  import { ComponentType } from "react";
  const AssetCard: ComponentType<Record<string, unknown>>;
  export default AssetCard;
}

declare module "@/components/modals/user/cart-modal" {
  import { ComponentType } from "react";
  const CartModal: ComponentType<Record<string, unknown>>;
  export default CartModal;
}

declare module "@/types/cart" {
  export type CartItem = Record<string, unknown>;
}