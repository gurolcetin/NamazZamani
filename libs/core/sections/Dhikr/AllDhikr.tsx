import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  DhikrTabKeys,
  GeneralLanguageConstants,
  HapticFeedbackMethods,
  StringConstants,
} from '../../../common/constants';
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
import { Translate, getDhikrProgress, hapticFeedback } from '../../helpers';
import { ScrollView } from 'react-native-gesture-handler';
import {
  isNullOrEmptyString,
  isNullOrUndefined,
  isNumber,
} from 'typescript-util-functions';
import { useTheme } from '../../providers';
import { useForm } from 'react-hook-form';

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

  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const { currentTheme } = useTheme();

  const allDhikrList = useSelector((state: any) =>
    state.dhikr.dhikrs.find((x: { id: number }) => x.id === DhikrTabKeys.All),
  );

  const [value, setValue] = useState('');
  const [radioButtonList, setRadioButtonList] = useState<RadioButtonItem[]>([]);

  const no = Translate(GeneralLanguageConstants.No);
  const yes = Translate(GeneralLanguageConstants.Yes);
  const resetText = Translate(GeneralLanguageConstants.Reset);

  const applicationTheme = useSelector((state: any) => state.applicationTheme);

  useEffect(() => {
    if (
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
        }) => {
          return {
            value: item.dhikrId.toString(),
            label: item.name,
          };
        },
      );
      setRadioButtonList(mappedList);
      setValue(mappedList[0].value);
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
          <View style={styles.radioRow}>
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
                      cardStyle={styles.containerSingleDhikr}
                      paddingLeft={0}
                      shadow
                    >
                      <CircleProgressBar
                        key={item.dhikrId}
                        progress={getDhikrProgress(item.count, item.maxCount)}
                        size={150}
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
                      style={styles.dhikrActionRow}
                    >
                      <Pressable
                        key={item.dhikrId + 'buttonRemove'}
                        style={[
                          styles.deleteResetButtonStyle,
                          {
                            backgroundColor:
                              currentTheme.cardViewBackgroundColor,
                            borderColor: currentTheme.primary,
                          },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            'Zikri silmek istediğinize emin misiniz?',
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
                            { color: currentTheme.textColor },
                          ]}
                        >
                          SİL
                        </Text>
                      </Pressable>

                      <Pressable
                        key={item.dhikrId + 'buttonReset'}
                        style={[
                          styles.deleteResetButtonStyle,
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
                            { color: currentTheme.white },
                          ]}
                        >
                          {resetText.toLocaleUpperCase()}
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
                { color: currentTheme.textColor },
              ]}
            >
              Henüz özel bir zikriniz bulunmuyor.
            </Text>

            <Text
              style={[
                styles.emptyStateDescription,
                { color: currentTheme.gray },
              ]}
            >
              Sık tekrar ettiğiniz zikirleri buraya ekleyerek kolayca takip
              edebilirsiniz. Başlamak için aşağıdaki butona dokunarak ilk
              zikrinizi oluşturun.
            </Text>

            <Pressable
              style={[
                styles.emptyStateButton,
                { backgroundColor: currentTheme.primary },
              ]}
              onPress={showAddDhikrModal}
            >
              <Text style={styles.emptyStateButtonText}>Zikir Ekle</Text>
            </Pressable>
          </CardView>
        </View>
      )}

      <CustomModal
        visible={visible}
        title={'Yeni Zikir Kaydı'}
        onClose={() => {
          setVisible(false);
          reset({
            dhikrName: StringConstants.EMPTY_STRING,
            dhikrCount: 33,
          });
        }}
        buttons={[
          {
            title: 'Kapat',
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
            title: 'Kaydet',
            onPress: handleSubmit(onSubmit),
          },
        ]}
      >
        <>
          <FormControl
            rules={{
              required: true,
            }}
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
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
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={val => {
                    onChange(val);
                  }}
                  value={(value ?? StringConstants.EMPTY_STRING).toString()}
                  keyboardType="default"
                  placeholder="Çekilecek zikir adı"
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
            validateMessage="Zikir döngü sayısı 0 ile 99999 arasında olmalıdır."
            requiredMessage={Translate(
              GeneralLanguageConstants.RequiredMessage,
            )}
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
                  placeholder="Zikir döngü sayısı"
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
