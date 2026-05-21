import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  //   TextInput,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme, useBanner } from '../../../libs/core/providers';
import {
  BottomTabScreenViewContainer,
  Icon,
  SafeAreaWithStatusBar,
} from '../../../libs/components';
import { Icons } from '../../../libs/components/Icons/Icons';
import { ToolsRoutes } from '../../navigation/Routes';
import { RootState } from '../../../libs/redux/store';
import { FontScaleOption } from '../../../libs/common/enums';
import { getFontScaleMultiplier } from '../../../libs/core/helpers';

// ─── Feature definitions ──────────────────────────────────────────────────────

type Feature = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  gradientStart: string;
  gradientEnd: string;
  route: string | null;
  categories: string[];
  available: boolean;
};

const FEATURES: Feature[] = [
  {
    id: 'missedTracking',
    titleKey: 'toolsHub.missedTrackingTitle',
    descriptionKey: 'toolsHub.missedTrackingDescription',
    icon: 'calculator-variant-outline',
    gradientStart: '#1BB89D',
    gradientEnd: '#0A7A69',
    route: ToolsRoutes.MissedTracking,
    categories: ['all', 'prayer', 'fasting', 'tracking'],
    available: true,
  },
  {
    id: 'dhikr',
    titleKey: 'toolsHub.dhikrTitle',
    descriptionKey: 'toolsHub.dhikrDescription',
    icon: 'counter',
    gradientStart: '#7B61FF',
    gradientEnd: '#4D38C2',
    route: ToolsRoutes.Dhikr,
    categories: ['all', 'dhikr'],
    available: true,
  },
  {
    id: 'monthlyCalendar',
    titleKey: 'toolsHub.monthlyCalendarTitle',
    descriptionKey: 'toolsHub.monthlyCalendarDescription',
    icon: 'calendar-month-outline',
    gradientStart: '#FFB340',
    gradientEnd: '#CC8200',
    route: ToolsRoutes.MontlyCalendar,
    categories: ['all', 'prayer', 'other'],
    available: true,
  },
  {
    id: 'imsakiye',
    titleKey: 'toolsHub.imsakiyeTitle',
    descriptionKey: 'toolsHub.imsakiyeDescription',
    icon: 'table-clock',
    gradientStart: '#FF6B35',
    gradientEnd: '#CC3300',
    route: ToolsRoutes.Imsakiye,
    categories: ['all', 'fasting', 'other'],
    available: true,
  },
  {
    id: 'qibla',
    titleKey: 'toolsHub.qiblaTitle',
    descriptionKey: 'toolsHub.qiblaDescription',
    icon: 'compass-outline',
    gradientStart: '#0A84FF',
    gradientEnd: '#0055CC',
    route: ToolsRoutes.Qibla,
    categories: ['all', 'other'],
    available: true,
  },
  //   {
  //     id: 'tasbih',
  //     titleKey: 'toolsHub.tasbihTitle',
  //     descriptionKey: 'toolsHub.tasbihDescription',
  //     icon: 'circle-slice-8',
  //     gradientStart: '#FF9500',
  //     gradientEnd: '#CC7700',
  //     route: null,
  //     categories: ['all', 'dhikr'],
  //     available: false,
  //   },
  //   {
  //     id: 'calc',
  //     titleKey: 'toolsHub.calcTitle',
  //     descriptionKey: 'toolsHub.calcDescription',
  //     icon: 'calculator',
  //     gradientStart: '#34C759',
  //     gradientEnd: '#1A8C33',
  //     route: null,
  //     categories: ['all', 'other'],
  //     available: false,
  //   },
];

// const SHORTCUT_FEATURES = FEATURES.slice(0, 3);

