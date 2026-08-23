const fs = require('fs')
const path = require('path')

function escapeGroovySingleQuotedString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function patchReactNativePushNotificationGradle() {
  const target = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-push-notification',
    'android',
    'build.gradle',
  )

  if (!fs.existsSync(target)) {
    console.log('[postinstall] Skip react-native-push-notification patch: file not found')
    return
  }

  const original = fs.readFileSync(target, 'utf8')
  const updated = original
    .split(/\r?\n/)
    .filter((line) => line.trim() !== 'jcenter()')
    .join('\n')

  if (updated === original) {
    console.log('[postinstall] react-native-push-notification already Gradle 9 compatible')
    return
  }

  fs.writeFileSync(target, updated.endsWith('\n') ? updated : `${updated}\n`)
  console.log('[postinstall] Patched react-native-push-notification: removed jcenter() for Gradle 9')
}

function patchReactNativePushNotificationSoundUri() {
  const target = path.join(
    __dirname,
    '..',
    'node_modules',
    'react-native-push-notification',
    'android',
    'src',
    'main',
    'java',
    'com',
    'dieam',
    'reactnativepushnotification',
    'modules',
    'RNPushNotificationHelper.java',
  )

  if (!fs.existsSync(target)) {
    console.log('[postinstall] Skip react-native-push-notification sound URI patch: file not found')
    return
  }

  const original = fs.readFileSync(target, 'utf8')
  if (original.includes('"/raw/" + resourceName')) {
    console.log('[postinstall] react-native-push-notification already uses name-based sound URIs')
    return
  }

  const before = `            int resId;
            if (context.getResources().getIdentifier(soundName, "raw", context.getPackageName()) != 0) {
                resId = context.getResources().getIdentifier(soundName, "raw", context.getPackageName());
            } else {
                soundName = soundName.substring(0, soundName.lastIndexOf('.'));
                resId = context.getResources().getIdentifier(soundName, "raw", context.getPackageName());
            }

            return Uri.parse("android.resource://" + context.getPackageName() + "/" + resId);`

  const after = `            String resourceName = soundName;
            int extensionIndex = resourceName.lastIndexOf('.');
            if (extensionIndex > 0) {
                resourceName = resourceName.substring(0, extensionIndex);
            }

            int resId = context.getResources().getIdentifier(resourceName, "raw", context.getPackageName());
            if (resId == 0) {
                return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }

            return Uri.parse("android.resource://" + context.getPackageName() + "/raw/" + resourceName);`

  const updated = original.replace(before, after)
  if (updated === original) {
    console.log('[postinstall] Skip react-native-push-notification sound URI patch: target block not found')
    return
  }

  fs.writeFileSync(target, updated)
  console.log('[postinstall] Patched react-native-push-notification: sound URIs now use raw resource names')
}

function patchGradleNodeExecutable(packageName, label) {
  const target = path.join(__dirname, '..', 'node_modules', packageName, 'android', 'build.gradle')

  if (!fs.existsSync(target)) {
    console.log(`[postinstall] Skip ${label} Node patch: file not found`)
    return
  }

  const nodeExecutable = process.env.NODE_BINARY || process.execPath || 'node'
  const nodeExecutableLine = `def nodeExecutable = System.getenv("NODE_BINARY") ?: '${escapeGroovySingleQuotedString(
    nodeExecutable,
  )}'`
  const original = fs.readFileSync(target, 'utf8')
  let updated = original

  if (/^def nodeExecutable = System\.getenv\("NODE_BINARY"\) \?: .+$/m.test(updated)) {
    updated = updated.replace(
      /^def nodeExecutable = System\.getenv\("NODE_BINARY"\) \?: .+$/m,
      nodeExecutableLine,
    )
  } else {
    updated = updated.replace(/((?:^import .+\n)+)/m, `$1\n${nodeExecutableLine}\n`)
  }

  updated = updated.replace(/commandLine\("node",/g, 'commandLine(nodeExecutable,')

  if (updated === original) {
    console.log(`[postinstall] ${label} already uses an absolute Node executable`)
    return
  }

  fs.writeFileSync(target, updated.endsWith('\n') ? updated : `${updated}\n`)
  console.log(`[postinstall] Patched ${label}: Gradle now uses ${nodeExecutable}`)
}

patchReactNativePushNotificationGradle()
patchReactNativePushNotificationSoundUri()
patchGradleNodeExecutable('react-native-reanimated', 'react-native-reanimated')
patchGradleNodeExecutable('react-native-worklets', 'react-native-worklets')
