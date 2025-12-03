export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          title: string
          handle: string
          description: string | null
          price: number
          compare_at_price: number | null
          collection_id: string | null
          tags: string[] | null
          vendor: string | null
          product_type: string | null
          status: 'active' | 'draft' | 'archived'
          featured: boolean
          weight: number | null
          weight_unit: 'lb' | 'oz' | 'kg' | 'g'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          handle: string
          description?: string | null
          price: number
          compare_at_price?: number | null
          collection_id?: string | null
          tags?: string[] | null
          vendor?: string | null
          product_type?: string | null
          status?: 'active' | 'draft' | 'archived'
          featured?: boolean
          weight?: number | null
          weight_unit?: 'lb' | 'oz' | 'kg' | 'g'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          handle?: string
          description?: string | null
          price?: number
          compare_at_price?: number | null
          collection_id?: string | null
          tags?: string[] | null
          vendor?: string | null
          product_type?: string | null
          status?: 'active' | 'draft' | 'archived'
          featured?: boolean
          weight?: number | null
          weight_unit?: 'lb' | 'oz' | 'kg' | 'g'
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          title: string
          sku: string | null
          price: number
          compare_at_price: number | null
          inventory_quantity: number
          weight: number | null
          weight_unit: 'lb' | 'oz' | 'kg' | 'g'
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          option3_name: string | null
          option3_value: string | null
          available_for_sale: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title?: string
          sku?: string | null
          price: number
          compare_at_price?: number | null
          inventory_quantity?: number
          weight?: number | null
          weight_unit?: 'lb' | 'oz' | 'kg' | 'g'
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          available_for_sale?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string
          sku?: string | null
          price?: number
          compare_at_price?: number | null
          inventory_quantity?: number
          weight?: number | null
          weight_unit?: 'lb' | 'oz' | 'kg' | 'g'
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          available_for_sale?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt_text: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt_text?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt_text?: string | null
          position?: number
          created_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          title: string
          handle: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          handle: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          handle?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          shipping_address_line1: string
          shipping_address_line2: string | null
          shipping_city: string
          shipping_state: string
          shipping_postal_code: string
          shipping_country: string
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_state: string | null
          billing_postal_code: string | null
          billing_country: string | null
          subtotal: number
          shipping_cost: number
          tax: number
          discount: number
          total: number
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_intent_id: string | null
          shipping_method: string | null
          tracking_number: string | null
          tracking_url: string | null
          notes: string | null
          discount_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          shipping_address_line1: string
          shipping_address_line2?: string | null
          shipping_city: string
          shipping_state: string
          shipping_postal_code: string
          shipping_country?: string
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          subtotal: number
          shipping_cost?: number
          tax?: number
          discount?: number
          total: number
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_intent_id?: string | null
          shipping_method?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          notes?: string | null
          discount_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          shipping_address_line1?: string
          shipping_address_line2?: string | null
          shipping_city?: string
          shipping_state?: string
          shipping_postal_code?: string
          shipping_country?: string
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          subtotal?: number
          shipping_cost?: number
          tax?: number
          discount?: number
          total?: number
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_intent_id?: string | null
          shipping_method?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          notes?: string | null
          discount_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          title: string
          variant_title: string | null
          sku: string | null
          quantity: number
          price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variant_id?: string | null
          title: string
          variant_title?: string | null
          sku?: string | null
          quantity: number
          price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          variant_id?: string | null
          title?: string
          variant_title?: string | null
          sku?: string | null
          quantity?: number
          price?: number
          total?: number
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          accepts_marketing: boolean
          total_orders: number
          total_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          accepts_marketing?: boolean
          total_orders?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          accepts_marketing?: boolean
          total_orders?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
      }
      shipping_zones: {
        Row: {
          id: string
          name: string
          countries: string[]
          states: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          countries: string[]
          states?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          countries?: string[]
          states?: string[] | null
          created_at?: string
        }
      }
      shipping_rates: {
        Row: {
          id: string
          zone_id: string
          name: string
          min_weight: number | null
          max_weight: number | null
          min_price: number | null
          max_price: number | null
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          zone_id: string
          name: string
          min_weight?: number | null
          max_weight?: number | null
          min_price?: number | null
          max_price?: number | null
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          zone_id?: string
          name?: string
          min_weight?: number | null
          max_weight?: number | null
          min_price?: number | null
          max_price?: number | null
          price?: number
          created_at?: string
        }
      }
      discount_codes: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'fixed' | 'free_shipping'
          value: number
          min_purchase: number | null
          max_uses: number | null
          uses: number
          starts_at: string | null
          ends_at: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          type: 'percentage' | 'fixed' | 'free_shipping'
          value: number
          min_purchase?: number | null
          max_uses?: number | null
          uses?: number
          starts_at?: string | null
          ends_at?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'percentage' | 'fixed' | 'free_shipping'
          value?: number
          min_purchase?: number | null
          max_uses?: number | null
          uses?: number
          starts_at?: string | null
          ends_at?: string | null
          active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert']

export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type ProductImageInsert = Database['public']['Tables']['product_images']['Insert']

export type Collection = Database['public']['Tables']['collections']['Row']
export type CollectionInsert = Database['public']['Tables']['collections']['Insert']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']

export type ShippingZone = Database['public']['Tables']['shipping_zones']['Row']
export type ShippingRate = Database['public']['Tables']['shipping_rates']['Row']

export type DiscountCode = Database['public']['Tables']['discount_codes']['Row']

// Extended types with relations
export interface ProductWithDetails extends Product {
  variants: ProductVariant[]
  images: ProductImage[]
  collection: Collection | null
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