// const CATEGORIES = [
//   { key: 'all', labelKey: 'toolsHub.categoryAll' },
//   { key: 'prayer', labelKey: 'toolsHub.categoryPrayer' },
//   { key: 'fasting', labelKey: 'toolsHub.categoryFasting' },
//   { key: 'dhikr', labelKey: 'toolsHub.categoryDhikr' },
//   { key: 'tracking', labelKey: 'toolsHub.categoryTracking' },
//   { key: 'other', labelKey: 'toolsHub.categoryOther' },
// ];

// ─── Sub-components ────────────────────────────────────────────────────────────

// interface ShortcutCardProps {
//   title: string;
//   icon: string;
//   gradientStart: string;
//   gradientEnd: string;
//   onPress: () => void;
//   fontScaleMultiplier: number;
// }

// const ShortcutCard: React.FC<ShortcutCardProps> = ({
//   title,
//   icon,
//   gradientStart,
//   gradientEnd,
//   onPress,
//   fontScaleMultiplier,
// }) => (
//   <Pressable
//     onPress={onPress}
//     style={({ pressed }) => [styles.shortcutWrapper, pressed && styles.pressed]}
//   >
//     <LinearGradient
//       colors={[gradientStart, gradientEnd]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={styles.shortcutGradient}
//     >
//       <Icon
//         type={Icons.MaterialDesignIcons}
//         name={icon}
//         size={28}
//         color="rgba(255,255,255,0.95)"
//       />
//     </LinearGradient>
//     <Text
//       style={[styles.shortcutLabel, { fontSize: 11 * fontScaleMultiplier }]}
//       numberOfLines={2}
//     >
//       {title}
//     </Text>
//   </Pressable>
// );

// interface AddShortcutCardProps {
//   label: string;
//   fontScaleMultiplier: number;
//   bgColor: string;
//   borderColor: string;
//   textColor: string;
// }

// const AddShortcutCard: React.FC<AddShortcutCardProps> = ({
//   label,
//   fontScaleMultiplier,
//   bgColor,
//   borderColor,
//   textColor,
// }) => (
//   <View style={styles.shortcutWrapperCentered}>
//     <View
//       style={[
//         styles.shortcutGradient,
//         styles.addCardBox,
//         { backgroundColor: bgColor, borderColor },
//       ]}
//     >
//       <Icon
//         type={Icons.MaterialDesignIcons}
//         name="plus"
//         size={24}
//         color={textColor}
//       />
//     </View>
//     <Text
//       style={[
//         styles.shortcutLabel,
//         { fontSize: 11 * fontScaleMultiplier, color: textColor },
//       ]}
//       numberOfLines={2}
//     >
//       {label}
//     </Text>
//   </View>
// );

interface FeatureRowProps {
  title: string;
  description: string;
  icon: string;
  gradientStart: string;
  gradientEnd: string;
  available: boolean;
  isLast: boolean;
  onPress: () => void;
  fontScaleMultiplier: number;
  comingSoonLabel: string;
  dividerColor: string;
  textColor: string;
}

