const fs = require('fs')
const path = require('path')

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

patchReactNativePushNotificationGradle()
