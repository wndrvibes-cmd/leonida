export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["ai_role"]
          sources: Json
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["ai_role"]
          sources?: Json
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["ai_role"]
          sources?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          messages: number
          usage_date: string
          user_id: string
        }
        Insert: {
          messages?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          messages?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_hidden: boolean
          parent_id: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          category: string
          conditions: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          link_url: string | null
          slug: string
          source_name: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          link_url?: string | null
          slug: string
          source_name?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          conditions?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          link_url?: string | null
          slug?: string
          source_name?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_type"]
          user_id?: string
        }
        Relationships: []
      }
      map_categories: {
        Row: {
          accent: string
          icon: string
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          accent?: string
          icon?: string
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          accent?: string
          icon?: string
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      map_markers: {
        Row: {
          author_id: string | null
          author_tested: boolean
          category_id: string | null
          created_at: string
          description: string | null
          estimated_reward: string | null
          favorite_count: number
          id: string
          image_url: string | null
          instructions: string | null
          is_official: boolean
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["marker_status"]
          title: string
          updated_at: string
          verification: Database["public"]["Enums"]["verification_level"]
          x: number
          y: number
        }
        Insert: {
          author_id?: string | null
          author_tested?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          estimated_reward?: string | null
          favorite_count?: number
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_official?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["marker_status"]
          title: string
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_level"]
          x: number
          y: number
        }
        Update: {
          author_id?: string | null
          author_tested?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          estimated_reward?: string | null
          favorite_count?: number
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_official?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["marker_status"]
          title?: string
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_level"]
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_markers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "map_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt: string | null
          bucket: string
          created_at: string
          credit: string | null
          folder: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          path: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          bucket: string
          created_at?: string
          credit?: string | null
          folder?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          bucket?: string
          created_at?: string
          credit?: string | null
          folder?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          allow_comments: boolean
          author_id: string | null
          body: string | null
          category_id: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          reliability: Database["public"]["Enums"]["reliability"]
          slug: string
          source_name: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          allow_comments?: boolean
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          reliability?: Database["public"]["Enums"]["reliability"]
          slug: string
          source_name?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          allow_comments?: boolean
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          reliability?: Database["public"]["Enums"]["reliability"]
          slug?: string
          source_name?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          accent: string
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          accent?: string
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          accent?: string
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      news_media: {
        Row: {
          article_id: string
          caption: string | null
          credit: string | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          sort_order: number
          url: string
        }
        Insert: {
          article_id: string
          caption?: string | null
          credit?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          url: string
        }
        Update: {
          article_id?: string
          caption?: string | null
          credit?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_media_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["target_type"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["target_type"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["target_type"] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      post_media: {
        Row: {
          caption: string | null
          created_at: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          post_id: string
          sort_order: number
          url: string
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          post_id: string
          sort_order?: number
          url: string
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          post_id?: string
          sort_order?: number
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string | null
          comment_count: number
          created_at: string
          hidden_reason: string | null
          id: string
          is_hidden: boolean
          is_pinned: boolean
          post_type: Database["public"]["Enums"]["post_type"]
          reaction_count: number
          surface: Database["public"]["Enums"]["post_surface"]
          tags: string[]
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          comment_count?: number
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          post_type?: Database["public"]["Enums"]["post_type"]
          reaction_count?: number
          surface?: Database["public"]["Enums"]["post_surface"]
          tags?: string[]
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          comment_count?: number
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          post_type?: Database["public"]["Enums"]["post_type"]
          reaction_count?: number
          surface?: Database["public"]["Enums"]["post_surface"]
          tags?: string[]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_suspended: boolean
          location: string | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_suspended?: boolean
          location?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_suspended?: boolean
          location?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      radar_findings: {
        Row: {
          body_draft: string | null
          created_at: string
          dedupe_hash: string
          id: string
          image_note: string | null
          image_url: string | null
          image_usable: boolean
          kind: Database["public"]["Enums"]["radar_kind"]
          linked_article_id: string | null
          linked_contest_id: string | null
          reliability: Database["public"]["Enums"]["reliability"]
          reviewed_by: string | null
          run_id: string | null
          source_name: string
          source_published_at: string | null
          source_url: string
          status: Database["public"]["Enums"]["finding_status"]
          suggested_category: string | null
          suggested_tags: string[]
          summary_fr: string | null
          title_fr: string | null
          title_original: string | null
        }
        Insert: {
          body_draft?: string | null
          created_at?: string
          dedupe_hash: string
          id?: string
          image_note?: string | null
          image_url?: string | null
          image_usable?: boolean
          kind?: Database["public"]["Enums"]["radar_kind"]
          linked_article_id?: string | null
          linked_contest_id?: string | null
          reliability?: Database["public"]["Enums"]["reliability"]
          reviewed_by?: string | null
          run_id?: string | null
          source_name: string
          source_published_at?: string | null
          source_url: string
          status?: Database["public"]["Enums"]["finding_status"]
          suggested_category?: string | null
          suggested_tags?: string[]
          summary_fr?: string | null
          title_fr?: string | null
          title_original?: string | null
        }
        Update: {
          body_draft?: string | null
          created_at?: string
          dedupe_hash?: string
          id?: string
          image_note?: string | null
          image_url?: string | null
          image_usable?: boolean
          kind?: Database["public"]["Enums"]["radar_kind"]
          linked_article_id?: string | null
          linked_contest_id?: string | null
          reliability?: Database["public"]["Enums"]["reliability"]
          reviewed_by?: string | null
          run_id?: string | null
          source_name?: string
          source_published_at?: string | null
          source_url?: string
          status?: Database["public"]["Enums"]["finding_status"]
          suggested_category?: string | null
          suggested_tags?: string[]
          summary_fr?: string | null
          title_fr?: string | null
          title_original?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "radar_findings_linked_article_id_fkey"
            columns: ["linked_article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radar_findings_linked_contest_id_fkey"
            columns: ["linked_contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radar_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "radar_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          items_duplicate: number
          items_found: number
          items_new: number
          kind: Database["public"]["Enums"]["radar_kind"]
          metadata: Json
          provider: string | null
          quota_note: string | null
          sources_checked: number
          started_at: string
          status: Database["public"]["Enums"]["radar_status"]
          trigger: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_duplicate?: number
          items_found?: number
          items_new?: number
          kind?: Database["public"]["Enums"]["radar_kind"]
          metadata?: Json
          provider?: string | null
          quota_note?: string | null
          sources_checked?: number
          started_at?: string
          status?: Database["public"]["Enums"]["radar_status"]
          trigger?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_duplicate?: number
          items_found?: number
          items_new?: number
          kind?: Database["public"]["Enums"]["radar_kind"]
          metadata?: Json
          provider?: string | null
          quota_note?: string | null
          sources_checked?: number
          started_at?: string
          status?: Database["public"]["Enums"]["radar_status"]
          trigger?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_type"]
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          internal_note: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          internal_note?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["target_type"]
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          internal_note?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_type"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          plan_code: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          plan_code?: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          plan_code?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          background_dim: number
          background_enabled: boolean
          background_position: string
          background_scale: number
          background_url: string | null
          created_at: string
          intro_seen_at: string | null
          locale: string
          notify_contests: boolean
          notify_moderation: boolean
          notify_news: boolean
          notify_reactions: boolean
          notify_replies: boolean
          reduce_motion: boolean
          show_intro: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          background_dim?: number
          background_enabled?: boolean
          background_position?: string
          background_scale?: number
          background_url?: string | null
          created_at?: string
          intro_seen_at?: string | null
          locale?: string
          notify_contests?: boolean
          notify_moderation?: boolean
          notify_news?: boolean
          notify_reactions?: boolean
          notify_replies?: boolean
          reduce_motion?: boolean
          show_intro?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          background_dim?: number
          background_enabled?: boolean
          background_position?: string
          background_scale?: number
          background_url?: string | null
          created_at?: string
          intro_seen_at?: string | null
          locale?: string
          notify_contests?: boolean
          notify_moderation?: boolean
          notify_news?: boolean
          notify_reactions?: boolean
          notify_replies?: boolean
          reduce_motion?: boolean
          show_intro?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_premium: { Args: { _user_id?: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_suspended: { Args: never; Returns: boolean }
      storage_owns_path: { Args: { _name: string }; Returns: boolean }
    }
    Enums: {
      ai_role: "system" | "user" | "assistant"
      app_role: "member" | "moderator" | "admin"
      content_status: "draft" | "scheduled" | "published" | "archived"
      finding_status: "new" | "drafted" | "published" | "rejected" | "duplicate"
      marker_status: "draft" | "pending" | "approved" | "rejected"
      media_kind: "image" | "video" | "video_link"
      notification_type:
        | "comment_reply"
        | "post_comment"
        | "reaction"
        | "marker_approved"
        | "marker_rejected"
        | "report_resolved"
        | "subscription"
        | "contest"
        | "news"
        | "system"
      post_surface: "community" | "moment"
      post_type:
        | "discussion"
        | "tip"
        | "discovery"
        | "vehicle"
        | "mission"
        | "secret"
        | "question"
        | "screenshot"
        | "video"
        | "other"
      radar_kind: "news" | "gifts"
      radar_status: "running" | "success" | "partial" | "failed"
      reaction_type: "fire" | "love" | "wow" | "funny" | "useful"
      reliability: "official" | "reliable" | "community" | "rumor"
      report_reason:
        | "spam"
        | "harassment"
        | "hate"
        | "nsfw"
        | "misinformation"
        | "off_topic"
        | "stolen_content"
        | "other"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "unpaid"
        | "paused"
      target_type: "post" | "news" | "marker" | "comment" | "contest"
      verification_level:
        | "unverified"
        | "author_tested"
        | "community_confirmed"
        | "staff_verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_role: ["system", "user", "assistant"],
      app_role: ["member", "moderator", "admin"],
      content_status: ["draft", "scheduled", "published", "archived"],
      finding_status: ["new", "drafted", "published", "rejected", "duplicate"],
      marker_status: ["draft", "pending", "approved", "rejected"],
      media_kind: ["image", "video", "video_link"],
      notification_type: [
        "comment_reply",
        "post_comment",
        "reaction",
        "marker_approved",
        "marker_rejected",
        "report_resolved",
        "subscription",
        "contest",
        "news",
        "system",
      ],
      post_surface: ["community", "moment"],
      post_type: [
        "discussion",
        "tip",
        "discovery",
        "vehicle",
        "mission",
        "secret",
        "question",
        "screenshot",
        "video",
        "other",
      ],
      radar_kind: ["news", "gifts"],
      radar_status: ["running", "success", "partial", "failed"],
      reaction_type: ["fire", "love", "wow", "funny", "useful"],
      reliability: ["official", "reliable", "community", "rumor"],
      report_reason: [
        "spam",
        "harassment",
        "hate",
        "nsfw",
        "misinformation",
        "off_topic",
        "stolen_content",
        "other",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
        "unpaid",
        "paused",
      ],
      target_type: ["post", "news", "marker", "comment", "contest"],
      verification_level: [
        "unverified",
        "author_tested",
        "community_confirmed",
        "staff_verified",
      ],
    },
  },
} as const
