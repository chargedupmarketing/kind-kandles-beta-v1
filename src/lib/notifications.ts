import { Resend } from 'resend';
import { createServerClient } from './supabase';

// =====================================================
// TYPES
// =====================================================

export type NotificationType = 
  | 'new_order'
  | 'new_review'
  | 'new_story'
  | 'new_contact'
  | 'new_event_booking'
  | 'low_inventory'
  | 'order_issues'
  | 'high_value_order';

export type RecipientType = 'admin' | 'customer';
export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered';
export type EntityType = 'order' | 'review' | 'story' | 'contact' | 'event' | 'product' | 'cart';

export interface NotificationPreference {
  id: string;
  admin_user_id: string;
  notification_type: NotificationType;
  email_enabled: boolean;
  sms_enabled: boolean;
}

export interface NotificationLog {
  id?: string;
  notification_type: string;
  recipient_type: RecipientType;
  recipient_email?: string;
  recipient_phone?: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject?: string;
  body?: string;
  error_message?: string;
  external_id?: string;
  related_entity_type?: EntityType;
  related_entity_id?: string;
  sent_at?: string;
  delivered_at?: string;
}

export interface NotificationTemplate {
  id: string;
  template_key: string;
  channel: NotificationChannel;
  subject?: string;
  body_template: string;
  is_active: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: string;
}

export interface SendNotificationOptions {
  type: NotificationType | string;
  recipientType: RecipientType;
  recipientEmail?: string;
  recipientPhone?: string;
  channels?: NotificationChannel[];
  templateKey?: string;
  variables?: Record<string, string | number>;
  subject?: string;
  body?: string;
  entityType?: EntityType;
  entityId?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  externalId?: string;
  error?: string;
}

// =====================================================
// CONFIGURATION
// =====================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const PINGRAM_CLIENT_ID = process.env.PINGRAM_CLIENT_ID;
const PINGRAM_CLIENT_SECRET = process.env.PINGRAM_CLIENT_SECRET;
const FROM_EMAIL = process.env.EMAIL_FROM || 'orders@kindkandlesboutique.com';
const ADMIN_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com';
const HIGH_VALUE_ORDER_THRESHOLD = parseInt(process.env.HIGH_VALUE_ORDER_THRESHOLD || '500', 10);

// Initialize Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// =====================================================
// NOTIFICATION SERVICE CLASS
// =====================================================

export class NotificationService {
  private supabase = createServerClient();

  // =====================================================
  // PUBLIC METHODS
  // =====================================================

  /**
   * Main entry point for sending notifications
   */
  async sendNotification(options: SendNotificationOptions): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const channels = options.channels || ['email'];

