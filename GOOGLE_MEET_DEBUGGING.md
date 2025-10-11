# Google Meet Error Debugging Guide

## 🐛 **Common Issues Fixed:**

### 1. **Database Query Issues**

- **Problem**: Complex foreign key joins failing
- **Solution**: Simplified to separate queries for bookings and services
- **Benefit**: Better error isolation and debugging

### 2. **RLS (Row Level Security) Issues**

- **Problem**: User auth client might not have access to all bookings
- **Solution**: Use service role for database operations after auth verification
- **Benefit**: Bypasses RLS while maintaining security

### 3. **Better Error Responses**

- **Problem**: Generic "failed to create" errors
- **Solution**: Specific HTTP status codes and error messages
- **Benefit**: Easier debugging and user feedback

## 🔍 **Debugging Steps:**

### Step 1: Check Authentication

- Make sure you're logged in as an admin user
- Verify your user has permission to create meetings

### Step 2: Verify Booking Exists

- Check that the booking ID exists in your database
- Ensure the booking has a valid service_id

### Step 3: Check Browser Console

Open browser developer tools and look for:

```
Failed to invoke function: create-google-meet
Error: [specific error message]
```

### Step 4: Check Network Tab

In browser dev tools → Network tab:

- Look for the `create-google-meet` request
- Check the response status and body
- Common statuses:
  - 401: Authentication required
  - 404: Booking or service not found
  - 500: Server error

## 🧪 **Testing the Function:**

### Test Case 1: Valid Booking

1. Go to Admin Dashboard → Sessions
2. Find a booking that exists
3. Click "Create Google Meet"
4. Should see success message

### Test Case 2: Check Database

After successful creation, verify:

- `bookings` table has `meet_link` and `meet_id` populated
- Meet link follows format: `https://meet.google.com/xxx-yyyy-zzz`

## 📝 **Expected Error Messages:**

### ✅ **Success Response:**

```json
{
  "success": true,
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "meetId": "abc-defg-hij",
  "meetingTitle": "Fitness Session: Personal Training",
  "message": "Google Meet link created successfully"
}
```

### ❌ **Error Responses:**

```json
// Authentication Error
{
  "error": "Authentication required"
}

// Booking Not Found
{
  "error": "Booking not found"
}

// Service Not Found
{
  "error": "Service not found"
}
```

## 🚀 **Recent Updates Applied:**

1. ✅ **Simplified database queries** to avoid foreign key issues
2. ✅ **Added proper HTTP status codes** for different error types
3. ✅ **Separated auth verification** from database operations
4. ✅ **Enhanced error logging** for better debugging
5. ✅ **Fixed service references** in meeting title and notifications

## 🔧 **Next Steps:**

If you're still getting "failed to create google meet link":

1. **Try the function again** - the updates should resolve most issues
2. **Check browser console** for specific error details
3. **Verify the booking exists** in your database
4. **Ensure you're logged in** as an admin user

The function is now much more robust and should provide clearer error messages! 🎯
