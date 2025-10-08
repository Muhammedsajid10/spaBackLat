# 📧 Free Gmail SMTP Setup Guide

This guide will help you set up **FREE** email sending using Gmail SMTP (no third-party services needed).

## 🔧 Step 1: Enable Gmail App Passwords

### Option A: If you have 2-Factor Authentication enabled (Recommended)

1. Go to your **Google Account settings**: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Scroll down and click **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter "Allora Spa Backend" as the name
7. Click **Generate**
8. **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)

### Option B: If you don't have 2-Factor Authentication

1. Go to your **Google Account settings**: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Turn on **2-Step Verification** first (required for App Passwords)
4. Then follow Option A steps above

## 🔧 Step 2: Update Your Environment Variables

Replace the `SMTP_PASS` in your `.env` file:

```bash
# Gmail SMTP Configuration (Free - No third party needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=booking.alloraspadubai@gmail.com
SMTP_PASS=your_16_character_app_password_here
```

**Important:** Use the App Password (16 characters), NOT your regular Gmail password!

## 🔧 Step 3: Test Your Email Setup

Run this command to test your email configuration:

```bash
node test-email-setup.js
```

## 📋 Alternative Free Email Options

If Gmail doesn't work for you, here are other free options:

### Option 1: Outlook/Hotmail SMTP (Free)
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_outlook_email@outlook.com
SMTP_PASS=your_outlook_password
```

### Option 2: Yahoo SMTP (Free)
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_yahoo_email@yahoo.com
SMTP_PASS=your_yahoo_app_password
```

### Option 3: Zoho Mail SMTP (Free up to 5GB)
```bash
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@zoho.com
SMTP_PASS=your_zoho_password
```

## 🚀 Step 4: Restart Your Backend

After updating the `.env` file:

```bash
npm start
```

## 🎯 Benefits of This Setup

✅ **100% Free** - No third-party service costs
✅ **No API Limits** - Gmail allows generous sending limits
✅ **Reliable** - Gmail's SMTP is very stable
✅ **Professional** - Emails come from your domain email
✅ **No Dependencies** - Works with just nodemailer

## 📊 Gmail Sending Limits

- **Free Gmail**: 500 emails per day
- **Google Workspace**: 2,000 emails per day
- **Rate limit**: 100 emails per hour

This should be more than enough for your spa business!

## 🔍 Troubleshooting

### Error: "Invalid login"
- Make sure you're using the **App Password**, not your regular Gmail password
- Ensure 2-Factor Authentication is enabled on your Google account

### Error: "Less secure app access"
- This error is outdated - use App Passwords instead
- Never enable "Less secure app access" (it's deprecated)

### Error: "Connection timeout"
- Check your internet connection
- Verify SMTP settings are correct
- Try port 465 with `SMTP_SECURE=true` instead

## 🛡️ Security Best Practices

1. **Never share** your App Password
2. **Use environment variables** (never hardcode passwords)
3. **Rotate** App Passwords every few months
4. **Monitor** email sending logs for suspicious activity
5. **Use HTTPS** in production

---

**Need help?** Check the console logs when starting your server - they'll show if email is configured correctly!