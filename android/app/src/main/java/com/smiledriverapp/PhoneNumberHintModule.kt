package com.vttechnologies.smiledriverapp

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity

class PhoneNumberHintModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var promise: Promise? = null
    private val RC_HINT = 1001

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "PhoneNumberHint"

    @ReactMethod
    fun showPhoneNumberHint(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Current activity is null")
            return
        }

        this.promise = promise

        val request = GetPhoneNumberHintIntentRequest.builder().build()
        val client = Identity.getSignInClient(activity)

        val intentTask = client.getPhoneNumberHintIntent(request)
        intentTask.addOnSuccessListener { intent ->
            try {
                activity.startIntentSenderForResult(
                    intent.intentSender,
                    RC_HINT,
                    null, 0, 0, 0
                )
            } catch (e: Exception) {
                promise.reject("INTENT_ERROR", e.message)
                this.promise = null
            }
        }
        intentTask.addOnFailureListener { e ->
            promise.reject("HINT_ERROR", e.message)
            this.promise = null
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == RC_HINT) {
        android.util.Log.d("PhoneNumberHint", "Result code: $resultCode")
        android.util.Log.d("PhoneNumberHint", "Data: $data")
        
        if (resultCode == Activity.RESULT_OK && data != null) {
            try {
                val phoneNumber = Identity.getSignInClient(activity).getPhoneNumberFromIntent(data)
                android.util.Log.d("PhoneNumberHint", "Extracted phone number: $phoneNumber")
                
                if (phoneNumber != null && phoneNumber.isNotEmpty()) {
                    promise?.resolve(phoneNumber)
                } else {
                    promise?.reject("NO_PHONE_NUMBER", "Phone number is null or empty")
                }
            } catch (e: Exception) {
                android.util.Log.e("PhoneNumberHint", "Error: ${e.message}", e)
                promise?.reject("EXTRACTION_ERROR", "Error: ${e.message}")
            }
        } else {
            promise?.reject("CANCELLED", "User cancelled or result not OK")
        }
        promise = null
    }
}

    override fun onNewIntent(intent: Intent) {
        // Not used for this implementation
    }
}