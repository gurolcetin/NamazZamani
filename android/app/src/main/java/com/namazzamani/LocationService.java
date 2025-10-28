package com.namazzamani; // kendi package name’inle aynı olmalı

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class LocationService extends Service {
    private static final String CHANNEL_ID = "location_service_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Konum Servisi",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(getString(R.string.location_notification_title))
                .setContentText(getString(R.string.location_notification_text))
                .setSmallIcon(R.mipmap.ic_launcher)
                .build();

        startForeground(1, notification);

        // Burada konum takibi kodunu başlatabilirsiniz (örn. FusedLocationProviderClient)

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Konum takibini durdur
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
