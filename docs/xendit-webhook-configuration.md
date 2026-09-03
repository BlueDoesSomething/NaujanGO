# ⚠️ Xendit Webhook Configuration Required

## Current Issue

Your Xendit eWallet API is returning:
```
CALLBACK_URL_NOT_FOUND
"Payment request failed because there was no input of callback url in your 
dashboard settings or request headers."
```

This means Xendit requires webhook callback URLs to be configured in the Xendit Dashboard before payments can be processed.

---

## 🔧 Solution: Configure Xendit Webhooks (5 minutes)

### Step 1: Log in to Xendit Dashboard
Visit https://dashboard.xendit.co/ and log in

### Step 2: Go to Webhooks Settings
1. Click **Settings** (gear icon, bottom left)
2. Select **Developers**
3. Click **Webhooks**

### Step 3: Add Webhook Endpoint
1. Click **Add Endpoint** button
2. Enter the webhook URL:
   - **Development:** `https://192.168.10.8:3000/api/payments/webhook/xendit`
   - **Production:** `https://youractualdomain.com/api/payments/webhook/xendit`

### Step 4: Select Events
Check these events:
- ✅ `charge.succeeded` - Payment completed
- ✅ `charge.failed` - Payment failed
- ✅ `charge.expired` - Payment link expired (optional)

### Step 5: Save & Test
1. Click **Save Endpoint**
2. Xendit will send a test webhook to verify it works
3. Check backend logs for: "✅ Xendit webhook received and verified"

---

## ✅ Verification

After configuring the webhook, test again:

```bash
cd backend
node tests/test_xendit_api_direct.mjs
```

You should see:
```
✅ API Call Successful!
✅ Checkout URL Available:
https://checkout.xendit.co/...
```

---

## 📝 What This Does

1. **Xendit** receives your GCash payment request
2. **Xendit** returns a checkout URL (hosted on their secure servers)
3. **User** is redirected to Xendit to complete payment
4. **Xendit** processes the payment
5. **Xendit** calls your webhook to confirm payment status
6. **Your app** updates the booking as "paid" and "confirmed"

---

## 🔐 Security

- Webhook signature is verified with XENDIT_WEBHOOK_TOKEN
- Only Xendit can call your webhook (authenticated)
- Payment confirmations require this webhook verification

---

## ⏱️ Next Steps

1. **Now:** Configure webhook in Xendit Dashboard (5 minutes)
2. **Test:** Run `node tests/test_xendit_api_direct.mjs` - should show checkout URL
3. **Try:** Create a booking and test GCash payment flow
4. **Monitor:** Watch backend logs for webhook confirmation

---

## 🚨 Troubleshooting

### Still getting "CALLBACK_URL_NOT_FOUND"?
- ✅ Verify you saved the webhook URL
- ✅ Check URL starts with `https://` (not http://)
- ✅ Make sure URL is publicly accessible (not behind corporate firewall)
- ✅ Try refreshing Xendit Dashboard page

### Webhook not being called?
- ✅ Check backend logs for incoming webhook
- ✅ Verify webhook URL is correct in Xendit Dashboard
- ✅ Ensure XENDIT_WEBHOOK_TOKEN is configured in .env
- ✅ Check firewall/network allows inbound from Xendit

### Still having issues?
Check the full error response:
```
cd backend
node tests/test_xendit_api_direct.mjs
```

Look for "error_code" and "message" fields in the response.

---

## 📞 Support

- Xendit Docs: https://developers.xendit.co/api-reference/
- Dashboard: https://dashboard.xendit.co/
- Support: support@xendit.co