    for (const channel of channels) {
      try {
        let result: NotificationResult;

        if (channel === 'email') {
          result = await this.sendEmailNotification(options);
        } else if (channel === 'sms') {
          result = await this.sendSMSNotification(options);
        } else {
          result = { success: false, channel, error: `Unknown channel: ${channel}` };
        }

        // Log the notification
        await this.logNotification({
          notification_type: options.type,
          recipient_type: options.recipientType,
          recipient_email: options.recipientEmail,
          recipient_phone: options.recipientPhone,
          channel,
          status: result.success ? 'sent' : 'failed',
          subject: options.subject,
          body: options.body,
          error_message: result.error,
          external_id: result.externalId,
          related_entity_type: options.entityType,
          related_entity_id: options.entityId,
          sent_at: result.success ? new Date().toISOString() : undefined,
        });

        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ success: false, channel, error: errorMessage });
      }
    }

    return results;
  }

  /**
   * Send notifications to all admins who have enabled the notification type
   */
  async notifyAdmins(
    type: NotificationType,
    variables: Record<string, string | number>,
    entityType?: EntityType,
    entityId?: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    try {
      // Get all active admins
      const { data: admins, error: adminsError } = await this.supabase
        .from('admin_users')
        .select('id, email, phone_number, first_name, last_name, name, role')
        .eq('is_active', true);

      if (adminsError || !admins) {
        console.error('Error fetching admins:', adminsError);
        return [{ success: false, channel: 'email', error: 'Failed to fetch admins' }];
      }

      // Get preferences for all admins
      const { data: preferences, error: prefsError } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('notification_type', type);

      if (prefsError) {
        console.error('Error fetching preferences:', prefsError);
      }

      // Create a map of admin preferences
      const prefMap = new Map<string, NotificationPreference>();
      (preferences || []).forEach((pref: NotificationPreference) => {
        prefMap.set(pref.admin_user_id, pref);
      });

      // Get templates
      const emailTemplate = await this.getTemplate(`admin_${type}_email`);
      const smsTemplate = await this.getTemplate(`admin_${type}_sms`);

      // Send to each admin based on their preferences
      for (const admin of admins) {
        const pref = prefMap.get(admin.id);
        
        // Default to email enabled if no preference exists
        const emailEnabled = pref ? pref.email_enabled : true;
        const smsEnabled = pref ? pref.sms_enabled : false;

        // Add admin URL to variables
        const enrichedVariables = {
          ...variables,
          admin_url: `${ADMIN_URL}/restricted/admin`,
        };

        // Send email notification
        if (emailEnabled && admin.email) {
          const subject = emailTemplate 
            ? this.renderTemplate(emailTemplate.subject || '', enrichedVariables)
            : `Notification: ${type}`;
          const body = emailTemplate
            ? this.renderTemplate(emailTemplate.body_template, enrichedVariables)
            : JSON.stringify(enrichedVariables);

          const emailResult = await this.sendNotification({
            type,
            recipientType: 'admin',
            recipientEmail: admin.email,
            channels: ['email'],
            subject,
            body,
            entityType,
            entityId,
          });
          results.push(...emailResult);
        }

        // Send SMS notification
        if (smsEnabled && admin.phone_number && smsTemplate) {
          const smsBody = this.renderTemplate(smsTemplate.body_template, enrichedVariables);

          const smsResult = await this.sendNotification({
            type,
            recipientType: 'admin',
            recipientPhone: admin.phone_number,
            channels: ['sms'],
            body: smsBody,
            entityType,
            entityId,
          });
          results.push(...smsResult);
        }
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
      results.push({ 
        success: false, 
        channel: 'email', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    return results;
  }

  /**
   * Send notification to a customer
   */
  async notifyCustomer(
    templateKey: string,
    customerEmail: string,
    customerPhone: string | undefined,
    variables: Record<string, string | number>,
    entityType?: EntityType,
    entityId?: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    try {
      // Get email template
      const emailTemplate = await this.getTemplate(`${templateKey}_email`);
      
      if (emailTemplate && customerEmail) {
        const subject = this.renderTemplate(emailTemplate.subject || '', variables);
        const body = this.renderTemplate(emailTemplate.body_template, variables);

        const emailResult = await this.sendNotification({
          type: templateKey,
          recipientType: 'customer',
          recipientEmail: customerEmail,
          channels: ['email'],
          subject,
          body,
          entityType,
          entityId,
        });
        results.push(...emailResult);
      }

      // Get SMS template (optional for customers)
      const smsTemplate = await this.getTemplate(`${templateKey}_sms`);
      
      if (smsTemplate && customerPhone) {
        const smsBody = this.renderTemplate(smsTemplate.body_template, variables);

        const smsResult = await this.sendNotification({
          type: templateKey,
          recipientType: 'customer',
          recipientPhone: customerPhone,
          channels: ['sms'],
          body: smsBody,
          entityType,
          entityId,
        });
        results.push(...smsResult);
      }
    } catch (error) {
      console.error('Error notifying customer:', error);
      results.push({
        success: false,
        channel: 'email',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return results;
  }

  // =====================================================
  // PREFERENCE METHODS
  // =====================================================

  /**
   * Get notification preferences for an admin
   */
  async getAdminPreferences(adminId: string): Promise<NotificationPreference[]> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('admin_user_id', adminId);

    if (error) {
      console.error('Error fetching admin preferences:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Update notification preferences for an admin
   */
  async updateAdminPreferences(
    adminId: string,
    preferences: Partial<NotificationPreference>[]
  ): Promise<boolean> {
    try {
      for (const pref of preferences) {
        const { error } = await this.supabase
          .from('notification_preferences')
          .upsert({
            admin_user_id: adminId,
            notification_type: pref.notification_type,
            email_enabled: pref.email_enabled,
            sms_enabled: pref.sms_enabled,
          }, {
            onConflict: 'admin_user_id,notification_type',
          });

        if (error) {
          console.error('Error updating preference:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Initialize default preferences for a new admin
   */
  async initializeAdminPreferences(adminId: string): Promise<void> {
    const notificationTypes: NotificationType[] = [
      'new_order',
      'new_review',
      'new_story',
      'new_contact',
      'new_event_booking',
      'low_inventory',
      'order_issues',
      'high_value_order',
    ];

    const defaultPreferences = notificationTypes.map(type => ({
      admin_user_id: adminId,
      notification_type: type,
      email_enabled: true,
      sms_enabled: false,
    }));

    const { error } = await this.supabase
      .from('notification_preferences')
      .upsert(defaultPreferences, {
        onConflict: 'admin_user_id,notification_type',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error('Error initializing preferences:', error);
    }
  }

  // =====================================================
  // TEMPLATE METHODS
  // =====================================================

  /**
   * Get a notification template by key
   */
  async getTemplate(templateKey: string): Promise<NotificationTemplate | null> {
    const { data, error } = await this.supabase
      .from('notification_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single();

    if (error) {
      // Template not found is not an error
      if (error.code !== 'PGRST116') {
        console.error('Error fetching template:', error);
      }
      return null;
    }

    return data;
  }

  /**
   * Render a template with variables
   */
  renderTemplate(template: string, variables: Record<string, string | number>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  // =====================================================
  // LOGGING METHODS
  // =====================================================

  /**
   * Log a notification to the database
   */
  async logNotification(log: NotificationLog): Promise<void> {
    const { error } = await this.supabase
      .from('notification_logs')
      .insert(log);

    if (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Update notification log status
   */
  async updateLogStatus(
    logId: string,
    status: NotificationStatus,
    deliveredAt?: string
  ): Promise<void> {
    const updateData: Partial<NotificationLog> = { status };
    if (deliveredAt) {
      updateData.delivered_at = deliveredAt;
    }

    const { error } = await this.supabase
      .from('notification_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) {
      console.error('Error updating log status:', error);
    }
  }

  /**
   * Get notification logs with filters
   */
  async getLogs(filters: {
    type?: string;
    status?: NotificationStatus;
    recipientType?: RecipientType;
    channel?: NotificationChannel;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: NotificationLog[]; total: number }> {
    let query = this.supabase
      .from('notification_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.type) {
      query = query.eq('notification_type', filters.type);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.recipientType) {
      query = query.eq('recipient_type', filters.recipientType);
    }
    if (filters.channel) {
      query = query.eq('channel', filters.channel);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      return { logs: [], total: 0 };
    }

    return { logs: data || [], total: count || 0 };
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  /**
   * Send email via Resend
   */
  private async sendEmailNotification(options: SendNotificationOptions): Promise<NotificationResult> {
    if (!resend) {
      return { success: false, channel: 'email', error: 'Email service not configured' };
    }

    if (!options.recipientEmail) {
      return { success: false, channel: 'email', error: 'No recipient email provided' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: options.recipientEmail,
        subject: options.subject || 'Notification',
        html: options.body || '',
      });

      if (error) {
        return { success: false, channel: 'email', error: error.message };
      }

      return { success: true, channel: 'email', externalId: data?.id };
    } catch (error) {
      return { 
        success: false, 
        channel: 'email', 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Send SMS via Pingram/NotificationAPI
   */
  private async sendSMSNotification(options: SendNotificationOptions): Promise<NotificationResult> {
    if (!PINGRAM_CLIENT_ID || !PINGRAM_CLIENT_SECRET) {
      return { success: false, channel: 'sms', error: 'SMS service not configured' };
    }

    if (!options.recipientPhone) {
      return { success: false, channel: 'sms', error: 'No recipient phone provided' };
    }

    try {
      // NotificationAPI/Pingram integration
      // Using their REST API directly for simplicity
      const response = await fetch('https://api.notificationapi.com/sender/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${PINGRAM_CLIENT_ID}:${PINGRAM_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: JSON.stringify({
          notificationId: 'sms_notification',
          user: {
            id: options.recipientPhone,
            number: options.recipientPhone,
          },
          mergeTags: {
            message: options.body || '',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          channel: 'sms', 
          error: errorData.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, channel: 'sms', externalId: data.id };
    } catch (error) {
      return { 
        success: false, 
        channel: 'sms', 
        error: error instanceof Error ? error.message : 'Failed to send SMS' 
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Check if an order is high value
   */
  isHighValueOrder(total: number): boolean {
    return total >= HIGH_VALUE_ORDER_THRESHOLD;
  }

  /**
   * Get the high value order threshold
   */
  getHighValueThreshold(): number {
    return HIGH_VALUE_ORDER_THRESHOLD;
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * Send admin notification for new order
 */
export async function notifyAdminsNewOrder(order: {
  order_number: string;
  total: number;
  customer_name: string;
  customer_email: string;
  id: string;
}): Promise<void> {
  const service = getNotificationService();
  
  // Always send new order notification
  await service.notifyAdmins('new_order', {
    order_number: order.order_number,
    total: order.total.toFixed(2),
    customer_name: order.customer_name,
    customer_email: order.customer_email,
  }, 'order', order.id);

  // Also send high value notification if applicable
  if (service.isHighValueOrder(order.total)) {
    await service.notifyAdmins('high_value_order', {
      order_number: order.order_number,
      total: order.total.toFixed(2),
      customer_name: order.customer_name,
      customer_email: order.customer_email,
    }, 'order', order.id);
  }
}

/**
 * Send admin notification for new review
 */
export async function notifyAdminsNewReview(review: {
  id: string;
  product_name: string;
  rating: number;
  customer_name: string;
  customer_email: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyAdmins('new_review', {
    product_name: review.product_name,
    rating: review.rating,
    customer_name: review.customer_name,
    customer_email: review.customer_email,
  }, 'review', review.id);
}

/**
 * Send admin notification for new story
 */
export async function notifyAdminsNewStory(story: {
  id: string;
  title: string;
  author: string;
  email: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyAdmins('new_story', {
    title: story.title,
    author: story.author,
    email: story.email,
  }, 'story', story.id);
}

/**
 * Send admin notification for new contact form
 */
export async function notifyAdminsNewContact(contact: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyAdmins('new_contact', {
    name: contact.name,
    email: contact.email,
    subject: contact.subject,
    message: contact.message,
  }, 'contact', contact.id);
}

/**
 * Send admin notification for new event booking
 */
export async function notifyAdminsNewEventBooking(booking: {
  id: string;
  event_name: string;
  customer_name: string;
  customer_email: string;
  num_participants: number;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyAdmins('new_event_booking', {
    event_name: booking.event_name,
    customer_name: booking.customer_name,
    customer_email: booking.customer_email,
    num_participants: booking.num_participants,
  }, 'event', booking.id);
}

/**
 * Send admin notification for low inventory
 */
export async function notifyAdminsLowInventory(product: {
  id: string;
  product_name: string;
  variant_name: string;
  quantity: number;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyAdmins('low_inventory', {
    product_name: product.product_name,
    variant_name: product.variant_name,
    quantity: product.quantity,
  }, 'product', product.id);
}

/**
 * Send admin notification for order issues
 */
export async function notifyAdminsOrderIssue(order: {
  id: string;
  order_number: string;
  issue_type: string;
  details: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyAdmins('order_issues', {
    order_number: order.order_number,
    issue_type: order.issue_type,
    details: order.details,
  }, 'order', order.id);
}

/**
 * Send customer notification for order delivered
 */
export async function notifyCustomerOrderDelivered(order: {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyCustomer(
    'customer_order_delivered',
    order.customer_email,
    order.customer_phone,
    {
      order_number: order.order_number,
      customer_name: order.customer_name,
    },
    'order',
    order.id
  );
}

/**
 * Send customer notification for review approved
 */
export async function notifyCustomerReviewApproved(review: {
  id: string;
  product_name: string;
  customer_name: string;
  customer_email: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyCustomer(
    'customer_review_approved',
    review.customer_email,
    undefined,
    {
      product_name: review.product_name,
      customer_name: review.customer_name,
    },
    'review',
    review.id
  );
}

/**
 * Send customer notification for story approved
 */
export async function notifyCustomerStoryApproved(story: {
  id: string;
  title: string;
  author: string;
  email: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyCustomer(
    'customer_story_approved',
    story.email,
    undefined,
    {
      title: story.title,
      author: story.author,
    },
    'story',
    story.id
  );
}

/**
 * Send customer notification for event confirmed
 */
export async function notifyCustomerEventConfirmed(booking: {
  id: string;
  event_name: string;
  event_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyCustomer(
    'customer_event_confirmed',
    booking.customer_email,
    booking.customer_phone,
    {
      event_name: booking.event_name,
      event_date: booking.event_date,
      customer_name: booking.customer_name,
    },
    'event',
    booking.id
  );
}

/**
 * Send customer notification for event reminder
 */
export async function notifyCustomerEventReminder(booking: {
  id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyCustomer(
    'customer_event_reminder',
    booking.customer_email,
    booking.customer_phone,
    {
      event_name: booking.event_name,
      event_date: booking.event_date,
      event_time: booking.event_time,
      customer_name: booking.customer_name,
    },
    'event',
    booking.id
  );
}

/**
 * Send customer notification for abandoned cart
 */
export async function notifyCustomerAbandonedCart(cart: {
  id: string;
  customer_name: string;
  customer_email: string;
  cart_url: string;
}): Promise<void> {
  const service = getNotificationService();
  await service.notifyCustomer(
    'customer_abandoned_cart',
    cart.customer_email,
    undefined,
    {
      customer_name: cart.customer_name,
      cart_url: cart.cart_url,
    },
    'cart',
    cart.id
  );
}
