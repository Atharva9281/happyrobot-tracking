export interface Database {
  public: {
    Tables: {
      shipments: {
        Row: {
          id: string
          user_id: string
          shipment_number: string
          status: 'pending' | 'in_transit' | 'delivered' | 'delayed'
          origin_address: string
          origin_lat: number
          origin_lng: number
          dest_address: string
          dest_lat: number
          dest_lng: number
          current_lat: number
          current_lng: number
          progress_percentage: number
          route_encoded: string | null
          distance_km: number | null
          estimated_duration_hours: number | null
          started_at: string
          eta: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shipment_number: string
          status?: 'pending' | 'in_transit' | 'delivered' | 'delayed'
          origin_address: string
          origin_lat: number
          origin_lng: number
          dest_address: string
          dest_lat: number
          dest_lng: number
          current_lat?: number
          current_lng?: number
          progress_percentage?: number
          route_encoded?: string | null
          distance_km?: number | null
          estimated_duration_hours?: number | null
          started_at?: string
          eta?: string | null
        }
        Update: {
          current_lat?: number
          current_lng?: number
          progress_percentage?: number
          status?: 'pending' | 'in_transit' | 'delivered' | 'delayed'
          eta?: string | null
          updated_at?: string
        }
      }
      communications: {
        Row: {
          id: string
          shipment_id: string
          type: 'call' | 'email' | 'sms' | 'ai_action' | 'update'
          message: string
          metadata: Record<string, any>
          timestamp: string
          created_by: string | null
        }
        Insert: {
          shipment_id: string
          type: 'call' | 'email' | 'sms' | 'ai_action' | 'update'
          message: string
          metadata?: Record<string, any>
          created_by?: string | null
        }
      }
    }
  }
}

// Export types for easy use
export type Shipment = Database['public']['Tables']['shipments']['Row']
export type ShipmentInsert = Database['public']['Tables']['shipments']['Insert']
export type ShipmentUpdate = Database['public']['Tables']['shipments']['Update']

export type Communication = Database['public']['Tables']['communications']['Row']
export type CommunicationInsert = Database['public']['Tables']['communications']['Insert']