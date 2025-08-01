import { supabase } from './supabaseClient';
import type { 
  NotificationSettings, 
  NotificationSettingsInsert,
  NotificationSettingsUpdate,
  EmailNotification,
  EmailNotificationInsert 
} from '../types/database';

export class NotificationService {
  /**
   * Get user's notification settings
   */
  static async getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification settings:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create or update user's notification settings
   */
  static async upsertNotificationSettings(
    userId: string, 
    settings: Partial<NotificationSettingsInsert>
  ): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting notification settings:', error);
      throw error;
    }

    return data;
  }

  /**
   * Enable email notifications for a user
   */
  static async enableEmailNotifications(
    userId: string, 
    emailAddress?: string,
    notificationTimes: string[] = ['7d', '3d', '1d', '2h']
  ): Promise<NotificationSettings> {
    return this.upsertNotificationSettings(userId, {
      email_enabled: true,
      email_address: emailAddress,
      notification_times: notificationTimes,
    });
  }

  /**
   * Disable email notifications for a user
   */
  static async disableEmailNotifications(userId: string): Promise<NotificationSettings> {
    return this.upsertNotificationSettings(userId, {
      email_enabled: false,
    });
  }

  /**
   * Log sent notification
   */
  static async logSentNotification(notification: EmailNotificationInsert): Promise<EmailNotification> {
    const { data, error } = await supabase
      .from('email_notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('Error logging notification:', error);
      throw error;
    }

    return data;
  }

  /**
   * Check if notification was already sent today for this task/type
   */
  static async wasNotificationSentToday(
    userId: string, 
    taskId: string, 
    emailType: string
  ): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('email_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .eq('email_type', emailType)
      .gte('sent_at', `${today}T00:00:00.000Z`)
      .lt('sent_at', `${today}T23:59:59.999Z`)
      .limit(1);

    if (error) {
      console.error('Error checking sent notifications:', error);
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Get user's recent notification history
   */
  static async getNotificationHistory(
    userId: string, 
    limit: number = 50
  ): Promise<EmailNotification[]> {
    const { data, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Calculate assignment risk level based on due date and priority
   */
  static calculateAssignmentRisk(
    dueDate: string,
    dueTime?: string,
    priority?: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    const now = new Date();
    const due = new Date(dueDate + (dueTime ? `T${dueTime}` : 'T23:59:59'));
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    // High risk: Due in less than 48 hours
    if (hoursUntilDue <= 48) {
      return 'high';
    }

    // Medium risk: Due in less than 7 days OR high priority
    if (hoursUntilDue <= 168 || priority === 'high') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate notification timing based on due date and risk level
   */
  static getNotificationTimings(
    dueDate: string,
    dueTime?: string,
    riskLevel?: 'low' | 'medium' | 'high'
  ): Date[] {
    const due = new Date(dueDate + (dueTime ? `T${dueTime}` : 'T23:59:59'));
    const timings: Date[] = [];

    // Base notifications for all assignments
    const sevenDaysEarlier = new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysEarlier = new Date(due.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneDayEarlier = new Date(due.getTime() - 24 * 60 * 60 * 1000);

    timings.push(sevenDaysEarlier, threeDaysEarlier, oneDayEarlier);

    // Additional notifications for high-risk assignments
    if (riskLevel === 'high') {
      const twoHoursEarlier = new Date(due.getTime() - 2 * 60 * 60 * 1000);
      timings.push(twoHoursEarlier);
    }

    // Filter out past dates
    const now = new Date();
    return timings.filter(timing => timing > now);
  }

  /**
   * Check if current time is within user's active hours
   */
  static isWithinActiveHours(
    activeHoursStart: number = 9,
    activeHoursEnd: number = 21
  ): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    
    return currentHour >= activeHoursStart && currentHour <= activeHoursEnd;
  }
}

export default NotificationService;