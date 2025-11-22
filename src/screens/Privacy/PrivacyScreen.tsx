import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../libs/core/providers';
import { RootRoutes } from '../../navigation/Routes';

const PRIVACY_KEY = 'privacyAccepted';

type Props = {
  navigation: any;
  onAccept: () => void;
  nextRoute: string;
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  type?: 'primary' | 'secondary';
  color: string;
  textColor: string;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
};

const ActionButton: React.FC<ButtonProps> = ({
  label,
  onPress,
  type = 'primary',
  color,
  textColor,
  borderColor,
  style,
}) => {
  const isPrimary = type === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        style,
        {
          backgroundColor: isPrimary ? color : 'transparent',
          borderColor: isPrimary ? 'transparent' : borderColor,
        },
      ]}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.buttonLabel,
          { color: isPrimary ? textColor : borderColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const PrivacyContent = ({
  title,
  description,
  currentTheme,
}: {
  title: string;
  description: string;
  currentTheme: any;
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: currentTheme.cardViewBackgroundColor,
          borderColor: currentTheme.menuBorderColor,
        },
      ]}
    >
      <Text style={[styles.title, { color: currentTheme.textColor }]}>
        {title}
      </Text>
      <ScrollView
        style={styles.descriptionContainer}
        showsVerticalScrollIndicator
      >
        <Text style={[styles.description, { color: currentTheme.textColor }]}>
          {description}
        </Text>
      </ScrollView>
    </View>
  );
};

const PrivacyScreen: React.FC<Props> = ({
  navigation,
  onAccept,
  nextRoute,
}) => {
  const { currentTheme } = useTheme();

  const descriptionText = useMemo(
    () =>
      'Kişisel verilerinizin korunması bizim için önemli. Bu uygulamayı kullanırken konum, bildirim ve kullanım verileri işlenebilir. Bu veriler yalnızca namaz vakitleri, bildirimler ve kullanıcı deneyimini geliştirmek amacıyla kullanılacaktır. Daha fazla bilgi için gizlilik politikamızı inceleyebilirsiniz. Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz. Kişisel verilerinizin korunması bizim için önemli. Bu uygulamayı kullanırken konum, bildirim ve kullanım verileri işlenebilir. Bu veriler yalnızca namaz vakitleri, bildirimler ve kullanıcı deneyimini geliştirmek amacıyla kullanılacaktır. Daha fazla bilgi için gizlilik politikamızı inceleyebilirsiniz. Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz. Kişisel verilerinizin korunması bizim için önemli. Bu uygulamayı kullanırken konum, bildirim ve kullanım verileri işlenebilir. Bu veriler yalnızca namaz vakitleri, bildirimler ve kullanıcı deneyimini geliştirmek amacıyla kullanılacaktır. Daha fazla bilgi için gizlilik politikamızı inceleyebilirsiniz. Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz. Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.Bu metin yalnızca örnek olarak sunulmuştur. Gerçek politika metnini burada gösterebilirsiniz.',
    [],
  );

  const handleAccept = useCallback(async () => {
    await AsyncStorage.setItem(PRIVACY_KEY, 'true');
    onAccept();
    navigation.replace(nextRoute ?? RootRoutes.Main);
  }, [navigation, nextRoute, onAccept]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      'Gizlilik Politikası',
      'Gizlilik politikasını kabul etmeden uygulamayı kullanamazsınız.',
      [
        {
          text: 'Uygulamadan çık',
          onPress: () => {
            BackHandler.exitApp();
            // veya kullanıcıyı markete yönlendirmek için Linking.openURL kullanılabilir.
          },
        },
        {
          text: 'Kapat',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: currentTheme.textColor }]}>
          Gizlilik Politikası
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.textColor }]}>
          Privacy Policy
        </Text>
      </View>

      <PrivacyContent
        title="Gizlilik Politikası"
        description={descriptionText}
        currentTheme={currentTheme}
      />

      <View style={styles.actions}>
        <ActionButton
          label="Kabul etmiyorum"
          onPress={handleDecline}
          type="secondary"
          color={currentTheme.primary}
          textColor={currentTheme.backgroundColor}
          borderColor={currentTheme.primary}
          style={styles.actionSpacing}
        />
        <ActionButton
          label="Kabul ediyorum"
          onPress={handleAccept}
          color={currentTheme.primary}
          textColor={currentTheme.backgroundColor}
          borderColor={currentTheme.primary}
          style={styles.actionSpacing}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    flex: 1,
  },
  descriptionContainer: {
    flex: 1,       // maxHeight: 260 yerine
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionSpacing: {
    marginHorizontal: 6,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalBody: {
    marginBottom: 16,
  },
});

export default PrivacyScreen;
export { PRIVACY_KEY };
