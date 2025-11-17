# How to Set Up Push Notifications

Push notifications allow users to receive alerts even when they're not logged into your app. Follow these steps:

## 1. Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using this command:

```bash
npx web-push generate-vapid-keys
```

This will output something like:

```
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
Private Key: UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
```

## 2. Add Environment Variables

Add these to your `.env` file and Supabase secrets:

```env
# For client-side (add to .env)
VITE_VAPID_PUBLIC_KEY=your-public-key-here

# For server-side (add to Supabase Edge Function secrets)
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:your-email@example.com
```

## 3. Add Secrets to Supabase

```bash
npx supabase secrets set VAPID_PUBLIC_KEY="your-public-key"
npx supabase secrets set VAPID_PRIVATE_KEY="your-private-key"
npx supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"
```

## 4. Apply Database Migration

```bash
npx supabase db push
```

## 5. Deploy the Edge Function

```bash
npx supabase functions deploy send-push-notification
```

## 6. Update Notification Sending Code

Modify `notify-admins-purchase` to also send push notifications:

```typescript
// After creating the notification in the database, also send push
await supabaseClient.functions.invoke("send-push-notification", {
  body: {
    user_id: admin.user_id,
    title: "New Pending Purchase",
    message: `${user_email} created a pending purchase...`,
    type: "info",
  },
});
```

## 7. Add the Component to User Settings

Import and add `PushNotificationSettings` to your Dashboard or Settings page:

```tsx
import { PushNotificationSettings } from "@/components/PushNotificationSettings";

// In your component:
<PushNotificationSettings userId={user.id} />;
```

## Testing

1. Enable push notifications in your app
2. Close the browser or navigate away
3. Make a test purchase
4. You should receive a browser notification

## Browser Support

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari (macOS 16.4+, iOS 16.4+): ✅ Supported
- Opera: ✅ Fully supported

## Notes

- Users must grant permission for notifications
- Notifications work even when the browser is closed (on some browsers)
- Service worker must be registered for push notifications to work
- HTTPS is required (or localhost for development)
