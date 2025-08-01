import { supabase } from './supabaseClient';
import NotificationService from './notificationService';
import type { Task } from '../types/database';

export interface NotificationTriggerOptions {
  taskId: string;
  userId: string;
  emailType: 'assignment_reminder' | 'new_assignment' | 'urgent_deadline';
  task: Task;
}

export class EmailNotificationTrigger {
  /**
   * Trigger an email notification for a specific task
   */
  static async sendNotification({
    taskId,
    userId,
    emailType,
    task
  }: NotificationTriggerOptions): Promise<boolean> {
    try {
      // Check if user has email notifications enabled
      const settings = await NotificationService.getNotificationSettings(userId);
      if (!settings?.email_enabled) {
        console.log('Email notifications disabled for user:', userId);
        return false;
      }

      // Check if we already sent this notification today
      const alreadySent = await NotificationService.wasNotificationSentToday(
        userId,
        taskId,
        emailType
      );

      if (alreadySent) {
        console.log('Notification already sent today for:', { userId, taskId, emailType });
        return false;
      }

      // Check if we're within active hours
      const isActiveHours = NotificationService.isWithinActiveHours(
        settings.active_hours_start,
        settings.active_hours_end
      );

      if (!isActiveHours) {
        console.log('Outside active hours for user:', userId);
        return false;
      }

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          user_id: userId,
          task_id: taskId,
          email_type: emailType,
          task_title: task.title,
          task_class: task.class,
          due_date: task.dueDate,
          due_time: task.dueTime,
          priority: task.priority,
        }
      });

      if (error) {
        console.error('Error calling send-email-notification function:', error);
        return false;
      }

      console.log('Email notification sent successfully:', data);
      return true;

    } catch (error) {
      console.error('Error in sendNotification:', error);
      return false;
    }
  }

  /**
   * Check all tasks and send appropriate notifications
   * This would typically be called by a cron job or scheduled task
   */
  static async processAllNotifications(userId: string): Promise<void> {
    try {
      // Get all incomplete tasks for the user
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .not('dueDate', 'is', null)
        .gte('dueDate', new Date().toISOString().split('T')[0]); // Only future tasks

      if (error) {
        console.error('Error fetching tasks for notifications:', error);
        return;
      }

      if (!tasks || tasks.length === 0) {
        console.log('No tasks to process for user:', userId);
        return;
      }

      for (const task of tasks) {
        await this.processTaskNotifications(task);
      }

    } catch (error) {
      console.error('Error in processAllNotifications:', error);
    }
  }

  /**
   * Process notifications for a single task
   */
  private static async processTaskNotifications(task: Task): Promise<void> {
    if (!task.dueDate) return;

    const now = new Date();
    const dueDate = new Date(task.dueDate + (task.dueTime ? `T${task.dueTime}` : 'T23:59:59'));
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Determine risk level
    const riskLevel = NotificationService.calculateAssignmentRisk(
      task.dueDate,
      task.dueTime,
      task.priority
    );

    // Send urgent deadline notification (2 hours before)
    if (hoursUntilDue <= 2 && hoursUntilDue > 0) {
      await this.sendNotification({
        taskId: task.id,
        userId: task.user_id,
        emailType: 'urgent_deadline',
        task
      });
    }
    // Send regular reminder (1 day before)
    else if (hoursUntilDue <= 24 && hoursUntilDue > 2) {
      await this.sendNotification({
        taskId: task.id,
        userId: task.user_id,
        emailType: 'assignment_reminder',
        task
      });
    }
    // Send early reminder (3 days before)
    else if (hoursUntilDue <= 72 && hoursUntilDue > 24) {
      await this.sendNotification({
        taskId: task.id,
        userId: task.user_id,
        emailType: 'assignment_reminder',
        task
      });
    }
    // Send very early reminder (7 days before)
    else if (hoursUntilDue <= 168 && hoursUntilDue > 72) {
      await this.sendNotification({
        taskId: task.id,
        userId: task.user_id,
        emailType: 'assignment_reminder',
        task
      });
    }
  }

  /**
   * Send notification for newly created Canvas assignments
   */
  static async notifyNewCanvasAssignment(task: Task): Promise<boolean> {
    // Only notify for Canvas-imported assignments
    if (!task.canvas_uid) {
      return false;
    }

    return this.sendNotification({
      taskId: task.id,
      userId: task.user_id,
      emailType: 'new_assignment',
      task
    });
  }

  /**
   * Test notification sending (for development/testing)
   */
  static async sendTestNotification(
    userId: string,
    taskId: string,
    emailType: 'assignment_reminder' | 'new_assignment' | 'urgent_deadline' = 'assignment_reminder'
  ): Promise<boolean> {
    try {
      // Get the task details
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (error || !task) {
        console.error('Task not found for test notification:', { userId, taskId, error });
        return false;
      }

      return this.sendNotification({
        taskId,
        userId,
        emailType,
        task
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }
}

export default EmailNotificationTrigger;