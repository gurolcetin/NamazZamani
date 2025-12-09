import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  DhikrTabKeys,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
  StringConstants,
} from '../../../common/constants';
import { FontScaleOption } from '../../../common/enums';
import {
  CardView,
  CircleProgressBar,
  CustomModal,
  FormControl,
  Icon,
  Icons,
} from '../../../components';
import styles from './style';
import {
  addDhikr,
  deleteDhikrByDhikrId,
  resetDhikrByItem,
  updateDhikr,
} from '../../../redux/reducers/Dhikr';
import {
  getDhikrProgress,
  getFontScaleMultiplier,
  hapticFeedback,
} from '../../helpers';
import { ScrollView } from 'react-native-gesture-handler';
import {
  isNullOrEmptyString,
  isNullOrUndefined,
  isNumber,
} from 'typescript-util-functions';
import { useTheme } from '../../providers';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../redux/store';

type DhikrFormFields = {
  dhikrName: string;
  dhikrCount: number;
};

type RadioButtonItem = {
  value: string;
  label: string;
};

const AllDhikr = () => {
  const { control, handleSubmit, reset } = useForm<DhikrFormFields>({
    defaultValues: {
      dhikrName: StringConstants.EMPTY_STRING,
      dhikrCount: 33,
    },
  });

  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const { currentTheme } = useTheme();
  const { height } = useWindowDimensions();

  const allDhikrList = useSelector((state: RootState) =>
    state.dhikr.dhikrs.find((x: { id: number }) => x.id === DhikrTabKeys.All),
  );

  const [value, setValue] = useState('');
  const [radioButtonList, setRadioButtonList] = useState<RadioButtonItem[]>([]);

  const no = t(GeneralLanguageConstants.No.key);
  const yes = t(GeneralLanguageConstants.Yes.key);
  const resetText = t('Dhikr.reset');
  const saveText = t(GeneralLanguageConstants.Save.key);
  const requiredMessage = t(GeneralLanguageConstants.RequiredMessage.key);
  const emptyStateTitle = t('Dhikr.emptyStateTitle');
  const emptyStateDescription = t('Dhikr.emptyStateDescription');
  const addDhikrButtonLabel = t('Dhikr.addDhikrButton');
  const newDhikrTitle = t('Dhikr.newDhikrTitle');
  const closeLabel = t('common.close');
  const dhikrNamePlaceholder = t('Dhikr.namePlaceholder');
  const dhikrCountPlaceholder = t('Dhikr.countPlaceholder');
  const dhikrCountValidation = t('Dhikr.countValidation');
  const deleteConfirmation = t('Dhikr.deleteConfirmation');
  const deleteLabel = t('Dhikr.delete');

  const applicationTheme = useSelector(
    (state: RootState) => state.applicationTheme,
  );
  const fontScalePreference = useSelector(
    (state: RootState) =>
      state.applicationSettings?.fontScale ?? FontScaleOption.MEDIUM,
  );
  const fontScaleMultiplier = getFontScaleMultiplier(fontScalePreference);
  const scaledFont = (size: number) => size * fontScaleMultiplier;
  const isCompactHeight = height < 740;
  const baseCircleSize = useMemo(() => {
    const minSize = 130;
    const maxSize = 200;
    const computedSize = height * 0.16;

    return Math.max(minSize, Math.min(maxSize, computedSize));
  }, [height]);
  const circleSize = useMemo(
    () => baseCircleSize * fontScaleMultiplier,
    [baseCircleSize, fontScaleMultiplier],
  );

  useEffect(() => {
    if (
      allDhikrList &&
      !isNullOrUndefined(allDhikrList) &&
      !isNullOrUndefined(allDhikrList.dhikrList) &&
      allDhikrList.dhikrList.length > 0
    ) {
      const mappedList: RadioButtonItem[] = allDhikrList.dhikrList.map(
        (item: {
          dhikrId: number;
          name: string;
          count: number;
          maxCount: number;
        }) => ({
          value: item.dhikrId.toString(),
          label: item.name,
        }),
      );

      setRadioButtonList(mappedList);

      // 🔥 Seçili olanı koru, gerekirse fallback yap
      setValue(prevValue => {
        if (!prevValue) {
          // İlk açılışta veya tamamen boşken
          return mappedList[0].value;
        }

        const stillExists = mappedList.some(x => x.value === prevValue);
        if (stillExists) {
          // Aynı zikir hâlâ listede → seçimi koru
          return prevValue;
        }

        // Seçili zikir artık yoksa → ilk elemana geç
        return mappedList[0].value;
      });
    } else {
      setRadioButtonList([]);
      setValue('');
    }
  }, [allDhikrList]);

  const showAddDhikrModal = () => {
    setVisible(true);
  };

  const onSubmit = (data: DhikrFormFields) => {
    const maxCount = Number(data.dhikrCount) || 0;

    dispatch(
      addDhikr({
        id: DhikrTabKeys.All,
        name: data.dhikrName,
        maxCount,
      }),
    );
    setVisible(false);
    reset({
      dhikrName: StringConstants.EMPTY_STRING,
      dhikrCount: 33,
    });
  };

  return (
    <>
      {radioButtonList.length > 0 && (
        <View>
          <View
            style={[styles.radioRow, isCompactHeight && styles.radioRowCompact]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.radioScrollContent}
            >
              {radioButtonList.map(item => {
                const isSelected = value === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => {
                      setValue(item.value);
                      hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
                    }}
                    style={[
                      styles.dhikrChip,
                      {
                        backgroundColor: isSelected
                          ? currentTheme.primary
                          : currentTheme.cardViewBackgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dhikrChipText,
                        {
                          color: isSelected
                            ? currentTheme.white
                            : currentTheme.textColor,
                          fontSize: scaledFont(16),
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => {
                hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
                showAddDhikrModal();
              }}
              style={({ pressed }) => [
                styles.dhikrAddFabNeo,
                {
                  backgroundColor: currentTheme.primary,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Icon
                type={Icons.FontAwesome6}
                name="plus"
                size={18}
                color={currentTheme.white}
                solid
              />
            </Pressable>
          </View>

          {allDhikrList?.dhikrList?.map(
            (item: {
              dhikrId: number;
              name: string;
              count: number;
              maxCount: number;
              isCyclical: boolean;
            }) => {
              return (
                value === item.dhikrId.toString() && (
                  <View key={item.dhikrId + 'container'}>
                    <CardView
                      key={item.dhikrId + 'card'}
                      cardStyle={[
                        styles.containerSingleDhikr,
                        isCompactHeight && styles.containerSingleDhikrCompact,
                      ]}
                      paddingLeft={0}
                      shadow
                    >
                      <CircleProgressBar
                        key={item.dhikrId}
                        progress={getDhikrProgress(item.count, item.maxCount)}
                        size={circleSize}
                        count={item.count}
                        maxCount={item.maxCount}
                        isCyclical={item.isCyclical}
                        incraseValue={() => {
                          dispatch(
                            updateDhikr({
                              id: DhikrTabKeys.All,
                              dhikrId: item.dhikrId,
                            }),
                          );
                        }}
                      />
                    </CardView>
                    <View
                      key={item.dhikrId + 'buttons'}
                      style={[
                        styles.dhikrActionRow,
                        isCompactHeight && styles.dhikrActionRowCompact,
                      ]}
                    >
                      <Pressable
                        key={item.dhikrId + 'buttonRemove'}
                        style={[
                          styles.deleteResetButtonStyle,
                          isCompactHeight && styles.deleteResetButtonCompact,
                          {
                            backgroundColor:
                              currentTheme.cardViewBackgroundColor,
                            borderColor: currentTheme.primary,
                          },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            deleteConfirmation,
                            '',
                            [
                              {
                                text: no,
                                onPress: () => {},
                                style: 'cancel',
                              },
                              {
                                text: yes,
                                onPress: () => {
                                  dispatch(
                                    deleteDhikrByDhikrId({
                                      id: DhikrTabKeys.All,
                                      dhikrId: item.dhikrId,
                                    }),
                                  );
                                  hapticFeedback(
                                    HapticFeedbackMethods.ImpactHeavy,
                                  );
                                },
                              },
                            ],
                            { userInterfaceStyle: applicationTheme.theme },
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.deleteResetButtonText,
                            {
                              color: currentTheme.textColor,
                              fontSize: scaledFont(16),
                            },
                          ]}
                        >
                          {deleteLabel}
                        </Text>
                      </Pressable>

                      <Pressable
                        key={item.dhikrId + 'buttonReset'}
                        style={[
                          styles.deleteResetButtonStyle,
                          isCompactHeight && styles.deleteResetButtonCompact,
                          {
                            backgroundColor: currentTheme.primary,
                            borderColor: currentTheme.primary,
                          },
                        ]}
                        onPress={() => {
                          dispatch(resetDhikrByItem({ dhikrId: item.dhikrId }));
                          hapticFeedback(HapticFeedbackMethods.ImpactHeavy);
                        }}
                      >
                        <Text
                          style={[
                            styles.deleteResetButtonText,
                            {
                              color: currentTheme.white,
                              fontSize: scaledFont(16),
                            },
                          ]}
                        >
                          {resetText}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )
              );
            },
          )}
        </View>
      )}

      {radioButtonList.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <CardView
            cardStyle={[
              styles.emptyStateCard,
              { backgroundColor: currentTheme.cardViewBackgroundColor },
            ]}
            shadow
          >
            <Text
              style={[
                styles.emptyStateTitle,
                {
                  color: currentTheme.textColor,
                  fontSize: scaledFont(18),
                },
              ]}
            >
              {emptyStateTitle}
            </Text>

            <Text
              style={[
                styles.emptyStateDescription,
                {
                  color: currentTheme.gray,
                  fontSize: scaledFont(14),
                },
              ]}
            >
              {emptyStateDescription}
            </Text>

            <Pressable
              style={[
                styles.emptyStateButton,
                { backgroundColor: currentTheme.primary },
              ]}
              onPress={showAddDhikrModal}
            >
              <Text
                style={[
                  styles.emptyStateButtonText,
                  { fontSize: scaledFont(16) },
                ]}
              >
                {addDhikrButtonLabel}
              </Text>
            </Pressable>
          </CardView>
        </View>
      )}

      <CustomModal
        visible={visible}
        title={newDhikrTitle}
        onClose={() => {
          setVisible(false);
          reset({
            dhikrName: StringConstants.EMPTY_STRING,
            dhikrCount: 33,
          });
        }}
        buttons={[
          {
            title: closeLabel,
            onPress: () => {
              setVisible(false);
              reset({
                dhikrName: StringConstants.EMPTY_STRING,
                dhikrCount: 33,
              });
            },
            type: 'cancel',
          },
          {
            title: saveText,
            onPress: handleSubmit(onSubmit),
          },
        ]}
      >
        <>
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage={requiredMessage}
            control={control}
            name="dhikrName"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  style={[
                    styles.smallInput,
                    styles.inputFlex,
                    {
                      backgroundColor: currentTheme.inputBackgroundColor,
                      color: currentTheme.textColor,
                      fontSize: scaledFont(16),
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    onChange(val);
                  }}
                  value={(value ?? StringConstants.EMPTY_STRING).toString()}
                  keyboardType="default"
                  placeholder={dhikrNamePlaceholder}
                  placeholderTextColor={currentTheme.gray}
                  autoComplete="off"
                />
              </>
            )}
          />
          <View style={styles.formSpacer} />
          <FormControl
            rules={{
              required: true,
              validate: value => {
                if (value && (value > 99999 || value <= 0)) {
                  return false;
                }
                return true;
              },
            }}
            validateMessage={dhikrCountValidation}
            requiredMessage={requiredMessage}
            control={control}
            name="dhikrCount"
            defaultValue={33 as any}
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  style={[
                    styles.smallInput,
                    styles.inputFlex,
                    {
                      backgroundColor: currentTheme.inputBackgroundColor,
                      color: currentTheme.textColor,
                      fontSize: scaledFont(16),
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    if (isNullOrEmptyString(val) || isNumber(val)) {
                      if (Number(val) > 99999) {
                        return onChange(99999 as any);
                      } else {
                        onChange(val as any);
                      }
                    }
                  }}
                  value={(value ?? StringConstants.EMPTY_STRING).toString()}
                  keyboardType="numeric"
                  placeholder={dhikrCountPlaceholder}
                  placeholderTextColor={currentTheme.gray}
                  autoComplete="off"
                />
              </>
            )}
          />
        </>
      </CustomModal>
    </>
  );
};

export default AllDhikr;
