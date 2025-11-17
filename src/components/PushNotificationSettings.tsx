import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  checkPushSubscription,
} from '@/lib/pushNotifications';

interface PushNotificationSettingsProps {
  userId: string;
}

export const PushNotificationSettings = ({ userId }: PushNotificationSettingsProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();

    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    // Check current subscription status
    checkPushSubscription(userId).then(setIsSubscribed);
  }, [userId]);

  const handleTogglePushNotifications = async () => {
    setIsLoading(true);

    try {
      if (isSubscribed) {
        const success = await unsubscribeFromPushNotifications(userId);
        if (success) {
          setIsSubscribed(false);
          toast({
            title: 'Push Notifications Disabled',
            description: 'You will no longer receive push notifications',
          });
        }
      } else {
        const success = await subscribeToPushNotifications(userId);
        if (success) {
          setIsSubscribed(true);
          toast({
            title: 'Push Notifications Enabled',
            description: 'You will now receive notifications even when not logged in',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'Please allow notifications in your browser settings',
          });
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update notification settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive notifications even when you're not logged in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleTogglePushNotifications}
          disabled={isLoading}
          variant={isSubscribed ? 'outline' : 'default'}
          className="w-full"
        >
          {isLoading ? (
            'Processing...'
          ) : isSubscribed ? (
            <>
              <BellOff className="h-4 w-4 mr-2" />
              Disable Push Notifications
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Enable Push Notifications
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