const FeatureRow: React.FC<FeatureRowProps> = ({
  title,
  description,
  icon,
  gradientStart,
  gradientEnd,
  available,
  isLast,
  onPress,
  fontScaleMultiplier,
  comingSoonLabel,
  dividerColor,
  textColor,
}) => (
  <>
    <Pressable
      onPress={available ? onPress : undefined}
      style={({ pressed }) => [
        styles.featureRow,
        pressed && available && styles.pressed,
        !available && styles.featureRowDisabled,
      ]}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureIconBadge}
      >
        <Icon
          type={Icons.MaterialDesignIcons}
          name={icon}
          size={22}
          color="rgba(255,255,255,0.95)"
        />
      </LinearGradient>

      <View style={styles.featureTextContainer}>
        <Text
          style={[
            styles.featureTitle,
            { fontSize: 15 * fontScaleMultiplier, color: textColor },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.featureDescription,
            { fontSize: 12 * fontScaleMultiplier },
          ]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {available ? (
        <Icon
          type={Icons.MaterialDesignIcons}
          name="chevron-right"
          size={20}
          color="#C0C0C8"
        />
      ) : (
        <Text
          style={[
            styles.comingSoonBadge,
            { fontSize: 10 * fontScaleMultiplier },
          ]}
        >
          {comingSoonLabel}
        </Text>
      )}
    </Pressable>
    {!isLast && (
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
    )}
  </>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ToolsHub = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const { bannerLoaded } = useBanner();

  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = useMemo(
    () => getFontScaleMultiplier(fontScalePreference),
    [fontScalePreference],
  );

  const [searchText] = useState('');
  const [selectedCategory] = useState('all');

  const dynamicBottomPadding = useMemo(
    () =>
      tabBarHeight +
      (bannerLoaded
        ? Platform.OS === 'ios'
          ? 70
          : 80
        : Platform.OS === 'ios'
        ? 30
        : 40),
    [tabBarHeight, bannerLoaded],
  );

  const filteredFeatures = useMemo(() => {
    return FEATURES.filter(f => {
      if (!f.categories.includes(selectedCategory)) {
        return false;
      }
      if (!searchText.trim()) {
        return true;
      }
      const query = searchText.toLowerCase();
      return (
        t(f.titleKey).toLowerCase().includes(query) ||
        t(f.descriptionKey).toLowerCase().includes(query)
      );
    });
  }, [selectedCategory, searchText, t]);

  return (
    <SafeAreaWithStatusBar>
      <BottomTabScreenViewContainer>
        <View
          style={[
            styles.container,
            { backgroundColor: currentTheme.backgroundColor },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: dynamicBottomPadding },
            ]}
          >
            {/* ── Header ── */}
            <View style={styles.headerRow}>
              <View style={styles.headerTextBlock}>
                <Text
                  style={[
                    styles.headerTitle,
                    {
                      color: currentTheme.textColor,
                      fontSize: 28 * fontScaleMultiplier,
                    },
                  ]}
                >
                  {t('toolsHub.headerTitle')}
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    {
                      color: currentTheme.placeholderTextColor,
                      fontSize: 13 * fontScaleMultiplier,
                    },
                  ]}
                >
                  {t('toolsHub.headerSubtitle')}
                </Text>
              </View>
            </View>

            {/* ── Search bar ── */}
            {/* <View
              style={[
                styles.searchBar,
                { backgroundColor: currentTheme.inputBackgroundColor },
              ]}
            >
              <Icon
                type={Icons.MaterialDesignIcons}
                name="magnify"
                size={20}
                color={currentTheme.placeholderTextColor}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: currentTheme.textColor,
                    fontSize: 14 * fontScaleMultiplier,
                  },
                ]}
                placeholder={t('toolsHub.searchPlaceholder')}
                placeholderTextColor={currentTheme.placeholderTextColor}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              <Icon
                type={Icons.MaterialDesignIcons}
                name="tune-variant"
                size={20}
                color={currentTheme.placeholderTextColor}
              />
            </View> */}

            {/* ── Favoriler ── */}
            {/* <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: currentTheme.textColor,
                      fontSize: 15 * fontScaleMultiplier,
                    },
                  ]}
                >
                  {t('toolsHub.favoritesTitle')}
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    {
                      color: currentTheme.placeholderTextColor,
                      fontSize: 11 * fontScaleMultiplier,
                    },
                  ]}
                >
                  {t('toolsHub.favoritesSubtitle')}
                </Text>
              </View>
              <Text
                style={[
                  styles.editButton,
                  {
                    color: currentTheme.primary,
                    fontSize: 13 * fontScaleMultiplier,
                  },
                ]}
              >
                {t('toolsHub.editButton')}
              </Text>
            </View> */}

            {/* <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shortcutsScroll}
            >
              {SHORTCUT_FEATURES.map(f => (
                <ShortcutCard
                  key={f.id}
                  title={t(f.titleKey)}
                  icon={f.icon}
                  gradientStart={f.gradientStart}
                  gradientEnd={f.gradientEnd}
                  onPress={() => f.route && navigation.navigate(f.route)}
                  fontScaleMultiplier={fontScaleMultiplier}
                />
              ))}
              <AddShortcutCard
                label={t('toolsHub.addButton')}
                fontScaleMultiplier={fontScaleMultiplier}
                bgColor={currentTheme.inputBackgroundColor}
                borderColor={currentTheme.bottomTabBorderTopColor}
                textColor={currentTheme.placeholderTextColor}
              />
            </ScrollView> */}

            {/* ── Category tabs ── */}
            {/* <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => setSelectedCategory(cat.key)}
                    style={styles.tabItem}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        isActive
                          ? styles.tabLabelActive
                          : styles.tabLabelInactive,
                        {
                          color: isActive
                            ? currentTheme.textColor
                            : currentTheme.placeholderTextColor,
                          fontSize: 14 * fontScaleMultiplier,
                        },
                      ]}
                    >
                      {t(cat.labelKey)}
                    </Text>
                    {isActive && (
                      <View
                        style={[
                          styles.tabIndicator,
                          { backgroundColor: currentTheme.primary },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView> */}

            {/* ── Feature list ── */}
            <View
              style={[
                styles.featureListCard,
                {
                  backgroundColor: currentTheme.cardViewBackgroundColor,
                  shadowColor: currentTheme.shadowColor,
                },
              ]}
            >
              {filteredFeatures.map((feature, index) => (
                <FeatureRow
                  key={feature.id}
                  title={t(feature.titleKey)}
                  description={t(feature.descriptionKey)}
                  icon={feature.icon}
                  gradientStart={feature.gradientStart}
                  gradientEnd={feature.gradientEnd}
                  available={feature.available}
                  isLast={index === filteredFeatures.length - 1}
                  onPress={() =>
                    feature.route && navigation.navigate(feature.route)
                  }
                  fontScaleMultiplier={fontScaleMultiplier}
                  comingSoonLabel={t('toolsHub.comingSoon')}
                  dividerColor={currentTheme.bottomTabBorderTopColor}
                  textColor={currentTheme.textColor}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </BottomTabScreenViewContainer>
    </SafeAreaWithStatusBar>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const SHORTCUT_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    lineHeight: 18,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 10,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    lineHeight: 16,
  },
  editButton: {
    fontWeight: '600',
  },

  // Shortcuts horizontal scroll
  shortcutsScroll: {
    paddingRight: 4,
    gap: 12,
    marginBottom: 28,
  },
  shortcutWrapper: {
    alignItems: 'center',
    width: SHORTCUT_SIZE,
  },
  shortcutWrapperCentered: {
    alignItems: 'center',
    width: SHORTCUT_SIZE,
  },
  shortcutGradient: {
    width: SHORTCUT_SIZE,
    height: SHORTCUT_SIZE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addCardBox: {
    borderWidth: 1.5,
  },
  shortcutLabel: {
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 15,
    color: '#888',
  },

  // Category tabs
  tabsScroll: {
    paddingRight: 4,
    marginBottom: 16,
  },
  tabItem: {
    paddingHorizontal: 2,
    paddingBottom: 6,
    marginRight: 18,
    alignItems: 'center',
  },
  tabLabel: {
    marginBottom: 5,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  tabLabelInactive: {
    fontWeight: '500',
  },
  tabIndicator: {
    height: 2.5,
    width: '100%',
    borderRadius: 2,
  },

  // Feature list card
  featureListCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  featureRowDisabled: {
    opacity: 0.6,
  },
  featureIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    color: '#888',
    lineHeight: 17,
  },
  comingSoonBadge: {
    color: '#999',
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 74,
  },

  // Shared
  pressed: {
    opacity: 0.75,
  },
});

export default ToolsHub;
